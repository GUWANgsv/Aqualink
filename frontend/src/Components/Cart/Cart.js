import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../Context/CartContext';
import { useAuth } from '../../Context/AuthContext';
import UniversalNavbar from '../Nav/UniversalNavbar';

const Cart = () => {
  const { items, totalItems, totalPrice, updateQuantity, removeFromCart, clearCart } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleQuantityChange = (itemId, newQuantity) => {
    if (newQuantity < 1) {
      removeFromCart(itemId);
    } else {
      updateQuantity(itemId, newQuantity);
    }
  };

  const handleCheckout = () => {
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }

    if (items.length === 0) {
      alert('Your cart is empty!');
      return;
    }

    // Navigate to checkout page
    navigate('/checkout');
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <UniversalNavbar />
        <div className="pt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="text-center">
              <div className="text-6xl mb-6">🛒</div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">Your cart is empty</h1>
              <p className="text-gray-600 mb-8">Looks like you haven't added any items to your cart yet.</p>
              <Link
                to="/products"
                className="inline-block bg-blue-500 text-white px-8 py-3 rounded-lg hover:bg-blue-600 transition-colors duration-300 font-medium"
              >
                Start Shopping
              </Link>
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Cart Items */}
            <div className="flex-1">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <h1 className="text-2xl font-bold text-gray-900">Shopping Cart</h1>
                  <button
                    onClick={clearCart}
                    className="text-red-500 hover:text-red-700 text-sm font-medium"
                  >
                    Clear Cart
                  </button>
                </div>

                <div className="space-y-4">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
                      <div className="flex-shrink-0">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center">
                          <span className="text-2xl">
                            {item.category === 'water-bottles' ? '🥤' : item.category === 'filters' ? '💧' : '🔧'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 truncate">{item.name}</h3>
                        <p className="text-sm text-gray-600 capitalize">{item.category.replace('-', ' ')}</p>
                        <p className="text-lg font-bold text-gray-900">LKR {item.price.toLocaleString()}</p>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                          className="w-8 h-8 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors duration-200"
                        >
                          -
                        </button>
                        <span className="w-12 text-center font-medium">{item.quantity}</span>
                        <button
                          onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                          className="w-8 h-8 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors duration-200"
                        >
                          +
                        </button>
                      </div>
                      
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-900">LKR {(item.price * item.quantity).toLocaleString()}</p>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-red-500 hover:text-red-700 text-sm font-medium"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:w-80 flex-shrink-0">
              <div className="bg-white rounded-lg shadow-sm p-6 sticky top-24">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>
                
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal ({totalItems} items)</span>
                    <span className="font-medium">LKR {totalPrice.toLocaleString()}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Shipping</span>
                    <span className="text-green-600 font-medium">Free</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tax (15%)</span>
                    <span className="font-medium">LKR {(totalPrice * 0.15).toLocaleString()}</span>
                  </div>
                  
                  <div className="border-t border-gray-200 pt-3">
                    <div className="flex justify-between text-lg font-semibold text-gray-900">
                      <span>Total</span>
                      <span>LKR {(totalPrice * 1.15).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={handleCheckout}
                  className="w-full py-3 px-4 rounded-lg transition-colors duration-300 font-medium bg-blue-500 text-white hover:bg-blue-600"
                >
                  {isAuthenticated() 
                    ? 'Proceed to Checkout' 
                    : 'Login to Checkout'
                  }
                </button>
                
                <div className="mt-4 text-center">
                  <Link
                    to="/products"
                    className="text-blue-500 hover:text-blue-700 text-sm font-medium"
                  >
                    Continue Shopping
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
