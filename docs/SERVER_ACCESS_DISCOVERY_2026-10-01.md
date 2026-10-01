# ALTIL Server Access Discovery — 2026-10-01

## Result

**An existing authorized administration path to `mail.introsoft.co.za` was not identified.** DNS resolves the owner-authorized candidate to `196.223.58.118`, and local host-key records exist, but neither authenticates the owner or proves server identity. No SSH authentication or server connection was attempted. The server remains uninspected.

The local PC was inspected read-only. No credentials, private-key contents, passwords, or secret values were printed. No local/server configuration, credential, key, database, or service was modified.

## 1. OpenSSH, Git Bash, and agent

- User OpenSSH config `%USERPROFILE%\.ssh\config` exists. It contains only the `github.com` host entry and maps that entry to `github.com` with identity filename `id_ed25519_introsoft`.
- The system OpenSSH config `C:\ProgramData\ssh\ssh_config` is absent. No alternate SSH config path environment variable was configured. `GIT_SSH`, `GIT_SSH_COMMAND`, and SSH agent environment variables were not configured.
- The Git for Windows SSH config exists at `C:\Program Files\Git\etc\ssh\ssh_config`; its host entries are Azure DevOps patterns only. No ALTIL/Introsoft server identity is configured there.
- The only local SSH key pair found is `id_ed25519_introsoft` and its `.pub` file. Safe public-key metadata: Ed25519, 256-bit, fingerprint `SHA256:I9L9glETGYyyQ0UXGNtWU94bM0qmgBT8xE4b+CDS5Kc`, public-key comment `introsoft-pc`. Its SSH config association is GitHub only. The private key was not read. The key is not configured for `mail.introsoft.co.za`.
- Windows OpenSSH agent service is stopped; `ssh-add -l` reports no loaded identity. **AUTH NOT AVAILABLE** through the SSH agent.
- `known_hosts` has seven unhashed entries, including `mail.introsoft.co.za` and `196.223.58.118`. A known-host entry records a previously seen host key; it is not proof of host role or authorization.

## 2. PuTTY, Pageant, and other administration software

- PuTTY 0.83 is installed, including `puttygen`, `pageant`, `plink`, and `pscp`. Pageant is not running, so no Pageant identity inventory was available.
- PuTTY has no saved session for `mail.introsoft.co.za`, `admin.introsoft.co.za`, or `196.223.58.118`; its saved host-key registry has no entries for those candidates.
- WinSCP was not found in installed-app metadata or on PATH; no matching WinSCP saved site was found in its standard per-user session registry location.
- MobaXterm, KiTTY, DWService, AnyDesk, RustDesk, and TeamViewer were not found in installed-app metadata, PATH, running processes, or the checked Windows service names.
- VS Code is installed. The Remote SSH extension and `remote.SSH` settings/host definitions were not found. The detected remote extension is Remote Containers, which does not identify an SSH server.
- Windows Terminal settings contain no SSH profile.
- Credential Manager metadata (`cmdkey /list`) had no target matching Introsoft hosts/IP, SSH/SFTP, WinSCP, or PuTTY. Passwords and usernames were not displayed.
- WSL registration shows only the Docker-managed `docker-desktop` distribution; no user distribution is registered. The managed distribution was not started or inspected for SSH files.

## 3. Local scripts, configuration, and references

Read-only searches covered `C:\Project`, the user's Documents and Downloads folders, repository text/configuration, `.env` variable names, and relevant application/tool metadata. Secrets and file contents were not printed.

- `mail.introsoft.co.za` resolves to A record `196.223.58.118`. Both are present in `known_hosts`.
- Exact candidate references in repository text occur in the prior discovery documents (`docs/SERVER_ACCESS_DISCOVERY_2026-10-01.md` and `docs/SERVER_READ_ONLY_DISCOVERY_2026-10-01.md`). No application source or environment setting binds either hostname/IP to the ALTIL server.
- The path `/var/www/altil-control-centre-test` and the label `altil-control-centre` occur in the prior discovery documents, not in an existing deploy script or server binding.
- The broader `introsoft.co.za` domain occurs in app/test identity or email examples, including `altil-server-test.cjs`, `docs/LOCAL_TEST_HARNESS.md`, `docs/SUPER_ADMIN_BOOTSTRAP.md`, E2E scripts, `src/components/LoginScreen.tsx`, `src/data/initialState.ts`, `src/security/superAdminBootstrap.ts`, `src/server/localTestHarness.ts` and tests, and Vite configuration. These are not proof of a server endpoint.
- Port `3005` appears as application listener/default or API port in `server.ts`, `src/config/environmentContract.mjs`, `docs/DEVELOPMENT_TEST_ENVIRONMENT_PARITY.md`, and API documentation; no host binding accompanies it.
- `.env` and `.env.example` define none of the searched SSH/deploy/server/SFTP host/user/port variable names, and none of the candidate strings appeared in their values. No `.env` values were displayed.
- Git `origin` is `github.com:horatiointro/Introsoft_admin.git` for fetch/push; it is the code-hosting remote, not the application server.

### Unclassified local artifact

`C:\Users\horat\Downloads\root` is an extensionless 331,163-byte file. A content search found candidate host/IP markers and `root@` within it, but its contents were not opened or displayed. `ssh-keygen` did not recognize it as a readable OpenSSH key. It is not referenced by SSH configuration or a saved PuTTY/WinSCP site. Its purpose and sensitivity remain **UNKNOWN**; it was not used for authentication. It must not be treated as an authorized credential until its owner identifies it through a trusted local process.

## 4. Candidate assessment

| Candidate/mechanism | Evidence | Existing config/session? | Auth available? | Tied to intended ALTIL dev/test server? |
|---|---|---|---|---|
| `mail.introsoft.co.za` | Explicit owner-authorized candidate; DNS resolves to `196.223.58.118`; known-host entry | No SSH config, PuTTY session, or WinSCP site | No | No; machine identity not checked |
| `196.223.58.118` | Matches candidate DNS A record; known-host entry | No | No | No; machine identity not checked |
| `admin.introsoft.co.za` | Historical public-app clue; no local SSH config or saved-site match; no known-host entry | No | No | No; public application hostname does not prove SSH target |
| GitHub SSH key | User config maps `id_ed25519_introsoft` to `github.com`; Git origin is GitHub | Yes, GitHub only | Key file exists; no agent identity | No; repository host only |
| PuTTY/Pageant | PuTTY/Pageant executables installed; no candidate saved sessions; Pageant not running | No candidate configuration | No Pageant session | No |
| VS Code Remote SSH | No extension/settings/host definition found | No | No | No |
| WinSCP/other remote tools | No matching installed application/session found in checked metadata | No | No | No |
| `Downloads\root` artifact | Candidate strings found; 331,163 bytes; not a recognized OpenSSH key; not tied to config | No | Unknown file; not used | No |

No existing authorized mechanism clearly corresponds to the candidate server. **Existing SSH path: NOT IDENTIFIED.**

## 5. Connection decision and exact blocker

The new authorization identifies `mail.introsoft.co.za` as the candidate and DNS confirms the expected IP, but an authorized server credential/session is still missing. The only configured key applies to GitHub, the SSH agent is empty/stopped, PuTTY has no saved candidate session, and no matching Windows credential entry was found. The unclassified Downloads artifact cannot safely be assumed to be a usable or authorized key.

Therefore no SSH authentication was attempted, and no remote host identity was collected. The owner/operator must make an already-authorized SSH identity/session available through the approved local administration method, or identify the `Downloads\root` artifact locally through a trusted process and confirm whether it is an authorized credential. Do not paste private-key content into ChatGPT. Once authorized access exists, the first remote command must be limited to host identity, as directed; further inspection must wait for that identity to be confirmed.

## 6. Stop confirmation

No server was contacted. No SSH config, Git configuration, key, Pageant state, known-host data, Windows credential, database, server, application, service, or external provider was changed. No DNS, firewall, Cloudflare, or TLS setting was changed. No server parity is claimed.
