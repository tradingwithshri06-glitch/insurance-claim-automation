const Policy = require('../models/Policy');
const { ROLES } = require('../config/config');
const { recordAudit } = require('../services/auditService');

/**
 * Get policies for current user (or all if staff)
 */
const getPolicies = async (req, res, next) => {
  try {
    let filter = {};

    if (req.user.role === ROLES.POLICYHOLDER) {
      filter.policyholderId = req.user._id;
    }

    const policies = await Policy.find(filter)
      .populate('policyholderId', 'fullName email phone')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: policies.length,
      policies
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single policy by ID
 */
const getPolicyById = async (req, res, next) => {
  try {
    const policy = await Policy.findById(req.params.id).populate(
      'policyholderId',
      'fullName email phone'
    );

    if (!policy) {
      return res.status(404).json({
        success: false,
        message: 'Policy not found.'
      });
    }

    // Role-based access check: policyholder can only view their own policy
    if (
      req.user.role === ROLES.POLICYHOLDER &&
      policy.policyholderId._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: you can only view your own policy.'
      });
    }

    return res.status(200).json({
      success: true,
      policy
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a demonstration policy (Admin / Staff)
 */
const createPolicy = async (req, res, next) => {
  try {
    const {
      policyNumber,
      policyholderId,
      category,
      planName,
      vehicleDetails,
      coverageDetails,
      startDate,
      endDate
    } = req.body;

    const existing = await Policy.findOne({ policyNumber: policyNumber.toUpperCase() });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'A policy with this policy number already exists.'
      });
    }

    const policy = new Policy({
      policyNumber: policyNumber.toUpperCase(),
      policyholderId,
      category: category || 'Motor Insurance',
      planName: planName || 'Comprehensive Motor Protection',
      vehicleDetails: vehicleDetails || {},
      coverageDetails: coverageDetails || { deductible: 250, maxCoverageLimit: 50000, currency: 'USD' },
      startDate: startDate || new Date(),
      endDate: endDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      isDemo: true
    });

    await policy.save();

    await recordAudit({
      user: req.user,
      req,
      action: 'POLICY_CREATED',
      resourceType: 'Policy',
      resourceId: policy._id,
      details: { policyNumber: policy.policyNumber, policyholderId }
    });

    return res.status(201).json({
      success: true,
      message: 'Demo policy created successfully.',
      policy
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPolicies,
  getPolicyById,
  createPolicy
};

