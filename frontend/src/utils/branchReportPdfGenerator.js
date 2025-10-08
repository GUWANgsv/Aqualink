import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Generate Branch Reports PDF
export const generateBranchReportPDF = async (reportData, reportType, branchName, dateRange) => {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(20);
  doc.setTextColor(59, 130, 246); // Blue color
  doc.text('AquaLink - Branch Report', 105, 20, { align: 'center' });
  
  doc.setFontSize(14);
  doc.setTextColor(17, 24, 39);
  doc.text(`${reportType} Report - ${branchName}`, 105, 30, { align: 'center' });
  
  doc.setFontSize(12);
  doc.setTextColor(107, 114, 128);
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 105, 40, { align: 'center' });
  doc.text(`Date Range: ${dateRange.start} to ${dateRange.end}`, 105, 50, { align: 'center' });
  
  let yPos = 70;
  
  // Generate content based on report type
  switch (reportType.toLowerCase()) {
    case 'orders':
      generateOrdersReport(doc, reportData, yPos);
      break;
    case 'inventory':
      generateInventoryReport(doc, reportData, yPos);
      break;
    case 'recycling':
      generateRecyclingReport(doc, reportData, yPos);
      break;
    case 'drivers':
      generateDriversReport(doc, reportData, yPos);
      break;
    default:
      generateGeneralReport(doc, reportData, yPos);
  }
  
  // Footer
  doc.setFontSize(8);
  doc.setTextColor(107, 114, 128);
  doc.text('AquaLink Branch Management System', 105, 280, { align: 'center' });
  
  // Save the PDF
  const fileName = `${reportType.toLowerCase()}_report_${branchName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
  
  return fileName;
};

// Generate Orders Report
const generateOrdersReport = (doc, data, startY) => {
  doc.setFontSize(16);
  doc.setTextColor(17, 24, 39);
  doc.text('Orders Summary', 20, startY);
  
  doc.setFontSize(12);
  let yPos = startY + 15;
  
  // Summary metrics
  doc.text(`Total Orders: ${data.totalOrders || 0}`, 20, yPos);
  yPos += 10;
  doc.text(`Pending Orders: ${data.pendingOrders || 0}`, 20, yPos);
  yPos += 10;
  doc.text(`Processing Orders: ${data.processingOrders || 0}`, 20, yPos);
  yPos += 10;
  doc.text(`Delivered Orders: ${data.deliveredOrders || 0}`, 20, yPos);
  yPos += 10;
  doc.text(`Cancelled Orders: ${data.cancelledOrders || 0}`, 20, yPos);
  yPos += 10;
  doc.text(`Total Revenue: LKR ${(data.totalRevenue || 0).toLocaleString()}`, 20, yPos);
  
  // Recent Orders Table
  if (data.orders && data.orders.length > 0) {
    yPos += 20;
    doc.setFontSize(14);
    doc.text('Recent Orders', 20, yPos);
    yPos += 10;
    
    // Table headers
    const headers = ['Order ID', 'Customer', 'Status', 'Amount'];
    const colWidths = [40, 50, 30, 30];
    let xPos = 20;
    
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.setFillColor(59, 130, 246);
    
    headers.forEach((header, index) => {
      doc.rect(xPos, yPos, colWidths[index], 8, 'F');
      doc.text(header, xPos + 2, yPos + 6);
      xPos += colWidths[index];
    });
    
    // Table data
    doc.setTextColor(17, 24, 39);
    doc.setFillColor(255, 255, 255);
    
    let currentY = yPos + 8;
    data.orders.slice(0, 15).forEach((order, index) => {
      if (currentY > 250) {
        doc.addPage();
        currentY = 20;
      }
      
      xPos = 20;
      doc.text(order.orderId || order._id || 'N/A', xPos + 2, currentY + 6);
      xPos += 40;
      doc.text(order.customerName || 'N/A', xPos + 2, currentY + 6);
      xPos += 50;
      doc.text(order.status || 'N/A', xPos + 2, currentY + 6);
      xPos += 30;
      doc.text(`LKR ${(order.totalAmount || 0).toLocaleString()}`, xPos + 2, currentY + 6);
      
      currentY += 8;
    });
  }
};

// Generate Inventory Report
const generateInventoryReport = (doc, data, startY) => {
  doc.setFontSize(16);
  doc.setTextColor(17, 24, 39);
  doc.text('Inventory Summary', 20, startY);
  
  doc.setFontSize(12);
  let yPos = startY + 15;
  
  // Summary metrics
  doc.text(`Total Items: ${data.totalItems || 0}`, 20, yPos);
  yPos += 10;
  doc.text(`Low Stock Items: ${Array.isArray(data.lowStockItems) ? data.lowStockItems.length : data.lowStockItems || 0}`, 20, yPos);
  yPos += 10;
  doc.text(`Out of Stock Items: ${Array.isArray(data.outOfStockItems) ? data.outOfStockItems.length : data.outOfStockItems || 0}`, 20, yPos);
  yPos += 10;
  doc.text(`Total Stock Value: LKR ${(data.totalStockValue || 0).toLocaleString()}`, 20, yPos);
  
  // Recent Movements
  if (data.recentMovements && data.recentMovements.length > 0) {
    yPos += 20;
    doc.setFontSize(14);
    doc.text('Recent Inventory Movements', 20, yPos);
    yPos += 10;
    
    data.recentMovements.slice(0, 10).forEach((movement, index) => {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.setFontSize(10);
      doc.text(`${movement.name} - ${movement.quantity} units (${new Date(movement.lastUpdated).toLocaleDateString()})`, 20, yPos);
      yPos += 8;
    });
  }
  
  // Inventory Items Table
  if (data.items && data.items.length > 0) {
    yPos += 20;
    doc.setFontSize(14);
    doc.text('Inventory Items', 20, yPos);
    yPos += 10;
    
    // Table headers
    const headers = ['Item Name', 'Category', 'Quantity', 'Status'];
    const colWidths = [60, 40, 30, 30];
    let xPos = 20;
    
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.setFillColor(59, 130, 246);
    
    headers.forEach((header, index) => {
      doc.rect(xPos, yPos, colWidths[index], 8, 'F');
      doc.text(header, xPos + 2, yPos + 6);
      xPos += colWidths[index];
    });
    
    // Table data
    doc.setTextColor(17, 24, 39);
    doc.setFillColor(255, 255, 255);
    
    let currentY = yPos + 8;
    data.items.slice(0, 20).forEach((item, index) => {
      if (currentY > 250) {
        doc.addPage();
        currentY = 20;
      }
      
      xPos = 20;
      doc.text(item.name || 'N/A', xPos + 2, currentY + 6);
      xPos += 60;
      doc.text(item.category || 'N/A', xPos + 2, currentY + 6);
      xPos += 40;
      doc.text(`${item.quantity || 0}`, xPos + 2, currentY + 6);
      xPos += 30;
      doc.text(item.status || 'N/A', xPos + 2, currentY + 6);
      
      currentY += 8;
    });
  }
};

// Generate Recycling Report
const generateRecyclingReport = (doc, data, startY) => {
  doc.setFontSize(16);
  doc.setTextColor(17, 24, 39);
  doc.text('Recycling Summary', 20, startY);
  
  doc.setFontSize(12);
  let yPos = startY + 15;
  
  // Bin Statistics
  if (data.binStatistics) {
    doc.text(`Total Bins: ${data.binStatistics.totalBins || 0}`, 20, yPos);
    yPos += 10;
    doc.text(`Critical Bins: ${data.binStatistics.criticalBins || 0}`, 20, yPos);
    yPos += 10;
  }
  
  // Request Statistics
  if (data.requestStatistics) {
    yPos += 10;
    doc.text(`Total Requests: ${data.requestStatistics.totalRequests || 0}`, 20, yPos);
    yPos += 10;
    doc.text(`Pending Requests: ${data.requestStatistics.pendingRequests || 0}`, 20, yPos);
    yPos += 10;
    doc.text(`Completed Requests: ${data.requestStatistics.completedRequests || 0}`, 20, yPos);
  }
  
  // Recycling Bins Table
  if (data.bins && data.bins.length > 0) {
    yPos += 20;
    doc.setFontSize(14);
    doc.text('Recycling Bins Status', 20, yPos);
    yPos += 10;
    
    // Table headers
    const headers = ['Bin ID', 'Location', 'Fill Level', 'Status'];
    const colWidths = [30, 50, 30, 30];
    let xPos = 20;
    
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.setFillColor(59, 130, 246);
    
    headers.forEach((header, index) => {
      doc.rect(xPos, yPos, colWidths[index], 8, 'F');
      doc.text(header, xPos + 2, yPos + 6);
      xPos += colWidths[index];
    });
    
    // Table data
    doc.setTextColor(17, 24, 39);
    doc.setFillColor(255, 255, 255);
    
    let currentY = yPos + 8;
    data.bins.slice(0, 15).forEach((bin, index) => {
      if (currentY > 250) {
        doc.addPage();
        currentY = 20;
      }
      
      xPos = 20;
      doc.text(bin.binId || bin._id || 'N/A', xPos + 2, currentY + 6);
      xPos += 30;
      doc.text(bin.location || 'N/A', xPos + 2, currentY + 6);
      xPos += 50;
      doc.text(`${bin.fillPercentage || 0}%`, xPos + 2, currentY + 6);
      xPos += 30;
      doc.text(bin.status || 'N/A', xPos + 2, currentY + 6);
      
      currentY += 8;
    });
  }
};

// Generate Drivers Report
const generateDriversReport = (doc, data, startY) => {
  doc.setFontSize(16);
  doc.setTextColor(17, 24, 39);
  doc.text('Drivers Summary', 20, startY);
  
  doc.setFontSize(12);
  let yPos = startY + 15;
  
  // Summary metrics
  doc.text(`Total Drivers: ${data.totalDrivers || 0}`, 20, yPos);
  yPos += 10;
  doc.text(`Available Drivers: ${data.statusBreakdown?.available || 0}`, 20, yPos);
  yPos += 10;
  doc.text(`On Delivery: ${data.statusBreakdown?.onDelivery || 0}`, 20, yPos);
  yPos += 10;
  doc.text(`Off Duty: ${data.statusBreakdown?.offDuty || 0}`, 20, yPos);
  
  // Drivers Table
  if (data.drivers && data.drivers.length > 0) {
    yPos += 20;
    doc.setFontSize(14);
    doc.text('Driver Details', 20, yPos);
    yPos += 10;
    
    // Table headers
    const headers = ['Name', 'Status', 'Vehicle', 'Phone'];
    const colWidths = [50, 30, 40, 40];
    let xPos = 20;
    
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.setFillColor(59, 130, 246);
    
    headers.forEach((header, index) => {
      doc.rect(xPos, yPos, colWidths[index], 8, 'F');
      doc.text(header, xPos + 2, yPos + 6);
      xPos += colWidths[index];
    });
    
    // Table data
    doc.setTextColor(17, 24, 39);
    doc.setFillColor(255, 255, 255);
    
    let currentY = yPos + 8;
    data.drivers.slice(0, 15).forEach((driver, index) => {
      if (currentY > 250) {
        doc.addPage();
        currentY = 20;
      }
      
      xPos = 20;
      doc.text(driver.name || 'N/A', xPos + 2, currentY + 6);
      xPos += 50;
      doc.text(driver.status || 'N/A', xPos + 2, currentY + 6);
      xPos += 30;
      doc.text(driver.vehicleNumber || 'N/A', xPos + 2, currentY + 6);
      xPos += 40;
      doc.text(driver.phone || 'N/A', xPos + 2, currentY + 6);
      
      currentY += 8;
    });
  }
};

// Generate General Report
const generateGeneralReport = (doc, data, startY) => {
  doc.setFontSize(16);
  doc.setTextColor(17, 24, 39);
  doc.text('Report Summary', 20, startY);
  
  doc.setFontSize(12);
  let yPos = startY + 15;
  
  // Display basic data
  Object.entries(data).forEach(([key, value]) => {
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }
    
    if (typeof value === 'object' && value !== null) {
      doc.text(`${key}:`, 20, yPos);
      yPos += 8;
      Object.entries(value).forEach(([subKey, subValue]) => {
        doc.text(`  ${subKey}: ${subValue}`, 25, yPos);
        yPos += 6;
      });
    } else {
      doc.text(`${key}: ${value}`, 20, yPos);
      yPos += 8;
    }
  });
};
