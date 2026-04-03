export interface WordEntry {
  text: string;
  difficulty: number;
  points: number;
  speed: number;
}

export const WORDS: WordEntry[] = [
  // Wave 1-2: Short code keywords (difficulty 1)
  { text: 'var', difficulty: 1, points: 10, speed: 25 },
  { text: 'let', difficulty: 1, points: 10, speed: 25 },
  { text: 'const', difficulty: 1, points: 15, speed: 28 },
  { text: 'if', difficulty: 1, points: 10, speed: 25 },
  { text: 'else', difficulty: 1, points: 10, speed: 25 },
  { text: 'for', difficulty: 1, points: 10, speed: 25 },
  { text: 'map', difficulty: 1, points: 10, speed: 25 },
  { text: 'set', difficulty: 1, points: 10, speed: 25 },
  { text: 'get', difficulty: 1, points: 10, speed: 25 },
  { text: 'new', difficulty: 1, points: 10, speed: 25 },
  { text: 'try', difficulty: 1, points: 10, speed: 25 },
  { text: 'key', difficulty: 1, points: 10, speed: 25 },
  { text: 'api', difficulty: 1, points: 10, speed: 25 },
  { text: 'css', difficulty: 1, points: 10, speed: 25 },
  { text: 'npm', difficulty: 1, points: 10, speed: 25 },
  { text: 'git', difficulty: 1, points: 10, speed: 25 },
  { text: 'app', difficulty: 1, points: 10, speed: 25 },
  { text: 'dom', difficulty: 1, points: 10, speed: 25 },
  { text: 'log', difficulty: 1, points: 10, speed: 25 },

  // Wave 3-4: Medium code words (difficulty 1.5)
  { text: 'async', difficulty: 1.5, points: 25, speed: 32 },
  { text: 'await', difficulty: 1.5, points: 25, speed: 32 },
  { text: 'yield', difficulty: 1.5, points: 25, speed: 32 },
  { text: 'class', difficulty: 1.5, points: 20, speed: 30 },
  { text: 'type', difficulty: 1.5, points: 20, speed: 30 },
  { text: 'enum', difficulty: 1.5, points: 20, speed: 30 },
  { text: 'null', difficulty: 1.5, points: 20, speed: 30 },
  { text: 'true', difficulty: 1.5, points: 20, speed: 30 },
  { text: 'push', difficulty: 1.5, points: 20, speed: 30 },
  { text: 'pull', difficulty: 1.5, points: 20, speed: 30 },
  { text: 'fetch', difficulty: 1.5, points: 25, speed: 32 },
  { text: 'props', difficulty: 1.5, points: 25, speed: 32 },
  { text: 'state', difficulty: 1.5, points: 25, speed: 32 },
  { text: 'hook', difficulty: 1.5, points: 20, speed: 30 },
  { text: 'node', difficulty: 1.5, points: 20, speed: 30 },
  { text: 'build', difficulty: 1.5, points: 25, speed: 32 },
  { text: 'cache', difficulty: 1.5, points: 25, speed: 32 },
  { text: 'query', difficulty: 1.5, points: 25, speed: 32 },
  { text: 'array', difficulty: 1.5, points: 25, speed: 32 },
  { text: 'error', difficulty: 1.5, points: 25, speed: 32 },

  // Wave 5-6: Longer code words (difficulty 2)
  { text: 'return', difficulty: 2, points: 35, speed: 35 },
  { text: 'import', difficulty: 2, points: 35, speed: 35 },
  { text: 'export', difficulty: 2, points: 35, speed: 35 },
  { text: 'delete', difficulty: 2, points: 35, speed: 35 },
  { text: 'switch', difficulty: 2, points: 35, speed: 35 },
  { text: 'render', difficulty: 2, points: 35, speed: 35 },
  { text: 'deploy', difficulty: 2, points: 35, speed: 35 },
  { text: 'server', difficulty: 2, points: 35, speed: 35 },
  { text: 'client', difficulty: 2, points: 35, speed: 35 },
  { text: 'docker', difficulty: 2, points: 35, speed: 35 },
  { text: 'script', difficulty: 2, points: 35, speed: 35 },
  { text: 'string', difficulty: 2, points: 35, speed: 35 },
  { text: 'number', difficulty: 2, points: 40, speed: 37 },
  { text: 'object', difficulty: 2, points: 35, speed: 35 },
  { text: 'promise', difficulty: 2, points: 40, speed: 37 },
  { text: 'react', difficulty: 2, points: 35, speed: 35 },
  { text: 'proxy', difficulty: 2, points: 35, speed: 35 },
  { text: 'token', difficulty: 2, points: 30, speed: 35 },
  { text: 'route', difficulty: 2, points: 30, speed: 35 },

  // Wave 7-8: Programming terms (difficulty 2.5)
  { text: 'function', difficulty: 2.5, points: 50, speed: 38 },
  { text: 'template', difficulty: 2.5, points: 50, speed: 38 },
  { text: 'variable', difficulty: 2.5, points: 50, speed: 38 },
  { text: 'compile', difficulty: 2.5, points: 45, speed: 36 },
  { text: 'debug', difficulty: 2.5, points: 45, speed: 36 },
  { text: 'runtime', difficulty: 2.5, points: 50, speed: 38 },
  { text: 'module', difficulty: 2.5, points: 45, speed: 36 },
  { text: 'buffer', difficulty: 2.5, points: 45, speed: 36 },
  { text: 'stream', difficulty: 2.5, points: 45, speed: 36 },
  { text: 'socket', difficulty: 2.5, points: 45, speed: 36 },
  { text: 'thread', difficulty: 2.5, points: 45, speed: 36 },
  { text: 'schema', difficulty: 2.5, points: 50, speed: 38 },
  { text: 'cursor', difficulty: 2.5, points: 45, speed: 36 },
  { text: 'kernel', difficulty: 2.5, points: 45, speed: 36 },

  // Wave 9+: Longer phrases with symbols (difficulty 3)
  { text: 'async/await', difficulty: 3, points: 80, speed: 38 },
  { text: 'console.log', difficulty: 3, points: 95, speed: 42 },
  { text: 'useState()', difficulty: 3, points: 90, speed: 40 },
  { text: 'npm install', difficulty: 3, points: 85, speed: 40 },
  { text: 'git push', difficulty: 3, points: 80, speed: 38 },
  { text: '<div/>', difficulty: 3, points: 75, speed: 38 },
  { text: 'pipeline', difficulty: 3, points: 80, speed: 40 },
  { text: 'webhook', difficulty: 3, points: 80, speed: 40 },
  { text: 'callback', difficulty: 3, points: 85, speed: 40 },
  { text: 'database', difficulty: 3, points: 85, speed: 40 },
  { text: 'terminal', difficulty: 3, points: 80, speed: 40 },
  { text: 'compiler', difficulty: 3, points: 85, speed: 40 },
  { text: 'iterator', difficulty: 3, points: 85, speed: 40 },
  { text: 'generator', difficulty: 3, points: 90, speed: 42 },
  { text: 'middleware', difficulty: 3, points: 95, speed: 42 },
  { text: 'refactor', difficulty: 3, points: 85, speed: 40 },
  { text: 'dockerfile', difficulty: 3, points: 90, speed: 42 },
  { text: 'interface', difficulty: 3, points: 90, speed: 42 },
  { text: 'algorithm', difficulty: 3, points: 100, speed: 44 },
  { text: 'component', difficulty: 3, points: 90, speed: 42 },
  { text: 'typescript', difficulty: 3, points: 100, speed: 44 },
  { text: 'javascript', difficulty: 3, points: 100, speed: 44 },
  { text: 'framework', difficulty: 3, points: 95, speed: 42 },
];

export function getWordsForWave(wave: number): WordEntry[] {
  if (wave <= 2) return WORDS.filter(w => w.difficulty <= 1);
  if (wave <= 4) return WORDS.filter(w => w.difficulty <= 1.5);
  if (wave <= 6) return WORDS.filter(w => w.difficulty <= 2);
  if (wave <= 8) return WORDS.filter(w => w.difficulty <= 2.5);
  return WORDS;
}

export function getSpawnInterval(wave: number): number {
  return Math.max(800, 2500 - wave * 150);
}

export function getSpeedMultiplier(wave: number): number {
  return 1 + (wave - 1) * 0.08;
}
