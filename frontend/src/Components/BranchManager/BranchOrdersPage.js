import React, { useState, useEffect } from 'react';
import { employeeAPI, customerPurchaseAPI } from '../../utils/apiService';

function BranchOrdersPage({ branchId, branchName, showNotification }) {
  const [purchases, setPurchases] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [showDriverModal, setShowDriverModal] = useState(false);

  useEffect(() => {
    if (branchName) {
      fetchPurchases();
      fetchAvailableDrivers();
    }
  }, [branchName]);

  const fetchPurchases = async () => {
    try {
      setLoading(true);
      const response = await customerPurchaseAPI.getBranchPurchases(branchName);
      setPurchases(response.purchases || []);
    } catch (error) {
      console.error('Error fetching purchases:', error);
      showNotification('Failed to fetch customer purchases', 'error');
      setPurchases([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableDrivers = async () => {
    try {
      const response = await employeeAPI.getDriversByBranch(branchName);
      const availableDrivers = (response.drivers || []).filter(driver => 
        driver.driverStatus === 'Available'
      );
      setDrivers(availableDrivers);
    } catch (error) {
      console.error('Error fetching drivers:', error);
      setDrivers([]);
    }
  };

  const handleAssignDriver = async (purchaseId, driverId) => {
    try {
      await customerPurchaseAPI.assignDriver(purchaseId, driverId);
      showNotification('Driver assigned successfully!', 'success');
      setShowDriverModal(false);
      setSelectedPurchase(null);
      fetchPurchases();
      fetchAvailableDrivers(); // Refresh to update driver availability
    } catch (error) {
      console.error('Error assigning driver:', error);
      showNotification('Failed to assign driver. Please try again.', 'error');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Processing': return 'bg-blue-100 text-blue-800';
      case 'Assigned': return 'bg-purple-100 text-purple-800';
      case 'On Delivery': return 'bg-orange-100 text-orange-800';
      case 'Delivered': return 'bg-green-100 text-green-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredPurchases = purchases.filter(purchase => {
    const matchesStatus = filterStatus === 'all' || purchase.status === filterStatus;
    const matchesSearch = purchase.purchaseNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         purchase.customerName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getPurchaseStats = () => {
    const total = purchases.length;
    const pending = purchases.filter(p => p.status === 'Pending').length;
    const assigned = purchases.filter(p => p.status === 'Assigned').length;
    const onDelivery = purchases.filter(p => p.status === 'On Delivery').length;
    const delivered = purchases.filter(p => p.status === 'Delivered').length;
    return { total, pending, assigned, onDelivery, delivered };
  };

  const stats = getPurchaseStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Customer Orders</h1>
            <p className="text-gray-600">Manage customer purchases and assign drivers for delivery</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => {
                fetchPurchases();
                fetchAvailableDrivers();
                showNotification('Orders refreshed!', 'success');
              }}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              🔄 Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Orders</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.pending}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 text-purple-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Assigned</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.assigned}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-orange-100 text-orange-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">On Delivery</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.onDelivery}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Delivered</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.delivered}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex space-x-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="all">All Status</option>
                {['Pending', 'Processing', 'Assigned', 'On Delivery', 'Delivered', 'Cancelled'].map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search Orders</label>
            <input
              type="text"
              placeholder="Search by order number or customer name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm w-full md:w-64"
            />
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Items
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Driver
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPurchases.map((purchase) => (
                <tr key={purchase._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{purchase.purchaseNumber}</div>
                      <div className="text-sm text-gray-500">
                        {new Date(purchase.purchaseDate).toLocaleDateString()}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{purchase.customerName}</div>
                      <div className="text-sm text-gray-500">{purchase.customerPhone}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div className="max-w-xs">
                      {purchase.items.map((item, index) => (
                        <div key={index} className="text-sm">
                          {item.itemName} - {item.quantity} pcs
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    Rs. {purchase.totalAmount.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {purchase.assignedDriver ? (
                      <div>
                        <div className="text-sm font-medium text-gray-900">{purchase.assignedDriver.name}</div>
                        <div className="text-sm text-gray-500">{purchase.assignedDriver.phone}</div>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">Not assigned</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(purchase.status)}`}>
                      {purchase.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {purchase.status === 'Pending' && (
                      <button
                        onClick={() => {
                          setSelectedPurchase(purchase);
                          setShowDriverModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Assign Driver
                      </button>
                    )}
                    {purchase.status === 'Assigned' && (
                      <span className="text-gray-400">Waiting for driver</span>
                    )}
                    {purchase.status === 'On Delivery' && (
                      <span className="text-orange-600">In progress</span>
                    )}
                    {purchase.status === 'Delivered' && (
                      <span className="text-green-600">Completed</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredPurchases.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
            <p className="text-gray-500">Try adjusting your search or filter criteria.</p>
          </div>
        )}
      </div>

      {/* Driver Assignment Modal */}
      {showDriverModal && selectedPurchase && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Assign Driver</h3>
                <button
                  onClick={() => {
                    setShowDriverModal(false);
                    setSelectedPurchase(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Order Details:</h4>
                <div className="bg-gray-50 p-3 rounded-md">
                  <p><strong>Order:</strong> {selectedPurchase.purchaseNumber}</p>
                  <p><strong>Customer:</strong> {selectedPurchase.customerName}</p>
                  <p><strong>Amount:</strong> Rs. {selectedPurchase.totalAmount.toFixed(2)}</p>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Available Driver:</label>
                {drivers.length > 0 ? (
                  <div className="space-y-2">
                    {drivers.map((driver) => (
                      <div key={driver._id} className="flex items-center justify-between p-3 border rounded-md hover:bg-gray-50">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{driver.name}</div>
                          <div className="text-sm text-gray-500">{driver.phone} • {driver.vehicleType} Vehicle</div>
                        </div>
                        <button
                          onClick={() => handleAssignDriver(selectedPurchase._id, driver._id)}
                          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm"
                        >
                          Assign
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    <p>No available drivers found</p>
                    <p className="text-sm">All drivers are currently busy</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default BranchOrdersPage;