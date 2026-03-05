# Phase 1: Audio Foundation - Research

**Researched:** 2026-03-05
**Domain:** Web Audio API -- fade/crossfade, node lifecycle, scene-transition audio management
**Confidence:** HIGH

## Summary

Phase 1 repairs the existing `MusicManager` singleton to eliminate abrupt music cuts on scene transitions, prevent zombie `AudioBufferSourceNode`/`OscillatorNode` leaks, and add an equal-power `crossfadeTo()` method. The existing code already has solid bones: a `_loopId` guard, universal `_nodes` tracking, and a working `_cleanupNodes()`. The problems are (a) `stop()` uses `linearRampToValueAtTime` which causes a perceived volume dip on sustained trance pads, (b) several `scene.start()` callsites transition without calling `stop()` first, and (c) there is no `crossfadeTo()` for overlapping two themes.

The Web Audio API provides everything needed natively -- no external libraries required. Equal-power crossfade uses `Math.cos(x * 0.5 * Math.PI)` / `Math.cos((1-x) * 0.5 * Math.PI)` gain curves on two parallel GainNodes. Node cleanup is straightforward: call `stop()` then `disconnect()` on each tracked node, then clear the array. The `ended` event on `AudioScheduledSourceNode` fires after `stop()` completes, enabling callback-based cleanup if desired, though the existing setTimeout approach is adequate.

**Primary recommendation:** Fix the `stop()` curve, add `crossfadeTo()` with a second GainNode chain, add `shutdown()` for scene-destroy cleanup, and audit all ~20 `scene.start()` callsites to ensure music is handled before each transition.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Replace `linearRampToValueAtTime` with equal-power crossfade curve in `stop()` -- linear ramp creates perceived volume dip at midpoint on sustained trance pads
- Add `crossfadeTo(trackName, generator, duration)` method that overlaps outgoing/incoming themes using two GainNodes with equal-power curves
- Default fade duration: 1.5 seconds (trance tracks need longer crossfade than typical game music)
- Keep existing `stop(fadeTime)` signature but fix the ramp curve internally
- ALL `scene.start()` callsites must call `MusicManager.get().stop()` before transitioning -- no exceptions
- Best approach: hook into `BaseCinematicScene` shutdown and create a utility method for gameplay scenes
- Scene-to-scene transitions where music CONTINUES (e.g., menu to cinematic) should use `crossfadeTo()` instead of stop+start
- Scenes that share the same track (if any) should not fade at all -- detect via `currentTrack` name
- Existing `_cleanupNodes()` is solid for inter-loop cleanup but must also be called on scene shutdown
- Add `shutdown()` or `onSceneDestroy()` hook that forces cleanup of all active nodes
- Ensure `_nodes` array is fully drained on any stop -- no orphaned oscillators/buffers
- Validate: after stop(), `_nodes.length === 0` and no AudioContext destination connections remain
- Keep single AudioContext for game lifetime (browsers limit to ~6)
- AudioContext resume must happen on user gesture -- ensure `_init()` is called from a click/key handler, not from scene preload
- Existing pattern (`if (this.ctx.state === 'suspended') this.ctx.resume()`) is correct -- keep it

### Claude's Discretion
- Exact equal-power crossfade curve implementation (Math.cos/Math.sin or custom)
- Whether to extract `crossfadeTo()` as a separate GainNode pair or reuse `musicGain`
- How to structure the scene transition hooks (mixin, base class method, or standalone utility)
- Whether to add `masterGain` volume persistence across transitions

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| AUDIO-01 | Music fades out cleanly (over configurable duration) before any scene transition instead of cutting abruptly | Equal-power curve fix in `stop()`, `crossfadeTo()` for overlapping transitions, scene-transition audit of all ~20 `scene.start()` callsites, `shutdown()` hook for forced cleanup |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Web Audio API | Native (all modern browsers) | All audio synthesis, gain control, crossfade | Project mandate: 100% procedural, no external audio files or libraries |
| Phaser | ^3.80.1 | Game framework, scene lifecycle, `scene.start()` | Already in use; provides scene events for shutdown hooks |

### Supporting
No additional libraries needed. The project explicitly excludes Tone.js and all external audio dependencies (see REQUIREMENTS.md Out of Scope).

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Raw Web Audio API | Tone.js | Explicitly out of scope per REQUIREMENTS.md |
| Manual crossfade math | Web Audio `setValueCurveAtTime` | `setValueCurveAtTime` could pre-compute the curve array, but manual `setValueAtTime` scheduling per-frame is unnecessary since we use a gain ramp over a fixed duration -- the cos/sin formula applied to ramp parameters is simpler and more maintainable |

## Architecture Patterns

### Current MusicManager Architecture (Preserve)
```
AudioContext
  +-- masterGain (mute control) --> destination
        +-- musicGain (track volume) --> masterGain
              +-- [all synth nodes connect here]
```

### Recommended Crossfade Architecture (Add)
```
AudioContext
  +-- masterGain --> destination
        +-- musicGainA (outgoing track) --> masterGain    [equal-power fade OUT]
        +-- musicGainB (incoming track) --> masterGain    [equal-power fade IN]
```

**Recommendation:** Use two dedicated GainNodes (`_gainA` / `_gainB`) that alternate roles. The "current" gain is tracked by a pointer (`_activeGain`). On `crossfadeTo()`, the incoming track connects to the inactive gain, both curves are scheduled, and after the crossfade completes the old gain's nodes are cleaned up and the pointer swaps. The existing `musicGain` becomes `_gainA` initially.

### Pattern 1: Equal-Power Crossfade Curve
**What:** Non-linear gain curve that avoids perceived volume dip at the midpoint
**When to use:** Any fade-out or crossfade between two audio sources
**Example:**
```javascript
// Source: Boris Smus "Web Audio API" ch03 + MDN Web Audio best practices
// For a crossfade from 0.0 (start) to 1.0 (end):
// percent ranges from 0 to 1 over the fade duration
const gainOut = Math.cos(percent * 0.5 * Math.PI);  // 1.0 -> 0.0
const gainIn  = Math.cos((1.0 - percent) * 0.5 * Math.PI);  // 0.0 -> 1.0
```

**For a simple fade-out (no incoming track), use `setValueCurveAtTime` with a pre-computed array:**
```javascript
// Pre-compute equal-power fade-out curve (only needs to be done once)
_buildEqualPowerFadeOut(steps = 64) {
  const curve = new Float32Array(steps);
  for (let i = 0; i < steps; i++) {
    curve[i] = Math.cos((i / (steps - 1)) * 0.5 * Math.PI);
  }
  return curve;
}

// Usage in stop():
const currentVol = this.musicGain.gain.value;
const curve = this._fadeOutCurve.map(v => v * currentVol);
this.musicGain.gain.setValueCurveAtTime(curve, t, fadeTime);
```

**Alternative (simpler, recommended):** Use `linearRampToValueAtTime` but apply the equal-power curve by scheduling multiple setValueAtTime waypoints:
```javascript
// Schedule N waypoints along equal-power curve
_scheduleEqualPowerFade(gainNode, startVal, endVal, startTime, duration, steps = 16) {
  gainNode.gain.cancelScheduledValues(startTime);
  gainNode.gain.setValueAtTime(startVal, startTime);
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const curveVal = startVal + (endVal - startVal) * Math.sin(t * 0.5 * Math.PI);
    // For fade-out: startVal=current, endVal=0
    // cos curve: startVal * Math.cos(t * 0.5 * Math.PI)
    gainNode.gain.setValueAtTime(
      startVal * Math.cos(t * 0.5 * Math.PI),
      startTime + t * duration
    );
  }
}
```

**Simplest approach (recommended):** Use `setValueCurveAtTime` which natively accepts a Float32Array curve:
```javascript
// In constructor or lazy-init:
this._fadeOutCurve = new Float32Array(64);
for (let i = 0; i < 64; i++) {
  this._fadeOutCurve[i] = Math.cos((i / 63) * 0.5 * Math.PI);
}

// In stop(fadeTime):
const t = this.ctx.currentTime;
const vol = this.musicGain.gain.value;
const scaled = this._fadeOutCurve.map(v => v * vol);
this.musicGain.gain.cancelScheduledValues(t);
this.musicGain.gain.setValueCurveAtTime(scaled, t, fadeTime);
```

### Pattern 2: crossfadeTo() Implementation
**What:** Overlap outgoing and incoming themes with equal-power curves
**When to use:** Scene transitions where the new scene starts its own music
**Example:**
```javascript
crossfadeTo(trackName, generator, duration = 1.5) {
  this._init();
  if (!this.ctx) return;

  // If same track, skip entirely
  if (this.currentTrack === trackName) return;

  const t = this.ctx.currentTime;

  // 1. Identify outgoing/incoming gains
  const outGain = this._activeGain;    // currently playing
  const inGain = this._inactiveGain;   // silent, ready for new track

  // 2. Schedule equal-power curves on both
  //    outGain: current volume -> 0 (cos curve)
  //    inGain:  0 -> target volume (sin curve)
  const outVol = outGain.gain.value;
  const inVol = 0.5; // or configurable

  // Build fade-out curve for outgoing
  const steps = 64;
  const outCurve = new Float32Array(steps);
  const inCurve = new Float32Array(steps);
  for (let i = 0; i < steps; i++) {
    const pct = i / (steps - 1);
    outCurve[i] = outVol * Math.cos(pct * 0.5 * Math.PI);
    inCurve[i] = inVol * Math.sin(pct * 0.5 * Math.PI);
  }

  outGain.gain.cancelScheduledValues(t);
  outGain.gain.setValueCurveAtTime(outCurve, t, duration);
  inGain.gain.cancelScheduledValues(t);
  inGain.gain.setValueCurveAtTime(inCurve, t, duration);

  // 3. Start new track on inGain
  //    (generator connects its nodes to inGain instead of musicGain)
  this._loopId++;
  const myId = this._loopId;
  this.currentTrack = trackName;
  // ... start generator loop connecting to inGain ...

  // 4. Schedule cleanup of outgoing nodes after fade completes
  setTimeout(() => {
    if (this._loopId !== myId) return;
    this._cleanupNodesOn(outGain); // cleanup only nodes on old gain
    outGain.gain.value = 0;
    // Swap pointers
    this._activeGain = inGain;
    this._inactiveGain = outGain;
  }, (duration + 0.2) * 1000);
}
```

### Pattern 3: Scene Transition Hook
**What:** Ensure music is always handled on scene transitions
**When to use:** Every `scene.start()` call in the codebase
**Recommended approach:** Utility function + BaseCinematicScene override
```javascript
// In MusicManager:
shutdown() {
  this.stop(0); // immediate stop
  this._cleanupNodes(); // force-clean anything remaining
}

// Utility for gameplay scenes:
function safeSceneTransition(scene, targetScene, fadeTime = 1.5, data) {
  MusicManager.get().stop(fadeTime);
  scene.cameras.main.fadeOut(fadeTime * 1000, 0, 0, 0);
  scene.time.delayedCall(fadeTime * 1000, () => scene.scene.start(targetScene, data));
}

// In BaseCinematicScene -- override _autoAdvance and _handleSkip:
// Add MusicManager.get().stop() before scene.start() calls
```

### Anti-Patterns to Avoid
- **Calling scene.start() without stopping music first:** Every callsite must handle music, no exceptions. The current codebase has at least 8 callsites that transition without stopping music.
- **Creating a new AudioContext per scene:** Browsers limit to ~6 concurrent AudioContexts. Always reuse the single instance.
- **Using linearRamp for perceived-loudness fades:** Linear gain curves sound uneven because human perception of loudness is logarithmic. Use equal-power (cosine) curves.
- **Relying on garbage collection for node cleanup:** While the spec says nodes can be "fire and forget," in a game loop that creates hundreds of nodes per minute, explicit cleanup prevents memory pressure. Always stop() + disconnect() + clear references.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Equal-power curve math | Custom interpolation functions | `Math.cos(pct * 0.5 * Math.PI)` standard formula | This is the established formula from the Web Audio API book by Boris Smus; any deviation will sound wrong |
| Gain curve scheduling | Frame-by-frame gain updates in requestAnimationFrame | `setValueCurveAtTime(Float32Array, startTime, duration)` | Native AudioParam scheduling is sample-accurate and doesn't depend on frame rate |
| Audio timing | setTimeout-based timing for note scheduling | `AudioParam` methods with `ctx.currentTime` | Web Audio clock is independent of the main thread; setTimeout jitters under load |

**Key insight:** The Web Audio API's `AudioParam` scheduling methods (`setValueAtTime`, `setValueCurveAtTime`, `linearRampToValueAtTime`, `exponentialRampToValueAtTime`) handle timing at the audio-thread level. Never attempt to replicate this with JavaScript timers for gain changes. The existing code correctly uses `setTimeout` only for loop scheduling (macro-level), not for sample-accurate gain ramps.

## Common Pitfalls

### Pitfall 1: setValueCurveAtTime Overlap
**What goes wrong:** `setValueCurveAtTime` throws if its time range overlaps with another scheduled automation event on the same `AudioParam`.
**Why it happens:** Calling `stop()` during an active crossfade, or calling `crossfadeTo()` while a previous crossfade is still in progress.
**How to avoid:** Always call `cancelScheduledValues(currentTime)` before scheduling any new automation. The existing code already does this in `stop()` -- preserve that pattern.
**Warning signs:** `DOMException: Failed to execute 'setValueCurveAtTime'` in console.

### Pitfall 2: Volume Doubling on scene.restart()
**What goes wrong:** `scene.restart()` calls `create()` again, which calls `playLevelXMusic()`, which calls `_startLoop()`, which calls `stop(0.3)` then starts new music -- but the old nodes from the previous loop iteration are still producing sound during the 0.3s fade.
**Why it happens:** `_startLoop` has a 350ms delay before starting the new music, and `stop()` schedules cleanup after fadeTime+200ms. During this window, old nodes still output audio. If `scene.restart()` is called rapidly, nodes can accumulate.
**How to avoid:** The current `_loopId` guard handles this correctly for sequential calls. But `scene.restart()` re-invokes `create()` which calls `_startLoop` again. This is safe because `_startLoop` calls `stop()` first, which increments `_loopId`. Just ensure cleanup always happens.
**Warning signs:** Volume is noticeably louder after restart; checking `_nodes.length` shows unexpected growth.

### Pitfall 3: AudioContext State After Tab Sleep
**What goes wrong:** When a browser tab is backgrounded, the AudioContext may be suspended. On return, scheduled audio params have accumulated and play back chaotically.
**Why it happens:** Chrome/Firefox suspend AudioContexts for background tabs. `setTimeout` callbacks still fire but `ctx.currentTime` stops advancing.
**How to avoid:** The existing `_init()` resume pattern handles this. Additionally, `_startLoop` should check `ctx.state` at each loop iteration and re-resume if needed.
**Warning signs:** Music glitches after returning to a backgrounded tab.

### Pitfall 4: Cleanup Race Condition in stop()
**What goes wrong:** `stop()` sets `this.currentTrack = null` immediately but schedules cleanup after the fade. If a new track starts during the fade, the new track's `_startLoop` calls `stop(0.3)` again, which increments `_loopId`, potentially orphaning the first cleanup timeout.
**Why it happens:** The existing `cleanupId` guard in `stop()` correctly prevents stale cleanup from firing if a new track has started. But the nodes from the previous track that are still fading out won't be cleaned up until the second `stop()`'s cleanup fires.
**How to avoid:** This is actually handled correctly by `_startLoop` which calls `_cleanupNodes()` at the start of each loop iteration. However, during the 350ms delay before the first iteration, old nodes are still alive. Consider calling `_cleanupNodes()` immediately in `_startLoop` before the delay, or at least within the `stop()` handler alongside incrementing `_loopId`.
**Warning signs:** `_nodes.length` grows larger than expected between loop iterations.

### Pitfall 5: setValueCurveAtTime Requires Float32Array in Some Browsers
**What goes wrong:** Passing a regular Array to `setValueCurveAtTime` may fail in older browsers.
**Why it happens:** The spec requires Float32Array.
**How to avoid:** Always use `new Float32Array(...)` for curve data.
**Warning signs:** TypeError in Safari or older Edge.

## Code Examples

### Example 1: Fixed stop() with Equal-Power Fade
```javascript
// Source: Verified against MDN AudioParam.setValueCurveAtTime + Boris Smus Web Audio API book
stop(fadeTime = 1.5) {
  this._loopId++;
  if (!this.ctx || !this.musicGain) return;
  if (this.loopTimer) {
    clearTimeout(this.loopTimer);
    this.loopTimer = null;
  }

  const t = this.ctx.currentTime;
  const currentVol = this.musicGain.gain.value;

  if (fadeTime <= 0 || currentVol <= 0.001) {
    // Immediate stop
    this.musicGain.gain.cancelScheduledValues(t);
    this.musicGain.gain.setValueAtTime(0, t);
    this._cleanupNodes();
    this.musicGain.gain.value = 0.5;
    this.currentTrack = null;
    return;
  }

  // Equal-power fade-out curve
  const steps = 64;
  const curve = new Float32Array(steps);
  for (let i = 0; i < steps; i++) {
    curve[i] = currentVol * Math.cos((i / (steps - 1)) * 0.5 * Math.PI);
  }
  this.musicGain.gain.cancelScheduledValues(t);
  this.musicGain.gain.setValueCurveAtTime(curve, t, fadeTime);

  // Schedule cleanup
  const cleanupId = this._loopId;
  setTimeout(() => {
    if (this._loopId !== cleanupId) return;
    this._cleanupNodes();
    if (this.ctx && this.musicGain) {
      this.musicGain.gain.cancelScheduledValues(this.ctx.currentTime);
      this.musicGain.gain.value = 0.5;
    }
  }, (fadeTime + 0.2) * 1000);
  this.currentTrack = null;
}
```

### Example 2: shutdown() for Scene Destroy
```javascript
// Source: Project requirement -- force cleanup on scene transitions
shutdown() {
  this._loopId++;
  if (this.loopTimer) {
    clearTimeout(this.loopTimer);
    this.loopTimer = null;
  }
  if (this.ctx && this.musicGain) {
    this.musicGain.gain.cancelScheduledValues(this.ctx.currentTime);
    this.musicGain.gain.value = 0;
  }
  this._cleanupNodes();
  this.currentTrack = null;
}
```

### Example 3: crossfadeTo() Skeleton
```javascript
// Source: Derived from Boris Smus equal-power crossfade + project architecture
crossfadeTo(trackName, startFn, duration = 1.5) {
  this._init();
  if (!this.ctx) return;
  if (this.currentTrack === trackName) return; // same track, no-op

  const t = this.ctx.currentTime;

  // Create a temporary gain for the incoming track
  const inGain = this.ctx.createGain();
  inGain.gain.value = 0;
  inGain.connect(this.masterGain);

  const outGain = this.musicGain;
  const outVol = outGain.gain.value;
  const inVol = 0.5; // target volume for incoming

  // Equal-power curves
  const steps = 64;
  const outCurve = new Float32Array(steps);
  const inCurve = new Float32Array(steps);
  for (let i = 0; i < steps; i++) {
    const pct = i / (steps - 1);
    outCurve[i] = outVol * Math.cos(pct * 0.5 * Math.PI);
    inCurve[i] = inVol * Math.sin(pct * 0.5 * Math.PI);
  }

  outGain.gain.cancelScheduledValues(t);
  outGain.gain.setValueCurveAtTime(outCurve, t, duration);
  inGain.gain.setValueCurveAtTime(inCurve, t, duration);

  // Stop current loop
  this._loopId++;
  if (this.loopTimer) { clearTimeout(this.loopTimer); this.loopTimer = null; }

  // Capture old nodes for cleanup
  const oldNodes = [...this._nodes];
  this._nodes = [];

  // Start new track -- startFn generates music connecting to inGain
  const myId = this._loopId;
  this.currentTrack = trackName;

  // Execute the start function (which would need to accept a gain target)
  // Implementation detail: either pass inGain to generator, or temporarily
  // swap this.musicGain to inGain
  const origGain = this.musicGain;
  this.musicGain = inGain;
  startFn(); // this calls _startLoop which connects to this.musicGain
  this.musicGain = origGain; // restore (but we'll swap after crossfade)

  // After crossfade completes: cleanup old, swap gains
  setTimeout(() => {
    if (this._loopId !== myId) return;
    for (const n of oldNodes) {
      try { if (typeof n.stop === 'function') n.stop(); } catch(e) {}
      try { if (typeof n.disconnect === 'function') n.disconnect(); } catch(e) {}
    }
    outGain.gain.cancelScheduledValues(this.ctx.currentTime);
    outGain.gain.value = 0;
    // Swap: incoming gain becomes the active musicGain
    this.musicGain = inGain;
    // Disconnect old gain (but don't destroy -- reuse for next crossfade)
  }, (duration + 0.2) * 1000);
}
```

**Note on implementation flexibility:** The exact crossfadeTo() internal structure is at Claude's discretion per CONTEXT.md. The skeleton above shows one approach (temporarily swapping `musicGain`). An alternative is to give `_startLoop` an optional gain target parameter.

## Scene Transition Audit

### Callsites WITH Music Stop (Already Handled)
| File | Line | Call | Music Handling |
|------|------|------|----------------|
| MenuScene.js | 232-234 | `stop(0.3)` then `scene.start(targetScene)` | OK |
| GameIntroScene.js | 391-392 | `stop(0.3)` then `scene.start('MenuScene')` | OK |
| GameIntroScene.js | 421-423 | `stop(0.3)` then `scene.start('MenuScene')` | OK |
| ExplosionCinematicScene.js | 25 | `stop(0.5)` on create | OK |
| CreditsScene.js | 151-153 | `stop(0.5)` then `scene.start('MenuScene')` | OK |
| BeirutRadarScene.js | 551 | `stop(1)` in `_showResults()` | OK |
| BomberScene.js | 985 | `stop(1)` in `_showVictory()` | OK |
| DroneScene.js | 949 | `stop(1)` in `_showVictory()` | OK |
| B2BomberScene.js | 1334 | `stop(1)` in `_showVictory()` | OK |
| BossScene.js | 1226 | `stop(1)` in `_playerDeath()` | OK |

### Callsites WITHOUT Music Stop (NEED FIX)
| File | Line | Call | Issue |
|------|------|------|-------|
| BaseCinematicScene.js | 79 | `scene.start(targetScene)` in `_handleSkip` | No music stop before transition |
| BaseCinematicScene.js | 106 | `scene.start(targetScene)` in `_autoAdvance` | No music stop before transition |
| BootScene.js | 41 | `scene.start('GameIntroScene')` | Boot -> intro, likely no music playing yet, but should be safe |
| GameScene.js | 445 | `scene.start('ExplosionCinematicScene')` via skip | No music stop (level music continues into cinematic) |
| GameScene.js | 484 | `scene.start('MenuScene')` from pause quit | No music stop |
| GameScene.js | 491 | `scene.start('MenuScene')` from game over | No music stop |
| GameScene.js | 479 | `scene.restart()` from pause restart | No music stop (relies on _startLoop's internal stop) |
| GameScene.js | 490 | `scene.restart()` from game over R key | No music stop |
| BomberScene.js | 1106 | `scene.start('UndergroundIntroCinematicScene')` from victory | Music already stopped at line 985, but there is a time gap |
| DroneScene.js | 1068 | `scene.start('MountainBreakerIntroCinematicScene')` from victory | Music already stopped at line 949, OK |
| B2BomberScene.js | 1439 | `scene.start(...)` from victory | Music already stopped at line 1334, OK |
| BossScene.js | 293 | `scene.start('CreditsScene')` from victory | Music is `victoryMusic`, not stopped |
| BossScene.js | 298 | `scene.start('MenuScene')` from dead | Music already stopped at 1226, OK |
| BossScene.js | 301 | `scene.start('BossScene')` retry from dead | Music already stopped at 1226, OK |
| ExplosionCinematicScene.js | 581 | `scene.start('BeirutIntroCinematicScene')` | Music stopped at line 25 on create, may be playing victory-related audio |
| EndgameManager.js | 244 | `scene.start('ExplosionCinematicScene')` | No explicit music stop |
| BeirutRadarScene.js | 284 | `scene.start('DeepStrikeIntroCinematicScene')` from results | Music stopped at line 551 in `_showResults()`, OK |

### Critical Fixes Needed (8 callsites)
1. **BaseCinematicScene.js:79** -- `_handleSkip` skip Act2 to target scene
2. **BaseCinematicScene.js:106** -- `_autoAdvance` to target scene
3. **GameScene.js:445** -- Skip level to ExplosionCinematicScene
4. **GameScene.js:484** -- Pause quit to MenuScene
5. **GameScene.js:491** -- Game over ENTER to MenuScene
6. **GameScene.js:479,490** -- `scene.restart()` calls (2 callsites)
7. **BossScene.js:293** -- Victory to CreditsScene
8. **EndgameManager.js:244** -- Endgame to ExplosionCinematicScene

### Cinematic Scenes That Start Music on create()
These scenes call `playCinematicMusic()` or `playMenuMusic()` in their `create()` method, which internally calls `_startLoop` which calls `stop(0.3)`. So if the previous scene's music was not explicitly stopped, `_startLoop` will stop it with a short 0.3s fade. This works but produces a shorter fade than desired (0.3s instead of 1.5s). For proper crossfade, the outgoing scene should trigger the transition.

| Scene | Music Started |
|-------|--------------|
| GameIntroScene | `playCinematicMusic(1)` |
| IntroCinematicScene | `playCinematicMusic(1)` |
| BeirutIntroCinematicScene | `playCinematicMusic(2)` |
| DeepStrikeIntroCinematicScene | `playCinematicMusic(3)` |
| UndergroundIntroCinematicScene | `playCinematicMusic(4)` |
| MountainBreakerIntroCinematicScene | `playCinematicMusic(5)` |
| LastStandCinematicScene | `playCinematicMusic(6)` |
| CreditsScene | `playMenuMusic()` |
| MenuScene | `playMenuMusic()` |

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `linearRampToValueAtTime` for fades | `setValueCurveAtTime` with equal-power Float32Array | Always available in Web Audio API | Smoother perceived fade, no volume dip |
| Manual setTimeout for gain changes | AudioParam scheduling methods | Always the correct approach | Sample-accurate timing |
| No `crossfadeTo()` | Dual GainNode with overlapping curves | New feature for this phase | Eliminates silence gap between themes |

**Deprecated/outdated:**
- `webkitAudioContext` -- only needed for very old Safari. The existing constructor fallback `new (window.AudioContext || window.webkitAudioContext)()` is correct and harmless to keep.

## Open Questions

1. **crossfadeTo() generator pattern**
   - What we know: Generator functions connect nodes to `this.musicGain`. For crossfade, the incoming generator needs to connect to a different GainNode.
   - What's unclear: Whether to pass the GainNode as a parameter to the generator, or temporarily swap `this.musicGain` before calling the generator.
   - Recommendation: Temporarily swap `this.musicGain` pointer -- simplest approach, requires zero changes to existing generator methods like `_kick()`, `_pad()`, etc. which all connect to `this.musicGain`.

2. **masterGain volume persistence**
   - What we know: `masterGain.gain.value` is set to 1.0 on init, 0 on mute. It persists across transitions already since MusicManager is a singleton.
   - What's unclear: Whether volume should fade-persist across transitions (e.g., user sets volume to 0.7, does it survive transitions?).
   - Recommendation: It already does via the singleton pattern. No additional work needed.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None -- no test framework installed |
| Config file | none -- see Wave 0 |
| Quick run command | N/A |
| Full suite command | N/A |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AUDIO-01a | stop() uses equal-power fade curve | manual | Browser DevTools: inspect gain values during fade | N/A |
| AUDIO-01b | No zombie nodes after stop() | manual | Browser DevTools: `window.__musicManager._nodes.length === 0` after stop completes | N/A |
| AUDIO-01c | No volume doubling on scene.restart() | manual | Listen test: restart scene, verify volume stays constant | N/A |
| AUDIO-01d | crossfadeTo() overlaps two themes smoothly | manual | Listen test: trigger crossfade, verify no silence gap or volume spike | N/A |
| AUDIO-01e | All scene.start() callsites handle music | manual-only | Code review: grep for `scene.start(` and verify each has music handling | N/A |

**Justification for manual-only:** Web Audio API requires a running browser AudioContext (needs user gesture to create). Unit testing would require mocking the entire AudioContext, AudioParam scheduling, GainNode, OscillatorNode, and BufferSourceNode APIs -- the mocking cost exceeds the value. The most reliable validation is:
1. Code review (static analysis of all callsites)
2. Runtime console assertions (e.g., `console.assert(this._nodes.length === 0, 'zombie nodes detected')`)
3. Manual play-through testing in browser

### Sampling Rate
- **Per task commit:** Manual browser test -- play through 2-3 scene transitions
- **Per wave merge:** Full play-through from menu through at least 3 level transitions
- **Phase gate:** Full game play-through verifying all transitions are smooth

### Wave 0 Gaps
- No test framework needed for this phase (manual/browser testing only)
- Consider adding runtime assertions in development mode (`_cleanupNodes()` could assert `_nodes.length === 0` after cleanup)

## Sources

### Primary (HIGH confidence)
- [MDN AudioParam.setValueCurveAtTime](https://developer.mozilla.org/en-US/docs/Web/API/AudioParam/setValueCurveAtTime) -- Verified native Float32Array curve scheduling API
- [MDN AudioNode.disconnect()](https://developer.mozilla.org/en-US/docs/Web/API/AudioNode/disconnect) -- Node cleanup and GC behavior
- [MDN AudioBufferSourceNode](https://developer.mozilla.org/en-US/docs/Web/API/AudioBufferSourceNode) -- Single-use nature, fire-and-forget pattern
- [MDN Web Audio API Best Practices](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices) -- AudioContext gesture-unlock, AudioParam scheduling
- [MDN AudioScheduledSourceNode ended event](https://developer.mozilla.org/en-US/docs/Web/API/AudioScheduledSourceNode/ended_event) -- Post-stop cleanup callbacks

### Secondary (MEDIUM confidence)
- [Boris Smus "Web Audio API" Chapter 3](https://webaudioapi.com/book/Web_Audio_API_Boris_Smus_html/ch03.html) -- Equal-power crossfade formula and theory
- [Web Audio API spec: AudioNode Lifetime](https://github.com/WebAudio/web-audio-api/issues/1471) -- GC behavior of disconnected nodes

### Tertiary (LOW confidence)
- None -- all findings verified against official sources

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- raw Web Audio API, no external libraries, well-documented native APIs
- Architecture: HIGH -- existing MusicManager architecture is sound, changes are additive (new methods, curve fix)
- Pitfalls: HIGH -- verified against MDN documentation and Web Audio API spec issues

**Research date:** 2026-03-05
**Valid until:** Indefinite -- Web Audio API is a stable, mature standard
