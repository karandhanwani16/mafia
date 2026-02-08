import { useState, useEffect } from 'react';
import { getSettings, patchSettings, getStats, getAdmins, createAdmin, logout } from '../api';

const inputStyle = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 8,
  border: '1px solid #334155',
  background: '#1e293b',
  color: '#e2e8f0',
  fontSize: 14
};
const labelStyle = { display: 'block', marginBottom: 6, color: '#94a3b8', fontSize: 14 };
const sectionStyle = {
  background: '#1e293b',
  borderRadius: 12,
  padding: 24,
  marginBottom: 24,
  border: '1px solid #334155'
};

const navItem = (active) => ({
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '12px 16px',
  borderRadius: 8,
  border: 'none',
  width: '100%',
  textAlign: 'left',
  cursor: 'pointer',
  fontSize: 15,
  fontWeight: active ? 600 : 500,
  color: active ? '#f8fafc' : '#94a3b8',
  background: active ? 'rgba(59, 130, 246, 0.2)' : 'transparent'
});

export default function Dashboard({ username, onLogout }) {
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
    } catch (err) {
      setMessage(err.data?.error || err.message || 'Failed to add admin');
    } finally {
      setAddingAdmin(false);
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
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <span style={{ color: '#94a3b8' }}>Loading…</span>
      </div>
    );
  }

  const windowMinutes = Math.round(form.apiLimiterWindowMs / 60000);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0f172a' }}>
      {/* Sidebar */}
      <aside
        style={{
          width: 260,
          flexShrink: 0,
          background: '#1e293b',
          borderRight: '1px solid #334155',
          padding: '24px 0',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <div style={{ padding: '0 20px 24px', borderBottom: '1px solid #334155', marginBottom: 16 }}>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#f8fafc' }}>🎭 Mafia Admin</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>Control panel</p>
        </div>
        <nav style={{ padding: '0 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <button type="button" style={navItem(tab === 'overview')} onClick={() => setTab('overview')}>
            <span>📊</span> Overview
          </button>
          <button type="button" style={navItem(tab === 'settings')} onClick={() => setTab('settings')}>
            <span>⚙️</span> Settings
          </button>
          <button type="button" style={navItem(tab === 'admins')} onClick={() => setTab('admins')}>
            <span>👤</span> Admins
          </button>
        </nav>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, overflow: 'auto', padding: 24 }}>
        <header
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 28
          }}
        >
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 600, color: '#f8fafc' }}>
            {tab === 'overview' && 'Overview'}
            {tab === 'settings' && 'App settings'}
            {tab === 'admins' && 'Admin users'}
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ color: '#94a3b8', fontSize: 14 }}>{username}</span>
            <button
              type="button"
              onClick={handleLogout}
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                border: '1px solid #475569',
                background: 'transparent',
                color: '#e2e8f0',
                cursor: 'pointer',
                fontSize: 14
              }}
            >
              Log out
            </button>
          </div>
        </header>

        {message && (
          <div
            style={{
              padding: 12,
              borderRadius: 8,
              background: message.includes('Failed') || message.includes('match') ? 'rgba(127, 29, 29, 0.5)' : 'rgba(20, 83, 45, 0.5)',
              color: '#e2e8f0',
              marginBottom: 20,
              border: '1px solid ' + (message.includes('Failed') || message.includes('match') ? '#7f1d1d' : '#14532d')
            }}
          >
            {message}
          </div>
        )}

        {tab === 'overview' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 28 }}>
              <div style={sectionStyle}>
                <div style={{ color: '#94a3b8', fontSize: 13, marginBottom: 4 }}>Total rooms</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#f8fafc' }}>{stats?.roomCount ?? '–'}</div>
              </div>
              <div style={sectionStyle}>
                <div style={{ color: '#94a3b8', fontSize: 13, marginBottom: 4 }}>Waiting lobbies</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#38bdf8' }}>{stats?.waitingRooms ?? '–'}</div>
              </div>
              <div style={sectionStyle}>
                <div style={{ color: '#94a3b8', fontSize: 13, marginBottom: 4 }}>Games (total)</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#f8fafc' }}>{stats?.gameCount ?? '–'}</div>
              </div>
              <div style={sectionStyle}>
                <div style={{ color: '#94a3b8', fontSize: 13, marginBottom: 4 }}>Admin users</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#f8fafc' }}>{stats?.adminCount ?? '–'}</div>
              </div>
            </div>
            <div style={sectionStyle}>
              <h3 style={{ marginTop: 0, marginBottom: 16, color: '#f8fafc' }}>Quick status</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                <span
                  style={{
                    padding: '6px 12px',
                    borderRadius: 8,
                    background: settings?.testingMode ? 'rgba(234, 179, 8, 0.2)' : 'rgba(51, 65, 85, 0.5)',
                    color: settings?.testingMode ? '#facc15' : '#94a3b8',
                    fontSize: 14
                  }}
                >
                  Testing mode: {settings?.testingMode ? 'On' : 'Off'}
                </span>
                <span
                  style={{
                    padding: '6px 12px',
                    borderRadius: 8,
                    background: settings?.maintenanceMode ? 'rgba(239, 68, 68, 0.2)' : 'rgba(51, 65, 85, 0.5)',
                    color: settings?.maintenanceMode ? '#f87171' : '#94a3b8',
                    fontSize: 14
                  }}
                >
                  Maintenance: {settings?.maintenanceMode ? 'On' : 'Off'}
                </span>
                <span
                  style={{
                    padding: '6px 12px',
                    borderRadius: 8,
                    background: 'rgba(51, 65, 85, 0.5)',
                    color: '#94a3b8',
                    fontSize: 14
                  }}
                >
                  Players per room: {settings?.maxPlayersMin ?? 5}–{settings?.maxPlayersMax ?? 12}
                </span>
                <span
                  style={{
                    padding: '6px 12px',
                    borderRadius: 8,
                    background: settings?.apiLimiterEnabled !== false ? 'rgba(51, 65, 85, 0.5)' : 'rgba(51, 65, 85, 0.5)',
                    color: '#94a3b8',
                    fontSize: 14
                  }}
                >
                  Rate limit: {settings?.apiLimiterEnabled !== false ? 'On' : 'Off'}
                </span>
              </div>
            </div>
          </div>
        )}

        {tab === 'settings' && (
          <form onSubmit={handleSubmit}>
            <section style={sectionStyle}>
              <h3 style={{ marginTop: 0, marginBottom: 16, color: '#f8fafc' }}>Testing & gameplay</h3>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <input type="checkbox" checked={form.testingMode} onChange={(e) => handleChange('testingMode', e.target.checked)} />
                <span>Testing mode (new rooms get code 000000, existing test room cleared)</span>
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
                <div>
                  <label style={labelStyle}>Min players per room</label>
                  <input type="number" min={3} max={12} value={form.maxPlayersMin} onChange={(e) => handleChange('maxPlayersMin', e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Max players per room</label>
                  <input type="number" min={3} max={20} value={form.maxPlayersMax} onChange={(e) => handleChange('maxPlayersMax', e.target.value)} style={inputStyle} />
                </div>
              </div>
            </section>
            <section style={sectionStyle}>
              <h3 style={{ marginTop: 0, marginBottom: 16, color: '#f8fafc' }}>API rate limit</h3>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <input type="checkbox" checked={form.apiLimiterEnabled} onChange={(e) => handleChange('apiLimiterEnabled', e.target.checked)} />
                Enable API rate limiting
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={labelStyle}>Window (minutes)</label>
                  <input type="number" min={1} max={60} value={windowMinutes} onChange={(e) => handleChange('apiLimiterWindowMs', Number(e.target.value) * 60000)} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Max requests per window</label>
                  <input type="number" min={10} max={1000} value={form.apiLimiterMax} onChange={(e) => handleChange('apiLimiterMax', e.target.value)} style={inputStyle} />
                </div>
              </div>
            </section>
            <section style={sectionStyle}>
              <h3 style={{ marginTop: 0, marginBottom: 16, color: '#f8fafc' }}>Maintenance</h3>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <input type="checkbox" checked={form.maintenanceMode} onChange={(e) => handleChange('maintenanceMode', e.target.checked)} />
                Maintenance mode (game API returns 503; admin still works)
              </label>
              <div>
                <label style={labelStyle}>Message shown to users</label>
                <textarea rows={2} value={form.maintenanceMessage} onChange={(e) => handleChange('maintenanceMessage', e.target.value)} style={{ ...inputStyle, resize: 'vertical' }} />
              </div>
            </section>
            <button type="submit" disabled={saving} style={{ padding: '12px 24px', borderRadius: 8, border: 0, background: '#3b82f6', color: '#fff', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer' }}>
              {saving ? 'Saving…' : 'Save settings'}
            </button>
          </form>
        )}

        {tab === 'admins' && (
          <div>
            <section style={sectionStyle}>
              <h3 style={{ marginTop: 0, marginBottom: 16, color: '#f8fafc' }}>Add admin</h3>
              <form onSubmit={handleAddAdmin} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 16, alignItems: 'end', flexWrap: 'wrap' }}>
                <div>
                  <label style={labelStyle}>Username</label>
                  <input
                    type="text"
                    value={adminForm.username}
                    onChange={(e) => setAdminForm((f) => ({ ...f, username: e.target.value }))}
                    placeholder="newadmin"
                    style={inputStyle}
                    required
                    autoComplete="off"
                  />
                </div>
                <div>
                  <label style={labelStyle}>Password (min 8)</label>
                  <input
                    type="password"
                    value={adminForm.password}
                    onChange={(e) => setAdminForm((f) => ({ ...f, password: e.target.value }))}
                    placeholder="••••••••"
                    style={inputStyle}
                    required
                    minLength={8}
                    autoComplete="new-password"
                  />
                </div>
                <div>
                  <label style={labelStyle}>Confirm password</label>
                  <input
                    type="password"
                    value={adminForm.confirm}
                    onChange={(e) => setAdminForm((f) => ({ ...f, confirm: e.target.value }))}
                    placeholder="••••••••"
                    style={inputStyle}
                    required
                    minLength={8}
                    autoComplete="new-password"
                  />
                </div>
                <button type="submit" disabled={addingAdmin} style={{ padding: '10px 20px', borderRadius: 8, border: 0, background: '#22c55e', color: '#fff', fontWeight: 600, cursor: addingAdmin ? 'not-allowed' : 'pointer', height: 40 }}>
                  {addingAdmin ? 'Adding…' : 'Add admin'}
                </button>
              </form>
            </section>
            <section style={sectionStyle}>
              <h3 style={{ marginTop: 0, marginBottom: 16, color: '#f8fafc' }}>Admin users</h3>
              <div style={{ overflow: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #334155' }}>
                      <th style={{ textAlign: 'left', padding: '12px 0', color: '#94a3b8', fontWeight: 600, fontSize: 13 }}>Username</th>
                      <th style={{ textAlign: 'left', padding: '12px 0', color: '#94a3b8', fontWeight: 600, fontSize: 13 }}>Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {admins.length === 0 && (
                      <tr>
                        <td colSpan={2} style={{ padding: 24, color: '#64748b', textAlign: 'center' }}>
                          No admins listed. Add one above.
                        </td>
                      </tr>
                    )}
                    {admins.map((a) => (
                      <tr key={a.username} style={{ borderBottom: '1px solid #334155' }}>
                        <td style={{ padding: '12px 0', color: '#f8fafc' }}>{a.username}</td>
                        <td style={{ padding: '12px 0', color: '#94a3b8', fontSize: 14 }}>
                          {a.createdAt ? new Date(a.createdAt).toLocaleString() : '–'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
