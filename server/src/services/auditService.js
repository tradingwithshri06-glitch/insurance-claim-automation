const AuditLog = require('../models/AuditLog');

/**
 * Creates an immutable audit log entry for sensitive domain events
 */
const recordAudit = async ({
  user = null,
  req = null,
  action,
  resourceType,
  resourceId,
  details = {}
}) => {
  try {
    const ipAddress =
      req?.headers?.['x-forwarded-for'] ||
      req?.socket?.remoteAddress ||
      '127.0.0.1';
    const userAgent = req?.headers?.['user-agent'] || 'System/Unknown';

    const logEntry = new AuditLog({
      userId: user?._id || user?.id || null,
      userEmail: user?.email || 'system@insurance.local',
      userRole: user?.role || 'SYSTEM',
      action,
      resourceType,
      resourceId: String(resourceId || ''),
      details,
      ipAddress,
      userAgent,
      timestamp: new Date()
    });

    await logEntry.save();
    return logEntry;
  } catch (err) {
    console.error('[AuditService] Failed to record audit log:', err.message);
    // Don't crash the main process if audit logging fails, but log the error
    return null;
  }
};

module.exports = { recordAudit };

