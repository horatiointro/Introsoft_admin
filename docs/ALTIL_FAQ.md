# ALTIL Frequently Asked Questions

## What is a tenant?

A tenant is the individual or company that is ALTIL's customer. A tenant can
have a multi-level organization, applications, sub-applications, functions,
users, licenses and separately scoped API keys.

## Where do I find a screen?

Open the collapsible work area in the left sidebar, or use **Search navigation**
to find a screen by its name or a related task. Select **Ask ALTIL** to ask the
Screen Assistant. It can explain a screen and offer direct navigation shortcuts.

## Why does Screen Assistant say no model is available?

Live answers require at least one enabled provider with a supported adapter, a real credential, an online health check, a tested eligible model and available quota. Starter/sample keys are deliberately rejected. Configure a provider under **AI platform → Providers & models**, save a real key, then test the provider and model. Screen Assistant requests run as the default **Introsoft ALTIL Internal** tenant, its **ALTIL Screen Assistant** application and a private tracked API key. The key is never sent to the browser; usage follows normal key guardrails and metering. The assistant can still answer documented ALTIL navigation questions from the built-in Screen Guide while live inference is unavailable; policy-blocked requests are never sent through that fallback.

## Which currency is used for billing?

USD is ALTIL's usage metering and platform billing base. An explicit customer
agreement, invoice or payment can retain its stated source currency. The tenant
portal's **Display currency** changes how eligible values are shown; it does
not change an issued invoice, payment, journal or contract.

## Why do I still see a value in USD or another currency?

ALTIL needs a finance-approved, sufficiently fresh exchange rate to convert a
value for display. If the rate is missing or stale, the portal shows the source
amount/currency and avoids an unverified conversion. Ask a platform
administrator to configure the rate under **Trust & governance → Platform
settings → Platform & Currency Settings**.

## What does “1 USD =” mean in the exchange-rate book?

It is the number of units of that currency for one US dollar. The admin enters
the value, rate source and the platform records the editor and timestamp. The
freshness window controls whether customer screens may use it for an estimate.
It is not an automatic market feed, bank execution rate or a retroactive
accounting revaluation.

## Does changing my display currency change what ALTIL charges me?

No. It changes the display preference only. A charge still follows its
contract, invoice, accepted payment method and explicit collection schedule.
Check the invoice's original currency before paying.

## Can ALTIL list every free AI model worldwide and guarantee each request?

No. There is no complete authoritative cross-provider catalogue of every model
and its changing free allowance. ALTIL can manage the providers and models
configured in its catalogue, test available connections and route through
eligible fallbacks. A provider can still fail, impose a quota, revoke access,
change terms or return an error. ALTIL should honor the configured guardrails
and return a clear failure if no permitted route succeeds.

## How do I create an API key for an application or function?

Open **Customers → Customer portal → Application portfolio** or the admin
**AI platform → Applications & API keys** screen. Create the correct parent
scope, then issue a key for that application/sub-application/function. Copy
the new key immediately; the secret is not shown again. Set request and USD
spend guardrails per key.

## What happens when a key reaches its limit?

ALTIL blocks further use at the configured tenant/key or license limit and
records the usage/event where storage is available. Review the key guardrail,
current usage, license and invoice before raising the cap or reactivating
service.

## How can I pay an invoice?

Open the Customer portal's **Invoices & payment history**, choose an available
hosted gateway and pay its open invoice balance. ALTIL marks it paid only after
a verified provider callback/reconciliation, not merely after a redirect back
to the portal.

## Can ALTIL charge a card monthly or at a usage threshold?

Yes when the correct provider is configured and the customer has accepted a
separate mandate. Monthly collection needs an active saved token. USD usage
threshold collection currently requires a Stripe card mandate and can include
a per-charge cap. PayFast stored-token collection is limited to ZAR; iKhokha
currently supports hosted one-off checkout in this integration. Bank debit is
not implied by card consent.

## How do refunds work?

Customers request a partial or full refund against a captured invoice payment.
The request reserves its amount and appears in **Finance → Accounting &
settlement → Refund control**. Finance submits or reviews the provider refund,
confirms completion with evidence, and then ALTIL posts the linked credit note,
payout journal and ledger entry. A request is not itself a completed refund.

## How do we reconcile settlements?

Import a gateway/bank file with its statement reference and gross, fee and net
transaction values. ALTIL matches exact captured provider transactions using
reference, currency and gross amount. Resolve unmatched rows; then post the
matched batch so the net amount and merchant fees are journaled to the correct
accounts.

## Is the accounting module a statutory general ledger?

It is an operational double-entry subledger with source-linked invoices,
captures, settlement batches and refunds. It still needs Introsoft's finance
owner/accountant to approve chart-of-accounts mappings, FX revaluation,
jurisdiction-specific tax, bank mappings, period close and audit controls.

## How do we set up email or Firebase messages?

Open **Customers → Customer messages**. Add an SMTP or Firebase channel and
configure credentials; ALTIL encrypts saved provider configuration when its
knowledge-encryption key is set. Configure provider-side sender permissions,
test delivery and check delivery/provider status before relying on a channel.

## Where is the complete API specification?

Read [`openapi.yaml`](./openapi.yaml), or fetch `GET /api/v1/openapi.yaml` from
the running service. API authorization depends on whether the call is a tenant
gateway request or an administrative/session request.

## Where can I read service terms and privacy information?

Open the policy links on self-registration or read the draft documents under
[`docs/legal`](./legal/terms-of-service.md). Complete the legal-entity,
retention, data-region, tax and governing-law fields and obtain legal review
before using them as binding agreements.
