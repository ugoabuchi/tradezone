import { Request, Response } from 'express';
import * as AccountService from '../services/AccountService';
import { AuthenticatedRequest } from '../middleware/auth';

export const getBalance = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const balances = await AccountService.getUserBalances(userId);
    res.json(balances);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getPortfolio = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const portfolio = await AccountService.getUserPortfolio(userId);
    res.json(portfolio);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getTransactions = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
    const transactions = await AccountService.getTransactionHistory(userId, limit);
    res.json(transactions);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
