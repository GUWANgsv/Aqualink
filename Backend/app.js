const express = require("express");
const { default: mongoose } = require("mongoose");
const cors = require("cors");

// Import routes
const userRouter = require("./Route/UserRoute");
const inventoryRouter = require("./Route/InventoryRoute");
const orderRouter = require("./Route/OrderRoute");
const branchOrderRouter = require("./Route/BranchOrderRoute");
const branchInventoryRouter = require("./Route/BranchInventoryRoute");
const recyclingBinRouter = require("./Route/RecyclingBinRoute");
const recyclingRequestRouter = require("./Route/RecyclingRequestRoute");
const driverRouter = require("./Route/DriverRoute");
const deliveryRouter = require("./Route/DeliveryRoute");
const customerPurchaseRouter = require("./Route/CustomerPurchaseRoute");
const factoryRequestRouter = require("./Route/FactoryRequestRoute");
const emergencyRequestRouter = require("./Routes/emergencyRequestRoutes");
const branchRouter = require("./Routes/branchRoutes");
const adminUserRouter = require("./Routes/userRoutes");
const employeeRouter = require("./Routes/employeeRoutes");

// Import middleware
const { authenticateToken, requireFactoryManager, requireBranchManager } = require("./Middleware/authMiddleware");

const app = express();

// middleware
app.use(express.json());
app.use(cors());

// Public routes (no authentication required)
app.use("/auth", userRouter);

// Protected routes with role-based access control
// Factory Manager routes
app.use("/Inventory", authenticateToken, requireFactoryManager, inventoryRouter);
app.use("/Orders", authenticateToken, requireFactoryManager, orderRouter);
app.use("/Delivery", authenticateToken, requireFactoryManager, deliveryRouter);

// Factory Manager specific routes (must come before router middleware)
app.get("/RecyclingBins/factory-notification", authenticateToken, async (req, res) => {
  try {
    const RecyclingBin = require("./Model/RecyclingBinModel");
    const bins = await RecyclingBin.find({ 
      status: 'Full',
      notificationSent: false 
    }).populate('branchId', 'name location');
    
    res.status(200).json({
      success: true,
      bins: bins
    });
  } catch (error) {
    console.error('Error fetching factory notification bins:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching factory notification bins',
      error: error.message
    });
  }
});

// Branch Manager routes
app.use("/BranchOrders", authenticateToken, requireBranchManager, branchOrderRouter);
app.use("/BranchInventory", authenticateToken, requireBranchManager, branchInventoryRouter);
app.use("/RecyclingBins", authenticateToken, requireBranchManager, recyclingBinRouter);
app.use("/RecyclingRequests", authenticateToken, recyclingRequestRouter);
app.use("/Drivers", authenticateToken, requireBranchManager, driverRouter);
app.use("/CustomerPurchases", customerPurchaseRouter);
app.use("/FactoryRequests", factoryRequestRouter);

// Admin routes
app.use("/emergency-requests", emergencyRequestRouter);
app.use("/branches", branchRouter);
app.use("/users", adminUserRouter);
app.use("/employees", employeeRouter);

// Add missing endpoints for Admin Dashboard
app.get("/Users", authenticateToken, async (req, res) => {
  try {
    const User = require("./Model/UserModel");
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      users: users
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: error.message
    });
  }
});

// Add missing endpoints for Factory Manager Dashboard

// Add missing endpoints for Branch Manager functions
app.get("/RecyclingBins/branch/:branchId", authenticateToken, async (req, res) => {
  try {
    const RecyclingBin = require("./Model/RecyclingBinModel");
    const bins = await RecyclingBin.find({ branchId: req.params.branchId })
      .populate('branchId', 'name location');
    
    res.status(200).json({
      success: true,
      bins: bins
    });
  } catch (error) {
    console.error('Error fetching branch recycling bins:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching branch recycling bins',
      error: error.message
    });
  }
});

app.get("/RecyclingRequests/branch/:branchId", authenticateToken, async (req, res) => {
  try {
    const RecyclingRequest = require("./Model/RecyclingRequestModel");
    const requests = await RecyclingRequest.find({ branchId: req.params.branchId })
      .populate('customerId', 'name email')
      .populate('branchId', 'name location')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      requests: requests
    });
  } catch (error) {
    console.error('Error fetching branch recycling requests:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching branch recycling requests',
      error: error.message
    });
  }
});

// Add missing endpoints for Reports and Analytics
app.get("/Orders/monthly-data", authenticateToken, async (req, res) => {
  try {
    const Order = require("./Model/OrderModel");
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    // Get orders for current month
    const monthlyOrders = await Order.find({
      createdAt: {
        $gte: new Date(currentYear, currentMonth, 1),
        $lt: new Date(currentYear, currentMonth + 1, 1)
      }
    });
    
    // Calculate monthly statistics
    const monthlyStats = {
      totalOrders: monthlyOrders.length,
      completedOrders: monthlyOrders.filter(order => order.status === 'Completed').length,
      pendingOrders: monthlyOrders.filter(order => order.status === 'Pending').length,
      totalQuantity: monthlyOrders.reduce((sum, order) => sum + (order.quantity || 0), 0),
      totalValue: monthlyOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0)
    };
    
    res.status(200).json({
      success: true,
      monthlyData: monthlyStats,
      orders: monthlyOrders
    });
  } catch (error) {
    console.error('Error fetching monthly orders data:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching monthly orders data',
      error: error.message
    });
  }
});

// Add missing endpoints for Delivery system
app.get("/Delivery/stats", authenticateToken, async (req, res) => {
  try {
    const Order = require("./Model/OrderModel");
    const Delivery = require("./Model/DeliveryModel");
    
    // Get delivery statistics
    const totalDeliveries = await Delivery.countDocuments();
    const completedDeliveries = await Delivery.countDocuments({ status: 'Completed' });
    const pendingDeliveries = await Delivery.countDocuments({ status: 'Pending' });
    const inProgressDeliveries = await Delivery.countDocuments({ status: 'In Progress' });
    
    // Get recent deliveries
    const recentDeliveries = await Delivery.find()
      .populate('orderId', 'orderNumber customerName')
      .sort({ createdAt: -1 })
      .limit(5);
    
    const deliveryStats = {
      totalDeliveries,
      completedDeliveries,
      pendingDeliveries,
      inProgressDeliveries,
      completionRate: totalDeliveries > 0 ? (completedDeliveries / totalDeliveries * 100).toFixed(1) : 0
    };
    
    res.status(200).json({
      success: true,
      stats: deliveryStats,
      recentDeliveries: recentDeliveries
    });
  } catch (error) {
    console.error('Error fetching delivery stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching delivery stats',
      error: error.message
    });
  }
});

// Add missing endpoints for Recycling system
app.get("/RecyclingRequests/statistics", authenticateToken, async (req, res) => {
  try {
    const RecyclingRequest = require("./Model/RecyclingRequestModel");
    
    // Get recycling statistics
    const totalRequests = await RecyclingRequest.countDocuments();
    const pendingRequests = await RecyclingRequest.countDocuments({ status: 'Pending' });
    const approvedRequests = await RecyclingRequest.countDocuments({ status: 'Approved' });
    const completedRequests = await RecyclingRequest.countDocuments({ status: 'Completed' });
    const rejectedRequests = await RecyclingRequest.countDocuments({ status: 'Rejected' });
    
    // Calculate total weight and points
    const allRequests = await RecyclingRequest.find({ status: 'Completed' });
    const totalWeight = allRequests.reduce((sum, request) => sum + (request.wasteWeight || 0), 0);
    const totalPoints = allRequests.reduce((sum, request) => sum + (request.pointsEarned || 0), 0);
    
    const statistics = {
      totalRequests,
      pendingRequests,
      approvedRequests,
      completedRequests,
      rejectedRequests,
      totalWeight,
      totalPoints,
      completionRate: totalRequests > 0 ? (completedRequests / totalRequests * 100).toFixed(1) : 0
    };
    
    res.status(200).json({
      success: true,
      statistics: statistics
    });
  } catch (error) {
    console.error('Error fetching recycling statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching recycling statistics',
      error: error.message
    });
  }
});

app.get("/RecyclingRequests/pending", authenticateToken, async (req, res) => {
  try {
    const RecyclingRequest = require("./Model/RecyclingRequestModel");
    const requests = await RecyclingRequest.find({ status: 'Pending' })
      .populate('customerId', 'name email')
      .populate('branchId', 'name location')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      requests: requests
    });
  } catch (error) {
    console.error('Error fetching pending recycling requests:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching pending recycling requests',
      error: error.message
    });
  }
});

// Add missing endpoints for Inventory management
app.get("/Inventory/stats/overview", authenticateToken, async (req, res) => {
  try {
    const Inventory = require("./Model/InventoryModel");
    
    // Get inventory statistics
    const totalItems = await Inventory.countDocuments();
    const lowStockItems = await Inventory.countDocuments({ status: 'Low Stock' });
    const outOfStockItems = await Inventory.countDocuments({ status: 'Out of Stock' });
    const inStockItems = await Inventory.countDocuments({ status: 'In Stock' });
    
    // Calculate total quantity
    const allItems = await Inventory.find();
    const totalQuantity = allItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
    
    const stats = {
      totalItems,
      lowStockItems,
      outOfStockItems,
      inStockItems,
      totalQuantity
    };
    
    res.status(200).json({
      success: true,
      stats: stats
    });
  } catch (error) {
    console.error('Error fetching inventory stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching inventory stats',
      error: error.message
    });
  }
});

// Add missing endpoints for Orders management
app.get("/Orders/stats/overview", authenticateToken, async (req, res) => {
  try {
    const Order = require("./Model/OrderModel");
    
    // Get order statistics
    const totalOrders = await Order.countDocuments();
    const pendingOrders = await Order.countDocuments({ status: 'Pending' });
    const completedOrders = await Order.countDocuments({ status: 'Completed' });
    const inProgressOrders = await Order.countDocuments({ status: 'In Progress' });
    const cancelledOrders = await Order.countDocuments({ status: 'Cancelled' });
    
    // Calculate total value
    const allOrders = await Order.find();
    const totalValue = allOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    
    const stats = {
      totalOrders,
      pendingOrders,
      completedOrders,
      inProgressOrders,
      cancelledOrders,
      totalValue,
      completionRate: totalOrders > 0 ? (completedOrders / totalOrders * 100).toFixed(1) : 0
    };
    
    res.status(200).json({
      success: true,
      stats: stats
    });
  } catch (error) {
    console.error('Error fetching order stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching order stats',
      error: error.message
    });
  }
});

app.get("/Orders/activities/recent", authenticateToken, async (req, res) => {
  try {
    const Order = require("./Model/OrderModel");
    const recentActivities = await Order.find()
      .populate('customerId', 'name email')
      .sort({ updatedAt: -1 })
      .limit(10);
    
    res.status(200).json({
      success: true,
      activities: recentActivities
    });
  } catch (error) {
    console.error('Error fetching recent order activities:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching recent order activities',
      error: error.message
    });
  }
});

// Add missing endpoints for User management
app.get("/Users/stats", authenticateToken, async (req, res) => {
  try {
    const User = require("./Model/UserModel");
    
    // Get user statistics
    const totalUsers = await User.countDocuments();
    const adminUsers = await User.countDocuments({ role: 'Admin' });
    const factoryManagerUsers = await User.countDocuments({ role: 'Factory Manager' });
    const branchManagerUsers = await User.countDocuments({ role: 'Branch Manager' });
    const driverUsers = await User.countDocuments({ role: 'Driver' });
    const customerUsers = await User.countDocuments({ role: 'Customer' });
    const fireBrigadeUsers = await User.countDocuments({ role: 'Fire Brigade' });
    
    const stats = {
      totalUsers,
      adminUsers,
      factoryManagerUsers,
      branchManagerUsers,
      driverUsers,
      customerUsers,
      fireBrigadeUsers
    };
    
    res.status(200).json({
      success: true,
      stats: stats
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user stats',
      error: error.message
    });
  }
});

// Add missing endpoints for Branch Manager functions
app.get("/BranchOrders/branch/:branchId", authenticateToken, async (req, res) => {
  try {
    const BranchOrder = require("./Model/BranchOrderModel");
    const orders = await BranchOrder.find({ branchId: req.params.branchId })
      .populate('branchId', 'name location')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      orders: orders
    });
  } catch (error) {
    console.error('Error fetching branch orders:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching branch orders',
      error: error.message
    });
  }
});

app.post("/BranchOrders", authenticateToken, async (req, res) => {
  try {
    const BranchOrder = require("./Model/BranchOrderModel");
    const newOrder = new BranchOrder(req.body);
    await newOrder.save();
    
    res.status(201).json({
      success: true,
      message: 'Branch order created successfully',
      order: newOrder
    });
  } catch (error) {
    console.error('Error creating branch order:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating branch order',
      error: error.message
    });
  }
});

// Add missing endpoints for Recycling system
app.put("/RecyclingBins/:binId/empty", authenticateToken, async (req, res) => {
  try {
    const RecyclingBin = require("./Model/RecyclingBinModel");
    const bin = await RecyclingBin.findByIdAndUpdate(
      req.params.binId,
      { 
        fillLevel: 0,
        status: 'Empty',
        lastEmptied: new Date()
      },
      { new: true }
    );
    
    if (!bin) {
      return res.status(404).json({
        success: false,
        message: 'Recycling bin not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Recycling bin emptied successfully',
      bin: bin
    });
  } catch (error) {
    console.error('Error emptying recycling bin:', error);
    res.status(500).json({
      success: false,
      message: 'Error emptying recycling bin',
      error: error.message
    });
  }
});

app.put("/RecyclingRequests/:requestId/complete", authenticateToken, async (req, res) => {
  try {
    const RecyclingRequest = require("./Model/RecyclingRequestModel");
    const request = await RecyclingRequest.findByIdAndUpdate(
      req.params.requestId,
      { 
        status: 'Completed',
        completedAt: new Date()
      },
      { new: true }
    );
    
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Recycling request not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Recycling request completed successfully',
      request: request
    });
  } catch (error) {
    console.error('Error completing recycling request:', error);
    res.status(500).json({
      success: false,
      message: 'Error completing recycling request',
      error: error.message
    });
  }
});

// Add missing endpoints for Inventory management
app.get("/Inventory/init", authenticateToken, async (req, res) => {
  try {
    const Inventory = require("./Model/InventoryModel");
    
    // Check if inventory already exists
    const existingInventory = await Inventory.countDocuments();
    if (existingInventory > 0) {
      return res.status(200).json({
        success: true,
        message: 'Inventory already initialized',
        count: existingInventory
      });
    }
    
    // Initialize sample inventory data
    const sampleItems = [
      { name: 'RO Membranes', quantity: 50, minQuantity: 10, status: 'In Stock' },
      { name: 'Mud-filters', quantity: 30, minQuantity: 5, status: 'In Stock' },
      { name: 'Mineral Cartridge', quantity: 25, minQuantity: 8, status: 'In Stock' },
      { name: 'UV Cartridge', quantity: 20, minQuantity: 5, status: 'In Stock' },
      { name: 'Water Pumps', quantity: 15, minQuantity: 3, status: 'In Stock' },
      { name: '5L Water Bottles', quantity: 100, minQuantity: 20, status: 'In Stock' },
      { name: '10L Water Bottles', quantity: 80, minQuantity: 15, status: 'In Stock' },
      { name: '20L Water Bottles', quantity: 60, minQuantity: 10, status: 'In Stock' }
    ];
    
    await Inventory.insertMany(sampleItems);
    
    res.status(200).json({
      success: true,
      message: 'Sample inventory data initialized successfully',
      count: sampleItems.length
    });
  } catch (error) {
    console.error('Error initializing inventory:', error);
    res.status(500).json({
      success: false,
      message: 'Error initializing inventory',
      error: error.message
    });
  }
});

// Add missing endpoints for Orders management
app.get("/Orders/pending", authenticateToken, async (req, res) => {
  try {
    const Order = require("./Model/OrderModel");
    const pendingOrders = await Order.find({ status: 'Pending' })
      .populate('customerId', 'name email')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      orders: pendingOrders
    });
  } catch (error) {
    console.error('Error fetching pending orders:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching pending orders',
      error: error.message
    });
  }
});

// Add missing endpoints for Reports and Analytics
app.get("/Reports/inventory", authenticateToken, async (req, res) => {
  try {
    const Inventory = require("./Model/InventoryModel");
    const inventory = await Inventory.find().sort({ name: 1 });
    
    res.status(200).json({
      success: true,
      inventory: inventory
    });
  } catch (error) {
    console.error('Error fetching inventory report:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching inventory report',
      error: error.message
    });
  }
});

app.get("/Reports/orders", authenticateToken, async (req, res) => {
  try {
    const Order = require("./Model/OrderModel");
    const orders = await Order.find()
      .populate('customerId', 'name email')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      orders: orders
    });
  } catch (error) {
    console.error('Error fetching orders report:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching orders report',
      error: error.message
    });
  }
});

// Add missing endpoints for Delivery system
app.get("/Delivery/history", authenticateToken, async (req, res) => {
  try {
    const Delivery = require("./Model/DeliveryModel");
    const deliveries = await Delivery.find()
      .populate('orderId', 'orderNumber customerName')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      deliveries: deliveries
    });
  } catch (error) {
    console.error('Error fetching delivery history:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching delivery history',
      error: error.message
    });
  }
});

// Add missing endpoints for Recycling system
app.get("/RecyclingBins/statistics/:branchId", authenticateToken, async (req, res) => {
  try {
    const RecyclingBin = require("./Model/RecyclingBinModel");
    const bins = await RecyclingBin.find({ branchId: req.params.branchId });
    
    const stats = {
      totalBins: bins.length,
      fullBins: bins.filter(bin => bin.status === 'Full').length,
      emptyBins: bins.filter(bin => bin.status === 'Empty').length,
      partialBins: bins.filter(bin => bin.status === 'Partial').length,
      averageFillLevel: bins.length > 0 ? (bins.reduce((sum, bin) => sum + bin.fillLevel, 0) / bins.length).toFixed(1) : 0
    };
    
    res.status(200).json({
      success: true,
      stats: stats
    });
  } catch (error) {
    console.error('Error fetching recycling bin statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching recycling bin statistics',
      error: error.message
    });
  }
});

// Add missing endpoints for User management
app.get("/Users/roles", authenticateToken, async (req, res) => {
  try {
    const User = require("./Model/UserModel");
    const roles = await User.distinct('role');
    
    res.status(200).json({
      success: true,
      roles: roles
    });
  } catch (error) {
    console.error('Error fetching user roles:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user roles',
      error: error.message
    });
  }
});

app.get("/Users/active", authenticateToken, async (req, res) => {
  try {
    const User = require("./Model/UserModel");
    const activeUsers = await User.find({ status: 'Active' })
      .select('-password')
      .sort({ name: 1 });
    
    res.status(200).json({
      success: true,
      users: activeUsers
    });
  } catch (error) {
    console.error('Error fetching active users:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching active users',
      error: error.message
    });
  }
});

// Add missing endpoints for Branch Manager functions
app.get("/BranchOrders/statistics/:branchId", authenticateToken, async (req, res) => {
  try {
    const BranchOrder = require("./Model/BranchOrderModel");
    const orders = await BranchOrder.find({ branchId: req.params.branchId });
    
    const stats = {
      totalOrders: orders.length,
      pendingOrders: orders.filter(order => order.status === 'Pending').length,
      completedOrders: orders.filter(order => order.status === 'Completed').length,
      inProgressOrders: orders.filter(order => order.status === 'In Progress').length,
      cancelledOrders: orders.filter(order => order.status === 'Cancelled').length
    };
    
    res.status(200).json({
      success: true,
      stats: stats
    });
  } catch (error) {
    console.error('Error fetching branch order statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching branch order statistics',
      error: error.message
    });
  }
});

// Add missing endpoints for Factory Manager Dashboard
app.get("/Factory/dashboard", authenticateToken, async (req, res) => {
  try {
    const Inventory = require("./Model/InventoryModel");
    const Order = require("./Model/OrderModel");
    const RecyclingRequest = require("./Model/RecyclingRequestModel");
    const RecyclingBin = require("./Model/RecyclingBinModel");
    
    // Get factory dashboard data
    const inventoryStats = await Inventory.aggregate([
      {
        $group: {
          _id: null,
          totalItems: { $sum: 1 },
          totalQuantity: { $sum: "$quantity" },
          lowStockItems: { $sum: { $cond: [{ $eq: ["$status", "Low Stock"] }, 1, 0] } },
          outOfStockItems: { $sum: { $cond: [{ $eq: ["$status", "Out of Stock"] }, 1, 0] } }
        }
      }
    ]);
    
    const orderStats = await Order.aggregate([
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          pendingOrders: { $sum: { $cond: [{ $eq: ["$status", "Pending"] }, 1, 0] } },
          completedOrders: { $sum: { $cond: [{ $eq: ["$status", "Completed"] }, 1, 0] } }
        }
      }
    ]);
    
    const recyclingStats = await RecyclingRequest.aggregate([
      {
        $group: {
          _id: null,
          totalRequests: { $sum: 1 },
          pendingRequests: { $sum: { $cond: [{ $eq: ["$status", "Pending"] }, 1, 0] } },
          completedRequests: { $sum: { $cond: [{ $eq: ["$status", "Completed"] }, 1, 0] } }
        }
      }
    ]);
    
    const dashboardData = {
      inventory: inventoryStats[0] || { totalItems: 0, totalQuantity: 0, lowStockItems: 0, outOfStockItems: 0 },
      orders: orderStats[0] || { totalOrders: 0, pendingOrders: 0, completedOrders: 0 },
      recycling: recyclingStats[0] || { totalRequests: 0, pendingRequests: 0, completedRequests: 0 }
    };
    
    res.status(200).json({
      success: true,
      dashboard: dashboardData
    });
  } catch (error) {
    console.error('Error fetching factory dashboard data:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching factory dashboard data',
      error: error.message
    });
  }
});

// Add missing endpoints for Admin Dashboard
app.get("/Admin/dashboard", authenticateToken, async (req, res) => {
  try {
    const User = require("./Model/UserModel");
    const Order = require("./Model/OrderModel");
    const RecyclingRequest = require("./Model/RecyclingRequestModel");
    const Branch = require("./Model/BranchModel");
    
    // Get admin dashboard data
    const userStats = await User.aggregate([
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          adminUsers: { $sum: { $cond: [{ $eq: ["$role", "Admin"] }, 1, 0] } },
          factoryManagerUsers: { $sum: { $cond: [{ $eq: ["$role", "Factory Manager"] }, 1, 0] } },
          branchManagerUsers: { $sum: { $cond: [{ $eq: ["$role", "Branch Manager"] }, 1, 0] } },
          driverUsers: { $sum: { $cond: [{ $eq: ["$role", "Driver"] }, 1, 0] } },
          customerUsers: { $sum: { $cond: [{ $eq: ["$role", "Customer"] }, 1, 0] } },
          fireBrigadeUsers: { $sum: { $cond: [{ $eq: ["$role", "Fire Brigade"] }, 1, 0] } }
        }
      }
    ]);
    
    const orderStats = await Order.aggregate([
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          pendingOrders: { $sum: { $cond: [{ $eq: ["$status", "Pending"] }, 1, 0] } },
          completedOrders: { $sum: { $cond: [{ $eq: ["$status", "Completed"] }, 1, 0] } }
        }
      }
    ]);
    
    const recyclingStats = await RecyclingRequest.aggregate([
      {
        $group: {
          _id: null,
          totalRequests: { $sum: 1 },
          pendingRequests: { $sum: { $cond: [{ $eq: ["$status", "Pending"] }, 1, 0] } },
          completedRequests: { $sum: { $cond: [{ $eq: ["$status", "Completed"] }, 1, 0] } }
        }
      }
    ]);
    
    const branchStats = await Branch.aggregate([
      {
        $group: {
          _id: null,
          totalBranches: { $sum: 1 },
          activeBranches: { $sum: { $cond: [{ $eq: ["$status", "Active"] }, 1, 0] } },
          inactiveBranches: { $sum: { $cond: [{ $eq: ["$status", "Inactive"] }, 1, 0] } }
        }
      }
    ]);
    
    const dashboardData = {
      users: userStats[0] || { totalUsers: 0, adminUsers: 0, factoryManagerUsers: 0, branchManagerUsers: 0, driverUsers: 0, customerUsers: 0, fireBrigadeUsers: 0 },
      orders: orderStats[0] || { totalOrders: 0, pendingOrders: 0, completedOrders: 0 },
      recycling: recyclingStats[0] || { totalRequests: 0, pendingRequests: 0, completedRequests: 0 },
      branches: branchStats[0] || { totalBranches: 0, activeBranches: 0, inactiveBranches: 0 }
    };
    
    res.status(200).json({
      success: true,
      dashboard: dashboardData
    });
  } catch (error) {
    console.error('Error fetching admin dashboard data:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching admin dashboard data',
      error: error.message
    });
  }
});

// Add missing endpoints for Customer functions
app.get("/Customer/dashboard/:customerId", authenticateToken, async (req, res) => {
  try {
    const RecyclingRequest = require("./Model/RecyclingRequestModel");
    const Order = require("./Model/OrderModel");
    
    // Get customer dashboard data
    const recyclingRequests = await RecyclingRequest.find({ customerId: req.params.customerId })
      .populate('branchId', 'name location')
      .sort({ createdAt: -1 });
    
    const orders = await Order.find({ customerId: req.params.customerId })
      .sort({ createdAt: -1 });
    
    const dashboardData = {
      recyclingRequests: recyclingRequests,
      orders: orders,
      totalRecyclingRequests: recyclingRequests.length,
      totalOrders: orders.length,
      pendingRecyclingRequests: recyclingRequests.filter(req => req.status === 'Pending').length,
      completedRecyclingRequests: recyclingRequests.filter(req => req.status === 'Completed').length,
      pendingOrders: orders.filter(order => order.status === 'Pending').length,
      completedOrders: orders.filter(order => order.status === 'Completed').length
    };
    
    res.status(200).json({
      success: true,
      dashboard: dashboardData
    });
  } catch (error) {
    console.error('Error fetching customer dashboard data:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching customer dashboard data',
      error: error.message
    });
  }
});

// Add missing endpoints for Reports and Analytics
app.get("/Reports/analytics", authenticateToken, async (req, res) => {
  try {
    const Inventory = require("./Model/InventoryModel");
    const Order = require("./Model/OrderModel");
    const RecyclingRequest = require("./Model/RecyclingRequestModel");
    const User = require("./Model/UserModel");
    
    // Get analytics data
    const inventoryAnalytics = await Inventory.aggregate([
      {
        $group: {
          _id: null,
          totalItems: { $sum: 1 },
          totalQuantity: { $sum: "$quantity" },
          lowStockItems: { $sum: { $cond: [{ $eq: ["$status", "Low Stock"] }, 1, 0] } },
          outOfStockItems: { $sum: { $cond: [{ $eq: ["$status", "Out of Stock"] }, 1, 0] } }
        }
      }
    ]);
    
    const orderAnalytics = await Order.aggregate([
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          pendingOrders: { $sum: { $cond: [{ $eq: ["$status", "Pending"] }, 1, 0] } },
          completedOrders: { $sum: { $cond: [{ $eq: ["$status", "Completed"] }, 1, 0] } },
          totalValue: { $sum: "$totalAmount" }
        }
      }
    ]);
    
    const recyclingAnalytics = await RecyclingRequest.aggregate([
      {
        $group: {
          _id: null,
          totalRequests: { $sum: 1 },
          pendingRequests: { $sum: { $cond: [{ $eq: ["$status", "Pending"] }, 1, 0] } },
          completedRequests: { $sum: { $cond: [{ $eq: ["$status", "Completed"] }, 1, 0] } },
          totalWeight: { $sum: "$wasteWeight" },
          totalPoints: { $sum: "$pointsEarned" }
        }
      }
    ]);
    
    const userAnalytics = await User.aggregate([
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          adminUsers: { $sum: { $cond: [{ $eq: ["$role", "Admin"] }, 1, 0] } },
          factoryManagerUsers: { $sum: { $cond: [{ $eq: ["$role", "Factory Manager"] }, 1, 0] } },
          branchManagerUsers: { $sum: { $cond: [{ $eq: ["$role", "Branch Manager"] }, 1, 0] } },
          driverUsers: { $sum: { $cond: [{ $eq: ["$role", "Driver"] }, 1, 0] } },
          customerUsers: { $sum: { $cond: [{ $eq: ["$role", "Customer"] }, 1, 0] } },
          fireBrigadeUsers: { $sum: { $cond: [{ $eq: ["$role", "Fire Brigade"] }, 1, 0] } }
        }
      }
    ]);
    
    const analyticsData = {
      inventory: inventoryAnalytics[0] || { totalItems: 0, totalQuantity: 0, lowStockItems: 0, outOfStockItems: 0 },
      orders: orderAnalytics[0] || { totalOrders: 0, pendingOrders: 0, completedOrders: 0, totalValue: 0 },
      recycling: recyclingAnalytics[0] || { totalRequests: 0, pendingRequests: 0, completedRequests: 0, totalWeight: 0, totalPoints: 0 },
      users: userAnalytics[0] || { totalUsers: 0, adminUsers: 0, factoryManagerUsers: 0, branchManagerUsers: 0, driverUsers: 0, customerUsers: 0, fireBrigadeUsers: 0 }
    };
    
    res.status(200).json({
      success: true,
      analytics: analyticsData
    });
  } catch (error) {
    console.error('Error fetching analytics data:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching analytics data',
      error: error.message
    });
  }
});

// Add missing endpoints for Delivery system
app.get("/Delivery/analytics", authenticateToken, async (req, res) => {
  try {
    const Delivery = require("./Model/DeliveryModel");
    const Order = require("./Model/OrderModel");
    
    // Get delivery analytics data
    const deliveryAnalytics = await Delivery.aggregate([
      {
        $group: {
          _id: null,
          totalDeliveries: { $sum: 1 },
          completedDeliveries: { $sum: { $cond: [{ $eq: ["$status", "Completed"] }, 1, 0] } },
          pendingDeliveries: { $sum: { $cond: [{ $eq: ["$status", "Pending"] }, 1, 0] } },
          inProgressDeliveries: { $sum: { $cond: [{ $eq: ["$status", "In Progress"] }, 1, 0] } }
        }
      }
    ]);
    
    const orderAnalytics = await Order.aggregate([
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          pendingOrders: { $sum: { $cond: [{ $eq: ["$status", "Pending"] }, 1, 0] } },
          completedOrders: { $sum: { $cond: [{ $eq: ["$status", "Completed"] }, 1, 0] } },
          totalValue: { $sum: "$totalAmount" }
        }
      }
    ]);
    
    const analyticsData = {
      delivery: deliveryAnalytics[0] || { totalDeliveries: 0, completedDeliveries: 0, pendingDeliveries: 0, inProgressDeliveries: 0 },
      orders: orderAnalytics[0] || { totalOrders: 0, pendingOrders: 0, completedOrders: 0, totalValue: 0 }
    };
    
    res.status(200).json({
      success: true,
      analytics: analyticsData
    });
  } catch (error) {
    console.error('Error fetching delivery analytics data:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching delivery analytics data',
      error: error.message
    });
  }
});

// Add missing endpoints for Recycling system
app.get("/RecyclingBins/analytics", authenticateToken, async (req, res) => {
  try {
    const RecyclingBin = require("./Model/RecyclingBinModel");
    const RecyclingRequest = require("./Model/RecyclingRequestModel");
    
    // Get recycling bin analytics data
    const binAnalytics = await RecyclingBin.aggregate([
      {
        $group: {
          _id: null,
          totalBins: { $sum: 1 },
          fullBins: { $sum: { $cond: [{ $eq: ["$status", "Full"] }, 1, 0] } },
          emptyBins: { $sum: { $cond: [{ $eq: ["$status", "Empty"] }, 1, 0] } },
          criticalBins: { $sum: { $cond: [{ $eq: ["$status", "Critical"] }, 1, 0] } }
        }
      }
    ]);
    
    const requestAnalytics = await RecyclingRequest.aggregate([
      {
        $group: {
          _id: null,
          totalRequests: { $sum: 1 },
          pendingRequests: { $sum: { $cond: [{ $eq: ["$status", "Pending"] }, 1, 0] } },
          completedRequests: { $sum: { $cond: [{ $eq: ["$status", "Completed"] }, 1, 0] } },
          totalWeight: { $sum: "$wasteWeight" },
          totalPoints: { $sum: "$pointsEarned" }
        }
      }
    ]);
    
    const analyticsData = {
      bins: binAnalytics[0] || { totalBins: 0, fullBins: 0, emptyBins: 0, criticalBins: 0 },
      requests: requestAnalytics[0] || { totalRequests: 0, pendingRequests: 0, completedRequests: 0, totalWeight: 0, totalPoints: 0 }
    };
    
    res.status(200).json({
      success: true,
      analytics: analyticsData
    });
  } catch (error) {
    console.error('Error fetching recycling analytics data:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching recycling analytics data',
      error: error.message
    });
  }
});

// Add missing endpoints for User management
app.get("/Users/analytics", authenticateToken, async (req, res) => {
  try {
    const User = require("./Model/UserModel");
    const Order = require("./Model/OrderModel");
    const RecyclingRequest = require("./Model/RecyclingRequestModel");
    
    // Get user analytics data
    const userAnalytics = await User.aggregate([
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          adminUsers: { $sum: { $cond: [{ $eq: ["$role", "Admin"] }, 1, 0] } },
          factoryManagerUsers: { $sum: { $cond: [{ $eq: ["$role", "Factory Manager"] }, 1, 0] } },
          branchManagerUsers: { $sum: { $cond: [{ $eq: ["$role", "Branch Manager"] }, 1, 0] } },
          driverUsers: { $sum: { $cond: [{ $eq: ["$role", "Driver"] }, 1, 0] } },
          customerUsers: { $sum: { $cond: [{ $eq: ["$role", "Customer"] }, 1, 0] } },
          fireBrigadeUsers: { $sum: { $cond: [{ $eq: ["$role", "Fire Brigade"] }, 1, 0] } }
        }
      }
    ]);
    
    const orderAnalytics = await Order.aggregate([
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          pendingOrders: { $sum: { $cond: [{ $eq: ["$status", "Pending"] }, 1, 0] } },
          completedOrders: { $sum: { $cond: [{ $eq: ["$status", "Completed"] }, 1, 0] } },
          totalValue: { $sum: "$totalAmount" }
        }
      }
    ]);
    
    const recyclingAnalytics = await RecyclingRequest.aggregate([
      {
        $group: {
          _id: null,
          totalRequests: { $sum: 1 },
          pendingRequests: { $sum: { $cond: [{ $eq: ["$status", "Pending"] }, 1, 0] } },
          completedRequests: { $sum: { $cond: [{ $eq: ["$status", "Completed"] }, 1, 0] } },
          totalWeight: { $sum: "$wasteWeight" },
          totalPoints: { $sum: "$pointsEarned" }
        }
      }
    ]);
    
    const analyticsData = {
      users: userAnalytics[0] || { totalUsers: 0, adminUsers: 0, factoryManagerUsers: 0, branchManagerUsers: 0, driverUsers: 0, customerUsers: 0, fireBrigadeUsers: 0 },
      orders: orderAnalytics[0] || { totalOrders: 0, pendingOrders: 0, completedOrders: 0, totalValue: 0 },
      recycling: recyclingAnalytics[0] || { totalRequests: 0, pendingRequests: 0, completedRequests: 0, totalWeight: 0, totalPoints: 0 }
    };
    
    res.status(200).json({
      success: true,
      analytics: analyticsData
    });
  } catch (error) {
    console.error('Error fetching user analytics data:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user analytics data',
      error: error.message
    });
  }
});

// Add missing endpoints for Branch Manager functions
app.get("/BranchManager/dashboard/:branchId", authenticateToken, async (req, res) => {
  try {
    const { branchId } = req.params;
    const BranchOrder = require("./Model/BranchOrderModel");
    const RecyclingBin = require("./Model/RecyclingBinModel");
    const RecyclingRequest = require("./Model/RecyclingRequestModel");
    const User = require("./Model/UserModel");
    
    // Get branch manager dashboard data
    const branchOrders = await BranchOrder.find({ branchId });
    const recyclingBins = await RecyclingBin.find({ branchId });
    const recyclingRequests = await RecyclingRequest.find({ branchId });
    const drivers = await User.find({ role: "Driver" });
    
    const dashboardData = {
      branchOrders: branchOrders.length,
      recyclingBins: recyclingBins.length,
      recyclingRequests: recyclingRequests.length,
      drivers: drivers.length,
      recentOrders: branchOrders.slice(-5),
      recentBins: recyclingBins.slice(-5),
      recentRequests: recyclingRequests.slice(-5)
    };
    
    res.status(200).json({
      success: true,
      dashboard: dashboardData
    });
  } catch (error) {
    console.error('Error fetching branch manager dashboard data:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching branch manager dashboard data',
      error: error.message
    });
  }
});

// Add missing endpoints for Factory Manager Dashboard
app.get("/FactoryManager/dashboard", authenticateToken, async (req, res) => {
  try {
    const Inventory = require("./Model/InventoryModel");
    const Order = require("./Model/OrderModel");
    const RecyclingRequest = require("./Model/RecyclingRequestModel");
    const User = require("./Model/UserModel");
    
    // Get factory manager dashboard data
    const inventory = await Inventory.find();
    const orders = await Order.find();
    const recyclingRequests = await RecyclingRequest.find();
    const users = await User.find();
    
    const dashboardData = {
      inventory: inventory.length,
      orders: orders.length,
      recyclingRequests: recyclingRequests.length,
      users: users.length,
      recentInventory: inventory.slice(-5),
      recentOrders: orders.slice(-5),
      recentRequests: recyclingRequests.slice(-5)
    };
    
    res.status(200).json({
      success: true,
      dashboard: dashboardData
    });
  } catch (error) {
    console.error('Error fetching factory manager dashboard data:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching factory manager dashboard data',
      error: error.message
    });
  }
});

// Add missing endpoints for Admin Dashboard
app.get("/Admin/dashboard", authenticateToken, async (req, res) => {
  try {
    const Inventory = require("./Model/InventoryModel");
    const Order = require("./Model/OrderModel");
    const RecyclingRequest = require("./Model/RecyclingRequestModel");
    const User = require("./Model/UserModel");
    const Branch = require("./Model/BranchModel");
    
    // Get admin dashboard data
    const inventory = await Inventory.find();
    const orders = await Order.find();
    const recyclingRequests = await RecyclingRequest.find();
    const users = await User.find();
    const branches = await Branch.find();
    
    const dashboardData = {
      inventory: inventory.length,
      orders: orders.length,
      recyclingRequests: recyclingRequests.length,
      users: users.length,
      branches: branches.length,
      recentInventory: inventory.slice(-5),
      recentOrders: orders.slice(-5),
      recentRequests: recyclingRequests.slice(-5),
      recentUsers: users.slice(-5),
      recentBranches: branches.slice(-5)
    };
    
    res.status(200).json({
      success: true,
      dashboard: dashboardData
    });
  } catch (error) {
    console.error('Error fetching admin dashboard data:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching admin dashboard data',
      error: error.message
    });
  }
});

// Add missing endpoints for Customer/MyAccount functions
app.get("/Customer/account/:customerId", authenticateToken, async (req, res) => {
  try {
    const { customerId } = req.params;
    const User = require("./Model/UserModel");
    const Order = require("./Model/OrderModel");
    const RecyclingRequest = require("./Model/RecyclingRequestModel");
    
    // Get customer account data
    const customer = await User.findById(customerId);
    const orders = await Order.find({ customerId });
    const recyclingRequests = await RecyclingRequest.find({ customerId });
    
    const accountData = {
      customer,
      orders: orders.length,
      recyclingRequests: recyclingRequests.length,
      recentOrders: orders.slice(-5),
      recentRequests: recyclingRequests.slice(-5)
    };
    
    res.status(200).json({
      success: true,
      account: accountData
    });
  } catch (error) {
    console.error('Error fetching customer account data:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching customer account data',
      error: error.message
    });
  }
});

// Add missing endpoints for Inventory management
app.get("/Inventory/analytics", authenticateToken, async (req, res) => {
  try {
    const Inventory = require("./Model/InventoryModel");
    const Order = require("./Model/OrderModel");
    
    // Get inventory analytics data
    const inventoryAnalytics = await Inventory.aggregate([
      {
        $group: {
          _id: null,
          totalItems: { $sum: 1 },
          totalQuantity: { $sum: "$quantity" },
          lowStockItems: { $sum: { $cond: [{ $eq: ["$status", "Low Stock"] }, 1, 0] } },
          outOfStockItems: { $sum: { $cond: [{ $eq: ["$status", "Out of Stock"] }, 1, 0] } }
        }
      }
    ]);
    
    const orderAnalytics = await Order.aggregate([
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          pendingOrders: { $sum: { $cond: [{ $eq: ["$status", "Pending"] }, 1, 0] } },
          completedOrders: { $sum: { $cond: [{ $eq: ["$status", "Completed"] }, 1, 0] } },
          totalValue: { $sum: "$totalAmount" }
        }
      }
    ]);
    
    const analyticsData = {
      inventory: inventoryAnalytics[0] || { totalItems: 0, totalQuantity: 0, lowStockItems: 0, outOfStockItems: 0 },
      orders: orderAnalytics[0] || { totalOrders: 0, pendingOrders: 0, completedOrders: 0, totalValue: 0 }
    };
    
    res.status(200).json({
      success: true,
      analytics: analyticsData
    });
  } catch (error) {
    console.error('Error fetching inventory analytics data:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching inventory analytics data',
      error: error.message
    });
  }
});

// Add missing endpoints for Orders management
app.get("/Orders/analytics", authenticateToken, async (req, res) => {
  try {
    const Order = require("./Model/OrderModel");
    const Inventory = require("./Model/InventoryModel");
    
    // Get orders analytics data
    const orderAnalytics = await Order.aggregate([
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          pendingOrders: { $sum: { $cond: [{ $eq: ["$status", "Pending"] }, 1, 0] } },
          completedOrders: { $sum: { $cond: [{ $eq: ["$status", "Completed"] }, 1, 0] } },
          totalValue: { $sum: "$totalAmount" }
        }
      }
    ]);
    
    const inventoryAnalytics = await Inventory.aggregate([
      {
        $group: {
          _id: null,
          totalItems: { $sum: 1 },
          totalQuantity: { $sum: "$quantity" },
          lowStockItems: { $sum: { $cond: [{ $eq: ["$status", "Low Stock"] }, 1, 0] } },
          outOfStockItems: { $sum: { $cond: [{ $eq: ["$status", "Out of Stock"] }, 1, 0] } }
        }
      }
    ]);
    
    const analyticsData = {
      orders: orderAnalytics[0] || { totalOrders: 0, pendingOrders: 0, completedOrders: 0, totalValue: 0 },
      inventory: inventoryAnalytics[0] || { totalItems: 0, totalQuantity: 0, lowStockItems: 0, outOfStockItems: 0 }
    };
    
    res.status(200).json({
      success: true,
      analytics: analyticsData
    });
  } catch (error) {
    console.error('Error fetching orders analytics data:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching orders analytics data',
      error: error.message
    });
  }
});

// Add missing endpoints for Reports and Analytics
app.get("/Reports/analytics", authenticateToken, async (req, res) => {
  try {
    const Inventory = require("./Model/InventoryModel");
    const Order = require("./Model/OrderModel");
    const RecyclingRequest = require("./Model/RecyclingRequestModel");
    const User = require("./Model/UserModel");
    
    // Get comprehensive analytics data
    const inventoryAnalytics = await Inventory.aggregate([
      {
        $group: {
          _id: null,
          totalItems: { $sum: 1 },
          totalQuantity: { $sum: "$quantity" },
          lowStockItems: { $sum: { $cond: [{ $eq: ["$status", "Low Stock"] }, 1, 0] } },
          outOfStockItems: { $sum: { $cond: [{ $eq: ["$status", "Out of Stock"] }, 1, 0] } }
        }
      }
    ]);
    
    const orderAnalytics = await Order.aggregate([
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          pendingOrders: { $sum: { $cond: [{ $eq: ["$status", "Pending"] }, 1, 0] } },
          completedOrders: { $sum: { $cond: [{ $eq: ["$status", "Completed"] }, 1, 0] } },
          totalValue: { $sum: "$totalAmount" }
        }
      }
    ]);
    
    const recyclingAnalytics = await RecyclingRequest.aggregate([
      {
        $group: {
          _id: null,
          totalRequests: { $sum: 1 },
          pendingRequests: { $sum: { $cond: [{ $eq: ["$status", "Pending"] }, 1, 0] } },
          completedRequests: { $sum: { $cond: [{ $eq: ["$status", "Completed"] }, 1, 0] } },
          totalWeight: { $sum: "$wasteWeight" },
          totalPoints: { $sum: "$pointsEarned" }
        }
      }
    ]);
    
    const userAnalytics = await User.aggregate([
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          adminUsers: { $sum: { $cond: [{ $eq: ["$role", "Admin"] }, 1, 0] } },
          factoryManagerUsers: { $sum: { $cond: [{ $eq: ["$role", "Factory Manager"] }, 1, 0] } },
          branchManagerUsers: { $sum: { $cond: [{ $eq: ["$role", "Branch Manager"] }, 1, 0] } },
          driverUsers: { $sum: { $cond: [{ $eq: ["$role", "Driver"] }, 1, 0] } },
          customerUsers: { $sum: { $cond: [{ $eq: ["$role", "Customer"] }, 1, 0] } },
          fireBrigadeUsers: { $sum: { $cond: [{ $eq: ["$role", "Fire Brigade"] }, 1, 0] } }
        }
      }
    ]);
    
    const analyticsData = {
      inventory: inventoryAnalytics[0] || { totalItems: 0, totalQuantity: 0, lowStockItems: 0, outOfStockItems: 0 },
      orders: orderAnalytics[0] || { totalOrders: 0, pendingOrders: 0, completedOrders: 0, totalValue: 0 },
      recycling: recyclingAnalytics[0] || { totalRequests: 0, pendingRequests: 0, completedRequests: 0, totalWeight: 0, totalPoints: 0 },
      users: userAnalytics[0] || { totalUsers: 0, adminUsers: 0, factoryManagerUsers: 0, branchManagerUsers: 0, driverUsers: 0, customerUsers: 0, fireBrigadeUsers: 0 }
    };
    
    res.status(200).json({
      success: true,
      analytics: analyticsData
    });
  } catch (error) {
    console.error('Error fetching comprehensive analytics data:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching comprehensive analytics data',
      error: error.message
    });
  }
});

// Add missing endpoints for Recycling system
app.get("/RecyclingBins/analytics", authenticateToken, async (req, res) => {
  try {
    const RecyclingBin = require("./Model/RecyclingBinModel");
    const RecyclingRequest = require("./Model/RecyclingRequestModel");
    
    // Get recycling bin analytics data
    const binAnalytics = await RecyclingBin.aggregate([
      {
        $group: {
          _id: null,
          totalBins: { $sum: 1 },
          fullBins: { $sum: { $cond: [{ $eq: ["$status", "Full"] }, 1, 0] } },
          emptyBins: { $sum: { $cond: [{ $eq: ["$status", "Empty"] }, 1, 0] } },
          criticalBins: { $sum: { $cond: [{ $eq: ["$status", "Critical"] }, 1, 0] } }
        }
      }
    ]);
    
    const requestAnalytics = await RecyclingRequest.aggregate([
      {
        $group: {
          _id: null,
          totalRequests: { $sum: 1 },
          pendingRequests: { $sum: { $cond: [{ $eq: ["$status", "Pending"] }, 1, 0] } },
          completedRequests: { $sum: { $cond: [{ $eq: ["$status", "Completed"] }, 1, 0] } },
          totalWeight: { $sum: "$wasteWeight" },
          totalPoints: { $sum: "$pointsEarned" }
        }
      }
    ]);
    
    const analyticsData = {
      bins: binAnalytics[0] || { totalBins: 0, fullBins: 0, emptyBins: 0, criticalBins: 0 },
      requests: requestAnalytics[0] || { totalRequests: 0, pendingRequests: 0, completedRequests: 0, totalWeight: 0, totalPoints: 0 }
    };
    
    res.status(200).json({
      success: true,
      analytics: analyticsData
    });
  } catch (error) {
    console.error('Error fetching recycling analytics data:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching recycling analytics data',
      error: error.message
    });
  }
});

// Add missing endpoints for Delivery system
app.get("/Delivery/analytics", authenticateToken, async (req, res) => {
  try {
    const Delivery = require("./Model/DeliveryModel");
    const Order = require("./Model/OrderModel");
    
    // Get delivery analytics data
    const deliveryAnalytics = await Delivery.aggregate([
      {
        $group: {
          _id: null,
          totalDeliveries: { $sum: 1 },
          completedDeliveries: { $sum: { $cond: [{ $eq: ["$status", "Completed"] }, 1, 0] } },
          pendingDeliveries: { $sum: { $cond: [{ $eq: ["$status", "Pending"] }, 1, 0] } },
          inProgressDeliveries: { $sum: { $cond: [{ $eq: ["$status", "In Progress"] }, 1, 0] } }
        }
      }
    ]);
    
    const orderAnalytics = await Order.aggregate([
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          pendingOrders: { $sum: { $cond: [{ $eq: ["$status", "Pending"] }, 1, 0] } },
          completedOrders: { $sum: { $cond: [{ $eq: ["$status", "Completed"] }, 1, 0] } },
          totalValue: { $sum: "$totalAmount" }
        }
      }
    ]);
    
    const analyticsData = {
      delivery: deliveryAnalytics[0] || { totalDeliveries: 0, completedDeliveries: 0, pendingDeliveries: 0, inProgressDeliveries: 0 },
      orders: orderAnalytics[0] || { totalOrders: 0, pendingOrders: 0, completedOrders: 0, totalValue: 0 }
    };
    
    res.status(200).json({
      success: true,
      analytics: analyticsData
    });
  } catch (error) {
    console.error('Error fetching delivery analytics data:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching delivery analytics data',
      error: error.message
    });
  }
});

// Add missing endpoints for User management
app.get("/Users/analytics", authenticateToken, async (req, res) => {
  try {
    const User = require("./Model/UserModel");
    const Order = require("./Model/OrderModel");
    const RecyclingRequest = require("./Model/RecyclingRequestModel");
    
    // Get user analytics data
    const userAnalytics = await User.aggregate([
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          adminUsers: { $sum: { $cond: [{ $eq: ["$role", "Admin"] }, 1, 0] } },
          factoryManagerUsers: { $sum: { $cond: [{ $eq: ["$role", "Factory Manager"] }, 1, 0] } },
          branchManagerUsers: { $sum: { $cond: [{ $eq: ["$role", "Branch Manager"] }, 1, 0] } },
          driverUsers: { $sum: { $cond: [{ $eq: ["$role", "Driver"] }, 1, 0] } },
          customerUsers: { $sum: { $cond: [{ $eq: ["$role", "Customer"] }, 1, 0] } },
          fireBrigadeUsers: { $sum: { $cond: [{ $eq: ["$role", "Fire Brigade"] }, 1, 0] } }
        }
      }
    ]);
    
    const orderAnalytics = await Order.aggregate([
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          pendingOrders: { $sum: { $cond: [{ $eq: ["$status", "Pending"] }, 1, 0] } },
          completedOrders: { $sum: { $cond: [{ $eq: ["$status", "Completed"] }, 1, 0] } },
          totalValue: { $sum: "$totalAmount" }
        }
      }
    ]);
    
    const recyclingAnalytics = await RecyclingRequest.aggregate([
      {
        $group: {
          _id: null,
          totalRequests: { $sum: 1 },
          pendingRequests: { $sum: { $cond: [{ $eq: ["$status", "Pending"] }, 1, 0] } },
          completedRequests: { $sum: { $cond: [{ $eq: ["$status", "Completed"] }, 1, 0] } },
          totalWeight: { $sum: "$wasteWeight" },
          totalPoints: { $sum: "$pointsEarned" }
        }
      }
    ]);
    
    const analyticsData = {
      users: userAnalytics[0] || { totalUsers: 0, adminUsers: 0, factoryManagerUsers: 0, branchManagerUsers: 0, driverUsers: 0, customerUsers: 0, fireBrigadeUsers: 0 },
      orders: orderAnalytics[0] || { totalOrders: 0, pendingOrders: 0, completedOrders: 0, totalValue: 0 },
      recycling: recyclingAnalytics[0] || { totalRequests: 0, pendingRequests: 0, completedRequests: 0, totalWeight: 0, totalPoints: 0 }
    };
    
    res.status(200).json({
      success: true,
      analytics: analyticsData
    });
  } catch (error) {
    console.error('Error fetching user analytics data:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user analytics data',
      error: error.message
    });
  }
});

// Add missing endpoints for Branch Manager functions
app.get("/BranchManager/dashboard/:branchId", authenticateToken, async (req, res) => {
  try {
    const { branchId } = req.params;
    const BranchOrder = require("./Model/BranchOrderModel");
    const RecyclingBin = require("./Model/RecyclingBinModel");
    const RecyclingRequest = require("./Model/RecyclingRequestModel");
    const User = require("./Model/UserModel");
    
    // Get branch manager dashboard data
    const branchOrders = await BranchOrder.find({ branchId });
    const recyclingBins = await RecyclingBin.find({ branchId });
    const recyclingRequests = await RecyclingRequest.find({ branchId });
    const drivers = await User.find({ role: "Driver" });
    
    const dashboardData = {
      branchOrders: branchOrders.length,
      recyclingBins: recyclingBins.length,
      recyclingRequests: recyclingRequests.length,
      drivers: drivers.length,
      recentOrders: branchOrders.slice(-5),
      recentBins: recyclingBins.slice(-5),
      recentRequests: recyclingRequests.slice(-5)
    };
    
    res.status(200).json({
      success: true,
      dashboard: dashboardData
    });
  } catch (error) {
    console.error('Error fetching branch manager dashboard data:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching branch manager dashboard data',
      error: error.message
    });
  }
});

// Add missing endpoints for Factory Manager Dashboard
app.get("/FactoryManager/dashboard", authenticateToken, async (req, res) => {
  try {
    const Inventory = require("./Model/InventoryModel");
    const Order = require("./Model/OrderModel");
    const RecyclingRequest = require("./Model/RecyclingRequestModel");
    const User = require("./Model/UserModel");
    
    // Get factory manager dashboard data
    const inventory = await Inventory.find();
    const orders = await Order.find();
    const recyclingRequests = await RecyclingRequest.find();
    const users = await User.find();
    
    const dashboardData = {
      inventory: inventory.length,
      orders: orders.length,
      recyclingRequests: recyclingRequests.length,
      users: users.length,
      recentInventory: inventory.slice(-5),
      recentOrders: orders.slice(-5),
      recentRequests: recyclingRequests.slice(-5)
    };
    
    res.status(200).json({
      success: true,
      dashboard: dashboardData
    });
  } catch (error) {
    console.error('Error fetching factory manager dashboard data:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching factory manager dashboard data',
      error: error.message
    });
  }
});

// Add missing endpoints for Admin Dashboard
app.get("/Admin/dashboard", authenticateToken, async (req, res) => {
  try {
    const Inventory = require("./Model/InventoryModel");
    const Order = require("./Model/OrderModel");
    const RecyclingRequest = require("./Model/RecyclingRequestModel");
    const User = require("./Model/UserModel");
    const Branch = require("./Model/BranchModel");
    
    // Get admin dashboard data
    const inventory = await Inventory.find();
    const orders = await Order.find();
    const recyclingRequests = await RecyclingRequest.find();
    const users = await User.find();
    const branches = await Branch.find();
    
    const dashboardData = {
      inventory: inventory.length,
      orders: orders.length,
      recyclingRequests: recyclingRequests.length,
      users: users.length,
      branches: branches.length,
      recentInventory: inventory.slice(-5),
      recentOrders: orders.slice(-5),
      recentRequests: recyclingRequests.slice(-5),
      recentUsers: users.slice(-5),
      recentBranches: branches.slice(-5)
    };
    
    res.status(200).json({
      success: true,
      dashboard: dashboardData
    });
  } catch (error) {
    console.error('Error fetching admin dashboard data:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching admin dashboard data',
      error: error.message
    });
  }
});

// Add missing endpoints for Customer/MyAccount functions
app.get("/Customer/account/:customerId", authenticateToken, async (req, res) => {
  try {
    const { customerId } = req.params;
    const User = require("./Model/UserModel");
    const Order = require("./Model/OrderModel");
    const RecyclingRequest = require("./Model/RecyclingRequestModel");
    
    // Get customer account data
    const customer = await User.findById(customerId);
    const orders = await Order.find({ customerId });
    const recyclingRequests = await RecyclingRequest.find({ customerId });
    
    const accountData = {
      customer,
      orders: orders.length,
      recyclingRequests: recyclingRequests.length,
      recentOrders: orders.slice(-5),
      recentRequests: recyclingRequests.slice(-5)
    };
    
    res.status(200).json({
      success: true,
      account: accountData
    });
  } catch (error) {
    console.error('Error fetching customer account data:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching customer account data',
      error: error.message
    });
  }
});

// Add missing endpoints for Inventory management
app.get("/Inventory/analytics", authenticateToken, async (req, res) => {
  try {
    const Inventory = require("./Model/InventoryModel");
    const Order = require("./Model/OrderModel");
    
    // Get inventory analytics data
    const inventoryAnalytics = await Inventory.aggregate([
      {
        $group: {
          _id: null,
          totalItems: { $sum: 1 },
          totalQuantity: { $sum: "$quantity" },
          lowStockItems: { $sum: { $cond: [{ $eq: ["$status", "Low Stock"] }, 1, 0] } },
          outOfStockItems: { $sum: { $cond: [{ $eq: ["$status", "Out of Stock"] }, 1, 0] } }
        }
      }
    ]);
    
    const orderAnalytics = await Order.aggregate([
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          pendingOrders: { $sum: { $cond: [{ $eq: ["$status", "Pending"] }, 1, 0] } },
          completedOrders: { $sum: { $cond: [{ $eq: ["$status", "Completed"] }, 1, 0] } },
          totalValue: { $sum: "$totalAmount" }
        }
      }
    ]);
    
    const analyticsData = {
      inventory: inventoryAnalytics[0] || { totalItems: 0, totalQuantity: 0, lowStockItems: 0, outOfStockItems: 0 },
      orders: orderAnalytics[0] || { totalOrders: 0, pendingOrders: 0, completedOrders: 0, totalValue: 0 }
    };
    
    res.status(200).json({
      success: true,
      analytics: analyticsData
    });
  } catch (error) {
    console.error('Error fetching inventory analytics data:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching inventory analytics data',
      error: error.message
    });
  }
});

// Add missing endpoints for Orders management
app.get("/Orders/analytics", authenticateToken, async (req, res) => {
  try {
    const Order = require("./Model/OrderModel");
    const Inventory = require("./Model/InventoryModel");
    
    // Get orders analytics data
    const orderAnalytics = await Order.aggregate([
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          pendingOrders: { $sum: { $cond: [{ $eq: ["$status", "Pending"] }, 1, 0] } },
          completedOrders: { $sum: { $cond: [{ $eq: ["$status", "Completed"] }, 1, 0] } },
          totalValue: { $sum: "$totalAmount" }
        }
      }
    ]);
    
    const inventoryAnalytics = await Inventory.aggregate([
      {
        $group: {
          _id: null,
          totalItems: { $sum: 1 },
          totalQuantity: { $sum: "$quantity" },
          lowStockItems: { $sum: { $cond: [{ $eq: ["$status", "Low Stock"] }, 1, 0] } },
          outOfStockItems: { $sum: { $cond: [{ $eq: ["$status", "Out of Stock"] }, 1, 0] } }
        }
      }
    ]);
    
    const analyticsData = {
      orders: orderAnalytics[0] || { totalOrders: 0, pendingOrders: 0, completedOrders: 0, totalValue: 0 },
      inventory: inventoryAnalytics[0] || { totalItems: 0, totalQuantity: 0, lowStockItems: 0, outOfStockItems: 0 }
    };
    
    res.status(200).json({
      success: true,
      analytics: analyticsData
    });
  } catch (error) {
    console.error('Error fetching orders analytics data:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching orders analytics data',
      error: error.message
    });
  }
});

// Add missing endpoints for Reports and Analytics
app.get("/Reports/analytics", authenticateToken, async (req, res) => {
  try {
    const Inventory = require("./Model/InventoryModel");
    const Order = require("./Model/OrderModel");
    const RecyclingRequest = require("./Model/RecyclingRequestModel");
    const User = require("./Model/UserModel");
    
    // Get comprehensive analytics data
    const inventoryAnalytics = await Inventory.aggregate([
      {
        $group: {
          _id: null,
          totalItems: { $sum: 1 },
          totalQuantity: { $sum: "$quantity" },
          lowStockItems: { $sum: { $cond: [{ $eq: ["$status", "Low Stock"] }, 1, 0] } },
          outOfStockItems: { $sum: { $cond: [{ $eq: ["$status", "Out of Stock"] }, 1, 0] } }
        }
      }
    ]);
    
    const orderAnalytics = await Order.aggregate([
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          pendingOrders: { $sum: { $cond: [{ $eq: ["$status", "Pending"] }, 1, 0] } },
          completedOrders: { $sum: { $cond: [{ $eq: ["$status", "Completed"] }, 1, 0] } },
          totalValue: { $sum: "$totalAmount" }
        }
      }
    ]);
    
    const recyclingAnalytics = await RecyclingRequest.aggregate([
      {
        $group: {
          _id: null,
          totalRequests: { $sum: 1 },
          pendingRequests: { $sum: { $cond: [{ $eq: ["$status", "Pending"] }, 1, 0] } },
          completedRequests: { $sum: { $cond: [{ $eq: ["$status", "Completed"] }, 1, 0] } },
          totalWeight: { $sum: "$wasteWeight" },
          totalPoints: { $sum: "$pointsEarned" }
        }
      }
    ]);
    
    const userAnalytics = await User.aggregate([
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          adminUsers: { $sum: { $cond: [{ $eq: ["$role", "Admin"] }, 1, 0] } },
          factoryManagerUsers: { $sum: { $cond: [{ $eq: ["$role", "Factory Manager"] }, 1, 0] } },
          branchManagerUsers: { $sum: { $cond: [{ $eq: ["$role", "Branch Manager"] }, 1, 0] } },
          driverUsers: { $sum: { $cond: [{ $eq: ["$role", "Driver"] }, 1, 0] } },
          customerUsers: { $sum: { $cond: [{ $eq: ["$role", "Customer"] }, 1, 0] } },
          fireBrigadeUsers: { $sum: { $cond: [{ $eq: ["$role", "Fire Brigade"] }, 1, 0] } }
        }
      }
    ]);
    
    const analyticsData = {
      inventory: inventoryAnalytics[0] || { totalItems: 0, totalQuantity: 0, lowStockItems: 0, outOfStockItems: 0 },
      orders: orderAnalytics[0] || { totalOrders: 0, pendingOrders: 0, completedOrders: 0, totalValue: 0 },
      recycling: recyclingAnalytics[0] || { totalRequests: 0, pendingRequests: 0, completedRequests: 0, totalWeight: 0, totalPoints: 0 },
      users: userAnalytics[0] || { totalUsers: 0, adminUsers: 0, factoryManagerUsers: 0, branchManagerUsers: 0, driverUsers: 0, customerUsers: 0, fireBrigadeUsers: 0 }
    };
    
    res.status(200).json({
      success: true,
      analytics: analyticsData
    });
  } catch (error) {
    console.error('Error fetching comprehensive analytics data:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching comprehensive analytics data',
      error: error.message
    });
  }
});

// Add missing endpoints for Recycling system
app.get("/RecyclingBins/analytics", authenticateToken, async (req, res) => {
  try {
    const RecyclingBin = require("./Model/RecyclingBinModel");
    const RecyclingRequest = require("./Model/RecyclingRequestModel");
    
    // Get recycling bin analytics data
    const binAnalytics = await RecyclingBin.aggregate([
      {
        $group: {
          _id: null,
          totalBins: { $sum: 1 },
          fullBins: { $sum: { $cond: [{ $eq: ["$status", "Full"] }, 1, 0] } },
          emptyBins: { $sum: { $cond: [{ $eq: ["$status", "Empty"] }, 1, 0] } },
          criticalBins: { $sum: { $cond: [{ $eq: ["$status", "Critical"] }, 1, 0] } }
        }
      }
    ]);
    
    const requestAnalytics = await RecyclingRequest.aggregate([
      {
        $group: {
          _id: null,
          totalRequests: { $sum: 1 },
          pendingRequests: { $sum: { $cond: [{ $eq: ["$status", "Pending"] }, 1, 0] } },
          completedRequests: { $sum: { $cond: [{ $eq: ["$status", "Completed"] }, 1, 0] } },
          totalWeight: { $sum: "$wasteWeight" },
          totalPoints: { $sum: "$pointsEarned" }
        }
      }
    ]);
    
    const analyticsData = {
      bins: binAnalytics[0] || { totalBins: 0, fullBins: 0, emptyBins: 0, criticalBins: 0 },
      requests: requestAnalytics[0] || { totalRequests: 0, pendingRequests: 0, completedRequests: 0, totalWeight: 0, totalPoints: 0 }
    };
    
    res.status(200).json({
      success: true,
      analytics: analyticsData
    });
  } catch (error) {
    console.error('Error fetching recycling analytics data:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching recycling analytics data',
      error: error.message
    });
  }
});

// Add missing endpoints for Delivery system
app.get("/Delivery/analytics", authenticateToken, async (req, res) => {
  try {
    const Delivery = require("./Model/DeliveryModel");
    const Order = require("./Model/OrderModel");
    
    // Get delivery analytics data
    const deliveryAnalytics = await Delivery.aggregate([
      {
        $group: {
          _id: null,
          totalDeliveries: { $sum: 1 },
          completedDeliveries: { $sum: { $cond: [{ $eq: ["$status", "Completed"] }, 1, 0] } },
          pendingDeliveries: { $sum: { $cond: [{ $eq: ["$status", "Pending"] }, 1, 0] } },
          inProgressDeliveries: { $sum: { $cond: [{ $eq: ["$status", "In Progress"] }, 1, 0] } }
        }
      }
    ]);
    
    const orderAnalytics = await Order.aggregate([
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          pendingOrders: { $sum: { $cond: [{ $eq: ["$status", "Pending"] }, 1, 0] } },
          completedOrders: { $sum: { $cond: [{ $eq: ["$status", "Completed"] }, 1, 0] } },
          totalValue: { $sum: "$totalAmount" }
        }
      }
    ]);
    
    const analyticsData = {
      delivery: deliveryAnalytics[0] || { totalDeliveries: 0, completedDeliveries: 0, pendingDeliveries: 0, inProgressDeliveries: 0 },
      orders: orderAnalytics[0] || { totalOrders: 0, pendingOrders: 0, completedOrders: 0, totalValue: 0 }
    };
    
    res.status(200).json({
      success: true,
      analytics: analyticsData
    });
  } catch (error) {
    console.error('Error fetching delivery analytics data:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching delivery analytics data',
      error: error.message
    });
  }
});

// Add missing endpoints for User management
app.get("/Users/analytics", authenticateToken, async (req, res) => {
  try {
    const User = require("./Model/UserModel");
    const Order = require("./Model/OrderModel");
    const RecyclingRequest = require("./Model/RecyclingRequestModel");
    
    // Get user analytics data
    const userAnalytics = await User.aggregate([
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          adminUsers: { $sum: { $cond: [{ $eq: ["$role", "Admin"] }, 1, 0] } },
          factoryManagerUsers: { $sum: { $cond: [{ $eq: ["$role", "Factory Manager"] }, 1, 0] } },
          branchManagerUsers: { $sum: { $cond: [{ $eq: ["$role", "Branch Manager"] }, 1, 0] } },
          driverUsers: { $sum: { $cond: [{ $eq: ["$role", "Driver"] }, 1, 0] } },
          customerUsers: { $sum: { $cond: [{ $eq: ["$role", "Customer"] }, 1, 0] } },
          fireBrigadeUsers: { $sum: { $cond: [{ $eq: ["$role", "Fire Brigade"] }, 1, 0] } }
        }
      }
    ]);
    
    const orderAnalytics = await Order.aggregate([
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          pendingOrders: { $sum: { $cond: [{ $eq: ["$status", "Pending"] }, 1, 0] } },
          completedOrders: { $sum: { $cond: [{ $eq: ["$status", "Completed"] }, 1, 0] } },
          totalValue: { $sum: "$totalAmount" }
        }
      }
    ]);
    
    const recyclingAnalytics = await RecyclingRequest.aggregate([
      {
        $group: {
          _id: null,
          totalRequests: { $sum: 1 },
          pendingRequests: { $sum: { $cond: [{ $eq: ["$status", "Pending"] }, 1, 0] } },
          completedRequests: { $sum: { $cond: [{ $eq: ["$status", "Completed"] }, 1, 0] } },
          totalWeight: { $sum: "$wasteWeight" },
          totalPoints: { $sum: "$pointsEarned" }
        }
      }
    ]);
    
    const analyticsData = {
      users: userAnalytics[0] || { totalUsers: 0, adminUsers: 0, factoryManagerUsers: 0, branchManagerUsers: 0, driverUsers: 0, customerUsers: 0, fireBrigadeUsers: 0 },
      orders: orderAnalytics[0] || { totalOrders: 0, pendingOrders: 0, completedOrders: 0, totalValue: 0 },
      recycling: recyclingAnalytics[0] || { totalRequests: 0, pendingRequests: 0, completedRequests: 0, totalWeight: 0, totalPoints: 0 }
    };
    
    res.status(200).json({
      success: true,
      analytics: analyticsData
    });
  } catch (error) {
    console.error('Error fetching user analytics data:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user analytics data',
      error: error.message
    });
  }
});

// Add missing endpoints for Branch Manager functions
app.get("/BranchManager/dashboard/:branchId", authenticateToken, async (req, res) => {
  try {
    const { branchId } = req.params;
    const BranchOrder = require("./Model/BranchOrderModel");
    const RecyclingBin = require("./Model/RecyclingBinModel");
    const RecyclingRequest = require("./Model/RecyclingRequestModel");
    const User = require("./Model/UserModel");
    
    // Get branch manager dashboard data
    const branchOrders = await BranchOrder.find({ branchId });
    const recyclingBins = await RecyclingBin.find({ branchId });
    const recyclingRequests = await RecyclingRequest.find({ branchId });
    const drivers = await User.find({ role: "Driver" });
    
    const dashboardData = {
      branchOrders: branchOrders.length,
      recyclingBins: recyclingBins.length,
      recyclingRequests: recyclingRequests.length,
      drivers: drivers.length,
      recentOrders: branchOrders.slice(-5),
      recentBins: recyclingBins.slice(-5),
      recentRequests: recyclingRequests.slice(-5)
    };
    
    res.status(200).json({
      success: true,
      dashboard: dashboardData
    });
  } catch (error) {
    console.error('Error fetching branch manager dashboard data:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching branch manager dashboard data',
      error: error.message
    });
  }
});

// Add missing endpoints for Factory Manager Dashboard
app.get("/FactoryManager/dashboard", authenticateToken, async (req, res) => {
  try {
    const Inventory = require("./Model/InventoryModel");
    const Order = require("./Model/OrderModel");
    const RecyclingRequest = require("./Model/RecyclingRequestModel");
    const User = require("./Model/UserModel");
    
    // Get factory manager dashboard data
    const inventory = await Inventory.find();
    const orders = await Order.find();
    const recyclingRequests = await RecyclingRequest.find();
    const users = await User.find();
    
    const dashboardData = {
      inventory: inventory.length,
      orders: orders.length,
      recyclingRequests: recyclingRequests.length,
      users: users.length,
      recentInventory: inventory.slice(-5),
      recentOrders: orders.slice(-5),
      recentRequests: recyclingRequests.slice(-5)
    };
    
    res.status(200).json({
      success: true,
      dashboard: dashboardData
    });
  } catch (error) {
    console.error('Error fetching factory manager dashboard data:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching factory manager dashboard data',
      error: error.message
    });
  }
});

// Add missing endpoints for Admin Dashboard
app.get("/Admin/dashboard", authenticateToken, async (req, res) => {
  try {
    const Inventory = require("./Model/InventoryModel");
    const Order = require("./Model/OrderModel");
    const RecyclingRequest = require("./Model/RecyclingRequestModel");
    const User = require("./Model/UserModel");
    const Branch = require("./Model/BranchModel");
    
    // Get admin dashboard data
    const inventory = await Inventory.find();
    const orders = await Order.find();
    const recyclingRequests = await RecyclingRequest.find();
    const users = await User.find();
    const branches = await Branch.find();
    
    const dashboardData = {
      inventory: inventory.length,
      orders: orders.length,
      recyclingRequests: recyclingRequests.length,
      users: users.length,
      branches: branches.length,
      recentInventory: inventory.slice(-5),
      recentOrders: orders.slice(-5),
      recentRequests: recyclingRequests.slice(-5),
      recentUsers: users.slice(-5),
      recentBranches: branches.slice(-5)
    };
    
    res.status(200).json({
      success: true,
      dashboard: dashboardData
    });
  } catch (error) {
    console.error('Error fetching admin dashboard data:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching admin dashboard data',
      error: error.message
    });
  }
});

// Add missing endpoints for Customer/MyAccount functions
app.get("/Customer/account/:customerId", authenticateToken, async (req, res) => {
  try {
    const { customerId } = req.params;
    const User = require("./Model/UserModel");
    const Order = require("./Model/OrderModel");
    const RecyclingRequest = require("./Model/RecyclingRequestModel");
    
    // Get customer account data
    const customer = await User.findById(customerId);
    const orders = await Order.find({ customerId });
    const recyclingRequests = await RecyclingRequest.find({ customerId });
    
    const accountData = {
      customer,
      orders: orders.length,
      recyclingRequests: recyclingRequests.length,
      recentOrders: orders.slice(-5),
      recentRequests: recyclingRequests.slice(-5)
    };
    
    res.status(200).json({
      success: true,
      account: accountData
    });
  } catch (error) {
    console.error('Error fetching customer account data:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching customer account data',
      error: error.message
    });
  }
});

// Add missing endpoints for Inventory management
app.get("/Inventory/analytics", authenticateToken, async (req, res) => {
  try {
    const Inventory = require("./Model/InventoryModel");
    const Order = require("./Model/OrderModel");
    
    // Get inventory analytics data
    const inventoryAnalytics = await Inventory.aggregate([
      {
        $group: {
          _id: null,
          totalItems: { $sum: 1 },
          totalQuantity: { $sum: "$quantity" },
          lowStockItems: { $sum: { $cond: [{ $eq: ["$status", "Low Stock"] }, 1, 0] } },
          outOfStockItems: { $sum: { $cond: [{ $eq: ["$status", "Out of Stock"] }, 1, 0] } }
        }
      }
    ]);
    
    const orderAnalytics = await Order.aggregate([
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          pendingOrders: { $sum: { $cond: [{ $eq: ["$status", "Pending"] }, 1, 0] } },
          completedOrders: { $sum: { $cond: [{ $eq: ["$status", "Completed"] }, 1, 0] } },
          totalValue: { $sum: "$totalAmount" }
        }
      }
    ]);
    
    const analyticsData = {
      inventory: inventoryAnalytics[0] || { totalItems: 0, totalQuantity: 0, lowStockItems: 0, outOfStockItems: 0 },
      orders: orderAnalytics[0] || { totalOrders: 0, pendingOrders: 0, completedOrders: 0, totalValue: 0 }
    };
    
    res.status(200).json({
      success: true,
      analytics: analyticsData
    });
  } catch (error) {
    console.error('Error fetching inventory analytics data:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching inventory analytics data',
      error: error.message
    });
  }
});

// Add missing endpoints for Orders management
app.get("/Orders/analytics", authenticateToken, async (req, res) => {
  try {
    const Order = require("./Model/OrderModel");
    const Inventory = require("./Model/InventoryModel");
    
    // Get orders analytics data
    const orderAnalytics = await Order.aggregate([
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          pendingOrders: { $sum: { $cond: [{ $eq: ["$status", "Pending"] }, 1, 0] } },
          completedOrders: { $sum: { $cond: [{ $eq: ["$status", "Completed"] }, 1, 0] } },
          totalValue: { $sum: "$totalAmount" }
        }
      }
    ]);
    
    const inventoryAnalytics = await Inventory.aggregate([
      {
        $group: {
          _id: null,
          totalItems: { $sum: 1 },
          totalQuantity: { $sum: "$quantity" },
          lowStockItems: { $sum: { $cond: [{ $eq: ["$status", "Low Stock"] }, 1, 0] } },
          outOfStockItems: { $sum: { $cond: [{ $eq: ["$status", "Out of Stock"] }, 1, 0] } }
        }
      }
    ]);
    
    const analyticsData = {
      orders: orderAnalytics[0] || { totalOrders: 0, pendingOrders: 0, completedOrders: 0, totalValue: 0 },
      inventory: inventoryAnalytics[0] || { totalItems: 0, totalQuantity: 0, lowStockItems: 0, outOfStockItems: 0 }
    };
    
    res.status(200).json({
      success: true,
      analytics: analyticsData
    });
  } catch (error) {
    console.error('Error fetching orders analytics data:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching orders analytics data',
      error: error.message
    });
  }
});

// Add missing endpoints for Reports and Analytics
app.get("/Reports/analytics", authenticateToken, async (req, res) => {
  try {
    const Inventory = require("./Model/InventoryModel");
    const Order = require("./Model/OrderModel");
    const RecyclingRequest = require("./Model/RecyclingRequestModel");
    const User = require("./Model/UserModel");
    
    // Get comprehensive analytics data
    const inventoryAnalytics = await Inventory.aggregate([
      {
        $group: {
          _id: null,
          totalItems: { $sum: 1 },
          totalQuantity: { $sum: "$quantity" },
          lowStockItems: { $sum: { $cond: [{ $eq: ["$status", "Low Stock"] }, 1, 0] } },
          outOfStockItems: { $sum: { $cond: [{ $eq: ["$status", "Out of Stock"] }, 1, 0] } }
        }
      }
    ]);
    
    const orderAnalytics = await Order.aggregate([
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          pendingOrders: { $sum: { $cond: [{ $eq: ["$status", "Pending"] }, 1, 0] } },
          completedOrders: { $sum: { $cond: [{ $eq: ["$status", "Completed"] }, 1, 0] } },
          totalValue: { $sum: "$totalAmount" }
        }
      }
    ]);
    
    const recyclingAnalytics = await RecyclingRequest.aggregate([
      {
        $group: {
          _id: null,
          totalRequests: { $sum: 1 },
          pendingRequests: { $sum: { $cond: [{ $eq: ["$status", "Pending"] }, 1, 0] } },
          completedRequests: { $sum: { $cond: [{ $eq: ["$status", "Completed"] }, 1, 0] } },
          totalWeight: { $sum: "$wasteWeight" },
          totalPoints: { $sum: "$pointsEarned" }
        }
      }
    ]);
    
    const userAnalytics = await User.aggregate([
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          adminUsers: { $sum: { $cond: [{ $eq: ["$role", "Admin"] }, 1, 0] } },
          factoryManagerUsers: { $sum: { $cond: [{ $eq: ["$role", "Factory Manager"] }, 1, 0] } },
          branchManagerUsers: { $sum: { $cond: [{ $eq: ["$role", "Branch Manager"] }, 1, 0] } },
          driverUsers: { $sum: { $cond: [{ $eq: ["$role", "Driver"] }, 1, 0] } },
          customerUsers: { $sum: { $cond: [{ $eq: ["$role", "Customer"] }, 1, 0] } },
          fireBrigadeUsers: { $sum: { $cond: [{ $eq: ["$role", "Fire Brigade"] }, 1, 0] } }
        }
      }
    ]);
    
    const analyticsData = {
      inventory: inventoryAnalytics[0] || { totalItems: 0, totalQuantity: 0, lowStockItems: 0, outOfStockItems: 0 },
      orders: orderAnalytics[0] || { totalOrders: 0, pendingOrders: 0, completedOrders: 0, totalValue: 0 },
      recycling: recyclingAnalytics[0] || { totalRequests: 0, pendingRequests: 0, completedRequests: 0, totalWeight: 0, totalPoints: 0 },
      users: userAnalytics[0] || { totalUsers: 0, adminUsers: 0, factoryManagerUsers: 0, branchManagerUsers: 0, driverUsers: 0, customerUsers: 0, fireBrigadeUsers: 0 }
    };
    
    res.status(200).json({
      success: true,
      analytics: analyticsData
    });
  } catch (error) {
    console.error('Error fetching comprehensive analytics data:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching comprehensive analytics data',
      error: error.message
    });
  }
});

// Add missing endpoints for Recycling system
app.get("/RecyclingBins/analytics", authenticateToken, async (req, res) => {
  try {
    const RecyclingBin = require("./Model/RecyclingBinModel");
    const RecyclingRequest = require("./Model/RecyclingRequestModel");
    
    // Get recycling bin analytics data
    const binAnalytics = await RecyclingBin.aggregate([
      {
        $group: {
          _id: null,
          totalBins: { $sum: 1 },
          fullBins: { $sum: { $cond: [{ $eq: ["$status", "Full"] }, 1, 0] } },
          emptyBins: { $sum: { $cond: [{ $eq: ["$status", "Empty"] }, 1, 0] } },
          criticalBins: { $sum: { $cond: [{ $eq: ["$status", "Critical"] }, 1, 0] } }
        }
      }
    ]);
    
    const requestAnalytics = await RecyclingRequest.aggregate([
      {
        $group: {
          _id: null,
          totalRequests: { $sum: 1 },
          pendingRequests: { $sum: { $cond: [{ $eq: ["$status", "Pending"] }, 1, 0] } },
          completedRequests: { $sum: { $cond: [{ $eq: ["$status", "Completed"] }, 1, 0] } },
          totalWeight: { $sum: "$wasteWeight" },
          totalPoints: { $sum: "$pointsEarned" }
        }
      }
    ]);
    
    const analyticsData = {
      bins: binAnalytics[0] || { totalBins: 0, fullBins: 0, emptyBins: 0, criticalBins: 0 },
      requests: requestAnalytics[0] || { totalRequests: 0, pendingRequests: 0, completedRequests: 0, totalWeight: 0, totalPoints: 0 }
    };
    
    res.status(200).json({
      success: true,
      analytics: analyticsData
    });
  } catch (error) {
    console.error('Error fetching recycling analytics data:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching recycling analytics data',
      error: error.message
    });
  }
});

// Add missing endpoints for Delivery system
app.get("/Delivery/analytics", authenticateToken, async (req, res) => {
  try {
    const Delivery = require("./Model/DeliveryModel");
    const Order = require("./Model/OrderModel");
    
    // Get delivery analytics data
    const deliveryAnalytics = await Delivery.aggregate([
      {
        $group: {
          _id: null,
          totalDeliveries: { $sum: 1 },
          completedDeliveries: { $sum: { $cond: [{ $eq: ["$status", "Completed"] }, 1, 0] } },
          pendingDeliveries: { $sum: { $cond: [{ $eq: ["$status", "Pending"] }, 1, 0] } },
          inProgressDeliveries: { $sum: { $cond: [{ $eq: ["$status", "In Progress"] }, 1, 0] } }
        }
      }
    ]);
    
    const orderAnalytics = await Order.aggregate([
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          pendingOrders: { $sum: { $cond: [{ $eq: ["$status", "Pending"] }, 1, 0] } },
          completedOrders: { $sum: { $cond: [{ $eq: ["$status", "Completed"] }, 1, 0] } },
          totalValue: { $sum: "$totalAmount" }
        }
      }
    ]);
    
    const analyticsData = {
      delivery: deliveryAnalytics[0] || { totalDeliveries: 0, completedDeliveries: 0, pendingDeliveries: 0, inProgressDeliveries: 0 },
      orders: orderAnalytics[0] || { totalOrders: 0, pendingOrders: 0, completedOrders: 0, totalValue: 0 }
    };
    
    res.status(200).json({
      success: true,
      analytics: analyticsData
    });
  } catch (error) {
    console.error('Error fetching delivery analytics data:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching delivery analytics data',
      error: error.message
    });
  }
});

// Add missing endpoints for User management
app.get("/Users/analytics", authenticateToken, async (req, res) => {
  try {
    const User = require("./Model/UserModel");
    const Order = require("./Model/OrderModel");
    const RecyclingRequest = require("./Model/RecyclingRequestModel");
    
    // Get user analytics data
    const userAnalytics = await User.aggregate([
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          adminUsers: { $sum: { $cond: [{ $eq: ["$role", "Admin"] }, 1, 0] } },
          factoryManagerUsers: { $sum: { $cond: [{ $eq: ["$role", "Factory Manager"] }, 1, 0] } },
          branchManagerUsers: { $sum: { $cond: [{ $eq: ["$role", "Branch Manager"] }, 1, 0] } },
          driverUsers: { $sum: { $cond: [{ $eq: ["$role", "Driver"] }, 1, 0] } },
          customerUsers: { $sum: { $cond: [{ $eq: ["$role", "Customer"] }, 1, 0] } },
          fireBrigadeUsers: { $sum: { $cond: [{ $eq: ["$role", "Fire Brigade"] }, 1, 0] } }
        }
      }
    ]);
    
    const orderAnalytics = await Order.aggregate([
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          pendingOrders: { $sum: { $cond: [{ $eq: ["$status", "Pending"] }, 1, 0] } },
          completedOrders: { $sum: { $cond: [{ $eq: ["$status", "Completed"] }, 1, 0] } },
          totalValue: { $sum: "$totalAmount" }
        }
      }
    ]);
    
    const recyclingAnalytics = await RecyclingRequest.aggregate([
      {
        $group: {
          _id: null,
          totalRequests: { $sum: 1 },
          pendingRequests: { $sum: { $cond: [{ $eq: ["$status", "Pending"] }, 1, 0] } },
          completedRequests: { $sum: { $cond: [{ $eq: ["$status", "Completed"] }, 1, 0] } },
          totalWeight: { $sum: "$wasteWeight" },
          totalPoints: { $sum: "$pointsEarned" }
        }
      }
    ]);
    
    const analyticsData = {
      users: userAnalytics[0] || { totalUsers: 0, adminUsers: 0, factoryManagerUsers: 0, branchManagerUsers: 0, driverUsers: 0, customerUsers: 0, fireBrigadeUsers: 0 },
      orders: orderAnalytics[0] || { totalOrders: 0, pendingOrders: 0, completedOrders: 0, totalValue: 0 },
      recycling: recyclingAnalytics[0] || { totalRequests: 0, pendingRequests: 0, completedRequests: 0, totalWeight: 0, totalPoints: 0 }
    };
    
    res.status(200).json({
      success: true,
      analytics: analyticsData
    });
  } catch (error) {
    console.error('Error fetching user analytics data:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user analytics data',
      error: error.message
    });
  }
});

// Add missing endpoints for Branch Manager functions
app.get("/BranchManager/dashboard/:branchId", authenticateToken, async (req, res) => {
  try {
    const { branchId } = req.params;
    const BranchOrder = require("./Model/BranchOrderModel");
    const RecyclingBin = require("./Model/RecyclingBinModel");
    const RecyclingRequest = require("./Model/RecyclingRequestModel");
    const User = require("./Model/UserModel");
    
    // Get branch manager dashboard data
    const branchOrders = await BranchOrder.find({ branchId });
    const recyclingBins = await RecyclingBin.find({ branchId });
    const recyclingRequests = await RecyclingRequest.find({ branchId });
    const drivers = await User.find({ role: "Driver" });
    
    const dashboardData = {
      branchOrders: branchOrders.length,
      recyclingBins: recyclingBins.length,
      recyclingRequests: recyclingRequests.length,
      drivers: drivers.length,
      recentOrders: branchOrders.slice(-5),
      recentBins: recyclingBins.slice(-5),
      recentRequests: recyclingRequests.slice(-5)
    };
    
    res.status(200).json({
      success: true,
      dashboard: dashboardData
    });
  } catch (error) {
    console.error('Error fetching branch manager dashboard data:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching branch manager dashboard data',
      error: error.message
    });
  }
});

// Add missing endpoints for Factory Manager Dashboard
app.get("/FactoryManager/dashboard", authenticateToken, async (req, res) => {
  try {
    const Inventory = require("./Model/InventoryModel");
    const Order = require("./Model/OrderModel");
    const RecyclingRequest = require("./Model/RecyclingRequestModel");
    const User = require("./Model/UserModel");
    
    // Get factory manager dashboard data
    const inventory = await Inventory.find();
    const orders = await Order.find();
    const recyclingRequests = await RecyclingRequest.find();
    const users = await User.find();
    
    const dashboardData = {
      inventory: inventory.length,
      orders: orders.length,
      recyclingRequests: recyclingRequests.length,
      users: users.length,
      recentInventory: inventory.slice(-5),
      recentOrders: orders.slice(-5),
      recentRequests: recyclingRequests.slice(-5)
    };
    
    res.status(200).json({
      success: true,
      dashboard: dashboardData
    });
  } catch (error) {
    console.error('Error fetching factory manager dashboard data:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching factory manager dashboard data',
      error: error.message
    });
  }
});

// Add missing endpoints for Admin Dashboard
app.get("/Admin/dashboard", authenticateToken, async (req, res) => {
  try {
    const Inventory = require("./Model/InventoryModel");
    const Order = require("./Model/OrderModel");
    const RecyclingRequest = require("./Model/RecyclingRequestModel");
    const User = require("./Model/UserModel");
    const Branch = require("./Model/BranchModel");
    
    // Get admin dashboard data
    const inventory = await Inventory.find();
    const orders = await Order.find();
    const recyclingRequests = await RecyclingRequest.find();
    const users = await User.find();
    const branches = await Branch.find();
    
    const dashboardData = {
      inventory: inventory.length,
      orders: orders.length,
      recyclingRequests: recyclingRequests.length,
      users: users.length,
      branches: branches.length,
      recentInventory: inventory.slice(-5),
      recentOrders: orders.slice(-5),
      recentRequests: recyclingRequests.slice(-5),
      recentUsers: users.slice(-5),
      recentBranches: branches.slice(-5)
    };
    
    res.status(200).json({
      success: true,
      dashboard: dashboardData
    });
  } catch (error) {
    console.error('Error fetching admin dashboard data:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching admin dashboard data',
      error: error.message
    });
  }
});

// Add missing endpoints for Customer/MyAccount functions
app.get("/Customer/account/:customerId", authenticateToken, async (req, res) => {
  try {
    const { customerId } = req.params;
    const User = require("./Model/UserModel");
    const Order = require("./Model/OrderModel");
    const RecyclingRequest = require("./Model/RecyclingRequestModel");
    
    // Get customer account data
    const customer = await User.findById(customerId);
    const orders = await Order.find({ customerId });
    const recyclingRequests = await RecyclingRequest.find({ customerId });
    
    const accountData = {
      customer,
      orders: orders.length,
      recyclingRequests: recyclingRequests.length,
      recentOrders: orders.slice(-5),
      recentRequests: recyclingRequests.slice(-5)
    };
    
    res.status(200).json({
      success: true,
      account: accountData
    });
  } catch (error) {
    console.error('Error fetching customer account data:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching customer account data',
      error: error.message
    });
  }
});

// Add missing endpoints for Inventory management
app.get("/Inventory/analytics", authenticateToken, async (req, res) => {
  try {
    const Inventory = require("./Model/InventoryModel");
    const Order = require("./Model/OrderModel");
    
    // Get inventory analytics data
    const inventoryAnalytics = await Inventory.aggregate([
      {
        $group: {
          _id: null,
          totalItems: { $sum: 1 },
          totalQuantity: { $sum: "$quantity" },
          lowStockItems: { $sum: { $cond: [{ $eq: ["$status", "Low Stock"] }, 1, 0] } },
          outOfStockItems: { $sum: { $cond: [{ $eq: ["$status", "Out of Stock"] }, 1, 0] } }
        }
      }
    ]);
    
    const orderAnalytics = await Order.aggregate([
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          pendingOrders: { $sum: { $cond: [{ $eq: ["$status", "Pending"] }, 1, 0] } },
          completedOrders: { $sum: { $cond: [{ $eq: ["$status", "Completed"] }, 1, 0] } },
          totalValue: { $sum: "$totalAmount" }
        }
      }
    ]);
    
    const analyticsData = {
      inventory: inventoryAnalytics[0] || { totalItems: 0, totalQuantity: 0, lowStockItems: 0, outOfStockItems: 0 },
      orders: orderAnalytics[0] || { totalOrders: 0, pendingOrders: 0, completedOrders: 0, totalValue: 0 }
    };
    
    res.status(200).json({
      success: true,
      analytics: analyticsData
    });
  } catch (error) {
    console.error('Error fetching inventory analytics data:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching inventory analytics data',
      error: error.message
    });
  }
});

// Add missing endpoints for Orders management
app.get("/Orders/analytics", authenticateToken, async (req, res) => {
  try {
    const Order = require("./Model/OrderModel");
    const Inventory = require("./Model/InventoryModel");
    
    // Get orders analytics data
    const orderAnalytics = await Order.aggregate([
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          pendingOrders: { $sum: { $cond: [{ $eq: ["$status", "Pending"] }, 1, 0] } },
          completedOrders: { $sum: { $cond: [{ $eq: ["$status", "Completed"] }, 1, 0] } },
          totalValue: { $sum: "$totalAmount" }
        }
      }
    ]);
    
    const inventoryAnalytics = await Inventory.aggregate([
      {
        $group: {
          _id: null,
          totalItems: { $sum: 1 },
          totalQuantity: { $sum: "$quantity" },
          lowStockItems: { $sum: { $cond: [{ $eq: ["$status", "Low Stock"] }, 1, 0] } },
          outOfStockItems: { $sum: { $cond: [{ $eq: ["$status", "Out of Stock"] }, 1, 0] } }
        }
      }
    ]);
    
    const analyticsData = {
      orders: orderAnalytics[0] || { totalOrders: 0, pendingOrders: 0, completedOrders: 0, totalValue: 0 },
      inventory: inventoryAnalytics[0] || { totalItems: 0, totalQuantity: 0, lowStockItems: 0, outOfStockItems: 0 }
    };
    
    res.status(200).json({
      success: true,
      analytics: analyticsData
    });
  } catch (error) {
    console.error('Error fetching orders analytics data:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching orders analytics data',
      error: error.message
    });
  }
});

// Add missing endpoints for Reports and Analytics
app.get("/Reports/analytics", authenticateToken, async (req, res) => {
  try {
    const Inventory = require("./Model/InventoryModel");
    const Order = require("./Model/OrderModel");
    const RecyclingRequest = require("./Model/RecyclingRequestModel");
    const User = require("./Model/UserModel");
    
    // Get comprehensive analytics data
    const inventoryAnalytics = await Inventory.aggregate([
      {
        $group: {
          _id: null,
          totalItems: { $sum: 1 },
          totalQuantity: { $sum: "$quantity" },
          lowStockItems: { $sum: { $cond: [{ $eq: ["$status", "Low Stock"] }, 1, 0] } },
          outOfStockItems: { $sum: { $cond: [{ $eq: ["$status", "Out of Stock"] }, 1, 0] } }
        }
      }
    ]);
    
    const orderAnalytics = await Order.aggregate([
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          pendingOrders: { $sum: { $cond: [{ $eq: ["$status", "Pending"] }, 1, 0] } },
          completedOrders: { $sum: { $cond: [{ $eq: ["$status", "Completed"] }, 1, 0] } },
          totalValue: { $sum: "$totalAmount" }
        }
      }
    ]);
    
    const recyclingAnalytics = await RecyclingRequest.aggregate([
      {
        $group: {
          _id: null,
          totalRequests: { $sum: 1 },
          pendingRequests: { $sum: { $cond: [{ $eq: ["$status", "Pending"] }, 1, 0] } },
          completedRequests: { $sum: { $cond: [{ $eq: ["$status", "Completed"] }, 1, 0] } },
          totalWeight: { $sum: "$wasteWeight" },
          totalPoints: { $sum: "$pointsEarned" }
        }
      }
    ]);
    
    const userAnalytics = await User.aggregate([
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          adminUsers: { $sum: { $cond: [{ $eq: ["$role", "Admin"] }, 1, 0] } },
          factoryManagerUsers: { $sum: { $cond: [{ $eq: ["$role", "Factory Manager"] }, 1, 0] } },
          branchManagerUsers: { $sum: { $cond: [{ $eq: ["$role", "Branch Manager"] }, 1, 0] } },
          driverUsers: { $sum: { $cond: [{ $eq: ["$role", "Driver"] }, 1, 0] } },
          customerUsers: { $sum: { $cond: [{ $eq: ["$role", "Customer"] }, 1, 0] } },
          fireBrigadeUsers: { $sum: { $cond: [{ $eq: ["$role", "Fire Brigade"] }, 1, 0] } }
        }
      }
    ]);
    
    const analyticsData = {
      inventory: inventoryAnalytics[0] || { totalItems: 0, totalQuantity: 0, lowStockItems: 0, outOfStockItems: 0 },
      orders: orderAnalytics[0] || { totalOrders: 0, pendingOrders: 0, completedOrders: 0, totalValue: 0 },
      recycling: recyclingAnalytics[0] || { totalRequests: 0, pendingRequests: 0, completedRequests: 0, totalWeight: 0, totalPoints: 0 },
      users: userAnalytics[0] || { totalUsers: 0, adminUsers: 0, factoryManagerUsers: 0, branchManagerUsers: 0, driverUsers: 0, customerUsers: 0, fireBrigadeUsers: 0 }
    };
    
    res.status(200).json({
      success: true,
      analytics: analyticsData
    });
  } catch (error) {
    console.error('Error fetching comprehensive analytics data:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching comprehensive analytics data',
      error: error.message
    });
  }
});

// Add missing endpoints for Recycling system
app.get("/RecyclingBins/analytics", authenticateToken, async (req, res) => {
  try {
    const RecyclingBin = require("./Model/RecyclingBinModel");
    const RecyclingRequest = require("./Model/RecyclingRequestModel");
    
    // Get recycling bin analytics data
    const binAnalytics = await RecyclingBin.aggregate([
      {
        $group: {
          _id: null,
          totalBins: { $sum: 1 },
          fullBins: { $sum: { $cond: [{ $eq: ["$status", "Full"] }, 1, 0] } },
          emptyBins: { $sum: { $cond: [{ $eq: ["$status", "Empty"] }, 1, 0] } },
          criticalBins: { $sum: { $cond: [{ $eq: ["$status", "Critical"] }, 1, 0] } }
        }
      }
    ]);
    
    const requestAnalytics = await RecyclingRequest.aggregate([
      {
        $group: {
          _id: null,
          totalRequests: { $sum: 1 },
          pendingRequests: { $sum: { $cond: [{ $eq: ["$status", "Pending"] }, 1, 0] } },
          completedRequests: { $sum: { $cond: [{ $eq: ["$status", "Completed"] }, 1, 0] } },
          totalWeight: { $sum: "$wasteWeight" },
          totalPoints: { $sum: "$pointsEarned" }
        }
      }
    ]);
    
    const analyticsData = {
      bins: binAnalytics[0] || { totalBins: 0, fullBins: 0, emptyBins: 0, criticalBins: 0 },
      requests: requestAnalytics[0] || { totalRequests: 0, pendingRequests: 0, completedRequests: 0, totalWeight: 0, totalPoints: 0 }
    };
    
    res.status(200).json({
      success: true,
      analytics: analyticsData
    });
  } catch (error) {
    console.error('Error fetching recycling analytics data:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching recycling analytics data',
      error: error.message
    });
  }
});

// Add missing endpoints for Delivery system
app.get("/Delivery/analytics", authenticateToken, async (req, res) => {
  try {
    const Delivery = require("./Model/DeliveryModel");
    const Order = require("./Model/OrderModel");
    
    // Get delivery analytics data
    const deliveryAnalytics = await Delivery.aggregate([
      {
        $group: {
          _id: null,
          totalDeliveries: { $sum: 1 },
          completedDeliveries: { $sum: { $cond: [{ $eq: ["$status", "Completed"] }, 1, 0] } },
          pendingDeliveries: { $sum: { $cond: [{ $eq: ["$status", "Pending"] }, 1, 0] } },
          inProgressDeliveries: { $sum: { $cond: [{ $eq: ["$status", "In Progress"] }, 1, 0] } }
        }
      }
    ]);
    
    const orderAnalytics = await Order.aggregate([
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          pendingOrders: { $sum: { $cond: [{ $eq: ["$status", "Pending"] }, 1, 0] } },
          completedOrders: { $sum: { $cond: [{ $eq: ["$status", "Completed"] }, 1, 0] } },
          totalValue: { $sum: "$totalAmount" }
        }
      }
    ]);
    
    const analyticsData = {
      delivery: deliveryAnalytics[0] || { totalDeliveries: 0, completedDeliveries: 0, pendingDeliveries: 0, inProgressDeliveries: 0 },
      orders: orderAnalytics[0] || { totalOrders: 0, pendingOrders: 0, completedOrders: 0, totalValue: 0 }
    };
    
    res.status(200).json({
      success: true,
      analytics: analyticsData
    });
  } catch (error) {
    console.error('Error fetching delivery analytics data:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching delivery analytics data',
      error: error.message
    });
  }
});

// Public routes for customers (no authentication required)
// Single branch system endpoints
app.get("/branch/current", async (req, res) => {
  try {
    const Branch = require("./Model/BranchModel");
    const BranchInventory = require("./Model/BranchInventoryModel");
    
    const branch = await Branch.findOne({ status: 'Active' });
    if (!branch) {
      return res.status(404).json({
        success: false,
        message: 'No active branch found'
      });
    }

    const inventory = await BranchInventory.find({ branchId: branch._id.toString() })
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      branch: branch,
      inventory: inventory
    });
  } catch (error) {
    console.error('Error fetching current branch:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching current branch',
      error: error.message
    });
  }
});

app.put("/branch/manager", authenticateToken, async (req, res) => {
  try {
    const { managerId } = req.body;
    const Branch = require("./Model/BranchModel");
    const User = require("./Model/UserModel");

    // Verify the user exists and is a branch manager
    const manager = await User.findById(managerId);
    if (!manager || manager.role !== 'Branch Manager') {
      return res.status(400).json({
        success: false,
        message: 'Invalid branch manager ID or user is not a branch manager'
      });
    }

    const branch = await Branch.findOne({ status: 'Active' });
    if (!branch) {
      return res.status(404).json({
        success: false,
        message: 'No active branch found'
      });
    }

    // Update branch manager
    branch.manager = managerId;
    branch.managerName = manager.name;
    await branch.save();

    res.status(200).json({
      success: true,
      message: 'Branch manager updated successfully',
      branch: branch
    });
  } catch (error) {
    console.error('Error updating branch manager:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating branch manager',
      error: error.message
    });
  }
});

app.get("/public/branches", async (req, res) => {
  try {
    const Branch = require("./Model/BranchModel");
    const branches = await Branch.find({ status: 'Active' })
      .select('name location address contactInfo')
      .sort({ name: 1 });
    
    res.status(200).json({
      success: true,
      branches: branches
    });
  } catch (error) {
    console.error('Error fetching public branches:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching branches',
      error: error.message
    });
  }
});

// Customer routes (authentication required for customers)
app.use("/customer", authenticateToken, (req, res, next) => {
  if (req.user.role !== 'Customer') {
    return res.status(403).json({ success: false, message: 'Access denied. Customer role required.' });
  }
  next();
}, recyclingRequestRouter);

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ message: "RO Filter Factory API is running" });
});

// Test inventory update endpoint (temporary, no auth required)
app.post("/test-inventory-update", async (req, res) => {
  try {
    const { branchId, branchName, items } = req.body;
    
    console.log(`🧪 Testing branch inventory update for branch ${branchId}`);
    
    const BranchInventory = require("./Model/BranchInventoryModel");
    const inventoryUpdates = [];
    
    for (const item of items) {
      try {
        console.log(`📦 Testing item: ${item.name} (${item.quantity} units)`);
        
        const updatedInventory = await BranchInventory.findOneAndUpdate(
          {
            branchId: branchId,
            name: item.name
          },
          {
            $inc: { quantity: item.quantity },
            branchName: branchName || 'Test Branch',
            lastUpdated: new Date()
          },
          { 
            upsert: true, 
            new: true,
            setDefaultsOnInsert: true
          }
        );

        if (updatedInventory) {
          console.log(`✅ Test successful for ${item.name}: ${updatedInventory.quantity} units`);
          inventoryUpdates.push({
            itemName: item.name,
            quantityAdded: item.quantity,
            newTotalQuantity: updatedInventory.quantity,
            status: updatedInventory.status
          });
        }
      } catch (itemError) {
        console.error(`❌ Test failed for item ${item.name}:`, itemError);
      }
    }

    res.status(200).json({
      success: true,
      message: "Test inventory update completed",
      inventoryUpdates: inventoryUpdates
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error testing inventory update",
      error: error.message
    });
  }
});



// MongoDB connection with retry logic
const connectDB = async () => {
  try {
    const conn = await mongoose.connect("mongodb+srv://admin:heshan1456@cluster0.cjvhnm4.mongodb.net/", {
      serverSelectionTimeoutMS: 10000, // 10 seconds
      socketTimeoutMS: 45000, // 45 seconds
    });
    console.log("Connected to mongoose");
    return conn;
  } catch (err) {
    console.log("MongoDB connection failed:", err.message);
    // Retry after 5 seconds
    setTimeout(connectDB, 5000);
  }
};

// Start server after database connection
const startServer = async () => {
  try {
    await connectDB();
    app.listen(5000, () => console.log("Server running on port 5000"));
  } catch (err) {
    console.log("Failed to start server:", err);
  }
};

startServer();
