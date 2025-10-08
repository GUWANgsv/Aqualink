const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const customerPurchaseSchema = new Schema({
  purchaseNumber: {
    type: String,
    unique: true
  },
  customerId: {
    type: String,
    required: false
  },
  customerName: {
    type: String,
    required: true
  },
  customerEmail: {
    type: String,
    required: true
  },
  customerPhone: {
    type: String,
    required: true
  },
  branchId: {
    type: String,
    required: true
  },
  branchName: {
    type: String,
    required: true
  },
  items: [{
    itemName: {
      type: String,
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0
    },
    totalPrice: {
      type: Number,
      required: true,
      min: 0
    }
  }],
  totalQuantity: {
    type: Number,
    required: true
  },
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  tax: {
    type: Number,
    default: 0,
    min: 0
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  purchaseDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['Pending', 'Processing', 'Assigned', 'On Delivery', 'Delivered', 'Cancelled', 'Refunded'],
    default: 'Pending'
  },
  paymentMethod: {
    type: String,
    enum: ['Cash', 'Card', 'Online', 'Bank Transfer'],
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Paid', 'Failed', 'Refunded'],
    default: 'Pending'
  },
  deliveryAddress: {
    street: String,
    city: String,
    postalCode: String,
    country: {
      type: String,
      default: 'Sri Lanka'
    }
  },
  notes: {
    type: String,
    required: false
  },
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  processedDate: {
    type: Date,
    default: null
  },
  assignedDriver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  assignedDate: {
    type: Date,
    default: null
  },
  deliveryStartTime: {
    type: Date,
    default: null
  },
  deliveryEndTime: {
    type: Date,
    default: null
  },
  deliveryNotes: {
    type: String,
    required: false
  }
}, {
  timestamps: true
});

// Generate purchase number
customerPurchaseSchema.pre('save', async function(next) {
  if (this.isNew) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    // Get count of purchases for today
    const todayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const todayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
    
    const count = await this.constructor.countDocuments({
      purchaseDate: {
        $gte: todayStart,
        $lt: todayEnd
      }
    });
    
    this.purchaseNumber = `PUR-${year}${month}${day}-${String(count + 1).padStart(3, '0')}`;
  }
  next();
});

// Calculate total quantity and amounts
customerPurchaseSchema.pre('save', function(next) {
  this.totalQuantity = this.items.reduce((sum, item) => sum + item.quantity, 0);
  this.subtotal = this.items.reduce((sum, item) => sum + item.totalPrice, 0);
  this.totalAmount = this.subtotal + this.tax;
  next();
});

module.exports = mongoose.model("CustomerPurchase", customerPurchaseSchema);
