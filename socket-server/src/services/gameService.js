import { v4 as uuidv4 } from 'uuid';
import Room from '../models/Room.js';
import Player from '../models/Player.js';
import Game from '../models/Game.js';
import { ROLE_DISTRIBUTION, ROLES, WINNERS, GAME_PHASES } from 'mafia-shared';

export const processNightPhase = async (gameId) => {
  const game = await Game.findOne({ gameId });
  if (!game) throw new Error('Game not found');
  if (game.phase !== GAME_PHASES.NIGHT) throw new Error('Game is not in night phase');

  const { nightActions } = game;
  let eliminated = null;
  const savedTarget = nightActions.doctor?.targetId;
  const killTarget = nightActions.mafia?.targetId;
  if (killTarget && killTarget !== savedTarget) eliminated = killTarget;

  if (eliminated) {
    game.eliminatedPlayers.push(eliminated);
    const playerIndex = game.players.findIndex(p => p.playerId === eliminated);
    if (playerIndex !== -1) game.players[playerIndex].isAlive = false;
  }

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
  return { game, nightResults };
};

export const processVoting = async (gameId) => {
  const game = await Game.findOne({ gameId });
  if (!game) throw new Error('Game not found');
  const { resolveVoting } = await import('./voteService.js');
  const result = resolveVoting(game);

  if (result.eliminated) await eliminatePlayer(gameId, result.eliminated);

  game.voteResults.push({
    round: game.round,
    votes: game.votes || [],
    eliminated: result.eliminated,
    timestamp: new Date()
  });
  game.votes = [];
  game.phase = result.eliminated ? GAME_PHASES.RESULTS : GAME_PHASES.DAY;
  await game.save();
  return result;
};

export const checkWinConditions = async (gameId) => {
  const game = await Game.findOne({ gameId });
  if (!game) throw new Error('Game not found');
  const alivePlayers = game.players.filter(p => p.isAlive);
  const mafiaCount = alivePlayers.filter(p => p.role === ROLES.MAFIA).length;
  const nonMafiaCount = alivePlayers.length - mafiaCount;

  if (mafiaCount >= nonMafiaCount && nonMafiaCount > 0) {
    game.winner = WINNERS.MAFIA;
    game.phase = GAME_PHASES.RESULTS;
    await game.save();
    return { winner: WINNERS.MAFIA, game };
  }
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
  if (!game) throw new Error('Game not found');
  if (!game.eliminatedPlayers.includes(playerId)) game.eliminatedPlayers.push(playerId);
  const playerIndex = game.players.findIndex(p => p.playerId === playerId);
  if (playerIndex !== -1) game.players[playerIndex].isAlive = false;
  await Player.findOneAndUpdate({ playerId }, { isAlive: false });
  await game.save();
  return await checkWinConditions(gameId);
};
