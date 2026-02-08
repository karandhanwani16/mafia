import { v4 as uuidv4 } from 'uuid';
import Room from '../models/Room.js';
import Player from '../models/Player.js';
import Game from '../models/Game.js';
import { generateRoomCode } from '../utils/helpers.js';

export const createRoom = async (req, res) => {
  try {
    const { hostName, maxPlayers = 12, settings = {} } = req.body;

    if (!hostName || hostName.trim().length === 0) {
      return res.status(400).json({ error: 'Host name is required' });
    }

    if (maxPlayers < 5 || maxPlayers > 12) {
      return res.status(400).json({ error: 'Max players must be between 5 and 12' });
    }

    const roomId = uuidv4();
    const isTestingMode = ['true', '1'].includes(String(process.env.TESTING_MODE || '').toLowerCase());

    // In testing mode, delete any existing room with code 000000 so the new game gets that code
    if (isTestingMode) {
      const existingTestRoom = await Room.findOne({ roomCode: '000000' });
      if (existingTestRoom) {
        const oldRoomId = existingTestRoom.roomId;
        await Game.deleteMany({ roomId: oldRoomId });
        await Player.deleteMany({ roomId: oldRoomId });
        await Room.deleteOne({ roomId: oldRoomId });
      }
    }

    const maxCodeAttempts = 5;
    let roomCode = isTestingMode ? '000000' : generateRoomCode();
    let room = null;

    for (let attempt = 0; attempt < maxCodeAttempts; attempt++) {
      try {
        room = new Room({
          roomId,
          roomCode: isTestingMode ? '000000' : roomCode,
          hostId: uuidv4(), // Temporary, will be replaced with actual player ID
          maxPlayers,
          currentPlayers: [],
          settings: {
            nightPhaseDuration: settings.nightPhaseDuration || 90,
            dayDiscussionDuration: settings.dayDiscussionDuration || 300,
            votingDuration: settings.votingDuration || 60,
            roles: {
              doctor: settings.roles?.doctor !== false,
              detective: settings.roles?.detective !== false
            }
          }
        });

        await room.save();
        roomCode = room.roomCode;
        break;
      } catch (err) {
        if (err?.code === 11000 && !isTestingMode && attempt < maxCodeAttempts - 1) {
          roomCode = generateRoomCode();
          continue;
        }
        throw err;
      }
    }

    // Create host player
    const hostId = uuidv4();
    const hostPlayer = new Player({
      playerId: hostId,
      username: hostName.trim(),
      roomId,
      isAlive: true
    });

    await hostPlayer.save();

    // Update room with host ID
    room.hostId = hostId;
    room.currentPlayers.push(hostId);
    await room.save();

    res.status(201).json({
      roomId,
      roomCode,
      hostId,
      room: {
        roomId,
        roomCode,
        hostId,
        maxPlayers,
        currentPlayers: [hostId],
        status: room.status,
        settings: room.settings
      }
    });
  } catch (error) {
    console.error('[createRoom] error:', error?.message ?? error);
    if (error?.code === 11000) {
      return res.status(409).json({ error: 'Room code collision, please try again' });
    }
    res.status(500).json({
      error: 'Failed to create room',
      ...(process.env.NODE_ENV !== 'production' && { detail: error?.message })
    });
  }
};

export const joinRoomByCode = async (req, res) => {
  try {
    const { roomCode, playerName } = req.body;

    if (!roomCode || !roomCode.trim()) {
      return res.status(400).json({ error: 'Room code is required' });
    }
    if (!playerName || playerName.trim().length === 0) {
      return res.status(400).json({ error: 'Player name is required' });
    }

    const room = await Room.findOne({ roomCode: roomCode.trim().toUpperCase() });
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    return joinRoomImpl(res, room.roomId, playerName.trim());
  } catch (error) {
    res.status(500).json({ error: 'Failed to join room' });
  }
};

async function joinRoomImpl(res, roomId, playerName) {
  const room = await Room.findOne({ roomId });
  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }

  if (room.status !== 'waiting') {
    return res.status(400).json({ error: 'Game already started' });
  }

  if (room.currentPlayers.length >= room.maxPlayers) {
    return res.status(400).json({ error: 'Room is full' });
  }

  const existingPlayer = await Player.findOne({
    roomId,
    username: playerName
  });
  if (existingPlayer) {
    return res.status(400).json({ error: 'Username already taken in this room' });
  }

  const playerId = uuidv4();
  const player = new Player({
    playerId,
    username: playerName,
    roomId,
    isAlive: true
  });
  await player.save();

  room.currentPlayers.push(playerId);
  await room.save();

  return res.json({
    playerId,
    roomId: room.roomId,
    room: {
      roomId: room.roomId,
      roomCode: room.roomCode,
      hostId: room.hostId,
      maxPlayers: room.maxPlayers,
      currentPlayers: room.currentPlayers,
      status: room.status,
      settings: room.settings
    }
  });
}

export const joinRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { playerName } = req.body;

    if (!playerName || playerName.trim().length === 0) {
      return res.status(400).json({ error: 'Player name is required' });
    }

    const room = await Room.findOne({ roomId });
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    return joinRoomImpl(res, roomId, playerName.trim());
  } catch (error) {
    res.status(500).json({ error: 'Failed to join room' });
  }
};

export const leaveRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { playerId } = req.body;

    if (!playerId) {
      return res.status(400).json({ error: 'Player ID is required' });
    }

    const room = await Room.findOne({ roomId });
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    if (room.status !== 'waiting') {
      return res.status(400).json({ error: 'Cannot leave once the game has started' });
    }

    const playerIndex = room.currentPlayers.indexOf(playerId);
    if (playerIndex === -1) {
      return res.status(404).json({ error: 'Player not in this room' });
    }

    await Player.deleteOne({ playerId, roomId });
    room.currentPlayers.splice(playerIndex, 1);

    if (room.currentPlayers.length === 0) {
      await Room.deleteOne({ roomId });
      return res.json({ message: 'Left room', roomDeleted: true });
    }

    if (room.hostId === playerId) {
      room.hostId = room.currentPlayers[0];
      await room.save();
    } else {
      await room.save();
    }

    res.json({ message: 'Left room', roomDeleted: false });
  } catch (error) {
    res.status(500).json({ error: 'Failed to leave room' });
  }
};

export const getRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const room = await Room.findOne({ roomId });

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    const players = await Player.find({ roomId }).select('playerId username isAlive');

    const roomPayload = {
      roomId: room.roomId,
      roomCode: room.roomCode,
      hostId: room.hostId,
      maxPlayers: room.maxPlayers,
      currentPlayers: room.currentPlayers,
      status: room.status,
      settings: room.settings
    };
    if (room.status === 'in_progress') {
      const game = await Game.findOne({ roomId }).select('gameId').lean();
      if (game) roomPayload.gameId = game.gameId;
    }

    res.json({
      room: roomPayload,
      players: players.map(p => ({
        playerId: p.playerId,
        username: p.username,
        isAlive: p.isAlive
      }))
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get room' });
  }
};

export const startGame = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { playerId } = req.body;

    const room = await Room.findOne({ roomId });
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    if (room.hostId !== playerId) {
      return res.status(403).json({ error: 'Only host can start the game' });
    }

    if (room.status !== 'waiting') {
      return res.status(400).json({ error: 'Game already started' });
    }

    const { startGame: startGameService } = await import('../services/gameService.js');
    const game = await startGameService(roomId);

    const { emitToRoom } = await import('../services/emitToSocketServer.js');
    const gamePayload = {
      gameId: game.gameId,
      phase: game.phase,
      round: game.round,
      players: game.players.map(p => ({
        playerId: p.playerId,
        username: p.username,
        role: p.role,
        isAlive: p.isAlive
      }))
    };
    await emitToRoom(roomId, [
      { event: 'gameStarted', payload: gamePayload },
      { event: 'nightActionRequired', payload: { round: game.round } }
    ]);

    res.json({
      gameId: game.gameId,
      phase: game.phase,
      round: game.round,
      players: game.players.map(p => ({
        playerId: p.playerId,
        username: p.username,
        role: p.role,
        isAlive: p.isAlive
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to start game' });
  }
};

export const deleteRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { playerId } = req.body;

    const room = await Room.findOne({ roomId });
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    if (room.hostId !== playerId) {
      return res.status(403).json({ error: 'Only host can delete the room' });
    }

    // Delete all players in room
    await Player.deleteMany({ roomId });

    // Delete room
    await Room.deleteOne({ roomId });

    res.json({ message: 'Room deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete room' });
  }
};
