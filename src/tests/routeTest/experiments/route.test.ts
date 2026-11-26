import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/data-sources/experimentDataSource", () => ({
  experimentDataSource: {
    getAllExperiments: vi.fn(),
  },
}));

import { GET } from "@/app/api/experiments/route";
import { experimentDataSource } from "@/data-sources/experimentDataSource";

describe("GET /api/experiments", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  it("returns the experiment list in the frontend response shape", async () => {
    vi.mocked(experimentDataSource.getAllExperiments).mockResolvedValue([
      { id: 1, title: "demo" },
    ]);

    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      experiments: [{ id: 1, title: "demo" }],
    });
  });

  it("returns 503 when the data source fails", async () => {
    vi.mocked(experimentDataSource.getAllExperiments).mockRejectedValue(
      new Error("database unavailable"),
    );

    const response = await GET();

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      error: "Failed to fetch experiments",
    });
  });
});
