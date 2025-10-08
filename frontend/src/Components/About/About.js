import React from 'react';
import UniversalNavbar from '../Nav/UniversalNavbar';

const About = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50 to-slate-100">
      {/* Universal Navbar */}
      <UniversalNavbar />

      {/* Main Content with top padding for fixed navbar */}
      <div className="pt-16">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-teal-600 to-coral-600 text-white">
        <div className="container mx-auto px-6 py-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-4">About AquaLink</h1>
            <p className="text-xl md:text-2xl opacity-90">Your Trusted Partner in Clean Water Solutions</p>
          </div>
        </div>
      </div>

      {/* Mission Section */}
      <div className="container mx-auto px-6 py-16">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold text-slate-800 mb-6">Our Mission</h2>
            <p className="text-lg text-slate-600 mb-6">
              At AquaLink, we are committed to providing clean, safe drinking water to communities 
              while promoting sustainable practices and environmental responsibility. Our mission is 
              to ensure that every household has access to pure, filtered water through innovative 
              technology and reliable service.
            </p>
            <p className="text-lg text-slate-600">
              We believe that access to clean water is a fundamental human right, and we work 
              tirelessly to make this vision a reality through our comprehensive water supply 
              and emergency management systems.
            </p>
          </div>
          <div className="bg-gradient-to-br from-teal-100 to-coral-100 rounded-lg p-8 border border-teal-200">
            <div className="text-center">
              <div className="text-6xl mb-4">💧</div>
              <h3 className="text-2xl font-bold text-teal-800 mb-4">Pure Water, Pure Life</h3>
              <p className="text-teal-700">
                Delivering quality water solutions since 2010
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Values Section */}
      <div className="bg-gradient-to-br from-slate-50 via-teal-50 to-slate-100 py-16">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center text-slate-800 mb-12">Our Core Values</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6 rounded-lg bg-gradient-to-br from-teal-100 to-coral-100 border border-teal-200">
              <div className="text-4xl mb-4">🛡️</div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">Quality Assurance</h3>
              <p className="text-slate-600">
                We maintain the highest standards in water filtration and purification, 
                ensuring every drop meets international quality standards.
              </p>
            </div>
            <div className="text-center p-6 rounded-lg bg-gradient-to-br from-teal-100 to-coral-100 border border-teal-200">
              <div className="text-4xl mb-4">🌱</div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">Sustainability</h3>
              <p className="text-slate-600">
                Our recycling programs and eco-friendly practices help protect the 
                environment while serving our communities.
              </p>
            </div>
            <div className="text-center p-6 rounded-lg bg-gradient-to-br from-teal-100 to-coral-100 border border-teal-200">
              <div className="text-4xl mb-4">🤝</div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">Community Service</h3>
              <p className="text-slate-600">
                We're committed to serving our communities with reliable emergency 
                water supply and 24/7 support systems.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Services Overview */}
      <div className="container mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-center text-slate-800 mb-12">What We Offer</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-teal-100 to-coral-100 p-6 rounded-lg shadow-md border border-teal-200">
            <div className="text-3xl mb-4">🚰</div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">Drinking Water Supply</h3>
            <p className="text-slate-600 text-sm">
              Premium quality drinking water in various sizes (5L, 10L, 20L) delivered to your doorstep.
            </p>
          </div>
          <div className="bg-gradient-to-br from-teal-100 to-coral-100 p-6 rounded-lg shadow-md border border-teal-200">
            <div className="text-3xl mb-4">🔧</div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">Filter Systems</h3>
            <p className="text-slate-600 text-sm">
              Advanced water filtration systems and spare parts with 1-year warranty.
            </p>
          </div>
          <div className="bg-gradient-to-br from-teal-100 to-coral-100 p-6 rounded-lg shadow-md border border-teal-200">
            <div className="text-3xl mb-4">♻️</div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">Recycling Services</h3>
            <p className="text-slate-600 text-sm">
              Environmentally responsible water bottle recycling programs.
            </p>
          </div>
          <div className="bg-gradient-to-br from-teal-100 to-coral-100 p-6 rounded-lg shadow-md border border-teal-200">
            <div className="text-3xl mb-4">🚨</div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">Emergency Supply</h3>
            <p className="text-slate-600 text-sm">
              24/7 emergency water supply for fire brigades and critical situations.
            </p>
          </div>
        </div>
      </div>

      {/* Team Section */}
      <div className="bg-gradient-to-br from-slate-50 via-teal-50 to-slate-100 py-16">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center text-slate-800 mb-12">Our Team</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-32 h-32 bg-gradient-to-br from-teal-200 to-coral-200 rounded-full mx-auto mb-4 flex items-center justify-center border border-teal-300">
                <span className="text-4xl">👨‍💼</span>
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Factory Managers</h3>
              <p className="text-slate-600">
                Ensuring quality production and efficient operations
              </p>
            </div>
            <div className="text-center">
              <div className="w-32 h-32 bg-gradient-to-br from-teal-200 to-coral-200 rounded-full mx-auto mb-4 flex items-center justify-center border border-teal-300">
                <span className="text-4xl">🏢</span>
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Branch Managers</h3>
              <p className="text-slate-600">
                Managing local operations and customer service
              </p>
            </div>
            <div className="text-center">
              <div className="w-32 h-32 bg-gradient-to-br from-teal-200 to-coral-200 rounded-full mx-auto mb-4 flex items-center justify-center border border-teal-300">
                <span className="text-4xl">🚚</span>
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Delivery Drivers</h3>
              <p className="text-slate-600">
                Reliable delivery service to your location
              </p>
            </div>
          </div>
        </div>
      </div>

      </div>
    </div>
  );
};

export default About;
