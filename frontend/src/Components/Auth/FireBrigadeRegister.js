import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../Context/AuthContext';

const FireBrigadeRegister = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        brigadeId: '',
        brigadeName: '',
        brigadeLocation: '',
        vehicleNumber: '',
        emergencyContact: '',
        password: '',
        confirmPassword: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [phoneError, setPhoneError] = useState('');
    const [emergencyContactError, setEmergencyContactError] = useState('');
    const navigate = useNavigate();
    const { register } = useAuth();

    // Phone number validation function
    const validatePhoneNumber = (phone) => {
        // Remove all non-digit characters for validation
        const cleanPhone = phone.replace(/\D/g, '');
        
        // Check if phone number is empty
        if (!phone.trim()) {
            return 'Phone number is required';
        }
        
        // Check if phone number contains only digits and is exactly 10 digits
        if (!/^\d{10}$/.test(cleanPhone)) {
            return 'Phone number must be exactly 10 digits';
        }
        
        // Check for common invalid patterns
        if (/^(\d)\1{9,}$/.test(cleanPhone)) {
            return 'Phone number cannot be all the same digit';
        }
        
        return '';
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        
        setFormData({
            ...formData,
            [name]: value
        });
        
        // Validate phone number in real-time
        if (name === 'phone') {
            const phoneValidationError = validatePhoneNumber(value);
            setPhoneError(phoneValidationError);
        }
        
        // Validate emergency contact in real-time
        if (name === 'emergencyContact') {
            const emergencyValidationError = validatePhoneNumber(value);
            setEmergencyContactError(emergencyValidationError);
        }
        
        // Clear phone error when user starts typing
        if (name === 'phone' && phoneError) {
            setPhoneError('');
        }
        
        // Clear emergency contact error when user starts typing
        if (name === 'emergencyContact' && emergencyContactError) {
            setEmergencyContactError('');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setPhoneError('');
        setEmergencyContactError('');

        // Validate phone number
        const phoneValidationError = validatePhoneNumber(formData.phone);
        if (phoneValidationError) {
            setPhoneError(phoneValidationError);
            setLoading(false);
            return;
        }

        // Validate emergency contact if provided
        if (formData.emergencyContact.trim()) {
            const emergencyValidationError = validatePhoneNumber(formData.emergencyContact);
            if (emergencyValidationError) {
                setEmergencyContactError(emergencyValidationError);
                setLoading(false);
                return;
            }
        }

        // Validate passwords match
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            setLoading(false);
            return;
        }

        // Validate password length
        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters long');
            setLoading(false);
            return;
        }

        // Validate required fields
        if (!formData.brigadeId || !formData.brigadeName || !formData.brigadeLocation || !formData.vehicleNumber) {
            setError('All brigade information fields are required');
            setLoading(false);
            return;
        }

        try {
            const registrationData = {
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                brigadeId: formData.brigadeId,
                brigadeName: formData.brigadeName,
                brigadeLocation: formData.brigadeLocation,
                vehicleNumber: formData.vehicleNumber,
                emergencyContact: formData.emergencyContact,
                password: formData.password,
                role: 'Fire Brigade' // Fixed role for fire brigade
            };

            const result = await register(registrationData);
            
            // Redirect to fire brigade dashboard
            navigate('/fire-brigade-dashboard');
            
        } catch (error) {
            setError(error.response?.data?.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div>
                    <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-red-100">
                        <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    </div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        Fire Brigade Registration
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        Register for Emergency Water Supply System
                    </p>
                </div>
                
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                                Driver Name *
                            </label>
                            <input
                                id="name"
                                name="name"
                                type="text"
                                required
                                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
                                placeholder="Enter driver's full name"
                                value={formData.name}
                                onChange={handleChange}
                            />
                        </div>

                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                Email Address *
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
                                placeholder="Enter email address"
                                value={formData.email}
                                onChange={handleChange}
                            />
                        </div>

                        <div>
                            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                                Phone Number *
                            </label>
                            <input
                                id="phone"
                                name="phone"
                                type="tel"
                                required
                                className={`mt-1 appearance-none relative block w-full px-3 py-2 border ${
                                    phoneError ? 'border-red-300' : 'border-gray-300'
                                } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm`}
                                placeholder="Enter phone number (10 digits)"
                                value={formData.phone}
                                onChange={handleChange}
                            />
                            {phoneError && (
                                <p className="mt-1 text-sm text-red-600">{phoneError}</p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="brigadeId" className="block text-sm font-medium text-gray-700">
                                Brigade ID *
                            </label>
                            <input
                                id="brigadeId"
                                name="brigadeId"
                                type="text"
                                required
                                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
                                placeholder="Enter brigade ID"
                                value={formData.brigadeId}
                                onChange={handleChange}
                            />
                        </div>

                        <div>
                            <label htmlFor="brigadeName" className="block text-sm font-medium text-gray-700">
                                Brigade Name *
                            </label>
                            <input
                                id="brigadeName"
                                name="brigadeName"
                                type="text"
                                required
                                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
                                placeholder="Enter brigade name"
                                value={formData.brigadeName}
                                onChange={handleChange}
                            />
                        </div>

                        <div>
                            <label htmlFor="brigadeLocation" className="block text-sm font-medium text-gray-700">
                                Brigade Location *
                            </label>
                            <input
                                id="brigadeLocation"
                                name="brigadeLocation"
                                type="text"
                                required
                                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
                                placeholder="Enter brigade location"
                                value={formData.brigadeLocation}
                                onChange={handleChange}
                            />
                        </div>

                        <div>
                            <label htmlFor="vehicleNumber" className="block text-sm font-medium text-gray-700">
                                Vehicle Number *
                            </label>
                            <input
                                id="vehicleNumber"
                                name="vehicleNumber"
                                type="text"
                                required
                                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
                                placeholder="Enter vehicle number"
                                value={formData.vehicleNumber}
                                onChange={handleChange}
                            />
                        </div>

                        <div>
                            <label htmlFor="emergencyContact" className="block text-sm font-medium text-gray-700">
                                Emergency Contact
                            </label>
                            <input
                                id="emergencyContact"
                                name="emergencyContact"
                                type="tel"
                                className={`mt-1 appearance-none relative block w-full px-3 py-2 border ${
                                    emergencyContactError ? 'border-red-300' : 'border-gray-300'
                                } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm`}
                                placeholder="Enter emergency contact number (10 digits)"
                                value={formData.emergencyContact}
                                onChange={handleChange}
                            />
                            {emergencyContactError && (
                                <p className="mt-1 text-sm text-red-600">{emergencyContactError}</p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                Password *
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="new-password"
                                required
                                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
                                placeholder="Enter password (min 6 characters)"
                                value={formData.password}
                                onChange={handleChange}
                            />
                        </div>

                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                                Confirm Password *
                            </label>
                            <input
                                id="confirmPassword"
                                name="confirmPassword"
                                type="password"
                                autoComplete="new-password"
                                required
                                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
                                placeholder="Confirm your password"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="rounded-md bg-red-50 p-4">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium text-red-800">
                                        {error}
                                    </h3>
                                </div>
                            </div>
                        </div>
                    )}

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            ) : (
                                <svg className="absolute left-0 inset-y-0 flex items-center pl-3">
                                    <path className="h-5 w-5 text-red-500 group-hover:text-red-400" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" />
                                </svg>
                            )}
                            {loading ? 'Creating account...' : 'Register Fire Brigade'}
                        </button>
                    </div>

                    <div className="text-center">
                        <p className="text-sm text-gray-600">
                            Already have an account?{' '}
                            <button
                                type="button"
                                onClick={() => navigate('/login')}
                                className="font-medium text-red-600 hover:text-red-500"
                            >
                                Sign in here
                            </button>
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default FireBrigadeRegister;
