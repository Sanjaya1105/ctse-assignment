const Tracking = require('../models/Tracking');
const {
  verifyAccount,
  getShipmentsByAccount,
  getChecksByAccount,
  lookupChecksByIds,
  lookupShipmentsByIds,
  sendStatusChangeNotification,
} = require('../services/integrationService');

const ALLOWED_ADMIN_STATUSES = ['accept', 'dispatch', 'delivered'];

function health(req, res) {
  res.json({ status: 'ok', service: 'tracking-service' });
}

async function createTracking(req, res) {
  const { shipmentId, checkId } = req.body || {};
  const s = shipmentId != null ? String(shipmentId).trim() : '';
  const c = checkId != null ? String(checkId).trim() : '';
  if ((s && c) || (!s && !c)) {
    return res.status(400).json({
      message: 'Provide exactly one of checkId or shipmentId',
    });
  }
  try {
    if (c) {
      const existing = await Tracking.findOne({ checkId: c });
      if (existing) {
        return res.status(200).json({
          message: 'Tracking already exists for this shipping detail',
          tracking: existing,
        });
      }
      const tracking = await Tracking.create({ checkId: c, status: 'created' });
      return res.status(201).json({ message: 'Tracking created successfully', tracking });
    }
    const existing = await Tracking.findOne({ shipmentId: s });
    if (existing) {
      return res.status(200).json({
        message: 'Tracking already exists for this shipment',
        tracking: existing,
      });
    }
    const tracking = await Tracking.create({ shipmentId: s, status: 'created' });
    return res.status(201).json({ message: 'Tracking created successfully', tracking });
  } catch (err) {
    console.error('Error creating tracking:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

async function respondTrackingsForAccount(res, accountId) {
  const id = String(accountId || '').trim();
  if (!id) return res.status(400).json({ message: 'accountId is required' });
  const verified = await verifyAccount(id);
  if (!verified.ok) return res.status(verified.status).json({ message: verified.message });
  try {
    const checks = await getChecksByAccount(id);
    const checkIds = checks.map((ch) => (ch && ch._id ? String(ch._id) : '')).filter(Boolean);
    const shipments = await getShipmentsByAccount(id);
    const shipmentIds = shipments
      .map((s) => (s && s._id ? String(s._id) : ''))
      .filter(Boolean);
    if (checkIds.length === 0 && shipmentIds.length === 0) {
      return res.json({ trackings: [], meta: { checkCount: 0, shipmentCount: 0, accountId: id } });
    }
    if (checkIds.length > 0) {
      const existingChecks = await Tracking.find({ checkId: { $in: checkIds } }).select('checkId').lean();
      const haveCheck = new Set(existingChecks.map((x) => String(x.checkId)).filter(Boolean));
      const missingChecks = checkIds.filter((cid) => !haveCheck.has(cid));
      if (missingChecks.length > 0) {
        await Tracking.insertMany(missingChecks.map((checkId) => ({ checkId, status: 'created' })));
      }
    }
    if (shipmentIds.length > 0) {
      const existingShip = await Tracking.find({ shipmentId: { $in: shipmentIds } }).select('shipmentId').lean();
      const haveShip = new Set(existingShip.map((x) => String(x.shipmentId)).filter(Boolean));
      const missingShip = shipmentIds.filter((sid) => !haveShip.has(sid));
      if (missingShip.length > 0) {
        await Tracking.insertMany(missingShip.map((shipmentId) => ({ shipmentId, status: 'created' })));
      }
    }
    const orClause = [];
    if (checkIds.length > 0) orClause.push({ checkId: { $in: checkIds } });
    if (shipmentIds.length > 0) orClause.push({ shipmentId: { $in: shipmentIds } });
    const trackings = await Tracking.find({ $or: orClause }).sort({ createdAt: -1 }).lean();
    const checkMap = new Map(checks.map((ch) => [String(ch._id), ch]));
    const shipmentMap = new Map(shipments.map((s) => [String(s._id), s]));
    const enriched = trackings.map((t) =>
      t.checkId
        ? { ...t, check: checkMap.get(String(t.checkId)) || null, shipment: null }
        : { ...t, check: null, shipment: shipmentMap.get(String(t.shipmentId)) || null }
    );
    return res.json({
      trackings: enriched,
      meta: { checkCount: checks.length, shipmentCount: shipments.length, accountId: id },
    });
  } catch (err) {
    console.error('Error building trackings for account:', err);
    return res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
  }
}

async function getMyTrackings(req, res) {
  const accountId = String(req.query.accountId || '').trim();
  if (!accountId) {
    return res.status(400).json({ message: 'accountId query parameter is required' });
  }
  return respondTrackingsForAccount(res, accountId);
}

async function getAllTrackings(req, res) {
  try {
    const trackings = await Tracking.find().sort({ createdAt: -1 }).lean();
    const checkIds = trackings.map((t) => (t && t.checkId ? String(t.checkId) : '')).filter(Boolean);
    const shipmentIds = trackings.map((t) => (t && t.shipmentId ? String(t.shipmentId) : '')).filter(Boolean);
    const [checks, shipments] = await Promise.all([
      lookupChecksByIds([...new Set(checkIds)]),
      lookupShipmentsByIds([...new Set(shipmentIds)]),
    ]);
    const checkMap = new Map(checks.map((c) => [String(c._id), c]));
    const shipmentMap = new Map(shipments.map((s) => [String(s._id), s]));
    const enriched = trackings.map((t) => ({
      ...t,
      check: t.checkId ? checkMap.get(String(t.checkId)) || null : null,
      shipment: t.shipmentId ? shipmentMap.get(String(t.shipmentId)) || null : null,
    }));
    return res.json({ trackings: enriched });
  } catch (err) {
    console.error('Error listing all trackings:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

async function updateTrackingStatus(req, res) {
  const id = String(req.params.id || '').trim();
  const requested = String(req.body?.status || '').trim().toLowerCase();
  const normalized = requested === 'dipatch' ? 'dispatch' : requested === 'deliverd' ? 'delivered' : requested;
  if (!id) return res.status(400).json({ message: 'tracking id is required' });
  if (!ALLOWED_ADMIN_STATUSES.includes(normalized)) {
    return res.status(400).json({ message: 'status must be one of: accept, dispatch, delivered' });
  }
  try {
    const updated = await Tracking.findByIdAndUpdate(id, { status: normalized }, { new: true }).lean();
    if (!updated) return res.status(404).json({ message: 'Tracking not found' });
    let notificationWarning = '';
    try {
      await sendStatusChangeNotification(updated);
    } catch (notifyErr) {
      console.error('Notification send failed:', notifyErr);
      notificationWarning = 'Status updated, but notification failed to send';
    }
    return res.json({
      message: 'Tracking status updated successfully',
      tracking: updated,
      ...(notificationWarning ? { warning: notificationWarning } : {}),
    });
  } catch (err) {
    console.error('Error updating tracking status:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

function getMyTrackingsLegacy(req, res) {
  return respondTrackingsForAccount(res, req.params.accountId);
}

async function syncByAccount(req, res) {
  const accountId = String(req.params.accountId || '').trim();
  if (!accountId) return res.status(400).json({ message: 'accountId is required' });
  try {
    const checks = await getChecksByAccount(accountId);
    const checkIds = checks.map((ch) => (ch && ch._id ? String(ch._id) : '')).filter(Boolean);
    const shipments = await getShipmentsByAccount(accountId);
    const shipmentIds = shipments.map((s) => (s && s._id ? String(s._id) : '')).filter(Boolean);
    let createdCount = 0;
    if (checkIds.length > 0) {
      const existing = await Tracking.find({ checkId: { $in: checkIds } }).select('checkId').lean();
      const set = new Set(existing.map((x) => String(x.checkId)));
      const missing = checkIds.filter((cid) => !set.has(cid));
      if (missing.length > 0) {
        await Tracking.insertMany(missing.map((checkId) => ({ checkId, status: 'created' })));
        createdCount += missing.length;
      }
    }
    if (shipmentIds.length > 0) {
      const existing = await Tracking.find({ shipmentId: { $in: shipmentIds } }).select('shipmentId').lean();
      const set = new Set(existing.map((x) => String(x.shipmentId)));
      const missing = shipmentIds.filter((sid) => !set.has(sid));
      if (missing.length > 0) {
        await Tracking.insertMany(missing.map((shipmentId) => ({ shipmentId, status: 'created' })));
        createdCount += missing.length;
      }
    }
    const orClause = [];
    if (checkIds.length > 0) orClause.push({ checkId: { $in: checkIds } });
    if (shipmentIds.length > 0) orClause.push({ shipmentId: { $in: shipmentIds } });
    const trackings =
      orClause.length === 0
        ? []
        : await Tracking.find({ $or: orClause }).sort({ createdAt: -1 }).lean();
    const checkMap = new Map(checks.map((ch) => [String(ch._id), ch]));
    const shipmentMap = new Map(shipments.map((s) => [String(s._id), s]));
    const enriched = trackings.map((t) =>
      t.checkId
        ? { ...t, check: checkMap.get(String(t.checkId)) || null, shipment: null }
        : { ...t, check: null, shipment: shipmentMap.get(String(t.shipmentId)) || null }
    );
    return res.json({ createdCount, trackings: enriched });
  } catch (err) {
    console.error('Error syncing tracking by account:', err);
    return res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
  }
}

function getByAccount(req, res) {
  return respondTrackingsForAccount(res, req.params.accountId);
}

module.exports = {
  health,
  createTracking,
  getMyTrackings,
  getAllTrackings,
  updateTrackingStatus,
  getMyTrackingsLegacy,
  syncByAccount,
  getByAccount,
};
