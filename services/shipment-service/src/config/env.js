const PORT = process.env.PORT || 4002;
const MONGODB_URI =
  process.env.MONGODB_URI ||
  'mongodb+srv://root:root@cluster0.gvnxmf3.mongodb.net/shipment-service?retryWrites=true&w=majority';
const ACCOUNT_SERVICE_BASE =
  process.env.ACCOUNT_SERVICE_URL || 'http://localhost:4001';
const TRACKING_SERVICE_BASE =
  process.env.TRACKING_SERVICE_URL || 'http://localhost:4003';

module.exports = {
  PORT,
  MONGODB_URI,
  ACCOUNT_SERVICE_BASE,
  TRACKING_SERVICE_BASE,
};
