-- Create payments table for tracking all payment transactions (MySQL compatible)
CREATE TABLE IF NOT EXISTS payments (
  id VARCHAR(36) PRIMARY KEY NOT NULL DEFAULT (UUID()),
  user_id VARCHAR(36) NOT NULL,
  transaction_id VARCHAR(255) NOT NULL UNIQUE,
  gateway VARCHAR(50) NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  fee DECIMAL(15, 2) DEFAULT 0,
  net_amount DECIMAL(15, 2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  type ENUM('deposit','withdrawal') NOT NULL,
  status ENUM('pending','processing','completed','failed','cancelled') NOT NULL DEFAULT 'pending',
  payment_method VARCHAR(100),
  metadata JSON,
  error_message TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  completed_at TIMESTAMP NULL,
  
  INDEX idx_user_id_created_at (user_id, created_at),
  INDEX idx_transaction_id (transaction_id),
  INDEX idx_gateway_status (gateway, status),
  INDEX idx_status (status),
  INDEX idx_user_type (user_id, type),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Additional indexes (MySQL does not support partial indexes)
CREATE INDEX IF NOT EXISTS idx_payments_user_gateway ON payments(user_id, gateway);

-- updated_at column already updates on change via ON UPDATE CURRENT_TIMESTAMP
