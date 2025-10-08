const express = require('express');
const router = express.Router();
const {
  createEmergencyRequest,
  getAllEmergencyRequests,
  getEmergencyRequestById,
  updateEmergencyRequestStatus,
  findNearestBranch,
  getEmergencyRequestsByStatus,
  getEmergencyRequestsByBrigade,
  getEmergencyRequestsByBranch,
  getEmergencyRequestsByDriver,
  getCompletedEmergencyRequestsByDriver,
  generateEmergencyLocation,
  calculateRouteInfo,
  deleteEmergencyRequest,
  createDriverBonus,
  createDriverBonusForRequest,
  getDriverBonusHistory,
  getDriverPaysheet
} = require('../Controllers/EmergencyRequestController');
const { authenticateToken, requireRole } = require('../Middleware/authMiddleware');

// Public routes (for fire brigades to create requests)
router.post('/create', createEmergencyRequest);

// Protected routes (admin and branch manager)
router.get('/all', authenticateToken, requireRole(['Admin', 'Branch Manager']), getAllEmergencyRequests);
router.get('/status/:status', authenticateToken, requireRole(['Admin', 'Branch Manager']), getEmergencyRequestsByStatus);
router.get('/brigade/:brigadeId', authenticateToken, requireRole(['Admin', 'Fire Brigade']), getEmergencyRequestsByBrigade);
router.get('/branch/:branchId', authenticateToken, requireRole(['Admin', 'Branch Manager']), getEmergencyRequestsByBranch);
router.get('/driver/:driverId', authenticateToken, requireRole(['Admin', 'Driver']), getEmergencyRequestsByDriver);
router.get('/driver/:driverId/completed', authenticateToken, requireRole(['Admin', 'Driver']), getCompletedEmergencyRequestsByDriver);
router.get('/:id', authenticateToken, requireRole(['Admin', 'Branch Manager', 'Driver']), getEmergencyRequestById);
router.put('/:id/status', authenticateToken, requireRole(['Admin', 'Branch Manager', 'Driver']), updateEmergencyRequestStatus);
router.post('/find-nearest-branch', authenticateToken, requireRole(['Admin']), findNearestBranch);
router.post('/generate-location', authenticateToken, requireRole(['Admin', 'Branch Manager', 'Driver']), generateEmergencyLocation);
router.post('/calculate-route', authenticateToken, requireRole(['Admin', 'Branch Manager', 'Driver']), calculateRouteInfo);
router.delete('/:id', authenticateToken, requireRole(['Admin']), deleteEmergencyRequest);

// Driver bonus and paysheet routes
router.get('/driver/:driverId/bonus-history', authenticateToken, requireRole(['Admin', 'Driver']), getDriverBonusHistory);
router.get('/driver/:driverId/paysheet', authenticateToken, requireRole(['Admin', 'Driver']), getDriverPaysheet);
router.post('/:id/create-bonus', authenticateToken, requireRole(['Admin', 'Driver']), createDriverBonusForRequest);

module.exports = router;
