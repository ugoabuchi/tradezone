import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../hooks';
import { fetchBalance, fetchPortfolio } from '../store/accountSlice';

export const BalanceCard: React.FC = () => {
  const dispatch = useAppDispatch();
  const { portfolio, loading } = useAppSelector((state) => state.account);

  useEffect(() => {
    dispatch(fetchBalance());
    dispatch(fetchPortfolio());
  }, [dispatch]);

  if (loading) {
    return <div className="text-gray-400">Loading...</div>;
  }

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
      <h2 className="text-lg font-semibold text-white mb-4">Portfolio Summary</h2>

      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-gray-400">Total Value:</span>
          <span className="text-2xl font-bold text-white">${portfolio?.totalValue.toFixed(2) || '0.00'}</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-gray-400">Available USD:</span>
          <span className="text-xl font-semibold text-green-400">${portfolio?.totalUSD.toFixed(2) || '0.00'}</span>
        </div>

        {portfolio && portfolio.holdings.length > 0 && (
          <div className="border-t border-gray-700 pt-3">
            <h3 className="text-sm font-semibold text-gray-300 mb-2">Holdings:</h3>
            <div className="space-y-2">
              {portfolio.holdings.map((holding) => (
                <div key={holding.currency} className="flex justify-between text-sm">
                  <span className="text-gray-400">
                    {holding.balance.toFixed(8)} {holding.currency}
                  </span>
                  <span className="text-gray-300">${holding.value.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
