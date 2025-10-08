import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../Context/AuthContext';
import { useCart } from '../../Context/CartContext';
import { generateReceiptPDF, generateOrderId, formatDate } from '../../utils/pdfGenerator';
import UniversalNavbar from '../Nav/UniversalNavbar';
import { customerPurchaseAPI } from '../../utils/apiService';

const PaymentGateway = () => {
  const { user } = useAuth();
  const { clearCart } = useCart();
  const navigate = useNavigate();
  
  // Get data from location state
  const location = useLocation();
  const shippingDetails = location.state?.shippingDetails || {};
  const orderSummary = location.state?.orderSummary || {};
  
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: ''
  });
  
  const [processing, setProcessing] = useState(false);
  const [errors, setErrors] = useState({});
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [cardType, setCardType] = useState('');
  const [isSecure, setIsSecure] = useState(false);

  // Redirect if no data is passed
  useEffect(() => {
    if (!location.state) {
      navigate('/cart');
    }
  }, [location.state, navigate]);

  // Simulate security check
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsSecure(true);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  // Detect card type based on card number
  const detectCardType = (number) => {
    const cleanNumber = number.replace(/\s/g, '');
    if (cleanNumber.startsWith('4')) return 'visa';
    if (cleanNumber.startsWith('5') || cleanNumber.startsWith('2')) return 'mastercard';
    if (cleanNumber.startsWith('3')) return 'amex';
    if (cleanNumber.startsWith('6')) return 'discover';
    return '';
  };

  // Validate card details
  const validateCardDetails = () => {
    const newErrors = {};
    const cleanCardNumber = cardDetails.cardNumber.replace(/\s/g, '');
    
    // Card number validation (Luhn algorithm simulation)
    if (!cleanCardNumber || cleanCardNumber.length < 16) {
      newErrors.cardNumber = 'Please enter a valid 16-digit card number';
    }
    
    // Expiry date validation
    if (!cardDetails.expiryDate || !/^\d{2}\/\d{2}$/.test(cardDetails.expiryDate)) {
      newErrors.expiryDate = 'Please enter expiry date in MM/YY format';
    } else {
      const [month, year] = cardDetails.expiryDate.split('/');
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear() % 100;
      const currentMonth = currentDate.getMonth() + 1;
      
      if (parseInt(month) < 1 || parseInt(month) > 12) {
        newErrors.expiryDate = 'Please enter a valid month (01-12)';
      } else if (parseInt(year) < currentYear || (parseInt(year) === currentYear && parseInt(month) < currentMonth)) {
        newErrors.expiryDate = 'Card has expired';
      }
    }
    
    // CVV validation
    if (!cardDetails.cvv || cardDetails.cvv.length < 3) {
      newErrors.cvv = 'Please enter a valid CVV';
    }
    
    // Cardholder name validation
    if (!cardDetails.cardholderName.trim()) {
      newErrors.cardholderName = 'Please enter cardholder name';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Format card number with spaces and detect type
  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      const formatted = parts.join(' ');
      const detectedType = detectCardType(formatted);
      setCardType(detectedType);
      if (detectedType) {
        console.log(`Card type detected: ${detectedType.toUpperCase()}`);
      }
      return formatted;
    } else {
      setCardType('');
      return v;
    }
  };

  // Format expiry date
  const formatExpiryDate = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  const handleInputChange = (field, value) => {
    let formattedValue = value;
    
    if (field === 'cardNumber') {
      formattedValue = formatCardNumber(value);
    } else if (field === 'expiryDate') {
      formattedValue = formatExpiryDate(value);
    } else if (field === 'cvv') {
      formattedValue = value.replace(/[^0-9]/gi, '');
    }
    
    setCardDetails(prev => ({
      ...prev,
      [field]: formattedValue
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const processPayment = async () => {
    if (!validateCardDetails()) {
      return;
    }

    setProcessing(true);

    try {
      // Simulate payment processing with realistic steps
      await new Promise(resolve => setTimeout(resolve, 1500)); // Initial processing
      
      // Simulate additional security checks
      await new Promise(resolve => setTimeout(resolve, 1000)); // Security verification
      
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
        paymentMethod: 'Card',
        deliveryAddress: {
          street: shippingDetails.address,
          city: shippingDetails.city,
          state: shippingDetails.state,
          postalCode: shippingDetails.zipCode,
          country: shippingDetails.country
        },
        notes: `Order placed via online checkout - Payment Method: Card (${cardType.toUpperCase()} ****${cardDetails.cardNumber.slice(-4)})`
      };

      // Submit order to backend
      console.log('Submitting order data:', orderData);
      const response = await customerPurchaseAPI.submitOrder(orderData);

      if (response.success) {
        const orderNumber = response.purchase?.purchaseNumber || generateOrderId();
        setOrderId(orderNumber);
        setOrderComplete(true);
        clearCart();
        
        // Auto-generate bill/receipt
        await generateBill(orderNumber);
      } else {
        throw new Error(response.message || 'Failed to process order');
      }
    } catch (error) {
      console.error('Payment processing error:', error);
      console.error('Error details:', error.response?.data);
      
      let errorMessage = 'Payment processing failed. Please try again or contact support.';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setErrors({ general: errorMessage });
    } finally {
      setProcessing(false);
    }
  };

  const generateBill = async (orderNumber) => {
    try {
      const receiptData = {
        orderId: orderNumber,
        customerName: `${shippingDetails.firstName} ${shippingDetails.lastName}`,
        customerEmail: shippingDetails.email,
        customerPhone: shippingDetails.phone,
        shippingAddress: `${shippingDetails.address}, ${shippingDetails.city}, ${shippingDetails.state} ${shippingDetails.zipCode}, ${shippingDetails.country}`,
        items: orderSummary.items,
        subtotal: orderSummary.subtotal,
        tax: orderSummary.tax,
        total: orderSummary.total,
        orderDate: formatDate(new Date()),
        paymentMethod: 'Card',
        cardLastFour: cardDetails.cardNumber.slice(-4)
      };

      await generateReceiptPDF(receiptData);
    } catch (error) {
      console.error('Error generating bill:', error);
    }
  };

  const getCardIcon = () => {
    switch (cardType) {
      case 'visa': return (
        <div className="flex items-center">
          <div className="w-8 h-5 bg-blue-600 rounded flex items-center justify-center">
            <span className="text-white font-bold text-xs">VISA</span>
          </div>
        </div>
      );
      case 'mastercard': return (
        <div className="flex items-center">
          <div className="w-8 h-5 bg-red-600 rounded flex items-center justify-center">
            <span className="text-white font-bold text-xs">MC</span>
          </div>
        </div>
      );
      case 'amex': return (
        <div className="flex items-center">
          <div className="w-8 h-5 bg-green-600 rounded flex items-center justify-center">
            <span className="text-white font-bold text-xs">AMEX</span>
          </div>
        </div>
      );
      case 'discover': return (
        <div className="flex items-center">
          <div className="w-8 h-5 bg-orange-600 rounded flex items-center justify-center">
            <span className="text-white font-bold text-xs">DISC</span>
          </div>
        </div>
      );
      default: return '💳';
    }
  };

  if (orderComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
        <UniversalNavbar />
        <div className="pt-16">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="bg-white rounded-2xl shadow-xl p-8 text-center border border-green-200">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">Payment Successful!</h1>
              <p className="text-gray-600 mb-6">
                Your payment has been processed successfully. Order number: <span className="font-semibold text-blue-600">{orderId}</span>
              </p>
              <p className="text-gray-600 mb-8">
                Your receipt has been automatically generated and downloaded.
              </p>
              
              <div className="space-y-4">
                <button
                  onClick={() => navigate('/my-account')}
                  className="w-full bg-blue-600 text-white py-3 px-6 rounded-xl hover:bg-blue-700 transition-all duration-300 font-medium shadow-lg hover:shadow-xl"
                >
                  View Order History
                </button>
                
                <button
                  onClick={() => navigate('/products')}
                  className="w-full bg-green-600 text-white py-3 px-6 rounded-xl hover:bg-green-700 transition-all duration-300 font-medium shadow-lg hover:shadow-xl"
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <UniversalNavbar />
      <div className="pt-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mr-3">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h1 className="text-4xl font-bold text-gray-900">Secure Payment Gateway</h1>
            </div>
            <p className="text-gray-600 text-lg">Complete your payment securely with bank-level encryption</p>
            
            {/* Security Indicators */}
            <div className="flex items-center justify-center mt-4 space-x-6">
              <div className="flex items-center text-sm text-green-600">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
                SSL Encrypted
              </div>
              <div className="flex items-center text-sm text-green-600">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                PCI Compliant
              </div>
              <div className="flex items-center text-sm text-green-600">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                3D Secure
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Payment Form */}
            <div className="space-y-6">
              <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Payment Information</h2>
                  <div className="flex items-center space-x-2">
                    {cardType && (
                      <div className="flex items-center bg-gray-100 px-3 py-2 rounded-lg">
                        {getCardIcon()}
                        <span className="text-sm font-bold text-gray-700 uppercase ml-2">{cardType}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="space-y-6">
                  {/* Card Number */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Card Number *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={cardDetails.cardNumber}
                        onChange={(e) => handleInputChange('cardNumber', e.target.value)}
                        placeholder="1234 5678 9012 3456"
                        maxLength="19"
                        className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-lg ${
                          errors.cardNumber ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                        }`}
                      />
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        {cardType && getCardIcon()}
                      </div>
                    </div>
                    {errors.cardNumber && (
                      <p className="text-red-500 text-sm mt-2 flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {errors.cardNumber}
                      </p>
                    )}
                  </div>

                  {/* Cardholder Name */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Cardholder Name *
                    </label>
                    <input
                      type="text"
                      value={cardDetails.cardholderName}
                      onChange={(e) => handleInputChange('cardholderName', e.target.value)}
                      placeholder="Customer name"
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-lg ${
                        errors.cardholderName ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                      }`}
                    />
                    {errors.cardholderName && (
                      <p className="text-red-500 text-sm mt-2 flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {errors.cardholderName}
                      </p>
                    )}
                  </div>

                  {/* Expiry Date and CVV */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Expiry Date *
                      </label>
                      <input
                        type="text"
                        value={cardDetails.expiryDate}
                        onChange={(e) => handleInputChange('expiryDate', e.target.value)}
                        placeholder="MM/YY"
                        maxLength="5"
                        className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-lg ${
                          errors.expiryDate ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                        }`}
                      />
                      {errors.expiryDate && (
                        <p className="text-red-500 text-sm mt-2 flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          {errors.expiryDate}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        CVV *
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={cardDetails.cvv}
                          onChange={(e) => handleInputChange('cvv', e.target.value)}
                          placeholder="123"
                          maxLength="4"
                          className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-lg ${
                            errors.cvv ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                          }`}
                        />
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                        </div>
                      </div>
                      {errors.cvv && (
                        <p className="text-red-500 text-sm mt-2 flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          {errors.cvv}
                        </p>
                      )}
                    </div>
                  </div>

                  {errors.general && (
                    <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl">
                      <div className="flex items-center">
                        <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <p className="text-red-700 font-medium">{errors.general}</p>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={processPayment}
                    disabled={processing}
                    className="w-full mt-8 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-6 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 font-semibold text-lg shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {processing ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                        Processing Payment...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        Pay Securely - LKR {orderSummary.total?.toFixed(2) || '0.00'}
                      </>
                    )}
                  </button>

                  {/* Security Notice */}
                  <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                    <div className="flex items-start">
                      <svg className="w-5 h-5 text-blue-600 mr-3 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                      </svg>
                      <div>
                        <p className="text-blue-800 font-medium text-sm">Your payment is secure</p>
                        <p className="text-blue-700 text-xs mt-1">We use industry-standard encryption to protect your payment information. Your card details are never stored on our servers.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="space-y-6">
              <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Order Summary</h2>
                
                <div className="space-y-4 mb-6">
                  {orderSummary.items?.map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <span className="text-2xl mr-3">💧</span>
                        <div>
                          <div className="font-semibold text-gray-900">{item.name}</div>
                          <div className="text-sm text-gray-500">Qty: {item.quantity}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-gray-900">LKR {(item.price * item.quantity).toFixed(2)}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t-2 pt-6 space-y-3">
                  <div className="flex justify-between text-lg">
                    <span className="text-gray-600 font-medium">Subtotal</span>
                    <span className="text-gray-900 font-semibold">LKR {orderSummary.subtotal?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="flex justify-between text-lg">
                    <span className="text-gray-600 font-medium">Shipping</span>
                    <span className="text-green-600 font-semibold">Free</span>
                  </div>
                  <div className="flex justify-between text-lg">
                    <span className="text-gray-600 font-medium">Tax (15%)</span>
                    <span className="text-gray-900 font-semibold">LKR {orderSummary.tax?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="flex justify-between text-2xl font-bold border-t-2 pt-3">
                    <span className="text-gray-900">Total</span>
                    <span className="text-blue-600">LKR {orderSummary.total?.toFixed(2) || '0.00'}</span>
                  </div>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Accepted Payment Methods</h3>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center bg-blue-50 px-3 py-2 rounded-lg border border-blue-200">
                    <div className="w-6 h-4 bg-blue-600 rounded flex items-center justify-center mr-2">
                      <span className="text-white font-bold text-xs">VISA</span>
                    </div>
                    <span className="text-sm font-bold text-blue-800">Visa</span>
                  </div>
                  <div className="flex items-center bg-red-50 px-3 py-2 rounded-lg border border-red-200">
                    <div className="w-6 h-4 bg-red-600 rounded flex items-center justify-center mr-2">
                      <span className="text-white font-bold text-xs">MC</span>
                    </div>
                    <span className="text-sm font-bold text-red-800">Mastercard</span>
                  </div>
                  <div className="flex items-center bg-green-50 px-3 py-2 rounded-lg border border-green-200">
                    <div className="w-6 h-4 bg-green-600 rounded flex items-center justify-center mr-2">
                      <span className="text-white font-bold text-xs">AMEX</span>
                    </div>
                    <span className="text-sm font-bold text-green-800">American Express</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentGateway;