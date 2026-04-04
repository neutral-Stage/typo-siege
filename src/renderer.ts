import { getFont, getFontSize } from './entities';
import type { FallingWord } from './entities';

const PADDING_X = 14;
const PADDING_Y = 8;

// Colors
const C_BG = '#87CEEB';
const C_WORD_BG = 'rgba(255,255,255,0.04)';
const C_WORD_BG_TARGET = 'rgba(99,102,241,0.1)';
const C_DESTROYING = '#a5b4fc';
const C_SKY_TOP = '#87CEEB';
const C_SKY_SUNSET = '#FF6B6B';
const C_SKY_HORIZON = '#FFB347';
const C_SUN = '#FFD93D';
const C_OCEAN_DEEP = '#4169E1';
const C_OCEAN_MID = '#1E90FF';
const C_OCEAN_LIGHT = '#00CED1';
const C_SAND = '#DEB887';
const C_SAND_DARK = '#D2B48C';
const C_FOAM = 'rgba(255,255,255,0.82)';
const C_PALM = 'rgba(14,23,18,0.82)';
const C_CRAB_OUTLINE = '#000000';

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

interface DayPhaseConfig {
  key: 'morning' | 'afternoon' | 'evening' | 'night' | 'midnight';
  skyColors: [string, string, string, string];
  oceanColors: [string, string, string];
  waveLayerColors: [string, string, string, string];
  sandColors: [string, string];
  celestial: {
    kind: 'sun' | 'moon';
    x: number;
    y: number;
    radius: number;
    glow: string;
    body: string;
    accent?: string;
  };
  horizonGlow: string;
  cloudColor: string;
  foam: string;
  shoreline: string;
  starDensity: number;
}

export class Renderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private offscreenCanvas: HTMLCanvasElement;
  private offscreenCtx: CanvasRenderingContext2D;
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
  private shakeIntensity = 0;
  private shakeDuration = 0;
  private shakeTimer = 0;
  private bgDirty = true;
  private cachedPhaseKey: DayPhaseConfig['key'] | null = null;
  public wave = 1;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.offscreenCanvas = document.createElement('canvas');
    this.offscreenCtx = this.offscreenCanvas.getContext('2d')!;
    this.dpr = window.devicePixelRatio || 1;
    this.resize();
  }

  resize() {
    const rect = this.canvas.parentElement!.getBoundingClientRect();
    this.canvas.width = rect.width * this.dpr;
    this.canvas.height = rect.height * this.dpr;
    this.offscreenCanvas.width = this.canvas.width;
    this.offscreenCanvas.height = this.canvas.height;
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.offscreenCtx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.bgDirty = true;
  }

  get width(): number { return this.canvas.width / this.dpr; }
  get height(): number { return this.canvas.height / this.dpr; }

  showCombo(combo: number) { this.comboText = `COMBO ×${combo}`; this.comboOpacity = 1; }
  showShieldFlash() { this.shieldFlash = 1; }
  showScreenFlash(color: string) { this.screenFlashColor = color; this.screenFlashOpacity = 0.35; }
  shake(intensity = 3, duration = 0.15) {
    this.shakeIntensity = intensity;
    this.shakeDuration = duration;
    this.shakeTimer = duration;
  }

  drawWaveTransition(wave: number, progress: number) {
    let alpha = progress > 0.5 ? (1 - progress) * 2 : progress * 2;
    const ctx = this.ctx;
    ctx.save();
    ctx.globalAlpha = alpha;
    const grad = ctx.createLinearGradient(0, 0, 0, this.height);
    grad.addColorStop(0, C_SKY_TOP);
    grad.addColorStop(0.62, C_SKY_SUNSET);
    grad.addColorStop(1, C_SAND_DARK);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, this.width, this.height);
    ctx.font = '700 72px Inter, -apple-system, system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255,248,220,0.92)';
    ctx.textAlign = 'center';
    ctx.fillText(`WAVE ${wave}`, this.width / 2, this.height / 2 - 16);
    ctx.font = '400 18px Inter, -apple-system, system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.72)';
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

  // Call at start of frame — applies shake offset
  beginFrame() {
    this.time += 0.016;
    const ctx = this.ctx;
    let shakeX = 0, shakeY = 0;
    if (this.shakeTimer > 0) {
      this.shakeTimer -= 0.016;
      const progress = Math.max(0, this.shakeTimer / this.shakeDuration);
      const intensity = this.shakeIntensity * progress;
      shakeX = (Math.random() - 0.5) * 2 * intensity;
      shakeY = (Math.random() - 0.5) * 2 * intensity;
    }
    ctx.save();
    ctx.translate(shakeX, shakeY);
  }

  // Call at end of frame — restores canvas state
  endFrame() {
    this.ctx.restore();
  }

  clear(frozen = false) {
    const ctx = this.ctx;
    const W = this.width, H = this.height;
    const horizonY = H * 0.6;
    const sandY = H * 0.85;
    const phase = this.getDayPhase(this.wave);

    ctx.clearRect(0, 0, W, H);
    if (this.cachedPhaseKey !== phase.key) {
      this.bgDirty = true;
      this.cachedPhaseKey = phase.key;
    }
    if (this.bgDirty) {
      this.renderStaticBackground();
      this.bgDirty = false;
    }

    ctx.drawImage(this.offscreenCanvas, 0, 0, this.offscreenCanvas.width, this.offscreenCanvas.height, 0, 0, W, H);
    this.drawDynamicOcean(W, H, horizonY, sandY, phase);
    this.drawShorelineWaves(W, H, horizonY, sandY, phase);
    if (phase.celestial.kind === 'moon') {
      this.drawTwinklingStars(W, horizonY, phase);
    }

    // ─── Tower defense base ───
    this.drawTowers(W, H, sandY);

    // Danger zone glow
    const dg = ctx.createLinearGradient(0, sandY - 28, 0, H);
    dg.addColorStop(0, 'rgba(220,38,38,0)');
    dg.addColorStop(0.45, 'rgba(220,38,38,0.04)');
    dg.addColorStop(1, `rgba(220,38,38,${0.14 + Math.sin(this.time * 2.2) * 0.03})`);
    ctx.fillStyle = dg;
    ctx.fillRect(0, sandY - 28, W, H - sandY + 28);

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

  private renderStaticBackground() {
    const ctx = this.offscreenCtx;
    const W = this.width;
    const H = this.height;
    const horizonY = H * 0.6;
    const sandY = H * 0.85;
    const phase = this.getDayPhase(this.wave);

    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = C_BG;
    ctx.fillRect(0, 0, W, H);

    const sky = ctx.createLinearGradient(0, 0, 0, horizonY);
    sky.addColorStop(0, phase.skyColors[0]);
    sky.addColorStop(0.45, phase.skyColors[1]);
    sky.addColorStop(0.78, phase.skyColors[2]);
    sky.addColorStop(1, phase.skyColors[3]);
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, horizonY);

    const celestialX = W * phase.celestial.x;
    const celestialY = horizonY * phase.celestial.y;
    const celestialR = Math.max(28, Math.min(W, H) * phase.celestial.radius);
    const glow = ctx.createRadialGradient(celestialX, celestialY, celestialR * 0.2, celestialX, celestialY, celestialR * 2.7);
    glow.addColorStop(0, phase.celestial.glow);
    glow.addColorStop(0.45, phase.celestial.glow.replace(/0?\.\d+\)/, '0.28)'));
    glow.addColorStop(1, phase.celestial.glow.replace(/0?\.\d+\)/, '0)'));
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(celestialX, celestialY, celestialR * 2.7, 0, Math.PI * 2);
    ctx.fill();

    if (phase.celestial.kind === 'sun') {
      ctx.fillStyle = phase.celestial.body;
      ctx.beginPath();
      ctx.arc(celestialX, celestialY, celestialR, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = phase.celestial.body;
      ctx.beginPath();
      ctx.arc(celestialX, celestialY, celestialR, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.arc(celestialX + celestialR * 0.32, celestialY - celestialR * 0.05, celestialR * 0.9, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
      if (phase.celestial.accent) {
        ctx.strokeStyle = phase.celestial.accent;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(celestialX, celestialY, celestialR, -1.9, 1.9);
        ctx.stroke();
      }
      this.drawStaticStars(W, horizonY, phase);
    }

    const glowBand = ctx.createLinearGradient(0, horizonY * 0.45, 0, horizonY);
    glowBand.addColorStop(0, 'rgba(255,255,255,0)');
    glowBand.addColorStop(1, phase.horizonGlow);
    ctx.fillStyle = glowBand;
    ctx.fillRect(0, horizonY * 0.35, W, horizonY * 0.8);

    this.drawClouds(W, horizonY, phase);

    const ocean = ctx.createLinearGradient(0, horizonY, 0, sandY);
    ocean.addColorStop(0, phase.oceanColors[0]);
    ocean.addColorStop(0.45, phase.oceanColors[1]);
    ocean.addColorStop(1, phase.oceanColors[2]);
    ctx.fillStyle = ocean;
    ctx.fillRect(0, horizonY, W, sandY - horizonY);

    const sand = ctx.createLinearGradient(0, sandY, 0, H);
    sand.addColorStop(0, phase.sandColors[0]);
    sand.addColorStop(1, phase.sandColors[1]);
    ctx.fillStyle = sand;
    ctx.fillRect(0, sandY, W, H - sandY);

    for (let x = 0; x < W; x += 9) {
      const n = Math.sin(x * 12.9898 + 78.233) * 43758.5453;
      const frac = n - Math.floor(n);
      const y = sandY + 4 + frac * (H - sandY - 8);
      const size = 1 + ((x / 9) % 3 === 0 ? 1 : 0);
      ctx.fillStyle = frac > 0.55 ? 'rgba(120,85,40,0.12)' : 'rgba(255,245,220,0.08)';
      ctx.fillRect(x, y, size, size);
    }

    this.drawPalmTree(W * 0.08, sandY + 12, 1, 0.95, ctx);
    if (W > 640) this.drawPalmTree(W * 0.92, sandY + 16, -1, 0.8, ctx);
  }

  private drawDynamicOcean(W: number, H: number, horizonY: number, sandY: number, phase: DayPhaseConfig) {
    const ctx = this.ctx;

    for (let layer = 0; layer < 4; layer++) {
      const amp = 6 + layer * 4;
      const wavelength = 90 + layer * 45;
      const speed = 0.45 + layer * 0.18;
      const baseY = horizonY + 18 + layer * ((sandY - horizonY) / 5);
      ctx.beginPath();
      ctx.moveTo(0, sandY);
      for (let x = 0; x <= W + 12; x += 12) {
        const y = baseY
          + Math.sin((x / wavelength) + this.time * speed) * amp
          + Math.cos((x / (wavelength * 0.6)) + this.time * speed * 1.3) * (amp * 0.35);
        ctx.lineTo(x, y);
      }
      ctx.lineTo(W, sandY);
      ctx.closePath();
      ctx.fillStyle = phase.waveLayerColors[layer];
      ctx.fill();
    }

    const foamY = sandY - 6 + Math.sin(this.time * 1.6) * 2;
    ctx.beginPath();
    ctx.moveTo(0, H);
    ctx.lineTo(0, sandY);
    for (let x = 0; x <= W + 8; x += 8) {
      const y = foamY + Math.sin((x / 24) + this.time * 2.1) * 3 + Math.cos((x / 13) + this.time * 1.3) * 1.5;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(W, H);
    ctx.closePath();
    ctx.fillStyle = phase.foam;
    ctx.shadowColor = phase.key === 'night' || phase.key === 'midnight' ? 'rgba(130,190,255,0.28)' : 'transparent';
    ctx.shadowBlur = phase.key === 'night' || phase.key === 'midnight' ? 10 : 0;
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.shadowColor = 'transparent';
  }

  private drawClouds(W: number, horizonY: number, phase: DayPhaseConfig) {
    const ctx = this.offscreenCtx;
    for (let i = 0; i < 4; i++) {
      const drift = ((i * 140) + (phase.key === 'midnight' ? 40 : 0)) % (W + 180);
      const x = drift - 90;
      const y = horizonY * (0.16 + i * 0.1) + (i % 2 === 0 ? 4 : -2);
      const w = 82 + i * 16;
      const h = 28 + i * 5;
      ctx.save();
      ctx.globalAlpha = 0.72 - i * 0.08;
      ctx.fillStyle = phase.cloudColor;
      for (const [dx, dy, scale] of [
        [0, 0, 0.42],
        [w * 0.18, -h * 0.18, 0.34],
        [w * 0.36, 0, 0.38],
        [w * 0.56, -h * 0.08, 0.28],
      ] as const) {
        ctx.beginPath();
        ctx.ellipse(x + dx, y + dy, w * scale, h * (0.7 + scale * 0.25), 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  private drawStaticStars(W: number, horizonY: number, phase: DayPhaseConfig) {
    const ctx = this.offscreenCtx;
    const count = Math.max(24, Math.floor(W * phase.starDensity));
    for (let i = 0; i < count; i++) {
      const seed = i * 91.7;
      const x = (Math.sin(seed * 1.37) * 43758.5453 % 1 + 1) % 1 * W;
      const y = ((Math.sin(seed * 1.91) * 12731.33 % 1 + 1) % 1) * horizonY * 0.78;
      const size = 0.8 + (((Math.sin(seed * 2.73) * 9182.1 % 1) + 1) % 1) * 1.8;
      ctx.fillStyle = i % 7 === 0 ? 'rgba(255,244,210,0.8)' : 'rgba(255,255,255,0.72)';
      ctx.fillRect(x, y, size, size);
    }
  }

  private drawTwinklingStars(W: number, horizonY: number, phase: DayPhaseConfig) {
    const ctx = this.ctx;
    const count = Math.max(24, Math.floor(W * phase.starDensity));
    for (let i = 0; i < count; i++) {
      const seed = i * 91.7;
      const x = (Math.sin(seed * 1.37) * 43758.5453 % 1 + 1) % 1 * W;
      const y = ((Math.sin(seed * 1.91) * 12731.33 % 1 + 1) % 1) * horizonY * 0.78;
      const size = 0.8 + (((Math.sin(seed * 2.73) * 9182.1 % 1) + 1) % 1) * 1.8;
      const twinkle = 0.28 + (Math.sin(this.time * (2 + (i % 5) * 0.35) + i * 0.9) + 1) * 0.22;
      ctx.fillStyle = i % 7 === 0 ? `rgba(255,244,210,${twinkle})` : `rgba(255,255,255,${twinkle})`;
      ctx.fillRect(x, y, size, size);
    }
  }

  private drawShorelineWaves(W: number, H: number, horizonY: number, sandY: number, phase: DayPhaseConfig) {
    const ctx = this.ctx;
    const bandHeight = sandY - horizonY;

    for (let i = 0; i < 5; i++) {
      const progress = i / 4;
      const baseY = sandY - 18 - progress * Math.min(90, bandHeight * 0.55) + Math.sin(this.time * (1.4 + i * 0.18) + i) * 2.2;
      ctx.beginPath();
      for (let x = 0; x <= W + 10; x += 10) {
        const y = baseY
          + Math.sin((x / (34 + i * 8)) + this.time * (1.8 + i * 0.2)) * (2.2 + i * 0.4)
          + Math.cos((x / (19 + i * 4)) - this.time * (1.1 + i * 0.12)) * 0.9;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = phase.key === 'night' || phase.key === 'midnight'
        ? `rgba(150,210,255,${0.18 + (1 - progress) * 0.2})`
        : `rgba(255,255,255,${0.12 + (1 - progress) * 0.2})`;
      ctx.lineWidth = 1.2 + (1 - progress) * 1.1;
      ctx.stroke();
    }

    ctx.beginPath();
    ctx.moveTo(0, H);
    ctx.lineTo(0, sandY - 2);
    for (let x = 0; x <= W + 8; x += 8) {
      const y = sandY - 3
        + Math.sin((x / 30) + this.time * 2.6) * 4.5
        + Math.cos((x / 17) - this.time * 1.7) * 2;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(W, H);
    ctx.closePath();
    ctx.fillStyle = phase.shoreline;
    ctx.fill();
  }

  public getDayPhase(wave: number): DayPhaseConfig {
    if (wave >= 13) {
      return {
        key: 'midnight',
        skyColors: ['#081124', '#101b37', '#1d2147', '#2f2353'],
        oceanColors: ['rgba(18,52,88,0.92)', 'rgba(14,78,108,0.94)', 'rgba(7,35,66,0.98)'],
        waveLayerColors: ['rgba(7,35,66,0.2)', 'rgba(14,78,108,0.18)', 'rgba(18,52,88,0.16)', 'rgba(180,220,255,0.08)'],
        sandColors: ['#8f7a61', '#6a5746'],
        celestial: { kind: 'moon', x: 0.76, y: 0.2, radius: 0.06, glow: 'rgba(214,232,255,0.72)', body: '#eef4ff', accent: 'rgba(210,228,255,0.65)' },
        horizonGlow: 'rgba(78,109,170,0.16)',
        cloudColor: 'rgba(186,202,235,0.22)',
        foam: 'rgba(205,232,255,0.55)',
        shoreline: 'rgba(128,182,230,0.14)',
        starDensity: 0.14,
      };
    }
    if (wave >= 10) {
      return {
        key: 'night',
        skyColors: ['#10203f', '#1e2b5d', '#31427a', '#5a4f85'],
        oceanColors: ['rgba(34,82,132,0.9)', 'rgba(28,112,148,0.92)', 'rgba(16,51,97,0.98)'],
        waveLayerColors: ['rgba(16,51,97,0.2)', 'rgba(28,112,148,0.18)', 'rgba(34,82,132,0.16)', 'rgba(180,220,255,0.08)'],
        sandColors: ['#a58c6d', '#7f6952'],
        celestial: { kind: 'moon', x: 0.72, y: 0.22, radius: 0.055, glow: 'rgba(224,234,255,0.7)', body: '#f5f8ff', accent: 'rgba(226,235,255,0.6)' },
        horizonGlow: 'rgba(113,120,185,0.18)',
        cloudColor: 'rgba(210,220,245,0.28)',
        foam: 'rgba(210,230,255,0.6)',
        shoreline: 'rgba(130,190,255,0.13)',
        starDensity: 0.09,
      };
    }
    if (wave >= 7) {
      return {
        key: 'evening',
        skyColors: ['#ff9b6a', '#ff7e7e', '#d96ab4', '#6c63c9'],
        oceanColors: ['rgba(74,146,216,0.85)', 'rgba(56,113,191,0.92)', 'rgba(43,70,142,0.98)'],
        waveLayerColors: ['rgba(43,70,142,0.18)', 'rgba(56,113,191,0.17)', 'rgba(74,146,216,0.14)', 'rgba(255,255,255,0.1)'],
        sandColors: ['#ddb07d', '#bf865b'],
        celestial: { kind: 'sun', x: 0.74, y: 0.8, radius: 0.075, glow: 'rgba(255,188,110,0.9)', body: '#ffd07c' },
        horizonGlow: 'rgba(255,194,128,0.28)',
        cloudColor: 'rgba(255,235,225,0.8)',
        foam: 'rgba(255,235,220,0.76)',
        shoreline: 'rgba(255,214,185,0.14)',
        starDensity: 0,
      };
    }
    if (wave >= 4) {
      return {
        key: 'afternoon',
        skyColors: ['#59b7ff', '#82d5ff', '#9fe0ff', '#d6f2ff'],
        oceanColors: ['rgba(49,165,223,0.84)', 'rgba(25,191,214,0.9)', 'rgba(41,97,191,0.96)'],
        waveLayerColors: ['rgba(41,97,191,0.18)', 'rgba(25,191,214,0.17)', 'rgba(49,165,223,0.14)', 'rgba(255,255,255,0.1)'],
        sandColors: ['#e6c089', '#d3a66f'],
        celestial: { kind: 'sun', x: 0.68, y: 0.2, radius: 0.08, glow: 'rgba(255,227,120,0.94)', body: '#ffe066' },
        horizonGlow: 'rgba(255,245,190,0.18)',
        cloudColor: 'rgba(255,255,255,0.84)',
        foam: C_FOAM,
        shoreline: 'rgba(255,255,255,0.12)',
        starDensity: 0,
      };
    }
    return {
      key: 'morning',
      skyColors: ['#8ecfff', '#b8e1ff', '#ffd1a8', '#ffe3b7'],
      oceanColors: ['rgba(86,176,222,0.8)', 'rgba(56,198,204,0.88)', 'rgba(63,116,190,0.95)'],
      waveLayerColors: ['rgba(63,116,190,0.18)', 'rgba(56,198,204,0.17)', 'rgba(86,176,222,0.14)', 'rgba(255,255,255,0.1)'],
      sandColors: ['#e7c58f', '#cfa06c'],
      celestial: { kind: 'sun', x: 0.78, y: 0.5, radius: 0.07, glow: 'rgba(255,210,125,0.92)', body: '#ffd97a' },
      horizonGlow: 'rgba(255,215,156,0.22)',
      cloudColor: 'rgba(255,249,240,0.82)',
      foam: 'rgba(255,248,236,0.82)',
      shoreline: 'rgba(255,243,225,0.14)',
      starDensity: 0,
    };
  }

  private drawPalmTree(baseX: number, baseY: number, leanDir: -1 | 1, scale: number, ctx: CanvasRenderingContext2D = this.ctx) {
    const trunkH = 90 * scale;
    const trunkW = 11 * scale;
    ctx.save();
    ctx.strokeStyle = C_PALM;
    ctx.fillStyle = C_PALM;
    ctx.lineWidth = 6 * scale;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(baseX, baseY);
    ctx.quadraticCurveTo(baseX + leanDir * 18 * scale, baseY - trunkH * 0.55, baseX + leanDir * 26 * scale, baseY - trunkH);
    ctx.stroke();
    for (let i = 0; i < 5; i++) {
      const angle = (-0.95 + i * 0.45) * leanDir;
      const leafX = baseX + leanDir * 26 * scale;
      const leafY = baseY - trunkH;
      ctx.beginPath();
      ctx.moveTo(leafX, leafY);
      ctx.quadraticCurveTo(
        leafX + Math.cos(angle) * 30 * scale,
        leafY - 10 * scale + Math.sin(angle) * 16 * scale,
        leafX + Math.cos(angle) * 54 * scale,
        leafY + Math.sin(angle) * 26 * scale,
      );
      ctx.stroke();
    }
    for (let i = 0; i < 5; i++) {
      const segY = baseY - i * (trunkH / 6);
      ctx.fillRect(baseX - trunkW / 2, segY, trunkW, 1.5 * scale);
    }
    ctx.restore();
  }

  private drawTowers(W: number, H: number, sandY: number) {
    const ctx = this.ctx;
    const count = Math.max(3, Math.floor(W / 180));
    const spacing = W / count;
    const tW = 36, tH = 52, baseY = H - 6;

    for (let i = 0; i < count; i++) {
      const cx = spacing * i + spacing / 2;
      const x = cx - tW / 2, y = baseY - tH;

      ctx.fillStyle = 'rgba(0,0,0,0.16)';
      ctx.beginPath();
      ctx.ellipse(cx, baseY + 2, tW / 2 + 8, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      const moat = ctx.createLinearGradient(0, sandY - 8, 0, baseY);
      moat.addColorStop(0, 'rgba(255,255,255,0)');
      moat.addColorStop(1, 'rgba(180,38,38,0.12)');
      ctx.fillStyle = moat;
      ctx.fillRect(cx - tW * 0.9, sandY - 6, tW * 1.8, baseY - sandY + 6);

      const baseGrad = ctx.createLinearGradient(0, y + 18, 0, baseY);
      baseGrad.addColorStop(0, 'rgba(240,211,165,0.95)');
      baseGrad.addColorStop(1, 'rgba(194,152,94,0.92)');
      ctx.fillStyle = baseGrad;
      ctx.beginPath();
      ctx.moveTo(x - 10, baseY);
      ctx.lineTo(x + tW + 10, baseY);
      ctx.lineTo(x + tW + 2, y + 18);
      ctx.lineTo(x - 2, y + 18);
      ctx.closePath();
      ctx.fill();

      const bodyGrad = ctx.createLinearGradient(0, y, 0, y + 20);
      bodyGrad.addColorStop(0, 'rgba(243,214,170,0.98)');
      bodyGrad.addColorStop(1, 'rgba(204,166,108,0.92)');
      ctx.fillStyle = bodyGrad;
      ctx.fillRect(x + 3, y, tW - 6, 20);
      ctx.strokeStyle = 'rgba(133,94,46,0.45)';
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 3, y, tW - 6, 20);

      const crenW = (tW - 6) / 5;
      for (let c = 0; c < 5; c++) {
        if (c % 2 === 0) {
          ctx.fillStyle = `rgba(224,190,135,${0.86 + Math.sin(this.time + i + c) * 0.05})`;
          ctx.fillRect(x + 3 + c * crenW, y - 7, crenW - 1, 7);
        }
      }

      const pulse = 0.4 + Math.sin(this.time * 1.8 + i * 1.3) * 0.25;
      ctx.shadowColor = 'rgba(255,248,200,0.5)';
      ctx.shadowBlur = 10 * pulse;
      ctx.fillStyle = `rgba(255,246,200,${pulse * 0.55})`;
      ctx.beginPath();
      ctx.arc(cx, y + 10, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.shadowColor = 'transparent';

      ctx.fillStyle = 'rgba(133,94,46,0.92)';
      ctx.fillRect(cx - 2, y - 14, 4, 14);

      ctx.fillStyle = `rgba(255,246,200,${pulse * 0.65})`;
      ctx.beginPath();
      ctx.arc(cx, y - 14, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    const wallY = baseY - 18;
    const wallGrad = ctx.createLinearGradient(0, wallY, 0, baseY);
    wallGrad.addColorStop(0, 'rgba(237,201,146,0.95)');
    wallGrad.addColorStop(0.5, 'rgba(212,172,116,0.98)');
    wallGrad.addColorStop(1, 'rgba(182,139,87,0.95)');
    ctx.fillStyle = wallGrad;
    ctx.fillRect(0, wallY, W, 18);

    ctx.strokeStyle = 'rgba(130,87,39,0.45)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, wallY);
    ctx.lineTo(W, wallY);
    ctx.stroke();

    for (let bx = 0; bx < W; bx += 24) {
      ctx.strokeStyle = 'rgba(255,244,220,0.16)';
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
    const fs = getFontSize(this.width);
    const H = this.height;
    const speed = word.speed;

    const danger = Math.min(1, Math.max(0, word.y / (H - 80)));
    const gaitBase = this.time * (2.6 + speed * 0.028) + (word.legPhase ?? 0) + word.id * 0.37;
    const legCycle = Math.sin(gaitBase);
    const clawCycle = Math.sin(gaitBase * 1.15 + word.id * 0.41);
    const bob = word.destroying ? 0 : Math.sin(gaitBase * 2.1) * (1.2 + danger * 1.2);
    const sway = word.destroying ? 0 : Math.cos(gaitBase * 0.95) * (0.9 + danger * 0.55);
    const destroyProgress = word.destroying
      ? Math.min(1, Math.max(0, 1 - Math.max(word.destroyTimer, 0) / 0.4))
      : 0;
    const textPadX = Math.max(18, fs * 0.7);
    const bodyW = Math.max(word.width + textPadX * 2.1, fs * 4.6) * (isBoss ? 1.5 : 1.05);
    const bodyH = Math.max(word.height * 1.45, fs * 2.55) * (isBoss ? 1.5 : 1.08);
    const cx = word.x + word.width / 2 + sway;
    const cy = word.y + word.height / 2 + bob + (isBoss ? 2 : 0);
    const shell = this.getCrabPalette(danger, isBoss, word.opacity);
    const vibAmp = (0.18 + danger * 0.55 + (isBoss ? 0.4 : 0)) * (speed / 55);
    const vibX = Math.sin(this.time * 15 + word.id * 3) * vibAmp;
    const vibY = Math.cos(this.time * 12 + word.id * 2) * vibAmp * 0.4;

    ctx.save();
    ctx.translate(vibX, vibY);
    for (let i = 0; i < 3; i++) {
      const legT = i / 2;
      const yOffset = bodyH * (0.05 + legT * 0.22);
      const spread = bodyW * (0.19 + legT * 0.09);
      const stride = (i % 2 === 0 ? legCycle : -legCycle) * (5 + speed * 0.034);
      this.drawCrabLeg(cx, cy, bodyW, bodyH, -1, yOffset, spread, stride, shell.fill, word.opacity, word.destroying, destroyProgress);
      this.drawCrabLeg(cx, cy, bodyW, bodyH, 1, yOffset, spread, -stride, shell.fill, word.opacity, word.destroying, destroyProgress);
    }

    this.drawCrabClaw(cx, cy, bodyW, bodyH, -1, clawCycle, shell, isBoss, word.opacity, word.destroying, destroyProgress);
    this.drawCrabClaw(cx, cy, bodyW, bodyH, 1, -clawCycle, shell, isBoss, word.opacity, word.destroying, destroyProgress);

    if (!word.destroying) {
      this.drawCrabBody(cx, cy, bodyW, bodyH, shell, isBoss, word.opacity, isTarget && typed > 0);
    } else {
      this.drawCrabBodyFragments(cx, cy, bodyW, bodyH, shell, isBoss, word.opacity, destroyProgress);
    }

    this.drawCrabEyes(cx, cy, bodyW, bodyH, shell.eye, word.opacity, word.destroying, destroyProgress);

    const textY = cy + fs * 0.16;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    let advance = 0;
    ctx.font = isBoss ? `700 ${fs}px Inter, sans-serif` : getFont(this.width);
    const letterSpacing = 0.5;
    for (let i = 0; i < text.length; i++) {
      advance += ctx.measureText(text[i]).width;
      if (i < text.length - 1) advance += letterSpacing;
    }
    let textX = cx - advance / 2;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const outline = word.destroying ? `rgba(0,0,0,${word.opacity * 0.45})` : `rgba(0,0,0,${0.95 * word.opacity})`;
      ctx.strokeStyle = outline;
      ctx.lineWidth = isBoss ? 4 : 3;
      ctx.lineJoin = 'round';
      ctx.miterLimit = 2;
      if (i < typed) {
        ctx.font = isBoss ? `700 ${fs}px Inter, sans-serif` : getFont(this.width, 600);
        ctx.fillStyle = `rgba(103,232,249,${word.opacity})`;
        ctx.shadowColor = 'rgba(103,232,249,0.8)';
        ctx.shadowBlur = 10;
      } else if (word.destroying) {
        ctx.font = getFont(this.width);
        ctx.fillStyle = `rgba(99,102,241,${word.opacity * 0.25})`;
        ctx.shadowBlur = 0;
      } else {
        ctx.font = isBoss ? `700 ${fs}px Inter, sans-serif` : getFont(this.width);
        ctx.fillStyle = `rgba(255,255,255,${Math.min(1, Math.max(0.88, word.opacity))})`;
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
      }
      ctx.strokeText(char, textX, textY);
      ctx.fillText(char, textX, textY);
      ctx.shadowBlur = 0;
      ctx.shadowColor = 'transparent';
      textX += ctx.measureText(char).width + letterSpacing;
    }

    if (typed > 0 && !word.destroying) {
      ctx.strokeStyle = `rgba(103,232,249,${word.opacity * 0.7})`;
      ctx.lineWidth = 2.5;
      ctx.shadowColor = 'rgba(103,232,249,0.6)';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(cx - advance / 2, textY + fs * 0.52);
      let ulW = 0;
      ctx.font = getFont(this.width, 600);
      for (let i = 0; i < typed; i++) ulW += ctx.measureText(text[i]).width + letterSpacing;
      ctx.lineTo(cx - advance / 2 + ulW, textY + fs * 0.52);
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.shadowColor = 'transparent';
    }

    ctx.textAlign = 'start';
    ctx.textBaseline = 'alphabetic';
    ctx.restore();
  }

  private getCrabPalette(danger: number, isBoss: boolean, opacity: number) {
    const base = isBoss ? { r: 153, g: 27, b: 27 } : { r: 220, g: 38, b: 38 };
    const top = isBoss ? { r: 185, g: 28, b: 28 } : { r: 239, g: 68, b: 68 };
    const shadow = isBoss ? { r: 127, g: 29, b: 29 } : { r: 185, g: 28, b: 28 };
    const tint = Math.round(danger * 10);
    const a = Math.max(0.18, opacity);
    const rgba = (r: number, g: number, b: number, alpha = a) => `rgba(${r},${g},${b},${alpha})`;
    return {
      fill: rgba(base.r + tint, base.g + Math.round(danger * 6), base.b),
      fill2: rgba(top.r + tint, top.g + Math.round(danger * 5), top.b),
      dark: rgba(shadow.r + Math.round(danger * 5), shadow.g, shadow.b),
      legAlt: rgba(Math.min(255, base.r + 18), Math.min(255, base.g + 24), Math.max(0, base.b - 6)),
      stroke: `rgba(0,0,0,${opacity})`,
      eye: `rgba(255,255,255,${opacity})`,
      pupil: `rgba(0,0,0,${opacity})`,
      glow: isBoss ? `rgba(220,38,38,${0.22 + danger * 0.1})` : `rgba(239,68,68,${0.12 + danger * 0.05})`,
      crack: `rgba(255,220,190,${opacity * 0.18})`,
      crown: `rgba(245,198,59,${opacity})`,
    };
  }

  private getPixelSize(bodyW: number, bodyH: number) {
    return Math.max(4, Math.round(Math.min(bodyW / 18, bodyH / 10)));
  }

  private pixelRect(x: number, y: number, w: number, h: number, fill: string, stroke = C_CRAB_OUTLINE, lineWidth = 2) {
    const ctx = this.ctx;
    const rx = Math.round(x);
    const ry = Math.round(y);
    const rw = Math.max(1, Math.round(w));
    const rh = Math.max(1, Math.round(h));
    ctx.fillStyle = fill;
    ctx.fillRect(rx, ry, rw, rh);
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lineWidth;
    ctx.strokeRect(rx + 0.5, ry + 0.5, rw, rh);
  }

  private drawCrabBody(cx: number, cy: number, bodyW: number, bodyH: number, shell: ReturnType<Renderer['getCrabPalette']>, isBoss: boolean, opacity: number, targeted: boolean) {
    const ctx = this.ctx;
    const px = this.getPixelSize(bodyW, bodyH);
    const cols = Math.max(isBoss ? 16 : 14, Math.round(bodyW / px));
    const rows = isBoss
      ? [
          Math.max(8, cols - 8),
          cols - 4,
          cols - 2,
          cols,
          cols,
          cols - 1,
          cols - 3,
          cols - 6,
        ]
      : [
          Math.max(8, cols - 6),
          cols - 2,
          cols,
          cols,
          cols - 1,
          cols - 3,
          cols - 5,
        ];
    const maxCols = Math.max(...rows);
    const bodyX = cx - (maxCols * px) / 2;
    const bodyY = cy - rows.length * px * 0.62;

    ctx.save();
    ctx.globalAlpha = opacity;
    if (isBoss) {
      const pulse = 0.6 + Math.sin(this.time * 4) * 0.2;
      ctx.fillStyle = shell.glow;
      ctx.beginPath();
      ctx.ellipse(cx, cy, bodyW * 0.72, bodyH * 0.62, 0, 0, Math.PI * 2);
      ctx.globalAlpha = opacity * pulse * 0.55;
      ctx.fill();
      ctx.globalAlpha = opacity;
    }
    for (let row = 0; row < rows.length; row++) {
      const count = rows[row];
      const offset = (maxCols - count) / 2;
      for (let col = 0; col < count; col++) {
        const x = bodyX + (offset + col) * px;
        const y = bodyY + row * px;
        const highlightBand = row <= 1 || (row === 2 && col > 1 && col < count - 2);
        const shadowBand = row >= rows.length - 2 || (row === rows.length - 3 && (col < 2 || col > count - 3));
        const fill = highlightBand ? shell.fill2 : shadowBand ? shell.dark : shell.fill;
        this.pixelRect(x, y, px, px, fill, shell.stroke, 2.2);
      }
    }
    this.pixelRect(bodyX + px * 2, bodyY + px * 2, px * 2, px, shell.fill2, shell.stroke, 2.2);
    this.pixelRect(bodyX + maxCols * px - px * 4, bodyY + px * 2, px * 2, px, shell.fill2, shell.stroke, 2.2);
    this.pixelRect(bodyX + px * 3, bodyY + rows.length * px - px * 2, px * 2, px, shell.dark, shell.stroke, 2.2);
    this.pixelRect(bodyX + maxCols * px - px * 5, bodyY + rows.length * px - px * 2, px * 2, px, shell.dark, shell.stroke, 2.2);
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = shell.stroke;
    ctx.lineWidth = 2.4;
    this.traceCrabBody(cx, cy, bodyW, bodyH, isBoss);
    ctx.stroke();

    if (targeted) {
      ctx.strokeStyle = `rgba(103,232,249,${0.62 + Math.sin(this.time * 10) * 0.18})`;
      ctx.lineWidth = 2.4;
      ctx.setLineDash([5, 3]);
      ctx.lineDashOffset = -this.time * 50;
      this.traceCrabBody(cx, cy, bodyW * 1.04, bodyH * 1.08, isBoss);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    if (isBoss) {
      const crownY = bodyY - px * 2;
      const spikeY = bodyY - px;
      for (let i = -3; i <= 3; i++) {
        if (i % 2 === 0) {
          this.pixelRect(cx + i * px * 1.1, spikeY, px, px, shell.dark, shell.stroke, 2.2);
        }
      }
      this.pixelRect(cx - px * 3, crownY, px * 6, px, shell.crown, shell.stroke, 2.2);
      this.pixelRect(cx - px * 2.5, crownY - px, px, px, shell.crown, shell.stroke, 2.2);
      this.pixelRect(cx - px * 0.5, crownY - px * 1.6, px, px * 1.6, shell.crown, shell.stroke, 2.2);
      this.pixelRect(cx + px * 1.5, crownY - px, px, px, shell.crown, shell.stroke, 2.2);
    }
    ctx.restore();
  }

  private drawCrabBodyFragments(cx: number, cy: number, bodyW: number, bodyH: number, shell: ReturnType<Renderer['getCrabPalette']>, isBoss: boolean, opacity: number, destroyProgress: number) {
    const ctx = this.ctx;
    const px = this.getPixelSize(bodyW, bodyH);
    const cols = Math.max(isBoss ? 16 : 14, Math.round(bodyW / px));
    const rows = isBoss
      ? [Math.max(8, cols - 8), cols - 4, cols - 2, cols, cols, cols - 1, cols - 3, cols - 6]
      : [Math.max(8, cols - 6), cols - 2, cols, cols, cols - 1, cols - 3, cols - 5];
    const maxCols = Math.max(...rows);
    const startX = cx - (maxCols * px) / 2;
    const startY = cy - rows.length * px * 0.62;

    ctx.save();
    ctx.globalAlpha = opacity;
    for (let row = 0; row < rows.length; row++) {
      const count = rows[row];
      const offset = (maxCols - count) / 2;
      for (let col = 0; col < count; col++) {
        const x = startX + (offset + col) * px;
        const y = startY + row * px;
        const dirX = col < count / 2 ? -1 : 1;
        const driftX = dirX * (destroyProgress * (12 + (col % 4) * 5) + row * 0.8);
        const driftY = destroyProgress * (12 + row * 4 + (col % 3) * 3);
        const wobble = Math.sin(this.time * 18 + row * 2 + col) * destroyProgress * 2;
        const fill = row <= 1 ? shell.fill2 : row >= rows.length - 2 ? shell.dark : shell.fill;
        this.pixelRect(x + driftX, y + driftY + wobble, px, px, fill, shell.stroke, 2.2);
      }
    }
    for (const side of [-1, 1] as const) {
      for (let i = 0; i < 3; i++) {
        const segX = cx + side * (bodyW * 0.18 + i * px * 2 + destroyProgress * 24);
        const segY = cy + bodyH * 0.12 + i * px * 1.7 + destroyProgress * 20;
        this.pixelRect(segX, segY, px * 1.4, px, i % 2 === 0 ? shell.legAlt : shell.fill, shell.stroke, 2.2);
      }
    }
    ctx.restore();
  }

  private drawCrabClaw(cx: number, cy: number, bodyW: number, bodyH: number, side: -1 | 1, clawCycle: number, shell: ReturnType<Renderer['getCrabPalette']>, isBoss: boolean, opacity: number, destroying: boolean, destroyProgress: number) {
    const ctx = this.ctx;
    const px = this.getPixelSize(bodyW, bodyH);
    const attachX = cx + side * bodyW * 0.29;
    const attachY = cy + bodyH * 0.2;
    const openStep = 1 + ((clawCycle + 1) / 2) * (isBoss ? 2.4 : 2);
    const driftX = destroying ? side * (18 + destroyProgress * 40) : 0;
    const driftY = destroying ? destroyProgress * 28 : 0;
    const rotation = destroying ? side * destroyProgress * 0.9 : side * (0.12 + clawCycle * 0.04);
    const armLen = px * (isBoss ? 4.6 : 4);

    ctx.save();
    ctx.translate(attachX + driftX, attachY + driftY);
    ctx.rotate(rotation);
    ctx.globalAlpha = opacity;
    for (let i = 0; i < 3; i++) {
      const segX = side > 0 ? i * px * 1.15 : -(i + 1) * px * 1.15;
      this.pixelRect(segX, i % 2 === 0 ? -px * 0.2 : px * 0.15, px * 1.2, px, i % 2 === 0 ? shell.fill : shell.dark, shell.stroke, 2.2);
    }

    const jawBaseX = side > 0 ? armLen : -armLen - px * 2.6;
    const upperY = -px * (1.2 + openStep * 0.55);
    const lowerY = px * (0.8 + openStep * 0.4);
    this.pixelRect(jawBaseX, -px * 0.35, px * 2.6, px * 1.3, shell.fill, shell.stroke, 2.2);
    this.pixelRect(jawBaseX + side * px * 1.3, upperY, px * 3, px * 1.1, shell.fill2, shell.stroke, 2.2);
    this.pixelRect(jawBaseX + side * px * 2.8, upperY - px, px * 1.4, px, shell.fill2, shell.stroke, 2.2);
    this.pixelRect(jawBaseX + side * px * 1.3, lowerY, px * 3, px * 1.1, shell.fill2, shell.stroke, 2.2);
    this.pixelRect(jawBaseX + side * px * 2.8, lowerY + px * 1.1, px * 1.4, px, shell.dark, shell.stroke, 2.2);
    this.pixelRect(jawBaseX + side * px * 0.8, lowerY + px * 0.4, px * 1.6, px * 0.8, shell.dark, shell.stroke, 2.2);
    ctx.restore();
  }

  private drawCrabLeg(cx: number, cy: number, bodyW: number, bodyH: number, side: -1 | 1, yOffset: number, spread: number, stride: number, color: string, opacity: number, destroying: boolean, destroyProgress: number) {
    const ctx = this.ctx;
    const px = this.getPixelSize(bodyW, bodyH);
    const startX = cx + side * bodyW * 0.16;
    const startY = cy + yOffset;
    const driftX = destroying ? side * (8 + destroyProgress * 22 + yOffset * 0.03) : 0;
    const driftY = destroying ? destroyProgress * (18 + yOffset * 0.05) : 0;
    const step = Math.round(stride / Math.max(1, px * 0.55));
    const points = [
      { x: startX, y: startY },
      { x: startX + side * (spread * 0.55 + step * px * 0.7) + driftX, y: startY + px * 1.1 + driftY },
      { x: startX + side * (spread * 1.05 + step * px) + driftX, y: startY + px * 2.5 + driftY },
      { x: startX + side * (spread * 1.55 + step * px * 1.15) + driftX, y: startY + px * 4.2 + driftY },
    ];

    ctx.save();
    ctx.globalAlpha = opacity;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const segColor = i % 2 === 0 ? color : this.getCrabPalette(0, false, opacity).legAlt;
      const width = Math.abs(p1.x - p0.x);
      const height = Math.abs(p1.y - p0.y);
      this.pixelRect(
        Math.min(p0.x, p1.x),
        Math.min(p0.y, p1.y),
        Math.max(px * 1.15, width + px * 0.55),
        Math.max(px, height + px * 0.55),
        segColor,
        C_CRAB_OUTLINE,
        2,
      );
    }
    ctx.restore();
  }

  private drawCrabEyes(cx: number, cy: number, bodyW: number, bodyH: number, eyeColor: string, opacity: number, destroying: boolean, destroyProgress: number) {
    const ctx = this.ctx;
    const px = this.getPixelSize(bodyW, bodyH);
    const driftY = destroying ? destroyProgress * 10 : 0;
    const eyeLook = Math.sin(this.time * 1.8) * px * 0.18;
    for (const side of [-1, 1] as const) {
      const stalkX = cx + side * bodyW * 0.16;
      const stalkTopY = cy - bodyH * 0.82 + driftY;
      const stalkBaseY = cy - bodyH * 0.48 + driftY;
      ctx.save();
      ctx.globalAlpha = opacity;
      this.pixelRect(stalkX - px * 0.45, stalkBaseY, px * 0.9, px * 2.2, eyeColor, C_CRAB_OUTLINE, 2);
      this.pixelRect(stalkX + side * px * 0.15, stalkTopY, px * 1.5, px * 1.5, eyeColor, C_CRAB_OUTLINE, 2);
      this.pixelRect(stalkX + side * (px * 0.7 + eyeLook), stalkTopY + px * 0.55, px * 0.45, px * 0.45, `rgba(0,0,0,${opacity})`, C_CRAB_OUTLINE, 1.2);
      ctx.restore();
    }
  }

  private traceCrabBody(cx: number, cy: number, bodyW: number, bodyH: number, isBoss: boolean) {
    const ctx = this.ctx;
    const px = this.getPixelSize(bodyW, bodyH);
    const cols = Math.max(isBoss ? 16 : 14, Math.round(bodyW / px));
    const rows = isBoss
      ? [Math.max(8, cols - 8), cols - 4, cols - 2, cols, cols, cols - 1, cols - 3, cols - 6]
      : [Math.max(8, cols - 6), cols - 2, cols, cols, cols - 1, cols - 3, cols - 5];
    const maxCols = Math.max(...rows);
    const startX = cx - (maxCols * px) / 2;
    const startY = cy - rows.length * px * 0.62;
    const points: { x: number; y: number }[] = [];
    ctx.beginPath();
    for (let row = 0; row < rows.length; row++) {
      const offset = (maxCols - rows[row]) / 2;
      points.push({ x: startX + offset * px, y: startY + row * px + (row === 0 ? px * 0.4 : 0) });
    }
    for (let row = rows.length - 1; row >= 0; row--) {
      const offset = (maxCols - rows[row]) / 2;
      points.push({ x: startX + (offset + rows[row]) * px, y: startY + (row + 1) * px - (row === rows.length - 1 ? px * 0.35 : 0) });
    }
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
    ctx.closePath();
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
