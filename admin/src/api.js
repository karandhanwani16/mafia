const base = import.meta.env.VITE_API_URL || '';

const ADMIN_TOKEN_KEY = 'admin_token';

export function getStoredToken() {
  try {
    return sessionStorage.getItem(ADMIN_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token) {
  try {
    if (token) sessionStorage.setItem(ADMIN_TOKEN_KEY, token);
    else sessionStorage.removeItem(ADMIN_TOKEN_KEY);
  } catch {}
}

async function request(path, options = {}) {
  const token = getStoredToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${base}${path}`, {
    ...options,
    credentials: 'include',
    headers
  });
  const data = res.ok ? await res.json().catch(() => ({})) : null;
  if (!res.ok) {
    const err = new Error(data?.message || data?.error || res.statusText);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export async function getMe() {
  return request('/api/admin/me');
}

export async function getNeedsSetup() {
  return request('/api/admin/needs-setup');
}

export async function login(username, password) {
  const data = await request('/api/admin/login', {
    method: 'POST',
    body: JSON.stringify({ username, password })
  });
  if (data?.token) setStoredToken(data.token);
  return data;
}

export async function logout() {
  try {
    return await request('/api/admin/logout', { method: 'POST' });
  } finally {
    setStoredToken(null);
  }
}

export async function setup(username, password) {
  return request('/api/admin/setup', {
    method: 'POST',
    body: JSON.stringify({ username, password })
  });
}

export async function getSettings() {
  return request('/api/admin/settings');
}

export async function patchSettings(updates) {
  return request('/api/admin/settings', {
    method: 'PATCH',
    body: JSON.stringify(updates)
  });
}

export async function getStats() {
  return request('/api/admin/stats');
}

export async function getAdmins() {
  return request('/api/admin/admins');
}

export async function createAdmin(username, password) {
  return request('/api/admin/admins', {
    method: 'POST',
    body: JSON.stringify({ username, password })
  });
}

export async function resetAdminPassword(username, newPassword) {
  return request(`/api/admin/admins/${encodeURIComponent(username)}/reset-password`, {
    method: 'POST',
    body: JSON.stringify({ newPassword })
  });
}

export async function deleteAdmin(username) {
  return request(`/api/admin/admins/${encodeURIComponent(username)}`, {
    method: 'DELETE'
  });
}
