const express = require('express');
const router = express.Router();
const {
  getClaims,
  getClaimById,
  createClaim,
  updateClaimStatus,
  requestMissingInformation,
  flagFraudRisk,
  submitInvestigationFindings,
  decideClaim
} = require('../controllers/claimController');
const { updateSettlement } = require('../controllers/settlementController');
const {
  createClaimValidator,
  updateClaimStatusValidator,
  requestInformationValidator,
  fraudFlagValidator,
  investigationFindingsValidator,
  decisionValidator
} = require('../validators/claimValidators');
const { settlementValidator } = require('../validators/settlementValidators');
const { validateRequest } = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/role');
const { ROLES } = require('../config/config');

// List & view claims
router.get('/', authenticate, getClaims);
router.get('/:id', authenticate, getClaimById);

// Submit new claim (Policyholders, Administrator)
router.post(
  '/',
  authenticate,
  authorizeRoles(ROLES.POLICYHOLDER, ROLES.ADMINISTRATOR),
  createClaimValidator,
  validateRequest,
  createClaim
);

// Generic workflow status update
router.patch(
  '/:id/status',
  authenticate,
  updateClaimStatusValidator,
  validateRequest,
  updateClaimStatus
);

// Claims officer requests missing info/documents
router.post(
  '/:id/request-info',
  authenticate,
  authorizeRoles(ROLES.CLAIMS_OFFICER, ROLES.ADMINISTRATOR),
  requestInformationValidator,
  validateRequest,
  requestMissingInformation
);

// Flag claim for fraud risk investigation
router.post(
  '/:id/flag',
  authenticate,
  authorizeRoles(ROLES.CLAIMS_OFFICER, ROLES.INVESTIGATOR, ROLES.ADMINISTRATOR),
  fraudFlagValidator,
  validateRequest,
  flagFraudRisk
);

// Submit investigation findings
router.post(
  '/:id/findings',
  authenticate,
  authorizeRoles(ROLES.INVESTIGATOR, ROLES.ADMINISTRATOR),
  investigationFindingsValidator,
  validateRequest,
  submitInvestigationFindings
);

// Approver decides claim (Approve or Reject)
router.post(
  '/:id/decision',
  authenticate,
  authorizeRoles(ROLES.APPROVER, ROLES.ADMINISTRATOR),
  decisionValidator,
  validateRequest,
  decideClaim
);

// Finance staff updates settlement
router.patch(
  '/:id/settlement',
  authenticate,
  authorizeRoles(ROLES.FINANCE_STAFF, ROLES.ADMINISTRATOR),
  settlementValidator,
  validateRequest,
  updateSettlement
);

module.exports = router;

