ALTER TABLE operations_problems ADD COLUMN tenant_id VARCHAR(64) NULL;
ALTER TABLE change_requests ADD COLUMN tenant_id VARCHAR(64) NULL;
