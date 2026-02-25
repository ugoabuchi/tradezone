import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../hooks';
import { fetchMarkets, setSelectedMarket } from '../store/marketSlice';
import { MarketCard } from '../components/MarketCard';
import { useNavigate } from 'react-router-dom';

export const MarketsPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { markets, loading } = useAppSelector((state) => state.market);
  const [searchTerm, setSearchTerm] = useState('');
  const [assetType, setAssetType] = useState<'all' | 'crypto' | 'forex'>('all');

  useEffect(() => {
    dispatch(fetchMarkets());
  }, [dispatch]);

  const filtered = markets.filter((market) => {
    const matchesSearch =
      market.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      market.name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType =
      assetType === 'all' ||
      (assetType === 'crypto' && market.assetType !== 'forex') ||
      (assetType === 'forex' && market.assetType === 'forex');

    return matchesSearch && matchesType;
  });

  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-white mb-8">Markets</h1>

        <div className="mb-8 space-y-4">
          <input
            type="text"
            placeholder="Search cryptocurrencies and forex pairs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full max-w-md px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-400"
          />

          <div className="flex gap-2">
            {(['all', 'crypto', 'forex'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setAssetType(type)}
                className={`px-4 py-2 rounded font-medium transition ${
                  assetType === type
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:text-white'
                }`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-gray-400">Loading markets...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((market) => (
              <div
                key={market.symbol}
                onClick={() => {
                  dispatch(setSelectedMarket(market));
                  navigate('/dashboard');
                }}
              >
                <MarketCard market={market} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
