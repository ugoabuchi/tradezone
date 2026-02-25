import { Request, Response } from 'express';
import * as StockService from '../services/StockService';

export const getStockPrice = async (req: Request, res: Response) => {
  try {
    const { symbol } = req.params;

    if (!symbol) {
      return res.status(400).json({ error: 'Symbol required' });
    }

    const price = await StockService.getStockPrice(symbol);
    res.json(price);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getStockProfile = async (req: Request, res: Response) => {
  try {
    const { symbol } = req.params;

    if (!symbol) {
      return res.status(400).json({ error: 'Symbol required' });
    }

    const profile = await StockService.getStockProfile(symbol);
    res.json(profile);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const buyStock = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { symbol, quantity, price } = req.body;

    if (!symbol || !quantity || !price) {
      return res.status(400).json({ error: 'Symbol, quantity, and price required' });
    }

    const position = await StockService.buyStock(userId, symbol, quantity, price);
    res.json(position);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const sellStock = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { positionId, quantity, price } = req.body;

    if (!positionId || !quantity || !price) {
      return res.status(400).json({ error: 'Position ID, quantity, and price required' });
    }

    const position = await StockService.sellStock(userId, positionId, quantity, price);
    res.json(position);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getStockPositions = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const positions = await StockService.getUserStockPositions(userId);
    res.json(positions);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getStockMetrics = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const metrics = await StockService.calculateStockMetrics(userId);
    res.json(metrics);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};
