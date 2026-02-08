import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { getSocket } from '../../services/socket';
import { playSound } from '../../config/sounds';
import Voting from './Voting';
import PlayerCard from './PlayerCard';
import { GAME_PHASES } from '../../utils/constants';

const DayPhase = () => {
  const { players, phase, eliminatedPlayers, round } = useSelector((state) => state.game);
  const { currentPlayer } = useSelector((state) => state.player);
  const [lastEliminated, setLastEliminated] = useState(null);
  const socket = getSocket();

  useEffect(() => {
    socket.on('dayPhaseStarted', (data) => {
      if (data.eliminated) {
        setLastEliminated(data.eliminated);
        playSound('playerEliminated');
      }
    });

    return () => {
      socket.off('dayPhaseStarted');
    };
  }, [socket]);

  const alivePlayers = players.filter(p => p.isAlive);
  const deadPlayers = players.filter(p => !p.isAlive);

  return (
    <div className="bg-gray-800 rounded-lg p-6 animate-fade-in-up">
      <h3 className="text-xl font-bold text-white mb-4">☀️ Day Phase - Round {round}</h3>

      {lastEliminated && (
        <div className="bg-red-900 bg-opacity-50 border border-red-700 rounded-lg p-4 mb-4 animate-shake">
          <p className="text-red-200">
            {players.find(p => p.playerId === lastEliminated)?.username || 'A player'} was eliminated during the night!
          </p>
        </div>
      )}

      <div className="mb-6">
        <h4 className="text-lg font-semibold text-white mb-3">Alive Players ({alivePlayers.length})</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {alivePlayers.map((player, idx) => (
            <div key={player.playerId} className="animate-fade-in-up" style={{ animationDelay: `${idx * 0.04}s` }}>
              <PlayerCard player={player} />
            </div>
          ))}
        </div>
      </div>

      {deadPlayers.length > 0 && (
        <div className="mb-6">
          <h4 className="text-lg font-semibold text-gray-400 mb-3">Eliminated Players</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {deadPlayers.map((player, idx) => (
              <div key={player.playerId} className="animate-fade-in-up opacity-90" style={{ animationDelay: `${idx * 0.04}s` }}>
                <PlayerCard player={player} showRole />
              </div>
            ))}
          </div>
        </div>
      )}

      {(phase === GAME_PHASES.VOTING || phase === GAME_PHASES.DAY) && <Voting />}
    </div>
  );
};

export default DayPhase;
