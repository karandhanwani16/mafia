import { useEffect } from 'react';
import { getSocket } from '../services/socket';

export const useSocket = (eventHandlers) => {
  const socket = getSocket();

  useEffect(() => {
    if (!socket.connected) {
      socket.connect();
    }

    Object.entries(eventHandlers).forEach(([event, handler]) => {
      socket.on(event, handler);
    });

    return () => {
      Object.keys(eventHandlers).forEach((event) => {
        socket.off(event);
      });
    };
  }, [socket, eventHandlers]);

  return socket;
};
