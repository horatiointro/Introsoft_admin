# Authentication Security Boundary

## IAM record and role lookup

Production authentication is database-only. User lookup, role/permission lookup, and authorization assignment resolution return no usable identity or privileges when the database is unavailable or the lookup fails. A successful database miss is authoritative and is not replaced by a source-code demo identity.

In-memory demo identities are permitted when `NODE_ENV=test`, or in development only when `ALTIL_ENABLE_DEMO_IAM_FALLBACK=true`. Production always denies this fallback, including when that development flag is set. The test runner sets `NODE_ENV=test` for its child process only when the caller has not already selected an environment.

## Sessions

Production sessions must be created and resolved through MariaDB. A failed session write fails login; session lookup does not consult memory after a database miss or error. In-memory session storage remains limited to the permitted development/test modes. Production session revocation and listing do not fall back to in-memory session state.

## MFA configuration and remaining implementation

`ALTIL_MFA_ENABLED` is the explicit environment switch and is not inferred from `NODE_ENV`. `false` disables MFA in test/development and is included as the test/development example value. `true` enables it. Production deployment configuration must set `true`. Missing or invalid values default to enabled. The server prints only the resolved enabled state and a safe source label at startup.

When enabled, authentication requires a successful verifier result for accounts with MFA enabled/enforced and for every `SUPER_ADMIN`; the authenticated MFA step-up endpoint uses the same fail-closed verifier boundary. Missing, malformed, invalid, or unverifiable codes do not authenticate or verify. When disabled, login skips MFA without invoking a verifier, and step-up reports `disabled` rather than `verified`.

The IAM schema includes encrypted MFA credential storage, but this checkout has no implemented decryptor, TOTP/FIDO verifier, or secure verifier bootstrap configuration. Until a secure production verifier is implemented and configured to validate the existing credential format (including replay/rate-limit policy and key management), MFA-enabled production login and step-up will fail closed. This remains a production-readiness task. The verifier is injectable for deterministic synthetic tests; tests do not use production credentials or persist users.

## Super Admin quick access

`ALTIL_ENABLE_SUPER_ADMIN_QUICK_ACCESS=true` applies only outside production. Production denies the feature even when the flag is set. The route still requires the requested persisted account to be active and assigned the `SUPER_ADMIN` role.

## Seeded administrator migration

Migration `002_iam_auth.sql` is unchanged. Forward migration `033_neutralize_shared_seed_super_admin.sql` suspends only its exact seeded identity and revokes its active sessions after a different active global `SUPER_ADMIN` assignment exists. It preserves the row and other administrator accounts, does nothing when no replacement administrator is ready, and skips databases whose name clearly identifies a test database. Provision the intended administrator through the explicit bootstrap procedure before applying the forward migration in a production rollout. The in-memory LOCAL_TEST identity is outside this migration and is unchanged.

## Release artifact boundary

The repository has no general-purpose source release packager to extend. The normal application build bundles `server.ts` and does not include `altil-server-test.cjs`. That generated file is nevertheless tracked despite an ignore rule, so any future source/archive release process must explicitly exclude it, along with `22.zip`, `5.zip`, `scripts/run_audit_verification.ts`, and root `.env`. The root `.env` remains ignored. No broad packaging mechanism was added and no files were deleted. The generated server-test bundle also contains provider-key-shaped fixture literals; it was left unchanged because it is outside the normal application build and altering bundled provider fixtures could change that test artifact's behavior. Excluding it from any source release is the required boundary until its semantics are separately reviewed.
