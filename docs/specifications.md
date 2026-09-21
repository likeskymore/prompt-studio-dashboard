# Prompt Studio Dashboard

## 1. Overview

Prompt Studio Dashboard is a Next.js application for designing prompts, running experiments, and monitoring model performance. It provides dashboards for experiment execution, analysis, and prompt evaluation.

## 2. Technology Stack

- **Framework:** Next.js with the App Router
- **Language:** TypeScript
- **Styling:** Tailwind CSS and custom CSS
- **UI:** React components with reusable primitives
- **Charts:** Performance monitoring visualizations
- **API:** Next.js Route Handlers
- **Configuration:** Environment variables via `.env.local`
- **Code quality:** ESLint

## 3. Application Areas

### Prompt Design

Route:

```text
/monitoring/prompt-design
```

Used to create, edit, and refine prompts before running experiments.

### Experiment Runner

Route:

```text
/monitoring/experiment-runner
```

Used to configure and start experiment runs, select models, and monitor execution progress.

### Experiment Monitor

Route:

```text
/monitoring/experiment-monitor
```

Displays experiment metrics and performance data, including line-chart visualizations and metric cards.

### Analysis

Route:

```text
/monitoring/analysis
```

Provides tools for evaluating experiment results and comparing model or prompt performance.

## 4. Project Structure

```text
src/
├── app/
│   ├── layout.tsx                 # Root application layout
│   ├── providers.tsx              # Global providers
│   ├── (root)/                    # Main application routes
│   ├── (monitoring)/              # Monitoring feature routes
│   │   ├── analysis/
│   │   ├── experiment-monitor/
│   │   ├── experiment-runner/
│   │   └── prompt-design/
│   └── api/                       # Backend API routes
├── components/                    # Shared React components
├── config/                        # Application configuration
├── constants/                     # Shared constants
├── data-sources/                  # Data access abstractions
├── features/                      # Feature-specific modules
├── hooks/                         # Custom React hooks
├── lib/                           # Utility functions
├── services/                      # API and database services
├── style/                         # Global and feature styles
└── types/                         # Shared TypeScript types
```

## 5. API Endpoints

### Experiments

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/experiments` | Retrieve available experiments |
| `POST` | `/api/experiments` | Create an experiment |
| `GET` | `/api/experiments/states` | Retrieve supported experiment states |
| `GET` | `/api/experiment/[experimentId]` | Retrieve an experiment |
| `GET` | `/api/experiment/[experimentId]/models` | Retrieve models configured for an experiment |

### Experiment Runs

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/experiment-run/[runId]/state` | Retrieve the current run state |
| `GET` | `/api/experiment-run/[runId]/events` | Retrieve run events |
| `POST` | `/api/experiment-run/[runId]/pause` | Pause an experiment run |
| `POST` | `/api/experiment-run/[runId]/resume` | Resume an experiment run |

## 6. Data and Service Layers

The application separates data access from UI components.

### Data Sources

- `experimentDataSource.ts` provides experiment-related data.
- `monitoringDataSource.ts` provides monitoring and metric data.

### Services

- `api.ts` contains shared API helpers.
- `experimentApi.ts` handles experiment API operations.
- `monitoringApi.ts` handles monitoring API operations.
- `db.ts` contains shared database access utilities.
- `experimentDb.ts` handles experiment persistence.
- `monitoringDb.ts` handles monitoring persistence.

This structure allows the application to replace mock data or database implementations without changing the presentation layer.

## 7. Shared Components

- `TopNav` and side navigation provide application navigation.
- `Container` provides consistent page layout spacing.
- `ThemeToggle` switches between supported themes.
- UI primitives provide reusable buttons, menus, popovers, cards, and control panels.
- `MetricCard` displays a single monitoring metric.
- `PerformanceLineChart` visualizes performance trends over time.

## 8. State and API Flow

1. A user selects or creates an experiment.
2. The experiment runner starts an experiment run.
3. The backend creates and tracks the run state.
4. The monitoring UI polls or retrieves run state and events.
5. Metrics are displayed through cards and charts.
6. The analysis area presents results for evaluation.

## 9. Styling and Theming

Global styles are defined in:

```text
src/style/globals.css
```

Additional styles include:

- `dot-matrix.css` for dashboard background effects.
- Tailwind configuration in `tailwind.config.ts`.
- Theme management through `mode-theme-provider.tsx`.
- Theme switching through `theme-toggle.tsx`.

## 10. Configuration

Important configuration files:

- `.env.local` — local environment variables.
- `next.config.ts` — Next.js configuration.
- `tailwind.config.ts` — Tailwind CSS configuration.
- `tsconfig.json` — TypeScript configuration.
- `eslint.config.mjs` — ESLint configuration.
- `package.json` — dependencies and scripts.

Environment-specific values should be stored in `.env.local` and should not be committed to source control.

## 11. Development

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Build the application:

```bash
npm run build
```

Start the production server:

```bash
npm run start
```

Run linting:

```bash
npm run lint
```

The application is available at:

```text
http://localhost:3000
```

## 12. Extension Guidelines

When adding a new feature:

1. Create a route under `src/app`.
2. Add feature-specific components near the route or under `src/features`.
3. Define shared types under `src/types`.
4. Add API handlers under `src/app/api`.
5. Keep persistence logic in `src/services` or `src/data-sources`.
6. Reuse shared UI components where possible.
7. Keep environment-specific configuration outside source code.