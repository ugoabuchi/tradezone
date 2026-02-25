import * as StockModel from '../models/StockPosition';
import axios from 'axios';

const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY || '';
const FINNHUB_API = 'https://finnhub.io/api/v1';

interface StockPrice {
  symbol: string;
  price: number;
  highPrice: number;
  lowPrice: number;
  openPrice: number;
  previousClose: number;
  timestamp: number;
}

export const getStockPrice = async (symbol: string): Promise<StockPrice> => {
  if (!FINNHUB_API_KEY) {
    throw new Error('FINNHUB_API_KEY not configured');
  }

  try {
    const response = await axios.get(`${FINNHUB_API}/quote`, {
      params: {
        symbol: symbol.toUpperCase(),
        token: FINNHUB_API_KEY,
      },
    });

    return {
      symbol,
      price: response.data.c,
      highPrice: response.data.h,
      lowPrice: response.data.l,
      openPrice: response.data.o,
      previousClose: response.data.pc,
      timestamp: response.data.t * 1000,
    };
  } catch (error) {
    console.error('Finnhub API error:', error);
    throw new Error(`Failed to fetch stock price for ${symbol}`);
  }
};

export const getStockProfile = async (symbol: string) => {
  if (!FINNHUB_API_KEY) {
    throw new Error('FINNHUB_API_KEY not configured');
  }

  try {
    const response = await axios.get(`${FINNHUB_API}/stock/profile2`, {
      params: {
        symbol: symbol.toUpperCase(),
        token: FINNHUB_API_KEY,
      },
    });

    return response.data;
  } catch (error) {
    console.error('Finnhub API error:', error);
    throw new Error(`Failed to fetch stock profile for ${symbol}`);
  }
};

export const buyStock = async (
  userId: string,
  symbol: string,
  quantity: number,
  price: number
) => {
  // Check if user already has this position
  const existingPositions = await StockModel.getStockPositions(userId);
  const existingPosition = existingPositions.find(p => p.symbol === symbol);

  if (existingPosition) {
    // Update existing position
    const totalCost = existingPosition.average_price * existingPosition.quantity + price * quantity;
    const totalQuantity = existingPosition.quantity + quantity;
    const newAveragePrice = totalCost / totalQuantity;

    return StockModel.updateStockPosition(existingPosition.id, {
      quantity: totalQuantity,
      averagePrice: newAveragePrice,
      currentPrice: price,
    });
  } else {
    // Create new position
    return StockModel.createStockPosition(userId, {
      symbol,
      quantity,
      averagePrice: price,
      currentPrice: price,
    });
  }
};

export const sellStock = async (
  userId: string,
  positionId: string,
  sellQuantity: number,
  sellPrice: number
) => {
  const position = await StockModel.getStockPosition(positionId);
  if (!position) throw new Error('Position not found');

  if (sellQuantity > position.quantity) {
    throw new Error('Cannot sell more than you own');
  }

  return StockModel.sellStockPosition(positionId, sellPrice, sellQuantity);
};

export const getUserStockPositions = async (userId: string) => {
  const positions = await StockModel.getStockPositions(userId);

  // Fetch current prices for all positions
  const enrichedPositions = await Promise.all(
    positions.map(async pos => {
      try {
        const currentData = await getStockPrice(pos.symbol);
        return {
          ...pos,
          current_price: currentData.price,
          pnl: (currentData.price - pos.average_price) * pos.quantity,
        };
      } catch {
        return pos;
      }
    })
  );

  return enrichedPositions;
};

export const calculateStockMetrics = async (userId: string) => {
  const positions = await getUserStockPositions(userId);

  const metrics = {
    totalPositions: positions.length,
    totalInvested: positions.reduce((sum, p) => sum + p.average_price * p.quantity, 0),
    totalCurrentValue: positions.reduce((sum, p) => sum + p.current_price * p.quantity, 0),
    totalPnL: positions.reduce((sum, p) => sum + (p.pnl || 0), 0),
    topPerformer: positions.reduce(
      (best, p) => {
        const pnlPercent = ((p.current_price - p.average_price) / p.average_price) * 100;
        const bestPnlPercent = ((best.current_price - best.average_price) / best.average_price) * 100;
        return pnlPercent > bestPnlPercent ? p : best;
      },
      positions[0] || null
    ),
    diversification: [
      ...new Set(positions.map(p => p.symbol.slice(0, 1))), // First letter of symbol (basic grouping)
    ].length,
  };

  return metrics;
};
