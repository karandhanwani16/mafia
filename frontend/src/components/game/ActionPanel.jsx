import { ROLES } from '../../utils/constants';

const getRoleInfo = (role) => {
  const roles = {
    [ROLES.MAFIA]: {
      name: 'Mafia',
      description: 'Work with other mafia members to eliminate all villagers',
      ability: 'Choose a target to eliminate each night'
    },
    [ROLES.DOCTOR]: {
      name: 'Doctor',
      description: 'Protect villagers from mafia attacks',
      ability: 'Save one player each night from elimination'
    },
    [ROLES.DETECTIVE]: {
      name: 'Detective',
      description: 'Investigate players to find mafia members',
      ability: 'Investigate one player each night to learn their alignment'
    }
  };
  return roles[role];
};

const ActionPanel = ({ role, onSubmit }) => {
  const roleInfo = getRoleInfo(role);

  if (!roleInfo) {
    return null;
  }

  return (
    <div className="bg-gray-700 rounded-lg p-4 mb-4 animate-fade-in-up">
      <h4 className="text-lg font-semibold text-white mb-2">Your Role: {roleInfo.name}</h4>
      <p className="text-gray-300 text-sm mb-2">{roleInfo.description}</p>
      <p className="text-blue-400 text-sm font-semibold">Ability: {roleInfo.ability}</p>
    </div>
  );
};

export default ActionPanel;
