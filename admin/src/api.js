const base = import.meta.env.VITE_API_URL || '';

async function request(path, options = {}) {
  const res = await fetch(`${base}${path}`, {
    ...options,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options.headers }
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
  return request('/api/admin/login', {
    method: 'POST',
    body: JSON.stringify({ username, password })
  });
}

export async function logout() {
  return request('/api/admin/logout', { method: 'POST' });
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
