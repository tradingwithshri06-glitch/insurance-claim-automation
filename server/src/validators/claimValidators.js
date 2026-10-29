const { body } = require('express-validator');
const { CLAIM_STATUS, CLAIM_CATEGORIES } = require('../config/config');

const createClaimValidator = [
  body('policyId')
    .notEmpty()
    .withMessage('A valid policy ID must be selected')
    .isMongoId()
    .withMessage('Policy ID is not a valid identifier'),
  body('incidentDate')
    .notEmpty()
    .withMessage('Incident date is required')
    .isISO8601()
    .withMessage('Incident date must be a valid date format')
    .custom((val) => {
      if (new Date(val) > new Date()) {
        throw new Error('Incident date cannot be in the future');
      }
      return true;
    }),
  body('incidentLocation')
    .trim()
    .notEmpty()
    .withMessage('Incident location is required')
    .isLength({ min: 3, max: 200 })
    .withMessage('Incident location must be between 3 and 200 characters'),
  body('incidentDescription')
    .trim()
    .notEmpty()
    .withMessage('Incident description is required')
    .isLength({ min: 10, max: 2000 })
    .withMessage('Incident description must be at least 10 characters long'),
  body('claimedAmount')
    .notEmpty()
    .withMessage('Claimed amount is required')
    .isFloat({ min: 1 })
    .withMessage('Claimed amount must be a positive number greater than 0'),
  body('category')
    .optional()
    .isIn(Object.values(CLAIM_CATEGORIES))
    .withMessage('Category must be a supported insurance category')
];

const updateClaimStatusValidator = [
  body('status')
    .notEmpty()
    .withMessage('Target status is required')
    .isIn(Object.values(CLAIM_STATUS))
    .withMessage('Invalid target status specified'),
  body('comment')
    .optional()
    .trim()
];

const requestInformationValidator = [
  body('missingInfoRequested')
    .trim()
    .notEmpty()
    .withMessage('Explanation of requested documents or clarification is required')
    .isLength({ min: 5, max: 1000 })
    .withMessage('Request note must be between 5 and 1000 characters')
];

const decisionValidator = [
  body('decision')
    .notEmpty()
    .withMessage('Decision type is required')
    .isIn(['APPROVE', 'REJECT'])
    .withMessage("Decision must be either 'APPROVE' or 'REJECT'"),
  body('decisionReason')
    .trim()
    .notEmpty()
    .withMessage('A detailed decision reason is required')
    .isLength({ min: 5, max: 1000 })
    .withMessage('Decision reason must be between 5 and 1000 characters'),
  body('approvedAmount')
    .if(body('decision').equals('APPROVE'))
    .notEmpty()
    .withMessage('Approved amount is required when approving a claim')
    .isFloat({ min: 0 })
    .withMessage('Approved amount must be zero or a positive number')
];

const fraudFlagValidator = [
  body('reason')
    .trim()
    .notEmpty()
    .withMessage('Reason for raising fraud risk flag is required')
    .isLength({ min: 5, max: 1000 })
    .withMessage('Reason must be between 5 and 1000 characters')
];

const investigationFindingsValidator = [
  body('findings')
    .trim()
    .notEmpty()
    .withMessage('Investigation findings and conclusions are required')
    .isLength({ min: 10, max: 2000 })
    .withMessage('Findings must be between 10 and 2000 characters')
];

module.exports = {
  createClaimValidator,
  updateClaimStatusValidator,
  requestInformationValidator,
  decisionValidator,
  fraudFlagValidator,
  investigationFindingsValidator
};

