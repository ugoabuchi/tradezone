import { query } from '../config/database';
import { Transaction } from '../types';
import { v4 as uuidv4 } from 'uuid';

export const createTransaction = async (
  userId: string,
  fromCurrency: string,
  toCurrency: string,
  amount: number,
  price: number
): Promise<Transaction> => {
  const result = await query(
    `INSERT INTO transactions (id, user_id, from_currency, to_currency, amount, price) 
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [uuidv4(), userId, fromCurrency, toCurrency, amount, price]
  );
  return result.rows[0];
};

export const getTransactionsByUser = async (userId: string, limit: number = 100): Promise<Transaction[]> => {
  const result = await query(
    'SELECT * FROM transactions WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2',
    [userId, limit]
  );
  return result.rows;
};

export const getTransactionById = async (transactionId: string): Promise<Transaction | null> => {
  const result = await query('SELECT * FROM transactions WHERE id = $1', [transactionId]);
  return result.rows[0] || null;
};
