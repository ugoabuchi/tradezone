import { query } from '../config/database';
import { User } from '../types';

export const createUser = async (email: string, password_hash: string, full_name: string): Promise<User> => {
  const result = await query(
    `INSERT INTO users (email, password_hash, full_name) VALUES ($1, $2, $3) RETURNING *`,
    [email, password_hash, full_name]
  );
  return result.rows[0];
};

export const getUserByEmail = async (email: string): Promise<User | null> => {
  const result = await query('SELECT * FROM users WHERE email = $1', [email]);
  return result.rows[0] || null;
};

export const getUserById = async (id: string): Promise<User | null> => {
  const result = await query('SELECT * FROM users WHERE id = $1', [id]);
  return result.rows[0] || null;
};

export const getAllUsers = async (): Promise<User[]> => {
  const result = await query('SELECT id, email, full_name, created_at, updated_at FROM users');
  return result.rows;
};
