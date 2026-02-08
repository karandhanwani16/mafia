import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { getRoleColor, getRoleIcon } from '../../utils/helpers';
import { playSound } from '../../config/sounds';
import Modal from '../common/Modal';

const RoleReveal = ({ isOpen, onClose }) => {
  const { currentPlayer } = useSelector((state) => state.player);
  const { players } = useSelector((state) => state.game);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (isOpen && currentPlayer.role) {
      setRevealed(true);
      playSound('roleReveal');
    }
  }, [isOpen, currentPlayer.role]);

  if (!currentPlayer.role) return null;

  const roleInfo = {
    mafia: {
      name: 'Mafia',
      description: 'You are a member of the Mafia. Work with your fellow mafia members to eliminate all villagers.',
      teammates: players.filter(p => p.role === 'mafia' && p.isAlive).map(p => p.username)
    },
    civilian: {
      name: 'Civilian',
      description: 'You are a Civilian. Find and eliminate all mafia members using your deduction skills.'
    },
    doctor: {
      name: 'Doctor',
      description: 'You are the Doctor. Protect villagers from mafia attacks by saving one player each night.'
    },
    detective: {
      name: 'Detective',
      description: 'You are the Detective. Investigate players each night to learn their alignment.'
    }
  };

  const info = roleInfo[currentPlayer.role];

  return (
    <Modal isOpen={isOpen && revealed} onClose={onClose} title="Your Role">
      <div className="text-center">
        <div className={`text-6xl mb-4 animate-card-reveal animate-float ${getRoleColor(currentPlayer.role)}`}>
          {getRoleIcon(currentPlayer.role)}
        </div>
        <h3 className="text-2xl font-bold text-white mb-2 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>{info.name}</h3>
        <p className="text-gray-300 mb-4 animate-fade-in-up" style={{ animationDelay: '0.15s' }}>{info.description}</p>
        {info.teammates && info.teammates.length > 0 && (
          <div className="bg-gray-700 rounded p-3 mb-4 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <p className="text-red-400 font-semibold mb-2">Your Mafia Teammates:</p>
            <ul className="text-white">
              {info.teammates.map((name, idx) => (
                <li key={idx}>{name}</li>
              ))}
            </ul>
          </div>
        )}
        <button
          onClick={onClose}
          className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-smooth hover-lift hover:scale-105 active:scale-95"
        >
          Continue
        </button>
      </div>
    </Modal>
  );
};

export default RoleReveal;
