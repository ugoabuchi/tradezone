import { Order } from '../types';
import * as OrderModel from '../models/Order';
import * as WalletModel from '../models/Wallet';
import * as TransactionModel from '../models/Transaction';
import { getCryptoBySymbol } from './CryptoService';
import { krakenService } from './KrakenService';

export const createOrder = async (
  userId: string,
  symbol: string,
  type: 'buy' | 'sell',
  price: number,
  quantity: number
): Promise<Order> => {
  // Validate crypto
  const crypto = await getCryptoBySymbol(symbol);
  if (!crypto) {
    throw new Error(`Cryptocurrency ${symbol} not found`);
  }

  if (type === 'buy') {
    // Check if user has enough USD
    const usdBalance = await WalletModel.getWalletBalance(userId, 'USD');
    const totalCost = price * quantity;
    if (usdBalance < totalCost) {
      throw new Error('Insufficient USD balance');
    }
  } else {
    // Check if user has enough crypto
    const cryptoBalance = await WalletModel.getWalletBalance(userId, symbol);
    if (cryptoBalance < quantity) {
      throw new Error(`Insufficient ${symbol} balance`);
    }
  }

  // Create order in database
  const order = await OrderModel.createOrder(userId, symbol, type, price, quantity);

  // Attempt to execute order on Kraken
  await executeOrderOnKraken(order);

  return order;
};

/**
 * Execute order on Kraken exchange
 * If Kraken is not configured or fails, falls back to auto-fill
 */
export const executeOrderOnKraken = async (order: Order) => {
  try {
    // Check if Kraken credentials are configured
    if (!process.env.KRAKEN_PUBLIC_KEY || !process.env.KRAKEN_PRIVATE_KEY) {
      console.warn(
        '⚠️  Kraken API not configured. Using demo mode. Set KRAKEN_PUBLIC_KEY and KRAKEN_PRIVATE_KEY to enable real trading.'
      );
      // Fall back to auto-fill order
      await fillOrder(order);
      return;
    }

    // Convert symbol to Kraken pair format
    // Examples: BTC -> XBTUSDT, ETH -> ETHUSDT
    const krakenPair = getKrakenPair(order.symbol);

    console.log(
      `📊 Executing ${order.type.toUpperCase()} order on Kraken: ${order.quantity} ${order.symbol} @ ${order.price} (Pair: ${krakenPair})`
    );

    let krakenOrder;
    if (order.type === 'buy') {
      krakenOrder = await krakenService.placeBuyOrder(krakenPair, order.quantity, order.price);
    } else {
      krakenOrder = await krakenService.placeSellOrder(krakenPair, order.quantity, order.price);
    }

    // Store Kraken transaction ID in order
    const krakenTxId = krakenOrder?.txid?.[0] || null;
    if (krakenTxId) {
      console.log(`✅ Order submitted to Kraken: ${krakenTxId}`);
      // Update order with Kraken transaction ID
      // Note: You'll need to add a field to store this in your Order model
      // await OrderModel.updateOrderKrakenTxId(order.id, krakenTxId);
    }

    // For now, auto-fill the order locally as well
    // In production, you'd wait for Kraken's order confirmation
    await fillOrder(order);
  } catch (error) {
    console.error(
      `⚠️  Failed to execute order on Kraken, falling back to demo mode:`,
      error
    );
    // Fall back to auto-fill order
    await fillOrder(order);
  }
};

/**
 * Convert cryptocurrency symbol to Kraken trading pair format
 * @param symbol Crypto symbol (e.g., 'BTC', 'ETH')
 * @returns Kraken pair (e.g., 'XBTUSDT', 'ETHUSDT')
 */
function getKrakenPair(symbol: string): string {
  const symbolMap: { [key: string]: string } = {
    BTC: 'XBTUSDT',
    ETH: 'ETHUSDT',
    LTC: 'LTCUSDT',
    XRP: 'XRPUSDT',
    ADA: 'ADAUSDT',
    DOT: 'DOTUSDT',
    SOL: 'SOLUSDT',
    DOGE: 'DOGEUSDT',
    MATIC: 'MATICUSDT',
    LINK: 'LINKUSDT',
  };

  return symbolMap[symbol] || symbol + 'USDT';
}

export const fillOrder = async (order: Order) => {
  try {
    // For demo purposes, we'll auto-fill orders
    // In production, this would match with existing orders in the orderbook

    const userWallets = await WalletModel.getWalletsByUser(order.user_id);

    if (order.type === 'buy') {
      // Deduct USD
      const usdWallet = userWallets.find((w) => w.currency === 'USD');
      if (usdWallet) {
        const totalCost = order.price * order.quantity;
        await WalletModel.updateWalletBalance(usdWallet.id, -totalCost);
      }

      // Add crypto
      let cryptoWallet = userWallets.find((w) => w.currency === order.symbol);
      if (!cryptoWallet) {
        cryptoWallet = await WalletModel.createWallet(order.user_id, order.symbol, 0);
      }
      await WalletModel.updateWalletBalance(cryptoWallet.id, order.quantity);

      // Record transaction
      await TransactionModel.createTransaction(
        order.user_id,
        'USD',
        order.symbol,
        order.quantity,
        order.price
      );
    } else {
      // Sell order
      // Deduct crypto
      const cryptoWallet = userWallets.find((w) => w.currency === order.symbol);
      if (cryptoWallet) {
        await WalletModel.updateWalletBalance(cryptoWallet.id, -order.quantity);
      }

      // Add USD
      const usdWallet = userWallets.find((w) => w.currency === 'USD');
      if (usdWallet) {
        const totalRevenue = order.price * order.quantity;
        await WalletModel.updateWalletBalance(usdWallet.id, totalRevenue);
      }

      // Record transaction
      await TransactionModel.createTransaction(
        order.user_id,
        order.symbol,
        'USD',
        order.quantity,
        order.price
      );
    }

    // Update order status
    await OrderModel.updateOrderStatus(order.id, 'filled');
  } catch (error) {
    console.error('Error filling order:', error);
    // Order remains pending
  }
};

export const cancelOrder = async (orderId: string, userId: string): Promise<Order> => {
  const order = await OrderModel.getOrderById(orderId);
  if (!order) {
    throw new Error('Order not found');
  }

  if (order.user_id !== userId) {
    throw new Error('Unauthorized');
  }

  if (order.status !== 'pending') {
    throw new Error('Cannot cancel non-pending order');
  }

  return OrderModel.cancelOrder(orderId);
};

export const getUserOrders = async (userId: string): Promise<Order[]> => {
  return OrderModel.getOrdersByUser(userId);
};

export const getOrderBook = async (symbol: string) => {
  return OrderModel.getOrderBook(symbol);
};
