import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { createRoom, joinRoomByCode } from '../../store/slices/roomSlice';
import { setPlayer } from '../../store/slices/playerSlice';
import { playSound } from '../../config/sounds';
import { appConfigAPI } from '../../services/api';
import Button from '../common/Button';
import Loading from '../common/Loading';

const HomePage = () => {
  const [appConfig, setAppConfig] = useState({ maxPlayersMin: 5, maxPlayersMax: 12 });
  const [createForm, setCreateForm] = useState({ hostName: '', maxPlayers: 12 });
  const [joinForm, setJoinForm] = useState({ roomCode: '', playerName: '' });
  const [activeTab, setActiveTab] = useState('create');

  useEffect(() => {
    appConfigAPI.getAppConfig().then((config) => {
      const min = config?.maxPlayersMin ?? 5;
      const max = config?.maxPlayersMax ?? 12;
      setAppConfig({ maxPlayersMin: min, maxPlayersMax: max });
      setCreateForm((f) => ({ ...f, maxPlayers: Math.min(Math.max(f.maxPlayers, min), max) }));
      if (config?.testingMode) {
        setJoinForm({
          roomCode: '000000',
          playerName: `Player${Math.floor(1000 + Math.random() * 9000)}`
        });
      }
    }).catch(() => {});
  }, []);
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
        <h1 className="font-display text-4xl font-bold text-mafia-gold mb-3 tracking-wide">🎭 Mafia</h1>
        <p className="text-mafia-muted text-lg">
          A social deduction game. Find the mafia—or stay hidden.
        </p>
      </div>

      <div className="mafia-card p-6 animate-fade-in-up" style={{ animationDelay: '0.08s' }}>
        <div className="flex border-b-2 border-mafia-border mb-6 -mx-6 px-6">
          <button
            onClick={() => {
              setActiveTab('create');
              playSound('uiTab');
            }}
            className={`mafia-tab ${activeTab === 'create' ? 'mafia-tab-active' : 'mafia-tab-inactive'}`}
          >
            Create Room
          </button>
          <button
            onClick={() => {
              setActiveTab('join');
              playSound('uiTab');
            }}
            className={`mafia-tab ${activeTab === 'join' ? 'mafia-tab-active' : 'mafia-tab-inactive'}`}
          >
            Join Room
          </button>
        </div>

        {error && (
          <div className="bg-mafia-red/30 border-2 border-mafia-red text-mafia-cream px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {activeTab === 'create' ? (
          <form onSubmit={handleCreateRoom} className="space-y-4">
            <div>
              <label className="mafia-label">Your Name</label>
              <input
                type="text"
                value={createForm.hostName}
                onChange={(e) => setCreateForm({ ...createForm, hostName: e.target.value })}
                className="mafia-input"
                placeholder="Enter your name"
                required
                maxLength={20}
              />
            </div>
            <div>
              <label className="mafia-label">Max Players ({appConfig.maxPlayersMin}–{appConfig.maxPlayersMax})</label>
              <input
                type="number"
                value={createForm.maxPlayers}
                onChange={(e) => setCreateForm({ ...createForm, maxPlayers: parseInt(e.target.value) })}
                className="mafia-input"
                min={appConfig.maxPlayersMin}
                max={appConfig.maxPlayersMax}
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
              <label className="mafia-label">Room Code</label>
              <input
                type="text"
                value={joinForm.roomCode}
                onChange={(e) => setJoinForm({ ...joinForm, roomCode: e.target.value.toUpperCase() })}
                className="mafia-input uppercase tracking-widest"
                placeholder="e.g. ABC123"
                required
                maxLength={6}
              />
            </div>
            <div>
              <label className="mafia-label">Your Name</label>
              <input
                type="text"
                value={joinForm.playerName}
                onChange={(e) => setJoinForm({ ...joinForm, playerName: e.target.value })}
                className="mafia-input"
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
