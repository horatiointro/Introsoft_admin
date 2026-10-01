# ALTIL Server Access Discovery — 2026-10-01

## Result

**Existing authorized SSH path to the intended ALTIL development/test server: NOT IDENTIFIED.** The local evidence does not positively identify a server endpoint. Per the stop condition, no SSH connection or network probe was attempted. Server inspection remains stopped.

## Local SSH evidence

- User OpenSSH config exists at `%USERPROFILE%\.ssh\config`.
- Its only named host alias is `github.com`, with `HostName github.com` and an identity filename `id_ed25519_introsoft`. It contains no ALTIL server alias.
- The corresponding public-key file exists; its safe metadata is Ed25519, 256-bit, fingerprint `SHA256:I9L9glETGYyyQ0UXGNtWU94bM0qmgBT8xE4b+CDS5Kc`. The private key content was not read or printed. This key is configured for the GitHub host entry, not an identified ALTIL server.
- The SSH agent reports no loaded identity. Thus **AUTH NOT AVAILABLE** for any candidate server through the current agent state. A local key file or known-host entry alone does not establish server authorization.
- The Windows system SSH config `C:\ProgramData\ssh\ssh_config` is absent.
- `known_hosts` exists with seven unhashed entries. Lookup found entries for `mail.introsoft.co.za` and `196.223.58.118`, but no entry for `admin.introsoft.co.za`. These entries establish only that host keys were recorded locally; they do not establish that a candidate is the intended ALTIL test server.

## Git remote evidence

The configured `origin` remote is the SSH repository `github.com:horatiointro/Introsoft_admin.git` for fetch and push. It is GitHub repository metadata, not evidence identifying the development/test application host. No credentials were present in the reported remote URL.

## Repository and configuration references

- Exact repository searches found no references to `mail.introsoft.co.za`, `admin.introsoft.co.za`, `196.223.58.118`, `/var/www/altil-control-centre-test`, or `altil-control-centre`.
- `.env` and `.env.example` contain no references to those candidate hostnames, IP, or application path; only variable names were checked and no values were printed.
- The broader `introsoft.co.za` domain occurs in application/test identity and email-oriented material, including `altil-server-test.cjs`, `docs/LOCAL_TEST_HARNESS.md`, `docs/SUPER_ADMIN_BOOTSTRAP.md`, E2E scripts, `src/components/LoginScreen.tsx`, `src/data/initialState.ts`, `src/security/superAdminBootstrap.ts`, `src/server/localTestHarness.ts`, its tests, and Vite configuration. Those occurrences do not provide a server hostname binding the domain to the ALTIL development/test environment.
- Port `3005` appears as the application's default/listener or API port in `server.ts`, `src/config/environmentContract.mjs`, `docs/DEVELOPMENT_TEST_ENVIRONMENT_PARITY.md`, and API documentation. A port reference alone does not identify a host.
- Deployment/runbook documents describe generic deployment or database practices; none of the searched repository references identifies an approved SSH destination for the ALTIL development/test server.

## Candidate assessment

| Candidate | Evidence source | Existing SSH config? | Existing auth available? | Intended ALTIL dev/test server proven? |
|---|---|---|---|---|
| `mail.introsoft.co.za` | Local `known_hosts` entry; broad `introsoft.co.za` occurrences are in test/application identity material, not a server binding | No | No agent identity; GitHub-only key configuration | No |
| `admin.introsoft.co.za` | Previously user-provided browser URL identifies an application URL, not an SSH target; no exact repository/config match; no local `known_hosts` entry | No | No agent identity; GitHub-only key configuration | No |
| `196.223.58.118` | Local `known_hosts` entry only; no exact repository/config match | No | No agent identity; GitHub-only key configuration | No |
| `github.com` | User SSH config and Git `origin` remote | Yes | A configured key file exists; agent has no loaded identity | No; this is the Git hosting endpoint, not the ALTIL application server |

No candidate meets the positive-identification requirement. The presence of a hostname/IP in `known_hosts`, a browser URL, application email examples, or a Git remote is insufficient evidence to equate it with the intended development/test server.

## Exact blocker and information needed

The missing evidence is an owner/operator-confirmed development/test server SSH destination (host or approved alias) and confirmation that it is the intended ALTIL environment, together with an already-authorized SSH identity or agent/session for that destination. Do not send a private key through chat. Once the target is confirmed and authorized access is available, the next task may perform only the instructed minimal host-identity check before any further inspection.

## Stop confirmation

No server was contacted. No SSH authentication was attempted. No server, PC configuration, database, service, Git remote, key, known-host entry, DNS, TLS, or provider state was changed. No server parity is claimed.
