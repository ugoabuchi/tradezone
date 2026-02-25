-- Create payment gateway configurations table for admin management (MySQL compatible)
CREATE TABLE IF NOT EXISTS payment_gateway_configs (
  id VARCHAR(36) PRIMARY KEY NOT NULL DEFAULT (UUID()),
  gateway_name VARCHAR(50) NOT NULL UNIQUE,
  display_name VARCHAR(100) NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  is_default BOOLEAN NOT NULL DEFAULT false,
  fee_percentage DECIMAL(5, 2) DEFAULT 0,
  fixed_fee DECIMAL(15, 2) DEFAULT 0,
  min_amount DECIMAL(15, 2) DEFAULT 10,
  max_amount DECIMAL(15, 2) DEFAULT 100000,
  supported_currencies JSON DEFAULT JSON_ARRAY('USD','EUR','GBP'),
  api_key_encrypted VARCHAR(500),
  api_secret_encrypted VARCHAR(500),
  webhook_secret_encrypted VARCHAR(500),
  webhook_url VARCHAR(500),
  configuration JSON,
  rate_limit_enabled BOOLEAN DEFAULT false,
  rate_limit_requests_per_hour INT DEFAULT 1000,
  retry_attempts INT DEFAULT 3,
  timeout_seconds INT DEFAULT 30,
  metadata JSON,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  last_tested_at TIMESTAMP,
  last_test_result VARCHAR(20), -- 'success', 'failed'
  
  INDEX idx_gateway_name (gateway_name),
  INDEX idx_enabled (enabled)
) ENGINE=InnoDB;

-- updated_at handled via ON UPDATE clause

-- Insert default gateway configurations (ignore duplicates)
INSERT INTO payment_gateway_configs (
  gateway_name,
  display_name,
  enabled,
  is_default,
  fee_percentage,
  fixed_fee,
  supported_currencies
) VALUES
  ('stripe', 'Stripe', true, true, 2.9, 0.30, JSON_ARRAY('USD', 'EUR', 'GBP', 'JPY', 'AUD')),
  ('paypal', 'PayPal', true, false, 3.49, 0.30, JSON_ARRAY('USD', 'EUR', 'GBP', 'JPY', 'AUD')),
  ('paystack', 'Paystack', true, false, 1.5, 0, JSON_ARRAY('NGN', 'GHS', 'ZAR', 'KES', 'USD'))
ON DUPLICATE KEY UPDATE gateway_name=gateway_name;
