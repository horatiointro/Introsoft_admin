-- Commercial foundation. Technical tenant/IAM records are deliberately not backfilled.
CREATE TABLE IF NOT EXISTS commercial_organizations (
  id VARCHAR(64) PRIMARY KEY,
  canonical_key VARCHAR(64) NULL UNIQUE,
  name VARCHAR(180) NOT NULL,
  organization_type VARCHAR(24) NOT NULL,
  status VARCHAR(24) NOT NULL DEFAULT 'ACTIVE',
  created_by VARCHAR(64) NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX idx_commercial_organizations_status (status, organization_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS commercial_organization_relationships (
  id VARCHAR(64) PRIMARY KEY,
  parent_organization_id VARCHAR(64) NOT NULL,
  child_organization_id VARCHAR(64) NOT NULL,
  relationship_type VARCHAR(32) NOT NULL,
  status VARCHAR(24) NOT NULL DEFAULT 'ACTIVE',
  effective_from DATETIME(3) NOT NULL,
  effective_to DATETIME(3) NULL,
  created_by VARCHAR(64) NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  CONSTRAINT fk_commercial_org_rel_parent FOREIGN KEY (parent_organization_id) REFERENCES commercial_organizations(id),
  CONSTRAINT fk_commercial_org_rel_child FOREIGN KEY (child_organization_id) REFERENCES commercial_organizations(id),
  UNIQUE KEY uk_commercial_org_rel_start (parent_organization_id, child_organization_id, relationship_type, effective_from),
  INDEX idx_commercial_org_rel_parent (parent_organization_id, status, effective_from, effective_to),
  INDEX idx_commercial_org_rel_child (child_organization_id, status, effective_from, effective_to)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS commercial_customers (
  id VARCHAR(64) PRIMARY KEY,
  customer_type VARCHAR(16) NOT NULL,
  display_name VARCHAR(180) NOT NULL,
  company_name VARCHAR(180) NULL,
  individual_given_name VARCHAR(100) NULL,
  individual_family_name VARCHAR(100) NULL,
  contact_json JSON NULL,
  status VARCHAR(24) NOT NULL DEFAULT 'ACTIVE',
  created_by VARCHAR(64) NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX idx_commercial_customers_type_status (customer_type, status),
  INDEX idx_commercial_customers_name (display_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS commercial_legal_entities (
  id VARCHAR(64) PRIMARY KEY,
  organization_id VARCHAR(64) NULL,
  customer_id VARCHAR(64) NULL,
  legal_name VARCHAR(180) NOT NULL,
  jurisdiction CHAR(2) NOT NULL,
  registration_reference VARCHAR(160) NULL,
  status VARCHAR(24) NOT NULL DEFAULT 'ACTIVE',
  created_by VARCHAR(64) NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  CONSTRAINT fk_commercial_legal_org FOREIGN KEY (organization_id) REFERENCES commercial_organizations(id),
  CONSTRAINT fk_commercial_legal_customer FOREIGN KEY (customer_id) REFERENCES commercial_customers(id),
  INDEX idx_commercial_legal_org (organization_id, status),
  INDEX idx_commercial_legal_customer (customer_id, status),
  INDEX idx_commercial_legal_jurisdiction (jurisdiction)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS commercial_accounts (
  id VARCHAR(64) PRIMARY KEY,
  customer_id VARCHAR(64) NOT NULL,
  legal_entity_id VARCHAR(64) NULL,
  account_name VARCHAR(180) NOT NULL,
  status VARCHAR(24) NOT NULL DEFAULT 'ACTIVE',
  created_by VARCHAR(64) NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  CONSTRAINT fk_commercial_account_customer FOREIGN KEY (customer_id) REFERENCES commercial_customers(id),
  CONSTRAINT fk_commercial_account_legal_entity FOREIGN KEY (legal_entity_id) REFERENCES commercial_legal_entities(id),
  INDEX idx_commercial_accounts_customer (customer_id, status),
  INDEX idx_commercial_accounts_legal_entity (legal_entity_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS commercial_relationships (
  id VARCHAR(64) PRIMARY KEY,
  account_id VARCHAR(64) NOT NULL,
  organization_id VARCHAR(64) NOT NULL,
  relationship_role VARCHAR(32) NOT NULL,
  status VARCHAR(24) NOT NULL DEFAULT 'ACTIVE',
  effective_from DATETIME(3) NOT NULL,
  effective_to DATETIME(3) NULL,
  created_by VARCHAR(64) NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  CONSTRAINT fk_commercial_relationship_account FOREIGN KEY (account_id) REFERENCES commercial_accounts(id),
  CONSTRAINT fk_commercial_relationship_org FOREIGN KEY (organization_id) REFERENCES commercial_organizations(id),
  UNIQUE KEY uk_commercial_relationship_start (account_id, organization_id, relationship_role, effective_from),
  INDEX idx_commercial_relationship_account (account_id, status, effective_from, effective_to),
  INDEX idx_commercial_relationship_org (organization_id, relationship_role, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS commercial_customer_organization_relationships (
  id VARCHAR(64) PRIMARY KEY,
  customer_id VARCHAR(64) NOT NULL,
  organization_id VARCHAR(64) NOT NULL,
  relationship_type VARCHAR(32) NOT NULL,
  status VARCHAR(24) NOT NULL DEFAULT 'ACTIVE',
  effective_from DATETIME(3) NOT NULL,
  effective_to DATETIME(3) NULL,
  created_by VARCHAR(64) NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  CONSTRAINT fk_commercial_customer_org_customer FOREIGN KEY (customer_id) REFERENCES commercial_customers(id),
  CONSTRAINT fk_commercial_customer_org_org FOREIGN KEY (organization_id) REFERENCES commercial_organizations(id),
  UNIQUE KEY uk_commercial_customer_org_start (customer_id, organization_id, relationship_type, effective_from),
  INDEX idx_commercial_customer_org_org (organization_id, status, effective_from, effective_to),
  INDEX idx_commercial_customer_org_customer (customer_id, status, effective_from, effective_to)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS commercial_organization_tenant_scopes (
  id VARCHAR(64) PRIMARY KEY,
  organization_id VARCHAR(64) NOT NULL,
  tenant_id VARCHAR(64) NOT NULL,
  status VARCHAR(24) NOT NULL DEFAULT 'ACTIVE',
  effective_from DATETIME(3) NOT NULL,
  effective_to DATETIME(3) NULL,
  created_by VARCHAR(64) NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  CONSTRAINT fk_commercial_org_scope_org FOREIGN KEY (organization_id) REFERENCES commercial_organizations(id),
  CONSTRAINT fk_commercial_org_scope_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  UNIQUE KEY uk_commercial_org_scope_start (organization_id, tenant_id, effective_from),
  INDEX idx_commercial_org_scope_tenant (tenant_id, status, effective_from, effective_to)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS commercial_customer_tenant_links (
  id VARCHAR(64) PRIMARY KEY,
  customer_id VARCHAR(64) NOT NULL,
  tenant_id VARCHAR(64) NOT NULL,
  account_id VARCHAR(64) NULL,
  status VARCHAR(24) NOT NULL DEFAULT 'ACTIVE',
  effective_from DATETIME(3) NOT NULL,
  effective_to DATETIME(3) NULL,
  evidence_reference VARCHAR(180) NOT NULL,
  approved_by VARCHAR(64) NOT NULL,
  created_by VARCHAR(64) NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  CONSTRAINT fk_commercial_customer_tenant_customer FOREIGN KEY (customer_id) REFERENCES commercial_customers(id),
  CONSTRAINT fk_commercial_customer_tenant_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT fk_commercial_customer_tenant_account FOREIGN KEY (account_id) REFERENCES commercial_accounts(id),
  UNIQUE KEY uk_commercial_customer_tenant_start (customer_id, tenant_id, effective_from),
  INDEX idx_commercial_customer_tenant_tenant (tenant_id, status, effective_from, effective_to)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO commercial_organizations
  (id, canonical_key, name, organization_type, status, created_by)
VALUES
  ('org-introsoft-root', 'INTROSOFT_ROOT', 'Introsoft', 'INTROSOFT', 'ACTIVE', 'system:migration:025');
