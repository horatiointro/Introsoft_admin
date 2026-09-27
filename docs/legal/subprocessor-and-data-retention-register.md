# ALTIL Subprocessor and Retention Register

**Operational register template — complete before production launch and keep versioned.** Do not treat this template as proof of provider configuration.

| Provider/service | Data disclosed | Purpose | Region(s) | Retention/training | Contract/DPA verified | Tenant control |
|---|---|---|---|---|---|---|
| AI model providers (per route) | Prompt, context, required metadata | Inference | **Complete per provider/model** | **Complete per provider/model** | **Pending evidence** | Route allow/deny, model controls |
| MariaDB hosting | Tenant, usage, billing, audit records | Core storage | **Complete** | Backup and deletion schedule **complete** | **Complete** | Tenant lifecycle/export |
| Firebase Cloud Messaging | Device push token, push payload | Mobile notices | **Complete** | **Complete** | **Complete** | Device revoke |
| SMTP provider | Recipient, subject/body, delivery metadata | Transactional email | **Complete** | **Complete** | **Complete** | Channel and recipient control |
| Stripe (if enabled) | Checkout, invoice, payment and mandate references | Payment processing | **Complete** | Provider terms | **Complete** | Payment method/cancel |
| PayFast (if enabled) | Checkout, payment/token references | Hosted and recurring card payment | **Complete** | Provider terms | **Complete** | Mandate/token cancellation |
| iKhokha iK Pay (if enabled) | Payment-link fields and transaction references | Hosted one-time payment | **Complete** | Provider terms | **Complete** | Tenant pay link |

Retention schedule to approve and implement: prompt/output content ___ days; operational telemetry ___ days; security logs ___ days; billing/tax documents ___ years; payment provider raw event payload ___ days; backups ___ days; terminated tenant deletion ___ days after request/expiry, except legal holds. Document legal basis, access, deletion job, backup expiry, export and audit evidence for every period.
