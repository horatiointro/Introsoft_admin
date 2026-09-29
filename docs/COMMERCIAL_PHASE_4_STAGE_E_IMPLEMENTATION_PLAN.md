# ALTIL Phase 4 Stage E — Invoice, Payment Allocation, Credits and Settlement

**Status:** Documentation and implementation-readiness plan only.
**Architecture authority:** [Phase 4 Architecture Specification](./COMMERCIAL_PHASE_4_ARCHITECTURE_SPEC.md).
**Dependencies:** Accepted Stage A–D authority, including party/account mappings, source charge lineage, and approved financial policies.
**Authorization:** This plan does not authorize implementation.

## 1. Purpose and evidence boundary

Stage E defines:

Charge → Invoice → Payment → Payment Allocation → Reconciliation → Settlement → Accounting

The existing `billing_invoices`, `billing_ledger_entries`, `billing_payment_intents`, `billing_payment_methods`, `billing_schedules`, `billing_refunds`, reconciliation batches/items, accounting journals/lines, and Stripe/PayFast/iKhokha integrations are the financial core. Stage E extends and links this core; it creates no parallel invoice, payment, reconciliation, or accounting system.

Production evidence reports one active ZAR 85 order/line and zero invoices, payment intents, payment methods, schedules, provider events/logs, refunds, reconciliation batches/items, and accounting journals/lines at capture time. These zeroes mean no such persisted rows in that snapshot only; they do not establish historical use, deployment, failure, or intent. Production financial relationships, provider activity beyond the supplied counts, audit completeness, and the full FX/tax semantics remain unqueried. Do not infer them from workspace/test data.

## 2. Current financial core and source behavior

| Existing object/path | Source-verified behavior | Target treatment |
|---|---|---|
| `billing_invoices` | Draft creation and issue; direct invoice paid/status balance updates. Invoice lines are payload-backed in current paths. | Sole invoice document/AR register. Preserve IDs, numbers, issued values and historic payloads. Add charge/account/tax references only additively. |
| `billing_ledger_entries` | Operational payment/refund/adjustment activity records. Some ledger adjustments are not automatically journaled. | Preserve all entries; clarify/reconcile meaning against allocations, credits and journals. Do not use as substitute for invoices or payment allocation. |
| `billing_payment_intents` | One optional `invoice_id`; `capturePaymentIntent` applies capture to that invoice and rejects amount above remaining balance. | Preserve intent/provider IDs and existing direct links. Add allocation history around intent as required. |
| `billing_payment_methods` / `billing_schedules` | Tokenized provider method and consented collection schedules; scheduler attempts collection of due invoices/usage threshold invoices. | Preserve token abstraction/consent and scheduler. A schedule is not a subscription, payment, or allocation. |
| `billing_refunds` | Request/approval/provider or manual confirmation; finalization mutates original invoice amounts, writes ledger entry and posts journals. | Preserve refund request/provider history; future immutable credit-note/reversal records must not rewrite original issued invoice. |
| Reconciliation batches/items | Import, matching to captured payment, and settlement workflow. | Preserve statement evidence and match IDs/history; settlement behavior must be idempotent and recoverable. |
| `accounting_journals` / lines | `postJournal` validates balanced entries and source uniqueness; selected invoice/payment/refund/settlement flows post journals. | Sole accounting subledger. Preserve posted IDs/lines; correction is a linked reversal/adjustment journal. |
| Providers | Stripe, PayFast, and iKhokha checkout/callback paths. Provider callbacks can capture payment intents; event records follow some business side effects. | Preserve provider IDs, verification and integrations. Improve processing-state/idempotency only through separately approved changes. |

Current source does not show a first-class payment-allocation table. The payment intent's single nullable `invoice_id` cannot represent one payment distributed across multiple invoices, allocation reversal history, or unapplied cash. One intent is associated with one invoice in the current capture path. Partial invoice payments can be recorded against an invoice balance; overpayment is rejected. Reconciliation settlement invokes journal posting. Refund completion mutates the original invoice. These are source findings, not proof the routes are deployed or exercised.

## 3. Target financial model and lineage

Target line of explainability:

Accepted commercial authority → subscription/obligation → rated charge → invoice line → existing invoice → payment intent/provider effect → allocation(s) → reconciliation item/batch → settlement evidence → existing journal source/lines.

### Invoice and invoice line

Keep the current invoice register and issuance behavior. New invoice lines link to immutable charges, fixed recurring obligations or approved adjustments, and retain product/price version, service period, billing account/legal entity, currency, tax decision and source ID. Issuance freezes the document. Draft editing is controlled and audited. Do not regenerate old invoices from current prices/FX/tax or change an issued invoice to force a payment/refund balance.

### Payment and allocation

Keep `billing_payment_intents` as the payment/provider operation. A first-class Payment Allocation relationship is required if ALTIL supports many-to-many, partial, unapplied, overpayment credit, or reallocation semantics. It records payment/credit source, invoice, amount/currency, actor/system, timestamp, status, command key and reversal reference. It is an allocation ledger, not a replacement payment table.

- **One payment → one invoice:** one allocation; maintain direct-link compatibility.
- **One payment → multiple invoices:** multiple allocations, each bounded by remaining payment and invoice balances.
- **Partial payment:** allocation amount can be less than captured amount/invoice due; outstanding AR is derived.
- **Unapplied payment:** captured payment is retained with no invoice allocation until a policy-authorized allocation occurs.
- **Overpayment:** reject excess capture against invoice as current code does; if customer credit is required, record unapplied cash/credit balance explicitly rather than overpaying the invoice.
- **Reallocation:** append allocation reversal and replacement; never update history in place.
- **Currency:** no cross-currency allocation without explicit approved conversion, immutable rate source/time and rounding. Never silently sum currencies.
- **Credits:** credit note is an AR document; customer credit is a balance; neither is a cash refund.

### Refund, credit note and reversal separation

Refund request → finance approval → provider refund/manual processing → provider-confirmed result is distinct from credit-note issuance, invoice adjustment, payment reversal/chargeback, and accounting reversal. A refund returns cash; a credit note corrects AR/revenue/tax. One may occur without the other according to approved legal/accounting policy.

The original invoice remains immutable after issue. A future credit note/adjustment references original invoice and line(s), has its own stable ID/number, reason, approval, currency/tax snapshot, effective/issue date and journal source. Existing `billing_refunds` IDs/provider references remain unchanged; legacy refund history is not fabricated into credit notes. Posted journal corrections use balanced reversing entries referencing original source.

### Reconciliation and settlement

Keep batch/item import and match evidence. Match a statement row to one payment/provider event under approved uniqueness rules and currency/amount validation. Preserve unmatched/exception decisions and match actor/time. Settlement represents provider/bank payout evidence, gross/fee/net/currency, settlement date/reference, source batch/items and corresponding journal IDs. A separate settlement identity is justified only where production operations require it; current settlement reference on intent and reconciliation batch must remain readable.

## 4. Accounting lineage and journal integrity

Continue to post through the existing `postJournal`/accounting tables. Each posting is balanced, has one currency, stable source_type/source_id, actor and correlation. Invoice issue, capture, manual receipt, refund and settlement postings preserve their current source IDs. Journal source uniqueness is an idempotency aid; it does not make multi-step payment/settlement workflows atomic.

Required target lineage: charge/invoice line → AR posting; payment capture/allocation → clearing/AR or unapplied-cash account; refund/credit note → separate AR/revenue/tax/cash effects as approved; settlement → bank/fees/clearing; reversal → explicit linked journal. Account mapping and recognition policy belongs to Finance. No new accounting engine or unbalanced direct ledger edit is allowed. Existing ledger adjustments without journals must remain identifiable and be reconciled, not silently retro-posted.

## 5. Multi-currency, FX and tax

Treat product/contract/order/invoice/payment/settlement/provider-cost/display currencies as distinct roles. Preserve transaction amounts in source currency; every grouped total is by currency. Platform currency setting/display currency is not the same as transaction currency.

If an approved flow converts, store immutable source/target currency, exact rate ID, direction, source, effective and observed timestamps, amount before/after, precision and rounding. Preserve provider capture currency and settlement currency separately. Do not use current FX rate to restate historic financial records. Revaluation and realized/unrealized FX journals are deferred absent finance policy and production evidence.

Tax must snapshot seller registration/jurisdiction, customer tax status if relevant, tax code/rate version, taxable base, inclusive/exclusive treatment, calculation/rounding and decision source for each issued line. Current invoice tax amount does not establish legal tax determination. Tax owner and supported jurisdictions must be approved before automation. No speculative tax engine is in scope.

## 6. Idempotency, retries and external effects

| Operation | Required behavior / current concern |
|---|---|
| Charge → invoice generation | Claim each source charge/fixed obligation once; deterministic invoice run/account/period key. Preserve current invoice ID on retry. |
| Payment creation | Scoped client operation and provider external reference; do not create duplicate intents on network retry. |
| Provider capture/webhook | Durable provider/event/intent processing state and idempotency. Current event record may be inserted after capture side effects; concurrent retry window must be addressed. |
| Allocation | Unique allocation command, bounded balances, append-only reversal/replacement events. |
| Refund | Refund request ID/provider idempotency where supported; separate provider success from invoice credit. |
| Reconciliation import | Provider + statement + stable line reference idempotency; detect duplicate statement imports before creating duplicate evidence. |
| Matching | Item + intent + decision operation; preserve prior match/reversal. |
| Settlement | Stable provider settlement/batch/item source keys; resume partial journal posting without duplicating. |
| Accounting | Existing source_type/source_id uniqueness plus balanced posting; corrections use new linked source IDs. |

External provider side effects cannot be rolled back by a database transaction. Record whether a charge/refund was submitted, accepted, completed or unknown; on timeout, reconcile/query provider evidence rather than blindly repeat. No plan should claim DB rollback undoes provider cash movement. Retryable errors, terminal errors and manual-review states are distinct.

## 7. API compatibility and provider integrations

Preserve current `/api/v1/billing/invoices*`, `/billing/payments*`, `/billing/payment-methods*`, `/billing/schedules*`, `/billing/refunds*`, `/billing/reconciliation*`, `/billing/ledger*`, `/billing/accounting/*`, and provider webhook route contracts. Keep current IDs, response fields, tenant authorization and payment provider references. New allocation/credit relationships are additive and must not change old `invoice_id` meaning. A legacy direct payment is represented compatibly as a single allocation only when such mapping is certain.

Stripe, PayFast and iKhokha integrations remain supported. Do not replace providers or claim production activity/configuration from source. Preserve signatures/ITN verification, provider response semantics and retry expectations. Test callbacks against provider sandbox or controlled mocks only after implementation authorization; no provider is contacted by this plan.

Consumer risk: existing clients may assume one intent equals one invoice, invoice.paid means fully collected, or refund means invoice total was adjusted. Inventory API consumers and document additive semantics before any endpoint response changes.

## 8. Migration/backfill and rollback strategy

No SQL/migration is specified. Require external read-only preflight immediately before implementation: exact live financial schema/FKs/indexes/unique/nullability; invoice/order/payment/refund/reconciliation/journal relationship counts; duplicate/orphan checks; status and currency totals; provider event/reference coverage; tax/FX tables and references; production app release; and audit results. Do not use local simulator figures. Production counts currently supplied are point-in-time; recheck before any change.

If separately authorized:

1. Add only reviewed allocation/credit/settlement lineage structures and nullable source references; preserve current invoice/payment/refund/reconciliation/journal IDs.
2. Do not backfill invoice allocation or credit-note semantics from amount/date matches alone. Existing direct intent.invoice_id may be a deterministic legacy link only after live row-level aggregate relationship evidence and owner review.
3. Preserve all posted amounts, currencies, invoice payloads, provider refs and journal lines. Never rewrite an issued invoice or posted journal.
4. Classify legacy records as deterministic, ambiguous, unresolved or not applicable; retain original references for unresolved rows.
5. Reconcile counts and totals by currency/status before and after. No cross-currency netting.
6. Rehearse duplicate callbacks, timeout-after-provider-success, partial allocation, refund/credit separation and settlement partial failure in sanitized non-production.
7. Before external payment effects, rollback can disable the new path. After capture/refund/settlement, do not undo external effects; forward-reconcile and post approved reversing/adjusting records. Preserve audit and IDs.

## 9. Evidence gates before implementation

- Stages A–D accepted and commercial authority/charges exist with verified links; no inferred party/charge.
- External production operator supplies live schema and financial relationships/constraints, statuses, currency-separated totals, event/provider evidence, and orphan/duplicate checks.
- Confirm production release and existing provider deployment/configuration without sharing credentials.
- Finance approves allocation semantics, credit/unapplied cash, overpayment, refund/credit-note distinction, tax, FX, journal accounts and settlement policy.
- Provider owners approve event idempotency, retry and timeout recovery for each existing integration.
- Security confirms role/tenant isolation and sensitive data handling; audit correlation and retention are sufficient.
- Non-production rehearsal proves financial invariants, balanced journals, retry safety, and stable IDs.
- Explicit rollback/forward-recovery and post-change read-only reconciliation criteria approved.

## 10. Acceptance criteria

- Existing financial IDs, invoice numbers, provider references, reconciliation IDs and journal sources remain unchanged.
- No parallel invoice/payment/reconciliation/accounting system exists; all new obligations and allocations connect to current core.
- Every issued invoice line resolves to an approved charge/fixed obligation or an explicitly identified legacy exception.
- Payment allocation supports approved one-to-one, one-to-many, partial and unapplied cases with append-only reversals; no invoice overpayment is silently recorded.
- Refund cash movement, credit note, invoice adjustment and accounting reversal are separate linked facts; original invoice and journals remain immutable.
- Reconciliation/settlement resumes safely after partial failure and every journal remains balanced per currency.
- Provider callbacks are idempotent under duplicate/concurrent/retry delivery and external outcomes can be reconciled without blind duplicate effects.
- Tax/FX decisions and source currency are reproducible; no cross-currency aggregation or historical revaluation occurs without policy.
- Stage A BLOCKED/UNKNOWN facts remain unresolved until external evidence establishes them; no production relationship is inferred.
- Finance, legal/tax, security, provider operations and accounting owners accept the controls and report verification.

## 11. Explicit non-goals

Stage E does not replace invoice/payment/accounting/provider systems; implement ERP/GL export, advanced FX revaluation, tax automation beyond approved foundation, chargeback automation, marketplace settlement, new provider integration, contract/quote flow, provisioning, rating engine beyond Stage D, UI consolidation, or legacy retirement. It does not assume a zero-row production table means unused or unnecessary.

## 12. Authorization boundary

This Stage E plan is documentation and implementation-readiness analysis only. It does not authorize schema changes, migrations, financial/data changes, application changes, API changes, UI changes, provider operations, or production changes. Implementation requires separate explicit authorization after external evidence review and acceptance of this plan.
