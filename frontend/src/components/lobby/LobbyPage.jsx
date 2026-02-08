import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getSocket } from '../../services/socket';
import { startGame, setRoom, updatePlayers, resetRoom } from '../../store/slices/roomSlice';
import { setGameState } from '../../store/slices/gameSlice';
import { setRole } from '../../store/slices/playerSlice';
import { roomAPI, gameAPI, appConfigAPI } from '../../services/api';
import { log } from '../../utils/debug';
import Button from '../common/Button';
import Loading from '../common/Loading';
import PlayerList from './PlayerList';

const LobbyPage = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { currentRoom, players, hostId, status } = useSelector((state) => state.room);
  const { currentPlayer } = useSelector((state) => state.player);
  const gameIdFromState = useSelector((state) => state.game.gameId);
  const [socket, setSocket] = useState(null);
  const [minPlayers, setMinPlayers] = useState(5);
  // If we already have this room (e.g. just created it), don't show loading
  const [loading, setLoading] = useState(() => !(currentRoom?.roomId === roomId));

  useEffect(() => {
    appConfigAPI.getAppConfig().then((config) => {
      setMinPlayers(config?.maxPlayersMin ?? 5);
    }).catch(() => {});
  }, []);

  // Fetch room data on mount (or when roomId changes)
  useEffect(() => {
    let cancelled = false;
    const fetchRoom = async () => {
      try {
        const response = await roomAPI.getRoom(roomId);
        if (!cancelled) {
          dispatch(setRoom({ room: response.data.room }));
          dispatch(updatePlayers(response.data.players || []));
        }
      } catch (error) {
        if (!cancelled) { /* fetch room failed */ }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    if (roomId) {
      if (currentRoom?.roomId === roomId) {
        setLoading(false);
      }
      fetchRoom();
    }
    return () => { cancelled = true; };
  }, [roomId, dispatch]);

  // Fallback: if we're on the lobby and never received gameStarted via socket (e.g. non-host joined late or socket missed it), poll room and redirect when game has started
  useEffect(() => {
    if (!roomId || !currentPlayer?.playerId || gameIdFromState) return;
    let cancelled = false;
    const pollInterval = setInterval(async () => {
      if (cancelled) return;
      try {
        const response = await roomAPI.getRoom(roomId);
        if (cancelled) return;
        const room = response.data?.room;
        if (room?.status === 'in_progress' && room?.gameId) {
          log('Lobby poll: game started (missed socket), redirecting', { gameId: room.gameId });
          dispatch(setRoom({ room }));
          dispatch(updatePlayers(response.data.players || []));
          const gameRes = await gameAPI.getGameState(room.gameId, currentPlayer.playerId);
          if (cancelled) return;
          const gameData = gameRes.data;
          dispatch(setGameState(gameData));
          const myRole = gameData.players?.find((p) => p.playerId === currentPlayer.playerId)?.role;
          if (myRole) dispatch(setRole(myRole));
          navigate(`/game/${room.gameId}`, { replace: true });
        }
      } catch {
        // ignore poll errors
      }
    }, 2000);
    return () => {
      cancelled = true;
      clearInterval(pollInterval);
    };
  }, [roomId, currentPlayer?.playerId, gameIdFromState, dispatch, navigate]);

  useEffect(() => {
    const socketInstance = getSocket();
    setSocket(socketInstance);

    if (!currentPlayer.playerId || !roomId) return;

    const payload = { roomId, playerId: currentPlayer.playerId };

    // Only emit joinRoom after socket is connected (connect is async); otherwise server never adds this client to the room
    const emitJoinRoom = () => {
      log('Lobby emit joinRoom', { roomId, playerId: currentPlayer.playerId?.slice(0, 8), socketId: socketInstance.id, connected: socketInstance.connected });
      socketInstance.emit('joinRoom', payload);
    };

    log('Lobby socket setup', { roomId, playerId: currentPlayer.playerId?.slice(0, 8), connected: socketInstance.connected });
    socketInstance.connect();
    if (socketInstance.connected) {
      emitJoinRoom();
    } else {
      socketInstance.once('connect', () => {
        log('Lobby socket connected, emitting joinRoom');
        emitJoinRoom();
      });
    }

    // Re-join on reconnect so we keep receiving roomUpdate
    const onConnect = () => {
      if (roomId && currentPlayer.playerId) {
        socketInstance.emit('joinRoom', { roomId, playerId: currentPlayer.playerId });
      }
    };
    socketInstance.on('connect', onConnect);

    // Retry joinRoom every 2s for a bit so non-host players reliably get into the room before host starts (handles slow connect / race)
    const retryInterval = setInterval(() => {
      if (socketInstance.connected && roomId && currentPlayer.playerId) {
        socketInstance.emit('joinRoom', { roomId, playerId: currentPlayer.playerId });
      }
    }, 2000);
    const stopRetry = () => clearInterval(retryInterval);
    const stopRetryAfter = setTimeout(stopRetry, 15000);

    // roomUpdate is handled by socketMiddleware; don't add/remove it here or cleanup would remove the middleware's listener
    const handleGameStarted = (data) => {
      log('Lobby handleGameStarted (host or in-page listener)', { gameId: data?.gameId });
      dispatch(setGameState(data));
      const playerRole = data.players.find(p => p.playerId === currentPlayer.playerId)?.role;
      if (playerRole) {
        dispatch(setRole(playerRole));
      }
      navigate(`/game/${data.gameId}`);
    };
    socketInstance.on('gameStarted', handleGameStarted);

    return () => {
      socketInstance.off('connect', onConnect);
      socketInstance.off('gameStarted', handleGameStarted);
      clearInterval(retryInterval);
      clearTimeout(stopRetryAfter);
    };
  }, [currentPlayer.playerId, roomId, dispatch, navigate]);

  const handleStartGame = async () => {
    try {
      const data = await dispatch(startGame(roomId, currentPlayer.playerId));
      if (data) {
        dispatch(setGameState(data));
        const playerRole = data.players?.find(p => p.playerId === currentPlayer.playerId)?.role;
        if (playerRole) dispatch(setRole(playerRole));
        navigate(`/game/${data.gameId}`);
      }
    } catch (error) {
      // start game failed
    }
  };

  const handleLeaveRoom = async () => {
    try {
      await roomAPI.leaveRoom(roomId, { playerId: currentPlayer.playerId });
      getSocket().emit('leaveRoom');
      dispatch(resetRoom());
      navigate('/');
    } catch (error) {
      // leave failed - could show toast
    }
  };

  const isHost = currentPlayer.playerId === hostId;
  const canStart = isHost && players.length >= minPlayers && status === 'waiting';

  if (loading || !currentRoom) {
    return <Loading message="Loading room..." />;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mafia-card p-6 mb-6">
        <h2 className="font-display text-2xl font-bold text-mafia-gold mb-4 tracking-wide">Game Lobby</h2>
        <div className="space-y-2 mb-6 p-4 bg-mafia-surface/80 rounded-lg border border-mafia-border">
          <div className="flex items-center justify-between">
            <span className="text-mafia-muted">Room Code</span>
            <span className="text-2xl font-display font-bold text-mafia-gold font-mono tracking-widest">{currentRoom.roomCode}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-mafia-muted">Players</span>
            <span className="text-mafia-cream font-semibold">{players.length} / {currentRoom.maxPlayers}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-mafia-muted">Status</span>
            <span className="text-mafia-cream font-semibold capitalize">{status}</span>
          </div>
        </div>

        {players.length < minPlayers && (
          <div className="bg-mafia-gold/10 border-2 border-mafia-gold-dim text-mafia-gold-light px-4 py-3 rounded-lg mb-4">
            Need at least {minPlayers} players to start (currently {players.length})
          </div>
        )}

        <PlayerList players={players} />

        <div className="mt-6 flex flex-col gap-3">
          {isHost && (
            <Button
              onClick={handleStartGame}
              disabled={!canStart}
              className="w-full"
              variant="success"
            >
              Start Game
            </Button>
          )}
          <Button
            onClick={handleLeaveRoom}
            className="w-full"
            variant="secondary"
          >
            Leave Room
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LobbyPage;
