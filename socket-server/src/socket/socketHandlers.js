import Room from '../models/Room.js';
import Player from '../models/Player.js';
import Game from '../models/Game.js';
import { transitionToDay, processVoting, checkWinConditions } from '../services/gameService.js';

const roomSockets = new Map();
const socketRooms = new Map();
const socketPlayers = new Map();
// voice: roomId -> Map(socketId -> { username })
const voiceRooms = new Map();

export const setupSocketHandlers = (io) => {
  io.on('connection', (socket) => {
    socket.on('joinRoom', async (data) => {
      try {
        const { roomId, playerId } = data;
        if (process.env.NODE_ENV !== 'production') {
          console.log(`[socket] joinRoom attempt roomId=${roomId} playerId=${playerId?.slice(0, 8)}... socketId=${socket.id}`);
        }
        if (!roomId || !playerId) {
          socket.emit('error', { message: 'Room ID and Player ID are required' });
          return;
        }
        const room = await Room.findOne({ roomId });
        if (!room) {
          if (process.env.NODE_ENV !== 'production') console.log(`[socket] joinRoom failed: room not found ${roomId}`);
          socket.emit('error', { message: 'Room not found' });
          return;
        }
        const player = await Player.findOne({ playerId, roomId });
        if (!player) {
          if (process.env.NODE_ENV !== 'production') console.log(`[socket] joinRoom failed: player not found in room playerId=${playerId?.slice(0, 8)}... roomId=${roomId}`);
          socket.emit('error', { message: 'Player not found in room' });
          return;
        }
        await Player.findOneAndUpdate({ playerId }, { socketId: socket.id });
        socket.join(roomId);
        socketRooms.set(socket.id, roomId);
        socketPlayers.set(socket.id, playerId);
        if (!roomSockets.has(roomId)) roomSockets.set(roomId, new Set());
        roomSockets.get(roomId).add(socket.id);

        const players = await Player.find({ roomId }).select('playerId username isAlive');
        const roomSize = roomSockets.get(roomId)?.size ?? 0;
        if (process.env.NODE_ENV !== 'production') {
          console.log(`[socket] joinRoom success roomId=${roomId} socketCount=${roomSize}`);
        }
        io.to(roomId).emit('roomUpdate', {
          room: {
            roomId: room.roomId,
            roomCode: room.roomCode,
            hostId: room.hostId,
            maxPlayers: room.maxPlayers,
            currentPlayers: room.currentPlayers,
            status: room.status
          },
          players: players.map(p => ({ playerId: p.playerId, username: p.username, isAlive: p.isAlive }))
        });
        if (process.env.NODE_ENV !== 'production') {
          console.log(`[socket] roomUpdate emitted for room ${roomId}, ${roomSize} socket(s) in room`);
        }

        if (room.status === 'in_progress') {
          const game = await Game.findOne({ roomId }).select('gameId');
          if (game) {
            socket.emit('gameRejoin', {
              gameId: game.gameId,
              roomId: room.roomId,
              roomCode: room.roomCode
            });
          }
        }
      } catch (error) {
        socket.emit('error', { message: 'Failed to join room' });
      }
    });

    socket.on('leaveRoom', async () => {
      try {
        const roomId = socketRooms.get(socket.id);
        if (roomId) {
          socket.leave(roomId);
          socketRooms.delete(socket.id);
          socketPlayers.delete(socket.id);
          if (roomSockets.has(roomId)) roomSockets.get(roomId).delete(socket.id);
          const room = await Room.findOne({ roomId });
          if (room) {
            const players = await Player.find({ roomId }).select('playerId username isAlive');
            io.to(roomId).emit('roomUpdate', {
              room: { roomId: room.roomId, roomCode: room.roomCode, hostId: room.hostId, maxPlayers: room.maxPlayers, currentPlayers: room.currentPlayers, status: room.status },
              players: players.map(p => ({ playerId: p.playerId, username: p.username, isAlive: p.isAlive }))
            });
          }
        }
      } catch (error) {}
    });

    socket.on('submitNightAction', async (data) => {
      try {
        const { gameId, playerId, actionType, targetId } = data;
        const roomId = socketRooms.get(socket.id);
        if (!roomId) { socket.emit('error', { message: 'Not in a room' }); return; }
        const game = await Game.findOne({ gameId, roomId });
        if (!game) { socket.emit('error', { message: 'Game not found' }); return; }
        const player = await Player.findOne({ playerId });
        if (!player) { socket.emit('error', { message: 'Player not found' }); return; }
        const { validateAction, processMafiaAction, processDoctorAction, processDetectiveAction } = await import('../services/roleService.js');
        const validation = validateAction(playerId, actionType, targetId, game, player.role);
        if (!validation.valid) { socket.emit('error', { message: validation.error }); return; }
        let updatedGame;
        switch (player.role) {
          case 'mafia': updatedGame = processMafiaAction(game, targetId); break;
          case 'doctor': updatedGame = processDoctorAction(game, targetId); break;
          case 'detective': updatedGame = processDetectiveAction(game, targetId); break;
          default: socket.emit('error', { message: 'Invalid role for action' }); return;
        }
        await Game.findOneAndUpdate(
          { gameId },
          { $set: { nightActions: updatedGame.nightActions } }
        );
        const currentStep = game.nightStep || 'mafia';
        const hasDoctor = game.players.some(p => p.role === 'doctor' && p.isAlive);
        const hasDetective = game.players.some(p => p.role === 'detective' && p.isAlive);

        let nextStep = null;
        if (currentStep === 'mafia') {
          nextStep = hasDoctor ? 'doctor' : hasDetective ? 'detective' : null;
        } else if (currentStep === 'doctor') {
          nextStep = hasDetective ? 'detective' : null;
        } else {
          nextStep = null;
        }

        const STEP_DELAY_MS = 2200;

        if (nextStep) {
          await Game.findOneAndUpdate({ gameId }, { $set: { nightStep: nextStep } });
          if (currentStep === 'mafia') io.to(roomId).emit('nightStepMafia');
          else if (currentStep === 'doctor') io.to(roomId).emit('nightStepDoctor');
          io.to(roomId).emit('nightStepChanged', { nightStep: nextStep });
          socket.emit('actionReceived', { success: true });
        } else {
          io.to(roomId).emit('nightStepDetective');
          const { game: dayGame, nightResults } = await transitionToDay(gameId);
          const winCheck = await checkWinConditions(gameId);
          setTimeout(() => {
            io.to(roomId).emit('phaseChanged', { phase: 'day', round: dayGame.round, nightResults });
            io.to(roomId).emit('dayPhaseStarted', {
              eliminated: nightResults.eliminated,
              saved: nightResults.saved,
              round: dayGame.round,
              detectiveResult: nightResults.detectiveResult || null
            });
            if (winCheck.winner) io.to(roomId).emit('gameEnd', { winner: winCheck.winner, game: winCheck.game });
          }, STEP_DELAY_MS);
          socket.emit('actionReceived', { success: true });
        }
      } catch (error) {
        socket.emit('error', { message: 'Failed to submit action' });
      }
    });

    socket.on('submitVote', async (data) => {
      try {
        const { gameId, playerId, targetId } = data;
        const roomId = socketRooms.get(socket.id);
        if (!roomId) { socket.emit('error', { message: 'Not in a room' }); return; }
        const game = await Game.findOne({ gameId, roomId });
        if (!game) { socket.emit('error', { message: 'Game not found' }); return; }
        const { submitVote: submitVoteService, getVoteCount } = await import('../services/voteService.js');
        const result = submitVoteService(game, playerId, targetId);
        if (!result.success) { socket.emit('error', { message: result.error }); return; }
        const votesToSet = (result.gameState.votes || []).map((v) => ({
          voterId: String(v.voterId),
          targetId: String(v.targetId),
          timestamp: v.timestamp || new Date()
        }));
        const updatedGame = await Game.findOneAndUpdate(
          { gameId, roomId },
          { $set: { votes: votesToSet } },
          { new: true }
        );
        if (!updatedGame) { socket.emit('error', { message: 'Game not found' }); return; }
        const voteCount = getVoteCount(updatedGame);
        io.to(roomId).emit('voteUpdate', { votes: updatedGame.votes || [], voteCount });
        const alivePlayers = updatedGame.players.filter((p) => p.isAlive);
        const votes = updatedGame.votes || [];
        const voters = new Set(votes.map((v) => String(v.voterId)));
        const allAliveVoted = alivePlayers.length > 0 && voters.size >= alivePlayers.length;
        if (allAliveVoted) {
          const voteResult = await processVoting(gameId);
          const winCheck = await checkWinConditions(gameId);
          io.to(roomId).emit('voteResults', { eliminated: voteResult.eliminated, tie: voteResult.tie, votes: updatedGame.votes });
          if (voteResult.eliminated) io.to(roomId).emit('playerEliminated', { playerId: voteResult.eliminated });
          if (winCheck.winner) {
            io.to(roomId).emit('gameEnd', { winner: winCheck.winner, game: winCheck.game });
          } else {
            const nextGame = await Game.findOne({ gameId, roomId });
            if (nextGame) {
              nextGame.phase = 'night';
              nextGame.nightStep = 'mafia';
              nextGame.round += 1;
              nextGame.phaseStartTime = new Date();
              await nextGame.save();
              io.to(roomId).emit('phaseChanged', { phase: 'night', round: nextGame.round, nightStep: 'mafia' });
              io.to(roomId).emit('nightStepChanged', { nightStep: 'mafia' });
              io.to(roomId).emit('nightActionRequired', { round: nextGame.round });
            }
          }
        }
      } catch (error) {
        if (process.env.NODE_ENV !== 'production') console.error('[submitVote]', error);
        socket.emit('error', { message: 'Failed to submit vote' });
      }
    });

    socket.on('voice:join', (data) => {
      const roomId = socketRooms.get(socket.id);
      if (!roomId || roomId !== data.roomId) {
        socket.emit('error', { message: 'Not in this room' });
        return;
      }
      const { username = 'Player' } = data;
      if (!voiceRooms.has(roomId)) voiceRooms.set(roomId, new Map());
      const peers = voiceRooms.get(roomId);
      const peerList = Array.from(peers.entries()).map(([id, p]) => ({ socketId: id, username: p.username }));
      peers.set(socket.id, { username });
      socket.emit('voice:roomPeers', { peers: peerList });
      socket.to(roomId).emit('voice:peerJoined', { socketId: socket.id, username });
    });

    socket.on('voice:leave', (data) => {
      const roomId = data?.roomId || socketRooms.get(socket.id);
      const peers = voiceRooms.get(roomId);
      if (peers) {
        peers.delete(socket.id);
        if (peers.size === 0) voiceRooms.delete(roomId);
        socket.to(roomId).emit('voice:peerLeft', { socketId: socket.id });
      }
    });

    socket.on('voice:offer', (data) => {
      const { to, offer } = data;
      if (to) io.to(to).emit('voice:offer', { from: socket.id, offer });
    });

    socket.on('voice:answer', (data) => {
      const { to, answer } = data;
      if (to) io.to(to).emit('voice:answer', { from: socket.id, answer });
    });

    socket.on('voice:ice', (data) => {
      const { to, candidate } = data;
      if (to) io.to(to).emit('voice:ice', { from: socket.id, candidate });
    });

    socket.on('sendChatMessage', async (data) => {
      try {
        const { roomId, playerId, message } = data;
        const socketRoomId = socketRooms.get(socket.id);
        if (!socketRoomId || socketRoomId !== roomId) { socket.emit('error', { message: 'Not in this room' }); return; }
        const player = await Player.findOne({ playerId });
        if (!player) { socket.emit('error', { message: 'Player not found' }); return; }
        const game = await Game.findOne({ roomId });
        if (game && game.phase === 'night') { socket.emit('error', { message: 'Chat is disabled during night phase' }); return; }
        io.to(roomId).emit('chatMessage', {
          playerId,
          username: player.username,
          message: message.trim().slice(0, 500),
          timestamp: new Date()
        });
      } catch (error) {
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    socket.on('disconnect', async () => {
      try {
        const roomId = socketRooms.get(socket.id);
        const playerId = socketPlayers.get(socket.id);
        const voicePeers = roomId && voiceRooms.get(roomId);
        if (voicePeers) {
          voicePeers.delete(socket.id);
          if (voicePeers.size === 0) voiceRooms.delete(roomId);
          else io.to(roomId).emit('voice:peerLeft', { socketId: socket.id });
        }
        if (roomId) {
          socket.leave(roomId);
          socketRooms.delete(socket.id);
          socketPlayers.delete(socket.id);
          if (roomSockets.has(roomId)) roomSockets.get(roomId).delete(socket.id);
          if (playerId) await Player.findOneAndUpdate({ playerId }, { socketId: null });
          const room = await Room.findOne({ roomId });
          if (room) {
            const players = await Player.find({ roomId }).select('playerId username isAlive');
            io.to(roomId).emit('roomUpdate', {
              room: { roomId: room.roomId, roomCode: room.roomCode, hostId: room.hostId, maxPlayers: room.maxPlayers, currentPlayers: room.currentPlayers, status: room.status },
              players: players.map(p => ({ playerId: p.playerId, username: p.username, isAlive: p.isAlive }))
            });
          }
        }
      } catch (error) {}
    });
    
  });
};
