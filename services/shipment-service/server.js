const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '..', '.env') });
const express = require('express');
const mongoose = require('mongoose');
const corsMiddleware = require('./src/middlewares/cors');
const routes = require('./src/routes/shipmentRoutes');
const { PORT, MONGODB_URI } = require('./src/config/env');

const app = express();

app.use(corsMiddleware);
app.use(express.json());
app.use('/', routes);

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB (shipment-service)');
    app.listen(PORT, () => {
      console.log(`Shipment service listening on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Error connecting to MongoDB (shipment-service):', err);
    process.exit(1);
  });

