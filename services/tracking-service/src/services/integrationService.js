const {
  SHIPMENT_SERVICE_BASE,
  ACCOUNT_SERVICE_BASE,
  NOTIFICATION_SERVICE_BASE,
} = require('../config/env');

async function verifyAccount(accountId) {
  if (!accountId) {
    return { ok: false, status: 400, message: 'accountId is required' };
  }
  try {
    const res = await fetch(
      `${ACCOUNT_SERVICE_BASE}/users/${encodeURIComponent(String(accountId))}`
    );
    if (res.status === 404) {
      return { ok: false, status: 404, message: 'Account not found' };
    }
    if (!res.ok) {
      return { ok: false, status: 502, message: 'Account service error' };
    }
    await res.json();
    return { ok: true };
  } catch (err) {
    console.error('verifyAccount (tracking) failed:', err);
    return {
      ok: false,
      status: 502,
      message: 'Could not reach account service',
    };
  }
}

async function getShipmentsByAccount(accountId) {
  const shipRes = await fetch(
    `${SHIPMENT_SERVICE_BASE}/shipments?accountId=${encodeURIComponent(accountId)}`
  );
  const shipData = await shipRes.json().catch(() => ({}));
  if (!shipRes.ok) {
    const err = new Error(shipData.message || 'Failed to load shipments');
    err.status = shipRes.status;
    throw err;
  }
  return Array.isArray(shipData.shipments) ? shipData.shipments : [];
}

async function getChecksByAccount(accountId) {
  const res = await fetch(
    `${SHIPMENT_SERVICE_BASE}/checks?accountId=${encodeURIComponent(accountId)}`
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.message || 'Failed to load checks');
    err.status = res.status;
    throw err;
  }
  return Array.isArray(data.checks) ? data.checks : [];
}

async function lookupChecksByIds(ids) {
  if (!Array.isArray(ids) || ids.length === 0) return [];
  const res = await fetch(
    `${SHIPMENT_SERVICE_BASE}/checks/lookup?ids=${encodeURIComponent(ids.join(','))}`
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.message || 'Failed to lookup checks');
    err.status = res.status;
    throw err;
  }
  return Array.isArray(data.checks) ? data.checks : [];
}

async function lookupShipmentsByIds(ids) {
  if (!Array.isArray(ids) || ids.length === 0) return [];
  const res = await fetch(
    `${SHIPMENT_SERVICE_BASE}/shipments/lookup?ids=${encodeURIComponent(
      ids.join(',')
    )}`
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.message || 'Failed to lookup shipments');
    err.status = res.status;
    throw err;
  }
  return Array.isArray(data.shipments) ? data.shipments : [];
}

async function sendStatusChangeNotification(trackingDoc) {
  if (!trackingDoc) return;
  let accountId = '';
  let detail = '';
  if (trackingDoc.checkId) {
    const checks = await lookupChecksByIds([String(trackingDoc.checkId)]);
    const check = checks[0];
    if (check) {
      accountId = String(check.accountId || '').trim();
      detail = check.category
        ? `${check.category} - ${check.location || ''}`.trim()
        : String(trackingDoc.checkId);
    }
  } else if (trackingDoc.shipmentId) {
    const shipments = await lookupShipmentsByIds([String(trackingDoc.shipmentId)]);
    const shipment = shipments[0];
    if (shipment) {
      accountId = String(shipment.accountId || '').trim();
      detail =
        shipment.origin && shipment.destination
          ? `${shipment.origin} to ${shipment.destination}`
          : String(trackingDoc.shipmentId);
    }
  }
  if (!accountId) return;
  const statusLabel = String(trackingDoc.status || '').trim().toLowerCase();
  const message = `This shipment status changed to ${statusLabel}${
    detail ? ` (${detail})` : ''
  }.`;
  const res = await fetch(`${NOTIFICATION_SERVICE_BASE}/notifications`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accountId, message }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `Notification service HTTP ${res.status}`);
  }
}

module.exports = {
  verifyAccount,
  getShipmentsByAccount,
  getChecksByAccount,
  lookupChecksByIds,
  lookupShipmentsByIds,
  sendStatusChangeNotification,
};
