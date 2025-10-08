import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../Context/AuthContext';
import { useCart } from '../../Context/CartContext';
import UniversalNavbar from '../Nav/UniversalNavbar';
import axios from 'axios';

const ProductDetails = () => {
  const { id } = useParams();
  const { isAuthenticated } = useAuth();
  const { addToCart, totalItems } = useCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [showNotification, setShowNotification] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        setLoading(true);
        
        // First, get all products to find the one with matching ID
        const response = await axios.get('http://localhost:5000/CustomerPurchases/products/all');
        
        if (response.data.success) {
          const products = response.data.products;
          
          // Find product by ID (which is now the MongoDB _id)
          const foundProduct = products.find(p => p._id === id);
          
          if (foundProduct) {
            // Transform the product data to match the expected format
            const transformedProduct = {
              id: foundProduct._id,
              name: foundProduct.name,
              category: foundProduct.category,
              price: foundProduct.price,
              originalPrice: foundProduct.originalPrice || foundProduct.price * 1.2,
              image: foundProduct.image,
              images: foundProduct.images && foundProduct.images.length > 0 ? foundProduct.images : (foundProduct.image ? [foundProduct.image] : null),
              description: foundProduct.description,
              longDescription: foundProduct.longDescription || foundProduct.description,
              stock: foundProduct.quantity,
              warranty: foundProduct.warranty,
              rating: foundProduct.rating,
              reviews: foundProduct.reviews,
              specifications: foundProduct.specifications || {},
              features: foundProduct.features || []
            };
            
            setProduct(transformedProduct);
            setImageError(false); // Reset image error state for new product
          }
        }
      } catch (error) {
        console.error('Error fetching product details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProductDetails();
  }, [id]);

  const handleAddToCart = () => {
    if (!product) {
      alert('Product not available');
      return;
    }
    
    // Add to cart with the selected quantity
    addToCart(product, quantity);
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);
  };

  const handleQuantityChange = (newQuantity) => {
    if (newQuantity >= 1 && newQuantity <= product.stock) {
      setQuantity(newQuantity);
    }
  };

  const getCategoryEmoji = (category) => {
    switch (category) {
      case 'water-bottles': return '🥤';
      case 'filters': return '💧';
      case 'spare-parts': return '🔧';
      default: return '📦';
    }
  };

  const getCurrentImage = () => {
    // Use the same logic as Products.js: prioritize product.image
    if (product.image) {
      return product.image;
    }
    // Fallback to first image in images array if no main image
    if (product.images && product.images.length > 0) {
      return product.images[0];
    }
    return null;
  };

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span key={i} className={i <= rating ? 'text-yellow-400' : 'text-gray-300'}>
          ★
        </span>
      );
    }
    return stars;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-teal-200 border-t-teal-600 mx-auto"></div>
            <div className="absolute inset-0 rounded-full h-16 w-16 border-4 border-transparent border-t-teal-400 animate-spin" style={{animationDirection: 'reverse', animationDuration: '1.5s'}}></div>
          </div>
          <p className="mt-6 text-slate-600 font-medium">Loading product details...</p>
          <div className="mt-2 w-32 h-1 bg-teal-200 rounded-full mx-auto overflow-hidden">
            <div className="h-full bg-gradient-to-r from-teal-500 to-coral-500 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Product not found</h3>
          <p className="text-gray-600 mb-4">The product you're looking for doesn't exist.</p>
          <Link to="/products" className="bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium text-sm shadow-sm hover:shadow-md">
            Back to Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50 to-slate-100">
      {/* Universal Navbar */}
      <UniversalNavbar />
      
      {/* Main Content with top padding for fixed navbar */}
      <div className="pt-16">
        {/* Notification */}
      {showNotification && (
        <div className="fixed top-20 right-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-3 rounded-xl shadow-2xl z-50 transform transition-all duration-300 animate-bounce">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="font-semibold">Added to Cart!</p>
              <p className="text-xs text-green-100">{product.name} (Qty: {quantity})</p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm shadow-lg border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <nav className="flex items-center space-x-2 text-sm text-gray-600">
              <Link to="/" className="hover:text-teal-600 transition-colors duration-300 font-medium">🏠 Home</Link>
              <span className="text-gray-400">/</span>
              <Link to="/products" className="hover:text-teal-600 transition-colors duration-300 font-medium">🛍️ Products</Link>
              <span className="text-gray-400">/</span>
              <span className="text-gray-900 font-semibold">{product.name}</span>
            </nav>
            <Link
              to="/products"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium text-sm shadow-sm hover:shadow-md flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Back to Products</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Images */}
          <div>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
              <div className="relative group">
                <div className="h-96 bg-gradient-to-br from-teal-50 via-white to-coral-50 rounded-2xl flex items-center justify-center mb-6 overflow-hidden p-8 relative">
                  {getCurrentImage() ? (
                    <img 
                      src={getCurrentImage()} 
                      alt={product.name}
                      className="w-full h-full object-contain rounded-lg transition-transform duration-500 group-hover:scale-105"
          onError={(e) => {
            setImageError(true);
            e.target.style.display = 'none';
          }}
                      onLoad={() => setImageError(false)}
                    />
                  ) : null}
                  
                  {/* Fallback emoji when no image or image fails to load */}
                  {(!getCurrentImage() || imageError) && (
                    <span className="text-8xl transition-transform duration-500 group-hover:scale-110">
                      {getCategoryEmoji(product.category)}
                    </span>
                  )}
                  
                  {/* Gradient overlay on hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"></div>
                </div>
                
                {/* Stock Status */}
                {product.stock < 10 && product.stock > 0 && (
                  <div className="absolute top-4 right-4 bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
                    ⚠️ Low Stock - Only {product.stock} left
                  </div>
                )}
                {product.stock === 0 && (
                  <div className="absolute top-4 right-4 bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
                    ❌ Out of Stock
                  </div>
                )}
                {product.stock >= 10 && (
                  <div className="absolute top-4 right-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
                    ✅ In Stock
                  </div>
                )}
                
                {/* Premium badge for high-rated products */}
                {product.rating >= 4.5 && (
                  <div className="absolute top-4 left-4 bg-gradient-to-r from-yellow-400 to-yellow-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
                    ⭐ Premium Quality
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* Product Info */}
          <div>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
              
              {/* Rating */}
              <div className="flex items-center mb-4">
                <div className="flex items-center mr-2">
                  {renderStars(product.rating)}
                </div>
                <span className="text-sm text-gray-500">({product.reviews} reviews)</span>
              </div>

              {/* Price */}
              <div className="mb-6">
                <div className="flex items-center">
                  <span className="text-3xl font-bold text-gray-900">LKR {product.price.toLocaleString()}</span>
                  {product.originalPrice > product.price && (
                    <span className="text-lg text-gray-500 line-through ml-3">LKR {product.originalPrice.toLocaleString()}</span>
                  )}
                  {product.originalPrice > product.price && (
                    <span className="bg-red-100 text-red-800 text-sm font-medium px-2 py-1 rounded ml-3">
                      {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
                    </span>
                  )}
                </div>
                {product.originalPrice > product.price && (
                  <div className="mt-2 text-sm text-green-600 font-semibold">
                    You save LKR {(product.originalPrice - product.price).toLocaleString()}
                  </div>
                )}
              </div>

              {/* Stock Status */}
              <div className="mb-6">
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-700 mr-2">Availability:</span>
                  {product.stock > 0 ? (
                    <span className="text-green-600 font-medium">
                      {product.stock} units in stock
                    </span>
                  ) : (
                    <span className="text-red-600 font-medium">Out of stock</span>
                  )}
                </div>
              </div>

              {/* Warranty */}
              {product.warranty !== 'N/A' && (
                <div className="mb-6">
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-gray-700 mr-2">Warranty:</span>
                    <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                      {product.warranty} Warranty
                    </span>
                  </div>
                </div>
              )}

              {/* Description */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
                <p className="text-gray-600 leading-relaxed">{product.description}</p>
              </div>

              {/* Quantity Selector */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleQuantityChange(quantity - 1)}
                    disabled={quantity <= 1}
                    className="w-8 h-8 border border-gray-300 rounded-md flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    max={product.stock}
                    value={quantity}
                    onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
                    className="w-14 h-8 border border-gray-300 rounded-md text-center text-sm"
                  />
                  <button
                    onClick={() => handleQuantityChange(quantity + 1)}
                    disabled={quantity >= product.stock}
                    className="w-8 h-8 border border-gray-300 rounded-md flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Add to Cart Button */}
              <div className="mb-6">
                {product.stock > 0 ? (
                  <button
                    onClick={handleAddToCart}
                    className="w-full bg-teal-600 text-white py-3 px-6 rounded-lg hover:bg-teal-700 transition-colors duration-200 font-medium text-base shadow-sm hover:shadow-md"
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
                      </svg>
                      <span>Add to Cart - LKR {(product.price * quantity).toLocaleString()}</span>
                    </div>
                  </button>
                ) : (
                  <button
                    disabled
                    className="w-full bg-gray-300 text-gray-500 py-3 px-6 rounded-lg cursor-not-allowed font-medium text-base"
                  >
                    Out of Stock
                  </button>
                )}
              </div>

              {/* Features */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Key Features</h3>
                <ul className="space-y-2">
                  {product.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-green-500 mr-2">✓</span>
                      <span className="text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Information */}
        <div className="mt-12">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 flex items-center">
              <span className="mr-3">📋</span>
              Product Details
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Specifications */}
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                  <span className="mr-2">⚙️</span>
                  Specifications
                </h3>
                <div className="space-y-4">
                  {Object.entries(product.specifications).map(([key, value]) => (
                    <div key={key} className="flex justify-between py-3 px-4 bg-gradient-to-r from-teal-50 to-coral-50 rounded-xl border border-teal-100">
                      <span className="font-semibold text-gray-800">{key}</span>
                      <span className="text-gray-700 font-medium">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Long Description */}
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                  <span className="mr-2">📝</span>
                  Detailed Description
                </h3>
                <div className="text-gray-700 leading-relaxed whitespace-pre-line bg-gradient-to-br from-slate-50 to-teal-50 p-6 rounded-xl border border-slate-200">
                  {product.longDescription}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Floating Cart Button */}
      {totalItems > 0 && (
        <div className="fixed bottom-6 right-6 z-50">
          <Link
            to="/cart"
            className="group bg-gradient-to-r from-teal-500 to-coral-500 text-white p-4 rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-110 animate-bounce"
          >
            <div className="flex items-center space-x-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
              </svg>
              <span className="font-bold">{totalItems}</span>
            </div>
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
              {totalItems}
            </div>
          </Link>
        </div>
      )}
      </div>
    </div>
  );
};

export default ProductDetails;
