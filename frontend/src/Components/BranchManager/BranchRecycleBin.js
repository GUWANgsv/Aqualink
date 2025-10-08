import React, { useState, useEffect } from 'react';
import axios from 'axios';

function BranchRecycleBin({ branchId, branchName }) {
  const [bin, setBin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [formData, setFormData] = useState({
    currentLevel: '',
    notes: ''
  });
  
  // New state for recycling requests
  const [recyclingRequests, setRecyclingRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [approvalLoading, setApprovalLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  
  // State for collection requests
  const [collectionRequests, setCollectionRequests] = useState([]);
  const [collectionRequestsLoading, setCollectionRequestsLoading] = useState(true);

  useEffect(() => {
    fetchBin();
    fetchRecyclingRequests();
    fetchCollectionRequests();
  }, []);

  const fetchBin = async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching recycling bin for branch:', branchId);
      
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('❌ No authentication token found');
        return;
      }
      
      // If branchId is the default fallback, try to get all bins and find the first one
      let response;
      if (branchId === 'BRANCH001') {
        console.log('⚠️  Using fallback branchId, fetching all bins');
        response = await axios.get(`http://localhost:5000/RecyclingBins`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      } else {
        response = await axios.get(`http://localhost:5000/RecyclingBins/branch/${branchId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      }
      
      const bins = response.data.bins || [];
      console.log('✅ Recycling bin response:', response.data);
      console.log('📊 Bin data received:', bins.length > 0 ? {
        binId: bins[0].binId,
        _id: bins[0]._id,
        currentLevel: bins[0].currentLevel,
        capacity: bins[0].capacity,
        fillPercentage: bins[0].fillPercentage,
        status: bins[0].status,
        fullObject: bins[0]
      } : 'No bins');
      
      if (bins.length === 0) {
        console.log('⚠️  No recycling bin found for this branch');
        setBin(null);
      } else {
        // Use the first (and only) bin
        setBin(bins[0]);
        console.log('✅ Using bin:', bins[0].binId, 'with level:', bins[0].currentLevel + 'kg/' + bins[0].capacity + 'kg');
      }
    } catch (error) {
      console.error('❌ Error fetching recycling bin:', error);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
      setBin(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecyclingRequests = async () => {
    try {
      setRequestsLoading(true);
      console.log('🔍 Fetching recycling requests for branch:', branchId);
      
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('❌ No authentication token found');
        return;
      }
      
      // If branchId is the default fallback, try to get all requests
      let response;
      if (branchId === 'BRANCH001') {
        console.log('⚠️  Using fallback branchId, fetching all requests');
        response = await axios.get(`http://localhost:5000/RecyclingRequests`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      } else {
        response = await axios.get(`http://localhost:5000/RecyclingRequests/branch/${branchId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      }
      
      console.log('✅ Recycling requests response:', response.data);
      setRecyclingRequests(response.data.requests || []);
    } catch (error) {
      console.error('❌ Error fetching recycling requests:', error);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
      setRecyclingRequests([]);
    } finally {
      setRequestsLoading(false);
    }
  };

  const fetchCollectionRequests = async () => {
    try {
      setCollectionRequestsLoading(true);
      console.log('🔍 Fetching collection requests for branch:', branchId);
      
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('❌ No authentication token found');
        return;
      }
      
      const response = await axios.get(`http://localhost:5000/RecyclingRequests/collection/branch/${branchId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Collection requests response:', response.data);
      setCollectionRequests(response.data.requests || []);
    } catch (error) {
      console.error('❌ Error fetching collection requests:', error);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
      setCollectionRequests([]);
    } finally {
      setCollectionRequestsLoading(false);
    }
  };

  const handleApproveRequest = async (requestId) => {
    try {
      setApprovalLoading(true);
      console.log('🔄 Approving recycling request:', requestId);
      
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('❌ No authentication token found');
        return;
      }
      
      const response = await axios.put(`http://localhost:5000/RecyclingRequests/${requestId}/approve`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Approval API response:', response.data);
      
      // Force refresh both bin and requests data with a small delay
      setTimeout(async () => {
        console.log('🔄 Refreshing bin and requests data...');
        await Promise.all([fetchBin(), fetchRecyclingRequests()]);
        console.log('✅ Data refreshed successfully');
      }, 500);
      
      // Show success message
      showNotification('Recycling request approved successfully! The bin has been updated.', 'success');
      console.log('✅ Recycling request approved successfully');
    } catch (error) {
      console.error('❌ Error approving recycling request:', error);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
      showNotification('Failed to approve recycling request. Please try again.', 'error');
    } finally {
      setApprovalLoading(false);
    }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      setApprovalLoading(true);
      console.log('🔄 Rejecting recycling request:', requestId);
      
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('❌ No authentication token found');
        return;
      }
      
      await axios.put(`http://localhost:5000/RecyclingRequests/${requestId}/reject`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Refresh requests data
      await fetchRecyclingRequests();
      
      showNotification('Recycling request rejected successfully.', 'success');
      console.log('✅ Recycling request rejected successfully');
    } catch (error) {
      console.error('❌ Error rejecting recycling request:', error);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
      showNotification('Failed to reject recycling request. Please try again.', 'error');
    } finally {
      setApprovalLoading(false);
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.currentLevel || formData.currentLevel < 0) {
      errors.currentLevel = 'Current level must be a non-negative number';
    }

    if (parseInt(formData.currentLevel) > 100) {
      errors.currentLevel = 'Current level cannot exceed 100kg capacity';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    
    try {
      const binData = {
        notes: formData.notes
      };

      await axios.put(`http://localhost:5000/RecyclingBins/${bin._id}`, binData);
      setShowUpdateModal(false);
      resetForm();
      fetchBin();
    } catch (error) {
      console.error('Error updating bin notes:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      currentLevel: '',
      notes: ''
    });
    setFormErrors({});
  };

  const openUpdateModal = () => {
    setFormData({
      currentLevel: bin.currentLevel.toString(),
      notes: bin.notes || ''
    });
    setShowUpdateModal(true);
  };

  const requestCollection = async (requestType) => {
    try {
      // Validate required data
      if (!branchId) {
        alert('Error: Branch ID is missing. Please refresh the page.');
        return;
      }
      
      if (!bin || !bin._id) {
        alert('Error: Bin information is missing. Please refresh the page.');
        console.error('Bin data:', bin);
        return;
      }

      // Log the exact IDs being used
      console.log('🔍 IDs being used:', {
        branchId: branchId,
        branchIdType: typeof branchId,
        binId: bin._id,
        binIdType: typeof bin._id,
        binIdString: bin.binId,
        fullBinObject: bin
      });

      const token = localStorage.getItem('token');
      if (!token) {
        alert('Error: Authentication token is missing. Please log in again.');
        return;
      }

      console.log('🔄 Creating collection request with data:', {
        branchId,
        binId: bin._id,
        binIdString: bin.binId,
        requestType,
        binInfo: {
          branchName: bin.branchName,
          location: bin.location,
          currentLevel: bin.currentLevel,
          capacity: bin.capacity
        }
      });

      const response = await axios.post('http://localhost:5000/RecyclingRequests/collection', {
        branchId: branchId,
        binId: bin._id, // Use MongoDB _id, not the string binId
        requestType: requestType,
        notes: `Collection request for ${requestType.toLowerCase()}`
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ Collection request response:', response.data);

      if (response.data.success) {
        alert(`Collection request submitted successfully! Request ID: ${response.data.request.requestId}`);
        fetchBin();
        fetchCollectionRequests();
      } else {
        alert(`Error: ${response.data.message || 'Unknown error occurred'}`);
      }
    } catch (error) {
      console.error('❌ Error creating collection request:', error);
      
      // Provide more specific error messages
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
        
        if (error.response.status === 401) {
          alert('Authentication failed. Please log in again.');
        } else if (error.response.status === 404) {
          alert('Recycling bin not found. Please refresh the page.');
        } else if (error.response.status === 400) {
          alert(`Error: ${error.response.data.message || 'Invalid request data'}`);
        } else if (error.response.status === 500) {
          alert('Server error. Please try again later.');
        } else {
          alert(`Error: ${error.response.data.message || 'Failed to create collection request'}`);
        }
      } else if (error.request) {
        console.error('Request error:', error.request);
        alert('Network error. Please check your connection and try again.');
      } else {
        console.error('Error:', error.message);
        alert('Failed to create collection request. Please try again.');
      }
    }
  };

  const emptyBin = async () => {
    const confirmEmpty = window.confirm('Are you sure you want to request bin collection? This will send a request to the factory manager.');
    if (confirmEmpty) {
      await requestCollection('Empty Bin');
    }
  };

  const notifyFactory = async () => {
    const confirmNotify = window.confirm('Are you sure you want to request bin collection? This will send a request to the factory manager.');
    if (confirmNotify) {
      await requestCollection('90% Full');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Empty': return 'bg-green-100 text-green-800';
      case 'Low': return 'bg-blue-100 text-blue-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'High': return 'bg-orange-100 text-orange-800';
      case 'Critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getFillLevelColor = (percentage) => {
    if (percentage >= 80) return 'text-red-600';
    if (percentage >= 60) return 'text-orange-600';
    if (percentage >= 40) return 'text-yellow-600';
    if (percentage >= 20) return 'text-blue-600';
    return 'text-green-600';
  };

  const getProgressBarColor = (percentage) => {
    if (percentage >= 80) return 'bg-red-500';
    if (percentage >= 60) return 'bg-orange-500';
    if (percentage >= 40) return 'bg-yellow-500';
    if (percentage >= 20) return 'bg-blue-500';
    return 'bg-green-500';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!bin) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No recycling bin found for this branch.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Notification */}
      {notification && (
        <div className={`mb-4 p-4 rounded-lg ${
          notification.type === 'success' 
            ? 'bg-green-100 border border-green-400 text-green-700' 
            : 'bg-red-100 border border-red-400 text-red-700'
        }`}>
          <div className="flex items-center">
            <span className="mr-2">
              {notification.type === 'success' ? '✅' : '❌'}
            </span>
            {notification.message}
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Branch Recycling Bin</h2>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-600">
            Branch: {branchName}
          </div>
          <button
            onClick={() => Promise.all([fetchBin(), fetchRecyclingRequests()])}
            disabled={loading || requestsLoading}
            className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors disabled:opacity-50"
          >
            {loading || requestsLoading ? '🔄 Refreshing...' : '🔄 Refresh All'}
          </button>
        </div>
      </div>

      {/* Single Bin Display */}
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-2xl font-semibold text-gray-900">{bin.binId}</h3>
              <p className="text-lg text-gray-600">{bin.location}</p>
            </div>
            <span className={`inline-flex px-3 py-2 text-sm font-semibold rounded-full ${getStatusColor(bin.status)}`}>
              {bin.status}
            </span>
          </div>

          {/* Fill Level Progress */}
          <div className="mb-8">
            <div className="flex justify-between text-lg mb-3">
              <span className="text-gray-700 font-medium">Fill Level</span>
              <span className={`font-bold text-xl ${getFillLevelColor(bin.fillPercentage)}`}>
                {bin.fillPercentage.toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div
                className={`h-4 rounded-full transition-all duration-300 ${getProgressBarColor(bin.fillPercentage)}`}
                style={{ width: `${bin.fillPercentage}%` }}
              ></div>
            </div>
          </div>

          {/* Capacity Information */}
          <div className="grid grid-cols-2 gap-8 text-center mb-8">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-600 text-sm font-medium">Capacity</p>
              <p className="text-2xl font-bold text-blue-600">{bin.capacity} kg</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-600 text-sm font-medium">Current Level</p>
              <p className="text-2xl font-bold text-green-600">{bin.currentLevel} kg</p>
            </div>
          </div>

          {/* Status Information */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="text-2xl">🌱</span>
              </div>
              <div className="ml-3">
                <h4 className="text-sm font-medium text-blue-800">Recycling Status</h4>
                <p className="text-sm text-blue-700">
                  {bin.fillPercentage >= 80 
                    ? 'Critical: Bin is nearly full. Factory has been notified.' 
                    : bin.fillPercentage >= 60 
                    ? 'High: Bin is getting full. Monitor closely.'
                    : bin.fillPercentage >= 40 
                    ? 'Medium: Bin is moderately filled.'
                    : bin.fillPercentage >= 20 
                    ? 'Low: Bin has some capacity remaining.'
                    : 'Empty: Bin is ready for recycling.'
                  }
                </p>
              </div>
            </div>
          </div>

          {bin.notes && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 font-medium mb-2">Notes:</p>
              <p className="text-sm text-gray-900">{bin.notes}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-4">
            <button
              onClick={openUpdateModal}
              className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Update Notes
            </button>
            <button
              onClick={emptyBin}
              className="flex-1 bg-green-600 text-white px-4 py-3 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
            >
              Request Collection
            </button>
            {bin.fillPercentage >= 80 && !bin.isNotified && (
              <button
                onClick={notifyFactory}
                className="flex-1 bg-red-600 text-white px-4 py-3 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
              >
                Request Collection (90% Full)
              </button>
            )}
          </div>

          {/* Information about automatic filling */}
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center">
              <span className="text-blue-600 mr-2">ℹ️</span>
              <span className="text-sm text-blue-800">
                <strong>Note:</strong> Bin filling happens automatically when customers submit recycling requests. 
                Branch managers can only monitor and manage the bin status.
              </span>
            </div>
          </div>

          {bin.isNotified && (
            <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-center">
                <span className="text-orange-600 mr-2">🔔</span>
                <span className="text-sm text-orange-800 font-medium">
                  Factory has been notified about this bin
                </span>
              </div>
            </div>
          )}

          {/* Last Updated Info */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              Last updated: {new Date(bin.updatedAt).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Customer Recycling Requests Section */}
      <div className="mt-8 max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold text-gray-900">Customer Recycling Requests</h3>
            <button
              onClick={fetchRecyclingRequests}
              disabled={requestsLoading}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              {requestsLoading ? 'Refreshing...' : '🔄 Refresh'}
            </button>
          </div>

          {requestsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : recyclingRequests.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No recycling requests found for this branch.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Waste Weight
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Points Earned
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Request Date
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
                  {recyclingRequests.map((request) => (
                    <tr key={request._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{request.customerName}</div>
                          <div className="text-sm text-gray-500">{request.customerEmail}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 font-medium">
                          {request.wasteWeight} kg
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {request.pointsEarned} points
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatDate(request.requestDate)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(request.status)}`}>
                          {request.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {request.status === 'Pending' && (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleApproveRequest(request._id)}
                              disabled={approvalLoading}
                              className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors disabled:opacity-50"
                            >
                              {approvalLoading ? 'Processing...' : '✅ Approve'}
                            </button>
                            <button
                              onClick={() => handleRejectRequest(request._id)}
                              disabled={approvalLoading}
                              className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors disabled:opacity-50"
                            >
                              {approvalLoading ? 'Processing...' : '❌ Reject'}
                            </button>
                          </div>
                        )}
                        {request.status === 'Approved' && (
                          <span className="text-green-600 font-medium">✓ Approved</span>
                        )}
                        {request.status === 'Rejected' && (
                          <span className="text-red-600 font-medium">✗ Rejected</span>
                        )}
                        {request.status === 'Completed' && (
                          <span className="text-blue-600 font-medium">✓ Completed</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Information about the approval process */}
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center">
              <span className="text-green-600 mr-2">💡</span>
              <span className="text-sm text-green-800">
                <strong>How it works:</strong> When you approve a recycling request, the waste weight is automatically 
                added to the bin's current level. The bin will fill up based on the total weight of approved requests.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Collection Requests Section */}
      <div className="mt-8 max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold text-gray-900">Collection Requests</h3>
            <button
              onClick={fetchCollectionRequests}
              disabled={collectionRequestsLoading}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              {collectionRequestsLoading ? 'Refreshing...' : '🔄 Refresh'}
            </button>
          </div>

          {collectionRequestsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : collectionRequests.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No collection requests found for this branch.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Request ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Bin Level
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Request Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Notes
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {collectionRequests.map((request) => (
                    <tr key={request._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {request.requestId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          request.status === 'Pending' 
                            ? 'bg-yellow-100 text-yellow-800'
                            : request.status === 'Approved'
                            ? 'bg-green-100 text-green-800'
                            : request.status === 'Completed'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {request.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(request.requestDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {request.notes || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Information about collection requests */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center">
              <span className="text-blue-600 mr-2">ℹ️</span>
              <span className="text-sm text-blue-800">
                <strong>Collection Requests:</strong> When you request collection, it sends a request to the factory manager. 
                The factory manager will approve and empty the bin, then update the status here.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Update Bin Modal */}
      {showUpdateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Update Bin Notes</h3>
              <form onSubmit={handleUpdate}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Bin ID</label>
                    <input
                      type="text"
                      value={bin.binId}
                      disabled
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Location</label>
                    <input
                      type="text"
                      value={bin.location}
                      disabled
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Capacity</label>
                    <input
                      type="text"
                      value={`${bin.capacity} kg`}
                      disabled
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Current Level</label>
                    <input
                      type="text"
                      value={`${bin.currentLevel} kg (${bin.fillPercentage.toFixed(1)}%)`}
                      disabled
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-100"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Level is automatically updated when customers submit recycling requests
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Notes</label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      rows="3"
                      placeholder="Optional notes about this bin"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowUpdateModal(false);
                      resetForm();
                    }}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Update Notes
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default BranchRecycleBin;
