import { Request, Response } from 'express';
import * as MarketplaceService from '../services/MarketplaceService';

export const createListing = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const listing = await MarketplaceService.createListing(userId, req.body);
    res.status(201).json(listing);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const searchListings = async (req: Request, res: Response) => {
  try {
    const { q, type, currency } = req.query;

    const filters = {
      listingType: type as string | undefined,
      currency: currency as string | undefined,
    };

    const listings = await MarketplaceService.searchListings(
      (q as string) || '',
      filters
    );
    res.json(listings);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getListingDetails = async (req: Request, res: Response) => {
  try {
    const { listingId } = req.params;

    const listing = await MarketplaceService.getListingDetails(listingId);
    res.json(listing);
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
};

export const purchaseItem = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { listingId, quantity, shippingAddress } = req.body;

    if (!listingId || !quantity) {
      return res.status(400).json({ error: 'Listing ID and quantity required' });
    }

    const order = await MarketplaceService.purchaseItem(
      userId,
      listingId,
      quantity,
      shippingAddress
    );
    res.status(201).json(order);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const processPayment = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { orderId, cryptoAmount, cryptoCurrency } = req.body;

    if (!orderId || !cryptoAmount || !cryptoCurrency) {
      return res.status(400).json({ 
        error: 'Order ID, crypto amount, and currency required' 
      });
    }

    const order = await MarketplaceService.processPayment(
      orderId,
      cryptoAmount,
      cryptoCurrency
    );
    res.json(order);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const shipItem = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { orderId, trackingNumber } = req.body;

    if (!orderId || !trackingNumber) {
      return res.status(400).json({ error: 'Order ID and tracking number required' });
    }

    const order = await MarketplaceService.shipItem(orderId, trackingNumber);
    res.json(order);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const completeDelivery = async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;

    const order = await MarketplaceService.completeDelivery(orderId);
    res.json(order);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getUserListings = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const listings = await MarketplaceService.getUserListings(userId);
    res.json(listings);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getBuyerOrders = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const orders = await MarketplaceService.getBuyerOrders(userId);
    res.json(orders);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getSellerOrders = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const orders = await MarketplaceService.getSellerOrders(userId);
    res.json(orders);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getSellerStats = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const stats = await MarketplaceService.calculateSellerStats(userId);
    res.json(stats);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getMarketplaceStats = async (req: Request, res: Response) => {
  try {
    const stats = await MarketplaceService.getMarketplaceStats();
    res.json(stats);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};
