import React, { useState, useEffect } from 'react';
import { emergencyRequestAPI } from '../../utils/apiService';
import axios from 'axios';

const BranchEmergency = ({ branchId, branchName, showNotification }) => {
  const [emergencyRequests, setEmergencyRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [processingRequest, setProcessingRequest] = useState(false);
  const [availableDrivers, setAvailableDrivers] = useState([]);
  const [showDriverModal, setShowDriverModal] = useState(false);

  useEffect(() => {
    console.log('🏢 BranchEmergency props:', { branchId, branchName });
    fetchEmergencyRequests();
    fetchAvailableDrivers();
  }, [branchId, branchName]);

  const fetchEmergencyRequests = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Fetch all emergency requests and filter for those sent to branch manager
      const response = await axios.get('http://localhost:5000/emergency-requests/all', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const allRequests = response.data.data || response.data || [];
      
      // Filter for requests that are approved and sent to branch manager
      const branchRequests = allRequests.filter(request => 
        request.status === 'Approved - Sent to Branch Manager' ||
        request.status === 'In Progress' ||
        request.status === 'Completed'
      );
      
      setEmergencyRequests(branchRequests);
    } catch (error) {
      console.error('Error fetching emergency requests:', error);
      showNotification('Failed to fetch emergency requests', 'error');
      setEmergencyRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableDrivers = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('🔍 Fetching drivers for branch:', { branchId, branchName });
      
      // Try to get drivers by branch name first (preferred method)
      try {
        const response = await axios.get(`http://localhost:5000/employees/drivers/branch/${encodeURIComponent(branchName)}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const drivers = response.data.drivers || response.data || [];
        console.log('📡 Branch drivers response (by name):', drivers);
        
        const available = drivers.filter(driver => 
          driver.driverStatus === 'Available' && 
          driver.isActive
        );
        console.log('✅ Available drivers (by name):', available);
        setAvailableDrivers(available);
        return;
      } catch (branchError) {
        console.log('❌ Branch drivers by name not available, trying all drivers...', branchError.response?.data);
      }
      
      // Try to get drivers by branch ID (alternative method)
      try {
        const response = await axios.get(`http://localhost:5000/employees/drivers/branch/${encodeURIComponent(branchId)}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const drivers = response.data.drivers || response.data || [];
        console.log('📡 Branch drivers response (by ID):', drivers);
        
        const available = drivers.filter(driver => 
          driver.driverStatus === 'Available' && 
          driver.isActive
        );
        console.log('✅ Available drivers (by ID):', available);
        setAvailableDrivers(available);
        return;
      } catch (branchIdError) {
        console.log('❌ Branch drivers by ID not available, trying all drivers...', branchIdError.response?.data);
      }
      
      // Fallback: Try to get all drivers from the User model and filter by branch
      try {
        const response = await axios.get('http://localhost:5000/Users/role/Driver', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const drivers = response.data.users || response.data || [];
        console.log('📡 All drivers response:', drivers);
        console.log('🔍 Looking for drivers with branchId:', branchId, 'or branchName:', branchName);
        
        const available = drivers.filter(driver => {
          const isAvailable = driver.driverStatus === 'Available' && driver.isActive;
          const matchesBranch = driver.branchId === branchId || 
                               driver.branchName === branchName || 
                               driver.branch === branchName ||
                               driver.branch === branchId;
          
          console.log(`Driver ${driver.name}: available=${isAvailable}, branchId=${driver.branchId}, branchName=${driver.branchName}, branch=${driver.branch}, matches=${matchesBranch}`);
          
          return isAvailable && matchesBranch;
        });
        console.log('✅ Available drivers after filtering:', available);
        setAvailableDrivers(available);
        return;
      } catch (userError) {
        console.log('❌ User model drivers not available, trying Driver model...', userError.response?.data);
      }
      
      // Fallback: Try to get drivers from the Driver model
      try {
        const response = await axios.get('http://localhost:5000/drivers', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const drivers = response.data.drivers || response.data || [];
        console.log('📡 Driver model response:', drivers);
        
        const available = drivers.filter(driver => 
          driver.status === 'Available' && driver.isActive
        );
        console.log('✅ Available drivers from Driver model:', available);
        setAvailableDrivers(available);
        return;
      } catch (driverError) {
        console.log('❌ Driver model not available:', driverError.response?.data);
      }
      
      // If all methods fail, show empty list with error message
      console.log('❌ All driver fetching methods failed');
      setAvailableDrivers([]);
      showNotification('Unable to fetch drivers. Please check your connection and try again.', 'error');
      
    } catch (error) {
      console.error('Error fetching drivers:', error);
      setAvailableDrivers([]);
    }
  };

  const handleProcessRequest = async (requestId, action) => {
    try {
      setProcessingRequest(true);
      const status = action === 'accept' ? 'Approved' : 'Rejected';
      
      console.log('Processing request:', requestId, 'with action:', action);
      console.log('Request data:', {
        status,
        assignedBranch: branchId,
        adminNotes: `Request ${action}ed by ${branchName}`
      });

      const response = await emergencyRequestAPI.updateRequestStatus(requestId, {
        status,
        assignedBranch: branchId,
        adminNotes: `Request ${action}ed by ${branchName}`
      });

      console.log('Response:', response);

      showNotification(`Emergency request ${action}ed successfully`, 'success');
      fetchEmergencyRequests(); // Refresh the list
      setShowDetails(false);
      setSelectedRequest(null);
    } catch (error) {
      console.error('Error processing emergency request:', error);
      console.error('Error details:', error.response?.data || error.message);
      showNotification(`Failed to ${action} emergency request. Please try again.`, 'error');
    } finally {
      setProcessingRequest(false);
    }
  };

  const handleAssignDriver = (request) => {
    setSelectedRequest(request);
    setShowDriverModal(true);
  };

  const assignDriverToRequest = async (driverId) => {
    try {
      const token = localStorage.getItem('token');
      
      // First, check if driver is still available
      const driver = availableDrivers.find(d => d._id === driverId);
      if (!driver || driver.driverStatus !== 'Available') {
        showNotification('Selected driver is no longer available. Please select another driver.', 'error');
        fetchAvailableDrivers(); // Refresh driver list
        return;
      }

      const updateData = {
        status: 'In Progress',
        assignedDriver: driverId,
        assignedBranch: branchId,
        adminNotes: `Driver assigned by ${branchName} branch manager`
      };

      const response = await axios.put(`http://localhost:5000/emergency-requests/${selectedRequest._id}/status`, updateData, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.data.success) {
        // Update driver status to 'On Delivery'
        try {
          await axios.put(`http://localhost:5000/Users/${driverId}/driver-status`, {
            driverStatus: 'On Delivery'
          }, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
        } catch (statusError) {
          console.error('Error updating driver status:', statusError);
          // Continue anyway as the main assignment was successful
        }

        showNotification(`Driver ${driver.name} assigned successfully! Emergency request is now in progress.`, 'success');
        setShowDriverModal(false);
        setSelectedRequest(null);
        fetchEmergencyRequests(); // Refresh the list
        fetchAvailableDrivers(); // Refresh available drivers
      }
    } catch (error) {
      console.error('Error assigning driver:', error);
      showNotification('Failed to assign driver. Please try again.', 'error');
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      Pending: { color: 'bg-yellow-100 text-yellow-800', text: 'Pending' },
      Approved: { color: 'bg-green-100 text-green-800', text: 'Approved' },
      'Approved - Sent to Branch Manager': { color: 'bg-blue-100 text-blue-800', text: 'Sent to Branch' },
      Rejected: { color: 'bg-red-100 text-red-800', text: 'Rejected' },
      'In Progress': { color: 'bg-purple-100 text-purple-800', text: 'In Progress' },
      Completed: { color: 'bg-gray-100 text-gray-800', text: 'Completed' }
    };

    const config = statusConfig[status] || statusConfig.Pending;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    );
  };

  const getPriorityBadge = (priority) => {
    const priorityConfig = {
      Low: { color: 'bg-green-100 text-green-800', text: 'Low' },
      Medium: { color: 'bg-yellow-100 text-yellow-800', text: 'Medium' },
      High: { color: 'bg-orange-100 text-orange-800', text: 'High' },
      Critical: { color: 'bg-red-100 text-red-800', text: 'Critical' }
    };

    const config = priorityConfig[priority] || priorityConfig.Medium;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Emergency Water Requests</h1>
          <p className="text-gray-600">Manage emergency water requests forwarded by admin</p>
        </div>
        <button
          onClick={fetchEmergencyRequests}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 rounded-full bg-blue-100 text-blue-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Sent to Branch</p>
              <p className="text-lg font-semibold text-gray-900">
                {emergencyRequests.filter(req => req.status === 'Approved - Sent to Branch Manager').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 rounded-full bg-green-100 text-green-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Ready for Assignment</p>
              <p className="text-lg font-semibold text-gray-900">
                {emergencyRequests.filter(req => req.status === 'Approved - Sent to Branch Manager').length}
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
              <p className="text-sm font-medium text-gray-600">In Progress</p>
              <p className="text-lg font-semibold text-gray-900">
                {emergencyRequests.filter(req => req.status === 'In Progress').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 rounded-full bg-blue-100 text-blue-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-lg font-semibold text-gray-900">
                {emergencyRequests.filter(req => req.status === 'Completed').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Emergency Requests List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Emergency Requests</h3>
        </div>
        
        {emergencyRequests.length === 0 ? (
          <div className="px-6 py-8 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No emergency requests</h3>
            <p className="mt-1 text-sm text-gray-500">No emergency water requests have been forwarded to this branch.</p>
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
                    Requester
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
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
                {emergencyRequests.map((request) => (
                  <tr key={request._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {request._id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>
                        <div className="font-medium">{request.brigadeName}</div>
                        <div className="text-gray-500">{request.brigadeId}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getPriorityBadge(request.priority)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(request.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(request.requestDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setSelectedRequest(request);
                            setShowDetails(true);
                          }}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          View
                        </button>
                        {request.status === 'Approved - Sent to Branch Manager' && (
                          <button
                            onClick={() => handleAssignDriver(request)}
                            className="text-purple-600 hover:text-purple-900"
                          >
                            🚚 Assign Driver
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Request Details Modal */}
      {showDetails && selectedRequest && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Emergency Request Details</h3>
                <button
                  onClick={() => {
                    setShowDetails(false);
                    setSelectedRequest(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Request ID</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedRequest._id}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Brigade</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedRequest.brigadeName}</p>
                  <p className="mt-1 text-sm text-gray-500">{selectedRequest.brigadeId}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Location</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedRequest.brigadeLocation}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Priority</label>
                  <div className="mt-1">{getPriorityBadge(selectedRequest.priority)}</div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <div className="mt-1">{getStatusBadge(selectedRequest.status)}</div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedRequest.description}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Water Level</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedRequest.waterLevel}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Request Type</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedRequest.requestType}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Created At</label>
                  <p className="mt-1 text-sm text-gray-900">{formatDate(selectedRequest.requestDate)}</p>
                </div>
                
                {selectedRequest.status === 'Pending' && (
                  <div className="flex space-x-3 pt-4">
                    <button
                      onClick={() => handleProcessRequest(selectedRequest._id, 'accept')}
                      disabled={processingRequest}
                      className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                      Accept Request
                    </button>
                    <button
                      onClick={() => handleProcessRequest(selectedRequest._id, 'reject')}
                      disabled={processingRequest}
                      className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50"
                    >
                      Reject Request
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Driver Assignment Modal */}
      {showDriverModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Assign Driver to Emergency Request</h3>
              
              <div className="mb-4">
                <p className="text-sm text-gray-600">
                  <strong>Brigade:</strong> {selectedRequest?.brigadeName}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Location:</strong> {selectedRequest?.brigadeLocation}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Water Level:</strong> {selectedRequest?.waterLevel}
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Available Driver from {branchName}:
                </label>
                
                
                {availableDrivers.length === 0 ? (
                  <p className="text-red-600 text-sm">No available drivers found in this branch</p>
                ) : (
                  <div className="space-y-2">
                    {availableDrivers.map((driver) => (
                      <button
                        key={driver._id}
                        onClick={() => assignDriverToRequest(driver._id)}
                        className="w-full text-left p-3 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium text-gray-900">{driver.name}</p>
                            <p className="text-sm text-gray-600">{driver.email}</p>
                            <p className="text-sm text-gray-600">Phone: {driver.phone}</p>
                            {driver.vehicleNumber && (
                              <p className="text-sm text-gray-600">Vehicle: {driver.vehicleNumber}</p>
                            )}
                          </div>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            driver.driverStatus === 'Available' ? 'bg-green-100 text-green-800' :
                            driver.driverStatus === 'On Delivery' ? 'bg-blue-100 text-blue-800' :
                            driver.driverStatus === 'Off Duty' ? 'bg-gray-100 text-gray-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {driver.driverStatus}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowDriverModal(false);
                    setSelectedRequest(null);
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors duration-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BranchEmergency;
