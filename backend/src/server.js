import express from 'express';
import cors from 'cors';
import session from 'express-session';
import dotenv from 'dotenv';
import connectDatabase from './config/database.js';
import { ensureDefaults, getSettings } from './services/settingsService.js';
import roomRoutes from './routes/rooms.js';
import gameRoutes from './routes/game.js';
import adminRoutes from './routes/admin.js';
import { maintenanceMiddleware } from './middleware/maintenance.js';

dotenv.config();

const app = express();

// Required when behind a reverse proxy (e.g. nginx) so session cookies and req.secure work correctly
app.set('trust proxy', 1);

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const sessionSecret = process.env.SESSION_SECRET || 'change-me-in-production-admin';
app.use(session({
  name: 'admin.sid',
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000,
    sameSite: 'lax'
  }
}));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'api', timestamp: new Date().toISOString() });
});

// Public app config for frontend (e.g. testing mode, min/max players from DB)
app.get('/api/app-config', async (req, res) => {
  try {
    const settings = await getSettings();
    res.json({
      testingMode: !!settings?.testingMode,
      maxPlayersMin: settings?.maxPlayersMin ?? 5,
      maxPlayersMax: settings?.maxPlayersMax ?? 12
    });
  } catch (err) {
    res.json({ testingMode: false, maxPlayersMin: 5, maxPlayersMax: 12 });
  }
});

app.use(maintenanceMiddleware);

app.use('/api/rooms', roomRoutes);
app.use('/api/game', gameRoutes);
app.use('/api/admin', adminRoutes);

app.use((err, req, res, next) => {
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

const PORT = process.env.PORT || 3001;

const startServer = async () => {
  try {
    await connectDatabase();
    await ensureDefaults();
    const host = process.env.HOST || '0.0.0.0';
    app.listen(PORT, host, () => {
      console.log(`Server is running on http://${host}:${PORT}`);
    });
  } catch (error) {
    process.exit(1);
  }
};

startServer();
