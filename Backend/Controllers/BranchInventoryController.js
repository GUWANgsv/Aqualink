const BranchInventory = require("../Model/BranchInventoryModel");
const Inventory = require("../Model/InventoryModel");
const BranchOrder = require("../Model/BranchOrderModel");

// Get all branch inventory
const getAllBranchInventory = async (req, res) => {
  try {
    const inventory = await BranchInventory.find().sort({ name: 1 });
    res.status(200).json({
      success: true,
      inventory: inventory
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching branch inventory",
      error: error.message
    });
  }
};

// Get branch inventory by branch ID
const getBranchInventoryByBranchId = async (req, res) => {
  try {
    const { branchId } = req.params;
    const inventory = await BranchInventory.find({ branchId }).sort({ name: 1 });
    res.status(200).json({
      success: true,
      inventory: inventory
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching branch inventory",
      error: error.message
    });
  }
};

// Create new branch inventory item
const createBranchInventoryItem = async (req, res) => {
  try {
    const inventoryData = req.body;
    
    // Check if item already exists for this branch
    const existingItem = await BranchInventory.findOne({
      branchId: inventoryData.branchId,
      name: inventoryData.name
    });

    if (existingItem) {
      return res.status(400).json({
        success: false,
        message: "Item already exists for this branch"
      });
    }

    const newItem = new BranchInventory(inventoryData);
    const savedItem = await newItem.save();

    res.status(201).json({
      success: true,
      message: "Branch inventory item created successfully",
      item: savedItem
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error creating branch inventory item",
      error: error.message
    });
  }
};

// Update branch inventory item
const updateBranchInventoryItem = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const updatedItem = await BranchInventory.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedItem) {
      return res.status(404).json({
        success: false,
        message: "Branch inventory item not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Branch inventory item updated successfully",
      item: updatedItem
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating branch inventory item",
      error: error.message
    });
  }
};

// Update stock levels
const updateStockLevels = async (req, res) => {
  try {
    const { branchId } = req.params;
    const { items } = req.body; // Array of { name, quantity, operation: 'add' | 'subtract' }

    const updatedItems = [];

    for (const item of items) {
      const filter = {
        branchId: branchId,
        name: item.name
      };

      const update = {
        $inc: { quantity: item.operation === 'add' ? item.quantity : -item.quantity }
      };

      const updatedItem = await BranchInventory.findOneAndUpdate(
        filter,
        update,
        { new: true, upsert: true }
      );

      updatedItems.push(updatedItem);
    }

    res.status(200).json({
      success: true,
      message: "Stock levels updated successfully",
      items: updatedItems
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating stock levels",
      error: error.message
    });
  }
};

// Get low stock items
const getLowStockItems = async (req, res) => {
  try {
    const { branchId } = req.params;
    
    const lowStockItems = await BranchInventory.find({
      branchId: branchId,
      status: { $in: ['Low Stock', 'Out of Stock'] }
    });

    res.status(200).json({
      success: true,
      lowStockItems: lowStockItems
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching low stock items",
      error: error.message
    });
  }
};

// Check low stock and create automatic orders
const checkLowStockAndCreateOrder = async (req, res) => {
  try {
    const { branchId } = req.params;
    
    // Get all low stock items (quantity < 10)
    const lowStockItems = await BranchInventory.find({
      branchId: branchId,
      quantity: { $lt: 10 }
    });

    if (lowStockItems.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No low stock items found",
        lowStockItems: []
      });
    }

    // Create order items for low stock items
    const orderItems = lowStockItems.map(item => ({
      itemName: item.name,
      quantity: Math.max(20, item.maxStockLevel - item.quantity) // Order enough to reach max stock level
    }));

    // Get branch information
    const firstItem = lowStockItems[0];
    const branchInfo = {
      branchId: firstItem.branchId,
      branchName: firstItem.branchName
    };

    // Create automatic stock request order
    const orderData = {
      ...branchInfo,
      branchLocation: req.body.branchLocation || 'Branch Location',
      orderType: 'Stock Request',
      items: orderItems,
      expectedDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      priority: 'High',
      notes: `Automatic order for low stock items: ${lowStockItems.map(item => item.name).join(', ')}`,
      contactPerson: req.body.contactPerson || 'Branch Manager',
      contactPhone: req.body.contactPhone || '+94-11-0000000'
    };

    const newOrder = new BranchOrder(orderData);
    const savedOrder = await newOrder.save();

    // Create corresponding factory order
    if (orderItems.length > 0) {
      const factoryOrderData = {
        branchName: branchInfo.branchName,
        branchLocation: orderData.branchLocation,
        items: orderItems,
        expectedDeliveryDate: orderData.expectedDeliveryDate,
        priority: orderData.priority,
        notes: `Automatic Branch Request: ${orderData.notes}`,
        contactPerson: orderData.contactPerson,
        contactPhone: orderData.contactPhone,
        source: 'Branch Request',
        originalBranchOrderId: savedOrder._id
      };
      
      const Order = require("../Model/OrderModel");
      const factoryOrder = new Order(factoryOrderData);
      const savedFactoryOrder = await factoryOrder.save();
      
      // Update branch order with factory order ID
      await BranchOrder.findByIdAndUpdate(savedOrder._id, {
        factoryOrderId: savedFactoryOrder._id
      });
    }

    res.status(201).json({
      success: true,
      message: "Automatic order created for low stock items",
      order: savedOrder,
      lowStockItems: lowStockItems
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error creating automatic order for low stock items",
      error: error.message
    });
  }
};

// Initialize branch inventory from factory inventory
const initializeBranchInventory = async (req, res) => {
  try {
    const { branchId, branchName } = req.body;

    // Get factory inventory items
    const factoryInventory = await Inventory.find();
    
    const branchItems = factoryInventory.map(item => ({
      branchId: branchId,
      branchName: branchName,
      name: item.name,
      quantity: 0,
      unit: item.unit,
      minStockLevel: item.minStockLevel,
      maxStockLevel: item.maxStockLevel
    }));

    // Add water bottles
    const waterBottles = [
      { name: '5L Water Bottles', unit: 'bottles', minStockLevel: 20, maxStockLevel: 200 },
      { name: '10L Water Bottles', unit: 'bottles', minStockLevel: 15, maxStockLevel: 150 },
      { name: '20L Water Bottles', unit: 'bottles', minStockLevel: 10, maxStockLevel: 100 }
    ];

    waterBottles.forEach(bottle => {
      branchItems.push({
        branchId: branchId,
        branchName: branchName,
        name: bottle.name,
        quantity: 0,
        unit: bottle.unit,
        minStockLevel: bottle.minStockLevel,
        maxStockLevel: bottle.maxStockLevel
      });
    });

    // Insert all items
    const savedItems = await BranchInventory.insertMany(branchItems);

    res.status(201).json({
      success: true,
      message: "Branch inventory initialized successfully",
      items: savedItems
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error initializing branch inventory",
      error: error.message
    });
  }
};

// Delete branch inventory item
const deleteBranchInventoryItem = async (req, res) => {
  try {
    const { id } = req.params;
    
    const deletedItem = await BranchInventory.findByIdAndDelete(id);
    
    if (!deletedItem) {
      return res.status(404).json({
        success: false,
        message: "Branch inventory item not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Branch inventory item deleted successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting branch inventory item",
      error: error.message
    });
  }
};

// Get inventory statistics
const getInventoryStatistics = async (req, res) => {
  try {
    const { branchId } = req.params;
    
    const totalItems = await BranchInventory.countDocuments({ branchId });
    const lowStockItems = await BranchInventory.countDocuments({ 
      branchId, 
      status: 'Low Stock' 
    });
    const outOfStockItems = await BranchInventory.countDocuments({ 
      branchId, 
      status: 'Out of Stock' 
    });
    const inStockItems = await BranchInventory.countDocuments({ 
      branchId, 
      status: 'In Stock' 
    });

    const totalValue = await BranchInventory.aggregate([
      { $match: { branchId: branchId } },
      { $group: { _id: null, total: { $sum: "$quantity" } } }
    ]);

    res.status(200).json({
      success: true,
      statistics: {
        totalItems,
        lowStockItems,
        outOfStockItems,
        inStockItems,
        totalQuantity: totalValue[0]?.total || 0
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching inventory statistics",
      error: error.message
    });
  }
};

module.exports = {
  getAllBranchInventory,
  getBranchInventoryByBranchId,
  createBranchInventoryItem,
  updateBranchInventoryItem,
  updateStockLevels,
  getLowStockItems,
  checkLowStockAndCreateOrder,
  initializeBranchInventory,
  deleteBranchInventoryItem,
  getInventoryStatistics
};
