export interface WordEntry {
  text: string;
  difficulty: number;
  points: number;
  speed: number;
}

export const WORDS: WordEntry[] = [
  // Easy (3-4 letters) — Wave 1-2
  { text: 'the', difficulty: 1, points: 10, speed: 50 },
  { text: 'and', difficulty: 1, points: 10, speed: 55 },
  { text: 'for', difficulty: 1, points: 10, speed: 55 },
  { text: 'not', difficulty: 1, points: 10, speed: 55 },
  { text: 'you', difficulty: 1, points: 10, speed: 55 },
  { text: 'all', difficulty: 1, points: 10, speed: 55 },
  { text: 'can', difficulty: 1, points: 10, speed: 55 },
  { text: 'had', difficulty: 1, points: 10, speed: 55 },
  { text: 'her', difficulty: 1, points: 10, speed: 55 },
  { text: 'was', difficulty: 1, points: 10, speed: 55 },
  { text: 'one', difficulty: 1, points: 10, speed: 55 },
  { text: 'our', difficulty: 1, points: 10, speed: 55 },
  { text: 'out', difficulty: 1, points: 10, speed: 55 },
  { text: 'day', difficulty: 1, points: 10, speed: 55 },
  { text: 'get', difficulty: 1, points: 10, speed: 55 },
  { text: 'has', difficulty: 1, points: 10, speed: 55 },
  { text: 'how', difficulty: 1, points: 10, speed: 55 },
  { text: 'new', difficulty: 1, points: 10, speed: 55 },
  { text: 'see', difficulty: 1, points: 10, speed: 55 },
  { text: 'way', difficulty: 1, points: 10, speed: 55 },
  { text: 'run', difficulty: 1, points: 10, speed: 55 },
  { text: 'top', difficulty: 1, points: 10, speed: 55 },
  { text: 'red', difficulty: 1, points: 10, speed: 55 },
  { text: 'sun', difficulty: 1, points: 10, speed: 55 },
  { text: 'sea', difficulty: 1, points: 10, speed: 55 },
  { text: 'sky', difficulty: 1, points: 10, speed: 55 },
  { text: 'big', difficulty: 1, points: 10, speed: 55 },
  { text: 'dog', difficulty: 1, points: 10, speed: 55 },
  { text: 'eat', difficulty: 1, points: 10, speed: 55 },

  // Medium (5-6 letters) — Wave 3-4
  { text: 'about', difficulty: 1.5, points: 25, speed: 60 },
  { text: 'after', difficulty: 1.5, points: 25, speed: 60 },
  { text: 'again', difficulty: 1.5, points: 25, speed: 60 },
  { text: 'below', difficulty: 1.5, points: 25, speed: 60 },
  { text: 'could', difficulty: 1.5, points: 25, speed: 60 },
  { text: 'every', difficulty: 1.5, points: 25, speed: 60 },
  { text: 'first', difficulty: 1.5, points: 25, speed: 60 },
  { text: 'found', difficulty: 1.5, points: 25, speed: 60 },
  { text: 'great', difficulty: 1.5, points: 25, speed: 60 },
  { text: 'house', difficulty: 1.5, points: 25, speed: 60 },
  { text: 'large', difficulty: 1.5, points: 25, speed: 60 },
  { text: 'learn', difficulty: 1.5, points: 25, speed: 60 },
  { text: 'never', difficulty: 1.5, points: 25, speed: 60 },
  { text: 'other', difficulty: 1.5, points: 25, speed: 60 },
  { text: 'place', difficulty: 1.5, points: 25, speed: 60 },
  { text: 'point', difficulty: 1.5, points: 25, speed: 60 },
  { text: 'right', difficulty: 1.5, points: 25, speed: 60 },
  { text: 'small', difficulty: 1.5, points: 25, speed: 60 },
  { text: 'sound', difficulty: 1.5, points: 25, speed: 60 },
  { text: 'still', difficulty: 1.5, points: 25, speed: 60 },
  { text: 'study', difficulty: 1.5, points: 25, speed: 60 },
  { text: 'their', difficulty: 1.5, points: 25, speed: 60 },
  { text: 'there', difficulty: 1.5, points: 25, speed: 60 },
  { text: 'thing', difficulty: 1.5, points: 25, speed: 60 },
  { text: 'think', difficulty: 1.5, points: 25, speed: 60 },
  { text: 'three', difficulty: 1.5, points: 25, speed: 60 },
  { text: 'water', difficulty: 1.5, points: 25, speed: 60 },
  { text: 'where', difficulty: 1.5, points: 25, speed: 60 },
  { text: 'which', difficulty: 1.5, points: 25, speed: 60 },
  { text: 'world', difficulty: 1.5, points: 25, speed: 60 },
  { text: 'would', difficulty: 1.5, points: 25, speed: 60 },
  { text: 'write', difficulty: 1.5, points: 25, speed: 60 },
  { text: 'rapid', difficulty: 1.5, points: 25, speed: 60 },
  { text: 'focus', difficulty: 1.5, points: 25, speed: 60 },
  { text: 'craft', difficulty: 1.5, points: 25, speed: 60 },
  { text: 'shift', difficulty: 1.5, points: 25, speed: 60 },
  { text: 'power', difficulty: 1.5, points: 25, speed: 60 },
  { text: 'force', difficulty: 1.5, points: 25, speed: 60 },
  { text: 'storm', difficulty: 1.5, points: 25, speed: 60 },
  { text: 'flame', difficulty: 1.5, points: 25, speed: 60 },

  // Hard (7-8 letters) — Wave 5-7
  { text: 'ability', difficulty: 2, points: 40, speed: 65 },
  { text: 'balance', difficulty: 2, points: 40, speed: 65 },
  { text: 'capture', difficulty: 2, points: 40, speed: 65 },
  { text: 'dynamic', difficulty: 2, points: 40, speed: 65 },
  { text: 'element', difficulty: 2, points: 40, speed: 65 },
  { text: 'fashion', difficulty: 2, points: 40, speed: 65 },
  { text: 'general', difficulty: 2, points: 40, speed: 65 },
  { text: 'habitat', difficulty: 2, points: 40, speed: 65 },
  { text: 'imagine', difficulty: 2, points: 40, speed: 65 },
  { text: 'journey', difficulty: 2, points: 40, speed: 65 },
  { text: 'kitchen', difficulty: 2, points: 40, speed: 65 },
  { text: 'library', difficulty: 2, points: 40, speed: 65 },
  { text: 'machine', difficulty: 2, points: 40, speed: 65 },
  { text: 'natural', difficulty: 2, points: 40, speed: 65 },
  { text: 'obscure', difficulty: 2, points: 40, speed: 65 },
  { text: 'perfect', difficulty: 2, points: 40, speed: 65 },
  { text: 'quality', difficulty: 2, points: 40, speed: 65 },
  { text: 'reality', difficulty: 2, points: 40, speed: 65 },
  { text: 'science', difficulty: 2, points: 40, speed: 65 },
  { text: 'triumph', difficulty: 2, points: 40, speed: 65 },
  { text: 'uniform', difficulty: 2, points: 40, speed: 65 },
  { text: 'venture', difficulty: 2, points: 40, speed: 65 },
  { text: 'weather', difficulty: 2, points: 40, speed: 65 },
  { text: 'extreme', difficulty: 2, points: 40, speed: 65 },
  { text: 'measure', difficulty: 2, points: 40, speed: 65 },
  { text: 'network', difficulty: 2, points: 40, speed: 65 },
  { text: 'organic', difficulty: 2, points: 40, speed: 65 },
  { text: 'pattern', difficulty: 2, points: 40, speed: 65 },
  { text: 'quantum', difficulty: 2, points: 40, speed: 65 },
  { text: 'reflect', difficulty: 2, points: 40, speed: 65 },
  { text: 'destroy', difficulty: 2, points: 40, speed: 65 },
  { text: 'phantom', difficulty: 2, points: 40, speed: 65 },
  { text: 'crystal', difficulty: 2, points: 40, speed: 65 },
  { text: 'voltage', difficulty: 2, points: 40, speed: 65 },

  // Expert (9+ letters) — Wave 8+
  { text: 'absolute', difficulty: 3, points: 70, speed: 70 },
  { text: 'beautiful', difficulty: 3, points: 80, speed: 72 },
  { text: 'challenge', difficulty: 3, points: 80, speed: 72 },
  { text: 'dangerous', difficulty: 3, points: 80, speed: 72 },
  { text: 'elaborate', difficulty: 3, points: 80, speed: 72 },
  { text: 'fantastic', difficulty: 3, points: 80, speed: 72 },
  { text: 'gorgeous', difficulty: 3, points: 80, speed: 72 },
  { text: 'hurricane', difficulty: 3, points: 80, speed: 72 },
  { text: 'immediate', difficulty: 3, points: 80, speed: 72 },
  { text: 'knowledge', difficulty: 3, points: 80, speed: 72 },
  { text: 'landscape', difficulty: 3, points: 80, speed: 72 },
  { text: 'marvelous', difficulty: 3, points: 80, speed: 72 },
  { text: 'narrative', difficulty: 3, points: 80, speed: 72 },
  { text: 'offensive', difficulty: 3, points: 80, speed: 72 },
  { text: 'panoramic', difficulty: 3, points: 80, speed: 72 },
  { text: 'questions', difficulty: 3, points: 80, speed: 72 },
  { text: 'recording', difficulty: 3, points: 80, speed: 72 },
  { text: 'structure', difficulty: 3, points: 80, speed: 72 },
  { text: 'technique', difficulty: 3, points: 80, speed: 72 },
  { text: 'ultimate', difficulty: 3, points: 80, speed: 72 },
  { text: 'vibration', difficulty: 3, points: 80, speed: 72 },
  { text: 'awakening', difficulty: 3, points: 80, speed: 72 },
  { text: 'brilliance', difficulty: 3, points: 90, speed: 75 },
  { text: 'conspiracy', difficulty: 3, points: 90, speed: 75 },
  { text: 'discovery', difficulty: 3, points: 90, speed: 75 },
  { text: 'evolution', difficulty: 3, points: 90, speed: 75 },
  { text: 'invisible', difficulty: 3, points: 80, speed: 72 },
  { text: 'legendary', difficulty: 3, points: 90, speed: 75 },
  { text: 'mythical', difficulty: 3, points: 80, speed: 72 },
  { text: 'supernova', difficulty: 3, points: 90, speed: 75 },
  { text: 'twilight', difficulty: 3, points: 80, speed: 72 },
  { text: 'threshold', difficulty: 3, points: 90, speed: 75 },
];

export function getWordsForWave(wave: number): WordEntry[] {
  if (wave <= 1) return WORDS.filter(w => w.difficulty <= 1.5);
  if (wave <= 3) return WORDS.filter(w => w.difficulty <= 2);
  if (wave <= 5) return WORDS.filter(w => w.difficulty <= 3);
  return WORDS;
}

export function getSpawnInterval(wave: number): number {
  return Math.max(500, 1400 - wave * 100);
}

export function getSpeedMultiplier(wave: number): number {
  return 1 + (wave - 1) * 0.12;
}

// Boss words appear every 5 waves
export function isBossWave(wave: number): boolean {
  return wave > 0 && wave % 5 === 0;
}

export function getBossWord(): WordEntry {
  const bosses: WordEntry[] = [
    { text: 'incomprehensible', difficulty: 5, points: 200, speed: 30 },
    { text: 'extraordinary', difficulty: 5, points: 200, speed: 30 },
    { text: 'unpredictable', difficulty: 5, points: 200, speed: 30 },
    { text: 'overwhelming', difficulty: 5, points: 200, speed: 30 },
    { text: 'thunderstorm', difficulty: 5, points: 200, speed: 30 },
    { text: 'revolutionary', difficulty: 5, points: 200, speed: 30 },
    { text: 'constellation', difficulty: 5, points: 200, speed: 30 },
    { text: 'encyclopedia', difficulty: 5, points: 200, speed: 30 },
    { text: 'mischievous', difficulty: 5, points: 200, speed: 30 },
    { text: 'catastrophe', difficulty: 5, points: 250, speed: 35 },
    { text: 'pharmaceutical', difficulty: 5, points: 250, speed: 35 },
    { text: 'accomplishment', difficulty: 5, points: 250, speed: 35 },
    { text: 'communication', difficulty: 5, points: 250, speed: 35 },
    { text: 'entertainment', difficulty: 5, points: 250, speed: 35 },
    { text: 'international', difficulty: 5, points: 250, speed: 35 },
  ];
  return bosses[Math.floor(Math.random() * bosses.length)];
}

// Taunts
export const TAUNTS = {
  combo: [
    'ON FIRE! 🔥', 'UNSTOPPABLE! 💀', 'TOO EASY! 😎',
    'SPEED DEMON! ⚡', 'GODLIKE! 👑', 'LEGENDARY! 🌟',
    'SAVAGE! 🦁', 'MEGA COMBO! 💎', 'RUTHLESS! 🔪',
  ],
  miss: [
    'Ouch! 🤕', 'That hurt!', 'Watch out! 👀',
    'Stay focused!', 'Oops! 😅', 'They\'re getting through!',
  ],
  waveComplete: [
    'Wave cleared! 🎉', 'Nice work! 💪', 'Keep going! 🚀',
    'Bring it on! 😤', 'Too easy! 🎯',
  ],
  bossIncoming: [
    '⚠️ BOSS INCOMING! ⚠️',
    '💀 BIG WORD ALERT! 💀',
    '🏰 SIEGE BREAKER! 🏰',
  ],
  powerUp: [
    'POWER SURGE! ⚡', 'UNLEASHED! 💥', 'MAXIMUM POWER! 🔋',
  ],
  achievement: [
    '🏅 Achievement Unlocked!',
  ],
};
