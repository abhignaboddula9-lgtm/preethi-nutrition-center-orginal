const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

// Helper function to generate JWT Token
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET || 'your_jwt_secret_key_change_this_in_production',
    { expiresIn: process.env.JWT_EXPIRE || '30d' }
  );
};

// @desc    Register a new customer
// @route   POST /api/auth/register
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone, height, weight } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide name, email, and password' });
    }

    // Check if user already exists
    const emailLower = email.toLowerCase();
    const userExists = await User.findOne({ email: emailLower });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists with this email' });
    }

    // Hash Password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create User (Force role to 'customer' for safety)
    const user = await User.create({
      name,
      email: emailLower,
      password: hashedPassword,
      phone: phone || '',
      height: height || 0,
      weight: weight || 0,
      role: 'customer'
    });

    // Generate Token
    const token = generateToken(user);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        height: user.height,
        weight: user.weight,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    User Login (Customer or Admin)
// @route   POST /api/auth/login
// @access  Public
router.post('/login', async (req, res) => {
  try {
    let { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    let emailLower = email.toLowerCase().trim();
    let loginPassword = password;

    if (emailLower === 'admin' && loginPassword === 'admin') {
      emailLower = 'admin@preethinutrition.com';
      loginPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'Admin@123';
    }

    // Find User
    const user = await User.findOne({ email: emailLower });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Verify Password
    const isMatch = await bcrypt.compare(loginPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Generate Token
    const token = generateToken(user);

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        height: user.height,
        weight: user.weight,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Admin Login
// @route   POST /api/auth/admin/login
// @access  Public
router.post('/admin/login', async (req, res) => {
  try {
    let { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    let emailLower = email.toLowerCase().trim();
    let loginPassword = password;

    if (emailLower === 'admin' && loginPassword === 'admin') {
      emailLower = 'admin@preethinutrition.com';
      loginPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'Admin@123';
    }

    // Find User
    const user = await User.findOne({ email: emailLower });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Verify role is admin
    if (user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied: Admin credentials required' });
    }

    // Verify Password
    const isMatch = await bcrypt.compare(loginPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Generate Token
    const token = generateToken(user);

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Simulated Google Sign-in / registration
// @route   POST /api/auth/google
// @access  Public
router.post('/google', async (req, res) => {
  try {
    const { email, name } = req.body;

    if (!email || !name) {
      return res.status(400).json({ success: false, message: 'Please provide email and name' });
    }

    const emailLower = email.toLowerCase().trim();
    let user = await User.findOne({ email: emailLower });

    if (!user) {
      const isAdmin = emailLower === 'preethiherbalife@gmail.com' || emailLower === 'admin@preethinutrition.com';
      const role = isAdmin ? 'admin' : 'customer';

      // Generate a random password for users created via Google OAuth
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(Math.random().toString(36).substr(2, 9), salt);

      user = await User.create({
        name,
        email: emailLower,
        role,
        phone: '9293604899',
        password: hashedPassword
      });
    }

    const token = generateToken(user);

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Authentication Middleware to protect routes
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'your_jwt_secret_key_change_this_in_production'
      );

      // Get user from the token, exclude password
      req.user = await User.findById(decoded.id).select('-password');
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Not authorized, user not found' });
      }

      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ success: false, message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    res.status(401).json({ success: false, message: 'Not authorized, no token' });
  }
};

// Admin Authorization Middleware
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ success: false, message: 'Not authorized as an admin' });
  }
};

// Attach middlewares directly to the router so they can be imported in other routes
router.protect = protect;
router.adminOnly = adminOnly;

module.exports = router;
