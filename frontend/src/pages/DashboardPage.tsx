import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../hooks';
import { fetchMarkets, setSelectedMarket } from '../store/marketSlice';
import { MarketCard } from '../components/MarketCard';
import { TradeForm } from '../components/TradeForm';
import { BalanceCard } from '../components/BalanceCard';
import { fetchBalance } from '../store/accountSlice';

export const DashboardPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { markets, selectedMarket, loading } = useAppSelector((state) => state.market);
  const [refreshing, setRefreshing] = useState(false);
  const [showForex, setShowForex] = useState(false);

  useEffect(() => {
    dispatch(fetchMarkets());
    dispatch(fetchBalance());
  }, [dispatch]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await dispatch(fetchMarkets());
    await dispatch(fetchBalance());
    setRefreshing(false);
  };

  const displayMarkets = showForex 
    ? markets.filter(m => m.assetType === 'forex').slice(0, 6)
    : markets.filter(m => m.assetType !== 'forex').slice(0, 6);

  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">Trading Dashboard</h1>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded transition"
          >
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Markets */}
          <div className="lg:col-span-2">
            <div className="flex gap-4 mb-4">
              <button
                onClick={() => setShowForex(false)}
                className={`px-4 py-2 rounded font-medium transition ${
                  !showForex
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:text-white'
                }`}
              >
                Cryptocurrencies
              </button>
              <button
                onClick={() => setShowForex(true)}
                className={`px-4 py-2 rounded font-medium transition ${
                  showForex
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:text-white'
                }`}
              >
                Forex
              </button>
            </div>

            <h2 className="text-xl font-semibold text-white mb-4">
              {showForex ? 'Top Forex Pairs' : 'Top Cryptocurrencies'}
            </h2>
            {loading ? (
              <div className="text-gray-400">Loading markets...</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {displayMarkets.map((market) => (
                  <MarketCard
                    key={market.symbol}
                    market={market}
                    onClick={() => dispatch(setSelectedMarket(market))}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Right: Trading & Balance */}
          <div className="space-y-6">
            <BalanceCard />
            {selectedMarket && (
              <TradeForm
                market={selectedMarket}
                onSuccess={() => {
                  dispatch(fetchBalance());
                  dispatch(fetchMarkets());
                }}
              />
            )}
            {!selectedMarket && (
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 text-center text-gray-400">
                <p>Select a market to start trading</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
