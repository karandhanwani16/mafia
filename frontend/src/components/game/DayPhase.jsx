import { useSelector } from 'react-redux';
import Voting from './Voting';
import PlayerCard from './PlayerCard';
import { GAME_PHASES } from '../../utils/constants';
import { ROLES } from '../../utils/constants';

const DayPhase = () => {
  const { players, phase, round, lastDayDetectiveResult, lastNightEliminated } = useSelector((state) => state.game);
  const { currentPlayer } = useSelector((state) => state.player);

  const alivePlayers = players.filter(p => p.isAlive);
  const deadPlayers = players.filter(p => !p.isAlive);
  const eliminatedPlayer = lastNightEliminated ? players.find(p => p.playerId === lastNightEliminated) : null;
  const investigatedPlayer = lastDayDetectiveResult?.targetId ? players.find(p => p.playerId === lastDayDetectiveResult.targetId) : null;

  return (
    <div className="mafia-card p-6 animate-fade-in-up">
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
            Your investigation: {investigatedPlayer?.username || 'That player'} is <span className="text-mafia-gold">{lastDayDetectiveResult.result === 'mafia' ? 'Mafia' : 'Civilian'}</span>.
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

      {(phase === GAME_PHASES.VOTING || phase === GAME_PHASES.DAY) && <Voting />}
    </div>
  );
};

export default DayPhase;
