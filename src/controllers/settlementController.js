const Claim = require('../models/Claim');
const { CLAIM_STATUS, SETTLEMENT_STATUS } = require('../config/config');
const { recordAudit } = require('../services/auditService');
const { notifyUser } = require('../services/notificationService');

/**
 * Update settlement details (Finance Staff / Admin)
 * Strictly enforces that claim must have been approved prior to settlement.
 */
const updateSettlement = async (req, res, next) => {
  try {
    const { status, transactionReference, paymentMethod, failureReason } = req.body;
    const claim = await Claim.findById(req.params.id);

    if (!claim) {
      return res.status(404).json({
        success: false,
        message: 'Claim not found.'
      });
    }

    // Business rule: Claim cannot be settled before approval!
    const validPreSettlementStatuses = [
      CLAIM_STATUS.APPROVED,
      CLAIM_STATUS.SETTLEMENT_PENDING,
      CLAIM_STATUS.SETTLED
    ];

    if (!validPreSettlementStatuses.includes(claim.status)) {
      return res.status(400).json({
        success: false,
        message: `A claim cannot be settled before approval. Current claim status is '${claim.status}'.`
      });
    }

    const previousSettlementStatus = claim.settlementDetails.status;

    claim.settlementDetails.status = status;
    claim.settlementDetails.updatedBy = req.user._id;
    claim.settlementDetails.updatedAt = new Date();

    if (transactionReference) {
      claim.settlementDetails.transactionReference = transactionReference;
    }

    if (paymentMethod) {
      claim.settlementDetails.paymentMethod = paymentMethod;
    }

    if (status === SETTLEMENT_STATUS.PAID) {
      claim.settlementDetails.paymentDate = new Date();
      claim.settlementDetails.failureReason = '';

      // Advance claim status to Settled
      claim.status = CLAIM_STATUS.SETTLED;
      claim.timeline.push({
        status: CLAIM_STATUS.SETTLED,
        changedBy: req.user._id,
        action: 'Settlement Disbursed',
        comment: `Simulated payment disbursed via ${claim.settlementDetails.paymentMethod}. Ref: ${claim.settlementDetails.transactionReference}`,
        timestamp: new Date()
      });
    } else if (status === SETTLEMENT_STATUS.FAILED) {
      claim.settlementDetails.failureReason = failureReason || 'Disbursement could not be processed.';
      claim.timeline.push({
        status: claim.status,
        changedBy: req.user._id,
        action: 'Settlement Failed',
        comment: `Settlement processing failed: ${claim.settlementDetails.failureReason}`,
        timestamp: new Date()
      });
    } else if (status === SETTLEMENT_STATUS.PROCESSING) {
      claim.timeline.push({
        status: claim.status,
        changedBy: req.user._id,
        action: 'Settlement Processing Initiated',
        comment: 'Finance staff has initiated disbursement processing.',
        timestamp: new Date()
      });
    }

    await claim.save();

    await recordAudit({
      user: req.user,
      req,
      action: 'SETTLEMENT_UPDATE',
      resourceType: 'Settlement',
      resourceId: claim._id,
      details: {
        previousSettlementStatus,
        newSettlementStatus: status,
        transactionReference: claim.settlementDetails.transactionReference,
        failureReason: claim.settlementDetails.failureReason
      }
    });

    await notifyUser({
      recipientId: claim.policyholderId,
      title: `Settlement Update: ${status}`,
      message: `The settlement status for your claim ${claim.claimReference} has been updated to '${status}'.${
        status === SETTLEMENT_STATUS.PAID
          ? ` Transaction Ref: ${claim.settlementDetails.transactionReference}`
          : ''
      }`,
      type: 'SETTLEMENT',
      relatedClaimId: claim._id
    });

    return res.status(200).json({
      success: true,
      message: `Settlement status updated to '${status}'.`,
      claim
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { updateSettlement };

