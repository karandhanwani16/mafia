/**
 * Persist and rehydrate game session so users can refresh or reconnect.
 * Keys: mafia_player, mafia_room, mafia_gameId
 */

const STORAGE_KEYS = {
  player: 'mafia_player',
  room: 'mafia_room',
  gameId: 'mafia_gameId'
};

export function loadPersistedState() {
  try {
    const playerRaw = localStorage.getItem(STORAGE_KEYS.player);
    const roomRaw = localStorage.getItem(STORAGE_KEYS.room);
    const gameId = localStorage.getItem(STORAGE_KEYS.gameId);

    const player = playerRaw ? JSON.parse(playerRaw) : null;
    const room = roomRaw ? JSON.parse(roomRaw) : null;

    return {
      player: player && player.playerId
        ? {
            currentPlayer: {
              playerId: player.playerId,
              username: player.username || null,
              role: player.role ?? null,
              isAlive: player.isAlive !== false
            },
            socketConnected: false
          }
        : undefined,
      room: room && room.roomId
        ? {
            currentRoom: {
              roomId: room.roomId,
              roomCode: room.roomCode || null,
              hostId: room.hostId || null,
              maxPlayers: room.maxPlayers ?? 12,
              status: room.status || 'waiting'
            },
            players: [],
            hostId: room.hostId || null,
            status: room.status || 'waiting'
          }
        : undefined,
      gameId: gameId || null
    };
  } catch {
    return { player: undefined, room: undefined, gameId: null };
  }
}

export function savePlayer(player) {
  if (!player?.playerId) return;
  try {
    localStorage.setItem(STORAGE_KEYS.player, JSON.stringify({
      playerId: player.playerId,
      username: player.username ?? null,
      role: player.role ?? null,
      isAlive: player.isAlive !== false
    }));
  } catch {
    // ignore
  }
}

export function saveRoom(room) {
  if (!room?.roomId) return;
  try {
    localStorage.setItem(STORAGE_KEYS.room, JSON.stringify({
      roomId: room.roomId,
      roomCode: room.roomCode ?? null,
      hostId: room.hostId ?? null,
      status: room.status ?? 'waiting'
    }));
  } catch {
    // ignore
  }
}

export function saveGameId(gameId) {
  try {
    if (gameId) {
      localStorage.setItem(STORAGE_KEYS.gameId, gameId);
    } else {
      localStorage.removeItem(STORAGE_KEYS.gameId);
    }
  } catch {
    // ignore
  }
}

export function clearPersistedSession() {
  try {
    localStorage.removeItem(STORAGE_KEYS.player);
    localStorage.removeItem(STORAGE_KEYS.room);
    localStorage.removeItem(STORAGE_KEYS.gameId);
  } catch {
    // ignore
  }
}
