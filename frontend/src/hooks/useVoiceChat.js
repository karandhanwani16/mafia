import { useState, useRef, useCallback, useEffect } from 'react';
import { getSocket } from '../services/socket';

const ICE_SERVERS = [{ urls: 'stun:stun.l.google.com:19302' }];

/**
 * Get getUserMedia in a safe way. navigator.mediaDevices is undefined in:
 * - Non-secure contexts (plain HTTP, except localhost)
 * - Some older mobile browsers (iOS Safari pre-iOS 14.3, old Android)
 * We try standard API first, then legacy polyfill for older Safari.
 */
function getGetUserMedia() {
  if (typeof navigator === 'undefined') return null;
  if (navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function') {
    return (constraints) => navigator.mediaDevices.getUserMedia(constraints);
  }
  const legacy =
    navigator.getUserMedia ||
    navigator.webkitGetUserMedia ||
    navigator.mozGetUserMedia ||
    navigator.msGetUserMedia;
  if (legacy) {
    return (constraints) =>
      new Promise((resolve, reject) => {
        legacy.call(navigator, constraints, resolve, reject);
      });
  }
  return null;
}

export function isVoiceChatSupported() {
  const supported = !!getGetUserMedia();
  const secure = typeof window !== 'undefined' && window.isSecureContext;
  return { supported, secure };
}

export function useVoiceChat(roomId, username) {
  const [isJoined, setIsJoined] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [peerCount, setPeerCount] = useState(0);
  const [error, setError] = useState(null);
  const localStreamRef = useRef(null);
  const peersRef = useRef(new Map());
  const pendingCandidatesRef = useRef(new Map());
  const remoteStreamsRef = useRef(new Map());
  const socket = getSocket();

  const [, forceUpdate] = useState(0);
  const triggerStreamsUpdate = useCallback(() => {
    forceUpdate((n) => n + 1);
  }, []);

  const addRemoteStream = useCallback(
    (peerId, stream) => {
      remoteStreamsRef.current.set(peerId, stream);
      triggerStreamsUpdate();
    },
    [triggerStreamsUpdate]
  );

  const removeRemoteStream = useCallback(
    (peerId) => {
      remoteStreamsRef.current.delete(peerId);
      triggerStreamsUpdate();
    },
    [triggerStreamsUpdate]
  );

  const closePeer = useCallback(
    (peerId) => {
      const pc = peersRef.current.get(peerId);
      if (pc) {
        pc.close();
        peersRef.current.delete(peerId);
        pendingCandidatesRef.current.delete(peerId);
        removeRemoteStream(peerId);
      }
      setPeerCount(peersRef.current.size);
    },
    [removeRemoteStream]
  );

  const flushPendingCandidates = useCallback((peerId, pc) => {
    const pending = pendingCandidatesRef.current.get(peerId) || [];
    pendingCandidatesRef.current.delete(peerId);
    pending.forEach((candidate) => {
      pc.addIceCandidate(candidate).catch(() => {});
    });
  }, []);

  const createPeerConnection = useCallback(
    (peerId, isOfferer) => {
      if (peersRef.current.has(peerId)) return peersRef.current.get(peerId);
      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => pc.addTrack(track, localStreamRef.current));
      }

      pc.ontrack = (e) => {
        const stream = e.streams[0] || new MediaStream(e.track ? [e.track] : []);
        addRemoteStream(peerId, stream);
      };
      pc.onicecandidate = (e) => {
        if (e.candidate) socket.emit('voice:ice', { to: peerId, candidate: e.candidate });
      };
      pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected' || pc.connectionState === 'closed') {
          closePeer(peerId);
        }
      };

      peersRef.current.set(peerId, pc);
      setPeerCount(peersRef.current.size);
      return pc;
    },
    [socket, addRemoteStream, closePeer]
  );

  const join = useCallback(async () => {
    if (!roomId || !username) {
      setError('Room and username required');
      return;
    }
    setError(null);

    const getUserMedia = getGetUserMedia();
    if (!getUserMedia) {
      const secure = typeof window !== 'undefined' && window.isSecureContext;
      setError(
        secure
          ? 'Microphone not supported in this browser. Try Chrome or Safari over HTTPS.'
          : 'Voice chat needs a secure connection (HTTPS). Open this page via https:// or from localhost.'
      );
      return;
    }

    try {
      const stream = await getUserMedia({ audio: true, video: false });
      localStreamRef.current = stream;
    } catch (err) {
      setError(err?.message || 'Microphone access denied');
      return;
    }

    socket.emit('voice:join', { roomId, username });
    setIsJoined(true);
  }, [roomId, username, socket]);

  const leave = useCallback(() => {
    if (roomId) socket.emit('voice:leave', { roomId });
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    peersRef.current.forEach((pc) => pc.close());
    peersRef.current.clear();
    pendingCandidatesRef.current.clear();
    remoteStreamsRef.current.clear();
    triggerStreamsUpdate();
    setPeerCount(0);
    setIsJoined(false);
  }, [roomId, socket, triggerStreamsUpdate]);

  const leaveRef = useRef(leave);
  leaveRef.current = leave;

  const setMuted = useCallback((muted) => {
    if (!localStreamRef.current) return;
    localStreamRef.current.getAudioTracks().forEach((track) => {
      track.enabled = !muted;
    });
    setIsMuted(muted);
  }, []);

  useEffect(() => {
    if (!socket || !isJoined) return;

    const onRoomPeers = ({ peers }) => {
      peers.forEach(({ socketId }) => {
        if (socketId === socket.id) return;
        const pc = createPeerConnection(socketId, true);
        pc.createOffer()
          .then((offer) => pc.setLocalDescription(offer))
          .then(() => socket.emit('voice:offer', { to: socketId, offer: pc.localDescription }))
          .catch((err) => {
            setError(err?.message || 'Offer failed');
            closePeer(socketId);
          });
      });
    };

    const onPeerJoined = ({ socketId }) => {
      if (socketId === socket.id) return;
      createPeerConnection(socketId, false);
    };

    const onOffer = async ({ from, offer }) => {
      const pc = createPeerConnection(from, false);
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        flushPendingCandidates(from, pc);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit('voice:answer', { to: from, answer: pc.localDescription });
      } catch (err) {
        setError(err?.message || 'Answer failed');
        closePeer(from);
      }
    };

    const onAnswer = async ({ from, answer }) => {
      const pc = peersRef.current.get(from);
      if (!pc) return;
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
        flushPendingCandidates(from, pc);
      } catch (err) {
        closePeer(from);
      }
    };

    const onIce = async ({ from, candidate }) => {
      const pc = peersRef.current.get(from);
      const c = candidate ? new RTCIceCandidate(candidate) : null;
      if (!pc) {
        const pending = pendingCandidatesRef.current.get(from) || [];
        if (c) pending.push(c);
        pendingCandidatesRef.current.set(from, pending);
        return;
      }
      if (pc.remoteDescription && c) {
        try {
          await pc.addIceCandidate(c);
        } catch (_) {}
      }
    };

    const onPeerLeft = ({ socketId }) => {
      closePeer(socketId);
    };

    socket.on('voice:roomPeers', onRoomPeers);
    socket.on('voice:peerJoined', onPeerJoined);
    socket.on('voice:offer', onOffer);
    socket.on('voice:answer', onAnswer);
    socket.on('voice:ice', onIce);
    socket.on('voice:peerLeft', onPeerLeft);

    return () => {
      socket.off('voice:roomPeers', onRoomPeers);
      socket.off('voice:peerJoined', onPeerJoined);
      socket.off('voice:offer', onOffer);
      socket.off('voice:answer', onAnswer);
      socket.off('voice:ice', onIce);
      socket.off('voice:peerLeft', onPeerLeft);
    };
  }, [isJoined, socket, createPeerConnection, closePeer, flushPendingCandidates]);

  useEffect(() => {
    return () => {
      leaveRef.current();
    };
  }, []);

  const remoteStreams = Array.from(remoteStreamsRef.current.entries());

  return {
    join,
    leave,
    isJoined,
    isMuted,
    setMuted: setMuted,
    peerCount,
    error,
    remoteStreams,
    localStream: localStreamRef.current
  };
}
