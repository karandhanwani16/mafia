export const submitVote = (gameState, voterId, targetId) => {
  // Check if voter is alive
  const voter = gameState.players.find(p => p.playerId === voterId);
  if (!voter || !voter.isAlive) {
    return { success: false, error: 'Dead players cannot vote' };
  }

  // Check if target exists and is alive
  const target = gameState.players.find(p => p.playerId === targetId);
  if (!target) {
    return { success: false, error: 'Target player not found' };
  }
  if (!target.isAlive) {
    return { success: false, error: 'Cannot vote for dead players' };
  }

  // Check if game is in voting phase
  if (gameState.phase !== 'voting' && gameState.phase !== 'day') {
    return { success: false, error: 'Voting is only allowed during day/voting phase' };
  }

  // Initialize votes array if it doesn't exist
  if (!gameState.votes) {
    gameState.votes = [];
  }

  // Remove existing vote from this voter
  gameState.votes = gameState.votes.filter(v => v.voterId !== voterId);

  // Add new vote
  gameState.votes.push({
    voterId,
    targetId,
    timestamp: new Date()
  });

  return { success: true, gameState };
};

export const getVoteCount = (gameState) => {
  if (!gameState.votes || gameState.votes.length === 0) {
    return {};
  }

  const voteCount = {};
  gameState.votes.forEach(vote => {
    voteCount[vote.targetId] = (voteCount[vote.targetId] || 0) + 1;
  });

  return voteCount;
};

export const resolveVoting = (gameState) => {
  const voteCount = getVoteCount(gameState);
  const alivePlayers = gameState.players.filter(p => p.isAlive);
  const totalVotes = Object.values(voteCount).reduce((sum, count) => sum + count, 0);

  if (totalVotes === 0) {
    return { eliminated: null, tie: false };
  }

  // Find player(s) with most votes
  const maxVotes = Math.max(...Object.values(voteCount));
  const topTargets = Object.keys(voteCount).filter(
    targetId => voteCount[targetId] === maxVotes
  );

  // Check for majority (more than half of alive players)
  const majority = Math.floor(alivePlayers.length / 2) + 1;

  if (maxVotes >= majority) {
    // Single winner with majority
    if (topTargets.length === 1) {
      return { eliminated: topTargets[0], tie: false };
    } else {
      // Tie with majority - no elimination
      return { eliminated: null, tie: true };
    }
  } else {
    // No majority reached
    if (topTargets.length === 1) {
      // Single most votes but no majority - still eliminate
      return { eliminated: topTargets[0], tie: false };
    } else {
      // Tie - no elimination
      return { eliminated: null, tie: true };
    }
  }
};

export const handleTie = (gameState) => {
  // On tie, no one is eliminated
  return {
    ...gameState,
    phase: 'day', // Return to day phase
    votes: [] // Clear votes for next round
  };
};
