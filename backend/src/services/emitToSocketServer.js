/**
 * Send events to the separate socket server (POST /internal/emit).
 * No-op if SOCKET_SERVER_URL is not set.
 */

const SOCKET_SERVER_URL = process.env.SOCKET_SERVER_URL || '';
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY || 'dev-internal-key';

export async function emitToRoom(roomId, events) {
  if (!roomId || !Array.isArray(events) || events.length === 0) return;
  if (!SOCKET_SERVER_URL) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[emitToRoom] SOCKET_SERVER_URL not set – game events will not reach socket-server. Add it to backend .env (e.g. http://localhost:3002)');
    }
    return;
  }
  try {
    if (process.env.NODE_ENV !== 'production') {
      console.log('[emitToRoom] calling socket-server', { roomIdLength: roomId?.length, roomIdPreview: roomId ? `${roomId.slice(0, 8)}...` : null, events: events.map(e => e.event) });
    }
    const res = await fetch(`${SOCKET_SERVER_URL.replace(/\/$/, '')}/internal/emit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Key': INTERNAL_API_KEY
      },
      body: JSON.stringify({ roomId, events })
    });
    if (!res.ok) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[emitToRoom] socket-server responded', res.status, await res.text());
      }
    } else if (process.env.NODE_ENV !== 'production') {
      const text = await res.text();
      console.log('[emitToRoom] socket-server ok', { status: res.status, body: text || '(empty)' });
    }
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[emitToRoom] failed to reach socket-server:', error.message);
    }
  }
}
