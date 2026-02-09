import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getSocket } from '../../services/socket';
import { setGameState, updatePhase, fetchGameState } from '../../store/slices/gameSlice';
import { setRoom } from '../../store/slices/roomSlice';
import { setRole } from '../../store/slices/playerSlice';
import { playSound } from '../../config/sounds';
import { useSoundControls } from '../../contexts/SoundControlsContext';
import NightPhase from './NightPhase';
import DayPhase from './DayPhase';
import Chat from './Chat';
import GameResults from './GameResults';
import RoleReveal from './RoleReveal';
import VoiceChat from './VoiceChat';
import Loading from '../common/Loading';
import { GAME_PHASES } from '../../utils/constants';
import { getRoleColor, getRoleIcon, getRoleDisplayName } from '../../utils/helpers';

const GamePage = () => {
  const { gameId } = useParams();
  const dispatch = useDispatch();
  const openSoundControls = useSoundControls();
  const { phase, round, players, winner, gameId: stateGameId, loading, error } = useSelector((state) => state.game);
  const { currentRoom } = useSelector((state) => state.room);
  const { currentPlayer } = useSelector((state) => state.player);
  const [socket, setSocket] = useState(null);
  const [showRoleReveal, setShowRoleReveal] = useState(false);
  const [restoreAttempted, setRestoreAttempted] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  useEffect(() => {
    if (chatOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prev; };
    }
  }, [chatOpen]);

  // Restore game state on load (refresh / reconnect)
  useEffect(() => {
    if (!gameId || !currentPlayer?.playerId) return;
    const needsRestore = !phase || stateGameId !== gameId;
    if (!needsRestore || restoreAttempted) return;

    setRestoreAttempted(true);
    dispatch(fetchGameState({ gameId, playerId: currentPlayer.playerId }))
      .unwrap()
      .then((data) => {
        if (data?.roomId) {
          dispatch(setRoom({
            room: {
              roomId: data.roomId,
              roomCode: data.roomCode ?? '',
              status: 'in_progress',
              maxPlayers: 12
            }
          }));
        }
        const myPlayer = data?.players?.find((p) => p.playerId === currentPlayer.playerId);
        if (myPlayer?.role) {
          dispatch(setRole(myPlayer.role));
        }
      })
      .catch(() => {
        setRestoreAttempted(false);
      });
  }, [gameId, currentPlayer?.playerId, dispatch, phase, stateGameId, currentRoom?.roomId, restoreAttempted]);

  useEffect(() => {
    const socketInstance = getSocket();
    setSocket(socketInstance);

    if (!socketInstance.connected) {
      socketInstance.connect();
    }

    socketInstance.on('gameStarted', (data) => {
      dispatch(setGameState(data));
      setShowRoleReveal(true);
      playSound('gameStart');
      playSound('phaseNight');
    });

    socketInstance.on('gameEnd', (data) => {
      dispatch(setGameState(data.game));
    });

    const handleGameRejoin = (data) => {
      if (data?.roomId) {
        dispatch(setRoom({
          room: {
            roomId: data.roomId,
            roomCode: data.roomCode ?? '',
            status: 'in_progress'
          }
        }));
      }
      if (data?.gameId && currentPlayer?.playerId) {
        dispatch(fetchGameState({ gameId: data.gameId, playerId: currentPlayer.playerId }));
      }
    };

    socketInstance.on('gameRejoin', handleGameRejoin);

    return () => {
      socketInstance.off('gameRejoin', handleGameRejoin);
    };
  }, [dispatch, currentPlayer?.playerId]);

  // Re-join socket room when on game page so chat and other events work (e.g. after reconnect or if join was missed in lobby)
  useEffect(() => {
    const socketInstance = getSocket();
    const roomId = currentRoom?.roomId;
    const playerId = currentPlayer?.playerId;

    const joinIfReady = () => {
      if (roomId && playerId) {
        socketInstance.emit('joinRoom', { roomId, playerId });
      }
    };

    if (socketInstance.connected) {
      joinIfReady();
    }
    socketInstance.on('connect', joinIfReady);
    return () => {
      socketInstance.off('connect', joinIfReady);
    };
  }, [currentRoom?.roomId, currentPlayer?.playerId]);

  if (winner) {
    return <GameResults />;
  }

  if (!currentPlayer?.playerId) {
    return (
      <div className="max-w-md mx-auto text-center py-12">
        <p className="text-mafia-muted mb-4">Session not found. Please go back and join or create a room.</p>
        <a href="/" className="text-mafia-gold hover:text-mafia-gold-light transition-colors">Return to home</a>
      </div>
    );
  }

  if (loading && !phase) {
    return <Loading message="Rejoining game..." />;
  }

  if (error && !phase) {
    return (
      <div className="max-w-md mx-auto text-center py-12">
        <p className="text-mafia-red-light mb-4">{error}</p>
        <a href="/" className="text-mafia-gold hover:text-mafia-gold-light transition-colors">Return to home</a>
      </div>
    );
  }

  return (
    <>
      <RoleReveal isOpen={showRoleReveal} onClose={() => setShowRoleReveal(false)} />
    <div className="max-w-6xl mx-auto animate-fade-in">
      <div
        className={`mafia-card p-6 mb-4 transition-smooth ${
          phase === GAME_PHASES.NIGHT ? 'animate-glow-night border-mafia-gold/20' : 'animate-glow-day border-mafia-gold/30'
        }`}
      >
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-3 sm:gap-0 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="font-display text-2xl font-bold text-mafia-gold tracking-wide">
              Round {round} — {phase === GAME_PHASES.NIGHT ? '🌙 Night' : '☀️ Day'}
            </h2>
            <div className="flex flex-wrap items-center gap-2 sm:gap-4">
              <div className="flex items-center gap-2">
                <span className="text-mafia-muted text-sm">You:</span>
                <span className="text-mafia-cream font-medium truncate max-w-[120px] sm:max-w-[180px]" title={currentPlayer?.username}>
                  {currentPlayer?.username || '—'}
                </span>
              </div>
              {currentPlayer?.role && (
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-mafia-surface border border-mafia-border ${getRoleColor(currentPlayer.role)}`}
                  title={`Your role: ${getRoleDisplayName(currentPlayer.role)}`}
                >
                  <span aria-hidden>{getRoleIcon(currentPlayer.role)}</span>
                  <span>{getRoleDisplayName(currentPlayer.role)}</span>
                </span>
              )}
              <div className="text-mafia-muted text-sm sm:ml-auto flex items-center gap-2">
                <span>{players.filter(p => p.isAlive).length} players alive</span>
                <button
                  type="button"
                  onClick={openSoundControls}
                  className="p-1.5 rounded-lg text-mafia-muted hover:text-mafia-gold hover:bg-mafia-surface border border-transparent hover:border-mafia-border transition-all"
                  title="Music & sound"
                  aria-label="Game controls (music & sound)"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
          {currentRoom?.roomId && currentPlayer?.username && (
            <VoiceChat roomId={currentRoom.roomId} username={currentPlayer.username} />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 animate-fade-in-up" style={{ animationDelay: '0.05s' }}>
          {phase === GAME_PHASES.NIGHT ? (
            <NightPhase />
          ) : (
            <DayPhase />
          )}
        </div>
        {/* Desktop: chat in sidebar */}
        <div className="hidden lg:block lg:col-span-1 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <Chat />
        </div>
      </div>

      {/* Mobile: chat FAB + popup */}
      <div className="lg:hidden fixed bottom-5 right-5 z-30">
        <button
          type="button"
          onClick={() => setChatOpen(true)}
          className="flex items-center justify-center w-14 h-14 rounded-full bg-mafia-gold hover:bg-mafia-gold-light text-mafia-bg shadow-mafia-gold transition-smooth hover:scale-105 active:scale-95 touch-manipulation"
          aria-label="Open chat"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </button>
      </div>

      {chatOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex flex-col justify-end animate-fade-in">
          <button
            type="button"
            aria-label="Close"
            className="absolute inset-0 bg-black/60 touch-manipulation"
            onClick={() => setChatOpen(false)}
          />
          <div className="relative bg-mafia-card border-t-2 border-x-2 border-mafia-border rounded-t-2xl shadow-2xl flex flex-col max-h-[85vh] animate-fade-in-up">
            <div className="flex-shrink-0 h-1 w-12 mx-auto mt-2 rounded-full bg-mafia-border" aria-hidden />
            <div className="flex-1 min-h-0 flex flex-col p-4 pb-6" style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}>
              <Chat compact onClose={() => setChatOpen(false)} />
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
};

export default GamePage;
