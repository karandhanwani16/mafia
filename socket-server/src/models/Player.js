import mongoose from 'mongoose';

const playerSchema = new mongoose.Schema({
  playerId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  username: {
    type: String,
    required: true,
    trim: true,
    maxlength: 20
  },
  socketId: { type: String, index: true },
  roomId: {
    type: String,
    required: true,
    index: true
  },
  role: {
    type: String,
    enum: ['mafia', 'civilian', 'doctor', 'detective'],
    default: null
  },
  isAlive: { type: Boolean, default: true },
  votesReceived: [{ type: String }],
  actions: [{
    round: Number,
    phase: String,
    actionType: String,
    targetId: String,
    timestamp: Date
  }],
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Player', playerSchema);
