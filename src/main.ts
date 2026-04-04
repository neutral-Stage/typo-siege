import { Game } from './game';
import { TAUNTS } from './words';

// ─── DOM elements ───
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
const tauntDisplay = document.getElementById('taunt-display')!;
const builtBy = document.getElementById('built-by')!;

// Stats
const statBest = document.getElementById('stat-best')!;
const statStreak = document.getElementById('stat-streak')!;
const statWords = document.getElementById('stat-words')!;
const statVisits = document.getElementById('stat-visits')!;
const statTotalGames = document.getElementById('stat-totalgames')!;

// Achievement toast
const achToast = document.getElementById('achievement-toast')!;
const achIcon = document.getElementById('ach-icon')!;
const achTitle = document.getElementById('ach-title')!;
const achDesc = document.getElementById('ach-desc')!;
const tapHint = document.getElementById('tap-hint')!;

// Power-up UI
const puElements: Record<string, HTMLElement> = {
  fire: document.getElementById('pu-fire')!,
  lightning: document.getElementById('pu-lightning')!,
  shield: document.getElementById('pu-shield')!,
  chain: document.getElementById('pu-chain')!,
};

// ─── Persistent Stats (localStorage) ───
interface AllTimeStats {
  totalGames: number;
  totalWordsDestroyed: number;
  bestScore: number;
  bestWave: number;
  bestCombo: number;
  currentStreak: number;
  bestStreak: number;
  lastPlayDate: string;
  totalPlayTime: number; // seconds
  achievements: string[];
}

function loadStats(): AllTimeStats {
  const raw = localStorage.getItem('typo-siege-stats');
  if (raw) {
    try { return JSON.parse(raw); } catch { /* fall through */ }
  }
  return {
    totalGames: 0,
    totalWordsDestroyed: 0,
    bestScore: 0,
    bestWave: 0,
    bestCombo: 0,
    currentStreak: 0,
    bestStreak: 0,
    lastPlayDate: '',
    totalPlayTime: 0,
    achievements: [],
  };
}

function saveStats(stats: AllTimeStats) {
  localStorage.setItem('typo-siege-stats', JSON.stringify(stats));
}

let stats = loadStats();

// ─── Achievements ───
interface Achievement {
  id: string;
  icon: string;
  title: string;
  desc: string;
  check: (g: Game, s: AllTimeStats) => boolean;
}

const ACHIEVEMENTS: Achievement[] = [
  { id: 'first_word', icon: '⌨️', title: 'First Blood', desc: 'Destroy your first word', check: (_g, s) => s.totalWordsDestroyed >= 1 },
  { id: 'centurion', icon: '💯', title: 'Centurion', desc: 'Destroy 100 words total', check: (_g, s) => s.totalWordsDestroyed >= 100 },
  { id: 'millennial', icon: '🏅', title: 'Wordsmith', desc: 'Destroy 1000 words total', check: (_g, s) => s.totalWordsDestroyed >= 1000 },
  { id: 'combo5', icon: '🔥', title: 'Hot Streak', desc: 'Reach a 5x combo', check: (_g, s) => s.bestCombo >= 5 },
  { id: 'combo10', icon: '💀', title: 'Unstoppable', desc: 'Reach a 10x combo', check: (_g, s) => s.bestCombo >= 10 },
  { id: 'combo20', icon: '👑', title: 'Godlike', desc: 'Reach a 20x combo', check: (_g, s) => s.bestCombo >= 20 },
  { id: 'wave5', icon: '🌊', title: 'Wave Rider', desc: 'Reach wave 5', check: (_g, s) => s.bestWave >= 5 },
  { id: 'wave10', icon: '🌊', title: 'Storm Chaser', desc: 'Reach wave 10', check: (_g, s) => s.bestWave >= 10 },
  { id: 'wave20', icon: '🌊', title: 'Tsunami', desc: 'Reach wave 20', check: (_g, s) => s.bestWave >= 20 },
  { id: 'score500', icon: '⭐', title: 'Rising Star', desc: 'Score 500 points in a game', check: (_g, s) => s.bestScore >= 500 },
  { id: 'score2000', icon: '🌟', title: 'Superstar', desc: 'Score 2000 points in a game', check: (_g, s) => s.bestScore >= 2000 },
  { id: 'score5000', icon: '💎', title: 'Diamond', desc: 'Score 5000 points in a game', check: (_g, s) => s.bestScore >= 5000 },
  { id: 'streak3', icon: '🔥', title: 'Dedicated', desc: 'Play 3 days in a row', check: (_g, s) => s.bestStreak >= 3 },
  { id: 'streak7', icon: '🔥', title: 'Hardcore', desc: 'Play 7 days in a row', check: (_g, s) => s.bestStreak >= 7 },
  { id: 'ten_games', icon: '🎮', title: 'Regular', desc: 'Play 10 games', check: (_g, s) => s.totalGames >= 10 },
  { id: 'fifty_games', icon: '🎮', title: 'Veteran', desc: 'Play 50 games', check: (_g, s) => s.totalGames >= 50 },
];

let achTimeout: ReturnType<typeof setTimeout> | null = null;

function checkAchievements(game: Game) {
  for (const ach of ACHIEVEMENTS) {
    if (!stats.achievements.includes(ach.id) && ach.check(game, stats)) {
      stats.achievements.push(ach.id);
      saveStats(stats);
      showAchievement(ach);
      break; // Show one at a time
    }
  }
}

function showAchievement(ach: Achievement) {
  achIcon.textContent = ach.icon;
  achTitle.textContent = ach.title;
  achDesc.textContent = ach.desc;
  achToast.classList.add('visible');
  if (achTimeout) clearTimeout(achTimeout);
  achTimeout = setTimeout(() => {
    achToast.classList.remove('visible');
  }, 3000);
}

// ─── Streak system ───
function updateStreak() {
  const today = new Date().toISOString().slice(0, 10);
  if (stats.lastPlayDate === today) return; // Already played today

  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  if (stats.lastPlayDate === yesterday) {
    stats.currentStreak++;
  } else if (stats.lastPlayDate !== today) {
    stats.currentStreak = 1;
  }

  if (stats.currentStreak > stats.bestStreak) {
    stats.bestStreak = stats.currentStreak;
  }
  stats.lastPlayDate = today;
  saveStats(stats);
}

// ─── Difficulty ───
let difficulty: 'easy' | 'normal' | 'hard' = 'normal';

document.querySelectorAll('.diff-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    difficulty = (btn as HTMLElement).dataset.diff as 'easy' | 'normal' | 'hard';
  });
});

// ─── Taunts ───
let tauntTimeout: ReturnType<typeof setTimeout> | null = null;

function showTaunt(text: string) {
  tauntDisplay.textContent = text;
  tauntDisplay.classList.add('visible');
  if (tauntTimeout) clearTimeout(tauntTimeout);
  tauntTimeout = setTimeout(() => {
    tauntDisplay.classList.remove('visible');
  }, 1500);
}

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Track last combo to detect new thresholds
let lastCombo = 0;

// ─── Analytics (counterapi.dev — free, no signup) ───
async function trackVisit() {
  try {
    await fetch('https://api.counterapi.dev/v1/typo-siege-nyh5/visits/up');
  } catch { /* silent */ }
  fetchCounts();
}

async function trackGame() {
  try {
    await fetch('https://api.counterapi.dev/v1/typo-siege-nyh5/games/up');
  } catch { /* silent */ }
  fetchCounts();
}

async function fetchCounts() {
  try {
    const [vRes, gRes] = await Promise.all([
      fetch('https://api.counterapi.dev/v1/typo-siege-nyh5/visits'),
      fetch('https://api.counterapi.dev/v1/typo-siege-nyh5/games'),
    ]);
    const vData = await vRes.json();
    const gData = await gRes.json();
    if (statVisits) statVisits.textContent = vData?.count ?? '—';
    if (statTotalGames) statTotalGames.textContent = gData?.count ?? '—';
  } catch (e) { console.warn('counter fetch failed', e); }
}

// Track visit on page load
trackVisit();

// ─── Game state ───
let game = new Game(canvas, updateUI, difficulty);

function showMenu() {
  overlayTitle.textContent = 'TYPO SIEGE';
  overlaySubtitle.textContent = 'Type words. Charge towers. Defend the page.';
  overlayStats.style.display = 'none';
  newHighscoreBadge.style.display = 'none';
  startBtn.textContent = 'Start Game';

  const hs = game.savedHighScore;
  menuHighscore.textContent = hs > 0 ? `Best: ${hs}` : '';

  // Update stats pills
  statBest.textContent = String(stats.bestScore);
  statStreak.textContent = String(stats.currentStreak);
  statWords.textContent = String(stats.totalWordsDestroyed);

  builtBy.style.display = '';
}

function showGameOver() {
  overlayTitle.textContent = 'GAME OVER';
  overlaySubtitle.textContent = '';
  overlayStats.style.display = 'block';

  // Calculate WPM (approximate)
  const wpm = game.charsTyped > 0 ? Math.round(game.charsTyped / 5) : 0;
  overlayStats.innerHTML = `
    <span class="big">${game.currentScore}</span>
    Wave ${game.currentWave} · Best Combo ×${game.bestCombo} · ~${wpm} WPM
  `;
  newHighscoreBadge.style.display = game.isNewHigh ? 'block' : 'none';
  menuHighscore.textContent = `Best: ${stats.bestScore}`;
  startBtn.textContent = 'Play Again';

  // Update stats pills
  statBest.textContent = String(stats.bestScore);
  statStreak.textContent = String(stats.currentStreak);
  statWords.textContent = String(stats.totalWordsDestroyed);

  builtBy.style.display = '';
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
    el.classList.toggle('charged', pu.stacks > 0);

    // Show stack count
    let stackBadge = el.querySelector('.stack-count') as HTMLElement;
    if (!stackBadge) {
      stackBadge = document.createElement('div');
      stackBadge.className = 'stack-count';
      stackBadge.style.cssText = 'position:absolute;top:2px;right:4px;font-size:11px;font-weight:800;color:#67e8f9;text-shadow:0 0 6px rgba(103,232,249,0.6);pointer-events:none;';
      el.appendChild(stackBadge);
    }
    stackBadge.textContent = pu.stacks > 0 ? `×${pu.stacks}` : '';
    stackBadge.style.display = pu.stacks > 0 ? '' : 'none';
  }

  // Taunts on combo milestones
  const combo = game.currentCombo;
  if (combo > lastCombo) {
    if (combo === 3) showTaunt('Nice combo! 🔥');
    else if (combo === 5) showTaunt(randomFrom(TAUNTS.combo));
    else if (combo === 8) showTaunt(randomFrom(TAUNTS.combo));
    else if (combo === 10) showTaunt(randomFrom(TAUNTS.combo));
    else if (combo === 15) showTaunt(randomFrom(TAUNTS.combo));
    else if (combo === 20) showTaunt(randomFrom(TAUNTS.combo));
    else if (combo > 20 && combo % 5 === 0) showTaunt(randomFrom(TAUNTS.combo));
  }
  lastCombo = combo;

  // Boss wave taunt
  if (game.isBossWaveFlag) {
    showTaunt(randomFrom(TAUNTS.bossIncoming));
  }

  // Game over — update stats
  if (game.isGameOver) {
    // Update all-time stats
    stats.totalGames++;
    stats.totalWordsDestroyed += game.wordsDestroyed;
    if (game.currentScore > stats.bestScore) stats.bestScore = game.currentScore;
    if (game.currentWave > stats.bestWave) stats.bestWave = game.currentWave;
    if (game.bestCombo > stats.bestCombo) stats.bestCombo = game.bestCombo;
    saveStats(stats);

    checkAchievements(game);

    overlay.classList.remove('hidden');
    showGameOver();
  }
}

// ─── Input handling ───
document.addEventListener('keydown', (e) => {
  if (!game.isPlaying) return;

  if (e.key.length === 1 || ['1', '2', '3', '4'].includes(e.key)) {
    e.preventDefault();
  }

  game.handleKey(e.key);
});

// Start button
function startGame() {
  updateStreak();
  trackGame();
  game = new Game(canvas, updateUI, difficulty);
  game.start();
  overlay.classList.add('hidden');
  builtBy.style.display = 'none';
  lastCombo = 0;
  updateUI();
  focusMobileInput();
  setTimeout(showTapHint, 500);
}
startBtn.addEventListener('click', startGame);
// Also handle touch for faster mobile response
startBtn.addEventListener('touchend', (e) => {
  e.preventDefault(); // Prevent ghost click
  startGame();
});

// Power-up click handlers
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

// ─── Mobile touch support ───
const mobileInput = document.getElementById('mobile-input') as HTMLInputElement;
const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

function focusMobileInput() {
  if (game.isPlaying) {
    mobileInput.focus({ preventScroll: true });
    tapHint.classList.remove('visible');
  }
}

function showTapHint() {
  if (isTouchDevice && game.isPlaying) {
    tapHint.classList.add('visible');
  }
}

// Show hint on game start (handled in startGame)

// Tap anywhere on canvas to focus
canvas.addEventListener('touchstart', (e) => {
  if (game.isPlaying) {
    e.preventDefault();
    focusMobileInput();
  }
}, { passive: false });

// Also tap on the game wrapper (catches taps on empty areas)
document.getElementById('game-wrapper')!.addEventListener('touchstart', (e) => {
  // Don't intercept overlay, power-up, or button taps
  const target = e.target as HTMLElement;
  if (target.closest('#overlay') || target.closest('.power-up') || target.closest('button')) return;
  if (game.isPlaying) {
    e.preventDefault();
    focusMobileInput();
  }
}, { passive: false });

const observer = new MutationObserver(() => {
  if (!overlay.classList.contains('hidden')) {
    mobileInput.blur();
    tapHint.classList.remove('visible');
  }
});
observer.observe(overlay, { attributes: true, attributeFilter: ['class'] });

mobileInput.addEventListener('input', (e) => {
  if (!game.isPlaying) return;
  const target = e.target as HTMLInputElement;
  const value = target.value;
  if (value.length > 0) {
    for (const char of value) {
      game.handleKey(char);
    }
    target.value = '';
  }
  focusMobileInput();
});

mobileInput.addEventListener('blur', () => {
  if (game.isPlaying) {
    setTimeout(() => {
      focusMobileInput();
      // If refocus fails (user scrolled away), show hint
      setTimeout(() => {
        if (document.activeElement !== mobileInput && game.isPlaying) {
          showTapHint();
        }
      }, 200);
    }, 100);
  }
});

// Prevent pull-to-refresh and scroll on mobile
document.addEventListener('touchmove', (e) => {
  if (game.isPlaying) e.preventDefault();
}, { passive: false });

// Prevent double-tap zoom (only during gameplay)
let lastTap = 0;
document.addEventListener('touchend', (e) => {
  if (!game.isPlaying) return;
  const now = Date.now();
  if (now - lastTap < 300) {
    e.preventDefault();
  }
  lastTap = now;
}, { passive: false });

// ─── Init ───
showMenu();

function loop(time: number) {
  game.update(time);
  updateUI();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

window.addEventListener('resize', () => {
  game.rendererRef.resize();
});
