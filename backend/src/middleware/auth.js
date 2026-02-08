import rateLimit from 'express-rate-limit';
import { getSettings } from '../services/settingsService.js';
import { checkAndIncrement } from './rateLimitStore.js';

const API_LIMITER_ENABLED_ENV = process.env.API_LIMITER_ENABLED !== 'false';

export function apiLimiter(req, res, next) {
  getSettings()
    .then((s) => {
      const enabled = s?.apiLimiterEnabled ?? API_LIMITER_ENABLED_ENV;
      if (!enabled) return next();
      const windowMs = s?.apiLimiterWindowMs ?? 15 * 60 * 1000;
      const max = s?.apiLimiterMax ?? 100;
      const ip = req.ip || req.socket?.remoteAddress || 'unknown';
      const { allowed, remaining } = checkAndIncrement(ip, windowMs, max);
      res.setHeader('X-RateLimit-Remaining', String(remaining));
      if (!allowed) {
        return res.status(429).json({
          error: 'Too many requests from this IP, please try again later.'
        });
      }
      next();
    })
    .catch((err) => {
      console.error('[apiLimiter] getSettings failed', err?.message);
      next();
    });
}

export const socketLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 30,
  message: 'Too many socket events, please slow down.'
});

export const authenticateSocket = (socket, next) => {
  next();
};
