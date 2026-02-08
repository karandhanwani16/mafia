import { useState, useEffect } from 'react';
import { getSettings, patchSettings, logout } from '../api';

const inputStyle = { width: '100%', padding: 10, borderRadius: 8, border: '1px solid #334155', background: '#1e293b', color: '#e2e8f0' };
const labelStyle = { display: 'block', marginBottom: 6 };
const sectionStyle = { background: '#1e293b', borderRadius: 12, padding: 20, marginBottom: 20 };

export default function Dashboard({ username, onLogout }) {
  const [settings, setSettings] = useState(null);
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

  useEffect(() => {
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
  }, []);

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
    } catch (err) {
      setMessage(err.data?.error || err.message || 'Failed to save');
    } finally {
      setSaving(false);
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
    return <div style={{ padding: 24 }}>Loading settings…</div>;
  }

  const windowMinutes = Math.round(form.apiLimiterWindowMs / 60000);

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: 24 }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ margin: 0 }}>Mafia Admin</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ color: '#94a3b8' }}>{username}</span>
          <button
            type="button"
            onClick={handleLogout}
            style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #475569', background: 'transparent', color: '#e2e8f0', cursor: 'pointer' }}
          >
            Log out
          </button>
        </div>
      </header>

      {message && (
        <p style={{ padding: 12, borderRadius: 8, background: message.includes('Failed') ? '#7f1d1d' : '#14532d', color: '#e2e8f0', marginBottom: 20 }}>
          {message}
        </p>
      )}

      <form onSubmit={handleSubmit}>
        <section style={sectionStyle}>
          <h2 style={{ marginTop: 0, marginBottom: 16 }}>Testing &amp; gameplay</h2>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <input
              type="checkbox"
              checked={form.testingMode}
              onChange={(e) => handleChange('testingMode', e.target.checked)}
            />
            Testing mode (new rooms get code 000000, existing test room cleared)
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
            <div>
              <label style={labelStyle}>Min players per room</label>
              <input
                type="number"
                min={3}
                max={12}
                value={form.maxPlayersMin}
                onChange={(e) => handleChange('maxPlayersMin', e.target.value)}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Max players per room</label>
              <input
                type="number"
                min={3}
                max={20}
                value={form.maxPlayersMax}
                onChange={(e) => handleChange('maxPlayersMax', e.target.value)}
                style={inputStyle}
              />
            </div>
          </div>
        </section>

        <section style={sectionStyle}>
          <h2 style={{ marginTop: 0, marginBottom: 16 }}>API rate limit</h2>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <input
              type="checkbox"
              checked={form.apiLimiterEnabled}
              onChange={(e) => handleChange('apiLimiterEnabled', e.target.checked)}
            />
            Enable API rate limiting
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={labelStyle}>Window (minutes)</label>
              <input
                type="number"
                min={1}
                max={60}
                value={windowMinutes}
                onChange={(e) => handleChange('apiLimiterWindowMs', Number(e.target.value) * 60000)}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Max requests per window</label>
              <input
                type="number"
                min={10}
                max={1000}
                value={form.apiLimiterMax}
                onChange={(e) => handleChange('apiLimiterMax', e.target.value)}
                style={inputStyle}
              />
            </div>
          </div>
        </section>

        <section style={sectionStyle}>
          <h2 style={{ marginTop: 0, marginBottom: 16 }}>Maintenance</h2>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <input
              type="checkbox"
              checked={form.maintenanceMode}
              onChange={(e) => handleChange('maintenanceMode', e.target.checked)}
            />
            Maintenance mode (game API returns 503; admin still works)
          </label>
          <div>
            <label style={labelStyle}>Message shown to users</label>
            <textarea
              rows={2}
              value={form.maintenanceMessage}
              onChange={(e) => handleChange('maintenanceMessage', e.target.value)}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </div>
        </section>

        <button
          type="submit"
          disabled={saving}
          style={{ padding: '12px 24px', borderRadius: 8, border: 0, background: '#3b82f6', color: '#fff', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer' }}
        >
          {saving ? 'Saving…' : 'Save settings'}
        </button>
      </form>
    </div>
  );
}
