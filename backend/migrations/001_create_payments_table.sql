-- Create payments table for tracking all payment transactions
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  transaction_id VARCHAR(255) NOT NULL UNIQUE,
  gateway VARCHAR(50) NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  fee DECIMAL(15, 2) DEFAULT 0,
  net_amount DECIMAL(15, 2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  type VARCHAR(20) NOT NULL CHECK (type IN ('deposit', 'withdrawal')),
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  payment_method VARCHAR(100),
  metadata JSONB,
  error_message TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  
  -- Indexes for common queries
  INDEX idx_user_id_created_at (user_id, created_at),
  INDEX idx_transaction_id (transaction_id),
  INDEX idx_gateway_status (gateway, status),
  INDEX idx_status (status),
  INDEX idx_user_type (user_id, type)
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_payments_user_gateway ON payments(user_id, gateway);
CREATE INDEX IF NOT EXISTS idx_payments_completed_at ON payments(completed_at) WHERE completed_at IS NOT NULL;

-- Create trigger to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_payments_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_payments_timestamp ON payments;
CREATE TRIGGER trigger_update_payments_timestamp
  BEFORE UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_payments_timestamp();
