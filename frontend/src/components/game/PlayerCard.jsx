import { getRoleColor, getRoleIcon } from '../../utils/helpers';

const PlayerCard = ({ player, onClick, selected = false, clickable = false, showRole = false }) => {
  const baseClasses = 'bg-mafia-surface border-2 border-mafia-border rounded-lg p-4 transition-smooth';
  const clickableClasses = clickable ? 'cursor-pointer hover:border-mafia-gold hover:bg-mafia-card hover-lift' : '';
  const selectedClasses = selected ? 'ring-2 ring-mafia-gold border-mafia-gold bg-mafia-card ring-offset-2 ring-offset-mafia-bg' : '';
  const deadClasses = !player.isAlive ? 'opacity-50' : '';

  return (
    <div
      className={`${baseClasses} ${clickableClasses} ${selectedClasses} ${deadClasses}`}
      onClick={clickable ? onClick : undefined}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-mafia-cream font-semibold">{player.username}</span>
        {player.isAlive ? (
          <span className="text-mafia-success text-sm">●</span>
        ) : (
          <span className="text-mafia-red-light text-sm">✕</span>
        )}
      </div>
      {showRole && player.role && (
        <div className={`text-sm ${getRoleColor(player.role)}`}>
          {getRoleIcon(player.role)} {player.role.charAt(0).toUpperCase() + player.role.slice(1)}
        </div>
      )}
    </div>
  );
};

export default PlayerCard;
