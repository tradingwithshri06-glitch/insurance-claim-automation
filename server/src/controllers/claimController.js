const Claim = require('../models/Claim');
const Policy = require('../models/Policy');
const { ROLES, CLAIM_STATUS, SETTLEMENT_STATUS } = require('../config/config');
const { validateTransition, applyTransition } = require('../services/claimWorkflowService');
const { recordAudit } = require('../services/auditService');
const { notifyUser, notifyRole } = require('../services/notificationService');

/**
 * Generate a unique claim reference code
 */
const generateClaimReference = () => {
  const year = new Date().getFullYear();
  const randomNum = Math.floor(100000 + Math.random() * 900000);
  return `CLM-${year}-${randomNum}`;
};

/**
 * Get claims with search, filtering, and pagination
 */
const getClaims = async (req, res, next) => {
  try {
    const { status, category, search, startDate, endDate, page = 1, limit = 10 } = req.query;

    const filter = {};

    // Policyholders can strictly ONLY access their own claims
    if (req.user.role === ROLES.POLICYHOLDER) {
      filter.policyholderId = req.user._id;
    }

    if (status && status !== 'ALL') {
      filter.status = status;
    }

    if (category && category !== 'ALL') {
      filter.category = category;
    }

    if (startDate || endDate) {
      filter.incidentDate = {};
      if (startDate) filter.incidentDate.$gte = new Date(startDate);
      if (endDate) filter.incidentDate.$lte = new Date(endDate);
    }

    if (search) {
      filter.$or = [
        { claimReference: { $regex: search, $options: 'i' } },
        { incidentLocation: { $regex: search, $options: 'i' } },
        { incidentDescription: { $regex: search, $options: 'i' } }
      ];
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const skip = (pageNum - 1) * limitNum;

    const total = await Claim.countDocuments(filter);
    const claims = await Claim.find(filter)
      .populate('policyId', 'policyNumber planName vehicleDetails maxCoverageLimit')
      .populate('policyholderId', 'fullName email phone')
      .populate('assignedOfficer', 'fullName email')
      .populate('assignedInvestigator', 'fullName email')
      .populate('decidedBy', 'fullName email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    return res.status(200).json({
      success: true,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      claims
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single claim by ID with strict ownership/authorization enforcement
 */
const getClaimById = async (req, res, next) => {
  try {
    const claim = await Claim.findById(req.params.id)
      .populate('policyId')
      .populate('policyholderId', 'fullName email phone address')
      .populate('assignedOfficer', 'fullName email')
      .populate('assignedInvestigator', 'fullName email')
      .populate('decidedBy', 'fullName email role')
      .populate('settlementDetails.updatedBy', 'fullName email')
      .populate('timeline.changedBy', 'fullName email role');

    if (!claim) {
      return res.status(404).json({
        success: false,
        message: 'Claim record not found.'
      });
    }

    // Role-based privacy rule: policyholder can only view their own claim
    if (
      req.user.role === ROLES.POLICYHOLDER &&
      claim.policyholderId._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: you do not have permission to view another user’s claim.'
      });
    }

    return res.status(200).json({
      success: true,
      claim
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Submit a new claim (Policyholder)
 */
const createClaim = async (req, res, next) => {
  try {
    const {
      policyId,
      category,
      incidentDate,
      incidentLocation,
      incidentDescription,
      claimedAmount
    } = req.body;

    // Validate policy belongs to policyholder
    const policy = await Policy.findById(policyId);
    if (!policy) {
      return res.status(404).json({
        success: false,
        message: 'The selected policy does not exist.'
      });
    }

    if (
      req.user.role === ROLES.POLICYHOLDER &&
      policy.policyholderId.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'You cannot submit a claim against a policy that does not belong to you.'
      });
    }

    if (policy.status !== 'Active') {
      return res.status(400).json({
        success: false,
        message: `Cannot submit claim: Policy is currently '${policy.status}'.`
      });
    }

    const claimReference = generateClaimReference();

    const claim = new Claim({
      claimReference,
      policyId: policy._id,
      policyholderId: req.user._id,
      category: category || policy.category || 'Motor Insurance',
      incidentDate: new Date(incidentDate),
      incidentLocation,
      incidentDescription,
      claimedAmount: parseFloat(claimedAmount),
      status: CLAIM_STATUS.SUBMITTED,
      isDemo: true,
      timeline: [
        {
          status: CLAIM_STATUS.SUBMITTED,
          changedBy: req.user._id,
          action: 'Claim Submitted by Policyholder',
          comment: 'Initial claim submission with incident description and estimated loss.',
          timestamp: new Date()
        }
      ]
    });

    await claim.save();

    await recordAudit({
      user: req.user,
      req,
      action: 'CLAIM_SUBMISSION',
      resourceType: 'Claim',
      resourceId: claim._id,
      details: {
        claimReference: claim.claimReference,
        claimedAmount: claim.claimedAmount,
        policyNumber: policy.policyNumber
      }
    });

    // Notify Claims Officers of new submission
    await notifyRole({
      role: ROLES.CLAIMS_OFFICER,
      title: 'New Claim Submitted',
      message: `Claim ${claim.claimReference} has been submitted and is awaiting review.`,
      type: 'CLAIM_STATUS',
      relatedClaimId: claim._id
    });

    return res.status(201).json({
      success: true,
      message: 'Claim submitted successfully.',
      claim
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Generic status transition handler adhering strictly to allowed workflow transitions
 */
const updateClaimStatus = async (req, res, next) => {
  try {
    const { status: targetStatus, comment } = req.body;
    const claim = await Claim.findById(req.params.id);

    if (!claim) {
      return res.status(404).json({
        success: false,
        message: 'Claim not found.'
      });
    }

    // Authorization check
    if (
      req.user.role === ROLES.POLICYHOLDER &&
      claim.policyholderId.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: You cannot modify another user’s claim.'
      });
    }

    // Validate workflow transition
    const validation = validateTransition(claim.status, targetStatus, req.user.role);
    if (!validation.allowed) {
      return res.status(400).json({
        success: false,
        message: validation.reason
      });
    }

    const { previousStatus, newStatus } = applyTransition({
      claim,
      targetStatus,
      user: req.user,
      actionName: `Status changed to ${targetStatus}`,
      comment: comment || ''
    });

    // If starting review, assign officer if unassigned
    if (targetStatus === CLAIM_STATUS.UNDER_REVIEW && !claim.assignedOfficer) {
      if (req.user.role === ROLES.CLAIMS_OFFICER) {
        claim.assignedOfficer = req.user._id;
      }
    }

    await claim.save();

    await recordAudit({
      user: req.user,
      req,
      action: 'CLAIM_STATUS_TRANSITION',
      resourceType: 'Claim',
      resourceId: claim._id,
      details: { previousStatus, newStatus, comment }
    });

    // Notify policyholder of status change
    await notifyUser({
      recipientId: claim.policyholderId,
      title: `Claim Status Updated: ${newStatus}`,
      message: `Your claim ${claim.claimReference} status changed from ${previousStatus} to ${newStatus}.${
        comment ? ` Note: ${comment}` : ''
      }`,
      type: 'CLAIM_STATUS',
      relatedClaimId: claim._id
    });

    return res.status(200).json({
      success: true,
      message: `Claim transitioned to ${newStatus}.`,
      claim
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Claims officer requests missing information or documents
 */
const requestMissingInformation = async (req, res, next) => {
  try {
    const { missingInfoRequested } = req.body;
    const claim = await Claim.findById(req.params.id);

    if (!claim) {
      return res.status(404).json({
        success: false,
        message: 'Claim not found.'
      });
    }

    if (claim.status !== CLAIM_STATUS.UNDER_REVIEW) {
      return res.status(400).json({
        success: false,
        message: `Missing information can only be requested when claim is 'Under Review'. Current status is '${claim.status}'.`
      });
    }

    claim.missingInfoRequested = missingInfoRequested;
    applyTransition({
      claim,
      targetStatus: CLAIM_STATUS.NEEDS_CORRECTION,
      user: req.user,
      actionName: 'Information Requested by Claims Officer',
      comment: missingInfoRequested
    });

    await claim.save();

    await recordAudit({
      user: req.user,
      req,
      action: 'MISSING_INFO_REQUESTED',
      resourceType: 'Claim',
      resourceId: claim._id,
      details: { requestedDetails: missingInfoRequested }
    });

    await notifyUser({
      recipientId: claim.policyholderId,
      title: 'Action Required: Additional Information Requested',
      message: `Your claim ${claim.claimReference} requires additional details or documents: ${missingInfoRequested}`,
      type: 'DOCUMENT_REQUEST',
      relatedClaimId: claim._id
    });

    return res.status(200).json({
      success: true,
      message: 'Request for missing information sent to policyholder.',
      claim
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Flag claim for fraud risk review (does not auto-reject)
 */
const flagFraudRisk = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const claim = await Claim.findById(req.params.id);

    if (!claim) {
      return res.status(404).json({
        success: false,
        message: 'Claim not found.'
      });
    }

    if (claim.status !== CLAIM_STATUS.UNDER_REVIEW) {
      return res.status(400).json({
        success: false,
        message: `Fraud risk flags can only be raised when claim is 'Under Review'. Current status: '${claim.status}'.`
      });
    }

    claim.fraudRiskFlag = {
      isFlagged: true,
      reason,
      flaggedBy: req.user._id,
      flaggedAt: new Date(),
      findings: '',
      clearedAt: null,
      clearedBy: null
    };

    applyTransition({
      claim,
      targetStatus: CLAIM_STATUS.UNDER_INVESTIGATION,
      user: req.user,
      actionName: 'Claim Flagged for Risk Investigation',
      comment: `Flagged for investigation: ${reason}`
    });

    await claim.save();

    await recordAudit({
      user: req.user,
      req,
      action: 'FRAUD_RISK_FLAGGED',
      resourceType: 'Claim',
      resourceId: claim._id,
      details: { reason }
    });

    // Notify investigators
    await notifyRole({
      role: ROLES.INVESTIGATOR,
      title: 'New Investigation Assignment',
      message: `Claim ${claim.claimReference} has been flagged for investigation: ${reason}`,
      type: 'INVESTIGATION',
      relatedClaimId: claim._id
    });

    return res.status(200).json({
      success: true,
      message: 'Claim flagged and forwarded to the investigator workspace.',
      claim
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Record investigator findings and route claim back for review
 */
const submitInvestigationFindings = async (req, res, next) => {
  try {
    const { findings, clearFlag } = req.body;
    const claim = await Claim.findById(req.params.id);

    if (!claim) {
      return res.status(404).json({
        success: false,
        message: 'Claim not found.'
      });
    }

    if (claim.status !== CLAIM_STATUS.UNDER_INVESTIGATION) {
      return res.status(400).json({
        success: false,
        message: `Investigation findings can only be recorded when claim is 'Under Investigation'. Current: '${claim.status}'.`
      });
    }

    claim.assignedInvestigator = req.user._id;
    claim.fraudRiskFlag.findings = findings;

    if (clearFlag === true || clearFlag === 'true') {
      claim.fraudRiskFlag.isFlagged = false;
      claim.fraudRiskFlag.clearedAt = new Date();
      claim.fraudRiskFlag.clearedBy = req.user._id;
    }

    applyTransition({
      claim,
      targetStatus: CLAIM_STATUS.UNDER_REVIEW,
      user: req.user,
      actionName: 'Investigation Completed & Findings Recorded',
      comment: `Findings: ${findings}${clearFlag ? ' (Risk flag cleared)' : ' (Risk flag upheld)'}`
    });

    await claim.save();

    await recordAudit({
      user: req.user,
      req,
      action: 'INVESTIGATION_FINDINGS_SUBMITTED',
      resourceType: 'Claim',
      resourceId: claim._id,
      details: { findings, cleared: Boolean(clearFlag) }
    });

    await notifyRole({
      role: ROLES.APPROVER,
      title: 'Investigation Completed',
      message: `Investigation findings submitted for claim ${claim.claimReference}. Claim returned to Under Review.`,
      type: 'INVESTIGATION',
      relatedClaimId: claim._id
    });

    return res.status(200).json({
      success: true,
      message: 'Investigation findings recorded successfully. Claim returned to Under Review.',
      claim
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Approver decision: Approve or Reject
 */
const decideClaim = async (req, res, next) => {
  try {
    const { decision, decisionReason, approvedAmount } = req.body;
    const claim = await Claim.findById(req.params.id);

    if (!claim) {
      return res.status(404).json({
        success: false,
        message: 'Claim not found.'
      });
    }

    if (claim.status !== CLAIM_STATUS.UNDER_REVIEW) {
      return res.status(400).json({
        success: false,
        message: `Claims can only be approved or rejected from 'Under Review' status. Current status is '${claim.status}'.`
      });
    }

    claim.decidedBy = req.user._id;
    claim.decidedAt = new Date();
    claim.decisionReason = decisionReason;

    if (decision === 'APPROVE') {
      const amount = parseFloat(approvedAmount);
      if (isNaN(amount) || amount <= 0) {
        return res.status(400).json({
          success: false,
          message: 'A valid approved amount greater than 0 is required.'
        });
      }

      claim.approvedAmount = amount;
      claim.settlementDetails.status = SETTLEMENT_STATUS.PENDING;

      // Transition to Approved, then advance to Settlement Pending
      applyTransition({
        claim,
        targetStatus: CLAIM_STATUS.APPROVED,
        user: req.user,
        actionName: 'Claim Approved by Approver',
        comment: `Approved for ${claim.currency} ${amount}. Reason: ${decisionReason}`
      });

      applyTransition({
        claim,
        targetStatus: CLAIM_STATUS.SETTLEMENT_PENDING,
        user: req.user,
        actionName: 'Queued for Settlement',
        comment: 'Forwarded to Finance Staff for payout settlement.'
      });

      await claim.save();

      await recordAudit({
        user: req.user,
        req,
        action: 'CLAIM_APPROVAL',
        resourceType: 'Claim',
        resourceId: claim._id,
        details: { approvedAmount: amount, decisionReason }
      });

      // Notify policyholder and finance staff
      await notifyUser({
        recipientId: claim.policyholderId,
        title: 'Claim Approved!',
        message: `Your claim ${claim.claimReference} has been approved for ${claim.currency} ${amount}. Settlement is now pending.`,
        type: 'APPROVAL',
        relatedClaimId: claim._id
      });

      await notifyRole({
        role: ROLES.FINANCE_STAFF,
        title: 'New Claim Awaiting Settlement',
        message: `Claim ${claim.claimReference} approved for ${claim.currency} ${amount} is ready for disbursement.`,
        type: 'SETTLEMENT',
        relatedClaimId: claim._id
      });

      return res.status(200).json({
        success: true,
        message: `Claim successfully approved for ${claim.currency} ${amount} and queued for settlement.`,
        claim
      });
    } else if (decision === 'REJECT') {
      applyTransition({
        claim,
        targetStatus: CLAIM_STATUS.REJECTED,
        user: req.user,
        actionName: 'Claim Rejected by Approver',
        comment: `Reason for rejection: ${decisionReason}`
      });

      await claim.save();

      await recordAudit({
        user: req.user,
        req,
        action: 'CLAIM_REJECTION',
        resourceType: 'Claim',
        resourceId: claim._id,
        details: { decisionReason }
      });

      await notifyUser({
        recipientId: claim.policyholderId,
        title: 'Claim Decision: Rejected',
        message: `Your claim ${claim.claimReference} was rejected. Reason: ${decisionReason}`,
        type: 'APPROVAL',
        relatedClaimId: claim._id
      });

      return res.status(200).json({
        success: true,
        message: 'Claim has been rejected.',
        claim
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "Decision must be 'APPROVE' or 'REJECT'."
      });
    }
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getClaims,
  getClaimById,
  createClaim,
  updateClaimStatus,
  requestMissingInformation,
  flagFraudRisk,
  submitInvestigationFindings,
  decideClaim
};

