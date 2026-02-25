/**
 * Payment Service
 * Database operations for payments
 */

import { query } from '../config/database';
import { v4 as uuidv4 } from 'uuid';

export interface PaymentRecord {
  id: string;
  user_id: string;
  transaction_id: string;
  gateway: string;
  amount: number;
  fee: number;
  net_amount: number;
  currency: string;
  type: 'deposit' | 'withdrawal';
  status: string;
  metadata?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Create payment record
 */
export const createPaymentRecord = async (payment: {
  userId: string;
  transactionId: string;
  gateway: string;
  amount: number;
  fee: number;
  netAmount: number;
  currency: string;
  type: 'deposit' | 'withdrawal';
  status: string;
  metadata?: string;
}): Promise<PaymentRecord> => {
  const id = uuidv4();
  const now = new Date().toISOString();

  const result = await query(
    `INSERT INTO payments 
    (id, user_id, transaction_id, gateway, amount, fee, net_amount, currency, type, status, metadata, created_at, updated_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    RETURNING *`,
    [
      id,
      payment.userId,
      payment.transactionId,
      payment.gateway,
      payment.amount,
      payment.fee,
      payment.netAmount,
      payment.currency,
      payment.type,
      payment.status,
      payment.metadata || '{}',
      now,
      now,
    ]
  );

  return result.rows[0];
};

/**
 * Get payment record by transaction ID
 */
export const getPaymentRecord = async (transactionId: string): Promise<PaymentRecord | null> => {
  const result = await query(
    'SELECT * FROM payments WHERE transaction_id = $1 LIMIT 1',
    [transactionId]
  );

  return result.rows[0] || null;
};

/**
 * Get payment record by ID
 */
export const getPaymentById = async (id: string): Promise<PaymentRecord | null> => {
  const result = await query(
    'SELECT * FROM payments WHERE id = $1 LIMIT 1',
    [id]
  );

  return result.rows[0] || null;
};

/**
 * Update payment status
 */
export const updatePaymentStatus = async (
  transactionId: string,
  status: string
): Promise<PaymentRecord | null> => {
  const result = await query(
    'UPDATE payments SET status = $1, updated_at = $2 WHERE transaction_id = $3 RETURNING *',
    [status, new Date().toISOString(), transactionId]
  );

  return result.rows[0] || null;
};

/**
 * Get user payment history
 */
export const getUserPaymentHistory = async (
  userId: string,
  options: {
    limit?: number;
    offset?: number;
    type?: string;
    status?: string;
  } = {}
): Promise<PaymentRecord[]> => {
  const { limit = 10, offset = 0, type, status } = options;

  let sql = 'SELECT * FROM payments WHERE user_id = $1';
  const params: any[] = [userId];

  if (type) {
    sql += ` AND type = $${params.length + 1}`;
    params.push(type);
  }

  if (status) {
    sql += ` AND status = $${params.length + 1}`;
    params.push(status);
  }

  sql += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  params.push(limit, offset);

  const result = await query(sql, params);

  return result.rows;
};

/**
 * Get user total deposited
 */
export const getUserTotalDeposited = async (userId: string): Promise<number> => {
  const result = await query(
    `SELECT COALESCE(SUM(amount), 0) as total FROM payments 
     WHERE user_id = $1 AND type = 'deposit' AND status = 'completed'`,
    [userId]
  );

  return result.rows[0]?.total || 0;
};

/**
 * Get gateway transaction count
 */
export const getGatewayTransactionCount = async (
  gateway: string,
  days: number = 30
): Promise<number> => {
  const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const result = await query(
    `SELECT COUNT(*) as count FROM payments 
     WHERE gateway = $1 AND created_at >= $2`,
    [gateway, cutoffDate]
  );

  return result.rows[0]?.count || 0;
};

/**
 * Get gateway total volume
 */
export const getGatewayVolume = async (
  gateway: string,
  days: number = 30
): Promise<{ total: number; count: number }> => {
  const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const result = await query(
    `SELECT COALESCE(SUM(amount), 0) as total, COUNT(*) as count FROM payments 
     WHERE gateway = $1 AND status = 'completed' AND created_at >= $2`,
    [gateway, cutoffDate]
  );

  return {
    total: result.rows[0]?.total || 0,
    count: result.rows[0]?.count || 0,
  };
};

/**
 * Create refund record
 */
export const createRefundRecord = async (refund: {
  paymentId: string;
  amount: number;
  status: string;
}): Promise<any> => {
  const id = uuidv4();
  const now = new Date().toISOString();

  const result = await query(
    `INSERT INTO refunds 
    (id, payment_id, amount, status, created_at)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *`,
    [id, refund.paymentId, refund.amount, refund.status, now]
  );

  return result.rows[0];
};

/**
 * Get user total refunded
 */
export const getUserTotalRefunded = async (userId: string): Promise<number> => {
  const result = await query(
    `SELECT COALESCE(SUM(r.amount), 0) as total FROM refunds r
     JOIN payments p ON r.payment_id = p.transaction_id
     WHERE p.user_id = $1 AND r.status = 'completed'`,
    [userId]
  );

  return result.rows[0]?.total || 0;
};
