import axios from 'axios';
import { API_BASE_URL } from '../utils/constants.js';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

export const roomAPI = {
  createRoom: (data) => api.post('/api/rooms', data),
  joinRoom: (roomId, data) => api.post(`/api/rooms/${roomId}/join`, data),
  joinRoomByCode: (data) => api.post('/api/rooms/join-by-code', data),
  getRoom: (roomId) => api.get(`/api/rooms/${roomId}`),
  startGame: (roomId, data) => api.post(`/api/rooms/${roomId}/start`, data),
  leaveRoom: (roomId, data) => api.post(`/api/rooms/${roomId}/leave`, data),
  deleteRoom: (roomId, data) => api.delete(`/api/rooms/${roomId}`, { data })
};

export const gameAPI = {
  submitAction: (gameId, data) => api.post(`/api/game/${gameId}/action`, data),
  submitVote: (gameId, data) => api.post(`/api/game/${gameId}/vote`, data),
  getGameState: (gameId, playerId) => api.get(`/api/game/${gameId}/state`, {
    params: { playerId }
  })
};

export default api;
