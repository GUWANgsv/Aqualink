import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../Context/AuthContext';
import { emergencyRequestAPI, branchAPI } from '../../utils/apiService';
import BranchMap from '../Branches/BranchMap';

const FireBrigadeDashboard = () => {
    const { user, logout, deleteProfile, refreshUser } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('dashboard');
    const [waterLevel, setWaterLevel] = useState(100);
    const [showMap, setShowMap] = useState(false);
    const [autoRequestSent, setAutoRequestSent] = useState(false);
    const [recentRequests, setRecentRequests] = useState([]);
    const [pendingRequests, setPendingRequests] = useState([]);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [branches, setBranches] = useState([]);
    const [branchesLoading, setBranchesLoading] = useState(true);
    const [currentBranch, setCurrentBranch] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({
        name: '',
        email: '',
        phone: '',
        brigadeName: '',
        brigadeLocation: '',
        vehicleNumber: '',
        emergencyContact: '',
        emergencyPhone: ''
    });
    const [lastCheckTime, setLastCheckTime] = useState(0);
    const [editLoading, setEditLoading] = useState(false);

    // Debug: Monitor editForm changes
    useEffect(() => {
        console.log('📝 EditForm state changed:', editForm);
    }, [editForm]);

    // Initialize form when user data becomes available and we're in edit mode
    useEffect(() => {
        if (isEditing && user) {
            console.log('📝 User data available, reinitializing form:', user);
            console.log('📝 Current editForm before reinit:', editForm);
            
            const formData = {
                name: user?.name || '',
                email: user?.email || '',
                phone: user?.phone || '',
                brigadeName: user?.brigadeName || '',
                brigadeLocation: user?.brigadeLocation || '',
                vehicleNumber: user?.vehicleNumber || '',
                emergencyContact: user?.emergencyContact || '',
                emergencyPhone: user?.emergencyPhone || ''
            };
            
            // Only update if the form is empty or different
            const isFormEmpty = Object.values(editForm).every(value => value === '');
            if (isFormEmpty || JSON.stringify(formData) !== JSON.stringify(editForm)) {
                console.log('📝 Updating form with user data');
                setEditForm(formData);
            } else {
                console.log('📝 Form already has correct data, skipping update');
            }
        }
    }, [isEditing, user]);

    const handleLogout = () => {
        logout('/login');
        navigate('/login');
    };

    const handleDeleteProfile = async () => {
        setDeleteLoading(true);
        try {
            await deleteProfile();
            // Profile deleted successfully, user is automatically logged out
            navigate('/login');
        } catch (error) {
            console.error('Error deleting profile:', error);
            const errorMessage = error.response?.data?.message || error.message || 'Failed to delete profile. Please try again.';
            alert(errorMessage);
        } finally {
            setDeleteLoading(false);
            setShowDeleteModal(false);
        }
    };

    // Initialize edit form with current user data
    const initializeEditForm = () => {
        console.log('📝 User object for form initialization:', user);
        const formData = {
            name: user?.name || '',
            email: user?.email || '',
            phone: user?.phone || '',
            brigadeName: user?.brigadeName || '',
            brigadeLocation: user?.brigadeLocation || '',
            vehicleNumber: user?.vehicleNumber || '',
            emergencyContact: user?.emergencyContact || '',
            emergencyPhone: user?.emergencyPhone || ''
        };
        console.log('📝 Initializing edit form with user data:', formData);
        setEditForm(formData);
    };

    // Handle edit form submission
    const handleEditSubmit = async (e) => {
        e.preventDefault();
        console.log('🚨 FORM SUBMISSION TRIGGERED!');
        console.log('📝 Form submission event:', e);
        console.log('📝 Current editForm state:', editForm);
        console.log('📝 Is editing:', isEditing);
        
        setEditLoading(true);
        
        console.log('📝 Submitting profile update with data:', editForm);
        
        // Validate form data
        if (!editForm.name || !editForm.email) {
            alert('Please fill in all required fields (Name and Email are required)');
            setEditLoading(false);
            return;
        }
        
        // Validate phone number (10 digits)
        if (editForm.phone && !/^\d{10}$/.test(editForm.phone)) {
            alert('Enter valid Telephone number');
            setEditLoading(false);
            return;
        }
        
        // Check if this is an automatic submission (no user interaction)
        const timeSinceEditStart = Date.now() - (window.editStartTime || 0);
        if (timeSinceEditStart < 1000) { // Less than 1 second since edit started
            console.log('⚠️ Preventing automatic form submission - too soon after edit start');
            setEditLoading(false);
            return;
        }
        
        
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found. Please log in again.');
            }
            
            console.log('🔑 Using token:', token.substring(0, 20) + '...');
            console.log('📤 Sending request to: http://localhost:5000/auth/own-profile');
            
            const response = await fetch('http://localhost:5000/auth/own-profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(editForm)
            });

            console.log('📡 Profile update response status:', response.status);
            const data = await response.json();
            console.log('📡 Profile update response data:', data);
            
            if (response.ok) {
                // Update successful - exit edit mode and refresh data
                setIsEditing(false);
                // Refresh user data from the server
                try {
                    await refreshUser();
                    console.log('✅ Profile updated successfully, user data refreshed');
                } catch (refreshError) {
                    console.error('⚠️ Profile updated but failed to refresh user data:', refreshError);
                }
            } else {
                console.error('❌ Profile update failed:', data);
                const errorMessage = data.message || data.error || 'Failed to update profile';
                throw new Error(errorMessage);
            }
        } catch (error) {
            console.error('❌ Error updating profile:', error);
            alert(`Failed to update profile: ${error.message}`);
        } finally {
            setEditLoading(false);
        }
    };

    // Handle edit form input changes
    const handleEditChange = (e) => {
        const { name, value } = e.target;
        console.log('📝 Form field changed:', { name, value, currentForm: editForm });
        
        // Special handling for phone number - only allow digits
        if (name === 'phone') {
            const numericValue = value.replace(/\D/g, ''); // Remove non-digits
            setEditForm(prev => ({
                ...prev,
                [name]: numericValue
            }));
        } else {
            setEditForm(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    // Start editing
    const handleStartEdit = () => {
        console.log('🚨 START EDIT CLICKED!');
        console.log('✏️ Starting edit mode...');
        console.log('✏️ Current user data:', user);
        console.log('✏️ Current isEditing state:', isEditing);
        
        // Track when edit mode starts
        window.editStartTime = Date.now();
        
        // Initialize form with current user data
        const formData = {
            name: user?.name || '',
            email: user?.email || '',
            phone: user?.phone || '',
            brigadeName: user?.brigadeName || '',
            brigadeLocation: user?.brigadeLocation || '',
            vehicleNumber: user?.vehicleNumber || '',
            emergencyContact: user?.emergencyContact || '',
            emergencyPhone: user?.emergencyPhone || ''
        };
        
        console.log('✏️ Setting form data directly:', formData);
        setEditForm(formData);
        setIsEditing(true);
        console.log('✏️ Edit mode activated, form initialized');
    };

    // Cancel editing
    const handleCancelEdit = () => {
        setIsEditing(false);
        setEditForm({
            name: '',
            email: '',
            phone: '',
            brigadeName: '',
            brigadeLocation: '',
            vehicleNumber: '',
            emergencyContact: '',
            emergencyPhone: ''
        });
    };

    // Fetch branches data
    const fetchBranches = useCallback(async () => {
        try {
            setBranchesLoading(true);
            console.log('🔄 Fetching branches...');
            const response = await branchAPI.getAllBranches();
            console.log('📡 Branches API response:', response);
            
            if (response.success && response.branches && Array.isArray(response.branches)) {
                console.log('✅ Found branches:', response.branches.length);
                // Transform backend data to match frontend format
                const transformedBranches = response.branches.map((branch, index) => {
                    console.log(`Processing branch ${index + 1}:`, branch);
                    // Safe access to nested properties with fallbacks
                    const contactInfo = branch.contactInfo || {};
                    const operatingHours = branch.operatingHours || { open: '08:00', close: '18:00' };
                    const coordinates = branch.coordinates || { lat: 6.9271, lng: 79.8612 }; // Default to Colombo
                    
                    return {
                        id: branch._id,
                        name: branch.name || 'Unnamed Branch',
                        location: branch.location || 'Unknown Location',
                        address: contactInfo.address || 'Address not available',
                        phone: contactInfo.phone || 'Phone not available',
                        email: contactInfo.email || 'Email not available',
                        hours: `${operatingHours?.open || '08:00'} - ${operatingHours?.close || '18:00'}`,
                        services: branch.services || [],
                        coordinates: [coordinates?.lat || 6.9271, coordinates?.lng || 79.8612],
                        type: branch.name && (branch.name.toLowerCase().includes('central') || branch.name.toLowerCase().includes('main')) 
                            ? 'main' 
                            : branch.name && branch.name.toLowerCase().includes('regional')
                            ? 'regional'
                            : 'standard',
                        emergencyContact: branch.emergencyContact || {},
                        status: branch.status || 'Unknown',
                        isCurrentBranch: false // Will be set below
                    };
                });
                
                // Identify current user's branch
                const userBranchName = user?.branchName || user?.branch;
                const userLocation = user?.brigadeLocation || user?.location;
                
                console.log('🔍 User data for branch identification:', {
                    userBranchName,
                    userLocation,
                    fullUser: user
                });
                
                let identifiedCurrentBranch = null;
                
                // Try to match by branch name first
                if (userBranchName) {
                    identifiedCurrentBranch = transformedBranches.find(branch => 
                        branch.name.toLowerCase().includes(userBranchName.toLowerCase()) ||
                        userBranchName.toLowerCase().includes(branch.name.toLowerCase())
                    );
                }
                
                // If not found by name, try to match by location
                if (!identifiedCurrentBranch && userLocation) {
                    identifiedCurrentBranch = transformedBranches.find(branch => 
                        branch.location.toLowerCase().includes(userLocation.toLowerCase()) ||
                        userLocation.toLowerCase().includes(branch.location.toLowerCase())
                    );
                }
                
                // Mark the current branch
                if (identifiedCurrentBranch) {
                    identifiedCurrentBranch.isCurrentBranch = true;
                    setCurrentBranch(identifiedCurrentBranch);
                    console.log('🏢 Current branch identified:', identifiedCurrentBranch.name);
                } else {
                    console.log('⚠️ Could not identify current branch for user:', userBranchName, userLocation);
                    // If no specific branch is identified, we'll show all branches without highlighting any as "current"
                    console.log('📋 Showing all branches without current branch highlight');
                }
                
                setBranches(transformedBranches);
                console.log('✅ Successfully loaded branches:', transformedBranches.length);
            } else {
                console.error('❌ Failed to fetch branches:', response.message || 'Invalid response structure');
                console.log('Response structure:', response);
                // Set empty array as fallback
                setBranches([]);
            }
        } catch (error) {
            console.error('Error fetching branches:', error);
        } finally {
            setBranchesLoading(false);
        }
    }, [user]);

    // Check for completed emergency requests and reset water level
    const checkForCompletedDeliveries = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token || !user?.id) return;
            
            // Debounce: only check if at least 30 seconds have passed since last check
            const now = Date.now();
            if (now - lastCheckTime < 30000) {
                console.log('⏱️ Skipping check - too soon since last check');
                return;
            }
            setLastCheckTime(now);

            // Get emergency requests for this brigade
            const brigadeId = user?.id || user?.brigadeId || 'fire-brigade-001';
            console.log('🔍 Fetching requests for brigade ID:', brigadeId);
            const response = await fetch(`http://localhost:5000/emergency-requests/brigade/${brigadeId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (response.ok) {
                const data = await response.json();
                const requests = data.data || [];
                console.log('📡 All emergency requests for brigade:', requests);
                
                // Check if any request was completed recently (only check actual delivery time, not updatedAt)
                const completedRequests = requests.filter(req => {
                    // Only consider requests that are actually completed
                    if (req.status !== 'Completed') return false;
                    
                    // Only consider requests that have an actual delivery time
                    if (!req.actualDeliveryTime) return false;
                    
                    // Check if the delivery was completed in the last 10 minutes (extended window)
                    const deliveryTime = new Date(req.actualDeliveryTime);
                    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
                    
                    console.log(`Checking request ${req._id}: status=${req.status}, actualDeliveryTime=${req.actualDeliveryTime}, deliveryTime=${deliveryTime}, tenMinutesAgo=${tenMinutesAgo}, isRecent=${deliveryTime > tenMinutesAgo}`);
                    
                    return deliveryTime > tenMinutesAgo;
                });
                
                console.log(`Found ${completedRequests.length} recently completed requests`);
                
                if (completedRequests.length > 0) {
                    console.log('🚰 Resetting water level to 100% due to completed delivery');
                    
                    // Reset water level to 100% and show notification
                    setWaterLevel(100);
                    setAutoRequestSent(false);
                    
                    // Immediately update localStorage to prevent race conditions
                    localStorage.setItem(`waterLevel_${user?.id || 'default'}`, '100');
                    
                    alert('🎉 Water delivery completed! Tank refilled to 100%.');
                    
                    // Update recent requests
                    setRecentRequests(prev => [{
                        id: completedRequests[0]._id,
                        type: 'Delivery Completed',
                        level: 100,
                        status: 'Completed',
                        timestamp: new Date().toLocaleTimeString()
                    }, ...prev.slice(0, 4)]);
                }
                
                // Update pending requests
                setPendingRequests(requests.filter(req => 
                    req.status === 'Approved - Sent to Branch Manager' || 
                    req.status === 'In Progress'
                ));
            }
        } catch (error) {
            console.error('Error checking completed deliveries:', error);
        }
    }, [user, lastCheckTime]);

    // Load water level from localStorage on component mount
    useEffect(() => {
        const savedWaterLevel = localStorage.getItem(`waterLevel_${user?.id || 'default'}`);
        if (savedWaterLevel) {
            setWaterLevel(parseInt(savedWaterLevel));
        }
        
        // Fetch branches data
        fetchBranches();
        
        // Check for completed emergency requests
        checkForCompletedDeliveries();
        
        // Set up interval to check for completed deliveries every 30 seconds (less frequent to avoid spam)
        const interval = setInterval(checkForCompletedDeliveries, 30000);
        
        return () => clearInterval(interval);
    }, [user, fetchBranches, checkForCompletedDeliveries]);

    // Save water level to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem(`waterLevel_${user?.id || 'default'}`, waterLevel.toString());
    }, [waterLevel, user]);

    // Auto-request emergency water when level drops below 35%
    const sendAutomaticEmergencyRequest = async (currentLevel) => {
        try {
            // Generate realistic emergency location from predefined list
            const emergencyLocation = generateRealisticEmergencyLocation();
            
            // Calculate distance from branch for verification
            const branchLocation = { lat: 6.9106, lng: 79.8648 };
            const straightDistance = calculateDistance(
                branchLocation.lat, 
                branchLocation.lng,
                emergencyLocation.lat, 
                emergencyLocation.lng
            );
            const roadDistance = calculateRoadDistance(
                branchLocation.lat, 
                branchLocation.lng,
                emergencyLocation.lat, 
                emergencyLocation.lng
            );
            
            console.log(`🚨 Auto-emergency location generated:`);
            console.log(`📍 Location: ${emergencyLocation.address}, ${emergencyLocation.area}`);
            console.log(`📍 Coordinates: ${emergencyLocation.lat}, ${emergencyLocation.lng}`);
            console.log(`📏 Straight-line distance: ${straightDistance.toFixed(2)} km`);
            console.log(`🛣️ Road distance: ${roadDistance.toFixed(2)} km`);
            
            // Use generated coordinates
            let coordinates = {
                lat: emergencyLocation.lat,
                lng: emergencyLocation.lng
            };

            const requestData = {
                brigadeId: user?.id || 'fire-brigade-001',
                brigadeName: user?.brigadeName || 'Fire Brigade',
                brigadeLocation: `${emergencyLocation.address}, ${emergencyLocation.area}`,
                requestType: 'Emergency Water Supply',
                priority: 'Critical',
                waterLevel: `${currentLevel}%`,
                description: `AUTOMATIC REQUEST: Water level critically low at ${currentLevel}%. Immediate water supply required for emergency operations.`,
                coordinates: coordinates
            };

            const response = await emergencyRequestAPI.createRequest(requestData);
            
            if (response.success) {
                setAutoRequestSent(true);
                alert(`🚨 AUTOMATIC EMERGENCY REQUEST SENT! 🚨\n\nWater level dropped to ${currentLevel}%.\nEmergency water request has been automatically submitted to admin.\nRequest ID: ${response.data._id.slice(-8)}`);
                
                // Add to recent requests
                setRecentRequests(prev => [{
                    id: response.data._id,
                    type: 'Automatic',
                    level: currentLevel,
                    status: 'Pending',
                    timestamp: new Date().toLocaleTimeString()
                }, ...prev.slice(0, 4)]); // Keep only last 5 requests
            }
        } catch (error) {
            console.error('Error sending automatic emergency request:', error);
            alert('Failed to send automatic emergency request. Please submit manually.');
        }
    };

    const handleWaterLevelChange = (newLevel) => {
        setWaterLevel(newLevel);
        
        // Check if water level dropped below 35% and auto-request hasn't been sent
        if (newLevel <= 35 && !autoRequestSent) {
            sendAutomaticEmergencyRequest(newLevel);
        }
        
        // Reset auto-request flag when water level goes above 50%
        if (newLevel > 50) {
            setAutoRequestSent(false);
        }
        
        // Show warning for low levels
        if (newLevel <= 30) {
            alert('Water level is critically low! Emergency request has been automatically sent to admin.');
        }
    };

    // Realistic emergency locations in Colombo area (within 30km radius) - Updated with exact coordinates
    const realisticEmergencyLocations = [
        // Colombo 01-15 areas with exact coordinates provided
        { lat: 6.9355, lng: 79.8430, address: "Fort, Galle Road", area: "Colombo 01" },
        { lat: 6.9219, lng: 79.8507, address: "Slave Island, Kompannavidiya", area: "Colombo 02" },
        { lat: 6.9063, lng: 79.8530, address: "Kollupitiya, Galle Road", area: "Colombo 03" },
        { lat: 6.9004, lng: 79.8560, address: "Bambalapitiya, Galle Road", area: "Colombo 04" },
        { lat: 6.8797, lng: 79.8652, address: "Havelock Town, Galle Road", area: "Colombo 05" },
        { lat: 6.8741, lng: 79.8612, address: "Wellawatte, Galle Road", area: "Colombo 06" },
        { lat: 6.9106, lng: 79.8648, address: "Cinnamon Gardens, Reid Avenue", area: "Colombo 07" },
        { lat: 6.9183, lng: 79.8760, address: "Borella, Baseline Road", area: "Colombo 08" },
        { lat: 6.9391, lng: 79.8787, address: "Dematagoda, Baseline Road", area: "Colombo 09" },
        { lat: 6.9337, lng: 79.8641, address: "Maradana, Baseline Road", area: "Colombo 10" },
        { lat: 6.9385, lng: 79.8577, address: "Pettah Market Area", area: "Colombo 11" },
        { lat: 6.9378, lng: 79.8614, address: "Hulftsdorp, Baseline Road", area: "Colombo 12" },
        { lat: 6.9486, lng: 79.8608, address: "Kotahena, Negombo Road", area: "Colombo 13" },
        { lat: 6.9522, lng: 79.8737, address: "Grandpass, Negombo Road", area: "Colombo 14" },
        { lat: 6.9633, lng: 79.8669, address: "Mutwal, Negombo Road", area: "Colombo 15" },
        
        // Additional specific addresses with exact coordinates
        { lat: 6.9633, lng: 79.8669, address: "Mattakkuliya, Negombo Road", area: "Colombo 15" },
        { lat: 6.9337, lng: 79.8641, address: "Panchikawatte, Baseline Road", area: "Colombo 10" },
        { lat: 6.7730, lng: 79.8816, address: "Moratuwa, Galle Road", area: "Colombo 06" },
        
        // Colombo South areas
        { lat: 6.8700, lng: 79.8700, address: "Ratmalana, Galle Road", area: "Colombo 06" },
        { lat: 6.8600, lng: 79.8600, address: "Moratuwa, Galle Road", area: "Colombo 06" },
        { lat: 6.8500, lng: 79.8500, address: "Panadura, Galle Road", area: "Colombo 06" },
        
        // Colombo West areas
        { lat: 6.9200, lng: 79.8400, address: "Borella, Baseline Road", area: "Colombo 08" },
        { lat: 6.9300, lng: 79.8300, address: "Maradana, Baseline Road", area: "Colombo 10" },
        { lat: 6.9400, lng: 79.8200, address: "Dematagoda, Baseline Road", area: "Colombo 09" },
        
        // Extended areas within 30km
        { lat: 6.8000, lng: 79.9000, address: "Kalutara, Galle Road", area: "Kalutara" },
        { lat: 6.9900, lng: 79.9500, address: "Katunayake, Airport Road", area: "Katunayake" },
        { lat: 6.8500, lng: 79.9200, address: "Kesbewa, High Level Road", area: "Kesbewa" },
        { lat: 6.9500, lng: 79.8000, address: "Kelaniya, Kelaniya Road", area: "Kelaniya" },
        { lat: 6.9000, lng: 79.8000, address: "Ragama, Negombo Road", area: "Ragama" },
        { lat: 6.8200, lng: 79.8800, address: "Horana, Horana Road", area: "Horana" },
        { lat: 6.7800, lng: 79.9200, address: "Bandaragama, Galle Road", area: "Bandaragama" },
        { lat: 6.7600, lng: 79.9400, address: "Wadduwa, Galle Road", area: "Wadduwa" },
        { lat: 6.7400, lng: 79.9600, address: "Kalutara North, Galle Road", area: "Kalutara" },
        { lat: 6.7200, lng: 79.9800, address: "Beruwala, Galle Road", area: "Beruwala" }
    ];

    // Function to calculate road distance (approximate based on road network)
    const calculateRoadDistance = (lat1, lng1, lat2, lng2) => {
        // Straight-line distance
        const straightDistance = calculateDistance(lat1, lng1, lat2, lng2);
        
        // Road distance is typically 1.2-1.5x longer than straight-line distance in Colombo
        // This accounts for road curves, intersections, and traffic patterns
        const roadMultiplier = 1.3; // 30% longer than straight line
        
        return straightDistance * roadMultiplier;
    };

    // Function to generate realistic emergency location from predefined list
    const generateRealisticEmergencyLocation = () => {
        // Filter locations within 30km road distance from Colombo 07 Branch (Cinnamon Gardens)
        const branchLocation = { lat: 6.9106, lng: 79.8648 };
        const validLocations = realisticEmergencyLocations.filter(location => {
            const roadDistance = calculateRoadDistance(
                branchLocation.lat, 
                branchLocation.lng,
                location.lat, 
                location.lng
            );
            return roadDistance <= 30; // Within 30km road distance
        });
        
        // Randomly select one of the valid locations
        const randomIndex = Math.floor(Math.random() * validLocations.length);
        const selectedLocation = validLocations[randomIndex];
        
        return {
            lat: selectedLocation.lat,
            lng: selectedLocation.lng,
            address: selectedLocation.address,
            area: selectedLocation.area
        };
    };

    // Function to calculate distance between two points
    const calculateDistance = (lat1, lng1, lat2, lng2) => {
        const R = 6371; // Earth's radius in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    };


    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-4">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <h1 className="text-2xl font-bold text-red-600">AquaLink Emergency</h1>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            <span className="text-gray-700">Welcome, {user?.name}</span>
                            <span className="text-sm text-gray-500">{user?.brigadeName}</span>
                            <button
                                onClick={handleLogout}
                                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Navigation */}
            <nav className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex space-x-8">
                        <button
                            onClick={() => setActiveTab('dashboard')}
                            className={`py-4 px-1 border-b-2 font-medium text-sm ${
                                activeTab === 'dashboard'
                                    ? 'border-red-500 text-red-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            Dashboard
                        </button>
                        <button
                            onClick={() => setActiveTab('map')}
                            className={`py-4 px-1 border-b-2 font-medium text-sm ${
                                activeTab === 'map'
                                    ? 'border-red-500 text-red-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            Branch Map
                        </button>
                        <button
                            onClick={() => setActiveTab('profile')}
                            className={`py-4 px-1 border-b-2 font-medium text-sm ${
                                activeTab === 'profile'
                                    ? 'border-red-500 text-red-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            Profile
                        </button>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                {activeTab === 'dashboard' && (
                    <div className="px-4 py-6 sm:px-0">
                        <div className="border-4 border-dashed border-gray-200 rounded-lg p-6">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">Emergency Water Supply Dashboard</h2>
                            
                            {/* Water Level Monitor */}
                            <div className="bg-white shadow rounded-lg p-6 mb-6">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">Water Level Monitor</h3>
                                <div className="flex items-center space-x-4">
                                    <div className="flex-1">
                                        <div className="bg-gray-200 rounded-full h-8">
                                            <div 
                                                className={`h-8 rounded-full transition-all duration-300 ${
                                                    waterLevel > 50 ? 'bg-green-500' : 
                                                    waterLevel > 30 ? 'bg-yellow-500' : 'bg-red-500'
                                                }`}
                                                style={{ width: `${waterLevel}%` }}
                                            ></div>
                                        </div>
                                        <p className="text-sm text-gray-600 mt-2">Current Level: {waterLevel}%</p>
                                    </div>
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => handleWaterLevelChange(Math.max(0, waterLevel - 10))}
                                            className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                                        >
                                            Decrease
                                        </button>
                                        <button
                                            onClick={() => handleWaterLevelChange(Math.min(100, waterLevel + 10))}
                                            className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                                        >
                                            Increase
                                        </button>
                                    </div>
                                </div>
                                {waterLevel <= 35 && (
                                    <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
                                        <div className="flex">
                                            <div className="flex-shrink-0">
                                                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                            <div className="ml-3">
                                                <h3 className="text-sm font-medium text-red-800">
                                                    {waterLevel <= 35 ? 'Critical Water Level Alert' : 'Low Water Level Warning'}
                                                </h3>
                                                <p className="text-sm text-red-700 mt-1">
                                                    {waterLevel <= 35 
                                                        ? (autoRequestSent 
                                                            ? 'Emergency request automatically sent to admin!' 
                                                            : 'Water level critically low. Emergency request will be sent automatically.')
                                                        : 'Water level is low. Consider requesting emergency supply.'
                                                    }
                                                </p>
                                                {autoRequestSent && (
                                                    <p className="text-xs text-red-600 mt-1">
                                                        ✅ Automatic emergency request sent to admin dashboard
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Quick Stats */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                <div className="bg-white overflow-hidden shadow rounded-lg">
                                    <div className="p-5">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0">
                                                <div className="w-8 h-8 bg-red-500 rounded-md flex items-center justify-center">
                                                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                                    </svg>
                                                </div>
                                            </div>
                                            <div className="ml-5 w-0 flex-1">
                                                <dl>
                                                    <dt className="text-sm font-medium text-gray-500 truncate">Emergency Requests</dt>
                                                    <dd className="text-lg font-medium text-gray-900">3</dd>
                                                </dl>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white overflow-hidden shadow rounded-lg">
                                    <div className="p-5">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0">
                                                <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                                                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                </div>
                                            </div>
                                            <div className="ml-5 w-0 flex-1">
                                                <dl>
                                                    <dt className="text-sm font-medium text-gray-500 truncate">Approved Requests</dt>
                                                    <dd className="text-lg font-medium text-gray-900">2</dd>
                                                </dl>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white overflow-hidden shadow rounded-lg">
                                    <div className="p-5">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0">
                                                <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                                                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    </svg>
                                                </div>
                                            </div>
                                            <div className="ml-5 w-0 flex-1">
                                                <dl>
                                                    <dt className="text-sm font-medium text-gray-500 truncate">Available Branches</dt>
                                                    <dd className="text-lg font-medium text-gray-900">
                                                        {branchesLoading ? '...' : branches.filter(b => b.status === 'Active').length}
                                                    </dd>
                                                </dl>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Pending Requests */}
                            {pendingRequests.length > 0 && (
                                <div className="bg-white shadow rounded-lg p-6 mb-6">
                                    <h3 className="text-lg font-medium text-gray-900 mb-4">🚚 Pending Water Deliveries</h3>
                                    <div className="space-y-3">
                                        {pendingRequests.map((request) => (
                                            <div key={request._id} className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <p className="font-medium text-blue-900">Water Delivery In Progress</p>
                                                        <p className="text-sm text-blue-700">Status: {request.status}</p>
                                                        <p className="text-xs text-blue-600">
                                                            Requested: {new Date(request.requestDate).toLocaleString()}
                                                        </p>
                                                        {request.assignedDriver && (
                                                            <p className="text-xs text-blue-600">
                                                                Driver: {request.assignedDriver.name}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                            {request.status}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Automatic Emergency System Info */}
                            <div className="bg-white shadow rounded-lg p-6 mb-6">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">🚨 Automatic Emergency System</h3>
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <div className="flex">
                                        <div className="flex-shrink-0">
                                            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                        <div className="ml-3">
                                            <h3 className="text-sm font-medium text-blue-800">
                                                Automatic Emergency Request System
                                            </h3>
                                            <div className="mt-2 text-sm text-blue-700">
                                                <p>• Emergency requests are automatically sent when water level drops below 35%</p>
                                                <p>• System generates realistic emergency locations within 30km radius</p>
                                                <p>• Admin receives notifications and assigns nearest branch</p>
                                                <p>• Water level resets to 100% when delivery is completed</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Recent Activity */}
                            <div className="bg-white shadow rounded-lg p-6">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Emergency Requests</h3>
                                <div className="space-y-4">
                                    {recentRequests.length > 0 ? (
                                        recentRequests.map((request, index) => (
                                            <div key={index} className="flex items-center space-x-3">
                                                <div className="flex-shrink-0">
                                                    <div className={`w-2 h-2 rounded-full ${
                                                        request.type === 'Automatic' ? 'bg-red-400' : 'bg-yellow-400'
                                                    }`}></div>
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-sm text-gray-900">
                                                        {request.type} emergency request - Water level: {request.level}%
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        Status: {request.status} • {request.timestamp}
                                                    </p>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <>
                                    <div className="flex items-center space-x-3">
                                        <div className="flex-shrink-0">
                                            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                                        </div>
                                        <div className="flex-1">
                                                    <p className="text-sm text-gray-900">System ready - No recent emergency requests</p>
                                                    <p className="text-xs text-gray-500">Automatic monitoring active</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-3">
                                        <div className="flex-shrink-0">
                                            <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                                        </div>
                                        <div className="flex-1">
                                                    <p className="text-sm text-gray-900">Automatic emergency system enabled</p>
                                                    <p className="text-xs text-gray-500">Will trigger when water level drops below 35%</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-3">
                                        <div className="flex-shrink-0">
                                            <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                                        </div>
                                        <div className="flex-1">
                                                    <p className="text-sm text-gray-900">Manual requests no longer needed</p>
                                                    <p className="text-xs text-gray-500">System handles all emergency requests automatically</p>
                                        </div>
                                    </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}


                {activeTab === 'map' && (
                    <div className="px-4 py-6 sm:px-0">
                        <div className="border-4 border-dashed border-gray-200 rounded-lg p-6">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">Branch Locations</h2>
                            
                            <div className="bg-white shadow rounded-lg p-6">
                                <div className="mb-4 flex justify-between items-center">
                                    <h3 className="text-lg font-medium text-gray-900">AquaLink Branch Network</h3>
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={fetchBranches}
                                            disabled={branchesLoading}
                                            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {branchesLoading ? 'Refreshing...' : '🔄 Refresh'}
                                        </button>
                                        <button
                                            onClick={() => setShowMap(!showMap)}
                                            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                                        >
                                            {showMap ? 'Hide Map' : 'Show Interactive Map'}
                                        </button>
                                    </div>
                                    </div>

                                {branchesLoading ? (
                                    <div className="flex items-center justify-center h-64">
                                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                                        <span className="ml-3 text-gray-600">Loading branches...</span>
                                    </div>
                                ) : showMap ? (
                                    <div className="h-96 rounded-lg overflow-hidden">
                                        <BranchMap 
                                            branches={branches} 
                                            onBranchSelect={(branch) => {
                                                console.log('Selected branch:', branch);
                                            }}
                                        />
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        {/* Current Branch Section */}
                                        {currentBranch && (
                                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-6">
                                                <div className="flex items-center mb-4">
                                                    <div className="flex-shrink-0">
                                                        <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                                                            <span className="text-white text-lg">🏢</span>
                                                        </div>
                                                    </div>
                                                    <div className="ml-4">
                                                        <h3 className="text-lg font-semibold text-blue-900">Your Current Branch</h3>
                                                        <p className="text-sm text-blue-700">This is your assigned branch location</p>
                                                    </div>
                                    </div>

                                                <div className="bg-white rounded-lg p-4 shadow-sm">
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex-1">
                                                            <h4 className="font-semibold text-gray-900 flex items-center">
                                                                <span className="mr-2">🏢</span>
                                                                {currentBranch.name}
                                                                <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                                    Current Branch
                                                                </span>
                                                            </h4>
                                                            <p className="text-sm text-gray-600 mt-1">{currentBranch.location}</p>
                                                            <p className="text-xs text-gray-500 mt-1">{currentBranch.address}</p>
                                                            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div>
                                                                    <p className="text-xs text-gray-500">
                                                                        📞 {currentBranch.phone}
                                                                    </p>
                                                                    <p className="text-xs text-gray-500">
                                                                        🕒 {currentBranch.hours}
                                                                    </p>
                                    </div>
                                    <div>
                                                                    <p className="text-xs text-gray-500">
                                                                        📍 {currentBranch.coordinates[0].toFixed(4)}, {currentBranch.coordinates[1].toFixed(4)}
                                                                    </p>
                                                                    <p className="text-xs text-gray-500">
                                                                        📧 {currentBranch.email}
                                                                    </p>
                                    </div>
                                            </div>
                                            </div>
                                                        <div className="ml-4">
                                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                                                currentBranch.status === 'Active' 
                                                                    ? 'bg-green-100 text-green-800' 
                                                                    : currentBranch.status === 'Inactive'
                                                                    ? 'bg-red-100 text-red-800'
                                                                    : 'bg-yellow-100 text-yellow-800'
                                                            }`}>
                                                                {currentBranch.status}
                                                            </span>
                                        </div>
                                    </div>
                                                    {currentBranch.services && currentBranch.services.length > 0 && (
                                                        <div className="mt-3">
                                                            <p className="text-xs text-gray-500 mb-2">Available Services:</p>
                                                            <div className="flex flex-wrap gap-1">
                                                                {currentBranch.services.map((service, index) => (
                                                                    <span key={index} className="inline-flex items-center px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">
                                                                        {service}
                                                                    </span>
                                                                ))}
                                            </div>
                                                        </div>
                                        )}
                        </div>
                    </div>
                )}

                                        {/* All Branches Section */}
                                        <div>
                                            <h3 className="text-lg font-medium text-gray-900 mb-4">All AquaLink Branches</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                {branches.map((branch) => (
                                                    <div key={branch.id} className={`p-4 rounded-lg shadow-sm border ${
                                                        branch.isCurrentBranch 
                                                            ? 'bg-blue-50 border-blue-200 ring-2 ring-blue-300' 
                                                            : 'bg-gray-50 border-gray-200'
                                                    }`}>
                                                        <div className="flex items-start justify-between">
                                                            <div className="flex-1">
                                                                <h4 className="font-medium text-gray-900 flex items-center">
                                                                    <span className="mr-2">
                                                                        {branch.type === 'main' ? '🏢' : branch.type === 'regional' ? '🏛️' : '🏪'}
                                                                    </span>
                                                                    {branch.name}
                                                                    {branch.isCurrentBranch && (
                                                                        <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                                            Your Branch
                                                                        </span>
                                                                    )}
                                                                </h4>
                                                                <p className="text-sm text-gray-600 mt-1">{branch.location}</p>
                                                                <p className="text-xs text-gray-500 mt-1">{branch.address}</p>
                                                                <div className="mt-2 space-y-1">
                                                                    <p className="text-xs text-gray-500">
                                                                        📞 {branch.phone}
                                                                    </p>
                                                                    <p className="text-xs text-gray-500">
                                                                        🕒 {branch.hours}
                                                                    </p>
                                                                    <p className="text-xs text-gray-500">
                                                                        📍 {branch.coordinates[0].toFixed(4)}, {branch.coordinates[1].toFixed(4)}
                                                                    </p>
                                </div>
                                        </div>
                                                            <div className="ml-2">
                                                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                                                    branch.status === 'Active' 
                                                                        ? 'bg-green-100 text-green-800' 
                                                                        : branch.status === 'Inactive'
                                                                        ? 'bg-red-100 text-red-800'
                                                                        : 'bg-yellow-100 text-yellow-800'
                                                                }`}>
                                                                    {branch.status}
                                                                </span>
                                    </div>
                                            </div>
                                                        {branch.services && branch.services.length > 0 && (
                                                            <div className="mt-2">
                                                                <div className="flex flex-wrap gap-1">
                                                                    {branch.services.map((service, index) => (
                                                                        <span key={index} className="inline-flex items-center px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">
                                                                            {service}
                                                                        </span>
                                                                    ))}
                                            </div>
                                            </div>
                                                        )}
                                        </div>
                                                ))}
                                            </div>
                                            
                                            {branches.length === 0 && (
                                                <div className="text-center py-8">
                                                    <div className="text-4xl mb-4">🏢</div>
                                                    <p className="text-gray-600">No branches found</p>
                                                    <p className="text-gray-500 text-sm">Please check your connection and try again</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'profile' && (
                    <div className="px-4 py-6 sm:px-0">
                        <div className="border-4 border-dashed border-gray-200 rounded-lg p-6">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">Fire Brigade Profile</h2>
                            
                            {/* Profile Header */}
                            <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-lg p-6 mb-6">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center">
                                            <span className="text-white text-2xl">🚒</span>
                                        </div>
                                    </div>
                                    <div className="ml-4">
                                        <h3 className="text-xl font-semibold text-red-900">{user?.name || 'Fire Brigade Member'}</h3>
                                        <p className="text-red-700">{user?.brigadeName || 'Fire Brigade'}</p>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="bg-white shadow rounded-lg p-6">
                                {!isEditing ? (
                                    // Display View
                                    <>
                                        {/* Personal Information */}
                                        <div className="mb-8">
                                            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                                                <span className="mr-2">👤</span>
                                                Personal Information
                                            </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                                    <label className="block text-sm font-medium text-gray-700">Full Name</label>
                                                    <p className="mt-1 text-sm text-gray-900 font-medium">{user?.name || 'Not provided'}</p>
                                    </div>
                                    <div>
                                                    <label className="block text-sm font-medium text-gray-700">Email Address</label>
                                                    <p className="mt-1 text-sm text-gray-900">{user?.email || 'Not provided'}</p>
                                    </div>
                                    <div>
                                                    <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                                                    <p className="mt-1 text-sm text-gray-900">{user?.phone || 'Not provided'}</p>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700">User ID</label>
                                                    <p className="mt-1 text-sm text-gray-900 font-mono">{user?.id || 'Not available'}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    // Edit Form
                                    <form id="editForm" onSubmit={handleEditSubmit}>
                                        {/* Personal Information Edit */}
                                        <div className="mb-8">
                                            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                                                <span className="mr-2">👤</span>
                                                Personal Information
                                            </h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700">Full Name</label>
                                                    <input
                                                        type="text"
                                                        name="name"
                                                        value={editForm.name}
                                                        readOnly
                                                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50 text-gray-500 cursor-not-allowed"
                                                        required
                                                    />
                                                    <p className="text-xs text-gray-500 mt-1">Name cannot be changed</p>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700">Email Address</label>
                                                    <input
                                                        type="email"
                                                        name="email"
                                                        value={editForm.email}
                                                        readOnly
                                                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50 text-gray-500 cursor-not-allowed"
                                                        required
                                                    />
                                                    <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                                                    <input
                                                        type="tel"
                                                        name="phone"
                                                        value={editForm.phone}
                                                        onChange={handleEditChange}
                                                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-red-500 focus:border-red-500"
                                                        maxLength="10"
                                                        pattern="[0-9]{10}"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700">User ID</label>
                                                    <p className="mt-1 text-sm text-gray-500 font-mono">{user?.id || 'Not available'}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Brigade Information Edit */}
                                        <div className="mb-8">
                                            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                                                <span className="mr-2">🏢</span>
                                                Brigade Information
                                            </h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700">Brigade Name</label>
                                                    <input
                                                        type="text"
                                                        name="brigadeName"
                                                        value={editForm.brigadeName}
                                                        onChange={handleEditChange}
                                                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-red-500 focus:border-red-500"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700">Brigade ID</label>
                                                    <p className="mt-1 text-sm text-gray-500 font-mono">{user?.brigadeId || 'Not assigned'}</p>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700">Assigned Branch</label>
                                                    <p className="mt-1 text-sm text-gray-500">{user?.branchName || user?.branch || 'Not assigned'}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Vehicle Information Edit */}
                                        <div className="mb-8">
                                            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                                                <span className="mr-2">🚛</span>
                                                Vehicle Information
                                            </h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700">Vehicle Number</label>
                                                    <input
                                                        type="text"
                                                        name="vehicleNumber"
                                                        value={editForm.vehicleNumber}
                                                        onChange={handleEditChange}
                                                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-red-500 focus:border-red-500"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700">Vehicle Type</label>
                                                    <p className="mt-1 text-sm text-gray-500">{user?.vehicleType || 'Fire Brigade Vehicle'}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Emergency Contacts Edit */}
                                        <div className="mb-8">
                                            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                                                <span className="mr-2">🚨</span>
                                                Emergency Contacts
                                            </h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700">Emergency Contact</label>
                                                    <input
                                                        type="text"
                                                        name="emergencyContact"
                                                        value={editForm.emergencyContact}
                                                        onChange={handleEditChange}
                                                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-red-500 focus:border-red-500"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700">Emergency Phone</label>
                                                    <input
                                                        type="tel"
                                                        name="emergencyPhone"
                                                        value={editForm.emergencyPhone}
                                                        onChange={handleEditChange}
                                                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-red-500 focus:border-red-500"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </form>
                                )}

                                {/* Brigade Information Display */}
                                {!isEditing && (
                                    <div className="mb-8">
                                        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                                            <span className="mr-2">🏢</span>
                                            Brigade Information
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Brigade Name</label>
                                                <p className="mt-1 text-sm text-gray-900 font-medium">{user?.brigadeName || 'Not assigned'}</p>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Brigade ID</label>
                                                <p className="mt-1 text-sm text-gray-900 font-mono">{user?.brigadeId || 'Not assigned'}</p>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Assigned Branch</label>
                                                <p className="mt-1 text-sm text-gray-900">{user?.branchName || user?.branch || 'Not assigned'}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Vehicle Information Display */}
                                {!isEditing && (
                                    <div className="mb-8">
                                        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                                            <span className="mr-2">🚛</span>
                                            Vehicle Information
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Vehicle Number</label>
                                                <p className="mt-1 text-sm text-gray-900 font-mono">{user?.vehicleNumber || 'Not assigned'}</p>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Vehicle Type</label>
                                                <p className="mt-1 text-sm text-gray-900">{user?.vehicleType || 'Fire Brigade Vehicle'}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Emergency Contacts Display */}
                                {!isEditing && (
                                    <div className="mb-8">
                                        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                                            <span className="mr-2">🚨</span>
                                            Emergency Contacts
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Emergency Contact</label>
                                                <p className="mt-1 text-sm text-gray-900">{user?.emergencyContact || 'Not provided'}</p>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Emergency Phone</label>
                                                <p className="mt-1 text-sm text-gray-900">{user?.emergencyPhone || 'Not provided'}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                
                                {/* System Information */}
                                <div className="mb-8">
                                    <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                                        <span className="mr-2">⚙️</span>
                                        System Information
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Account Status</label>
                                            <span className="mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                Active
                                            </span>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Role</label>
                                            <p className="mt-1 text-sm text-gray-900">{user?.role || 'Fire Brigade Member'}</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Last Login</label>
                                            <p className="mt-1 text-sm text-gray-900">{new Date().toLocaleString()}</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Account Created</label>
                                            <p className="mt-1 text-sm text-gray-900">{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Not available'}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Current Branch Information */}
                                {currentBranch && (
                                    <div className="mb-8">
                                        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                                            <span className="mr-2">📍</span>
                                            Current Branch Information
                                        </h3>
                                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-blue-700">Branch Name</label>
                                                    <p className="mt-1 text-sm text-blue-900 font-medium">{currentBranch.name}</p>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-blue-700">Branch Location</label>
                                                    <p className="mt-1 text-sm text-blue-900">{currentBranch.location}</p>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-blue-700">Branch Address</label>
                                                    <p className="mt-1 text-sm text-blue-900">{currentBranch.address}</p>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-blue-700">Branch Phone</label>
                                                    <p className="mt-1 text-sm text-blue-900">{currentBranch.phone}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                
                                {/* Action Buttons */}
                                <div className="mt-8 flex flex-col sm:flex-row gap-4">
                                    {!isEditing ? (
                                        // Display Mode Buttons
                                        <>
                                            <button 
                                                type="button"
                                                onClick={handleStartEdit}
                                                className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 flex items-center justify-center"
                                            >
                                                <span className="mr-2">✏️</span>
                                                Edit Profile
                                            </button>
                                            <button 
                                                type="button"
                                                onClick={() => setShowDeleteModal(true)}
                                                className="bg-red-600 text-white px-6 py-3 rounded-md hover:bg-red-700 flex items-center justify-center"
                                            >
                                                <span className="mr-2">🗑️</span>
                                                Delete Profile
                                            </button>
                                        </>
                                    ) : (
                                        // Edit Mode Buttons
                                        <>
                                            <button 
                                                type="submit"
                                                form="editForm"
                                                disabled={editLoading}
                                                className={`px-6 py-3 rounded-md flex items-center justify-center ${
                                                    editLoading 
                                                        ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                                                        : 'bg-green-600 text-white hover:bg-green-700'
                                                }`}
                                            >
                                                {editLoading ? (
                                                    <>
                                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                                        Saving...
                                                    </>
                                                ) : (
                                                    <>
                                                        <span className="mr-2">💾</span>
                                                        Save Changes
                                                    </>
                                                )}
                                            </button>
                                            <button 
                                                type="button"
                                                onClick={handleCancelEdit}
                                                className="bg-gray-600 text-white px-6 py-3 rounded-md hover:bg-gray-700 flex items-center justify-center"
                                            >
                                                <span className="mr-2">❌</span>
                                                Cancel
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* Delete Profile Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                        <div className="mt-3 text-center">
                            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mt-4">Delete Profile</h3>
                            <div className="mt-2 px-7 py-3">
                                <p className="text-sm text-gray-500">
                                    Are you sure you want to delete your profile? This action cannot be undone and will permanently remove all your data from the system.
                                </p>
                            </div>
                            <div className="items-center px-4 py-3">
                                <button
                                    onClick={handleDeleteProfile}
                                    disabled={deleteLoading}
                                    className="px-4 py-2 bg-red-600 text-white text-base font-medium rounded-md w-24 mr-2 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-300 disabled:opacity-50"
                                >
                                    {deleteLoading ? 'Deleting...' : 'Delete'}
                                </button>
                                <button
                                    onClick={() => setShowDeleteModal(false)}
                                    className="px-4 py-2 bg-gray-500 text-white text-base font-medium rounded-md w-24 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300"
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

export default FireBrigadeDashboard;
