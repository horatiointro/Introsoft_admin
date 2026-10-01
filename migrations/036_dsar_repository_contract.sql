-- Additive compatibility for the current DSAR repository contract.
-- Existing statutory columns, rows, keys and indexes are preserved.

ALTER TABLE compliance_dsar_requests
  ADD COLUMN framework VARCHAR(16) NOT NULL DEFAULT 'POPIA';

ALTER TABLE compliance_dsar_requests
  ADD COLUMN requestor_name VARCHAR(255) NULL;

ALTER TABLE compliance_dsar_requests
  ADD COLUMN app_id VARCHAR(64) NULL;

ALTER TABLE compliance_dsar_requests
  ADD COLUMN notes TEXT NULL;

ALTER TABLE compliance_dsar_requests
  MODIFY COLUMN assigned_officer_email VARCHAR(255) NULL;
