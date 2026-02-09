import { ROLES, ACTIONS } from 'mafia-shared';

export const validateAction = (playerId, actionType, targetId, gameState, playerRole) => {
  const player = gameState.players.find(p => p.playerId === playerId);
  if (!player || !player.isAlive) return { valid: false, error: 'Dead players cannot perform actions' };
  if (gameState.phase !== 'night' && actionType !== ACTIONS.KILL) return { valid: false, error: 'Actions can only be performed during night phase' };

  const nightStep = gameState.nightStep || 'mafia';
  const stepRole = nightStep === 'mafia' ? ROLES.MAFIA : nightStep === 'doctor' ? ROLES.DOCTOR : ROLES.DETECTIVE;
  if (playerRole !== stepRole) return { valid: false, error: `Only ${nightStep} can act during this part of the night` };

  const target = gameState.players.find(p => p.playerId === targetId);
  if (!target) return { valid: false, error: 'Target player not found' };
  if (!target.isAlive) return { valid: false, error: 'Cannot target dead players' };

  switch (playerRole) {
    case ROLES.MAFIA:
      if (actionType !== ACTIONS.KILL) return { valid: false, error: 'Mafia can only perform kill actions' };
      break;
    case ROLES.DOCTOR:
      if (actionType !== ACTIONS.SAVE) return { valid: false, error: 'Doctor can only perform save actions' };
      break;
    case ROLES.DETECTIVE:
      if (actionType !== ACTIONS.INVESTIGATE) return { valid: false, error: 'Detective can only perform investigate actions' };
      break;
    case ROLES.CIVILIAN:
      return { valid: false, error: 'Civilians have no night actions' };
    default:
      return { valid: false, error: 'Invalid role' };
  }
  return { valid: true };
};

export const processMafiaAction = (gameState, targetId) => ({
  ...gameState,
  nightActions: { ...gameState.nightActions, mafia: { targetId, submitted: true } }
});

export const processDoctorAction = (gameState, targetId) => ({
  ...gameState,
  nightActions: { ...gameState.nightActions, doctor: { targetId, submitted: true } }
});

export const processDetectiveAction = (gameState, targetId) => {
  const target = gameState.players.find((p) => p.playerId === targetId);
  if (!target) {
    return {
      ...gameState,
      nightActions: { ...gameState.nightActions, detective: { targetId, submitted: true, result: 'civilian' } }
    };
  }
  const role = (target.role && String(target.role).toLowerCase()) || '';
  const result = role === 'mafia' ? 'mafia' : 'civilian';
  return {
    ...gameState,
    nightActions: { ...gameState.nightActions, detective: { targetId, submitted: true, result } }
  };
};
