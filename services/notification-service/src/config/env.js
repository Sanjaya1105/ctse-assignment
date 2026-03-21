const PORT = process.env.PORT || 4004;
const MONGODB_URI =
  process.env.MONGODB_URI ||
  'mongodb+srv://root:root@cluster0.gvnxmf3.mongodb.net/notification-service?retryWrites=true&w=majority';

module.exports = {
  PORT,
  MONGODB_URI,
};
