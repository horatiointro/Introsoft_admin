# ALTIL Organization Hierarchy and Tenant Security Model

## Stage 3 update — 2026-09-29

The current source now applies same-grant organization authorization to reviewed application create/delete and ITIL incident/alert mutations. Global ITIL list and overview data require an explicit `SUPER_ADMIN` + `GLOBAL` assignment carrying the needed read permission; a role name or permissions split across grants does not grant global access. Incident updates include a tenant-qualified lookup/write and reuse `incident_events` for actor, tenant, request ID and prior/new state metadata. Application and API-key events use the existing `audit_logs` table when connected, but those audit writes are best-effort and not transactionally coupled to the resource mutation. These source changes do not establish production schema compatibility or deployed behavior; migration 024 remains unapplied.

## Status and boundary

This document describes the target model and records both the earlier source-inspection baseline and the current local implementation slice. The current checkout now resolves IAM assignment scopes during authenticated requests and enforces them on selected high-value routes and lists. This is partial enforcement, not a complete API certification or production deployment. Migration `024_iam_authorization_scopes.sql` has not been run.

No production facts are asserted here. Source inspection establishes only what the inspected checkout contains, not what is deployed or active.

## Organization and party hierarchy

The intended structure is an unlimited-depth organization graph rooted at Introsoft. An organization can relate to subsidiaries, partners, resellers, direct clients, other clients, and individual clients. A party retains its own identity; a relationship describes its position and commercial/operational meaning.

The current `Customer` model already has `id`, `type` (`company` or `individual`), `parentId`, and `orgRole`. This is useful compatibility data, but `parentId` expresses at most one parent edge and has no effective dates or relationship status. Do not invent a second persisted relationship source until ownership and compatibility with current data have been established. The pure scope helper can resolve a supplied multi-edge graph, but that graph has no production repository yet.

Individuals and companies are distinct party types. Company legal name, registration, VAT/tax, industry, and statutory officer details are company-specific. The registration UI now hides those fields for individuals, validates name and contact email, and omits company-only fields from individual payloads. Existing individual records are not cleared by the UI when those fields are hidden. Existing update handlers merge submitted fields into the stored object. The create handler may still normalize a missing legal name to the party name; this server behavior has not been changed in this task.

## Separate ownership, relationships, administration, permissions, and scope

These concepts must remain independent:

| Concept | Meaning |
| --- | --- |
| Organization ownership | Which party owns or controls another party, if established |
| Organization relationship | A typed and effective-dated link such as PARTNER or CLIENT |
| User administration | Which organization a user belongs to and which users an administrator may manage |
| Permission | Which operation is allowed, such as `user.update` |
| Access scope | Which organization resources the permission applies to |

The target evaluation order is authenticated actor → role assignment → permission → target organization → effective relationship graph → explicit scope → resource/object ownership → allow or deny. Browser-supplied IDs are selectors, never proof of authorization.

## Access scope model

`src/security/organizationScope.ts` resolves `GLOBAL`, `ORGANISATION`, `DESCENDANTS`, `SELF`, and `TREE` scopes over an arbitrary-depth graph with effective-date filtering and cycle protection. `src/security/authorizationContext.ts` builds grants only from server-loaded IAM assignments; `authorizeInContext()` requires both a permission and target membership in the grant's resolved organization set. `GLOBAL` is accepted only for a `SUPER_ADMIN` assignment with a null organization and explicit `GLOBAL` visibility. When the newer `access_scope` column is absent, `IamRepository.getAuthorizationAssignments()` retries using legacy assignment columns and keeps only concrete tenant-bound rows as `ORGANISATION` grants; it deliberately drops NULL-scoped rows because the legacy schema cannot prove a global grant.

`src/middleware/authMiddleware.ts` now loads assignment permissions/scope from `IamRepository.getAuthorizationAssignments()` and the organization graph from `dbRepository.getOrganizationGraph()`, then attaches the resolved context to `req.user.authorization`. Role and permission guards use that context. `requireTenantAccess()` denies missing target IDs and IDs outside the resolved grants. `requireOrganizationPermission()` requires the requested permission and target organization to be satisfied by one grant, preventing scope from one assignment being combined with a permission from another. `organizationsAuthorizedFor()` provides list-query scopes derived only from grants carrying the requested permission. If the scope schema/query is unavailable for any reason other than the specifically detected missing `access_scope` column, protected authorization fails closed. The compatibility graph currently adapts existing tenant `parentId` plus recognized `orgRole` metadata into active edges; the source schema still lacks persisted relationship status/effective dates, so those cannot be claimed as production-verified relationship facts.

## Tenant isolation and current source evidence

The current backend still has tenant-ID query and object-access patterns that require security changes before a hierarchical tenant-admin experience can be called safe. In particular, a NULL tenant must not mean “globally visible”; only a verified global authorization assignment may receive platform-wide scope.

| Route or source | Current guard/query behavior observed | Required follow-up |
| --- | --- | --- |
| `GET /api/v1/iam/users` (`src/routes/authRoutes.ts`) | Super Admin can select a tenant filter; other allowed roles use their `req.user.tenantId`. `IamRepository.getUsers()` includes `tenant_id = ? OR tenant_id IS NULL` when filtered. | Replace implicit NULL visibility with explicit global assignments; resolve descendant scope server-side. |
| `POST /api/v1/iam/users` (`src/routes/authRoutes.ts`) | Role guard is Super Admin/Security Admin; calls `upsertUser(req.body)` without binding the requested organization to an authorized scope. | Derive organization and role assignment scope from verified server-side authorization; reject ID tampering. |
| `POST /api/v1/iam/users/:id/reset-password` (`src/routes/authRoutes.ts`) | Tenant Admin is admitted by role; target user is not checked against the actor's organization in this route. | Load target ownership and authorize `user.update` against that organization before reset. |
| `GET/PUT /api/v1/customers/:id` (`server.ts`) | Exact tenant check is present for non-Super Admin. `PUT` merges request fields after lookup by path ID. | Use permission plus resolved organization scope and validate any organization/parent changes independently. |
| `POST/PUT/DELETE /api/v1/customers/:id/users` (`server.ts`) | Exact path-tenant guard and role guard; nested lookup for update/delete is confined to the path customer in current memory model. | Replace role-only decisions with explicit `user.create/update/disable` permission and object-scope checks. DELETE currently removes the member instead of disabling. |
| `POST /api/v1/applications` (`server.ts`) | Tenant Admin allowed; tenant selection falls back through authenticated tenant, body `customerId`, then first customer. It creates a key as part of the same handler. | Never use body/default tenant selection for non-global callers; authorize the target application scope and separate lifecycle effects. |
| `PUT/DELETE /api/v1/applications/:id` (`server.ts`) | Handler performs exact customer/tenant equality checks, with Super Admin role bypass. | Use resolved organization scope and validate body changes cannot transfer ownership. |
| `POST /api/v1/api-keys` (`server.ts`) | Non-Super Admin key creation uses authenticated tenant; active application must match that tenant. | Add explicit permission/scope checks and immutable owner validation for all key operations. |
| `PUT /api/v1/api-keys/:id/revoke` (`server.ts`) | Exact tenant equality check for non-Super Admin. | Replace role shortcut with resolved scope and object authorization. |
| `GET /api/v1/tenant-portal/:id` (`server.ts`) | Exact tenant guard; query work is filtered by tenant ID. | Keep tenant boundary and enforce explicit customer relationship permission before returning commercial dimensions. |
| `PATCH /api/v1/tenant-portal/:id/keys/:keyId/limits` (`server.ts`) | Portal key limit patch checks path tenant and key customer ID. | Retain object ownership check, and use permission plus scope instead of role-only authorization. |
| `src/db/itilRepository.ts`, `src/db/complianceRepository.ts` | Tenant-filtered reads include `tenant_id IS NULL`; ITIL fallback behavior also needs inspection per method. | Classify intentional platform-wide records explicitly and prevent NULL from widening tenant visibility. |
| ITIL route queries in `src/routes/itilRoutes.ts` | Incidents/problems/change request reads contain `tenant_id = ? OR tenant_id IS NULL` patterns. | Scope each resource and distinguish explicitly global records from unowned records. |

The table above is the pre-enforcement source-inspection snapshot, not a statement of current handler behavior. The current local slice additionally enforces scope on customer list/detail/update/archive, nested customer users and key creation, application list/create/delete/update, API-key list/create/revoke/delete, scoped tenant portal reads, IAM user list/upsert/reset, tenant license lists, billing order/invoice/ledger/payment-method/payment/refund/schedule lists, accounting journal/summary reads, and selected order/invoice mutations. Target-resource checks on customer, nested user, application creation, and tenant-portal operations now bind permission to the target scope in one grant. Customer, application, key, billing, and user lists use permission-specific resolved IDs; customer lists and app/key repository loaders now issue ID-scoped queries where available. Billing reads similarly use organizations carrying `billing.read`; manual journal posting checks `billing.write` for the target organization. `GET /api/v1/usage` requires `tenant.read`, filters application rows to organizations carrying that permission, aggregates only stored usage entries inside that scope, and no longer returns hard-coded platform-wide totals. Daily and provider-share metrics are unavailable from this handler and are returned as null/empty. This remains an incomplete route audit. Provider/model/routing, ITIL, compliance, DCR, and many reconciliation/settlement and security route families still have role-only or other compatibility paths and require separate review before release.

## Tenant administrator model

A tenant administrator should receive only explicitly granted permissions and organization visibility. `TENANT_ADMIN` must not itself imply access to every route or every descendant. A client administrator normally receives `SELF`; a partner or subsidiary administrator may receive `DESCENDANTS` only through an explicit server-verified grant. Parent access is not implied by a child relationship. Siblings are never visible unless independently authorized.

User creation, update, and disable operations must check both permission (`user.create`, `user.update`, or `user.disable`) and target organization scope. The target user must be loaded from persistence and its current organization verified before mutation. Request-supplied `tenantId`, `customerId`, `organizationId`, `parentId`, `applicationId`, or `apiKeyId` cannot expand that scope.

The current Stage A–F LOCAL TEST harness remains read-only for writes. Its write denial is intentional; it is not a reason to weaken middleware or introduce production writes in local validation.

## Super Admin model

The platform owner is Introsoft. The target is an explicit platform organization with a verified global assignment and `GLOBAL` scope. The current role-only Super Admin short-circuits are compatibility behavior in the inspected checkout, not proof of an explicit global-scope grant. Do not weaken Super Admin access; make its global assignment explicit and preserve it through an approved production auth design.

## Navigation and organization tree

Navigation and organization-tree visibility should be generated from server-authorized scope and permissions, with the API remaining authoritative. Platform-only navigation must not render for tenant administrators. A tenant user should see the organization they administer and a clear scope label. Tree queries must be constrained using the same authorization scope as data endpoints; filtering a complete tree in React is insufficient.

`src/components/Sidebar.tsx` now receives permissions and global status from `/api/v1/auth/me`, filters its navigation entries accordingly, and displays the authenticated user identity rather than a hard-coded platform administrator. `src/App.tsx` displays a scope label from the server-resolved `/auth/me` context. This is presentation only; it does not replace route checks. The organization tree itself and several dashboard/report screens are not yet filtered end-to-end and must not be treated as secure solely because a menu entry is hidden.

## Customer and product lifecycle

Customer identity registration remains distinct from application, API-key, product, and order lifecycle. Existing customer information should be selected and reused when a customer acquires another product. Existing server behavior can create an application and production API key during customer creation when `initialApplicationName` is supplied; this remains a lifecycle coupling requiring a separately reviewed change. The registration UI correction does not add customer-to-commercial-party mappings or infer commercial identities from technical tenant IDs.

## Test fixtures and proof boundaries

`src/security/organizationScope.test.ts` contains deterministic in-memory hierarchy nodes and synthetic admin/member identities for Introsoft, partners, a subsidiary, clients, and an individual. These fixtures exercise the pure resolver only. They are not IAM users, persisted records, LOCAL_TEST write fixtures, route-level authorization tests, or evidence of production structure.

Before claiming the hierarchical security model is implemented, add integration tests against actual middleware/routes and repository queries for global scope, self scope, descendant scope, parent/child/sibling isolation, all user-management operations, and request-ID tampering. Current pure tests cannot prove any of those API properties.

## Completion gate

The current implementation is a local source change only. Pure resolver and middleware guard unit tests exercise explicit scope, permission checks, missing-target denial, sibling ID substitution, and explicit global Super Admin assignment. These are not full HTTP route/repository integration tests. Migration `024` is unapplied; live foreign keys, cardinality, production role assignment meaning, and deployment/runtime behavior remain unverified. The current route coverage does not yet establish safe CRUD across every resource, full repository isolation, scoped search/autocomplete/export, complete UI data isolation, or ALTIL AI context enforcement. Do not declare the hierarchy complete until remaining route families are audited, integration tests exercise actual handlers and repositories, schema/effective relationship evidence is reviewed, and migration compatibility is approved.
