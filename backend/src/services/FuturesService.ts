import * as FuturesModel from '../models/FuturesPosition';
import * as StockModel from '../models/StockPosition';
import { query } from '../config/database';

export const createFuturesPosition = async (
  userId: string,
  data: {
    symbol: string;
    side: 'long' | 'short';
    entryPrice: number;
    quantity: number;
    leverage: number;
    stopLoss?: number;
    takeProfit?: number;
  }
) => {
  const balance = await getTradingAccountBalance(userId);
  const requiredMargin = (data.entryPrice * data.quantity) / data.leverage;

  if (balance < requiredMargin) {
    throw new Error(`Insufficient margin. Required: ${requiredMargin}, Available: ${balance}`);
  }

  return FuturesModel.createFuturesPosition(userId, {
    ...data,
    currentPrice: data.entryPrice,
  });
};

export const updateFuturesPosition = async (
  positionId: string,
  currentPrice: number
) => {
  const position = await FuturesModel.getFuturesPosition(positionId);
  if (!position) throw new Error('Position not found');

  const pnl = position.side === 'long'
    ? (currentPrice - position.entry_price) * position.quantity
    : (position.entry_price - currentPrice) * position.quantity;

  // Check stop loss and take profit
  let shouldClose = false;
  if (position.stop_loss && position.side === 'long' && currentPrice <= position.stop_loss) {
    shouldClose = true;
  }
  if (position.stop_loss && position.side === 'short' && currentPrice >= position.stop_loss) {
    shouldClose = true;
  }
  if (position.take_profit && position.side === 'long' && currentPrice >= position.take_profit) {
    shouldClose = true;
  }
  if (position.take_profit && position.side === 'short' && currentPrice <= position.take_profit) {
    shouldClose = true;
  }

  return FuturesModel.updateFuturesPosition(positionId, {
    currentPrice,
    pnl,
    status: shouldClose ? 'closed' : undefined,
  });
};

export const closeFuturesPosition = async (positionId: string, exitPrice: number) => {
  return FuturesModel.closeFuturesPosition(positionId, exitPrice);
};

export const getUserFuturesPositions = async (userId: string) => {
  return FuturesModel.getFuturesPositions(userId);
};

export const getTradingAccountBalance = async (userId: string): Promise<number> => {
  const result = await query(
    'SELECT SUM(balance) as total FROM trading_accounts WHERE user_id = $1 AND account_type != $2',
    [userId, 'demo']
  );
  return parseFloat(result.rows[0]?.total || 0);
};

export const initializeTradingAccounts = async (userId: string) => {
  const initialBalance = 10000; // $10,000 initial balance

  // Create spot trading account
  await query(
    `INSERT INTO trading_accounts (user_id, account_type, balance, leverage, status)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT DO NOTHING`,
    [userId, 'spot', initialBalance, 1, 'active']
  );

  // Create futures trading account
  await query(
    `INSERT INTO trading_accounts (user_id, account_type, balance, leverage, status)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT DO NOTHING`,
    [userId, 'futures', initialBalance * 0.5, 1, 'active']
  );

  // Create demo account for practice
  await query(
    `INSERT INTO trading_accounts (user_id, account_type, balance, leverage, status)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT DO NOTHING`,
    [userId, 'demo', 50000, 10, 'active']
  );
};

export const getDemoAccountBalance = async (userId: string): Promise<number> => {
  const result = await query(
    'SELECT balance FROM trading_accounts WHERE user_id = $1 AND account_type = $2',
    [userId, 'demo']
  );
  return result.rows[0]?.balance || 50000;
};

export const updateDemoAccountBalance = async (userId: string, newBalance: number) => {
  await query(
    'UPDATE trading_accounts SET balance = $1 WHERE user_id = $2 AND account_type = $3',
    [newBalance, userId, 'demo']
  );
};

export const calculateFuturesMetrics = async (userId: string) => {
  const positions = await FuturesModel.getFuturesPositions(userId);

  const metrics = {
    totalOpenPositions: positions.filter((p: any) => p.status === 'open').length,
    totalClosedPositions: positions.filter((p: any) => p.status === 'closed').length,
    totalPnL: positions.reduce((sum: number, p: any) => sum + (p.pnl || 0), 0),
    longPositions: positions.filter((p: any) => p.side === 'long' && p.status === 'open').length,
    shortPositions: positions.filter((p: any) => p.side === 'short' && p.status === 'open')
      .length,
    averageLeverage:
      positions.reduce((sum: number, p: any) => sum + p.leverage, 0) / positions.length || 1,
  };

  return metrics;
};
