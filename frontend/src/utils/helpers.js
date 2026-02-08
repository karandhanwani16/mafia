export const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const getRoleColor = (role) => {
  const colors = {
    mafia: 'text-mafia-red-light',
    civilian: 'text-mafia-cream',
    doctor: 'text-mafia-success-light',
    detective: 'text-mafia-gold-light'
  };
  return colors[role] || 'text-mafia-muted';
};

export const getRoleIcon = (role) => {
  const icons = {
    mafia: '🔪',
    civilian: '👤',
    doctor: '💊',
    detective: '🔍'
  };
  return icons[role] || '❓';
};

export const getRoleDisplayName = (role) => {
  const names = {
    mafia: 'Mafia',
    civilian: 'Civilian',
    doctor: 'Doctor',
    detective: 'Detective'
  };
  return names[role] || 'Unknown';
};
