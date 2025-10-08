const express = require('express');
const router = express.Router();
const CustomerPurchase = require('../Model/CustomerPurchaseModel');
const BranchInventory = require('../Model/BranchInventoryModel');
const Branch = require('../Model/BranchModel');
const User = require('../Model/UserModel');

// Create a new customer purchase and immediately process it (decrement inventory)
router.post('/', async (req, res) => {
  try {
    const {
      customerId,
      customerName,
      customerEmail,
      customerPhone,
      items,
      paymentMethod,
      deliveryAddress,
      notes
    } = req.body;

    // Validate required fields
    if (!customerName || !customerEmail || !customerPhone || !items || !paymentMethod) {
      console.error('Missing required fields:', { customerName, customerEmail, customerPhone, items, paymentMethod });
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Validate items array
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Items array is required and must not be empty'
      });
    }

    console.log('Received items for validation:', JSON.stringify(items, null, 2));

    // Get the single branch (assuming there's only one active branch)
    const branch = await Branch.findOne({ status: 'Active' });
    
    if (!branch) {
      return res.status(404).json({
        success: false,
        message: 'No active branch found'
      });
    }

    // Validate items and check inventory
    const processedItems = [];
    let subtotal = 0;

    for (const item of items) {
      const { itemName, quantity, unitPrice } = item;

      // Validate item structure
      if (!itemName || !quantity || !unitPrice) {
        return res.status(400).json({
          success: false,
          message: `Invalid item structure. Each item must have itemName, quantity, and unitPrice`
        });
      }

      // Check if item exists in branch inventory
      const branchInventory = await BranchInventory.findOne({
        branchId: branch._id.toString(),
        name: itemName
      });

      if (!branchInventory) {
        return res.status(400).json({
          success: false,
          message: `Item ${itemName} not found in branch inventory`
        });
      }

      // Check if sufficient quantity is available
      if (branchInventory.quantity < quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient quantity for ${itemName}. Available: ${branchInventory.quantity}, Requested: ${quantity}`
        });
      }

      const totalPrice = quantity * unitPrice;
      subtotal += totalPrice;

      processedItems.push({
        itemName,
        quantity,
        unitPrice,
        totalPrice
      });
    }

    // Calculate tax (assuming 15% VAT)
    const tax = subtotal * 0.15;
    const totalAmount = subtotal + tax;

    // Create the purchase
    const purchaseData = {
      customerId,
      customerName,
      customerEmail,
      customerPhone,
      branchId: branch._id.toString(),
      branchName: branch.name,
      items: processedItems,
      totalQuantity: processedItems.reduce((sum, item) => sum + item.quantity, 0),
      subtotal,
      tax,
      totalAmount,
      paymentMethod,
      deliveryAddress,
      notes,
      status: 'Pending', // Set to pending for processing
      paymentStatus: 'Paid'
    };

    console.log('Creating purchase with data:', JSON.stringify(purchaseData, null, 2));
    
    const purchase = new CustomerPurchase(purchaseData);
    await purchase.save();
    
    console.log('Purchase created successfully:', purchase._id);

    // IMMEDIATELY DECREMENT INVENTORY
    for (const item of processedItems) {
      const branchInventory = await BranchInventory.findOne({
        branchId: branch._id.toString(),
        name: item.itemName
      });

      if (branchInventory) {
        branchInventory.quantity -= item.quantity;
        await branchInventory.save();
      }
    }

    // Update branch current stock
    const totalBranchInventory = await BranchInventory.aggregate([
      { $match: { branchId: branch._id.toString() } },
      { $group: { _id: null, total: { $sum: '$quantity' } } }
    ]);

    const newCurrentStock = totalBranchInventory.length > 0 ? totalBranchInventory[0].total : 0;
    await Branch.findByIdAndUpdate(branch._id, { currentStock: newCurrentStock });

    res.status(201).json({
      success: true,
      message: 'Purchase completed successfully and inventory updated',
      purchase: purchase,
      branchCurrentStock: newCurrentStock
    });

  } catch (error) {
    console.error('Error creating purchase:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Error creating purchase',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Process a purchase (decrement inventory)
router.put('/:purchaseId/process', async (req, res) => {
  try {
    const { purchaseId } = req.params;
    const { processedBy } = req.body;

    // Find the purchase
    const purchase = await CustomerPurchase.findById(purchaseId);
    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: 'Purchase not found'
      });
    }

    if (purchase.status !== 'Pending') {
      return res.status(400).json({
        success: false,
        message: 'Purchase is not in pending status'
      });
    }

    // Get the branch
    const branch = await Branch.findById(purchase.branchId);
    if (!branch) {
      return res.status(404).json({
        success: false,
        message: 'Branch not found'
      });
    }

    // Process each item and decrement inventory
    for (const item of purchase.items) {
      const branchInventory = await BranchInventory.findOne({
        branchId: purchase.branchId,
        name: item.itemName
      });

      if (!branchInventory) {
        return res.status(400).json({
          success: false,
          message: `Item ${item.itemName} not found in branch inventory`
        });
      }

      // Check if sufficient quantity is still available
      if (branchInventory.quantity < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient quantity for ${item.itemName}. Available: ${branchInventory.quantity}, Required: ${item.quantity}`
        });
      }

      // Decrement the inventory
      branchInventory.quantity -= item.quantity;
      await branchInventory.save();
    }

    // Update purchase status
    purchase.status = 'Processing';
    purchase.processedBy = processedBy;
    purchase.processedDate = new Date();
    await purchase.save();

    // Update branch current stock
    const totalBranchInventory = await BranchInventory.aggregate([
      { $match: { branchId: purchase.branchId } },
      { $group: { _id: null, total: { $sum: '$quantity' } } }
    ]);

    const newCurrentStock = totalBranchInventory.length > 0 ? totalBranchInventory[0].total : 0;
    await Branch.findByIdAndUpdate(purchase.branchId, { currentStock: newCurrentStock });

    res.status(200).json({
      success: true,
      message: 'Purchase processed successfully and inventory updated',
      purchase: purchase,
      branchCurrentStock: newCurrentStock
    });

  } catch (error) {
    console.error('Error processing purchase:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing purchase',
      error: error.message
    });
  }
});

// Complete a purchase
router.put('/:purchaseId/complete', async (req, res) => {
  try {
    const { purchaseId } = req.params;

    const purchase = await CustomerPurchase.findById(purchaseId);
    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: 'Purchase not found'
      });
    }

    if (purchase.status !== 'Processing') {
      return res.status(400).json({
        success: false,
        message: 'Purchase is not in processing status'
      });
    }

    purchase.status = 'Completed';
    purchase.paymentStatus = 'Paid';
    await purchase.save();

    res.status(200).json({
      success: true,
      message: 'Purchase completed successfully',
      purchase: purchase
    });

  } catch (error) {
    console.error('Error completing purchase:', error);
    res.status(500).json({
      success: false,
      message: 'Error completing purchase',
      error: error.message
    });
  }
});

// Get all purchases
router.get('/', async (req, res) => {
  try {
    const purchases = await CustomerPurchase.find()
      .populate('customerId', 'name email phone')
      .populate('processedBy', 'name email')
      .sort({ purchaseDate: -1 });

    res.status(200).json({
      success: true,
      purchases: purchases
    });

  } catch (error) {
    console.error('Error fetching purchases:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching purchases',
      error: error.message
    });
  }
});

// Get purchases by customer
router.get('/customer/:customerId', async (req, res) => {
  try {
    const { customerId } = req.params;

    const purchases = await CustomerPurchase.find({ customerId })
      .populate('customerId', 'name email phone')
      .populate('processedBy', 'name email')
      .sort({ purchaseDate: -1 });

    res.status(200).json({
      success: true,
      purchases: purchases
    });

  } catch (error) {
    console.error('Error fetching customer purchases:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching customer purchases',
      error: error.message
    });
  }
});

// Get purchase by ID
router.get('/:purchaseId', async (req, res) => {
  try {
    const { purchaseId } = req.params;

    const purchase = await CustomerPurchase.findById(purchaseId)
      .populate('customerId', 'name email phone')
      .populate('processedBy', 'name email');

    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: 'Purchase not found'
      });
    }

    res.status(200).json({
      success: true,
      purchase: purchase
    });

  } catch (error) {
    console.error('Error fetching purchase:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching purchase',
      error: error.message
    });
  }
});

// Get branch inventory
router.get('/branch/inventory', async (req, res) => {
  try {
    const branch = await Branch.findOne({ status: 'Active' });
    if (!branch) {
      return res.status(404).json({
        success: false,
        message: 'No active branch found'
      });
    }

    const inventory = await BranchInventory.find({ branchId: branch._id.toString() })
      .sort({ name: 1 });

    // If no inventory items found, return empty array
    if (inventory.length === 0) {
      return res.status(200).json({
        success: true,
        branch: {
          id: branch._id,
          name: branch.name,
          location: branch.location,
          currentStock: branch.currentStock
        },
        inventory: []
      });
    }

    res.status(200).json({
      success: true,
      branch: {
        id: branch._id,
        name: branch.name,
        location: branch.location,
        currentStock: branch.currentStock
      },
      inventory: inventory
    });

  } catch (error) {
    console.error('Error fetching branch inventory:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching branch inventory',
      error: error.message
    });
  }
});

// Get purchase statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const branch = await Branch.findOne({ status: 'Active' });
    if (!branch) {
      return res.status(404).json({
        success: false,
        message: 'No active branch found'
      });
    }

    const stats = await CustomerPurchase.aggregate([
      {
        $group: {
          _id: null,
          totalPurchases: { $sum: 1 },
          totalRevenue: { $sum: '$totalAmount' },
          pendingPurchases: { $sum: { $cond: [{ $eq: ['$status', 'Pending'] }, 1, 0] } },
          processingPurchases: { $sum: { $cond: [{ $eq: ['$status', 'Processing'] }, 1, 0] } },
          completedPurchases: { $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] } },
          totalItemsSold: { $sum: '$totalQuantity' }
        }
      }
    ]);

    const inventoryStats = await BranchInventory.aggregate([
      { $match: { branchId: branch._id.toString() } },
      {
        $group: {
          _id: null,
          totalItems: { $sum: 1 },
          totalQuantity: { $sum: '$quantity' },
          lowStockItems: { $sum: { $cond: [{ $eq: ['$status', 'Low Stock'] }, 1, 0] } },
          outOfStockItems: { $sum: { $cond: [{ $eq: ['$status', 'Out of Stock'] }, 1, 0] } }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      branch: {
        id: branch._id,
        name: branch.name,
        location: branch.location,
        currentStock: branch.currentStock
      },
      purchaseStats: stats[0] || {
        totalPurchases: 0,
        totalRevenue: 0,
        pendingPurchases: 0,
        processingPurchases: 0,
        completedPurchases: 0,
        totalItemsSold: 0
      },
      inventoryStats: inventoryStats[0] || {
        totalItems: 0,
        totalQuantity: 0,
        lowStockItems: 0,
        outOfStockItems: 0
      }
    });

  } catch (error) {
    console.error('Error fetching purchase statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching purchase statistics',
      error: error.message
    });
  }
});

// Get individual product details by name
router.get('/product/:productName', async (req, res) => {
  try {
    const { productName } = req.params;
    
    const branch = await Branch.findOne({ status: 'Active' });
    if (!branch) {
      return res.status(404).json({
        success: false,
        message: 'No active branch found'
      });
    }

    const product = await BranchInventory.findOne({
      branchId: branch._id.toString(),
      name: productName
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.status(200).json({
      success: true,
      product: product
    });

  } catch (error) {
    console.error('Error fetching product details:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching product details',
      error: error.message
    });
  }
});

// Get all products with full details
router.get('/products/all', async (req, res) => {
  try {
    const branch = await Branch.findOne({ status: 'Active' });
    if (!branch) {
      return res.status(404).json({
        success: false,
        message: 'No active branch found'
      });
    }

    const products = await BranchInventory.find({ branchId: branch._id.toString() })
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      products: products
    });

  } catch (error) {
    console.error('Error fetching all products:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching all products',
      error: error.message
    });
  }
});

// Get purchases by branch for branch manager
router.get('/branch/:branchName', async (req, res) => {
  try {
    const { branchName } = req.params;

    const purchases = await CustomerPurchase.find({ branchName })
      .populate('assignedDriver', 'name email phone driverStatus')
      .sort({ purchaseDate: -1 });

    res.status(200).json({
      success: true,
      purchases: purchases
    });

  } catch (error) {
    console.error('Error fetching branch purchases:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching branch purchases',
      error: error.message
    });
  }
});

// Assign driver to a purchase
router.put('/:purchaseId/assign-driver', async (req, res) => {
  try {
    const { purchaseId } = req.params;
    const { driverId } = req.body;

    // Find the purchase
    const purchase = await CustomerPurchase.findById(purchaseId);
    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: 'Purchase not found'
      });
    }

    // Find the driver
    const driver = await User.findById(driverId);
    if (!driver || driver.role !== 'Driver') {
      return res.status(404).json({
        success: false,
        message: 'Driver not found'
      });
    }

    // Check if driver is available
    if (driver.driverStatus !== 'Available') {
      return res.status(400).json({
        success: false,
        message: 'Driver is not available'
      });
    }

    // Update purchase
    purchase.assignedDriver = driverId;
    purchase.assignedDate = new Date();
    purchase.status = 'Assigned';
    await purchase.save();

    // Update driver status to On Delivery
    driver.driverStatus = 'On Delivery';
    await driver.save();

    // Populate the response
    await purchase.populate('assignedDriver', 'name email phone driverStatus');

    res.status(200).json({
      success: true,
      message: 'Driver assigned successfully',
      purchase: purchase
    });

  } catch (error) {
    console.error('Error assigning driver:', error);
    res.status(500).json({
      success: false,
      message: 'Error assigning driver',
      error: error.message
    });
  }
});

// Start delivery (driver starts delivery)
router.put('/:purchaseId/start-delivery', async (req, res) => {
  try {
    const { purchaseId } = req.params;

    const purchase = await CustomerPurchase.findById(purchaseId);
    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: 'Purchase not found'
      });
    }

    if (purchase.status !== 'Assigned') {
      return res.status(400).json({
        success: false,
        message: 'Purchase is not assigned to a driver'
      });
    }

    purchase.status = 'On Delivery';
    purchase.deliveryStartTime = new Date();
    await purchase.save();

    res.status(200).json({
      success: true,
      message: 'Delivery started',
      purchase: purchase
    });

  } catch (error) {
    console.error('Error starting delivery:', error);
    res.status(500).json({
      success: false,
      message: 'Error starting delivery',
      error: error.message
    });
  }
});

// Complete delivery
router.put('/:purchaseId/complete-delivery', async (req, res) => {
  try {
    const { purchaseId } = req.params;
    const { deliveryNotes } = req.body;

    const purchase = await CustomerPurchase.findById(purchaseId);
    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: 'Purchase not found'
      });
    }

    if (purchase.status !== 'On Delivery') {
      return res.status(400).json({
        success: false,
        message: 'Purchase is not on delivery'
      });
    }

    // Update purchase
    purchase.status = 'Delivered';
    purchase.deliveryEndTime = new Date();
    purchase.deliveryNotes = deliveryNotes || '';
    await purchase.save();

    // Update driver status back to Available
    if (purchase.assignedDriver) {
      const driver = await User.findById(purchase.assignedDriver);
      if (driver) {
        driver.driverStatus = 'Available';
        await driver.save();
      }
    }

    res.status(200).json({
      success: true,
      message: 'Delivery completed successfully',
      purchase: purchase
    });

  } catch (error) {
    console.error('Error completing delivery:', error);
    res.status(500).json({
      success: false,
      message: 'Error completing delivery',
      error: error.message
    });
  }
});

// Get driver's assigned deliveries
router.get('/driver/:driverId/deliveries', async (req, res) => {
  try {
    const { driverId } = req.params;

    const deliveries = await CustomerPurchase.find({ 
      assignedDriver: driverId,
      status: { $in: ['Assigned', 'On Delivery'] }
    })
    .populate('assignedDriver', 'name email phone')
    .sort({ assignedDate: -1 });

    res.status(200).json({
      success: true,
      deliveries: deliveries
    });

  } catch (error) {
    console.error('Error fetching driver deliveries:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching driver deliveries',
      error: error.message
    });
  }
});

// Get completed deliveries for a driver (for delivery logs)
router.get('/driver/:driverId/completed-deliveries', async (req, res) => {
  try {
    const { driverId } = req.params;
    const { month, year } = req.query;

    let query = { 
      assignedDriver: driverId,
      status: 'Delivered'
    };

    // If month and year are provided, filter by date
    if (month && year) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);
      
      query.deliveryEndTime = {
        $gte: startDate,
        $lte: endDate
      };
    }

    const completedDeliveries = await CustomerPurchase.find(query)
      .populate('assignedDriver', 'name email phone')
      .sort({ deliveryEndTime: -1 });

    // Calculate statistics
    const totalDeliveries = completedDeliveries.length;
    const totalAmount = completedDeliveries.reduce((sum, delivery) => sum + (delivery.totalAmount || 0), 0);
    
    // Group by date for daily statistics
    const dailyStats = {};
    completedDeliveries.forEach(delivery => {
      if (delivery.deliveryEndTime) {
        const date = delivery.deliveryEndTime.toISOString().split('T')[0];
        if (!dailyStats[date]) {
          dailyStats[date] = {
            date,
            deliveries: 0,
            completed: 0,
            totalAmount: 0
          };
        }
        dailyStats[date].deliveries++;
        dailyStats[date].completed++;
        dailyStats[date].totalAmount += delivery.totalAmount || 0;
      }
    });

    const dailyLogs = Object.values(dailyStats).sort((a, b) => new Date(b.date) - new Date(a.date));

    res.status(200).json({
      success: true,
      deliveries: completedDeliveries,
      statistics: {
        totalDeliveries,
        totalAmount,
        dailyLogs
      }
    });

  } catch (error) {
    console.error('Error fetching completed deliveries:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching completed deliveries',
      error: error.message
    });
  }
});

module.exports = router;
