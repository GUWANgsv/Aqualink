const mongoose = require('mongoose');

const factoryWasteBinSchema = new mongoose.Schema({
  binId: {
    type: String,
    required: true,
    unique: true,
    default: 'FACTORY_MAIN_BIN'
  },
  name: {
    type: String,
    required: true,
    default: 'Factory Main Waste Collection Bin'
  },
  capacity: {
    type: Number,
    required: true,
    default: 1000 // 1000 kg capacity
  },
  currentLevel: {
    type: Number,
    required: true,
    default: 0
  },
  fillPercentage: {
    type: Number,
    required: true,
    default: 0
  },
  status: {
    type: String,
    enum: ['Active', 'Full', 'Maintenance', 'Inactive'],
    default: 'Active'
  },
  location: {
    type: String,
    required: true,
    default: 'Factory Main Collection Area'
  },
  wasteHistory: [{
    date: {
      type: Date,
      default: Date.now
    },
    sourceBranch: {
      type: String,
      required: true
    },
    sourceBranchId: {
      type: String,
      required: true
    },
    wasteWeight: {
      type: Number,
      required: true
    },
    wasteType: {
      type: String,
      enum: ['Plastic', 'Paper', 'Glass', 'Metal', 'Organic', 'Mixed'],
      required: true
    },
    collectionRequestId: {
      type: String,
      required: true
    },
    processedBy: {
      type: String,
      required: true
    }
  }],
  totalWasteCollected: {
    type: Number,
    default: 0
  },
  totalRecycled: {
    type: Number,
    default: 0
  },
  lastEmptied: {
    type: Date,
    default: Date.now
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  createdBy: {
    type: String,
    required: true,
    default: 'System'
  }
}, {
  timestamps: true
});

// Pre-save middleware to calculate fill percentage
factoryWasteBinSchema.pre('save', function(next) {
  this.fillPercentage = Math.round((this.currentLevel / this.capacity) * 100);
  
  // Update status based on fill percentage
  if (this.fillPercentage >= 100) {
    this.status = 'Full';
  } else if (this.fillPercentage >= 90) {
    this.status = 'Active'; // Keep as Active but will show as critical
  } else {
    this.status = 'Active';
  }
  
  this.lastUpdated = new Date();
  next();
});

// Static method to get or create the main factory bin
factoryWasteBinSchema.statics.getMainBin = async function() {
  let mainBin = await this.findOne({ binId: 'FACTORY_MAIN_BIN' });
  
  if (!mainBin) {
    mainBin = new this({
      binId: 'FACTORY_MAIN_BIN',
      name: 'Factory Main Waste Collection Bin',
      capacity: 1000,
      currentLevel: 0,
      totalWasteCollected: 0,
      totalRecycled: 0,
      location: 'Factory Main Collection Area',
      createdBy: 'System'
    });
    await mainBin.save();
  }
  
  return mainBin;
};

// Method to add waste to the bin
factoryWasteBinSchema.methods.addWaste = async function(wasteData) {
  const { sourceBranch, sourceBranchId, wasteWeight, wasteType, collectionRequestId, processedBy } = wasteData;
  
  // Check if bin has capacity
  if (this.currentLevel + wasteWeight > this.capacity) {
    throw new Error(`Insufficient capacity. Available: ${this.capacity - this.currentLevel} kg, Required: ${wasteWeight} kg`);
  }
  
  // Add waste to history
  this.wasteHistory.push({
    date: new Date(),
    sourceBranch,
    sourceBranchId,
    wasteWeight,
    wasteType,
    collectionRequestId,
    processedBy
  });
  
  // Update current level and total
  this.currentLevel += wasteWeight;
  this.totalWasteCollected += wasteWeight;
  
  await this.save();
  return this;
};

// Method to recycle the waste (empty bin and add to recycled total)
factoryWasteBinSchema.methods.recycleBin = async function(processedBy = 'System') {
  const recycledAmount = this.currentLevel;
  
  // Reset current level
  this.currentLevel = 0;
  this.lastEmptied = new Date();
  this.status = 'Active';
  
  // Ensure totalRecycled is initialized
  if (!this.totalRecycled) {
    this.totalRecycled = 0;
  }
  
  // Add to total recycled
  this.totalRecycled += recycledAmount;
  
  // Ensure wasteHistory is initialized
  if (!this.wasteHistory) {
    this.wasteHistory = [];
  }
  
  // Add an entry to waste history to track the recycling event
  this.wasteHistory.push({
    date: new Date(),
    sourceBranch: 'Factory Recycling System',
    sourceBranchId: 'FACTORY_RECYCLING',
    wasteWeight: recycledAmount,
    wasteType: 'Mixed',
    collectionRequestId: 'RECYCLE_' + Date.now(),
    processedBy: processedBy
  });
  
  await this.save();
  return { recycledAmount, totalRecycled: this.totalRecycled };
};

// Method to get waste statistics
factoryWasteBinSchema.methods.getStatistics = function() {
  const totalWaste = this.wasteHistory.reduce((sum, entry) => sum + (entry.wasteWeight || 0), 0);
  const wasteByType = {};
  const wasteByBranch = {};
  
  this.wasteHistory.forEach(entry => {
    // Count by waste type
    wasteByType[entry.wasteType] = (wasteByType[entry.wasteType] || 0) + (entry.wasteWeight || 0);
    
    // Count by branch
    wasteByBranch[entry.sourceBranch] = (wasteByBranch[entry.sourceBranch] || 0) + (entry.wasteWeight || 0);
  });
  
  return {
    totalWaste: totalWaste || this.totalWasteCollected || 0,
    currentLevel: this.currentLevel || 0,
    capacity: this.capacity || 1000,
    fillPercentage: this.fillPercentage || 0,
    status: this.status || 'Active',
    wasteByType,
    wasteByBranch,
    totalCollections: this.wasteHistory ? this.wasteHistory.length : 0,
    totalRecycled: this.totalRecycled || 0,
    lastEmptied: this.lastEmptied
  };
};

module.exports = mongoose.model('FactoryWasteBin', factoryWasteBinSchema);
