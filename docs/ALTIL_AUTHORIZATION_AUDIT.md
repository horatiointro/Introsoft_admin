# ALTIL Authorization and Capability Audit

**Review date:** 2026-09-29
**Scope:** Current checkout source, migrations and UI. This was a static/source review plus isolated unit tests. No production connection, database query, migration, backend startup or external provider call was made.

## AUTHORIZATION AUDIT

- **Routes inventoried:** 273 route/method records currently cross-referenced to declarations in `server.ts` and mounted routers. `scripts/refreshRouteInventory.mjs --check` validates those source locations. This inventory is not a complete per-route authorization assessment.
- **Authentication middleware observed:** 224 declarations have an authentication middleware; 14 are credential/challenge-flow routes; 9 are intentionally public/health/documentation endpoints; 6 audit mutation aliases always return 405; 1 route is unauthenticated and writes client error data (`POST /api/v1/client-error`). These are source observations, not proof that authentication is correct at every handler.
- **Status totals in the machine-readable inventory:** 219 `NOT ASSESSED`, 9 `NOT APPLICABLE`, 6 `IMPLEMENTED` (write denied with 405), 20 `PARTIALLY IMPLEMENTED`, and 0 `MISSING`. The inventory deliberately does not label middleware presence as a complete security review. See [ALTIL_AUTHORIZATION_ROUTE_INVENTORY.json](ALTIL_AUTHORIZATION_ROUTE_INVENTORY.json).
- Every inventory row includes route, method, module, source file/line, authentication chain, required permission, organization/tenant scope, ownership, parent/descendant relationship, global access, object authorization, audit, rate limit, input validation, sensitive exposure and status. Fields not verified at handler level remain `NOT ASSESSED`.

### Effective authorization matrix

| WHO | Role / permission | Organization and relationship | Scope / resource | Expected decision |
|---|---|---|---|---|
| Unauthenticated | None | None | Any protected resource | Deny; public health, published plans, legal text and login/challenge endpoints are explicit exceptions. |
| Tenant user | Tenant-bound role + permission | Assignment’s organization; descendants only if the assignment explicitly grants that visibility and the trusted graph contains the relationship | Requested tenant/resource must be inside that grant | Allow only when both the permission and target are satisfied by the same grant; otherwise deny. |
| Tenant administrator | `TENANT_ADMIN` plus operation permission | Role name alone does not confer another organization | Target object must resolve to its organization | Deny out-of-scope or missing targets. Several legacy handlers still need this check. |
| Parent organization / reseller / partner | Scoped assignment + permission | `DESCENDANTS` or `TREE` follows active, effective-dated relationship edges; `ORGANISATION` is self only | No sibling access; role hierarchy does not infer graph reach | Allow only within computed grant. Relationship data quality and production schema remain unverified. |
| Direct client / subsidiary | Tenant/organization assignment + permission | Self scope unless explicit descendant/tree scope | Resource owner must match authorized organization | Allow only after object-to-organization check. Some ITIL and older generic routes remain gaps. |
| Individual | Explicit user/account resource grant where supported | No implicit organization or platform expansion | Object must be bound to the individual or authorized organization | Not consistently represented across current route families; requires domain-level review. |
| Platform operator | `SUPER_ADMIN` with explicit `GLOBAL` assignment and null organization | Global grant is constructed only from that persisted assignment | Platform routes or explicit cross-organization selection | Allow only when global assignment and required permission exist; role string alone is insufficient. |
| Auditor / security/compliance operator | Role plus relevant read/operation permission | Still scope-bound unless explicit global assignment is present | Read/export or assigned compliance resource | No automatic global access by role name. |

The boundary is implemented in `src/security/authorizationContext.ts`, `organizationScope.ts`, `permissionImplications.ts`, `src/middleware/authMiddleware.ts`, and `src/security/tenantTarget.ts`. A missing tenant or organization is not treated as global by these helpers.

## BOLA/IDOR

### Confirmed source defects corrected in this working tree

1. **Trust Fabric and device-trust APIs:** `/api/v1/trust/*` and `/api/v1/device-trust/*` exposed platform-wide trust/device data to any signed-in user, with cross-tenant writes. The existing routes now require authentication and an explicit global Super Admin grant through the existing `requireRole` middleware. They do not yet provide per-tenant authorization; the global-only boundary is intentional until a tenant-scoped trust model is established. The existing UI requests now use `apiFetch`.
2. **DCR target substitution:** `/api/v1/dcr/cloak`, `/reconstruct`, `/pipeline`, `/vault`, `/vault/reveal`, `/policies`, `/ledger`, and `/keys/rotate` accepted or resolved caller-selected tenant IDs without consistently binding them to the authenticated identity. These handlers now use `resolveAuthorizedTenantTarget`; reveal searches only the caller’s tenant unless the caller has an explicit global Super Admin grant. Added pure tests for same-tenant, cross-tenant, missing-tenant and explicit-global cases.
3. **Compliance records:** DSAR/DSR lists and updates could use role names to select unscoped rows; simulated logs accepted caller-selected tenant filters; simulated in-memory data was returned globally. The handlers now require `compliance.dsr`, constrain list/create/update to tenant scope, require explicit global scope for all-tenant operations, and repository fallback filters by tenant. Database DSAR rows now retain `tenant_id` in the mapped object. Existing demo seed rows have no tenant and are therefore not shown to a scoped tenant reader.
4. **Policy evidence:** `/api/v1/policy-evidence` previously used role labels to select all tenants. It now requires `audit.read`, filters by organizations granted that permission, and permits all-tenant selection only for an explicit global Super Admin grant.
5. **Session revocation:** session revoke previously identified a session without requiring that it belonged to the caller. `IamRepository.revokeSessionById` now constrains both the session identifier and owner user ID in SQL and in-memory behavior; the route supplies the authenticated user ID.
6. **ITIL incident and inventory scope:** incident list selection previously trusted role labels/query tenant IDs; update/status operations updated by incident ID without verifying ownership. CMDB, problems and changes reads also trusted role-selected tenant IDs and included `tenant_id IS NULL` rows. These paths now bind queries to the actor tenant or require an explicit global assignment; incident writes first resolve the incident in that tenant and cannot reassign it. Tenant-scoped SQL and fallback reads exclude unowned/null-tenant records.
7. **AI diagnostics:** `/api/v1/rag/incident-diagnostics` could trigger AI diagnostics without authentication. It now requires a session and an existing incident/SRE/Super Admin role; the current UI sends the session through `apiFetch`.

These corrections were source-reviewed and pure authorization tests were added. No HTTP route probing was performed because starting `server.ts` runs database initialization and background startup behavior. Runtime enforcement remains unverified.

### Remaining high-risk BOLA/IDOR findings

| Severity | Route / source | Current behavior and impact | Reuse / migration / test |
|---|---|---|---|
| **HIGH — PARTIAL** | `PUT /api/v1/applications/:id`, `server.ts` | Stage 3 added owner-organization authorization, immutable identity/relationship rejection and a field allowlist. Policy assignments are checked against target-scope visibility. Audit is best-effort and not transactionally coupled; route-level BOLA tests remain outstanding. | Existing scope helper and application records reused; helper tampering tests added; database/runtime proof pending. |
| **HIGH — PARTIAL** | ITIL incident and alert mutations, `src/routes/itilRoutes.ts` | Stage 3 added `tenant.update` scope, tenant-bound resource lookup/SQL and related application validation. Alert queue entries must reference an in-scope incident and are labeled queued. Incident audit writes share a DB transaction; no HTTP route tests or database compatibility check was run. | Existing authorization helpers, `operations_incidents` and `incident_events` reused; pure scope tests added. |
| **MEDIUM — PARTIAL** | `POST /api/v1/client-error`, `server.ts` | Public by design for pre-auth diagnostics. Stage 3 restricts input to an enum and bounded component, applies a 4 KB parser/rate limit, and emits sanitized structured logging; no arbitrary file append remains. No frontend caller was found. | Existing Express parser/logging reused; pure payload/rate-limit tests added; runtime ordering not HTTP-tested. |
| **HIGH — PARTIAL** | `/api/v1/overview`, `server.ts` | Stage 3 scopes tenant aggregates to `tenant.read`; platform provider/model counts require explicit global Super Admin and metric permission. Queries use database sources and failed/unavailable sources do not fall back to demo totals. No route-level or live-schema verification was run. | Existing IAM grants and database tables reused; pure scope tests added. |
| **HIGH** | DSAR persistence, `src/db/complianceRepository.ts` vs `migrations/005_compliance.sql` | The repository INSERT names columns not present in migration 005 and omits its required `tenant_id`, `request_number`, and other non-null columns. The handler now scopes the in-memory object, but durable create/update is not established and tenant scope would not be persisted by this INSERT. | Reconcile adapter against verified schema before relying on durable DSAR writes; requires schema-compatible implementation and tests. Do not migrate based on assumptions. |
| **MEDIUM** | `GET /api/v1/licensing/verify-gateway`, `server.ts` | Public tenant ID lookup returns license/suspension state. The route may be required by the gateway protocol, but enumeration resistance, rate limits and minimum response disclosure need explicit review. | Reuse rate limiting and generic public response; protocol compatibility test. |
| **MEDIUM** | `POST /api/v1/trust/credentials`, `server.ts`-mounted trust router | Now global-Super-Admin-only, but returns a raw generated key once and stores only a hash. This is a sensitive response that needs audit, secure display handling and rate limits; tenant-level trust access is unavailable. | Reuse existing credential issuance/audit flow; storage change only if rotation/revocation lifecycle requires it. |
| **MEDIUM** | `POST /api/v1/device-trust/register`, `server.ts` | Now global-Super-Admin-only, but generated shared secret lifecycle and entropy/persistence behavior need review. Not runtime-tested. | Reuse secure credential issuance and audit; test one-time secret handling. |
| **MEDIUM** | `src/routes/itilRoutes.ts` GET CMDB/problems/changes | Tenant queries no longer include null-tenant rows, but production meaning of null-scope operational records and expected shared catalog behavior is not established. | External schema/ownership evidence needed; do not assume null means global. |

No destructive BOLA probes were run. Static defects were reviewed against the source; safe pure tests cover the authorization primitives, not every Express handler.

## GLOBAL ACCESS

- `buildAuthorizationContext` grants `GLOBAL` only when assignment role is exactly `SUPER_ADMIN`, visibility is `GLOBAL`, and organization ID is null. A role name or missing organization alone is not enough.
- `requireRole(['SUPER_ADMIN'])` checks for that explicit global grant. Other listed roles still match their role assignment, so handlers must separately enforce organization scope and resource ownership.
- Legacy IAM compatibility reads tenant-bound assignment rows. If the schema lacks `access_scope`, only a missing-column error triggers fallback; null-tenant legacy assignments are omitted rather than upgraded to global.
- Search found existing `tenant_id IS NULL` branches in `src/db/iamRepository.ts` for legacy role/user queries and migration 024’s explicit global-assignment seed/update. The ITIL data queries that previously OR-ed null tenant rows are now tenant-exact. Null-scope behavior in other data stores remains a review item and must not be treated as an implicit global entitlement.
- Explicit `'all'` selection must be checked against an explicit global assignment in policy, compliance, DCR and ITIL changes made here. Other endpoints remain unassessed in the inventory.
- No authorization bypass was introduced.

## PERMISSION MODEL

- `src/security/permissionImplications.ts` contains explicit legacy mappings. No read permission implies write.
- `billing.write` implies billing read/modify, not delete. `audit.export` implies audit read. `routing.edit`, `models.configure`, and `providers.write` map to their documented read/configure vocabulary.
- Two legacy aliases are broader than their labels may suggest: `policies.write` expands to `policy.disable`; `iam.users.write` expands to `user.disable`. This is an explicit compatibility exception and should be replaced by separately granted canonical permissions after role assignments are understood.
- `authorizeInContext` checks permission and organization within the same grant. `organizationsAuthorizedFor` unions visible organizations only from grants carrying the requested permission. `requireOrganizationPermission` checks target plus permission in a single assignment.
- Generic `requirePermission` checks whether any grant includes the permission; it does not itself bind that grant to a handler’s target. The handler must call `authorizeInContext` or a scope-aware middleware. Several legacy routes have not yet been checked for this second step.
- Capability availability similarly requires its permission set from a single grant; tests prevent separate assignments from being combined.

## CAPABILITY REGISTRY

- **Existing:** `src/capabilities/capabilityRegistry.ts` contains 15 source-reviewed entries for authentication, customer/application/API-key reads and creation, providers/models, policy, audit, usage, and gateway reads/completion.
- **Added during the accepted foundation:** the registry entries, capability API and source-backed capability audit already exist in the working tree. This review did not add a second registry.
- **Missing / not yet mapped:** the other 239 route/method declarations and most screens/domain workflows. Registry metadata is deliberately partial and does not claim completeness, deployment or runtime availability.
- **Reuse:** extend reviewed entries only after handler and UI review; **enhance** existing applications/API key and commercial surfaces; **rewire** bare `fetch` calls to the established `apiFetch` helper; **new** entries only for genuinely new capabilities.

## UI/API ALIGNMENT

- `src/App.tsx` initial bootstrap and customer operations use `apiFetch`, but many later mutations in `App.tsx` still call bare `fetch` for providers, models, applications, keys, routes, policies and compliance. Those requests omit the bearer token supplied by `apiFetch` and can fail against protected APIs in the LOCAL TEST harness. This is a wiring defect, not a reason to weaken backend auth.
- `src/components/CustomersView.tsx` retains a bare fetch for `/customers/validate-key`; route auth and intended public/session semantics need handler verification.
- `src/components/TenantPortalView.tsx` has authenticated `apiFetch` GETs from the previous local walkthrough, but the schedule creation POST and schedule refresh still use bare `fetch`; backend write support/consent semantics must be reviewed separately.
- Trust Fabric, device-trust and incident-diagnostics views were changed to use `apiFetch` to align with newly enforced route authentication.
- Sidebar navigation visibility is a usability filter only; it is not backend authorization.
- The inventory does not assert that every UI action has a matching, authorized backend operation. Route/UI action mapping remains a remaining audit task.

## CUSTOMER 360

- **Existing:** `src/components/Tenant360View.tsx` provides a tenant overview and embeds `Customer360CommercialPanel` from `src/components/StageFCommercialViews.tsx`.
- **Disconnected:** the commercial panel correctly displays technical tenant identity separately and reports commercial identity as UNKNOWN without verified mapping. It does not receive a production-backed Customer → Organisation → Legal Entity → Billing Account mapping feed.
- **Present but incomplete:** tenant, application, API key, license and some billing/usage screens and routes exist. Their UI data is not a unified lifecycle graph.
- **Missing or not proven connected end-to-end:** verified organization hierarchy, services/provisioning, customer-scoped usage lineage, order-to-subscription/entitlement lineage, invoice/payment allocation, reconciliation/settlement, security/compliance and audit lineage. Static/demo fallback values in `Tenant360View.tsx` (e.g. fallback spend, health and scorecard figures) must not be represented as live tenant facts.

## DEVELOPER PLATFORM

| Area | Classification | Source observations |
|---|---|---|
| Projects | NEEDS ENHANCEMENT | No first-class project lifecycle found in the reviewed capability set; applications are the closest existing resource. |
| Applications | EXISTING / REUSABLE | `/api/v1/applications` list/create/update/delete and application UI exist; creation also creates an API key. |
| Environments | NEEDS ENHANCEMENT | Environment appears as an application field; a separately governed environment resource was not established. |
| API keys | EXISTING / REUSABLE | list/create/revoke/delete exist; list masks raw key; creation returns it. Rotation, scoped service-account lifecycle and per-action audit need review. |
| Service accounts | NEEDS ENHANCEMENT | IAM users and Trust Fabric principals exist, but a single application-consumer/service-account lifecycle was not source-established. |
| Providers / models | EXISTING / REUSABLE | Existing configuration, status, test/benchmark and management routes; some operations can call providers, so do not exercise without approved isolation. |
| Usage / costs | EXISTING / NEEDS ENHANCEMENT | Usage routes and FinOps UI exist. Scoped aggregation was corrected in the foundation, but provider cost and customer charge are different dimensions and lineage remains partial. |
| Policies | EXISTING / REUSABLE | Policy routes and UI exist; explicit permissions and scope checks are present in key handlers; App UI mutation fetch wiring remains incomplete. |
| Trust | EXISTING / NEEDS REWIRING | Trust Fabric and device trust exist; routes now require explicit global Super Admin, which closes broad exposure but is not a tenant trust model. |
| Webhooks | EXISTING / NEEDS REVIEW | Billing/provider webhook routes and event structures exist; provider verification and idempotency require route-by-route review. |
| API Explorer / documentation | EXISTING / REUSABLE | OpenAPI document, API documentation view and gateway docs routes exist; inventory completeness and auth metadata must stay source-backed. |
| ALTIL AI | EXISTING / NEEDS ENHANCEMENT | Screen Assistant and AI routes exist. External-provider invocation paths must remain separate from safe local validation and require explicit provider configuration. |

## DATABASE

- **Source compatibility:** workspace migration 002 models role scope through nullable `tenant_id`; migration 024 adds `access_scope`, converts only the explicit null-tenant Super Admin rows to `GLOBAL`, and adds authorization indexes/seeds. `IamRepository` has a fail-closed compatibility path for installations without `access_scope`.
- **Potential migration:** migration 024 may be needed to persist hierarchy/global authorization scope. Its preflight constraints and production application status are not verified in this task. **Migration 024 remains unapplied.**
- **Production compatibility:** no production connection or schema query was made. Existing external Phase 3B evidence of 23 migrations does not establish live FK/index/nullability/unique constraints or prove migration 024 is safe. The previously approved Stage A production preflight evidence gate remains outstanding.
- Other new repository queries and write paths must be checked against actual production schema before any migration or deployment. No migration was run here.

## TESTS

- **TypeScript:** `npx tsc --noEmit` — PASS.
- **Tests:** explicit existing safe test files across capabilities, Stage A–F, authorization middleware/context, legacy IAM fallback, org scope, permissions, scoped usage, tenant target, customer registration and LOCAL TEST harness — **170 passed, 0 failed**. No application backend was started.
- **Build:** `npm run build` — PASS. Vite emitted its existing large-chunk advisory; bundle completed.
- **OpenAPI:** `docs/openapi.yaml` parsed with PyYAML — PASS.
- **Diff check:** `git diff --check` and `git diff --cached --check` — PASS.
- Runtime, database, provider and browser behavior are **not validated** by these checks.

## FILES CHANGED

This turn’s audit/correction changes, in addition to all pre-existing user changes that remain preserved:

- `docs/ALTIL_AUTHORIZATION_ROUTE_INVENTORY.json` — 273-entry machine-readable inventory; source paths and line locations are checked against current declarations; `accessClassification` describes the authentication boundary while the separate `status` remains `NOT ASSESSED` where substantive review is incomplete.
- `docs/ALTIL_AUTHORIZATION_AUDIT.md` — this source-based audit, findings, corrected gaps, limits and next step.
- `server.ts` — scoped permission checks in organization/billing/policy/data surfaces; explicit global auth for device-trust and provider diagnostics; scoped policy evidence; related API usage is documented above.
- `src/routes/itilRoutes.ts`, `src/db/itilRepository.ts` — tenant-bound reads and ownership checks for incident update/status; no implicit null-tenant read for scoped ITIL list operations.
- `src/routes/complianceRoutes.ts`, `src/db/complianceRepository.ts`, `src/types.ts` — DSAR scope enforcement, tenant-filtered fallback and preservation of persisted tenant scope in mapped records.
- `src/routes/dcrRoutes.ts`, `src/security/tenantTarget.ts`, `src/security/tenantTarget.test.ts` — explicit target tenant authorization and tested global-selection behavior.
- `src/routes/trustFabricRoutes.ts` — trust routes use existing explicit-global role enforcement.
- `src/middleware/authMiddleware.ts`, `src/security/authorizationContext.ts`, `src/security/permissionImplications.ts` — same-grant authorization and explicit global-scope mechanics.
- `src/db/iamRepository.ts`, `src/routes/authRoutes.ts` — fail-closed legacy assignment compatibility and owner-bound session revocation.
- `src/components/TrustFabricView.tsx`, `src/components/PopiaGdprComplianceView.tsx`, `src/components/Incident360DiagnosticModal.tsx` — authenticated requests use the existing API helper.
- Existing working-tree changes in commercial stage files, customer registration, docs, API documentation and LOCAL TEST remain untouched by this audit. `migrations/024_iam_authorization_scopes.sql` remains an unapplied working-tree file.

No files were staged, committed, pushed, or deployed. No production, database or provider was accessed.

## STAGE 3 — HANDLER-LEVEL AUTHORIZATION HARDENING (2026-09-29)

This section supersedes earlier open findings for the specifically reviewed routes below. It does not certify other routes or deployed behavior.

### `/api/v1/overview`

- **EXISTING / REUSED / REWIRED / ENHANCED.** The route now reads only authorized organization IDs carried by `tenant.read` grants. Platform provider and model totals are returned only for an explicit `SUPER_ADMIN` + `GLOBAL` grant carrying the matching `provider.read` or `model.read` permission.
- Tenant application, API-key, usage and provider distribution values come from database queries scoped to visible tenant IDs. Provider/model catalog totals are global only under the explicit platform permission. Seeded arrays and demo fallback numbers are not used.
- Missing database connection or query failure leaves metrics explicitly `UNAVAILABLE`; inaccessible values are `NOT_AUTHORIZED`. The latency metric remains unavailable because no authoritative source was established. Platform application/key totals are intentionally not included.
- No current frontend caller for `/api/v1/overview` was found in the inspected source. Existing dashboard values elsewhere are not relabeled as this endpoint’s verified metrics; their synthetic/demo provenance remains a separate UI concern.
- Query/schema compatibility and actual route behavior remain unverified; no database connection or route probe was made.

### `/api/v1/client-error`

- **EXISTING / ENHANCED.** This remains public by design because diagnostics can occur before login. Search found no current frontend caller in `src`; the anonymous endpoint therefore has no evidenced current client contract to preserve.
- A route-specific 4 KB JSON parser and strict allowlist accept only a diagnostic code from a fixed set and an optional bounded component label. Free-form message, stack, path, identity, and extra fields are rejected. Invalid payloads return 400; a bounded per-process IP limiter returns 429 with `Retry-After`.
- The endpoint writes one structured, sanitized console event. The prior arbitrary file append was removed; raw input, caller-supplied paths, IP and PII are not logged. A durable security audit event is not appropriate for an unauthenticated report without a verified actor; rate/validation controls are the retained evidence.
- Runtime middleware ordering/body-size behavior was type/build-checked but not exercised over HTTP.

### ITIL

- **EXISTING / REUSED / REWIRED / ENHANCED.** Incident reads require `tenant.read`; create, update, status and alert operations require `tenant.update` plus an existing ITIL role. The target tenant must be visible on a grant carrying that permission. Global incident list requires `tenant.read` on the explicit global Super Admin assignment; a role or a separate scoped permission does not combine into global authority.
- Update and status lookup is tenant-filtered; status SQL includes both incident ID and tenant ID. Tenant reassignment is rejected. A tenant incident can reference only its own tenant; app references are verified against `tenant_applications` and fail closed when verification is unavailable. Input fields and status values are bounded/validated.
- Existing `incident_events` is reused for create/update/status audit metadata including actor, tenant, request ID and prior/new status. The SQL mutation and event insert use the existing transaction helper when database-backed; the in-memory fallback is process-local only. The table has no dedicated tenant or correlation columns; those values are stored in its existing JSON metadata. Deployed-schema compatibility and actual transaction behavior remain unverified.
- Alert creation now requires an in-scope existing incident, bounded channel/message/recipient input, and reports `queued` (not dispatched). The repository stores queue records and writes an `incident_events` row in the same database transaction; it does not call a messaging provider. RAG article reads now require an ITIL role but remain shared, non-tenant-scoped content. Problems, changes and CMDB have read routes only in the inspected ITIL router; no corresponding mutation endpoints were found there. Scoped reads now require `tenant.read`.
- We deliberately did not create ITIL permission codes or alter migration 024. Reusing `tenant.update` is a compatibility permission and remains a product authorization-design limitation.

### Applications

- **EXISTING / REUSED / REWIRED / ENHANCED.** Create requires `tenant.update` and `apikeys.create` on one organization grant. Parent applications must be active and belong to that exact organization. Update/delete load the target application and check its owner organization; update uses an allowlist and rejects caller-controlled IDs, tenant/customer reassignment, parent reassignment, application-type changes, and unsupported fields. Policy references must exist and be visible in the target scope.
- Create validates application profile, lifecycle, capabilities, quotas and policy references. The create flow still creates a default API key as part of application activation and returns its secret once; that coupling is existing behavior and remains.
- **Audit is best-effort:** application create/update/delete and API-key create/revoke/delete now write actor, tenant, action, resource, request ID and safe before/after metadata through the existing `audit_logs` table when the database is connected; a structured console event is used without persistence. Audit is not transactionally coupled to application/key writes, and existing delete persistence is not atomic or rollback-verified.

### API keys

- **EXISTING / REUSED / REWIRED / ENHANCED.** Existing tenant/application bindings are retained. Create validates that the selected app is active and belongs to the authorized target organization; allowed scope vocabulary, IP restriction shape, expiry, request rate and billing limits are bounded. The inference route now checks the existing `read:inference` key scope. Existing database persistence stores a SHA-256 hash and metadata; newly issued keys are retained in process memory by hash rather than plaintext. Key creation returns the generated secret once; ordinary list/revoke responses omit secret and hash fields. The public validate-key flow remains public because the key itself is the submitted proof and is response-minimized (officer names reduced to nomination state).
- Revoke and delete target the key's owning organization. Revoke returns only safe metadata. Existing revoke/delete audit entries are process-local and not verified durable. There is no rotate/reveal/update/attach endpoint in the reviewed management routes. The `scopes` field remains an incomplete authorization vocabulary: only inference scope is enforced at the reviewed inference route; other displayed scopes have no proven enforcement in this checkout. Existing initial/demo key fixtures may still contain plaintext in process memory.

### Frontend/API alignment

Protected same-origin requests in `App.tsx`, Tenant Portal, accounting, communications, DCR, currency settings, provider/model views, diagnostics, IAM reset, trust/compliance, traffic simulation, screen assistant and admin registration views now use the existing `apiFetch` helper. This preserves request URL/method/body and existing success/error handling while adding the session bearer token. Public login, registration/legal reads, customer API-key validation and external Stripe/PayFast/iKhokha/Firebase transport requests remain direct fetches by design. A complete interactive browser walkthrough was not run.

### Route review status

| Route | Method | Resource | Auth | Permission | Org Scope | Object Scope | Audit | Risk | Status |
| ----- | ------ | -------- | ---- | ---------- | --------- | ------------ | ----- | ---- | ------ |
| `/api/v1/overview` | GET | Dashboard metrics | Required | `tenant.read`; platform-specific read grants | Authorized organizations; explicit global platform grant | Tenant aggregates filtered by grant-visible IDs | Existing auth-denial audit only | Medium | PARTIALLY IMPLEMENTED |
| `/api/v1/client-error` | POST | Anonymous diagnostics | Intentionally public | N/A | N/A | Strict allowlist and 4 KB body limit | Sanitized structured log; no actor audit | Medium | PARTIALLY IMPLEMENTED |
| `/api/v1/itil/incidents` | GET | Incidents | Required | `tenant.read` | Tenant grant; global list needs permission on global grant | Tenant-filtered repository result | No read event | High | PARTIALLY IMPLEMENTED |
| `/api/v1/itil/incidents` | POST | Incident | Required | `tenant.update` + ITIL role | Same-grant target tenant check | Tenant/app links validated | Existing `incident_events` metadata | High | PARTIALLY IMPLEMENTED |
| `/api/v1/itil/incidents/:id` | PUT | Incident | Required | `tenant.update` + ITIL role | Owner tenant grant | Tenant-bound lookup and relationship validation | Existing `incident_events` metadata | High | PARTIALLY IMPLEMENTED |
| `/api/v1/itil/incidents/:id/status` | PATCH | Incident status | Required | `tenant.update` + ITIL role | Owner tenant grant and tenant-qualified SQL | Tenant-bound lookup; status allowlist | Existing `incident_events` metadata | High | PARTIALLY IMPLEMENTED |
| `/api/v1/itil/alerts` | POST | Alert queue | Required | `tenant.update` + ITIL role | Authorized incident tenant | Incident existence checked within tenant | `incident_events` in same DB transaction; process-local fallback only | High | PARTIALLY IMPLEMENTED |
| `/api/v1/itil/{cmdb,problems,changes}` | GET | Operations records | Required | `tenant.read` | Scoped tenant; global read permission check | Tenant-filtered DB/fallback view | No read event | Medium | PARTIALLY IMPLEMENTED |
| `/api/v1/itil/rag/articles` | GET | Shared operations knowledge | Required | ITIL role | Shared catalog; not tenant scoped | No tenant-owned content relationship | No read event | Medium | PARTIALLY IMPLEMENTED |
| `/api/v1/applications` | GET/POST | Applications | Required | `tenant.read`; create `tenant.update` + `apikeys.create` on same grant | Grant-visible organizations | Parent app organization checked | Best-effort `audit_logs`; not transactionally coupled | High | PARTIALLY IMPLEMENTED |
| `/api/v1/applications/:id` | PUT/DELETE | Application | Required | `tenant.update`; delete also `apikeys.revoke` on same grant | Target application owner organization | Allowlisted profile update; immutable relationships | Best-effort `audit_logs`; delete not atomic | High | PARTIALLY IMPLEMENTED |
| `/api/v1/api-keys` | GET/POST | Credentials | Required | `tenant.read` / `apikeys.create` | Owner organization | Create requires active same-org application; list masks secrets | Best-effort `audit_logs`; not transactionally coupled | High | PARTIALLY IMPLEMENTED |
| `/api/v1/api-keys/:id/revoke` | PUT | Credential | Required | `apikeys.revoke` | Key owner organization | ID loaded then owner grant checked | In-memory event only | High | PARTIALLY IMPLEMENTED |
| `/api/v1/api-keys/:id` | DELETE | Credential | Required | `apikeys.revoke` + Super Admin role | Key owner organization | ID loaded then owner grant checked | In-memory event only | High | PARTIALLY IMPLEMENTED |

The machine-readable route inventory records these as partial, not complete. Unreviewed routes remain `NOT ASSESSED`.

### Stage 3 files and verification

- `server.ts`, `src/routes/itilRoutes.ts`, `src/db/itilRepository.ts` — overview, anonymous diagnostics, application/API-key, and ITIL route/repository enforcement.
- `src/security/overviewAccess.ts`, `overviewAccess.test.ts`, `anonymousDiagnostic.ts`, `anonymousDiagnostic.test.ts`, `commercialMutationValidation.ts`, `commercialMutationValidation.test.ts`, `incidentAuthorization.ts`, `incidentAuthorization.test.ts`, and `authorizationContext.ts` plus its tests — pure policy/validation helpers and targeted tests.
- `src/App.tsx` and protected API views (`TenantPortalView`, accounting, settings, communications, DCR, IAM, models, providers, telemetry, Screen Assistant, Saas Growth, traffic compliance, Trust/Compliance and diagnostic modal) — existing protected calls rewired to `apiFetch`; public/provider transports were retained.
- `docs/ALTIL_AUTHORIZATION_AUDIT.md`, `docs/ALTIL_AUTHORIZATION_ROUTE_INVENTORY.json`, `docs/ALTIL_CAPABILITY_AUDIT.md`, and `docs/ALTIL_ORGANIZATION_SECURITY_MODEL.md` — Stage 3 evidence and remaining limits.

### Database, validation and remaining risks

- No schema, migration, database, production, provider or server changes were performed. Existing `incident_events`, `tenant_applications`, `tenant_api_keys` and `audit_logs` shapes were inspected only. **Migration 024 remains unapplied.** The existing DSAR schema mismatch remains outstanding.
- No production schema assumptions were converted into migrations. Application/key persistence and incident event metadata need external schema evidence and runtime verification before deployment.
- Application lifecycle audit, durable key create/revoke audit, ITIL update/audit atomicity, remaining key-scope enforcement, IP/CIDR semantic validation, downstream application-policy authorization, and route-level HTTP tests remain open.
- No production connection, migration, provider, billing, or production-oriented server was started. No frontend runtime walkthrough was performed.
- 219 unreviewed route/method entries remain `NOT ASSESSED`; this is not full authorization coverage or a security certification.

## REMAINING RISKS

1. **HIGH — application/key audit durability:** events use the existing `audit_logs` table when connected but are best-effort and not in the same transaction as resource changes; no database-backed route test was run.
2. **HIGH — route integration proof:** the Stage 3 route handlers were source-reviewed and pure authorization/validation tests were added, but no HTTP integration tests or database-backed route tests were run.
3. **HIGH — incomplete key-scope model:** inference scope is checked; remaining UI-exposed key scopes are not proven to gate their corresponding operations.
4. **MEDIUM — ITIL audit atomicity and permission vocabulary:** existing `tenant.update` is reused, incident event metadata is not transactionally coupled, and no dedicated ITIL permission exists.
5. **MEDIUM — frontend runtime:** `apiFetch` wiring is source/type/build validated only; no browser walkthrough was run.
6. **UNKNOWN — database/deployment:** production schema, migration state beyond supplied evidence, installed code version, and deployed route behavior remain unverified.
7. **NOT ASSESSED — remaining routes:** route inventory entries outside the reviewed Stage 3 subset remain unassessed.

## NEXT RECOMMENDED CHUNK

After route-level isolated test seams and audit persistence semantics are established, continue with the next prioritized high-risk route family from the inventory. Do not start the broader Developer Platform workstream or apply migration 024 until the external production preflight evidence and explicit implementation gate are satisfied.

## AUDIT LIMITS

This is not a general security score, penetration test, deployment attestation or production evidence report. The inventory currently has 273 records and still contains 219 `NOT ASSESSED` whole-route results; the refresh check verifies each listed source location but does not prove inventory completeness against every Express declaration. No destructive tests, production SQL, migrations, provider calls or server startup were performed as part of the original audit.

## Stage 5 — Application and Credential Security (2026-09-29)

### Application Architecture

- **TEST VERIFIED:** `src/routes/applicationCredentialRoutes.ts` exports `createApplicationCredentialRouter()`. Production `server.ts` mounts this same router; isolated HTTP tests mount the same handlers without importing `server.ts`, starting its database/jobs/provider initialization, or copying handlers.
- The route dependency boundary exposes existing application/key/customer/policy state and persistence/audit functions. Production persistence and transaction behavior remain **REQUIRES DATABASE**; the HTTP suite substitutes only in-memory state and adapter functions.
- There is no application detail GET, PATCH, standalone status endpoint, membership endpoint, or environment entity relationship in this route family. Status is an allowlisted field of `PUT /applications/:id`; environment is a validated enum string (`production`, `staging`, `development`), not a separately verified resource relationship. Parent application and policy references are validated. Creation of an application also creates and returns a primary key. Credentials are otherwise separately managed.

### Application Authorization

| Route / method | WHO → ROLE → PERMISSION | ORGANIZATION → RELATIONSHIP → RESOURCE / SCOPE | Result |
|---|---|---|---|
| `GET /api/v1/applications` | Authenticated; `tenant.read` | Returns only applications whose recorded `customerId` is in organizations visible to that permission grant. Parent descendant access follows the existing active organization graph. | **TEST VERIFIED** |
| `POST /api/v1/applications` | Authenticated `SUPER_ADMIN` or `TENANT_ADMIN`; same grant must carry `tenant.update` and `apikeys.create` | Target organization must be authorized; target customer must exist; parent, if supplied, must be active and belong to that same organization; assigned policies must be readable and applicable there. | **TEST VERIFIED** |
| `PUT /api/v1/applications/:id` | Authenticated `SUPER_ADMIN` or `TENANT_ADMIN`; `tenant.update` | Resource owner organization is checked before update. Profile allowlist blocks reassignment of id, customer/tenant, parent, application type, and function identity. Policy updates require `policy.read` and organization-matching/global policies. | **TEST VERIFIED** |
| `DELETE /api/v1/applications/:id` | Authenticated `SUPER_ADMIN` or `TENANT_ADMIN`; both `tenant.update` and `apikeys.revoke` | Target application owner must be visible to both permissions in the same authorization context; associated keys are deleted with the app. | **TEST VERIFIED** |
| Application detail GET / status-only / PATCH / membership / environment CRUD | No route registered in this router | No handler to authorize or test. | **NOT IMPLEMENTED** |

Parent→child application creation/listing was allowed only with explicit descendant visibility and required permissions. Child→parent and child→sibling application creation are denied in HTTP tests. Known foreign application IDs are denied. Creation against a known foreign parent and foreign policy is denied. Identity reassignment through ordinary update is rejected. These are synthetic HTTP test results, not production database relationship verification.

### Application HTTP Tests

**TEST VERIFIED:** `src/server/applicationCredentialHttp.test.ts` uses a loopback ephemeral HTTP server, actual `requireAuthentication`, role/permission middleware, organization graph resolution, and the production route factory. Fixtures cover `org-A`, `org-B`, parent, child, sibling, own/foreign applications, read-only/update-only actors and explicit global grants. Unauthenticated application/key reads are rejected by the actual middleware. Test adapters assert that no database query occurs.

Covered outcomes include own list/create/update/delete, unrelated target denial, known foreign IDs, parent-descendant visibility, read-only mutation denial, update-only status update, identity reassignment denial, same-organization parent binding, policy scope, and key cascade. There is no application detail GET handler to test. Application create persistence and key persistence are sequential, not transactionally coupled; durable partial-failure behavior is **REQUIRES DATABASE**.

### Application BOLA/IDOR

- **TEST VERIFIED:** application update/delete return 404 for known foreign IDs. The route now gives the same response body for a foreign and a nonexistent ID, and tests compare them directly.
- **TEST VERIFIED:** a caller cannot select a foreign parent or policy or change an application's organization/tenant/parent identity through the ordinary update profile.
- Application DELETE executes key deletion and application deletion as separate SQL calls when connected; atomicity and foreign-key behavior are **REQUIRES DATABASE**. A partial durable delete remains a risk.

### Credential Architecture

- The existing `ApiKey` record remains the credential model, related by `customerId` (technical organization/tenant owner) and `appId`. The router does not introduce another credential entity or environment table.
- New in-process keys are stored with blank plaintext and a SHA-256 digest; the existing database adapter persists `key_hash`, prefix, status and metadata. Exact-secret lookup checks the digest/current legacy exact plaintext record. A key prefix is only a display identifier and no longer authenticates on `POST /api/v1/customers/validate-key`.
- Creation responses (`POST /applications`, `/api-keys`, and `/customers/:id/keys`) return plaintext once. Key listing omits plaintext/hash, revoke omits both, and delete returns only success. There is no individual GET, reveal, rotate, metadata-update, restriction-update, or scope-update route in this route family.
- `/customers/validate-key` is a public exact-credential validation route and returns key/customer/application metadata, scope and restrictions; it does not return the secret. Expired and revoked exact credentials are distinguishable by response status. Metadata disclosure to a holder of a valid exact key is **SOURCE VERIFIED** and should be considered in later API compatibility/security design.

### API-Key Authorization

| Route / method | WHO → ROLE → PERMISSION | ORGANIZATION → RELATIONSHIP → RESOURCE / SCOPE | Result |
|---|---|---|---|
| `POST /api/v1/customers/:id/keys` | Authenticated `SUPER_ADMIN` or `TENANT_ADMIN`; `apikeys.create` | Target customer must exist in the authorized organization; selected/connected application must be active and owned by it. | **SOURCE VERIFIED** — not HTTP tested |
| `POST /api/v1/api-keys` | Authenticated `SUPER_ADMIN` or `TENANT_ADMIN`; `apikeys.create` | Target organization must be authorized; chosen application must be active and have the same `customerId`. | **TEST VERIFIED** |
| `GET /api/v1/api-keys` | Authenticated; `tenant.read` | Loads/returns only keys whose customer organization is visible to the grant; plaintext/hash omitted. | **TEST VERIFIED** |
| `PUT /api/v1/api-keys/:id/revoke` | Authenticated `SUPER_ADMIN` or `TENANT_ADMIN`; `apikeys.revoke` | Key owner organization checked; foreign/nonexistent IDs return equivalent 404 response. | **TEST VERIFIED** |
| `DELETE /api/v1/api-keys/:id` | Authenticated `SUPER_ADMIN`; `apikeys.revoke` | Key owner authorization is still required after role/permission checks; foreign/nonexistent IDs return equivalent 404 response. | **TEST VERIFIED** |
| `POST /api/v1/customers/validate-key` | Public exact-key validation | Exact credential lookup; returns validation and limited customer/application metadata. | **TEST VERIFIED** |
| `GET /api-keys/:id`, reveal, rotate, metadata/restriction/scope update, archive | No handler registered | Obsolete/unregistered routes return 404 in the isolated app; no replacement behavior was fabricated. | **NOT IMPLEMENTED** |

### API-Key HTTP Tests

**TEST VERIFIED:** Actual route factory and authorization middleware cover same-org creation through `/api-keys`, foreign-org denial, active application binding, parent→child authorization, visible-only lists, revoke own/foreign, global-only delete, exact validation, prefix rejection, secret masking, and absent reveal/rotate/update paths. Key-A cannot be created against Application-B. The `/customers/:id/keys` creation route is source-reviewed but not HTTP tested. Environment binding has no separate entity/route and is **NOT IMPLEMENTED**. Tests assert that no database query runs.

### Scope Matrix

The allowlist in `src/security/commercialMutationValidation.ts` accepts and stores five exact scope strings. The existing UI displays four; `write:inference` is accepted by the backend but not displayed in `ApiKeysView.tsx`. No aliases or canonicalization are applied; values are exact strings. `apiKeyHasScope()` is a helper, not evidence of enforcement by itself.

| Scope | Accepted? | Stored? | Route enforcement / operation | HTTP tested | Status |
|---|---|---|---|---|---|
| `read:inference` | Yes | Yes | Inference request handler requires this exact scope before continuing. Provider-backed HTTP operation was not invoked. | Key creation/storage tested; runtime decision helper tested | **PARTIALLY IMPLEMENTED** |
| `write:inference` | Yes | Yes | No matching API-key-protected operation found. | Creation and denial as substitute for `read:inference` tested; no runtime endpoint | **NOT IMPLEMENTED** |
| `read:models` | Yes | Yes | No matching API-key scope enforcement found. | Creation/list value only; no protected operation | **NOT IMPLEMENTED** |
| `read:capabilities` | Yes | Yes | No matching API-key scope enforcement found. | No protected operation | **NOT IMPLEMENTED** |
| `write:telemetry` | Yes | Yes | No matching API-key scope enforcement found. | No protected operation | **NOT IMPLEMENTED** |
| read/write/delete, usage, billing, applications, webhooks, management, administration | No in this validator | No via this validator | No matching API-key scope-protected operation found; session IAM permissions are a distinct model. | No | **NOT IMPLEMENTED** |

An accepted, persisted, or UI-displayed scope is not proof that an operation enforces it. The route factory permits a credential manager with `apikeys.create` to request any allowlisted scope; no per-scope grant ceiling exists. No scope update route exists. Tests show `write:inference` does not satisfy the runtime `read:inference` requirement. Because no other protected operation was identified for the other scopes, a successful higher-privilege use was **NOT ASSESSED**; the current grant-ceiling model remains a material design risk before adding more scope-protected operations.

### Scope Escalation

- **TEST VERIFIED:** create with `write:inference` persists that requested scope, while the current inference runtime gate rejects it when `read:inference` is required.
- **TEST VERIFIED:** no scope/restriction/metadata update or rotate endpoint is registered; attempted routes return 404.
- **PARTIALLY IMPLEMENTED:** credential management authority (`apikeys.create` / `apikeys.revoke`) is distinct from runtime credential scope checks in code, but creation authority is not constrained by separate authority for each scope. No successful higher-privilege endpoint invocation was tested or found for the unimplemented scopes. Do not treat this as a complete scope-escalation prevention model.

### Application/Key Binding

**TEST VERIFIED:** key creation requires an active application with matching owner organization. The tested org-A key cannot attach to org-B's application. Application creation issues a key attached to the just-created application. The test suite also exercises parent→child organization grants only through the same authorized target and same-organization parent rules. No Environment entity binding exists; cross-environment ownership behavior is **NOT IMPLEMENTED**.

### Runtime Key Validation

- **TEST VERIFIED:** pure shared runtime checks deny missing credentials (401), revoked, expired, and missing-required-scope credentials (403), and allow an active, unexpired key with the exact required scope.
- The actual inference handler uses this helper and retains its prior response shape. The inference route was not mounted/invoked because continuing past the gate could call a real provider. Therefore provider-backed runtime HTTP, IP restriction, rate-limit, key-organization/application gate, and downstream capability/policy enforcement are **NOT ASSESSED** by this stage.
- Exact key validation over the actual public HTTP handler and the prefix-rejection case are **TEST VERIFIED**. Production database hash lookup is **REQUIRES DATABASE**.

### Secret Exposure

**TEST VERIFIED:** creation returns a synthetic secret in its one-time response; stored in-memory records retain only an empty plaintext field plus digest; list omits plaintext/hash; revoke omits plaintext/hash; delete returns `{success:true}`; validation does not echo the submitted key. Tests do not print generated values and audit fixture content is checked not to contain them. Logging behavior is **SOURCE VERIFIED** only; database persistence/logging channels are **REQUIRES DATABASE**.

### Audit Guarantees

- Application create/update/delete and key create/revoke/delete call the existing best-effort control-plane audit function with actor email, organization, action, resource, request ID when supplied, and before/after metadata where provided. Key scope metadata is included on create, not the key secret.
- Key revoke/delete additionally append an in-process `AuditLog` record containing actor in a sanitized preview, organization/resource in preview, key prefix, operation, timestamp and success outcome. Key create does not append that separate in-memory event.
- The isolated test audit adapter captures events in memory and verifies no key secret is included. Production audit durability/transaction coupling is **REQUIRES DATABASE**; these writes are best effort and not atomic with application/key mutations. Denied-action audit is not established by this route suite.

### Error Semantics

**TEST VERIFIED:** known foreign and nonexistent application IDs for update, and key IDs for revoke, return equivalent 404 body/status. Key list filters foreign records out. The delete routes use corresponding same not-found wording. The validation endpoint intentionally distinguishes invalid, revoked, and expired exact credentials; an invalid prefix does not authenticate.

### Database Limitations

The isolated HTTP tests used mocked persistence and did not connect to a database. A separate initial repo-wide Node test auto-discovery unexpectedly selected a generated server-test bundle and launched the production-oriented startup path. That attempt connected to the local loopback MariaDB service and emitted a failed startup `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` with a syntax error; the test process was stopped and its spawned Node processes were terminated. No migration runner was invoked. No production system or external provider was contacted. Because startup ran briefly, this review cannot certify that the local database had no other startup-side effect; no follow-up database inspection was performed. This incident is separate from the isolated Stage 5 test results. Live foreign keys, indexes, unique constraints, schema compatibility, concurrent key issuance/revocation, transaction semantics, DB hash lookup, and durability are **REQUIRES DATABASE**. Migration 024 remains unapplied.

### Test Verification and Remaining Risks

- **TEST VERIFIED:** Stage 5 HTTP route tests use actual application/credential handlers and middleware with in-memory repositories; shared credential helper unit tests cover digest storage, exact-secret lookup, and runtime status/scope/expiry decisions.
- **PARTIALLY IMPLEMENTED:** API-key scope enforcement is complete only for the inference `read:inference` gate. Other accepted/displayed scope values have no matching enforcement route in the inspected checkout.
- **PARTIALLY IMPLEMENTED:** credential creation permission can mint any validator-accepted scope. Scope-specific grant ceilings and a proven management-versus-runtime authorization policy remain a required security design dependency.
- **REQUIRES DATABASE:** app/key persistence atomicity, schema and audit durability. App creation saves application then key separately; app deletion issues key/app deletes separately. These paths can have partial persistence failures.
- **NOT ASSESSED:** provider-backed inference HTTP, API-key IP restrictions/rate enforcement through the gateway, production database, live environment relationship, and deployment behavior.
- Stage 4 statements that application/key routes were not HTTP-tested are superseded by the Stage 5 results above. This is not production authorization signoff or a general penetration test.

## STAGE 6 — Credential Authority + Test Safety (2026-09-29)

### Credential-Management → Credential-Runtime Contract

`src/security/credentialScopeAuthority.ts` separates runtime scope status from historical storage. `evaluateCredentialScopeGrant()` computes `maximumScopes` from the authenticated caller, target organization, selected application and requested scope list. It never derives global authority from a null/missing organization.

For the one runtime-enforced capability, a grant requires: (1) `apikeys.create` on the target organization through the existing authorization context; (2) an active application whose owner matches that organization; (3) at least one explicitly allowed application capability; and (4) the requested scope to fit the computed ceiling. Only `read:inference` is currently grantable. Explicit global Super Admin assignments are honored by the existing authorization context. The same scope decision is used by application creation’s automatic key, `/api-keys`, and `/customers/:id/keys`.

### Current Scope Classification

| Scope | Classification | Grant behavior | Runtime behavior |
|---|---|---|---|
| `read:inference` | **RUNTIME_ENFORCED** | Grantable only within the caller/application ceiling | Required by the inference handler before provider dispatch. |
| `write:inference` | **PERSISTED_NON_FUNCTIONAL** | Rejected for new credentials | Historic records do not authorize an operation. |
| `read:models` | **PERSISTED_NON_FUNCTIONAL** | Rejected for new credentials | Historic records do not authorize model listing; API-key model-list calls fail closed. |
| `read:capabilities` | **PERSISTED_NON_FUNCTIONAL** | Rejected for new credentials | No API-key operation is authorized by this value. |
| `write:telemetry` | **PERSISTED_NON_FUNCTIONAL** | Rejected for new credentials | No API-key operation is authorized by this value. |
| Unknown values | **REJECTED_UNSUPPORTED** | Rejected | Runtime validation denies them. |

`validateApiKeyRestrictions()` derives allowed grant values from the registry. `validateRuntimeApiKey()` rejects a stored legacy scope if a handler requests it. Gateway model, usage, tenant-profile and knowledge routes fail closed for API-key callers when there is no supported runtime scope; mobile device registration also fails closed for API keys. Existing bearer-session authorization remains separate. No model, usage, knowledge, telemetry or device API scope was implemented.

### HTTP Tests and Runtime Ordering

**TEST VERIFIED:** The actual extracted route factory and existing authorization middleware are tested over isolated loopback HTTP. Tests cover authorized inference-scope creation, an `apikeys.create` caller whose target application has no capability boundary, unsupported/legacy-scope rejection, cross-organization denial, foreign application binding, read-only denial, explicit global versus missing/null scope, and audit result fields. `read:inference` satisfies the shared runtime validator; `write:inference` does not. Persisted legacy scopes do not authorize their own operation.

The actual provider-backed inference endpoint was not invoked. A source-order regression check verifies that its runtime scope check precedes provider dispatch; the test also verifies no unsupported-scope gateway/device request reaches a provider or persistence branch. No external provider was called.

### Credential Lifecycle

- **SOURCE VERIFIED / TEST VERIFIED:** `CREATE → ACTIVE → REVOKED`; key expiry is accepted at creation and checked at runtime, but is not a persisted lifecycle transition. Plaintext is returned once by creation; issued state stores a digest.
- **NOT IMPLEMENTED:** Dedicated reveal, rotate, scope update, restriction update and archive routes. Delete exists only for explicit Super Admin authorization and removes the record.
- Legacy nonfunctional scopes may remain in historical records but cannot be granted anew or pass the shared runtime validator.

### Credential-Creation Audit

Scope-grant success, scope denial and credential-persistence failure events include actor, organization, application/resource, requested scopes, granted scopes, result/reason, request ID when supplied, and timestamp from the existing audit adapter. No plaintext secret is included. **SOURCE VERIFIED:** this uses the existing best-effort control-plane audit path. **REQUIRES DATABASE:** durability and atomicity with credential mutation are unverified; audit failure does not roll back a saved key.

### Test Safety

The unrestricted Node discovery failure was caused by the generated root file `altil-server-test.cjs` matching Node’s broad test naming convention. Stage 6 adds an explicit test manifest (`scripts/safe-test-files.mjs`) and runner (`scripts/run-safe-tests.mjs`). `npm test` invokes only the allowlisted TypeScript tests under `src`; a regression test compares that list to the source tests and excludes generated bundles and `server.ts`. Do not run unrestricted `node --test` in this repository.

`server.ts` now calls `startServer()` only when `server.ts`, `server.js` or built `server.cjs` is the process entrypoint. A child-process regression test imports `server.ts` with network access blocked and verifies no listener, database connection or provider request starts. The full route construction remains inside `startServer()`; extracting a complete `createApp()` was not necessary for the independently mounted application/credential router and would expand this stage.

Safe complete-suite command:

```text
npm test
```

### UI, OpenAPI and Remaining Limits

- **SOURCE VERIFIED:** `ApiKeysView` and `CustomersView` now offer only `read:inference` and identify it as enforced. Unsupported scope choices are removed.
- **TEST VERIFIED:** OpenAPI YAML parses. OpenAPI states that chat requires enforced `read:inference` and that API-key model listing is unavailable until a runtime scope exists; unsupported scope strings are not presented as working capabilities.
- **REQUIRES DATABASE:** schema compatibility, key persistence, audit durability and transaction behavior.
- **PARTIALLY IMPLEMENTED:** only inference currently has a grantable runtime scope. Non-inference gateway operations remain unavailable to API-key callers until their authority is separately designed and implemented.
- This is not production deployment evidence or authorization signoff. The earlier Stage 5 local startup incident remains disclosed above; it was not repeated in Stage 6.

## Stage 4 — HTTP Authorization Validation (2026-09-29)

### Reused test infrastructure and boundary

- `src/server/localTestHarness.ts` and `localTestHarness.test.ts` provide a loopback-only Express test server, deterministic LOCAL_TEST authentication, a bearer-session map, protected-route checks, synthetic response fixtures and explicit no-database/no-provider/no-persistence assertions. Its generic catch-all is a harness stub, so it is not evidence about the production handlers.
- `src/middleware/authMiddleware.ts` is importable independently. This stage uses the actual `requireAuthentication`, role/permission enforcement and authorization-context construction by mocking only the IAM repository return values and organization graph. The actual exported `itilRouter` and its repository are mounted in an ephemeral `127.0.0.1` HTTP server; handlers are not copied or replaced.
- Application, API-key, `/api/v1/overview` and `/api/v1/client-error` handlers remain embedded in `server.ts`. That file invokes `startServer()` at module load; startup initializes MariaDB, restores/persists state, starts cleanup and billing collection, and may verify providers. Therefore importing it to obtain those handlers would cross this task's safety boundary. No separate importable route factory exists in the inspected checkout. Those routes are **NOT ASSESSED over HTTP** in this stage.
- Fixtures use synthetic organizations `org-A`, `org-B`, `org-parent`, `org-child`, `org-sibling`, and `org-unrelated`, plus a global Super Admin, tenant admins, an incident commander, unrelated user, and read-only user. They are in-memory test fixtures only and are not production accounts.
- The ephemeral test app mounts the existing router at its existing `/api/v1/itil` prefix. The tests assert MariaDB is disconnected; the existing ITIL repository's in-memory path is used. No app/provider/billing route or provider transport is mounted.

### HTTP routes and outcomes

| Route / method | Fixture / case | HTTP result | Actual outcome |
|---|---|---:|---|
| `GET /api/v1/itil/incidents` | Missing or unknown session | 401 | Rejected by actual authentication middleware. |
| `GET /api/v1/itil/incidents?tenantId=org-A` | org-A admin, own resource | 200 | Own synthetic incident returned. |
| `GET /api/v1/itil/incidents?tenantId=org-B` | org-A admin, unrelated tenant | 403 | Generic route scope error; no incident data returned. |
| `PUT /api/v1/itil/incidents/stage4-incident-org-b` | org-A admin knows org-B incident ID | 404 | Tenant-bound lookup does not disclose the known foreign resource. |
| `GET ...?tenantId=org-child` | Parent descendant grant | 200 | Allowed for the active parent→child relationship with `tenant.read`. |
| `GET ...?tenantId=org-parent` | Child admin | 403 | Child-to-parent access denied. |
| `GET ...?tenantId=org-sibling` | Child admin | 403 | Sibling access denied. |
| `GET ...?tenantId=org-child` | Sibling admin | 403 | Sibling-to-sibling access denied. |
| `GET ...?tenantId=org-A` | Unrelated user | 403 | No target organization grant. |
| `GET ...?tenantId=all` | Explicit global Super Admin with `tenant.read` | 200 | Global incident list allowed and limited to visible organization IDs. |
| `GET ...?tenantId=all` | Tenant admin | 403 | Tenant role does not imply global scope. |
| `POST /api/v1/itil/incidents` | Read-only user / missing `tenant.update` | 403 | Mutation rejected by actual permission middleware. |
| `POST /api/v1/itil/incidents` | org-A admin targets org-B | 403 | Cross-tenant create rejected. |
| `POST /api/v1/itil/incidents` | org-A admin creates own incident | 201 | Actual route writes to the repository's in-memory fallback. |
| `POST /api/v1/itil/incidents` | Parent incident commander creates for child | 201 | Allowed by the explicit descendant grant and `tenant.update`. |
| `POST /api/v1/itil/incidents` | App relationship supplied while DB unavailable | 503 | Fails closed; no synthetic application relationship was asserted. |
| `PATCH /api/v1/itil/incidents/:id/status` | org-A admin, own incident | 200 | Existing status handler succeeds. |
| `PATCH /api/v1/itil/incidents/:id/status` | Parent incident commander, child incident | 200 | Explicit child target and `tenant.update` grant permit it. |
| `POST /api/v1/itil/alerts` | Parent incident commander, in-app alert for child incident | 202 | Existing handler queues the synthetic alert in process memory; no external notification provider is called. |
| `DELETE /api/v1/itil/incidents/:id` | Existing router | 404 | No incident DELETE handler is registered. |

**Applications/API keys:** source-verified routes include application GET/POST, PUT/DELETE; API-key GET/POST, revoke PUT and delete. These are **NOT HTTP TEST VERIFIED** because they are registered inside `server.ts` and no safe route-only import seam exists. Reveal, rotate, and API-key metadata/scope/restriction/expiration update endpoints were not found in the inspected registrations; their absence from this route inventory is not a claim about other services or deployments.

**Overview:** `/api/v1/overview` remains **NOT HTTP TEST VERIFIED**. `overviewAccess.test.ts` verifies the pure grant-to-metric policy, but no HTTP response body was obtained for tenant A, tenant B, parent, ordinary user, or global admin.

**Client diagnostics:** `/api/v1/client-error` remains public by source design. `anonymousDiagnostic.test.ts` verifies the pure allowlist/validation helper, but invalid/oversized/malformed/repeated payloads and actual rate-limit headers were **NOT HTTP TEST VERIFIED**. No file append or arbitrary-path behavior was exercised over HTTP in this stage.

### Identity and authorization matrix

The test fixtures exercised global `SUPER_ADMIN` + explicit `GLOBAL`, org-A and org-B `TENANT_ADMIN`, parent `DESCENDANTS` admin and incident commander, child and sibling tenant admins, unrelated `SUPPORT_AGENT`, and org-A read-only `TENANT_ADMIN`. HTTP assertions cover unauthenticated rejection, own scope, unrelated scope, parent→descendant, descendant→parent, sibling, global list, mutation without write permission, cross-tenant references, and known-ID access. No claim is made for customers, applications, API keys, orders, subscriptions, invoices, or payments because those resource handlers were not mounted and tested.

### Demonstrated correction

The first HTTP run exposed a concrete mismatch: `resolveAuthorizedTenantTarget()` accepted a requested target only when it equaled the actor's tenant or the grant was global. Consequently, a valid `DESCENDANTS` grant could pass `authorizeInContext()` but could not select the descendant tenant in ITIL reads/writes. The helper now accepts an optional required permission and permits a different target only when that permission is present on a grant whose visible organization set includes the target. ITIL incident read uses `tenant.read`; create/update/status/alert target resolution uses `tenant.update`. Calls without this option retain their previous own-tenant/global behavior. Unit and HTTP tests verify descendant access is permission-bound, unrelated targets remain denied, and the tenant ID itself does not confer authority.

### BOLA / response leakage

- **TEST VERIFIED for ITIL incident IDs only:** an org-A user who knows the org-B incident ID receives 404 and the response body contains no org-B identifier or incident fields.
- Explicitly requesting another tenant in an incident list returns 403 with a fixed scope error. This reveals that the requested target was unauthorized, but does not return information about whether that tenant has records.
- Application, API-key, customer, order, subscription, invoice, and payment BOLA/IDOR probes are **NOT ASSESSED** at HTTP level.
- Denied response bodies were checked for tested ITIL cases. No general consistency claim is made for untested routes.

### API-key scope inventory

This table is source-reviewed against `validateApiKeyRestrictions()`, the API-key UI vocabulary, and the only `apiKeyHasScope()` call found in `server.ts`. “HTTP tested” means the corresponding API-key route or gateway route was actually probed; no API-key/gateway route was mounted in Stage 4.

| Scope | Used/displayed by | Enforcement route found | HTTP tested | Status |
|---|---|---|---|---|
| `read:inference` | API-key UI/defaults and key records | `server.ts` inference handler checks this exact scope | No | **PARTIALLY IMPLEMENTED** — explicit handler check exists; not route-tested here. |
| `write:inference` | Accepted by key restriction validator; Trust Fabric fixture | No `apiKeyHasScope()` check found | No | **NOT IMPLEMENTED** — accepted data does not demonstrate enforcement. |
| `read:models` | API-key UI/defaults and key records | No API-key scope check found | No | **NOT IMPLEMENTED**. |
| `read:capabilities` | API-key UI and validator | No API-key scope check found | No | **NOT IMPLEMENTED**. |
| `write:telemetry` | API-key UI and validator | No API-key scope check found | No | **NOT IMPLEMENTED**. |
| API-key `read/write/delete`, `billing`, `administration`, `applications`, `webhooks`, `management`, `usage` scope names | Requested review categories; not present in the accepted key-scope vocabulary | No matching API-key scope enforcement found | No | **NOT IMPLEMENTED / NOT A SUPPORTED SCOPE** in the inspected validator. Session permissions/routes are separate from API-key scopes. |

Secret response handling is **SOURCE VERIFIED**: list maps remove `key` and `keyHash`; create returns the generated key once; revoke omits the key. These behaviors remain **NOT HTTP TEST VERIFIED**. API-key create requires `apikeys.create`, target organization access, and an active application attached to the same customer; scope-escalation and cross-organization application attachment have unit/source checks only, not HTTP tests. No reveal or rotate route was found in the inspected declarations. Management-credential versus inference-credential separation is **NOT ASSESSED**.

### Audit guarantees

- **HTTP TEST VERIFIED, in-memory only:** successful incident create/status and alert queue operations add process-local events. The test observed actor (for status/alert), incident ID, event type and tenant. The in-memory event getter does not expose request ID, prior/new state, outcome, or a durable timestamp schema; stronger audit claims are not made.
- **SOURCE VERIFIED when database-backed:** incident create/update/status and alert operations prepare mutation and `incident_events` insert statements in the existing transaction helper. The database path was not exercised and is **NOT DATABASE VERIFIED**.
- **SOURCE VERIFIED in memory:** in-memory incident mutation and its event are separate process-local operations; they are not durable and are not crash-atomic.
- Authorization permission/scope denials emit a sanitized structured console event from middleware. `requireRole` denials do not use that permission-denial logger. Denied-action durable audit is **NOT ESTABLISHED**.
- Application audit uses a best-effort `audit_logs` write and is not transactionally coupled; API-key create/revoke audit is best effort or process-local per the Stage 3 source audit. Neither was HTTP tested.

### Test verification and limitations

- New `src/server/httpAuthorization.test.ts` mounts actual `itilRouter` and actual authentication middleware on an ephemeral `127.0.0.1` server, using synthetic IAM return fixtures and the existing in-memory ITIL repository. It does not mount copied CRUD handlers.
- The first run found a failing parent→descendant case. After the narrow permission-bound target-resolution correction, HTTP and related pure authorization tests passed: **13 passed, 0 failed** across the focused test command.
- Application and API-key route behavior, customer/account resources, overview response segregation, and client-error HTTP abuse controls remain **NOT ASSESSED**. No result from the LOCAL_TEST generic fallback is represented as proof of production route behavior.
- Database-backed persistence, transaction atomicity, live foreign keys, production schema compatibility, deployment/runtime behavior, and all provider/payment behavior remain **REQUIRES DATABASE / PRODUCTION EVIDENCE** or **NOT ASSESSED** as applicable. No production signoff is implied.
