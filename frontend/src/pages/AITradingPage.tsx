import React, { useState, useEffect } from 'react';
import api from '../services/api';

interface AIBot {
  id: string;
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
}

export const AITradingPage: React.FC = () => {
  const [bots, setBots] = useState<AIBot[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedBot, setSelectedBot] = useState<AIBot | null>(null);
  const [performance, setPerformance] = useState<any>(null);
  const [formData, setFormData] = useState({
    botName: '',
    strategy: 'momentum',
    symbol: 'BTC/USD',
    initialCapital: 1000,
    allocatedPercentage: 10,
    aiModel: 'gemini' as const,
    riskLevel: 'medium' as const,
  });

  useEffect(() => {
    fetchBots();
  }, []);

  const fetchBots = async () => {
    try {
      setLoading(true);
      const response = await api.get('/ai-trading');
      setBots(response.data);
    } catch (error) {
      console.error('Failed to fetch bots:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBot = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/ai-trading', formData);
      setShowForm(false);
      setFormData({
        botName: '',
        strategy: 'momentum',
        symbol: 'BTC/USD',
        initialCapital: 1000,
        allocatedPercentage: 10,
        aiModel: 'gemini',
        riskLevel: 'medium',
      });
      fetchBots();
    } catch (error) {
      console.error('Failed to create bot:', error);
    }
  };

  const handleToggleBotStatus = async (botId: string, currentStatus: string) => {
    try {
      const endpoint = currentStatus === 'active' 
        ? 'deactivate' 
        : 'activate';
      await api.post(`/ai-trading/${botId}/${endpoint}`);
      fetchBots();
    } catch (error) {
      console.error('Failed to toggle bot status:', error);
    }
  };

  const handleViewPerformance = async (botId: string) => {
    try {
      const response = await api.get(`/ai-trading/${botId}/performance`);
      setPerformance(response.data);
      setSelectedBot(bots.find(b => b.id === botId) || null);
    } catch (error) {
      console.error('Failed to fetch performance:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">AI Trading Bots</h1>
          <p className="text-gray-400">Automate your trading with AI-powered algorithms</p>
        </div>

        {/* Create Bot Button */}
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="mb-8 bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded font-semibold"
          >
            + Create AI Bot
          </button>
        )}

        {/* Create Bot Form */}
        {showForm && (
          <div className="bg-gray-800 rounded-lg p-6 mb-8">
            <h2 className="text-2xl font-bold mb-4">Create New AI Bot</h2>
            <form onSubmit={handleCreateBot}>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Bot Name</label>
                  <input
                    type="text"
                    value={formData.botName}
                    onChange={(e) => setFormData({ ...formData, botName: e.target.value })}
                    required
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                    placeholder="e.g., Bitcoin Momentum Bot"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Trading Pair</label>
                  <input
                    type="text"
                    value={formData.symbol}
                    onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                    placeholder="BTC/USD"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Strategy</label>
                  <select
                    value={formData.strategy}
                    onChange={(e) => setFormData({ ...formData, strategy: e.target.value })}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                  >
                    <option value="momentum">Momentum</option>
                    <option value="mean_reversion">Mean Reversion</option>
                    <option value="arbitrage">Arbitrage</option>
                    <option value="trend_following">Trend Following</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">AI Model</label>
                  <select
                    value={formData.aiModel}
                    onChange={(e) => setFormData({ ...formData, aiModel: e.target.value as any })}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                  >
                    <option value="deepseek">DeepSeek</option>
                    <option value="gemini">Gemini</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Risk Level</label>
                  <select
                    value={formData.riskLevel}
                    onChange={(e) => setFormData({ ...formData, riskLevel: e.target.value as any })}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Initial Capital ($)</label>
                  <input
                    type="number"
                    step="100"
                    value={formData.initialCapital}
                    onChange={(e) => setFormData({ ...formData, initialCapital: parseFloat(e.target.value) })}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Allocation %</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    step="1"
                    value={formData.allocatedPercentage}
                    onChange={(e) => setFormData({ ...formData, allocatedPercentage: parseFloat(e.target.value) })}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded font-semibold"
                >
                  Create Bot
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

        {/* Bots List */}
        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : bots.length === 0 ? (
          <div className="text-center py-12 text-gray-400">No AI bots created yet</div>
        ) : (
          <div className="grid grid-cols-2 gap-6 mb-8">
            {bots.map((bot) => (
              <div key={bot.id} className="bg-gray-800 rounded-lg p-6 hover:shadow-lg transition">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold">{bot.bot_name}</h3>
                    <p className="text-gray-400 text-sm">{bot.symbol}</p>
                  </div>
                  <span className={`px-3 py-1 rounded text-sm font-semibold ${
                    bot.status === 'active' ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'
                  }`}>
                    {bot.status.toUpperCase()}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-gray-700 rounded p-3">
                    <div className="text-gray-400 text-xs">Capital</div>
                    <div className="text-lg font-bold">${bot.current_balance.toFixed(0)}</div>
                  </div>
                  <div className="bg-gray-700 rounded p-3">
                    <div className="text-gray-400 text-xs">Return</div>
                    <div className={`text-lg font-bold ${bot.total_return >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {bot.total_return >= 0 ? '+' : ''}{bot.total_return.toFixed(2)}%
                    </div>
                  </div>
                  <div className="bg-gray-700 rounded p-3">
                    <div className="text-gray-400 text-xs">Trades</div>
                    <div className="text-lg font-bold">{bot.trades_executed}</div>
                  </div>
                  <div className="bg-gray-700 rounded p-3">
                    <div className="text-gray-400 text-xs">Win Rate</div>
                    <div className="text-lg font-bold text-green-400">{bot.win_rate.toFixed(1)}%</div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleToggleBotStatus(bot.id, bot.status)}
                    className={`flex-1 py-2 rounded font-semibold ${
                      bot.status === 'active'
                        ? 'bg-red-600 hover:bg-red-700'
                        : 'bg-green-600 hover:bg-green-700'
                    }`}
                  >
                    {bot.status === 'active' ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    onClick={() => handleViewPerformance(bot.id)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 py-2 rounded font-semibold"
                  >
                    Performance
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Performance Modal */}
        {performance && selectedBot && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg p-8 max-w-md w-full mx-4">
              <h2 className="text-2xl font-bold mb-4">{selectedBot.bot_name} Performance</h2>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Trades:</span>
                  <span className="font-semibold">{performance.totalTrades}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Winning Trades:</span>
                  <span className="text-green-400 font-semibold">{performance.winningTrades}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Losing Trades:</span>
                  <span className="text-red-400 font-semibold">{performance.losingTrades}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Win Rate:</span>
                  <span className="font-semibold">{performance.winRate.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Total P&L:</span>
                  <span className={`font-semibold ${performance.totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    ${performance.totalPnL.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">ROI:</span>
                  <span className={`font-semibold ${performance.roi >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {performance.roi >= 0 ? '+' : ''}{performance.roi.toFixed(2)}%
                  </span>
                </div>
              </div>

              <button
                onClick={() => setPerformance(null)}
                className="w-full bg-gray-700 hover:bg-gray-600 text-white py-2 rounded font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AITradingPage;
