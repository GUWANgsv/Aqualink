const express = require('express');
const router = express.Router();
const {
  createFactoryRequest,
  getAllFactoryRequests,
  getFactoryRequestsByStatus,
  approveFactoryRequest,
  fulfillFactoryRequest,
  rejectFactoryRequest,
  getBranchFactoryRequests
} = require('../Controllers/FactoryRequestController');
const { authenticateToken, requireRole } = require('../Middleware/authMiddleware');

// Create a new factory request (Branch Manager)
router.post('/', authenticateToken, requireRole(['Branch Manager']), createFactoryRequest);

// Get all factory requests (Factory Manager)
router.get('/', authenticateToken, requireRole(['Factory Manager']), getAllFactoryRequests);

// Get factory requests by status (Factory Manager)
router.get('/status/:status', authenticateToken, requireRole(['Factory Manager']), getFactoryRequestsByStatus);

// Get factory requests for a specific branch (Branch Manager)
router.get('/branch/:branchId', authenticateToken, requireRole(['Branch Manager']), getBranchFactoryRequests);

// Approve a factory request (Factory Manager)
router.put('/:id/approve', authenticateToken, requireRole(['Factory Manager']), approveFactoryRequest);

// Fulfill a factory request (Factory Manager)
router.put('/:id/fulfill', authenticateToken, requireRole(['Factory Manager']), fulfillFactoryRequest);

// Reject a factory request (Factory Manager)
router.put('/:id/reject', authenticateToken, requireRole(['Factory Manager']), rejectFactoryRequest);

module.exports = router;
