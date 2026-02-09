import Game from '../models/Game.js';
import Player from '../models/Player.js';
import Room from '../models/Room.js';
import { processMafiaAction, processDoctorAction, processDetectiveAction, validateAction } from '../services/roleService.js';
import { submitVote as submitVoteService, getVoteCount } from '../services/voteService.js';
import { getVisibleRoles } from '../services/roleService.js';

export const submitAction = async (req, res) => {
  try {
    const { gameId } = req.params;
    const { playerId, actionType, targetId } = req.body;

    if (!playerId || !actionType || !targetId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const game = await Game.findOne({ gameId });
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    const player = await Player.findOne({ playerId });
    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }

    // Validate action
    const validation = validateAction(playerId, actionType, targetId, game, player.role);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    // Process action based on role
    let updatedGame;
    switch (player.role) {
      case 'mafia':
        updatedGame = processMafiaAction(game, targetId);
        break;
      case 'doctor':
        updatedGame = processDoctorAction(game, targetId);
        break;
      case 'detective':
        updatedGame = processDetectiveAction(game, targetId);
        break;
      default:
        return res.status(400).json({ error: 'Invalid role for action' });
    }

    await Game.findOneAndUpdate({ gameId }, updatedGame);

    // Record action in player history
    await Player.findOneAndUpdate(
      { playerId },
      {
        $push: {
          actions: {
            round: game.round,
            phase: game.phase,
            actionType,
            targetId,
            timestamp: new Date()
          }
        }
      }
    );

    res.json({
      success: true,
      message: 'Action submitted successfully'
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to submit action' });
  }
};

export const submitVote = async (req, res) => {
  try {
    const { gameId } = req.params;
    const { playerId, targetId } = req.body;

    if (!playerId || !targetId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const game = await Game.findOne({ gameId });
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    const result = submitVoteService(game, playerId, targetId);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    await Game.findOneAndUpdate({ gameId }, result.gameState);

    res.json({
      success: true,
      message: 'Vote submitted successfully'
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to submit vote' });
  }
};

export const getGameState = async (req, res) => {
  try {
    const { gameId } = req.params;
    const { playerId } = req.query;

    const game = await Game.findOne({ gameId });
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    if (!playerId) {
      return res.status(400).json({ error: 'Player ID is required' });
    }

    const player = await Player.findOne({ playerId, roomId: game.roomId });
    if (!player) {
      return res.status(404).json({ error: 'Player not found in this game' });
    }

    // Get filtered game state based on player role
    const visibleRoles = getVisibleRoles(playerId, game);

    // Filter players based on visibility rules
    const visiblePlayers = game.players.map(p => {
      const visible = {
        playerId: p.playerId,
        username: p.username,
        isAlive: p.isAlive
      };

      // Only show role if player is dead or if it's the player themselves
      if (!p.isAlive || p.playerId === playerId) {
        visible.role = p.role;
      }

      // Mafia can see other mafia
      if (player.role === 'mafia' && p.role === 'mafia' && p.isAlive) {
        visible.role = p.role;
      }

      return visible;
    });

    const room = await Room.findOne({ roomId: game.roomId }).select('roomId roomCode');
    const votes = game.votes || [];
    const voteCount = getVoteCount(game);

    res.json({
      gameId: game.gameId,
      roomId: game.roomId,
      roomCode: room?.roomCode ?? null,
      phase: game.phase,
      nightStep: game.phase === 'night' ? (game.nightStep || 'mafia') : null,
      round: game.round,
      players: visiblePlayers,
      eliminatedPlayers: game.eliminatedPlayers,
      winner: game.winner,
      phaseStartTime: game.phaseStartTime,
      votes,
      voteCount,
      visibleRoles,
      detectiveResult: player.role === 'detective' && game.nightActions.detective?.submitted
        ? {
            targetId: game.nightActions.detective.targetId,
            result: game.nightActions.detective.result
          }
        : null
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get game state' });
  }
};
