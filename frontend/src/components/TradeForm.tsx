import React, { useState } from 'react';
import { orderService } from '../services/api';
import { MarketData } from '../types';

interface TradeFormProps {
  market: MarketData;
  onSuccess?: () => void;
}

export const TradeForm: React.FC<TradeFormProps> = ({ market, onSuccess }) => {
  const [type, setType] = useState<'buy' | 'sell'>('buy');
  const [price, setPrice] = useState(market.price);
  const [quantity, setQuantity] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const isForex = market.assetType === 'forex';
  const total = parseFloat(quantity || '0') * price;
  const priceDecimals = isForex ? 5 : 2;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!quantity || parseFloat(quantity) <= 0) {
      setError('Please enter a valid quantity');
      return;
    }

    setLoading(true);
    try {
      await orderService.createOrder(market.symbol, type, price, parseFloat(quantity));
      setSuccess(`${type === 'buy' ? 'Buy' : 'Sell'} order placed successfully!`);
      setQuantity('');
      setTimeout(() => {
        onSuccess?.();
      }, 1000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-gray-800 border border-gray-700 rounded-lg p-6 space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Trade {market.symbol}</h3>
        {isForex && <span className="text-xs px-2 py-1 rounded bg-gray-700 text-gray-300">FOREX</span>}
      </div>

      <div className="flex gap-2 mb-4">
        {(['buy', 'sell'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setType(t)}
            className={`flex-1 py-2 px-4 rounded font-semibold transition ${
              type === t
                ? t === 'buy'
                  ? 'bg-green-600 text-white'
                  : 'bg-red-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {t === 'buy' ? 'Buy' : 'Sell'}
          </button>
        ))}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Price (USD)</label>
        <input
          type="number"
          value={price}
          onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
          step={isForex ? '0.00001' : '0.01'}
          min="0"
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
          disabled
        />
        {isForex && 'bid' in market && 'ask' in market && (
          <div className="text-xs text-gray-400 mt-1">
            Bid: ${market.bid.toFixed(5)} | Ask: ${market.ask.toFixed(5)}
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Quantity</label>
        <input
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          placeholder={isForex ? '0.00000' : '0.00000000'}
          step={isForex ? '0.00001' : '0.00000001'}
          min="0"
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
        />
      </div>

      <div className="bg-gray-700 rounded p-3">
        <div className="flex justify-between text-gray-300">
          <span>Total:</span>
          <span className="font-semibold text-white">${total.toFixed(priceDecimals)}</span>
        </div>
      </div>

      {error && <div className="bg-red-900 border border-red-700 text-red-200 px-3 py-2 rounded text-sm">{error}</div>}
      {success && (
        <div className="bg-green-900 border border-green-700 text-green-200 px-3 py-2 rounded text-sm">{success}</div>
      )}

      <button
        type="submit"
        disabled={loading || !quantity}
        className={`w-full py-2 px-4 rounded font-semibold transition ${
          type === 'buy'
            ? 'bg-green-600 hover:bg-green-700 disabled:bg-gray-600'
            : 'bg-red-600 hover:bg-red-700 disabled:bg-gray-600'
        } text-white disabled:cursor-not-allowed`}
      >
        {loading ? 'Processing...' : `${type === 'buy' ? 'Buy' : 'Sell'} ${market.symbol}`}
      </button>
    </form>
  );
};
