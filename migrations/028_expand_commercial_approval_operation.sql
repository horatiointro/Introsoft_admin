-- Accommodate the explicit technical tenant scope approval operation name.
ALTER TABLE commercial_evidence_approvals
  MODIFY COLUMN operation VARCHAR(48) NOT NULL;
