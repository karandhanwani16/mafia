import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDatabase from './config/database.js';
import { createSocketServer } from './config/socket.js';
import { setupSocketHandlers } from './socket/socketHandlers.js';

dotenv.config();

const app = express();
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
}));
app.use(express.json());

const API_KEY = process.env.INTERNAL_API_KEY || 'dev-internal-key';

app.post('/internal/emit', (req, res) => {
  const key = req.headers['x-internal-key'] || req.body?.internalKey;
  if (key !== API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const { roomId, events } = req.body;
  if (!roomId || !Array.isArray(events) || events.length === 0) {
    return res.status(400).json({ error: 'roomId and events[] required' });
  }
  const io = req.app.get('io');
  if (!io) return res.status(503).json({ error: 'Socket server not ready' });
  const room = io.sockets.adapter.rooms.get(roomId);
  const socketCount = room ? room.size : 0;
  const eventList = events.map(e => e.event).join(', ');
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[internal/emit] roomId=${roomId?.slice(0, 8)}... socketsInRoom=${socketCount} events=${eventList}`);
    if (eventList.includes('gameStarted') && socketCount < 2) {
      console.warn(`[internal/emit] WARNING: gameStarted emitted but only ${socketCount} socket(s) in room. Non-host players may not receive it (they must join the socket room from the lobby).`);
    }
  }
  for (const { event, payload } of events) {
    if (event && payload !== undefined) io.to(roomId).emit(event, payload);
  }
  res.json({ ok: true });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'socket-server', timestamp: new Date().toISOString() });
});

const httpServer = createServer(app);
const io = createSocketServer(httpServer);
setupSocketHandlers(io);
app.set('io', io);

const PORT = process.env.PORT || 3002;

const start = async () => {
  await connectDatabase();
  const host = process.env.HOST || '0.0.0.0';
  httpServer.listen(PORT, host, () => {
    console.log(`Socket server running on http://${host}:${PORT}`);
  });
};

start().catch(() => process.exit(1));
