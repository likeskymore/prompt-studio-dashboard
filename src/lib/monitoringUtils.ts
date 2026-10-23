import { ExperimentRunSample } from "@/features/experiment/models/ExperimentModels";
import { ExperimentRunMetadata } from "@/features/experiment/models/ExperimentModels";

export interface PerformanceDataPoint {
  time: string;
  value: number;
}

export function calculateAverageRequestThroughput(
  samples: ExperimentRunSample[],
): number {
  if (samples.length < 2) {
    return 0;
  }

  const first = samples[0];
  const last = samples[samples.length - 1];

  const completedDelta = last.completed - first.completed;

  const elapsedSeconds =
    (new Date(last.at).getTime() - new Date(first.at).getTime()) / 1000;

  if (elapsedSeconds <= 0) {
    return 0;
  }

  return completedDelta / elapsedSeconds;
}

export function calculateCurrentRequestThroughput(
  samples: ExperimentRunSample[],
): number {
  if (samples.length < 2) {
    return 0;
  }

  const previous = samples[samples.length - 2];
  const current = samples[samples.length - 1];

  const completedDelta = current.completed - previous.completed;

  const elapsedSeconds =
    (new Date(current.at).getTime() - new Date(previous.at).getTime()) / 1000;

  if (elapsedSeconds <= 0) {
    return 0;
  }

  return (completedDelta / elapsedSeconds) * 60;
}

export function calculatePeakRequestThroughput(
  samples: ExperimentRunSample[],
): number {
  if (samples.length < 2) {
    return 0;
  }

  let peak = 0;

  for (let i = 1; i < samples.length; i++) {
    const previous = samples[i - 1];
    const current = samples[i];

    const completedDelta = current.completed - previous.completed;

    const elapsedSeconds =
      (new Date(current.at).getTime() - new Date(previous.at).getTime()) / 1000;

    if (elapsedSeconds <= 0) {
      continue;
    }

    const throughput = (completedDelta / elapsedSeconds) * 60;

    peak = Math.max(peak, throughput);
  }

  return peak;
}

export function getTokensPerRequestHistory(
  samples: ExperimentRunSample[],
): PerformanceDataPoint[] {
  return samples.map((sample, index) => {
    if (index === 0) {
      return {
        time: sample.at,
        value: 0,
      };
    }

    const previous = samples[index - 1];

    const deltaTokens = sample.total_tokens - previous.total_tokens;

    const deltaAttempts = sample.attempts - previous.attempts;

    return {
      time: sample.at,
      value: deltaAttempts > 0 ? deltaTokens / deltaAttempts : 0,
    };
  });
}

export function getRequestsPerMinuteHistory(
  samples: ExperimentRunSample[],
): PerformanceDataPoint[] {
  return samples.map((sample, index) => {
    if (index === 0) {
      return {
        time: sample.at,
        value: 0,
      };
    }

    const previous = samples[index - 1];

    const elapsedMinutes =
      (new Date(sample.at).getTime() - new Date(previous.at).getTime()) / 60000;

    const deltaAttempts = sample.attempts - previous.attempts;

    return {
      time: sample.at,
      value: elapsedMinutes > 0 ? deltaAttempts / elapsedMinutes : 0,
    };
  });
}

export function getTokensPerMinuteHistory(
  samples: ExperimentRunSample[],
): PerformanceDataPoint[] {
  return samples.map((sample, index) => {
    if (index === 0) {
      return {
        time: sample.at,
        value: 0,
      };
    }

    const previous = samples[index - 1];

    const elapsedMinutes =
      (new Date(sample.at).getTime() - new Date(previous.at).getTime()) / 60000;

    const deltaTokens = sample.total_tokens - previous.total_tokens;

    return {
      time: sample.at,
      value: elapsedMinutes > 0 ? deltaTokens / elapsedMinutes : 0,
    };
  });
}

function normalizeStatus(value: string | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

export function inferExperimentRunStateStatus(
  experimentRunMetadata: ExperimentRunMetadata,
): string {
  const explicitStatus = normalizeStatus(experimentRunMetadata.status);
  if (explicitStatus) {
    return explicitStatus;
  }
  return "queued";
}

export function getStatusTone(status: string): {
  label: string;
  description: string;
  badgeClass: string;
  dotClass: string;
  accent: string;
} {
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

export function getExperimentRunStateDisplayName(
  experimentRunState: ExperimentRunMetadata | null,
): string {
  if (!experimentRunState) {
    return "Select an experiment";
  }

  const record = experimentRunState as Record<string, unknown>;
  const experimentRunStateName = record.experiment_name;
  if (
    typeof experimentRunStateName === "string" &&
    experimentRunStateName.length > 0
  ) {
    return experimentRunStateName;
  }

  return "Untitled experiment";
}

export function getExperimentRunStateKey(
  ExperimentRunMetadata: ExperimentRunMetadata,
): string {
  return ExperimentRunMetadata.run_id;
}
