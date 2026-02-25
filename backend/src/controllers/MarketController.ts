import { Request, Response } from 'express';
import * as MarketService from '../services/MarketService';

export const getMarkets = async (req: Request, res: Response) => {
  try {
    const markets = await MarketService.getAllMarkets();
    res.json(markets);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getMarketById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const market = await MarketService.getMarketBySymbol(id);

    if (!market) {
      return res.status(404).json({ error: 'Market not found' });
    }

    res.json(market);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getForexPairs = async (req: Request, res: Response) => {
  try {
    const pairs = MarketService.getForexPairs();
    res.json({ pairs });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
