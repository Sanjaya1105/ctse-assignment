const mongoose = require('mongoose');

const checkSchema = new mongoose.Schema(
  {
    accountId: { type: String, required: true, index: true },
    category: { type: String, required: true },
    location: { type: String, required: true },
  },
  { timestamps: true, collection: 'checks' }
);

module.exports = mongoose.model('Check', checkSchema);
