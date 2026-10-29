const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const claimRoutes = require('./claimRoutes');
const policyRoutes = require('./policyRoutes');
const documentRoutes = require('./documentRoutes');
const notificationRoutes = require('./notificationRoutes');
const auditRoutes = require('./auditRoutes');
const dashboardRoutes = require('./dashboardRoutes');
const adminRoutes = require('./adminRoutes');

// Mount individual domain routers
router.use('/auth', authRoutes);
router.use('/claims', claimRoutes);
router.use('/policies', policyRoutes);
router.use('/documents', documentRoutes);
router.use('/notifications', notificationRoutes);
router.use('/audit', auditRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/admin', adminRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Insurance Claim Automation API',
    mode: 'Demonstration / Educational Sandbox'
  });
});

module.exports = router;

