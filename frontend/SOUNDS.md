# Sound assets for Mafia game

Add these audio files under **`frontend/public/sounds/`**. The app will play them at the right moments; if a file is missing, that sound is simply skipped.

Use **MP3** (or update paths in `src/config/sounds.js` to match your format).

---

## Paths and when they play

| Key | File path (under `public/`) | When it plays | Suggestion |
|-----|-----------------------------|----------------|------------|
| **UI** |
| `uiClick` | `sounds/ui-click.mp3` | Button clicks (primary actions) | Short, soft click or tap (e.g. 50–150 ms). |
| `uiTab` | `sounds/ui-tab.mp3` | Switching Create / Join Room tabs | Very short tick or whoosh. |
| **Game flow** |
| `gameStart` | `sounds/game-start.mp3` | Host starts the game | Short “game on” sting or bell. |
| `phaseNight` | `sounds/phase-night.mp3` | Phase changes to Night | Eerie, night ambience or soft bell. |
| `phaseDay` | `sounds/phase-day.mp3` | Phase changes to Day | Morning / wake-up tone or rooster. |
| `roleReveal` | `sounds/role-reveal.mp3` | Role reveal modal is shown | Mysterious or dramatic reveal (1–2 s). |
| **Actions** |
| `actionSubmit` | `sounds/action-submit.mp3` | Night action submitted (kill/save/investigate) | Short confirmation. |
| `voteSubmit` | `sounds/vote-submit.mp3` | Vote submitted | Clear “vote cast” sound. |
| **Night phase flow** (played in order on all clients when night ends) |
| `nightStepMafia` | `sounds/night-step-mafia.mp3` | 1. Mafia kills a player | Eerie / danger sting. |
| `nightStepDoctor` | `sounds/night-step-doctor.mp3` | 2. Doctor saves someone | Calm / healing tone. |
| `nightStepDetective` | `sounds/night-step-detective.mp3` | 3. Detective investigates | Mystery / clue sting. |
| **Results / events** |
| `playerEliminated` | `sounds/player-eliminated.mp3` | Day phase: “X was eliminated during the night” | Sad or dramatic sting. |
| `gameOverMafia` | `sounds/game-over-mafia.mp3` | Mafia wins screen | Dark / villain win sting. |
| `gameOverVillagers` | `sounds/game-over-villagers.mp3` | Villagers win screen | Triumphant / victory sting. |
| **Chat (optional)** |
| `chatMessage` | `sounds/chat-message.mp3` | New chat message received | Very short, subtle notification. |

---

## Folder structure

Create this folder and add your files:

```
frontend/
  public/
    sounds/
      ui-click.mp3
      ui-tab.mp3
      game-start.mp3
      phase-night.mp3
      phase-day.mp3
      role-reveal.mp3
      action-submit.mp3
      vote-submit.mp3
      night-step-mafia.mp3
      night-step-doctor.mp3
      night-step-detective.mp3
      player-eliminated.mp3
      game-over-mafia.mp3
      game-over-villagers.mp3
      chat-message.mp3   # optional
```

---

## Using sounds in code

Import and call `playSound` where you want feedback:

```js
import { playSound, SOUND_PATHS } from '../config/sounds';

// Example: on button click
playSound('uiClick');

// Example: when game starts (e.g. in LobbyPage when gameStarted is received)
playSound('gameStart');

// Example: when phase changes (e.g. in GamePage when phaseChanged is received)
if (phase === 'night') playSound('phaseNight');
else playSound('phaseDay');
```

Sounds are **already wired** in the app: buttons, game start, phase changes, role reveal, night action, vote, elimination, game over, and chat messages all call `playSound`. Once you add the files above, they will play automatically.
