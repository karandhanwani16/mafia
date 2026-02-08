import { useState } from 'react';
import { setup } from '../api';

export default function Setup({ onDone }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    setLoading(true);
    try {
      await setup(username.trim(), password);
      onDone();
      window.location.href = '/login';
    } catch (err) {
      setError(err.data?.error || err.message || 'Setup failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="admin-auth-page">
      <div className="admin-auth-card">
        <h1>🎭 Create first admin</h1>
        <p className="admin-auth-subtitle">No admin exists yet. Create an account to access the panel.</p>
        <form onSubmit={handleSubmit}>
          {error && (
            <div className="admin-alert admin-alert-error">{error}</div>
          )}
          <div className="admin-input-wrap">
            <label htmlFor="setup-username">Username</label>
            <input
              id="setup-username"
              type="text"
              className="admin-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="admin-input-wrap">
            <label htmlFor="setup-password">Password (min 8 characters)</label>
            <input
              id="setup-password"
              type="password"
              className="admin-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
            />
          </div>
          <div className="admin-input-wrap">
            <label htmlFor="setup-confirm">Confirm password</label>
            <input
              id="setup-confirm"
              type="password"
              className="admin-input"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="admin-btn admin-btn-success" disabled={loading}>
            {loading ? 'Creating…' : 'Create admin'}
          </button>
        </form>
      </div>
    </div>
  );
}
