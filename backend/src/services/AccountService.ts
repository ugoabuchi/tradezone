import * as WalletModel from '../models/Wallet';
import * as TransactionModel from '../models/Transaction';
import { CryptoData } from '../types';
import { getCryptoBySymbol, getAllCryptos } from './CryptoService';

export const getUserBalances = async (userId: string) => {
  const wallets = await WalletModel.getWalletsByUser(userId);
  const cryptoData = await getAllCryptos();

  const cryptoMap = new Map(cryptoData.map((c) => [c.symbol, c]));

  return wallets.map((wallet) => {
    const crypto = cryptoMap.get(wallet.currency);
    const currentPrice = crypto ? crypto.price : 0;
    const value = Number(wallet.balance) * currentPrice;

    return {
      currency: wallet.currency,
      balance: Number(wallet.balance),
      price: currentPrice,
      value,
    };
  });
};

export const getUserPortfolio = async (userId: string) => {
  const balances = await getUserBalances(userId);

  const totalValue = balances.reduce((sum, b) => sum + b.value, 0);

  const portfolio = {
    totalValue,
    totalUSD: balances.find((b) => b.currency === 'USD')?.balance || 0,
    holdings: balances.filter((b) => b.currency !== 'USD' && b.balance > 0),
  };

  return portfolio;
};

export const getTransactionHistory = async (userId: string, limit: number = 50) => {
  return TransactionModel.getTransactionsByUser(userId, limit);
};
