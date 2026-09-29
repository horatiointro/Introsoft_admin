# ALTIL Phase 4 Stage D — Provisioning, Usage, Rating and Charges

**Status:** Documentation and implementation-readiness plan only.
**Architecture authority:** [Phase 4 Architecture Specification](./COMMERCIAL_PHASE_4_ARCHITECTURE_SPEC.md).
**Dependencies:** Approved Stage A identity mapping and accepted Stage B/C commercial authority.
**Authorization:** This plan does not authorize implementation.

## 1. Purpose and evidence boundary

Stage D defines:

Entitlement → Provisioning → User/Application/API Consumer → Usage Event → Rating → Charge

The bridge must turn governed runtime evidence into one explainable durable customer obligation without bypassing existing `billing_invoices`, `billing_ledger_entries`, payment, reconciliation, or journal systems. No charge is an invoice or payment.

Current source evidence: `server.ts` meters governed API-key requests, computes estimated model/provider cost, applies current margin/quota/overage behavior, and writes `tenant_key_usage`; `recordKeyUsage` catches/logs database write failures. Existing provider/model registry and FinOps views exist. The product catalogue includes inference cost-plus and request-pack products. These are source facts, not proof every route is deployed or used.

Production snapshot: 8 AI providers, 16 AI models, 10 billing products, and zero `tenant_key_usage` rows at evidence-capture time. Catalogue categories include inference cost-plus and request pack; the captured order is a recurring AI seat. Zero usage is a snapshot, not proof the feature is broken, historically unused, undeployed, or unnecessary. No production relationship, active provider configuration, provider cost settlement, or rating lineage result is supplied. Workspace/test/simulator usage is excluded.

## 2. Domain responsibilities and source authority

| Domain | Authority and Stage D responsibility | Boundary |
|---|---|---|
| Entitlement | Stage C grant/version defines permitted service scope, limits, tenant/application/API-consumer target and effective period. | No usage charge without a valid commercial authority/eligibility rule; entitlement does not authenticate. |
| Provisioning | Durable desired-state operation applies approved runtime mapping/policy and records outcome. | Stage D may specify integration but does not make a key or user a commercial party. |
| Runtime identity | Existing IAM user, tenant application, API consumer/API key and request context identify who/what executed. | Preserve tenant isolation and secret handling; no billing based on client-supplied attribution alone. |
| Provider/model registry | Existing `ai_providers`/`ai_models` and routing supply provider/model identity and catalog cost estimates. | Registry estimate is not necessarily provider invoice/settled cost; provenance and confidence must be explicit. |
| Raw usage | `tenant_key_usage` is existing candidate source evidence and should remain preserved. | Production table had zero rows at capture; source authority/completeness/retention must be revalidated before adopting as sole billable source. |
| Rating | Apply versioned eligibility, cost, markup, price, quota/pack and currency rules deterministically. | Do not rewrite raw usage or an already-issued invoice. |
| Charge | Durable invoiceable obligation linked to rating/source entitlement/order/price. | Must flow into existing billing core in later Stage E, not a parallel invoice ledger. |

## 3. Usage event identity and attribution

Each accepted event must retain a stable source namespace + event/request identifier; event time and ingestion time; tenant; application; API consumer/service identity; non-secret API-key reference; user attribution where available and policy-permitted; provider and model; operation/capability; measured units/tokens; success/failure/blocked outcome; provider cost amount/currency/source; entitlement/subscription/contract/order-line source where deterministically resolved; product/price version; and correlation/policy/data-classification references allowed by privacy policy.

Missing identity dimensions stay null/unknown. Do not infer a user, customer, organisation, legal entity, billing account, contract, cost centre or entitlement from `tenant-altil-internal`, tenant name, API-key count, application count, UI context, IP, or similar amount. Keep API secrets, key hashes, prompts, raw content, credentials, and unnecessary PII out of billing evidence.

`tenant_key_usage` may remain the immutable raw source if external preflight and runtime verification establish completeness and durable uniqueness. A normalized usage read model is appropriate only if it references the original event identity and does not create a second billable event. If a new normalized source is approved, define a single authority and dual-read/reconciliation cutover; do not dual-bill.

## 4. Rating and cost-plus model

Required pipeline:

1. Validate source identity, timestamp, event status, attribution and duplication.
2. Decide commercial eligibility from active entitlement/order/subscription effective at event time and product terms; blocked/failed events follow explicit usage policy.
3. Resolve provider/model metadata and provider-cost source/version. Preserve provider inference cost in original currency; distinguish registry estimate from provider-reported/settled cost.
4. Resolve immutable customer price/markup version and product, including inference cost-plus or request-pack rules.
5. Apply deterministic markup, rounding, currency/FX and tax decisions as approved. Provider cost and customer price are separate values.
6. Persist immutable rating inputs, rule/algorithm version, source evidence, result, currency, decision status and audit correlation.
7. Create exactly one charge from the rating result or fixed pack obligation, with explicit invoice eligibility state.

The required value chain is provider inference cost → configured markup → customer charge. Markup semantics (percentage, minimums, included allowances, provider-specific adjustments, caps, negative/zero amounts) require Finance approval; do not infer from the product name or existing margin field alone. Price selection uses effective-dated version at event time. Re-rating creates a new linked rating plus reversing/adjustment charge; it never mutates billed amounts.

## 5. Request packs, budgets and quotas

Request packs are commercial product/allowance concepts only when an accepted order/subscription/entitlement establishes quantity, validity, eligible request type, rollover/expiry and depletion rule. No pack balance or entitlement is inferred solely from product catalogue presence.

Budgets/quotas have distinct roles:

- Runtime hard quotas/limits are authorization controls enforced before or during a request.
- Budget alerts are monitoring thresholds and must not silently become hard blocks.
- Included/request-pack consumption is a commercial entitlement counter with an event-level decrement identity.
- Overage is chargeable only under accepted terms and the applicable price version.
- Provider cost budgets are ALTIL cost controls, not customer receivables.

Attribution must keep customer charge, provider cost, included usage, pack consumption, and overage distinguishable. Event accounting must remain concurrency-safe; concurrent requests cannot consume one included unit twice or exceed an approved cap unnoticed. Define grace/failure policy, counter rebuild, and replay reconciliation before implementation.

## 6. Idempotency, failures and reconciliation

| Operation | Required identity and behavior |
|---|---|
| Usage ingestion | Source namespace + stable event/request ID; duplicate submission returns prior result. Current source writer catches/logs DB insert failures; verify persistence failure cannot silently drop chargeable evidence. |
| Provider cost enrichment | Event + provider/model cost source/version; late cost correction is append-only. |
| Eligibility | Event + entitlement version + eligibility policy version. Preserve rejected/exempt outcome and reason. |
| Rating | Event + rating version/decision scope. Retry returns same result; rerate creates a linked new result. |
| Pack/quota consumption | Event ID + entitlement/pack version + consumption type; atomic at-most-once decrement or reconstructable ledger. |
| Charge creation | Unique source rating or pack obligation + charge type/period; cannot create a second charge on replay. |
| Reconciliation | Compare accepted event count/units/cost totals to source ingestion and downstream charges by currency, status, provider/model and time bucket. Never hide rejected/late/duplicate events. |

Failed/blocked requests follow documented billability policy. Duplicate or late events are retained with outcome and not silently dropped. If usage persistence fails, system must not claim full billing evidence; choose and document fail-open/fail-closed behavior with security/finance/product owners. Existing behavior logs an insert error, so operational alerts/recovery and durable replay evidence are a prerequisite.

Reconciliation is an evidence process, not an amount adjustment guess. Differences are classified (missing source, duplicate, late arrival, provider-cost revision, entitlement mismatch, rating version, currency/FX, rounding) and corrected through linked events/charges. No charge/invoice is changed directly to force aggregate agreement.

## 7. Audit lineage and privacy/security

End-to-end lineage should be:

Contract/Order Line → Subscription Version → Entitlement Version → Provisioning Operation → Runtime Identity/Consumer → Request/Policy Decision → Usage Event → Rating → Charge → later Invoice Line → Accounting source.

Each hop carries stable IDs/correlation, actor/service, timestamps, version, status/outcome and source reference. Only verified links are populated. Audit includes rating decision/version, cost source, markup, price version, entitlement result, correction/replay reason and charge identity. Protect customer pricing and provider-cost detail by role; do not record raw prompts/responses, API secrets, credentials, personal identifiers beyond necessity, or whole payloads.

Tenant isolation remains a mandatory predicate. Entitlement is a policy input alongside identity, application, data classification and provider/model controls. Usage attribution from untrusted request body fields is not authoritative unless resolved/validated by the server.

## 8. API and UI compatibility

Do not remove or change runtime gateway/orchestration/usage endpoints, `/api/v1/usage*`, FinOps endpoints, `/api/v1/billing/products*`, order/invoice routes, or licensing checks in this plan. Preserve request/response contracts and tenant/application scopes. Add optional charge/rating references only after consumer inventory and versioned contract review. Client-supplied commercial IDs never override server-resolved entitlement/tenant scope.

FinOps remains the usage/provider-cost analytical experience; Finance gains charge drill-through only when durable charge data exists. No second usage ledger or invoice UI is created. UI changes are outside Stage D implementation readiness.

## 9. Migration, backfill and rollback

No SQL or migration is specified. Before implementation, require external production evidence for live usage schema, indexes/FKs/unique constraints, JSON key presence, usage/event row counts and status distribution, tenant/application/key/provider/model relationships, production release, product/price and pack terms, quota/budget semantics, and downstream invoice/ledger relationships. Existing Stage A evidence records zero `tenant_key_usage` at capture; recheck externally and do not infer absence outside that snapshot.

If separately authorized:

1. Keep existing usage IDs/rows and FinOps compatibility. Establish canonical source of truth before normalization.
2. Add only reviewed additive rating/charge/operation records with source identity and immutable version snapshots; preserve monetary/source IDs.
3. Backfill ratings/charges only where event, entitlement, effective price, provider cost and customer authority are deterministic. Otherwise retain raw event and mark unrated/unresolved; never use a guessed tenant/customer mapping.
4. For any dual-read period, compare source event counts and rated/charged totals by currency and source identity; never dual-write charges without idempotent claim.
5. Rehearse replay, delayed events, failed database writes, provider-cost corrections, concurrent pack consumption, rerating and charge reversal in sanitized non-production data.
6. Rollback by stopping new rating/charge creation and retaining raw events and operation outcomes. After charges are invoiced/posted, correct by linked adjustment/credit and journal path in Stage E; do not delete or rewrite financial history. Runtime authorization rollback is separate and must not accidentally restore revoked access.

## 10. Evidence gates before implementation

- Stage A identity/account mapping and Stage B/C accepted authority, subscription/entitlement definitions.
- External production preflight with actual usage schema/relationships, counts, duplicate/orphan and idempotency results; source migration definitions are not production verification.
- Confirm deployed application release and actual metering path with operator evidence; source code alone does not prove execution.
- Confirm eight-provider/sixteen-model captured registry counts only as point-in-time facts; provider configuration, billability and cost provenance require evidence.
- Establish verified pricing/markup, inference-cost-plus and request-pack terms, cost sources, currency, rounding, budget/quotas and failure policy with Finance/Product/Security.
- Confirm privacy/data-classification requirements and permissible attribution dimensions.
- Prove event replay, rate determinism, charge idempotency, cost/usage reconciliation, tenant isolation and audit correlation in non-production rehearsal.
- Determine how charges flow to existing invoices/ledger in Stage E without changing current invoice engine.

## 11. Acceptance criteria

- Every charge resolves to one immutable rating outcome, source usage or fixed obligation, effective product/price version, entitlement and approved commercial authority; unresolved facts remain explicitly unresolved.
- Provider cost and customer charge/markup are separately explainable, currency-tagged and reproducible.
- Event, rating, quota/pack consumption and charge retries/replays do not double bill or double consume.
- Corrections/rerating append evidence and preserve original event/rating/charge history.
- Usage write failure, late event, duplicate and blocked-request behavior is explicit, observable and recoverable.
- Tenant/application/API consumer attribution is server-validated; no secret or unnecessary PII enters billing evidence.
- Existing runtime authorization, budgets/quotas, FinOps contracts and financial IDs/history remain compatible.
- Aggregate source-to-charge reconciliation balances by currency/status under approved rules; no cross-currency summing.
- Stage A production UNKNOWN/BLOCKED items are resolved externally where required, not filled by assumptions.
- Product, Finance, Security, privacy and runtime owners accept rating/failure/recovery semantics.

## 12. Explicit non-goals

Stage D does not implement Stage A–C; invoice redesign/generation, payment allocation, refunds/credit notes, settlement/accounting, tax automation, FX revaluation, chargebacks, new provider integrations, provider-cost settlement, new UI/navigation, or legacy retirement. It does not treat zero captured production usage as proof of unused capability.

## 13. Authorization boundary

This Stage D plan is documentation and implementation-readiness analysis only. It does not authorize schema changes, migrations, usage/data changes, application changes, API changes, UI changes, runtime policy changes, provider changes, or production changes. Implementation requires separate explicit authorization after review, external evidence collection, and acceptance of this plan.
