# Best Practices Notes (Non-Breaking)

This project currently keeps service logic in single `server.js` files.  
Core behavior is unchanged; these are recommended next steps for structure quality:

## 1) Environment Management

- Keep real secrets in `.env` (never commit secrets).
- Commit only `.env.example` files for each module.
- Keep URL defaults in code only as fallback.

## 2) Communication Rules

- Frontend -> services: via API gateway routes.
- Service -> service: direct URLs from each service `.env`.

## 3) Suggested Gradual Refactor

For each service:

- `src/routes` for route wiring
- `src/controllers` for HTTP handlers
- `src/services` for business logic/integrations
- `src/models` for mongoose schemas
- `src/config` for env and constants

Keep `server.js` as a thin bootstrap/entrypoint.

## 4) Reliability

- Add request validation for all write endpoints.
- Add consistent error response shape.
- Add request id and structured logs.
- Add smoke tests for `health`, auth, tracking update, and notification flow.

