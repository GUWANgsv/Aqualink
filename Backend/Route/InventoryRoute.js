const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const {
  getAllInventory,
  addInventoryItem,
  getInventoryById,
  updateInventoryItem,
  deleteInventoryItem,
  updateStockQuantity,
  getInventoryStats,
  generatePDFReport,
  initializeSampleData,
  syncProductToBranch,
  addProductAndSyncToBranch
} = require("../Controllers/InventoryController");

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../../frontend/public/products');
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Generate unique filename to avoid conflicts
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    // Check if file is an image
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// GET all inventory items
router.get("/", getAllInventory);

// GET initialize sample data
router.get("/init", initializeSampleData);

// POST add new inventory item
router.post("/", addInventoryItem);

// GET inventory item by ID
router.get("/:id", getInventoryById);

// PUT update inventory item
router.put("/:id", updateInventoryItem);

// DELETE inventory item
router.delete("/:id", deleteInventoryItem);

// POST update stock quantity
router.post("/:id/stock", updateStockQuantity);

// GET inventory statistics
router.get("/stats/overview", getInventoryStats);

// GET generate PDF report
router.get("/report/pdf", generatePDFReport);

// POST sync product to branch inventory
router.post("/sync-to-branch", syncProductToBranch);

// POST add product and sync to branch in one operation (with file upload support)
router.post("/add-and-sync", upload.array('images', 10), (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 5MB per file.'
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Maximum 10 files allowed.'
      });
    }
  }
  if (err) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }
  next();
}, addProductAndSyncToBranch);

module.exports = router;
