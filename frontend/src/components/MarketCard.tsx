import { MarketData } from '../types';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface MarketCardProps {
  market: MarketData;
  onClick?: () => void;
}

export const MarketCard: React.FC<MarketCardProps> = ({ market, onClick }) => {
  const isPositive = market.price_change_24h >= 0;
  const isForex = market.assetType === 'forex';

  return (
    <div
      onClick={onClick}
      className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:border-blue-500 cursor-pointer transition"
    >
      <div className="flex items-center gap-3 mb-3">
        {market.image && <img src={market.image} alt={market.name} className="w-8 h-8" />}
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-white">{market.symbol}</h3>
            <span className="text-xs px-2 py-1 rounded bg-gray-700 text-gray-300">
              {isForex ? 'FOREX' : 'CRYPTO'}
            </span>
          </div>
          <p className="text-sm text-gray-400">{market.name}</p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-baseline">
          <span className="text-2xl font-bold text-white">${market.price.toFixed(isForex ? 5 : 2)}</span>
          <div className={`flex items-center gap-1 ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
            {isPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
            <span>{Math.abs(market.price_change_24h).toFixed(2)}%</span>
          </div>
        </div>

        <div className="text-xs text-gray-400">
          {isForex ? (
            <>
              <p>Bid: ${('bid' in market ? market.bid : 0).toFixed(5)}</p>
              <p>Ask: ${('ask' in market ? market.ask : 0).toFixed(5)}</p>
              <p>High: ${('high_24h' in market ? market.high_24h : 0).toFixed(5)} / Low: ${('low_24h' in market ? market.low_24h : 0).toFixed(5)}</p>
            </>
          ) : (
            <>
              <p>Volume: ${('volume_24h' in market ? (market.volume_24h / 1e9).toFixed(2) : '0')}B</p>
              <p>Market Cap: ${('market_cap' in market ? (market.market_cap / 1e9).toFixed(2) : 'N/A')}B</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
