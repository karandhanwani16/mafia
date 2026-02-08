import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { initBackgroundMusic } from '../../config/soundManager';
import GameControlsModal from '../common/GameControlsModal';

const Layout = ({ children }) => {
  const [controlsOpen, setControlsOpen] = useState(false);

  useEffect(() => {
    initBackgroundMusic();
  }, []);

  return (
    <div className="min-h-screen bg-mafia-bg">
      <header className="bg-mafia-surface border-b-2 border-mafia-border shadow-mafia">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <Link
            to="/"
            className="font-display text-2xl font-bold text-mafia-gold hover:text-mafia-gold-light transition-colors tracking-wide"
          >
            🎭 Mafia
          </Link>
          <button
            type="button"
            onClick={() => setControlsOpen(true)}
            className="p-2 rounded-lg text-mafia-muted hover:text-mafia-gold hover:bg-mafia-card border border-transparent hover:border-mafia-border transition-all"
            title="Game controls (music & sound)"
            aria-label="Game controls"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            </svg>
          </button>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
      <GameControlsModal isOpen={controlsOpen} onClose={() => setControlsOpen(false)} />
    </div>
  );
};

export default Layout;
