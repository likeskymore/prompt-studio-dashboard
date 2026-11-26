import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/data-sources/experimentDataSource", () => ({
  experimentDataSource: {
    rerunExperiment: vi.fn(),
  },
}));

import { POST } from "@/app/api/experiments/run/[experimentName]/rerun/route";
import { experimentDataSource } from "@/data-sources/experimentDataSource";

describe("POST /api/experiments/run/[experimentName]/rerun", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  it("starts the requested experiment run", async () => {
    vi.mocked(experimentDataSource.rerunExperiment).mockResolvedValue("started");

    const response = await POST(new Request("http://localhost"), {
      params: Promise.resolve({ experimentName: "demo experiment" }),
    });

    expect(experimentDataSource.rerunExperiment).toHaveBeenCalledWith(
      "demo experiment",
    );
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      success: true,
      message: "started",
    });
  });

  it("returns 503 when the run cannot start", async () => {
    vi.mocked(experimentDataSource.rerunExperiment).mockRejectedValue(
      new Error("backend unavailable"),
    );

    const response = await POST(new Request("http://localhost"), {
      params: Promise.resolve({ experimentName: "demo" }),
    });

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      error: "Failed to rerun experiment",
    });
  });
});
