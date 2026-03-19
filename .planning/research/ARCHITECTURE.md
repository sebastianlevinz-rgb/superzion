# Architecture Patterns — 8-Fix Polish Integration Map

**Domain:** Phaser 3 game polish pass (procedural textures/audio, 6-level stealth game)
**Researched:** 2026-03-19
**Confidence:** HIGH (based on full source code audit of all affected files)

---

## Existing Architecture Overview

```
main.js
  |-- BootScene (loading)
  |-- GameIntroScene (psytrance 3-act cinematic, extends BaseCinematicScene)
  |-- MenuScene (level select, cliff hero sprite)
  |-- 6x IntroCinematicScenes (per-level, BaseCinematicScene subclasses)
  |-- 6x GameScenes:
  |     L1: GameScene (top-down bomberman, BombermanPlayer, bombs, guards)
  |     L2: PortSwapScene (top-down stealth, containers, suspicion)
  |     L3: BomberScene (side-scroll F-15, bombing runs)
  |     L4: DroneScene (front-facing drone boss fight)
  |     L5: B2BomberScene (side-scroll B-2 night bombing)
  |     L6: BossScene (side-scroll approach + boss fight)
  |-- ExplosionCinematicScene (L1 victory cinematic)
  |-- VictoryScene / CreditsScene
  |
  |-- Systems:
  |     MusicManager (procedural trance, Web Audio API, singleton)
  |     SoundManager (procedural SFX, singleton)
  |     IntroMusic (dedicated psytrance for GameIntroScene)
  |     DifficultyManager (normal/hard toggle)
  |     EndgameManager (L1 plant-and-escape sequence)
  |
  |-- Entities:
  |     Player (BombermanPlayer, L1 only, top-down)
  |     Guard (BombermanGuard, L1 only)
  |     Bomb (L1 only)
  |     Obstacle (collision objects)
  |
  |-- UI:
  |     HUD (L1 HUD, health/status)
  |     EndScreen (reusable victory/defeat overlays)
  |     ControlsOverlay (reusable controls display)
  |
  |-- Utils (procedural texture generators):
  |     SpriteGenerator (SuperZion player sprite, 128x128 frames)
  |     CinematicTextures (cin_superzion for cinematics, panoramas)
  |     ParadeTextures (parade_superzion, flags, boss parade sprites)
  |     BombermanTextures (L1 tiles, player top-down sprites)
  |     PortSwapTextures (L2 containers, port elements)
  |     BomberTextures (L3 F-15, carrier, terrain)
  |     DroneTextures (L4 drone, tunnel, room)
  |     B2Textures (L5 B-2 bomber, night terrain)
  |     BossTextures (L6 player fighter, bunker fortress)
  |     RadarTextures, TowerDefenseTextures, PlatformerTextures (other)
```

---

## Fix-by-Fix Integration Map

### Fix 1: Player Sprite Redesign (Mossad Agent)

**Goal:** Replace cube/rectangle player sprites with organic human proportions across ALL scenes.

**Files directly modified:**

| File | What changes | Risk |
|------|-------------|------|
| `SpriteGenerator.js` (573 lines) | Already redesigned -- detailed Mossad agent with tactical suit, slicked-back hair, Star of David, articulated limbs, 1px outline. Generates `superzion` spritesheet with idle, run, jump, fall, shoot frames. | LOW -- self-contained, already done |
| `CinematicTextures.js` | `createSuperZionCinematic()` draws `cin_superzion` (128x192 static portrait). Must match SpriteGenerator visual identity. Has its own `PAL` palette and separate drawing code. | MEDIUM -- independent drawing code, visual consistency risk |
| `ParadeTextures.js` (~1100 lines) | Contains `parade_superzion` used in GameIntroScene Act 3. Has its own separate SuperZion drawing code. | MEDIUM -- third independent drawing implementation |

**Files that CONSUME these textures (verify they still work):**

| Consumer | Texture key used | Notes |
|----------|-----------------|-------|
| `ExplosionCinematicScene.js` | `superzion` (frame 1) | Direct sprite reference at line 122. Only cinematic using the gameplay spritesheet. |
| `GameIntroScene.js` (Act 3) | `parade_superzion` | Hero walks in from right, scaled 2.0x |
| `IntroCinematicScene.js` | `cin_superzion` | Hero in Act 3, scaled 1.8x |
| `BeirutIntroCinematicScene.js` | `cin_superzion` | Hero appearance, scaled 1.6x |
| `DeepStrikeIntroCinematicScene.js` | `cin_superzion` | Hero appearance, scaled 0.9x |
| `UndergroundIntroCinematicScene.js` | `cin_superzion` | Hero appearance, scaled 1.2x |
| `MountainBreakerIntroCinematicScene.js` | `cin_superzion` | Hero appearance, scaled 0.6x |
| `LastStandCinematicScene.js` | `cin_superzion` | Hero appearance, scaled 2.0x |
| `MenuScene.js` | `cin_superzion_cliff` | Separate cliff texture from CinematicTextures |

**Critical insight -- THREE independent SuperZion sprite systems:**

1. **`SpriteGenerator.js`** produces `superzion` spritesheet (128x128 gameplay frames). Used by gameplay + ExplosionCinematicScene.
2. **`CinematicTextures.js`** produces `cin_superzion` (128x192 static portrait). Used by 6 cinematic intros + MenuScene.
3. **`ParadeTextures.js`** produces `parade_superzion` (parade-sized sprite). Used by GameIntroScene Act 3 only.

All three must share the same visual identity (tactical suit, slicked-back hair, Star of David) or the character looks different across scenes.

**Also note:** L1 (GameScene) uses `BombermanTextures.js` for top-down `bm_player_*` sprites. These are a SEPARATE sprite system entirely (top-down perspective). The player redesign question is whether to also update these for consistency -- but top-down sprites are inherently different from side-view.

---

### Fix 2: Psytrance Intro Music + SFX

**Goal:** 145+ BPM psytrance from frame 1 with synchronized SFX (missile whoosh, explosions, jet doppler, gunshots) and screen shake on explosions.

**Files directly modified:**

| File | What changes | Risk |
|------|-------------|------|
| `IntroMusic.js` (945 lines) | Already implemented. 3-act psytrance at 145 BPM with acid bass, psy leads, impact booms, crash cymbals. **Exports standalone SFX functions** that are NOT currently called. | LOW -- music system is working |
| `GameIntroScene.js` (818 lines) | Currently uses generic `SoundManager.get().playExplosion()` for ALL SFX. Must wire up IntroMusic's exported SFX instead. | MEDIUM -- many timed callbacks to update |

**The gap:** IntroMusic exports these SFX functions (lines 700-945):

| Exported function | Purpose | Currently used? |
|-------------------|---------|-----------------|
| `playMissileWhoosh(ctx, gainNode, t)` | Ascending sweep + noise for missiles | NO |
| `playJetFlyby(ctx, gainNode, t)` | Doppler sine sweep for jets | NO |
| `playTankRumble(ctx, gainNode, t, dur)` | Low brown noise rumble | NO |
| `playMarchSteps(ctx, gainNode, t, count, interval)` | Rhythmic march stomps | NO |
| `playWindAmbient(ctx, gainNode, t, dur)` | Filtered noise wind | NO |

GameIntroScene should call these at visual event moments instead of the generic `SoundManager.playExplosion()`.

---

### Fix 3: Restore Intro Bosses and Flags

**Goal:** Replace rectangle silhouettes in GameIntroScene with real boss sprites. Add waving flag animations.

**Files directly modified:**

| File | What changes | Risk |
|------|-------------|------|
| `GameIntroScene.js` | `_bossFlashEntry()` (lines 472-509) draws bosses as rectangles + circles. Must replace with real sprites from ParadeTextures. | MEDIUM -- method rewrite |
| `ParadeTextures.js` | Already has all needed textures. `generateAllParadeTextures()` creates: `parade_foambeard`, `parade_turboturban`, `parade_warden`, `parade_supremeturban`, flag textures `parade_flag_iran`, `parade_flag_lebanon`, `parade_flag_palestine`, `parade_flag_israel`. | LOW -- textures exist, no changes needed |

**Integration detail:**

- `GameIntroScene.create()` already calls `generateAllParadeTextures(this)` -- all parade textures ARE generated and available
- But `_bossFlashEntry()` ignores them and draws raw graphics (rectangle body, circle head, red dot eyes)
- Fix: replace graphics drawing with `this.add.sprite(x, y, 'parade_foambeard')` etc.
- Flags: add waving flag sprites to Act 1 next to each boss. The waving animation system already exists in ParadeTextures (`wavingSheet()` creates 4-frame spritesheets with `key + '_wave'` animation).
- Boss appearance mapping: Boss 1 (Iran/1.5s) = Foam Beard, Boss 2 (Lebanon/3.5s) = Turbo Turban, Boss 3 (Gaza/5.5s) = The Warden. Supreme Turban is the final boss but does not appear in Act 1.

---

### Fix 4: Final Intro Screen (Giant Maguen David)

**Goal:** In GameIntroScene Act 3 finale, show giant golden semi-transparent Star of David behind SuperZion, arcade-retro font for "SUPERZION", larger subtitle.

**Files directly modified:**

| File | What changes | Risk |
|------|-------------|------|
| `GameIntroScene.js` | Modify `_startAct3()` (lines 268-464). The title reveal at ~5s (lines 385-416) needs: (1) giant Star of David drawn behind hero, (2) arcade-style font styling, (3) bigger subtitle. | LOW -- additive changes to existing timed events |

**No new files needed.** Star of David drawing already exists in:
- `SpriteGenerator.js` line 70: `drawStar(ctx, cx, cy, r)` -- canvas-based
- `ParadeTextures.js` line 36: `starOfDavid(ctx, cx, cy, r, color, fill)` -- canvas-based

For this fix, use Phaser Graphics API to draw the star directly in the scene (no canvas needed). Or generate a texture using the existing helper.

**Font approach:** Phaser 3 uses CSS fonts. Currently `monospace` everywhere. For arcade feel: large bold monospace with heavy text shadow/glow, potentially increased letter spacing via `letterSpacing` style property. No external fonts (per project constraints -- everything procedural).

---

### Fix 5: Level 2 Container Pathfinding

**Goal:** Wider passageways in PortSwapScene so the level is completable.

**Files directly modified:**

| File | What changes | Risk |
|------|-------------|------|
| `PortSwapScene.js` (~1550 lines) | Container spacing constants at lines 63-65. Currently: `CONT_ROW_SPACING = 48`, `CONT_COL_SPACING = 72`. Previously widened from 34 and 60. Container body is 40x18, player body is 14x14. | LOW -- numeric constants |

**Current clearance math:**
- Vertical: 48(spacing) - 18(container height) = 30px gap. Player body is 14px. Clearance = 16px. Should be passable.
- Horizontal: 72(spacing) - 40(container width) = 32px gap. Player body is 14px. Clearance = 18px. Should be passable.

**If containers are still blocked, the real issue may be:**
- Wall/building physics bodies overlapping container paths (check wall placement code in PortSwapScene)
- Guard patrol routes creating impassable choke points at narrow sections
- Crane/forklift sprites having physics bodies that block paths
- Container physics body being larger than the visual sprite

**Testing strategy:** Must playtest after changes. Verify all three container zones (north, south, east) are reachable and the escape route to the starting point is clear.

---

### Fix 6: F-15 Reversed Wings

**Goal:** Correct F-15 wing sweep direction so wings point backward (toward tail), not forward.

**Files to investigate (multiple F-15 implementations):**

| File | What it draws | Risk |
|------|--------------|------|
| `BomberTextures.js` (lines 101-120) | `createF15SideSprite()` -- gameplay Level 3 sprite (64x32). Wings use Path2D geometry. | LOW -- geometry changes |
| `CinematicTextures.js` | `createF15Hangar()` -- Level 3 intro cinematic F-15 | MEDIUM -- separate drawing code |
| `GameIntroScene.js` (lines 584-618) | `_spawnJetStrike()` -- GameIntro Act 2 inline graphics using raw fillTriangle/fillRect | LOW -- inline geometry |

**Current BomberTextures wing geometry (jet faces RIGHT, nose at x=61):**
```
Upper wing: (36, cy-5) -> (24, cy-14) -> (16, cy-13) -> (26, cy-5)
Lower wing: (36, cy+4) -> (24, cy+14) -> (16, cy+13) -> (26, cy+4)
```
Wing tips are at x=16-24, body attachment at x=26-36. Since nose is at x=61 (right), the tips sweeping left (toward x=16) IS backward sweep. This appears geometrically correct. The visual issue may be in CinematicTextures or GameIntroScene instead.

**GameIntroScene jet wings (lines 592-593):**
```javascript
jet.fillTriangle(10, -3, 25, -16, 30, -3);  // upper
jet.fillTriangle(10, 3, 25, 16, 30, 3);      // lower
```
Wing tips at x=25 extend from body center (~x=20), with root at x=10-30. Since this jet moves left-to-right (starts at x=-60, ends at x=W+80), nose is rightward. Tips at x=25 with root trailing at x=10 means wings sweep... this needs visual verification on which implementation looks wrong.

---

### Fix 7: End-of-Level Screens

**Goal:** Standardize all 6 levels with consistent victory/defeat overlays. Victory = "PLAY AGAIN (R)" + "NEXT LEVEL (ENTER)". Defeat = "RETRY (R)" + "SKIP LEVEL (S)".

**Current end screen state by level:**

| Level | Victory implementation | Defeat implementation | Uses EndScreen.js? |
|-------|----------------------|----------------------|-------------------|
| L1 GameScene | Goes to ExplosionCinematicScene (separate scene with embedded victory UI) | `showDefeatScreen()` | Defeat only |
| L2 PortSwapScene | `showVictoryScreen()` | `showDefeatScreen()` | YES, both |
| L3 BomberScene | `showVictoryScreen()` | `showDefeatScreen()` | YES, both |
| L4 DroneScene | Custom inline, ~120 lines (`_showVictory()` at line 3171) | Custom inline within same method | NO |
| L5 B2BomberScene | Custom inline, ~130 lines (at line 1440) | Custom inline within same code block | NO |
| L6 BossScene | Custom inline victory (lines 2340-2413) | Custom inline defeat (lines 2096-2153) | NO |

**Files directly modified:**

| File | What changes | Risk |
|------|-------------|------|
| `EndScreen.js` (222 lines) | May need minor enhancements for stats/stars compatibility. Currently supports `title`, `stats[]`, `stars`, `currentScene`, `nextScene`/`skipScene`. | LOW -- clean utility |
| `ExplosionCinematicScene.js` | Has embedded victory screen (line 490+). Should use `showVictoryScreen()` or keep as cinematic but ensure proper R/ENTER navigation. | MEDIUM -- must preserve cinematic flow |
| `DroneScene.js` (~3250 lines) | Replace custom `_showVictory()` with `showVictoryScreen()`/`showDefeatScreen()` calls. Preserve stats/stars logic. | MEDIUM -- large file |
| `B2BomberScene.js` (~1500 lines) | Replace custom victory/defeat with EndScreen calls. Preserve stats/stars logic. | MEDIUM -- large file |
| `BossScene.js` (~2440 lines) | Replace custom victory (lines 2340-2413) and defeat (lines 2096-2153) with EndScreen calls. | MEDIUM -- largest file |

**Scene flow mapping (needed for nextScene/skipScene params):**

| Level | currentScene | nextScene (victory) | skipScene (defeat) |
|-------|-------------|--------------------|--------------------|
| L1 | GameScene | BeirutIntroCinematicScene | BeirutIntroCinematicScene |
| L2 | PortSwapScene | DeepStrikeIntroCinematicScene | DeepStrikeIntroCinematicScene |
| L3 | BomberScene | UndergroundIntroCinematicScene | UndergroundIntroCinematicScene |
| L4 | DroneScene | MountainBreakerIntroCinematicScene | MountainBreakerIntroCinematicScene |
| L5 | B2BomberScene | LastStandCinematicScene | LastStandCinematicScene |
| L6 | BossScene | VictoryScene | VictoryScene |

**L1 special case:** Currently victory goes through ExplosionCinematicScene (explosion cinematic -> embedded victory). The fix should either: (a) keep the explosion cinematic and add EndScreen-style navigation at its end, or (b) add EndScreen overlay directly in GameScene on escape success and make the explosion cinematic optional. Option (a) is lower risk.

**EndScreen.js already supports the exact button pattern** specified in PROJECT.md. The custom implementations in L4-L6 manually recreate the same layout with the same labels.

---

### Fix 8: Controls Overlay Readability

**Goal:** Black semi-transparent background with bright yellow text in all 6 levels.

**Current state -- all 6 levels already use ControlsOverlay:**

| Level | Call location | Controls text |
|-------|-------------|--------------|
| L1 GameScene | line 99 | `'ARROWS/WASD: Move \| SPACE: Bomb \| E: Plant \| ESC: Pause'` |
| L2 PortSwapScene | line 179 | `'WASD/ARROWS: Move \| SHIFT: Sprint \| SPACE: Scan \| E: Interact \| Q: Distract'` |
| L3 BomberScene | line 65 | `'ARROWS: Fly \| SPACE: Drop Bomb \| C: Chaff \| M: Mute'` |
| L4 DroneScene | line 1141 | `'ARROWS: Move \| SPACE: Shoot \| X: Missile \| ESC: Pause'` |
| L5 B2BomberScene | line 57 | `'ARROWS: Fly \| SPACE: Drop Bomb \| C: Chaff \| ESC: Pause'` |
| L6 BossScene | line 55 | `'ARROWS: Move \| SPACE: Shoot \| X: Heavy Bomb \| SHIFT: Roll \| C: Pulse'` |

**File directly modified:**

| File | What changes | Risk |
|------|-------------|------|
| `ControlsOverlay.js` (107 lines) | Currently: big overlay uses `#FFD700` (gold) 18px bold, bar uses `#ffffff` 13px bold. Changes needed: (1) bar text color `#ffffff` -> `#FFD700`, (2) increase font sizes (big: 18->22px, bar: 13->15px), (3) verify background opacity is sufficient. | LOW -- tiny isolated file |

**ControlsOverlay already has the right structure.** The fix is purely cosmetic parameter changes.

---

## Integration Points Between Fixes

### Cross-Fix Dependencies

```
Fix 1 (Sprites) --------> Fix 3 (Boss Restoration)
   |                         ParadeTextures boss sprites should
   |                         share the redesigned art style
   |
   +---------------------> Fix 4 (Final Intro Screen)
                              parade_superzion in Act 3 must be
                              the redesigned Mossad agent

Fix 2 (Psytrance SFX) --> Fix 3 (Boss Restoration)
   |                         SFX timing must sync with boss
   |                         appearances (impact booms already
   |                         scheduled at 1.5s, 3.5s, 5.5s)
   |
   +---------------------> Fix 4 (Final Intro Screen)
                              Music climax at 5s syncs with
                              title reveal -- no conflict

Fix 7 (End Screens) ----> Fix 8 (Controls Overlay)
                              Both are UI overlays but use
                              non-conflicting depth layers:
                              Controls: depth 90-101
                              EndScreen: depth 500-502
```

### GameIntroScene.js is the Convergence Point

Three fixes (2, 3, 4) all modify `GameIntroScene.js`. They must be serialized:

| Order | Fix | What it changes in GameIntroScene |
|-------|-----|----------------------------------|
| First | Fix 3 | `_bossFlashEntry()` method rewrite (Act 1), add flag sprites |
| Second | Fix 4 | `_startAct3()` title reveal section modification |
| Third | Fix 2 | SFX wiring throughout all three acts |

**Rationale:** Fix 3 changes Act 1 visuals (boss sprites), Fix 4 changes Act 3 visuals (title screen), Fix 2 touches all acts (SFX sync). Doing visual changes first, then audio overlay, avoids conflicts.

### Shared Texture Keys

| Texture key | Generated by | Consumed by | Which fix affects it |
|-------------|-------------|-------------|---------------------|
| `superzion` | SpriteGenerator | ExplosionCinematic | Fix 1 |
| `cin_superzion` | CinematicTextures | 6 cinematics + MenuScene | Fix 1 |
| `parade_superzion` | ParadeTextures | GameIntroScene Act 3 | Fix 1 |
| `parade_foambeard` etc. | ParadeTextures | Should be GameIntroScene (currently unused) | Fix 3 |
| `parade_flag_*` | ParadeTextures | Should be GameIntroScene (currently unused) | Fix 3 |
| `f15_side` | BomberTextures | BomberScene (gameplay) | Fix 6 |

---

## Recommended Build Order

### Phase 1: Quick Standalone Wins (no cross-dependencies)

**1a. Controls Overlay Fix (Fix 8)** -- ~15 min
- Only touches `ControlsOverlay.js` (107 lines)
- Pure cosmetic: color and size constant changes
- Zero risk, immediate visual improvement

**1b. Level 2 Container Paths (Fix 5)** -- ~30 min
- Isolated to `PortSwapScene.js` container spacing constants
- May need playtesting, but no architectural changes
- Independent of all other fixes

**1c. F-15 Wing Fix (Fix 6)** -- ~30 min
- Isolated to `BomberTextures.js` and/or `CinematicTextures.js` and/or `GameIntroScene.js`
- First: visually verify which of the 3 implementations has the bug
- Pure geometry coordinate changes

### Phase 2: Sprite Visual Consistency (prerequisite for Phase 3)

**2a. Player Sprite Consistency (Fix 1)** -- ~1-2 hours
- SpriteGenerator already redesigned (verify)
- Audit `CinematicTextures.createSuperZionCinematic()` and `ParadeTextures` parade_superzion drawing
- Update if visual identity does not match across the three systems
- Must complete before Fix 3 and Fix 4

### Phase 3: Intro Scene Overhaul (depends on Phase 2, serialize within)

**3a. Boss and Flag Restoration (Fix 3)** -- ~1-2 hours
- Rewrite `GameIntroScene._bossFlashEntry()` to use real sprites
- Add flag sprites with existing waving animation system
- Depends on Phase 2 for consistent ParadeTextures sprites

**3b. Final Intro Screen (Fix 4)** -- ~1 hour
- Modify `GameIntroScene._startAct3()` title reveal section
- Add giant Star of David graphic, arcade font styling, larger subtitle
- Depends on Phase 2 for parade_superzion visual quality

**3c. Psytrance SFX Sync (Fix 2)** -- ~1-2 hours
- Wire IntroMusic exported SFX functions to GameIntroScene visual events
- Replace generic `SoundManager.playExplosion()` with specific SFX
- Must be last to touch GameIntroScene to avoid conflicts with 3a/3b

### Phase 4: End Screen Standardization (independent of Phase 2-3)

**4a. End Screen Migration (Fix 7)** -- ~2-3 hours
- Can run in parallel with Phase 2-3 (different files)
- Migrate L4 DroneScene, L5 B2BomberScene, L6 BossScene to EndScreen.js
- Update L1 ExplosionCinematicScene for proper navigation
- Verify L2 PortSwapScene and L3 BomberScene work correctly (already using EndScreen.js)

### Dependency Graph

```
Phase 1 (standalone):
  Fix 8 (Controls)     -- standalone, do first
  Fix 5 (Level 2)      -- standalone
  Fix 6 (F-15)         -- standalone

Phase 2 (prerequisite):
  Fix 1 (Sprites)      -- prerequisite for Phase 3

Phase 3 (serialize, all touch GameIntroScene.js):
  Fix 3 (Bosses)       -- after Fix 1, first to touch GameIntroScene
  Fix 4 (Intro Screen) -- after Fix 1, second to touch GameIntroScene
  Fix 2 (Psytrance)    -- last to touch GameIntroScene

Phase 4 (parallel with Phase 2-3):
  Fix 7 (End Screens)  -- touches different files entirely
```

---

## Risk Areas

### High Risk: Large Scene Files

| File | Lines | Fixes that touch it |
|------|-------|-------------------|
| `DroneScene.js` | ~3250 | Fix 7 |
| `BossScene.js` | ~2440 | Fix 7 |
| `BomberScene.js` | ~1760 | Fix 7 |
| `B2BomberScene.js` | ~1500 | Fix 7 |
| `GameIntroScene.js` | ~818 | Fix 2, Fix 3, Fix 4 (**three fixes**) |

**GameIntroScene.js is the convergence point.** Three fixes modify this single file. They must be serialized and each committed before the next begins.

**Large scene files for Fix 7:** The end screen migration touches 4 files with 1500-3250 lines each. However, the changes are localized: replacing ~100-130 lines of custom victory/defeat UI with 5-10 lines calling EndScreen functions. Risk is moderate -- the replacement is straightforward but requires careful mapping of custom stats/stars logic into EndScreen opts.

### Medium Risk: Triple Sprite System Consistency

Three separate codebases draw SuperZion independently:
- `SpriteGenerator.js`: 573 lines, detailed body-part functions
- `CinematicTextures.js`: separate 128x192 drawing
- `ParadeTextures.js`: separate parade-sized drawing

After Fix 1, if CinematicTextures or ParadeTextures are not updated to match, the character will look different across scenes. Visual audit across all three is mandatory.

### Low Risk: UI Module Independence

`EndScreen.js` (depth 500-502) and `ControlsOverlay.js` (depth 90-101) are clean utility modules with no shared state and non-conflicting depth layers. Changes to either are isolated.

---

## Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| `SpriteGenerator` | Gameplay player spritesheet (128x128 frames) | BootScene/gameplay scenes (texture generation on demand) |
| `CinematicTextures` | Static hero portraits + level panoramas | 6 intro cinematics + MenuScene |
| `ParadeTextures` | Parade sprites (hero, bosses, flags, soldiers) | GameIntroScene only |
| `IntroMusic` | Psytrance music + standalone SFX functions | GameIntroScene (music), SFX functions not yet wired |
| `EndScreen` | Reusable victory/defeat overlay | L2, L3 (currently); L1, L4, L5, L6 (after Fix 7) |
| `ControlsOverlay` | Reusable controls display (big overlay -> bar) | All 6 game scenes |
| `BaseCinematicScene` | Act system, skip/mute, typewriter, transitions | 7 cinematic scenes (6 intros + GameIntro) |
| `MusicManager` | Procedural music generation + fade/crossfade | Every scene (singleton) |
| `SoundManager` | Procedural SFX generation | Every scene (singleton) |

---

## Key Data Flows

### Intro Sequence Flow (Fixes 2, 3, 4 affect this)

```
BootScene -> GameIntroScene.create()
  -> generateAllParadeTextures(this)   // creates parade_* textures
  -> new IntroMusic().start()           // starts 25s psytrance
  -> _startAct1()                       // (0-8s)
     -> _bossFlashEntry() x3            // FIX 3: use real sprites + flags
     -> _spawnMissile() loop            // FIX 2: wire missile whoosh SFX
  -> _startAct2()                       // (8-16s)
     -> _spawnJetStrike()               // FIX 2: wire jet flyby SFX
     -> _spawnBomber()                  // FIX 2: wire specific SFX
     -> _spawnIronDomeSequence()
     -> _spawnTankFiring()              // FIX 2: wire tank rumble SFX
  -> _startAct3()                       // (16-25s)
     -> hero walks in (parade_superzion) // FIX 1: must look correct
     -> title "SUPERZION" impact        // FIX 4: giant star, arcade font
  -> MenuScene
```

### Level Completion Flow (Fix 7 affects this)

```
GameScene (L1) -> player death -> _gameOverScreen()
  -> showDefeatScreen(scene, {currentScene: 'GameScene', skipScene: ...})
  -> R: restart | S: skip

GameScene (L1) -> escape success -> scene.start('ExplosionCinematicScene')
  -> 5-phase explosion cinematic -> embedded victory -> R: replay | ENTER: next

PortSwapScene (L2) / BomberScene (L3) -> built-in endgame
  -> showVictoryScreen() / showDefeatScreen()  [already using EndScreen.js]

DroneScene (L4) / B2BomberScene (L5) / BossScene (L6) -> built-in endgame
  -> custom inline victory/defeat UI  [FIX 7: migrate to EndScreen.js]
```

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Duplicating End Screen Logic
**What:** L4, L5, L6 each implement 100+ lines of custom victory/defeat UI instead of using EndScreen.js.
**Why bad:** Inconsistent styling, duplicated button logic, harder to maintain. Any future change (e.g., adding a "MENU" button) requires 4+ edits.
**Instead:** Migrate all to EndScreen.js. Extend EndScreen opts if needed for custom stats display.

### Anti-Pattern 2: Multiple Independent Character Drawing Systems
**What:** Three files draw SuperZion with separate, independent code (SpriteGenerator, CinematicTextures, ParadeTextures).
**Why bad:** Visual inconsistency when one is updated and others lag behind.
**Instead:** At minimum, verify visual consistency after any sprite changes. Ideally share a palette constant module.

### Anti-Pattern 3: Inline Graphics for Reusable Sprites
**What:** GameIntroScene._bossFlashEntry() draws bosses with raw graphics (rectangles, circles) instead of using the pre-generated ParadeTextures sprites that already exist.
**Why bad:** Low visual quality, impossible to animate, textures generated but wasted.
**Instead:** Use `this.add.sprite(x, y, 'parade_foambeard')` with the textures that `generateAllParadeTextures()` already created in `create()`.

---

## Sources

- Direct source code analysis of all files in `superzion/src/` (full audit)
- `SpriteGenerator.js`: 573 lines -- verified redesigned Mossad agent sprite
- `GameIntroScene.js`: 818 lines -- 3-act cinematic, inline boss graphics at line 472
- `EndScreen.js`: 222 lines -- clean reusable victory/defeat module
- `ControlsOverlay.js`: 107 lines -- two-phase controls display
- `IntroMusic.js`: 945 lines (699 class + 246 exported SFX functions, none wired)
- `ParadeTextures.js`: ~1100 lines -- full parade sprite and flag system
- `BomberTextures.js`: F-15 wing geometry at lines 101-120
- `PortSwapScene.js`: Container spacing constants at lines 63-65
- `BaseCinematicScene.js`: 142 lines -- act system, skip, typewriter
- All 6 game scenes and 6 intro cinematic scenes audited for texture consumption
- All confidence levels HIGH (direct source code inspection)
