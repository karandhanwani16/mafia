import { getRoleColor, getRoleIcon } from '../../utils/helpers';

const PlayerCard = ({ player, onClick, selected = false, clickable = false, showRole = false }) => {
  const baseClasses = 'bg-gray-700 rounded-lg p-4 transition-smooth';
  const clickableClasses = clickable ? 'cursor-pointer hover:bg-gray-600 hover-lift' : '';
  const selectedClasses = selected ? 'ring-2 ring-blue-500 bg-gray-600 ring-offset-2 ring-offset-gray-800' : '';
  const deadClasses = !player.isAlive ? 'opacity-50' : '';

  return (
    <div
      className={`${baseClasses} ${clickableClasses} ${selectedClasses} ${deadClasses}`}
      onClick={clickable ? onClick : undefined}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-white font-semibold">{player.username}</span>
        {player.isAlive ? (
          <span className="text-green-400 text-sm">●</span>
        ) : (
          <span className="text-red-400 text-sm">✕</span>
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
