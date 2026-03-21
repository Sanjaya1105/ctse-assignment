const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '..', '.env') });
const express = require('express');
const mongoose = require('mongoose');
const notificationRoutes = require('./src/routes/notificationRoutes');
const { PORT, MONGODB_URI } = require('./src/config/env');

const app = express();

app.use(express.json());
app.use('/', notificationRoutes);

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB (notification-service)');
    app.listen(PORT, () => {
      console.log(`Notification service listening on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Error connecting to MongoDB (notification-service):', err);
    process.exit(1);
});

