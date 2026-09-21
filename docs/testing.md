# Testing and quality

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
