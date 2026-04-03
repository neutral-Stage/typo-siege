# TYPO SIEGE — Build Task

## What
Build a text-based tower defense game called "TYPO SIEGE" where words fall from the top of the screen and you type them to destroy them.

## Tech Stack
- Vite + TypeScript
- Canvas 2D rendering (NO DOM manipulation for game elements)
- `@chenglou/pretext` package is installed for text measurement
- All words must be English only

## Game Design

### Visual Style
- Minimal, clean, elegant — white/light background (#fafafa)
- Words rendered as "pills" (rounded rectangles with text inside)
- Typed characters turn indigo (#6366f1), untyped are dark gray
- Subtle grid lines in background
- Danger zone gradient at the bottom (red tint)
- Particle effects when words are destroyed (letters fly apart with gravity)
- Combo counter shows briefly when combo > 1
- Wave transition screen between waves (shows wave number)

### Gameplay
1. Words fall from the top at varying speeds
2. Player types letters to match words — typed portion highlights in indigo
3. When a full word is typed, it explodes (particles) and is destroyed
4. If a word reaches the bottom danger zone, player loses a life (3 lives total)
5. Game over when all lives lost
6. Waves progress — each wave spawns more words, faster, with longer/harder words

### Word Progression
- Wave 1-2: Short code keywords (var, let, for, map, api, npm, git, css)
- Wave 3-4: Medium (async, await, fetch, props, build, cache, query, array)
- Wave 5-6: Longer (return, import, deploy, docker, promise, object, server)
- Wave 7-8: Terms (function, template, variable, schema, runtime, module)
- Wave 9+: Phrases (async/await, console.log, useState(), middleware, typescript, algorithm)
- ALL ENGLISH ONLY

### Targeting Logic
- When player types a letter, find the best matching word:
  - Prefer words already being typed (partially typed)
  - Among those, prefer the one closest to the bottom (most urgent)
- Show which word is being targeted with a subtle highlight

### Power-Up System
4 power-ups charge as you destroy words. Each has a charge bar (0-maxCharge):
1. 🔥 Fireblast (key: 1, maxCharge: 100) — Destroys ALL words on screen
2. ⚡ Lightning (key: 2, maxCharge: 60) — Auto-completes the longest word
3. 🛡️ Shield (key: 3, maxCharge: 80) — Freezes all words for 5 seconds
4. 💥 Chain (key: 4, maxCharge: 70) — Destroys the closest-to-bottom word + half-types nearby words

Power-ups distributed charge evenly. When a power-up is fully charged, it glows/pulses. Press the number key to activate.

### Combo System
- Each consecutive word destroyed without missing increases combo
- Combo multiplier: 1 + combo × 0.1 (so 5 combo = 1.5x points)
- Combo resets when a word reaches the bottom (life lost)
- Show combo text briefly in center of screen

### Scoring
- Each word has base points (10-100) based on difficulty/length
- Final points = base × combo multiplier
- High score saved to localStorage

### Sound Effects (Web Audio API — no external files)
- Type letter: short high-pitched click
- Destroy word: ascending three-note chime
- Miss/lose life: low buzzy tone
- Power-up: ascending four-note fanfare
- Wave complete: four ascending notes
- Game over: three descending notes
- Combo: pitch increases with combo count

### HUD (HTML overlay, not canvas)
- Top left: Score + Wave number
- Top right: Lives (heart emojis)
- Bottom center: Current typed text with blinking cursor
- Bottom right: 4 power-up buttons showing emoji + charge bar + key hint
- When power-up is charged, it gets a glowing border

### Screens
- Menu: "TYPO SIEGE" title, subtitle, Start button, high score display
- Wave Transition: "WAVE X" text that fades in/out over 2.5 seconds
- Game Over: "GAME OVER" + final score, wave reached, best combo, new high score badge

### Responsive
- Game area: 800×600 centered, with border-radius and subtle shadow
- Canvas scales with devicePixelRatio

## Files Already Created
- `index.html` — has full HTML structure with HUD, overlay, power-ups, styles
- `src/main.ts` — entry point with game loop, input handling, UI updates
- `src/game.ts` — Game class with full game logic
- `src/entities.ts` — FallingWord type, createFallingWord(), findTargetWord()
- `src/words.ts` — word bank with difficulty/points/speed, wave progression
- `src/power.ts` — PowerUp types, charge/distribute/use logic
- `src/renderer.ts` — Canvas renderer with particles, word drawing, effects
- `src/audio.ts` — Web Audio API sound effects

## What to Fix/Improve
The game is ~80% built but has some issues:
1. Make sure all files compile and work together cleanly
2. The renderer needs `drawWaveTransition(wave, progress)` method
3. The renderer needs `showScreenFlash(color)` method  
4. The HTML power-up key hints should show "1", "2", "3", "4" (not Q, W, E, R)
5. Add high score display on menu screen
6. Add "NEW HIGH SCORE" badge on game over screen
7. Make sure the wave transition actually works — pause spawning, show transition, resume
8. Ensure all sounds play at the right times
9. Make the game feel polished — smooth animations, no jank
10. Test that the game loop works end-to-end: start → play → wave transition → game over → restart

## Important
- Keep it as a single-page app, no routing
- All in /Users/sar333/clawd/typo-siege/
- Use `npm run dev` (vite) for development
- Keep the existing file structure
