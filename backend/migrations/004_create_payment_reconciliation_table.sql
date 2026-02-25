-- Create payment reconciliation table for tracking and reconciling payments with gateway records
CREATE TABLE IF NOT EXISTS payment_reconciliation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  gateway VARCHAR(50) NOT NULL,
  gateway_transaction_id VARCHAR(255),
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  last_gateway_status VARCHAR(50),
  discrepancy_detected BOOLEAN DEFAULT false,
  discrepancy_reason TEXT,
  reconciliation_date TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(payment_id, gateway),
  INDEX idx_payment_id (payment_id),
  INDEX idx_gateway_transaction_id (gateway_transaction_id),
  INDEX idx_discrepancy (discrepancy_detected)
);

-- Create trigger to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_payment_reconciliation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_payment_reconciliation_timestamp ON payment_reconciliation;
CREATE TRIGGER trigger_update_payment_reconciliation_timestamp
  BEFORE UPDATE ON payment_reconciliation
  FOR EACH ROW
  EXECUTE FUNCTION update_payment_reconciliation_timestamp();
