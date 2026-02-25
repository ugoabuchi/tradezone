import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Balance, Portfolio } from '../types';
import { accountService } from '../services/api';

interface AccountState {
  balances: Balance[];
  portfolio: Portfolio | null;
  loading: boolean;
  error: string | null;
  lastUpdate: number;
}

const initialState: AccountState = {
  balances: [],
  portfolio: null,
  loading: false,
  error: null,
  lastUpdate: 0,
};

export const fetchBalance = createAsyncThunk('account/fetchBalance', async () => {
  return accountService.getBalance();
});

export const fetchPortfolio = createAsyncThunk('account/fetchPortfolio', async () => {
  return accountService.getPortfolio();
});

const accountSlice = createSlice({
  name: 'account',
  initialState,
  reducers: {
    updateBalances: (state, action: PayloadAction<Balance[]>) => {
      state.balances = action.payload;
      state.lastUpdate = Date.now();
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBalance.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBalance.fulfilled, (state, action: PayloadAction<Balance[]>) => {
        state.loading = false;
        state.balances = action.payload;
        state.lastUpdate = Date.now();
      })
      .addCase(fetchBalance.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch balance';
      })
      .addCase(fetchPortfolio.fulfilled, (state, action: PayloadAction<Portfolio>) => {
        state.portfolio = action.payload;
      });
  },
});

export const { updateBalances } = accountSlice.actions;
export default accountSlice.reducer;
