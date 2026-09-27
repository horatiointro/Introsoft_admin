-- The migration runner checks information_schema before applying additive columns.
ALTER TABLE tenants ADD COLUMN metadata_json JSON NULL;
