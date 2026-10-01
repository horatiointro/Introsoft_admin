# ALTIL — Patent Executive Summary

**Prepared:** 2026-10-01 · **Subject:** ALTIL @ `aea883a` · **Research only — not legal advice**
**Full dossier:** `research/ALTIL_PATENTABILITY_AND_PRIOR_ART_AUDIT.md`

---

## 1. What is ALTIL technically?

A **multi-tenant AI/LLM inference gateway with a governance and authorisation control plane**, plus a large commercial/ITIL/billing application layered on top.

Technically: external applications call an OpenAI-compatible endpoint (`/v1/chat/completions`) using their **own** tenant-scoped API key. ALTIL holds the upstream provider credentials, normalises across provider formats, enforces **policy and PII masking before the request leaves the platform**, routes to a model, falls back to alternates on failure, and records per-tenant usage and audit.

Everything funnels through **one choke point**: `app.post('/api/v1/orchestrate')` at `server.ts:5932`. Every public route is rewritten into it (`server.ts:5562`).

**What is genuinely well built and tested:**
- Client credentials are **provably never forwarded upstream** — a parameter allow-list rejects `provider` and `apiKey` in the request body (`openAiChatRequest.ts:86-110`; regression-tested at `openAiChatRequest.test.ts:11,12,28`).
- Policy engine and compliance engine run **before every provider call**, including **re-run for each failover candidate** (`server.ts:6965,6975`).
- Cross-tenant denial on the inference path (`server.ts:6068-6116`).
- Fail-closed, per-request credential revocation, no caching.
- Provider credentials AES-256-GCM encrypted at rest.

**What is not built, despite sounding built:**
- The organisation hierarchy has **no persisted edges** — it is derived at request time from `tenants.metadata_json.$.parentId` (`mariadb.ts:293-323`). No `parent_id`/path/depth table exists in any of migrations 001–034.
- `loadBalancingStrategy` and `secondFallbackModelId` are **written and displayed but never read at runtime** (`server.ts:5167`, `5159`). The UI offers round-robin, lowest-latency and cost-optimised routing; the engine implements none of it.
- No cost-based, health-based or latency-based routing. No circuit breaker. `healthCheck()` is never called on the request path.
- The capability registry (`src/capabilities/capabilityRegistry.ts`) is **advisory metadata for UI display — it gates no route**.
- MFA has **no verifier**; because MFA is required for Super Admins, **no Super Admin can log in on a fresh production deployment**.
- Migration `024` (which carries the whole authorisation scope model) is **unapplied** — confirmed in ALTIL's own docs.
- `requireAltilGatewayAuthentication` (`authMiddleware.ts:279-340`) is a **hardcoded stub with zero call sites** that assigns fixed values like `tenantId: 'tenant-enterprise-1'`.
- Provider credentials live in a **flat JSON file** (`.altil-data/provider-accounts.json`), not the database, under one global vault key, with no rotation.

---

## 2. What already exists?

**Almost all of it, dating from 2023.** This is the central finding.

| ALTIL feature | Already disclosed in | Date |
|---|---|---|
| OpenAI-compatible multi-provider gateway | Salesforce `US20240303443A1` | **2023-03-07** |
| Gateway-held vendor credentials, vendor-specific AuthN/AuthZ | Salesforce `US20240303443A1` | 2023-03-07 |
| Policy enforcement *before* the LLM service | Cisco `US20240388551A1` claim 1 | **2023-05-17** |
| Block / rewrite / **redirect** to alternative LLM | Cisco `US20240388551A1` dep. claims | 2023-05-17 |
| Regex PII blocking before LLM egress | Cisco `US20240388551A1` (Rules module 325) | 2023-05-17 |
| Tenant-configured management rules governing model routing | Airia `US12277245B2` | 2024-05-22 |
| Reversible PII transformation + route to alternate provider | Airia `US12277245B2`, `US12579347B1` | 2024-05-22 |
| Pre-call PII redaction, pluggable guardrails | AWS Bedrock Guardrails | 2023-11-28 |
| Virtual keys, per-key budgets, provider failover | LiteLLM | **2023-07-27** |
| Organisation hierarchy RBAC | RBAC96 / XACML / ROBAC | **1996–2006** |
| Capability binding an action to an object set | SAP `US20180144150A1` | 2016-11-22 |
| Delegation bounded by the delegator | Amazon `US8769642B1`; RFC 8693 | **2011 / 2020** |
| Fail-closed complete mediation | Saltzer & Schroeder | **1975** |

Six independent claims were read verbatim by this audit (Salesforce, Cisco, Airia ×2, SAP, Amazon).

**Worse: the timing.** ALTIL's entire committed history runs **2026-08-29 → 2026-09-29**. The closest named family — AuraSpark's "Provider-Independent Hierarchical Constraint Enforcement Architecture" (inventor Richard J. Mitchell, AuraSpark Technologies LLC) — was **filed in March 2026** and **published 2026-08-06, twenty-three days before ALTIL's first commit** (verified via the applicant's own disclosures citing application 19/575,914).

ALTIL is a **later filer**. That art is not something ALTIL can overcome; it is a potential **blocking reference** and a competitor — AuraSpark publicly offers "governance-as-a-service middleware" for licence.

---

## 3. What is potentially different?

Only in the **authorisation model**, not the gateway.

**The strongest candidate — the same-grant invariant.** `requireOrganizationPermission` (`authMiddleware.ts:230-252`) requires that the requested permission **and** the target organisation both be satisfied by a **single** grant, prohibiting composition of scope from one assignment with permission from another. Applied at the AI inference boundary, this prevents authorisation composition — a tenant-boundary traversal primitive.

No located reference states this as an explicit prohibition. But its **effect** is well precedented by construction in SAP capability claims, Zanzibar/OpenFGA tuples, and Cedar. It reads as an invariant of a known model — which carries a **high obviousness risk**.

**Second candidate — per-candidate governance re-evaluation.** During failover, ALTIL re-runs policy *and* compliance for each candidate (`server.ts:6965,6975`), so a substituted model cannot inherit the primary's clearance. Cisco, WitnessAI and Airia all route or redirect as a **remediation outcome**; none located re-derives the policy per candidate. Narrow, but real, and implemented.

**Third — delegated machine-credential scope ceiling.** Ceiling = intersection(caller permission, application capabilities, runtime-enforced scope set). Predominated by Amazon '11 and RFC 8693.

**What should NOT be claimed:**
- The AI gateway itself, provider abstraction, gateway-held credentials, routing, failover, pre-inference policy, PII masking, usage metering — **all crowded centre-field, 2023-era**.
- Credential non-forwarding — conventional gateway hygiene.
- Anything compliance-driven: **ISO/IEC 42001 (2023-12-18)** and the **EU AI Act (2024-06-13)** already *mandate* event logging and provenance. Mandated behaviour is the weakest possible patent territory.
- **Everything commercial**: billing, subscriptions, licensing, catalogue, payment gateways, sales funnel, onboarding, UI. Excluded by subject matter.

---

## 4. The strongest candidate inventions

1. **Same-grant authorisation invariant enforced at the AI inference boundary**, with descending organisation-hierarchy scope and a machine-credential delegation ceiling. — Highest technical specificity; highest obviousness exposure.
2. **Per-candidate governance re-evaluation during provider failover**, such that a substituted model is re-authorised rather than inheriting clearance. — Implemented and tested; likely a dependent claim.
3. **Delegated machine-credential scope ceiling at the inference boundary.** — Differentiation is formulation only; effect is 2011 art.
4. **Descendant-scoped machine credentials at an inference boundary.** — The hierarchy is 1996-era art; novelty would rest entirely on the combination.
5. **Client-credential non-forwarding.** — Conventional; defensive limitation clause only.

---

## 5. What prior art is closest?

1. **Salesforce `US20240303443A1`** (granted `US12591765B2`) — normalised cross-provider API, vendor-specific AuthN/AuthZ, `HeaderValueRouter` provider routing. Priority **2023-03-07**.
2. **Cisco `US20240388551A1`** — LLM firewall; claim 1 read verbatim: intercept → derive context → apply policies; dependents add block/rewrite/redirect, PII regex blocking, full-conversation audit. Priority **2023-05-17**.
3. **Airia `US12277245B2` / `US12579347B1`** — claim 1 read verbatim: tenant-defined management rules, reversible PII transformation, **prevent transmission to the default model and route to an alternate provider**. Priority 2024-05-22.
4. **WitnessAI `US20250307418A1`** — plurality of input inspectors blocking non-compliant input before it reaches LLMs; routing private vs public.
5. **AuraSpark `US20260228755A1`** — pre-execution provider-independent constraint enforcement. **Claims unread** (retrieval blocked). Its hierarchy is safety-criticality tiers, **not** an org tree.
6. **SAP `US20180144150A1`** — single "capability" binding an action to an object set; closest structural precedent for candidate 1.
7. **Amazon `US8769642B1`** — delegation of access privileges; closest precedent for candidate 3.

---

## 6. The enablement problem — the practical blocker

**A patent specification must describe an enabled embodiment. ALTIL currently cannot support one for its most interesting features.**

- **Hierarchical inference authorisation does not exist as implemented.** No persisted hierarchy edges; effective-dating fields hardcoded (`mariadb.ts:318-321`), making the effective-date logic dead code; migration 024 unapplied; the resolver tested only against synthetic fixtures, which ALTIL's own doc states are "not evidence of production structure."
- **Continuous inference provenance does not exist.** Correlation breaks twice: the HTTP layer mints a UUID (`server.ts:1998-2001`) while the orchestrator mints an unrelated `ALTIL-*` ID (`server.ts:6046`) and overwrites the response header at `6833`, with **no field joining them**; and **no correlation header is sent to the AI provider at all** (the adapter sets only `authorization`, `accept`, `HTTP-Referer`, `X-Title`). A provider-side incident cannot be tied to an ALTIL request by any identifier. Worse, `makeAltilEvent` (`eventModel.ts:36-38`) would **silently rewrite** ALTIL's own ID format, so any future unification would break correlation.
- **Only one provider adapter exists** (OpenRouter). Gemini bypasses the abstraction via SDK; others use raw `fetch`.

**ALTIL should not file a specification describing mechanisms it does not implement.**

---

## 7. Evidence preservation — do this now

**~60 untracked files, including every security, governance, provider-abstraction and authorisation module, have never been committed to git.** The committed history contains only a Control Centre skeleton with login/session/IAM. The entire patent-relevant codebase is uncommitted and at risk.

1. **Commit the untracked files with a dated commit.** This is the single highest-value action — it creates defensible dated evidence and prevents loss.
2. **Back up the working tree outside the repo.** It is dirty, with `.backup-*` files and provider credentials in `.altil-data/`.
3. **Preserve the architecture docs as-is.** `ALTIL_ORGANIZATION_SECURITY_MODEL.md`, `ALTIL_AUTHORIZATION_AUDIT.md`, `ALTIL_CAPABILITY_AUDIT.md`, `AUTHENTICATION_SECURITY_BOUNDARY.md` are unusually candid — which makes them credible contemporaneous engineering records. **Version them; do not rewrite them to look more complete.**
4. **Hunt for pre-2026-08-29 design evidence.** The only route to a priority date earlier than AuraSpark's March 2026 filing. Look at earlier repositories, design docs, tickets, emails, chat exports.
5. **Check for public disclosure.** Demoed, presented, or shown to a customer? The US gives a 12-month grace period. **South Africa and most of Europe give none** — any public disclosure may already be fatal.

---

## 8. What a patent attorney must resolve

1. Given Salesforce (2023-03) and Cisco (2023-05) disclose the gateway core in combination, **what remains claimable** about ALTIL's gateway?
2. Given Airia recites tenant rules + PII transformation + alternate-provider routing, is there **any non-obvious governance+routing claim** available?
3. Is the **same-grant invariant** patentable subject matter, or an obvious implementation constraint of RBAC/ABAC/ReBAC?
4. Does restricting enforcement to an **AI inference boundary** supply the technical character that would otherwise be missing (EPO G-II 3.3.1)?
5. Combining a **1996-era hierarchy** with a **2023-era gateway** — obviousness trap? What synergy evidence answers it?
6. Can the delegation ceiling survive Amazon '11 + RFC 8693?
7. **Does ALTIL currently support an enabled embodiment of its most claim-worthy features at all?** (Answer appears to be no for hierarchy and provenance.)
8. **AuraSpark filed March 2026, published 2026-08-06, before ALTIL's first commit.** What is the freedom-to-operate exposure, and is their licensing offer a competitive threat?
9. Which jurisdictions — SA, US, EP, PCT — and PCT-first?
10. Narrow single-concept filing vs. broad architecture filing likely to be rejected?

---

## Confidence and limitations

**Reasonably confident:** the implementation reality (verified directly in source with file:line); the development timeline (verified from git); Salesforce, Cisco, Airia, SAP and Amazon claim content (read verbatim); the non-patent dates (published dates, not inferred).

**Not confident / flagged as unverified:**
- **AuraSpark `US20260228755A1` and `US20260238651A1` claims could not be read.** Google Patents 404s; Justia, Espacenet, PatentGuru and FreePatentsOnline all refused automated access; the USPTO PDF is image-only with no local OCR. Bibliography and abstract were confirmed via the applicant's own disclosures. Closing these needs OCR, an Espacenet account, or a paid database — **and it matters most precisely because AuraSpark is the closest reference and predates ALTIL.**
- The search is **not exhaustive**. No CPC/IPC classification-driven search was run; no paid full-text database was used; citations and citing documents were not systematically traversed.
- Some non-patent dates come from vendor announcements rather than archived first-commit history.
- **No freedom-to-operate conclusion is offered**, and none should be inferred.

**No source files, migrations, database data, package files or configuration were modified. The only new files are the two research documents.**
