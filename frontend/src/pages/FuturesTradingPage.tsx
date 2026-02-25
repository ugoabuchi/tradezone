import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import api from '../services/api';

interface FuturesPosition {
  id: string;
  symbol: string;
  side: 'long' | 'short';
  entry_price: number;
  current_price: number;
  quantity: number;
  leverage: number;
  pnl?: number;
  status: 'open' | 'closed';
}

export const FuturesTradingPage: React.FC = () => {
  const { user } = useSelector((state: any) => state.auth);
  const [positions, setPositions] = useState<FuturesPosition[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    symbol: 'BTC/USD',
    side: 'long' as const,
    entryPrice: 0,
    quantity: 0,
    leverage: 2,
    stopLoss: 0,
    takeProfit: 0,
  });
  const [metrics, setMetrics] = useState<any>(null);

  useEffect(() => {
    fetchPositions();
    fetchMetrics();
  }, []);

  const fetchPositions = async () => {
    try {
      const response = await api.get('/futures');
      setPositions(response.data);
    } catch (error) {
      console.error('Failed to fetch positions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMetrics = async () => {
    try {
      const response = await api.get('/futures/metrics');
      setMetrics(response.data);
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
    }
  };

  const handleCreatePosition = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/futures', formData);
      setShowForm(false);
      setFormData({
        symbol: 'BTC/USD',
        side: 'long',
        entryPrice: 0,
        quantity: 0,
        leverage: 2,
        stopLoss: 0,
        takeProfit: 0,
      });
      fetchPositions();
      fetchMetrics();
    } catch (error) {
      console.error('Failed to create position:', error);
    }
  };

  const handleClosePosition = async (positionId: string, currentPrice: number) => {
    try {
      await api.post(`/futures/${positionId}/close`, { exitPrice: currentPrice });
      fetchPositions();
      fetchMetrics();
    } catch (error) {
      console.error('Failed to close position:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Futures Trading</h1>
          <p className="text-gray-400">Trade with leverage on crypto pairs</p>
        </div>

        {/* Metrics Cards */}
        {metrics && (
          <div className="grid grid-cols-4 gap-4 mb-8">
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="text-gray-400 text-sm">Open Positions</div>
              <div className="text-3xl font-bold text-green-400">{metrics.totalOpenPositions}</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="text-gray-400 text-sm">Closed Positions</div>
              <div className="text-3xl font-bold">{metrics.totalClosedPositions}</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="text-gray-400 text-sm">Total P&L</div>
              <div className={`text-3xl font-bold ${metrics.totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                ${metrics.totalPnL?.toFixed(2) || '0.00'}
              </div>
            </div>
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="text-gray-400 text-sm">Avg Leverage</div>
              <div className="text-3xl font-bold text-blue-400">{metrics.averageLeverage?.toFixed(1)}x</div>
            </div>
          </div>
        )}

        {/* Create Position Form */}
        {showForm && (
          <div className="bg-gray-800 rounded-lg p-6 mb-8">
            <h2 className="text-2xl font-bold mb-4">Open New Position</h2>
            <form onSubmit={handleCreatePosition}>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Symbol</label>
                  <input
                    type="text"
                    value={formData.symbol}
                    onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                    placeholder="BTC/USD"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Side</label>
                  <select
                    value={formData.side}
                    onChange={(e) => setFormData({ ...formData, side: e.target.value as 'long' | 'short' })}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                  >
                    <option value="long">Long</option>
                    <option value="short">Short</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Entry Price</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.entryPrice}
                    onChange={(e) => setFormData({ ...formData, entryPrice: parseFloat(e.target.value) })}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Quantity</label>
                  <input
                    type="number"
                    step="0.001"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) })}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Leverage</label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    step="0.5"
                    value={formData.leverage}
                    onChange={(e) => setFormData({ ...formData, leverage: parseFloat(e.target.value) })}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                    placeholder="2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Stop Loss</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.stopLoss || ''}
                    onChange={(e) => setFormData({ ...formData, stopLoss: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                    placeholder="Optional"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Take Profit</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.takeProfit || ''}
                    onChange={(e) => setFormData({ ...formData, takeProfit: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                    placeholder="Optional"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded font-semibold"
                >
                  Open Position
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded font-semibold"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Button to Show Form */}
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="mb-8 bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded font-semibold"
          >
            + Open New Position
          </button>
        )}

        {/* Positions List */}
        <div className="bg-gray-800 rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-700">
            <h2 className="text-xl font-bold">Open Positions</h2>
          </div>
          {loading ? (
            <div className="p-6 text-center">Loading...</div>
          ) : positions.length === 0 ? (
            <div className="p-6 text-center text-gray-400">No positions open</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-700 border-b border-gray-600">
                  <tr>
                    <th className="px-6 py-3 text-left">Symbol</th>
                    <th className="px-6 py-3 text-left">Side</th>
                    <th className="px-6 py-3 text-right">Entry Price</th>
                    <th className="px-6 py-3 text-right">Current Price</th>
                    <th className="px-6 py-3 text-right">Quantity</th>
                    <th className="px-6 py-3 text-right">Leverage</th>
                    <th className="px-6 py-3 text-right">P&L</th>
                    <th className="px-6 py-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {positions.filter(p => p.status === 'open').map((position) => {
                    const pnl = position.side === 'long'
                      ? (position.current_price - position.entry_price) * position.quantity
                      : (position.entry_price - position.current_price) * position.quantity;
                    const pnlPercent = (pnl / (position.entry_price * position.quantity)) * 100;

                    return (
                      <tr key={position.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                        <td className="px-6 py-4 font-semibold">{position.symbol}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded text-sm font-semibold ${
                            position.side === 'long' 
                              ? 'bg-green-900 text-green-300' 
                              : 'bg-red-900 text-red-300'
                          }`}>
                            {position.side.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">${position.entry_price.toFixed(2)}</td>
                        <td className="px-6 py-4 text-right">${position.current_price.toFixed(2)}</td>
                        <td className="px-6 py-4 text-right">{position.quantity.toFixed(3)}</td>
                        <td className="px-6 py-4 text-right">{position.leverage}x</td>
                        <td className={`px-6 py-4 text-right font-semibold ${pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          ${pnl.toFixed(2)} ({pnlPercent.toFixed(2)}%)
                        </td>
                        <td className="px-6 py-4 text-center">
                          <input
                            type="number"
                            placeholder="Exit Price"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                const exitPrice = parseFloat((e.target as HTMLInputElement).value);
                                handleClosePosition(position.id, exitPrice);
                              }
                            }}
                            className="w-24 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FuturesTradingPage;
