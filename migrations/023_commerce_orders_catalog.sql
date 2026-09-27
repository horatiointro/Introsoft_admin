ALTER TABLE tenants ADD COLUMN invoice_day TINYINT UNSIGNED NOT NULL DEFAULT 24;

CREATE TABLE IF NOT EXISTS billing_products (
  id VARCHAR(100) PRIMARY KEY,
  sku VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(180) NOT NULL,
  description VARCHAR(1000) NOT NULL,
  category VARCHAR(40) NOT NULL,
  billing_unit VARCHAR(40) NOT NULL,
  recurring TINYINT(1) NOT NULL DEFAULT 0,
  price DECIMAL(18,6) NOT NULL DEFAULT 0,
  currency CHAR(3) NOT NULL DEFAULT 'ZAR',
  cost_markup_percent DECIMAL(7,3) NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  sort_order INT NOT NULL DEFAULT 100,
  payload_json JSON NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX idx_billing_products_active (is_active, category, sort_order)
);

CREATE TABLE IF NOT EXISTS billing_orders (
  id VARCHAR(100) PRIMARY KEY,
  order_number VARCHAR(40) NOT NULL UNIQUE,
  tenant_id VARCHAR(80) NOT NULL,
  tenant_name VARCHAR(200) NOT NULL,
  status VARCHAR(24) NOT NULL DEFAULT 'active',
  currency CHAR(3) NOT NULL,
  subtotal DECIMAL(18,6) NOT NULL DEFAULT 0,
  discount_amount DECIMAL(18,6) NOT NULL DEFAULT 0,
  total DECIMAL(18,6) NOT NULL DEFAULT 0,
  source VARCHAR(40) NOT NULL,
  source_reference VARCHAR(120) NULL,
  created_by VARCHAR(190) NOT NULL,
  created_at DATETIME(3) NOT NULL,
  payload_json JSON NOT NULL,
  INDEX idx_billing_orders_tenant_status (tenant_id,status,created_at),
  INDEX idx_billing_orders_created (created_at)
);

CREATE TABLE IF NOT EXISTS billing_order_lines (
  id VARCHAR(100) PRIMARY KEY,
  order_id VARCHAR(100) NOT NULL,
  tenant_id VARCHAR(80) NOT NULL,
  product_id VARCHAR(100) NOT NULL,
  description VARCHAR(240) NOT NULL,
  quantity DECIMAL(18,4) NOT NULL,
  unit_price DECIMAL(18,6) NOT NULL,
  line_total DECIMAL(18,6) NOT NULL,
  currency CHAR(3) NOT NULL,
  recurring TINYINT(1) NOT NULL DEFAULT 0,
  billing_unit VARCHAR(40) NOT NULL,
  active TINYINT(1) NOT NULL DEFAULT 1,
  last_invoiced_period CHAR(7) NULL,
  payload_json JSON NOT NULL,
  created_at DATETIME(3) NOT NULL,
  INDEX idx_billing_order_lines_cycle (tenant_id,active,recurring,last_invoiced_period),
  INDEX idx_billing_order_lines_order (order_id)
);

INSERT INTO billing_products (id,sku,name,description,category,billing_unit,recurring,price,currency,cost_markup_percent,is_active,sort_order,payload_json) VALUES
('prod-ai-seat','AI-SEAT-1','Secure AI access · single user','Governed AI access with tenant API key controls, default guardrails, usage attribution and audit history. Model inference is billed separately at measured cost.','access','user_month',1,85,'ZAR',0,1,10,JSON_OBJECT('recommended',true,'seatCount',1)),
('prod-privacy','PRIVACY-CORE','POPIA + GDPR workspace','Privacy operations workspace: policy evidence, request tracking, officer records and audit workflows. Software supports compliance work; it is not legal advice or a guarantee of compliance.','compliance','tenant_month',1,247,'ZAR',0,1,20,JSON_OBJECT('recommended',true)),
('prod-team-5','TEAM-5','Secure team · 5 users','Five governed AI seats with shared administration and core guardrails. Inference remains usage-priced.','bundle','team_5_month',1,599,'ZAR',0,1,30,JSON_OBJECT('seatCount',5,'listValue',672,'discountPercent',10.9)),
('prod-team-10','TEAM-10','Secure team · 10 users','Ten governed AI seats with shared administration and core guardrails. Inference remains usage-priced.','bundle','team_10_month',1,974,'ZAR',0,1,40,JSON_OBJECT('seatCount',10,'listValue',1097,'discountPercent',11.2)),
('prod-team-15','TEAM-15','Secure team · 15 users','Fifteen governed AI seats with shared administration and core guardrails. Inference remains usage-priced.','bundle','team_15_month',1,1299,'ZAR',0,1,50,JSON_OBJECT('seatCount',15,'listValue',1522,'discountPercent',14.7)),
('prod-team-20','TEAM-20','Secure team · 20 users','Twenty governed AI seats with shared administration and core guardrails. Inference remains usage-priced.','bundle','team_20_month',1,1574,'ZAR',0,1,60,JSON_OBJECT('seatCount',20,'listValue',1947,'discountPercent',19.1)),
('prod-api-key','API-KEY-MONTH','Managed API key','Monthly key governance charge for rotation, scoped access, usage attribution and lifecycle controls.','platform','api_key_month',1,25,'ZAR',0,1,70,JSON_OBJECT('perKey',true)),
('prod-capability','CAPABILITY-MONTH','Additional governed capability','Monthly add-on for a separately provisioned governed application capability.','platform','capability_month',1,25,'ZAR',0,1,80,JSON_OBJECT('perCapability',true)),
('prod-request-1k','REQUEST-1K','Governed request pack · 1,000','Successful ALTIL gateway orchestration and policy processing, per 1,000 requests; provider inference is charged separately.','usage','per_1000_requests',0,15,'ZAR',0,1,90,JSON_OBJECT('requestCount',1000)),
('prod-inference-margin','INFERENCE-COST-PLUS','Provider inference · cost plus','Metered from provider-reported cost, with a configurable platform margin. Provider cost is itemised separately on the invoice.','usage','provider_cost_plus',0,0,'USD',20,1,100,JSON_OBJECT('pricingMethod','provider_cost_plus'))
ON DUPLICATE KEY UPDATE sku=VALUES(sku);
