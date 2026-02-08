import mongoose from 'mongoose';

const appSettingsSchema = new mongoose.Schema({
  _id: { type: String, default: 'default' },
  testingMode: { type: Boolean, default: false },
  apiLimiterEnabled: { type: Boolean, default: true },
  apiLimiterWindowMs: { type: Number, default: 15 * 60 * 1000 }, // 15 min
  apiLimiterMax: { type: Number, default: 100 },
  maxPlayersMin: { type: Number, default: 5 },
  maxPlayersMax: { type: Number, default: 12 },
  maintenanceMode: { type: Boolean, default: false },
  maintenanceMessage: { type: String, default: 'Under maintenance. Please try again later.' },
  updatedAt: { type: Date, default: Date.now }
});

appSettingsSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model('AppSettings', appSettingsSchema, 'app_settings');
