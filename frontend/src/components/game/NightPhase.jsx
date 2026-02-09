import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { getSocket } from '../../services/socket';
import { playSound } from '../../config/sounds';
import ActionPanel from './ActionPanel';
import PlayerCard from './PlayerCard';
import { ROLES } from '../../utils/constants';

const STEP_LABELS = {
  mafia: 'Mafia',
  doctor: 'Doctor',
  detective: 'Detective'
};

const NightPhase = () => {
  const { gameId } = useParams();
  const { players, round, nightStep } = useSelector((state) => state.game);
  const { currentPlayer } = useSelector((state) => state.player);
  const [actionSubmitted, setActionSubmitted] = useState(false);
  const socket = getSocket();

  const step = nightStep || 'mafia';
  const isMyStep = (step === 'mafia' && currentPlayer.role === ROLES.MAFIA) ||
    (step === 'doctor' && currentPlayer.role === ROLES.DOCTOR) ||
    (step === 'detective' && currentPlayer.role === ROLES.DETECTIVE);

  const alivePlayers = players.filter(p => p.isAlive && p.playerId !== currentPlayer.playerId);

  const handleActionSubmit = (targetId) => {
    if (!currentPlayer.role || currentPlayer.role === ROLES.CIVILIAN || !isMyStep) return;
    let actionType;
    switch (currentPlayer.role) {
      case ROLES.MAFIA: actionType = 'kill'; break;
      case ROLES.DOCTOR: actionType = 'save'; break;
      case ROLES.DETECTIVE: actionType = 'investigate'; break;
      default: return;
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
    const handleActionReceived = () => setActionSubmitted(true);
    const handleNightStepChanged = (data) => {
      const newStep = data?.nightStep;
      if (newStep === (currentPlayer.role === ROLES.MAFIA ? 'mafia' : currentPlayer.role === ROLES.DOCTOR ? 'doctor' : currentPlayer.role === ROLES.DETECTIVE ? 'detective' : null)) {
        setActionSubmitted(false);
      }
    };
    socket.on('actionReceived', handleActionReceived);
    socket.on('nightStepChanged', handleNightStepChanged);
    socket.on('phaseChanged', () => setActionSubmitted(false));
    return () => {
      socket.off('actionReceived', handleActionReceived);
      socket.off('nightStepChanged', handleNightStepChanged);
    };
  }, [socket, currentPlayer.role]);

  if (!currentPlayer.role || currentPlayer.role === ROLES.CIVILIAN) {
    return (
      <div className="mafia-card p-6 animate-fade-in-up">
        <h3 className="font-display text-xl font-bold text-mafia-gold mb-4 tracking-wide">🌙 Night Phase — Round {round}</h3>
        <p className="text-mafia-cream">
          The city is sleeping. You have no night action. Waiting for {STEP_LABELS[step]}...
        </p>
      </div>
    );
  }

  if (!isMyStep) {
    return (
      <div className="mafia-card p-6 animate-fade-in-up">
        <h3 className="font-display text-xl font-bold text-mafia-gold mb-4 tracking-wide">🌙 Night Phase — Round {round}</h3>
        <p className="text-mafia-cream">
          The city is sleeping. Waiting for {STEP_LABELS[step]} to act...
        </p>
      </div>
    );
  }

  return (
    <div className="mafia-card p-6 animate-fade-in-up">
      <h3 className="font-display text-xl font-bold text-mafia-gold mb-4 tracking-wide">🌙 Night — {STEP_LABELS[step]} — Round {round}</h3>
      {actionSubmitted ? (
        <div className="text-center py-8 animate-success-pop">
          <p className="text-green-400 text-lg mb-2">✓ Action Submitted</p>
          <p className="text-mafia-muted animate-pulse-slow">Waiting for others...</p>
        </div>
      ) : (
        <>
          <ActionPanel role={currentPlayer.role} onSubmit={handleActionSubmit} />
          <div className="mt-6">
            <h4 className="text-lg font-semibold text-mafia-cream mb-3">Select Target:</h4>
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
