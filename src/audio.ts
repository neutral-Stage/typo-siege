// Web Audio API sound effects + background music — zero dependencies
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

// ─── Background Music — electronic battle theme ───

let musicGain: GainNode | null = null;
let masterGain: GainNode | null = null;
let musicPlaying = false;
let musicMuted = false;
let musicNodes: OscillatorNode[] = [];
let musicTimeouts: ReturnType<typeof setTimeout>[] = [];

function initMusicNodes() {
  const c = getCtx();

  masterGain = c.createGain();
  masterGain.gain.value = musicMuted ? 0 : 0.15;
  masterGain.connect(c.destination);

  musicGain = c.createGain();
  musicGain.gain.value = 0;
  musicGain.connect(masterGain);

  // Warm pad — triangle wave Em7 chord (E3, G3, B3, D4)
  const padFreqs = [164.81, 196, 246.94, 293.66];
  for (const freq of padFreqs) {
    const osc = c.createOscillator();
    osc.type = 'triangle';
    osc.frequency.value = freq;
    const g = c.createGain();
    g.gain.value = 0.08;
    osc.connect(g);
    g.connect(musicGain!);
    osc.start();
    musicNodes.push(osc);
  }

  // Start rhythmic patterns
  scheduleKick();
  scheduleHihat();
  scheduleLead();
  scheduleRiser();
}

// ─── Kick drum — every 0.4s ───
function scheduleKick() {
  if (!musicPlaying) return;
  const t = setTimeout(() => {
    if (!musicPlaying || musicMuted) { scheduleKick(); return; }
    try {
      const c = getCtx();
      const osc = c.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(150, c.currentTime);
      osc.frequency.exponentialRampToValueAtTime(30, c.currentTime + 0.12);
      const g = c.createGain();
      g.gain.setValueAtTime(0.3, c.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.15);
      osc.connect(g);
      g.connect(musicGain!);
      osc.start(c.currentTime);
      osc.stop(c.currentTime + 0.15);
    } catch {}
    scheduleKick();
  }, 400);
  musicTimeouts.push(t);
}

// ─── Hihat — every 0.2s ───
function scheduleHihat() {
  if (!musicPlaying) return;
  const t = setTimeout(() => {
    if (!musicPlaying || musicMuted) { scheduleHihat(); return; }
    try {
      const c = getCtx();
      // White noise burst via buffer
      const bufferSize = c.sampleRate * 0.04;
      const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
      const noise = c.createBufferSource();
      noise.buffer = buffer;

      const filter = c.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 8000;

      const g = c.createGain();
      g.gain.setValueAtTime(0.06, c.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.04);

      noise.connect(filter);
      filter.connect(g);
      g.connect(musicGain!);
      noise.start(c.currentTime);
    } catch {}
    scheduleHihat();
  }, 200);
  musicTimeouts.push(t);
}

// ─── Lead melody — Em pentatonic phrases ───
const LEAD_SCALE = [329.63, 392, 440, 493.88, 587.33, 659.25, 784, 880];

function scheduleLead() {
  if (!musicPlaying) return;
  const delay = 600 + Math.random() * 1200;
  const t = setTimeout(() => {
    if (!musicPlaying || musicMuted) { scheduleLead(); return; }
    try {
      const c = getCtx();
      const noteCount = 2 + Math.floor(Math.random() * 4);
      const baseIdx = Math.floor(Math.random() * (LEAD_SCALE.length - noteCount));

      for (let i = 0; i < noteCount; i++) {
        const freq = LEAD_SCALE[baseIdx + i];
        const osc = c.createOscillator();
        osc.type = 'square';
        osc.frequency.value = freq;

        const filter = c.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 1500;
        filter.Q.value = 3;

        const g = c.createGain();
        const noteStart = c.currentTime + i * 0.12;
        g.gain.setValueAtTime(0.04, noteStart);
        g.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.2);

        osc.connect(filter);
        filter.connect(g);
        g.connect(musicGain!);
        osc.start(noteStart);
        osc.stop(noteStart + 0.2);
      }
    } catch {}
    scheduleLead();
  }, delay);
  musicTimeouts.push(t);
}

// ─── Riser — ascending sweep every 8-12s ───
function scheduleRiser() {
  if (!musicPlaying) return;
  const delay = 8000 + Math.random() * 4000;
  const t = setTimeout(() => {
    if (!musicPlaying || musicMuted) { scheduleRiser(); return; }
    try {
      const c = getCtx();
      const osc = c.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(100, c.currentTime);
      osc.frequency.exponentialRampToValueAtTime(2000, c.currentTime + 2);

      const filter = c.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(200, c.currentTime);
      filter.frequency.exponentialRampToValueAtTime(3000, c.currentTime + 2);

      const g = c.createGain();
      g.gain.setValueAtTime(0.01, c.currentTime);
      g.gain.linearRampToValueAtTime(0.05, c.currentTime + 1.5);
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 2);

      osc.connect(filter);
      filter.connect(g);
      g.connect(musicGain!);
      osc.start(c.currentTime);
      osc.stop(c.currentTime + 2);
    } catch {}
    scheduleRiser();
  }, delay);
  musicTimeouts.push(t);
}

export function startMusic() {
  if (musicPlaying) return;
  try {
    const c = getCtx();
    if (c.state === 'suspended') c.resume();
    musicPlaying = true;
    initMusicNodes();
    if (musicGain) {
      const now = c.currentTime;
      musicGain.gain.setValueAtTime(0, now);
      musicGain.gain.linearRampToValueAtTime(1, now + 1);
    }
  } catch (e) {
    console.warn('startMusic failed', e);
    musicPlaying = false;
  }
}

export function stopMusic() {
  if (!musicPlaying) return;
  musicPlaying = false;
  try {
    const c = getCtx();
    if (musicGain) {
      musicGain.gain.linearRampToValueAtTime(0, c.currentTime + 0.3);
    }
  } catch {}
  setTimeout(() => {
    musicNodes.forEach(n => { try { n.stop(); } catch {} });
    musicNodes = [];
    musicTimeouts.forEach(t => clearTimeout(t));
    musicTimeouts = [];
    musicGain = null;
  }, 400);
}

export function toggleMute(): boolean {
  musicMuted = !musicMuted;
  try {
    const c = getCtx();
    if (masterGain) {
      masterGain.gain.linearRampToValueAtTime(
        musicMuted ? 0 : 0.15,
        c.currentTime + 0.1,
      );
    }
  } catch {}
  return musicMuted;
}

export function isMusicMuted(): boolean {
  return musicMuted;
}
