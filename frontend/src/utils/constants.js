// Re-export shared constants
export * from '../../../shared/constants.js';

// In dev with Vite proxy, use relative URL so /api and /socket.io are proxied (avoids CORS)
export const API_BASE_URL = import.meta.env.VITE_API_URL ?? (import.meta.env.DEV ? '' : 'http://localhost:3001');
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL ?? (import.meta.env.DEV ? '' : 'http://localhost:3001');
