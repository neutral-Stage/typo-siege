import type { FallingWord } from './entities';

const FONT = '500 20px Inter, -apple-system, system-ui, sans-serif';
const FONT_TYPED = '600 20px Inter, -apple-system, system-ui, sans-serif';
const LINE_HEIGHT = 26;
const PADDING_X = 16;
const PADDING_Y = 10;

// Colors — dark theme
const C_BG = '#0f0f13';
const C_WORD_BG = 'rgba(255,255,255,0.06)';
const C_WORD_BG_TARGET = 'rgba(99,102,241,0.12)';
const C_TYPED = '#67e8f9';
const C_UNTYPED = 'rgba(255,255,255,0.7)';
const C_DESTROYING = '#a5b4fc';

export type DestroyEffect = 'normal' | 'fire' | 'lightning' | 'shield' | 'chain';

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
  color: string;
  effect: DestroyEffect;
  life: number;
  maxLife: number;
  scale: number;
  // Fire-specific
  glowSize?: number;
  // Lightning-specific
  boltPoints?: { x: number; y: number }[];
}

interface RingEffect {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  opacity: number;
  color: string;
  lineWidth: number;
}

interface BoltEffect {
  points: { x: number; y: number }[];
  opacity: number;
  color: string;
}

export class Renderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private dpr: number;
  private particles: Particle[] = [];
  private rings: RingEffect[] = [];
  private bolts: BoltEffect[] = [];
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
    let alpha: number;
    if (progress > 0.5) {
      alpha = (1 - progress) * 2;
    } else {
      alpha = progress * 2;
    }

    const ctx = this.ctx;
    const W = this.width;
    const H = this.height;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#0f0f13';
    ctx.fillRect(0, 0, W, H);

    ctx.globalAlpha = alpha;
    ctx.font = '700 72px Inter, -apple-system, system-ui, sans-serif';
    ctx.fillStyle = '#a5b4fc';
    ctx.textAlign = 'center';
    ctx.fillText(`WAVE ${wave}`, W / 2, H / 2 - 16);

    ctx.font = '400 18px Inter, -apple-system, system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.fillText('Get ready!', W / 2, H / 2 + 24);
    ctx.textAlign = 'start';
    ctx.restore();
  }

  // ─── Unique destroy effects ───

  /** Normal typing destroy — letters scatter with gravity */
  spawnDestroyParticles(word: FallingWord) {
    this.spawnEffectParticles(word, 'normal');
  }

  /** Fire — letters burn upward with orange/red glow, embers */
  spawnFireParticles(word: FallingWord) {
    this.spawnEffectParticles(word, 'fire');
    // Add extra ember particles
    const cx = word.x + word.width / 2;
    const cy = word.y + word.height / 2;
    for (let i = 0; i < 12; i++) {
      this.particles.push({
        x: cx + (Math.random() - 0.5) * word.width,
        y: cy,
        vx: (Math.random() - 0.5) * 80,
        vy: -Math.random() * 200 - 100,
        char: '•',
        opacity: 1,
        font: `${12 + Math.random() * 8}px Inter`,
        size: 4,
        rotation: 0,
        vr: 0,
        color: Math.random() > 0.5 ? '#f97316' : '#ef4444',
        effect: 'fire',
        life: 1,
        maxLife: 1,
        scale: 1,
        glowSize: 6,
      });
    }
  }

  /** Lightning — electric flash, letters shatter outward with electric bolts */
  spawnLightningParticles(word: FallingWord) {
    this.spawnEffectParticles(word, 'lightning');
    // Add lightning bolt from top to word
    const cx = word.x + word.width / 2;
    const cy = word.y + word.height / 2;
    const points: { x: number; y: number }[] = [{ x: cx, y: 0 }];
    let bx = cx;
    let by = 0;
    const steps = 8;
    for (let i = 0; i < steps; i++) {
      bx += (Math.random() - 0.5) * 60;
      by += cy / steps;
      points.push({ x: bx, y: by });
    }
    this.bolts.push({ points, opacity: 1, color: '#fbbf24' });
  }

  /** Shield — letters crystallize and shatter with ice-like fragments */
  spawnShieldParticles(word: FallingWord) {
    this.spawnEffectParticles(word, 'shield');
    // Expanding ring effect
    const cx = word.x + word.width / 2;
    const cy = word.y + word.height / 2;
    this.rings.push({
      x: cx, y: cy,
      radius: 10,
      maxRadius: 120,
      opacity: 0.8,
      color: '#818cf8',
      lineWidth: 3,
    });
  }

  /** Chain — letters explode outward in a chain reaction wave */
  spawnChainParticles(word: FallingWord) {
    this.spawnEffectParticles(word, 'chain');
    const cx = word.x + word.width / 2;
    const cy = word.y + word.height / 2;
    // Multiple expanding rings
    for (let i = 0; i < 3; i++) {
      this.rings.push({
        x: cx, y: cy,
        radius: 5 + i * 10,
        maxRadius: 80 + i * 60,
        opacity: 0.7 - i * 0.15,
        color: i === 0 ? '#f97316' : i === 1 ? '#fb923c' : '#fbbf24',
        lineWidth: 3 - i * 0.5,
      });
    }
  }

  /** Core particle spawner with effect-specific behavior */
  private spawnEffectParticles(word: FallingWord, effect: DestroyEffect) {
    const text = word.entry.text;
    const cx = word.x + word.width / 2;
    const cy = word.y + word.height / 2;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const charX = word.x + PADDING_X + i * (this.ctx.measureText(char).width + 0.5);
      const charY = word.y + PADDING_Y;

      let vx: number, vy: number, color: string, maxLife: number;

      switch (effect) {
        case 'fire':
          // Burn upward, spread, orange/red
          vx = (Math.random() - 0.5) * 160;
          vy = -Math.random() * 250 - 80;
          color = ['#ef4444', '#f97316', '#fbbf24', '#fb923c'][Math.floor(Math.random() * 4)];
          maxLife = 0.8;
          break;
        case 'lightning':
          // Shatter outward from center, electric yellow
          vx = (charX - cx) * (3 + Math.random() * 2);
          vy = (charY - cy) * (3 + Math.random() * 2) - Math.random() * 60;
          color = ['#fbbf24', '#fde68a', '#fef3c7'][Math.floor(Math.random() * 3)];
          maxLife = 0.5;
          break;
        case 'shield':
          // Freeze in place then shatter outward, ice blue
          vx = (Math.random() - 0.5) * 300;
          vy = (Math.random() - 0.5) * 300;
          color = ['#818cf8', '#a5b4fc', '#c7d2fe', '#67e8f9'][Math.floor(Math.random() * 4)];
          maxLife = 0.7;
          break;
        case 'chain':
          // Explode outward with orange shockwave
          const angle = Math.atan2(charY - cy, charX - cx);
          const speed = 200 + Math.random() * 150;
          vx = Math.cos(angle) * speed;
          vy = Math.sin(angle) * speed;
          color = ['#f97316', '#fb923c', '#ef4444', '#fbbf24'][Math.floor(Math.random() * 4)];
          maxLife = 0.6;
          break;
        default:
          // Normal — scatter with gravity, indigo
          vx = (Math.random() - 0.5) * 200;
          vy = -Math.random() * 150 - 50;
          color = C_DESTROYING;
          maxLife = 0.7;
          break;
      }

      this.particles.push({
        x: charX,
        y: charY,
        vx,
        vy,
        char,
        opacity: 1,
        font: effect === 'lightning' ? FONT_TYPED : FONT,
        size: 20,
        rotation: 0,
        vr: effect === 'shield' ? 0 : (Math.random() - 0.5) * 10,
        color,
        effect,
        life: maxLife,
        maxLife,
        scale: effect === 'shield' ? 1.3 : 1,
        glowSize: effect === 'fire' ? 8 : effect === 'lightning' ? 6 : 0,
      });
    }
  }

  clear(frozen = false) {
    this.ctx.clearRect(0, 0, this.width, this.height);
    this.ctx.fillStyle = C_BG;
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Subtle grid lines
    this.ctx.strokeStyle = 'rgba(255,255,255,0.02)';
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

    // Screen flash
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

    if (isTarget && typed > 0) {
      ctx.shadowColor = 'rgba(99,102,241,0.3)';
      ctx.shadowBlur = 12;
    }

    ctx.fillStyle = word.destroying ? `rgba(99,102,241,${word.opacity * 0.15})` : (isTarget ? C_WORD_BG_TARGET : C_WORD_BG);
    ctx.beginPath();
    ctx.roundRect(word.x, word.y, word.width, word.height, 8);
    ctx.fill();

    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;

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
        ctx.fillStyle = `rgba(255,255,255,${word.opacity * (isTarget ? 0.85 : 0.5)})`;
      }
      ctx.fillText(char, textX, textY + 20);
      textX += ctx.measureText(char).width + 0.5;
    }

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

    // Draw rings (shield/chain)
    this.rings = this.rings.filter(r => {
      r.radius += (r.maxRadius - r.radius) * dt * 4;
      r.opacity -= dt * 2;

      if (r.opacity <= 0) return false;

      ctx.save();
      ctx.globalAlpha = r.opacity;
      ctx.strokeStyle = r.color;
      ctx.lineWidth = r.lineWidth;
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      return true;
    });

    // Draw lightning bolts
    this.bolts = this.bolts.filter(b => {
      b.opacity -= dt * 3;
      if (b.opacity <= 0) return false;

      ctx.save();
      ctx.globalAlpha = b.opacity;
      ctx.strokeStyle = b.color;
      ctx.lineWidth = 3;
      ctx.shadowColor = b.color;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.moveTo(b.points[0].x, b.points[0].y);
      for (let i = 1; i < b.points.length; i++) {
        ctx.lineTo(b.points[i].x, b.points[i].y);
      }
      ctx.stroke();
      // Draw again for glow
      ctx.lineWidth = 1;
      ctx.globalAlpha = b.opacity * 0.5;
      ctx.stroke();
      ctx.restore();

      return true;
    });

    // Draw particles
    this.particles = this.particles.filter(p => {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      p.opacity = Math.max(0, p.life / p.maxLife);
      p.rotation += p.vr * dt;

      // Effect-specific physics
      switch (p.effect) {
        case 'fire':
          p.vy -= 200 * dt; // Float upward (reverse gravity)
          p.vx *= 0.98; // Slow drift
          p.scale = 0.8 + p.opacity * 0.4;
          break;
        case 'lightning':
          p.vy += 400 * dt; // Heavy gravity - shatter down
          p.scale = 1 + (1 - p.opacity) * 0.3; // Expand as fading
          break;
        case 'shield':
          p.vy += 100 * dt; // Light gravity
          p.scale = 1.3 * p.opacity; // Shrink
          break;
        case 'chain':
          p.vy += 200 * dt; // Medium gravity
          p.vx *= 0.96; // Drag
          p.scale = 1;
          break;
        default:
          p.vy += 300 * dt; // Normal gravity
          break;
      }

      if (p.life <= 0) return false;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.scale(p.scale, p.scale);
      ctx.globalAlpha = p.opacity;

      // Glow for fire/lightning particles
      if (p.glowSize && p.glowSize > 0) {
        ctx.shadowColor = p.color;
        ctx.shadowBlur = p.glowSize;
      }

      ctx.font = p.font;
      ctx.fillStyle = p.color;
      ctx.fillText(p.char, 0, 0);
      ctx.restore();

      return true;
    });

    // Reset context state
    ctx.globalAlpha = 1;
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
  }

  drawCombo() {
    if (this.comboOpacity <= 0) return;
    const ctx = this.ctx;
    ctx.save();
    ctx.globalAlpha = this.comboOpacity;
    ctx.font = '700 24px Inter, -apple-system, system-ui, sans-serif';
    ctx.fillStyle = '#a5b4fc';
    ctx.textAlign = 'center';
    ctx.fillText(this.comboText, this.width / 2, 100);
    ctx.textAlign = 'start';
    ctx.restore();
    this.comboOpacity = Math.max(0, this.comboOpacity - 0.015);
  }
}
