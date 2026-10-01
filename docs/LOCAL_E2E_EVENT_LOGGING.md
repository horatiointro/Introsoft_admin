# ALTIL shared event logging and LOCAL E2E

## Shared event model

`src/logging/eventModel.ts` defines the versioned ALTIL event envelope used by production, development, and LOCAL E2E. `src/logging/eventLogger.ts` writes through configured persistence adapters. Production and ordinary development use the existing `audit_logs` table. LOCAL E2E uses that same table in its isolated database and also appends the same event to a structured JSON Lines file.

Events include timestamp, environment, request/correlation ID, actor, organization/tenant scope, category, action, resource, outcome, HTTP status, and authorization details when available. Request bodies, query strings, credentials, and response payloads are not recorded. Production events do not receive a `testRunId`; LOCAL E2E events carry a unique ID for each server start.

The protected `GET /api/v1/logs` endpoint reads persisted events. The Usage Logs screen uses that endpoint and labels LOCAL E2E events `TEST · LOCAL`, including the `testRunId`. The view is limited to the latest five days. Local files are stored under the ignored `.altil-data/logs/` directory and survive server restarts.

## LOCAL E2E startup

The real `server.ts` routes run on `127.0.0.1:3105`; the separate Vite frontend remains at `/admin-test/`. Startup uses a sanitized child environment and does not pass provider credentials. It skips provider verification, AI registry initialization, billing collection, tenant cleanup, and background schedulers.

The runner reads the local database host, port, username, and password from `.env` without printing those values. It accepts only the literal host `127.0.0.1` and always selects the fixed database name `altil_e2e_test`. It rejects `DATABASE_URL`, production mode, a different database name, or a missing explicit database allowlist. It never falls back to `altil_db`.

To create/reset only the allowlisted disposable database, apply the repository migrations, seed the deterministic local Super Admin, and start the real server:

```powershell
npm run dev:local-e2e:reset
```

To start again without resetting data:

```powershell
npm run dev:local-e2e
```

The reset command drops and recreates only `altil_e2e_test`; the startup command requires every checked-in migration to be applied and does not run migrations. Each start creates a new `testRunId` and a corresponding `events-<testRunId>.ndjson` file.

## Current workstation prerequisite

The database account currently present in this workstation's `.env` cannot create or access `altil_e2e_test`. The reset command was refused by the local database server before it changed a database. Do not point the runner at `altil_db` to work around this. A database operator must grant that local account access to the explicitly named disposable database, or provide a separate loopback-only test database service and credentials. Once that prerequisite is met, rerun the reset command before the real-route browser E2E.

This procedure does not authorize production access, provider calls, or changes to production configuration or data.
