# PromptStudio Dashboard

PromptStudio Dashboard is a Next.js application for monitoring experiment runs and inspecting their runtime performance. It loads data through the PromptStudio API and falls back to MySQL when the API is unavailable.

## Key features

- Monitor experiment status, timing, throughput, token usage, and request performance.
- Receive live updates through Server-Sent Events (SSE).
- Fall back to database polling when SSE is unavailable.
- View the language models associated with an experiment.
- Switch between light and dark themes.

## Requirements

- Node.js 20 or later
- npm
- Access to the PromptStudio API, a compatible MySQL database, or both

## Quick start

```bash
npm install
npm run dev
```

The dashboard is available at [http://localhost:3005](http://localhost:3005).

See the [Getting started guide](docs/getting-started.md) for environment configuration.

## Documentation

### For users

- [User guide](docs/user-guide.md): monitor experiment runs and interpret dashboard metrics.
- [Getting started](docs/getting-started.md): install and configure the dashboard.

### For developers

- [Developer guide](docs/developer-guide.md): development workflow, commands, and conventions.
- [Architecture](docs/architecture.md): project structure, data flow, and service layers.
- [Specifications](docs/specifications.md): application areas, routes, API endpoints, and extension guidelines.
- [Testing and quality](docs/testing.md): linting, builds, and manual validation.
- [Contributing](docs/contributing.md): contribution and documentation expectations.

## Development commands

```bash
npm run dev      # Start the development server on port 3005
npm run build    # Create a production build
npm run start    # Serve the production build
npm run lint     # Run ESLint
```

## Security

Keep `.env.local`, database credentials, API keys, private datasets, and generated output out of version control.

## License

This project is licensed under the GNU Lesser General Public License v2.1 only. See [LICENSE](LICENSE) for the full license text.

Unless a file states otherwise, source files in this repository are distributed under `LGPL-2.1` only.
