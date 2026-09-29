# ALTIL Commercial Platform — Architecture Discovery

**Status:** Phase 1 discovery report  
**Repository:** `horatiointro/Introsoft_admin` working copy  
**Date:** 2026-09-28  
**Scope:** Existing commercial, billing, ordering, payment, accounting, customer and usage implementation. This is a source inspection, not a runtime certification; database-backed workflows require a connected MariaDB instance and appropriate credentials.

## Executive summary

ALTIL is an existing React 19 + TypeScript + Express 4 + MariaDB application, not a blank platform. Its commercial foundation includes tenant licensing, usage metering, product catalogue and orders, invoices and ledger entries, payment intents and provider events, saved payment methods and schedules, refunds, reconciliation batches, accounting journals, FX rates, a tenant billing portal, and a payment-provider abstraction for Stripe, PayFast and iKhokha.

The main architectural gap is not absence of all commerce. It is fragmentation and incomplete linkage: older licensing records, newer orders, invoices/payments, usage and accounting coexist with different models and screens. Several financial screens overlap. Orders currently have a comparatively small lifecycle, and the inspected schema does not yet express the full organisation → legal entity → billing account → contract/quote → order → subscription/entitlement → rated usage → allocation → settlement chain as relational business objects.

The immediate UI direction should be consolidation, not more primary navigation: retain the existing Finance workspace as the single admin entry point; bring Orders & Products, billing, invoices, refunds, reconciliation/settlement and accounting under it as contextual sections; connect customer records to these through Customer 360. Keep AI usage/FinOps accessible from the existing Usage/FinOps area and cross-link it to customer and invoice context.

## Repository and runtime structure

| Area | Existing implementation |
|---|---|
| Frontend | `src/App.tsx` owns shared application state, API loading and screen dispatch; `src/components/` contains screens and shared UI; Vite builds the React app. |
| Navigation | `src/components/Sidebar.tsx`; sections currently include Overview, Customers, Finance, AI platform, Operations, and Trust & governance. Finance is already a parent workspace with nested account, order, product, billing, invoice, refund, settlement and accounting entries. |
| API server | `server.ts` is the large Express API and static server. It contains the commercial routes and much of the billing domain logic. |
| Routers | `src/routes/` has dedicated auth, compliance, ITIL, trust-fabric and DCR routers. Commercial endpoints are primarily registered in `server.ts`. |
| Data access | `src/db/mariadb.ts`, `src/db/migrator.ts`, and domain repositories such as `iamRepository.ts`, `itilRepository.ts`, `dcrRepository.ts`, and `complianceRepository.ts`. Commercial persistence is largely direct SQL in `server.ts`. |
| Schema | Ordered SQL migrations `001`–`023`; migration runner tracks version and checksum. Do not edit applied migrations; add forward migrations. |
| UI seed/fallback data | `src/data/initialState.ts`, `src/data/licensingData.ts`, and related data files. Some screens support demo/in-memory fallback, so visible sample values are not necessarily live database evidence. |
| Existing project notes | `docs/IMPLEMENTATION_BASELINE.md`, `docs/PROJECT_OVERVIEW_AND_SCREENS.md`, `docs/MARIADB_DEPLOYMENT.md`, OpenAPI at `docs/openapi.yaml`. Existing docs already describe hybrid/live/demo data boundaries. |

## Existing navigation and commercial UI

The sidebar already groups many financial tasks under **Finance → Finance workspace** with children for Accounts, Orders, Products & pricing, Billing, Invoices, Refunds & credits, Settlement & reconciliation, and Accounting (with chart/journals). This is a useful base for the target Commerce & Finance workspace and avoids adding top-level entries.

Related screens outside that group currently overlap:

| Screen | Current role and evidence | Assessment |
|---|---|---|
| `BillingAdminView.tsx` | Loads `/billing/invoices` and `/billing/ledger`; creates/issues invoices, applies payment/ledger actions. | Existing canonical billing/invoice operations should be retained and extended. |
| `FinanceCommerceView.tsx` | `mode='orders'|'products'`; calls `/billing/products` and `/billing/orders`; creates/cancels orders and manages catalogue. | Existing canonical catalogue/order screen; should become contextual Orders and Catalogue sections in Finance. |
| `AccountingControlView.tsx` | Loads finance summary, invoices, journals, reconciliation, payment intents and refunds; imports provider statement rows, matches and settles reconciliation items, processes refund actions. | Strong operational accounting/settlement surface; consolidate with BillingAdmin navigation, not duplicate its functions. |
| `FinOpsView.tsx` | AI usage/provider cost and budget view. | Related to usage/rating and should remain available from Usage/FinOps, with Customer 360 drill-through; avoid a second finance ledger. |
| `LicensingMonetizationView.tsx` | Plan templates, tenant/application licenses and webhook/licensing status. | Existing subscription-like capability. Map and migrate carefully into canonical subscriptions/catalogue; preserve enforcement behavior. |
| `Tenant360View.tsx` | Customer/tenant operational diagnostics and customer detail. | Existing 360 concept, but not yet the complete commercial/financial relationship view. Extend with related commercial tabs/drilldowns. |
| `TenantPortalView.tsx` | Customer-scoped portal; loads tenant profile, invoices, payment methods, schedules, payments, refunds and currency; supports display currency, key limits, checkout and consented schedules. | Reuse as the self-service workspace and evolve in place; APIs must enforce tenant scope. |
| `CustomersView.tsx` / `OrgHierarchyView.tsx` | Customer CRUD/onboarding, customer actions and organization tree. | Reuse for customer/organisation identity; do not create a competing customer directory. |

The existing layout is already a small number of high-level groups, but Finance has deep nested detail and some related capability is outside it (tenant licensing, FinOps, customer portal). Consolidate by contextual workspace and links rather than flattening those child functions into top-level navigation.

## API and service inventory

Commercial APIs are principally in `server.ts` under `/api/v1` and use `requireAuthentication`, role checks and tenant access helpers. Inspected routes include:

| Capability | Existing API/service evidence |
|---|---|
| Products and orders | `/billing/products`, `/billing/orders` list/create, order cancellation; `createBillingOrderRecord` validates product/quantity/currency and writes order + lines in a transaction. Cancellation updates order status and deactivates lines. |
| Invoices and ledger | `/billing/invoices` list/create/issue/payment and `/billing/ledger`; invoice persistence and journal posting are present in the server. |
| Payments | `/billing/payments`, checkout, payment-method setup and schedules; payment intent records track provider, amounts, captured amount, fees and settlement reference. |
| Provider integrations | `src/utils/paymentGateways.ts` exposes hosted checkout and signature verification utilities for Stripe, PayFast and iKhokha. Provider secrets are read from environment; implementation explicitly avoids raw card storage. Provider capability/configuration still needs environment-level verification. |
| Refunds | `/billing/refunds` and approve/confirm actions; persisted refund linked to invoice and payment intent. |
| Reconciliation/settlement | `/billing/reconciliation`, statement import, item match and settle operations. Schema supports batches/items and payment intent linkage. |
| Accounting | `/billing/accounting/journals` and accounting summary; double-entry journal and lines tables exist, with source uniqueness. Validate balance invariants and completeness before treating as production subledger. |
| Licensing | `/licensing/plans`, `/licensing/tenant-licenses`, updates, payment webhooks and gateway verification. License status gates gateway usage. |
| Customer portal | `/tenant-portal/:id`, scoped customer APIs, tenant-scoped invoice/payment services, display currency and API-key limits. |
| Usage | `tenant_key_usage` and `tenant_api_keys`, plus in-memory/provider telemetry paths; inspect specific data provenance before treating dashboard totals as billable rated usage. |

`docs/openapi.yaml` exists, but the checked-in route code is broader and newer in places; API coverage and versioning should be reconciled as part of follow-on work. `server.ts` centralizes commercial operations rather than delegating to focused commercial domain services. Business behavior should move incrementally into tested services while API contracts remain backward compatible.

## Commercial data model already present

| Domain | Existing tables/entities | Current coverage and limitations |
|---|---|---|
| Customer / tenant | `tenants`, `tenant_applications`, metadata, tenant API keys and usage. | Tenant is the main scope/customer identity. The commercial distinction between customer, organisation and legal entity is not represented as a first-class hierarchy in the inspected migrations. |
| Licensing/subscription-like | `licensing_plans`, `tenant_licenses`. | Plan + tenant/application license state and billing cycle; not the full subscription lifecycle, versioned amendments, or order-derived entitlement model. |
| Catalogue/orders | `billing_products`, `billing_orders`, `billing_order_lines` (migration 023). | Product price/currency and order totals/lines exist. Order schema has tenant, source and status, but quote/contract/legal entity/PO/approval/version/effective-date links are absent from these relational columns. Order payload also includes JSON. |
| Invoices/AR ledger | `billing_invoices`, `billing_ledger_entries` (015). | Invoice and activity ledger with decimal amounts, status, currency and tenant. Invoice payload carries detailed lines. |
| Payment | `payment_provider_events` (018), `billing_payment_intents`, `billing_refunds`, `billing_payment_methods`, `billing_schedules` (019), legacy webhook log. | Payment lifecycle, method token ciphertext, consent evidence and provider event dedupe are represented. Explicit invoice payment allocation history is not evident as a distinct allocation table. |
| Reconciliation/settlement | `billing_reconciliation_batches`, `billing_reconciliation_items`. | Provider import/matching/settlement path exists. Settlement is currently represented via reconciliation status and payment intent metadata; assess needs for explicit settlement records and fees/FX details. |
| Accounting | `accounting_journals`, `accounting_journal_lines`. | Operational double-entry subledger foundation. Keep positioned as subledger/export capability, not a full ERP/GL. |
| Currency / FX | `platform_currency_settings`, `billing_fx_rates`, `billing_fx_rate_history` (020). | Platform defaults, current rates and rate history; usage docs say display preference does not mutate issued amounts. Confirm immutable rate references on every transaction before extending accounting. |
| Audit / identity | `audit_logs`, IAM users/roles/scopes/sessions/MFA tables. | Audit and role foundation exists; audit coverage and object-level authorization need workflow-by-workflow verification. |
| Tax / contract / quote / hierarchy | No first-class tables found in migrations 001–023 for tax registrations/rates, contracts, quote versions, billing accounts, legal entities, departments, cost centres, payment allocations or entitlements. | These are genuine gaps or may exist only in JSON/in-memory state; verify against the full runtime DB before designing migration. |

Core financial records are a mix of typed columns and JSON payloads. Continue using typed relational columns, foreign keys and immutable history for new canonical relationships; do not rewrite the existing migration history or presume payload JSON is a durable substitute for relational traceability.

## Capability classification

This classification is based on repository implementation evidence, not production usage telemetry.

| Capability | Classification | Evidence / qualification |
|---|---|---|
| Tenant/customer CRUD and portal | Implemented and used (DB-backed paths exist) | Customer routes and portal endpoints/components exist; prior baseline notes identify DB-backed CRUD. |
| Licensing and plans | Implemented and used | Persisted plans/licenses, webhook handling and gateway enforcement exist. Different model from newer order/catalogue flow. |
| Catalogue and orders | Implemented, partial lifecycle | Persisted products/orders/lines and create/cancel UI/API. No complete approval, acceptance, fulfilment, amendment/version workflow found. |
| Invoices, payment intents, provider checkout | Implemented and used, partial enterprise flow | Invoice/payment APIs, provider abstraction and portal actions exist. Allocation model and complete commercial source links remain unclear/missing. |
| Refunds | Implemented, operational workflow partial | Refund record and admin approve/confirm screen actions exist; verify provider execution and accounting effects per provider. |
| Reconciliation and settlement | Implemented, partial | Import/match/settle UI/API and tables exist. Validate duplicate handling, fee/net matching, explicit settlement records and accounting linkage. |
| Accounting subledger | Implemented, partial | Journals and lines exist. Verify balanced posting constraints and all relevant event coverage. |
| FX/display currency | Implemented, partial | Rate/settings/history tables and portal preference exist. Historical transaction linkage to immutable rates needs confirmation. |
| AI usage/FinOps | Implemented, mixed provenance | Usage and FinOps screens/data exist. Do not assume all displayed usage is normalized, rated, invoice-linked production usage. |
| Customer 360 | Partial | Tenant 360 operational view exists; the full commercial chain is not yet navigable there. |
| Customer organization model | Partial | Organization tree exists, but no migrated canonical legal entity/billing account/department/cost-centre records were found in migrations. |
| Quotes, contracts, order amendments, explicit entitlements, rating/charge ledger, payment allocation, tax, collections/credit control | Not implemented as first-class canonical domains in inspected migrations | Treat as new capabilities to design against existing data and APIs, avoiding duplicate invoice/payment/order engines. |

## Target mapping and UI migration plan

| Target capability | Existing owner to preserve | Action |
|---|---|---|
| Commerce & Finance overview/accounts/catalogue/orders/invoices/payments/refunds/settlement/accounting | Finance workspace in `Sidebar.tsx`; `BillingAdminView`, `FinanceCommerceView`, `AccountingControlView` | Consolidate navigation and shared customer context. Retain each working workflow behind workspace sections/tabs. Establish one entry and shared drilldown pattern; do not create a second billing or accounting screen. |
| Customer 360 | `Tenant360View`, `CustomersView`, `OrgHierarchyView` | Extend current customer context with contextual commercial, usage, security and operations panels; use real APIs and permission-aware links. |
| Customer self-service | `TenantPortalView` | Extend current portal around account, organisation, services, usage, orders and billing. Keep tenant-scoped API authorization as the security boundary. |
| Plans/subscriptions and entitlements | `LicensingMonetizationView`, licensing APIs/tables, product/order services | Map current licenses and orders before migrating. Evolve plan/license enforcement toward subscription/entitlement services without turning off the working license gate. |
| Usage and rating | `FinOpsView`, tenant usage/key metering | Preserve FinOps as usage workspace; introduce normalized, attributable, idempotent rating and charges linked to product price version and customer object hierarchy. Link back to Commerce & Finance/Customer 360. |
| Contracts/quotes/legal entities/billing accounts/cost centres/tax/allocation | No first-class owner identified | Add as canonical domains only after data/API mapping, with forward migrations and explicit links into the existing invoice/payment/accounting path. |

**How the architecture avoids menu clutter:** retain the current primary groups and make the existing Finance workspace the one admin home for commercial and financial work. Use nested workspace sections, list-to-detail navigation, contextual customer tabs/drawers, and cross-links from Customer 360/FinOps. Do not add top-level items for quotes, contracts, subscriptions, reconciliation, settlement, tax or allocation. Customer self-service remains a scoped portal experience, not the admin menu exposed to customers.

## Phased implementation recommendation

1. **Domain/API mapping:** inventory actual route contracts and production DB schema/data; map `tenant_licenses`, `billing_orders`, invoices, payment intents, provider events, reconciliation and journals into a canonical relationship diagram. Identify duplicate behavior and compatibility needs.
2. **Navigation and Customer 360 consolidation:** make the existing Finance parent the cohesive workspace; connect customer, orders, subscription/license, usage, invoice, payment, reconciliation and accounting details with permission-aware drill-down. Preserve current actions and portal behavior.
3. **Canonical relational extensions:** add forward-only migrations for the minimum required organisation/legal-entity/billing-account and immutable quote/contract/order version/entitlement/pricing references; backfill legacy records conservatively and retain source identifiers.
4. **Domain services and APIs:** move server-side rules out of `server.ts` incrementally; add versioned APIs and idempotency/audit for commercial transitions; preserve current endpoints during migration.
5. **Financial traceability:** introduce explicit rated charge and payment allocation history; harden reconciliation/settlement and balanced subledger posting; attach FX/tax snapshots to financial records and provide ERP/GL export where supported.
6. **Portal, reporting and lifecycle verification:** expose the same APIs to scoped customer roles, add exports and real-data reporting, then test individual, SMB, enterprise and multinational journeys end to end with seeded/test data and migration validation.

No significant application code changes were made during this discovery phase. Existing working-tree edits observed before inspection (`src/App.tsx`, `src/components/Sidebar.tsx`, `src/data/helpTopics.ts`, and untracked `src/components/ApiDocumentationView.tsx`) were left untouched.

## Discovery limits / next evidence needed

- The local MariaDB schema and production data were not queried, so migration presence does not prove every migration has been applied or that a route is exercised in production.
- Payment gateway credentials and live/sandbox settings were not tested; only source implementation was inspected.
- There is no test suite command configured in `package.json`; this phase intentionally did not add or run tests.
- Before Phase 2, inspect `server.ts` route behavior in detail and compare it with `docs/openapi.yaml`, verify migration status in a safe development database, and confirm real use of billing/licensing paths from audit and operational data.
