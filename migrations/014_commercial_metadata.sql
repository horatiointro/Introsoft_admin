-- The migration runner checks information_schema before applying additive columns.
ALTER TABLE licensing_plans ADD COLUMN metadata_json JSON NULL;
ALTER TABLE tenant_licenses ADD COLUMN metadata_json JSON NULL;
