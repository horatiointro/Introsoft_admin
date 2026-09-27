CREATE TABLE IF NOT EXISTS billing_invoices (
  id VARCHAR(80) PRIMARY KEY,
  invoice_number VARCHAR(80) NOT NULL UNIQUE,
  tenant_id VARCHAR(80) NOT NULL,
  status VARCHAR(24) NOT NULL,
  currency CHAR(3) NOT NULL,
  due_at DATE NOT NULL,
  total DECIMAL(18,6) NOT NULL DEFAULT 0,
  paid DECIMAL(18,6) NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL,
  payload_json JSON NOT NULL,
  INDEX idx_billing_invoice_tenant (tenant_id, created_at),
  INDEX idx_billing_invoice_status (status, due_at)
);

CREATE TABLE IF NOT EXISTS billing_ledger_entries (
  id VARCHAR(80) PRIMARY KEY,
  tenant_id VARCHAR(80) NOT NULL,
  kind VARCHAR(24) NOT NULL,
  amount DECIMAL(18,6) NOT NULL,
  currency CHAR(3) NOT NULL,
  reference VARCHAR(120) NOT NULL,
  created_at DATETIME(3) NOT NULL,
  payload_json JSON NOT NULL,
  INDEX idx_billing_ledger_tenant (tenant_id, created_at),
  INDEX idx_billing_ledger_reference (reference)
);
