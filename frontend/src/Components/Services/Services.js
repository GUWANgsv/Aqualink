import React from 'react';
import UniversalNavbar from '../Nav/UniversalNavbar';

const Services = () => {
  const services = [
    {
      id: 1,
      title: 'Water Bottle Recycling',
      description: 'Eco-friendly recycling service for used water bottles. We collect, process, and recycle bottles to reduce environmental impact.',
      icon: '♻️',
      features: ['Free collection service', 'Environmental impact reduction', 'Rewards program', '24/7 drop-off points']
    },
    {
      id: 2,
      title: 'Drinking Water Supply',
      description: 'Reliable delivery of purified drinking water to homes and businesses. Regular scheduled deliveries with flexible plans.',
      icon: '💧',
      features: ['Scheduled deliveries', 'Flexible plans', 'Quality guarantee', 'Emergency supply']
    },
    {
      id: 3,
      title: 'Filter Sales & Installation',
      description: 'Complete range of water filtration systems and professional installation services for clean, safe drinking water.',
      icon: '🔧',
      features: ['Professional installation', '1-year warranty', 'Maintenance service', 'Expert consultation']
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50 to-slate-100">
      {/* Universal Navbar */}
      <UniversalNavbar />

      {/* Main Content with top padding for fixed navbar */}
      <div className="pt-16">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-600 to-coral-600 shadow-lg border-b border-teal-700/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div>
            <h1 className="text-3xl font-bold text-white">Our Services</h1>
            <p className="text-teal-100 mt-1">Comprehensive water solutions for your needs</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service) => (
            <div key={service.id} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow duration-300 border border-teal-100">
              <div className="text-center mb-6">
                <div className="text-6xl mb-4">{service.icon}</div>
                <h2 className="text-xl font-semibold text-slate-800 mb-2">{service.title}</h2>
                <p className="text-slate-600">{service.description}</p>
              </div>
              
              <div className="space-y-3">
                <h3 className="font-medium text-slate-800">Key Features:</h3>
                <ul className="space-y-2">
                  {service.features.map((feature, index) => (
                    <li key={index} className="flex items-center text-sm text-slate-600">
                      <span className="text-teal-500 mr-2">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="mt-6">
                <button className="w-full bg-teal-500 text-white py-2 px-4 rounded-lg hover:bg-teal-600 transition-colors duration-300">
                  Learn More
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      </div>
    </div>
  );
};

export default Services;
