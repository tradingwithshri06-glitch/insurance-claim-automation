const express = require('express');
const router = express.Router();
const {
  getUsers,
  createUser,
  updateUserRole,
  getSystemSettings
} = require('../controllers/adminController');
const { authenticate } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/role');
const { ROLES } = require('../config/config');

// All admin routes require Administrator role
router.use(authenticate, authorizeRoles(ROLES.ADMINISTRATOR));

router.get('/users', getUsers);
router.post('/users', createUser);
router.patch('/users/:id/role', updateUserRole);
router.get('/settings', getSystemSettings);

module.exports = router;

