const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Schema = mongoose.Schema;

const userSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    role: {
        type: String,
        required: true,
        enum: ['Factory Manager', 'Customer', 'Driver', 'Admin', 'Branch Manager', 'Fire Brigade'],
        default: 'Customer'
    },
    // Branch information for all roles
    branch: {
        type: String,
        required: false
    },
    // Branch Manager specific fields
    branchId: {
        type: String,
        required: function() {
            return this.role === 'Branch Manager';
        }
    },
    branchName: {
        type: String,
        required: false // Make it optional for all roles
    },
    branchLocation: {
        type: String,
        required: function() {
            return this.role === 'Branch Manager';
        }
    },
    // Driver specific fields
    driverId: {
        type: String,
        required: function() {
            return this.role === 'Driver';
        }
    },
    vehicleType: {
        type: String,
        required: function() {
            return this.role === 'Driver';
        }
    },
    vehicleNumber: {
        type: String,
        required: function() {
            return this.role === 'Driver';
        }
    },
    licenseNumber: {
        type: String,
        required: function() {
            return this.role === 'Driver';
        }
    },
    // Driver status field
    driverStatus: {
        type: String,
        enum: ['Available', 'On Delivery', 'Off Duty', 'On Leave'],
        default: 'Available',
        required: function() {
            return this.role === 'Driver';
        }
    },
    // Customer specific fields
    phone: {
        type: String,
        required: function() {
            return this.role === 'Customer' || this.role === 'Fire Brigade';
        }
    },
    address: {
        type: String,
        required: function() {
            return this.role === 'Customer';
        }
    },
    // Fire Brigade specific fields
    brigadeId: {
        type: String,
        required: function() {
            return this.role === 'Fire Brigade';
        }
    },
    brigadeName: {
        type: String,
        required: function() {
            return this.role === 'Fire Brigade';
        }
    },
    brigadeLocation: {
        type: String,
        required: function() {
            return this.role === 'Fire Brigade';
        }
    },
    emergencyContact: {
        type: String,
        required: false // Optional field for fire brigade
    },
    // Recycling system fields
    recyclingPoints: {
        type: Number,
        default: 0,
        min: 0
    },
    recyclingHistory: [{
        date: {
            type: Date,
            default: Date.now
        },
        branchId: String,
        branchName: String,
        weight: Number,
        pointsEarned: Number,
        status: {
            type: String,
            enum: ['Pending', 'Approved', 'Rejected'],
            default: 'Pending'
        }
    }],
    // Common fields
    salary: {
        type: Number,
        required: false
    },
    isActive: {
        type: Boolean,
        default: true
    },
    lastLogin: {
        type: Date,
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Update timestamp on save
userSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Method to get user without password
userSchema.methods.toJSON = function() {
    const userObject = this.toObject();
    delete userObject.password;
    return userObject;
};

module.exports = mongoose.model("User", userSchema);