const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const recyclingBinSchema = new Schema({
  binId: {
    type: String,
    required: true,
    unique: true
  },
  branchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    required: true
  },
  branchName: {
    type: String,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  capacity: {
    type: Number,
    required: true,
    default: 100 // in kg
  },
  currentLevel: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  fillPercentage: {
    type: Number,
    default: 0
  },
  lastEmptied: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['Empty', 'Low', 'Medium', 'High', 'Critical'],
    default: 'Empty'
  },
  isNotified: {
    type: Boolean,
    default: false
  },
  notes: {
    type: String
  }
}, {
  timestamps: true
});

// Calculate fill percentage and update status
recyclingBinSchema.pre('save', function(next) {
  this.fillPercentage = (this.currentLevel / this.capacity) * 100;
  
  if (this.fillPercentage >= 80) {
    this.status = 'Critical';
    this.isNotified = true;
  } else if (this.fillPercentage >= 60) {
    this.status = 'High';
  } else if (this.fillPercentage >= 40) {
    this.status = 'Medium';
  } else if (this.fillPercentage >= 20) {
    this.status = 'Low';
  } else {
    this.status = 'Empty';
  }
  
  next();
});

module.exports = mongoose.model("RecyclingBin", recyclingBinSchema);
