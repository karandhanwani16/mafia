import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchGameState } from '../store/slices/gameSlice';

export const useGameState = (gameId) => {
  const dispatch = useDispatch();
  const game = useSelector((state) => state.game);
  const { currentPlayer } = useSelector((state) => state.player);

  useEffect(() => {
    if (gameId && currentPlayer.playerId) {
      dispatch(fetchGameState({ gameId, playerId: currentPlayer.playerId }));
      const interval = setInterval(fetchState, 5000); // Refresh every 5 seconds

      return () => clearInterval(interval);
    }
  }, [gameId, currentPlayer.playerId, dispatch]);

  return game;
};
