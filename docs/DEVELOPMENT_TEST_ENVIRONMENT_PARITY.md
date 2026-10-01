# ALTIL Development/Test Environment Contract

ALTIL currently has two deployment locations only: the developer PC and the dev-test server. Both use the `development-test` profile. `local-test` is reserved for the isolated LOCAL E2E harness. This contract does not define staging or production.

## Configuration contract

`src/config/environmentContract.mjs` is the shared source of truth for startup profile validation and database target resolution. `scripts/environmentReport.mjs` uses that same module. Runtime start and the migration CLI no longer silently fall back to discrete DB settings when a configured `DATABASE_URL` is malformed or points somewhere else.

| Purpose | Variables | Contract |
| --- | --- | --- |
| Environment identity | `ALTIL_ENVIRONMENT`, `NODE_ENV` | Regular PC/server runtime must set `ALTIL_ENVIRONMENT=development-test`; `NODE_ENV` must not be `production`. LOCAL E2E must use `ALTIL_ENVIRONMENT=local-test`. |
| Database | `DATABASE_URL` or `MARIADB_HOST`, `MARIADB_PORT`, `MARIADB_USER`, `MARIADB_PASSWORD`, `MARIADB_DATABASE`; optional `MARIADB_SSL`, `MARIADB_SSL_CA` | Use one complete target. If URL and discrete settings are both present, they must resolve to the same endpoint, database, user and password. Invalid or conflicting settings fail validation; no alternate target is tried. `MARIADB_SSL` accepts only `true`/`false`. |
| App URLs/listener | `APP_URL`, `ALTIL_PUBLIC_URL`, `BASE_URL`, `ALTIL_BASE_URL`, `HOST`, `PORT` | `PORT` defaults to 3005 in existing code when omitted. Hosted checkout must use an operator-supplied dev-test public URL; `.env.example` uses the reserved `.invalid` domain and is not deployable as-is. |
| Authentication/bootstrap | `ALTIL_MFA_ENABLED`, `ALTIL_ENABLE_SUPER_ADMIN_QUICK_ACCESS`, `ALTIL_ADMIN_EMAIL`, `ALTIL_ADMIN_PASSWORD`, `ALTIL_SUPER_ADMIN_BOOTSTRAP_*` | Optional feature/bootstrap settings. Bootstrap values are sensitive and must be supplied only in local ignored or server environment configuration. |
| Encryption/internal identity | `ALTIL_KNOWLEDGE_ENCRYPTION_KEY`, `ALTIL_PROVIDER_VAULT_KEY`, `ALTIL_PROVIDER_VAULT_KEY_FILE`, `ALTIL_INTERNAL_AI_API_KEY`, `ALTIL_INTERNAL_AI_KEY_FILE` | Keys are never printed. File paths are configuration, not key material. Encryption keys must match wherever the same encrypted database records are read. |
| AI | `GEMINI_API_KEY`, `OPENAI_API_KEY`, `OPENROUTER_API_KEY`, `OPENROUTER_BASE_URL`, `ALTIL_API_KEY`, `ALTIL_MODEL_FLEET_STATE` | Optional integration configuration. Presence is reported only; the parity command does not contact providers or validate paid connectivity. Provider account records can also be database-backed. |
| Payments | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `ALTIL_PAYMENT_WEBHOOK_SECRET`, `PAYFAST_MERCHANT_ID`, `PAYFAST_MERCHANT_KEY`, `PAYFAST_PASSPHRASE`, `PAYFAST_SANDBOX`, `IKHOKHA_APP_ID`, `IKHOKHA_APP_SECRET`, `IKHOKHA_API_URL`, `IKHOKHA_MODE` | Provider credentials are optional, but `development-test` requires `PAYFAST_SANDBOX=true` and `IKHOKHA_MODE=test`/`sandbox` even when credentials live in the DB. Any Stripe env key must use the test-key prefix. No credentials are printed or probed automatically by the report. |
| Communications | SMTP/Firebase credentials are stored encrypted in the database, not process environment variables. | The report marks this as database-backed and unchecked; it does not decrypt or expose credentials. `ALTIL_KNOWLEDGE_ENCRYPTION_KEY` must match when both runtimes read the same ciphertext. |
| Local E2E | `ALTIL_LOCAL_E2E`, `ALTIL_LOCAL_E2E_DATABASE`, `ALTIL_LOCAL_E2E_PORT`, `ALTIL_EVENT_ENVIRONMENT`, `ALTIL_TEST_MFA_CODE`, `ALTIL_TEST_MODEL`, `ALTIL_TEST_RUN_ID`, `ALTIL_LOCAL_LOG_FILE` | LOCAL E2E requires the explicit `127.0.0.1/altil_e2e_test` allowlist and `local-test` identity. It refuses `DATABASE_URL`. |
| Background behavior | `ALTIL_ENABLE_BACKGROUND_JOBS`, `ALTIL_ENABLE_PROVIDER_STARTUP_CHECKS` | Both default off for `development-test`; enabling background jobs opts into cleanup and billing collection. Provider startup checks separately opt into provider verification/catalog calls. LOCAL E2E always disables these jobs. |
| Parity-only | `ALTIL_PARITY_FINGERPRINT_KEY` | Optional, high-entropy key shared by the two report runs only when operators need secret equality comparison. The report prints HMAC fingerprints and a keyed check value, never the key or source secret. If the check values differ or either is absent, secret equality is `UNKNOWN`. |

No `JWT_SECRET`/`SESSION_SECRET`, SMTP environment variables, OAuth client variables, or CORS-origin variable were found in active application code. Authentication is database-backed. Gateway routes currently emit `Access-Control-Allow-Origin: *`. Several server/auth paths read `X-Forwarded-For` directly, without a centralized trusted-proxy setting; this is an explicit proxy-boundary discrepancy. Database-backed SMTP/Firebase is not inferred from environment-variable presence.

All variables are reported as `CONFIGURED` or `NOT CONFIGURED`; this is not proof that a remote provider accepted the value. Never put real credentials in `.env.example`, source, reports, command history, screenshots, or Git.

## Safe parity report

Run from the repository root on each machine after installing from the canonical npm lockfile:

```text
npm ci
npm run env:report -- --json
```

The report performs only `SELECT`/`information_schema` database reads. It reports app version, Git commit and working-tree state, Node/npm versions, package-lock fingerprint, selected installed package versions, MariaDB version, actual table/column/index/constraint schema fingerprint, migration state, environment profile, redacted configuration status, and optional keyed HMAC fingerprints. It performs no migrations, provider calls, or writes. Its nonzero exit status means config/database/schema is not ready/current; preserve the report output for comparison.

Compare the two redacted JSON reports on the PC:

```text
npm run env:compare -- pc-environment-report.json server-environment-report.json
```

The comparison requires the same commit, package-lock hash, Node/npm versions, selected installed dependency versions, operating system/architecture, database server version and exact applied/pending migration lists; both worktrees and configuration contracts must be clean/valid. Different operating systems are reported as a parity discrepancy that requires an explicit cross-platform compatibility review. Database host and account details are not printed. If the same database target or credentials are intended, compare their keyed fingerprints. A fingerprint comparison is valid only when `parityKeyCheck` matches. If it does not, secret equality remains unknown and must not be claimed.

## Values that must match, and values that may differ

Must match for a parity release: tested Git commit, package-lock dependency graph, Node/npm versions, actual schema fingerprint, exact migration state, and the `development-test` profile. The DB engine version is compared by the script. When both instances use the same database, their database target and credential fingerprints must match. When they use separate DB servers, endpoint/DB credentials may differ, but both must have the same schema/migration set and intended data lineage must be documented.

Encryption keys must match if both instances access the same encrypted rows. If the PC and server have independent database data, separate encryption keys are valid. Provider credentials may be environment-specific only when they intentionally identify the same test/sandbox integration behavior; the report cannot prove that without a deliberate connectivity test. No JWT/session secret environment setting exists in the current implementation, so the report does not claim a secret match for one.

Environment-specific values include database host/port when servers are separate, listener port, public URL, local file paths, local E2E run ID/log path, and provider credentials when separate test accounts are intentional. Record each intentional difference in the deployment notes; do not leave it implicit.

## Current PC evidence (2026-10-01)

- Branch: `feature/cline-customer-commercial-journey`; HEAD `80b68a0aa8256364b7f5a2576bd301222be6fd0c`.
- `package.json` still reports package name `react-example` and version `0.0.0`; treat the exact Git SHA as the only reliable app build identifier until a release version is assigned.
- PC is one commit ahead of `origin/feature/cline-customer-commercial-journey`; it has not been confirmed pushed.
  - The regular app’s local `.env` selects `altil_db`: MariaDB 9.5.0. During this parity task, an attempted inventory command unexpectedly invoked the migration runner in apply mode and applied migrations 024–035 to this PC database. A subsequent read-only report confirms 86 tables and migrations 001–035 applied. This local database change was unintended; no rollback was attempted.
  - The separate LOCAL E2E DB `altil_e2e_test` is MariaDB 9.5.0; migrations 035 and 036 were applied to it only. Migration 035's standalone verification SELECT executed successfully with a 98-column projection, all seven expected tables are present, and migration 035 is recorded. Before migration 035, six of those tables were already present and matched their expected 007/008 definitions; only `compliance_framework_configs` was absent, differing from the review's supplied seven-tables-absent baseline. Migration 036 adds nullable/defaulted DSAR repository compatibility fields while preserving existing DSAR rows.
- At the initial inventory the checkout was clean; it is now intentionally dirty with the local parity implementation and has no staged files. Node is v24.16.0 and npm is 11.13.0. `package-lock.json` is canonical for npm; a second tracked `bun.lock` exists and Bun is not installed on this PC.
- The dev-test server commit, runtime, configuration, database version and migration state have not been supplied. PC↔server parity is therefore **NOT DEMONSTRATED**.

  The read-only parity report itself performs no migration. The PC `altil_db` migration run described above was caused by invoking the migration CLI with an unsupported inventory option; the CLI defaults to apply mode. `scripts/migrate.js --status` is also not used as the read-only parity probe because the existing CLI creates `schema_migrations` if absent. `altil_e2e_test` was migrated only under the explicit loopback database allowlist.

## PC → Git → dev-test server procedure

1. On the PC, set `ALTIL_ENVIRONMENT=development-test` in ignored local configuration, run `npm ci`, `npm test`, `npm run typecheck`, `npm run build`, and save `npm run env:report -- --json` output. Confirm migration status is current before calling the build ready.
2. Review the exact diff and security scan. Commit the approved work locally and push that commit to the configured branch. Do not copy source files or arbitrary archives to the server.
3. On the dev-test server, fetch the branch and check out the exact approved commit. Require a clean working tree. Install with `npm ci`; do not use `npm install` to resolve drift.
4. Set server-specific values using the same documented variable contract and explicit `ALTIL_ENVIRONMENT=development-test`. Keep provider startup checks and billing/cleanup jobs disabled unless intentionally enabled for the test.
5. Run the same non-mutating environment report. Compare the reports. If migrations are pending, stop deployment and obtain explicit approval before applying them through `npm run db:migrate`; do not edit DB state manually.
6. After approved migration, regenerate the report and require matching exact commit, lockfile, runtime and migration lists. Then run tests/build, start or restart the service, and verify health plus a database-backed read. A running process alone is not deployment success.
7. Preserve both redacted reports and the exact commit SHA in the release/deployment record. Do not include `.env`, secret values, tokens, or provider credentials.

## Current blockers

1. PC `altil_db` now reports migrations 001–035 applied after the unintended local migration-runner invocation; the database/schema change requires owner review before it is treated as an approved baseline.
  2. PC `altil_e2e_test` now has migrations 035–036 applied; the seven-table/98-column verification for 035 passed and the DSAR contract repair in 036 is exercised by database-backed tests.
3. PC HEAD is one commit ahead of GitHub upstream, with additional parity work unstaged and uncommitted.
4. No dev-test server report exists, so server commit/schema/dependency/config parity is unknown.
5. `.env.example` cannot be used as runtime configuration until local/server URLs and required database credentials are supplied; its `.invalid` app URL is intentionally non-routable. The current local `.env` also lacks `ALTIL_ENVIRONMENT`, `PAYFAST_SANDBOX`, and `IKHOKHA_MODE`, so startup validation correctly refuses it until those non-secret profile/sandbox settings are explicitly supplied.
6. CORS is wildcard and no CORS environment contract is present.
7. Tracked `22.zip` and `5.zip` archives contain token-shaped strings that remain unclassified; `5.zip` also contains a credential-shaped non-loopback database URI. Do not distribute these archives until manually reviewed. Their archived `.env.example` URI entries were classified as loopback placeholders. No private-key marker was detected in the scanned archives.

Feature deployment must remain stopped until the unintended PC database migration is reviewed, the exact tested commit is available from Git, and a server report proves parity. This document and tooling do not authorize further migrations, push, deployment, or provider integration tests.
