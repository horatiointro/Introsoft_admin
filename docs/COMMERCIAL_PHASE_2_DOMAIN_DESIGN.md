# ALTIL Commercial Platform — Phase 2 Domain, Schema and UI Design

**Status:** Proposed design only; no application code or database migrations are included.  
**Prerequisite:** [Phase 1 Architecture Discovery](./COMMERCIAL_ARCHITECTURE_DISCOVERY.md)  
**Date:** 2026-09-28

## 1. Design decisions

1. Keep `tenants` as the existing security and service-runtime scope during migration. Do not rename it or overload it to represent a legal entity, billing account, or end user.
2. Introduce commercial parties and their hierarchy as explicit relational records. A customer may be an individual or an organisation; an organisation may own multiple legal entities, departments, cost centres, applications, and billing accounts.
3. Preserve existing order, invoice, payment, reconciliation, and journal identifiers. New relationships should be additive and legacy-compatible; never rebuild those ledgers or rewrite applied migrations.
4. Make accepted commercial history immutable. Amendments create new versions/effective-dated records. Current state is a projection of accepted versions and events.
5. Reuse one invoice/payment/accounting path. Usage/FinOps should produce attributable rated charges for that path rather than a parallel financial ledger.
6. Keep the existing Finance workspace as the sole admin commercial entry. Customer 360 is the cross-domain context, not another route family in the top-level menu.
7. This proposal is logical design. Names below are suggested names and require validation against live schema, naming conventions, data volumes, and applied migration status before Phase 3.

## 2. Canonical domain and relationships

```text
Customer (individual or organisation account)
  └─ Organisation (optional for individual customer)
      ├─ Legal Entity
      │   └─ Billing Account (invoice recipient, currency, terms)
      ├─ Department / Business Unit / Cost Centre
      ├─ Users, Applications, API Consumers, Service Accounts
      └─ Contracts
          ├─ Quotes → immutable Quote Versions → Acceptance Evidence
          └─ Orders → immutable Order Versions / Lines
              ├─ Subscription(s) → Entitlement grants → Provisioning
              └─ Charges from attributable usage

Product → Product Version → Price Version ───────────────┐
Usage Event → Normalised Usage → Rating → Charge ────────┤
                                                         ↓
                                                   Invoice → Payment Intent/Capture
                                                   Credit Note  ↓
                                                           Allocation(s)
                                                               ↓
Provider Event → Reconciliation Batch/Item → Settlement → Accounting Journal
```

### Ownership and cardinality rules

- A customer is the commercial relationship and external account identity. It may map to an individual profile or own an organisation.
- An organisation is the corporate grouping. A legal entity is the registered party responsible for a transaction or tax obligation. Do not infer one from the other.
- A billing account belongs to one legal entity and has one billing currency and invoice policy at a time. Consolidated invoicing across entities must be an explicit billing policy and retain per-entity invoice/ledger attribution.
- A tenant remains the isolation boundary for existing services and API keys. During transition, commercial records reference both the canonical customer/billing account and the legacy `tenant_id` where required. Cross-tenant party mapping must be explicit and audited.
- Quotes and contracts can be associated with a customer, organisation, legal entity, and billing account. An accepted quote version can create an order without re-keying the price snapshot.
- An order may have multiple versions and lines. It creates or changes subscriptions and provisioning. Cancellation/amendment does not erase prior accepted versions or financial effects.
- A subscription records the commercial service period and status. Entitlements are derived grants with their source order line, contract/product version, scope, effective window, and revocation history.
- A usage event is immutable source evidence. Normalisation/rating is separately repeatable and idempotent. A charge retains the price version, rate inputs, attribution and source usage reference used at rating time.
- An invoice is issued against a billing account and retains its transaction currency and line snapshots. Payment is cash movement; allocation is a separate auditable relationship between payments/credits and invoices.
- Reconciliation compares provider/bank evidence to payment intents and settlement records. Journal posting remains the accounting subledger representation, not an ERP general ledger.

## 3. Existing schema disposition

| Existing tables | Disposition | Planned role and migration notes |
|---|---|---|
| `tenants`, `tenant_applications` | **Retain and extend** | Preserve tenant isolation and app links. Add an explicit mapping to the commercial customer/organisation model only after resolving existing tenant records. Keep IDs stable for API keys and service usage. |
| `tenant_api_keys`, `tenant_key_usage` | **Retain and extend** | Keep credential and metering source history. Add explicit application, service account, cost-centre, and user attribution where available; do not retrofit guessed attribution. |
| `licensing_plans`, `tenant_licenses` | **Retain during transition; extend, then deprecate as the write owner** | Preserve gateway enforcement and current licenses. Add a mapping from each license to canonical product/subscription/entitlement records. New commercial changes should eventually write through subscription/entitlement services. Retire direct license editing only after parity, backfill, reconciliation, and rollback windows are demonstrated. |
| `billing_products` | **Retain and extend** | Canonical catalogue identity/SKU. Add normalized product type and price-version references through child records; existing price columns remain the legacy/current display projection, not historical transaction evidence. |
| `billing_orders`, `billing_order_lines` | **Retain and extend** | Preserve IDs/order numbers and existing source links. Add typed links to customer, legal entity, billing account, quote version, contract, parent/amendment, and order version. Keep accepted line snapshots immutable. Existing JSON stays for compatibility during migration, not as the new relationship authority. |
| `billing_invoices`, `billing_ledger_entries` | **Retain and extend** | Preserve issued invoice and ledger history. Add billing-account and source-charge references; retain line/amount/currency snapshots. Do not regenerate already-issued invoices from current catalogue prices. |
| `billing_payment_intents`, `billing_payment_methods`, `billing_schedules` | **Retain and extend** | Keep provider abstraction, tokenized method metadata and consent evidence. Add explicit allocation references and idempotency keys/operation records only after checking existing payloads/unique constraints. |
| `payment_provider_events`, `payment_webhook_logs` | **Retain** | Preserve event deduplication/audit. Use provider event IDs as evidence and make processing status/retry behavior explicit; do not discard legacy webhook history. |
| `billing_refunds` | **Retain and extend** | Keep refund-to-payment/invoice relationships and provider confirmation evidence. Link resulting credit note and accounting posting. Separate requested refund from successfully completed cash refund. |
| `billing_reconciliation_batches`, `billing_reconciliation_items` | **Retain and extend** | Preserve imported statement data and match decisions. Add explicit settlement record and journal source linkage; retain unmatched/duplicate exceptions and source file metadata. |
| `accounting_journals`, `accounting_journal_lines` | **Retain and extend** | Canonical operational subledger. Enforce balanced posting in service/transaction boundaries and add export references. Preserve posted entries immutably; corrections use reversing/adjusting journals. |
| `billing_fx_rates`, `billing_fx_rate_history`, `platform_currency_settings` | **Retain and extend** | Keep current rates and rate history. Add immutable rate-history ID/source references to any new multi-currency financial transaction requiring conversion. Never alter posted historical values using a current rate. |
| `audit_logs` | **Retain and extend** | Use for actor and request context where it meets retention and immutability requirements. Add domain-specific audit records or an append-only change log if global audit payload shape cannot support before/after values and correlation requirements. |
| IAM tables (`iam_users`, roles, permissions, role assignments, sessions, MFA) | **Retain and extend** | Keep identity platform. Add scoped permission codes for commercial actions; enforce object-level authorization in APIs, not just visibility in React. |

No existing core commercial table is proposed for deletion in the initial rollout. “Deprecate” means stop creating new records through the legacy pathway only after a dual-read/cutover plan and validation; it does not mean erase financial or licensing history.

## 4. Proposed new relational records

Suggested logical tables below are additive and require schema validation. Exact normalization can be adjusted in Phase 3 without changing the relationships or immutability rules.

| New record/table (suggested) | Purpose and key relationships |
|---|---|
| `commercial_customers` | Stable customer identity and customer type (`individual`, `organisation`); tenant mapping is explicit. |
| `commercial_organisations` | Organisation hierarchy and parent-child corporate structure. |
| `commercial_legal_entities` | Registered party, country, registration/tax identifiers, status; belongs to organisation/customer. Sensitive identifiers need protection and access limits. |
| `commercial_billing_accounts` | Bill-to account, legal entity, invoice currency, payment terms, invoice policy, credit controls. |
| `commercial_cost_centres` (and optional `commercial_org_units`) | Scoped departments/business units/cost centres; parent-child hierarchy and stable customer codes. |
| `commercial_contracts`, `commercial_contract_versions` | Contract identity, parties, term, renewal, notice, payment terms and accepted immutable amendments. |
| `commercial_quotes`, `commercial_quote_versions`, `commercial_quote_acceptances` | Quote header, immutable priced line snapshots, validity/approval and acceptance actor/time/evidence. |
| `billing_order_versions`, `billing_order_amendments` | Immutable order snapshots, reasons, effective dates, approval/acceptance and predecessor links. Existing `billing_orders` remains stable identity. |
| `billing_product_versions`, `billing_price_versions` | Effective-dated immutable catalogue and pricing snapshots; pricing method/unit/currency/rules are structured and validated. Existing product is stable identity. |
| `billing_subscriptions`, `billing_subscription_versions` | Subscription state and effective-dated plan/product/order lineage; supports recurring, usage and hybrid service periods. |
| `billing_entitlements`, `billing_entitlement_events` | Explicit entitlement grants and changes with source contract/order/subscription, target scope, limit, effective window and revocation. |
| `billing_provisioning_jobs` | Idempotent order-to-entitlement/application provisioning status, retries and failure evidence. Reuse a shared jobs subsystem if one is verified. |
| `usage_events` or a compatible normalized usage record | Immutable billable event reference, tenant/customer/account, source key, occurred/received times, metric, quantity, units, dimensions and idempotency key. Existing metering source remains authoritative until a backfill/dual-read is validated. |
| `billing_ratings`, `billing_charges`, `billing_charge_adjustments` | Rating run and charge evidence: source usage, price version, rating inputs, amount, currency, attribution and invoice state. Adjustments are additive/reversing records. |
| `billing_payment_allocations`, `billing_payment_allocation_events` | Full/partial/multiple invoice allocation, unapplied cash, overpayment and reallocation history. Allocation events are append-only; current allocated balance is derived. |
| `billing_credit_notes` and credit allocations | Formal invoice credit/adjustment record, distinct from a gateway cash refund; linked to source invoice, reason, approval and journal. |
| `billing_settlements`, `billing_settlement_lines` | Explicit provider payout/bank settlement identity and gross, fees, net, currency, dates, source reconciliation batch and accounting posting. |
| `tax_jurisdictions`, `tax_codes`, `tax_rates`, `tax_registrations` | Effective-dated tax configuration and customer/legal-entity exemptions; invoice line tax snapshots store applied code/rate/amount. Do not hard-code jurisdiction logic in UI. |
| `commercial_idempotency_operations` (or equivalent) | Durable operation key, domain action, scope and outcome for retries on create/accept/issue/capture/refund/allocate/reconcile/provision. Reuse existing provider idempotency where sufficient. |

### Core invariants

- Monetary columns use fixed precision and ISO currency codes. A record has one transaction currency; cross-currency totals are never silently summed.
- Status values are constrained in domain services and database constraints where MariaDB compatibility supports them.
- Every immutable commercial/financial version includes effective/created timestamps, actor/source, and a stable version number.
- All external callbacks, acceptance actions, issue/capture/refund/allocation/settlement/provisioning operations are idempotent by scope and operation key.
- Invoice, payment, credit, refund and journal references are navigable in both directions with foreign keys where lifecycle retention allows. Where cross-domain reference cannot use a hard FK safely, use typed reference columns plus consistency reconciliation.
- Tenant scoping remains a mandatory security predicate. Customer/account visibility never derives solely from a client-supplied ID.

## 5. API and service boundaries

### Target modular boundaries (within the existing application)

| Domain service | Owns |
|---|---|
| Customer/organisation | Customer identity, hierarchy, legal entities, billing accounts, users/apps/cost-centre relationships. |
| Catalogue/pricing | Product identity, immutable product/price versions, effective dates and price resolution. |
| Quote/contract/order | Quote versioning/acceptance, contract lifecycle, order acceptance/amendment/cancellation and commercial snapshots. |
| Subscription/entitlement/provisioning | Service state, derived grants, provisioning job execution and recoverable failures. |
| Usage/rating/charge | Event validation, normalization, attribution, rating and charge lineage. |
| Billing/AR | Invoice generation/issue, credit notes, balances and collection controls. |
| Payments | Existing Stripe/PayFast/iKhokha abstraction, payment intents, saved token/method consent, captures/refunds. |
| Allocation/reconciliation/settlement | Cash allocation, provider statement matching, payout records, fees and settlement journals. |
| Accounting/export | Balanced subledger postings, source mapping and external ERP/GL export. |

Keep the current `/api/v1/billing/*` routes compatible as facades while logic is moved behind services. Add versioned commercial APIs only where a new contract is needed; update `docs/openapi.yaml` alongside each route. Customer portal and admin call the same domain APIs with different object-level authorization scopes. UI code handles rendering, input feedback, and navigation only.

### Transition policy

- Preserve current endpoints and payloads during the first release of canonical entities.
- Translate old tenant-based requests into explicit commercial IDs server-side; reject ambiguous mappings rather than guess.
- Return stable legacy fields until existing screens/consumers are migrated.
- Dual-read only for reconciliation and cutover verification; avoid unbounded dual-write. Every backfill has counts, checksums/financial totals and an auditable mapping table.
- Apply forward-only migrations. Never edit migrations 001–023 after application.

## 6. UI consolidation disposition

| Existing UI/component | Disposition | Target experience |
|---|---|---|
| Finance parent and nested nav in `Sidebar.tsx` | **Retain and merge navigation entries** | One “Commerce & Finance” workspace entry (label may change from Finance after compatibility review) with compact sections: Overview, Customers & accounts, Catalogue, Quotes & contracts, Orders & subscriptions, Usage & charges, Invoices & payments, Reconciliation & accounting, Reports. These are workspace sections, not new top-level routes. |
| `FinanceCommerceView.tsx` | **Retain component capability; merge into canonical workspace shell** | Preserve product CRUD, order placement and cancellation. Split internally into catalogue/order panels or tabs as needed; add quote/order lifecycle only when backed by APIs. No parallel catalogue/order component. |
| `BillingAdminView.tsx` | **Retain invoice/ledger workflows; merge its overlapping summary/actions** | Invoice list, draft/issue and billing activity become the invoice/account area within the workspace. Reuse its APIs/actions. |
| `AccountingControlView.tsx` | **Retain reconciliation/journal/refund workflows; merge under workspace** | Its operational subviews become reconciliation, accounting, and credits/refunds sections. Avoid a second finance overview and duplicate invoice list. Keep reconciliation actions contextual and permission-gated. |
| `FinOpsView.tsx` | **Retain as Usage workspace; extend links** | Keep provider/AI cost, budgets and usage analysis. Add customer/account/application/cost-centre drilldown to rated charges. Do not move provider cost accounting into another UI. |
| `LicensingMonetizationView.tsx` | **Retain during migration; merge subscription ownership** | Plan/license support appears as Products/Subscriptions context. Keep a legacy license administration view reachable by authorized admins until migration verification; then deprecate duplicate editing. Preserve gateway enforcement visibility. |
| `Tenant360View.tsx` | **Retain and extend** | Customer 360 context gains Overview, Organisation, Services, Usage, Orders/subscriptions, Billing, Security and Operations panels. Use selected-customer context and direct object links; do not duplicate each global finance register. |
| `CustomersView.tsx`, `OrgHierarchyView.tsx` | **Retain and extend** | Keep customer directory/onboarding and hierarchy as the customer workspace entry. Selecting a customer opens its Customer 360 context. Legal entities and billing accounts are detail panels when available. |
| `TenantPortalView.tsx` | **Retain and extend** | Scoped customer portal consolidates account, people/access, applications, services, orders/subscriptions, usage/spend and invoices/payments. Same API and domain services as admin, with strict tenant/account scope. |
| Standalone navigation IDs for `billing_*`, `accounting_*`, `tenant_licensing`, `finops` | **Merge/alias, then selectively deprecate IDs** | Existing URLs/state IDs continue to resolve during transition. Remove duplicate visible menu choices only after each destination opens the same canonical workspace section and deep links are verified. |
| New top-level “Quotes”, “Contracts”, “Subscriptions”, “Tax”, “Settlement” etc. | **Do not create** | Add contextual tabs, detail drawers, or filtered registers inside Commerce & Finance and Customer 360. |

### Proposed admin navigation (conceptual)

```text
ALTIL
├─ Overview
├─ Customers
│  ├─ Directory / organisation tree
│  └─ Customer 360 → selected customer → contextual tabs
├─ AI platform
├─ Usage (FinOps)
├─ Commerce & Finance
│  ├─ Overview
│  ├─ Customers & accounts
│  ├─ Catalogue & pricing
│  ├─ Quotes & contracts
│  ├─ Orders & subscriptions
│  ├─ Usage & charges
│  ├─ Invoices, payments & credits
│  ├─ Reconciliation & accounting
│  └─ Reports
├─ Operations
├─ Trust & governance
└─ Administration
```

Customer 360 provides cross-links and context; it does not add all its objects to the primary navigation. Super Admin, billing, finance, application, security and read-only roles see actions based on server-authorized scopes. Customer portal routes show only customer-authorized data and actions.

## 7. Migration and deprecation gates

1. **Baseline:** record applied migration versions, counts by status/currency, existing tenant→license→order→invoice→payment→journal relationships, and all unmapped/orphaned references in a non-production database.
2. **Additive schema:** introduce customer/organisation/legal-entity/account mapping plus versioned quote/contract/order/pricing relationships. Backfill only deterministic links; quarantine ambiguous rows for review.
3. **Compatibility:** expose canonical APIs behind existing routes. Ensure old requests still create equivalent records with stable IDs and audit trails.
4. **Read verification:** compare old and canonical counts/totals/statuses per tenant and currency; reconcile every exception. Financial totals must match exactly in source currency.
5. **UI cutover:** point existing menu IDs to consolidated sections; verify direct links, browser refresh/deep links, customer scope and role access. Keep legacy license administration read-only after canonical write parity.
6. **Write deprecation:** stop legacy writes only after one full billing cycle and successful operational rollback rehearsal (duration to be agreed with finance/operator owners). Keep legacy records queryable.
7. **Retirement:** only remove redundant UI/API write paths after consumers are inventoried and migrated. No historical invoice/payment/journal/usage/license records are deleted as part of this plan.

## 8. Decisions required before Phase 3

These questions affect schema and backfill and must be answered from production evidence/owners before migrations are written:

- Is a `tenant` always one ALTIL customer today, or can it already represent a division, reseller, or multi-entity group?
- Can one billing account consolidate invoices across legal entities, or must invoices always be entity-specific?
- Which source is authoritative for recurring product/seat billing today: `tenant_licenses`, `billing_order_lines`, billing schedules, or combinations?
- Which AI usage events are eligible for invoicing, and what is the authoritative event source/idempotency key?
- What is the actual payment allocation behavior in production, including overpayments, partial payments and unapplied cash?
- Which tax jurisdictions and invoice requirements are in the first supported release?
- Which roles may accept quotes/contracts, issue invoices, approve refunds, post settlements and export journals?
- What retention/immutability requirements and finance-approved rollback period apply to accepted contracts and posted books?

Until these are resolved, the canonical model and dispositions above are design intent, not a production data mapping or migration script.
