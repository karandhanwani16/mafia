import { io } from 'socket.io-client';
import { SOCKET_URL } from '../utils/constants.js';

let socket = null;

export const connectSocket = () => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ['polling', 'websocket'],
      autoConnect: false
    });
  }
  return socket;
};

export const getSocket = () => {
  if (!socket) {
    return connectSocket();
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
