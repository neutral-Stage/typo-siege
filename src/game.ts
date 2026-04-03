import type { FallingWord } from './entities';
import type { PowerUpState } from './power';
import { getWordsForWave, getSpawnInterval, getSpeedMultiplier } from './words';
import { createFallingWord, findTargetWord } from './entities';
import { createPowerUps, distributeCharge, chargeAmount, usePowerUp, isPowerUpKey } from './power';
import { Renderer } from './renderer';
import type { DestroyEffect } from './renderer';
import { soundType, soundDestroy, soundMiss, soundPowerUp, soundWaveComplete, soundGameOver, soundCombo } from './audio';

export class Game {
  private renderer: Renderer;
  private phase: 'menu' | 'playing' | 'waveTransition' | 'gameover' = 'menu';
  private words: FallingWord[] = [];
  private powerUps: PowerUpState[];
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

  private emitState() {
    this.onStateChange?.();
  }

  constructor(private canvas: HTMLCanvasElement, onStateChange?: () => void) {
    this.renderer = new Renderer(canvas);
    this.powerUps = createPowerUps();
    this.onStateChange = onStateChange;
  }

  start() {
    this.phase = 'playing';
    this.words = [];
    this.powerUps = createPowerUps();
    this.score = 0;
    this.lives = 3;
    this.wave = 1;
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
    this.lastTime = performance.now();
    this.emitState();
  }

  handleKey(key: string) {
    if (this.phase !== 'playing') return;

    // Power-up activation
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

  private destroyWord(word: FallingWord, silent = false, effect: DestroyEffect = 'normal') {
    word.destroying = true;
    word.destroyTimer = 0.4;

    const comboMult = 1 + this.combo * 0.1;
    const points = Math.ceil(word.entry.points * comboMult);
    this.score += points;
    this.combo++;
    this.totalWordsDestroyed++;
    if (this.combo > this.maxCombo) this.maxCombo = this.combo;

    const charge = chargeAmount(word.entry.text.length, word.entry.difficulty);
    distributeCharge(this.powerUps, charge);

    // Spawn unique effect particles
    this.spawnEffectForWord(word, effect);

    if (!silent) {
      soundDestroy();
      if (this.combo > 1) {
        this.renderer.showCombo(this.combo);
        soundCombo(this.combo);
      }
    }

    this.wordsDestroyedInWave++;
    if (this.wordsDestroyedInWave >= this.wordsPerWave) {
      this.nextWave();
    }

    this.emitState();
  }

  private spawnEffectForWord(word: FallingWord, effect: DestroyEffect) {
    switch (effect) {
      case 'fire':
        this.renderer.spawnFireParticles(word);
        break;
      case 'lightning':
        this.renderer.spawnLightningParticles(word);
        break;
      case 'shield':
        this.renderer.spawnShieldParticles(word);
        break;
      case 'chain':
        this.renderer.spawnChainParticles(word);
        break;
      default:
        this.renderer.spawnDestroyParticles(word);
        break;
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
    this.wordsDestroyedInWave = 0;
    this.wordsPerWave = Math.min(35, 18 + this.wave * 3);
    this.totalWordsSpawned = 0;

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
        const snapshot = [...this.words];
        for (const w of snapshot) {
          if (!w.destroying) this.destroyWord(w, true, 'fire');
        }
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

  update(time: number) {
    const dt = Math.min((time - this.lastTime) / 1000, 0.1);
    this.lastTime = time;

    if (this.phase === 'waveTransition') {
      this.waveTransTimer -= dt;
      this.renderer.clear(false);
      this.renderer.drawWaveTransition(this.wave, this.waveTransTimer / this.waveTransDuration);
      this.renderer.updateAndDrawParticles(dt);
      if (this.waveTransTimer <= 0) {
        this.phase = 'playing';
        this.lastTime = time;
      }
      return;
    }

    if (this.phase !== 'playing') return;

    const W = this.renderer.width;
    const H = this.renderer.height;
    const speedMult = getSpeedMultiplier(this.wave);
    const frozen = this.shieldTimer > 0;

    if (this.shieldTimer > 0) this.shieldTimer -= dt;

    // Spawn words
    this.spawnTimer -= dt * 1000;
    if (this.spawnTimer <= 0 && this.totalWordsSpawned < this.wordsPerWave) {
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
        this.loseLife();
      }
    }

    this.words = this.words.filter(w => !(w.destroying && w.opacity <= 0 && w.destroyTimer <= -0.1));

    this.renderer.clear(frozen);
    this.renderer.drawWords(this.words, this.activeTarget);
    this.renderer.updateAndDrawParticles(dt);
    this.renderer.drawCombo();
  }

  // Public getters
  get typedText(): string { return this.currentInput; }
  get isPlaying(): boolean { return this.phase === 'playing'; }
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
}
