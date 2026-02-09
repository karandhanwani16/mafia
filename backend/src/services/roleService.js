import { ROLES, ACTIONS } from 'mafia-shared';

export const getRoleInfo = (role) => {
  const roleInfo = {
    [ROLES.MAFIA]: {
      name: 'Mafia',
      description: 'Work with other mafia members to eliminate all villagers',
      ability: 'Choose a target to eliminate each night',
      team: 'mafia'
    },
    [ROLES.CIVILIAN]: {
      name: 'Civilian',
      description: 'Find and eliminate all mafia members',
      ability: 'No special ability - use your deduction skills',
      team: 'villagers'
    },
    [ROLES.DOCTOR]: {
      name: 'Doctor',
      description: 'Protect villagers from mafia attacks',
      ability: 'Save one player each night from elimination',
      team: 'villagers'
    },
    [ROLES.DETECTIVE]: {
      name: 'Detective',
      description: 'Investigate players to find mafia members',
      ability: 'Investigate one player each night to learn their alignment',
      team: 'villagers'
    }
  };

  return roleInfo[role] || null;
};

export const validateAction = (playerId, actionType, targetId, gameState, playerRole) => {
  // Check if player is alive
  const player = gameState.players.find(p => p.playerId === playerId);
  if (!player || !player.isAlive) {
    return { valid: false, error: 'Dead players cannot perform actions' };
  }

  // Check if game is in correct phase
  if (gameState.phase !== 'night' && actionType !== ACTIONS.KILL) {
    return { valid: false, error: 'Actions can only be performed during night phase' };
  }

  // During night, only the current step's role can act
  const nightStep = gameState.nightStep || 'mafia';
  const stepRole = nightStep === 'mafia' ? ROLES.MAFIA : nightStep === 'doctor' ? ROLES.DOCTOR : ROLES.DETECTIVE;
  if (playerRole !== stepRole) {
    return { valid: false, error: `Only ${nightStep} can act during this part of the night` };
  }

  // Check if target exists and is alive
  const target = gameState.players.find(p => p.playerId === targetId);
  if (!target) {
    return { valid: false, error: 'Target player not found' };
  }
  if (!target.isAlive) {
    return { valid: false, error: 'Cannot target dead players' };
  }

  // Validate role-specific actions
  switch (playerRole) {
    case ROLES.MAFIA:
      if (actionType !== ACTIONS.KILL) {
        return { valid: false, error: 'Mafia can only perform kill actions' };
      }
      break;
    case ROLES.DOCTOR:
      if (actionType !== ACTIONS.SAVE) {
        return { valid: false, error: 'Doctor can only perform save actions' };
      }
      break;
    case ROLES.DETECTIVE:
      if (actionType !== ACTIONS.INVESTIGATE) {
        return { valid: false, error: 'Detective can only perform investigate actions' };
      }
      break;
    case ROLES.CIVILIAN:
      return { valid: false, error: 'Civilians have no night actions' };
    default:
      return { valid: false, error: 'Invalid role' };
  }

  return { valid: true };
};

export const processMafiaAction = (gameState, targetId) => {
  // Mafia kill is registered, will be processed when night phase ends
  return {
    ...gameState,
    nightActions: {
      ...gameState.nightActions,
      mafia: {
        targetId,
        submitted: true
      }
    }
  };
};

export const processDoctorAction = (gameState, targetId) => {
  return {
    ...gameState,
    nightActions: {
      ...gameState.nightActions,
      doctor: {
        targetId,
        submitted: true
      }
    }
  };
};

export const processDetectiveAction = (gameState, targetId) => {
  const target = gameState.players.find((p) => p.playerId === targetId);
  const role = (target?.role && String(target.role).toLowerCase()) || '';
  const result = role === 'mafia' ? 'mafia' : 'civilian';

  return {
    ...gameState,
    nightActions: {
      ...gameState.nightActions,
      detective: {
        targetId,
        submitted: true,
        result
      }
    }
  };
};

export const getVisibleRoles = (playerId, gameState) => {
  const player = gameState.players.find(p => p.playerId === playerId);
  if (!player) return {};

  const visible = {
    ownRole: player.role,
    alivePlayers: gameState.players.filter(p => p.isAlive).map(p => ({
      playerId: p.playerId,
      username: p.username
    })),
    eliminatedPlayers: gameState.eliminatedPlayers
  };

  // Mafia can see other mafia members
  if (player.role === ROLES.MAFIA) {
    visible.mafiaMembers = gameState.players
      .filter(p => p.role === ROLES.MAFIA && p.isAlive)
      .map(p => ({
        playerId: p.playerId,
        username: p.username
      }));
  }

  return visible;
};
