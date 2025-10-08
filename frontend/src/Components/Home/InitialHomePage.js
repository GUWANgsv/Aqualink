import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../Context/AuthContext';

const InitialHomePage = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSystemSwitch = () => {
    navigate('/emergency');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    // Navigate to products page with search query
    navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
  };

  const handleLogin = () => {
    navigate('/login');
  };

  const handleSignup = () => {
    navigate('/register/customer');
  };

  const navigationItems = [
    { name: 'Home', path: '/', icon: '🏠' },
    { name: 'Products', path: '/products', icon: '🛍️' },
    { name: 'Services', path: '/services', icon: '🔧' },
    { name: 'Branches', path: '/branches', icon: '📍' },
    { name: 'About', path: '/about', icon: 'ℹ️' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 relative">
      {/* Water Background Image */}
      <div className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-80" 
           style={{
             backgroundImage: `url("data:image/svg+xml,%3Csvg width='300' height='300' viewBox='0 0 300 300' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='waterWaves' x='0' y='0' width='300' height='300' patternUnits='userSpaceOnUse'%3E%3Cpath d='M0 150 Q75 120 150 150 T300 150 V300 H0 Z' fill='%2306B6D4' opacity='0.4'/%3E%3Cpath d='M0 180 Q75 150 150 180 T300 180 V300 H0 Z' fill='%2306B6D4' opacity='0.3'/%3E%3Cpath d='M0 210 Q75 180 150 210 T300 210 V300 H0 Z' fill='%2306B6D4' opacity='0.2'/%3E%3Cpath d='M0 120 Q75 90 150 120 T300 120 V300 H0 Z' fill='%2306B6D4' opacity='0.2'/%3E%3Ccircle cx='75' cy='75' r='4' fill='%2306B6D4' opacity='0.3'/%3E%3Ccircle cx='225' cy='105' r='3' fill='%2306B6D4' opacity='0.3'/%3E%3Ccircle cx='150' cy='45' r='3.5' fill='%2306B6D4' opacity='0.3'/%3E%3Ccircle cx='50' cy='200' r='2' fill='%2306B6D4' opacity='0.2'/%3E%3Ccircle cx='250' cy='180' r='2.5' fill='%2306B6D4' opacity='0.2'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='300' height='300' fill='url(%23waterWaves)'/%3E%3C/svg%3E")`
           }}>
      </div>
      {/* Header with Login Button */}
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
                  className="px-3 py-2 rounded-md text-sm font-medium text-white hover:text-teal-100 hover:bg-white/10 transition-colors duration-200 flex items-center space-x-1"
                >
                  <span>{item.icon}</span>
                  <span>{item.name}</span>
                </Link>
              ))}
            </nav>

            {/* Right side - Login Button */}
            <div className="flex items-center space-x-4">
              <button
                onClick={handleLogin}
                className="bg-white text-teal-600 px-6 py-2 rounded-lg font-semibold hover:bg-teal-50 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 border border-white/20"
              >
                Login
              </button>
              
              {/* Mobile menu button */}
              <div className="md:hidden">
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="inline-flex items-center justify-center p-2 rounded-md text-white hover:text-teal-100 hover:bg-white/10 focus:outline-none transition-colors duration-200"
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
                className="block px-3 py-2 rounded-md text-base font-medium text-white hover:text-teal-100 hover:bg-white/10 transition-colors duration-200"
                onClick={() => setMenuOpen(false)}
              >
                <span className="flex items-center space-x-2">
                  <span>{item.icon}</span>
                  <span>{item.name}</span>
                </span>
              </Link>
            ))}
            
            {/* Mobile Login/Signup */}
            <div className="border-t border-teal-700/20 pt-2 space-y-1">
              <button
                onClick={() => {
                  handleLogin();
                  setMenuOpen(false);
                }}
                className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-white hover:text-teal-100 hover:bg-white/10"
              >
                Login
              </button>
              <button
                onClick={() => {
                  handleSignup();
                  setMenuOpen(false);
                }}
                className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-white hover:text-teal-100 hover:bg-white/10"
              >
                Sign Up
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content with top padding for fixed navbar */}
      <div className="pt-16 relative z-10">
        {/* Hero Section */}
        <section className="relative py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Premium Water Solutions
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Discover the purest drinking water and advanced filtration systems for your home and business
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/products"
                className="bg-teal-600 text-white px-8 py-4 rounded-full font-semibold hover:bg-teal-700 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-lg"
              >
                Shop Now
              </Link>
              <Link
                to="/services"
                className="border-2 border-teal-600 text-teal-600 px-8 py-4 rounded-full font-semibold hover:bg-teal-600 hover:text-white transition-all duration-300 text-lg"
              >
                Our Services
              </Link>
            </div>
          </div>
        </section>



        {/* Product Slider */}
        <section className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Featured Products</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white shadow-lg rounded-2xl p-8 text-center hover:shadow-xl transition-all duration-300 border border-gray-100">
                <div className="text-6xl mb-4">💧</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">RO Filters</h3>
                <p className="text-gray-600 mb-6">
                  Advanced reverse osmosis systems for the purest water
                </p>
                <Link
                  to="/products/filters"
                  className="inline-block bg-teal-600 text-white px-6 py-3 rounded-full font-medium hover:bg-teal-700 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
                >
                  View Products
                </Link>
              </div>

              <div className="bg-white shadow-lg rounded-2xl p-8 text-center hover:shadow-xl transition-all duration-300 border border-gray-100">
                <div className="text-6xl mb-4">🔧</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Spare Parts</h3>
                <p className="text-gray-600 mb-6">
                  High-quality replacement parts for your filtration systems
                </p>
                <Link
                  to="/products/spare-parts"
                  className="inline-block bg-teal-600 text-white px-6 py-3 rounded-full font-medium hover:bg-teal-700 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
                >
                  View Products
                </Link>
              </div>

              <div className="bg-white shadow-lg rounded-2xl p-8 text-center hover:shadow-xl transition-all duration-300 border border-gray-100">
                <div className="text-6xl mb-4">🥤</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Water Bottles</h3>
                <p className="text-gray-600 mb-6">
                  Premium drinking water in various sizes (5L, 10L, 20L)
                </p>
                <Link
                  to="/products/water-bottles"
                  className="inline-block bg-teal-600 text-white px-6 py-3 rounded-full font-medium hover:bg-teal-700 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
                >
                  View Products
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Services Section */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Our Services</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white shadow-lg rounded-2xl p-8 text-center hover:shadow-xl transition-all duration-300 border border-gray-100">
                <div className="text-6xl mb-4">🚰</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Water Supply</h3>
                <p className="text-gray-600">
                  Reliable delivery of premium drinking water to your doorstep
                </p>
              </div>

              <div className="bg-white shadow-lg rounded-2xl p-8 text-center hover:shadow-xl transition-all duration-300 border border-gray-100">
                <div className="text-6xl mb-4">🔧</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Installation</h3>
                <p className="text-gray-600">
                  Professional installation and maintenance of water filtration systems
                </p>
              </div>

              <div className="bg-white shadow-lg rounded-2xl p-8 text-center hover:shadow-xl transition-all duration-300 border border-gray-100">
                <div className="text-6xl mb-4">♻️</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Recycling</h3>
                <p className="text-gray-600">
                  Environmentally responsible water bottle recycling program
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action Section */}
        <section className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Ready to Get Started?</h2>
            <p className="text-xl text-gray-600 mb-8">
              Join thousands of satisfied customers who trust AquaLink for their water needs
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={handleSignup}
                className="bg-teal-600 text-white px-8 py-4 rounded-full font-semibold hover:bg-teal-700 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-lg"
              >
                Create Account
              </button>
              <button
                onClick={handleLogin}
                className="border-2 border-teal-600 text-teal-600 px-8 py-4 rounded-full font-semibold hover:bg-teal-600 hover:text-white transition-all duration-300 text-lg"
              >
                Sign In
              </button>
            </div>
            
            {/* Already have an account section */}
            <div className="mt-8 pt-8 border-t border-gray-200">
              <p className="text-gray-600 mb-4">Already have an account?</p>
              <Link
                to="/login"
                className="inline-block text-teal-600 hover:text-teal-700 underline text-lg transition-colors duration-200"
              >
                Sign in to access your dashboard, cart, and profile
              </Link>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="relative bg-gray-900 border-t border-gray-700">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div>
                <h4 className="text-lg font-semibold text-white mb-4">AquaLink</h4>
                <p className="text-gray-300">
                  Your trusted partner for premium water solutions and sustainable practices.
                </p>
              </div>

              <div>
                <h4 className="text-lg font-semibold text-white mb-4">Quick Links</h4>
                <ul className="space-y-2 text-gray-300">
                  <li><Link to="/products" className="hover:text-white transition-colors">Products</Link></li>
                  <li><Link to="/services" className="hover:text-white transition-colors">Services</Link></li>
                  <li><Link to="/branches" className="hover:text-white transition-colors">Branches</Link></li>
                  <li><Link to="/about" className="hover:text-white transition-colors">About Us</Link></li>
                </ul>
              </div>

              <div>
                <h4 className="text-lg font-semibold text-white mb-4">Contact</h4>
                <ul className="space-y-2 text-gray-300">
                  <li>📧 info@aqualink.com</li>
                  <li>📞 +94 11 234 5678</li>
                  <li>📍 Colombo, Sri Lanka</li>
                </ul>
              </div>

              <div>
                <h4 className="text-lg font-semibold text-white mb-4">Follow Us</h4>
                <div className="flex space-x-4">
                  <a href="#" className="text-gray-300 hover:text-white transition-colors">
                    <span className="sr-only">Facebook</span>
                    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                      <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                    </svg>
                  </a>
                  <a href="#" className="text-gray-300 hover:text-white transition-colors">
                    <span className="sr-only">Instagram</span>
                    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                  </a>
                  <a href="#" className="text-gray-300 hover:text-white transition-colors">
                    <span className="sr-only">Twitter</span>
                    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-700 pt-8 text-center">
              <p className="text-gray-300">&copy; 2024 AquaLink. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default InitialHomePage;
