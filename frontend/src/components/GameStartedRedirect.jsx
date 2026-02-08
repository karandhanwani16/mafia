import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { setRole } from '../store/slices/playerSlice';
import { log } from '../utils/debug';

/**
 * When gameStarted is received via socket (middleware updates Redux) but we're still on the lobby
 * route, redirect to the game and set role. Ensures non-host players navigate when host starts the game.
 */
export default function GameStartedRedirect() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { gameId, players } = useSelector((state) => state.game);
  const currentPlayer = useSelector((state) => state.player?.currentPlayer);

  useEffect(() => {
    log('GameStartedRedirect effect', { gameId, path: location.pathname, hasCurrentPlayer: !!currentPlayer?.playerId, onLobby: location.pathname.startsWith('/lobby/') });
    if (!gameId || !location.pathname.startsWith('/lobby/')) return;
    const role = players?.find((p) => p.playerId === currentPlayer?.playerId)?.role;
    log('GameStartedRedirect redirecting to game', { gameId, role });
    if (role) dispatch(setRole(role));
    navigate(`/game/${gameId}`, { replace: true });
  }, [gameId, location.pathname, players, currentPlayer?.playerId, dispatch, navigate]);

  return null;
}
