const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const recyclingRequestSchema = new Schema({
  requestId: {
    type: String,
    unique: true,
    default: null
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  customerName: {
    type: String,
    required: true
  },
  customerEmail: {
    type: String,
    required: true
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
  wasteWeight: {
    type: Number,
    required: true,
    min: 0.1, // Minimum 100g
    max: 100 // Maximum 100kg
  },
  pointsEarned: {
    type: Number,
    min: 0,
    default: 0
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
recyclingRequestSchema.pre('save', function(next) {
  // Always generate a new requestId if it doesn't exist
  if (!this.requestId) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.random().toString(36).substr(2, 9).toUpperCase();
    
    this.requestId = `REC-${year}${month}${day}-${random}`;
    console.log('🆔 Generated requestId:', this.requestId);
  }
  
  // Calculate points based on weight (1 point per kg)
  if (this.wasteWeight && !this.pointsEarned) {
    this.pointsEarned = Math.floor(this.wasteWeight);
    console.log('🎯 Calculated points:', this.pointsEarned);
  }
  
  next();
});

module.exports = mongoose.model("RecyclingRequest", recyclingRequestSchema);
