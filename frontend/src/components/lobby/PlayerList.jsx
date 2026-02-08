const PlayerList = ({ players }) => {
  return (
    <div className="mt-4">
      <h3 className="font-display text-lg font-semibold text-mafia-gold mb-3 tracking-wide">Players</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {players.map((player) => (
          <div
            key={player.playerId}
            className="bg-mafia-surface border-2 border-mafia-border rounded-lg p-3 flex items-center justify-between hover:border-mafia-border-light transition-colors"
          >
            <span className="text-mafia-cream font-medium">{player.username}</span>
            {player.isAlive !== false && (
              <span className="text-mafia-success text-sm">●</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PlayerList;
