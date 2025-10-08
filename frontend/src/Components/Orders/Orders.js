import React, { useState, useEffect } from 'react';
import UniversalNavbar from '../Nav/UniversalNavbar';
import Footer from '../Footer/Footer';
import axios from 'axios';
import { useAuth } from '../../Context/AuthContext';
import { useNavigate } from 'react-router-dom';

function Orders() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [notification, setNotification] = useState(null);
  const [formData, setFormData] = useState({
    branchName: '',
    branchLocation: '',
    items: [{ itemName: '', quantity: '' }],
    expectedDeliveryDate: '',
    priority: 'Medium',
    notes: '',
    contactPerson: '',
    contactPhone: ''
  });

  const inventoryTypes = [
    'RO Membranes',
    'Mud-filters', 
    'Mineral Cartridge',
    'UV Cartridge',
    'Water Pumps'
  ];

  const priorities = ['Low', 'Medium', 'High', 'Urgent'];
  const statuses = ['Pending', 'Accepted', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

  const [filterStatus, setFilterStatus] = useState('all');
  const [filterSource, setFilterSource] = useState('all');

  // Navigation guard - ensure only Factory Managers can access
  useEffect(() => {
    if (user && user.role !== 'Factory Manager') {
      console.error('Access denied: User does not have Factory Manager privileges');
      navigate('/login');
    }
  }, [user, navigate]);

  useEffect(() => {
    fetchOrders();
  }, []);

  // If user is not authenticated or doesn't have the right role, show loading
  if (!user || user.role !== 'Factory Manager') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const fetchOrders = async () => {
    try {
      const response = await axios.get('http://localhost:5000/Orders');
      setOrders(response.data.orders);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  // Validation functions
  const validateForm = () => {
    const errors = {};

    // Branch validation
    if (!formData.branchName.trim()) {
      errors.branchName = 'Branch name is required';
    } else if (formData.branchName.trim().length < 2) {
      errors.branchName = 'Branch name must be at least 2 characters';
    }

    if (!formData.branchLocation.trim()) {
      errors.branchLocation = 'Branch location is required';
    }

    // Contact validation
    if (!formData.contactPerson.trim()) {
      errors.contactPerson = 'Contact person is required';
    }

    if (!formData.contactPhone.trim()) {
      errors.contactPhone = 'Contact phone is required';
    } else if (!/^[\+]?[0-9\s\-\(\)]{10,}$/.test(formData.contactPhone)) {
      errors.contactPhone = 'Please enter a valid phone number';
    }

    // Date validation
    if (!formData.expectedDeliveryDate) {
      errors.expectedDeliveryDate = 'Expected delivery date is required';
    } else {
      const selectedDate = new Date(formData.expectedDeliveryDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (selectedDate < today) {
        errors.expectedDeliveryDate = 'Expected delivery date cannot be in the past';
      }
    }

    // Items validation
    const validItems = formData.items.filter(item => item.itemName && item.quantity);
    if (validItems.length === 0) {
      errors.items = 'At least one item is required';
    } else {
      formData.items.forEach((item, index) => {
        if (item.itemName && !item.quantity) {
          errors[`itemQuantity_${index}`] = 'Quantity is required';
        } else if (item.quantity && !item.itemName) {
          errors[`itemName_${index}`] = 'Item name is required';
        } else if (item.quantity && item.itemName) {
          const quantity = parseInt(item.quantity);
          if (isNaN(quantity) || quantity <= 0) {
            errors[`itemQuantity_${index}`] = 'Quantity must be a positive number';
          } else if (quantity > 1000) {
            errors[`itemQuantity_${index}`] = 'Quantity cannot exceed 1000';
          }
        }
      });
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;
    setFormData(prev => ({
      ...prev,
      items: newItems
    }));
    
    // Clear item-specific errors
    const errorKey = `item${field.charAt(0).toUpperCase() + field.slice(1)}_${index}`;
    if (formErrors[errorKey]) {
      setFormErrors(prev => ({
        ...prev,
        [errorKey]: ''
      }));
    }
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { itemName: '', quantity: '' }]
    }));
  };

  const removeItem = (index) => {
    if (formData.items.length > 1) {
      const newItems = formData.items.filter((_, i) => i !== index);
      setFormData(prev => ({
        ...prev,
        items: newItems
      }));
    }
  };

  const handleAddOrder = async (e) => {
    e.preventDefault();
    
    // Validate form before submission
    if (!validateForm()) {
      return;
    }

    try {
      // Filter out empty items and convert quantity to number
      const validItems = formData.items
        .filter(item => item.itemName && item.quantity)
        .map(item => ({
          ...item,
          quantity: parseInt(item.quantity)
        }));
      
      const orderData = {
        ...formData,
        items: validItems
      };

      const response = await axios.post('http://localhost:5000/Orders', orderData);
      
      if (response.data.order) {
        setShowAddModal(false);
        setFormData({
          branchName: '',
          branchLocation: '',
          items: [{ itemName: '', quantity: '' }],
          expectedDeliveryDate: '',
          priority: 'Medium',
          notes: '',
          contactPerson: '',
          contactPhone: ''
        });
        setFormErrors({});
        fetchOrders();
        alert('Order added successfully!');
      }
    } catch (error) {
      console.error('Error adding order:', error);
      if (error.response && error.response.data) {
        const { message, errors } = error.response.data;
        if (errors && Array.isArray(errors)) {
          alert(`Error: ${message}\n\n${errors.join('\n')}`);
        } else {
          alert(`Error: ${message}`);
        }
      } else {
        alert('Error adding order. Please try again.');
      }
    }
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      const response = await axios.put(`http://localhost:5000/Orders/${orderId}/status`, { status: newStatus });
      fetchOrders();
      
      // Trigger inventory refresh if status change affects inventory (e.g., Shipped, Delivered)
      if (newStatus === 'Shipped' || newStatus === 'Delivered') {
        window.dispatchEvent(new CustomEvent('inventoryUpdated', {
          detail: { 
            action: 'orderStatusUpdated',
            orderId: orderId,
            newStatus: newStatus,
            inventoryUpdates: response.data?.inventoryUpdates || []
          }
        }));
      }
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  const acceptOrder = async (orderId) => {
    try {
      const response = await axios.put(`http://localhost:5000/Orders/${orderId}/accept`);
      
      if (response.data.success) {
        // Show success message with inventory details
        let message = response.data.message;
        
        if (response.data.inventoryUpdates && response.data.inventoryUpdates.length > 0) {
          message += `\n\nInventory allocated:`;
          response.data.inventoryUpdates.forEach(update => {
            message += `\n• ${update.itemName}: ${update.quantityReserved} units reserved (Factory: ${update.newFactoryQuantity} remaining)`;
          });
        }
        
        showNotification(message, 'success');
        fetchOrders(); // Refresh the orders list
        
        // Trigger inventory refresh in other components
        window.dispatchEvent(new CustomEvent('inventoryUpdated', {
          detail: { 
            action: 'orderAccepted',
            orderId: orderId,
            inventoryUpdates: response.data.inventoryUpdates 
          }
        }));
      }
    } catch (error) {
      console.error('Error accepting order:', error);
      let errorMessage = 'Error accepting order';
      
      if (error.response && error.response.data) {
        if (error.response.data.errors) {
          errorMessage += ':\n' + error.response.data.errors.join('\n');
        } else if (error.response.data.message) {
          errorMessage += ': ' + error.response.data.message;
        }
      }
      
      showNotification(errorMessage, 'error');
    }
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleDeleteOrder = async (id) => {
    if (window.confirm('Are you sure you want to delete this order?')) {
      try {
        await axios.delete(`http://localhost:5000/Orders/${id}`);
        showNotification('Order deleted successfully', 'success');
        fetchOrders();
      } catch (error) {
        console.error('Error deleting order:', error);
        showNotification('Error deleting order. Please try again.', 'error');
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending': return 'text-yellow-600 bg-yellow-100';
      case 'Accepted': return 'text-blue-600 bg-blue-100';
      case 'Processing': return 'text-blue-600 bg-blue-100';
      case 'Shipped': return 'text-purple-600 bg-purple-100';
      case 'Delivered': return 'text-green-600 bg-green-100';
      case 'Cancelled': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Urgent': return 'text-red-600 bg-red-100';
      case 'High': return 'text-orange-600 bg-orange-100';
      case 'Medium': return 'text-yellow-600 bg-yellow-100';
      case 'Low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Filter orders based on status and source
  const filteredOrders = orders.filter(order => {
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
    const matchesSource = filterSource === 'all' || order.source === filterSource;
    return matchesStatus && matchesSource;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <UniversalNavbar />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <UniversalNavbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Orders Management</h1>
            <p className="text-gray-600 mt-2">Manage orders from branches and track delivery status</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition-colors"
          >
            Add New Order
          </button>
        </div>

        {/* Notification */}
        {notification && (
          <div className={`mb-6 p-4 rounded-lg shadow-lg ${
            notification.type === 'success' 
              ? 'bg-green-500 text-white' 
              : 'bg-red-500 text-white'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <span className="mr-2">
                  {notification.type === 'success' ? '✅' : '❌'}
                </span>
                <span className="whitespace-pre-line">{notification.message}</span>
              </div>
              <button
                onClick={() => setNotification(null)}
                className="text-white hover:text-gray-200"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Order Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <div className="p-2 rounded-full bg-yellow-100 text-yellow-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-lg font-semibold text-gray-900">
                  {orders.filter(o => o.status === 'Pending').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <div className="p-2 rounded-full bg-blue-100 text-blue-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Accepted</p>
                <p className="text-lg font-semibold text-gray-900">
                  {orders.filter(o => o.status === 'Accepted').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <div className="p-2 rounded-full bg-purple-100 text-purple-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Processing</p>
                <p className="text-lg font-semibold text-gray-900">
                  {orders.filter(o => o.status === 'Processing').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <div className="p-2 rounded-full bg-indigo-100 text-indigo-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Shipped</p>
                <p className="text-lg font-semibold text-gray-900">
                  {orders.filter(o => o.status === 'Shipped').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <div className="p-2 rounded-full bg-green-100 text-green-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Delivered</p>
                <p className="text-lg font-semibold text-gray-900">
                  {orders.filter(o => o.status === 'Delivered').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <div className="p-2 rounded-full bg-gray-100 text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-lg font-semibold text-gray-900">{orders.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Filters */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex flex-wrap items-center justify-between">
              <div className="flex flex-wrap items-center space-x-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Status</label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                  >
                    <option value="all">All Status</option>
                    {statuses.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Source</label>
                  <select
                    value={filterSource}
                    onChange={(e) => setFilterSource(e.target.value)}
                    className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                  >
                    <option value="all">All Sources</option>
                    <option value="Direct">Direct Orders</option>
                    <option value="Branch Request">Branch Requests</option>
                  </select>
                </div>
                <div>
                  <button
                    onClick={() => {
                      setFilterStatus('all');
                      setFilterSource('all');
                    }}
                    className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800"
                  >
                    Clear Filters
                  </button>
                </div>
                <div>
                  <button
                    onClick={() => setFilterStatus('Pending')}
                    className="px-3 py-2 text-sm bg-yellow-100 text-yellow-800 rounded-md hover:bg-yellow-200"
                  >
                    Show Pending Only
                  </button>
                </div>
              </div>
              <div className="text-sm text-gray-600">
                Showing {filteredOrders.length} of {orders.length} orders
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Branch
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Items
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Source
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Expected Delivery
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
                {filteredOrders.map((order) => (
                  <tr key={order._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {order.orderNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{order.branchName}</div>
                      <div className="text-sm text-gray-500">{order.branchLocation}</div>
                      {order.source === 'Branch Request' && (
                        <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mt-1">
                          <span className="w-2 h-2 bg-blue-400 rounded-full mr-1"></span>
                          Branch Request
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {order.items.map(item => `${item.itemName} (${item.quantity})`).join(', ')}
                      </div>
                      <div className="text-sm text-gray-500">Total: {order.totalQuantity} units</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(order.priority)}`}>
                        {order.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {order.source}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(order.expectedDeliveryDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                      {order.status === 'Accepted' && order.acceptedDate && (
                        <div className="text-xs text-gray-500 mt-1">
                          Accepted: {new Date(order.acceptedDate).toLocaleDateString()}
                          {order.acceptedBy && ` by ${order.acceptedBy}`}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex flex-col space-y-2">
                        {/* Accept button for pending orders */}
                        {order.status === 'Pending' && (
                          <button
                            onClick={() => acceptOrder(order._id)}
                            className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700 transition-colors"
                          >
                            ✓ Accept Order
                          </button>
                        )}
                        
                        {/* Status update dropdown */}
                        <select
                          value={order.status}
                          onChange={(e) => handleStatusUpdate(order._id, e.target.value)}
                          className="text-sm border border-gray-300 rounded px-2 py-1"
                        >
                          {statuses.map(status => (
                            <option key={status} value={status}>{status}</option>
                          ))}
                        </select>
                        
                        {/* Delete button */}
                        <button
                          onClick={() => handleDeleteOrder(order._id)}
                          className="text-red-600 hover:text-red-900 text-xs"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Order Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Order</h3>
              <form onSubmit={handleAddOrder} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Branch Name</label>
                    <input
                      type="text"
                      name="branchName"
                      value={formData.branchName}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 ${
                        formErrors.branchName ? 'border-red-500' : 'border-gray-300'
                      }`}
                      required
                    />
                    {formErrors.branchName && <p className="text-red-500 text-xs mt-1">{formErrors.branchName}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Branch Location</label>
                    <input
                      type="text"
                      name="branchLocation"
                      value={formData.branchLocation}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 ${
                        formErrors.branchLocation ? 'border-red-500' : 'border-gray-300'
                      }`}
                      required
                    />
                    {formErrors.branchLocation && <p className="text-red-500 text-xs mt-1">{formErrors.branchLocation}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Contact Person</label>
                    <input
                      type="text"
                      name="contactPerson"
                      value={formData.contactPerson}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 ${
                        formErrors.contactPerson ? 'border-red-500' : 'border-gray-300'
                      }`}
                      required
                    />
                    {formErrors.contactPerson && <p className="text-red-500 text-xs mt-1">{formErrors.contactPerson}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Contact Phone</label>
                    <input
                      type="text"
                      name="contactPhone"
                      value={formData.contactPhone}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 ${
                        formErrors.contactPhone ? 'border-red-500' : 'border-gray-300'
                      }`}
                      required
                    />
                    {formErrors.contactPhone && <p className="text-red-500 text-xs mt-1">{formErrors.contactPhone}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Expected Delivery Date</label>
                    <input
                      type="date"
                      name="expectedDeliveryDate"
                      value={formData.expectedDeliveryDate}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 ${
                        formErrors.expectedDeliveryDate ? 'border-red-500' : 'border-gray-300'
                      }`}
                      required
                    />
                    {formErrors.expectedDeliveryDate && <p className="text-red-500 text-xs mt-1">{formErrors.expectedDeliveryDate}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                    <select
                      name="priority"
                      value={formData.priority}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    >
                      {priorities.map(priority => (
                        <option key={priority} value={priority}>{priority}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Order Items</label>
                  {formData.items.map((item, index) => (
                    <div key={index} className="space-y-2 mb-4">
                      <div className="flex space-x-2">
                        <select
                          value={item.itemName}
                          onChange={(e) => handleItemChange(index, 'itemName', e.target.value)}
                          className={`flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 ${
                            formErrors[`itemName_${index}`] ? 'border-red-500' : 'border-gray-300'
                          }`}
                          required
                        >
                          <option value="">Select item</option>
                          {inventoryTypes.map(type => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </select>
                        <input
                          type="number"
                          placeholder="Quantity"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                          className={`w-24 px-3 py-2 border rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 ${
                            formErrors[`itemQuantity_${index}`] ? 'border-red-500' : 'border-gray-300'
                          }`}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="px-3 py-2 text-red-600 hover:text-red-900"
                        >
                          Remove
                        </button>
                      </div>
                      {(formErrors[`itemQuantity_${index}`] || formErrors[`itemName_${index}`]) && (
                        <div className="text-red-500 text-xs">
                          {formErrors[`itemName_${index}`] && <p>{formErrors[`itemName_${index}`]}</p>}
                          {formErrors[`itemQuantity_${index}`] && <p>{formErrors[`itemQuantity_${index}`]}</p>}
                        </div>
                      )}
                    </div>
                  ))}
                  {formErrors.items && <p className="text-red-500 text-xs mt-1">{formErrors.items}</p>}
                  <button
                    type="button"
                    onClick={addItem}
                    className="text-primary-600 hover:text-primary-700 text-sm"
                  >
                    + Add Item
                  </button>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                  >
                    Add Order
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

export default Orders;
