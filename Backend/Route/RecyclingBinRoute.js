const express = require("express");
const router = express.Router();
const {
  getAllRecyclingBins,
  getRecyclingBinsByBranchId,
  createRecyclingBin,
  updateRecyclingBin,
  updateBinFillLevel,
  emptyRecyclingBin,
  getCriticalBins,
  getBinsForFactoryNotification,
  markBinAsNotified,
  deleteRecyclingBin,
  getRecyclingStatistics
} = require("../Controllers/RecyclingBinController");

// Get all recycling bins
router.get("/", getAllRecyclingBins);

// Get recycling bins by branch ID
router.get("/branch/:branchId", getRecyclingBinsByBranchId);

// Get critical bins by branch ID
router.get("/critical/:branchId", getCriticalBins);

// Get bins for factory notification
router.get("/factory-notification", getBinsForFactoryNotification);

// Get recycling statistics by branch ID
router.get("/statistics/:branchId", getRecyclingStatistics);

// Create new recycling bin
router.post("/", createRecyclingBin);

// Update recycling bin
router.put("/:id", updateRecyclingBin);

// Update bin fill level
router.put("/:id/fill-level", updateBinFillLevel);

// Empty recycling bin
router.put("/:id/empty", emptyRecyclingBin);

// Mark bin as notified
router.put("/:id/notify", markBinAsNotified);

// Delete recycling bin
router.delete("/:id", deleteRecyclingBin);

module.exports = router;
