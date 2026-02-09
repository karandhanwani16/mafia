/**
 * Sound configuration for the Mafia game.
 * Add your audio files to the paths below (see SOUNDS.md for the full list and suggestions).
 * Paths are relative to the app origin (e.g. in dev: http://localhost:5173/sounds/...).
 */

import { getSfxMultiplier, unlockAudio } from './soundManager.js';

const SOUND_BASE = '/sounds';

export const SOUND_PATHS = {
  // Background (looping, controlled via Game Controls)
  backgroundMusic: `${SOUND_BASE}/background-music.mp3`,

  // UI
  uiClick: `${SOUND_BASE}/ui-click.mp3`,
  uiTab: `${SOUND_BASE}/ui-tab.mp3`,

  // Game flow
  gameStart: `${SOUND_BASE}/game-start.mp3`,
  phaseNight: `${SOUND_BASE}/phase-night.mp3`,
  phaseDay: `${SOUND_BASE}/phase-day.mp3`,
  roleReveal: `${SOUND_BASE}/role-reveal.mp3`,

  // Actions
  actionSubmit: `${SOUND_BASE}/action-submit.mp3`,
  voteSubmit: `${SOUND_BASE}/vote-submit.mp3`,

  // Night phase flow (play in order on all clients: mafia → doctor → detective)
  nightStepMafia: `${SOUND_BASE}/night-step-mafia.mp3`,   // Mafia kills a player
  nightStepDoctor: `${SOUND_BASE}/night-step-doctor.mp3`, // Doctor saves someone
  nightStepDetective: `${SOUND_BASE}/night-step-detective.mp3`, // Detective investigates

  // Results / events
  playerEliminated: `${SOUND_BASE}/player-eliminated.mp3`,
  gameOverMafia: `${SOUND_BASE}/game-over-mafia.mp3`,
  gameOverVillagers: `${SOUND_BASE}/game-over-villagers.mp3`,

  // Chat (optional)
  chatMessage: `${SOUND_BASE}/chat-message.mp3`
};

/**
 * Play a sound by key. Respects Game Controls SFX volume and mute.
 * No-op if the file is missing or playback fails.
 * @param {string} key - Key from SOUND_PATHS (e.g. 'uiClick', 'gameStart')
 * @param {{ volume?: number }} options - Optional volume 0–1 (multiplied by SFX volume)
 */
export function playSound(key, options = {}) {
  const path = SOUND_PATHS[key];
  if (!path) return;

  const sfx = getSfxMultiplier();
  if (sfx <= 0) return;

  unlockAudio(); // ensure audio is unlocked in this user gesture before play()

  try {
    const audio = new Audio(path);
    let vol = sfx;
    if (typeof options.volume === 'number') {
      vol *= Math.max(0, Math.min(1, options.volume));
    }
    audio.volume = vol;
    audio.play().catch((err) => {
      if (import.meta.env.DEV) {
        console.warn('[sounds] play failed:', key, err?.message || err);
      }
    });
  } catch (e) {
    if (import.meta.env.DEV) {
      console.warn('[sounds] play error:', key, e?.message || e);
    }
  }
}
