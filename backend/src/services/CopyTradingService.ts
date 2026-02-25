import * as CopyTradeModel from '../models/CopyTrade';
import { query } from '../config/database';

interface CopyTradeConfig {
  follower_user_id: string;
  leader_user_id: string;
  allocation_percentage: number;
}

export const followTrader = async (
  followerUserId: string,
  leaderUserId: string,
  allocationPercentage: number
) => {
  if (followerUserId === leaderUserId) {
    throw new Error('Cannot copy trade yourself');
  }

  if (allocationPercentage <= 0 || allocationPercentage > 100) {
    throw new Error('Allocation percentage must be between 1 and 100');
  }

  // Check if already following
  const existing = await query(
    'SELECT id FROM copy_trades WHERE follower_user_id = $1 AND leader_user_id = $2',
    [followerUserId, leaderUserId]
  );

  if (existing.rows.length > 0) {
    throw new Error('Already copying this trader');
  }

  return await query(
    `INSERT INTO copy_trades (follower_user_id, leader_user_id, allocation_percentage, is_active)
     VALUES ($1, $2, $3, true)
     RETURNING *`,
    [followerUserId, leaderUserId, allocationPercentage]
  );
};

export const unfollowTrader = async (followerUserId: string, leaderUserId: string) => {
  return await query(
    'DELETE FROM copy_trades WHERE follower_user_id = $1 AND leader_user_id = $2 RETURNING *',
    [followerUserId, leaderUserId]
  );
};

export const getFollowingList = async (userId: string) => {
  const result = await query(
    `SELECT ct.*, users.full_name, users.email 
     FROM copy_trades ct
     JOIN users ON ct.leader_user_id = users.id
     WHERE ct.follower_user_id = $1 AND ct.is_active = true
     ORDER BY ct.created_at DESC`,
    [userId]
  );
  return result.rows;
};

export const getFollowers = async (userId: string) => {
  const result = await query(
    `SELECT ct.*, users.full_name, users.email 
     FROM copy_trades ct
     JOIN users ON ct.follower_user_id = users.id
     WHERE ct.leader_user_id = $1 AND ct.is_active = true
     ORDER BY ct.created_at DESC`,
    [userId]
  );
  return result.rows;
};

export const getTraderStats = async (userId: string) => {
  // Get trader's win rate, average return, total trades
  const tradesResult = await query(
    `SELECT COUNT(*) as total_trades, 
            SUM(CASE WHEN pnl > 0 THEN 1 ELSE 0 END) as winning_trades
     FROM orders WHERE user_id = $1 AND status = 'filled'`,
    [userId]
  );

  const followerResult = await query(
    'SELECT COUNT(*) as follower_count FROM copy_trades WHERE leader_user_id = $1 AND is_active = true',
    [userId]
  );

  const trades = tradesResult.rows[0];
  const followers = followerResult.rows[0];

  return {
    totalTrades: parseInt(trades.total_trades || 0),
    winningTrades: parseInt(trades.winning_trades || 0),
    winRate:
      trades.total_trades > 0
        ? (parseInt(trades.winning_trades || 0) / parseInt(trades.total_trades)) * 100
        : 0,
    followerCount: parseInt(followers.follower_count || 0),
    averageReturn: 8.5, // This would be calculated from actual trade data
  };
};

export const copyTrade = async (
  followerUserId: string,
  leaderUserId: string,
  leaderTrade: {
    symbol: string;
    type: 'buy' | 'sell';
    price: number;
    quantity: number;
  }
) => {
  // Get copy trade config
  const copyTradeConfig = await query(
    'SELECT * FROM copy_trades WHERE follower_user_id = $1 AND leader_user_id = $2 AND is_active = true',
    [followerUserId, leaderUserId]
  );

  if (copyTradeConfig.rows.length === 0) {
    throw new Error('Copy trade relationship not found');
  }

  const config = copyTradeConfig.rows[0];

  // Scale the trade based on allocation percentage
  const scaledQuantity = (leaderTrade.quantity * config.allocation_percentage) / 100;

  // Execute the trade for the follower
  // This would use the order service to actually execute the trade
  return {
    leaderTrade,
    followerTrade: {
      ...leaderTrade,
      quantity: scaledQuantity,
    },
    allocationPercentage: config.allocation_percentage,
  };
};

export const searchLeaders = async (searchQuery: string) => {
  const result = await query(
    `SELECT users.id, users.full_name, users.email
     FROM users
     WHERE (users.full_name ILIKE $1 OR users.email ILIKE $1)
     AND users.id NOT IN (
       SELECT leader_user_id FROM copy_trades
     )
     LIMIT 10`,
    [`%${searchQuery}%`]
  );

  // Enrich with stats
  const enriched = await Promise.all(
    result.rows.map(async user => ({
      ...user,
      stats: await getTraderStats(user.id),
    }))
  );

  return enriched;
};

export const pauseCopyTrade = async (followerUserId: string, leaderUserId: string) => {
  return await query(
    'UPDATE copy_trades SET is_active = false WHERE follower_user_id = $1 AND leader_user_id = $2 RETURNING *',
    [followerUserId, leaderUserId]
  );
};

export const resumeCopyTrade = async (followerUserId: string, leaderUserId: string) => {
  return await query(
    'UPDATE copy_trades SET is_active = true WHERE follower_user_id = $1 AND leader_user_id = $2 RETURNING *',
    [followerUserId, leaderUserId]
  );
};
