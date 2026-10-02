# MariaDB deployment setup

ALTIL uses MariaDB for durable application data. Local development can fall back
to memory when MariaDB is unavailable; production now stops before opening the
HTTP port if it cannot connect or the `tenants` table is missing.

## Values to get from the server/database provider

Create a MariaDB database and a dedicated application user in the hosting panel.
Grant that user the permissions needed to create and alter tables while applying
migrations, and normal read/write permissions at runtime. Do not use the MariaDB
`root` account. Record these values from the provider:

- Database host (often a private hostname; `localhost` is correct only if MariaDB
  runs on the same server as ALTIL)
- Port, database name, username, and password
- Whether the provider requires TLS, and its CA certificate if applicable
- Any firewall allowlist requirement for the application server

Put the values in the server's secret/environment-variable settings, not in a
committed `.env` file. Use either `DATABASE_URL` or the `MARIADB_*` variables
shown in `.env.example`. `DATABASE_URL` takes precedence if both are set. URL
encode special characters in its username and password. For TLS, set
`MARIADB_SSL=true`; set `MARIADB_SSL_CA` to a PEM CA file path when the provider
uses a private CA.

## Prepare the schema and start

From the deployed application directory, after the environment variables are
configured:

```sh
npm ci
npm run db:status
npm run db:migrate
npm run build
ALTIL_ENVIRONMENT=production NODE_ENV=production npm start
```

The migration command must complete successfully before starting the server. The
production server will reject startup if it cannot connect or if the `tenants`
table is missing. Check `GET /api/v1/health` after startup; it reports
`databaseConnected: true` when the database connection is active.

The IAM migration creates the initial admin account
`horatio.huxham@gmail.com` with a placeholder password hash. Set a strong,
one-time `ALTIL_ADMIN_PASSWORD` secret (at least 14 characters) and optionally
`ALTIL_ADMIN_EMAIL`, then run `npm run db:admin-password` after migrations. This
stores a bcrypt hash in MariaDB and clears failed-login lockout state. Remove
`ALTIL_ADMIN_PASSWORD` from the environment after the command. The login screen
does not prefill a password; enter the password you provisioned.

## Current local connection issue

The observed `ER_ACCESS_DENIED_ERROR` means the MariaDB host answered but
rejected the supplied username/password or the account's host grant. Check the
actual local MariaDB account and permissions, then set matching local values in
an untracked `.env` file. For an uploaded deployment, use the database hostname
and credentials supplied by that server's provider; the local `127.0.0.1`
settings cannot be reused unless MariaDB is on that same server.
