import axios, { AxiosInstance } from 'axios';
import crypto from 'crypto';

interface KrakenConfig {
  apiUrl: string;
  publicKey: string;
  privateKey: string;
}

interface KrakenOrder {
  txid: string[];
  descr?: {
    order: string;
  };
}

interface KrakenBalance {
  [key: string]: string;
}

interface KrakenTicker {
  [key: string]: {
    a: [string, string, string]; // ask
    b: [string, string, string]; // bid
    c: [string, string, string]; // close
    v: [string, string]; // volume
    p: [string, string]; // vwap
    t: [number, number]; // trades
    l: [string, string]; // low
    h: [string, string]; // high
    o: string; // open
  };
}

export class KrakenService {
  private config: KrakenConfig;
  private client: AxiosInstance;

  constructor() {
    this.config = {
      apiUrl: process.env.KRAKEN_API_URL || 'https://api.kraken.com',
      publicKey: process.env.KRAKEN_PUBLIC_KEY || '',
      privateKey: process.env.KRAKEN_PRIVATE_KEY || '',
    };

    this.client = axios.create({
      baseURL: this.config.apiUrl,
      timeout: 30000,
    });

    if (!this.config.publicKey || !this.config.privateKey) {
      console.warn('⚠️  Kraken API credentials not configured. Please set KRAKEN_PUBLIC_KEY and KRAKEN_PRIVATE_KEY in .env');
    }
  }

  /**
   * Generate Kraken API request signature
   * @param path API endpoint path
   * @param data Request data
   * @param method HTTP method
   * @returns Signature header value
   */
  private getKrakenSignature(
    path: string,
    data: Record<string, any>,
    method: string = 'POST'
  ): { signature: string; nonce: string } {
    const nonce = Date.now().toString();
    const postdata = new URLSearchParams({
      ...data,
      nonce,
    }).toString();

    const message = path + crypto.createHash('sha256').update(nonce + postdata).digest();
    const signature = crypto
      .createHmac('sha512', Buffer.from(this.config.privateKey, 'base64'))
      .update(message)
      .digest('base64');

    return { signature, nonce };
  }

  /**
   * Make a private API request to Kraken
   * @param endpoint API endpoint
   * @param data Request data
   * @returns Response data
   */
  private async privateRequest(
    endpoint: string,
    data: Record<string, any> = {}
  ): Promise<any> {
    if (!this.config.publicKey || !this.config.privateKey) {
      throw new Error('Kraken API credentials not configured');
    }

    const path = `/0/private/${endpoint}`;
    const { signature, nonce } = this.getKrakenSignature(path, data);

    const postdata = new URLSearchParams({
      ...data,
      nonce,
    }).toString();

    try {
      const response = await this.client.post(path, postdata, {
        headers: {
          'API-Sign': signature,
          'API-Key': this.config.publicKey,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      if (response.data.error && response.data.error.length > 0) {
        throw new Error(`Kraken API Error: ${response.data.error.join(', ')}`);
      }

      return response.data.result;
    } catch (error: any) {
      console.error('Kraken private request error:', error.message);
      throw error;
    }
  }

  /**
   * Make a public API request to Kraken
   * @param endpoint API endpoint
   * @param params Query parameters
   * @returns Response data
   */
  private async publicRequest(endpoint: string, params: Record<string, any> = {}): Promise<any> {
    const path = `/0/public/${endpoint}`;

    try {
      const response = await this.client.get(path, { params });

      if (response.data.error && response.data.error.length > 0) {
        throw new Error(`Kraken API Error: ${response.data.error.join(', ')}`);
      }

      return response.data.result;
    } catch (error: any) {
      console.error('Kraken public request error:', error.message);
      throw error;
    }
  }

  /**
   * Get account balance
   * @returns User's account balances
   */
  async getBalance(): Promise<KrakenBalance> {
    try {
      const balance = await this.privateRequest('Balance');
      return balance;
    } catch (error) {
      console.error('Error fetching Kraken balance:', error);
      throw new Error('Failed to fetch account balance from Kraken');
    }
  }

  /**
   * Get specific asset balance
   * @param asset Asset code (e.g., 'XBT' for Bitcoin, 'ETH' for Ethereum)
   * @returns Balance amount
   */
  async getAssetBalance(asset: string): Promise<number> {
    try {
      const balance = await this.getBalance();
      // Kraken uses 'X' prefix for crypto assets
      const krakenAsset = asset === 'BTC' ? 'XBT' : asset;
      const balanceKey = Object.keys(balance).find(
        (key) => key.endsWith(krakenAsset) || key === krakenAsset
      );

      if (!balanceKey) {
        return 0;
      }

      return parseFloat(balance[balanceKey]) || 0;
    } catch (error) {
      console.error(`Error fetching balance for ${asset}:`, error);
      return 0;
    }
  }

  /**
   * Place a buy order on Kraken
   * @param pair Trading pair (e.g., 'XBTUSDT')
   * @param volume Amount to buy
   * @param price Price per unit
   * @returns Order transaction details
   */
  async placeBuyOrder(pair: string, volume: number, price: number): Promise<KrakenOrder> {
    try {
      const order = await this.privateRequest('AddOrder', {
        pair,
        type: 'buy',
        ordertype: 'limit',
        price: price.toString(),
        volume: volume.toString(),
      });

      return order;
    } catch (error) {
      console.error('Error placing buy order on Kraken:', error);
      throw new Error('Failed to place buy order on Kraken');
    }
  }

  /**
   * Place a sell order on Kraken
   * @param pair Trading pair (e.g., 'XBTUSDT')
   * @param volume Amount to sell
   * @param price Price per unit
   * @returns Order transaction details
   */
  async placeSellOrder(pair: string, volume: number, price: number): Promise<KrakenOrder> {
    try {
      const order = await this.privateRequest('AddOrder', {
        pair,
        type: 'sell',
        ordertype: 'limit',
        price: price.toString(),
        volume: volume.toString(),
      });

      return order;
    } catch (error) {
      console.error('Error placing sell order on Kraken:', error);
      throw new Error('Failed to place sell order on Kraken');
    }
  }

  /**
   * Place a market order (buys/sells at current market price)
   * @param pair Trading pair
   * @param type 'buy' or 'sell'
   * @param volume Amount to trade
   * @returns Order transaction details
   */
  async placeMarketOrder(
    pair: string,
    type: 'buy' | 'sell',
    volume: number
  ): Promise<KrakenOrder> {
    try {
      const order = await this.privateRequest('AddOrder', {
        pair,
        type,
        ordertype: 'market',
        volume: volume.toString(),
      });

      return order;
    } catch (error) {
      console.error('Error placing market order on Kraken:', error);
      throw new Error('Failed to place market order on Kraken');
    }
  }

  /**
   * Cancel an order
   * @param transactionId Order transaction ID
   * @returns Cancellation result
   */
  async cancelOrder(transactionId: string): Promise<any> {
    try {
      const result = await this.privateRequest('CancelOrder', {
        txid: transactionId,
      });

      return result;
    } catch (error) {
      console.error('Error canceling order on Kraken:', error);
      throw new Error('Failed to cancel order on Kraken');
    }
  }

  /**
   * Get open orders
   * @returns List of open orders
   */
  async getOpenOrders(): Promise<any> {
    try {
      const orders = await this.privateRequest('OpenOrders');
      return orders;
    } catch (error) {
      console.error('Error fetching open orders from Kraken:', error);
      throw new Error('Failed to fetch open orders from Kraken');
    }
  }

  /**
   * Get closed orders
   * @param trades Include trade info
   * @returns List of closed orders
   */
  async getClosedOrders(trades: boolean = false): Promise<any> {
    try {
      const orders = await this.privateRequest('ClosedOrders', {
        trades: trades ? 'true' : 'false',
      });

      return orders;
    } catch (error) {
      console.error('Error fetching closed orders from Kraken:', error);
      throw new Error('Failed to fetch closed orders from Kraken');
    }
  }

  /**
   * Get order status
   * @param txid Transaction ID
   * @returns Order details
   */
  async getOrderStatus(txid: string): Promise<any> {
    try {
      const orders = await this.privateRequest('QueryOrders', {
        txid,
      });

      return orders[txid] || null;
    } catch (error) {
      console.error('Error fetching order status from Kraken:', error);
      throw new Error('Failed to fetch order status from Kraken');
    }
  }

  /**
   * Get trading pair ticker information
   * @param pair Trading pair (e.g., 'XBTUSDT')
   * @returns Ticker information
   */
  async getTicker(pair: string): Promise<any> {
    try {
      const ticker = await this.publicRequest('Ticker', { pair });
      return ticker[pair] || null;
    } catch (error) {
      console.error('Error fetching ticker from Kraken:', error);
      throw new Error('Failed to fetch ticker from Kraken');
    }
  }

  /**
   * Get multiple tickers
   * @param pairs Array of trading pairs
   * @returns Ticker information for all pairs
   */
  async getMultipleTickers(pairs: string[]): Promise<KrakenTicker> {
    try {
      const ticker = await this.publicRequest('Ticker', {
        pair: pairs.join(','),
      });

      return ticker;
    } catch (error) {
      console.error('Error fetching multiple tickers from Kraken:', error);
      throw new Error('Failed to fetch tickers from Kraken');
    }
  }

  /**
   * Get OHLC (candlestick) data
   * @param pair Trading pair
   * @param interval Time interval in minutes
   * @returns OHLC data
   */
  async getOHLC(pair: string, interval: number = 1): Promise<any> {
    try {
      const ohlc = await this.publicRequest('OHLC', {
        pair,
        interval,
      });

      return ohlc;
    } catch (error) {
      console.error('Error fetching OHLC from Kraken:', error);
      throw new Error('Failed to fetch OHLC data from Kraken');
    }
  }

  /**
   * Get order book
   * @param pair Trading pair
   * @param count Max number of asks/bids
   * @returns Order book data
   */
  async getOrderBook(pair: string, count?: number): Promise<any> {
    try {
      const params: Record<string, any> = { pair };
      if (count) {
        params.count = count;
      }

      const orderbook = await this.publicRequest('Depth', params);
      return orderbook;
    } catch (error) {
      console.error('Error fetching order book from Kraken:', error);
      throw new Error('Failed to fetch order book from Kraken');
    }
  }

  /**
   * Get recent trades
   * @param pair Trading pair
   * @returns Recent trades
   */
  async getRecentTrades(pair: string): Promise<any> {
    try {
      const trades = await this.publicRequest('Trades', { pair });
      return trades;
    } catch (error) {
      console.error('Error fetching recent trades from Kraken:', error);
      throw new Error('Failed to fetch recent trades from Kraken');
    }
  }

  /**
   * Get spread data
   * @param pair Trading pair
   * @returns Spread information
   */
  async getSpread(pair: string): Promise<any> {
    try {
      const spread = await this.publicRequest('Spread', { pair });
      return spread;
    } catch (error) {
      console.error('Error fetching spread from Kraken:', error);
      throw new Error('Failed to fetch spread data from Kraken');
    }
  }

  /**
   * Get asset information
   * @returns Available assets
   */
  async getAssets(): Promise<any> {
    try {
      const assets = await this.publicRequest('Assets');
      return assets;
    } catch (error) {
      console.error('Error fetching assets from Kraken:', error);
      throw new Error('Failed to fetch assets from Kraken');
    }
  }

  /**
   * Get trading pairs information
   * @returns Available trading pairs
   */
  async getAssetPairs(): Promise<any> {
    try {
      const pairs = await this.publicRequest('AssetPairs');
      return pairs;
    } catch (error) {
      console.error('Error fetching asset pairs from Kraken:', error);
      throw new Error('Failed to fetch asset pairs from Kraken');
    }
  }

  /**
   * Get server time (for nonce verification)
   * @returns Server time
   */
  async getServerTime(): Promise<any> {
    try {
      const time = await this.publicRequest('Time');
      return time;
    } catch (error) {
      console.error('Error fetching server time from Kraken:', error);
      throw new Error('Failed to fetch server time from Kraken');
    }
  }
}

// Export singleton instance
export const krakenService = new KrakenService();
