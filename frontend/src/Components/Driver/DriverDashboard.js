import React, { useState, useEffect } from 'react';
import { useAuth } from '../../Context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { employeeAPI, customerPurchaseAPI, emergencyRequestAPI, userAPI } from '../../utils/apiService';
import { generateDeliveryLogsPDF } from '../../utils/pdfGenerator';
import EmergencyRouteMap from './EmergencyRouteMap';

const DriverDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [deliveries, setDeliveries] = useState([]);
  const [assignedDeliveries, setAssignedDeliveries] = useState([]);
  const [emergencyNotifications, setEmergencyNotifications] = useState([]);
  const [deliveryLogs, setDeliveryLogs] = useState([]);
  const [completedDeliveries, setCompletedDeliveries] = useState([]);
  const [dashboardStats, setDashboardStats] = useState({
    todayDeliveries: 0,
    completedToday: 0,
    emergencyCalls: 0,
    rating: 4.5,
    monthlySalary: user?.salary ? `Rs. ${user.salary.toLocaleString()}` : 'Rs. 45,000'
  });
  const [profile, setProfile] = useState({
    name: user?.name || 'Driver Name',
    email: user?.email || 'driver@example.com',
    phone: user?.phone || '+94 71 123 4567',
    vehicleNumber: user?.vehicleNumber || 'WP-ABC-1234',
    availability: user?.driverStatus || 'Available',
    rating: 4.5,
    totalDeliveries: 0,
    salary: user?.salary ? `Rs. ${user.salary.toLocaleString()}` : 'Rs. 45,000',
    branch: user?.branchName || user?.branch || 'Main Branch'
  });
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showRouteMap, setShowRouteMap] = useState(false);
  const [selectedEmergencyRequest, setSelectedEmergencyRequest] = useState(null);
  const [paysheetData, setPaysheetData] = useState(null);
  const [bonusHistory, setBonusHistory] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [paysheetLoading, setPaysheetLoading] = useState(false);
  const [deliveryLogsCount, setDeliveryLogsCount] = useState(0);
  const [lastDeliveryUpdate, setLastDeliveryUpdate] = useState(null);
  const [bonusNotifications, setBonusNotifications] = useState([]);
  const [isFetchingLogs, setIsFetchingLogs] = useState(false);

  // Fetch assigned deliveries
  const fetchAssignedDeliveries = async () => {
    try {
      if (user?._id) {
        const response = await customerPurchaseAPI.getDriverDeliveries(user._id);
        setAssignedDeliveries(response.deliveries || []);
      }
    } catch (error) {
      console.error('Error fetching assigned deliveries:', error);
    }
  };

  // Fetch completed deliveries and generate delivery logs
  const fetchCompletedDeliveries = async () => {
    try {
      if (user?._id) {
        const response = await customerPurchaseAPI.getCompletedDeliveries(user._id);
        const deliveries = response.deliveries || [];
        setCompletedDeliveries(deliveries);
        
        // Update profile with total deliveries (but don't auto-update delivery logs)
        if (response.statistics) {
          // Update profile with total deliveries
          setProfile(prev => ({
            ...prev,
            totalDeliveries: response.statistics.totalDeliveries
          }));

          // Calculate today's statistics
          const today = new Date().toISOString().split('T')[0];
          const todayLog = response.statistics.dailyLogs ? response.statistics.dailyLogs.find(log => log.date === today) : null;
          
          setDashboardStats(prev => ({
            ...prev,
            completedToday: todayLog ? todayLog.completed : 0
          }));
        }
        
        return deliveries;
      }
    } catch (error) {
      console.error('Error fetching completed deliveries:', error);
      return [];
    }
  };

  // Fetch emergency delivery logs
  const fetchEmergencyDeliveryLogs = async () => {
    try {
      if (user?._id) {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:5000/emergency-requests/driver/${user._id}/completed`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          return data.requests || [];
        }
      }
    } catch (error) {
      console.error('Error fetching emergency delivery logs:', error);
    }
    return [];
  };

  // Combine regular and emergency delivery logs with monitoring
  const fetchAllDeliveryLogs = async (showNotification = false) => {
    // Prevent multiple simultaneous calls
    if (isFetchingLogs) {
      return;
    }
    
    try {
      setIsFetchingLogs(true);
      const previousCount = deliveryLogs.length;
      
      // Fetch both regular and emergency delivery logs
      const [regularLogs, emergencyLogs] = await Promise.all([
        fetchCompletedDeliveries(),
        fetchEmergencyDeliveryLogs()
      ]);
      
      // Create comprehensive delivery logs array with unique keys
      const allLogs = [];
      const usedKeys = new Set(); // Track used keys to prevent duplicates
      
      // Add regular delivery logs (from completedDeliveries state)
      if (completedDeliveries && completedDeliveries.length > 0) {
        completedDeliveries.forEach((delivery, index) => {
          const uniqueKey = `regular-${delivery._id || delivery.purchaseNumber || index}`;
          if (!usedKeys.has(uniqueKey)) {
            usedKeys.add(uniqueKey);
            allLogs.push({
              id: uniqueKey, // Add unique ID for React key
              date: delivery.deliveryEndTime || delivery.updatedAt,
              deliveries: 1,
              completed: 1,
              totalAmount: delivery.totalAmount || 0,
              type: 'regular',
              deliveryType: 'Regular Water Delivery',
              regularDetails: {
                customerName: delivery.customerName,
                deliveryAddress: delivery.deliveryAddress,
                items: delivery.items,
                status: delivery.status,
                purchaseNumber: delivery.purchaseNumber
              }
            });
          }
        });
      }
      
      // Add emergency delivery logs
      if (emergencyLogs && emergencyLogs.length > 0) {
        emergencyLogs.forEach((log, index) => {
          const uniqueKey = `emergency-${log._id || index}`;
          if (!usedKeys.has(uniqueKey)) {
            usedKeys.add(uniqueKey);
            allLogs.push({
              id: uniqueKey, // Add unique ID for React key
              date: log.actualDeliveryTime || log.updatedAt,
              deliveries: 1,
              completed: 1,
              totalAmount: 5000, // Emergency bonus amount
              type: 'emergency',
              deliveryType: 'Emergency Water Supply',
              emergencyDetails: {
                brigadeName: log.brigadeName,
                brigadeLocation: log.brigadeLocation,
                waterLevel: log.waterLevel,
                priority: log.priority,
                requestTime: log.createdAt,
                completionTime: log.actualDeliveryTime,
                bonusAmount: 5000,
                bonusStatus: log.bonusStatus || 'Eligible'
              }
            });
          }
        });
      }
      
      // Sort by date (newest first)
      allLogs.sort((a, b) => new Date(b.date) - new Date(a.date));
      
      // Check for new deliveries
      const newCount = allLogs.length;
      const hasNewDeliveries = newCount > previousCount;
      
      if (hasNewDeliveries && showNotification) {
        const newDeliveries = allLogs.slice(0, newCount - previousCount);
        newDeliveries.forEach(delivery => {
          if (delivery.type === 'emergency') {
            addBonusNotification(delivery);
          }
        });
      }
      
      setDeliveryLogs(allLogs);
      setDeliveryLogsCount(newCount);
      setLastDeliveryUpdate(new Date());
      
      // Note: Removed auto-refresh of paysheet to prevent infinite loops
      // Paysheet will be refreshed manually or through other triggers
      
    } catch (error) {
      console.error('Error fetching all delivery logs:', error);
    } finally {
      setIsFetchingLogs(false);
    }
  };

  // Fetch emergency requests assigned to this driver
  const fetchEmergencyNotifications = async () => {
    try {
      if (user?._id) {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:5000/emergency-requests/driver/${user._id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
          const data = await response.json();
          const requests = data.requests || data.data || [];
          
          // Filter for active emergency requests (In Progress, Approved)
          const activeRequests = requests.filter(req => 
            req.status === 'In Progress' || req.status === 'Approved'
          );
          
          setEmergencyNotifications(activeRequests);
          
          // Update dashboard stats
          setDashboardStats(prev => ({
            ...prev,
            emergencyCalls: activeRequests.length
          }));
        }
      }
    } catch (error) {
      console.error('Error fetching emergency notifications:', error);
    }
  };

  // Mark emergency request as completed
  const markEmergencyRequestCompleted = async (requestId) => {
    try {
      const token = localStorage.getItem('token');
      const updateData = {
        status: 'Completed',
        actualDeliveryTime: new Date().toISOString(),
        driverNotes: 'Water delivery completed successfully'
      };

      const response = await fetch(`http://localhost:5000/emergency-requests/${requestId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        // Update driver status back to 'Available'
        try {
          await fetch(`http://localhost:5000/Users/${user._id}/driver-status`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              driverStatus: 'Available'
            })
          });
        } catch (statusError) {
          console.error('Error updating driver status:', statusError);
          // Continue anyway as the main completion was successful
        }

        alert('🎉 Emergency water delivery marked as completed! You earned Rs. 5,000 bonus! You are now available for new assignments.');
        
        // Refresh all data with notifications
        fetchEmergencyNotifications(); // Refresh the list
        await fetchAllDeliveryLogs(true); // Update delivery logs with notifications
        await fetchPaysheetData(); // Refresh paysheet data
        await fetchBonusHistory(); // Refresh bonus history
        
        // Show immediate bonus notification
        addBonusNotification({
          type: 'emergency',
          emergencyDetails: {
            brigadeName: 'Emergency Delivery',
            brigadeLocation: 'Completed',
            bonusAmount: 5000
          }
        });
      } else {
        alert('Failed to mark delivery as completed. Please try again.');
      }
    } catch (error) {
      console.error('Error marking emergency request as completed:', error);
      alert('Failed to mark delivery as completed. Please try again.');
    }
  };

  // Handle opening route map
  const handleShowRouteMap = (emergencyRequest) => {
    setSelectedEmergencyRequest(emergencyRequest);
    setShowRouteMap(true);
  };

  // Handle closing route map
  const handleCloseRouteMap = () => {
    setShowRouteMap(false);
    setSelectedEmergencyRequest(null);
  };

  // Update driver status
  const updateDriverStatus = async (newStatus) => {
    try {
      setUpdatingStatus(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`http://localhost:5000/Users/${user._id}/driver-status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          driverStatus: newStatus
        })
      });

      if (response.ok) {
        // Update local profile state
        setProfile(prev => ({
          ...prev,
          availability: newStatus
        }));
        
        alert(`Status updated to: ${newStatus}`);
      } else {
        alert('Failed to update status. Please try again.');
      }
    } catch (error) {
      console.error('Error updating driver status:', error);
      alert('Failed to update status. Please try again.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Fetch today's statistics
  const fetchTodayStats = async () => {
    try {
      if (user?._id) {
        // Get today's date
        const today = new Date();
        const month = today.getMonth() + 1;
        const year = today.getFullYear();
        
        // Fetch today's deliveries
        const response = await customerPurchaseAPI.getCompletedDeliveries(user._id, month, year);
        
        if (response.deliveries) {
          // Filter deliveries for today
          const todayDeliveries = response.deliveries.filter(delivery => {
            if (delivery.deliveryEndTime) {
              const deliveryDate = new Date(delivery.deliveryEndTime).toISOString().split('T')[0];
              const todayDate = today.toISOString().split('T')[0];
              return deliveryDate === todayDate;
            }
            return false;
          });

          setDashboardStats(prev => ({
            ...prev,
            todayDeliveries: todayDeliveries.length,
            completedToday: todayDeliveries.filter(d => d.status === 'Delivered').length
          }));
        }
      }
    } catch (error) {
      console.error('Error fetching today stats:', error);
    }
  };

  // Fetch emergency requests for driver
  const fetchEmergencyRequests = async () => {
    try {
      if (user?._id) {
        const response = await emergencyRequestAPI.getDriverEmergencyRequests(user._id);
        setEmergencyNotifications(response.requests || []);
        
        // Update dashboard stats with emergency calls count
        setDashboardStats(prev => ({
          ...prev,
          emergencyCalls: response.requests ? response.requests.length : 0
        }));
      }
    } catch (error) {
      console.error('Error fetching emergency requests:', error);
    }
  };

  // Removed salary update functionality - no longer refreshing user data automatically

  // Main useEffect for data fetching (depends on user._id, not user object)
  useEffect(() => {
    if (user?._id) {
      fetchAssignedDeliveries();
      // Temporarily disabled automatic loading of delivery logs to prevent auto-refresh issues
      // fetchAllDeliveryLogs(); // Use the new comprehensive function
      fetchTodayStats();
      fetchEmergencyNotifications();
      fetchPaysheetData(); // Fetch paysheet data
      fetchBonusHistory(); // Fetch bonus history
      checkEmergencyDeliveriesForBonuses(); // Check for missing bonuses
      
      // Disabled all automatic intervals to prevent auto-refresh issues
      // const emergencyInterval = setInterval(fetchEmergencyNotifications, 60000); // 60 seconds
      // const deliveryLogsInterval = setInterval(monitorDeliveryLogs, 120000); // 2 minutes
      
      return () => {
        // clearInterval(emergencyInterval);
        // clearInterval(deliveryLogsInterval);
      };
    }
  }, [user?._id]); // Only depend on user._id, not the entire user object

  // Update dashboard stats and profile when user data changes
  useEffect(() => {
    if (user) {
      // Update dashboard stats with real user data
      setDashboardStats(prev => ({
        ...prev,
        monthlySalary: user?.salary ? `Rs. ${user.salary.toLocaleString()}` : 'Rs. 45,000'
      }));
      
      // Update profile with real user data
      setProfile(prev => ({
        ...prev,
        name: user?.name || 'Driver Name',
        email: user?.email || 'driver@example.com',
        phone: user?.phone || '+94 71 123 4567',
        vehicleNumber: user?.vehicleNumber || 'WP-ABC-1234',
        availability: user?.driverStatus || 'Available',
        salary: user?.salary ? `Rs. ${user.salary.toLocaleString()}` : 'Rs. 45,000',
        branch: user?.branchName || user?.branch || 'Main Branch'
      }));
    }
  }, [user?.salary, user?.name, user?.email, user?.phone, user?.vehicleNumber, user?.driverStatus, user?.branchName, user?.branch]); // Specific dependencies

  // Sample data (in real app, this would come from API)
  const sampleDeliveries = [
    {
      id: 1,
      orderId: 'ORD-12345678',
      customerName: 'John Doe',
      address: '123 Main St, Colombo 03',
      items: ['5L Water Bottle × 2', 'RO Filter × 1'],
      status: 'In Progress',
      startTime: '2024-03-15 10:30',
      estimatedDelivery: '2024-03-15 12:00',
      route: 'Colombo 03 → Colombo 05 → Colombo 07'
    },
    {
      id: 2,
      orderId: 'ORD-12345679',
      customerName: 'Jane Smith',
      address: '456 Lake Rd, Kandy',
      items: ['10L Water Bottle × 1', 'Sediment Filter × 2'],
      status: 'Pending',
      startTime: null,
      estimatedDelivery: '2024-03-15 14:00',
      route: 'Kandy → Peradeniya → Katugastota'
    },
    {
      id: 3,
      orderId: 'ORD-12345680',
      customerName: 'Bob Wilson',
      address: '789 Beach Rd, Galle',
      items: ['20L Water Bottle × 3'],
      status: 'Completed',
      startTime: '2024-03-15 08:00',
      completedTime: '2024-03-15 09:30',
      route: 'Galle → Unawatuna → Galle'
    }
  ];

  const sampleEmergencyNotifications = [
    {
      id: 1,
      location: 'Colombo Fire Station',
      waterLevel: '25%',
      priority: 'High',
      status: 'Approved',
      assignedTime: '2024-03-15 14:30',
      estimatedArrival: '15 minutes'
    },
    {
      id: 2,
      location: 'Kandy Fire Station',
      waterLevel: '20%',
      priority: 'High',
      status: 'Pending',
      assignedTime: '2024-03-15 13:15',
      estimatedArrival: '25 minutes'
    }
  ];

  const sampleDeliveryLogs = [
    {
      id: 1,
      date: '2024-03-15',
      deliveries: 8,
      completed: 7,
      cancelled: 1,
      totalDistance: '45 km',
      totalEarnings: 2500
    },
    {
      id: 2,
      date: '2024-03-14',
      deliveries: 6,
      completed: 6,
      cancelled: 0,
      totalDistance: '38 km',
      totalEarnings: 2200
    },
    {
      id: 3,
      date: '2024-03-13',
      deliveries: 9,
      completed: 8,
      cancelled: 1,
      totalDistance: '52 km',
      totalEarnings: 2800
    }
  ];

  useEffect(() => {
    // Set loading state
    setLoading(false);
  }, []);


  const handleToggleAvailability = async () => {
    try {
      const newStatus = profile.availability === 'Available' ? 'Off Duty' : 'Available';
      
      // Update the backend using the driver's own status endpoint
      await employeeAPI.updateOwnDriverStatus(newStatus);
      
      // Update local state
      setProfile(prev => ({
        ...prev,
        availability: newStatus
      }));
      
      console.log(`✅ Driver status updated to: ${newStatus}`);
    } catch (error) {
      console.error('❌ Error updating driver status:', error);
      // You could add a notification here to show the error to the user
    }
  };

  const handleStartDelivery = async (deliveryId) => {
    try {
      await customerPurchaseAPI.startDelivery(deliveryId);
      await fetchAssignedDeliveries(); // Refresh deliveries
      
      // Update driver status to On Delivery when starting delivery
      setProfile(prev => ({
        ...prev,
        availability: 'On Delivery'
      }));
      
      console.log('✅ Delivery started and driver status updated to On Delivery');
    } catch (error) {
      console.error('❌ Error starting delivery:', error);
    }
  };

  const handleCompleteDelivery = async (deliveryId, notes = '') => {
    try {
      await customerPurchaseAPI.completeDelivery(deliveryId, notes);
      await fetchAssignedDeliveries(); // Refresh deliveries
      await fetchCompletedDeliveries(); // Refresh completed deliveries
      await fetchTodayStats(); // Refresh today's statistics
      
      // Update driver status to Available after completing delivery
      setProfile(prev => ({
        ...prev,
        availability: 'Available'
      }));
      
      // Update dashboard stats
      setDashboardStats(prev => ({
        ...prev,
        completedToday: prev.completedToday + 1
      }));
      
      console.log('✅ Delivery completed and driver status updated to Available');
    } catch (error) {
      console.error('❌ Error completing delivery:', error);
    }
  };

  const handleLogout = () => {
    logout('/login');
    navigate('/login');
  };

  // Update profile information
  const handleUpdateProfile = async () => {
    try {
      const updateData = {
        name: profile.name,
        email: profile.email,
        phone: profile.phone,
        vehicleNumber: profile.vehicleNumber
      };

      await employeeAPI.updateOwnProfile(updateData);
      alert('✅ Profile updated successfully!');
      
      // Update the user context with new data
      // Note: The user object will be updated on next login or page refresh
      
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('❌ Error updating profile. Please try again.');
    }
  };

  // Handle driver resignation
  const handleResign = async () => {
    const confirmResign = window.confirm(
      'Are you sure you want to resign? This action will permanently delete your account and cannot be undone.\n\n' +
      'Please confirm your resignation:'
    );
    
    if (!confirmResign) {
      return;
    }

    const finalConfirm = window.confirm(
      'This is your final confirmation. Your account will be permanently deleted.\n\n' +
      'Click OK to proceed with resignation.'
    );

    if (!finalConfirm) {
      return;
    }

    try {
      await userAPI.deleteOwnProfile();
      alert('✅ Your resignation has been processed successfully. Your account has been deleted.');
      
      // Logout and redirect to login page
      logout();
      navigate('/login');
      
    } catch (error) {
      console.error('Error during resignation:', error);
      alert('❌ Error processing resignation. Please try again or contact support.');
    }
  };

  // Fetch driver paysheet data
  const fetchPaysheetData = async (month = selectedMonth, year = selectedYear) => {
    try {
      setPaysheetLoading(true);
      if (user?._id) {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:5000/emergency-requests/driver/${user._id}/paysheet?month=${month}&year=${year}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setPaysheetData(data.data);
        } else {
          console.error('Failed to fetch paysheet data, response status:', response.status);
          // Create fallback paysheet data
          const fallbackData = {
            driver: {
              id: user._id,
              name: user.name || 'Driver',
              branchName: user.branchName || user.branch || 'Main Branch'
            },
            period: {
              month: month,
              year: year,
              monthName: new Date(year, month - 1).toLocaleString('default', { month: 'long' })
            },
            salary: {
              baseSalary: user.salary || 45000, // Default salary if not set
              formattedBaseSalary: `Rs. ${(user.salary || 45000).toLocaleString()}`
            },
            bonuses: {
              totalAmount: 0,
              paidAmount: 0,
              pendingAmount: 0,
              formattedTotalAmount: 'Rs. 0',
              formattedPaidAmount: 'Rs. 0',
              formattedPendingAmount: 'Rs. 0',
              count: 0,
              details: []
            },
            total: {
              totalEarnings: user.salary || 45000,
              formattedTotalEarnings: `Rs. ${(user.salary || 45000).toLocaleString()}`
            }
          };
          setPaysheetData(fallbackData);
        }
      }
    } catch (error) {
      console.error('Error fetching paysheet data:', error);
      // Create fallback paysheet data on error
      const fallbackData = {
        driver: {
          id: user._id,
          name: user.name || 'Driver',
          branchName: user.branchName || user.branch || 'Main Branch'
        },
        period: {
          month: month,
          year: year,
          monthName: new Date(year, month - 1).toLocaleString('default', { month: 'long' })
        },
        salary: {
          baseSalary: user.salary || 45000,
          formattedBaseSalary: `Rs. ${(user.salary || 45000).toLocaleString()}`
        },
        bonuses: {
          totalAmount: 0,
          paidAmount: 0,
          pendingAmount: 0,
          formattedTotalAmount: 'Rs. 0',
          formattedPaidAmount: 'Rs. 0',
          formattedPendingAmount: 'Rs. 0',
          count: 0,
          details: []
        },
        total: {
          totalEarnings: user.salary || 45000,
          formattedTotalEarnings: `Rs. ${(user.salary || 45000).toLocaleString()}`
        }
      };
      setPaysheetData(fallbackData);
    } finally {
      setPaysheetLoading(false);
    }
  };

  // Fetch driver bonus history
  const fetchBonusHistory = async () => {
    try {
      if (user?._id) {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:5000/emergency-requests/driver/${user._id}/bonus-history`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setBonusHistory(data.data.bonuses || []);
        } else {
          console.error('Failed to fetch bonus history');
        }
      }
    } catch (error) {
      console.error('Error fetching bonus history:', error);
    }
  };

  // Handle month/year change for paysheet
  const handlePaysheetPeriodChange = (month, year) => {
    setSelectedMonth(month);
    setSelectedYear(year);
    fetchPaysheetData(month, year);
  };

  // Add bonus notification
  const addBonusNotification = (delivery) => {
    const bonusAmount = delivery.emergencyDetails?.bonusAmount || 5000;
    const brigadeName = delivery.emergencyDetails?.brigadeName || 'Fire Brigade';
    
    let title, message;
    
    if (delivery.type === 'bulk-bonus') {
      title = '🎉 Multiple Bonuses Created!';
      message = `Successfully created bonuses for ${brigadeName} - Total: Rs. ${bonusAmount.toLocaleString()}`;
    } else {
      title = '🎉 Emergency Delivery Bonus Earned!';
      message = `You earned Rs. ${bonusAmount.toLocaleString()} bonus for emergency delivery to ${brigadeName}`;
    }
    
    const notification = {
      id: Date.now(),
      type: 'bonus',
      title: title,
      message: message,
      amount: bonusAmount,
      timestamp: new Date(),
      delivery: delivery
    };
    
    setBonusNotifications(prev => [notification, ...prev.slice(0, 4)]); // Keep only latest 5
    
    // Auto-remove notification after 10 seconds
    setTimeout(() => {
      setBonusNotifications(prev => prev.filter(n => n.id !== notification.id));
    }, 10000);
  };

  // Remove bonus notification
  const removeBonusNotification = (notificationId) => {
    setBonusNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  // Monitor delivery logs for changes
  const monitorDeliveryLogs = async () => {
    try {
      await fetchAllDeliveryLogs(true); // Show notifications for new deliveries
    } catch (error) {
      console.error('Error monitoring delivery logs:', error);
    }
  };

  // Check for emergency deliveries that might need bonus creation
  const checkEmergencyDeliveriesForBonuses = async () => {
    try {
      if (user?._id) {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:5000/emergency-requests/driver/${user._id}/completed`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          const completedEmergencyDeliveries = data.requests || [];
          
          
          // Check if any completed emergency deliveries don't have bonuses yet
          const deliveriesWithoutBonuses = completedEmergencyDeliveries.filter(delivery => 
            delivery.status === 'Completed' && 
            (!delivery.bonusStatus || delivery.bonusStatus === 'Eligible')
          );
          
          if (deliveriesWithoutBonuses.length > 0) {
            
            // Create bonuses for these deliveries
            await createMissingBonuses(deliveriesWithoutBonuses);
          }
        }
      }
    } catch (error) {
      console.error('Error checking emergency deliveries for bonuses:', error);
    }
  };

  // Create missing bonuses for completed emergency deliveries
  const createMissingBonuses = async (deliveries) => {
    try {
      let successCount = 0;
      let errorCount = 0;
      
      for (const delivery of deliveries) {
        try {
          const token = localStorage.getItem('token');
          const response = await fetch(`http://localhost:5000/emergency-requests/${delivery._id}/create-bonus`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (response.ok) {
            const result = await response.json();
            successCount++;
          } else {
            const errorData = await response.json();
            errorCount++;
          }
        } catch (error) {
          errorCount++;
        }
      }
      
      
      // Note: Removed automatic refresh to prevent infinite loops
      // Paysheet and bonus history will be refreshed manually when needed
      
      // Show success notification
      if (successCount > 0) {
        addBonusNotification({
          type: 'bulk-bonus',
          emergencyDetails: {
            brigadeName: `${successCount} Emergency Deliveries`,
            brigadeLocation: 'Multiple Locations',
            bonusAmount: successCount * 5000
          }
        });
      }
      
    } catch (error) {
      console.error('Error creating missing bonuses:', error);
    }
  };

  const downloadDeliveryLogs = async (period = 'monthly') => {
    try {
      let filteredLogs = deliveryLogs;
      
      if (period === 'monthly') {
        // Get current month and year
        const now = new Date();
        const month = now.getMonth() + 1;
        const year = now.getFullYear();
        
        // Fetch completed deliveries for current month
        const response = await customerPurchaseAPI.getCompletedDeliveries(user._id, month, year);
        if (response.statistics && response.statistics.dailyLogs) {
          filteredLogs = response.statistics.dailyLogs;
        }
      } else if (period === 'yearly') {
        // Get current year
        const year = new Date().getFullYear();
        
        // Fetch completed deliveries for current year
        const response = await customerPurchaseAPI.getCompletedDeliveries(user._id, null, year);
        if (response.statistics && response.statistics.dailyLogs) {
          filteredLogs = response.statistics.dailyLogs;
        }
      }

      // Generate PDF using the new function
      await generateDeliveryLogsPDF(profile, filteredLogs, period);
      
    } catch (error) {
      console.error('Error generating delivery logs PDF:', error);
      alert('Error generating PDF. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading driver dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Driver Dashboard</h1>
              <p className="text-gray-600 mt-1">Welcome back, {user?.name}</p>
            </div>
            <div className="flex items-center space-x-4">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                profile.availability === 'Available' 
                  ? 'bg-green-100 text-green-800' 
                  : profile.availability === 'On Delivery'
                  ? 'bg-blue-100 text-blue-800'
                  : profile.availability === 'On Leave'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {profile.availability}
              </span>
              <button
                onClick={handleToggleAvailability}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors duration-300"
              >
                {profile.availability === 'Available' ? 'Go Off Duty' : 'Go Available'}
              </button>
              <button
                onClick={handleLogout}
                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors duration-300"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Bonus Notifications */}
        {bonusNotifications.length > 0 && (
          <div className="fixed top-4 right-4 z-50 space-y-2">
            {bonusNotifications.map((notification) => (
              <div
                key={notification.id}
                className="bg-green-500 text-white p-4 rounded-lg shadow-lg max-w-sm animate-pulse"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold">{notification.title}</h4>
                    <p className="text-sm opacity-90">{notification.message}</p>
                    <p className="text-lg font-bold mt-1">Rs. {notification.amount.toLocaleString()}</p>
                  </div>
                  <button
                    onClick={() => removeBonusNotification(notification.id)}
                    className="text-white hover:text-gray-200 ml-2"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'dashboard', name: 'Dashboard', icon: '📊' },
                { id: 'deliveries', name: 'Deliveries', icon: '🚚' },
                { id: 'emergency', name: 'Emergency', icon: '🚨' },
                { id: 'paysheet', name: 'Paysheet', icon: '💰' },
                { id: 'profile', name: 'Profile', icon: '👤' },
                { id: 'logs', name: 'Delivery Logs', icon: '📋' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Dashboard Overview */}
        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <span className="text-2xl">🚚</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Today's Deliveries</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboardStats.todayDeliveries}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <span className="text-2xl">✅</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboardStats.completedToday}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <span className="text-2xl">🚨</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Emergency Calls</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboardStats.emergencyCalls}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <span className="text-2xl">⭐</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Rating</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboardStats.rating}/5</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <span className="text-2xl">📊</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Deliveries</p>
                  <p className="text-2xl font-bold text-gray-900">{deliveryLogsCount}</p>
                  <p className="text-xs text-gray-500">
                    Last updated: {lastDeliveryUpdate ? new Date(lastDeliveryUpdate).toLocaleTimeString() : 'Never'}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <span className="text-2xl">💰</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Monthly Salary</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboardStats.monthlySalary}</p>
                  <p className="text-xs text-green-600">+ Rs. 5,000 per emergency delivery</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Deliveries Management */}
        {activeTab === 'deliveries' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Delivery Management</h2>
            
            {assignedDeliveries.length > 0 ? (
              <div className="space-y-6">
                {assignedDeliveries.map((delivery) => (
                  <div key={delivery._id} className="border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">Order #{delivery.purchaseNumber}</h3>
                        <p className="text-sm text-gray-600">{delivery.customerName}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        delivery.status === 'Delivered' ? 'bg-green-100 text-green-800' :
                        delivery.status === 'On Delivery' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {delivery.status}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm font-medium text-gray-700">Delivery Address:</p>
                        <p className="text-sm text-gray-600">
                          {delivery.deliveryAddress ? 
                            `${delivery.deliveryAddress.street}, ${delivery.deliveryAddress.city}` : 
                            'Address not provided'
                          }
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">Items:</p>
                        <div className="text-sm text-gray-600">
                          {delivery.items.map((item, index) => (
                            <div key={index}>{item.itemName} - {item.quantity} pcs</div>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm font-medium text-gray-700">Customer Contact:</p>
                        <p className="text-sm text-gray-600">{delivery.customerPhone}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">Total Amount:</p>
                        <p className="text-sm text-gray-600">Rs. {delivery.totalAmount.toFixed(2)}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-600">
                        <p>Assigned: {new Date(delivery.assignedDate).toLocaleString()}</p>
                        {delivery.deliveryStartTime && <p>Started: {new Date(delivery.deliveryStartTime).toLocaleString()}</p>}
                        {delivery.deliveryEndTime && <p>Completed: {new Date(delivery.deliveryEndTime).toLocaleString()}</p>}
                      </div>
                      
                      <div className="flex space-x-2">
                        {delivery.status === 'Assigned' && (
                          <button
                            onClick={() => handleStartDelivery(delivery._id)}
                            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors duration-300"
                          >
                            Start Delivery
                          </button>
                        )}
                        {delivery.status === 'On Delivery' && (
                          <button
                            onClick={() => {
                              const notes = prompt('Add delivery notes (optional):');
                              handleCompleteDelivery(delivery._id, notes);
                            }}
                            className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors duration-300"
                          >
                            Complete Delivery
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No assigned deliveries</h3>
                <p className="text-gray-500">You don't have any deliveries assigned at the moment.</p>
              </div>
            )}
          </div>
        )}

        {/* Emergency Notifications */}
        {activeTab === 'emergency' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Emergency Notifications</h2>
              <button
                onClick={async () => {
                  try {
                    await fetchEmergencyNotifications();
                    alert('✅ Emergency notifications refreshed successfully!');
                  } catch (error) {
                    console.error('Error refreshing emergency notifications:', error);
                    alert('❌ Error refreshing emergency notifications. Please try again.');
                  }
                }}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors duration-300"
              >
                🔄 Refresh Notifications
              </button>
            </div>
            
            <div className="space-y-4">
              {emergencyNotifications.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-400 text-6xl mb-4">🚨</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Emergency Requests</h3>
                  <p className="text-gray-600">You have no active emergency water delivery requests at the moment.</p>
                </div>
              ) : (
                emergencyNotifications.map((notification) => (
                  <div key={notification._id} className="border border-red-200 bg-red-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-medium text-red-900">{notification.brigadeName}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        notification.priority === 'Critical' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {notification.priority} Priority
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                      <div>
                        <p className="text-sm font-medium text-red-700">Water Level:</p>
                        <p className="text-sm text-red-600">{notification.waterLevel}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-red-700">Status:</p>
                        <p className="text-sm text-red-600">{notification.status}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-red-700">Location:</p>
                        <p className="text-sm text-red-600">{notification.brigadeLocation}</p>
                      </div>
                    </div>
                    
                    <div className="text-sm text-red-600 mb-3">
                      <p><strong>Requested:</strong> {new Date(notification.requestDate).toLocaleString()}</p>
                      {notification.description && (
                        <p><strong>Description:</strong> {notification.description}</p>
                      )}
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <button
                        onClick={() => handleShowRouteMap(notification)}
                        className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors duration-200 flex items-center space-x-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m0 0L9 7" />
                        </svg>
                        <span>View Route</span>
                      </button>
                      
                      {notification.status === 'In Progress' && (
                        <button
                          onClick={() => markEmergencyRequestCompleted(notification._id)}
                          className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-colors duration-200"
                        >
                          ✅ Mark as Completed
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Paysheet */}
        {activeTab === 'paysheet' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">💰 Paysheet & Bonus History</h2>
              <div className="flex items-center space-x-4">
                <button
                  onClick={async () => {
                    try {
                      await fetchPaysheetData();
                      await fetchBonusHistory();
                      // Removed monitorDeliveryLogs() to prevent automatic delivery logs updates
                      await checkEmergencyDeliveriesForBonuses();
                      alert('✅ Data refreshed successfully!');
                    } catch (error) {
                      console.error('Error refreshing data:', error);
                      alert('❌ Error refreshing data. Please try again.');
                    }
                  }}
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors duration-300 flex items-center space-x-2"
                >
                  <span>🔄</span>
                  <span>Refresh All Data</span>
                </button>
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-gray-700">Month:</label>
                  <select
                    value={selectedMonth}
                    onChange={(e) => handlePaysheetPeriodChange(parseInt(e.target.value), selectedYear)}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm"
                  >
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {new Date(0, i).toLocaleString('default', { month: 'long' })}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-gray-700">Year:</label>
                  <select
                    value={selectedYear}
                    onChange={(e) => handlePaysheetPeriodChange(selectedMonth, parseInt(e.target.value))}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm"
                  >
                    {Array.from({ length: 5 }, (_, i) => {
                      const year = new Date().getFullYear() - 2 + i;
                      return (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>
            </div>

            {paysheetLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading paysheet data...</p>
              </div>
            ) : paysheetData ? (
              <div className="space-y-6">
                {/* Real-time Bonus Tracking */}
                <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6 mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    🎯 Real-time Bonus Tracking
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Emergency Deliveries This Month</p>
                          <p className="text-2xl font-bold text-green-600">{paysheetData.bonuses.count}</p>
                        </div>
                        <div className="text-3xl">🚨</div>
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Total Bonus Earned</p>
                          <p className="text-2xl font-bold text-green-600">{paysheetData.bonuses.formattedTotalAmount}</p>
                        </div>
                        <div className="text-3xl">💰</div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-green-100 rounded-lg">
                    <p className="text-sm text-green-800">
                      <strong>💡 Tip:</strong> Each emergency water supply delivery earns you Rs. 5,000 bonus automatically!
                    </p>
                  </div>
                </div>

                {/* Paysheet Summary */}
                <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    📊 {paysheetData.period.monthName} {paysheetData.period.year} Paysheet
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <div className="flex items-center">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <span className="text-2xl">💼</span>
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600">Base Salary</p>
                          <p className="text-xl font-bold text-gray-900">{paysheetData.salary.formattedBaseSalary}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <div className="flex items-center">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <span className="text-2xl">🎁</span>
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600">Emergency Bonuses</p>
                          <p className="text-xl font-bold text-gray-900">{paysheetData.bonuses.formattedTotalAmount}</p>
                          <p className="text-xs text-gray-500">{paysheetData.bonuses.count} emergency deliveries</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <div className="flex items-center">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <span className="text-2xl">💰</span>
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600">Total Earnings</p>
                          <p className="text-xl font-bold text-gray-900">{paysheetData.total.formattedTotalEarnings}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bonus Details */}
                {paysheetData.bonuses.details && paysheetData.bonuses.details.length > 0 ? (
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">🚨 Emergency Delivery Bonuses</h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Brigade</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bonus Amount</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {paysheetData.bonuses.details.map((bonus, index) => (
                            <tr key={bonus._id || index}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {new Date(bonus.deliveryDate).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {bonus.brigadeName}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-500">
                                {bonus.brigadeLocation}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                                Rs. {bonus.bonusAmount.toLocaleString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  bonus.status === 'Paid' ? 'bg-green-100 text-green-800' :
                                  bonus.status === 'Approved' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {bonus.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">🚨 Emergency Delivery Bonuses</h3>
                    <div className="text-center py-8">
                      <div className="text-gray-400 text-4xl mb-4">🚨</div>
                      <h4 className="text-lg font-medium text-gray-900 mb-2">No Emergency Deliveries Yet</h4>
                      <p className="text-gray-500 mb-4">
                        You haven't completed any emergency water supply deliveries this month.
                      </p>
                      <div className="bg-blue-50 rounded-lg p-4">
                        <p className="text-sm text-blue-800">
                          <strong>💡 How to earn bonuses:</strong>
                        </p>
                        <ul className="text-sm text-blue-700 mt-2 text-left">
                          <li>• Wait for emergency water supply requests from fire brigades</li>
                          <li>• Accept emergency delivery assignments from your branch manager</li>
                          <li>• Complete the emergency delivery and mark it as "Completed"</li>
                          <li>• Earn Rs. 5,000 bonus automatically for each completed emergency delivery</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}


              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No paysheet data available</h3>
                <p className="text-gray-500">Paysheet information will appear here once you complete emergency deliveries.</p>
              </div>
            )}
          </div>
        )}

        {/* Driver Profile */}
        {activeTab === 'profile' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Driver Profile</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                    <input
                      type="text"
                      value={profile.name}
                      onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      value={profile.email}
                      onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                    <input
                      type="tel"
                      value={profile.phone}
                      onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Vehicle Number</label>
                    <input
                      type="text"
                      value={profile.vehicleNumber}
                      onChange={(e) => setProfile(prev => ({ ...prev, vehicleNumber: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Branch</label>
                    <input
                      type="text"
                      value={profile.branch}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Current Status</label>
                    <div className="flex items-center space-x-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        profile.availability === 'Available' ? 'bg-green-100 text-green-800' :
                        profile.availability === 'On Delivery' ? 'bg-blue-100 text-blue-800' :
                        profile.availability === 'Off Duty' ? 'bg-gray-100 text-gray-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {profile.availability}
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Salary</label>
                    <input
                      type="text"
                      value={profile.salary}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600"
                    />
                  </div>
                </div>
                
                <div className="mt-6 flex space-x-4">
                  <button 
                    onClick={handleUpdateProfile}
                    className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors duration-300"
                  >
                    Update Profile
                  </button>
                  <button 
                    onClick={handleResign}
                    className="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 transition-colors duration-300"
                  >
                    Resign
                  </button>
                </div>
              </div>
              
              <div>
                {/* Status Management */}
                <div className="bg-blue-50 rounded-lg p-6 mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Availability Status</h3>
                  
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600">
                      Update your availability status so branch managers can assign you to emergency requests.
                    </p>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => updateDriverStatus('Available')}
                        disabled={updatingStatus || profile.availability === 'Available'}
                        className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                          profile.availability === 'Available' 
                            ? 'bg-green-500 text-white' 
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        } disabled:opacity-50`}
                      >
                        ✅ Available
                      </button>
                      
                      <button
                        onClick={() => updateDriverStatus('Off Duty')}
                        disabled={updatingStatus || profile.availability === 'Off Duty'}
                        className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                          profile.availability === 'Off Duty' 
                            ? 'bg-gray-500 text-white' 
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        } disabled:opacity-50`}
                      >
                        🚫 Off Duty
                      </button>
                    </div>
                    
                    <div className="text-xs text-gray-500">
                      <p>• <strong>Available:</strong> Ready for emergency assignments</p>
                      <p>• <strong>On Delivery:</strong> Currently delivering (auto-set)</p>
                      <p>• <strong>Off Duty:</strong> Not available for assignments</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Statistics</h3>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Experience:</span>
                      <span className="font-medium">{profile.experience}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Rating:</span>
                      <span className="font-medium">{profile.rating}/5 ⭐</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Deliveries:</span>
                      <span className="font-medium">{profile.totalDeliveries}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Salary:</span>
                      <span className="font-medium text-green-600">{profile.salary}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Branch:</span>
                      <span className="font-medium">{profile.branch}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Current Status:</span>
                      <span className={`font-medium ${
                        profile.availability === 'Available' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {profile.availability}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delivery Logs */}
        {activeTab === 'logs' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Delivery Logs</h2>
              <div className="flex space-x-2">
                <button
                  onClick={async () => {
                    try {
                      await fetchAllDeliveryLogs();
                      alert('✅ Delivery logs refreshed successfully!');
                    } catch (error) {
                      console.error('Error refreshing delivery logs:', error);
                      alert('❌ Error refreshing delivery logs. Please try again.');
                    }
                  }}
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors duration-300"
                >
                  🔄 Refresh Logs
                </button>
                <button
                  onClick={() => downloadDeliveryLogs('monthly')}
                  className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors duration-300"
                >
                  📄 Download Monthly Report
                </button>
                <button
                  onClick={() => downloadDeliveryLogs('yearly')}
                  className="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition-colors duration-300"
                >
                  📊 Download Yearly Report
                </button>
              </div>
            </div>
            
            {deliveryLogs.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Delivery Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Earnings</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {deliveryLogs.map((log, index) => (
                      <tr key={log.id || `log-${index}`} className={log.type === 'emergency' ? 'bg-red-50' : ''}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {new Date(log.date).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center">
                            {log.type === 'emergency' ? (
                              <>
                                <span className="text-red-600 mr-2">🚨</span>
                                <span className="text-red-700 font-medium">Emergency Water Supply</span>
                              </>
                            ) : (
                              <>
                                <span className="text-blue-600 mr-2">💧</span>
                                <span className="text-blue-700 font-medium">Regular Water Delivery</span>
                              </>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {log.type === 'emergency' && log.emergencyDetails ? (
                            <div>
                              <div className="font-medium text-gray-900">{log.emergencyDetails.brigadeName}</div>
                              <div className="text-xs text-gray-600">{log.emergencyDetails.brigadeLocation}</div>
                              <div className="text-xs text-gray-600">Water Level: {log.emergencyDetails.waterLevel}%</div>
                            </div>
                          ) : (
                            <div>
                              <div className="font-medium text-gray-900">{log.deliveries} delivery{log.deliveries > 1 ? 's' : ''}</div>
                              <div className="text-xs text-gray-600">Regular customer deliveries</div>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            log.completed > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {log.completed > 0 ? '✅ Completed' : '❌ Cancelled'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                          {log.type === 'emergency' ? (
                            <div className="flex flex-col">
                              <span className="text-green-600 font-semibold">Rs. 5,000</span>
                              <span className="text-xs text-gray-500">Emergency Bonus</span>
                            </div>
                          ) : (
                            `Rs. ${(log.totalAmount || 0).toFixed(2)}`
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No delivery logs found</h3>
                <p className="text-gray-500">Complete some deliveries to see your delivery logs here.</p>
              </div>
            )}
          </div>
        )}

        {/* Emergency Route Map Modal */}
        {showRouteMap && selectedEmergencyRequest && (
          <EmergencyRouteMap
            emergencyRequest={selectedEmergencyRequest}
            branchLocation={{
              lat: 6.8700, // Colombo 7 Branch - Dehiwala area coordinates
              lng: 79.8700,
              name: user?.branchName || user?.branch || 'Colombo 7 Branch',
              address: '123 Galle Road, Colombo 07, Sri Lanka'
            }}
            onClose={handleCloseRouteMap}
          />
        )}
      </div>
    </div>
  );
};

export default DriverDashboard;
