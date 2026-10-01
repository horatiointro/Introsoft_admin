# Development/Test Release-Readiness Remediation Notes

## Environment boundary

ALTIL currently has one logical `development-test` environment on the PC and development/test server. No production environment or production evidence was available or accessed. The server's commit, runtime, database identity/version and environment report still require collection from the development/test operator before parity can be claimed. Host-specific endpoints, ports, database addresses, log paths and callback URLs are expected to differ; secrets used to decrypt shared stored values must match when both hosts read the same ciphertext. Secret values are never included in diagnostic output.

The local `.env` for the regular application selects `altil_db`. During earlier work, an unsupported migration inventory option invoked the normal apply-mode migration runner and applied migrations 024–035 to that local PC database. No rollback was attempted. This was not the isolated E2E database and was not a server or production database. Treat the changed local `altil_db` baseline as requiring owner review.

The safe PC environment report was run after these changes. It reported Node `v24.16.0`, npm `11.13.0`, MariaDB `9.5.0`, `altil_db`, and applied migrations 001–035 with 036 pending. The E2E driver also observed MariaDB `9.5.0`. Several legacy status strings in `src/db/mariadb.ts` still hard-code `10.11.18`, so those labels are not evidence of the actual server version; the live `SELECT VERSION()` report is authoritative. The documented/embedded target is MariaDB 10.11.18, leaving a PC-vs-expected version mismatch to resolve before parity can be claimed. The report did not print credentials or call external providers. It marked the PC configuration invalid because `ALTIL_ENVIRONMENT` was unset and `PAYFAST_SANDBOX=true` and `IKHOKHA_MODE=test` (or `sandbox`) were missing. Configure these deliberately before starting the ordinary development/test application. No server report was supplied, so matching commits, runtimes, database versions, schema fingerprints, secret fingerprints, and migration states remain unverified. Host-specific URLs, ports, database endpoints, log paths, and callback URLs may differ; `ALTIL_ENVIRONMENT` must identify the same logical profile, and secrets protecting shared ciphertext must match when both hosts use it. No secret equality is claimed without matching safe fingerprints.

## Isolated database state

The E2E database is `altil_e2e_test` on loopback. Its identity was verified before migration execution. It uses MariaDB 9.5.0 on this PC; the application driver reports its own driver version separately. Migration 035 was applied only to this isolated database, after confirming that six expected tables already existed and matched the historical definitions; `compliance_framework_configs` was the missing table. The 035 standalone verification SELECT passed with 98 projected repository columns and all seven required tables present. Migration 036 was subsequently applied only to this same isolated database.

No database migration was run against a server. Current E2E migration status is 001–036. The regular local `altil_db` is at 001–035; the safe environment report confirmed 036 is pending there. Do not use `db:status` as a read-only check because the existing migration runner has startup side effects. Migration 035 and 036 remain forward-only; the DSAR E2E runner refuses any target except loopback `altil_e2e_test` and verifies the expected migration state before running tests.

## DSAR persistence

Migration 005 defined statutory DSAR columns that the prior repository did not write, while repository reads expected non-existent columns. The old catch-and-memory-fallback path could report a non-durable object as success. Migration 036 adds the current API contract fields and makes unassigned officer state nullable; it does not delete or rewrite existing DSAR rows. The repository writes and reads back the saved row inside a transaction and fails closed when persistence is unavailable. Database-backed E2E tests cover creation/readback, idempotent update, tenant-FK rollback and offline failure. Test cleanup targets only synthetic IDs created by the test.

## Manual invoice receipts

`POST /api/v1/billing/invoices/:id/payment` remains a manual finance operation. It now requires an evidence reference and an `Idempotency-Key`, checks tenant billing authorization, invoice state, currency and amount, and updates the invoice, existing payment ledger, balanced accounting journal and audit row in a single MariaDB transaction. Exact retries replay one existing payment; reuse with different details is rejected. Manual receipts use the existing ledger and journal rather than a second financial ledger.

The existing ledger row retains its established `kind=payment` and adds `paymentOrigin=manual_recorded` plus `providerConfirmed: false`. The journal debits `1090` (unverified manual receipt clearing) and credits accounts receivable; it does not debit the operating bank or imply provider settlement. The evidence reference is an operator attestation/reference, not an independent bank confirmation. Reconciliation/settlement remains separate. E2E tests verify full and partial payments, duplicate/replayed requests, conflicting reuse, invalid/overpayment/currency/authorization rejection, durable audit, balanced journal and rollback after a forced journal-key conflict.

### Payment allocation decision

Existing provider payment intents carry one `invoice_id`. Hosted checkout is created for one invoice, and capture applies one intent's amount to that invoice. Multiple intents/captures can partially settle the same invoice. Manual receipts are likewise recorded against one invoice. No current workflow or evidence establishes a need for one payment to cover multiple invoices, unapplied cash, credit balances or reallocation. The current one-invoice-per-payment model is sufficient for the demonstrated flows; no allocation table or second ledger is introduced. Multi-invoice/unapplied-credit requirements remain a future business decision, not an assumed capability.

## Registration, trial and legal-entity state

Self-registration begins as `pending_approval`; owner approval creates a 14-day trial. The approved registration is `trial_active`, tenant metadata is `trial`, license state is `active`, payment state is `pending`, runtime entitlement is `trial`, and no durable ALTIL subscription record is created at approval. The tenant row's technical `status` remains `active` so the account can be provisioned; its commercial trial state is in the tenant metadata. These fields represent different lifecycle dimensions.

Successful provider payment moves payment to `paid`, keeps the license `active`, clears the trial, and enables the paid entitlement. Failed provider payment uses the existing `grace_period`/`failed` license/payment states. At trial expiry without a paid payment, runtime access is blocked, tenant metadata is suspended, and the license is now `auto_suspended` while payment remains `pending`. A durable subscription status is not available in the current ALTIL schema; hosted Stripe subscription state must not be inferred from the trial itself.

`commercial_accounts.legal_entity_id` is explicitly nullable in migration 025. Registration creates a company/customer and billing account but does not collect or verify a legal entity. Therefore the account is intentionally unlinked at registration; legal-entity identity must be established through a later evidence-backed lifecycle, not inferred from a company name. No legal entity was fabricated in this work.

## IAM and commercial hierarchy

Commercial organization/customer relationships do not automatically grant IAM access. IAM authorization uses persisted role assignments, permissions and the IAM organization graph. Tests verify that a commercial parent/child relationship alone does not grant child read or write access; direct scopes, descendant scopes and global assignments remain explicit IAM grants. Commercial relationships may describe who sells to or buys from whom, but cannot substitute for an authorization assignment.

## Route inventory

The inventory contains 273 records. Its original source references were a frozen snapshot, and there was no validator to detect drift. The refresh/check script now resolves each record to one current route declaration and records an `accessClassification` (`AUTHENTICATED`, `PUBLIC`, `CREDENTIAL/CHALLENGE`, `N/A`, or `INTENTIONALLY REJECTED`) from the existing middleware classification. The substantive `status` field is preserved. 219 records remain `NOT ASSESSED`; source-location validation does not turn them into security assessments or prove the inventory contains every route. Remaining assessment and completeness review are blockers to a full security signoff.

## Provider verification

OpenRouter adapter tests use injected mock fetch implementations; no external provider was called. Coverage includes credential absence, HTTPS/base URL validation, model normalization, streaming passthrough, timeout signal propagation, malformed catalogue responses and upstream error-body redaction. The broader server-level provider selection/failover path, authorization-before-provider-call behavior, and production provider behavior are not fully HTTP/E2E verified. No live provider test was run.

## Validation and Git boundary

The local safe suite passed 325/325; the isolated DSAR/manual-payment E2E suite passed 10/10. TypeScript, build, OpenAPI YAML/structure, static migration inventory, route source-reference check, and `git diff --check` passed. The route inventory has 273 resolvable records; 219 still say `NOT ASSESSED`, and its validator does not prove the inventory is exhaustive. Provider adapter tests use mocks; broader server-level selection/failover and authorize-before-provider-call behavior remain unverified. The build reports a large frontend chunk warning.

Local commits created for this remediation are `9e0c54a` (environment contract), `23d9661` (DSAR persistence), and `218d6d8` (manual invoice receipts/trial states), plus `45b8654` (provider/hierarchy tests). The route inventory and this remediation note are still uncommitted pending final review. Nothing was pushed or deployed. No development/test server was contacted, no production system was accessed, and no external payment, email, SMS, or AI provider was contacted. Do not claim release readiness from these PC-only results.
