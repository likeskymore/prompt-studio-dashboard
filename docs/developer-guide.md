# Developer guide

This guide describes the dashboard development workflow and conventions.

## Tech stack

- Next.js 16 with the App Router
- React 19 and TypeScript
- Tailwind CSS 4
- ECharts for performance charts
- MySQL through `mysql2`
- ESLint with the Next.js configuration

## Development commands

```bash
npm run dev      # Start development mode on port 3005
npm run build    # Create a production build
npm run start    # Serve the production build
npm run lint     # Run ESLint
```

Run `npm run build` before starting the production server.

## Environment

Keep local configuration and credentials in `.env.local`. Do not commit environment files, database credentials, API keys, private datasets, or generated output.

## Adding a feature

1. Add the route under `src/app`.
2. Place reusable UI in `src/components` or feature-specific UI near its feature.
3. Define shared types under `src/types`.
4. Add API handlers under `src/app/api` when required.
5. Keep API and database access in `src/services` and `src/data-sources`.
6. Update the relevant documentation.
