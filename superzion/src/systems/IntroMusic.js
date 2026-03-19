// ═══════════════════════════════════════════════════════════════
// IntroMusic — PSYTRANCE action intro music system (145 BPM)
// Web Audio API procedural music for the game's cinematic intro
// Three acts: AXIS OF EVIL -> ISRAEL RESPONDS -> SUPERZION
// Duration: 25 seconds total
// ═══════════════════════════════════════════════════════════════

import MusicManager from './MusicManager.js';

// Note frequencies (Hz)
const N = {
  A1: 55.00, D2: 73.42, E2: 82.41, F2: 87.31, G2: 98.00,
  A2: 110.00, B2: 123.47, C3: 130.81, D3: 146.83, E3: 164.81,
  F3: 174.61, G3: 196.00, A3: 220.00, B3: 246.94, C4: 261.63,
  D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.00, A4: 440.00,
  B4: 493.88, C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46,
  G5: 783.99, A5: 880.00, C6: 1046.50, D6: 1174.66,
};

export default class IntroMusic {
  constructor() {
    this._nodes = [];
    this._gainNode = null;
    this._ctx = null;
    this._started = false;
  }

  /**
   * Start the psytrance intro music. Schedules all three acts ahead of time.
   */
  start() {
    if (this._started) return;
    this._started = true;

    const mm = MusicManager.get();
    mm._init();
    if (!mm.ctx) return;

    this._ctx = mm.ctx;

    // Resume AudioContext if suspended (browser autoplay policy)
    if (this._ctx.state === 'suspended') {
      this._ctx.resume();
    }

    // Cancel any pending fade-out curves from previous music stop()
    // This fixes the race condition where menu music stop(0.3) leaves musicGain at 0
    if (mm.musicGain) {
      mm.musicGain.gain.cancelScheduledValues(this._ctx.currentTime);
      mm.musicGain.gain.setValueAtTime(0.5, this._ctx.currentTime);
    }

    // Create a dedicated gain node for all intro music
    this._gainNode = this._ctx.createGain();
    this._gainNode.gain.value = 0.38;
    this._gainNode.connect(mm.musicGain);

    const t0 = this._ctx.currentTime + 0.02;

    // ═══ ACT 1: "THE AXIS OF EVIL" (0s-8s) ═══
    this._scheduleAct1(t0);

    // ═══ ACT 2: "ISRAEL RESPONDS" (8s-16s) ═══
    this._scheduleAct2(t0 + 8);

    // ═══ ACT 3: "SUPERZION" (16s-25s) ═══
    this._scheduleAct3(t0 + 16);
  }

  /**
   * Stop all intro music immediately — silence everything.
   */
  stop() {
    for (const node of this._nodes) {
      try { if (typeof node.stop === 'function') node.stop(0); } catch (_) {}
      try { if (typeof node.disconnect === 'function') node.disconnect(); } catch (_) {}
    }
    this._nodes = [];
    if (this._gainNode) {
      try { this._gainNode.disconnect(); } catch (_) {}
      this._gainNode = null;
    }
    this._started = false;
  }

  // ═══════════════════════════════════════════════════════════════
  // PRIVATE: Node tracking
  // ═══════════════════════════════════════════════════════════════

  _track(...nodes) {
    for (const n of nodes) this._nodes.push(n);
  }

  _out() {
    return this._gainNode;
  }

  // ═══════════════════════════════════════════════════════════════
  // PRIVATE: Synth primitives
  // ═══════════════════════════════════════════════════════════════

  _createNoiseBuffer(duration) {
    const len = Math.floor(this._ctx.sampleRate * duration);
    const buf = this._ctx.createBuffer(1, len, this._ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    return buf;
  }

  /**
   * Psytrance kick — hard 145BPM kick with punch.
   * Sine sweep 150Hz->40Hz with distortion-like click.
   */
  _psyKick(t, volume = 0.45) {
    const ctx = this._ctx;

    // Click transient
    const click = ctx.createOscillator();
    const clickGain = ctx.createGain();
    click.type = 'sine';
    click.frequency.setValueAtTime(1200, t);
    click.frequency.exponentialRampToValueAtTime(200, t + 0.01);
    clickGain.gain.setValueAtTime(volume * 0.6, t);
    clickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.015);
    click.connect(clickGain);
    clickGain.connect(this._out());
    click.start(t);
    click.stop(t + 0.02);

    // Body
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.08);
    osc.frequency.exponentialRampToValueAtTime(30, t + 0.2);
    gain.gain.setValueAtTime(volume, t);
    gain.gain.setValueAtTime(volume * 0.8, t + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
    osc.connect(gain);
    gain.connect(this._out());
    osc.start(t);
    osc.stop(t + 0.3);

    this._track(click, clickGain, osc, gain);
  }

  /**
   * Hi-hat — ultra-short noise for 16th note patterns.
   */
  _hihat(t, volume = 0.06, open = false) {
    const ctx = this._ctx;
    const dur = open ? 0.12 : 0.035;
    const buf = this._createNoiseBuffer(dur + 0.02);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = open ? 7000 : 9000;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(hp);
    hp.connect(gain);
    gain.connect(this._out());
    src.start(t);
    src.stop(t + dur + 0.02);
    this._track(src, hp, gain);
  }

  /**
   * Acid bassline — resonant sawtooth with filter envelope.
   * Classic 303-style acid squelch.
   */
  _acidBass(t, freq, duration, accent = false, volume = 0.18) {
    const ctx = this._ctx;
    const vol = accent ? volume * 1.4 : volume;

    // Sawtooth oscillator
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, t);

    // Square sub layer for thickness
    const sub = ctx.createOscillator();
    sub.type = 'square';
    sub.frequency.setValueAtTime(freq * 0.5, t);
    const subGain = ctx.createGain();
    subGain.gain.value = 0.3;
    sub.connect(subGain);

    // Resonant lowpass filter — the acid squelch
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    const cutoffPeak = accent ? freq * 12 : freq * 8;
    const cutoffEnd = freq * 1.2;
    filter.frequency.setValueAtTime(cutoffPeak, t);
    filter.frequency.exponentialRampToValueAtTime(cutoffEnd, t + duration * 0.6);
    filter.Q.value = accent ? 18 : 12; // High resonance for acid character

    // Amp envelope
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(vol, t);
    gain.gain.setValueAtTime(vol * 0.7, t + duration * 0.3);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    osc.connect(filter);
    subGain.connect(filter);
    filter.connect(gain);
    gain.connect(this._out());

    osc.start(t);
    osc.stop(t + duration + 0.05);
    sub.start(t);
    sub.stop(t + duration + 0.05);
    this._track(osc, sub, subGain, filter, gain);
  }

  /**
   * Filter sweep — rising or falling resonant sweep for tension.
   */
  _filterSweep(t, duration, startFreq, endFreq, volume = 0.08) {
    const ctx = this._ctx;
    const buf = this._createNoiseBuffer(duration + 0.1);
    const src = ctx.createBufferSource();
    src.buffer = buf;

    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(startFreq, t);
    bp.frequency.exponentialRampToValueAtTime(endFreq, t + duration);
    bp.Q.value = 8;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(volume, t + duration * 0.3);
    gain.gain.linearRampToValueAtTime(volume * 1.2, t + duration * 0.85);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    src.connect(bp);
    bp.connect(gain);
    gain.connect(this._out());
    src.start(t);
    src.stop(t + duration + 0.1);
    this._track(src, bp, gain);
  }

  /**
   * Psy lead — detuned supersaw with fast filter modulation.
   */
  _psyLead(t, freq, duration, volume = 0.07) {
    const ctx = this._ctx;
    const detunes = [0, 7, -7, 14, -14, 20, -20];

    const mixer = ctx.createGain();
    mixer.gain.value = 1;

    for (const det of detunes) {
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.value = freq;
      osc.detune.value = det;
      const voiceGain = ctx.createGain();
      voiceGain.gain.value = volume / detunes.length;
      osc.connect(voiceGain);
      voiceGain.connect(mixer);
      osc.start(t);
      osc.stop(t + duration + 0.05);
      this._track(osc, voiceGain);
    }

    // Fast tremolo LFO for psy character
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.type = 'square';
    lfo.frequency.value = 8; // fast gate
    lfoGain.gain.value = 0.3;
    lfo.connect(lfoGain);
    lfoGain.connect(mixer.gain);

    // Filter
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(freq * 6, t);
    filter.frequency.exponentialRampToValueAtTime(freq * 1.5, t + duration * 0.7);
    filter.Q.value = 5;

    // Envelope
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.001, t);
    env.gain.linearRampToValueAtTime(1, t + 0.01);
    env.gain.setValueAtTime(0.9, t + duration * 0.5);
    env.gain.exponentialRampToValueAtTime(0.001, t + duration);

    mixer.connect(filter);
    filter.connect(env);
    env.connect(this._out());

    lfo.start(t);
    lfo.stop(t + duration + 0.05);
    this._track(mixer, lfo, lfoGain, filter, env);
  }

  /**
   * Dark pad — ominous detuned pad for atmosphere.
   */
  _darkPad(t, freqs, duration, volume = 0.04) {
    const ctx = this._ctx;
    const detunes = [0, 5, -5, 10, -10];

    for (const freq of freqs) {
      for (const det of detunes) {
        const osc = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.value = freq;
        osc.detune.value = det;

        filter.type = 'lowpass';
        filter.frequency.value = freq * 2;

        const voiceVol = volume / (freqs.length * detunes.length);
        gain.gain.setValueAtTime(0.001, t);
        gain.gain.linearRampToValueAtTime(voiceVol, t + duration * 0.2);
        gain.gain.setValueAtTime(voiceVol, t + duration * 0.7);
        gain.gain.linearRampToValueAtTime(0.001, t + duration);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this._out());
        osc.start(t);
        osc.stop(t + duration + 0.1);
        this._track(osc, filter, gain);
      }
    }
  }

  /**
   * Impact boom — massive low-end hit synchronized with visuals.
   */
  _impactBoom(t) {
    const ctx = this._ctx;

    // Primary sub boom
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(50, t);
    osc.frequency.exponentialRampToValueAtTime(15, t + 0.6);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.6, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
    osc.connect(gain);
    gain.connect(this._out());
    osc.start(t);
    osc.stop(t + 0.7);

    // Punch layer
    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(80, t);
    osc2.frequency.exponentialRampToValueAtTime(25, t + 0.3);
    const gain2 = ctx.createGain();
    gain2.gain.setValueAtTime(0.4, t);
    gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    osc2.connect(gain2);
    gain2.connect(this._out());
    osc2.start(t);
    osc2.stop(t + 0.4);

    // Noise burst
    const buf = this._createNoiseBuffer(0.3);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(800, t);
    lp.frequency.exponentialRampToValueAtTime(60, t + 0.25);
    const nGain = ctx.createGain();
    nGain.gain.setValueAtTime(0.2, t);
    nGain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
    src.connect(lp);
    lp.connect(nGain);
    nGain.connect(this._out());
    src.start(t);
    src.stop(t + 0.35);

    this._track(osc, gain, osc2, gain2, src, lp, nGain);
  }

  /**
   * Crash cymbal — noise burst for transitions.
   */
  _crash(t, volume = 0.2) {
    const ctx = this._ctx;
    const buf = this._createNoiseBuffer(1.5);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 4000;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 6000;
    bp.Q.value = 0.5;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume, t);
    gain.gain.setValueAtTime(volume * 0.7, t + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 1.2);
    src.connect(hp);
    hp.connect(bp);
    bp.connect(gain);
    gain.connect(this._out());
    src.start(t);
    src.stop(t + 1.5);
    this._track(src, hp, bp, gain);
  }

  /**
   * Reverse crash — builds up to a hit point.
   */
  _reverseCrash(t, duration, volume = 0.15) {
    const ctx = this._ctx;
    const buf = this._createNoiseBuffer(duration + 0.1);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.setValueAtTime(12000, t);
    hp.frequency.exponentialRampToValueAtTime(3000, t + duration);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.001, t);
    gain.gain.exponentialRampToValueAtTime(volume, t + duration * 0.95);
    gain.gain.setValueAtTime(0.001, t + duration);
    src.connect(hp);
    hp.connect(gain);
    gain.connect(this._out());
    src.start(t);
    src.stop(t + duration + 0.1);
    this._track(src, hp, gain);
  }

  /**
   * Acid squelch FX — short resonant filter zap.
   */
  _acidSquelch(t, freq = 300, volume = 0.1) {
    const ctx = this._ctx;
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.value = freq;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(freq * 20, t);
    filter.frequency.exponentialRampToValueAtTime(freq, t + 0.15);
    filter.Q.value = 22;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this._out());
    osc.start(t);
    osc.stop(t + 0.25);
    this._track(osc, filter, gain);
  }

  // ═══════════════════════════════════════════════════════════════
  // ACT 1: "THE AXIS OF EVIL" — Dark psytrance, 145 BPM
  // 0s to 8s — enemies with action, missiles, explosions
  // ═══════════════════════════════════════════════════════════════

  _scheduleAct1(t0) {
    const bpm = 145;
    const beat = 60 / bpm; // ~0.4138s
    const sixteenth = beat / 4;
    const duration = 8.0;
    const totalBeats = Math.floor(duration / beat); // ~19 beats

    // ─── Psytrance kick on every beat ───
    for (let i = 0; i < totalBeats; i++) {
      const t = t0 + i * beat;
      if (t < t0 + duration) {
        this._psyKick(t, 0.4);
      }
    }

    // ─── Hi-hat on every 16th note ───
    const totalSixteenths = Math.floor(duration / sixteenth);
    for (let i = 0; i < totalSixteenths; i++) {
      const t = t0 + i * sixteenth;
      if (t < t0 + duration) {
        // Open hat on offbeats (every other 8th)
        const isOffbeat = (i % 4 === 2);
        this._hihat(t, isOffbeat ? 0.05 : 0.035, isOffbeat);
      }
    }

    // ─── Acid bassline: dark minor key, relentless 16th note pattern ───
    // A minor phrygian pattern for evil feel
    const bassPattern = [N.A2, N.A2, N.E2, N.A2, N.F2, N.A2, N.E2, N.D2];
    const noteLen = beat * 0.8;
    for (let i = 0; i < totalBeats; i++) {
      const t = t0 + i * beat;
      if (t < t0 + duration) {
        const note = bassPattern[i % bassPattern.length];
        const accent = (i % 4 === 0);
        this._acidBass(t, note, noteLen, accent, 0.14);
      }
    }

    // ─── Dark atmospheric pad ───
    this._darkPad(t0, [N.A3, N.C4, N.E4], duration, 0.2);

    // ─── Filter sweep building tension (last 3s of act) ───
    this._filterSweep(t0 + 5, 3, 200, 8000, 0.07);

    // ─── Impact booms synced with visual boss appearances ───
    // Boss 1 (FoamBeard) at 1.2s, Boss 2 (TurboTurban) at 2.8s,
    // Boss 3 (Warden) at 4.4s, Boss 4 (SupremeTurban) at 6.0s
    this._impactBoom(t0 + 1.2);
    this._impactBoom(t0 + 2.8);
    this._impactBoom(t0 + 4.4);
    this._impactBoom(t0 + 6.0);

    // ─── Acid squelches synchronized with boss hits ───
    this._acidSquelch(t0 + 1.2, 200, 0.08);
    this._acidSquelch(t0 + 2.8, 250, 0.08);
    this._acidSquelch(t0 + 4.4, 180, 0.08);
    this._acidSquelch(t0 + 6.0, 300, 0.09);

    // ─── Reverse crash leading into Act 2 ───
    this._reverseCrash(t0 + 6.5, 1.5, 0.12);
  }

  // ═══════════════════════════════════════════════════════════════
  // ACT 2: "ISRAEL RESPONDS" — Heroic psytrance, full power
  // 8s to 16s — jets, explosions, iron dome
  // ═══════════════════════════════════════════════════════════════

  _scheduleAct2(t0) {
    const bpm = 145;
    const beat = 60 / bpm;
    const sixteenth = beat / 4;
    const duration = 8.0;
    const totalBeats = Math.floor(duration / beat);

    // ─── Crash at transition ───
    this._crash(t0, 0.25);
    this._impactBoom(t0);

    // ─── Psytrance kick — every beat, louder ───
    for (let i = 0; i < totalBeats; i++) {
      const t = t0 + i * beat;
      if (t < t0 + duration) {
        this._psyKick(t, 0.48);
      }
    }

    // ─── Hi-hat on every 16th ───
    const totalSixteenths = Math.floor(duration / sixteenth);
    for (let i = 0; i < totalSixteenths; i++) {
      const t = t0 + i * sixteenth;
      if (t < t0 + duration) {
        const isOffbeat = (i % 4 === 2);
        this._hihat(t, isOffbeat ? 0.06 : 0.04, isOffbeat);
      }
    }

    // ─── Acid bassline: brighter, more aggressive, major feel ───
    // C major / uplifting pattern
    const bassPattern = [N.C3, N.C3, N.G2, N.C3, N.E2, N.G2, N.C3, N.G2];
    const noteLen = beat * 0.75;
    for (let i = 0; i < totalBeats; i++) {
      const t = t0 + i * beat;
      if (t < t0 + duration) {
        const note = bassPattern[i % bassPattern.length];
        const accent = (i % 2 === 0);
        this._acidBass(t, note, noteLen, accent, 0.16);
      }
    }

    // ─── Psy lead melody — heroic ascending runs ───
    // First run at start
    const melodyRun1 = [N.C5, N.E5, N.G5, N.C6];
    for (let i = 0; i < melodyRun1.length; i++) {
      this._psyLead(t0 + 0.5 + i * beat * 0.6, melodyRun1[i], beat * 0.5, 0.06);
    }
    // Second run at midpoint
    const melodyRun2 = [N.D5, N.G5, N.A5, N.D6];
    for (let i = 0; i < melodyRun2.length; i++) {
      this._psyLead(t0 + 4.0 + i * beat * 0.6, melodyRun2[i], beat * 0.5, 0.06);
    }

    // ─── Bright pad: C major ───
    this._darkPad(t0, [N.C4, N.E4, N.G4], duration, 0.25);

    // ─── Filter sweeps for jet/missile energy ───
    this._filterSweep(t0, 4, 300, 10000, 0.06);
    this._filterSweep(t0 + 4, 4, 500, 12000, 0.07);

    // ─── Impact booms at key action moments ───
    // Jet fire at 1s, bomb drop at 3s, Iron Dome at 5s, tank fire at 7s
    this._impactBoom(t0 + 1.0);
    this._impactBoom(t0 + 3.0);
    this._impactBoom(t0 + 5.0);
    this._impactBoom(t0 + 7.0);

    // ─── Acid squelches on explosions ───
    this._acidSquelch(t0 + 1.0, 400, 0.07);
    this._acidSquelch(t0 + 3.0, 350, 0.07);
    this._acidSquelch(t0 + 5.0, 500, 0.08);

    // ─── Reverse crash leading into Act 3 ───
    this._reverseCrash(t0 + 6.5, 1.5, 0.15);
  }

  // ═══════════════════════════════════════════════════════════════
  // ACT 3: "SUPERZION" — Epic climax psytrance
  // 16s to 25s — hero moment, title drop, massive impact
  // ═══════════════════════════════════════════════════════════════

  _scheduleAct3(t0) {
    const bpm = 145;
    const beat = 60 / bpm;
    const sixteenth = beat / 4;
    const duration = 9.0;
    const totalBeats = Math.floor(duration / beat);

    // ─── Crash + boom at entry ───
    this._crash(t0, 0.3);
    this._impactBoom(t0);

    // ─── Psytrance kick — full power, every beat ───
    for (let i = 0; i < totalBeats; i++) {
      const t = t0 + i * beat;
      if (t < t0 + duration) {
        this._psyKick(t, 0.5);
      }
    }

    // ─── Hi-hats — 16th notes, brighter ───
    const totalSixteenths = Math.floor(duration / sixteenth);
    for (let i = 0; i < totalSixteenths; i++) {
      const t = t0 + i * sixteenth;
      if (t < t0 + duration) {
        const isOffbeat = (i % 4 === 2);
        this._hihat(t, isOffbeat ? 0.065 : 0.045, isOffbeat);
      }
    }

    // ─── Acid bassline: D minor, aggressive psy pattern ───
    const bassPattern = [N.D2, N.D2, N.A1, N.D2, N.F2, N.D2, N.A1, N.D2];
    const noteLen = beat * 0.7;
    for (let i = 0; i < totalBeats; i++) {
      const t = t0 + i * beat;
      if (t < t0 + duration) {
        const note = bassPattern[i % bassPattern.length];
        const accent = (i % 2 === 0);
        this._acidBass(t, note, noteLen, accent, 0.18);
      }
    }

    // ─── Psy lead: heroic D minor melody ───
    // Walking-in melody (first 4s)
    const walkMelody = [N.D5, N.F5, N.A5, N.D6, N.A5, N.F5];
    for (let i = 0; i < walkMelody.length; i++) {
      this._psyLead(t0 + 0.5 + i * beat * 0.9, walkMelody[i], beat * 0.7, 0.07);
    }

    // ─── Epic pad: D minor ───
    this._darkPad(t0, [N.D3, N.F3, N.A3], 5, 0.3);
    // Shift to D major for heroic resolution
    const Fsharp3 = 185.0;
    this._darkPad(t0 + 5, [N.D3, Fsharp3, N.A3], 4, 0.35);

    // ─── MASSIVE IMPACT at ~5s — "SUPERZION" title reveal ───
    const titleTime = t0 + 5.0;
    this._impactBoom(titleTime);
    this._impactBoom(titleTime + 0.05); // double hit for massive effect
    this._crash(titleTime, 0.35);

    // ─── Acid squelch barrage at title ───
    this._acidSquelch(titleTime, 300, 0.12);
    this._acidSquelch(titleTime + 0.1, 450, 0.1);
    this._acidSquelch(titleTime + 0.2, 200, 0.08);

    // ─── Filter sweep from title to end ───
    this._filterSweep(t0 + 5, 4, 400, 14000, 0.08);

    // ─── Post-title heroic lead ───
    const heroMelody = [N.D6, N.A5, N.D6, N.F5, N.A5, N.D6];
    for (let i = 0; i < heroMelody.length; i++) {
      const noteTime = titleTime + 0.5 + i * beat * 0.7;
      if (noteTime < t0 + duration - 0.5) {
        this._psyLead(noteTime, heroMelody[i], beat * 0.6, 0.065 + i * 0.003);
      }
    }

    // ─── Build intensity: double-time kicks in last 2s ───
    const buildStart = t0 + duration - 2.0;
    const eighthNote = beat / 2;
    for (let i = 0; i < 10; i++) {
      const bt = buildStart + i * eighthNote;
      if (bt < t0 + duration) {
        this._psyKick(bt, 0.35 + i * 0.015);
      }
    }

    // ─── Final crash at end ───
    this._crash(t0 + duration - 0.2, 0.25);
  }
}

// ═══════════════════════════════════════════════════════════════
// EXPORTED SOUND EFFECT FUNCTIONS
// These are standalone functions that take an AudioContext,
// a gain node to connect to, and timing parameters.
// ═══════════════════════════════════════════════════════════════

/**
 * Rhythmic march stomp sounds — boots hitting the ground.
 */
export function playMarchSteps(ctx, gainNode, startTime, count, interval) {
  const nodes = [];
  for (let i = 0; i < count; i++) {
    const t = startTime + i * interval;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(80, t);
    osc.frequency.exponentialRampToValueAtTime(35, t + 0.1);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
    osc.connect(gain);
    gain.connect(gainNode);
    osc.start(t);
    osc.stop(t + 0.2);
    nodes.push(osc, gain);

    const bufLen = Math.floor(ctx.sampleRate * 0.08);
    const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let j = 0; j < bufLen; j++) data[j] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 2000;
    const nGain = ctx.createGain();
    nGain.gain.setValueAtTime(0.04, t);
    nGain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
    src.connect(hp);
    hp.connect(nGain);
    nGain.connect(gainNode);
    src.start(t);
    src.stop(t + 0.1);
    nodes.push(src, hp, nGain);
  }
  return nodes;
}

/**
 * Jet flyby — sine sweep with noise turbulence.
 */
export function playJetFlyby(ctx, gainNode, startTime) {
  const nodes = [];
  const t = startTime;
  const duration = 3.0;
  const osc = ctx.createOscillator();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(200, t);
  osc.frequency.exponentialRampToValueAtTime(800, t + duration * 0.45);
  osc.frequency.exponentialRampToValueAtTime(200, t + duration);
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.setValueAtTime(400, t);
  lp.frequency.exponentialRampToValueAtTime(2000, t + duration * 0.45);
  lp.frequency.exponentialRampToValueAtTime(300, t + duration);
  lp.Q.value = 2;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.01, t);
  gain.gain.linearRampToValueAtTime(0.12, t + duration * 0.4);
  gain.gain.linearRampToValueAtTime(0.15, t + duration * 0.5);
  gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
  osc.connect(lp);
  lp.connect(gain);
  gain.connect(gainNode);
  osc.start(t);
  osc.stop(t + duration + 0.1);
  nodes.push(osc, lp, gain);

  const bufLen = Math.floor(ctx.sampleRate * (duration + 0.2));
  const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < bufLen; i++) data[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.setValueAtTime(300, t);
  bp.frequency.exponentialRampToValueAtTime(1200, t + duration * 0.45);
  bp.frequency.exponentialRampToValueAtTime(300, t + duration);
  bp.Q.value = 1;
  const nGain = ctx.createGain();
  nGain.gain.setValueAtTime(0.005, t);
  nGain.gain.linearRampToValueAtTime(0.06, t + duration * 0.45);
  nGain.gain.exponentialRampToValueAtTime(0.001, t + duration);
  src.connect(bp);
  bp.connect(nGain);
  nGain.connect(gainNode);
  src.start(t);
  src.stop(t + duration + 0.1);
  nodes.push(src, bp, nGain);

  return nodes;
}

/**
 * Tank rumble — low brown noise rumble.
 */
export function playTankRumble(ctx, gainNode, startTime, duration) {
  const nodes = [];
  const t = startTime;
  const bufLen = Math.floor(ctx.sampleRate * (duration + 0.2));
  const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
  const data = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < bufLen; i++) {
    const white = Math.random() * 2 - 1;
    last = (last + 0.02 * white) / 1.02;
    data[i] = last * 3.5;
  }
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 120;
  lp.Q.value = 1;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.001, t);
  gain.gain.linearRampToValueAtTime(0.15, t + 0.3);
  gain.gain.setValueAtTime(0.15, t + duration - 0.5);
  gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
  src.connect(lp);
  lp.connect(gain);
  gain.connect(gainNode);
  src.start(t);
  src.stop(t + duration + 0.1);
  nodes.push(src, lp, gain);

  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.value = 28;
  const oGain = ctx.createGain();
  oGain.gain.setValueAtTime(0.001, t);
  oGain.gain.linearRampToValueAtTime(0.08, t + 0.3);
  oGain.gain.setValueAtTime(0.08, t + duration - 0.5);
  oGain.gain.exponentialRampToValueAtTime(0.001, t + duration);
  osc.connect(oGain);
  oGain.connect(gainNode);
  osc.start(t);
  osc.stop(t + duration + 0.1);
  nodes.push(osc, oGain);

  return nodes;
}

/**
 * Missile whoosh — ascending sweep with noise.
 */
export function playMissileWhoosh(ctx, gainNode, startTime) {
  const nodes = [];
  const t = startTime;
  const duration = 1.5;
  const osc = ctx.createOscillator();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(150, t);
  osc.frequency.exponentialRampToValueAtTime(3000, t + duration * 0.8);
  osc.frequency.exponentialRampToValueAtTime(4000, t + duration);
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.setValueAtTime(300, t);
  lp.frequency.exponentialRampToValueAtTime(5000, t + duration * 0.7);
  lp.Q.value = 3;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.01, t);
  gain.gain.linearRampToValueAtTime(0.1, t + duration * 0.3);
  gain.gain.linearRampToValueAtTime(0.14, t + duration * 0.7);
  gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
  osc.connect(lp);
  lp.connect(gain);
  gain.connect(gainNode);
  osc.start(t);
  osc.stop(t + duration + 0.1);
  nodes.push(osc, lp, gain);

  const bufLen = Math.floor(ctx.sampleRate * (duration + 0.2));
  const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < bufLen; i++) data[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const hp = ctx.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.setValueAtTime(1000, t);
  hp.frequency.exponentialRampToValueAtTime(6000, t + duration);
  const nGain = ctx.createGain();
  nGain.gain.setValueAtTime(0.005, t);
  nGain.gain.linearRampToValueAtTime(0.08, t + duration * 0.6);
  nGain.gain.exponentialRampToValueAtTime(0.001, t + duration);
  src.connect(hp);
  hp.connect(nGain);
  nGain.connect(gainNode);
  src.start(t);
  src.stop(t + duration + 0.1);
  nodes.push(src, hp, nGain);

  return nodes;
}

/**
 * Wind ambient — gentle filtered noise.
 */
export function playWindAmbient(ctx, gainNode, startTime, duration) {
  const nodes = [];
  const t = startTime;
  const bufLen = Math.floor(ctx.sampleRate * (duration + 0.3));
  const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < bufLen; i++) data[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = 600;
  bp.Q.value = 0.3;
  const lfo = ctx.createOscillator();
  const lfoGain = ctx.createGain();
  lfo.type = 'sine';
  lfo.frequency.value = 0.3;
  lfoGain.gain.value = 300;
  lfo.connect(lfoGain);
  lfoGain.connect(bp.frequency);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.001, t);
  gain.gain.linearRampToValueAtTime(0.06, t + duration * 0.15);
  gain.gain.setValueAtTime(0.06, t + duration * 0.8);
  gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
  src.connect(bp);
  bp.connect(gain);
  gain.connect(gainNode);
  src.start(t);
  src.stop(t + duration + 0.2);
  lfo.start(t);
  lfo.stop(t + duration + 0.2);
  nodes.push(src, bp, lfo, lfoGain, gain);

  return nodes;
}
