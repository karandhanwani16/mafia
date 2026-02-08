export const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const getRoleColor = (role) => {
  const colors = {
    mafia: 'text-red-500',
    civilian: 'text-blue-400',
    doctor: 'text-green-400',
    detective: 'text-yellow-400'
  };
  return colors[role] || 'text-gray-400';
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
