# Platform Super Admin bootstrap

## Identity and authorization

The bootstrap targets the existing IAM identity for `horatio@introsoft.co.za`. It uses `iam_users`, the existing system role `SUPER_ADMIN`, the existing permission catalogue, `iam_user_roles`, and `iam_role_permissions`. It does not create a parallel user or authorization store.

The grant is represented explicitly as `iam_user_roles.tenant_id = NULL` and `access_scope = 'GLOBAL'`. The existing authorization context only treats that combination as global when its role is exactly `SUPER_ADMIN`. A missing tenant or a role name alone does not grant global access.

The command requires schema migration `024_iam_authorization_scopes.sql` to already be recorded in `schema_migrations`. It never runs migrations. If that migration is absent, it rolls back and exits.

## Protected bootstrap execution

The bootstrap is opt-in and has no effect when imported. To run it, an operator must provide the password through `ALTIL_SUPER_ADMIN_BOOTSTRAP_PASSWORD`, explicitly confirm the exact account email with `ALTIL_SUPER_ADMIN_BOOTSTRAP_CONFIRM_EMAIL`, and confirm the exact configured database host and database name with `ALTIL_SUPER_ADMIN_BOOTSTRAP_CONFIRM_HOST` and `ALTIL_SUPER_ADMIN_BOOTSTRAP_CONFIRM_DATABASE`. The operator must also pass `--apply`.

Supply those values through the host's protected secret/environment injection mechanism. Do not put a password value in a command transcript, source file, `.env.example`, migration, fixture, test, log, API response, or frontend bundle. The bootstrap never prints the password, its bcrypt hash, database credentials, or the database target.

The password is bcrypt-hashed before persistence. A newly created identity is marked for password change at first use; the existing password-change policy requires a stronger replacement. Existing identity profile fields, account status, and password are not overwritten. Inactive identities and duplicate matching identities stop the bootstrap for manual review.

The identity, global role assignment, links to all permissions already present in the IAM catalogue, and an audit event are written in one database transaction. Repeated executions reconcile the grant without creating another identity. Because MariaDB permits multiple `NULL` values in unique keys, the bootstrap locks and checks the designated user's assignment and fails on duplicate assignments rather than relying on nullable-key uniqueness. The event identifies its actor as `SYSTEM_BOOTSTRAP`; the current CLI has no authenticated human-operator identity to record, so that remains an audit attribution limitation.

Example invocation shape (no secret values shown):

```powershell
npx tsx scripts/bootstrap_super_admin.ts --apply
```

The example does not supply the required environment values. This task did not invoke the command or connect to any database.

## Current authentication limits

After bootstrap, login uses the existing `IamRepository.authenticate()` bcrypt verifier, session store, `/auth/login` route, `requireAuthentication`, and authorization context. The bootstrap itself hashes with the same bcrypt-compatible mechanism and does not issue a session. The existing login code does not currently verify the supplied MFA code. This bootstrap therefore does not claim MFA enforcement. The new identity starts with MFA disabled rather than setting an unprovisioned MFA flag that the current login flow does not enforce.

## Navigation and capability boundary

The sidebar now exposes a **Platform Administration** section for the current organization, IAM, application, credential, customer, licensing, finance, provider, policy, trust, compliance, audit, FinOps, integrations, and settings views. It routes to existing view identifiers; it does not add API routes or CRUD handlers. Several existing destinations still share existing components or have only partial backend support. Navigation visibility does not establish server-side permission coverage, mutation auditing, or data persistence for those resources.

## Not done by this bootstrap

- No database connection, identity creation, migration, or production operation was performed while implementing this mechanism.
- No new migration was added. Migration 024 is a pre-existing untracked working-tree migration and must be reviewed/applied through the separately controlled migration process before this bootstrap can run.
- The bootstrap audit event records the identity/grant operation only. This change does not retrofit durable audit events onto every existing Super Admin mutation.
- Full CRUD coverage, route-by-route authorization, lifecycle protections, MFA verification, and a browser login using the persisted identity still require separate validation.
