import AdminUser from '../models/AdminUser.js';
import bcrypt from 'bcrypt';
import { getSettings, updateSettings } from '../services/settingsService.js';
import { createAdminToken } from '../utils/adminToken.js';

const SALT_ROUNDS = 10;

export async function login(req, res) {
  try {
    const { username, password } = req.body;
    if (!username?.trim() || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }
    const admin = await AdminUser.findOne({ username: username.trim().toLowerCase() });
    if (!admin) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    const match = await bcrypt.compare(password, admin.passwordHash);
    if (!match) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    const adminId = admin._id.toString();
    req.session.adminId = adminId;
    req.session.adminUsername = admin.username;
    const secret = process.env.SESSION_SECRET || 'change-me-in-production-admin';
    const token = createAdminToken({ adminId, username: admin.username }, secret);
    return res.json({ ok: true, username: admin.username, token });
  } catch (err) {
    console.error('[admin login]', err?.message);
    res.status(500).json({ error: 'Login failed' });
  }
}

export function logout(req, res) {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ error: 'Logout failed' });
    res.clearCookie('admin.sid');
    res.json({ ok: true });
  });
}

export function me(req, res) {
  const username = req.session?.adminUsername ?? req.adminUsername;
  if (!req.session?.adminId && !req.adminId) {
    return res.status(401).json({ error: 'Not logged in' });
  }
  res.json({ username });
}

export async function getSettingsHandler(req, res) {
  try {
    const settings = await getSettings();
    res.json(settings);
  } catch (err) {
    console.error('[admin getSettings]', err?.message);
    res.status(500).json({ error: 'Failed to load settings' });
  }
}

export async function patchSettingsHandler(req, res) {
  try {
    const settings = await updateSettings(req.body);
    res.json(settings);
  } catch (err) {
    console.error('[admin patchSettings]', err?.message);
    res.status(500).json({ error: 'Failed to update settings' });
  }
}

export async function needsSetup(req, res) {
  try {
    const count = await AdminUser.countDocuments();
    res.json({ needsSetup: count === 0 });
  } catch (err) {
    res.status(500).json({ needsSetup: true });
  }
}

export async function createFirstAdmin(req, res) {
  const count = await AdminUser.countDocuments();
  if (count > 0) {
    return res.status(403).json({ error: 'Admin users already exist' });
  }
  const { username, password } = req.body;
  if (!username?.trim() || !password || password.length < 8) {
    return res.status(400).json({ error: 'Username and password (min 8 chars) required' });
  }
  const existing = await AdminUser.findOne({ username: username.trim().toLowerCase() });
  if (existing) {
    return res.status(409).json({ error: 'Username already taken' });
  }
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  await AdminUser.create({
    username: username.trim().toLowerCase(),
    passwordHash
  });
  res.status(201).json({ message: 'Admin created. You can now log in.' });
}
