import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/services/experimentApi", () => ({
  experimentApiService: {
    getAllExperiments: vi.fn(),
    getExperimentModels: vi.fn(),
    pauseExperimentRun: vi.fn(),
    resumeExperimentRun: vi.fn(),
    deleteExperiment: vi.fn(),
    rerunExperiment: vi.fn(),
  },
}));

vi.mock("@/services/experimentDb", () => ({
  experimentDbService: {
    getAllExperiments: vi.fn(),
    getExperimentModels: vi.fn(),
    deleteExperiment: vi.fn(),
  },
}));

import { experimentDataSource } from "@/data-sources/experimentDataSource";
import { experimentApiService } from "@/services/experimentApi";
import { experimentDbService } from "@/services/experimentDb";

describe("experimentDataSource", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns experiments from the API without querying the database", async () => {
    vi.mocked(experimentApiService.getAllExperiments).mockResolvedValue({
      statusCode: 200,
      responseCode: "OK",
      body: { experiments: [{ id: 1, title: "demo" }] },
    });

    await expect(experimentDataSource.getAllExperiments()).resolves.toEqual([
      { id: 1, title: "demo" },
    ]);
    expect(experimentDbService.getAllExperiments).not.toHaveBeenCalled();
  });

  it("falls back to the database when the API fails", async () => {
    vi.mocked(experimentApiService.getAllExperiments).mockRejectedValue(
      new Error("API unavailable"),
    );
    vi.mocked(experimentDbService.getAllExperiments).mockResolvedValue([
      { id: 2, title: "database experiment" },
    ]);

    await expect(experimentDataSource.getAllExperiments()).resolves.toEqual([
      { id: 2, title: "database experiment" },
    ]);
    expect(experimentDbService.getAllExperiments).toHaveBeenCalledOnce();
  });

  it("uses the database fallback when the models endpoint fails", async () => {
    vi.mocked(experimentApiService.getExperimentModels).mockRejectedValue(
      new Error("API unavailable"),
    );
    vi.mocked(experimentDbService.getExperimentModels).mockResolvedValue([
      { id: 7, name: "Model A", model: "model-a", base_model: "base-a" },
    ]);

    await expect(experimentDataSource.getExperimentModels(42)).resolves.toEqual([
      { id: 7, name: "Model A", model: "model-a", base_model: "base-a" },
    ]);
    expect(experimentDbService.getExperimentModels).toHaveBeenCalledWith(42);
  });
});
