const RecyclingBin = require("../Model/RecyclingBinModel");

// Get all recycling bins
const getAllRecyclingBins = async (req, res) => {
  try {
    const bins = await RecyclingBin.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      bins: bins
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching recycling bins",
      error: error.message
    });
  }
};

// Get recycling bins by branch ID
const getRecyclingBinsByBranchId = async (req, res) => {
  try {
    const { branchId } = req.params;
    const bins = await RecyclingBin.find({ branchId }).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      bins: bins
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching recycling bins",
      error: error.message
    });
  }
};

// Create new recycling bin
const createRecyclingBin = async (req, res) => {
  try {
    const binData = req.body;
    
    // Generate bin ID if not provided
    if (!binData.binId) {
      const date = new Date();
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      
      const count = await RecyclingBin.countDocuments({
        branchId: binData.branchId
      });
      
      binData.binId = `BIN-${binData.branchId}-${year}${month}${day}-${String(count + 1).padStart(3, '0')}`;
    }

    const newBin = new RecyclingBin(binData);
    const savedBin = await newBin.save();

    res.status(201).json({
      success: true,
      message: "Recycling bin created successfully",
      bin: savedBin
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error creating recycling bin",
      error: error.message
    });
  }
};

// Update recycling bin
const updateRecyclingBin = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const updatedBin = await RecyclingBin.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedBin) {
      return res.status(404).json({
        success: false,
        message: "Recycling bin not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Recycling bin updated successfully",
      bin: updatedBin
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating recycling bin",
      error: error.message
    });
  }
};

// Update bin fill level
const updateBinFillLevel = async (req, res) => {
  try {
    const { id } = req.params;
    const { currentLevel, notes } = req.body;
    
    const updatedBin = await RecyclingBin.findByIdAndUpdate(
      id,
      { 
        currentLevel,
        notes: notes || undefined,
        isNotified: false // Reset notification flag
      },
      { new: true, runValidators: true }
    );

    if (!updatedBin) {
      return res.status(404).json({
        success: false,
        message: "Recycling bin not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Bin fill level updated successfully",
      bin: updatedBin
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating bin fill level",
      error: error.message
    });
  }
};

// Empty recycling bin
const emptyRecyclingBin = async (req, res) => {
  try {
    const { id } = req.params;
    
    const updatedBin = await RecyclingBin.findByIdAndUpdate(
      id,
      { 
        currentLevel: 0,
        lastEmptied: new Date(),
        isNotified: false
      },
      { new: true, runValidators: true }
    );

    if (!updatedBin) {
      return res.status(404).json({
        success: false,
        message: "Recycling bin not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Recycling bin emptied successfully",
      bin: updatedBin
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error emptying recycling bin",
      error: error.message
    });
  }
};

// Get critical bins (≥80% filled)
const getCriticalBins = async (req, res) => {
  try {
    const { branchId } = req.params;
    
    const criticalBins = await RecyclingBin.find({
      branchId: branchId,
      fillPercentage: { $gte: 80 }
    });

    res.status(200).json({
      success: true,
      criticalBins: criticalBins
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching critical bins",
      error: error.message
    });
  }
};

// Get bins that need factory notification
const getBinsForFactoryNotification = async (req, res) => {
  try {
    const bins = await RecyclingBin.find({
      fillPercentage: { $gte: 80 },
      isNotified: false
    });

    res.status(200).json({
      success: true,
      binsForNotification: bins
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching bins for notification",
      error: error.message
    });
  }
};

// Mark bin as notified
const markBinAsNotified = async (req, res) => {
  try {
    const { id } = req.params;
    
    const updatedBin = await RecyclingBin.findByIdAndUpdate(
      id,
      { isNotified: true },
      { new: true }
    );

    if (!updatedBin) {
      return res.status(404).json({
        success: false,
        message: "Recycling bin not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Bin marked as notified",
      bin: updatedBin
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error marking bin as notified",
      error: error.message
    });
  }
};

// Delete recycling bin
const deleteRecyclingBin = async (req, res) => {
  try {
    const { id } = req.params;
    
    const deletedBin = await RecyclingBin.findByIdAndDelete(id);
    
    if (!deletedBin) {
      return res.status(404).json({
        success: false,
        message: "Recycling bin not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Recycling bin deleted successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting recycling bin",
      error: error.message
    });
  }
};

// Get recycling statistics
const getRecyclingStatistics = async (req, res) => {
  try {
    const { branchId } = req.params;
    
    const totalBins = await RecyclingBin.countDocuments({ branchId });
    const criticalBins = await RecyclingBin.countDocuments({ 
      branchId, 
      fillPercentage: { $gte: 80 } 
    });
    const highBins = await RecyclingBin.countDocuments({ 
      branchId, 
      fillPercentage: { $gte: 60, $lt: 80 } 
    });
    const mediumBins = await RecyclingBin.countDocuments({ 
      branchId, 
      fillPercentage: { $gte: 40, $lt: 60 } 
    });
    const lowBins = await RecyclingBin.countDocuments({ 
      branchId, 
      fillPercentage: { $gte: 20, $lt: 40 } 
    });
    const emptyBins = await RecyclingBin.countDocuments({ 
      branchId, 
      fillPercentage: { $lt: 20 } 
    });

    const totalCapacity = await RecyclingBin.aggregate([
      { $match: { branchId: branchId } },
      { $group: { _id: null, total: { $sum: "$capacity" } } }
    ]);

    const totalCurrentLevel = await RecyclingBin.aggregate([
      { $match: { branchId: branchId } },
      { $group: { _id: null, total: { $sum: "$currentLevel" } } }
    ]);

    res.status(200).json({
      success: true,
      statistics: {
        totalBins,
        criticalBins,
        highBins,
        mediumBins,
        lowBins,
        emptyBins,
        totalCapacity: totalCapacity[0]?.total || 0,
        totalCurrentLevel: totalCurrentLevel[0]?.total || 0,
        overallFillPercentage: totalCapacity[0]?.total ? 
          ((totalCurrentLevel[0]?.total || 0) / totalCapacity[0].total) * 100 : 0
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching recycling statistics",
      error: error.message
    });
  }
};

module.exports = {
  getAllRecyclingBins,
  getRecyclingBinsByBranchId,
  createRecyclingBin,
  updateRecyclingBin,
  updateBinFillLevel,
  emptyRecyclingBin,
  getCriticalBins,
  getBinsForFactoryNotification,
  markBinAsNotified,
  deleteRecyclingBin,
  getRecyclingStatistics
};
