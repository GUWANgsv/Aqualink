import React, { useState, useEffect } from 'react';
import { Link, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../Context/AuthContext';
import axios from 'axios';
import { customerPurchaseAPI } from '../../utils/apiService';
import BranchOrdersPage from './BranchOrdersPage';
import BranchInventoryPage from './BranchInventoryPage';
import BranchRecycleBin from './BranchRecycleBin';
import BranchDrivers from './BranchDrivers';
import BranchReports from './BranchReports';
import BranchSettings from './BranchSettings';
import BranchEmergency from './BranchEmergency';

function BranchManager() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const branchId = user?.branchId || 'BRANCH001';
  const branchName = user?.branchName || 'Main Branch';
  const [statistics, setStatistics] = useState({
    orders: { total: 0, pending: 0, processing: 0, delivered: 0 },
    inventory: { totalItems: 0, lowStock: 0, outOfStock: 0 },
    recycling: { totalBins: 0, criticalBins: 0, overallFill: 0 }
  });
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user, branchId]);

  // Auto-hide notification after 5 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch all data in parallel
      const [purchasesResponse, inventoryStats, recyclingStats] = await Promise.allSettled([
        customerPurchaseAPI.getBranchPurchases(branchName),
        axios.get(`http://localhost:5000/BranchInventory/statistics/${branchId}`),
        axios.get(`http://localhost:5000/RecyclingBins/statistics/${branchId}`)
      ]);
      
      // Calculate order statistics from customer purchases (same as orders tab)
      let orderStats = { totalOrders: 0, pendingOrders: 0, processingOrders: 0, deliveredOrders: 0, todayOrders: 0 };
      
      if (purchasesResponse.status === 'fulfilled') {
        const purchases = purchasesResponse.value.purchases || [];
        const today = new Date().toDateString();
        
        console.log('Dashboard - Fetched purchases:', purchases.length, 'purchases');
        console.log('Dashboard - Branch name:', branchName);
        console.log('Dashboard - Raw purchases data:', purchases);
        
        orderStats = {
          totalOrders: purchases.length,
          pendingOrders: purchases.filter(p => p.status === 'Pending').length,
          processingOrders: purchases.filter(p => p.status === 'Processing' || p.status === 'Assigned' || p.status === 'On Delivery').length,
          deliveredOrders: purchases.filter(p => p.status === 'Delivered').length,
          todayOrders: purchases.filter(p => new Date(p.purchaseDate).toDateString() === today).length
        };
        
        console.log('Dashboard - Calculated order stats:', orderStats);
      } else {
        console.error('Dashboard - Failed to fetch purchases:', purchasesResponse.reason);
      }
      
      // Set statistics
      setStatistics({
        orders: orderStats,
        inventory: inventoryStats.status === 'fulfilled' ? inventoryStats.value.data.statistics : { totalItems: 0, lowStockItems: 0, outOfStockItems: 0 },
        recycling: recyclingStats.status === 'fulfilled' ? recyclingStats.value.data.statistics : { totalBins: 0, criticalBins: 0, overallFillPercentage: 0 }
      });
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Set fallback data
      setStatistics({
        orders: { totalOrders: 0, pendingOrders: 0, processingOrders: 0, deliveredOrders: 0, todayOrders: 0 },
        inventory: { totalItems: 0, lowStockItems: 0, outOfStockItems: 0 },
        recycling: { totalBins: 0, criticalBins: 0, overallFillPercentage: 0 }
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout('/login');
    navigate('/login');
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
  };

  const getStatusColor = (percentage) => {
    if (percentage >= 80) return 'text-red-600';
    if (percentage >= 60) return 'text-orange-600';
    if (percentage >= 40) return 'text-yellow-600';
    return 'text-green-600';
  };

  const isActiveRoute = (path) => {
    if (path === '/branch-manager') {
      return location.pathname === '/branch-manager' || location.pathname === '/branch-manager/';
    }
    return location.pathname === path;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
          notification.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`}>
          <div className="flex items-center">
            <span className="mr-2">
              {notification.type === 'success' ? '✅' : '❌'}
            </span>
            {notification.message}
            <button
              onClick={() => setNotification(null)}
              className="ml-4 text-white hover:text-gray-200"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Branch Manager</h1>
              <p className="text-gray-600">{branchName}</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-500">Branch ID</p>
                <p className="font-semibold text-gray-900">{branchId}</p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm text-gray-500">Welcome,</p>
                  <p className="font-semibold text-gray-900">{user?.name}</p>
                </div>
                <div className="h-10 w-10 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold">BM</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            <Link
              to="/branch-manager"
              className={`py-4 px-1 border-b-2 text-sm font-medium ${
                isActiveRoute('/branch-manager') 
                  ? 'border-blue-500 text-blue-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Dashboard
            </Link>
            <Link
              to="/branch-manager/orders"
              className={`py-4 px-1 border-b-2 text-sm font-medium ${
                isActiveRoute('/branch-manager/orders') 
                  ? 'border-blue-500 text-blue-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Orders
            </Link>
            <Link
              to="/branch-manager/inventory"
              className={`py-4 px-1 border-b-2 text-sm font-medium ${
                isActiveRoute('/branch-manager/inventory') 
                  ? 'border-blue-500 text-blue-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Inventory
            </Link>
            <Link
              to="/branch-manager/recycle-bin"
              className={`py-4 px-1 border-b-2 text-sm font-medium ${
                isActiveRoute('/branch-manager/recycle-bin') 
                  ? 'border-blue-500 text-blue-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Recycle Bin
            </Link>
            <Link
              to="/branch-manager/drivers"
              className={`py-4 px-1 border-b-2 text-sm font-medium ${
                isActiveRoute('/branch-manager/drivers') 
                  ? 'border-blue-500 text-blue-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Drivers
            </Link>
            <Link
              to="/branch-manager/reports"
              className={`py-4 px-1 border-b-2 text-sm font-medium ${
                isActiveRoute('/branch-manager/reports') 
                  ? 'border-blue-500 text-blue-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Reports
            </Link>
            <Link
              to="/branch-manager/emergency"
              className={`py-4 px-1 border-b-2 text-sm font-medium ${
                isActiveRoute('/branch-manager/emergency') 
                  ? 'border-blue-500 text-blue-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Emergency
            </Link>
            <Link
              to="/branch-manager/settings"
              className={`py-4 px-1 border-b-2 text-sm font-medium ${
                isActiveRoute('/branch-manager/settings') 
                  ? 'border-blue-500 text-blue-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Settings
            </Link>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Routes>
          <Route path="/" element={<Dashboard statistics={statistics} getStatusColor={getStatusColor} loading={loading} fetchDashboardData={fetchDashboardData} showNotification={showNotification} />} />
          <Route path="orders" element={<BranchOrdersPage branchId={branchId} branchName={branchName} showNotification={showNotification} />} />
          <Route path="inventory" element={<BranchInventoryPage branchId={branchId} branchName={branchName} showNotification={showNotification} />} />
          <Route path="recycle-bin" element={<BranchRecycleBin branchId={branchId} branchName={branchName} />} />
          <Route path="drivers" element={<BranchDrivers branchId={branchId} branchName={branchName} showNotification={showNotification} />} />
          <Route path="reports" element={<BranchReports branchId={branchId} branchName={branchName} />} />
          <Route path="emergency" element={<BranchEmergency branchId={branchId} branchName={branchName} showNotification={showNotification} />} />
          <Route path="settings" element={<BranchSettings branchId={branchId} branchName={branchName} showNotification={showNotification} />} />
        </Routes>
      </div>
    </div>
  );
}

// Dashboard Component
function Dashboard({ statistics, getStatusColor, loading, fetchDashboardData, showNotification }) {
  console.log('Dashboard - Received statistics:', statistics);
  console.log('Dashboard - Loading state:', loading);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Dashboard Overview</h2>
        
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Orders Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Orders</p>
                <p className="text-2xl font-semibold text-gray-900">{statistics.orders.totalOrders || 0}</p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
              <div>
                <p className="text-gray-500">Pending</p>
                <p className="font-semibold text-yellow-600">{statistics.orders.pendingOrders || 0}</p>
              </div>
              <div>
                <p className="text-gray-500">Processing</p>
                <p className="font-semibold text-blue-600">{statistics.orders.processingOrders || 0}</p>
              </div>
              <div>
                <p className="text-gray-500">Delivered</p>
                <p className="font-semibold text-green-600">{statistics.orders.deliveredOrders || 0}</p>
              </div>
            </div>
          </div>

          {/* Inventory Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100 text-green-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Inventory Items</p>
                <p className="text-2xl font-semibold text-gray-900">{statistics.inventory.totalItems || 0}</p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-gray-500">Low Stock</p>
                <p className="font-semibold text-orange-600">{statistics.inventory.lowStockItems || 0}</p>
              </div>
              <div>
                <p className="text-gray-500">Out of Stock</p>
                <p className="font-semibold text-red-600">{statistics.inventory.outOfStockItems || 0}</p>
              </div>
            </div>
          </div>

          {/* Recycling Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Recycling Bins</p>
                <p className="text-2xl font-semibold text-gray-900">{statistics.recycling.totalBins || 0}</p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-gray-500">Critical</p>
                <p className="font-semibold text-red-600">{statistics.recycling.criticalBins || 0}</p>
              </div>
              <div>
                <p className="text-gray-500">Fill Level</p>
                <p className={`font-semibold ${getStatusColor(statistics.recycling.overallFillPercentage || 0)}`}>
                  {(statistics.recycling.overallFillPercentage || 0).toFixed(1)}%
                </p>
              </div>
            </div>
          </div>

          {/* Today's Orders Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-indigo-100 text-indigo-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Today's Orders</p>
                <p className="text-2xl font-semibold text-gray-900">{statistics.orders.todayOrders || 0}</p>
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm text-gray-500">New orders placed today</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
            <button
              onClick={() => {
                fetchDashboardData();
                showNotification('Dashboard refreshed!', 'success');
              }}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors text-sm"
            >
              🔄 Refresh Dashboard
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              to="/branch-manager/orders"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="p-2 rounded-full bg-blue-100 text-blue-600 mr-3">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-900">Manage Orders</p>
                <p className="text-sm text-gray-500">View and manage all orders</p>
              </div>
            </Link>

            <Link
              to="/branch-manager/inventory"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="p-2 rounded-full bg-green-100 text-green-600 mr-3">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-900">Manage Inventory</p>
                <p className="text-sm text-gray-500">Update stock levels</p>
              </div>
            </Link>

            <Link
              to="/branch-manager/recycle-bin"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="p-2 rounded-full bg-purple-100 text-purple-600 mr-3">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-900">Check Recycling</p>
                <p className="text-sm text-gray-500">Monitor bin levels</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BranchManager;