# ALTIL Development Baseline Freeze — 2026-10-01

## Freeze status

**BASELINE FREEZE ACTIVE.** This record captures the accepted read-only PC database review and Baseline Decision Package. It authorizes no application, database, migration, environment, server, or deployment changes.

## Repository and schema target

- Branch: `feature/cline-customer-commercial-journey`
- Commit at freeze: `e0ac48f`
- Working tree at freeze: clean
- Repository schema target: migrations `001–036`

## Database state

| Environment | Recorded state | Treatment during freeze |
|---|---|---|
| PC `altil_db` | Migrations `001–035`; substantial existing development data; MariaDB `9.5.0` | Incident/reference database. Preserve unchanged pending an explicit baseline decision. |
| PC `altil_e2e_test` | Migrations `001–036` | Disposable E2E database. Preserve; it does not establish the development-data or server baseline. |
| Development/test server | **UNKNOWN / not inspected** | No connection or changes authorized. |

The exact distinction is:

```text
Repository schema target = 001–036
PC altil_db = incident/reference database at 001–035
PC altil_e2e_test = disposable E2E database at 001–036
Development/test server = UNKNOWN
```

No baseline has yet been approved for `altil_db`. It is intentionally preserved pending that decision; it is not designated as requiring repair.

## Migration 036

Migration 036 is present in the repository, applied to `altil_e2e_test`, and pending on `altil_db`. **No migration or database repair is authorized during this freeze.** In particular, do not run migration 036 against `altil_db`.

## MariaDB compatibility decision

The PC review recorded MariaDB `9.5.0`; the documented target is `10.11.18`. The formally supported ALTIL version range remains undecided. Do not upgrade or downgrade either environment as part of this freeze.

## Required future work, after separate approval

1. **Backup:** Before any future `altil_db` change, create a complete logical backup to a new protected location, including schema, data, migration history, indexes, foreign keys, triggers, routines, and character-set/collation information. Protect it as sensitive data; record a manifest and SHA-256 digest without reporting credentials. Independently verify the backup. Do not overwrite or delete the original, and do not restore it without explicit authorization.
2. **Candidate copy:** Only after the backup is verified and a candidate is approved, restore a representative copy into a separately named isolated candidate database. Preserve relevant DSAR, tenant, user, customer, billing, application/API, and audit relationships. Sanitize or invalidate credentials and personal data in the candidate before application access. Keep both existing PC databases unchanged. Validate migration 036 on that candidate only after separate approval.
3. **Server parity:** Before any server deployment decision, perform a read-only parity inspection establishing Git commit and working-tree state; Node/npm, OS, architecture and lockfile; database engine/version/name, migration state and schema fingerprint; configuration profile; payment test mode; provider configuration state; and safe secret fingerprints. The server remains uninspected and unknown until that is done.

## Freeze boundary

Until an explicit baseline decision and separate authorization, do not run migrations; modify, rebuild, reset, roll back, or repair either database; create a candidate database; change environment files or application code; contact the development/test server or external providers; deploy; or rewrite/push Git history. This document records evidence and intended future checks only; it does not claim that a backup, candidate restore, migration validation, or server inspection has occurred.
