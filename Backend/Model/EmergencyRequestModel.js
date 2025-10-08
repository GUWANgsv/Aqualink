const mongoose = require('mongoose');

const emergencyRequestSchema = new mongoose.Schema({
  brigadeId: {
    type: String,
    required: true
  },
  brigadeName: {
    type: String,
    required: true
  },
  brigadeLocation: {
    type: String,
    required: true
  },
  requestType: {
    type: String,
    enum: ['Emergency Water Supply', 'Fire Control', 'Disaster Relief'],
    default: 'Emergency Water Supply'
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium'
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Approved - Sent to Branch Manager', 'Rejected', 'In Progress', 'Completed'],
    default: 'Pending'
  },
  waterLevel: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  coordinates: {
    lat: {
      type: Number,
      required: true
    },
    lng: {
      type: Number,
      required: true
    }
  },
  requestDate: {
    type: Date,
    default: Date.now
  },
  responseDate: {
    type: Date
  },
  assignedBranch: {
    type: mongoose.Schema.Types.Mixed, // Allow both string and ObjectId
    ref: 'Branch'
  },
  assignedDriver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  adminNotes: {
    type: String
  },
  estimatedDeliveryTime: {
    type: Date
  },
  actualDeliveryTime: {
    type: Date
  },
  driverNotes: {
    type: String
  },
  bonusEligible: {
    type: Boolean,
    default: true
  },
  bonusAmount: {
    type: Number,
    default: 5000 // 5000 LKR bonus for emergency water supply
  },
  bonusStatus: {
    type: String,
    enum: ['Not Eligible', 'Eligible', 'Bonus Created', 'Bonus Paid'],
    default: 'Eligible'
  }
}, {
  timestamps: true
});

// Index for efficient querying
emergencyRequestSchema.index({ status: 1, requestDate: -1 });
emergencyRequestSchema.index({ coordinates: '2dsphere' });

module.exports = mongoose.model('EmergencyRequest', emergencyRequestSchema);
