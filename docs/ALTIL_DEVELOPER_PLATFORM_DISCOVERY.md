# ALTIL Developer Platform — Discovery Audit

**Audit basis:** inspected source in this local checkout on 2026-09-29. This is not production deployment, database, or runtime evidence. The current working tree already contains substantial earlier local work; this audit does not replace or reset it.

## Existing architecture to reuse

- **Application and credential routes:** `src/routes/applicationCredentialRoutes.ts`, mounted by `server.ts` under `/api/v1`. Existing endpoints list/create/update/delete applications, list/create credentials, revoke credentials, and delete credentials. Reads and writes use the existing session, permission, role, and organization authorization middleware. Application and key lists are filtered by organizations visible to the caller.
- **Application model:** `Application` in `src/types.ts` represents an integration identity, with organization (`customerId`), optional parent application, application type, one built-in environment (`development`, `staging`, or `production`), status, capabilities, policy IDs and request/quota fields. Creating an application can also create an initial credential; this is an existing lifecycle coupling.
- **Credential management and runtime authority:** `src/security/credentialScopeAuthority.ts` separates management permission from the runtime scope ceiling. `src/security/apiKeyCredential.ts` checks the exact required scope, active/revoked state and expiry. Newly issued key material is digested before storage; list responses omit secret and digest fields. Persistence and audit durability depend on database configuration.
- **AI gateway:** `server.ts` has OpenAI-compatible `/v1/chat/completions` and `/v1/responses` handling, plus `/v1/models`. Inference validates credential scope before provider dispatch and applies existing tenant/application, request-limit, policy, model and provider logic. Successful external inference still requires runtime provider configuration and is not verified by this source audit.
- **Capability inventory:** `src/capabilities/capabilityRegistry.ts` and `GET /api/v1/capabilities` expose a deliberately partial, source-reviewed route list with identity availability metadata. Omission is not proof of absence or non-deployment.
- **Usage, logs and telemetry:** `GET /api/v1/usage` is organization-scoped. It explicitly returns daily success/failure, token totals and provider-share as unavailable, while returning stored aggregate/application counters where present. `/api/v1/logs` is permission- and organization-scoped. Provider telemetry UI/source includes generated time-series values; those must not be presented as live provider metrics without a verified data source.
- **UI and assistant:** `Sidebar.tsx` filters entries using server permissions/global scope. `App.tsx` already wires applications, API keys, providers, models, telemetry, API playground, API documentation, usage/FinOps, logs and IAM views. `ApiDocumentationView.tsx` reuses the capability endpoint and Swagger. `ScreenAssistant.tsx` uses `HELP_TOPICS` and an internal authenticated endpoint; its answers are not yet demonstrated to be grounded in a complete authoritative developer-platform knowledge index.
- **OpenAPI:** `docs/openapi.yaml` is the existing v1.1.0 contract. It documents the capability inventory and gateway model/inference routes but does not currently document the existing application, API-key, usage and audit-log routes.
- **Hierarchy:** authorization context and organization-scope helpers are present in `src/security/` and the middleware. They provide a local source foundation, but migration 024 remains unapplied and actual database constraints, hierarchy evidence and deployed behavior remain unverified.

## Developer-platform capability matrix

| Capability | Classification | Evidence and boundary |
|---|---|---|
| Applications list/create/update/delete | PARTIALLY_IMPLEMENTED | Existing authenticated routes and UI. Creation may issue an initial key; environments are a fixed field; no separate project/environment resource. |
| Organization visibility for developer resources | PARTIALLY_IMPLEMENTED | Existing routes filter application/key lists through authorization-visible organization IDs. Full route/repository and deployed hierarchy proof is incomplete. |
| Application hierarchy | PARTIALLY_IMPLEMENTED | Parent-application fields and validation exist; no evidence here of a complete arbitrary-depth integration tree across every operation. |
| Environments | PARTIALLY_IMPLEMENTED | Application has `development`, `staging`, or `production`; custom environments and credential-to-environment binding are absent. |
| Credential create/list/revoke/delete | PARTIALLY_IMPLEMENTED | Existing endpoints and UI; creation returns a secret once and list omits it. Revocation and deletion exist. Durable persistence depends on database availability. |
| Credential rotation, disable/archive, rename/update/reveal | NOT_IMPLEMENTED | No reviewed lifecycle route provides these operations. Existing secrets must not be revealed again. |
| Credential scope authority | PARTIALLY_IMPLEMENTED | Only `read:inference` is grantable under the Stage 6 scope ceiling; unknown/nonfunctional scopes fail closed. |
| Inference API | PARTIALLY_IMPLEMENTED | OpenAI-compatible gateway and legacy `/api/v1/orchestrate` exist. The legacy handler accepts API-key material in the JSON body and exposes failure-simulation request fields; use the `x-api-key` header and prefer `/v1/chat/completions`. The legacy route may call providers, mutate usage/quota state and incur charges. It was not exercised in this audit. |
| Provider abstraction and routing | PARTIALLY_IMPLEMENTED | Existing provider catalogue, models and routing rules exist. Runtime provider availability and fallback behavior require configuration/runtime evidence. |
| Model catalogue | IMPLEMENTED (source) | Authenticated model catalogue and UI exist; API-key model listing has no supported runtime scope. |
| Capability API | PARTIALLY_IMPLEMENTED | Authenticated, intentionally partial source-backed inventory. Not a complete API contract or deployment attestation. |
| API Explorer | PARTIALLY_IMPLEMENTED | Swagger “Try it out” and an existing playground are present. Swagger writes can mutate data or contact providers; no sandbox guarantee is established. |
| API documentation | PARTIALLY_IMPLEMENTED | OpenAPI and Swagger now document the application, credential, usage, audit, legacy orchestration and gateway operations inspected here. Full route-by-route coverage and schema/error/example verification for every public developer operation remains outstanding. |
| SDK generation and integration guides | NOT_IMPLEMENTED | No generated SDK workflow was identified. Existing examples/help content is not generated from all operation schemas. |
| Webhooks for developer applications | NOT_IMPLEMENTED | Payment-provider callbacks exist, but they are not customer-configured developer webhooks with signing, retries and delivery history. |
| Usage and request observability | PARTIALLY_IMPLEMENTED | Scoped aggregate endpoint and logs exist. Daily time series, provider shares and several live metrics explicitly return unavailable; request-level inspector coverage is not established. |
| Request inspector | PARTIALLY_IMPLEMENTED | Audit events carry some request/application/model/provider/cost fields, but a complete credential → policy → provider → result trace is not established. The current logs handler returns stored prompt/response preview fields without a handler-level policy-redaction guarantee; treat this as a sensitive-data exposure risk. |
| Quotas and rate limits | PARTIALLY_IMPLEMENTED | Existing per-key RPM and monthly request/spend fields are present. Enforcement and persistence scope must be verified per route/runtime; no complete quota dimensions/reset model is established. |
| Security advisor | NOT_IMPLEMENTED | No reviewed developer-specific evaluator with guided remediation was found. |
| Commercial usage linkage | SOURCE_ONLY | Stage D has pure usage/rating/charge domain logic. This does not prove a persisted gateway-to-charge-to-invoice integration. |
| Team access | PARTIALLY_IMPLEMENTED | Existing IAM and organization authorization can be reused; developer-specific team roles/grants are not established. |
| ALTIL AI and knowledge | PARTIALLY_IMPLEMENTED | Screen Assistant and help topics exist; complete authoritative indexing, scope-aware retrieval and capability-grounded answers are not established. |
| Structured API errors | PARTIALLY_IMPLEMENTED | Some gateway errors carry codes and request context, but a consistent error/request-ID/documentation/remediation contract is not established across developer routes. |
| Audit | PARTIALLY_IMPLEMENTED | Existing best-effort audit path records selected credential operations. Transactional durability and comprehensive developer-operation audit are REQUIRES_DATABASE. The existing logs response may include stored prompt/response previews. |
| OpenAPI completeness | PARTIALLY_IMPLEMENTED | This stage documents the existing applications, credentials, usage and audit operations in OpenAPI. Full route-by-route coverage and schema/error/example verification for every public developer operation remains outstanding. |
| Database constraints and lifecycle persistence | REQUIRES_DATABASE | Migration 024 is unapplied. Do not apply it or infer current database shape from local source. |
| Provider-backed behavior | REQUIRES_RUNTIME | No provider calls were made for this audit. |
| Production deployment and hierarchy | NOT_ASSESSED | Source inspection cannot establish which paths are deployed or actual production data/constraints. |

## Implementation boundary

The first safe UI enhancement now reuses the existing authorized application, API-key, usage and capability reads and the current destination screens. The overview marks request-level metrics and developer webhook health unavailable; it does not generate sample metrics. Existing developer routes were also added to the OpenAPI contract. The Playground now uses environment-based examples instead of inserting a visible credential, does not send a failure-simulation flag, and labels missing response measurements as unavailable. It does not locally fabricate an audit record from an inference response. Client-side provider seed records no longer contain credential-shaped values. Any new persistent entity or lifecycle operation—including custom environments, credential rotation, developer webhooks, request-event storage, or durable quota policies—requires a separately reviewed schema/compatibility design and the explicit database gate. No migration, schema change, or provider integration was performed.

### Stage 7 local implementation boundary

| Area | Classification | Current local evidence / limitation |
|---|---|---|
| Developer Centre overview | PARTIALLY_IMPLEMENTED | Reuses authorization-scoped existing application, key, usage, capability, and session reads. Unavailable metrics are shown as `UNAVAILABLE`; counts from returned lists are labeled `CALCULATED` or `SYNTHETIC` when the LOCAL_TEST marker is present. |
| Application and credential management | PARTIALLY_IMPLEMENTED | Existing API routes/screens are reused. No new environment entity, credential rotation lifecycle, IP/origin restriction workflow, or complete application detail workflow was introduced. |
| Canonical credential scopes | PARTIALLY_IMPLEMENTED | Existing registry distinguishes the one runtime-enforced scope from persisted legacy values and rejected unsupported scopes. The runtime audit does not establish that all listed public routes have a credential-scope model. |
| Playground response evidence | PARTIALLY_IMPLEMENTED | Missing provider/model/latency/token values remain unavailable. Failed responses no longer imply successful policy, dispatch, or audit persistence. No external request was made during this work. |
| OpenAPI developer routes | PARTIALLY_IMPLEMENTED | Eleven existing application, credential, usage, logs, and legacy orchestration operations were checked for path/method presence and security declarations. This is not a complete inventory of every public developer route or a guarantee that each documented schema exactly matches every runtime response. |
| Client-side provider credential seeds | IMPLEMENTED (local safety correction) | Provider seed `apiKey` fields are empty and display prefixes state that no credential is configured. This does not inspect or alter server-side configuration or establish whether any external credential is valid. |
| Provider execution, webhooks, request traces, quotas, developer SDKs, security advisor | NOT_IMPLEMENTED / REQUIRES_RUNTIME | Existing partial source capabilities remain; no live provider, webhook delivery, security evaluation, or request-level observability was exercised. |
| Persistence and deployed authorization | REQUIRES_DATABASE / NOT_ASSESSED | Migration 024 remains unapplied. No database was connected and no production facts were inferred. |

## Audit status

Discovery audit: **COMPLETE**. This document records source findings and known limits; it is not a production-readiness assertion. The Developer Centre UI enhancement is tracked separately from database-dependent platform capabilities.
