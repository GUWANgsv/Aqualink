import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../Context/AuthContext';
import { useCart } from '../../Context/CartContext';
import UniversalNavbar from '../Nav/UniversalNavbar';

const HomePage = () => {
  const { user, isAuthenticated } = useAuth();
  const { totalItems } = useCart();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

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

  return (
      <div className="min-h-screen bg-white relative">
        {/* Water Background Image */}
        <div className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-80" 
             style={{
               backgroundImage: `url("data:image/svg+xml,%3Csvg width='300' height='300' viewBox='0 0 300 300' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='waterWaves' x='0' y='0' width='300' height='300' patternUnits='userSpaceOnUse'%3E%3Cpath d='M0 150 Q75 120 150 150 T300 150 V300 H0 Z' fill='%2306B6D4' opacity='0.4'/%3E%3Cpath d='M0 180 Q75 150 150 180 T300 180 V300 H0 Z' fill='%2306B6D4' opacity='0.3'/%3E%3Cpath d='M0 210 Q75 180 150 210 T300 210 V300 H0 Z' fill='%2306B6D4' opacity='0.2'/%3E%3Cpath d='M0 120 Q75 90 150 120 T300 120 V300 H0 Z' fill='%2306B6D4' opacity='0.2'/%3E%3Ccircle cx='75' cy='75' r='4' fill='%2306B6D4' opacity='0.3'/%3E%3Ccircle cx='225' cy='105' r='3' fill='%2306B6D4' opacity='0.3'/%3E%3Ccircle cx='150' cy='45' r='3.5' fill='%2306B6D4' opacity='0.3'/%3E%3Ccircle cx='50' cy='200' r='2' fill='%2306B6D4' opacity='0.2'/%3E%3Ccircle cx='250' cy='180' r='2.5' fill='%2306B6D4' opacity='0.2'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='300' height='300' fill='url(%23waterWaves)'/%3E%3C/svg%3E")`
             }}>
        </div>
      {/* Universal Navbar */}
      <UniversalNavbar />

      {/* Main Content with top padding for fixed navbar */}
      <div className="pt-16 relative z-10">
        {/* Hero Section */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 opacity-30">
            <div className="absolute inset-0" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
            }}></div>
          </div>
        
          <div className="relative py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto text-center">
              <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6">
                Welcome to <span className="text-teal-600">AquaLink</span>
            </h1>
              <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
                Your trusted partner for premium water solutions and sustainable practices
              </p>
              
              {/* Search Bar */}
              <div className="max-w-2xl mx-auto mb-8">
                <form onSubmit={handleSearch} className="flex">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search products, services..."
                    className="flex-1 px-6 py-4 bg-white border border-gray-300 rounded-l-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  />
                  <button
                    type="submit"
                    className="px-8 py-4 bg-teal-600 text-white rounded-r-xl hover:bg-teal-700 hover:shadow-lg transition-all duration-300"
                  >
                    Search
                  </button>
                </form>
              </div>

              {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {!isAuthenticated() ? (
                  <>
                    <button
                      onClick={handleLogin}
                      className="px-8 py-4 bg-white text-teal-600 border border-teal-600 rounded-xl font-semibold hover:bg-teal-50 hover:shadow-lg transition-all duration-300"
                    >
                      Login
                    </button>
                    <button
                      onClick={handleSignup}
                      className="px-8 py-4 bg-teal-600 text-white rounded-xl font-semibold hover:bg-teal-700 hover:shadow-lg transition-all duration-300"
                    >
                      Get Started
                    </button>
                  </>
                ) : (
              <Link
                to="/products"
                    className="px-8 py-4 bg-teal-600 text-white rounded-xl font-semibold hover:bg-teal-700 hover:shadow-lg transition-all duration-300 inline-block"
              >
                    Browse Products
              </Link>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* System Switch Banner */}
        {(!isAuthenticated() || user?.role !== 'Customer') && (
          <div className="bg-gradient-to-r from-coral-500/20 to-amber-500/20 border-y border-coral-500/30 py-4">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-coral-500/20 rounded-full flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-coral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Emergency System Available</h3>
                    <p className="text-gray-600 text-sm">Switch to emergency management system for critical situations</p>
                  </div>
                </div>
                <button
                  onClick={handleSystemSwitch}
                  className="px-6 py-3 bg-coral-500 text-white rounded-lg hover:bg-coral-600 transition-colors font-medium"
                >
                  Switch to Emergency
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Featured Products */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 relative">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Featured <span className="text-teal-600">Products</span>
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Discover our premium water solutions designed for quality and sustainability
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white shadow-lg rounded-2xl p-8 border border-gray-100 hover:shadow-xl transition-all duration-300 group">
                <div className="w-16 h-16 bg-teal-500 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <span className="text-2xl">💧</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Premium Water Bottles</h3>
                <p className="text-gray-600 mb-6">
                  High-quality, BPA-free water bottles in various sizes for every need
                </p>
                <div className="mt-6">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-teal-500/20 text-teal-300">
                    <span className="w-1.5 h-1.5 bg-teal-400 rounded-full mr-2"></span>
                    Eco-Friendly
                  </span>
                </div>
              </div>

              <div className="bg-white shadow-lg rounded-2xl p-8 border border-gray-100 hover:shadow-xl transition-all duration-300 group">
                <div className="w-16 h-16 bg-amber-500 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <span className="text-2xl">🌱</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Recycling Program</h3>
                <p className="text-gray-600 mb-6">
                  Join our sustainable recycling program and earn rewards for your environmental efforts
                </p>
                <div className="mt-6">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-amber-500/20 text-amber-300">
                    <span className="w-1.5 h-1.5 bg-amber-400 rounded-full mr-2"></span>
                    Sustainable
                  </span>
                </div>
              </div>

              <div className="bg-white shadow-lg rounded-2xl p-8 border border-gray-100 hover:shadow-xl transition-all duration-300 group">
                <div className="w-16 h-16 bg-amber-500 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <span className="text-2xl">🚚</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Fast Delivery</h3>
                <p className="text-gray-600 mb-6">
                  Quick and reliable delivery service to your doorstep with real-time tracking
                </p>
                <div className="mt-6">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-amber-500/20 text-amber-300">
                    <span className="w-1.5 h-1.5 bg-amber-400 rounded-full mr-2"></span>
                    Express
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Services Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 relative">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Our <span className="text-teal-600">Services</span>
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Comprehensive water solutions tailored to meet your specific needs
                </p>
              </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-8">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-teal-500 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Quality Assurance</h3>
                    <p className="text-gray-600">
                      Rigorous testing and quality control to ensure every product meets our high standards
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Eco-Friendly Solutions</h3>
                    <p className="text-gray-600">
                      Environmentally responsible water bottle recycling program with rewards and sustainability focus
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-teal-500 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 2.25a9.75 9.75 0 100 19.5 9.75 9.75 0 000-19.5z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">24/7 Support</h3>
                    <p className="text-gray-600">
                      Round-the-clock customer support to assist you with any questions or concerns
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white shadow-lg rounded-2xl p-8 border border-gray-100">
                <div className="text-center">
                  <div className="w-20 h-20 bg-teal-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="text-3xl">🌊</span>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">Sustainable Water Solutions</h3>
                  <p className="text-gray-600 mb-6">
                    Environmentally responsible water bottle recycling program with rewards and sustainability focus
                  </p>
                  <div className="mt-6">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-teal-500/20 text-teal-300">
                      <span className="w-1.5 h-1.5 bg-teal-400 rounded-full mr-2"></span>
                      Earn Rewards
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Customer Dashboard moved to MyAccount page */}

        {/* Footer */}
        <footer className="relative bg-gray-900 border-t border-gray-700">
          <div className="absolute inset-0 opacity-50">
            <div className="absolute inset-0" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.02'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
            }}></div>
          </div>
          
          <div className="relative py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
                <div className="md:col-span-1">
                  <div className="flex items-center mb-6">
                    <div className="w-10 h-10 bg-teal-500 rounded-xl flex items-center justify-center mr-3">
                      <span className="text-white text-xl font-bold">A</span>
                    </div>
                    <span className="text-2xl font-bold text-teal-400">
                      AquaLink
                    </span>
                  </div>
                  <p className="text-gray-300 leading-relaxed mb-6">
                  Your trusted partner for premium water solutions and sustainable practices.
                    Delivering excellence since 2010.
                  </p>
                  <div className="flex space-x-4">
                    <a href="#" className="w-10 h-10 bg-teal-500/20 rounded-lg flex items-center justify-center text-teal-300 hover:bg-teal-500/30 hover:text-white transition-all duration-300">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                      </svg>
                    </a>
                    <a href="#" className="w-10 h-10 bg-coral-500/20 rounded-lg flex items-center justify-center text-coral-300 hover:bg-coral-500/30 hover:text-white transition-all duration-300">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z"/>
                      </svg>
                    </a>
                  </div>
              </div>

                <div className="md:col-span-1">
                  <h3 className="text-lg font-semibold text-white mb-4">Quick Links</h3>
                  <ul className="space-y-3">
                    <li>
                      <a href="/products" className="text-gray-300 hover:text-white transition-colors flex items-center">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                        Products
                      </a>
                    </li>
                    <li>
                      <a href="/services" className="text-gray-300 hover:text-white transition-colors flex items-center">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Services
                      </a>
                    </li>
                    <li>
                      <a href="/branches" className="text-gray-300 hover:text-white transition-colors flex items-center">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Branches
                      </a>
                    </li>
                    <li>
                      <a href="/about" className="text-gray-300 hover:text-white transition-colors flex items-center">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        About Us
                      </a>
                    </li>
                </ul>
              </div>

                <div className="md:col-span-1">
                  <h3 className="text-lg font-semibold text-white mb-4">Contact Info</h3>
                  <div className="space-y-3">
                    <div className="flex items-center text-gray-300">
                      <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <span>+1 (555) 123-4567</span>
                    </div>
                    <div className="flex items-center text-gray-300">
                      <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span>info@aqualink.com</span>
                    </div>
                    <div className="flex items-center text-gray-300">
                      <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>123 Water Street, Aqua City</span>
                    </div>
                  </div>
                </div>

                <div className="md:col-span-1">
                  <h3 className="text-lg font-semibold text-white mb-4">Newsletter</h3>
                  <p className="text-gray-300 mb-4">Subscribe to our newsletter for updates and special offers.</p>
                  <div className="flex">
                    <input
                      type="email"
                      placeholder="Enter your email"
                      className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-l-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                    <button className="px-6 py-2 bg-teal-500 text-white rounded-r-lg hover:bg-teal-600 transition-colors">
                      Subscribe
                    </button>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-700 pt-8 mt-12">
                <div className="text-center">
                  <p className="text-gray-300">
                    © 2024 AquaLink. All rights reserved. | 
                    <a href="/privacy" className="hover:text-white transition-colors ml-1">Privacy Policy</a> | 
                    <a href="/terms" className="hover:text-white transition-colors ml-1">Terms of Service</a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default HomePage;
