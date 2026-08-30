# ALTIL Secure AI — Implementation Baseline & Reality Assessment

**Document Version:** 1.0.0  
**Audit Date:** 2026-08-30  
**Environment:** Linux / Node.js 22 LTS / Express 4 / React 19 / MariaDB 10.11.18  
**Classification:** Internal Architectural & Engineering Document

---

## 1. Executive Summary

This document establishes the official implementation baseline for the **ALTIL Secure AI Control Centre & Orchestration Gateway**. It details the exact technical state of every functional module, distinguishing between:
* **LIVE / DATABASE-BACKED:** Persisted in MariaDB 10.11.18 and retrieved via server API.
* **LIVE / API-BACKED:** Real server-side logic (e.g. Gemini 3.7 Flash API proxy, statutory Luhn sanitization).
* **CALCULATED / DERIVED:** Computed dynamically from live state, targets, and formulas.
* **DEMO / SYNTHETIC:** In-memory or simulated data retained for testing and UX verification.
* **NOT IMPLEMENTED:** Planned architectural capabilities not yet realized in code.

---

## 2. Module-by-Module Technical Audit Matrix

| Major Function / Screen | Current Implementation | Tier (FE/BE/DB) | Data Provenance | API Endpoint(s) | Database Entity | Security & RBAC Status | Production Readiness | Required Changes for Enterprise Grade |
|---|---|---|---|---|---|---|---|---|
| **Executive Command Centre** | React dashboard with KPI cards, latency histograms, and alert ticker | Full-Stack | Hybrid (API + Seed DB) | `GET /api/v1/overview`<br>`GET /api/v1/health` | `ai_providers`<br>`ai_models`<br>`audit_logs` | Tenant filter scoped; unauthenticated access allowed if DB offline | 🟡 PARTIAL | Connect real-time MariaDB token aggregation query |
| **Tenant Directory & Onboarding** | CRUD table + Onboarding Modal (`CustomersView.tsx`) | Full-Stack | **LIVE / DB-BACKED** | `GET /api/v1/customers`<br>`POST /api/v1/customers`<br>`PUT /api/v1/customers/:id`<br>`DELETE /api/v1/customers/:id` | `tenants`<br>`tenant_applications` | Client-side role gating; needs server-side `requireRole('Super Admin')` | ✅ VERIFIED | Add strict server-side middleware and tenant isolation query wrappers |
| **Tenant 360 Diagnostics** | Multi-tab deep-dive with radar comparison & historical charts (`Tenant360View.tsx`) | Full-Stack | Hybrid (DB Profile + Derived Curves) | `GET /api/v1/customers/:id`<br>`GET /api/v1/licensing/tenant-licenses` | `tenants`<br>`tenant_licenses`<br>`service_sla_targets` | Tenant-scoped; needs server-side tenant validation | 🟡 PARTIAL | Replace `generateTenantUptimeData` with `sla_measurements` table data |
| **IAM Users, Roles & Offboarding** | User list, role manager, MFA enforcement & offboarding checklist (`IamAdminView.tsx`) | Full-Stack (In-Memory Auth) | **DEMO / SYNTHETIC** (In-Memory) | `GET /api/v1/users`<br>`POST /api/v1/users`<br>`DELETE /api/v1/users/:id` | `iam_users` (Target)<br>`iam_roles` (Target) | Client-side role visibility only | 🔴 NOT PERSISTENT | Migrate users/roles/sessions to MariaDB with `bcryptjs` password hashing |
| **Single Sign-On Login Portal** | SSO form with email, password, MFA token & quick-role switchers (`LoginScreen.tsx`) | Frontend (Simulated Session) | **DEMO / SIMULATED** | `POST /api/v1/auth/login` (Target) | `iam_user_sessions` (Target) | No server session validation | 🔴 SIMULATED | Implement real `/api/v1/auth/login` with JWT/HTTP-only cookies & session revocation |
| **FIPS Security Splash Screen** | 1.5s animated boot sequence verifying HSM, policies, and ledger (`SplashScreen.tsx`) | Frontend Animation | **SIMULATED** | Client timer | N/A | N/A | ✅ VERIFIED UX | Connect boot sequence steps to live `/api/v1/health/ready` check |
| **Commercial Licensing & FinOps** | Subscription tiers, grace period engine, webhooks (`LicensingMonetizationView.tsx`) | Full-Stack | **LIVE / DB-BACKED** | `GET /api/v1/licensing/plans`<br>`POST /api/v1/licensing/plans`<br>`POST /api/v1/licensing/payment-webhook` | `licensing_plans`<br>`tenant_licenses`<br>`payment_webhook_logs` | Server verifies license on gateway dispatch (`402 Hard Block`) | ✅ VERIFIED | Add webhook signature verification (HMAC SHA-256) |
| **SLA & KPI Scorecards** | Contractual targets, latency profile, penalty rebate ledger (`SlaKpiMonitoringView.tsx`) | Full-Stack | **CALCULATED / DERIVED** | `GET /api/v1/sla/targets`<br>`POST /api/v1/sla/credit` | `service_sla_targets`<br>`sla_measurements` (Target) | Server-side penalty formula | 🟡 PARTIAL | Store daily availability measurements in `sla_measurements` |
| **AI Gateway & Orchestration** | 7-Step provider dispatch pipeline, fallback & redaction (`/api/v1/orchestrate`) | Full-Stack | **LIVE / API-BACKED** | `POST /api/v1/orchestrate`<br>`POST /api/v1/providers/test` | `ai_capability_routing`<br>`ai_providers`<br>`ai_models`<br>`audit_logs` | Verifies tenant status & guardrails before dispatch | ✅ VERIFIED | Add token-level API key signature verification & tenant scope checks |
| **Statutory Compliance (POPIA/GDPR)** | Luhn SA ID check, PII/PHI redaction, DSR tracker (`PopiaGdprComplianceView.tsx`) | Full-Stack | **LIVE / API-BACKED** (DSR in memory) | `GET /api/v1/compliance/config`<br>`GET /api/v1/compliance/dsr`<br>`POST /api/v1/compliance/dsr` | `security_guardrails`<br>`compliance_dsar_requests` (Target) | Cryptographic SHA-256 redaction | 🟡 PARTIAL | Persist DSR requests in `compliance_dsar_requests` MariaDB table |
| **Incident CRM & ITIL NOC** | P1/P2/P3/P4 lifecycle, diagnostic modal with Gemini RAG runbook (`IncidentCrmView.tsx`) | Full-Stack (In-Memory Incidents) | **DEMO / SYNTHETIC** (In-Memory) | `GET /api/v1/incidents`<br>`POST /api/v1/incidents`<br>`POST /api/v1/rag/incident-diagnostics` | `operations_incidents` (Target)<br>`incident_events` (Target) | Server executes Gemini 3.7 Flash diagnostic with local fallback | 🟡 PARTIAL | Persist incident lifecycle records and event timelines in MariaDB |
| **CMDB Dependency Topology** | Visual graph of Tenant &rarr; App &rarr; Gateway &rarr; Policy &rarr; Provider &rarr; Model | Frontend Dynamic | **DERIVED / DYNAMIC** | `GET /api/v1/cmdb/topology` (Target) | `cmdb_items` (Target)<br>`cmdb_dependencies` (Target) | N/A | 🟡 PARTIAL | Persist CI nodes and dependencies in MariaDB; compute blast radius in SQL |
| **FinOps Cost & Metering** | Daily/monthly token volume, currency conversion, cost per 1k input/output | Full-Stack | **CALCULATED / SEED** | `GET /api/v1/finops/summary` | `financial_monthly_snapshots`<br>`audit_logs` | Scoped to tenant | 🟡 PARTIAL | Aggregate live token usage from `audit_logs` directly into snapshots |

---

## 3. Database Schema Baseline

### Current Tables (12 Active in MariaDB):
1. `tenants`
2. `tenant_applications`
3. `licensing_plans`
4. `tenant_licenses`
5. `ai_providers`
6. `ai_models`
7. `ai_capability_routing`
8. `service_sla_targets`
9. `security_guardrails`
10. `audit_logs`
11. `payment_webhook_logs`
12. `financial_monthly_snapshots`

### Required Phase 1 Target Schema Extensions:
* **Migration Tracker:** `schema_migrations`
* **IAM & Authentication:** `iam_users`, `iam_roles`, `iam_permissions`, `iam_user_roles`, `iam_role_permissions`, `iam_user_sessions`, `iam_mfa_credentials`, `iam_login_events`, `iam_password_reset_tokens`
* **Operations & ITIL:** `operations_incidents`, `incident_events`, `incident_assignments`, `operations_problems`, `change_requests`, `post_incident_reviews`
* **CMDB:** `cmdb_item_types`, `cmdb_items`, `cmdb_dependencies`
* **Compliance & DSR:** `compliance_dsar_requests`, `compliance_breach_events`
* **SLA & KPI Telemetry:** `sla_profiles`, `sla_measurements`, `sla_breaches`, `kpi_measurements`

---

## 4. Phase 1A Action Items
1. Build robust migration engine (`migrations/` directory + runner script + `schema_migrations` table).
2. Create migration `001_initial_schema.sql` to snapshot existing 12 baseline tables.
3. Create migration `002_iam_auth.sql` to provision normalized IAM tables, default roles, granular permissions, and hashed seed credentials.
4. Implement password hashing utility (`bcryptjs`), server-side authentication router (`/api/v1/auth/*`), and authorization middlewares (`requireAuthentication`, `requireRole`, `requirePermission`, `requireTenantAccess`).
5. Verify build, migration execution, and type safety.
