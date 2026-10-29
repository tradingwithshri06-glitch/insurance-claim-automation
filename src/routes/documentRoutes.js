const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const {
  uploadDocument,
  getClaimDocuments,
  downloadDocument,
  verifyDocument
} = require('../controllers/documentController');
const { authenticate } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/role');
const { ROLES } = require('../config/config');

// Upload document (authenticated, attached to claim)
router.post('/upload', authenticate, upload.single('file'), uploadDocument);

// Get documents for claim
router.get('/claim/:claimId', authenticate, getClaimDocuments);

// Download / stream document securely
router.get('/:id/download', authenticate, downloadDocument);

// Verify document
router.patch(
  '/:id/verify',
  authenticate,
  authorizeRoles(ROLES.CLAIMS_OFFICER, ROLES.ADMINISTRATOR),
  verifyDocument
);

module.exports = router;

