import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../Context/AuthContext';
import axios from 'axios'; // Added axios import
import jsPDF from 'jspdf';

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  
  // Check if user has admin role
  useEffect(() => {
    if (user && user.role !== 'Admin') {
      console.error('User does not have admin privileges:', user.role);
      alert('Access denied. Admin privileges required.');
      window.location.href = '/login';
    }
  }, [user]);
  
  const [employees, setEmployees] = useState([]);
  const [emergencyRequests, setEmergencyRequests] = useState([]);
  const [users, setUsers] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recyclingStats, setRecyclingStats] = useState({});
  const [recyclingRequests, setRecyclingRequests] = useState([]);
  const [recyclingBins, setRecyclingBins] = useState([]);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // Fetch data from API
  const fetchUsers = async () => {
    try {
      const response = await axios.get('http://localhost:5000/Users');
      setUsers(response.data.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchCustomers = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('🔑 Token for customers:', token ? 'Present' : 'Missing');
      
      // Use the existing /Users endpoint and filter for customers
      const response = await axios.get('http://localhost:5000/Users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      console.log('✅ Users response:', response.data);
      console.log('📊 All users:', response.data.data);
      
      // Filter for customers only - the API returns data in response.data.data
      const customers = (response.data.data || []).filter(user => user.role === 'Customer');
      console.log('👥 Filtered customers:', customers);
      
      setCustomers(customers);
    } catch (error) {
      console.error('❌ Error fetching customers:', error);
      console.error('Error response:', error.response?.data);
    }
  };

  const fetchEmployees = async () => {
    try {
      console.log('Fetching employees...');
      const response = await axios.get('http://localhost:5000/employees');
      console.log('Employees response:', response.data);
      setEmployees(response.data.data || response.data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
      console.error('Error details:', error.response?.data);
      setEmployees([]);
    }
  };

  const fetchRecyclingStats = async () => {
    try {
      const response = await axios.get('http://localhost:5000/RecyclingRequests/statistics');
      setRecyclingStats(response.data.statistics);
    } catch (error) {
      console.error('Error fetching recycling stats:', error);
      setRecyclingStats({
        totalRequests: 0,
        pendingRequests: 0,
        approvedRequests: 0,
        completedRequests: 0,
        rejectedRequests: 0,
        totalWeight: 0,
        totalPoints: 0
      });
    }
  };

  const fetchRecyclingRequests = async () => {
    try {
      const response = await axios.get('http://localhost:5000/RecyclingRequests');
      setRecyclingRequests(response.data.requests || []);
    } catch (error) {
      console.error('Error fetching recycling requests:', error);
      setRecyclingRequests([]);
    }
  };

  const fetchRecyclingBins = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('No token available for recycling bins');
        return;
      }
      
      const response = await axios.get('http://localhost:5000/RecyclingBins', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setRecyclingBins(response.data.bins || []);
    } catch (error) {
      console.error('Error fetching recycling bins:', error);
      // Don't show error to user as this is not critical for admin dashboard
      setRecyclingBins([]);
    }
  };

  const fetchEmergencyRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('🔑 Token for emergency requests:', token ? 'Present' : 'Missing');
      
      if (!token) {
        console.error('❌ No authentication token found');
        alert('Please log in again to access emergency requests');
        navigate('/login');
        return;
      }

      const response = await axios.get('http://localhost:5000/emergency-requests/all', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      console.log('✅ Emergency requests fetched successfully:', response.data);
      setEmergencyRequests(response.data.data || response.data || []);
    } catch (error) {
      console.error('❌ Error fetching emergency requests:', error);
      console.error('Error response:', error.response?.data);
      
      if (error.response?.status === 401) {
        console.error('🔒 Authentication failed - redirecting to login');
        alert('Session expired. Please log in again.');
        localStorage.removeItem('token');
        navigate('/login');
      } else {
        setEmergencyRequests([]);
      }
    }
  };


  const handleEmergencyRequestAction = async (requestId, action, notes = '') => {
    try {
      const token = localStorage.getItem('token');
      const updateData = {
        status: action === 'approve' ? 'Approved - Sent to Branch Manager' : 'Rejected',
        adminNotes: notes || `Request ${action}d by admin and sent to branch manager for driver assignment`
      };

      const response = await axios.put(`http://localhost:5000/emergency-requests/${requestId}/status`, updateData, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.data.success) {
        if (action === 'approve') {
          alert('Emergency request approved and sent to branch manager for driver assignment!');
        } else {
          alert('Emergency request rejected successfully!');
        }
        fetchEmergencyRequests(); // Refresh the list
      }
    } catch (error) {
      console.error(`Error ${action}ing emergency request:`, error);
      alert(`Failed to ${action} emergency request. Please try again.`);
    }
  };


  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        await Promise.all([
          fetchUsers(),
          fetchCustomers(),
          fetchEmployees(),
          fetchRecyclingStats(),
          fetchRecyclingRequests(),
          fetchRecyclingBins(),
          fetchEmergencyRequests()
        ]);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Employee management functions
  const handleEditEmployee = (employee) => {
    setEditingEmployee(employee);
    setShowEditModal(true);
  };

  const handleDeleteEmployee = async (employeeId) => {
    if (window.confirm('Are you sure you want to delete this employee?')) {
      try {
        await axios.delete(`http://localhost:5000/employees/${employeeId}`);
        // Refresh employees list
        await fetchEmployees();
        alert('Employee deleted successfully');
      } catch (error) {
        console.error('Error deleting employee:', error);
        alert('Error deleting employee');
      }
    }
  };

  const handleUpdateEmployee = async (updatedEmployee) => {
    try {
      await axios.put(`http://localhost:5000/employees/${updatedEmployee._id}`, updatedEmployee);
      // Refresh employees list
      await fetchEmployees();
      setShowEditModal(false);
      setEditingEmployee(null);
      alert('Employee updated successfully');
    } catch (error) {
      console.error('Error updating employee:', error);
      alert('Error updating employee');
    }
  };

  const handleToggleCustomerStatus = async (customerId, currentStatus) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(`http://localhost:5000/auth/${customerId}/status`, {}, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.data.message) {
        alert(response.data.message);
        // Refresh customers list
        await fetchCustomers();
      }
    } catch (error) {
      console.error('Error toggling customer status:', error);
      alert('Error updating customer status');
    }
  };

  // PDF Generation Functions - Simple and robust
  const generateEmployeesPDF = () => {
    if (!employees || employees.length === 0) {
      alert('No employee data available to generate PDF');
      return;
    }
    try {
      const doc = new jsPDF();
      
      // Header
      doc.setFontSize(20);
      doc.text('Employee Report', 20, 20);
      doc.setFontSize(12);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 30);
      doc.text(`Total Employees: ${employees.length}`, 20, 40);
      
      // Simple table
      let yPos = 60;
      doc.setFontSize(10);
      
      // Headers
      doc.text('Name', 20, yPos);
      doc.text('Role', 80, yPos);
      doc.text('Status', 140, yPos);
      yPos += 10;
      
      // Data rows
      employees.forEach(emp => {
        if (yPos > 250) {
          doc.addPage();
          yPos = 20;
        }
        doc.text(emp.name || 'N/A', 20, yPos);
        doc.text(emp.role || 'N/A', 80, yPos);
        doc.text(emp.isActive ? 'Active' : 'Inactive', 140, yPos);
        yPos += 8;
      });
      
      doc.save('employees-report.pdf');
    } catch (error) {
      console.error('Error generating employee PDF:', error);
      alert('Error generating employee PDF. Please try again.');
    }
  };

  const generateEmergencyRequestsPDF = () => {
    if (!emergencyRequests || emergencyRequests.length === 0) {
      alert('No emergency request data available to generate PDF');
      return;
    }
    try {
      const doc = new jsPDF();
      
      // Header
      doc.setFontSize(20);
      doc.text('Emergency Requests Report', 20, 20);
      doc.setFontSize(12);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 30);
      doc.text(`Total Requests: ${emergencyRequests.length}`, 20, 40);
      
      // Simple table
      let yPos = 60;
      doc.setFontSize(10);
      
      // Headers
      doc.text('Brigade', 20, yPos);
      doc.text('Type', 80, yPos);
      doc.text('Status', 140, yPos);
      yPos += 10;
      
      // Data rows
      emergencyRequests.forEach(req => {
        if (yPos > 250) {
          doc.addPage();
          yPos = 20;
        }
        doc.text(req.brigadeName || 'N/A', 20, yPos);
        doc.text(req.requestType || 'N/A', 80, yPos);
        doc.text(req.status || 'N/A', 140, yPos);
        yPos += 8;
      });
      
      doc.save('emergency-requests-report.pdf');
    } catch (error) {
      console.error('Error generating emergency PDF:', error);
      alert('Error generating emergency PDF. Please try again.');
    }
  };

  const generateCustomersPDF = () => {
    if (!customers || customers.length === 0) {
      alert('No customer data available to generate PDF');
      return;
    }
    try {
      const doc = new jsPDF();
      
      // Header
      doc.setFontSize(20);
      doc.text('Customer Report', 20, 20);
      doc.setFontSize(12);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 30);
      doc.text(`Total Customers: ${customers.length}`, 20, 40);
      
      // Simple table
      let yPos = 60;
      doc.setFontSize(10);
      
      // Headers
      doc.text('Name', 20, yPos);
      doc.text('Email', 80, yPos);
      doc.text('Points', 140, yPos);
      yPos += 10;
      
      // Data rows
      customers.forEach(customer => {
        if (yPos > 250) {
          doc.addPage();
          yPos = 20;
        }
        doc.text(customer.name || 'N/A', 20, yPos);
        doc.text(customer.email || 'N/A', 80, yPos);
        doc.text((customer.recyclingPoints || 0).toString(), 140, yPos);
        yPos += 8;
      });
      
      doc.save('customers-report.pdf');
    } catch (error) {
      console.error('Error generating customer PDF:', error);
      alert('Error generating customer PDF. Please try again.');
    }
  };

  const generateRecyclingPDF = () => {
    try {
      // For recycling, we'll create a simple PDF since there's no specific function
      const doc = new jsPDF();
      
      // Header
      doc.setFontSize(20);
      doc.setTextColor(34, 197, 94);
      doc.text('AquaLink - Recycling Report', 105, 20, { align: 'center' });
      
      doc.setFontSize(12);
      doc.setTextColor(107, 114, 128);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 105, 30, { align: 'center' });
      
      // Statistics
      doc.setFontSize(14);
      doc.setTextColor(17, 24, 39);
      doc.text('Recycling Statistics', 20, 45);
      
      doc.setFontSize(10);
      doc.text(`Total Requests: ${recyclingStats?.totalRequests || 0}`, 20, 55);
      doc.text(`Pending Requests: ${recyclingStats?.pendingRequests || 0}`, 20, 65);
      doc.text(`Total Weight: ${recyclingStats?.totalWeight || 0} kg`, 20, 75);
      doc.text(`Total Points: ${recyclingStats?.totalPoints || 0}`, 20, 85);
      
      doc.save('recycling-report.pdf');
    } catch (error) {
      console.error('Error generating recycling PDF:', error);
      alert('Error generating recycling PDF. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Dashboard Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              </div>
              <div className="hidden md:block">
                <p className="text-sm text-gray-600">Welcome back, {user?.name}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/admin/add-employee')}
                className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors duration-200 text-sm font-medium"
              >
                + Add Employee
              </button>
              <button
                onClick={() => navigate('/login')}
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Breadcrumb Navigation */}
        <div className="mb-6">
          <nav className="flex" aria-label="Breadcrumb">
            <ol className="inline-flex items-center space-x-1 md:space-x-3">
              <li className="inline-flex items-center">
                <span className="text-gray-500 hover:text-gray-700 cursor-pointer">
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                  </svg>
                  Admin
                </span>
              </li>
              <li>
                <div className="flex items-center">
                  <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="ml-1 text-gray-500 md:ml-2 capitalize">{activeTab}</span>
                </div>
              </li>
            </ol>
          </nav>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Employees</p>
                <p className="text-2xl font-semibold text-gray-900">{employees.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Emergency Requests</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {emergencyRequests.filter(req => req.status === 'Pending').length}
                </p>
              </div>
            </div>
          </div>


          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-semibold text-gray-900">{users.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex flex-wrap space-x-1 px-6 overflow-x-auto">
              {[
                { id: 'overview', name: 'Overview', icon: '📊', description: 'Dashboard summary and quick actions' },
                { id: 'employees', name: 'Employees', icon: '👥', description: 'Manage staff and personnel' },
                { id: 'emergency', name: 'Emergency', icon: '🚨', description: 'Handle urgent requests' },
                { id: 'users', name: 'Customers', icon: '👥', description: 'Customer management and details' },
                { id: 'recycling', name: 'Recycling', icon: '🌱', description: 'Manage recycling system' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`group relative py-4 px-6 border-b-2 font-medium text-sm flex flex-col items-center space-y-1 transition-all duration-200 min-w-max ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 bg-blue-50 shadow-sm'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-lg">{tab.icon}</span>
                  <span className="font-semibold">{tab.name}</span>
                  <span className="text-xs text-gray-400 group-hover:text-gray-600 transition-colors duration-200">
                    {tab.description}
                  </span>
                  {activeTab === tab.id && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500 rounded-t-full"></div>
                  )}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Recent Emergency Requests */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Recent Emergency Requests</h3>
                      <button 
                        onClick={() => setActiveTab('emergency')}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        View All →
                      </button>
                    </div>
                    <div className="space-y-3">
                      {emergencyRequests.length === 0 ? (
                        <div className="bg-white rounded-lg p-4 text-center">
                          <div className="text-4xl mb-2">🚨</div>
                          <p className="text-gray-600 text-sm">No emergency requests</p>
                        </div>
                      ) : (
                        emergencyRequests.slice(0, 3).map((request, index) => (
                          <div key={request._id || `emergency-${index}`} className="bg-white rounded-lg p-3 border-l-4 border-red-500">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium text-gray-900">{request.brigadeName}</p>
                                <p className="text-sm text-gray-600">{request.requestType}</p>
                                <p className="text-xs text-gray-500">
                                  {new Date(request.requestDate).toLocaleString()}
                                </p>
                                <p className="text-xs text-gray-400">Water Level: {request.waterLevel}</p>
                              </div>
                              <div className="flex flex-col space-y-1">
                                <span className={`px-2 py-1 text-xs rounded-full ${
                                  request.priority === 'Critical' ? 'bg-red-100 text-red-800' :
                                  request.priority === 'High' ? 'bg-orange-100 text-orange-800' :
                                  'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {request.priority}
                                </span>
                                <span className={`px-2 py-1 text-xs rounded-full ${
                                  request.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                                  request.status === 'Approved' ? 'bg-green-100 text-green-800' :
                                  request.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {request.status}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Recent Employees */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Employees</h3>
                    <div className="space-y-3">
                      {employees.slice(0, 3).map((employee, index) => (
                        <div key={employee._id || employee.id || `employee-${index}`} className="bg-white rounded-lg p-3 border-l-4 border-blue-500">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium text-gray-900">{employee.name}</p>
                              <p className="text-sm text-gray-600">{employee.role}</p>
                              <p className="text-xs text-gray-500">{employee.branchName || 'N/A'}</p>
                            </div>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              employee.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {employee.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

              </div>
            )}

            {activeTab === 'employees' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Employee Management</h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={generateEmployeesPDF}
                      className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition-colors duration-200"
                    >
                      📄 Download PDF
                    </button>
                    <Link
                      to="/admin/add-employee"
                      className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors duration-200"
                    >
                      + Add Employee
                    </Link>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Branch</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {employees.length > 0 ? (
                        employees.map((employee, index) => (
                          <tr key={employee._id || employee.id || `employee-row-${index}`}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                                <div className="text-sm text-gray-500">{employee.email}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{employee.role}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {employee.branchName || 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                employee.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {employee.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button 
                                onClick={() => handleEditEmployee(employee)}
                                className="text-blue-600 hover:text-blue-900 mr-3"
                              >
                                Edit
                              </button>
                              <button 
                                onClick={() => handleDeleteEmployee(employee._id || employee.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                            No employees found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'emergency' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Emergency Request Management</h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={generateEmergencyRequestsPDF}
                      className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition-colors duration-200"
                    >
                      📄 Download PDF
                    </button>
                  </div>
                </div>

                {emergencyRequests.length === 0 ? (
                  <div className="bg-white border rounded-lg p-8 text-center">
                    <div className="text-6xl mb-4">🚨</div>
                    <h4 className="text-lg font-medium text-gray-900 mb-2">No Emergency Requests</h4>
                    <p className="text-gray-600">No emergency water requests are currently pending.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {emergencyRequests.map((request, index) => (
                      <div key={request._id || `emergency-request-${index}`} className="bg-white border rounded-lg p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h4 className="text-lg font-semibold text-gray-900">{request.brigadeName}</h4>
                            <p className="text-sm text-gray-600">{request.brigadeLocation}</p>
                            <p className="text-sm text-gray-500">
                              {new Date(request.requestDate).toLocaleString()}
                            </p>
                            <p className="text-xs text-gray-400">Request ID: {request._id.slice(-8)}</p>
                          </div>
                          <div className="flex space-x-2">
                            <span className={`px-3 py-1 text-sm rounded-full ${
                              request.priority === 'Critical' ? 'bg-red-100 text-red-800' :
                              request.priority === 'High' ? 'bg-orange-100 text-orange-800' :
                              request.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {request.priority} Priority
                            </span>
                            <span className={`px-3 py-1 text-sm rounded-full ${
                              request.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                              request.status === 'Approved' ? 'bg-green-100 text-green-800' :
                              request.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                              request.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {request.status}
                            </span>
                          </div>
                        </div>

                        <div className="mb-4">
                          <p className="text-gray-700 mb-2"><strong>Request Type:</strong> {request.requestType}</p>
                          <p className="text-gray-700 mb-2"><strong>Description:</strong> {request.description}</p>
                          <p className="text-gray-700 mb-2"><strong>Water Level:</strong> {request.waterLevel}</p>
                          <p className="text-gray-700 mb-2"><strong>Brigade ID:</strong> {request.brigadeId}</p>
                          {request.coordinates && (
                            <p className="text-gray-700 text-sm">
                              <strong>Location:</strong> {request.coordinates.lat.toFixed(4)}, {request.coordinates.lng.toFixed(4)}
                            </p>
                          )}
                        </div>

                        {request.status === 'Pending' && (
                          <div className="flex space-x-3">
                            <button 
                              onClick={() => handleEmergencyRequestAction(request._id, 'approve')}
                              className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-colors duration-200"
                            >
                              ✅ Approve Request
                            </button>
                            <button 
                              onClick={() => {
                                const reason = prompt('Enter rejection reason:');
                                if (reason) {
                                  handleEmergencyRequestAction(request._id, 'reject', reason);
                                }
                              }}
                              className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition-colors duration-200"
                            >
                              ❌ Reject Request
                            </button>
                            <button className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors duration-200">
                              🗺️ Find Nearest Branch
                            </button>
                          </div>
                        )}

                        {request.status === 'Approved - Sent to Branch Manager' && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <p className="text-blue-800">
                              ✅ Request approved and sent to branch manager for driver assignment.
                            </p>
                            <p className="text-blue-700 text-sm mt-2">
                              Branch manager will assign an available driver from their branch.
                            </p>
                          </div>
                        )}

                        {request.status === 'In Progress' && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <p className="text-blue-800">
                              🚚 Water delivery in progress. Driver assigned and en route.
                            </p>
                            {request.assignedDriver && (
                              <p className="text-blue-700 text-sm mt-2">
                                <strong>Assigned Driver:</strong> {request.assignedDriver.name}
                              </p>
                            )}
                            {request.adminNotes && (
                              <p className="text-blue-700 text-sm mt-2">
                                <strong>Admin Notes:</strong> {request.adminNotes}
                              </p>
                            )}
                          </div>
                        )}

                        {request.status === 'Rejected' && (
                          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <p className="text-red-800">
                              ❌ Request rejected.
                            </p>
                            {request.adminNotes && (
                              <p className="text-red-700 text-sm mt-2">
                                <strong>Reason:</strong> {request.adminNotes}
                              </p>
                            )}
                          </div>
                        )}

                        {request.status === 'In Progress' && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <p className="text-blue-800">
                              🔄 Request in progress. Water supply is being delivered.
                            </p>
                          </div>
                        )}

                        {request.status === 'Completed' && (
                          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                            <p className="text-gray-800">
                              ✅ Request completed successfully.
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}


            {activeTab === 'users' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Customer Management</h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={generateCustomersPDF}
                      className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition-colors duration-200"
                    >
                      📄 Download PDF
                    </button>
                    <button 
                      onClick={fetchCustomers}
                      className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors duration-200"
                    >
                      🔄 Refresh
                    </button>
                  </div>
                </div>

                {/* Customer Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                  <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-blue-500">
                    <div className="flex items-center">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <span className="text-2xl">👥</span>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Total Customers</p>
                        <p className="text-2xl font-semibold text-gray-900">{customers.length}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-green-500">
                    <div className="flex items-center">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <span className="text-2xl">✅</span>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Active Customers</p>
                        <p className="text-2xl font-semibold text-gray-900">
                          {customers.filter(customer => customer.isActive).length}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-red-500">
                    <div className="flex items-center">
                      <div className="p-2 bg-red-100 rounded-lg">
                        <span className="text-2xl">❌</span>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Inactive Customers</p>
                        <p className="text-2xl font-semibold text-gray-900">
                          {customers.filter(customer => !customer.isActive).length}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-purple-500">
                    <div className="flex items-center">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <span className="text-2xl">⭐</span>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Avg Recycling Points</p>
                        <p className="text-2xl font-semibold text-gray-900">
                          {customers.length > 0 ? 
                            Math.round(customers.reduce((sum, customer) => sum + (customer.recyclingPoints || 0), 0) / customers.length) : 0
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Customer Details Table */}
                <div className="bg-white rounded-lg shadow-sm">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h4 className="text-lg font-semibold text-gray-900">All Customers</h4>
                    <p className="text-sm text-gray-600">Complete customer information and details</p>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer Details</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact Info</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recycling Info</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Join Date</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {customers.length > 0 ? (
                          customers.map((customer, index) => (
                            <tr key={customer._id || `customer-${index}`} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="flex-shrink-0 h-10 w-10">
                                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                      <span className="text-sm font-medium text-blue-600">
                                        {customer.name ? customer.name.charAt(0).toUpperCase() : 'C'}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="ml-4">
                                    <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                                    <div className="text-sm text-gray-500">ID: {customer._id.slice(-8)}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">{customer.email}</div>
                                <div className="text-sm text-gray-500">{customer.phone || 'No phone'}</div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-sm text-gray-900 max-w-xs truncate">
                                  {customer.address || 'No address provided'}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  <div className="flex items-center">
                                    <span className="text-lg mr-1">⭐</span>
                                    {customer.recyclingPoints || 0} points
                                  </div>
                                </div>
                                <div className="text-sm text-gray-500">
                                  {customer.recyclingHistory ? customer.recyclingHistory.length : 0} transactions
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  customer.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                }`}>
                                  {customer.isActive ? 'Active' : 'Inactive'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {customer.createdAt ? new Date(customer.createdAt).toLocaleDateString() : 'N/A'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <div className="flex space-x-2">
                                  <button 
                                    onClick={() => {
                                      // Toggle customer status
                                      const newStatus = !customer.isActive;
                                      const action = newStatus ? 'activate' : 'deactivate';
                                      if (window.confirm(`Are you sure you want to ${action} this customer?`)) {
                                        handleToggleCustomerStatus(customer._id, customer.isActive);
                                      }
                                    }}
                                    className={`px-3 py-1 text-xs rounded-full ${
                                      customer.isActive 
                                        ? 'bg-red-100 text-red-800 hover:bg-red-200' 
                                        : 'bg-green-100 text-green-800 hover:bg-green-200'
                                    }`}
                                  >
                                    {customer.isActive ? 'Deactivate' : 'Activate'}
                                  </button>
                                  <button 
                                    onClick={() => {
                                      // View customer details
                                      alert(`Customer Details:\n\nName: ${customer.name}\nEmail: ${customer.email}\nPhone: ${customer.phone || 'N/A'}\nAddress: ${customer.address || 'N/A'}\nRecycling Points: ${customer.recyclingPoints || 0}\nStatus: ${customer.isActive ? 'Active' : 'Inactive'}\nJoin Date: ${customer.createdAt ? new Date(customer.createdAt).toLocaleDateString() : 'N/A'}`);
                                    }}
                                    className="px-3 py-1 text-xs rounded-full bg-blue-100 text-blue-800 hover:bg-blue-200"
                                  >
                                    View Details
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="7" className="px-6 py-12 text-center">
                              <div className="text-4xl mb-4">👥</div>
                              <h4 className="text-lg font-medium text-gray-900 mb-2">No Customers Found</h4>
                              <p className="text-gray-600">No customers are currently registered in the system.</p>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Customer Activity Summary */}
                {customers.length > 0 && (
                  <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Customer Activity Summary</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h5 className="font-medium text-gray-900 mb-2">Recent Registrations</h5>
                        <p className="text-sm text-gray-600">
                          {customers.filter(customer => {
                            const weekAgo = new Date();
                            weekAgo.setDate(weekAgo.getDate() - 7);
                            return new Date(customer.createdAt) > weekAgo;
                          }).length} customers joined this week
                        </p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h5 className="font-medium text-gray-900 mb-2">Top Recyclers</h5>
                        <p className="text-sm text-gray-600">
                          {customers.length > 0 ? 
                            customers.reduce((max, customer) => 
                              (customer.recyclingPoints || 0) > (max.recyclingPoints || 0) ? customer : max
                            ).name : 'N/A'
                          } leads with {customers.length > 0 ? 
                            Math.max(...customers.map(c => c.recyclingPoints || 0)) : 0
                          } points
                        </p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h5 className="font-medium text-gray-900 mb-2">Average Activity</h5>
                        <p className="text-sm text-gray-600">
                          {customers.length > 0 ? 
                            Math.round(customers.reduce((sum, customer) => 
                              sum + (customer.recyclingHistory ? customer.recyclingHistory.length : 0), 0
                            ) / customers.length) : 0
                          } recycling transactions per customer
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'recycling' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">🌱 Recycling System Management</h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={generateRecyclingPDF}
                      className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition-colors duration-200"
                    >
                      📄 Download PDF
                    </button>
                  </div>
                </div>

                {/* Recycling Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-green-500">
                    <div className="flex items-center">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <span className="text-2xl">🌱</span>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Total Requests</p>
                        <p className="text-2xl font-semibold text-gray-900">
                          {recyclingStats?.totalRequests || 0}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-yellow-500">
                    <div className="flex items-center">
                      <div className="p-2 bg-yellow-100 rounded-lg">
                        <span className="text-2xl">⏳</span>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Pending</p>
                        <p className="text-2xl font-semibold text-gray-900">
                          {recyclingStats?.pendingRequests || 0}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-blue-500">
                    <div className="flex items-center">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <span className="text-2xl">📊</span>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Total Weight</p>
                        <p className="text-2xl font-semibold text-gray-900">
                          {recyclingStats?.totalWeight || 0} kg
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-purple-500">
                    <div className="flex items-center">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <span className="text-2xl">⭐</span>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Total Points</p>
                        <p className="text-2xl font-semibold text-gray-900">
                          {recyclingStats?.totalPoints || 0}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* All Recycling Requests */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">All Recycling Requests</h4>
                  
                  {recyclingRequests.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Request ID
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Customer
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Branch
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Weight
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Date
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {recyclingRequests.map((request, index) => (
                            <tr key={request._id || `recycling-request-${index}`} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {request.requestId}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">{request.customerName}</div>
                                <div className="text-sm text-gray-500">{request.customerEmail}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">{request.branchName}</div>
                                <div className="text-sm text-gray-500">{request.branchLocation}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {request.wasteWeight} kg
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 py-1 text-xs rounded-full ${
                                  request.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                                  request.status === 'Approved' ? 'bg-green-100 text-green-800' :
                                  request.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                                  'bg-blue-100 text-blue-800'
                                }`}>
                                  {request.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {new Date(request.requestDate).toLocaleDateString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="text-4xl mb-2">🌱</div>
                      <p className="text-gray-500">No recycling requests found</p>
                      <p className="text-sm text-gray-400">Recycling requests will appear here</p>
                    </div>
                  )}
                </div>


              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Employee Modal */}
      {showEditModal && editingEmployee && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Employee</h3>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const updatedEmployee = {
                  ...editingEmployee,
                  name: formData.get('name'),
                  email: formData.get('email'),
                  phone: formData.get('phone'),
                  address: formData.get('address'),
                  branchName: formData.get('branchName'),
                  isActive: formData.get('isActive') === 'true'
                };
                handleUpdateEmployee(updatedEmployee);
              }}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                  <input
                    type="text"
                    name="name"
                    defaultValue={editingEmployee.name}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    name="email"
                    defaultValue={editingEmployee.email}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                  <input
                    type="text"
                    name="phone"
                    defaultValue={editingEmployee.phone || ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                  <input
                    type="text"
                    name="address"
                    defaultValue={editingEmployee.address || ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Branch</label>
                  <input
                    type="text"
                    name="branchName"
                    defaultValue={editingEmployee.branchName || ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    name="isActive"
                    defaultValue={editingEmployee.isActive ? 'true' : 'false'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingEmployee(null);
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                  >
                    Update Employee
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;
