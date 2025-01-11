const jwt = require('jsonwebtoken');
const User = require('./models/Schema');

// Verify Access Token Middleware
const verifyToken = async (req, res, next) => {
    try {
        // Check both cookies and Authorization header
        const token = req.cookies.token || 
                     (req.headers.authorization && req.headers.authorization.split(' ')[1]);

        if (!token) {
            return res.status(401).json({ message: 'Access token required' });
        }

        console.log("Token found:", token);

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            console.log("Decoded token:", decoded);
            const user = await User.findById(decoded.userId);
            
            if (!user) {
                return res.status(401).json({ message: 'User not found' });
            }

            req.user = user;
            next();
        } catch (tokenError) {
            if (tokenError.name === 'TokenExpiredError') {
                return res.status(401).json({ 
                    message: 'Access token expired',
                    tokenExpired: true 
                });
            }
            return res.status(401).json({ message: 'Invalid access token' });
        }
    } catch (error) {
        console.error('Auth middleware error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

// midddleware to check user use it in logout 
const authenticateUser = (req, res, next) => {
    const token = req.cookies.refreshToken ||req.cookies.token; 
  
    if (!token) {
      return res.status(401).json({ message: 'Unauthorized - No token provided' });
    }
  
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET); 
      console.log('Decoded token:', decoded); 
      req.user = {
        _id: decoded.userId,
        role: decoded.role
      };
      next(); 
    } catch (error) {
      console.error('Token verification error:', error);
      return res.status(401).json({ message: 'Unauthorized - Invalid token' });
    }
  };

module.exports = { verifyToken,authenticateUser };