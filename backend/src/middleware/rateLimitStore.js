/**
 * In-memory store for API rate limiting so we can use DB-backed settings (windowMs, max) per request.
 */
const store = new Map();

function getKey(ip) {
  return `api:${ip}`;
}

export function checkAndIncrement(ip, windowMs, max) {
  const key = getKey(ip);
  const now = Date.now();
  let entry = store.get(key);
  if (!entry || now >= entry.windowStart + windowMs) {
    entry = { count: 1, windowStart: now };
    store.set(key, entry);
    return { allowed: true, remaining: max - 1 };
  }
  entry.count += 1;
  const allowed = entry.count <= max;
  return { allowed, remaining: Math.max(0, max - entry.count) };
}

export function cleanup() {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (entry.windowStart + 60 * 60 * 1000 < now) store.delete(key);
  }
}
setInterval(cleanup, 60 * 60 * 1000);
