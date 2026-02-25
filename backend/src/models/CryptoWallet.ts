import { query } from '../config/database';
import { CryptoWalletAddress } from '../types';
import { v4 as uuidv4 } from 'uuid';

export const createWalletAddress = async (
  userId: string,
  blockchain: string,
  currency: string,
  publicAddress: string,
  options?: {
    privateKeyEncrypted?: string;
    label?: string;
    isImported?: boolean;
    isPrimary?: boolean;
  }
): Promise<CryptoWalletAddress> => {
  const result = await query(
    `INSERT INTO crypto_wallet_addresses 
    (id, user_id, blockchain, currency, public_address, private_key_encrypted, label, is_imported, is_primary) 
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
    RETURNING *`,
    [
      uuidv4(),
      userId,
      blockchain,
      currency,
      publicAddress,
      options?.privateKeyEncrypted || null,
      options?.label || null,
      options?.isImported || false,
      options?.isPrimary || false,
    ]
  );
  return result.rows[0];
};

export const getWalletAddressesByUser = async (userId: string): Promise<CryptoWalletAddress[]> => {
  const result = await query(
    'SELECT * FROM crypto_wallet_addresses WHERE user_id = $1 ORDER BY is_primary DESC, created_at ASC',
    [userId]
  );
  return result.rows;
};

export const getPrimaryWalletAddress = async (userId: string, currency: string): Promise<CryptoWalletAddress | null> => {
  const result = await query(
    'SELECT * FROM crypto_wallet_addresses WHERE user_id = $1 AND currency = $2 AND is_primary = true',
    [userId, currency]
  );
  return result.rows[0] || null;
};

export const getWalletAddressById = async (addressId: string): Promise<CryptoWalletAddress | null> => {
  const result = await query('SELECT * FROM crypto_wallet_addresses WHERE id = $1', [addressId]);
  return result.rows[0] || null;
};

export const updateWalletAddressPrimary = async (
  userId: string,
  currency: string,
  addressId: string
): Promise<CryptoWalletAddress> => {
  // First, unset current primary
  await query(
    'UPDATE crypto_wallet_addresses SET is_primary = false WHERE user_id = $1 AND currency = $2',
    [userId, currency]
  );

  // Then set new primary
  const result = await query(
    'UPDATE crypto_wallet_addresses SET is_primary = true WHERE id = $1 RETURNING *',
    [addressId]
  );
  return result.rows[0];
};

export const deleteWalletAddress = async (addressId: string): Promise<void> => {
  await query('DELETE FROM crypto_wallet_addresses WHERE id = $1', [addressId]);
};
