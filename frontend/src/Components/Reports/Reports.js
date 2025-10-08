import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../Context/AuthContext';
import UniversalNavbar from '../Nav/UniversalNavbar';
import Footer from '../Footer/Footer';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';
import axios from 'axios';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

function Reports() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [inventoryData, setInventoryData] = useState([]);
  const [orderStats, setOrderStats] = useState(null);
  const [monthlyData, setMonthlyData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Navigation guard - ensure only Factory Managers can access
  useEffect(() => {
    if (user && user.role !== 'Factory Manager') {
      console.error('Access denied: User does not have Factory Manager privileges');
      navigate('/login');
    }
  }, [user, navigate]);

  useEffect(() => {
    fetchReportData();
  }, []);

  // If user is not authenticated or doesn't have the right role, show loading
  if (!user || user.role !== 'Factory Manager') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const fetchReportData = async () => {
    try {
      const [inventoryResponse, orderStatsResponse, monthlyDataResponse] = await Promise.all([
        axios.get('http://localhost:5000/Inventory'),
        axios.get('http://localhost:5000/Orders/stats/overview'),
        axios.get('http://localhost:5000/Orders/monthly-data')
      ]);

      setInventoryData(inventoryResponse.data.inventory);
      setOrderStats(orderStatsResponse.data.stats);
      setMonthlyData(monthlyDataResponse.data.data);
    } catch (error) {
      console.error('Error fetching report data:', error);
      // Set default data if API fails
      setMonthlyData([
        { month: 'Jan', Production: 450, Recycling: 280, Orders: 320 },
        { month: 'Feb', Production: 380, Recycling: 220, Orders: 290 },
        { month: 'Mar', Production: 520, Recycling: 310, Orders: 410 },
        { month: 'Apr', Production: 680, Recycling: 420, Orders: 550 },
        { month: 'May', Production: 590, Recycling: 360, Orders: 480 },
        { month: 'Jun', Production: 720, Recycling: 480, Orders: 620 },
        { month: 'Jul', Production: 650, Recycling: 520, Orders: 580 },
        { month: 'Aug', Production: 780, Recycling: 580, Orders: 670 },
        { month: 'Sep', Production: 540, Recycling: 720, Orders: 460 },
        { month: 'Oct', Production: 820, Recycling: 580, Orders: 720 },
        { month: 'Nov', Production: 890, Recycling: 750, Orders: 780 },
        { month: 'Dec', Production: 750, Recycling: 680, Orders: 650 },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const generateInventoryPDF = () => {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(20);
    doc.text('RO Filter Factory - Inventory Report', 20, 20);
    
    doc.setFontSize(12);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 30);
    
    // Add table
    const tableData = inventoryData.map(item => [
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
    doc.text(`Total Items: ${inventoryData.length}`, 20, finalY + 10);
    doc.text(`Low Stock Items: ${inventoryData.filter(item => item.status === 'Low Stock').length}`, 20, finalY + 20);
    doc.text(`Out of Stock Items: ${inventoryData.filter(item => item.status === 'Out of Stock').length}`, 20, finalY + 30);
    
    doc.save(`inventory-report-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const generateOrdersPDF = () => {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(20);
    doc.text('RO Filter Factory - Orders Report', 20, 20);
    
    doc.setFontSize(12);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 30);
    
    // Add order statistics
    doc.setFontSize(14);
    doc.text('Order Statistics:', 20, 50);
    doc.setFontSize(12);
    doc.text(`Total Orders: ${orderStats?.totalOrders || 0}`, 20, 60);
    doc.text(`Pending Orders: ${orderStats?.pendingOrders || 0}`, 20, 70);
    doc.text(`Processing Orders: ${orderStats?.processingOrders || 0}`, 20, 80);
    doc.text(`Shipped Orders: ${orderStats?.shippedOrders || 0}`, 20, 90);
    doc.text(`Delivered Orders: ${orderStats?.deliveredOrders || 0}`, 20, 100);
    doc.text(`Urgent Orders: ${orderStats?.urgentOrders || 0}`, 20, 110);
    doc.text(`High Priority Orders: ${orderStats?.highPriorityOrders || 0}`, 20, 120);
    
    doc.save(`orders-report-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'In Stock': return 'text-success-600 bg-success-100';
      case 'Low Stock': return 'text-yellow-600 bg-yellow-100';
      case 'Out of Stock': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const COLORS = ['#0077B6', '#00B4D8', '#009688', '#FF6B6B', '#4ECDC4'];

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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600 mt-2">Comprehensive reports and analytics for factory operations</p>
        </div>

        {/* Production Chart */}
        <section className="bg-white rounded-lg shadow-md p-6 mb-8">
                      <h2 className="text-xl font-semibold text-gray-800 mb-4">Monthly Production and Orders</h2>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="Production" stroke="#0077B6" strokeWidth={3} />
              <Line type="monotone" dataKey="Recycling" stroke="#00B4D8" strokeWidth={3} />
              <Line type="monotone" dataKey="Orders" stroke="#009688" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </section>

        {/* Charts Section */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Inventory Distribution */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Inventory Distribution</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={inventoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, quantity }) => `${name}: ${quantity}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="quantity"
                >
                  {inventoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Order Statistics */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Order Statistics</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={[
                { name: 'Total', value: orderStats?.totalOrders || 0 },
                { name: 'Pending', value: orderStats?.pendingOrders || 0 },
                { name: 'Processing', value: orderStats?.processingOrders || 0 },
                { name: 'Shipped', value: orderStats?.shippedOrders || 0 },
                { name: 'Delivered', value: orderStats?.deliveredOrders || 0 }
              ]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#0077B6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Inventory Status Table */}
        <section className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-800">Current Inventory Status</h2>
            <button
              onClick={generateInventoryPDF}
              className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition-colors"
            >
              Download Inventory PDF
            </button>
          </div>
          
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
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {inventoryData.map((item) => (
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Order Statistics Summary */}
        <section className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-800">Order Statistics Summary</h2>
            <button
              onClick={generateOrdersPDF}
              className="bg-secondary-600 text-white px-4 py-2 rounded-md hover:bg-secondary-700 transition-colors"
            >
              Download Orders PDF
            </button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary-600">{orderStats?.totalOrders || 0}</div>
              <div className="text-sm text-gray-600">Total Orders</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-600">{orderStats?.pendingOrders || 0}</div>
              <div className="text-sm text-gray-600">Pending Orders</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{orderStats?.processingOrders || 0}</div>
              <div className="text-sm text-gray-600">Processing</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{orderStats?.deliveredOrders || 0}</div>
              <div className="text-sm text-gray-600">Delivered</div>
            </div>
          </div>
          
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{orderStats?.urgentOrders || 0}</div>
              <div className="text-sm text-gray-600">Urgent Orders</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{orderStats?.highPriorityOrders || 0}</div>
              <div className="text-sm text-gray-600">High Priority</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{orderStats?.shippedOrders || 0}</div>
              <div className="text-sm text-gray-600">Shipped</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">
                {orderStats ? Math.round((orderStats.deliveredOrders / orderStats.totalOrders) * 100) : 0}%
              </div>
              <div className="text-sm text-gray-600">Delivery Rate</div>
            </div>
          </div>
        </section>

        {/* Quick Actions */}
        <section className="flex flex-wrap gap-4 justify-center">
          <button 
            onClick={generateInventoryPDF}
            className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors font-medium"
          >
            Download Inventory Report
          </button>
          <button 
            onClick={generateOrdersPDF}
            className="bg-secondary-600 text-white px-6 py-3 rounded-lg hover:bg-secondary-700 transition-colors font-medium"
          >
            Download Orders Report
          </button>
          <button className="bg-success-600 text-white px-6 py-3 rounded-lg hover:bg-success-700 transition-colors font-medium">
            Export All Data
          </button>
        </section>
      </div>

      <Footer />
    </div>
  );
}

export default Reports;
