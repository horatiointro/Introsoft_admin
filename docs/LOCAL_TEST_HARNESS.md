# ALTIL Local Test Harness

## Purpose and boundary

This isolated harness supports authenticated local inspection of the Phase 4 / Stage A–F UI. It is not a production deployment mechanism and does not emulate production data or prove production behavior.

The standalone `server.local-test.ts` entrypoint serves a small Express adapter on `127.0.0.1:3105`. It never imports `server.ts`, database repositories, migrations, billing jobs, cleanup jobs, or provider integrations. Its API responses are deterministic, synthetic and in memory. All API writes are denied; process termination discards session state. The separate `vite.local-test.config.ts` serves the existing UI on `127.0.0.1:5173/admin-test/` and proxies its API requests to loopback port 3105.

The Finance / Commercial lifecycle UI uses the existing six `stageFSyntheticScenarios` fixtures directly. A separate LOCAL TEST technical tenant supports tenant portal navigation and remains commercially UNLINKED. Existing Customer 360 UI must continue to display UNKNOWN commercial identity unless its own verified source is supplied; the harness does not infer one.

## Start

Use two PowerShell terminals from the repository directory. Do not load `.env` into either process.

Terminal 1 (backend):

```powershell
$env:ALTIL_LOCAL_TEST_HARNESS = 'true'
npm run dev:local-test
```

Terminal 2 (frontend):

```powershell
npm run dev:local-test:frontend
```

Open `http://127.0.0.1:5173/admin-test/`. The harness refuses production mode, the `altil_db` database name, non-loopback database/deployment hosts, migration-enabled configuration, and configured external AI/payment provider credentials. It binds only to loopback and port 3105. Do not set real provider credentials in the harness process environment.

## LOCAL TEST authentication

Use the synthetic identity below in the existing sign-in form:

- Email: `local-test@altil.invalid`
- Password: `local-test-password`
- MFA: `000000`
- Initial tenant selector: `Total Company Scope` (the harness always constrains the returned session and data to `local-test-tenant`).

This deterministic identity is marked `LOCAL TEST ONLY`, uses the standard UI login request and bearer-token session shape, and is not a production account. Super Admin quick access is unavailable. The harness does not use or modify production authentication.

### Synthetic Super Admin walkthrough identity

The harness also exposes one deterministic, in-memory-only test identity for authenticated Super Admin UI walkthroughs:

- Email / login: `supertest@introsoft.co.za`
- Password: `supertest`
- MFA: `000000`
- Role: `super_admin`
- Tenant: `local-test-tenant`
- Display name: `LOCAL TEST SUPERTEST`
- Environment marker: `LOCAL_TEST`

**LOCAL TEST ONLY — these credentials are synthetic, in-memory, local-test-only credentials and must never be used or enabled in production.** Enter the email address above as the actual login identifier in the normal sign-in form. The standard `POST /api/v1/auth/login` route verifies the password and MFA, then issues the harness's ordinary bearer token. The session and identity are held only in process memory. No username alias, shortcut, or quick-access endpoint is used. The harness pins the returned identity and all exposed data to `local-test-tenant`, even if the form's initial scope selector says Total Company Scope.

The password is bcrypt-verified against an in-memory harness fixture. Authenticated session identity is held only in process memory and disappears when the harness stops. The account is exposed only after the explicit harness flag passes validation and `NODE_ENV` is not `production`.

## Inspect and stop

- Health check: `http://127.0.0.1:3105/health` reports database, providers and persistence as false.
- The app exposes only authenticated read endpoints needed for UI inspection; writes return HTTP 405. Requests to another tenant's portal return not found.
- Inspect harness tests with `npm run test:local-harness`.
- Stop each process with `Ctrl+C`. No database or persistent test store exists to clean up.

The harness source contains no database client, migration runner, billing/cleanup scheduler, or provider client import. Starting it must not be used as evidence that any production path is deployed or functioning.
