import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { getSocket } from '../../services/socket';
import { playSound } from '../../config/sounds';
import ActionPanel from './ActionPanel';
import PlayerCard from './PlayerCard';
import { ROLES } from '../../utils/constants';

const NightPhase = () => {
  const { gameId } = useParams();
  const { players, round } = useSelector((state) => state.game);
  const { currentPlayer } = useSelector((state) => state.player);
  const [actionSubmitted, setActionSubmitted] = useState(false);
  const socket = getSocket();

  const alivePlayers = players.filter(p => p.isAlive && p.playerId !== currentPlayer.playerId);
  const currentPlayerData = players.find(p => p.playerId === currentPlayer.playerId);

  const handleActionSubmit = (targetId) => {
    if (!currentPlayer.role || currentPlayer.role === ROLES.CIVILIAN) {
      return;
    }

    let actionType;
    switch (currentPlayer.role) {
      case ROLES.MAFIA:
        actionType = 'kill';
        break;
      case ROLES.DOCTOR:
        actionType = 'save';
        break;
      case ROLES.DETECTIVE:
        actionType = 'investigate';
        break;
      default:
        return;
    }

    socket.emit('submitNightAction', {
      gameId,
      playerId: currentPlayer.playerId,
      actionType,
      targetId
    });

    playSound('actionSubmit');
    setActionSubmitted(true);
  };

  useEffect(() => {
    const handleActionReceived = () => {
      setActionSubmitted(true);
    };

    socket.on('actionReceived', handleActionReceived);
    socket.on('phaseChanged', () => {
      setActionSubmitted(false);
    });

    return () => {
      socket.off('actionReceived', handleActionReceived);
    };
  }, [socket]);

  if (!currentPlayer.role || currentPlayer.role === ROLES.CIVILIAN) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 animate-fade-in-up">
        <h3 className="text-xl font-bold text-white mb-4">🌙 Night Phase</h3>
        <p className="text-gray-300">
          As a Civilian, you have no night action. Rest and wait for the day phase.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6 animate-fade-in-up">
      <h3 className="text-xl font-bold text-white mb-4">🌙 Night Phase - Round {round}</h3>
      
      {actionSubmitted ? (
        <div className="text-center py-8 animate-success-pop">
          <p className="text-green-400 text-lg mb-2">✓ Action Submitted</p>
          <p className="text-gray-400 animate-pulse-slow">Waiting for other players...</p>
        </div>
      ) : (
        <>
          <ActionPanel role={currentPlayer.role} onSubmit={handleActionSubmit} />
          <div className="mt-6">
            <h4 className="text-lg font-semibold text-white mb-3">Select Target:</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {alivePlayers.map((player, idx) => (
                <div key={player.playerId} className="animate-fade-in-up" style={{ animationDelay: `${idx * 0.04}s` }}>
                  <PlayerCard
                  player={player}
                  onClick={() => handleActionSubmit(player.playerId)}
                  clickable
                />
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default NightPhase;
