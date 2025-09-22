import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState(localStorage.getItem('token'));

    // Set up axios interceptor for authentication
    useEffect(() => {
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        } else {
            delete axios.defaults.headers.common['Authorization'];
        }
    }, [token]);

    // Check if user is authenticated on app load
    useEffect(() => {
        const checkAuth = async () => {
            const storedToken = localStorage.getItem('token');
            const storedUser = localStorage.getItem('user');

            if (storedToken && storedUser) {
                try {
                    // Verify token with backend
                    const response = await axios.get('http://localhost:5000/auth/profile');
                    setUser(response.data.user);
                    setToken(storedToken);
                } catch (error) {
                    console.error('Token verification failed:', error);
                    // Token is invalid, clear storage
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    setUser(null);
                    setToken(null);
                }
            }
            setLoading(false);
        };

        checkAuth();
    }, []);

    const login = async (email, password) => {
        try {
            console.log('Attempting login with:', { email, password });
            
            const response = await axios.post('http://localhost:5000/auth/login', {
                email,
                password
            });

            console.log('Login response:', response.data);

            const { token: newToken, user: userData } = response.data;
            
            localStorage.setItem('token', newToken);
            localStorage.setItem('user', JSON.stringify(userData));
            
            setToken(newToken);
            setUser(userData);
            
            return { success: true, user: userData };
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    };

    const register = async (userData) => {
        try {
            const response = await axios.post('http://localhost:5000/auth/register', userData);
            
            const { token: newToken, user: newUser } = response.data;
            
            localStorage.setItem('token', newToken);
            localStorage.setItem('user', JSON.stringify(newUser));
            
            setToken(newToken);
            setUser(newUser);
            
            return { success: true, user: newUser };
        } catch (error) {
            console.error('Registration error:', error);
            throw error;
        }
    };

    const logout = (redirectPath = null) => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
        delete axios.defaults.headers.common['Authorization'];
        
        // Return redirect path for components to handle navigation
        return redirectPath;
    };

    const updateUser = (updatedUser) => {
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
    };

    const refreshUser = async () => {
        try {
            const response = await axios.get('http://localhost:5000/auth/profile');
            const updatedUser = response.data.user;
            setUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));
            return updatedUser;
        } catch (error) {
            console.error('Error refreshing user data:', error);
            throw error;
        }
    };

    const isAuthenticated = () => {
        return !!token && !!user;
    };

    const hasRole = (role) => {
        return user && user.role === role;
    };

    const isBranchManager = () => {
        return hasRole('Branch Manager');
    };

    const isFactoryManager = () => {
        return hasRole('Factory Manager');
    };

    const value = {
        user,
        token,
        loading,
        login,
        register,
        logout,
        updateUser,
        refreshUser,
        isAuthenticated,
        hasRole,
        isBranchManager,
        isFactoryManager
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
