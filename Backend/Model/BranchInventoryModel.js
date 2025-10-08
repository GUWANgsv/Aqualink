const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const branchInventorySchema = new Schema({
  branchId: {
    type: String,
    required: true
  },
  branchName: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  unit: {
    type: String,
    required: true,
    default: 'pieces'
  },
  minStockLevel: {
    type: Number,
    required: true,
    default: 10
  },
  maxStockLevel: {
    type: Number,
    required: true,
    default: 100
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['In Stock', 'Low Stock', 'Out of Stock'],
    default: 'In Stock'
  },
  // New product details fields
  price: {
    type: Number,
    required: true,
    min: 0
  },
  originalPrice: {
    type: Number,
    required: false,
    min: 0
  },
  description: {
    type: String,
    required: true
  },
  longDescription: {
    type: String,
    required: false
  },
  category: {
    type: String,
    required: true
  },
  image: {
    type: String,
    required: false,
    default: '/product-default.jpg'
  },
  images: [{
    type: String
  }],
  warranty: {
    type: String,
    required: false,
    default: '1 Year'
  },
  rating: {
    type: Number,
    required: false,
    default: 4.0,
    min: 0,
    max: 5
  },
  reviews: {
    type: Number,
    required: false,
    default: 0,
    min: 0
  },
  specifications: {
    type: Map,
    of: String,
    required: false
  },
  features: [{
    type: String
  }]
}, {
  timestamps: true
});

// Update status based on quantity
branchInventorySchema.pre('save', function(next) {
  if (this.quantity <= 0) {
    this.status = 'Out of Stock';
  } else if (this.quantity <= this.minStockLevel) {
    this.status = 'Low Stock';
  } else {
    this.status = 'In Stock';
  }
  this.lastUpdated = new Date();
  next();
});

module.exports = mongoose.model("BranchInventory", branchInventorySchema);
