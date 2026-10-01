-- Store the full resource type for technical scope approval consumption.
ALTER TABLE commercial_evidence_approval_uses
  MODIFY COLUMN resource_type VARCHAR(64) NOT NULL;
