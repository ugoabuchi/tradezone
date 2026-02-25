import axios from 'axios';
import { CryptoData } from '../types';

const COINGECKO_API = process.env.COINGECKO_API_URL || 'https://api.coingecko.com/api/v3';
const CRYPTO_IDS = ['bitcoin', 'ethereum', 'litecoin', 'cardano', 'polkadot', 'ripple', 'solana'];

let cryptoCache: Map<string, CryptoData> = new Map();
let lastUpdate = 0;
const CACHE_DURATION = 30000; // 30 seconds

export const fetchCryptoData = async (): Promise<CryptoData[]> => {
  const now = Date.now();
  if (now - lastUpdate < CACHE_DURATION && cryptoCache.size > 0) {
    return Array.from(cryptoCache.values());
  }

  try {
    const params = new URLSearchParams({
      ids: CRYPTO_IDS.join(','),
      vs_currencies: 'usd',
      order: 'market_cap_desc',
      per_page: '250',
      sparkline: 'false',
      market_data: 'true',
    });

    const response = await axios.get(`${COINGECKO_API}/coins/markets?${params}`);
    const data: CryptoData[] = response.data.map((coin: any) => ({
      id: coin.id,
      symbol: coin.symbol.toUpperCase(),
      name: coin.name,
      price: coin.current_price || 0,
      market_cap: coin.market_cap || 0,
      volume_24h: coin.total_volume || 0,
      price_change_24h: coin.price_change_percentage_24h || 0,
      image: coin.image || '',
    }));

    cryptoCache.clear();
    data.forEach((crypto) => cryptoCache.set(crypto.symbol, crypto));
    lastUpdate = now;

    return data;
  } catch (error) {
    console.error('Error fetching crypto data:', error);
    return Array.from(cryptoCache.values());
  }
};

export const getCryptoBySymbol = async (symbol: string): Promise<CryptoData | null> => {
  const data = await fetchCryptoData();
  return data.find((c) => c.symbol === symbol.toUpperCase()) || null;
};

export const getAllCryptos = async (): Promise<CryptoData[]> => {
  return fetchCryptoData();
};

export const startPriceUpdates = (callback: (data: CryptoData[]) => void) => {
  const interval = setInterval(async () => {
    const data = await fetchCryptoData();
    callback(data);
  }, Number(process.env.COINGECKO_UPDATE_INTERVAL) || 10000);

  return () => clearInterval(interval);
};
