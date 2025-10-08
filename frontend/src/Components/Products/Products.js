import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../Context/AuthContext';
import { useCart } from '../../Context/CartContext';
import UniversalNavbar from '../Nav/UniversalNavbar';
import axios from 'axios';

// Custom styles for enhanced Tailwind components
const customStyles = `
  .slider::-webkit-slider-thumb {
    appearance: none;
    height: 20px;
    width: 20px;
    border-radius: 50%;
    background: linear-gradient(135deg, #14b8a6, #0d9488);
    cursor: pointer;
    box-shadow: 0 4px 8px rgba(20, 184, 166, 0.3);
    transition: all 0.3s ease;
  }
  
  .slider::-webkit-slider-thumb:hover {
    transform: scale(1.1);
    box-shadow: 0 6px 12px rgba(20, 184, 166, 0.4);
  }
  
  .slider::-moz-range-thumb {
    height: 20px;
    width: 20px;
    border-radius: 50%;
    background: linear-gradient(135deg, #14b8a6, #0d9488);
    cursor: pointer;
    border: none;
    box-shadow: 0 4px 8px rgba(20, 184, 166, 0.3);
  }
  
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  
  .animate-fade-in {
    animation: fadeIn 0.6s ease-in-out;
  }
  
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  .animate-slide-up {
    animation: slideUp 0.8s ease-out;
  }
  
  @keyframes slideUp {
    from { opacity: 0; transform: translateY(30px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

const Products = () => {
  const { category } = useParams();
  const { isAuthenticated, user } = useAuth();
  const { addToCart, totalItems } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Initialize search query from URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const searchParam = urlParams.get('search');
    if (searchParam) {
      setSearchQuery(searchParam);
    }
  }, [location.search]);
  const [selectedCategory, setSelectedCategory] = useState(category || 'all');
  const [priceRange, setPriceRange] = useState([0, 10000]);
  const [sortBy, setSortBy] = useState('name');
  const [showCartNotification, setShowCartNotification] = useState(false);


  // Fetch products from backend
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await axios.get('http://localhost:5000/CustomerPurchases/products/all');
        
        if (response.data.success) {
          const inventoryItems = response.data.products;
          
          if (inventoryItems.length === 0) {
            setError('No products available in the system. Please contact the administrator to add products to the branch inventory.');
            return;
          }
          
          // Transform inventory items to product format using database data
          const transformedProducts = inventoryItems.map((item, index) => ({
            id: item._id,
            name: item.name,
            category: item.category,
            price: item.price,
            originalPrice: item.originalPrice || item.price * 1.2, // Use database originalPrice or calculate 20% markup
            image: item.image || null,
            images: item.images && item.images.length > 0 ? item.images : (item.image ? [item.image] : null),
            description: item.description,
            longDescription: item.longDescription,
            stock: item.quantity,
            warranty: item.warranty,
            rating: item.rating,
            reviews: item.reviews,
            status: item.status,
            unit: item.unit,
            specifications: item.specifications,
            features: item.features
          }));
          
          setProducts(transformedProducts);
        } else {
          setError('Failed to fetch products from server');
        }
      } catch (error) {
        console.error('Error fetching products:', error);
        if (error.code === 'ECONNREFUSED' || error.message.includes('Network Error')) {
          setError('Backend server is not running. Please start the backend server and ensure MongoDB is running.');
        } else {
          setError('Unable to connect to server. Please check if the backend is running.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [products, searchQuery, selectedCategory, priceRange, sortBy]);

  const filterProducts = () => {
    let filtered = products;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by price range
    filtered = filtered.filter(product =>
      product.price >= priceRange[0] && product.price <= priceRange[1]
    );

    // Sort products
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        case 'rating':
          return b.rating - a.rating;
        case 'name':
        default:
          return a.name.localeCompare(b.name);
      }
    });

    setFilteredProducts(filtered);
  };

  const handleAddToCart = (product) => {
    addToCart(product, 1);
    setShowCartNotification(true);
    setTimeout(() => setShowCartNotification(false), 2000);
  };

  const categories = [
    { id: 'all', name: 'All Products', icon: '🛍️' },
    { id: 'filters', name: 'Filters', icon: '💧' },
    { id: 'spare-parts', name: 'Spare Parts', icon: '🔧' },
    { id: 'water-bottles', name: 'Water Bottles', icon: '🥤' }
  ];

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
          <p className="mt-6 text-slate-600 font-medium">Loading amazing products...</p>
          <div className="mt-2 w-32 h-1 bg-teal-200 rounded-full mx-auto overflow-hidden">
            <div className="h-full bg-gradient-to-r from-teal-500 to-coral-500 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50 to-slate-100">
      {/* Custom styles for modern components */}
      <style dangerouslySetInnerHTML={{ __html: customStyles }} />
      
      {/* Universal Navbar */}
      <UniversalNavbar />

      {/* Main Content with top padding for fixed navbar */}
      <div className="pt-16">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-teal-600 via-teal-500 to-coral-500 shadow-2xl overflow-hidden">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-teal-600/90 to-coral-500/90"></div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
                  Premium Products
                </h1>
                <p className="text-teal-100 text-lg font-medium">
                  Discover our curated collection of water solutions
                </p>
                <div className="flex items-center space-x-4 mt-4">
                  <div className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
                    <span className="text-white font-semibold">{filteredProducts.length}</span>
                    <span className="text-teal-100 text-sm">Products Available</span>
                  </div>
                  <div className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
                    <span className="text-white font-semibold">⭐</span>
                    <span className="text-teal-100 text-sm">Premium Quality</span>
                  </div>
                </div>
              </div>
              <div className="hidden lg:block">
                <div className="w-32 h-32 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center">
                  <span className="text-6xl">💧</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Cart Notification */}
        {showCartNotification && (
          <div className="fixed top-20 right-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-3 rounded-xl shadow-2xl z-50 transform transition-all duration-300 animate-bounce">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="font-semibold">Added to Cart!</p>
                <p className="text-xs text-green-100">Item successfully added</p>
              </div>
            </div>
          </div>
        )}

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Filters Sidebar */}
            <div className="lg:w-64 flex-shrink-0">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 sticky top-24">
                <div className="flex items-center space-x-2 mb-6">
                  <div className="w-8 h-8 bg-gradient-to-r from-teal-500 to-coral-500 rounded-lg flex items-center justify-center">
                    <span className="text-white text-sm">🔍</span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-800">Smart Filters</h3>
                </div>
                
                {/* Search */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-slate-700 mb-3">🔍 Search Products</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Find your perfect product..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full px-4 py-3 pl-10 border-2 border-teal-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-300 bg-white/50 backdrop-blur-sm"
                    />
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                      <svg className="w-5 h-5 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Categories */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-slate-700 mb-3">📂 Categories</label>
                  <div className="space-y-3">
                    {categories.map((cat) => (
                      <label key={cat.id} className="flex items-center p-3 rounded-xl hover:bg-teal-50 transition-all duration-300 cursor-pointer group">
                        <input
                          type="radio"
                          name="category"
                          value={cat.id}
                          checked={selectedCategory === cat.id}
                          onChange={(e) => setSelectedCategory(e.target.value)}
                          className="mr-3 text-teal-500 focus:ring-teal-500 w-4 h-4"
                        />
                        <span className="text-sm font-medium text-slate-700 group-hover:text-teal-700 transition-colors duration-300">
                          {cat.icon} {cat.name}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Price Range */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-slate-700 mb-3">💰 Price Range (LKR)</label>
                  <div className="space-y-4">
                    <div className="relative">
                      <input
                        type="range"
                        min="0"
                        max="10000"
                        value={priceRange[1]}
                        onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                        className="w-full h-2 bg-teal-200 rounded-lg appearance-none cursor-pointer slider"
                        style={{
                          background: `linear-gradient(to right, #14b8a6 0%, #14b8a6 ${(priceRange[1] / 10000) * 100}%, #e2e8f0 ${(priceRange[1] / 10000) * 100}%, #e2e8f0 100%)`
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-sm font-medium text-slate-600 bg-teal-50 rounded-lg p-3">
                      <span>LKR {priceRange[0].toLocaleString()}</span>
                      <span className="text-teal-600">LKR {priceRange[1].toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Sort By */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-slate-700 mb-3">🔄 Sort By</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-teal-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-300 bg-white/50 backdrop-blur-sm font-medium"
                  >
                    <option value="name">📝 Name (A-Z)</option>
                    <option value="price-low">💰 Price: Low to High</option>
                    <option value="price-high">💎 Price: High to Low</option>
                    <option value="rating">⭐ Rating</option>
                  </select>
                </div>

                {/* Clear Filters */}
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                    setPriceRange([0, 10000]);
                    setSortBy('name');
                  }}
                  className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors duration-200 font-medium text-sm shadow-sm hover:shadow-md"
                >
                  Clear All Filters
                </button>
              </div>
            </div>

            {/* Products Grid */}
            <div className="flex-1">
              {error ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">⚠️</div>
                  <h3 className="text-xl font-semibold text-red-600 mb-2">Error Loading Products</h3>
                  <p className="text-gray-600 mb-4">{error}</p>
                  <button
                    onClick={() => window.location.reload()}
                    className="bg-teal-600 text-white px-5 py-2.5 rounded-lg hover:bg-teal-700 transition-colors duration-200 font-medium text-sm shadow-sm hover:shadow-md"
                  >
                    Retry
                  </button>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-16">
                  <div className="relative">
                    <div className="w-32 h-32 bg-gradient-to-br from-teal-100 to-coral-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                      <span className="text-6xl">🔍</span>
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-teal-500 to-coral-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm">!</span>
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">No products found</h3>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">We couldn't find any products matching your criteria. Try adjusting your filters or search terms.</p>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory('all');
                      setPriceRange([0, 10000]);
                      setSortBy('name');
                    }}
                    className="bg-teal-600 text-white px-5 py-2.5 rounded-lg hover:bg-teal-700 transition-colors duration-200 font-medium text-sm shadow-sm hover:shadow-md"
                  >
                    Reset Filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {filteredProducts.map((product, index) => (
                    <div 
                      key={product.id} 
                      className="group bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden border border-white/20 transform hover:-translate-y-2 animate-fade-in"
                      style={{ 
                        animationDelay: `${index * 100}ms`,
                        animationFillMode: 'both'
                      }}
                    >
                      <div className="relative overflow-hidden">
                        <div className="h-56 bg-gradient-to-br from-teal-50 via-white to-coral-50 flex items-center justify-center overflow-hidden p-6 relative">
                          {product.image ? (
                            <img 
                              src={product.image} 
                              alt={product.name}
                              className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-110"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'block';
                              }}
                            />
                          ) : null}
                          <span 
                            className="text-7xl transition-transform duration-500 group-hover:scale-110"
                            style={{ display: product.image ? 'none' : 'block' }}
                          >
                            {product.category === 'water-bottles' ? '🥤' : product.category === 'filters' ? '💧' : '🔧'}
                          </span>
                          
                          {/* Gradient overlay on hover */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        </div>
                        
                        {/* Status badges */}
                        {product.status === 'Low Stock' && (
                          <div className="absolute top-3 right-3 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs px-3 py-1.5 rounded-full font-semibold shadow-lg">
                            ⚠️ Low Stock
                          </div>
                        )}
                        {product.status === 'Out of Stock' && (
                          <div className="absolute top-3 right-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white text-xs px-3 py-1.5 rounded-full font-semibold shadow-lg">
                            ❌ Out of Stock
                          </div>
                        )}
                        
                        {/* Premium badge for high-rated products */}
                        {product.rating >= 4.5 && (
                          <div className="absolute top-3 left-3 bg-gradient-to-r from-yellow-400 to-yellow-500 text-white text-xs px-3 py-1.5 rounded-full font-semibold shadow-lg">
                            ⭐ Premium
                          </div>
                        )}
                      </div>
                      
                      <div className="p-6">
                        <div className="mb-4">
                          <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-teal-600 transition-colors duration-300">
                            {product.name}
                          </h3>
                          <p className="text-gray-600 text-sm leading-relaxed line-clamp-2">
                            {product.description}
                          </p>
                        </div>
                        
                        <div className="flex items-center mb-4">
                          <div className="flex items-center mr-3">
                            {renderStars(product.rating)}
                          </div>
                          <span className="text-sm text-gray-500 font-medium">({product.reviews} reviews)</span>
                        </div>
                        
                        <div className="flex items-center justify-between mb-4">
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <span className="text-2xl font-bold text-gray-900">LKR {product.price.toLocaleString()}</span>
                              {product.originalPrice > product.price && (
                                <span className="text-sm text-gray-500 line-through">LKR {product.originalPrice.toLocaleString()}</span>
                              )}
                            </div>
                            {product.originalPrice > product.price && (
                              <div className="text-xs text-green-600 font-semibold">
                                Save LKR {(product.originalPrice - product.price).toLocaleString()}
                              </div>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-gray-500">Stock</div>
                            <div className="text-sm font-semibold text-teal-600">{product.stock} units</div>
                          </div>
                        </div>
                        
                        {product.warranty !== 'N/A' && (
                          <div className="mb-4">
                            <span className="inline-flex items-center text-xs bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 px-3 py-1.5 rounded-full font-semibold">
                              🛡️ {product.warranty} Warranty
                            </span>
                          </div>
                        )}
                        
                        <div className="flex space-x-2">
                          <Link
                            to={`/product/${product.id}`}
                            className="flex-1 bg-blue-600 text-white py-2.5 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-200 text-center text-sm font-medium shadow-sm hover:shadow-md"
                          >
                            <div className="flex items-center justify-center space-x-1.5">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              <span>View Details</span>
                            </div>
                          </Link>
                          {product.status !== 'Out of Stock' && (
                            <button 
                              onClick={() => handleAddToCart(product)}
                              className="bg-teal-600 text-white py-2.5 px-4 rounded-lg hover:bg-teal-700 transition-colors duration-200 text-sm font-medium shadow-sm hover:shadow-md"
                            >
                              <div className="flex items-center justify-center space-x-1.5">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
                                </svg>
                                <span>Add to Cart</span>
                              </div>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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

export default Products;
