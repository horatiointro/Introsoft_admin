# Stage A External Production Evidence Intake

**Purpose:** Structured intake for redacted, externally collected production preflight evidence.
**Audience:** Authorized production operator and evidence reviewer.
**Scope:** Documentation checklist only. Complete this document or attach a redacted evidence report by filling one evidence record for every applicable checklist item.

## Completion instructions

- Collect evidence on the production server using the approved read-only session discipline below. Do not connect the Codex workspace to production.
- Use only the status values listed below. Do not use zero, blank, or “none” as a substitute for unknown/unqueried evidence.
- **NOT PRESENT** means the relevant schema object, relationship, or persisted row was actually queried and not found in the captured target/snapshot. It does not mean a feature is broken, never used, undeployed, or unnecessary.
- **UNQUERIED** means no query/evidence was collected. **INACCESSIBLE** means an authorized collection was attempted but access was unavailable; explain without including credentials. **AMBIGUOUS** means evidence exists but its meaning or relationship is not uniquely established.
- Report aggregate counts and currency-separated totals. Do not include row dumps, customer names, private actor details, credentials, or raw payloads.
- Record collection timestamp/timezone, environment label, query/report identifier, and operator role only where safe. Redact or pseudonymize identifiers in the shared intake if required by policy.
- For each evidence item, complete all four fields: STATUS, EVIDENCE, SOURCE, LIMITATIONS. If not collected, set STATUS to UNQUERIED and say what remains unqueried.

Allowed status values: **VERIFIED / NOT PRESENT / AMBIGUOUS / UNQUERIED / INACCESSIBLE**.

## Safety requirements

- Production evidence must be collected using the approved read-only session discipline and least-privilege read-only account.
- Use SELECT / SHOW / information_schema only.
- Do not invoke a migration runner.
- Do not run seed scripts or seed/maintenance migrations.
- Do not execute INSERT, UPDATE, DELETE, ALTER, CREATE, DROP, TRUNCATE, or any other write/DDL operation.
- Do not collect or display secrets, credentials, passwords, API keys, key hashes, tokens, private actor email addresses, raw payloads, or unnecessary PII.
- Do not export full JSON payloads. For JSON metadata, collect key names and aggregate presence/counts only, after security review of candidate key names.
- Production `@@read_only` has previously been reported as 0. Stop if read-only session discipline and operator permissions cannot be assured. Do not substitute an unrestricted session.
- If a read-only transaction is used, terminate it with ROLLBACK. Do not connect the Codex workspace directly to production.

## Commercial-identity rule

`tenant-altil-internal` must not be treated as a Customer, Organisation, Legal Entity, Billing Account, contract party, or payer merely because it is the existing technical tenant. A technical tenant/order/product reference establishes only the technical relationship actually queried. Any commercial mapping requires separate deterministic evidence identifying the commercial party/account and explicit owner approval.

## 1. Production environment

| Evidence item | STATUS | EVIDENCE | SOURCE | LIMITATIONS |
|---|---|---|---|---|
| Production database label/name (redact if required) | UNQUERIED |  |  |  |
| MariaDB distribution and exact version | UNQUERIED |  |  |  |
| Applied migration versions/range (expected 001–023) | UNQUERIED |  |  | Include applied count, min/max and version list/checksum differences if safely available. Do not invoke migration tooling. |
| Application release/commit actually serving production | UNQUERIED |  |  | Use approved deployment metadata only; omit environment variables/process command lines. |
| Production table count | UNQUERIED |  |  | State capture time and whether count includes views or only base tables. |

## 2. Live schema metadata

Collect only relevant live metadata for the Stage A table list below. Report constraint names and columns when safe; do not dump unrelated schema. Note when a relationship is application-maintained without a database FK. Distinguish live production metadata from checked-in migration definitions.

### 2.1 Required tables

tenants; tenant_applications; tenant_api_keys; tenant_licenses; licensing_plans; billing_products; billing_orders; billing_order_lines; billing_invoices; billing_payment_intents; billing_payment_methods; billing_schedules; billing_refunds; billing_reconciliation_batches; billing_reconciliation_items; accounting_journals; accounting_journal_lines; audit_logs.

### 2.2 Metadata checklist

For each table, complete a separate row. Include foreign keys to or from the listed tables, indexes, unique constraints, and nullable/non-nullable status for relevant relationship and identity columns.

| Table | STATUS | EVIDENCE (FKs, indexes, unique constraints, nullability) | SOURCE | LIMITATIONS |
|---|---|---|---|---|
| tenants | UNQUERIED |  |  |  |
| tenant_applications | UNQUERIED |  |  |  |
| tenant_api_keys | UNQUERIED |  |  | Do not include key values, hashes or secrets. |
| tenant_licenses | UNQUERIED |  |  |  |
| licensing_plans | UNQUERIED |  |  |  |
| billing_products | UNQUERIED |  |  |  |
| billing_orders | UNQUERIED |  |  |  |
| billing_order_lines | UNQUERIED |  |  |  |
| billing_invoices | UNQUERIED |  |  |  |
| billing_payment_intents | UNQUERIED |  |  |  |
| billing_payment_methods | UNQUERIED |  |  | Do not expose provider tokens. |
| billing_schedules | UNQUERIED |  |  | Do not expose consent text if it contains personal information. |
| billing_refunds | UNQUERIED |  |  | Omit requester identity/PII. |
| billing_reconciliation_batches | UNQUERIED |  |  |  |
| billing_reconciliation_items | UNQUERIED |  |  | Redact external references if required. |
| accounting_journals | UNQUERIED |  |  | Aggregate/metadata only. |
| accounting_journal_lines | UNQUERIED |  |  | Aggregate/metadata only. |
| audit_logs | UNQUERIED |  |  | Do not return event payloads, emails or IP addresses. |

## 3. Actual technical relationship verification

For each relationship, report matched rows, orphan rows, and duplicate/ambiguous rows where meaningful. Include aggregate query/report source and capture time. Counts on each side alone do not prove a relationship.

| Relationship | STATUS | EVIDENCE (matched/orphan/duplicate or ambiguity counts) | SOURCE | LIMITATIONS |
|---|---|---|---|---|
| tenant → application | UNQUERIED |  |  |  |
| application → API key | UNQUERIED |  |  | Never include API key values/hashes. |
| tenant → API key | UNQUERIED |  |  | Never include API key values/hashes. |
| tenant → license → licensing plan | UNQUERIED |  |  |  |
| order → tenant | UNQUERIED |  |  | Technical scope does not establish commercial owner. |
| order line → order | UNQUERIED |  |  |  |
| order line → tenant | UNQUERIED |  |  |  |
| order line → product | UNQUERIED |  |  |  |

## 4. Aggregate integrity checks

Report counts for the captured snapshot only. If a query was not run, retain UNQUERIED; do not enter zero. Explain how duplicates/ambiguity were defined.

| Check | STATUS | EVIDENCE (aggregate count and definition) | SOURCE | LIMITATIONS |
|---|---|---|---|---|
| Orphan applications | UNQUERIED |  |  |  |
| Orphan API keys by tenant/application | UNQUERIED |  |  | No key material. |
| Orphan licenses by tenant/plan | UNQUERIED |  |  |  |
| Orphan order tenant references | UNQUERIED |  |  |  |
| Orphan order-line order references | UNQUERIED |  |  |  |
| Orphan order-line tenant references | UNQUERIED |  |  |  |
| Orphan order-line product references | UNQUERIED |  |  |  |
| Tenant/order duplicate or ambiguous relationships | UNQUERIED |  |  | Do not infer legal ownership. |
| Duplicate order source/source_reference values | UNQUERIED |  |  | Report uniqueness scope. |
| Other relevant duplicate technical identifiers | UNQUERIED |  |  | State key and detection scope. |

## 5. Commercial-party discovery

Search live information_schema table/column names and safe schema metadata for candidate structures. Report aggregate row counts only when appropriate. A name-like or metadata field is not proof of legal identity. Do not include customer/person names or registration values.

| Candidate concept | STATUS | EVIDENCE (candidate table/column and aggregate presence/count) | SOURCE | LIMITATIONS / owner evidence needed |
|---|---|---|---|---|
| Customer | UNQUERIED |  |  | Explain why candidate is or is not authoritative. |
| Organisation / hierarchy | UNQUERIED |  |  |  |
| Legal entity / registered issuer | UNQUERIED |  |  | Do not disclose registration numbers. |
| Billing account / account number | UNQUERIED |  |  | Do not disclose raw account identifiers. |
| CRM/customer external identifiers | UNQUERIED |  |  | Report key/field presence, not raw values. |
| Legal/company registration identifier fields | UNQUERIED |  |  | Report field presence/count only. |
| Bill-to identity or account mapping | UNQUERIED |  |  |  |
| Technical tenant/customer mapping | UNQUERIED |  |  | Explicitly state whether mapping is enforced, documented, or inferred. |
| Other equivalent existing structures | UNQUERIED |  |  | Include source/provenance and owner evidence requirement. |

## 6. JSON metadata key presence

Inspect JSON keys only. Report aggregate key presence/counts and, if established, intended source/meaning. Do not collect or display values, names, emails, API keys, hashes, tokens, credentials, raw payloads, or unnecessary PII. Key presence is not authority for legal identity.

| JSON field | STATUS | EVIDENCE (key names and presence/counts only) | SOURCE | LIMITATIONS / authority assessment |
|---|---|---|---|---|
| tenants.metadata_json | UNQUERIED |  |  | No values. Tenant metadata is not automatically legal identity. |
| tenant_applications.metadata_json | UNQUERIED |  |  | No values. |
| tenant_api_keys.metadata_json | UNQUERIED |  |  | No values or credential-derived fields. |
| billing_orders.payload_json | UNQUERIED |  |  | No raw payload; tenant reference is not proof of commercial party. |
| billing_order_lines.payload_json | UNQUERIED |  |  | No raw payload. |
| billing_products.payload_json | UNQUERIED |  |  | Catalogue metadata is not customer identity. |
| Other relevant party/account JSON fields discovered | UNQUERIED |  |  | Identify key only; no raw values. |

## 7. Audit capability

Report live production audit_logs schema and whether the stored structure/source supports each requirement. Do not include audit row contents or personal identifiers.

| Capability | STATUS | EVIDENCE | SOURCE | LIMITATIONS |
|---|---|---|---|---|
| Production audit_logs schema, indexes and nullability | UNQUERIED |  |  |  |
| Actor/service identity | UNQUERIED |  |  | Report field capability, not actor value. |
| Tenant scope | UNQUERIED |  |  |  |
| Before/after values | UNQUERIED |  |  | State whether explicit fields or safe structured payload fields. |
| Change reason | UNQUERIED |  |  |  |
| Correlation/request ID | UNQUERIED |  |  |  |
| Timestamp | UNQUERIED |  |  |  |
| Outcome/result | UNQUERIED |  |  |  |
| Overall support for commercial mapping audit | UNQUERIED |  |  | Identify gaps; do not modify audit schema/records. |

## 8. Financial baseline

Provide aggregate row counts and, where applicable, totals grouped by currency. Never add unlike currencies into one total. Avoid row-level references and unnecessary transaction details.

| Object | STATUS | EVIDENCE (count; aggregate amounts by currency where applicable) | SOURCE | LIMITATIONS |
|---|---|---|---|---|
| billing_orders | UNQUERIED |  |  |  |
| billing_order_lines | UNQUERIED |  |  |  |
| billing_invoices | UNQUERIED |  |  |  |
| billing_payment_intents | UNQUERIED |  |  |  |
| billing_refunds | UNQUERIED |  |  |  |
| billing_reconciliation_batches | UNQUERIED |  |  |  |
| billing_reconciliation_items | UNQUERIED |  |  |  |
| accounting_journals | UNQUERIED |  |  |  |
| accounting_journal_lines | UNQUERIED |  |  |  |

## 9. Evidence classification summary

| Requested evidence group | STATUS | EVIDENCE | SOURCE | LIMITATIONS |
|---|---|---|---|---|
| Production environment | UNQUERIED |  |  |  |
| Live schema metadata | UNQUERIED |  |  |  |
| Technical relationships | UNQUERIED |  |  |  |
| Aggregate integrity/orphan/duplicate checks | UNQUERIED |  |  |  |
| Commercial-party discovery | UNQUERIED |  |  |  |
| JSON metadata key presence | UNQUERIED |  |  |  |
| Audit capability | UNQUERIED |  |  |  |
| Financial baseline | UNQUERIED |  |  |  |

## 10. Intake boundary

This intake document does not authorize any schema, migration, application, API, UI, data, or production change.
