import { useAppDispatch, useAppSelector } from '../hooks';
import { logout } from '../store/authSlice';
import { useNavigate, Link } from 'react-router-dom';
import { LogOut, Home, TrendingUp, User, Wallet } from 'lucide-react';

export const Header: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const token = useAppSelector((state) => state.auth.token);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <header className="bg-gray-800 border-b border-gray-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">TZ</span>
            </div>
            <span className="text-xl font-bold gradient-text">TradeZone</span>
          </Link>

          {token && (
            <nav className="flex items-center gap-8">
              <Link to="/dashboard" className="flex items-center gap-2 text-gray-300 hover:text-white transition">
                <Home size={18} />
                Dashboard
              </Link>
              <Link to="/markets" className="flex items-center gap-2 text-gray-300 hover:text-white transition">
                <TrendingUp size={18} />
                Markets
              </Link>
              <Link to="/portfolio" className="flex items-center gap-2 text-gray-300 hover:text-white transition">
                <User size={18} />
                Portfolio
              </Link>
              <Link to="/wallets" className="flex items-center gap-2 text-gray-300 hover:text-white transition">
                <Wallet size={18} />
                Wallets
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
              >
                <LogOut size={18} />
                Logout
              </button>
            </nav>
          )}
        </div>
      </div>
    </header>
  );
};
