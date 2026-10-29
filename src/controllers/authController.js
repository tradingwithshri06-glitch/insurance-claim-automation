const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { JWT_SECRET, JWT_EXPIRES_IN, ROLES } = require('../config/config');
const { recordAudit } = require('../services/auditService');

// Issue JWT helper
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

/**
 * Public policyholder registration
 * Strictly assigns ROLES.POLICYHOLDER; prevents mass-assignment privilege escalation
 */
const register = async (req, res, next) => {
  try {
    const { fullName, email, password, phone, address } = req.body;

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists.'
      });
    }

    const newUser = new User({
      fullName,
      email: email.toLowerCase(),
      password,
      role: ROLES.POLICYHOLDER, // Public registration strictly creates Policyholder
      phone: phone || '',
      address: address || '',
      status: 'Active'
    });

    await newUser.save();

    const token = generateToken(newUser);

    await recordAudit({
      user: newUser,
      req,
      action: 'USER_REGISTRATION',
      resourceType: 'User',
      resourceId: newUser._id,
      details: { email: newUser.email, role: newUser.role }
    });

    return res.status(201).json({
      success: true,
      message: 'Account successfully registered.',
      token,
      user: {
        id: newUser._id,
        fullName: newUser.fullName,
        email: newUser.email,
        role: newUser.role,
        phone: newUser.phone,
        address: newUser.address
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * User login
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    if (user.status !== 'Active') {
      return res.status(403).json({
        success: false,
        message: 'This account has been deactivated. Please contact an administrator.'
      });
    }

    const token = generateToken(user);

    await recordAudit({
      user,
      req,
      action: 'USER_LOGIN',
      resourceType: 'Auth',
      resourceId: user._id,
      details: { email: user.email, role: user.role }
    });

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        phone: user.phone,
        address: user.address
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current authenticated user profile
 */
const getMe = async (req, res, next) => {
  try {
    return res.status(200).json({
      success: true,
      user: {
        id: req.user._id,
        fullName: req.user.fullName,
        email: req.user.email,
        role: req.user.role,
        phone: req.user.phone,
        address: req.user.address,
        createdAt: req.user.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update authenticated user profile (role update strictly disallowed here)
 */
const updateProfile = async (req, res, next) => {
  try {
    const { fullName, phone, address } = req.body;
    const user = await User.findById(req.user._id);

    if (fullName) user.fullName = fullName;
    if (phone !== undefined) user.phone = phone;
    if (address !== undefined) user.address = address;

    await user.save();

    await recordAudit({
      user,
      req,
      action: 'PROFILE_UPDATED',
      resourceType: 'User',
      resourceId: user._id,
      details: { updatedFields: { fullName, phone, address } }
    });

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        phone: user.phone,
        address: user.address
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe,
  updateProfile
};

