import { ExperimentRunSample } from "@/features/experiment/models/ExperimentModels";

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
