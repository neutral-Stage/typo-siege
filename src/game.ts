import type { FallingWord } from './entities';
import type { PowerUpState } from './power';
import { getWordsForWave, getSpawnInterval, getSpeedMultiplier, isBossWave, getBossWord } from './words';
import { createFallingWord, findTargetWord } from './entities';
import { createPowerUps, distributeCharge, chargeAmount, usePowerUp, isPowerUpKey } from './power';
import { Renderer } from './renderer';
import type { DestroyEffect } from './renderer';
import { soundType, soundDestroy, soundMiss, soundPowerUp, soundWaveComplete, soundGameOver, soundCombo } from './audio';

export type Difficulty = 'easy' | 'normal' | 'hard';

const DIFFICULTY_MULT: Record<Difficulty, { speed: number; spawn: number; lives: number }> = {
  easy:   { speed: 0.7, spawn: 1.3, lives: 5 },
  normal: { speed: 1.0, spawn: 1.0, lives: 3 },
  hard:   { speed: 1.4, spawn: 0.7, lives: 2 },
};

export class Game {
  private renderer: Renderer;
  private phase: 'menu' | 'playing' | 'paused' | 'waveTransition' | 'gameover' = 'menu';
  private words: FallingWord[] = [];
  private powerUps: PowerUpState[];
  private difficulty: Difficulty;
  private diffConfig: typeof DIFFICULTY_MULT[Difficulty];
  private score = 0;
  private lives = 3;
  private wave = 1;
  private combo = 0;
  private maxCombo = 0;
  private wordsDestroyedInWave = 0;
  private wordsPerWave = 18;
  private totalWordsSpawned = 0;
  private spawnTimer = 0;
  private shieldTimer = 0;
  private lastTime = 0;
  private activeTarget: FallingWord | null = null;
  private currentInput = '';
  private onStateChange?: () => void;
  private waveTransTimer = 0;
  private waveTransDuration = 2.5;
  private highScore = parseInt(localStorage.getItem('typo-siege-highscore') || '0', 10);
  private isNewHighScore = false;
  private totalWordsDestroyed = 0;
  private totalCharsTyped = 0;
  private _isBossWave = false;
  private bossSpawned = false;

  private emitState() {
    this.onStateChange?.();
  }

  constructor(private canvas: HTMLCanvasElement, onStateChange?: () => void, difficulty: Difficulty = 'normal') {
    this.renderer = new Renderer(canvas);
    this.renderer.wave = this.wave;
    this.powerUps = createPowerUps();
    this.onStateChange = onStateChange;
    this.difficulty = difficulty;
    this.diffConfig = DIFFICULTY_MULT[difficulty];
  }

  stop() {
    this.phase = 'gameover';
    this.emitState();
  }

  start() {
    this.phase = 'playing';
    this.words = [];
    this.powerUps = createPowerUps();
    this.score = 0;
    this.lives = this.diffConfig.lives;
    this.wave = 1;
    this.renderer.wave = this.wave;
    this.combo = 0;
    this.maxCombo = 0;
    this.wordsDestroyedInWave = 0;
    this.totalWordsSpawned = 0;
    this.spawnTimer = 0;
    this.shieldTimer = 0;
    this.activeTarget = null;
    this.currentInput = '';
    this.isNewHighScore = false;
    this.totalWordsDestroyed = 0;
    this.totalCharsTyped = 0;
    this._isBossWave = false;
    this.bossSpawned = false;
    this.lastTime = performance.now();
    this.emitState();
  }

  handleKey(key: string) {
    if (this.phase !== 'playing') return;

    const puType = isPowerUpKey(key, this.powerUps);
    if (puType) {
      this.activatePowerUp(puType);
      return;
    }

    if (key.length !== 1) return;
    const char = key.toLowerCase();

    if (!this.activeTarget || this.activeTarget.destroying) {
      this.activeTarget = findTargetWord(this.words, char);
    }
    if (!this.activeTarget) return;

    const expected = this.activeTarget.entry.text[this.activeTarget.typed]?.toLowerCase();
    if (char === expected) {
      this.activeTarget.typed++;
      this.totalCharsTyped++;
      this.currentInput = this.activeTarget.entry.text.slice(0, this.activeTarget.typed);
      this.activeTarget.glowIntensity = 1;
      soundType();

      if (this.activeTarget.typed >= this.activeTarget.entry.text.length) {
        this.destroyWord(this.activeTarget, false, 'normal');
        this.activeTarget = null;
        this.currentInput = '';
      }
    }
    this.emitState();
  }

  handleKeyWithFeedback(key: string): boolean {
    if (this.phase !== 'playing') return false;

    const isPUKey = ['1', '2', '3', '4'].includes(key);
    if (isPUKey) {
      const puType = isPowerUpKey(key, this.powerUps);
      if (puType) {
        this.activatePowerUp(puType);
        return true;
      }
      return false;
    }

    this.handleKey(key);
    return true;
  }

  private destroyWord(word: FallingWord, silent = false, effect: DestroyEffect = 'normal', waveProgress = this.getWaveProgressValue(word)) {
    if (word.destroying) return;

    word.destroying = true;
    word.destroyTimer = 0.4;

    const comboMult = 1 + this.combo * 0.1;
    const points = Math.ceil(word.entry.points * comboMult);
    this.score += points;
    this.combo++;
    this.totalWordsDestroyed++;
    if (this.combo > this.maxCombo) this.maxCombo = this.combo;

    // Only charge power-ups from typing kills, not from power-up effects
    if (!silent) {
      const charge = chargeAmount(word.entry.text.length, word.entry.difficulty);
      distributeCharge(this.powerUps, charge);
    }

    this.spawnEffectForWord(word, effect);

    // Screen shake — stronger for longer words and bosses
    const wordLen = word.entry.text.length;
    const isBoss = word.entry.difficulty >= 5;
    const intensity = Math.min(12, 4 + wordLen * 0.8 + (isBoss ? 5 : 0));
    this.renderer.shake(intensity, 0.2 + (isBoss ? 0.15 : 0));

    if (!silent) {
      soundDestroy();
      if (this.combo > 1) {
        this.renderer.showCombo(this.combo);
        soundCombo(this.combo);
      }
    }

    this.applyWaveProgress(waveProgress);

    this.emitState();
  }

  private getWaveProgressValue(word: FallingWord): number {
    const isBoss = word.entry.difficulty >= 5;
    return isBoss ? 2 : 1;
  }

  private applyWaveProgress(amount: number) {
    if (amount <= 0) return;
    this.wordsDestroyedInWave += amount;
    if (this.wordsDestroyedInWave >= this.wordsPerWave) {
      this.nextWave();
    }
  }

  private spawnEffectForWord(word: FallingWord, effect: DestroyEffect) {
    switch (effect) {
      case 'fire':      this.renderer.spawnFireParticles(word); break;
      case 'lightning':  this.renderer.spawnLightningParticles(word); break;
      case 'shield':     this.renderer.spawnShieldParticles(word); break;
      case 'chain':      this.renderer.spawnChainParticles(word); break;
      default:           this.renderer.spawnDestroyParticles(word); break;
    }
  }

  private loseLife() {
    this.lives--;
    this.combo = 0;
    soundMiss();
    if (this.lives <= 0) {
      this.phase = 'gameover';
      this.saveHighScore();
      soundGameOver();
    }
    this.emitState();
  }

  private nextWave() {
    this.wave++;
    this.renderer.wave = this.wave;
    this.wordsDestroyedInWave = 0;
    this.wordsPerWave = Math.min(35, 18 + this.wave * 3);
    this.totalWordsSpawned = 0;
    this.bossSpawned = false;

    // Check if boss wave
    this._isBossWave = isBossWave(this.wave);

    if (this.wave > 2) {
      this.phase = 'waveTransition';
      this.waveTransTimer = this.waveTransDuration;
      soundWaveComplete();
    }

    this.emitState();
  }

  private activatePowerUp(type: string) {
    if (!usePowerUp(this.powerUps, type as any)) return;
    soundPowerUp();

    switch (type) {
      case 'fire': {
        const snapshot = this.words.filter(w => !w.destroying);
        const fireTargets = snapshot.filter(w => w.entry.difficulty < 5);

        let waveProgress = 0;
        for (const w of snapshot) {
          if (w.entry.difficulty >= 5) continue;
          waveProgress += this.getWaveProgressValue(w);
          this.destroyWord(w, true, 'fire', 0);
        }
        if (fireTargets.length > 0) this.applyWaveProgress(waveProgress);
        this.renderer.showScreenFlash('rgba(239,68,68,0.4)');
        break;
      }
      case 'lightning': {
        const longest = this.words
          .filter(w => !w.destroying)
          .sort((a, b) => b.entry.text.length - a.entry.text.length)[0];
        if (longest) this.destroyWord(longest, false, 'lightning');
        this.renderer.showScreenFlash('rgba(234,179,8,0.4)');
        break;
      }
      case 'shield':
        this.shieldTimer = 5;
        this.renderer.showShieldFlash();
        this.renderer.showScreenFlash('rgba(99,102,241,0.4)');
        break;
      case 'chain': {
        const bottom = this.words
          .filter(w => !w.destroying)
          .sort((a, b) => b.y - a.y)[0];
        if (bottom) {
          this.destroyWord(bottom, false, 'chain');
          for (const w of this.words) {
            if (!w.destroying && w !== bottom) {
              const dist = Math.abs(w.y - bottom.y) + Math.abs(w.x - bottom.x);
              if (dist < 200) {
                w.typed = Math.floor(w.entry.text.length * 0.5);
              }
            }
          }
          this.renderer.showScreenFlash('rgba(249,115,22,0.4)');
        }
        break;
      }
    }
    this.emitState();
  }

  private saveHighScore() {
    if (this.score > this.highScore) {
      this.highScore = this.score;
      this.isNewHighScore = true;
      localStorage.setItem('typo-siege-highscore', String(this.score));
    }
  }

  togglePause(): boolean {
    if (this.phase === 'playing') {
      this.phase = 'paused';
      this.emitState();
      return true;
    }
    if (this.phase === 'paused') {
      this.phase = 'playing';
      this.lastTime = performance.now();
      this.emitState();
      return true;
    }
    return false;
  }

  private renderCurrentFrame(frozen = false) {
    this.renderer.beginFrame();
    this.renderer.clear(frozen);
    this.renderer.drawWords(this.words, this.activeTarget);
    this.renderer.updateAndDrawParticles(0);
    this.renderer.drawCombo();
    this.renderer.endFrame();
  }

  update(time: number) {
    const dt = Math.min((time - this.lastTime) / 1000, 0.1);
    this.lastTime = time;

    if (this.phase === 'waveTransition') {
      this.waveTransTimer -= dt;
      this.renderer.beginFrame();
      this.renderer.clear(false);
      this.renderer.drawWaveTransition(this.wave, this.waveTransTimer / this.waveTransDuration);
      this.renderer.updateAndDrawParticles(dt);
      this.renderer.endFrame();
      if (this.waveTransTimer <= 0) {
        this.phase = 'playing';
        this.lastTime = time;
      }
      return;
    }

    if (this.phase === 'paused') {
      this.renderCurrentFrame(this.shieldTimer > 0);
      return;
    }

    if (this.phase !== 'playing') return;

    const W = this.renderer.width;
    const H = this.renderer.height;
    const speedMult = getSpeedMultiplier(this.wave) * this.diffConfig.speed;
    const frozen = this.shieldTimer > 0;

    if (this.shieldTimer > 0) this.shieldTimer -= dt;

    // Spawn words
    this.spawnTimer -= dt * 1000 * this.diffConfig.spawn;
    if (this.spawnTimer <= 0 && this.totalWordsSpawned < this.wordsPerWave) {
      // Boss word on boss waves
      if (this._isBossWave && !this.bossSpawned) {
        const bossEntry = getBossWord();
        this.words.push(createFallingWord(bossEntry, W, speedMult * 0.5)); // Boss is slower
        this.bossSpawned = true;
      }

      const wordPool = getWordsForWave(this.wave);
      const entry = wordPool[Math.floor(Math.random() * wordPool.length)];
      this.words.push(createFallingWord(entry, W, speedMult));
      this.totalWordsSpawned++;
      this.spawnTimer = getSpawnInterval(this.wave) + Math.random() * 500;
    }

    // Update words
    for (const word of this.words) {
      if (word.destroying) {
        word.destroyTimer -= dt;
        word.opacity = Math.max(0, word.destroyTimer / 0.4);
        continue;
      }
      if (!frozen) {
        word.y += word.speed * dt;
      }
      word.glowIntensity = Math.max(0, word.glowIntensity - dt * 3);

      if (word.y > H - 60) {
        word.destroying = true;
        word.destroyTimer = 0;
        word.opacity = 0;
        // Count missed words toward wave progress so wave can still advance
        this.wordsDestroyedInWave++;
        this.loseLife();
      }
    }

    this.words = this.words.filter(w => !(w.destroying && w.opacity <= 0 && w.destroyTimer <= -0.1));

    this.renderer.beginFrame();
    this.renderer.clear(frozen);
    this.renderer.drawWords(this.words, this.activeTarget);
    this.renderer.updateAndDrawParticles(dt);
    this.renderer.drawCombo();
    this.renderer.endFrame();
  }

  // Public getters
  get typedText(): string { return this.currentInput; }
  get isPlaying(): boolean { return this.phase === 'playing'; }
  get isPaused(): boolean { return this.phase === 'paused'; }
  get isGameOver(): boolean { return this.phase === 'gameover'; }
  get currentScore(): number { return this.score; }
  get currentWave(): number { return this.wave; }
  get currentLives(): number { return this.lives; }
  get currentCombo(): number { return this.combo; }
  get bestCombo(): number { return this.maxCombo; }
  get puStates(): PowerUpState[] { return this.powerUps; }
  get shieldActive(): boolean { return this.shieldTimer > 0; }
  get rendererRef(): Renderer { return this.renderer; }
  get savedHighScore(): number { return this.highScore; }
  get isNewHigh(): boolean { return this.isNewHighScore; }
  get wordsDestroyed(): number { return this.totalWordsDestroyed; }
  get charsTyped(): number { return this.totalCharsTyped; }
  get isBossWaveFlag(): boolean { return this._isBossWave; }
}
