const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '..', '.env') });
const express = require('express');
const mongoose = require('mongoose');
const corsMiddleware = require('./src/middlewares/cors');
const accountRoutes = require('./src/routes/accountRoutes');
const { PORT, MONGODB_URI } = require('./src/config/env');

const app = express();

app.use(corsMiddleware);
app.use(express.json());
app.use('/', accountRoutes);

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`Account service listening on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Error connecting to MongoDB:', err);
    process.exit(1);
  });

