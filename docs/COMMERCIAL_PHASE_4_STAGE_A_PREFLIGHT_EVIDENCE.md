# ALTIL Stage A Pre-Implementation Evidence — Read Only

**Purpose:** Evidence report for Stage A party/account foundation readiness.
**Result type:** Evidence only; not an implementation plan or authorization.
**Evidence sources:** Externally collected Phase 3B production snapshot already supplied in this conversation; read-only inspection of repository migration/source definitions and the Stage A plan.
**Critical limitation:** This Codex workspace was not connected to production. No new production SQL, `information_schema` query, or live relationship check was run. Production details not in the supplied snapshot are classified UNQUERIED, not zero.

## 1. Production environment

| Check | Evidence | Classification |
|---|---|---|
| Database | `altil_db` | VERIFIED from supplied Phase 3B evidence |
| Engine/version | `MariaDB 10.11.18-MariaDB-0+deb12u1` | VERIFIED from supplied Phase 3B evidence |
| Applied migrations | 23, versions 001–023 | VERIFIED from supplied Phase 3B evidence |
| Production table count | 61 | VERIFIED from supplied Phase 3B evidence |
| Application release/commit serving production | No release/commit supplied | UNQUERIED |
| Server read-only setting | `@@read_only = 0` | VERIFIED from supplied Phase 3B evidence; production DB server itself was writable |

This report did not connect the workspace to production. Evidence collection here relies only on the already supplied production snapshot and local source/migration text. No credentials or secrets were accessed or recorded.

## 2. Supplied production snapshot relevant to Stage A

Production counts and commercial order facts below were collected externally during Phase 3B. The zeroes describe persisted row counts at that capture time only.

| Object | Captured rows |
|---|---:|
| tenants | 1 |
| tenant_applications | 1 |
| tenant_api_keys | 1 |
| tenant_licenses | Not supplied in the snapshot available here |
| licensing_plans | Not supplied in the snapshot available here |
| billing_products | 10 |
| billing_orders | 1 |
| billing_order_lines | 1 |
| billing_invoices | 0 |
| billing_payment_intents | 0 |
| billing_payment_methods | 0 |
| billing_schedules | 0 |
| billing_refunds | 0 |
| billing_reconciliation_batches / items | 0 / 0 |
| accounting_journals / lines | 0 / 0 |

Known order snapshot: tenant `tenant-altil-internal`; active; ZAR; total 85. One line is product `prod-ai-seat`, quantity 1, unit price ZAR 85, billing unit `user_month`, recurring=true, active=true. These facts establish recorded technical attribution and line/product values only. They do not establish a customer, organisation, legal entity, billing account, contract, acceptance, or legally responsible payer.

A zero count means no persisted rows of that type were present in the captured database at evidence-collection time. It does not prove a feature broken, historically unused, undeployed, unnecessary, or intentionally unused. Workspace/test/simulator records are excluded from production evidence.

## 3. Schema relationships — local source/migration evidence only

The requested production `information_schema` inspection was not performed. The following are facts in checked-in migration definitions, not confirmation of the live production schema. Applied production migrations are reported as 001–023, but the production FK/index/nullability metadata was not independently re-queried.

| Relationship/table | Source migration definition observed | Production status |
|---|---|---|
| `tenant_applications.tenant_id` → `tenants.id` | FK `fk_app_tenant`; application tenant ID is non-null in migration 001. Index on tenant. | UNQUERIED live FK and orphan result |
| `tenant_licenses.tenant_id` → `tenants.id`; `plan_id` → `licensing_plans.id` | FKs `fk_license_tenant`, `fk_license_plan`; both columns non-null in migration 001; indexes on both. | UNQUERIED live FK and orphan result |
| `tenant_api_keys` tenant/application | Migration 012 defines both IDs non-null; indexes on tenant/status and application/status; `key_hash` unique. No FK declared in that migration. | UNQUERIED live FK/index state; no key values or hashes inspected |
| `billing_orders` tenant | Migration 023 defines tenant_id non-null; indexes on tenant/status/created and created time; order number unique. No FK declared there. | UNQUERIED live FK/index state |
| `billing_order_lines` order/tenant/product | Migration 023 defines all three IDs non-null; indexes on order and cycle lookup. No FK declared there. | UNQUERIED live FK/index state |
| `billing_invoices` tenant | Migration 015 defines tenant_id non-null; invoice number unique; tenant/created and status/due indexes. | UNQUERIED live FK/index state |
| `billing_payment_intents` invoice | Migration 019 defines nullable invoice_id, non-null tenant_id/external_reference; external_reference unique; tenant/status and provider/reference indexes. No FK declared there. | UNQUERIED live FK/index state |
| `billing_payment_methods` / `billing_schedules` | Tenant ID non-null; schedule invoice_id and payment_method_id nullable; tenant/status indexes. No FK declared in migration 019. | UNQUERIED live FK/index state |
| `billing_refunds` | Tenant, invoice and payment_intent IDs non-null; tenant/status/time and payment/status indexes; no FK declared in migration 019. | UNQUERIED live FK/index state |
| Reconciliation batches/items | Item batch_id non-null with FK to batch; item payment_intent_id nullable; indexes on batch/status and external reference. | UNQUERIED live FK/index state |
| Accounting journals/lines | Unique journal source_type/source_id; lines have non-null journal_id FK to journal. | UNQUERIED live FK/index state |
| `audit_logs` | Migration 001 defines tenant_id nullable; indexes on tenant, severity, timestamp; no commercial mapping-specific columns declared. | UNQUERIED live schema/index state |

Production indexes, additional migration effects, nullable columns, unique constraints, and FK behavior remain UNQUERIED. The source definitions above must not be treated as an `information_schema` report.

## 4. Actual technical relationship verification

No production aggregate relationship query results were supplied for these checks. Counts of one on each side do not prove a link. Local migration definitions establish some intended FKs, but not actual production row relationships or orphan counts.

| Relationship | Matched count | Orphan count | Duplicate/ambiguous count | Classification |
|---|---:|---:|---:|---|
| tenant → application | Unknown | Unknown | Unknown | UNQUERIED |
| application → API key | Unknown | Unknown | Unknown | UNQUERIED |
| tenant → API key | Unknown | Unknown | Unknown | UNQUERIED |
| tenant → license → licensing plan | Unknown | Unknown | Unknown | UNQUERIED |
| order → tenant | One order attributed to `tenant-altil-internal`; match query result unavailable | Unknown | Unknown | AMBIGUOUS as commercial ownership; technical join UNQUERIED |
| order line → order | One line reported for one order; join query result unavailable | Unknown | Unknown | UNQUERIED |
| order line → tenant | One line reported with order context; join query result unavailable | Unknown | Unknown | UNQUERIED |
| order line → product | `prod-ai-seat` supplied as line product | Unknown | Unknown | VERIFIED as reported identifier only; live FK/join check UNQUERIED |

“Verified as reported identifier” is not a claim of database FK enforcement. Relationship results not actually queried remain unverified.

## 5. Commercial-party discovery

The Stage A plan notes that inspected source uses a tenant-backed `Customer` type/API and that `OrgHierarchyView` is a UI concept. The production table/column search and data-level candidate counts requested by the preflight were not supplied and were not run against production.

| Candidate/source | Local source/schema observation | Production finding / authority |
|---|---|---|
| `tenants.id`, `name`, `metadata_json` | Tenant is the runtime/security scope. Server code can hydrate a `Customer`-shaped object from tenant metadata. | One tenant known; legal/customer semantics and metadata contents UNQUERIED. Name is not legal identity. |
| `tenant_applications.metadata_json` | Source stores application JSON metadata. | Key presence/counts UNQUERIED; not legal/account authority. |
| `tenant_api_keys.metadata_json` | Source stores non-secret key metadata; key hash is relational and sensitive. | Key names/counts UNQUERIED. No key/hash/secret exposed. Not party authority. |
| `billing_orders.tenant_id`, `tenant_name`, `payload_json` | Order source stores technical tenant reference/name and payload. | One order's tenant attribution supplied. No legal party/account evidence; payload keys/counts UNQUERIED. |
| `billing_order_lines.payload_json` | Stores line snapshot alongside typed product/tenant/order values. | Production key presence UNQUERIED; line is not a legal agreement. |
| `billing_products.payload_json` | Product description/attributes and seeded catalogue data. | Ten products reported. Catalogue values describe offerings, not customer identity. |
| `CustomerBillingConfig` type and tenant JSON fields | Source type includes billing cadence, payment method, currency/display preference, balances, optional tax ID and billing email. These are application fields, not verified legal-account schema. | Production field presence and values UNQUERIED; no PII reproduced. A name/email/tax-like field is not enough to establish legal identity. |
| `OrgHierarchyView` | Existing UI tree. | Persistence source and production relationships UNQUERIED; UI display is not authoritative commercial hierarchy. |
| Customer/org/legal/account/mapping table or columns | No first-class equivalents were identified in the inspected migrations/source described by the architecture documents. | Full production table/column inventory search not supplied; do not state production absence. |

Potential terms such as customer, company, account number, CRM ID, registration number, bill-to, or tenant/customer mapping need a production schema/metadata inventory and data-owner evidence. No personal data is reported here.

## 6. JSON metadata inspection

No production JSON payloads were selected or inspected in this task. Per-key production counts and field-presence aggregates are therefore UNQUERIED. Local source indicates which structures contain JSON and that the tenant object can include billing/customer-like fields; this cannot establish which keys exist in production or whether they are authoritative.

| JSON field | Production key presence/count | Apparent source/meaning from local source | Authority |
|---|---|---|---|
| `tenants.metadata_json` | UNQUERIED | Can hydrate tenant-backed `Customer` presentation including billing config. | Technical/customer UI metadata only; not proof of legal identity or contractual authority. |
| `tenant_applications.metadata_json` | UNQUERIED | Application object metadata. | Technical app metadata. |
| `tenant_api_keys.metadata_json` | UNQUERIED | API-key metadata excluding plaintext key in persistence helper. | Credential metadata; not party authority. No values inspected. |
| `billing_orders.payload_json` | UNQUERIED | Order object and embedded line snapshots. | Order record evidence, but tenant field alone is not commercial ownership evidence. |
| `billing_order_lines.payload_json` | UNQUERIED | Line snapshot including product, quantity, price and billing attributes. | Commercial line snapshot, not contract/customer legal evidence. |
| `billing_products.payload_json` | UNQUERIED | Catalogue metadata. | Product catalogue, not party identity. |

## 7. Orphan and duplicate checks

The production orphan/duplicate aggregate queries were not supplied or run. They remain UNQUERIED even where source migrations declare intended FKs or unique keys.

| Check | Result | Classification |
|---|---|---|
| Orphan applications | Unknown | UNQUERIED |
| Orphan API keys (tenant/application) | Unknown | UNQUERIED |
| Orphan licenses (tenant/plan) | Unknown | UNQUERIED |
| Orphan order tenant references | Unknown | UNQUERIED |
| Orphan order-line order references | Unknown | UNQUERIED |
| Orphan order-line product references | Unknown | UNQUERIED |
| Tenant/order duplication or ambiguous owner anomalies | Unknown | UNQUERIED |
| Duplicate source/external references | Unknown | UNQUERIED; source defines order_number unique; source_reference is not declared unique in migration 023 |

A zero result from a future query would mean zero detected in that captured snapshot only.

## 8. Audit capability

Local migration 001 defines `audit_logs` with: primary key `id`; timestamp; nullable tenant_id; nullable user_email; required action_type/category; severity; IP address; request_payload JSON; raw_response_payload JSON; created_at; indexes on tenant, severity and timestamp. This is source-schema evidence only, not a live production schema query.

| Required mapping audit field | Current source capability |
|---|---|
| Actor/service identity | `user_email` can store a human email; source audit objects also carry actor-like values. A stable service-principal identity is not explicit in the shown table columns. |
| Tenant scope | Nullable `tenant_id` exists. |
| Before/after values | JSON request/response fields could carry data, but explicit before/after columns/contract were not established. |
| Reason | Could be embedded in JSON/details; no dedicated reason column shown. |
| Correlation/request ID | No dedicated column shown in migration 001. Source request logs may carry request IDs elsewhere; Stage A audit correlation support is not established. |
| Timestamp | Timestamp and created_at exist. |
| Outcome | Severity/action may signal outcomes in some source events; no dedicated outcome column shown. |

Conclusion: current audit substrate is partial for the full commercial mapping requirement. It can associate tenant, actor-like value, action/category and time, but the inspected migration does not establish typed, consistent service identity, before/after, reason, correlation ID, or outcome fields. Existing source may encode some values in JSON; production audit coverage and retention are UNQUERIED. This is an evidence gap, not a fix authorization. No audit records were created or modified.

## 9. Production financial baseline

| Object | Captured count | Currency/total evidence available |
|---|---:|---|
| billing_orders | 1 | One active ZAR order, total ZAR 85 |
| billing_order_lines | 1 | One recurring ZAR 85 line for `prod-ai-seat`, quantity 1, `user_month` |
| billing_invoices | 0 | No persisted invoice rows at capture; currency totals not applicable to these rows |
| billing_payment_intents | 0 | No persisted intent rows at capture |
| billing_refunds | 0 | No persisted refund rows at capture |
| billing_reconciliation_batches | 0 | No persisted batch rows at capture |
| billing_reconciliation_items | 0 | No persisted item rows at capture |
| accounting_journals | 0 | No persisted journal rows at capture |
| accounting_journal_lines | 0 | No persisted journal-line rows at capture |

Only the aggregate counts and one order/line amount above are available. There is no production relationship test, invoice balance, payment total, settlement total, or journal balance result in the evidence supplied to this report. No individual financial records are reproduced beyond the supplied order identifiers and values necessary for Stage A context.

## 10. Evidence classification and safety

| Evidence class | Meaning in this report |
|---|---|
| VERIFIED | Explicit production fact supplied or source/migration fact verified in the local repository; scope is stated. |
| NOT PRESENT | A row/relationship is explicitly absent in the captured production snapshot, not historically absent or unused. |
| AMBIGUOUS | Records exist but the commercial meaning/owner is not uniquely established. |
| UNQUERIED | No result supplied and no query run. |
| INACCESSIBLE | Evidence was attempted but could not be accessed. No such production query was attempted in this task. |

No production session was opened, so no read-only transaction was started and no ROLLBACK was required. The workspace made no production connection. If a future authorized operator collection is performed, it must use the approved read-only account/session discipline, SELECT/SHOW/information_schema only, no migration runner or seed script, no PII/secrets, and ROLLBACK where a transaction is used. Because `@@read_only=0`, if read-only operational discipline cannot be assured, the operator must stop.

Distinctions retained:

- Schema capability is based here only on checked-in migration/source definitions; production `information_schema` state is unqueried.
- Persisted production relationships are verified only where explicit relationship output exists; counts alone do not prove links.
- Application behavior is source inspection, not proof of runtime execution.
- Historical usage is not established by zero current rows.
- Deployment status/release commit is unqueried.
- The workspace/test/simulator database and its records are excluded from production evidence.
- No credentials, API keys, hashes, private actor emails, or unnecessary PII are included.

## 11. Stage A preflight result

This classifies evidence readiness only; it does not decide whether implementation should proceed.

| Prerequisite | Result | Basis |
|---|---|---|
| Production database identity, engine/version, migration range and table count | PASS | Supplied Phase 3B facts: `altil_db`, MariaDB 10.11.18-MariaDB-0+deb12u1, 001–023, 61 tables. |
| Production serving application release/commit | UNKNOWN | Not supplied. |
| Production schema/FK/index/nullability snapshot | BLOCKED | No live production query allowed/performed in this workspace; source migration definitions are not a substitute. |
| Actual tenant/application/key/license/order/line/product relationship counts and orphan/duplicate checks | BLOCKED | Relationship query results were not supplied; counts do not prove links. |
| Commercial-party structure and metadata key presence | BLOCKED | Production inventory and aggregate JSON-key results were not supplied. |
| Mapping for `tenant-altil-internal` to commercial customer/org/legal entity/account | UNKNOWN | Technical tenant and order attribution known; commercial party/account evidence unqueried. |
| Audit production schema/behavior and required-field sufficiency | UNKNOWN | Local schema indicates partial capability; production schema/runtime coverage unqueried. |
| Production financial row-count snapshot | PASS | Supplied counts include one order/line and zero captured invoice/payment/refund/reconciliation/journal rows. |
| Production financial relationship/balance integrity | UNKNOWN | No relationship or balance aggregate output supplied. |
| Evidence handling restrictions | PASS | No production connection, SQL, write, migration, seed, credential, or PII access occurred in this task. |

“BLOCKED” means the specific production evidence needed to resolve the Stage A preflight item is not available from the supplied snapshot and was not collected here. “UNKNOWN” means the available evidence cannot establish the result. Neither label is a recommendation or authorization decision.

This evidence collection does not authorize Stage A implementation. Any schema, migration, application, API, UI, data, or production change requires separate explicit authorization.
