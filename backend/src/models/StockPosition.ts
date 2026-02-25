import { query } from '../config/database';
import { StockPosition } from '../types';
import { v4 as uuidv4 } from 'uuid';

export const createStockPosition = async (
  userId: string,
  data: {
    symbol: string;
    quantity: number;
    averagePrice: number;
    currentPrice: number;
  }
): Promise<StockPosition> => {
  const id = uuidv4();
  const result = await query(
    `INSERT INTO stock_positions 
    (id, user_id, symbol, quantity, average_price, current_price, status)
    VALUES ($1, $2, $3, $4, $5, $6, 'holding')
    RETURNING *`,
    [id, userId, data.symbol, data.quantity, data.averagePrice, data.currentPrice]
  );
  return result.rows[0];
};

export const getStockPositions = async (userId: string): Promise<StockPosition[]> => {
  const result = await query(
    'SELECT * FROM stock_positions WHERE user_id = $1 AND status = $2 ORDER BY created_at DESC',
    [userId, 'holding']
  );
  return result.rows;
};

export const getStockPosition = async (positionId: string): Promise<StockPosition | null> => {
  const result = await query('SELECT * FROM stock_positions WHERE id = $1', [positionId]);
  return result.rows[0] || null;
};

export const updateStockPosition = async (
  positionId: string,
  data: {
    quantity?: number;
    averagePrice?: number;
    currentPrice?: number;
    status?: 'holding' | 'sold';
    pnl?: number;
  }
): Promise<StockPosition> => {
  const updates: string[] = [];
  const values: any[] = [];
  let paramCount = 1;

  if (data.quantity !== undefined) {
    updates.push(`quantity = $${paramCount}`);
    values.push(data.quantity);
    paramCount++;
  }
  if (data.averagePrice !== undefined) {
    updates.push(`average_price = $${paramCount}`);
    values.push(data.averagePrice);
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
  if (data.pnl !== undefined) {
    updates.push(`pnl = $${paramCount}`);
    values.push(data.pnl);
    paramCount++;
  }

  updates.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(positionId);

  const result = await query(
    `UPDATE stock_positions SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
    values
  );
  return result.rows[0];
};

export const sellStockPosition = async (
  positionId: string,
  sellPrice: number,
  quantity: number
): Promise<StockPosition> => {
  const position = await getStockPosition(positionId);
  if (!position) throw new Error('Position not found');

  const pnl = (sellPrice - position.average_price) * quantity;
  const newQuantity = position.quantity - quantity;

  const status = newQuantity === 0 ? 'sold' : 'holding';

  return updateStockPosition(positionId, {
    quantity: newQuantity,
    currentPrice: sellPrice,
    status,
    pnl,
  });
};
