const { body } = require('express-validator');
const { SETTLEMENT_STATUS } = require('../config/config');

const settlementValidator = [
  body('status')
    .notEmpty()
    .withMessage('Settlement status is required')
    .isIn(Object.values(SETTLEMENT_STATUS))
    .withMessage('Invalid settlement status specified'),
  body('transactionReference')
    .if(body('status').equals(SETTLEMENT_STATUS.PAID))
    .trim()
    .notEmpty()
    .withMessage('Transaction reference is required when marking settlement as Paid'),
  body('paymentMethod')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Payment method cannot be empty when provided'),
  body('failureReason')
    .if(body('status').equals(SETTLEMENT_STATUS.FAILED))
    .trim()
    .notEmpty()
    .withMessage('Failure reason is required when marking settlement as Failed')
];

module.exports = { settlementValidator };

