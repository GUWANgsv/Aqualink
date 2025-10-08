const EmergencyRequest = require('../Model/EmergencyRequestModel');
const Branch = require('../Model/BranchModel');
const User = require('../Model/UserModel');
const DriverBonus = require('../Model/DriverBonusModel');
const mongoose = require('mongoose');

// Create new emergency request
const createEmergencyRequest = async (req, res) => {
  try {
    console.log('🚨 Creating new emergency request...');
    console.log('📝 Request data:', req.body);
    
    const {
      brigadeId,
      brigadeName,
      brigadeLocation,
      requestType,
      priority,
      waterLevel,
      description,
      coordinates
    } = req.body;

    const emergencyRequest = new EmergencyRequest({
      brigadeId,
      brigadeName,
      brigadeLocation,
      requestType,
      priority,
      waterLevel,
      description,
      coordinates
    });

    console.log('💾 Saving emergency request...');
    const savedRequest = await emergencyRequest.save();
    console.log('✅ Emergency request saved successfully:', savedRequest._id);
    
    res.status(201).json({
      success: true,
      message: 'Emergency request created successfully',
      data: savedRequest
    });
  } catch (error) {
    console.error('❌ Error creating emergency request:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating emergency request',
      error: error.message
    });
  }
};

// Get all emergency requests
const getAllEmergencyRequests = async (req, res) => {
  try {
    console.log('🔍 Fetching all emergency requests...');
    console.log('👤 User:', req.user);
    
    // First, get all requests without populate to avoid ObjectId errors
    const requests = await EmergencyRequest.find()
      .sort({ requestDate: -1 });

    // Then manually populate the fields that are valid ObjectIds
    const populatedRequests = await Promise.all(
      requests.map(async (request) => {
        const populatedRequest = request.toObject();
        
        // Only populate if assignedBranch is a valid ObjectId
        if (request.assignedBranch && mongoose.Types.ObjectId.isValid(request.assignedBranch)) {
          try {
            const branch = await Branch.findById(request.assignedBranch).select('name location');
            populatedRequest.assignedBranch = branch;
          } catch (error) {
            console.log('Could not populate branch:', error.message);
            populatedRequest.assignedBranch = null;
          }
        }
        
        // Only populate if assignedDriver is a valid ObjectId
        if (request.assignedDriver && mongoose.Types.ObjectId.isValid(request.assignedDriver)) {
          try {
            const driver = await User.findById(request.assignedDriver).select('name email phone');
            populatedRequest.assignedDriver = driver;
          } catch (error) {
            console.log('Could not populate driver:', error.message);
            populatedRequest.assignedDriver = null;
          }
        }
        
        return populatedRequest;
      })
    );

    console.log('📋 Found requests:', populatedRequests.length);
    console.log('📋 Requests:', populatedRequests.map(req => ({
      id: req._id,
      brigadeName: req.brigadeName,
      status: req.status,
      requestDate: req.requestDate
    })));

    res.status(200).json({
      success: true,
      data: populatedRequests
    });
  } catch (error) {
    console.error('Error fetching emergency requests:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching emergency requests',
      error: error.message
    });
  }
};

// Get emergency request by ID
const getEmergencyRequestById = async (req, res) => {
  try {
    const request = await EmergencyRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Emergency request not found'
      });
    }

    // Manually populate the fields
    const populatedRequest = request.toObject();
    
    // Only populate if assignedBranch is a valid ObjectId
    if (request.assignedBranch && mongoose.Types.ObjectId.isValid(request.assignedBranch)) {
      try {
        const branch = await Branch.findById(request.assignedBranch).select('name location coordinates');
        populatedRequest.assignedBranch = branch;
      } catch (error) {
        console.log('Could not populate branch:', error.message);
        populatedRequest.assignedBranch = null;
      }
    }
    
    // Only populate if assignedDriver is a valid ObjectId
    if (request.assignedDriver && mongoose.Types.ObjectId.isValid(request.assignedDriver)) {
      try {
        const driver = await User.findById(request.assignedDriver).select('name email phone');
        populatedRequest.assignedDriver = driver;
      } catch (error) {
        console.log('Could not populate driver:', error.message);
        populatedRequest.assignedDriver = null;
      }
    }

    res.status(200).json({
      success: true,
      data: populatedRequest
    });
  } catch (error) {
    console.error('Error fetching emergency request:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching emergency request',
      error: error.message
    });
  }
};

// Update emergency request status
const updateEmergencyRequestStatus = async (req, res) => {
  try {
    const { status, adminNotes, assignedBranch, assignedDriver, estimatedDeliveryTime } = req.body;
    const { id } = req.params;

    console.log('Updating request:', id, 'with data:', req.body);
    console.log('User making request:', req.user);

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request ID format'
      });
    }

    // Validate status
    const validStatuses = ['Pending', 'Approved', 'Approved - Sent to Branch Manager', 'Rejected', 'In Progress', 'Completed'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    // Security check: Drivers can only update requests assigned to them
    if (req.user.role === 'Driver') {
      const existingRequest = await EmergencyRequest.findById(id);
      if (!existingRequest) {
        return res.status(404).json({
          success: false,
          message: 'Emergency request not found'
        });
      }
      
      // Check if the request is assigned to this driver
      if (existingRequest.assignedDriver && existingRequest.assignedDriver.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You can only update requests assigned to you.'
        });
      }
      
      // Drivers can only set status to 'Completed' or 'In Progress'
      if (status && !['In Progress', 'Completed'].includes(status)) {
        return res.status(403).json({
          success: false,
          message: 'Drivers can only set status to "In Progress" or "Completed"'
        });
      }
    }

    const updateData = {
      status,
      responseDate: new Date()
    };

    if (adminNotes) updateData.adminNotes = adminNotes;
    if (assignedBranch) updateData.assignedBranch = assignedBranch;
    if (assignedDriver) updateData.assignedDriver = assignedDriver;
    if (estimatedDeliveryTime) updateData.estimatedDeliveryTime = estimatedDeliveryTime;

    console.log('Update data:', updateData);

    const updatedRequest = await EmergencyRequest.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedRequest) {
      return res.status(404).json({
        success: false,
        message: 'Emergency request not found'
      });
    }

    // Manually populate the fields
    const populatedRequest = updatedRequest.toObject();
    
    // Only populate if assignedBranch is a valid ObjectId
    if (updatedRequest.assignedBranch && mongoose.Types.ObjectId.isValid(updatedRequest.assignedBranch)) {
      try {
        const branch = await Branch.findById(updatedRequest.assignedBranch).select('name location');
        populatedRequest.assignedBranch = branch;
      } catch (error) {
        console.log('Could not populate branch:', error.message);
        populatedRequest.assignedBranch = null;
      }
    }
    
    // Only populate if assignedDriver is a valid ObjectId
    if (updatedRequest.assignedDriver && mongoose.Types.ObjectId.isValid(updatedRequest.assignedDriver)) {
      try {
        const driver = await User.findById(updatedRequest.assignedDriver).select('name email phone');
        populatedRequest.assignedDriver = driver;
      } catch (error) {
        console.log('Could not populate driver:', error.message);
        populatedRequest.assignedDriver = null;
      }
    }

    console.log('Successfully updated request:', populatedRequest);

    // Create bonus for driver when emergency delivery is completed
    if (status === 'Completed' && updatedRequest.assignedDriver && updatedRequest.bonusEligible) {
      try {
        await createDriverBonus(updatedRequest);
        console.log('✅ Driver bonus created for emergency delivery completion');
      } catch (bonusError) {
        console.error('❌ Error creating driver bonus:', bonusError);
        // Don't fail the main request if bonus creation fails
      }
    }

    res.status(200).json({
      success: true,
      message: 'Emergency request status updated successfully',
      data: populatedRequest
    });
  } catch (error) {
    console.error('Error updating emergency request:', error);
    console.error('Error details:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Error updating emergency request',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Find nearest branch for emergency request
const findNearestBranch = async (req, res) => {
  try {
    const { lat, lng, maxDistance = 50000 } = req.body;

    console.log('Finding nearest branch for coordinates:', { lat, lng });

    // Validate coordinates
    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }

    // First, try to find branches with coordinates
    let branches = await Branch.find({
      status: 'Active',
      coordinates: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [lng, lat]
          },
          $maxDistance: maxDistance
        }
      }
    }).limit(5);

    // If no branches found with coordinates, get all active branches
    if (branches.length === 0) {
      console.log('No branches found with coordinates, getting all active branches');
      branches = await Branch.find({ status: 'Active' }).limit(5);
    }

    console.log('Found branches:', branches.length);

    res.status(200).json({
      success: true,
      data: branches
    });
  } catch (error) {
    console.error('Error finding nearest branch:', error);
    res.status(500).json({
      success: false,
      message: 'Error finding nearest branch',
      error: error.message
    });
  }
};

// Get emergency requests by status
const getEmergencyRequestsByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    const requests = await EmergencyRequest.find({ status })
      .sort({ requestDate: -1 })
      .populate('assignedBranch', 'name location')
      .populate('assignedDriver', 'name email phone');

    res.status(200).json({
      success: true,
      data: requests
    });
  } catch (error) {
    console.error('Error fetching emergency requests by status:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching emergency requests by status',
      error: error.message
    });
  }
};

// Get emergency requests by brigade
const getEmergencyRequestsByBrigade = async (req, res) => {
  try {
    const { brigadeId } = req.params;
    console.log('🔍 Fetching emergency requests for brigade:', brigadeId);
    
    // First, get all requests without populate to avoid ObjectId errors
    const requests = await EmergencyRequest.find({ brigadeId })
      .sort({ requestDate: -1 });

    // Then manually populate the fields that are valid ObjectIds
    const populatedRequests = await Promise.all(
      requests.map(async (request) => {
        const populatedRequest = request.toObject();
        
        // Only populate if assignedBranch is a valid ObjectId
        if (request.assignedBranch && mongoose.Types.ObjectId.isValid(request.assignedBranch)) {
          try {
            const branch = await Branch.findById(request.assignedBranch).select('name location');
            populatedRequest.assignedBranch = branch;
          } catch (error) {
            console.log('Could not populate branch:', error.message);
            populatedRequest.assignedBranch = null;
          }
        }
        
        // Only populate if assignedDriver is a valid ObjectId
        if (request.assignedDriver && mongoose.Types.ObjectId.isValid(request.assignedDriver)) {
          try {
            const driver = await User.findById(request.assignedDriver).select('name email phone');
            populatedRequest.assignedDriver = driver;
          } catch (error) {
            console.log('Could not populate driver:', error.message);
            populatedRequest.assignedDriver = null;
          }
        }
        
        return populatedRequest;
      })
    );

    console.log('📋 Found requests for brigade:', populatedRequests.length);
    console.log('📋 Brigade requests:', populatedRequests.map(req => ({
      id: req._id,
      brigadeId: req.brigadeId,
      status: req.status,
      actualDeliveryTime: req.actualDeliveryTime,
      requestDate: req.requestDate
    })));

    res.status(200).json({
      success: true,
      data: populatedRequests
    });
  } catch (error) {
    console.error('Error fetching emergency requests by brigade:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching emergency requests by brigade',
      error: error.message
    });
  }
};

// Get emergency requests by branch
const getEmergencyRequestsByBranch = async (req, res) => {
  try {
    const { branchId } = req.params;
    
    console.log('Fetching requests for branch:', branchId);
    
    const requests = await EmergencyRequest.find({ assignedBranch: branchId })
      .sort({ requestDate: -1 })
      .populate('assignedBranch', 'name location')
      .populate('assignedDriver', 'name email phone');

    console.log('Found requests:', requests.length);

    res.status(200).json({
      success: true,
      requests: requests
    });
  } catch (error) {
    console.error('Error fetching emergency requests by branch:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching emergency requests by branch',
      error: error.message
    });
  }
};

// Get emergency requests by driver
const getEmergencyRequestsByDriver = async (req, res) => {
  try {
    const { driverId } = req.params;
    
    const requests = await EmergencyRequest.find({ assignedDriver: driverId })
      .populate('assignedDriver', 'name email phone')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      requests: requests
    });
  } catch (error) {
    console.error('Error fetching emergency requests by driver:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching emergency requests by driver',
      error: error.message
    });
  }
};

// Delete emergency request
const deleteEmergencyRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedRequest = await EmergencyRequest.findByIdAndDelete(id);

    if (!deletedRequest) {
      return res.status(404).json({
        success: false,
        message: 'Emergency request not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Emergency request deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting emergency request:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting emergency request',
      error: error.message
    });
  }
};

// Get completed emergency requests by driver
const getCompletedEmergencyRequestsByDriver = async (req, res) => {
  try {
    const { driverId } = req.params;
    
    console.log(`📋 Fetching completed emergency requests for driver: ${driverId}`);
    
    // Find all completed emergency requests assigned to this driver
    const completedRequests = await EmergencyRequest.find({
      assignedDriver: driverId,
      status: 'Completed'
    }).sort({ actualDeliveryTime: -1 }); // Sort by completion time, newest first
    
    console.log(`✅ Found ${completedRequests.length} completed emergency requests for driver ${driverId}`);
    
    res.status(200).json({
      success: true,
      message: 'Completed emergency requests retrieved successfully',
      requests: completedRequests
    });
    
  } catch (error) {
    console.error('❌ Error fetching completed emergency requests by driver:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch completed emergency requests',
      error: error.message
    });
  }
};

// Generate emergency location within specified distance from branch
const generateEmergencyLocation = async (req, res) => {
  try {
    const { branchId, maxDistanceKm = 30 } = req.body;
    
    console.log(`🎯 Generating emergency location within ${maxDistanceKm}km of branch: ${branchId}`);
    
    // Find the branch
    const branch = await Branch.findById(branchId);
    if (!branch) {
      return res.status(404).json({
        success: false,
        message: 'Branch not found'
      });
    }
    
    const branchCoords = [branch.coordinates.lat, branch.coordinates.lng];
    console.log(`📍 Branch coordinates: ${branchCoords}`);
    
    // Generate random location within specified distance
    const emergencyCoords = generateRandomLocationWithinDistance(branchCoords, maxDistanceKm);
    
    console.log(`🎯 Generated emergency coordinates: ${emergencyCoords}`);
    
    // Calculate distance
    const distance = calculateHaversineDistance(branchCoords[0], branchCoords[1], emergencyCoords[0], emergencyCoords[1]);
    
    res.status(200).json({
      success: true,
      message: 'Emergency location generated successfully',
      data: {
        branch: {
          id: branch._id,
          name: branch.name,
          coordinates: branch.coordinates
        },
        emergencyLocation: {
          coordinates: {
            lat: emergencyCoords[0],
            lng: emergencyCoords[1]
          },
          distance: distance,
          maxDistance: maxDistanceKm
        }
      }
    });
    
  } catch (error) {
    console.error('❌ Error generating emergency location:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate emergency location',
      error: error.message
    });
  }
};

// Calculate route distance and estimated time
const calculateRouteInfo = async (req, res) => {
  try {
    const { branchId, emergencyCoords } = req.body;
    
    console.log(`🛣️ Calculating route info for branch: ${branchId} to emergency location: ${emergencyCoords}`);
    
    // Find the branch
    const branch = await Branch.findById(branchId);
    if (!branch) {
      return res.status(404).json({
        success: false,
        message: 'Branch not found'
      });
    }
    
    const branchCoords = [branch.coordinates.lat, branch.coordinates.lng];
    
    // Calculate straight-line distance
    const straightDistance = calculateHaversineDistance(
      branchCoords[0], branchCoords[1],
      emergencyCoords.lat, emergencyCoords.lng
    );
    
    // Calculate road distance (approximate - add 30% for road factor)
    const roadDistance = straightDistance * 1.3;
    
    // Calculate estimated time (assuming 40 km/h average speed)
    const estimatedTimeHours = roadDistance / 40;
    const hours = Math.floor(estimatedTimeHours);
    const minutes = Math.round((estimatedTimeHours - hours) * 60);
    const estimatedTime = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
    
    res.status(200).json({
      success: true,
      message: 'Route information calculated successfully',
      data: {
        branch: {
          id: branch._id,
          name: branch.name,
          coordinates: branch.coordinates
        },
        emergencyLocation: {
          coordinates: emergencyCoords
        },
        route: {
          straightDistance: straightDistance,
          roadDistance: roadDistance,
          estimatedTime: estimatedTime,
          averageSpeed: 40 // km/h
        }
      }
    });
    
  } catch (error) {
    console.error('❌ Error calculating route info:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate route information',
      error: error.message
    });
  }
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

// Helper function to get exact coordinates for specific addresses
const getExactCoordinatesForAddress = (address) => {
  if (!address) return null;
  
  const addressLower = address.toLowerCase();
  
  // Check for exact matches in our database
  for (const [location, coords] of Object.entries(sriLankanLocations)) {
    if (addressLower.includes(location)) {
      console.log(`🎯 Found exact location: ${location}`);
      return coords;
    }
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
  
  return null; // No exact match found
};

// Helper function to generate random location within distance using exact Colombo addresses
const generateRandomLocationWithinDistance = (centerCoords, maxDistanceKm) => {
  // Use exact Colombo addresses instead of random generation
  const colomboAddresses = [
    [6.9355, 79.8430], // Colombo 01 - Fort
    [6.9219, 79.8507], // Colombo 02 - Slave Island
    [6.9063, 79.8530], // Colombo 03 - Kollupitiya
    [6.9004, 79.8560], // Colombo 04 - Bambalapitiya
    [6.8797, 79.8652], // Colombo 05 - Havelock Town
    [6.8741, 79.8612], // Colombo 06 - Wellawatte
    [6.9106, 79.8648], // Colombo 07 - Cinnamon Gardens
    [6.9183, 79.8760], // Colombo 08 - Borella
    [6.9391, 79.8787], // Colombo 09 - Dematagoda
    [6.9337, 79.8641], // Colombo 10 - Maradana
    [6.9385, 79.8577], // Colombo 11 - Pettah
    [6.9378, 79.8614], // Colombo 12 - Hulftsdorp
    [6.9486, 79.8608], // Colombo 13 - Kotahena
    [6.9522, 79.8737], // Colombo 14 - Grandpass
    [6.9633, 79.8669], // Colombo 15 - Mutwal
  ];
  
  // Filter addresses within the specified distance
  const validAddresses = colomboAddresses.filter(coords => {
    const distance = calculateHaversineDistance(centerCoords[0], centerCoords[1], coords[0], coords[1]);
    return distance <= maxDistanceKm;
  });
  
  // If we have valid addresses, randomly select one
  if (validAddresses.length > 0) {
    const randomIndex = Math.floor(Math.random() * validAddresses.length);
    console.log(`🎯 Selected exact Colombo address: ${validAddresses[randomIndex]}`);
    return validAddresses[randomIndex];
  }
  
  // Fallback to original random generation if no valid addresses
  console.log('⚠️ No valid Colombo addresses found, using random generation');
  const R = 6371; // Earth's radius in km
  
  // Convert to radians
  const lat1 = centerCoords[0] * Math.PI / 180;
  const lng1 = centerCoords[1] * Math.PI / 180;
  
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
  
  return [
    lat2 * 180 / Math.PI,
    lng2 * 180 / Math.PI
  ];
};

// Helper function to calculate Haversine distance
const calculateHaversineDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// Create driver bonus for completed emergency delivery
const createDriverBonus = async (emergencyRequest) => {
  try {
    console.log('💰 Creating driver bonus for emergency request:', emergencyRequest._id);
    
    // Check if bonus already exists for this emergency request
    const existingBonus = await DriverBonus.findOne({ 
      emergencyRequestId: emergencyRequest._id 
    });
    
    if (existingBonus) {
      console.log('⚠️ Bonus already exists for this emergency request');
      return existingBonus;
    }
    
    // Get current date for month/year calculation
    const currentDate = new Date();
    const month = currentDate.getMonth() + 1; // JavaScript months are 0-based
    const year = currentDate.getFullYear();
    
    // Create new bonus record
    const driverBonus = new DriverBonus({
      driverId: emergencyRequest.assignedDriver,
      emergencyRequestId: emergencyRequest._id,
      bonusAmount: emergencyRequest.bonusAmount || 5000, // Default 5000 LKR
      bonusType: emergencyRequest.requestType || 'Emergency Water Supply',
      brigadeName: emergencyRequest.brigadeName,
      brigadeLocation: emergencyRequest.brigadeLocation,
      deliveryDate: emergencyRequest.actualDeliveryTime || new Date(),
      status: 'Approved',
      month: month,
      year: year,
      notes: `Bonus for emergency water supply delivery to ${emergencyRequest.brigadeName}`
    });
    
    const savedBonus = await driverBonus.save();
    console.log('✅ Driver bonus created successfully:', savedBonus._id);
    
    // Update emergency request bonus status
    await EmergencyRequest.findByIdAndUpdate(emergencyRequest._id, {
      bonusStatus: 'Bonus Created'
    });
    
    return savedBonus;
  } catch (error) {
    console.error('❌ Error creating driver bonus:', error);
    throw error;
  }
};

// API endpoint to create bonus for a specific emergency request
const createDriverBonusForRequest = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('💰 Creating bonus for emergency request:', id);
    
    // Find the emergency request
    const emergencyRequest = await EmergencyRequest.findById(id);
    if (!emergencyRequest) {
      return res.status(404).json({
        success: false,
        message: 'Emergency request not found'
      });
    }
    
    // Check if request is completed
    if (emergencyRequest.status !== 'Completed') {
      return res.status(400).json({
        success: false,
        message: 'Emergency request must be completed to create bonus'
      });
    }
    
    // Check if bonus is eligible
    if (!emergencyRequest.bonusEligible) {
      return res.status(400).json({
        success: false,
        message: 'This emergency request is not eligible for bonus'
      });
    }
    
    // Create the bonus
    const bonus = await createDriverBonus(emergencyRequest);
    
    res.status(200).json({
      success: true,
      message: 'Driver bonus created successfully',
      data: bonus
    });
    
  } catch (error) {
    console.error('❌ Error creating driver bonus via API:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create driver bonus',
      error: error.message
    });
  }
};

// Get driver bonus history
const getDriverBonusHistory = async (req, res) => {
  try {
    const { driverId } = req.params;
    const { month, year } = req.query;
    
    console.log(`💰 Fetching bonus history for driver: ${driverId}`);
    
    let query = { driverId: driverId };
    
    // Filter by month and year if provided
    if (month && year) {
      query.month = parseInt(month);
      query.year = parseInt(year);
    }
    
    const bonuses = await DriverBonus.find(query)
      .populate('emergencyRequestId', 'brigadeName brigadeLocation requestType priority')
      .sort({ deliveryDate: -1 });
    
    // Calculate totals
    const totalBonuses = bonuses.length;
    const totalAmount = bonuses.reduce((sum, bonus) => sum + bonus.bonusAmount, 0);
    const paidAmount = bonuses
      .filter(bonus => bonus.status === 'Paid')
      .reduce((sum, bonus) => sum + bonus.bonusAmount, 0);
    const pendingAmount = bonuses
      .filter(bonus => bonus.status === 'Approved')
      .reduce((sum, bonus) => sum + bonus.bonusAmount, 0);
    
    res.status(200).json({
      success: true,
      message: 'Driver bonus history retrieved successfully',
      data: {
        bonuses: bonuses,
        summary: {
          totalBonuses: totalBonuses,
          totalAmount: totalAmount,
          paidAmount: paidAmount,
          pendingAmount: pendingAmount,
          formattedTotalAmount: `Rs. ${totalAmount.toLocaleString()}`,
          formattedPaidAmount: `Rs. ${paidAmount.toLocaleString()}`,
          formattedPendingAmount: `Rs. ${pendingAmount.toLocaleString()}`
        }
      }
    });
    
  } catch (error) {
    console.error('❌ Error fetching driver bonus history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch driver bonus history',
      error: error.message
    });
  }
};

// Get driver paysheet (salary + bonuses)
const getDriverPaysheet = async (req, res) => {
  try {
    const { driverId } = req.params;
    const { month, year } = req.query;
    
    console.log(`💰 Fetching paysheet for driver: ${driverId} for ${month}/${year}`);
    
    // Get driver information
    const driver = await User.findById(driverId).select('name salary branchName');
    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Driver not found'
      });
    }
    
    // Get bonuses for the specified month/year
    const currentDate = new Date();
    const targetMonth = month ? parseInt(month) : currentDate.getMonth() + 1;
    const targetYear = year ? parseInt(year) : currentDate.getFullYear();
    
    const bonuses = await DriverBonus.find({
      driverId: driverId,
      month: targetMonth,
      year: targetYear
    }).populate('emergencyRequestId', 'brigadeName brigadeLocation requestType priority');
    
    // Calculate bonus totals
    const totalBonusAmount = bonuses.reduce((sum, bonus) => sum + bonus.bonusAmount, 0);
    const paidBonusAmount = bonuses
      .filter(bonus => bonus.status === 'Paid')
      .reduce((sum, bonus) => sum + bonus.bonusAmount, 0);
    const pendingBonusAmount = bonuses
      .filter(bonus => bonus.status === 'Approved')
      .reduce((sum, bonus) => sum + bonus.bonusAmount, 0);
    
    // Calculate total earnings
    const baseSalary = driver.salary || 0;
    const totalEarnings = baseSalary + totalBonusAmount;
    
    res.status(200).json({
      success: true,
      message: 'Driver paysheet retrieved successfully',
      data: {
        driver: {
          id: driver._id,
          name: driver.name,
          branchName: driver.branchName
        },
        period: {
          month: targetMonth,
          year: targetYear,
          monthName: new Date(targetYear, targetMonth - 1).toLocaleString('default', { month: 'long' })
        },
        salary: {
          baseSalary: baseSalary,
          formattedBaseSalary: `Rs. ${baseSalary.toLocaleString()}`
        },
        bonuses: {
          totalAmount: totalBonusAmount,
          paidAmount: paidBonusAmount,
          pendingAmount: pendingBonusAmount,
          formattedTotalAmount: `Rs. ${totalBonusAmount.toLocaleString()}`,
          formattedPaidAmount: `Rs. ${paidBonusAmount.toLocaleString()}`,
          formattedPendingAmount: `Rs. ${pendingBonusAmount.toLocaleString()}`,
          count: bonuses.length,
          details: bonuses
        },
        total: {
          totalEarnings: totalEarnings,
          formattedTotalEarnings: `Rs. ${totalEarnings.toLocaleString()}`
        }
      }
    });
    
  } catch (error) {
    console.error('❌ Error fetching driver paysheet:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch driver paysheet',
      error: error.message
    });
  }
};

module.exports = {
  createEmergencyRequest,
  getAllEmergencyRequests,
  getEmergencyRequestById,
  updateEmergencyRequestStatus,
  findNearestBranch,
  getEmergencyRequestsByStatus,
  getEmergencyRequestsByBrigade,
  getEmergencyRequestsByBranch,
  getEmergencyRequestsByDriver,
  getCompletedEmergencyRequestsByDriver,
  generateEmergencyLocation,
  calculateRouteInfo,
  deleteEmergencyRequest,
  createDriverBonus,
  createDriverBonusForRequest,
  getDriverBonusHistory,
  getDriverPaysheet
};
