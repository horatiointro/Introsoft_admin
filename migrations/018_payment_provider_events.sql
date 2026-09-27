CREATE TABLE IF NOT EXISTS payment_provider_events (
  event_id VARCHAR(120) PRIMARY KEY,
  provider VARCHAR(24) NOT NULL,
  event_type VARCHAR(120) NOT NULL,
  processed_at DATETIME(3) NOT NULL,
  INDEX idx_payment_event_provider (provider, processed_at)
);
