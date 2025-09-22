const Driver = require("../Model/DriverModel");
const BranchOrder = require("../Model/BranchOrderModel");

// Get all drivers
const getAllDrivers = async (req, res) => {
  try {
    const drivers = await Driver.find().sort({ name: 1 });
    res.status(200).json({
      success: true,
      drivers: drivers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching drivers",
      error: error.message
    });
  }
};

// Get available drivers
const getAvailableDrivers = async (req, res) => {
  try {
    const drivers = await Driver.find({ 
      status: 'Available',
      isActive: true 
    }).sort({ name: 1 });
    
    res.status(200).json({
      success: true,
      drivers: drivers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching available drivers",
      error: error.message
    });
  }
};

// Create new driver
const createDriver = async (req, res) => {
  try {
    const driverData = req.body;
    
    // Generate driver ID if not provided
    if (!driverData.driverId) {
      const date = new Date();
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      
      const count = await Driver.countDocuments();
      
      driverData.driverId = `DRV-${year}${month}${day}-${String(count + 1).padStart(3, '0')}`;
    }

    const newDriver = new Driver(driverData);
    const savedDriver = await newDriver.save();

    res.status(201).json({
      success: true,
      message: "Driver created successfully",
      driver: savedDriver
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error creating driver",
      error: error.message
    });
  }
};

// Update driver
const updateDriver = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const updatedDriver = await Driver.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedDriver) {
      return res.status(404).json({
        success: false,
        message: "Driver not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Driver updated successfully",
      driver: updatedDriver
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating driver",
      error: error.message
    });
  }
};

// Update driver status
const updateDriverStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, currentLocation } = req.body;
    
    const updatedDriver = await Driver.findByIdAndUpdate(
      id,
      { status, currentLocation },
      { new: true }
    );

    if (!updatedDriver) {
      return res.status(404).json({
        success: false,
        message: "Driver not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Driver status updated successfully",
      driver: updatedDriver
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating driver status",
      error: error.message
    });
  }
};

// Get driver assignments
const getDriverAssignments = async (req, res) => {
  try {
    const { id } = req.params;
    
    const driver = await Driver.findById(id).populate('assignedOrders');
    
    if (!driver) {
      return res.status(404).json({
        success: false,
        message: "Driver not found"
      });
    }

    res.status(200).json({
      success: true,
      driver: driver
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching driver assignments",
      error: error.message
    });
  }
};

// Remove order from driver
const removeOrderFromDriver = async (req, res) => {
  try {
    const { driverId, orderId } = req.params;
    
    const updatedDriver = await Driver.findByIdAndUpdate(
      driverId,
      {
        $pull: { assignedOrders: orderId },
        status: 'Available'
      },
      { new: true }
    );

    if (!updatedDriver) {
      return res.status(404).json({
        success: false,
        message: "Driver not found"
      });
    }

    // Update order to remove driver assignment
    await BranchOrder.findByIdAndUpdate(
      orderId,
      { 
        assignedDriver: null,
        status: 'Pending'
      }
    );

    res.status(200).json({
      success: true,
      message: "Order removed from driver successfully",
      driver: updatedDriver
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error removing order from driver",
      error: error.message
    });
  }
};

// Delete driver
const deleteDriver = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if driver has active assignments
    const driver = await Driver.findById(id);
    if (driver && driver.assignedOrders.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete driver with active assignments"
      });
    }
    
    const deletedDriver = await Driver.findByIdAndDelete(id);
    
    if (!deletedDriver) {
      return res.status(404).json({
        success: false,
        message: "Driver not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Driver deleted successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting driver",
      error: error.message
    });
  }
};

// Get drivers by branch ID
const getDriversByBranchId = async (req, res) => {
  try {
    const { branchId } = req.params;
    
    const drivers = await Driver.find({ branchId: branchId }).sort({ name: 1 });
    
    res.status(200).json({
      success: true,
      drivers: drivers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching drivers by branch",
      error: error.message
    });
  }
};

// Get driver statistics
const getDriverStatistics = async (req, res) => {
  try {
    const totalDrivers = await Driver.countDocuments();
    const availableDrivers = await Driver.countDocuments({ status: 'Available' });
    const onDeliveryDrivers = await Driver.countDocuments({ status: 'On Delivery' });
    const offDutyDrivers = await Driver.countDocuments({ status: 'Off Duty' });
    const activeDrivers = await Driver.countDocuments({ isActive: true });

    const topDrivers = await Driver.find()
      .sort({ totalDeliveries: -1 })
      .limit(5)
      .select('name totalDeliveries rating');

    const averageRating = await Driver.aggregate([
      { $group: { _id: null, avgRating: { $avg: "$rating" } } }
    ]);

    res.status(200).json({
      success: true,
      statistics: {
        totalDrivers,
        availableDrivers,
        onDeliveryDrivers,
        offDutyDrivers,
        activeDrivers,
        topDrivers,
        averageRating: averageRating[0]?.avgRating || 0
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching driver statistics",
      error: error.message
    });
  }
};

module.exports = {
  getAllDrivers,
  getAvailableDrivers,
  getDriversByBranchId,
  createDriver,
  updateDriver,
  updateDriverStatus,
  getDriverAssignments,
  removeOrderFromDriver,
  deleteDriver,
  getDriverStatistics
};
