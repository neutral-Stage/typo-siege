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

// Power-up click handlers with feedback
document.getElementById('pu-fire')!.addEventListener('click', () => {
  if (game.isPlaying) {
    const worked = game.handleKeyWithFeedback('1');
    if (!worked) flashPowerUp('pu-fire');
  }
});
document.getElementById('pu-lightning')!.addEventListener('click', () => {
  if (game.isPlaying) {
    const worked = game.handleKeyWithFeedback('2');
    if (!worked) flashPowerUp('pu-lightning');
  }
});
document.getElementById('pu-shield')!.addEventListener('click', () => {
  if (game.isPlaying) {
    const worked = game.handleKeyWithFeedback('3');
    if (!worked) flashPowerUp('pu-shield');
  }
});
document.getElementById('pu-chain')!.addEventListener('click', () => {
  if (game.isPlaying) {
    const worked = game.handleKeyWithFeedback('4');
    if (!worked) flashPowerUp('pu-chain');
  }
});

function flashPowerUp(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  el.style.outline = '2px solid rgba(239,68,68,0.6)';
  setTimeout(() => { el.style.outline = ''; }, 300);
}

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
