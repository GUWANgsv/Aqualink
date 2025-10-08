import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../Context/AuthContext';

const CustomerRegister = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
        password: '',
        confirmPassword: '',
        profilePicture: null
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [phoneError, setPhoneError] = useState('');
    const [profilePicturePreview, setProfilePicturePreview] = useState(null);
    const navigate = useNavigate();
    const { register } = useAuth();

    // Phone validation function
    const validatePhone = (phone) => {
        const phoneDigits = phone.replace(/\D/g, ''); // Remove non-digits
        return phoneDigits.length === 10;
    };

    // Handle profile picture selection
    const handleProfilePictureChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                setError('Please select a valid image file');
                return;
            }
            
            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                setError('Image size must be less than 5MB');
                return;
            }
            
            setFormData({
                ...formData,
                profilePicture: file
            });
            
            // Create preview URL
            const reader = new FileReader();
            reader.onload = (e) => {
                setProfilePicturePreview(e.target.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
        
        // Clear phone error when user starts typing
        if (name === 'phone' && phoneError) {
            setPhoneError('');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setPhoneError('');

        // Validate phone number format
        if (!validatePhone(formData.phone)) {
            setPhoneError('Phone number must be exactly 10 digits');
            setLoading(false);
            return;
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

        try {
            console.log('Registration data:', {
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                address: formData.address,
                hasProfilePicture: !!formData.profilePicture
            });

            let registrationData;
            
            // Use FormData if profile picture is selected, otherwise use regular object
            if (formData.profilePicture) {
                registrationData = new FormData();
                registrationData.append('name', formData.name);
                registrationData.append('email', formData.email);
                registrationData.append('phone', formData.phone);
                registrationData.append('address', formData.address);
                registrationData.append('password', formData.password);
                registrationData.append('role', 'Customer');
                registrationData.append('profilePicture', formData.profilePicture);
                console.log('Using FormData for registration with profile picture');
            } else {
                registrationData = {
                    name: formData.name,
                    email: formData.email,
                    phone: formData.phone,
                    address: formData.address,
                    password: formData.password,
                    role: 'Customer'
                };
                console.log('Using regular object for registration without profile picture');
            }

            const result = await register(registrationData);
            
            // Redirect to homepage for customers
            navigate('/home');
            
        } catch (error) {
            console.error('Registration error details:', error);
            console.error('Error response:', error.response?.data);
            
            // Provide more specific error messages
            let errorMessage = 'Registration failed. Please try again.';
            
            if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.response?.status === 400) {
                errorMessage = 'Invalid registration data. Please check your information.';
            } else if (error.response?.status === 409) {
                errorMessage = 'An account with this email already exists.';
            } else if (error.response?.status === 500) {
                errorMessage = 'Server error. Please try again later.';
            } else if (error.code === 'NETWORK_ERROR') {
                errorMessage = 'Network error. Please check your connection.';
            }
            
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div>
                    <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-green-100">
                        <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                    </div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        Customer Registration
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        Join AquaLink as a Customer
                    </p>
                </div>
                
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                                Full Name *
                            </label>
                            <input
                                id="name"
                                name="name"
                                type="text"
                                required
                                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                                placeholder="Enter your full name"
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
                                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                                placeholder="Enter your email"
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
                                className={`mt-1 appearance-none relative block w-full px-3 py-2 border placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm ${
                                    phoneError ? 'border-red-500' : 'border-gray-300'
                                }`}
                                placeholder="Enter your phone number (10 digits)"
                                value={formData.phone}
                                onChange={handleChange}
                            />
                            {phoneError && (
                                <p className="mt-1 text-sm text-red-600">{phoneError}</p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                                Delivery Address *
                            </label>
                            <textarea
                                id="address"
                                name="address"
                                rows={3}
                                required
                                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                                placeholder="Enter your delivery address"
                                value={formData.address}
                                onChange={handleChange}
                            />
                        </div>

                        <div>
                            <label htmlFor="profilePicture" className="block text-sm font-medium text-gray-700">
                                Profile Picture
                            </label>
                            <div className="mt-1 flex items-center space-x-4">
                                <div className="flex-shrink-0">
                                    {profilePicturePreview ? (
                                        <img
                                            className="h-20 w-20 rounded-full object-cover border-2 border-gray-300"
                                            src={profilePicturePreview}
                                            alt="Profile preview"
                                        />
                                    ) : (
                                        <div className="h-20 w-20 rounded-full bg-gray-200 flex items-center justify-center border-2 border-gray-300">
                                            <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <input
                                        id="profilePicture"
                                        name="profilePicture"
                                        type="file"
                                        accept="image/*"
                                        onChange={handleProfilePictureChange}
                                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                                    />
                                    <p className="mt-1 text-xs text-gray-500">
                                        PNG, JPG, GIF up to 5MB
                                    </p>
                                </div>
                            </div>
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
                                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
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
                                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
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
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            ) : (
                                <svg className="absolute left-0 inset-y-0 flex items-center pl-3">
                                    <path className="h-5 w-5 text-green-500 group-hover:text-green-400" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" />
                                </svg>
                            )}
                            {loading ? 'Creating account...' : 'Create Customer Account'}
                        </button>
                    </div>

                    <div className="text-center">
                        <p className="text-sm text-gray-600">
                            Already have an account?{' '}
                            <button
                                type="button"
                                onClick={() => navigate('/login')}
                                className="font-medium text-green-600 hover:text-green-500"
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

export default CustomerRegister;
