import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface Wallet {
  id: string;
  walletAddress: string;
  blockchain: string;
  balance: number;
  walletName: string;
  isPrimary: boolean;
  isActive: boolean;
  createdAt: string;
}

interface Transaction {
  id: string;
  toAddress: string;
  amount: number;
  fee: number;
  totalAmount: number;
  type: string;
  status: string;
  transactionHash: string;
  createdAt: string;
}

interface KYCLimits {
  dailyWithdrawalLimit: number;
  monthlyWithdrawalLimit: number;
  dailyDepositLimit: number;
  monthlyDepositLimit: number;
  maxTransactionAmount: number;
  canWithdraw: boolean;
  canDeposit: boolean;
}

const WalletManagementPage: React.FC = () => {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(null);
  const [loading, setLoading] = useState(false);
  const [totalBalance, setTotalBalance] = useState(0);
  const [kycLimits, setKycLimits] = useState<KYCLimits | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showSendForm, setShowSendForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'wallets' | 'send' | 'receive' | 'transactions'>('wallets');

  const [createFormData, setCreateFormData] = useState({
    walletName: '',
    blockchain: 'ethereum',
    importPrivateKey: '',
  });

  const [sendFormData, setSendFormData] = useState({
    fromWalletId: '',
    toAddress: '',
    amount: '',
    password: '',
  });

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  const token = localStorage.getItem('token');

  // Fetch wallets, transactions, and limits
  useEffect(() => {
    fetchWallets();
    fetchTransactions();
    fetchKYCLimits();
  }, []);

  const fetchWallets = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/wallets/list`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setWallets(response.data.data);
      if (response.data.data.length > 0) {
        setSelectedWallet(response.data.data.find((w: Wallet) => w.isPrimary) || response.data.data[0]);
      }

      // Fetch total balance
      const balanceResponse = await axios.get(`${API_URL}/api/wallets/balance/total`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTotalBalance(balanceResponse.data.data.totalBalance);
    } catch (error) {
      console.error('Error fetching wallets:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/wallets/transactions/history`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { limit: 20 },
      });
      setTransactions(response.data.data);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  const fetchKYCLimits = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/wallets/limits/kyc`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setKycLimits(response.data.data.limits);
    } catch (error) {
      console.error('Error fetching KYC limits:', error);
    }
  };

  const handleCreateWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await axios.post(`${API_URL}/api/wallets/create`, createFormData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert('Wallet created successfully!');
      setShowCreateForm(false);
      setCreateFormData({ walletName: '', blockchain: 'ethereum', importPrivateKey: '' });
      fetchWallets();
    } catch (error) {
      console.error('Error creating wallet:', error);
      alert(error instanceof Error ? error.message : 'Failed to create wallet');
    } finally {
      setLoading(false);
    }
  };

  const handleSendCrypto = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await axios.post(`${API_URL}/api/wallets/send`, sendFormData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert('Transaction submitted successfully!');
      setShowSendForm(false);
      setSendFormData({ fromWalletId: '', toAddress: '', amount: '', password: '' });
      fetchWallets();
      fetchTransactions();
    } catch (error) {
      console.error('Error sending crypto:', error);
      alert(error instanceof Error ? error.message : 'Failed to send crypto');
    } finally {
      setLoading(false);
    }
  };

  const handleSetPrimary = async (walletId: string) => {
    try {
      setLoading(true);
      await axios.post(
        `${API_URL}/api/wallets/primary`,
        { walletId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Primary wallet updated!');
      fetchWallets();
    } catch (error) {
      console.error('Error setting primary wallet:', error);
      alert('Failed to set primary wallet');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteWallet = async (walletId: string) => {
    if (!window.confirm('Are you sure you want to delete this wallet?')) return;
    try {
      setLoading(true);
      await axios.delete(`${API_URL}/api/wallets/delete`, {
        data: { walletId },
        headers: { Authorization: `Bearer ${token}` },
      });
      alert('Wallet deleted successfully!');
      fetchWallets();
    } catch (error) {
      console.error('Error deleting wallet:', error);
      alert(error instanceof Error ? error.message : 'Failed to delete wallet');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Wallet Management</h1>
          <p className="text-gray-400">Create, manage, and transfer your crypto assets</p>
        </div>

        {/* Total Balance */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg p-8 mb-8">
          <h2 className="text-gray-200 text-sm font-medium mb-2">Total Balance</h2>
          <h3 className="text-4xl font-bold mb-2">${totalBalance.toFixed(2)}</h3>
          <p className="text-blue-200">Across all wallets</p>
        </div>

        {/* KYC Limits Alert */}
        {kycLimits && (
          <div className="bg-cyan-900 border border-cyan-700 rounded-lg p-4 mb-8">
            <h3 className="font-semibold mb-3">Your Transaction Limits</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="text-cyan-300">Daily Withdrawal</div>
                <div className="font-bold">${kycLimits.dailyWithdrawalLimit.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-cyan-300">Monthly Withdrawal</div>
                <div className="font-bold">${kycLimits.monthlyWithdrawalLimit.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-cyan-300">Daily Deposit</div>
                <div className="font-bold">${kycLimits.dailyDepositLimit.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-cyan-300">Max Transaction</div>
                <div className="font-bold">${kycLimits.maxTransactionAmount.toFixed(2)}</div>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-gray-700">
          {(['wallets', 'send', 'receive', 'transactions'] as const).map((tab) => (
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

        {loading && <div className="text-center py-8">Loading...</div>}

        {/* Wallets Tab */}
        {activeTab === 'wallets' && (
          <div className="space-y-6">
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="bg-green-600 hover:bg-green-700 px-6 py-2 rounded font-semibold"
            >
              + Create New Wallet
            </button>

            {showCreateForm && (
              <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                <h3 className="text-xl font-bold mb-4">Create New Wallet</h3>
                <form onSubmit={handleCreateWallet} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Wallet Name</label>
                    <input
                      type="text"
                      value={createFormData.walletName}
                      onChange={(e) => setCreateFormData({ ...createFormData, walletName: e.target.value })}
                      className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white"
                      placeholder="My Ethereum Wallet"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Blockchain</label>
                    <select
                      value={createFormData.blockchain}
                      onChange={(e) => setCreateFormData({ ...createFormData, blockchain: e.target.value })}
                      className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white"
                    >
                      <option value="ethereum">Ethereum</option>
                      <option value="polygon">Polygon</option>
                      <option value="bsc">Binance Smart Chain</option>
                      <option value="solana">Solana</option>
                      <option value="bitcoin">Bitcoin</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Private Key (Optional - for import)</label>
                    <input
                      type="password"
                      value={createFormData.importPrivateKey}
                      onChange={(e) => setCreateFormData({ ...createFormData, importPrivateKey: e.target.value })}
                      className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white"
                      placeholder="Leave empty to generate new wallet"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="flex-1 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded font-semibold"
                    >
                      Create Wallet
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCreateForm(false)}
                      className="flex-1 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded font-semibold"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Wallets List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {wallets.map((wallet) => (
                <div
                  key={wallet.id}
                  className={`bg-gray-800 p-6 rounded-lg border-2 transition ${
                    wallet.isPrimary ? 'border-blue-500' : 'border-gray-700'
                  }`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-bold">{wallet.walletName}</h3>
                      <p className="text-gray-400 text-sm">{wallet.blockchain.toUpperCase()}</p>
                    </div>
                    {wallet.isPrimary && <span className="bg-blue-600 text-xs px-2 py-1 rounded">Primary</span>}
                  </div>

                  <div className="bg-gray-900 p-3 rounded mb-4">
                    <p className="text-gray-400 text-xs mb-1">Address</p>
                    <p className="text-sm font-mono break-all">{wallet.walletAddress}</p>
                  </div>

                  <div className="mb-4">
                    <p className="text-gray-400 text-sm">Balance</p>
                    <p className="text-2xl font-bold">{wallet.balance.toFixed(8)}</p>
                  </div>

                  <div className="flex gap-2">
                    {!wallet.isPrimary && (
                      <button
                        onClick={() => handleSetPrimary(wallet.id)}
                        className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-sm px-3 py-2 rounded"
                      >
                        Set Primary
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setSelectedWallet(wallet);
                        setActiveTab('send');
                      }}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-sm px-3 py-2 rounded"
                    >
                      Send
                    </button>
                    <button
                      onClick={() => {
                        setSelectedWallet(wallet);
                        setActiveTab('receive');
                      }}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-sm px-3 py-2 rounded"
                    >
                      Receive
                    </button>
                    {!wallet.isPrimary && wallet.balance === 0 && (
                      <button
                        onClick={() => handleDeleteWallet(wallet.id)}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-sm px-3 py-2 rounded"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Send Tab */}
        {activeTab === 'send' && (
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 max-w-2xl">
            <h3 className="text-xl font-bold mb-4">Send Crypto</h3>
            <form onSubmit={handleSendCrypto} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">From Wallet</label>
                <select
                  value={sendFormData.fromWalletId}
                  onChange={(e) => setSendFormData({ ...sendFormData, fromWalletId: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white"
                  required
                >
                  <option value="">Select wallet</option>
                  {wallets.map((w) => (
                    <key key={w.id}
                    value={w.id}
                    >
                      {w.walletName} ({w.balance.toFixed(4)} {w.blockchain})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">To Address</label>
                <input
                  type="text"
                  value={sendFormData.toAddress}
                  onChange={(e) => setSendFormData({ ...sendFormData, toAddress: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white"
                  placeholder="Destination wallet address"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Amount</label>
                <input
                  type="number"
                  step="0.00000001"
                  value={sendFormData.amount}
                  onChange={(e) => setSendFormData({ ...sendFormData, amount: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white"
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Password (for confirmation)</label>
                <input
                  type="password"
                  value={sendFormData.password}
                  onChange={(e) => setSendFormData({ ...sendFormData, password: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white"
                  required
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 px-4 py-2 rounded font-semibold"
                >
                  {loading ? 'Processing...' : 'Send Crypto'}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('wallets')}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded font-semibold"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Receive Tab */}
        {activeTab === 'receive' && selectedWallet && (
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 max-w-2xl">
            <h3 className="text-xl font-bold mb-4">Receive {selectedWallet.walletName}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Your Wallet Address</label>
                <div className="bg-gray-900 p-4 rounded border border-gray-700 text-center break-all">
                  <p className="font-mono text-sm">{selectedWallet.walletAddress}</p>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(selectedWallet.walletAddress);
                    alert('Address copied!');
                  }}
                  className="w-full mt-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded font-semibold"
                >
                  Copy Address
                </button>
              </div>

              <div>
                <p className="text-gray-400 mb-2">Send {selectedWallet.blockchain.toUpperCase()} to this address</p>
                <p className="text-sm text-yellow-400">⚠️ Only send {selectedWallet.blockchain.toUpperCase()} to this address. Sending other cryptocurrencies will result in loss of funds.</p>
              </div>
            </div>
          </div>
        )}

        {/* Transactions Tab */}
        {activeTab === 'transactions' && (
          <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
            <div className="p-6 bg-gray-750 border-b border-gray-700">
              <h2 className="text-xl font-bold">Transaction History</h2>
            </div>

            {transactions.length === 0 ? (
              <div className="p-6 text-center text-gray-400">No transactions yet</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-750 border-b border-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-medium">Type</th>
                      <th className="px-6 py-3 text-left text-sm font-medium">Address</th>
                      <th className="px-6 py-3 text-left text-sm font-medium">Amount</th>
                      <th className="px-6 py-3 text-left text-sm font-medium">Fee</th>
                      <th className="px-6 py-3 text-left text-sm font-medium">Status</th>
                      <th className="px-6 py-3 text-left text-sm font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx) => (
                      <tr key={tx.id} className="border-b border-gray-700 hover:bg-gray-750">
                        <td className="px-6 py-4 text-sm font-medium capitalize">{tx.type}</td>
                        <td className="px-6 py-4 text-sm font-mono text-gray-400">{tx.toAddress.slice(0, 20)}...</td>
                        <td className="px-6 py-4 text-sm font-medium">{tx.amount.toFixed(8)}</td>
                        <td className="px-6 py-4 text-sm">{tx.fee.toFixed(8)}</td>
                        <td className="px-6 py-4 text-sm">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              tx.status === 'confirmed'
                                ? 'bg-green-900 text-green-300'
                                : tx.status === 'pending'
                                  ? 'bg-yellow-900 text-yellow-300'
                                  : 'bg-red-900 text-red-300'
                            }`}
                          >
                            {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm">{new Date(tx.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default WalletManagementPage;
