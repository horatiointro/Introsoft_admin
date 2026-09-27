CREATE TABLE IF NOT EXISTS platform_currency_settings (
  id TINYINT UNSIGNED NOT NULL PRIMARY KEY,
  accounting_currency CHAR(3) NOT NULL DEFAULT 'USD',
  default_display_currency CHAR(3) NOT NULL DEFAULT 'USD',
  default_locale VARCHAR(32) NOT NULL DEFAULT 'en-US',
  rate_stale_after_hours INT UNSIGNED NOT NULL DEFAULT 24,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  updated_by VARCHAR(190) NOT NULL DEFAULT 'system'
);

CREATE TABLE IF NOT EXISTS billing_fx_rates (
  currency CHAR(3) NOT NULL PRIMARY KEY,
  currency_name VARCHAR(100) NOT NULL,
  units_per_usd DECIMAL(24,12) NOT NULL,
  source VARCHAR(120) NOT NULL,
  as_of TIMESTAMP NOT NULL,
  updated_by VARCHAR(190) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT chk_billing_fx_positive CHECK (units_per_usd > 0)
);

CREATE TABLE IF NOT EXISTS billing_fx_rate_history (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  currency CHAR(3) NOT NULL,
  units_per_usd DECIMAL(24,12) NOT NULL,
  source VARCHAR(120) NOT NULL,
  as_of TIMESTAMP NOT NULL,
  changed_by VARCHAR(190) NOT NULL,
  INDEX idx_fx_rate_history_currency_date (currency, as_of)
);

INSERT INTO platform_currency_settings (id, accounting_currency, default_display_currency, default_locale, rate_stale_after_hours, updated_by)
VALUES (1, 'USD', 'USD', 'en-US', 24, 'system')
ON DUPLICATE KEY UPDATE accounting_currency = 'USD';

INSERT INTO billing_fx_rates (currency, currency_name, units_per_usd, source, as_of, updated_by)
VALUES ('USD', 'US Dollar', 1, 'ALTIL accounting base', UTC_TIMESTAMP(), 'system')
ON DUPLICATE KEY UPDATE units_per_usd = 1;

INSERT INTO billing_fx_rate_history (currency, units_per_usd, source, as_of, changed_by)
SELECT 'USD', 1, 'ALTIL accounting base', UTC_TIMESTAMP(), 'system'
WHERE NOT EXISTS (SELECT 1 FROM billing_fx_rate_history WHERE currency = 'USD');
