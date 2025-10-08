const express = require('express');
const router = express.Router();
const {
  createCollectionRequest,
  getAllCollectionRequests,
  getPendingCollectionRequests,
  getCollectionRequestsByBranch,
  approveCollectionRequest,
  rejectCollectionRequest,
  completeCollectionRequest,
  getCollectionStatistics
} = require('../Controllers/CollectionRequestController');

// Create new collection request
router.post('/', createCollectionRequest);

// Get all collection requests
router.get('/', getAllCollectionRequests);

// Get pending collection requests
router.get('/pending', getPendingCollectionRequests);

// Get collection requests by branch
router.get('/branch/:branchId', getCollectionRequestsByBranch);

// Get collection statistics
router.get('/statistics', getCollectionStatistics);

// Approve collection request
router.put('/:id/approve', approveCollectionRequest);

// Reject collection request
router.put('/:id/reject', rejectCollectionRequest);

// Complete collection request
router.put('/:id/complete', completeCollectionRequest);

module.exports = router;
