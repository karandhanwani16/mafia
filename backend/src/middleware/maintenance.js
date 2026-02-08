import { getSettings } from '../services/settingsService.js';

export function maintenanceMiddleware(req, res, next) {
  if (req.path === '/health') return next();
  if (req.path.startsWith('/api/admin')) return next();
  getSettings()
    .then((s) => {
      if (s?.maintenanceMode) {
        return res.status(503).json({
          error: 'maintenance',
          message: s.maintenanceMessage || 'Under maintenance. Please try again later.'
        });
      }
      next();
    })
    .catch(() => next());
}
