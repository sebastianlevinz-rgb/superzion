// ═══════════════════════════════════════════════════════════════
// SoundManager — Singleton, Web Audio API synthesized sounds
// Lazy-init AudioContext on first sound call
// ═══════════════════════════════════════════════════════════════

let instance = null;

export default class SoundManager {
  static get() {
    if (!instance) instance = new SoundManager();
    return instance;
  }

  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.muted = false;
    this._noiseCache = {};  // cache noise buffers by rounded duration
  }

  _init() {
    if (this.ctx) {
      // Resume suspended context (browsers require user gesture)
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.connect(this.ctx.destination);
      if (this.ctx.state === 'suspended') this.ctx.resume();
    } catch (e) {
      // AudioContext not available — all sound will be silently skipped
      this.ctx = null;
      this.masterGain = null;
    }
  }

  _createNoiseBuffer(duration) {
    this._init();
    if (!this.ctx) return null;
    // Cache noise buffers by duration to avoid repeated multi-MB allocations
    const key = Math.round(duration * 10) / 10; // round to 0.1s
    if (this._noiseCache[key]) return this._noiseCache[key];
    const length = Math.floor(this.ctx.sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, length, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    this._noiseCache[key] = buffer;
    return buffer;
  }

  _osc(type, freq, duration, startTime, vol = 0.15) {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(vol, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(startTime);
    osc.stop(startTime + duration);
    // Auto-disconnect when done to prevent node accumulation
    osc.onended = () => { try { gain.disconnect(); osc.disconnect(); } catch (e) {} };
  }

  // Step sound: sine 80Hz, 50ms
  playStep() {
    this._init();
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;
    // Higher frequency + triangle for audibility on laptop speakers
    this._osc('triangle', 200, 0.08, t);
    this._osc('square', 400, 0.04, t, 0.03); // soft harmonic for body
  }

  // Jump sound: sine sweep 200→600Hz, 150ms
  playJump() {
    this._init();
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(200, t);
    osc.frequency.exponentialRampToValueAtTime(600, t + 0.15);
    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.15);
  }

  // Land sound: triangle 80Hz, 100ms decay
  playLand() {
    this._init();
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;
    this._osc('triangle', 80, 0.1, t);
  }

  // Hurt sound: sawtooth 150Hz, 200ms
  playHurt() {
    this._init();
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;
    this._osc('sawtooth', 150, 0.2, t);
  }

  // Laser zap: white noise + bandpass 2kHz, 100ms
  playLaserZap() {
    this._init();
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;
    const buffer = this._createNoiseBuffer(0.1);
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 2000;
    bp.Q.value = 5;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
    src.connect(bp);
    bp.connect(gain);
    gain.connect(this.masterGain);
    src.start(t);
    src.stop(t + 0.1);
  }

  // Camera/guard alarm: 3× square 900Hz, 50ms each
  playCameraAlarm() {
    this._init();
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;
    for (let i = 0; i < 3; i++) {
      this._osc('square', 900, 0.05, t + i * 0.1);
    }
  }

  // Plant beeps: sine 600Hz, accelerating over 2s
  playPlantBeeps() {
    this._init();
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;
    let offset = 0;
    let interval = 0.4;
    while (offset < 1.9) {
      this._osc('sine', 600, 0.06, t + offset);
      offset += interval;
      interval *= 0.8;
      if (interval < 0.05) break;
    }
  }

  // Explosion: sine 60Hz + noise, 2s fade
  playExplosion() {
    this._init();
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;

    // Low rumble
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 60;
    oscGain.gain.setValueAtTime(0.3, t);
    oscGain.gain.exponentialRampToValueAtTime(0.001, t + 2);
    osc.connect(oscGain);
    oscGain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 2);

    // Noise burst
    const buffer = this._createNoiseBuffer(2);
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.25, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 2);
    src.connect(noiseGain);
    noiseGain.connect(this.masterGain);
    src.start(t);
    src.stop(t + 2);
  }

  // Victory fanfare: C4-E4-G4-C5, 200ms each
  playVictory() {
    this._init();
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;
    const notes = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
    notes.forEach((freq, i) => {
      this._osc('sine', freq, 0.2, t + i * 0.22);
    });
  }

  // Countdown tick: square 440Hz, 80ms
  playCountdownTick() {
    this._init();
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;
    this._osc('square', 440, 0.08, t);
  }

  // Radar blip: sine 1200→800Hz, 100ms
  playRadarBlip() {
    this._init();
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, t);
    osc.frequency.exponentialRampToValueAtTime(800, t + 0.1);
    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.1);
  }

  // Radar mark: triangle 660Hz + 880Hz, 60ms each
  playRadarMark() {
    this._init();
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;
    this._osc('triangle', 660, 0.06, t);
    this._osc('triangle', 880, 0.06, t + 0.06);
  }

  // Radar intercept: noise burst + bandpass + descending sine 2000→200Hz, 500ms
  playRadarIntercept() {
    this._init();
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;

    // Noise burst through bandpass
    const buffer = this._createNoiseBuffer(0.5);
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 1500;
    bp.Q.value = 3;
    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.2, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
    src.connect(bp);
    bp.connect(noiseGain);
    noiseGain.connect(this.masterGain);
    src.start(t);
    src.stop(t + 0.5);

    // Descending sine
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(2000, t);
    osc.frequency.exponentialRampToValueAtTime(200, t + 0.5);
    oscGain.gain.setValueAtTime(0.15, t);
    oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
    osc.connect(oscGain);
    oscGain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.5);
  }

  // Radar ambient: lowpass white noise, 0.02 volume, 65s. Returns source for cleanup
  playRadarAmbient() {
    this._init();
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;
    const buffer = this._createNoiseBuffer(65);
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    const lp = this.ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 400;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.02, t);
    src.connect(lp);
    lp.connect(gain);
    gain.connect(this.masterGain);
    src.start(t);
    src.stop(t + 65);
    return { source: src, gain: gain };
  }

  // ── Level 3 — Bomber sounds ─────────────────────────────────

  // Jet engine: sawtooth 120Hz + noise, 0.08 vol, 2s. Returns ref for cleanup
  playJetEngine() {
    this._init();
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;

    // Sawtooth drone
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.value = 120;
    oscGain.gain.setValueAtTime(0.05, t);
    osc.connect(oscGain);
    oscGain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 120);

    // Noise layer
    const buffer = this._createNoiseBuffer(120);
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    const lp = this.ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 300;
    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.03, t);
    src.connect(lp);
    lp.connect(noiseGain);
    noiseGain.connect(this.masterGain);
    src.start(t);
    src.stop(t + 120);

    return { source: src, gain: noiseGain, osc };
  }

  // Afterburner: noise burst + sine 200Hz, 0.2 vol, 800ms
  playAfterburner() {
    this._init();
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;

    const buffer = this._createNoiseBuffer(0.8);
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.15, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.8);
    src.connect(noiseGain);
    noiseGain.connect(this.masterGain);
    src.start(t);
    src.stop(t + 0.8);

    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 200;
    oscGain.gain.setValueAtTime(0.1, t);
    oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.8);
    osc.connect(oscGain);
    oscGain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.8);
  }

  // Bomb drop: sine sweep 400→80Hz, 600ms
  playBombDrop() {
    this._init();
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, t);
    osc.frequency.exponentialRampToValueAtTime(80, t + 0.6);
    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.6);
  }

  // Bomb impact: noise burst + sine 50Hz rumble, 800ms
  playBombImpact() {
    this._init();
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;

    const buffer = this._createNoiseBuffer(0.8);
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.25, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.8);
    src.connect(noiseGain);
    noiseGain.connect(this.masterGain);
    src.start(t);
    src.stop(t + 0.8);

    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 50;
    oscGain.gain.setValueAtTime(0.2, t);
    oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.8);
    osc.connect(oscGain);
    oscGain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.8);
  }

  // Missile warning: square 1200Hz, 3× rapid beeps 80ms
  playMissileWarning() {
    this._init();
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;
    for (let i = 0; i < 3; i++) {
      this._osc('square', 1200, 0.08, t + i * 0.12);
    }
  }

  // Missile pass: sine sweep 800→200Hz, 300ms
  playMissilePass() {
    this._init();
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, t);
    osc.frequency.exponentialRampToValueAtTime(200, t + 0.3);
    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.3);
  }

  // Gunfire: short burst of highpass noise pops
  playGunfire(burstCount = 3) {
    this._init();
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;
    for (let i = 0; i < burstCount; i++) {
      const buf = this._createNoiseBuffer(0.05);
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      const hp = this.ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 2000;
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.15, t + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.08 + 0.04);
      src.connect(hp);
      hp.connect(gain);
      gain.connect(this.masterGain);
      src.start(t + i * 0.08);
      src.stop(t + i * 0.08 + 0.05);
    }
  }

  // Carrier ambient: lowpass noise + deep sine 40Hz, 0.03 vol, 60s. Returns ref
  playCarrierAmbient() {
    this._init();
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;

    const buffer = this._createNoiseBuffer(60);
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    const lp = this.ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 200;
    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.02, t);
    src.connect(lp);
    lp.connect(noiseGain);
    noiseGain.connect(this.masterGain);
    src.start(t);
    src.stop(t + 60);

    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 40;
    oscGain.gain.setValueAtTime(0.01, t);
    osc.connect(oscGain);
    oscGain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 60);

    return { source: src, gain: noiseGain, osc };
  }

  // Landing gear: triangle 200Hz descending, 400ms
  playLandingGear() {
    this._init();
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(200, t);
    osc.frequency.exponentialRampToValueAtTime(80, t + 0.4);
    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.4);
  }

  // ── Level 4 — Drone sounds ──────────────────────────────────

  // Drone hum: triangle 85Hz + saw 170Hz, 0.04 vol, 2s. Returns ref for cleanup
  playDroneHum() {
    this._init();
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.value = 85;
    oscGain.gain.setValueAtTime(0.03, t);
    osc.connect(oscGain);
    oscGain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 120);

    const osc2 = this.ctx.createOscillator();
    const osc2Gain = this.ctx.createGain();
    osc2.type = 'sawtooth';
    osc2.frequency.value = 170;
    osc2Gain.gain.setValueAtTime(0.01, t);
    osc2.connect(osc2Gain);
    osc2Gain.connect(this.masterGain);
    osc2.start(t);
    osc2.stop(t + 120);

    return { source: osc2, gain: osc2Gain, osc };
  }

  // Drone scan: sine sweep 600→1800Hz, 400ms
  playDroneScan() {
    this._init();
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, t);
    osc.frequency.exponentialRampToValueAtTime(1800, t + 0.4);
    gain.gain.setValueAtTime(0.1, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.4);
  }

  // Drone scan complete: 2× sine 880Hz + 1100Hz, 80ms each
  playDroneScanComplete() {
    this._init();
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;
    this._osc('sine', 880, 0.08, t);
    this._osc('sine', 1100, 0.08, t + 0.1);
  }

  // Drone hit: noise burst + triangle 100Hz, 300ms
  playDroneHit() {
    this._init();
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;

    const buffer = this._createNoiseBuffer(0.3);
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.2, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    src.connect(noiseGain);
    noiseGain.connect(this.masterGain);
    src.start(t);
    src.stop(t + 0.3);

    this._osc('triangle', 100, 0.3, t);
  }

  // Door open: sine sweep 200→500Hz, 300ms
  playDoorOpen() {
    this._init();
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(200, t);
    osc.frequency.exponentialRampToValueAtTime(500, t + 0.3);
    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.3);
  }

  // Door close: sine sweep 500→150Hz, 350ms
  playDoorClose() {
    this._init();
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(500, t);
    osc.frequency.exponentialRampToValueAtTime(150, t + 0.35);
    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.35);
  }

  // Interference: noise + square 60Hz, 0.08 vol, 500ms
  playInterference() {
    this._init();
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;

    const buffer = this._createNoiseBuffer(0.5);
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 800;
    bp.Q.value = 2;
    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.06, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
    src.connect(bp);
    bp.connect(noiseGain);
    noiseGain.connect(this.masterGain);
    src.start(t);
    src.stop(t + 0.5);

    this._osc('square', 60, 0.5, t);
  }

  // Mark point: 3× ascending sine pips 500→700→900Hz, 60ms each
  playMarkPoint() {
    this._init();
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;
    this._osc('sine', 500, 0.06, t);
    this._osc('sine', 700, 0.06, t + 0.08);
    this._osc('sine', 900, 0.06, t + 0.16);
  }

  // Underground explosion: deep rumble + noise, 2.5s
  playUndergroundExplosion() {
    this._init();
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;

    // Deep rumble
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 35;
    oscGain.gain.setValueAtTime(0.35, t);
    oscGain.gain.exponentialRampToValueAtTime(0.001, t + 2.5);
    osc.connect(oscGain);
    oscGain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 2.5);

    // Noise burst
    const buffer = this._createNoiseBuffer(2.5);
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    const lp = this.ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 500;
    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.3, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 2.5);
    src.connect(lp);
    lp.connect(noiseGain);
    noiseGain.connect(this.masterGain);
    src.start(t);
    src.stop(t + 2.5);

    // Second harmonic for rumble
    const osc2 = this.ctx.createOscillator();
    const osc2Gain = this.ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.value = 70;
    osc2Gain.gain.setValueAtTime(0.15, t);
    osc2Gain.gain.exponentialRampToValueAtTime(0.001, t + 2);
    osc2.connect(osc2Gain);
    osc2Gain.connect(this.masterGain);
    osc2.start(t);
    osc2.stop(t + 2);
  }

  // ── Level 5 — B-2 Stealth Bomber sounds ────────────────────

  // B-2 engine: deep triangle 60Hz + LPF noise, very quiet (stealth), 120s. Returns ref
  playB2Engine() {
    this._init();
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.value = 60;
    oscGain.gain.setValueAtTime(0.02, t);
    osc.connect(oscGain);
    oscGain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 120);

    const buffer = this._createNoiseBuffer(120);
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    const lp = this.ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 200;
    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.01, t);
    src.connect(lp);
    lp.connect(noiseGain);
    noiseGain.connect(this.masterGain);
    src.start(t);
    src.stop(t + 120);

    return { source: src, gain: noiseGain, osc };
  }

  // Radar sweep: sine sweep 400→800→400Hz, 1s
  playRadarSweep() {
    this._init();
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, t);
    osc.frequency.linearRampToValueAtTime(800, t + 0.5);
    osc.frequency.linearRampToValueAtTime(400, t + 1);
    gain.gain.setValueAtTime(0.05, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 1);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 1);
  }

  // Radar alert: square 800Hz, 5× rapid beeps 60ms each
  playRadarAlert() {
    this._init();
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;
    for (let i = 0; i < 5; i++) {
      this._osc('square', 800, 0.06, t + i * 0.1);
    }
  }

  // Chaff release: noise burst + sparkle sine 3000Hz, 300ms
  playChaffRelease() {
    this._init();
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;

    const buffer = this._createNoiseBuffer(0.3);
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    const bp = this.ctx.createBiquadFilter();
    bp.type = 'highpass';
    bp.frequency.value = 2000;
    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.15, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    src.connect(bp);
    bp.connect(noiseGain);
    noiseGain.connect(this.masterGain);
    src.start(t);
    src.stop(t + 0.3);

    this._osc('sine', 3000, 0.15, t);
  }

  // Bunker buster drop: deep sine sweep 300→50Hz + noise, 1.2s
  playBunkerBusterDrop() {
    this._init();
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, t);
    osc.frequency.exponentialRampToValueAtTime(50, t + 1.2);
    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 1.2);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 1.2);

    const buffer = this._createNoiseBuffer(1.2);
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    const lp = this.ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 400;
    const nGain = this.ctx.createGain();
    nGain.gain.setValueAtTime(0.08, t);
    nGain.gain.exponentialRampToValueAtTime(0.001, t + 1.2);
    src.connect(lp);
    lp.connect(nGain);
    nGain.connect(this.masterGain);
    src.start(t);
    src.stop(t + 1.2);
  }

  // Bunker buster impact: massive rumble sine 30Hz + noise, 2s
  playBunkerBusterImpact() {
    this._init();
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 30;
    oscGain.gain.setValueAtTime(0.35, t);
    oscGain.gain.exponentialRampToValueAtTime(0.001, t + 2);
    osc.connect(oscGain);
    oscGain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 2);

    const buffer = this._createNoiseBuffer(2);
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    const lp = this.ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 300;
    const nGain = this.ctx.createGain();
    nGain.gain.setValueAtTime(0.3, t);
    nGain.gain.exponentialRampToValueAtTime(0.001, t + 2);
    src.connect(lp);
    lp.connect(nGain);
    nGain.connect(this.masterGain);
    src.start(t);
    src.stop(t + 2);
  }

  // Flak explosion: short noise burst bandpass 1kHz, 400ms
  playFlakExplosion() {
    this._init();
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;
    const buffer = this._createNoiseBuffer(0.4);
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 1000;
    bp.Q.value = 3;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
    src.connect(bp);
    bp.connect(gain);
    gain.connect(this.masterGain);
    src.start(t);
    src.stop(t + 0.4);
  }

  // Nuclear explosion: massive sine 25Hz + noise + harmonic 50Hz, 4s
  playNuclearExplosion() {
    this._init();
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;

    // Fundamental rumble
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 25;
    oscGain.gain.setValueAtTime(0.01, t);
    oscGain.gain.linearRampToValueAtTime(0.4, t + 1);
    oscGain.gain.exponentialRampToValueAtTime(0.001, t + 4);
    osc.connect(oscGain);
    oscGain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 4);

    // Harmonic
    const osc2 = this.ctx.createOscillator();
    const osc2Gain = this.ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.value = 50;
    osc2Gain.gain.setValueAtTime(0.01, t);
    osc2Gain.gain.linearRampToValueAtTime(0.2, t + 1);
    osc2Gain.gain.exponentialRampToValueAtTime(0.001, t + 3.5);
    osc2.connect(osc2Gain);
    osc2Gain.connect(this.masterGain);
    osc2.start(t);
    osc2.stop(t + 3.5);

    // Noise burst with crescendo
    const buffer = this._createNoiseBuffer(4);
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    const lp = this.ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 600;
    const nGain = this.ctx.createGain();
    nGain.gain.setValueAtTime(0.01, t);
    nGain.gain.linearRampToValueAtTime(0.35, t + 1.2);
    nGain.gain.exponentialRampToValueAtTime(0.001, t + 4);
    src.connect(lp);
    lp.connect(nGain);
    nGain.connect(this.masterGain);
    src.start(t);
    src.stop(t + 4);
  }

  // Typewriter click: short square pulse 800Hz, 15ms
  playTypewriterClick() {
    this._init();
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;
    // Tone click — longer duration for audibility
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.value = 800 + Math.random() * 200;
    gain.gain.setValueAtTime(0.05, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.03);
    osc.onended = () => { try { gain.disconnect(); osc.disconnect(); } catch (e) {} };
    // Brief noise transient for mechanical click body
    const buf = this._createNoiseBuffer(0.02);
    if (buf) {
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      const hp = this.ctx.createBiquadFilter();
      hp.type = 'highpass'; hp.frequency.value = 4000;
      const nGain = this.ctx.createGain();
      nGain.gain.setValueAtTime(0.03, t);
      nGain.gain.exponentialRampToValueAtTime(0.001, t + 0.02);
      src.connect(hp); hp.connect(nGain); nGain.connect(this.masterGain);
      src.start(t); src.stop(t + 0.02);
      src.onended = () => { try { nGain.disconnect(); hp.disconnect(); src.disconnect(); } catch (e) {} };
    }
  }

  // ── Level 6 — Boss sounds ──────────────────────────────────

  // Player shoot: square 1600→800Hz sweep, 60ms
  playPlayerShoot() {
    this._init();
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(1600, t);
    osc.frequency.exponentialRampToValueAtTime(800, t + 0.06);
    gain.gain.setValueAtTime(0.08, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.06);
  }

  // Boss hit: noise burst + triangle 200Hz, 150ms
  playBossHit() {
    this._init();
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;

    const buffer = this._createNoiseBuffer(0.15);
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    const nGain = this.ctx.createGain();
    nGain.gain.setValueAtTime(0.1, t);
    nGain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
    src.connect(nGain);
    nGain.connect(this.masterGain);
    src.start(t);
    src.stop(t + 0.15);

    const osc = this.ctx.createOscillator();
    const oGain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.value = 200;
    oGain.gain.setValueAtTime(0.15, t);
    oGain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
    osc.connect(oGain);
    oGain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.15);
  }

  // Boss roar: sawtooth sweep 80→200→80Hz + noise, 800ms (phase transition)
  playBossRoar() {
    this._init();
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const oGain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(80, t);
    osc.frequency.linearRampToValueAtTime(200, t + 0.4);
    osc.frequency.linearRampToValueAtTime(80, t + 0.8);
    oGain.gain.setValueAtTime(0.15, t);
    oGain.gain.exponentialRampToValueAtTime(0.001, t + 0.8);
    osc.connect(oGain);
    oGain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.8);

    const buffer = this._createNoiseBuffer(0.8);
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    const lp = this.ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 400;
    const nGain = this.ctx.createGain();
    nGain.gain.setValueAtTime(0.08, t);
    nGain.gain.exponentialRampToValueAtTime(0.001, t + 0.8);
    src.connect(lp);
    lp.connect(nGain);
    nGain.connect(this.masterGain);
    src.start(t);
    src.stop(t + 0.8);
  }

  // Boss laser: sine 2000→500Hz sweep, 400ms
  playBossLaser() {
    this._init();
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(2000, t);
    osc.frequency.exponentialRampToValueAtTime(500, t + 0.4);
    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.4);
  }

  // Boss shockwave: sine 40Hz + noise burst, 1.2s
  playBossShockwave() {
    this._init();
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const oGain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 40;
    oGain.gain.setValueAtTime(0.2, t);
    oGain.gain.exponentialRampToValueAtTime(0.001, t + 1.2);
    osc.connect(oGain);
    oGain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 1.2);

    const buffer = this._createNoiseBuffer(1.2);
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    const nGain = this.ctx.createGain();
    nGain.gain.setValueAtTime(0.15, t);
    nGain.gain.exponentialRampToValueAtTime(0.001, t + 1.2);
    src.connect(nGain);
    nGain.connect(this.masterGain);
    src.start(t);
    src.stop(t + 1.2);
  }

  // Disintegrate: noise highpass 3kHz + sine 4000→100Hz sweep, 3s
  playDisintegrate() {
    this._init();
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;

    const buffer = this._createNoiseBuffer(3);
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    const hp = this.ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 3000;
    const nGain = this.ctx.createGain();
    nGain.gain.setValueAtTime(0.12, t);
    nGain.gain.linearRampToValueAtTime(0.2, t + 1);
    nGain.gain.exponentialRampToValueAtTime(0.001, t + 3);
    src.connect(hp);
    hp.connect(nGain);
    nGain.connect(this.masterGain);
    src.start(t);
    src.stop(t + 3);

    const osc = this.ctx.createOscillator();
    const oGain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(4000, t);
    osc.frequency.exponentialRampToValueAtTime(100, t + 3);
    oGain.gain.setValueAtTime(0.1, t);
    oGain.gain.exponentialRampToValueAtTime(0.001, t + 3);
    osc.connect(oGain);
    oGain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 3);
  }

  // Boss phase transition: 3× ascending square pips 400→800→1200Hz + noise, 500ms
  playBossPhaseTransition() {
    this._init();
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;

    const freqs = [400, 800, 1200];
    freqs.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.value = freq;
      const start = t + i * 0.15;
      gain.gain.setValueAtTime(0.1, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.12);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(start);
      osc.stop(start + 0.12);
    });

    const buffer = this._createNoiseBuffer(0.5);
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    const nGain = this.ctx.createGain();
    nGain.gain.setValueAtTime(0.05, t);
    nGain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
    src.connect(nGain);
    nGain.connect(this.masterGain);
    src.start(t);
    src.stop(t + 0.5);
  }

  // Final victory fanfare: C4-E4-G4-C5-E5-G5, 250ms each, triangle wave
  playFinalVictory() {
    this._init();
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;
    const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99];

    notes.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      const start = t + i * 0.25;
      gain.gain.setValueAtTime(0.15, start);
      gain.gain.setValueAtTime(0.15, start + 0.2);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.35);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(start);
      osc.stop(start + 0.35);
    });
  }

  // ── Additional / Missing sounds ──────────────────────────────

  // Game over: descending tone, 600ms
  playGameOver() {
    this._init();
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(400, t);
    osc.frequency.exponentialRampToValueAtTime(80, t + 0.6);
    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.6);
  }

  // Menu select blip: short high blip
  playMenuSelect() {
    this._init();
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, t);
    osc.frequency.exponentialRampToValueAtTime(800, t + 0.06);
    gain.gain.setValueAtTime(0.08, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.06);
  }

  // Searchlight detection: short siren
  playSearchlightDetect() {
    this._init();
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(600, t);
    osc.frequency.linearRampToValueAtTime(1200, t + 0.15);
    osc.frequency.linearRampToValueAtTime(600, t + 0.3);
    gain.gain.setValueAtTime(0.1, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.3);
  }

  // Shield active hum: steady energy hum, 400ms
  playShieldActive() {
    this._init();
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 300;
    gain.gain.setValueAtTime(0.08, t);
    gain.gain.setValueAtTime(0.08, t + 0.3);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.4);

    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.value = 600;
    gain2.gain.setValueAtTime(0.04, t);
    gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
    osc2.connect(gain2);
    gain2.connect(this.masterGain);
    osc2.start(t);
    osc2.stop(t + 0.4);
  }

  // Shield down: power-down sweep
  playShieldDown() {
    this._init();
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, t);
    osc.frequency.exponentialRampToValueAtTime(100, t + 0.3);
    gain.gain.setValueAtTime(0.1, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.3);
  }

  // Player hit in boss fight: buzz + impact
  playPlayerHit() {
    this._init();
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.value = 120;
    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.2);

    const buf = this._createNoiseBuffer(0.1);
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const nGain = this.ctx.createGain();
    nGain.gain.setValueAtTime(0.1, t);
    nGain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
    src.connect(nGain);
    nGain.connect(this.masterGain);
    src.start(t);
    src.stop(t + 0.1);
  }

  // Boss intro entrance: deep rumble
  playBossEntrance() {
    this._init();
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(30, t);
    osc.frequency.linearRampToValueAtTime(60, t + 1.5);
    gain.gain.setValueAtTime(0.01, t);
    gain.gain.linearRampToValueAtTime(0.2, t + 0.8);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 1.5);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 1.5);

    const buf = this._createNoiseBuffer(1.5);
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const lp = this.ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 200;
    const nGain = this.ctx.createGain();
    nGain.gain.setValueAtTime(0.01, t);
    nGain.gain.linearRampToValueAtTime(0.08, t + 0.8);
    nGain.gain.exponentialRampToValueAtTime(0.001, t + 1.5);
    src.connect(lp);
    lp.connect(nGain);
    nGain.connect(this.masterGain);
    src.start(t);
    src.stop(t + 1.5);
  }

  // Homing missile launch: rocket whoosh
  playHomingMissile() {
    this._init();
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;
    const buf = this._createNoiseBuffer(0.4);
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(500, t);
    bp.frequency.exponentialRampToValueAtTime(2000, t + 0.3);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.08, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
    src.connect(bp);
    bp.connect(gain);
    gain.connect(this.masterGain);
    src.start(t);
    src.stop(t + 0.4);
  }

  // Mega explosion: biggest explosion in the game, 3s, multicapa
  playMegaExplosion() {
    this._init();
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;

    // Deep sine rumble
    const osc = this.ctx.createOscillator();
    const oGain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(35, t);
    osc.frequency.exponentialRampToValueAtTime(20, t + 3);
    oGain.gain.setValueAtTime(0.25, t);
    oGain.gain.exponentialRampToValueAtTime(0.001, t + 3);
    osc.connect(oGain);
    oGain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 3);

    // Harmonic layer
    const osc2 = this.ctx.createOscillator();
    const oGain2 = this.ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.value = 55;
    oGain2.gain.setValueAtTime(0.15, t);
    oGain2.gain.exponentialRampToValueAtTime(0.001, t + 2.5);
    osc2.connect(oGain2);
    oGain2.connect(this.masterGain);
    osc2.start(t);
    osc2.stop(t + 2.5);

    // Mid rumble
    const osc3 = this.ctx.createOscillator();
    const oGain3 = this.ctx.createGain();
    osc3.type = 'triangle';
    osc3.frequency.setValueAtTime(100, t);
    osc3.frequency.exponentialRampToValueAtTime(40, t + 2);
    oGain3.gain.setValueAtTime(0.1, t);
    oGain3.gain.exponentialRampToValueAtTime(0.001, t + 2);
    osc3.connect(oGain3);
    oGain3.connect(this.masterGain);
    osc3.start(t);
    osc3.stop(t + 2);

    // Noise burst with crescendo
    const buf = this._createNoiseBuffer(3);
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const lp = this.ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(3000, t);
    lp.frequency.exponentialRampToValueAtTime(200, t + 3);
    const nGain = this.ctx.createGain();
    nGain.gain.setValueAtTime(0.3, t);
    nGain.gain.exponentialRampToValueAtTime(0.001, t + 3);
    src.connect(lp);
    lp.connect(nGain);
    nGain.connect(this.masterGain);
    src.start(t);
    src.stop(t + 3);
  }

  // Radar time up: short descending fail tone
  playTimesUp() {
    this._init();
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;
    const notes = [500, 400, 300];
    notes.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.value = freq;
      const start = t + i * 0.15;
      gain.gain.setValueAtTime(0.1, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.12);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(start);
      osc.stop(start + 0.12);
    });
  }

  // Intercept success ding
  playInterceptSuccess() {
    this._init();
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.1, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.3);

    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.value = 1320;
    gain2.gain.setValueAtTime(0.08, t + 0.1);
    gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
    osc2.connect(gain2);
    gain2.connect(this.masterGain);
    osc2.start(t + 0.1);
    osc2.stop(t + 0.4);
  }

  // Intercept fail buzz
  playInterceptFail() {
    this._init();
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.value = 100;
    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.25);
  }

  // ── Ambient loops ──────────────────────────────────────────────

  // Night wind ambient (Level 1 — Tehran rooftops)
  // Low-frequency filtered noise that sounds like gentle wind
  playAmbientWind() {
    this._init();
    if (!this.ctx || !this.masterGain) return null;
    const t = this.ctx.currentTime;

    // Noise source through low-pass filter for wind
    const bufferSize = Math.floor(this.ctx.sampleRate * 2);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 400;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.03, t);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    noise.start();

    return { source: noise, gain };
  }

  // Industrial port ambient (Level 2 — Beirut)
  // Low rumble + filtered noise for machinery hum
  playAmbientIndustrial() {
    this._init();
    if (!this.ctx || !this.masterGain) return null;
    const t = this.ctx.currentTime;

    // Low rumble oscillator (40Hz)
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 40;
    oscGain.gain.setValueAtTime(0.02, t);
    osc.connect(oscGain);
    oscGain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 300);

    // Machinery hum — noise through bandpass at 200Hz
    const bufferSize = Math.floor(this.ctx.sampleRate * 2);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 200;
    bp.Q.value = 2;

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.015, t);

    noise.connect(bp);
    bp.connect(noiseGain);
    noiseGain.connect(this.masterGain);
    noise.start();

    return { source: noise, gain: noiseGain, osc };
  }

  // Underground echo ambient (Level 4 — tunnels)
  // Deep reverberant hum + occasional drip sounds
  playAmbientUnderground() {
    this._init();
    if (!this.ctx || !this.masterGain) return null;
    const t = this.ctx.currentTime;

    // Deep hum (60Hz)
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 60;
    oscGain.gain.setValueAtTime(0.015, t);
    osc.connect(oscGain);
    oscGain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 300);

    // Filtered noise for air movement
    const bufferSize = Math.floor(this.ctx.sampleRate * 2);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const lp = this.ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 300;

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.01, t);

    noise.connect(lp);
    lp.connect(noiseGain);
    noiseGain.connect(this.masterGain);
    noise.start();

    // Occasional drip sound (high sine blip every 3-5 seconds)
    this._undergroundDripActive = true;
    const scheduleDrip = () => {
      if (!this._undergroundDripActive || !this.ctx) return;
      const now = this.ctx.currentTime;
      const dripOsc = this.ctx.createOscillator();
      const dripGain = this.ctx.createGain();
      dripOsc.type = 'sine';
      dripOsc.frequency.setValueAtTime(2000 + Math.random() * 1000, now);
      dripOsc.frequency.exponentialRampToValueAtTime(800, now + 0.08);
      dripGain.gain.setValueAtTime(0.03, now);
      dripGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      dripOsc.connect(dripGain);
      dripGain.connect(this.masterGain);
      dripOsc.start(now);
      dripOsc.stop(now + 0.1);
      dripOsc.onended = () => { try { dripGain.disconnect(); dripOsc.disconnect(); } catch (e) {} };
      this._dripTimeout = setTimeout(scheduleDrip, 3000 + Math.random() * 2000);
    };
    this._dripTimeout = setTimeout(scheduleDrip, 2000 + Math.random() * 2000);

    return { source: noise, gain: noiseGain, osc, stopDrip: () => {
      this._undergroundDripActive = false;
      if (this._dripTimeout) { clearTimeout(this._dripTimeout); this._dripTimeout = null; }
    }};
  }

  // Battle chaos ambient (Level 6 — final boss)
  // Distant rumbles + low continuous drone
  playAmbientBattle() {
    this._init();
    if (!this.ctx || !this.masterGain) return null;
    const t = this.ctx.currentTime;

    // Low continuous drone (50Hz)
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 50;
    oscGain.gain.setValueAtTime(0.02, t);
    osc.connect(oscGain);
    oscGain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 300);

    // Filtered noise layer
    const bufferSize = Math.floor(this.ctx.sampleRate * 2);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const lp = this.ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 250;

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.012, t);

    noise.connect(lp);
    lp.connect(noiseGain);
    noiseGain.connect(this.masterGain);
    noise.start();

    // Distant rumble bursts every 2-4 seconds
    this._battleRumbleActive = true;
    const scheduleRumble = () => {
      if (!this._battleRumbleActive || !this.ctx) return;
      const now = this.ctx.currentTime;
      const rumbleOsc = this.ctx.createOscillator();
      const rumbleGain = this.ctx.createGain();
      rumbleOsc.type = 'sine';
      rumbleOsc.frequency.value = 30 + Math.random() * 20;
      rumbleGain.gain.setValueAtTime(0, now);
      rumbleGain.gain.linearRampToValueAtTime(0.06, now + 0.1);
      rumbleGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      rumbleOsc.connect(rumbleGain);
      rumbleGain.connect(this.masterGain);
      rumbleOsc.start(now);
      rumbleOsc.stop(now + 0.6);
      rumbleOsc.onended = () => { try { rumbleGain.disconnect(); rumbleOsc.disconnect(); } catch (e) {} };
      this._rumbleTimeout = setTimeout(scheduleRumble, 2000 + Math.random() * 2000);
    };
    this._rumbleTimeout = setTimeout(scheduleRumble, 1500 + Math.random() * 2000);

    return { source: noise, gain: noiseGain, osc, stopRumble: () => {
      this._battleRumbleActive = false;
      if (this._rumbleTimeout) { clearTimeout(this._rumbleTimeout); this._rumbleTimeout = null; }
    }};
  }

  // ── Dramatic death effects ────────────────────────────────────

  // Heartbeat: two thumps (lub-dub)
  playHeartbeat() {
    this._init();
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    // Two thumps: lub-dub
    for (const offset of [0, 0.15]) {
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = 40 + (offset > 0 ? 10 : 0);
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0, now + offset);
      gain.gain.linearRampToValueAtTime(0.15, now + offset + 0.05);
      gain.gain.linearRampToValueAtTime(0, now + offset + 0.2);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now + offset);
      osc.stop(now + offset + 0.25);
      osc.onended = () => { try { gain.disconnect(); osc.disconnect(); } catch (e) {} };
    }
  }

  // Toggle mute — also syncs MusicManager
  toggleMute() {
    this._init();
    if (!this.ctx || !this.masterGain) return this.muted;
    this.muted = !this.muted;
    // Use short ramp to avoid click/pop
    const t = this.ctx.currentTime;
    this.masterGain.gain.cancelScheduledValues(t);
    this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, t);
    this.masterGain.gain.linearRampToValueAtTime(this.muted ? 0 : 1, t + 0.02);
    // Sync music manager if it exists
    if (window.__musicManager) {
      window.__musicManager.setMuted(this.muted);
    }
    return this.muted;
  }
}
