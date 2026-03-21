import { useState, useEffect } from 'react';

// Frontend calls go through API gateway routes (base URL configurable via env).
const API_GATEWAY_BASE = (
  import.meta.env.VITE_API_GATEWAY_BASE_URL || ''
).replace(/\/$/, '');
const ACCOUNT_SERVICE = `${API_GATEWAY_BASE}/account`;
const SHIPMENT_SERVICE = `${API_GATEWAY_BASE}/shipment`;
const TRACKING_SERVICE = `${API_GATEWAY_BASE}/tracking`;
const NOTIFICATION_SERVICE = `${API_GATEWAY_BASE}/notification`;

const SERVICES = [
  { id: 'account', label: 'Account Service' },
  { id: 'shipment', label: 'Shipment Service' },
  { id: 'tracking', label: 'Tracking Service' },
  { id: 'notification', label: 'Notification Service' },
];

/** Stable string account id from login / profile (handles id, _id, $oid). */
function normalizeAccountId(user) {
  if (!user) return '';
  const raw = user.id ?? user._id;
  if (raw == null || raw === '') return '';
  if (typeof raw === 'string') return raw.trim();
  if (typeof raw === 'object' && raw !== null && '$oid' in raw) {
    return String(raw.$oid).trim();
  }
  return String(raw).trim();
}

/** Show user-friendly tracking status (DB may still store `created`). */
function displayTrackingStatus(status) {
  const s = String(status || '').trim().toLowerCase();
  if (s === 'created') return 'pending';
  return s ? String(status).trim() : '—';
}

export default function App() {
  const [statuses, setStatuses] = useState({});
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [registerMessage, setRegisterMessage] = useState('');
  const [registerState, setRegisterState] = useState('idle');
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [loginMessage, setLoginMessage] = useState('');
  const [loginState, setLoginState] = useState('idle');
  const [page, setPage] = useState('auth'); // 'auth' | 'dashboard' | 'adminDashboard' | 'adminTracking' | 'userDetails' | 'check' | 'tracking'
  const [currentUser, setCurrentUser] = useState(null);
  const [userForm, setUserForm] = useState({ name: '', email: '', password: '' });
  const [userMessage, setUserMessage] = useState('');
  const [userState, setUserState] = useState('idle');
  const [checkShipping, setCheckShipping] = useState({
    category: '',
    location: '',
  });
  const [checkMessage, setCheckMessage] = useState('');
  const [checkState, setCheckState] = useState('idle');
  const [checkList, setCheckList] = useState([]);
  const [checkListLoading, setCheckListLoading] = useState(false);
  const [checkListError, setCheckListError] = useState('');
  /** Profile from account-service, shown on Check page */
  const [checkAccountProfile, setCheckAccountProfile] = useState(null);
  const [trackingList, setTrackingList] = useState([]);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackingError, setTrackingError] = useState('');
  const [trackingMeta, setTrackingMeta] = useState(null);
  const [adminTrackingList, setAdminTrackingList] = useState([]);
  const [adminTrackingLoading, setAdminTrackingLoading] = useState(false);
  const [adminTrackingError, setAdminTrackingError] = useState('');
  const [adminTrackingUpdatingId, setAdminTrackingUpdatingId] = useState('');
  const [notificationModalOpen, setNotificationModalOpen] = useState(false);
  const [notificationList, setNotificationList] = useState([]);
  const [notificationLoading, setNotificationLoading] = useState(false);
  const [notificationError, setNotificationError] = useState('');

  const loadCheckPageData = async (userId) => {
    const id = String(userId || '').trim();
    if (!id) {
      setCheckList([]);
      setCheckListError('Missing account id');
      setCheckAccountProfile(null);
      return;
    }

    setCheckListLoading(true);
    setCheckListError('');

    // Fetch separately: if account fetch fails (CORS/network), shipment list can still load.
    let profile = null;
    try {
      const userRes = await fetch(
        `${ACCOUNT_SERVICE}/users/${encodeURIComponent(id)}`,
        { cache: 'no-store' }
      );
      if (userRes.ok) {
        profile = await userRes.json();
      }
    } catch {
      // Profile optional for showing the list
    }
    setCheckAccountProfile(profile);

    try {
      const checksRes = await fetch(
        `${SHIPMENT_SERVICE}/checks?accountId=${encodeURIComponent(id)}`,
        { cache: 'no-store' }
      );
      const checksData = await checksRes.json().catch(() => ({}));
      if (!checksRes.ok) {
        setCheckList([]);
        setCheckListError(
          checksData.message ||
            `Could not load shipping list (HTTP ${checksRes.status})`
        );
      } else {
        setCheckList(
          Array.isArray(checksData.checks) ? checksData.checks : []
        );
        setCheckListError('');
      }
    } catch (err) {
      setCheckList([]);
      setCheckListError(
        err?.message || 'Could not reach shipment-service via API gateway'
      );
    } finally {
      setCheckListLoading(false);
    }
  };

  const currentAccountId = currentUser ? normalizeAccountId(currentUser) : '';

  useEffect(() => {
    if (page === 'check' && currentAccountId) {
      loadCheckPageData(currentAccountId);
    }
  }, [page, currentAccountId]);

  const loadTrackingPageData = async (accountId) => {
    const id = String(accountId || '').trim();
    if (!id) {
      setTrackingList([]);
      setTrackingError('Missing account id');
      return;
    }

    setTrackingLoading(true);
    setTrackingError('');
    setTrackingMeta(null);
    try {
      // Gateway → tracking-service (query param avoids path issues with Mongo ids)
      const res = await fetch(
        `${TRACKING_SERVICE}/trackings/me?accountId=${encodeURIComponent(id)}`,
        { cache: 'no-store' }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || `HTTP ${res.status}`);
      }
      setTrackingList(Array.isArray(data.trackings) ? data.trackings : []);
      setTrackingMeta(data.meta || null);
    } catch (err) {
      setTrackingList([]);
      setTrackingMeta(null);
      setTrackingError(err.message || 'Failed to load tracking list');
    } finally {
      setTrackingLoading(false);
    }
  };

  useEffect(() => {
    if (page === 'tracking' && currentAccountId) {
      loadTrackingPageData(currentAccountId);
    }
  }, [page, currentAccountId]);

  const loadAdminTrackingPageData = async () => {
    setAdminTrackingLoading(true);
    setAdminTrackingError('');
    try {
      const res = await fetch(`${TRACKING_SERVICE}/trackings/all`, {
        cache: 'no-store',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || `HTTP ${res.status}`);
      }
      setAdminTrackingList(Array.isArray(data.trackings) ? data.trackings : []);
    } catch (err) {
      setAdminTrackingList([]);
      setAdminTrackingError(err.message || 'Failed to load admin trackings');
    } finally {
      setAdminTrackingLoading(false);
    }
  };

  const updateAdminTrackingStatus = async (trackingId, status) => {
    const id = String(trackingId || '').trim();
    if (!id || !status) return;
    setAdminTrackingUpdatingId(id);
    setAdminTrackingError('');
    try {
      const res = await fetch(`${TRACKING_SERVICE}/trackings/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || `HTTP ${res.status}`);
      }
      setAdminTrackingList((prev) =>
        prev.map((row) =>
          String(row._id) === id ? { ...row, status: data.tracking.status } : row
        )
      );
    } catch (err) {
      setAdminTrackingError(err.message || 'Failed to update tracking status');
    } finally {
      setAdminTrackingUpdatingId('');
    }
  };

  useEffect(() => {
    if (page === 'adminTracking' && currentUser?.role === 'admin') {
      loadAdminTrackingPageData();
    }
  }, [page, currentUser?.role]);

  const loadNotifications = async (accountId) => {
    const id = String(accountId || '').trim();
    if (!id) {
      setNotificationList([]);
      setNotificationError('Missing account id');
      return;
    }
    setNotificationLoading(true);
    setNotificationError('');
    try {
      const res = await fetch(
        `${NOTIFICATION_SERVICE}/notifications?accountId=${encodeURIComponent(id)}`,
        { cache: 'no-store' }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || `HTTP ${res.status}`);
      }
      setNotificationList(
        Array.isArray(data.notifications) ? data.notifications : []
      );
    } catch (err) {
      setNotificationList([]);
      setNotificationError(err.message || 'Failed to load notifications');
    } finally {
      setNotificationLoading(false);
    }
  };

  const SERVICE_HEALTH_URL = {
    account: `${ACCOUNT_SERVICE}/health`,
    shipment: `${SHIPMENT_SERVICE}/health`,
    tracking: `${TRACKING_SERVICE}/health`,
    notification: `${NOTIFICATION_SERVICE}/health`,
  };

  const checkHealth = async (serviceId) => {
    setStatuses((prev) => ({
      ...prev,
      [serviceId]: { state: 'loading', message: 'Checking...' },
    }));

    try {
      const healthUrl = SERVICE_HEALTH_URL[serviceId];
      if (!healthUrl) {
        throw new Error(`Unknown service: ${serviceId}`);
      }
      const res = await fetch(healthUrl);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await res.json();
      setStatuses((prev) => ({
        ...prev,
        [serviceId]: {
          state: 'ok',
          message: `OK - ${JSON.stringify(data)}`,
        },
      }));
    } catch (err) {
      setStatuses((prev) => ({
        ...prev,
        [serviceId]: {
          state: 'error',
          message: `Error: ${err.message}`,
        },
      }));
    }
  };

  if (page === 'adminDashboard' && currentUser?.role === 'admin') {
    return (
      <div className="page">
        <h1>Admin Dashboard</h1>
        <p>
          Signed in as <strong>{currentUser.name}</strong> ({currentUser.email}
          )
        </p>
        <p style={{ color: '#555', fontSize: '0.9rem', marginBottom: '1rem' }}>
          Data below is loaded through the <strong>API gateway</strong> into
          account-service; account-service talks to shipment and tracking
          services <strong>directly</strong> (not through the gateway).
        </p>
        <button
          style={{ marginRight: '0.75rem' }}
          onClick={() => {
            setCurrentUser(null);
            setLoginForm({ email: '', password: '' });
            setLoginMessage('');
            setLoginState('idle');
            setPage('auth');
          }}
        >
          Logout
        </button>
        <button onClick={() => setPage('adminTracking')}>Tracking</button>
      </div>
    );
  }

  if (page === 'adminTracking' && currentUser?.role === 'admin') {
    return (
      <div className="page">
        <h1>Admin Tracking</h1>
        <p style={{ color: '#555', marginBottom: '0.75rem' }}>
          All tracking rows loaded via API gateway from tracking-service.
        </p>
        {adminTrackingLoading && <p>Loading tracking rows...</p>}
        {adminTrackingError && (
          <div className="status error" style={{ marginBottom: '0.5rem' }}>
            {adminTrackingError}
          </div>
        )}
        {!adminTrackingLoading &&
          !adminTrackingError &&
          adminTrackingList.length === 0 && (
            <p style={{ color: '#666' }}>No tracking rows found.</p>
          )}
        {!adminTrackingLoading && adminTrackingList.length > 0 && (
          <ul style={{ paddingLeft: '1.25rem', marginBottom: '1rem' }}>
            {adminTrackingList.map((row) => (
              <li key={row._id} style={{ marginBottom: '0.5rem' }}>
                <strong>Status:</strong> {displayTrackingStatus(row.status)} |{' '}
                <label style={{ marginRight: '0.5rem' }}>
                  <strong>Update:</strong>{' '}
                  <select
                    value={
                      ['accept', 'dispatch', 'delivered'].includes(
                        String(row.status || '').toLowerCase()
                      )
                        ? String(row.status || '').toLowerCase()
                        : ''
                    }
                    disabled={adminTrackingUpdatingId === String(row._id)}
                    onChange={(e) =>
                      updateAdminTrackingStatus(String(row._id), e.target.value)
                    }
                  >
                    <option value="" disabled>
                      select status
                    </option>
                    <option value="accept">accept</option>
                    <option value="dispatch">dipatch</option>
                    <option value="delivered">deliverd</option>
                  </select>
                </label>
                {row.checkId ? (
                  <>
                    <strong>checkId:</strong> <code>{row.checkId}</code>
                    {row.check && (
                      <span>
                        {' '}
                        ({row.check.category} — {row.check.location})
                      </span>
                    )}
                  </>
                ) : (
                  <>
                    <strong>shipmentId:</strong> <code>{row.shipmentId}</code>
                    {row.shipment && (
                      <span>
                        {' '}
                        ({row.shipment.origin} to {row.shipment.destination})
                      </span>
                    )}
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
        <button onClick={() => setPage('adminDashboard')}>
          Back to Admin Dashboard
        </button>
      </div>
    );
  }

  if (page === 'dashboard') {
    return (
      <div className="page">
        <h1>User Dashboard</h1>
        <p>You are now logged in.</p>
        <button
          style={{ marginRight: '0.75rem' }}
          onClick={() => {
            setCurrentUser(null);
            setLoginForm({ email: '', password: '' });
            setLoginMessage('');
            setLoginState('idle');
            setPage('auth');
          }}
        >
          Logout
        </button>
        <button
          style={{ marginRight: '0.75rem' }}
          onClick={() => {
            setNotificationModalOpen(true);
            loadNotifications(currentAccountId);
          }}
        >
          Bell
        </button>
        <button
          onClick={() => {
            if (currentUser) {
              setUserForm({
                name: currentUser.name,
                email: currentUser.email,
                password: '',
              });
            }
            setUserMessage('');
            setUserState('idle');
            setPage('userDetails');
          }}
        >
          Update User
        </button>
        <button
          style={{ marginLeft: '0.75rem' }}
          onClick={() => {
            setCheckShipping({ category: '', location: '' });
            setCheckMessage('');
            setCheckState('idle');
            setPage('check');
          }}
        >
          Shipping (Check)
        </button>
        <button
          style={{ marginLeft: '0.75rem' }}
          onClick={() => {
            setStatuses({});
            setPage('tracking');
          }}
        >
          Tracking
        </button>

        {notificationModalOpen && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
            }}
            onClick={() => setNotificationModalOpen(false)}
          >
            <div
              className="card"
              style={{
                width: 'min(760px, 92vw)',
                maxHeight: '70vh',
                overflow: 'auto',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2>Notifications</h2>
              {notificationLoading && <p>Loading notifications...</p>}
              {notificationError && (
                <div className="status error" style={{ marginBottom: '0.5rem' }}>
                  {notificationError}
                </div>
              )}
              {!notificationLoading &&
                !notificationError &&
                notificationList.length === 0 && (
                  <p style={{ color: '#666' }}>No notifications.</p>
                )}
              {!notificationLoading && notificationList.length > 0 && (
                <ul style={{ paddingLeft: '1.25rem' }}>
                  {notificationList.map((n) => (
                    <li key={n._id} style={{ marginBottom: '0.65rem' }}>
                      {n.message}
                      {n.createdAt && (
                        <span style={{ color: '#888', fontSize: '0.85rem' }}>
                          {' '}
                          ({new Date(n.createdAt).toLocaleString()})
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
              <button onClick={() => setNotificationModalOpen(false)}>Close</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (page === 'check' && currentUser?.role === 'admin') {
    return (
      <div className="page">
        <h1>Shipping details</h1>
        <p className="status error">This page is for regular users only.</p>
        <button onClick={() => setPage('adminDashboard')}>
          Back to Admin Dashboard
        </button>
      </div>
    );
  }

  if (page === 'check' && currentUser) {
    return (
      <div className="page">
        <h1>Shipping details</h1>
        <p style={{ color: '#555', marginBottom: '1rem' }}>
          Add your shippings here (category &amp; location). Each save creates a
          row in shipment-service and a matching tracking record in
          tracking-service.
        </p>
        {checkAccountProfile && (
          <p style={{ marginBottom: '1rem', color: '#555' }}>
            Account (from account-service):{' '}
            <strong>{checkAccountProfile.name}</strong> ({checkAccountProfile.email}
            ) · ID <code>{String(checkAccountProfile.id)}</code>
          </p>
        )}
        <section className="card" style={{ marginBottom: '1.5rem' }}>
          <h2>New shipping</h2>
          <p style={{ marginBottom: '0.75rem', color: '#555' }}>
            Enter category and location. Submit goes through the API gateway to
            shipment-service; shipment-service verifies your account, saves the
            shipping detail, then tells tracking-service to create tracking.
          </p>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setCheckState('loading');
              setCheckMessage('Saving shipping details...');
              try {
                const res = await fetch(`${SHIPMENT_SERVICE}/checks`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    accountId: normalizeAccountId(currentUser),
                    category: checkShipping.category,
                    location: checkShipping.location,
                  }),
                });
                const text = await res.text();
                let data;
                try {
                  data = text ? JSON.parse(text) : {};
                } catch {
                  throw new Error(
                    text || `Unexpected non-JSON response (status ${res.status})`
                  );
                }
                if (!res.ok) {
                  throw new Error(data.message || `HTTP ${res.status}`);
                }
                setCheckState('ok');
                const saved =
                  data.message || 'Shipping details saved successfully';
                const tr = data.tracking?._id
                  ? ` Tracking ID: ${data.tracking._id} (status: ${displayTrackingStatus(data.tracking.status)}).`
                  : '';
                setCheckMessage(`${saved}${tr}`);
                setCheckShipping({ category: '', location: '' });
                await loadCheckPageData(normalizeAccountId(currentUser));
              } catch (err) {
                setCheckState('error');
                setCheckMessage(err.message);
              }
            }}
          >
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <input
                type="text"
                placeholder="Category"
                value={checkShipping.category}
                onChange={(e) =>
                  setCheckShipping({
                    ...checkShipping,
                    category: e.target.value,
                  })
                }
              />
              <input
                type="text"
                placeholder="Location"
                value={checkShipping.location}
                onChange={(e) =>
                  setCheckShipping({
                    ...checkShipping,
                    location: e.target.value,
                  })
                }
              />
              <button type="submit">Submit</button>
            </div>
          </form>
          {checkMessage && (
            <div
              className={[
                'status',
                checkState === 'ok'
                  ? 'ok'
                  : checkState === 'error'
                  ? 'error'
                  : '',
              ]
                .filter(Boolean)
                .join(' ')}
              style={{ marginTop: '0.5rem' }}
            >
              {checkMessage}
            </div>
          )}
        </section>

        <section className="card" style={{ marginBottom: '1.5rem' }}>
          <h2>Your saved shipping details</h2>
          <p style={{ marginBottom: '0.75rem', color: '#555' }}>
            Loaded from shipment-service (<code>GET /checks</code>) after
            confirming your account with account-service.
          </p>
          {checkListLoading && <p>Loading list…</p>}
          {checkListError && (
            <div className="status error" style={{ marginBottom: '0.5rem' }}>
              {checkListError}
            </div>
          )}
          {!checkListLoading && !checkListError && checkList.length === 0 && (
            <p style={{ color: '#666' }}>No shipping details saved yet.</p>
          )}
          {!checkListLoading && checkList.length > 0 && (
            <ul style={{ paddingLeft: '1.25rem', margin: 0 }}>
              {checkList.map((row) => (
                <li key={row._id} style={{ marginBottom: '0.5rem' }}>
                  <strong>{row.category}</strong> — {row.location}
                  {row.createdAt && (
                    <span style={{ color: '#888', fontSize: '0.85rem' }}>
                      {' '}
                      ({new Date(row.createdAt).toLocaleString()})
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        <button onClick={() => setPage('dashboard')}>Back to Dashboard</button>
      </div>
    );
  }

  if (page === 'tracking' && currentUser?.role === 'admin') {
    return (
      <div className="page">
        <h1>Tracking</h1>
        <p className="status error">This page is for regular users only.</p>
        <button onClick={() => setPage('adminDashboard')}>
          Back to Admin Dashboard
        </button>
      </div>
    );
  }

  if (page === 'tracking' && currentUser) {
    if (!currentAccountId) {
      return (
        <div className="page">
          <h1>Tracking</h1>
          <div className="status error" style={{ marginBottom: '1rem' }}>
            Your session has no account id. Please log out and log in again.
          </div>
          <button onClick={() => setPage('dashboard')}>Back to Dashboard</button>
        </div>
      );
    }
    return (
      <div className="page">
        <h1>Tracking</h1>
        <p style={{ marginBottom: '0.75rem', color: '#666', fontSize: '0.9rem' }}>
          Account ID used for this page: <code>{currentAccountId}</code>
        </p>
        <section className="card" style={{ marginBottom: '1.5rem' }}>
          <h2>Your shipment tracking records</h2>
          <p style={{ marginBottom: '0.75rem', color: '#555' }}>
            Via API gateway: tracking-service verifies your account, loads your
            shipping details (<strong>checks</strong>) from shipment-service,
            then reads/creates tracking rows linked by <code>checkId</code>.
            Legacy rows linked to old <code>shipmentId</code> still appear if
            present.
          </p>
          {trackingLoading && <p>Loading tracking records...</p>}
          {trackingError && (
            <div className="status error" style={{ marginBottom: '0.5rem' }}>
              {trackingError}
            </div>
          )}
          {!trackingLoading && !trackingError && trackingList.length === 0 && (
            <p style={{ color: '#666' }}>
              {trackingMeta && trackingMeta.checkCount === 0
                ? 'You have no shipping details yet. Use Shipping (Check) on the dashboard — each save creates tracking automatically.'
                : 'No tracking rows matched your shipping details. Add a new shipping entry on the Check page, or refresh after restarting services.'}
            </p>
          )}
          {!trackingLoading && trackingList.length > 0 && (
            <ul style={{ paddingLeft: '1.25rem', margin: 0 }}>
              {trackingList.map((row) => (
                <li key={row._id} style={{ marginBottom: '0.5rem' }}>
                  <strong>Status:</strong> {displayTrackingStatus(row.status)}
                  {row.checkId && (
                    <>
                      {' '}
                      | <strong>Shipping detail:</strong>{' '}
                      <code>{row.checkId}</code>
                      {row.check && (
                        <span>
                          {' '}
                          ({row.check.category} — {row.check.location})
                        </span>
                      )}
                    </>
                  )}
                  {row.shipmentId && !row.checkId && (
                    <>
                      {' '}
                      | <strong>Legacy shipment:</strong>{' '}
                      <code>{row.shipmentId}</code>
                      {row.shipment && (
                        <span>
                          {' '}
                          ({row.shipment.origin} to {row.shipment.destination})
                        </span>
                      )}
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
        <button onClick={() => setPage('dashboard')}>Back to Dashboard</button>
      </div>
    );
  }

  if (page === 'userDetails' && currentUser?.role === 'admin') {
    return (
      <div className="page">
        <h1>User Details</h1>
        <p className="status error">
          Profile editing is for regular users only. Use the Admin Dashboard.
        </p>
        <button onClick={() => setPage('adminDashboard')}>
          Back to Admin Dashboard
        </button>
      </div>
    );
  }

  if (page === 'userDetails' && currentUser) {
    return (
      <div className="page">
        <h1>User Details</h1>
        <section className="card" style={{ marginBottom: '1.5rem' }}>
          <h2>Edit / Delete User</h2>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setUserState('loading');
              setUserMessage('Updating user...');
              try {
                const uid = encodeURIComponent(normalizeAccountId(currentUser));
                const res = await fetch(`${ACCOUNT_SERVICE}/users/${uid}`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(userForm),
                });
                const data = await res.json();
                if (!res.ok) {
                  throw new Error(data.message || `HTTP ${res.status}`);
                }
                setUserState('ok');
                setUserMessage(data.message || 'User updated successfully');
                setCurrentUser(data.user);
              } catch (err) {
                setUserState('error');
                setUserMessage(err.message);
              }
            }}
          >
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <input
                type="text"
                placeholder="Name"
                value={userForm.name}
                onChange={(e) =>
                  setUserForm({ ...userForm, name: e.target.value })
                }
              />
              <input
                type="email"
                placeholder="Email"
                value={userForm.email}
                onChange={(e) =>
                  setUserForm({ ...userForm, email: e.target.value })
                }
              />
              <input
                type="password"
                placeholder="New Password (optional)"
                value={userForm.password}
                onChange={(e) =>
                  setUserForm({ ...userForm, password: e.target.value })
                }
              />
              <button type="submit">Save Changes</button>
            </div>
          </form>
          <button
            style={{ marginTop: '0.75rem', backgroundColor: '#b91c1c' }}
            onClick={async () => {
              if (!window.confirm('Are you sure you want to delete this user?')) {
                return;
              }
              setUserState('loading');
              setUserMessage('Deleting user...');
              try {
                const uid = encodeURIComponent(normalizeAccountId(currentUser));
                const res = await fetch(`${ACCOUNT_SERVICE}/users/${uid}`, {
                  method: 'DELETE',
                });
                const data = await res.json();
                if (!res.ok) {
                  throw new Error(data.message || `HTTP ${res.status}`);
                }
                setUserState('ok');
                setUserMessage(data.message || 'User deleted successfully');
                // After delete, send back to auth page
                setTimeout(() => {
                  setCurrentUser(null);
                  setPage('auth');
                }, 800);
              } catch (err) {
                setUserState('error');
                setUserMessage(err.message);
              }
            }}
          >
            Delete User
          </button>
          {userMessage && (
            <div
              className={[
                'status',
                userState === 'ok'
                  ? 'ok'
                  : userState === 'error'
                  ? 'error'
                  : '',
              ]
                .filter(Boolean)
                .join(' ')}
              style={{ marginTop: '0.5rem' }}
            >
              {userMessage}
            </div>
          )}
        </section>
        <button onClick={() => setPage('dashboard')}>Back to Dashboard</button>
      </div>
    );
  }

  return (
    <div className="page">
      <h1>CTSE Microservices via API Gateway tessssst</h1>
      <p>
        API base:{' '}
        <code>
          {API_GATEWAY_BASE || '(same origin — Vite dev proxy or misconfigured)'}
        </code>
      </p>

      <section className="card" style={{ marginBottom: '1.5rem' }}>
        <h2>User Registration (Account Service)</h2>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setRegisterState('loading');
            setRegisterMessage('Registering user...');
            try {
              const res = await fetch(`${ACCOUNT_SERVICE}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
              });
              const data = await res.json();
              if (!res.ok) {
                throw new Error(data.message || `HTTP ${res.status}`);
              }
              setRegisterState('ok');
              setRegisterMessage(data.message || 'User registered successfully');
              setForm({ name: '', email: '', password: '' });
            } catch (err) {
              setRegisterState('error');
              setRegisterMessage(err.message);
            }
          }}
        >
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <input
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <input
              type="password"
              placeholder="Password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
            <button type="submit">Register</button>
          </div>
        </form>
        {registerMessage && (
          <div
            className={[
              'status',
              registerState === 'ok'
                ? 'ok'
                : registerState === 'error'
                ? 'error'
                : '',
            ]
              .filter(Boolean)
              .join(' ')}
            style={{ marginTop: '0.5rem' }}
          >
            {registerMessage}
          </div>
        )}
      </section>

      <section className="card" style={{ marginBottom: '1.5rem' }}>
        <h2>User Login (Account Service)</h2>
        <p style={{ color: '#555', fontSize: '0.9rem', marginBottom: '0.75rem' }}>
          <strong>Admin:</strong> <code>admin@gmail.com</code> /{' '}
          <code>Admin@123</code> — opens the admin dashboard (via API gateway).
        </p>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setLoginState('loading');
            setLoginMessage('Logging in...');
            try {
              const res = await fetch(`${ACCOUNT_SERVICE}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(loginForm),
              });
              const data = await res.json();
              if (!res.ok) {
                throw new Error(data.message || `HTTP ${res.status}`);
              }
              setLoginState('ok');
              setLoginMessage(data.message || 'Login successful');
              setCurrentUser(data.user);
              if (data.user?.role === 'admin') {
                setPage('adminDashboard');
              } else {
                setPage('dashboard');
              }
              setLoginForm({ ...loginForm, password: '' });
            } catch (err) {
              setLoginState('error');
              setLoginMessage(err.message);
            }
          }}
        >
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <input
              type="email"
              placeholder="Email"
              value={loginForm.email}
              onChange={(e) =>
                setLoginForm({ ...loginForm, email: e.target.value })
              }
            />
            <input
              type="password"
              placeholder="Password"
              value={loginForm.password}
              onChange={(e) =>
                setLoginForm({ ...loginForm, password: e.target.value })
              }
            />
            <button type="submit">Login</button>
          </div>
        </form>
        {loginMessage && (
          <div
            className={[
              'status',
              loginState === 'ok' ? 'ok' : loginState === 'error' ? 'error' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            style={{ marginTop: '0.5rem' }}
          >
            {loginMessage}
          </div>
        )}
      </section>

    </div>
  );
}

