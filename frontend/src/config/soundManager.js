/**
 * Manages background music (looping) and SFX volume/mute. Persists to localStorage.
 */

const STORAGE_KEY = 'mafia_sound_settings';
const DEFAULT_SETTINGS = {
  musicVolume: 0.35,
  musicMuted: false,
  sfxVolume: 1,
  sfxMuted: false
};

let backgroundAudio = null;
let settings = loadSettings();

function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        musicVolume: clamp(Number(parsed.musicVolume), 0, 1, DEFAULT_SETTINGS.musicVolume),
        musicMuted: Boolean(parsed.musicMuted),
        sfxVolume: clamp(Number(parsed.sfxVolume), 0, 1, DEFAULT_SETTINGS.sfxVolume),
        sfxMuted: Boolean(parsed.sfxMuted)
      };
    }
  } catch {
    // ignore
  }
  return { ...DEFAULT_SETTINGS };
}

function saveSettings() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // ignore
  }
}

function clamp(val, min, max, fallback) {
  if (typeof val !== 'number' || Number.isNaN(val)) return fallback;
  return Math.max(min, Math.min(max, val));
}

const SOUND_BASE = '/sounds';
const BACKGROUND_MUSIC_PATH = `${SOUND_BASE}/background-music.mp3`;

/**
 * @returns {{ musicVolume: number, musicMuted: boolean, sfxVolume: number, sfxMuted: boolean }}
 */
export function getSoundSettings() {
  return { ...settings };
}

export function setMusicVolume(value) {
  settings.musicVolume = clamp(value, 0, 1, settings.musicVolume);
  saveSettings();
  if (backgroundAudio) {
    backgroundAudio.volume = settings.musicMuted ? 0 : settings.musicVolume;
  }
}

export function setMusicMuted(muted) {
  settings.musicMuted = Boolean(muted);
  saveSettings();
  if (backgroundAudio) {
    backgroundAudio.volume = settings.musicMuted ? 0 : settings.musicVolume;
  }
}

export function setSfxVolume(value) {
  settings.sfxVolume = clamp(value, 0, 1, settings.sfxVolume);
  saveSettings();
}

export function setSfxMuted(muted) {
  settings.sfxMuted = Boolean(muted);
  saveSettings();
}

/**
 * Start or update background music. Call once on app load; respects musicMuted and musicVolume.
 */
export function initBackgroundMusic() {
  if (backgroundAudio) {
    backgroundAudio.volume = settings.musicMuted ? 0 : settings.musicVolume;
    if (!settings.musicMuted) {
      backgroundAudio.play().catch(() => {});
    } else {
      backgroundAudio.pause();
    }
    return;
  }
  try {
    backgroundAudio = new Audio(BACKGROUND_MUSIC_PATH);
    backgroundAudio.loop = true;
    backgroundAudio.volume = settings.musicMuted ? 0 : settings.musicVolume;
    if (!settings.musicMuted) {
      backgroundAudio.play().catch(() => {});
    }
  } catch {
    // ignore
  }
}

export function getSfxMultiplier() {
  if (settings.sfxMuted) return 0;
  return settings.sfxVolume;
}

let audioUnlocked = false;
const UNLOCK_SOUND = `${SOUND_BASE}/ui-click.mp3`;

/**
 * Call once on first user interaction (click/tap/key) to unlock audio playback.
 * Required on many browsers (especially Safari/iOS) before any sound can play.
 */
export function unlockAudio() {
  if (audioUnlocked) return;
  try {
    const audio = new Audio(UNLOCK_SOUND);
    audio.volume = 0;
    audio.play().then(() => {
      audio.pause();
      audio.remove();
    }).catch(() => {});
    audioUnlocked = true;
  } catch {
    // ignore
  }
}

export function isAudioUnlocked() {
  return audioUnlocked;
}

export { BACKGROUND_MUSIC_PATH };
