-- Explicit owner approval records gate creation of authoritative commercial relationships.
CREATE TABLE IF NOT EXISTS commercial_evidence_approvals (
  id VARCHAR(64) PRIMARY KEY,
  organization_id VARCHAR(64) NOT NULL,
  operation VARCHAR(32) NOT NULL,
  customer_id VARCHAR(64) NULL,
  evidence_reference VARCHAR(180) NOT NULL,
  approved_by VARCHAR(64) NOT NULL,
  approval_reason VARCHAR(500) NOT NULL,
  approved_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  CONSTRAINT fk_commercial_evidence_org FOREIGN KEY (organization_id) REFERENCES commercial_organizations(id),
  CONSTRAINT fk_commercial_evidence_customer FOREIGN KEY (customer_id) REFERENCES commercial_customers(id),
  CONSTRAINT fk_commercial_evidence_approver FOREIGN KEY (approved_by) REFERENCES iam_users(id),
  INDEX idx_commercial_evidence_scope (organization_id, operation, customer_id, approved_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS commercial_evidence_approval_uses (
  approval_id VARCHAR(64) PRIMARY KEY,
  resource_type VARCHAR(32) NOT NULL,
  resource_id VARCHAR(64) NOT NULL,
  consumed_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  CONSTRAINT fk_commercial_evidence_use FOREIGN KEY (approval_id) REFERENCES commercial_evidence_approvals(id),
  INDEX idx_commercial_evidence_use_resource (resource_type, resource_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
