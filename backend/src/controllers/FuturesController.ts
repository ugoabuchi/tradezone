import { Request, Response } from 'express';
import * as FuturesService from '../services/FuturesService';

export const createFuturesPosition = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const position = await FuturesService.createFuturesPosition(userId, req.body);
    res.json(position);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getFuturesPositions = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const positions = await FuturesService.getUserFuturesPositions(userId);
    res.json(positions);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const updateFuturesPosition = async (req: Request, res: Response) => {
  try {
    const { positionId } = req.params;
    const { currentPrice } = req.body;

    if (!currentPrice) {
      return res.status(400).json({ error: 'Current price required' });
    }

    const position = await FuturesService.updateFuturesPosition(positionId, currentPrice);
    res.json(position);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const closeFuturesPosition = async (req: Request, res: Response) => {
  try {
    const { positionId } = req.params;
    const { exitPrice } = req.body;

    if (!exitPrice) {
      return res.status(400).json({ error: 'Exit price required' });
    }

    const position = await FuturesService.closeFuturesPosition(positionId, exitPrice);
    res.json(position);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getFuturesMetrics = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const metrics = await FuturesService.calculateFuturesMetrics(userId);
    res.json(metrics);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getDemoAccountBalance = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const balance = await FuturesService.getDemoAccountBalance(userId);
    res.json({ balance });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const resetDemoAccount = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    await FuturesService.updateDemoAccountBalance(userId, 50000);
    res.json({ message: 'Demo account reset', balance: 50000 });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};
