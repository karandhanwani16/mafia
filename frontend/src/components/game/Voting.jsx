import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { getSocket } from '../../services/socket';
import { playSound } from '../../config/sounds';
import PlayerCard from './PlayerCard';
import Button from '../common/Button';

const Voting = () => {
  const { gameId } = useParams();
  const { players, votes, voteCount } = useSelector((state) => state.game);
  const { currentPlayer } = useSelector((state) => state.player);
  const [selectedTarget, setSelectedTarget] = useState(null);
  const [voted, setVoted] = useState(false);
  const socket = getSocket();

  const alivePlayers = players.filter(p => p.isAlive && p.playerId !== currentPlayer.playerId);
  const hasVoted = votes.some(v => v.voterId === currentPlayer.playerId);

  const handleVote = () => {
    if (!selectedTarget || hasVoted) return;

    socket.emit('submitVote', {
      gameId,
      playerId: currentPlayer.playerId,
      targetId: selectedTarget
    });

    playSound('voteSubmit');
    setVoted(true);
  };

  if (!currentPlayer.isAlive) {
    return (
      <div className="mafia-card p-6 animate-fade-in-up">
        <h3 className="font-display text-xl font-bold text-mafia-gold mb-4 tracking-wide">Voting</h3>
        <p className="text-mafia-muted">Dead players cannot vote.</p>
      </div>
    );
  }

  return (
    <div className="mafia-card p-6 mt-4 animate-fade-in-up">
      <h3 className="font-display text-xl font-bold text-mafia-gold mb-4 tracking-wide">Vote to Eliminate</h3>

      {hasVoted ? (
        <div className="text-center py-4 animate-success-pop">
          <p className="text-mafia-success-light mb-4">✓ Your vote has been submitted</p>
          <div className="mt-4">
            <h4 className="font-display text-lg font-semibold text-mafia-cream mb-2">Current Votes</h4>
            <div className="space-y-2">
              {Object.entries(voteCount).map(([targetId, count], idx) => {
                const player = players.find(p => p.playerId === targetId);
                return (
                  <div
                    key={targetId}
                    className="flex justify-between items-center bg-mafia-surface border border-mafia-border rounded p-2 animate-fade-in-up transition-smooth"
                    style={{ animationDelay: `${idx * 0.05}s` }}
                  >
                    <span className="text-mafia-cream">{player?.username}</span>
                    <span className="text-mafia-gold font-bold">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <>
          <p className="text-mafia-cream mb-4">Select a player to vote for elimination:</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
            {alivePlayers.map((player) => (
              <PlayerCard
                key={player.playerId}
                player={player}
                onClick={() => setSelectedTarget(player.playerId)}
                selected={selectedTarget === player.playerId}
                clickable
              />
            ))}
          </div>
          <Button
            onClick={handleVote}
            disabled={!selectedTarget}
            className="w-full"
            variant="danger"
          >
            Vote to Eliminate
          </Button>
        </>
      )}
    </div>
  );
};

export default Voting;
