import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { CryptoData, ForexData, MarketData, OrderBook } from '../types';
import { marketService, orderService } from '../services/api';

interface MarketState {
  markets: MarketData[];
  cryptos: CryptoData[];
  forex: ForexData[];
  forexPairs: string[];
  orderBooks: Record<string, OrderBook>;
  selectedMarket: MarketData | null;
  loading: boolean;
  error: string | null;
  lastUpdate: number;
}

const initialState: MarketState = {
  markets: [],
  cryptos: [],
  forex: [],
  forexPairs: [],
  orderBooks: {},
  selectedMarket: null,
  loading: false,
  error: null,
  lastUpdate: 0,
};

export const fetchMarkets = createAsyncThunk('market/fetchMarkets', async () => {
  return marketService.getMarkets();
});

export const fetchForexPairs = createAsyncThunk('market/fetchForexPairs', async () => {
  return marketService.getForexPairs();
});

export const fetchOrderBook = createAsyncThunk(
  'market/fetchOrderBook',
  async (symbol: string) => {
    const data = await orderService.getOrderBook(symbol);
    return { symbol, ...data };
  }
);

const marketSlice = createSlice({
  name: 'market',
  initialState,
  reducers: {
    setMarkets: (state, action: PayloadAction<MarketData[]>) => {
      state.markets = action.payload;
      state.cryptos = action.payload.filter(m => m.assetType !== 'forex') as CryptoData[];
      state.forex = action.payload.filter(m => m.assetType === 'forex') as ForexData[];
      state.lastUpdate = Date.now();
    },
    setSelectedMarket: (state, action: PayloadAction<MarketData | null>) => {
      state.selectedMarket = action.payload;
    },
    updateCryptoPrices: (state, action: PayloadAction<CryptoData[]>) => {
      const newCryptos = action.payload;
      state.cryptos = state.cryptos.map((crypto) => {
        const updated = newCryptos.find((c) => c.symbol === crypto.symbol);
        return updated || crypto;
      });
      state.markets = state.markets.map((market) => {
        const updated = newCryptos.find((c) => c.symbol === market.symbol);
        return updated ? { ...market, ...updated } : market;
      });
      state.lastUpdate = Date.now();
    },
    updateForexPrices: (state, action: PayloadAction<ForexData[]>) => {
      const newForex = action.payload;
      state.forex = state.forex.map((forex) => {
        const updated = newForex.find((f) => f.symbol === forex.symbol);
        return updated || forex;
      });
      state.markets = state.markets.map((market) => {
        const updated = newForex.find((f) => f.symbol === market.symbol);
        return updated ? { ...market, ...updated } : market;
      });
      state.lastUpdate = Date.now();
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMarkets.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMarkets.fulfilled, (state, action: PayloadAction<MarketData[]>) => {
        state.loading = false;
        state.markets = action.payload;
        state.cryptos = action.payload.filter(m => m.assetType !== 'forex') as CryptoData[];
        state.forex = action.payload.filter(m => m.assetType === 'forex') as ForexData[];
        state.lastUpdate = Date.now();
      })
      .addCase(fetchMarkets.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch markets';
      })
      .addCase(fetchForexPairs.fulfilled, (state, action) => {
        state.forexPairs = action.payload.pairs || [];
      })
      .addCase(fetchOrderBook.fulfilled, (state, action) => {
        state.orderBooks[action.payload.symbol] = {
          bids: action.payload.bids,
          asks: action.payload.asks,
        };
      });
  },
});

export const { setMarkets, setSelectedMarket, updateCryptoPrices, updateForexPrices } = marketSlice.actions;
export default marketSlice.reducer;
