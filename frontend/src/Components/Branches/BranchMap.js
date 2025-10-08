import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// Custom branch icon
const createBranchIcon = (color, branchType) => {
  return L.divIcon({
    className: 'custom-branch-icon',
    html: `
      <div style="
        background-color: ${color};
        width: 35px;
        height: 35px;
        border-radius: 50% 50% 50% 0;
        border: 3px solid white;
        box-shadow: 0 3px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        color: white;
        transform: rotate(-45deg);
      ">
        <span style="transform: rotate(45deg);">${branchType}</span>
      </div>
    `,
    iconSize: [35, 35],
    iconAnchor: [17, 35],
  });
};

// Branch icons
const branchIcon = createBranchIcon('#3B82F6', '🏢');
const mainBranchIcon = createBranchIcon('#10B981', '🏢');
const regionalBranchIcon = createBranchIcon('#F59E0B', '🏢');

// Component to handle map updates
const MapUpdater = ({ center, zoom }) => {
  const map = useMap();
  
  useEffect(() => {
    if (center && zoom) {
      map.setView(center, zoom);
    }
  }, [center, zoom, map]);
  
  return null;
};

// Geocoding function to convert addresses to coordinates
const geocodeAddress = async (address) => {
  try {
    console.log('🌍 Geocoding address:', address);
    
    // Try multiple geocoding approaches
    const results = await Promise.allSettled([
      geocodeWithNominatim(address),
      geocodeWithPhoton(address),
    ]);
    
    // Collect all valid results
    const validResults = results
      .filter(result => result.status === 'fulfilled' && result.value)
      .map(result => result.value)
      .flat();
    
    if (validResults.length === 0) {
      console.log('⚠️ No geocoding results found for:', address);
      return null;
    }
    
    // Score and rank all results
    const scoredResults = validResults.map(result => ({
      ...result,
      score: calculateLocationScore(result, address)
    })).sort((a, b) => b.score - a.score);
    
    const bestResult = scoredResults[0];
    const coords = [parseFloat(bestResult.lat), parseFloat(bestResult.lon)];
    
    console.log('✅ Best geocoding result:', coords);
    return coords;
    
  } catch (error) {
    console.error('❌ Geocoding failed:', error);
    return null;
  }
};

// Geocoding with OpenStreetMap Nominatim
const geocodeWithNominatim = async (address) => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=3&countrycodes=lk&addressdetails=1`
    );
    
    if (response.ok) {
      const data = await response.json();
      return data.filter(result => 
        parseFloat(result.lat) > 5.5 && parseFloat(result.lat) < 10.0 &&
        parseFloat(result.lon) > 79.0 && parseFloat(result.lon) < 82.0
      );
    }
    return [];
  } catch (error) {
    console.log('⚠️ Nominatim geocoding failed:', error.message);
    return [];
  }
};

// Geocoding with Photon (Komoot)
const geocodeWithPhoton = async (address) => {
  try {
    const response = await fetch(
      `https://photon.komoot.io/api?q=${encodeURIComponent(address + ', Sri Lanka')}&limit=3&lang=en`
    );
    
    if (response.ok) {
      const data = await response.json();
      return (data.features || []).map(feature => ({
        lat: feature.geometry.coordinates[1],
        lon: feature.geometry.coordinates[0],
        display_name: feature.properties.name,
        type: feature.properties.type,
        importance: feature.properties.importance
      })).filter(result => 
        parseFloat(result.lat) > 5.5 && parseFloat(result.lat) < 10.0 &&
        parseFloat(result.lon) > 79.0 && parseFloat(result.lon) < 82.0
      );
    }
    return [];
  } catch (error) {
    console.log('⚠️ Photon geocoding failed:', error.message);
    return [];
  }
};

// Calculate location score for better address matching
const calculateLocationScore = (result, originalAddress) => {
  let score = 0;
  const displayName = (result.display_name || result.name || '').toLowerCase();
  const originalLower = originalAddress.toLowerCase();
  
  // Exact match bonus
  if (displayName.includes(originalLower)) score += 100;
  
  // Word-by-word matching
  const addressWords = originalLower.split(/[\s,]+/).filter(word => word.length > 2);
  addressWords.forEach(word => {
    if (displayName.includes(word)) score += 20;
  });
  
  // Sri Lanka context bonus
  if (displayName.includes('sri lanka') || displayName.includes('colombo')) score += 30;
  
  // Importance bonus
  if (result.importance) score += result.importance * 20;
  
  return score;
};

// Known coordinates for major Sri Lankan cities
const knownLocations = {
  'colombo': [6.9271, 79.8612],
  'colombo 03': [6.9063, 79.8530],
  'kandy': [7.2906, 80.6337],
  'galle': [6.0329, 80.2169],
  'negombo': [7.2086, 79.8358],
  'matara': [5.9483, 80.5550],
  'jaffna': [9.6615, 80.0255],
  'anuradhapura': [8.3114, 80.4037],
  'trincomalee': [8.5874, 81.2152],
  'batticaloa': [7.7102, 81.6924],
  'kurunegala': [7.4863, 80.3633],
  'ratnapura': [6.6828, 80.4012],
  'badulla': [6.9934, 81.0550]
};

const BranchMap = ({ branches, onBranchSelect }) => {
  const [branchCoordinates, setBranchCoordinates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mapCenter, setMapCenter] = useState([7.2906, 80.6337]); // Center of Sri Lanka
  const [mapZoom, setMapZoom] = useState(7);
  const mapRef = useRef(null);

  // Process branches and get coordinates
  useEffect(() => {
    const processBranches = async () => {
      setLoading(true);
      const coordinates = [];
      
      for (const branch of branches) {
        let coords = null;
        
        // Check if branch already has coordinates from backend
        if (branch.coordinates && branch.coordinates.length === 2) {
          coords = branch.coordinates;
          console.log('📍 Using backend coordinates for:', branch.name, coords);
        } else {
          // Fallback: try to get coordinates from known locations
          const locationKey = branch.location.toLowerCase();
          if (knownLocations[locationKey]) {
            coords = knownLocations[locationKey];
            console.log('📍 Using known coordinates for:', branch.name, coords);
          } else {
            // Try geocoding the address
            coords = await geocodeAddress(branch.address);
          }
        }
        
        if (coords) {
          coordinates.push({
            ...branch,
            coordinates: coords,
            icon: branch.name.toLowerCase().includes('main') || branch.name.toLowerCase().includes('central') 
              ? mainBranchIcon 
              : branch.name.toLowerCase().includes('regional')
              ? regionalBranchIcon
              : branchIcon
          });
        } else {
          console.log('⚠️ Could not get coordinates for:', branch.name);
        }
      }
      
      setBranchCoordinates(coordinates);
      
      // Update map center and zoom based on branch locations
      if (coordinates.length > 0) {
        if (coordinates.length === 1) {
          setMapCenter(coordinates[0].coordinates);
          setMapZoom(12);
        } else {
          // Calculate center point of all branches
          const avgLat = coordinates.reduce((sum, branch) => sum + branch.coordinates[0], 0) / coordinates.length;
          const avgLng = coordinates.reduce((sum, branch) => sum + branch.coordinates[1], 0) / coordinates.length;
          setMapCenter([avgLat, avgLng]);
          setMapZoom(8);
        }
      }
      
      setLoading(false);
    };

    if (branches && branches.length > 0) {
      processBranches();
    } else {
      setLoading(false);
    }
  }, [branches]);

  const handleBranchClick = (branch) => {
    if (onBranchSelect) {
      onBranchSelect(branch);
    }
  };

  if (loading) {
    return (
      <div className="w-full h-96 bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading branch locations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-96 border border-gray-300 rounded-lg overflow-hidden relative">
      <MapContainer
        ref={mapRef}
        center={mapCenter}
        zoom={mapZoom}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <MapUpdater center={mapCenter} zoom={mapZoom} />
        
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Branch Markers */}
        {branchCoordinates.map((branch) => (
          <Marker 
            key={branch.id} 
            position={branch.coordinates} 
            icon={branch.icon}
            eventHandlers={{
              click: () => handleBranchClick(branch)
            }}
          >
            <Popup>
              <div className="p-3 min-w-72">
                <h3 className="font-bold text-blue-600 mb-3 text-lg">🏢 {branch.name}</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start space-x-2">
                    <span className="text-gray-500 mt-0.5">📍</span>
                    <div>
                      <p className="font-medium text-gray-700">Location</p>
                      <p className="text-gray-600">{branch.location}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-2">
                    <span className="text-gray-500 mt-0.5">🏠</span>
                    <div>
                      <p className="font-medium text-gray-700">Address</p>
                      <p className="text-gray-600">{branch.address}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-2">
                    <span className="text-gray-500 mt-0.5">📞</span>
                    <div>
                      <p className="font-medium text-gray-700">Phone</p>
                      <p className="text-gray-600">{branch.phone}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-2">
                    <span className="text-gray-500 mt-0.5">✉️</span>
                    <div>
                      <p className="font-medium text-gray-700">Email</p>
                      <p className="text-gray-600">{branch.email}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-2">
                    <span className="text-gray-500 mt-0.5">🕒</span>
                    <div>
                      <p className="font-medium text-gray-700">Hours</p>
                      <p className="text-gray-600">{branch.hours}</p>
                    </div>
                  </div>
                  
                  <div className="mt-3">
                    <p className="font-medium text-gray-700 mb-2">🛠️ Services</p>
                    <div className="flex flex-wrap gap-1">
                      {branch.services.map((service, index) => (
                        <span 
                          key={index}
                          className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded font-medium"
                        >
                          {service}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  {branch.emergencyContact && (
                    <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded">
                      <p className="text-red-800 font-medium text-xs mb-1">🚨 Emergency Contact</p>
                      <div className="text-xs text-red-700">
                        {branch.emergencyContact.name && (
                          <p><span className="font-medium">Name:</span> {branch.emergencyContact.name}</p>
                        )}
                        {branch.emergencyContact.phone && (
                          <p><span className="font-medium">Phone:</span> {branch.emergencyContact.phone}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
        
        {/* Loading indicator */}
        {loading && (
          <div className="absolute top-4 left-4 bg-white p-2 rounded shadow-lg z-[1000]">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="text-sm text-gray-600">Loading branches...</span>
            </div>
          </div>
        )}
      </MapContainer>
      
      {/* Map Legend */}
      <div className="absolute bottom-4 left-4 bg-white p-3 rounded shadow-lg z-[1000]">
        <div className="text-sm">
          <div className="font-medium text-gray-700 mb-2">Branch Types:</div>
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-xs">Main Branch</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span className="text-xs">Regional Branch</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-xs">Standard Branch</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BranchMap;
