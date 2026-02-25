export interface User {
  id: string;
  email: string;
  password_hash: string;
  full_name: string;
  kyc_status: 'not_started' | 'pending' | 'approved' | 'rejected';
  is_demo_user: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Wallet {
  id: string;
  user_id: string;
  currency: string;
  balance: number;
  created_at: Date;
  updated_at: Date;
}

export interface KYCVerification {
  id: string;
  user_id: string;
  full_name: string;
  date_of_birth: Date;
  country: string;
  id_type: string;
  id_number: string;
  document_url?: string;
  address: string;
  phone_number: string;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason?: string;
  submitted_at: Date;
  verified_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface CryptoWalletAddress {
  id: string;
  user_id: string;
  blockchain: string;
  currency: string;
  public_address: string;
  private_key_encrypted?: string;
  label?: string;
  is_imported: boolean;
  is_primary: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface TradingAccount {
  id: string;
  user_id: string;
  account_type: 'spot' | 'futures' | 'demo' | 'copy';
  balance: number;
  leverage: number;
  status: string;
  created_at: Date;
  updated_at: Date;
}

export interface CopyTrade {
  id: string;
  follower_user_id: string;
  leader_user_id: string;
  allocation_percentage: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Order {
  id: string;
  user_id: string;
  symbol: string;
  type: 'buy' | 'sell';
  price: number;
  quantity: number;
  status: 'pending' | 'filled' | 'cancelled';
  created_at: Date;
  filled_at?: Date;
}

export interface Transaction {
  id: string;
  user_id: string;
  from_currency: string;
  to_currency: string;
  amount: number;
  price: number;
  created_at: Date;
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

// Futures Trading
export interface FuturesPosition {
  id: string;
  user_id: string;
  symbol: string;
  side: 'long' | 'short';
  entry_price: number;
  current_price: number;
  quantity: number;
  leverage: number;
  stop_loss?: number;
  take_profit?: number;
  status: 'open' | 'closed';
  pnl?: number;
  created_at: Date;
  closed_at?: Date;
}

// Stock Trading
export interface StockPosition {
  id: string;
  user_id: string;
  symbol: string;
  quantity: number;
  average_price: number;
  current_price: number;
  status: 'holding' | 'sold';
  pnl?: number;
  created_at: Date;
  updated_at: Date;
}

// NFT Trading
export interface NFTHolding {
  id: string;
  user_id: string;
  contract_address: string;
  token_id: string;
  name: string;
  description?: string;
  image_url?: string;
  collection_name: string;
  blockchain: string;
  rarity_score?: number;
  acquired_price?: number;
  current_price?: number;
  status: 'holding' | 'listed' | 'sold';
  created_at: Date;
  updated_at: Date;
}

// Marketplace
export interface MarketplaceListing {
  id: string;
  seller_user_id: string;
  listing_type: 'nft' | 'product' | 'service';
  item_id: string;
  title: string;
  description: string;
  images?: string[];
  price: number;
  currency: string;
  quantity: number;
  status: 'active' | 'sold' | 'cancelled';
  views: number;
  created_at: Date;
  updated_at: Date;
}

export interface MarketplaceOrder {
  id: string;
  buyer_user_id: string;
  listing_id?: string;
  seller_user_id?: string;
  item_id: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  currency: string;
  payment_status: 'pending' | 'completed' | 'failed' | 'refunded';
  fulfillment_status: 'pending' | 'shipped' | 'delivered' | 'cancelled';
  shipping_address?: string;
  tracking_number?: string;
  created_at: Date;
  updated_at: Date;
}

// AI Trading Bot
export interface AITradingBot {
  id: string;
  user_id: string;
  bot_name: string;
  strategy: string;
  symbol: string;
  status: 'active' | 'inactive' | 'paused';
  initial_capital: number;
  current_balance: number;
  allocated_percentage: number;
  ai_model: 'deepseek' | 'gemini' | 'hybrid';
  risk_level: 'low' | 'medium' | 'high';
  trades_executed: number;
  total_return: number;
  win_rate: number;
  parameters?: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export interface AITradingHistory {
  id: string;
  bot_id: string;
  user_id: string;
  symbol: string;
  action: 'buy' | 'sell';
  price: number;
  quantity: number;
  pnl?: number;
  confidence_score?: number;
  ai_reasoning?: string;
  created_at: Date;
}

export interface JWTPayload {
  userId: string;
  email: string;
}

export interface AuthRequest {
  email: string;
  password: string;
}

export interface CreateOrderRequest {
  symbol: string;
  type: 'buy' | 'sell';
  price: number;
  quantity: number;
}
