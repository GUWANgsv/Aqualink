import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log('API Request:', config.method?.toUpperCase(), config.url, config.data);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for debugging
apiClient.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.status, response.data);
    return response;
  },
  (error) => {
    console.error('API Response Error:', error.response?.status, error.response?.data);
    return Promise.reject(error);
  }
);

// Emergency Request API calls
export const emergencyRequestAPI = {
  // Create new emergency request
  createRequest: async (requestData) => {
    try {
      const response = await apiClient.post('/emergency-requests/create', requestData);
      return response.data;
    } catch (error) {
      console.error('Error creating emergency request:', error);
      throw error;
    }
  },

  // Get all emergency requests
  getAllRequests: async () => {
    try {
      const response = await apiClient.get('/emergency-requests/all');
      return response.data;
    } catch (error) {
      console.error('Error fetching emergency requests:', error);
      throw error;
    }
  },

  // Get emergency request by ID
  getRequestById: async (id) => {
    try {
      const response = await apiClient.get(`/emergency-requests/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching emergency request:', error);
      throw error;
    }
  },

  // Update emergency request status
  updateRequestStatus: async (id, updateData) => {
    try {
      console.log('Updating request status:', id, updateData);
      const response = await apiClient.put(`/emergency-requests/${id}/status`, updateData);
      return response.data;
    } catch (error) {
      console.error('Error updating emergency request status:', error);
      throw error;
    }
  },

  // Get emergency requests by status
  getRequestsByStatus: async (status) => {
    try {
      const response = await apiClient.get(`/emergency-requests/status/${status}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching emergency requests by status:', error);
      throw error;
    }
  },

  // Get emergency requests by brigade
  getRequestsByBrigade: async (brigadeId) => {
    try {
      const response = await apiClient.get(`/emergency-requests/brigade/${brigadeId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching emergency requests by brigade:', error);
      throw error;
    }
  },

  // Find nearest branch
  findNearestBranch: async (coordinates) => {
    try {
      console.log('Finding nearest branch with coordinates:', coordinates);
      const response = await apiClient.post('/emergency-requests/find-nearest-branch', coordinates);
      return response.data;
    } catch (error) {
      console.error('Error finding nearest branch:', error);
      throw error;
    }
  },

  // Delete emergency request
  deleteRequest: async (id) => {
    try {
      const response = await apiClient.delete(`/emergency-requests/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting emergency request:', error);
      throw error;
    }
  },

  // Get emergency requests by driver
  getDriverEmergencyRequests: async (driverId) => {
    try {
      const response = await apiClient.get(`/emergency-requests/driver/${driverId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching driver emergency requests:', error);
      throw error;
    }
  }
};

// Branch API calls
export const branchAPI = {
  getAllBranches: async () => {
    try {
      const response = await apiClient.get('/public/branches');
      return response.data;
    } catch (error) {
      console.error('Error fetching branches:', error);
      throw error;
    }
  },

  getBranchById: async (id) => {
    try {
      const response = await apiClient.get(`/branches/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching branch:', error);
      throw error;
    }
  },

  createBranch: async (branchData) => {
    try {
      console.log('Creating branch with data:', branchData);
      const response = await apiClient.post('/branches/create', branchData);
      return response.data;
    } catch (error) {
      console.error('Error creating branch:', error);
      throw error;
    }
  },

  updateBranch: async (id, branchData) => {
    try {
      const response = await apiClient.put(`/branches/${id}`, branchData);
      return response.data;
    } catch (error) {
      console.error('Error updating branch:', error);
      throw error;
    }
  },

  deleteBranch: async (id) => {
    try {
      const response = await apiClient.delete(`/branches/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting branch:', error);
      throw error;
    }
  },

  getBranchesByStatus: async (status) => {
    try {
      const response = await apiClient.get(`/branches/status/${status}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching branches by status:', error);
      throw error;
    }
  },

  updateBranchStock: async (id, stockData) => {
    try {
      const response = await apiClient.put(`/branches/${id}/stock`, stockData);
      return response.data;
    } catch (error) {
      console.error('Error updating branch stock:', error);
      throw error;
    }
  },

  getBranchesWithinRadius: async (coordinates) => {
    try {
      const response = await apiClient.get('/branches/within-radius', { params: coordinates });
      return response.data;
    } catch (error) {
      console.error('Error fetching branches within radius:', error);
      throw error;
    }
  },

  getBranchStatistics: async () => {
    try {
      const response = await apiClient.get('/branches/statistics');
      return response.data;
    } catch (error) {
      console.error('Error fetching branch statistics:', error);
      throw error;
    }
  }
};

// User API calls
export const userAPI = {
  getAllUsers: async () => {
    try {
      const response = await apiClient.get('/users');
      return response.data;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  },

  getUserById: async (id) => {
    try {
      const response = await apiClient.get(`/users/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user:', error);
      throw error;
    }
  },

  updateOwnProfile: async (profileData) => {
    try {
      const response = await apiClient.put('/auth/own-profile', profileData);
      return response.data;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  },

  deleteOwnProfile: async () => {
    try {
      const response = await apiClient.delete('/auth/own-profile');
      return response.data;
    } catch (error) {
      console.error('Error deleting profile:', error);
      throw error;
    }
  }
};

// Employee API calls
export const employeeAPI = {
  getAllEmployees: async () => {
    try {
      const response = await apiClient.get('/employees');
      return response.data;
    } catch (error) {
      console.error('Error fetching employees:', error);
      throw error;
    }
  },

  getEmployeeById: async (id) => {
    try {
      const response = await apiClient.get(`/employees/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching employee:', error);
      throw error;
    }
  },

  createEmployee: async (employeeData) => {
    try {
      console.log('Creating employee with data:', employeeData);
      const response = await apiClient.post('/employees', employeeData);
      return response.data;
    } catch (error) {
      console.error('Error creating employee:', error);
      throw error;
    }
  },

  updateEmployee: async (id, employeeData) => {
    try {
      const response = await apiClient.put(`/employees/${id}`, employeeData);
      return response.data;
    } catch (error) {
      console.error('Error updating employee:', error);
      throw error;
    }
  },

  deleteEmployee: async (id) => {
    try {
      const response = await apiClient.delete(`/employees/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting employee:', error);
      throw error;
    }
  },

  getDriversByBranch: async (branchName) => {
    try {
      const response = await apiClient.get(`/employees/drivers/branch/${branchName}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching drivers by branch:', error);
      throw error;
    }
  },

  updateDriverStatus: async (driverId, driverStatus) => {
    try {
      const response = await apiClient.put(`/employees/drivers/${driverId}/status`, { driverStatus });
      return response.data;
    } catch (error) {
      console.error('Error updating driver status:', error);
      throw error;
    }
  },

  updateOwnDriverStatus: async (driverStatus) => {
    try {
      const response = await apiClient.put(`/employees/drivers/own-status`, { driverStatus });
      return response.data;
    } catch (error) {
      console.error('Error updating own driver status:', error);
      throw error;
    }
  },

  updateOwnProfile: async (profileData) => {
    try {
      const response = await apiClient.put(`/auth/own-profile`, profileData);
      return response.data;
    } catch (error) {
      console.error('Error updating own profile:', error);
      throw error;
    }
  }
};

// Customer Purchase API calls
export const customerPurchaseAPI = {
  // Submit a new customer order
  submitOrder: async (orderData) => {
    try {
      const response = await apiClient.post('/CustomerPurchases', orderData);
      return response.data;
    } catch (error) {
      console.error('Error submitting order:', error);
      throw error;
    }
  },

  // Get customer's order history
  getCustomerOrders: async (customerId) => {
    try {
      const response = await apiClient.get(`/CustomerPurchases/customer/${customerId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching customer orders:', error);
      throw error;
    }
  },

  getBranchPurchases: async (branchName) => {
    try {
      const response = await apiClient.get(`/CustomerPurchases/branch/${branchName}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching branch purchases:', error);
      throw error;
    }
  },

  assignDriver: async (purchaseId, driverId) => {
    try {
      const response = await apiClient.put(`/CustomerPurchases/${purchaseId}/assign-driver`, { driverId });
      return response.data;
    } catch (error) {
      console.error('Error assigning driver:', error);
      throw error;
    }
  },

  startDelivery: async (purchaseId) => {
    try {
      const response = await apiClient.put(`/CustomerPurchases/${purchaseId}/start-delivery`);
      return response.data;
    } catch (error) {
      console.error('Error starting delivery:', error);
      throw error;
    }
  },

  completeDelivery: async (purchaseId, deliveryNotes) => {
    try {
      const response = await apiClient.put(`/CustomerPurchases/${purchaseId}/complete-delivery`, { deliveryNotes });
      return response.data;
    } catch (error) {
      console.error('Error completing delivery:', error);
      throw error;
    }
  },

  getDriverDeliveries: async (driverId) => {
    try {
      const response = await apiClient.get(`/CustomerPurchases/driver/${driverId}/deliveries`);
      return response.data;
    } catch (error) {
      console.error('Error fetching driver deliveries:', error);
      throw error;
    }
  },

  getCompletedDeliveries: async (driverId, month = null, year = null) => {
    try {
      let url = `/CustomerPurchases/driver/${driverId}/completed-deliveries`;
      if (month && year) {
        url += `?month=${month}&year=${year}`;
      }
      const response = await apiClient.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching completed deliveries:', error);
      throw error;
    }
  }
};


export default apiClient;
