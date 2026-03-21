const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    accountId: { type: String, required: true, index: true },
    message: { type: String, required: true },
    read: { type: Boolean, default: false },
  },
  { timestamps: true, collection: 'notifications' }
);

module.exports = mongoose.model('Notification', notificationSchema);
