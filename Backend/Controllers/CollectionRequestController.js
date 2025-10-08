const CollectionRequest = require("../Model/CollectionRequestModel");
const RecyclingBin = require("../Model/RecyclingBinModel");
const User = require("../Model/UserModel");

// Create new collection request
const createCollectionRequest = async (req, res) => {
  try {
    const { branchId, binId, requestType, notes } = req.body;
    console.log('🔄 Creating collection request with data:', req.body);
    console.log('🔍 Request details:', { branchId, binId, requestType, notes });
    
    // Validate required fields
    if (!branchId || !binId || !requestType) {
      console.error('❌ Missing required fields:', { branchId, binId, requestType });
      return res.status(400).json({
        success: false,
        message: "Missing required fields: branchId, binId, and requestType are required"
      });
    }
    
    // Get bin information
    console.log('🔍 Looking for bin with ID:', binId);
    const bin = await RecyclingBin.findById(binId);
    if (!bin) {
      console.error('❌ Recycling bin not found for ID:', binId);
      return res.status(404).json({
        success: false,
        message: "Recycling bin not found"
      });
    }
    console.log('✅ Found bin:', { id: bin._id, branchId: bin.branchId, branchName: bin.branchName });

    // Check if there's already a pending request for this bin
    console.log('🔍 Checking for existing pending requests...');
    const existingRequest = await CollectionRequest.findOne({
      binId: binId,
      status: 'Pending'
    });

    if (existingRequest) {
      console.log('❌ Found existing pending request:', existingRequest.requestId);
      return res.status(400).json({
        success: false,
        message: "There is already a pending collection request for this bin"
      });
    }
    console.log('✅ No existing pending requests found');

    // Create the collection request
    const requestData = {
      branchId: bin.branchId,
      branchName: bin.branchName,
      branchLocation: bin.location,
      binId: binId,
      currentLevel: bin.currentLevel,
      capacity: bin.capacity,
      fillPercentage: bin.fillPercentage,
      requestType: requestType,
      notes: notes
    };

    console.log('📝 Creating collection request with data:', requestData);
    const newRequest = new CollectionRequest(requestData);
    const savedRequest = await newRequest.save();
    console.log('✅ Collection request created successfully:', savedRequest.requestId);

    res.status(201).json({
      success: true,
      message: "Collection request created successfully",
      request: savedRequest
    });
  } catch (error) {
    console.error('❌ Error creating collection request:', error);
    res.status(500).json({
      success: false,
      message: "Error creating collection request",
      error: error.message
    });
  }
};

// Get all collection requests
const getAllCollectionRequests = async (req, res) => {
  try {
    const requests = await CollectionRequest.find()
      .populate('branchId', 'name location')
      .populate('binId', 'binId currentLevel capacity fillPercentage status')
      .populate('approvedBy', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      requests: requests
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching collection requests",
      error: error.message
    });
  }
};

// Get pending collection requests
const getPendingCollectionRequests = async (req, res) => {
  try {
    console.log('🔍 Fetching pending collection requests...');
    const requests = await CollectionRequest.find({ status: 'Pending' })
      .populate('branchId', 'name location')
      .populate('binId', 'binId currentLevel capacity fillPercentage status')
      .sort({ createdAt: -1 });

    console.log('✅ Found pending collection requests:', requests.length);
    console.log('📋 Requests data:', requests);

    res.status(200).json({
      success: true,
      requests: requests
    });
  } catch (error) {
    console.error('❌ Error fetching pending collection requests:', error);
    res.status(500).json({
      success: false,
      message: "Error fetching pending collection requests",
      error: error.message
    });
  }
};

// Get collection requests by branch
const getCollectionRequestsByBranch = async (req, res) => {
  try {
    const { branchId } = req.params;
    
    const requests = await CollectionRequest.find({ branchId })
      .populate('binId', 'binId currentLevel capacity fillPercentage status')
      .populate('approvedBy', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      requests: requests
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching branch collection requests",
      error: error.message
    });
  }
};

// Approve collection request and empty bin
const approveCollectionRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { approvedBy, notes } = req.body;
    
    console.log('🔄 Approving collection request:', id);
    
    // Find the collection request
    const request = await CollectionRequest.findById(id);
    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Collection request not found"
      });
    }
    
    if (request.status !== 'Pending') {
      return res.status(400).json({
        success: false,
        message: "Request is not in pending status"
      });
    }
    
    // Update request status
    request.status = 'Approved';
    request.approvedDate = new Date();
    request.approvedBy = approvedBy;
    request.notes = notes;
    
    const updatedRequest = await request.save();
    console.log('✅ Collection request approved:', updatedRequest.requestId);
    
    // Empty the recycling bin and add waste to factory bin
    console.log('🗑️  Emptying recycling bin...');
    const bin = await RecyclingBin.findById(request.binId);
    
    if (bin) {
      // Get the waste weight before emptying
      const wasteWeight = bin.currentLevel;
      const wasteType = bin.wasteType || 'Mixed';
      
      // Empty the branch bin
      await RecyclingBin.findByIdAndUpdate(
        request.binId,
        { 
          currentLevel: 0,
          fillPercentage: 0,
          status: 'Empty',
          lastEmptied: new Date(),
          isNotified: false
        }
      );
      console.log('✅ Branch bin emptied successfully');
      
      // Add waste to factory waste bin
      if (wasteWeight > 0) {
        console.log(`🏭 Adding ${wasteWeight} kg of ${wasteType} waste to factory bin...`);
        const FactoryWasteBin = require('../Model/FactoryWasteBinModel');
        const factoryBin = await FactoryWasteBin.getMainBin();
        
        await factoryBin.addWaste({
          sourceBranch: request.branchName || 'Unknown Branch',
          sourceBranchId: request.branchId || 'unknown',
          wasteWeight: wasteWeight,
          wasteType: wasteType,
          collectionRequestId: request._id.toString(),
          processedBy: approvedBy || 'Factory Manager'
        });
        console.log('✅ Waste added to factory bin successfully');
      }
    } else {
      console.log('⚠️  No recycling bin found for request');
    }
    
    res.status(200).json({
      success: true,
      message: "Collection request approved and bin emptied successfully",
      request: updatedRequest
    });
    
  } catch (error) {
    console.error('❌ Error approving collection request:', error);
    res.status(500).json({
      success: false,
      message: "Error approving collection request",
      error: error.message
    });
  }
};

// Reject collection request
const rejectCollectionRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { rejectedBy, notes } = req.body;
    
    const request = await CollectionRequest.findById(id);
    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Collection request not found"
      });
    }

    if (request.status !== 'Pending') {
      return res.status(400).json({
        success: false,
        message: "Request cannot be rejected - not in pending status"
      });
    }

    // Update request status
    const updatedRequest = await CollectionRequest.findByIdAndUpdate(
      id,
      {
        status: 'Rejected',
        notes: notes || undefined
      },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: "Collection request rejected successfully",
      request: updatedRequest
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error rejecting collection request",
      error: error.message
    });
  }
};

// Complete collection request
const completeCollectionRequest = async (req, res) => {
  try {
    const { id } = req.params;
    
    const request = await CollectionRequest.findById(id);
    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Collection request not found"
      });
    }

    if (request.status !== 'Approved') {
      return res.status(400).json({
        success: false,
        message: "Request cannot be completed - not in approved status"
      });
    }

    // Update request status
    const updatedRequest = await CollectionRequest.findByIdAndUpdate(
      id,
      { 
        status: 'Completed',
        completedDate: new Date()
      },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: "Collection request completed successfully",
      request: updatedRequest
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error completing collection request",
      error: error.message
    });
  }
};

// Get collection statistics
const getCollectionStatistics = async (req, res) => {
  try {
    const totalRequests = await CollectionRequest.countDocuments();
    const pendingRequests = await CollectionRequest.countDocuments({ status: 'Pending' });
    const approvedRequests = await CollectionRequest.countDocuments({ status: 'Approved' });
    const completedRequests = await CollectionRequest.countDocuments({ status: 'Completed' });
    const rejectedRequests = await CollectionRequest.countDocuments({ status: 'Rejected' });

    res.status(200).json({
      success: true,
      statistics: {
        totalRequests,
        pendingRequests,
        approvedRequests,
        completedRequests,
        rejectedRequests
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching collection statistics",
      error: error.message
    });
  }
};

module.exports = {
  createCollectionRequest,
  getAllCollectionRequests,
  getPendingCollectionRequests,
  getCollectionRequestsByBranch,
  approveCollectionRequest,
  rejectCollectionRequest,
  completeCollectionRequest,
  getCollectionStatistics
};
