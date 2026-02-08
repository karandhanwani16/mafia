import AppSettings from '../models/AppSettings.js';

let cached = null;

export async function getSettings() {
  if (cached) return cached;
  const doc = await AppSettings.findById('default').lean();
  if (doc) {
    cached = doc;
    return cached;
  }
  await ensureDefaults();
  return getSettings();
}

export async function ensureDefaults() {
  const existing = await AppSettings.findById('default');
  if (existing) return existing;
  await AppSettings.create({
    _id: 'default',
    testingMode: false,
    apiLimiterEnabled: true,
    apiLimiterWindowMs: 15 * 60 * 1000,
    apiLimiterMax: 100,
    maxPlayersMin: 5,
    maxPlayersMax: 12,
    maintenanceMode: false,
    maintenanceMessage: 'Under maintenance. Please try again later.'
  });
  cached = null;
  return AppSettings.findById('default').lean();
}

export async function updateSettings(updates) {
  const allowed = [
    'testingMode', 'apiLimiterEnabled', 'apiLimiterWindowMs', 'apiLimiterMax',
    'maxPlayersMin', 'maxPlayersMax', 'maintenanceMode', 'maintenanceMessage'
  ];
  const sanitized = {};
  for (const key of allowed) {
    if (updates[key] !== undefined) sanitized[key] = updates[key];
  }
  if (Object.keys(sanitized).length === 0) {
    return getSettings();
  }
  await AppSettings.findOneAndUpdate(
    { _id: 'default' },
    { $set: sanitized },
    { upsert: true, new: true }
  );
  cached = null;
  return getSettings();
}

export function clearSettingsCache() {
  cached = null;
}
