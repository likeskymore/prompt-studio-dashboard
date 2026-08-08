"use client";

import { useEffect, useMemo, useState } from "react";
import type { EChartsOption } from "echarts";
import ReactECharts from "echarts-for-react";
import { Activity, ArrowRightLeft, Clock3, RefreshCw, ShieldAlert, TriangleAlert } from "lucide-react";
import Container from "@/components/container";
import { Button } from "@/components/ui/button";
import { experimentService } from "@/services/experiment";
import { LiveExperimentSnapshot, RunningExperiment } from "@/features/experiment/models/ExperimentModels";
import { ChartSeriesPoint, MetricCardProps } from "@/types/charts";


function coerceNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return undefined;
}

function firstDefinedNumber(snapshot: LiveExperimentSnapshot, keys: string[]): number | undefined {
  for (const key of keys) {
    const value = coerceNumber(snapshot[key]);
    if (value !== undefined) {
      return value;
    }
  }

  return undefined;
}

function pickStrings(values: unknown): string[] {
  if (!Array.isArray(values)) {
    return [];
  }

  return values
    .map((item) => {
      if (typeof item === "string") {
        return item;
      }

      if (item && typeof item === "object") {
        const record = item as Record<string, unknown>;
        const text = record.message ?? record.text ?? record.event;

        if (typeof text === "string") {
          return text;
        }
      }

      return "";
    })
    .filter((item) => item.length > 0);
}

function formatNumber(value: number | undefined, fractionDigits = 0): string {
  if (value === undefined || Number.isNaN(value)) {
    return "--";
  }

  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: fractionDigits,
    minimumFractionDigits: fractionDigits,
  }).format(value);
}

function formatDate(value: string | undefined): string {
  if (!value) {
    return "--";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatDuration(start: string | undefined, end?: string | undefined): string {
  if (!start) {
    return "--";
  }

  const startTime = new Date(start).getTime();
  const finishTime = end ? new Date(end).getTime() : Date.now();

  if (Number.isNaN(startTime) || Number.isNaN(finishTime)) {
    return "--";
  }

  const totalSeconds = Math.max(0, Math.floor((finishTime - startTime) / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  }

  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }

  return `${seconds}s`;
}

function MetricCard({ title, value, detail, icon }: MetricCardProps) {
  return (
    <div className="rounded-2xl border border-border bg-card/90 p-4 shadow-sm backdrop-blur">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
          {detail ? <p className="mt-1 text-xs text-muted-foreground">{detail}</p> : null}
        </div>
        <div className="rounded-xl border border-border bg-muted/60 p-2 text-muted-foreground">
          {icon}
        </div>
      </div>
    </div>
  );
}

export default function ExperimentMonitor() {
  const [runningExperiments, setRunningExperiments] = useState<RunningExperiment[]>([]);
  const [selectedRunId, setSelectedRunId] = useState<number | null>(null);
  const [snapshot, setSnapshot] = useState<LiveExperimentSnapshot | null>(null);
  const [snapshotRunId, setSnapshotRunId] = useState<number | null>(null);
  const [connectionState, setConnectionState] = useState<"idle" | "connecting" | "connected" | "error">("idle");
  const [connectionRunId, setConnectionRunId] = useState<number | null>(null);
  const [streamEvent, setStreamEvent] = useState("snapshot");
  const [streamEventRunId, setStreamEventRunId] = useState<number | null>(null);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [streamErrorRunId, setStreamErrorRunId] = useState<number | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);
  const [lastUpdatedAtRunId, setLastUpdatedAtRunId] = useState<number | null>(null);

  const selectedExperiment = useMemo(
    () => runningExperiments.find((experiment) => experiment.run_id === selectedRunId) ?? null,
    [runningExperiments, selectedRunId],
  );
  const activeSnapshot = selectedRunId !== null && snapshotRunId === selectedRunId ? snapshot : null;
  const displayConnectionState =
    selectedRunId === null
      ? "idle"
      : connectionRunId === selectedRunId
        ? connectionState
        : "connecting";
  const displayStreamEvent =
    selectedRunId !== null && streamEventRunId === selectedRunId ? streamEvent : "snapshot";
  const displayStreamError =
    selectedRunId !== null && streamErrorRunId === selectedRunId ? streamError : null;
  const displayLastUpdatedAt =
    selectedRunId !== null && lastUpdatedAtRunId === selectedRunId ? lastUpdatedAt : null;

  useEffect(() => {
    const fetchRunningExperiments = async () => {
      try {
        const response = await experimentService.getRunningExperiment();

        const experiments = response.body.running_experiments;

        setRunningExperiments(experiments);
        setSelectedRunId((currentRunId) => {
          if (currentRunId !== null && experiments.some((experiment) => experiment.run_id === currentRunId)) {
            return currentRunId;
          }

          return experiments[0]?.run_id ?? null;
        });

      } catch (error) {
        console.error("Failed to fetch running experiments:", error);
      }
    };

    fetchRunningExperiments();
  }, []);

  useEffect(() => {
    if (selectedRunId === null) {
      return;
    }

    const controller = new AbortController();

    void experimentService
      .subscribeToExperimentRun(selectedRunId, {
        signal: controller.signal,
        onEvent: (event) => {
          setStreamEvent(event);
          setStreamEventRunId(selectedRunId);
          setConnectionState("connected");
          setConnectionRunId(selectedRunId);
          setStreamError(null);
          setStreamErrorRunId(null);
        },
        onData: (data) => {
          if (data && typeof data === "object") {
            setSnapshot(data as LiveExperimentSnapshot);
            setSnapshotRunId(selectedRunId);
            setLastUpdatedAt(new Date().toISOString());
            setLastUpdatedAtRunId(selectedRunId);
          }
        },
      })
      .catch((error) => {
        if ((error as Error).name === "AbortError") {
          return;
        }

        setConnectionState("error");
        setConnectionRunId(selectedRunId);
        setStreamError(error instanceof Error ? error.message : "Failed to connect to the live run stream.");
        setStreamErrorRunId(selectedRunId);
      });

    return () => {
      controller.abort();
    };
  }, [selectedRunId]);

  const experimentName = activeSnapshot?.experiment_name ?? selectedExperiment?.experiment_name ?? "Select a run";
  const status = String(activeSnapshot?.status ?? "live");
  const progressPercent = Math.max(
    0,
    Math.min(
      100,
      firstDefinedNumber(activeSnapshot ?? {}, ["progress", "completion_percent"]) ?? (() => {
        const completed = firstDefinedNumber(activeSnapshot ?? {}, ["completed_iterations", "iteration_completed", "iterations_completed"]);
        const total = firstDefinedNumber(activeSnapshot ?? {}, ["total_iterations", "iteration_total", "iterations_total"]);
        if (completed === undefined || !total) {
          return 0;
        }
        return (completed / total) * 100;
      })(),
    ),
  );
  const completedIterations = firstDefinedNumber(activeSnapshot ?? {}, ["completed_iterations", "iteration_completed", "iterations_completed", "current_iteration"]);
  const totalIterations = firstDefinedNumber(activeSnapshot ?? {}, ["total_iterations", "iteration_total", "iterations_total"]);
  const inputTokens = firstDefinedNumber(activeSnapshot ?? {}, ["input_tokens"]);
  const outputTokens = firstDefinedNumber(activeSnapshot ?? {}, ["output_tokens"]);
  const tokensUsed = firstDefinedNumber(activeSnapshot ?? {}, ["tokens_used"]);
  const requestTotal = firstDefinedNumber(activeSnapshot ?? {}, ["requests_total", "request_total"]);
  const successfulRequests = firstDefinedNumber(activeSnapshot ?? {}, ["successful_requests"]);
  const failedRequests = firstDefinedNumber(activeSnapshot ?? {}, ["failed_requests"]);
  const timeoutRequests = firstDefinedNumber(activeSnapshot ?? {}, ["timeout_requests"]);
  const retriedRequests = firstDefinedNumber(activeSnapshot ?? {}, ["retried_requests", "retries"]);
  const latencyMs = firstDefinedNumber(activeSnapshot ?? {}, ["average_latency_ms", "latency_ms", "latency"]);
  const processedItems = firstDefinedNumber(activeSnapshot ?? {}, ["processed_items", "data_processed"]);
  const totalItems = firstDefinedNumber(activeSnapshot ?? {}, ["total_items", "data_total"]);
  const errorMessages = [
    ...pickStrings(activeSnapshot?.error_messages),
    ...pickStrings(activeSnapshot?.errors),
    ...pickStrings(activeSnapshot?.logs),
  ];
  const timelineData: ChartSeriesPoint[] = useMemo(() => {
    const candidatePairs: ChartSeriesPoint[] = [];

    const iterationProgress = progressPercent || 0;
    candidatePairs.push(["Start", 0]);
    candidatePairs.push(["Current", Math.round(iterationProgress)]);
    candidatePairs.push(["Target", 100]);

    return candidatePairs;
  }, [progressPercent]);

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
            color: "#2563eb",
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
          color: "#64748b",
          fontSize: 13,
        },
        detail: {
          valueAnimation: true,
          offsetCenter: [0, "8%"],
          formatter: "{value}%",
          fontSize: 28,
          fontWeight: 700,
          color: "inherit",
        },
        data: [{ value: Math.round(progressPercent), name: "Completion" }],
      },
    ],
  };

  const tokenChart: EChartsOption = {
    backgroundColor: "transparent",
    tooltip: {
      trigger: "item",
    },
    legend: {
      bottom: 0,
      icon: "circle",
      textStyle: {
        color: "#64748b",
      },
    },
    series: [
      {
        name: "Tokens",
        type: "pie",
        radius: ["48%", "72%"],
        center: ["50%", "42%"],
        itemStyle: {
          borderRadius: 10,
          borderColor: "var(--color-card)",
          borderWidth: 3,
        },
        label: {
          color: "#0f172a",
          formatter: "{b}\n{c}",
        },
        data: [
          { value: inputTokens ?? 0, name: "Input" },
          { value: outputTokens ?? 0, name: "Output" },
          { value: Math.max(0, (tokensUsed ?? 0) - (inputTokens ?? 0) - (outputTokens ?? 0)), name: "Other" },
        ],
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
          requestTotal ?? 0,
          successfulRequests ?? 0,
          failedRequests ?? 0,
          timeoutRequests ?? 0,
          retriedRequests ?? 0,
        ],
        barWidth: 22,
        itemStyle: {
          borderRadius: [8, 8, 0, 0],
          color: (params) => {
            const palette = ["#1d4ed8", "#0f766e", "#b91c1c", "#d97706", "#475569"];
            return palette[params.dataIndex as number] ?? "#1d4ed8";
          },
        },
      },
    ],
  };

  const throughputChart: EChartsOption = {
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
      data: timelineData.map(([label]) => label),
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
        type: "line",
        smooth: true,
        symbolSize: 10,
        lineStyle: {
          width: 3,
          color: "#2563eb",
        },
        itemStyle: {
          color: "#2563eb",
        },
        areaStyle: {
          color: "rgba(37, 99, 235, 0.16)",
        },
        data: timelineData.map(([, value]) => value),
      },
    ],
  };

  return (
    <Container className="py-6">
      <div className="grid gap-6 xl:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="space-y-4 xl:sticky xl:top-6 xl:h-fit">
          <div className="rounded-3xl border border-border bg-card/90 p-4 shadow-sm backdrop-blur">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Experiment queue</p>
                <h2 className="text-lg font-semibold">Running runs</h2>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => {
                  void (async () => {
                    try {
                      const response = await experimentService.getRunningExperiment();
                      setRunningExperiments(response.body.running_experiments);
                    } catch (error) {
                      console.error("Failed to refresh running experiments:", error);
                    }
                  })();
                }}
                aria-label="Refresh running experiments"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>

            <div className="mt-4 space-y-2">
              {runningExperiments.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-4 text-sm text-muted-foreground">
                  No active runs right now.
                </div>
              ) : (
                runningExperiments.map((experiment) => (
                  <Button
                    key={experiment.run_id}
                    variant={selectedRunId === experiment.run_id ? "secondary" : "ghost"}
                    className="h-auto w-full justify-start rounded-2xl px-4 py-3 text-left"
                    onClick={() => setSelectedRunId(experiment.run_id)}
                  >
                    <div className="flex w-full items-center justify-between gap-3">
                      <div>
                        <div className="font-medium truncate">
                          {experiment.experiment_name}
                        </div>
                      </div>
                      {selectedRunId === experiment.run_id ? (
                        <span className="rounded-full bg-primary/10 px-2 py-1 text-[11px] font-medium text-primary">Live</span>
                      ) : null}
                    </div>
                  </Button>
                ))
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-card/90 p-4 shadow-sm backdrop-blur">
            <p className="text-sm text-muted-foreground">Connection</p>
            <div className="mt-2 flex items-center gap-2 text-sm font-medium">
              <span
                className={
                  displayConnectionState === "connected"
                    ? "h-2.5 w-2.5 rounded-full bg-emerald-500"
                    : displayConnectionState === "connecting"
                      ? "h-2.5 w-2.5 rounded-full bg-amber-500"
                      : displayConnectionState === "error"
                        ? "h-2.5 w-2.5 rounded-full bg-red-500"
                        : "h-2.5 w-2.5 rounded-full bg-slate-400"
                }
              />
              {displayConnectionState === "connected"
                ? "Receiving live SSE updates"
                : displayConnectionState === "connecting"
                  ? "Connecting to stream"
                  : displayConnectionState === "error"
                    ? "Stream unavailable"
                    : "Waiting for a selection"}
            </div>
            <div className="mt-3 space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center justify-between gap-3">
                <span>Last event</span>
                <span className="font-medium text-foreground">{displayStreamEvent}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>Updated</span>
                <span className="font-medium text-foreground">{displayLastUpdatedAt ? formatDate(displayLastUpdatedAt) : "--"}</span>
              </div>
            </div>
            {displayStreamError ? (
              <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
                {displayStreamError}
              </div>
            ) : null}
          </div>
        </aside>

        <main className="space-y-6">
          <section className="overflow-hidden rounded-[28px] border border-border bg-linear-to-br from-background via-background to-primary/5 p-6 shadow-sm">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl space-y-4">
                <div>
                  <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">{experimentName}</h1>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                    Monitor live progress, token consumption, request health, and the latest run messages from the active SSE stream.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="rounded-full bg-primary px-3 py-1 font-medium text-primary-foreground">{status}</span>
                  <span className="rounded-full border border-border bg-card/90 px-3 py-1 text-muted-foreground">
                    Run #{selectedExperiment?.run_id ?? "--"}
                  </span>
                  <span className="rounded-full border border-border bg-card/90 px-3 py-1 text-muted-foreground">
                    {formatDuration(activeSnapshot?.started_at ?? activeSnapshot?.start_time, activeSnapshot?.finished_at ?? activeSnapshot?.end_time)} elapsed
                  </span>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:min-w-90 lg:max-w-105">
                <div className="rounded-2xl border border-border bg-card/95 p-4 shadow-sm">
                  <p className="text-sm text-muted-foreground">Execution window</p>
                  <p className="mt-2 text-sm font-medium">{formatDate(activeSnapshot?.started_at ?? activeSnapshot?.start_time)}</p>
                  <p className="text-sm text-muted-foreground">→ {formatDate(activeSnapshot?.finished_at ?? activeSnapshot?.end_time)}</p>
                </div>
                <div className="rounded-2xl border border-border bg-card/95 p-4 shadow-sm">
                  <p className="text-sm text-muted-foreground">Data processed</p>
                  <p className="mt-2 text-2xl font-semibold">{formatNumber(processedItems)}</p>
                  <p className="text-sm text-muted-foreground">of {formatNumber(totalItems)} items</p>
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              title="Iterations completed"
              value={totalIterations ? `${formatNumber(completedIterations)} / ${formatNumber(totalIterations)}` : formatNumber(completedIterations)}
              detail={`${Math.round(progressPercent)}% complete`}
              icon={<Clock3 className="h-4 w-4" />}
            />
            <MetricCard
              title="Token usage"
              value={formatNumber(tokensUsed)}
              detail={`Input ${formatNumber(inputTokens)} · Output ${formatNumber(outputTokens)}`}
              icon={<ArrowRightLeft className="h-4 w-4" />}
            />
            <MetricCard
              title="Request volume"
              value={formatNumber(requestTotal)}
              detail={`Success ${formatNumber(successfulRequests)} · Failed ${formatNumber(failedRequests)}`}
              icon={<RefreshCw className="h-4 w-4" />}
            />
            <MetricCard
              title="Average latency"
              value={latencyMs === undefined ? "--" : `${formatNumber(latencyMs)} ms`}
              detail={`Retries ${formatNumber(retriedRequests)}`}
              icon={<Activity className="h-4 w-4" />}
            />
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-3xl border border-border bg-card/90 p-5 shadow-sm backdrop-blur">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold">Completion</h2>
                  <p className="text-sm text-muted-foreground">Derived from the latest snapshot or iteration counters.</p>
                </div>
                <span className="rounded-full border border-border bg-muted/40 px-3 py-1 text-xs font-medium text-muted-foreground">
                  Live gauge
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
                    <h2 className="text-lg font-semibold">Token split</h2>
                    <p className="text-sm text-muted-foreground">Input, output, and remaining usage.</p>
                  </div>
                </div>
                <div className="h-75">
                  <ReactECharts option={tokenChart} style={{ height: "100%", width: "100%" }} />
                </div>
              </div>

              <div className="rounded-3xl border border-border bg-card/90 p-5 shadow-sm backdrop-blur">
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold">Traffic breakdown</h2>
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
            <div className="rounded-3xl border border-border bg-card/90 p-5 shadow-sm backdrop-blur">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold">Runtime trend</h2>
                  <p className="text-sm text-muted-foreground">A lightweight live trend view built from the current snapshot.</p>
                </div>
              </div>
              <div className="h-70">
                <ReactECharts option={throughputChart} style={{ height: "100%", width: "100%" }} />
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-3xl border border-border bg-card/90 p-5 shadow-sm backdrop-blur">
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold">Live messages</h2>
                    <p className="text-sm text-muted-foreground">Errors and emitted messages from the active run.</p>
                  </div>
                  <ShieldAlert className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="space-y-3">
                  {errorMessages.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-4 text-sm text-muted-foreground">
                      No messages captured yet.
                    </div>
                  ) : (
                    errorMessages.slice(0, 6).map((message, index) => (
                      <div key={`${message}-${index}`} className="rounded-2xl border border-border bg-muted/30 p-3 text-sm leading-6 text-foreground">
                        <span className="mr-2 inline-flex rounded-full bg-destructive/10 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-destructive">
                          {message.toLowerCase().includes("error") ? "error" : "message"}
                        </span>
                        {message}
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="rounded-3xl border border-border bg-card/90 p-5 shadow-sm backdrop-blur">
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold">Request context</h2>
                    <p className="text-sm text-muted-foreground">Quick readout matching the sketch on the left.</p>
                  </div>
                  <TriangleAlert className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-border bg-muted/30 p-3">
                    <p className="text-xs text-muted-foreground">Retries</p>
                    <p className="mt-1 text-xl font-semibold">{formatNumber(retriedRequests)}</p>
                  </div>
                  <div className="rounded-2xl border border-border bg-muted/30 p-3">
                    <p className="text-xs text-muted-foreground">Failures</p>
                    <p className="mt-1 text-xl font-semibold">{formatNumber(failedRequests)}</p>
                  </div>
                  <div className="rounded-2xl border border-border bg-muted/30 p-3">
                    <p className="text-xs text-muted-foreground">Timeouts</p>
                    <p className="mt-1 text-xl font-semibold">{formatNumber(timeoutRequests)}</p>
                  </div>
                  <div className="rounded-2xl border border-border bg-muted/30 p-3">
                    <p className="text-xs text-muted-foreground">Requests/sec</p>
                    <p className="mt-1 text-xl font-semibold">{requestTotal ? formatNumber(requestTotal / Math.max(1, progressPercent || 1), 2) : "--"}</p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
    </Container>
  );
}