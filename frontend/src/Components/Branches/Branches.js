import React from 'react';
import UniversalNavbar from '../Nav/UniversalNavbar';

const Branches = () => {
  const branches = [
    {
      id: 1,
      name: 'Colombo Central Branch',
      location: 'Colombo 03',
      address: '123 Main Street, Colombo 03, Sri Lanka',
      phone: '+94 11 234 5678',
      email: 'colombo@aqualink.com',
      hours: 'Mon-Sat: 8:00 AM - 8:00 PM',
      services: ['Water Supply', 'Filter Sales', 'Recycling']
    },
    {
      id: 2,
      name: 'Kandy Branch',
      location: 'Kandy City',
      address: '456 Lake Road, Kandy, Sri Lanka',
      phone: '+94 81 234 5678',
      email: 'kandy@aqualink.com',
      hours: 'Mon-Sat: 8:00 AM - 8:00 PM',
      services: ['Water Supply', 'Filter Sales', 'Recycling']
    },
    {
      id: 3,
      name: 'Galle Branch',
      location: 'Galle City',
      address: '789 Beach Road, Galle, Sri Lanka',
      phone: '+94 91 234 5678',
      email: 'galle@aqualink.com',
      hours: 'Mon-Sat: 8:00 AM - 8:00 PM',
      services: ['Water Supply', 'Filter Sales', 'Recycling']
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Universal Navbar */}
      <UniversalNavbar />

      {/* Main Content with top padding for fixed navbar */}
      <div className="pt-16">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Our Branches</h1>
            <p className="text-gray-600 mt-1">Find your nearest AquaLink branch</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Map Preview */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Branch Locations</h2>
          <div className="bg-gray-200 rounded-lg h-64 flex items-center justify-center">
            <div className="text-center">
              <div className="text-4xl mb-2">🗺️</div>
              <p className="text-gray-600">Interactive Map Preview</p>
              <p className="text-sm text-gray-500">Real-time dynamic map integration</p>
            </div>
          </div>
        </div>

        {/* Branch List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {branches.map((branch) => (
            <div key={branch.id} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow duration-300">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">{branch.name}</h3>
                <p className="text-blue-600 font-medium">{branch.location}</p>
              </div>
              
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-gray-600">Address:</p>
                  <p className="text-gray-900">{branch.address}</p>
                </div>
                
                <div>
                  <p className="text-gray-600">Phone:</p>
                  <p className="text-gray-900">{branch.phone}</p>
                </div>
                
                <div>
                  <p className="text-gray-600">Email:</p>
                  <p className="text-gray-900">{branch.email}</p>
                </div>
                
                <div>
                  <p className="text-gray-600">Hours:</p>
                  <p className="text-gray-900">{branch.hours}</p>
                </div>
                
                <div>
                  <p className="text-gray-600">Services:</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {branch.services.map((service, index) => (
                      <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                        {service}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex space-x-2">
                <button className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors duration-300 text-sm">
                  Contact
                </button>
                <button className="flex-1 bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 transition-colors duration-300 text-sm">
                  Directions
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

export default Branches;
