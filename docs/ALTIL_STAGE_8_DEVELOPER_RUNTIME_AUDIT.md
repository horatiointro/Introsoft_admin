# ALTIL Stage 8 — Developer Runtime & Interoperability Audit

**Audit basis:** source inspection of the local working tree on 2026-09-29. This is not deployment, production database, or provider-runtime evidence. Existing working-tree changes were preserved.

## Capability inventories

| Area | Classification | Source-backed finding |
|---|---|---|
| Developer route inventory | PARTIALLY_IMPLEMENTED | `src/routes/applicationCredentialRoutes.ts` provides application list/create/update/delete, key list/create/revoke/delete, customer-key creation, and key validation routes. `server.ts` provides `/api/v1/capabilities`, `/api/v1/models` and related model administration, `/api/v1/usage`, `/api/v1/logs`, `/api/v1/orchestrate`, `/v1/chat/completions`, `/v1/responses`, and `/v1/models`. The inventory is source-reviewed, not proven complete or deployed. |
| Application lifecycle | PARTIALLY_IMPLEMENTED | Applications can be listed, created, updated, and deleted through the existing routes. Creation can issue an initial credential; ownership is organization-scoped. Application environment is a field, not a separate environment resource. |
| Credential lifecycle | PARTIALLY_IMPLEMENTED | Create/list/revoke/delete exist. Issued secrets are returned once and newly stored keys are digested. No rotate, disable, archive, rename, credential-to-environment binding, or old/new overlap workflow is established. |
| Credential authentication | PARTIALLY_IMPLEMENTED | `src/security/apiKeyCredential.ts` validates exact key resolution, active state, expiry, and the required scope. The Stage 8 correction rejects explicit expired status, malformed expiry, and expiry at the current instant. Gateway logic also applies request limiting and existing application/tenant/policy routing. |
| Scope inventory | PARTIALLY_IMPLEMENTED | `src/security/credentialScopeAuthority.ts` marks `read:inference` as runtime-enforced. Historical values such as `read:models`, `write:inference`, `read:capabilities`, and `write:telemetry` are persisted-but-nonfunctional or rejected; they are not safe to grant as runtime authority. |
| Provider inventory | PARTIALLY_IMPLEMENTED / REQUIRES_PROVIDER | Provider types/catalogue and dispatch paths exist for configured providers and OpenAI-compatible services. Runtime credentials, provider reachability, routing, fallback, pricing, and availability were not verified by external calls. Client seed credentials are cleared; no provider call was made. |
| Model inventory | PARTIALLY_IMPLEMENTED | `/api/v1/models` and model UI/catalogue exist. Configured catalogue data is not evidence of live availability, accurate pricing, context limits, or tenant policy compatibility. |
| Capability inventory | PARTIALLY_IMPLEMENTED | Authenticated `/api/v1/capabilities` is deliberately partial and source-reviewed. An omitted item does not prove that the route is absent or undeployed. |
| Usage inventory | PARTIALLY_IMPLEMENTED / REQUIRES_DATABASE | Organization-scoped aggregate reads and runtime in-memory counters exist. Persisted request events and complete token, latency, provider-share, and time-series aggregates are not established. The UI must show missing measurements as `UNAVAILABLE`. |
| Audit inventory | PARTIALLY_IMPLEMENTED / REQUIRES_DATABASE | Existing audit routes and credential audit paths exist. Comprehensive request trace, durable transaction coupling, safe prompt/response preview policy, and audit outcome guarantees are not established. `/api/v1/logs` has organization/permission checks; handler-level preview redaction is not established. |
| OpenAPI inventory | PARTIALLY_IMPLEMENTED | `docs/openapi.yaml` includes 11 checked application, key, usage, logs, and legacy-orchestration operations, with authentication declarations. This is 11/11 for that checked subset, not a coverage percentage for all public developer routes. Exact response/error/example parity across the full route set remains unverified. |
| Developer Centre UI | PARTIALLY_IMPLEMENTED | `src/components/DeveloperCentreView.tsx` reuses existing scoped reads and destination screens. It marks calculated/synthetic/unavailable values and identifies that credentials are not environment-bound. The complete guided lifecycle and request inspector are not implemented. |
| API Explorer | PARTIALLY_IMPLEMENTED | The existing Playground and Swagger UI are reused. Playground no longer inserts a credential secret or simulated failure flag. It can still call configured providers and consume quota or incur usage; no such request was run. Examples are not generated from OpenAPI schemas. |
| ALTIL AI knowledge | PARTIALLY_IMPLEMENTED | `ScreenAssistant.tsx` and `HELP_TOPICS` provide an existing assistant and local help content. A complete authoritative API-state/trace retrieval index and tenant-safe request-ID explanation flow are not established. |

## Security and runtime boundaries

- **Identity and isolation:** developer resources use existing authentication, organization-scope helpers, role/permission middleware, and server-side route checks. Existing isolated HTTP/security tests cover selected own, descendant, sibling, unrelated, foreign-ID, and global-grant scenarios. They do not establish complete Stage 8 LIST/READ/CREATE/UPDATE/DELETE/EXECUTE coverage for every route/resource.
- **Credential restrictions:** the shared validator enforces exact secret resolution, status, expiration, and runtime scope. The orchestration route also applies existing IP/request limiting logic. Environment binding and model-specific credential restrictions are absent. Restrictions must not be represented as enforced until the server checks them.
- **Environment:** current applications have `development`, `staging`, or `production` as an application attribute. There is no independent persistent environment resource or credential-to-environment binding. A richer model is **REQUIRES DATABASE** and migration 024 remains behind its evidence/approval gate.
- **Errors and request IDs:** some gateway errors contain codes and request context, but a consistent status/code/message/request-ID/documentation/remediation shape is not established across every developer route. There is no verified cross-request trace store available for ALTIL AI explanations.
- **Usage and commerce:** existing runtime counters and Stage D domain logic do not prove durable request-event persistence or an operational usage → rating → commercial event → invoice integration. No parallel billing implementation was added.
- **Rate limiting:** the existing key-level request limiter is server-side. Tenant/application/environment/model limit dimensions and current/remaining/reset reporting are not established across the platform.
- **Webhooks and SDKs:** customer-configured developer webhook lifecycle and delivery retries are not implemented. Generated official SDKs and OpenAPI-derived examples are not implemented.
- **Provider and production evidence:** no provider, production, or database runtime was exercised. Migration 024 was not applied.

## Stage 8 change in this working tree

The shared API-key validator now fails closed for `status: expired`, malformed expiry values, and expiry timestamps at or before the current time. Regression tests cover those cases. The Playground reports unavailable measurements and does not imply that an audit record was durably written merely because an orchestration response was received. Client-side provider seed keys are empty. These are local source changes only and do not attest to deployment or database state.

## Status

Stage 8 audit: **COMPLETE for the reviewed source areas**. Stage 8 runtime/interoperability objectives: **PARTIALLY IMPLEMENTED**. Do not claim production readiness. Persistent environments, complete credential lifecycle, complete route coverage, request tracing, full error contract, durable usage, webhook lifecycle, OpenAPI-derived code generation, and provider-backed behavior remain outstanding or gated by database/runtime evidence.
