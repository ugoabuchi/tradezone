import { query } from '../config/database';
import { Wallet } from '../types';

export const createWallet = async (userId: string, currency: string, balance: number = 0): Promise<Wallet> => {
  const result = await query(
    `INSERT INTO wallets (user_id, currency, balance) VALUES ($1, $2, $3) 
     ON CONFLICT (user_id, currency) DO UPDATE SET balance = balance RETURNING *`,
    [userId, currency, balance]
  );
  return result.rows[0];
};

export const getWalletByUserAndCurrency = async (userId: string, currency: string): Promise<Wallet | null> => {
  const result = await query(
    'SELECT * FROM wallets WHERE user_id = $1 AND currency = $2',
    [userId, currency]
  );
  return result.rows[0] || null;
};

export const getWalletsByUser = async (userId: string): Promise<Wallet[]> => {
  const result = await query('SELECT * FROM wallets WHERE user_id = $1 ORDER BY currency', [userId]);
  return result.rows;
};

export const updateWalletBalance = async (walletId: string, amount: number): Promise<Wallet> => {
  const result = await query(
    `UPDATE wallets SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP 
     WHERE id = $2 RETURNING *`,
    [amount, walletId]
  );
  return result.rows[0];
};

export const getWalletBalance = async (userId: string, currency: string): Promise<number> => {
  const wallet = await getWalletByUserAndCurrency(userId, currency);
  return wallet ? Number(wallet.balance) : 0;
};
