import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { getRoleColor, getRoleIcon } from '../../utils/helpers';
import { playSound } from '../../config/sounds';
import Button from '../common/Button';
import { WINNERS } from '../../utils/constants';

const GameResults = () => {
  const { winner, players } = useSelector((state) => state.game);
  const navigate = useNavigate();

  useEffect(() => {
    if (winner === WINNERS.MAFIA) playSound('gameOverMafia');
    else if (winner === WINNERS.VILLAGERS) playSound('gameOverVillagers');
  }, [winner]);

  const winnerPlayers = players.filter(p => {
    if (winner === WINNERS.MAFIA) {
      return p.role === 'mafia';
    } else {
      return p.role !== 'mafia';
    }
  });

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <div className="mafia-card p-8 text-center animate-scale-in border-mafia-gold/40">
        <h2 className="font-display text-4xl font-bold text-mafia-gold mb-4 animate-fade-in-up tracking-wide">
          {winner === WINNERS.MAFIA ? '🔪 Mafia Wins!' : '🏆 Villagers Win!'}
        </h2>
        <p className="text-mafia-muted mb-8 animate-fade-in-up" style={{ animationDelay: '0.08s' }}>
          {winner === WINNERS.MAFIA
            ? 'The mafia has successfully eliminated all villagers.'
            : 'All mafia members have been eliminated!'}
        </p>

        <div className="mb-8">
          <h3 className="font-display text-2xl font-semibold text-mafia-cream mb-4 animate-fade-in-up" style={{ animationDelay: '0.12s' }}>Winning Team</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {winnerPlayers.map((player, idx) => (
              <div
                key={player.playerId}
                className="bg-mafia-surface border-2 border-mafia-border rounded-lg p-4 animate-fade-in-up"
                style={{ animationDelay: `${0.15 + idx * 0.05}s` }}
              >
                <div className={`text-3xl mb-2 ${getRoleColor(player.role)}`}>
                  {getRoleIcon(player.role)}
                </div>
                <p className="text-mafia-cream font-semibold">{player.username}</p>
                <p className={`text-sm ${getRoleColor(player.role)}`}>
                  {player.role.charAt(0).toUpperCase() + player.role.slice(1)}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-8">
          <h3 className="font-display text-2xl font-semibold text-mafia-cream mb-4">All Players</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {players.map((player, idx) => (
              <div
                key={player.playerId}
                className={`bg-mafia-surface border-2 border-mafia-border rounded-lg p-4 animate-fade-in-up ${!player.isAlive ? 'opacity-50' : ''}`}
                style={{ animationDelay: `${0.25 + idx * 0.03}s` }}
              >
                <div className={`text-3xl mb-2 ${getRoleColor(player.role)}`}>
                  {getRoleIcon(player.role)}
                </div>
                <p className="text-mafia-cream font-semibold">{player.username}</p>
                <p className={`text-sm ${getRoleColor(player.role)}`}>
                  {player.role.charAt(0).toUpperCase() + player.role.slice(1)}
                </p>
                {!player.isAlive && (
                  <p className="text-mafia-red-light text-xs mt-1">Eliminated</p>
                )}
              </div>
            ))}
          </div>
        </div>

        <Button onClick={() => navigate('/')} variant="primary" className="w-full md:w-auto">
          Return to Home
        </Button>
      </div>
    </div>
  );
};

export default GameResults;
