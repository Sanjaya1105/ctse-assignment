const Shipment = require('../models/Shipment');
const Check = require('../models/Check');
const { verifyAccount, buildAccountIdFilter } = require('../services/accountService');
const { createTrackingForCheck } = require('../services/trackingService');

function health(req, res) {
  res.json({ status: 'ok', service: 'shipment-service' });
}

async function createShipment(req, res) {
  const { accountId, origin, destination } = req.body || {};
  if (!accountId || !origin || !destination) {
    return res
      .status(400)
      .json({ message: 'accountId, origin and destination are required' });
  }

  try {
    const shipment = await Shipment.create({ accountId, origin, destination });
    return res.status(201).json({
      message: 'Shipment created successfully',
      shipment,
    });
  } catch (err) {
    console.error('Error creating shipment:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

async function listShipments(req, res) {
  const accountId = req.query.accountId;
  if (!accountId) {
    return res.status(400).json({ message: 'accountId is required' });
  }
  const verified = await verifyAccount(accountId);
  if (!verified.ok) {
    return res.status(verified.status).json({ message: verified.message });
  }
  try {
    const shipments = await Shipment.find(buildAccountIdFilter(accountId))
      .sort({ createdAt: -1 })
      .lean();
    return res.json({ shipments });
  } catch (err) {
    console.error('Error listing shipments:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

async function listChecks(req, res) {
  const accountId = req.query.accountId;
  const verified = await verifyAccount(accountId);
  if (!verified.ok) {
    return res.status(verified.status).json({ message: verified.message });
  }
  try {
    const checks = await Check.find(buildAccountIdFilter(accountId))
      .sort({ createdAt: -1 })
      .lean();
    return res.json({ checks });
  } catch (err) {
    console.error('Error listing checks:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

async function lookupChecks(req, res) {
  const idsRaw = String(req.query.ids || '').trim();
  if (!idsRaw) return res.json({ checks: [] });
  const ids = idsRaw.split(',').map((s) => String(s || '').trim()).filter(Boolean);
  if (ids.length === 0) return res.json({ checks: [] });
  try {
    const checks = await Check.find({ _id: { $in: ids } }).lean();
    return res.json({ checks });
  } catch (err) {
    console.error('Error lookup checks:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

async function lookupShipments(req, res) {
  const idsRaw = String(req.query.ids || '').trim();
  if (!idsRaw) return res.json({ shipments: [] });
  const ids = idsRaw.split(',').map((s) => String(s || '').trim()).filter(Boolean);
  if (ids.length === 0) return res.json({ shipments: [] });
  try {
    const shipments = await Shipment.find({ _id: { $in: ids } }).lean();
    return res.json({ shipments });
  } catch (err) {
    console.error('Error lookup shipments:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

async function createCheck(req, res) {
  const { accountId, category, location } = req.body || {};
  if (!accountId || !category || !location) {
    return res.status(400).json({
      message: 'accountId, category and location are required',
    });
  }
  const verified = await verifyAccount(accountId);
  if (!verified.ok) {
    return res.status(verified.status).json({ message: verified.message });
  }

  try {
    const idStr = String(accountId || '').trim();
    const check = await Check.create({ accountId: idStr, category, location });
    const checkId = check._id.toString();
    try {
      const tracking = await createTrackingForCheck(checkId);
      return res.status(201).json({
        message: 'Shipping details and tracking created successfully',
        check,
        tracking,
      });
    } catch (trackErr) {
      console.error('Tracking creation failed, rolling back check:', trackErr);
      await Check.findByIdAndDelete(check._id);
      return res.status(503).json({
        message:
          'Could not save shipping details: tracking service unavailable or failed',
        detail: trackErr.message,
      });
    }
  } catch (err) {
    console.error('Error saving check shipping details:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

module.exports = {
  health,
  createShipment,
  listShipments,
  listChecks,
  lookupChecks,
  lookupShipments,
  createCheck,
};
