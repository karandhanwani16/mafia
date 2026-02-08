import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  currentPlayer: {
    playerId: null,
    username: null,
    role: null,
    isAlive: true
  },
  socketConnected: false
};

const playerSlice = createSlice({
  name: 'player',
  initialState,
  reducers: {
    setPlayer: (state, action) => {
      state.currentPlayer = {
        ...state.currentPlayer,
        ...action.payload
      };
    },
    setRole: (state, action) => {
      state.currentPlayer.role = action.payload;
    },
    setAliveStatus: (state, action) => {
      state.currentPlayer.isAlive = action.payload;
    },
    setSocketStatus: (state, action) => {
      state.socketConnected = action.payload;
    },
    resetPlayer: () => initialState
  }
});

export const {
  setPlayer,
  setRole,
  setAliveStatus,
  setSocketStatus,
  resetPlayer
} = playerSlice.actions;

export default playerSlice.reducer;
