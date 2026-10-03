# ALTIL — Commercial Migration Impact Audit

**Prepared:** 2026-10-02
**Scope:** `migrations/019`, `023`, `024`, `025`, `026`–`030`, `031`, `032`, `034`
**Subject:** ALTIL @ working tree, `commercialFoundationRoutes.ts` modified, `onboardingOrchestrator.ts` + `CustomerOnboardingWizard.tsx` untracked
**Nature:** Engineering architecture audit. **Not legal advice. Read-only — no files modified.**

---

# Executive Summary

The migrations in scope are **well-designed schema work that the authorisation engine does not read.** This is the single most important finding, and it was verified directly rather than inferred.

ALTIL currently contains **two disconnected hierarchies**:

1. A **commercial hierarchy** — `commercial_organizations`, `commercial_organization_relationships` and friends (migration `025`) — properly modelled, with effective dating, foreign keys, unique-start constraints and status columns. It is **written** and **displayed**, but **never consulted for authorisation**.
2. An **authorisation hierarchy** — derived at request time from `tenants.metadata_json.$.parentId` — which is what actually gates every authenticated request.

The effective-dating logic in `src/security/organizationScope.ts:41-47` is **correct code that receives hardcoded `undefined`/`null` for every edge** from the production loader (`src/db/mariadb.ts:329-331`). It is therefore dead code on the live authorisation path. Reports that mark effective dating "SUPPORTED" by citing the resolver alone are incorrect.

**Second headline:** the remediation work has already been built and **is not reachable**. `src/commercial/onboardingOrchestrator.ts` implements a 16-table atomic onboarding transaction and is wired to `POST /api/v1/commercial/onboard` (`commercialFoundationRoutes.ts:551`). `src/components/CustomerOnboardingWizard.tsx` (56,796 bytes) is the matching frontend. **The wizard is not mounted in `App.tsx`** — zero references — and the legacy `POST /api/v1/customers` path at `App.tsx:420` remains the live route users actually hit.

**Third:** shipping the wizard *before* re-pointing the authorisation graph would make things worse, not better. It would introduce two sources of truth where today there is one inconsistent one — and the resulting defects would present as authorisation bugs.

---

# 1. Verification: the authorisation disconnect

## 1.1 The graph loader reads the legacy table

`getOrganizationGraph()` in `src/db/mariadb.ts:293-298` issues:

```sql
SELECT id,
       NULLIF(JSON_UNQUOTE(JSON_EXTRACT(metadata_json, '$.parentId')), 'null') AS parent_id,
       ...
FROM tenants ORDER BY id
```

It does **not** query `commercial_organization_relationships`. The hierarchy it returns is a JSON blob on the legacy `tenants` row — single parent only, no relationship type authority, no stored effective dates.

## 1.2 Effective dating is dead code on the live path

`src/security/organizationScope.ts:41-47`:

```ts
function isEffective(relationship: OrganizationRelationship, asOf: number): boolean {
  const from = relationship.effectiveFrom ? Date.parse(relationship.effectiveFrom) : null;
  const to   = relationship.effectiveTo   ? Date.parse(relationship.effectiveTo)   : null;
  return relationship.status === 'ACTIVE'
    // ...from/to comparisons
```

This is a faithful implementation. The problem is the producer. `src/db/mariadb.ts:329-331` constructs every relationship edge as:

```ts
status: 'ACTIVE' as const,
effectiveFrom: undefined,
effectiveTo: null,
```

With `status` pinned `'ACTIVE'` and both dates empty, `isEffective()` reduces to a constant `true`. **Every edge is unconditionally effective, and no relationship can ever expire.** The `effective_from` / `effective_to` columns that `025_commercial_foundation.sql:20-21` defines are never read on the authorisation path.

## 1.3 No authorisation code reads any commercial table

Grep across `src/security/*.ts`, `src/middleware/authMiddleware.ts` and `src/db/iamRepository.ts` for `commercial_`: **zero matches.**

`commercial_organization_relationships` is read in exactly six places — `commercialFoundationRoutes.ts:175,219,459`, `commercialCatalogueRoutes.ts:81,92`, `publicRegistrationRoutes.ts:134`, plus the orchestrator's own INSERT at `onboardingOrchestrator.ts:207`. All are read-only display or persistence paths. **None is on the authorisation path.**

## 1.4 The migration itself says so

`migrations/032_commercial_account_iam_relationships.sql:2`, in a header comment written by the authors:

> `-- This does not grant technical tenant, application, or credential access.`

Architecturally correct. Commercially decisive: it means the commercial hierarchy **cannot influence authorisation**, by design.

## 1.5 Consequence

Two sources of truth that can diverge, and already can:

- `025_commercial_foundation.sql:1` — `-- Commercial foundation. Technical tenant/IAM records are deliberately not backfilled.`

Because there is no backfill, the two hierarchies are not merely separate — they start **empty and independent**. Every record created through the legacy `POST /customers` path writes only `tenants`. A `DESCENDANTS` grant resolved from `tenants.parentId` will be computed against a graph the commercial tables know nothing about.

---

# 2. Per-migration impact assessment

## `019_accounting_payment_core.sql` — **high impact, real modelling defect**

Establishes payment intents, refunds, tokenised payment methods, recurring schedules, double-entry `accounting_journals` + `accounting_journal_lines`, and bank reconciliation batches. Architecturally sound.

**Defect:** the owning party is a single `tenant_id VARCHAR(80)` on `billing_payment_intents` and `accounting_journals`. This conflates six distinct commercial roles:

| Role | Currently |
|---|---|
| Seller (who supplies the service) | `tenant_id` |
| Sold-To (who receives the service) | `tenant_id` |
| Bill-To (who receives the invoice) | `tenant_id` |
| Payer (who settles) | `tenant_id` |
| Managed-By (which operator administers) | absent |
| Consumed-By (whose usage generated the charge) | absent |

**Consequences that follow directly:**
- Parent-paid / consolidated group billing is not expressible.
- Reseller settlement is not expressible — a reseller can sell while the parent is billed.
- Revenue recognition per tenant is impossible where one account spans tenants.

This is the one gap that is **architectural rather than transitional**. It will not be resolved by wiring the hierarchy; it needs additional columns.

## `023_commerce_orders_catalog.sql` — **high impact, same defect**

`billing_products` (catalogue) is clean. `billing_orders` / `billing_order_lines` repeat the single-`tenant_id` conflation (`023:25`). Also adds `tenants.invoice_day`.

## `024_iam_authorization_scopes.sql` — **highest risk file in scope**

This is the only migration that touches the **live authorisation path**:

```sql
ALTER TABLE iam_user_roles
  ADD COLUMN access_scope VARCHAR(24) NOT NULL DEFAULT 'ORGANISATION';
```

**Risks:**

1. **Unapplied.** Confirmed by the project's own documentation (`docs/ALTIL_ORGANIZATION_SECURITY_MODEL.md:9`: *"Migration `024_iam_authorization_scopes.sql` has not been run."*).
2. **Failure mode is severe.** The legacy fallback (`src/security/legacyIamAssignments.ts:17-42`) **deliberately drops NULL-tenant rows**, because the pre-024 schema cannot prove an explicit global grant. Net effect on an un-migrated database: **no global Super Admin exists at all.** The system fails closed — safely, but totally.
3. **Hardcoded role IDs.** `024:25` and `024:30` insert permissions against literal `'role_super_admin'` and `'role_tenant_admin'`. If those IDs do not match the seeded rows, `INSERT IGNORE` **silently no-ops** and tenant administrators receive none of the five added permissions.
4. **Patent relevance.** `access_scope` carries `GLOBAL | ORGANISATION | DESCENDANTS | SELF | TREE` — the column that makes the same-grant authorisation invariant expressible. An unapplied migration means there is no enabled embodiment. This should be corrected in any patent filing discussion.

Positive: the design decision that **NULL ≠ global** is correct and is explicitly commented (`024:2-4`).

## `025_commercial_foundation.sql` — **good schema, orphaned**

Nine well-modelled tables: `commercial_organizations`, `commercial_organization_relationships`, `commercial_customers`, `commercial_legal_entities`, `commercial_accounts`, `commercial_relationships`, `commercial_customer_organization_relationships`, `commercial_organization_tenant_scopes`, `commercial_customer_tenant_links`.

Quality notes: proper `DATETIME(3)` precision, effective dating on every relationship, `uk_*_start` uniqueness on `(subject, object, type, effective_from)` allowing versioned history, `status` columns, and both `parent`/`child` indexes for traversal. Seeds only `org-introsoft-root` and **deliberately does not backfill** (`025:1`).

**Impact:** well-designed, fully inert with respect to authorisation.

## `026`–`030` — supporting integrity

`commercial_evidence_approvals` + `_uses` (026), durability/cardinality constraints and `commercial_idempotency_records` (027), approval expansion (028–029), scope integrity checks adding `scope_link_type` (030). These harden the commercial plane and support the atomic onboarding flow. No direct authorisation impact.

## `031_commercial_catalogue_resale.sql` — **complete model, zero exposure**

Three tables:
- `commercial_product_relationships` — `REQUIRES`, `RECOMMENDS`, `COMPATIBLE_WITH`, `INCOMPATIBLE_WITH`, `UPGRADE_TO`, `ADD_ON`, `BUNDLE_MEMBER`
- `commercial_reseller_product_authorizations` — explicit owner → reseller grant, approval-linked
- `commercial_reseller_product_prices` — independent `reseller_cost`, `minimum_customer_price`, `recommended_markup_percent`

This is a complete reseller/channel model. **There is no UI anywhere in the app that exposes any of it.** No partner authorisation matrix exists in the menu. A reseller cannot be granted discrete resale rights, and price floors cannot be administered, through the product.

## `032_commercial_account_iam_relationships.sql` — **the customer-mode gap**

Maps IAM identities to commercial accounts with effective dating and an `audit_reference` requirement. Adds role `CUSTOMER_ACCOUNT_USER` (`032:26`).

**Issue:** the role row is inserted with `tenant_id NULL`. NULL does not mean global, so this role's scope must be derived from `commercial_account_iam_relationships` — which the authorisation path does not read. Consequently the `CUSTOMER_ACCOUNT_USER` restriction that drives `App.tsx:1151` and `Sidebar.tsx:150` is enforced **client-side**, by the browser reading `localStorage.getItem('altil_user_profile')` (`CommercialAccountPortalView.tsx:23-24`). That is presentation, not enforcement.

## `034_public_registration_and_invitation_workflow.sql` — **flow exists, unused**

`public_registration_requests` + `iam_user_invitations`, with `SelfRegistrationPage.tsx` and `AccountActivationPage.tsx` both mounted from `App.tsx:1116-1117`. This is a proper self-registration and activation path.

**However** the admin-provisioning path is not unified: `CustomersView` still creates admin users through the legacy `POST /customers/:id/users` (`App.tsx:470`).

---

# 3. The remediation already built — and why it is not live

## 3.1 `src/commercial/onboardingOrchestrator.ts` (untracked)

Exports `orchestrateCommercialOnboarding`, imported at `commercialFoundationRoutes.ts:10` and exposed at `:551`:

```ts
router.post('/onboard', requireAuthentication, requirePermission('tenant.write'), async (req, res) => {
  const result = await orchestrateCommercialOnboarding(req.user!, req.body, origin);
  res.status(201).json(result);
```

It writes **16 tables in one transaction**:

`tenants`, `tenant_applications`, `tenant_api_keys`, `tenant_licenses`, `iam_users`, `iam_user_invitations`, `billing_orders`, `billing_order_lines`, `audit_logs`, `commercial_organizations`, `commercial_organization_relationships`, `commercial_organization_tenant_scopes`, `commercial_customers`, `commercial_legal_entities`, `commercial_accounts`, `commercial_customer_organization_relationships`, `commercial_customer_tenant_links`.

Critically, it **writes `access_scope`** (`onboardingOrchestrator.ts:311`):

```sql
INSERT IGNORE INTO iam_user_roles (id, user_id, role_id, tenant_id, assigned_by, access_scope)
```

**Assessment: this is materially the right architecture.** It closes the atomicity gap, the relationship-type gap, the parent-org gap, and the primary-admin-and-invitation gap simultaneously.

## 3.2 `src/components/CustomerOnboardingWizard.tsx` (untracked, 56,796 bytes)

The matching frontend. **It calls the new endpoint** (`:281`).

## 3.3 Three reasons it is unreachable

| # | Blocker | Evidence |
|---|---|---|
| 1 | **The wizard is not mounted.** Zero references in `App.tsx`. | grep `CustomerOnboardingWizard` → no output |
| 2 | **The legacy path is still live.** `App.tsx:420` POSTs `/customers`, which creates tenant + application + API key in one non-transactional handler writing **no** `commercial_*` rows. | `App.tsx:418-436` |
| 3 | **The authorisation disconnect persists.** Even if the wizard ships, `getOrganizationGraph()` still reads `tenants.metadata_json`, so `DESCENDANTS` grants still resolve against the legacy graph. | `mariadb.ts:293-298` |

---

# 4. Whole-system impact

## 4.1 What the migrations have bought

- A correct, versioned, effective-dated commercial object model that can represent multi-entity corporate groups, legal entities, billing accounts and reseller channels.
- A durable-mutation and idempotency foundation (`027`, `durableMutation.ts`) enabling safe multi-table commercial transactions.
- Explicit separation of commercial identity from technical tenancy — arguably the most important design decision in the whole set, and the one that most needs completing rather than discarding.

## 4.2 What remains fragmented

| Area | Status |
|---|---|
| Hierarchy → authorisation | **Disconnected.** Commercial graph is decorative; `tenants.parentId` is authoritative |
| Effective dating | **Dead on the authz path** (`mariadb.ts:330-331`) |
| Customer creation | **Two live paths.** Legacy `/customers` (used) and `/commercial/onboard` (built, unreachable) |
| Relationship type selection | Not selectable in the customer wizard; requires raw foundation APIs |
| Reseller authorisation | Schema + routes complete, **no UI** |
| Multi-party billing | **Not expressible.** Single `tenant_id` on orders/invoices/payments/journals |
| Customer-mode enforcement | Client-side via `localStorage`, not server-side |
| Scope drill-down | `ScopeHeaderBar.tsx` is a flat 2-level selector (`Total Company → Tenant → Application`), not recursive |
| `access_scope` | Migration `024` unapplied → no `DESCENDANTS`/`GLOBAL` semantics in the live schema |
| Navigation | `Sidebar.tsx:113-132` — "Platform Administration" duplicates **17 screens** verbatim from other sections |

## 4.3 Corrected assessment of the previously-issued report

| Claim | Verdict |
|---|---|
| "Effective Dates — SUPPORTED" | **Schema yes; enforcement no.** `isEffective()` receives hardcoded `undefined`/`null` |
| "Parent-Child First-Class Records — SUPPORTED" | True of schema; **false of enforcement** — authz reads `tenants.metadata_json` |
| "Recursive Hierarchy Verdict: PARTIALLY SUPPORTED" | Correct, and **understates** the gap |
| "Phase 3 — create `POST /api/v1/commercial/onboard`" | **Already built and wired** |
| "Phase 4 — build `CustomerOnboardingWizard.tsx`" | **Already built, not mounted** |
| "Phase 6 — prune 17 duplicate menu items" | Correct and outstanding |

---

# 5. Recommended sequence

The previously-issued roadmap ran *Schema → Subtree → Orchestrator → Wizard*. **That order is now inverted: the orchestrator and wizard already exist, and the subtree work is the blocker.**

Shipping the wizard first would be **regressive**: today the flat model is at least *self-consistent* — `tenants.parentId` is the single source for both display and enforcement. Adopting the new path without re-pointing the graph creates two divergent truths, and the resulting defects will present to operators as **authorisation** bugs, which is the hardest class to diagnose and the most damaging to trust.

**Corrected order — each item is a prerequisite for the next:**

1. **Re-point `getOrganizationGraph()`** at `commercial_organization_relationships`, honouring `status` and real `effective_from`/`effective_to`. Retire `tenants.metadata_json.parentId` as an authority source.
2. **Apply `024`** — but only *after* (1), and verify the `role_super_admin` / `role_tenant_admin` IDs match seeded rows, because `INSERT IGNORE` fails silently.
3. **Add hierarchy traversal integration tests** (parent→child, parent→grandchild, sibling isolation, child→parent denial, cycle rejection, edge expiry) against the real DB loader — not synthetic fixtures.
4. **Mount `CustomerOnboardingWizard`**, and route customer creation through it.
5. **Retire the legacy `POST /customers` creation path** once the wizard is proven. Leave read/update/delete until parity is demonstrated.
6. **Keep the AI gateway untouched** — provider dispatch, routing, failover, credential validation, compliance redaction and metering have no dependency on any of this and must not be regressed.

Item 3 deserves emphasis: the existing hierarchy tests in `src/security/organizationScope.test.ts` use **synthetic fixtures**, which the project's own documentation (`ALTIL_ORGANIZATION_SECURITY_MODEL.md:87`) states are *"not evidence of production structure."* After re-pointing the loader, those fixtures test the wrong code path.

**Do not do** until the above: multi-party billing columns (`019`/`023`), reseller UI (`031`), menu de-duplication (`Sidebar.tsx:113-132`), or scope-drill-down work. These are real improvements but none unblocks the hierarchy, and all increase divergence if landed first.

---

# 6. Open questions

1. Was the deliberate decision that the commercial plane **cannot** grant access (`032:2`) intentional scope-setting, or a placeholder pending an authorisation bridge? This determines whether the fix is "wire hierarchy into authz" or "accept two planes permanently."
2. Is `tenants.metadata_json.parentId` intended to be deprecated, or retained as a denormalised cache of the commercial graph? If retained, what keeps it consistent?
3. On what basis should `effective_to` be set — commercial relationship end-date, or subscription end-date? These may not be the same date, and conflating them would cause entitlements to lapse incorrectly.
4. Should `CUSTOMER_ACCOUNT_USER` scope be enforced server-side, and if so via which table?
5. Does migration `024` need a data migration, or is "unapplied" acceptable given the legacy fallback fails closed?

---

# 7. Evidence base

**Directly verified in source:** `migrations/019, 023, 024, 025, 026–032, 034` (read in full for 023/024/025/032; grep-verified for the rest); `src/db/mariadb.ts:293-331`; `src/security/organizationScope.ts:41-70`; `src/security/legacyIamAssignments.ts:17-42`; `src/routes/commercialFoundationRoutes.ts:10,551`; `src/commercial/onboardingOrchestrator.ts` (INSERT targets, `:207,274,282,311`); `src/App.tsx:420,470,1116-1117,1151`; `src/components/Sidebar.tsx:113-132,150`; `src/components/CustomerOnboardingWizard.tsx:281`.

**Repo drift since the patent audit (2026-10-01):** migrations `035_compliance_dcr_schema_repair.sql` and `036_dsar_repository_contract.sql` now exist (36 total, was 34); `onboardingOrchestrator.ts` and `CustomerOnboardingWizard.tsx` are new. **The patent-audit finding that "the organisation hierarchy has no persisted structure" is now outdated** — the structure exists in schema, and the orchestrator writes `access_scope`. The substantive patent position is unchanged (migration unapplied; authorisation does not read the relationship table), but that finding must be re-verified before it goes to an attorney.

**Verification method:** all findings derived from `grep`/`read` against the working tree. No runtime execution, no database inspection, no test execution. Migration-applied status is taken from project documentation, not from a live schema query.

**Not performed:** no files modified; no migrations run; no database changes; no commits.