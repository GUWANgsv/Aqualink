import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AddProductForm = ({ onProductAdded, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    quantity: '',
    unit: 'pieces',
    minStockLevel: '',
    maxStockLevel: '',
    supplier: '',
    price: '',
    originalPrice: '',
    description: '',
    longDescription: '',
    category: 'filters',
    image: '',
    images: [],
    warranty: '1 Year',
    rating: 4.0,
    reviews: 0,
    specifications: {},
    features: []
  });

  const [specifications, setSpecifications] = useState([{ key: '', value: '' }]);
  const [features, setFeatures] = useState(['']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [branches, setBranches] = useState([]);
  const [selectedImages, setSelectedImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);

  // Fetch branches for sync option
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:5000/branches/all', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.data.success) {
          setBranches(response.data.branches);
        }
      } catch (error) {
        console.error('Error fetching branches:', error);
        // Set default branch if API fails
        setBranches([{ _id: '68b40e1308fe4065a39909fb', name: 'Colombo Central Branch' }]);
      }
    };
    fetchBranches();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSpecificationChange = (index, field, value) => {
    const newSpecs = [...specifications];
    newSpecs[index][field] = value;
    setSpecifications(newSpecs);
    
    // Convert to object for formData
    const specsObj = {};
    newSpecs.forEach(spec => {
      if (spec.key && spec.value) {
        specsObj[spec.key] = spec.value;
      }
    });
    setFormData(prev => ({ ...prev, specifications: specsObj }));
  };

  const addSpecification = () => {
    setSpecifications([...specifications, { key: '', value: '' }]);
  };

  const removeSpecification = (index) => {
    const newSpecs = specifications.filter((_, i) => i !== index);
    setSpecifications(newSpecs);
    
    const specsObj = {};
    newSpecs.forEach(spec => {
      if (spec.key && spec.value) {
        specsObj[spec.key] = spec.value;
      }
    });
    setFormData(prev => ({ ...prev, specifications: specsObj }));
  };

  const handleFeatureChange = (index, value) => {
    const newFeatures = [...features];
    newFeatures[index] = value;
    setFeatures(newFeatures);
    setFormData(prev => ({ ...prev, features: newFeatures.filter(f => f.trim() !== '') }));
  };

  const addFeature = () => {
    setFeatures([...features, '']);
  };

  const removeFeature = (index) => {
    const newFeatures = features.filter((_, i) => i !== index);
    setFeatures(newFeatures);
    setFormData(prev => ({ ...prev, features: newFeatures.filter(f => f.trim() !== '') }));
  };

  // Image handling functions
  const handleImageUpload = (event) => {
    const files = Array.from(event.target.files);
    const validFiles = files.filter(file => {
      const isValidType = file.type.startsWith('image/');
      const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB limit
      if (!isValidType) {
        alert(`${file.name} is not a valid image file.`);
        return false;
      }
      if (!isValidSize) {
        alert(`${file.name} is too large. Please select an image smaller than 5MB.`);
        return false;
      }
      return true;
    });

    if (validFiles.length > 0) {
      const newImages = [...selectedImages, ...validFiles];
      setSelectedImages(newImages);
      
      // Create previews for new images
      const newPreviews = validFiles.map(file => ({
        file,
        preview: URL.createObjectURL(file),
        name: file.name
      }));
      setImagePreviews(prev => [...prev, ...newPreviews]);
      
      // Update form data with image paths
      const imagePaths = newImages.map((file, index) => `/products/${file.name}`);
      setFormData(prev => ({
        ...prev,
        image: imagePaths[0] || prev.image,
        images: imagePaths
      }));
    }
  };

  const removeImage = (index) => {
    const newImages = selectedImages.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    
    // Revoke object URL to prevent memory leaks
    URL.revokeObjectURL(imagePreviews[index].preview);
    
    setSelectedImages(newImages);
    setImagePreviews(newPreviews);
    
    // Update form data
    const imagePaths = newImages.map(file => `/products/${file.name}`);
    setFormData(prev => ({
      ...prev,
      image: imagePaths[0] || '',
      images: imagePaths
    }));
  };

  const setMainImage = (index) => {
    if (imagePreviews[index]) {
      setFormData(prev => ({
        ...prev,
        image: imagePreviews[index].preview
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };

      // Create FormData for file upload
      const formDataToSubmit = new FormData();
      
      // Add all form fields
      formDataToSubmit.append('name', formData.name);
      formDataToSubmit.append('quantity', parseInt(formData.quantity));
      formDataToSubmit.append('unit', formData.unit);
      formDataToSubmit.append('minStockLevel', parseInt(formData.minStockLevel) || 10);
      formDataToSubmit.append('maxStockLevel', parseInt(formData.maxStockLevel) || 100);
      formDataToSubmit.append('supplier', formData.supplier);
      formDataToSubmit.append('price', parseFloat(formData.price));
      formDataToSubmit.append('originalPrice', parseFloat(formData.originalPrice) || parseFloat(formData.price) * 1.2);
      formDataToSubmit.append('description', formData.description);
      formDataToSubmit.append('longDescription', formData.longDescription);
      formDataToSubmit.append('category', formData.category);
      formDataToSubmit.append('warranty', formData.warranty);
      formDataToSubmit.append('rating', parseFloat(formData.rating));
      formDataToSubmit.append('reviews', parseInt(formData.reviews));
      formDataToSubmit.append('specifications', JSON.stringify(formData.specifications));
      formDataToSubmit.append('features', JSON.stringify(formData.features));
      formDataToSubmit.append('branchId', branches.length > 0 ? branches[0]._id : null);
      formDataToSubmit.append('syncToBranch', true);

      // Add image files
      selectedImages.forEach((file, index) => {
        formDataToSubmit.append('images', file);
      });

      console.log('🚀 Submitting product data with images:', {
        name: formData.name,
        imagesCount: selectedImages.length,
        branches: branches.length
      });

      const response = await axios.post('http://localhost:5000/Inventory/add-and-sync', formDataToSubmit, { 
        headers: {
          ...headers,
          'Content-Type': 'multipart/form-data'
        }
      });

      console.log('📥 Response received:', response.data);

      if (response.data.success) {
        setSuccess('Product added successfully with images to factory and branch inventory!');
        setFormData({
          name: '',
          quantity: '',
          unit: 'pieces',
          minStockLevel: '',
          maxStockLevel: '',
          supplier: '',
          price: '',
          originalPrice: '',
          description: '',
          longDescription: '',
          category: 'filters',
          image: '',
          images: [],
          warranty: '1 Year',
          rating: 4.0,
          reviews: 0,
          specifications: {},
          features: []
        });
        setSpecifications([{ key: '', value: '' }]);
        setFeatures(['']);
        
        if (onProductAdded) {
          onProductAdded(response.data);
        }
      } else {
        setError(response.data.message || 'Failed to add product');
      }
    } catch (error) {
      console.error('Error adding product:', error);
      setError(error.response?.data?.message || 'Failed to add product. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { value: 'filters', label: 'Filters' },
    { value: 'water-bottles', label: 'Water Bottles' },
    { value: 'spare-parts', label: 'Spare Parts' }
  ];

  const units = [
    { value: 'pieces', label: 'Pieces' },
    { value: 'bottles', label: 'Bottles' },
    { value: 'cartridges', label: 'Cartridges' },
    { value: 'meters', label: 'Meters' },
    { value: 'liters', label: 'Liters' }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Add New Product</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
              <p className="text-green-600">{success}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Water Dispenser"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity *
                </label>
                <input
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  required
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Unit
                </label>
                <select
                  name="unit"
                  value={formData.unit}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {units.map(unit => (
                    <option key={unit.value} value={unit.value}>{unit.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price (LKR) *
                </label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  required
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="2500.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Original Price (LKR)
                </label>
                <input
                  type="number"
                  name="originalPrice"
                  value={formData.originalPrice}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="3000.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Min Stock Level
                </label>
                <input
                  type="number"
                  name="minStockLevel"
                  value={formData.minStockLevel}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="10"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Stock Level
                </label>
                <input
                  type="number"
                  name="maxStockLevel"
                  value={formData.maxStockLevel}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Supplier
                </label>
                <input
                  type="text"
                  name="supplier"
                  value={formData.supplier}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="AquaTech Solutions"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Warranty
                </label>
                <input
                  type="text"
                  name="warranty"
                  value={formData.warranty}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="1 Year"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rating
                </label>
                <input
                  type="number"
                  name="rating"
                  value={formData.rating}
                  onChange={handleInputChange}
                  min="0"
                  max="5"
                  step="0.1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="4.0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reviews Count
                </label>
                <input
                  type="number"
                  name="reviews"
                  value={formData.reviews}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Short Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Brief description of the product..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Long Description
              </label>
              <textarea
                name="longDescription"
                value={formData.longDescription}
                onChange={handleInputChange}
                rows="5"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Detailed description with features, specifications, installation instructions..."
              />
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product Images
              </label>
              
              {/* Upload Button */}
              <div className="mb-4">
                <input
                  type="file"
                  id="imageUpload"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <label
                  htmlFor="imageUpload"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Upload Images
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  Select multiple images (JPG, PNG, GIF) - Max 5MB each
                </p>
              </div>

              {/* Image Previews */}
              {imagePreviews.length > 0 && (
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-gray-700">Selected Images:</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="relative group">
                        <div className="aspect-square rounded-lg overflow-hidden border-2 border-gray-200 hover:border-blue-300 transition-colors">
                          <img
                            src={preview.preview}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        
                        {/* Image Actions */}
                        <div className="absolute top-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={() => setMainImage(index)}
                            className="p-1 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
                            title="Set as main image"
                          >
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                            title="Remove image"
                          >
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                        
                        {/* Main Image Badge */}
                        {formData.image === preview.preview && (
                          <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                            Main
                          </div>
                        )}
                        
                        {/* Image Name */}
                        <div className="mt-1 text-xs text-gray-600 truncate">
                          {preview.name}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* Specifications */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Specifications
              </label>
              {specifications.map((spec, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="Specification name"
                    value={spec.key}
                    onChange={(e) => handleSpecificationChange(index, 'key', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="text"
                    placeholder="Value"
                    value={spec.value}
                    onChange={(e) => handleSpecificationChange(index, 'value', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => removeSpecification(index)}
                    className="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addSpecification}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                Add Specification
              </button>
            </div>

            {/* Features */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Features
              </label>
              {features.map((feature, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="Feature description"
                    value={feature}
                    onChange={(e) => handleFeatureChange(index, e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => removeFeature(index)}
                    className="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addFeature}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                Add Feature
              </button>
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end gap-4 pt-6 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Adding Product...' : 'Add Product & Sync to Branch'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddProductForm;
