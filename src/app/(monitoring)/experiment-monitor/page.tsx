/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useMemo, useState } from "react";
import type { EChartsOption } from "echarts";
import ReactECharts from "echarts-for-react";
import { Activity, ArrowRightLeft, Clock3, Coins, RefreshCw, ShieldAlert, Zap } from "lucide-react";
import Container from "@/components/container";
import { Button } from "@/components/ui/button";
import { ExperimentRunMetadata, ExperimentRunSample, ExperimentRunState, Llm } from "@/features/experiment/models/ExperimentModels";
import { MetricCard } from "./components/MetricCard";
import { PerformanceLineChart } from "./components/PerformanceLineChart";
import { formatDate, formatDuration, formatElapsedTime, formatNumber, pickStrings } from "@/lib/utils";
import { calculateCurrentRequestThroughput, calculatePeakRequestThroughput, getRequestsPerMinuteHistory, getTokensPerMinuteHistory, getTokensPerRequestHistory } from "@/lib/performanceUtils";


function normalizeStatus(value: string | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

function inferExperimentRunStateStatus(experimentRunMetadata: ExperimentRunMetadata): string {
  const explicitStatus = normalizeStatus(experimentRunMetadata.status);
  if (explicitStatus) {
    return explicitStatus;
  }
  return "queued";
}


function getStatusTone(status: string): { label: string; description: string; badgeClass: string; dotClass: string; accent: string } {
  const normalizedStatus = normalizeStatus(status);

  if (normalizedStatus === "running") {
    return {
      label: "Running",
      description: "Live SSE updates are active.",
      badgeClass: "bg-primary text-primary-foreground",
      dotClass: "bg-emerald-500",
      accent: "#2563eb",
    };
  }

  if (normalizedStatus === "completed") {
    return {
      label: "Completed",
      description: "Experiment run completed",
      badgeClass: "bg-emerald-600 text-white",
      dotClass: "bg-emerald-500",
      accent: "#16a34a",
    };
  }

  if (normalizedStatus === "failed") {
    return {
      label: "Failed",
      description: "The run ended with an error state.",
      badgeClass: "bg-destructive text-destructive-foreground",
      dotClass: "bg-red-500",
      accent: "#dc2626",
    };
  }

  if (normalizedStatus === "paused") {
    return {
      label: "Paused",
      description: "The experiment run is currently paused.",
      badgeClass: "bg-amber-500 text-white",
      dotClass: "bg-amber-500",
      accent: "#d97706",
    };
  }

  if (normalizedStatus === "queued") {
    return {
      label: "Queued",
      description: "The run is waiting to start.",
      badgeClass: "bg-amber-500 text-white",
      dotClass: "bg-amber-500",
      accent: "#d97706",
    };
  }

  return {
    label: normalizedStatus ? normalizedStatus : "Unknown",
    description: "No explicit status was reported.",
    badgeClass: "bg-muted text-muted-foreground",
    dotClass: "bg-slate-400",
    accent: "#64748b",
  };
}

function getExperimentRunStateDisplayName(experimentRunState: ExperimentRunMetadata | null): string {
  if (!experimentRunState) {
    return "Select an experiment";
  }

  const record = experimentRunState as Record<string, any>;
  const experimentRunStateName = record.experiment_name;
  if (typeof experimentRunStateName === "string" && experimentRunStateName.length > 0) {
    return experimentRunStateName;
  }

  return "Untitled experiment";
}

function getExperimentRunStateKey(ExperimentRunMetadata: ExperimentRunMetadata): string {
  return ExperimentRunMetadata.run_id;
}


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
      const experimentName = selectedExperimentRunState?.experiment_name;

      if (!experimentName) {
        setCurrentExperimentLlms([]);
        return;
      }

      try {
        const response = await fetch(
          `/api/experiment/${encodeURIComponent(experimentName)}/models`,
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
  const finishedAt = currentRecord["finished_at"];
  const updatedAt = currentRecord["updated_at"];
  const experimentSamples = currentRecord["samples"] as ExperimentRunSample[] | undefined;

  const startTime = startedAt ? new Date(startedAt).getTime() : 0;
  const endTime = finishedAt
    ? new Date(finishedAt).getTime()
    : updatedAt
      ? new Date(updatedAt).getTime()
      : now;

  const elapsedSeconds = startTime && endTime > startTime
    ? (endTime - startTime) / 1000
    : 0;
  const elapsedMinutes = elapsedSeconds / 60;

  const remainingRequests = totalRequests - attemptedRequests;

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
                onClick={() => {
                  void syncExperimentRunStates();
                }}
                aria-label="Refresh experiments"
              >
                <RefreshCw className="h-4 w-4" />
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
                  <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">{experimentRunStateName}</h1>
                  <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                    {isLiveSelection
                      ? "Monitor live progress, token consumption, request health, and the latest messages from the active SSE stream."
                      : statusTone.description}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className={`rounded-full px-3 py-1 font-medium ${statusTone.badgeClass}`}>
                    {status}
                  </span>
                  <span className="rounded-full border border-border bg-card/90 px-3 py-1 text-muted-foreground">
                    Run #{selectedExperimentRunState?.run_id ?? "--"}
                  </span>
                  <span className="rounded-full border border-border bg-card/90 px-3 py-1 text-muted-foreground">
                    {finishedAt ? formatElapsedTime(startedAt, finishedAt) : formatElapsedTime(startedAt, updatedAt)} {isLiveSelection ? "elapsed" : "total"}
                  </span>
                  {isLiveSelection && (
                    <span className="rounded-full border border-border bg-card/90 px-3 py-1 text-muted-foreground">
                      ~ {formatDuration(remainingTime)} remaining
                    </span>
                  )}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:min-w-90 lg:max-w-105">
                <div className="rounded-2xl border border-border bg-card/95 p-4 shadow-sm">
                  <p className="text-sm text-muted-foreground">Execution window</p>
                  <p className="mt-2 text-sm font-medium">{formatDate(startedAt)}</p>
                  <p className="text-sm text-muted-foreground">→ {formatDate(finishedAt)}</p>
                </div>
                <div className="rounded-2xl border border-border bg-card/95 p-4 shadow-sm">
                  <p className="text-sm text-muted-foreground">Requests processed</p>
                  <p className="mt-2 text-2xl font-semibold">{formatNumber(attemptedRequests)}</p>
                  <p className="text-sm text-muted-foreground">of {formatNumber(totalRequests)} items</p>
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              title="Token usage"
              value={formatNumber(tokensUsed)}
              icon={<ArrowRightLeft className="h-4 w-4" />}
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

                <div className="rounded-xl border border-border bg-muted/60 p-2 text-muted-foreground">
                  <Clock3 className="h-4 w-4" />
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
                  icon={<Coins className="h-4 w-4" />}
                />

                <MetricCard
                  title="Requests / Minute"
                  value={currentRequestThroughput.toFixed(1)}
                  detail="Current request throughput"
                  icon={<Activity className="h-4 w-4" />}
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
                  icon={<Zap className="h-4 w-4" />}
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

                  <ShieldAlert className="h-5 w-5 text-muted-foreground" />
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
        </main>
      </div>
    </Container>
  );
}