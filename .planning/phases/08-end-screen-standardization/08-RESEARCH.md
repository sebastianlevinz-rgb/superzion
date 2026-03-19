# Phase 8: End-Screen Standardization - Research

**Researched:** 2026-03-19
**Domain:** Phaser 3 scene lifecycle, keyboard input management, shared UI overlay
**Confidence:** HIGH

## Summary

All 6 game levels need consistent win/lose end screens using the shared `EndScreen.js` module. Currently only 2 of 6 levels fully use it (Levels 2-3 via PortSwapScene and BomberScene). Level 1's victory goes through a separate cinematic scene (ExplosionCinematicScene) with hand-rolled buttons. Levels 4-6 (DroneScene, B2BomberScene, BossScene) each duplicate ~50-80 lines of inline button rendering and key handling that closely mirrors EndScreen.js but with slight inconsistencies.

The existing EndScreen.js API is well-designed: `showVictoryScreen(scene, opts)` and `showDefeatScreen(scene, opts)` handle overlay, title, stats, stars, buttons, and key bindings. However, it has a keyboard listener leak: it calls `scene.input.keyboard.addKey()` and attaches `.on('down', ...)` handlers but never removes them. Across retries (R key), these listeners accumulate because `addKey` returns the same Key object and stacks event handlers. The scenes that hand-roll their own end screens avoid this by using `JustDown()` polling in the update loop, but this approach requires per-scene boilerplate. The fix is to add a `destroy()` cleanup method to EndScreen.js and wire it into each scene's shutdown.

**Primary recommendation:** Enhance EndScreen.js with (1) a cleanup/destroy method that removes key listeners, (2) an optional `onBeforeTransition` callback for scenes that need ambient sound cleanup. Then migrate the 4 non-compliant scenes to use EndScreen.js, removing their inline implementations. Keep each scene's stats computation logic in place -- only replace the overlay rendering and key handling.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| UX-01 | All 6 levels show end-of-level screen: Win = "PLAY AGAIN (R)" + "NEXT LEVEL (ENTER)", Lose = "RETRY (R)" + "SKIP LEVEL (S)" -- using shared EndScreen.js module | Full audit of all 6 scenes completed; 4 need migration, EndScreen.js needs keyboard cleanup enhancement |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Phaser | 3.x | Game framework (already in project) | Single game engine for entire project |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| EndScreen.js | local module | Shared victory/defeat overlay | All 6 levels for win/lose screens |

No new dependencies needed. This is purely a refactoring of existing code to use the existing shared module.

## Architecture Patterns

### Current End-Screen Implementation Map

```
Level 1 (GameScene):
  Win:  GameScene -> ExplosionCinematicScene._showVictory() [CUSTOM INLINE]
  Lose: GameScene._gameOverScreen() -> showDefeatScreen() [EndScreen.js]

Level 2 (PortSwapScene, key='BeirutRadarScene'):
  Win:  _missionComplete() -> showVictoryScreen() [EndScreen.js] OK
  Lose: _missionFailed()   -> showDefeatScreen()  [EndScreen.js] OK

Level 3 (BomberScene):
  Win:  _showVictory() -> showVictoryScreen() [EndScreen.js] OK
  Lose: _showVictory() -> showDefeatScreen()  [EndScreen.js] OK

Level 4 (DroneScene):
  Win:  _showVictory() [CUSTOM INLINE ~100 lines]
  Lose: _showVictory() [CUSTOM INLINE, same function, branch on missionSuccess]

Level 5 (B2BomberScene):
  Win:  _showVictory() [CUSTOM INLINE ~95 lines]
  Lose: _showVictory() [CUSTOM INLINE, same function, branch on missionSuccess]

Level 6 (BossScene):
  Win:  _showVictory() [CUSTOM INLINE ~80 lines]
  Lose: _playerDeath()  [CUSTOM INLINE ~75 lines]
```

### Target Architecture

```
All levels:
  Win:  [scene-specific stats computation] -> showVictoryScreen(scene, opts)
  Lose: [scene-specific defeat setup]      -> showDefeatScreen(scene, opts)

Key input: Handled entirely by EndScreen.js (not per-scene update loops)
Cleanup:   EndScreen.destroy() called from scene shutdown event
```

### Scene Flow (Next Scenes) -- Critical for correct wiring

```
Level 1: GameScene
  currentScene: 'GameScene'
  nextScene:    'BeirutIntroCinematicScene'  (after ExplosionCinematicScene)
  skipScene:    'BeirutIntroCinematicScene'   (same -- skips the explosion cinematic)
  Note: Win path goes through ExplosionCinematicScene first. The cinematic
        itself ends with victory buttons. These need to use EndScreen.js.

Level 2: PortSwapScene (Phaser key: 'BeirutRadarScene')
  currentScene: 'BeirutRadarScene'
  nextScene:    'DeepStrikeIntroCinematicScene'
  skipScene:    'DeepStrikeIntroCinematicScene'
  ALREADY CORRECT

Level 3: BomberScene
  currentScene: 'BomberScene'
  nextScene:    'UndergroundIntroCinematicScene'
  skipScene:    'UndergroundIntroCinematicScene'
  ALREADY CORRECT

Level 4: DroneScene
  currentScene: 'DroneScene'
  nextScene:    'MountainBreakerIntroCinematicScene'
  skipScene:    'MountainBreakerIntroCinematicScene'

Level 5: B2BomberScene
  currentScene: 'B2BomberScene'
  nextScene:    'LastStandCinematicScene'
  skipScene:    'LastStandCinematicScene'

Level 6: BossScene
  currentScene: 'BossScene'
  nextScene:    'VictoryScene'
  skipScene:    'VictoryScene'
```

### Pattern: EndScreen.js Enhancement

The EndScreen.js API needs two additions:

1. **Return cleanup handle**: Both `showVictoryScreen` and `showDefeatScreen` should return an object with a `destroy()` method that removes key listeners and destroys visual elements.

2. **onBeforeTransition callback**: Scenes like DroneScene and B2BomberScene need to run `_stopAmbient()` before scene transitions. The EndScreen `_transitionTo` helper should accept an optional pre-transition callback.

```javascript
// Enhanced API signature:
export function showVictoryScreen(scene, opts = {}) {
  // opts.onBeforeTransition: () => void  -- called before scene.start
  // Returns: { elements, destroy() }
}
```

### Pattern: Inline-to-EndScreen Migration

For scenes that currently hand-roll end screens (DroneScene, B2BomberScene, BossScene):

1. Keep the stats computation logic in the scene (star ratings, line formatting)
2. Convert stats into EndScreen.js `{ label, value }` format
3. Replace the inline overlay/button/key code with a single `showVictoryScreen()` or `showDefeatScreen()` call
4. Remove the `case 'victory':` key-polling block from the scene's `update()` method
5. Add EndScreen cleanup to the scene's `shutdown()` method

### Anti-Patterns to Avoid

- **Don't duplicate key handling in update() and EndScreen.js**: The scenes that currently use EndScreen.js (BomberScene) already have `case 'victory': break;` (no-op) in their update loop. The inline scenes poll keys in update(). After migration, remove the key polling.
- **Don't forget ambient sound cleanup**: DroneScene, B2BomberScene, and BossScene all have ambient sounds that must be stopped on transition. Use `onBeforeTransition` callback.
- **Don't break the ExplosionCinematicScene skip-to-victory flow**: Level 1's cinematic can be skipped (ENTER/SPACE), which jumps directly to `_showVictory()`. The stats object is passed in from GameScene. This flow must be preserved.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Victory/defeat overlay | Per-scene inline buttons, titles, stats | EndScreen.js `showVictoryScreen` / `showDefeatScreen` | 6 inconsistent implementations cause maintenance burden, visual drift, and keyboard leak bugs |
| Key input cleanup | Forgetting to remove `.on('down')` listeners | EndScreen.destroy() method | Phaser `addKey()` returns same Key object; stacked `.on('down')` handlers fire multiple times on retry |

## Common Pitfalls

### Pitfall 1: Keyboard Listener Accumulation
**What goes wrong:** Each call to `showVictoryScreen` adds `.on('down', ...)` to the R/ENTER/S keys. If player presses R to retry and then wins/loses again, new listeners stack on the same Key objects. Third retry fires the callback 3 times.
**Why it happens:** `scene.input.keyboard.addKey('R')` returns the same Key instance if already registered. `.on('down', fn)` appends, it doesn't replace.
**How to avoid:** EndScreen must remove listeners on destroy. Call `key.off('down')` or `key.removeAllListeners('down')` before scene transition. Better: use `key.once('down', fn)` or store references and call `key.off('down', specificFn)`.
**Warning signs:** Scene transitions fire multiple times (double-start errors in console), music stops/starts erratically.

### Pitfall 2: Phase State Desync
**What goes wrong:** DroneScene, B2BomberScene, BossScene use a `this.phase` string to track game state. If EndScreen key handling fires a transition while the scene's `update()` loop still runs, the scene may try to update destroyed objects.
**Why it happens:** EndScreen uses `scene.time.delayedCall(500, ...)` for key setup, but the scene's update loop doesn't know EndScreen is active.
**How to avoid:** Set `this.phase = 'victory'` or `this.phase = 'dead'` BEFORE calling showVictoryScreen/showDefeatScreen. The scene's update() should early-return for these phases (all 3 inline scenes already do this).

### Pitfall 3: ExplosionCinematicScene is Special
**What goes wrong:** Level 1's win path is: GameScene -> EndgameManager._escapeSuccess() -> ExplosionCinematicScene (cinematic animation) -> _showVictory() (inline buttons). Naively adding EndScreen.js to GameScene's win path would skip the explosion cinematic.
**Why it happens:** The explosion cinematic IS the victory celebration for Level 1. The actual end-screen (PLAY AGAIN / NEXT LEVEL) appears at the end of that cinematic.
**How to avoid:** Migrate ExplosionCinematicScene._showVictory() to use EndScreen.js, NOT GameScene's win path. The game over / defeat path in GameScene already correctly uses EndScreen.js.

### Pitfall 4: BossScene Disintegration Must Complete
**What goes wrong:** BossScene has a spectacular pixel-by-pixel disintegration animation when the boss dies. If the end screen overlays too early, it clips the disintegration.
**Why it happens:** The current code already handles this with `victory_pending` -> delayed 500ms -> `_showVictory()`. Must preserve this timing.
**How to avoid:** Call `showVictoryScreen` only after the disintegration completes (keep existing delay chain). The `victory_pending` phase already protects this.

### Pitfall 5: Ambient Sound Cleanup
**What goes wrong:** DroneScene and B2BomberScene have `_stopAmbient()` calls that must fire before scene transitions. If EndScreen handles the transition without calling these, orphan WebAudio nodes persist.
**Why it happens:** EndScreen's `_transitionTo` only calls `MusicManager.get().stop()`, not scene-specific ambient cleanup.
**How to avoid:** Add `onBeforeTransition` callback to EndScreen opts. Pass `() => this._stopAmbient()` from DroneScene and B2BomberScene.

### Pitfall 6: BossScene Victory Uses CrossfadeTo
**What goes wrong:** BossScene's victory transition to VictoryScene uses `MusicManager.get().crossfadeTo('menu', ...)` instead of `.stop()`. EndScreen's `_transitionTo` calls `.stop(0.3)`.
**How to avoid:** Use the `onBeforeTransition` callback for BossScene victory to call crossfadeTo instead of letting EndScreen do the default stop. Or: just let EndScreen do `.stop(0.3)` since VictoryScene calls `playVictoryMusic()` on create -- the crossfade was a nice-to-have, not critical.

## Code Examples

### Current EndScreen.js Key Setup (problematic)
```javascript
// Source: superzion/src/ui/EndScreen.js lines 146-157
scene.time.delayedCall(500, () => {
  const rKey = scene.input.keyboard.addKey('R');
  const enterKey = scene.input.keyboard.addKey('ENTER');
  rKey.on('down', () => {
    _transitionTo(scene, currentScene);
  });
  enterKey.on('down', () => {
    _transitionTo(scene, nextScene);
  });
});
```

### Enhanced EndScreen.js with Cleanup (target)
```javascript
// Key handling with cleanup support
let _keyCleanups = [];

function _setupKeys(scene, keyMap, onBeforeTransition) {
  scene.time.delayedCall(500, () => {
    for (const [keyName, targetScene] of Object.entries(keyMap)) {
      const key = scene.input.keyboard.addKey(keyName);
      const handler = () => {
        if (onBeforeTransition) onBeforeTransition();
        _transitionTo(scene, targetScene);
      };
      key.on('down', handler);
      _keyCleanups.push({ key, event: 'down', handler });
    }
  });
}

// Returned destroy method
function destroy() {
  for (const { key, event, handler } of _keyCleanups) {
    key.off(event, handler);
  }
  _keyCleanups = [];
  for (const el of elements) {
    if (el && el.destroy) el.destroy();
  }
}
```

### Migration Pattern: DroneScene (before)
```javascript
// Source: superzion/src/scenes/DroneScene.js lines 3317-3335
case 'victory':
  if (!this._victoryKeysEnabled) break;
  if (Phaser.Input.Keyboard.JustDown(this.keys.r)) {
    this._stopAmbient();
    MusicManager.get().stop(0.3);
    this.scene.start('DroneScene');
  }
  if (this.missionSuccess) {
    if (Phaser.Input.Keyboard.JustDown(this.keys.enter) || ...) {
      this._stopAmbient();
      this.scene.start('MountainBreakerIntroCinematicScene');
    }
  } else {
    if (Phaser.Input.Keyboard.JustDown(this.keys.s)) {
      this._stopAmbient();
      MusicManager.get().stop(0.3);
      this.scene.start('MountainBreakerIntroCinematicScene');
    }
  }
  break;
```

### Migration Pattern: DroneScene (after)
```javascript
// In _showVictory(), after stats computation:
const beforeTransition = () => this._stopAmbient();

if (missionSuccess) {
  this._endScreen = showVictoryScreen(this, {
    title: 'MISSION COMPLETE',
    stats: statsArray,
    stars: starCount,
    currentScene: 'DroneScene',
    nextScene: 'MountainBreakerIntroCinematicScene',
    onBeforeTransition: beforeTransition,
  });
} else {
  this._endScreen = showDefeatScreen(this, {
    title: 'MISSION FAILED',
    stats: statsArray,
    currentScene: 'DroneScene',
    skipScene: 'MountainBreakerIntroCinematicScene',
    onBeforeTransition: beforeTransition,
  });
}

// Remove the entire 'case victory:' key polling block from update()
// Add to shutdown():
//   if (this._endScreen) this._endScreen.destroy();
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Per-scene inline end screens | Shared EndScreen.js module exists | Already in codebase | 2 of 6 scenes use it; 4 still inline |
| `.on('down')` without cleanup | Need `.off('down')` or `once()` | This phase | Prevents key listener leak on retry |

## Detailed Scene Audit

### Scenes Needing Migration

| Scene | File | Lines to Remove | Complexity | Special Considerations |
|-------|------|-----------------|------------|------------------------|
| ExplosionCinematicScene | ExplosionCinematicScene.js | ~100 (lines 488-628) | MEDIUM | Skip-to-victory flow must be preserved; stats passed from GameScene |
| DroneScene | DroneScene.js | ~105 (lines 3171-3273 + update case) | LOW | `_stopAmbient()` callback needed |
| B2BomberScene | B2BomberScene.js | ~95 (lines 1437-1530 + update case) | LOW | `_stopAmbient()` callback needed |
| BossScene (victory) | BossScene.js | ~80 (lines 2332-2413 + update case) | LOW | Disintegration delay preserved; crossfadeTo nice-to-have |
| BossScene (death) | BossScene.js | ~70 (lines 2096-2153 + update case) | LOW | flash/shake already fires before delayed end screen |

### Scenes Already Compliant (verify only)

| Scene | File | Victory | Defeat | Needs Fix? |
|-------|------|---------|--------|------------|
| GameScene | GameScene.js | N/A (via ExplosionCinematicScene) | showDefeatScreen YES | Defeat path OK, but no keyboard cleanup |
| PortSwapScene | PortSwapScene.js | showVictoryScreen YES | showDefeatScreen YES | No keyboard cleanup |
| BomberScene | BomberScene.js | showVictoryScreen YES | showDefeatScreen YES | No keyboard cleanup |

All 6 scenes need keyboard cleanup even if already using EndScreen.js.

## Open Questions

1. **Stats display delay in inline scenes**
   - What we know: The inline scenes (DroneScene, B2BomberScene, BossScene) animate stats with staggered fade-in over ~3 seconds, then show buttons after a delay (3000-3400ms). EndScreen.js shows buttons immediately at 500ms delay.
   - What's unclear: Should EndScreen.js be enhanced to support the staggered stats animation, or is immediate display acceptable?
   - Recommendation: The 500ms delay in EndScreen.js is sufficient. The staggered animation is nice but not required by UX-01. Keep it simple.

2. **Star display in EndScreen.js vs inline**
   - What we know: EndScreen.js has `_makeStars(scene, count, y)` that renders actual star characters. Inline scenes put stars in the stats text lines. Both approaches work.
   - What's unclear: Should stars be a separate visual element (EndScreen.js approach) or embedded in stats text?
   - Recommendation: Use EndScreen.js's `stars` parameter for consistency. Convert inline star calculations to a count.

3. **localStorage star saving**
   - What we know: DroneScene, B2BomberScene, BossScene, ExplosionCinematicScene all save star ratings to localStorage. This happens in their `_showVictory()` methods before the overlay renders.
   - What's unclear: Should this stay in the scene or move to EndScreen?
   - Recommendation: Keep localStorage writes in each scene's code before calling showVictoryScreen. This is scene-specific logic, not UI.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None (no test framework configured) |
| Config file | none |
| Quick run command | N/A |
| Full suite command | N/A |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| UX-01a | Winning any level shows PLAY AGAIN + NEXT LEVEL | manual-only | Visual verification in browser | N/A |
| UX-01b | Losing any level shows RETRY + SKIP LEVEL | manual-only | Visual verification in browser | N/A |
| UX-01c | End screens appear after animations complete | manual-only | Visual verification in browser | N/A |
| UX-01d | No keyboard listener leaks across retries | manual-only | Retry 3x, verify single transition fires | N/A |

**Manual-only justification:** This is a Phaser browser game with no test framework. Verification requires visual inspection in a running browser. The success criteria are UI behaviors (button visibility, key responses, animation timing) that cannot be unit-tested without a Phaser test harness.

### Sampling Rate
- **Per task commit:** `cd superzion && npx vite build` (verify no build errors)
- **Per wave merge:** Manual browser playthrough of all 6 levels
- **Phase gate:** Visual verification of all 4 success criteria

### Wave 0 Gaps
None -- no test infrastructure needed. This phase is verified by visual inspection and build success.

## Sources

### Primary (HIGH confidence)
- Direct codebase audit of all 6 scene files, EndScreen.js, EndgameManager.js, main.js
- Phaser 3 keyboard input API (training knowledge, well-established stable API)

### Secondary (MEDIUM confidence)
- Phaser 3 `addKey()` behavior: returns existing Key if already registered, `.on()` stacks handlers (verified by code inspection of how scenes currently work)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - no new libraries, purely internal refactoring
- Architecture: HIGH - existing EndScreen.js module already implements the target pattern; only enhancement needed
- Pitfalls: HIGH - identified from direct code reading; keyboard leak is visible in the code
- Scene mapping: HIGH - verified all 6 levels' scene keys, next-scenes, and current implementations

**Research date:** 2026-03-19
**Valid until:** Indefinite (internal codebase research, no external dependencies)
