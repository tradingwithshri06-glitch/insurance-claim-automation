const User = require('../models/User');
const { ROLES, CLAIM_CATEGORIES, DOCUMENT_TYPES, MAX_FILE_SIZE_BYTES } = require('../config/config');
const { recordAudit } = require('../services/auditService');

/**
 * Get users list with filtering and pagination
 */
const getUsers = async (req, res, next) => {
  try {
    const { role, status, search, page = 1, limit = 15 } = req.query;

    const filter = {};
    if (role && role !== 'ALL') {
      filter.role = role;
    }
    if (status && status !== 'ALL') {
      filter.status = status;
    }
    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 15;
    const skip = (pageNum - 1) * limitNum;

    const total = await User.countDocuments(filter);
    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    return res.status(200).json({
      success: true,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      users
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new user with specific role (Admin only)
 */
const createUser = async (req, res, next) => {
  try {
    const { fullName, email, password, role, phone, address } = req.body;

    if (!Object.values(ROLES).includes(role)) {
      return res.status(400).json({
        success: false,
        message: `Invalid role specified. Permitted roles are: ${Object.values(ROLES).join(', ')}`
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'A user with this email address already exists.'
      });
    }

    const user = new User({
      fullName,
      email: email.toLowerCase(),
      password,
      role,
      phone: phone || '',
      address: address || '',
      status: 'Active'
    });

    await user.save();

    await recordAudit({
      user: req.user,
      req,
      action: 'ADMIN_CREATE_USER',
      resourceType: 'User',
      resourceId: user._id,
      details: { email: user.email, role: user.role }
    });

    return res.status(201).json({
      success: true,
      message: `User created successfully with role '${user.role}'.`,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        phone: user.phone,
        address: user.address,
        status: user.status
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user role or status (Admin only)
 */
const updateUserRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role, status } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    // Prevent administrator from demoting or disabling their own account
    if (user._id.toString() === req.user._id.toString()) {
      if (role && role !== ROLES.ADMINISTRATOR) {
        return res.status(400).json({
          success: false,
          message: 'Security safeguard: You cannot remove administrator permissions from your own account.'
        });
      }
      if (status && status !== 'Active') {
        return res.status(400).json({
          success: false,
          message: 'Security safeguard: You cannot suspend your own account.'
        });
      }
    }

    const previousRole = user.role;
    const previousStatus = user.status;

    if (role) {
      if (!Object.values(ROLES).includes(role)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid role specified.'
        });
      }
      user.role = role;
    }

    if (status) {
      if (!['Active', 'Suspended'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Status must be 'Active' or 'Suspended'."
        });
      }
      user.status = status;
    }

    await user.save();

    await recordAudit({
      user: req.user,
      req,
      action: 'USER_ROLE_UPDATED',
      resourceType: 'User',
      resourceId: user._id,
      details: {
        targetUser: user.email,
        previousRole,
        newRole: user.role,
        previousStatus,
        newStatus: user.status
      }
    });

    return res.status(200).json({
      success: true,
      message: 'User account updated successfully.',
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        status: user.status
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get system settings and options
 */
const getSystemSettings = async (req, res, next) => {
  try {
    return res.status(200).json({
      success: true,
      settings: {
        roles: Object.values(ROLES),
        categories: Object.values(CLAIM_CATEGORIES),
        documentTypes: Object.values(DOCUMENT_TYPES),
        maxFileSizeBytes: MAX_FILE_SIZE_BYTES,
        maxFileSizeMB: MAX_FILE_SIZE_BYTES / (1024 * 1024),
        systemEnvironment: process.env.NODE_ENV || 'development',
        isDemonstrationMode: true,
        disclaimer:
          'This system is configured in demonstration mode with simulated workflows and mock policy databases. No actual insurance policy networks or banking networks are connected.'
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsers,
  createUser,
  updateUserRole,
  getSystemSettings
};

