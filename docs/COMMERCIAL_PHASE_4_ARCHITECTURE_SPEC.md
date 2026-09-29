# ALTIL Commercial Platform — Phase 4 Architecture Specification

**Status:** Design specification for review; not implementation authorization.
**Phase:** Phase 3/3B evidence collection and analysis are reported complete. Phase 4 is not started.
**Scope:** Target model, lifecycle, compatibility and conceptual delivery sequence. No SQL or implementation code is defined.

## 0. Evidence boundary and design rules

This specification synthesizes [Architecture Discovery](./COMMERCIAL_ARCHITECTURE_DISCOVERY.md), [Phase 2 Domain Design](./COMMERCIAL_PHASE_2_DOMAIN_DESIGN.md), [Phase 3 Validation](./COMMERCIAL_PHASE_3_VALIDATION.md), [Production Evidence Request](./COMMERCIAL_PRODUCTION_EVIDENCE_REQUEST.md), [Phase 3 Evidence Analysis](./COMMERCIAL_PHASE_3_EVIDENCE_ANALYSIS.md), and the read-only source inspection.

### Production evidence captured during Phase 3B

The externally collected production evidence identifies database `altil_db`, running `MariaDB 10.11.18-MariaDB-0+deb12u1`, with 61 tables and 23 applied migrations (001–023). The following are captured production row counts at evidence-collection time; they are not workspace/test counts:

| Production object | Rows |
|---|---:|
| tenants | 1 |
| tenant_applications | 1 |
| tenant_api_keys | 1 |
| billing_products | 10 |
| billing_orders | 1 |
| billing_order_lines | 1 |
| ai_providers | 8 |
| ai_models | 16 |
| tenant_key_usage | 0 |
| billing_invoices | 0 |
| billing_payment_intents | 0 |
| billing_payment_methods | 0 |
| billing_schedules | 0 |
| payment_provider_events | 0 |
| payment_webhook_logs | 0 |
| billing_refunds | 0 |
| billing_reconciliation_batches | 0 |
| billing_reconciliation_items | 0 |
| accounting_journals | 0 |
| accounting_journal_lines | 0 |
| iam_login_events | 41 |
| platform_currency_settings | 1 |
| billing_fx_rates | 1 |
| billing_fx_rate_history | 1 |

The captured production commercial order is for tenant `tenant-altil-internal`, status `active`, currency ZAR, total 85. It has one order line: product `prod-ai-seat`, quantity 1, unit price ZAR 85, billing unit `user_month`, recurring `true`, active `true`. The ten verified production catalogue products include the documented AI seat, API key, capability, inference cost-plus, privacy, request-pack, and team products.

Migration 020 contains platform-currency/FX seed and maintenance behavior. Migration 023 contains product-catalogue seed and maintenance behavior. These migrations are evidence about schema/bootstrap behavior; they must not be rerun against production merely for inspection.

A production count of zero means there were zero persisted rows of that type at the time of evidence capture. It does **not** prove that the capability is broken, unused historically, undeployed, or unnecessary; it does not prove the source path is not deployed or that the feature is intentionally unused. Relationship/foreign-key behavior that was not actually queried remains unverified. The captured counts are a point-in-time snapshot, not an assertion about activity outside that snapshot.

Production server `@@read_only` was 0: the database server itself was writable, so evidence collection relied on read-only operational/session discipline. No production writes, migrations, repairs, or application changes were performed during evidence collection. The earlier workspace/test database and simulator records remain explicitly excluded from production evidence. Source inspection establishes behavior in the inspected checkout only; it does not independently prove every path is deployed or actively used.

One validation passage says no billing schedule worker was found; the focused source inspection found runBillingCollections() invoked at startup and on a five-minute interval in server.ts. This specification follows the direct code evidence. The captured production schedule table has zero rows; that does not establish whether the worker is deployed, has run, or is intentionally unused.

Non-negotiable design constraints:

1. Preserve the existing financial core and all existing financial IDs/history.
2. Do not create parallel invoice, payment, reconciliation, or accounting systems.
3. Separate technical tenant from customer, organisation, legal entity, and billing account.
4. Accepted terms, issued financial values, and raw usage evidence are immutable. Corrections append versions, adjustments, reversals, or credit records.
5. Retain /api/v1/billing/* contracts as compatibility facades during transition.
6. Keep UI complexity in contextual workspaces, not separate top-level menus.
7. Never infer historical relationships from similar dates or amounts.
8. This document authorizes no production or implementation change.

## 1. Architectural objective and target lifecycle

ALTIL is a trusted enterprise AI operating and commercial platform between organisations and AI providers. It governs identity, data, policy, AI access, usage, cost, security, contractual trust, billing, accounting, and audit.

Target lifecycle:

Customer → Organisation → Legal Entity → Billing Account → applicable contractual authority path → Order → Order Lines → Subscription → Entitlements → Provisioning → Users / Applications / API Consumers → Usage Events → Rating → Charges → Invoice → Payment → Payment Allocation → Reconciliation → Settlement → Accounting Subledger → ERP/GL Integration

The contractual authority path has two legitimate forms:

- **Path A — Existing agreement:** Existing Master Contract / Contract Version → Quote / Quote Version → Customer Acceptance → Order.
- **Path B — Quote-originated agreement:** Quote / Quote Version → Customer Acceptance → Contract / Contract Version → Order.

These paths are not contradictory: Path A applies when an existing agreement governs the offer; Path B applies when the accepted quote originates the agreement. An Order cannot become commercially effective until the required contractual authority and customer acceptance requirements for the applicable commercial path have been satisfied. ALTIL's actual production path is **UNKNOWN / REQUIRES EVIDENCE**; no production path is inferred here.

This is a relationship model, not a table-per-entity requirement. Use existing records where they are authoritative; add first-class entities where distinct lifecycle, history, or relationships are required; use projections for summaries; use workflow records for approval/retry/external effects; defer unsupported capabilities. ERP/GL is a boundary, not a commitment to build an integration now.

Logical service boundaries may be introduced within the current application: party/account; catalogue/offer; contract/order; subscription/entitlement; provisioning; usage/rating/charge; billing/AR; payments; reconciliation/settlement; accounting/export. No microservice deployment is implied.

## 2. Existing financial core to preserve

| Existing capability | Preserve and extend by linking to |
|---|---|
| billing_products | Stable product identity used by quote/order, subscription, price versions, rating, and charges. |
| billing_orders / billing_order_lines | Stable order identity and snapshots; link to acceptance, contract, account, subscription, and provisioning. |
| billing_invoices | Sole invoice register and historic invoice authority; add explainable line lineage without recreating/reissuing history. |
| billing_ledger_entries | Existing operational financial activity; reconcile its meaning with invoices, payment allocations, refunds, and journals. It is not a substitute for those records. |
| billing_payment_intents | Existing provider payment operation and IDs/references; add allocation semantics around it, do not replace it. |
| billing_payment_methods | Existing provider token reference and consent state; retain tokenization and never store raw credentials. |
| billing_schedules | Existing consented collection configuration and scheduler state; distinguish collections from subscriptions and invoice generation. |
| billing_refunds | Existing refund request/provider history; link it to credit/adjustment and journal records. |
| billing_reconciliation_batches / items | Existing statement evidence, matches, and exceptions; correlate settlement without replacing reconciliation. |
| accounting_journals / lines | Existing double-entry operational subledger; preserve posted IDs and correct with reversals. ERP remains downstream. |
| Stripe, PayFast, iKhokha | Preserve provider abstraction, verification, hosted flows, and provider references. Harden retry/correlation without replacing providers. |

No new invoice, payment, reconciliation, or accounting engine is part of this design. Existing identifiers remain queryable. Backfills distinguish deterministic, ambiguous, absent, inaccessible, and unqueried evidence; no guessed links.

## 3. Canonical domain model

The following is a logical model. “Immutable” means never overwritten after the stated point; current status may be projected from append-only transitions. A first-class persistence structure is warranted when the entity has its own identity, lifecycle, or required one-to-many/many-to-many history. Otherwise use a typed extension, version/event record, or projection.

| Entity | Purpose / owner / relationships | Lifecycle, immutable vs mutable, versioning | Identity, idempotency and audit |
|---|---|---|---|
| Customer | Commercial counterparty; owns commercial relationships and one or more organisations/accounts. Distinct from technical tenant. | Draft/active/suspended/closed. Contact data may change; accepted party identity snapshots remain on agreements/invoices. | Stable customer ID and scoped external reference. Audit merges, status, and access. |
| Organisation | Corporate/group hierarchy linked explicitly to customer and optionally multiple technical tenants. | Active/inactive, effective-dated parent/child links; hierarchy changes versioned. | Stable ID; scoped code; idempotent external mapping. Audit every hierarchy change. |
| Legal Entity | Registered contracting/invoicing party, country and registration/tax identity. Belongs to customer/org. | Active/inactive; registration effective intervals. | Stable ID; sensitive registration data protected. Historic issuer identity immutable on issued documents. Audit changes/access. |
| Billing Account | Bill-to, invoice delivery, terms, currency and collection unit; belongs to customer and references legal entity. | Open/credit hold/closed; effective-dated terms and policy. | Stable ID/external mapping. Issued invoice retains account/policy snapshot. Audit credit/term changes. |
| Cost Centre | Optional customer/org charge attribution. | Active/inactive with effective-dated hierarchy/codes. | Stable ID and scoped code; historical charge attribution frozen. Defer absent verified need. |
| Product | Existing billing_products identity. | Active/archived. Commercial changes use a price/product version. | Preserve product ID/SKU. Mutable display metadata; historic offer snapshots immutable. |
| Product / Price Version | Service definition and time-effective price basis used by quote/order/subscription/rating. | Draft/approved/active/expired. Immutable once issued, accepted, or used for rating. | Stable version ID + sequence. Approval idempotent per product/version; audit author/approver. |
| Contract | Agreement between legal/commercial parties; relates versions, accounts, quote acceptance and orders. | Draft/active/expired/terminated, with term, renewal and notice dates. | Stable ID. Executed evidence reference and parties are immutable once executed. Status transitions audited. |
| Contract Version | Frozen terms, effective dates, and amendments. | Proposed/approved/executed/superseded; explicit predecessor and effective interval. | Stable ID + version. Accepted clauses immutable; amendment command idempotent by contract/version/action. |
| Quote | Offer identity owned by commercial function; references customer, account, legal entity and versions. | Open/expired/accepted/rejected/withdrawn; validity window. | Stable ID; workflow pointer mutable, version content immutable. Create idempotently by command key. |
| Quote Version | Frozen scope, quantities, price versions, terms, currency, tax assumptions and validity. | Draft/review/approved/issued/expired/accepted/rejected/superseded. | Stable sequence; issued content immutable. Audit creation, approval and issue. |
| Customer Acceptance | Evidence that authorized actor accepted exact quote/contract version. | Pending/accepted/rejected/revoked only under explicit legal process. | Stable ID; version, actor, method, timestamp and evidence/hash immutable. Idempotent on evidence/action reference. A tenant row is not acceptance. |
| Order | Existing order aggregate; references acceptance, contract, account, and lines. | Draft/submitted/accepted/processing/partially fulfilled/fulfilled/cancelled/rejected. | Preserve current ID/number. Accepted snapshot immutable; changes append transitions. Scoped command key/source reference prevents retry duplicates. |
| Order Version / Amendment | Append-only change to accepted scope, quantity, price, term or cancellation. | Proposed/accepted/effective/rejected/superseded; predecessor and effective time required. | Immutable before/after snapshot, reason, actor and authority. Idempotent per order amendment command. |
| Order Line | Existing line snapshot for product/service, quantity and scope. | Pending/active/fulfilled/cancelled/ended; service period and amendment sequence. | Preserve ID where present. Product/price version, currency, quantity and accepted terms fixed per version. Links to subscription, charges and invoice lines. |
| Subscription | Time-bounded service commitment derived from accepted order line; not a billing schedule or provider subscription. | Pending/active/suspended/cancellation pending/cancelled/expired; start, renewal, end. | Stable ALTIL ID; preserve external provider subscription ref. Terms immutable by version; current state is projection. Activation idempotent by accepted line/scope. |
| Subscription Version | Effective-dated product, quantity, cadence, limits, price and source amendment. | Scheduled/active/superseded/ended with unambiguous intervals. | Immutable version sequence. Audit effective-date and amendment decisions. |
| Entitlement | Effective grant/limit that runtime policy evaluates; sourced from subscription version. | Pending/active/suspended/revoked/expired with validity interval. | Stable ID and immutable source/scope/limit per grant; changes append events. Idempotency key = source version + scope. |
| Provisioning Job | Retryable desired-state change from entitlement to runtime identities/policies; reuse suitable job system if verified. | Queued/running/succeeded/retryable/permanent failed/cancelled/compensated. | Stable operation ID and source entitlement/version/target key. Attempts/effects append. Audit actor, correlation and compensation. |
| User | Human identity owned by existing IAM; commercial membership/roles are separate bindings. | Existing IAM lifecycle remains authoritative. | Preserve IAM ID and auth history. Never place credentials in commercial records. Audit bindings. |
| Application | Existing tenant_applications runtime identity; explicitly maps to commercial owner and entitlement scope. | Existing technical lifecycle plus effective-dated commercial bindings. | Preserve application ID. Technical configuration remains separate from grants. |
| API Consumer | Machine/client identity, potentially linked to API key/service account, application and tenant. | Active/revoked/expired; credential rotation separate. | Non-secret stable consumer ID. Preserve key security/IDs; do not use secret as commercial identity. Audit attribution. |
| Usage Event | Immutable runtime observation; tenant_key_usage is current source evidence. | Accepted/rejected/duplicate/late with occurred and received times. Corrections are compensating events. | Preserve source event/request ID and attribution; add source-scoped uniqueness. Never include credentials/secrets. Audit ingestion. |
| Rating | Deterministic, versioned calculation over eligible usage or fixed obligation. | Pending/rated/failed/superseded/voided; rating run and effective version. Rerating creates new outcome. | Immutable inputs, provider cost, markup, rule, FX/tax decisions, result and algorithm version. Unique by source + rating version. Audit replay/reason. |
| Charge | Invoiceable obligation from rating or fixed recurring service. | Unbilled/held/invoiced/credited/voided, service period. | Stable ID/source rating or subscription version; amount/currency/price/tax snapshot immutable. One charge per source outcome; adjustments append. |
| Invoice | Existing billing_invoices remains sole invoice/AR record. | Draft/issued/partial/paid/overdue/void. Issued content immutable; balances are derived from allocations/credits. | Preserve invoice ID/number. Issued header/lines/tax/currency frozen. Draft controlled; generation idempotent by billing run/source set. |
| Invoice Line | Explainable line linked to charge, fixed recurring obligation or approved adjustment. | Draft/issued/credited/void in line with document policy. | Stable ID; source, description, quantity, unit price, tax and period frozen at issue. Idempotent per invoice + source obligation. |
| Payment | Provider collection centered on billing_payment_intents. | Created/pending/authorized/succeeded/failed/cancelled/reversed/partial refund/refunded/disputed. | Preserve intent/provider/external IDs and event history. Idempotent by provider operation and event; audit external effect separately. |
| Payment Allocation | First-class payment/credit-to-invoice relationship and history. | Allocated/reversed; allocation and reversal times. | Stable ID; amount/currency, actor/source immutable. Command key prevents duplicate. Enforces invoice and available-credit balances. |
| Refund | Request and external cash-return workflow against payment. | Requested/approved/submitted/processing/succeeded/failed/manual review/cancelled. | Preserve existing refund ID/reference/reason. Provider-confirmed result immutable; retries idempotent. Audit requester, approver, evidence. |
| Credit Note | Separate immutable AR correction to invoice; not a cash refund. | Draft/approved/issued/applied/voided by accounting policy. | Stable number/ID and original invoice reference; issued lines/tax/currency immutable. Idempotent per approved adjustment. |
| Reconciliation | Existing batches/items remain provider/bank statement evidence and matching decisions. | Imported/review/matched/exceptions/settling/settled/closed; reopen by auditable event. | Preserve batch/item IDs and statement references. Import dedupe by provider/statement/row identity; manual match actor retained. |
| Settlement | Provider/bank payout identity with gross/fee/net/currency/date, recon and journal refs. | Expected/partial/settled/exception/reversed. | Immutable provider reference/evidence; state changes append. Idempotent by provider settlement ID. First-class persistence only if verified need. |
| Tax | Effective tax jurisdiction, registration, code/rate and per-line decision evidence. | Effective-dated registration/rule versions; approved/active/expired/revoked. | Issued result and rule inputs immutable. Idempotent by source + rule version; tax owner approves rules. |
| Currency / FX | Explicit currency roles for each financial object and conversion. | Rate versions include direction, source, effective/observed timestamps and rounding. | Original transaction amounts immutable. Conversion stores exact rate reference and result; display preference never changes accounting. |
| Audit Event | Existing audit_logs if retention/access are adequate, plus domain transition correlation. | Append-only actor/action/entity/time/outcome/correlation. | Stable event identity; no secrets or unnecessary personal data. Audit sensitive reads/changes. |

## 4. Existing → target mapping

| Existing object | Target object | Disposition | Reason | Migration concern | Compatibility concern |
|---|---|---|---|---|---|
| tenants | Technical tenant + explicit commercial mapping | Retain/extend | Runtime isolation anchor, not automatically a customer or legal party | Map only with approved evidence; no inferred one-to-one hierarchy | Preserve tenant IDs and authorization predicates |
| tenant_applications | Application / runtime consumer | Retain/extend | Existing runtime application identity | Add explicit commercial/entitlement binding | Existing APIs and IDs remain |
| tenant_api_keys | Consumer credential | Retain/extend attribution | Existing credential and usage path | Never expose or reclassify secrets as commercial IDs | Preserve key behavior, hashes and tenant scope |
| tenant_licenses | Legacy license / entitlement projection | Retain during transition; map/extend | Existing gateway enforcement | Map to subscription only with proven source | Keep license reads/writes until parity |
| licensing_plans | Plan/product definition | Retain/map/version | Existing plan/limits capability | Preserve IDs, limits, and historic meaning | License API responses remain |
| billing_products | Product identity | Retain/extend | Existing catalogue | Preserve SKU/ID; price change versioned | Product API stays compatible |
| billing_orders | Order aggregate | Retain/extend | Existing order and cancellation | Preserve IDs/payload; map only proven source | Current list/create/cancel routes remain |
| billing_order_lines | Order line snapshot | Retain/extend | Existing quantity/price/currency | No guessed quote/subscription links | Preserve line and payload reads |
| billing_invoices | Invoice/AR | Retain/extend | Sole invoice register | Never recompute issued history | Preserve invoice ID/number/status contract |
| billing_ledger_entries | Activity ledger | Retain/clarify | Existing operational financial events | Reconcile against AR/allocation/journals | Keep read API during transition |
| billing_payment_intents | Payment/provider operation | Retain/extend | Existing provider IDs and direct invoice link | Preserve provider refs; direct link becomes legacy shortcut when allocation exists | Keep checkout/webhook consumers |
| billing_payment_methods | Token reference/mandate | Retain/extend | Existing saved methods and consent | Protect token, preserve revocation history | Keep setup/revoke behavior |
| billing_schedules | Collection schedule | Retain/clarify | Existing consent and scheduler | Separate collection from subscription authority | Keep schedule APIs |
| billing_refunds | Refund lifecycle | Retain/extend | Existing refund and provider evidence | Link credit/journal; do not rewrite old invoice values | Preserve refund IDs and actions |
| billing_reconciliation_batches | Statement batch | Retain/extend | Existing import/match workflow | Preserve imported evidence and exceptions | Keep batch API |
| billing_reconciliation_items | Statement rows/matches | Retain/extend | Existing external references and intent links | Preserve match decision history | Keep match route contract |
| accounting_journals | Subledger header | Retain | Existing balanced journal engine | Preserve posted IDs; correct by reversal | Keep journal APIs |
| accounting_journal_lines | Subledger lines | Retain | Existing double-entry detail | Never edit posted lines | Preserve read shape/FK behavior |
| tenant_key_usage | Raw usage evidence | Retain; normalized projection only if needed | Existing metering and attribution source | Verify completeness/idempotency/retention; no duplicate event import | Preserve usage/FinOps inputs |
| audit_logs | Shared audit source | Retain/extend | Existing audit foundation | Verify immutable/retention/detail requirements | Preserve existing consumers |
| Invoice line JSON | Legacy line payload | Retain as historic source/compat projection | Existing invoices rely on payload | Backfill only deterministic references | Continue legacy response fields |
| payment_provider_events / payment_webhook_logs | Provider event evidence | Retain/extend process state | Current event dedupe/logging | Handle side-effect-before-record race | Preserve callback URLs/responses |
| No first-class quote, contract, version, allocation, credit-note, charge, entitlement domains found in inspected schema/source | Those canonical domains | New first-class logical capability if approved | Current source cannot represent required independent lifecycle/history | Production full inventory must confirm and map; do not assume absent from unqueried data | Add behind current APIs; no parallel core |

Technical tenant, customer, organisation, legal entity, and billing account may map one-to-one only when explicitly established. `tenant_id` remains on legacy rows and remains a security scope throughout migration.

## 5. Order → subscription → entitlement → provisioning

Authority chain: accepted commercial terms → order and immutable order lines → subscription/version → entitlement grant/version → provisioning job → runtime access. A quote, draft order, payment schedule, or payment method alone never grants access.

- Activate subscription at an accepted order line's defined service start after required approvals/preconditions. If payment is an activation condition, make that contractual condition explicit rather than global.
- Recurring order lines feed subscriptions only after accepted order authority. Product recurring metadata is not itself a scheduler or subscription.
- A subscription version captures product/price, quantity, cadence, term, limits, and source order amendment. Version changes are effective-dated and non-overlapping.
- Entitlements derive from subscription versions and include service scope, limits, validity, source order/contract, and revocation history.
- Provisioning asynchronously reconciles desired grants to users/apps/API consumers/policy. Stable operation key = entitlement version + target + action. Persist attempts, external references, results, retry classification and compensation.
- Amendments create accepted order/subscription versions; never rewrite consumed or billed periods. Quantity/plan/product change causes entitlement delta and provisioning reconciliation.
- Suspension, cancellation, renewal, and expiry have explicit effective date, actor, reason and policy impact. Collection failure is not automatically service suspension unless terms/policy say so.
- Proration is deferred until contractual rules, precision, rounding and journal treatment are approved. Use explicit reviewed adjustment meanwhile.
- Provisioning failure remains visible/retryable; it does not imply entitlement succeeded at runtime. Revocation uses a new desired state and compensating action.

Current source creates/cancels orders but does not derive subscriptions or first invoices from recurring order lines. The schedule worker reads billing_schedules; /api/v1/billing/cycles/run reads tenant licenses. These authorities must remain distinct until production mapping and cutover are approved.

## 6. Usage → rating → charge

Keep tenant_key_usage as the raw usage evidence source unless reviewed production evidence identifies another authoritative source. Preserve event IDs/rows. A normalized projection may enrich attribution but must carry source table/event ID and must not create a second billable event. Missing user, organisation, cost centre, contract or entitlement attribution remains unknown, not inferred.

The canonical event supports, when available: occurred/received time, tenant, user/service identity, application, API consumer, API-key reference (never secret), provider, model, metric/units/tokens, provider cost and currency, department/cost centre, contract, subscription, entitlement, product/price version, event/request ID, result, and permitted policy/data-classification references.

Rating pipeline:

1. Validate event, source identity, status, timing and billing eligibility.
2. Resolve effective entitlement, product and immutable price version.
3. Capture provider inference cost, original currency and provenance.
4. Apply configurable markup and customer pricing rule deterministically.
5. Apply approved FX/tax decisions, storing rule/rate source and timestamps.
6. Persist immutable rating inputs, algorithm version and result.
7. Create one charge linked to rating, source event, contract/order/subscription/entitlement, and price version.
8. Make that charge invoiceable once.

Preserve provider inference cost → configurable markup → customer charge. Ingestion is unique by source-scoped event ID; rating by event + rating version; charge by source rating/fixed obligation. Replay returns existing outcome. Rerating creates a linked result; corrections create compensating events/charges, never edit raw usage or already issued invoices. Failed rating may retry with the same operation key. Invoice generation claims a source charge once.

Current server estimates usage cost and records tenant_key_usage; usage insert errors are caught/logged. Threshold schedule logic aggregates successful USD usage into invoice amount, but is not a general versioned rating/charge ledger. Preserve that flow during compatibility and prove production use before cutover.

## 7. Invoice lineage

Keep billing_invoices as the only invoice engine/register. New lines link to one or more charges, fixed recurring obligations, or approved adjustments. A full trace resolves:

Invoice line → charge/fixed obligation → rating result/subscription version → usage event (for usage) → price/product version → entitlement/subscription → order line/version → accepted quote/contract version → billing account/legal entity/customer.

Fixed recurring charges are generated from active subscription versions for a due period. Stable key is subscription-version + period + charge type. billing_schedules governs collection of due invoices, not commercial obligation creation. The legacy license cycle remains separate until mapped. Stripe invoice events retain provider invoice identity and map idempotently to one local invoice. Existing invoice IDs/numbers/issued values stay intact; historical JSON lines remain readable. Structured links may be additive; do not recalculate old invoices with current prices, FX, or tax rules.

## 8. Payments and allocation

Continue using billing_payment_intents and preserve intent/provider IDs. A first-class Payment Allocation relationship is required for any many-to-many, partial, unapplied, reallocation, or credit balance behavior; current single invoice_id cannot represent that history.

- One payment → one invoice: one allocation, including explicit partial allocation when appropriate.
- One payment → multiple invoices: multiple allocation records; validate available amount, invoice currency and balance.
- Partial payment: remaining receivable derives from invoice total less valid allocations/credits.
- Overpayment: do not create negative invoice balance. Hold unapplied cash/customer credit only if finance policy requires it.
- Unapplied cash: payment exists without allocation; no automatic allocation absent a defined, auditable policy.
- Reallocation: append reversal and replacement allocation; never edit prior event.
- Cross-currency allocation: disallow unless explicit conversion records rate direction/source/effective time/rounding.
- Capture: external provider effect and database allocation are separate. DB rollback cannot undo capture; recover through provider idempotency and reconciliation.
- Chargeback/dispute: defer absent production evidence and operational requirement; if required, model dispute and cash/accounting reversal separately from refund and invoice credit.

The current manual receipt route updates one invoice and ledger/journal without creating a payment intent. Retain it as a compatibility facade while migrating to canonical receipt/allocation identity, preserving reference and financial behavior.

## 9. Refunds, credit notes, and reversals

Distinguish: (1) refund request; (2) finance approval; (3) external provider refund; (4) credit note correcting receivable; (5) invoice adjustment; (6) payment reversal/chargeback; (7) accounting reversal. They have separate IDs, statuses and evidence.

Current finalizeRefund mutates original invoice totals/paid and posts credit/payout journals plus a refund ledger row. Target history leaves the issued invoice snapshot intact and adds a separate credit note/adjustment linked to original invoice and refund. Preserve existing refund IDs/provider references and existing journal sources. Do not backfill a credit note as fact where none existed. Reversing posted accounting is a new balanced journal referencing the original.

Refund states: requested → approved → processing → succeeded/failed; requested → rejected/cancelled; processing → manual review → succeeded/failed. Provider result is immutable evidence; retry is idempotent. Credit note: draft → approved → issued → applied, or rejected/voided before issue. Issued credit is immutable; reversal requires a linked debit/reversal record and journal.

## 10. Quotes, contracts, and acceptance

Authority paths:

- **Path A — Existing agreement:** Existing Master Contract / Contract Version → Quote / Quote Version → Customer Acceptance → Order.
- **Path B — Quote-originated agreement:** Quote / Quote Version → Customer Acceptance → Contract / Contract Version → Order.

These paths are not contradictory: an existing agreement may govern a quote, or an accepted quote may originate the agreement. An Order cannot become commercially effective until the required contractual authority and customer acceptance requirements for the applicable commercial path have been satisfied. ALTIL's actual production path remains **UNKNOWN / REQUIRES EVIDENCE**. Each quote version freezes parties, account/legal entity, scope, product/price versions, quantities, currency, terms, tax assumptions, validity and referenced documents. Acceptance records the exact version, authorized actor/authority, method, timestamp and evidence/hash. Contract and quote versions remain immutable after issue/execution/acceptance as applicable; amendments append versions with predecessor and effective date. Expiry, withdrawal and rejection are explicit transitions.

Acceptance is idempotent on exact version + actor/evidence/action key; retries cannot create duplicate orders. Legal evidence is role-scoped; audit references/hashes instead of unnecessary personal data. Tenant existence, UI display fields, and order source metadata are not signed-contract or acceptance evidence. No first-class quote/contract lifecycle was found in inspected source/schema.

## 11. Provisioning and Trust Fabric

Provisioning chain: Contract/Order → Subscription → Entitlement → Provisioning Job → User/Application/API Consumer mapping → credential reference → runtime policy binding. Commercial scope and technical tenancy are separate; explicit mappings connect them. Existing IAM authentication and tenant isolation remain mandatory.

Jobs are idempotent by entitlement version + runtime target + desired-state action; persist attempts/results/external IDs. Retries do not duplicate credentials/resources. Revocation/suspension creates a new desired state; compensate where possible, otherwise record remediation. Never place provider or API secrets in commercial/audit records.

Trust path: Organisation → Legal Entity → Contract → Policy → User/Application → Identity → Credential → Request → Data Classification → AI Provider/Model → Response. At policy evaluation, the active entitlement supplies service scope/limits and effective dates; it does not bypass identity, tenant isolation, classification, model/provider constraints, or trust controls. Correlate commercial source, entitlement, identity/consumer, policy decision, request ID, usage, rating, invoice, journal and audit. Fail closed for missing/expired commercial entitlement where the operation requires a paid grant; preserve explicitly authorized platform/admin paths.

## 12. Currency, tax, and FX semantics

| Currency concept | Required meaning |
|---|---|
| Product/price | Currency of a versioned offer. |
| Contract | Agreed denomination; explicit if different from account defaults. |
| Order | Accepted document/line currency; mixed currency only under explicit policy. |
| Invoice | Posted receivable currency; issued values immutable. |
| Payment | Provider collection currency; direct allocation requires match unless converted explicitly. |
| Settlement | Provider/bank payout currency with its own evidence. |
| Provider cost | Original provider cost amount/currency retained before markup/conversion. |
| Display | Presentation preference only; never changes posted values. |
| FX | Versioned direction, source, effective/observed timestamps, precision and rounding. Converted record retains exact rate ID and result. |

Platform currency setting is not transaction currency. Never sum unlike currencies. FX revaluation, realized/unrealized gain, and settlement FX difference are deferred until production evidence and finance policy establish need.

Tax must support effective-dated jurisdiction, seller/customer registrations, tax code/rate, inclusive/exclusive mode, line base, rounding, decision source/version and issued result evidence. Issued invoice records applied decision. Tax amount alone does not prove tax determination. Tax owners approve supported jurisdictions/rules; automation beyond required foundations is deferred.

## 13. Idempotency and event lineage

| Operation | Required key/evidence | Current weakness established by source |
|---|---|---|
| Quote acceptance | Exact quote version + scoped command/evidence ID | No current quote acceptance path found. |
| Order creation | Customer/tenant scope + client operation key/source reference | Ordinary route supplies no duplicate source reference. |
| Subscription activation | Accepted order line/version + service scope | No order-driven subscription path shown. |
| Provisioning | Entitlement version + target + action | Durable commercial provisioning workflow not shown. |
| Usage ingestion | Source namespace + event/request ID | Writer catches/logs insert failure; verify durable unique constraint before replay. |
| Rating | Event + price/rating version | No general persisted versioned rating run shown. |
| Charge | Unique rating/fixed obligation source | No general charge model shown. |
| Invoice generation | Account + period/run + unique obligation set | License cycle has a tenant/period check, not universal charge claiming. |
| Payment creation | Client operation + purpose/invoice | Preserve existing provider external reference. |
| Capture | Intent + provider event/operation ID | Provider event record follows side effects, allowing a concurrent retry window. |
| Allocation | Payment/credit + invoice + command; separate reversal key | No allocation entity in current path. |
| Refund | Refund request ID/provider idempotency key | Stripe uses refund ID; provider workflows differ and partial effects need reconciliation. |
| Recon import | Provider + statement + stable row identity | No demonstrated duplicate statement guard. |
| Recon match | Item + payment intent + match command | Preserve match/reversal history. |
| Settlement | Provider settlement/batch + item | Journal source key helps per item; batch may partially complete. |
| Journal | Source type + stable source ID | postJournal already checks source pair and balanced lines. |
| Webhook | Provider + event ID, durable processing state | Event inserted after side effects; PayFast cancellation branch shown as in-memory only. |

Database transaction rollback cannot reverse a provider-side charge/refund. Persist external effect evidence and safely reconcile. For multi-step operations, recover by stable operation key and status, not by issuing another provider side effect blindly.

## 14. State machines

Every transition requires authorization, actor/service identity, effective time, reason and correlation. Invalid transitions conflict without rewriting posted history.

| Aggregate | Valid transitions | Terminal/reversal rule |
|---|---|---|
| Quote | draft → review → approved → issued → accepted/rejected; issued → expired/withdrawn | Terminal per version; changes require a new version. |
| Contract | draft → review → executed/active → expired/terminated; permitted active → suspended → active | Executed history retained; termination does not erase versions. |
| Order | draft → submitted → accepted → processing → partially fulfilled/fulfilled; accepted/processing → cancelled under policy; submitted → rejected | Amendment is a new version; cancellation retains history. |
| Subscription | pending → active → suspended → active; active → cancellation pending → cancelled; active → expired | New renewal/version for future service; prior periods immutable. |
| Entitlement | pending → active → suspended → active; active/suspended → revoked/expired | Reinstatement is a new grant/event. |
| Provisioning | queued → running → succeeded; running → retryable failure → queued; → permanent failure; → cancelled; succeeded → compensated | Attempts retained; compensation is a new operation. |
| Invoice | draft → issued → partial → paid; issued/partial → overdue; draft → void | Issued content immutable; balances derive from payment/credit activity. |
| Payment | created → pending → authorized → succeeded; pending/authorized → failed/cancelled; succeeded → partial refund/refunded/reversed/disputed when evidenced | Provider event history immutable; each retry is same operation or explicit new attempt. |
| Refund | requested → approved → processing → succeeded/failed; requested → rejected/cancelled; processing → manual review → succeeded/failed | Succeeded remains historical fact; correction is a new linked event. |
| Credit note | draft → approved → issued → applied; draft/approved → rejected/voided | Issued credit immutable; reversal is linked new document/journal. |
| Reconciliation batch | imported → review/exceptions/matched → settling → settled → closed | Reopen only with auditable reversal/accounting treatment. |
| Settlement | expected → partial/settled/exception → reversed when evidence supports | Preserve statement/provider proof; post reversing journals for corrections. |

## 15. API compatibility

Keep current /api/v1/billing/* routes as stable facades over canonical domain services. Add relationships additively only after deployed consumer inventory and contract review. Preserve IDs, invoice numbers, field names, status meaning, authorization scope and webhook acknowledgements. Avoid indefinite dual-write; prefer canonical writes behind legacy routes and bounded dual-read reconciliation.

| Route family | Target treatment |
|---|---|
| /billing/products* | Remain catalogue facade; stable product IDs/SKUs; optionally expose version reference. |
| /billing/orders* | Remain list/create/cancel facade. Do not reinterpret existing POST as legal acceptance. Add explicit accepted order transitions separately. |
| /billing/invoices*, /billing/cycles/run | Remain invoice and legacy license-cycle facades; preserve IDs/numbers/status; add lineage only where known. |
| /billing/payments*, /billing/payment-methods*, /billing/schedules* | Remain payment/method/collection facades; distinguish schedule, subscription, payment and allocation. |
| /billing/refunds* | Retain request/approve/confirm; add credit-note linkage without redefining provider completion. |
| /billing/reconciliation* | Retain import/match/settle; preserve batch/item IDs and evidence. |
| /billing/ledger*, /billing/accounting/* | Keep one ledger/subledger engine; posted journals immutable. |
| Stripe/PayFast/iKhokha callbacks | Preserve URLs, verification and acknowledgement behavior; add durable processing state safely. |
| Licensing routes | Retain while mapping licenses to subscriptions/entitlements; do not disable gateway enforcement before parity. |
| Usage/orchestration APIs | Preserve runtime payload and authorization; add attribution/rating links without charging replay twice. |

Update OpenAPI with actual contracts during future authorized stages. UI hiding is not an authorization control.

## 16. UI architecture

One Finance workspace with contextual sections: Overview; Customers & Accounts; Catalogue & Pricing; Quotes & Contracts; Orders & Subscriptions; Usage & Charges; Invoices / Payments / Credits; Reconciliation / Accounting; Reports. Extend Customer 360; keep customer self-service in Tenant Portal. Do not add top-level menu entries per entity.

| Existing view | Target placement / responsibility |
|---|---|
| FinanceCommerceView | Catalogue and Orders; preserve product and order workflows. |
| BillingAdminView | Invoices, payments and credits; retain draft/issue/manual receipt and ledger actions. |
| FinOpsView | Usage and Charges analysis; retain provider cost/budget view and add rated-charge drill-through when supported. |
| AccountingControlView | Reconciliation/accounting/refund controls; retain journal/import/match/settle flows. |
| LicensingMonetizationView | Subscription/legacy licensing context; preserve license enforcement administration until verified migration. |
| Tenant360View | Extend selected-customer context for org, service, usage, orders, billing, identity and audit. |
| CustomersView | Remain directory/onboarding entry linked to Customer 360. |
| OrgHierarchyView | Remain org tree; visually distinguish commercial org from technical tenant. |
| TenantPortalView | Remain tenant/account-scoped self-service using the same domain APIs with strict authorization. |

Preserve deep links and old navigation IDs as aliases during consolidation. Admin and portal use shared services but distinct server-enforced scopes.

## 17. Conceptual migration strategy

No SQL or concrete migrations are specified. Any future plan requires reviewed production evidence and separate approval.

1. Freeze a read-only production baseline: identity, release, migration IDs/checksums, schema, counts/statuses, relationship checks, duplicates/orphans, currency-separated financial totals.
2. Create a mapping inventory classifying each link as deterministic, ambiguous, absent, inaccessible, or unqueried. Keep raw evidence restricted and pseudonymize shared references.
3. Preserve all existing IDs; add reversible references. Never recycle invoice/payment/journal/provider IDs.
4. Expand additively only after model/compatibility approval. Existing reads/writes remain operational.
5. Backfill in dependency order: party/account mapping; products/price snapshots; accepted terms; orders/subscriptions/entitlements; usage/rating/charges; invoice lineage; payments/allocations/refunds/credits; reconciliation/settlement; journal correlation. Stop at unresolved relationships.
6. Preserve orphans/duplicates as exceptions. Do not repair production records or infer missing relationships as part of a backfill.
7. Reconcile invoice, payment, refund, allocation, settlement, ledger and journal totals by currency/status. Explain every difference; never combine currencies.
8. Rehearse on sanitized non-production evidence; verify retry/failure behavior and API/auth compatibility. Avoid unsafe dual writes.
9. Define per-stage feature gate, rollback/forward-recovery path, and external provider reconciliation. A database rollback cannot undo provider effects.
10. Retire legacy writes only after consumer inventory, agreed billing-cycle parity, read verification, finance/security approval and rollback rehearsal. Keep history readable.

## 18. Future implementation stages

These are sequencing options only. No stage starts under this document. Each stage has its own authorization gate.

| Stage | Dependencies and objects | Risk / rollback boundary | Verification |
|---|---|---|---|
| A — Party/account foundation | Production mapping; tenants, applications, customer/org/legal entity/account | Incorrect tenant conflation; revert mapping only, never alter tenant IDs | Approved mapping; unresolved records explicit; existing auth unchanged |
| B — Quotes/contracts | Legal/finance terms; product/price and order | False acceptance/wrong party; disable new workflow, preserve current orders | Frozen versions, actor evidence, expiry/amendment and retry tests |
| C — Subscription/entitlement | B and service scope; tenant_licenses, order lines, apps/API consumers | Duplicate grant/service loss; feature-gated legacy fallback | License parity, no duplicate grants, policy and revocation evidence |
| D — Usage/rating/charges | Source/price/markup approval; tenant_key_usage, FinOps | Double bill or lost usage; disable new rating while retaining raw events | Replay/rerate idempotency, cost-to-charge reconciliation, immutable correction |
| E — Invoice lineage | D and fixed obligation policy; invoices, ledger, billing cycles | Duplicate invoice or historic mutation | Every new line has source; per-currency AR/journal parity; IDs unchanged |
| F — Allocation/credits | Payment policy; intents, invoices, refunds, ledger, journals | Cash misallocation/provider duplicate; reverse allocations, reconcile external cash | Partial/split/unapplied cases; refund/credit reversals balanced/idempotent |
| G — Provisioning/runtime | C and identity mapping; IAM/apps/keys/policy/audit | Unauthorized access/service interruption; staged gate and legacy fallback | Identity+entitlement+policy matrix, retry/compensation, audit/no secret exposure |
| H — Settlement/account lineage | Production settlement requirements; recon items, intents, journals | Partial posting; recover item by stable source and reconcile provider | Statement→payment→settlement→journal proof; each currency balanced |
| I — UI consolidation | API parity and permission matrix; listed views/sidebar/app routing | Lost workflows/access regression; restore aliases/navigation | Deep links, roles/scopes, portal parity, no duplicate actions |
| J — Legacy retirement | All prior parity, consumer inventory and explicit approval | Hidden consumers or irreversible cutover | Approved deprecation, preserved reads, rollback rehearsal, stakeholder signoff |

### Conceptual roadmap to detailed implementation workstreams

The A–J sequence above remains the conceptual/north-star architecture roadmap. The detailed Stage A–F documents are the current implementation workstream decomposition; they consolidate some architecture roadmap concerns for delivery. This decomposition does not invalidate, replace, or delete the conceptual A–J architecture.

| Architecture roadmap concern | Detailed implementation workstream |
|---|---|
| Architecture A — Party/account foundation | Implementation A |
| Architecture B — Quotes/contracts | Implementation B |
| Architecture C — Subscription/entitlement | Implementation C |
| Architecture D — Usage/rating/charges | Implementation D |
| Architecture E — Invoice lineage | Implementation E |
| Architecture F/G — Allocation/credits and provisioning/runtime, respectively | Implementation E for allocation/credits; Implementation D for provisioning/runtime integration |
| Architecture H — Settlement/account lineage | Implementation E |
| Architecture I — UI consolidation | Implementation F |
| Architecture J — Legacy retirement | Cross-stage final integration/hardening after prior workstreams and explicit approval |

## 19. Explicitly deferred

Do not implement solely because the target model mentions it:

- ERP/GL integration without a named destination, owner and reconciliation requirement.
- Tax automation beyond approved jurisdictions and required foundations.
- FX revaluation, hedging, or complex multi-currency settlement accounting absent evidence and finance policy.
- Advanced proration before contractual, rounding, period and accounting rules are agreed.
- Chargeback automation without provider evidence and operational ownership.
- Marketplace settlement without a marketplace model.
- Automated contract generation without legal ownership/templates.
- Separate top-level UI menu for every entity.
- Replacement of Stripe, PayFast, or iKhokha absent a separately evidenced need.
- Duplicate raw usage store before verifying tenant_key_usage authority and retention.
- Generic workflow engines, extra settlement masters, cost centres, broad customer tables, or tax structures without evidenced requirements.

## 20. Final architectural rules

1. Existing financial history is immutable.
2. Existing financial IDs are preserved.
3. No parallel billing/payment/reconciliation/accounting systems.
4. Commercial tenancy is separate from technical tenancy.
5. Accepted contracts and posted financial records are versioned and immutable.
6. Usage is attributable and auditable.
7. Rating is deterministic and idempotent.
8. Charges have explicit lineage.
9. Every invoice line has explainable provenance; legacy exceptions are identified, not guessed.
10. Every payment has auditable allocation or explicit unapplied-cash state.
11. Every entitlement has commercial authority.
12. Every runtime commercial action traces to identity and policy.
13. Provider webhooks are safely retryable and deduplicated.
14. External provider effects are distinct from database rollback.
15. No production change without explicit approval and evidence gates.
16. Missing/empty/inaccessible/unqueried evidence is never proof of absence.
17. No Phase 4 implementation until a separate explicit implementation instruction authorizes it.
