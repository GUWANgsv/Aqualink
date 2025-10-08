const mongoose = require('mongoose');

const factoryRequestSchema = new mongoose.Schema({
  branchId: {
    type: String,
    required: true
  },
  branchName: {
    type: String,
    required: true
  },
  items: [{
    name: {
      type: String,
      required: true
    },
    currentQuantity: {
      type: Number,
      required: true
    },
    minStockLevel: {
      type: Number,
      required: true
    },
    maxStockLevel: {
      type: Number,
      required: true
    },
    requestedQuantity: {
      type: Number,
      required: true
    },
    unit: {
      type: String,
      required: true
    }
  }],
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'fulfilled'],
    default: 'pending'
  },
  requestedAt: {
    type: Date,
    default: Date.now
  },
  approvedAt: {
    type: Date
  },
  fulfilledAt: {
    type: Date
  },
  approvedBy: {
    type: String // Factory Manager ID
  },
  notes: {
    type: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model("FactoryRequest", factoryRequestSchema);
