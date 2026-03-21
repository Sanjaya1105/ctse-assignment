const mongoose = require('mongoose');

const trackingSchema = new mongoose.Schema(
  {
    checkId: { type: String, index: true, sparse: true },
    shipmentId: { type: String, index: true, sparse: true },
    status: { type: String, default: 'created' },
  },
  { timestamps: true, collection: 'trackings' }
);

module.exports = mongoose.model('Tracking', trackingSchema);
