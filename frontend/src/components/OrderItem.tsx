import { Order } from '../types';
import { X } from 'lucide-react';
import { orderService } from '../services/api';
import { useState } from 'react';

interface OrderItemProps {
  order: Order;
  onCancelled?: () => void;
}

export const OrderItem: React.FC<OrderItemProps> = ({ order, onCancelled }) => {
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState('');

  const handleCancel = async () => {
    setCancelling(true);
    setError('');
    try {
      await orderService.cancelOrder(order.id);
      onCancelled?.();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to cancel order');
    } finally {
      setCancelling(false);
    }
  };

  const statusColor =
    order.status === 'filled'
      ? 'text-green-400'
      : order.status === 'cancelled'
        ? 'text-red-400'
        : 'text-yellow-400';

  return (
    <div className="bg-gray-800 border border-gray-700 rounded p-4 flex justify-between items-center">
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-2">
          <span className="font-semibold text-white">{order.symbol}</span>
          <span
            className={`text-sm font-medium ${order.type === 'buy' ? 'text-green-400' : 'text-red-400'}`}
          >
            {order.type.toUpperCase()}
          </span>
          <span className={`text-sm ${statusColor}`}>
            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
          </span>
        </div>
        <div className="text-sm text-gray-400 space-y-1">
          <p>
            {order.quantity} {order.symbol} @ ${order.price.toFixed(2)} USD
          </p>
          <p>Total: ${(order.price * order.quantity).toFixed(2)}</p>
          <p>{new Date(order.created_at).toLocaleDateString()}</p>
        </div>
        {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
      </div>

      {order.status === 'pending' && (
        <button
          onClick={handleCancel}
          disabled={cancelling}
          className="ml-4 p-2 hover:bg-gray-700 rounded transition disabled:opacity-50"
          title="Cancel order"
        >
          <X size={18} className="text-red-500" />
        </button>
      )}
    </div>
  );
};
