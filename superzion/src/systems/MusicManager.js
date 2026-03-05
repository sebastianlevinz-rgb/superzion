// ═══════════════════════════════════════════════════════════════
// MusicManager — Procedural trance/psytrance music engine
// Web Audio API only, no external files
// Infected Mushroom-inspired: acid bass, fast arpeggios, kicks
// ═══════════════════════════════════════════════════════════════

let instance = null;

// Note frequencies (Hz)
const NOTE = {
  A2: 110, Bb2: 116.54, B2: 123.47, C3: 130.81, Db3: 138.59, D3: 146.83,
  Eb3: 155.56, E3: 164.81, F3: 174.61, Gb3: 185, G3: 196, Ab3: 207.65,
  A3: 220, Bb3: 233.08, B3: 246.94, C4: 261.63, Db4: 277.18, D4: 293.66,
  Eb4: 311.13, E4: 329.63, F4: 349.23, Gb4: 369.99, G4: 392, Ab4: 415.30,
  A4: 440, Bb4: 466.16, B4: 493.88, C5: 523.25, Db5: 554.37, D5: 587.33,
  Eb5: 622.25, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880,
};

// Scale patterns (semitones from root)
const SCALES = {
  minorHarmonic: [0, 2, 3, 5, 7, 8, 11],  // A harmonic minor
  minor: [0, 2, 3, 5, 7, 8, 10],           // natural minor
  phrygian: [0, 1, 3, 5, 7, 8, 10],        // phrygian (dark)
};

export default class MusicManager {
  static get() {
    if (!instance) {
      instance = new MusicManager();
      window.__musicManager = instance;
    }
    return instance;
  }

  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.musicGain = null;
    this.currentTrack = null;
    this.loopTimer = null;
    this.muted = false;
    this._nodes = [];       // active audio nodes for cleanup
    this._loopId = 0;       // for identifying stale loops
  }

  _init() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.connect(this.ctx.destination);
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = 0.5;
      this.musicGain.connect(this.masterGain);
      if (this.ctx.state === 'suspended') this.ctx.resume();
    } catch (e) {
      this.ctx = null;
      this.masterGain = null;
      this.musicGain = null;
    }
  }

  _createNoiseBuffer(duration) {
    const length = Math.floor(this.ctx.sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, length, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
    return buffer;
  }

  // Get note frequency from root + semitone offset
  _noteFreq(rootHz, semitones) {
    return rootHz * Math.pow(2, semitones / 12);
  }

  // Build scale frequencies from root
  _buildScale(rootHz, scalePattern, octaves) {
    const notes = [];
    for (let oct = 0; oct < octaves; oct++) {
      for (const semi of scalePattern) {
        notes.push(rootHz * Math.pow(2, oct + semi / 12));
      }
    }
    return notes;
  }

  // ═════════════════════════════════════════════════════════════
  // CORE: Scheduling + looping
  // ═════════════════════════════════════════════════════════════

  // Stop current music with optional fadeout (equal-power cosine curve)
  stop(fadeTime = 0.5) {
    this._loopId++
    if (!this.ctx || !this.musicGain) return
    if (this.loopTimer) {
      clearTimeout(this.loopTimer)
      this.loopTimer = null
    }

    const t = this.ctx.currentTime
    const currentVol = this.musicGain.gain.value

    // Edge case: immediate stop when fadeTime or volume is negligible
    if (fadeTime <= 0 || currentVol <= 0.001) {
      this.musicGain.gain.cancelScheduledValues(t)
      this.musicGain.gain.value = 0
      this._cleanupNodes()
      if (this.ctx && this.musicGain) {
        this.musicGain.gain.value = 0.5
      }
      this.currentTrack = null
      return
    }

    // Build equal-power fade-out curve: cos(0..pi/2) scaled by current volume
    if (!this._fadeOutCurve) {
      this._fadeOutCurve = new Float32Array(64)
      for (let i = 0; i < 64; i++) {
        this._fadeOutCurve[i] = Math.cos((i / 63) * 0.5 * Math.PI)
      }
    }
    const curve = new Float32Array(64)
    for (let i = 0; i < 64; i++) {
      curve[i] = this._fadeOutCurve[i] * currentVol
    }

    // Cancel any pending automations before scheduling new curve (pitfall 1)
    this.musicGain.gain.cancelScheduledValues(t)
    this.musicGain.gain.setValueAtTime(currentVol, t)
    this.musicGain.gain.setValueCurveAtTime(curve, t, fadeTime)

    // Schedule cleanup — guarded by loopId so a new _startLoop won't be killed
    const cleanupId = this._loopId
    setTimeout(() => {
      if (this._loopId !== cleanupId) return // newer track started, skip cleanup
      this._cleanupNodes()
      if (this.ctx && this.musicGain) {
        this.musicGain.gain.cancelScheduledValues(this.ctx.currentTime)
        this.musicGain.gain.value = 0.5
      }
    }, (fadeTime + 0.2) * 1000)
    this.currentTrack = null
  }

  _cleanupNodes() {
    for (const n of this._nodes) {
      try { if (typeof n.stop === 'function') n.stop(); } catch (e) {}
      try { if (typeof n.disconnect === 'function') n.disconnect(); } catch (e) {}
    }
    this._nodes = [];
  }

  // Crossfade from current track to a new track with equal-power overlap
  crossfadeTo(trackName, startFn, duration = 1.5) {
    if (this.currentTrack === trackName) return
    this._init()
    if (!this.ctx) return

    const t = this.ctx.currentTime

    // Capture outgoing state
    const outGain = this.musicGain
    const outVol = outGain ? outGain.gain.value : 0
    const oldNodes = [...this._nodes]
    const oldLoopTimer = this.loopTimer

    // Create incoming gain node
    const inGain = this.ctx.createGain()
    inGain.gain.value = 0
    inGain.connect(this.masterGain)

    // Build equal-power crossfade curves (64 samples)
    const outCurve = new Float32Array(64)
    const inCurve = new Float32Array(64)
    const targetVol = 0.5
    for (let i = 0; i < 64; i++) {
      const pct = i / 63
      outCurve[i] = Math.cos(pct * 0.5 * Math.PI) * outVol
      inCurve[i] = Math.sin(pct * 0.5 * Math.PI) * targetVol
    }

    // Schedule fade curves on both gains
    if (outGain) {
      outGain.gain.cancelScheduledValues(t)
      outGain.gain.setValueAtTime(outVol, t)
      outGain.gain.setValueCurveAtTime(outCurve, t, duration)
    }
    inGain.gain.cancelScheduledValues(t)
    inGain.gain.setValueAtTime(0, t)
    inGain.gain.setValueCurveAtTime(inCurve, t, duration)

    // Invalidate old loop
    this._loopId++
    if (oldLoopTimer) clearTimeout(oldLoopTimer)
    this.loopTimer = null

    // Swap musicGain to the incoming gain BEFORE calling startFn
    this.musicGain = inGain
    this._nodes = []
    this.currentTrack = trackName

    // Start the new track (startFn will use _startLoop which connects to this.musicGain)
    startFn()

    // Schedule cleanup of old nodes and outgoing gain after crossfade completes
    const cleanupId = this._loopId
    setTimeout(() => {
      if (this._loopId !== cleanupId) return
      for (const n of oldNodes) {
        try { if (typeof n.stop === 'function') n.stop() } catch (e) {}
        try { if (typeof n.disconnect === 'function') n.disconnect() } catch (e) {}
      }
      if (outGain) {
        outGain.gain.cancelScheduledValues(0)
        outGain.gain.value = 0
        try { outGain.disconnect() } catch (e) {}
      }
    }, (duration + 0.2) * 1000)
  }

  // Hard shutdown: immediate silence + full node cleanup (for scene destroy)
  shutdown() {
    this._loopId++
    if (this.loopTimer) {
      clearTimeout(this.loopTimer)
      this.loopTimer = null
    }
    if (this.ctx && this.musicGain) {
      this.musicGain.gain.cancelScheduledValues(this.ctx.currentTime)
      this.musicGain.gain.value = 0
    }
    this._cleanupNodes()
    this.currentTrack = null
  }

  // Schedule a loop: calls generator function every loopDuration seconds
  _startLoop(trackName, loopDuration, generator, vol = 0.5) {
    this._init();
    if (!this.ctx || !this.musicGain) return;
    this.stop(0.3);
    // Increment loopId AGAIN after stop() so stop's cleanup is invalidated
    this._loopId++;
    const myId = this._loopId;
    this.currentTrack = trackName;

    const scheduleNext = () => {
      if (this._loopId !== myId) return;
      // Clean up old nodes from previous loop iteration (prevents unbounded growth)
      this._cleanupNodes();
      generator(this.ctx.currentTime);
      this.loopTimer = setTimeout(() => scheduleNext(), loopDuration * 1000 - 100);
    };
    // Delay to let fade finish, then set volume and start
    setTimeout(() => {
      if (this._loopId !== myId) return;
      this.musicGain.gain.cancelScheduledValues(this.ctx.currentTime);
      this.musicGain.gain.setValueAtTime(vol, this.ctx.currentTime);
      scheduleNext();
    }, 350);
  }

  setMuted(muted) {
    this._init();
    if (!this.ctx || !this.masterGain) return;
    this.muted = muted;
    // Use short ramp to avoid click/pop
    const t = this.ctx.currentTime;
    this.masterGain.gain.cancelScheduledValues(t);
    this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, t);
    this.masterGain.gain.linearRampToValueAtTime(muted ? 0 : 1, t + 0.02);
  }

  toggleMute() {
    this.setMuted(!this.muted);
    return this.muted;
  }

  // ═════════════════════════════════════════════════════════════
  // SYNTH PRIMITIVES
  // ═════════════════════════════════════════════════════════════

  // Trance kick drum: sine pitch sweep + click
  _kick(t, vol = 0.35) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.12);
    gain.gain.setValueAtTime(vol, t);
    gain.gain.setValueAtTime(vol * 0.8, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
    osc.connect(gain); gain.connect(this.musicGain);
    osc.start(t); osc.stop(t + 0.25);
    this._nodes.push(osc, gain);

    // Click transient
    const click = this.ctx.createOscillator();
    const cGain = this.ctx.createGain();
    click.type = 'square';
    click.frequency.value = 800;
    cGain.gain.setValueAtTime(vol * 0.3, t);
    cGain.gain.exponentialRampToValueAtTime(0.001, t + 0.01);
    click.connect(cGain); cGain.connect(this.musicGain);
    click.start(t); click.stop(t + 0.02);
    this._nodes.push(click, cGain);
  }

  // Closed hi-hat: filtered noise
  _hihat(t, vol = 0.06) {
    const buf = this._createNoiseBuffer(0.06);
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const hp = this.ctx.createBiquadFilter();
    hp.type = 'highpass'; hp.frequency.value = 8000;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
    src.connect(hp); hp.connect(gain); gain.connect(this.musicGain);
    src.start(t); src.stop(t + 0.06);
    this._nodes.push(src, hp, gain);
  }

  // Open hi-hat: longer noise
  _openHat(t, vol = 0.04) {
    const buf = this._createNoiseBuffer(0.2);
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const hp = this.ctx.createBiquadFilter();
    hp.type = 'highpass'; hp.frequency.value = 7000;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
    src.connect(hp); hp.connect(gain); gain.connect(this.musicGain);
    src.start(t); src.stop(t + 0.2);
    this._nodes.push(src, hp, gain);
  }

  // Snare: noise + triangle body
  _snare(t, vol = 0.12) {
    const buf = this._createNoiseBuffer(0.15);
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass'; bp.frequency.value = 3000;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
    src.connect(bp); bp.connect(gain); gain.connect(this.musicGain);
    src.start(t); src.stop(t + 0.15);
    this._nodes.push(src, bp, gain);

    const body = this.ctx.createOscillator();
    const bGain = this.ctx.createGain();
    body.type = 'triangle'; body.frequency.value = 180;
    bGain.gain.setValueAtTime(vol * 0.6, t);
    bGain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
    body.connect(bGain); bGain.connect(this.musicGain);
    body.start(t); body.stop(t + 0.1);
    this._nodes.push(body, bGain);
  }

  // Acid bass: sawtooth through resonant lowpass
  _acidBass(t, freq, dur, vol = 0.15) {
    const osc = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth'; osc.frequency.value = freq;
    osc2.type = 'square'; osc2.frequency.value = freq * 1.002; // slight detune
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(freq * 8, t);
    filter.frequency.exponentialRampToValueAtTime(freq * 1.5, t + dur * 0.7);
    filter.Q.value = 12;

    gain.gain.setValueAtTime(vol, t);
    gain.gain.setValueAtTime(vol * 0.8, t + dur * 0.5);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

    osc.connect(filter); osc2.connect(filter);
    filter.connect(gain); gain.connect(this.musicGain);
    osc.start(t); osc.stop(t + dur);
    osc2.start(t); osc2.stop(t + dur);
    this._nodes.push(osc, osc2, filter, gain);
  }

  // Pad: detuned sawtooths with lowpass
  _pad(t, freq, dur, vol = 0.06) {
    const voices = [0, 5, -5, 7, -7]; // detune cents
    for (const detune of voices) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();
      osc.type = 'sawtooth';
      osc.frequency.value = freq;
      osc.detune.value = detune;
      filter.type = 'lowpass';
      filter.frequency.value = freq * 3;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(vol / voices.length, t + dur * 0.2);
      gain.gain.setValueAtTime(vol / voices.length, t + dur * 0.7);
      gain.gain.linearRampToValueAtTime(0, t + dur);
      osc.connect(filter); filter.connect(gain); gain.connect(this.musicGain);
      osc.start(t); osc.stop(t + dur + 0.1);
      this._nodes.push(osc, gain, filter);
    }
  }

  // Lead synth: square with filter sweep
  _lead(t, freq, dur, vol = 0.08) {
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.value = freq;
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(freq * 6, t);
    filter.frequency.exponentialRampToValueAtTime(freq * 2, t + dur * 0.8);
    filter.Q.value = 5;
    gain.gain.setValueAtTime(vol, t);
    gain.gain.setValueAtTime(vol * 0.7, t + dur * 0.6);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(filter); filter.connect(gain); gain.connect(this.musicGain);
    osc.start(t); osc.stop(t + dur);
    this._nodes.push(osc, filter, gain);
  }

  // Arpeggio note: short sine/triangle
  _arp(t, freq, dur, vol = 0.07, type = 'triangle') {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(gain); gain.connect(this.musicGain);
    osc.start(t); osc.stop(t + dur);
    this._nodes.push(osc, gain);
  }

  // Clap: layered noise bursts
  _clap(t, vol = 0.08) {
    for (let i = 0; i < 3; i++) {
      const buf = this._createNoiseBuffer(0.04);
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      const bp = this.ctx.createBiquadFilter();
      bp.type = 'bandpass'; bp.frequency.value = 2000;
      const gain = this.ctx.createGain();
      const offset = i * 0.01;
      gain.gain.setValueAtTime(vol * (1 - i * 0.2), t + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, t + offset + 0.08);
      src.connect(bp); bp.connect(gain); gain.connect(this.musicGain);
      src.start(t + offset); src.stop(t + offset + 0.08);
      this._nodes.push(src, bp, gain);
    }
  }

  // ═════════════════════════════════════════════════════════════
  // MENU MUSIC — Atmospheric trance, Am, mysterious
  // ═════════════════════════════════════════════════════════════

  playMenuMusic() {
    const bpm = 130;
    const beat = 60 / bpm;
    const barLen = beat * 4;
    const loopLen = barLen * 8; // 8 bars

    this._startLoop('menu', loopLen, (startT) => {
      const t = startT;
      // Am chord tones: A3, C4, E4
      // Pad: Am chord sustained
      this._pad(t, NOTE.A3, loopLen, 0.05);
      this._pad(t, NOTE.C4, loopLen, 0.04);
      this._pad(t, NOTE.E4, loopLen, 0.035);

      // Soft kick every beat
      for (let i = 0; i < 32; i++) {
        this._kick(t + i * beat, 0.1);
      }

      // Arpeggio in Am: A4 C5 E5 A5 E5 C5
      const arpNotes = [NOTE.A4, NOTE.C5, NOTE.E5, NOTE.A5, NOTE.E5, NOTE.C5];
      const arpStep = beat / 2;
      for (let bar = 0; bar < 8; bar++) {
        for (let i = 0; i < 8; i++) {
          const note = arpNotes[i % arpNotes.length];
          this._arp(t + bar * barLen + i * arpStep, note, arpStep * 0.8, 0.04);
        }
      }

      // Sub bass: A2 whole notes
      for (let bar = 0; bar < 8; bar++) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = NOTE.A2;
        gain.gain.setValueAtTime(0.08, t + bar * barLen);
        gain.gain.setValueAtTime(0.08, t + (bar + 1) * barLen - 0.05);
        gain.gain.linearRampToValueAtTime(0.06, t + (bar + 1) * barLen);
        osc.connect(gain); gain.connect(this.musicGain);
        osc.start(t + bar * barLen); osc.stop(t + (bar + 1) * barLen);
        this._nodes.push(osc, gain);
      }
    }, 0.4);
  }

  // ═════════════════════════════════════════════════════════════
  // CINEMATIC MUSIC — Ambient/downtempo, no kick
  // ═════════════════════════════════════════════════════════════

  playCinematicMusic(levelNum) {
    const bpm = 80;
    const beat = 60 / bpm;
    const loopLen = beat * 4 * 4; // 4 bars

    // Different root notes per level
    const roots = {
      1: NOTE.A3, 2: NOTE.C4, 3: NOTE.D3,
      4: NOTE.E3, 5: NOTE.A3, 6: NOTE.D3,
    };
    const root = roots[levelNum] || NOTE.A3;

    this._startLoop('cinematic_' + levelNum, loopLen, (startT) => {
      const t = startT;
      // Dark pad
      this._pad(t, root, loopLen, 0.09);
      this._pad(t, root * 1.5, loopLen, 0.06); // fifth
      this._pad(t, root * 1.2, loopLen, 0.05); // minor third

      // Gentle arpeggio
      const scale = this._buildScale(root * 2, SCALES.minor, 2);
      const arpStep = beat;
      for (let i = 0; i < 16; i++) {
        const note = scale[i % scale.length];
        this._arp(t + i * arpStep, note, arpStep * 0.6, 0.045, 'sine');
      }
    }, 0.55);
  }

  // ═════════════════════════════════════════════════════════════
  // LEVEL 1 — Tehran Stealth, tense ambient, 90 BPM
  // Low, creeping atmosphere — no fast beats during stealth
  // ═════════════════════════════════════════════════════════════

  playLevel1Music(intense = false) {
    const bpm = 90;
    const beat = 60 / bpm;
    const barLen = beat * 4;
    const loopLen = barLen * 8;

    this._startLoop('level1', loopLen, (startT) => {
      const t = startT;

      // Dark drone pad — A harmonic minor
      this._pad(t, NOTE.A2, loopLen, 0.06);
      this._pad(t, NOTE.E3, loopLen, 0.03);
      this._pad(t, NOTE.C3, loopLen, 0.025);

      // Slow pulsing sub bass
      const bassNotes = [NOTE.A2, NOTE.A2, NOTE.E3, NOTE.E3, NOTE.F3, NOTE.F3, NOTE.Ab3, NOTE.E3];
      for (let bar = 0; bar < 8; bar++) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = bassNotes[bar] * 0.5;
        const st = t + bar * barLen;
        gain.gain.setValueAtTime(0.08, st);
        gain.gain.exponentialRampToValueAtTime(0.02, st + barLen * 0.9);
        osc.connect(gain); gain.connect(this.musicGain);
        osc.start(st); osc.stop(st + barLen);
        this._nodes.push(osc, gain);
      }

      // Sparse, creepy arpeggio — one note per bar
      const arpNotes = [NOTE.A4, NOTE.E5, NOTE.C5, NOTE.F5, NOTE.Ab4 * 2, NOTE.E5, NOTE.A4, NOTE.C5];
      for (let bar = 0; bar < 8; bar++) {
        this._arp(t + bar * barLen + beat * 2, arpNotes[bar], beat * 2, 0.025, 'sine');
      }

      // Very soft hi-hats — every 2 beats
      for (let i = 0; i < 16; i++) {
        this._hihat(t + i * beat * 2, 0.015);
      }

      if (intense) {
        // Countdown mode: tension builds, add heartbeat-like kick
        for (let i = 0; i < 32; i++) {
          this._kick(t + i * beat, 0.15);
        }
        // Oriental arp runs faster
        const fastArp = [NOTE.A4, NOTE.B4, NOTE.C5, NOTE.E5, NOTE.F5, NOTE.Ab4 * 2];
        for (let bar = 4; bar < 8; bar++) {
          for (let i = 0; i < 6; i++) {
            this._arp(t + bar * barLen + i * beat / 3, fastArp[i], beat / 3 * 0.7, 0.04, 'square');
          }
        }
        // Snare buildup
        for (let i = 0; i < 16; i++) {
          this._snare(t + barLen * 6 + i * beat / 2, 0.05 + i * 0.004);
        }
      } else {
        // Heartbeat-like low thump every 4 beats
        for (let i = 0; i < 8; i++) {
          this._kick(t + i * barLen, 0.06);
        }
      }
    }, 0.45);
  }

  // ═════════════════════════════════════════════════════════════
  // LEVEL 2 — Beirut Radar, analytical electronic pulse, 110 BPM
  // Focused, technical feel — like scanning radar equipment
  // ═════════════════════════════════════════════════════════════

  playLevel2Music(drop = false) {
    const bpm = 110;
    const beat = 60 / bpm;
    const barLen = beat * 4;
    const loopLen = barLen * 8;

    this._startLoop('level2', loopLen, (startT) => {
      const t = startT;

      // Electronic pad — C minor, cold
      this._pad(t, NOTE.C3, loopLen, 0.04);
      this._pad(t, NOTE.Eb3, loopLen, 0.025);
      this._pad(t, NOTE.G3, loopLen, 0.02);

      // Steady pulse bass — like a radar ping rhythm
      const bassPattern = [NOTE.C3, 0, NOTE.C3, NOTE.Eb3, 0, NOTE.C3, NOTE.G3, 0];
      for (let bar = 0; bar < 8; bar++) {
        for (let b = 0; b < 4; b++) {
          const freq = bassPattern[b * 2 % bassPattern.length];
          if (freq > 0) {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.value = freq * 0.5;
            const st = t + bar * barLen + b * beat;
            gain.gain.setValueAtTime(0.08, st);
            gain.gain.exponentialRampToValueAtTime(0.02, st + beat * 0.8);
            osc.connect(gain); gain.connect(this.musicGain);
            osc.start(st); osc.stop(st + beat);
            this._nodes.push(osc, gain);
          }
        }
      }

      // Radar-like ping blips — high sine at regular intervals
      for (let bar = 0; bar < 8; bar++) {
        this._arp(t + bar * barLen, 2400, 0.06, 0.03, 'sine');
        this._arp(t + bar * barLen + beat * 2, 1800, 0.04, 0.02, 'sine');
      }

      // Soft hi-hats on beat
      for (let i = 0; i < 32; i++) {
        this._hihat(t + i * beat, 0.02);
      }

      // Light kick every 2 beats
      for (let i = 0; i < 16; i++) {
        this._kick(t + i * beat * 2, 0.08);
      }

      if (drop) {
        // INTERCEPT mode: energy builds — faster pulse, lead melody
        for (let i = 0; i < 32; i++) {
          this._kick(t + i * beat, 0.2);
          if (i % 4 === 2) this._clap(t + i * beat, 0.04);
        }
        for (let i = 0; i < 64; i++) {
          this._hihat(t + i * beat / 2, 0.03);
        }
        // Tense lead
        const leadNotes = [NOTE.C5, NOTE.Eb5, NOTE.G5, NOTE.C5, NOTE.Bb4, NOTE.G4, NOTE.Eb4, NOTE.C4];
        for (let bar = 0; bar < 8; bar += 2) {
          for (let i = 0; i < 8; i++) {
            this._lead(t + bar * barLen + i * beat / 2, leadNotes[i], beat / 2 * 0.8, 0.05);
          }
        }
      }
    }, 0.45);
  }

  // ═════════════════════════════════════════════════════════════
  // LEVEL 3 — Lebanon F-15, epic heroic trance, 142 BPM
  // ═════════════════════════════════════════════════════════════

  playLevel3Music(phase = 'flight') {
    const bpm = 142;
    const beat = 60 / bpm;
    const barLen = beat * 4;
    const loopLen = barLen * 8;

    this._startLoop('level3', loopLen, (startT) => {
      const t = startT;

      // D minor: D F A
      const intensity = phase === 'bombing' ? 1.0 : phase === 'flight' ? 0.7 : 0.4;

      // Kick pattern
      const kickVol = 0.15 + intensity * 0.2;
      for (let i = 0; i < 32; i++) {
        this._kick(t + i * beat, kickVol);
      }

      // Aggressive bassline
      const bassNotes = [NOTE.D3, NOTE.D3, NOTE.F3, NOTE.A3, NOTE.D3, NOTE.C3, NOTE.Bb2, NOTE.A2];
      for (let bar = 0; bar < 8; bar++) {
        this._acidBass(t + bar * barLen, bassNotes[bar], barLen * 0.9, 0.1 + intensity * 0.05);
      }

      // Hi-hats
      for (let i = 0; i < 64; i++) {
        this._hihat(t + i * beat / 2, 0.03);
        if (i % 8 === 4) this._openHat(t + i * beat / 2, 0.03);
      }

      // Ascending lead melody
      if (intensity > 0.5) {
        const leadMelody = [NOTE.D5, NOTE.F5, NOTE.A5, NOTE.D5 * 2, NOTE.A5, NOTE.F5, NOTE.D5, NOTE.C5];
        for (let bar = 0; bar < 8; bar += 2) {
          for (let i = 0; i < 8; i++) {
            this._lead(t + bar * barLen + i * beat / 2, leadMelody[i], beat / 2 * 0.7, 0.05 * intensity);
          }
        }
      }

      // Epic pad
      this._pad(t, NOTE.D3, loopLen, 0.04 * intensity);
      this._pad(t, NOTE.F3, loopLen, 0.03 * intensity);
      this._pad(t, NOTE.A3, loopLen, 0.025 * intensity);

      // Claps on 2 and 4
      if (intensity > 0.5) {
        for (let bar = 0; bar < 8; bar++) {
          this._clap(t + bar * barLen + beat, 0.05);
          this._clap(t + bar * barLen + 3 * beat, 0.05);
        }
      }

      // Snare buildup last 2 bars during bombing
      if (phase === 'bombing') {
        for (let i = 0; i < 16; i++) {
          this._snare(t + barLen * 6 + i * beat / 2, 0.06);
        }
      }
    }, 0.5);
  }

  // ═════════════════════════════════════════════════════════════
  // LEVEL 4 — Gaza Drone, dark claustrophobic trance, 140 BPM
  // ═════════════════════════════════════════════════════════════

  playLevel4Music(phase = 'recon') {
    const bpm = 140;
    const beat = 60 / bpm;
    const barLen = beat * 4;
    const loopLen = barLen * 8;

    this._startLoop('level4', loopLen, (startT) => {
      const t = startT;
      const isTunnel = phase === 'tunnel';
      const isCommand = phase === 'command';

      // E phrygian: E F G A B C D
      // Dark oscillating pad
      this._pad(t, NOTE.E3, loopLen, isTunnel ? 0.06 : 0.04);
      this._pad(t, NOTE.G3, loopLen, 0.03);
      if (isTunnel) this._pad(t, NOTE.B3, loopLen, 0.025);

      // Deep bass pulse
      const bassFreq = NOTE.E3;
      for (let bar = 0; bar < 8; bar++) {
        for (let b = 0; b < (isTunnel ? 8 : 4); b++) {
          const step = isTunnel ? beat / 2 : beat;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.value = bassFreq * (b % 2 === 0 ? 0.5 : 0.75);
          const st = t + bar * barLen + b * step;
          gain.gain.setValueAtTime(0.1, st);
          gain.gain.exponentialRampToValueAtTime(0.02, st + step * 0.8);
          osc.connect(gain); gain.connect(this.musicGain);
          osc.start(st); osc.stop(st + step);
          this._nodes.push(osc, gain);
        }
      }

      if (isTunnel) {
        // Industrial rhythmic sounds
        for (let i = 0; i < 16; i++) {
          if (i % 4 === 0) this._kick(t + i * beat * 2, 0.15);
          if (i % 4 === 2) {
            const buf = this._createNoiseBuffer(0.08);
            const src = this.ctx.createBufferSource();
            src.buffer = buf;
            const bp = this.ctx.createBiquadFilter();
            bp.type = 'bandpass'; bp.frequency.value = 500; bp.Q.value = 10;
            const gain = this.ctx.createGain();
            gain.gain.setValueAtTime(0.06, t + i * beat * 2);
            gain.gain.exponentialRampToValueAtTime(0.001, t + i * beat * 2 + 0.08);
            src.connect(bp); bp.connect(gain); gain.connect(this.musicGain);
            src.start(t + i * beat * 2); src.stop(t + i * beat * 2 + 0.08);
            this._nodes.push(src, bp, gain);
          }
        }
      }

      if (isCommand) {
        // Tension builds: kick + arp crescendo
        for (let i = 0; i < 32; i++) {
          this._kick(t + i * beat, 0.2);
        }
        const arpNotes = [NOTE.E5, NOTE.G5, NOTE.B4, NOTE.E5, NOTE.F5, NOTE.E5];
        for (let bar = 0; bar < 8; bar++) {
          for (let i = 0; i < 6; i++) {
            this._arp(t + bar * barLen + i * beat * 0.5, arpNotes[i], beat * 0.4, 0.04 + bar * 0.004);
          }
        }
        // Snare buildup
        for (let i = 0; i < 8; i++) {
          this._snare(t + barLen * 7 + i * beat / 2, 0.06);
        }
      }

      // Hi-hats
      for (let i = 0; i < 32; i++) {
        this._hihat(t + i * beat, 0.025);
      }
    }, 0.45);
  }

  // ═════════════════════════════════════════════════════════════
  // LEVEL 5 — Natanz B-2, atmospheric night trance, 138 BPM
  // ═════════════════════════════════════════════════════════════

  playLevel5Music(phase = 'stealth') {
    const bpm = 138;
    const beat = 60 / bpm;
    const barLen = beat * 4;
    const loopLen = barLen * 8;

    this._startLoop('level5', loopLen, (startT) => {
      const t = startT;
      const isAggressive = phase === 'defense' || phase === 'escape';
      const isBombing = phase === 'bombing';

      // Am: A C E — cold night feel
      this._pad(t, NOTE.A3, loopLen, 0.045);
      this._pad(t, NOTE.C4, loopLen, 0.03);
      this._pad(t, NOTE.E4, loopLen, 0.025);

      // Cold arpeggio
      const arpNotes = [NOTE.A4, NOTE.C5, NOTE.E5, NOTE.A5, NOTE.E5, NOTE.C5, NOTE.A4, NOTE.E4];
      for (let bar = 0; bar < 8; bar++) {
        for (let i = 0; i < 8; i++) {
          this._arp(t + bar * barLen + i * beat / 2, arpNotes[i], beat / 2 * 0.6, 0.03, 'sine');
        }
      }

      // Sub bass
      for (let bar = 0; bar < 8; bar++) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = NOTE.A2;
        gain.gain.setValueAtTime(0.08, t + bar * barLen);
        gain.gain.exponentialRampToValueAtTime(0.04, t + (bar + 1) * barLen);
        osc.connect(gain); gain.connect(this.musicGain);
        osc.start(t + bar * barLen); osc.stop(t + (bar + 1) * barLen);
        this._nodes.push(osc, gain);
      }

      if (isAggressive) {
        // Hard kicks and bass
        for (let i = 0; i < 32; i++) {
          this._kick(t + i * beat, 0.3);
          if (i % 2 === 1) this._hihat(t + i * beat, 0.05);
        }
        for (let i = 0; i < 64; i++) {
          this._hihat(t + i * beat / 2, 0.04);
        }
        // Aggressive acid bass
        const aggrBass = [NOTE.A2, NOTE.A2, NOTE.C3, NOTE.E3, NOTE.A2, NOTE.G3, NOTE.F3, NOTE.E3];
        for (let bar = 0; bar < 8; bar++) {
          this._acidBass(t + bar * barLen, aggrBass[bar], barLen * 0.85, 0.12);
        }
        // Claps
        for (let bar = 0; bar < 8; bar++) {
          this._clap(t + bar * barLen + beat, 0.05);
          this._clap(t + bar * barLen + 3 * beat, 0.05);
        }
      } else if (isBombing) {
        // Climax: everything
        for (let i = 0; i < 32; i++) {
          this._kick(t + i * beat, 0.35);
        }
        for (let i = 0; i < 64; i++) {
          this._hihat(t + i * beat / 2, 0.04);
        }
        // Lead
        const leadNotes = [NOTE.A5, NOTE.C5, NOTE.E5, NOTE.A5, NOTE.G5, NOTE.F5, NOTE.E5, NOTE.C5];
        for (let bar = 0; bar < 8; bar += 2) {
          for (let i = 0; i < 8; i++) {
            this._lead(t + bar * barLen + i * beat / 2, leadNotes[i], beat * 0.4, 0.06);
          }
        }
        // Snare builds
        for (let i = 0; i < 16; i++) {
          this._snare(t + barLen * 6 + i * beat / 2, 0.05 + i * 0.003);
        }
      } else {
        // Stealth: very quiet kicks
        for (let i = 0; i < 16; i++) {
          this._kick(t + i * beat * 2, 0.06);
        }
        for (let i = 0; i < 32; i++) {
          this._hihat(t + i * beat, 0.02);
        }
      }
    }, 0.45);
  }

  // ═════════════════════════════════════════════════════════════
  // LEVEL 6 — Boss Fight, FULL PSYTRANCE, 145 BPM
  // ═════════════════════════════════════════════════════════════

  playLevel6Music(bossPhase = 1) {
    const bpm = 145;
    const beat = 60 / bpm;
    const barLen = beat * 4;
    const loopLen = barLen * 8;

    this._startLoop('level6', loopLen, (startT) => {
      const t = startT;

      // D minor root — darkest key
      // Kick: HARD, every beat (sidechain feel via volume pumping)
      for (let i = 0; i < 32; i++) {
        this._kick(t + i * beat, 0.35);
      }

      // Acid distorted bassline
      const bassP1 = [NOTE.D3, NOTE.D3, NOTE.F3, NOTE.D3, NOTE.C3, NOTE.D3, NOTE.A2, NOTE.D3];
      const bassP2 = [NOTE.D3, NOTE.F3, NOTE.G3, NOTE.D3, NOTE.Bb2, NOTE.D3, NOTE.A2, NOTE.C3];
      const bassP3 = [NOTE.D3, NOTE.F3, NOTE.Ab3, NOTE.D3, NOTE.C3, NOTE.F3, NOTE.G3, NOTE.A3];
      const bassNotes = bossPhase === 3 ? bassP3 : bossPhase === 2 ? bassP2 : bassP1;

      for (let bar = 0; bar < 8; bar++) {
        this._acidBass(t + bar * barLen, bassNotes[bar], barLen * 0.85,
          0.12 + bossPhase * 0.03);
      }

      // Hi-hats: 16ths (faster in higher phases)
      const hatCount = 64;
      for (let i = 0; i < hatCount; i++) {
        this._hihat(t + i * beat / 2, 0.04);
        if (i % 8 === 4) this._openHat(t + i * beat / 2, 0.03);
      }

      // Claps on 2 and 4
      for (let bar = 0; bar < 8; bar++) {
        this._clap(t + bar * barLen + beat, 0.06);
        this._clap(t + bar * barLen + 3 * beat, 0.06);
      }

      // Dark pad
      this._pad(t, NOTE.D3, loopLen, 0.03);
      this._pad(t, NOTE.F3, loopLen, 0.02);

      if (bossPhase >= 2) {
        // Extra layers: lead screaming synth
        const leadNotes = [NOTE.D5, NOTE.F5, NOTE.A5, NOTE.D5 * 2, NOTE.A5, NOTE.G5, NOTE.F5, NOTE.D5];
        for (let bar = 0; bar < 8; bar += 2) {
          for (let i = 0; i < 8; i++) {
            this._lead(t + bar * barLen + i * beat / 2, leadNotes[i], beat / 2 * 0.7,
              0.05 + (bossPhase - 2) * 0.02);
          }
        }

        // Extra arp layer
        const arpNotes = [NOTE.A4, NOTE.D5, NOTE.F5, NOTE.A5, NOTE.F5, NOTE.D5];
        for (let bar = 1; bar < 8; bar += 2) {
          for (let i = 0; i < 6; i++) {
            this._arp(t + bar * barLen + i * beat * 0.4, arpNotes[i], beat * 0.35, 0.04);
          }
        }
      }

      if (bossPhase >= 3) {
        // FULL CLIMAX: everything at max
        // Additional snares
        for (let bar = 0; bar < 8; bar++) {
          this._snare(t + bar * barLen + beat * 1.5, 0.05);
          this._snare(t + bar * barLen + beat * 3.5, 0.05);
        }

        // Extra screaming lead
        const screamNotes = [NOTE.F5, NOTE.Ab4 * 2, NOTE.A5, NOTE.D5 * 2, NOTE.A5, NOTE.F5, NOTE.D5, NOTE.C5];
        for (let bar = 1; bar < 8; bar += 2) {
          for (let i = 0; i < 8; i++) {
            this._lead(t + bar * barLen + i * beat / 2, screamNotes[i], beat * 0.4, 0.04);
          }
        }

        // Fast arp runs
        const fastArp = this._buildScale(NOTE.D5, SCALES.minor, 2);
        for (let bar = 4; bar < 8; bar++) {
          for (let i = 0; i < 16; i++) {
            this._arp(t + bar * barLen + i * beat / 4, fastArp[i % fastArp.length],
              beat / 4 * 0.6, 0.03, 'square');
          }
        }
      }
    }, 0.55);
  }

  // Boss disintegration: distort and fade
  playDisintegrationMusic() {
    this._init();
    if (!this.ctx || !this.musicGain) return;
    this.stop(0.1);
    // Increment loopId so stop's cleanup won't kill our nodes
    this._loopId++;
    this.currentTrack = 'disintegration';

    // Schedule music after fade completes
    const myId = this._loopId;
    setTimeout(() => {
      if (this._loopId !== myId) return;
      this._cleanupNodes();
      this.musicGain.gain.cancelScheduledValues(this.ctx.currentTime);
      this.musicGain.gain.setValueAtTime(0.5, this.ctx.currentTime);
      this._generateDisintegrationMusic();
    }, 150);
  }

  _generateDisintegrationMusic() {
    const t = this.ctx.currentTime;
    // Distorted descending tone
    const osc = this.ctx.createOscillator();
    const dist = this.ctx.createWaveShaper
      ? this.ctx.createWaveShaper() : null;
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, t);
    osc.frequency.exponentialRampToValueAtTime(30, t + 4);

    if (dist) {
      const curve = new Float32Array(256);
      for (let i = 0; i < 256; i++) {
        const x = (i * 2) / 256 - 1;
        curve[i] = (Math.PI + 50) * x / (Math.PI + 50 * Math.abs(x));
      }
      dist.curve = curve;
      osc.connect(dist); dist.connect(gain);
    } else {
      osc.connect(gain);
    }

    gain.gain.setValueAtTime(0.15, t);
    gain.gain.linearRampToValueAtTime(0.2, t + 1);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 4);
    gain.connect(this.musicGain);
    osc.start(t); osc.stop(t + 4);
    this._nodes.push(osc, gain);
    if (dist) this._nodes.push(dist);

    // Noise wash with reverb feel
    const buf = this._createNoiseBuffer(4);
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const lp = this.ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(2000, t);
    lp.frequency.exponentialRampToValueAtTime(100, t + 4);
    const nGain = this.ctx.createGain();
    nGain.gain.setValueAtTime(0.05, t);
    nGain.gain.linearRampToValueAtTime(0.1, t + 1.5);
    nGain.gain.exponentialRampToValueAtTime(0.001, t + 4);
    src.connect(lp); lp.connect(nGain); nGain.connect(this.musicGain);
    src.start(t); src.stop(t + 4);
    this._nodes.push(src, lp, nGain);
  }

  // Victory music: pads in major key + ascending arpeggio
  playVictoryMusic() {
    this._init();
    if (!this.ctx || !this.musicGain) return;
    this.stop(0.1);
    // Increment loopId so stop's cleanup won't kill our nodes
    this._loopId++;
    this.currentTrack = 'victory';

    const myId = this._loopId;
    setTimeout(() => {
      if (this._loopId !== myId) return;
      this._cleanupNodes();
      this.musicGain.gain.cancelScheduledValues(this.ctx.currentTime);
      this.musicGain.gain.setValueAtTime(0.5, this.ctx.currentTime);
      this._generateVictoryMusic();
    }, 150);
  }

  _generateVictoryMusic() {
    // 2 second silence then music
    const t = this.ctx.currentTime + 2;

    // D major pad: D F# A
    this._pad(t, NOTE.D4, 8, 0.06);
    this._pad(t, NOTE.Gb4, 8, 0.04);
    this._pad(t, NOTE.A4, 8, 0.035);

    // Ascending arpeggio
    const victArp = [NOTE.D4, NOTE.Gb4, NOTE.A4, NOTE.D5, NOTE.Gb4 * 2, NOTE.A5, NOTE.D5 * 2];
    for (let i = 0; i < victArp.length; i++) {
      this._arp(t + 1 + i * 0.4, victArp[i], 0.6, 0.06, 'triangle');
    }

    // Sub
    const sub = this.ctx.createOscillator();
    const sGain = this.ctx.createGain();
    sub.type = 'sine'; sub.frequency.value = NOTE.D3;
    sGain.gain.setValueAtTime(0, t);
    sGain.gain.linearRampToValueAtTime(0.08, t + 1);
    sGain.gain.setValueAtTime(0.08, t + 6);
    sGain.gain.linearRampToValueAtTime(0, t + 8);
    sub.connect(sGain); sGain.connect(this.musicGain);
    sub.start(t); sub.stop(t + 8);
    this._nodes.push(sub, sGain);
  }
}
