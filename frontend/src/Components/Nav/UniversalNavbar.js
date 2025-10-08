import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../Context/AuthContext';
import { useCart } from '../../Context/CartContext';

const UniversalNavbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { totalItems } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const handleLogout = () => {
    // Determine redirect path based on user role
    let redirectPath = '/login'; // Default redirect
    
    if (user?.role === 'Customer') {
      redirectPath = '/'; // Redirect customers to initial home page
    }
    
    logout(redirectPath);
    navigate(redirectPath);
  };

  // Check if current page is customer-facing
  const isCustomerPage = () => {
    const customerPages = ['/', '/home', '/products', '/product', '/cart', '/checkout', '/payment', '/services', '/branches', '/about', '/contact'];
    return customerPages.some(page => location.pathname.startsWith(page));
  };

  // Check if current page is admin/dashboard
  const isDashboardPage = () => {
    const dashboardPages = ['/admin', '/factory-manager', '/branch-manager', '/driver', '/customer-dashboard', '/fire-brigade-dashboard'];
    return dashboardPages.some(page => location.pathname.startsWith(page));
  };

  // Get navigation items based on user role and current page
  const getNavigationItems = () => {
    if (!isAuthenticated()) {
      // Public navigation
      return [
        { name: 'Home', path: '/', icon: '🏠' },
        { name: 'Products', path: '/products', icon: '🛍️' },
        { name: 'Services', path: '/services', icon: '🔧' },
        { name: 'Branches', path: '/branches', icon: '📍' },
        { name: 'About', path: '/about', icon: 'ℹ️' }
      ];
    }

    // Role-based navigation
    switch (user?.role) {
      case 'Customer':
        return [
          { name: 'Home', path: '/home', icon: '🏠' },
          { name: 'Products', path: '/products', icon: '🛍️' },
          { name: 'My Account', path: '/my-account', icon: '👤' },
          { name: 'Services', path: '/services', icon: '🔧' },
          { name: 'Branches', path: '/branches', icon: '📍' }
        ];

      case 'Admin':
        return [
          { name: 'Dashboard', path: '/admin-dashboard', icon: '📊' },
          { name: 'Users', path: '/admin/users', icon: '👥' },
          { name: 'Employees', path: '/admin/employees', icon: '👨‍💼' },
          { name: 'Branches', path: '/admin/branches', icon: '🏢' },
          { name: 'Emergency', path: '/admin/emergency', icon: '🚨' },
          { name: 'Reports', path: '/admin/reports', icon: '📈' }
        ];

      case 'Factory Manager':
        return [
          { name: 'Dashboard', path: '/factory-manager', icon: '🏭' },
          { name: 'Orders', path: '/factory-orders', icon: '📋' },
          { name: 'Inventory', path: '/factory-inventory', icon: '📦' },
          { name: 'Recycling', path: '/factory-recycling', icon: '♻️' },
          { name: 'Reports', path: '/factory-reports', icon: '📊' },
          { name: 'Settings', path: '/factory-settings', icon: '⚙️' }
        ];

      case 'Branch Manager':
        return [
          { name: 'Dashboard', path: '/branch-manager', icon: '🏢' },
          { name: 'Orders', path: '/branch-manager/orders', icon: '📋' },
          { name: 'Products', path: '/branch-manager/products', icon: '🛍️' },
          { name: 'Recycle Bin', path: '/branch-manager/recycle-bin', icon: '♻️' },
          { name: 'Drivers', path: '/branch-manager/drivers', icon: '🚚' }
        ];

      case 'Driver':
        return [
          { name: 'Dashboard', path: '/driver-dashboard', icon: '🚚' },
          { name: 'Deliveries', path: '/driver/deliveries', icon: '📦' },
          { name: 'Routes', path: '/driver/routes', icon: '🗺️' },
          { name: 'Profile', path: '/driver/profile', icon: '👤' },
          { name: 'Logs', path: '/driver/logs', icon: '📝' }
        ];

      case 'Fire Brigade':
        return [
          { name: 'Dashboard', path: '/fire-brigade-dashboard', icon: '🚨' },
          { name: 'Emergency', path: '/fire-brigade/emergency', icon: '🚒' },
          { name: 'Water Level', path: '/fire-brigade/water-level', icon: '💧' },
          { name: 'Branches', path: '/fire-brigade/branches', icon: '📍' }
        ];

      default:
        return [
          { name: 'Home', path: '/home', icon: '🏠' },
          { name: 'Products', path: '/products', icon: '🛍️' },
          { name: 'Services', path: '/services', icon: '🔧' }
        ];
    }
  };

  const navigationItems = getNavigationItems();

  return (
    <header className="bg-gradient-to-r from-teal-600 to-coral-600 shadow-lg border-b border-teal-700/20 fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <img 
                src="/logo.png" 
                alt="Aqualink Logo" 
                className="w-10 h-10 mr-3"
              />
              <span className="text-2xl font-bold bg-gradient-to-r from-white to-teal-100 bg-clip-text text-transparent">
                AquaLink
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-1">
            {navigationItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 flex items-center space-x-1 ${
                  location.pathname === item.path || location.pathname.startsWith(item.path + '/')
                    ? 'bg-white/20 text-white'
                    : 'text-white hover:text-teal-100 hover:bg-white/10'
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.name}</span>
              </Link>
            ))}
          </nav>

          {/* Right side items */}
          <div className="flex items-center space-x-4">
            {/* Cart Icon (only for customer pages) */}
            {isCustomerPage() && (
              <Link to="/cart" className="relative p-2 text-white hover:text-teal-100 hover:bg-white/10 rounded-md transition-colors duration-300">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
                </svg>
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-coral-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                    {totalItems}
                  </span>
                )}
              </Link>
            )}

            {/* User Menu */}
            {isAuthenticated() ? (
              <div className="relative">
                <button
                  onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                  className="flex items-center text-white hover:text-teal-100 focus:outline-none p-2 rounded-md hover:bg-white/10 transition-colors duration-200"
                >
                  {user?.profilePicture ? (
                    <div className="w-8 h-8 rounded-full overflow-hidden mr-2 border-2 border-white/20">
                      <img
                        src={user.profilePicture}
                        alt="Profile"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                      {/* Fallback avatar */}
                      <div className="w-full h-full bg-gradient-to-br from-teal-100 to-coral-100 flex items-center justify-center" style={{display: 'none'}}>
                        <span className="text-teal-600 font-semibold text-sm">
                          {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="w-8 h-8 bg-gradient-to-br from-teal-100 to-coral-100 rounded-full flex items-center justify-center mr-2">
                      <span className="text-teal-600 font-semibold text-sm">
                        {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                      </span>
                    </div>
                  )}
                  <span className="text-sm font-medium hidden sm:block">{user?.name}</span>
                  <svg className="ml-1 w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>

                {/* Profile Dropdown */}
                {profileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-teal-200">
                    <div className="px-4 py-2 text-sm text-gray-500 border-b border-gray-100">
                      <div className="font-medium">{user?.name}</div>
                      <div className="text-xs">{user?.email}</div>
                      <div className="text-xs text-teal-600">{user?.role}</div>
                    </div>
                    <Link
                      to="/my-account"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-teal-50"
                      onClick={() => setProfileMenuOpen(false)}
                    >
                      Profile
                    </Link>
                    <button
                      onClick={() => {
                        handleLogout();
                        setProfileMenuOpen(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-teal-50"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                >
                  Login
                </Link>
                <Link
                  to="/register/customer"
                  className="bg-gradient-to-r from-teal-500 to-coral-500 text-white px-4 py-2 rounded-md text-sm font-medium hover:shadow-lg transition-all duration-200"
                >
                  Sign Up
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-white hover:text-teal-100 hover:bg-white/10 focus:outline-none"
              >
                <svg className={`${menuOpen ? 'hidden' : 'block'} h-6 w-6`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                <svg className={`${menuOpen ? 'block' : 'hidden'} h-6 w-6`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className={`${menuOpen ? 'block' : 'hidden'} md:hidden bg-gradient-to-r from-teal-600 to-coral-600 border-t border-teal-700/20`}>
        <div className="px-2 pt-2 pb-3 space-y-1">
          {navigationItems.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              className={`block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 ${
                location.pathname === item.path || location.pathname.startsWith(item.path + '/')
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
              }`}
              onClick={() => setMenuOpen(false)}
            >
              <span className="flex items-center space-x-2">
                <span>{item.icon}</span>
                <span>{item.name}</span>
              </span>
            </Link>
          ))}
          
          {/* Mobile Cart (only for customer pages) */}
          {isCustomerPage() && (
            <Link
              to="/cart"
              className="block px-3 py-2 rounded-md text-base font-medium text-white hover:text-teal-100 hover:bg-white/10"
              onClick={() => setMenuOpen(false)}
            >
              <span className="flex items-center space-x-2">
                <span>🛒</span>
                <span>Cart ({totalItems})</span>
              </span>
            </Link>
          )}

          {/* Mobile Logout */}
          {isAuthenticated() && (
            <div className="border-t border-gray-200 pt-2">
              <button
                onClick={() => {
                  handleLogout();
                  setMenuOpen(false);
                }}
                className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-white hover:text-teal-100 hover:bg-white/10"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default UniversalNavbar;
