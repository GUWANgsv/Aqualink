const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const driverSchema = new Schema({
  driverId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  vehicleNumber: {
    type: String,
    required: true
  },
  vehicleType: {
    type: String,
    enum: ['Van', 'Truck', 'Motorcycle'],
    default: 'Van'
  },
  status: {
    type: String,
    enum: ['Available', 'On Delivery', 'Off Duty'],
    default: 'Available'
  },
  currentLocation: {
    type: String,
    default: 'Branch'
  },
  assignedOrders: [{
    type: Schema.Types.ObjectId,
    ref: 'BranchOrder'
  }],
  totalDeliveries: {
    type: Number,
    default: 0
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    default: 5
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model("Driver", driverSchema);
