const { CLAIM_STATUS, ROLES, SETTLEMENT_STATUS } = require('../config/config');

// Define transition rules and permitted roles
const ALLOWED_TRANSITIONS = {
  [CLAIM_STATUS.DRAFT]: {
    allowedNext: [CLAIM_STATUS.SUBMITTED],
    roles: [ROLES.POLICYHOLDER, ROLES.ADMINISTRATOR]
  },
  [CLAIM_STATUS.SUBMITTED]: {
    allowedNext: [CLAIM_STATUS.UNDER_REVIEW],
    roles: [ROLES.CLAIMS_OFFICER, ROLES.ADMINISTRATOR]
  },
  [CLAIM_STATUS.UNDER_REVIEW]: {
    allowedNext: [
      CLAIM_STATUS.NEEDS_CORRECTION,
      CLAIM_STATUS.UNDER_INVESTIGATION,
      CLAIM_STATUS.APPROVED,
      CLAIM_STATUS.REJECTED
    ],
    rolesByTarget: {
      [CLAIM_STATUS.NEEDS_CORRECTION]: [ROLES.CLAIMS_OFFICER, ROLES.ADMINISTRATOR],
      [CLAIM_STATUS.UNDER_INVESTIGATION]: [ROLES.CLAIMS_OFFICER, ROLES.ADMINISTRATOR],
      [CLAIM_STATUS.APPROVED]: [ROLES.APPROVER, ROLES.ADMINISTRATOR],
      [CLAIM_STATUS.REJECTED]: [ROLES.APPROVER, ROLES.ADMINISTRATOR]
    }
  },
  [CLAIM_STATUS.NEEDS_CORRECTION]: {
    allowedNext: [CLAIM_STATUS.UNDER_REVIEW],
    roles: [ROLES.POLICYHOLDER, ROLES.CLAIMS_OFFICER, ROLES.ADMINISTRATOR]
  },
  [CLAIM_STATUS.UNDER_INVESTIGATION]: {
    allowedNext: [CLAIM_STATUS.UNDER_REVIEW],
    roles: [ROLES.INVESTIGATOR, ROLES.ADMINISTRATOR]
  },
  [CLAIM_STATUS.APPROVED]: {
    allowedNext: [CLAIM_STATUS.SETTLEMENT_PENDING],
    roles: [ROLES.APPROVER, ROLES.FINANCE_STAFF, ROLES.ADMINISTRATOR]
  },
  [CLAIM_STATUS.SETTLEMENT_PENDING]: {
    allowedNext: [CLAIM_STATUS.SETTLED],
    roles: [ROLES.FINANCE_STAFF, ROLES.ADMINISTRATOR]
  },
  [CLAIM_STATUS.SETTLED]: {
    allowedNext: [CLAIM_STATUS.CLOSED],
    roles: [ROLES.FINANCE_STAFF, ROLES.CLAIMS_OFFICER, ROLES.ADMINISTRATOR]
  },
  [CLAIM_STATUS.REJECTED]: {
    allowedNext: [CLAIM_STATUS.CLOSED],
    roles: [ROLES.CLAIMS_OFFICER, ROLES.ADMINISTRATOR]
  },
  [CLAIM_STATUS.CLOSED]: {
    allowedNext: [],
    roles: []
  }
};

/**
 * Validates whether a status transition is permitted for a given user role
 */
const validateTransition = (currentStatus, targetStatus, userRole) => {
  if (currentStatus === targetStatus) {
    return {
      allowed: false,
      reason: `Claim is already in status '${currentStatus}'.`
    };
  }

  const rule = ALLOWED_TRANSITIONS[currentStatus];
  if (!rule || !rule.allowedNext.includes(targetStatus)) {
    return {
      allowed: false,
      reason: `Invalid transition: cannot move claim from '${currentStatus}' to '${targetStatus}'.`
    };
  }

  let permittedRoles = rule.roles;
  if (rule.rolesByTarget && rule.rolesByTarget[targetStatus]) {
    permittedRoles = rule.rolesByTarget[targetStatus];
  }

  if (!permittedRoles || !permittedRoles.includes(userRole)) {
    return {
      allowed: false,
      reason: `Role '${userRole}' is not authorized to transition claim from '${currentStatus}' to '${targetStatus}'.`
    };
  }

  return { allowed: true };
};

/**
 * Apply transition and append to timeline
 */
const applyTransition = ({ claim, targetStatus, user, actionName, comment = '' }) => {
  const previousStatus = claim.status;
  claim.status = targetStatus;

  claim.timeline.push({
    status: targetStatus,
    changedBy: user._id,
    action: actionName || `Transitioned from ${previousStatus} to ${targetStatus}`,
    comment: comment || '',
    timestamp: new Date()
  });

  return {
    previousStatus,
    newStatus: targetStatus
  };
};

module.exports = {
  ALLOWED_TRANSITIONS,
  validateTransition,
  applyTransition
};

