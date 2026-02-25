import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface UserInfo {
  id: string;
  email: string;
  fullName: string;
  createdAt: string;
}

interface KYCStatus {
  id: string;
  status: 'pending' | 'approved' | 'rejected' | 'pending_review';
  documentType: string;
  submittedAt: string;
  analysis?: any;
}

interface PortfolioItem {
  symbol: string;
  quantity: number;
  currentPrice: number;
  totalValue: number;
  profitLoss: number;
  profitLossPercent: number;
}

interface Portfolio {
  totalValue: number;
  totalInvested: number;
  totalProfitLoss: number;
  totalProfitLossPercent: number;
  assets: PortfolioItem[];
}

interface RecentTrade {
  id: string;
  symbol: string;
  type: 'buy' | 'sell';
  quantity: number;
  price: number;
  total: number;
  status: 'pending' | 'filled' | 'cancelled';
  timestamp: string;
}

interface Wallet {
  id: string;
  currency: string;
  balance: number;
}

interface DemoAccount {
  balance: number;
  invested: number;
  profitLoss: number;
  isActive: boolean;
}

const UserDashboardPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'kyc' | 'portfolio' | 'trades' | 'wallets'>('overview');
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [kycStatus, setKycStatus] = useState<KYCStatus | null>(null);
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [trades, setTrades] = useState<RecentTrade[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [demoAccount, setDemoAccount] = useState<DemoAccount | null>(null);
  const [loading, setLoading] = useState(false);
  const [showKYCForm, setShowKYCForm] = useState(false);
  const [kycFormData, setKycFormData] = useState({
    fullName: '',
    dateOfBirth: '',
    address: '',
    country: '',
    phoneNumber: '',
    documentType: 'passport',
  });
  const [selectedFiles, setSelectedFiles] = useState<{ document: File | null; selfie: File | null }>({
    document: null,
    selfie: null,
  });

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  // Fetch user info
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_URL}/api/account/balance`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        // Parse user info from response
        setUserInfo({
          id: (response.data.data as any).userId,
          email: (response.data.data as any).email,
          fullName: (response.data.data as any).fullName || 'User',
          createdAt: new Date().toISOString(),
        });
      } catch (error) {
        console.error('Error fetching user info:', error);
      } finally {
        setLoading(false);
      }
    };

    if (activeTab === 'overview') {
      fetchUserInfo();
    }
  }, [activeTab]);

  // Fetch KYC status
  useEffect(() => {
    const fetchKYCStatus = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_URL}/api/kyc/status`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        setKycStatus(response.data.data);
      } catch (error) {
        console.error('Error fetching KYC status:', error);
      } finally {
        setLoading(false);
      }
    };

    if (activeTab === 'kyc') {
      fetchKYCStatus();
    }
  }, [activeTab]);

  // Fetch portfolio
  useEffect(() => {
    const fetchPortfolio = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_URL}/api/account/portfolio`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        setPortfolio(response.data.data);
      } catch (error) {
        console.error('Error fetching portfolio:', error);
      } finally {
        setLoading(false);
      }
    };

    if (activeTab === 'portfolio') {
      fetchPortfolio();
    }
  }, [activeTab]);

  // Fetch trades
  useEffect(() => {
    const fetchTrades = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_URL}/api/orders?limit=10`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        setTrades(response.data.data);
      } catch (error) {
        console.error('Error fetching trades:', error);
      } finally {
        setLoading(false);
      }
    };

    if (activeTab === 'trades') {
      fetchTrades();
    }
  }, [activeTab]);

  // Fetch wallets
  useEffect(() => {
    const fetchWallets = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_URL}/api/kyc/wallets`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        setWallets(response.data.data);
      } catch (error) {
        console.error('Error fetching wallets:', error);
      } finally {
        setLoading(false);
      }
    };

    if (activeTab === 'wallets') {
      fetchWallets();
    }
  }, [activeTab]);

  // Handle KYC submission
  const handleKYCSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFiles.document || !selectedFiles.selfie) {
      alert('Please select both document and selfie photos');
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('fullName', kycFormData.fullName);
      formData.append('dateOfBirth', kycFormData.dateOfBirth);
      formData.append('address', kycFormData.address);
      formData.append('country', kycFormData.country);
      formData.append('phoneNumber', kycFormData.phoneNumber);
      formData.append('documentType', kycFormData.documentType);
      formData.append('document', selectedFiles.document);
      formData.append('selfie', selectedFiles.selfie);

      const response = await axios.post(`${API_URL}/api/kyc/submit`, formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      alert(`KYC Status: ${response.data.data.status}. ${response.data.data.message}`);
      setShowKYCForm(false);

      // Refresh KYC status
      const statusResponse = await axios.get(`${API_URL}/api/kyc/status`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setKycStatus(statusResponse.data.data);
    } catch (error) {
      console.error('Error submitting KYC:', error);
      alert('Failed to submit KYC. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Your Dashboard</h1>
          <p className="text-gray-400">
            Welcome, {userInfo?.fullName || 'User'}! Manage your account, portfolio, and trades
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-gray-700 overflow-x-auto">
          {(['overview', 'kyc', 'portfolio', 'trades', 'wallets'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 font-medium capitalize transition whitespace-nowrap ${
                activeTab === tab
                  ? 'border-b-2 border-blue-500 text-blue-400'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Loading State */}
        {loading && <div className="text-center py-8">Loading...</div>}

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Account Info Card */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                <h3 className="text-gray-400 text-sm font-medium mb-2">Account Status</h3>
                <p className="text-2xl font-bold text-green-400">Active</p>
              </div>
              <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                <h3 className="text-gray-400 text-sm font-medium mb-2">KYC Status</h3>
                <p
                  className={`text-2xl font-bold ${
                    kycStatus?.status === 'approved'
                      ? 'text-green-400'
                      : kycStatus?.status === 'rejected'
                        ? 'text-red-400'
                        : 'text-yellow-400'
                  }`}
                >
                  {kycStatus?.status ? kycStatus.status.charAt(0).toUpperCase() + kycStatus.status.slice(1) : 'Not Submitted'}
                </p>
              </div>
              <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                <h3 className="text-gray-400 text-sm font-medium mb-2">Member Since</h3>
                <p className="text-2xl font-bold">{userInfo && new Date(userInfo.createdAt).toLocaleDateString()}</p>
              </div>
            </div>

            {/* Portfolio Summary */}
            {portfolio && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                  <h3 className="text-lg font-bold mb-4">Portfolio Summary</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Total Value</span>
                      <span className="font-bold text-blue-400">${portfolio.totalValue.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Total Invested</span>
                      <span className="font-bold">${portfolio.totalInvested.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Total P&L</span>
                      <span className={`font-bold ${portfolio.totalProfitLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        ${portfolio.totalProfitLoss.toFixed(2)} ({portfolio.totalProfitLossPercent.toFixed(2)}%)
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
              <h3 className="text-lg font-bold mb-4">Quick Actions</h3>
              <div className="flex flex-wrap gap-4">
                <button className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded font-medium">
                  Trade Now
                </button>
                <button className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded font-medium">
                  Deposit Funds
                </button>
                <button className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded font-medium">
                  Create Wallet
                </button>
              </div>
            </div>
          </div>
        )}

        {/* KYC Tab */}
        {activeTab === 'kyc' && (
          <div className="space-y-6">
            {/* KYC Status Card */}
            {kycStatus ? (
              <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                <h2 className="text-2xl font-bold mb-4">KYC Status</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-gray-400 text-sm font-medium mb-2">Current Status</h3>
                    <p
                      className={`text-2xl font-bold ${
                        kycStatus.status === 'approved'
                          ? 'text-green-400'
                          : kycStatus.status === 'rejected'
                            ? 'text-red-400'
                            : 'text-yellow-400'
                      }`}
                    >
                      {kycStatus.status.charAt(0).toUpperCase() + kycStatus.status.slice(1)}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-gray-400 text-sm font-medium mb-2">Submitted On</h3>
                    <p className="text-2xl font-bold">{new Date(kycStatus.submittedAt).toLocaleDateString()}</p>
                  </div>
                </div>

                {kycStatus.status === 'approved' && (
                  <div className="mt-6 p-4 bg-green-900 border border-green-700 rounded text-green-200">
                    ✓ Your KYC has been approved! You have full access to all features.
                  </div>
                )}

                {kycStatus.status === 'rejected' && (
                  <div className="mt-6 space-y-4">
                    <div className="p-4 bg-red-900 border border-red-700 rounded text-red-200">
                      ✗ Your KYC submission was rejected. Please resubmit with correct information.
                    </div>
                    <button
                      onClick={() => setShowKYCForm(true)}
                      className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded font-medium"
                    >
                      Resubmit KYC
                    </button>
                  </div>
                )}

                {kycStatus.status === 'pending_review' && (
                  <div className="mt-6 p-4 bg-yellow-900 border border-yellow-700 rounded text-yellow-200">
                    ⏳ Your KYC is under review. We'll notify you once it's processed.
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                <h2 className="text-2xl font-bold mb-4">Complete Your KYC</h2>
                <p className="text-gray-400 mb-4">Complete KYC verification to unlock all trading features.</p>
                <button
                  onClick={() => setShowKYCForm(true)}
                  className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded font-medium"
                >
                  Start KYC Verification
                </button>
              </div>
            )}

            {/* KYC Form */}
            {showKYCForm && (
              <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                <h3 className="text-xl font-bold mb-6">KYC Verification Form</h3>
                <form onSubmit={handleKYCSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Full Name</label>
                      <input
                        type="text"
                        value={kycFormData.fullName}
                        onChange={(e) => setKycFormData({ ...kycFormData, fullName: e.target.value })}
                        className="w-full bg-gray-900 border border-gray-700 rounded px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Date of Birth</label>
                      <input
                        type="date"
                        value={kycFormData.dateOfBirth}
                        onChange={(e) => setKycFormData({ ...kycFormData, dateOfBirth: e.target.value })}
                        className="w-full bg-gray-900 border border-gray-700 rounded px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Address</label>
                      <input
                        type="text"
                        value={kycFormData.address}
                        onChange={(e) => setKycFormData({ ...kycFormData, address: e.target.value })}
                        className="w-full bg-gray-900 border border-gray-700 rounded px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Country</label>
                      <input
                        type="text"
                        value={kycFormData.country}
                        onChange={(e) => setKycFormData({ ...kycFormData, country: e.target.value })}
                        className="w-full bg-gray-900 border border-gray-700 rounded px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Phone Number</label>
                      <input
                        type="tel"
                        value={kycFormData.phoneNumber}
                        onChange={(e) => setKycFormData({ ...kycFormData, phoneNumber: e.target.value })}
                        className="w-full bg-gray-900 border border-gray-700 rounded px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Document Type</label>
                      <select
                        value={kycFormData.documentType}
                        onChange={(e) => setKycFormData({ ...kycFormData, documentType: e.target.value })}
                        className="w-full bg-gray-900 border border-gray-700 rounded px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                      >
                        <option value="passport">Passport</option>
                        <option value="driver_license">Driver's License</option>
                        <option value="national_id">National ID</option>
                      </select>
                    </div>
                  </div>

                  <div className="border-t border-gray-700 pt-4">
                    <h4 className="font-medium mb-4">Document Upload</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Document Photo</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) =>
                            setSelectedFiles({ ...selectedFiles, document: e.target.files?.[0] || null })
                          }
                          className="w-full"
                          required
                        />
                        {selectedFiles.document && (
                          <p className="text-sm text-green-400 mt-2">✓ {selectedFiles.document.name}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Selfie Photo</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => setSelectedFiles({ ...selectedFiles, selfie: e.target.files?.[0] || null })}
                          className="w-full"
                          required
                        />
                        {selectedFiles.selfie && (
                          <p className="text-sm text-green-400 mt-2">✓ {selectedFiles.selfie.name}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <button
                      type="submit"
                      disabled={loading}
                      className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-6 py-2 rounded font-medium"
                    >
                      {loading ? 'Submitting...' : 'Submit KYC'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowKYCForm(false)}
                      className="bg-gray-700 hover:bg-gray-600 px-6 py-2 rounded font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}

        {/* Portfolio Tab */}
        {activeTab === 'portfolio' && portfolio && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                <h3 className="text-gray-400 text-xs uppercase font-medium">Total Value</h3>
                <p className="text-2xl font-bold mt-2">${portfolio.totalValue.toFixed(2)}</p>
              </div>
              <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                <h3 className="text-gray-400 text-xs uppercase font-medium">Invested</h3>
                <p className="text-2xl font-bold mt-2">${portfolio.totalInvested.toFixed(2)}</p>
              </div>
              <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                <h3 className="text-gray-400 text-xs uppercase font-medium">P&L</h3>
                <p className={`text-2xl font-bold mt-2 ${portfolio.totalProfitLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  ${portfolio.totalProfitLoss.toFixed(2)}
                </p>
              </div>
              <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                <h3 className="text-gray-400 text-xs uppercase font-medium">Return %</h3>
                <p className={`text-2xl font-bold mt-2 ${portfolio.totalProfitLossPercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {portfolio.totalProfitLossPercent.toFixed(2)}%
                </p>
              </div>
            </div>

            {/* Holdings Table */}
            <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
              <div className="p-6 bg-gray-750 border-b border-gray-700">
                <h2 className="text-xl font-bold">Your Holdings</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-750 border-b border-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-medium">Symbol</th>
                      <th className="px-6 py-3 text-left text-sm font-medium">Quantity</th>
                      <th className="px-6 py-3 text-left text-sm font-medium">Price</th>
                      <th className="px-6 py-3 text-left text-sm font-medium">Value</th>
                      <th className="px-6 py-3 text-left text-sm font-medium">P&L</th>
                    </tr>
                  </thead>
                  <tbody>
                    {portfolio.assets.map((asset) => (
                      <tr key={asset.symbol} className="border-b border-gray-700 hover:bg-gray-750">
                        <td className="px-6 py-4 text-sm font-medium">{asset.symbol}</td>
                        <td className="px-6 py-4 text-sm">{asset.quantity.toFixed(4)}</td>
                        <td className="px-6 py-4 text-sm">${asset.currentPrice.toFixed(2)}</td>
                        <td className="px-6 py-4 text-sm font-medium">${asset.totalValue.toFixed(2)}</td>
                        <td className={`px-6 py-4 text-sm font-medium ${asset.profitLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          ${asset.profitLoss.toFixed(2)} ({asset.profitLossPercent.toFixed(2)}%)
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Trades Tab */}
        {activeTab === 'trades' && (
          <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
            <div className="p-6 bg-gray-750 border-b border-gray-700">
              <h2 className="text-xl font-bold">Recent Trades</h2>
            </div>
            {trades.length === 0 ? (
              <div className="p-6 text-center text-gray-400">No trades yet. Start trading to see your orders.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-750 border-b border-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-medium">Symbol</th>
                      <th className="px-6 py-3 text-left text-sm font-medium">Type</th>
                      <th className="px-6 py-3 text-left text-sm font-medium">Quantity</th>
                      <th className="px-6 py-3 text-left text-sm font-medium">Price</th>
                      <th className="px-6 py-3 text-left text-sm font-medium">Total</th>
                      <th className="px-6 py-3 text-left text-sm font-medium">Status</th>
                      <th className="px-6 py-3 text-left text-sm font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trades.map((trade) => (
                      <tr key={trade.id} className="border-b border-gray-700 hover:bg-gray-750">
                        <td className="px-6 py-4 text-sm font-medium">{trade.symbol}</td>
                        <td className={`px-6 py-4 text-sm font-medium ${trade.type === 'buy' ? 'text-green-400' : 'text-red-400'}`}>
                          {trade.type.toUpperCase()}
                        </td>
                        <td className="px-6 py-4 text-sm">{trade.quantity.toFixed(4)}</td>
                        <td className="px-6 py-4 text-sm">${trade.price.toFixed(2)}</td>
                        <td className="px-6 py-4 text-sm font-medium">${trade.total.toFixed(2)}</td>
                        <td className="px-6 py-4 text-sm">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              trade.status === 'filled'
                                ? 'bg-green-900 text-green-200'
                                : trade.status === 'pending'
                                  ? 'bg-yellow-900 text-yellow-200'
                                  : 'bg-red-900 text-red-200'
                            }`}
                          >
                            {trade.status.charAt(0).toUpperCase() + trade.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm">{new Date(trade.timestamp).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Wallets Tab */}
        {activeTab === 'wallets' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {wallets.map((wallet) => (
                <div key={wallet.id} className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                  <h3 className="text-lg font-bold mb-4">{wallet.currency}</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-gray-400 text-sm">Balance</p>
                      <p className="text-2xl font-bold">{wallet.balance.toFixed(8)}</p>
                    </div>
                    <button className="w-full bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded font-medium text-sm">
                      Send
                    </button>
                    <button className="w-full bg-green-600 hover:bg-green-700 px-4 py-2 rounded font-medium text-sm">
                      Receive
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {wallets.length === 0 && (
              <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 text-center">
                <p className="text-gray-400 mb-4">No wallets created yet.</p>
                <button className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded font-medium">
                  Create New Wallet
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDashboardPage;
