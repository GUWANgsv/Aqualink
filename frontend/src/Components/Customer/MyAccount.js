import React, { useState, useEffect } from 'react';
import { useAuth } from '../../Context/AuthContext';
import UniversalNavbar from '../Nav/UniversalNavbar';
import axios from 'axios';
import { customerPurchaseAPI, userAPI } from '../../utils/apiService';

const MyAccount = () => {
  const { user, isAuthenticated, refreshUser } = useAuth();
  
  // Debug logging
  console.log('MyAccount component - User data:', user);
  console.log('MyAccount component - User profilePicture:', user?.profilePicture);
  console.log('MyAccount component - User keys:', user ? Object.keys(user) : 'No user data');
  console.log('MyAccount component - Profile picture type:', typeof user?.profilePicture);
  console.log('MyAccount component - Profile picture value:', user?.profilePicture);
  
  // Customer dashboard state
  const [activeTab, setActiveTab] = useState('dashboard');
  const [branches, setBranches] = useState([]);
  const [recyclingRequests, setRecyclingRequests] = useState([]);
  const [orderHistory, setOrderHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [formData, setFormData] = useState({
    branchId: '',
    wasteWeight: '',
    notes: ''
  });
  const [branchesLoading, setBranchesLoading] = useState(false);

  // Profile editing state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileFormData, setProfileFormData] = useState({
    email: '',
    phone: '',
    address: ''
  });
  const [profilePictureFile, setProfilePictureFile] = useState(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [phoneError, setPhoneError] = useState('');

  // Customer dashboard functions
  useEffect(() => {
    if (isAuthenticated() && user?.role === 'Customer') {
      fetchBranches();
      if (user && user._id) {
        fetchRecyclingRequests();
        fetchOrderHistory();
      }
    }
  }, [user, isAuthenticated]);

  // Initialize profile form data when user data is available
  useEffect(() => {
    if (user) {
      setProfileFormData({
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || ''
      });
      // Set profile picture preview if user has one
      if (user.profilePicture) {
        setProfilePicturePreview(user.profilePicture);
      }
    }
  }, [user]);

  // Reset form data when exiting edit mode
  useEffect(() => {
    if (!isEditingProfile && user) {
      setProfileFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || ''
      });
    }
  }, [isEditingProfile, user]);

  // Handle navigation to profile tab from navbar
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tab = urlParams.get('tab');
    if (tab === 'profile' && isAuthenticated() && user?.role === 'Customer') {
      setActiveTab('profile');
    }
  }, [isAuthenticated, user]);

  const fetchBranches = async () => {
    try {
      setBranchesLoading(true);
      const response = await axios.get('http://localhost:5000/public/branches');
      if (response.data.success) {
        setBranches(response.data.branches);
      }
    } catch (error) {
      console.error('Error fetching branches:', error);
    } finally {
      setBranchesLoading(false);
    }
  };

  const fetchRecyclingRequests = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5000/RecyclingRequests/customer/${user._id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.data.success) {
        setRecyclingRequests(response.data.requests);
      }
    } catch (error) {
      console.error('Error fetching recycling requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderHistory = async () => {
    try {
      setOrdersLoading(true);
      const response = await customerPurchaseAPI.getCustomerOrders(user._id);
      if (response.success) {
        setOrderHistory(response.purchases || []);
      }
    } catch (error) {
      console.error('Error fetching order history:', error);
    } finally {
      setOrdersLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Validate phone number (exactly 10 digits)
  const validatePhoneNumber = (phone) => {
    const phoneRegex = /^\d{10}$/;
    return phoneRegex.test(phone);
  };

  const handleProfileInputChange = (e) => {
    const { name, value } = e.target;
    setProfileFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Validate phone number in real-time
    if (name === 'phone') {
      if (value && !validatePhoneNumber(value)) {
        setPhoneError('Phone number must be exactly 10 digits');
      } else {
        setPhoneError('');
      }
    }
  };

  // Handle profile picture file selection
  const handleProfilePictureChange = (e) => {
    const file = e.target.files[0];
    console.log('Profile picture file selected:', file);
    
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select a valid image file');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size must be less than 5MB');
        return;
      }
      
      console.log('Setting profile picture file:', file.name, file.size, file.type);
      setProfilePictureFile(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfilePicturePreview(e.target.result);
        console.log('Profile picture preview created');
      };
      reader.readAsDataURL(file);
    } else {
      console.log('No file selected');
    }
  };

  const handleEditProfile = () => {
    setIsEditingProfile(true);
  };

  const handleCancelEdit = () => {
    setIsEditingProfile(false);
    // Reset form data to original user data
    setProfileFormData({
      email: user.email || '',
      phone: user.phone || '',
      address: user.address || ''
    });
    // Reset profile picture file and preview
    setProfilePictureFile(null);
    setProfilePicturePreview(user?.profilePicture || null);
    // Clear phone error
    setPhoneError('');
    // Clear file input
    const fileInput = document.getElementById('profilePicture');
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    
    // Validate phone number before submission
    if (profileFormData.phone && !validatePhoneNumber(profileFormData.phone)) {
      setPhoneError('Phone number must be exactly 10 digits');
      return;
    }
    
    try {
      setProfileLoading(true);
      
      let updateData;
      
      console.log('Profile picture file state:', profilePictureFile);
      console.log('Profile form data:', profileFormData);
      
      // If profile picture is selected, use FormData
      if (profilePictureFile) {
        updateData = new FormData();
        updateData.append('email', profileFormData.email);
        updateData.append('phone', profileFormData.phone);
        updateData.append('address', profileFormData.address);
        updateData.append('profilePicture', profilePictureFile);
        console.log('Using FormData for profile update with file:', profilePictureFile.name);
        console.log('FormData entries:');
        for (let [key, value] of updateData.entries()) {
          console.log(key, value);
        }
      } else {
        // Use regular object for text-only updates
        updateData = {
          email: profileFormData.email,
          phone: profileFormData.phone,
          address: profileFormData.address
        };
        console.log('Using regular object for profile update without file');
      }
      
      const response = await userAPI.updateOwnProfile(updateData);

      if (response.message === 'Profile updated successfully') {
        setUpdateSuccess(true);
        setIsEditingProfile(false);
        // Clear profile picture file and preview
        setProfilePictureFile(null);
        setProfilePicturePreview(user?.profilePicture || null);
        // Clear file input
        const fileInput = document.getElementById('profilePicture');
        if (fileInput) {
          fileInput.value = '';
        }
        // Refresh user data from the backend to get updated information
        await refreshUser();
        // Hide success message after 3 seconds
        setTimeout(() => setUpdateSuccess(false), 3000);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      if (error.response?.data?.message) {
        alert(`Error: ${error.response.data.message}`);
      } else if (error.response?.status === 401) {
        alert('Authentication failed. Please log in again.');
      } else {
        alert('Error updating profile. Please try again.');
      }
    } finally {
      setProfileLoading(false);
    }
  };

  const handleDeleteProfile = () => {
    setShowDeleteConfirm(true);
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  const handleConfirmDelete = async () => {
    try {
      setDeleteLoading(true);
      
      const response = await userAPI.deleteOwnProfile();

      if (response.message === 'Profile deleted successfully') {
        alert('Your profile has been deleted successfully. You will be logged out.');
        // Logout and redirect to home page
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Error deleting profile:', error);
      if (error.response?.data?.message) {
        alert(`Error: ${error.response.data.message}`);
      } else if (error.response?.status === 401) {
        alert('Authentication failed. Please log in again.');
      } else {
        alert('Error deleting profile. Please try again.');
      }
    } finally {
      setDeleteLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleRecyclingSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Debug: Check if user is logged in
      if (!token) {
        alert('Please log in to submit a recycling request');
        return;
      }
      
      if (!user) {
        alert('User information not available. Please refresh the page and try again.');
        return;
      }
      
      // Get branch details for the request
      const selectedBranch = branches.find(branch => branch._id === formData.branchId);
      if (!selectedBranch) {
        alert('Please select a valid branch');
        return;
      }
      
      const requestData = {
        customerId: user._id,
        customerName: user.name,
        customerEmail: user.email,
        branchId: formData.branchId,
        branchName: selectedBranch.name,
        branchLocation: selectedBranch.address || selectedBranch.location || 'Branch Location',
        wasteWeight: parseFloat(formData.wasteWeight),
        notes: formData.notes
      };
      
      const response = await axios.post('http://localhost:5000/RecyclingRequests', requestData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data.success) {
        alert('Recycling request submitted successfully! The branch manager will review your request.');
        setFormData({ branchId: '', wasteWeight: '', notes: '' });
        fetchRecyclingRequests(); // Refresh the list
      }
    } catch (error) {
      console.error('Error submitting recycling request:', error);
      if (error.response?.data?.message) {
        alert(`Error: ${error.response.data.message}`);
      } else if (error.response?.status === 401) {
        alert('Authentication failed. Please log in again.');
      } else if (error.response?.status === 403) {
        alert('Access denied. You do not have permission to submit recycling requests.');
      } else {
        alert('Error submitting recycling request. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Approved': return 'bg-green-100 text-green-800';
      case 'Completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getOrderStatusColor = (status) => {
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

  // Calculate order statistics
  const getOrderStats = () => {
    const total = orderHistory.length;
    const completed = orderHistory.filter(order => order.status === 'Delivered').length;
    const pending = orderHistory.filter(order => ['Pending', 'Processing', 'Assigned', 'On Delivery'].includes(order.status)).length;
    const cancelled = orderHistory.filter(order => order.status === 'Cancelled').length;
    
    return { total, completed, pending, cancelled };
  };

  // Redirect if not authenticated or not a customer
  if (!isAuthenticated() || user?.role !== 'Customer') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-800 via-teal-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Access Denied</h1>
          <p className="text-teal-200 mb-8">You need to be logged in as a customer to access this page.</p>
          <a href="/login" className="bg-teal-600 text-white px-6 py-3 rounded-lg hover:bg-teal-700 transition-colors">
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Universal Navbar */}
      <UniversalNavbar />

      {/* Main Content with top padding for fixed navbar */}
      <div className="pt-16">
        {/* Page Header */}
        <section className="py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              My <span className="text-teal-600">Account</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Manage your account, track orders, and access all your customer features
            </p>
          </div>
        </section>

        {/* Success Notification */}
        {updateSuccess && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Profile updated successfully!
            </div>
          </div>
        )}

        {/* Delete Profile Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900">Delete Profile</h3>
              </div>
              
              <div className="mb-6">
                <p className="text-gray-600 mb-4">
                  Are you sure you want to delete your profile? This action cannot be undone.
                </p>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800 text-sm font-medium mb-2">⚠️ This will permanently delete:</p>
                  <ul className="text-red-700 text-sm space-y-1">
                    <li>• Your account and personal information</li>
                    <li>• Your order history</li>
                    <li>• Your recycling points and history</li>
                    <li>• All associated data</li>
                  </ul>
                </div>
              </div>
              
              <div className="flex gap-4">
                <button
                  onClick={handleCancelDelete}
                  disabled={deleteLoading}
                  className="flex-1 px-4 py-3 bg-gray-500 text-white rounded-lg font-semibold hover:bg-gray-600 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  disabled={deleteLoading}
                  className="flex-1 px-4 py-3 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center"
                >
                  {deleteLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Deleting...
                    </>
                  ) : (
                    'Delete Profile'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Customer Dashboard Section */}
        <section className="py-8 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            {/* Customer Navigation */}
            <div className="bg-white shadow-lg rounded-2xl p-6 mb-8 border border-gray-100">
              <div className="flex flex-wrap justify-center gap-4">
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                    activeTab === 'dashboard'
                      ? 'bg-teal-600 text-white shadow-lg'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Dashboard
                </button>
                <button
                  onClick={() => setActiveTab('recycling')}
                  className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                    activeTab === 'recycling'
                      ? 'bg-teal-600 text-white shadow-lg'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  🌱 Recycling
                </button>
                <button
                  onClick={() => setActiveTab('orders')}
                  className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                    activeTab === 'orders'
                      ? 'bg-teal-600 text-white shadow-lg'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  My Orders
                </button>
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center ${
                    activeTab === 'profile'
                      ? 'bg-teal-600 text-white shadow-lg'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  My Profile
                </button>
              </div>
            </div>

            {/* Dashboard Content */}
            {activeTab === 'dashboard' && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white shadow-lg rounded-2xl p-6 text-center border border-gray-100">
                  <div className="text-4xl mb-4">🛍️</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Total Orders</h3>
                  <p className="text-3xl font-bold text-blue-600">{getOrderStats().total}</p>
                </div>
                <div className="bg-white shadow-lg rounded-2xl p-6 text-center border border-gray-100">
                  <div className="text-4xl mb-4">✅</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Completed</h3>
                  <p className="text-3xl font-bold text-green-600">{getOrderStats().completed}</p>
                </div>
                <div className="bg-white shadow-lg rounded-2xl p-6 text-center border border-gray-100">
                  <div className="text-4xl mb-4">⏳</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Pending</h3>
                  <p className="text-3xl font-bold text-yellow-600">{getOrderStats().pending}</p>
                </div>
                <div className="bg-white shadow-lg rounded-2xl p-6 text-center border border-gray-100">
                  <div className="text-4xl mb-4">🌱</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Points</h3>
                  <p className="text-3xl font-bold text-green-600">{user?.recyclingPoints || 0}</p>
                </div>
              </div>
            )}

            {/* Recycling Content */}
            {activeTab === 'recycling' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white shadow-lg rounded-2xl p-6 border border-gray-100">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Submit Recycling Request</h3>
                  <form onSubmit={handleRecyclingSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Select Branch *</label>
                      <select
                        name="branchId"
                        value={formData.branchId}
                        onChange={handleInputChange}
                        required
                        disabled={branchesLoading}
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                      >
                        <option value="">Choose a branch...</option>
                        {branches.map(branch => (
                          <option key={branch._id} value={branch._id} className="bg-white text-gray-900">
                            {branch.name} - {branch.address}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Waste Weight (kg) *</label>
                      <input
                        type="number"
                        name="wasteWeight"
                        value={formData.wasteWeight}
                        onChange={handleInputChange}
                        required
                        min="1"
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                        placeholder="Enter weight in kg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                      <textarea
                        name="notes"
                        value={formData.notes}
                        onChange={handleInputChange}
                        rows="3"
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                        placeholder="Any additional notes..."
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-teal-600 text-white py-2 px-4 rounded-lg hover:bg-teal-700 disabled:opacity-50 transition-colors"
                    >
                      {loading ? 'Submitting...' : 'Submit Request'}
                    </button>
                  </form>
                </div>

                <div className="bg-white shadow-lg rounded-2xl p-6 border border-gray-100">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-gray-900">Recycling History</h3>
                    <button
                      onClick={fetchRecyclingRequests}
                      disabled={loading}
                      className="flex items-center px-3 py-2 bg-teal-500 hover:bg-teal-600 disabled:bg-gray-500 text-white rounded-lg transition-colors duration-200 text-sm font-medium"
                    >
                      <svg 
                        className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={2} 
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
                        />
                      </svg>
                      {loading ? 'Refreshing...' : 'Refresh'}
                    </button>
                  </div>
                  {loading ? (
                    <p className="text-gray-500">Loading...</p>
                  ) : recyclingRequests.length === 0 ? (
                    <p className="text-gray-500">No recycling requests yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {recyclingRequests.map(request => (
                        <div key={request._id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="text-gray-900 font-medium">Request #{request._id.slice(-6)}</h4>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                              {request.status}
                            </span>
                          </div>
                          <p className="text-gray-600 text-sm">Weight: {request.wasteWeight} kg</p>
                          <p className="text-gray-600 text-sm">Date: {new Date(request.createdAt).toLocaleDateString()}</p>
                          {request.notes && (
                            <p className="text-gray-600 text-sm mt-1">Notes: {request.notes}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Orders Content */}
            {activeTab === 'orders' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-semibold text-gray-900">Order History</h3>
                  <button
                    onClick={fetchOrderHistory}
                    disabled={ordersLoading}
                    className="flex items-center px-4 py-2 bg-teal-500 hover:bg-teal-600 disabled:bg-gray-500 text-white rounded-lg transition-colors duration-200 text-sm font-medium"
                  >
                    <svg 
                      className={`w-4 h-4 mr-2 ${ordersLoading ? 'animate-spin' : ''}`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
                      />
                    </svg>
                    {ordersLoading ? 'Refreshing...' : 'Refresh'}
                  </button>
                </div>
                
                {ordersLoading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto"></div>
                    <p className="text-gray-500 mt-4">Loading order history...</p>
                  </div>
                ) : orderHistory.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">🛍️</div>
                    <h3 className="text-xl font-medium text-gray-900 mb-2">No Orders Yet</h3>
                    <p className="text-gray-500 mb-6">You haven't placed any orders yet.</p>
                    <a 
                      href="/products" 
                      className="inline-flex items-center px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                      Browse Products
                    </a>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orderHistory.map(order => (
                      <div key={order._id} className="bg-white shadow-lg rounded-2xl p-6 border border-gray-100">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-lg font-medium text-gray-900">Order #{order.purchaseNumber || order._id.slice(-8)}</h3>
                            <p className="text-sm text-gray-500">Ordered on: {new Date(order.purchaseDate).toLocaleDateString()}</p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getOrderStatusColor(order.status)}`}>
                            {order.status}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <h4 className="text-gray-900 font-medium mb-2">Items:</h4>
                            <div className="space-y-1">
                              {order.items.map((item, index) => (
                                <div key={index} className="text-gray-600 text-sm">
                                  {item.itemName} × {item.quantity} - Rs. {item.unitPrice}
                                </div>
                              ))}
                            </div>
                          </div>
                          <div>
                            <h4 className="text-gray-900 font-medium mb-2">Delivery Details:</h4>
                            <p className="text-gray-600 text-sm">
                              {order.deliveryAddress ? 
                                `${order.deliveryAddress.street}, ${order.deliveryAddress.city}` : 
                                'Address not provided'
                              }
                            </p>
                            {order.deliveryEndTime && (
                              <p className="text-gray-600 text-sm">
                                Delivered: {new Date(order.deliveryEndTime).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                          <div className="text-gray-600 text-sm">
                            Payment: {order.paymentMethod}
                          </div>
                          <div className="text-gray-900 font-semibold">
                            Total: Rs. {order.totalAmount?.toFixed(2) || '0.00'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Profile Content */}
            {activeTab === 'profile' && (
              <div className="space-y-8">
                {/* Profile Header */}
                <div className="relative bg-blue-50 rounded-3xl p-8 border border-blue-200 overflow-hidden">
                  {/* Background Pattern */}
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute inset-0" style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M20 20c0-5.5-4.5-10-10-10s-10 4.5-10 10 4.5 10 10 10 10-4.5 10-10zm10 0c0-5.5-4.5-10-10-10s-10 4.5-10 10 4.5 10 10 10 10-4.5 10-10z'/%3E%3C/g%3E%3C/svg%3E")`
                    }}></div>
                  </div>
                  
                  <div className="relative flex flex-col md:flex-row items-center md:items-start gap-8">
                    {/* Avatar Section */}
                    <div className="relative">
                      {user?.profilePicture ? (
                        <div className="w-32 h-32 rounded-full overflow-hidden shadow-2xl border-4 border-white/20">
                          <img
                            src={user.profilePicture}
                            alt="Profile"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              console.log('Profile picture failed to load:', user.profilePicture);
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                          {/* Fallback avatar (hidden by default) */}
                          <div className="w-full h-full bg-blue-500 flex items-center justify-center text-white text-4xl font-bold" style={{display: 'none'}}>
                            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                          </div>
                        </div>
                      ) : (
                        <div className="w-32 h-32 bg-blue-500 rounded-full flex items-center justify-center text-white text-4xl font-bold shadow-2xl border-4 border-white/20">
                          {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                      )}
                      <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full border-4 border-white/20 flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>

                    {/* User Info */}
                    <div className="flex-1 text-center md:text-left">
                      <h2 className="text-3xl font-bold text-gray-900 mb-2">{user?.name || 'User Name'}</h2>
                      <p className="text-gray-600 text-lg mb-4">{user?.email || 'user@example.com'}</p>
                      
                      {/* Status Badge */}
                      <div className="inline-flex items-center px-4 py-2 bg-green-100 border border-green-300 rounded-full text-green-700 mb-6">
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                        Active Member
                      </div>

                      {/* Quick Stats */}
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-cyan-600">{user?.recyclingPoints || 0}</div>
                          <div className="text-sm text-gray-600">Eco Points</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">{getOrderStats().total}</div>
                          <div className="text-sm text-gray-600">Total Orders</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">{getOrderStats().completed}</div>
                          <div className="text-sm text-gray-600">Completed</div>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-3">
                      <button 
                        onClick={handleEditProfile}
                        disabled={isEditingProfile}
                        className="px-6 py-3 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-600 hover:shadow-lg transition-all duration-300 flex items-center disabled:opacity-50"
                      >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        {isEditingProfile ? 'Editing...' : 'Edit Profile'}
                      </button>
                      <button 
                        onClick={handleDeleteProfile}
                        disabled={deleteLoading}
                        className="px-6 py-3 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition-all duration-300 flex items-center disabled:opacity-50"
                      >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        {deleteLoading ? 'Deleting...' : 'Delete Profile'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Profile Information Cards */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Personal Information */}
                  <div className="bg-white shadow-lg rounded-3xl p-8 border border-gray-100">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center">
                        <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center mr-4">
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900">Personal Information</h3>
                      </div>
                      {isEditingProfile && (
                        <div className="flex gap-2">
                          <button
                            onClick={handleCancelEdit}
                            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                    
                    {isEditingProfile ? (
                      <form onSubmit={handleUpdateProfile} className="space-y-6">
                        {/* Profile Picture Upload */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Profile Picture</label>
                          <div className="flex items-center space-x-4">
                            <div className="flex-shrink-0">
                              {profilePicturePreview ? (
                                <img
                                  className="h-20 w-20 rounded-full object-cover border-2 border-gray-300"
                                  src={profilePicturePreview}
                                  alt="Profile preview"
                                />
                              ) : (
                                <div className="h-20 w-20 rounded-full bg-gray-200 flex items-center justify-center border-2 border-gray-300">
                                  <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                  </svg>
                                </div>
                              )}
                            </div>
                            <div className="flex-1">
                              <input
                                id="profilePicture"
                                name="profilePicture"
                                type="file"
                                accept="image/*"
                                onChange={handleProfilePictureChange}
                                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                key="profile-picture-input"
                              />
                              <p className="mt-1 text-xs text-gray-500">
                                PNG, JPG, GIF up to 5MB
                              </p>
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Email Address *</label>
                          <input
                            type="email"
                            name="email"
                            value={profileFormData.email}
                            onChange={handleProfileInputChange}
                            required
                            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Enter your email address"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
                          <input
                            type="tel"
                            name="phone"
                            value={profileFormData.phone}
                            onChange={handleProfileInputChange}
                            required
                            className={`w-full px-4 py-3 bg-white border rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                              phoneError ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="Enter your phone number (10 digits)"
                          />
                          {phoneError && (
                            <p className="mt-1 text-sm text-red-600">{phoneError}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Address *</label>
                          <textarea
                            name="address"
                            value={profileFormData.address}
                            onChange={handleProfileInputChange}
                            required
                            rows="3"
                            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Enter your address"
                          />
                        </div>

                        <div className="flex gap-4">
                          <button
                            type="submit"
                            disabled={profileLoading}
                            className="flex-1 bg-blue-500 text-white py-3 px-6 rounded-xl font-semibold hover:bg-blue-600 disabled:opacity-50 transition-colors"
                          >
                            {profileLoading ? 'Updating...' : 'Update Profile'}
                          </button>
                          <button
                            type="button"
                            onClick={handleCancelEdit}
                            className="flex-1 bg-gray-500 text-white py-3 px-6 rounded-xl font-semibold hover:bg-gray-600 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div className="space-y-6">

                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                          <div className="flex items-center">
                            <svg className="w-5 h-5 text-cyan-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            <span className="text-gray-700">Email Address</span>
                          </div>
                          <span className="text-gray-900 font-medium">{user?.email || 'Not provided'}</span>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                          <div className="flex items-center">
                            <svg className="w-5 h-5 text-cyan-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            <span className="text-gray-700">Phone Number</span>
                          </div>
                          <span className="text-gray-900 font-medium">{user?.phone || 'Not provided'}</span>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                          <div className="flex items-center">
                            <svg className="w-5 h-5 text-cyan-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span className="text-gray-700">Address</span>
                          </div>
                          <span className="text-gray-900 font-medium">{user?.address || 'Not provided'}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Account Statistics */}
                  <div className="bg-white shadow-lg rounded-3xl p-8 border border-gray-100">
                    <div className="flex items-center mb-6">
                      <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center mr-4">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900">Account Statistics</h3>
                    </div>
                    
                    <div className="space-y-6">
                      <div className="p-6 bg-blue-50 rounded-xl border border-blue-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-gray-700">Eco Points</span>
                          <span className="text-2xl font-bold text-cyan-600">{user?.recyclingPoints || 0}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-cyan-500 h-2 rounded-full" style={{width: `${Math.min((user?.recyclingPoints || 0) / 100 * 100, 100)}%`}}></div>
                        </div>
                        <p className="text-sm text-gray-600 mt-2">Keep recycling to earn more points!</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 text-center">
                          <div className="text-2xl font-bold text-blue-600 mb-1">{getOrderStats().total}</div>
                          <div className="text-sm text-gray-600">Total Orders</div>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 text-center">
                          <div className="text-2xl font-bold text-green-600 mb-1">{getOrderStats().completed}</div>
                          <div className="text-sm text-gray-600">Completed</div>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 text-center">
                          <div className="text-2xl font-bold text-yellow-600 mb-1">{getOrderStats().pending}</div>
                          <div className="text-sm text-gray-600">Pending</div>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 text-center">
                          <div className="text-2xl font-bold text-red-600 mb-1">{getOrderStats().cancelled}</div>
                          <div className="text-sm text-gray-600">Cancelled</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Activity & Achievements */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Recent Activity */}
                  <div className="bg-white shadow-lg rounded-3xl p-8 border border-gray-100">
                    <div className="flex items-center mb-6">
                      <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center mr-4">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900">Recent Activity</h3>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex items-center p-4 bg-gray-50 rounded-xl border border-gray-200">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-4">
                          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <p className="text-gray-900 font-medium">Order #ORD-001 Delivered</p>
                          <p className="text-sm text-gray-500">2 hours ago</p>
                        </div>
                      </div>

                      <div className="flex items-center p-4 bg-gray-50 rounded-xl border border-gray-200">
                        <div className="w-10 h-10 bg-cyan-100 rounded-full flex items-center justify-center mr-4">
                          <svg className="w-5 h-5 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <p className="text-gray-900 font-medium">Recycling Request Submitted</p>
                          <p className="text-sm text-gray-500">1 day ago</p>
                        </div>
                      </div>

                      <div className="flex items-center p-4 bg-gray-50 rounded-xl border border-gray-200">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <p className="text-gray-900 font-medium">New Order Placed</p>
                          <p className="text-sm text-gray-500">3 days ago</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Achievements */}
                  <div className="bg-white shadow-lg rounded-3xl p-8 border border-gray-100">
                    <div className="flex items-center mb-6">
                      <div className="w-12 h-12 bg-yellow-500 rounded-xl flex items-center justify-center mr-4">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                        </svg>
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900">Achievements</h3>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex items-center p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                        <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center mr-4">
                          <span className="text-white text-xl">🏆</span>
                        </div>
                        <div className="flex-1">
                          <p className="text-gray-900 font-medium">First Order</p>
                          <p className="text-sm text-gray-600">Completed your first order</p>
                        </div>
                        <div className="w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>

                      <div className="flex items-center p-4 bg-green-50 rounded-xl border border-green-200">
                        <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mr-4">
                          <span className="text-white text-xl">🌱</span>
                        </div>
                        <div className="flex-1">
                          <p className="text-gray-900 font-medium">Eco Warrior</p>
                          <p className="text-sm text-gray-600">Recycled 10+ bottles</p>
                        </div>
                        <div className="w-6 h-6 bg-green-400 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>

                      <div className="flex items-center p-4 bg-gray-50 rounded-xl border border-gray-200">
                        <div className="w-12 h-12 bg-gray-500 rounded-full flex items-center justify-center mr-4">
                          <span className="text-white text-xl">💎</span>
                        </div>
                        <div className="flex-1">
                          <p className="text-gray-900 font-medium">VIP Member</p>
                          <p className="text-sm text-gray-500">Complete 50+ orders</p>
                        </div>
                        <div className="w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default MyAccount;
