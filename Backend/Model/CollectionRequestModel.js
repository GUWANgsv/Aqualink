const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const collectionRequestSchema = new Schema({
  requestId: {
    type: String,
    unique: true,
    default: null
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
  branchLocation: {
    type: String,
    required: true
  },
  binId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RecyclingBin',
    required: true
  },
  currentLevel: {
    type: Number,
    required: true
  },
  capacity: {
    type: Number,
    required: true
  },
  fillPercentage: {
    type: Number,
    required: true
  },
  requestType: {
    type: String,
    enum: ['Empty Bin', '90% Full'],
    required: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected', 'Completed'],
    default: 'Pending'
  },
  requestDate: {
    type: Date,
    default: Date.now
  },
  approvedDate: {
    type: Date
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  completedDate: {
    type: Date
  },
  notes: {
    type: String
  },
  isNotified: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Generate request ID before saving
collectionRequestSchema.pre('save', function(next) {
  if (!this.requestId) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.random().toString(36).substr(2, 9).toUpperCase();
    
    this.requestId = `COL-${year}${month}${day}-${random}`;
    console.log('🆔 Generated collection requestId:', this.requestId);
  }
  next();
});

module.exports = mongoose.model("CollectionRequest", collectionRequestSchema);
