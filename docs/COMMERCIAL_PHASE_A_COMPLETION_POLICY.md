# Commercial Phase A completion policy

This document records the Phase A cardinality and durable-write rules implemented by migrations 027–030 and the commercial foundation routes. It does not establish any production database state or authorize Phase B.

## Commercial and technical scope cardinality

- One commercial organization may have many explicit technical tenant scope links, including different environments over time.
- A technical tenant may have zero or one active/effective commercial organization owner at any instant. Overlapping links to different organizations, and overlapping links that would create duplicate ownership, are rejected. A future transfer requires ending the old effective interval before the new interval starts.
- Supported link purposes are `PRIMARY`, `PRODUCTION`, `SANDBOX`, and `DEVELOPMENT`. The purpose labels the explicit link; it does not grant access.
- A commercial customer may have zero or many explicit tenant links. A technical tenant may have no more than one active/effective commercial customer link at a time. This phase does not add an API that creates customer/tenant links; the table remains an explicit relationship model and no such relationship is inferred.
- The supported Phase A authorization bridge is organization-to-technical-tenant. The customer-to-tenant table has no application write or authorization path in this phase; it is not an alternate route to tenant access. Customer-to-tenant linkage requires a separately approved use case and implementation before it can be treated as supported behavior.
- Commercial organization/customer relationships do not grant IAM permissions. Access still requires an existing IAM grant, the requested permission, technical tenant scope, an explicit effective commercial link where relevant, and resource/action authorization.
- Effective intervals are half-open: `effective_from <= now < effective_to`; a null end is open-ended. Expired links fail closed.
- No technical tenant, tenant name, metadata, or similarity is used to create a commercial relationship.

The organization scope write API is `POST /api/v1/commercial/organization-tenant-scopes`. It requires the normal authenticated session, `SUPER_ADMIN`, `tenant.write`, a GLOBAL Super Admin grant, a technical tenant authorized by the existing IAM context, and a matching one-use owner approval. Approval identifies the organization, tenant, link type, and exact effective period. The read API is available at `GET /api/v1/commercial/organizations` and `GET /api/v1/commercial/organizations/{organizationId}/technical-scopes`; results include only scopes attached to organizations visible to the caller.

The scope route locks the existing technical tenant row before checking for overlapping intervals and inserting the link. The overlap query is a locking read, so competing writes see the latest committed interval after waiting. This serializes competing writes for the same tenant on the existing MariaDB transaction. Unique indexes on `(tenant_id, effective_from)` in both scope-link tables are a second line of defense against same-start duplicates. Database checks restrict allowed link purposes and reject invalid intervals. The database has no general exclusion constraint for time intervals; correctness therefore also depends on the tenant-row lock and overlap check inside the same transaction.

## Durable mutation and audit contract

Every commercial mutation route requires an `Idempotency-Key` header. The server stores only its SHA-256 hash. A 24-hour record is scoped to the authenticated actor, the ALTIL control-plane API application identity, and the operation. A canonical request fingerprint prevents a key from being reused with a different payload. Replays with the same fingerprint return the stored status/body/resource reference without another mutation or audit event. A changed fingerprint returns HTTP 409.

The mutation, one-use approval consumption, `audit_logs` insert, and idempotency completion are performed through one transaction/connection. Deterministic business denials are recorded as `FAILED` with their audit event and replayable response. Unexpected database failures roll back the claim, any business writes, approval use, and audit row so that the same operation can be safely retried. The record state is one of `IN_PROGRESS`, `COMPLETED`, or `FAILED`; an in-progress record is not committed separately from the business transaction.

The audit row follows the existing ALTIL event envelope. It includes actor, operation, resource, organization/tenant scope where applicable, request/correlation ID, outcome, status, application identity, and a one-way idempotency reference. It does not include the submitted body, contact data, credentials, or the raw idempotency key. In LOCAL E2E, the same event is appended to the isolated structured log file after the database transaction commits; the database audit row remains the atomic source of record.

## Phase A local exit-gate verification

The isolated Phase A E2E runner targets only `127.0.0.1:3306/altil_e2e_test`, requires each migration from 025 through 030 to be recorded, and accepts later migrations without treating them as proof of production deployment. It exercises authenticated reads; organization, customer, legal entity, account and scope creation; sequential and concurrent idempotent replay; changed-payload conflict; single-use approval races; scope approval binding to the correct organization and tenant; one organization linked to multiple tenants; denial when a second organization claims an already-owned tenant; competing ownership intervals; and authorized scope reads.

The E2E suite also forces the audit insert to fail inside a real MariaDB transaction after a synthetic scope row and idempotency claim have been written. Verification confirms all three persisted counts are zero after rollback. A scope retry replays the same resource. The associated unit tests verify that expired or future scopes do not contribute commercial visibility, and that a commercial relationship does not expand existing IAM tenant grants.

These checks establish local behavior against the isolated test database only. They do not establish production migration state, live foreign keys, production deployment, or production runtime behavior. The E2E fixtures are synthetic and no provider, billing, payment, or production service is contacted. Phase B1 catalogue/resale files were already present in this working tree and were not changed or evaluated as part of this Phase A gate; B2–B10 were not started.

## Production boundary

Any migration application and database writes in this workstream are limited to the explicitly allowlisted `127.0.0.1:3306/altil_e2e_test` database. They do not connect to or establish compatibility with production. Production schema, constraints, deployment, and authorization remain unverified until separately evidenced and reviewed. This policy documents Phase A controls only and does not clear or authorize further Phase B work.
