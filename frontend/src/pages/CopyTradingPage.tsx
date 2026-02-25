import React, { useState, useEffect } from 'react';
import api from '../services/api';

interface Trader {
  id: string;
  full_name: string;
  email: string;
  stats?: {
    totalTrades: number;
    winRate: number;
    followerCount: number;
    averageReturn: number;
  };
}

interface FollowingItem {
  id: string;
  leader_user_id: string;
  follower_user_id: string;
  allocation_percentage: number;
  full_name: string;
}

export const CopyTradingPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'search' | 'following' | 'followers'>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Trader[]>([]);
  const [following, setFollowing] = useState<FollowingItem[]>([]);
  const [followers, setFollowers] = useState<FollowingItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTrader, setSelectedTrader] = useState<Trader | null>(null);
  const [allocationPercentage, setAllocationPercentage] = useState(10);

  useEffect(() => {
    if (activeTab === 'following') fetchFollowing();
    if (activeTab === 'followers') fetchFollowers();
  }, [activeTab]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    try {
      setLoading(true);
      const response = await api.get(`/copy-trading/search?q=${searchQuery}`);
      setSearchResults(response.data);
    } catch (error) {
      console.error('Failed to search traders:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFollowing = async () => {
    try {
      setLoading(true);
      const response = await api.get('/copy-trading/following');
      setFollowing(response.data);
    } catch (error) {
      console.error('Failed to fetch following list:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFollowers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/copy-trading/followers');
      setFollowers(response.data);
    } catch (error) {
      console.error('Failed to fetch followers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollowTrader = async () => {
    if (!selectedTrader) return;

    try {
      await api.post('/copy-trading/follow', {
        leaderUserId: selectedTrader.id,
        allocationPercentage,
      });
      alert('Now copying trader successfully!');
      setSelectedTrader(null);
      setAllocationPercentage(10);
      setSearchQuery('');
      setSearchResults([]);
    } catch (error) {
      console.error('Failed to follow trader:', error);
    }
  };

  const handleUnfollowTrader = async (leaderUserId: string) => {
    try {
      await api.post('/copy-trading/unfollow', { leaderUserId });
      fetchFollowing();
    } catch (error) {
      console.error('Failed to unfollow trader:', error);
    }
  };

  const handlePauseCopyTrade = async (leaderUserId: string) => {
    try {
      await api.post('/copy-trading/pause', { leaderUserId });
      fetchFollowing();
    } catch (error) {
      console.error('Failed to pause copy trade:', error);
    }
  };

  const handleResumeCopyTrade = async (leaderUserId: string) => {
    try {
      await api.post('/copy-trading/resume', { leaderUserId });
      fetchFollowing();
    } catch (error) {
      console.error('Failed to resume copy trade:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Copy Trading</h1>
          <p className="text-gray-400">Follow successful traders and automatically copy their trades</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-gray-700">
          {(['search', 'following', 'followers'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 font-semibold border-b-2 transition ${
                activeTab === tab
                  ? 'border-blue-600 text-blue-400'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Search Tab */}
        {activeTab === 'search' && (
          <div>
            <form onSubmit={handleSearch} className="mb-8">
              <div className="flex gap-4">
                <input
                  type="text"
                  placeholder="Search traders by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 bg-gray-800 border border-gray-700 rounded px-4 py-3 text-white placeholder-gray-500"
                />
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded font-semibold"
                >
                  Search
                </button>
              </div>
            </form>

            {/* Follow Trader Modal */}
            {selectedTrader && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-gray-800 rounded-lg p-8 max-w-md w-full mx-4">
                  <h2 className="text-2xl font-bold mb-4">Follow {selectedTrader.full_name}?</h2>
                  
                  {selectedTrader.stats && (
                    <div className="space-y-3 mb-6 bg-gray-700 rounded p-4">
                      <div className="flex justify-between">
                        <span>Total Trades:</span>
                        <span className="font-semibold">{selectedTrader.stats.totalTrades}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Win Rate:</span>
                        <span className="text-green-400">{selectedTrader.stats.winRate.toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Avg Return:</span>
                        <span className="text-green-400">{selectedTrader.stats.averageReturn.toFixed(2)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Followers:</span>
                        <span>{selectedTrader.stats.followerCount}</span>
                      </div>
                    </div>
                  )}

                  <div className="mb-6">
                    <label className="block text-sm font-semibold mb-2">
                      Allocation Percentage ({allocationPercentage}%)
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="100"
                      value={allocationPercentage}
                      onChange={(e) => setAllocationPercentage(parseInt(e.target.value))}
                      className="w-full"
                    />
                    <div className="text-xs text-gray-400 mt-1">
                      {allocationPercentage}% of your portfolio will be allocated to copy this trader's trades
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={handleFollowTrader}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded font-semibold"
                    >
                      Follow Trader
                    </button>
                    <button
                      onClick={() => setSelectedTrader(null)}
                      className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded font-semibold"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="grid grid-cols-2 gap-6">
                {searchResults.map((trader) => (
                  <div key={trader.id} className="bg-gray-800 rounded-lg p-6 hover:shadow-lg transition">
                    <h3 className="text-xl font-bold mb-2">{trader.full_name}</h3>
                    <p className="text-gray-400 text-sm mb-4">{trader.email}</p>

                    {trader.stats && (
                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Win Rate:</span>
                          <span className="text-green-400 font-semibold">{trader.stats.winRate.toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Trades:</span>
                          <span>{trader.stats.totalTrades}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Followers:</span>
                          <span>{trader.stats.followerCount}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Avg Return:</span>
                          <span className="text-green-400">{trader.stats.averageReturn.toFixed(2)}%</span>
                        </div>
                      </div>
                    )}

                    <button
                      onClick={() => setSelectedTrader(trader)}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded font-semibold"
                    >
                      Follow This Trader
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Following Tab */}
        {activeTab === 'following' && (
          <div>
            {loading ? (
              <div className="text-center py-12">Loading...</div>
            ) : following.length === 0 ? (
              <div className="text-center py-12 text-gray-400">Not following any traders yet</div>
            ) : (
              <div className="bg-gray-800 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-700 border-b">
                    <tr>
                      <th className="px-6 py-4 text-left">Trader Name</th>
                      <th className="px-6 py-4 text-center">Allocation %</th>
                      <th className="px-6 py-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {following.map((item) => (
                      <tr key={item.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                        <td className="px-6 py-4 font-semibold">{item.full_name}</td>
                        <td className="px-6 py-4 text-center">{item.allocation_percentage}%</td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => handlePauseCopyTrade(item.leader_user_id)}
                            className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded text-sm mr-2"
                          >
                            Pause
                          </button>
                          <button
                            onClick={() => handleUnfollowTrader(item.leader_user_id)}
                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
                          >
                            Unfollow
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Followers Tab */}
        {activeTab === 'followers' && (
          <div>
            {loading ? (
              <div className="text-center py-12">Loading...</div>
            ) : followers.length === 0 ? (
              <div className="text-center py-12 text-gray-400">No followers yet</div>
            ) : (
              <div className="bg-gray-800 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-700 border-b">
                    <tr>
                      <th className="px-6 py-4 text-left">Follower Name</th>
                      <th className="px-6 py-4 text-center">Allocation %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {followers.map((item) => (
                      <tr key={item.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                        <td className="px-6 py-4 font-semibold">{item.full_name}</td>
                        <td className="px-6 py-4 text-center">{item.allocation_percentage}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CopyTradingPage;
