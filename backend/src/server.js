import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDatabase from './config/database.js';
import roomRoutes from './routes/rooms.js';
import gameRoutes from './routes/game.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/rooms', roomRoutes);
app.use('/api/game', gameRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'api', timestamp: new Date().toISOString() });
});

app.use((err, req, res, next) => {
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

const PORT = process.env.PORT || 3001;

const startServer = async () => {
  try {
    await connectDatabase();
    const host = process.env.HOST || '0.0.0.0';
    app.listen(PORT, host, () => {
      console.log(`Server is running on http://${host}:${PORT}`);
    });
  } catch (error) {
    process.exit(1);
  }
};

startServer();
