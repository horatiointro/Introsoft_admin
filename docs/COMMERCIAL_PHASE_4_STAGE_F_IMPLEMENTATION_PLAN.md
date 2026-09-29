# ALTIL Phase 4 Stage F — Commercial UI / Customer 360 Integration

**Status:** Documentation and implementation-readiness plan only.
**Architecture authority:** [Phase 4 Architecture Specification](./COMMERCIAL_PHASE_4_ARCHITECTURE_SPEC.md).
**Dependencies:** Stage A–E domain/API contracts and authorization decisions; UI only presents verified backend state.
**Authorization:** This plan does not authorize implementation.

## 1. Purpose and design principle

Consolidate commercial work into a coherent Finance workspace and extend existing Customer 360 and Tenant Portal contexts without a top-level menu for every commercial entity.

> Complexity belongs in architecture, not menu.

Stage F is a presentation/integration stage, not a new commercial authority. It must not create missing parties, contracts, orders, entitlements, charges or financial records from display state. Any UI screen reflects server-authorized APIs and explicit evidence status. Production data counts and source code do not establish which routes/views are deployed or used. The production snapshot contains one tenant/order context and zero captured invoices/payments/etc.; those point-in-time facts do not determine UI requirements or feature usage.

## 2. Target information architecture

### Finance workspace

Use one Finance workspace with contextual sections:

1. Overview
2. Customers & Accounts
3. Catalogue & Pricing
4. Quotes & Contracts
5. Orders & Subscriptions
6. Usage & Charges
7. Invoices / Payments / Credits
8. Reconciliation / Accounting
9. Reports

These are workspace sections/tabs, not separate top-level menu destinations. Preserve existing sidebar IDs and deep links as compatibility aliases until each destination has an approved replacement and is verified. Avoid two screens that create the same order/invoice/refund or show conflicting balances.

### Customer 360

Extend the existing selected-customer/tenant context with contextual panels: Overview; Organisation & Accounts; Users/Applications/Consumers; Governance & Trust; Services/Entitlements; Orders & Subscriptions; Usage & Charges; Invoices/Payments/Credits; Reconciliation/Accounting; Audit. Render a commercial relationship only when its server-side mapping is verified. Display unresolved/ambiguous status explicitly; do not label `tenant-altil-internal` a commercial customer or account.

### Customer Portal

Retain the existing tenant-scoped Tenant Portal. Present only objects authorized for the selected technical tenant/account mapping. If one account spans multiple tenants in a future approved model, cross-tenant views require explicit user authorization and API-enforced account scope, not a client-side selector alone. Keep self-service payment method/schedule/refund flows using existing APIs and policy.

### Contextual detail patterns

- **Tabs** for stable domains within Finance or Customer 360.
- **Detail pages/panels** for contracts, quote versions, subscriptions, entitlements, invoices, payment/allocations and settlements, with copyable stable IDs and audit timeline.
- **Drawers** for related-source context and concise read-only details from list rows.
- **Modals** only for bounded create/approve/cancel/accept actions that need explicit confirmation, authority, effective date and reason; legally binding acceptance may require a dedicated flow and legal review, not a generic modal.
- **Cross-links** connect order to accepted version, subscription, charges, invoice, payment, reconciliation and journal when those links exist. Missing relationship must display “not linked/unknown” rather than infer.
- **Status timeline** shows event source/time/actor/outcome; avoid exposing secrets, raw webhook payloads, prompts, private actor emails or unnecessary PII.

## 3. Existing view mapping

| Existing view | Current verified responsibility | Consolidated target | Preservation / risk |
|---|---|---|---|
| `FinanceCommerceView` | Product catalogue and order list/create/cancel. | Catalogue & Pricing; Orders & Subscriptions sections. | Preserve product/order IDs and existing action semantics. Do not turn recurring line into a subscription UI claim without backend evidence. |
| `BillingAdminView` | Invoice/ledger loading, invoice draft/issue, manual receipt and billing-cycle action. | Invoices / Payments / Credits. | Preserve invoice IDs/numbers and current billing actions. Avoid duplicate invoice authority or silently changing direct payment behavior. |
| `FinOpsView` | Provider/AI cost and usage analysis. | Usage & Charges, with customer/application/consumer drill-through where verified. | Keep provider cost distinct from rated customer charge; do not display inferred invoiceable spend. |
| `AccountingControlView` | Finance summary, journals, reconciliation imports/matches/settlement and refund controls. | Reconciliation / Accounting and relevant contextual refund/credit details. | Preserve operational controls/permissions; avoid duplicate invoice/refund workflows. |
| `LicensingMonetizationView` | Licensing plans, tenant/application licenses and related status/webhook view. | Orders & Subscriptions / legacy licensing detail. | Retain legacy license enforcement access until canonical subscription/entitlement parity is accepted. |
| `Tenant360View` | Tenant/customer operational detail, including some fields with JSON/fallback presentation. | Customer 360 selected context and cross-domain navigation. | Mark source/provenance. Never render fallback/static values as persisted contract, party, or entitlement evidence. |
| `CustomersView` | Customer directory/onboarding backed by tenant-oriented APIs. | Customers & Accounts entry point and selected Customer 360. | Preserve current tenant/customer ID contract; label technical tenant separately from commercial customer. |
| `OrgHierarchyView` | Organisation-tree visualization. | Organisation & Accounts panel within Customers/Customer 360. | Treat current tree as UI state until persisted source is verified; never infer legal entity from hierarchy label. |
| `TenantPortalView` | Tenant-scoped profile, invoices, methods, schedules, payments/refunds, currency preference and key controls. | Existing customer portal with contextual account/service/billing tabs as data and authorization mature. | Preserve tenant isolation; no cross-tenant account exposure from UI grouping. |

Existing views can be consolidated within current navigation identifiers. Do not delete components or alter routes as part of this plan.

## 4. Permissions, tenant isolation and trust context

### Permission model

The UI should group actions by capability and show only actions the API authorizes, while server enforcement remains authoritative. Define separate permissions for reading commercial parties, changing customer/account mappings, issuing quotes, approving terms, recording acceptance, changing orders, viewing provider costs, issuing invoices, collecting payments, approving refunds/credits, matching reconciliation, posting settlements/journals, and exporting reports. Do not infer a role matrix from screen visibility; Security/Finance owners approve exact role-to-action rules.

Sensitive actions require explicit actor, target, reason/effective date where applicable, confirmation and resulting audit correlation. A user may view a tenant but not necessarily execute legal acceptance or accounting action. The interface must show why an action is unavailable without leaking protected object existence across tenant scopes.

### Tenant isolation

Every data fetch and mutation is authorized by server-side tenant/account scope. Commercial customer or account membership does not implicitly grant access to every technical tenant under the party. The portal remains tenant-scoped until a separately authorized account-wide model exists. Client-side filters are not security controls. On switching customer/tenant, clear stale data and re-fetch under the new authorized scope.

### Trust/governance integration

Customer 360 may cross-link:

Organisation → Legal Entity → Contract → Subscription → Entitlement → Identity/Application → Policy → Data classification → Provider/Model → Usage → Charge → Invoice → Accounting → Audit.

The UI visualizes this chain only from verified API relationships and shows unknown/unlinked states. A commercial entitlement influences runtime policy through the server’s entitlement decision; a UI badge must not grant runtime access. Credential/secret material and raw prompts/responses are never shown in commercial timelines.

### Audit

Display audit events in chronological, permission-filtered form with actor/service identity, action, target, outcome, effective time, reason and correlation where supported. Avoid exposing before/after sensitive values broadly. Existing audit schema/source may not provide all typed fields; UI must not imply complete audit history until backend evidence confirms it.

## 5. API compatibility and data states

No route, API, UI or behavior is changed by this plan. Future UI integration continues to use existing APIs as facades and adds new read models/fields only after contract review. Preserve current IDs, status fields and deep-link resolution. Do not use client-supplied party/account IDs as authorization proof.

The UI should distinguish at least:

- **Verified/available:** server returned an authorized object/link.
- **No persisted record in the reported snapshot:** only when source API/evidence actually establishes it, with capture/refresh context.
- **Not linked / unknown:** relationship has not been established.
- **Loading/error/inaccessible:** fetch or authorization state; never display as zero.
- **Legacy/unmapped:** existing tenant/license/order data without verified canonical party mapping.

Do not collapse empty, unavailable, unauthorized, not queried, and no relationship into the same empty state. Financial totals group by currency and do not silently convert using display currency. Provider cost, customer charge, invoice balance, payment capture and allocated amount are separate measures.

## 6. Backwards compatibility and consolidation strategy

1. Inventory all sidebar IDs, tab/deep links, API consumers and role-specific navigation before design cutover.
2. Keep existing `FinanceCommerceView`, `BillingAdminView`, `AccountingControlView` and `LicensingMonetizationView` behaviors reachable during transition; reuse them as panels rather than creating duplicate flows.
3. Preserve existing list/detail URLs or resolve aliases to the appropriate Finance section. Browser refresh/back/forward and bookmarked legacy IDs must continue to work.
4. Keep old UI routes/IDs as aliases until consumer inventory and adoption are verified; no legacy retirement is in Stage F scope.
5. Consolidate repeated invoice/customer context through shared read models only when the API establishes a single source of truth; no UI-side financial calculation becomes authoritative.
6. Portal/admin share domain services but retain separate authorization and response scope. Never reuse an admin broad response in a tenant portal without server-side filtering.

## 7. Migration and rollback strategy

Stage F is UI integration planning only. It does not specify or create database migrations. UI work depends on stable APIs and verified Stage A–E relationships; the interface must handle optional/unresolved links rather than demand fabricated columns or rows.

If later separately authorized, deploy presentation behind reversible navigation/feature flags. Preserve old menu IDs and component entry points during rollout. Rollback hides new workspace sections or restores prior navigation aliases while retaining any valid records created by separately authorized backend stages. Do not delete data or undo financial records as a UI rollback. Verify no client-side cache leaks data across tenant/customer context after rollback or user switch.

## 8. Pre-implementation evidence and design gates

- Accepted Stage A–E API/domain contracts, permissions and status vocabulary; external production evidence resolves only what it actually queried.
- User/role inventory and tenant/account authorization rules; no commercial identity inferred from tenant labels.
- Existing sidebar IDs, deep links, browser route state and consumer inventory.
- Production deployment/version evidence before any claim that a screen/API is live; source code is not deployment proof.
- Verified API response provenance, pagination, empty/error/unauthorized distinctions and currency behavior.
- Audit schema/coverage evidence; identify which timeline items are complete, partial, unavailable or not queried.
- User research/operational owner acceptance for Finance workflows, Customer 360 and portal task hierarchy; no assumed requirements from production row counts.
- Accessibility, role-scope and cross-tenant data leakage review in non-production before rollout.

## 9. Acceptance criteria

- One admin Finance workspace contains the specified sections without a top-level menu per entity.
- Existing view capabilities remain reachable with legacy IDs/deep links resolved; no workflow is lost or duplicated.
- Customer 360 reuses existing customer/tenant context and labels commercial party/account mappings only when verified.
- Tenant Portal remains tenant-scoped; unauthorized sibling-tenant/account data cannot be exposed by navigation or client filtering.
- Orders, contracts, subscriptions, usage/charges, invoices/payments, reconciliation/accounting and provisioning show source-linked detail only where available; missing links remain explicit unknown/unlinked states.
- Customer charge, provider cost, invoice balance, captured payment, allocation, credit and settlement are distinct UI concepts with currency labels.
- All mutation actions call existing authorized APIs; no client-only authorization or financial calculations.
- Audit timelines avoid secret/PII leakage and distinguish incomplete audit evidence.
- Keyboard/accessibility and responsive behavior meet the product’s approved criteria; loading, empty, error, inaccessible and unqueried states are distinguishable.
- Back/forward, refresh, bookmarks, roles and context switching pass non-production verification; no API or financial history is changed by UI consolidation.
- Product, Finance, Support, Security and customer-portal owners accept the consolidated workflows.

## 10. Explicit non-goals

Stage F does not implement UI, change routes/APIs, create top-level menus for each entity, create commercial entities/mappings, modify financial data, change roles/tenant isolation, implement quotes/contracts/subscriptions/provisioning/rating/allocation, retire legacy screens, or alter provider integrations. It does not make unavailable or zero-count production evidence look like proof of feature absence.

## 11. Authorization boundary

This Stage F plan is documentation and implementation-readiness analysis only. It does not authorize application, API, UI, schema, migration, data, configuration, deployment, or production changes. Implementation requires separate explicit authorization after review, evidence gates, and acceptance of this plan.
