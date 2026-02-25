-- Create refunds table for managing payment refunds (MySQL compatible)
CREATE TABLE IF NOT EXISTS refunds (
  id VARCHAR(36) PRIMARY KEY NOT NULL DEFAULT (UUID()),
  payment_id VARCHAR(36) NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  reason VARCHAR(255),
  status ENUM('pending','processing','completed','failed') NOT NULL DEFAULT 'pending',
  refund_reference VARCHAR(255),
  metadata JSON,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  completed_at TIMESTAMP NULL,
  
  INDEX idx_payment_id (payment_id),
  INDEX idx_status (status),
  FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- updated_at column uses ON UPDATE clause instead of trigger
