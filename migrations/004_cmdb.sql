-- ==============================================================================
-- ALTIL SECURE AI MIGRATION 004: Configuration Management Database (CMDB)
-- ==============================================================================

-- 1. CMDB Item Types Table
CREATE TABLE IF NOT EXISTS cmdb_item_types (
  id VARCHAR(64) PRIMARY KEY,
  type_code VARCHAR(64) NOT NULL UNIQUE, -- TENANT, APPLICATION, GATEWAY, POLICY_ENGINE, ROUTER, PROVIDER, MODEL, DATABASE, INFRA_NODE
  name VARCHAR(128) NOT NULL,
  icon_name VARCHAR(64) NOT NULL DEFAULT 'Server',
  description TEXT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. CMDB Configuration Items (CI) Table
CREATE TABLE IF NOT EXISTS cmdb_items (
  id VARCHAR(64) PRIMARY KEY,
  item_type_id VARCHAR(64) NOT NULL,
  tenant_id VARCHAR(64) NULL,
  ci_code VARCHAR(128) NOT NULL UNIQUE, -- e.g. 'CI-GW-PRIMARY', 'CI-TENANT-CUST-1'
  name VARCHAR(255) NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'OPERATIONAL', -- OPERATIONAL, DEGRADED, MAINTENANCE, RETIRED
  environment VARCHAR(32) NOT NULL DEFAULT 'PRODUCTION',
  ip_endpoint VARCHAR(255) NULL,
  owner_email VARCHAR(255) NULL,
  criticality VARCHAR(16) NOT NULL DEFAULT 'HIGH', -- LOW, MEDIUM, HIGH, MISSION_CRITICAL
  attributes JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_ci_type FOREIGN KEY (item_type_id) REFERENCES cmdb_item_types(id),
  CONSTRAINT fk_ci_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  INDEX idx_ci_type (item_type_id),
  INDEX idx_ci_tenant (tenant_id),
  INDEX idx_ci_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. CMDB Dependencies / Topology Edges Table
CREATE TABLE IF NOT EXISTS cmdb_dependencies (
  id VARCHAR(64) PRIMARY KEY,
  source_ci_id VARCHAR(64) NOT NULL,
  target_ci_id VARCHAR(64) NOT NULL,
  relationship_type VARCHAR(64) NOT NULL DEFAULT 'DEPENDS_ON', -- DEPENDS_ON, HOSTS, USES, ROUTES_TO, PROVIDES, PROTECTED_BY
  impact_weight DECIMAL(4, 2) NOT NULL DEFAULT 1.00,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_dep_source FOREIGN KEY (source_ci_id) REFERENCES cmdb_items(id) ON DELETE CASCADE,
  CONSTRAINT fk_dep_target FOREIGN KEY (target_ci_id) REFERENCES cmdb_items(id) ON DELETE CASCADE,
  UNIQUE KEY uk_ci_relationship (source_ci_id, target_ci_id, relationship_type),
  INDEX idx_dep_source (source_ci_id),
  INDEX idx_dep_target (target_ci_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert Standard CMDB Item Types
INSERT INTO cmdb_item_types (id, type_code, name, icon_name, description) VALUES
('type_tenant', 'TENANT', 'Enterprise Tenant Organization', 'Building2', 'Customer organization boundary'),
('type_app', 'APPLICATION', 'Tenant Micro-Application', 'Layers', 'Client application consuming AI models'),
('type_gateway', 'GATEWAY', 'ALTIL AI Gateway Node', 'ShieldCheck', 'Core authentication & dispatch gateway'),
('type_policy', 'POLICY_ENGINE', 'POPIA / GDPR Policy Engine', 'FileCheck', 'Statutory redaction and DLP guardrail module'),
('type_router', 'ROUTER', 'Dynamic Capability Router', 'Network', 'Cost, latency, and capability routing broker'),
('type_provider', 'PROVIDER', 'Managed AI Provider Endpoint', 'Cpu', 'External or private foundation model provider'),
('type_model', 'MODEL', 'Foundation AI Model', 'Bot', 'Specific LLM or reasoning model endpoint'),
('type_db', 'DATABASE', 'MariaDB 10.11 Enterprise Store', 'Database', 'Persistent relational storage cluster')
ON DUPLICATE KEY UPDATE name=VALUES(name);
