import { configureStore } from '@reduxjs/toolkit';
import gameReducer from './slices/gameSlice';
import roomReducer from './slices/roomSlice';
import playerReducer from './slices/playerSlice';
import chatReducer from './slices/chatSlice';
import { socketMiddleware } from './middleware/socketMiddleware';
import { loadPersistedState, savePlayer, saveRoom, saveGameId } from '../utils/persistence';

const persisted = loadPersistedState();
const preloadedState = {
  ...(persisted.player && { player: persisted.player }),
  ...(persisted.room && { room: persisted.room })
};

export const store = configureStore({
  reducer: {
    game: gameReducer,
    room: roomReducer,
    player: playerReducer,
    chat: chatReducer
  },
  preloadedState: Object.keys(preloadedState).length ? preloadedState : undefined,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(socketMiddleware)
});

// Persist session so user can refresh or reconnect
store.subscribe(() => {
  const state = store.getState();
  savePlayer(state.player?.currentPlayer);
  if (state.room?.currentRoom) {
    saveRoom({ ...state.room.currentRoom, hostId: state.room.hostId, status: state.room.status });
  }
  const gameId = state.game?.gameId ?? null;
  saveGameId(gameId);
});
