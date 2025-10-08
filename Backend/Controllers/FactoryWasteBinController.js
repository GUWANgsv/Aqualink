const FactoryWasteBin = require('../Model/FactoryWasteBinModel');

// Get or create the main factory waste bin
const getMainFactoryBin = async (req, res) => {
  try {
    const mainBin = await FactoryWasteBin.getMainBin();
    const statistics = mainBin.getStatistics();
    
    res.status(200).json({
      success: true,
      bin: mainBin,
      statistics: statistics
    });
  } catch (error) {
    console.error('Error getting main factory bin:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting main factory bin',
      error: error.message
    });
  }
};

// Add waste to the factory bin
const addWasteToFactoryBin = async (req, res) => {
  try {
    const { sourceBranch, sourceBranchId, wasteWeight, wasteType, collectionRequestId, processedBy } = req.body;
    
    // Validate required fields
    if (!sourceBranch || !sourceBranchId || !wasteWeight || !wasteType || !collectionRequestId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: sourceBranch, sourceBranchId, wasteWeight, wasteType, collectionRequestId'
      });
    }
    
    const mainBin = await FactoryWasteBin.getMainBin();
    
    // Add waste to the bin
    await mainBin.addWaste({
      sourceBranch,
      sourceBranchId,
      wasteWeight,
      wasteType,
      collectionRequestId,
      processedBy: processedBy || req.user?.name || 'Unknown'
    });
    
    const updatedBin = await FactoryWasteBin.getMainBin();
    const statistics = updatedBin.getStatistics();
    
    res.status(200).json({
      success: true,
      message: 'Waste added to factory bin successfully',
      bin: updatedBin,
      statistics: statistics
    });
  } catch (error) {
    console.error('Error adding waste to factory bin:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding waste to factory bin',
      error: error.message
    });
  }
};

// Recycle the factory bin (empty and add to recycled total)
const recycleFactoryBin = async (req, res) => {
  try {
    const mainBin = await FactoryWasteBin.getMainBin();
    const processedBy = req.user?.name || 'Unknown';
    
    // Check if bin has any waste to recycle
    if (mainBin.currentLevel === 0) {
      return res.status(400).json({
        success: false,
        message: 'No waste to recycle. The bin is already empty.'
      });
    }
    
    const result = await mainBin.recycleBin(processedBy);
    
    const updatedBin = await FactoryWasteBin.getMainBin();
    const statistics = updatedBin.getStatistics();
    
    console.log(`Factory bin recycled by ${processedBy}. Recycled: ${result.recycledAmount} kg, Total recycled: ${result.totalRecycled} kg`);
    
    res.status(200).json({
      success: true,
      message: `Waste recycled successfully. ${result.recycledAmount} kg processed.`,
      recycledAmount: result.recycledAmount,
      totalRecycled: result.totalRecycled,
      bin: updatedBin,
      statistics: statistics,
      recycledBy: processedBy
    });
  } catch (error) {
    console.error('Error recycling factory bin:', error);
    res.status(500).json({
      success: false,
      message: 'Error recycling factory bin',
      error: error.message
    });
  }
};

// Get factory bin statistics
const getFactoryBinStatistics = async (req, res) => {
  try {
    const mainBin = await FactoryWasteBin.getMainBin();
    const statistics = mainBin.getStatistics();
    
    res.status(200).json({
      success: true,
      statistics: statistics
    });
  } catch (error) {
    console.error('Error getting factory bin statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting factory bin statistics',
      error: error.message
    });
  }
};

// Get factory bin waste history
const getFactoryBinHistory = async (req, res) => {
  try {
    const { page = 1, limit = 50, branchId, wasteType, startDate, endDate } = req.query;
    
    const mainBin = await FactoryWasteBin.getMainBin();
    let history = mainBin.wasteHistory;
    
    // Apply filters
    if (branchId) {
      history = history.filter(entry => entry.sourceBranchId === branchId);
    }
    
    if (wasteType) {
      history = history.filter(entry => entry.wasteType === wasteType);
    }
    
    if (startDate) {
      history = history.filter(entry => entry.date >= new Date(startDate));
    }
    
    if (endDate) {
      history = history.filter(entry => entry.date <= new Date(endDate));
    }
    
    // Sort by date (newest first)
    history.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedHistory = history.slice(startIndex, endIndex);
    
    res.status(200).json({
      success: true,
      history: paginatedHistory,
      totalCount: history.length,
      currentPage: parseInt(page),
      totalPages: Math.ceil(history.length / limit)
    });
  } catch (error) {
    console.error('Error getting factory bin history:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting factory bin history',
      error: error.message
    });
  }
};



module.exports = {
  getMainFactoryBin,
  addWasteToFactoryBin,
  recycleFactoryBin,
  getFactoryBinStatistics,
  getFactoryBinHistory
};
