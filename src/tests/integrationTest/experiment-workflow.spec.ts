import { expect, test } from "@playwright/test";

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

test("starts an experiment from the runner and controls it from monitoring", async ({
  page,
}) => {
  const observedRequests: string[] = [];

  await page.route("**/api/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    observedRequests.push(`${request.method()} ${url.pathname}`);

    if (url.pathname === "/api/experiments" && request.method() === "GET") {
      await route.fulfill({
        json: { experiments: [{ id: 5, title: "demo experiment" }] },
      });
      return;
    }

    if (
      url.pathname === "/api/experiments/run/demo%20experiment/rerun" &&
      request.method() === "POST"
    ) {
      await route.fulfill({ json: { success: true, message: "started" } });
      return;
    }

    if (url.pathname === "/api/experiments/states") {
      await route.fulfill({
        json: {
          experiment_states: [
            {
              run_id: "run-1",
              experiment_name: "demo experiment",
              status: "running",
              updated_at: runState.updated_at,
            },
          ],
        },
      });
      return;
    }

    if (url.pathname === "/api/experiment-run/run-1/state") {
      await route.fulfill({ json: { experiment_state: runState } });
      return;
    }

    if (url.pathname === "/api/experiment/5/models") {
      await route.fulfill({ json: { models: [] } });
      return;
    }

    if (url.pathname === "/api/experiment-run/run-1/events") {
      await route.fulfill({
        status: 200,
        contentType: "text/event-stream",
        body: `event: snapshot\ndata: ${JSON.stringify(runState)}\n\n`,
      });
      return;
    }

    if (
      url.pathname === "/api/experiment-run/run-1/pause" &&
      request.method() === "POST"
    ) {
      await route.fulfill({ json: { success: true } });
      return;
    }

    if (
      url.pathname === "/api/experiment-run/run-1/resume" &&
      request.method() === "POST"
    ) {
      await route.fulfill({ json: { success: true } });
      return;
    }

    await route.fulfill({ status: 404, json: { error: "Unexpected API request" } });
  });

  await page.goto("/experiment-runner");
  await page.getByRole("button", { name: "demo experiment" }).click();
  await page.getByRole("button", { name: "Rerun Experiment" }).click();
  await expect(
    page.getByText('Experiment "demo experiment" started successfully'),
  ).toBeVisible();
  await expect.poll(() => observedRequests).toContain(
    "POST /api/experiments/run/demo%20experiment/rerun",
  );

  await page.getByRole("link", { name: /Monitor Experiment/ }).click();
  await expect(page).toHaveURL(/\/experiment-monitor$/);
  await expect(page.getByRole("heading", { name: "demo experiment" })).toBeVisible();
  await page.getByRole("button", { name: "Pause" }).click();
  await expect(page.getByRole("button", { name: "Resume" })).toBeVisible();
  await page.getByRole("button", { name: "Resume" }).click();
  await expect(page.getByRole("button", { name: "Pause" })).toBeVisible();

  expect(observedRequests).toContain("POST /api/experiment-run/run-1/pause");
  expect(observedRequests).toContain("POST /api/experiment-run/run-1/resume");
});
