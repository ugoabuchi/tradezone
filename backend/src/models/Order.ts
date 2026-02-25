import { query } from '../config/database';
import { Order } from '../types';
import { v4 as uuidv4 } from 'uuid';

export const createOrder = async (
  userId: string,
  symbol: string,
  type: 'buy' | 'sell',
  price: number,
  quantity: number
): Promise<Order> => {
  const result = await query(
    `INSERT INTO orders (id, user_id, symbol, type, price, quantity, status) 
     VALUES ($1, $2, $3, $4, $5, $6, 'pending') RETURNING *`,
    [uuidv4(), userId, symbol, type, price, quantity]
  );
  return result.rows[0];
};

export const getOrderById = async (orderId: string): Promise<Order | null> => {
  const result = await query('SELECT * FROM orders WHERE id = $1', [orderId]);
  return result.rows[0] || null;
};

export const getOrdersByUser = async (userId: string, status?: string): Promise<Order[]> => {
  if (status) {
    const result = await query('SELECT * FROM orders WHERE user_id = $1 AND status = $2 ORDER BY created_at DESC', [
      userId,
      status,
    ]);
    return result.rows;
  }
  const result = await query('SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
  return result.rows;
};

export const updateOrderStatus = async (orderId: string, status: string): Promise<Order> => {
  const filledAt = status === 'filled' ? new Date() : null;
  const result = await query(
    `UPDATE orders SET status = $1, filled_at = $2 WHERE id = $3 RETURNING *`,
    [status, filledAt, orderId]
  );
  return result.rows[0];
};

export const cancelOrder = async (orderId: string): Promise<Order> => {
  return updateOrderStatus(orderId, 'cancelled');
};

export const getPendingOrdersBySymbol = async (symbol: string): Promise<Order[]> => {
  const result = await query(
    'SELECT * FROM orders WHERE symbol = $1 AND status = $2 ORDER BY created_at ASC',
    [symbol, 'pending']
  );
  return result.rows;
};

export const getOrderBook = async (symbol: string) => {
  const result = await query(
    `SELECT type, price, SUM(quantity) as total_quantity, COUNT(*) as order_count
     FROM orders WHERE symbol = $1 AND status = 'pending'
     GROUP BY type, price ORDER BY price DESC`,
    [symbol]
  );
  return {
    bids: result.rows.filter((r) => r.type === 'buy'),
    asks: result.rows.filter((r) => r.type === 'sell'),
  };
};
