import React, { useState, useEffect } from 'react';
import UniversalNavbar from '../Nav/UniversalNavbar';
import BranchMap from './BranchMap';

const Branches = () => {
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch branches from backend
  const fetchBranches = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/branches/public/active');
      
      if (!response.ok) {
        throw new Error('Failed to fetch branches');
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Transform backend data to match frontend format
        const transformedBranches = data.branches.map((branch, index) => ({
          id: branch._id,
          name: branch.name,
          location: branch.location,
          address: branch.contactInfo.address,
          phone: branch.contactInfo.phone,
          email: branch.contactInfo.email,
          hours: `${branch.operatingHours.open} - ${branch.operatingHours.close}`,
          services: branch.services || [],
          coordinates: [branch.coordinates.lat, branch.coordinates.lng],
          type: branch.name.toLowerCase().includes('central') || branch.name.toLowerCase().includes('main') 
            ? 'main' 
            : branch.name.toLowerCase().includes('regional')
            ? 'regional'
            : 'standard',
          emergencyContact: branch.emergencyContact
        }));
        
        setBranches(transformedBranches);
        setError(null);
      } else {
        throw new Error(data.message || 'Failed to fetch branches');
      }
    } catch (error) {
      console.error('Error fetching branches:', error);
      setError(error.message);
      // Set fallback data for development
      setBranches([]);
    } finally {
      setLoading(false);
    }
  };

  // Load branches on component mount
  useEffect(() => {
    fetchBranches();
  }, []);

  const handleBranchSelect = (branch) => {
    setSelectedBranch(branch);
    // Scroll to branch details
    const branchElement = document.getElementById(`branch-${branch.id}`);
    if (branchElement) {
      branchElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

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
        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading branch locations...</p>
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
            <div className="flex items-center">
              <div className="text-red-400 mr-3">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-red-800 font-medium">Error Loading Branches</h3>
                <p className="text-red-600 text-sm mt-1">{error}</p>
                <button 
                  onClick={fetchBranches}
                  className="mt-2 text-sm text-red-700 hover:text-red-800 underline"
                >
                  Try again
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Interactive Branch Map */}
        {!loading && !error && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Branch Locations</h2>
              <div className="text-sm text-gray-600">
                {branches.length} active branches across Sri Lanka
              </div>
            </div>
            <BranchMap 
              branches={branches} 
              onBranchSelect={handleBranchSelect}
            />
          </div>
        )}

        {/* Branch List */}
        {!loading && !error && (
          <>
            {branches.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                <div className="text-gray-400 text-4xl mb-4">🏢</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Branches</h3>
                <p className="text-gray-500">
                  There are currently no active branches available. Please check back later.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {branches.map((branch) => (
            <div 
              key={branch.id} 
              id={`branch-${branch.id}`}
              className={`bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-all duration-300 ${
                selectedBranch?.id === branch.id 
                  ? 'ring-2 ring-blue-500 shadow-lg' 
                  : ''
              }`}
            >
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">{branch.name}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    branch.type === 'main' 
                      ? 'bg-green-100 text-green-800' 
                      : branch.type === 'regional'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {branch.type === 'main' ? 'Main' : branch.type === 'regional' ? 'Regional' : 'Standard'}
                  </span>
                </div>
                <p className="text-blue-600 font-medium">{branch.location}</p>
              </div>
              
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-gray-600 font-medium">📍 Address:</p>
                  <p className="text-gray-900">{branch.address}</p>
                </div>
                
                <div>
                  <p className="text-gray-600 font-medium">📞 Phone:</p>
                  <p className="text-gray-900">{branch.phone}</p>
                </div>
                
                <div>
                  <p className="text-gray-600 font-medium">✉️ Email:</p>
                  <p className="text-gray-900">{branch.email}</p>
                </div>
                
                <div>
                  <p className="text-gray-600 font-medium">🕒 Hours:</p>
                  <p className="text-gray-900">{branch.hours}</p>
                </div>
                
                <div>
                  <p className="text-gray-600 font-medium">🛠️ Services:</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {branch.services.map((service, index) => (
                      <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                        {service}
                      </span>
                    ))}
                  </div>
                </div>
                
                {/* Emergency Contact Information */}
                {branch.emergencyContact && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-800 font-medium text-sm mb-2">🚨 Emergency Contact</p>
                    <div className="text-sm text-red-700">
                      {branch.emergencyContact.name && (
                        <p><span className="font-medium">Name:</span> {branch.emergencyContact.name}</p>
                      )}
                      {branch.emergencyContact.phone && (
                        <p><span className="font-medium">Phone:</span> {branch.emergencyContact.phone}</p>
                      )}
                      {branch.emergencyContact.email && (
                        <p><span className="font-medium">Email:</span> {branch.emergencyContact.email}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
              </div>
            )}
          </>
        )}
      </div>
      </div>
    </div>
  );
};

export default Branches;
