import * as CryptoService from './CryptoService';
import * as ForexService from './ForexService';
import { MarketData, CryptoData, ForexData } from '../types';

export const getAllMarkets = async (): Promise<MarketData[]> => {
  const [cryptoData, forexData] = await Promise.all([
    CryptoService.getAllCryptos(),
    ForexService.getAllForex(),
  ]);

  const marketData: MarketData[] = [
    ...cryptoData.map(c => ({ ...c, assetType: 'crypto' as const })),
    ...forexData,
  ];

  return marketData;
};

export const getMarketBySymbol = async (symbol: string): Promise<MarketData | null> => {
  // Check if it's a forex pair (contains /)
  if (symbol.includes('/')) {
    const forex = await ForexService.getForexBySymbol(symbol);
    return forex as ForexData | null;
  }

  // Otherwise treat as crypto
  const crypto = await CryptoService.getCryptoBySymbol(symbol);
  return crypto ? { ...crypto, assetType: 'crypto' as const } : null;
};

export const startPriceUpdates = (
  cryptoCallback: (data: any[]) => void,
  forexCallback: (data: any[]) => void
) => {
  const unsubscribeCrypto = CryptoService.startPriceUpdates(cryptoCallback);
  const unsubscribeForex = ForexService.startPriceUpdates(forexCallback);

  return () => {
    unsubscribeCrypto();
    unsubscribeForex();
  };
};

export const getForexPairs = (): string[] => {
  return ForexService.getAvailablePairs();
};
