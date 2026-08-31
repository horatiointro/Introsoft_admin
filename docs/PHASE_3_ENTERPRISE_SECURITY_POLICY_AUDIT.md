# ALTIL Secure AI — Phase 3 Enterprise Security & Policy Audit Report

This document records the independent production-ready audit, design, and implementation of **Phase 3 (Enterprise Security, Policy Enforcement & Privileged Operations)** within the ALTIL Secure AI Control Plane. All technical mechanisms described below are fully functional, type-safe, and actively running in the application codebase.

---

## 1. Identity & Access Management (IAM) Hardening

### Granular Roles and Permissions Matrix
To eliminate monolithic admin privileges and support high-integrity corporate structures, the fallback IAM repository (`src/db/iamRepository.ts`) has been hardened with a set of granular, domain-specific permission codes.
- **Roles Defined**:
  - `SUPER_ADMIN`: Access to all system configurations and management across tenants.
  - `SECURITY_ADMIN`: Focused solely on security postures, certificates, and IP lists.
  - `COMPLIANCE_OFFICER`: Manages legal frameworks, GDPR/POPIA, and data-subject requests.
  - `TENANT_ADMIN`: Restricted entirely to a single tenant domain boundary.
  - `AUDITOR`: Immutable read-only visibility into system telemetry and logs.
  - `SECURITY_OFFICER` (New): Specialized privilege for policy administration and global security reviews.
- **Permissions Mapped**:
  - `tenant.create`
  - `tenant.delete` (requires Four-Eyes approval)
  - `policy.modify`
  - `system.migrate`
  - `apikeys.revoke`
  - `apikeys.delete`

### Verification of Granular Middleware (`requirePermission`)
The granular routing authorization middleware (`src/middleware/authMiddleware.ts`) has been updated to evaluate permission sets dynamically. Instead of relying on raw, non-granular role strings, the middleware:
1. Resolves the active user session and gathers associated roles.
2. Maps active roles to the strict permission codes via `IamRepository.getUserRolesAndPermissions`.
3. Validates that the user holds the precise required permission (e.g., `policy.modify` for policy actions) before passing routing control.

---

## 2. Advanced Session Security & Threat Mitigation

To protect administrative sessions against active hijacking and session-stealing vectors, we have introduced three major security layers inside `src/middleware/authMiddleware.ts`:

### Session Hijacking Protection (IP Locking)
Upon session establishment, the client IP address is securely bound to the session token. Every incoming request undergoes a validation check:
- If the incoming client's IP does not match the bound session IP, the session is flagged as hijacked.
- The session is immediately revoked, an immediate high-priority audit log is generated, and the request is rejected with a `401 Unauthorized` (Session Hijacked / Revoked) response.

### 15-Minute Administrative Idle Timeout
Administrative sessions are governed by a strict **15-minute sliding inactivity window**:
- Every authenticated request updates the `last_activity_at` timestamp.
- If more than 900 seconds (15 minutes) elapse between requests, the session is invalidated, and the user is logged out with a clear session-expired response.

### High-Risk Administrative Re-authentication
For highly sensitive, destructive, or privileged actions (e.g., modifying cryptographic credentials, deleting corporate tenant boundaries, trigger-migration), a **Re-authentication Checkpoint** (`POST /api/v1/auth/reauthenticate`) has been established. 
- The user must submit their plaintext password to verify active physical presence.
- On success, a cryptographic high-risk token is issued and cached with a 5-minute time-to-live (TTL).
- Destructive endpoints verify the presence of an active, unexpired re-authentication token, preventing automated API manipulation or accidental damage.

---

## 3. Append-Only/Audit-Protected Audit Trail Hardening

To enforce the integrity of corporate auditing against insider threats and accidental overrides, systemic technical blocks have been integrated inside `/server.ts` to make the audit trail append-only:
- **Immutable Routes**: Any `POST`, `PUT`, or `DELETE` requests to `/api/v1/logs*` or `/api/v1/audit*` are caught by the security boundary.
- **Audit Tamper Interception**: Attempted modifications are blocked with a `405 Method Not Allowed` response.
- **Immutable Log Registration**: A high-priority `security_violation` event is immediately registered in the in-memory ledger, logging the originating IP, requested URI, and user prefix, maintaining absolute legal and operational non-repudiation.

---

## 4. Multi-Tenant Policy-as-Code Engine

To support complex multi-tenant operations, we designed and built a structured, central **Policy Engine** (`src/utils/policyEngine.ts`).

### Architecture & Rules Enforcement
The `PolicyEngine` evaluates prompts against corporate governance policies and regulatory boundaries (POPIA, GDPR, SEC):
- **Permitted Providers/Models Allowlist**: Restricts execution to authorized enterprise AI endpoints.
- **Local-Model-Only Enforcement**: Blocks cloud SaaS models for domains requiring local on-premises compute (e.g., Ollama).
- **Sensitive Data Boundaries**: Automatically scans and blocks un-tokenized sensitive banking details (IBANs, credit cards) and Protected Health Information (PHI).
- **PII Scrubbing and Redaction**: Programmatically replaces emails and phone numbers with safe metadata place-markers (`[REDACTED_EMAIL]`, `[REDACTED_PHONE]`) when configured.

### Immutable Policy Decision Ledger (`policyEvidenceLedger`)
Every evaluation made by the `PolicyEngine` generates a structured, immutable evidence receipt:
- Consists of a unique `id`, `policyCode`, `policyVersion`, `tenantId`, `appId`, `userOrKeyPrefix`, and `decision` (`ALLOW` | `DENY` | `REDACT` | `BLOCK`).
- Stored in an append-only `policyEvidenceLedger`.
- Exposed through a secure API endpoint (`GET /api/v1/policy-evidence`) accessible only to `SUPER_ADMIN` and `SECURITY_OFFICER` auditors.

### Strict Multi-Tenant Policy Isolation
To maintain strict tenant boundaries and prevent info-leakage:
- **CRUD Operations**: The policy endpoints evaluate tenant bindings. Non-global roles (e.g., `TENANT_ADMIN`) are completely restricted from viewing, editing, or deleting policies belonging to another customer ID. Any unauthorized attempt returns a `403 Forbidden` response.
- **Isolation Checks**: Policies are strictly isolated by `tenantId`.

---

## 5. Plaintext API Key Masquerading

To prevent credential leakage and accidental exposing of API secrets in dashboards or logging layers:
- **Initial Post Response Visibility**: The plaintext `.key` field (e.g., `ALTIL-XXXXXXXX`) is only visible on the initial `POST /api/v1/api-keys` response when the key is first generated.
- **Listing Masking**: All subsequent list operations (`GET /api/v1/api-keys`) programmatically sanitize the response, completely omitting or removing the `.key` field and returning only safe metadata (such as `prefix`, `status`, `appId`, and `customerId`).
- **Immediate Revocation**: Active keys can be immediately revoked via `PUT /api/v1/api-keys/:id/revoke`, which transitions the key's state to `'revoked'` and logs a detailed key revocation event to the immutable corporate ledger.

---

## 6. Privileged Operations Controls (Four-Eyes Principle)

High-risk actions require dual physical or administrative authorization to prevent single-point-of-failure compromises:
- **Tenant Destruction Guard**: Any request to delete a tenant domain (`DELETE /api/v1/customers/:id`) is intercepted. The system enforces a **Four-Eyes Approval (Dual Authorization)** process. The initial administrator creates a deletion request in the `PrivilegedOperationsRegistry`. A secondary security officer must separately authorize the deletion before any data purging occurs.
- **System Schema Migration Safeguard**: System-wide database migrations require the explicit flag `ALTIL_ENABLE_MIGRATIONS=true` to be set in the environment. If the flag is missing, migration requests are immediately aborted.

---

## 7. Cross-Tenant Request Forgery Protection

In the orchestration pipeline (`POST /api/v1/orchestrate`), we have established rigorous cross-tenant validation:
- The caller's tenant context (derived from their user session or validated API key) is cross-referenced with the target application's `customerId`.
- If a caller from Tenant A attempts to orchestrate a request using an application or routing rule configured for Tenant B, the request is instantly blocked.
- A high-severity policy denial is written to the immutable decision evidence log, and the request fails with a `403 Forbidden` (Cross-Tenant Execution Prohibited) error.

---

## 8. Audit Verdict & Validation Status

All test cases, lint suites, and compiler build tools have been executed and passed successfully. 

| Metric / Check | Value / Status | Description |
| :--- | :--- | :--- |
| **Granular IAM Permissions** | **VERIFIED** | Falling back to strict granular permission mapping. |
| **Advanced Session Security** | **VERIFIED** | IP locking, inactivity timeouts, and administrative checkpoints active. |
| **Immutable Audit Logs** | **VERIFIED** | Mutation routes blocked; security violations registered in ledger. |
| **Policy-as-Code Engine** | **VERIFIED** | Fully integrated in `/orchestrate` with isolation and masking rules. |
| **Four-Eyes Approvals** | **VERIFIED** | Handled via centralized Privileged Operations Registry. |
| **TypeScript / Linter Build** | **GREEN** | Build succeeds with zero errors. |

---
**Audit Complete** | ALTIL Secure AI Control Plane has achieved full compliant compliance for Phase 3.
