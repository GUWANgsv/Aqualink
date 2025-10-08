const mongoose = require('mongoose');

const driverBonusSchema = new mongoose.Schema({
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  emergencyRequestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EmergencyRequest',
    required: true
  },
  bonusAmount: {
    type: Number,
    required: true,
    default: 5000 // 5000 LKR per emergency delivery
  },
  bonusType: {
    type: String,
    enum: ['Emergency Water Supply', 'Fire Control', 'Disaster Relief'],
    default: 'Emergency Water Supply'
  },
  brigadeName: {
    type: String,
    required: true
  },
  brigadeLocation: {
    type: String,
    required: true
  },
  deliveryDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Paid'],
    default: 'Approved'
  },
  paymentDate: {
    type: Date
  },
  month: {
    type: Number,
    required: true,
    min: 1,
    max: 12
  },
  year: {
    type: Number,
    required: true
  },
  notes: {
    type: String
  }
}, {
  timestamps: true
});

// Index for efficient querying
driverBonusSchema.index({ driverId: 1, month: 1, year: 1 });
driverBonusSchema.index({ emergencyRequestId: 1 });
driverBonusSchema.index({ status: 1 });

// Virtual for formatted bonus amount
driverBonusSchema.virtual('formattedAmount').get(function() {
  return `Rs. ${this.bonusAmount.toLocaleString()}`;
});

// Ensure virtual fields are serialized
driverBonusSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('DriverBonus', driverBonusSchema);
