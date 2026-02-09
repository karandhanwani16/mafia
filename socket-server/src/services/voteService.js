export const submitVote = (gameState, voterId, targetId) => {
  const vid = String(voterId);
  const tid = String(targetId);
  const voter = gameState.players.find(p => String(p.playerId) === vid);
  if (!voter || !voter.isAlive) return { success: false, error: 'Dead players cannot vote' };

  const target = gameState.players.find(p => String(p.playerId) === tid);
  if (!target) return { success: false, error: 'Target player not found' };
  if (!target.isAlive) return { success: false, error: 'Cannot vote for dead players' };
  if (gameState.phase !== 'voting' && gameState.phase !== 'day') return { success: false, error: 'Voting is only allowed during day/voting phase' };

  if (!gameState.votes) gameState.votes = [];
  const voterIdStr = String(voterId);
  gameState.votes = gameState.votes.filter(v => String(v.voterId) !== voterIdStr);
  gameState.votes.push({ voterId: voterIdStr, targetId: String(targetId), timestamp: new Date() });
  return { success: true, gameState };
};

export const getVoteCount = (gameState) => {
  if (!gameState.votes || gameState.votes.length === 0) return {};
  const voteCount = {};
  gameState.votes.forEach(vote => {
    const key = String(vote.targetId);
    voteCount[key] = (voteCount[key] || 0) + 1;
  });
  return voteCount;
};

export const resolveVoting = (gameState) => {
  const voteCount = getVoteCount(gameState);
  const alivePlayers = gameState.players.filter(p => p.isAlive);
  const totalVotes = Object.values(voteCount).reduce((sum, count) => sum + count, 0);
  if (totalVotes === 0) return { eliminated: null, tie: false };

  const maxVotes = Math.max(...Object.values(voteCount));
  const topTargets = Object.keys(voteCount).filter(id => voteCount[id] === maxVotes);
  const majority = Math.floor(alivePlayers.length / 2) + 1;

  if (maxVotes >= majority) {
    if (topTargets.length === 1) return { eliminated: topTargets[0], tie: false };
    return { eliminated: null, tie: true };
  }
  if (topTargets.length === 1) return { eliminated: topTargets[0], tie: false };
  return { eliminated: null, tie: true };
};
