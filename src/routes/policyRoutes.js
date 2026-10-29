const express = require('express');
const router = express.Router();
const { getPolicies, getPolicyById, createPolicy } = require('../controllers/policyController');
const { authenticate } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/role');
const { ROLES } = require('../config/config');

router.get('/', authenticate, getPolicies);
router.get('/:id', authenticate, getPolicyById);
router.post('/', authenticate, authorizeRoles(ROLES.ADMINISTRATOR, ROLES.CLAIMS_OFFICER), createPolicy);

module.exports = router;

