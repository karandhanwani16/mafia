import { useState } from 'react';
import { login } from '../api';

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await login(username.trim(), password);
      onLogin(data.username);
    } catch (err) {
      setError(err.data?.error || err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="admin-auth-page">
      <div className="admin-auth-card">
        <h1>🎭 Mafia Admin</h1>
        <p className="admin-auth-subtitle">Sign in to manage settings and admins.</p>
        <form onSubmit={handleSubmit}>
          {error && (
            <div className="admin-alert admin-alert-error">{error}</div>
          )}
          <div className="admin-input-wrap">
            <label htmlFor="login-username">Username</label>
            <input
              id="login-username"
              type="text"
              className="admin-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
            />
          </div>
          <div className="admin-input-wrap">
            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              className="admin-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>
          <button type="submit" className="admin-btn admin-btn-primary" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
