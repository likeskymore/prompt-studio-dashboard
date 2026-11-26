import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/data-sources/experimentDataSource", () => ({
  experimentDataSource: {
    pauseExperimentRun: vi.fn(),
    resumeExperimentRun: vi.fn(),
  },
}));

import { POST as pauseRun } from "@/app/api/experiment-run/[runId]/pause/route";
import { POST as resumeRun } from "@/app/api/experiment-run/[runId]/resume/route";
import { experimentDataSource } from "@/data-sources/experimentDataSource";

describe("experiment run action routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  it("pauses a run and returns success", async () => {
    vi.mocked(experimentDataSource.pauseExperimentRun).mockResolvedValue();

    const response = await pauseRun(new Request("http://localhost"), {
      params: Promise.resolve({ runId: "run-1" }),
    });

    expect(experimentDataSource.pauseExperimentRun).toHaveBeenCalledWith("run-1");
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ success: true });
  });

  it("resumes a run and returns 503 when the data source fails", async () => {
    vi.mocked(experimentDataSource.resumeExperimentRun).mockRejectedValue(
      new Error("upstream unavailable"),
    );

    const response = await resumeRun(new Request("http://localhost"), {
      params: Promise.resolve({ runId: "run-2" }),
    });

    expect(experimentDataSource.resumeExperimentRun).toHaveBeenCalledWith("run-2");
    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      error: "Failed to resume experiment run",
    });
  });
});
