const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

const PORT = process.env.PORT || 3000;
const ACCOUNT_SERVICE_URL =
  process.env.ACCOUNT_SERVICE_URL || 'http://localhost:4001';
const SHIPMENT_SERVICE_URL =
  process.env.SHIPMENT_SERVICE_URL || 'http://localhost:4002';
const TRACKING_SERVICE_URL =
  process.env.TRACKING_SERVICE_URL || 'http://localhost:4003';
const NOTIFICATION_SERVICE_URL =
  process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:4004';

// CORS for frontend dev server (e.g. http://localhost:5173)
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

// Proxies to microservices (defined before static so /account,/shipment,...
// are always forwarded to the services, not served as files)
app.use(
  '/account',
  createProxyMiddleware({
    target: ACCOUNT_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: { '^/account(?=/|$)': '' },
  })
);

app.use(
  '/shipment',
  createProxyMiddleware({
    target: SHIPMENT_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: { '^/shipment(?=/|$)': '' },
  })
);

app.use(
  '/tracking',
  createProxyMiddleware({
    target: TRACKING_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: { '^/tracking(?=/|$)': '' },
  })
);

app.use(
  '/notification',
  createProxyMiddleware({
    target: NOTIFICATION_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: { '^/notification(?=/|$)': '' },
  })
);

// Static frontend (served from built React app in /frontend/dist)
const frontendPath = path.join(__dirname, '..', 'frontend', 'dist');
app.use(express.static(frontendPath));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'api-gateway' });
});

app.listen(PORT, () => {
  console.log(`API Gateway listening on port ${PORT}`);
});


