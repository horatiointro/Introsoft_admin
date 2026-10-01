# ALTIL Server Read-Only Discovery — 2026-10-01

## Scope and stop condition

This report records the available PC reference evidence and the result of attempting to identify an approved, positively identifiable server access path. It does **not** claim a server inspection was completed.

The task requires an already-approved administrative connection and says to stop if the intended server cannot be positively identified. No ALTIL server endpoint or approved server session was provided. The local SSH configuration contains only the named alias `github.com`, which does not identify the ALTIL development/test server. No server connection or network probe was attempted. Therefore the intended server was not positively identified, and server inspection stopped here.

No server or PC database was queried for this report. No server or PC application/configuration state was changed. No migration, login, service operation, Git network operation, or external-provider request occurred.

## PC reference available at report time

| Item | PC observation |
|---|---|
| Current branch | `feature/cline-customer-commercial-journey` |
| Current PC commit | `859ee2fd41acfd771870e1ba3f6fdd3c8f8e4126` |
| Working tree before this report | Clean |
| Previous application commit | `e0ac48f` |
| Freeze record commit | `4c09a3e9633b7fe637b55a1238a6aec246c40662` |
| Repository schema target | Migrations `001–036` |
| PC `altil_db` | MariaDB `9.5.0`; migrations `001–035`; preserved incident/reference database |
| PC `altil_e2e_test` | Migrations `001–036`; isolated E2E database |
| PC lockfile SHA-256 | `55968e8e7f63bdea1f585efa06f28c27f3b8cf7534d3bad37cf2c1c6220d07b0` |
| PC runtime | Node `v24.16.0`; npm `11.13.0`; Windows 11 Pro; x64 |

The accepted PC parity report recorded invalid `development-test` configuration because `ALTIL_ENVIRONMENT`, `PAYFAST_SANDBOX`, and `IKHOKHA_MODE` were missing. That report also found no configured parity HMAC key, so it could not compare secret fingerprints. These are PC facts only; no server settings are inferred from them.

## Server evidence table

Statuses use only the requested values: `MATCH`, `DIFFERENT / INVESTIGATE`, `EXPECTED HOST DIFFERENCE`, `UNKNOWN`, `NOT CHECKED`.

| Item | Server observation | Status |
|---|---|---|
| Host identity | Not positively identified; no connection attempted | UNKNOWN |
| Git repository/path | Not inspected | UNKNOWN |
| Git commit | Not inspected | UNKNOWN |
| Branch | Not inspected | UNKNOWN |
| Working tree | Not inspected | UNKNOWN |
| Remote URL | Not inspected | UNKNOWN |
| Node | Not inspected | UNKNOWN |
| npm | Not inspected | UNKNOWN |
| OS | Not inspected | UNKNOWN |
| Architecture | Not inspected | UNKNOWN |
| Lockfile SHA | Not inspected | UNKNOWN |
| Installed dependencies | Not inspected | UNKNOWN |
| ALTIL environment | Not inspected | UNKNOWN |
| Payment test mode | Not inspected | UNKNOWN |
| Database target | Not inspected | UNKNOWN |
| MariaDB version | Not inspected | UNKNOWN |
| Database read-only flag | Not inspected | UNKNOWN |
| Migration state/timestamps/checksums | Not inspected | UNKNOWN |
| Schema fingerprint/counts | Not inspected | UNKNOWN |
| IAM counts | Not inspected | UNKNOWN |
| Tenant/application counts | Not inspected | UNKNOWN |
| Commercial counts | Not inspected | UNKNOWN |
| Billing counts | Not inspected | UNKNOWN |
| Compliance counts | Not inspected | UNKNOWN |
| Audit counts | Not inspected | UNKNOWN |
| User-record parity | Not inspected | UNKNOWN |
| Password equality | Not tested; no authentication attempted | UNKNOWN |
| Encryption/key configuration | Not inspected; no fingerprints available | UNKNOWN |
| Provider credentials | Not inspected | UNKNOWN |
| PM2/process identity and status | Not inspected | UNKNOWN |
| Running commit/source correspondence | Not inspected | UNKNOWN |
| Application port | Not inspected | UNKNOWN |
| nginx/proxy/Cloudflare | Not inspected | UNKNOWN |
| TLS/certificate | Not inspected | UNKNOWN |

## Comparison with PC

No server observations exist to compare with the PC. Consequently no parity row can be classified as `MATCH`, `DIFFERENT / INVESTIGATE`, or `EXPECTED HOST DIFFERENCE`. PC `altil_db` remains recorded at `001–035`; repository target remains `001–036`; the server migration state remains unknown. No claim is made about server database identity, contents, users, credentials, encryption compatibility, or running process.

## Critical questions

1. **Same Git revision?** Unknown; server Git state was not inspected.
2. **Same logical database/schema?** Unknown; server database was not inspected.
3. **Same database data?** Unknown; server data counts were not collected.
4. **Equivalent user records?** Unknown; server IAM data was not inspected.
5. **Password equality demonstrated safely?** No. Password equality is **NOT VERIFIED**; no hashes or credentials were read.
6. **Encryption secrets demonstrably compatible?** No. Secret equality is **NOT VERIFIED**; no server key state or comparable HMAC fingerprints were available.
7. **Does PM2 use the inspected checkout?** Unknown; no process or source path was inspected.
8. **Does nginx forward to that application instance?** Unknown; nginx/proxy configuration was not inspected.
9. **Is server configuration equivalent to the intended `development-test` profile?** Unknown; no server configuration was inspected. The PC's own profile was reported invalid.
10. **Can we state that PC behavior will work identically on the server?** No. Required server evidence is absent, and the PC profile itself does not currently pass its documented configuration contract.

## Evidence required to resume

The server operator must provide or establish the approved administrative connection and positively identify the intended development/test host. Until then, Git, runtime, PM2, redacted configuration, database/migration/schema, aggregate data, credential-fingerprint, encryption, nginx, and TLS evidence remain uncollected. This report records the blocker only; it authorizes no remediation or state change.
