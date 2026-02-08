export function requireAdmin(req, res, next) {
  if (req.session?.adminId) return next();
  res.status(401).json({ error: 'Unauthorized', message: 'Admin login required' });
}
