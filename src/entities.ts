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
  spawnProgress: number;
  legPhase?: number;
}

let nextId = 0;

const BASE_FONT_SIZE = 20;

/** Get font size scaled for screen */
export function getFontSize(canvasWidth: number): number {
  if (canvasWidth < 400) return 15;
  if (canvasWidth < 600) return 17;
  return BASE_FONT_SIZE;
}

/** Get the font string for a given canvas width */
export function getFont(canvasWidth: number, weight = 500): string {
  return `${weight} ${getFontSize(canvasWidth)}px Inter, -apple-system, system-ui, sans-serif`;
}

const PADDING_X = 14;
const PADDING_Y = 8;

/** Compute the natural (single-line) width of text */
function measureNaturalWidth(text: string, canvasWidth: number): number {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  ctx.font = getFont(canvasWidth);
  return ctx.measureText(text).width;
}

export function createFallingWord(entry: WordEntry, canvasWidth: number, speedMult: number, existingWords?: FallingWord[]): FallingWord {
  const fontSize = getFontSize(canvasWidth);
  const lineHeight = fontSize + 6;
  const textWidth = measureNaturalWidth(entry.text, canvasWidth);
  const totalWidth = textWidth + PADDING_X * 2;
  const totalHeight = lineHeight + PADDING_Y * 2;

  // Calculate X with overlap avoidance
  const margin = 15;
  const maxX = canvasWidth - totalWidth - margin;
  let x = margin + Math.random() * Math.max(0, maxX);

  if (existingWords && existingWords.length > 0) {
    // Try up to 8 random positions to find one that doesn't overlap
    const topZone = canvasWidth * 0.25; // Only check words near the top (recently spawned)
    for (let attempt = 0; attempt < 8; attempt++) {
      let overlaps = false;
      for (const w of existingWords) {
        if (w.destroying || w.y > topZone) continue;
        const overlap = x < w.x + w.width + margin && x + totalWidth + margin > w.x;
        if (overlap) { overlaps = true; break; }
      }
      if (!overlaps) break;
      x = margin + Math.random() * Math.max(0, maxX);
    }
  }

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
    spawnProgress: 0,
    legPhase: Math.random() * Math.PI * 2,
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
