const BranchOrder = require("../Model/BranchOrderModel");
const BranchInventory = require("../Model/BranchInventoryModel");
const Driver = require("../Model/DriverModel");
const Order = require("../Model/OrderModel");
const Inventory = require("../Model/InventoryModel");

// Get all branch orders
const getAllBranchOrders = async (req, res) => {
  try {
    const orders = await BranchOrder.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      orders: orders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching branch orders",
      error: error.message
    });
  }
};

// Get branch orders by branch ID
const getBranchOrdersByBranchId = async (req, res) => {
  try {
    const { branchId } = req.params;
    const orders = await BranchOrder.find({ branchId }).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      orders: orders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching branch orders",
      error: error.message
    });
  }
};

// Create new branch order
const createBranchOrder = async (req, res) => {
  try {
    const orderData = req.body;
    
    // Create branch order
    const newOrder = new BranchOrder(orderData);
    const savedOrder = await newOrder.save();

    // Always create a factory order for branch requests
    const factoryOrderData = {
      branchName: orderData.branchName,
      branchId: orderData.branchId,
      branchLocation: orderData.branchLocation,
      items: orderData.items,
      expectedDeliveryDate: orderData.expectedDeliveryDate,
      priority: orderData.priority,
      notes: `Branch Request: ${orderData.notes || ''}`,
      contactPerson: orderData.contactPerson,
      contactPhone: orderData.contactPhone,
      source: 'Branch Request',
      originalBranchOrderId: savedOrder._id,
      status: 'Pending' // Factory orders start as pending
    };
    
    const factoryOrder = new Order(factoryOrderData);
    const savedFactoryOrder = await factoryOrder.save();
    
    // Update branch order with factory order ID
    await BranchOrder.findByIdAndUpdate(savedOrder._id, {
      factoryOrderId: savedFactoryOrder._id
    });

    console.log(`✅ Branch order created: ${savedOrder._id}`);
    console.log(`🏭 Factory order created: ${savedFactoryOrder._id}`);

    res.status(201).json({
      success: true,
      message: "Branch order created successfully and forwarded to factory",
      order: savedOrder,
      factoryOrderId: savedFactoryOrder._id
    });
  } catch (error) {
    console.error('❌ Error creating branch order:', error);
    res.status(500).json({
      success: false,
      message: "Error creating branch order",
      error: error.message
    });
  }
};

// Update branch order
const updateBranchOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const updatedOrder = await BranchOrder.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedOrder) {
      return res.status(404).json({
        success: false,
        message: "Branch order not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Branch order updated successfully",
      order: updatedOrder
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating branch order",
      error: error.message
    });
  }
};

// Assign driver to order
const assignDriverToOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { driverId } = req.body;

    // Check if driver exists and is available
    const driver = await Driver.findOne({ driverId, status: 'Available' });
    if (!driver) {
      return res.status(404).json({
        success: false,
        message: "Driver not found or not available"
      });
    }

    // Update order with driver assignment
    const updatedOrder = await BranchOrder.findByIdAndUpdate(
      orderId,
      { 
        assignedDriver: driverId,
        status: 'Processing'
      },
      { new: true }
    );

    if (!updatedOrder) {
      return res.status(404).json({
        success: false,
        message: "Branch order not found"
      });
    }

    // Update driver status and add order to assigned orders
    await Driver.findByIdAndUpdate(
      driver._id,
      {
        status: 'On Delivery',
        $push: { assignedOrders: orderId }
      }
    );

    res.status(200).json({
      success: true,
      message: "Driver assigned successfully",
      order: updatedOrder
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error assigning driver",
      error: error.message
    });
  }
};

// Update order status
const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const updatedOrder = await BranchOrder.findByIdAndUpdate(
      orderId,
      { status },
      { new: true }
    );

    if (!updatedOrder) {
      return res.status(404).json({
        success: false,
        message: "Branch order not found"
      });
    }

    // Sync status change to factory order if it exists
    if (updatedOrder.factoryOrderId) {
      await Order.findByIdAndUpdate(updatedOrder.factoryOrderId, {
        status: status
      });
    }

    let inventoryUpdates = [];
    let driverUpdates = {};

    // If order is delivered, update driver status and inventory
    if (status === 'Delivered') {
      // Update driver status if driver is assigned
      if (updatedOrder.assignedDriver) {
        const updatedDriver = await Driver.findOneAndUpdate(
          { driverId: updatedOrder.assignedDriver },
          {
            status: 'Available',
            $inc: { totalDeliveries: 1 }
          },
          { new: true }
        );

        if (updatedDriver) {
          driverUpdates = {
            driverId: updatedDriver.driverId,
            driverName: updatedDriver.name,
            newStatus: updatedDriver.status,
            totalDeliveries: updatedDriver.totalDeliveries
          };
        }
      }

      // Update branch inventory for ALL delivered products (Stock Request and Water Delivery)
      console.log(`🔄 Updating branch inventory for order ${updatedOrder._id} with ${updatedOrder.items.length} items`);
      
      for (const item of updatedOrder.items) {
        try {
          console.log(`📦 Processing item: ${item.itemName} (${item.quantity} units) for branch ${updatedOrder.branchId}`);
          
          // Get factory inventory item to get additional details
          const factoryItem = await Inventory.findOne({ name: item.itemName });
          
          if (!factoryItem) {
            console.error(`❌ Factory inventory item not found: ${item.itemName}`);
            continue;
          }

          // Check if factory has enough inventory
          if (factoryItem.quantity < item.quantity) {
            console.error(`❌ Insufficient factory inventory for ${item.itemName}: ${factoryItem.quantity} available, ${item.quantity} requested`);
            continue;
          }

          // Reduce factory inventory
          const updatedFactoryInventory = await Inventory.findByIdAndUpdate(
            factoryItem._id,
            {
              $inc: { quantity: -item.quantity },
              lastUpdated: new Date()
            },
            { new: true, runValidators: true }
          );

          if (updatedFactoryInventory) {
            console.log(`🏭 Factory inventory reduced for ${item.itemName}: ${factoryItem.quantity} → ${updatedFactoryInventory.quantity} units`);
          } else {
            console.error(`❌ Failed to reduce factory inventory for ${item.itemName}`);
            continue;
          }
          
          // Update branch inventory with enhanced data
          const updateData = {
            $inc: { quantity: item.quantity },
            lastUpdated: new Date()
          };

          // If this is a new item in branch inventory, set additional properties
          if (factoryItem) {
            updateData.unit = factoryItem.unit || 'pieces';
            updateData.minStockLevel = factoryItem.minStockLevel || 10;
            updateData.maxStockLevel = factoryItem.maxStockLevel || 100;
          }

          const updatedInventory = await BranchInventory.findOneAndUpdate(
            {
              branchId: updatedOrder.branchId,
              name: item.itemName
            },
            {
              ...updateData,
              branchName: updatedOrder.branchName || 'Unknown Branch'
            },
            { 
              upsert: true, 
              new: true,
              setDefaultsOnInsert: true
            }
          );

          if (updatedInventory) {
            console.log(`✅ Successfully updated branch inventory for ${item.itemName}: ${updatedInventory.quantity} units`);
            inventoryUpdates.push({
              itemName: item.itemName,
              quantityAdded: item.quantity,
              newTotalQuantity: updatedInventory.quantity,
              status: updatedInventory.status,
              unit: updatedInventory.unit,
              previousQuantity: updatedInventory.quantity - item.quantity,
              factoryInventoryReduced: true,
              factoryNewQuantity: updatedFactoryInventory.quantity
            });
          } else {
            console.error(`❌ Failed to update branch inventory for ${item.itemName}`);
          }
        } catch (itemError) {
          console.error(`❌ Error updating inventory for item ${item.itemName}:`, itemError);
          // Continue with other items even if one fails
        }
      }
      
      console.log(`📊 Total inventory updates: ${inventoryUpdates.length}`);

      // Ensure factory order is also marked as delivered
      if (updatedOrder.factoryOrderId) {
        await Order.findByIdAndUpdate(updatedOrder.factoryOrderId, {
          status: 'Delivered'
        });
      }
    }

    res.status(200).json({
      success: true,
      message: "Order status updated successfully",
      order: updatedOrder,
      inventoryUpdates: inventoryUpdates.length > 0 ? inventoryUpdates : null,
      driverUpdates: Object.keys(driverUpdates).length > 0 ? driverUpdates : null
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating order status",
      error: error.message
    });
  }
};

// Delete branch order
const deleteBranchOrder = async (req, res) => {
  try {
    const { id } = req.params;
    
    const deletedOrder = await BranchOrder.findByIdAndDelete(id);
    
    if (!deletedOrder) {
      return res.status(404).json({
        success: false,
        message: "Branch order not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Branch order deleted successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting branch order",
      error: error.message
    });
  }
};

// Get order statistics
const getOrderStatistics = async (req, res) => {
  try {
    const { branchId } = req.params;
    
    const totalOrders = await BranchOrder.countDocuments({ branchId });
    const pendingOrders = await BranchOrder.countDocuments({ branchId, status: 'Pending' });
    const processingOrders = await BranchOrder.countDocuments({ branchId, status: 'Processing' });
    const deliveredOrders = await BranchOrder.countDocuments({ branchId, status: 'Delivered' });
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayOrders = await BranchOrder.countDocuments({
      branchId,
      orderDate: { $gte: today }
    });

    res.status(200).json({
      success: true,
      statistics: {
        totalOrders,
        pendingOrders,
        processingOrders,
        deliveredOrders,
        todayOrders
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching order statistics",
      error: error.message
    });
  }
};



module.exports = {
  getAllBranchOrders,
  getBranchOrdersByBranchId,
  createBranchOrder,
  updateBranchOrder,
  assignDriverToOrder,
  updateOrderStatus,
  deleteBranchOrder,
  getOrderStatistics
};
