const RecyclingRequest = require("../Model/RecyclingRequestModel");
const User = require("../Model/UserModel");
const RecyclingBin = require("../Model/RecyclingBinModel");

// Create new recycling request
const createRecyclingRequest = async (req, res) => {
  try {
    const requestData = req.body;
    console.log('🔄 Creating recycling request with data:', requestData);
    
    // Validate customer exists
    const customer = await User.findById(requestData.customerId);
    if (!customer) {
      console.log('❌ Customer not found:', requestData.customerId);
      return res.status(404).json({
        success: false,
        message: "Customer not found"
      });
    }
    console.log('✅ Customer found:', customer.name);

    // Create the recycling request
    console.log('📝 Creating new RecyclingRequest...');
    const newRequest = new RecyclingRequest(requestData);
    console.log('📋 New request object:', newRequest);
    
    console.log('💾 Saving request to database...');
    const savedRequest = await newRequest.save();
    console.log('✅ Request saved successfully:', savedRequest);

    // Update customer's recycling history
    console.log('🔄 Updating customer recycling history...');
    await User.findByIdAndUpdate(
      requestData.customerId,
      {
        $push: {
          recyclingHistory: {
            date: new Date(),
            branchId: requestData.branchId,
            branchName: requestData.branchName,
            weight: requestData.wasteWeight,
            pointsEarned: savedRequest.pointsEarned,
            status: 'Pending'
          }
        }
      }
    );
    console.log('✅ Customer history updated');

    // NOTE: Bin is NOT updated here - only after branch manager approval
    console.log('ℹ️  Bin will be updated after branch manager approval');

    res.status(201).json({
      success: true,
      message: "Recycling request created successfully",
      request: savedRequest
    });
  } catch (error) {
    console.error('❌ Error creating recycling request:', error);
    res.status(500).json({
      success: false,
      message: "Error creating recycling request",
      error: error.message
    });
  }
};

// Get all recycling requests
const getAllRecyclingRequests = async (req, res) => {
  try {
    const requests = await RecyclingRequest.find()
      .populate('customerId', 'name email')
      .populate('approvedBy', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      requests: requests
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching recycling requests",
      error: error.message
    });
  }
};

// Get recycling requests by customer ID
const getRecyclingRequestsByCustomer = async (req, res) => {
  try {
    const { customerId } = req.params;
    
    const requests = await RecyclingRequest.find({ customerId })
      .populate('approvedBy', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      requests: requests
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching customer recycling requests",
      error: error.message
    });
  }
};

// Get recycling requests by branch ID
const getRecyclingRequestsByBranch = async (req, res) => {
  try {
    const { branchId } = req.params;
    
    const requests = await RecyclingRequest.find({ branchId })
      .populate('customerId', 'name email')
      .populate('approvedBy', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      requests: requests
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching branch recycling requests",
      error: error.message
    });
  }
};

// Get pending recycling requests
const getPendingRecyclingRequests = async (req, res) => {
  try {
    const requests = await RecyclingRequest.find({ status: 'Pending' })
      .populate('customerId', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      requests: requests
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching pending recycling requests",
      error: error.message
    });
  }
};

// Approve recycling request and update bin
const approveRecyclingRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { approvedBy } = req.body;
    
    console.log('🔄 Approving recycling request:', id);
    
    // Find the recycling request
    const request = await RecyclingRequest.findById(id);
    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Recycling request not found"
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
    
    const updatedRequest = await request.save();
    console.log('✅ Request approved:', updatedRequest.requestId);
    
    // NOW update the recycling bin
    console.log('🗑️  Updating recycling bin after approval...');
    const bin = await RecyclingBin.findOne({ branchId: request.branchId });
    
    if (bin) {
      const newLevel = Math.min(bin.currentLevel + request.wasteWeight, bin.capacity);
      const newFillPercentage = (newLevel / bin.capacity) * 100;
      
      // Determine status based on fill percentage
      let newStatus = 'Empty';
      if (newFillPercentage >= 80) newStatus = 'Critical';
      else if (newFillPercentage >= 60) newStatus = 'High';
      else if (newFillPercentage >= 40) newStatus = 'Medium';
      else if (newFillPercentage >= 20) newStatus = 'Low';
      
      await RecyclingBin.findByIdAndUpdate(
        bin._id,
        { 
          currentLevel: newLevel,
          fillPercentage: newFillPercentage,
          status: newStatus
        }
      );
      console.log(`✅ Bin updated: ${newLevel}kg/${bin.capacity}kg (${newFillPercentage.toFixed(1)}%)`);
      
      // Check if bin needs factory notification
      if (newFillPercentage >= 80 && !bin.isNotified) {
        await RecyclingBin.findByIdAndUpdate(bin._id, { isNotified: true });
        console.log('🔔 Factory notification triggered (bin 90%+ full)');
      }
    } else {
      console.log('⚠️  No recycling bin found for branch:', request.branchId);
    }
    
    // Update customer's recycling points and history
    const customer = await User.findById(request.customerId);
    if (customer) {
      const newPoints = (customer.recyclingPoints || 0) + request.pointsEarned;
      
      await User.findByIdAndUpdate(request.customerId, {
        recyclingPoints: newPoints,
        $set: {
          'recyclingHistory.$[elem].status': 'Approved'
        }
      }, {
        arrayFilters: [{ 'elem.branchId': request.branchId, 'elem.date': { $gte: new Date(Date.now() - 24*60*60*1000) } }]
      });
      
      console.log(`✅ Customer points updated: ${newPoints} points`);
    }
    
    res.status(200).json({
      success: true,
      message: "Recycling request approved and bin updated",
      request: updatedRequest
    });
    
  } catch (error) {
    console.error('❌ Error approving recycling request:', error);
    res.status(500).json({
      success: false,
      message: "Error approving recycling request",
      error: error.message
    });
  }
};

// Reject recycling request
const rejectRecyclingRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { rejectedBy, notes } = req.body;
    
    const request = await RecyclingRequest.findById(id);
    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Recycling request not found"
      });
    }

    if (request.status !== 'Pending') {
      return res.status(400).json({
        success: false,
        message: "Request cannot be rejected - not in pending status"
      });
    }

    // Update request status
    const updatedRequest = await RecyclingRequest.findByIdAndUpdate(
      id,
      {
        status: 'Rejected',
        notes: notes || undefined
      },
      { new: true, runValidators: true }
    );

    // Update customer's recycling history
    await User.findByIdAndUpdate(
      request.customerId,
      {
        $set: {
          'recyclingHistory.$.status': 'Rejected'
        }
      }
    );

    // Reverse the recycling bin fill level
    const bin = await RecyclingBin.findOne({ branchId: request.branchId });
    if (bin) {
      const newLevel = Math.max(0, bin.currentLevel - request.wasteWeight);
      await RecyclingBin.findByIdAndUpdate(
        bin._id,
        { currentLevel: newLevel }
      );
    }

    res.status(200).json({
      success: true,
      message: "Recycling request rejected successfully",
      request: updatedRequest
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error rejecting recycling request",
      error: error.message
    });
  }
};

// Complete recycling request (after factory manager processes it)
const completeRecyclingRequest = async (req, res) => {
  try {
    const { id } = req.params;
    
    const request = await RecyclingRequest.findById(id);
    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Recycling request not found"
      });
    }

    if (request.status !== 'Approved') {
      return res.status(400).json({
        success: false,
        message: "Request cannot be completed - not in approved status"
      });
    }

    // Update request status
    const updatedRequest = await RecyclingRequest.findByIdAndUpdate(
      id,
      { status: 'Completed' },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: "Recycling request completed successfully",
      request: updatedRequest
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error completing recycling request",
      error: error.message
    });
  }
};

// Get recycling statistics
const getRecyclingStatistics = async (req, res) => {
  try {
    const totalRequests = await RecyclingRequest.countDocuments();
    const pendingRequests = await RecyclingRequest.countDocuments({ status: 'Pending' });
    const approvedRequests = await RecyclingRequest.countDocuments({ status: 'Approved' });
    const completedRequests = await RecyclingRequest.countDocuments({ status: 'Completed' });
    const rejectedRequests = await RecyclingRequest.countDocuments({ status: 'Rejected' });

    // Count weight and points from APPROVED and COMPLETED requests (actual recycling data)
    // This shows the real recycling activity from the database
    const totalWeight = await RecyclingRequest.aggregate([
      { $match: { status: { $in: ['Approved', 'Completed'] } } },
      { $group: { _id: null, total: { $sum: "$wasteWeight" } } }
    ]);

    const totalPoints = await RecyclingRequest.aggregate([
      { $match: { status: { $in: ['Approved', 'Completed'] } } },
      { $group: { _id: null, total: { $sum: "$pointsEarned" } } }
    ]);

    // Calculate completion rate based on completed vs total requests
    const completionRate = totalRequests > 0 
      ? Math.round((completedRequests / totalRequests) * 100) 
      : 0;

    console.log('📊 Recycling Statistics (Database Data):', {
      totalRequests,
      pendingRequests,
      approvedRequests,
      completedRequests,
      rejectedRequests,
      totalWeight: totalWeight[0]?.total || 0,
      totalPoints: totalPoints[0]?.total || 0,
      completionRate,
      note: 'Weight and points count APPROVED and COMPLETED requests (actual recycling data from database)'
    });

    res.status(200).json({
      success: true,
      statistics: {
        totalRequests,
        pendingRequests,
        approvedRequests,
        completedRequests,
        rejectedRequests,
        totalWeight: totalWeight[0]?.total || 0,
        totalPoints: totalPoints[0]?.total || 0,
        completionRate
      }
    });
  } catch (error) {
    console.error('❌ Error fetching recycling statistics:', error);
    res.status(500).json({
      success: false,
      message: "Error fetching recycling statistics",
      error: error.message
    });
  }
};

module.exports = {
  createRecyclingRequest,
  getAllRecyclingRequests,
  getRecyclingRequestsByCustomer,
  getRecyclingRequestsByBranch,
  getPendingRecyclingRequests,
  approveRecyclingRequest,
  rejectRecyclingRequest,
  completeRecyclingRequest,
  getRecyclingStatistics
};
