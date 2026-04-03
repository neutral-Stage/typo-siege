import { Game } from './game';

// DOM elements
const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
const overlay = document.getElementById('overlay')!;
const startBtn = document.getElementById('start-btn')!;
const scoreVal = document.getElementById('score-val')!;
const waveVal = document.getElementById('wave-val')!;
const livesDisplay = document.getElementById('lives-display')!;
const typedText = document.getElementById('typed-text')!;
const inputDisplay = document.getElementById('input-display')!;
const overlayTitle = document.getElementById('overlay-title')!;
const overlaySubtitle = document.getElementById('overlay-subtitle')!;
const overlayStats = document.getElementById('overlay-stats')!;
const newHighscoreBadge = document.getElementById('new-highscore-badge')!;
const menuHighscore = document.getElementById('menu-highscore')!;

// Power-up UI
const puElements: Record<string, HTMLElement> = {
  fire: document.getElementById('pu-fire')!,
  lightning: document.getElementById('pu-lightning')!,
  shield: document.getElementById('pu-shield')!,
  chain: document.getElementById('pu-chain')!,
};

// Create game
let game = new Game(canvas, updateUI);

function showMenu() {
  overlayTitle.textContent = 'TYPO SIEGE';
  overlaySubtitle.textContent = 'Type words. Charge towers. Defend the page.';
  overlayStats.style.display = 'none';
  newHighscoreBadge.style.display = 'none';
  startBtn.textContent = 'Start Game';

  const hs = game.savedHighScore;
  menuHighscore.textContent = hs > 0 ? `Best: ${hs}` : '';
}

function showGameOver() {
  overlayTitle.textContent = 'GAME OVER';
  overlaySubtitle.textContent = '';
  overlayStats.style.display = 'block';
  overlayStats.textContent = `Score: ${game.currentScore}  |  Wave: ${game.currentWave}  |  Best Combo: ×${game.bestCombo}`;
  newHighscoreBadge.style.display = game.isNewHigh ? 'block' : 'none';
  menuHighscore.textContent = `Best: ${game.savedHighScore}`;
  startBtn.textContent = 'Play Again';
}

function updateUI() {
  scoreVal.textContent = String(game.currentScore);
  waveVal.textContent = String(game.currentWave);

  // Lives as hearts
  livesDisplay.textContent = '❤️'.repeat(Math.max(0, game.currentLives)) + '🖤'.repeat(Math.max(0, 3 - game.currentLives));

  // Typed text
  typedText.textContent = game.typedText;
  inputDisplay.classList.toggle('active', game.typedText.length > 0);

  // Power-up charges
  for (const pu of game.puStates) {
    const el = puElements[pu.type];
    if (!el) continue;
    const fill = el.querySelector('.charge-fill') as HTMLElement;
    const pct = (pu.charge / pu.maxCharge) * 100;
    fill.style.width = `${pct}%`;
    el.classList.toggle('charged', pu.charge >= pu.maxCharge);
  }

  // Game over
  if (game.isGameOver) {
    overlay.classList.remove('hidden');
    showGameOver();
  }
}

// Input handling
document.addEventListener('keydown', (e) => {
  if (!game.isPlaying) return;

  // Prevent default for game keys
  if (e.key.length === 1 || ['1', '2', '3', '4'].includes(e.key)) {
    e.preventDefault();
  }

  game.handleKey(e.key);
});

// Start button
startBtn.addEventListener('click', () => {
  game = new Game(canvas, updateUI);
  game.start();
  overlay.classList.add('hidden');
  updateUI();
});

// Show initial menu state
showMenu();

// Game loop
function loop(time: number) {
  game.update(time);
  updateUI();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

// Handle resize
window.addEventListener('resize', () => {
  game.rendererRef.resize();
});
