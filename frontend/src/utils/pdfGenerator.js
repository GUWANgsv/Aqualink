import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const generateReceiptPDF = async (orderData) => {
  const {
    orderId,
    customerName,
    customerEmail,
    customerPhone,
    shippingAddress,
    items,
    subtotal,
    tax,
    total,
    orderDate,
    paymentMethod
  } = orderData;

  // Create a temporary div to render the receipt
  const receiptDiv = document.createElement('div');
  receiptDiv.style.position = 'absolute';
  receiptDiv.style.left = '-9999px';
  receiptDiv.style.top = '0';
  receiptDiv.style.width = '800px';
  receiptDiv.style.backgroundColor = 'white';
  receiptDiv.style.padding = '40px';
  receiptDiv.style.fontFamily = 'Arial, sans-serif';
  receiptDiv.style.fontSize = '12px';
  receiptDiv.style.lineHeight = '1.4';
  receiptDiv.style.color = '#333';

  // Generate receipt HTML
  receiptDiv.innerHTML = `
    <div style="text-align: center; margin-bottom: 30px;">
      <h1 style="color: #2563eb; margin: 0; font-size: 28px; font-weight: bold;">AquaLink</h1>
      <p style="margin: 5px 0; color: #666;">Premium Water Solutions</p>
      <p style="margin: 5px 0; color: #666;">Receipt</p>
    </div>

    <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
      <div>
        <h3 style="margin: 0 0 10px 0; color: #2563eb;">Bill To:</h3>
        <p style="margin: 5px 0;"><strong>${customerName}</strong></p>
        <p style="margin: 5px 0;">${customerEmail}</p>
        <p style="margin: 5px 0;">${customerPhone}</p>
        <p style="margin: 5px 0;">${shippingAddress}</p>
      </div>
      <div style="text-align: right;">
        <h3 style="margin: 0 0 10px 0; color: #2563eb;">Order Details:</h3>
        <p style="margin: 5px 0;"><strong>Order ID:</strong> ${orderId}</p>
        <p style="margin: 5px 0;"><strong>Date:</strong> ${orderDate}</p>
        <p style="margin: 5px 0;"><strong>Payment:</strong> ${paymentMethod}</p>
      </div>
    </div>

    <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
      <thead>
        <tr style="background-color: #f8fafc; border-bottom: 2px solid #e2e8f0;">
          <th style="padding: 12px; text-align: left; border-bottom: 1px solid #e2e8f0;">Item</th>
          <th style="padding: 12px; text-align: center; border-bottom: 1px solid #e2e8f0;">Category</th>
          <th style="padding: 12px; text-align: center; border-bottom: 1px solid #e2e8f0;">Qty</th>
          <th style="padding: 12px; text-align: right; border-bottom: 1px solid #e2e8f0;">Price</th>
          <th style="padding: 12px; text-align: right; border-bottom: 1px solid #e2e8f0;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${items.map(item => `
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 12px; text-align: left;">
              <strong>${item.name}</strong>
            </td>
            <td style="padding: 12px; text-align: center; text-transform: capitalize;">
              ${item.category.replace('-', ' ')}
            </td>
            <td style="padding: 12px; text-align: center;">${item.quantity}</td>
            <td style="padding: 12px; text-align: right;">LKR ${item.price.toFixed(2)}</td>
            <td style="padding: 12px; text-align: right; font-weight: bold;">
              LKR ${(item.price * item.quantity).toFixed(2)}
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <div style="display: flex; justify-content: flex-end; margin-bottom: 30px;">
      <table style="width: 300px;">
        <tr>
          <td style="padding: 8px 0; text-align: right;"><strong>Subtotal:</strong></td>
          <td style="padding: 8px 0; text-align: right;">LKR ${subtotal.toFixed(2)}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; text-align: right;"><strong>Tax (15%):</strong></td>
          <td style="padding: 8px 0; text-align: right;">LKR ${tax.toFixed(2)}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; text-align: right;"><strong>Shipping:</strong></td>
          <td style="padding: 8px 0; text-align: right; color: #059669;">Free</td>
        </tr>
        <tr style="border-top: 2px solid #e2e8f0;">
          <td style="padding: 12px 0; text-align: right; font-size: 16px; font-weight: bold;">
            <strong>Total:</strong>
          </td>
          <td style="padding: 12px 0; text-align: right; font-size: 16px; font-weight: bold;">
            LKR ${total.toFixed(2)}
          </td>
        </tr>
      </table>
    </div>

    <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
      <p style="margin: 5px 0; color: #666;">Thank you for your purchase!</p>
      <p style="margin: 5px 0; color: #666;">For support, contact us at support@aqualink.com</p>
      <p style="margin: 5px 0; color: #666;">www.aqualink.com</p>
    </div>
  `;

  // Add the div to the document
  document.body.appendChild(receiptDiv);

  try {
    // Convert the div to canvas
    const canvas = await html2canvas(receiptDiv, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff'
    });

    // Remove the temporary div
    document.body.removeChild(receiptDiv);

    // Create PDF
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pdfWidth - 20; // 10mm margin on each side
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    // Add image to PDF
    pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);

    // If content is longer than one page, add new pages
    let heightLeft = imgHeight;
    let position = 10;

    while (heightLeft >= pdfHeight) {
      position = heightLeft - pdfHeight + 10;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 10, -position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;
    }

    // Save the PDF
    const fileName = `receipt_${orderId}_${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(fileName);

    return fileName;
  } catch (error) {
    console.error('Error generating PDF:', error);
    // Remove the temporary div in case of error
    if (document.body.contains(receiptDiv)) {
      document.body.removeChild(receiptDiv);
    }
    throw error;
  }
};

// Helper function to generate order ID
export const generateOrderId = () => {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substr(2, 5).toUpperCase();
  return `AQL-${timestamp.slice(-6)}-${random}`;
};

// Helper function to format date
export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Generate delivery logs PDF
export const generateDeliveryLogsPDF = async (driverData, deliveryLogs, period = 'monthly') => {
  const {
    name,
    email,
    phone,
    vehicleNumber,
    branch
  } = driverData;

  // Create a temporary div to render the delivery logs
  const logsDiv = document.createElement('div');
  logsDiv.style.position = 'absolute';
  logsDiv.style.left = '-9999px';
  logsDiv.style.top = '0';
  logsDiv.style.width = '800px';
  logsDiv.style.backgroundColor = 'white';
  logsDiv.style.padding = '40px';
  logsDiv.style.fontFamily = 'Arial, sans-serif';
  logsDiv.style.fontSize = '12px';
  logsDiv.style.lineHeight = '1.4';
  logsDiv.style.color = '#333';

  // Calculate totals
  const totalDeliveries = deliveryLogs.reduce((sum, log) => sum + log.deliveries, 0);
  const totalCompleted = deliveryLogs.reduce((sum, log) => sum + log.completed, 0);
  const totalEarnings = deliveryLogs.reduce((sum, log) => sum + (log.totalAmount || 0), 0);

  // Generate delivery logs HTML
  logsDiv.innerHTML = `
    <div style="text-align: center; margin-bottom: 30px;">
      <h1 style="color: #2563eb; margin: 0; font-size: 28px; font-weight: bold;">AquaLink</h1>
      <p style="margin: 5px 0; color: #666;">Premium Water Solutions</p>
      <p style="margin: 5px 0; color: #666;">Driver Delivery Logs - ${period.charAt(0).toUpperCase() + period.slice(1)} Report</p>
    </div>

    <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
      <div>
        <h3 style="margin: 0 0 10px 0; color: #2563eb;">Driver Information:</h3>
        <p style="margin: 5px 0;"><strong>Name:</strong> ${name}</p>
        <p style="margin: 5px 0;"><strong>Email:</strong> ${email}</p>
        <p style="margin: 5px 0;"><strong>Phone:</strong> ${phone}</p>
        <p style="margin: 5px 0;"><strong>Vehicle:</strong> ${vehicleNumber}</p>
        <p style="margin: 5px 0;"><strong>Branch:</strong> ${branch}</p>
      </div>
      <div style="text-align: right;">
        <h3 style="margin: 0 0 10px 0; color: #2563eb;">Report Summary:</h3>
        <p style="margin: 5px 0;"><strong>Period:</strong> ${period.charAt(0).toUpperCase() + period.slice(1)}</p>
        <p style="margin: 5px 0;"><strong>Generated:</strong> ${new Date().toLocaleDateString()}</p>
        <p style="margin: 5px 0;"><strong>Total Deliveries:</strong> ${totalDeliveries}</p>
        <p style="margin: 5px 0;"><strong>Completed:</strong> ${totalCompleted}</p>
        <p style="margin: 5px 0;"><strong>Total Earnings:</strong> Rs. ${totalEarnings.toFixed(2)}</p>
      </div>
    </div>

    <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
      <thead>
        <tr style="background-color: #f8fafc; border-bottom: 2px solid #e2e8f0;">
          <th style="padding: 12px; text-align: left; border-bottom: 1px solid #e2e8f0;">Date</th>
          <th style="padding: 12px; text-align: center; border-bottom: 1px solid #e2e8f0;">Total Deliveries</th>
          <th style="padding: 12px; text-align: center; border-bottom: 1px solid #e2e8f0;">Completed</th>
          <th style="padding: 12px; text-align: center; border-bottom: 1px solid #e2e8f0;">Cancelled</th>
          <th style="padding: 12px; text-align: right; border-bottom: 1px solid #e2e8f0;">Earnings</th>
        </tr>
      </thead>
      <tbody>
        ${deliveryLogs.map(log => `
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 12px; text-align: left;">
              ${new Date(log.date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              })}
            </td>
            <td style="padding: 12px; text-align: center;">${log.deliveries}</td>
            <td style="padding: 12px; text-align: center; color: #059669;">${log.completed}</td>
            <td style="padding: 12px; text-align: center; color: #dc2626;">${log.deliveries - log.completed}</td>
            <td style="padding: 12px; text-align: right; font-weight: bold;">
              Rs. ${(log.totalAmount || 0).toFixed(2)}
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <div style="display: flex; justify-content: flex-end; margin-bottom: 30px;">
      <table style="width: 300px;">
        <tr>
          <td style="padding: 8px 0; text-align: right;"><strong>Total Deliveries:</strong></td>
          <td style="padding: 8px 0; text-align: right;">${totalDeliveries}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; text-align: right;"><strong>Completed:</strong></td>
          <td style="padding: 8px 0; text-align: right; color: #059669;">${totalCompleted}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; text-align: right;"><strong>Cancelled:</strong></td>
          <td style="padding: 8px 0; text-align: right; color: #dc2626;">${totalDeliveries - totalCompleted}</td>
        </tr>
        <tr style="border-top: 2px solid #e2e8f0;">
          <td style="padding: 12px 0; text-align: right; font-size: 16px; font-weight: bold;">
            <strong>Total Earnings:</strong>
          </td>
          <td style="padding: 12px 0; text-align: right; font-size: 16px; font-weight: bold;">
            Rs. ${totalEarnings.toFixed(2)}
          </td>
        </tr>
      </table>
    </div>

    <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
      <p style="margin: 5px 0; color: #666;">This report was generated automatically by AquaLink System</p>
      <p style="margin: 5px 0; color: #666;">For support, contact us at support@aqualink.com</p>
      <p style="margin: 5px 0; color: #666;">www.aqualink.com</p>
    </div>
  `;

  // Add the div to the document
  document.body.appendChild(logsDiv);

  try {
    // Convert the div to canvas
    const canvas = await html2canvas(logsDiv, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff'
    });

    // Remove the temporary div
    document.body.removeChild(logsDiv);

    // Create PDF
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pdfWidth - 20; // 10mm margin on each side
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    // Add image to PDF
    pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);

    // If content is longer than one page, add new pages
    let heightLeft = imgHeight;
    let position = 10;

    while (heightLeft >= pdfHeight) {
      position = heightLeft - pdfHeight + 10;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 10, -position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;
    }

    // Save the PDF
    const fileName = `delivery_logs_${name.replace(/\s+/g, '_')}_${period}_${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(fileName);

    return fileName;
  } catch (error) {
    console.error('Error generating delivery logs PDF:', error);
    // Remove the temporary div in case of error
    if (document.body.contains(logsDiv)) {
      document.body.removeChild(logsDiv);
    }
    throw error;
  }
};