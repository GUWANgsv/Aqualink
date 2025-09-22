const express = require("express");
const router = express.Router();
const {
  getAllDrivers,
  getAvailableDrivers,
  getDriversByBranchId,
  createDriver,
  updateDriver,
  updateDriverStatus,
  getDriverAssignments,
  removeOrderFromDriver,
  deleteDriver,
  getDriverStatistics
} = require("../Controllers/DriverController");

// Get all drivers
router.get("/", getAllDrivers);

// Get drivers by branch ID
router.get("/branch/:branchId", getDriversByBranchId);

// Get available drivers
router.get("/available", getAvailableDrivers);

// Get driver statistics
router.get("/statistics", getDriverStatistics);

// Create new driver
router.post("/", createDriver);

// Update driver
router.put("/:id", updateDriver);

// Update driver status
router.put("/:id/status", updateDriverStatus);

// Get driver assignments
router.get("/:id/assignments", getDriverAssignments);

// Remove order from driver
router.delete("/:driverId/orders/:orderId", removeOrderFromDriver);

// Delete driver
router.delete("/:id", deleteDriver);

module.exports = router;
