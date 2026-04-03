import type { WordEntry } from './words';

export interface FallingWord {
  id: number;
  entry: WordEntry;
  x: number;
  y: number;
  speed: number;
  typed: number;
  width: number;
  height: number;
  opacity: number;
  destroying: boolean;
  destroyTimer: number;
  glowIntensity: number;
}

let nextId = 0;

const FONT = '500 20px Inter, -apple-system, system-ui, sans-serif';
const PADDING_X = 16;
const PADDING_Y = 10;
const LINE_HEIGHT = 26;

/** Compute the natural (single-line) width of text */
function measureNaturalWidth(text: string): number {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  ctx.font = FONT;
  return ctx.measureText(text).width;
}

export function createFallingWord(entry: WordEntry, canvasWidth: number, speedMult: number): FallingWord {
  const textWidth = measureNaturalWidth(entry.text);
  const totalWidth = textWidth + PADDING_X * 2;
  const totalHeight = LINE_HEIGHT + PADDING_Y * 2;

  const maxX = canvasWidth - totalWidth - 20;
  const x = 20 + Math.random() * Math.max(0, maxX);

  return {
    id: nextId++,
    entry,
    x,
    y: -totalHeight,
    speed: entry.speed * speedMult,
    typed: 0,
    width: totalWidth,
    height: totalHeight,
    opacity: 1,
    destroying: false,
    destroyTimer: 0,
    glowIntensity: 0,
  };
}

export function findTargetWord(words: FallingWord[], char: string): FallingWord | null {
  let best: FallingWord | null = null;
  let bestScore = -1;

  for (const word of words) {
    if (word.destroying) continue;
    const nextChar = word.entry.text[word.typed];
    if (nextChar && nextChar.toLowerCase() === char.toLowerCase()) {
      // Prefer: already being typed > closest to bottom
      const priority = word.typed > 0 ? 10000 : 0;
      const score = priority + word.y;
      if (score > bestScore) {
        bestScore = score;
        best = word;
      }
    }
  }
  return best;
}
