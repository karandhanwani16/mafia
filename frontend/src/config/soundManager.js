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
        musicMuted: parsed.musicMuted === true,
        sfxVolume: clamp(Number(parsed.sfxVolume), 0, 1, DEFAULT_SETTINGS.sfxVolume),
        sfxMuted: parsed.sfxMuted === true
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
    if (settings.musicMuted) {
      backgroundAudio.pause();
    } else {
      backgroundAudio.volume = settings.musicVolume;
      backgroundAudio.play().catch(() => {});
    }
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
 * Mute or unmute both background music and sound effects.
 */
export function setMuteAll(muted) {
  settings.musicMuted = Boolean(muted);
  settings.sfxMuted = Boolean(muted);
  saveSettings();
  if (backgroundAudio) {
    if (settings.musicMuted) {
      backgroundAudio.pause();
    } else {
      backgroundAudio.volume = settings.musicVolume;
      backgroundAudio.play().catch(() => {});
    }
  }
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

/**
 * Call once on first user interaction (click/tap/key) to unlock audio playback.
 * Plays a real sound file at volume 0 so the browser allows audio from this origin.
 */
export function unlockAudio() {
  if (audioUnlocked) return;
  try {
    const audio = new Audio(`${SOUND_BASE}/ui-click.mp3`);
    audio.volume = 0;
    const p = audio.play();
    if (p && typeof p.then === 'function') {
      p.then(() => { audio.pause(); }).catch(() => {});
    }
    audioUnlocked = true;
  } catch {
    try {
      const fallback = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=');
      fallback.volume = 0;
      fallback.play().catch(() => {});
      audioUnlocked = true;
    } catch {
      audioUnlocked = true;
    }
  }
}

export function isAudioUnlocked() {
  return audioUnlocked;
}

export { BACKGROUND_MUSIC_PATH };
