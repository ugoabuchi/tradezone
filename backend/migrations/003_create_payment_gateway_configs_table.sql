-- Create payment gateway configurations table for admin management
CREATE TABLE IF NOT EXISTS payment_gateway_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gateway_name VARCHAR(50) NOT NULL UNIQUE,
  display_name VARCHAR(100) NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  is_default BOOLEAN NOT NULL DEFAULT false,
  fee_percentage DECIMAL(5, 2) DEFAULT 0,
  fixed_fee DECIMAL(15, 2) DEFAULT 0,
  min_amount DECIMAL(15, 2) DEFAULT 10,
  max_amount DECIMAL(15, 2) DEFAULT 100000,
  supported_currencies TEXT[] DEFAULT ARRAY['USD', 'EUR', 'GBP'],
  api_key_encrypted VARCHAR(500),
  api_secret_encrypted VARCHAR(500),
  webhook_secret_encrypted VARCHAR(500),
  webhook_url VARCHAR(500),
  configuration JSONB,
  rate_limit_enabled BOOLEAN DEFAULT false,
  rate_limit_requests_per_hour INT DEFAULT 1000,
  retry_attempts INT DEFAULT 3,
  timeout_seconds INT DEFAULT 30,
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_tested_at TIMESTAMP,
  last_test_result VARCHAR(20), -- 'success', 'failed'
  
  INDEX idx_gateway_name (gateway_name),
  INDEX idx_enabled (enabled)
);

-- Create trigger to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_payment_gateway_configs_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_payment_gateway_configs_timestamp ON payment_gateway_configs;
CREATE TRIGGER trigger_update_payment_gateway_configs_timestamp
  BEFORE UPDATE ON payment_gateway_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_payment_gateway_configs_timestamp();

-- Insert default gateway configurations
INSERT INTO payment_gateway_configs (
  gateway_name,
  display_name,
  enabled,
  is_default,
  fee_percentage,
  fixed_fee,
  supported_currencies
) VALUES
  ('stripe', 'Stripe', true, true, 2.9, 0.30, ARRAY['USD', 'EUR', 'GBP', 'JPY', 'AUD']),
  ('paypal', 'PayPal', true, false, 3.49, 0.30, ARRAY['USD', 'EUR', 'GBP', 'JPY', 'AUD']),
  ('paystack', 'Paystack', true, false, 1.5, 0, ARRAY['NGN', 'GHS', 'ZAR', 'KES', 'USD'])
ON CONFLICT (gateway_name) DO NOTHING;
