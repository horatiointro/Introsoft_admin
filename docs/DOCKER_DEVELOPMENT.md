# ALTIL Docker development/demo environment

This Compose setup is for a local, isolated development/demo environment. It
uses the same Linux image for the app and explicit migration operation, runs as
an unprivileged user, keeps MariaDB and ALTIL state in named volumes, and binds
the browser port to loopback. It does not configure production or authorize
access to any existing PC/server database.

The container serves the compiled Vite assets while retaining the
`development-test` side-effect policy. This avoids depending on source-only
Vite entry files in the runtime image.

The MariaDB service is initialized with `utf8mb4_unicode_ci`, matching the
historical table definitions that migrations reference by foreign key. Keep
this default stable for new Compose volumes; the schema's migration history
contains tables whose defaults otherwise differ from the server default.

## Prerequisites and initial setup

Install Docker Desktop (Windows) or Docker Engine plus Compose (Linux). Copy
`.env.docker.example` to `.env.docker` and replace both password placeholders
with unique local-only values. Keep `.env.docker` out of Git. Do not copy values
from a server environment.

The image pins Node `22.23.3` and MariaDB `10.11.18` by registry digest, following the supplied
server/runtime description and documented MariaDB target. Those server facts
were not independently inspected in this work. Reconfirm the target versions
before relying on this image for parity or deployment.

Build the image and start only the database:

```sh
docker compose --env-file .env.docker -f compose.demo.yaml build
docker compose --env-file .env.docker -f compose.demo.yaml up -d mariadb
```

Apply migrations as a deliberate one-shot action against this Compose project's
new `altil_demo` database:

```sh
docker compose --env-file .env.docker -f compose.demo.yaml --profile operations run --rm migrate
```

The migration command is intentionally separate from normal startup. Review
pending SQL and confirm the Compose database target before running it. Do not
point these commands at `altil_db`, `altil_e2e_test`, or a server. The migration
CLI's `--status` mode uses `SELECT`/`SHOW` only, including when its tracking
table is absent.

## Test Super Admin identities

The demo Compose profile supports two persisted test-only global Super Admin
accounts using the normal password, MFA, session, authorization, and database
IAM paths. Super Admin quick access remains disabled. The MFA code is a fixed
test fixture for only the two stable account IDs; it is not genuine MFA and is
not permitted by the production environment validator. Do not expose this
development-test profile or its credentials to production systems.

Set the two test passwords only in the ignored `.env.docker` file or the test
server's protected environment. Remove them from `.env.docker` after
provisioning and keep the team's login details in its approved password vault.
Then run the explicit one-shot provisioner:

```sh
docker compose --env-file .env.docker -f compose.demo.yaml --profile operations run --rm provision-test-super-admins
```

The provisioner requires exact database and host confirmation, requires the
existing global `SUPER_ADMIN` role and authorization-scope migration 024, hashes
passwords before storage, refuses to alter an existing email, and writes audit
events. It never logs passwords or hashes. Run it only after verifying the
target is a disposable test database. It does not create or run migrations.

The provisioned accounts are `supertest001@introsoft.co.za` and
`supertest002@introsoft.co.za`; both have the real global `SUPER_ADMIN` role and
MFA enabled. They are test identities, not production bootstrap accounts.

After successful migration, start ALTIL:

```sh
docker compose --env-file .env.docker -f compose.demo.yaml up -d altil
```

Open `http://127.0.0.1:3005/admin-test/`. MariaDB is reachable only on the
private internal Compose network and has no host-published port. The app also
joins a bridge network so its loopback-published HTTP port is reachable from
the host. No provider credentials are supplied; background billing and provider
startup checks are disabled. The app network is not an outbound firewall, so do
not add live credentials or invoke external provider actions in this demo.

## Routine operations

```sh
# View service state and logs
docker compose --env-file .env.docker -f compose.demo.yaml ps
docker compose --env-file .env.docker -f compose.demo.yaml logs -f altil

# Stop and restart; named database and app-state volumes are preserved
docker compose --env-file .env.docker -f compose.demo.yaml down
docker compose --env-file .env.docker -f compose.demo.yaml up -d
```

The database and `.altil-data` state are persisted independently in named
volumes. Back up both before deliberate schema/data operations. A reset is
destructive and is not part of normal startup. There is deliberately no reset
command in this guide; any future reset procedure must identify the exact
Compose project and volume and require an explicit operator confirmation.

## Runtime and deployment limits

The application now accepts a deliberate `production` profile only when
`NODE_ENV=production` and `ALTIL_ENVIRONMENT=production` are both set. The demo
Compose file remains development/test-only. Production still requires a
separately reviewed environment, database, trusted-proxy, backup/restore, and
deployment configuration; this file is not a production deployment recipe.

Forwarded client IPs are ignored unless `ALTIL_TRUSTED_PROXY_CIDRS` explicitly
lists the proxy IPs/CIDRs. Never set it to a trust-all range. Configure the
reverse proxy to replace/normalize the forwarded chain from a trusted source,
and expose the app only to that proxy. The actual server proxy chain was not
inspected, so no production CIDRs are supplied here.

No server was contacted and no deployment was performed while preparing this
setup.

The local database image tag is pinned to the documented target, but the
accepted baseline record reports PC MariaDB `9.5.0` and labels the development/
test server UNKNOWN. Validate compatibility on a disposable candidate before
using this as a parity claim. Never upgrade, downgrade, or migrate existing
databases as part of Docker startup.
