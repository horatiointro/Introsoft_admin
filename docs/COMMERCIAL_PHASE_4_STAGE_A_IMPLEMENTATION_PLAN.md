# ALTIL Phase 4 Stage A — Party / Account Foundation Plan

**Status:** Implementation-readiness plan only.
**Architecture baseline:** [Phase 4 Architecture Specification](./COMMERCIAL_PHASE_4_ARCHITECTURE_SPEC.md).
**Stage:** A — Party / Account Foundation.
**Authorization:** No implementation is authorized by this document.

## 1. Purpose and constraints

Stage A establishes explicit commercial party/account identities and their mappings to existing technical tenant(s), without changing runtime tenant isolation or replacing financial records. The intended chain is:

Customer → Organisation → Legal Entity → Billing Account → explicit mapping to existing technical tenant(s)

This plan distinguishes (a) facts established by inspected repository schema/source, (b) production snapshot facts supplied from Phase 3B, and (c) design decisions that remain assumptions pending review. Production facts are point-in-time only. The production database was `altil_db`, MariaDB `10.11.18-MariaDB-0+deb12u1`, 61 tables, migrations 001–023 applied. The captured production state contains one tenant (`tenant-altil-internal`), one application, one API key, one active ZAR 85 order and line, and ten billing products. No production relationship checks beyond those explicitly supplied are assumed here. Zero rows in downstream finance tables are not evidence that a feature is broken, never used, undeployed, or unnecessary.

Prohibited for Stage A planning and future implementation absent further authorization: modifying application/runtime behavior, changing existing IDs, rewriting historical financial data, guessing party ownership, weakening tenant checks, or treating a technical tenant as a legal/commercial identity.

## 2. Current state inventory

### 2.1 Verified source/schema facts

| Existing object | Verified source/schema role | Stage A relevance / limitation |
|---|---|---|
| `tenants` | Migration 001 stores tenant identity, status and `metadata_json`; tenant is the main access/security scope. `server.ts` loads the tenant metadata into the in-memory `Customer` shape. | Existing tenant record remains unchanged. A UI/API “customer” object is currently tenant-backed; that does not prove legal customer identity. |
| `tenant_applications` | Migration 001 includes `tenant_id`, application identity/capability/status and metadata; schema has a tenant FK. Server persistence upserts by application ID. | Preserve IDs and tenant link. A production count of one application does not establish its customer/org relationship unless queried. |
| `tenant_api_keys` | Server persistence stores tenant/application IDs, key hash/prefix/status and metadata; secret is omitted from metadata storage. | Preserve security and credential model. Do not use key secrets or hashes as commercial party identifiers. |
| `tenant_licenses` | Migration 001 stores tenant and plan references; tenant and plan FKs exist. Licensing and gateway enforcement use tenant/license state. | Keep licensing as runtime entitlement projection until separate subscription/entitlement work; no Stage A license rewrite. |
| `licensing_plans` | Existing plan catalogue used by tenant licenses and licensing flows. | Distinct from commercial customer, legal entity, and billing account. No Stage A change. |
| `billing_products` | Migration 023 creates product catalogue and seeds/maintains the catalogue; fields include SKU, price, currency, billing unit, recurring and JSON payload. | Preserve product IDs/SKUs. The one production order line identifies `prod-ai-seat`; that does not identify the legal purchaser. |
| `billing_orders` | Migration 023 stores order ID/number, `tenant_id`, status, currency, totals, source/reference, and `payload_json`. `createBillingOrderRecord` inserts a header and lines transactionally. | Preserve order ID/number/status. Its `tenant_id` is an operational scope/link, not proof of legal or billing ownership. |
| `billing_order_lines` | Migration 023 stores order ID, tenant ID, product ID, quantity, price, currency, recurring/billing-unit/active fields, and payload. | Preserve line IDs/data. Existing line to product ID may be checkable; the supplied production evidence identifies product and line values but does not supply all FK/relationship query results. |
| `billing_invoices` | Existing invoice/AR table stores tenant and invoice data; invoice persistence is in `server.ts`. | Production count is zero. No invoice-party migration or invoice-history rewrite is part of Stage A. |
| IAM identity/roles | Migration 002 contains `iam_users`, `iam_roles`, `iam_user_roles`, permissions/sessions/MFA structures and relevant relationship FKs. | IAM identities and technical authorization remain independent of commercial party records. No actor email or credential data belongs in party mapping records. |
| Metadata and payloads | `tenants.metadata_json`, application/key metadata, and order/product `payload_json` carry JSON snapshots. `server.ts` reads/writes these. | JSON may contain display/customer-like fields but is not accepted as legal-party evidence without field-level review and owner approval. No wholesale payload migration is allowed. |
| In-memory customer concept | `server.ts` uses `Customer`/`customers` and customer APIs over tenant-backed records; tenant metadata can populate this view. | “Customer” in API/type/UI terminology is not a separate canonical commercial customer record today. |
| Existing organization concept | `OrgHierarchyView` presents an organization tree; discovery found no verified canonical commercial legal-entity/billing-account hierarchy in inspected migrations. | UI hierarchy is not evidence of a persisted legal hierarchy. Need inspect current production table/field inventory before mapping. |

Relevant implementation points include `ensureInternalTenant`/tenant metadata loading and order creation in `server.ts`; customer routes `/api/v1/customers*`; application routes `/api/v1/applications*`; API-key routes `/api/v1/api-keys*`; portal routes `/api/v1/tenant-portal/:id*`; billing order routes `/api/v1/billing/orders*`; invoice routes `/api/v1/billing/invoices*`; and licensing routes `/api/v1/licensing/*`. Migration files include `migrations/001_initial_schema.sql`, `migrations/002_iam_auth.sql`, and `migrations/023_commerce_orders_catalog.sql`. Route code is concentrated in `server.ts`.

### 2.2 Relevant UI views

| View | Current responsibility verified in source | Stage A role |
|---|---|---|
| `CustomersView` | Customer directory/onboarding using tenant-backed customer APIs. | Keep as entry point; future commercial customer selection must not reassign tenant scope implicitly. |
| `OrgHierarchyView` | Displays an organization hierarchy. | Treat as presentation until persisted commercial authority and hierarchy semantics are verified. |
| `Tenant360View` | Tenant/customer operational details; some commercial-looking values can be JSON/static presentation. | Link party/account context only when backed by canonical records; do not infer a legal party. |
| `FinanceCommerceView` | Product/order UI; creates/cancels orders through billing APIs. | Continue using existing order IDs; a future account link is additive. |
| `BillingAdminView` | Invoice and ledger workflows. | Stage A does not change invoice workflows; later account context must preserve tenant authorization and invoice identity. |
| `TenantPortalView` | Tenant-scoped profile, invoices, payment methods, schedules, payments/refunds and currency preference. | Remain tenant-scoped. Commercial account access may be introduced only with explicit account-to-tenant authorization rules. |

### 2.3 Production facts versus assumptions

**Production facts supplied:** one production tenant with ID `tenant-altil-internal`; one application; one API key; one active order totaling ZAR 85 with one recurring `user_month` line for `prod-ai-seat` at ZAR 85; ten products. The request did not supply private or personal actor information, which is intentionally omitted.

**Not established by those counts:** that the tenant is a standalone ALTIL customer; that its name is a legal name; that it is a single organisation; that it is the contracting legal entity; that it is the invoice recipient; that the order is legally accepted; that an account exists; or that the application/key/order have verified foreign-key and commercial ownership relationships. Counts alone do not prove these links.

## 3. Tenant separation rule

The model MUST preserve:

**tenant ≠ customer ≠ organisation ≠ legal entity ≠ billing account**

- A tenant is the technical security/isolation scope used by applications, API consumers, usage and existing billing ownership fields.
- A customer is the commercial counterparty identity.
- An organisation is a corporate/group structure; it may contain multiple entities and may map to multiple technical tenants.
- A legal entity is the registered contracting/invoicing party.
- A billing account is the bill-to/terms/collection unit and references the accountable legal entity.

Do not assume one tenant equals one customer, tenant name equals legal entity, tenant metadata equals contractual identity, tenant ID equals billing account, or order `tenant_id` proves legal/commercial ownership. A one-to-one mapping is acceptable only when explicit evidence establishes it and an authorized owner approves the mapping. The mapping must support one commercial party to multiple tenants and one customer/organisation spanning more than one legal entity/account where business evidence requires it; cardinality is not to be inferred from this snapshot.

## 4. Target Stage-A logical model

The minimum candidate model contains separate Customer, Organisation, Legal Entity, Billing Account, and explicit Customer/Organisation/Technical-Tenant mapping concepts. Physical structures and cardinalities require schema inventory and approval immediately before implementation. Stage A should not add cost centres, contracts, quotes, subscriptions, entitlements, charges, or tax structures.

| Structure | Persistence choice and why | Ownership/lifecycle/identity | Relationships, audit, idempotency and conceptual constraints |
|---|---|---|---|
| Customer | New first-class record if no equivalent production entity is verified. Existing `tenants` cannot safely represent it because technical isolation and commercial counterparty are different roles. | Commercial master-data owner. Draft/active/suspended/closed; stable opaque customer ID. Name/contact fields mutable with history; registered identity is not asserted here. | Links to one or more organisations/accounts and explicit tenant mappings. Audit actor/reason/source for create/change/merge. Idempotent by approved source-system reference, not display name. Conceptual unique scoped external reference; avoid unique legal-name assumptions. |
| Organisation | New first-class record only if production requires corporate hierarchy not represented by a verified existing table. `OrgHierarchyView` alone is not a persistence authority; a tenant is not an organisation. | Customer/organisation data owner. Active/inactive; effective-dated parent relationship; stable ID. | Parent-child relation and customer membership; may bind to legal entities and multiple technical tenants. Audit hierarchy changes. Idempotency by source ID within authority. Prevent cycles and duplicate effective parent assignments conceptually. If no evidenced hierarchy is needed, defer and do not create an empty abstraction. |
| Legal Entity | New first-class record if no existing production table/record is verified. A tenant name or metadata cannot safely be a legal entity because registration, jurisdiction and issuer history have separate semantics. | Legal/finance owner. Pending/active/inactive; registration has effective dates; stable ID. | Belongs to customer/organisation; referenced by billing account and eventually contract/invoice. Restrict registration fields and audit read/write access. Idempotent by jurisdiction + authoritative registration reference, with protected values. Enforce scoped uniqueness only after legal review. |
| Billing Account | New first-class record if not represented by an existing verified account system. Tenant and order are not safe substitutes: account controls bill-to, currency, terms, and collection configuration. | Finance/billing owner. Draft/open/credit-hold/closed; stable ID; effective-dated settings. | Belongs to customer and references legal entity; may map to one or more tenant scopes under approved policy; future invoices/orders reference it additively. Audit terms and account mapping changes. Idempotent by approved external account reference. Enforce valid legal-entity/customer ownership and scoped uniqueness conceptually. |
| Party/tenant mapping | New first-class relationship if no verified existing mapping is found; do not overload tenant metadata. | Joint commercial data owner and platform tenant/security owner. Pending/active/ended; effective dates and source/evidence. Stable mapping ID. | Connects technical tenant to customer and, where validated, organisation and billing account. Append history; do not overwrite prior attribution. Idempotent by source reference + target + effective interval. Prevent duplicate active mappings within the approved mapping policy. Every change audited and authorized. |

**First-class persistence test:** create only structures whose identity, lifecycle, cardinality, access control, or historical attribution cannot be safely represented by a verified existing authoritative structure. If production inventory reveals an existing equivalent, map/reuse it rather than duplicate it. If evidence does not establish a required organisation/legal/account concept, keep the relationship unresolved and request owner evidence; do not create a presumed record from a tenant name.

## 5. Production mapping classification

Classifications describe evidence availability, not product capability: **deterministic** = source and target identifiers/relationship were explicitly verified; **ambiguous** = observed record exists but commercial interpretation is not uniquely supported; **absent** = evidence establishes no record/relationship in the captured snapshot; **inaccessible** = relevant evidence could not be accessed; **unqueried** = no relationship query/result was supplied. “Absent” applies only to the captured snapshot and is not a historical-use or deployment conclusion.

| Required mapping or fact | Classification from evidence available | Basis / safe conclusion |
|---|---|---|
| Production technical tenant identity | Deterministic | One tenant, ID `tenant-altil-internal`, was supplied. |
| Tenant → commercial customer | Ambiguous | Current source calls tenant-backed objects customers, but no independent commercial customer identifier/owner evidence was supplied. Do not declare one-to-one. |
| Customer → organisation | Unqueried | No production party/hierarchy relationship output supplied. |
| Organisation → legal entity | Unqueried | No production hierarchy/registration mapping supplied. |
| Legal entity → billing account | Unqueried | No production account/issuer mapping supplied. |
| Billing account → technical tenant(s) | Unqueried | No explicit account-to-tenant relationship result supplied. |
| Tenant → application | Unqueried | Counts are one/one, but the actual production FK/link query result was not supplied for Stage A evidence. Do not infer from counts. |
| Tenant/application → API key | Unqueried | Counts are one/one/one, but key ownership/application relationship result was not supplied. Never expose key material. |
| Tenant → order | Deterministic only as recorded order scope | Supplied order facts identify `tenant-altil-internal`; this establishes the order's technical tenant attribution, not legal purchaser/account. |
| Order line → product | Deterministic as reported product reference | Supplied line identifies `prod-ai-seat` and catalogue has ten products. Preserve the source reference; validate FK/constraint behavior before implementation. |
| Order → accepted quote/contract/legal entity/account | Absent from supplied mapping evidence | No such production relationship facts were supplied. This is not proof that an external contract/document never existed. |
| Invoice/payment/refund/reconciliation/journal party mapping | Absent in captured table counts | Relevant captured downstream financial tables have zero rows. There are no persisted rows in this snapshot to map; this does not establish feature history, deployment or intent. |
| Customer/organisation/account source in production metadata JSON | Unqueried | No field-level metadata inventory/results supplied. Do not treat metadata as verified identity. |
| Existing FKs/indexes relevant to Stage A in production | Unqueried | Full production FK/index report was not supplied in this plan's evidence. Inspect before implementation. |

For `tenant-altil-internal`, known facts are limited to its production tenant identity and the supplied one-application/one-key counts, plus the attributed order and line details above. Its legal name, registration, organisation, customer authority, bill-to account, contract/acceptance, tax identity, user/actor relationships and account-to-tenant cardinality remain unverified unless separate approved evidence is provided. Do not reproduce private actor email, credentials, keys or unnecessary PII.

## 6. Future additive migration/backfill strategy

No SQL, migration file, or backfill is created by this plan. If Stage A is separately authorized after pre-implementation evidence and review:

1. Confirm the actual production schema/table inventory, migration checksums, columns, indexes, FKs, triggers and relevant views using approved read-only collection. Do not rerun migration tooling or seed migrations for inspection. Migration 020 and 023 have seed/maintenance behavior and must not be rerun against production merely to inspect them.
2. Define canonical IDs for new party/account records and a reversible source-ID map. Existing tenant, application, API key, license, product, order, order-line, invoice, payment and journal IDs remain untouched.
3. Add only approved party/account/mapping structures and nullable/additive references. Legacy `tenant_id` and current authorization predicates remain in force. No renaming, destructive conversion, or rewrite of historic JSON is in scope.
4. Preserve existing deterministic technical relationships exactly as they exist; preservation is not a commercial backfill. Existing tenant, application, API-key, license, product, order and order-line identifiers and their currently recorded technical references remain unchanged. Do not create a Customer, Organisation, Legal Entity, Billing Account, or commercial mapping merely because a technical tenant/order/product relationship is known. Any future commercial backfill must require separate deterministic evidence identifying the commercial party/account and explicit owner approval.
5. Do not synthesize invoice/account links, contract/acceptance, or legal identity. Current production invoice/payment/etc. tables are zero-row in the supplied snapshot, so no historical finance records in those tables can be backfilled from that snapshot; recheck immediately before implementation.
6. Ambiguous mappings stay null/unresolved with an explicit status and evidence reference. Keep resolution workflow outside financial writes. Do not put personal data/secrets into the mapping audit.
7. Establish counts before/after, mapping coverage, uniqueness/FK validation and tenant-scoped authorization comparisons. Financial totals by currency must remain unchanged. Existing IDs and payload values are compared, not regenerated.
8. Rollback before any dependent writes may disable new reads and remove/ignore newly introduced mappings through an approved reversible path; do not delete authoritative old rows. After new references are used, prefer forward correction and retain mapping history. Rollback cannot erase audit or external side effects.

The exact additive relationship fields, uniqueness policy and mapping cardinality must be approved after the production FK/index and metadata inventory. This plan does not name SQL columns or prescribe concrete migrations.

## 7. API compatibility and security implications

No route is removed or renamed. Any future party/account integration is additive, behind existing routes, and must preserve current response fields and scope checks.

| Existing API family | Current behavior | Future compatibility facade / additive relationship | Authorization and consumer risk |
|---|---|---|---|
| `/api/v1/customers`, `/customers/:id` and customer subroutes | Tenant-backed customer listing/detail/create/update; tenant access and role checks vary by action. | Continue returning existing tenant/customer fields. Add canonical commercial IDs only when mapping is verified; avoid changing meaning of `id`. | Never let a client-provided customer/account ID grant tenant access. Risk: consumers assume customer ID is tenant ID. Document and preserve legacy fields. |
| `/api/v1/applications*` | Lists and manages tenant applications. | Keep application IDs and `tenant_id`; optionally expose verified party mapping read-only. | Tenant and role checks remain authoritative. Risk: cross-tenant application exposure if party membership is treated as security scope. |
| `/api/v1/api-keys*` | Lists/issues/revokes keys with tenant/application ownership. | Keep key lifecycle and IDs; expose only non-secret commercial attribution IDs when authorized. | Never expose secret/hash or weaken tenant scope. Risk: key movement between tenants due to account mapping. |
| `/api/v1/tenant-portal/:id*` | Tenant-scoped profile, billing, keys and portal actions; `requireTenantAccess` guards scope. | Keep route and tenant meaning. Account summaries may be additive only after account-to-tenant membership is explicit and authorization-tested. | Portal must not expand visibility to every tenant under a customer by default. Risk: accidental sibling-tenant data disclosure. |
| `/api/v1/billing/orders*` | Lists/creates/cancels order records with `tenant_id`, order lines and product references. | Preserve request/response and IDs; resolve additive customer/account mapping server-side only when established. Never interpret old `tenant_id` as legal owner. | Existing billing role and tenant restrictions remain. Risk: client-supplied party ID overrides tenant boundary. |
| `/api/v1/billing/invoices*` | Reads/creates/issues invoices by existing tenant-centric payload and IDs. | Stage A does not redesign invoices. Future account links are optional additive data; legacy invoice fields remain. | Preserve invoice scoping and financial IDs. Risk: bill-to reassignment of draft/issued invoices. Do not silently change existing invoice ownership. |
| `/api/v1/licensing/*` | Plans/licenses and runtime entitlement enforcement remain tenant/application scoped. | No Stage A lifecycle conversion; verified party/account context may be exposed without changing license owner. | Runtime authorization remains unchanged. Risk: disabling legacy license path prematurely. |

Audit commercial mapping create/update/end operations with actor/service ID, tenant scope, before/after mapping IDs, reason, evidence reference, effective dates, correlation ID and outcome. Authorization must validate both administrative permission and permitted tenant/customer relationship. IAM identity is an actor/security principal, not a customer record.

## 8. UI impact (planning only)

| Existing view | Stage A responsibility | Guardrail |
|---|---|---|
| `CustomersView` | Continue tenant-backed directory/onboarding; future entry to verified customer records. | Never auto-create legal entities/accounts from display names. |
| `OrgHierarchyView` | Show verified organisation hierarchy only; distinguish unknown/unmapped relationships. | Existing visualization is not source evidence or a legal structure editor until API-backed. |
| `Tenant360View` | Show tenant and, where mapped, linked customer/org/account context. | Clearly label unmapped/ambiguous; no inferred commercial authority. |
| `FinanceCommerceView` | Preserve product/order functions; later show verified account reference on orders. | No order conversion or automatic ownership reassignment. |
| `BillingAdminView` | No Stage A invoice behavior change; preserve existing invoice/ledger work. | No invoice/account reassignment by UI. |
| `TenantPortalView` | Preserve strictly tenant-scoped customer portal. | No cross-tenant account visibility unless explicitly authorized and tested. |

No UI code or navigation changes are part of Stage A plan creation.

## 9. Security and Trust Fabric impact

Commercial mapping adds business context; it must not replace authentication, IAM roles, tenant isolation, application ownership, API consumer identity, or policy evaluation.

- **Tenant isolation:** every existing tenant-scoped route/query continues to enforce tenant scope. Commercial customer/account membership does not imply access to all related tenants.
- **IAM:** users/roles authorize actors. Commercial customer/org/legal/account entities do not authenticate principals. Role grants remain separately governed and audited.
- **Applications/API consumers:** retain technical tenant/application/key relationship; add explicit commercial association only from verified mapping. Credentials remain secret material outside commercial records.
- **Entitlements/policy:** Stage A creates no entitlement and makes no policy decision. Future entitlement must derive from accepted commercial authority; party mapping alone cannot grant runtime access.
- **Audit:** mapping changes are attributable, time-bounded, reasoned and reversible by further events. Protect legal registration and personal data with least privilege.
- **Commercial authority:** only approved data owners can establish or change mappings; an order's tenant ID, metadata or product name is not proof of legal authority.
- **Trust chain:** future flow is commercial party → accepted authority → entitlement → identity/tenant-scoped policy. Stage A only creates the party/account identity and mapping foundation; runtime authorization is unchanged.

## 10. Read-only pre-implementation verification gate

Immediately before any separately authorized implementation, collect an operator-approved read-only baseline from the actual production target. Do not run these checks from this planning task or use production write credentials. The evidence workflow must report unavailable/inaccessible/unqueried separately from empty.

Required categories:

1. **Environment/schema:** confirm database identity/version, application release, migrations 001–023/checksums, actual table inventory, columns, nullability, defaults, unique indexes, ordinary indexes, FKs, triggers/views. Do not execute migration tooling; migration 020/023 seed behavior makes rerunning especially unsafe.
2. **Metadata/payload usage:** enumerate JSON key names/types and approved aggregate presence only; no wholesale payload export, secrets, personal details or actor emails. Identify any customer/org/legal/account candidate fields and their provenance.
3. **Party and technical relationships:** tenant→application→API-key counts and orphan checks; license→tenant/plan; order→tenant; order line→order/tenant/product. Distinguish FK enforcement from application-level IDs.
4. **Commercial party inventory:** search discovered schema for existing customer, organisation, legal entity, billing account, external CRM/account IDs and mapping tables. Collect row counts and relationship coverage, not unnecessary row content.
5. **Finance lineage:** invoice→tenant/order if present, invoice line/payload sources, payment→invoice, refund→invoice/payment, reconciliation item→batch/payment, journal line→journal, journal source references. Current counts are zero for several relations, but recheck the snapshot; do not assume they remain zero.
6. **Duplicate/orphan checks:** duplicate stable IDs/external refs, unresolved tenant/application/key/order/product references, overlapping mappings, ambiguous name matches. Hash IDs in shared artifacts where required.
7. **Audit behavior:** schema and aggregate evidence for audit table coverage, actor/source/correlation fields, retention and mapping change traceability. Do not disclose private actor emails.
8. **Consumer inventory:** identify API clients/routes/screens/jobs depending on tenant/customer IDs and metadata shape through source/config inspection; production telemetry is not proof of every consumer.
9. **Pre-change reconciliation:** capture counts, statuses and currency-separated amounts needed to prove no financial change; confirm no invoice/order/payment/journal IDs are altered by the proposed mapping operation.
10. **Security review:** verify read-only account/session discipline, PII minimization and tenant-scope authorization tests are planned before writes.

No production relationship/FK result not actually queried should be treated as verified by this plan.

## 11. Future implementation sequence

All steps below require a separate explicit implementation authorization. Each is additive; stop if preflight evidence contradicts the model.

| Step | Future activity | Dependencies | Principal risk | Rollback / forward-recovery boundary |
|---|---|---|---|---|
| A1 — Schema/additive structures | Add only approved party/account/mapping persistence and indexes/constraints. | Preflight schema/FK inventory; data owner and security approval. | Collision with existing equivalent structures or cardinality assumptions. | Before dependent writes, disable new structures/read path. After writes, preserve records and forward-correct; never alter tenant/financial IDs. |
| A2 — Compatibility mappings | Add server-side translation/read models while existing tenant APIs remain authoritative for access. | A1; field and consumer inventory. | Confusing tenant IDs with commercial IDs; leaking cross-tenant records. | Disable mapping resolution while keeping legacy IDs; audit every mapping change. |
| A3 — Deterministic backfill | Populate only owner-approved unambiguous links; mark others unresolved. | A1/A2; signed mapping rules and baseline snapshots. | Guessed identity or false one-to-one mapping. | Stop/rollback only newly added links where safe; preserve unresolved state and audit. No existing rows rewritten. |
| A4 — API read integration | Add optional verified party/account context to existing responses. | A3 plus authorization review. | Breaking clients or expanding visibility. | Feature flag/response omission restores legacy shape; existing route remains. |
| A5 — API write integration | Allow authorized, audited mapping changes through compatible server paths. | A4; validation, idempotency and owner workflow. | Unauthorized reassignment or duplicate mapping. | Disable writes, retain mapping history, correct forward; do not reverse technical ownership implicitly. |
| A6 — Audit/security verification | Verify actor attribution, tenant scope, privacy, IAM roles, and mapping history. | A5 in non-production first. | Audit gaps or privacy exposure. | Halt rollout; revoke access/configure corrections without deleting evidence. |
| A7 — UI integration | Present verified party/account links in existing views only. | A4/A6; product decision and UX/security review. | Ambiguous data shown as fact; portal scope expansion. | Hide new display behind flag; no navigation/API removal. |
| A8 — Production verification | Read-only post-change counts, mappings, orphan/duplicate checks, access and financial invariants. | Approved deployment/change record. | Undetected unintended ownership or financial effect. | Stop subsequent stages; execute approved forward repair/rollback plan, no ad hoc data repair. |
| A9 — Acceptance gate | Obtain data-owner, finance, security and product acceptance against objective criteria. | A1–A8 evidence complete. | Premature Stage B dependency. | Stage A remains unaccepted; existing behavior remains authoritative. |

## 12. Acceptance criteria

Stage A may be accepted only when all applicable criteria have evidence:

- No existing tenant, application, API-key, license, product, order, order-line, invoice, payment, refund, reconciliation, or journal ID changed.
- Production migration baseline is reconciled; no migration was rerun for inspection.
- No guessed Customer/Organisation/Legal Entity/Billing Account/tenant mappings exist.
- Every deterministic mapping has a reproducible source and owner approval; ambiguous, absent, inaccessible, and unqueried relationships remain explicitly classified.
- Existing customer/order/invoice/licensing APIs remain functional and preserve documented payload fields and route names.
- Technical tenant isolation and existing runtime authorization are unchanged; tests show no cross-tenant access through commercial account membership.
- Mapping write operations (if separately authorized) are role-gated, idempotent, effective-dated and audited with actor, reason, source and correlation.
- Sensitive registration details and private actor data are access-restricted; no credentials/secrets enter party records or reports.
- No invoice/order/payment/journal or other financial values changed because of party mapping.
- Read-only production reconciliation verifies table counts, known relationship integrity and zero unintended financial changes; unqueried relationships are not marked passed.
- Finance, security, technical tenant owner and commercial data owner approve unresolved exceptions and cutover boundary.

## 13. Explicit non-goals

Stage A does NOT implement quotes, contracts, subscriptions, entitlements, provisioning, rating, charges, invoice redesign, payment allocation, credit notes, ERP integration, UI consolidation, or legacy retirement. It does not change provider integrations, IAM authentication, runtime policy, tenant isolation, or production financial records.

## 14. Authorization boundary

This Stage A plan is documentation and implementation-readiness analysis only. It does not authorize schema changes, migrations, data changes, application changes, API changes, UI changes, or production changes. Implementation requires a separate explicit authorization after review and acceptance of this plan.
