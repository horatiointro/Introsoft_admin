# ALTIL User and Administrator Guide

This guide describes the ALTIL capabilities and workflows currently present in
the project. Production availability still depends on configuration, provider
credentials, database migrations, tenant permissions, and finance/legal review.

## Find your way around

The sidebar is arranged as a small set of collapsible work areas:

| Work area | Use it for |
|---|---|
| Overview | Platform command centre, reports and architecture |
| Customers | Tenant directory, company tree, customer portal, plans, onboarding and communications |
| Finance | Invoices, payments, journals, settlement, refunds and AI cost |
| AI platform | Providers, models, application keys, evaluation and API playground |
| Operations | Service levels, incidents, configuration items and workflows |
| Trust & governance | Guardrails, security, privacy, risk, identity, audit and platform settings |

Use **Search navigation** to filter by screen name or common task words. Select
**Ask ALTIL** for guided help. If a search has no match, choose “Ask ALTIL to
find it”; the assistant opens with your search question. Its quick-access
buttons navigate to suggested screens. Screen Assistant answers use the help
catalog and governed AI route; it does not silently change account settings.

The global scope selector in the header focuses work on the full company, a
tenant, or an application. Check the selected scope before taking an action.

## Customer, organization, application and key structure

An ALTIL **tenant** is the individual or organization that contracts with
Introsoft/ALTIL. A corporate tenant can contain subsidiaries and customer
organizations. Registered applications can have sub-applications and
function-level scopes. Each application/function can have a distinct ALTIL API
key, usage record and guardrail.

Administrators use **Customers → Customer directory** to create/manage customer
accounts and **Organization tree** to review multi-level ownership. Customers
can use **Customer portal → Application portfolio** to add a sub-application
or function beneath an existing application and issue its scoped key. Copy a
new secret at creation; the complete key is only shown once.

## Using the AI gateway

1. Configure a provider and its secret in the provider screen or deployment
   environment. Run a provider check before enabling routes.
2. Register the tenant application and assign its key.
3. Attach applicable AI guardrails, privacy rules, request/spend caps, and
   provider/model routes.
4. Use the API Playground to inspect a governed request, then use the API
   contract at [`openapi.yaml`](./openapi.yaml) for integration.
5. Review activity under the tenant portal, FinOps and Audit Trail.

Requests pass through tenant/key authorization, budget/quota checks, applicable
privacy and safety policies, routing and provider dispatch. ALTIL can retry or
fall back among healthy, permitted routes. No aggregator can guarantee that
every request will succeed: provider outages, exhausted provider quota, network
failure, invalid credentials, policy blocks and timeouts remain possible. If
all permitted routes fail, ALTIL should report a clear failure instead of
silently bypassing guardrails.

### Model catalogue and free usage

The model catalogue is scoped to the providers ALTIL has been configured to
inspect. There is no dependable universal feed of every model “in the world”
and free eligibility varies by provider, region, account, model, date and usage
terms. Treat “free” as provider-reported/configured metadata, not a promise of
unlimited service. Verify the exact provider account’s current terms and quota.

Configured model/provider health checks can validate connectivity when
credentials and provider access are available. The current project does not
claim a complete global model sweep or an always-successful synthetic test of
every model every day. A quota-exhausted model should be excluded from routing
only when the connected provider or an operator supplies a trustworthy quota
signal; do not infer a renewed free allowance from a calendar change alone.

## Currency and billing

### What the currencies mean

- **Usage/accounting base:** USD. ALTIL's AI usage metering and platform
  reporting are based in USD.
- **Invoice/settlement currency:** The amount and currency shown on an issued
  invoice/payment/journal are the source record. Existing agreements may
  specify another currency; posted records are not rewritten when preferences
  change.
- **Display currency:** Each tenant may choose a preferred portal currency. A
  customer administrator selects it in the portal header. Rates are displayed
  as units of the selected currency per USD and include a source and timestamp.
  A conversion is an estimate for readability unless the contract/invoice
  explicitly records that conversion.

If an FX rate is missing or older than the configured freshness window, ALTIL
shows the original source currency rather than guessing. A platform
administrator maintains the rate source, rate book, default display currency,
locale and freshness window at **Trust & governance → Platform settings →
Platform & Currency Settings**. Accounting reports keep each currency separate;
do not add USD and ZAR totals together.

### Customer billing lifecycle

1. Review package, application licences, usage, payment history and open
   invoices in the Customer portal.
2. Pay an open invoice through the hosted gateway flow. A browser return URL
   does not mark an invoice paid; ALTIL reconciles a verified provider event.
3. Optionally authorize a vaulted payment method with explicit consent, then
   create a separate monthly or usage-threshold collection mandate. The
   customer can pause/cancel the schedule or revoke the token.
4. Request a refund against a captured invoice payment from the portal. Finance
   reviews the linked request and provider result.

Gateway availability differs: Stripe supports the implemented hosted card and
off-session paths when configured; PayFast stored-token debits are limited to
ZAR; iKhokha is currently a hosted one-time payment path. Provider currencies
and settlement formats must be checked against the tenant's contract before
collection. A gateway decline or outage leaves an open/failed attempt for
review; it cannot safely be reported as paid.

### Admin finance lifecycle

Use **Finance → Billing & invoices** to draft/issue invoices and manage account
activity. Use **Finance → Accounting & settlement** for the accounting map:

| Business event | Accounting link |
|---|---|
| Invoice issued | Debit accounts receivable; credit service revenue and applicable tax liability |
| Verified payment captured | Debit gateway clearing; credit accounts receivable |
| Settlement posted | Debit bank for net proceeds and merchant fees; credit gateway clearing |
| Approved refund | Linked credit note and refund payout journals reduce the receivable/revenue/tax and record the payout |

Import a provider/bank statement with a statement reference and gross, fee and
net amounts. ALTIL automatically matches only a captured payment with a matching
provider reference, currency and gross amount. Resolve every exception before
posting settlement. Journal and source references remain linked for review.

The implemented ledger is an **operational double-entry subledger**, not a
replacement for an accountant-approved general ledger, statutory tax engine,
FX revaluation policy, audit opinion or month-end close. Finance owners must
approve the chart of accounts, tax treatment, FX policy and bank mappings.

## Billing methods and collection guardrails

- **One-off payment:** Customer chooses an available hosted gateway for an
  open invoice.
- **Monthly collection:** Requires an active provider-vaulted token and its
  own explicit mandate. Collects eligible issued invoices on the selected
  schedule.
- **Usage threshold:** Requires a Stripe card mandate in USD because AI usage is
  metered in USD. Each threshold schedule stores the threshold, optional per
  charge cap and accepted consent text.
- **Provider limits:** Current automation does not perform arbitrary bank
  debits. iKhokha recurring card-token debit is not claimed by this integration.
- **Suspension/limits:** Key and tenant guardrails can block use when configured
  caps or license status are reached. Check invoices, collection and events to
  restore service after resolving the cause.

## Registration, users and communications

Self-registration is available at `/register`. It provisions an individual or
company workspace, owner and initial application under the selected published
package. An administrator can also onboard tenants and user accounts from the
customer/identity work areas. Tenant administrators manage customer users and
applications subject to role checks.

Email and Firebase credentials are stored encrypted after an encryption key
has been configured. Add delivery channels in Customer Communications, test
the destination/provider, and use the channel for appropriate billing,
security and service notices. A saved provider credential alone does not prove
that a message was delivered.

## Security and policies

ALTIL applies configured safety, privacy, access, quota and billing guardrails
to requests and tenant data. Use **Trust & governance** for AI policies,
security/privacy operations, data protection, risk, access, audit and global
currency configuration. Use the client portal for tenant-specific usage caps,
payment consent and application key lifecycle.

The project includes draft policy pages for service terms, acceptable use,
privacy/confidentiality, billing/refunds, cancellation and subprocessors. See
[`docs/legal`](./legal/terms-of-service.md); fill in Introsoft's legal identity,
data retention, tax/jurisdiction and provider details and obtain counsel review
before publishing these as binding policies.

## API reference

- Interactive/API reference source: [`openapi.yaml`](./openapi.yaml).
- Hosted contract endpoint: `GET /api/v1/openapi.yaml`.
- Public package/registration APIs are documented in the OpenAPI file.
- Tenant gateway endpoints include model listing, chat completions, responses,
  usage, profile and opt-in tenant knowledge operations.
- Management API routes require a tenant session or authorized administrative
  role; gateway calls require the tenant/application key configured for that
  integration.

Treat API keys and provider credentials as secrets. Rotate/revoke them if
exposed. Never place secret material in help tickets, analytics tags or
untrusted client-side code.

## Screen Assistant availability

The Screen Assistant can fall back to the built-in reviewed Screen Guide for documented navigation questions when no live model is routeable. This fallback does not bypass policy checks or provide general AI inference. Configure a real provider credential and pass health/model checks under **AI platform → Providers & models**.

The internal key can be supplied with `ALTIL_INTERNAL_AI_API_KEY`; otherwise a private per-installation key is generated under `.altil-data/`. For multiple server replicas, configure the same shared secret on every replica.
