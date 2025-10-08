const jwt = require('jsonwebtoken');
const User = require('../Model/UserModel');

// JWT Secret - In production, this should be in environment variables
const JWT_SECRET = 'your-super-secret-jwt-key-change-in-production';

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            return res.status(401).json({ message: 'Access token required' });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await User.findById(decoded.userId).select('-password');
        
        if (!user || !user.isActive) {
            return res.status(401).json({ message: 'Invalid or inactive user' });
        }

        req.user = user;
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'Invalid token' });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token expired' });
        }
        return res.status(500).json({ message: 'Authentication error' });
    }
};

// Middleware to check if user has specific role
const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ 
                message: 'Access denied. Insufficient permissions.' 
            });
        }

        next();
    };
};

// Middleware specifically for Branch Manager access
const requireBranchManager = requireRole(['Branch Manager']);

// Middleware specifically for Factory Manager access
const requireFactoryManager = requireRole(['Factory Manager']);

// Middleware for both roles
const requireAnyManager = requireRole(['Branch Manager', 'Factory Manager']);

module.exports = {
    authenticateToken,
    requireRole,
    requireBranchManager,
    requireFactoryManager,
    requireAnyManager,
    JWT_SECRET
};
