import axios from 'axios';
import { ForexData } from '../types';

const KRAKEN_API = 'https://api.kraken.com/0/public';

// Common forex pairs with their Kraken asset pair names
const FOREX_PAIRS = [
  { symbol: 'EUR/USD', name: 'Euro / US Dollar', krakenPair: 'EURUSD' },
  { symbol: 'GBP/USD', name: 'British Pound / US Dollar', krakenPair: 'GBPUSD' },
  { symbol: 'USD/JPY', name: 'US Dollar / Japanese Yen', krakenPair: 'USDJPY' },
  { symbol: 'USD/CHF', name: 'US Dollar / Swiss Franc', krakenPair: 'USDCHF' },
  { symbol: 'AUD/USD', name: 'Australian Dollar / US Dollar', krakenPair: 'AUDUSD' },
  { symbol: 'USD/CAD', name: 'US Dollar / Canadian Dollar', krakenPair: 'USDCAD' },
  { symbol: 'NZD/USD', name: 'New Zealand Dollar / US Dollar', krakenPair: 'NZDUSD' },
];

let forexCache: Map<string, ForexData> = new Map();
let lastUpdate = 0;
const CACHE_DURATION = 15000; // 15 seconds for more frequent updates

interface KrakenTicker {
  a: [string, string, string]; // ask
  b: [string, string, string]; // bid
  c: [string, string]; // last trade
  v: [string, string]; // volume
  p: [string, string]; // price
  t: [number, number]; // trade count
  l: [string, string]; // low
  h: [string, string]; // high
  o: string; // open
}

export const fetchForexData = async (): Promise<ForexData[]> => {
  const now = Date.now();
  if (now - lastUpdate < CACHE_DURATION && forexCache.size > 0) {
    return Array.from(forexCache.values());
  }

  try {
    const pairs = FOREX_PAIRS.map(p => p.krakenPair).join(',');
    const response = await axios.get(`${KRAKEN_API}/Ticker?pair=${pairs}`, {
      timeout: 5000,
    });

    if (response.data.result) {
      const forexData: ForexData[] = [];

      for (const pair of FOREX_PAIRS) {
        const krakenData = response.data.result[pair.krakenPair];
        if (krakenData) {
          const currentPrice = parseFloat(krakenData.c[0]); // last trade price
          const openPrice = parseFloat(krakenData.o);
          const priceChange24h = openPrice > 0 ? ((currentPrice - openPrice) / openPrice) * 100 : 0;

          const forexItem: ForexData = {
            id: pair.symbol.toLowerCase().replace('/', ''),
            symbol: pair.symbol,
            name: pair.name,
            price: currentPrice,
            bid: parseFloat(krakenData.b[0]),
            ask: parseFloat(krakenData.a[0]),
            volume_24h: parseFloat(krakenData.v[1]), // volume in last 24h
            price_change_24h: priceChange24h,
            high_24h: parseFloat(krakenData.h[1]),
            low_24h: parseFloat(krakenData.l[1]),
            image: '', // Kraken doesn't provide images
            assetType: 'forex',
          };

          forexCache.set(pair.symbol, forexItem);
          forexData.push(forexItem);
        }
      }

      lastUpdate = now;
      return forexData;
    }

    return Array.from(forexCache.values());
  } catch (error) {
    console.error('Error fetching forex data from Kraken:', error);
    return Array.from(forexCache.values());
  }
};

export const getForexBySymbol = async (symbol: string): Promise<ForexData | null> => {
  const data = await fetchForexData();
  return data.find((f) => f.symbol === symbol.toUpperCase()) || null;
};

export const getAllForex = async (): Promise<ForexData[]> => {
  return fetchForexData();
};

export const startPriceUpdates = (callback: (data: ForexData[]) => void) => {
  const interval = setInterval(async () => {
    const data = await fetchForexData();
    if (data.length > 0) {
      callback(data);
    }
  }, Number(process.env.FOREX_UPDATE_INTERVAL) || 15000);

  return () => clearInterval(interval);
};

// Get available forex pairs
export const getAvailablePairs = (): string[] => {
  return FOREX_PAIRS.map(p => p.symbol);
};
