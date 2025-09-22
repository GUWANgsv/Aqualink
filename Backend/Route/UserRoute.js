const express = require("express");
const router = express.Router();
const UserController = require("../Controllers/UserController");
const { authenticateToken, requireAnyManager, requireFactoryManager, requireRole } = require("../Middleware/authMiddleware");

// Public routes (no authentication required)
router.post("/register", UserController.registerUser);
router.post("/login", UserController.loginUser);

// Admin routes (Admin only)
router.post("/create-employee", authenticateToken, requireRole(['Admin']), UserController.createEmployee);

// Protected routes (authentication required)
router.get("/profile", authenticateToken, UserController.getCurrentUser);
router.put("/own-profile", authenticateToken, UserController.updateOwnProfile);
router.delete("/own-profile", authenticateToken, UserController.deleteOwnProfile);
router.get("/", authenticateToken, requireFactoryManager, UserController.getAllUsers);
router.get("/role/:role", authenticateToken, requireRole(['Admin', 'Factory Manager', 'Branch Manager']), UserController.getUsersByRole);
router.get("/:id", authenticateToken, requireFactoryManager, UserController.getUserById);

// User management routes (Factory Manager only)
router.put("/:id", authenticateToken, requireFactoryManager, UserController.updateUser);
router.put("/:id/password", authenticateToken, UserController.changePassword);
router.put("/:id/status", authenticateToken, requireRole(['Admin', 'Factory Manager']), UserController.toggleUserStatus);
router.delete("/:id", authenticateToken, requireFactoryManager, UserController.deleteUser);

// Driver salary management (Admin and Factory Manager only)
router.put("/driver/:driverId/salary", authenticateToken, requireRole(['Admin', 'Factory Manager']), UserController.updateDriverSalary);

module.exports = router;