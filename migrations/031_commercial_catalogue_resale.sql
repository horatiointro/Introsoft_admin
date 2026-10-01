-- Phase B1: explicit catalogue relationships, reseller grants, and effective-dated pricing.
-- Product identities remain in billing_products; bundle membership is a product relationship.
ALTER TABLE commercial_evidence_approvals
  ADD COLUMN target_organization_id VARCHAR(64) NULL AFTER target_tenant_id,
  ADD COLUMN target_product_id VARCHAR(100) NULL AFTER target_organization_id,
  ADD COLUMN requested_details_json JSON NULL AFTER requested_effective_to,
  ADD CONSTRAINT fk_commercial_evidence_target_org FOREIGN KEY (target_organization_id) REFERENCES commercial_organizations(id),
  ADD CONSTRAINT fk_commercial_evidence_target_product FOREIGN KEY (target_product_id) REFERENCES billing_products(id);

CREATE TABLE commercial_product_relationships (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  source_product_id VARCHAR(100) NOT NULL,
  target_product_id VARCHAR(100) NOT NULL,
  relationship_type VARCHAR(32) NOT NULL,
  quantity DECIMAL(18,4) NOT NULL DEFAULT 1,
  explanation VARCHAR(500) NULL,
  status VARCHAR(16) NOT NULL DEFAULT 'ACTIVE',
  effective_from DATETIME(3) NOT NULL,
  effective_to DATETIME(3) NULL,
  created_by VARCHAR(64) NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  CONSTRAINT fk_commercial_product_rel_source FOREIGN KEY (source_product_id) REFERENCES billing_products(id),
  CONSTRAINT fk_commercial_product_rel_target FOREIGN KEY (target_product_id) REFERENCES billing_products(id),
  CONSTRAINT fk_commercial_product_rel_actor FOREIGN KEY (created_by) REFERENCES iam_users(id),
  CONSTRAINT ck_commercial_product_rel_type CHECK (relationship_type IN ('REQUIRES','RECOMMENDS','COMPATIBLE_WITH','INCOMPATIBLE_WITH','UPGRADE_TO','DOWNGRADE_TO','ADD_ON','BUNDLE_MEMBER','ALTERNATIVE','REPLACEMENT','FOLLOW_ON')),
  CONSTRAINT ck_commercial_product_rel_not_self CHECK (source_product_id <> target_product_id),
  CONSTRAINT ck_commercial_product_rel_quantity CHECK (quantity > 0),
  CONSTRAINT ck_commercial_product_rel_period CHECK (effective_to IS NULL OR effective_to > effective_from),
  UNIQUE KEY uk_commercial_product_rel_version (source_product_id,target_product_id,relationship_type,effective_from),
  INDEX idx_commercial_product_rel_source (source_product_id,status,effective_from,effective_to),
  INDEX idx_commercial_product_rel_target (target_product_id,status,effective_from,effective_to)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE commercial_reseller_product_authorizations (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  owner_organization_id VARCHAR(64) NOT NULL,
  reseller_organization_id VARCHAR(64) NOT NULL,
  product_id VARCHAR(100) NOT NULL,
  status VARCHAR(16) NOT NULL DEFAULT 'ACTIVE',
  effective_from DATETIME(3) NOT NULL,
  effective_to DATETIME(3) NULL,
  approval_id VARCHAR(64) NOT NULL,
  created_by VARCHAR(64) NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  CONSTRAINT fk_reseller_product_owner FOREIGN KEY (owner_organization_id) REFERENCES commercial_organizations(id),
  CONSTRAINT fk_reseller_product_reseller FOREIGN KEY (reseller_organization_id) REFERENCES commercial_organizations(id),
  CONSTRAINT fk_reseller_product_product FOREIGN KEY (product_id) REFERENCES billing_products(id),
  CONSTRAINT fk_reseller_product_approval FOREIGN KEY (approval_id) REFERENCES commercial_evidence_approvals(id),
  CONSTRAINT fk_reseller_product_actor FOREIGN KEY (created_by) REFERENCES iam_users(id),
  CONSTRAINT ck_reseller_product_not_self CHECK (owner_organization_id <> reseller_organization_id),
  CONSTRAINT ck_reseller_product_period CHECK (effective_to IS NULL OR effective_to > effective_from),
  UNIQUE KEY uk_reseller_product_auth_approval (approval_id),
  UNIQUE KEY uk_reseller_product_auth_start (owner_organization_id,reseller_organization_id,product_id,effective_from),
  INDEX idx_reseller_product_auth_owner (owner_organization_id,status,effective_from,effective_to),
  INDEX idx_reseller_product_auth_reseller (reseller_organization_id,status,effective_from,effective_to),
  INDEX idx_reseller_product_auth_product (product_id,status,effective_from,effective_to)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE commercial_reseller_product_prices (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  authorization_id VARCHAR(64) NOT NULL,
  currency CHAR(3) NOT NULL,
  reseller_cost DECIMAL(18,6) NOT NULL,
  minimum_customer_price DECIMAL(18,6) NOT NULL,
  recommended_markup_percent DECIMAL(7,3) NOT NULL,
  status VARCHAR(16) NOT NULL DEFAULT 'ACTIVE',
  effective_from DATETIME(3) NOT NULL,
  effective_to DATETIME(3) NULL,
  approval_id VARCHAR(64) NOT NULL,
  created_by VARCHAR(64) NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  CONSTRAINT fk_reseller_price_authorization FOREIGN KEY (authorization_id) REFERENCES commercial_reseller_product_authorizations(id),
  CONSTRAINT fk_reseller_price_approval FOREIGN KEY (approval_id) REFERENCES commercial_evidence_approvals(id),
  CONSTRAINT fk_reseller_price_actor FOREIGN KEY (created_by) REFERENCES iam_users(id),
  CONSTRAINT ck_reseller_price_amounts CHECK (reseller_cost >= 0 AND minimum_customer_price >= reseller_cost),
  CONSTRAINT ck_reseller_price_markup CHECK (recommended_markup_percent >= 0 AND recommended_markup_percent <= 500),
  CONSTRAINT ck_reseller_price_period CHECK (effective_to IS NULL OR effective_to > effective_from),
  UNIQUE KEY uk_reseller_price_approval (approval_id),
  UNIQUE KEY uk_reseller_price_version (authorization_id,effective_from),
  INDEX idx_reseller_price_active (authorization_id,status,effective_from,effective_to)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
