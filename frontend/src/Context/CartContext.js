import React, { createContext, useContext, useReducer, useEffect } from 'react';
import axios from 'axios';

const CartContext = createContext();

// Cart reducer
const cartReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_ITEM':
      const existingItem = state.items.find(item => item.id === action.payload.id);
      if (existingItem) {
        return {
          ...state,
          items: state.items.map(item =>
            item.id === action.payload.id
              ? { ...item, quantity: item.quantity + action.payload.quantity }
              : item
          )
        };
      } else {
        return {
          ...state,
          items: [...state.items, { ...action.payload, quantity: action.payload.quantity }]
        };
      }

    case 'REMOVE_ITEM':
      return {
        ...state,
        items: state.items.filter(item => item.id !== action.payload)
      };

    case 'UPDATE_QUANTITY':
      return {
        ...state,
        items: state.items.map(item =>
          item.id === action.payload.id
            ? { ...item, quantity: action.payload.quantity }
            : item
        )
      };

    case 'CLEAR_CART':
      return {
        ...state,
        items: []
      };

    default:
      return state;
  }
};

// Cart provider component
export const CartProvider = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, {
    items: []
  });

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      const parsedCart = JSON.parse(savedCart);
      parsedCart.items.forEach(item => {
        dispatch({ type: 'ADD_ITEM', payload: item });
      });
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(state));
  }, [state]);

  // Calculate total items in cart
  const getTotalItems = () => {
    return state.items.reduce((total, item) => total + item.quantity, 0);
  };

  // Calculate total price
  const getTotalPrice = () => {
    return state.items.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  // Add item to cart
  const addToCart = (product, quantity = 1) => {
    dispatch({
      type: 'ADD_ITEM',
      payload: {
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        category: product.category,
        quantity: quantity
      }
    });
  };

  // Remove item from cart
  const removeFromCart = (productId) => {
    dispatch({
      type: 'REMOVE_ITEM',
      payload: productId
    });
  };

  // Update item quantity
  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
    } else {
      dispatch({
        type: 'UPDATE_QUANTITY',
        payload: { id: productId, quantity }
      });
    }
  };

  // Clear cart
  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };

  // Checkout function - process all cart items
  const checkout = async (customerInfo = {}) => {
    if (state.items.length === 0) {
      throw new Error('Cart is empty');
    }

    try {
      // Prepare purchase data
      const purchaseData = {
        customerId: customerInfo.customerId || 'customer-' + Date.now(),
        customerName: customerInfo.customerName || 'Customer',
        customerEmail: customerInfo.customerEmail || 'customer@example.com',
        customerPhone: customerInfo.customerPhone || '+94 77 123 4567',
        items: state.items.map(item => ({
          itemName: item.name,
          quantity: item.quantity,
          unitPrice: item.price
        })),
        paymentMethod: customerInfo.paymentMethod || 'Cash',
        deliveryAddress: customerInfo.deliveryAddress || {
          street: 'Customer Address',
          city: 'Colombo',
          postalCode: '00100',
          country: 'Sri Lanka'
        },
        notes: `Cart checkout - ${state.items.length} items`
      };

      // Make API call to process purchase
      const response = await axios.post('http://localhost:5000/CustomerPurchases', purchaseData);
      
      if (response.data.success) {
        // Clear cart after successful purchase
        clearCart();
        return response.data;
      } else {
        throw new Error(response.data.message || 'Purchase failed');
      }
    } catch (error) {
      console.error('Checkout failed:', error);
      throw error;
    }
  };

  const value = {
    items: state.items,
    totalItems: getTotalItems(),
    totalPrice: getTotalPrice(),
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    checkout
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

// Custom hook to use cart context
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
