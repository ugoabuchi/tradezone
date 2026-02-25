import React, { useState, useEffect } from 'react';
import api from '../services/api';

interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  listing_type: 'nft' | 'product' | 'service';
  seller_user_id: string;
  images?: string[];
  views: number;
  quantity: number;
}

export const MarketplacePage: React.FC = () => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'nft' | 'product' | 'service'>('all');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: 0,
    currency: 'USDT',
    listingType: 'product' as const,
    quantity: 1,
  });

  useEffect(() => {
    fetchListings();
  }, [filterType]);

  const fetchListings = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchQuery) params.append('q', searchQuery);
      if (filterType !== 'all') params.append('type', filterType);

      const response = await api.get(`/marketplace/search?${params}`);
      setListings(response.data);
    } catch (error) {
      console.error('Failed to fetch listings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateListing = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/marketplace/listings', formData);
      setShowCreateForm(false);
      setFormData({
        title: '',
        description: '',
        price: 0,
        currency: 'USDT',
        listingType: 'product',
        quantity: 1,
      });
      fetchListings();
    } catch (error) {
      console.error('Failed to create listing:', error);
    }
  };

  const handlePurchase = async (listingId: string) => {
    try {
      await api.post('/marketplace/purchase', {
        listingId,
        quantity: 1,
      });
      alert('Purchase initiated! Proceed to payment.');
      fetchListings();
    } catch (error) {
      console.error('Failed to purchase:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Marketplace</h1>
          <p className="text-gray-400">Buy and sell NFTs, products, and services with crypto</p>
        </div>

        {/* Search and Filter */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <div className="flex gap-4 mb-4">
            <input
              type="text"
              placeholder="Search listings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && fetchListings()}
              className="flex-1 bg-gray-700 border border-gray-600 rounded px-4 py-2 text-white placeholder-gray-400"
            />
            <button
              onClick={fetchListings}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded font-semibold"
            >
              Search
            </button>
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded font-semibold"
            >
              + Create Listing
            </button>
          </div>

          {/* Filter Buttons */}
          <div className="flex gap-2">
            {(['all', 'nft', 'product', 'service'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-4 py-2 rounded font-semibold ${
                  filterType === type
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Create Listing Form */}
        {showCreateForm && (
          <div className="bg-gray-800 rounded-lg p-6 mb-8">
            <h2 className="text-2xl font-bold mb-4">Create New Listing</h2>
            <form onSubmit={handleCreateListing}>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                    placeholder="Product name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Type</label>
                  <select
                    value={formData.listingType}
                    onChange={(e) => setFormData({ ...formData, listingType: e.target.value as any })}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                  >
                    <option value="product">Product</option>
                    <option value="service">Service</option>
                    <option value="nft">NFT</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Price</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                    required
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Currency</label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                  >
                    <option value="USDT">USDT</option>
                    <option value="ETH">ETH</option>
                    <option value="BTC">BTC</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-semibold mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                    rows={4}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                    placeholder="Describe your product or service..."
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded font-semibold"
                >
                  Create Listing
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded font-semibold"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Listings Grid */}
        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : listings.length === 0 ? (
          <div className="text-center py-12 text-gray-400">No listings found</div>
        ) : (
          <div className="grid grid-cols-3 gap-6">
            {listings.map((listing) => (
              <div key={listing.id} className="bg-gray-800 rounded-lg overflow-hidden hover:shadow-lg transition">
                <div className="bg-gray-700 h-48 flex items-center justify-center">
                  {listing.images && listing.images[0] ? (
                    <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-gray-500 text-center">
                      <div className="text-4xl mb-2">📦</div>
                      <div>No image</div>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-lg flex-1">{listing.title}</h3>
                    <span className="text-xs bg-gray-700 px-2 py-1 rounded">
                      {listing.listing_type}
                    </span>
                  </div>
                  <p className="text-gray-400 text-sm mb-3 line-clamp-2">{listing.description}</p>
                  <div className="flex justify-between items-center mb-3">
                    <div>
                      <div className="text-2xl font-bold text-green-400">
                        {listing.price} {listing.currency}
                      </div>
                      <div className="text-xs text-gray-500">{listing.views} views</div>
                    </div>
                  </div>
                  <button
                    onClick={() => handlePurchase(listing.id)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded font-semibold"
                  >
                    Buy Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MarketplacePage;
