import { getSocket } from '../../services/socket';
import { playSound } from '../../config/sounds';
import { log } from '../../utils/debug';
import {
  setGameState,
  updatePhase,
  setNightStep,
  eliminatePlayer,
  setVoteCount,
  setVotes,
  setWinner,
  setDetectiveResult,
  setLastDayDetectiveResult,
  setLastNightEliminated
} from '../slices/gameSlice';
import {
  setRoom,
  updatePlayers,
  updateStatus
} from '../slices/roomSlice';
import { setSocketStatus } from '../slices/playerSlice';
import { addChatMessage, clearChatMessages } from '../slices/chatSlice';

export const socketMiddleware = (store) => {
  const socket = getSocket();

  // Night phase flow: all players hear mafia → doctor → detective in order
  socket.on('nightStepMafia', () => playSound('nightStepMafia'));
  socket.on('nightStepDoctor', () => playSound('nightStepDoctor'));
  socket.on('nightStepDetective', () => playSound('nightStepDetective'));

  socket.on('connect', () => {
    store.dispatch(setSocketStatus(true));
  });

  socket.on('disconnect', () => {
    store.dispatch(setSocketStatus(false));
  });

  socket.on('roomUpdate', (data) => {
    store.dispatch(setRoom({ room: data.room }));
    store.dispatch(updatePlayers(data.players));
  });

  socket.on('gameStarted', (data) => {
    log('gameStarted received', { gameId: data?.gameId, playerCount: data?.players?.length });
    store.dispatch(setGameState(data));
    store.dispatch(clearChatMessages());
  });

  socket.on('chatMessage', (data) => {
    store.dispatch(addChatMessage(data));
    playSound('chatMessage', { volume: 0.4 });
  });

  socket.on('phaseChanged', (data) => {
    store.dispatch(updatePhase(data));
    if (data.phase === 'night') playSound('phaseNight');
  });

  socket.on('nightStepChanged', (data) => {
    store.dispatch(setNightStep(data.nightStep));
  });

  socket.on('dayPhaseStarted', (data) => {
    playSound('phaseDay');
    if (data.eliminated) {
      store.dispatch(eliminatePlayer(data.eliminated));
      setTimeout(() => playSound('playerEliminated'), 600);
    }
    if (data.detectiveResult) {
      store.dispatch(setLastDayDetectiveResult(data.detectiveResult));
    }
    store.dispatch(setLastNightEliminated(data.eliminated || null));
  });

  socket.on('voteUpdate', (data) => {
    store.dispatch(setVotes(data.votes));
    store.dispatch(setVoteCount(data.voteCount));
  });

  socket.on('voteResults', (data) => {
    if (data.eliminated) {
      store.dispatch(eliminatePlayer(data.eliminated));
    }
  });

  socket.on('playerEliminated', (data) => {
    store.dispatch(eliminatePlayer(data.playerId));
  });

  socket.on('gameEnd', (data) => {
    store.dispatch(setWinner(data.winner));
    store.dispatch(setGameState(data.game));
  });

  socket.on('error', (data) => {
    console.error('Socket error:', data.message);
  });

  return (next) => (action) => {
    return next(action);
  };
};
