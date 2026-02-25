import axios from 'axios';
import { AuthResponse } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: `${API_URL}/api`,
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authService = {
  register: async (email: string, password: string, fullName: string) => {
    const response = await api.post<AuthResponse>('/auth/register', {
      email,
      password,
      fullName,
    });
    return response.data;
  },

  login: async (email: string, password: string) => {
    const response = await api.post<AuthResponse>('/auth/login', {
      email,
      password,
    });
    return response.data;
  },
};

export const marketService = {
  getMarkets: async () => {
    const response = await api.get('/markets');
    return response.data;
  },

  getMarketById: async (id: string) => {
    const response = await api.get(`/markets/${id}`);
    return response.data;
  },

  getForexPairs: async () => {
    const response = await api.get('/markets/forex/pairs');
    return response.data;
  },
};

export const orderService = {
  createOrder: async (symbol: string, type: 'buy' | 'sell', price: number, quantity: number) => {
    const response = await api.post('/orders', { symbol, type, price, quantity });
    return response.data;
  },

  getOrders: async (status?: string) => {
    const response = await api.get('/orders', { params: { status } });
    return response.data;
  },

  cancelOrder: async (orderId: string) => {
    const response = await api.delete(`/orders/${orderId}`);
    return response.data;
  },

  getOrderBook: async (symbol: string) => {
    const response = await api.get(`/orders/book/${symbol}`);
    return response.data;
  },
};

export const accountService = {
  getBalance: async () => {
    const response = await api.get('/account/balance');
    return response.data;
  },

  getPortfolio: async () => {
    const response = await api.get('/account/portfolio');
    return response.data;
  },

  getTransactions: async (limit?: number) => {
    const response = await api.get('/account/transactions', { params: { limit } });
    return response.data;
  },
};

export default api;
