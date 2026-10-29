const Claim = require('../models/Claim');
const Policy = require('../models/Policy');
const { ROLES, CLAIM_STATUS, SETTLEMENT_STATUS } = require('../config/config');

const getDashboardStats = async (req, res, next) => {
  try {
    const { category, startDate, endDate } = req.query;

    const baseFilter = {};

    // Policyholder only sees metrics for their own claims
    if (req.user.role === ROLES.POLICYHOLDER) {
      baseFilter.policyholderId = req.user._id;
    }

    if (category && category !== 'ALL') {
      baseFilter.category = category;
    }

    if (startDate || endDate) {
      baseFilter.createdAt = {};
      if (startDate) baseFilter.createdAt.$gte = new Date(startDate);
      if (endDate) baseFilter.createdAt.$lte = new Date(endDate);
    }

    // Aggregate counts by status
    const statusCountsAgg = await Claim.aggregate([
      { $match: baseFilter },
      { $group: { _id: '$status', count: { $sum: 1 }, totalAmount: { $sum: '$claimedAmount' } } }
    ]);

    const statusCounts = {};
    Object.values(CLAIM_STATUS).forEach((st) => {
      statusCounts[st] = 0;
    });

    let totalClaims = 0;
    let totalClaimedAmount = 0;

    statusCountsAgg.forEach((item) => {
      statusCounts[item._id] = item.count;
      totalClaims += item.count;
      totalClaimedAmount += item.totalAmount || 0;
    });

    // Settled amount aggregate
    const settledAmountAgg = await Claim.aggregate([
      {
        $match: {
          ...baseFilter,
          status: CLAIM_STATUS.SETTLED
        }
      },
      {
        $group: {
          _id: null,
          totalSettledAmount: { $sum: '$approvedAmount' }
        }
      }
    ]);
    const totalSettledAmount = settledAmountAgg[0]?.totalSettledAmount || 0;

    // Awaiting settlement count
    const awaitingSettlement =
      statusCounts[CLAIM_STATUS.APPROVED] + statusCounts[CLAIM_STATUS.SETTLEMENT_PENDING];

    // Flagged claims count
    const flaggedCount = await Claim.countDocuments({
      ...baseFilter,
      'fraudRiskFlag.isFlagged': true
    });

    // Recent claim activity feed
    const recentClaims = await Claim.find(baseFilter)
      .populate('policyholderId', 'fullName email')
      .populate('policyId', 'policyNumber planName')
      .sort({ updatedAt: -1 })
      .limit(6);

    // Distribution by category
    const categoryDistribution = await Claim.aggregate([
      { $match: baseFilter },
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);

    // Active policies count
    let activePoliciesCount = 0;
    if (req.user.role === ROLES.POLICYHOLDER) {
      activePoliciesCount = await Policy.countDocuments({
        policyholderId: req.user._id,
        status: 'Active'
      });
    } else {
      activePoliciesCount = await Policy.countDocuments({ status: 'Active' });
    }

    return res.status(200).json({
      success: true,
      stats: {
        totalClaims,
        submitted: statusCounts[CLAIM_STATUS.SUBMITTED],
        underReview: statusCounts[CLAIM_STATUS.UNDER_REVIEW],
        needsCorrection: statusCounts[CLAIM_STATUS.NEEDS_CORRECTION],
        underInvestigation: statusCounts[CLAIM_STATUS.UNDER_INVESTIGATION],
        approved: statusCounts[CLAIM_STATUS.APPROVED],
        rejected: statusCounts[CLAIM_STATUS.REJECTED],
        settlementPending: statusCounts[CLAIM_STATUS.SETTLEMENT_PENDING],
        settled: statusCounts[CLAIM_STATUS.SETTLED],
        closed: statusCounts[CLAIM_STATUS.CLOSED],
        awaitingSettlement,
        flaggedClaims: flaggedCount,
        totalClaimedAmount,
        totalSettledAmount,
        activePolicies: activePoliciesCount,
        statusBreakdown: statusCounts,
        categoryDistribution,
        recentActivity: recentClaims
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getDashboardStats };

