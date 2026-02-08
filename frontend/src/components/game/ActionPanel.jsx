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
    <div className="bg-mafia-surface border-2 border-mafia-border rounded-lg p-4 mb-4 animate-fade-in-up">
      <h4 className="font-display text-lg font-semibold text-mafia-gold mb-2">Your Role: {roleInfo.name}</h4>
      <p className="text-mafia-cream text-sm mb-2">{roleInfo.description}</p>
      <p className="text-mafia-gold-light text-sm font-semibold">Ability: {roleInfo.ability}</p>
    </div>
  );
};

export default ActionPanel;
