import { query } from '../config/database';
import { MarketplaceListing, MarketplaceOrder } from '../types';
import { v4 as uuidv4 } from 'uuid';

// Marketplace Listings
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
): Promise<MarketplaceListing> => {
  const id = uuidv4();
  const result = await query(
    `INSERT INTO marketplace_listings 
    (id, seller_user_id, listing_type, item_id, title, description, images, price, currency, quantity, status)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'active')
    RETURNING *`,
    [
      id,
      userId,
      data.listingType,
      data.itemId,
      data.title,
      data.description,
      data.images ? JSON.stringify(data.images) : null,
      data.price,
      data.currency,
      data.quantity || 1,
    ]
  );
  return result.rows[0];
};

export const getListings = async (filters?: {
  listingType?: string;
  status?: string;
  currency?: string;
}): Promise<MarketplaceListing[]> => {
  let where = ['status = $1'];
  const params: any[] = ['active'];
  let paramCount = 2;

  if (filters?.listingType) {
    where.push(`listing_type = $${paramCount}`);
    params.push(filters.listingType);
    paramCount++;
  }
  if (filters?.currency) {
    where.push(`currency = $${paramCount}`);
    params.push(filters.currency);
    paramCount++;
  }

  const result = await query(
    `SELECT * FROM marketplace_listings WHERE ${where.join(' AND ')} ORDER BY created_at DESC`,
    params
  );
  return result.rows;
};

export const getUserListings = async (userId: string): Promise<MarketplaceListing[]> => {
  const result = await query(
    'SELECT * FROM marketplace_listings WHERE seller_user_id = $1 ORDER BY created_at DESC',
    [userId]
  );
  return result.rows;
};

export const getListing = async (listingId: string): Promise<MarketplaceListing | null> => {
  const result = await query('SELECT * FROM marketplace_listings WHERE id = $1', [listingId]);
  return result.rows[0] || null;
};

export const updateListing = async (
  listingId: string,
  data: {
    title?: string;
    description?: string;
    price?: number;
    status?: 'active' | 'sold' | 'cancelled';
    quantity?: number;
  }
): Promise<MarketplaceListing> => {
  const updates: string[] = [];
  const values: any[] = [];
  let paramCount = 1;

  if (data.title !== undefined) {
    updates.push(`title = $${paramCount}`);
    values.push(data.title);
    paramCount++;
  }
  if (data.description !== undefined) {
    updates.push(`description = $${paramCount}`);
    values.push(data.description);
    paramCount++;
  }
  if (data.price !== undefined) {
    updates.push(`price = $${paramCount}`);
    values.push(data.price);
    paramCount++;
  }
  if (data.status !== undefined) {
    updates.push(`status = $${paramCount}`);
    values.push(data.status);
    paramCount++;
  }
  if (data.quantity !== undefined) {
    updates.push(`quantity = $${paramCount}`);
    values.push(data.quantity);
    paramCount++;
  }

  updates.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(listingId);

  const result = await query(
    `UPDATE marketplace_listings SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
    values
  );
  return result.rows[0];
};

export const incrementViews = async (listingId: string): Promise<void> => {
  await query('UPDATE marketplace_listings SET views = views + 1 WHERE id = $1', [listingId]);
};

export const deleteListing = async (listingId: string): Promise<void> => {
  await query('DELETE FROM marketplace_listings WHERE id = $1', [listingId]);
};

// Marketplace Orders
export const createMarketplaceOrder = async (
  buyerId: string,
  data: {
    listingId?: string;
    sellerId?: string;
    itemId: string;
    quantity: number;
    unitPrice: number;
    currency: string;
    shippingAddress?: string;
  }
): Promise<MarketplaceOrder> => {
  const id = uuidv4();
  const totalAmount = data.unitPrice * data.quantity;

  const result = await query(
    `INSERT INTO marketplace_orders 
    (id, buyer_user_id, listing_id, seller_user_id, item_id, quantity, 
     unit_price, total_amount, currency, shipping_address, payment_status, fulfillment_status)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'pending', 'pending')
    RETURNING *`,
    [
      id,
      buyerId,
      data.listingId || null,
      data.sellerId || null,
      data.itemId,
      data.quantity,
      data.unitPrice,
      totalAmount,
      data.currency,
      data.shippingAddress || null,
    ]
  );
  return result.rows[0];
};

export const getMarketplaceOrders = async (
  userId: string,
  role: 'buyer' | 'seller'
): Promise<MarketplaceOrder[]> => {
  const column = role === 'buyer' ? 'buyer_user_id' : 'seller_user_id';
  const result = await query(
    `SELECT * FROM marketplace_orders WHERE ${column} = $1 ORDER BY created_at DESC`,
    [userId]
  );
  return result.rows;
};

export const getMarketplaceOrder = async (orderId: string): Promise<MarketplaceOrder | null> => {
  const result = await query('SELECT * FROM marketplace_orders WHERE id = $1', [orderId]);
  return result.rows[0] || null;
};

export const updateMarketplaceOrder = async (
  orderId: string,
  data: {
    paymentStatus?: 'pending' | 'completed' | 'failed' | 'refunded';
    fulfillmentStatus?: 'pending' | 'shipped' | 'delivered' | 'cancelled';
    trackingNumber?: string;
  }
): Promise<MarketplaceOrder> => {
  const updates: string[] = [];
  const values: any[] = [];
  let paramCount = 1;

  if (data.paymentStatus !== undefined) {
    updates.push(`payment_status = $${paramCount}`);
    values.push(data.paymentStatus);
    paramCount++;
  }
  if (data.fulfillmentStatus !== undefined) {
    updates.push(`fulfillment_status = $${paramCount}`);
    values.push(data.fulfillmentStatus);
    paramCount++;
  }
  if (data.trackingNumber !== undefined) {
    updates.push(`tracking_number = $${paramCount}`);
    values.push(data.trackingNumber);
    paramCount++;
  }

  updates.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(orderId);

  const result = await query(
    `UPDATE marketplace_orders SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
    values
  );
  return result.rows[0];
};

export const deleteMarketplaceOrder = async (orderId: string): Promise<void> => {
  await query('DELETE FROM marketplace_orders WHERE id = $1', [orderId]);
};
