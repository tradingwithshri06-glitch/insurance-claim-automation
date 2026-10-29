const AuditLog = require('../models/AuditLog');

const getAuditLogs = async (req, res, next) => {
  try {
    const { action, resourceType, userEmail, startDate, endDate, page = 1, limit = 20 } = req.query;

    const filter = {};

    if (action && action !== 'ALL') {
      filter.action = action;
    }

    if (resourceType && resourceType !== 'ALL') {
      filter.resourceType = resourceType;
    }

    if (userEmail) {
      filter.userEmail = { $regex: userEmail, $options: 'i' };
    }

    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = new Date(startDate);
      if (endDate) filter.timestamp.$lte = new Date(endDate);
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const total = await AuditLog.countDocuments(filter);
    const logs = await AuditLog.find(filter)
      .populate('userId', 'fullName email role')
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limitNum);

    return res.status(200).json({
      success: true,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      logs
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAuditLogs };

