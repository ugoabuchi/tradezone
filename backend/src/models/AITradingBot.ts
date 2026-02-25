import { query } from '../config/database';
import { AITradingBot, AITradingHistory } from '../types';
import { v4 as uuidv4 } from 'uuid';

// AI Trading Bots
export const createAIBot = async (
  userId: string,
  data: {
    botName: string;
    strategy: string;
    symbol: string;
    initialCapital: number;
    allocatedPercentage: number;
    aiModel: 'deepseek' | 'gemini' | 'hybrid';
    riskLevel: 'low' | 'medium' | 'high';
    parameters?: Record<string, any>;
  }
): Promise<AITradingBot> => {
  const id = uuidv4();
  const result = await query(
    `INSERT INTO ai_trading_bots 
    (id, user_id, bot_name, strategy, symbol, initial_capital, current_balance, 
     allocated_percentage, ai_model, risk_level, parameters, status)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'inactive')
    RETURNING *`,
    [
      id,
      userId,
      data.botName,
      data.strategy,
      data.symbol,
      data.initialCapital,
      data.initialCapital,
      data.allocatedPercentage,
      data.aiModel,
      data.riskLevel,
      data.parameters ? JSON.stringify(data.parameters) : null,
    ]
  );
  return result.rows[0];
};

export const getAIBots = async (userId: string): Promise<AITradingBot[]> => {
  const result = await query(
    'SELECT * FROM ai_trading_bots WHERE user_id = $1 ORDER BY created_at DESC',
    [userId]
  );
  return result.rows.map((row: any) => ({
    ...row,
    parameters: row.parameters ? JSON.parse(row.parameters) : undefined,
  }));
};

export const getAIBot = async (botId: string): Promise<AITradingBot | null> => {
  const result = await query('SELECT * FROM ai_trading_bots WHERE id = $1', [botId]);
  if (result.rows[0]) {
    return {
      ...result.rows[0],
      parameters: result.rows[0].parameters ? JSON.parse(result.rows[0].parameters) : undefined,
    };
  }
  return null;
};

export const updateAIBot = async (
  botId: string,
  data: {
    status?: 'active' | 'inactive' | 'paused';
    currentBalance?: number;
    tradesExecuted?: number;
    totalReturn?: number;
    winRate?: number;
  }
): Promise<AITradingBot> => {
  const updates: string[] = [];
  const values: any[] = [];
  let paramCount = 1;

  if (data.status !== undefined) {
    updates.push(`status = $${paramCount}`);
    values.push(data.status);
    paramCount++;
  }
  if (data.currentBalance !== undefined) {
    updates.push(`current_balance = $${paramCount}`);
    values.push(data.currentBalance);
    paramCount++;
  }
  if (data.tradesExecuted !== undefined) {
    updates.push(`trades_executed = $${paramCount}`);
    values.push(data.tradesExecuted);
    paramCount++;
  }
  if (data.totalReturn !== undefined) {
    updates.push(`total_return = $${paramCount}`);
    values.push(data.totalReturn);
    paramCount++;
  }
  if (data.winRate !== undefined) {
    updates.push(`win_rate = $${paramCount}`);
    values.push(data.winRate);
    paramCount++;
  }

  updates.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(botId);

  const result = await query(
    `UPDATE ai_trading_bots SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
    values
  );
  const row = result.rows[0];
  return {
    ...row,
    parameters: row.parameters ? JSON.parse(row.parameters) : undefined,
  };
};

export const deleteAIBot = async (botId: string): Promise<void> => {
  await query('DELETE FROM ai_trading_bots WHERE id = $1', [botId]);
};

// AI Trading History
export const createAITrade = async (
  botId: string,
  userId: string,
  data: {
    symbol: string;
    action: 'buy' | 'sell';
    price: number;
    quantity: number;
    confidenceScore?: number;
    aiReasoning?: string;
  }
): Promise<AITradingHistory> => {
  const id = uuidv4();
  const result = await query(
    `INSERT INTO ai_trading_history 
    (id, bot_id, user_id, symbol, action, price, quantity, confidence_score, ai_reasoning)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *`,
    [
      id,
      botId,
      userId,
      data.symbol,
      data.action,
      data.price,
      data.quantity,
      data.confidenceScore || null,
      data.aiReasoning || null,
    ]
  );
  return result.rows[0];
};

export const getAITradeHistory = async (botId: string): Promise<AITradingHistory[]> => {
  const result = await query(
    'SELECT * FROM ai_trading_history WHERE bot_id = $1 ORDER BY created_at DESC',
    [botId]
  );
  return result.rows;
};

export const getAIUserTradeHistory = async (userId: string): Promise<AITradingHistory[]> => {
  const result = await query(
    'SELECT * FROM ai_trading_history WHERE user_id = $1 ORDER BY created_at DESC',
    [userId]
  );
  return result.rows;
};

export const updateAITrade = async (
  tradeId: string,
  pnl: number
): Promise<AITradingHistory> => {
  const result = await query(
    'UPDATE ai_trading_history SET pnl = $1 WHERE id = $2 RETURNING *',
    [pnl, tradeId]
  );
  return result.rows[0];
};
