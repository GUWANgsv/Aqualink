const FactoryRequest = require('../Model/FactoryRequestModel');
const Inventory = require('../Model/InventoryModel');
const BranchInventory = require('../Model/BranchInventoryModel');

// Create a new factory request
const createFactoryRequest = async (req, res) => {
  try {
    console.log('Creating factory request with data:', req.body);
    const requestData = req.body;
    
    const factoryRequest = new FactoryRequest(requestData);
    console.log('Factory request object created:', factoryRequest);
    
    await factoryRequest.save();
    console.log('Factory request saved successfully');
    
    res.status(201).json({
      success: true,
      message: "Factory request created successfully",
      request: factoryRequest
    });
  } catch (error) {
    console.error('Error creating factory request:', error);
    res.status(500).json({
      success: false,
      message: "Error creating factory request",
      error: error.message
    });
  }
};

// Get all factory requests
const getAllFactoryRequests = async (req, res) => {
  try {
    const requests = await FactoryRequest.find().sort({ requestedAt: -1 });
    
    res.status(200).json({
      success: true,
      requests
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching factory requests",
      error: error.message
    });
  }
};

// Get factory requests by status
const getFactoryRequestsByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    const requests = await FactoryRequest.find({ status }).sort({ requestedAt: -1 });
    
    res.status(200).json({
      success: true,
      requests
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching factory requests",
      error: error.message
    });
  }
};

// Approve a factory request
const approveFactoryRequest = async (req, res) => {
  try {
    console.log('=== APPROVING FACTORY REQUEST ===');
    console.log('Request ID:', req.params.id);
    console.log('Request body:', req.body);
    console.log('User:', req.user?.email, 'Role:', req.user?.role);
    
    const { id } = req.params;
    const { approvedBy, notes } = req.body;
    
    const request = await FactoryRequest.findById(id);
    if (!request) {
      console.log('Request not found:', id);
      return res.status(404).json({
        success: false,
        message: "Factory request not found"
      });
    }
    
    console.log('Found request:', request);
    console.log('Request status:', request.status);
    
    if (request.status !== 'pending') {
      console.log('Request is not pending, current status:', request.status);
      return res.status(400).json({
        success: false,
        message: "Request is not in pending status"
      });
    }
    
    console.log('Checking factory inventory for items:', request.items);
    
    // Check if factory has enough inventory
    for (const item of request.items) {
      const factoryItem = await Inventory.findOne({ name: item.name });
      console.log(`Checking ${item.name}: Factory has ${factoryItem?.quantity || 0}, Requested: ${item.requestedQuantity}`);
      
      if (!factoryItem || factoryItem.quantity < item.requestedQuantity) {
        console.log(`Insufficient inventory for ${item.name}`);
        return res.status(400).json({
          success: false,
          message: `Insufficient inventory for ${item.name}. Available: ${factoryItem?.quantity || 0}, Required: ${item.requestedQuantity}`
        });
      }
    }
    
    console.log('All inventory checks passed, proceeding with transfer...');
    
    // Move inventory: Decrement factory inventory and increment branch inventory
    for (const item of request.items) {
      // Decrement factory inventory
      const factoryItem = await Inventory.findOne({ name: item.name });
      if (factoryItem) {
        factoryItem.quantity -= item.requestedQuantity;
        await factoryItem.save();
        console.log(`Decremented factory inventory for ${item.name}: ${item.requestedQuantity} units`);
      }
      
      // Update branch inventory
      const branchItem = await BranchInventory.findOne({
        branchId: request.branchId,
        name: item.name
      });
      
      if (branchItem) {
        branchItem.quantity += item.requestedQuantity;
        await branchItem.save();
        console.log(`Incremented branch inventory for ${item.name}: ${item.requestedQuantity} units`);
      } else {
        // Create new branch inventory item if it doesn't exist
        const newBranchItem = new BranchInventory({
          branchId: request.branchId,
          name: item.name,
          quantity: item.requestedQuantity,
          minStockLevel: item.minStockLevel,
          maxStockLevel: item.maxStockLevel,
          unit: item.unit,
          status: 'In Stock'
        });
        await newBranchItem.save();
        console.log(`Created new branch inventory item for ${item.name}: ${item.requestedQuantity} units`);
      }
    }
    
    // Update request status to fulfilled (since inventory is moved)
    request.status = 'fulfilled';
    request.approvedAt = new Date();
    request.fulfilledAt = new Date();
    request.approvedBy = approvedBy;
    request.notes = notes;
    await request.save();
    
    res.status(200).json({
      success: true,
      message: "Factory request approved successfully",
      request
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error approving factory request",
      error: error.message
    });
  }
};

// Fulfill a factory request (decrement factory inventory and update branch inventory)
const fulfillFactoryRequest = async (req, res) => {
  try {
    const { id } = req.params;
    
    const request = await FactoryRequest.findById(id);
    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Factory request not found"
      });
    }
    
    if (request.status !== 'approved') {
      return res.status(400).json({
        success: false,
        message: "Request must be approved before fulfillment"
      });
    }
    
    // Decrement factory inventory and update branch inventory
    for (const item of request.items) {
      // Decrement factory inventory
      const factoryItem = await Inventory.findOne({ name: item.name });
      if (factoryItem) {
        factoryItem.quantity -= item.requestedQuantity;
        await factoryItem.save();
      }
      
      // Update branch inventory
      const branchItem = await BranchInventory.findOne({
        branchId: request.branchId,
        name: item.name
      });
      
      if (branchItem) {
        branchItem.quantity += item.requestedQuantity;
        await branchItem.save();
      } else {
        // Create new branch inventory item if it doesn't exist
        const newBranchItem = new BranchInventory({
          branchId: request.branchId,
          name: item.name,
          quantity: item.requestedQuantity,
          minStockLevel: item.minStockLevel,
          maxStockLevel: item.maxStockLevel,
          unit: item.unit,
          status: 'In Stock'
        });
        await newBranchItem.save();
      }
    }
    
    // Update request status
    request.status = 'fulfilled';
    request.fulfilledAt = new Date();
    await request.save();
    
    res.status(200).json({
      success: true,
      message: "Factory request fulfilled successfully",
      request
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fulfilling factory request",
      error: error.message
    });
  }
};

// Reject a factory request
const rejectFactoryRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    
    const request = await FactoryRequest.findById(id);
    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Factory request not found"
      });
    }
    
    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: "Request is not in pending status"
      });
    }
    
    request.status = 'rejected';
    request.notes = notes;
    await request.save();
    
    res.status(200).json({
      success: true,
      message: "Factory request rejected",
      request
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error rejecting factory request",
      error: error.message
    });
  }
};

// Get factory requests for a specific branch
const getBranchFactoryRequests = async (req, res) => {
  try {
    const { branchId } = req.params;
    const requests = await FactoryRequest.find({ branchId }).sort({ requestedAt: -1 });
    
    res.status(200).json({
      success: true,
      requests
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching branch factory requests",
      error: error.message
    });
  }
};

module.exports = {
  createFactoryRequest,
  getAllFactoryRequests,
  getFactoryRequestsByStatus,
  approveFactoryRequest,
  fulfillFactoryRequest,
  rejectFactoryRequest,
  getBranchFactoryRequests
};
