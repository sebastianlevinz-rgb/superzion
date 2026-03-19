# Project Research Summary

**Project:** SuperZion v1.1 Polish Pass
**Domain:** Phaser 3 stealth side-scroller — targeted polish of 8 visual, audio, gameplay, and UX issues
**Researched:** 2026-03-19
**Confidence:** HIGH

## Executive Summary

SuperZion v1.1 is a polish pass on an existing 6-level procedurally-generated browser game (Phaser 3.80.1, Web Audio API, Canvas 2D — zero external assets). The task is not building new features; it is finishing 8 discrete, well-scoped issues that leave the game feeling incomplete: placeholder boss art in the intro, an F-15 with inverted wings, levels that end without clear "RETRY / NEXT LEVEL" navigation, controls text that is hard to read, and a Level 2 that may be physically impassable. Research conclusively shows that all required systems already exist in the codebase — `EndScreen.js`, `ControlsOverlay.js`, `IntroMusic.js`, `ParadeTextures.js`, waving flag animations, boss sprite generators, and a detailed Mossad-agent player sprite. The work is wiring and tuning, not building.

The most important architectural finding is that the hero character is drawn by three independent texture systems (`SpriteGenerator.js` for gameplay, `CinematicTextures.js` for cinematic intros, `ParadeTextures.js` for the intro showcase) with no shared code or palette. Boss and enemy art has similar fragmentation across scene-specific texture files. This fragmentation is the root cause of the "placeholder rectangles" problem in the GameIntroScene intro: parade textures are generated correctly in `create()` via `generateAllParadeTextures()` but `_bossFlashEntry()` ignores them and draws raw `Graphics` objects instead. The fix is wiring existing texture keys to sprite display calls, not redrawing art. Sprite redesign work (Issue 1) is verification and palette consistency audit, not a rewrite.

The critical risks center on three things: (1) audio clipping — `IntroMusic.js` schedules hundreds of Web Audio nodes with no `DynamicsCompressorNode` in the signal chain, so the intro can clip under load; (2) keyboard listener leaks — `EndScreen.js` and `ControlsOverlay.js` register listeners that must be cleaned up on scene shutdown or they accumulate across retries; (3) `GameIntroScene.js` (818 lines) is the convergence point for three separate fixes (boss restoration, final intro screen, SFX sync) and must be edited serially with commits between each. The recommended 4-phase build order — quick standalone wins first, then sprite audit, then serialized intro overhaul, then end-screen migration — prevents conflicts and regressions.

---

## Key Findings

### Recommended Stack

No new dependencies are needed or permitted. The entire polish pass executes within the existing stack.

**Core technologies:**
- **Phaser 3.80.1** — scene lifecycle, camera shake (`shake(duration, intensity, force)`), texture manager (shared across all scenes), input system; all heavily used and well-understood in this codebase
- **Canvas 2D API** — procedural sprite drawing via `px()`, `pxRect()`, `shadedRect()`, `ellipse()`, `arc()`, `applyOutline()`; all helpers already exist, work is parameter tuning
- **Web Audio API** — psytrance synthesis via oscillators, biquad filters, gain envelopes, noise buffers; `IntroMusic.js` already implements the full 145 BPM 3-act score; SFX functions exist but are not wired to any scene event
- **Vite 5.4.0** — build and dev server; no changes needed

Key constraint: 100% procedural, zero external asset files, no new npm packages. Every anti-pattern that violates this (Tone.js, image sprites, CSS overlays, WebGL renderer switch) is documented in STACK.md with the correct procedural alternative.

See `.planning/research/STACK.md` for detailed technique reference per polish issue.

### Expected Features

**Must have (table stakes — shipping blockers):**
- **Issue 5: Level 2 container paths passable** — a level that cannot be completed is not a game; current spacing (30-32px clearance for a 14px player) may already be sufficient but the actual blocker needs identification before assuming spacing changes are needed
- **Issue 7: End-of-level screens on all 6 levels** — three levels (DroneScene, B2BomberScene, BossScene) have 100-130 lines of inline custom victory/defeat UI; must be migrated to shared `EndScreen.js` with consistent "RETRY (R) / SKIP LEVEL (S)" and "PLAY AGAIN (R) / NEXT LEVEL (ENTER)" buttons
- **Issue 6: F-15 with swept-back wings** — forward wings on an F-15 read as broken art; at least two F-15 implementations exist (BomberTextures.js and CinematicTextures.js/GameIntroScene.js); must identify the correct file before editing
- **Issue 8: Controls overlay readable** — gold text on dark semi-transparent background, persistent bar at bottom; currently bar uses 13px white text at 0.7 opacity which is borderline unreadable; fix is 3-4 constants in ControlsOverlay.js
- **Issue 1: Player sprite with human proportions** — `SpriteGenerator.js` already generates a detailed 128x128 Mossad agent; the question is whether it reads at game-scale display sizes (32-48px rendered height); 6.5-head ratio is confirmed good for action side-scrollers; issue is palette consistency across the three independent sprite systems

**Should have (high-impact polish):**
- **Issue 3: Real boss sprites and waving flags in intro** — `_bossFlashEntry()` draws bosses as colored rectangles with circle heads; `ParadeTextures.js` has full parade boss sprites and 4-frame waving flag spritesheets already generated in `create()`, just not referenced in display code
- **Issue 4: Final intro screen with giant Magen David** — Act 3 title card needs a large golden semi-transparent Star of David (via existing `starOfDavid()` helper) behind the hero and arcade-weight monospace font for "SUPERZION"

**Nice to have (polish on polish):**
- **Issue 2: SFX synchronized to beat drops** — intro music already works; this tightens visual events to the 145 BPM beat grid (beat = 0.4138s) and wires the five unused `IntroMusic` SFX exports (`playMissileWhoosh`, `playJetFlyby`, `playTankRumble`, `playMarchSteps`, `playWindAmbient`) to GameIntroScene visual events

**Defer explicitly (anti-features for this milestone):**
- Per-level music themes, motion smear animation, CinematicDirector infrastructure, new gameplay mechanics, save/load system, accessibility overhaul, custom web fonts, full boss AI overhaul

See `.planning/research/FEATURES.md` for full feature dependency graph and per-issue complexity assessments.

### Architecture Approach

The codebase is a scene-per-level architecture with shared singleton services (MusicManager, SoundManager) and reusable utility modules (EndScreen, ControlsOverlay, BaseCinematicScene). Texture generation and texture display are completely decoupled: generators run in each scene's `create()` and register keys with Phaser's global TextureManager; display code in the same or other scenes then references those keys. The gap in the intro is that `generateAllParadeTextures()` runs correctly but the display code in `_bossFlashEntry()` was replaced with raw `Graphics` during a refactor and never restored.

**Major components:**
1. **SpriteGenerator.js** — gameplay player spritesheet (128x128, 12 animation frames); produces `superzion` texture key; currently has zero imports in the codebase (orphaned but drawing code is correct)
2. **CinematicTextures.js** — static hero portraits (128x192) for 6 level-intro cinematics and MenuScene; produces `cin_superzion` and `cin_superzion_cliff`; independent palette from SpriteGenerator
3. **ParadeTextures.js** — parade-context hero, boss sprites, waving flag spritesheets; produces `parade_superzion`, `parade_foambeard`, `parade_turboturban`, `parade_warden`, `parade_supremeturban`, and `parade_flag_*` keys; ~1100 lines
4. **IntroMusic.js** — 945-line psytrance engine scheduling 25-second 3-act intro at 145 BPM via Web Audio; exports 5 standalone SFX functions that are never called
5. **EndScreen.js** — reusable victory/defeat overlay (222 lines); used by L2 and L3 only; needs migration to L4 (DroneScene), L5 (B2BomberScene), L6 (BossScene)
6. **ControlsOverlay.js** — 107-line two-phase controls display (big overlay for 3s then fades to bottom bar); integrated in all 6 levels; cosmetic changes only needed
7. **BaseCinematicScene.js** — act system, skip-to-menu, typewriter, transitions; parent class for all 7 cinematic scenes including GameIntroScene
8. **MusicManager / SoundManager** — singleton audio services; well-established; do not modify during this milestone

**Key convergence point:** `GameIntroScene.js` (818 lines) is modified by Fixes 2, 3, and 4 simultaneously. Fixes must be serialized: Fix 3 (Act 1 boss/flag display) first, Fix 4 (Act 3 title screen) second, Fix 2 (SFX wiring across all acts) last. Each fix must be committed before the next begins.

See `.planning/research/ARCHITECTURE.md` for per-fix integration maps with file-level change lists and the full scene flow.

### Critical Pitfalls

1. **Sprite identity fragmentation** — three independent systems draw SuperZion with separate code and palettes. Updating SpriteGenerator.js and assuming it propagates does not work. Prevention: audit all three files (SpriteGenerator, CinematicTextures, ParadeTextures) for visual consistency before any sprite commit; extract shared `PAL` palette constants as a first step.

2. **Web Audio node accumulation and clipping** — at 145 BPM over 25 seconds, IntroMusic.js creates 300+ scheduled nodes with no `DynamicsCompressorNode`. Combined with synchronized SFX, the signal chain clips. Prevention: insert a DynamicsCompressorNode (threshold -6dB, ratio 4:1) between the voice bus and master gain; batch-schedule Act 2 and Act 3 nodes late to spread allocation cost.

3. **Keyboard listener leaks on scene transitions** — EndScreen.js and ControlsOverlay.js register `addKey()` listeners inside `delayedCall` callbacks. If scene transitions before the delay fires, listeners attach to a shutting-down scene and accumulate across retries. Prevention: store key references, return a cleanup function from both modules, call cleanup in each scene's `shutdown` event.

4. **Restoring lost content without understanding why it was lost** — boss sprites and flags disappeared during a refactor. The texture generation (`generateAllParadeTextures`) still runs; the loss is in `_bossFlashEntry()` display code. Prevention: audit ParadeTextures key outputs vs GameIntroScene display code references first; restoration is `this.add.sprite(x, y, 'parade_foambeard')` — do not regenerate or redraw the textures.

5. **End-of-level screen integration with heterogeneous custom scenes** — DroneScene, B2BomberScene, and BossScene each have scene-specific stats logic and (in BossScene) a disintegration animation that must complete before the victory overlay appears. Naive replacement of custom `_showVictory()` with `showVictoryScreen()` breaks stats and animation order. Prevention: call `showVictoryScreen()` from within the existing `_showVictory()` method after stats are computed, not as a wholesale replacement.

---

## Implications for Roadmap

Based on combined research, the natural build order is 4 phases grouped by dependency and risk: three completely independent fixes first, one prerequisite fix second, three fixes that serialize through the same file third, and one fix that can parallel-track throughout.

### Phase 1: Standalone Quick Wins

**Rationale:** Fixes 5, 6, and 8 have zero dependencies on any other fix. They touch isolated files. Doing them first eliminates three shipping blockers with low risk and validates the development environment before the harder convergence work begins.

**Delivers:** Readable controls text in all 6 levels, correct F-15 swept-back wing geometry, and confirmed Level 2 completability (or the specific blocked path identified for targeted repair).

**Addresses:** Issues 5 (Level 2 container paths), 6 (F-15 wings), 8 (controls readability) — all table-stakes blockers.

**Avoids:** Pitfall 9 (controls depth/contrast) — test all 6 level backgrounds for gold text readability before closing; Pitfall 6 (two F-15 sprite files) — identify the broken implementation visually before editing any coordinates.

**Estimated scope:** ~1.5 hours total. ControlsOverlay.js constant changes (15 min), F-15 geometry identification and fix (30 min), PortSwapScene container path investigation and playtest (30-45 min).

### Phase 2: Sprite Visual Consistency Audit

**Rationale:** Fix 1 (player sprite) is a prerequisite for Fixes 3 and 4: the intro showcase uses `parade_superzion` and boss sprites should match the established art style. The SpriteGenerator.js sprite is already drawn and detailed (573 lines of canvas drawing). This phase is verification and palette audit, not a rewrite.

**Delivers:** Confirmed visual consistency across all three SuperZion sprite systems (SpriteGenerator, CinematicTextures, ParadeTextures) and verified that the 128x128 sprite reads correctly at 32-48px rendered game-scale.

**Addresses:** Issue 1 (sprite proportions and consistency).

**Avoids:** Pitfall 1 (sprite identity fragmentation) — mandatory audit of all three drawing systems; Pitfall 5 (proportions unreadable at game scale) — verify at actual rendered resolution, not at canvas size.

**Estimated scope:** 1-2 hours. If divergence is minor (palette values differ), it is a 30-minute fix. If one system's proportions are substantially different, time-box at 2 hours and flag if it spills.

### Phase 3: Intro Scene Overhaul (Serialized)

**Rationale:** Fixes 2, 3, and 4 all modify `GameIntroScene.js`. They must execute in strict order with a commit between each to prevent conflicts and enable targeted rollback. This phase brings the intro from "placeholder rectangles with music playing" to a polished cinematic showcase.

**Delivers:** Real boss parade sprites (Foam Beard, Turbo Turban, The Warden) with waving flag animations in Acts 1-2; giant golden semi-transparent Star of David behind the hero with arcade-weight title in Act 3; missile whoosh, jet flyby, tank rumble, and march SFX synchronized to visual events and the 145 BPM beat grid.

**Addresses:** Issues 3 (boss + flag restoration), 4 (final intro title screen), 2 (SFX beat sync).

**Avoids:** Pitfall 4 (restore without understanding what was lost) — audit ParadeTextures key outputs against GameIntroScene display code before writing any restoration; Pitfall 2 (Web Audio clipping) — add DynamicsCompressorNode when wiring SFX in Fix 2; Pitfall 12 (Magen David blocking skip input) — set overlay depth below BaseCinematicScene skip hint at depth 100.

**Serial order within phase:**
1. Fix 3: Rewrite `_bossFlashEntry()` to use `this.add.sprite(x, y, 'parade_foambeard')` etc.; add waving flag sprites to Acts 1 and 2
2. Fix 4: Modify `_startAct3()` title reveal with giant Star of David graphic and larger arcade-style monospace font
3. Fix 2: Wire the 5 unused IntroMusic SFX exports to GameIntroScene visual event callbacks; adjust beat-grid timing; add DynamicsCompressorNode

**Estimated scope:** 4-5 hours total across the three serialized sub-fixes.

### Phase 4: End-Screen Standardization (Parallel Track)

**Rationale:** Fix 7 touches completely different files from Phases 2-3 (DroneScene, B2BomberScene, BossScene). It can run in parallel with Phases 2-3 if resources allow, or sequentially after if not.

**Delivers:** Consistent RETRY/SKIP LEVEL and PLAY AGAIN/NEXT LEVEL navigation on every level, eliminating "stuck at victory text" UX bugs in L4, L5, and L6.

**Addresses:** Issue 7 (end screens on all 6 levels).

**Avoids:** Pitfall 7 (heterogeneous custom scenes) — integrate EndScreen.js calls inside existing `_showVictory()` methods after scene-specific stats are computed, not as wholesale replacements; Pitfall 3 (keyboard listener leaks) — add cleanup in each scene's `shutdown` event handler; BossScene disintegration animation must complete before EndScreen overlay is shown.

**Scene routing map for implementation:**
- L4 DroneScene → nextScene: `MountainBreakerIntroCinematicScene`
- L5 B2BomberScene → nextScene: `LastStandCinematicScene`
- L6 BossScene → nextScene: `VictoryScene` (last level, no skip needed)
- L1 GameScene — preserve ExplosionCinematicScene flow; standardize navigation at its end

**Estimated scope:** 2-3 hours.

### Phase Ordering Rationale

- **Phase 1 before everything:** Zero-risk standalone fixes reduce visible broken count and validate the dev environment without introducing any new risks.
- **Phase 2 before Phase 3:** Sprite visual identity must be confirmed before boss sprites and the final intro title screen are locked in — otherwise the parade hero may not match gameplay hero after Phase 3 completes.
- **Phase 3 serialized internally:** Three fixes on one 818-line file require strict ordering. Act 1 visual fix (boss sprites) before Act 3 visual fix (title screen) before audio wiring (all acts) is the safest sequence.
- **Phase 4 parallel to Phases 2-3:** Different files, no shared state, no conflict risk.

### Research Flags

Phases that may need closer attention during execution:

- **Phase 2 (Sprite Audit):** If palette and proportion divergence across the three sprite systems is substantial, the audit expands into a rewrite of one system. Time-box at 2 hours; if it spills, flag for a dedicated sub-task before continuing to Phase 3.
- **Phase 3 / Fix 2 (SFX sync timing):** The Web Audio clock and Phaser game-loop clock are independent. Tight beat-grid synchronization may require `setTimeout` calculated from `(scheduledTime - ctx.currentTime) * 1000` rather than `delayedCall`. Accept up to ~50ms visual drift as tolerable; beyond that, escalate.
- **Phase 4 / Fix 7 (BossScene):** The disintegration animation + EndScreen layering interaction requires specific testing. The `victory_pending → victory` state machine must trigger EndScreen only after the animation completes.

Phases with standard patterns (no additional research needed):

- **Phase 1 (all three fixes):** ControlsOverlay, PortSwapScene constants, and F-15 geometry are small, isolated, and fully understood from the source audit.
- **Phase 3 / Fix 3 (boss + flag restoration):** Texture keys confirmed present; display code fix is a standard `this.add.sprite()` call.
- **Phase 4 / Fix 7 for L2 and L3:** Already using EndScreen.js; just verify current integration matches spec.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | No new technologies; all techniques demonstrated in existing codebase; 100% procedural constraint is firm and well-understood |
| Features | HIGH | 8 issues precisely defined with file-level attribution; scope confirmed via direct source audit of all affected files |
| Architecture | HIGH | Full source audit of all affected files: SpriteGenerator (573 lines), GameIntroScene (818 lines), IntroMusic (945 lines), all 6 game scenes, all 6 intro cinematics; all integration points mapped |
| Pitfalls | HIGH | Pitfalls derived from direct code inspection (keyboard listener patterns, Web Audio node counts from BPM/duration math, texture key naming) plus specific Phaser GitHub issue references |

**Overall confidence: HIGH**

### Gaps to Address

- **F-15 exact bug location:** `BomberTextures.js` wing geometry appears correct for a rightward-facing sprite. The bug is most likely in `CinematicTextures.js` or the inline jet graphics in `GameIntroScene._spawnJetStrike()`. Must be identified visually before editing — do not change BomberTextures.js without first confirming it is the broken one.

- **Level 2 actual blocked path:** Current spacing (30-32px clearance) should be passable for a 14px player body. The real blocker may be wall/building physics bodies, guard patrol choke points at narrow sections, or a crane/forklift physics body that is larger than its visual sprite. Must playtest before assuming spacing constants are the cause.

- **SpriteGenerator.js import count of zero:** The source audit found zero imports of `SpriteGenerator.js` across the codebase, which is unexpected for the gameplay sprite generator. Verify that the `superzion` texture is being generated and loaded — it may be instantiated from a BootScene file that was not included in the audit.

- **DynamicsCompressor threshold tuning:** The -6dB threshold and 4:1 ratio recommendation is a standard starting point for multi-voice synthesis, but optimal settings depend on current voice volumes in IntroMusic.js. Requires listening tests during Phase 3 / Fix 2 execution.

---

## Sources

### Primary (HIGH confidence — direct source code inspection)
- `SpriteGenerator.js` (573 lines) — sprite system, PAL palette, 12 animation frames, applyOutline technique
- `GameIntroScene.js` (818 lines) — 3-act cinematic, `_bossFlashEntry()` raw graphics at line 472, `_startAct3()` title reveal
- `IntroMusic.js` (945 lines) — 699-line psytrance class + 246-line exported SFX functions (all unwired)
- `EndScreen.js` (222 lines) — reusable victory/defeat overlay, key bindings, scene routing parameters
- `ControlsOverlay.js` (107 lines) — two-phase controls display, depth 90-101
- `ParadeTextures.js` (~1100 lines) — boss parade sprites, flag generation, `wavingSheet()` animation helper
- `CinematicTextures.js`, `BomberTextures.js`, `PortSwapScene.js`, `DroneScene.js`, `B2BomberScene.js`, `BossScene.js`, `BaseCinematicScene.js` — all audited for integration mapping
- [Phaser 3.80.0 Camera Shake API](https://newdocs.phaser.io/docs/3.80.0/focus/Phaser.Cameras.Scene2D.Camera-shake) — shake parameter signature
- [Phaser 3 Textures Documentation](https://docs.phaser.io/phaser/concepts/textures) — texture manager lifecycle

### Secondary (MEDIUM confidence — community consensus, tutorials)
- [SLYNYRD Pixelblog 49 — Realistic Human Anatomy](https://www.slynyrd.com/blog/2024/3/25/pixelblog-49-realistic-human-anatomy) — 6-head model for action side-scrollers
- [GameDev.net Pixel Art Sprite Proportions](https://www.gamedev.net/forums/topic/625955-pixel-art-sprite-proportions-and-size/) — display-size readability at 32-48px
- [Psytrance Bassline Synthesis](https://dsokolovskiy.com/blog/all/psytrance-bassline-synthesis/) — 16th-note patterns, filter envelope character
- [Gamedeveloper.com — Synchronizing Gameplay and Animation with Music](https://www.gamedeveloper.com/audio/synchronizing-gameplay-and-animation-with-music) — beat-sync pre-trigger technique
- [Web Audio API performance notes](https://padenot.github.io/web-audio-perf/) — node lifecycle, GC behavior
- [MDN Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API) — OscillatorNode, BiquadFilterNode, GainNode, DynamicsCompressorNode

### Tertiary (MEDIUM-LOW confidence — GitHub issues and community reports)
- [Phaser GitHub Issue #3489](https://github.com/phaserjs/phaser/issues/3489) — keyboard listeners remain active after scene change
- [Phaser GitHub Issue #6669](https://github.com/phaserjs/phaser/issues/6669) — dynamic texture memory leak
- [Chromium Bug #576484](https://bugs.chromium.org/p/chromium/issues/detail?id=576484) — Web Audio GC behavior for disconnected nodes

---

*Research completed: 2026-03-19*
*Ready for roadmap: yes*
