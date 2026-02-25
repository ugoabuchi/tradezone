import { query } from '../config/database';
import { FuturesPosition } from '../types';
import { v4 as uuidv4 } from 'uuid';

export const createFuturesPosition = async (
  userId: string,
  data: {
    symbol: string;
    side: 'long' | 'short';
    entryPrice: number;
    currentPrice: number;
    quantity: number;
    leverage: number;
    stopLoss?: number;
    takeProfit?: number;
  }
): Promise<FuturesPosition> => {
  const id = uuidv4();
  const result = await query(
    `INSERT INTO futures_positions 
    (id, user_id, symbol, side, entry_price, current_price, quantity, leverage, stop_loss, take_profit, status)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'open')
    RETURNING *`,
    [
      id,
      userId,
      data.symbol,
      data.side,
      data.entryPrice,
      data.currentPrice,
      data.quantity,
      data.leverage,
      data.stopLoss || null,
      data.takeProfit || null,
    ]
  );
  return result.rows[0];
};

export const getFuturesPositions = async (userId: string): Promise<FuturesPosition[]> => {
  const result = await query(
    'SELECT * FROM futures_positions WHERE user_id = $1 ORDER BY created_at DESC',
    [userId]
  );
  return result.rows;
};

export const getFuturesPosition = async (positionId: string): Promise<FuturesPosition | null> => {
  const result = await query(
    'SELECT * FROM futures_positions WHERE id = $1',
    [positionId]
  );
  return result.rows[0] || null;
};

export const updateFuturesPosition = async (
  positionId: string,
  data: {
    currentPrice?: number;
    pnl?: number;
    status?: 'open' | 'closed';
  }
): Promise<FuturesPosition> => {
  const updates: string[] = [];
  const values: any[] = [];
  let paramCount = 1;

  if (data.currentPrice !== undefined) {
    updates.push(`current_price = $${paramCount}`);
    values.push(data.currentPrice);
    paramCount++;
  }
  if (data.pnl !== undefined) {
    updates.push(`pnl = $${paramCount}`);
    values.push(data.pnl);
    paramCount++;
  }
  if (data.status !== undefined) {
    updates.push(`status = $${paramCount}`);
    values.push(data.status);
    paramCount++;
    if (data.status === 'closed') {
      updates.push(`closed_at = CURRENT_TIMESTAMP`);
    }
  }
  updates.push(`updated_at = CURRENT_TIMESTAMP`);

  values.push(positionId);

  const result = await query(
    `UPDATE futures_positions SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
    values
  );
  return result.rows[0];
};

export const closeFuturesPosition = async (
  positionId: string,
  exitPrice: number
): Promise<FuturesPosition> => {
  const position = await getFuturesPosition(positionId);
  if (!position) throw new Error('Position not found');

  const pnl = position.side === 'long'
    ? (exitPrice - position.entry_price) * position.quantity
    : (position.entry_price - exitPrice) * position.quantity;

  return updateFuturesPosition(positionId, {
    currentPrice: exitPrice,
    pnl,
    status: 'closed',
  });
};

export const deleteFuturesPosition = async (positionId: string): Promise<void> => {
  await query('DELETE FROM futures_positions WHERE id = $1', [positionId]);
};
