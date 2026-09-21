# Architecture

The dashboard uses a Next.js App Router frontend with server-side API routes and a data source layer that supports API and MySQL implementations.

## Project structure

```text
src/
├── app/          Next.js pages, layouts, and API route handlers
├── components/   Shared UI and navigation components
├── data-sources/ API-first services with database fallback logic
├── features/     Experiment domain models
├── lib/          Formatting and performance utilities
├── services/     External API and MySQL adapters
└── types/        Shared TypeScript types
```

## Data flow

1. The UI requests experiment or run data from a Next.js API route.
2. The data source layer tries the PromptStudio API first.
3. MySQL services provide fallback data when the API is unavailable.
4. Running experiments use the SSE events route for live updates.
5. The monitor falls back to five-second polling when SSE is unavailable.

## External API expectations

The configured API provides these logical endpoints relative to `NEXT_PUBLIC_API_HOST`:

- `/experiments/`
- `/experiments/[experimentName]/models`
- `/monitoring/states`
- `/monitoring/state/[runId]`
- `/monitoring/state/[runId]/events`

## Database fallback

The MySQL fallback reads from the `Experiment_run`, `Experiment`, `PromptConfig`, and `Llm` tables. The configured MySQL user requires read access to these tables.
