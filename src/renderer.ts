import type { FallingWord } from './entities';

const FONT = '500 20px Inter, -apple-system, system-ui, sans-serif';
const FONT_TYPED = '600 20px Inter, -apple-system, system-ui, sans-serif';
const LINE_HEIGHT = 26;
const PADDING_X = 16;
const PADDING_Y = 10;

// Colors
const C_BG = '#fafafa';
const C_WORD_BG = 'rgba(0,0,0,0.04)';
const C_WORD_BG_TARGET = 'rgba(99,102,241,0.08)';
const C_TYPED = '#6366f1';
const C_UNTYPED = '#333';
const C_DESTROYING = '#6366f1';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  char: string;
  opacity: number;
  font: string;
  size: number;
  rotation: number;
  vr: number;
}

export class Renderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private dpr: number;
  private particles: Particle[] = [];
  private shieldFlash = 0;
  private comboText = '';
  private comboOpacity = 0;
  private screenFlashColor = '';
  private screenFlashOpacity = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.dpr = window.devicePixelRatio || 1;
    this.resize();
  }

  resize() {
    const rect = this.canvas.parentElement!.getBoundingClientRect();
    this.canvas.width = rect.width * this.dpr;
    this.canvas.height = rect.height * this.dpr;
    this.ctx.scale(this.dpr, this.dpr);
  }

  get width(): number { return this.canvas.width / this.dpr; }
  get height(): number { return this.canvas.height / this.dpr; }

  showCombo(combo: number) {
    this.comboText = `COMBO ×${combo}`;
    this.comboOpacity = 1;
  }

  showShieldFlash() {
    this.shieldFlash = 1;
  }

  showScreenFlash(color: string) {
    this.screenFlashColor = color;
    this.screenFlashOpacity = 0.35;
  }

  drawWaveTransition(wave: number, progress: number) {
    // progress goes from 1 (just started) to 0 (ending)
    // fade in during first half, fade out during second half
    let alpha: number;
    if (progress > 0.5) {
      alpha = (1 - progress) * 2; // fade in: 0→1
    } else {
      alpha = progress * 2; // fade out: 1→0
    }

    const ctx = this.ctx;
    const W = this.width;
    const H = this.height;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#fafafa';
    ctx.fillRect(0, 0, W, H);

    ctx.globalAlpha = alpha;
    ctx.font = '700 72px Inter, -apple-system, system-ui, sans-serif';
    ctx.fillStyle = '#111';
    ctx.textAlign = 'center';
    ctx.fillText(`WAVE ${wave}`, W / 2, H / 2 - 16);

    ctx.font = '400 18px Inter, -apple-system, system-ui, sans-serif';
    ctx.fillStyle = '#888';
    ctx.fillText('Get ready!', W / 2, H / 2 + 24);
    ctx.textAlign = 'start';
    ctx.restore();
  }

  spawnDestroyParticles(word: FallingWord) {
    const text = word.entry.text;
    let xOff = word.x + PADDING_X;
    const yOff = word.y + PADDING_Y;
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      this.particles.push({
        x: xOff,
        y: yOff,
        vx: (Math.random() - 0.5) * 200,
        vy: -Math.random() * 150 - 50,
        char,
        opacity: 1,
        font: FONT,
        size: 20,
        rotation: 0,
        vr: (Math.random() - 0.5) * 10,
      });
      xOff += this.ctx.measureText(char).width + 1;
    }
  }

  clear(frozen = false) {
    this.ctx.clearRect(0, 0, this.width, this.height);
    this.ctx.fillStyle = C_BG;
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Subtle grid lines
    this.ctx.strokeStyle = 'rgba(0,0,0,0.02)';
    this.ctx.lineWidth = 1;
    for (let y = 0; y < this.height; y += 40) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.width, y);
      this.ctx.stroke();
    }

    // Danger zone at bottom
    const gradient = this.ctx.createLinearGradient(0, this.height - 60, 0, this.height);
    gradient.addColorStop(0, 'rgba(239,68,68,0)');
    gradient.addColorStop(1, 'rgba(239,68,68,0.05)');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, this.height - 60, this.width, 60);

    // Shield flash
    if (this.shieldFlash > 0) {
      this.ctx.fillStyle = `rgba(99,102,241,${this.shieldFlash * 0.15})`;
      this.ctx.fillRect(0, 0, this.width, this.height);
      this.shieldFlash = Math.max(0, this.shieldFlash - 0.02);
    }

    // Freeze overlay
    if (frozen) {
      this.ctx.fillStyle = 'rgba(99,102,241,0.03)';
      this.ctx.fillRect(0, 0, this.width, this.height);
    }

    // Screen flash (power-ups etc.)
    if (this.screenFlashOpacity > 0) {
      this.ctx.globalAlpha = this.screenFlashOpacity;
      this.ctx.fillStyle = this.screenFlashColor;
      this.ctx.fillRect(0, 0, this.width, this.height);
      this.ctx.globalAlpha = 1;
      this.screenFlashOpacity = Math.max(0, this.screenFlashOpacity - 0.04);
    }
  }

  drawWords(words: FallingWord[], activeTarget: FallingWord | null) {
    for (const word of words) {
      this.drawWord(word, word === activeTarget);
    }
  }

  drawWord(word: FallingWord, isTarget: boolean) {
    const ctx = this.ctx;
    const text = word.entry.text;
    const typed = word.typed;

    // Glow effect for target word
    if (isTarget && typed > 0) {
      ctx.shadowColor = 'rgba(99,102,241,0.3)';
      ctx.shadowBlur = 12;
    }

    // Background pill
    ctx.fillStyle = word.destroying ? `rgba(99,102,241,${word.opacity * 0.15})` : (isTarget ? C_WORD_BG_TARGET : C_WORD_BG);
    ctx.beginPath();
    ctx.roundRect(word.x, word.y, word.width, word.height, 8);
    ctx.fill();

    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;

    // Draw characters
    const textY = word.y + PADDING_Y;
    let textX = word.x + PADDING_X;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (i < typed) {
        ctx.font = FONT_TYPED;
        ctx.fillStyle = `rgba(99,102,241,${word.opacity})`;
      } else if (word.destroying) {
        ctx.font = FONT;
        ctx.fillStyle = `rgba(99,102,241,${word.opacity * 0.5})`;
      } else {
        ctx.font = FONT;
        ctx.fillStyle = `rgba(51,51,51,${word.opacity * (isTarget ? 1 : 0.7)})`;
      }
      ctx.fillText(char, textX, textY + 20);
      textX += ctx.measureText(char).width + 0.5;
    }

    // Underline typed portion
    if (typed > 0 && !word.destroying) {
      ctx.strokeStyle = `rgba(99,102,241,${word.opacity * 0.6})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(word.x + PADDING_X, textY + 24);
      let ulWidth = 0;
      ctx.font = FONT_TYPED;
      for (let i = 0; i < typed; i++) {
        ulWidth += ctx.measureText(text[i]).width + 0.5;
      }
      ctx.lineTo(word.x + PADDING_X + ulWidth, textY + 24);
      ctx.stroke();
    }
  }

  updateAndDrawParticles(dt: number) {
    const ctx = this.ctx;
    this.particles = this.particles.filter(p => {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 300 * dt; // gravity
      p.opacity -= dt * 1.2;
      p.rotation += p.vr * dt;

      if (p.opacity <= 0) return false;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.globalAlpha = p.opacity;
      ctx.font = p.font;
      ctx.fillStyle = C_DESTROYING;
      ctx.fillText(p.char, 0, 0);
      ctx.restore();
      ctx.globalAlpha = 1;

      return true;
    });
  }

  drawCombo() {
    if (this.comboOpacity <= 0) return;
    const ctx = this.ctx;
    ctx.save();
    ctx.globalAlpha = this.comboOpacity;
    ctx.font = '700 24px Inter, -apple-system, system-ui, sans-serif';
    ctx.fillStyle = '#6366f1';
    ctx.textAlign = 'center';
    ctx.fillText(this.comboText, this.width / 2, 100);
    ctx.textAlign = 'start';
    ctx.restore();
    this.comboOpacity = Math.max(0, this.comboOpacity - 0.015);
  }
}
