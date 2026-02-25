import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../hooks';
import { fetchPortfolio, fetchBalance } from '../store/accountSlice';
import { orderService, accountService } from '../services/api';
import { Order } from '../types';
import { OrderItem } from '../components/OrderItem';

export const PortfolioPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { portfolio, balances } = useAppSelector((state) => state.account);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPortfolioData();
  }, []);

  const loadPortfolioData = async () => {
    setLoading(true);
    try {
      await dispatch(fetchPortfolio());
      await dispatch(fetchBalance());
      const orders = await orderService.getOrders();
      setOrders(orders);
    } finally {
      setLoading(false);
    }
  };

  const handleOrderCancelled = async () => {
    await loadPortfolioData();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-gray-400">Loading portfolio...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-white mb-8">My Portfolio</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Portfolio Summary */}
          <div className="lg:col-span-2">
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 mb-8">
              <h2 className="text-xl font-semibold text-white mb-4">Portfolio Value</h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Total Value:</span>
                  <span className="text-3xl font-bold text-white">${portfolio?.totalValue.toFixed(2) || '0.00'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Available USD:</span>
                  <span className="text-xl font-semibold text-green-400">${portfolio?.totalUSD.toFixed(2) || '0.00'}</span>
                </div>
              </div>
            </div>

            {/* Holdings */}
            <div>
              <h2 className="text-xl font-semibold text-white mb-4">Your Holdings</h2>
              {balances.length > 0 ? (
                <div className="space-y-3">
                  {balances.map((balance) => (
                    <div key={balance.currency} className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-white">{balance.currency}</h3>
                          <p className="text-sm text-gray-400">{balance.balance.toFixed(8)} units</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-semibold text-white">${balance.value.toFixed(2)}</p>
                          <p className="text-sm text-gray-400">${balance.price.toFixed(2)} each</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 text-center text-gray-400">
                  <p>No holdings yet. Start trading to build your portfolio!</p>
                </div>
              )}
            </div>
          </div>

          {/* Orders */}
          <div>
            <h2 className="text-xl font-semibold text-white mb-4">Recent Orders</h2>
            {orders.length > 0 ? (
              <div className="space-y-3">
                {orders.slice(0, 5).map((order) => (
                  <OrderItem key={order.id} order={order} onCancelled={handleOrderCancelled} />
                ))}
              </div>
            ) : (
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 text-center text-gray-400">
                <p>No orders yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
