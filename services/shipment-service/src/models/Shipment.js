const mongoose = require('mongoose');

const shipmentSchema = new mongoose.Schema(
  {
    accountId: { type: String, required: true },
    origin: { type: String, required: true },
    destination: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Shipment', shipmentSchema);
