import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import { Header } from './components/Header';
import { ProtectedRoute } from './components/ProtectedRoute';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { MarketsPage } from './pages/MarketsPage';
import { PortfolioPage } from './pages/PortfolioPage';
import FuturesTradingPage from './pages/FuturesTradingPage';
import AITradingPage from './pages/AITradingPage';
import MarketplacePage from './pages/MarketplacePage';
import CopyTradingPage from './pages/CopyTradingPage';
import AdminDashboard from './pages/AdminDashboardPage';
import UserDashboardPage from './pages/UserDashboardPage';
import WalletManagementPage from './pages/WalletManagementPage';
import './index.css';

function App() {
  return (
    <Provider store={store}>
      <Router>
        <Header />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/user-dashboard"
            element={
              <ProtectedRoute>
                <UserDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin-dashboard"
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/markets"
            element={
              <ProtectedRoute>
                <MarketsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/portfolio"
            element={
              <ProtectedRoute>
                <PortfolioPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/wallets"
            element={
              <ProtectedRoute>
                <WalletManagementPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/futures"
            element={
              <ProtectedRoute>
                <FuturesTradingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ai-trading"
            element={
              <ProtectedRoute>
                <AITradingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/marketplace"
            element={
              <ProtectedRoute>
                <MarketplacePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/copy-trading"
            element={
              <ProtectedRoute>
                <CopyTradingPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </Provider>
  );
}

export default App;
