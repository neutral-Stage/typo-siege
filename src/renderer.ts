import { getFont, getFontSize } from './entities';
import type { FallingWord } from './entities';

const PADDING_X = 14;
const PADDING_Y = 8;

// Colors
const C_BG = '#0f0f13';
const C_WORD_BG = 'rgba(255,255,255,0.04)';
const C_WORD_BG_TARGET = 'rgba(99,102,241,0.1)';
const C_DESTROYING = '#a5b4fc';

export type DestroyEffect = 'normal' | 'fire' | 'lightning' | 'shield' | 'chain';

interface Particle {
  x: number; y: number; vx: number; vy: number;
  char: string; opacity: number; font: string; size: number;
  rotation: number; vr: number; color: string; effect: DestroyEffect;
  life: number; maxLife: number; scale: number; glowSize?: number;
}

interface RingEffect {
  x: number; y: number; radius: number; maxRadius: number;
  opacity: number; color: string; lineWidth: number;
}

interface BoltEffect {
  points: { x: number; y: number }[]; opacity: number; color: string;
}

interface LaserState {
  fromX: number; fromY: number; toX: number; toY: number;
  opacity: number; typed: number; total: number;
}

export class Renderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private dpr: number;
  private particles: Particle[] = [];
  private rings: RingEffect[] = [];
  private bolts: BoltEffect[] = [];
  private activeLaser: LaserState | null = null;
  private shieldFlash = 0;
  private comboText = '';
  private comboOpacity = 0;
  private screenFlashColor = '';
  private screenFlashOpacity = 0;
  private time = 0;

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

  showCombo(combo: number) { this.comboText = `COMBO ×${combo}`; this.comboOpacity = 1; }
  showShieldFlash() { this.shieldFlash = 1; }
  showScreenFlash(color: string) { this.screenFlashColor = color; this.screenFlashOpacity = 0.35; }

  drawWaveTransition(wave: number, progress: number) {
    let alpha = progress > 0.5 ? (1 - progress) * 2 : progress * 2;
    const ctx = this.ctx;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#0f0f13';
    ctx.fillRect(0, 0, this.width, this.height);
    ctx.font = '700 72px Inter, -apple-system, system-ui, sans-serif';
    ctx.fillStyle = '#a5b4fc';
    ctx.textAlign = 'center';
    ctx.fillText(`WAVE ${wave}`, this.width / 2, this.height / 2 - 16);
    ctx.font = '400 18px Inter, -apple-system, system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.fillText('Get ready!', this.width / 2, this.height / 2 + 24);
    ctx.textAlign = 'start';
    ctx.restore();
  }

  // ─── Destroy effects ───
  spawnDestroyParticles(word: FallingWord) { this.spawnEffectParticles(word, 'normal'); }

  spawnFireParticles(word: FallingWord) {
    this.spawnEffectParticles(word, 'fire');
    const cx = word.x + word.width / 2, cy = word.y + word.height / 2;
    for (let i = 0; i < 16; i++) {
      this.particles.push({
        x: cx + (Math.random() - 0.5) * word.width, y: cy,
        vx: (Math.random() - 0.5) * 100, vy: -Math.random() * 250 - 80,
        char: ['🔥','✦','★','●'][i % 4], opacity: 1,
        font: `${10 + Math.random() * 10}px Inter`, size: 6,
        rotation: 0, vr: (Math.random() - 0.5) * 4,
        color: ['#ef4444','#f97316','#fbbf24','#fb923c'][i % 4],
        effect: 'fire', life: 1.2, maxLife: 1.2, scale: 1, glowSize: 10,
      });
    }
  }

  spawnLightningParticles(word: FallingWord) {
    this.spawnEffectParticles(word, 'lightning');
    const cx = word.x + word.width / 2, cy = word.y + word.height / 2;
    // Main bolt
    const pts: { x: number; y: number }[] = [{ x: cx, y: 0 }];
    let bx = cx, by = 0;
    for (let i = 0; i < 10; i++) { bx += (Math.random() - 0.5) * 70; by += cy / 10; pts.push({ x: bx, y: by }); }
    this.bolts.push({ points: pts, opacity: 1, color: '#fbbf24' });
    // Secondary fork
    if (pts.length > 4) {
      const fork: { x: number; y: number }[] = [pts[4]];
      let fx = pts[4].x, fy = pts[4].y;
      for (let i = 0; i < 5; i++) { fx += (Math.random() - 0.3) * 50; fy += 30; fork.push({ x: fx, y: fy }); }
      this.bolts.push({ points: fork, opacity: 0.7, color: '#fde68a' });
    }
    // Spark particles
    for (let i = 0; i < 8; i++) {
      this.particles.push({
        x: cx + (Math.random() - 0.5) * word.width, y: cy + (Math.random() - 0.5) * 10,
        vx: (Math.random() - 0.5) * 200, vy: (Math.random() - 0.5) * 200,
        char: '⚡', opacity: 1, font: '14px Inter', size: 14,
        rotation: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 8,
        color: '#fde68a', effect: 'lightning', life: 0.5, maxLife: 0.5, scale: 1, glowSize: 8,
      });
    }
  }

  spawnShieldParticles(word: FallingWord) {
    this.spawnEffectParticles(word, 'shield');
    const cx = word.x + word.width / 2, cy = word.y + word.height / 2;
    // Multiple expanding ice rings
    for (let i = 0; i < 4; i++) {
      this.rings.push({
        x: cx, y: cy, radius: 5, maxRadius: 100 + i * 40,
        opacity: 0.8 - i * 0.15, color: ['#818cf8','#a5b4fc','#c7d2fe','#67e8f9'][i], lineWidth: 3 - i * 0.5,
      });
    }
    // Ice shards
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI * 2 / 6) * i;
      this.particles.push({
        x: cx, y: cy, vx: Math.cos(angle) * 180, vy: Math.sin(angle) * 180,
        char: '❄', opacity: 1, font: '16px Inter', size: 16,
        rotation: angle, vr: 3, color: '#c7d2fe',
        effect: 'shield', life: 0.8, maxLife: 0.8, scale: 1, glowSize: 6,
      });
    }
  }

  spawnChainParticles(word: FallingWord) {
    this.spawnEffectParticles(word, 'chain');
    const cx = word.x + word.width / 2, cy = word.y + word.height / 2;
    for (let i = 0; i < 3; i++) {
      this.rings.push({
        x: cx, y: cy, radius: 5 + i * 10, maxRadius: 80 + i * 60,
        opacity: 0.7 - i * 0.15, color: ['#f97316','#fb923c','#fbbf24'][i], lineWidth: 3 - i * 0.5,
      });
    }
  }

  private spawnEffectParticles(word: FallingWord, effect: DestroyEffect) {
    const text = word.entry.text;
    const cx = word.x + word.width / 2, cy = word.y + word.height / 2;
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const charX = word.x + PADDING_X + i * (this.ctx.measureText(char).width + 0.5);
      const charY = word.y + PADDING_Y;
      let vx: number, vy: number, color: string, maxLife: number;
      switch (effect) {
        case 'fire':
          vx = (Math.random() - 0.5) * 160; vy = -Math.random() * 250 - 80;
          color = ['#ef4444','#f97316','#fbbf24','#fb923c'][i % 4]; maxLife = 0.8; break;
        case 'lightning':
          vx = (charX - cx) * (3 + Math.random() * 2); vy = (charY - cy) * (3 + Math.random() * 2) - Math.random() * 60;
          color = ['#fbbf24','#fde68a','#fef3c7'][i % 3]; maxLife = 0.5; break;
        case 'shield':
          vx = (Math.random() - 0.5) * 300; vy = (Math.random() - 0.5) * 300;
          color = ['#818cf8','#a5b4fc','#c7d2fe','#67e8f9'][i % 4]; maxLife = 0.7; break;
        case 'chain':
          const a = Math.atan2(charY - cy, charX - cx); const s = 200 + Math.random() * 150;
          vx = Math.cos(a) * s; vy = Math.sin(a) * s;
          color = ['#f97316','#fb923c','#ef4444','#fbbf24'][i % 4]; maxLife = 0.6; break;
        default:
          vx = (Math.random() - 0.5) * 200; vy = -Math.random() * 150 - 50;
          color = C_DESTROYING; maxLife = 0.7; break;
      }
      this.particles.push({
        x: charX, y: charY, vx, vy, char, opacity: 1,
        font: effect === 'lightning' ? getFont(this.width, 600) : getFont(this.width), size: getFontSize(this.width),
        rotation: 0, vr: effect === 'shield' ? 0 : (Math.random() - 0.5) * 10,
        color, effect, life: maxLife, maxLife,
        scale: effect === 'shield' ? 1.3 : 1,
        glowSize: effect === 'fire' ? 8 : effect === 'lightning' ? 6 : 0,
      });
    }
  }

  // ─── Main render ───

  clear(frozen = false) {
    this.time += 0.016;
    const ctx = this.ctx;
    const W = this.width, H = this.height;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = C_BG;
    ctx.fillRect(0, 0, W, H);

    // Subtle grid
    ctx.strokeStyle = 'rgba(255,255,255,0.015)';
    ctx.lineWidth = 1;
    for (let y = 0; y < H; y += 40) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }

    // ─── Tower defense base ───
    this.drawTowers(W, H);

    // Danger zone glow
    const dg = ctx.createLinearGradient(0, H - 70, 0, H);
    dg.addColorStop(0, 'rgba(239,68,68,0)');
    dg.addColorStop(0.6, 'rgba(239,68,68,0.02)');
    dg.addColorStop(1, `rgba(239,68,68,${0.06 + Math.sin(this.time * 2) * 0.02})`);
    ctx.fillStyle = dg;
    ctx.fillRect(0, H - 70, W, 70);

    if (this.shieldFlash > 0) {
      ctx.fillStyle = `rgba(99,102,241,${this.shieldFlash * 0.15})`;
      ctx.fillRect(0, 0, W, H);
      this.shieldFlash = Math.max(0, this.shieldFlash - 0.02);
    }
    if (frozen) { ctx.fillStyle = 'rgba(99,102,241,0.03)'; ctx.fillRect(0, 0, W, H); }
    if (this.screenFlashOpacity > 0) {
      ctx.globalAlpha = this.screenFlashOpacity;
      ctx.fillStyle = this.screenFlashColor;
      ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = 1;
      this.screenFlashOpacity = Math.max(0, this.screenFlashOpacity - 0.04);
    }
  }

  private drawTowers(W: number, H: number) {
    const ctx = this.ctx;
    const count = Math.max(3, Math.floor(W / 180));
    const spacing = W / count;
    const tW = 36, tH = 52, baseY = H - 6;

    for (let i = 0; i < count; i++) {
      const cx = spacing * i + spacing / 2;
      const x = cx - tW / 2, y = baseY - tH;

      // Tower shadow
      ctx.fillStyle = 'rgba(0,0,0,0.15)';
      ctx.beginPath();
      ctx.ellipse(cx, baseY + 2, tW / 2 + 4, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      // Tower base (trapezoid)
      const baseGrad = ctx.createLinearGradient(0, y + 20, 0, baseY);
      baseGrad.addColorStop(0, 'rgba(99,102,241,0.18)');
      baseGrad.addColorStop(1, 'rgba(99,102,241,0.08)');
      ctx.fillStyle = baseGrad;
      ctx.beginPath();
      ctx.moveTo(x - 10, baseY);
      ctx.lineTo(x + tW + 10, baseY);
      ctx.lineTo(x + tW + 2, y + 18);
      ctx.lineTo(x - 2, y + 18);
      ctx.closePath();
      ctx.fill();

      // Tower body
      const bodyGrad = ctx.createLinearGradient(0, y, 0, y + 20);
      bodyGrad.addColorStop(0, 'rgba(129,140,248,0.25)');
      bodyGrad.addColorStop(1, 'rgba(99,102,241,0.15)');
      ctx.fillStyle = bodyGrad;
      ctx.fillRect(x + 3, y, tW - 6, 20);

      // Crenellations
      const crenW = (tW - 6) / 5;
      for (let c = 0; c < 5; c++) {
        if (c % 2 === 0) {
          ctx.fillStyle = `rgba(129,140,248,${0.3 + Math.sin(this.time + i + c) * 0.05})`;
          ctx.fillRect(x + 3 + c * crenW, y - 7, crenW - 1, 7);
        }
      }

      // Window glow (pulsing)
      const pulse = 0.4 + Math.sin(this.time * 1.8 + i * 1.3) * 0.25;
      ctx.shadowColor = 'rgba(103,232,249,0.5)';
      ctx.shadowBlur = 10 * pulse;
      ctx.fillStyle = `rgba(103,232,249,${pulse * 0.5})`;
      ctx.beginPath();
      ctx.arc(cx, y + 10, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.shadowColor = 'transparent';

      // Cannon barrel (animated aim)
      ctx.fillStyle = 'rgba(165,180,252,0.35)';
      ctx.fillRect(cx - 2, y - 14, 4, 14);

      // Cannon tip glow
      ctx.fillStyle = `rgba(103,232,249,${pulse * 0.6})`;
      ctx.beginPath();
      ctx.arc(cx, y - 14, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Connecting wall with stone texture feel
    const wallY = baseY - 18;
    const wallGrad = ctx.createLinearGradient(0, wallY, 0, baseY);
    wallGrad.addColorStop(0, 'rgba(99,102,241,0.06)');
    wallGrad.addColorStop(0.5, 'rgba(99,102,241,0.10)');
    wallGrad.addColorStop(1, 'rgba(99,102,241,0.04)');
    ctx.fillStyle = wallGrad;
    ctx.fillRect(0, wallY, W, 18);

    // Wall top edge (battlement line)
    ctx.strokeStyle = 'rgba(129,140,248,0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, wallY);
    ctx.lineTo(W, wallY);
    ctx.stroke();

    // Stone blocks pattern on wall
    for (let bx = 0; bx < W; bx += 24) {
      ctx.strokeStyle = 'rgba(255,255,255,0.02)';
      ctx.beginPath();
      ctx.moveTo(bx, wallY);
      ctx.lineTo(bx, baseY);
      ctx.stroke();
    }
  }

  drawWords(words: FallingWord[], activeTarget: FallingWord | null) {
    const ctx = this.ctx;
    const W = this.width, H = this.height;

    // ─── Energy beam from tower to target ───
    if (activeTarget && activeTarget.typed > 0 && !activeTarget.destroying) {
      const towerCount = Math.max(3, Math.floor(W / 180));
      const spacing = W / towerCount;
      let closestX = spacing / 2, minD = Infinity;
      for (let i = 0; i < towerCount; i++) {
        const tx = spacing * i + spacing / 2;
        const d = Math.abs(tx - (activeTarget.x + activeTarget.width / 2));
        if (d < minD) { minD = d; closestX = tx; }
      }

      const fromX = closestX, fromY = H - 70;
      const toX = activeTarget.x + activeTarget.width / 2;
      const toY = activeTarget.y + activeTarget.height / 2;
      const progress = activeTarget.typed / activeTarget.entry.text.length;
      const beamPulse = 0.7 + Math.sin(this.time * 8) * 0.3;

      // Outer glow beam
      ctx.save();
      ctx.globalAlpha = 0.15 * beamPulse;
      ctx.strokeStyle = '#6366f1';
      ctx.lineWidth = 12;
      ctx.shadowColor = '#6366f1';
      ctx.shadowBlur = 30;
      ctx.beginPath();
      ctx.moveTo(fromX, fromY);
      ctx.lineTo(toX, toY);
      ctx.stroke();
      ctx.restore();

      // Mid beam
      ctx.save();
      ctx.globalAlpha = 0.35 * beamPulse;
      ctx.strokeStyle = '#818cf8';
      ctx.lineWidth = 4;
      ctx.shadowColor = '#818cf8';
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.moveTo(fromX, fromY);
      ctx.lineTo(toX, toY);
      ctx.stroke();
      ctx.restore();

      // Core beam (bright white-cyan)
      ctx.save();
      ctx.globalAlpha = 0.7 * beamPulse;
      ctx.strokeStyle = '#c7d2fe';
      ctx.lineWidth = 1.5;
      ctx.shadowColor = '#a5b4fc';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.moveTo(fromX, fromY);
      ctx.lineTo(toX, toY);
      ctx.stroke();
      ctx.restore();

      // Impact glow on target
      ctx.save();
      const impactR = 8 + progress * 12 + Math.sin(this.time * 6) * 3;
      const impactGrad = ctx.createRadialGradient(toX, toY, 0, toX, toY, impactR);
      impactGrad.addColorStop(0, `rgba(103,232,249,${0.4 * beamPulse})`);
      impactGrad.addColorStop(0.5, `rgba(99,102,241,${0.15 * beamPulse})`);
      impactGrad.addColorStop(1, 'rgba(99,102,241,0)');
      ctx.fillStyle = impactGrad;
      ctx.beginPath();
      ctx.arc(toX, toY, impactR, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Tower muzzle flash
      ctx.save();
      const mfR = 5 + Math.sin(this.time * 10) * 2;
      const mfGrad = ctx.createRadialGradient(fromX, fromY, 0, fromX, fromY, mfR * 3);
      mfGrad.addColorStop(0, `rgba(103,232,249,${0.5 * beamPulse})`);
      mfGrad.addColorStop(1, 'rgba(103,232,249,0)');
      ctx.fillStyle = mfGrad;
      ctx.beginPath();
      ctx.arc(fromX, fromY, mfR * 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Energy particles along beam
      if (Math.random() < 0.4) {
        const t = Math.random();
        const px = fromX + (toX - fromX) * t;
        const py = fromY + (toY - fromY) * t;
        this.particles.push({
          x: px + (Math.random() - 0.5) * 8, y: py + (Math.random() - 0.5) * 8,
          vx: (Math.random() - 0.5) * 30, vy: (Math.random() - 0.5) * 30,
          char: '·', opacity: 0.8, font: '8px Inter', size: 3,
          rotation: 0, vr: 0, color: '#a5b4fc',
          effect: 'normal', life: 0.3, maxLife: 0.3, scale: 1,
        });
      }
    }

    for (const word of words) {
      this.drawWord(word, word === activeTarget);
    }
  }

  drawWord(word: FallingWord, isTarget: boolean) {
    const ctx = this.ctx;
    const text = word.entry.text;
    const typed = word.typed;
    const isBoss = word.entry.difficulty >= 5;
    const bobY = Math.sin(this.time * 2 + word.id * 0.7) * 2;

    ctx.save();
    ctx.translate(0, bobY);

    // ─── Target tracking glow ───
    if (isTarget && typed > 0) {
      ctx.shadowColor = isBoss ? 'rgba(239,68,68,0.5)' : 'rgba(99,102,241,0.4)';
      ctx.shadowBlur = 20;
    }

    // ─── Enemy body ───
    let bgColor: string;
    if (word.destroying) {
      bgColor = `rgba(99,102,241,${word.opacity * 0.1})`;
    } else if (isBoss) {
      const bossPulse = 0.12 + Math.sin(this.time * 3) * 0.04;
      bgColor = `rgba(239,68,68,${bossPulse})`;
    } else if (isTarget) {
      bgColor = C_WORD_BG_TARGET;
    } else {
      bgColor = C_WORD_BG;
    }

    ctx.fillStyle = bgColor;
    ctx.beginPath();
    ctx.roundRect(word.x, word.y, word.width, word.height, isBoss ? 14 : 10);
    ctx.fill();

    // Border with animated dash for targets
    if (!word.destroying) {
      if (isTarget && typed > 0) {
        ctx.strokeStyle = isBoss
          ? `rgba(239,68,68,${0.5 + Math.sin(this.time * 6) * 0.2})`
          : `rgba(99,102,241,${0.4 + Math.sin(this.time * 6) * 0.15})`;
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.lineDashOffset = -this.time * 30;
        ctx.stroke();
        ctx.setLineDash([]);
      } else if (isBoss) {
        ctx.strokeStyle = `rgba(239,68,68,${0.25 + Math.sin(this.time * 4) * 0.1})`;
        ctx.lineWidth = 2;
        ctx.stroke();
      } else {
        ctx.strokeStyle = 'rgba(255,255,255,0.04)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }

    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;

    // ─── Enemy face ───
    if (!word.destroying) {
      this.drawEnemyFace(word, isTarget, isBoss);
    }

    // ─── Boss crown ───
    if (isBoss && !word.destroying) {
      ctx.font = '16px sans-serif';
      ctx.textAlign = 'center';
      const crownBob = Math.sin(this.time * 3) * 2;
      ctx.fillText('👑', word.x + word.width / 2, word.y - 6 + crownBob);
      ctx.textAlign = 'start';
    }

    // ─── Health bar ───
    if (!word.destroying && text.length > 2) {
      const hbX = word.x + 4, hbY = word.y + word.height - 4;
      const hbW = word.width - 8, hbH = 3;
      const progress = typed / text.length;

      ctx.fillStyle = 'rgba(255,255,255,0.05)';
      ctx.beginPath();
      ctx.roundRect(hbX, hbY, hbW, hbH, 1.5);
      ctx.fill();

      if (progress > 0) {
        const r = Math.floor(239 * (1 - progress));
        const g = Math.floor(68 + 180 * progress);
        ctx.fillStyle = `rgba(${r},${g},100,0.7)`;
        ctx.beginPath();
        ctx.roundRect(hbX, hbY, hbW * progress, hbH, 1.5);
        ctx.fill();
      }
    }

    // ─── Draw characters ───
    const fs = getFontSize(this.width);
    const textY = word.y + PADDING_Y;
    let textX = word.x + PADDING_X;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (i < typed) {
        ctx.font = isBoss ? `700 ${getFontSize(this.width)}px Inter, sans-serif` : getFont(this.width, 600);
        ctx.fillStyle = isBoss ? `rgba(252,165,165,${word.opacity})` : `rgba(99,102,241,${word.opacity})`;
        // Typed char glow
        ctx.shadowColor = isBoss ? 'rgba(239,68,68,0.3)' : 'rgba(99,102,241,0.3)';
        ctx.shadowBlur = 4;
      } else if (word.destroying) {
        ctx.font = getFont(this.width);
        ctx.fillStyle = `rgba(99,102,241,${word.opacity * 0.4})`;
        ctx.shadowBlur = 0;
      } else {
        ctx.font = getFont(this.width);
        ctx.fillStyle = isBoss
          ? `rgba(252,165,165,${word.opacity * 0.75})`
          : `rgba(255,255,255,${word.opacity * (isTarget ? 0.8 : 0.45)})`;
        ctx.shadowBlur = 0;
      }
      ctx.fillText(char, textX, textY + fs);
      ctx.shadowBlur = 0;
      textX += ctx.measureText(char).width + 0.5;
    }

    // Typed underline
    if (typed > 0 && !word.destroying) {
      ctx.strokeStyle = isBoss ? `rgba(239,68,68,${word.opacity * 0.5})` : `rgba(99,102,241,${word.opacity * 0.5})`;
      ctx.lineWidth = 2;
      ctx.shadowColor = isBoss ? 'rgba(239,68,68,0.3)' : 'rgba(99,102,241,0.3)';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.moveTo(word.x + PADDING_X, textY + fs + 4);
      let ulW = 0;
      ctx.font = getFont(this.width, 600);
      for (let i = 0; i < typed; i++) ulW += ctx.measureText(text[i]).width + 0.5;
      ctx.lineTo(word.x + PADDING_X + ulW, textY + fs + 4);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    ctx.restore(); // undo bobY translate
  }

  private drawEnemyFace(word: FallingWord, isTarget: boolean, isBoss: boolean) {
    const ctx = this.ctx;
    const faceX = word.x + PADDING_X + 3;
    const faceY = word.y + PADDING_Y - 1;
    const eyeSpacing = isBoss ? 9 : 7;
    const eyeSize = isBoss ? 3.5 : 2.5;

    // Look direction — eyes track toward closest tower or wander
    const lookX = isTarget ? 0.5 : Math.sin(this.time * 2.5 + word.id) * 1;
    const lookY = isTarget ? 0.3 : Math.cos(this.time * 1.8 + word.id * 2) * 0.5;

    for (const side of [-1, 1]) {
      const ex = faceX + (side === 1 ? eyeSpacing : 0);

      // Eye white (oval)
      ctx.fillStyle = isBoss ? 'rgba(254,202,202,0.7)' : 'rgba(255,255,255,0.5)';
      ctx.beginPath();
      ctx.ellipse(ex, faceY, eyeSize + 0.5, eyeSize, 0, 0, Math.PI * 2);
      ctx.fill();

      // Pupil
      const pupilColor = isTarget ? '#6366f1' : isBoss ? '#dc2626' : '#ef4444';
      ctx.fillStyle = pupilColor;
      ctx.beginPath();
      ctx.arc(ex + lookX, faceY + lookY, eyeSize * 0.55, 0, Math.PI * 2);
      ctx.fill();

      // Pupil shine
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.beginPath();
      ctx.arc(ex + lookX - 0.5, faceY + lookY - 0.5, eyeSize * 0.2, 0, Math.PI * 2);
      ctx.fill();

      // Angry eyebrow for targets
      if (isTarget || isBoss) {
        ctx.strokeStyle = isBoss ? 'rgba(239,68,68,0.6)' : 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(ex - eyeSize, faceY - eyeSize - 1 + (side === -1 ? 1 : 0));
        ctx.lineTo(ex + eyeSize, faceY - eyeSize - 1 + (side === 1 ? 1 : 0));
        ctx.stroke();
      }
    }

    // Mouth — little zigzag frown for bosses, simple for others
    if (isBoss) {
      ctx.strokeStyle = 'rgba(239,68,68,0.5)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(faceX - 1, faceY + 5);
      ctx.lineTo(faceX + 2, faceY + 3.5);
      ctx.lineTo(faceX + 5, faceY + 5);
      ctx.stroke();
    }
  }

  updateAndDrawParticles(dt: number) {
    const ctx = this.ctx;

    // Rings
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

    // Bolts
    this.bolts = this.bolts.filter(b => {
      b.opacity -= dt * 3;
      if (b.opacity <= 0) return false;
      ctx.save();
      ctx.globalAlpha = b.opacity;
      ctx.strokeStyle = b.color;
      ctx.lineWidth = 3;
      ctx.shadowColor = b.color;
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.moveTo(b.points[0].x, b.points[0].y);
      for (let i = 1; i < b.points.length; i++) ctx.lineTo(b.points[i].x, b.points[i].y);
      ctx.stroke();
      ctx.lineWidth = 1;
      ctx.strokeStyle = '#fef3c7';
      ctx.globalAlpha = b.opacity * 0.5;
      ctx.stroke();
      ctx.restore();
      return true;
    });

    // Particles
    this.particles = this.particles.filter(p => {
      p.x += p.vx * dt; p.y += p.vy * dt;
      p.life -= dt; p.opacity = Math.max(0, p.life / p.maxLife);
      p.rotation += p.vr * dt;
      switch (p.effect) {
        case 'fire': p.vy -= 200 * dt; p.vx *= 0.98; p.scale = 0.8 + p.opacity * 0.4; break;
        case 'lightning': p.vy += 400 * dt; p.scale = 1 + (1 - p.opacity) * 0.3; break;
        case 'shield': p.vy += 100 * dt; p.scale = 1.3 * p.opacity; break;
        case 'chain': p.vy += 200 * dt; p.vx *= 0.96; break;
        default: p.vy += 300 * dt; break;
      }
      if (p.life <= 0) return false;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.scale(p.scale, p.scale);
      ctx.globalAlpha = p.opacity;
      if (p.glowSize && p.glowSize > 0) { ctx.shadowColor = p.color; ctx.shadowBlur = p.glowSize; }
      ctx.font = p.font;
      ctx.fillStyle = p.color;
      ctx.fillText(p.char, 0, 0);
      ctx.restore();
      return true;
    });

    ctx.globalAlpha = 1;
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
  }

  drawCombo() {
    if (this.comboOpacity <= 0) return;
    const ctx = this.ctx;
    ctx.save();
    ctx.globalAlpha = this.comboOpacity;
    const scale = 1 + (1 - this.comboOpacity) * 0.3;
    ctx.font = `700 ${24 * scale}px Inter, -apple-system, system-ui, sans-serif`;
    ctx.fillStyle = '#a5b4fc';
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(165,180,252,0.5)';
    ctx.shadowBlur = 12;
    ctx.fillText(this.comboText, this.width / 2, 100);
    ctx.textAlign = 'start';
    ctx.restore();
    this.comboOpacity = Math.max(0, this.comboOpacity - 0.012);
  }
}
