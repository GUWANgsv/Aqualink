import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { employeeAPI } from '../../utils/apiService';

function BranchDrivers({ branchId, branchName, showNotification }) {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    vehicleNumber: '',
    vehicleType: '',
    address: ''
  });

  const vehicleTypes = ['Heavy', 'Light'];

  useEffect(() => {
    console.log('🔍 BranchDrivers useEffect - branchName:', branchName);
    if (branchName) {
      fetchDrivers();
    }
  }, [branchName]);

  const fetchDrivers = async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching drivers for branch:', branchName);
      // Use the apiService to fetch drivers from User collection
      const response = await employeeAPI.getDriversByBranch(branchName);
      console.log('📡 API Response:', response);
      setDrivers(response.drivers || []);
    } catch (error) {
      console.error('❌ Error fetching drivers:', error);
      console.error('❌ Error details:', error.response?.data);
      showNotification('Failed to fetch drivers', 'error');
      setDrivers([]);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.name.trim()) {
      errors.name = 'Driver name is required';
    }

    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Please enter a valid email';
    }

    if (!formData.phone.trim()) {
      errors.phone = 'Phone number is required';
    } else if (!/^[\+]?[0-9\s\-\(\)]{10,}$/.test(formData.phone)) {
      errors.phone = 'Please enter a valid phone number';
    }


    if (!formData.vehicleNumber.trim()) {
      errors.vehicleNumber = 'Vehicle number is required';
    }

    if (!formData.vehicleType) {
      errors.vehicleType = 'Vehicle type is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      const driverData = {
        ...formData,
        branchId,
        branchName
      };

      // Update existing driver
      await axios.put(`http://localhost:5000/Drivers/${selectedDriver._id}`, driverData);
      showNotification('Driver updated successfully!', 'success');

      setShowEditModal(false);
      resetForm();
      fetchDrivers();
    } catch (error) {
      console.error('Error updating driver:', error);
      showNotification('Failed to update driver. Please try again.', 'error');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      vehicleNumber: '',
      vehicleType: '',
      address: ''
    });
    setSelectedDriver(null);
    setFormErrors({});
  };

  const handleEdit = (driver) => {
    setSelectedDriver(driver);
    setFormData({
      name: driver.name,
      email: driver.email,
      phone: driver.phone,
      vehicleNumber: driver.vehicleNumber,
      vehicleType: driver.vehicleType,
      address: driver.address || ''
    });
    setShowEditModal(true);
  };

  const handleDelete = async (driverId) => {
    if (window.confirm('Are you sure you want to delete this driver?')) {
      try {
        await axios.delete(`http://localhost:5000/Drivers/${driverId}`);
        showNotification('Driver deleted successfully!', 'success');
        fetchDrivers();
      } catch (error) {
        console.error('Error deleting driver:', error);
        showNotification('Failed to delete driver. Please try again.', 'error');
      }
    }
  };


  const getStatusColor = (status) => {
    switch (status) {
      case 'Available': return 'bg-green-100 text-green-800';
      case 'On Delivery': return 'bg-blue-100 text-blue-800';
      case 'Off Duty': return 'bg-red-100 text-red-800';
      case 'On Leave': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Branch Drivers</h2>
        <div className="flex space-x-3">
          <button
            onClick={() => {
              fetchDrivers();
              showNotification('Drivers refreshed!', 'success');
            }}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Drivers Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Driver
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vehicle
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
              {drivers.map((driver) => (
                <tr key={driver._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{driver.name}</div>
                      <div className="text-sm text-gray-500">ID: {driver._id}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{driver.email}</div>
                    <div className="text-sm text-gray-500">{driver.phone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{driver.vehicleType}</div>
                    <div className="text-sm text-gray-500">{driver.vehicleNumber}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(driver.driverStatus || 'Available')}`}>
                      {driver.driverStatus === 'Off Duty' ? 'Unavailable' : (driver.driverStatus || 'Available')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(driver)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(driver._id)}
                        className="text-red-600 hover:text-red-900"
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


      {/* Edit Driver Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Driver</h3>
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Driver Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                    {formErrors.name && (
                      <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                    {formErrors.email && (
                      <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phone</label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                    {formErrors.phone && (
                      <p className="text-red-500 text-xs mt-1">{formErrors.phone}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Vehicle Type</label>
                    <select
                      value={formData.vehicleType}
                      onChange={(e) => setFormData({...formData, vehicleType: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    >
                      <option value="">Select Vehicle Type</option>
                      {vehicleTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                    {formErrors.vehicleType && (
                      <p className="text-red-500 text-xs mt-1">{formErrors.vehicleType}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Vehicle Number</label>
                    <input
                      type="text"
                      value={formData.vehicleNumber}
                      onChange={(e) => setFormData({...formData, vehicleNumber: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                    {formErrors.vehicleNumber && (
                      <p className="text-red-500 text-xs mt-1">{formErrors.vehicleNumber}</p>
                    )}
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">Address</label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    rows="3"
                  />
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
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
                    Update Driver
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

export default BranchDrivers;
