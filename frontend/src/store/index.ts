import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import marketReducer from './marketSlice';
import accountReducer from './accountSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    market: marketReducer,
    account: accountReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
