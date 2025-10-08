import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { useAuth } from '../../Context/AuthContext';
import { useNavigate } from 'react-router-dom';
import AddProductForm from '../FactoryManager/AddProductForm';

function Inventory() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // All hooks must be called at the top level, before any conditional returns
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshMessage, setRefreshMessage] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  // Navigation guard - ensure only Factory Managers can access
  useEffect(() => {
    if (user && user.role !== 'Factory Manager') {
      console.error('Access denied: User does not have Factory Manager privileges');
      navigate('/login');
    }
  }, [user, navigate]);

  // Fetch inventory data on component mount
  useEffect(() => {
    fetchInventory();
  }, []);

  // Listen for inventory update events from other components
  useEffect(() => {
    const handleInventoryUpdate = (event) => {
      console.log('🔄 Inventory update event received, refreshing inventory...', event.detail);
      setRefreshMessage('Auto-refreshing inventory...');
      setRefreshing(true);
      fetchInventory();
    };

    // Listen for custom inventory update events
    window.addEventListener('inventoryUpdated', handleInventoryUpdate);
    
    // Cleanup event listener on component unmount
    return () => {
      window.removeEventListener('inventoryUpdated', handleInventoryUpdate);
    };
  }, []);

  // If user is not authenticated or doesn't have the right role, show loading
  if (!user || user.role !== 'Factory Manager') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }


  const fetchInventory = async () => {
    try {
      console.log('🔄 Fetching inventory data...');
      setRefreshing(true);
      const response = await axios.get('http://localhost:5000/Inventory');
      console.log('📦 Inventory data received:', response.data);
      setInventory(response.data.inventory);
      console.log('✅ Inventory updated successfully');
      setRefreshMessage('Inventory refreshed successfully!');
      setTimeout(() => setRefreshMessage(''), 3000);
    } catch (error) {
      console.error('❌ Error fetching inventory:', error);
      setRefreshMessage('Failed to refresh inventory');
      setTimeout(() => setRefreshMessage(''), 3000);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Manual refresh function for the button
  const handleManualRefresh = () => {
    console.log('🔄 Manual refresh button clicked');
    setRefreshMessage('Refreshing inventory...');
        fetchInventory();
  };




  const handleDeleteItem = async (id) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await axios.delete(`http://localhost:5000/Inventory/${id}`);
        fetchInventory();
      } catch (error) {
        console.error('Error deleting item:', error);
        alert('Error deleting item. Please try again.');
      }
    }
  };

  const handleStockUpdate = async (id, operation, quantity) => {
    try {
      await axios.post(`http://localhost:5000/Inventory/${id}/stock`, {
        quantity: parseInt(quantity),
        operation
      });
      fetchInventory();
    } catch (error) {
      console.error('Error updating stock:', error);
      alert('Error updating stock. Please try again.');
    }
  };

  const handleProductAdded = (newProduct) => {
    console.log('✅ New product added:', newProduct);
    // Refresh inventory to show the new product
    fetchInventory();
    // Close the form
    setShowAddForm(false);
  };


  const generatePDF = () => {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(20);
    doc.text('RO Filter Factory - Inventory Report', 20, 20);
    
    doc.setFontSize(12);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 30);
    
    // Add table
    const tableData = inventory.map(item => [
      item.name,
      item.quantity.toString(),
      item.unit,
      item.status,
      new Date(item.lastUpdated).toLocaleDateString()
    ]);
    
    doc.autoTable({
      head: [['Item Name', 'Quantity', 'Unit', 'Status', 'Last Updated']],
      body: tableData,
      startY: 40,
      styles: {
        fontSize: 10,
        cellPadding: 5
      },
      headStyles: {
        fillColor: [0, 119, 182],
        textColor: 255
      }
    });
    
    // Add summary
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(14);
    doc.text('Summary:', 20, finalY);
    doc.setFontSize(12);
    doc.text(`Total Items: ${inventory.length}`, 20, finalY + 10);
    doc.text(`Low Stock Items: ${inventory.filter(item => item.status === 'Low Stock').length}`, 20, finalY + 20);
    doc.text(`Out of Stock Items: ${inventory.filter(item => item.status === 'Out of Stock').length}`, 20, finalY + 30);
    
    doc.save(`inventory-report-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'In Stock': return 'text-success-600 bg-success-100';
      case 'Low Stock': return 'text-yellow-600 bg-yellow-100';
      case 'Out of Stock': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/factory-manager')}
            className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 transition-colors duration-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="font-medium">Back to Factory Manager</span>
          </button>
        </div>

        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <div className="flex items-center space-x-3">
            <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
              {refreshing && (
                <div className="flex items-center space-x-2 text-blue-600">
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="text-sm font-medium">Refreshing...</span>
                </div>
              )}
            </div>
            <p className="text-gray-600 mt-2">Manage raw materials and track stock levels</p>
          </div>
          <div className="flex space-x-4">
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors flex items-center space-x-2"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>Add New Product</span>
            </button>
            <button
              onClick={handleManualRefresh}
              disabled={refreshing}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <svg className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Refresh</span>
            </button>
            <button
              onClick={generatePDF}
              className="bg-secondary-600 text-white px-4 py-2 rounded-md hover:bg-secondary-700 transition-colors"
            >
              Download PDF
            </button>
          </div>
        </div>

        {/* Refresh Status Message */}
        {refreshMessage && (
          <div className={`mb-4 p-3 rounded-md ${
            refreshMessage.includes('successfully') 
              ? 'bg-green-100 text-green-800 border border-green-200' 
              : refreshMessage.includes('Failed')
              ? 'bg-red-100 text-red-800 border border-red-200'
              : 'bg-blue-100 text-blue-800 border border-blue-200'
          }`}>
            <div className="flex items-center">
              {refreshMessage.includes('successfully') ? (
                <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : refreshMessage.includes('Failed') ? (
                <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="animate-spin h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              <span className="font-medium">{refreshMessage}</span>
            </div>
          </div>
        )}

        {/* Inventory Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Item Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock Levels
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Updated
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {inventory.map((item) => (
                  <tr key={item._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{item.name}</div>
                      {item.supplier && (
                        <div className="text-sm text-gray-500">Supplier: {item.supplier}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{item.quantity} {item.unit}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(item.status)}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        Min: {item.minStockLevel} | Max: {item.maxStockLevel}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(item.lastUpdated).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleDeleteItem(item._id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                        <button
                          onClick={() => {
                            const quantity = prompt('Enter quantity to add:');
                            if (quantity) handleStockUpdate(item._id, 'add', quantity);
                          }}
                          className="text-green-600 hover:text-green-900"
                        >
                          Add Stock
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add Product Modal */}
        {showAddForm && (
          <AddProductForm
            onProductAdded={handleProductAdded}
            onClose={() => setShowAddForm(false)}
          />
        )}
      </div>
    </div>
  );
}

export default Inventory;
