-- Persist the existing published package catalogue used by public self-registration.
-- These values are copied from src/data/licensingData.ts; public routes read the
-- persisted rows after this migration rather than exposing that in-memory fallback.
INSERT IGNORE INTO licensing_plans
  (id, plan_code, name, description, pricing_model, base_price, currency, billing_cycle,
   included_transactions_quota, overage_rate_per_1k, grace_period_days, max_rpm_limit,
   sla_guarantee_percent, enforcement_rule, is_active, metadata_json)
VALUES
  ('plan-metered-flex','PLAN-METERED-FLEX','Flex · Pay for completed calls','Existing published ALTIL plan','per_transaction',0.0000,'USD','per_transaction',0,0.0015,3,5000,99.95,'soft_warning',1,
   '{"applicationId":"all","applicationName":"Any tenant application","pricingType":"per_transaction","billingCycle":"per_transaction","includedTransactions":0,"overagePricePerTransaction":0.0015,"gracePeriodDays":3,"autoEnforcementAction":"soft_warning","autoEnforceOnUnpaid":true,"features":["No commitment or monthly minimum","Per-key spend guardrails","Successful requests only are metered"],"isPublished":true,"createdDate":"2026-09-27","licenseScope":"application","volumeTiers":[{"upToRequests":10000,"pricePerRequest":0.0015,"label":"First 10,000"},{"upToRequests":100000,"pricePerRequest":0.0012,"label":"10,001–100,000"},{"upToRequests":1000000,"pricePerRequest":0.0009,"label":"100,001–1,000,000"},{"upToRequests":null,"pricePerRequest":0.0007,"label":"Above 1,000,000"}]}'),
  ('plan-team-100k','PLAN-TEAM-100K','Team · 100,000 requests','Existing published ALTIL plan','hybrid_base_metered',49.0000,'USD','monthly',100000,0.0012,5,5000,99.95,'soft_warning',1,
   '{"applicationId":"all","applicationName":"Any tenant application","pricingType":"hybrid_base_metered","billingCycle":"monthly","includedTransactions":100000,"overagePricePerTransaction":0.0012,"gracePeriodDays":5,"autoEnforcementAction":"soft_warning","autoEnforceOnUnpaid":true,"features":["100,000 included successful calls each month","Per-key and tenant budget caps","Overage pricing shown before routing"],"isPublished":true,"createdDate":"2026-09-27","licenseScope":"application"}'),
  ('plan-scale-1m','PLAN-SCALE-1M','Scale · 1,000,000 requests','Existing published ALTIL plan','hybrid_base_metered',349.0000,'USD','monthly',1000000,0.0008,7,5000,99.95,'soft_warning',1,
   '{"applicationId":"all","applicationName":"Any tenant application","pricingType":"hybrid_base_metered","billingCycle":"monthly","includedTransactions":1000000,"overagePricePerTransaction":0.0008,"gracePeriodDays":7,"autoEnforcementAction":"soft_warning","autoEnforceOnUnpaid":true,"features":["1,000,000 included successful calls each month","Shared tenant pool across applications","Monthly usage and spend guardrails"],"isPublished":true,"createdDate":"2026-09-27","licenseScope":"tenant_group","groupDiscountPercent":0}'),
  ('plan-clinical-annual','PLAN-CLINICAL-ANNUAL','Clinical AI Suite - Enterprise Annual SLA','Existing published ALTIL plan','per_year',4999.0000,'USD','annual',500000,0.0010,7,5000,99.95,'hard_block_402',1,
   '{"applicationId":"app-clinical","applicationName":"Clinical Diagnostics Assistant","pricingType":"per_year","billingCycle":"annual","includedTransactions":500000,"overagePricePerTransaction":0.001,"gracePeriodDays":7,"autoEnforcementAction":"hard_block_402","autoEnforceOnUnpaid":true,"features":["POPIA & HIPAA Certified Redaction","Dedicated Groq LPU + Gemini 1.5 Pro Route","99.95% Availability SLA","Unlimited User Seats & Audit Logs"],"maxUsersAllowed":500,"slaUptimeGuarantee":99.95,"isPublished":true,"createdDate":"2026-01-10","licenseScope":"application"}'),
  ('plan-fraud-tx','PLAN-FRAUD-TX','Financial Fraud Engine - Pay-Per-Transaction','Existing published ALTIL plan','per_transaction',0.0000,'USD','per_transaction',0,0.0035,3,5000,99.90,'rate_limit_throttle',1,
   '{"applicationId":"app-fraud","applicationName":"Financial Fraud Engine","pricingType":"per_transaction","billingCycle":"per_transaction","includedTransactions":0,"overagePricePerTransaction":0.0035,"gracePeriodDays":3,"autoEnforcementAction":"rate_limit_throttle","autoEnforceOnUnpaid":true,"features":["Real-time Anomaly Scoring (<50ms)","Pre-paid or Post-paid Metered Wallet","Sub-second Vector Pattern Matching","API Webhook Alert Hooks"],"maxUsersAllowed":50,"slaUptimeGuarantee":99.9,"isPublished":true,"createdDate":"2026-02-01","licenseScope":"application"}'),
  ('plan-bot-monthly','PLAN-BOT-MONTHLY','Customer Bot - Growth Monthly Hybrid','Existing published ALTIL plan','hybrid_base_metered',4999.0000,'ZAR','monthly',50000,0.0500,5,5000,99.50,'soft_warning',1,
   '{"applicationId":"app-custservice","applicationName":"Customer Service Bot","pricingType":"hybrid_base_metered","billingCycle":"monthly","includedTransactions":50000,"overagePricePerTransaction":0.05,"gracePeriodDays":5,"autoEnforcementAction":"soft_warning","autoEnforceOnUnpaid":true,"features":["Multi-lingual Omni-channel Support","50,000 Included Monthly Queries","Human Agent Handoff API","Custom Knowledge Base RAG"],"maxUsersAllowed":100,"slaUptimeGuarantee":99.5,"isPublished":true,"createdDate":"2026-03-15","licenseScope":"application"}'),
  ('plan-claims-daily','PLAN-CLAIMS-DAILY','Enterprise Claims AI - On-Demand Daily','Existing published ALTIL plan','per_day',45.0000,'USD','daily',10000,0.0020,2,5000,99.00,'hard_block_402',1,
   '{"applicationId":"app-claims","applicationName":"Enterprise Claims AI","pricingType":"per_day","billingCycle":"daily","includedTransactions":10000,"overagePricePerTransaction":0.002,"gracePeriodDays":2,"autoEnforcementAction":"hard_block_402","autoEnforceOnUnpaid":true,"features":["Automated OCR & Policy Inspection","Daily Micro-billing Settlement","Instant Auto-suspend on Non-payment","Exportable Claims Evidence Audit"],"maxUsersAllowed":25,"slaUptimeGuarantee":99,"isPublished":true,"createdDate":"2026-04-01","licenseScope":"application"}'),
  ('plan-sovereign-custom','PLAN-SOVEREIGN-CUSTOM','Sovereign Banking AI - Bespoke Contract','Existing published ALTIL plan','custom_contract',12500.0000,'USD','monthly',2000000,0.0008,14,5000,99.99,'read_only',1,
   '{"applicationId":"app-fraud","applicationName":"Financial Fraud Engine","pricingType":"custom_contract","billingCycle":"monthly","includedTransactions":2000000,"overagePricePerTransaction":0.0008,"gracePeriodDays":14,"autoEnforcementAction":"read_only","autoEnforceOnUnpaid":true,"features":["Dedicated On-Prem Ollama Cluster Option","Custom Fine-Tuned Domain Adapter","2,000,000 Included Transactions","99.99% Financial Industry SLA","Executive Account Manager & Direct Phone Hotline"],"maxUsersAllowed":2000,"slaUptimeGuarantee":99.99,"isPublished":true,"createdDate":"2026-01-01","licenseScope":"application"}');

-- Registration is a pending request until an authorized owner approves the
-- explicit commercial and technical relationships. Passwords are hashed; no
-- tenant, customer, user, key, license, or authoritative mapping is created yet.
CREATE TABLE IF NOT EXISTS public_registration_requests (
  id VARCHAR(64) PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  pending_email VARCHAR(255) NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  account_type VARCHAR(16) NOT NULL,
  display_name VARCHAR(180) NOT NULL,
  company_name VARCHAR(180) NULL,
  contact_first_name VARCHAR(100) NOT NULL,
  contact_last_name VARCHAR(100) NOT NULL,
  country VARCHAR(80) NOT NULL,
  application_name VARCHAR(180) NOT NULL,
  plan_id VARCHAR(64) NOT NULL,
  accepted_terms BOOLEAN NOT NULL,
  accepted_terms_at DATETIME(3) NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'PENDING_APPROVAL',
  expires_at DATETIME(3) NOT NULL,
  approved_by VARCHAR(64) NULL,
  approved_at DATETIME(3) NULL,
  result_tenant_id VARCHAR(64) NULL,
  result_customer_id VARCHAR(64) NULL,
  result_organization_id VARCHAR(64) NULL,
  result_account_id VARCHAR(64) NULL,
  result_user_id VARCHAR(64) NULL,
  result_application_id VARCHAR(64) NULL,
  result_license_id VARCHAR(64) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  CONSTRAINT ck_public_registration_customer_type CHECK (account_type IN ('INDIVIDUAL','COMPANY')),
  CONSTRAINT ck_public_registration_party_fields CHECK ((account_type='COMPANY' AND company_name IS NOT NULL) OR (account_type='INDIVIDUAL' AND company_name IS NULL)),
  CONSTRAINT fk_public_registration_plan FOREIGN KEY (plan_id) REFERENCES licensing_plans(id),
  CONSTRAINT fk_public_registration_approver FOREIGN KEY (approved_by) REFERENCES iam_users(id),
  CONSTRAINT fk_public_registration_tenant FOREIGN KEY (result_tenant_id) REFERENCES tenants(id),
  CONSTRAINT fk_public_registration_customer FOREIGN KEY (result_customer_id) REFERENCES commercial_customers(id),
  CONSTRAINT fk_public_registration_organization FOREIGN KEY (result_organization_id) REFERENCES commercial_organizations(id),
  CONSTRAINT fk_public_registration_account FOREIGN KEY (result_account_id) REFERENCES commercial_accounts(id),
  CONSTRAINT fk_public_registration_user FOREIGN KEY (result_user_id) REFERENCES iam_users(id),
  CONSTRAINT fk_public_registration_application FOREIGN KEY (result_application_id) REFERENCES tenant_applications(id),
  CONSTRAINT fk_public_registration_license FOREIGN KEY (result_license_id) REFERENCES tenant_licenses(id),
  INDEX idx_public_registration_status (status, expires_at),
  INDEX idx_public_registration_email (email, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Administrator-created users use a one-time activation link; only its digest
-- is stored. No email provider is contacted by this workflow.
CREATE TABLE IF NOT EXISTS iam_user_invitations (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  token_hash CHAR(64) NOT NULL UNIQUE,
  expires_at DATETIME(3) NOT NULL,
  accepted_at DATETIME(3) NULL,
  created_by VARCHAR(64) NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  CONSTRAINT fk_iam_invitation_user FOREIGN KEY (user_id) REFERENCES iam_users(id) ON DELETE CASCADE,
  CONSTRAINT fk_iam_invitation_actor FOREIGN KEY (created_by) REFERENCES iam_users(id),
  UNIQUE KEY uk_iam_user_invitation_active (user_id, accepted_at),
  INDEX idx_iam_invitation_expiry (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
