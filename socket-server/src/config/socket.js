import { Server } from 'socket.io';

export const createSocketServer = (httpServer) => {
  const allowedOrigins = [
    'http://localhost:5173',
    ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : [])
  ].filter(Boolean);

  // In development, accept any origin so devices on LAN (e.g. http://192.168.x.x:5173) can connect without exact FRONTEND_URL match
  const isDev = process.env.NODE_ENV !== 'production';
  const corsOrigin = isDev
    ? true
    : allowedOrigins;

  const io = new Server(httpServer, {
    path: '/socket.io',
    cors: {
      origin: corsOrigin,
      methods: ['GET', 'POST'],
      credentials: true
    }
  });
  return io;
};
