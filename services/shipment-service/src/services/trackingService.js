const { TRACKING_SERVICE_BASE } = require('../config/env');

async function createTrackingForCheck(checkId) {
  const res = await fetch(`${TRACKING_SERVICE_BASE}/trackings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ checkId: String(checkId) }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || `Tracking service HTTP ${res.status}`);
  }
  return data.tracking;
}

module.exports = {
  createTrackingForCheck,
};
