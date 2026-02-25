import { Request, Response } from 'express';
import { CreateOrderRequest } from '../types';
import * as OrderService from '../services/OrderService';
import { AuthenticatedRequest } from '../middleware/auth';

export const createOrder = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { symbol, type, price, quantity } = req.body as CreateOrderRequest;
    const userId = req.userId!;

    if (!symbol || !type || !price || !quantity) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (price <= 0 || quantity <= 0) {
      return res.status(400).json({ error: 'Price and quantity must be positive' });
    }

    if (!['buy', 'sell'].includes(type)) {
      return res.status(400).json({ error: 'Type must be buy or sell' });
    }

    const order = await OrderService.createOrder(userId, symbol, type, price, quantity);
    res.status(201).json(order);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getOrders = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { status } = req.query;

    const orders = await OrderService.getUserOrders(userId);
    const filtered = status ? orders.filter((o) => o.status === status) : orders;

    res.json(filtered);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const cancelOrder = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId!;

    const order = await OrderService.cancelOrder(id, userId);
    res.json(order);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getOrderBook = async (req: Request, res: Response) => {
  try {
    const { symbol } = req.params;
    const orderBook = await OrderService.getOrderBook(symbol);
    res.json(orderBook);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
