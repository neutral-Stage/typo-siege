import type { FallingWord } from './entities';

const FONT = '500 20px Inter, -apple-system, system-ui, sans-serif';
const FONT_TYPED = '600 20px Inter, -apple-system, system-ui, sans-serif';
const FONT_SMALL = '500 9px Inter, -apple-system, system-ui, sans-serif';
const LINE_HEIGHT = 26;
const PADDING_X = 16;
const PADDING_Y = 10;

// Colors — dark theme
const C_BG = '#0f0f13';
const C_WORD_BG = 'rgba(255,255,255,0.06)';
const C_WORD_BG_TARGET = 'rgba(99,102,241,0.12)';
const C_TYPED = '#67e8f9';
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

interface LaserBeam {
  fromX: number; fromY: number; toX: number; toY: number;
  opacity: number; color: string;
}

export class Renderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private dpr: number;
  private particles: Particle[] = [];
  private rings: RingEffect[] = [];
  private bolts: BoltEffect[] = [];
  private lasers: LaserBeam[] = [];
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

  showCombo(combo: number) {
    this.comboText = `COMBO ×${combo}`;
    this.comboOpacity = 1;
  }
  showShieldFlash() { this.shieldFlash = 1; }
  showScreenFlash(color: string) { this.screenFlashColor = color; this.screenFlashOpacity = 0.35; }

  /** Draw a targeting laser from tower to active word */
  showLaser(fromX: number, fromY: number, toX: number, toY: number) {
    this.lasers.push({ fromX, fromY, toX, toY, opacity: 0.6, color: '#6366f1' });
  }

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
    const cx = word.x + word.width / 2;
    const cy = word.y + word.height / 2;
    for (let i = 0; i < 12; i++) {
      this.particles.push({
        x: cx + (Math.random() - 0.5) * word.width, y: cy,
        vx: (Math.random() - 0.5) * 80, vy: -Math.random() * 200 - 100,
        char: '•', opacity: 1, font: `${12 + Math.random() * 8}px Inter`, size: 4,
        rotation: 0, vr: 0,
        color: Math.random() > 0.5 ? '#f97316' : '#ef4444',
        effect: 'fire', life: 1, maxLife: 1, scale: 1, glowSize: 6,
      });
    }
  }

  spawnLightningParticles(word: FallingWord) {
    this.spawnEffectParticles(word, 'lightning');
    const cx = word.x + word.width / 2;
    const cy = word.y + word.height / 2;
    const points: { x: number; y: number }[] = [{ x: cx, y: 0 }];
    let bx = cx, by = 0;
    for (let i = 0; i < 8; i++) {
      bx += (Math.random() - 0.5) * 60;
      by += cy / 8;
      points.push({ x: bx, y: by });
    }
    this.bolts.push({ points, opacity: 1, color: '#fbbf24' });
  }

  spawnShieldParticles(word: FallingWord) {
    this.spawnEffectParticles(word, 'shield');
    this.rings.push({
      x: word.x + word.width / 2, y: word.y + word.height / 2,
      radius: 10, maxRadius: 120, opacity: 0.8, color: '#818cf8', lineWidth: 3,
    });
  }

  spawnChainParticles(word: FallingWord) {
    this.spawnEffectParticles(word, 'chain');
    const cx = word.x + word.width / 2, cy = word.y + word.height / 2;
    for (let i = 0; i < 3; i++) {
      this.rings.push({
        x: cx, y: cy, radius: 5 + i * 10, maxRadius: 80 + i * 60,
        opacity: 0.7 - i * 0.15,
        color: ['#f97316', '#fb923c', '#fbbf24'][i], lineWidth: 3 - i * 0.5,
      });
    }
  }

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
          vx = (Math.random() - 0.5) * 160; vy = -Math.random() * 250 - 80;
          color = ['#ef4444', '#f97316', '#fbbf24', '#fb923c'][Math.floor(Math.random() * 4)]; maxLife = 0.8; break;
        case 'lightning':
          vx = (charX - cx) * (3 + Math.random() * 2); vy = (charY - cy) * (3 + Math.random() * 2) - Math.random() * 60;
          color = ['#fbbf24', '#fde68a', '#fef3c7'][Math.floor(Math.random() * 3)]; maxLife = 0.5; break;
        case 'shield':
          vx = (Math.random() - 0.5) * 300; vy = (Math.random() - 0.5) * 300;
          color = ['#818cf8', '#a5b4fc', '#c7d2fe', '#67e8f9'][Math.floor(Math.random() * 4)]; maxLife = 0.7; break;
        case 'chain':
          const a = Math.atan2(charY - cy, charX - cx); const s = 200 + Math.random() * 150;
          vx = Math.cos(a) * s; vy = Math.sin(a) * s;
          color = ['#f97316', '#fb923c', '#ef4444', '#fbbf24'][Math.floor(Math.random() * 4)]; maxLife = 0.6; break;
        default:
          vx = (Math.random() - 0.5) * 200; vy = -Math.random() * 150 - 50;
          color = C_DESTROYING; maxLife = 0.7; break;
      }
      this.particles.push({
        x: charX, y: charY, vx, vy, char, opacity: 1,
        font: effect === 'lightning' ? FONT_TYPED : FONT, size: 20,
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
    const W = this.width;
    const H = this.height;

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = C_BG;
    ctx.fillRect(0, 0, W, H);

    // Subtle grid
    ctx.strokeStyle = 'rgba(255,255,255,0.02)';
    ctx.lineWidth = 1;
    for (let y = 0; y < H; y += 40) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }

    // ─── Tower structures at bottom ───
    this.drawTowers(W, H);

    // ─── Danger zone ───
    const gradient = ctx.createLinearGradient(0, H - 60, 0, H);
    gradient.addColorStop(0, 'rgba(239,68,68,0)');
    gradient.addColorStop(1, 'rgba(239,68,68,0.08)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, H - 60, W, 60);

    // Shield flash
    if (this.shieldFlash > 0) {
      ctx.fillStyle = `rgba(99,102,241,${this.shieldFlash * 0.15})`;
      ctx.fillRect(0, 0, W, H);
      this.shieldFlash = Math.max(0, this.shieldFlash - 0.02);
    }

    if (frozen) {
      ctx.fillStyle = 'rgba(99,102,241,0.03)';
      ctx.fillRect(0, 0, W, H);
    }

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
    const towerCount = Math.max(3, Math.floor(W / 200));
    const spacing = W / towerCount;
    const towerW = 32;
    const towerH = 48;
    const baseY = H - 8;

    for (let i = 0; i < towerCount; i++) {
      const cx = spacing * i + spacing / 2;
      const x = cx - towerW / 2;
      const y = baseY - towerH;

      // Tower base (wider)
      ctx.fillStyle = 'rgba(99,102,241,0.12)';
      ctx.beginPath();
      ctx.moveTo(x - 8, baseY);
      ctx.lineTo(x + towerW + 8, baseY);
      ctx.lineTo(x + towerW, y + 20);
      ctx.lineTo(x, y + 20);
      ctx.closePath();
      ctx.fill();

      // Tower body
      ctx.fillStyle = 'rgba(99,102,241,0.18)';
      ctx.fillRect(x + 2, y, towerW - 4, 20);

      // Tower top (crenellations)
      const crenW = (towerW - 4) / 5;
      for (let c = 0; c < 5; c++) {
        if (c % 2 === 0) {
          ctx.fillStyle = 'rgba(99,102,241,0.25)';
          ctx.fillRect(x + 2 + c * crenW, y - 6, crenW, 6);
        }
      }

      // Tower window (glowing)
      const pulse = 0.5 + Math.sin(this.time * 2 + i) * 0.3;
      ctx.fillStyle = `rgba(103,232,249,${pulse * 0.4})`;
      ctx.shadowColor = 'rgba(103,232,249,0.3)';
      ctx.shadowBlur = 8;
      ctx.fillRect(cx - 3, y + 6, 6, 8);
      ctx.shadowBlur = 0;
      ctx.shadowColor = 'transparent';

      // Tower cannon (points toward nearest word)
      ctx.fillStyle = 'rgba(165,180,252,0.3)';
      ctx.fillRect(cx - 2, y - 10, 4, 10);
    }

    // Wall connecting towers
    ctx.fillStyle = 'rgba(99,102,241,0.08)';
    ctx.fillRect(0, baseY - 16, W, 16);

    // Wall line
    ctx.strokeStyle = 'rgba(99,102,241,0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, baseY - 16);
    ctx.lineTo(W, baseY - 16);
    ctx.stroke();
  }

  drawWords(words: FallingWord[], activeTarget: FallingWord | null) {
    // Draw targeting laser first (behind words)
    if (activeTarget && activeTarget.typed > 0 && !activeTarget.destroying) {
      const W = this.width;
      const H = this.height;
      const towerCount = Math.max(3, Math.floor(W / 200));
      const spacing = W / towerCount;
      // Find closest tower
      let closestTowerX = spacing / 2;
      let minDist = Infinity;
      for (let i = 0; i < towerCount; i++) {
        const tx = spacing * i + spacing / 2;
        const d = Math.abs(tx - (activeTarget.x + activeTarget.width / 2));
        if (d < minDist) { minDist = d; closestTowerX = tx; }
      }
      this.lasers.push({
        fromX: closestTowerX, fromY: H - 56,
        toX: activeTarget.x + activeTarget.width / 2,
        toY: activeTarget.y + activeTarget.height / 2,
        opacity: 0.4, color: '#6366f1',
      });
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

    // Target glow
    if (isTarget && typed > 0) {
      ctx.shadowColor = isBoss ? 'rgba(239,68,68,0.4)' : 'rgba(99,102,241,0.3)';
      ctx.shadowBlur = 14;
    }

    // Enemy body — pill shape with enemy color
    let bgColor: string;
    if (word.destroying) {
      bgColor = `rgba(99,102,241,${word.opacity * 0.15})`;
    } else if (isBoss) {
      bgColor = 'rgba(239,68,68,0.15)';
    } else if (isTarget) {
      bgColor = C_WORD_BG_TARGET;
    } else {
      bgColor = C_WORD_BG;
    }

    // Border for enemies
    ctx.fillStyle = bgColor;
    ctx.beginPath();
    ctx.roundRect(word.x, word.y, word.width, word.height, isBoss ? 12 : 8);
    ctx.fill();

    // Enemy border
    if (!word.destroying) {
      ctx.strokeStyle = isBoss
        ? `rgba(239,68,68,${0.3 + Math.sin(this.time * 4) * 0.1})`
        : isTarget ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.05)';
      ctx.lineWidth = isBoss ? 2 : 1;
      ctx.stroke();
    }

    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;

    // ─── Angry eyes ───
    if (!word.destroying && !isBoss) {
      const eyeY = word.y + PADDING_Y - 2;
      const eyeX = word.x + PADDING_X + 2;
      const eyeSpacing = 7;
      const pupilOff = isTarget ? 0 : (Math.sin(this.time * 3 + word.id) * 0.5);

      // Left eye
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.beginPath(); ctx.arc(eyeX, eyeY, 3, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = isTarget ? '#6366f1' : 'rgba(239,68,68,0.8)';
      ctx.beginPath(); ctx.arc(eyeX + pupilOff, eyeY, 1.5, 0, Math.PI * 2); ctx.fill();

      // Right eye
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.beginPath(); ctx.arc(eyeX + eyeSpacing, eyeY, 3, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = isTarget ? '#6366f1' : 'rgba(239,68,68,0.8)';
      ctx.beginPath(); ctx.arc(eyeX + eyeSpacing + pupilOff, eyeY, 1.5, 0, Math.PI * 2); ctx.fill();
    }

    // ─── Boss crown ───
    if (isBoss && !word.destroying) {
      const crownX = word.x + word.width / 2;
      const crownY = word.y - 4;
      ctx.fillStyle = '#fbbf24';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('👑', crownX, crownY);
      ctx.textAlign = 'start';
    }

    // ─── Health bar ───
    if (!word.destroying && text.length > 3) {
      const hbX = word.x + 4;
      const hbY = word.y + word.height - 3;
      const hbW = word.width - 8;
      const hbH = 2;
      const progress = typed / text.length;

      // Background
      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      ctx.fillRect(hbX, hbY, hbW, hbH);

      // Fill — red to green
      const r = Math.floor(239 * (1 - progress));
      const g = Math.floor(68 + 160 * progress);
      ctx.fillStyle = `rgba(${r},${g},100,0.6)`;
      ctx.fillRect(hbX, hbY, hbW * progress, hbH);
    }

    // ─── Draw characters ───
    const textY = word.y + PADDING_Y + (isBoss ? 2 : 2);
    let textX = word.x + PADDING_X;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (i < typed) {
        ctx.font = isBoss ? '700 20px Inter, sans-serif' : FONT_TYPED;
        ctx.fillStyle = isBoss ? `rgba(239,68,68,${word.opacity})` : `rgba(99,102,241,${word.opacity})`;
      } else if (word.destroying) {
        ctx.font = FONT;
        ctx.fillStyle = `rgba(99,102,241,${word.opacity * 0.5})`;
      } else {
        ctx.font = FONT;
        ctx.fillStyle = isBoss
          ? `rgba(252,165,165,${word.opacity * 0.8})`
          : `rgba(255,255,255,${word.opacity * (isTarget ? 0.85 : 0.5)})`;
      }
      ctx.fillText(char, textX, textY + 20);
      textX += ctx.measureText(char).width + 0.5;
    }

    // Typed underline
    if (typed > 0 && !word.destroying) {
      ctx.strokeStyle = isBoss
        ? `rgba(239,68,68,${word.opacity * 0.6})`
        : `rgba(99,102,241,${word.opacity * 0.6})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(word.x + PADDING_X, textY + 24);
      let ulWidth = 0;
      ctx.font = FONT_TYPED;
      for (let i = 0; i < typed; i++) ulWidth += ctx.measureText(text[i]).width + 0.5;
      ctx.lineTo(word.x + PADDING_X + ulWidth, textY + 24);
      ctx.stroke();
    }
  }

  updateAndDrawParticles(dt: number) {
    const ctx = this.ctx;

    // ─── Lasers ───
    this.lasers = this.lasers.filter(l => {
      l.opacity -= dt * 4;
      if (l.opacity <= 0) return false;

      ctx.save();
      ctx.globalAlpha = l.opacity;
      ctx.strokeStyle = l.color;
      ctx.lineWidth = 2;
      ctx.shadowColor = l.color;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(l.fromX, l.fromY);
      ctx.lineTo(l.toX, l.toY);
      ctx.stroke();
      // Inner bright line
      ctx.strokeStyle = '#a5b4fc';
      ctx.lineWidth = 1;
      ctx.globalAlpha = l.opacity * 0.6;
      ctx.stroke();
      ctx.restore();

      return true;
    });

    // ─── Rings ───
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

    // ─── Bolts ───
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
      for (let i = 1; i < b.points.length; i++) ctx.lineTo(b.points[i].x, b.points[i].y);
      ctx.stroke();
      ctx.lineWidth = 1;
      ctx.globalAlpha = b.opacity * 0.5;
      ctx.stroke();
      ctx.restore();
      return true;
    });

    // ─── Particles ───
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
    ctx.font = '700 24px Inter, -apple-system, system-ui, sans-serif';
    ctx.fillStyle = '#a5b4fc';
    ctx.textAlign = 'center';
    ctx.fillText(this.comboText, this.width / 2, 100);
    ctx.textAlign = 'start';
    ctx.restore();
    this.comboOpacity = Math.max(0, this.comboOpacity - 0.015);
  }
}
