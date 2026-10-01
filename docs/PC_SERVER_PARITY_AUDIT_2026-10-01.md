# ALTIL PC ↔ Development/Test Server Parity Audit — 2026-10-01

## 1. Scope and method

This is an evidence report, not a remediation plan. The PC was assessed using the repository's redacted `env:report` mechanism, Git/runtime metadata, and the already accepted read-only PC database review. The report made only database `SELECT` and `information_schema` reads; it reports no secret values and makes no provider calls. No server connection was attempted: no server endpoint or already-authorized administrative session was available in the task context. The server remains **UNKNOWN / NOT CHECKED**.

No migration, database write, service restart, configuration edit, provider request, or deployment occurred. Because the server was not inspected, every server-side fact below is explicitly unknown.

## 2. Exact PC reference state

| Item | PC evidence |
|---|---|
| Repository branch / commit | `feature/cline-customer-commercial-journey` / `4c09a3e9633b7fe637b55a1238a6aec246c40662` |
| Working tree | `CLEAN` |
| Previous application commit | `e0ac48f` (the current freeze commit adds documentation) |
| Repository schema target | Migrations `001–036` |
| Runtime | Node `v24.16.0`, npm `11.13.0`, Windows 11 Pro, `win32` / `x64` |
| `package-lock.json` SHA-256 | `55968e8e7f63bdea1f585efa06f28c27f3b8cf7534d3bad37cf2c1c6220d07b0` |
| Selected installed packages | `mysql2 3.24.2`, `express 4.22.2`, `vite 6.4.3`, `typescript 5.8.3`, `tsx 4.23.13`, `bcryptjs 3.0.3` |
| PC database | `altil_db`, MariaDB `9.5.0`, `@@read_only=0` (accepted review) |
| PC database schema | 86 tables, 944 columns, 432 indexes, 79 foreign keys, 0 views, 0 triggers, 0 routines (accepted review) |
| Current schema fingerprint | `88431e3013749a772a6a8a8bd8935d497ac246ee56b98168be568a2abbb0cda1` |
| PC database migration state | `001–035` applied; `036` pending; migration status `DRIFT` against repository target |
| E2E database | `altil_e2e_test`, `001–036`; retained as the separate disposable E2E target; not queried during this audit |

The current PC package profile is reported as `MISSING`; `NODE_ENV` is unset (Node default is development). Configuration validation is **invalid** because `ALTIL_ENVIRONMENT` is missing, `PAYFAST_SANDBOX` is missing, and `IKHOKHA_MODE` is missing. `MARIADB_SSL` is configured, but its value is not reported. App URL/host/port variables are not configured in the report; the application code's documented default port is 3005. These are PC observations, not server assumptions.

## 3. Parity table

Statuses use only the requested classifications: `MATCH`, `DIFFERENT / INVESTIGATE`, `EXPECTED HOST DIFFERENCE`, `UNKNOWN`, `NOT CHECKED`.

| Category | PC | Server | Status |
|---|---|---|---|
| Git commit | `4c09a3e9633b7fe637b55a1238a6aec246c40662` | Not observed | UNKNOWN |
| Branch | `feature/cline-customer-commercial-journey` | Not observed | UNKNOWN |
| Working tree | Clean | Not observed | UNKNOWN |
| Node | `v24.16.0` | Not observed | UNKNOWN |
| npm | `11.13.0` | Not observed | UNKNOWN |
| OS | Windows 11 Pro | Not observed | UNKNOWN |
| Architecture | `x64` | Not observed | UNKNOWN |
| Lockfile | SHA-256 recorded above | Not observed | UNKNOWN |
| ALTIL environment | Missing; PC profile invalid | Not observed | UNKNOWN |
| Payment test mode | Required settings missing on PC | Not observed | UNKNOWN |
| Database version | MariaDB `9.5.0` | Not observed | UNKNOWN |
| Database | `altil_db` | Not observed | UNKNOWN |
| Migration state | `001–035`; `036` pending | Not observed | UNKNOWN |
| Schema fingerprint | `88431e3013749a772a6a8a8bd8935d497ac246ee56b98168be568a2abbb0cda1` | Not observed | UNKNOWN |
| IAM data | 1 user; 18 active sessions in accepted review | Not observed | UNKNOWN |
| Tenant/application data | 6 tenants; 101 applications; 101 API keys; 100 licenses; 82,591 usage rows | Not observed | UNKNOWN |
| Billing data | 116 invoices; 10 payment intents; 140 ledger entries; 5 refunds; 10 reconciliation batches/items; 130 journals; 285 journal lines | Not observed | UNKNOWN |
| Compliance data | 100 DSAR rows; detailed remaining counts not established here | Not observed | UNKNOWN |
| Audit data | 178 audit rows | Not observed | UNKNOWN |
| User-record parity | One PC IAM user; no identifiers reproduced | Not observed | UNKNOWN |
| Password equality | Not tested; hashes not exposed | Not observed | UNKNOWN |
| Encryption-key parity | PC knowledge-encryption variable configured; keyed fingerprint unavailable | Not observed | UNKNOWN |
| Provider credentials | Environment credentials not configured; database-backed provider secrets were not inspected | Not observed | UNKNOWN |
| Running commit/process | Not applicable to PC report | Not observed | UNKNOWN |
| nginx/proxy | Not applicable to local PC reference | Not observed | UNKNOWN |
| TLS | Not applicable to local PC reference | Not observed | UNKNOWN |

Operating-system and local-vs-hosted infrastructure differences would normally be assessed as `EXPECTED HOST DIFFERENCE`; no server observation exists to make that comparison in this audit.

## 4. Database comparison

The PC database remains the preserved incident/reference database at migrations `001–035`. The E2E database is separately recorded at `001–036`; neither database is made the server baseline by this report. The PC metadata report confirms MariaDB `9.5.0`, 86 tables, and the schema fingerprint above. The accepted review recorded 944 columns, 432 indexes, 79 foreign keys, and no views, triggers, or routines. It also recorded `@@read_only=0`.

No server database query was made. Server version, database identity, `@@read_only`, engine/charset/collation inventory, migration timestamps/checksums, object counts, and schema fingerprint are all **UNKNOWN**. No claim of schema or migration parity can be made.

## 5. Data-count comparison

PC counts shown in the parity table are from the accepted read-only review; where the review did not establish a count, it is omitted rather than inferred. No row data was dumped for this audit. Server counts were not collected. Count differences, if later found, will need interpretation; a difference alone is not proof of a defect.

## 6. Credential comparison

The PC report printed configuration presence only. It reports `ALTIL_ADMIN_EMAIL` and `ALTIL_ADMIN_PASSWORD` as configured, without exposing their values. The PC report found no configured environment AI or payment-provider credentials; provider credentials may be database-backed and were not inspected. The server's corresponding configuration is unknown.

The parity HMAC key is not configured on the PC, so no comparable keyed fingerprints are available. No server fingerprints were collected. Authentication is database-backed; the code has no dedicated `JWT_SECRET` or `SESSION_SECRET` environment setting according to the repository's parity contract. Password hashes were not read or compared. Therefore **PASSWORD EQUALITY = NOT VERIFIED** and user-record parity is **UNKNOWN**.

## 7. Encryption compatibility

The PC `ALTIL_KNOWLEDGE_ENCRYPTION_KEY` is configured, but no parity fingerprint is available. The PC `ALTIL_PROVIDER_VAULT_KEY` and key-file variables are not configured in the report; database-backed provider secret state was not inspected. No secret was compared, and no encrypted data was decrypted. Server key state and equality are unknown.

**CRYPTOGRAPHIC COMPATIBILITY = UNKNOWN.** Configuration presence alone would not prove that the server can decrypt PC ciphertext; independent databases may also legitimately use distinct keys.

## 8. Runtime and configuration comparison

PC runtime and selected package versions are recorded above. No server Node/npm versions, installed dependency versions, lockfile, process environment, application port, public/base URLs, API URLs, CORS behavior, callback URLs, proxy assumptions, background-job flags, provider-startup checks, or MFA configuration were observed. Provider reachability was explicitly not checked on the PC, and no providers were contacted.

The PC configuration is invalid for the documented `development-test` contract. Server configuration validity and semantic parity are unknown. Host-specific paths, ports, URLs, proxy addresses, and TLS termination cannot be compared without a server inspection.

## 9. nginx, TLS, and proxy

No server nginx, Cloudflare, TLS, certificate, proxy-target, or forwarded-header configuration was inspected. All are **UNKNOWN / NOT CHECKED**. No infrastructure changes were made.

## 10. Differences requiring investigation and unverifiable items

- PC runtime profile is invalid until its missing environment and payment test-mode settings are addressed through a separately approved configuration task.
- PC `altil_db` is at `001–035`; repository code expects `001–036`. This records state only and does not authorize migration or repair.
- PC MariaDB is `9.5.0`; the documented target is `10.11.18`; formal supported-version policy remains undecided.
- Server identity, repository, commit, runtime, configuration, database, data counts, running process, proxy, and TLS were not observed.
- User/password equality and required encryption-key compatibility are not established.
- Installed dependency correspondence to the lockfile was not verified beyond recording the PC lockfile hash and selected installed versions.
- No live login, endpoint, or provider test was performed.

## 11. Explicit conclusion

**A. Code:** No. The server cannot currently be demonstrated to run the same application revision as the PC; it was not inspected.

**B. Database:** No. Server database identity, schema, and migration state are unknown.

**C. User credentials:** No. Equivalent server user records and authentication state were not inspected; password equality was not tested.

**D. Encryption:** No. Required cryptographic compatibility is unknown because comparable fingerprints and server key evidence are unavailable.

**E. Overall:** We cannot state that “What works on the PC will work on the server in the same way.” The PC configuration itself currently fails the `development-test` contract, and the server evidence needed for code/runtime/database/configuration/user/key parity has not been collected.

This is an evidence report only. It makes no remediation recommendation and authorizes no changes. The server remains **UNKNOWN / NOT CHECKED**.
