const express = require("express");
const router = express.Router();
const {
  processDelivery,
  processFactoryDelivery,
  processBranchDelivery,
  getDeliveryStats,
  getDeliveryHistory
} = require("../Controllers/DeliveryController");

// POST: Process delivery (factory or branch)
router.post("/process", processDelivery);

// POST: Process factory delivery (ship from factory)
router.post("/factory", processFactoryDelivery);

// POST: Process branch delivery (deliver to branch)
router.post("/branch", processBranchDelivery);

// GET: Get delivery statistics
router.get("/stats", getDeliveryStats);

// GET: Get delivery history
router.get("/history", getDeliveryHistory);

module.exports = router;
