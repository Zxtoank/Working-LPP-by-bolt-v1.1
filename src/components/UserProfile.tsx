import React, { useState, useEffect } from 'react';
import { User, Download, Package, Crown, Calendar, CreditCard, Eye, Trash2, Star } from 'lucide-react';

interface UserProfileProps {
  user: { email: string; isPremium: boolean } | null;
  onClose: () => void;
}

interface DownloadHistory {
  id: string;
  filename: string;
  format: string;
  dpi: number;
  downloadDate: string;
  downloadUrl: string;
}

interface PhysicalOrder {
  id: string;
  orderDate: string;
  status: 'processing' | 'shipped' | 'delivered';
  trackingNumber?: string;
  price: number;
  shippingAddress: {
    name: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  items: {
    filename: string;
    quantity: number;
    price: number;
  }[];
}

interface Subscription {
  id: string;
  plan: 'basic' | 'premium' | 'pro';
  status: 'active' | 'cancelled' | 'expired';
  startDate: string;
  nextBilling: string;
  price: number;
}

export const UserProfile: React.FC<UserProfileProps> = ({ user, onClose }) => {
  const [activeTab, setActiveTab] = useState<'downloads' | 'orders' | 'subscription'>('downloads');
  const [downloads, setDownloads] = useState<DownloadHistory[]>([]);
  const [orders, setOrders] = useState<PhysicalOrder[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);

  useEffect(() => {
    // Load user data from localStorage (in real app, this would be from your backend)
    const savedDownloads = localStorage.getItem(`downloads-${user?.email}`);
    const savedOrders = localStorage.getItem(`orders-${user?.email}`);
    const savedSubscription = localStorage.getItem(`subscription-${user?.email}`);

    if (savedDownloads) setDownloads(JSON.parse(savedDownloads));
    if (savedOrders) setOrders(JSON.parse(savedOrders));
    if (savedSubscription) setSubscription(JSON.parse(savedSubscription));
  }, [user?.email]);

  const handleRedownload = (download: DownloadHistory) => {
    // Create a temporary link to re-download the file
    const link = document.createElement('a');
    link.href = download.downloadUrl;
    link.download = download.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDeleteDownload = (downloadId: string) => {
    if (confirm('Are you sure you want to delete this download from your history?')) {
      const updatedDownloads = downloads.filter(d => d.id !== downloadId);
      setDownloads(updatedDownloads);
      localStorage.setItem(`downloads-${user?.email}`, JSON.stringify(updatedDownloads));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'processing': return 'text-yellow-600 bg-yellow-100';
      case 'shipped': return 'text-blue-600 bg-blue-100';
      case 'delivered': return 'text-green-600 bg-green-100';
      case 'active': return 'text-green-600 bg-green-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
      case 'expired': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPlanDetails = (plan: string) => {
    switch (plan) {
      case 'basic': return { name: 'Basic Plan', price: '$4.99/month', features: ['5 downloads/month', 'Standard support'] };
      case 'premium': return { name: 'Premium Plan', price: '$9.99/month', features: ['Unlimited downloads', 'Priority support', 'Physical orders discount'] };
      case 'pro': return { name: 'Pro Plan', price: '$19.99/month', features: ['Everything in Premium', 'Bulk orders', 'Custom shapes', 'API access'] };
      default: return { name: 'No Plan', price: 'Free', features: ['Limited features'] };
    }
  };

  if (!user) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-white/20 p-3 rounded-full">
                <User className="h-8 w-8" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">{user.email}</h2>
                <div className="flex items-center space-x-2 mt-1">
                  {user.isPremium && (
                    <span className="bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full text-xs font-bold flex items-center space-x-1">
                      <Crown className="h-3 w-3" />
                      <span>PREMIUM</span>
                    </span>
                  )}
                  <span className="text-blue-100 text-sm">Member since 2024</span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition-colors duration-200"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'downloads', label: 'Downloads', icon: Download },
              { id: 'orders', label: 'Physical Orders', icon: Package },
              { id: 'subscription', label: 'Subscription', icon: Crown },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors duration-200 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-96">
          {activeTab === 'downloads' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Download History</h3>
              {downloads.length === 0 ? (
                <div className="text-center py-8">
                  <Download className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No downloads yet</p>
                  <p className="text-sm text-gray-400">Your download history will appear here</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {downloads.map((download) => (
                    <div key={download.id} className="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{download.filename}</h4>
                        <p className="text-sm text-gray-600">
                          {download.format.toUpperCase()} • {download.dpi}DPI • {new Date(download.downloadDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleRedownload(download)}
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors duration-200"
                          title="Re-download"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteDownload(download.id)}
                          className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors duration-200"
                          title="Delete from history"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'orders' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Physical Orders</h3>
              {orders.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No physical orders yet</p>
                  <p className="text-sm text-gray-400">Your physical print orders will appear here</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div key={order.id} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-medium text-gray-900">Order #{order.id}</h4>
                          <p className="text-sm text-gray-600">{new Date(order.orderDate).toLocaleDateString()}</p>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </span>
                          <span className="font-semibold text-gray-900">${order.price.toFixed(2)}</span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <h5 className="font-medium text-gray-700 mb-1">Items:</h5>
                          {order.items.map((item, index) => (
                            <p key={index} className="text-gray-600">
                              {item.filename} (×{item.quantity}) - ${item.price.toFixed(2)}
                            </p>
                          ))}
                        </div>
                        <div>
                          <h5 className="font-medium text-gray-700 mb-1">Shipping Address:</h5>
                          <p className="text-gray-600">
                            {order.shippingAddress.name}<br />
                            {order.shippingAddress.address}<br />
                            {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}
                          </p>
                          {order.trackingNumber && (
                            <p className="text-blue-600 mt-2">
                              Tracking: {order.trackingNumber}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'subscription' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Subscription</h3>
              {subscription ? (
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border border-blue-100">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="bg-blue-500 text-white p-2 rounded-lg">
                        <Crown className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{getPlanDetails(subscription.plan).name}</h4>
                        <p className="text-sm text-gray-600">{getPlanDetails(subscription.plan).price}</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(subscription.status)}`}>
                      {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-600">Started: {new Date(subscription.startDate).toLocaleDateString()}</p>
                      {subscription.status === 'active' && (
                        <p className="text-sm text-gray-600">Next billing: {new Date(subscription.nextBilling).toLocaleDateString()}</p>
                      )}
                    </div>
                    <div>
                      <h5 className="font-medium text-gray-700 mb-2">Features:</h5>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {getPlanDetails(subscription.plan).features.map((feature, index) => (
                          <li key={index} className="flex items-center space-x-2">
                            <Star className="h-3 w-3 text-yellow-500" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  
                  <div className="flex space-x-3">
                    <button className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors duration-200">
                      Manage Subscription
                    </button>
                    {subscription.status === 'active' && (
                      <button className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors duration-200">
                        Cancel Subscription
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Crown className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">No active subscription</p>
                  <button className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-200">
                    Choose a Plan
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};