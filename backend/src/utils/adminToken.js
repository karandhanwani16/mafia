import crypto from 'crypto';

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const PAYLOAD_SEP = '.';

/**
 * Create a signed admin token (payload.exp.payload HMAC).
 * @param {{ adminId: string, username: string }} payload
 * @param {string} secret
 * @returns {string}
 */
export function createAdminToken(payload, secret) {
  const exp = Date.now() + TOKEN_TTL_MS;
  const data = JSON.stringify({ ...payload, exp });
  const sig = crypto.createHmac('sha256', secret).update(data).digest('base64url');
  return `${sig}${PAYLOAD_SEP}${Buffer.from(data, 'utf8').toString('base64url')}`;
}

/**
 * Verify and decode admin token. Returns payload or null.
 * @param {string} token
 * @param {string} secret
 * @returns {{ adminId: string, username: string } | null}
 */
export function verifyAdminToken(token, secret) {
  if (!token || typeof token !== 'string') return null;
  const i = token.indexOf(PAYLOAD_SEP);
  if (i === -1) return null;
  const sig = token.slice(0, i);
  let data;
  try {
    data = Buffer.from(token.slice(i + 1), 'base64url').toString('utf8');
  } catch {
    return null;
  }
  const expectedSig = crypto.createHmac('sha256', secret).update(data).digest('base64url');
  if (sig !== expectedSig) return null;
  let payload;
  try {
    payload = JSON.parse(data);
  } catch {
    return null;
  }
  if (payload.exp && Date.now() > payload.exp) return null;
  if (!payload.adminId || !payload.username) return null;
  return { adminId: payload.adminId, username: payload.username };
}
