const express = require("express");
const router = express.Router();
const {
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
} = require("../Controllers/BranchInventoryController");

// Get all branch inventory
router.get("/", getAllBranchInventory);

// Get branch inventory by branch ID
router.get("/branch/:branchId", getBranchInventoryByBranchId);

// Get low stock items by branch ID
router.get("/low-stock/:branchId", getLowStockItems);

// Check low stock and create automatic order
router.post("/low-stock-order/:branchId", checkLowStockAndCreateOrder);

// Get inventory statistics by branch ID
router.get("/statistics/:branchId", getInventoryStatistics);

// Create new branch inventory item
router.post("/", createBranchInventoryItem);

// Initialize branch inventory from factory inventory
router.post("/initialize", initializeBranchInventory);

// Update branch inventory item
router.put("/:id", updateBranchInventoryItem);

// Update stock levels
router.put("/stock/:branchId", updateStockLevels);

// Delete branch inventory item
router.delete("/:id", deleteBranchInventoryItem);

module.exports = router;
