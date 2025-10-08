import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../Context/AuthContext';
import { generateBranchReportPDF } from '../../utils/branchReportPdfGenerator';

function BranchReports({ branchId, branchName, showNotification }) {
  // Fallback notification function if not provided
  const notify = showNotification || ((message, type) => {
    console.log(`${type.toUpperCase()}: ${message}`);
  });
  const { token } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [dateRange, setDateRange] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  const reportTypes = [
    { id: 'inventory', name: 'Inventory Report', description: 'Stock levels and movement analysis' },
    { id: 'recycling', name: 'Recycling Report', description: 'Recycling bin status and collection data' }
  ];

  useEffect(() => {
    if (branchId) {
      fetchReports();
    }
  }, [branchId, dateRange]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      
      // Fetch comprehensive reports from the new API
      const response = await axios.get(`http://localhost:5000/Reports/branch/${branchId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        params: {
          startDate: dateRange.startDate,
          endDate: dateRange.endDate
        }
      });

      const reportsData = response.data.reports;
      
      const reports = [
        {
          id: '1',
          type: 'inventory',
          name: 'Inventory Report',
          date: new Date().toISOString().split('T')[0],
          status: 'Generated',
          data: reportsData.inventory,
          description: `Total Items: ${reportsData.inventory?.totalItems || 0} | Low Stock: ${reportsData.inventory?.lowStockItems || 0} | Stock Value: LKR ${(reportsData.inventory?.totalStockValue || 0).toLocaleString()}`
        },
        {
          id: '2',
          type: 'recycling',
          name: 'Recycling Report',
          date: new Date().toISOString().split('T')[0],
          status: 'Generated',
          data: reportsData.recycling,
          description: `Total Bins: ${reportsData.recycling?.bins?.totalBins || 0} | Critical: ${reportsData.recycling?.bins?.criticalBins || 0} | Fill Level: ${reportsData.recycling?.bins?.overallFillPercentage || 0}%`
        },
        {
          id: '3',
          type: 'drivers',
          name: 'Driver Status Report',
          date: new Date().toISOString().split('T')[0],
          status: 'Generated',
          data: reportsData.drivers,
          description: `Total Drivers: ${reportsData.drivers?.totalDrivers || 0} | Available: ${reportsData.drivers?.availableDrivers || 0} | On Delivery: ${reportsData.drivers?.onDeliveryDrivers || 0}`
        },
        {
          id: '4',
          type: 'customers',
          name: 'Customer Activity Report',
          date: new Date().toISOString().split('T')[0],
          status: 'Generated',
          data: reportsData.customers,
          description: `Total Customers: ${reportsData.customers?.totalCustomers || 0} | Active: ${reportsData.customers?.activeCustomers || 0} | Engagement: ${reportsData.customers?.engagementRate || 0}%`
        }
      ];
      
      setReports(reports);
      setReportData(reportsData); // Store the full data for detailed views
    } catch (error) {
      console.error('Error fetching reports:', error);
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async (reportType) => {
    try {
      setLoading(true);
      
      // Fetch specific report data from the new API
      const response = await axios.get(`http://localhost:5000/Reports/branch/${branchId}/${reportType}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        params: {
          startDate: dateRange.startDate,
          endDate: dateRange.endDate
        }
      });

      const reportData = response.data.data;
      const reportInfo = reportTypes.find(r => r.id === reportType);
      
      const newReport = {
        id: Date.now().toString(),
        type: reportType,
        name: `${reportInfo?.name} - ${new Date().toLocaleDateString()}`,
        date: new Date().toISOString().split('T')[0],
        status: 'Generated',
        data: reportData,
        description: `Generated on ${new Date().toLocaleDateString()} for ${branchName}`
      };
      
      setReports(prev => [newReport, ...prev]);
      setSelectedReport(newReport);
      setReportData(reportData);
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateMockReportData = (reportType) => {
    switch (reportType) {
      case 'inventory':
        return {
          totalItems: Math.floor(Math.random() * 20) + 10,
          lowStockItems: Math.floor(Math.random() * 5) + 1,
          outOfStockItems: Math.floor(Math.random() * 3),
          inventoryValue: Math.floor(Math.random() * 50000) + 20000,
          items: [
            { name: 'RO Membranes', quantity: Math.floor(Math.random() * 100) + 20, status: 'In Stock' },
            { name: '5L Water Bottles', quantity: Math.floor(Math.random() * 500) + 100, status: 'In Stock' },
            { name: 'UV Cartridge', quantity: Math.floor(Math.random() * 20) + 1, status: 'Low Stock' },
            { name: 'Mud-filters', quantity: Math.floor(Math.random() * 10), status: Math.random() > 0.7 ? 'Out of Stock' : 'Low Stock' }
          ]
        };
      case 'drivers':
        return {
          totalDrivers: Math.floor(Math.random() * 10) + 5,
          availableDrivers: Math.floor(Math.random() * 5) + 2,
          onDeliveryDrivers: Math.floor(Math.random() * 5) + 1,
          totalDeliveries: Math.floor(Math.random() * 100) + 50,
          averageDeliveryTime: Math.floor(Math.random() * 60) + 30,
          drivers: [
            { name: 'John Doe', deliveries: 15, rating: 4.5, status: 'Available' },
            { name: 'Jane Smith', deliveries: 12, rating: 4.8, status: 'On Delivery' },
            { name: 'Mike Johnson', deliveries: 18, rating: 4.2, status: 'Available' }
          ]
        };
      case 'recycling':
        return {
          totalBins: Math.floor(Math.random() * 20) + 10,
          criticalBins: Math.floor(Math.random() * 5) + 1,
          averageFillLevel: Math.floor(Math.random() * 40) + 30,
          collectionsToday: Math.floor(Math.random() * 10) + 5,
          bins: [
            { id: 'BIN001', location: 'Warehouse A', fillLevel: 85, status: 'Critical' },
            { id: 'BIN002', location: 'Warehouse B', fillLevel: 45, status: 'Normal' },
            { id: 'BIN003', location: 'Loading Bay', fillLevel: 92, status: 'Critical' }
          ]
        };
      default:
        return {};
    }
  };

  const viewReport = (report) => {
    setSelectedReport(report);
    setReportData(report.data);
  };

  const exportReport = async (report) => {
    try {
      setLoading(true);
      
      // Generate PDF using the report data
      const reportDateRange = {
        start: dateRange.startDate,
        end: dateRange.endDate
      };
      
      await generateBranchReportPDF(
        report.data,
        report.type,
        branchName,
        reportDateRange
      );
      
      notify('Report exported as PDF successfully!', 'success');
    } catch (error) {
      console.error('Error exporting report:', error);
      notify('Error exporting report. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const renderReportContent = () => {
    if (!reportData) return null;

    switch (selectedReport.type) {
      case 'inventory':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-900">Total Items</h3>
                <p className="text-2xl font-bold text-blue-600">{reportData.totalItems || 0}</p>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-yellow-900">Low Stock</h3>
                <p className="text-2xl font-bold text-yellow-600">{Array.isArray(reportData.lowStockItems) ? reportData.lowStockItems.length : reportData.lowStockItems || 0}</p>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-red-900">Out of Stock</h3>
                <p className="text-2xl font-bold text-red-600">{Array.isArray(reportData.outOfStockItems) ? reportData.outOfStockItems.length : reportData.outOfStockItems || 0}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-green-900">Inventory Value</h3>
                <p className="text-2xl font-bold text-green-600">LKR {(reportData.totalStockValue || 0).toLocaleString()}</p>
              </div>
            </div>
            

            {/* Recent Movements */}
            {reportData.recentMovements && Array.isArray(reportData.recentMovements) && reportData.recentMovements.length > 0 && (
              <div className="bg-white p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-4">Recent Inventory Movements</h3>
                <div className="space-y-2">
                  {reportData.recentMovements.slice(0, 10).map((movement, index) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span className="font-medium">{movement.name}</span>
                      <div className="text-right">
                        <div className="text-sm text-gray-600">{movement.quantity} units</div>
                        <div className="text-xs text-gray-500">{new Date(movement.lastUpdated).toLocaleDateString()}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-white p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-4">Inventory Items</h3>
              <div className="space-y-2">
                {Array.isArray(reportData.items) ? reportData.items.map((item, index) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <div className="flex-1">
                      <span className="font-medium">{item.name}</span>
                      <div className="text-sm text-gray-500">{item.category}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600">{item.quantity} units</div>
                      <div className={`font-semibold ${
                        item.status === 'Out of Stock' ? 'text-red-600' :
                        item.status === 'Low Stock' ? 'text-yellow-600' : 'text-green-600'
                      }`}>
                        {item.status}
                      </div>
                    </div>
                  </div>
                )) : <div className="text-gray-500 text-center py-4">No inventory data available</div>}
              </div>
            </div>
          </div>
        );
      case 'drivers':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-900">Total Drivers</h3>
                <p className="text-2xl font-bold text-blue-600">{reportData.totalDrivers || 0}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-green-900">Available</h3>
                <p className="text-2xl font-bold text-green-600">{reportData.statusBreakdown?.available || 0}</p>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-orange-900">On Delivery</h3>
                <p className="text-2xl font-bold text-orange-600">{reportData.statusBreakdown?.onDelivery || 0}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900">Off Duty</h3>
                <p className="text-2xl font-bold text-gray-600">{reportData.statusBreakdown?.offDuty || 0}</p>
              </div>
            </div>
          </div>
        );
      case 'recycling':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-900">Total Bins</h3>
                <p className="text-2xl font-bold text-blue-600">{reportData.binStatistics?.totalBins || 0}</p>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-red-900">Critical</h3>
                <p className="text-2xl font-bold text-red-600">{reportData.binStatistics?.criticalBins || 0}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-green-900">Total Requests</h3>
                <p className="text-2xl font-bold text-green-600">{reportData.requestStatistics?.totalRequests || 0}</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-purple-900">Completed</h3>
                <p className="text-2xl font-bold text-purple-600">{reportData.requestStatistics?.completedRequests || 0}</p>
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-4">Recycling Bins Status</h3>
              <div className="space-y-2">
                {Array.isArray(reportData.bins) ? reportData.bins.slice(0, 10).map((bin, index) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span className="font-medium">{bin.binId || bin._id}</span>
                    <div className="text-right">
                      <div className="text-sm text-gray-600">{bin.location}</div>
                      <div className={`font-semibold ${
                        bin.fillPercentage >= 80 ? 'text-red-600' :
                        bin.fillPercentage >= 60 ? 'text-orange-600' :
                        bin.fillPercentage >= 40 ? 'text-yellow-600' : 'text-green-600'
                      }`}>
                        {bin.fillPercentage}% full
                      </div>
                    </div>
                  </div>
                )) : <div className="text-gray-500 text-center py-4">No bins data available</div>}
              </div>
            </div>
          </div>
        );
      default:
        return (
          <div className="bg-white p-6 rounded-lg">
            <pre className="text-sm">{JSON.stringify(reportData, null, 2)}</pre>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Branch Reports - {branchName}</h2>
        <div className="flex space-x-3">
          <div className="flex space-x-2">
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={fetchReports}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Report Types */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Generate Reports</h3>
            <div className="space-y-3">
              {reportTypes.map((reportType) => (
                <button
                  key={reportType.id}
                  onClick={() => generateReport(reportType.id)}
                  className="w-full text-left p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="font-medium text-gray-900">{reportType.name}</div>
                  <div className="text-sm text-gray-500">{reportType.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Recent Reports */}
          <div className="bg-white rounded-lg shadow p-6 mt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Reports</h3>
            <div className="space-y-3">
              {reports.slice(0, 5).map((report) => (
                <div
                  key={report.id}
                  className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => viewReport(report)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium text-gray-900">{report.name}</div>
                      <div className="text-sm text-gray-500">{report.date}</div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          viewReport(report);
                        }}
                        className="text-blue-600 hover:text-blue-900 text-sm"
                      >
                        View
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          exportReport(report);
                        }}
                        className="text-green-600 hover:text-green-900 text-sm"
                      >
                        Export PDF
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Report Content */}
        <div className="lg:col-span-2">
          {selectedReport ? (
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">{selectedReport.name}</h3>
                    <p className="text-sm text-gray-500">Generated on {selectedReport.date}</p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => exportReport(selectedReport)}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Export PDF
                    </button>
                    <button
                      onClick={() => {
                        setSelectedReport(null);
                        setReportData(null);
                      }}
                      className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
              <div className="p-6">
                {renderReportContent()}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <div className="text-gray-400 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Report Selected</h3>
              <p className="text-gray-500">Select a report type to generate or choose from recent reports to view.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default BranchReports;
