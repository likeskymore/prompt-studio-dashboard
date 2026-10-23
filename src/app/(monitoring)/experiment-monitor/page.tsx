/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useMemo, useState } from "react";
import type { EChartsOption } from "echarts";
import ReactECharts from "echarts-for-react";
import Container from "@/components/container";
import { Button } from "@/components/ui/button";
import { ExperimentRunMetadata, ExperimentRunSample, ExperimentRunState, Llm } from "@/features/experiment/models/ExperimentModels";
import { MetricCard } from "./components/MetricCard";
import { PerformanceLineChart } from "./components/PerformanceLineChart";
import { ChartPanel } from "./components/ChartPanel";
import { calculateActiveElapsedSeconds, formatDate, formatDuration, formatNumber, pickStrings } from "@/lib/utils";
import { calculateCurrentRequestThroughput, calculatePeakRequestThroughput, getExperimentRunStateDisplayName, getExperimentRunStateKey, getRequestsPerMinuteHistory, getStatusTone, getTokensPerMinuteHistory, getTokensPerRequestHistory, inferExperimentRunStateStatus } from "@/lib/monitoringUtils";
import { Loader2, Pause, Play, RefreshCw } from "lucide-react";

export default function ExperimentMonitor() {
  const [experimentRunStates, setExperimentRunStates] = useState<ExperimentRunMetadata[]>([]);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<ExperimentRunState | null>(null);
  const [snapshotRunId, setSnapshotRunId] = useState<string | null>(null);
  const [connectionState, setConnectionState] = useState<"idle" | "connecting" | "connected" | "error">("idle");
  const [connectionRunId, setConnectionRunId] = useState<string | null>(null);
  const [streamEvent, setStreamEvent] = useState("snapshot");
  const [streamEventRunId, setStreamEventRunId] = useState<string | null>(null);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [streamErrorRunId, setStreamErrorRunId] = useState<string | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);
  const [lastUpdatedAtRunId, setLastUpdatedAtRunId] = useState<string | null>(null);
  const [currentExperimentLlms, setCurrentExperimentLlms] = useState<Llm[]>([]);
  const [now, setNow] = useState(() => Date.now());
  const [selectedExperimentRunState, setSelectedExperimentRunState] = useState<ExperimentRunState | null>(null);
  const [runAction, setRunAction] = useState<"pause" | "resume" | null>(null);
  const [isRefreshingExperimentStatesList, setIsRefreshingExperimentStatesList] = useState(false);
  const [runActionError, setRunActionError] = useState<string | null>(null);

  const selectedStatus = selectedExperimentRunState ? inferExperimentRunStateStatus(selectedExperimentRunState) : "idle";
  const statusTone = getStatusTone(selectedStatus);
  const isLiveSelection = selectedRunId !== null && selectedStatus === "running";
  const activeSnapshot = isLiveSelection && selectedRunId !== null && snapshotRunId === selectedRunId ? snapshot : null;
  const currentRecord = (activeSnapshot ?? selectedExperimentRunState ?? {}) as Record<string, any>;
  const displayConnectionState =
    selectedRunId === null
      ? "idle"
      : isLiveSelection
        ? connectionRunId === selectedRunId
          ? connectionState
          : "connecting"
        : selectedStatus;
  const displayStreamEvent =
    selectedRunId !== null && streamEventRunId === selectedRunId ? streamEvent : "snapshot";
  const displayStreamError =
    selectedRunId !== null && streamErrorRunId === selectedRunId ? streamError : null;
  const displayLastUpdatedAt =
    selectedRunId !== null && lastUpdatedAtRunId === selectedRunId ? lastUpdatedAt : null;

  const syncExperimentRunStates = async (signal?: AbortSignal) => {
    try {
      const response = await fetch("/api/experiments/states", {
        signal,
      });

      if (!response.ok) {
        throw new Error("Failed to fetch experiment states");
      }

      const data = await response.json();

      const nextExperimentRunStates: ExperimentRunMetadata[] =
        data.experiment_states ?? [];

      setExperimentRunStates(nextExperimentRunStates);

      setSelectedRunId((currentRunId) => {
        if (
          currentRunId !== null &&
          nextExperimentRunStates.some(
            (experimentRunState) =>
              getExperimentRunStateKey(experimentRunState) === currentRunId,
          )
        ) {
          return currentRunId;
        }

        const liveExperimentRunState =
          nextExperimentRunStates.find(
            (experimentRunState) =>
              inferExperimentRunStateStatus(experimentRunState) === "running",
          );

        return liveExperimentRunState
          ? getExperimentRunStateKey(liveExperimentRunState)
          : nextExperimentRunStates[0]?.run_id ?? null;
      });
    } catch (error) {
      // Don't report an intentional cancellation as an error
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }

      console.error("Failed to fetch experiment states:", error);
    }
  };

  useEffect(() => {
    if (selectedRunId === null) {
      return;
    }

    const controller = new AbortController();

    const loadExperimentRunState = async () => {
      try {
        const response = await fetch(
          `/api/experiment-run/${selectedRunId}/state`,
          {
            signal: controller.signal,
          },
        );

        if (!response.ok) {
          throw new Error("Failed to fetch experiment run state");
        }

        const data = await response.json();

        setSelectedExperimentRunState(data.experiment_state ?? null);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        console.error("Failed to fetch experiment run state:", error);
      }
    };

    void loadExperimentRunState();

    return () => {
      controller.abort();
    };
  }, [selectedRunId]);

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchExperimentModels = async () => {
      const experimentId = selectedExperimentRunState?.experiment_id;

      if (!experimentId) {
        setCurrentExperimentLlms([]);
        return;
      }

      try {
        const response = await fetch(
          `/api/experiment/${encodeURIComponent(experimentId.toString())}/models`,
        );

        if (!response.ok) {
          throw new Error("Failed to fetch experiment models");
        }

        const data = await response.json();

        setCurrentExperimentLlms(data.models ?? []);
      } catch (error) {
        console.error("Failed to fetch experiment models:", error);
        setCurrentExperimentLlms([]);
      }
    };

    void fetchExperimentModels();
  }, [selectedExperimentRunState]);

  useEffect(() => {
    const controller = new AbortController();

    queueMicrotask(() => {
      if (!controller.signal.aborted) {
        void syncExperimentRunStates(controller.signal);
      }
    });

    return () => {
      controller.abort();
    };
  }, []);

  useEffect(() => {
    if (selectedRunId === null || !isLiveSelection) {
      return;
    }

    const controller = new AbortController();

    const connectToEvents = async () => {
      try {
        const response = await fetch(
          `/api/experiment-run/${selectedRunId}/events`,
          {
            signal: controller.signal,
            headers: {
              Accept: "text/event-stream",
            },
          },
        );

        if (!response.ok || !response.body) {
          throw new Error("Failed to connect to experiment events");
        }

        setConnectionState("connected");
        setConnectionRunId(selectedRunId);
        setStreamError(null);
        setStreamErrorRunId(null);

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        let buffer = "";

        while (!controller.signal.aborted) {
          const { done, value } = await reader.read();

          if (done) {
            break;
          }

          buffer += decoder.decode(value, { stream: true });

          const events = buffer.split("\n\n");
          buffer = events.pop() ?? "";

          for (const event of events) {
            const eventLine = event
              .split("\n")
              .find((line) => line.startsWith("event:"));

            const dataLine = event
              .split("\n")
              .find((line) => line.startsWith("data:"));

            if (eventLine) {
              setStreamEvent(
                eventLine.slice("event:".length).trim(),
              );
              setStreamEventRunId(selectedRunId);
            }

            if (dataLine) {
              const data = JSON.parse(
                dataLine.slice("data:".length).trim(),
              );

              if (data && typeof data === "object") {
                setSnapshot(data as ExperimentRunState);
                setSnapshotRunId(selectedRunId);
                setLastUpdatedAt(new Date().toISOString());
                setLastUpdatedAtRunId(selectedRunId);
              }
            }
          }
        }

        reader.releaseLock();
      } catch (error) {
        if ((error as Error).name === "AbortError") {
          return;
        }

        setConnectionState("error");
        setConnectionRunId(selectedRunId);
        setStreamError(
          error instanceof Error
            ? error.message
            : "Failed to connect to the live run stream.",
        );
        setStreamErrorRunId(selectedRunId);
      }
    };

    void connectToEvents();

    return () => {
      controller.abort();
    };
  }, [isLiveSelection, selectedRunId]);

  const handleRunAction = async (action: "pause" | "resume") => {
    if (selectedRunId === null || runAction !== null) {
      return;
    }

    setRunAction(action);
    setRunActionError(null);

    try {
      const response = await fetch(`/api/experiment-run/${selectedRunId}/${action}`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error(`Failed to ${action} experiment run`);
      }

      const nextStatus = action === "pause" ? "paused" : "running";
      const updatedAt = new Date().toISOString();

      setSelectedExperimentRunState((currentState) => {
        const nextState = activeSnapshot ?? currentState;

        return nextState
          ? {
            ...nextState,
            status: nextStatus,
            paused_at: action === "pause" ? updatedAt : nextState.paused_at,
            updated_at: updatedAt,
          }
          : currentState;
      });

      setExperimentRunStates((currentStates) =>
        currentStates.map((experimentRunState) =>
          experimentRunState.run_id === selectedRunId
            ? {
              ...experimentRunState,
              status: nextStatus,
              updated_at: updatedAt,
            }
            : experimentRunState,
        ),
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : `Failed to ${action} experiment run`;
      setRunActionError(message);
      console.error(`Failed to ${action} experiment run:`, error);
    } finally {
      setRunAction(null);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshingExperimentStatesList(true);

    try {
      await syncExperimentRunStates();
    } finally {
      setIsRefreshingExperimentStatesList(false);
    }
  };

  const experimentRunStateName = getExperimentRunStateDisplayName(activeSnapshot ?? selectedExperimentRunState);
  const status = statusTone.label;
  const tokensUsed = currentRecord["total_tokens"];
  const totalRequests = currentRecord["total_tasks"];
  const attemptedRequests = currentRecord["attempts"];
  const successfulRequests = currentRecord["completed"];
  const failedRequests = currentRecord["failed"];
  const retriedRequests = currentRecord["retries"];
  const errorMessages = [
    ...pickStrings(currentRecord["last_error"]),
  ];
  const progressPercent =
    attemptedRequests === undefined || !attemptedRequests
      ? 0
      : Math.max(0, Math.min(100, (attemptedRequests / totalRequests) * 100));
  const startedAt = currentRecord["started_at"];
  const pausedAt = currentRecord["paused_at"];
  const finishedAt = currentRecord["finished_at"];
  const updatedAt = currentRecord["updated_at"];
  const totalPausedMs = currentRecord["total_paused_ms"] ?? 0;
  const experimentSamples = currentRecord["samples"] as ExperimentRunSample[] | undefined;

  const elapsedEnd =
    finishedAt ??
    (isLiveSelection
      ? new Date(now).toISOString()
      : currentRecord["status"] === "paused"
        ? pausedAt ?? updatedAt
        : updatedAt);

  const elapsedSeconds = calculateActiveElapsedSeconds(
    startedAt,
    elapsedEnd,
    totalPausedMs,
    currentRecord["status"] === "paused"
      ? pausedAt
      : undefined,
  );
  const elapsedMinutes = elapsedSeconds / 60;

  const remainingRequests = Math.max(0, (totalRequests ?? 0) - (attemptedRequests ?? 0));

  const tokensPerRequest = attemptedRequests > 0 ? tokensUsed / attemptedRequests : 0;
  const requestsPerMinute = elapsedMinutes > 0 ? attemptedRequests / elapsedMinutes : 0;
  const tokensPerMinute = elapsedMinutes > 0 ? tokensUsed / elapsedMinutes : 0;

  const tokensPerRequestHistory =
    getTokensPerRequestHistory(experimentSamples ?? []);

  const requestsPerMinuteHistory =
    getRequestsPerMinuteHistory(experimentSamples ?? []);

  const tokensPerMinuteHistory =
    getTokensPerMinuteHistory(experimentSamples ?? []);

  const remainingTime =
    requestsPerMinute > 0
      ? remainingRequests / (requestsPerMinute / 60)
      : undefined

  const currentRequestThroughput = calculateCurrentRequestThroughput(experimentSamples ?? []);
  const peakRequestThroughput = calculatePeakRequestThroughput(experimentSamples ?? []);

  const totalLatencyMs = currentRecord["total_latency_ms"];
  const latencyCount = currentRecord["latency_count"];
  const p50LatencyMs = currentRecord["p50_latency_ms"];
  const p95LatencyMs = currentRecord["p95_latency_ms"];
  const p99LatencyMs = currentRecord["p99_latency_ms"];
  const averageLatencyMs = latencyCount > 0 ? totalLatencyMs / latencyCount : 0;
  const minLatencyMs = currentRecord["min_latency_ms"]
  const p25LatencyMs = currentRecord["p25_latency_ms"]
  const p75LatencyMs = currentRecord["p75_latency_ms"]
  const maxLatencyMs = currentRecord["max_latency_ms"]
  const latencyBoxPlotValues = [
    minLatencyMs,
    p25LatencyMs,
    p50LatencyMs,
    p75LatencyMs,
    maxLatencyMs,
  ];
  const hasLatencyBoxPlotValues = latencyBoxPlotValues.every(
    (value) => typeof value === "number" && Number.isFinite(value),
  );

  const latencyBoxPlotOption: EChartsOption = {
    backgroundColor: "transparent",
    tooltip: {
      trigger: "item",
      formatter: (params) => {
        const values = (params as { data?: number[] }).data;
        if (!values) {
          return "No latency samples";
        }

        // ECharts prepends the category index to box plot tooltip data.
        const boxPlotValues = values.length >= 6 ? values.slice(1) : values;

        return [
          "Request latency",
          `Minimum: ${formatNumber(boxPlotValues[0], 0)} ms`,
          `P25: ${formatNumber(boxPlotValues[1], 0)} ms`,
          `Median: ${formatNumber(boxPlotValues[2], 0)} ms`,
          `P75: ${formatNumber(boxPlotValues[3], 0)} ms`,
          `Maximum: ${formatNumber(boxPlotValues[4], 0)} ms`,
          `P95: ${formatNumber(p95LatencyMs, 0)} ms`,
          `P99: ${formatNumber(p99LatencyMs, 0)} ms`,
        ].join("<br/>");
      },
    },
    grid: {
      left: 72,
      right: 24,
      top: 24,
      bottom: 32,
      containLabel: true,
    },
    xAxis: {
      type: "category",
      data: hasLatencyBoxPlotValues ? ["All requests"] : [],
      axisLine: { lineStyle: { color: "rgba(148, 163, 184, 0.5)" } },
      axisLabel: { color: "#64748b" },
    },
    yAxis: {
      type: "value",
      name: "Milliseconds",
      nameGap: 12,
      nameTextStyle: { color: "#64748b" },
      axisLabel: { color: "#64748b" },
      splitLine: { lineStyle: { color: "rgba(148, 163, 184, 0.16)" } },
    },
    series: [
      {
        type: "boxplot",
        data: hasLatencyBoxPlotValues ? [latencyBoxPlotValues] : [],
        itemStyle: {
          color: "rgba(37, 99, 235, 0.18)",
          borderColor: "#2563eb",
          borderWidth: 2,
        },
      },
    ],
  };

  const latencyTableData = [
    { label: "Minimum", value: `${formatNumber(minLatencyMs, 2)} ms` },
    { label: "P25 / Q1", value: `${formatNumber(p25LatencyMs, 2)} ms` },
    { label: "P50 / Median", value: `${formatNumber(p50LatencyMs, 2)} ms` },
    { label: "P75 / Q3", value: `${formatNumber(p75LatencyMs, 2)} ms` },
    { label: "P95", value: `${formatNumber(p95LatencyMs, 2)} ms` },
    { label: "P99", value: `${formatNumber(p99LatencyMs, 2)} ms` },
    { label: "Maximum", value: `${formatNumber(maxLatencyMs, 2)} ms` },
  ];

  const progressOption: EChartsOption = {
    backgroundColor: "transparent",
    tooltip: {
      formatter: "{a}<br/>{b}: {c}%",
    },
    series: [
      {
        name: "Progress",
        type: "gauge",
        startAngle: 210,
        endAngle: -30,
        radius: "96%",
        progress: {
          show: true,
          width: 16,
          itemStyle: {
            color: statusTone.accent,
          },
        },
        axisLine: {
          lineStyle: {
            width: 16,
            color: [[1, "rgba(148, 163, 184, 0.18)"]],
          },
        },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { show: false },
        pointer: { show: false },
        anchor: { show: false },
        title: {
          offsetCenter: [0, "48%"],
          color: statusTone.accent,
          fontSize: 13,
        },
        detail: {
          valueAnimation: true,
          offsetCenter: [0, "8%"],
          formatter: "{value}%",
          fontSize: 28,
          fontWeight: 700,
          color: statusTone.accent,
        },
        data: [{ value: Math.round(progressPercent), name: "Completion" }],
      },
    ],
  };

  const requestChart: EChartsOption = {
    backgroundColor: "transparent",
    tooltip: {
      trigger: "axis",
    },
    grid: {
      left: 8,
      right: 8,
      top: 20,
      bottom: 0,
      containLabel: true,
    },
    xAxis: {
      type: "category",
      data: ["Total", "Success", "Failed", "Timeout", "Retries"],
      axisLine: { lineStyle: { color: "rgba(148, 163, 184, 0.5)" } },
      axisLabel: { color: "#64748b" },
    },
    yAxis: {
      type: "value",
      axisLabel: { color: "#64748b" },
      splitLine: { lineStyle: { color: "rgba(148, 163, 184, 0.16)" } },
    },
    series: [
      {
        type: "bar",
        data: [
          totalRequests ?? 0,
          successfulRequests ?? 0,
          failedRequests ?? 0,
          retriedRequests ?? 0,
        ],
        barWidth: 22,
        itemStyle: {
          borderRadius: [8, 8, 0, 0],
          color: (params) => {
            const palette = [statusTone.accent, "#0f766e", "#b91c1c", "#d97706", "#475569"];
            return palette[params.dataIndex as number] ?? "#1d4ed8";
          },
        },
      },
    ],
  };


  const groupedExperimentRunStates = useMemo(() => {
    const runningExperimentRunStates: ExperimentRunMetadata[] = [];
    const completedExperimentRunStates: ExperimentRunMetadata[] = [];
    const other: ExperimentRunMetadata[] = [];

    for (const experimentRunState of experimentRunStates) {
      const status = inferExperimentRunStateStatus(experimentRunState);

      if (status === "running") {
        runningExperimentRunStates.push(experimentRunState);
      } else if (status === "completed") {
        completedExperimentRunStates.push(experimentRunState);
      } else {
        other.push(experimentRunState);
      }
    }

    return {
      running: runningExperimentRunStates,
      completed: completedExperimentRunStates,
      other,
    };
  }, [experimentRunStates]);

  return (
    <Container className="py-6">
      <div className="grid gap-6 xl:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="space-y-4 xl:sticky xl:top-6 xl:h-fit">
          <div className="rounded-3xl border border-border bg-card/90 p-4 shadow-sm backdrop-blur">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Experiment queue</p>
                <h2 className="text-lg font-semibold">All experiments</h2>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => void handleRefresh()}
                disabled={isRefreshingExperimentStatesList}
                aria-label="Refresh experiments"
              >
                {isRefreshingExperimentStatesList ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
            </div>

            <div className="mt-4 space-y-4">
              {experimentRunStates.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-4 text-sm text-muted-foreground">
                  No experiments found.
                </div>
              ) : (
                <>
                  {groupedExperimentRunStates.running.length > 0 ? (
                    <div className="space-y-2">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Running</p>
                      <div className="space-y-2">
                        {groupedExperimentRunStates.running.map((experimentRunState) => {
                          const experimentRunStateKey = getExperimentRunStateKey(experimentRunState);
                          const experimentRunStateTone = getStatusTone(inferExperimentRunStateStatus(experimentRunState));

                          return (
                            <Button
                              key={experimentRunStateKey}
                              variant={selectedRunId === experimentRunStateKey ? "secondary" : "ghost"}
                              className="h-auto w-full justify-start rounded-2xl px-4 py-3 text-left"
                              onClick={() => setSelectedRunId(experimentRunStateKey)}
                            >
                              <div className="flex w-full items-center justify-between gap-3">
                                <div className="min-w-0 text-left">
                                  <div className="truncate font-medium">
                                    {getExperimentRunStateDisplayName(experimentRunState)}
                                  </div>
                                  <div className="mt-1 min-w-0 truncate text-xs text-muted-foreground">
                                    Run #{experimentRunState.run_id}
                                  </div>
                                </div>
                                <span className={`rounded-full px-2 py-1 text-[11px] font-medium ${experimentRunStateTone.badgeClass}`}>
                                  {experimentRunStateTone.label}
                                </span>
                              </div>
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}

                  {groupedExperimentRunStates.completed.length > 0 ? (
                    <div className="space-y-2">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Completed</p>
                      <div className="space-y-2">
                        {groupedExperimentRunStates.completed.map((experimentRunState) => {
                          const experimentRunStateKey = getExperimentRunStateKey(experimentRunState);
                          const experimentRunStateTone = getStatusTone(inferExperimentRunStateStatus(experimentRunState));

                          return (
                            <Button
                              key={experimentRunStateKey}
                              variant={selectedRunId === experimentRunStateKey ? "secondary" : "ghost"}
                              className="h-auto w-full justify-start rounded-2xl px-4 py-3 text-left"
                              onClick={() => setSelectedRunId(experimentRunStateKey)}
                            >
                              <div className="flex w-full items-center justify-between gap-3">
                                <div className="min-w-0 text-left">
                                  <div className="truncate font-medium">
                                    {getExperimentRunStateDisplayName(experimentRunState)}
                                  </div>
                                  <div className="mt-1 text-xs text-muted-foreground">
                                    {formatDate(experimentRunState.finished_at)}
                                  </div>
                                </div>
                                <span className={`rounded-full px-2 py-1 text-[11px] font-medium ${experimentRunStateTone.badgeClass}`}>
                                  {experimentRunStateTone.label}
                                </span>
                              </div>
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}

                  {groupedExperimentRunStates.other.length > 0 ? (
                    <div className="space-y-2">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Other</p>
                      <div className="space-y-2">
                        {groupedExperimentRunStates.other.map((experimentRunState) => {
                          const experimentRunStateKey = getExperimentRunStateKey(experimentRunState);
                          const experimentRunStateTone = getStatusTone(inferExperimentRunStateStatus(experimentRunState));

                          return (
                            <Button
                              key={experimentRunStateKey}
                              variant={selectedRunId === experimentRunStateKey ? "secondary" : "ghost"}
                              className="h-auto w-full justify-start rounded-2xl px-4 py-3 text-left"
                              onClick={() => setSelectedRunId(experimentRunStateKey)}
                            >
                              <div className="flex w-full items-center justify-between gap-3">
                                <div className="min-w-0 text-left">
                                  <div className="truncate font-medium">
                                    {getExperimentRunStateDisplayName(experimentRunState)}
                                  </div>
                                  <div className="mt-1 text-xs text-muted-foreground">
                                    {experimentRunState.status ?? "queued"}
                                  </div>
                                </div>
                                <span className={`rounded-full px-2 py-1 text-[11px] font-medium ${experimentRunStateTone.badgeClass}`}>
                                  {experimentRunStateTone.label}
                                </span>
                              </div>
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}
                </>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-card/90 p-4 shadow-sm backdrop-blur">
            <p className="text-sm text-muted-foreground">Status</p>
            <div className="mt-2 flex items-center gap-2 text-sm font-medium">
              <span className={`h-2.5 w-2.5 rounded-full ${statusTone.dotClass}`} />
              {selectedRunId === null
                ? "Waiting for a selection"
                : isLiveSelection
                  ? displayConnectionState === "connected"
                    ? "Receiving live SSE updates"
                    : displayConnectionState === "connecting"
                      ? "Connecting to stream"
                      : displayConnectionState === "error"
                        ? "Stream unavailable"
                        : "Preparing live stream"
                  : statusTone.description}
            </div>
            <div className="mt-3 space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center justify-between gap-3">
                <span>Last event</span>
                <span className="font-medium text-foreground">{selectedRunId === null ? "--" : isLiveSelection ? displayStreamEvent : status}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>Updated</span>
                <span className="font-medium text-foreground">
                  {isLiveSelection ? (displayLastUpdatedAt ? formatDate(displayLastUpdatedAt) : "--") : formatDate(finishedAt ?? startedAt)}
                </span>
              </div>
            </div>
            {displayStreamError ? (
              <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
                {displayStreamError}
              </div>
            ) : null}
            {runActionError ? (
              <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
                {runActionError}
              </div>
            ) : null}
          </div>

          <div className="rounded-3xl border border-border bg-card/90 p-4 shadow-sm backdrop-blur">
            <div>
              <p className="text-sm text-muted-foreground">Models</p>
              <h2 className="text-lg font-semibold">LLMs used in this experiment</h2>
            </div>

            <div className="mt-4 space-y-2">
              {currentExperimentLlms.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-4 text-sm text-muted-foreground">
                  No LLMs found.
                </div>
              ) : (
                currentExperimentLlms.map((llm) => (
                  <div
                    key={llm.id}
                    className="rounded-2xl border border-border bg-muted/30 p-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="truncate font-medium">
                        {llm.name}
                      </span>
                    </div>

                    <div className="mt-1 truncate text-xs text-muted-foreground">
                      {llm.model}
                    </div>

                    <div className="mt-1 truncate text-xs text-muted-foreground">
                      {llm.base_model}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </aside>

        <main className="space-y-6">
          <section className="overflow-hidden rounded-[28px] border border-border bg-linear-to-br from-background via-background to-primary/5 p-6 shadow-sm">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl space-y-4">
                <div className="space-y-3">
                  <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
                    {experimentRunStateName}
                  </h1>

                  <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                    {isLiveSelection
                      ? "Monitor live progress, token consumption, request health, and the latest messages from the active SSE stream."
                      : statusTone.description}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span
                    className={`rounded-full px-3 py-1 font-medium ${statusTone.badgeClass}`}
                  >
                    {status}
                  </span>

                  <span className="rounded-full border border-border bg-card/90 px-3 py-1 text-muted-foreground">
                    Run #{selectedExperimentRunState?.run_id ?? "--"}
                  </span>

                  <span className="rounded-full border border-border bg-card/90 px-3 py-1 text-muted-foreground">
                    {formatDuration(elapsedSeconds)}{" "}
                    {isLiveSelection ? "elapsed" : "total"}
                  </span>

                  {isLiveSelection && (
                    <span className="rounded-full border border-border bg-card/90 px-3 py-1 text-muted-foreground">
                      ~ {formatDuration(remainingTime)} remaining
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-3 lg:min-w-90 lg:max-w-105">
                {(status === "Running" || status === "Paused") && (
                  <div>
                    {isLiveSelection && (
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                          void handleRunAction("pause");
                        }}
                        disabled={runAction !== null}
                      >
                        {runAction === "pause" ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Pause className="mr-2 h-4 w-4" />
                        )}
                        {runAction === "pause" ? "Pausing..." : "Pause"}
                      </Button>
                    )}

                    {status === "Paused" && (
                      <Button
                        className="w-full"
                        onClick={() => {
                          void handleRunAction("resume");
                        }}
                        disabled={runAction !== null}
                      >
                        {runAction === "resume" ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Play className="mr-2 h-4 w-4" />
                        )}
                        {runAction === "resume" ? "Resuming..." : "Resume"}
                      </Button>
                    )}
                  </div>
                )}
                {/* Metrics */}
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-border bg-card/95 p-4 shadow-sm">
                    <p className="text-sm text-muted-foreground">Execution window</p>
                    <p className="mt-2 text-sm font-medium">{formatDate(startedAt)}</p>
                    <p className="text-sm text-muted-foreground">
                      → {formatDate(finishedAt)}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-border bg-card/95 p-4 shadow-sm">
                    <p className="text-sm text-muted-foreground">Requests processed</p>
                    <p className="mt-2 text-2xl font-semibold">
                      {formatNumber(attemptedRequests)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      of {formatNumber(totalRequests)} items
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              title="Token usage"
              value={formatNumber(tokensUsed)}
            />
            <MetricCard
              title="Request volume"
              value={formatNumber(totalRequests)}
              detail={`Success ${formatNumber(successfulRequests)} · Failed ${formatNumber(failedRequests)}`}
              icon={<RefreshCw className="h-4 w-4" />}
            />
            <div className="rounded-2xl border border-border bg-card/90 p-4 shadow-sm backdrop-blur">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm text-muted-foreground">Request latency</p>

                  <p className="mt-2 text-2xl font-semibold tracking-tight">
                    {formatNumber(averageLatencyMs, 0)} ms
                  </p>

                  <p className="mt-1 text-xs text-muted-foreground">
                    Average latency
                  </p>

                  <div className="mt-3 grid grid-cols-3 gap-3 border-t border-border pt-3">
                    <div>
                      <p className="text-xs text-muted-foreground">P50</p>
                      <p className="mt-1 text-sm font-semibold">
                        {formatNumber(p50LatencyMs, 0)} ms
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground">P95</p>
                      <p className="mt-1 text-sm font-semibold">
                        {formatNumber(p95LatencyMs, 0)} ms
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground">P99</p>
                      <p className="mt-1 text-sm font-semibold">
                        {formatNumber(p99LatencyMs, 0)} ms
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-3xl border border-border bg-card/90 p-5 shadow-sm backdrop-blur">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold">Completion</h2>
                  <p className="text-sm text-muted-foreground">
                    {isLiveSelection
                      ? "Derived from the latest live snapshot or iteration counters."
                      : "Derived from the selected experiment record."}
                  </p>
                </div>
                <span className="rounded-full border border-border bg-muted/40 px-3 py-1 text-xs font-medium text-muted-foreground">
                  {isLiveSelection ? "Live gauge" : "Final snapshot"}
                </span>
              </div>
              <div className="h-80">
                <ReactECharts option={progressOption} style={{ height: "100%", width: "100%" }} />
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-3xl border border-border bg-card/90 p-5 shadow-sm backdrop-blur">
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold">Requests status</h2>
                    <p className="text-sm text-muted-foreground">Current request health, retries, and failures.</p>
                  </div>
                </div>
                <div className="h-65">
                  <ReactECharts option={requestChart} style={{ height: "100%", width: "100%" }} />
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
            {/* LEFT SIDE */}
            <div className="space-y-6">
              {/* Performance metrics */}
              <div className="grid gap-4 sm:grid-cols-3">
                <MetricCard
                  title="Tokens / Request"
                  value={tokensPerRequest.toFixed(1)}
                  detail="Average tokens per request"
                />

                <MetricCard
                  title="Requests / Minute"
                  value={currentRequestThroughput.toFixed(1)}
                  detail="Current request throughput"
                  secondaryValues={[
                    {
                      label: "Average",
                      value: `${requestsPerMinute.toFixed(1)} req/min`,
                    },
                    {
                      label: "Peak",
                      value: `${peakRequestThroughput.toFixed(1)} req/min`,
                    },
                  ]}
                />

                <MetricCard
                  title="Tokens / Minute"
                  value={tokensPerMinute.toFixed(1)}
                  detail="Average token throughput"
                />
              </div>

            </div>

            {/* RIGHT SIDE */}
            <div>
              <div className="rounded-3xl border border-border bg-card/90 p-5 shadow-sm backdrop-blur">
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold">
                      {isLiveSelection
                        ? "Live messages"
                        : statusTone.label === "Failed"
                          ? "Failure details"
                          : "Run messages"}
                    </h2>

                    <p className="text-sm text-muted-foreground">
                      {isLiveSelection
                        ? "Errors and emitted messages from the active run."
                        : "Messages captured on the selected experiment record."}
                    </p>
                  </div>

                </div>

                <div className="space-y-3">
                  {errorMessages.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-4 text-sm text-muted-foreground">
                      {isLiveSelection
                        ? "No messages captured yet."
                        : "No archived messages found."}
                    </div>
                  ) : (
                    errorMessages.slice(0, 6).map((message, index) => (
                      <div
                        key={`${message}-${index}`}
                        className="rounded-2xl border border-border bg-muted/30 p-3 text-sm leading-6 text-foreground"
                      >
                        <span className="mr-2 inline-flex rounded-full bg-destructive/10 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-destructive">
                          {message.toLowerCase().includes("error")
                            ? "error"
                            : "message"}
                        </span>

                        {message}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </section>

          <div className="grid gap-6 xl:grid-cols-3">
            <PerformanceLineChart
              title="Tokens / Request"
              data={tokensPerRequestHistory}
              unit="tokens"
            />

            <PerformanceLineChart
              title="Requests / Minute"
              data={requestsPerMinuteHistory}
              unit="requests/min"
            />

            <PerformanceLineChart
              title="Tokens / Minute"
              data={tokensPerMinuteHistory}
              unit="tokens/min"
            />
          </div>
          <ChartPanel
            title="Request latency distribution"
            description={hasLatencyBoxPlotValues
              ? "Box plot showing the minimum, middle 50%, median, and maximum request latency. P95 and P99 are included as tail-latency context."
              : "The latency percentile summary is incomplete for this run."}
            data={latencyTableData}
            chart={
              <div className="h-65">
                <ReactECharts
                  option={latencyBoxPlotOption}
                  style={{ height: "100%", width: "100%" }}
                />
              </div>
            }
          />
        </main>
      </div>
    </Container>
  );
}