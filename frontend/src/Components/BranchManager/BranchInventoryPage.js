import React, { useState, useEffect } from 'react';
import axios from 'axios';

function BranchInventoryPage({ branchId, branchName, showNotification }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [formData, setFormData] = useState({
    name: '',
    quantity: '',
    unit: '',
    minStockLevel: '',
    maxStockLevel: ''
  });
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [requestingItems, setRequestingItems] = useState([]);

  const categories = [
    'RO Membranes',
    'Mud-filters', 
    'Mineral Cartridge',
    'UV Cartridge',
    'Water Pumps',
    '5L Water Bottles',
    '10L Water Bottles',
    '20L Water Bottles',
    'Other'
  ];

  const units = ['pcs', 'boxes', 'liters', 'kg', 'units'];

  useEffect(() => {
    if (branchId) {
      fetchProducts();
    }
  }, [branchId]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:5000/BranchInventory/branch/${branchId}`);
      setProducts(response.data.inventory || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      showNotification('Failed to fetch inventory', 'error');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Item name is required';
    if (!formData.quantity || formData.quantity < 0) errors.quantity = 'Valid quantity is required';
    if (!formData.unit) errors.unit = 'Unit is required';
    if (!formData.minStockLevel || formData.minStockLevel < 0) errors.minStockLevel = 'Valid minimum stock level is required';
    if (!formData.maxStockLevel || formData.maxStockLevel < formData.minStockLevel) errors.maxStockLevel = 'Maximum stock level must be greater than minimum';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };


  const handleEdit = (product) => {
    setSelectedProduct(product);
    setFormData({
      name: product.name,
      quantity: product.quantity.toString(),
      unit: product.unit,
      minStockLevel: product.minStockLevel.toString(),
      maxStockLevel: product.maxStockLevel.toString()
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const productData = {
        ...formData,
        branchId,
        branchName,
        quantity: parseInt(formData.quantity),
        minStockLevel: parseInt(formData.minStockLevel),
        maxStockLevel: parseInt(formData.maxStockLevel)
      };

      await axios.put(`http://localhost:5000/BranchInventory/${selectedProduct._id}`, productData);
      showNotification('Product updated successfully!', 'success');
      
      setShowEditModal(false);
      setSelectedProduct(null);
      setFormData({
        name: '',
        quantity: '',
        unit: '',
        minStockLevel: '',
        maxStockLevel: ''
      });
      setFormErrors({});
      fetchProducts();
    } catch (error) {
      console.error('Error updating product:', error);
      showNotification('Failed to update product. Please try again.', 'error');
    }
  };

  const handleDelete = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await axios.delete(`http://localhost:5000/BranchInventory/${productId}`);
        showNotification('Product deleted successfully!', 'success');
        fetchProducts();
      } catch (error) {
        console.error('Error deleting product:', error);
        showNotification('Failed to delete product. Please try again.', 'error');
      }
    }
  };

  const getStockStatus = (quantity, minStockLevel) => {
    if (quantity <= 0) return { status: 'Out of Stock', color: 'text-red-600', bgColor: 'bg-red-100' };
    if (quantity <= minStockLevel) return { status: 'Low Stock', color: 'text-orange-600', bgColor: 'bg-orange-100' };
    return { status: 'In Stock', color: 'text-green-600', bgColor: 'bg-green-100' };
  };

  const filteredProducts = products.filter(product => {
    const matchesCategory = filterCategory === 'all' || product.name === filterCategory;
    const matchesSearch = (product.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getInventoryStats = () => {
    const total = products.length;
    const inStock = products.filter(p => getStockStatus(p.quantity, p.minStockLevel).status === 'In Stock').length;
    const lowStock = products.filter(p => getStockStatus(p.quantity, p.minStockLevel).status === 'Low Stock').length;
    const outOfStock = products.filter(p => getStockStatus(p.quantity, p.minStockLevel).status === 'Out of Stock').length;
    const totalQuantity = products.reduce((sum, p) => sum + p.quantity, 0);
    return { total, inStock, lowStock, outOfStock, totalQuantity };
  };

  // Factory Request Functions
  const getLowStockItems = () => {
    return products.filter(product => {
      const stockStatus = getStockStatus(product.quantity, product.minStockLevel);
      return stockStatus.status === 'Low Stock' || stockStatus.status === 'Out of Stock';
    });
  };

  const handleRequestFromFactory = (item) => {
    setSelectedItems([item]);
    setShowRequestModal(true);
  };

  const handleBulkRequest = () => {
    const lowStockItems = getLowStockItems();
    setSelectedItems(lowStockItems);
    setShowRequestModal(true);
  };

  const handleSubmitRequest = async () => {
    try {
      // Validate required data
      if (!branchId || !branchName) {
        showNotification('Branch information is missing. Please refresh the page.', 'error');
        return;
      }

      if (!selectedItems || selectedItems.length === 0) {
        showNotification('No items selected for request.', 'error');
        return;
      }

      const token = localStorage.getItem('token');
      if (!token) {
        showNotification('Authentication token missing. Please log in again.', 'error');
        return;
      }

      setRequestingItems(selectedItems.map(item => item._id));
      
      const requestData = {
        branchId: branchId,
        branchName: branchName,
        items: selectedItems.map(item => ({
          name: item.name,
          currentQuantity: item.quantity,
          minStockLevel: item.minStockLevel,
          maxStockLevel: item.maxStockLevel,
          requestedQuantity: item.maxStockLevel - item.quantity,
          unit: item.unit
        })),
        status: 'pending',
        requestedAt: new Date().toISOString()
      };

      console.log('Submitting factory request:', requestData);
      console.log('Token:', token);
      console.log('Branch ID:', branchId);
      console.log('Branch Name:', branchName);

      const response = await axios.post('http://localhost:5000/FactoryRequests', requestData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Response:', response);

      if (response.status === 201) {
        showNotification('Request submitted successfully!', 'success');
        setShowRequestModal(false);
        setSelectedItems([]);
      }
    } catch (error) {
      console.error('Error submitting request:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      let errorMessage = 'Failed to submit request. Please try again.';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.status === 401) {
        errorMessage = 'Authentication failed. Please log in again.';
      } else if (error.response?.status === 403) {
        errorMessage = 'Access denied. Branch Manager role required.';
      }
      
      showNotification(errorMessage, 'error');
    } finally {
      setRequestingItems([]);
    }
  };

  const stats = getInventoryStats();

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
            <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
            <p className="text-gray-600">Manage branch inventory and stock levels</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => {
                fetchProducts();
                showNotification('Inventory refreshed!', 'success');
              }}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              🔄 Refresh
            </button>
            <button
              onClick={handleBulkRequest}
              disabled={getLowStockItems().length === 0}
              className={`px-4 py-2 rounded-lg transition-colors ${
                getLowStockItems().length === 0 
                  ? 'bg-gray-400 text-white cursor-not-allowed' 
                  : 'bg-orange-600 text-white hover:bg-orange-700'
              }`}
            >
              🏭 Request from Factory ({getLowStockItems().length})
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Items</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
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
              <p className="text-sm font-medium text-gray-600">In Stock</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.inStock}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Low Stock</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.lowStock}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-red-100 text-red-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Out of Stock</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.outOfStock}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 text-purple-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Quantity</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalQuantity.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex space-x-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Item</label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="all">All Items</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search Products</label>
            <input
              type="text"
              placeholder="Search by name or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm w-full md:w-64"
            />
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock Level
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status & Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProducts.map((product) => {
                const stockStatus = getStockStatus(product.quantity, product.minStockLevel);
                const stockPercentage = (product.quantity / product.maxStockLevel) * 100;
                
                return (
                  <tr key={product._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{product.name}</div>
                        <div className="text-sm text-gray-500">{product.branchName}</div>
                        <div className="text-xs text-gray-400">Last updated: {new Date(product.lastUpdated).toLocaleDateString()}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {product.quantity} {product.unit}
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                          <div 
                            className={`h-2 rounded-full ${
                              stockPercentage >= 60 ? 'bg-green-600' :
                              stockPercentage >= 30 ? 'bg-yellow-600' : 'bg-red-600'
                            }`}
                            style={{ width: `${Math.min(stockPercentage, 100)}%` }}
                          ></div>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Min: {product.minStockLevel} | Max: {product.maxStockLevel}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${stockStatus.bgColor} ${stockStatus.color}`}>
                        {stockStatus.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          Status: {stockStatus.status}
                        </div>
                        <div className="text-sm text-gray-500">Branch: {product.branchId}</div>
                        <div className="text-xs text-gray-400">Unit: {product.unit}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(product)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(product._id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                        {(stockStatus.status === 'Low Stock' || stockStatus.status === 'Out of Stock') && (
                          <button
                            onClick={() => handleRequestFromFactory(product)}
                            disabled={requestingItems.includes(product._id)}
                            className={`px-2 py-1 text-xs rounded ${
                              requestingItems.includes(product._id)
                                ? 'bg-gray-400 text-white cursor-not-allowed'
                                : 'bg-orange-600 text-white hover:bg-orange-700'
                            }`}
                          >
                            {requestingItems.includes(product._id) ? 'Requesting...' : 'Request'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-500">Try adjusting your search or filter criteria.</p>
          </div>
        )}
      </div>


      {/* Edit Product Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Edit Product</h3>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedProduct(null);
                    setFormData({
                      name: '',
                      quantity: '',
                      unit: '',
                      minStockLevel: '',
                      maxStockLevel: ''
                    });
                    setFormErrors({});
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <form onSubmit={handleEditSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Item Name</label>
                    <select
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    >
                      <option value="">Select Item</option>
                      {categories.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                    {formErrors.name && (
                      <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Quantity</label>
                    <input
                      type="number"
                      value={formData.quantity}
                      onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                    {formErrors.quantity && (
                      <p className="text-red-500 text-xs mt-1">{formErrors.quantity}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Unit</label>
                    <select
                      value={formData.unit}
                      onChange={(e) => setFormData({...formData, unit: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    >
                      <option value="">Select Unit</option>
                      {units.map(unit => (
                        <option key={unit} value={unit}>{unit}</option>
                      ))}
                    </select>
                    {formErrors.unit && (
                      <p className="text-red-500 text-xs mt-1">{formErrors.unit}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Min Stock Level</label>
                    <input
                      type="number"
                      value={formData.minStockLevel}
                      onChange={(e) => setFormData({...formData, minStockLevel: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                    {formErrors.minStockLevel && (
                      <p className="text-red-500 text-xs mt-1">{formErrors.minStockLevel}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Max Stock Level</label>
                    <input
                      type="number"
                      value={formData.maxStockLevel}
                      onChange={(e) => setFormData({...formData, maxStockLevel: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                    {formErrors.maxStockLevel && (
                      <p className="text-red-500 text-xs mt-1">{formErrors.maxStockLevel}</p>
                    )}
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setSelectedProduct(null);
                      setFormData({
                        name: '',
                        quantity: '',
                        unit: '',
                        minStockLevel: '',
                        maxStockLevel: ''
                      });
                      setFormErrors({});
                    }}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Update Product
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Factory Request Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Request from Factory
              </h3>
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  You are requesting the following items from the factory:
                </p>
                <ul className="text-sm text-gray-800">
                  {selectedItems.map((item, index) => (
                    <li key={index} className="mb-1">
                      • {item.name}: {item.maxStockLevel - item.quantity} {item.unit}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowRequestModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitRequest}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Submit Request
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default BranchInventoryPage;
