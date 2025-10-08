const express = require('express');
const router = express.Router();
const {
  createBranch,
  getAllBranches,
  getPublicBranches,
  getBranchById,
  updateBranch,
  deleteBranch,
  getBranchesByStatus,
  updateBranchStock,
  getBranchesWithinRadius,
  getBranchStatistics
} = require('../Controllers/BranchController');
const { authenticateToken, requireRole } = require('../Middleware/authMiddleware');

// Public route for fetching active branches (for public branches page)
router.get('/public/active', getPublicBranches);

// Protected routes (admin only)
router.post('/create', authenticateToken, requireRole(['Admin']), createBranch);
router.get('/all', authenticateToken, requireRole(['Admin', 'Branch Manager', 'Factory Manager']), getAllBranches);
router.get('/status/:status', authenticateToken, requireRole(['Admin']), getBranchesByStatus);
router.get('/statistics', authenticateToken, requireRole(['Admin']), getBranchStatistics);
router.get('/within-radius', authenticateToken, requireRole(['Admin', 'Branch Manager']), getBranchesWithinRadius);
router.get('/:id', authenticateToken, requireRole(['Admin', 'Branch Manager']), getBranchById);
router.put('/:id', authenticateToken, requireRole(['Admin']), updateBranch);
router.put('/:id/stock', authenticateToken, requireRole(['Admin', 'Branch Manager']), updateBranchStock);
router.delete('/:id', authenticateToken, requireRole(['Admin']), deleteBranch);

module.exports = router;
