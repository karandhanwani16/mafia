import { useState, useEffect } from 'react';
import Modal from './Modal';
import {
  getSoundSettings,
  setMusicVolume,
  setMusicMuted,
  setSfxVolume,
  setSfxMuted,
  initBackgroundMusic
} from '../../config/soundManager';
import { playSound } from '../../config/sounds';

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

  const handleMusicMuted = (e) => {
    const m = e.target.checked;
    setMusicMutedState(m);
    setMusicMuted(m);
    initBackgroundMusic();
  };

  const handleSfxVolume = (e) => {
    const v = parseFloat(e.target.value);
    setSfxVolumeState(v);
    setSfxVolume(v);
  };

  const handleSfxMuted = (e) => {
    const m = e.target.checked;
    setSfxMutedState(m);
    setSfxMuted(m);
  };

  const testSfx = () => {
    playSound('uiClick');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Game controls">
      <div className="space-y-6">
        {/* Background music */}
        <div>
          <div className="flex items-center justify-between gap-4 mb-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={!musicMuted}
                onChange={handleMusicMuted}
                className="w-4 h-4 rounded border-mafia-border bg-mafia-surface text-[#c9a227] focus:ring-mafia-gold"
              />
              <span className="text-mafia-cream font-medium">Background music</span>
            </label>
            <span className="text-mafia-muted text-sm">Plays slowly in the background</span>
          </div>
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
          <div className="flex items-center justify-between gap-4 mb-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={!sfxMuted}
                onChange={handleSfxMuted}
                className="w-4 h-4 rounded border-mafia-border bg-mafia-surface text-[#c9a227] focus:ring-mafia-gold"
              />
              <span className="text-mafia-cream font-medium">Sound effects</span>
            </label>
            <button
              type="button"
              onClick={testSfx}
              disabled={sfxMuted}
              className="text-sm px-2 py-1 rounded bg-mafia-surface border border-mafia-border text-mafia-muted hover:text-mafia-gold hover:border-mafia-gold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Test
            </button>
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
