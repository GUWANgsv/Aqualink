const mongoose = require('mongoose');

const branchSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  location: {
    type: String,
    required: true
  },
  manager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  managerName: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Maintenance'],
    default: 'Active'
  },
  capacity: {
    type: Number,
    required: true
  },
  currentStock: {
    type: Number,
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
  contactInfo: {
    phone: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    },
    address: {
      type: String,
      required: true
    }
  },
  operatingHours: {
    open: {
      type: String,
      default: '08:00'
    },
    close: {
      type: String,
      default: '18:00'
    }
  },
  services: [{
    type: String,
    enum: ['Water Supply', 'Filter Sales', 'Recycling', 'Emergency Support']
  }],
  emergencyContact: {
    name: String,
    phone: String,
    email: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient querying
branchSchema.index({ coordinates: '2dsphere' });
branchSchema.index({ status: 1 });
// Note: name field already has unique: true which creates an index automatically

// Pre-save middleware to update the updatedAt field
branchSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Branch', branchSchema);
