const PlayerList = ({ players }) => {
  return (
    <div className="mt-4">
      <h3 className="text-lg font-semibold text-white mb-3">Players</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {players.map((player) => (
          <div
            key={player.playerId}
            className="bg-gray-700 rounded-lg p-3 flex items-center justify-between"
          >
            <span className="text-white font-medium">{player.username}</span>
            {player.isAlive !== false && (
              <span className="text-green-400 text-sm">●</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PlayerList;
