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

// ─── Background Music — procedural ambient dark synth ───

let musicGain: GainNode | null = null;
let musicPlaying = false;
let musicMuted = false;
let musicNodes: OscillatorNode[] = [];
let musicTimeouts: ReturnType<typeof setTimeout>[] = [];
let masterGain: GainNode | null = null;

function initMusicNodes() {
  const c = getCtx();

  // Master gain for all music
  masterGain = c.createGain();
  masterGain.gain.value = musicMuted ? 0 : 0.12;
  masterGain.connect(c.destination);

  // Music gain (for crossfade)
  musicGain = c.createGain();
  musicGain.gain.value = 0;
  musicGain.connect(masterGain);

  // Bass drone — low pad
  const bass = c.createOscillator();
  bass.type = 'sine';
  bass.frequency.value = 55; // A1
  const bassGain = c.createGain();
  bassGain.gain.value = 0.4;
  bass.connect(bassGain);
  bassGain.connect(musicGain);
  bass.start();
  musicNodes.push(bass);

  // Sub bass — fifth below for depth
  const sub = c.createOscillator();
  sub.type = 'sine';
  sub.frequency.value = 36.71; // D1
  const subGain = c.createGain();
  subGain.gain.value = 0.2;
  sub.connect(subGain);
  subGain.connect(musicGain);
  sub.start();
  musicNodes.push(sub);

  // Pad — filtered sawtooth chord
  const padNotes = [110, 130.81, 164.81, 220]; // Am chord (A2, C3, E3, A3)
  padNotes.forEach(freq => {
    const osc = c.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.value = freq;

    // Low-pass filter for warmth
    const filter = c.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 400;
    filter.Q.value = 1;

    const g = c.createGain();
    g.gain.value = 0.06;

    osc.connect(filter);
    filter.connect(g);
    g.connect(musicGain!);
    osc.start();
    musicNodes.push(osc);
  });

  // Slow LFO on filter for movement
  const lfo = c.createOscillator();
  lfo.type = 'sine';
  lfo.frequency.value = 0.1; // Very slow
  const lfoGain = c.createGain();
  lfoGain.gain.value = 150;
  lfo.connect(lfoGain);
  // Connect LFO to pad filter frequency modulation would need reference — skip for simplicity
  lfo.start();
  musicNodes.push(lfo);

  // High shimmer — very quiet triangle wave
  const shimmer = c.createOscillator();
  shimmer.type = 'triangle';
  shimmer.frequency.value = 440;
  const shimmerGain = c.createGain();
  shimmerGain.gain.value = 0.015;
  shimmer.connect(shimmerGain);
  shimmerGain.connect(musicGain);
  shimmer.start();
  musicNodes.push(shimmer);

  // Schedule subtle melody pings
  scheduleMelodyPings();
}

const PENTATONIC = [220, 261.63, 293.66, 329.63, 392, 440, 523.25, 587.33, 659.25];

function scheduleMelodyPings() {
  if (!musicPlaying) return;

  const delay = 2000 + Math.random() * 4000; // 2-6 seconds between pings
  const t = setTimeout(() => {
    if (!musicPlaying || musicMuted) {
      scheduleMelodyPings();
      return;
    }
    try {
      const c = getCtx();
      const freq = PENTATONIC[Math.floor(Math.random() * PENTATONIC.length)];
      const osc = c.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;

      const g = c.createGain();
      g.gain.value = 0.03;
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 1.5);

      const filter = c.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 800 + Math.random() * 600;

      osc.connect(filter);
      filter.connect(g);
      g.connect(musicGain!);
      osc.start(c.currentTime);
      osc.stop(c.currentTime + 1.5);

      // Sometimes play a harmony note
      if (Math.random() < 0.3) {
        const osc2 = c.createOscillator();
        osc2.type = 'sine';
        osc2.frequency.value = freq * 1.5; // Fifth
        const g2 = c.createGain();
        g2.gain.value = 0.015;
        g2.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 1.2);
        osc2.connect(g2);
        g2.connect(musicGain!);
        osc2.start(c.currentTime + 0.1);
        osc2.stop(c.currentTime + 1.3);
      }
    } catch {}
    scheduleMelodyPings();
  }, delay);
  musicTimeouts.push(t);
}

export function startMusic() {
  if (musicPlaying) return;
  try {
    getCtx(); // Ensure context exists
    if (ctx && ctx.state === 'suspended') ctx.resume();
    musicPlaying = true;
    initMusicNodes();
    // Fade in
    if (musicGain) {
      musicGain.gain.setValueAtTime(0, ctx!.currentTime);
      musicGain.gain.linearRampToValueAtTime(1, ctx!.currentTime + 2);
    }
  } catch {}
}

export function stopMusic() {
  if (!musicPlaying) return;
  musicPlaying = false;

  // Fade out
  if (musicGain && ctx) {
    try {
      musicGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5);
    } catch {}
  }

  // Stop all after fade
  setTimeout(() => {
    musicNodes.forEach(n => { try { n.stop(); } catch {} });
    musicNodes = [];
    musicTimeouts.forEach(t => clearTimeout(t));
    musicTimeouts = [];
    musicGain = null;
  }, 600);
}

export function toggleMute(): boolean {
  musicMuted = !musicMuted;
  if (masterGain && ctx) {
    try {
      masterGain.gain.linearRampToValueAtTime(
        musicMuted ? 0 : 0.12,
        ctx.currentTime + 0.1,
      );
    } catch {}
  }
  return musicMuted;
}

export function isMusicMuted(): boolean {
  return musicMuted;
}
