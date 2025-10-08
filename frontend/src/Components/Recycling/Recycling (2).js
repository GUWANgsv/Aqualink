import React from 'react';
import UniversalNavbar from '../Nav/UniversalNavbar';
import Footer from '../Footer/Footer';

function Recycling() {
  return (
    <div className="min-h-screen bg-gray-50">
      <UniversalNavbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Recycling Management</h1>
          <p className="text-gray-600 mt-2">Manage recycling processes and track environmental impact</p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="text-6xl mb-4">♻️</div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Recycling Module</h2>
          <p className="text-gray-600 mb-6">
            This module will be implemented to track recycling processes, 
            environmental impact metrics, and sustainability reporting.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <div className="bg-green-50 p-6 rounded-lg">
              <h3 className="text-lg font-medium text-green-800 mb-2">Waste Management</h3>
              <p className="text-green-600">Track and manage waste disposal processes</p>
            </div>
            <div className="bg-blue-50 p-6 rounded-lg">
              <h3 className="text-lg font-medium text-blue-800 mb-2">Environmental Impact</h3>
              <p className="text-blue-600">Monitor carbon footprint and sustainability metrics</p>
            </div>
            <div className="bg-purple-50 p-6 rounded-lg">
              <h3 className="text-lg font-medium text-purple-800 mb-2">Compliance Reporting</h3>
              <p className="text-purple-600">Generate environmental compliance reports</p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default Recycling;
