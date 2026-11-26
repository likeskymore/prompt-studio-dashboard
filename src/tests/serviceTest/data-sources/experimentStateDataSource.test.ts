import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/services/experimentStateApi", () => ({
  experimentStateApiService: {
    getAllExperimentStatesMetadata: vi.fn(),
    subscribeToExperimentRun: vi.fn(),
    getExperimentRunState: vi.fn(),
  },
}));

vi.mock("@/services/experimentStateDb", () => ({
  experimentStateDbService: {
    getAllExperimentStatesMetadata: vi.fn(),
    getExperimentRunState: vi.fn(),
  },
}));

import { experimentStateDataSource } from "@/data-sources/experimentStateDataSource";
import type { ExperimentRunState } from "@/features/experiment/models/ExperimentModels";
import { experimentStateApiService } from "@/services/experimentStateApi";
import { experimentStateDbService } from "@/services/experimentStateDb";

const state: ExperimentRunState = {
  experiment_id: 1,
  run_id: "run-1",
  experiment_name: "demo",
  status: "running",
  created_at: "2026-01-01T10:00:00.000Z",
  updated_at: "2026-01-01T10:00:00.000Z",
  total_tasks: 0,
  attempts: 0,
  in_progress: 0,
  completed: 0,
  failed: 0,
  retries: 0,
  total_tokens: 0,
  total_latency_ms: 0,
  latency_count: 0,
  min_latency_ms: 0,
  p25_latency_ms: 0,
  p50_latency_ms: 0,
  p75_latency_ms: 0,
  p95_latency_ms: 0,
  p99_latency_ms: 0,
  max_latency_ms: 0,
  latency_samples: [],
  samples: [],
};

describe("experimentStateDataSource", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("falls back to the database when state metadata API fails", async () => {
    vi.mocked(
      experimentStateApiService.getAllExperimentStatesMetadata,
    ).mockRejectedValue(new Error("API unavailable"));
    vi.mocked(
      experimentStateDbService.getAllExperimentStatesMetadata,
    ).mockResolvedValue([state]);

    await expect(
      experimentStateDataSource.getAllExperimentStatesMetadata(),
    ).resolves.toEqual([state]);
  });

  it("polls database state after SSE fails and stops polling on abort", async () => {
    vi.useFakeTimers();
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    vi.mocked(
      experimentStateApiService.subscribeToExperimentRun,
    ).mockRejectedValue(new Error("SSE unavailable"));
    vi.mocked(
      experimentStateDbService.getExperimentRunState,
    ).mockResolvedValue(state);
    const controller = new AbortController();
    const onData = vi.fn();

    await experimentStateDataSource.subscribeToExperimentRun("run-1", {
      signal: controller.signal,
      onEvent: vi.fn(),
      onData,
    });

    expect(onData).toHaveBeenCalledTimes(1);
    expect(onData).toHaveBeenCalledWith(state);

    await vi.advanceTimersByTimeAsync(5000);
    expect(onData).toHaveBeenCalledTimes(2);

    controller.abort();
    await vi.advanceTimersByTimeAsync(5000);
    expect(onData).toHaveBeenCalledTimes(2);
  });
});
