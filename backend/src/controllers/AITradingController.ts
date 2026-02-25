import { Request, Response } from 'express';
import * as AITradingService from '../services/AITradingService';

export const createAIBot = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const bot = await AITradingService.createAIBot(userId, req.body);
    res.status(201).json(bot);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getUserAIBots = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const bots = await AITradingService.getUserAIBots(userId);
    res.json(bots);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const activateAIBot = async (req: Request, res: Response) => {
  try {
    const { botId } = req.params;

    const bot = await AITradingService.activateAIBot(botId);
    res.json(bot);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const deactivateAIBot = async (req: Request, res: Response) => {
  try {
    const { botId } = req.params;

    const bot = await AITradingService.deactivateAIBot(botId);
    res.json(bot);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const pauseAIBot = async (req: Request, res: Response) => {
  try {
    const { botId } = req.params;

    const bot = await AITradingService.pauseAIBot(botId);
    res.json(bot);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getAIBotPerformance = async (req: Request, res: Response) => {
  try {
    const { botId } = req.params;

    const performance = await AITradingService.getAIBotPerformance(botId);
    res.json(performance);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteAIBot = async (req: Request, res: Response) => {
  try {
    const { botId } = req.params;

    await AITradingService.deleteAIBot(botId);
    res.json({ message: 'Bot deleted successfully' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const runAutomatedTrading = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const results = await AITradingService.runAutomatedTrading(userId);
    res.json({ trades: results });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};
