import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useVoiceChat, isVoiceChatSupported } from '../../hooks/useVoiceChat';

const RemoteAudio = ({ peerId, stream }) => {
  const audioRef = useRef(null);
  useEffect(() => {
    const el = audioRef.current;
    if (!el || !stream) return;
    el.srcObject = stream;
    el.play().catch(() => {});
    return () => {
      el.srcObject = null;
    };
  }, [stream]);
  return <audio ref={audioRef} autoPlay playsInline className="hidden" aria-hidden />;
};

const VoiceChat = ({ roomId, username }) => {
  const { players } = useSelector((state) => state.game);
  const { currentPlayer } = useSelector((state) => state.player);
  const meInGame = players.find((p) => p.playerId === currentPlayer?.playerId);
  const isAlive = meInGame?.isAlive !== false;

  const { supported: voiceSupported, secure } = isVoiceChatSupported();
  const {
    join,
    leave,
    isJoined,
    isMuted,
    setMuted,
    peerCount,
    error,
    remoteStreams
  } = useVoiceChat(roomId, username);

  const unavailableMessage = !voiceSupported
    ? (secure ? 'Voice not supported in this browser.' : 'Voice chat requires HTTPS or localhost.')
    : null;
  const deadMessage = !isAlive ? 'Dead players cannot join voice' : null;

  useEffect(() => {
    if (!isAlive && isJoined) leave();
  }, [isAlive, isJoined, leave]);

  return (
    <div className="flex flex-col items-center gap-2">
      {remoteStreams.map(([peerId, stream]) => (
        <RemoteAudio key={peerId} peerId={peerId} stream={stream} />
      ))}

      {(error || unavailableMessage || deadMessage) && (
        <p className="text-red-400 text-xs text-center max-w-[280px]">
          {error || unavailableMessage || deadMessage}
        </p>
      )}

      <div className="flex items-center gap-2">
        {!isJoined ? (
          <button
            type="button"
            onClick={join}
            disabled={!voiceSupported || !isAlive}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors touch-manipulation"
            aria-label="Join voice chat"
            title={!isAlive ? deadMessage : !voiceSupported ? unavailableMessage : undefined}
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.91-3c-.49 0-.9.36-.98.85C16.52 14.2 14.47 16 12 16s-4.52-1.8-4.93-4.15c-.08-.49-.49-.85-.98-.85-.61 0-1.09.54-1 1.14.49 3 2.89 5.35 5.91 5.78V20c0 .55.45 1 1 1s1-.45 1-1v-2.08c3.02-.43 5.42-2.78 5.91-5.78.1-.6-.39-1.14-1-1.14z" />
            </svg>
            Join voice
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setMuted(!isMuted)}
              className={`flex items-center justify-center w-10 h-10 rounded-full transition-colors touch-manipulation ${
                isMuted
                  ? 'bg-mafia-red hover:bg-mafia-red-light text-mafia-cream'
                  : 'bg-mafia-surface border border-mafia-border hover:border-mafia-gold text-mafia-cream'
              }`}
              aria-label={isMuted ? 'Unmute microphone' : 'Mute microphone'}
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 11h-1.7c0 .74-.16 1.43-.43 2.05l1.23 1.23c.56-.98.9-2.09.9-3.28zm-4.02.17c-.14-.98-.42-1.85-.8-2.55C13.94 8.32 14 7.66 14 7c0-.94-.2-1.82-.53-2.64L11 4.18V7c0 .44.08.86.22 1.24zM2.27 2.27L1 3.54 5 7.54V13c0 1.66 1.34 3 3 3h2c.21 0 .4-.03.59-.08L12.46 15l3.27 3.27 1.27-1.27L2.27 2.27zM9 13c0 .55.45 1 1 1h2c.21 0 .4-.03.59-.08L9.92 10.08C9.58 10.66 9 11.28 9 13zM7 9V8.18L4.38 5.56 3.27 4.45 2 3.27 3.27 2 4.54 3.27 7 7.54v.64C7 9.28 7 9.44 7 9z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.91-3c-.49 0-.9.36-.98.85C16.52 14.2 14.47 16 12 16s-4.52-1.8-4.93-4.15c-.08-.49-.49-.85-.98-.85-.61 0-1.09.54-1 1.14.49 3 2.89 5.35 5.91 5.78V20c0 .55.45 1 1 1s1-.45 1-1v-2.08c3.02-.43 5.42-2.78 5.91-5.78.1-.6-.39-1.14-1-1.14z" />
                </svg>
              )}
            </button>
            <span className="text-mafia-muted text-xs">
              {peerCount} {peerCount === 1 ? 'peer' : 'peers'}
            </span>
            <button
              type="button"
              onClick={leave}
              className="px-3 py-2 rounded-lg bg-mafia-red hover:bg-mafia-red-light text-mafia-cream text-sm font-medium transition-colors touch-manipulation border border-mafia-red"
              aria-label="Leave voice chat"
            >
              Leave voice
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default VoiceChat;
