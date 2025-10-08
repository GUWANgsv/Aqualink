import React, { useEffect, useState } from 'react';
import InteractiveMap from './InteractiveMap';

const EmergencyRouteMap = ({ emergencyRequest, branchLocation, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [distance, setDistance] = useState(null);
  const [estimatedTime, setEstimatedTime] = useState(null);
  const [showRoute, setShowRoute] = useState(true); // Automatically show route when map is visible
  const [generatedEmergencyLocation, setGeneratedEmergencyLocation] = useState(null);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [routeInstructions, setRouteInstructions] = useState([]);
  
  // Default coordinates for Colombo 7, Sri Lanka
  const defaultCenter = [6.8700, 79.8700]; // Colombo 7 (Dehiwala) coordinates

  // Parse branch coordinates
  const branchCoords = branchLocation ? 
    [branchLocation.lat || 6.8700, branchLocation.lng || 79.8700] : 
    defaultCenter;

  // Handle emergency location generation
  const handleEmergencyLocationGenerated = (location) => {
    setGeneratedEmergencyLocation(location);
    console.log('🎯 Emergency location generated:', location);
    
    // Update distance and time if provided
    if (location.distance) {
      setDistance(location.distance);
    }
    if (location.estimatedTime) {
      setEstimatedTime(location.estimatedTime);
    }
    
    // Show special message for exact coordinates
    if (location.type === 'exact') {
      console.log('✅ Using exact coordinates for address:', location.address);
    } else if (location.type === 'geocoded') {
      console.log('🌍 Successfully geocoded address:', location.address);
    }
  };

  // Handle route calculation
  const handleRouteCalculated = (routeData) => {
    setDistance(routeData.distance);
    setEstimatedTime(routeData.estimatedTime);
    if (routeData.instructions) {
      setRouteInstructions(routeData.instructions);
    }
    console.log('🛣️ Route calculated:', routeData);
  };

  // Handle show route button click
  const handleShowRoute = () => {
    setShowRoute(true);
    console.log('🗺️ Showing route on map');
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-11/12 max-w-6xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              🗺️ Emergency Route Map - Colombo 7 Branch
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Interactive Map */}
          <div className="mb-4">
            <InteractiveMap
              branchLocation={{
                name: branchLocation?.name || 'Colombo 7 Branch',
                address: branchLocation?.address || '123 Galle Road, Colombo 07, Sri Lanka',
                coordinates: branchCoords
              }}
              emergencyRequest={emergencyRequest}
              showRoute={showRoute}
              onRouteCalculated={handleRouteCalculated}
              onEmergencyLocationGenerated={handleEmergencyLocationGenerated}
            />
          </div>
          
          {/* Route Controls */}
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-blue-900">🗺️ Route Navigation</h4>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-blue-700">Show Route:</span>
                <button
                  onClick={() => setShowRoute(!showRoute)}
                  className={`px-3 py-1 rounded text-sm font-medium ${
                    showRoute 
                      ? 'bg-green-100 text-green-800 border border-green-300' 
                      : 'bg-gray-100 text-gray-800 border border-gray-300'
                  }`}
                >
                  {showRoute ? '✅ Visible' : '👁️ Show'}
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <span className="text-blue-600">📏</span>
                <span className="text-gray-700">Distance:</span>
                <span className="font-medium text-blue-800">
                  {distance ? `${distance.toFixed(1)} km` : 'Calculating...'}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-blue-600">⏱️</span>
                <span className="text-gray-700">Est. Time:</span>
                <span className="font-medium text-blue-800">
                  {estimatedTime || 'Calculating...'}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-blue-600">🚨</span>
                <span className="text-gray-700">Priority:</span>
                <span className={`font-medium ${
                  emergencyRequest?.priority === 'Critical' ? 'text-red-600' :
                  emergencyRequest?.priority === 'High' ? 'text-orange-600' :
                  'text-yellow-600'
                }`}>
                  {emergencyRequest?.priority || 'Normal'}
                </span>
              </div>
            </div>
          </div>

          {/* Route Instructions */}
          {routeInstructions.length > 0 && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="font-medium text-green-900 mb-3">🧭 Route Instructions</h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {routeInstructions.map((instruction, index) => (
                  <div key={index} className="flex items-start space-x-3 text-sm">
                    <span className="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-medium">
                      {index + 1}
                    </span>
                    <span className="text-green-800">{instruction}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Emergency Location Info */}
          <div className="mb-4 p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="flex justify-between items-center">
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 mb-1">🚨 Emergency Location</h4>
                <p className="text-sm text-gray-600 mb-2">📍 {emergencyRequest?.brigadeLocation}</p>
                {generatedEmergencyLocation && (
                  <p className="text-xs text-blue-600 mb-2">
                    {generatedEmergencyLocation.type === 'exact' ? '✅ Exact location found' :
                     generatedEmergencyLocation.type === 'geocoded' ? '🌍 Geocoded from address' :
                     generatedEmergencyLocation.type === 'provided' ? '📍 Using provided coordinates' :
                     '🎲 Generated location'}
                  </p>
                )}
              </div>
              <div className="flex flex-col items-end space-y-2">
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-sm"
                >
                  Close Map
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmergencyRouteMap;