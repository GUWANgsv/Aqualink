const express = require("express");
const router = express.Router();
const {
  getAllOrders,
  getPendingOrders,
  addOrder,
  getOrderById,
  updateOrderStatus,
  deleteOrder,
  getOrderStats,
  getRecentActivities,
  getMonthlyProductionOrders,
  getMonthlyRecyclingVsOrdersComparison,
  testFactoryDelivery,
  acceptOrder
} = require("../Controllers/OrderController");

// GET all orders
router.get("/", getAllOrders);

// GET pending orders only
router.get("/pending", getPendingOrders);

// GET monthly production and orders data
router.get("/monthly-data", getMonthlyProductionOrders);

// GET monthly recycling vs orders comparison
router.get("/monthly-comparison", getMonthlyRecyclingVsOrdersComparison);

// POST add new order
router.post("/", addOrder);

// GET order by ID
router.get("/:id", getOrderById);

// PUT update order status
router.put("/:id/status", updateOrderStatus);

// PUT accept order and allocate inventory
router.put("/:id/accept", acceptOrder);

// Test factory delivery (temporary)
router.post("/test-delivery", testFactoryDelivery);

// DELETE order
router.delete("/:id", deleteOrder);

// GET order statistics
router.get("/stats/overview", getOrderStats);

// GET recent activities
router.get("/activities/recent", getRecentActivities);

module.exports = router;
