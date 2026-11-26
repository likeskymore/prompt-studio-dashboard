import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ExperimentMonitor from "@/app/(monitoring)/experiment-monitor/page";

vi.mock("echarts-for-react", () => ({
  default: () => null,
}));

const runState = {
  experiment_id: 5,
  run_id: "run-1",
  experiment_name: "demo experiment",
  status: "running",
  created_at: "2026-01-01T10:00:00.000Z",
  started_at: "2026-01-01T10:00:00.000Z",
  updated_at: "2026-01-01T10:00:00.000Z",
  total_tasks: 4,
  attempts: 1,
  in_progress: 1,
  completed: 0,
  failed: 0,
  retries: 0,
  total_tokens: 10,
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

function response(body: unknown, ok = true): Response {
  return {
    ok,
    json: async () => body,
    body: null,
  } as Response;
}

describe("ExperimentMonitor", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  it("refreshes runs and pauses/resumes the selected run", async () => {
    fetchMock.mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);

      if (url === "/api/experiments/states") {
        return response({
          experiment_states: [
            {
              run_id: "run-1",
              experiment_name: "demo experiment",
              status: "running",
              updated_at: runState.updated_at,
            },
          ],
        });
      }
      if (url === "/api/experiment-run/run-1/state") {
        return response({ experiment_state: runState });
      }
      if (url === "/api/experiment/5/models") {
        return response({ models: [] });
      }
      if (url === "/api/experiment-run/run-1/events") {
        return response({}, false);
      }
      if (url === "/api/experiment-run/run-1/pause" && init?.method === "POST") {
        return response({ success: true });
      }
      if (url === "/api/experiment-run/run-1/resume" && init?.method === "POST") {
        return response({ success: true });
      }

      throw new Error(`Unexpected request: ${url}`);
    });
    const user = userEvent.setup();

    render(<ExperimentMonitor />);

    expect(await screen.findByRole("button", { name: "Pause" })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "demo experiment" }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Refresh experiments" }));
    await waitFor(() => {
      expect(
        fetchMock.mock.calls.filter(([url]) => url === "/api/experiments/states"),
      ).toHaveLength(2);
    });

    await user.click(screen.getByRole("button", { name: "Pause" }));
    expect(await screen.findByRole("button", { name: "Resume" })).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith("/api/experiment-run/run-1/pause", {
      method: "POST",
    });

    await user.click(screen.getByRole("button", { name: "Resume" }));
    expect(await screen.findByRole("button", { name: "Pause" })).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith("/api/experiment-run/run-1/resume", {
      method: "POST",
    });
  });

  it("shows a visible error when a run action fails", async () => {
    fetchMock.mockImplementation(async (input: RequestInfo | URL) => {
      const url = String(input);

      if (url === "/api/experiments/states") {
        return response({
          experiment_states: [
            {
              run_id: "run-1",
              experiment_name: "demo experiment",
              status: "running",
            },
          ],
        });
      }
      if (url === "/api/experiment-run/run-1/state") {
        return response({ experiment_state: runState });
      }
      if (url === "/api/experiment/5/models") {
        return response({ models: [] });
      }
      if (url === "/api/experiment-run/run-1/events") {
        return response({}, false);
      }
      if (url === "/api/experiment-run/run-1/pause") {
        return response({}, false);
      }

      throw new Error(`Unexpected request: ${url}`);
    });
    const user = userEvent.setup();

    render(<ExperimentMonitor />);
    await user.click(await screen.findByRole("button", { name: "Pause" }));

    expect(
      await screen.findByText("Failed to pause experiment run"),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Pause" })).toBeInTheDocument();
  });
});
