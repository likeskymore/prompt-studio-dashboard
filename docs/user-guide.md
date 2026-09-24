# User guide

The PromptStudio Dashboard is used to inspect experiment runs and monitor their performance.

## Rerun an existing experiment

1. Open `/experiment-runner`.
2. Select an experiment from the list.
3. Select **Run Experiment** to start a new run using that experiment.
4. Check the status message beside the controls to confirm whether the run started successfully.
5. Select **Monitor Experiment** to open the monitoring view and inspect the new run.

The runner uses the saved experiment definition as-is. To remove an experiment, select it and choose **Delete Experiment**. Deletion cannot be undone from the dashboard.

## Monitor an experiment

Open `/experiment-monitor` to view available experiments and runs. Select a run to inspect its current state and metrics.

The monitor displays information such as:

- Run status and timing
- Throughput
- Token usage
- Request performance
- Associated language models

## Live updates

Running experiments receive updates through Server-Sent Events (SSE). If the SSE endpoint is unavailable, the dashboard falls back to polling the database every five seconds.

Completed runs are loaded from their current state rather than using a live event stream.

## Themes

Use the theme control to switch between light and dark mode.

## Available routes

| Route | Purpose |
| --- | --- |
| `/experiment-monitor` | Monitor experiment runs and inspect metrics |
| `/analysis` | Analysis view; currently a placeholder |
| `/experiment-runner` | Experiment rerunning page |
