import { v4 as uuidv4 } from 'uuid';
import Room from '../models/Room.js';
import Player from '../models/Player.js';
import Game from '../models/Game.js';
import { getSettings } from '../services/settingsService.js';
import { ROLE_DISTRIBUTION, ROLES, WINNERS, GAME_PHASES } from 'mafia-shared';

export const assignRoles = (players, settings) => {
  const playerCount = players.length;
  const distribution = ROLE_DISTRIBUTION[playerCount] || ROLE_DISTRIBUTION[12];

  const roles = [];
  
  // Add mafia roles
  for (let i = 0; i < distribution.mafia; i++) {
    roles.push(ROLES.MAFIA);
  }

  // Add doctor if enabled
  if (settings.roles.doctor) {
    roles.push(ROLES.DOCTOR);
  }

  // Add detective if enabled
  if (settings.roles.detective) {
    roles.push(ROLES.DETECTIVE);
  }

  // Fill rest with civilians
  while (roles.length < playerCount) {
    roles.push(ROLES.CIVILIAN);
  }

  // Shuffle roles
  for (let i = roles.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [roles[i], roles[j]] = [roles[j], roles[i]];
  }

  // Assign roles to players
  return players.map((player, index) => ({
    ...player,
    role: roles[index]
  }));
};

export const startGame = async (roomId) => {
  try {
    const room = await Room.findOne({ roomId });
    if (!room) {
      throw new Error('Room not found');
    }

    if (room.status !== 'waiting') {
      throw new Error('Game already started or finished');
    }

    const appSettings = await getSettings();
    const minPlayers = appSettings?.maxPlayersMin ?? 5;

    if (room.currentPlayers.length < minPlayers) {
      throw new Error(`Need at least ${minPlayers} players to start`);
    }

    // Get all players
    const players = await Player.find({ roomId });
    if (players.length < minPlayers) {
      throw new Error(`Need at least ${minPlayers} players to start`);
    }

    // Assign roles
    const playersWithRoles = assignRoles(
      players.map(p => ({ playerId: p.playerId, username: p.username })),
      room.settings
    );

    // Update players with roles
    for (const playerData of playersWithRoles) {
      await Player.findOneAndUpdate(
        { playerId: playerData.playerId },
        { role: playerData.role }
      );
    }

    // Create game
    const gameId = uuidv4();
    const game = new Game({
      gameId,
      roomId,
      phase: GAME_PHASES.NIGHT,
      round: 1,
      players: playersWithRoles.map(p => ({
        playerId: p.playerId,
        username: p.username,
        role: p.role,
        isAlive: true
      })),
      eliminatedPlayers: [],
      nightActions: {
        mafia: { targetId: null, submitted: false },
        doctor: { targetId: null, submitted: false },
        detective: { targetId: null, submitted: false, result: null }
      },
      voteResults: [],
      winner: null,
      phaseStartTime: new Date()
    });

    await game.save();

    // Update room status
    room.status = 'in_progress';
    await room.save();

    return game;
  } catch (error) {
    throw error;
  }
};

export const processNightPhase = async (gameId) => {
  const game = await Game.findOne({ gameId });
  if (!game) {
    throw new Error('Game not found');
  }

  if (game.phase !== GAME_PHASES.NIGHT) {
    throw new Error('Game is not in night phase');
  }

  const { nightActions } = game;
  let eliminated = null;

  // Process doctor save first
  const savedTarget = nightActions.doctor?.targetId;

  // Process mafia kill
  const killTarget = nightActions.mafia?.targetId;
  if (killTarget && killTarget !== savedTarget) {
    eliminated = killTarget;
  }

  // Update game state
  if (eliminated) {
    game.eliminatedPlayers.push(eliminated);
    const playerIndex = game.players.findIndex(p => p.playerId === eliminated);
    if (playerIndex !== -1) {
      game.players[playerIndex].isAlive = false;
    }
  }

  // Reset night actions for next round
  game.nightActions = {
    mafia: { targetId: null, submitted: false },
    doctor: { targetId: null, submitted: false },
    detective: { targetId: null, submitted: false, result: null }
  };

  await game.save();

  return {
    eliminated,
    saved: savedTarget === killTarget && killTarget !== null,
    detectiveResult: nightActions.detective
  };
};

export const transitionToDay = async (gameId) => {
  const nightResults = await processNightPhase(gameId);
  
  const game = await Game.findOne({ gameId });
  game.phase = GAME_PHASES.DAY;
  game.phaseStartTime = new Date();
  await game.save();

  return {
    game,
    nightResults
  };
};

export const processVoting = async (gameId) => {
  const game = await Game.findOne({ gameId });
  if (!game) {
    throw new Error('Game not found');
  }

  const { resolveVoting } = await import('./voteService.js');
  const result = resolveVoting(game);

  if (result.eliminated) {
    await eliminatePlayer(gameId, result.eliminated);
  }

  // Record vote results
  game.voteResults.push({
    round: game.round,
    votes: game.votes || [],
    eliminated: result.eliminated,
    timestamp: new Date()
  });

  // Clear votes for next round
  game.votes = [];
  game.phase = result.eliminated ? GAME_PHASES.RESULTS : GAME_PHASES.DAY;
  await game.save();

  return result;
};

export const checkWinConditions = async (gameId) => {
  const game = await Game.findOne({ gameId });
  if (!game) {
    throw new Error('Game not found');
  }

  const alivePlayers = game.players.filter(p => p.isAlive);
  const mafiaCount = alivePlayers.filter(p => p.role === ROLES.MAFIA).length;
  const nonMafiaCount = alivePlayers.length - mafiaCount;

  // Mafia wins if mafia count >= non-mafia count
  if (mafiaCount >= nonMafiaCount && nonMafiaCount > 0) {
    game.winner = WINNERS.MAFIA;
    game.phase = GAME_PHASES.RESULTS;
    await game.save();
    return { winner: WINNERS.MAFIA, game };
  }

  // Villagers win if all mafia eliminated
  if (mafiaCount === 0) {
    game.winner = WINNERS.VILLAGERS;
    game.phase = GAME_PHASES.RESULTS;
    await game.save();
    return { winner: WINNERS.VILLAGERS, game };
  }

  return { winner: null, game };
};

export const eliminatePlayer = async (gameId, playerId) => {
  const game = await Game.findOne({ gameId });
  if (!game) {
    throw new Error('Game not found');
  }

  if (!game.eliminatedPlayers.includes(playerId)) {
    game.eliminatedPlayers.push(playerId);
  }

  const playerIndex = game.players.findIndex(p => p.playerId === playerId);
  if (playerIndex !== -1) {
    game.players[playerIndex].isAlive = false;
  }

  // Update player model
  await Player.findOneAndUpdate(
    { playerId },
    { isAlive: false }
  );

  await game.save();

  // Check win conditions after elimination
  return await checkWinConditions(gameId);
};
