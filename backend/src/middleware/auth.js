import rateLimit from 'express-rate-limit';

// Set API_LIMITER_ENABLED=false in .env to disable rate limiting (e.g. for local dev)
const API_LIMITER_ENABLED = process.env.API_LIMITER_ENABLED !== 'false';

const apiLimiterImpl = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

// Apply rate limit when enabled; no-op when disabled
export const apiLimiter = API_LIMITER_ENABLED ? apiLimiterImpl : (req, res, next) => next();

export const socketLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // limit each IP to 30 socket events per minute
  message: 'Too many socket events, please slow down.'
});

// Simple authentication middleware (can be enhanced with JWT)
export const authenticateSocket = (socket, next) => {
  // For now, just allow connection
  // Can add token verification here
  next();
};
