# Feature Landscape: v1.1 Polish Pass

**Domain:** Phaser 3 stealth side-scroller -- targeted polish of 8 specific visual, audio, gameplay, and UX issues
**Researched:** 2026-03-19
**Overall confidence:** HIGH (scope is well-defined, codebase fully analyzed, patterns well-established)
**Milestone scope:** Fix 8 discrete issues in an existing 6-level procedurally-generated game. No new gameplay, no new levels.

---

## Table Stakes

Features where absence is immediately noticeable. Players perceive these as bugs, not missing features.

| # | Feature | Why Expected | Complexity | Notes |
|---|---------|--------------|------------|-------|
| 7 | **End-of-level screens on all 6 levels** | Levels that end without clear outcome feedback feel broken. Players don't know if they won, lost, or glitched. Currently only 3 of 6 levels (GameScene, BomberScene, PortSwapScene) use `EndScreen.js`. DroneScene, B2BomberScene, and BossScene have inline victory/defeat text without proper "RETRY/NEXT LEVEL" prompts. | Low | `EndScreen.js` already exists with `showVictoryScreen()` and `showDefeatScreen()` -- simply integrate into the 3 remaining scenes. Wire `currentScene`, `nextScene`, and `skipScene` parameters correctly. Each integration is ~15 lines. |
| 8 | **Controls overlay readability** | If players can't read the controls, they can't play. White text on bright backgrounds disappears. The current `ControlsOverlay.js` uses `#FFD700` (gold) for the big overlay and `#ffffff` for the persistent bar -- but the bar is 13px monospace on a 70% opacity black background, which is borderline readable at 960x540. | Low | Already implemented as a reusable module used by all 6 levels. Needs: larger persistent bar text (14-15px), brighter text color on bar, slightly more opaque background (0.8 instead of 0.7). WCAG 4.5:1 contrast ratio target for standard text. |
| 5 | **Level 2 container path completability** | A level that cannot be completed is a shipping blocker, not a polish item. If corridors are too narrow for the player physics body to pass through, the game is broken at level 2. | Low | Widen corridor tiles in the PortSwapScene level generation. Verify pathfinding from spawn to objective. This is a level data fix, not a code architecture change. |
| 6 | **Level 3 F-15 swept-back wings** | An F-15 with forward-swept wings looks like a different aircraft entirely. Players with any aviation awareness (common in military-themed games) will notice immediately. The procedural drawing in the cinematic currently has wing triangles pointing forward. | Low | Fix the triangle vertices in the F-15 drawing function inside `DeepStrikeIntroCinematicScene` or its texture utility. Swap the x-coordinates of the wing tip vertices so they point backward relative to the nose. ~5 lines changed. |
| 1 | **Player sprite with human proportions** | The player character is the thing you look at most. A sprite that reads as "placeholder rectangles" immediately signals "unfinished game." The current `SpriteGenerator.js` already draws a detailed Mossad agent (461 lines of procedural canvas drawing), but proportions and silhouette readability at game scale matter. | Medium | The sprite generator already renders head, torso, arms, legs, boots, tactical vest, Star of David, stubble, etc. on a 128x128 canvas. The issue is whether proportions read correctly at the rendered game scale (typically 32-48px high in-game). Need to verify the head-to-body ratio works at final display size -- a 6-head model (stocky/heroic) reads better than 8-head (elongated/realistic) at small pixel sizes. Key: the sprite must be recognizable as a person at 32px tall. |

### Proportions guidance for procedural sprites (research findings)

**Head-to-body ratio at small display sizes:**
- 8-head model (realistic adult): Requires 96+ pixels height to show all anatomy detail. At 32-48px rendered height, limbs become 1-2px wide and unreadable.
- 6-head model (heroic/stocky): The sweet spot for action game side-scrollers. Slightly exaggerated head allows facial features to register. Used by Castlevania, Mega Man X-class games.
- 4-head model (chibi/SD): Head dominates the sprite. Good for top-down (Stardew Valley zone) but too cartoonish for a military stealth game.

**Recommendation for SuperZion:** The current 128x128 canvas with ~90px character height gives approximately a 6.5-head ratio, which is good. The key improvements are: (a) ensure silhouette reads at all game scales, (b) 1px dark outline (already implemented via `applyOutline()`), (c) clear contrast between tactical suit and background.

**Confidence:** HIGH -- SLYNYRD pixel art anatomy guides, GameDev.net sprite proportion threads, and the existing sprite code all converge on the 6-head model for action side-scrollers.

---

## Table Stakes (continued) -- Audio & Visual Identity

| # | Feature | Why Expected | Complexity | Notes |
|---|---------|--------------|------------|-------|
| 2 | **Intro music from frame 1** | A game that starts in silence feels broken. The existing `GameIntroScene` already has `IntroMusic` (psytrance 145 BPM), but the question is whether it starts immediately enough and has proper SFX layering (missile whoosh, explosion boom, aircraft doppler, gunshots). | Medium | `IntroMusic.js` already schedules 3 acts across 25 seconds via Web Audio API. The music starts after `this._introMusic.start()` in `create()`. SFX sync needs: (a) schedule SFX calls to align with known beat positions (beat = 60/145 = ~0.414s), (b) screen shake on explosion beats. The key technique: since BPM is known (145), calculate beat times as `t0 + beatIndex * (60/145)` and schedule visual events to fire ~50ms BEFORE the beat (pre-trigger for visual buildup). |
| 3 | **Bosses in intro are recognizable characters, not rectangles** | The `_bossFlashEntry()` in `GameIntroScene` currently draws boss silhouettes as colored rectangles with circle heads and red dot eyes. This looks like placeholder art. The `IntroCinematicScene` has a proper `_drawBossPortrait()` with detailed Foam Beard rendering (glasses, beard, suit), but the intro showcase uses simplified shapes. | Medium | Either: (a) reuse the detailed boss portrait drawings from `IntroCinematicScene._drawBossPortrait()` style in `GameIntroScene._bossFlashEntry()`, or (b) generate proper boss textures via `ParadeTextures.js` (which already has infrastructure for `staticSprite()`). The bosses are Foam Beard, Turbo Turban, The Warden, Supreme Turban -- 4 unique character drawings. |

---

## Differentiators

Features that separate this game from "random browser game" territory. Not expected, but when present they create a "this is polished" impression.

| # | Feature | Value Proposition | Complexity | Notes |
|---|---------|-------------------|------------|-------|
| 4 | **Final intro screen: giant Magen David behind hero** | A strong title card with the game's symbol (Star of David) rendered large and semi-transparent behind the hero creates a cinematic "poster moment." This is the last image before the menu -- it sets the tone for the entire game. Games like Metal Slug, Contra, and Broforce all have iconic title poses. | Medium | Draw a large (200-300px) golden Star of David with 0.3-0.4 alpha behind the SuperZion hero sprite in Act 3 of `GameIntroScene`. Use the existing `starOfDavid()` helper from `ParadeTextures.js`. Add thick arcade-style font for "SUPERZION" (monospace bold, large size, with glow shadow). The current Act 3 already has the hero walking in and the title slamming -- this adds the background symbol. |
| 3b | **Waving flags in intro** | Animated flags (Iran, Lebanon, Palestine, Israel) establish the geopolitical setting instantly without text. The `ParadeTextures.js` already has `createIranFlag()` with a 4-frame waving animation spritesheet helper. Flags just need to be placed in the intro acts. | Low | `wavingSheet()` and the 4 flag creation functions already exist in `ParadeTextures.js`. They're imported in `GameIntroScene` via `generateAllParadeTextures()`. The flags were probably rendered in a prior version and lost in a refactor -- they just need to be placed as animated sprites in Act 1 (enemy flags) and Act 2 (Israel flag). |
| 2b | **SFX synchronized to beat drops** | When explosions, missile launches, and screen shakes align with the music's beat grid, the intro feels choreographed rather than random. This is the difference between "things happening with music playing" and "music-driven spectacle." | Medium | Since `IntroMusic.js` uses Web Audio API with known `ctx.currentTime` and 145 BPM, visual event scheduling can use `t0 + beatIndex * 0.414s`. Pre-trigger visuals by ~50ms for perceptual sync (research: triggering before the beat reads better than on-beat because animation prominence builds over frames). The screen shake timing in `GameIntroScene` already uses delays at `830ms` intervals (approximately 2 beats at 145 BPM), which is close but should be tightened to exact beat multiples. |
| 1b | **Sprite consistency across ALL scenes** | The player sprite should look the same everywhere -- gameplay, cinematics, menu, intro. Currently `SpriteGenerator.js` generates the gameplay sprite, `CinematicTextures.js` generates cinematic versions, and `ParadeTextures.js` generates the parade version. If these diverge, the player character has no consistent identity. | Medium | Audit all 3 sprite generators to ensure consistent proportions, colors, and features. The `SpriteGenerator.js` palette (PAL object) should be the canonical reference. Cinematic sprites can be larger/more detailed but must use the same color values and proportional structure. |

---

## Anti-Features

Things to deliberately NOT build during this polish pass. Each risks scope creep.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **New gameplay mechanics** | The milestone is "make existing things look/feel finished." Adding new controls, weapons, or enemy types is a different milestone entirely. | Fix the 8 listed issues only. Defer gameplay changes to a separate milestone. |
| **Per-level unique music themes** | Already explicitly deferred from v1.0. Would require MusicManager refactoring + 6 synthesizer patch configurations. High effort, not in the 8-issue list. | Keep existing procedural music. Only the intro music (IntroMusic.js, already written) gets attention. |
| **Motion smear animation** | Already explicitly deferred from v1.0. Requires extra canvas frames and careful timing. Not in the 8 issues. | Keep existing animation frames. The sprite redesign (issue #1) already covers proportion fixes. |
| **CinematicDirector/TextureRegistry infrastructure** | Already deferred from v1.0. Over-engineering for a polish pass. | Keep using direct scene code and existing BaseCinematicScene. |
| **External audio files** | Constraint: 100% procedural. No mp3/ogg/wav. | Continue using Web Audio API synthesis via IntroMusic.js, MusicManager.js, SoundManager.js. |
| **Accessibility features** | Important but explicitly out of scope per PROJECT.md. | Defer to dedicated accessibility pass. The controls overlay readability fix (#8) is the one accessibility-adjacent item in scope. |
| **Save/load system** | Not in the 8 issues. Not requested. | Defer. localStorage difficulty persistence already exists. |
| **Full boss AI overhaul** | Issue #3 is about restoring boss SPRITES in the intro, not changing boss gameplay behavior. | Only fix visual representation of bosses in intro cinematics. Do not touch BossScene.js combat logic. |
| **Complete SpriteGenerator rewrite** | The current 461-line SpriteGenerator already draws a detailed character. Issue #1 is about verifying proportions and consistency, not starting from scratch. | Adjust existing drawing code. Do not rewrite the sprite system. |
| **Font loading or custom web fonts** | The game uses monospace everywhere. Loading custom fonts adds complexity and potential FOIT/FOUT issues. | Use system monospace. For the "arcade" title text (issue #4), use monospace bold with large size and text-shadow glow -- this achieves the retro arcade look without custom font files. |

---

## Feature Dependencies

```
Issue 1: Sprite Redesign
  |-- Verify proportions at game-scale display sizes
  |-- Ensure PAL colors are consistent across:
  |     |-- SpriteGenerator.js (gameplay)
  |     |-- CinematicTextures.js (cutscenes)
  |     |-- ParadeTextures.js (intro showcase)
  |     '-- MenuScene.js (cliff hero)
  '-- Must land BEFORE issue 3 and 4 (bosses and final screen use hero sprite)

Issue 2: Intro Music + SFX
  |-- IntroMusic.js already exists and works
  |-- SFX sync requires calculating beat times from BPM
  |-- Screen shake timing in GameIntroScene needs alignment to beat grid
  '-- Independent of other issues (can be done in parallel)

Issue 3: Restore Bosses + Flags
  |-- Depends on: Issue 1 (sprite consistency principles)
  |-- Boss portraits: Can reuse IntroCinematicScene._drawBossPortrait() style
  |    OR generate via ParadeTextures.js staticSprite()
  |-- Flags: ParadeTextures.js already has createIranFlag(), wavingSheet(), etc.
  |-- Flag placement in GameIntroScene acts 1 and 2
  '-- Boss placement in GameIntroScene act 1

Issue 4: Final Intro Screen
  |-- Depends on: Issue 1 (hero sprite)
  |-- Depends on: Issue 3 (bosses visible in preceding acts)
  |-- Giant Star of David: Use ParadeTextures.js starOfDavid() helper
  |-- Arcade font: monospace bold, 56-64px, with glow shadow
  '-- Subtitle: larger size than current

Issue 5: Level 2 Container Path
  |-- Independent of all other issues
  |-- Requires: PortSwapScene level generation analysis
  '-- Verification: spawn-to-objective pathfinding test

Issue 6: F-15 Wing Fix
  |-- Independent of all other issues
  |-- Requires: Identify the triangle drawing call in the cinematic
  '-- Swap wing vertex x-coordinates

Issue 7: End Screens on All Levels
  |-- Independent of other issues
  |-- EndScreen.js already exists and works
  |-- Integrate into: DroneScene, B2BomberScene, BossScene
  |-- Each needs: currentScene, nextScene/skipScene mappings
  '-- BossScene special case: last level -> VictoryScene instead of next level

Issue 8: Controls Overlay Readability
  |-- Independent of other issues
  |-- ControlsOverlay.js already exists
  |-- Changes: font size, opacity, color values
  '-- Verify across all 6 levels (each passes different controlsText)
```

### Parallel execution groups

These issues have no dependencies on each other and can be worked in parallel:

**Group A (independent fixes):** Issues 5, 6, 8
**Group B (intro sequence):** Issues 2, 3, 4 (sequential within group: 2 before 3 before 4)
**Group C (sprite + screens):** Issues 1, 7 (1 first for consistency, then 7)

---

## Complexity Assessment

| Issue | Complexity | Estimated Scope | Risk |
|-------|-----------|----------------|------|
| 1. Sprite redesign | Medium | Verify proportions, adjust if needed, audit 4 files for palette consistency | LOW -- sprite already detailed; mostly verification |
| 2. Intro music + SFX sync | Medium | Calculate beat times, schedule SFX calls, tighten screen shake timing | LOW -- IntroMusic.js exists, math is straightforward |
| 3. Restore bosses + flags | Medium | Draw 4 boss characters, place 4 flags, integrate into GameIntroScene acts | MEDIUM -- 4 unique character drawings is the bulk of work |
| 4. Final intro screen | Medium | Giant Star of David, arcade title, larger subtitle | LOW -- compositing existing elements |
| 5. Level 2 path fix | Low | Widen corridors in level generation | LOW -- data change |
| 6. F-15 wings | Low | Swap triangle vertices | VERY LOW -- 5 lines |
| 7. End screens | Low | Import and call EndScreen.js in 3 scenes | LOW -- pattern established in 3 other scenes |
| 8. Controls readability | Low | CSS-level changes to font size and opacity | VERY LOW -- 3-4 values changed |

---

## MVP Recommendation

**Must-ship (blocking):**
1. **Issue 5: Level 2 path** -- A broken level is a shipping blocker. Fix first.
2. **Issue 7: End screens on all levels** -- Players stuck at "victory text with no way out" is a UX bug.
3. **Issue 6: F-15 wings** -- Trivial fix, immediate visual correctness.
4. **Issue 8: Controls readability** -- Players who can't read controls can't play.

**Should-ship (high impact):**
5. **Issue 1: Sprite consistency** -- Verify proportions, fix palette divergences.
6. **Issue 3: Restore bosses + flags** -- Brings the intro from "placeholder" to "finished."
7. **Issue 4: Final intro screen** -- The poster moment that makes first impressions.

**Nice-to-have (polish on polish):**
8. **Issue 2: SFX beat sync** -- Tightening existing timing. The intro already works; this makes it feel choreographed.

**Defer explicitly:**
- Per-level music themes
- Motion smear animation
- CinematicDirector infrastructure
- Between-level cinematics (new ones)

---

## Sources

- [SLYNYRD Pixelblog 49 - Realistic Human Anatomy](https://www.slynyrd.com/blog/2024/3/25/pixelblog-49-realistic-human-anatomy) -- MEDIUM confidence, pixel art reference for head-to-body ratios
- [SLYNYRD Pixelblog 17 - Human Anatomy](https://www.slynyrd.com/blog/2019/5/21/pixelblog-17-human-anatomy) -- MEDIUM confidence, 6-head vs 8-head model analysis
- [GameDev.net Pixel Art Sprite Proportions](https://www.gamedev.net/forums/topic/625955-pixel-art-sprite-proportions-and-size/) -- MEDIUM confidence, community discussion on display-size readability
- [Innkeep - Eight Ways to Improve Pixel Art Characters](https://innkeepgame.com/eight-ways-to-improve-your-pixel-art/) -- MEDIUM confidence, practical tips
- [Synchronizing Gameplay and Animation with Music (Gamedeveloper.com)](https://www.gamedeveloper.com/audio/synchronizing-gameplay-and-animation-with-music) -- MEDIUM confidence, beat-sync pre-trigger technique
- [Xbox Accessibility Guideline 102](https://learn.microsoft.com/en-us/gaming/accessibility/xbox-accessibility-guidelines/102) -- HIGH confidence, contrast ratio requirements for game text
- [WCAG 2025 Color Contrast Guide](https://www.allaccessible.org/blog/color-contrast-accessibility-wcag-guide-2025) -- HIGH confidence, 4.5:1 and 3:1 contrast ratios
- [Game UI Database - Results Screen](https://www.gameuidatabase.com/index.php?scrn=53) -- HIGH confidence, visual reference collection
- [Phaser 3 Textures Documentation](https://docs.phaser.io/phaser/concepts/textures) -- HIGH confidence, official docs
- [Phaser 3 Canvas Texture Animation Example](https://phaser.io/examples/v3.85.0/animation/view/create-animation-from-canvas-texture) -- HIGH confidence, official example
- Codebase analysis: SpriteGenerator.js (461 lines), IntroMusic.js, GameIntroScene.js (818 lines), EndScreen.js (222 lines), ControlsOverlay.js (106 lines), ParadeTextures.js, BaseCinematicScene.js -- HIGH confidence, direct source
