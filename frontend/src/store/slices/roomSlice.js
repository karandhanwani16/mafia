import { createSlice } from '@reduxjs/toolkit';
import { roomAPI } from '../../services/api';

const initialState = {
  currentRoom: null,
  players: [],
  hostId: null,
  status: 'waiting',
  settings: {
    nightPhaseDuration: 90,
    dayDiscussionDuration: 300,
    votingDuration: 60,
    roles: {
      doctor: true,
      detective: true
    }
  },
  loading: false,
  error: null
};

const roomSlice = createSlice({
  name: 'room',
  initialState,
  reducers: {
    setRoom: (state, action) => {
      state.currentRoom = action.payload.room;
      state.hostId = action.payload.room.hostId;
      state.status = action.payload.room.status;
      state.settings = action.payload.room.settings || state.settings;
      state.loading = false;
      state.error = null;
    },
    addPlayer: (state, action) => {
      if (!state.players.find(p => p.playerId === action.payload.playerId)) {
        state.players.push(action.payload);
      }
    },
    removePlayer: (state, action) => {
      state.players = state.players.filter(p => p.playerId !== action.payload);
    },
    updatePlayers: (state, action) => {
      state.players = action.payload;
    },
    updateStatus: (state, action) => {
      state.status = action.payload;
    },
    updateSettings: (state, action) => {
      state.settings = { ...state.settings, ...action.payload };
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },
    resetRoom: () => initialState
  }
});

export const {
  setRoom,
  addPlayer,
  removePlayer,
  updatePlayers,
  updateStatus,
  updateSettings,
  setLoading,
  setError,
  resetRoom
} = roomSlice.actions;

export const createRoom = (data) => async (dispatch) => {
  dispatch(setLoading(true));
  dispatch(setError(null));
  try {
    const response = await roomAPI.createRoom(data);
    const payload = response.data;
    if (!payload || !payload.room) {
      throw new Error('Invalid response from server');
    }
    dispatch(setRoom({ room: payload.room }));
    // Populate players with host so lobby shows the host immediately
    dispatch(updatePlayers([
      { playerId: payload.hostId, username: data.hostName || 'Host', isAlive: true }
    ]));
    return payload;
  } catch (error) {
    const message = error.response?.data?.error || error.message || 'Failed to create room';
    dispatch(setError(message));
    throw error;
  }
};

export const joinRoom = (roomId, data) => async (dispatch) => {
  dispatch(setLoading(true));
  dispatch(setError(null));
  try {
    const response = await roomAPI.joinRoom(roomId, data);
    dispatch(setRoom({ room: response.data.room }));
    dispatch(updatePlayers(response.data.room.currentPlayers));
    return response.data;
  } catch (error) {
    dispatch(setError(error.response?.data?.error || 'Failed to join room'));
    throw error;
  }
};

/** Join using the short room code (e.g. NDJ1HS). Returns same shape as joinRoom plus roomId. */
export const joinRoomByCode = (data) => async (dispatch) => {
  dispatch(setLoading(true));
  dispatch(setError(null));
  try {
    const response = await roomAPI.joinRoomByCode(data);
    const payload = response.data;
    dispatch(setRoom({ room: payload.room }));
    return payload;
  } catch (error) {
    dispatch(setError(error.response?.data?.error || 'Failed to join room'));
    throw error;
  }
};

export const startGame = (roomId, playerId) => async (dispatch) => {
  dispatch(setLoading(true));
  try {
    const response = await roomAPI.startGame(roomId, { playerId });
    dispatch(updateStatus('in_progress'));
    return response.data;
  } catch (error) {
    dispatch(setError(error.response?.data?.error || 'Failed to start game'));
    throw error;
  }
};

export default roomSlice.reducer;
