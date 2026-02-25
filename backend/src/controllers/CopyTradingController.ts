import { Request, Response } from 'express';
import * as CopyTradingService from '../services/CopyTradingService';

export const followTrader = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { leaderUserId, allocationPercentage } = req.body;

    if (!leaderUserId || allocationPercentage === undefined) {
      return res.status(400).json({ error: 'Leader user ID and allocation percentage required' });
    }

    const result = await CopyTradingService.followTrader(userId, leaderUserId, allocationPercentage);
    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const unfollowTrader = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { leaderUserId } = req.body;

    if (!leaderUserId) {
      return res.status(400).json({ error: 'Leader user ID required' });
    }

    const result = await CopyTradingService.unfollowTrader(userId, leaderUserId);
    res.json(result.rows[0]);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getFollowingList = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const following = await CopyTradingService.getFollowingList(userId);
    res.json(following);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getFollowers = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const followers = await CopyTradingService.getFollowers(userId);
    res.json(followers);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getTraderStats = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: 'User ID required' });
    }

    const stats = await CopyTradingService.getTraderStats(userId);
    res.json(stats);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const searchLeaders = async (req: Request, res: Response) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({ error: 'Search query required' });
    }

    const leaders = await CopyTradingService.searchLeaders(q as string);
    res.json(leaders);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const pauseCopyTrade = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { leaderUserId } = req.body;

    if (!leaderUserId) {
      return res.status(400).json({ error: 'Leader user ID required' });
    }

    const result = await CopyTradingService.pauseCopyTrade(userId, leaderUserId);
    res.json(result.rows[0]);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const resumeCopyTrade = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { leaderUserId } = req.body;

    if (!leaderUserId) {
      return res.status(400).json({ error: 'Leader user ID required' });
    }

    const result = await CopyTradingService.resumeCopyTrade(userId, leaderUserId);
    res.json(result.rows[0]);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};
