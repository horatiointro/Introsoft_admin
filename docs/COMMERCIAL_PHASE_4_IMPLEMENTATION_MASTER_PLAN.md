# ALTIL Phase 4 — Implementation Master Plan

**Status:** Engineering execution blueprint; planning only.
**Architecture authority:** [Phase 4 Architecture Specification](./COMMERCIAL_PHASE_4_ARCHITECTURE_SPEC.md) and the Stage A–F plans listed below.
**Local implementation status:** Stages A–F implementation COMPLETE; local A–F integration review PASS (84 tests passed). This records local PC work only.
**Production implementation:** NOT STARTED; remains evidence-gated. **G10 GitHub release:** pending separate review and authorization. **G11 production deployment:** pending separate production authorization.

This plan converts the accepted architecture into a locally executable sequence. It describes likely extension points and evidence-dependent decisions; it is not a schema specification, migration, production runbook, or authorization to begin coding.

## 1. Source of authority and evidence boundary

The authoritative planning inputs are:

- [Architecture Specification](./COMMERCIAL_PHASE_4_ARCHITECTURE_SPEC.md)
- [Stage A Implementation Plan](./COMMERCIAL_PHASE_4_STAGE_A_IMPLEMENTATION_PLAN.md)
- [Stage A Preflight Evidence](./COMMERCIAL_PHASE_4_STAGE_A_PREFLIGHT_EVIDENCE.md)
- [Stage A External Evidence Intake](./COMMERCIAL_PHASE_4_STAGE_A_EXTERNAL_EVIDENCE_INTAKE.md)
- [Stage B Implementation Plan](./COMMERCIAL_PHASE_4_STAGE_B_IMPLEMENTATION_PLAN.md)
- [Stage C Implementation Plan](./COMMERCIAL_PHASE_4_STAGE_C_IMPLEMENTATION_PLAN.md)
- [Stage D Implementation Plan](./COMMERCIAL_PHASE_4_STAGE_D_IMPLEMENTATION_PLAN.md)
- [Stage E Implementation Plan](./COMMERCIAL_PHASE_4_STAGE_E_IMPLEMENTATION_PLAN.md)
- [Stage F Implementation Plan](./COMMERCIAL_PHASE_4_STAGE_F_IMPLEMENTATION_PLAN.md)

Production facts in those records are limited to the externally supplied Phase 3B snapshot. The preflight report explicitly says this workspace did not connect to production: live schema metadata, production relationship/orphan/duplicate results, party/account discovery, production audit capability and serving release remain unqueried, blocked or unknown. The intake template is a collection checklist, not evidence that its blank items are zero or absent.

The actual production contractual path (existing agreement or quote-originated agreement), production party/account mappings, live constraints, and deployed code paths remain **UNKNOWN / REQUIRES EVIDENCE**. Local source and migration definitions can describe the inspected checkout and intended schema only; they do not prove production schema, deployment, runtime use, or production relationships. Do not infer commercial identity from a tenant, order, product, metadata key, count, or UI label.

Local code references below were inspected read-only in `server.ts`, `src/db/mariadb.ts`, `src/App.tsx`, the named component files, and migrations 001–023. Services named as future logical boundaries are proposed seams inside the current application unless a later architecture decision explicitly approves another deployment shape.

## 2. Existing implementation inventory

| Area | Reusable implementation / compatibility surface | Current limitation established locally | Planned extension; new component only if needed |
|---|---|---|---|
| Migrations and persistence | `migrations/001_initial_schema.sql` provides tenants, applications, licenses/plans, audit and webhook logs; 011 usage; 012 API keys; 015 invoices/ledger; 018 provider events; 019 payment, refund, schedule, reconciliation and accounting core; 020 currency/FX; 023 products/orders/order lines. `src/db/mariadb.ts` and existing repository helpers own persistence. | Checked-in migration definitions do not establish live production columns, constraints, or data. Migration 020 and 023 have seed/maintenance behavior and must never be rerun for inspection. | Add future migrations only after relevant evidence and stage authorization. Prefer extending proven structures; add a first-class entity only for an independently required identity, lifecycle, history, or relationship.
| Products and orders | `billing_products`, `billing_orders`, `billing_order_lines`; `createBillingOrderRecord` and `/api/v1/billing/products*`, `/api/v1/billing/orders*` in `server.ts`; `FinanceCommerceView`. | Existing order create is not legal acceptance; recurring line does not establish a subscription; production FKs/relationships are not fully verified. | Add accepted-version links and immutable version history additively after Stage B/C approval. Preserve current IDs, payloads, and route meanings.
| Invoices and ledger | `billing_invoices`, `billing_ledger_entries`; invoice persistence helpers and `/api/v1/billing/invoices*`, `/api/v1/billing/ledger*`; `BillingAdminView`. | Invoice lines are substantially payload-backed; direct receipt updates invoice balance and ledger; current history cannot be regenerated from current pricing. | Keep the invoice register and ledger. Add charge/source lineage and allocation-aware balances without replacing either or rewriting issued history.
| Payment intents and providers | `billing_payment_intents`, payment-method/schedule helpers, `capturePaymentIntent`, Stripe/PayFast/iKhokha callbacks and `/api/v1/billing/payments*`, `/payment-methods*`, `/schedules*`; provider references and tokenization. | `invoice_id` supports one direct invoice link; provider event persistence can follow side effects; callbacks differ by provider. No production event activity is established by the zero-row snapshot. | Preserve intent/provider IDs and callback contracts. Add a separate append-only allocation relationship and durable processing/idempotency state only after evidence and policy approval.
| Refunds and credits | `billing_refunds`, refund request/approval/confirmation and `finalizeRefund`; current journals and ledger effects. | Existing finalization can mutate original invoice totals/paid; a cash refund, credit note, invoice adjustment, and reversal are not distinct in all current paths. | Preserve refund history; future credit-note/adjustment/reversal records link to the existing invoice, refund, payment and journal source. Never relabel historic refunds as credit notes.
| Reconciliation and settlement | `billing_reconciliation_batches/items`; import, match, settle routes; `AccountingControlView`. | Current match/settlement path has partial-failure risks; live statement/provider population and production constraints are unknown. | Extend existing batch/item history; add settlement identity only if verified operational need requires it. Make per-item journal posting resumable and idempotent.
| Accounting | `accounting_journals/lines`, `postJournal`, journal/summary routes, `AccountingControlView`. Migration 019 includes source uniqueness and balanced posting behavior in source. | Some ledger adjustment paths are not automatically journaled; source uniqueness does not make multi-step external workflows atomic. Production journal rows were zero at snapshot, not proof of non-use historically. | Keep the existing double-entry subledger as the only accounting core. Extend source lineage and use linked reversals; never edit posted lines or add a parallel ledger.
| Licensing / subscriptions | `tenant_licenses`, `licensing_plans`, licensing routes and gateway enforcement; `LicensingMonetizationView`. | Licensing cycle (`/api/v1/billing/cycles/run`) is separate from `billing_schedules`; no inspected path creates subscriptions from order lines. Production license counts/relationships were not supplied. | Keep licenses as the compatibility projection until Stage C proves parity. Add canonical subscription/entitlement lifecycle only after Stage B and explicit scope mapping.
| Tenant, application, API key | Tenant-backed `Customer` shape/routes, tenant-scoped application and API-key repositories/routes; `requireTenantAccess` and IAM role checks. | Technical tenant is not a commercial identity; one-row counts do not prove tenant/application/key joins. | Keep existing IDs, credential lifecycle, tenant predicates and IAM. Add explicit approved commercial mapping; never use secrets/hashes as commercial keys.
| Usage and metering | `recordKeyUsage`, `tenant_key_usage`, API gateway metering and `/api/v1/usage*`; current quotas/budgets and FinOps reads. | Usage writes can fail while being logged; source is USD-oriented and not a complete versioned rating/charge ledger. Production usage was zero in the supplied snapshot only. | Preserve raw usage. Add source-linked event normalization only if needed, deterministic rating versions and one durable charge claim per source obligation.
| AI provider/model registry | Existing `ai_providers`/`ai_models`, routing and cost estimates; `FinOpsView`. | Registry estimate may differ from provider-reported/settled cost; production provider activity/configuration is not inferred from registry counts. | Retain registry/routing and capture cost source, currency and confidence separately from customer price/charge.
| IAM and audit | IAM tables/repositories, auth middleware, role authorization and `audit_logs`/request logging. | Stage A preflight finds local audit schema only partially expressive; live production schema, retention and runtime coverage remain unqueried. Commercial party membership cannot grant technical access. | Extend audit correlation/typed evidence only after review. Actor identity, signer authority, tenant scope, authorization policy and commercial party remain separate concepts.
| Finance and Customer 360 views | `FinanceCommerceView`, `BillingAdminView`, `FinOpsView`, `AccountingControlView`, `LicensingMonetizationView`, `CustomersView`, `Tenant360View`, `OrgHierarchyView`; composed in `src/App.tsx`. | Existing features are distributed across views/navigation, and some tenant/customer/org labels or fallback values are not commercial authority. | Consolidate into one Finance workspace and contextual Customer 360 using existing components as panels where possible. Avoid duplicate actions and new top-level menu entries.
| Customer Portal | `TenantPortalView`, `/api/v1/tenant-portal/:id*`, `requireTenantAccess`, display-currency and billing controls. | Portal is tenant-scoped; customer/account-wide cross-tenant access is not implied by a future commercial grouping. | Preserve the portal and tenant authorization. Add account context only with explicit server-side membership and tested scope; do not trust client selectors.

## 3. A–F implementation map

All domain boundaries below are logical boundaries within the current application. Potential physical changes are conditional; no exact production column, FK, table, route, or migration is selected here.

| Stage | Potential domain/persistence work | Backend/API/UI work | Audit, idempotency and migration approach | Dependencies and verification |
|---|---|---|---|---|
| **A — Party / Account Foundation** | Reuse any verified authoritative party/account structures; otherwise consider Customer, Organisation, Legal Entity, Billing Account and effective-dated technical mappings. Preserve tenants, applications, keys, licenses, products, orders and all financial history. | Add a party/account service and server-side compatibility mapping; keep customer, application, API-key, portal and billing routes and response meanings. Later additive reads/writes only after owner policy. Finance/Customers/Customer 360 may display verified mapping only. | Audit mapping source, actor/owner approval, tenant scope, before/after, reason, evidence, effective dates and correlation. Idempotency by authority-scoped source reference and mapping interval. Additive schema; backfill only deterministic, approved links. | Stage A preflight evidence and G1; no identity inference; map existing equivalent structures before proposing new ones. Test cardinality, ambiguity, tenant isolation and unchanged IDs.
| **B — Contracts / Quotes / Acceptance** | Reuse existing verified external contract/document authority if found; otherwise logical Contract/Version, Quote/Version, Acceptance evidence. Support existing-agreement Path A and quote-originated Path B. | Add domain services and separately versioned/additive commands; never reinterpret order creation as acceptance. Finance workspace Quote & Contracts; any portal acceptance requires a dedicated authorized flow. | Immutable issued/accepted quote and executed contract versions, effective dates and evidence reference. Acceptance idempotency is exact accepted version + scoped command/evidence + authorized actor. Additive persistence; no historical contract/quote backfill without deterministic evidence. | Stage A accepted; Legal/Finance signer, terms, retention and date policies; production inventory of existing agreements; test both authority paths and rejected/duplicate/expired actions.
| **C — Orders / Subscriptions / Entitlements** | Preserve `billing_orders` and `billing_order_lines`; add order/version/amendment links and canonical subscription/version/entitlement only as required. Keep legacy licenses as projection until parity. | Add accepted-authority order workflow and subscription/entitlement service. Existing order/license routes remain facades. Finance, Customer 360 and licensing contexts expose verified state only. | Append-only order/subscription/entitlement versions; effective dates and predecessor; idempotency by accepted line/version + service scope/term and entitlement version + target/scope. Backfill only validated authority and mapping. | Stages A/B accepted; verify production relationship and license evidence; test amendments, effective dates, duplicate grants, cancellation and legacy license parity.
| **D — Provisioning / Usage / Rating / Charges** | Reuse IAM/application/key/policy, `tenant_key_usage`, provider/model registry, quotas and FinOps. Add durable provisioning operation, rating result/version and charge identity only if no verified equivalent exists. | Add server-side entitlement provisioning and usage/rating/charge services; preserve gateway and `/api/v1/usage*` contracts. FinOps remains cost/usage analysis; charge drill-through is additive. | Link Contract/Order Line → Subscription → Entitlement → Provisioning → runtime identity/request → usage → provider cost → rating version → durable charge. Idempotency at source-event, policy/rating version, pack consumption and charge source. Keep raw usage immutable; no duplicate billable event. | Stage C accepted; establish source completeness, price/markup, request-pack, budget/quota, failure, privacy and currency policies; test late/failed/duplicate events, replay and charge reconciliation.
| **E — Invoice / Payment Allocation / Credits / Settlement** | Preserve invoice, ledger, intents, methods, schedules, refunds, reconciliation and journal IDs/history. Add allocation/credit/settlement lineage only as verified needs require; no second ledger. | Keep existing invoice/payment/refund/reconciliation/accounting APIs and provider webhooks as facades. Add allocation/credit relationships additively; preserve direct `billing_payment_intents.invoice_id` meaning and legacy one-invoice view. | Link charge → invoice line → invoice → intent/provider event → allocation(s) → reconciliation → settlement → existing journal source. Idempotency per obligation/run, provider operation/event, allocation command/reversal, statement row and journal source. Backfill only deterministic links. | Stage D accepted; production financial schema/relationship and audit evidence; Finance/Tax/Accounting/provider policies; test allocation, refund/credit separation, currencies, balanced journals, retries and partial settlement recovery.
| **F — Finance / Customer 360 / Portal Integration** | No new financial authority or migration expected. Read models may be needed after backend contracts are stable. | Recompose existing views under one Finance workspace; contextual Customer 360; retain tenant-scoped Tenant Portal. Preserve sidebar IDs, routes, deep links and roles until parity is verified. | Display verified source IDs, status, actor/audit correlation and unknown/unlinked states; UI operations use backend idempotency and authorization. No UI-side ledger/entitlement authority. | Stages A–E APIs accepted; role/permission, provenance, accessibility and consumer inventory; test navigation, authorization, context switching, states and end-to-end lifecycle.

The Architecture Specification’s A–J roadmap remains the conceptual north star. This A–F map is its approved delivery decomposition: architecture F allocation/credits is implemented in E; architecture G provisioning/runtime is implemented in D; H in E; I in F; J is cross-stage final integration/hardening after explicit approval.

## 4. IMPLEMENTABLE NOW versus EVIDENCE-GATED

The categories below describe work that can be considered after the relevant explicit stage authorization. They do not override the current no-implementation status or authorize coding in this planning task.

### A. Can be developed locally without production assumptions

- Pure domain interfaces, DTOs, validators, state transition rules and error/result types that encode approved logical contracts without selecting unknown production identifiers or schema.
- Compatibility adapter interfaces around existing route/service behavior; test doubles and fixtures using synthetic, clearly labelled non-production identities.
- Unit/domain tests for both contractual paths, immutability, effective dating, idempotency scopes, allocation arithmetic, rating determinism, currency separation and authorization decisions.
- Integration-test scaffolding with mocked repositories/providers; API contract tests that assert old routes/fields remain stable without changing routes now.
- UI information architecture/component skeletons and state renderers for verified, unknown, unlinked, inaccessible, loading and error states, provided they do not assume unknown production routes or records.
- Sanitized test fixtures and synthetic migration-test databases. Migration *drafts* may be written locally only after relevant stage authorization, clearly marked unapplied and dependent on evidence; no production assumptions may be encoded as live FKs or backfills.
- Static source inventory, dependency diagrams, and consumer/route inventories from the checked-out repository.

### B. Must wait for production evidence and review

- Selecting/reusing production party, organisation, legal entity, billing-account or CRM structures; asserting actual tenant/application/key/license/order/product relationships or live constraints.
- Any production-specific backfill, mapping, schema compatibility decision, FK/index/nullability assumption, migration checksum reconciliation or data migration plan based on actual fields/data.
- Deciding the actual agreement path, interpreting the captured order as accepted, or associating the order with a payer/account/subscription/entitlement.
- Selecting a raw usage authority, event completeness/retention, deployed metering path, provider cost source, actual provider activity or production price/rating/pack policy.
- Mapping existing invoice/payment/refund/reconciliation/settlement/journal rows, allocating historic payments, inferring credits, or making production financial changes.
- Reusing/altering production audit structures; production route/job cutover, API read/write cutover, consumer deprecation, or operational feature enablement.
- Any production migration, backfill, verification query, deployment, provider operation or write.

G1 evidence reconciliation is required before assumptions about production state enter a stage design. Unknown evidence remains unknown; zero counts are only captured snapshot counts.

## 5. Existing financial core protection and compatibility

These objects and their IDs/history remain authoritative and must be extended rather than duplicated:

| Existing table | Protection / compatibility rule |
|---|---|
| `billing_orders`, `billing_order_lines`, `billing_products` | Preserve IDs, SKUs, current typed values and source payloads. Add verified links additively; do not reinterpret technical tenant scope or recurring flags as legal acceptance/subscription. |
| `billing_invoices` | Sole invoice register. Preserve invoice IDs/numbers, issued values, status contract and historic payload; new charge/credit/source lineage is additive. |
| `billing_ledger_entries` | Preserve entry IDs and history; reconcile meaning to AR, allocation and journal. Do not promote it into a new invoice or payment ledger. |
| `billing_payment_intents` | Preserve intent/provider/external IDs and `invoice_id`. Keep its current direct invoice link readable; represent a known one-invoice legacy payment as one compatible allocation only when evidence is deterministic. |
| `billing_payment_methods`, `billing_schedules` | Preserve provider tokenization, consent, collection behavior and IDs. A collection schedule is not a subscription or invoice-generation authority. |
| `billing_refunds` | Preserve request/provider IDs and status/evidence. Do not fabricate historical credit notes or erase refund-to-payment links. |
| `billing_reconciliation_batches`, `billing_reconciliation_items` | Preserve statement rows, IDs, match/exception history and external references. Append corrections and settlement lineage. |
| `accounting_journals`, `accounting_journal_lines` | Sole operational double-entry subledger. Preserve posted IDs/lines; corrections are balanced, linked reversals/adjustments, never direct edits or a second ledger. |

Keep `/api/v1/billing/*` and provider callback contracts as compatibility facades. New relationships and endpoints are additive; old IDs, authorization scopes, payload fields, webhook verification/acknowledgment and direct `invoice_id` semantics remain stable through migration. Legacy behavior is deprecated only after consumer inventory, parity, owner approval and rollback rehearsal; deprecation is not part of this plan.

## 6. Proposed logical domain model and status

“New required” below means a distinct logical capability is needed by the target design, not that a new SQL table is already selected. Production inventory can establish reuse instead.

| Logical entity/relationship | Classification | Intended authority / design note |
|---|---|---|
| Technical Tenant, Application, API Consumer/credential, IAM User/Role, Provider/Model, raw Usage Event | **CURRENT EXISTING** | Existing runtime/security identities and usage source. Preserve IDs and auth boundaries. |
| Product, Order, Order Line, Invoice, Ledger Entry, Payment Intent, Payment Method, Schedule, Refund, Reconciliation Batch/Item, Journal/Journal Line | **CURRENT EXISTING** | Existing commercial/financial capabilities; retain as authoritative cores and compatibility facades. |
| Existing CRM/contract/document/account master or commercial mapping | **POTENTIAL REUSE** | Reuse only if production evidence verifies authority, identity, lifecycle, access and relationship semantics. No such production fact is assumed. |
| Customer, Organisation, Legal Entity, Billing Account, effective-dated party/tenant mapping | **NEW REQUIRED if no authoritative equivalent** | Distinct commercial identities; never derive from a technical tenant. Stage A owner approval and mapping evidence required. |
| Contract/Version, Quote/Version, Acceptance evidence | **NEW REQUIRED if no verified authority exists** | Two valid paths: existing contract→quote→acceptance, or quote→acceptance→contract. Immutable version/document evidence and effective dating. Actual production path unknown. |
| Order Version/Amendment, Subscription/Version, Entitlement/Grant | **NEW REQUIRED logical lifecycle if absent** | Preserve order/order-line identities and license projection; accepted commitment drives effective subscription and grant. |
| Provisioning Operation/Attempt | **POTENTIAL REUSE; otherwise NEW REQUIRED** | Reuse verified durable job mechanism; desired state is tied to entitlement version, target and action with retry/compensation history. |
| Rating/Rating Version, durable Charge, Charge-to-Invoice-Line lineage | **NEW REQUIRED logical capability if no equivalent exists** | Distinguish source usage, provider cost, customer rating and invoiceable obligation. Preserve raw events and financial history. |
| Payment Allocation and Allocation Reversal | **NEW REQUIRED if partial/split/unapplied/reallocation semantics are supported** | Additive relationship around existing payment intent and invoice; never a second payment or accounting ledger. |
| Credit Note / AR adjustment | **NEW REQUIRED only for approved correction policy** | Distinct from cash refund, provider reversal and journal reversal; historical refund rows are not backfilled as credits by guess. |
| Settlement identity | **POTENTIAL REUSE; otherwise NEW REQUIRED only if evidenced** | Existing batch/item and intent settlement references may suffice; decide from production operating evidence. |
| Audit event/correlation model | **POTENTIAL REUSE / EXTEND** | Reuse existing audit only if production evidence proves actor, tenant, before/after, reason, correlation, outcome, access and retention adequacy. |
| Finance / Customer 360 read models | **POTENTIAL REUSE / EXTEND** | Recompose current UI/API data; projections are not financial or commercial authority. |

## 7. API evolution map (planning only)

Actual paths below are compatibility surfaces identified in the inspected checkout. All future service names are logical; no route or contract is changed by this blueprint.

| Existing route family | Future domain service / treatment |
|---|---|
| `/api/v1/customers*`, `/applications*`, `/api-keys*` | Party/account read model may add verified commercial references. Tenant/application/key IDs and authorization predicates remain unchanged. Mapping writes are separate, role-gated, audited and idempotent. |
| `/api/v1/tenant-portal/:id*` | Tenant-scoped portal facade; account-wide views require explicit server-enforced account membership and authorization. |
| `/api/v1/billing/products*` | Product/catalogue facade; optional version identifiers are additive. Never rewrite current product price into historic quote/order/invoice. |
| `/api/v1/billing/orders*` | Order service facade; existing create/list/cancel behavior preserved. New acceptance/version links use separately versioned/additive commands; create does not imply acceptance. |
| `/api/v1/billing/invoices*`, `/api/v1/billing/cycles/run` | Invoice/AR and legacy license-cycle facades. Add source charge lineage only when established; do not silently convert the license cycle to subscription billing. |
| `/api/v1/billing/payments*`, `/payment-methods*`, `/schedules*`, `/checkout` | Existing intent/collection/provider facades. Add allocation APIs/views without changing `invoice_id`, token handling, consent, provider or existing response semantics. |
| `/api/v1/billing/refunds*` | Retain refund request/approval/confirmation semantics. Add explicit credit-note/adjustment operations separately; do not redefine refund as invoice credit. |
| `/api/v1/billing/reconciliation*`, `/billing/accounting/*`, `/billing/ledger*` | Keep existing reconciliation, ledger and journal APIs; add source/allocation/settlement lineage. No second ledger. |
| `/api/v1/billing/{stripe,payfast,ikhokha}/webhook`, `/api/v1/licensing/payment-webhook` | Preserve URLs, signature/ITN verification, acknowledgment and provider semantics. Add durable event-processing state with provider-specific idempotency after approval. |
| `/api/v1/licensing/*` | Preserve existing plan/license/gateway enforcement as compatibility projection until Stage C parity and explicit cutover approval. |
| `/api/v1/usage*`, orchestration/gateway routes | Preserve runtime request/auth contracts; add server-resolved attribution/rating references without accepting client-supplied commercial identity or double charging replay. |

Additive endpoint candidates, only after stage authorization and API consumer/security review: party/account mapping commands (A); quote/contract/version/acceptance commands (B); order amendment/subscription/entitlement operations (C); provisioning status and rating/charge reads (D); payment allocation/reversal, credit-note and settlement lineage commands/reads (E); Customer 360 and Finance read models (F). These are capability categories, not approved route paths.

Potential deprecation applies only to duplicate UI/API entry points or legacy writes after parity. No existing route is identified for immediate retirement. Preserve aliases/facades through release and rollback windows.

Authorization boundaries: actor IAM identity and role authorize the operation; tenant scope remains an independent security predicate; commercial party/account membership alone grants no runtime or cross-tenant access. Each mutating command carries an operation-specific idempotency key, source/version identity, actor, authorization decision and audit correlation. Secrets never appear in IDs, logs or commercial events.

## 8. UI evolution map (planning only)

| Existing component | Future placement | Preservation and evidence rule |
|---|---|---|
| `FinanceCommerceView` | Finance: Catalogue & Pricing; Orders & Subscriptions | Keep existing product/order actions and IDs; show only verified commercial/version links. |
| `BillingAdminView` | Finance: Invoices / Payments / Credits | Preserve invoice and manual receipt behavior until a reviewed additive allocation workflow reaches parity. |
| `FinOpsView` | Finance: Usage & Charges | Provider cost remains separate from customer charge; no invoiceable claim without durable rating/charge authority. |
| `AccountingControlView` | Finance: Reconciliation / Accounting | Preserve controls, permissions, journals, imports, match and settlement; no duplicate accounting UI. |
| `LicensingMonetizationView` | Finance: Orders & Subscriptions / legacy licensing context | Retain license enforcement access until canonical entitlement parity is accepted. |
| `Tenant360View` | Contextual Customer 360 | Show source/provenance; tenant/customer fallback data is not commercial evidence. |
| `CustomersView` | Finance: Customers & Accounts; selected Customer 360 | Keep tenant/customer API meaning distinct; show canonical parties only when verified. |
| `OrgHierarchyView` | Customer 360: Organisation & Accounts | Treat existing tree as presentation until persisted authoritative relationships are verified. |
| `TenantPortalView` | Tenant-scoped Customer Portal | Preserve tenant scope and actions; no cross-tenant account views from a client-side grouping. |

Use the current Finance workspace with contextual sections, Customer 360 as a contextual commercial view, and the existing permission-scoped Portal. **Complexity belongs in architecture, not menu.** Reuse components/panels; preserve navigation IDs, routes and deep links until replacements are verified. Unknown/unlinked, inaccessible, empty and not queried are distinct display states.

## 9. Event lineage, audit and idempotency contract

The common lineage is:

`Customer/Account → Contract or Quote authority path → Acceptance → Order/version → Subscription/version → Entitlement → Provisioning operation → IAM/User/Application/API Consumer → Credential reference → Request/Policy/Classification → Provider/Model → Usage Event → Provider Cost → Rating/version → Charge → Invoice/line → Payment Intent/provider event → Allocation/reversal → Reconciliation → Settlement → Journal → Audit.`

Audit is cross-cutting, not a final identity system. Keep commercial party, signer, IAM actor, technical tenant, application, API consumer and credential distinct. Every transition records, where applicable, stable object/source/version IDs, actor/service identity, authority decision, tenant scope, prior/new state, reason, effective and recorded time, correlation/request ID, outcome and protected evidence reference. Stage A preflight must establish whether production audit can support this before reuse; local migration definitions do not prove production adequacy.

Idempotency is operation-specific and scoped to the authoritative source/version, target and action: acceptance evidence; order command; subscription source line/version; entitlement version/scope; provisioning desired-state action; usage source namespace/event ID; rating version; charge source obligation; invoice run/source set; provider operation/event; allocation/reversal command; refund request; reconciliation statement row/match; settlement item; journal source type/source ID. Correlation IDs connect hops but do not replace idempotency keys. Persist external provider effect state; database rollback cannot reverse provider cash movement. Retry, duplicate, terminal failure, late event and manual-review outcomes remain distinguishable.

## 10. Eventual migration sequence (not migrations)

No migration or DDL is created by this plan. The sequence below is a planning checklist; every migration is separately designed, reviewed, authorized and rehearsed after required gates.

| Draft sequence | Prerequisite | Additive schema/change category only | Backfill / validation / financial invariants | Rollback, forward recovery and production evidence |
|---|---|---|---|---|
| **M-A Party/account** | G1 complete; G2 Stage A authorization; owner-approved identity/cardinality; live equivalent-table/FK/index audit. | Reuse verified structures or add distinct party/account/mapping capability with effective dates and audit linkage; retain tenant IDs and predicates. | Backfill only deterministic owner-approved party mappings. Validate duplicates, FK/application links, access matrix, unchanged IDs and financial counts/totals by currency. | Disable new reads/writes; preserve mappings/audit used by downstream records and forward-correct. Production evidence: table inventory, relationship/orphan checks, metadata keys, release, audit and owner mapping evidence.
| **M-B Contract/quote/acceptance** | G3 Stage A accepted; legal/finance path and signer authority approved; production contract/document inventory. | Add/reuse immutable contract/version, quote/version and acceptance evidence capability; order link is nullable/additive. | No inferred historical contract. Verify both authority paths, immutable content, exact acceptance/version and duplicate command handling; no change to existing orders/invoices. | Before external issue/acceptance, disable workflow; after legal effects, void/amend/forward-correct and retain evidence. Production evidence: existing records, document/CRM references, app release and audit coverage.
| **M-C Order/subscription/entitlement** | G4 Stage B accepted; order/license/service-scope evidence and technical target mapping. | Add order-version/amendment and subscription/version/entitlement source structures only if verified equivalents do not exist. | Backfill only accepted, deterministic source lines; reconcile license parity and grants; prove no duplicate access, unchanged order/product/line IDs and unchanged historical financial totals. | Disable new activation; compensate runtime grants via authorized operations; preserve accepted versions. Production evidence: live FKs/joins, license-plan relationships, release, and actual entitlement mappings.
| **M-D Provisioning/usage/rating/charge** | G5 Stage C accepted; metering completeness, rate/cost/pricing, quota/pack/failure policy approved. | Reuse queue/job, raw usage and registry; add provisioning operation/rating/charge lineage only where no suitable authoritative structure exists. | No raw usage rewrite. No backfill unless event, entitlement, cost, price, authority and currency are deterministic. Reconcile event count/units/cost/rating/charge by currency/status; replay is idempotent. | Stop new rating/charge creation; retain events/results. Already invoiced/posted charges require linked financial correction in E. Production evidence: usage schema/counts, joins, deployed release, cost provenance, price terms, audit and idempotency.
| **M-E Invoice/allocation/credit/settlement** | G6 Stage D accepted; live financial relationships; Finance/Accounting/Tax/provider policy approval. | Preserve invoice, ledger, payment intent, methods/schedules, refunds, recon and journal tables. Add allocation/reversal and approved credit/settlement lineage additively; no duplicate ledger. | Backfill only verified direct links. Validate allocations within captured/payment and invoice balances, no cross-currency netting, invoice/journal IDs unchanged, journals balanced, totals by currency unchanged except approved new activity. | Before provider effects disable path; after capture/refund/settlement reconcile externally and post approved reversals/adjustments. Production evidence: schema/constraints, payment-provider event/refs, statuses, orphan/duplicate checks, totals, FX/tax and audit.
| **M-F UI/read-model integration** | G7 Stage E accepted; API contract, role matrix, deployed consumer and deep-link inventory approved. | Normally no financial schema migration; optional read projections only if service/API review proves need. | No UI-authoritative backfill. Validate API provenance, roles, context switching, no duplicate actions, navigation parity and financial values equal backend. | Restore old navigation aliases/feature flags; do not delete records or reverse financial effects. Production evidence: route/view release mapping and permissions; no claim of deployment from local source.

Before each stage: capture a fresh operator-collected read-only baseline. Never run migration/seed code against production to inspect it. Use explicit expand/read/validate/cutover phases; write duality only with durable idempotency and reconciliation. Rollback means disable new behavior and restore compatible reads where safe; once business, runtime or provider effects exist, use forward recovery and preserve audit/history.

## 11. Testing strategy

Testing is future work after the relevant stage is authorized. Use synthetic fixtures and a sanitized non-production database; never connect test suites to production or seed from production records.

| Test layer | Required coverage |
|---|---|
| Unit / pure domain | Both contract authority paths; acceptance/effective-date precedence; immutable versions; order amendments; entitlement eligibility; rating/rounding; FX currency separation; allocation and credit arithmetic; state transitions; error classification. |
| Domain/service | Source-to-subscription/entitlement/provisioning lineage; event-to-cost/rating/charge; invoice source claiming; refund vs credit vs reversal; reconciliation and settlement continuation; append-only audit events. |
| API compatibility | Existing request/response fields, IDs, status meanings, tenant filters, checkout/webhook acknowledgements, licensing and billing facades. New fields/endpoints additive; legacy direct `invoice_id` behavior preserved. |
| Persistence/integration | Repository transactions and failure recovery; nullable legacy links; verified FK/unique behavior in test schema; provider sandbox or mocks only after authorization; no duplicate effects after timeout/retry. |
| Migration | Forward/rollback rehearsal on synthetic pre/post fixtures; schema diff; checksums; idempotent migration runner; orphan/duplicate detection; additive-only assertion; never execute on production in this workstream. |
| Financial invariants | Per-currency order/charge/invoice/payment/allocation/refund/settlement/journal totals; journals balance; allocations never exceed available cash/credit or invoice balance; issued invoice/journal immutability; no unexplained changes to legacy IDs or totals. |
| Idempotency/replay | Same command/event returns same object; concurrent retries do not duplicate acceptance, orders, grants, usage charges, intents, allocations, refunds, statement rows, settlements or journals; reversal has its own stable identity. |
| Authorization / tenant isolation | Actor role/authority, legal signer distinct from IAM actor, tenant predicates unchanged, party/account link cannot widen scope, portal sibling-tenant denial, server rejects client-supplied commercial ownership. |
| Audit/privacy | Actor/service, authority, tenant, before/after, reason, effective/recorded time, correlation, outcome, evidence reference; access policy, retention and no secrets/unnecessary PII. Audit gaps render as partial/unknown rather than complete. |
| UI | Finance workspace organization; existing deep links; Customer 360 provenance; tenant-scoped portal; permissions; keyboard/accessibility; empty/unknown/inaccessible/error states; no duplicate write affordances or UI-side authority. |
| End-to-end lifecycle | Run complete synthetic lifecycle below through the same domain/API boundaries planned for delivery; assert history, audit correlation, authorization and accounting invariants at each hop. |

Required end-to-end lifecycle:

`Customer → Contract/Quote → Acceptance → Order → Subscription → Entitlement → Provisioning → Usage → Rating → Charge → Invoice → Payment → Allocation → Reconciliation → Settlement → Accounting → Audit.`

Run it for both **Path A** (existing Contract/Version → Quote/Version → Acceptance → Order) and **Path B** (Quote/Version → Acceptance → Contract/Version → Order). Also test authorization denial, missing/ambiguous mapping, expired authority, duplicate/late/failed usage, partial/unapplied payments, refunds without credit notes and credits without refunds, provider timeout after success, partial settlement/journal retry, and cross-currency rejection. The test must not imply either path is currently used in production.

## 12. Implementation gates and release order

| Gate | Exit evidence | Current status / restriction |
|---|---|---|
| **G0 — Architecture approved** | Accepted architecture and stage design baseline. | Reported complete. Does not authorize implementation by itself. |
| **G1 — Production evidence reconciled** | External operator evidence reviewed; known facts, unknowns, inaccessible/unqueried results and owner decisions recorded without inference. | Pending. No Codex production connection or query. |
| **G2 — Stage A implementation authorized** | Separate explicit Stage A authorization after G1 and accepted plan. | Not granted by this blueprint. |
| **G3 — Stage A accepted** | Approved party/mapping behavior, tests, evidence, audit/security, API and rollback accepted. | Future gate. |
| **G4 — Stage B accepted** | Both legal authority paths, acceptance, immutable versions, effective dating and audit accepted. | Future gate. |
| **G5 — Stage C accepted** | Order/version, subscription, entitlement, license parity, runtime target and rollback accepted. | Future gate. |
| **G6 — Stage D accepted** | Provisioning, usage source, rating/charge determinism, cost, pricing, quota and replay accepted. | Future gate. |
| **G7 — Stage E accepted** | Invoice/allocation/credits/reconciliation/settlement/accounting invariants accepted. | Future gate. |
| **G8 — Stage F accepted** | Finance, Customer 360, Portal, permissions, navigation and accessibility accepted. | Future gate. |
| **G9 — Full lifecycle regression accepted** | Both authority paths pass end-to-end plus financial/security/audit invariants and rollback recovery rehearsal. | Future gate. |
| **G10 — GitHub release approved** | PC implementation and verification are complete; change review, owner approval and release artifact prepared; explicit release/push authorization provided. | Deliberately after PC implementation and verification. No push/commit is authorized here. |
| **G11 — Production deployment approved** | Separate production deployment decision, approved change window/runbook, verified backup/recovery, evidence baseline and rollback/forward-recovery owners. | Deliberately after G10; no deployment or production change is authorized here. |

Dependency order is G0 → G1 → G2 → G3 → G4 → G5 → G6 → G7 → G8 → G9 → G10 → G11. A later stage cannot consume an unresolved prerequisite by assuming a relationship. Workstream-local implementation can proceed only with its explicit stage authorization and all required preceding gates accepted.

## 13. Rollback and operational safety

- **A:** Disable new mapping reads/writes or feature flags; keep tenant identities and authorization predicates. Preserve mappings already referenced by later records; correct via approved effective-dated events, never erase audit.
- **B:** Stop issuing new quotes/acceptances. An offer already sent or agreement executed cannot be undone by database rollback; use legal void/amendment/termination with preserved evidence and external coordination.
- **C:** Stop new order-to-subscription activation; keep accepted order/version history. Reverse runtime grants only through authorized compensating entitlement/provisioning operations; preserve licenses until parity and rollback approval.
- **D:** Stop new rating/charge creation while retaining raw usage and operation results. Preserve already invoiced/posted charges and correct them through E’s approved credit/adjustment/reversal path. Runtime access rollback is separate from billing rollback.
- **E:** Before external provider effect, disable new collection/allocation paths. After capture/refund/settlement, never assume DB rollback reverses cash; reconcile provider evidence and post approved linked reversals/adjustments. Preserve invoice, payment, reconciliation and journal IDs/history.
- **F:** Restore prior navigation aliases or feature flags; do not delete records or weaken server authorization. Recheck tenant-context cache isolation.

Every stage requires restore/recovery rehearsal, stable operation keys, audit preservation, per-currency reconciliation, no unintended legacy ID changes, and confirmation that IAM and policy still enforce runtime access. Stop on unexplained financial differences, ambiguous identity, failed authorization or inability to assure read-only evidence collection.

## 14. Explicit boundaries

This master plan is **planning only**. It does not authorize or perform implementation, migration creation, schema changes, API changes, UI changes, data changes, production connection, production queries, production changes, deployment, Git commit, or GitHub push. No production evidence is collected by this plan. No production fact or relationship is invented; unknown, blocked, unqueried and inaccessible evidence remains explicitly unresolved. Any future implementation, GitHub release and production deployment require their respective separate gates and explicit authorization.
