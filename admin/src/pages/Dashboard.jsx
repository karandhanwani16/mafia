import { useState, useEffect } from 'react';
import { getSettings, patchSettings, getStats, getAdmins, createAdmin, resetAdminPassword, deleteAdmin, logout } from '../api';

function Toggle({ checked, onChange, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={!!checked}
      className="admin-toggle"
      onClick={() => onChange(!checked)}
      disabled={disabled}
    />
  );
}

export default function Dashboard({ username, onLogout }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tab, setTab] = useState('overview');
  const [settings, setSettings] = useState(null);
  const [stats, setStats] = useState(null);
  const [admins, setAdmins] = useState([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [form, setForm] = useState({
    testingMode: false,
    apiLimiterEnabled: true,
    apiLimiterWindowMs: 15 * 60 * 1000,
    apiLimiterMax: 100,
    maxPlayersMin: 5,
    maxPlayersMax: 12,
    maintenanceMode: false,
    maintenanceMessage: 'Under maintenance. Please try again later.'
  });
  const [adminForm, setAdminForm] = useState({ username: '', password: '', confirm: '' });
  const [addingAdmin, setAddingAdmin] = useState(false);
  const [adminsSubTab, setAdminsSubTab] = useState('add'); // 'add' | 'view'
  const [resetTarget, setResetTarget] = useState(null); // { username } or null
  const [resetForm, setResetForm] = useState({ newPassword: '', confirm: '' });
  const [resetting, setResetting] = useState(false);
  const [deleting, setDeleting] = useState(null); // username when delete in progress

  const loadSettings = () =>
    getSettings()
      .then((data) => {
        setSettings(data);
        setForm({
          testingMode: !!data.testingMode,
          apiLimiterEnabled: data.apiLimiterEnabled !== false,
          apiLimiterWindowMs: data.apiLimiterWindowMs ?? 15 * 60 * 1000,
          apiLimiterMax: data.apiLimiterMax ?? 100,
          maxPlayersMin: data.maxPlayersMin ?? 5,
          maxPlayersMax: data.maxPlayersMax ?? 12,
          maintenanceMode: !!data.maintenanceMode,
          maintenanceMessage: data.maintenanceMessage || 'Under maintenance. Please try again later.'
        });
      })
      .catch(() => setMessage('Failed to load settings'));

  const loadStats = () =>
    getStats()
      .then(setStats)
      .catch(() => setStats(null));

  const loadAdmins = () =>
    getAdmins()
      .then((data) => setAdmins(data.admins || []))
      .catch(() => setAdmins([]));

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    if (tab === 'overview') loadStats();
    if (tab === 'admins') loadAdmins();
  }, [tab]);

  const handleChange = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setSaving(true);
    try {
      const updated = await patchSettings({
        testingMode: form.testingMode,
        apiLimiterEnabled: form.apiLimiterEnabled,
        apiLimiterWindowMs: Number(form.apiLimiterWindowMs),
        apiLimiterMax: Number(form.apiLimiterMax),
        maxPlayersMin: Number(form.maxPlayersMin),
        maxPlayersMax: Number(form.maxPlayersMax),
        maintenanceMode: form.maintenanceMode,
        maintenanceMessage: form.maintenanceMessage
      });
      setSettings(updated);
      setMessage('Settings saved.');
      loadStats();
    } catch (err) {
      setMessage(err.data?.error || err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleAddAdmin = async (e) => {
    e.preventDefault();
    if (adminForm.password !== adminForm.confirm) {
      setMessage('Passwords do not match.');
      return;
    }
    setMessage('');
    setAddingAdmin(true);
    try {
      await createAdmin(adminForm.username.trim(), adminForm.password);
      setMessage('Admin added successfully.');
      setAdminForm({ username: '', password: '', confirm: '' });
      loadAdmins();
      setAdminsSubTab('view');
    } catch (err) {
      setMessage(err.data?.error || err.message || 'Failed to add admin');
    } finally {
      setAddingAdmin(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!resetTarget || resetForm.newPassword !== resetForm.confirm) {
      setMessage(resetForm.newPassword !== resetForm.confirm ? 'Passwords do not match.' : 'Invalid request.');
      return;
    }
    if (resetForm.newPassword.length < 8) {
      setMessage('Password must be at least 8 characters.');
      return;
    }
    setMessage('');
    setResetting(true);
    try {
      await resetAdminPassword(resetTarget.username, resetForm.newPassword);
      setMessage('Password reset successfully.');
      setResetTarget(null);
      setResetForm({ newPassword: '', confirm: '' });
    } catch (err) {
      setMessage(err.data?.error || err.message || 'Failed to reset password');
    } finally {
      setResetting(false);
    }
  };

  const handleDeleteAdmin = async (targetUsername) => {
    if (!targetUsername) return;
    const current = (username || '').toLowerCase();
    if (targetUsername.toLowerCase() === current) {
      setMessage('You cannot delete your own account.');
      return;
    }
    if (!window.confirm(`Remove admin "${targetUsername}"? They will no longer be able to log in.`)) return;
    setMessage('');
    setDeleting(targetUsername);
    try {
      await deleteAdmin(targetUsername);
      setMessage('Admin removed successfully.');
      loadAdmins();
    } catch (err) {
      setMessage(err.data?.error || err.message || 'Failed to delete admin');
    } finally {
      setDeleting(null);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      onLogout();
    } catch {
      onLogout();
    }
  };

  if (settings === null && !message) {
    return <div className="admin-loading">Loading…</div>;
  }

  const windowMinutes = Math.round(form.apiLimiterWindowMs / 60000);
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className={`admin-dashboard ${sidebarOpen ? 'admin-sidebar-open' : ''}`}>
      <div className="admin-sidebar-overlay" onClick={closeSidebar} aria-hidden="true" />
      <aside className="admin-sidebar">
        <div className="admin-sidebar-brand">
          <h1>🎭 Mafia Admin</h1>
          <p>Control panel</p>
        </div>
        <nav className="admin-sidebar-nav">
          <button type="button" className={`admin-nav-item ${tab === 'overview' ? 'active' : ''}`} onClick={() => { setTab('overview'); closeSidebar(); }}>
            <span>📊</span> Overview
          </button>
          <button type="button" className={`admin-nav-item ${tab === 'settings' ? 'active' : ''}`} onClick={() => { setTab('settings'); closeSidebar(); }}>
            <span>⚙️</span> Settings
          </button>
          <button type="button" className={`admin-nav-item ${tab === 'admins' ? 'active' : ''}`} onClick={() => { setTab('admins'); closeSidebar(); }}>
            <span>👤</span> Admins
          </button>
        </nav>
      </aside>

      <main className="admin-main">
        <header className="admin-main-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button type="button" className="admin-menu-btn" onClick={() => setSidebarOpen((v) => !v)} aria-label="Open menu">
              ☰
            </button>
            <h2 className="admin-main-title">
              {tab === 'overview' && 'Overview'}
              {tab === 'settings' && 'App settings'}
              {tab === 'admins' && 'Admin users'}
            </h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span className="admin-main-user">{username}</span>
            <button type="button" className="admin-btn admin-btn-ghost" onClick={handleLogout}>
              Log out
            </button>
          </div>
        </header>

        {message && (
          <div className={`admin-alert ${message.includes('Failed') || message.includes('match') ? 'admin-alert-error' : 'admin-alert-success'}`} style={{ marginBottom: 20 }}>
            {message}
          </div>
        )}

        {tab === 'overview' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 20, marginBottom: 28 }}>
              <div className="admin-stat-card">
                <div className="admin-stat-label">Total rooms</div>
                <div className="admin-stat-value">{stats?.roomCount ?? '–'}</div>
              </div>
              <div className="admin-stat-card highlight">
                <div className="admin-stat-label">Waiting lobbies</div>
                <div className="admin-stat-value">{stats?.waitingRooms ?? '–'}</div>
              </div>
              <div className="admin-stat-card">
                <div className="admin-stat-label">Games (total)</div>
                <div className="admin-stat-value">{stats?.gameCount ?? '–'}</div>
              </div>
              <div className="admin-stat-card">
                <div className="admin-stat-label">Admin users</div>
                <div className="admin-stat-value">{stats?.adminCount ?? '–'}</div>
              </div>
            </div>
            <div className="admin-card">
              <h3>Quick status</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                <span className={`admin-badge ${settings?.testingMode ? 'admin-badge-warning' : 'admin-badge-neutral'}`}>
                  Testing: {settings?.testingMode ? 'On' : 'Off'}
                </span>
                <span className={`admin-badge ${settings?.maintenanceMode ? 'admin-badge-danger' : 'admin-badge-neutral'}`}>
                  Maintenance: {settings?.maintenanceMode ? 'On' : 'Off'}
                </span>
                <span className="admin-badge admin-badge-neutral">
                  Players: {settings?.maxPlayersMin ?? 5}–{settings?.maxPlayersMax ?? 12}
                </span>
                <span className="admin-badge admin-badge-neutral">
                  Rate limit: {settings?.apiLimiterEnabled !== false ? 'On' : 'Off'}
                </span>
              </div>
            </div>
          </div>
        )}

        {tab === 'settings' && (
          <form onSubmit={handleSubmit} style={{ maxWidth: 640 }}>
            <section className="admin-card">
              <h3>Testing & gameplay</h3>
              <div className="admin-setting-row">
                <div className="admin-setting-copy">
                  <div className="admin-setting-title">Testing mode</div>
                  <div className="admin-setting-desc">New rooms get code 000000; existing test room is cleared</div>
                </div>
                <Toggle checked={form.testingMode} onChange={(v) => handleChange('testingMode', v)} />
              </div>
              <div className="admin-settings-grid mt">
                <div>
                  <label className="admin-label">Min players per room</label>
                  <input type="number" className="admin-input" min={3} max={12} value={form.maxPlayersMin} onChange={(e) => handleChange('maxPlayersMin', e.target.value)} />
                </div>
                <div>
                  <label className="admin-label">Max players per room</label>
                  <input type="number" className="admin-input" min={3} max={20} value={form.maxPlayersMax} onChange={(e) => handleChange('maxPlayersMax', e.target.value)} />
                </div>
              </div>
            </section>
            <section className="admin-card">
              <h3>API rate limit</h3>
              <div className="admin-setting-row" style={{ marginBottom: 20 }}>
                <div className="admin-setting-copy">
                  <div className="admin-setting-title">Enable rate limiting</div>
                  <div className="admin-setting-desc">Limit API requests per IP in a time window</div>
                </div>
                <Toggle checked={form.apiLimiterEnabled} onChange={(v) => handleChange('apiLimiterEnabled', v)} />
              </div>
              <div className="admin-settings-grid">
                <div>
                  <label className="admin-label">Window (minutes)</label>
                  <input type="number" className="admin-input" min={1} max={60} value={windowMinutes} onChange={(e) => handleChange('apiLimiterWindowMs', Number(e.target.value) * 60000)} />
                </div>
                <div>
                  <label className="admin-label">Max requests per window</label>
                  <input type="number" className="admin-input" min={10} max={1000} value={form.apiLimiterMax} onChange={(e) => handleChange('apiLimiterMax', e.target.value)} />
                </div>
              </div>
            </section>
            <section className="admin-card">
              <h3>Maintenance</h3>
              <div className="admin-setting-row" style={{ marginBottom: 20 }}>
                <div className="admin-setting-copy">
                  <div className="admin-setting-title">Maintenance mode</div>
                  <div className="admin-setting-desc">Game API returns 503; admin panel still works</div>
                </div>
                <Toggle checked={form.maintenanceMode} onChange={(v) => handleChange('maintenanceMode', v)} />
              </div>
              <div>
                <label className="admin-label">Message shown to users</label>
                <textarea rows={3} className="admin-input" value={form.maintenanceMessage} onChange={(e) => handleChange('maintenanceMessage', e.target.value)} placeholder="Under maintenance. Please try again later." />
              </div>
            </section>
            <button type="submit" className="admin-btn admin-btn-primary" disabled={saving}>
              {saving ? 'Saving…' : 'Save settings'}
            </button>
          </form>
        )}

        {tab === 'admins' && (
          <div>
            <div className="admin-tabs">
              <button type="button" className={adminsSubTab === 'add' ? 'active' : ''} onClick={() => setAdminsSubTab('add')}>
                Add admin
              </button>
              <button type="button" className={adminsSubTab === 'view' ? 'active' : ''} onClick={() => setAdminsSubTab('view')}>
                View admins
              </button>
            </div>

            {adminsSubTab === 'add' && (
              <section className="admin-card">
                <h3>Add a new admin</h3>
                <form onSubmit={handleAddAdmin} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 16, alignItems: 'end', flexWrap: 'wrap' }}>
                  <div>
                    <label className="admin-label">Username</label>
                    <input
                      type="text"
                      className="admin-input"
                      value={adminForm.username}
                      onChange={(e) => setAdminForm((f) => ({ ...f, username: e.target.value }))}
                      placeholder="newadmin"
                      required
                      autoComplete="off"
                    />
                  </div>
                  <div>
                    <label className="admin-label">Password (min 8)</label>
                    <input
                      type="password"
                      className="admin-input"
                      value={adminForm.password}
                      onChange={(e) => setAdminForm((f) => ({ ...f, password: e.target.value }))}
                      placeholder="••••••••"
                      required
                      minLength={8}
                      autoComplete="new-password"
                    />
                  </div>
                  <div>
                    <label className="admin-label">Confirm password</label>
                    <input
                      type="password"
                      className="admin-input"
                      value={adminForm.confirm}
                      onChange={(e) => setAdminForm((f) => ({ ...f, confirm: e.target.value }))}
                      placeholder="••••••••"
                      required
                      minLength={8}
                      autoComplete="new-password"
                    />
                  </div>
                  <button type="submit" className="admin-btn admin-btn-success" disabled={addingAdmin} style={{ height: 42 }}>
                    {addingAdmin ? 'Adding…' : 'Add admin'}
                  </button>
                </form>
              </section>
            )}

            {adminsSubTab === 'view' && (
              <section className="admin-card">
                <h3>Admin users</h3>
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Username</th>
                        <th>Created</th>
                        <th className="admin-table-actions">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {admins.length === 0 && (
                        <tr>
                          <td colSpan={3} className="admin-table-muted" style={{ padding: 32, textAlign: 'center' }}>
                            No admins yet. Add one in the Add admin tab.
                          </td>
                        </tr>
                      )}
                      {admins.map((a) => {
                        const isCurrent = (username || '').toLowerCase() === (a.username || '').toLowerCase();
                        return (
                          <tr key={a.username}>
                            <td>
                              {a.username}
                              {isCurrent && <span className="admin-table-muted" style={{ marginLeft: 8, fontSize: 12 }}>(you)</span>}
                            </td>
                            <td className="admin-table-muted">
                              {a.createdAt ? new Date(a.createdAt).toLocaleString() : '–'}
                            </td>
                            <td className="admin-table-actions">
                              <button type="button" className="admin-btn admin-btn-ghost" onClick={() => setResetTarget({ username: a.username })} disabled={isCurrent}>
                                Reset password
                              </button>
                              <button type="button" className="admin-btn admin-btn-danger" onClick={() => handleDeleteAdmin(a.username)} disabled={isCurrent || admins.length <= 1 || deleting === a.username}>
                                {deleting === a.username ? 'Removing…' : 'Delete'}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {resetTarget && (
              <div className="admin-modal-backdrop" onClick={() => !resetting && setResetTarget(null)}>
                <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
                  <h3>Reset password</h3>
                  <p>Set a new password for <strong style={{ color: 'var(--admin-text)' }}>{resetTarget.username}</strong>.</p>
                  <form onSubmit={handleResetPassword}>
                    <div className="admin-input-wrap">
                      <label className="admin-label">New password (min 8)</label>
                      <input type="password" className="admin-input" value={resetForm.newPassword} onChange={(e) => setResetForm((f) => ({ ...f, newPassword: e.target.value }))} placeholder="••••••••" minLength={8} autoComplete="new-password" required />
                    </div>
                    <div className="admin-input-wrap">
                      <label className="admin-label">Confirm password</label>
                      <input type="password" className="admin-input" value={resetForm.confirm} onChange={(e) => setResetForm((f) => ({ ...f, confirm: e.target.value }))} placeholder="••••••••" minLength={8} autoComplete="new-password" required />
                    </div>
                    <div className="admin-modal-actions">
                      <button type="button" className="admin-btn admin-btn-ghost" onClick={() => !resetting && setResetTarget(null)}>Cancel</button>
                      <button type="submit" className="admin-btn admin-btn-primary" disabled={resetting}>{resetting ? 'Resetting…' : 'Reset password'}</button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
