import bcryptjs from 'bcryptjs';
import { generateToken } from '../config/jwt';
import { createUser, getUserByEmail } from '../models/User';
import { createWallet } from '../models/Wallet';

const SALT_ROUNDS = 10;

export const hashPassword = async (password: string): Promise<string> => {
  return bcryptjs.hash(password, SALT_ROUNDS);
};

export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return bcryptjs.compare(password, hash);
};

export const registerUser = async (
  email: string,
  password: string,
  fullName: string
): Promise<{ token: string; userId: string }> => {
  const existingUser = await getUserByEmail(email);
  if (existingUser) {
    throw new Error('User already exists');
  }

  const passwordHash = await hashPassword(password);
  const user = await createUser(email, passwordHash, fullName);

  // Create default wallets with demo balance
  await createWallet(user.id, 'USD', 10000); // $10,000 starting balance
  await createWallet(user.id, 'BTC', 0);
  await createWallet(user.id, 'ETH', 0);

  const token = generateToken({
    userId: user.id,
    email: user.email,
  });

  return { token, userId: user.id };
};

export const loginUser = async (
  email: string,
  password: string
): Promise<{ token: string; userId: string; email: string }> => {
  const user = await getUserByEmail(email);
  if (!user) {
    throw new Error('User not found');
  }

  const isPasswordValid = await comparePassword(password, user.password_hash);
  if (!isPasswordValid) {
    throw new Error('Invalid password');
  }

  const token = generateToken({
    userId: user.id,
    email: user.email,
  });

  return { token, userId: user.id, email: user.email };
};
