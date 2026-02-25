export interface User {
  id: string;
  email: string;
  full_name: string;
}

export interface Balance {
  currency: string;
  balance: number;
  price: number;
  value: number;
}

export interface CryptoData {
  id: string;
  symbol: string;
  name: string;
  price: number;
  market_cap: number;
  volume_24h: number;
  price_change_24h: number;
  image: string;
}

export interface ForexData {
  id: string;
  symbol: string;
  name: string;
  price: number;
  bid: number;
  ask: number;
  volume_24h: number;
  price_change_24h: number;
  high_24h: number;
  low_24h: number;
  image: string;
  assetType: 'forex';
}

export type MarketData = (CryptoData & { assetType?: 'crypto' }) | ForexData;

export interface Order {
  id: string;
  symbol: string;
  type: 'buy' | 'sell';
  price: number;
  quantity: number;
  status: 'pending' | 'filled' | 'cancelled';
  created_at: string;
  filled_at?: string;
}

export interface Portfolio {
  totalValue: number;
  totalUSD: number;
  holdings: Balance[];
}

export interface AuthResponse {
  token: string;
  userId: string;
  email?: string;
}

export interface OrderBook {
  bids: Array<{ type: string; price: number; total_quantity: number; order_count: number }>;
  asks: Array<{ type: string; price: number; total_quantity: number; order_count: number }>;
}
