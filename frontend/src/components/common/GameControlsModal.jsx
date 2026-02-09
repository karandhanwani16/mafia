import { useState, useEffect } from 'react';
import Modal from './Modal';
import {
  getSoundSettings,
  setMusicVolume,
  setMusicMuted,
  setSfxVolume,
  setSfxMuted,
  setMuteAll,
  initBackgroundMusic
} from '../../config/soundManager';
import { playSound } from '../../config/sounds';

function TogglePill({ value, onToggle, onLabel = 'On', offLabel = 'Off' }) {
  return (
    <div
      role="group"
      aria-label={value ? `${onLabel} (active)` : `${offLabel} (active)`}
      className="inline-flex rounded-lg border-2 border-mafia-border bg-mafia-surface p-0.5 shadow-mafia-inner"
    >
      <button
        type="button"
        onClick={() => onToggle(true)}
        className={`min-w-[3rem] px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
          value
            ? 'bg-mafia-gold text-mafia-bg border border-mafia-gold shadow-mafia-gold'
            : 'text-mafia-muted hover:text-mafia-cream border border-transparent'
        }`}
      >
        {onLabel}
      </button>
      <button
        type="button"
        onClick={() => onToggle(false)}
        className={`min-w-[3rem] px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
          !value
            ? 'bg-mafia-gold text-mafia-bg border border-mafia-gold shadow-mafia-gold'
            : 'text-mafia-muted hover:text-mafia-cream border border-transparent'
        }`}
      >
        {offLabel}
      </button>
    </div>
  );
}

export default function GameControlsModal({ isOpen, onClose }) {
  const [musicVolume, setMusicVolumeState] = useState(0.35);
  const [musicMuted, setMusicMutedState] = useState(false);
  const [sfxVolume, setSfxVolumeState] = useState(1);
  const [sfxMuted, setSfxMutedState] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const s = getSoundSettings();
      setMusicVolumeState(s.musicVolume);
      setMusicMutedState(s.musicMuted);
      setSfxVolumeState(s.sfxVolume);
      setSfxMutedState(s.sfxMuted);
    }
  }, [isOpen]);

  const handleMusicVolume = (e) => {
    const v = parseFloat(e.target.value);
    setMusicVolumeState(v);
    setMusicVolume(v);
  };

  const handleMusicMuted = (muted) => {
    setMusicMutedState(muted);
    setMusicMuted(muted);
    initBackgroundMusic();
  };

  const handleSfxVolume = (e) => {
    const v = parseFloat(e.target.value);
    setSfxVolumeState(v);
    setSfxVolume(v);
  };

  const handleSfxMuted = (muted) => {
    setSfxMutedState(muted);
    setSfxMuted(muted);
  };

  const handleMuteAll = () => {
    const mute = !musicMuted || !sfxMuted;
    setMusicMutedState(mute);
    setSfxMutedState(mute);
    setMuteAll(mute);
    if (!mute) initBackgroundMusic();
  };

  const testSfx = () => {
    playSound('uiClick');
  };

  const allMuted = musicMuted && sfxMuted;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Game controls">
      <div className="space-y-6">
        {/* Mute all */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b-2 border-mafia-border">
          <span className="text-mafia-cream font-medium">All sound</span>
          <button
            type="button"
            onClick={handleMuteAll}
            className={`px-4 py-2 rounded-lg border-2 font-medium text-sm transition-all ${
              allMuted
                ? 'border-mafia-gold bg-mafia-gold/20 text-mafia-gold hover:bg-mafia-gold/30'
                : 'border-mafia-border bg-mafia-surface text-mafia-muted hover:text-mafia-cream hover:border-mafia-border-light'
            }`}
          >
            {allMuted ? 'Unmute all' : 'Mute all'}
          </button>
        </div>

        {/* Background music */}
        <div>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
            <span className="text-mafia-cream font-medium">Background music</span>
            <TogglePill value={!musicMuted} onToggle={(on) => handleMusicMuted(!on)} onLabel="On" offLabel="Off" />
          </div>
          <p className="text-mafia-muted text-sm mb-2">Plays slowly in the background</p>
          <div className="flex items-center gap-3 mt-2">
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={musicVolume}
              onChange={handleMusicVolume}
              disabled={musicMuted}
              className="flex-1 h-2 rounded-lg appearance-none bg-mafia-surface disabled:opacity-50 accent-[#c9a227]"
            />
            <span className="text-mafia-muted text-sm w-10">{Math.round(musicVolume * 100)}%</span>
          </div>
        </div>

        {/* Sound effects */}
        <div>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
            <span className="text-mafia-cream font-medium">Sound effects</span>
            <div className="flex items-center gap-2">
              <TogglePill value={!sfxMuted} onToggle={(on) => handleSfxMuted(!on)} onLabel="On" offLabel="Off" />
              <button
                type="button"
                onClick={testSfx}
                disabled={sfxMuted}
                className="text-sm px-2 py-1.5 rounded-lg bg-mafia-surface border-2 border-mafia-border text-mafia-muted hover:text-mafia-gold hover:border-mafia-gold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Test
              </button>
            </div>
          </div>
          <div className="flex items-center gap-3 mt-2">
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={sfxVolume}
              onChange={handleSfxVolume}
              disabled={sfxMuted}
              className="flex-1 h-2 rounded-lg appearance-none bg-mafia-surface disabled:opacity-50 accent-[#c9a227]"
            />
            <span className="text-mafia-muted text-sm w-10">{Math.round(sfxVolume * 100)}%</span>
          </div>
        </div>

        <p className="text-mafia-muted text-sm pt-2 border-t-2 border-mafia-border">
          Settings are saved automatically and apply across the game.
        </p>
      </div>
    </Modal>
  );
}
