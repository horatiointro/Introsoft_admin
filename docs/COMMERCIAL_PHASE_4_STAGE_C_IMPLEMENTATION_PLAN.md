# ALTIL Phase 4 Stage C — Orders, Subscriptions and Entitlements

**Status:** Documentation and implementation-readiness plan only.
**Architecture authority:** [Phase 4 Architecture Specification](./COMMERCIAL_PHASE_4_ARCHITECTURE_SPEC.md).
**Dependencies:** Approved Stage A party/account mappings and Stage B accepted commercial authority; neither is inferred from technical tenant/order identity.
**Authorization:** This plan does not authorize implementation.

## 1. Purpose and current evidence

Stage C begins after the applicable Path A or Path B commercial authority and customer acceptance requirements defined in the Architecture Specification §10 and Stage B §§1 and 5 have been satisfied. It defines the subsequent linkage:

Qualified commercial authority → Order → Order Version/Amendment → Subscription → Entitlement

The actual production path remains UNKNOWN / REQUIRES EVIDENCE; this plan does not infer whether ALTIL uses an existing agreement or a quote-originated agreement.

The accepted architecture is authoritative. Current source has `billing_orders` and `billing_order_lines`, plus tenant licenses/plans and runtime license enforcement. Source inspection shows order create/cancel, but no inspected path turns recurring order lines into subscriptions or entitlements. The separate license billing-cycle endpoint reads `tenant_licenses`; the payment scheduler reads `billing_schedules`. They are distinct mechanisms.

Production snapshot: one active order for technical tenant `tenant-altil-internal`, total ZAR 85; one active recurring `user_month` line for `prod-ai-seat`, quantity one at ZAR 85. These facts do not establish customer, organisation, legal entity, billing account, accepted quote/contract, legal acceptance, subscription, entitlement, provisioned application, or payer. Production technical relationships/FKs remain unqueried. Preserve the order and line as captured; do not derive commercial mappings from them.

## 2. Current state and target responsibilities

| Object | Current source fact | Stage C target |
|---|---|---|
| `billing_orders` | Migration 023 stores stable order ID/number, tenant scope, status, currency/totals, source/reference and JSON payload. `createBillingOrderRecord` writes order and lines transactionally. Cancellation marks order cancelled and deactivates lines. | Preserve order identity; link accepted quote/contract and account only when verified. Add version/amendment history without overwriting accepted state. |
| `billing_order_lines` | Stores order/tenant/product IDs, quantity, unit price, currency, recurring, billing unit, active and payload. Product recurrence is copied into the line. | Keep line IDs and existing snapshots. Treat recurring metadata as source for a reviewed subscription proposal, not proof of an existing subscription. |
| `tenant_licenses` / `licensing_plans` | License and plan records gate runtime requests; source has tenant/plan relationships and billing cycle behavior. | Preserve as legacy entitlement/enforcement projection until canonical subscriptions/entitlements prove parity. |
| `tenant_applications` / `tenant_api_keys` | Technical app/consumer and credential relationships are tenant-scoped. | Bind entitlements to explicit approved application/API-consumer scopes without replacing tenant isolation or credentials. |
| `billing_invoices` | Existing invoice register; not generated from order lines in inspected order route. | Remain the only invoice core. Stage C creates no invoice engine; invoice lineage occurs in later stage. |

## 3. Authoritative order acceptance and subscription lifecycle

### Authority chain

1. Stage B records accepted quote/contract version and verified customer acceptance.
2. An authorized commercial operation creates/submits an order referencing the accepted version and approved Stage A billing context.
3. Acceptance of the order (if distinct from quote/contract acceptance under approved policy) freezes order header/line snapshots and records the actor/evidence.
4. Each eligible recurring/term line creates a subscription version using deterministic source references.
5. An effective subscription version produces entitlement grants; runtime provisioning is **Stage D — Provisioning, Usage, Rating and Charges** responsibility and must succeed before access is claimed as provisioned. The architecture-level roadmap places provisioning under G; the detailed delivery decomposition consolidates that work into implementation Stage D.

A recurring product line in `billing_order_lines` is not itself a subscription, entitlement, first invoice, or permission. The existing production line’s recurring=true is a known product/order snapshot only; no subscription may be inferred from it.

### Order and amendment states

Draft → submitted → accepted → processing → partially fulfilled/fulfilled. Submitted may be rejected; accepted/processing may be cancelled only under approved notice/financial policy. A change to accepted quantity, scope, price, product, term, currency or service dates creates an Order Version/Amendment with predecessor, reason, actor/acceptance, effective time and immutable before/after snapshot. Draft edits are audited; accepted versions are never overwritten.

### Subscription states

Pending → active → suspended → active; active → cancellation pending → cancelled; active → expired. Activation requires accepted source line and its service start/effective date plus defined approval/preconditions. Suspension reason and effective time are explicit; it is distinct from payment failure, schedule pause, provider subscription state or tenant status. Renewal creates a new accepted period/version. Expiry is time-driven from stored terms. Cancelled/expired periods remain historical; reinstatement or renewal creates a new version/event.

### Entitlement states

Pending → active → suspended → active; active/suspended → revoked or expired. Entitlement is an effective grant with service scope, limits, target technical tenant/application/API consumer, source subscription/order/contract version, validity and revocation reason. Changes append entitlement events/versions. It is not an IAM role, API key, customer record, or invoice status.

## 4. Effective dates, snapshots and billing behavior

Keep distinct quote/contract acceptance time, order acceptance time, service start/end, subscription period, billing anchor, renewal/notice time, entitlement effective time, and event-recorded time. Legal/Finance approve timezone, date precision and precedence. Do not use database insert time as contractual effective date without authorization.

Each order version/line and subscription version freezes product/price version, quantity, currency, billing unit, recurring cadence, scope/limits, source acceptance, service period and agreed terms. Current `billing_products` price is not retroactive. Product ID and line ID remain stable; amendments create new versions/lines or explicit version records, not mutation of already accepted/billed history.

Do not implement proration until policy defines interval calculation, rounding, taxes, credits and journal effects. A charge/invoice for a fixed recurring period is later-stage behavior; Stage C only establishes the obligation/subscription facts. `billing_schedules` remains collection configuration, not a source of subscription terms. `/api/v1/billing/cycles/run` remains the distinct legacy license cycle until a separately approved migration proves parity.

## 5. Technical tenant, customer and runtime scope

Preserve `tenant ≠ customer ≠ organisation ≠ legal entity ≠ billing account`. An order’s `tenant_id` is technical ownership/scope as recorded; it is not proof of commercial counterparty. Stage A’s explicit approved map supplies any customer/account context. Keep existing tenant/application/key/license identifiers and references exactly as they are.

Subscription scope maps explicitly to one or more approved technical applications/API consumers. Do not infer an application from tenant membership or a key from count. A credential never becomes an entitlement. At runtime, authentication and tenant isolation remain required; entitlement is an additional policy input, not a replacement authorization mechanism. If the subscription does not identify allowed technical scope deterministically, leave it pending and request owner resolution.

Provisioning prerequisite: Stage C may persist desired subscription/entitlement state, but user/application/API-consumer provisioning and policy application belong to **Stage D — Provisioning, Usage, Rating and Charges**. The architecture-level roadmap calls provisioning part of G; the detailed delivery plan consolidates that work into implementation Stage D. Do not claim runtime access has changed until the provisioning operation is separately implemented, verified and authorized.

## 6. Identifiers, audit and idempotency

- Preserve existing production order/order-line IDs, order number, product IDs and all license/plan/application/API-key IDs and references. No ID regeneration or guessed link.
- New subscription/entitlement/version IDs are stable opaque IDs with source references; never encode names, email, tenant identifiers or secrets.
- Order creation idempotency: scoped operation key/source reference plus accepted source version. Current ordinary order route does not supply a source reference; retries could create another order.
- Subscription creation: unique logical source = accepted order line/version + service scope + term. Retry returns existing subscription/version.
- Entitlement grant: unique source subscription version + technical target + entitlement scope/effective interval. Reconcile changes by events rather than duplicate grants.
- Amendment/cancel/renewal commands carry distinct idempotency keys and exact predecessor version. Effective backdated changes require approval evidence.
- Audit records actor/service identity, role/authority decision, tenant and commercial source IDs, prior/new status/version, reason, effective time, correlation/request ID, outcome and provisioning reference. Do not log secrets or unnecessary personal data.
- Existing audit schema's adequacy and production coverage remain subject to Stage A preflight; do not assume JSON audit payloads satisfy consistent immutable evidence.

## 7. API compatibility

Keep `/api/v1/billing/orders*`, `/api/v1/billing/products*`, `/api/v1/licensing/*`, `/api/v1/billing/invoices*`, application and API-key routes. Do not remove, rename or change existing semantics.

| API family | Compatibility handling |
|---|---|
| `/billing/orders` create/list/cancel | Remains a facade over current order behavior. Do not reinterpret create as legal acceptance, order acceptance, subscription activation or provisioning. Add optional source-version links only through separately versioned/additive contracts. |
| `/billing/products` | Preserve IDs/SKUs/current fields. A price-version reference may be additive; existing price fields are not rewritten. |
| `/licensing/plans`, `/licensing/tenant-licenses` and license webhook/gateway checks | Preserve legacy license enforcement until verified canonical parity and explicit cutover approval. |
| `/billing/invoices*`, `/billing/cycles/run` | Preserve invoice IDs/payload/status and license-cycle semantics. No order-driven invoice behavior is silently added in Stage C. |
| `/applications*`, `/api-keys*` | Preserve technical tenant/application/key scope; commercial entitlement cannot expand route visibility. |

Consumers may assume `billing_orders.status=active` means accepted/fulfilled, or `recurring=true` means subscription exists. Preserve fields but document current meaning and avoid changing behavior until consumers are inventoried. Server authorization must validate the existing tenant plus separately approved commercial links; never trust a submitted account/tenant relationship.

## 8. Migration, backfill and rollback strategy

No SQL, migration or backfill is specified. Before implementation, require externally collected Stage A evidence: live production schema/FKs/indexes, tenant/app/key/license/plan and order/line/product relationship counts, orphan/duplicate checks, customer/account structures, JSON key aggregates, exact production release, and owner-approved contract/acceptance data. Existing Stage A baseline classifies relevant live relationships as UNQUERIED; do not fill those from migration definitions or counts.

If separately authorized:

1. Reconcile production schema against migration source; do not rerun migrations or seed behavior for inspection.
2. Add only approved nullable/additive source/version/subscription/entitlement references or equivalent structures; preserve all current IDs, typed values and JSON history.
3. Preserve deterministic technical references exactly as recorded. Commercial links require independent deterministic customer/account authority and owner approval; do not create party records from `tenant-altil-internal` or from its known order/product relation.
4. Backfill only accepted source lines and verified authority. Existing production order and line may be considered for a future mapping only after relationship checks and commercial-party evidence; recurring metadata alone is insufficient. Unresolved rows stay explicitly unresolved.
5. Keep current orders, licenses, invoices and gateway authorization as legacy projections/facades during parity. Avoid dual-write without durable idempotency and recovery.
6. In non-production rehearsal, prove transition and replay behavior. Compare counts, IDs, prices/currencies, license enforcement and entitlement projection. No historical financial amount may change.
7. Roll back by disabling new subscription/entitlement reads/writes before cutover; preserve accepted order/version/effect history and use forward corrections after dependent runtime grants. Revoke runtime grants only through authorized compensating operations. A DB rollback cannot undo customer communication or runtime effects.

## 9. Evidence gates before implementation

- Accepted Stage A evidence with all implementation-critical blockers resolved by external operator evidence; no identity inferred from tenant labels.
- Accepted Stage B quote/contract/acceptance model, authority rules and effective-date policy.
- Production inventory of orders, lines, products, licenses/plans and any subscriptions/entitlements found; exact relationship/FK/index/nullability checks and orphans/duplicates.
- Production aggregate order status/currency and stable ID counts; no row-level PII. Confirm the known ZAR order/line only as a captured snapshot, not a complete or current guarantee.
- Existing API consumers, jobs and deployment release mapping; determine which source paths are deployed without claiming use from code alone.
- Finance/legal approval for activation, amendment, cancellation, renewal, suspension, term and proration behavior.
- Security approval for customer-to-tenant, application/API consumer mappings and entitlement policy enforcement.
- Audit fields, idempotency constraints, failure/retry behavior and rollback verified in sanitized non-production rehearsal.

## 10. Acceptance criteria

- Existing production order, order-line, product, tenant, application, API-key, license and plan IDs/references remain unchanged.
- No commercial customer/account/contract is inferred from tenant or order attribution.
- Each new subscription is traceable to an accepted immutable quote/contract/order-line version and approved technical scope.
- Each entitlement has explicit authority, version, limits, effective interval, technical target and audit evidence.
- Recurring order metadata alone cannot activate a subscription, issue an invoice or grant runtime access.
- License enforcement and existing billing APIs remain behaviorally compatible until a separately approved cutover.
- Retries cannot duplicate order acceptance, subscription versions or entitlement grants; amendments preserve old state.
- Tenant isolation, identity, policy and application/key authorization are not weakened.
- Unknown/unqueried production relationships remain unresolved; no guessed backfill exists.
- Finance, Legal, Commercial, Security and technical tenant owners accept lifecycle and evidence; post-change read-only reconciliation shows no unintended financial changes.

## 11. Explicit non-goals

Stage C does not implement Stage A/B; provisioning execution; usage ingestion/rating/charges; invoice generation/redesign; payment allocation; refunds/credit notes; settlement/accounting redesign; proration automation; tax/FX automation; provider integration changes; UI consolidation; or legacy license retirement. It does not assert that the existing production order already has a subscription, contract, entitlement, or payer.

## 12. Authorization boundary

This Stage C plan is documentation and implementation-readiness analysis only. It does not authorize schema changes, migrations, data changes, application changes, API changes, UI changes, runtime provisioning, or production changes. Implementation requires separate explicit authorization after review, required external evidence, and acceptance of this plan.
