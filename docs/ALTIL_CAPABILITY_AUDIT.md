# ALTIL Capability Audit — Discovery Baseline

## Stage 3 authorization hardening update — 2026-09-29

The capability inventory is a source baseline, not route certification. Stage 3 rewired protected same-origin frontend API calls through the existing `apiFetch` helper; scoped `/api/v1/overview`; restricted anonymous client diagnostics; added organization/relationship checks to ITIL incident operations and application/API-key mutations; and masked key data from normal responses. Application and key audit durability, full key-scope enforcement, live schema compatibility, and HTTP route behavior remain partial or unverified. See `docs/ALTIL_AUTHORIZATION_AUDIT.md` for route-level findings. No new customer, tenant, application, credential, policy, trust, audit, or billing subsystem was introduced.

**Review date:** 2026-09-29
**Review type:** repository/source inspection
**Branch:** `audit/latest-20260929`

## Purpose and evidence boundary

This is the discovery baseline for the ALTIL Master Implementation Directive. It describes capabilities visible in the inspected checkout and migrations. It is not a deployment inventory, production verification, standards certification, security attestation, or claim that every inspected path is deployed or operational.

No live database was queried for this audit. Database observations below come from migration/source files only. The current working tree already contains unstaged changes; those changes have been preserved and are identified as in-progress where relevant. Do not treat an unapplied migration or local implementation as a production fact.

The status labels mean:

- **EXISTING** — source or schema structure is present.
- **REUSE** — an existing capability is the intended base for further work.
- **ENHANCE / EXTEND** — it needs stronger behavior or broader coverage.
- **REWIRE** — existing pieces need an explicit integration seam.
- **MISSING** — no corresponding implementation was found in the inspected areas.
- **PARTIAL** — some paths work, but the end-to-end capability is not established.
- **UNKNOWN** — runtime/deployment or production evidence was not inspected.

## Executive findings

ALTIL is an existing multi-domain application, not a blank project. It has customer/tenant administration, IAM, applications, API keys, licensing and billing, provider/model configuration, a tenant-authenticated AI gateway, policies, trust/DCR/compliance, operational modules, and a sizeable administrative UI. Commercial Phase 4 domain modules A–F and an organization-scope/IAM implementation are also present in this checkout.

The main architectural gap is integration and proof: several strong domain surfaces exist, but a unified project/environment/machine-identity model, consistent authorization/scope enforcement across every route, a common request decision/trace model, and a complete generated capability contract are not established end to end. A partial source-reviewed capability inventory is now wired into an authenticated API, the API documentation UI, the Swagger contract, and the Screen Assistant context. Route checks in the current local slice now bind permission and target organization to the same grant for key customer, portal and application mutations, and billing read filters use billing-read-authorized organizations. These are bounded source changes, not a complete route audit. The checked-in OpenAPI documents only a subset and do not by themselves prove runtime behavior.

## Capability inventory

| Capability | Classification | Evidence in this checkout | Current boundary / next discovery |
|---|---|---|---|
| Customer and tenant administration | EXISTING / REUSE / PARTIAL | `server.ts` customer CRUD and tenant portal routes; `CustomersView.tsx`; migrations 001, 013, 016 | Existing technical tenant/customer naming is not equivalent to the new commercial-party model. Preserve existing IDs and relationships. Confirm authorization and repository behavior route by route. |
| Organisation hierarchy | EXISTING / ENHANCE | `OrgHierarchyView.tsx`; tenant `metadata_json` in migration 013; in-progress `src/security/organizationScope.ts`, `src/security/authorizationContext.ts`, `src/db/mariadb.ts` | Live production hierarchy and constraints remain unknown. Metadata-derived links need evidence and fail-closed behavior. |
| IAM and sessions | EXISTING / ENHANCE | `src/routes/authRoutes.ts`; `src/middleware/authMiddleware.ts`; `src/db/iamRepository.ts`; migrations 002, 009 and in-progress 024; `src/security/legacyIamAssignments.ts`; `src/security/permissionImplications.ts` | Current working tree adds grant/scope handling. If `access_scope` alone is missing, tenant-bound legacy assignments are retained as organization-only grants and null-scoped assignments are omitted. Legacy write codes are mapped to explicit current permission codes; read codes do not imply write authority. Migration 024 is untracked/unapplied. Production schema compatibility and rollout are unverified. |
| Applications | EXISTING / REUSE | `ApplicationsView.tsx`; `/api/v1/applications` in `server.ts`; `tenant_applications` in migrations 001 and 012 | Environment appears on application records/UI; no first-class project/environment resource API was found in inspected routes/migrations. |
| API keys and runtime credentials | EXISTING / REUSE / ENHANCE | `ApiKeysView.tsx`; `/api/v1/api-keys` and customer key routes in `server.ts`; `tenant_api_keys` migration 012; gateway key authentication | Runtime key creation/revocation exists. Separate management credentials, programmatic provisioning lifecycle, complete restriction dimensions, rotation history and once-only reveal guarantees require further verification. |
| AI gateway and compatible API | EXISTING / PARTIAL | `server.ts` `/v1/models`, chat-completion and responses-style handlers, gateway authentication, usage endpoints; `docs/openapi.yaml`; dynamic gateway OpenAPI endpoint | Only implemented endpoints should be advertised. Streaming and other modalities/batch/tools must be verified individually; do not infer compatibility from route names or docs. |
| Providers and models | EXISTING / REUSE / PARTIAL | `ProvidersView.tsx`, `ModelsView.tsx`, provider adapter/routing helpers in `server.ts`; migrations 001 and 022 | Adapters and credentials are provider-specific. Availability, pricing, capability metadata and live health require runtime/provider evidence. No external provider was contacted in this review. |
| Routing | EXISTING / PARTIAL | route/routing-rule handlers and `RoutingView.tsx`; gateway selection/fallback code in `server.ts` | Routing exists, but a unified recorded explanation tying policy, trust, health, cost and fallback to each request was not established by this discovery pass. |
| Policies, trust, DCR and compliance | EXISTING / REUSE / PARTIAL | `policyEngine.ts`, `complianceEngine.ts`, `dcrEngine.ts`; policy, trust, DCR and compliance routes/views | Separate domain surfaces exist. A single authoritative trust contract and end-to-end policy decision contract across credentials, APIs and provider calls require further integration review. |
| Usage and FinOps | EXISTING / EXTEND | `/api/v1/usage`, gateway usage; `UsageLogsView.tsx`, `FinOpsView.tsx`; migration 011; Phase 4 Stage D/F modules; `src/security/scopedUsage.ts` | `/api/v1/usage` filters applications/counters to organizations carrying `tenant.read` and returns missing daily/provider metrics as unavailable. Usage, provider cost and customer charge must stay distinct. A complete request-to-charge-to-invoice lineage is not established by the presence of counters or UI. |
| Commercial lifecycle | EXISTING / REUSE / EXTEND | billing products/orders/invoices/payments/reconciliation/accounting migrations 015, 018–023; Phase 4 Stage A–F modules and plans | Existing financial IDs/history are authoritative. Stage modules are local domain implementations; persistence/API deployment and production evidence remain separate gates. |
| Webhooks and events | EXISTING / PARTIAL | payment webhook/event routes and migrations 001, 018; OpenAPI webhook paths | Inbound payment-provider events exist. A general customer-configurable outbound webhook subscription, signing, retry, replay and delivery-history platform was not found in the inspected inventory. |
| Audit and observability | EXISTING / PARTIAL | `audit_logs` in migration 001; logs, usage, telemetry and operations UI/routes | Audit, logs, metrics and traces are not interchangeable. A common request trace spanning auth → policy → trust → routing → provider → usage/cost → audit was not established. |
| API discovery and OpenAPI | EXISTING / PARTIAL | `src/capabilities/capabilityRegistry.ts`; authenticated `GET /api/v1/capabilities`; `docs/openapi.yaml` (OpenAPI 3.1); static document route and a smaller dynamic gateway OpenAPI document | A reviewed subset includes route, method, auth, permissions, scope, UI, source, status, and caller availability. The inventory is explicitly partial. The checked-in contract still covers only a subset; generation/drift detection and route-level permission/scope completeness need work. |
| Developer onboarding and API explorer | EXISTING / PARTIAL | `ApiDocumentationView.tsx`, `PlaygroundView.tsx`, `ApiKeysView.tsx`, `ApplicationsView.tsx`, developer/help docs | Useful surfaces exist, but the full project → environment → application → identity → credential → policy → first request journey was not found as one verified workflow. |
| Projects and environments | MISSING as first-class API/schema in inspected files | No project/environment migration or corresponding project/environment route found in migrations 001–024 and inspected route declarations; application UI has an environment attribute | Avoid adding duplicate abstractions until existing application metadata and customer/tenant semantics are fully mapped. |
| SDK, CLI, declarative automation | MISSING / NOT ASSESSED | No SDK/CLI package or generated-client workflow found in the inspected repository inventory | Candidate future work after the API contract and auth/scope model are stable. |
| API marketplace and external enterprise connectors | MISSING / NOT ASSESSED | No marketplace/connector framework found in the inspected route/migration inventory | Do not represent conceptual product packaging as an implemented capability. |
| ALTIL AI and Q&A | EXISTING / PARTIAL | Screen assistant/orchestration/RAG routes, `ScreenAssistant.tsx`, Q&A/help surfaces; capability inventory context passed to the Screen Assistant | The assistant receives a partial source-backed route/status/availability context. Explanations must remain bounded by its evidence; generated text must not make authorization or compliance decisions. |
| Capability registry | PARTIAL / REUSE | `src/capabilities/capabilityRegistry.ts`; authenticated API route; API Documentation UI; OpenAPI entry; Screen Assistant context | This is a hand-reviewed subset, not generated route discovery and not a complete capability map. Availability evaluation requires all listed permissions on one grant (and required role on that grant); it must be expanded with source/tests and synchronized with actual authorization handlers. |
| Standards assurance | EXISTING documentation / NOT CERTIFIED | Phase 3 enterprise security policy audit and legal/compliance documentation | Documentation and simulations do not establish ISO, SOC 2, POPIA/GDPR, or other certification/compliance. A control-to-evidence crosswalk is still needed. |

## Existing foundation to preserve

The following should be reused and extended rather than replaced:

- `tenants`, tenant applications, tenant API keys, licensing, provider/model and usage structures in migrations 001–023.
- Customer, application, API-key, billing, payment, settlement/reconciliation, accounting, policy, trust, compliance, DCR and operational route/UI surfaces already present.
- Commercial Stage A–F domain modules, while keeping their local status distinct from production persistence/deployment.
- `docs/openapi.yaml` and the gateway discovery route as existing contracts to consolidate and validate, not silently replace.

No claim is made here that every currently staged or unstaged local change is ready for production.

## Highest-priority gaps and implementation sequence

1. **Close the IAM/scope foundation first.** Verify each route uses the same authenticated authorization context; prove global, organization, descendants/tree, sibling denial, missing-target denial, and tamper resistance. This is the active in-progress security work and blocks broader developer CRUD.
2. **Expand and validate the source-backed capability/API registry.** Inventory actual route, method, auth, permission, scope, handler, persistence, UI action and status. Generate or validate OpenAPI against it to reduce drift.
3. **Define project/environment integration without duplicating applications or tenants.** Resolve resource ownership and compatibility from source plus approved schema evidence before adding endpoints or tables.
4. **Harden the existing key lifecycle.** Separate management from runtime authority; define scope, environment, expiry, rotation, revocation and audit using existing key persistence where possible.
5. **Unify policy/trust decision evidence.** Make decisions deterministic and auditable; ALTIL AI may explain, not decide.
6. **Add request-level traceability across the existing gateway.** Preserve provider cost/customer charge separation and connect usage only where source evidence supports it.
7. **Build broader outbound events, SDKs/CLI, marketplace and connector surfaces only after their API/security contracts are stable.**
8. **Perform UI consolidation and standards evidence mapping against real implemented routes and controls.**

## Evidence still required

- Live production schema/version/constraints and relationship results from the approved external evidence process.
- Which local source paths are deployed and actively used in production.
- Provider availability, credentials, pricing, health, and actual supported model capabilities.
- Runtime authorization behavior for routes not covered by focused tests.
- Actual observability retention, trace completeness, webhook delivery/retry behavior, and performance under load.
- Any formal standards assessment/certification and associated evidence.

Absence from the inspected checkout, an empty local collection, an unqueried production database, or an unverified route is not evidence that the corresponding production capability is unused or absent.

## Review scope and non-actions

Reviewed source/documentation inventories, migration definitions, API/UI declarations, and existing test-file inventory. No production connection, live database query, provider call, migration run, application startup, commit or push was performed as part of this discovery chunk. The audit is a baseline, not a declaration of project completion.
