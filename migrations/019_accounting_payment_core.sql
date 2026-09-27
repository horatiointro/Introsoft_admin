CREATE TABLE IF NOT EXISTS billing_payment_intents (
  id VARCHAR(100) PRIMARY KEY,
  tenant_id VARCHAR(80) NOT NULL,
  invoice_id VARCHAR(80) NULL,
  provider VARCHAR(24) NOT NULL,
  status VARCHAR(24) NOT NULL DEFAULT 'pending',
  amount DECIMAL(18,6) NOT NULL,
  currency CHAR(3) NOT NULL,
  external_reference VARCHAR(140) NOT NULL,
  provider_reference VARCHAR(160) NULL,
  checkout_url TEXT NULL,
  captured_amount DECIMAL(18,6) NOT NULL DEFAULT 0,
  fee_amount DECIMAL(18,6) NOT NULL DEFAULT 0,
  settlement_reference VARCHAR(160) NULL,
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL,
  payload_json JSON NOT NULL,
  UNIQUE KEY uq_payment_intent_external (external_reference),
  INDEX idx_payment_intent_tenant_status (tenant_id,status,created_at),
  INDEX idx_payment_intent_provider_reference (provider,provider_reference)
);

CREATE TABLE IF NOT EXISTS billing_refunds (
  id VARCHAR(100) PRIMARY KEY,
  tenant_id VARCHAR(80) NOT NULL,
  invoice_id VARCHAR(80) NOT NULL,
  payment_intent_id VARCHAR(100) NOT NULL,
  provider VARCHAR(24) NOT NULL,
  status VARCHAR(24) NOT NULL DEFAULT 'requested',
  amount DECIMAL(18,6) NOT NULL,
  currency CHAR(3) NOT NULL,
  reason VARCHAR(1000) NOT NULL,
  provider_reference VARCHAR(160) NULL,
  requested_by VARCHAR(190) NOT NULL,
  requested_at DATETIME(3) NOT NULL,
  processed_at DATETIME(3) NULL,
  payload_json JSON NOT NULL,
  INDEX idx_billing_refund_tenant (tenant_id,status,requested_at),
  INDEX idx_billing_refund_payment (payment_intent_id,status)
);

CREATE TABLE IF NOT EXISTS billing_payment_methods (
  id VARCHAR(100) PRIMARY KEY,
  tenant_id VARCHAR(80) NOT NULL,
  provider VARCHAR(24) NOT NULL,
  method_type VARCHAR(40) NOT NULL,
  provider_token_ciphertext LONGTEXT NOT NULL,
  display_metadata JSON NOT NULL,
  mandate_text LONGTEXT NOT NULL,
  status VARCHAR(24) NOT NULL DEFAULT 'active',
  created_at DATETIME(3) NOT NULL,
  revoked_at DATETIME(3) NULL,
  INDEX idx_payment_method_tenant (tenant_id,status)
);

CREATE TABLE IF NOT EXISTS billing_schedules (
  id VARCHAR(100) PRIMARY KEY,
  tenant_id VARCHAR(80) NOT NULL,
  invoice_id VARCHAR(80) NULL,
  payment_method_id VARCHAR(100) NULL,
  schedule_type VARCHAR(24) NOT NULL,
  threshold_amount DECIMAL(18,6) NULL,
  minimum_charge DECIMAL(18,6) NULL,
  maximum_charge DECIMAL(18,6) NULL,
  currency CHAR(3) NOT NULL,
  cadence VARCHAR(24) NOT NULL,
  next_run_at DATETIME(3) NULL,
  usage_cycle_start DATE NULL,
  last_collected_amount DECIMAL(18,6) NOT NULL DEFAULT 0,
  status VARCHAR(24) NOT NULL DEFAULT 'active',
  consent_record JSON NOT NULL,
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL,
  INDEX idx_billing_schedule_tenant (tenant_id,status,next_run_at)
);

CREATE TABLE IF NOT EXISTS accounting_journals (
  id VARCHAR(100) PRIMARY KEY,
  tenant_id VARCHAR(80) NOT NULL,
  source_type VARCHAR(40) NOT NULL,
  source_id VARCHAR(120) NOT NULL,
  currency CHAR(3) NOT NULL,
  description VARCHAR(500) NOT NULL,
  posted_at DATETIME(3) NOT NULL,
  actor VARCHAR(190) NOT NULL,
  UNIQUE KEY uq_accounting_source (source_type,source_id),
  INDEX idx_accounting_tenant_posted (tenant_id,posted_at)
);

CREATE TABLE IF NOT EXISTS accounting_journal_lines (
  id VARCHAR(100) PRIMARY KEY,
  journal_id VARCHAR(100) NOT NULL,
  account_code VARCHAR(40) NOT NULL,
  account_name VARCHAR(140) NOT NULL,
  debit DECIMAL(18,6) NOT NULL DEFAULT 0,
  credit DECIMAL(18,6) NOT NULL DEFAULT 0,
  memo VARCHAR(500) NOT NULL,
  INDEX idx_journal_line_account (account_code,journal_id),
  CONSTRAINT fk_journal_line_journal FOREIGN KEY (journal_id) REFERENCES accounting_journals(id)
);

CREATE TABLE IF NOT EXISTS billing_reconciliation_batches (
  id VARCHAR(100) PRIMARY KEY,
  provider VARCHAR(24) NOT NULL,
  statement_reference VARCHAR(160) NOT NULL,
  currency CHAR(3) NOT NULL,
  row_count INT NOT NULL DEFAULT 0,
  matched_count INT NOT NULL DEFAULT 0,
  exception_count INT NOT NULL DEFAULT 0,
  gross_total DECIMAL(18,6) NOT NULL DEFAULT 0,
  fees_total DECIMAL(18,6) NOT NULL DEFAULT 0,
  net_total DECIMAL(18,6) NOT NULL DEFAULT 0,
  status VARCHAR(24) NOT NULL DEFAULT 'review',
  created_at DATETIME(3) NOT NULL,
  created_by VARCHAR(190) NOT NULL,
  payload_json JSON NOT NULL,
  INDEX idx_recon_status (status,created_at)
);

CREATE TABLE IF NOT EXISTS billing_reconciliation_items (
  id VARCHAR(100) PRIMARY KEY,
  batch_id VARCHAR(100) NOT NULL,
  external_reference VARCHAR(160) NOT NULL,
  payment_intent_id VARCHAR(100) NULL,
  gross_amount DECIMAL(18,6) NOT NULL,
  fee_amount DECIMAL(18,6) NOT NULL DEFAULT 0,
  net_amount DECIMAL(18,6) NOT NULL,
  currency CHAR(3) NOT NULL,
  status VARCHAR(24) NOT NULL DEFAULT 'unmatched',
  memo VARCHAR(500) NULL,
  INDEX idx_recon_item_batch (batch_id,status),
  INDEX idx_recon_item_external (external_reference),
  CONSTRAINT fk_recon_item_batch FOREIGN KEY (batch_id) REFERENCES billing_reconciliation_batches(id)
);
