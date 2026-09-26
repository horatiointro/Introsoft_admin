# ALTIL Project Overview and Screen Guide

## What ALTIL is

ALTIL is a web-based control centre for governing AI services across multiple
customers (tenants) and applications. It brings together AI provider and model
configuration, request routing, policy controls, tenant administration,
security and compliance operations, service management, incident response, and
cost oversight.

The interface is a React application served by an Express/TypeScript API. The
API provides login and session handling, role-protected management endpoints,
AI orchestration, and repositories for database-backed records. MariaDB and
MySQL are accessed through `mysql2`; schema changes are managed in
`migrations/`.

## How to navigate

The left sidebar has 26 main destinations grouped into five areas. The header
provides the global company-to-tenant-to-application scope selector, a menu
search/directory, notifications and user actions. The activity ticker shows
cross-platform activity. Some destinations contain their own tabs, listed
below. A few older navigation IDs are aliases into these newer destinations;
they are not separate screens.

## Screens and capabilities

### Executive

| Screen | What it offers |
|---|---|
| **Executive Command Centre** | At-a-glance tenant, provider, service-health, request, spend, security, and compliance indicators. Select a tile to open its detail inspector with metric derivation, business/security impact, and associated events. Shortcuts lead to SLA monitoring and reports. |
| **5-Layer Stack Architecture** | Searchable architecture map describing the platform layers and their components, dependencies, and connections. Links from the map can take an operator to related modules. |
| **Executive & Audit Reports** | Scoped executive and audit report views using tenant/application context. Intended for oversight and reporting deliverables. |

### Tenant Management and Governance

| Screen | What it offers |
|---|---|
| **Tenant Portfolio Directory** | Search and review customer/tenant profiles, status, applications, users, contacts and governance details. Includes tenant onboarding and controls for updating tenant records, managing tenant users, connecting applications, and managing associated API keys. |
| **Organization Hierarchy** | Explore the company → tenant → application structure and select a tenant or application context for follow-on work. |
| **Tenant 360 Diagnostics** | Consolidated tenant profile for operational, service-level, AI, security, and governance signals, with navigation back to the tenant directory. |
| **Licensing & Subscriptions** | Review and manage plan templates, tenant/application licenses, billing and payment-webhook records, and licensing enforcement/self-service information. |
| **Tenant SLA & KPI Monitoring** | Compare service-level profiles and business/AI KPI measurements in the current tenant scope, including metric drilldowns. |
| **IAM Users & Access Control** | Search and manage IAM users and roles; provision, edit, reset, or offboard users; inspect sessions/tokens; and review MFA, password, and access safeguards. Available actions are subject to server-side role checks. |
| **Admin & System Settings** | Configure platform-level currency and monetary standards, default tenant onboarding/credit values, and the administrative actions shown by the application. |

### AI Infrastructure and Gateway

| Screen | What it offers |
|---|---|
| **AI Gateway & Providers** | Four related tabs: **Providers List** for provider configuration and connection tests; **Telemetry** for provider health and activity; **Model Catalog** for model records; and **Routing Rules** for capability-based provider/model selection. |
| **Applications & Gateway Keys** | Two tabs: register and maintain client applications, then create, inspect, revoke, or remove API gateway keys associated with those applications. |
| **AI Model Evaluation Lab** | Model lifecycle and governance workspace with recommendations and side-by-side benchmark/evaluation comparisons. |
| **API Playground & Threat Simulator** | Choose an application and AI capability, compose a prompt, run an orchestration request, inspect its result, and view example client snippets for cURL, Node.js, or Python. Includes presets and a traffic/compliance simulation workspace. |

### Service Operations and Incidents

| Screen | What it offers |
|---|---|
| **Services & SLA Engine** | Five tabs: **SLA Designer & Metric Profiles**, **KPI Centre**, **Service Catalogue**, **Service Desk**, and **Workflow Approvals**. These cover service targets, measures, catalogue entries, tickets, and approval rules. |
| **Incidents, PIRs & Alerts** | Incident lifecycle board, incident records, timelines, problem/post-incident review material, knowledge articles, and multi-channel alert records. The incident stages run from reported and investigating through assigned, mitigated, resolved, and closed. Selecting an incident opens its 360 diagnostic view. |
| **CMDB, Change & BCDR** | Four tabs for the configuration management database, change management, business continuity/disaster recovery (BCDR), and vendor 360 information. |
| **Workflows & Approvals** | Review configured event-triggered rules, conditions, actions, and recent trigger status for activities such as budget thresholds, SLA escalation, PII alerts, and provider failover. |

### Security, Risk and Compliance

| Screen | What it offers |
|---|---|
| **Security Ops (SOC & Alerts)** | Security operations dashboard for reviewing security posture, events, and alert-related signals. |
| **AI Guardrails & Policies** | Review, create, edit, and remove AI policies associated with applications/providers, including policy conditions and enforcement settings. |
| **Data Cloaking & Vault (DCR)** | Data Cloaking and Reconstruction workspace: test prompt transformations, inspect surrogate/token records, review transformation policies, and inspect the provenance/event ledger. |
| **Risk Register & 5×5 Heatmap** | Enterprise risk register and probability-versus-impact heatmap, with security posture and control summaries. |
| **POPIA & GDPR Suite** | Five tabs: **Enforcement** for processing outcomes and guardrail actions; **Scanner** for data/privacy scanning; **Sovereignty** for data-location context; **DSAR** for data-subject access requests; and **Device Trust** for device-related controls. |
| **ALTIL Trust Fabric & Identity** | Five tabs for tenant records, identities, bound devices, credentials, and a linked evidence chain. Presents identity and trust relationships across the platform. |
| **Audit Trail Ledger** | Review and search audit/usage activity, with related application, provider, and model context and a detail inspector for selected log records. |
| **FinOps & Token Economics** | Review AI spend, budgets, usage/token economics, and cost information in company or selected tenant/application scope. |

## Shared interactions

- **Scope selector:** Change the global company, tenant, or application context.
- **Tile inspectors:** Selected dashboard/SLA tiles open a detail view with metric definitions and related operational evidence.
- **Cross-module navigation:** Tenant, provider, incident, and application views include links to related workspaces.
- **Day/night theme:** The interface supports a saved light/dark appearance preference.
- **Authentication:** Login creates an application session. IAM routes and other protected APIs enforce authentication and roles on the server.

## Backend and data behavior

The API is mounted under `/api/v1` (and the frontend base path is `/admin-test/`). Main API groups include:

- `auth` and `iam`: login, sessions, users, roles, and access administration.
- `customers`, `applications`, `api-keys`: tenant and client-application administration.
- `providers`, `models`, `routes`: AI provider/model records and routing configuration.
- `policies`, `compliance`: policy and compliance configuration, including DSAR records.
- `itil`, `trust`, `dcr`: service operations, trust/identity, and data transformation features.
- `licensing`, `database`, and `overview`: commercial records, administrative database operations, and platform summaries.
- `orchestrate`: process a governed AI request from the playground/application layer.

The application is a hybrid of backend-backed behavior and a rich UI prototype.
On startup the client requests core lists/configuration from the API and falls
back to bundled initial data if requests fail. Some screens maintain their own
React state and sample records; some dashboard values are fixed or derived from
sample data. A visual “live” label or a simulation should therefore not be
treated as proof that an external provider, monitoring system, payment gateway,
or notification channel is connected in production. Confirm the data source and
integration for each operational workflow before relying on it.

In development, database outage fallback can use in-memory records. In
production, startup requires a working database and the migrated core/IAM
schema. A successful login is database-backed when the database health endpoint
reports an active connection; successful authentication sessions and IAM login
events are stored in the database.

## Main source locations

- `src/App.tsx`: application state, API loading, shared handlers, and screen dispatch.
- `src/components/Sidebar.tsx`: primary navigation and screen labels.
- `src/components/`: screen implementations and shared UI components.
- `src/routes/`: Express routers for authentication, compliance, ITIL, trust, and DCR.
- `src/db/`: MariaDB/MySQL connection, migrations, and data repositories.
- `src/data/`: initial/demo state used by the UI and in-memory repositories.
- `migrations/`: ordered database schema and seed migrations.
- `server.ts`: Express API, route registration, production static serving, and startup checks.

## Local run and database setup

```sh
npm ci
npm run dev
```

Database setup and production guidance are in
[`MARIADB_DEPLOYMENT.md`](./MARIADB_DEPLOYMENT.md). Do not commit `.env` or
database credentials.
