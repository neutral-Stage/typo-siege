// Web Audio API sound effects — zero dependencies
const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
let ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioCtx();
  return ctx;
}

function play(freq: number, duration: number, type: OscillatorType = 'sine', volume = 0.1) {
  try {
    const c = getCtx();
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.value = volume;
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
    osc.connect(gain);
    gain.connect(c.destination);
    osc.start(c.currentTime);
    osc.stop(c.currentTime + duration);
  } catch {}
}

export function soundType() {
  play(800 + Math.random() * 200, 0.06, 'square', 0.05);
}

export function soundDestroy() {
  play(600, 0.08, 'sine', 0.08);
  setTimeout(() => play(900, 0.1, 'sine', 0.06), 40);
  setTimeout(() => play(1200, 0.15, 'sine', 0.04), 80);
}

export function soundMiss() {
  play(200, 0.3, 'sawtooth', 0.08);
}

export function soundPowerUp() {
  play(400, 0.1, 'sine', 0.1);
  setTimeout(() => play(600, 0.1, 'sine', 0.08), 60);
  setTimeout(() => play(800, 0.1, 'sine', 0.06), 120);
  setTimeout(() => play(1000, 0.2, 'sine', 0.05), 180);
}

export function soundWaveComplete() {
  const notes = [523, 659, 784, 1047];
  notes.forEach((n, i) => {
    setTimeout(() => play(n, 0.2, 'sine', 0.08), i * 100);
  });
}

export function soundGameOver() {
  play(400, 0.3, 'sawtooth', 0.1);
  setTimeout(() => play(300, 0.3, 'sawtooth', 0.08), 200);
  setTimeout(() => play(200, 0.5, 'sawtooth', 0.06), 400);
}

export function soundCombo(combo: number) {
  const base = 600 + combo * 50;
  play(base, 0.12, 'sine', 0.06);
}
