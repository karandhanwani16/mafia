/**
 * Enable debug logs: add ?debug=1 to the URL, or run in console: localStorage.setItem('mafia_debug', '1'); location.reload()
 * Disable: localStorage.removeItem('mafia_debug'); location.reload()
 */
export function isDebug() {
  if (typeof window === 'undefined') return false;
  return (
    import.meta.env.DEV &&
    (new URLSearchParams(window.location.search).get('debug') === '1' || localStorage.getItem('mafia_debug') === '1')
  );
}

const PREFIX = '[Mafia]';
export function log(...args) {
  if (isDebug()) {
    console.log(PREFIX, ...args);
  }
}
export function warn(...args) {
  if (isDebug()) {
    console.warn(PREFIX, ...args);
  }
}
