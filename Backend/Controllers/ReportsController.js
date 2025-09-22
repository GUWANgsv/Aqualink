const BranchOrder = require('../Model/BranchOrderModel');
const BranchInventory = require('../Model/BranchInventoryModel');
const RecyclingBin = require('../Model/RecyclingBinModel');
const RecyclingRequest = require('../Model/RecyclingRequestModel');
const Driver = require('../Model/DriverModel');
const User = require('../Model/UserModel');

// Get comprehensive branch reports
const getBranchReports = async (req, res) => {
  try {
    const { branchId } = req.params;
    const { startDate, endDate } = req.query;

    // Date range setup
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default: last 30 days
    const end = endDate ? new Date(endDate) : new Date();

    console.log(`📊 Generating reports for branch ${branchId} from ${start.toISOString()} to ${end.toISOString()}`);

    // 1. Orders Report
    const ordersQuery = { branchId };
    if (startDate && endDate) {
      ordersQuery.orderDate = { $gte: start, $lte: end };
    }

    const totalOrders = await BranchOrder.countDocuments(ordersQuery);
    const pendingOrders = await BranchOrder.countDocuments({ ...ordersQuery, status: 'Pending' });
    const processingOrders = await BranchOrder.countDocuments({ ...ordersQuery, status: 'Processing' });
    const deliveredOrders = await BranchOrder.countDocuments({ ...ordersQuery, status: 'Delivered' });
    const cancelledOrders = await BranchOrder.countDocuments({ ...ordersQuery, status: 'Cancelled' });

    // Calculate total revenue
    const revenueData = await BranchOrder.aggregate([
      { $match: { ...ordersQuery, status: 'Delivered' } },
      { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' } } }
    ]);

    const totalRevenue = revenueData[0]?.totalRevenue || 0;

    // 2. Inventory Report
    const inventoryItems = await BranchInventory.find({ branchId });
    const totalItems = inventoryItems.length;
    const lowStockItems = inventoryItems.filter(item => item.quantity <= item.minStockLevel).length;
    const outOfStockItems = inventoryItems.filter(item => item.quantity === 0).length;
    const totalStockValue = inventoryItems.reduce((sum, item) => sum + (item.quantity * item.price), 0);

    // 3. Recycling Report
    const recyclingBins = await RecyclingBin.find({ branchId });
    const totalBins = recyclingBins.length;
    const criticalBins = recyclingBins.filter(bin => bin.fillPercentage >= 80).length;
    const highBins = recyclingBins.filter(bin => bin.fillPercentage >= 60 && bin.fillPercentage < 80).length;
    const mediumBins = recyclingBins.filter(bin => bin.fillPercentage >= 40 && bin.fillPercentage < 60).length;
    const lowBins = recyclingBins.filter(bin => bin.fillPercentage >= 20 && bin.fillPercentage < 40).length;
    const emptyBins = recyclingBins.filter(bin => bin.fillPercentage < 20).length;

    const totalCapacity = recyclingBins.reduce((sum, bin) => sum + bin.capacity, 0);
    const totalCurrentLevel = recyclingBins.reduce((sum, bin) => sum + bin.currentLevel, 0);
    const overallFillPercentage = totalCapacity > 0 ? (totalCurrentLevel / totalCapacity) * 100 : 0;

    // Recycling requests
    const recyclingRequestsQuery = { branchId };
    if (startDate && endDate) {
      recyclingRequestsQuery.createdAt = { $gte: start, $lte: end };
    }

    const totalRecyclingRequests = await RecyclingRequest.countDocuments(recyclingRequestsQuery);
    const pendingRecyclingRequests = await RecyclingRequest.countDocuments({ ...recyclingRequestsQuery, status: 'Pending' });
    const approvedRecyclingRequests = await RecyclingRequest.countDocuments({ ...recyclingRequestsQuery, status: 'Approved' });
    const completedRecyclingRequests = await RecyclingRequest.countDocuments({ ...recyclingRequestsQuery, status: 'Completed' });

    // 4. Driver Performance Report
    const drivers = await Driver.find({ branchId: branchId || { $exists: true } });
    const totalDrivers = drivers.length;
    const availableDrivers = drivers.filter(driver => driver.status === 'Available').length;
    const onDeliveryDrivers = drivers.filter(driver => driver.status === 'On Delivery').length;
    const offDutyDrivers = drivers.filter(driver => driver.status === 'Off Duty').length;

    const topDrivers = drivers
      .sort((a, b) => b.totalDeliveries - a.totalDeliveries)
      .slice(0, 5)
      .map(driver => ({
        name: driver.name,
        totalDeliveries: driver.totalDeliveries,
        rating: driver.rating,
        status: driver.status
      }));

    const averageRating = drivers.length > 0 ? 
      drivers.reduce((sum, driver) => sum + driver.rating, 0) / drivers.length : 0;

    // 5. Customer Activity Report
    const customers = await User.find({ role: 'Customer' });
    const totalCustomers = customers.length;
    const activeCustomers = customers.filter(customer => customer.recyclingPoints > 0).length;

    // 6. Daily Trends (last 7 days)
    const dailyTrends = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);

      const dailyOrders = await BranchOrder.countDocuments({
        branchId,
        orderDate: { $gte: date, $lt: nextDay }
      });

      const dailyRecycling = await RecyclingRequest.countDocuments({
        branchId,
        createdAt: { $gte: date, $lt: nextDay }
      });

      dailyTrends.push({
        date: date.toISOString().split('T')[0],
        orders: dailyOrders,
        recycling: dailyRecycling
      });
    }

    const reports = {
      orders: {
        totalOrders,
        pendingOrders,
        processingOrders,
        deliveredOrders,
        cancelledOrders,
        totalRevenue,
        deliveryRate: totalOrders > 0 ? ((deliveredOrders / totalOrders) * 100).toFixed(1) : 0
      },
      inventory: {
        totalItems,
        lowStockItems,
        outOfStockItems,
        totalStockValue,
        stockHealth: totalItems > 0 ? (((totalItems - lowStockItems - outOfStockItems) / totalItems) * 100).toFixed(1) : 0
      },
      recycling: {
        bins: {
          totalBins,
          criticalBins,
          highBins,
          mediumBins,
          lowBins,
          emptyBins,
          totalCapacity,
          totalCurrentLevel,
          overallFillPercentage: overallFillPercentage.toFixed(1)
        },
        requests: {
          totalRecyclingRequests,
          pendingRecyclingRequests,
          approvedRecyclingRequests,
          completedRecyclingRequests,
          completionRate: totalRecyclingRequests > 0 ? ((completedRecyclingRequests / totalRecyclingRequests) * 100).toFixed(1) : 0
        }
      },
      drivers: {
        totalDrivers,
        availableDrivers,
        onDeliveryDrivers,
        offDutyDrivers,
        topDrivers,
        averageRating: averageRating.toFixed(1)
      },
      customers: {
        totalCustomers,
        activeCustomers,
        engagementRate: totalCustomers > 0 ? ((activeCustomers / totalCustomers) * 100).toFixed(1) : 0
      },
      trends: {
        dailyTrends
      },
      generatedAt: new Date().toISOString(),
      dateRange: {
        start: start.toISOString().split('T')[0],
        end: end.toISOString().split('T')[0]
      }
    };

    res.status(200).json({
      success: true,
      reports: reports
    });

  } catch (error) {
    console.error('❌ Error generating branch reports:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating branch reports',
      error: error.message
    });
  }
};

// Get specific report type
const getSpecificReport = async (req, res) => {
  try {
    const { branchId, reportType } = req.params;
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    let reportData = {};

    switch (reportType) {
      case 'orders':
        const ordersQuery = { branchId };
        if (startDate && endDate) {
          ordersQuery.orderDate = { $gte: start, $lte: end };
        }

        const orders = await BranchOrder.find(ordersQuery).sort({ orderDate: -1 });
        const revenueData = await BranchOrder.aggregate([
          { $match: { ...ordersQuery, status: 'Delivered' } },
          { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' } } }
        ]);

        reportData = {
          orders: orders,
          totalOrders: orders.length,
          totalRevenue: revenueData[0]?.totalRevenue || 0,
          statusBreakdown: {
            pending: orders.filter(o => o.status === 'Pending').length,
            processing: orders.filter(o => o.status === 'Processing').length,
            delivered: orders.filter(o => o.status === 'Delivered').length,
            cancelled: orders.filter(o => o.status === 'Cancelled').length
          }
        };
        break;

      case 'inventory':
        const inventoryItems = await BranchInventory.find({ branchId });
        reportData = {
          items: inventoryItems,
          totalItems: inventoryItems.length,
          lowStockItems: inventoryItems.filter(item => item.quantity <= item.minStockLevel),
          outOfStockItems: inventoryItems.filter(item => item.quantity === 0),
          totalStockValue: inventoryItems.reduce((sum, item) => sum + (item.quantity * item.price), 0)
        };
        break;

      case 'recycling':
        const recyclingBins = await RecyclingBin.find({ branchId });
        const recyclingRequests = await RecyclingRequest.find({ branchId }).sort({ createdAt: -1 });
        
        reportData = {
          bins: recyclingBins,
          requests: recyclingRequests,
          binStatistics: {
            totalBins: recyclingBins.length,
            criticalBins: recyclingBins.filter(bin => bin.fillPercentage >= 80).length,
            totalCapacity: recyclingBins.reduce((sum, bin) => sum + bin.capacity, 0),
            totalCurrentLevel: recyclingBins.reduce((sum, bin) => sum + bin.currentLevel, 0)
          },
          requestStatistics: {
            totalRequests: recyclingRequests.length,
            pendingRequests: recyclingRequests.filter(req => req.status === 'Pending').length,
            approvedRequests: recyclingRequests.filter(req => req.status === 'Approved').length,
            completedRequests: recyclingRequests.filter(req => req.status === 'Completed').length
          }
        };
        break;

      case 'drivers':
        const drivers = await Driver.find({ branchId: branchId || { $exists: true } });
        reportData = {
          drivers: drivers,
          totalDrivers: drivers.length,
          statusBreakdown: {
            available: drivers.filter(d => d.status === 'Available').length,
            onDelivery: drivers.filter(d => d.status === 'On Delivery').length,
            offDuty: drivers.filter(d => d.status === 'Off Duty').length
          },
          topPerformers: drivers
            .sort((a, b) => b.totalDeliveries - a.totalDeliveries)
            .slice(0, 10)
        };
        break;

      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid report type'
        });
    }

    res.status(200).json({
      success: true,
      reportType: reportType,
      data: reportData,
      generatedAt: new Date().toISOString(),
      dateRange: {
        start: start.toISOString().split('T')[0],
        end: end.toISOString().split('T')[0]
      }
    });

  } catch (error) {
    console.error('❌ Error generating specific report:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating specific report',
      error: error.message
    });
  }
};

module.exports = {
  getBranchReports,
  getSpecificReport
};
