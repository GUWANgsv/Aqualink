const express = require('express');
const router = express.Router();
const {
  getMainFactoryBin,
  addWasteToFactoryBin,
  recycleFactoryBin,
  getFactoryBinStatistics,
  getFactoryBinHistory
} = require('../Controllers/FactoryWasteBinController');

// Get or create the main factory waste bin
router.get('/', getMainFactoryBin);

// Get factory bin statistics
router.get('/statistics', getFactoryBinStatistics);

// Get factory bin waste history with optional filters
router.get('/history', getFactoryBinHistory);

// Add waste to the factory bin
router.post('/add-waste', addWasteToFactoryBin);

// Recycle the factory bin (empty and add to recycled total)
router.post('/recycle', recycleFactoryBin);

module.exports = router;
