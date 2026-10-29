const Notification = require('../models/Notification');
const User = require('../models/User');
const { ROLES } = require('../config/config');

/**
 * Creates a notification for a specific user
 */
const notifyUser = async ({
  recipientId,
  title,
  message,
  type = 'CLAIM_STATUS',
  relatedClaimId = null
}) => {
  try {
    if (!recipientId) return null;
    const notification = new Notification({
      recipient: recipientId,
      title,
      message,
      type,
      relatedClaimId
    });
    await notification.save();
    return notification;
  } catch (err) {
    console.error('[NotificationService] Failed to notify user:', err.message);
    return null;
  }
};

/**
 * Creates notifications for all users with a specific role
 */
const notifyRole = async ({
  role,
  title,
  message,
  type = 'CLAIM_STATUS',
  relatedClaimId = null
}) => {
  try {
    const users = await User.find({ role, status: 'Active' }).select('_id');
    const notifications = users.map((u) => ({
      recipient: u._id,
      title,
      message,
      type,
      relatedClaimId
    }));

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }
  } catch (err) {
    console.error(`[NotificationService] Failed to notify role ${role}:`, err.message);
  }
};

module.exports = { notifyUser, notifyRole };

