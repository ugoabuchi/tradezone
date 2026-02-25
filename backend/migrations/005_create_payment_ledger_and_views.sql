-- Create payment ledger table for audit trail and double-entry bookkeeping
CREATE TABLE IF NOT EXISTS payment_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  transaction_type VARCHAR(50) NOT NULL, -- 'credit', 'debit', 'refund', 'fee'
  amount DECIMAL(15, 2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  account_before DECIMAL(15, 2),
  account_after DECIMAL(15, 2),
  description VARCHAR(255),
  reference_id VARCHAR(255),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_user_id_created_at (user_id, created_at),
  INDEX idx_payment_id (payment_id),
  INDEX idx_transaction_type (transaction_type)
);

-- Create view for payment statistics
CREATE OR REPLACE VIEW payment_statistics AS
SELECT
  DATE(p.created_at) as date,
  p.gateway,
  p.currency,
  COUNT(*) as total_transactions,
  SUM(CASE WHEN p.status = 'completed' THEN 1 ELSE 0 END) as successful_transactions,
  SUM(CASE WHEN p.status = 'failed' THEN 1 ELSE 0 END) as failed_transactions,
  COALESCE(SUM(CASE WHEN p.status = 'completed' THEN p.amount ELSE 0 END), 0) as total_volume,
  COALESCE(SUM(CASE WHEN p.status = 'completed' THEN p.fee ELSE 0 END), 0) as total_fees,
  COALESCE(AVG(CASE WHEN p.status = 'completed' THEN p.amount ELSE NULL END), 0) as avg_transaction_amount
FROM payments p
WHERE p.created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(p.created_at), p.gateway, p.currency;

-- Create view for gateway health metrics
CREATE OR REPLACE VIEW gateway_health_metrics AS
SELECT
  pgc.gateway_name,
  pgc.display_name,
  pgc.enabled,
  COUNT(p.id) as total_transactions_30d,
  SUM(CASE WHEN p.status = 'completed' THEN 1 ELSE 0 END) as successful_transactions,
  ROUND(
    100.0 * SUM(CASE WHEN p.status = 'completed' THEN 1 ELSE 0 END) / 
    NULLIF(COUNT(p.id), 0),
    2
  ) as success_rate,
  COALESCE(SUM(CASE WHEN p.status = 'completed' THEN p.amount ELSE 0 END), 0) as total_volume,
  pgc.last_tested_at,
  pgc.last_test_result
FROM payment_gateway_configs pgc
LEFT JOIN payments p ON pgc.gateway_name = p.gateway 
  AND p.created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY pgc.id, pgc.gateway_name, pgc.display_name, pgc.enabled, pgc.last_tested_at, pgc.last_test_result;
