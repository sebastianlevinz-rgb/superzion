# Technology Stack — SuperZion v1.1 Polish Pass

**Project:** SuperZion v1.1 — Sprite Redesign, Psytrance Intro, Game Polish
**Researched:** 2026-03-19
**Domain:** Procedural canvas sprites, Web Audio synthesis, Phaser 3 camera effects, game UX
**Overall Confidence:** HIGH

---

## Scope Constraint

**No new dependencies.** Everything below uses the existing stack: Phaser 3.80.1 + Vite + Canvas API + Web Audio API. The project is 100% procedural with zero external assets. This research covers specific techniques needed for the 8 polish tasks, not general stack exploration.

**Already validated (DO NOT re-implement):** MusicManager (fade/crossfade), SoundManager (oscillator SFX), SpriteGenerator (canvas procedural sprites), BaseCinematicScene, IntroMusic system.

---

## 1. Procedural Human Sprite Drawing via Canvas API

### The Problem

The existing `SpriteGenerator.js` already draws a detailed 128x128 Mossad agent with head, torso, arms, legs, gloves, boots, Star of David, stubble, and a 1px outline. The proportions are approximately 7 heads tall (head center at y=18, boots end at y~96 in a 128px canvas). The current sprite is well-crafted and uses:

- **Pixel functions:** `px()` for single pixels, `pxRect()` for rectangles, `shadedRect()` for multi-tone gradient fills
- **Arc-based features:** `ctx.ellipse()` for head oval, `ctx.arc()` / `ctx.beginPath()` + `ctx.fill()` for curved shapes
- **Outline pass:** `applyOutline()` reads pixel alpha via `getImageData()`, draws 1px dark border around the silhouette
- **Animation:** 12 frames (2 idle, 6 run, 2 jump, 1 fall, 2 shoot) parameterized by `bodyBob`, `legL`, `legR`, `armSwing`

### Techniques for Improvement

The sprite is already organic-looking (not cubes). If further improvements are needed, here are the specific canvas techniques that work at this scale:

#### A. Proportions Tuning (7-8 Head Model at 128px)

| Body Part | Current Pixel Range (Y) | Ideal at 7.5 Heads | Notes |
|-----------|------------------------|---------------------|-------|
| Head top | ~5 | ~5 | Correct |
| Head bottom (chin) | ~30 | ~30 | Correct (head = 25px, good for 128px canvas) |
| Torso top | ~30 | ~30 | Correct |
| Torso bottom (hip) | ~54 | ~56 | Could extend 2px for longer torso |
| Legs top | ~54 | ~56 | Matches hip |
| Feet bottom | ~96 | ~100 | Slightly longer legs add realism |

At 128x128, a 7-head model works well because each "head unit" is ~13px, giving enough resolution for facial features (eyes=2px, eyebrows=1px, mouth=1px, stubble scatter).

**Technique:** The current approach of direct pixel placement (`px()`, `pxRect()`) with gradient shading (`shadedRect()`) is correct for this scale. Do NOT switch to bezier curves or anti-aliased rendering -- pixel-sharp edges are intentional for the retro aesthetic. The `applyOutline()` silhouette border is the right finishing technique.

#### B. Walk Cycle Physics

The current 6-frame run cycle uses sine-wave parameterization:

```javascript
legL: Math.sin(p) * 8,      // leg offset
legR: Math.sin(p + PI) * 8, // opposite phase
bodyBob: Math.abs(Math.sin(p)) * -2,  // vertical bob
armSwing: Math.sin(p) * 0.12,         // arm rotation
```

This is correct for procedural walk animation. The key improvement opportunities:

| Parameter | Current | Better Value | Why |
|-----------|---------|-------------|-----|
| Arm swing range | 0.12 rad | 0.18-0.22 rad | More visible arm movement at small sprite scale |
| Leg stride | 8px | 10px | Legs need more travel to read as walking vs shuffling |
| Body bob | 2px | 3px | More pronounced vertical movement = more organic |
| Frame count | 6 | 6-8 | 6 is adequate; 8 only if smoothness is insufficient |

#### C. Cinematic Hero Sprite (Larger Scale)

The `CinematicTextures.js` already draws a 128x192 detailed hero with:
- Bezier curves for hair
- Multi-layer skin shading
- Angular jawline via path operations

This pattern extends to boss sprites. At cinematic scale (larger than 128x128), use `ctx.ellipse()` for heads, `ctx.quadraticCurveTo()` for hair sweep, and multi-layer fills for skin tones.

#### D. Boss Sprite Construction Pattern

The codebase already has working boss sprites in `BombermanTextures.js` (`drawBoss1FoamBeard`), `PlatformerTextures.js` (`drawBoss2TurboTurban`), and `DroneTextures.js` (`drawBoss4AngryEyebrows`). Each supports expression variants (normal/angry/dead).

For the intro showcase, bosses need to be drawn at parade scale (the `ParadeTextures.js` pattern). The `staticSprite()` helper generates single-frame sprites and registers them with `scene.textures.addCanvas()`.

**Technique for "super attack" animations in intro:** Use Phaser tweens on the sprite (scale pulse, position shake, flash tint) rather than drawing additional animation frames. This is cheaper and the existing code already does this pattern via `this.tweens.add()` in `GameIntroScene._bossFlashEntry()`.

### Canvas API Confidence: HIGH

These are not novel techniques. The codebase already implements all of them. The work is tuning parameters and ensuring consistency across scenes.

---

## 2. Psytrance 145+ BPM Synthesis via Web Audio API

### Current State

`IntroMusic.js` (698 lines) already implements a full psytrance intro with:
- **Kick:** Sine sweep 150Hz->40Hz + 1200Hz click transient (0.25s)
- **Hi-hat:** Noise buffer through highpass (9000Hz closed, 7000Hz open)
- **Acid bass:** Sawtooth + square sub, resonant lowpass with accent envelope (Q=12-18)
- **Dark pad:** 5 detuned sawtooth oscillators per chord note, lowpass filtered
- **Psy lead:** 7 detuned sawtooth oscillators ("supersaw") with square-wave LFO tremolo
- **Effects:** Impact boom, crash cymbal, reverse crash, filter sweep, acid squelch
- **SFX:** Jet flyby, missile whoosh, tank rumble, march steps, wind ambient

All 3 acts are pre-scheduled using `AudioContext.currentTime` offsets. BPM is 145 (beat = 0.4138s).

### Techniques for Enhancement

The existing system is solid. Here are specific refinements if the intro music needs more psytrance character:

#### A. Rolling Bassline (16th-Note Pattern)

**Current:** Bass plays on every beat (quarter notes). Psytrance basslines typically run 16th notes.

**Technique:** Schedule 16th-note events at `beat/4` intervals. Use a gate pattern array to create rhythmic interest:

```javascript
// Classic psytrance 16th-note bass pattern
// 1 = note on, 0 = rest, accent marks with higher filter cutoff
const pattern = [1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1, 0, 0, 1, 0, 1];
const sixteenth = beat / 4; // ~0.1034s at 145 BPM
```

**Why 16th notes matter:** At 145 BPM, quarter-note bass sounds like dubstep or techno -- not psytrance. The rolling 16th-note pattern with short note durations (50-70% of sixteenth length) and filter envelope per note is the defining characteristic of the genre.

#### B. Acid Line Filter Envelope

The existing `_acidBass()` method already implements this correctly:
- Sawtooth oscillator + square sub-oscillator at 0.5x frequency
- Resonant lowpass (Q=12-18) with cutoff sweep from `freq*8-12` down to `freq*1.2`
- Accent notes get higher cutoff peak and Q

**Enhancement:** Add slide/glide between notes for the classic 303 portamento effect:

```javascript
// Glide: use exponentialRampToValueAtTime between sequential notes
osc.frequency.setValueAtTime(prevFreq, t);
osc.frequency.exponentialRampToValueAtTime(nextFreq, t + glideTime);
// glideTime = 0.03-0.06s for psytrance acid character
```

#### C. Gated Pad Technique

**Current:** `_darkPad()` plays continuous detuned sawtooth chords through a lowpass filter with slow attack/release. This sounds like ambient trance.

**Psytrance gated pad technique:** Apply a rhythmic amplitude gate synchronized to the beat grid:

```javascript
// Create an LFO that gates the pad to 16th notes
const gateLFO = ctx.createOscillator();
gateLFO.type = 'square';
gateLFO.frequency.value = bpm / 60 * 4; // 16th note rate = 9.67 Hz at 145 BPM

const gateDepth = ctx.createGain();
gateDepth.gain.value = 0.5; // 0.5 = full gate, 0.3 = subtle pump

gateLFO.connect(gateDepth);
gateDepth.connect(padGainNode.gain);
```

**Why square wave LFO:** A square LFO creates hard on/off gating (the classic psytrance "chop" effect). A sine LFO creates a smoother pumping effect. The existing code already uses this pattern in `_psyLead()` with `lfo.type = 'square'` at 8Hz -- extend it to pads.

#### D. Screen Shake Audio Sync

The intro already synchronizes `_impactBoom()` calls with `this.cameras.main.shake()`. The technique is straightforward: schedule both the audio event and the visual event at the same `delayedCall` timestamp.

**Timing precision:** Web Audio schedules ahead via `ctx.currentTime`, while Phaser's `delayedCall` uses game clock. For tight sync, the approach in `GameIntroScene.js` (scheduling camera shake in the same `delayedCall` as the SFX) is correct because both are triggered by the same JavaScript callback.

### Web Audio API Confidence: HIGH

The existing `IntroMusic.js` already demonstrates mastery of all required synthesis techniques. Enhancements are parameter tuning, not new API surfaces.

---

## 3. Phaser 3 Camera Shake API

### API Signature (Phaser 3.80.1)

```javascript
camera.shake(duration, intensity, force, callback, context)
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `duration` | number | 100 | Duration in milliseconds |
| `intensity` | number or Phaser.Math.Vector2 | 0.05 | Shake magnitude. Use small floats (0.005-0.05). Can pass Vector2 for independent X/Y |
| `force` | boolean | false | If true, resets any existing shake and starts fresh |
| `callback` | function | undefined | Called when shake completes |
| `context` | object | undefined | Callback context |

### Existing Usage Patterns in Codebase

The project already uses camera shake extensively (40+ call sites across 8 scene files). Established intensity ranges:

| Context | Duration (ms) | Intensity | Example File |
|---------|---------------|-----------|-------------|
| Subtle beat pulse | 50-100 | 0.004-0.008 | GameIntroScene (beat shakes) |
| Explosion nearby | 150-300 | 0.01-0.02 | GameScene, BossScene |
| Massive impact | 400-600 | 0.03-0.05 | BomberScene, B2BomberScene |
| Cinematic nuke | 1500-2000 | 0.035-0.06 | ExplosionCinematicScene, B2BomberScene |

### Best Practices (From Existing Code)

1. **Scale intensity to event magnitude:** Small hits = 0.005-0.01, medium = 0.01-0.02, large = 0.02-0.05
2. **Cap duration for gameplay scenes:** Keep under 500ms during active gameplay to avoid nausea. Reserve 1000ms+ for cinematics only.
3. **Combine with flash for impact:** `camera.flash(100, 255, 200, 50)` paired with shake reads as "explosion"
4. **Use `force: false` (default):** Let concurrent shakes layer rather than resetting -- more chaotic during combat
5. **Randomize intensity slightly:** `0.005 + Math.random() * 0.005` prevents repetitive feel (already used in GameIntroScene)

### Confidence: HIGH

The API is trivial and already heavily used in the codebase. No new patterns needed.

---

## 4. Procedural Flag Animation

### Current Implementation

`ParadeTextures.js` already implements waving flags via the `wavingSheet()` function:

```javascript
function wavingSheet(scene, key, drawFn, w = 140, h = 90) {
  const N = 4;  // 4 animation frames
  // Draw base flag, then for each frame:
  // Apply column-by-column vertical displacement using sine wave
  for (let x = 0; x < w; x++) {
    const amp = (x / w) * 6;  // Amplitude increases left-to-right (pole on left)
    const yOff = Math.sin(x * 0.1 + ph) * amp + 7;
    sc.drawImage(base, x, 0, 1, h, f * w + x, yOff, 1, h);
  }
  // Register as spritesheet with Phaser
  // Create animation at 8fps
}
```

**How it works:** Each column of the flag image is vertically displaced by `sin(x * frequency + phase) * amplitude`, where amplitude scales with distance from the pole (left edge). This creates a physically plausible waving effect using canvas `drawImage` with 1px-wide source slices.

### Existing Flags

Already implemented in `ParadeTextures.js`:
- `createIranFlag(scene)` -- green/white/red tricolor with Kufic borders
- Lebanon, Palestine, Israel flags (referenced in generateAllParadeTextures)

The `VictoryScene.js` also has a `_drawFlag()` method for Israeli flags.

### Technique Assessment

The column-displacement sine wave approach is the correct technique for 2D canvas flag animation. Parameters:
- **4 frames** at 8fps = half-second wave cycle -- adequate for the visual effect
- **Amplitude scaling** from pole (left) to tip (right) is physically correct
- **Sine frequency** of 0.1 radians/pixel creates ~63px wavelength -- appropriate for 140px-wide flags

No changes needed to the technique. The work is ensuring flags are restored in the intro showcase scene where they were lost during a refactor.

### Confidence: HIGH

The implementation already exists and works correctly.

---

## 5. End-Screen UI Patterns

### Current Implementation

`EndScreen.js` (223 lines) already implements both victory and defeat screens:

**Victory screen:** Title ("MISSION COMPLETE"), stats list, star rating, two buttons (PLAY AGAIN + NEXT LEVEL)
**Defeat screen:** Title ("MISSION FAILED"), stats list, two buttons (RETRY + SKIP LEVEL)

Both use:
- Black overlay at 85% opacity, setScrollFactor(0) for camera independence
- Monospace font with text shadow for glow effect
- Button pulse animation via alpha oscillation tween
- 500ms input delay to prevent accidental skip
- `MusicManager.get().stop(0.3)` on transition
- Camera fadeOut before scene transition

### Technique Assessment

The existing pattern is well-structured. The key concerns for the polish pass:

| Concern | Current State | Action Needed |
|---------|--------------|---------------|
| Button labels | "PLAY AGAIN (R)" / "NEXT LEVEL (ENTER)" | Correct per spec |
| Defeat buttons | "RETRY (R)" / "SKIP LEVEL (S)" | Correct per spec |
| Font readability | 32px title, 18px buttons, 14px stats | Adequate |
| Integration | Exported functions, import into any scene | Drop-in ready |
| Key bindings | R, ENTER, S via `input.keyboard.addKey` | Correct |

**What may need integration work:** Each of the 6 game scenes needs to call `showVictoryScreen()` or `showDefeatScreen()` at the appropriate game-over moment, passing the correct `currentScene`, `nextScene`, and `skipScene` keys. This is wiring work, not UI technique work.

### Confidence: HIGH

The UI module exists and follows sound Phaser 3 patterns.

---

## 6. Controls Overlay Pattern

### Current Implementation

`ControlsOverlay.js` (107 lines) implements a two-phase overlay:

1. **Initial:** Large centered box (700x80px, black at 75% opacity, gold border) with 18px bold monospace text in gold
2. **Transition:** After 3 seconds, fades out the big overlay and fades in a persistent bottom bar (28px height, 13px white text)

Also provides `addInstrTextBackground()` for retrofitting backgrounds onto existing instruction text elements.

### Technique Assessment

| Requirement | Status | Notes |
|-------------|--------|-------|
| Black semi-transparent background | Done (0x000000, 0.75 alpha) | Correct |
| Bright yellow text | Done (gold #FFD700 with glow shadow) | Correct |
| Large readable text | Done (18px bold monospace) | Adequate |
| Persistent bar after initial display | Done (fades to bottom bar) | Good UX |
| Works across all 6 levels | Exported function, scene-agnostic | Drop-in ready |

**Integration:** Each level scene needs to call `showControlsOverlay(scene, controlsText)` in its `create()` method with the level-appropriate controls string.

### Confidence: HIGH

Module is complete and well-designed.

---

## Recommended Stack Summary

| Technology | Version | Purpose | New? |
|------------|---------|---------|------|
| Phaser 3 | 3.80.1 | Game framework, camera shake, tweens, scene management | Existing |
| Canvas 2D API | Living standard | Procedural sprite drawing (px, rect, ellipse, arc, paths) | Existing |
| Web Audio API | Living standard | Psytrance synthesis (oscillators, filters, gain envelopes, noise buffers) | Existing |
| Vite | 5.4.0 | Dev server and build tool | Existing |
| No external libs | N/A | Constraint: everything procedural | Constraint |

**No new packages, no new frameworks, no new concepts.** The entire polish pass is executing on techniques the codebase already demonstrates.

---

## What NOT to Do

| Anti-Pattern | Why | What Instead |
|-------------|-----|-------------|
| Adding Tone.js for audio | Wraps Web Audio you already use, adds 150KB | Extend IntroMusic.js / MusicManager directly |
| Loading sprite images from files | Breaks 100% procedural constraint | Canvas API drawing (already working) |
| Using CSS for UI overlays | Breaks Phaser's scene lifecycle and depth sorting | Phaser text + rectangle game objects (already working) |
| Pre-rendering all boss frames as spritesheets | Overkill for intro; bosses are mostly static | Static canvas sprites + Phaser tweens for movement |
| Complex IK/skeletal animation for sprites | Way too complex for 128px pixel art | Simple parameterized offsets (legL, armSwing, bodyBob) |
| Using AnalyserNode for audio-visual sync | Unnecessary; timing is pre-scheduled | Schedule visual events at same timestamps as audio events |
| Switching to WebGL renderer | Canvas renderer is correct for pixel-perfect procedural sprites | Stay on Canvas renderer |

---

## Integration Map (Existing Systems -> Polish Tasks)

| Polish Task | Primary System | Integration Point |
|-------------|---------------|-------------------|
| Player sprite redesign | `SpriteGenerator.js` | Already generates all frames; tune parameters across scenes |
| Intro psytrance + SFX | `IntroMusic.js` + `GameIntroScene.js` | Already wired; enhance synthesis, add missing SFX |
| Restore intro bosses | `ParadeTextures.js` + `GameIntroScene.js` | Boss parade sprites exist; re-wire into intro showcase |
| Restore flags | `ParadeTextures.js` + `GameIntroScene.js` | Flag generation exists; add sprites to intro scene |
| Final intro screen | `GameIntroScene.js` Act 3 | Extend existing Act 3 with Maguen David + title styling |
| Level 2 path fix | `BomberScene.js` level layout | Widen corridor constants |
| F-15 wings fix | Cinematic texture drawing code | Flip wing angle direction in canvas draw calls |
| End screens | `EndScreen.js` + all 6 game scenes | Import and call at game-over events |
| Controls overlay | `ControlsOverlay.js` + all 6 game scenes | Import and call in create() |

---

## Sources

- [Phaser 3.80.0 Camera Shake API](https://newdocs.phaser.io/docs/3.80.0/focus/Phaser.Cameras.Scene2D.Camera-shake) -- shake(duration, intensity, force, callback, context) signature
- [Phaser 3 Shake Effect Class](https://docs.phaser.io/api-documentation/class/cameras-scene2d-effects-shake) -- Vector2 intensity, onUpdate callback
- [Rex Rainbow Phaser 3 Notes -- Camera Effects](https://rexrainbow.github.io/phaser3-rex-notes/docs/site/camera-effects/) -- shake, flash, fade best practices
- [SLYNYRD Pixelblog 49 -- Realistic Human Anatomy](https://www.slynyrd.com/blog/2024/3/25/pixelblog-49-realistic-human-anatomy) -- pixel art proportions at various head models
- [SLYNYRD Pixelblog 17 -- Human Anatomy](https://www.slynyrd.com/blog/2019/5/21/pixelblog-17-human-anatomy) -- wireframe-to-final sprite workflow
- [MDN Canvas Pixel Manipulation](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Pixel_manipulation_with_canvas) -- getImageData/putImageData for outline technique
- [Psytrance Bassline Synthesis](https://dsokolovskiy.com/blog/all/psytrance-bassline-synthesis/) -- 16th note patterns, filter envelopes, note slides
- [Syntorial TB-303 Tutorial](https://www.syntorial.com/tutorials/roland-tb-303-bassline/) -- acid squelch filter Q, accent behavior
- [Roland TB-303 Acid Guide](https://www.ultimatepreset.com/roland-tb-303-acid-house-techno-guide/) -- sawtooth vs square, filter envelope characteristics
- [MDN Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API) -- OscillatorNode, BiquadFilterNode, GainNode reference
- [Building a Modular Synth with Web Audio API](https://medium.com/geekculture/building-a-modular-synth-with-web-audio-api-and-javascript-d38ccdeca9ea) -- LFO routing, ADSR envelopes
- [GameDev.net Pixel Art Sprite Proportions](https://www.gamedev.net/forums/topic/625955-pixel-art-sprite-proportions-and-size/) -- 128x128 proportion guidelines
