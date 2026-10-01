-- Phase A completion: explicit scope-link purpose, cardinality backstops, and durable mutation replay.
ALTER TABLE commercial_organization_tenant_scopes
  ADD COLUMN scope_link_type VARCHAR(24) NOT NULL DEFAULT 'PRIMARY' AFTER tenant_id,
  ADD COLUMN updated_by VARCHAR(64) NULL AFTER created_at,
  ADD COLUMN updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  ADD UNIQUE KEY uk_commercial_org_scope_tenant_start (tenant_id, effective_from);

ALTER TABLE commercial_customer_tenant_links
  ADD COLUMN scope_link_type VARCHAR(24) NOT NULL DEFAULT 'CUSTOMER_RUNTIME' AFTER tenant_id,
  ADD COLUMN updated_by VARCHAR(64) NULL AFTER created_at,
  ADD COLUMN updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  ADD UNIQUE KEY uk_commercial_customer_scope_tenant_start (tenant_id, effective_from);

ALTER TABLE commercial_evidence_approvals
  ADD COLUMN target_tenant_id VARCHAR(64) NULL AFTER customer_id,
  ADD COLUMN requested_scope_link_type VARCHAR(24) NULL AFTER target_tenant_id,
  ADD COLUMN requested_effective_from DATETIME(3) NULL AFTER requested_scope_link_type,
  ADD COLUMN requested_effective_to DATETIME(3) NULL AFTER requested_effective_from,
  ADD CONSTRAINT fk_commercial_evidence_tenant FOREIGN KEY (target_tenant_id) REFERENCES tenants(id);

CREATE TABLE commercial_idempotency_records (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  actor_id VARCHAR(64) NOT NULL,
  application_key VARCHAR(128) NOT NULL,
  operation VARCHAR(64) NOT NULL,
  idempotency_key_hash CHAR(64) NOT NULL,
  request_fingerprint CHAR(64) NOT NULL,
  resource_type VARCHAR(64) NOT NULL,
  resource_id VARCHAR(64) NULL,
  response_status SMALLINT UNSIGNED NULL,
  response_body_json JSON NULL,
  state VARCHAR(16) NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  completed_at DATETIME(3) NULL,
  expires_at DATETIME(3) NOT NULL,
  CONSTRAINT fk_commercial_idempotency_actor FOREIGN KEY (actor_id) REFERENCES iam_users(id),
  CONSTRAINT ck_commercial_idempotency_state CHECK (state IN ('IN_PROGRESS','COMPLETED','FAILED')),
  UNIQUE KEY uk_commercial_idempotency_actor_app_op_key (actor_id, application_key, operation, idempotency_key_hash),
  INDEX idx_commercial_idempotency_expiry (expires_at, state),
  INDEX idx_commercial_idempotency_resource (resource_type, resource_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
