import { query } from '../config/database';
import { NFTHolding } from '../types';
import { v4 as uuidv4 } from 'uuid';

export const createNFTHolding = async (
  userId: string,
  data: {
    contractAddress: string;
    tokenId: string;
    name: string;
    description?: string;
    imageUrl?: string;
    collectionName: string;
    blockchain: string;
    rarityScore?: number;
    acquiredPrice?: number;
    currentPrice?: number;
  }
): Promise<NFTHolding> => {
  const id = uuidv4();
  const result = await query(
    `INSERT INTO nft_holdings 
    (id, user_id, contract_address, token_id, name, description, image_url, 
     collection_name, blockchain, rarity_score, acquired_price, current_price, status)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'holding')
    RETURNING *`,
    [
      id,
      userId,
      data.contractAddress,
      data.tokenId,
      data.name,
      data.description || null,
      data.imageUrl || null,
      data.collectionName,
      data.blockchain,
      data.rarityScore || null,
      data.acquiredPrice || null,
      data.currentPrice || null,
    ]
  );
  return result.rows[0];
};

export const getNFTHoldings = async (userId: string): Promise<NFTHolding[]> => {
  const result = await query(
    'SELECT * FROM nft_holdings WHERE user_id = $1 AND status = $2 ORDER BY created_at DESC',
    [userId, 'holding']
  );
  return result.rows;
};

export const getNFTHolding = async (nftId: string): Promise<NFTHolding | null> => {
  const result = await query('SELECT * FROM nft_holdings WHERE id = $1', [nftId]);
  return result.rows[0] || null;
};

export const getNFTByTokenId = async (
  contractAddress: string,
  tokenId: string
): Promise<NFTHolding | null> => {
  const result = await query(
    'SELECT * FROM nft_holdings WHERE contract_address = $1 AND token_id = $2 LIMIT 1',
    [contractAddress, tokenId]
  );
  return result.rows[0] || null;
};

export const updateNFTHolding = async (
  nftId: string,
  data: {
    description?: string;
    imageUrl?: string;
    rarityScore?: number;
    currentPrice?: number;
    status?: 'holding' | 'listed' | 'sold';
  }
): Promise<NFTHolding> => {
  const updates: string[] = [];
  const values: any[] = [];
  let paramCount = 1;

  if (data.description !== undefined) {
    updates.push(`description = $${paramCount}`);
    values.push(data.description);
    paramCount++;
  }
  if (data.imageUrl !== undefined) {
    updates.push(`image_url = $${paramCount}`);
    values.push(data.imageUrl);
    paramCount++;
  }
  if (data.rarityScore !== undefined) {
    updates.push(`rarity_score = $${paramCount}`);
    values.push(data.rarityScore);
    paramCount++;
  }
  if (data.currentPrice !== undefined) {
    updates.push(`current_price = $${paramCount}`);
    values.push(data.currentPrice);
    paramCount++;
  }
  if (data.status !== undefined) {
    updates.push(`status = $${paramCount}`);
    values.push(data.status);
    paramCount++;
  }

  updates.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(nftId);

  const result = await query(
    `UPDATE nft_holdings SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
    values
  );
  return result.rows[0];
};

export const deleteNFTHolding = async (nftId: string): Promise<void> => {
  await query('DELETE FROM nft_holdings WHERE id = $1', [nftId]);
};

export const getNFTsByBlockchain = async (
  userId: string,
  blockchain: string
): Promise<NFTHolding[]> => {
  const result = await query(
    'SELECT * FROM nft_holdings WHERE user_id = $1 AND blockchain = $2 ORDER BY created_at DESC',
    [userId, blockchain]
  );
  return result.rows;
};
