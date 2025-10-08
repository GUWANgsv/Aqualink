const Order = require("../Model/OrderModel");
const BranchOrder = require("../Model/BranchOrderModel");
const Inventory = require("../Model/InventoryModel");
const BranchInventory = require("../Model/BranchInventoryModel");
const Driver = require("../Model/DriverModel");

// Process delivery from factory to branch
const processDelivery = async (req, res) => {
  try {
    const { orderId, deliveryType } = req.body; // deliveryType: 'factory' or 'branch'
    
    if (deliveryType === 'factory') {
      return await processFactoryDelivery(req, res);
    } else if (deliveryType === 'branch') {
      return await processBranchDelivery(req, res);
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid delivery type. Must be 'factory' or 'branch'"
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error processing delivery",
      error: error.message
    });
  }
};

// Process factory order delivery (ship from factory)
const processFactoryDelivery = async (req, res) => {
  try {
    const { orderId } = req.body;
    
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Factory order not found"
      });
    }

    if (order.status !== 'Pending' && order.status !== 'Processing') {
      return res.status(400).json({
        success: false,
        message: `Order cannot be shipped. Current status: ${order.status}`
      });
    }

    const inventoryUpdates = [];
    const insufficientItems = [];

    // Check and update factory inventory
    for (const item of order.items) {
      const inventoryItem = await Inventory.findOne({ name: item.itemName });
      
      if (!inventoryItem) {
        insufficientItems.push({
          itemName: item.itemName,
          reason: "Item not found in factory inventory"
        });
        continue;
      }

      if (inventoryItem.quantity < item.quantity) {
        insufficientItems.push({
          itemName: item.itemName,
          available: inventoryItem.quantity,
          required: item.quantity,
          reason: "Insufficient stock"
        });
        continue;
      }

      // Reduce factory inventory
      inventoryItem.quantity -= item.quantity;
      await inventoryItem.save();

      inventoryUpdates.push({
        itemName: item.itemName,
        quantityShipped: item.quantity,
        newFactoryQuantity: inventoryItem.quantity,
        status: inventoryItem.status
      });
    }

    if (insufficientItems.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot ship order due to insufficient inventory",
        insufficientItems
      });
    }

    // Update order status to shipped
    order.status = 'Shipped';
    await order.save();

    // Sync with branch order if it exists
    if (order.originalBranchOrderId) {
      await BranchOrder.findByIdAndUpdate(order.originalBranchOrderId, {
        status: 'Shipped'
      });
    }

    res.status(200).json({
      success: true,
      message: "Order shipped successfully from factory",
      order: order,
      inventoryUpdates: inventoryUpdates
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error processing factory delivery",
      error: error.message
    });
  }
};

// Process branch order delivery (deliver to branch)
const processBranchDelivery = async (req, res) => {
  try {
    const { orderId } = req.body;
    
    const order = await BranchOrder.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Branch order not found"
      });
    }

    if (order.status !== 'Shipped') {
      return res.status(400).json({
        success: false,
        message: `Order cannot be delivered. Current status: ${order.status}. Order must be shipped first.`
      });
    }

    const inventoryUpdates = [];
    const driverUpdates = {};
    const deliverySummary = {
      totalItems: 0,
      totalQuantity: 0,
      itemsDelivered: []
    };

    // Update branch inventory for ALL delivered products
    for (const item of order.items) {
      try {
        // Get factory inventory item to get additional details
        const factoryItem = await Inventory.findOne({ name: item.itemName });
        
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
            branchId: order.branchId,
            name: item.itemName
          },
          {
            ...updateData,
            branchName: order.branchName || 'Unknown Branch'
          },
          { 
            upsert: true, 
            new: true,
            setDefaultsOnInsert: true
          }
        );

        if (updatedInventory) {
          // Update delivery summary
          deliverySummary.totalItems++;
          deliverySummary.totalQuantity += item.quantity;
          deliverySummary.itemsDelivered.push({
            name: item.itemName,
            quantity: item.quantity,
            unit: updatedInventory.unit
          });

          inventoryUpdates.push({
            itemName: item.itemName,
            quantityDelivered: item.quantity,
            newBranchQuantity: updatedInventory.quantity,
            status: updatedInventory.status,
            unit: updatedInventory.unit,
            previousQuantity: updatedInventory.quantity - item.quantity
          });
        }
      } catch (itemError) {
        console.error(`Error updating inventory for item ${item.itemName}:`, itemError);
        // Continue with other items even if one fails
      }
    }

    // Update driver status if assigned
    if (order.assignedDriver) {
      const updatedDriver = await Driver.findOneAndUpdate(
        { driverId: order.assignedDriver },
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

    // Update order status to delivered
    order.status = 'Delivered';
    await order.save();

    // Sync with factory order if it exists
    if (order.factoryOrderId) {
      await Order.findByIdAndUpdate(order.factoryOrderId, {
        status: 'Delivered'
      });
    }

    res.status(200).json({
      success: true,
      message: "Order delivered successfully to branch",
      order: order,
      inventoryUpdates: inventoryUpdates,
      deliverySummary: deliverySummary,
      driverUpdates: Object.keys(driverUpdates).length > 0 ? driverUpdates : null
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error processing branch delivery",
      error: error.message
    });
  }
};

// Get delivery statistics
const getDeliveryStats = async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    // Factory deliveries (shipped today)
    const factoryDeliveries = await Order.countDocuments({
      status: 'Shipped',
      updatedAt: { $gte: startOfDay, $lt: endOfDay }
    });

    // Branch deliveries (delivered today)
    const branchDeliveries = await BranchOrder.countDocuments({
      status: 'Delivered',
      updatedAt: { $gte: startOfDay, $lt: endOfDay }
    });

    // Pending shipments
    const pendingShipments = await Order.countDocuments({
      status: { $in: ['Pending', 'Processing'] }
    });

    // Pending deliveries
    const pendingDeliveries = await BranchOrder.countDocuments({
      status: 'Shipped'
    });

    // Get total products delivered today
    const todayDeliveredOrders = await BranchOrder.find({
      status: 'Delivered',
      updatedAt: { $gte: startOfDay, $lt: endOfDay }
    });

    let totalProductsDelivered = 0;
    let totalQuantityDelivered = 0;
    const productsDelivered = {};

    todayDeliveredOrders.forEach(order => {
      order.items.forEach(item => {
        totalProductsDelivered++;
        totalQuantityDelivered += item.quantity;
        
        if (productsDelivered[item.itemName]) {
          productsDelivered[item.itemName] += item.quantity;
        } else {
          productsDelivered[item.itemName] = item.quantity;
        }
      });
    });

    res.status(200).json({
      success: true,
      stats: {
        factoryDeliveriesToday: factoryDeliveries,
        branchDeliveriesToday: branchDeliveries,
        pendingShipments: pendingShipments,
        pendingDeliveries: pendingDeliveries,
        totalProductsDeliveredToday: totalProductsDelivered,
        totalQuantityDeliveredToday: totalQuantityDelivered,
        productsDeliveredToday: productsDelivered
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching delivery statistics",
      error: error.message
    });
  }
};

// Get delivery history
const getDeliveryHistory = async (req, res) => {
  try {
    const { branchId, limit = 50 } = req.query;
    
    const query = { status: 'Delivered' };
    if (branchId) {
      query.branchId = branchId;
    }

    const deliveredOrders = await BranchOrder.find(query)
      .sort({ updatedAt: -1 })
      .limit(parseInt(limit))
      .populate('factoryOrderId', 'orderNumber branchName');

    const deliveryHistory = deliveredOrders.map(order => {
      const totalQuantity = order.items.reduce((sum, item) => sum + item.quantity, 0);
      const totalItems = order.items.length;
      
      return {
        orderId: order._id,
        orderNumber: order.orderNumber,
        branchId: order.branchId,
        branchName: order.branchName,
        deliveredAt: order.updatedAt,
        totalItems: totalItems,
        totalQuantity: totalQuantity,
        items: order.items,
        assignedDriver: order.assignedDriver,
        factoryOrderId: order.factoryOrderId
      };
    });

    res.status(200).json({
      success: true,
      deliveryHistory: deliveryHistory,
      totalDeliveries: deliveryHistory.length
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching delivery history",
      error: error.message
    });
  }
};

module.exports = {
  processDelivery,
  processFactoryDelivery,
  processBranchDelivery,
  getDeliveryStats,
  getDeliveryHistory
};
