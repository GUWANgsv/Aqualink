import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import UniversalNavbar from '../Nav/UniversalNavbar';
import { useAuth } from '../../Context/AuthContext';
import { employeeAPI, branchAPI } from '../../utils/apiService';

const EditEmployee = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'Branch Manager',
    branch: '',
    address: '',
    salary: '',
    status: 'Active'
  });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [errors, setErrors] = useState({});
  const [branches, setBranches] = useState([]);
  const [fetchingBranches, setFetchingBranches] = useState(true);

  const roles = [
    { value: 'Branch Manager', label: 'Branch Manager' },
    { value: 'Factory Manager', label: 'Factory Manager' },
    { value: 'Driver', label: 'Driver' }
  ];

  // Fetch branches from API
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        setFetchingBranches(true);
        const response = await branchAPI.getAllBranches();
        if (response && response.success && response.branches) {
          // Transform branches data for dropdown
          const branchOptions = response.branches.map(branch => ({
            value: branch.name,
            label: `${branch.name} - ${branch.location}`
          }));
          
          // Note: All branches come from the database, no need to add hardcoded branches
          
          setBranches(branchOptions);
        }
      } catch (error) {
        console.error('Error fetching branches:', error);
        // Fallback to default branches if API fails
        setBranches([
          { value: 'Colombo Central', label: 'Colombo Central' },
          { value: 'Kandy Branch', label: 'Kandy Branch' },
          { value: 'Galle Branch', label: 'Galle Branch' },
          { value: 'Main Factory', label: 'Main Factory' }
        ]);
      } finally {
        setFetchingBranches(false);
      }
    };

    fetchBranches();
  }, []);

  // Fetch employee data on component mount
  useEffect(() => {
    const fetchEmployee = async () => {
      try {
        setFetching(true);
        const response = await employeeAPI.getEmployeeById(id);
        if (response && response.data) {
          const employee = response.data;
          setFormData({
            name: employee.name || '',
            email: employee.email || '',
            phone: employee.phone || '',
            role: employee.role || 'Branch Manager',
            branch: employee.branchName || employee.branch || '',
            address: employee.address || '',
            salary: employee.salary || '',
            status: employee.isActive ? 'Active' : 'Inactive'
          });
        }
      } catch (error) {
        console.error('Error fetching employee:', error);
        alert('Error: ' + (error.response?.data?.message || error.message || 'Failed to fetch employee details'));
        navigate('/admin-dashboard');
      } finally {
        setFetching(false);
      }
    };

    if (id) {
      fetchEmployee();
    }
  }, [id, navigate]);

  // Debug branches loading
  useEffect(() => {
    console.log('Current branches state:', branches);
    console.log('Fetching branches state:', fetchingBranches);
  }, [branches, fetchingBranches]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }

    if (!formData.branch) {
      newErrors.branch = 'Branch is required';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }

    if (!formData.salary) {
      newErrors.salary = 'Salary is required';
    } else if (isNaN(formData.salary) || parseFloat(formData.salary) <= 0) {
      newErrors.salary = 'Salary must be a positive number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Prepare employee data for API
      const employeeData = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        phone: formData.phone,
        branch: formData.branch,
        address: formData.address,
        salary: parseFloat(formData.salary),
        status: formData.status
      };

      // Add role-specific fields
      if (formData.role === 'Branch Manager') {
        employeeData.branchName = formData.branch;
        employeeData.branchLocation = formData.address;
      }

      console.log('Updating employee with data:', employeeData);
      
      // Call the API to update employee
      const response = await employeeAPI.updateEmployee(id, employeeData);
      
      console.log('Employee updated successfully:', response);
      
      // Show success message
      alert('Employee updated successfully!');
      
      // Navigate back to admin dashboard
      navigate('/admin-dashboard');
    } catch (error) {
      console.error('Error updating employee:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to update employee. Please try again.';
      alert('Error: ' + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/admin-dashboard');
  };

  if (fetching) {
    return (
      <div className="min-h-screen bg-gray-50">
        <UniversalNavbar />
        <div className="pt-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading employee details...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <UniversalNavbar />
      <div className="pt-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Edit Employee</h1>
                <p className="text-gray-600 mt-2">Update employee information and role-based access</p>
              </div>
              <button
                onClick={handleCancel}
                className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors duration-200"
              >
                Cancel
              </button>
            </div>
          </div>

          {/* Form */}
          <div className="bg-white rounded-lg shadow-sm p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.name ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter full name"
                    />
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.email ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter email address"
                    />
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.phone ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter phone number"
                    />
                    {errors.phone && (
                      <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Address *
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.address ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter address"
                    />
                    {errors.address && (
                      <p className="mt-1 text-sm text-red-600">{errors.address}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Employment Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Employment Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Role *
                    </label>
                    <select
                      name="role"
                      value={formData.role}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {roles.map((role) => (
                        <option key={role.value} value={role.value}>
                          {role.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Branch *
                    </label>
                    <select
                      name="branch"
                      value={formData.branch}
                      onChange={handleInputChange}
                      disabled={fetchingBranches}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.branch ? 'border-red-500' : 'border-gray-300'
                      } ${fetchingBranches ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                    >
                      <option value="">
                        {fetchingBranches ? 'Loading branches...' : 'Select a branch'}
                      </option>
                      {branches.map((branch) => (
                        <option key={branch.value} value={branch.value}>
                          {branch.label}
                        </option>
                      ))}
                    </select>
                    {errors.branch && (
                      <p className="mt-1 text-sm text-red-600">{errors.branch}</p>
                    )}
                    {fetchingBranches && (
                      <p className="mt-1 text-sm text-gray-500">Loading available branches...</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Salary (LKR) *
                    </label>
                    <input
                      type="number"
                      name="salary"
                      value={formData.salary}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.salary ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter salary"
                      min="0"
                      step="1000"
                    />
                    {errors.salary && (
                      <p className="mt-1 text-sm text-red-600">{errors.salary}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Status Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Status Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status *
                    </label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="bg-gray-500 text-white px-6 py-3 rounded-md hover:bg-gray-600 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-500 text-white px-6 py-3 rounded-md hover:bg-blue-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Updating Employee...
                    </>
                  ) : (
                    'Update Employee'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditEmployee;
