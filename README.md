# 🏰 TYPO SIEGE

**A text tower defense game. Type falling words to destroy them. Charge power-ups. Survive the siege.**

🎮 **[Play Now](https://typo-siege.vercel.app/)**

![TYPO SIEGE](https://img.shields.io/badge/game-typing%20tower%20defense-6366f1?style=flat-square)
![TypeScript](https://img.shields.io/badge/TypeScript-blue?style=flat-square&logo=typescript)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite)

## 🎯 How to Play

- **Type** the falling words to destroy them before they reach the bottom
- **Combo** consecutive words for score multipliers
- **Charge** power-ups by destroying words, then unleash them:
  - 🔥 **Fireblast** — Destroy ALL words on screen
  - ⚡ **Lightning** — Auto-complete the longest word
  - 🛡️ **Shield** — Freeze all words for 5 seconds
  - 💥 **Chain** — Destroy the closest word + half-type nearby ones
- **3 lives** — lose one when a word reaches the danger zone
- Waves get harder: more words, faster falling, longer vocabulary

### Controls

| Action | Desktop | Mobile |
|--------|---------|--------|
| Type words | Keyboard | Tap + type |
| Power-ups | Keys 1-4 or click | Tap power-up icons |

## ✨ Features

- 🏰 Castle towers at the base with targeting energy beams
- 👾 Enemy-styled words with angry faces, health bars, boss crowns
- 🌊 Progressive wave system with boss waves every 5 levels
- 🔤 Real English words from simple (3 letters) to expert (9+ letters)
- ⚡ 4 unique power-ups with stacking charge system
- 🔥 Combo multiplier system with taunts
- 🏅 16 achievements to unlock
- 🎵 Sound effects via Web Audio API (zero dependencies)
- 💾 High score persistence with localStorage
- 📱 Responsive — works on desktop, tablet, and mobile
- 🎨 Dark theme with particle effects and animated destroy animations
- 📊 Live visitor and game count (counterapi.dev)

## 🛠️ Tech Stack

- **[Vite](https://vite.dev/)** — Lightning-fast build tool
- **TypeScript** — Type-safe game logic
- **Canvas 2D** — Hardware-accelerated rendering
- **Web Audio API** — Synthesized sound effects

## 🚀 Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build
```

## 📁 Project Structure

```
typo-siege/
├── index.html          # Game shell, HUD, overlays, styles
├── vercel.json         # Vercel deployment config
├── src/
│   ├── main.ts         # Entry point, input handling, UI updates
│   ├── game.ts         # Core game loop and state management
│   ├── entities.ts     # Falling word entities and targeting
│   ├── words.ts        # Word bank and wave progression
│   ├── power.ts        # Power-up system (charge, stack, activate)
│   ├── renderer.ts     # Canvas 2D renderer with tower/enemy visuals
│   └── audio.ts        # Web Audio API sound synthesis
└── vite.config.ts      # Vite configuration
```

## 📄 License

MIT

---

Built by [Shuvo Anirban Roy](https://shuvoanirbanroy.com) · [GitHub](https://github.com/neutral-Stage/typo-siege)
