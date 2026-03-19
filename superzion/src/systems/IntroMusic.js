// ═══════════════════════════════════════════════════════════════
// IntroMusic — MELODIC CINEMATIC SCORE for game intro
// Web Audio API procedural music — real hummable melody
// Four acts: LAMENT → THREAT → RISING → CLIMAX
// Duration: 30+ seconds, plays continuously until menu transition
// ═══════════════════════════════════════════════════════════════

import MusicManager from './MusicManager.js';

// Note frequencies (Hz) — full chromatic set for melodic composition
const N = {
  // Octave 2
  A2: 110.00, Bb2: 116.54, B2: 123.47,
  // Octave 3
  C3: 130.81, D3: 146.83, Eb3: 155.56, E3: 164.81,
  F3: 174.61, Fs3: 185.00, G3: 196.00, Ab3: 207.65,
  A3: 220.00, Bb3: 233.08, B3: 246.94,
  // Octave 4
  C4: 261.63, Cs4: 277.18, D4: 293.66, Eb4: 311.13,
  E4: 329.63, F4: 349.23, Fs4: 369.99, G4: 392.00,
  Ab4: 415.30, A4: 440.00, Bb4: 466.16, B4: 493.88,
  // Octave 5
  C5: 523.25, Cs5: 554.37, D5: 587.33, Eb5: 622.25,
  E5: 659.25, F5: 698.46, Fs5: 739.99, G5: 783.99,
  Ab5: 830.61, A5: 880.00, Bb5: 932.33, B5: 987.77,
  // Octave 6
  C6: 1046.50, D6: 1174.66, E6: 1318.51, Fs6: 1479.98,
};

export default class IntroMusic {
  constructor() {
    this._nodes = [];
    this._gainNode = null;
    this._ctx = null;
    this._started = false;
  }

  /**
   * Start the melodic cinematic intro music.
   * Schedules all four acts ahead of time using Web Audio API timing.
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
    if (mm.musicGain) {
      mm.musicGain.gain.cancelScheduledValues(this._ctx.currentTime);
      mm.musicGain.gain.setValueAtTime(0.5, this._ctx.currentTime);
    }

    // Create a dedicated gain node for all intro music
    this._gainNode = this._ctx.createGain();
    this._gainNode.gain.value = 0.42;
    this._gainNode.connect(mm.musicGain);

    const t0 = this._ctx.currentTime + 0.05;

    // ═══ ACT 1: LAMENT (0s-8s) — Slow, emotional, A minor ═══
    this._scheduleAct1_Lament(t0);

    // ═══ ACT 2: THREAT (8s-16s) — Darkens, military, D minor ═══
    this._scheduleAct2_Threat(t0 + 8);

    // ═══ ACT 3: RISING (16s-24s) — Major key, heroic ascent ═══
    this._scheduleAct3_Rising(t0 + 16);

    // ═══ ACT 4: CLIMAX (24s-32s) — Epic drop, full power ═══
    this._scheduleAct4_Climax(t0 + 24);
  }

  /**
   * Stop all intro music immediately.
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
  // PRIVATE: Node tracking & output
  // ═══════════════════════════════════════════════════════════════

  _track(...nodes) {
    for (const n of nodes) this._nodes.push(n);
  }

  _out() {
    return this._gainNode;
  }

  // ═══════════════════════════════════════════════════════════════
  // SYNTH INSTRUMENTS
  // ═══════════════════════════════════════════════════════════════

  /**
   * Piano — triangle wave with percussive envelope (fast attack, medium decay).
   * Sounds like a soft, contemplative piano note.
   */
  _piano(t, freq, duration, volume = 0.12) {
    const ctx = this._ctx;
    const osc = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    // Main tone: triangle for soft piano-like timbre
    osc.type = 'triangle';
    osc.frequency.value = freq;

    // Harmonic overtone for brightness
    osc2.type = 'sine';
    osc2.frequency.value = freq * 2;
    const osc2Gain = ctx.createGain();
    osc2Gain.gain.value = volume * 0.15;

    // Lowpass to soften
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(freq * 6, t);
    filter.frequency.exponentialRampToValueAtTime(freq * 2, t + duration * 0.5);

    // Percussive piano envelope: fast attack, decay to sustain, release
    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(volume, t + 0.008);
    gain.gain.exponentialRampToValueAtTime(volume * 0.4, t + 0.12);
    gain.gain.exponentialRampToValueAtTime(volume * 0.15, t + duration * 0.6);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    osc.connect(filter);
    osc2.connect(osc2Gain);
    osc2Gain.connect(filter);
    filter.connect(gain);
    gain.connect(this._out());

    osc.start(t);
    osc.stop(t + duration + 0.05);
    osc2.start(t);
    osc2.stop(t + duration + 0.05);

    this._track(osc, osc2, osc2Gain, filter, gain);
  }

  /**
   * Strings — multiple detuned sawtooth waves through lowpass filter.
   * Slow attack/release for lush sustained chords.
   */
  _strings(t, freq, duration, volume = 0.06) {
    const ctx = this._ctx;
    const detunes = [0, 4, -4, 8, -8, 12, -12];
    const mixer = ctx.createGain();
    mixer.gain.value = 1;

    for (const det of detunes) {
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.value = freq;
      osc.detune.value = det;
      const voiceGain = ctx.createGain();
      voiceGain.gain.value = 1.0 / detunes.length;
      osc.connect(voiceGain);
      voiceGain.connect(mixer);
      osc.start(t);
      osc.stop(t + duration + 0.2);
      this._track(osc, voiceGain);
    }

    // Lowpass filter for warmth
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = Math.min(freq * 3, 4000);
    filter.Q.value = 0.7;

    // Slow attack/release envelope
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.001, t);
    env.gain.linearRampToValueAtTime(volume, t + Math.min(duration * 0.25, 1.0));
    env.gain.setValueAtTime(volume, t + duration * 0.7);
    env.gain.linearRampToValueAtTime(0.001, t + duration);

    mixer.connect(filter);
    filter.connect(env);
    env.connect(this._out());

    this._track(mixer, filter, env);
  }

  /**
   * Strings chord — play a full chord with the strings synth.
   */
  _stringsChord(t, freqs, duration, volume = 0.06) {
    for (const freq of freqs) {
      this._strings(t, freq, duration, volume / freqs.length);
    }
  }

  /**
   * Brass — square + sawtooth mix, bandpass filtered.
   * For ominous low brass or heroic fanfares.
   */
  _brass(t, freq, duration, volume = 0.10) {
    const ctx = this._ctx;

    // Square wave body
    const osc1 = ctx.createOscillator();
    osc1.type = 'square';
    osc1.frequency.value = freq;

    // Sawtooth for edge
    const osc2 = ctx.createOscillator();
    osc2.type = 'sawtooth';
    osc2.frequency.value = freq;
    const osc2Gain = ctx.createGain();
    osc2Gain.gain.value = 0.6;
    osc2.connect(osc2Gain);

    // Bandpass for brass timbre
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(freq * 4, t);
    filter.frequency.exponentialRampToValueAtTime(freq * 2, t + duration * 0.6);
    filter.Q.value = 1.5;

    // Brass envelope: moderate attack, sustain, release
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.001, t);
    env.gain.linearRampToValueAtTime(volume, t + 0.06);
    env.gain.setValueAtTime(volume * 0.85, t + duration * 0.5);
    env.gain.exponentialRampToValueAtTime(0.001, t + duration);

    osc1.connect(filter);
    osc2Gain.connect(filter);
    filter.connect(env);
    env.connect(this._out());

    osc1.start(t);
    osc1.stop(t + duration + 0.05);
    osc2.start(t);
    osc2.stop(t + duration + 0.05);

    this._track(osc1, osc2, osc2Gain, filter, env);
  }

  /**
   * Timpani — low sine wave with pitch drop envelope.
   */
  _timpani(t, volume = 0.20) {
    const ctx = this._ctx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(120, t);
    osc.frequency.exponentialRampToValueAtTime(55, t + 0.15);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.5);

    gain.gain.setValueAtTime(volume, t);
    gain.gain.exponentialRampToValueAtTime(volume * 0.3, t + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);

    osc.connect(gain);
    gain.connect(this._out());
    osc.start(t);
    osc.stop(t + 0.7);

    this._track(osc, gain);
  }

  /**
   * Military snare drum — noise burst through bandpass.
   */
  _snare(t, volume = 0.08) {
    const ctx = this._ctx;
    const bufLen = Math.floor(ctx.sampleRate * 0.15);
    const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufLen; i++) data[i] = Math.random() * 2 - 1;

    const src = ctx.createBufferSource();
    src.buffer = buf;

    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 3000;
    bp.Q.value = 1.0;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    // Body tone
    const body = ctx.createOscillator();
    body.type = 'triangle';
    body.frequency.value = 180;
    const bodyGain = ctx.createGain();
    bodyGain.gain.setValueAtTime(volume * 0.5, t);
    bodyGain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

    src.connect(bp);
    bp.connect(gain);
    gain.connect(this._out());
    body.connect(bodyGain);
    bodyGain.connect(this._out());

    src.start(t);
    src.stop(t + 0.15);
    body.start(t);
    body.stop(t + 0.1);

    this._track(src, bp, gain, body, bodyGain);
  }

  /**
   * Bass drum — sine sweep for deep impact.
   */
  _bassDrum(t, volume = 0.30) {
    const ctx = this._ctx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(100, t);
    osc.frequency.exponentialRampToValueAtTime(30, t + 0.15);

    gain.gain.setValueAtTime(volume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

    // Click transient
    const click = ctx.createOscillator();
    const clickGain = ctx.createGain();
    click.type = 'sine';
    click.frequency.setValueAtTime(800, t);
    click.frequency.exponentialRampToValueAtTime(100, t + 0.01);
    clickGain.gain.setValueAtTime(volume * 0.4, t);
    clickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.015);

    osc.connect(gain);
    gain.connect(this._out());
    click.connect(clickGain);
    clickGain.connect(this._out());

    osc.start(t);
    osc.stop(t + 0.35);
    click.start(t);
    click.stop(t + 0.02);

    this._track(osc, gain, click, clickGain);
  }

  /**
   * Crash cymbal — noise through highpass.
   */
  _crash(t, volume = 0.15) {
    const ctx = this._ctx;
    const bufLen = Math.floor(ctx.sampleRate * 1.8);
    const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufLen; i++) data[i] = Math.random() * 2 - 1;

    const src = ctx.createBufferSource();
    src.buffer = buf;

    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 5000;

    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 7000;
    bp.Q.value = 0.4;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume, t);
    gain.gain.exponentialRampToValueAtTime(volume * 0.5, t + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 1.5);

    src.connect(hp);
    hp.connect(bp);
    bp.connect(gain);
    gain.connect(this._out());
    src.start(t);
    src.stop(t + 1.8);

    this._track(src, hp, bp, gain);
  }

  /**
   * Sub bass — deep sine wave for foundation.
   */
  _subBass(t, freq, duration, volume = 0.10) {
    const ctx = this._ctx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.value = freq;

    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(volume, t + 0.1);
    gain.gain.setValueAtTime(volume, t + duration * 0.8);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    osc.connect(gain);
    gain.connect(this._out());
    osc.start(t);
    osc.stop(t + duration + 0.05);

    this._track(osc, gain);
  }

  /**
   * Echo delay effect — creates a simple echo by scheduling repeated notes.
   * Plays the piano note with decaying repeats.
   */
  _pianoWithEcho(t, freq, duration, volume = 0.12, echoes = 2, echoDelay = 0.3) {
    this._piano(t, freq, duration, volume);
    for (let i = 1; i <= echoes; i++) {
      const echoVol = volume * Math.pow(0.35, i);
      if (echoVol > 0.005) {
        this._piano(t + echoDelay * i, freq, duration * 0.7, echoVol);
      }
    }
  }

  /**
   * Horn fanfare — brighter brass for heroic moments.
   * Uses sawtooth with more harmonics.
   */
  _horn(t, freq, duration, volume = 0.08) {
    const ctx = this._ctx;

    const osc1 = ctx.createOscillator();
    osc1.type = 'sawtooth';
    osc1.frequency.value = freq;

    const osc2 = ctx.createOscillator();
    osc2.type = 'square';
    osc2.frequency.value = freq;
    osc2.detune.value = 5;

    const mixer = ctx.createGain();
    mixer.gain.value = 1;

    const g1 = ctx.createGain();
    g1.gain.value = 0.6;
    const g2 = ctx.createGain();
    g2.gain.value = 0.4;

    osc1.connect(g1);
    g1.connect(mixer);
    osc2.connect(g2);
    g2.connect(mixer);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(freq * 5, t);
    filter.frequency.exponentialRampToValueAtTime(freq * 2.5, t + duration * 0.5);
    filter.Q.value = 1.0;

    const env = ctx.createGain();
    env.gain.setValueAtTime(0.001, t);
    env.gain.linearRampToValueAtTime(volume, t + 0.04);
    env.gain.setValueAtTime(volume * 0.9, t + duration * 0.6);
    env.gain.exponentialRampToValueAtTime(0.001, t + duration);

    mixer.connect(filter);
    filter.connect(env);
    env.connect(this._out());

    osc1.start(t);
    osc1.stop(t + duration + 0.05);
    osc2.start(t);
    osc2.stop(t + duration + 0.05);

    this._track(osc1, osc2, g1, g2, mixer, filter, env);
  }

  /**
   * Tremolo strings — strings with volume tremolo for climactic moments.
   */
  _tremoloStrings(t, freq, duration, volume = 0.06) {
    const ctx = this._ctx;
    const detunes = [0, 5, -5, 10, -10];
    const mixer = ctx.createGain();
    mixer.gain.value = 1;

    for (const det of detunes) {
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.value = freq;
      osc.detune.value = det;
      const vg = ctx.createGain();
      vg.gain.value = 1.0 / detunes.length;
      osc.connect(vg);
      vg.connect(mixer);
      osc.start(t);
      osc.stop(t + duration + 0.2);
      this._track(osc, vg);
    }

    // Lowpass
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = Math.min(freq * 3.5, 5000);

    // Tremolo LFO
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 6;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.3;
    lfo.connect(lfoGain);

    const env = ctx.createGain();
    env.gain.setValueAtTime(0.001, t);
    env.gain.linearRampToValueAtTime(volume, t + 0.3);
    env.gain.setValueAtTime(volume, t + duration * 0.7);
    env.gain.linearRampToValueAtTime(0.001, t + duration);

    lfoGain.connect(env.gain);

    mixer.connect(filter);
    filter.connect(env);
    env.connect(this._out());

    lfo.start(t);
    lfo.stop(t + duration + 0.2);

    this._track(mixer, filter, lfo, lfoGain, env);
  }

  // ═══════════════════════════════════════════════════════════════
  // ACT 1: LAMENT — "For 3,000 years..."
  // Slow, emotional, A minor. Synthesized piano with reverb-like echoes.
  // Tempo: ~70 BPM. Key: Am → Dm → Em → Am
  // ═══════════════════════════════════════════════════════════════

  _scheduleAct1_Lament(t0) {
    const bpm = 70;
    const beat = 60 / bpm; // ~0.857s
    const half = beat * 2;
    const whole = beat * 4;

    // ─── MAIN MELODY: Piano in A minor ───
    // A haunting, singable melody: the lament of 3000 years
    // Phrase 1 (bars 1-2): A3 → C4 → E4 → D4 → C4 → A3
    this._pianoWithEcho(t0,              N.A3,  beat * 1.5, 0.14, 2, 0.4);
    this._pianoWithEcho(t0 + beat * 1.5, N.C4,  beat,       0.12, 2, 0.4);
    this._pianoWithEcho(t0 + beat * 2.5, N.E4,  beat * 1.5, 0.14, 2, 0.4);
    this._pianoWithEcho(t0 + beat * 4,   N.D4,  beat,       0.11, 2, 0.4);
    this._pianoWithEcho(t0 + beat * 5,   N.C4,  beat,       0.10, 1, 0.4);
    this._pianoWithEcho(t0 + beat * 6,   N.A3,  beat * 1.5, 0.12, 2, 0.5);

    // ─── Strings chord: Am (A3, C4, E4) — very soft, slow swell ───
    this._stringsChord(t0 + 0.2, [N.A3, N.C4, N.E4], 7.5, 0.10);

    // ─── Sub bass: A2 drone ───
    this._subBass(t0, N.A2, 4, 0.06);
    this._subBass(t0 + 4 * beat, N.A2, 4, 0.06);

    // ─── Second piano phrase (answer): Dm coloring ───
    // Phrase 2 (bars 3-4 overlap): D4 → F4 → E4 → D4 → C4 → B3 → A3
    const p2Start = t0 + beat * 4.5;  // slightly overlapping
    // This phrase weaves through Dm territory before resolving back
    // We skip the first two notes of phrase 2 since phrase 1 is still ringing
    // and start the answering phrase from bar 3
    // Actually, let's do a clear second phrase starting around 4s
    const m2 = t0 + 3.5; // about 4 beats in at 70bpm
    this._piano(m2,              N.E4,  beat * 0.8, 0.09);
    this._piano(m2 + beat * 1,   N.F4,  beat * 1.2, 0.10);
    this._piano(m2 + beat * 2.2, N.E4,  beat * 0.8, 0.09);
    this._piano(m2 + beat * 3,   N.D4,  beat * 1.0, 0.10);
    this._piano(m2 + beat * 4,   N.C4,  beat * 0.6, 0.08);
    this._piano(m2 + beat * 4.6, N.B3,  beat * 0.6, 0.07);
    this._piano(m2 + beat * 5.2, N.A3,  beat * 1.5, 0.11);

    // ─── Strings shift: Dm chord in second half ───
    this._stringsChord(t0 + 4, [N.D3, N.F3, N.A3], 3.8, 0.07);
  }

  // ═══════════════════════════════════════════════════════════════
  // ACT 2: THREAT — Enemies appear, boss silhouettes
  // Darkens. Military drums, low brass. Threatening. Dm/Gm.
  // Tempo: ~80 BPM
  // ═══════════════════════════════════════════════════════════════

  _scheduleAct2_Threat(t0) {
    const bpm = 80;
    const beat = 60 / bpm; // 0.75s
    const bar = beat * 4;  // 3s per bar

    // ─── MILITARY SNARE PATTERN ───
    // March-like: snare on beats 2 and 4, with occasional 16th note fills
    for (let b = 0; b < 2; b++) {
      const barStart = t0 + b * bar;
      this._snare(barStart + beat,     0.07);
      this._snare(barStart + beat * 3, 0.07);
    }
    // Second half: snare gets busier (tension building)
    for (let b = 2; b < 3; b++) {
      const barStart = t0 + b * bar;
      this._snare(barStart + beat * 0.5, 0.05);
      this._snare(barStart + beat,       0.08);
      this._snare(barStart + beat * 2,   0.05);
      this._snare(barStart + beat * 3,   0.08);
    }

    // ─── TIMPANI on downbeats ───
    this._timpani(t0,           0.18);
    this._timpani(t0 + bar,     0.20);
    this._timpani(t0 + bar * 2, 0.22);

    // ─── LOW BRASS: Ominous descending melody ───
    // D4 → C4 → Bb3 → A3 → G3 — darkness descending
    this._brass(t0,              N.D4,  beat * 1.8, 0.09);
    this._brass(t0 + beat * 2,   N.C4,  beat * 1.8, 0.09);
    this._brass(t0 + beat * 4,   N.Bb3, beat * 1.8, 0.10);
    this._brass(t0 + beat * 6,   N.A3,  beat * 1.8, 0.10);
    this._brass(t0 + beat * 8,   N.G3,  beat * 2.5, 0.11);

    // ─── DARK STRINGS: Dm → Gm ───
    this._stringsChord(t0, [N.D3, N.F3, N.A3], 4, 0.09);
    this._stringsChord(t0 + 4, [N.G3, N.Bb3, N.D4], 3.8, 0.10);

    // ─── Sub bass: D2 → G2 (ominous low foundation) ───
    this._subBass(t0, N.D3 * 0.5, 4, 0.08);
    this._subBass(t0 + 4, N.G3 * 0.5, 3.8, 0.09);

    // ─── Piano: sparse, dark accents ───
    // Punctuating hits that sound like distant thunder
    this._piano(t0 + beat * 1, N.D3, beat * 2, 0.07);
    this._piano(t0 + beat * 5, N.F3, beat * 2, 0.07);
    this._piano(t0 + beat * 9, N.G3, beat * 2, 0.08);

    // ─── Bass drum: slow military march feel ───
    this._bassDrum(t0,           0.15);
    this._bassDrum(t0 + bar,     0.17);
    this._bassDrum(t0 + bar * 2, 0.19);

    // ─── Tension riser: last 2 seconds ───
    // Snare roll building into Act 3
    const rollStart = t0 + 6;
    const rollNotes = 12;
    for (let i = 0; i < rollNotes; i++) {
      const rollT = rollStart + i * (2.0 / rollNotes);
      this._snare(rollT, 0.04 + i * 0.005);
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // ACT 3: RISING — Israel flag, arsenal, "We're still here"
  // Transition to MAJOR KEY. Tempo rises. Melody ASCENDS. Heroic.
  // Key: C major → G major. Tempo: ~100 BPM
  // ═══════════════════════════════════════════════════════════════

  _scheduleAct3_Rising(t0) {
    const bpm = 100;
    const beat = 60 / bpm; // 0.6s
    const bar = beat * 4;  // 2.4s

    // ─── ASCENDING HORN MELODY — heroic fanfare ───
    // C4 → E4 → G4 → A4 → G4 → E4 then ASCENDING to C5
    // This is the turning point — from darkness to hope
    this._horn(t0,              N.C4,  beat * 1.2, 0.08);
    this._horn(t0 + beat * 1.5, N.E4,  beat * 1.0, 0.09);
    this._horn(t0 + beat * 2.5, N.G4,  beat * 1.5, 0.10);
    this._horn(t0 + beat * 4,   N.A4,  beat * 1.5, 0.11);
    this._horn(t0 + beat * 5.5, N.G4,  beat * 1.0, 0.09);
    this._horn(t0 + beat * 6.5, N.E4,  beat * 1.0, 0.08);

    // Second phrase: ascending higher — hope building
    const p2 = t0 + beat * 8;
    this._horn(p2,              N.C4,  beat * 1.0, 0.09);
    this._horn(p2 + beat * 1,   N.E4,  beat * 0.8, 0.10);
    this._horn(p2 + beat * 2,   N.G4,  beat * 0.8, 0.10);
    this._horn(p2 + beat * 3,   N.C5,  beat * 2.0, 0.12);  // reaching up!

    // ─── STRINGS SWELL: C major → G major ───
    this._stringsChord(t0, [N.C4, N.E4, N.G4], 4, 0.12);
    this._stringsChord(t0 + 4, [N.G3, N.B3, N.D4], 3.5, 0.13);

    // ─── DRIVING RHYTHM: snare gives way to energetic pattern ───
    for (let i = 0; i < 12; i++) {
      this._bassDrum(t0 + i * beat, 0.12 + i * 0.005);
    }

    // Snare on 2 and 4 (driving feel)
    for (let b = 0; b < 3; b++) {
      const barStart = t0 + b * bar;
      this._snare(barStart + beat,     0.06);
      this._snare(barStart + beat * 3, 0.06);
    }

    // ─── Sub bass: C → G ───
    this._subBass(t0, N.C3 * 0.5, 4, 0.08);
    this._subBass(t0 + 4, N.G3 * 0.5, 3.5, 0.09);

    // ─── Piano arpeggiation: adding sparkle ───
    // Quick ascending arpeggios between horn phrases
    const arpNotes = [N.C5, N.E5, N.G5, N.C6];
    for (let i = 0; i < arpNotes.length; i++) {
      this._piano(t0 + beat * 3.5 + i * 0.15, arpNotes[i], 0.5, 0.06);
    }
    const arpNotes2 = [N.G4, N.B4, N.D5, N.G5];
    for (let i = 0; i < arpNotes2.length; i++) {
      this._piano(t0 + beat * 7.5 + i * 0.15, arpNotes2[i], 0.5, 0.07);
    }

    // ─── Build to climax: last 2 seconds ───
    // Ascending scale run on piano
    const runNotes = [N.C5, N.D5, N.E5, N.F5, N.G5, N.A5, N.B5, N.C6];
    const runStart = t0 + 6;
    for (let i = 0; i < runNotes.length; i++) {
      this._piano(runStart + i * 0.2, runNotes[i], 0.4, 0.06 + i * 0.006);
    }

    // Reverse cymbal feel: snare crescendo
    for (let i = 0; i < 8; i++) {
      this._snare(t0 + 6.5 + i * 0.18, 0.03 + i * 0.008);
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // ACT 4: CLIMAX — SuperZion reveal, title card
  // EPIC DROP. All instruments at full power. D major.
  // Tempo: ~110 BPM
  // ═══════════════════════════════════════════════════════════════

  _scheduleAct4_Climax(t0) {
    const bpm = 110;
    const beat = 60 / bpm; // ~0.545s
    const bar = beat * 4;

    // ═══ THE DROP: Everything hits at once ═══
    this._crash(t0, 0.18);
    this._bassDrum(t0, 0.35);
    this._timpani(t0, 0.25);

    // ─── TRIUMPHANT MELODY: D major fanfare ───
    // D5 → F#5 → A5 → D6 (the hero theme, ascending to the peak)
    this._horn(t0 + 0.05,        N.D5,  beat * 1.2, 0.13);
    this._horn(t0 + beat * 1.5,  N.Fs5, beat * 1.0, 0.14);
    this._horn(t0 + beat * 2.5,  N.A5,  beat * 1.5, 0.15);
    this._horn(t0 + beat * 4,    N.D6,  beat * 2.5, 0.16);  // peak note, held long

    // Piano doubles the melody for power
    this._piano(t0 + 0.05,       N.D5,  beat * 1.0, 0.10);
    this._piano(t0 + beat * 1.5, N.Fs5, beat * 0.8, 0.11);
    this._piano(t0 + beat * 2.5, N.A5,  beat * 1.2, 0.12);
    this._piano(t0 + beat * 4,   N.D6,  beat * 2.0, 0.13);

    // ─── MASSIVE STRINGS: D major chord, full orchestra feel ───
    this._stringsChord(t0, [N.D4, N.Fs4, N.A4], 4, 0.16);
    this._stringsChord(t0, [N.D5, N.Fs5, N.A5], 4, 0.10);  // upper octave doubling
    // Second chord: A major (dominant) then back to D
    this._stringsChord(t0 + 4, [N.D4, N.Fs4, N.A4], 3.5, 0.18);
    this._stringsChord(t0 + 4, [N.D5, N.Fs5, N.A5], 3.5, 0.12);

    // ─── TREMOLO STRINGS for sustained intensity ───
    this._tremoloStrings(t0 + 0.5, N.D4, 7, 0.07);
    this._tremoloStrings(t0 + 0.5, N.A4, 7, 0.05);

    // ─── DRIVING RHYTHM: Full power drums ───
    for (let i = 0; i < 14; i++) {
      this._bassDrum(t0 + i * beat, 0.20 + (i < 4 ? 0.08 : 0));
    }
    // Snare on 2 and 4
    for (let b = 0; b < 3; b++) {
      const barStart = t0 + b * bar;
      this._snare(barStart + beat,     0.09);
      this._snare(barStart + beat * 3, 0.09);
    }

    // ─── Timpani hits on downbeats ───
    this._timpani(t0 + bar, 0.20);
    this._timpani(t0 + bar * 2, 0.18);

    // ─── Sub bass: D2 pedal, full power ───
    this._subBass(t0, N.D3 * 0.5, 4, 0.12);
    this._subBass(t0 + 4, N.D3 * 0.5, 3.5, 0.12);

    // ─── Second melodic phrase: victory confirmation ───
    // After the peak D6, melody descends heroically then ends on sustained D5
    const m2 = t0 + beat * 6.5;
    this._horn(m2,              N.A5,  beat * 1.0, 0.12);
    this._horn(m2 + beat * 1,   N.Fs5, beat * 1.0, 0.11);
    this._horn(m2 + beat * 2,   N.A5,  beat * 1.0, 0.12);
    this._horn(m2 + beat * 3,   N.D5,  beat * 3.0, 0.13); // sustained resolution

    // ─── Crash at second phrase ───
    this._crash(t0 + 4, 0.12);

    // ─── Piano flourish at the very end: ascending arpeggio ───
    const flourish = [N.D5, N.Fs5, N.A5, N.D6, N.Fs6];
    const flStart = t0 + 5.5;
    for (let i = 0; i < flourish.length; i++) {
      this._piano(flStart + i * 0.12, flourish[i], 0.8, 0.07 + i * 0.008);
    }

    // ─── Final sustain: everything rings out ───
    // Let the D major chord ring with tremolo from the strings already scheduled
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
