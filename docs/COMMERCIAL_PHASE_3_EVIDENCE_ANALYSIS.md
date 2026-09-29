# ALTIL Commercial Platform — Phase 3 Evidence Analysis

**Status:** Phase 3 evidence synthesis; read-only source inspection plus production evidence supplied for this analysis.  
**Phase gate:** Phase 4 implementation has not started and is not authorized by this document.  
**Evidence boundary:** Production facts below are limited to values explicitly present in the supplied evidence. The repository's [Phase 3 validation](./COMMERCIAL_PHASE_3_VALIDATION.md) describes a loopback simulator/test database and is not production evidence. Do not transfer its counts or database version to production.

## 1. Production-verified facts

The production evidence establishes that the production database has **61 tables** and **23 applied migrations**. The evidence supplied for this synthesis does not state the production database name, engine/version, individual production table counts, or the production distributions/relationship results listed below. These are **unknown from the evidence available here**, not zero and not evidence that a feature is unused.

| Evidence category | Production finding available for this synthesis |
|---|---|
| Database identity and engine/version | Not stated in the supplied production evidence available here. The loopback workspace result of MariaDB/MySQL `9.5.0` must not be attributed to production. |
| Applied migrations | 23 applied migrations, as reported for production. Exact migration IDs/checksums are not present here. |
| Table inventory | 61 production tables. Per-table inventory and names are not present here. |
| Orders, lines, products | Production row counts, statuses, product references, and order-to-invoice lineage are not stated here. |
| Usage | Production counts, statuses, duplicate/idempotency findings, and usage-to-charge/invoice lineage are not stated here. |
| Invoices and payments | Production counts/statuses, payment references, invoice links, allocations, and external execution evidence are not stated here. |
| Provider activity | Production provider-event and webhook counts/statuses for Stripe, PayFast, iKhokha, or other providers are not stated here. |
| Refunds | Production count/status and provider-confirmation evidence are not stated here. |
| Reconciliation and settlement | Production batch/item counts, statuses, matched payment links, and settled batches are not stated here. |
| Accounting | Production journal/line counts, balance results, and commercial source lineage are not stated here. |
| Currency and FX | Production currency distribution, configured currencies, transaction/settlement currencies, and FX relationships are not stated here. |

The previous workspace validation found 67 tables, 23 migrations, and simulator-marked commercial records on a loopback database. Those are workspace observations only. They are intentionally excluded from production conclusions.

## 2. Source-verified implementation behaviour

These statements describe repository code paths, not proof that those paths or versions are deployed or exercised in production.

| Area | Actual source behaviour |
|---|---|
| Order creation and cancellation | `createBillingOrderRecord` in `server.ts` validates tenant, active products, quantities, and currency; snapshots product values into order lines; and inserts `billing_orders` plus `billing_order_lines` transactionally. `POST /api/v1/billing/orders` invokes it. `PATCH /api/v1/billing/orders/:id` cancels an order and deactivates its lines. Ordinary UI order creation supplies no source reference for duplicate protection. [`server.ts:607`](../server.ts#L607) [`server.ts:3277`](../server.ts#L3277) [`server.ts:3279`](../server.ts#L3279) |
| Invoice creation and issue | `POST /api/v1/billing/invoices` creates a draft from caller-provided lines. It does not derive the invoice from an order. `POST /api/v1/billing/invoices/:id/issue` issues a draft, persists it, and invokes `postJournal` for invoice revenue, receivables, and any tax amount. [`server.ts:3289`](../server.ts#L3289) [`server.ts:3317`](../server.ts#L3317) |
| Licensing billing cycle | `POST /api/v1/billing/cycles/run` selects due tenant licenses and creates draft invoice records, with a tenant/period duplicate check. This is separate from orders. It is an HTTP-triggered cycle operation. [`server.ts:3215`](../server.ts#L3215) |
| Recurring billing scheduler | `runBillingCollections()` executes at startup and on a five-minute interval. It reads active schedules and methods. This scheduler is distinct from the licensing cycle endpoint. [`server.ts:3111`](../server.ts#L3111) [`server.ts:8394`](../server.ts#L8394) |
| Schedule creation and lifecycle | `POST /api/v1/billing/schedules` requires explicit consent and an active saved method; `GET` and `PATCH` support listing and active/paused/cancelled states. `TenantPortalView` calls these endpoints. No order path automatically creates a schedule. [`server.ts:3167`](../server.ts#L3167) [`TenantPortalView.tsx:239`](../src/components/TenantPortalView.tsx#L239) |
| Monthly schedule behaviour | The scheduler selects an existing eligible unpaid invoice for collection. When no invoice is available, it advances the schedule rather than generating an invoice from an order. |
| Usage recording | `recordKeyUsage` writes `tenant_key_usage` and updates an in-memory mirror. The API metering path computes estimated usage cost and license quota/overage values before recording. The insert catches/logs errors, so a request may succeed without durable usage evidence. [`server.ts:669`](../server.ts#L669) [`server.ts:7657`](../server.ts#L7657) |
| Usage threshold billing | The schedule worker sums successful USD usage for the cycle. At threshold, it reuses or creates an issued usage invoice, posts an invoice journal, creates a payment intent and attempts collection. This produces aggregated usage billing in that path; the source does not show a general rating-run/charge ledger linking individual events to invoice lines. |
| Payment intents and capture | An intent has one optional invoice ID. `capturePaymentIntent` requires the invoice, rejects capture above its balance, updates invoice paid/status, writes a ledger entry, posts a capture journal, and updates the intent. Multiple partial captures can be attempted against the remaining invoice balance; one intent cannot allocate to multiple invoices. These writes are not one encompassing transaction. [`server.ts:627`](../server.ts#L627) [`server.ts:3093`](../server.ts#L3093) |
| Payment methods | Provider-vaulted tokens and display/mandate metadata are stored through payment-method helpers. Revocation changes method status and pauses associated schedules. [`paymentGateways.ts:44`](../src/utils/paymentGateways.ts#L44) [`server.ts:3155`](../server.ts#L3155) |
| Stripe | The webhook validates signatures, checks event IDs, and processes checkout, subscription, setup, and invoice-paid branches. Successful invoice payment can update license state and create a local invoice/journal. Provider event insertion follows side effects, so concurrent/retried processing has a window before the dedupe record is stored. Errors can return 503. [`server.ts:2961`](../server.ts#L2961) |
| PayFast | The ITN signature and provider validation are checked. Completed payments can capture the linked intent and record a provider event. The shown cancellation branch changes in-memory intent status without persisting it. Failures return retryable 503. [`server.ts:3177`](../server.ts#L3177) |
| iKhokha | The callback signature, external intent reference, and paylink are checked. Success can capture and record a provider event; failure persists failed intent status. Errors return retryable 503. [`server.ts:3183`](../server.ts#L3183) |
| Refunds | Requests are linked to one succeeded intent and its invoice. Approval calls Stripe/PayFast refund APIs or requires manual iKhokha handling. `finalizeRefund` reduces the original invoice totals/paid amount, posts credit and payout journals, marks the refund succeeded, and writes a refund ledger row. The original invoice is mutated rather than preserved as an immutable credit-note history. [`server.ts:3149`](../server.ts#L3149) [`server.ts:3153`](../server.ts#L3153) |
| Reconciliation | Import creates a batch and items transactionally, with automatic match attempts against succeeded intents by reference, amount, and currency. Manual matching applies corresponding checks. [`server.ts:3205`](../server.ts#L3205) [`server.ts:3211`](../server.ts#L3211) |
| Settlement | Settlement requires no unmatched items. It posts one balanced journal per reconciliation item for bank, fees, and clearing; stores the settlement reference on the intent and marks the batch settled. Per-item journal posting is source-idempotent, but the full batch workflow is not atomic. [`server.ts:3212`](../server.ts#L3212) |
| Accounting journals | `postJournal` validates balanced lines and deduplicates by source type/source ID, then transactionally stores journal header and lines. Invoice issue, capture, manual receipts, refunds, and settlement call it. It is not invoked for every commercial or ledger event. [`server.ts:3055`](../server.ts#L3055) |

The source includes gateway helpers in `src/utils/paymentGateways.ts`. It cannot establish production provider configuration, event volumes, provider acceptance, or deployment status.

## 3. Current implemented commercial lifecycle

```text
Tenant ──> billing product ──> billing order ──> order lines
                                          ╳ no implemented order-to-invoice generation/link

Tenant license ──> licensing billing-cycle endpoint ──> draft invoice ──> issue ──> journal
Stripe subscription event ──> license update / local invoice path ──> journal

Tenant API request ──> tenant_key_usage ──> (aggregated threshold schedule, when active)
                                              └─> usage invoice ──> payment intent ──> capture

Invoice ──> one payment intent ──> capture ──> invoice balance + ledger + journal
                                       └─> provider event record (written after side effects)

Payment intent + invoice ──> refund request ──> provider/manual confirmation
                                             └─> invoice mutation + ledger + journals

Provider statement ──> reconciliation batch/items ──> matched payment intent
                                                   └─> settlement journals + settlement reference
```

**Lineage stops:** An order line does not drive the licensing cycle or schedule; invoices created by the general/manual and license-cycle paths have no demonstrated order-line link. Usage is recorded and used for metering/threshold aggregation, but no general persisted rating-run/charge-to-invoice lineage is shown. A payment intent points to one invoice rather than a separate many-to-many allocation history. Refund finalization mutates the source invoice. Reconciliation has explicit batch/item links and settlement journals, but not a separate settlement master record. Accounting source IDs connect selected events to journals; there is no universal commercial-to-journal lineage.

Production evidence available here does not confirm which of these source paths are deployed, active, or represented by the production rows.

## 4. Confirmed architectural gaps

“Confirmed” below means established by source inspection or explicit production evidence listed above. It does not claim that a production workflow is unused. Production-specific prevalence and mapping remain unknown where production counts/results were not supplied.

| Relationship/domain | Confirmed gap or limitation |
|---|---|
| Customer / Organisation / Legal Entity / Billing Account | Source/schema inspection found tenant-oriented scoping, but no demonstrated canonical commercial hierarchy tying customer, organisation, legal entity, and bill-to account together. Production mappings are not provided. |
| Contract / Quote / Acceptance | The inspected source and migrations do not provide a first-class quote/version/acceptance or contract/version lifecycle. Tenant 360 display fields/fallbacks do not establish persisted signed-contract evidence. |
| Order → Subscription | Order lines preserve product recurrence metadata, but the inspected billing cycle and scheduler do not consume order lines to create subscriptions or recurring invoices. No source linkage is shown. |
| Subscription → Entitlement | Licensing and Stripe subscription paths update tenant licenses, which act as an enforcement projection; there is no demonstrated versioned entitlement ledger sourced from an order/contract subscription. |
| Entitlement → Provisioning | The inspected commercial paths do not show an idempotent order-to-entitlement provisioning job lifecycle. Existing user/application/API-key structures exist, but this commercial linkage is not established. |
| Usage → Rating → Charges | Metering and estimated amounts exist; a separately persisted, repeatable/versioned rating record and charge lineage are not shown. Threshold billing aggregates usage. |
| Charge → Invoice | No general charge-to-invoice relationship is shown. The threshold schedule aggregates usage into an invoice; source does not establish a stable charge allocation for every invoice line. |
| Payment allocation | Payment intent has one invoice pointer; there is no separate allocation history for split, unapplied, or reallocated cash in the inspected implementation/schema. |
| Credit-note/refund history | Refund processing exists, including accounting entries, but finalization mutates the source invoice and no separate first-class credit-note lifecycle is shown. |
| Tax | Invoice tax amount exists and invoice issue can journal it, but normalized jurisdiction, registration, code/rate, and line-level tax decision lineage were not found in inspected schema/source. Production tax behavior is not supplied. |
| Multi-currency semantics | Records carry currencies and provider constraints; portal display preference does not itself revalue posted invoices. A production currency/FX distribution or transaction-level immutable FX lineage is not established by available evidence. |
| Accounting lineage | Balanced journals and selected source references exist. Journaling is not universal across commercial events; ledger adjustments can exist without journals, and source inspection does not show a universal trace from commercial origin through every posting. |
| Commercial-to-runtime identity | Usage rows carry tenant/application/API-key attribution, while the wider contract/order/account identity chain is not connected through the inspected source. Production mappings from commercial parties to runtime consumers are unknown. |

## 5. Existing capabilities to preserve

The current model has real financial and operational capabilities in source. Future design should extend and reconcile these rather than replace them with parallel systems. Whether each has production records is not established by the evidence available here.

- `billing_products`, `billing_orders`, and `billing_order_lines`: catalogue, price snapshots, order register, and cancellation.
- `billing_invoices`: draft/issue and invoice balances.
- `billing_payment_intents` and `billing_payment_methods`: hosted payment, capture, tokenized methods, and provider references.
- `billing_schedules`: consented monthly/threshold schedule configuration and scheduler behavior.
- `billing_refunds`: request, approval/processing, provider confirmation, and accounting effects.
- `billing_reconciliation_batches` / `billing_reconciliation_items`: statement import, matching, exception tracking, and settlement workflow.
- `accounting_journals` / `accounting_journal_lines`: balanced double-entry operational subledger and source idempotency.
- Stripe, PayFast, and iKhokha integrations: hosted checkout/callback paths and provider-specific verification.

## 6. Target lifecycle

The intended target relationship is:

```text
Customer
  → Organisation
  → Legal Entity
  → Billing Account
  → Contract
  → Quote
  → Quote Version
  → Customer Acceptance
  → Order
  → Order Lines
  → Subscription
  → Entitlements
  → Provisioning
  → Users / Applications / API Consumers
  → Usage Events
  → Rating
  → Charges
  → Invoice
  → Payment
  → Payment Allocation
  → Reconciliation
  → Settlement
  → Accounting Subledger
  → ERP/GL Integration
```

This is the requested target lifecycle for design alignment, not a claim that these entities or links currently exist. ERP/GL integration is a target boundary; no production integration evidence was supplied.

## 7. ALTIL trust and commercial relationship

The commercial lifecycle should form an auditable chain through ALTIL's trust architecture:

```text
Contract
 → Subscription
 → Entitlement
 → Identity
 → Policy
 → Data
 → AI
 → Usage
 → Billing
 → Accounting
 → Audit
```

The contract and accepted commercial version define what service is purchased. Subscription and entitlement express the effective service grant. Identity binds that grant to authorized users, applications, and API consumers. Policy controls access and permitted data/AI operations. Runtime usage should retain attributable event evidence, which can be rated under the applicable price version, billed, collected, reconciled, journaled, and audited. Each transition should retain stable source IDs and actor/time evidence so that a financial record can be traced to the commercial authority and runtime consumption that caused it. Current source supports parts of this chain (tenant/API-key usage, license enforcement, invoices, payments, journals, and audit facilities); it does not establish the complete connected chain.

## 8. Phase 4 design gates

Phase 4 must remain blocked until a separate explicit design/implementation instruction is given and these gates are addressed using reviewed production evidence:

1. **Baseline production schema and data:** establish database identity/version, exact migration IDs/checksums, schema inventory, counts, statuses, relationships, duplicates, orphans, and financial totals by currency. Keep unavailable/unqueried/empty evidence distinct.
2. **Exact compatibility strategy:** map existing tenant, license, product/order, invoice, payment, refund, reconciliation, and journal IDs and consumers. Define which route/table remains authoritative during transition.
3. **Additive schema only:** future approved changes must preserve existing records and avoid destructive/rewriting assumptions. No concrete migration is defined here.
4. **Preserve existing financial IDs/history:** retain invoice, payment, refund, reconciliation, settlement-reference, and journal identities; do not infer missing links from matching amounts or dates.
5. **Immutable commercial history:** define correction, amendment, credit, refund, and reversal records without erasing accepted or posted history.
6. **Effective dating/versioning:** define product/price, contract/quote, order, subscription, entitlement, tax, and FX version/effective-time semantics.
7. **Idempotency:** specify stable operation keys, provider-event processing state, transaction boundaries, and safe retry behavior for acceptance, provisioning, invoice issue, capture, refund, allocation, import, match, and settlement.
8. **Migration/backfill strategy:** define deterministic mappings, unresolved-row handling, reconciliation totals/checksums, review ownership, and staged read verification before any write plan.
9. **Rollback strategy:** define tested operational rollback and forward-correction boundaries, including external provider effects that cannot be rolled back by a database restore.
10. **API compatibility:** inventory deployed consumers and define payload, authorization, and route compatibility for current `/api/v1/billing/*` paths.
11. **UI consolidation strategy:** map existing Finance, Billing, Accounting, Licensing, FinOps, and Tenant Portal actions to one permission-aware experience while preserving required deep links and customer scope.
12. **Production verification criteria:** define read-only baseline and post-release checks, exact expected counts/financial invariants, evidence ownership, and approval criteria before any production change is separately authorized.

## 9. Important non-findings and evidence limits

- Zero production rows, if observed for a table, do not prove the feature is broken or unused outside the captured production state or time window.
- Test/workspace/simulator data is not production evidence and is not represented as such here.
- Source evidence does not prove every inspected route, scheduler, integration, or code version is deployed or active in production.
- No production write verification was performed. The source inspection was read-only; it did not execute production flows or contact payment providers.
- Where production counts, status distributions, database version, currency evidence, or relationship checks were not supplied, this report records them as unknown rather than zero or absent.
- The documents in the workspace include observations from the loopback simulator database; those findings are explicitly not carried into the production facts above.

## 10. Final phase status

- **Phase 3B evidence collection: COMPLETE**
- **Phase 3 evidence analysis: COMPLETE after this document**
- **Phase 4 implementation: NOT STARTED**

This document makes no migration, schema, code, UI, production, or data-change proposal.
