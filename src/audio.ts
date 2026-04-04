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

// ─── Background Music — intense, driving battle synth ───

let musicGain: GainNode | null = null;
let masterGain: GainNode | null = null;
let musicPlaying = false;
let musicMuted = false;
let musicNodes: OscillatorNode[] = [];
let musicTimeouts: ReturnType<typeof setTimeout>[] = [];

function initMusicNodes() {
  const c = getCtx();

  masterGain = c.createGain();
  masterGain.gain.value = musicMuted ? 0 : 0.18;
  masterGain.connect(c.destination);

  musicGain = c.createGain();
  musicGain.gain.value = 0;
  musicGain.connect(masterGain);

  // ─── Driving bass pulse — rhythmic A1 ───
  const bass = c.createOscillator();
  bass.type = 'sawtooth';
  bass.frequency.value = 55;
  const bassFilter = c.createBiquadFilter();
  bassFilter.type = 'lowpass';
  bassFilter.frequency.value = 200;
  const bassGain = c.createGain();
  bassGain.gain.value = 0.25;
  bass.connect(bassFilter);
  bassFilter.connect(bassGain);
  bassGain.connect(musicGain);
  bass.start();
  musicNodes.push(bass);

  // ─── Sub rumble — E1 ───
  const sub = c.createOscillator();
  sub.type = 'sine';
  sub.frequency.value = 41.2;
  const subGain = c.createGain();
  subGain.gain.value = 0.3;
  sub.connect(subGain);
  subGain.connect(musicGain);
  sub.start();
  musicNodes.push(sub);

  // ─── Power chord pad — Am (A2, C3, E3) ───
  const padNotes = [110, 130.81, 164.81, 220];
  for (const freq of padNotes) {
    const osc = c.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.value = freq;
    const filter = c.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 500;
    filter.Q.value = 2;
    const g = c.createGain();
    g.gain.value = 0.07;
    osc.connect(filter);
    filter.connect(g);
    g.connect(musicGain!);
    osc.start();
    musicNodes.push(osc);
  }

  // ─── High tension string — E4 ───
  const tension = c.createOscillator();
  tension.type = 'sawtooth';
  tension.frequency.value = 329.63;
  const tensionFilter = c.createBiquadFilter();
  tensionFilter.type = 'bandpass';
  tensionFilter.frequency.value = 600;
  tensionFilter.Q.value = 5;
  const tensionGain = c.createGain();
  tensionGain.gain.value = 0.02;
  tension.connect(tensionFilter);
  tensionFilter.connect(tensionGain);
  tensionGain.connect(musicGain!);
  tension.start();
  musicNodes.push(tension);

  // ─── Start rhythmic patterns ───
  scheduleBassPulse();
  scheduleArpeggio();
  scheduleTensionHit();
}

// ─── Rhythmic bass pulse every ~0.5s ───
function scheduleBassPulse() {
  if (!musicPlaying) return;
  const t = setTimeout(() => {
    if (!musicPlaying || musicMuted) { scheduleBassPulse(); return; }
    try {
      const c = getCtx();
      const osc = c.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = 55;
      const g = c.createGain();
      g.gain.value = 0.15;
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.25);
      osc.connect(g);
      g.connect(musicGain!);
      osc.start(c.currentTime);
      osc.stop(c.currentTime + 0.25);
    } catch {}
    scheduleBassPulse();
  }, 500 + Math.random() * 100);
  musicTimeouts.push(t);
}

// ─── Fast arpeggio runs — pentatonic, every 0.3-0.8s ───
const PENTATONIC = [220, 261.63, 293.66, 329.63, 392, 440, 523.25, 587.33, 659.25, 784];

function scheduleArpeggio() {
  if (!musicPlaying) return;
  const delay = 300 + Math.random() * 500;
  const t = setTimeout(() => {
    if (!musicPlaying || musicMuted) { scheduleArpeggio(); return; }
    try {
      const c = getCtx();
      // Pick 2-4 notes for a quick run
      const count = 2 + Math.floor(Math.random() * 3);
      const baseIdx = Math.floor(Math.random() * (PENTATONIC.length - count));
      for (let i = 0; i < count; i++) {
        const freq = PENTATONIC[baseIdx + i];
        const osc = c.createOscillator();
        osc.type = 'square';
        osc.frequency.value = freq;
        const g = c.createGain();
        const noteStart = c.currentTime + i * 0.08;
        g.gain.setValueAtTime(0.03, noteStart);
        g.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.15);
        const filter = c.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 1200;
        osc.connect(filter);
        filter.connect(g);
        g.connect(musicGain!);
        osc.start(noteStart);
        osc.stop(noteStart + 0.15);
      }
    } catch {}
    scheduleArpeggio();
  }, delay);
  musicTimeouts.push(t);
}

// ─── Occasional tension hits — dramatic stabs ───
function scheduleTensionHit() {
  if (!musicPlaying) return;
  const delay = 3000 + Math.random() * 5000;
  const t = setTimeout(() => {
    if (!musicPlaying || musicMuted) { scheduleTensionHit(); return; }
    try {
      const c = getCtx();
      // Dissonant stab — minor second or tritone
      const baseFreqs = [220, 233.08, 311.13, 415.3]; // A, Bb, Eb, Ab
      const freq = baseFreqs[Math.floor(Math.random() * baseFreqs.length)];
      for (const type of ['sawtooth', 'square'] as OscillatorType[]) {
        const osc = c.createOscillator();
        osc.type = type;
        osc.frequency.value = freq;
        const g = c.createGain();
        g.gain.setValueAtTime(type === 'sawtooth' ? 0.04 : 0.025, c.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.6);
        const filter = c.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 900;
        osc.connect(filter);
        filter.connect(g);
        g.connect(musicGain!);
        osc.start(c.currentTime);
        osc.stop(c.currentTime + 0.6);
      }
    } catch {}
    scheduleTensionHit();
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
      musicGain.gain.linearRampToValueAtTime(1, now + 1.5);
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
        musicMuted ? 0 : 0.18,
        c.currentTime + 0.1,
      );
    }
  } catch {}
  return musicMuted;
}

export function isMusicMuted(): boolean {
  return musicMuted;
}
