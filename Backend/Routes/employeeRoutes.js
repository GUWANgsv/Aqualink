const express = require('express');
const router = express.Router();
const User = require('../Model/UserModel');
const { authenticateToken, requireRole } = require('../Middleware/authMiddleware');

// Get drivers by branch (Branch Manager only)
router.get('/drivers/branch/:branchName', authenticateToken, requireRole(['Admin', 'Branch Manager']), async (req, res) => {
  try {
    const { branchName } = req.params;
    console.log('🔍 Fetching drivers for branch:', branchName);
    
    // Try multiple branch field matches
    const drivers = await User.find({ 
      role: 'Driver', 
      $or: [
        { branch: branchName },
        { branchName: branchName },
        { branchId: branchName }
      ],
      isActive: true 
    }).select('-password').sort({ name: 1 });
    
    console.log('📡 Found drivers:', drivers.length);
    drivers.forEach(driver => {
      console.log(`- ${driver.name} (${driver.email}): branch=${driver.branch}, branchName=${driver.branchName}, branchId=${driver.branchId}, status=${driver.driverStatus}`);
    });
    
    res.status(200).json({
      success: true,
      drivers: drivers
    });
  } catch (error) {
    console.error('Error fetching drivers by branch:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching drivers by branch',
      error: error.message
    });
  }
});

// Update driver status (Branch Manager/Admin only)
router.put('/drivers/:driverId/status', authenticateToken, requireRole(['Admin', 'Branch Manager']), async (req, res) => {
  try {
    const { driverId } = req.params;
    const { driverStatus } = req.body;
    
    const driver = await User.findOneAndUpdate(
      { _id: driverId, role: 'Driver' },
      { driverStatus },
      { new: true }
    ).select('-password');
    
    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Driver not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Driver status updated successfully',
      driver: driver
    });
  } catch (error) {
    console.error('Error updating driver status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating driver status',
      error: error.message
    });
  }
});

// Update own driver status (Driver only)
router.put('/drivers/own-status', authenticateToken, requireRole('Driver'), async (req, res) => {
  try {
    const { driverStatus } = req.body;
    const driverId = req.user._id; // Get driver ID from authenticated user object
    
    const driver = await User.findOneAndUpdate(
      { _id: driverId, role: 'Driver' },
      { driverStatus },
      { new: true }
    ).select('-password');
    
    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Driver not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Your status updated successfully',
      driver: driver
    });
  } catch (error) {
    console.error('Error updating driver status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating driver status',
      error: error.message
    });
  }
});

// Get all employees (Admin only)
router.get('/', authenticateToken, requireRole(['Admin']), async (req, res) => {
  try {
    const employees = await User.find({
      role: { $in: ['Branch Manager', 'Factory Manager', 'Driver'] }
    }).select('-password').sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      data: employees
    });
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching employees',
      error: error.message
    });
  }
});

// Get employee by ID (Admin only)
router.get('/:id', authenticateToken, requireRole(['Admin']), async (req, res) => {
  try {
    const employee = await User.findById(req.params.id).select('-password');
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }
    
    // Check if user is an employee
    if (!['Branch Manager', 'Factory Manager', 'Driver'].includes(employee.role)) {
      return res.status(403).json({
        success: false,
        message: 'User is not an employee'
      });
    }
    
    res.status(200).json({
      success: true,
      data: employee
    });
  } catch (error) {
    console.error('Error fetching employee:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching employee',
      error: error.message
    });
  }
});

// Create new employee (Admin only)
router.post('/', authenticateToken, requireRole(['Admin']), async (req, res) => {
  try {
    const { name, email, password, role, phone, branch, address, salary, status, driverId, vehicleType, vehicleNumber, licenseNumber, driverStatus } = req.body;
    
    console.log('Creating employee with data:', { name, email, role, phone, branch, address, salary, status });
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }
    
    // Validate role
    if (!['Branch Manager', 'Factory Manager', 'Driver'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be Branch Manager, Factory Manager, or Driver'
      });
    }
    
    // Prepare employee data based on role
    const employeeData = {
      name,
      email,
      password,
      role,
      phone,
      address,
      salary: salary || (role === 'Driver' ? 45000 : null),
      isActive: status === 'Active' ? true : false
    };
    
    // Add role-specific fields
    if (role === 'Branch Manager') {
      employeeData.branchId = branch;
      employeeData.branchName = branch;
      employeeData.branchLocation = address || 'Not specified';
    } else if (role === 'Driver') {
      // For drivers, use provided fields or set defaults
      employeeData.driverId = driverId || `DRIVER_${Date.now()}`;
      employeeData.vehicleType = vehicleType || 'Not specified';
      employeeData.vehicleNumber = vehicleNumber || 'Not specified';
      employeeData.licenseNumber = licenseNumber || 'Not specified';
      employeeData.driverStatus = driverStatus || 'Available';
      // Add branch information for drivers too
      if (branch) {
        employeeData.branchName = branch;
        employeeData.branch = branch;
      }
    } else if (role === 'Factory Manager') {
      // Add branch information for factory managers too
      if (branch) {
        employeeData.branchName = branch;
        employeeData.branch = branch;
      }
    }
    
    // Add branch information for all roles if provided
    if (branch) {
      employeeData.branchName = branch;
      employeeData.branch = branch;
    }
    
    console.log('Final employee data:', employeeData);
    
    const newEmployee = new User(employeeData);
    await newEmployee.save();
    
    const employeeResponse = newEmployee.toObject();
    delete employeeResponse.password;
    
    console.log('Employee created successfully:', employeeResponse);
    
    res.status(201).json({
      success: true,
      message: 'Employee created successfully',
      data: employeeResponse
    });
  } catch (error) {
    console.error('Error creating employee:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating employee',
      error: error.message
    });
  }
});

// Update employee (Admin only)
router.put('/:id', authenticateToken, requireRole(['Admin']), async (req, res) => {
  try {
    const { name, email, role, phone, branch, address, salary, status } = req.body;
    
    console.log('Updating employee with data:', { name, email, role, phone, branch, address, salary, status });
    
    // Check if employee exists
    const existingEmployee = await User.findById(req.params.id);
    if (!existingEmployee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    // Check if email is being changed and if it already exists
    if (email && email !== existingEmployee.email) {
      const emailExists = await User.findOne({ email, _id: { $ne: req.params.id } });
      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: 'Email already exists'
        });
      }
    }

    // Validate role
    if (role && !['Branch Manager', 'Factory Manager', 'Driver'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be Branch Manager, Factory Manager, or Driver'
      });
    }

    // Prepare update data
    const updateData = {};
    
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (role) updateData.role = role;
    if (phone) updateData.phone = phone;
    if (address) updateData.address = address;
    if (salary) updateData.salary = salary;
    if (status) updateData.isActive = status === 'Active' ? true : false;

    // Add role-specific fields
    if (role === 'Branch Manager') {
      updateData.branchId = branch;
      updateData.branchName = branch;
      updateData.branchLocation = address || 'Not specified';
    } else if (role === 'Driver') {
      // For drivers, we need to generate or provide driver-specific fields
      updateData.driverId = existingEmployee.driverId || `DRIVER_${Date.now()}`;
      updateData.vehicleType = existingEmployee.vehicleType || 'Not specified';
      updateData.vehicleNumber = existingEmployee.vehicleNumber || 'Not specified';
      updateData.licenseNumber = existingEmployee.licenseNumber || 'Not specified';
      // Add branch information for drivers too
      if (branch) {
        updateData.branchName = branch;
        updateData.branch = branch;
      }
    } else if (role === 'Factory Manager') {
      // Add branch information for factory managers too
      if (branch) {
        updateData.branchName = branch;
        updateData.branch = branch;
      }
    }
    
    // Add branch information for all roles if provided
    if (branch) {
      updateData.branchName = branch;
      updateData.branch = branch;
    }

    console.log('Final update data:', updateData);

    const updatedEmployee = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).select('-password');

    if (!updatedEmployee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    console.log('Employee updated successfully:', updatedEmployee);

    res.status(200).json({
      success: true,
      message: 'Employee updated successfully',
      data: updatedEmployee
    });
  } catch (error) {
    console.error('Error updating employee:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating employee',
      error: error.message
    });
  }
});

// Delete employee (Admin only)
router.delete('/:id', authenticateToken, requireRole(['Admin']), async (req, res) => {
  try {
    const deletedEmployee = await User.findByIdAndDelete(req.params.id);
    if (!deletedEmployee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Employee deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting employee:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting employee',
      error: error.message
    });
  }
});

module.exports = router;
