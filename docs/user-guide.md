# User guide

The PromptStudio Dashboard is used to inspect experiment runs and monitor their performance.

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
| `/experiment-config` | Experiment configuration route |
