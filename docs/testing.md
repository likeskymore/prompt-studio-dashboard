# Testing and quality

## Automated tests

All automated tests live under `src/tests/`, grouped by test type:

```text
src/tests/
  serviceTest/  # API client and data-source tests
  pageTest/     # Frontend interaction and rendered-DOM tests
  routeTest/    # Next.js API route-handler tests
  integrationTest/  # Cross-page browser workflows
```

Run service, route-handler, and frontend component tests with:

```bash
npm test
```

Run the same tests in watch mode while developing with:

```bash
npm run test:watch
```

Run the browser-based experiment workflow with:

```bash
npx playwright install chromium
npm run test:integration
```

The end-to-end test stubs the API responses, so it does not require a configured
PromptStudio API or MySQL database. Component tests use accessible roles and
visible status text to verify interactions and rendered state.

GitHub Actions runs both test commands on every push.

## Linting

Run ESLint with:

```bash
npm run lint
```

## Production validation

Create a production build with:

```bash
npm run build
```

Run the production build locally with:

```bash
npm run start
```

## Manual checks

Before submitting a change, verify:

- The dashboard loads with the configured API and database settings.
- Experiment and run selection works.
- Running experiments receive live updates.
- The database polling fallback works when SSE is unavailable.
- Light and dark themes render correctly.
- Relevant routes and API handlers return expected data.
