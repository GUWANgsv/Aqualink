import React, { useState, useEffect } from 'react';
import { useAuth } from '../../Context/AuthContext';

const EmergencySystem = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [waterLevel, setWaterLevel] = useState(75);
  const [emergencyRequests, setEmergencyRequests] = useState([]);
  const [nearbyBranches, setNearbyBranches] = useState([]);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sample data (in real app, this would come from API)
  const sampleEmergencyRequests = [
    {
      id: 1,
      location: 'Colombo Fire Station',
      waterLevel: '25%',
      status: 'Pending',
      requestTime: '2024-03-15 14:30',
      priority: 'High',
      description: 'Water level critically low, immediate assistance required'
    },
    {
      id: 2,
      location: 'Kandy Fire Station',
      waterLevel: '20%',
      status: 'Approved',
      requestTime: '2024-03-15 13:15',
      priority: 'High',
      description: 'Emergency water supply needed for firefighting operations'
    }
  ];

  const sampleNearbyBranches = [
    {
      id: 1,
      name: 'Colombo Central Branch',
      location: 'Colombo 03',
      distance: '2.5 km',
      capacity: 1000,
      status: 'Available',
      contact: '+94 11 234 5678'
    },
    {
      id: 2,
      name: 'Kandy Branch',
      location: 'Kandy City',
      distance: '8.3 km',
      capacity: 800,
      status: 'Available',
      contact: '+94 81 234 5678'
    },
    {
      id: 3,
      name: 'Galle Branch',
      location: 'Galle City',
      distance: '45.2 km',
      capacity: 600,
      status: 'Available',
      contact: '+94 91 234 5678'
    }
  ];

  useEffect(() => {
    // Simulate API calls
    setTimeout(() => {
      setEmergencyRequests(sampleEmergencyRequests);
      setNearbyBranches(sampleNearbyBranches);
      setLoading(false);
    }, 1000);
  }, []);

  const handleWaterLevelChange = (newLevel) => {
    setWaterLevel(newLevel);
    
    // If water level drops below 30%, automatically create emergency request
    if (newLevel <= 30) {
      const newRequest = {
        id: Date.now(),
        location: user?.brigadeName || 'Fire Station',
        waterLevel: `${newLevel}%`,
        status: 'Pending',
        requestTime: new Date().toLocaleString(),
        priority: 'High',
        description: 'Water level critically low, immediate assistance required'
      };
      setEmergencyRequests(prev => [newRequest, ...prev]);
    }
  };

  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCurrentLocation({ latitude, longitude });
          
          // Filter branches within 50km range (simplified calculation)
          const filteredBranches = sampleNearbyBranches.filter(branch => {
            const distance = parseFloat(branch.distance);
            return distance <= 50;
          });
          setNearbyBranches(filteredBranches);
        },
        (error) => {
          console.error('Error getting location:', error);
          alert('Unable to get current location. Please enable location services.');
        }
      );
    } else {
      alert('Geolocation is not supported by this browser.');
    }
  };

  const handleEmergencyRequest = () => {
    const newRequest = {
      id: Date.now(),
      location: user?.brigadeName || 'Fire Station',
      waterLevel: `${waterLevel}%`,
      status: 'Pending',
      requestTime: new Date().toLocaleString(),
      priority: 'High',
      description: 'Manual emergency water request initiated'
    };
    setEmergencyRequests(prev => [newRequest, ...prev]);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading emergency system...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-red-600 text-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">🚨 Emergency Water Supply System</h1>
              <p className="mt-1 opacity-90">Fire Brigade Access - {user?.brigadeName || 'Emergency Station'}</p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="bg-red-700 px-3 py-1 rounded-full text-sm font-medium">
                Emergency Mode
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'dashboard', name: 'Dashboard', icon: '📊' },
                { id: 'water-meter', name: 'Water Meter', icon: '💧' },
                { id: 'emergency', name: 'Emergency Requests', icon: '🚨' },
                { id: 'branches', name: 'Nearby Branches', icon: '🏢' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-red-500 text-red-600'
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
                <div className="p-2 bg-red-100 rounded-lg">
                  <span className="text-2xl">💧</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Current Water Level</p>
                  <p className={`text-2xl font-bold ${waterLevel <= 30 ? 'text-red-600' : 'text-gray-900'}`}>
                    {waterLevel}%
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <span className="text-2xl">🚨</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Requests</p>
                  <p className="text-2xl font-bold text-gray-900">{emergencyRequests.filter(r => r.status === 'Pending').length}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <span className="text-2xl">🏢</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Available Branches</p>
                  <p className="text-2xl font-bold text-gray-900">{nearbyBranches.filter(b => b.status === 'Available').length}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <span className="text-2xl">📍</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Location Status</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {currentLocation ? 'Active' : 'Inactive'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Water Meter */}
        {activeTab === 'water-meter' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Water Level Monitor</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Current Water Level</h3>
                  
                  <div className="relative">
                    <div className="w-full bg-gray-200 rounded-full h-8 mb-4">
                      <div 
                        className={`h-8 rounded-full transition-all duration-500 ${
                          waterLevel <= 30 ? 'bg-red-500' : 
                          waterLevel <= 50 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${waterLevel}%` }}
                      ></div>
                    </div>
                    
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>0%</span>
                      <span>25%</span>
                      <span>50%</span>
                      <span>75%</span>
                      <span>100%</span>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <p className={`text-lg font-bold ${
                      waterLevel <= 30 ? 'text-red-600' : 
                      waterLevel <= 50 ? 'text-yellow-600' : 'text-green-600'
                    }`}>
                      {waterLevel}% - {
                        waterLevel <= 30 ? 'CRITICAL' : 
                        waterLevel <= 50 ? 'LOW' : 'NORMAL'
                      }
                    </p>
                  </div>
                </div>
                
                <div className="mt-6">
                  <h4 className="text-md font-medium text-gray-900 mb-3">Manual Water Level Adjustment</h4>
                  <div className="flex items-center space-x-4">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={waterLevel}
                      onChange={(e) => handleWaterLevelChange(parseInt(e.target.value))}
                      className="flex-1"
                    />
                    <span className="text-lg font-medium text-gray-900 w-16">{waterLevel}%</span>
                  </div>
                </div>
              </div>
              
              <div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-red-900 mb-4">Emergency Actions</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-red-700">Automatic Alert:</span>
                      <span className={`px-2 py-1 rounded text-sm font-medium ${
                        waterLevel <= 30 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {waterLevel <= 30 ? 'ACTIVE' : 'Inactive'}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-red-700">Status:</span>
                      <span className={`px-2 py-1 rounded text-sm font-medium ${
                        waterLevel <= 30 ? 'bg-red-100 text-red-800' : 
                        waterLevel <= 50 ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {waterLevel <= 30 ? 'CRITICAL' : 
                         waterLevel <= 50 ? 'LOW' : 'NORMAL'}
                      </span>
                    </div>
                    
                    <div className="pt-4">
                      <button
                        onClick={handleEmergencyRequest}
                        className="w-full bg-red-600 text-white py-3 px-6 rounded-lg hover:bg-red-700 transition-colors duration-300 font-medium"
                      >
                        🚨 Request Emergency Water Supply
                      </button>
                    </div>
                    
                    <div className="text-sm text-red-600">
                      <p>• Automatic alerts trigger when water level ≤ 30%</p>
                      <p>• Manual requests can be sent anytime</p>
                      <p>• Emergency requests are prioritized</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Emergency Requests */}
        {activeTab === 'emergency' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Emergency Requests</h2>
            
            <div className="space-y-4">
              {emergencyRequests.map((request) => (
                <div key={request.id} className="border border-red-200 bg-red-50 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-medium text-red-900">{request.location}</h3>
                      <p className="text-sm text-red-600">{request.description}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        request.priority === 'High' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {request.priority} Priority
                      </span>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        request.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                        request.status === 'Approved' ? 'bg-blue-100 text-blue-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {request.status}
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-sm font-medium text-red-700">Water Level:</p>
                      <p className="text-sm text-red-600">{request.waterLevel}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-red-700">Request Time:</p>
                      <p className="text-sm text-red-600">{request.requestTime}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-red-700">Request ID:</p>
                      <p className="text-sm text-red-600">#{request.id}</p>
                    </div>
                  </div>
                  
                  {request.status === 'Pending' && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <p className="text-sm text-yellow-800">
                        ⏳ Request is being processed. Admin will assign available drivers shortly.
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Nearby Branches */}
        {activeTab === 'branches' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Nearby Branches (50km Range)</h2>
              <button
                onClick={handleGetCurrentLocation}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors duration-300"
              >
                📍 Get Current Location
              </button>
            </div>
            
            {currentLocation && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-800">
                  📍 Current Location: {currentLocation.latitude.toFixed(4)}, {currentLocation.longitude.toFixed(4)}
                </p>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {nearbyBranches.map((branch) => (
                <div key={branch.id} className="border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">{branch.name}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      branch.status === 'Available' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {branch.status}
                    </span>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Location:</span>
                      <span className="font-medium">{branch.location}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Distance:</span>
                      <span className="font-medium">{branch.distance}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Capacity:</span>
                      <span className="font-medium">{branch.capacity} units</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Contact:</span>
                      <span className="font-medium">{branch.contact}</span>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <button className="w-full bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 transition-colors duration-300 text-sm">
                      📞 Contact Branch
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            {nearbyBranches.length === 0 && (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🏢</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No branches found</h3>
                <p className="text-gray-600">No branches available within 50km range.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default EmergencySystem;
