const User = require("../Model/UserModel");
const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../Middleware/authMiddleware");

// Generate JWT Token
const generateToken = (userId) => {
    return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '24h' });
};

// POST: User Registration
const registerUser = async (req, res) => {
    try {
        const { 
            name, 
            email, 
            password, 
            role, 
            phone,
            address,
            branchId, 
            branchName, 
            branchLocation,
            brigadeId,
            brigadeName,
            brigadeLocation,
            vehicleNumber,
            emergencyContact
        } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User with this email already exists" });
        }

        // Create new user with basic data
        const userData = {
            name,
            email,
            password,
            role
        };

        // Add role-specific fields
        if (role === 'Branch Manager') {
            if (!branchId || !branchName || !branchLocation) {
                return res.status(400).json({ 
                    message: "Branch ID, Branch Name, and Branch Location are required for Branch Managers" 
                });
            }
            userData.branchId = branchId;
            userData.branchName = branchName;
            userData.branchLocation = branchLocation;
        }

        if (role === 'Customer') {
            if (!phone || !address) {
                return res.status(400).json({ 
                    message: "Phone and Address are required for Customers" 
                });
            }
            userData.phone = phone;
            userData.address = address;
        }

        if (role === 'Fire Brigade') {
            if (!phone || !brigadeId || !brigadeName || !brigadeLocation || !vehicleNumber) {
                return res.status(400).json({ 
                    message: "Phone, Brigade ID, Brigade Name, Brigade Location, and Vehicle Number are required for Fire Brigade" 
                });
            }
            userData.phone = phone;
            userData.brigadeId = brigadeId;
            userData.brigadeName = brigadeName;
            userData.brigadeLocation = brigadeLocation;
            userData.vehicleNumber = vehicleNumber;
            if (emergencyContact) {
                userData.emergencyContact = emergencyContact;
            }
        }

        const newUser = new User(userData);
        await newUser.save();

        // Generate token
        const token = generateToken(newUser._id);

        res.status(201).json({
            message: "User registered successfully",
            user: newUser.toJSON(),
            token
        });

    } catch (error) {
        console.error('Registration error:', error);
        if (error.code === 11000) {
            return res.status(400).json({ message: "Email already exists" });
        }
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: "Internal server error" });
    }
};

// POST: Admin creates employee (no token generation)
const createEmployee = async (req, res) => {
    try {
        const { 
            name, 
            email, 
            password, 
            role, 
            phone,
            address,
            branchId, 
            branchName, 
            branchLocation,
            salary,
            driverId,
            vehicleType,
            vehicleNumber,
            licenseNumber
        } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User with this email already exists" });
        }

        // Validate role
        const validRoles = ['Branch Manager', 'Factory Manager', 'Driver'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({ message: "Invalid role. Must be Branch Manager, Factory Manager, or Driver" });
        }

        // Create new user with basic data
        const userData = {
            name,
            email,
            password,
            role,
            phone,
            address,
            salary
        };

        // Add role-specific fields
        if (role === 'Branch Manager') {
            if (!branchId || !branchName || !branchLocation) {
                return res.status(400).json({ 
                    message: "Branch ID, Branch Name, and Branch Location are required for Branch Managers" 
                });
            }
            userData.branchId = branchId;
            userData.branchName = branchName;
            userData.branchLocation = branchLocation;
        }

        if (role === 'Driver') {
            if (!driverId || !vehicleType || !vehicleNumber || !licenseNumber) {
                return res.status(400).json({ 
                    message: "Driver ID, Vehicle Type, Vehicle Number, and License Number are required for Drivers" 
                });
            }
            userData.driverId = driverId;
            userData.vehicleType = vehicleType;
            userData.vehicleNumber = vehicleNumber;
            userData.licenseNumber = licenseNumber;
        }

        const newUser = new User(userData);
        await newUser.save();

        res.status(201).json({
            message: "Employee created successfully",
            user: newUser.toJSON()
        });

    } catch (error) {
        console.error('Employee creation error:', error);
        if (error.code === 11000) {
            return res.status(400).json({ message: "Email already exists" });
        }
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: "Internal server error" });
    }
};

// POST: User Login
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        // Check if user is active
        if (!user.isActive) {
            return res.status(401).json({ message: "Account is deactivated" });
        }

        // Verify password
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        // Update last login
        user.lastLogin = new Date();
        await user.save();

        // Generate token
        const token = generateToken(user._id);

        res.status(200).json({
            message: "Login successful",
            user: user.toJSON(),
            token
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// GET: Get current user profile
const getCurrentUser = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        res.status(200).json({ user });
    } catch (error) {
        console.error('Get current user error:', error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// GET: Get all users (Admin only)
const getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.status(200).json({ users });
    } catch (error) {
        console.error('Get all users error:', error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// GET: Get user by ID
const getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.status(200).json({ user });
    } catch (error) {
        console.error('Get user by ID error:', error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// PUT: Update user profile
const updateUser = async (req, res) => {
    try {
        const { name, email, branchId, branchName, branchLocation, salary } = req.body;
        const userId = req.params.id;

        // Check if user exists
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Update fields
        const updateData = { name, email };
        
        // Update branch information for Branch Managers
        if (user.role === 'Branch Manager') {
            updateData.branchId = branchId;
            updateData.branchName = branchName;
            updateData.branchLocation = branchLocation;
        }

        // Update salary if provided
        if (salary !== undefined) {
            updateData.salary = salary;
        }

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            updateData,
            { new: true, runValidators: true }
        ).select('-password');

        res.status(200).json({ 
            message: "User updated successfully",
            user: updatedUser 
        });

    } catch (error) {
        console.error('Update user error:', error);
        if (error.code === 11000) {
            return res.status(400).json({ message: "Email already exists" });
        }
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: "Internal server error" });
    }
};

// PUT: Update driver salary
const updateDriverSalary = async (req, res) => {
    try {
        const { driverId } = req.params;
        const { salary } = req.body;

        // Validate salary
        if (!salary || salary <= 0) {
            return res.status(400).json({ message: "Valid salary amount is required" });
        }

        // Check if user exists and is a driver
        const user = await User.findById(driverId);
        if (!user) {
            return res.status(404).json({ message: "Driver not found" });
        }

        if (user.role !== 'Driver') {
            return res.status(400).json({ message: "User is not a driver" });
        }

        // Update salary
        const updatedUser = await User.findByIdAndUpdate(
            driverId,
            { salary: salary },
            { new: true, runValidators: true }
        ).select('-password');

        res.status(200).json({ 
            message: "Driver salary updated successfully",
            user: updatedUser 
        });

    } catch (error) {
        console.error('Update driver salary error:', error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: "Internal server error" });
    }
};

// PUT: Change password
const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.params.id;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Verify current password
        const isCurrentPasswordValid = await user.comparePassword(currentPassword);
        if (!isCurrentPasswordValid) {
            return res.status(400).json({ message: "Current password is incorrect" });
        }

        // Update password
        user.password = newPassword;
        await user.save();

        res.status(200).json({ message: "Password changed successfully" });

    } catch (error) {
        console.error('Change password error:', error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: "Internal server error" });
    }
};

// PUT: Toggle user active status
const toggleUserStatus = async (req, res) => {
    try {
        const userId = req.params.id;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        user.isActive = !user.isActive;
        await user.save();

        res.status(200).json({ 
            message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
            user: user.toJSON()
        });

    } catch (error) {
        console.error('Toggle user status error:', error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// DELETE: Delete user
const deleteUser = async (req, res) => {
    try {
        const userId = req.params.id;

        const user = await User.findByIdAndDelete(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({ 
            message: "User deleted successfully",
            user: user.toJSON()
        });

    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// GET: Get users by role
const getUsersByRole = async (req, res) => {
    try {
        const { role } = req.params;
        
        if (!['Branch Manager', 'Factory Manager', 'Driver', 'Customer', 'Fire Brigade'].includes(role)) {
            return res.status(400).json({ message: "Invalid role" });
        }

        const users = await User.find({ role }).select('-password');
        res.status(200).json({ users });

    } catch (error) {
        console.error('Get users by role error:', error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// PUT: Update own profile
const updateOwnProfile = async (req, res) => {
    try {
        const { name, email, phone, address, vehicleNumber } = req.body;
        const userId = req.user._id; // Get user ID from authenticated user object

        // Check if user exists
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Update fields
        const updateData = {};
        if (name) updateData.name = name;
        if (email) updateData.email = email;
        if (phone) updateData.phone = phone;
        if (address) updateData.address = address;
        if (vehicleNumber) updateData.vehicleNumber = vehicleNumber;

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            updateData,
            { new: true, select: '-password' }
        );

        res.status(200).json({
            message: "Profile updated successfully",
            user: updatedUser
        });
    } catch (error) {
        console.error("Error updating profile:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// DELETE: Delete own profile
const deleteOwnProfile = async (req, res) => {
    try {
        const userId = req.user._id; // Get user ID from authenticated user object

        // Check if user exists
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Delete the user
        await User.findByIdAndDelete(userId);

        res.status(200).json({
            message: "Profile deleted successfully"
        });
    } catch (error) {
        console.error("Error deleting profile:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

module.exports = {
    registerUser,
    createEmployee,
    loginUser,
    getCurrentUser,
    getAllUsers,
    getUserById,
    updateUser,
    updateOwnProfile,
    deleteOwnProfile,
    updateDriverSalary,
    changePassword,
    toggleUserStatus,
    deleteUser,
    getUsersByRole
};