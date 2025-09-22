import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// Custom icons for different markers
const createCustomIcon = (color, iconType) => {
  return L.divIcon({
    className: 'custom-div-icon',
    html: `
      <div style="
        background-color: ${color};
        width: 30px;
        height: 30px;
        border-radius: 50% 50% 50% 0;
        border: 3px solid white;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        color: white;
        transform: rotate(-45deg);
      ">
        <span style="transform: rotate(45deg);">${iconType}</span>
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
  });
};

const branchIcon = createCustomIcon('#3B82F6', '🏢');
const emergencyIcon = createCustomIcon('#EF4444', '🚨');
const exactEmergencyIcon = createCustomIcon('#DC2626', '🎯'); // Darker red for exact locations
const driverIcon = createCustomIcon('#10B981', '🚚');

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

// Comprehensive database of Sri Lankan locations with accurate coordinates
const sriLankanLocations = {
  // Colombo areas - Updated with exact provided coordinates
  'maradana': [6.9337, 79.8641], // Maradana - Colombo 10 coordinates
  'colombo 01': [6.9355, 79.8430], // Fort
  'colombo 02': [6.9219, 79.8507], // Slave Island / Kompannavidiya
  'colombo 03': [6.9063, 79.8530], // Kollupitiya
  'colombo 04': [6.9004, 79.8560], // Bambalapitiya
  'colombo 05': [6.8797, 79.8652], // Havelock Town
  'colombo 06': [6.8741, 79.8612], // Wellawatte
  'colombo 07': [6.9106, 79.8648], // Cinnamon Gardens
  'colombo 08': [6.9183, 79.8760], // Borella
  'colombo 09': [6.9391, 79.8787], // Dematagoda
  'colombo 10': [6.9337, 79.8641], // Maradana / Panchikawatte
  'colombo 11': [6.9385, 79.8577], // Pettah
  'colombo 12': [6.9378, 79.8614], // Hulftsdorp
  'colombo 13': [6.9486, 79.8608], // Kotahena
  'colombo 14': [6.9522, 79.8737], // Grandpass
  'colombo 15': [6.9633, 79.8669], // Mutwal / Mattakkuliya
  
  // Specific areas - Updated with exact coordinates
  'fort': [6.9355, 79.8430], // Colombo 01
  'pettah': [6.9385, 79.8577], // Colombo 11
  'slave island': [6.9219, 79.8507], // Colombo 02
  'kollupitiya': [6.9063, 79.8530], // Colombo 03
  'bambalapitiya': [6.9004, 79.8560], // Colombo 04
  'havelock town': [6.8797, 79.8652], // Colombo 05
  'wellawatte': [6.8741, 79.8612], // Colombo 06
  'cinnamon gardens': [6.9106, 79.8648], // Colombo 07
  'borella': [6.9183, 79.8760], // Colombo 08
  'dematagoda': [6.9391, 79.8787], // Colombo 09
  'panchikawatte': [6.9337, 79.8641], // Colombo 10
  'hulftsdorp': [6.9378, 79.8614], // Colombo 12
  'kotahena': [6.9486, 79.8608], // Colombo 13
  'grandpass': [6.9522, 79.8737], // Colombo 14
  'mutwal': [6.9633, 79.8669], // Colombo 15
  'mattakkuliya': [6.9633, 79.8669], // Colombo 15
  
  // Major roads - Updated with exact coordinates
  'galle road': [6.9004, 79.8560], // Bambalapitiya area
  'baseline road': [6.9183, 79.8760], // Borella area
  'high level road': [6.8481, 79.9285],
  'reid avenue': [6.9219, 79.8507], // Slave Island area
  'bauddhaloka mawatha': [6.9063, 79.8530], // Kollupitiya area
  'negombo road': [6.9633, 79.8669], // Mattakkuliya area
  
  // Southern areas
  'maharagama': [6.8481, 79.9285],
  'nugegoda': [6.8631, 79.8996],
  'kottawa': [6.8400, 79.9500],
  'homagama': [6.8400, 80.0000],
  'piliyandala': [6.8500, 79.9000],
  'kaduwela': [6.9300, 79.9800],
  'avissawella': [6.9500, 80.2000],
  'rathmalana': [6.8200, 79.8800],
  'moratuwa': [6.7730, 79.8816], // Correct coordinates for Moratuwa
  'panadura': [6.7200, 79.9000],
  'kalutara': [6.5800, 79.9600],
  
  // Other major cities
  'kandy': [7.2906, 80.6337],
  'galle': [6.0329, 80.2169],
  'jaffna': [9.6615, 80.0255],
  'anuradhapura': [8.3114, 80.4037],
  'trincomalee': [8.5874, 81.2152],
  'batticaloa': [7.7102, 81.6924],
  'kurunegala': [7.4863, 80.3633],
  'negombo': [7.2086, 79.8358],
  'ratnapura': [6.6828, 80.4012],
  'badulla': [6.9934, 81.0550]
};

// Function to get exact coordinates for specific known addresses
const getExactCoordinatesForAddress = (address) => {
  if (!address) return null;
  
  const addressLower = address.toLowerCase();
  console.log('🔍 Checking address for exact coordinates:', address);
  console.log('🔍 Address in lowercase:', addressLower);
  
  // Check for exact matches in our database
  for (const [location, coords] of Object.entries(sriLankanLocations)) {
    if (addressLower.includes(location)) {
      console.log(`🎯 Found exact location: ${location}`);
      console.log(`📍 Returning coordinates: [${coords[0]}, ${coords[1]}]`);
      return coords;
    }
  }
  
  // Special case for Moratuwa with Galle Road
  if (addressLower.includes('moratuwa') && addressLower.includes('galle road')) {
    console.log('🎯 Found Moratuwa with Galle Road - using exact coordinates');
    return [6.7730, 79.8816];
  }
  
  // Check for specific combinations
  if (addressLower.includes('maradana') && addressLower.includes('baseline road') && addressLower.includes('colombo 10')) {
    console.log('🎯 Found exact address: Maradana, Baseline Road, Colombo 10');
    return [6.9337, 79.8641]; // Maradana / Panchikawatte
  }
  
  if (addressLower.includes('maharagama') && addressLower.includes('high level road')) {
    console.log('🎯 Found exact address: Maharagama High Level Road');
    return [6.8481, 79.9285];
  }
  
  if (addressLower.includes('borella') && addressLower.includes('baseline road')) {
    console.log('🎯 Found exact address: Borella Baseline Road');
    return [6.9183, 79.8760]; // Borella
  }
  
  if (addressLower.includes('negombo road') && addressLower.includes('peliyagoda') && addressLower.includes('colombo 15')) {
    console.log('🎯 Found exact address: Negombo Road, Peliyagoda, Colombo 15');
    return [6.9633, 79.8669]; // Mutwal / Mattakkuliya
  }
  
  if (addressLower.includes('moratuwa') && addressLower.includes('galle road') && addressLower.includes('colombo 06')) {
    console.log('🎯 Found exact address: Moratuwa, Galle Road, Colombo 06');
    return [6.7730, 79.8816]; // Correct coordinates for Moratuwa
  }
  
  console.log('❌ No exact match found for address:', address);
  return null; // No exact match found
};

// Enhanced geocoding with multiple services for better accuracy
const geocodeAddress = async (address) => {
  if (!address) return null;
  
  try {
    console.log('🌍 Enhanced geocoding for address:', address);
    
    // Clean and normalize the address
    const cleanAddress = address.trim().replace(/\s+/g, ' ');
    console.log('🧹 Cleaned address:', cleanAddress);
    
    // Try multiple geocoding approaches
    const results = await Promise.allSettled([
      geocodeWithNominatim(cleanAddress),
      geocodeWithPhoton(cleanAddress),
      geocodeWithLocationIQ(cleanAddress),
      geocodeWithGoogle(cleanAddress) // Most accurate but requires API key
    ]);
    
    // Collect all valid results
    const validResults = results
      .filter(result => result.status === 'fulfilled' && result.value)
      .map(result => result.value)
      .flat();
    
    if (validResults.length === 0) {
      console.log('⚠️ No geocoding results found');
      return null;
    }
    
    // Score and rank all results
    const scoredResults = validResults.map(result => ({
      ...result,
      score: calculateEnhancedLocationScore(result, cleanAddress)
    })).sort((a, b) => b.score - a.score);
    
    console.log(`📊 Found ${scoredResults.length} total results, best score: ${scoredResults[0]?.score}`);
    
    // Return the best result
    const bestResult = scoredResults[0];
    const coords = [parseFloat(bestResult.lat), parseFloat(bestResult.lon)];
    
    console.log('🎯 Best result:', bestResult.display_name || bestResult.name);
    console.log('📍 Coordinates:', coords);
    console.log('⭐ Score:', bestResult.score);
    
    return coords;
    
  } catch (error) {
    console.error('❌ Enhanced geocoding failed:', error);
    return null;
  }
};

// Geocoding with OpenStreetMap Nominatim
const geocodeWithNominatim = async (address) => {
  try {
    const searchQueries = [
      `${address}, Sri Lanka`,
      `${address}, Colombo, Sri Lanka`,
      address,
      address.replace(/colombo\s*(\d+)/i, 'Colombo $1, Sri Lanka')
    ];
    
    for (const query of searchQueries) {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&countrycodes=lk&addressdetails=1&extratags=1`
      );
      
      if (response.ok) {
        const data = await response.json();
        return data.filter(result => 
          parseFloat(result.lat) > 5.5 && parseFloat(result.lat) < 10.0 &&
          parseFloat(result.lon) > 79.0 && parseFloat(result.lon) < 82.0
        );
      }
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
      `https://photon.komoot.io/api?q=${encodeURIComponent(address + ', Sri Lanka')}&limit=5&lang=en`
    );
    
    if (response.ok) {
      const data = await response.json();
      return (data.features || []).map(feature => ({
        lat: feature.geometry.coordinates[1],
        lon: feature.geometry.coordinates[0],
        display_name: feature.properties.name,
        type: feature.properties.type,
        class: feature.properties.class,
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

// Geocoding with LocationIQ (backup)
const geocodeWithLocationIQ = async (address) => {
  try {
    // Using a free tier approach - you can replace with actual API key if needed
    const response = await fetch(
      `https://us1.locationiq.com/v1/search?key=pk.test&q=${encodeURIComponent(address + ', Sri Lanka')}&format=json&limit=5&addressdetails=1`
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
    console.log('⚠️ LocationIQ geocoding failed:', error.message);
    return [];
  }
};

// Geocoding with Google Maps (most accurate - requires API key)
const geocodeWithGoogle = async (address) => {
  try {
    // Note: You need to add your Google Maps API key here
    const GOOGLE_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
    
    if (!GOOGLE_API_KEY) {
      console.log('⚠️ Google Maps API key not configured');
      return [];
    }
    
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address + ', Sri Lanka')}&key=${GOOGLE_API_KEY}`
    );
    
    if (response.ok) {
      const data = await response.json();
      return (data.results || []).map(result => ({
        lat: result.geometry.location.lat,
        lon: result.geometry.location.lng,
        display_name: result.formatted_address,
        type: result.types[0] || 'unknown',
        class: result.types[0] || 'unknown',
        importance: result.geometry.location_type === 'ROOFTOP' ? 0.9 : 0.7
      })).filter(result => 
        parseFloat(result.lat) > 5.5 && parseFloat(result.lat) < 10.0 &&
        parseFloat(result.lon) > 79.0 && parseFloat(result.lon) < 82.0
      );
    }
    return [];
  } catch (error) {
    console.log('⚠️ Google Maps geocoding failed:', error.message);
    return [];
  }
};

// Enhanced scoring function for better address matching
const calculateEnhancedLocationScore = (result, originalAddress) => {
  let score = 0;
  const displayName = (result.display_name || result.name || '').toLowerCase();
  const originalLower = originalAddress.toLowerCase();
  
  // Extract key components from original address
  const addressWords = originalLower.split(/[\s,]+/).filter(word => word.length > 2);
  const mainLocation = addressWords[0] || '';
  
  // Exact match bonus (highest priority)
  if (displayName.includes(originalLower)) score += 200;
  if (displayName.includes(mainLocation)) score += 150;
  
  // Word-by-word matching for better accuracy
  addressWords.forEach(word => {
    if (displayName.includes(word)) score += 25;
  });
  
  // Sri Lanka context bonus
  if (displayName.includes('sri lanka') || displayName.includes('colombo')) score += 50;
  
  // Road/street match bonus
  const roadTypes = ['road', 'street', 'mawatha', 'avenue', 'place', 'lane', 'drive'];
  roadTypes.forEach(roadType => {
    if (originalLower.includes(roadType) && displayName.includes(roadType)) {
      score += 40;
    }
  });
  
  // Postal code matching
  const postalMatch = originalLower.match(/colombo\s*(\d+)/);
  if (postalMatch && displayName.includes(`colombo ${postalMatch[1]}`)) score += 60;
  
  // Importance bonus (from OSM importance field)
  if (result.importance) score += result.importance * 30;
  
  // Type bonus - prioritize more specific types
  const typeScores = {
    'administrative': 20,
    'residential': 15,
    'highway': 25,
    'amenity': 30,
    'building': 10,
    'place': 35
  };
  if (result.type && typeScores[result.type]) {
    score += typeScores[result.type];
  }
  
  // Class bonus
  const classScores = {
    'highway': 15,
    'place': 20,
    'amenity': 25,
    'building': 10
  };
  if (result.class && classScores[result.class]) {
    score += classScores[result.class];
  }
  
  // Distance from Colombo center (prefer locations closer to Colombo)
  const colomboCenter = [6.9271, 79.8612];
  const distance = calculateDistance(
    colomboCenter[0], colomboCenter[1],
    parseFloat(result.lat), parseFloat(result.lon)
  );
  
  // Bonus for locations within 50km of Colombo
  if (distance < 50) {
    score += Math.max(0, 20 - (distance / 5));
  }
  
  return score;
};

// Legacy function for backward compatibility
const calculateLocationScore = (result, originalAddress, mainLocation) => {
  return calculateEnhancedLocationScore(result, originalAddress);
};

// Component to generate emergency location (exact or random)
const generateEmergencyLocation = (branchCoords, maxDistanceKm = 30, address = null) => {
  // First, try to get exact coordinates for the address
  if (address) {
    const exactCoords = getExactCoordinatesForAddress(address);
    if (exactCoords) {
      console.log('📍 Using exact coordinates for address:', address);
      return exactCoords;
    }
  }
  
  // If no exact match, generate random location within distance from branch
  console.log('🎲 Generating random location within', maxDistanceKm, 'km from branch coordinates');
  const R = 6371; // Earth's radius in km
  
  // Convert to radians
  const lat1 = branchCoords[0] * Math.PI / 180;
  const lng1 = branchCoords[1] * Math.PI / 180;
  
  // Generate random distance (0 to maxDistanceKm)
  const distance = Math.random() * maxDistanceKm;
  
  // Generate random bearing (0 to 2π)
  const bearing = Math.random() * 2 * Math.PI;
  
  // Calculate new coordinates
  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(distance / R) +
    Math.cos(lat1) * Math.sin(distance / R) * Math.cos(bearing)
  );
  
  const lng2 = lng1 + Math.atan2(
    Math.sin(bearing) * Math.sin(distance / R) * Math.cos(lat1),
    Math.cos(distance / R) - Math.sin(lat1) * Math.sin(lat2)
  );
  
  const generatedCoords = [
    lat2 * 180 / Math.PI,
    lng2 * 180 / Math.PI
  ];
  
  console.log('🎲 Generated emergency location:', generatedCoords);
  console.log('📍 Base coordinates used:', branchCoords);
  console.log('📏 Distance from branch:', calculateDistance(branchCoords[0], branchCoords[1], generatedCoords[0], generatedCoords[1]).toFixed(2), 'km');
  
  return generatedCoords;
};

// Calculate distance between two points using Haversine formula
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

const InteractiveMap = ({ 
  branchLocation, 
  emergencyRequest, 
  showRoute = false,
  onRouteCalculated,
  onEmergencyLocationGenerated 
}) => {
  const [emergencyCoords, setEmergencyCoords] = useState(null);
  const [route, setRoute] = useState([]);
  const [distance, setDistance] = useState(null);
  const [estimatedTime, setEstimatedTime] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mapCenter, setMapCenter] = useState([6.9271, 79.8612]); // Colombo center
  const [mapZoom, setMapZoom] = useState(12);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [generatedEmergencyLocation, setGeneratedEmergencyLocation] = useState(null);
  
  const mapRef = useRef(null);

  // Colombo 7 branch coordinates (more accurate)
  const colombo7BranchCoords = [6.8700, 79.8700]; // Dehiwala area coordinates
  
  
  // Default branch location if not provided
  const defaultBranchLocation = {
    name: 'Colombo 7 Branch',
    address: '123 Galle Road, Colombo 07, Sri Lanka',
    coordinates: colombo7BranchCoords
  };

  const branch = branchLocation || defaultBranchLocation;
  const branchCoords = branch.coordinates || colombo7BranchCoords;

  // Generate emergency location when emergency request is provided
  useEffect(() => {
    const processEmergencyLocation = async () => {
      console.log('🚀 Processing emergency location...');
      console.log('📋 Emergency request:', emergencyRequest);
      console.log('📍 Current emergency coords:', emergencyCoords);
      
      if (emergencyRequest && !emergencyCoords) {
        let coords;
        let locationType = 'generated';
        
        console.log('🔍 Emergency request found, processing location...');
        
        if (emergencyRequest.brigadeLocation) {
          // First, try to get exact coordinates for the address (prioritize over provided coordinates)
          const exactCoords = getExactCoordinatesForAddress(emergencyRequest.brigadeLocation);
          console.log('🎯 Exact coords result:', exactCoords);
          
          if (exactCoords) {
            coords = exactCoords;
            locationType = 'exact';
            console.log('✅ Using exact coordinates for address (overriding provided):', emergencyRequest.brigadeLocation, '->', coords);
          } else if (emergencyRequest.coordinates) {
            // Use provided coordinates only if no exact match found
            coords = [emergencyRequest.coordinates.lat, emergencyRequest.coordinates.lng];
            locationType = 'provided';
            console.log('📍 Using provided coordinates:', coords);
          } else {
            // Try to geocode the address to get real coordinates
            console.log('🌍 Attempting to geocode address:', emergencyRequest.brigadeLocation);
            setIsGeocoding(true);
            const geocodedCoords = await geocodeAddress(emergencyRequest.brigadeLocation);
            setIsGeocoding(false);
            
            if (geocodedCoords) {
              coords = geocodedCoords;
              locationType = 'geocoded';
              console.log('✅ Successfully geocoded address:', emergencyRequest.brigadeLocation, 'to:', coords);
            } else {
              // Fallback: Generate random location within 30km
              coords = generateEmergencyLocation(branchCoords, 30, emergencyRequest.brigadeLocation);
              locationType = 'generated';
              console.log('🎲 Generated random emergency location within 30km:', coords);
            }
          }
        } else if (emergencyRequest.coordinates) {
          // Use provided coordinates only if no address provided
          coords = [emergencyRequest.coordinates.lat, emergencyRequest.coordinates.lng];
          locationType = 'provided';
          console.log('📍 Using provided coordinates (no address):', coords);
        } else {
          // No address provided, generate random location
          coords = generateEmergencyLocation(branchCoords, 30);
          locationType = 'generated';
          console.log('🎲 Generated random emergency location within 30km (no address):', coords);
        }
        
        // Set the generated location state
        const locationData = {
          lat: coords[0],
          lng: coords[1],
          address: emergencyRequest.brigadeLocation || 'Generated Emergency Location',
          type: locationType
        };
        setGeneratedEmergencyLocation(locationData);
        
        // Calculate distance
        const calculatedDistance = calculateDistance(
          branchCoords[0], branchCoords[1],
          coords[0], coords[1]
        );
        setDistance(calculatedDistance);
        
        // Calculate estimated time (assuming 40 km/h average speed)
        const timeInHours = calculatedDistance / 40;
        const hours = Math.floor(timeInHours);
        const minutes = Math.round((timeInHours - hours) * 60);
        const timeString = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
        setEstimatedTime(timeString);
        
        // Notify parent component about generated location with distance and time
        if (onEmergencyLocationGenerated) {
          onEmergencyLocationGenerated({
            ...locationData,
            distance: calculatedDistance,
            estimatedTime: timeString
          });
        }
        
        // Also notify parent about route calculation
        if (onRouteCalculated) {
          onRouteCalculated({
            distance: calculatedDistance,
            estimatedTime: timeString,
            route: []
          });
        }
        
        setEmergencyCoords(coords);
        
        // Debug: Log the coordinates being used
        console.log('🗺️ Emergency location coordinates set:', coords);
        console.log('📍 Address:', emergencyRequest.brigadeLocation);
        console.log('🎯 Location type:', locationType);
        console.log('🔍 Final coordinates for map marker:', coords);
        console.log('📊 Location data object:', locationData);
        console.log('📏 Distance calculated:', calculatedDistance, 'km');
        console.log('⏱️ Time calculated:', timeString);
        
        // Update map center to show both locations
        const centerLat = (branchCoords[0] + coords[0]) / 2;
        const centerLng = (branchCoords[1] + coords[1]) / 2;
        setMapCenter([centerLat, centerLng]);
        setMapZoom(11);
      }
    };

    processEmergencyLocation();
  }, [emergencyRequest, branchCoords, emergencyCoords, onEmergencyLocationGenerated]);

  // Calculate route when showRoute is true
  useEffect(() => {
    if (showRoute && emergencyCoords && branchCoords) {
      calculateRoute();
    }
  }, [showRoute, emergencyCoords, branchCoords]);

  const calculateRoute = async () => {
    if (!emergencyCoords || !branchCoords) return;
    
    setLoading(true);
    
    try {
      // Create a simple route with waypoints
      const routePoints = [
        branchCoords,
        [
          (branchCoords[0] + emergencyCoords[0]) / 2 + (Math.random() - 0.5) * 0.01,
          (branchCoords[1] + emergencyCoords[1]) / 2 + (Math.random() - 0.5) * 0.01
        ],
        emergencyCoords
      ];
      
      setRoute(routePoints);
      
      // Calculate road distance (approximate)
      let roadDistance = 0;
      for (let i = 0; i < routePoints.length - 1; i++) {
        roadDistance += calculateDistance(
          routePoints[i][0], routePoints[i][1],
          routePoints[i + 1][0], routePoints[i + 1][1]
        );
      }
      
      // Add some road factor (roads are not straight lines)
      roadDistance *= 1.3; // 30% longer than straight line
      setDistance(roadDistance);
      
      // Calculate estimated time
      const timeInHours = roadDistance / 40; // 40 km/h average
      const hours = Math.floor(timeInHours);
      const minutes = Math.round((timeInHours - hours) * 60);
      const timeString = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
      setEstimatedTime(timeString);
      
      // Notify parent component
      if (onRouteCalculated) {
        onRouteCalculated({
          distance: roadDistance,
          estimatedTime: timeString,
          route: routePoints
        });
      }
      
    } catch (error) {
      console.error('Error calculating route:', error);
    } finally {
      setLoading(false);
    }
  };

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
        
        {/* Branch Marker */}
        <Marker position={branchCoords} icon={branchIcon}>
          <Popup>
            <div className="p-2">
              <h3 className="font-bold text-blue-600">🏢 {branch.name}</h3>
              <p className="text-sm text-gray-600">{branch.address}</p>
              <p className="text-xs text-gray-500 mt-1">
                📍 {branchCoords[0].toFixed(6)}, {branchCoords[1].toFixed(6)}
              </p>
            </div>
          </Popup>
        </Marker>
        
        {/* Emergency Location Marker */}
        {emergencyCoords && (
          <Marker 
            position={emergencyCoords} 
            icon={
              generatedEmergencyLocation?.type === 'exact' || generatedEmergencyLocation?.type === 'geocoded' 
                ? exactEmergencyIcon 
                : emergencyIcon
            }
          >
            <Popup>
              <div className="p-2">
                <h3 className="font-bold text-red-600">🚨 Emergency Location</h3>
                <p className="text-sm text-gray-600">
                  {emergencyRequest?.brigadeName || 'Emergency Request'}
                </p>
                <p className="text-sm text-gray-600">
                  {emergencyRequest?.brigadeLocation || 'Generated Location'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  📍 {emergencyCoords[0].toFixed(6)}, {emergencyCoords[1].toFixed(6)}
                </p>
                {generatedEmergencyLocation && (
                  <p className="text-xs text-blue-600 mt-1">
                    {generatedEmergencyLocation.type === 'exact' ? '✅ Exact location' :
                     generatedEmergencyLocation.type === 'geocoded' ? '🌍 Geocoded location' :
                     generatedEmergencyLocation.type === 'provided' ? '📍 Provided coordinates' :
                     '🎲 Generated location'}
                  </p>
                )}
                {distance && (
                  <p className="text-xs text-blue-600 mt-1">
                    📏 Distance: {distance.toFixed(2)} km
                  </p>
                )}
                {estimatedTime && (
                  <p className="text-xs text-green-600">
                    ⏱️ Est. Time: {estimatedTime}
                  </p>
                )}
              </div>
            </Popup>
          </Marker>
        )}
        
        {/* Route Line */}
        {showRoute && route.length > 0 && (
          <Polyline
            positions={route}
            color="#3B82F6"
            weight={4}
            opacity={0.8}
            dashArray="10, 10"
          />
        )}
        
        {/* Loading indicator */}
        {(loading || isGeocoding) && (
          <div className="absolute top-4 left-4 bg-white p-2 rounded shadow-lg z-[1000]">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="text-sm text-gray-600">
                {isGeocoding ? 'Finding exact location...' : 'Calculating route...'}
              </span>
            </div>
          </div>
        )}
      </MapContainer>
      
    </div>
  );
};

export default InteractiveMap;
