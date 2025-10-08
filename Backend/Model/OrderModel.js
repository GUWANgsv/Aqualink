const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const orderSchema = new Schema({
  orderNumber: {
    type: String,
    unique: true
  },
  branchName: {
    type: String,
    required: true
  },
  branchId: {
    type: String,
    required: false
  },
  branchLocation: {
    type: String,
    required: true
  },
  items: [{
    itemName: {
      type: String,
      required: true,
      enum: ['RO Membranes', 'Mud-filters', 'Mineral Cartridge', 'UV Cartridge', 'Water Pumps', '5L Water Bottles', '10L Water Bottles', '20L Water Bottles']
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    unit: {
      type: String,
      default: 'pieces'
    }
  }],
  totalQuantity: {
    type: Number
  },
  orderDate: {
    type: Date,
    default: Date.now
  },
  expectedDeliveryDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Accepted', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
    default: 'Pending'
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Urgent'],
    default: 'Medium'
  },
  notes: {
    type: String,
    required: false
  },
  contactPerson: {
    type: String,
    required: true
  },
  contactPhone: {
    type: String,
    required: true
  },
  source: {
    type: String,
    enum: ['Direct', 'Branch Request'],
    default: 'Direct'
  },
  originalBranchOrderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BranchOrder',
    default: null
  },
  acceptedDate: {
    type: Date,
    default: null
  },
  acceptedBy: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Generate order number
orderSchema.pre('save', async function(next) {
  if (this.isNew) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    // Get count of orders for today
    const todayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const todayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
    
    const count = await this.constructor.countDocuments({
      orderDate: {
        $gte: todayStart,
        $lt: todayEnd
      }
    });
    
    this.orderNumber = `ORD-${year}${month}${day}-${String(count + 1).padStart(3, '0')}`;
  }
  next();
});

// Calculate total quantity
orderSchema.pre('save', function(next) {
  this.totalQuantity = this.items.reduce((sum, item) => sum + item.quantity, 0);
  next();
});

module.exports = mongoose.model("Order", orderSchema);
