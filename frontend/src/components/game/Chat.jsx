import { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { getSocket } from '../../services/socket';
import Button from '../common/Button';

const Chat = ({ onClose, compact = false }) => {
  const { currentRoom } = useSelector((state) => state.room);
  const currentPlayer = useSelector((state) => state.player.currentPlayer);
  const phase = useSelector((state) => state.game.phase);
  const messages = useSelector((state) => state.chat.messages);
  const [input, setInput] = useState('');
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const socket = getSocket();

  useEffect(() => {
    const handleError = (data) => {
      setError(data?.message || 'Failed to send message');
    };
    socket.on('error', handleError);
    return () => {
      socket.off('error', handleError);
    };
  }, [socket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    const roomId = currentRoom?.roomId;
    const playerId = currentPlayer?.playerId;
    if (!input.trim() || phase === 'night') return;
    if (!roomId || !playerId) {
      setError('Not in a room. Reconnecting...');
      return;
    }

    setError(null);
    socket.emit('sendChatMessage', {
      roomId,
      playerId,
      message: input.trim()
    });

    setInput('');
  };

  const isNightPhase = phase === 'night';

  return (
    <div className={`bg-gray-800 rounded-lg p-4 flex flex-col ${compact ? 'h-full min-h-0' : 'h-[600px]'}`}>
      <div className="flex items-center justify-between mb-4 shrink-0">
        <h3 className="text-lg font-bold text-white">Chat</h3>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-2 -m-2 text-gray-400 hover:text-white transition-colors rounded-full touch-manipulation"
            aria-label="Close chat"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
      {error && (
        <div className="mb-2 px-3 py-2 bg-red-900/50 border border-red-700 rounded text-red-200 text-sm">
          {error}
        </div>
      )}
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden mb-4 space-y-2 overscroll-contain">
        {messages.map((msg, idx) => (
          <div key={`${msg.timestamp}-${msg.playerId}-${idx}`} className="bg-gray-700 rounded p-2 animate-slide-in-right">
            <div className="flex items-center justify-between mb-1">
              <span className="text-blue-400 font-semibold text-sm">{msg.username}</span>
              <span className="text-gray-500 text-xs">
                {new Date(msg.timestamp).toLocaleTimeString()}
              </span>
            </div>
            <p className="text-gray-200 text-sm">{msg.message}</p>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      {isNightPhase ? (
        <div className="text-gray-400 text-sm text-center py-2">
          Chat is disabled during night phase
        </div>
      ) : (
        <form onSubmit={handleSend} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
            placeholder="Type a message..."
            maxLength={500}
          />
          <Button type="submit" disabled={!input.trim()}>
            Send
          </Button>
        </form>
      )}
    </div>
  );
};

export default Chat;
