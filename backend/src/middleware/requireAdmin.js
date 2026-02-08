import { verifyAdminToken } from '../utils/adminToken.js';

export function requireAdmin(req, res, next) {
  if (req.session?.adminId) return next();
  const auth = req.headers.authorization;
  const token = auth?.startsWith('Bearer ') ? auth.slice(7).trim() : null;
  if (token) {
    const secret = process.env.SESSION_SECRET || 'change-me-in-production-admin';
    const payload = verifyAdminToken(token, secret);
    if (payload) {
      req.adminId = payload.adminId;
      req.adminUsername = payload.username;
      return next();
    }
  }
  res.status(401).json({ error: 'Unauthorized', message: 'Admin login required' });
}
