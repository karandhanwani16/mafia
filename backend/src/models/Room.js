import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  roomCode: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  hostId: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['waiting', 'in_progress', 'finished'],
    default: 'waiting'
  },
  maxPlayers: {
    type: Number,
    required: true,
    min: 3,
    max: 20
  },
  currentPlayers: [{
    type: String // player IDs
  }],
  settings: {
    nightPhaseDuration: {
      type: Number,
      default: 90
    },
    dayDiscussionDuration: {
      type: Number,
      default: 300
    },
    votingDuration: {
      type: Number,
      default: 60
    },
    roles: {
      doctor: {
        type: Boolean,
        default: true
      },
      detective: {
        type: Boolean,
        default: true
      }
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

roomSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model('Room', roomSchema);
