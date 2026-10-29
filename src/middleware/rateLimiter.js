const rateLimit = require('express-rate-limit');
const { NODE_ENV } = require('../config/config');

// In test environment, allow high limits to avoid test flakiness
const isTest = NODE_ENV === 'test';

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isTest ? 1000 : 30, // 30 requests per 15 min per IP in prod
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isTest ? 5000 : 500, // 500 requests per 15 minutes
  message: {
    success: false,
    message: 'Rate limit exceeded. Please slow down your requests.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = { authLimiter, generalLimiter };

