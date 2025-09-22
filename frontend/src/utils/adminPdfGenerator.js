import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Generate Employee Report PDF
export const generateEmployeeReportPDF = async (employees) => {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(20);
  doc.setTextColor(59, 130, 246); // Blue color
  doc.text('AquaLink - Employee Report', 105, 20, { align: 'center' });
  
  doc.setFontSize(12);
  doc.setTextColor(107, 114, 128); // Gray color
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 105, 30, { align: 'center' });
  
  // Summary
  doc.setFontSize(14);
  doc.setTextColor(17, 24, 39); // Dark gray
  doc.text('Summary', 20, 45);
  
  doc.setFontSize(10);
  doc.text(`Total Employees: ${employees.length}`, 20, 55);
  
  const roleCounts = employees.reduce((acc, emp) => {
    acc[emp.role] = (acc[emp.role] || 0) + 1;
    return acc;
  }, {});
  
  let yPos = 65;
  Object.entries(roleCounts).forEach(([role, count]) => {
    doc.text(`${role}: ${count}`, 20, yPos);
    yPos += 8;
  });
  
  // Employee Details Table
  doc.setFontSize(14);
  doc.text('Employee Details', 20, yPos + 10);
  
  // Table headers
  const headers = ['Name', 'Role', 'Branch', 'Status', 'Join Date'];
  const colWidths = [40, 35, 35, 25, 30];
  let xPos = 20;
  
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.setFillColor(59, 130, 246);
  
  headers.forEach((header, index) => {
    doc.rect(xPos, yPos + 20, colWidths[index], 10, 'F');
    doc.text(header, xPos + 2, yPos + 27);
    xPos += colWidths[index];
  });
  
  // Table data
  doc.setTextColor(17, 24, 39);
  doc.setFillColor(255, 255, 255);
  
  let currentY = yPos + 30;
  employees.forEach((employee, index) => {
    if (currentY > 250) {
      doc.addPage();
      currentY = 20;
    }
    
    xPos = 20;
    doc.rect(xPos, currentY, colWidths[0], 8, 'F');
    doc.text(employee.name.substring(0, 15), xPos + 2, currentY + 6);
    xPos += colWidths[0];
    
    doc.rect(xPos, currentY, colWidths[1], 8, 'F');
    doc.text(employee.role.substring(0, 12), xPos + 2, currentY + 6);
    xPos += colWidths[1];
    
    doc.rect(xPos, currentY, colWidths[2], 8, 'F');
    doc.text(employee.branch.substring(0, 12), xPos + 2, currentY + 6);
    xPos += colWidths[2];
    
    doc.rect(xPos, currentY, colWidths[3], 8, 'F');
    doc.text(employee.status, xPos + 2, currentY + 6);
    xPos += colWidths[3];
    
    doc.rect(xPos, currentY, colWidths[4], 8, 'F');
    doc.text(employee.joinDate, xPos + 2, currentY + 6);
    
    currentY += 8;
  });
  
  // Footer
  doc.setFontSize(8);
  doc.setTextColor(107, 114, 128);
  doc.text('AquaLink Employee Management System', 105, 280, { align: 'center' });
  
  doc.save('employee-report.pdf');
};

// Generate Emergency Report PDF
export const generateEmergencyReportPDF = async (emergencyRequests) => {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(20);
  doc.setTextColor(239, 68, 68); // Red color
  doc.text('AquaLink - Emergency Report', 105, 20, { align: 'center' });
  
  doc.setFontSize(12);
  doc.setTextColor(107, 114, 128);
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 105, 30, { align: 'center' });
  
  // Summary
  doc.setFontSize(14);
  doc.setTextColor(17, 24, 39);
  doc.text('Emergency Summary', 20, 45);
  
  doc.setFontSize(10);
  doc.text(`Total Requests: ${emergencyRequests.length}`, 20, 55);
  
  const statusCounts = emergencyRequests.reduce((acc, req) => {
    acc[req.status] = (acc[req.status] || 0) + 1;
    return acc;
  }, {});
  
  let yPos = 65;
  Object.entries(statusCounts).forEach(([status, count]) => {
    doc.text(`${status}: ${count}`, 20, yPos);
    yPos += 8;
  });
  
  // Emergency Details
  doc.setFontSize(14);
  doc.text('Emergency Request Details', 20, yPos + 10);
  
  let currentY = yPos + 20;
  emergencyRequests.forEach((request, index) => {
    if (currentY > 250) {
      doc.addPage();
      currentY = 20;
    }
    
    // Request header
    doc.setFontSize(12);
    doc.setTextColor(17, 24, 39);
    doc.text(`Request #${request.id}`, 20, currentY);
    
    doc.setFontSize(10);
    doc.text(`Brigade: ${request.brigadeName}`, 20, currentY + 8);
    doc.text(`Location: ${request.brigadeLocation}`, 20, currentY + 16);
    doc.text(`Type: ${request.requestType}`, 20, currentY + 24);
    doc.text(`Priority: ${request.priority}`, 20, currentY + 32);
    doc.text(`Status: ${request.status}`, 20, currentY + 40);
    doc.text(`Date: ${request.requestDate}`, 20, currentY + 48);
    doc.text(`Water Level: ${request.waterLevel}`, 20, currentY + 56);
    
    // Description
    doc.text('Description:', 20, currentY + 68);
    const descriptionLines = doc.splitTextToSize(request.description, 170);
    doc.text(descriptionLines, 20, currentY + 76);
    
    currentY += 90 + (descriptionLines.length * 5);
    
    // Add separator line
    if (index < emergencyRequests.length - 1) {
      doc.setDrawColor(229, 231, 235);
      doc.line(20, currentY, 190, currentY);
      currentY += 10;
    }
  });
  
  // Footer
  doc.setFontSize(8);
  doc.setTextColor(107, 114, 128);
  doc.text('AquaLink Emergency Management System', 105, 280, { align: 'center' });
  
  doc.save('emergency-report.pdf');
};

// Generate Branch Report PDF
export const generateBranchReportPDF = async (branches) => {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(20);
  doc.setTextColor(34, 197, 94); // Green color
  doc.text('AquaLink - Branch Report', 105, 20, { align: 'center' });
  
  doc.setFontSize(12);
  doc.setTextColor(107, 114, 128);
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 105, 30, { align: 'center' });
  
  // Summary
  doc.setFontSize(14);
  doc.setTextColor(17, 24, 39);
  doc.text('Branch Summary', 20, 45);
  
  doc.setFontSize(10);
  doc.text(`Total Branches: ${branches.length}`, 20, 55);
  
  const totalCapacity = branches.reduce((sum, branch) => {
    return sum + parseInt(branch.capacity.replace('L', ''));
  }, 0);
  
  const totalStock = branches.reduce((sum, branch) => {
    return sum + parseInt(branch.currentStock.replace('L', ''));
  }, 0);
  
  doc.text(`Total Capacity: ${totalCapacity}L`, 20, 65);
  doc.text(`Total Current Stock: ${totalStock}L`, 20, 73);
  doc.text(`Utilization Rate: ${((totalStock / totalCapacity) * 100).toFixed(1)}%`, 20, 81);
  
  // Branch Details Table
  doc.setFontSize(14);
  doc.text('Branch Details', 20, 95);
  
  // Table headers
  const headers = ['Branch', 'Location', 'Manager', 'Capacity', 'Stock', 'Status'];
  const colWidths = [35, 35, 35, 25, 25, 20];
  let xPos = 20;
  
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.setFillColor(34, 197, 94);
  
  headers.forEach((header, index) => {
    doc.rect(xPos, 105, colWidths[index], 10, 'F');
    doc.text(header, xPos + 2, 112);
    xPos += colWidths[index];
  });
  
  // Table data
  doc.setTextColor(17, 24, 39);
  doc.setFillColor(255, 255, 255);
  
  let currentY = 115;
  branches.forEach((branch, index) => {
    if (currentY > 250) {
      doc.addPage();
      currentY = 20;
    }
    
    xPos = 20;
    doc.rect(xPos, currentY, colWidths[0], 8, 'F');
    doc.text(branch.name.substring(0, 12), xPos + 2, currentY + 6);
    xPos += colWidths[0];
    
    doc.rect(xPos, currentY, colWidths[1], 8, 'F');
    doc.text(branch.location.substring(0, 12), xPos + 2, currentY + 6);
    xPos += colWidths[1];
    
    doc.rect(xPos, currentY, colWidths[2], 8, 'F');
    doc.text(branch.manager.substring(0, 12), xPos + 2, currentY + 6);
    xPos += colWidths[2];
    
    doc.rect(xPos, currentY, colWidths[3], 8, 'F');
    doc.text(branch.capacity, xPos + 2, currentY + 6);
    xPos += colWidths[3];
    
    doc.rect(xPos, currentY, colWidths[4], 8, 'F');
    doc.text(branch.currentStock, xPos + 2, currentY + 6);
    xPos += colWidths[4];
    
    doc.rect(xPos, currentY, colWidths[5], 8, 'F');
    doc.text(branch.status, xPos + 2, currentY + 6);
    
    currentY += 8;
  });
  
  // Branch Map (placeholder)
  doc.setFontSize(12);
  doc.setTextColor(17, 24, 39);
  doc.text('Branch Locations', 20, currentY + 15);
  
  doc.setFontSize(10);
  doc.setTextColor(107, 114, 128);
  doc.text('Map visualization would be displayed here', 20, currentY + 25);
  doc.text('showing all branch locations and their coverage areas.', 20, currentY + 33);
  
  // Footer
  doc.setFontSize(8);
  doc.setTextColor(107, 114, 128);
  doc.text('AquaLink Branch Management System', 105, 280, { align: 'center' });
  
  doc.save('branch-report.pdf');
};

// Generate User Management Report PDF
export const generateUserReportPDF = async (users) => {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(20);
  doc.setTextColor(147, 51, 234); // Purple color
  doc.text('AquaLink - User Report', 105, 20, { align: 'center' });
  
  doc.setFontSize(12);
  doc.setTextColor(107, 114, 128);
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 105, 30, { align: 'center' });
  
  // Summary
  doc.setFontSize(14);
  doc.setTextColor(17, 24, 39);
  doc.text('User Summary', 20, 45);
  
  doc.setFontSize(10);
  doc.text(`Total Users: ${users.length}`, 20, 55);
  
  const roleCounts = users.reduce((acc, user) => {
    acc[user.role] = (acc[user.role] || 0) + 1;
    return acc;
  }, {});
  
  let yPos = 65;
  Object.entries(roleCounts).forEach(([role, count]) => {
    doc.text(`${role}: ${count}`, 20, yPos);
    yPos += 8;
  });
  
  const activeUsers = users.filter(user => user.status === 'Active').length;
  doc.text(`Active Users: ${activeUsers}`, 20, yPos + 8);
  
  // User Details Table
  doc.setFontSize(14);
  doc.text('User Details', 20, yPos + 20);
  
  // Table headers
  const headers = ['Name', 'Email', 'Role', 'Status', 'Join Date'];
  const colWidths = [40, 50, 30, 25, 30];
  let xPos = 20;
  
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.setFillColor(147, 51, 234);
  
  headers.forEach((header, index) => {
    doc.rect(xPos, yPos + 30, colWidths[index], 10, 'F');
    doc.text(header, xPos + 2, yPos + 37);
    xPos += colWidths[index];
  });
  
  // Table data
  doc.setTextColor(17, 24, 39);
  doc.setFillColor(255, 255, 255);
  
  let currentY = yPos + 40;
  users.forEach((user, index) => {
    if (currentY > 250) {
      doc.addPage();
      currentY = 20;
    }
    
    xPos = 20;
    doc.rect(xPos, currentY, colWidths[0], 8, 'F');
    doc.text(user.name.substring(0, 15), xPos + 2, currentY + 6);
    xPos += colWidths[0];
    
    doc.rect(xPos, currentY, colWidths[1], 8, 'F');
    doc.text(user.email.substring(0, 20), xPos + 2, currentY + 6);
    xPos += colWidths[1];
    
    doc.rect(xPos, currentY, colWidths[2], 8, 'F');
    doc.text(user.role, xPos + 2, currentY + 6);
    xPos += colWidths[2];
    
    doc.rect(xPos, currentY, colWidths[3], 8, 'F');
    doc.text(user.status, xPos + 2, currentY + 6);
    xPos += colWidths[3];
    
    doc.rect(xPos, currentY, colWidths[4], 8, 'F');
    doc.text(user.joinDate, xPos + 2, currentY + 6);
    
    currentY += 8;
  });
  
  // Footer
  doc.setFontSize(8);
  doc.setTextColor(107, 114, 128);
  doc.text('AquaLink User Management System', 105, 280, { align: 'center' });
  
  doc.save('user-report.pdf');
};

// Generate comprehensive admin dashboard report
export const generateAdminDashboardReport = async (data) => {
  const { employees, emergencyRequests, branches, users } = data;
  const doc = new jsPDF();
  
  // Title page
  doc.setFontSize(24);
  doc.setTextColor(59, 130, 246);
  doc.text('AquaLink', 105, 40, { align: 'center' });
  doc.setFontSize(18);
  doc.text('Admin Dashboard Report', 105, 55, { align: 'center' });
  
  doc.setFontSize(12);
  doc.setTextColor(107, 114, 128);
  doc.text(`Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, 105, 70, { align: 'center' });
  
  // Executive Summary
  doc.addPage();
  doc.setFontSize(16);
  doc.setTextColor(17, 24, 39);
  doc.text('Executive Summary', 20, 20);
  
  doc.setFontSize(12);
  doc.text(`Total Employees: ${employees.length}`, 20, 35);
  doc.text(`Active Branches: ${branches.length}`, 20, 45);
  doc.text(`Total Users: ${users.length}`, 20, 55);
  doc.text(`Pending Emergency Requests: ${emergencyRequests.filter(req => req.status === 'Pending').length}`, 20, 65);
  
  // Charts and analytics would go here
  doc.setFontSize(10);
  doc.setTextColor(107, 114, 128);
  doc.text('Detailed analytics and charts would be displayed here', 20, 85);
  
  // Footer
  doc.setFontSize(8);
  doc.setTextColor(107, 114, 128);
  doc.text('AquaLink Comprehensive Admin Report', 105, 280, { align: 'center' });
  
  doc.save('admin-dashboard-report.pdf');
};

// Generate Factory Orders Report PDF
export const generateFactoryOrdersReportPDF = async (factoryRequests, collectionRequests) => {
  const doc = new jsPDF();
  
  // Professional Header with Logo Area
  doc.setFillColor(34, 197, 94); // Green background
  doc.rect(0, 0, 210, 35, 'F');
  
  // Company Logo Area (placeholder)
  doc.setFillColor(255, 255, 255);
  doc.rect(15, 8, 20, 20, 'F');
  doc.setFontSize(16);
  doc.setTextColor(34, 197, 94);
  doc.text('AQL', 25, 20, { align: 'center' });
  
  // Company Name and Title
  doc.setFontSize(24);
  doc.setTextColor(255, 255, 255);
  doc.text('AquaLink', 50, 18);
  doc.setFontSize(14);
  doc.text('Factory Orders Management Report', 50, 25);
  
  // Report Details
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text(`Generated: ${new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })}`, 150, 18);
  doc.text(`Report ID: FL-${Date.now().toString().slice(-6)}`, 150, 25);
  
  // Executive Summary Section
  doc.setFillColor(248, 250, 252); // Light gray background
  doc.rect(15, 45, 180, 50, 'F');
  
  doc.setFontSize(16);
  doc.setTextColor(17, 24, 39);
  doc.text('📊 Executive Summary', 20, 55);
  
  // Summary Cards
  const cardWidth = 40;
  const cardHeight = 25;
  const startX = 20;
  const startY = 65;
  
  // Total Factory Requests Card
  doc.setFillColor(34, 197, 94);
  doc.rect(startX, startY, cardWidth, cardHeight, 'F');
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  doc.text('Factory Requests', startX + 2, startY + 8);
  doc.setFontSize(18);
  doc.text(factoryRequests.length.toString(), startX + 2, startY + 18);
  
  // Total Collection Requests Card
  doc.setFillColor(59, 130, 246);
  doc.rect(startX + cardWidth + 5, startY, cardWidth, cardHeight, 'F');
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  doc.text('Collection Requests', startX + cardWidth + 7, startY + 8);
  doc.setFontSize(18);
  doc.text(collectionRequests.length.toString(), startX + cardWidth + 7, startY + 18);
  
  // Pending Requests Card
  const pendingCount = factoryRequests.filter(req => req.status === 'pending').length;
  doc.setFillColor(245, 158, 11);
  doc.rect(startX + (cardWidth + 5) * 2, startY, cardWidth, cardHeight, 'F');
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  doc.text('Pending', startX + (cardWidth + 5) * 2 + 2, startY + 8);
  doc.setFontSize(18);
  doc.text(pendingCount.toString(), startX + (cardWidth + 5) * 2 + 2, startY + 18);
  
  // Status Breakdown
  const statusCounts = factoryRequests.reduce((acc, req) => {
    acc[req.status] = (acc[req.status] || 0) + 1;
    return acc;
  }, {});
  
  let yPos = 120;
  doc.setFontSize(14);
  doc.setTextColor(17, 24, 39);
  doc.text('📈 Status Distribution', 20, yPos);
  
  yPos += 10;
  doc.setFontSize(10);
  Object.entries(statusCounts).forEach(([status, count]) => {
    const percentage = ((count / factoryRequests.length) * 100).toFixed(1);
    doc.text(`• ${status.charAt(0).toUpperCase() + status.slice(1)}: ${count} (${percentage}%)`, 20, yPos);
    yPos += 6;
  });
  
  // Factory Requests Table
  doc.addPage();
  doc.setFontSize(16);
  doc.setTextColor(17, 24, 39);
  doc.text('🏭 Factory Requests from Branches', 20, 25);
  
  // Professional Table with better styling
  const headers = ['Request ID', 'Branch', 'Items', 'Date', 'Status'];
  const colWidths = [25, 35, 60, 25, 25];
  let xPos = 20;
  let tableY = 35;
  
  // Table header with gradient effect
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.setFillColor(34, 197, 94);
  
  headers.forEach((header, index) => {
    doc.rect(xPos, tableY, colWidths[index], 12, 'F');
    doc.text(header, xPos + 3, tableY + 8);
    xPos += colWidths[index];
  });
  
  // Table data with alternating row colors
  doc.setTextColor(17, 24, 39);
  doc.setFontSize(9);
  
  let currentY = tableY + 12;
  factoryRequests.forEach((request, index) => {
    if (currentY > 250) {
      doc.addPage();
      currentY = 20;
      tableY = 20;
    }
    
    // Alternating row colors
    if (index % 2 === 0) {
      doc.setFillColor(248, 250, 252);
    } else {
      doc.setFillColor(255, 255, 255);
    }
    
    xPos = 20;
    doc.rect(xPos, currentY, colWidths[0], 10, 'F');
    doc.text(request._id.slice(-8), xPos + 3, currentY + 7);
    xPos += colWidths[0];
    
    doc.rect(xPos, currentY, colWidths[1], 10, 'F');
    doc.text(request.branchName.substring(0, 15), xPos + 3, currentY + 7);
    xPos += colWidths[1];
    
    doc.rect(xPos, currentY, colWidths[2], 10, 'F');
    const itemsText = request.items.map(item => `${item.name} (${item.requestedQuantity})`).join(', ');
    doc.text(itemsText.substring(0, 25) + (itemsText.length > 25 ? '...' : ''), xPos + 3, currentY + 7);
    xPos += colWidths[2];
    
    doc.rect(xPos, currentY, colWidths[3], 10, 'F');
    doc.text(new Date(request.requestedAt).toLocaleDateString().substring(0, 8), xPos + 3, currentY + 7);
    xPos += colWidths[3];
    
    doc.rect(xPos, currentY, colWidths[4], 10, 'F');
    // Status with color coding
    const statusColor = request.status === 'pending' ? [245, 158, 11] : 
                       request.status === 'fulfilled' ? [34, 197, 94] : [239, 68, 68];
    doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
    doc.text(request.status.substring(0, 8), xPos + 3, currentY + 7);
    doc.setTextColor(17, 24, 39); // Reset color
    
    currentY += 10;
  });
  
  // Collection Requests Section
  if (collectionRequests.length > 0) {
    doc.addPage();
    doc.setFontSize(16);
    doc.setTextColor(17, 24, 39);
    doc.text('♻️ Collection Requests', 20, 25);
    
    // Collection requests table headers
    const collectionHeaders = ['Request ID', 'Branch', 'Type', 'Date', 'Status'];
    const collectionColWidths = [25, 35, 40, 25, 25];
    xPos = 20;
    tableY = 35;
    
    doc.setFontSize(11);
    doc.setTextColor(255, 255, 255);
    doc.setFillColor(59, 130, 246);
    
    collectionHeaders.forEach((header, index) => {
      doc.rect(xPos, tableY, collectionColWidths[index], 12, 'F');
      doc.text(header, xPos + 3, tableY + 8);
      xPos += collectionColWidths[index];
    });
    
    // Collection requests table data
    doc.setTextColor(17, 24, 39);
    doc.setFontSize(9);
    
    currentY = tableY + 12;
    collectionRequests.forEach((request, index) => {
      if (currentY > 250) {
        doc.addPage();
        currentY = 20;
        tableY = 20;
      }
      
      // Alternating row colors
      if (index % 2 === 0) {
        doc.setFillColor(248, 250, 252);
      } else {
        doc.setFillColor(255, 255, 255);
      }
      
      xPos = 20;
      doc.rect(xPos, currentY, collectionColWidths[0], 10, 'F');
      doc.text(request._id.slice(-8), xPos + 3, currentY + 7);
      xPos += collectionColWidths[0];
      
      doc.rect(xPos, currentY, collectionColWidths[1], 10, 'F');
      doc.text(request.branchName.substring(0, 15), xPos + 3, currentY + 7);
      xPos += collectionColWidths[1];
      
      doc.rect(xPos, currentY, collectionColWidths[2], 10, 'F');
      doc.text(request.requestType.substring(0, 18), xPos + 3, currentY + 7);
      xPos += collectionColWidths[2];
      
      doc.rect(xPos, currentY, collectionColWidths[3], 10, 'F');
      doc.text(new Date(request.requestedAt).toLocaleDateString().substring(0, 8), xPos + 3, currentY + 7);
      xPos += collectionColWidths[3];
      
      doc.rect(xPos, currentY, collectionColWidths[4], 10, 'F');
      // Status with color coding
      const statusColor = request.status === 'pending' ? [245, 158, 11] : 
                         request.status === 'completed' ? [34, 197, 94] : [239, 68, 68];
      doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
      doc.text(request.status.substring(0, 8), xPos + 3, currentY + 7);
      doc.setTextColor(17, 24, 39); // Reset color
      
      currentY += 10;
    });
  }
  
  // Professional Footer
  doc.addPage();
  doc.setFillColor(17, 24, 39);
  doc.rect(0, 270, 210, 20, 'F');
  
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text('AquaLink Factory Orders Management System', 105, 275, { align: 'center' });
  doc.setFontSize(8);
  doc.text('This report was generated automatically by the AquaLink system', 105, 282, { align: 'center' });
  doc.text('For support, contact: support@aqualink.com | www.aqualink.com', 105, 287, { align: 'center' });
  
  doc.save('factory-orders-report.pdf');
};

// Generate Factory Inventory Report PDF
export const generateFactoryInventoryReportPDF = async (inventoryData, inventoryStats) => {
  const doc = new jsPDF();
  
  // Professional Header with Logo Area
  doc.setFillColor(59, 130, 246); // Blue background
  doc.rect(0, 0, 210, 35, 'F');
  
  // Company Logo Area (placeholder)
  doc.setFillColor(255, 255, 255);
  doc.rect(15, 8, 20, 20, 'F');
  doc.setFontSize(16);
  doc.setTextColor(59, 130, 246);
  doc.text('AQL', 25, 20, { align: 'center' });
  
  // Company Name and Title
  doc.setFontSize(24);
  doc.setTextColor(255, 255, 255);
  doc.text('AquaLink', 50, 18);
  doc.setFontSize(14);
  doc.text('Factory Inventory Management Report', 50, 25);
  
  // Report Details
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text(`Generated: ${new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })}`, 150, 18);
  doc.text(`Report ID: FI-${Date.now().toString().slice(-6)}`, 150, 25);
  
  // Executive Summary Section
  doc.setFillColor(248, 250, 252); // Light gray background
  doc.rect(15, 45, 180, 50, 'F');
  
  doc.setFontSize(16);
  doc.setTextColor(17, 24, 39);
  doc.text('📊 Executive Summary', 20, 55);
  
  // Summary Cards
  const cardWidth = 40;
  const cardHeight = 25;
  const startX = 20;
  const startY = 65;
  
  // Total Items Card
  doc.setFillColor(59, 130, 246);
  doc.rect(startX, startY, cardWidth, cardHeight, 'F');
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  doc.text('Total Items', startX + 2, startY + 8);
  doc.setFontSize(18);
  doc.text((inventoryStats?.totalItems || inventoryData.length).toString(), startX + 2, startY + 18);
  
  // Low Stock Items Card
  const lowStockCount = inventoryStats?.lowStockItems || inventoryData.filter(item => item.status === 'Low Stock').length;
  doc.setFillColor(245, 158, 11);
  doc.rect(startX + cardWidth + 5, startY, cardWidth, cardHeight, 'F');
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  doc.text('Low Stock', startX + cardWidth + 7, startY + 8);
  doc.setFontSize(18);
  doc.text(lowStockCount.toString(), startX + cardWidth + 7, startY + 18);
  
  // Out of Stock Items Card
  const outOfStockCount = inventoryStats?.outOfStockItems || inventoryData.filter(item => item.status === 'Out of Stock').length;
  doc.setFillColor(239, 68, 68);
  doc.rect(startX + (cardWidth + 5) * 2, startY, cardWidth, cardHeight, 'F');
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  doc.text('Out of Stock', startX + (cardWidth + 5) * 2 + 2, startY + 8);
  doc.setFontSize(18);
  doc.text(outOfStockCount.toString(), startX + (cardWidth + 5) * 2 + 2, startY + 18);
  
  // Status Breakdown
  const statusCounts = inventoryData.reduce((acc, item) => {
    acc[item.status] = (acc[item.status] || 0) + 1;
    return acc;
  }, {});
  
  let yPos = 120;
  doc.setFontSize(14);
  doc.setTextColor(17, 24, 39);
  doc.text('📈 Status Distribution', 20, yPos);
  
  yPos += 10;
  doc.setFontSize(10);
  Object.entries(statusCounts).forEach(([status, count]) => {
    const percentage = ((count / inventoryData.length) * 100).toFixed(1);
    doc.text(`• ${status}: ${count} (${percentage}%)`, 20, yPos);
    yPos += 6;
  });
  
  // Inventory Details Table
  doc.addPage();
  doc.setFontSize(16);
  doc.setTextColor(17, 24, 39);
  doc.text('📦 Inventory Details', 20, 25);
  
  // Professional Table with better styling
  const headers = ['Item Name', 'Quantity', 'Status', 'Supplier', 'Last Updated'];
  const colWidths = [45, 20, 25, 35, 30];
  let xPos = 20;
  let tableY = 35;
  
  // Table header with gradient effect
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.setFillColor(59, 130, 246);
  
  headers.forEach((header, index) => {
    doc.rect(xPos, tableY, colWidths[index], 12, 'F');
    doc.text(header, xPos + 3, tableY + 8);
    xPos += colWidths[index];
  });
  
  // Table data with alternating row colors
  doc.setTextColor(17, 24, 39);
  doc.setFontSize(9);
  
  let currentY = tableY + 12;
  inventoryData.forEach((item, index) => {
    if (currentY > 250) {
      doc.addPage();
      currentY = 20;
      tableY = 20;
    }
    
    // Alternating row colors
    if (index % 2 === 0) {
      doc.setFillColor(248, 250, 252);
    } else {
      doc.setFillColor(255, 255, 255);
    }
    
    xPos = 20;
    doc.rect(xPos, currentY, colWidths[0], 10, 'F');
    doc.text(item.name.substring(0, 20), xPos + 3, currentY + 7);
    xPos += colWidths[0];
    
    doc.rect(xPos, currentY, colWidths[1], 10, 'F');
    doc.text(`${item.quantity} ${item.unit}`, xPos + 3, currentY + 7);
    xPos += colWidths[1];
    
    doc.rect(xPos, currentY, colWidths[2], 10, 'F');
    // Status with color coding
    const statusColor = item.status === 'In Stock' ? [34, 197, 94] : 
                       item.status === 'Low Stock' ? [245, 158, 11] : [239, 68, 68];
    doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
    doc.text(item.status.substring(0, 10), xPos + 3, currentY + 7);
    doc.setTextColor(17, 24, 39); // Reset color
    xPos += colWidths[2];
    
    doc.rect(xPos, currentY, colWidths[3], 10, 'F');
    doc.text((item.supplier || 'N/A').substring(0, 15), xPos + 3, currentY + 7);
    xPos += colWidths[3];
    
    doc.rect(xPos, currentY, colWidths[4], 10, 'F');
    doc.text(new Date(item.lastUpdated).toLocaleDateString().substring(0, 8), xPos + 3, currentY + 7);
    
    currentY += 10;
  });
  
  // Low Stock Alert Section
  const lowStockItems = inventoryData.filter(item => 
    item.status === 'Low Stock' || item.status === 'Out of Stock'
  );
  
  if (lowStockItems.length > 0) {
    doc.addPage();
    
    // Alert Header with background
    doc.setFillColor(254, 226, 226); // Light red background
    doc.rect(15, 15, 180, 25, 'F');
    
    doc.setFontSize(18);
    doc.setTextColor(220, 38, 38); // Red color for alerts
    doc.text('⚠️ Critical Stock Alerts', 20, 30);
    
    doc.setFontSize(12);
    doc.setTextColor(17, 24, 39);
    doc.text('Items requiring immediate attention:', 20, 45);
    
    let alertY = 55;
    lowStockItems.forEach((item, index) => {
      if (alertY > 250) {
        doc.addPage();
        alertY = 20;
      }
      
      // Alert item box
      doc.setFillColor(255, 255, 255);
      doc.rect(15, alertY - 5, 180, 30, 'F');
      doc.setDrawColor(220, 38, 38);
      doc.rect(15, alertY - 5, 180, 30, 'S');
      
      doc.setFontSize(12);
      doc.setTextColor(17, 24, 39);
      doc.text(`${index + 1}. ${item.name}`, 20, alertY + 5);
      
      doc.setFontSize(10);
      doc.setTextColor(107, 114, 128);
      doc.text(`Current Stock: ${item.quantity} ${item.unit}`, 20, alertY + 12);
      doc.text(`Status: ${item.status}`, 20, alertY + 20);
      if (item.supplier) {
        doc.text(`Supplier: ${item.supplier}`, 120, alertY + 20);
      }
      
      alertY += 40;
    });
  }
  
  // Professional Footer
  doc.addPage();
  doc.setFillColor(17, 24, 39);
  doc.rect(0, 270, 210, 20, 'F');
  
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text('AquaLink Factory Inventory Management System', 105, 275, { align: 'center' });
  doc.setFontSize(8);
  doc.text('This report was generated automatically by the AquaLink system', 105, 282, { align: 'center' });
  doc.text('For support, contact: support@aqualink.com | www.aqualink.com', 105, 287, { align: 'center' });
  
  doc.save('factory-inventory-report.pdf');
};