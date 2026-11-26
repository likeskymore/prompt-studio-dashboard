import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ExperimentRunnerPage from "@/app/(monitoring)/experiment-runner/page";

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

function response(body: unknown, ok = true): Response {
  return {
    ok,
    json: async () => body,
  } as Response;
}

describe("ExperimentRunnerPage", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
    vi.spyOn(console, "log").mockImplementation(() => undefined);
  });

  it("selects and deletes an experiment, updating the visible list", async () => {
    fetchMock
      .mockResolvedValueOnce(
        response({ experiments: [{ id: 1, title: "demo experiment" }] }),
      )
      .mockResolvedValueOnce(response({ success: true }));
    const user = userEvent.setup();

    render(<ExperimentRunnerPage />);

    const deleteButton = screen.getByRole("button", {
      name: "Delete selected experiment",
    });
    expect(deleteButton).toBeDisabled();

    const experiment = await screen.findByRole("button", {
      name: "demo experiment",
    });
    await user.click(experiment);
    expect(deleteButton).toBeEnabled();

    await user.click(deleteButton);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenLastCalledWith("/api/experiment/1", {
        method: "DELETE",
      });
    });
    expect(
      await screen.findByText('Experiment "demo experiment" deleted successfully'),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "demo experiment" })).toBeNull();
    expect(deleteButton).toBeDisabled();
  });

  it("reruns the selected experiment and reports a failed request", async () => {
    fetchMock
      .mockResolvedValueOnce(response({ experiments: [{ id: 3, title: "A/B" }] }))
      .mockResolvedValueOnce(response({}, false));
    const user = userEvent.setup();

    render(<ExperimentRunnerPage />);

    await user.click(await screen.findByRole("button", { name: "A/B" }));
    await user.click(screen.getByRole("button", { name: "Rerun Experiment" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenLastCalledWith(
        "/api/experiments/run/A%2FB/rerun",
        { method: "POST" },
      );
    });
    expect(await screen.findByText("Failed to start experiment")).toBeInTheDocument();
  });

  it("links to the experiment monitor", () => {
    fetchMock.mockResolvedValue(response({ experiments: [] }));

    render(<ExperimentRunnerPage />);

    expect(
      screen.getByRole("link", { name: /Monitor Experiment/ }),
    ).toHaveAttribute("href", "/experiment-monitor");
  });
});
