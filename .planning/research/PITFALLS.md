# Domain Pitfalls

**Domain:** Procedural game polish pass (sprite redesign, audio synthesis, UX) on existing Phaser 3 codebase
**Researched:** 2026-03-19
**Applies to:** SuperZion v1.1 Polish Pass (8 targeted fixes)

---

## Critical Pitfalls

Mistakes that cause regressions, broken scenes, or require major rework.

---

### Pitfall 1: Sprite Identity Fragmentation Across Scene-Specific Texture Systems

**Affects:** Fix #1 (Player sprite redesign), Fix #3 (Restore bosses/flags), Fix #4 (Final intro screen)

**What goes wrong:** The codebase generates player/character textures independently in at least 5 separate texture files (`BombermanTextures.js`, `PortSwapTextures.js`, `ParadeTextures.js`, `CinematicTextures.js`, `SpriteGenerator.js`), each with its own drawing functions, palettes, and proportions. When redesigning the player sprite to look like a Mossad agent instead of cubes, the natural approach is to update `SpriteGenerator.js` (which already contains a detailed 572-line Mossad agent sprite) and assume it propagates. It does not. Each scene has its own texture generator that independently draws a player character. The agent in `CinematicTextures.js` already has its own palette (`PAL`) that is a subset copy, not a shared reference. `BombermanTextures.js` draws a completely separate `bm_player_${dir}_${frame}` set of directional walk sprites. `PortSwapTextures.js` draws `ps_player_${dir}_${frame}`. `ParadeTextures.js` draws a parade hero. None of these import from `SpriteGenerator.js` -- it is currently orphaned (zero imports across the entire codebase).

**Why it happens:** The game was built organically, level by level. Each level has different view perspectives (top-down, side-scrolling, front-facing) requiring different sprite orientations and scales. There was never a shared sprite system; each scene's texture file is self-contained.

**Consequences:**
- Updating one texture file leaves the player looking different (or still cube-shaped) in other scenes
- The "Mossad agent" appearance from `SpriteGenerator.js` (128x128, side-view, detailed with 47-color palette) is incompatible with the top-down 32x32 sprites needed by Level 1 (`BombermanTextures`) and Level 2 (`PortSwapTextures`)
- Proportions that look good at 128px break at 32px (fine details like stubble, Star of David, pocket stitching become noise)
- The cinematic hero sprite (128x192 in `CinematicTextures.js`) has yet another aspect ratio

**Prevention:**
1. Audit every texture file that draws a player character BEFORE writing any code. Map: which files, which texture keys, which dimensions, which view angle
2. Create a shared palette module (extract `PAL` from `SpriteGenerator.js`) that all texture files import, ensuring color consistency even when proportions differ
3. Accept that the same character at different scales needs different levels of detail: 128px gets stubble and pocket stitching, 32px gets silhouette and color blocks only, 192px cinematic gets the full treatment
4. Test by playing through every level transition after each sprite change -- the intro, all 6 levels, and the victory scene

**Detection (warning signs):**
- `SpriteGenerator.js` still has zero imports after "completing" the sprite redesign
- Player looks different between the intro cinematic and Level 1
- Star of David is invisible or garbled at small sprite sizes

---

### Pitfall 2: Web Audio Node Accumulation and Clipping in Procedural Music

**Affects:** Fix #2 (Intro psytrance music + SFX)

**What goes wrong:** `IntroMusic.js` (945 lines) pre-schedules 25 seconds of music across 3 acts using raw Web Audio API oscillators. Each `_psyKick()` creates 4 nodes (2 oscillators + 2 gain nodes). Each `_acidBass()` creates 5 nodes (2 oscillators + subGain + filter + gain). Each `_hihat()` creates 3 nodes. The `_track()` method pushes every created node into a flat `_nodes` array. At 145 BPM over 25 seconds, this generates hundreds of scheduled oscillator/gain/filter nodes. When combined with synchronized SFX (missile whoosh, explosions, doppler), the mix easily exceeds 0dB and clips. The master gain is set to 0.38, but layered psytrance (kick + bass + hi-hat + lead + pad) plus SFX all summing together will exceed headroom.

**Why it happens:**
- Web Audio oscillators cannot be reused after stopping -- each note requires new node creation. This is a fundamental API constraint, not a bug.
- The `_nodes` array grows unboundedly during the 25-second intro. While `stop()` calls `disconnect()` on all nodes, if stop is never called (e.g., scene skip during garbage collection), nodes persist in memory.
- No DynamicsCompressorNode exists in the signal chain. The signal path is: individual gains -> `_gainNode` (0.38) -> `musicGain` (0.5) -> `masterGain` (1.0) -> `destination`. Multiple simultaneous voices easily sum above 1.0 before the destination.
- Chromium has documented GC issues with Web Audio nodes (Chromium bug #576484), where stopped/disconnected nodes may not be collected promptly.

**Consequences:**
- Audible clipping/distortion during intense sections (Act 1 with explosions + acid bass + kick)
- On low-end devices, scheduling hundreds of future nodes at scene start may cause a brief stutter or frame drop
- If the user skips the intro rapidly, the `stop()` method's try/catch loop over hundreds of nodes adds latency to the skip
- Memory accumulation if the intro is replayed multiple times (return to menu -> play intro again)

**Prevention:**
1. Insert a `DynamicsCompressorNode` between `_gainNode` and `musicGain` with threshold around -6dB, ratio 4:1. This is the standard Web Audio solution for procedural multi-voice mixing.
2. Reduce individual voice volumes: kick 0.35 instead of 0.45, acid bass 0.12 instead of 0.18. Let the compressor handle peaks rather than relying on headroom math.
3. On `stop()`, null out the `_nodes` array after the disconnect loop (currently it does `this._nodes = []` which is correct, but verify no closures retain old references).
4. Batch-schedule nodes by act rather than all at once. Schedule Act 2 nodes at the 7-second mark, Act 3 at the 15-second mark. This spreads the allocation cost and allows earlier acts' nodes to be GC'd.
5. Test on Chrome DevTools Web Audio tab -- inspect the audio graph for orphaned nodes after skip.

**Detection (warning signs):**
- Crackling or harsh sound during the intro's loudest moments
- `_nodes.length` exceeds 300 by the end of the 25-second intro
- Frame rate dip in the first 500ms of the intro scene
- Chrome DevTools console warnings about AudioContext or node limits

---

### Pitfall 3: Keyboard Input Listener Leaks on Scene Transitions

**Affects:** Fix #7 (End-of-level screens), Fix #8 (Controls overlay), all scene transitions

**What goes wrong:** The `EndScreen.js` registers keyboard listeners via `scene.input.keyboard.addKey('R')` and then `.on('down', callback)` inside a `delayedCall`. These listeners bind to the scene's keyboard plugin but are never explicitly removed. Phaser 3 has a documented issue (GitHub issue #3489) where keyboard listeners remain active after scene transitions. When `_transitionTo` starts a new scene, the old scene's keyboard listeners may still fire. The `ControlsOverlay.js` creates Phaser game objects (rectangles, text) and tweens that could persist if the scene transitions before the tween completes or before the `delayedCall` fires.

**Why it happens:**
- `addKey()` in a delayed callback: if the scene transitions before the 500ms delay, the callback still fires and adds a key listener to a scene that is shutting down
- Three scenes (`DroneScene`, `B2BomberScene`, `BossScene`) have their own custom victory/defeat screens rather than using the shared `EndScreen.js`. Converting them to use the shared module requires understanding each scene's custom cleanup logic.
- The `ControlsOverlay` creates a `delayedCall` for transitioning from big overlay to bar. If the scene ends during those 3 seconds, the callback fires on a destroyed scene.

**Consequences:**
- Pressing 'R' or 'S' after transitioning to a new scene could restart/skip the PREVIOUS scene
- Console errors from operating on destroyed game objects
- Ghost key listeners accumulating across scene replays (retry -> retry -> retry)

**Prevention:**
1. In `EndScreen.js`, store key references and remove them in a cleanup function. Return the cleanup function so scenes can call it in their `shutdown` event.
2. Guard all `delayedCall` callbacks with `if (this.scene.isActive())` or `if (!this.scene.scene.isActive(this.scene.scene.key))` checks.
3. For the 3 scenes with custom victory screens, add the shared `EndScreen.js` import but call it from within the existing `_showVictory()` method rather than replacing the entire flow. This preserves scene-specific stats calculation while standardizing the UI.
4. Verify by rapidly pressing ENTER during end-of-level screens to ensure no double-transitions occur.

**Detection (warning signs):**
- Console errors mentioning "Cannot read property of null" or "destroy on destroyed object"
- Pressing a key in one scene triggers behavior from a different scene
- Multiple `_transitionTo` calls fire for a single key press

---

### Pitfall 4: Restoring Lost Content Without Understanding Why It Was Lost

**Affects:** Fix #3 (Restore intro bosses and flags), Fix #4 (Final intro screen)

**What goes wrong:** The PROJECT.md states bosses and flags were "lost in some refactor." The temptation is to re-add boss sprites and flag animations to `GameIntroScene.js` without understanding the refactor that removed them. The `_bossFlashEntry()` method is called in `GameIntroScene.js` at lines 87, 95, etc., but the sprites it references may no longer exist as texture keys. `ParadeTextures.js` still has `createIranFlag`, `wavingSheet`, and boss sprite functions -- the texture generators exist, but the intro scene may have stopped calling `generateAllParadeTextures()` correctly, or the texture keys may have been renamed.

**Why it happens:**
- `GameIntroScene.js` imports and calls `generateAllParadeTextures(this)` in `create()`, so the texture generation code IS being called. The loss is more likely in the rendering/display code within the acts, not the texture generation.
- During the refactor that added `IntroMusic`, the act structure may have been reorganized, and boss sprite display code could have been commented out or replaced with simpler placeholders.
- Boss sprites might be generated but never used as image sources (the texture exists but no `this.add.image()` or `this.add.sprite()` references it).

**Consequences:**
- Re-adding boss sprites without checking if texture keys still match causes "Texture not found" errors
- Boss sprites from `ParadeTextures.js` were designed for a parade context (walking, side-view); the intro scene might need different poses (attacking, shooting) that do not exist
- Adding waving flag animations alongside the existing smoke/explosion effects creates z-depth conflicts
- Restored content breaks the timing of the 25-second intro music, which is synchronized to specific act durations

**Prevention:**
1. Before writing any code, audit `ParadeTextures.js` for all exported texture-generation functions and their output keys. List every key.
2. In `GameIntroScene.js`, search for references to those keys (e.g., `'parade_boss_'`, `'flag_iran'`). If the keys are generated but never used as sprite sources, the loss is in the display code, not the generation code.
3. When restoring bosses, match the intro's act timing: Act 1 boss appearances at 1.5s, 3.5s, 5.5s, 7s (these are already timed in the code). Ensure the visual boss display code runs at these exact points.
4. Test each act in isolation -- skip directly to Act 2 or Act 3 to verify bosses and flags display independently from the full sequence.

**Detection (warning signs):**
- `generateAllParadeTextures()` runs without errors but no boss sprites are visible
- Console shows "Texture key 'X' not found" warnings
- Flag animations play but overlap with text or boss sprites due to depth conflicts

---

## Moderate Pitfalls

---

### Pitfall 5: Procedural Sprite Proportions That Look Wrong Despite Being Geometrically Correct

**Affects:** Fix #1 (Player sprite redesign), Fix #3 (Boss sprites)

**What goes wrong:** The existing `SpriteGenerator.js` draws a very detailed 128x128 Mossad agent with anatomically-plausible proportions (head at pixel-level detail, torso with V-taper, individual fingers). When this character is scaled down to game-view sizes (32x32 for top-down, ~48px tall for side-scrolling), the proportions that look correct at full size become unrecognizable. A head that is 24px wide at 128px scale becomes 6px at 32px -- too small to show eyes, hair, and stubble. The detailed vest stitching becomes a gray blur.

**What goes wrong specifically:**
- Human heads in pixel art should be proportionally LARGER than anatomically correct (roughly 1/4 to 1/3 of total height) for readability at game scale
- The current SpriteGenerator uses realistic proportions (~1/7 head-to-body ratio based on the code: head at y=30 area, total height ~128px)
- Fine details (stubble via scattered rgba dots, pocket flaps via 6x5 rectangles) disappear below 64px
- The Star of David drawn with radius 5 at chest-center becomes 1-2 pixels at game scale

**Prevention:**
1. Design sprites at GAME scale first (32x32 for top-down, ~48px for side-scroll), not at detail scale. Use the detail version only for cinematics.
2. For 32px sprites: exaggerate head size (8-10px diameter), reduce body detail to color blocks, make the Star of David a simple 3x3 gold cross-pattern
3. For each view angle, create a separate drawing function: `drawAgentTopDown(ctx, size)`, `drawAgentSide(ctx, size)`, `drawAgentCinematic(ctx, w, h)` -- each with proportions tuned for that scale
4. Validate by screenshotting the game at 1:1 pixel ratio and checking readability without zooming

**Detection (warning signs):**
- Player character looks like an indistinct dark blob in gameplay
- Cannot distinguish the player from guards or other dark-colored entities
- The Star of David is invisible during normal gameplay

---

### Pitfall 6: Aircraft Sprite Orientation Confusion Between Side-View and Cinematic Contexts

**Affects:** Fix #6 (F-15 reversed wings)

**What goes wrong:** The F-15 sprite in `BomberTextures.js` is drawn facing RIGHT (nose at x=61, tail at x=5 on a 64x32 canvas). The wings are drawn with vertices at x=16-36, which places them at the rear-center of the fuselage -- this is geometrically correct for swept-back wings on a rightward-facing side view. The issue described ("wings pointing forward") likely occurs in the cinematic scene where the sprite is used with `setFlipX(true)` or in a different orientation context. The cinematic intro (`DeepStrikeIntroCinematicScene.js`) uses a separate `createF15Hangar()` from `CinematicTextures.js` which may draw the F-15 differently.

**Why it matters:** There are at least TWO F-15 sprites: one in `BomberTextures.js` (used in gameplay Level 3) and one in `CinematicTextures.js` (used in the Deep Strike intro cinematic). Fixing the wrong one, or fixing one and not the other, creates inconsistency.

**Prevention:**
1. Identify WHICH F-15 has the wing issue. The issue description says "Level 3 cinematic" -- check `DeepStrikeIntroCinematicScene.js` first, then `BomberScene.js`.
2. Understand the wing geometry: swept-back means wing leading edge angles FROM the fuselage BACKWARD (trailing edge is further back than leading edge). In a rightward-facing sprite, the wing root (near fuselage) should be at higher X than the wingtip.
3. Check for `setFlipX()`, `setAngle()`, or `setRotation()` calls that could make correct geometry appear reversed.
4. After fixing, verify both the cinematic intro AND the gameplay level to ensure both F-15s have correct wing orientation.

**Detection (warning signs):**
- Wings appear to point toward the nose rather than sweeping backward
- The F-15 looks like it is flying backward or has forward-swept wings (like an X-29, not an F-15)
- Fix applied to `BomberTextures.js` but issue was actually in `CinematicTextures.js`

---

### Pitfall 7: End-of-Level Screen Integration Across 6 Heterogeneous Scene Types

**Affects:** Fix #7 (End-of-level screens across all 6 levels)

**What goes wrong:** The shared `EndScreen.js` module is currently imported by only 3 of 6 game scenes (`GameScene`, `BomberScene`, `PortSwapScene`). The other 3 scenes (`DroneScene`, `B2BomberScene`, `BossScene`) have their own custom victory/defeat screens with scene-specific logic (custom stats, custom layouts, custom key bindings). Naively replacing the custom screens with the shared module breaks scene-specific behavior. But leaving the custom screens means inconsistent UX (different button labels, different key bindings, different layouts across levels).

**The specific integration challenge per scene:**
- `GameScene`: Already uses `showDefeatScreen` but NOT `showVictoryScreen` -- the endgame manager handles victory differently
- `BomberScene`: Uses both `showVictoryScreen` and `showDefeatScreen` -- the simplest case
- `PortSwapScene`: Uses both -- also straightforward
- `DroneScene`: Custom `_showVictory()` method (lines 3171+) with special drone-specific stats, custom key bindings, 3288+ line update loop that checks phase === 'victory'. Has recon/tunnel/boss phase-specific stats.
- `B2BomberScene`: Custom `_showVictory()` (line 1437+) with stealth/defense/bombing phase stats, mission success/failure bifurcation in a single method
- `BossScene`: Custom `_showVictory()` (line 2332+) with disintegration animation that must complete before the overlay appears, plus custom pixel-art death sequence

**Prevention:**
1. Do NOT attempt to replace all custom screens at once. Start with the 3 scenes that already use `EndScreen.js` and standardize their options (button labels, keys).
2. For the 3 custom scenes, wrap the shared `EndScreen.js` call INSIDE the existing `_showVictory()` method. Calculate scene-specific stats first, then pass them as `opts.stats` to the shared module. This preserves the stats logic while standardizing the UI.
3. Verify that `BossScene`'s disintegration animation completion triggers (the `victory_pending` -> `victory` state transition) still works when the shared overlay is layered on top.
4. Test each scene's win AND lose paths separately -- some scenes have complex conditions for what counts as victory vs. defeat.

**Detection (warning signs):**
- End screen appears but with wrong stats or missing stats
- Keys don't work on the end screen because the scene's update loop doesn't pass through to the overlay's key handlers
- Disintegration animation in BossScene is hidden behind the overlay
- "NEXT LEVEL" transitions to the wrong scene because `nextScene` is hardcoded incorrectly

---

### Pitfall 8: Level 2 Container Path Fix Breaking Existing Guard Patrol Routes

**Affects:** Fix #5 (Level 2 container path blocked)

**What goes wrong:** `PortSwapScene.js` generates container layouts procedurally with `CONT_ROW_SPACING = 48` and `CONT_COL_SPACING = 72` (already widened from original 34 and 60). Guard patrol waypoints (defined in the `GUARD_WAYPOINTS` constant) follow corridors BETWEEN container yards. Worker spawn positions are placed in corridors between yards. If container spacing is increased further to fix blocked paths, the guard patrol routes and camera cone coverage areas may no longer align with the corridors, creating either impossible stealth (guard covers entire corridor) or trivial gameplay (guard patrols through containers, never catching the player).

**Why it happens:**
- Container positions, guard routes, camera positions, and worker positions are all hardcoded with absolute pixel coordinates that were tuned together
- Increasing spacing in one dimension shifts all containers in that yard, but guards and cameras remain at their original positions
- The current `CONT_ROW_SPACING = 48` comment says "(was 34)" -- this spacing was already increased once, suggesting the problem recurred or was incompletely fixed

**Prevention:**
1. Before changing spacing, verify exactly WHERE the path is blocked. Run the level and document the specific container pair that blocks passage. The fix might be removing one container rather than increasing all spacing.
2. If spacing must increase, recalculate guard waypoints that reference corridor positions. Search for hardcoded Y-values near the container Y positions.
3. Add a simple completability check: trace a path from player spawn to the target container, then to the exit. If any segment is blocked by container physics bodies, the layout is invalid.
4. After the fix, play through the level at least twice (layouts may have minor randomization) to verify paths remain clear.

**Detection (warning signs):**
- Player can reach some containers but gets stuck between two containers with no way out
- Guards patrol through containers instead of around them (patrol routes not updated)
- Suspicion rises too fast because guards are now closer to corridors than intended

---

### Pitfall 9: Controls Overlay Depth Conflicts and Readability Regression

**Affects:** Fix #8 (Controls overlay readability)

**What goes wrong:** `ControlsOverlay.js` uses `depth: 90` for the persistent bar and `depth + 10` (100) for the initial big overlay. The `EndScreen.js` uses `depth: 500-502`. The game's HUD typically uses depth 50-80. If the controls overlay depth is increased for readability (e.g., to ensure it renders above game effects), it could conflict with the end-of-level screen depth or with scene-specific UI elements. Additionally, the bar text currently uses `fontSize: '13px'` and `color: '#ffffff'` -- making it larger or changing the color to yellow (as specified in the requirements) requires testing against every level's visual style, as some levels have bright backgrounds (Level 3 sunset sky, Level 6 morning sky) where yellow text may be hard to read.

**Prevention:**
1. Use the big overlay's existing approach: dark semi-transparent background behind the text. The `barBg` already has `0x000000, 0.7` opacity -- this is good.
2. When changing text to yellow (`#FFD700`), ensure the background contrast ratio is sufficient. Yellow on black at 0.7 opacity is fine; yellow on translucent black over a bright game background may not be.
3. Keep the overlay depth between HUD (80) and EndScreen (500) -- the current 90 is appropriate.
4. Test with every level type: top-down levels with dark backgrounds (Levels 1, 2), side-scrolling with sky backgrounds (Levels 3, 5), front-facing (Level 4), and approach-view (Level 6).

**Detection (warning signs):**
- Controls text invisible against bright game backgrounds
- Controls overlay renders on top of the end-of-level screen
- Big overlay blocks critical game elements during the first 3 seconds of a level

---

## Minor Pitfalls

---

### Pitfall 10: Texture Key Collisions When Scenes Share the Phaser Texture Manager

**Affects:** Fix #1 (Sprite redesign), Fix #3 (Boss restoration)

**What goes wrong:** All Phaser scenes share a single TextureManager. The existing code uses `if (scene.textures.exists('key')) return;` guards in some texture generators (e.g., `BomberTextures.js` line 29) but not all. When two scenes generate textures with the same key but different content (e.g., both generate a `'player'` texture but with different sprites), the second scene silently uses the first scene's texture. Some generators use `scene.textures.remove(key)` before adding (e.g., `ParadeTextures.js` line 9), while others use early-return guards. The inconsistency means that when fixing sprites, a texture updated in one generator might be overridden or ignored depending on scene visit order.

**Prevention:**
1. Use consistent namespacing for texture keys: `bm_` for bomberman, `ps_` for PortSwap, `cin_` for cinematic, etc. (this already partially exists)
2. When modifying a texture generator, always check whether it uses `exists() -> return` or `remove() -> add`. Match the existing pattern for that file.
3. If the same character must appear in multiple scenes with the same appearance, generate the texture ONCE in a shared init function rather than per-scene.

**Detection (warning signs):**
- Character looks correct in one scene but wrong in another despite both using "the same" texture generation code
- Console warning "Texture key already in use"

---

### Pitfall 11: SFX Timing Drift from Music Schedule

**Affects:** Fix #2 (Intro music + SFX synchronization)

**What goes wrong:** `IntroMusic.js` schedules all music events relative to `this._ctx.currentTime` at construction time. But SFX like screen shake, missile explosions, and visual flashes are triggered via Phaser's `this.time.delayedCall()` in `GameIntroScene.js`. These two timing systems are independent -- Web Audio uses the audio clock (high precision, not affected by frame rate) while Phaser uses the game loop clock (affected by frame rate drops). On a frame rate dip, the visual SFX drift out of sync with the music.

**Prevention:**
1. For tight sync (explosion sound + screen shake), trigger the visual effect from a Web Audio-scheduled callback using `setTimeout` calculated from `(scheduledTime - ctx.currentTime) * 1000`. This is imperfect but closer than Phaser timers.
2. Alternatively, accept minor drift as tolerable for a procedural intro (most players will not notice 50ms drift between audio and visuals).
3. Do NOT try to synchronize Phaser's game clock with Web Audio's clock -- they are fundamentally different timing domains.

**Detection (warning signs):**
- Screen shake happens visibly before or after the explosion sound
- Drift increases over the 25-second intro (cumulative error)

---

### Pitfall 12: Cinematic Maguen David Golden Overlay Blocking Interaction

**Affects:** Fix #4 (Final intro screen with giant Maguen David)

**What goes wrong:** The final intro screen requires a giant golden semi-transparent Star of David behind SuperZion with an arcade font title. If the semi-transparent overlay is implemented as a full-screen game object with input interactivity, it may block the skip key or interfere with the scene transition. The `BaseCinematicScene` skip mechanism checks `Phaser.Input.Keyboard.JustDown(this.enterKey)` in the update loop, which is keyboard-based and should not be blocked by game objects -- but if the implementation adds click-to-skip or touch events, those could be intercepted.

**Prevention:**
1. Set `setInteractive(false)` on the Maguen David overlay, or simply do not call `setInteractive()` on it
2. Ensure the overlay's depth is below the skip hint text (depth 100 in `BaseCinematicScene`)
3. Use `setScrollFactor(0)` on all overlay elements to prevent camera effects from displacing them

**Detection (warning signs):**
- ENTER key does not skip the final intro screen
- The golden overlay appears in front of the "SUPERZION" title text

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Player sprite redesign (Fix #1) | **Pitfall 1** (fragmentation) + **Pitfall 5** (proportions) -- fixing SpriteGenerator.js without updating BombermanTextures, PortSwapTextures, ParadeTextures, and CinematicTextures leaves player inconsistent across scenes | Audit all 5 texture files first; design at game-scale; extract shared palette |
| Intro psytrance music (Fix #2) | **Pitfall 2** (node accumulation/clipping) + **Pitfall 11** (SFX timing drift) -- hundreds of Web Audio nodes + no compressor = clipping; Phaser timers vs audio clock = drift | Add DynamicsCompressorNode; reduce individual voice volumes; accept minor visual drift |
| Restore bosses and flags (Fix #3) | **Pitfall 4** (lost content) + **Pitfall 1** (fragmentation) -- texture generators exist but display code is missing; boss sprites may need new poses for the intro context | Audit ParadeTextures keys vs GameIntroScene display code; check act timing |
| Final intro screen (Fix #4) | **Pitfall 12** (interaction blocking) + **Pitfall 4** (lost content context) -- overlay must not block skip; must fit within 25s music structure | Set depth below skip hint; coordinate with act timing |
| Level 2 path blocked (Fix #5) | **Pitfall 8** (guard route misalignment) -- widening paths shifts containers but not guards/cameras | Find specific blocked path; adjust minimally; revalidate guard routes |
| F-15 wing orientation (Fix #6) | **Pitfall 6** (two F-15 sprites in different files) -- fixing the wrong one or only one of two | Identify which file and which scene has the issue before changing any coordinates |
| End-of-level screens (Fix #7) | **Pitfall 7** (heterogeneous scenes) + **Pitfall 3** (key listener leaks) -- 3 scenes use shared module, 3 have custom screens; all have potential key listener leaks | Integrate shared module into custom _showVictory() methods; add cleanup on scene shutdown |
| Controls overlay readability (Fix #8) | **Pitfall 9** (depth/contrast) -- yellow text on bright backgrounds may be unreadable; depth conflicts with EndScreen | Test all 6 levels; keep dark background behind text; maintain depth hierarchy |

---

## Sources

- [Phaser 3 Keyboard listeners remain active after scene change (Issue #3489)](https://github.com/phaserjs/phaser/issues/3489)
- [Phaser 3 Textures documentation](https://docs.phaser.io/phaser/concepts/textures)
- [Phaser 3 dynamic texture memory leak (Issue #6669)](https://github.com/phaserjs/phaser/issues/6669)
- [Multi scene "Texture key already in use"](https://phaser.discourse.group/t/multi-scene-texture-key-already-in-use/14344)
- [Web Audio API performance and debugging notes](https://padenot.github.io/web-audio-perf/)
- [Chromium Web Audio memory leak issues (Bug #576484)](https://bugs.chromium.org/p/chromium/issues/detail?id=576484)
- [Web Audio API - AudioNode stop/disconnect memory (Issue #904)](https://github.com/WebAudio/web-audio-api/issues/904)
- [MDN Web Audio API documentation](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [How I optimized my Phaser 3 action game in 2025](https://franzeus.medium.com/how-i-optimized-my-phaser-3-action-game-in-2025-5a648753f62b)
- Codebase inspection: `SpriteGenerator.js` (572 lines, 0 imports), `IntroMusic.js` (945 lines), `EndScreen.js`, `ControlsOverlay.js`, `GameIntroScene.js`, `BomberTextures.js`, `ParadeTextures.js`, `CinematicTextures.js`, `PortSwapScene.js`, `DroneScene.js`, `B2BomberScene.js`, `BossScene.js`
