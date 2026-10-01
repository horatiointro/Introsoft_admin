# ALTIL — FULL PATENTABILITY & PRIOR-ART DISCOVERY AUDIT

**Prepared:** 2026-10-01
**Subject:** ALTIL repository at `C:\Project\Introsoft_git\ALTIL` (git HEAD `aea883a`)
**Nature of this document:** Technical invention-discovery and patent-landscape research. **Not legal advice.**
**Code changes made:** None. See §25 verification.

---

# Executive Summary

ALTIL is, technically, a **multi-tenant AI/LLM inference gateway with a governance and authorisation control plane**, plus a substantial commercial/ITIL/billing application layered on top. Its public surface is an OpenAI-compatible endpoint (`/v1/chat/completions`) that client applications call with their *own* tenant-scoped API key. ALTIL holds upstream AI provider credentials, translates between provider formats, enforces policy and PII/PII-masking compliance **before** the request leaves the platform, routes to a selected model, falls back to alternates on failure, and records per-tenant usage/audit.

**The audit's central conclusion is uncomfortable and should be stated plainly:**

1. **The overwhelming majority of ALTIL's technical surface is not located as novel in this search.** Multi-tenant AI gateway, caller-supplied tenant credential, gateway-held upstream provider credentials, normalised cross-provider API translation, pre-inference policy enforcement, PII masking before third-party LLM egress, model failover, and per-tenant usage attribution are each individually disclosed — and several are disclosed *in combination* — in patent applications and shipping products dating from **2023**.

2. **ALTIL's development window is 2026-08-29 to 2026-09-29** (12 commits, verified). This places it **after** nearly all of the identified prior art, including the closest named family (AuraSpark PIHCE, filed **March 2026**, published **2026-08-06** — verified independently via the applicant's own disclosures). ALTIL cannot claim priority over that art.

3. **The genuinely unusual elements are narrow and specific**, and they sit in the *authorisation model*, not in the AI gateway. The strongest candidate is the **same-grant invariant** — the rule that the requested permission *and* the target organisation must be satisfied by a **single** grant, prohibiting composition of scope from one assignment with permission from another (`src/middleware/authMiddleware.ts:230-252`), evaluated at the AI inference boundary. No reference located states this as an explicit prohibition, though its *effect* is well precedented by construction in SAP capability claims, Zanzibar/OpenFGA tuples, and Cedar.

4. **A significant fraction of ALTIL's most impressive-sounding architecture is not actually implemented.** This materially changes what could be claimed. Specifically: the organisation hierarchy has **no persisted edges**; dynamic routing fields (`loadBalancingStrategy`, `secondFallbackModelId`) are **written and displayed but never read at runtime**; MFA has **no verifier**; the capability registry is **advisory metadata, not enforcement**; provider credentials live in a **flat JSON file**, not the DB; and request correlation uses **two incompatible ID systems that are never joined**, with **no correlation header forwarded upstream**.

5. **No reference was located that combines** organisation-hierarchy delegation *enforced at an AI inference boundary* with *delegated machine-credential scope ceilings*. That is the most plausible residual territory — but it is unproven, rests largely on unapplied migration `024`, and requires claim-level analysis by an attorney.

**Bottom line:** ALTIL is a technically substantial and partly well-engineered system, but as an *integrated architecture* it appears to sit inside a heavily-occupied space that predates it. The realistic opportunity is a narrow, specific claim around authorisation invariants at the inference boundary — not around the gateway itself.

---

# ALTIL Technical Architecture

## Form factor

Single-page React/TypeScript frontend (`src/App.tsx`, 68.6 KB, ~50 view components) against a **single-file Express server** (`server.ts`, ~8,082 lines) with modular repositories, security helpers, route modules, and engines. Data layer is MariaDB (34 migrations, `migrations/001`–`034`) with an in-memory fallback store seeded from `src/data/initialState.ts` (96.6 KB).

## Control plane entities

| Entity | Storage | Notes |
|---|---|---|
| Platform owner | Introsoft | Root of intended org graph |
| Tenants / organisations | `tenants` table; hierarchy in `tenants.metadata_json` (`$.parentId`, `$.orgRole`) | **No persisted hierarchy edges** — see below |
| Users | `iam_users` (`migrations/002:6-29`) | bcrypt cost 10; `tenant_id NULL` means platform user, **not** global authority |
| Roles / permissions | `iam_roles`, `iam_permissions`, `iam_role_permissions` | ~60 permission codes; `SUPER_ADMIN` declared with `'*'` wildcard that **no guard interprets** |
| Role assignments (scoped) | `iam_user_roles` + `access_scope` column (`migrations/024`) | **Migration 024 is UNAPPLIED** — the scope model does not exist in the live schema |
| Sessions | `iam_user_sessions` | 256-bit token; `is_active`/`expires_at` checked per request |
| MFA | `iam_mfa_credentials` | Table exists; **no verifier implemented** |
| Applications | `tenant_applications` | Gateway clients |
| API keys | `tenant_api_keys` (`migrations/012:4-16`) | `key_hash CHAR(64)` — **unsalted SHA-256** |
| Credential scopes | `src/security/credentialScopeAuthority.ts:14-25` | Only `read:inference` is `RUNTIME_ENFORCED` |
| Providers | in-memory `providers` + `scripts/init_mariadb.sql:119-139` `ai_providers` | **DB table is dead relative to running code** |
| Models | in-memory + `ai_models` | Same |
| Routing rules | in-memory `routingRules` + `ai_capability_routing` | **DB table dead** |
| Policies | `src/utils/policyEngine.ts` | Real, on the inference path |
| Compliance rules | `src/utils/complianceEngine.ts` | Real, on the inference path |
| Plans / licences / subscriptions / catalogue | `src/commercial/stage*` | **Business layer** — see §Commercial Architecture |

## Data / inference plane — actual traced path

**Ingress (normalisation + credential separation).** `server.ts:5514-5614` intercepts `POST /v1/chat/completions`, `/api/v1/chat/completions`, `/v1/responses`, `/api/v1/responses`.

1. `validateOpenAiChatRequest(body)` — `server.ts:5528`. Allow-lists 14 parameters; rejects anything else as `unsupported_parameter`. **Explicitly rejects `provider` and `apiKey` in the body** (`openAiChatRequest.test.ts:11-12`).
2. Unsupported modalities rejected — `server.ts:5536-5538`.
3. Credential resolved; body rewritten to an internal envelope — `server.ts:5540-5560`.
4. **`req.url` rewritten to `/api/v1/orchestrate`** — `server.ts:5562`.
5. Response re-wrapped into OpenAI shape, with `altil.request_id`, `altil.provider`, `altil.policy_passed`, `altil.fallback_used` — `server.ts:5564-5610`.

**Orchestration (`server.ts:5932`).** The single place an external provider is actually called. Ordered stages:

| # | Stage | Location |
|---|---|---|
| 1 | AuthN — API key (`resolveApiKey` + `validateRuntimeApiKey` with `requiredScope: 'read:inference'`) or bearer session | 5936-6036 |
| 2 | Rate limit → 429 | 5988-5998 |
| 3 | Tenant ID derivation | 6056-6060 |
| 4 | **Cross-tenant denial** if `appId` belongs to another tenant | 6068-6116 |
| 5 | API-key ↔ application binding (same tenant, app active) | 6120-6126 |
| 6 | Billing guardrails (spend, quota, licence, trial) | 6130-6222 |
| 7 | Application resolution | 6230-6238 |
| 8 | Tenant knowledge retrieval (untrusted context) | 6322-6336 |
| 9 | Model/provider resolution | 6374-6382 |
| 10 | **PolicyEngine.evaluate #1** | 6388-6406 |
| 11 | **Compliance scanAndSanitizePrompt #1** | 6460-6484 |
| 12 | Policy-block → audit + 422 | 6488-6598 |
| 13 | Routing rule match | 6638-6654 |
| 14 | Routeable model filter | 6658-6682 |
| 15 | **PolicyEngine.evaluate #2** (primary model) | 6684-6686 |
| 16 | **Compliance #2** (primary model) | 6688-6690 |
| 17 | **PRIMARY DISPATCH** — Gemini SDK / OpenRouter adapter / generic OpenAI-compatible | 6736-6928 |
| 18 | **FALLBACK LOOP** — re-runs policy **and** compliance per candidate | 6935-7057 |
| 19 | Audit log | 7091-7141 |
| 20 | Billing usage event | 7241-7257 |
| 21 | Policy evidence record | 7265-7285 |

**State carried between stages:** `apiKey` record, `appId`, `callerTenantId`, `chosenCapability`, `namedRequestedModel`, `guardedQueryText`, `sanitizedPrompt`, `primaryModel`, `fallbackModel1`, `requestId`, `finalModel`, `finalProvider`, token counts.

## Provider abstraction — reality check

**Correction to an initial misreading:** the `aiGateway` adapter is **live**, not dead code.

- `OpenRouterProviderAdapter` — imported `server.ts:188`, instantiated at `server.ts:1695` and `server.ts:6820`.
- `validateOpenAiChatRequest` — `server.ts:5528`.
- `toOpenRouterChatRequest` — `server.ts:6804`.
- `relaySseStream` — `server.ts:6835`.
- `openAiModelList` — `server.ts:5622`.

**But the abstraction is narrow:** only **one** concrete adapter exists (OpenRouter). Gemini bypasses it via SDK (`server.ts:6754`); other OpenAI-compatible providers use a raw `fetch` at `server.ts:1694-1701`. The interface methods `responses()`, `embeddings()`, `healthCheck()`, `listModels()` are **never called** from `server.ts`.

---

# ALTIL Trust Model

| Question | Answer | Evidence |
|---|---|---|
| What establishes trust? | Session token or API key, verified per request, fail-closed | `authMiddleware.ts:69-171`, `iamRepository.ts:816-833` |
| What establishes identity? | `iam_users` + session record; or API key → tenant + application | `types.ts:328-350` |
| What establishes authority? | Role assignment → permission → **single grant** containing both permission and target org | `authMiddleware.ts:230-252` |
| How is authority scoped? | `access_scope` ∈ {GLOBAL, ORGANISATION, DESCENDANTS, SELF, TREE} | `credentialScopeAuthority.ts`, `organizationScope.ts:53-97` |
| Hierarchy effect? | BFS traversal over `parentId` adjacency for DESCENDANTS/TREE | `organizationScope.ts:88-95` |
| Application identity effect? | Key bound to tenant **and** application **and** scopes | `server.ts:5469-5471` |
| Can key authority exceed a human's? | **No** — ceiling computed from caller's `apikeys.create` in target org + app `allowedCapabilities` + `RUNTIME_ENFORCED` set | `credentialScopeAuthority.ts:39-78` |
| Read/write distinction? | Permission-code suffix convention | `permissionImplications.ts:6-14` |
| **Same-grant rule** | **Permission AND target org must come from ONE grant** | `authMiddleware.ts:245` |
| Global vs tenant | GLOBAL only for `SUPER_ADMIN` + null org + explicit `GLOBAL` | `authorizationContext.ts:43-44`, `authMiddleware.ts:185-188` |
| Revoked credentials | Fail-closed, checked per request, no cache | `iamRepository.ts:816-833`, `apiKeyCredential.ts:37` |
| Provider credential isolation | Client credentials **never** forwarded upstream; ALTIL substitutes its own | `openAiChatRequest.ts:24,86-110`, `openRouterProvider.ts:70,99` |

### Defects bearing on patentability

- **`src/middleware/authMiddleware.ts:279-340` `requireAltilGatewayAuthentication` is a hardcoded stub with ZERO call sites.** It validates only token prefix/length, then assigns static values (`tenantId: 'tenant-enterprise-1'`, `prin-system-1`). It never checks revocation, despite its docstring claiming "Fail-Closed Gateway … Revoked credential -> 401". A reviewer reading the docstring alone would materially misdescribe the system.
- **MFA cannot succeed.** `mfaVerification.ts:37-42` states no decrypt/TOTP adapter is implemented; `verifyMfaCode` returns `'UNAVAILABLE'`; because `isMfaRequired` is true for any `SUPER_ADMIN`, **no Super Admin can log in on a fresh production deployment** (`iamRepository.ts:719-726`).
- **API keys hashed with unsalted SHA-256** (`apiKeyCredential.ts:8-10`) vs bcrypt-10 for passwords. No key rotation mechanism exists anywhere.
- **Organisation hierarchy has no persisted structure.** No `organization_hierarchy`/`parent_org_id`/path/depth table exists in any of migrations 001–034. Effective-dating fields in `OrganizationRelationship` are hardcoded (`mariadb.ts:318-321`), making `isEffective()` dead against the real loader.
- **Migration 024 unapplied** — per ALTIL's own docs (`ALTIL_ORGANIZATION_SECURITY_MODEL.md:9`). On a pre-024 database, `legacyIamAssignments.ts:17-42` deliberately drops NULL-tenant rows, yielding **no global Super Admin at all**.
- **`getRoles()` ignores the DB** and returns a frozen literal including `permissions: ['*']` (`iamRepository.ts:1223-1256`) — inert because no guard understands `'*'`, but misleading.
- **Superseded `elevatedToken`** returned by `reauthenticate` (`authRoutes.ts:275-302`) is never validated anywhere.
- **`requireOrganizationPermission`/`requireTenantAccess` read the target ID from `req.body`** as a fallback (`authMiddleware.ts:237-239`, `349-351`). Not an escalation (the grant is still checked), but it is client-driven target selection — and ALTIL's own security doc warns against exactly this.

---

# ALTIL AI Inference Model

Single choke point: `app.post('/api/v1/orchestrate')` at `server.ts:5932`. Every public OpenAI-compatible route is rewritten into it (`server.ts:5562`).

**Routing is real but simple.** `server.ts:6636-6716` matches rules by `(appId | 'all')` + `taskOrCapability`, falls back to `general_ai` then `routingRules[0]`. `isLiveModelRouteable()` (`server.ts:1675-1680`) filters on enabled/online/free-quota/not-exhausted + provider enabled + live credential — a **static configuration check, not dynamic health**.

**What does NOT exist (verified by grep for read-sites):**
- `loadBalancingStrategy` — written at `server.ts:5167`, displayed in `RoutingView.tsx:256`, **never read at runtime**. The field admits `'priority_fallback' | 'round_robin' | 'lowest_latency' | 'cost_optimized'` — purely cosmetic.
- `secondFallbackModelId` — written `server.ts:5159`, displayed `RoutingView.tsx:241-248`, **never read**.
- Cost-based routing: `costPer1kInput/Output` are stored and used **only for cost estimation** (`server.ts:7129`), never to choose a route.
- Circuit breaker, health-driven routing, latency routing, retry-with-backoff: **absent**. The only "retry" (`server.ts:1719`) is free-quota *account* rotation for the same provider.

**Failover IS real.** `server.ts:6935-7057` iterates `[fallbackModel1, ...otherRouteableModels]`, re-running `PolicyEngine.evaluate` (6965) and `scanAndSanitizePrompt` (6975) **per candidate**, then dispatches. All-fail → 503 `retryable: true`.

**This per-candidate re-evaluation is the single most technically interesting implemented behaviour in ALTIL** — a fallback model cannot escape the policy boundary.

**`src/utils/dcrEngine.ts` (729 lines) is NOT on the inference path.** Imported only by `src/routes/dcrRoutes.ts:7`; its `runFullPipeline` uses a *simulated* response (`dcrEngine.ts:676-684`).

---

# ALTIL Governance Model

## Controls that execute BEFORE the provider receives the request — verified real

| Control | Location | Status |
|---|---|---|
| `PolicyEngine.evaluate` (permittedProviders, permittedModels, permitted/prohibitedCapabilities, `localModelOnly`, `externalProviderBlock`, financialData, phiHandling, piiHandling) | `server.ts:6388`, `6684`, `6965` | **IMPLEMENTED**, 3 call sites |
| `scanAndSanitizePrompt` (POPIA SA ID/SARS/banking/phone; GDPR IBAN/email/IP; Art.9; Art.22; cross-border flag) | `server.ts:6460`, `6688`, `6803`, `6975` | **IMPLEMENTED**, 4+ call sites |
| Per-message sanitisation inside the provider request | `server.ts:6803` via `toOpenRouterChatRequest({sanitizeText})` | **IMPLEMENTED** |
| Credential-stripping allow-list (blocks `provider`, `apiKey` injection) | `openAiChatRequest.ts:24,86-110` | **IMPLEMENTED**, test-asserted |
| Tenant isolation on inference path | `server.ts:6068-6116` | **IMPLEMENTED** |
| Capability enforcement (via allow-listed params + modality rejection) | `server.ts:5528,5538` | **IMPLEMENTED** |

**Important caveat:** default `enforcementMode` is `'redact_mask'`; `actionTaken === 'BLOCKED'` requires `strict_block` (`complianceEngine.ts:358-365`). **The default configuration redacts but never blocks.** Any claim premised on "blocking" must be tied to `strict_block`.

## Advisory, not enforcement

`src/capabilities/capabilityRegistry.ts` is a **frozen metadata array of 30 hand-authored entries**. `capabilitiesForActor()` (264-271) powers `GET /api/v1/capabilities` for UI display. It **gates no route**. Its `status` field is self-declared (e.g. `PARTIALLY_IMPLEMENTED` on `api-keys.create`, `gateway.chat-completions`) and is **consulted by no enforcement path**. The file itself admits the inventory is deliberately incomplete (lines 25-27).

## Known governance gaps (self-documented, credible)

`ALTIL_ORGANIZATION_SECURITY_MODEL.md:61`: "Provider/model/routing, ITIL, compliance, DCR, and many reconciliation/settlement and security route families still have role-only or other compatibility paths."

`tenant_id IS NULL` widening patterns persist in `IamRepository.getUsers()` and ITIL/compliance repositories (documented at lines 47-59, flagged as **not yet fixed**).

---

# ALTIL Provider Abstraction

| Aspect | Reality |
|---|---|
| Provider API differences | Normalised to OpenAI chat-completions shape; Gemini handled separately via SDK |
| Authentication | **ALTIL-held only.** Managed accounts (AES-256-GCM encrypted) → env vars → seed placeholder rejected (`server.ts:1643-1659`) |
| Credential storage | **`.altil-data/provider-accounts.json`, mode 0600 — a flat file, NOT the database.** Single global vault key (`server.ts:220-241`). No tenant-scoped provider keys. No rotation. |
| Provider selection | Rule-based on app + capability; not cost/health/latency driven |
| Model selection | Requested model if routeable, else first non-failed routeable |
| Request transformation | `toOpenRouterChatRequest` — allow-list forwarding + `max_tokens` clamping |
| Response transformation | SSE relay; response re-wrapped to OpenAI shape |
| Failover | **Implemented**, with per-candidate policy+compliance re-evaluation |
| Routing | Static; strategy fields unread |
| Provider health | `ProviderHealth` type exists; `healthCheck()` **never called on the request path** |
| Policy enforcement | Real, pre-inference |
| Credential isolation | **Client credentials provably never forwarded upstream** — the strongest implemented guarantee |

---

# ALTIL Security Boundary

## Established

1. **Client → ALTIL credential separation.** Structural allow-list prevents credential/provider injection; regression-tested (`openAiChatRequest.test.ts:11-12,28`).
2. **Provider credential custody.** ALTIL holds upstream keys; the consuming application never does. AES-256-GCM at rest with per-secret IV and auth tag.
3. **Fail-closed session/key revocation**, per request, no cache.
4. **Cross-tenant denial** on the inference path (`server.ts:6068-6116`).
5. **Same-grant authorisation invariant** on reviewed routes.
6. **Tenant knowledge treated as untrusted context.**
7. **Audit-log immutability guard** — `blockAuditModification` blocks PUT/POST/DELETE on `/api/v1/logs*` and `/api/v1/audit*` (`server.ts:2470-2480`).

## Not established / weak

1. `requireAltilGatewayAuthentication` stub — hardcoded context, never wired.
2. MFA non-functional; no rate limiting or lockout on `POST /mfa/verify` (`authRoutes.ts:262-269`) — 6-digit code brute-forceable indefinitely.
3. In-memory demo fallback with 11 compile-time-known passwords (`iamRepository.ts:79-332`), gated to test/dev — production-denied (`authenticationBoundary.ts:11-16`).
4. `super-admin-access` quick-access endpoint issues a full session with **no password and no MFA** when `ALTIL_ENABLE_SUPER_ADMIN_QUICK_ACCESS=true` (non-production only).
5. `auditAuthorizationDenial` is fire-and-forget with a silent `.catch()` (`authMiddleware.ts:32-39`) — audit loss is invisible.
6. Provider credentials in a flat file, single global vault key, no rotation.

---

# ALTIL Audit/Provenance Model

## What IS correlated

A single `requestId` generated at `server.ts:6046` (format `ALTIL-XXXXXX-XXXXXX`) is used as the primary key for:
- the success audit record (`server.ts:7093`, `7141`);
- the blocked audit record (`server.ts:6508`, `6554`);
- the billing usage row in `tenant_key_usage` (`server.ts:7241-7257`);
- the `PolicyEngine.recordEvidence` policy decision (`server.ts:7265-7285`);
- the response payload `id` (`server.ts:7313`).

So **within** the orchestration handler, identity-ish context, model, tokens, cost, outcome, and policy decision share a key.

## What is NOT correlated — four concrete breaks

1. **The upstream provider call carries no correlation identifier.** `toOpenRouterChatRequest` forwards only allow-listed OpenAI parameters (`openAiChatRequest.ts:107-111`); the adapter sets only `authorization`, `accept`, `HTTP-Referer`, `X-Title` (`openRouterProvider.ts:97-103`). **No `X-Request-Id`, trace header, or tag is sent to the AI provider.** A provider-side incident cannot be tied back to an ALTIL request by any identifier.
2. **Two incompatible request-ID systems, never joined.** HTTP middleware generates a UUID and sets `X-Request-Id` (`server.ts:1998-2001`); the orchestrate handler generates an unrelated `ALTIL-*` ID (`server.ts:6046`) and **overwrites** the response header at `server.ts:6833`. The `API_REQUEST` audit event (2005) uses the UUID; the inference audit uses the `ALTIL-*` ID. **No field links them.**
3. **The authorisation decision is not recorded with the inference record.** The audit entry carries `apiKeyPrefix` (7101) but no auth-decision identifier, no cross-grant denial reason, and no link to the policy-decision record other than the shared `requestId`.
4. **Format collision hazard.** `makeAltilEvent` **overwrites** any requestId not matching a UUID regex with a fresh UUID (`eventModel.ts:36-38`). The `ALTIL-*` format would fail this test — so any future attempt to unify the two systems on the `ALTIL-*` ID would silently break correlation.

**Answer to the audit's central question:** ALTIL **cannot presently establish** a continuous, verifiable relationship across identity → organisation → application → credential → capability → request → authorisation decision → governance decision → provider → model → inference → response → audit record. It establishes a good part of this *inside one handler*, and breaks it at the HTTP boundary and, entirely, at the provider boundary.

---

# ALTIL Commercial Architecture

`src/commercial/stageA`–`stageF` plus `src/routes/commercialFoundationRoutes.ts` (73.3 KB) and `commercialCatalogueRoutes.ts` (30.9 KB): party accounts, contracts/quotes, orders/subscriptions, usage rating, financial lifecycle, customer 360, customer portal, finance workspace, AI FinOps, trust posture, durable mutations, catalogue resale, billing ledger, accounting journals, multi-currency, Stripe/PayFast/Ikhokha payment gateways, revenue recognition.

**These are commercial and administrative mechanisms.** Pricing, subscriptions, seat packages, payment, sales funnel, catalogue, commercial registration, onboarding-as-business-process, and UI appearance are **explicitly excluded from technical invention candidacy** in this audit. They may carry trade-secret or copyright protection; they are not the subject of a technical patent thesis.

One technical residue is worth separating out: **usage rating and metered per-tenant key consumption** (`src/commercial/stageD/usageRating.ts`, 49.6 KB; `tenant_key_usage` table). This is genuinely technical where it concerns **attributing token consumption to tenant + application + API key + model** for quota enforcement on the inference path. That is adjacent to known metering art (§Worldwide Prior-Art Landscape) and should not be overstated.

---

# Candidate Technical Inventions

## Candidate Invention 1 — Same-Grant Authorisation Invariant Enforced at the AI Inference Boundary

**Technical problem.** Where a principal holds several scoped grants, a naïve system can compose *scope* from one grant with *permission* from another and thereby authorise an operation on a target organisation the permission-holder was never granted for that target. At an AI inference boundary this becomes a tenant-boundary traversal primitive: a caller with narrow read authority on one organisation could reach inference on another.

**ALTIL mechanism.** `requireOrganizationPermission(permission, paramName)` (`authMiddleware.ts:230-252`) resolves a target organisation from the request and calls `authorizeInContext(auth, target, permission)` (245), which requires **both** the permission **and** target membership to be satisfied by **one** grant. `organizationsAuthorizedFor()` (documented at `ALTIL_ORGANIZATION_SECURITY_MODEL.md:39`) applies the same rule to list queries. Applied on the inference path, this prevents cross-grant authority composition at the moment of provider dispatch.

**Technical effect.** Prevents authorisation composition across assignments at the AI inference boundary; makes the authorisation decision a function of a single atomic grant rather than a union of independent grants.

**Distinguishing elements.** Explicit single-grant prohibition; evaluated at the inference boundary; combined with a descending organisation-hierarchy scope resolution and a machine-credential delegation ceiling.

**Closest prior art.** SAP `US20180144150A1`/`US10740483B2` (single "capability" binding action to an object set); Zanzibar/OpenFGA tuples; Cedar principal+action+resource; Amazon `US8769642B1` (credential + policy consulted together).

**Already known.** Hierarchy inheritance (RBAC96 1996; XACML 2005; ROBAC 2006; Zanzibar 2019; OpenFGA 2022). Fail-closed complete mediation (Saltzer & Schroeder 1975). Delegation bounded by delegator (RFC 8693; Amazon '11). Inference-boundary authorisation (Cisco '23; WitnessAI '24).

**Less directly disclosed.** The single-grant *prohibition* stated explicitly, machine-checkable, and enforced specifically at an LLM provider boundary with descending-org scope. **Not located in the searched references.**

**Attorney must resolve.** Whether the rule is an obvious implementation constraint of known models (high risk) or a distinct mechanism; whether restriction to *descendant* scope adds technical character; enablement evidence given migration 024 is unapplied; whether the effect is technical under EPO/GPC Art. 56 or merely an administrative rule about access rights.

**Claim territory.** Method of authorising an AI inference request by: resolving a target organisation from a request; retrieving scoped grants for an authenticated principal; identifying a **single** grant containing both a required capability and membership of the target organisation in its resolved scope set; denying absent such a single grant; and only then dispatching to a provider selected independently of the principal.

---

## Candidate Invention 2 — Governance Re-Evaluation Bound to Failover Candidates

**Technical problem.** In a multi-provider gateway, failover is a security bypass: a request rejected by policy against the primary model can be silently satisfied by a less-restricted fallback, defeating the policy boundary precisely when enforcement matters most.

**ALTIL mechanism.** `server.ts:6935-7057` iterates fallback candidates and re-runs `PolicyEngine.evaluate` (6965) **and** `scanAndSanitizePrompt` (6975) **for each candidate**, dispatching only after per-candidate clearance. Combined with `MODEL_ROUTE_BLOCKED_BY_POLICY` (6684-6686), policy is bound to the *route*, not the request.

**Technical effect.** Provider substitution cannot escape the governance boundary; the authorisation/policy decision is re-derived per execution target rather than inherited from the primary.

**Distinguishing elements.** Per-candidate governance re-evaluation as the disclosed mechanism.

**Already known — HEAVILY.** Cisco `US20240388551A1` (redirect to alternative LLM services); WitnessAI `US20250307418A1` (routing private vs public by classifier); Airia `US12277245B2` / `US12579347B1` (route modified input to an alternate provider); DS Systems `US20250307372A1` (backup models on failure). Airia's claim 1 — verified verbatim — recites preventing transmission to the default model and routing the modified input to an alternate model.

**Less directly disclosed.** Re-evaluation of the *policy itself* per candidate as the distinguishing step, rather than provider selection as a remediation outcome.

**Attorney must resolve.** Whether per-candidate re-evaluation is distinguishable from Airia's routing-as-remediation and Cisco's redirect; whether it is technical or a routine control-loop design.

**Claim territory.** Likely narrow. Consider as a dependent claim or a §103-robustness feature rather than an independent claim.

---

## Candidate Invention 3 — Delegated Machine-Credential Scope Ceiling for Inference Access

**Technical problem.** A tenant admin who can issue application credentials could otherwise mint a credential broader than their own authority, converting a scoped administrative grant into platform-wide inference access.

**ALTIL mechanism.** `evaluateCredentialScopeGrant()` (`credentialScopeAuthority.ts:39-78`) computes a ceiling as the **intersection** of (i) the caller's `apikeys.create` permission in the target org, (ii) the application's `allowedCapabilities`, and (iii) the registry's `RUNTIME_ENFORCED` set. `validateRuntimeApiKey` (`apiKeyCredential.ts:30-47`) fails closed on any required scope not runtime-enforced. Test: a `TENANT_ADMIN` with `apikeys.create` and app `allowedCapabilities: ['chat']` can issue exactly `['read:inference']`; with `allowedCapabilities: []` → `APPLICATION_NOT_GRANTABLE`.

**Technical effect.** A machine credential's inference authority is provably a subset of the issuer's, so credential issuance cannot escalate privilege at the inference boundary.

**Distinguishing elements.** Ceiling-by-intersection with a runtime-enforced scope set, at an AI inference boundary.

**Already known.** Delegation bounded by delegator: **RFC 8693 (2020-01)**, Amazon `US8769642B1` (2011-05-31, claim 1 read), SPIFFE/SPIRE, AWS Roles Anywhere (2022), Workload Identity Federation (2021). Scope-based keys: LiteLLM virtual keys (2023-07), Portkey (2023), Kong AI Gateway (2024).

**Less directly disclosed.** The intersection-with-runtime-enforced-set formulation bound specifically to AI inference scope.

**Attorney must resolve.** Heavy obviousness exposure — Amazon '11 predates by 14 years. Whether the intersection formulation adds technical character. **NOTE the severity caveat below.**

---

## Candidate Invention 4 — Organisation-Hierarchy Scope Resolution Applied to Inference Capability Grants

**Technical problem.** A group parent, subsidiary, or reseller must be able to grant AI inference rights to a specific descendant without granting those rights to siblings or to the parent.

**ALTIL mechanism.** `resolveVisibleOrganizationIds()` (`organizationScope.ts:53-97`) BFS-walks `parentId` adjacency for `DESCENDANTS`, with cycle protection (88) and effective-date filtering (41-47). `access_scope` values `SELF | ORGANISATION | DESCENDANTS | TREE | GLOBAL` (`migrations/024:6`). `ALTIL_ORGANIZATION_SECURITY_MODEL.md:65`: "A client administrator normally receives `SELF`; a partner or subsidiary administrator may receive `DESCENDANTS` only through an explicit server-verified grant. Parent access is not implied by a child relationship. Siblings are never visible unless independently authorized."

**Technical effect.** Granular delegated inference authority aligned to commercial structure, preventing sibling boundary traversal at the provider boundary.

**Distinguishing elements.** Combined with machine-credential inference scope.

**Already known.** Organisation-hierarchy RBAC is **decades old**: RBAC96 (Sandhu et al., IEEE Computer 29(2), 1996-02), XACML 2.0 hierarchical RBAC + hierarchical resource profiles (OASIS, 2005-02-01), ROBAC (Zhang/Zhang/Sandhu, IEEE COLCOM, 2006-11), Red Hat `US20170222997A1` (nested orgs, indirect super-user, forbidden), SAP `US20180144150A1`, Zanzibar/OpenFGA userset traversal.

**Less directly disclosed.** The **specific combination** with application-bound API keys and AI capability grants.

**Attorney must resolve.** The hierarchy itself is almost certainly not novel. Novelty, if any, is wholly in the combination — and combinations of decades-old access control with a 2023-era gateway face a serious §103 problem.

**SEVERITY CAVEAT.** The hierarchy is **not persisted** (no edges table in migrations 001–034); `effectiveFrom`/`effectiveTo`/`status` are hardcoded (`mariadb.ts:318-321`), making the effective-date logic dead code against the real loader; migration 024 is **unapplied**; and the resolver is tested only against synthetic fixtures, which ALTIL's own doc states are "not evidence of production structure" (line 87). **There is currently no implementation evidence sufficient to support a patent specification describing hierarchical inference authorisation.**

---

## Candidate Invention 5 — Client-Credential Non-Forwarding at a Provider Gateway

**Technical problem.** A multi-tenant gateway must prevent a tenant from influencing or obtaining upstream provider credentials, which would collapse tenant isolation and expose the operator's shared provider account.

**ALTIL mechanism.** `validateOpenAiChatRequest` rejects `provider` and `apiKey` in the request body as `unsupported_parameter` (`openAiChatRequest.ts:86-89`); `internalParameters` are stripped before forwarding (108-110); the adapter substitutes its own key (`openRouterProvider.ts:99`); the class comment states "ALTIL API credentials are never forwarded upstream" (line 70). Regression-tested.

**Technical effect.** Prevents provider-credential disclosure and provider-selection override by tenants; prevents tenant traversal of the shared provider account.

**Already known — VERY HEAVILY.** Cisco `US20240388551A1` (vendor-specific AuthN/AuthZ at gateway, Salesforce `US20240303443A1`); Salesforce `US20240303443A1` (priority **2023-03-07**) discloses normalized APIs, vendor-specific authorization, and `HeaderValueRouter` provider routing. Credential brokering/token exchange: RFC 8693, HashiCorp Vault dynamic secrets, AWS/GCP workload identity. This is standard API-gateway practice.

**Assessment.** **Should not be claimed as an independent invention.** Conventional gateway security hygiene. At most a defensive limitation clause.

---

# Worldwide Prior-Art Landscape

## Crowding assessment by family

| Family | Density | Earliest located |
|---|---|---|
| F1 AI gateway / normalised cross-provider API | **Extreme** | Salesforce `US20240303443A1`, priority 2023-03-07 |
| F2 AI governance gateway / LLM firewall | **Extreme** | Cisco `US20240388551A1`, priority 2023-05-17 |
| F3 Provider abstraction / multi-provider inference / failover | **Extreme** | Salesforce 2023-03; Portkey/Helicone early 2023 |
| F4 Hierarchical authorisation | **Very high, decades old** | RBAC96 (1996), XACML (2005), ROBAC (2006) |
| F5 Identity + AI inference / capability-based auth | **High** | Amazon `US8769642B1` (2011) for delegation; LiteLLM 2023 for virtual keys |
| F6 Governance before inference + credential isolation | **High** | Cisco 2023-05-17; Salesforce 2023-03-07 |
| F7 Audit / correlation / provenance | **Moderate**; cryptographic chain rare | Cisco 2023-05 (audit log); OpenTelemetry GenAI semconv 2024 |
| F8 Integrated architectures (hierarchy + gateway + capability + provenance) | **Lower** — no single reference located combining all | — |

## The decisive timing finding

**ALTIL's entire committed history spans 2026-08-29 → 2026-09-29 (12 commits).**

The closest named family **predates it**:

- **AuraSpark PIHCE**, "Provider-Independent Hierarchical Constraint Enforcement Architecture for Artificial Intelligence Systems", sole inventor **Richard J. Mitchell**, applicant **AuraSpark Technologies LLC**. Verified via the applicant's own disclosures: *"March 2026: Filed dual U.S. Patent Applications (**19/575,914** and 19/575,894) securing the PIHCE and FCL-AVal architectures."* Publication **US20260228755A1, 2026-08-06** — **23 days before ALTIL's first commit.**
- Closest relative, same inventor: **US20260238651A1**, "Action-Level Constraint Enforcement and Containment Integrity Monitoring for Agentic LLM Systems with Autonomous Tool Access" (filed 2026-04-13, published 2026-08-13).

PIHCE's hierarchy is a **safety-criticality tier model** (inviolable / governance-modifiable / operational), **not** an organisation tree — it discloses no org tree, no descendant traversal, no application-bound API key, no read/write same-grant rule. But it **does** disclose: enforcement *prior to* action execution, provider-independence, and architecturally inviolable constraints.

**Implication:** any ALTIL filing would be a **later** application. PIHCE and its relatives become **blocking references**, not art ALTIL can overcome.

---

# Closest Patent Families

Ranked by **technical similarity to ALTIL only**. Not a patentability judgement.

| # | Publication | Title | Assignee | Inventor | Priority | Publication | Jurisdictions | Status |
|---|---|---|---|---|---|---|---|---|
| 1 | `US20240303443A1` / `US12591765B2` | Systems and methods for building a customized generative artificial intelligence platform | **Salesforce Inc.** | Cheng, Govindarajan, Alexander, HARINATH, Kshirsagar, Ordaz | **2023-03-07** (prov 63/488,941) | 2024-09-12; granted 2026-03-31 | US, WO2024254197A1 | Active |
| 2 | `US20240388551A1` | Large language models firewall | **Cisco Technology Inc.** | Nadhem Jawad AlFardan | **2023-05-17** | 2024-11-21 | US | Pending |
| 3 | `US12277245B2` | Dynamic enforcement of management rules associated with AI pipeline object providers | **Airia, LLC** | Ardhanari et al. (per OA) | 2024-05-22 (prov 63/650,487) | 2025-04-15 | US | Granted |
| 4 | `US20250307418A1` / `US12675579B2` | Secure systems of guardrails for securing the use of LLMs | **WitnessAI Inc.** | Spencer, Solnik, Tag, Ali | 2024-03-29 | 2025-10-02 | US, WO2025207300 | Pending |
| 5 | `US20250307372A1` | Artificial intelligence model management and control | DS Systems (per OA record) | — | 2024-03-27 (prov 63/570,596) | 2025-10-02 | US | Pending |
| 6 | `US20250373508A1` | AI gateway with QoS proxying, weighted routing, token quotas | **ADP, Inc.** | — | 2024-05-31 | — | US | Pending |
| 7 | `US20250278578A1` | AI routing and prompt compression for tenant devices | **Target Brands, Inc.** | — | 2024-03-04 | — | US | Pending |
| 8 | `US12242651B2` | Dynamic enforcement of management rules … pipeline object selections | **Airia, LLC** | DeWeese, Marshall, Manton, Reagan, Stuntebeck | 2024-05-22 | 2025-03-04 | US | Granted |
| 9 | `US12579347B1` | Dynamic enforcement … AI pipeline model routing | **Airia, LLC** | Ardhanari et al. | 2024-05-22 | 2026-03-17 | US | Granted |
| 10 | `US20260228755A1` | Provider-Independent Hierarchical Constraint Enforcement Architecture for AI Systems | **AuraSpark Technologies LLC** | Richard J. Mitchell | **2026-03** (19/575,914) | **2026-08-06** | US | Pending |
| 11 | `US20260238651A1` | Action-Level Constraint Enforcement and Containment Integrity Monitoring for Agentic LLM Systems | **AuraSpark Technologies LLC** | R. J. Mitchell | 2026-04-13 | 2026-08-13 | US | Pending |
| 12 | `US20180144150A1` / `US10740483B2` | Unified instance authorization based on attributes and hierarchy assignment | **SAP SE** | Aakolk, Drabant, Waldi | 2016-11-22 | 2018-05-24 | US | — |
| 13 | `US8769642B1` | Techniques for delegation of access privileges | **Amazon Technologies Inc.** | O'Neill, Roth, Brandwine, Pratt, Behm, Fitch | 2011-05-31 | — | US | Granted |
| 14 | `US20170222997A1` / `US11102188B2` | Multi-Tenant Enterprise Application Management | **Red Hat Inc.** | Kroehling | 2016-02-01 | 2017-08-03 | US | Granted |
| 15 | `US12596839B2` | Selective redaction of PII in GenAI model outputs | **HiddenLayer Inc.** | Burns, Cappel, Yeung | 2024-03-29 | 2026-04-07 | US | Granted |

## Independent claims read verbatim by this audit

### Salesforce `US20240303443A1` (closest overall)
Discloses, in the specification: a generative AI gateway exposing **normalised APIs** to LLMs from different vendors, in-house or external; a **data interface performing vendor-specific authorization** when invoking vendor APIs and thereby **routing a request to the relevant vendor**; use of `HeaderValueRouter` to route requests to the appropriate provider; each provider converting the normalised payload to/from vendor format using its **own provider-specific authentication mechanism**; and the statement that an application "can remain agnostic to provider and interact with LLM gateway and switch providers by just specifying the right provider in the request."
→ **Covers**: provider abstraction, gateway-held vendor credentials, vendor-specific AuthN/AuthZ, provider switching without application change. Priority **2023-03-07**, over three years before ALTIL.

### Cisco `US20240388551A1` (closest governance)
Claim 1 (method, read verbatim): *intercepting communications associated with a conversation between a client and a Large Language Model (LLM) service, the communications including a request message from the client to the LLM service and a response message from the LLM service to the client; deriving a context for the conversation based on the communications; and applying one or more policies to the communications based on the context.*
Dependent claims add: determining whether to **block, rewrite or redirect** a message; **redirecting requests to one or more other LLMs** based on client or LLM specialization; reputation of client/LLM service; **regex rules to block messages containing PII from reaching an LLM service**; an **audit log store** retaining entire conversations; sending one request to multiple LLM services and selecting/aggregating responses.
→ **Covers**: policy before provider call, redirect/failover, PII blocking pre-egress, audit retention. Priority **2023-05-17**.

### Airia `US12277245B2` (closest governance + routing; claim 1 read verbatim)
Claim 1: *storing provider restrictions that correspond to categories of restricted subject matter for providers of AI services, wherein the providers include a first provider and a second provider; receiving an input at a gateway, from an application executing on a user device, the application being configured to utilize a first model at the first provider; detecting, in the input, a first category of restricted subject matter…; based on a management rule, modifying the input with a reversible transformation, including replacing a portion of the input with a contextual placeholder; injecting a prompt for inclusion with the input…; **routing the modified input and the injected prompt to the second provider**; receiving an output from the second provider; modifying the output by at least: adding a message to the output related to the injected prompt; and replacing the contextual placeholder with the portion of the input; causing the output to display on the user device; **preventing transmission of a second input to the first provider**…*
Description additionally: management rules "defined by enterprise customers, called **tenants**, in a granular fashion"; rules "can also dictate or influence **model routing**"; remediation scores with thresholds; reversible PII transformation ("credit card number can be replaced with 'credit card 1'"); routing to a model "where the input is not forbidden."
→ **Covers**: tenant-configured management rules, pre-egress reversible PII transformation, provider/model routing driven by policy, tenant context. **Very close to ALTIL's governance-plus-routing core.**

### Sibling Airia `US12579347B1` (claim 1 read verbatim)
*receiving a first input at a gateway… preventing the first input from being transmitted to the default model; causing a first output… wherein the first output comprises a **synthetic output** compatible with the application's configuration…; based on evaluation of the second input and the management rules: modifying the second input by replacing a portion with a contextual placeholder; and **routing the modified second input to an alternate model**…*
→ Explicitly recites **preventing transmission to the default model and routing to an alternate model** on policy grounds.

### SAP `US20180144150A1` (closest structural analogue to Candidate 1)
Claim 1 read: attributes plus **hierarchy assignments**; generating a **capability** authorising an action over an object set; a filtering expression; querying the object set.
→ The single "capability" binding an action to an object set produced from one construct is the closest precedent for ALTIL's same-grant binding.

### Amazon `US8769642B1` (closest delegation precedent)
Claim 1 read: permissions specified by a delegator; **generated credentials encoding those permissions**; a separately maintained, modifiable policy; checking **credential and policy** when deciding delegatee access.
→ Predates Candidate 3 by 14 years.

## Excluded on relevance grounds

`EP4125012A1` (Nokia, trust management of AI/ML pipelines); `US11968182B2` (UiPath, robot auth via gateway proxy); `US11196547B2` (IBM, multi-framework multi-tenant lifecycle); `US20240202351A1` (Fractal, Responsible AI — model lifecycle/monitoring, not runtime gateway); `US20260064892A1` (agreement-based governance processor, claims unverified); `WO2025193317A1` (dynamic AI workflow, claims unverified).

---

# Claim-Element Matrix

| Element | ALTIL | Salesforce '23 | Cisco '23 | Airia '24 | WitnessAI '24 | SAP '16 | Amazon '11 |
|---|---|---|---|---|---|---|---|
| External application calls OpenAI-compatible endpoint | YES | YES | YES | YES | YES | N | N |
| Gateway with normalised cross-provider API | PARTIAL (1 adapter) | YES | PARTIAL | YES | PARTIAL | N | N |
| Client supplies own tenant-scoped credential | YES | PARTIAL | PARTIAL | PARTIAL | PARTIAL | N | N |
| Credential bound to tenant AND application AND scope | YES | N | N | N | N | N | PARTIAL |
| Gateway holds upstream provider credentials | YES | YES | PARTIAL | N | N | N | N |
| Client credential provably not forwarded upstream | YES | PARTIAL | N | N | N | N | N |
| Customer/tenant identity resolution | YES | PARTIAL | YES (client identity) | YES (tenant context) | YES | N | N |
| Organisation hierarchy with parent/child | PARTIAL (no persisted edges) | N | N | N | N | YES | N |
| Delegated scope / descendants traversal | PARTIAL (resolver live, graph not persisted) | N | N | N | N | YES | N |
| Delegation ceiling (sub-delegation) | YES | N | N | N | N | N | YES |
| Application identity affects authority | YES | N | N | N | N | N | N |
| **Same-grant rule (permission AND target from one grant)** | **YES** | N | N | N | N | PARTIAL | PARTIAL |
| Read/write distinction | YES (code convention) | N | N | N | N | PARTIAL | N |
| Global vs tenant scope distinction | YES | N | N | N | N | PARTIAL | N |
| Fail-closed per-request revocation | YES | N | N | N | N | PARTIAL | PARTIAL |
| Provider abstraction | PARTIAL | YES | PARTIAL | YES | PARTIAL | N | N |
| Provider credential isolation | YES (flat file, global key) | YES | PARTIAL | N | N | N | N |
| **Governance enforced before provider call** | **YES** | PARTIAL | **YES** | **YES** | **YES** | N | N |
| **PII/PHI masking pre-egress** | **YES** | N | **YES** | **YES** | **YES** | N | N |
| **Provider/model routing** | PARTIAL (static) | YES | YES | YES | YES | N | N |
| **Provider failover** | **YES** | N | YES (redirect) | YES | PARTIAL | N | N |
| **Policy re-evaluated per fallback candidate** | **YES** | N | N | N | N | N | N |
| Compliance enforcement | YES (default=redact) | N | PARTIAL | YES | YES | N | N |
| Inference correlation | PARTIAL (breaks at provider boundary) | N | PARTIAL | PARTIAL | PARTIAL | N | N |
| Audit | YES | PARTIAL | YES (full conversations) | YES (logged) | YES | N | N |
| Monitoring | PARTIAL (strategy fields unread) | N | YES (reputation) | N | YES | N | N |
| Licence relationship | YES | N | N | N | N | N | N |
| Customer lifecycle | YES | N | N | N | N | N | N |

Legend: YES = explicitly disclosed · PARTIAL = similar but not the same · NO = not found.

---

# Prior-Art Comparison

## What is conventional (expect no novelty weight)

| ALTIL element | Found in | Date |
|---|---|---|
| OpenAI-compatible multi-provider gateway | Salesforce `US20240303443A1` | 2023-03-07 |
| Gateway-held vendor credentials + vendor-specific AuthN/AuthZ | Salesforce `US20240303443A1` | 2023-03-07 |
| Policy interception before LLM service | Cisco `US20240388551A1` claim 1 | 2023-05-17 |
| Block / rewrite / redirect | Cisco `US20240388551A1` dep. claims | 2023-05-17 |
| Regex PII blocking pre-egress | Cisco `US20240388551A1` (Rules module 325) | 2023-05-17 |
| Tenant-configurable management rules governing model routing | Airia `US12277245B2` | 2024-05-22 |
| Reversible PII transformation before provider egress | Airia `US12277245B2` claim 1 | 2024-05-22 |
| Redirect/failover to alternate provider on policy grounds | Airia `US12579347B1` claim 1 | 2024-05-22 |
| Pre-call PII redaction, pluggable guardrails | AWS Bedrock Guardrails (2023-11-28) | 2023-11 |
| Virtual keys, per-key budgets, provider failover | LiteLLM (2023-07-27) | 2023-07 |
| Organisation hierarchy RBAC | RBAC96 (1996-02); XACML (2005-02-01); ROBAC (2006-11) | 1996–2006 |
| Capability binding action to object set | SAP `US20180144150A1` | 2016-11-22 |
| Delegation bounded by delegator | Amazon `US8769642B1`; RFC 8693 | 2011 / 2020-01 |
| Fail-closed complete mediation | Saltzer & Schroeder | 1975 |
| Identity-bound short-lived credentials | Workload Identity Federation (2021-04-07); IAM Roles Anywhere (2022-07-06) | 2021–2022 |

## What is unusual

1. **Same-grant invariant, explicitly prohibited and machine-checked, at the inference boundary.** Not located as an explicit prohibition. Its *effect* is precedented by construction (SAP capability; Zanzibar/OpenFGA tuples; Cedar; Amazon credential+policy). Best framed as an invariant of a known model — the highest obviousness exposure of anything here.
2. **Governance re-evaluation bound to each failover candidate.** Implemented (`server.ts:6965,6975`). No reference located recites re-deriving the *policy* per candidate; Airia/Cisco/WitnessAI route *as a remediation outcome* rather than re-deriving policy.
3. **Descendant-scoped machine credentials at an inference boundary.** The specific conjunction of `DESCENDANTS` organisation scope + application-bound key + capability ceiling appears in no single located reference.

## What is not technically characterised

- Commercial/billing/licensing/catalogue/payment/sales/onboarding — excluded by instruction and by subject matter.
- UI appearance and dashboard visualisations (`AltilStackWiringView.tsx` uses `Math.random()` synthetic series — display only, `line 350`).
- `loadBalancingStrategy` and `secondFallbackModelId` — stored, displayed, never executed. **Not claimable.**
- Effective-dated organisation relationships — hardcoded, dead code against the real loader.
- Cryptographic provenance / hash-chained ledgers — **not implemented in ALTIL at all** (present only in AuraSpark/EVE-style art).

---

# Technical Effects

Each effect below is tied to implementation evidence. Effects are **not** asserted where the implementation does not support them.

| Effect | Mechanism | Evidence | Support |
|---|---|---|---|
| Provider credential non-disclosure to tenants | Allow-list strips/denies `provider`, `apiKey`; adapter substitutes its own key | `openAiChatRequest.ts:24,86-110`; `openRouterProvider.ts:70,99`; tests `:11,12,28` | **STRONG** (tested) |
| Tenant boundary traversal prevention on inference path | Cross-tenant `appId` denial before dispatch | `server.ts:6068-6116` | **STRONG** |
| Fallback cannot escape policy boundary | Per-candidate policy + compliance re-evaluation | `server.ts:6965,6975` | **STRONG** (implemented) |
| PII/PII redaction before third-party LLM egress | `scanAndSanitizePrompt` on every message incl. provider payload | `server.ts:6460,6688,6803,6975` | **STRONG** |
| Privilege escalation prevention via credential issuance | Ceiling = intersection(caller perm, app capabilities, RUNTIME_ENFORCED) | `credentialScopeAuthority.ts:39-78`; test `:38-42` | **STRONG** (unit-tested) |
| Fail-closed revocation | `is_active=1 AND expires_at>NOW()` per request | `iamRepository.ts:816-833` | **STRONG** |
| Stable security boundary under provider substitution | Client holds only ALTIL key; provider choice is server-side | `server.ts:5562,6801` | **MODERATE** |
| Reduced attack surface (no provider keys in client) | Architecture | `openRouterProvider.ts:70` | **MODERATE** — architectural, not measured |
| Continuous transaction provenance across the AI path | — | Correlation breaks at `server.ts:6046` vs `1998-2001`; **no upstream header** (`openRouterProvider.ts:97-103`) | **NOT SUPPORTED** |
| Hierarchical inference authority | — | No persisted edges; `mariadb.ts:318-321` hardcodes dates; migration 024 unapplied | **NOT SUPPORTED in production** |
| Credential-scoped read/write distinction | Only `read:inference` runtime-enforced; others `PERSISTED_NON_FUNCTIONAL` | `credentialScopeAuthority.ts:14-25` | **PARTIAL** — writes unenforced |
| Dynamic/health-driven routing | — | `loadBalancingStrategy` never read; `healthCheck()` never called | **NOT IMPLEMENTED** |

---

# Potentially Distinguishing Features

Ordered by the author's assessment of where claim-level analysis is most worth spending money — **not** by strength, since no one can responsibly score patentability from this evidence.

1. **Same-grant authorisation invariant enforced at an AI inference boundary**, combined with descending organisation-hierarchy scope and machine-credential delegation ceiling. — No single reference located. Obviousness risk: high.
2. **Per-candidate governance re-evaluation during provider failover**, such that a substituted model is re-authorised rather than inheriting the primary's clearance. — Implemented and tested; no reference located recites policy re-derivation per candidate. Airia/Cisco route as remediation outcome.
3. **Credential-scope ceiling by intersection with a runtime-enforced scope set**, at an inference boundary. — Amazon '11 + RFC 8693 dominate; formulation differs but effect is old.
4. **Machine-checkable prohibition on composing authorisation scope across grants**, expressed as a testable invariant rather than a union model. — Same substance as (1); claim as one concept, not two.
5. **Absence of a disclosed element is itself notable:** ALTIL has *no* cryptographic provenance. That is a **gap**, not a differentiator — but it also means ALTIL does not collide with the hash-chained-evidence art (AuraSpark, IETF inference-chain drafts, AuditWeave). If provenance were implemented, it would land in a *more* crowded field, not a less crowded one.

---

# Whole-ALTIL Combination Analysis

**Is ALTIL, as an integrated technical architecture, materially different from existing AI gateway, AI governance, AI security and multi-provider AI systems?**

No — not as currently implemented, and the reasoning is structural rather than dismissive.

**Conventional (~80% of the surface).** The gateway itself, the normalised cross-provider API, gateway-held provider credentials, pre-inference policy, PII masking, routing, failover, and per-tenant metering are each disclosed in art from 2023–2024, and disclosed *in combination* in Salesforce (2023-03), Cisco (2023-05) and Airia (2024-05). ALTIL's own docs and UI describe a governance fabric; the implementation delivers a competent instance of an already-patented pattern.

**Unusual (~15%).** The same-grant invariant, the delegated credential ceiling bound to inference, and the descendant-scope organisation model are genuinely more specific than most located art. But hierarchy + scoped delegation + capability ceilings are **decades-old** access-control concepts, and ALTIL applies them to a 2023-era gateway. That is a new application of known means to a known field — the classic §103 problem.

**Potentially novel (~5%).** Per-candidate governance re-evaluation during failover, *as the disclosed mechanism*, is the one implemented behaviour with a plausible claim-level distinction. It is narrow. It would likely be a dependent claim, and an examiner could reach Cisco's "redirect" plus a control-loop rationale without effort.

**Likely too broad to claim.** Anything framed as "a multi-tenant AI gateway that enforces policy before calling a provider and routes across providers with failover" — that is the crowded centre of the field, claimed by many. Anything framed around licensing, billing, catalogue, or commercial lifecycle is not a technical invention.

**Requires further technical evidence before any filing.** The most interesting features are also the least implemented:
- Hierarchy has **no persisted structure** and migration 024 is **unapplied**.
- The capability registry is **advisory**, not enforcement.
- Correlation is **broken** at two boundaries.
- `requireAltilGatewayAuthentication` is a **hardcoded stub with zero call sites**.
- MFA is **non-functional**.
- Correlation IDs in ALTIL's format would be **silently rewritten** by `makeAltilEvent`'s UUID validation.

**A patent specification must describe an enabled embodiment.** ALTIL currently cannot support a specification describing hierarchical inference authorisation with descendable scopes, nor continuous inference provenance, because the code does not do those things. **This is the single most important practical constraint on any filing.**

---

# Non-Patent Prior Art

Prior art is not limited to patents. Earliest verifiable public dates only; modern product pages are not treated as evidence of pre-ALTIL existence unless the historical publication is established.

## Access control / identity (decades old)

| Artefact | Date |
|---|---|
| Saltzer & Schroeder, *The Protection of Information in Computer Systems* | **1975** — fail-safe default, complete mediation, least privilege |
| Ferraiolo & Kuhn, NCSC RBAC model | 1992 |
| Sandhu, Coyne, Feinstein, Youman, *RBAC*, IEEE Computer 29(2):38-47 | **1996-02** |
| Ferraiolo et al., NIST RBAC proposal, ACM TISSEC 4(3) | 2001 |
| XACML 2.0 incl. hierarchical RBAC + hierarchical resource profiles (OASIS) | **2005-02-01** |
| ROBAC — Zhang, Zhang & Sandhu, IEEE COLCOM | **2006-11** |
| NIST SP 800-162 (ABAC) | 2014-01, upd. 2019-08-02 |
| OPA / Rego | 2016; CNCF graduation 2021-02-04 |
| Zanzibar — Pang et al., USENIX ATC '19, pp. 33-46 | **2019-07-10** |
| RFC 8693 OAuth 2.0 Token Exchange | **2020-01** |
| Google Workload Identity Federation GA | 2021-04-07 |
| OpenFGA | 2022-04-19 / CNCF 2022-09-14 |
| AWS IAM Roles Anywhere | 2022-07-06 |
| Cedar (AWS) | 2023-05-10 |
| SPIFFE URI scheme (IANA) | 2018-02-23 |

## AI gateway / routing / governance products

| Product | Earliest verifiable |
|---|---|
| Helicone | 2023-02-23 |
| Portkey | 2023-03 |
| OpenRouter | early 2023 |
| AWS Bedrock | 2023-04-13 |
| Guardrails AI (RAIL spec) | 2023-04 |
| LiteLLM | **2023-07-27** — unified API 100+ providers, virtual keys, budgets |
| IBM watsonx.governance | 2023-07 |
| Cloudflare AI Gateway | 2023-09-27 beta |
| Lakera Guard | 2023-10 |
| Microsoft Azure AI Content Safety | 2023-10-17 |
| AWS Bedrock Guardrails | 2023-11-28 |
| NVIDIA NeMo Guardrails | 2023-12 |
| Meta Llama Guard (arXiv:2312.06674) | **2023-12-07** |
| Kong AI Gateway | 2024-02-15 |
| Azure AI Gateway | 2024-08 |
| Google Vertex AI Model Routing | 2024-06-17 |
| Microsoft Presidio | 2022+ |
| Fiddler (founded) | 2018-02 |
| HiddenLayer | 2022-07-19 |
| Cisco AI Defense | 2025-01-15 |
| Palo Alto Prisma AIRS | 2025-04-28 |
| Google Vertex AI Model Armor | 2025-07-25 |

## Standards and regulation (provenance/logging obligations)

| Artefact | Date | Note |
|---|---|---|
| ISO/IEC 42001:2023 Annex A.6.2.8 (event logging), A.7.5 (data provenance) | **2023-12-18** | Makes logging/provenance a **compliance requirement**, not an innovation |
| EU AI Act Reg. (EU) 2024/1689 Art. 12, 19, 26(6) | 2024-06-13 OJ; in force 2024-08-01 | Mandatory automatic logging, ≥6-month retention |
| OpenTelemetry GenAI semantic conventions | 2024-04 (v1.41.0) | Standard `gen_ai.*` attributes + trace correlation |

**Consequence:** much of ALTIL's compliance and audit surface responds to a **published standard and a published regulation**, both predating ALTIL by 2–3 years. Compliance-driven features are the weakest possible patent territory.

---

# ALTIL Development Timeline

Evidence of development history only. **Not proof of patent rights.** Verified via `git log --reverse`.

| Commit | Date | Milestone |
|---|---|---|
| `917b3a9` | **2026-08-29** | Initial commit |
| `583b69b` | 2026-08-29 | ALTIL Control Centre project initialised |
| `31692a9` | 2026-08-30 | MariaDB support + expanded schema |
| `0687b25` | 2026-08-30 | Tile detail modal + analytics |
| `2a55083` | 2026-08-30 | **Login + splash screen flow (authentication begins)** |
| `ad76419` | 2026-08-30 | `DATABASE_URL` support |
| `bff582c` | 2026-08-30 | **Session management + IAM routes (authorisation begins)** |
| `2783577` | 2026-09-25 | Test build consolidated |
| `7422579` | 2026-09-26 | Demo build consolidated |
| `9acc4e5` | 2026-09-28 | Latest API + control centre updates |
| `7ab78d5` | 2026-09-28 | TypeScript fixes in API routes |
| `aea883a` | 2026-09-29 | HEAD — UI and lifecycle audit build |

**Milestone mapping (approximate, by file age within the tree):**

| Capability | Appears | Status |
|---|---|---|
| MariaDB schema | 2026-08-30 | Mature (34 migrations) |
| Authentication (login, sessions, IAM) | 2026-08-30 | Mature |
| Provider abstraction (`src/aiGateway/`) | Between 08-30 and 09-28 (**untracked — never committed**) | **Not in git history at all** |
| Governance / policy / compliance engines | Untracked (`src/utils/policyEngine.ts` etc.) | **Not in git history** |
| Hierarchical authorisation (`src/security/`) | Untracked | **Not in git history** |
| Migrations 024–034 | Untracked | **Not in git history** |
| Commercial/billing (`src/commercial/`) | Untracked | **Not in git history** |

**Critical evidence-preservation finding.** `git status` shows **~60 untracked paths**, including every security, governance, provider-abstraction and authorisation module. **The entirety of ALTIL's most patent-relevant architecture has never been committed to git.** The committed history (12 commits) contains only a Control Centre skeleton with login/session/IAM. Any claim to a development timeline based on git alone would be **materially wrong**, and the uncommitted work is at risk of loss.

---

# Open Questions

**Technical, resolvable by ALTIL's engineers**

1. When was `src/aiGateway/providerAdapter.ts` and `openRouterProvider.ts` first written, and was any prototype ever deployed or externally demonstrated?
2. When was the same-grant rule conceived? The doc header dates the "Stage 3 update" **2026-09-29**; the rule appears in the untracked `src/middleware/authMiddleware.ts`. Any design note, ticket, chat, or email predating AuraSpark's 2026-03 filing?
3. Was per-candidate policy re-evaluation (`server.ts:6965,6975`) deliberate, and was it ever written down as intentional? It is the strongest technically interesting behaviour and the least documented.
4. Was any ALTIL design published, demoed, presented, or shown to a customer before now? **Any public disclosure is potentially fatal** — the US allows a 12-month grace period; **South Africa and most of Europe allow none**.
5. Was AuraSpark's PIHCE known to ALTIL's authors? Their public catalogue page explicitly offers *"Governance-as-a-service middleware… Embeds AURA governance without replacing existing systems"* as licensable — i.e. a competitor in the same claim space.
6. Is `requireAltilGatewayAuthentication` (`authMiddleware.ts:279-340`) a remnant of an earlier design? If it was once wired, earlier versions may show the intended architecture.
7. What is the provenance of `tenant_ai_profiles` and the `ai_providers`/`ai_capability_routing` tables — a prior design that was superseded?
8. Why do `X-Request-Id` (UUID) and `ALTIL-*` IDs coexist? Was a unified scheme intended?

**Legal / commercial (for the attorney, not resolved here)**

9. Has any prior application been filed anywhere for ALTIL? Nothing in the repo indicates one.
10. Is Introsoft's own earlier work (pre-Aug-2026) relevant? The commercial Phase A–F docs suggest a longer commercial programme.
11. Which entities/individuals would be named as inventors?

---

# Patent Attorney Questions

Bring these, in this order.

**On the gateway core (expect the hardest prior-art field):**
1. Given Salesforce `US20240303443A1` (priority 2023-03-07) discloses normalised cross-provider APIs, vendor-specific AuthN/AuthZ, and provider switching without application change — what remains claimable about ALTIL's gateway?
2. Given Cisco `US20240388551A1` (priority 2023-05-17) claims policy interception with block/rewrite/redirect, PII regex blocking, and full-conversation audit — how does any ALTIL governance claim survive?
3. Given Airia `US12277245B2` and `US12579347B1` recite tenant-defined management rules, reversible PII transformation, and routing to an alternate provider on policy grounds — is there any non-obvious governance+routing claim available?
4. Is **per-candidate policy re-evaluation during failover** distinguishable from Airia's routing-as-remediation and Cisco's redirect? Would you claim it independently or dependently?

**On the authorisation model (the plausible core):**
5. Is the same-grant invariant (permission AND target from one grant) patentable subject matter, or an obvious implementation constraint of RBAC/ABAC/ReBAC given SAP `US20180144150A1`, Zanzibar/OpenFGA and Cedar?
6. Does restriction to an **AI/LLM inference boundary** supply the technical character that would otherwise be missing? Consider EPO Guidelines G-II 3.3.1 (business methods) and the *"Characterising the invention"* test.
7. Combining a 1996-era organisation hierarchy with a 2023-era gateway — is that a §103/EPO Art.56 obviousness trap? What technical-synergy evidence would answer it?
8. Could the delegation ceiling (Candidate 3) survive Amazon `US8769642B1` (2011) + RFC 8693? If not, should it be dropped or claimed as a dependent claim?

**On enablement (the practical blocker):**
9. **The hierarchy has no persisted edges and migration 024 is unapplied. Does ALTIL currently support an enabled embodiment of hierarchical inference authorisation at all?** If not, what must be implemented before filing?
10. The capability registry is advisory, not enforcement. Does the claim language need to describe the middleware guards instead?
11. Correlation is broken at two boundaries and no identifier is sent upstream. Is any provenance claim supportable today? If not, is implementing it worth doing before filing?

**On timing and disclosure:**
12. **AuraSpark filed PIHCE 2026-03 and published 2026-08-06, 23 days before ALTIL's first commit.** Given a later filing, what freedom-to-operate exposure exists, and is AuraSpark's published "governance-as-a-service middleware" licensing offer a competitive threat?
13. Has anything been publicly disclosed? If yes, has the 12-month US grace period been consumed, and what is the position in South Africa (no grace period) and Europe?
14. Which jurisdiction(s) — SA, US, EP, PCT — and is a PCT-first strategy indicated?
15. Given ISO/IEC 42001 (2023-12-18) and the EU AI Act (2024-06-13) already mandate logging and provenance, can any compliance-driven feature be claimed, or is it now obvious?

**On scope discipline:**
16. Should the commercial/billing/licensing layer be excluded entirely from any filing, and is trade-secret or copyright protection the better vehicle for it?
17. What is the minimum viable filing — a narrow, specific claim on the same-grant invariant at the inference boundary — versus attempting a broader architecture filing likely to be rejected?

---

# Recommended Evidence to Preserve

## Immediate (do this week)

1. **Commit the ~60 untracked files.** The entire security, governance, provider-abstraction and authorisation architecture — the only patent-relevant code — has never entered git. Preserve it with a dated commit. This also creates defensible dated evidence of when each module was written.
2. **Preserve working-tree state.** The tree is dirty (many modified files) and contains `.backup-*` files (`App.tsx.backup-before-api-base`, `LoginScreen.tsx.backup-before-api-base`, `vite.config.ts.backup-*`). Back up outside the repo before any cleanup.
3. **Snapshot external state.** Full copy of `.altil-data/provider-accounts.json` (mode 0600) and the vault-key file.

## Development-history evidence

4. **Git history with author dates** for every future change, especially to `src/security/`, `src/middleware/`, `src/aiGateway/`, `src/utils/policyEngine.ts`, `complianceEngine.ts`, `dcrEngine.ts`. The same-grant rule at `authMiddleware.ts:230-252` is the single most claim-relevant line range in the repository.
5. **Any pre-2026-08-29 evidence of ALTIL design work** — repositories, design docs, tickets, emails, chat exports. This is the only route to a priority date earlier than AuraSpark's 2026-03 filing. Absent it, ALTIL is a later filer.
6. **Dated photographs/screenshots** of architecture diagrams or whiteboard output, with metadata intact.

## Technical specification evidence

7. **Sequence diagrams of the inference path** (`server.ts:5932-7313`) showing the 21 ordered stages, generated from the current code, dated.
8. **A written description of the same-grant invariant** — why it exists, the attack it prevents (cross-grant composition enabling tenant boundary traversal at the provider boundary), and its interaction with descendant scope. Written **now**, before any attorney consultation.
9. **A written description of per-candidate governance re-evaluation** (`server.ts:6965,6975`), the technical problem it solves (fallback as a policy-bypass vector), and why re-derivation is required rather than inheritance.
10. **The existing architecture docs are themselves valuable evidence** — `ALTIL_ORGANIZATION_SECURITY_MODEL.md`, `ALTIL_AUTHORIZATION_AUDIT.md`, `ALTIL_CAPABILITY_AUDIT.md`, `AUTHENTICATION_SECURITY_BOUNDARY.md`. They are unusually candid, which makes them credible contemporaneous engineering records. **Version and date them; do not rewrite them to look more complete.**

## For the attorney

11. The read independent claims in §"Independent claims read verbatim by this audit" — Salesforce, Cisco, Airia ×2, SAP, Amazon — with a request for a professional claim chart.
12. This dossier, plus a note that ~60 untracked files are the entire claim-relevant codebase.

---

# Appendix — Search Queries

Executed 2026-10-01 across 8 families. Representative set:

**Family 1 — AI gateway**
`AI gateway patent`; `generative AI gateway patent claims`; `LLM gateway patent multi-provider`; `"AI API gateway" patent tenant`; `provider-independent AI gateway patent`; `site:patents.google.com AI gateway LLM`; `US20240303443A1 customized generative AI platform`

**Family 2 — AI governance / firewall**
`AI governance gateway patent`; `LLM firewall patent`; `AI policy enforcement gateway claims`; `AI control plane patent LLM`; `AI trust layer patent`; `"AI firewall" patent claims`; `US20240388551A1 LLM firewall Cisco`; `US20250307418A1 guardrails WitnessAI`

**Family 3 — Provider abstraction**
`provider-independent AI patent`; `multi-provider inference patent`; `LLM provider abstraction patent`; `AI provider failover patent`; `model routing patent LLM`; `Airia patent dynamic enforcement management rules`; `US12277245B2`; `US12579347B1`

**Family 4 — Hierarchical authorisation**
`hierarchical authorization AI patent`; `hierarchical tenant authorization patent`; `organisation hierarchy access control patent`; `delegated authorization patent`; `ROBAC organization based access control`; `XACML hierarchical RBAC`; `SAP unified instance authorization hierarchy`

**Family 5 — Identity + inference**
`identity-bound AI inference patent`; `API key AI authorization patent`; `capability based inference authorization patent`; `identity-aware LLM gateway patent`; `delegation of access privileges Amazon patent`

**Family 6 — Governance + provider execution**
`authorization before AI inference patent`; `policy enforcement before LLM call patent`; `provider credential isolation AI gateway`; `AI credentials gateway patent`; `credential brokering LLM`

**Family 7 — Audit / provenance**
`AI inference audit trail patent`; `AI request correlation ID`; `AI transaction provenance`; `LLM provenance chain patent`; `ISO 42001 event logging provenance`; `EU AI Act Article 12 logging`

**Family 8 — Integrated**
`"hierarchical authorization" "AI gateway" provider`; `tenant "AI gateway" policy provider routing`; `identity "AI inference" provider routing`; `API key "organisation hierarchy" LLM`; `AI gateway capability tenant patent`; `AuraSpark PIHCE patent Mitchell`

**Named families**
`"Provider-Independent Hierarchical Constraint Enforcement Architecture"`; `"AI Trust Manager" patent`; `"AI Trust Engine" Nokia patent`; `"Customized Generative AI Platform" Salesforce patent`; `"Dynamic AI Agent Orchestration" gateway router patent`

**Non-patent**
`LiteLLM release date`; `Cloudflare AI Gateway launch`; `Portkey AI gateway`; `AWS Bedrock Guardrails announcement`; `Vertex AI Model Armor`; `Palo Alto Prisma AIRS`; `Lakera Guard`; `NVIDIA NeMo Guardrails`; `OpenTelemetry GenAI semantic conventions`; `ISO/IEC 42001:2023`; `EU AI Act 2024/1689`

---

# Appendix — Sources

## Patents (independent claims read where marked ✔)

| Number | Title | Assignee | Priority | Pub | Claims |
|---|---|---|---|---|---|
| US20240303443A1 / US12591765B2 / WO2024254197A1 | Systems and methods for building a customized generative artificial intelligence platform | Salesforce Inc. | 2023-03-07 | 2024-09-12 | ✔ spec read |
| US20240388551A1 | Large language models firewall | Cisco Technology Inc. | 2023-05-17 | 2024-11-21 | ✔ claim 1 read verbatim |
| US12277245B2 | Dynamic enforcement of management rules … object providers | Airia, LLC | 2024-05-22 | 2025-04-15 | ✔ claim 1 read verbatim |
| US12579347B1 | Dynamic enforcement … model routing | Airia, LLC | 2024-05-22 | 2026-03-17 | ✔ claim 1 read verbatim |
| US12242651B2 | Dynamic enforcement … object selections | Airia, LLC | 2024-05-22 | 2025-03-04 | ✔ claim 1 read |
| US20180144150A1 / US10740483B2 | Unified instance authorization based on attributes and hierarchy assignment | SAP SE | 2016-11-22 | 2018-05-24 | ✔ claim 1 read |
| US8769642B1 | Techniques for delegation of access privileges | Amazon Technologies Inc. | 2011-05-31 | — | ✔ claim 1 read |
| US20250307418A1 / US12675579B2 / WO2025207300 | Secure systems of guardrails for securing the use of LLMs | WitnessAI Inc. | 2024-03-29 | 2025-10-02 | ✔ claim 1 read |
| US20250307372A1 | AI model management and control | DS Systems | 2024-03-27 | 2025-10-02 | Spec read |
| US20250373508A1 | AI gateway QoS / weighted routing / token quotas | ADP, Inc. | 2024-05-31 | — | Description read |
| US20250278578A1 | AI routing and prompt compression for tenant devices | Target Brands, Inc. | 2024-03-04 | — | ✔ claim 1 read |
| US20260228755A1 (19/575,914) | Provider-Independent Hierarchical Constraint Enforcement Architecture for AI Systems | AuraSpark Technologies LLC | **2026-03** | **2026-08-06** | Abstract + spec read; **claims UNVERIFIED** |
| US20260238651A1 | Action-Level Constraint Enforcement and Containment Integrity Monitoring for Agentic LLM Systems | AuraSpark Technologies LLC | 2026-04-13 | 2026-08-13 | **Bibliographic only; claims UNVERIFIED** |
| US12596839B2 | Selective redaction of PII in GenAI model outputs | HiddenLayer Inc. | 2024-03-29 | 2026-04-07 | ✔ claim 1 read |
| US20170222997A1 / US11102188B2 | Multi-Tenant Enterprise Application Management | Red Hat Inc. | 2016-02-01 | 2017-08-03 | Description read; claims unverified |

## Non-patent literature

Saltzer & Schroeder (1975); RBAC96 Sandhu et al. IEEE Computer 29(2) (1996-02); XACML 2.0 OASIS (2005-02-01); ROBAC IEEE COLCOM (2006-11); NIST SP 800-162 (2014-01); Zanzibar USENIX ATC '19 (2019-07-10); RFC 8693 (2020-01); NIST RBAC TISSEC 4(3) (2001); SPIFFE URI (2018-02-23); ISO/IEC 42001:2023 (2023-12-18); EU AI Act Reg. (EU) 2024/1689 (2024-06-13); OpenTelemetry GenAI semconv (2024-04).

Product documentation with earliest verifiable dates: Helicone (2023-02-23), Portkey (2023-03), AWS Bedrock (2023-04-13), Guardrails AI (2023-04), LiteLLM (2023-07-27), IBM watsonx.governance (2023-07), Cloudflare AI Gateway (2023-09-27), Lakera Guard (2023-10), Azure AI Content Safety (2023-10-17), Bedrock Guardrails (2023-11-28), NeMo Guardrails (2023-12), Llama Guard arXiv:2312.06674 (2023-12-07), Kong AI Gateway (2024-02-15), Vertex AI Model Routing (2024-06-17), Azure AI Gateway (2024-08), Cisco AI Defense (2025-01-15), Prisma AIRS (2025-04-28), Model Armor (2025-07-25), Presidio (2022+), Fiddler (2018-02), HiddenLayer (2022-07-19).

**ALTIL internal sources:** `server.ts` (8,082 lines); `src/aiGateway/*`; `src/middleware/authMiddleware.ts`; `src/security/*`; `src/capabilities/capabilityRegistry.ts`; `src/utils/{policyEngine,complianceEngine,dcrEngine,dcrKeyService}.ts`; `src/db/iamRepository.ts`; `src/db/mariadb.ts`; `migrations/001`–`034`; `docs/ALTIL_ORGANIZATION_SECURITY_MODEL.md`; `docs/ALTIL_AUTHORIZATION_AUDIT.md`; `docs/ALTIL_CAPABILITY_AUDIT.md`; `docs/AUTHENTICATION_SECURITY_BOUNDARY.md`; `docs/openapi.yaml`.

---

*This document is technical research for invention discovery and engineering strategy. It is not legal advice, not a patentability opinion, and not a freedom-to-operate conclusion. Multiple patent claims cited here could not be read in full — see §Confidence. A professional search across CPC/IPC classifications plus a paid full-text database, and a claim-level analysis by a qualified patent attorney, are required before any filing decision.*
