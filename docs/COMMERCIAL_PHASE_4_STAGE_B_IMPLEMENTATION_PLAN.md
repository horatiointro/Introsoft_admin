# ALTIL Phase 4 Stage B — Contracts, Quotes and Customer Acceptance

**Status:** Documentation and implementation-readiness plan only.
**Architecture authority:** [Phase 4 Architecture Specification](./COMMERCIAL_PHASE_4_ARCHITECTURE_SPEC.md).
**Dependencies:** Stage A party/account mappings must be accepted before commercial parties are used as contract authorities.
**Authorization:** This plan does not authorize implementation.

## 1. Purpose and evidence boundary

Stage B defines two legitimate commercial authority paths:

- **Path A — Existing agreement:** Existing Master Contract / Contract Version → Quote / Quote Version → Customer Acceptance → Order.
- **Path B — Quote-originated agreement:** Quote / Quote Version → Customer Acceptance → Contract / Contract Version → Order.

These paths are not contradictory: an existing agreement may govern a quote, or the accepted quote may originate the agreement. An Order cannot become commercially effective until the required contractual authority and customer acceptance requirements for the applicable commercial path have been satisfied. The actual production path is **UNKNOWN / REQUIRES EVIDENCE**; this plan does not infer which path ALTIL currently uses.

Stage B creates no production relationship by assumption. Production evidence establishes one technical tenant, one order and line, ten products, and zero invoices/payment/refund/reconciliation/journal rows at capture time. The order is not proof of acceptance or an executed contract. Commercial-party identity, legal entity, billing account, quotation history, external CRM records, and acceptance evidence remain unverified unless separately supplied by the production operator and owner. Workspace/test data is excluded.

## 2. Domain responsibilities and boundaries

| Domain object | Responsibility | Boundary / non-authority |
|---|---|---|
| Customer / Organisation / Legal Entity / Billing Account | Reference the approved Stage A identity and account context for an offer/agreement. | No party is created or resolved from technical tenant name, metadata, order tenant_id, or email/name resemblance. |
| Contract | Stable agreement identity between approved legal parties; lifecycle and executed-document reference. | A quote, order, license, or billing schedule is not a contract. |
| Contract Version | Immutable terms/effective-period snapshot; amendments create subsequent versions. | Do not overwrite executed terms or infer missing historic terms. |
| Quote | Offer workflow identity tied to a customer/account context and validity window. | A draft quote is not an obligation or runtime entitlement. |
| Quote Version | Frozen line, product/price version, quantity, currency, terms, validity, tax assumptions and document references. | Current product price must not rewrite an issued/accepted version. |
| Customer Acceptance | Verifiable act by an authorized customer representative accepting one exact version. | Authenticated tenant user alone is not sufficient legal authority without an approved authority rule. |

Ownership: Commercial/Sales owns quote preparation; Finance approves price/terms and billing context; Legal owns contract form, acceptance methods and legal retention rules; customer-authority owner verifies signer role; security/IAM owns identity assurance and access. Exact role codes are not prescribed here.

## 3. Lifecycle, state transitions and effective dating

**Quote:** draft → review → approved → issued → accepted or rejected; issued → expired or withdrawn. A changed offer becomes a new quote version. A terminal version is never edited.

**Quote Version:** draft → review → approved → issued → accepted/rejected/expired/superseded. Issue freezes the offer. Acceptance references exact quote/version identifiers and content digest. Valid-from/valid-until and any service start are distinct dates.

**Acceptance:** pending → accepted, rejected, expired, or invalidated only through a documented legal process. Accepted evidence is immutable. Corrections are additional events linked to the original acceptance, not record deletion.

**Contract:** draft → review → executed/active → expired/terminated. Suspension is permitted only under defined terms and is not synonymous with payment failure. Termination preserves executed versions and prior obligations.

**Contract Version:** proposed → approved → executed/effective → superseded/ended. Each version has an effective interval and predecessor. There must be no ambiguous overlap in controlling terms; precedence for an amendment effective in the future is explicit.

Effective date model must distinguish document signature/acceptance time, legal effective time, service start/end, quote expiry, renewal/notice windows, and data-recorded time. Time zone and date precision are selected with legal/finance owners. Retroactive changes require explicit authority, reason, and evidence; they must not rewrite already-rated usage or issued invoices.

## 4. Immutable history, identifiers and acceptance evidence

- Preserve any existing quote/contract/document references discovered in production; the evidence supplied so far contains no such inventory.
- Assign stable IDs to quote, quote version, acceptance, contract and contract version. IDs are opaque and do not encode PII.
- Freeze parties, account/legal-entity references, product/price version, quantity, currency, payment terms, service scope, tax assumptions, validity, document reference/hash, approval, and acceptance on the version/evidence record.
- Mutable current status is a projection of append-only lifecycle events. Draft content may be edited under controlled audit before issue; issued/accepted content cannot be edited.
- Acceptance evidence records exact version, actor principal, actor authority proof, method, timestamp, result, correlation/idempotency reference, and evidence/document digest or secure evidence location. Do not copy credentials, private email, or unnecessary personal data into broad-access logs.
- Acceptance requires a verified actor with authority for the customer/legal party and an approved authentication/assurance method. A tenant admin role or user email is not automatically contractual signing authority.
- Idempotency scope is acceptance command + exact quote/contract version + authorized actor/evidence reference. Retry must return the existing acceptance, not create another contract/order.
- Legal retention, electronic signature admissibility, signer delegation, counterpart rules and document storage are policy decisions for legal counsel; this plan does not assert them.

## 5. Relationships to existing billing and order structures

Target relationships:

- **Path A — Existing agreement:** Approved party/account context → Existing Master Contract / Contract Version → Quote / Quote Version → Customer Acceptance → Order / Order Lines.
- **Path B — Quote-originated agreement:** Approved party/account context → Quote / Quote Version → Customer Acceptance → Contract / Contract Version → Order / Order Lines.

The paths converge at Order. The applicable contractual authority and required customer acceptance must be satisfied before the Order becomes commercially effective. No production evidence currently establishes which path ALTIL uses.

Existing `billing_products` supplies catalogue identity; accepted Quote Version snapshots the applicable product/price values. Existing `billing_orders` and `billing_order_lines` remain the financial/commercial order records and keep their IDs. Stage B does not issue invoices, create subscriptions, or alter the one captured production order. No historic quote/contract/order relationship is backfilled without deterministic evidence and owner approval.

Captured production downstream invoice/payment/reconciliation/accounting tables were zero-row at evidence time; that is a point-in-time count, not proof those capabilities are unused historically, undeployed or unnecessary. Production relationship checks remain as classified in Stage A preflight.

## 6. API compatibility strategy

No existing endpoint is removed, renamed, or reinterpreted. Existing `/api/v1/customers*`, `/api/v1/billing/products*`, `/api/v1/billing/orders*`, `/api/v1/billing/invoices*`, and `/api/v1/licensing/*` remain compatible.

Future quote/contract/acceptance commands would be separately versioned or additive APIs after consumer, legal and authorization review. Existing order create must not silently become acceptance. Existing customer/tenant IDs retain their current meanings; canonical party IDs are distinct identifiers. Optional relationship fields must be nullable and omitted or explicitly unresolved when no verified mapping exists. Server-side ownership checks cannot trust client-submitted customer/account IDs. Webhook/checkout behavior remains out of Stage B.

Consumer risks: clients may treat tenant-backed customer IDs as legal counterparties, assume creating an order means acceptance, or depend on current payload JSON. Inventory those consumers and preserve old response fields until migration is separately approved.

## 7. UI integration strategy

Planning only: quote and contract workflows belong inside the Finance workspace’s contextual “Quotes & Contracts” and “Customers & Accounts” areas. Extend `CustomersView` / `Tenant360View` with verified party context and linked document history. `OrgHierarchyView` can display only approved persisted organisation relationships. `FinanceCommerceView` continues to own current products/orders; it may later link an accepted version without changing current order behavior. `BillingAdminView` remains invoice-facing. `TenantPortalView` may show offers/agreements only for explicitly authorized tenant/account scope and an approved customer acceptance workflow. Do not add top-level menus or implement UI now.

## 8. Audit, security and Trust Fabric implications

Commercial agreement is an authority source for later orders, subscriptions and entitlements; it is not a runtime credential. Contract party, tenant, IAM actor and legal signer remain separate identities.

Every create/review/approve/issue/accept/reject/expire/withdraw/amend action should correlate actor/service identity, role/authority decision, tenant scope if applicable, party/version IDs, before/after status, reason, effective time, request/correlation ID, outcome and secure evidence reference. Current local `audit_logs` migration has tenant, user email, action/category, timestamp and JSON payloads but does not establish typed consistent before/after, reason, correlation or outcome support; production audit schema/runtime coverage remains unqueried. Acceptance requires a verified IAM principal and a separate authorized-signer decision. Tenant isolation and policy checks remain unchanged; commercial membership never grants access to another tenant.

Privacy: store minimum necessary signer/party information; restrict legal documents and registration data; use hashes/secure references rather than embedding raw documents or secrets in audit payloads. Retention and deletion exceptions require legal/security approval.

## 9. Migration and rollback strategy

No SQL or schema is specified. Before implementation, inspect live production schema, candidate party/contract fields, JSON key aggregates, indexes/FKs, existing CRM/document references, audit capability, API consumers, and production relationship results using the external read-only intake. Do not treat migration definitions as proof of live schema; do not rerun migration 020/023 seed behavior.

If separately authorized:

1. Add only approved contract/quote/version/acceptance structures or reuse a verified existing authority; additive references only.
2. Preserve tenant, application, product, order, order-line and all financial IDs and payload/history. Never make a guessed Customer, Organisation, Legal Entity, Billing Account or contract-party link.
3. Backfill only deterministic records with owner-approved evidence; classify other links unresolved and retain source references.
4. Keep existing order/invoice APIs and tenant checks as compatibility facades; new API writes require idempotency and audit before enabling.
5. Rehearse issue/acceptance/retry/expiry/amendment and permission failures using non-production data. Compare old/new counts and document hashes without leaking contents.
6. Roll back by disabling new workflow/read paths before dependent financial or runtime writes. Once accepted legal evidence exists, preserve it and use forward correction/void/amendment, not deletion. A DB rollback cannot revoke an already communicated offer or executed agreement; legal operations must coordinate external effects.

## 10. Pre-implementation evidence requirements

Require refreshed, operator-collected read-only evidence immediately before Stage B implementation:

- approved Stage A party/account mapping and owner sign-off;
- production table/column/index/FK inventory for relevant party/customer, contract/quote/document, billing, order, audit and IAM objects;
- aggregate JSON key presence for tenant/order/product metadata, with no values or PII;
- counts and relationship/orphan/duplicate results for orders/order lines/products and any discovered quote/contract records;
- source and production application release mapping, API consumers and existing document/CRM integrations;
- legal owner decision on signer authority, evidence type, retention, contract/version precedence and effective-date precision;
- finance owner decision on price approval, currency and terms snapshot;
- security review of IAM role boundaries, evidence storage and audit traceability;
- distinguish NOT PRESENT from UNQUERIED/INACCESSIBLE; production zero counts are point-in-time only.

No production query or change is performed by this plan.

## 11. Acceptance criteria

Stage B can be accepted only when:

- party/account context comes from approved Stage A records; no technical tenant is treated as a legal party by implication;
- every issued quote version is immutable and reproducibly identifies its prices, terms, currency, validity and party context;
- acceptance binds to exactly one immutable version and records authorized actor, method, timestamp, outcome and evidence reference;
- duplicate requests/retries do not create duplicate acceptance, contract versions or downstream orders;
- amendment, expiry, rejection, withdrawal and termination transitions preserve history and have explicit effective dates;
- API clients retain current customer/order/invoice/license contracts and tenant authorization behavior;
- audit evidence meets approved legal/security requirements without secret/PII leakage;
- no existing order/invoice/payment/journal IDs, amounts or history are changed;
- production-specific unknowns remain explicitly unresolved until supported by external evidence;
- Legal, Finance, Commercial, Security and technical tenant owners approve the workflow and evidence rules.

## 12. Explicit non-goals

Stage B does not implement Stage A party mappings, order/subscription/entitlement lifecycle, provisioning, rating/charges, invoice generation/redesign, payment allocation, credit notes, tax automation, provider integration changes, ERP/GL, UI consolidation, or legacy retirement. It does not assert that an existing production contract/quote does or does not exist without the required evidence.

## 13. Authorization boundary

This Stage B plan is documentation and implementation-readiness analysis only. It does not authorize schema changes, migrations, data changes, application changes, API changes, UI changes, or production changes. Implementation requires separate explicit authorization after review, required evidence collection, and acceptance of this plan.
