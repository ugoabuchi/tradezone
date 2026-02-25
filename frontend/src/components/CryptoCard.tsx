import { CryptoData } from '../types';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface CryptoCardProps {
  crypto: CryptoData;
  onClick?: () => void;
}

export const CryptoCard: React.FC<CryptoCardProps> = ({ crypto, onClick }) => {
  const isPositive = crypto.price_change_24h >= 0;

  return (
    <div
      onClick={onClick}
      className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:border-blue-500 cursor-pointer transition"
    >
      <div className="flex items-center gap-3 mb-3">
        {crypto.image && <img src={crypto.image} alt={crypto.name} className="w-8 h-8" />}
        <div>
          <h3 className="font-semibold text-white">{crypto.symbol}</h3>
          <p className="text-sm text-gray-400">{crypto.name}</p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-baseline">
          <span className="text-2xl font-bold text-white">${crypto.price.toFixed(2)}</span>
          <div className={`flex items-center gap-1 ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
            {isPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
            <span>{Math.abs(crypto.price_change_24h).toFixed(2)}%</span>
          </div>
        </div>

        <div className="text-xs text-gray-400">
          <p>Volume: ${(crypto.volume_24h / 1e9).toFixed(2)}B</p>
          <p>Market Cap: ${(crypto.market_cap / 1e9).toFixed(2)}B</p>
        </div>
      </div>
    </div>
  );
};
