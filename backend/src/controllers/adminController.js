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

export async function listAdmins(req, res) {
  try {
    const admins = await AdminUser.find({}).select('username createdAt').sort({ createdAt: 1 }).lean();
    res.json({ admins: admins.map((a) => ({ username: a.username, createdAt: a.createdAt })) });
  } catch (err) {
    console.error('[admin listAdmins]', err?.message);
    res.status(500).json({ error: 'Failed to list admins' });
  }
}

export async function createAdmin(req, res) {
  try {
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
    res.status(201).json({ message: 'Admin added successfully.' });
  } catch (err) {
    console.error('[admin createAdmin]', err?.message);
    res.status(500).json({ error: 'Failed to add admin' });
  }
}

function currentUsername(req) {
  return (req.session?.adminUsername ?? req.adminUsername ?? '').toLowerCase();
}

export async function resetAdminPassword(req, res) {
  try {
    const targetUsername = (req.params.username || '').toLowerCase();
    const current = currentUsername(req);
    if (targetUsername === current) {
      return res.status(400).json({ error: 'Use your profile or login to change your own password' });
    }
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters' });
    }
    const admin = await AdminUser.findOne({ username: targetUsername });
    if (!admin) {
      return res.status(404).json({ error: 'Admin not found' });
    }
    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await AdminUser.updateOne({ username: targetUsername }, { $set: { passwordHash } });
    res.json({ message: 'Password reset successfully.' });
  } catch (err) {
    console.error('[admin resetAdminPassword]', err?.message);
    res.status(500).json({ error: 'Failed to reset password' });
  }
}

export async function deleteAdmin(req, res) {
  try {
    const targetUsername = (req.params.username || '').toLowerCase();
    const current = currentUsername(req);
    if (targetUsername === current) {
      return res.status(400).json({ error: 'You cannot delete your own account' });
    }
    const count = await AdminUser.countDocuments();
    if (count <= 1) {
      return res.status(400).json({ error: 'Cannot delete the last admin' });
    }
    const result = await AdminUser.deleteOne({ username: targetUsername });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Admin not found' });
    }
    res.json({ message: 'Admin removed successfully.' });
  } catch (err) {
    console.error('[admin deleteAdmin]', err?.message);
    res.status(500).json({ error: 'Failed to delete admin' });
  }
}

export async function getStats(req, res) {
  try {
    const Room = (await import('../models/Room.js')).default;
    const Game = (await import('../models/Game.js')).default;
    const [roomCount, gameCount, waitingRooms, adminCount] = await Promise.all([
      Room.countDocuments(),
      Game.countDocuments(),
      Room.countDocuments({ status: 'waiting' }),
      AdminUser.countDocuments()
    ]);
    const settings = await getSettings();
    res.json({
      roomCount,
      gameCount,
      waitingRooms,
      inProgressRooms: roomCount - waitingRooms,
      adminCount,
      testingMode: !!settings?.testingMode,
      maintenanceMode: !!settings?.maintenanceMode,
      maxPlayersMin: settings?.maxPlayersMin ?? 5,
      maxPlayersMax: settings?.maxPlayersMax ?? 12
    });
  } catch (err) {
    console.error('[admin getStats]', err?.message);
    res.status(500).json({ error: 'Failed to load stats' });
  }
}
