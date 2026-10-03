# ALTIL — Organisational Hierarchy & User Population Model

**Prepared:** 2026-10-03
**Audience:** Developers, QA, product, customer success
**Source of truth:** migrations `002`, `024`, `025`, `032`, `033`; `src/commercial/onboardingOrchestrator.ts`; `src/security/*`; `src/components/Sidebar.tsx`
**Nature:** Developer reference. **Not legal advice. Read-only — no files modified.**

---

# 1. The one-paragraph version

ALTIL has **two parallel structures that developers constantly confuse**, and getting this wrong is the root of most ALTIL defects:

| | **Commercial** | **Technical** |
|---|---|---|
| Question it answers | *Who buys from whom?* | *Who runs what software?* |
| Root record | `commercial_organizations` | `tenants` |
| Tree lives in | `commercial_organization_relationships` | `tenants.metadata_json.$.parentId` |
| Type vocabulary | `INTROSOFT`, `SUBSIDIARY`, `PARTNER`, `RESELLER`, `CUSTOMER` | none |
| Concept of a billing account | Yes (`commercial_accounts`) | No |
| Concept of a legal entity | Yes (`commercial_legal_entities`) | No |
| Used for **authorisation**? | **No — decorative** | **Yes — this is what gates access** |

**A "Customer" is not a "Tenant."** One commercial customer can hold many legal entities, many billing accounts, and many tenants. One tenant can be *linked* to a customer (`commercial_customer_tenant_links`) but the link is not trusted by the auth engine.

**A "Tenant" is not an "Organization."** A tenant is a technical micro-service instance. A customer is a commercial counterparty. The 1:1 assumption in the UI is wrong, and the schemas were designed to fix it — but the runtime never adopted them.

---

# 2. What a developer must internalise

## 2.1 The hierarchy is a DAG in commerce, a tree in tech

```
                    ┌──────────────────────┐
                    │  Introsoft (ROOT)    │  organization_type = INTROSOFT
                    │  org-introsoft-root  │  canonical_key = INTROSOFT_ROOT
                    └──────────┬───────────┘
                               │
        ┌──────────────────────┼──────────────────────┐
        │                      │                      │
   ┌────▼─────┐          ┌─────▼─────┐          ┌─────▼─────┐
   │SUBSIDIARY│          │  PARTNER  │          │ RESELLER  │   ← organisation TYPE
   │ (owned)  │          │ (alliance)│          │ (channel) │      (commercial only)
   └────┬─────┘          └─────┬─────┘          └─────┬─────┘
        │                      │                      │
   ┌────▼─────┐          ┌─────▼─────┐          ┌─────▼─────┐
   │SUBSIDIARY│          │  CUSTOMER │          │ CUSTOMER   │  ← can nest further
   │ (nested) │          └───────────┘          └───────────┘
   └────┬─────┘
        │
   ┌────▼─────┐
   │ CUSTOMER │  ← the leaf that actually signs contracts and gets licences
   └──────────┘
```

Key point: **`SUBSIDIARY` can nest arbitrarily deep.** Introsoft → Altil Africa → Altil Nigeria is legal. **But `RESELLER` cannot have customers directly under it in the authorisation model** — see §5.2.

## 2.2 Every relationship is effective-dated, not boolean

`commercial_organization_relationships` (migration `025:14-29`):

```
parent_organization_id
child_organization_id
relationship_type      ← SUBSIDIARY | PARTNER | RESELLER | DIRECT_CLIENT | DIRECT_CUSTOMER
status                 ← PENDING | ACTIVE | SUSPENDED | ...
effective_from
effective_to           ← NULL = open-ended
UNIQUE KEY (parent, child, relationship_type, effective_from)
```

That unique key is **not** a bug — it is **versioned history**. It allows "Acme was a PARTNER from Jan–Jun, then became a SUBSIDIARY from July." A new row with a new `effective_from` supersedes the old one. Intervals are **half-open**: `[from, to)`. Touching endpoints are legal (`Jan 1 → Jul 1`, then `Jul 1 → null`); overlaps are not.

**Implication for developers:** never assume one relationship per parent/child pair. Always filter by `status = 'ACTIVE'` **and** the effective window, and expect multiple rows.

## 2.3 Half-open intervals — the exact rule

From `src/commercial/foundation.ts:162-166`:

```ts
export function isEffectiveAt(from, to, at) {
  const start = new Date(from).getTime();
  const end = to === null ? Infinity : new Date(to).getTime();
  return Number.isFinite(start) && start <= at.getTime() && end > at.getTime();
}
```

- `start <= now` and `now < end` → effective.
- `now === end` → **already expired.** The boundary instant belongs to the *next* interval.

Use this helper. Do not hand-roll date comparisons.

## 2.4 Same-grant invariant — the core security rule

`src/security/authorizationContext.ts:90`:

```ts
grant.permissions.includes(permission) && grant.visibleOrganizationIds.has(targetOrganizationId)
```

Both conditions must hold **in the same grant**. A user cannot have `user.create` from one assignment and organisational visibility from another and expect them to combine. This is ALTIL's central least-privilege invariant and it is enforced consistently at `authorizationContext.ts:90,96`, `organizationScope.ts:104`, `authMiddleware.ts:215`, `capabilityRegistry.ts:255`, and `incidentAuthorization.ts:6`.

**Warning:** `src/commercial/foundation.ts:62` **violates this invariant** — it tests `grant.permissions` and `grant.visibleOrganizationIds.has(scope.tenantId)` where the visible ID is a *tenant* but the entity added to the result is an *organization*. Different ID spaces combined in one expression. Do not copy that pattern.

---

# 3. The user population per business type

This is the section you asked for. **Every type below starts from exactly one provisioned user.**

## 3.1 The universal baseline — every organisation gets this

`onboardingOrchestrator.ts:289-335` provisions **exactly one IAM user** per new organisation:

| Attribute | Value | Line |
|---|---|---|
| Email | `adminEmail` (the customer's nominated admin) | `:295-307` |
| `tenant_id` | the newly created tenant | `:299,302` |
| Role | `role_tenant_admin` | `:313` |
| `access_scope` | `ORGANISATION` | `:313` |
| Account link | `ACCOUNT_ADMINISTRATOR` | `:322` |
| Password | random temp password, bcrypt cost 10 — **never delivered** | `:291-292` |
| Access | single-use activation token, 7-day expiry | `:327-335` |

**The temp password at `:291` is generated and hashed but never returned in the API response.** The user activates via `activationUrl` (`:444`). Correct design — but note that if the invitation is lost, there is no admin recovery path except manual DB work.

**Critically: onboarding creates exactly ONE user. It does not create a security team, a finance team, or a compliance team.** Every other persona in §3.2–§3.6 must be invited separately.

## 3.2 Direct client (the standard paying customer)

**Onboarding input:** `relationshipType: 'DIRECT_CLIENT'` (or `'DIRECT_CUSTOMER'`, the default — `:153`)

**Persona count: 1** — the primary administrator.

**Typical team to invite afterwards** (3–6 users total):

| Persona | Role to assign | Why |
|---|---|---|
| Primary Admin | `TENANT_ADMIN` *(auto)* | Provisioned by onboarding |
| Billing contact | `FINOPS_MANAGER` | Needs `tenant.read`, `billing.write`, `audit.export` (`002:205-206`) — but **has no billing menu entries gated on `billing.write`**; see §6.1 |
| Engineer / Integrator | `DEVELOPER` | API keys, playground, telemetry (`002:163`) |
| Compliance / DPO | `COMPLIANCE_OFFICER` | `policies.write`, `compliance.dsr`, `audit.export` (`002:200-201`) |
| Read-only oversight | `AUDITOR` | `tenant.read`, `audit.export` only (`002:210-211`) |

Note the asymmetry: `DEVELOPER`, `SECURITY_OFFICER`, `PLATFORM_ADMIN` and `SERVICE_MANAGER` have **no `iam_role_permissions` rows at all**. A `DEVELOPER` is, server-side, a role with **zero permissions**. Anything they can do works because of the `Sidebar.tsx:135` `globalScope` bypass, not because of RBAC. See §6.2 — this is a real defect.

## 3.3 Subsidiary (owned company)

**Onboarding input:** `relationshipType: 'SUBSIDIARY'`

**Distinguishing features:**
- Created with `organization_type = 'SUBSIDIARY'` (`onboardingOrchestrator.ts:201`)
- Can be the `parentOrganizationId` of further organisations → **the only type that can nest**
- Should have its own legal entity (`legalName` + `registrationNumber` → `:246-254`) and its own billing account (`:258-262`)
- Should have its own `tenant` if it runs its own AI workloads; `scope_link_type` then distinguishes `PRIMARY` / `PRODUCTION` / `SANDBOX` / `DEVELOPMENT` (`foundation.ts:26`)

**Persona count: 1 per subsidiary entity**, not per group. A group with 3 subsidiaries gets **3 separate primary admins**, 3 separate tenants, 3 separate invitations. There is no group-level admin concept in the schema.

**Who should see what** is decided by `access_scope` on `iam_user_roles`:

| `access_scope` | Meaning | Correct use |
|---|---|---|
| `GLOBAL` | Everything | Only Introsoft's own `SUPER_ADMIN` |
| `ORGANISATION` | The assigned tenant only | **Default for every customer user** |
| `DESCENDANTS` | Assigned tenant + children | Group treasurer over subsidiaries |
| `SELF` | Own data only | End user / individual customer |
| `TREE` | Full subtree | Rarely appropriate |

## 3.4 Partner (alliance / non-equity)

**Onboarding input:** `relationshipType: 'PARTNER'` → `organization_type = 'PARTNER'` (`:201`)

Identical mechanics to `SUBSIDIARY`. The **only** difference in the entire codebase is the `organization_type` string and the `relationship_type` string — **there is no behavioural difference whatsoever.** No permission difference, no scope difference, no workflow difference.

**Developer implication:** if a requirement says "partners must not see each other's data," you cannot satisfy it from `organization_type`. You must model it with `access_scope` and tenant scoping.

## 3.5 Reseller (channel / indirect sales) — **incompletely built**

**Onboarding input:** `relationshipType: 'RESELLER'` → **collapses to `organization_type = 'PARTNER'`** (`:201`)

Read that again: `:201` maps `PARTNER` **and** `RESELLER` to the same stored `organization_type = 'PARTNER'`. Only `commercial_organization_relationships.relationship_type` (`:211`) preserves `RESELLER`. **The reseller distinction is lost in the org table itself.**

Meanwhile migration `031` provides a complete resale model:
- `commercial_product_relationships` (`REQUIRES`, `RECOMMENDS`, `COMPATIBLE_WITH`, `INCOMPATIBLE_WITH`, `UPGRADE_TO`, `ADD_ON`, `BUNDLE_MEMBER`)
- `commercial_reseller_product_authorizations` (owner → reseller grant)
- `commercial_reseller_product_prices` (`reseller_cost`, `minimum_customer_price`, `recommended_markup_percent`)

**None of it is reachable from the UI.** There is no reseller screen, no partner authorisation matrix, no price-floor administration.

Migration `019`/`023` bill to a single `tenant_id`, so **reseller margin cannot be computed** — see §7.

## 3.6 Individual customer (end user / sole trader)

**Onboarding input:** `customerType: 'individual'` → `customer_type = 'INDIVIDUAL'` (`:154,229-234`)

`commercial_customers` requires `individual_given_name` and `individual_family_name`; `company_name` must be `NULL` (`foundation.ts:155-158`).

**Still provisioned identically** — `role_tenant_admin` + `access_scope = 'ORGANISATION'` (`:313`). An individual end user becomes a full tenant administrator with `apikeys.create` and `iam.users.write` (`002:195-196`).

**This is over-provisioning.** An individual should plausibly hold `SELF` scope with no admin rights. `access_scope` supports this (`SELF` exists in the vocabulary) but **nothing in the onboarding path ever assigns it.** Every single user created by the wizard gets `ORGANISATION` and `TENANT_ADMIN`.

## 3.7 Customer-mode user (`CUSTOMER_ACCOUNT_USER`)

A distinct role from migration `032:24-26`, inserted with `tenant_id = NULL` — meaning it **cannot** carry organisation scope on its own.

Intended for external customer-portal users. Assigned at `commercialFoundationRoutes.ts:396`, always with `access_scope = 'ORGANISATION'` and `tenant_id = NULL` — **a self-contradictory combination** (see §6.3).

This role triggers the collapsed customer UI at `App.tsx:1151` / `Sidebar.tsx:1172`.

---

# 4. Permission → screen map (what developers get wrong)

The sidebar gates navigation on `Sidebar.tsx:35-52`. **The permission codes there largely do not exist in the database.**

## 4.1 The vocabulary mismatch

`Sidebar.tsx` requires codes such as `billing.read`, `policy.read`, `audit.read`, `model.read`, `provider.read`, `incident.read`, `dsar.read`, `system.configure`.

Migrations `002` + `024` seed **21 permissions**, using different names: `tenant.read/write/delete/update`, `user.read/create/update/disable`, `routing.edit`, `models.configure`, `providers.write`, `apikeys.create/revoke`, `policies.write`, `security.write`, `compliance.dsr`, `audit.export`, `billing.write`, `incidents.write`, `cmdb.write`, `sla.write`, `iam.users.write`, `iam.roles.write`.

A compatibility shim exists — `src/security/permissionImplications.ts` maps legacy names forward:

```
routing.edit     → routing.read, routing.modify
models.configure → model.read, model.configure
providers.write  → provider.read, provider.configure
policies.write   → policy.read, policy.create, policy.modify, policy.disable
audit.export     → audit.read
billing.write    → billing.read, billing.modify
iam.users.write  → user.read, user.create, user.update, user.disable
```

`iamRepository.ts:383,404,535` applies it on every read. **This works — but note what is missing:**

| Sidebar code | Implied by | Status |
|---|---|---|
| `billing.read` | `billing.write` | ✅ |
| `policy.read` | `policies.write` | ✅ |
| `audit.read` | `audit.export` | ✅ |
| `model.read` | `models.configure` | ✅ |
| `provider.read` | `providers.write` | ✅ |
| `incident.read` | — | ❌ **`incidents.write` has no implication entry** |
| `dsar.read` | — | ❌ **`compliance.dsr` has no implication entry** |
| `system.configure` | — | ❌ **no seeded permission matches** |
| `customer.add` / `tenant.write` | `tenant.write` | ✅ (`Sidebar.tsx:36`) |

**Consequence:** a `TENANT_ADMIN` has `incidents.write` but not `incident.read`, so the **Incidents & alerts** screen is hidden (`Sidebar.tsx:49`) even though they can write incidents. Same for **Privacy & compliance** (`dsar.read`) and **Platform settings** (`system.configure`). They only appear under `globalScope`.

## 4.2 Four roles have no permissions whatsoever

`002:157,159,162,163` define `PLATFORM_ADMIN`, `SECURITY_OFFICER`, `SERVICE_MANAGER`, `DEVELOPER` — and `002:189-211` grants permissions to only five roles. The other four get **no `iam_role_permissions` rows**.

A `DEVELOPER` therefore has an empty permission set server-side. Their Developer Platform menu items require `tenant.read` (`Sidebar.tsx:42,46,47`) — which they don't have. They see nothing unless `globalScope` is true.

## 4.3 `globalScope` overrides everything

`Sidebar.tsx:135`: `const permitted = globalScope || Boolean(...)`. `globalScope` comes from `App.tsx:1169` → `authorizationScope?.global`.

**A global `SUPER_ADMIN` sees every screen regardless of permissions.** This is why the UI appears to work correctly for the founder account while tenant-scoped users see far less than expected. When testing role behaviour, **you must use non-global accounts**, or you will conclude the permission model works when it does not.

---

# 5. Known structural defects (developer-facing)

## 5.1 CRITICAL — commercial hierarchy is not enforced

`src/db/mariadb.ts:293-298` loads the authorisation graph from `tenants.metadata_json.$.parentId`. It does **not** read `commercial_organization_relationships`.

Then `mariadb.ts:329-331` builds every edge as:

```ts
status: 'ACTIVE', effectiveFrom: undefined, effectiveTo: null
```

Consequences:
1. **`isEffective()` is dead code on the live path** — always `true`.
2. **No relationship can ever expire.**
3. **`relationship_type` is discarded** — a `RESELLER` edge and a `SUBSIDIARY` edge authorise identically.
4. **Commercial and technical hierarchies can silently diverge.**
5. `025:1` — `-- Technical tenant/IAM records are deliberately not backfilled.` — so they start empty and independent.

Migration `032:2` states the policy outright: *"This does not grant technical tenant, application, or credential access."* The commercial plane **cannot** grant access, by design.

## 5.2 CRITICAL — nested subsidiaries cannot be scoped

Because auth reads `tenants.parentId` (single parent, no type), a `DESCENDANTS` grant over a group **cannot distinguish** subsidiary from reseller. If a reseller is a direct child, it inherits group visibility.

## 5.3 `commercial_organization_relationships` rows written but rarely linked to users

`onboardingOrchestrator.ts:318-324` writes `commercial_account_iam_relationships` (`ACCOUNT_ADMINISTRATOR`). Nothing in `src/security/` reads that table. It is a **record, not an enforcement**.

## 5.4 Self-contradictory `CUSTOMER_ACCOUNT_USER` assignment

`commercialFoundationRoutes.ts:396` assigns `role_customer_account_user` with `tenant_id = NULL` **and** `access_scope = 'ORGANISATION'`. The role has no tenant, so it cannot be organisation-scoped to anything. Combined with §5.1, customer-mode access is effectively gated only by the role string — checked **client-side** at `App.tsx:1151` and `CommercialAccountPortalView.tsx:23-24` via `localStorage`.

**Client-side gating is not authorisation.** A user editing `localStorage` in devtools becomes `CUSTOMER_ACCOUNT_USER`.

## 5.5 Reseller identity lost at write time

`:201` collapses `RESELLER` → `organization_type = 'PARTNER'`. Any query filtering on `organization_type = 'RESELLER'` returns **zero rows**.

## 5.6 Individual customers over-provisioned

`:313` grants `TENANT_ADMIN` + `ORGANISATION` to every wizard user including `INDIVIDUAL` customers. No `SELF`-scoped path exists.

## 5.7 Wizard creates one user; the business needs 3–6

`:289-335`. No bulk invite. `iam_admin` exists (`Sidebar.tsx:113`) and `authRoutes.ts:374,438` implement `user.create` with the same-grant check — so the follow-up path exists, it is just manual.

**Note the role-escalation guard** at `authRoutes.ts:459`: `SUPER_ADMIN` and `CUSTOMER_ACCOUNT_USER` are not assignable, and every requested permission must already be held by the actor (`actorGrant.permissions.includes(permission)`). This is a **good, correct** control — a `TENANT_ADMIN` cannot grant a role they do not themselves hold.

## 5.8 Seeded admin with a hardcoded personal email

Migration `002:214` seeds `user_super_admin_001` with password `Admin@Altil2026!` and email `horatio.huxham@gmail.com`. Migration `033` suspends it **only if** another global `SUPER_ADMIN` already exists, and **only if** the database name does not match `/test/i`.

**On an un-migrated database, this account is a live global admin with a documented password.** Apply `033` before any non-development deployment.

Also: `iamRepository.ts:550` grants this user a **hardcoded in-memory fallback** with the full permission set (`'tenant.read', 'billing.read', 'dsar.read', ...`) whenever the database is unreachable. **If the DB is down, `user_super_admin_001` still authenticates.** Guarded by `allowsInMemoryIamFallback()`, but verify that gate is off in production.

---

# 6. Reference tables

## 6.1 Roles (all 10)

| Role ID | `role_code` | Intended capability | Permissions seeded | Menu visibility |
|---|---|---|---|---|
| `role_super_admin` | `SUPER_ADMIN` | Global control | **All** (`002:191`) | All (via `globalScope`) |
| `role_platform_admin` | `PLATFORM_ADMIN` | Routing, providers, cluster | **NONE** ⚠️ | Only if `globalScope` |
| `role_tenant_admin` | `TENANT_ADMIN` | Tenant-bounded admin | 5 + 5 (`002:195`, `024:30`) | Customers, Developer Platform |
| `role_security_officer` | `SECURITY_OFFICER` | POPIA/GDPR guardrails, containment | **NONE** ⚠️ | Only if `globalScope` |
| `role_compliance_officer` | `COMPLIANCE_OFFICER` | DSRs, data subject records | 4 (`002:200`) | Trust & governance |
| `role_finops_manager` | `FINOPS_MANAGER` | Licensing, quota, credits | 3 (`002:205`) | Finance |
| `role_service_manager` | `SERVICE_MANAGER` | ITIL catalogue, SLA, incidents | **NONE** ⚠️ | Only if `globalScope` |
| `role_developer` | `DEVELOPER` | Playground, keys, telemetry | **NONE** ⚠️ | Only if `globalScope` |
| `role_auditor` | `AUDITOR` | Read-only across ledgers | 2 (`002:210`) | Reports, logs |
| `role_customer_account_user` | `CUSTOMER_ACCOUNT_USER` | Customer portal | none seeded | Collapsed "My Account" |

⚠️ = no `iam_role_permissions` row; functionally permission-less.

## 6.2 `access_scope` values (migration `024:6`)

| Value | Meaning | Set by onboarding? |
|---|---|---|
| `GLOBAL` | All organisations | No — only `024:10` for the seed `SUPER_ADMIN` |
| `ORGANISATION` | Assigned tenant only | **Yes, always** (`:313`) |
| `DESCENDANTS` | Tenant + children | No |
| `SELF` | Own data only | No |
| `TREE` | Full subtree | No |

Default is `ORGANISATION` (`024:6`). **Onboarding never varies this.** Developers needing group-wide or end-user scopes must assign them manually.

## 6.3 `relationship_type` values

`SUBSIDIARY` · `PARTNER` · `RESELLER` · `DIRECT_CLIENT` · `DIRECT_CUSTOMER` (orchestrator input, `:9`)

Stored in `commercial_organization_relationships.relationship_type`. **Ignored by authorisation.**

## 6.4 `organization_type` values

Defined in `foundation.ts:1` as `INTROSOFT | SUBSIDIARY | PARTNER | RESELLER`, but `validateCommercialOrganizationType` (`:146-148`) permits only `SUBSIDIARY | PARTNER | RESELLER` — **excluding `RESELLER` in practice** and `:201` writes `'CUSTOMER'`, which is **not in the type union at all**.

**`organization_type` is effectively unvalidated and inconsistent.** Do not build logic on it without first reconciling the vocabulary.

## 6.5 `scope_link_type` values

`PRIMARY | PRODUCTION | SANDBOX | DEVELOPMENT` (`foundation.ts:26`). Onboarding always writes `PRIMARY` (`:277`).

## 6.6 Other relationship vocabularies

- `commercial_customer_organization_relationships.relationship_type` → `CUSTOMER_OWNER` (`:241`)
- `commercial_relationships.relationship_role` → billing/account roles
- `commercial_account_iam_relationships.relationship_type` → `ACCOUNT_ADMINISTRATOR` (`:322`)

---

# 7. The billing-party conflation

`019` and `023` use a **single `tenant_id`** on `billing_payment_intents`, `accounting_journals`, `billing_orders`, `billing_order_lines`.

That single column must simultaneously mean six different things:

| Role | Current representation |
|---|---|
| Seller (supplies the service) | `tenant_id` |
| Sold-To (receives the service) | `tenant_id` |
| Bill-To (receives the invoice) | `tenant_id` |
| Payer (settles the account) | `tenant_id` |
| Managed-By (which operator administers) | **absent** |
| Consumed-By (whose usage generated it) | **absent** |

**Cannot be expressed today:** parent-paid group billing; reseller settlement; per-tenant revenue recognition when one account spans tenants. This is a **modelling** gap, not a wiring gap — it needs columns, and it blocks the reseller model in migration `031` from ever producing margin.

---

# 8. Developer decision guide

**Adding a new persona?** Create the role in `iam_roles`, seed permissions in `iam_permissions`, grant in `iam_role_permissions`, and — critically — **add the matching implication to `permissionImplications.ts` if the sidebar references a different code**, or the menu will silently be empty.

**Testing role behaviour?** Use a **non-global** account. `globalScope` hides every permission defect (§4.3).

**Assigning group-wide visibility?** Use `access_scope = 'DESCENDANTS'`, but be aware it resolves against `tenants.parentId` (§5.1) and ignores `relationship_type` (§5.2).

**Writing a date filter?** Use `isEffectiveAt` from `foundation.ts:162`. Half-open intervals.

**Writing an access check?** Follow `authorizationContext.ts:90` — permission and target org **from the same grant**. Do not copy `foundation.ts:62`.

**Building reseller features?** Expect §3.5 and §7 to block you. The schema is present; the billing model and UI are not.

**Before any production deployment:** apply `024` **and** `033` (§5.8), and verify `globalScope` and the in-memory fallback (`§5.8`) behave correctly with the database unreachable.

---

# 9. Verification basis

**Read directly:** migrations `002` (roles `:155-211`, permissions `:168-187`, seed admin `:213-232`), `024` (`access_scope` `:6`, global marking `:9-12`, permissions `:17-32`), `025` (`organizations` `:2-11`, relationships `:14-29`, seed `:148-151`), `031`, `032` (`:2`, `:24-26`), `033` (full); `src/commercial/onboardingOrchestrator.ts` (full, 502 lines); `src/commercial/foundation.ts` (full, 171 lines); `src/security/permissionImplications.ts` (full); `src/components/Sidebar.tsx:10-52,125-139,163`; `src/App.tsx:1151,1168-1172`; `src/db/mariadb.ts:293-331`; `src/db/iamRepository.ts:355-427,508-563`; `src/routes/commercialFoundationRoutes.ts:26,191,310,396`; `src/routes/authRoutes.ts:374-459`; `src/security/authorizationContext.ts:90-104`; `src/security/organizationScope.ts:104`.

**Drift since the 2026-10-01 patent audit:** migrations `033_neutralize_shared_seed_super_admin.sql` and `036_dsar_repository_contract.sql` are new; repository is now at 31 commits (was 12). **The patent dossier's finding that "the organisation hierarchy has no persisted structure" is now outdated** — the structure exists, and the orchestrator writes `access_scope`. The substantive position (migration unapplied, auth does not read the relationship table) is unchanged, but that finding must be re-verified before any legal use.

**Method:** `grep` / `read` against the working tree. **No runtime execution, no database inspection, no test execution, no files modified.**