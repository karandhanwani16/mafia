import mongoose from 'mongoose';

const gameSchema = new mongoose.Schema({
  gameId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  roomId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  phase: {
    type: String,
    enum: ['night', 'day', 'voting', 'results'],
    default: 'night'
  },
  nightStep: {
    type: String,
    enum: ['mafia', 'doctor', 'detective'],
    default: 'mafia'
  },
  round: {
    type: Number,
    default: 1
  },
  players: [{
    playerId: String,
    username: String,
    role: String,
    isAlive: Boolean
  }],
  eliminatedPlayers: [{
    type: String
  }],
  nightActions: {
    mafia: {
      targetId: String,
      submitted: Boolean
    },
    doctor: {
      targetId: String,
      submitted: Boolean
    },
    detective: {
      targetId: String,
      submitted: Boolean,
      result: String
    }
  },
  votes: [{
    voterId: String,
    targetId: String,
    timestamp: Date
  }],
  voteResults: [{
    round: Number,
    votes: [{
      voterId: String,
      targetId: String
    }],
    eliminated: String,
    timestamp: Date
  }],
  winner: {
    type: String,
    enum: ['mafia', 'villagers', null],
    default: null
  },
  phaseStartTime: {
    type: Date,
    default: Date.now
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

gameSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model('Game', gameSchema);
