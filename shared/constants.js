// Shared constants between frontend and backend

export const GAME_PHASES = {
  NIGHT: 'night',
  DAY: 'day',
  VOTING: 'voting',
  RESULTS: 'results'
};

export const ROOM_STATUS = {
  WAITING: 'waiting',
  IN_PROGRESS: 'in_progress',
  FINISHED: 'finished'
};

export const ROLES = {
  MAFIA: 'mafia',
  CIVILIAN: 'civilian',
  DOCTOR: 'doctor',
  DETECTIVE: 'detective'
};

export const ACTIONS = {
  KILL: 'kill',
  SAVE: 'save',
  INVESTIGATE: 'investigate'
};

export const WINNERS = {
  MAFIA: 'mafia',
  VILLAGERS: 'villagers'
};

export const MIN_PLAYERS = 5;
export const MAX_PLAYERS = 12;

export const PHASE_TIMERS = {
  NIGHT: 90, // seconds
  DAY_DISCUSSION: 300, // seconds
  VOTING: 60 // seconds
};

export const ROLE_DISTRIBUTION = {
  5: { mafia: 1, doctor: 1, detective: 1, civilian: 2 },
  6: { mafia: 1, doctor: 1, detective: 1, civilian: 3 },
  7: { mafia: 2, doctor: 1, detective: 1, civilian: 3 },
  8: { mafia: 2, doctor: 1, detective: 1, civilian: 4 },
  9: { mafia: 2, doctor: 1, detective: 1, civilian: 5 },
  10: { mafia: 3, doctor: 1, detective: 1, civilian: 5 },
  11: { mafia: 3, doctor: 1, detective: 1, civilian: 6 },
  12: { mafia: 3, doctor: 1, detective: 1, civilian: 7 }
};
