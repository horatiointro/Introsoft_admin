# ALTIL Commercial Platform — Production Evidence Request

**Purpose:** Collect the minimum production evidence needed before approving any commercial schema migration.  
**Mode:** Strictly read-only. This is an operator-run procedure; do not connect this workspace to production.  
**Source context:** The current workspace database is a loopback simulator/test database and is not production evidence. See [Phase 3 validation](./COMMERCIAL_PHASE_3_VALIDATION.md).

## 0. Safety and collection rules

1. Have the production database owner create or provide a **read-only database account** restricted to `SELECT` on the ALTIL schema and read access to `information_schema`. Do not use an application account or a migration/admin account.
2. Run from the approved production access environment, through the approved secure tunnel/session. Never put a password, token, connection URL, private key, or provider secret in a command, SQL file, shell history, transcript, or report.
3. Use an approved local MySQL/MariaDB login profile (for example, `altil-prod-ro`) whose secret is held in the operator's protected client configuration. The profile name is not a credential. Do not run `npm run db:migrate`, `scripts/migrate.js`, application mutation APIs, webhooks, checkout, refunds, imports, or settlement actions as part of evidence collection.
4. Start a read-only transaction before the SQL below. Run only `SELECT`, `SHOW`, and `information_schema` queries. Do not use temporary tables, stored procedures, `SET GLOBAL`, DDL, or scripts that write results into the database. Close with `ROLLBACK` even though the transaction is read-only.
5. If the server/client does not support or accept a read-only transaction, stop. Do not substitute an unrestricted account. The account must also be read-only by privilege; a session flag alone is insufficient.
6. Do not export row-level customer, user, invoice, card, key, token, credential, URL, webhook body, or payment data. Do not select JSON payloads wholesale. Report only aggregate counts/sums/statuses/currencies/date ranges and schema metadata. When an identifier is essential to resolve an exception, hash or consistently pseudonymize it in the restricted evidence workspace; do not include it in the shared report.
7. Record environment label, UTC collection time, operator role (not personal details), application release/commit, DB engine/version, migration range, and query set. Keep raw aggregate output in the approved restricted evidence store; put only redacted summaries in `docs/COMMERCIAL_PHASE_3_VALIDATION.md` or a successor review.

### Suggested secure client invocation

Configure the secure login profile separately according to the organization's DBA procedure. Then run a reviewed SQL file using that profile, with the database name supplied by the operator from the approved environment inventory:

```sh
mysql --login-path=altil-prod-ro --database="$ALTIL_PROD_DB" --batch --raw < commercial-production-evidence.sql
```

Do not define `$ALTIL_PROD_DB` on a shared shell if its value is classified; enter it in the protected operator session. The SQL file must contain only the queries in this document that match the discovered schema. Do not paste secrets or raw database output into this repository.

## A. Environment checks

### Database engine, version and target

Run inside the read-only session:

```sql
SET SESSION TRANSACTION READ ONLY;
START TRANSACTION;

SELECT
  VERSION() AS database_version,
  @@version_comment AS database_distribution,
  DATABASE() AS database_name,
  @@global.read_only AS server_read_only_flag,
  CURRENT_USER() AS database_account;
```

In the shared report, replace the exact database name and account with approved environment labels (for example, `production-commercial-db` and `readonly-role`) unless the security owner approves disclosure. Confirm the account's grants out of band with the DBA; do not export grant output if it includes account names or host information.

### Migration version

First verify the migration table exists via Section B. If present:

```sql
SELECT COUNT(*) AS applied_migration_count,
       MIN(version) AS first_version,
       MAX(version) AS last_version
FROM schema_migrations;

SELECT version, name, applied_at
FROM schema_migrations
ORDER BY version;
```

Migration names and timestamps are not secrets. Compare versions to the checked-out source migration files and record checksum mismatches only as migration/version identifiers. Do not invoke the migration runner to obtain status; its status path has schema-creation side effects in this repository.

### Application and runtime version

Obtain from deployment metadata, not from a production source edit:

```sh
git rev-parse HEAD
git status --short
node --version
npm --version
```

For a container, capture its immutable image digest and release label from the orchestrator. For a packaged build, capture the deployed artifact version and build timestamp from the deployment manifest. `git status` is meaningful only for a source checkout; do not access or modify production files to get it. Compare the reported commit/artifact to the approved release. Report runtime versions and release identifiers only; omit environment variables and process command lines because they can contain secrets.

## B. Schema checks

### Discover relevant and additional tables

```sql
SELECT TABLE_NAME, ENGINE, TABLE_ROWS
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_TYPE = 'BASE TABLE'
  AND (
    TABLE_NAME IN (
      'schema_migrations','tenants','tenant_applications','tenant_api_keys','tenant_key_usage',
      'licensing_plans','tenant_licenses','billing_products','billing_orders','billing_order_lines',
      'billing_invoices','billing_ledger_entries','billing_payment_intents','billing_payment_methods',
      'billing_schedules','payment_provider_events','payment_webhook_logs','billing_refunds',
      'billing_reconciliation_batches','billing_reconciliation_items','accounting_journals',
      'accounting_journal_lines','platform_currency_settings','billing_fx_rates','billing_fx_rate_history',
      'audit_logs','iam_users','iam_roles','iam_user_roles'
    )
    OR TABLE_NAME LIKE '%alloc%'
    OR TABLE_NAME LIKE '%settle%'
    OR TABLE_NAME LIKE '%credit%'
    OR TABLE_NAME LIKE '%quote%'
    OR TABLE_NAME LIKE '%contract%'
    OR TABLE_NAME LIKE '%tax%'
    OR TABLE_NAME LIKE '%charge%'
    OR TABLE_NAME LIKE '%subscription%'
    OR TABLE_NAME LIKE '%entitle%'
  )
ORDER BY TABLE_NAME;
```

`TABLE_ROWS` is approximate for some engines. Use exact `COUNT(*)` in Section C for tables that exist. This discovers potential additional commercial tables without assuming their names.

### Columns, keys, constraints and indexes

```sql
SELECT TABLE_NAME, COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT,
       COLUMN_KEY, EXTRA
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME IN (
    'tenants','tenant_applications','tenant_api_keys','tenant_key_usage','licensing_plans','tenant_licenses',
    'billing_products','billing_orders','billing_order_lines','billing_invoices','billing_ledger_entries',
    'billing_payment_intents','billing_payment_methods','billing_schedules','payment_provider_events',
    'payment_webhook_logs','billing_refunds','billing_reconciliation_batches','billing_reconciliation_items',
    'accounting_journals','accounting_journal_lines','platform_currency_settings','billing_fx_rates',
    'billing_fx_rate_history','audit_logs','iam_users','iam_roles','iam_user_roles'
  )
ORDER BY TABLE_NAME, ORDINAL_POSITION;

SELECT TABLE_NAME, CONSTRAINT_NAME, CONSTRAINT_TYPE
FROM information_schema.TABLE_CONSTRAINTS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME IN (
    'tenants','tenant_applications','tenant_api_keys','tenant_key_usage','licensing_plans','tenant_licenses',
    'billing_products','billing_orders','billing_order_lines','billing_invoices','billing_ledger_entries',
    'billing_payment_intents','billing_payment_methods','billing_schedules','payment_provider_events',
    'payment_webhook_logs','billing_refunds','billing_reconciliation_batches','billing_reconciliation_items',
    'accounting_journals','accounting_journal_lines','platform_currency_settings','billing_fx_rates',
    'billing_fx_rate_history','audit_logs','iam_users','iam_roles','iam_user_roles'
  )
ORDER BY TABLE_NAME, CONSTRAINT_TYPE, CONSTRAINT_NAME;

SELECT TABLE_NAME, INDEX_NAME, NON_UNIQUE,
       GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX) AS index_columns
FROM information_schema.STATISTICS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME IN (
    'tenants','tenant_applications','tenant_api_keys','tenant_key_usage','licensing_plans','tenant_licenses',
    'billing_products','billing_orders','billing_order_lines','billing_invoices','billing_ledger_entries',
    'billing_payment_intents','billing_payment_methods','billing_schedules','payment_provider_events',
    'payment_webhook_logs','billing_refunds','billing_reconciliation_batches','billing_reconciliation_items',
    'accounting_journals','accounting_journal_lines','platform_currency_settings','billing_fx_rates',
    'billing_fx_rate_history','audit_logs','iam_users','iam_roles','iam_user_roles'
  )
GROUP BY TABLE_NAME, INDEX_NAME, NON_UNIQUE
ORDER BY TABLE_NAME, INDEX_NAME;

SELECT TABLE_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME,
       CONSTRAINT_NAME
FROM information_schema.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = DATABASE()
  AND REFERENCED_TABLE_NAME IS NOT NULL
ORDER BY TABLE_NAME, COLUMN_NAME;
```

Schema metadata can expose column names but not values. Review newly discovered tables and repeat metadata inspection for them. Do not use `SELECT *` against business tables.

## C. Exact row-count and distribution checks

Run only statements for tables found in Section B. Each is a read-only exact count. If a table is absent, record `ABSENT` rather than creating it.

```sql
SELECT 'tenants' table_name, COUNT(*) rows FROM tenants
UNION ALL SELECT 'tenant_applications', COUNT(*) FROM tenant_applications
UNION ALL SELECT 'tenant_api_keys', COUNT(*) FROM tenant_api_keys
UNION ALL SELECT 'tenant_key_usage', COUNT(*) FROM tenant_key_usage
UNION ALL SELECT 'licensing_plans', COUNT(*) FROM licensing_plans
UNION ALL SELECT 'tenant_licenses', COUNT(*) FROM tenant_licenses
UNION ALL SELECT 'billing_products', COUNT(*) FROM billing_products
UNION ALL SELECT 'billing_orders', COUNT(*) FROM billing_orders
UNION ALL SELECT 'billing_order_lines', COUNT(*) FROM billing_order_lines
UNION ALL SELECT 'billing_invoices', COUNT(*) FROM billing_invoices
UNION ALL SELECT 'billing_ledger_entries', COUNT(*) FROM billing_ledger_entries
UNION ALL SELECT 'billing_payment_intents', COUNT(*) FROM billing_payment_intents
UNION ALL SELECT 'billing_payment_methods', COUNT(*) FROM billing_payment_methods
UNION ALL SELECT 'billing_schedules', COUNT(*) FROM billing_schedules
UNION ALL SELECT 'payment_provider_events', COUNT(*) FROM payment_provider_events
UNION ALL SELECT 'payment_webhook_logs', COUNT(*) FROM payment_webhook_logs
UNION ALL SELECT 'billing_refunds', COUNT(*) FROM billing_refunds
UNION ALL SELECT 'billing_reconciliation_batches', COUNT(*) FROM billing_reconciliation_batches
UNION ALL SELECT 'billing_reconciliation_items', COUNT(*) FROM billing_reconciliation_items
UNION ALL SELECT 'accounting_journals', COUNT(*) FROM accounting_journals
UNION ALL SELECT 'accounting_journal_lines', COUNT(*) FROM accounting_journal_lines;
```

For discovered invoice-line, allocation, settlement, credit-note, charge, quote, contract, tax, or subscription tables, add a corresponding exact count after confirming its name. Do not guess absent table names in executable SQL.

Run these grouped summaries only after confirming the listed columns in metadata. They expose categories and counts, not customer identifiers:

```sql
SELECT status, COUNT(*) rows, MIN(created_at) oldest, MAX(created_at) newest
FROM billing_orders GROUP BY status;
SELECT status, currency, COUNT(*) rows, MIN(created_at) oldest, MAX(created_at) newest,
       SUM(total) total_amount, SUM(paid) paid_amount
FROM billing_invoices GROUP BY status, currency;
SELECT provider, status, currency, COUNT(*) rows, MIN(created_at) oldest, MAX(created_at) newest,
       SUM(amount) requested_amount, SUM(captured_amount) captured_amount, SUM(fee_amount) fee_amount
FROM billing_payment_intents GROUP BY provider, status, currency;
SELECT provider, event_type, COUNT(*) rows, MIN(processed_at) oldest, MAX(processed_at) newest
FROM payment_provider_events GROUP BY provider, event_type;
SELECT provider, status, currency, COUNT(*) rows, MIN(requested_at) oldest, MAX(requested_at) newest,
       SUM(amount) amount
FROM billing_refunds GROUP BY provider, status, currency;
SELECT provider, status, currency, COUNT(*) rows, SUM(row_count) statement_rows,
       SUM(gross_total) gross, SUM(fees_total) fees, SUM(net_total) net,
       MIN(created_at) oldest, MAX(created_at) newest
FROM billing_reconciliation_batches GROUP BY provider, status, currency;
SELECT status, currency, COUNT(*) rows, SUM(total) total_amount, SUM(paid) paid_amount,
       MIN(created_at) oldest, MAX(created_at) newest
FROM billing_invoices GROUP BY status, currency;
SELECT currency, source_type, COUNT(*) journals, MIN(posted_at) oldest, MAX(posted_at) newest
FROM accounting_journals GROUP BY currency, source_type;
SELECT currency, COUNT(*) rates, MIN(as_of) oldest_rate, MAX(as_of) newest_rate
FROM billing_fx_rates GROUP BY currency;
```

For tenant-level counts, report only anonymized buckets such as “tenants with 0/1–10/11–100/>100 records”; never list tenant names, emails, tenant IDs, or low-count identities in a broadly shared report.

## D. Relationship checks

These checks match the schema evidenced in the current repository. Verify every referenced column in Section B first. Return counts only.

### Tenant → applications → API keys → usage

```sql
SELECT
 (SELECT COUNT(*) FROM tenant_applications a LEFT JOIN tenants t ON t.id=a.tenant_id WHERE t.id IS NULL) app_tenant_orphans,
 (SELECT COUNT(*) FROM tenant_api_keys k LEFT JOIN tenants t ON t.id=k.tenant_id WHERE t.id IS NULL) key_tenant_orphans,
 (SELECT COUNT(*) FROM tenant_api_keys k LEFT JOIN tenant_applications a ON a.id=k.application_id WHERE k.application_id IS NOT NULL AND a.id IS NULL) key_app_orphans,
 (SELECT COUNT(*) FROM tenant_key_usage u LEFT JOIN tenants t ON t.id=u.tenant_id WHERE t.id IS NULL) usage_tenant_orphans,
 (SELECT COUNT(*) FROM tenant_key_usage u LEFT JOIN tenant_applications a ON a.id=u.application_id WHERE a.id IS NULL) usage_app_orphans,
 (SELECT COUNT(*) FROM tenant_key_usage u LEFT JOIN tenant_api_keys k ON k.id=u.api_key_id WHERE k.id IS NULL) usage_key_orphans;
```

### Tenant → license → plan; tenant → order → order lines → product

```sql
SELECT
 (SELECT COUNT(*) FROM tenant_licenses l LEFT JOIN tenants t ON t.id=l.tenant_id WHERE t.id IS NULL) license_tenant_orphans,
 (SELECT COUNT(*) FROM tenant_licenses l LEFT JOIN licensing_plans p ON p.id=l.plan_id WHERE p.id IS NULL) license_plan_orphans,
 (SELECT COUNT(*) FROM billing_orders o LEFT JOIN tenants t ON t.id=o.tenant_id WHERE t.id IS NULL) order_tenant_orphans,
 (SELECT COUNT(*) FROM billing_order_lines l LEFT JOIN billing_orders o ON o.id=l.order_id WHERE o.id IS NULL) order_line_order_orphans,
 (SELECT COUNT(*) FROM billing_order_lines l LEFT JOIN billing_products p ON p.id=l.product_id WHERE p.id IS NULL) order_line_product_orphans;
```

### Tenant → invoice → payment → provider/reconciliation/journal

```sql
SELECT
 (SELECT COUNT(*) FROM billing_invoices i LEFT JOIN tenants t ON t.id=i.tenant_id WHERE t.id IS NULL) invoice_tenant_orphans,
 (SELECT COUNT(*) FROM billing_payment_intents p LEFT JOIN tenants t ON t.id=p.tenant_id WHERE t.id IS NULL) payment_tenant_orphans,
 (SELECT COUNT(*) FROM billing_payment_intents p LEFT JOIN billing_invoices i ON i.id=p.invoice_id WHERE p.invoice_id IS NOT NULL AND i.id IS NULL) payment_invoice_orphans,
 (SELECT COUNT(*) FROM billing_reconciliation_items r LEFT JOIN billing_reconciliation_batches b ON b.id=r.batch_id WHERE b.id IS NULL) reconciliation_batch_orphans,
 (SELECT COUNT(*) FROM billing_reconciliation_items r LEFT JOIN billing_payment_intents p ON p.id=r.payment_intent_id WHERE r.payment_intent_id IS NOT NULL AND p.id IS NULL) reconciliation_payment_orphans,
 (SELECT COUNT(*) FROM accounting_journal_lines l LEFT JOIN accounting_journals j ON j.id=l.journal_id WHERE j.id IS NULL) journal_line_orphans;
```

Order-to-invoice, invoice-to-charge, settlement-to-reconciliation, and journal-to-source references may live in JSON or may not exist. After schema discovery, inspect only presence/counts of approved JSON keys, for example:

```sql
SELECT
  COUNT(*) invoice_rows,
  SUM(JSON_EXTRACT(payload_json, '$.orderId') IS NOT NULL) with_order_reference,
  SUM(JSON_EXTRACT(payload_json, '$.lines') IS NOT NULL) with_lines,
  SUM(JSON_EXTRACT(payload_json, '$.tax') IS NOT NULL) with_tax_field
FROM billing_invoices;
```

Do not select the JSON itself. Repeat using only keys confirmed by code/schema and do not assume that a key value is a valid foreign key. For each discovered allocation/settlement table, add orphan counts using its actual column names.

## E. Financial integrity

### Invoice balances and accounts receivable

```sql
SELECT currency, status, COUNT(*) invoices,
       SUM(total) gross_total, SUM(paid) paid_total,
       SUM(total-paid) balance_total,
       SUM(total < 0 OR paid < 0 OR paid > total) invalid_balance_rows
FROM billing_invoices
GROUP BY currency, status;

SELECT currency,
       SUM(CASE WHEN status IN ('issued','partial','overdue') THEN total-paid ELSE 0 END) outstanding_ar,
       SUM(CASE WHEN status IN ('issued','partial','overdue') AND due_at < CURRENT_DATE THEN total-paid ELSE 0 END) overdue_ar
FROM billing_invoices GROUP BY currency;
```

Confirm real status vocabulary before relying on the status filter. Reconcile invoice `paid` fields to source payment/allocation records; do not treat status totals alone as proof of cash application.

### Payment/capture and allocation totals

```sql
SELECT provider, currency, status, COUNT(*) intents,
       SUM(amount) requested, SUM(captured_amount) captured, SUM(fee_amount) recorded_fees
FROM billing_payment_intents GROUP BY provider, currency, status;
```

If a payment allocation table is discovered, first record its exact columns/constraints, then use the applicable template (replace names only after metadata review):

```sql
-- Template only; do not run until the actual table and column names are verified.
SELECT currency, COUNT(*) allocation_rows, SUM(amount) allocated_amount
FROM <verified_allocation_table>
GROUP BY currency;

-- Payment over-allocation: allocated sum greater than captured amount.
SELECT COUNT(*) over_allocated_payments
FROM (
  SELECT p.id
  FROM billing_payment_intents p
  JOIN <verified_allocation_table> a ON a.<payment_fk> = p.id
  WHERE a.<active_or_posted_predicate>
  GROUP BY p.id, p.captured_amount
  HAVING SUM(a.<allocation_amount>) > p.captured_amount + 0.000001
) x;

-- Invoice over-allocation: applied sum greater than collectible balance.
SELECT COUNT(*) over_allocated_invoices
FROM (
  SELECT i.id
  FROM billing_invoices i
  JOIN <verified_allocation_table> a ON a.<invoice_fk> = i.id
  WHERE a.<active_or_posted_predicate>
  GROUP BY i.id, i.total
  HAVING SUM(a.<allocation_amount>) > i.total + 0.000001
) x;
```

For unapplied cash, count captured payments with no active allocation. For partial payment, count invoices whose sum of active allocations is greater than zero and less than invoice collectible total. For a one-to-many/many-to-one capability assessment, group by payment and invoice and count groups with more than one distinct linked counterpart. Do not substitute `payment_intents.invoice_id` for allocation history.

### Refunds, reconciliation and settlement

```sql
SELECT provider, currency, status, COUNT(*) refunds, SUM(amount) refund_amount
FROM billing_refunds GROUP BY provider, currency, status;

SELECT currency, COUNT(*) batches, SUM(gross_total) gross, SUM(fees_total) fees,
       SUM(net_total) net, SUM(gross_total-fees_total-net_total) gross_fee_net_delta
FROM billing_reconciliation_batches GROUP BY currency;

SELECT currency, COUNT(*) items,
       SUM(gross_amount) gross, SUM(fee_amount) fees, SUM(net_amount) net,
       SUM(gross_amount-fee_amount-net_amount) item_delta
FROM billing_reconciliation_items GROUP BY currency;

SELECT j.currency, COUNT(DISTINCT j.id) journals,
       SUM(l.debit) debits, SUM(l.credit) credits, SUM(l.debit-l.credit) net_imbalance
FROM accounting_journals j
JOIN accounting_journal_lines l ON l.journal_id=j.id
GROUP BY j.currency;

SELECT COUNT(*) unbalanced_journal_count
FROM (
  SELECT j.id
  FROM accounting_journals j
  JOIN accounting_journal_lines l ON l.journal_id=j.id
  GROUP BY j.id
  HAVING ABS(SUM(l.debit)-SUM(l.credit)) > 0.000001
) x;
```

The final query returns only an aggregate count. If operators need to investigate individual exceptions, use the restricted finance workflow and share only a stable hash/reference approved by the data owner. For a discovered settlement master table, report count/status/provider/currency/gross/fees/net and orphan links without selecting payout account details.

Provider clearing balances should be derived from approved account codes in the production chart of accounts, grouped by currency and account code/name class. Confirm account mappings with Finance; do not hard-code account meanings based only on local demo journals.

## F. Data-quality checks

### Duplicates

```sql
SELECT COUNT(*) duplicate_provider_event_keys
FROM (
  SELECT event_id FROM payment_provider_events GROUP BY event_id HAVING COUNT(*) > 1
) d;

SELECT provider, COUNT(*) duplicate_provider_references
FROM (
  SELECT provider, provider_reference
  FROM billing_payment_intents
  WHERE provider_reference IS NOT NULL AND provider_reference <> ''
  GROUP BY provider, provider_reference
  HAVING COUNT(*) > 1
) d
GROUP BY provider;

SELECT provider, COUNT(*) duplicate_external_transaction_ids
FROM (
  SELECT provider, external_reference
  FROM billing_payment_intents
  WHERE external_reference IS NOT NULL AND external_reference <> ''
  GROUP BY provider, external_reference
  HAVING COUNT(*) > 1
) d
GROUP BY provider;

SELECT COUNT(*) duplicate_invoice_numbers
FROM (
  SELECT invoice_number FROM billing_invoices GROUP BY invoice_number HAVING COUNT(*) > 1
) d;

SELECT COUNT(*) duplicate_schedules
FROM (
  SELECT tenant_id, schedule_type, cadence, COUNT(*) n
  FROM billing_schedules
  WHERE status='active'
  GROUP BY tenant_id, schedule_type, cadence
  HAVING COUNT(*) > 1
) d;
```

If event ID is a primary key, the duplicate count must be zero by constraint; still record that constraint and check provider-specific external IDs in payload only if a verified typed field exists. Do not parse or export raw webhook payloads.

### Settlement, currency and lifecycle anomalies

```sql
SELECT COUNT(*) batch_total_mismatches
FROM billing_reconciliation_batches
WHERE ABS(gross_total-fees_total-net_total) > 0.000001;

SELECT COUNT(*) item_total_mismatches
FROM billing_reconciliation_items
WHERE ABS(gross_amount-fee_amount-net_amount) > 0.000001;

SELECT COUNT(*) payment_reconciliation_currency_mismatches
FROM billing_reconciliation_items r
JOIN billing_payment_intents p ON p.id=r.payment_intent_id
WHERE r.currency <> p.currency;

SELECT COUNT(*) invoice_payment_currency_mismatches
FROM billing_payment_intents p
JOIN billing_invoices i ON i.id=p.invoice_id
WHERE p.currency <> i.currency;

SELECT COUNT(*) payment_capture_gross_mismatches
FROM billing_reconciliation_items r
JOIN billing_payment_intents p ON p.id=r.payment_intent_id
WHERE ABS(r.gross_amount-p.captured_amount) > 0.000001;

SELECT COUNT(*) intents_without_invoice
FROM billing_payment_intents WHERE invoice_id IS NULL;

SELECT COUNT(*) invoices_with_multiple_captured_intents
FROM (
  SELECT invoice_id
  FROM billing_payment_intents
  WHERE invoice_id IS NOT NULL AND status IN ('succeeded','captured')
  GROUP BY invoice_id HAVING COUNT(*) > 1
) x;

SELECT COUNT(*) partially_paid_invoices_by_capture
FROM (
  SELECT i.id, i.total, SUM(p.captured_amount) captured_sum
  FROM billing_invoices i
  JOIN billing_payment_intents p ON p.invoice_id=i.id
  WHERE p.status IN ('succeeded','captured')
  GROUP BY i.id, i.total
  HAVING SUM(p.captured_amount) > 0.000001
     AND SUM(p.captured_amount) < i.total-0.000001
) x;

SELECT COUNT(*) refund_amount_exceeds_captured_payment
FROM (
  SELECT p.id
  FROM billing_payment_intents p
  JOIN billing_refunds r ON r.payment_intent_id=p.id
  WHERE r.status IN ('succeeded','completed')
  GROUP BY p.id, p.captured_amount
  HAVING SUM(r.amount) > p.captured_amount+0.000001
) x;

SELECT status, COUNT(*) rows,
       SUM(status='paid' AND paid < total-0.000001) paid_but_open,
       SUM(status IN ('draft','issued','overdue') AND paid >= total-0.000001) open_but_fully_paid,
       SUM(status='void' AND paid > 0.000001) void_with_payment
FROM billing_invoices GROUP BY status;
```

For allocations, compare allocation currency to both payment and invoice currency, and compare all posted allocation totals to captured payment and collectible invoice amounts. For refunds, confirm refund currency equals source payment/invoice currency and total successful refunds do not exceed captured/allocated cash. For settlements, compare each matched item to payment gross, fees and net, and report items marked settled without an associated settlement/journal reference.

## G. Payment behavior evidence

Use the schema constraints and production aggregates together; do not infer capability from a UI label.

1. Inspect whether a verified allocation table exists and whether its unique/index constraints allow multiple rows per payment and per invoice.
2. Count captured intents with a direct `invoice_id`, intents with no invoice, invoices with 0/1/>1 captured intents, and payments/invoices with 0/1/>1 allocation rows.
3. Report counts for invoices with partial allocated amount, payments with remaining unapplied captured amount, and payments over-allocated; use Section E allocation templates.
4. Report successful/failed/reversed/refunded intent and refund counts by provider/currency/status. Determine whether reversals are separate records/events or overwritten statuses by inspecting code and schema, not only current state.
5. Report payment intents with provider events, reconciliation items, settlement references and journals by count. Never publish provider reference strings.
6. Confirm the implemented API/service path in the production release: capture updates invoice balances directly in the observed code; the presence of one invoice pointer does not establish partial or multi-invoice support.

## H. Provider evidence

Use the Section C provider/status summaries for `billing_payment_intents`, `payment_provider_events`, `payment_webhook_logs`, `billing_refunds`, and reconciliation batches. Report provider names (Stripe, PayFast, iKhokha, other), counts, statuses, currencies, oldest/newest times, and whether source rows are marked test/demo if a typed flag exists. Do not output provider event IDs, merchant IDs, credentials, signatures, callback bodies, checkout URLs, card metadata, or raw JSON.

Separate **configured provider**, **event received**, **payment captured**, **refund completed**, and **settlement reconciled** counts. A provider utility in source or configured secret does not prove a production transaction. Do not create a test charge or refund for this evidence exercise.

## I. Recurring billing evidence

Run aggregate counts and dates for licenses (`license_status`, `payment_status`, renewal date), billing schedules (`schedule_type`, `status`, `next_run_at`), recurring order lines (`recurring`, `active`, `last_invoiced_period`), and invoices grouped by source/type where a typed field exists. For license dates:

```sql
SELECT license_status, payment_status, currency, COUNT(*) rows,
       MIN(renewal_date) earliest_renewal, MAX(renewal_date) latest_renewal
FROM tenant_licenses GROUP BY license_status, payment_status, currency;

SELECT schedule_type, status, currency, COUNT(*) rows,
       MIN(next_run_at) earliest_run, MAX(next_run_at) latest_run
FROM billing_schedules GROUP BY schedule_type, status, currency;

SELECT recurring, active, currency, COUNT(*) rows,
       MIN(last_invoiced_period) earliest_invoiced_period,
       MAX(last_invoiced_period) latest_invoiced_period
FROM billing_order_lines GROUP BY recurring, active, currency;
```

Database rows alone cannot show which external scheduler invokes the endpoint. Request the production deployment owner to confirm, from scheduler/cron/orchestrator configuration, whether `/api/v1/billing/cycles/run` is invoked, its cadence, service identity, retry policy and logs. Report configuration facts and aggregate success/failure counts only. Also confirm whether Stripe-managed subscriptions renew externally and whether verified webhook events update local licenses/invoices. No live provider actions are part of this procedure.

## J. Usage and rating evidence

```sql
SELECT status, COUNT(*) usage_rows, MIN(occurred_at) oldest, MAX(occurred_at) newest,
       SUM(input_tokens) input_tokens, SUM(output_tokens) output_tokens,
       SUM(amount_usd) recorded_amount_usd
FROM tenant_key_usage GROUP BY status;

SELECT COUNT(*) usage_rows,
       COUNT(DISTINCT tenant_id) tenant_count,
       COUNT(DISTINCT application_id) application_count,
       COUNT(DISTINCT api_key_id) api_key_count,
       COUNT(DISTINCT model_id) model_count
FROM tenant_key_usage;

SELECT currency, license_status, payment_status, COUNT(*) licenses,
       SUM(current_accrued_bill_usd) accrued_usd,
       SUM(current_transaction_count) recorded_transactions
FROM tenant_licenses GROUP BY currency, license_status, payment_status;
```

Use schema metadata to determine whether usage event IDs are unique, whether any charge/rating tables exist, and whether their records reference usage IDs, price versions, invoice IDs, tenant/application/key and model/provider. Report counts of each link present/missing. Do not export prompts, completions, API key prefixes, key hashes, model request payloads, or per-customer spend. Confirm with the application owner which path is authoritative: API request → authenticated key → usage row → quota/overage calculation → invoice/charge. Compare database event counts to provider/system aggregate logs without exposing payloads. Identify whether `amount_usd` is a recorded estimate or a settled billable charge; do not treat it as invoiceable without source evidence.

## K. Multi-currency evidence

Use grouped summaries from invoices, products, orders, licenses, payment intents, refunds, reconciliation, journals and settlements. Then:

```sql
SELECT currency, COUNT(*) rows, MIN(as_of) oldest_rate, MAX(as_of) newest_rate
FROM billing_fx_rate_history GROUP BY currency;

SELECT currency, COUNT(*) rows, MIN(as_of) oldest_rate, MAX(as_of) newest_rate
FROM billing_fx_rates GROUP BY currency;

SELECT accounting_currency, default_display_currency, rate_stale_after_hours
FROM platform_currency_settings;
```

Report currency totals grouped by each document/ledger and provider. Establish whether records contain a typed FX rate-history reference, transaction currency, settlement currency, accounting currency, rounding rule and realized FX journal source. If not, report `not represented` rather than calculating historical values from today's rate. Never sum different currencies together.

## L. Tax evidence

Use Section B's table discovery for names containing `tax`, and inspect only schema metadata. If invoice tax is inside JSON, report presence/counts and safe aggregate tax sums only after the production data owner confirms the JSON key names and meaning:

```sql
-- Example for the known legacy invoice payload key; verify in the deployed version first.
SELECT currency, COUNT(*) invoices,
       SUM(JSON_EXTRACT(payload_json, '$.tax') IS NOT NULL) invoices_with_tax_field,
       SUM(COALESCE(JSON_EXTRACT(payload_json, '$.tax'), 0)) recorded_tax_amount
FROM billing_invoices GROUP BY currency;
```

Do not select legal names, tax registration values, address fields, invoice payloads, or customer exemption evidence. Report counts by tax code/jurisdiction/rate only if typed tables/columns actually exist. Ask the tax/finance owner to confirm inclusive/exclusive treatment, exemption, reverse charge and jurisdiction from approved policy records; do not infer them from a nonzero invoice `tax` field.

## M. API ownership, audit and security evidence

### Deployed API and relationship map

Use the exact deployed source commit/artifact established in Section A. Inspect the source read-only in an approved development/source environment, not by changing or shelling into the production server. For a Git checkout containing the deployed commit:

```sh
git grep -n -E "app\\.(get|post|put|patch|delete)|router\\.(get|post|put|patch|delete)" <DEPLOYED_COMMIT> -- server.ts src/routes docs/openapi.yaml
```

For each relevant deployed endpoint, record a redacted row with: route and method; source file/handler; authentication middleware; role/tenant/object-scope checks; tables read/written; service/helper called; matching OpenAPI operation; and whether another route performs the same business operation. Focus on customer/tenant, organisation, application/key, licensing, products/orders, invoice/payment/refund, reconciliation/settlement/accounting, usage/FinOps, portal, and audit routes. Do not copy request/response examples containing business data or credentials. Mark code-derived linkage separately from observed database linkage.

If approved API telemetry is available, request aggregate request counts by route template, response class, and time window, plus authorization-denial counts. Exclude raw URLs with IDs, query strings, request/response bodies, IPs, user agents, emails, tokens, and low-count tenant breakdowns. Telemetry establishes endpoint activity only; it does not establish a correct financial relationship or successful provider transaction.

### Audit/IAM/security aggregate checks

Confirm actual columns in Section B before running. The following use only aggregate/grouped fields from the repository's current schema; do not select email, user/session IDs, IPs, user agents, token values/hashes, MFA secrets, backup codes, or audit JSON payloads.

```sql
SELECT COUNT(*) audit_rows,
       MIN(`timestamp`) oldest_event, MAX(`timestamp`) newest_event,
       COUNT(DISTINCT tenant_id) tenant_scopes,
       SUM(tenant_id IS NULL) global_scope_rows
FROM audit_logs;

SELECT severity, category, COUNT(*) rows,
       MIN(`timestamp`) oldest_event, MAX(`timestamp`) newest_event
FROM audit_logs
GROUP BY severity, category;

SELECT status, COUNT(*) users,
       SUM(mfa_enabled=TRUE) mfa_enabled_users,
       SUM(mfa_enforced=TRUE) mfa_enforced_users,
       SUM(tenant_id IS NULL) global_users
FROM iam_users GROUP BY status;

SELECT role_code, COUNT(*) role_assignments
FROM iam_user_roles ur
JOIN iam_roles r ON r.id=ur.role_id
GROUP BY role_code;

SELECT is_active, COUNT(*) sessions,
       SUM(expires_at < CURRENT_TIMESTAMP) expired_sessions
FROM iam_user_sessions GROUP BY is_active;

SELECT mfa_type, is_verified, COUNT(*) credential_rows
FROM iam_mfa_credentials GROUP BY mfa_type, is_verified;

SELECT outcome, COUNT(*) login_events,
       MIN(created_at) oldest_event, MAX(created_at) newest_event
FROM iam_login_events GROUP BY outcome;
```

Before sharing grouped audit categories or role codes, confirm they are controlled enumerations; if free-form, replace the output values with an approved allowlist or report aggregate totals only. These queries establish stored counts and configured flags, not whether authorization is correct. Validate role and tenant/object-scope enforcement from the deployed route code above and report gaps without attempting access tests against production.

### Audit linkage and schema coverage

Use `information_schema.KEY_COLUMN_USAGE` from Section B to determine which user/tenant/object relations are enforceable by FKs. Record whether commercial writes include a stable object/source/correlation reference based on schema and deployed source inspection. Do not retrieve audit payloads. If application logs can provide immutable actor/action/object references, request aggregate counts by action type and result only; do not export raw log messages.

## N. Evidence summary template

The operator should return a redacted report containing:

- Environment label, collection UTC timestamp, deployed release/commit, runtime versions, database engine/version, and applied migration range.
- Relevant table inventory, exact row counts, status/provider/currency distributions, date ranges, constraints and FK/index summary.
- Normalized customer/organisation/legal-entity/billing-account table and relationship findings; distinguish schema absence, zero rows, inaccessible table, and not-investigated.
- Aggregate relationship/orphan counts and counts of unmatched/unallocated/unsettled/invalid records.
- Invoice/AR, payment, allocation, refund, settlement, fee and journal totals grouped by currency; no cross-currency grand total.
- Deployed API route-to-handler/table/auth map, OpenAPI parity, and safe aggregate route-activity evidence if available.
- Audit, IAM, MFA/session and tenant/object authorization evidence with no user-identifying values.
- Whether evidence is production, synthetic, demo, test, or unknown, based on typed markers and operator confirmation.
- Actual recurring source and scheduler evidence; actual usage/rating source; provider event/capture/refund/settlement counts; tax/FX structures found.
- Any query not run, unavailable table/column, permission failure, or ambiguous relationship. Do not turn missing evidence into a zero count.
- For every missing production evidence category, identify whether it is `not present in discovered schema`, `present but empty`, `not accessible`, `not queried`, or `not represented in available telemetry`. Absence of evidence is not proof that a feature is absent.
- Proposed next actions per canonical concept using the approved vocabulary: RETAIN, EXTEND, MAP, CONSOLIDATE, COMPATIBILITY FACADE, NEW TABLE REQUIRED, LEGACY READ-ONLY, DEPRECATE LATER, or GAP — DESIGN REQUIRED.

### Final transaction close

```sql
ROLLBACK;
```

The production evidence owner should review and approve the redacted findings before they are used to finalize schema design. This procedure does not authorize migrations, data repair, financial posting, or any other write operation.
