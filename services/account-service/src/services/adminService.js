const {
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
  SHIPMENT_SERVICE_URL,
  TRACKING_SERVICE_URL,
} = require('../config/env');

function isAdminCredentials(email, password) {
  return (
    String(email || '').trim().toLowerCase() === ADMIN_EMAIL.toLowerCase() &&
    String(password || '') === ADMIN_PASSWORD
  );
}

async function getServiceHealth(url) {
  try {
    const res = await fetch(`${url}/health`);
    if (!res.ok) {
      return { error: true, status: res.status };
    }
    return await res.json();
  } catch (e) {
    return { error: true, message: e.message };
  }
}

async function getAdminOverview(users) {
  const userList = users.map((u) => ({
    id: u._id,
    name: u.name,
    email: u.email,
  }));

  const [shipmentHealth, trackingHealth] = await Promise.all([
    getServiceHealth(SHIPMENT_SERVICE_URL),
    getServiceHealth(TRACKING_SERVICE_URL),
  ]);

  return {
    userCount: userList.length,
    users: userList,
    services: {
      shipment: shipmentHealth,
      tracking: trackingHealth,
    },
  };
}

module.exports = {
  isAdminCredentials,
  getAdminOverview,
};
