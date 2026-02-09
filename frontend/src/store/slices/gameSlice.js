import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { gameAPI } from '../../services/api';

const initialState = {
  gameId: null,
  phase: null,
  nightStep: null, // 'mafia' | 'doctor' | 'detective' during night
  round: 1,
  players: [],
  eliminatedPlayers: [],
  nightActions: {},
  votes: [],
  voteCount: {},
  winner: null,
  phaseStartTime: null,
  detectiveResult: null,
  lastDayDetectiveResult: null,
  lastNightEliminated: null, // playerId of who died last night (null = no one)
  loading: false,
  error: null
};

const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {
    setGameState: (state, action) => {
      return {
        ...state,
        ...action.payload,
        loading: false,
        error: null
      };
    },
    updatePhase: (state, action) => {
      state.phase = action.payload.phase;
      state.round = action.payload.round ?? state.round;
      state.nightStep = action.payload.nightStep ?? (action.payload.phase === 'night' ? 'mafia' : null);
      state.phaseStartTime = action.payload.phaseStartTime || new Date().toISOString();
      if (action.payload.phase === 'night') {
        state.lastDayDetectiveResult = null;
        state.lastNightEliminated = null;
        state.votes = [];
        state.voteCount = {};
      }
    },
    setNightStep: (state, action) => {
      state.nightStep = action.payload;
    },
    addPlayer: (state, action) => {
      if (!state.players.find(p => p.playerId === action.payload.playerId)) {
        state.players.push(action.payload);
      }
    },
    eliminatePlayer: (state, action) => {
      const playerId = action.payload;
      if (!state.eliminatedPlayers.includes(playerId)) {
        state.eliminatedPlayers.push(playerId);
      }
      const player = state.players.find(p => p.playerId === playerId);
      if (player) {
        player.isAlive = false;
      }
    },
    recordVote: (state, action) => {
      const { voterId, targetId } = action.payload;
      state.votes = state.votes.filter(v => v.voterId !== voterId);
      state.votes.push({ voterId, targetId });
    },
    setVoteCount: (state, action) => {
      state.voteCount = action.payload;
    },
    setVotes: (state, action) => {
      state.votes = action.payload;
    },
    setWinner: (state, action) => {
      state.winner = action.payload;
      state.phase = 'results';
    },
    setDetectiveResult: (state, action) => {
      state.detectiveResult = action.payload;
    },
    setLastDayDetectiveResult: (state, action) => {
      state.lastDayDetectiveResult = action.payload;
    },
    setLastNightEliminated: (state, action) => {
      state.lastNightEliminated = action.payload;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },
    resetGame: () => initialState
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchGameState.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchGameState.fulfilled, (state, action) => {
        return {
          ...state,
          ...action.payload,
          loading: false,
          error: null
        };
      })
      .addCase(fetchGameState.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  }
});

export const fetchGameState = createAsyncThunk(
  'game/fetchGameState',
  async ({ gameId, playerId }) => {
    const response = await gameAPI.getGameState(gameId, playerId);
    return response.data;
  }
);

export const {
  setGameState,
  updatePhase,
  setNightStep,
  addPlayer,
  eliminatePlayer,
  recordVote,
  setVoteCount,
  setVotes,
  setWinner,
  setDetectiveResult,
  setLastDayDetectiveResult,
  setLastNightEliminated,
  setLoading,
  setError,
  resetGame
} = gameSlice.actions;

export default gameSlice.reducer;
