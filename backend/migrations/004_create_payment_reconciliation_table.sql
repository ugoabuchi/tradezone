-- Create payment reconciliation table for tracking and reconciling payments with gateway records (MySQL compatible)
CREATE TABLE IF NOT EXISTS payment_reconciliation (
  id VARCHAR(36) PRIMARY KEY NOT NULL DEFAULT (UUID()),
  payment_id VARCHAR(36) NOT NULL,
  gateway VARCHAR(50) NOT NULL,
  gateway_transaction_id VARCHAR(255),
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  last_gateway_status VARCHAR(50),
  discrepancy_detected BOOLEAN DEFAULT false,
  discrepancy_reason TEXT,
  reconciliation_date TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  UNIQUE KEY unique_payment_gateway (payment_id, gateway),
  INDEX idx_payment_id (payment_id),
  INDEX idx_gateway_transaction_id (gateway_transaction_id),
  INDEX idx_discrepancy (discrepancy_detected),
  FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- updated_at handled with ON UPDATE clause
