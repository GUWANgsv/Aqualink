import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../Context/AuthContext';
import { useCart } from '../../Context/CartContext';
import { generateReceiptPDF, generateOrderId, formatDate } from '../../utils/pdfGenerator';
import UniversalNavbar from '../Nav/UniversalNavbar';
import { customerPurchaseAPI } from '../../utils/apiService';

const Payment = () => {
  const { user } = useAuth();
  const { clearCart } = useCart();
  const location = useLocation();
  const navigate = useNavigate();
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [processing, setProcessing] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [downloadingReceipt, setDownloadingReceipt] = useState(false);
  const [paymentError, setPaymentError] = useState('');

  // Get data from location state or use defaults
  const shippingDetails = {
    ...(location.state?.shippingDetails || {
      firstName: user?.name?.split(' ')[0] || '',
      lastName: user?.name?.split(' ').slice(1).join(' ') || '',
      email: user?.email || '',
      phone: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'Sri Lanka'
    }),
    customerId: user?._id
  };

  const orderSummary = location.state?.orderSummary || {
    items: [],
    subtotal: 0,
    tax: 0,
    total: 0
  };

  useEffect(() => {
    if (!location.state) {
      navigate('/cart');
    }
  }, [location.state, navigate]);

  const handlePaymentMethodChange = (method) => {
    setPaymentMethod(method);
    setPaymentError('');
  };

  const processPayment = async () => {
    if (!shippingDetails.firstName || !shippingDetails.lastName || !shippingDetails.email || !shippingDetails.phone || !shippingDetails.address) {
      setPaymentError('Please fill in all required shipping details');
      return;
    }

    // If card payment is selected, navigate to payment gateway
    if (paymentMethod === 'card') {
      navigate('/payment-gateway', {
        state: {
          shippingDetails,
          orderSummary
        }
      });
      return;
    }

    // Process cash payment directly
    setProcessing(true);
    setPaymentError('');

    try {
      // Prepare order data
      const orderData = {
        customerId: shippingDetails.customerId,
        customerName: `${shippingDetails.firstName} ${shippingDetails.lastName}`,
        customerEmail: shippingDetails.email,
        customerPhone: shippingDetails.phone,
        items: orderSummary.items.map(item => ({
          itemName: item.name,
          quantity: item.quantity,
          unitPrice: item.price
        })),
        paymentMethod: 'Cash',
        deliveryAddress: {
          street: shippingDetails.address,
          city: shippingDetails.city,
          state: shippingDetails.state,
          postalCode: shippingDetails.zipCode,
          country: shippingDetails.country
        },
        notes: 'Order placed via online checkout - Payment Method: Cash'
      };

      // Submit order to backend
      const response = await customerPurchaseAPI.submitOrder(orderData);

      if (response.success) {
        const orderNumber = response.purchase?.purchaseNumber || generateOrderId();
        setOrderId(orderNumber);
        setOrderComplete(true);
        clearCart();
      } else {
        setPaymentError(response.message || 'Failed to process order');
      }
    } catch (error) {
      console.error('Payment processing error:', error);
      
      // More detailed error message
      let errorMessage = 'Payment processing failed. Please try again.';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.status === 404) {
        errorMessage = 'Backend server not found. Please check if the server is running.';
      } else if (error.response?.status === 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setPaymentError(errorMessage);
    } finally {
      setProcessing(false);
    }
  };

  const downloadReceipt = async () => {
    setDownloadingReceipt(true);
    try {
      const receiptData = {
        orderId: orderId,
        customerName: `${shippingDetails.firstName} ${shippingDetails.lastName}`,
        customerEmail: shippingDetails.email,
        customerPhone: shippingDetails.phone,
        shippingAddress: `${shippingDetails.address}, ${shippingDetails.city}, ${shippingDetails.state} ${shippingDetails.zipCode}, ${shippingDetails.country}`,
        items: orderSummary.items,
        subtotal: orderSummary.subtotal,
        tax: orderSummary.tax,
        total: orderSummary.total,
        orderDate: formatDate(new Date()),
        paymentMethod: paymentMethod === 'card' ? 'Card' : 'Cash'
      };

      await generateReceiptPDF(receiptData);
    } catch (error) {
      console.error('Error generating receipt:', error);
    } finally {
      setDownloadingReceipt(false);
    }
  };

  if (orderComplete) {
    return (
      <div className="min-h-screen bg-gray-50">
        <UniversalNavbar />
        <div className="pt-16">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <div className="text-6xl mb-6">✅</div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">Order Placed Successfully!</h1>
              <p className="text-gray-600 mb-6">
                Thank you for your order. Your order number is <span className="font-semibold text-blue-600">{orderId}</span>
              </p>
              <p className="text-gray-600 mb-8">
                {paymentMethod === 'card' ? 
                  'Your payment has been processed successfully.' : 
                  'You will pay cash when your order arrives.'
                }
              </p>
              
              <div className="space-y-4">
                <button
                  onClick={downloadReceipt}
                  disabled={downloadingReceipt}
                  className="w-full bg-blue-500 text-white py-3 px-4 rounded-lg hover:bg-blue-600 transition-colors duration-300 font-medium disabled:opacity-50"
                >
                  {downloadingReceipt ? 'Generating Receipt...' : 'Download Receipt'}
                </button>
                
                <button
                  onClick={() => navigate('/my-account')}
                  className="w-full bg-gray-500 text-white py-3 px-4 rounded-lg hover:bg-gray-600 transition-colors duration-300 font-medium"
                >
                  View Order History
                </button>
                
                <button
                  onClick={() => navigate('/products')}
                  className="w-full bg-green-500 text-white py-3 px-4 rounded-lg hover:bg-green-600 transition-colors duration-300 font-medium"
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <UniversalNavbar />
      <div className="pt-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Payment</h1>
            <p className="text-gray-600 mt-2">Complete your purchase securely.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Payment Details */}
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Payment Method</h2>
                
                <div className="space-y-3">
                  <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="cash"
                      checked={paymentMethod === 'cash'}
                      onChange={(e) => handlePaymentMethodChange(e.target.value)}
                      className="mr-3"
                    />
                    <div>
                      <div className="font-medium text-gray-900">Cash on Delivery</div>
                      <div className="text-sm text-gray-500">Pay when your order arrives</div>
                    </div>
                  </label>

                  <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="card"
                      checked={paymentMethod === 'card'}
                      onChange={(e) => handlePaymentMethodChange(e.target.value)}
                      className="mr-3"
                    />
                    <div>
                      <div className="font-medium text-gray-900">Credit/Debit Card</div>
                      <div className="text-sm text-gray-500">Pay securely online</div>
                    </div>
                  </label>
                </div>

                {paymentError && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-600 text-sm">{paymentError}</p>
                  </div>
                )}

                <button
                  onClick={processPayment}
                  disabled={processing}
                  className="w-full mt-6 bg-blue-500 text-white py-3 px-4 rounded-lg hover:bg-blue-600 transition-colors duration-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {processing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processing...
                    </>
                  ) : paymentMethod === 'card' ? (
                    'Proceed to Payment Gateway'
                  ) : (
                    `Place Order - LKR ${orderSummary.total.toFixed(2)}`
                  )}
                </button>

                <div className="mt-4 flex items-center text-sm text-gray-500">
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                  Your payment information is secure and encrypted.
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Summary</h2>
              
              <div className="space-y-3 mb-6">
                {orderSummary.items.map((item, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">💧</span>
                      <div>
                        <div className="font-medium text-gray-900">{item.name}</div>
                        <div className="text-sm text-gray-500">Qty: {item.quantity}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-gray-900">LKR {(item.price * item.quantity).toFixed(2)}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="text-gray-900">LKR {orderSummary.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Shipping</span>
                  <span className="text-green-600 font-medium">Free</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax (15%)</span>
                  <span className="text-gray-900">LKR {orderSummary.tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-semibold border-t pt-2">
                  <span className="text-gray-900">Total</span>
                  <span className="text-gray-900">LKR {orderSummary.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payment;