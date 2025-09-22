import React, { useEffect, useState } from 'react';
import InteractiveMap from './InteractiveMap';

const EmergencyRouteMap = ({ emergencyRequest, branchLocation, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [distance, setDistance] = useState(null);
  const [estimatedTime, setEstimatedTime] = useState(null);
  const [showRoute, setShowRoute] = useState(false);
  const [generatedEmergencyLocation, setGeneratedEmergencyLocation] = useState(null);
  const [isGeocoding, setIsGeocoding] = useState(false);
  
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
          
          {/* Navigation Info - Only this section below the map */}
          <div className="mb-4 p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="flex justify-between items-center">
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 mb-1">🚨 Emergency Route</h4>
                <p className="text-sm text-gray-600 mb-2">📍 {emergencyRequest?.brigadeLocation}</p>
                <div className="flex space-x-6 text-sm">
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-500">📏</span>
                    <span className="text-gray-600">Distance:</span>
                    <span className="font-medium text-blue-600">
                      {distance ? `${distance.toFixed(1)} km` : 'Calculating...'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-500">⏱️</span>
                    <span className="text-gray-600">Time:</span>
                    <span className="font-medium text-green-600">
                      {estimatedTime || 'Calculating...'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end space-y-2">
                {emergencyRequest?.priority && (
                  <span className={`px-3 py-1 rounded text-sm font-medium ${
                    emergencyRequest.priority === 'Critical' ? 'bg-red-100 text-red-800' :
                    emergencyRequest.priority === 'High' ? 'bg-orange-100 text-orange-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {emergencyRequest.priority}
                  </span>
                )}
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-sm"
                >
                  Close
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