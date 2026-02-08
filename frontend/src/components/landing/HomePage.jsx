import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { createRoom, joinRoomByCode } from '../../store/slices/roomSlice';
import { setPlayer } from '../../store/slices/playerSlice';
import { playSound } from '../../config/sounds';
import Button from '../common/Button';
import Loading from '../common/Loading';

const TESTING_MODE = import.meta.env.VITE_TESTING_MODE === 'true';
const defaultJoinForm = () => ({
  roomCode: TESTING_MODE ? '000000' : '',
  playerName: TESTING_MODE ? `Player${Math.floor(1000 + Math.random() * 9000)}` : ''
});

const HomePage = () => {
  const [createForm, setCreateForm] = useState({ hostName: '', maxPlayers: 12 });
  const [joinForm, setJoinForm] = useState(() => defaultJoinForm());
  const [activeTab, setActiveTab] = useState('create');
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state) => state.room);

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    try {
      const data = await dispatch(createRoom(createForm));
      if (!data?.roomId) return;
      dispatch(setPlayer({ playerId: data.hostId, username: createForm.hostName }));
      navigate(`/lobby/${data.roomId}`, { replace: true });
    } catch (err) {
      // create room failed
    }
  };

  const handleJoinRoom = async (e) => {
    e.preventDefault();
    try {
      const data = await dispatch(joinRoomByCode({
        roomCode: joinForm.roomCode.trim().toUpperCase(),
        playerName: joinForm.playerName.trim()
      }));
      if (!data?.roomId) return;
      dispatch(setPlayer({ playerId: data.playerId, username: joinForm.playerName.trim() }));
      navigate(`/lobby/${data.roomId}`, { replace: true });
    } catch (err) {
      // join room failed
    }
  };

  if (loading) {
    return <Loading message="Creating room..." />;
  }

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <div className="text-center mb-8 animate-fade-in-up">
        <h1 className="text-4xl font-bold text-white mb-4">🎭 Mafia Game</h1>
        <p className="text-gray-400 text-lg">
          A social deduction game where players work together to find the mafia
        </p>
      </div>

      <div className="bg-gray-800 rounded-lg p-6 animate-fade-in-up" style={{ animationDelay: '0.08s' }}>
        <div className="flex border-b border-gray-700 mb-6">
          <button
            onClick={() => {
              setActiveTab('create');
              playSound('uiTab');
            }}
            className={`flex-1 py-2 px-4 font-semibold transition-smooth ${
              activeTab === 'create'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Create Room
          </button>
          <button
            onClick={() => {
              setActiveTab('join');
              playSound('uiTab');
            }}
            className={`flex-1 py-2 px-4 font-semibold transition-smooth ${
              activeTab === 'join'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Join Room
          </button>
        </div>

        {error && (
          <div className="bg-red-900 bg-opacity-50 border border-red-700 text-red-200 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {activeTab === 'create' ? (
          <form onSubmit={handleCreateRoom} className="space-y-4">
            <div>
              <label className="block text-gray-300 mb-2">Your Name</label>
              <input
                type="text"
                value={createForm.hostName}
                onChange={(e) => setCreateForm({ ...createForm, hostName: e.target.value })}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
                placeholder="Enter your name"
                required
                maxLength={20}
              />
            </div>
            <div>
              <label className="block text-gray-300 mb-2">Max Players (5-12)</label>
              <input
                type="number"
                value={createForm.maxPlayers}
                onChange={(e) => setCreateForm({ ...createForm, maxPlayers: parseInt(e.target.value) })}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
                min="5"
                max="12"
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              Create Room
            </Button>
          </form>
        ) : (
          <form onSubmit={handleJoinRoom} className="space-y-4">
            <div>
              <label className="block text-gray-300 mb-2">Room Code</label>
              <input
                type="text"
                value={joinForm.roomCode}
                onChange={(e) => setJoinForm({ ...joinForm, roomCode: e.target.value.toUpperCase() })}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500 uppercase"
                placeholder="Enter room code"
                required
                maxLength={6}
              />
            </div>
            <div>
              <label className="block text-gray-300 mb-2">Your Name</label>
              <input
                type="text"
                value={joinForm.playerName}
                onChange={(e) => setJoinForm({ ...joinForm, playerName: e.target.value })}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
                placeholder="Enter your name"
                required
                maxLength={20}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              Join Room
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};

export default HomePage;
