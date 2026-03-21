const PORT = process.env.PORT || 4003;
const MONGODB_URI =
  process.env.MONGODB_URI ||
  'mongodb+srv://root:root@cluster0.gvnxmf3.mongodb.net/tracking-service?retryWrites=true&w=majority';
const SHIPMENT_SERVICE_BASE =
  process.env.SHIPMENT_SERVICE_URL || 'http://localhost:4002';
const ACCOUNT_SERVICE_BASE =
  process.env.ACCOUNT_SERVICE_URL || 'http://localhost:4001';
const NOTIFICATION_SERVICE_BASE =
  process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:4004';

module.exports = {
  PORT,
  MONGODB_URI,
  SHIPMENT_SERVICE_BASE,
  ACCOUNT_SERVICE_BASE,
  NOTIFICATION_SERVICE_BASE,
};
