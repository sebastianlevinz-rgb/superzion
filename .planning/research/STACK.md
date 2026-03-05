# Technology Stack — SuperZion Polish & Cinematic Upgrade

**Project:** SuperZion — Cinematic & Audio Polish Milestone
**Researched:** 2026-03-05
**Domain:** Phaser 3 game — procedural audio synthesis, animated cinematics, sprite animation

---

## Scope Constraint

Everything below operates within the existing stack: **Phaser 3.80.1 + Vite 5.4.0 + Web Audio API + Canvas API**.
No new npm packages are needed or recommended. All four areas (cinematics, music differentiation, SFX richness, sprite animation) are achievable with native browser APIs and Phaser's built-in systems.

---

## Recommended Stack

### 1. Cinematic Sequences — Animated Sprites in Phaser 3

| Technology | API | Purpose | Confidence |
|------------|-----|---------|------------|
| Phaser 3 Timeline | `this.add.timeline([])` | Orchestrate timed sprite/tween events in sequence | HIGH |
| Phaser 3 Tween chains | `this.tweens.chain({ tweens: [] })` | Sequential property animations (x, y, alpha, scale, angle) | HIGH |
| Phaser 3 Canvas Texture | `this.textures.createCanvas(key, w, h)` + `.refresh()` | Generate multi-frame sprite sheets procedurally | HIGH |
| Phaser 3 Sprite Anim Manager | `this.anims.create()` + `generateFrameNumbers()` | Play frame-based animations on sprites from canvas texture | HIGH |
| Phaser 3 Graphics | `this.add.graphics()` | Draw vector shapes for environment elements in cinematics | HIGH |

**How they compose for cinematics:**

The `Timeline` API (added in Phaser 3.60, present in 3.80.1) is the correct orchestration primitive. It sequences events at absolute timestamps using the `at` property — far cleaner than nested `onComplete` callbacks. Each event can: spawn a sprite, fire a tween, play a sound, or call an arbitrary function.

```javascript
// Inside BaseCinematicScene or subclass
const tl = this.add.timeline([
  {
    at: 0,
    run: () => {
      this.bossSprite = this.add.sprite(1100, 300, 'boss_frames').setAlpha(0);
    }
  },
  {
    at: 200,
    tween: {
      targets: this.bossSprite,
      x: 700,
      alpha: 1,
      duration: 800,
      ease: 'Power2'
    }
  },
  {
    at: 1200,
    tween: {
      targets: this.bossSprite,
      angle: { from: -5, to: 5 },
      yoyo: true,
      repeat: 3,
      duration: 150
    }
  },
  {
    at: 2500,
    run: () => this._showSubtitle('Mission: Infiltrate the compound'),
  }
]);
tl.play();
```

**Why Timeline over tween chains:** Timeline uses absolute time (`at` property) so adding a beat in the middle doesn't require re-calculating all subsequent delays. Tween chains (`tweens.chain`) are relative and cascade — good for looping motion, fragile for cinematic scripting.

**Procedural multi-frame sprites for cinematics:**

The existing pattern of `this.textures.createCanvas(key, w, h)` extends naturally to spritesheets by making the canvas wide (8 frames × 128px = 1024px wide, 128px tall), drawing each frame at the correct x-offset, then calling `addSpriteSheet()` or using the texture directly with `generateFrameNumbers()`.

```javascript
// Generate 8-frame walk cycle on a canvas
const canvas = document.createElement('canvas');
canvas.width = 128 * 8;
canvas.height = 128;
const ctx = canvas.getContext('2d');

for (let f = 0; f < 8; f++) {
  ctx.save();
  ctx.translate(f * 128 + 64, 64);
  drawCharacterFrame(ctx, f);  // your existing canvas drawing code
  ctx.restore();
}

// Add as spritesheet to Phaser texture manager
this.textures.addSpriteSheet('player_walk', canvas, {
  frameWidth: 128,
  frameHeight: 128
});

// Create animation
this.anims.create({
  key: 'player_walk',
  frames: this.anims.generateFrameNumbers('player_walk', { start: 0, end: 7 }),
  frameRate: 12,
  repeat: -1
});
```

**Why this over anything else:** The project is 100% procedural with no external assets. This is the exact same canvas API the project already uses — zero new concepts, zero new dependencies, consistent with the existing generator pattern.

---

### 2. Unique Trance Theme Per Level — Web Audio API Patterns

| Technique | API | Purpose | Confidence |
|-----------|-----|---------|------------|
| Per-level seed config | Plain JS objects | Drive BPM, scale, pad timbre, melody contour per level | HIGH |
| PeriodicWave (wavetable) | `ctx.createPeriodicWave(real, imag)` | Unique timbres per level beyond built-in sine/square/sawtooth | HIGH |
| Layered LFOs | `OscillatorNode` → `GainNode.gain` AudioParam | Pad movement, filter sweep automation | HIGH |
| BiquadFilterNode | `ctx.createBiquadFilter()` | Lowpass sweep for filter cutoff modulation (trance staple) | HIGH |
| ScheduleAheadTime pattern | `AudioContext.currentTime` + lookahead buffer | Rock-solid BPM-locked sequencing without drift | HIGH |

**Level differentiation strategy:**

Each level gets a config object that parameterizes the existing `MusicManager`. The music itself stays procedural — only the seed values change. This avoids rewriting MusicManager, just extending it to consume per-level parameters.

```javascript
// LevelMusicConfig.js — new data file
export const LEVEL_MUSIC_CONFIG = {
  1: {
    bpm: 138,
    scale: [0, 2, 3, 5, 7, 8, 10],  // natural minor
    padWaveform: 'sine',
    padAttack: 1.2,
    filterCutoffStart: 400,
    filterCutoffPeak: 3200,
    basslinePattern: [1, 0, 0, 1, 0, 1, 0, 0],  // 16th-note hits
    melodyRoot: 'A3',
    atmosphere: 'dark',
  },
  2: {
    bpm: 144,
    scale: [0, 2, 4, 5, 7, 9, 11],  // major
    padWaveform: 'triangle',
    padAttack: 0.4,
    filterCutoffStart: 800,
    filterCutoffPeak: 6000,
    basslinePattern: [1, 0, 1, 0, 0, 1, 0, 1],
    melodyRoot: 'D4',
    atmosphere: 'urgent',
  },
  // ... levels 3-6
};
```

**Trance component checklist per level (what MusicManager needs to emit):**

1. **Kick drum** — `OscillatorNode` (sine, 150Hz → 40Hz frequency ramp in 80ms) + sharp gain envelope. Locked to BPM grid.
2. **Bassline** — Sawtooth oscillator, 16th-note pattern from config, lowpass-filtered at ~300Hz.
3. **Pads** — Two detuned sawtooth oscillators (±8 cents), heavy reverb via `ConvolverNode` or simulated with feedback delay chain. Chord held per bar.
4. **Arpeggio** — Fast 16th-note sequence stepping through scale, filter sweep synchronized to phrase length.
5. **Lead melody** — Square or custom `PeriodicWave` oscillator, plays 4-bar phrase derived from scale config, portamento via `frequency.exponentialRampToValueAtTime`.
6. **Atmosphere layer** — Pink noise buffer through bandpass filter, very low gain, gives texture to "dark" levels.

**BPM-locked scheduling — the correct pattern:**

```javascript
// The scheduler pattern (avoids drift that setInterval causes)
scheduleTracks() {
  const lookahead = 0.1;  // seconds
  const scheduleAheadTime = 0.2;

  while (this.nextNoteTime < this.ctx.currentTime + scheduleAheadTime) {
    this._scheduleNote(this.currentStep, this.nextNoteTime);
    this._advanceNote();  // nextNoteTime += (60 / bpm) / 4  for 16th notes
  }

  this._timerID = setTimeout(() => this.scheduleTracks(), lookahead * 1000);
}
```

**Why not setInterval for BPM:** `setInterval` drifts under load. The lookahead scheduler using `AudioContext.currentTime` is the MDN-recommended pattern and the industry standard for browser sequencers. It schedules notes slightly ahead of playback, so JavaScript jank does not cause missed beats.

**Custom timbres via PeriodicWave:**

```javascript
// Supersaw approximation — 7 detuned oscillators baked into wavetable coefficients
// Or use multiple oscillator nodes detuned ±cents for runtime implementation
const real = new Float32Array(256);
const imag = new Float32Array(256);
// Populate harmonics to taste (bright lead: strong 1st, 2nd, 3rd; dark pad: roll off fast)
const wave = ctx.createPeriodicWave(real, imag);
oscillator.setPeriodicWave(wave);
```

---

### 3. Richer Procedural Sound Effects — Synthesis Beyond Basic Oscillators

| Technique | API | Replaces | Use For | Confidence |
|-----------|-----|---------|---------|------------|
| White noise buffer | `AudioBuffer` with `Math.random()` fill | Sine beep | Explosions, gunfire, static | HIGH |
| Pink noise | White noise + `BiquadFilter` lowpass chain | N/A | Ambient rumble, wind | HIGH |
| FM synthesis | Carrier `OscillatorNode` → frequency AudioParam of another | Plain oscillator | Metallic hits, alarm, engine | HIGH |
| ADSR envelope | `GainNode.gain` + `linearRampToValueAtTime` / `exponentialRampToValueAtTime` | Abrupt on/off | All SFX (gives shape) | HIGH |
| Convolver reverb | `ConvolverNode` with generated impulse response | Dry sound | Explosion tail, large spaces | MEDIUM |
| Distortion | `WaveShaperNode` with curve | N/A | Electric buzz, harsh alarms | HIGH |
| Pitch glide | `frequency.exponentialRampToValueAtTime` | Fixed pitch | Jump, laser fire, alert | HIGH |

**Concrete SFX recipes:**

**Explosion:**
```javascript
explode(ctx, masterGain) {
  // 1. Noise burst (the "bang")
  const bufferSize = ctx.sampleRate * 0.5;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

  const source = ctx.createBufferSource();
  source.buffer = buffer;

  // 2. Shape it — lowpass for body, envelope for timing
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(800, ctx.currentTime);
  filter.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.4);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(1.2, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);

  // 3. Sub thump (oscillator kick)
  const thump = ctx.createOscillator();
  thump.frequency.setValueAtTime(120, ctx.currentTime);
  thump.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.15);
  const thumpGain = ctx.createGain();
  thumpGain.gain.setValueAtTime(1.0, ctx.currentTime);
  thumpGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

  source.connect(filter).connect(gain).connect(masterGain);
  thump.connect(thumpGain).connect(masterGain);
  source.start();
  thump.start();
  thump.stop(ctx.currentTime + 0.3);
  source.stop(ctx.currentTime + 0.8);
}
```

**Alert/Alarm:**
```javascript
alarm(ctx, masterGain) {
  // FM synthesis: carrier modulated by another oscillator
  const carrier = ctx.createOscillator();
  carrier.type = 'sawtooth';
  carrier.frequency.value = 440;

  const modulator = ctx.createOscillator();
  modulator.frequency.value = 880;  // 2:1 ratio → metallic

  const modGain = ctx.createGain();
  modGain.gain.value = 220;  // modulation depth in Hz

  modulator.connect(modGain).connect(carrier.frequency);

  // Rapid pitch alternation (alarm feel)
  carrier.frequency.setValueAtTime(880, ctx.currentTime);
  carrier.frequency.setValueAtTime(660, ctx.currentTime + 0.2);
  carrier.frequency.setValueAtTime(880, ctx.currentTime + 0.4);

  const distortion = ctx.createWaveShaper();
  distortion.curve = makeDistortionCurve(200);  // harsh

  carrier.connect(distortion).connect(masterGain);
  carrier.start();
  modulator.start();
}
```

**Footstep (harder surface):**
```javascript
footstep(ctx, masterGain, surface = 'concrete') {
  const bufferSize = ctx.sampleRate * 0.08;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

  const source = ctx.createBufferSource();
  source.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = surface === 'concrete' ? 'bandpass' : 'lowpass';
  filter.frequency.value = surface === 'concrete' ? 2000 : 600;
  filter.Q.value = 1.5;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.4, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);

  source.connect(filter).connect(gain).connect(masterGain);
  source.start();
  source.stop(ctx.currentTime + 0.1);
}
```

**Why noise buffers over single oscillators for percussive/transient SFX:** Real-world impacts, explosions, and gunshots contain broadband noise components. A single sine oscillator cannot reproduce this — it sounds toy-like. `AudioBuffer` filled with `Math.random()` + shaped by filter + shaped by gain envelope is the canonical Web Audio approach for this class of sounds.

**Why ConvolverNode for reverb is MEDIUM confidence:** Generating a realistic impulse response procedurally (without loading an external IR file) requires more code and the result can sound artificial. A simpler alternative is a feedback delay network: two `DelayNode`s with cross-feedback into each other, which gives credible room reverb for game audio without IR files. Implement delay-based reverb first; add ConvolverNode only if the result is unsatisfactory.

---

### 4. Smoother Sprite Animations — More Frames, Better Movement

| Technique | Purpose | Confidence |
|-----------|---------|------------|
| 8-frame walk cycle (was 2-4) | Eliminates mechanical sliding appearance | HIGH |
| Sub-frame easing via Phaser tweens on position | Supplements frame animation with smooth lerp | HIGH |
| Squash-and-stretch on jump/land | Secondary animation principle, adds weight | HIGH |
| Anticipation frame before action | One "pre-action" frame before jumps/attacks | MEDIUM |
| Canvas offscreen pre-render per frame | Draw each frame into a named region of a wide canvas | HIGH |

**Walk cycle frame breakdown (8 frames at 12fps = smooth motion):**

```
Frame 0: Contact (right foot down, body neutral)
Frame 1: Down (body at lowest, weight transfer)
Frame 2: Passing (left foot passes right, body rising)
Frame 3: High (body at highest, left foot forward)
Frame 4: Contact (left foot down, mirror of frame 0)
Frame 5: Down (mirror of frame 1)
Frame 6: Passing (right foot passes left)
Frame 7: High (right foot forward, completing cycle)
```

For a procedural pixel art character at 128×128 with limb segments drawn via canvas arcs/rects, the key variables per frame are: `torsoY` (vertical bob), `leftLegAngle`, `rightLegAngle`, `leftArmAngle`, `rightArmAngle`, `headTilt`. Parameterize these as sine functions of frame index.

**Squash-and-stretch via Phaser tween (no canvas changes needed):**

```javascript
// On jump start — stretch vertically
this.tweens.add({
  targets: this.playerSprite,
  scaleY: 1.3,
  scaleX: 0.8,
  duration: 80,
  ease: 'Power1',
  yoyo: true
});

// On land — squash
this.tweens.add({
  targets: this.playerSprite,
  scaleY: 0.7,
  scaleX: 1.3,
  duration: 60,
  ease: 'Power2',
  yoyo: true
});
```

**Why this is zero-cost in terms of canvas work:** Scale tweens are GPU operations on the sprite transform — no canvas redraw. They operate on top of the frame animation. This gives the feel of more frames without actually drawing more frames.

**Cinematic sprite movement (for intro showcase):**

Flying sprites (planes, drones, bosses moving across screen) need path-based motion, not just x/y tweens. Phaser's tween system supports `motionPath` in 3.60+ but this requires curves. Simpler alternative: multi-step tween chain with easing per segment simulating a curve.

```javascript
// Plane flies in, banks, and flies out — 3-segment motion
this.tweens.chain({
  tweens: [
    // Enter from right, moving fast
    { targets: plane, x: 700, y: 200, duration: 600, ease: 'Sine.easeOut' },
    // Bank — slow, rotate
    { targets: plane, x: 400, y: 280, angle: -15, duration: 900, ease: 'Sine.easeInOut' },
    // Exit left, accelerating
    { targets: plane, x: -100, y: 180, angle: 0, duration: 500, ease: 'Sine.easeIn' }
  ]
});
```

---

## What NOT to Do

| Anti-Pattern | Why | What Instead |
|-------------|-----|-------------|
| External sprite sheets / image imports | Breaks the 100% procedural constraint, adds asset pipeline | Canvas-drawn frames baked into Phaser texture cache |
| Tone.js or Howler.js | Adds dependency, wraps the Web Audio API you already use directly | Extend MusicManager/SoundManager directly |
| `setInterval` for BPM sequencing | Drifts under CPU load, causes missed beats | `AudioContext.currentTime` lookahead scheduler |
| ConvolverNode with fetched IR files | External audio asset, violates procedural constraint | Feedback delay network for reverb |
| Nested `onComplete` callbacks for cinematics | Brittle, hard to edit timing | Phaser 3 Timeline with `at:` timestamps |
| Tweens.Timeline (old API) | Deprecated in Phaser 3.60+ in favor of `this.add.timeline` | Use `this.add.timeline([])` — the Time.Timeline class |
| Animating every property per frame in `update()` | Bypasses Phaser's tween system, burns CPU | Phaser tweens handle interpolation natively at 60fps |
| Pink noise via multiple filter passes in a chain on every SFX | CPU-expensive for frequent sounds | Pre-generate noise buffer once, reuse across SFX |

---

## Integration Points with Existing Codebase

| Existing System | What Changes | How |
|----------------|-------------|-----|
| `BaseCinematicScene` | Add Timeline-based sequencing API | `this.add.timeline([])` called in `create()`, exposed as `this.timeline` |
| `MusicManager` | Accept per-level config object | New method `setLevelTheme(levelConfig)` reads BPM, scale, waveform params |
| `SoundManager` | Add noise-based SFX methods | New methods: `playExplosion()`, `playAlarm()`, `playImpact()` using `AudioBuffer` noise |
| `*Generator.js` files | Multi-frame canvas output | Modify to accept `frameCount` param, draw each frame at `frameIndex * spriteWidth` offset |
| `src/data/LevelConfig.js` | Add music config per level | New `music` property on each level config object |

---

## Versions Confirmed

| Technology | Version | Status |
|------------|---------|--------|
| Phaser | 3.80.1 | Timeline API available (added 3.60) — HIGH confidence |
| Web Audio API | Living standard | All nodes used (OscillatorNode, BiquadFilterNode, GainNode, AudioBuffer, ConvolverNode, WaveShaperNode) available in all modern browsers — HIGH confidence |
| Canvas API | Living standard | Multi-frame canvas to spritesheet pattern is standard — HIGH confidence |

---

## Sources

- [Phaser 3 Animations Documentation](https://docs.phaser.io/phaser/concepts/animations) — frame-based animation, anims.create(), generateFrameNumbers()
- [Phaser 3 Timeline API](https://docs.phaser.io/api-documentation/class/time-timeline) — Time.Timeline class, at-based event sequencing
- [Phaser 3 Timeline Tween Action Example](https://phaser.io/examples-show/1708) — cinematic sequence via timeline
- [Phaser 3 CanvasTexture](https://docs.phaser.io/api-documentation/class/textures-canvastexture) — createCanvas, refresh() for WebGL
- [Phaser 3 Create Animation From Canvas Texture Example](https://phaser.io/examples/v3.85.0/animation/view/create-animation-from-canvas-texture) — procedural animation
- [MDN Web Audio API Advanced Techniques](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Advanced_techniques) — lookahead BPM scheduler, sequencing
- [MDN Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API) — OscillatorNode, BiquadFilterNode, GainNode, AudioBuffer
- [How to Create Procedural Audio Effects with Web Audio API](https://dev.to/hexshift/how-to-create-procedural-audio-effects-in-javascript-with-web-audio-api-199e) — noise buffer explosion patterns
- [How to Generate Noise with the Web Audio API](https://noisehack.com/generate-noise-web-audio-api/) — white/pink noise buffer implementation
- [Rex Rainbow Phaser 3 Notes — Tween](https://rexrainbow.github.io/phaser3-rex-notes/docs/site/tween/) — tween chain API reference
- [Rex Rainbow Phaser 3 Notes — Timeline](https://rexrainbow.github.io/phaser3-rex-notes/docs/site/timeline/) — timeline event structure
- [Trance Music Production — Landr](https://blog.landr.com/trance-music-production/) — trance component anatomy (pads, bassline, arpeggio, lead)
- [Trance Song Structure — HTMEM](https://howtomakeelectronicmusic.com/trance-song-structure-and-how-does-uplifting-trance-song-progress/) — BPM ranges, section structure
- [Building a Modular Synth With Web Audio API](https://medium.com/geekculture/building-a-modular-synth-with-web-audio-api-and-javascript-d38ccdeca9ea) — FM synthesis, ADSR, LFO patterns
- [Building a Sequencer using Web Audio API](https://www.ivanprignano.com/posts/building-a-sequencer-web-audio/) — step sequencer implementation reference
- [Timed Rhythms with Web Audio API](https://middleearmedia.com/timed-rhythms-with-web-audio-api-and-javascript/) — BPM timing implementation
