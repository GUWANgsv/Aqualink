import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../Context/AuthContext';
import { employeeAPI, branchAPI } from '../../utils/apiService';

const AddEmployee = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'Branch Manager',
    branch: '',
    address: '',
    salary: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [branches, setBranches] = useState([]);
  const [fetchingBranches, setFetchingBranches] = useState(true);

  // Navigation guard - ensure only Admin users can access
  useEffect(() => {
    if (user && user.role !== 'Admin') {
      console.error('Access denied: User does not have Admin privileges');
      navigate('/login');
    }
  }, [user, navigate]);

  // Fetch branches from API
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        console.log('🔄 Starting to fetch branches...');
        setFetchingBranches(true);
        const response = await branchAPI.getAllBranches();
        console.log('📡 Branch API response:', response);
        
        if (response && response.success && response.branches) {
          console.log('📋 Raw branch data:', response.branches);
          // Transform branches data for dropdown
          const branchOptions = response.branches.map(branch => ({
            value: branch.name,
            label: `${branch.name} - ${branch.location}`
          }));
          
          // Note: All branches come from the database, no need to add hardcoded branches
          
          console.log('🎯 Transformed branch options:', branchOptions);
          setBranches(branchOptions);
        } else {
          console.warn('⚠️ No branch data in response:', response);
        }
      } catch (error) {
        console.error('❌ Error fetching branches:', error);
        // Fallback to default branches if API fails
        setBranches([
          { value: 'Colombo Central', label: 'Colombo Central' },
          { value: 'Kandy Branch', label: 'Kandy Branch' },
          { value: 'Galle Branch', label: 'Galle Branch' },
          { value: 'Main Factory', label: 'Main Factory' }
        ]);
      } finally {
        setFetchingBranches(false);
        console.log('✅ Finished fetching branches');
      }
    };

    fetchBranches();
  }, []);

  // Debug branches loading
  useEffect(() => {
    console.log('🔍 Current branches state:', branches);
    console.log('🔄 Fetching branches state:', fetchingBranches);
  }, [branches, fetchingBranches]);

  // If user is not authenticated or doesn't have the right role, show loading
  if (!user || user.role !== 'Admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const roles = [
    { value: 'Branch Manager', label: 'Branch Manager' },
    { value: 'Factory Manager', label: 'Factory Manager' },
    { value: 'Driver', label: 'Driver' }
  ];

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

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
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
        password: formData.password,
        role: formData.role,
        phone: formData.phone,
        branch: formData.branch,
        address: formData.address,
        salary: parseFloat(formData.salary),
        status: 'Active'
      };

      // Add role-specific fields
      if (formData.role === 'Branch Manager') {
        employeeData.branchName = formData.branch;
        employeeData.branchLocation = formData.address;
      } else if (formData.role === 'Driver') {
        // Add required driver fields
        employeeData.driverId = `DRIVER_${Date.now()}`;
        employeeData.vehicleType = 'Not specified';
        employeeData.vehicleNumber = 'Not specified';
        employeeData.licenseNumber = 'Not specified';
        employeeData.driverStatus = 'Available';
        employeeData.branchName = formData.branch;
      }

      console.log('Creating employee with data:', employeeData);
      
      // Call the API to create employee
      const response = await employeeAPI.createEmployee(employeeData);
      
      console.log('Employee created successfully:', response);
      
      // Show success message
      alert('Employee created successfully! The employee can now login using their email and password.');
      
      // Navigate based on employee role
      if (formData.role === 'Driver') {
        // Navigate to branch manager drivers page
        navigate('/branch-manager/drivers');
      } else {
        // Navigate back to admin dashboard for other roles
        navigate('/admin-dashboard');
      }
    } catch (error) {
      console.error('Error creating employee:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to create employee. Please try again.';
      alert('Error: ' + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/admin-dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Add New Employee</h1>
              <p className="text-gray-600 mt-2">Create a new employee account with role-based access</p>
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

              {/* Account Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Password *
                    </label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.password ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter password"
                    />
                    {errors.password && (
                      <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm Password *
                    </label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Confirm password"
                    />
                    {errors.confirmPassword && (
                      <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Role Information */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-blue-900 mb-2">Role Permissions</h4>
                <div className="text-sm text-blue-800 space-y-1">
                  {formData.role === 'Branch Manager' && (
                    <ul className="list-disc list-inside space-y-1">
                      <li>Manage branch orders and inventory</li>
                      <li>Handle customer requests</li>
                      <li>Manage recycling operations</li>
                      <li>Generate branch reports</li>
                    </ul>
                  )}
                  {formData.role === 'Factory Manager' && (
                    <ul className="list-disc list-inside space-y-1">
                      <li>Manage factory production</li>
                      <li>Handle bulk orders</li>
                      <li>Monitor quality control</li>
                      <li>Generate factory reports</li>
                    </ul>
                  )}
                  {formData.role === 'Driver' && (
                    <ul className="list-disc list-inside space-y-1">
                      <li>Manage deliveries</li>
                      <li>Update delivery status</li>
                      <li>View delivery routes</li>
                      <li>Generate delivery logs</li>
                    </ul>
                  )}
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
                      Creating Employee...
                    </>
                  ) : (
                    'Create Employee'
                  )}
                </button>
              </div>
            </form>
          </div>
      </div>
    </div>
  );
};

export default AddEmployee;
