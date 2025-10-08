const express = require("express");
const router = express.Router();
const {
  createRecyclingRequest,
  getAllRecyclingRequests,
  getRecyclingRequestsByCustomer,
  getRecyclingRequestsByBranch,
  getPendingRecyclingRequests,
  approveRecyclingRequest,
  rejectRecyclingRequest,
  completeRecyclingRequest,
  getRecyclingStatistics
} = require("../Controllers/RecyclingRequestController");

// Import collection request functions
const {
  createCollectionRequest,
  getPendingCollectionRequests,
  getCollectionRequestsByBranch,
  approveCollectionRequest,
  rejectCollectionRequest
} = require("../Controllers/CollectionRequestController");

// Create new recycling request (customers)
router.post("/", createRecyclingRequest);

// Get all recycling requests (admin/factory manager)
router.get("/", getAllRecyclingRequests);

// Get recycling requests by customer ID
router.get("/customer/:customerId", getRecyclingRequestsByCustomer);

// Get recycling requests by branch ID
router.get("/branch/:branchId", getRecyclingRequestsByBranch);

// Get pending recycling requests
router.get("/pending", getPendingRecyclingRequests);

// Get recycling statistics
router.get("/statistics", getRecyclingStatistics);

// Approve recycling request (branch manager)
router.put("/:id/approve", approveRecyclingRequest);

// Reject recycling request (branch manager)
router.put("/:id/reject", rejectRecyclingRequest);

// Complete recycling request (factory manager)
router.put("/:id/complete", completeRecyclingRequest);

// Collection Request Routes (temporary workaround)
router.post("/collection", createCollectionRequest);
router.get("/collection/pending", getPendingCollectionRequests);
router.get("/collection/branch/:branchId", getCollectionRequestsByBranch);
router.put("/collection/:id/approve", approveCollectionRequest);
router.put("/collection/:id/reject", rejectCollectionRequest);

module.exports = router;
