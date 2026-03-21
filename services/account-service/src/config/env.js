const PORT = process.env.PORT || 4001;
const MONGODB_URI =
  process.env.MONGODB_URI ||
  'mongodb+srv://root:root@cluster0.gvnxmf3.mongodb.net/serve1?retryWrites=true&w=majority';

const ADMIN_EMAIL = 'admin@gmail.com';
const ADMIN_PASSWORD = 'Admin@123';

const SHIPMENT_SERVICE_URL =
  process.env.SHIPMENT_SERVICE_URL || 'http://localhost:4002';
const TRACKING_SERVICE_URL =
  process.env.TRACKING_SERVICE_URL || 'http://localhost:4003';

module.exports = {
  PORT,
  MONGODB_URI,
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
  SHIPMENT_SERVICE_URL,
  TRACKING_SERVICE_URL,
};
