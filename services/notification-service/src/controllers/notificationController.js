const Notification = require('../models/Notification');

function health(req, res) {
  res.json({ status: 'ok', service: 'notification-service' });
}

async function createNotification(req, res) {
  const { accountId, message } = req.body || {};
  if (!accountId || !message) {
    return res
      .status(400)
      .json({ message: 'accountId and message are required' });
  }

  try {
    const notification = await Notification.create({
      accountId: String(accountId).trim(),
      message: String(message).trim(),
      read: false,
    });
    return res.status(201).json({
      message: 'Notification created successfully',
      notification,
    });
  } catch (err) {
    console.error('Error creating notification:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

async function listNotifications(req, res) {
  const accountId = String(req.query.accountId || '').trim();
  if (!accountId) {
    return res.status(400).json({ message: 'accountId is required' });
  }

  try {
    const notifications = await Notification.find({ accountId })
      .sort({ createdAt: -1 })
      .lean();
    return res.json({ notifications });
  } catch (err) {
    console.error('Error listing notifications:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

module.exports = {
  health,
  createNotification,
  listNotifications,
};
