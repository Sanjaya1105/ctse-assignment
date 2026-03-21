const mongoose = require('mongoose');
const { ACCOUNT_SERVICE_BASE } = require('../config/env');

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
    const user = await res.json();
    return { ok: true, user };
  } catch (err) {
    console.error('verifyAccount failed:', err);
    return {
      ok: false,
      status: 502,
      message: 'Could not reach account service',
    };
  }
}

function buildAccountIdFilter(accountId) {
  const raw = String(accountId || '').trim();
  if (!raw) {
    return { _id: null };
  }
  const idVariants = new Set([raw, raw.toLowerCase(), raw.toUpperCase()]);
  const orClause = [...idVariants].map((v) => ({ accountId: v }));
  if (mongoose.Types.ObjectId.isValid(raw)) {
    try {
      orClause.push({ accountId: new mongoose.Types.ObjectId(raw) });
    } catch {
      // ignore
    }
  }
  return { $or: orClause };
}

module.exports = {
  verifyAccount,
  buildAccountIdFilter,
};
