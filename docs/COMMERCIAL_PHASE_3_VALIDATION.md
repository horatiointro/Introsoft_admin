# ALTIL Commercial Platform — Phase 3 Validation

**Status:** Source and configured-database validation complete; production environment not verified.  
**Date:** 2026-09-28  
**Mode:** Read-only inspection. No application code, migrations, schema, or data were changed.  
**Related:** [Phase 1 discovery](./COMMERCIAL_ARCHITECTURE_DISCOVERY.md) · [Phase 2 design](./COMMERCIAL_PHASE_2_DOMAIN_DESIGN.md)

## Executive findings

The `.env` configuration in this workspace points at a loopback database. A read-only transaction reported version `9.5.0`, 67 base tables, and all migrations `001`–`023` recorded as applied. The server-wide `read_only` variable is `OFF`; therefore the inspection was made using a transaction explicitly started `READ ONLY`, but the database account is not server-enforced read-only. No write statement was issued. This is the configured local database, not evidence that the production database was inspected. Older project documentation's MariaDB `10.11.18` statement does not match the server version returned here.

The configured database has extensive simulator evidence: all 10 payment intents use provider `demo_sim` and are marked `externalPaymentExecuted=false`; all 10 reconciliation batches and all 5 refunds are marked simulated; 115 of 116 invoices have `demoData=true`; 15 payment/refund-related accounting records and 100 `demo_invoice` journal records appear in the books. Treat these records as demonstration data, not proof of customer transactions or gateway settlement.

Observed data checks: 1 invoice has no matching tenant; 0 order/line/product orphans; 0 payment intents pointing at missing invoices; 0 license/plan or tenant orphans; 0 usage references to missing API keys/applications/tenants; 0 orphaned journal lines or reconciliation items; 0 unbalanced journals across the 130 recorded journals; and no duplicate invoice numbers, provider references, or reconciliation external references within a batch. These findings describe only the configured local database snapshot.

The strongest evidence-based schema changes are much smaller than the Phase 2 conceptual list: **no new payment, invoice, order, reconciliation, or accounting engine**. The clear data-model gap is payment-to-invoice allocation as a first-class record, plus missing first-class quote/contract/version entities if those workflows are required. The customer/legal-entity/billing-account hierarchy needs a production data mapping before any table is approved. Tax, FX, subscription, rating, and provisioning changes should be based on confirmed launch requirements and execution paths.

## 1. Repository and runtime baseline

| Item | Observation |
|---|---|
| Branch / commit | `main`, at `7ab78d5` (`fix: resolve TypeScript errors in API routes`), tracking `origin/main`. Recent history includes API/control-centre updates and database/auth work. |
| Working tree | Pre-existing modifications are present in `src/App.tsx`, `src/components/Sidebar.tsx`, `src/data/helpTopics.ts`, and untracked `src/components/ApiDocumentationView.tsx`; these were not changed. The Phase 1/2 design documents were also present as untracked files when this investigation began. |
| Runtime | React 19 + Vite + TypeScript frontend; Express 4 server in `server.ts`; MariaDB/MySQL driver `mysql2`; database pool/config in `src/db/mariadb.ts`. |
| Migration state | Database has 23 `schema_migrations` rows (`001`–`023`). Migration files are ordered SQL and checksum tracked by the runner. `scripts/migrate.js --status` was not run because code inspection shows that even status mode executes `CREATE TABLE IF NOT EXISTS schema_migrations`; it is not strictly read-only. A custom metadata query was used instead. |
| Configured database | Host classification: loopback. Exact credentials and row-level customer details are intentionally omitted. Returned server version was `9.5.0`; `@@global.read_only=0`. No production host or production identity was established. |
| Scheduled work | No standalone scheduler/cron worker for commercial billing was found in the inspected application source. The billing-cycle operation is an authenticated HTTP endpoint. External Stripe recurring checkout/webhooks form a separate recurring path. |
| Safe inspection | Used `START TRANSACTION READ ONLY`, SELECT queries against `information_schema` and aggregate-only SELECTs, then rolled back. No diagnostic file was added. |

### Relevant source ownership

| Source | Existing responsibility |
|---|---|
| `server.ts` | Main API; customer, licensing, commercial products/orders, billing, payment callbacks, schedules, cycles, reconciliation, accounting and portal routes; usage metering and much persistence logic are inline. |
| `src/db/mariadb.ts` | MariaDB configuration/connection and tenant/licensing repositories; usage and commercial persistence helpers. |
| `src/db/migrator.ts`, `scripts/migrate.js` | Forward migration execution/checksum tracking; the CLI status path has a schema-table creation side effect. |
| `src/utils/paymentGateways.ts` | Stripe, PayFast and iKhokha hosted payment, token collection and signature helper functions. No provider was contacted during this review. |
| `src/routes/authRoutes.ts` | Authentication, MFA/session and IAM endpoints. |
| `src/components/FinanceCommerceView.tsx` | Product and order UI using `/billing/products` and `/billing/orders`. |
| `src/components/BillingAdminView.tsx` | Invoice/ledger operations using `/billing/invoices` and `/billing/ledger`. |
| `src/components/AccountingControlView.tsx` | Finance summary, invoices, journals, payments, refunds, reconciliation imports/matches/settlement. |
| `src/components/LicensingMonetizationView.tsx` | Plans and tenant/application license operations. |
| `src/components/FinOpsView.tsx` | AI cost and usage reporting; data provenance must be separated from billable ledger evidence. |
| `src/components/Tenant360View.tsx` | Operational customer diagnostics. Contract terms and entitlements include fallback/static `initialEntitlements` and default values; they are not proof of persisted contracts or entitlements. |
| `src/components/CustomersView.tsx`, `OrgHierarchyView.tsx` | Customer/tenant and organization-tree administration. |
| `src/components/TenantPortalView.tsx` | Customer portal for tenant-scoped profile, invoices, payment methods, schedules, payments/refunds, display currency and key limits. |
| `src/components/Sidebar.tsx`, `src/App.tsx` | Existing menu ownership and tab dispatch. Finance has nested entries; licensing, FinOps and portal also have separate navigation identities. |
| `docs/openapi.yaml`, `src/components/ApiDocumentationView.tsx` | API documentation. OpenAPI contains billing schedules/cycles/reconciliation routes, but implementation remains primarily in `server.ts`; route/schema parity should be checked before treating it as authoritative. |
| `scripts/simulate_demo_history.js` | Explicitly generates synthetic 90-day invoice/payment/refund/reconciliation/journal history with `demoData`, `simulated`, and `demo_sim` markers. This explains much of the configured DB's commercial volume. |

## 2. Configured-database schema and data baseline

### Relevant table counts

Counts below came from the configured loopback database on 2026-09-28. “Oldest → newest” is based on the most relevant event/creation timestamp when available; a dash means the table was empty or no timestamp was present.

| Table | Rows | Key observed status/provider/currency distribution | Oldest → newest |
|---|---:|---|---|
| `tenants` | 6 | 6 active | 2026-09-27 11:04 → 12:37 |
| `tenant_applications` | 101 | 101 active | 2026-03-31 → 2026-09-27 |
| `tenant_api_keys` | 101 | 100 revoked, 1 active | 2026-09-27 11:04 → 12:37 |
| `tenant_key_usage` | 82,591 | 82,591 success | 2026-06-30 → 2026-09-27 |
| `licensing_plans` | 5 | USD | 2026-09-27 |
| `tenant_licenses` | 100 | 100 active/current, USD | 2026-09-27 |
| `billing_products` | 10 | 9 ZAR, 1 USD | 2026-09-27 |
| `billing_orders` / `billing_order_lines` | 1 / 1 | 1 active order, ZAR | 2026-09-27 |
| `billing_invoices` | 116 | 85 paid, 25 issued, 6 draft; all USD | 2026-07-05 → 2026-09-27 |
| `billing_ledger_entries` | 140 | 115 charge, 10 gateway_fee, 10 payment, 5 refund; all USD | 2026-07-05 → 2026-09-27 |
| `billing_payment_intents` | 10 | 10 succeeded, `demo_sim`, USD | 2026-08-03 → 2026-09-02 |
| `billing_payment_methods` / `billing_schedules` | 0 / 0 | Empty | — |
| `payment_provider_events` / `payment_webhook_logs` | 0 / 0 | Empty | — |
| `billing_refunds` | 5 | 5 succeeded, `demo_sim`, USD | 2026-09-05 |
| `billing_reconciliation_batches` / `billing_reconciliation_items` | 10 / 10 | 10 matched batches/items, `demo_sim`, USD | 2026-08-04 → 2026-09-03 |
| `accounting_journals` / `accounting_journal_lines` | 130 / 285 | 100 `demo_invoice`, 15 `invoice_issued`, 10 `payment_captured`, 5 `refund_issued`; all USD | 2026-07-05 → 2026-09-27 |
| `platform_currency_settings` | 1 | Configured row | — |
| `billing_fx_rates` / `billing_fx_rate_history` | 1 / 1 | USD only | 2026-09-27 |
| `audit_logs` | 100 | — | 2026-07-05 → 2026-09-27 |
| `iam_users` / `iam_roles` / `iam_user_roles` | 1 / 9 / 1 | One active user; values not exposed | 2026-09-26 for dated records |

The 67-table database also contains the IAM, AI, operations, compliance, DCR, communications, SLA, CMDB, and registration tables from migrations. No table named for payment allocations, contracts, quotes, legal entities, billing accounts, charge/rating runs, credit notes, or tax configuration was found in the actual table list.

### Actual shape and constraints

- Commercial invoice, product, order, order-line, payment-intent, refund, and ledger tables use typed monetary columns (`DECIMAL(18,6)`); usage uses `amount_usd DECIMAL(18,8)`; FX uses `DECIMAL(24,12)`. Currency fields are ISO-like `CHAR(3)`.
- Invoices have a unique invoice number; products a unique SKU; orders a unique order number; payment intents a unique external reference; payment provider events use event ID as primary key; accounting journals have unique `(source_type, source_id)`.
- `billing_payment_intents` has a nullable invoice ID, captured amount, fee amount and settlement reference. There is no allocation relation.
- `billing_orders` stores tenant/status/currency/totals/source/source reference and a JSON payload. `billing_order_lines` stores product ID and monetary snapshot columns plus a JSON payload. No version/amendment fields exist in these typed rows.
- `billing_invoices` stores tenant/status/currency/due date/total/paid and a JSON payload; detailed lines are in that payload. It has no typed order/source-charge/billing-account reference.
- `billing_reconciliation_items` has a nullable payment intent ID and batch ID. The actual schema has a foreign key from item to batch. Accounting journal lines have a foreign key to journals. Tenant usage is scoped to tenant by FK; other commercial ownership links are largely indexed typed identifiers without relational FKs.
- Schema inspection found no allocation or settlement master table; settlement is represented by reconciliation batch status and a payment intent settlement reference.

## 3. Relationship and integrity validation

| Chain/check | Configured DB result | Interpretation |
|---|---|---|
| Tenant → applications | 101 application rows, 0 tenant orphans | Referential data is consistent by ID; this dataset's application count is unusually high relative to 6 tenants and should be treated as seeded/demo until production is verified. |
| Tenant → API keys → usage | 101 keys, 82,591 usage rows; 0 missing tenant/key/application references | Structurally attributable to current key/application/tenant IDs. Metering records themselves do not carry an idempotency key or billing-period/rating record. |
| Tenant → license → plan | 100 licenses, 0 tenant or plan orphans | All 100 records are active/current/USD and created/updated on the same date; likely test/demo population, not confirmed active customers. |
| Tenant → order → lines → product | 1 order/line; 0 tenant/order/product orphans | Existing row links resolve, but it does not establish a full customer or contract lineage. |
| Tenant → invoice | 116 invoices; **1 invoice tenant reference does not resolve** | Needs operator review in the correct production DB; no identifier is reproduced here. Do not “repair” without determining history and authoritative owner. |
| Invoice → payment intent | 10 payment intents, all point to existing invoices | The observed sample is one intent per linked invoice. This is not evidence of multi-invoice or multi-payment allocation support. |
| Invoice ↔ order | 0/116 invoice payloads has an `orderId` | Order-to-invoice traceability is absent in this sample. Invoice lines exist in JSON for all 116; product/price version references are not evidenced. |
| Payment → provider events | 0 provider event records; 10 intents exist | Current payment sample cannot validate webhook event linkage or deduplication behavior. All 10 intents are simulated and not externally executed. |
| Reconciliation → payment → settlement | 10 items matched; no missing batch/payment references in matched rows; all 10 batches are `matched`, not `settled` | Matching logic has data examples; no settled batches or actual settlement evidence exist in this snapshot. No separate settlement record exists. |
| Accounting | 130 journals, 285 lines; 0 unbalanced journals; 0 orphan lines; all `invoice_issued`/`demo_invoice` and `payment_captured` sources checked resolve | Journals balance in this dataset. Most are explicitly synthetic; source completeness is not proven for every possible `source_type`. |
| Refunds | 5 refunds; 0 missing invoice/payment links; all simulated | Refund joins are present, but this data does not establish external cash refund or allocation behavior. |
| Duplicate checks | 0 duplicate invoice numbers, provider references, or external reconciliation references within a batch | These checks pass on the snapshot only. |
| Invoice amounts | 0 rows with negative total/paid or `paid > total` | Status/amount consistency beyond these checks requires lifecycle-specific validation. |
| Schedule → payment method | Both tables empty; no orphan can be observed | No configured recurring collection mandate/schedule data in this database. |

The simulator's demo flag count is payload-dependent: 115 invoices have `demoData=true`, while 15 are marked `simulated=true` in the queried payload (the latter may overlap only a subset). The application also stores 100 `demo_invoice` journals. In either case these are not production transaction evidence.

## 4. Payment allocation behavior

### Implemented behavior

- A payment intent includes one optional `invoice_id`. Hosted invoice checkout creates the intent for a specific invoice.
- The capture path updates that invoice's paid amount/status and writes ledger/journal effects. The observed implementation is direct invoice-level payment application, not a separate allocation service.
- Reconciliation matches one statement row to one captured payment intent by provider, currency and gross amount. Settlement posts bank/fee/clearing journal lines and records a settlement reference.
- Refund records reference one invoice and one payment intent. `finalizeRefund` reduces the original invoice `total`, `subtotal`, `tax` and `paid`, then posts credit and payout journals. This is a current behavior that should be reviewed before designing immutable credit notes; this validation did not invoke it.
- Provider fee is stored on the payment intent and reconciliation rows; settlement batch stores aggregate gross/fees/net.

### Not implemented/evidenced

No explicit payment allocation table or allocation history was found. Therefore one payment split across multiple invoices, partial allocation reallocation history, unapplied cash, overpayment allocation, and allocation limits cannot be represented as first-class records. One invoice can have multiple payment intents structurally, but current capture code updates invoice state directly; reliable partial/multiple-capture semantics need source review and targeted verification. No credit-note table exists. Refund completion can issue accounting credit journals but mutates the original invoice row/payload. Multi-currency allocation is not implemented/evidenced; the payment currency must match the invoice/statement currency for matching.

**Schema implication:** a payment allocation relation is genuinely new if ALTIL requires many-to-many and append-only allocation history. Do not infer that simply because the relationship is not a table it is absent from all payloads; inspect production data/payloads before backfill. Keep the existing `invoice_id` as legacy/direct link for compatibility.

## 5. Recurring billing authority

There are currently distinct mechanisms, not one canonical recurring engine:

1. **License cycles:** `tenant_licenses` is the source for `/api/v1/billing/cycles/run`. That endpoint selects active licenses with `nextBillingDate <= today`, groups them by tenant, avoids an existing invoice for tenant/period, and creates reviewable draft invoices. It does not create a recurring invoice directly from `billing_orders` or `billing_order_lines`. It is an authenticated HTTP-triggered operation; no scheduler was found to call it automatically.
2. **Hosted Stripe subscriptions:** licensing checkout creates a Stripe subscription; the Stripe `invoice.paid` callback updates license status/date and creates a local invoice/journal from the Stripe invoice event. Stripe is the external recurrence authority for this path, while `tenant_licenses` is ALTIL's entitlement/enforcement projection. This was source inspection only; live Stripe was not contacted.
3. **Billing schedules:** `billing_schedules` stores consented monthly/threshold collection configuration, and APIs/UI create/list/pause/resume it. No schedule executor or recurring collection worker was found in `server.ts` or scheduled scripts. The configured table is empty. Therefore schedule rows do not currently prove that recurring collection runs.
4. **Order recurring lines:** order creation copies the product's `recurring` flag into order-line data. The only inspected billing cycle runner reads licenses, not those order lines. Product/order recurrence is currently catalogue/order metadata, not the demonstrated recurring invoice authority.

**Conclusion:** preserve the working licensing cycle and Stripe webhook paths until reconciled. Do not designate `billing_schedules` or orders as the production authority based solely on schema/UI wording. Before future cutover, determine which tenants use Stripe-managed subscriptions vs ALTIL-issued license invoices and whether any deployment cron invokes the cycle route externally.

## 6. Usage, rating and billing authority

The server's governed API-key orchestration path calculates estimated input/output tokens, estimates provider model cost, applies a 1.25 margin, then applies license quota/overage or included/flex rules. It records a `tenant_key_usage` row with request ID, tenant, application, key, model, tokens, `amount_usd`, and success status. The exact API request ID is used as the event ID, but the schema has no unique idempotency constraint on it. Tenant current-month spend is summed from `amount_usd` for limits.

- **Authoritative persisted event (for API-key billable usage):** `tenant_key_usage`, when DB-connected. There is also an in-process capped mirror; other UI/model usage telemetry may be derived or synthetic.
- **Attribution:** tenant, application, API key, model are stored. User, cost centre, legal entity and billing account are not stored on the usage row.
- **Cost/rating:** server estimate, not a persisted versioned rating run. Product price version and rate input snapshot are absent. License counters/accrued amount are stored on `tenant_licenses` for licensed quota/overage.
- **Invoice linkage:** no `billing_invoices` payload in this snapshot contains an `orderId`; usage rows do not have invoice/charge foreign keys. The threshold schedule UI/API exists but no executor was found. Thus persisted usage is currently useful for FinOps/limit enforcement, but complete durable usage→rating→charge→invoice lineage is not established.
- **Quota/spend enforcement:** server enforces request quota/overage for license-based traffic and reads current-cycle usage amount for spend. The key's `monthlyRequestLimit`/`monthlySpendLimitUsd` are set in code/UI and can be updated by portal routes; the exact enforcement relation between key-specific limits and tenant license plan requires focused route-level validation. No assertion is made here that every displayed FinOps number is invoiceable.

**Schema implication:** do not add a duplicate raw usage table before confirming `tenant_key_usage` suffices as event evidence. The minimal future additions are likely a uniqueness/idempotency guarantee if compatible, effective-dated price references, and a distinct rated charge/invoice-link record—only if production requirements confirm usage billing is intended.

## 7. Currency and tax capability

### Currency / FX

- Accounting/display base is configured USD. Existing `billing_fx_rates` has only USD in this database; history has one USD row.
- Current invoices, licenses, payment intents, refunds, ledger entries, reconciliation and journals observed are USD. Product catalogue includes ZAR and USD; the one order is ZAR.
- Customer portal display currency is a preference. The API checks rate presence/freshness but responds that posted invoices/journals retain source currency; it does not convert posted amounts.
- FX rows hold `units_per_usd`, source and `as_of`; history is append-only by convention but current rate table is updated. Financial records do not carry a typed FX rate-history ID or accounting FX difference record.
- Provider-specific currency capability is encoded in provider utility and checkout code (PayFast/iKhokha ZAR constraints; Stripe broader). No live provider/currency transaction was tested.

**Conclusion:** source-currency preservation exists; transactional FX valuation and settlement FX-difference accounting are not evidenced. Do not expand FX schema until required transaction and settlement currencies are identified.

### Tax

No tax-jurisdiction, registration, tax-code or tax-rate tables were found. Invoice payload has a `tax` field for all 116 rows, and 15 rows have non-zero tax, but no normalized tax lines or applied jurisdiction/rate/code references were found. The simulation script deliberately creates estimated tax. Tax-inclusive/exclusive behavior, exemption, reverse charge and VAT authority are therefore not validated; current totals cannot establish production tax treatment.

**Conclusion:** tax configuration is a gap, but the minimum design depends on confirmed launch jurisdictions and finance/tax owner requirements. Do not create a speculative global tax subsystem now.

## 8. Quotes, contracts, versioning and organization model

No quote/quote-version/acceptance or contract/amendment/order-version table or service/API was found in migrations 001–023 or the searched source. `billing_orders` and lines have no version/effective-date columns. `Tenant360View` presents contract terms and entitlement matrices from tenant JSON/static fallback state; that is not a first-class signed contract or persisted entitlement ledger. The production question remains open because this is not production data.

No legal-entity or billing-account tables were found in the actual 67-table list. `tenants` is the customer/security scope, and `tenant_registrations` supports onboarding but does not establish corporate legal hierarchy. `OrgHierarchyView` is UI-level organization structure; no corresponding normalized enterprise entity hierarchy was found among actual tables.

**Conclusion:** quote/contract versioning and legal entity/billing account are genuine domain gaps if enterprise workflows are in scope. First confirm the real-world tenant/customer mapping and whether the requested MVP requires these records; then prefer the minimum canonical party/hierarchy tables over creating every conceptual table in Phase 2.

## 9. API ownership and UI consolidation evidence

Commercial APIs are concentrated in `server.ts`; route definitions and persistence logic are not duplicated as a second commercial router. `/api/v1/billing/*` can remain a compatibility facade while services are reorganized. Existing route families include:

| Capability / routes | Owner, data and access observed |
|---|---|
| Customers `/customers`, `/customers/:id`, users/keys, applications `/applications`, `/api-keys` | `server.ts`; customer and tenant state plus DB repositories/tables. Auth required for admin/customer records; tenant access and role checks vary by operation. |
| Licensing `/licensing/plans`, `/licensing/tenant-licenses`, update/webhook/verify | `server.ts` + `src/db/mariadb.ts`; `licensing_plans`, `tenant_licenses`, `payment_webhook_logs`; plan changes role-gated; webhook has payment-event authorization. |
| Products/orders `/billing/products`, `/billing/orders` | `server.ts`; `billing_products`, `billing_orders`, `billing_order_lines`; auth and `billingRead`/`billingWrite` plus role/tenant restrictions. |
| Invoice/ledger `/billing/invoices`, issue/payment, `/billing/ledger` | `server.ts`; `billing_invoices`, `billing_ledger_entries`, payment and journal persistence; auth + billing permission helpers. |
| Payments/methods/schedules `/billing/payments`, `/billing/payments/checkout`, `/billing/payment-methods*`, `/billing/schedules*` | `server.ts` and payment utility; `billing_payment_intents`, `billing_payment_methods`, `billing_schedules`; authenticated and role/tenant guarded. |
| Refunds `/billing/refunds*` | `server.ts`; `billing_refunds` plus invoices/payment intents/ledger/journals; authenticated role checks. |
| Reconciliation `/billing/reconciliation*`, import/match/settle | `server.ts`; reconciliation batch/item, payment intent, journal tables; super-admin/FinOps role gate in inspected route handlers. |
| Accounting `/billing/accounting/journals`, summary | `server.ts`; accounting tables and invoice/payment data; role controls apply. |
| Usage `/api/v1/usage`, orchestration/gateway | `server.ts`; `tenant_key_usage` and in-memory telemetry; API key auth for gateway; usage/admin views use authenticated routes. |
| Customer portal `/tenant-portal/:id`, display currency, key limits | `server.ts`; tenant profile, billing and key data; `requireTenantAccess` plus role checks on mutations. |
| Audit | `server.ts` and `src/routes/authRoutes.ts`/other routers depending event; `audit_logs` plus IAM login events. Commercial audit coverage is not a single domain module. |

No duplicate server-side billing API family was found, but UI ownership overlaps: `BillingAdminView` and `AccountingControlView` both fetch and show invoices; `AccountingControlView` also includes refunds, journals and reconciliation. `FinanceCommerceView` separately owns catalogue/orders. `LicensingMonetizationView` is outside nested Finance navigation. `TenantPortalView` consumes the same billing API family for customer-scoped flows. This supports UI consolidation, not backend duplication.

The sidebar already keeps most billing functions under a Finance parent. Preserve that structure and current tab IDs as aliases during consolidation. Do not add new top-level menu items during validation.

## 10. Canonical mapping matrix

Actions below are limited to findings supported by the inspected source and configured database. “Data quality” describes the configured snapshot, not production.

| Canonical concept | Existing implementation | Existing table(s) | Existing API | Existing UI | Data quality | Action |
|---|---|---|---|---|---|---|
| Customer | Tenant record/customer service | `tenants` | `/customers*` | Customers, Tenant 360 | 6 tenants; one invoice points to missing tenant | MAP |
| Organisation | Tenant metadata/org hierarchy view | `tenants.metadata_json`; no normalized org table | Customer/org-related routes | Customers, OrgHierarchy, Tenant 360 | No relational legal hierarchy validated | GAP — DESIGN REQUIRED |
| Legal Entity | No first-class record found | — | — | Tenant 360 terms are not legal entity records | No data to validate | NEW TABLE REQUIRED (if enterprise legal entities are in scope) |
| Billing Account | Tenant billing config and invoice tenant ID | `tenants.metadata_json`, `billing_invoices.tenant_id` | Billing and portal endpoints | Finance accounts, portal | No separate bill-to account; one invoice ownership anomaly | GAP — DESIGN REQUIRED |
| Tenant | Security/service scope | `tenants`, related tenant IDs | Customer/gateway routes | Customers, portal, global scope | 6 records; linked records mostly resolve | RETAIN |
| Contract | JSON/default contract terms only | `tenants.metadata_json` | No contract API | Tenant 360 | UI data not authoritative | GAP — DESIGN REQUIRED |
| Quote / Quote Version | No first-class implementation found | — | — | No quote section/workflow | No data to validate | NEW TABLE REQUIRED (if quoting is in scope) |
| Order | Product order service | `billing_orders`, `billing_order_lines` | `/billing/orders*` | FinanceCommerce | 1 order/line; no orphans; not linked from invoices | EXTEND |
| Order Version | No version/amendment service/table found | — | Cancellation only | FinanceCommerce | Current row can be cancelled; version history absent | GAP — DESIGN REQUIRED |
| Subscription | Tenant license and provider subscription projection | `tenant_licenses`; Stripe metadata in webhook flow | `/licensing/*`, hosted checkout/webhooks | LicensingMonetization, portal | 100 active/current licenses likely seeded; schedules empty | MAP |
| Entitlement | License enforcement + static Tenant 360 matrix | `tenant_licenses` metadata; `tenant_api_keys.metadata_json` | License verification/gateway enforcement | Tenant360 matrix partly static | No dedicated entitlement records | EXTEND (first validate source of entitlement truth) |
| Provisioning | Synchronous key/app/license workflows and operations jobs | Tenant app/key/license tables; no commercial job table found | Customer/app/key/license APIs | Customer admin, Tenant360 | No order provisioning job evidence | GAP — DESIGN REQUIRED |
| Usage Event | Successful metering event | `tenant_key_usage` | Gateway + `/usage` | FinOps, usage logs, Tenant360 | 82,591 rows; key/app/tenant references resolve | RETAIN |
| Rating | Inline estimate/quota/overage in orchestration | `tenant_key_usage.amount_usd`; license counters | Gateway request path | FinOps | No versioned rating run or price snapshot | EXTEND |
| Charge | Invoice/ledger amounts; no explicit rated charge entity | `billing_ledger_entries`, invoice payload | Invoice/cycle APIs | BillingAdmin, AccountingControl | 115 `charge` ledger rows; synthetic history evident | MAP (avoid duplicate ledger until production proof) |
| Invoice | Invoice service and recurring license cycle | `billing_invoices`, payload lines | `/billing/invoices*`, `/billing/cycles/run` | BillingAdmin, AccountingControl, portal | 116; 1 tenant orphan; all USD; mostly demo-marked | RETAIN, EXTEND |
| Payment | Provider intent + capture | `billing_payment_intents`, provider logs/events | `/billing/payments*`, provider webhooks | AccountingControl, portal | 10 simulated `demo_sim`, no provider events | RETAIN |
| Payment Allocation | Direct `payment_intents.invoice_id` and invoice paid amount | No allocation table | Capture directly updates invoice | BillingAdmin/AccountingControl | No allocation history; 10 sample intents link to existing invoices | NEW TABLE REQUIRED (if many-to-many/partial allocation is required) |
| Refund | Refund workflow and journals | `billing_refunds`, ledger/journal | `/billing/refunds*` | AccountingControl, portal | 5 simulated rows, all links resolve | EXTEND |
| Credit Note | Refund finalization posts credit journals and mutates invoice | No credit note table | Refund confirm/finalize | AccountingControl | 5 simulated refunds; no distinct credit note | EXTEND (credit-note record likely required for immutable invoice correction) |
| Reconciliation | Provider statement batches and match rows | `billing_reconciliation_batches`, `billing_reconciliation_items` | `/billing/reconciliation*` | AccountingControl | 10 simulated matched, none settled | RETAIN, EXTEND |
| Settlement | Batch status + intent settlement reference + journal | No settlement master/line table | Reconciliation settle action | AccountingControl | No settled real provider batches | EXTEND (new table only if payout identity/history needs independent lifecycle) |
| Accounting Journal | Double-entry postings | `accounting_journals`, `accounting_journal_lines` | `/billing/accounting/journals`, summary | AccountingControl | 130 balanced in snapshot; 100 demo invoice sources | RETAIN |
| Tax | Tax field on invoice payload / simulation only | No tax tables | Invoice creation paths | Billing/portal displays invoice | Tax field present 116; no tax rule evidence | GAP — DESIGN REQUIRED (jurisdiction dependent) |
| Currency / FX | USD accounting base, display conversion rate book | `platform_currency_settings`, `billing_fx_rates`, `billing_fx_rate_history` | `/currency/config`, display currency | Portal, Admin Settings, AccountingControl | USD only FX rate/history; current financial rows USD | RETAIN, EXTEND only if transaction conversion is required |

## 11. Minimum-change schema recommendation

### Already sufficient for observed behavior

- Keep tenants, applications, API keys and the tenant-usage table as the current service-identity and usage evidence path.
- Keep licensing plan/license tables and the associated gateway enforcement while the recurring authority is clarified.
- Keep product/order, invoice/ledger, payment intent/provider event/refund, reconciliation batch/item, accounting journal/line, and FX tables. They already represent meaningful working paths and populated history.
- Do not create duplicate customer, order, invoice, payment, reconciliation, or journal ledgers.

### Extend existing tables/services

- Additive order/invoice source references only if production rows and API use can be mapped deterministically. Avoid retroactive `order_id` guesses.
- Extend the existing product/order path with immutable price/order version references if accepted quote/contract and audit requirements are approved.
- Keep `tenant_licenses` as a compatibility projection while subscription/entitlement authority and Stripe-vs-ALTIL billing source are resolved.
- Extend `tenant_key_usage` idempotency and price attribution only after inspecting write behavior and production duplicate patterns.
- Extend the current reconciliation/settlement relationship if explicit payout lifecycle data is required; do not create a settlement table solely because it appeared in the conceptual model.
- Preserve FX snapshot linkage only for actual transactions that perform conversion. Current display currency behavior does not require revaluing historical invoice/journal data.

### New table genuinely indicated by current implementation gap

1. **Payment allocations**, conditional on supporting split/partial/reallocation/unapplied cash. The existing nullable single invoice pointer on payment intents cannot represent many-to-many allocation or append-only reallocation history. Check production payloads before final schema.
2. **Quote/contract version records**, conditional on enterprise contracting/quoting being an approved workflow. Existing tenant metadata and UI defaults do not provide immutable offer/acceptance history.
3. **Legal entity/billing account hierarchy**, conditional on evidence that customer accounts bill as distinct legal parties/accounts. No current normalized model can safely encode those relationships; validate real tenant semantics before sizing this schema.
4. **Credit-note record**, conditional on formal credit notes/adjustments being required. Current refund finalization mutates the original invoice and posts journals; that is insufficient to preserve an issued invoice unchanged.
5. **Rated charge record**, conditional on usage becoming invoiceable with reproducible price/version audit. Raw usage plus `amount_usd` is not enough to recover a price version and invoice line lineage.

Tax tables, provisioning jobs, generic idempotency operation tables, cost-centre tables, settlement master records, and broad commercial party tables are **not approved by this validation alone**. Reuse an existing jobs/audit/identity facility if suitable; otherwise create only after requirements and production data establish the need.

### Legacy compatibility and overlap

- Keep `/api/v1/billing/*` as the compatibility facade. Move service ownership only after route and consumer mapping.
- Preserve `tenant_licenses` reads/enforcement until billing-cycle and Stripe webhook paths map to canonical subscriptions.
- Merge screen navigation/sections, not financial data stores: BillingAdmin (invoice/ledger), FinanceCommerce (catalogue/orders), and AccountingControl (refund/reconciliation/journals) should be exposed through one Finance workspace. Do not remove any action in this validation phase.
- Keep FinOps as usage reporting; join to rated charges only if/when those exist.

## 12. Remaining evidence required before schema implementation

The production baseline is **not complete** because the configured database is loopback and clearly contains simulator records. Before writing Phase 3 migrations:

1. Obtain an approved, read-only connection to the actual production database (or a recent sanitized production snapshot) and identify its environment without disclosing credentials.
2. Re-run the count, schema, relationship, status/currency/provider, orphan, duplicate, balance, and source-lineage checks against that target. Keep row-level values out of the report.
3. Confirm whether a deployment scheduler or external operator invokes `/billing/cycles/run`; inspect deployment manifests/job configuration that is not in this checkout.
4. Confirm real Stripe/PayFast/iKhokha event behavior from persisted provider events/logs and provider configuration owners; do not run live payments or refunds as validation.
5. Inspect safe, redacted invoice/payment payload shapes for actual allocation, order links, tax details and source references; aggregate-only checks cannot prove payload semantics.
6. Resolve the one orphan invoice in the local snapshot by source investigation only; do not alter it.
7. Confirm required jurisdictions, legal-entity billing, credit-note policy, partial/unapplied cash policy and the owner of subscription renewal before approving any new schema.

## 13. Preservation / non-actions

This phase changed no application code, API contract, database object, migration, provider setting, invoice, payment, refund, reconciliation record, journal, balance, or source data. No service endpoint was invoked to create or process business records. No tests or build were run because the mandate is read-only discovery. Existing working-tree modifications were left intact.
