# ALTIL Server Read-Only Discovery — 2026-10-01

## Result and scope

The owner authorized investigation of `mail.introsoft.co.za` as the primary candidate. A DNS lookup resolved it to the expected A record `196.223.58.118`. This establishes the current name-to-address resolution only; it does **not** establish the identity of the machine or prove that it is the ALTIL development/test server.

The only local SSH identity is configured for `github.com`. No SSH-agent identity is loaded, and no server-specific authorized identity or approved session is available for `mail.introsoft.co.za`. Accordingly, SSH authentication was not attempted. The server must identify itself before it can be treated as the intended ALTIL server; that identity remains **UNKNOWN**. Per the stop condition, no server inspection was performed.

This report records only local access metadata and DNS resolution. No server connection, port scan, database query, login, process inspection, or provider request occurred. No server or PC state was changed.

## 1. Local SSH and Git evidence

- User OpenSSH config: `%USERPROFILE%\.ssh\config` exists. Its only named host alias is `github.com`, mapped to `github.com`, with identity filename `id_ed25519_introsoft`.
- System OpenSSH config: `C:\ProgramData\ssh\ssh_config` is absent.
- The corresponding public-key file exists. Safe metadata: Ed25519, 256-bit, fingerprint `SHA256:I9L9glETGYyyQ0UXGNtWU94bM0qmgBT8xE4b+CDS5Kc`. Private-key contents were not read or printed. The key is scoped by the SSH config to GitHub; it is not configured for the candidate server.
- SSH agent: no loaded identity (**AUTH NOT AVAILABLE** through the agent).
- `known_hosts`: present, with seven unhashed entries. Entries exist for `mail.introsoft.co.za` and `196.223.58.118`; no entry exists for `admin.introsoft.co.za`. Known-host entries pin previously seen host keys but do not prove the intended server identity or grant authentication.
- Git `origin`: `github.com:horatiointro/Introsoft_admin.git` for fetch and push. This is the source repository remote, not the application server. No credential was present in the reported URL.

## 2. Repository and configuration references

- Exact repository/config searches found no references to `mail.introsoft.co.za`, `admin.introsoft.co.za`, `196.223.58.118`, `/var/www/altil-control-centre-test`, or `altil-control-centre`.
- `.env` and `.env.example` have no values referencing those candidates; the check reported matching variable names only and did not display values.
- Generic `introsoft.co.za` occurrences are in test/application identity or email-related material, including `altil-server-test.cjs`, `docs/LOCAL_TEST_HARNESS.md`, `docs/SUPER_ADMIN_BOOTSTRAP.md`, E2E scripts, `src/components/LoginScreen.tsx`, `src/data/initialState.ts`, `src/security/superAdminBootstrap.ts`, `src/server/localTestHarness.ts` and its tests, and Vite configuration. They do not bind a hostname to the ALTIL development/test server.
- Port `3005` is referenced as a listener/default or API port in `server.ts`, `src/config/environmentContract.mjs`, `docs/DEVELOPMENT_TEST_ENVIRONMENT_PARITY.md`, and API documentation. It is not a host identity.
- Deployment/runbook references found in repository documentation are generic; no approved candidate SSH destination was identified there.

## 3. Candidate assessment

| Candidate | Evidence source | Existing SSH config? | Existing auth available? | Intended ALTIL dev/test server proven? |
|---|---|---|---|---|
| `mail.introsoft.co.za` | Owner-authorized candidate; DNS resolves to expected `196.223.58.118`; known-host entry exists | No | No server identity configured; agent empty | No; machine identity not checked |
| `196.223.58.118` | Matches the candidate DNS A record; known-host entry exists | No | No server identity configured; agent empty | No; machine identity not checked |
| `admin.introsoft.co.za` | Historical public application hostname clue; no exact local SSH/config/repository match; no known-host entry | No | No | No; public URL does not identify the SSH host |
| `github.com` | User SSH config and Git `origin` remote | Yes | GitHub-only key file exists; agent empty | No; Git host, not the ALTIL application server |

The candidates are **NOT IDENTIFIED** as the intended server. DNS and known-host data are insufficient to establish the host's role.

## 4. Server evidence status

No SSH session was established. All remote observations below are therefore **UNKNOWN / NOT CHECKED**:

| Requested server fact | Status |
|---|---|
| Hostname, FQDN, current user, OS, kernel, architecture, primary IPs, uptime | UNKNOWN |
| ALTIL path, ownership, permissions, repository state, branch, commit, remote | UNKNOWN |
| Node/npm, installed dependencies, PM2 identity/status/uptime/restarts/script/cwd/port | UNKNOWN |
| Running application commit and correspondence to checkout | UNKNOWN |
| Redacted server configuration and environment profile | UNKNOWN |
| Database target, version, `@@read_only`, character set/collation, engines | UNKNOWN |
| Migration list, timestamps, checksums, missing/unexpected versions | UNKNOWN |
| Schema counts and fingerprint | UNKNOWN |
| Aggregate IAM, tenant, commercial, billing, compliance, audit, and usage counts | UNKNOWN |
| User/account state and password equality | UNKNOWN; password equality is NOT VERIFIED |
| Encryption/provider secret configuration and equality | UNKNOWN; secret equality is NOT VERIFIED |
| nginx, Cloudflare/real-IP, proxy target/headers, TLS certificate and expiry | UNKNOWN |

No database rows or schema metadata were queried. No migration was run.

## 5. PC reference at report time

| Item | PC evidence |
|---|---|
| Branch / commit before this report | `feature/cline-customer-commercial-journey` / `c8608d50aad2002f8b4efe42f784a24a497e77b3` |
| Working tree before this report | Clean |
| Previous application commit | `e0ac48f` |
| Repository schema target | `001–036` |
| PC `altil_db` | MariaDB `9.5.0`, migrations `001–035`; preserved incident/reference database |
| PC `altil_e2e_test` | Migrations `001–036`; isolated E2E database |
| `package-lock.json` SHA-256 | `55968e8e7f63bdea1f585efa06f28c27f3b8cf7534d3bad37cf2c1c6220d07b0` |
| Node / npm | `v24.16.0` / `11.13.0` |
| PC OS / architecture | Windows 11 Pro / x64 |

The accepted PC parity report recorded an invalid PC `development-test` configuration because `ALTIL_ENVIRONMENT`, `PAYFAST_SANDBOX`, and `IKHOKHA_MODE` were missing. It also found no configured parity HMAC key. These PC facts do not establish server configuration.

## 6. Critical questions

1. **Is the server the intended ALTIL development/test host?** Not established. DNS matches the supplied candidate IP, but no server identity was obtained.
2. **Is the server running the same Git revision as the PC?** Unknown; not inspected.
3. **Is it running the source checkout reported by Git?** Unknown; not inspected.
4. **Does PM2 correspond to that checkout?** Unknown; PM2 was not inspected.
5. **Is the server using the intended database?** Unknown; no server configuration or database was inspected.
6. **Is its schema equivalent?** Unknown.
7. **Are migrations equivalent?** Unknown.
8. **Is database data equivalent?** Unknown.
9. **Are user/account records equivalent?** Unknown.
10. **Are password values proven equal?** No; `PASSWORD EQUALITY = NOT VERIFIED`.
11. **Are encryption secrets compatible?** Unknown; `SECRET EQUALITY = NOT VERIFIED`.
12. **Is the runtime compatible?** Unknown.
13. **Is the server environment profile valid?** Unknown.
14. **Does nginx forward to the intended ALTIL process?** Unknown.
15. **Does Cloudflare/TLS forwarding appear correct?** Unknown.
16. **Are there unexplained server-only modifications?** Unknown; no server checkout was inspected.
17. **Can we claim the PC and server represent the same logical ALTIL environment?** No. The server remains unidentified and uninspected.

## 7. Exact blocker and next evidence needed

The required existing authorized administrative credential/session for the candidate is not available through the current local SSH configuration or agent. The only configured key is scoped to GitHub. Do not send a private key through chat. The operator must make an already-authorized server SSH identity/session available through the approved local administration mechanism and confirm that it is authorized for `mail.introsoft.co.za`. Once available, the next remote command must remain limited to the requested read-only host identity facts; further inspection should wait until the returned machine identity is checked.

No parity is claimed. No migration, source, database, SSH configuration, key, known-host entry, service, proxy, TLS, Git remote, or external-provider state was changed. No push occurred.
