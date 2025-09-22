const express = require("express");
const router = express.Router();
const {
  getAllBranchOrders,
  getBranchOrdersByBranchId,
  createBranchOrder,
  updateBranchOrder,
  assignDriverToOrder,
  updateOrderStatus,
  deleteBranchOrder,
  getOrderStatistics
} = require("../Controllers/BranchOrderController");

// Get all branch orders
router.get("/", getAllBranchOrders);

// Get branch orders by branch ID
router.get("/branch/:branchId", getBranchOrdersByBranchId);

// Get order statistics by branch ID
router.get("/statistics/:branchId", getOrderStatistics);

// Create new branch order
router.post("/", createBranchOrder);

// Update branch order
router.put("/:id", updateBranchOrder);

// Assign driver to order
router.put("/:orderId/assign-driver", assignDriverToOrder);

// Update order status
router.put("/:orderId/status", updateOrderStatus);

// Delete branch order
router.delete("/:id", deleteBranchOrder);

module.exports = router;
