import * as MarketplaceModel from '../models/Marketplace';
import { query } from '../config/database';

export const createListing = async (
  userId: string,
  data: {
    listingType: 'nft' | 'product' | 'service';
    itemId: string;
    title: string;
    description: string;
    images?: string[];
    price: number;
    currency: string;
    quantity?: number;
  }
) => {
  // Verify seller has the item (if NFT)
  if (data.listingType === 'nft') {
    const nftResult = await query(
      'SELECT id FROM nft_holdings WHERE id = $1 AND user_id = $2',
      [data.itemId, userId]
    );
    if (nftResult.rows.length === 0) {
      throw new Error('NFT not found or you do not own this NFT');
    }
  }

  return MarketplaceModel.createListing(userId, data);
};

export const searchListings = async (searchQuery: string, filters?: any) => {
  const listings = await MarketplaceModel.getListings(filters);

  if (!searchQuery) return listings;

  // Simple text-based search
  return listings.filter(
    listing =>
      listing.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      listing.description.toLowerCase().includes(searchQuery.toLowerCase())
  );
};

export const getListingDetails = async (listingId: string) => {
  const listing = await MarketplaceModel.getListing(listingId);
  if (!listing) throw new Error('Listing not found');

  // Increment views
  await MarketplaceModel.incrementViews(listingId);

  return listing;
};

export const purchaseItem = async (
  buyerId: string,
  listingId: string,
  quantity: number,
  shippingAddress?: string
) => {
  const listing = await MarketplaceModel.getListing(listingId);
  if (!listing) throw new Error('Listing not found');

  if (quantity > listing.quantity) {
    throw new Error('Insufficient quantity available');
  }

  // Create order
  const order = await MarketplaceModel.createMarketplaceOrder(buyerId, {
    listingId,
    sellerId: listing.seller_user_id,
    itemId: listing.item_id,
    quantity,
    unitPrice: listing.price,
    currency: listing.currency,
    shippingAddress,
  });

  // Update listing quantity or mark as sold
  if (listing.quantity === quantity) {
    await MarketplaceModel.updateListing(listingId, { status: 'sold', quantity: 0 });
  } else {
    await MarketplaceModel.updateListing(listingId, {
      quantity: listing.quantity - quantity,
    });
  }

  return order;
};

export const processPayment = async (
  orderId: string,
  cryptoAmount: number,
  cryptoCurrency: string
) => {
  const order = await MarketplaceModel.getMarketplaceOrder(orderId);
  if (!order) throw new Error('Order not found');

  // Verify payment amount matches order total (could include conversion rates)
  // This is simplified - in production you'd convert crypto to fiat price

  return MarketplaceModel.updateMarketplaceOrder(orderId, {
    paymentStatus: 'completed',
  });
};

export const shipItem = async (orderId: string, trackingNumber: string) => {
  const order = await MarketplaceModel.getMarketplaceOrder(orderId);
  if (!order) throw new Error('Order not found');

  if (order.payment_status !== 'completed') {
    throw new Error('Payment must be completed before shipping');
  }

  return MarketplaceModel.updateMarketplaceOrder(orderId, {
    fulfillmentStatus: 'shipped',
    trackingNumber,
  });
};

export const completeDelivery = async (orderId: string) => {
  return MarketplaceModel.updateMarketplaceOrder(orderId, {
    fulfillmentStatus: 'delivered',
  });
};

export const getUserListings = async (userId: string) => {
  return MarketplaceModel.getUserListings(userId);
};

export const getBuyerOrders = async (userId: string) => {
  return MarketplaceModel.getMarketplaceOrders(userId, 'buyer');
};

export const getSellerOrders = async (userId: string) => {
  return MarketplaceModel.getMarketplaceOrders(userId, 'seller');
};

export const calculateSellerStats = async (userId: string) => {
  const listings = await MarketplaceModel.getUserListings(userId);
  const orders = await MarketplaceModel.getMarketplaceOrders(userId, 'seller');

  const stats = {
    totalListings: listings.length,
    activeListings: listings.filter(l => l.status === 'active').length,
    soldItems: listings.filter(l => l.status === 'sold').length,
    totalOrders: orders.length,
    completedOrders: orders.filter(o => o.fulfillment_status === 'delivered').length,
    totalRevenue: orders.reduce(
      (sum, o) => sum + (o.payment_status === 'completed' ? o.total_amount : 0),
      0
    ),
    avgRating: 4.5, // TODO: implement rating system
  };

  return stats;
};

export const getMarketplaceStats = async () => {
  const allListings = await MarketplaceModel.getListings();

  const stats = {
    totalListings: allListings.length,
    nftListings: allListings.filter(l => l.listing_type === 'nft').length,
    productListings: allListings.filter(l => l.listing_type === 'product').length,
    serviceListings: allListings.filter(l => l.listing_type === 'service').length,
    totalViews: allListings.reduce((sum, l) => sum + l.views, 0),
    currencies: [...new Set(allListings.map(l => l.currency))],
  };

  return stats;
};
