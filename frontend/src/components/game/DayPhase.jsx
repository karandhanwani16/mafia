import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import Voting from './Voting';
import PlayerCard from './PlayerCard';
import { GAME_PHASES } from '../../utils/constants';
import { ROLES } from '../../utils/constants';

const DayPhase = () => {
  const { players, phase, round, lastDayDetectiveResult, lastNightEliminated, gameId } = useSelector((state) => state.game);
  const { currentPlayer } = useSelector((state) => state.player);
  const [deathRevealShown, setDeathRevealShown] = useState(false);

  const meInGame = players.find(p => p.playerId === currentPlayer.playerId);
  const isDead = meInGame?.isAlive === false;
  const iWasEliminatedLastNight = lastNightEliminated === currentPlayer.playerId;
  const showDeathReveal = isDead && iWasEliminatedLastNight && !deathRevealShown;

  useEffect(() => {
    setDeathRevealShown(false);
  }, [gameId]);

  useEffect(() => {
    if (!showDeathReveal) return;
    const t = setTimeout(() => setDeathRevealShown(true), 4000);
    return () => clearTimeout(t);
  }, [showDeathReveal]);

  const alivePlayers = players.filter(p => p.isAlive);
  const deadPlayers = players.filter(p => !p.isAlive);
  const eliminatedPlayer = lastNightEliminated ? players.find(p => p.playerId === lastNightEliminated) : null;
  const investigatedPlayer = lastDayDetectiveResult?.targetId ? players.find(p => p.playerId === lastDayDetectiveResult.targetId) : null;

  return (
    <div className="mafia-card p-6 animate-fade-in-up relative">
      {showDeathReveal && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-lg bg-mafia-bg/95 p-6 border-2 border-mafia-red animate-death-reveal-screen">
          <div className="text-6xl mb-4">💀</div>
          <h3 className="font-display text-2xl md:text-3xl font-bold text-mafia-red mb-2 text-center tracking-wide">
            You were eliminated during the night
          </h3>
          <p className="text-mafia-muted text-center mb-6 max-w-sm">
            The town has moved on. You can no longer vote or take actions, but you may stay and watch.
          </p>
          <button
            type="button"
            onClick={() => setDeathRevealShown(true)}
            className="px-6 py-2.5 rounded-lg font-display font-semibold bg-mafia-red/20 text-mafia-red border-2 border-mafia-red hover:bg-mafia-red/30 transition-colors"
          >
            Continue
          </button>
        </div>
      )}
      <h3 className="font-display text-xl font-bold text-mafia-gold mb-4 tracking-wide">☀️ Day Phase — Round {round}</h3>

      {lastNightEliminated && eliminatedPlayer ? (
        <div className="bg-mafia-red/30 border-2 border-mafia-red rounded-lg p-4 mb-4 animate-shake">
          <p className="text-mafia-cream">{eliminatedPlayer.username} was eliminated during the night!</p>
        </div>
      ) : (
        <div className="bg-mafia-surface border-2 border-mafia-border rounded-lg p-4 mb-4">
          <p className="text-mafia-cream">No one was found dead. The town wakes safely.</p>
        </div>
      )}

      {currentPlayer.role === ROLES.DETECTIVE && lastDayDetectiveResult && (
        <div className="bg-mafia-gold/20 border-2 border-mafia-gold rounded-lg p-4 mb-4">
          <p className="text-mafia-cream font-medium">
            Your investigation: <span className="text-mafia-gold font-semibold">{investigatedPlayer?.username || 'That player'}</span>{' '}
            {lastDayDetectiveResult.result === 'mafia' ? 'is mafia.' : 'is not mafia.'}
          </p>
        </div>
      )}

      <div className="mb-6">
        <h4 className="font-display text-lg font-semibold text-mafia-gold mb-3">Alive Players ({alivePlayers.length})</h4>
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
          <h4 className="font-display text-lg font-semibold text-mafia-muted mb-3">Eliminated Players</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {deadPlayers.map((player, idx) => (
              <div key={player.playerId} className="animate-fade-in-up opacity-90" style={{ animationDelay: `${idx * 0.04}s` }}>
                <PlayerCard player={player} showRole />
              </div>
            ))}
          </div>
        </div>
      )}

      {(phase === GAME_PHASES.VOTING || phase === GAME_PHASES.DAY || phase === GAME_PHASES.RESULTS) && <Voting />}
    </div>
  );
};

export default DayPhase;
