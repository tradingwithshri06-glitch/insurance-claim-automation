const express = require('express');
const router = express.Router();
const { getAuditLogs } = require('../controllers/auditController');
const { authenticate } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/role');
const { ROLES } = require('../config/config');

// Audit logs are accessible to Administrators (and compliance/auditors)
router.get('/', authenticate, authorizeRoles(ROLES.ADMINISTRATOR), getAuditLogs);

module.exports = router;

