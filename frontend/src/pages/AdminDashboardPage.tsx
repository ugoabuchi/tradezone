import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface DashboardStats {
  totalUsers: number;
  totalRevenue: number;
  pendingKYC: number;
  approvedKYC: number;
  rejectedKYC: number;
  activeTraders: number;
  totalTrades: number;
  totalTransactionValue: number;
}

interface KYCSubmission {
  id: string;
  userId: string;
  userEmail: string;
  userFullName: string;
  submittedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  documentType: string;
  analysisResult: any;
}

interface SystemHealth {
  database: string;
  avgResponseTime: string;
  recentErrors: number;
  activeSessions: number;
  timestamp: string;
}

interface User {
  id: string;
  email: string;
  fullName: string;
  kycStatus: string;
}

interface TopTrader {
  id: string;
  full_name: string;
  email: string;
  totalTrades: number;
  filledTrades: number;
  totalVolume: number;
}

interface AIBotStats {
  totalBots: number;
  activeBots: number;
  inactiveBots: number;
  averageROI: string;
  averageWinRate: string;
}

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'kyc' | 'users' | 'analytics' | 'system'>('overview');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [pendingKYC, setPendingKYC] = useState<KYCSubmission[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [topTraders, setTopTraders] = useState<TopTrader[]>([]);
  const [aiBotStats, setAIBotStats] = useState<AIBotStats | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchEmail, setSearchEmail] = useState('');
  const [selectedKYC, setSelectedKYC] = useState<KYCSubmission | null>(null);
  const [kycDecision, setKycDecision] = useState<{ kycId: string; decision: 'approve' | 'reject'; reason: string } | null>(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  // Fetch dashboard stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_URL}/api/admin/dashboard/stats`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        setStats(response.data.data);
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    if (activeTab === 'overview') {
      fetchStats();
      const interval = setInterval(fetchStats, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [activeTab]);

  // Fetch pending KYC
  useEffect(() => {
    const fetchPendingKYC = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_URL}/api/admin/kyc/pending`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        setPendingKYC(response.data.data);
      } catch (error) {
        console.error('Error fetching pending KYC:', error);
      } finally {
        setLoading(false);
      }
    };

    if (activeTab === 'kyc') {
      fetchPendingKYC();
      const interval = setInterval(fetchPendingKYC, 60000); // Refresh every minute
      return () => clearInterval(interval);
    }
  }, [activeTab]);

  // Fetch system health
  useEffect(() => {
    const fetchSystemHealth = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/admin/dashboard/system-health`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        setSystemHealth(response.data.data);
      } catch (error) {
        console.error('Error fetching system health:', error);
      }
    };

    if (activeTab === 'system') {
      fetchSystemHealth();
      const interval = setInterval(fetchSystemHealth, 30000);
      return () => clearInterval(interval);
    }
  }, [activeTab]);

  // Fetch analytics data
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const [traders, bots] = await Promise.all([
          axios.get(`${API_URL}/api/admin/dashboard/top-traders`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          }),
          axios.get(`${API_URL}/api/admin/dashboard/ai-bots`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          }),
        ]);

        setTopTraders(traders.data.data);
        setAIBotStats(bots.data.data);
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    if (activeTab === 'analytics') {
      fetchAnalytics();
    }
  }, [activeTab]);

  // Handle KYC decision
  const handleKYCDecision = async (kycId: string, decision: 'approve' | 'reject') => {
    const note = prompt(`Enter ${decision === 'approve' ? 'approval' : 'rejection'} note:`);
    if (!note) return;

    try {
      setLoading(true);
      const endpoint = decision === 'approve' ? '/api/admin/kyc/approve' : '/api/admin/kyc/reject';
      const payload = {
        kycId,
        notes: note,
        ...(decision === 'reject' && { reason: note }),
      };

      await axios.post(`${API_URL}${endpoint}`, payload, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });

      // Refresh KYC list
      const response = await axios.get(`${API_URL}/api/admin/kyc/pending`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setPendingKYC(response.data.data);
      setSelectedKYC(null);
    } catch (error) {
      console.error(`Error ${decision}ing KYC:`, error);
      alert(`Failed to ${decision} KYC`);
    } finally {
      setLoading(false);
    }
  };

  // Suspend user
  const handleSuspendUser = async (userId: string) => {
    const reason = prompt('Enter suspension reason:');
    if (!reason) return;

    try {
      setLoading(true);
      await axios.post(
        `${API_URL}/api/admin/users/suspend`,
        { userId, reason },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }
      );
      alert('User suspended successfully');
    } catch (error) {
      console.error('Error suspending user:', error);
      alert('Failed to suspend user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-gray-400">Manage users, KYC verifications, and monitor system health</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-gray-700">
          {(['overview', 'kyc', 'users', 'analytics', 'system'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 font-medium capitalize transition ${
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
        {activeTab === 'overview' && stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
              <h3 className="text-gray-400 text-sm font-medium mb-2">Total Users</h3>
              <p className="text-3xl font-bold">{stats.totalUsers}</p>
            </div>
            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
              <h3 className="text-gray-400 text-sm font-medium mb-2">Total Revenue</h3>
              <p className="text-3xl font-bold">${stats.totalRevenue.toFixed(2)}</p>
            </div>
            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
              <h3 className="text-gray-400 text-sm font-medium mb-2">Pending KYC</h3>
              <p className="text-3xl font-bold text-yellow-400">{stats.pendingKYC}</p>
            </div>
            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
              <h3 className="text-gray-400 text-sm font-medium mb-2">Active Traders</h3>
              <p className="text-3xl font-bold text-green-400">{stats.activeTraders}</p>
            </div>
            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
              <h3 className="text-gray-400 text-sm font-medium mb-2">Total Trades</h3>
              <p className="text-3xl font-bold">{stats.totalTrades}</p>
            </div>
            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
              <h3 className="text-gray-400 text-sm font-medium mb-2">Transaction Value</h3>
              <p className="text-3xl font-bold">${stats.totalTransactionValue.toFixed(2)}</p>
            </div>
            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
              <h3 className="text-gray-400 text-sm font-medium mb-2">Approved KYC</h3>
              <p className="text-3xl font-bold text-green-400">{stats.approvedKYC}</p>
            </div>
            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
              <h3 className="text-gray-400 text-sm font-medium mb-2">Rejected KYC</h3>
              <p className="text-3xl font-bold text-red-400">{stats.rejectedKYC}</p>
            </div>
          </div>
        )}

        {/* KYC Tab */}
        {activeTab === 'kyc' && (
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
              <div className="p-6 bg-gray-750 border-b border-gray-700">
                <h2 className="text-xl font-bold">Pending KYC Submissions ({pendingKYC.length})</h2>
              </div>

              {pendingKYC.length === 0 ? (
                <div className="p-6 text-center text-gray-400">No pending KYC submissions</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-750 border-b border-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-sm font-medium">User Email</th>
                        <th className="px-6 py-3 text-left text-sm font-medium">Full Name</th>
                        <th className="px-6 py-3 text-left text-sm font-medium">Document Type</th>
                        <th className="px-6 py-3 text-left text-sm font-medium">Submitted</th>
                        <th className="px-6 py-3 text-left text-sm font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingKYC.map((kyc) => (
                        <tr key={kyc.id} className="border-b border-gray-700 hover:bg-gray-750">
                          <td className="px-6 py-4 text-sm">{kyc.userEmail}</td>
                          <td className="px-6 py-4 text-sm">{kyc.userFullName}</td>
                          <td className="px-6 py-4 text-sm">{kyc.documentType}</td>
                          <td className="px-6 py-4 text-sm">
                            {new Date(kyc.submittedAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 text-sm space-x-2">
                            <button
                              onClick={() => setSelectedKYC(kyc)}
                              className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm"
                            >
                              Review
                            </button>
                            <button
                              onClick={() => handleKYCDecision(kyc.id, 'approve')}
                              className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-sm"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleKYCDecision(kyc.id, 'reject')}
                              className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm"
                            >
                              Reject
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {selectedKYC && (
              <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
                <h3 className="text-xl font-bold mb-4">KYC Analysis Details - {selectedKYC.userFullName}</h3>
                <div className="bg-gray-900 p-4 rounded overflow-auto max-h-96 text-sm font-mono text-gray-300">
                  <pre>{JSON.stringify(selectedKYC.analysisResult, null, 2)}</pre>
                </div>
                <button
                  onClick={() => setSelectedKYC(null)}
                  className="mt-4 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
              <input
                type="email"
                placeholder="Search user by email..."
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
              {/* TODO: Implement user search and display */}
              <p className="text-gray-400 text-sm mt-4">User search functionality - connect to backend API</p>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {/* Top Traders */}
            <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
              <div className="p-6 bg-gray-750 border-b border-gray-700">
                <h2 className="text-xl font-bold">Top Traders</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-750 border-b border-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-medium">Name</th>
                      <th className="px-6 py-3 text-left text-sm font-medium">Total Trades</th>
                      <th className="px-6 py-3 text-left text-sm font-medium">Volume</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topTraders.map((trader) => (
                      <tr key={trader.id} className="border-b border-gray-700 hover:bg-gray-750">
                        <td className="px-6 py-4 text-sm">{trader.full_name}</td>
                        <td className="px-6 py-4 text-sm">{trader.filledTrades}</td>
                        <td className="px-6 py-4 text-sm">${trader.totalVolume.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* AI Bot Stats */}
            {aiBotStats && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                  <h3 className="text-lg font-bold mb-4">AI Bot Statistics</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Total Bots</span>
                      <span className="font-bold">{aiBotStats.totalBots}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Active Bots</span>
                      <span className="font-bold text-green-400">{aiBotStats.activeBots}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Inactive Bots</span>
                      <span className="font-bold">{aiBotStats.inactiveBots}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Avg ROI</span>
                      <span className="font-bold">{aiBotStats.averageROI}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Avg Win Rate</span>
                      <span className="font-bold">{aiBotStats.averageWinRate}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* System Tab */}
        {activeTab === 'system' && systemHealth && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
              <h3 className="text-lg font-bold mb-4">System Health</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Database</span>
                  <span
                    className={`font-bold ${systemHealth.database === 'healthy' ? 'text-green-400' : 'text-red-400'}`}
                  >
                    {systemHealth.database.charAt(0).toUpperCase() + systemHealth.database.slice(1)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Avg Response Time</span>
                  <span className="font-bold">{systemHealth.avgResponseTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Recent Errors</span>
                  <span className="font-bold">{systemHealth.recentErrors}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Active Sessions</span>
                  <span className="font-bold">{systemHealth.activeSessions}</span>
                </div>
                <div className="text-xs text-gray-500 mt-4">
                  Last updated: {new Date(systemHealth.timestamp).toLocaleTimeString()}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
