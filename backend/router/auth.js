const express = require('express');
const passport = require('passport');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/Schema');
const { verifyToken } = require('../middleware');

// Constants
const APP_URL = 'http://localhost:5173';
const ROUTES = {
    LOGIN: `${APP_URL}/login`,
    SUCCESS: `${APP_URL}/auth/success`
};

// Generate JWT token
const generateToken = (user) => {
    return jwt.sign(
        { userId: user._id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: '15m' }
    );
};

// Set authentication cookies
const setAuthCookies = (res, token) => {
    res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 15 * 60 * 1000 // 15 minutes
    });
};

// Handle OAuth callback
const handleOAuthCallback = (provider) => async (req, res, next) => {
    passport.authenticate(provider, { 
        failureRedirect: ROUTES.LOGIN,
        failureMessage: true
    }, async (err, user, info) => {
        try {
            if (err || !user) {
                console.error(`${provider} authentication error:`, err || 'No user returned');
                return res.redirect(ROUTES.LOGIN);
            }

            await new Promise((resolve, reject) => {
                req.logIn(user, (err) => err ? reject(err) : resolve());
            });

            const token = generateToken(user);
            setAuthCookies(res, token);
            res.redirect(`${ROUTES.SUCCESS}?token=${token}`);

        } catch (error) {
            console.error(`Error in ${provider} callback:`, error);
            res.redirect(ROUTES.LOGIN);
        }
    })(req, res, next);
};

// OAuth Routes
router.get('/github', passport.authenticate('github'));
router.get('/github/callback', handleOAuthCallback('github'));

router.get('/google', passport.authenticate('google', {
    scope: ['profile', 'email', 'openid'],
    accessType: 'offline',
    prompt: 'consent'
}));
router.get('/google/callback', handleOAuthCallback('google'));

// Check authentication status
router.get('/me', async (req, res) => {
  try {
    // Get token from cookies
    const token = req.cookies.token;
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user data
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    console.error('Auth check error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
});

// Get current user info
router.get('/me/info', verifyToken, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Not authenticated' });
        }

        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({
            id: user._id,
            email: user.email,
            username: user.username,
            googleId: user.googleId,
            githubId: user.githubId,
            isVerified: user.isVerified
        });
    } catch (error) {
        console.error('Error getting user info:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router;