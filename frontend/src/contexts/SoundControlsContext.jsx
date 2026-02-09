import { createContext, useContext } from 'react';

const SoundControlsContext = createContext(() => {});

export function SoundControlsProvider({ openSoundControls, children }) {
  return (
    <SoundControlsContext.Provider value={openSoundControls}>
      {children}
    </SoundControlsContext.Provider>
  );
}

export function useSoundControls() {
  return useContext(SoundControlsContext);
}
