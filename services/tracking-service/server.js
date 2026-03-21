const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '..', '.env') });
const express = require('express');
const mongoose = require('mongoose');
const routes = require('./src/routes/trackingRoutes');
const { PORT, MONGODB_URI } = require('./src/config/env');

const app = express();

app.use(express.json());
app.use('/', routes);

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB (tracking-service)');
    app.listen(PORT, () => {
      console.log(`Tracking service listening on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Error connecting to MongoDB (tracking-service):', err);
    process.exit(1);
  });
