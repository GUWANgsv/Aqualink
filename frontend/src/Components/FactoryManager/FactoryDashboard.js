import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../Context/AuthContext';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import axios from 'axios';
import { generateFactoryOrdersReportPDF, generateFactoryInventoryReportPDF } from '../../utils/adminPdfGenerator';

const FactoryDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  
  // Check if user has factory manager role
  useEffect(() => {
    if (user && user.role !== 'Factory Manager') {
      console.error('User does not have factory manager privileges:', user.role);
      alert('Access denied. Factory Manager privileges required.');
      window.location.href = '/login';
    }
  }, [user]);
  
  const [inventoryStats, setInventoryStats] = useState(null);
  const [inventoryData, setInventoryData] = useState([]);
  const [pendingOrders, setPendingOrders] = useState([]);
  const [orderStats, setOrderStats] = useState(null);
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recyclingRequests, setRecyclingRequests] = useState([]);
  const [recyclingBins, setRecyclingBins] = useState([]);
  const [allRecyclingBins, setAllRecyclingBins] = useState([]);
  const [recyclingStats, setRecyclingStats] = useState(null);
  const [factoryWasteBin, setFactoryWasteBin] = useState(null);
  const [factoryBinStats, setFactoryBinStats] = useState(null);
  const [monthlyData, setMonthlyData] = useState([]);
  const [factoryRequests, setFactoryRequests] = useState([]);
  const [collectionRequests, setCollectionRequests] = useState([]);
  const [monthlyComparisonData, setMonthlyComparisonData] = useState([]);
  const [comparisonSummary, setComparisonSummary] = useState(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // PDF Download function for Orders
  const handleDownloadPDF = async () => {
    try {
      await generateFactoryOrdersReportPDF(factoryRequests, collectionRequests);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF report. Please try again.');
    }
  };


  // Creative logout function
  const handleCreativeLogout = () => {
    // Add some visual feedback before logout
    const confirmLogout = window.confirm('🏭 Are you sure you want to leave the Factory Command Center?');
    if (confirmLogout) {
      // Add a small delay for visual effect
      setTimeout(() => {
        logout('/login');
        navigate('/login');
      }, 500);
    }
  };

  // Fetch monthly comparison data
  const fetchMonthlyComparisonData = async (year) => {
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };
      
      const response = await axios.get(`http://localhost:5000/Orders/monthly-comparison?year=${year}`, { headers });
      
      if (response.data.success) {
        setMonthlyComparisonData(response.data.monthlyData || []);
        setComparisonSummary(response.data.summary || null);
        console.log('✅ Monthly comparison data updated for year:', year);
      }
    } catch (error) {
      console.error('❌ Error fetching monthly comparison data:', error);
      setMonthlyComparisonData([]);
      setComparisonSummary(null);
    }
  };

  // Handle year change for monthly comparison
  const handleYearChange = (newYear) => {
    setSelectedYear(newYear);
    fetchMonthlyComparisonData(newYear);
  };

  // Refresh data function
  const handleRefreshData = async () => {
    try {
      setLoading(true);
      console.log('🔄 Refreshing factory dashboard data...');
      
      // Re-fetch all data
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };

      const [
        inventoryResponse,
        ordersResponse,
        recyclingResponse,
        factoryRequestsResponse
      ] = await Promise.allSettled([
        axios.get('http://localhost:5000/Inventory', { headers }),
        axios.get('http://localhost:5000/Orders', { headers }),
        axios.get('http://localhost:5000/RecyclingRequests', { headers }),
        axios.get('http://localhost:5000/FactoryRequests', { headers })
      ]);

      // Process responses (same logic as in useEffect)
      if (inventoryResponse.status === 'fulfilled') {
        const inventory = inventoryResponse.value.data;
        setInventoryStats({
          totalItems: inventory.length,
          totalQuantity: inventory.reduce((sum, item) => sum + item.quantity, 0),
          lowStockItems: inventory.filter(item => item.quantity < item.minStockLevel).length
        });
        setInventoryData(inventory.map(item => ({
          name: item.name,
          value: item.quantity,
          color: COLORS[Math.floor(Math.random() * COLORS.length)]
        })));
      }

      if (ordersResponse.status === 'fulfilled') {
        const orders = ordersResponse.value.data;
        setPendingOrders(orders.filter(order => order.status === 'Pending'));
        setOrderStats({
          totalOrders: orders.length,
          pendingOrders: orders.filter(order => order.status === 'Pending').length,
          urgentOrders: orders.filter(order => order.priority === 'High').length
        });
      }

      if (recyclingResponse.status === 'fulfilled') {
        const requests = recyclingResponse.value.data;
        setRecyclingRequests(requests);
        setRecyclingStats({
          totalRequests: requests.length,
          pendingRequests: requests.filter(req => req.status === 'Pending').length,
          completedRequests: requests.filter(req => req.status === 'Completed').length
        });
      }

      if (factoryRequestsResponse.status === 'fulfilled') {
        const requests = factoryRequestsResponse.value.data.requests || factoryRequestsResponse.value.data || [];
        setFactoryRequests(Array.isArray(requests) ? requests : []);
      }

      console.log('✅ Data refreshed successfully');
      alert('🔄 Dashboard data refreshed successfully!');
    } catch (error) {
      console.error('❌ Error refreshing data:', error);
      alert('❌ Failed to refresh data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Refresh inventory data specifically after stock movements
  const refreshInventoryData = async () => {
    try {
      console.log('🔄 Refreshing inventory data after stock movement...');
      
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };
      
      // Fetch updated inventory stats and data
      const [statsResponse, inventoryResponse] = await Promise.allSettled([
        axios.get('http://localhost:5000/Inventory/stats/overview', { headers }),
        axios.get('http://localhost:5000/Inventory', { headers })
      ]);

      // Update inventory stats
      if (statsResponse.status === 'fulfilled') {
        setInventoryStats(statsResponse.value.data.stats);
        console.log('✅ Inventory stats updated:', statsResponse.value.data.stats);
      } else {
        console.error('Error fetching updated inventory stats:', statsResponse.reason);
      }

      // Update inventory data
      if (inventoryResponse.status === 'fulfilled') {
        const inventory = inventoryResponse.value.data.inventory || inventoryResponse.value.data;
        setInventoryData(inventory);
        console.log('✅ Inventory data updated');
      } else {
        console.error('Error fetching updated inventory data:', inventoryResponse.reason);
      }
    } catch (error) {
      console.error('❌ Error refreshing inventory data:', error);
    }
  };



  // Listen for inventory update events
  useEffect(() => {
    const handleInventoryUpdate = () => {
      console.log('🔄 Factory Dashboard: Inventory update event received, refreshing data...');
      handleRefreshData();
    };

    // Listen for custom inventory update events
    window.addEventListener('inventoryUpdated', handleInventoryUpdate);
    
    // Cleanup event listener on component unmount
    return () => {
      window.removeEventListener('inventoryUpdated', handleInventoryUpdate);
    };
  }, []);

  // Fetch data from API
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        console.log('🔄 Fetching factory dashboard data...');
        
        // Fetch all data in parallel with authentication
        const token = localStorage.getItem('token');
        const headers = { 'Authorization': `Bearer ${token}` };
        
        const [statsResponse, inventoryResponse, ordersResponse, orderStatsResponse, activitiesResponse, recyclingResponse, binsResponse, allBinsResponse, recyclingStatsResponse, monthlyDataResponse, factoryRequestsResponse, collectionRequestsResponse, factoryBinResponse, monthlyComparisonResponse] = await Promise.allSettled([
          axios.get('http://localhost:5000/Inventory/stats/overview', { headers }),
          axios.get('http://localhost:5000/Inventory', { headers }),
          axios.get('http://localhost:5000/Orders/pending', { headers }),
          axios.get('http://localhost:5000/Orders/stats/overview', { headers }),
          axios.get('http://localhost:5000/Orders/activities/recent', { headers }),
          axios.get('http://localhost:5000/RecyclingRequests/pending', { headers }),
          axios.get('http://localhost:5000/RecyclingBins/factory-notification', { headers }),
          axios.get('http://localhost:5000/RecyclingBins', { headers }),
          axios.get('http://localhost:5000/RecyclingRequests/statistics', { headers }),
          axios.get('http://localhost:5000/Orders/monthly-data', { headers }),
          axios.get('http://localhost:5000/FactoryRequests', { headers }),
          axios.get('http://localhost:5000/RecyclingRequests/collection/pending', { headers }),
          axios.get('http://localhost:5000/FactoryWasteBin', { headers }),
          axios.get(`http://localhost:5000/Orders/monthly-comparison?year=${selectedYear}`, { headers })
        ]);

        // Set inventory stats
        if (statsResponse.status === 'fulfilled') {
          setInventoryStats(statsResponse.value.data.stats);
        } else {
          console.error('Error fetching inventory stats:', statsResponse.reason);
          setInventoryStats({
            totalItems: 8,
            lowStockItems: 2,
            outOfStockItems: 1,
            inStockItems: 5,
            totalQuantity: 450
          });
        }

        // Set inventory data
        if (inventoryResponse.status === 'fulfilled') {
          setInventoryData(inventoryResponse.value.data.inventory || []);
        } else {
          console.error('Error fetching inventory data:', inventoryResponse.reason);
          setInventoryData([]);
        }

        // Set pending orders
        if (ordersResponse.status === 'fulfilled') {
          setPendingOrders(ordersResponse.value.data.orders || []);
        } else {
          console.error('Error fetching pending orders:', ordersResponse.reason);
          setPendingOrders([]);
        }

        // Set order stats
        if (orderStatsResponse.status === 'fulfilled') {
          setOrderStats(orderStatsResponse.value.data.stats);
        } else {
          console.error('Error fetching order stats:', orderStatsResponse.reason);
          setOrderStats({
            totalOrders: 0,
            pendingOrders: 0,
            processingOrders: 0,
            urgentOrders: 0,
            highPriorityOrders: 0
          });
        }

        // Set recent activities
        if (activitiesResponse.status === 'fulfilled') {
          setRecentActivities(activitiesResponse.value.data.activities || []);
        } else {
          console.error('Error fetching recent activities:', activitiesResponse.reason);
          setRecentActivities([]);
        }


        // Set recycling requests
        if (recyclingResponse.status === 'fulfilled') {
          setRecyclingRequests(recyclingResponse.value.data.requests || []);
        } else {
          console.error('Error fetching recycling requests:', recyclingResponse.reason);
          setRecyclingRequests([]);
        }

        // Set recycling bins
        if (binsResponse.status === 'fulfilled') {
          setRecyclingBins(binsResponse.value.data.binsForNotification || []);
        } else {
          console.error('Error fetching recycling bins:', binsResponse.reason);
          setRecyclingBins([]);
        }

        // Set all recycling bins
      if (allBinsResponse.status === 'fulfilled') {
        const bins = allBinsResponse.value.data.bins || [];
        console.log('📊 All recycling bins data:', bins);
        setAllRecyclingBins(bins);
      } else {
        console.error('❌ Error fetching all recycling bins:', allBinsResponse.reason);
        console.error('❌ Response details:', allBinsResponse.reason?.response?.data);
        setAllRecyclingBins([]);
      }

        // Set recycling stats
        if (recyclingStatsResponse.status === 'fulfilled') {
          const stats = recyclingStatsResponse.value.data.statistics;
          console.log('📊 Recycling statistics data:', stats);
          // Use completion rate from backend
          setRecyclingStats(stats);
        } else {
          console.error('Error fetching recycling stats:', recyclingStatsResponse.reason);
          setRecyclingStats({
            totalRequests: 0,
            pendingRequests: 0,
            approvedRequests: 0,
            completedRequests: 0,
            rejectedRequests: 0,
            totalWeight: 0,
            totalPoints: 0,
            completionRate: 0
          });
        }

        // Set monthly data for charts
        if (monthlyDataResponse.status === 'fulfilled') {
          const data = monthlyDataResponse.value.data.monthlyData || [];
          console.log('📊 Received monthly data:', data);
          setMonthlyData(data);
        } else {
          console.error('Error fetching monthly data:', monthlyDataResponse.reason);
          // Fallback to mock data if API fails
          setMonthlyData([
            { month: 'Jan', production: 1200, recycling: 850, efficiency: 70.8 },
            { month: 'Feb', production: 1350, recycling: 920, efficiency: 68.1 },
            { month: 'Mar', production: 1100, recycling: 780, efficiency: 70.9 },
            { month: 'Apr', production: 1450, recycling: 1050, efficiency: 72.4 },
            { month: 'May', production: 1600, recycling: 1150, efficiency: 71.9 },
            { month: 'Jun', production: 1400, recycling: 980, efficiency: 70.0 },
            { month: 'Jul', production: 1300, recycling: 890, efficiency: 68.5 },
            { month: 'Aug', production: 1550, recycling: 1120, efficiency: 72.3 },
            { month: 'Sep', production: 1700, recycling: 1250, efficiency: 73.5 },
            { month: 'Oct', production: 1650, recycling: 1180, efficiency: 71.5 },
            { month: 'Nov', production: 1500, recycling: 1080, efficiency: 72.0 },
            { month: 'Dec', production: 1800, recycling: 1350, efficiency: 75.0 }
          ]);
        }

        // Set factory requests
        if (factoryRequestsResponse.status === 'fulfilled') {
          console.log('Factory requests response:', factoryRequestsResponse.value.data);
          const requests = factoryRequestsResponse.value.data.requests || factoryRequestsResponse.value.data || [];
          console.log('Setting factory requests:', requests);
          setFactoryRequests(Array.isArray(requests) ? requests : []);
        } else {
          console.error('❌ Failed to fetch factory requests:', factoryRequestsResponse.reason);
          setFactoryRequests([]);
        }

        // Set collection requests
        if (collectionRequestsResponse.status === 'fulfilled') {
          const requests = collectionRequestsResponse.value.data.requests || collectionRequestsResponse.value.data || [];
          setCollectionRequests(Array.isArray(requests) ? requests : []);
        } else {
          console.error('Failed to fetch collection requests:', collectionRequestsResponse.reason);
          setCollectionRequests([]);
        }

        // Set factory waste bin
        if (factoryBinResponse.status === 'fulfilled') {
          console.log('✅ Factory waste bin data:', factoryBinResponse.value.data);
          setFactoryWasteBin(factoryBinResponse.value.data.bin);
          setFactoryBinStats(factoryBinResponse.value.data.statistics);
        } else {
          console.error('❌ Error fetching factory waste bin:', factoryBinResponse.reason);
          console.error('❌ Response details:', factoryBinResponse.reason?.response?.data);
          setFactoryWasteBin(null);
          setFactoryBinStats(null);
        }

        // Set monthly comparison data
        if (monthlyComparisonResponse.status === 'fulfilled') {
          console.log('✅ Monthly comparison data:', monthlyComparisonResponse.value.data);
          setMonthlyComparisonData(monthlyComparisonResponse.value.data.monthlyData || []);
          setComparisonSummary(monthlyComparisonResponse.value.data.summary || null);
        } else {
          console.error('❌ Error fetching monthly comparison data:', monthlyComparisonResponse.reason);
          setMonthlyComparisonData([]);
          setComparisonSummary(null);
        }

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Fetch monthly comparison data when selectedYear changes
  useEffect(() => {
    if (selectedYear) {
      fetchMonthlyComparisonData(selectedYear);
    }
  }, [selectedYear]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'In Stock': return 'text-green-600 bg-green-100';
      case 'Low Stock': return 'text-yellow-600 bg-yellow-100';
      case 'Out of Stock': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getRequestStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'approved': return 'text-green-600 bg-green-100';
      case 'rejected': return 'text-red-600 bg-red-100';
      case 'fulfilled': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Factory Request Functions
  const handleApproveRequest = async (requestId) => {
    try {
      console.log('Approving request:', requestId);
      console.log('Token:', localStorage.getItem('token'));
      
      const response = await axios.put(`http://localhost:5000/FactoryRequests/${requestId}/approve`, {}, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Approval response:', response);

      if (response.status === 200) {
        // Refresh the factory requests data
        const updatedRequests = factoryRequests.map(request => 
          request._id === requestId ? { ...request, status: 'fulfilled', approvedAt: new Date(), fulfilledAt: new Date() } : request
        );
        setFactoryRequests(updatedRequests);
        
        // Immediately refresh inventory data to show updated stocks
        await refreshInventoryData();
        
        alert('Request approved and inventory transferred successfully! Stock levels updated.');
      }
    } catch (error) {
      console.error('Error approving request:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      let errorMessage = 'Failed to approve request. Please try again.';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.status === 401) {
        errorMessage = 'Authentication failed. Please log in again.';
      } else if (error.response?.status === 403) {
        errorMessage = 'Access denied. Factory Manager role required.';
      } else if (error.response?.status === 400) {
        errorMessage = error.response.data.message || 'Invalid request data.';
      }
      
      alert(errorMessage);
    }
  };

  const handleRejectRequest = async (requestId, reason) => {
    try {
      const response = await axios.put(`http://localhost:5000/FactoryRequests/${requestId}/reject`, {
        rejectionReason: reason
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 200) {
        // Refresh the factory requests data
        const updatedRequests = factoryRequests.map(request => 
          request._id === requestId ? { ...request, status: 'rejected', rejectedAt: new Date(), rejectionReason: reason } : request
        );
        setFactoryRequests(updatedRequests);
        alert('Request rejected successfully!');
      }
    } catch (error) {
      console.error('Error rejecting request:', error);
      alert('Failed to reject request. Please try again.');
    }
  };

  const handleFulfillRequest = async (requestId) => {
    try {
      const response = await axios.put(`http://localhost:5000/FactoryRequests/${requestId}/fulfill`, {}, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 200) {
        // Refresh the factory requests data
        const updatedRequests = factoryRequests.map(request => 
          request._id === requestId ? { ...request, status: 'fulfilled', fulfilledAt: new Date() } : request
        );
        setFactoryRequests(updatedRequests);
        alert('Request fulfilled successfully!');
      }
    } catch (error) {
      console.error('Error fulfilling request:', error);
      alert('Failed to fulfill request. Please try again.');
    }
  };

  // Collection Request Functions
  const handleApproveCollectionRequest = async (requestId) => {
    try {
      console.log('Approving collection request:', requestId);
      
            const response = await axios.put(`http://localhost:5000/RecyclingRequests/collection/${requestId}/approve`, {
        approvedBy: user._id,
        notes: 'Approved by factory manager'
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 200) {
        // Refresh the collection requests data
        const updatedRequests = collectionRequests.map(request => 
          request._id === requestId ? { ...request, status: 'Approved', approvedDate: new Date() } : request
        );
        setCollectionRequests(updatedRequests);
        
        // Refresh recycling bins data to show updated status
        await refreshRecyclingData();
        
        alert('Collection request approved and bin emptied successfully!');
      }
    } catch (error) {
      console.error('Error approving collection request:', error);
      alert('Failed to approve collection request. Please try again.');
    }
  };

  const handleRejectCollectionRequest = async (requestId) => {
    try {
      const reason = prompt('Please provide a reason for rejection:');
      if (!reason) return;
      
            const response = await axios.put(`http://localhost:5000/RecyclingRequests/collection/${requestId}/reject`, {
        rejectedBy: user._id,
        notes: reason
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 200) {
        alert('Collection request rejected successfully!');
        
        // Refresh recycling data to update statistics
        await refreshRecyclingData();
      }
    } catch (error) {
      console.error('Error rejecting collection request:', error);
      alert('Failed to reject collection request. Please try again.');
    }
  };

  // Refresh recycling data function
  const refreshRecyclingData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };
      
      console.log('🔄 Refreshing recycling data with headers:', headers);
      console.log('👤 Current user:', user);
      
      // Test debug routes first
      try {
        console.log('🧪 Testing debug routes...');
        const testFactoryResponse = await axios.get('http://localhost:5000/test-factory-waste-bin');
        console.log('✅ Factory waste bin test route:', testFactoryResponse.data);
        
        const testRecyclingResponse = await axios.get('http://localhost:5000/test-recycling-bins');
        console.log('✅ Recycling bins test route:', testRecyclingResponse.data);
      } catch (error) {
        console.error('❌ Debug route test failed:', error);
      }
      
      const [recyclingResponse, binsResponse, allBinsResponse, collectionResponse, statsResponse, factoryBinResponse] = await Promise.allSettled([
        axios.get('http://localhost:5000/RecyclingRequests/pending', { headers }),
        axios.get('http://localhost:5000/RecyclingBins/factory-notification', { headers }),
        axios.get('http://localhost:5000/RecyclingBins', { headers }),
        axios.get('http://localhost:5000/RecyclingRequests/collection/pending', { headers }),
        axios.get('http://localhost:5000/RecyclingRequests/statistics', { headers }),
        axios.get('http://localhost:5000/FactoryWasteBin', { headers })
      ]);

      if (recyclingResponse.status === 'fulfilled') {
        setRecyclingRequests(recyclingResponse.value.data.requests || []);
      }
      if (binsResponse.status === 'fulfilled') {
        setRecyclingBins(binsResponse.value.data.binsForNotification || []);
      }
      if (allBinsResponse.status === 'fulfilled') {
        setAllRecyclingBins(allBinsResponse.value.data.bins || []);
      }
      if (collectionResponse.status === 'fulfilled') {
        const requests = collectionResponse.value.data.requests || collectionResponse.value.data || [];
        setCollectionRequests(Array.isArray(requests) ? requests : []);
      } else {
        console.error('Failed to refresh collection requests:', collectionResponse.reason);
      }
      if (statsResponse.status === 'fulfilled') {
        const stats = statsResponse.value.data.statistics;
        console.log('📊 Refreshed recycling statistics:', stats);
        // Use completion rate from backend
        setRecyclingStats(stats);
      } else {
        console.error('Failed to refresh recycling statistics:', statsResponse.reason);
        // Set default values if API call fails
        setRecyclingStats({
          totalRequests: 0,
          pendingRequests: 0,
          approvedRequests: 0,
          completedRequests: 0,
          rejectedRequests: 0,
          totalWeight: 0,
          totalPoints: 0,
          completionRate: 0
        });
      }
      if (factoryBinResponse.status === 'fulfilled') {
        console.log('✅ Refreshed factory waste bin data:', factoryBinResponse.value.data);
        setFactoryWasteBin(factoryBinResponse.value.data.bin);
        setFactoryBinStats(factoryBinResponse.value.data.statistics);
      } else {
        console.error('❌ Failed to refresh factory waste bin:', factoryBinResponse.reason);
        console.error('❌ Response details:', factoryBinResponse.reason?.response?.data);
      }
    } catch (error) {
      console.error('❌ Error refreshing recycling data:', error);
      alert('⚠️ Some data could not be refreshed. Please check your connection and try again.');
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

  const getActivityColor = (type, status) => {
    if (type === 'inventory') {
      if (status === 'critical') return 'text-red-500';
      if (status === 'warning') return 'text-yellow-500';
    }
    return 'text-blue-500';
  };

  const COLORS = ['#0077B6', '#00B4D8', '#009688', '#FF6B6B', '#4ECDC4', '#FFD93D', '#6BCF7F', '#4D96FF'];

  const tabs = [
    { id: 'overview', name: 'Overview', icon: '📊', description: 'Dashboard overview and key metrics' },
    { id: 'orders', name: 'Orders Management', icon: '📋', description: 'Manage factory orders and production' },
    { id: 'inventory', name: 'Inventory Control', icon: '📦', description: 'Monitor and control inventory levels' },
    { id: 'recycling', name: 'Recycling Center', icon: '🌱', description: 'Manage recycling operations' },
    { id: 'reports', name: 'Analytics & Reports', icon: '📈', description: 'View detailed reports and analytics' },
    { id: 'settings', name: 'Factory Settings', icon: '⚙️', description: 'Configure factory settings and preferences' }
  ];

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Overview</h2>
        <p className="text-gray-600">Monitor factory operations and key metrics</p>
      </div>
      
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500 flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center flex-1 min-w-0">
              <div className="p-3 rounded-full bg-blue-100 flex-shrink-0">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div className="ml-4 flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-600 truncate">Total Inventory Items</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {loading ? '...' : inventoryStats?.totalItems || 0} Items
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500 flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center flex-1 min-w-0">
              <div className="p-3 rounded-full bg-green-100 flex-shrink-0">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4 flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-600 truncate">Approved Requests</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {loading ? '...' : (Array.isArray(factoryRequests) ? factoryRequests.filter(req => req.status === 'approved').length : 0)} Requests
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500 flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center flex-1 min-w-0">
              <div className="p-3 rounded-full bg-blue-100 flex-shrink-0">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="ml-4 flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-600 truncate">Fulfilled Requests</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {loading ? '...' : (Array.isArray(factoryRequests) ? factoryRequests.filter(req => req.status === 'fulfilled').length : 0)} Requests
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500 flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center flex-1 min-w-0">
              <div className="p-3 rounded-full bg-purple-100 flex-shrink-0">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="ml-4 flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-600 truncate">Factory Requests</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {loading ? '...' : (Array.isArray(factoryRequests) ? factoryRequests.filter(req => req.status === 'pending').length : 0)} Pending
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>


      {/* Inventory Distribution Chart */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Inventory Distribution</h3>
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

      {/* Recent Activities */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Activities</h3>
        <div className="space-y-4">
          {recentActivities.length > 0 ? (
            recentActivities.map((activity, index) => (
              <div key={index} className="flex items-center space-x-3">
                <div className={`w-2 h-2 rounded-full ${getActivityColor(activity.type, activity.status) === 'text-red-500' ? 'bg-red-500' : 
                  getActivityColor(activity.type, activity.status) === 'text-yellow-500' ? 'bg-yellow-500' : 'bg-blue-500'}`}></div>
                <span className="text-gray-700">{activity.message}</span>
                <span className="text-sm text-gray-500 ml-auto">
                  {new Date(activity.timestamp).toLocaleDateString()}
                </span>
              </div>
            ))
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-500">No recent activities</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderOrdersTab = () => (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Orders Management</h2>
            <p className="text-gray-600">Manage and track orders from branches</p>
          </div>
          <button
            onClick={handleDownloadPDF}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors duration-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Download PDF</span>
          </button>
        </div>
      </div>
      

      {/* Factory Requests Section */}
      <div className="mt-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Factory Requests from Branches</h3>
          <span className="text-sm text-gray-500">
            {Array.isArray(factoryRequests) ? factoryRequests.filter(req => req.status === 'pending').length : 0} pending requests
          </span>
        </div>
        
        {Array.isArray(factoryRequests) && factoryRequests.length > 0 ? (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Request ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Branch
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Items Requested
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Requested Date
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
                  {factoryRequests.map((request) => (
                    <tr key={request._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {request._id.slice(-8)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{request.branchName}</div>
                        <div className="text-sm text-gray-500">ID: {request.branchId}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {request.items.map(item => `${item.name} (${item.requestedQuantity} ${item.unit})`).join(', ')}
                        </div>
                        <div className="text-sm text-gray-500">
                          Total: {request.items.reduce((sum, item) => sum + item.requestedQuantity, 0)} units
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(request.requestedAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRequestStatusColor(request.status)}`}>
                          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          {request.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleApproveRequest(request._id)}
                                className="text-green-600 hover:text-green-900 font-medium"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => {
                                  const reason = prompt('Enter rejection reason:');
                                  if (reason) handleRejectRequest(request._id, reason);
                                }}
                                className="text-red-600 hover:text-red-900 font-medium"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          {request.status === 'fulfilled' && (
                            <span className="text-green-600 font-medium">
                              ✓ Completed
                            </span>
                          )}
                          {request.status === 'rejected' && request.rejectionReason && (
                            <span className="text-red-500 text-xs">
                              Reason: {request.rejectionReason}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <p className="text-gray-500">No factory requests at the moment</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderInventoryTab = () => (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Inventory Management</h2>
          <p className="text-gray-600">Monitor and manage factory inventory levels</p>
        </div>
      </div>
      
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-800">Factory Inventory</h3>
        <Link to="/inventory" className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors">
          Manage Inventory
        </Link>
      </div>
      
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(item.lastUpdated).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );


  const renderRecyclingTab = () => (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">🌱 Recycling Management</h2>
          <p className="text-gray-600">Monitor recycling requests and manage branch bins</p>
          <p className="text-sm text-gray-500 mt-1">
            Note: Weight and points statistics reflect approved and completed requests (actual recycling data from database)
          </p>
        </div>
        <button
          onClick={refreshRecyclingData}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
        >
          <span>🔄</span>
          <span>Refresh Data</span>
        </button>
      </div>
      
      {/* Recycling Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setActiveTab('recycling')}>
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100">
              <span className="text-2xl">🌱</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Requests</p>
              <p className="text-2xl font-semibold text-gray-900">
                {loading ? '...' : recyclingStats?.totalRequests || 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {recyclingStats?.completedRequests || 0} completed, {recyclingStats?.approvedRequests || 0} approved
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-yellow-500 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setActiveTab('recycling')}>
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100">
              <span className="text-2xl">⏳</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending Requests</p>
              <p className="text-2xl font-semibold text-gray-900">
                {loading ? '...' : recyclingStats?.pendingRequests || 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Awaiting branch manager approval
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setActiveTab('recycling')}>
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100">
              <span className="text-2xl">✅</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Approved Requests</p>
              <p className="text-2xl font-semibold text-gray-900">
                {loading ? '...' : recyclingStats?.approvedRequests || 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Ready for factory processing
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setActiveTab('recycling')}>
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100">
              <span className="text-2xl">📊</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Processed Recycling</p>
              <p className="text-2xl font-semibold text-gray-900">
                {loading ? '...' : `${(recyclingStats?.totalWeight || 0).toFixed(1)} kg`}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Approved & completed recycling requests
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setActiveTab('recycling')}>
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100">
              <span className="text-2xl">⭐</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Points</p>
              <p className="text-2xl font-semibold text-gray-900">
                {loading ? '...' : (recyclingStats?.totalPoints || 0).toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Points awarded (approved & completed)
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Statistics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-red-500">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-red-100">
              <span className="text-2xl">❌</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Rejected Requests</p>
              <p className="text-2xl font-semibold text-gray-900">
                {loading ? '...' : recyclingStats?.rejectedRequests || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-indigo-500">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-indigo-100">
              <span className="text-2xl">📈</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Completion Rate</p>
              <p className="text-2xl font-semibold text-gray-900">
                {loading ? '...' : `${recyclingStats?.completionRate || 0}%`}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {recyclingStats?.completedRequests || 0} of {recyclingStats?.totalRequests || 0} completed
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-teal-500">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-teal-100">
              <span className="text-2xl">🔄</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Bins</p>
              <p className="text-2xl font-semibold text-gray-900">
                {loading ? '...' : (allRecyclingBins && allRecyclingBins.length > 0 ? allRecyclingBins.length : 0)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {recyclingBins && recyclingBins.length > 0 ? recyclingBins.length : 0} critical
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Factory Waste Bin Section */}
      {factoryWasteBin && (
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100">
                <span className="text-2xl">🏭</span>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">Factory Main Waste Collection Bin</h3>
                <p className="text-sm text-gray-600">Central collection point for all branch waste</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={refreshRecyclingData}
                className="px-3 py-1 bg-purple-100 text-purple-700 rounded-md text-sm hover:bg-purple-200 transition-colors"
              >
                🔄 Refresh
              </button>
              <button
                onClick={async () => {
                  if (window.confirm(`Are you sure you want to recycle the waste? This will empty the bin (${factoryWasteBin?.currentLevel?.toFixed(1) || 0} kg) and add it to recycled statistics.`)) {
                    try {
                      const token = localStorage.getItem('token');
                      const headers = { 'Authorization': `Bearer ${token}` };
                      console.log('🔄 Starting recycle process...');
                      const response = await axios.post('http://localhost:5000/FactoryWasteBin/recycle', {}, { headers });
                      console.log('✅ Recycle response:', response.data);
                      alert(`Waste recycled successfully! ${response.data.recycledAmount} kg has been processed and added to recycled statistics.`);
                      
                      console.log('🔄 Refreshing data after recycle...');
                      await refreshRecyclingData();
                      console.log('✅ Data refresh completed');
                    } catch (error) {
                      console.error('Error recycling waste:', error);
                      console.error('Error details:', error.response?.data);
                      alert('Failed to recycle waste. Please try again.');
                    }
                  }
                }}
                className="px-3 py-1 bg-green-100 text-green-700 rounded-md text-sm hover:bg-green-200 transition-colors"
                disabled={!factoryWasteBin || factoryWasteBin.currentLevel === 0}
              >
                ♻️ Recycle
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="bg-white rounded-lg p-4 border border-purple-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Current Level</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {factoryWasteBin.currentLevel.toFixed(1)} kg
                  </p>
                </div>
                <div className="text-2xl">📦</div>
              </div>
              <div className="mt-2">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${factoryWasteBin.fillPercentage >= 90 ? 'bg-red-500' : factoryWasteBin.fillPercentage >= 70 ? 'bg-yellow-500' : 'bg-green-500'}`}
                    style={{ width: `${Math.min(factoryWasteBin.fillPercentage, 100)}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {factoryWasteBin.fillPercentage.toFixed(1)}% full
                </p>
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-4 border border-purple-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Capacity</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {factoryWasteBin.capacity} kg
                  </p>
                </div>
                <div className="text-2xl">⚖️</div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Maximum capacity
              </p>
            </div>
            
            <div className="bg-white rounded-lg p-4 border border-purple-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Waste Collected</p>
                  <p className="text-2xl font-bold text-green-600">
                    {factoryBinStats?.totalWaste?.toFixed(1) || factoryWasteBin?.totalWasteCollected?.toFixed(1) || '0.0'} kg
                  </p>
                </div>
                <div className="text-2xl">📊</div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                All waste ever collected at factory
              </p>
            </div>
            
            <div className="bg-white rounded-lg p-4 border border-purple-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Collections</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {factoryBinStats?.totalCollections || 0}
                  </p>
                </div>
                <div className="text-2xl">🔄</div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Total collections
              </p>
            </div>
            
            <div className="bg-white rounded-lg p-4 border border-purple-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Recycled</p>
                  <p className="text-2xl font-bold text-emerald-600">
                    {factoryBinStats?.totalRecycled?.toFixed(1) || '0.0'} kg
                  </p>
                </div>
                <div className="text-2xl">♻️</div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Total recycled
              </p>
            </div>
          </div>
          
          {factoryWasteBin.fillPercentage >= 90 && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <span className="text-2xl mr-3">⚠️</span>
                <div>
                  <h4 className="font-medium text-red-800">Factory Bin Nearly Full!</h4>
                  <p className="text-sm text-red-600">
                    The factory waste bin is {factoryWasteBin.fillPercentage.toFixed(1)}% full. 
                    Consider emptying it soon to avoid overflow.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Critical Bins Alert */}
      {recyclingBins.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <div className="flex-shrink-0">
              <span className="text-2xl">🚨</span>
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-medium text-red-800">Critical Bin Alerts</h3>
              <p className="text-sm text-red-600">
                {recyclingBins.length} branch{recyclingBins.length > 1 ? 'es' : ''} have recycling bins that are 90%+ full
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recyclingBins.map((bin) => (
              <div key={bin._id} className="bg-white border border-red-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-medium text-red-900">{bin.branchName}</h4>
                    <p className="text-sm text-red-600">{bin.location}</p>
                  </div>
                  <span className="text-sm font-medium text-red-800">
                    {bin.fillPercentage.toFixed(1)}%
                  </span>
                </div>
                <div className="text-sm text-red-700">
                  <p>Current: {bin.currentLevel} kg</p>
                  <p>Capacity: {bin.capacity} kg</p>
                </div>
                <button 
                  onClick={() => handleEmptyBin(bin._id)}
                  className="mt-3 w-full bg-red-600 text-white px-3 py-2 rounded-md hover:bg-red-700 text-sm"
                >
                  Empty Bin
                </button>
              </div>
            ))}
          </div>
        </div>
      )}


      {/* Collection Requests Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-800">Collection Requests</h3>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-500">
              {collectionRequests.length} pending request{collectionRequests.length !== 1 ? 's' : ''}
            </span>
            <button
              onClick={refreshRecyclingData}
              className="px-3 py-1 bg-blue-100 text-blue-700 rounded-md text-sm hover:bg-blue-200 transition-colors"
            >
              🔄 Refresh
            </button>
          </div>
        </div>
        

        {collectionRequests.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Request ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Branch
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bin Level
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {collectionRequests.map((request) => (
                  <tr key={request._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {request.requestId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{request.branchName}</div>
                      <div className="text-sm text-gray-500">{request.branchLocation}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        request.requestType === 'Empty Bin' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {request.requestType}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {request.currentLevel}kg / {request.capacity}kg ({request.fillPercentage.toFixed(1)}%)
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(request.requestDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button 
                        onClick={() => handleApproveCollectionRequest(request._id)}
                        className="text-green-600 hover:text-green-900 mr-3"
                      >
                        Approve
                      </button>
                      <button 
                        onClick={() => handleRejectCollectionRequest(request._id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Reject
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">🗑️</div>
            <p className="text-gray-500">No pending collection requests</p>
            <p className="text-sm text-gray-400">All collection requests have been processed</p>
          </div>
        )}
      </div>

    </div>
  );

  const renderReportsTab = () => (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Reports & Analytics</h2>
        <p className="text-gray-600">Generate reports and view analytics</p>
      </div>
      
      <h3 className="text-lg font-semibold text-gray-800">Analytics Dashboard</h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h4 className="text-md font-semibold text-gray-800 mb-4">Order Statistics</h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={[
              { name: 'Total', value: orderStats?.totalOrders || 0 },
              { name: 'Pending', value: orderStats?.pendingOrders || 0 },
              { name: 'Processing', value: orderStats?.processingOrders || 0 },
              { name: 'Urgent', value: orderStats?.urgentOrders || 0 },
              { name: 'High Priority', value: orderStats?.highPriorityOrders || 0 }
            ]}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="name" 
                stroke="#666"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                stroke="#666"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
                formatter={(value) => [`${value} orders`, 'Count']}
              />
              <Bar dataKey="value" fill="#0077B6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h4 className="text-md font-semibold text-gray-800 mb-4">Inventory Status</h4>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={[
                  { name: 'In Stock', value: inventoryStats?.inStockItems || 0, color: '#10B981' },
                  { name: 'Low Stock', value: inventoryStats?.lowStockItems || 0, color: '#F59E0B' },
                  { name: 'Out of Stock', value: inventoryStats?.outOfStockItems || 0, color: '#EF4444' }
                ]}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {[
                  { name: 'In Stock', value: inventoryStats?.inStockItems || 0, color: '#10B981' },
                  { name: 'Low Stock', value: inventoryStats?.lowStockItems || 0, color: '#F59E0B' },
                  { name: 'Out of Stock', value: inventoryStats?.outOfStockItems || 0, color: '#EF4444' }
                ].map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
                formatter={(value, name) => [`${value} items`, name]}
              />
              <Legend 
                wrapperStyle={{ paddingTop: '20px' }}
                iconType="circle"
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Monthly Recycling vs Production Comparison Chart */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h4 className="text-md font-semibold text-gray-800">Monthly Recycling vs Orders Comparison</h4>
            <p className="text-sm text-gray-600">Track the relationship between branch order fulfillment and recycling efficiency throughout the year</p>
          </div>
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-600">Year:</label>
            <select 
              value={selectedYear} 
              onChange={(e) => handleYearChange(parseInt(e.target.value))}
              className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {[2023, 2024, 2025].map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>
        
        {/* Summary Cards */}
        {comparisonSummary && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">Total Orders</p>
                  <p className="text-2xl font-bold text-blue-900">{comparisonSummary.totalOrders}</p>
                </div>
                <div className="text-blue-500 text-2xl">📋</div>
              </div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">Recycling Weight (kg)</p>
                  <p className="text-2xl font-bold text-green-900">{comparisonSummary.totalRecyclingWeight}</p>
                </div>
                <div className="text-green-500 text-2xl">🌱</div>
              </div>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-600">Recycling Requests</p>
                  <p className="text-2xl font-bold text-orange-900">{comparisonSummary.totalRecyclingRequests}</p>
                </div>
                <div className="text-orange-500 text-2xl">♻️</div>
              </div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600">Avg Efficiency</p>
                  <p className="text-2xl font-bold text-purple-900">{comparisonSummary.averageEfficiency}%</p>
                </div>
                <div className="text-purple-500 text-2xl">📊</div>
              </div>
            </div>
          </div>
        )}

        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={monthlyComparisonData.length > 0 ? monthlyComparisonData : monthlyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="month" 
              stroke="#666"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              stroke="#666"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              label={{ value: 'Units', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
              formatter={(value, name) => [
                name === 'orders.placed' ? `${value} orders` :
                name === 'orders.delivered' ? `${value} orders` :
                name === 'recycling.weight' ? `${value} kg` :
                name === 'recycling.requests' ? `${value} requests` :
                name === 'metrics.overallEfficiency' ? `${value}%` :
                `${value} units`
              ]}
              labelFormatter={(label) => `Month: ${label}`}
            />
            <Legend 
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="line"
            />
            {monthlyComparisonData.length > 0 ? (
              <>
                <Line 
                  type="monotone" 
                  dataKey="orders.placed" 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#3B82F6', strokeWidth: 2 }}
                  name="Orders Placed"
                />
                <Line 
                  type="monotone" 
                  dataKey="orders.delivered" 
                  stroke="#10B981" 
                  strokeWidth={2}
                  dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#10B981', strokeWidth: 2 }}
                  name="Orders Delivered"
                />
                <Line 
                  type="monotone" 
                  dataKey="recycling.weight" 
                  stroke="#F59E0B" 
                  strokeWidth={2}
                  dot={{ fill: '#F59E0B', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#F59E0B', strokeWidth: 2 }}
                  name="Recycling Weight (kg)"
                />
                <Line 
                  type="monotone" 
                  dataKey="recycling.requests" 
                  stroke="#8B5CF6" 
                  strokeWidth={2}
                  dot={{ fill: '#8B5CF6', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#8B5CF6', strokeWidth: 2 }}
                  name="Recycling Requests"
                />
                <Line 
                  type="monotone" 
                  dataKey="metrics.overallEfficiency" 
                  stroke="#EF4444" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ fill: '#EF4444', strokeWidth: 2, r: 3 }}
                  activeDot={{ r: 5, stroke: '#EF4444', strokeWidth: 2 }}
                  name="Overall Efficiency %"
                />
              </>
            ) : (
              <>
                <Line 
                  type="monotone" 
                  dataKey="production" 
                  stroke="#0077B6" 
                  strokeWidth={3}
                  dot={{ fill: '#0077B6', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#0077B6', strokeWidth: 2 }}
                  name="Production Output"
                />
                <Line 
                  type="monotone" 
                  dataKey="recycling" 
                  stroke="#00B4D8" 
                  strokeWidth={3}
                  dot={{ fill: '#00B4D8', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#00B4D8', strokeWidth: 2 }}
                  name="Recycling Volume"
                />
                <Line 
                  type="monotone" 
                  dataKey="efficiency" 
                  stroke="#10B981" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ fill: '#10B981', strokeWidth: 2, r: 3 }}
                  activeDot={{ r: 5, stroke: '#10B981', strokeWidth: 2 }}
                  name="Recycling Efficiency %"
                />
              </>
            )}
          </LineChart>
        </ResponsiveContainer>
        
        {/* Chart Insights */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-sm font-medium text-blue-800">Orders Fulfilled Trend</span>
            </div>
            <p className="text-xs text-blue-600 mt-1">
              {monthlyData.length > 0 
                ? `Peak orders in ${monthlyData.reduce((max, item) => item.production > max.production ? item : max, monthlyData[0]).month} (${Math.max(...monthlyData.map(d => d.production))} units)`
                : 'Loading orders data...'
              }
            </p>
          </div>
          <div className="bg-cyan-50 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-cyan-500 rounded-full"></div>
              <span className="text-sm font-medium text-cyan-800">Recycling Trend</span>
            </div>
            <p className="text-xs text-cyan-600 mt-1">
              {monthlyData.length > 0 
                ? `Highest recycling in ${monthlyData.reduce((max, item) => item.recycling > max.recycling ? item : max, monthlyData[0]).month} (${Math.max(...monthlyData.map(d => d.recycling))} kg)`
                : 'Loading recycling data...'
              }
            </p>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm font-medium text-green-800">Efficiency Trend</span>
            </div>
            <p className="text-xs text-green-600 mt-1">
              {monthlyData.length > 0 
                ? `Best efficiency in ${monthlyData.reduce((max, item) => item.efficiency > max.efficiency ? item : max, monthlyData[0]).month} (${Math.max(...monthlyData.map(d => d.efficiency)).toFixed(1)}%)`
                : 'Loading efficiency data...'
              }
            </p>
          </div>
        </div>

        {/* Detailed Monthly Data Table */}
        {monthlyComparisonData.length > 0 && (
          <div className="mt-6">
            <h4 className="text-lg font-semibold text-gray-800 mb-4">Detailed Monthly Breakdown</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Month</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Orders</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recycling</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Factory Requests</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Efficiency</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {monthlyComparisonData.map((month, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{month.month}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        <div className="space-y-1">
                          <div>Placed: <span className="font-medium text-blue-600">{month.orders.placed}</span></div>
                          <div>Delivered: <span className="font-medium text-green-600">{month.orders.delivered}</span></div>
                          <div>Pending: <span className="font-medium text-orange-600">{month.orders.pending}</span></div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        <div className="space-y-1">
                          <div>Requests: <span className="font-medium text-purple-600">{month.recycling.requests}</span></div>
                          <div>Completed: <span className="font-medium text-green-600">{month.recycling.completed}</span></div>
                          <div>Weight: <span className="font-medium text-orange-600">{month.recycling.weight} kg</span></div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        <div className="space-y-1">
                          <div>Total: <span className="font-medium text-blue-600">{month.factoryRequests.total}</span></div>
                          <div>Approved: <span className="font-medium text-green-600">{month.factoryRequests.approved}</span></div>
                          <div>Rate: <span className="font-medium text-purple-600">{month.factoryRequests.approvalRate}%</span></div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        <div className="space-y-1">
                          <div>Recycling: <span className="font-medium text-green-600">{month.recycling.efficiency}%</span></div>
                          <div>Completion: <span className="font-medium text-blue-600">{month.metrics.recyclingCompletionRate}%</span></div>
                          <div>Overall: <span className="font-medium text-purple-600">{month.metrics.overallEfficiency}%</span></div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Recycling Statistics Chart */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h4 className="text-md font-semibold text-gray-800 mb-4">Recycling Statistics</h4>
        <p className="text-sm text-gray-600 mb-4">Track recycling request status and performance metrics</p>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h5 className="text-sm font-medium text-gray-700 mb-3">Recycling Request Status</h5>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Completed', value: recyclingStats?.completedRequests || 0, color: '#10B981' },
                    { name: 'Pending', value: recyclingStats?.pendingRequests || 0, color: '#F59E0B' },
                    { name: 'Approved', value: recyclingStats?.approvedRequests || 0, color: '#3B82F6' },
                    { name: 'Rejected', value: recyclingStats?.rejectedRequests || 0, color: '#EF4444' }
                  ]}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value, percent }) => `${name}: ${value}`}
                  outerRadius={70}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {[
                    { name: 'Completed', value: recyclingStats?.completedRequests || 0, color: '#10B981' },
                    { name: 'Pending', value: recyclingStats?.pendingRequests || 0, color: '#F59E0B' },
                    { name: 'Approved', value: recyclingStats?.approvedRequests || 0, color: '#3B82F6' },
                    { name: 'Rejected', value: recyclingStats?.rejectedRequests || 0, color: '#EF4444' }
                  ].map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                  formatter={(value, name) => [`${value} requests`, name]}
                />
                <Legend 
                  wrapperStyle={{ paddingTop: '20px' }}
                  iconType="circle"
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div>
            <h5 className="text-sm font-medium text-gray-700 mb-3">Recycling Performance Metrics</h5>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <span className="text-sm font-medium text-green-800">Total Requests</span>
                <span className="text-lg font-bold text-green-900">{recyclingStats?.totalRequests || 0}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <span className="text-sm font-medium text-blue-800">Processed Recycling</span>
                <span className="text-lg font-bold text-blue-900">{recyclingStats?.totalWeight || 0} kg</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                <span className="text-sm font-medium text-purple-800">Total Points Awarded</span>
                <span className="text-lg font-bold text-purple-900">{recyclingStats?.totalPoints || 0}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                <span className="text-sm font-medium text-orange-800">Completion Rate</span>
                <span className="text-lg font-bold text-orange-900">
                  {recyclingStats?.totalRequests > 0 
                    ? ((recyclingStats?.completedRequests / recyclingStats?.totalRequests) * 100).toFixed(1)
                    : 0
                  }%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h4 className="text-md font-semibold text-gray-800 mb-4">Generate Reports</h4>
        <div className="flex flex-wrap gap-4">
          <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
            Inventory Report
          </button>
          <button className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors">
            Order Report
          </button>
          <button className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 transition-colors">
            Production Report
          </button>
          <button className="bg-emerald-600 text-white px-4 py-2 rounded-md hover:bg-emerald-700 transition-colors">
            Recycling Report
          </button>
        </div>
      </div>
    </div>
  );

  const renderSettingsTab = () => (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Factory Settings</h2>
        <p className="text-gray-600">Configure factory settings and preferences</p>
      </div>
      
      <h3 className="text-lg font-semibold text-gray-800">Configuration</h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h4 className="text-md font-semibold text-gray-800 mb-4">Factory Information</h4>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Factory Name</label>
              <input type="text" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" defaultValue="RO Filter Factory" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Location</label>
              <input type="text" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" defaultValue="Colombo, Sri Lanka" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Contact Email</label>
              <input type="email" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" defaultValue="factory@aqualink.com" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h4 className="text-md font-semibold text-gray-800 mb-4">Inventory Settings</h4>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Default Min Stock Level</label>
              <input type="number" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" defaultValue="10" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Default Max Stock Level</label>
              <input type="number" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" defaultValue="100" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Auto-reorder Threshold</label>
              <input type="number" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" defaultValue="20" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h4 className="text-md font-semibold text-gray-800 mb-4">Quick Actions</h4>
        <div className="flex flex-wrap gap-4">
          <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
            Save Settings
          </button>
          <button className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors">
            Reset to Default
          </button>
          <button className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors">
            Export Configuration
          </button>
        </div>
      </div>

      {/* Creative Logout Section */}
      <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-lg font-semibold text-red-800 mb-2">🏭 Factory Session Management</h4>
            <p className="text-red-600 text-sm">Securely exit the Factory Command Center when your work is complete</p>
          </div>
          <div className="flex flex-col space-y-2">
            <button 
              onClick={handleCreativeLogout}
              className="group relative overflow-hidden bg-gradient-to-r from-red-500 to-pink-500 text-white px-6 py-3 rounded-lg font-semibold hover:from-red-600 hover:to-pink-600 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              <span className="relative z-10 flex items-center space-x-2">
                <span className="group-hover:animate-bounce">🚪</span>
                <span>Secure Logout</span>
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>
            <button 
              onClick={() => {
                if (window.confirm('⚠️ This will close all factory operations. Continue?')) {
                  handleCreativeLogout();
                }
              }}
              className="text-xs text-red-600 hover:text-red-800 underline"
            >
              Emergency Shutdown
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const handleEmptyBin = async (binId) => {
    try {
      setLoading(true);
      await axios.put(`http://localhost:5000/RecyclingBins/${binId}/empty`);
      alert('Bin emptied successfully!');
      
      // Refresh recycling data to update statistics
      await refreshRecyclingData();
    } catch (error) {
      console.error('Error emptying bin:', error);
      alert('Error emptying bin. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteRequest = async (requestId) => {
    try {
      setLoading(true);
      await axios.put(`http://localhost:5000/RecyclingRequests/${requestId}/complete`);
      alert('Request completed successfully!');
      
      // Refresh recycling data to update statistics
      await refreshRecyclingData();
    } catch (error) {
      console.error('Error completing request:', error);
      alert('Error completing request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewRequest = (request) => {
    // Implement detailed view modal
    console.log('Viewing request:', request);
  };

  const handleViewAllRequests = () => {
    // Navigate to full requests page
    console.log('Viewing all requests');
  };

  const handleGenerateRecyclingReport = () => {
    // Generate and download recycling report
    console.log('Generating recycling report');
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverviewTab();
      case 'orders':
        return renderOrdersTab();
      case 'inventory':
        return renderInventoryTab();
      case 'recycling':
        return renderRecyclingTab();
      case 'reports':
        return renderReportsTab();
      case 'settings':
        return renderSettingsTab();
      default:
        return renderOverviewTab();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with integrated navigation */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Top header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 gap-4">
            <div>
              <div className="flex items-center space-x-2 mb-1">
                <span className="text-2xl">🏭</span>
                <h1 className="text-2xl font-bold text-blue-600">
                  Factory Manager Dashboard
                </h1>
              </div>
              <p className="text-sm text-gray-600">
                Welcome back, {user?.name || 'Factory Manager'} • {new Date().toLocaleDateString()}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                <span>System Online</span>
              </div>
              {/* Creative Logout Button */}
              <button 
                onClick={handleCreativeLogout}
                className="group relative overflow-hidden bg-gradient-to-r from-red-500 to-pink-500 text-white px-4 py-2 rounded-lg font-semibold text-sm hover:from-red-600 hover:to-pink-600 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                <span className="relative z-10 flex items-center space-x-2">
                  <span>🚪</span>
                  <span>Exit Factory</span>
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </button>
            </div>
          </div>
          
          {/* Main navigation tabs */}
          <nav className="flex flex-wrap gap-2" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center py-3 px-4 rounded-lg font-medium text-sm transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-blue-50 text-blue-700 border-2 border-blue-200 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50 border-2 border-transparent'
                }`}
              >
                <span className="mr-2 text-lg">{tab.icon}</span>
                <span className="hidden sm:inline">{tab.name}</span>
                <span className="sm:hidden">{tab.name.split(' ')[0]}</span>
              </button>
            ))}
          </nav>
          
          {/* Tab Descriptions and Quick Actions */}
          <div className="py-3 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <p className="text-sm text-gray-600">
                {tabs.find(tab => tab.id === activeTab)?.description || 'Select a tab to manage factory operations'}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main content area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb Navigation */}
        <div className="mb-6">
          <nav className="flex items-center space-x-2 text-sm text-gray-500">
            <span>🏭</span>
            <span>Factory Manager</span>
            <span>›</span>
            <span className="text-blue-600 font-medium">
              {tabs.find(tab => tab.id === activeTab)?.name || 'Overview'}
            </span>
          </nav>
        </div>
        
        {/* Tab Content */}
        {renderTabContent()}
      </div>

    </div>
  );
};

export default FactoryDashboard;
