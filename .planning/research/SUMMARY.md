# Project Research Summary

**Project:** SuperZion — Cinematic & Audio Polish Milestone
**Domain:** Phaser 3 stealth game — procedural audio, cinematics, sprite animation
**Researched:** 2026-03-05
**Confidence:** HIGH

## Executive Summary

SuperZion is a 6-level stealth game built entirely on procedural generation — no external assets, no audio files, no sprite sheets imported from disk. The cinematic and audio polish milestone adds animated intro/between-level cinematics, per-level trance music themes, richer synthesized SFX, and smoother sprite animations. Critically, all four areas are achievable within the existing Phaser 3.80.1 + Vite 5.4.0 + Web Audio API stack with zero new npm dependencies. The project's procedural-only constraint is a feature, not a limitation — it is the game's technical differentiator and must be preserved throughout this milestone.

The recommended approach follows a strict infrastructure-first sequence: fix foundational audio management issues before adding new audio, generate all textures at boot before new cinematic scenes use them, and establish CinematicDirector as an orchestration abstraction before authoring individual cutscenes. This order is non-negotiable — the codebase has documented structural debt (monolithic 1500-line scene files, no audio node cleanup, per-scene texture regeneration) that will compound catastrophically if cinematic content is added before the infrastructure is repaired. The CONCERNS.md file the feature researcher referenced specifically flags missing music fade-out as an existing known gap; that alone blocks clean scene transitions.

The primary risks fall into two buckets: audio memory leaks (unbounded AudioBufferSourceNode accumulation that crashes mobile tabs before level 6) and cinematic API confusion (Phaser's old `tweens.timeline()` was removed in 3.60; tutorials still reference it). Both risks have clear, well-documented mitigations. Test on a real mobile device early — the AudioContext gesture-unlock requirement is silently absent in desktop DevTools mobile simulation and will blindside the cinematic intro if not addressed before integration.

---

## Key Findings

### Recommended Stack

The stack requires no new dependencies. Phaser 3.80.1 already contains the Timeline API (added in 3.60), tween chains, canvas texture management, and sprite animation systems needed for cinematics. Web Audio API covers all synthesis requirements: OscillatorNode for tones, AudioBuffer filled with Math.random() for noise-based SFX, BiquadFilterNode for spectral shaping, GainNode for envelopes and crossfades, WaveShaperNode for distortion, and PeriodicWave for custom timbres. The existing MusicManager and SoundManager singletons are the correct extension points — do not replace them.

**Core technologies:**
- **Phaser 3 Time.Timeline** (`this.add.timeline([])`) — cinematic event orchestration at absolute ms offsets; use this, never the removed `this.tweens.timeline()`
- **Phaser 3 Canvas Texture** (`textures.createCanvas` + `addSpriteSheet`) — multi-frame procedural sprite sheets; consistent with existing generator pattern
- **Phaser 3 Tween Chains** (`this.tweens.chain([])`) — sequential property animation for motion paths and squash/stretch
- **Web Audio BPM Lookahead Scheduler** (`AudioContext.currentTime` + setTimeout lookahead) — drift-free trance sequencing; `setInterval` drifts under load and must not be used
- **AudioBuffer noise synthesis** (`Math.random()` fill + BiquadFilter + GainNode envelope) — explosions, impacts, footsteps; single oscillators cannot reproduce broadband transients
- **PeriodicWave / FM synthesis** — custom timbres (metallic hits, alarms) and unique pad sounds per level beyond built-in waveforms
- **Per-level config objects** (`LEVEL_MUSIC_CONFIG`) — drives BPM, scale, waveform patch, arpeggio pattern, and atmosphere per level without rewriting MusicManager logic

**Critical version note:** Phaser 3.60+ required for `this.add.timeline()`, `this.tweens.chain()`, and `ParticleEmitter` tween properties. Current version 3.80.1 satisfies all requirements.

---

### Expected Features

The feature research distinguishes sharply between what makes the game feel finished (table stakes) versus what generates genuine "wow" reactions (differentiators).

**Must have (table stakes):**
- Animated title sequence — `GameIntroScene` exists but needs Timeline-choreographed sprites + music sync, not just text
- Scene fade in/out on every transition — hard cuts read as bugs; must be applied consistently to all scene changes
- Music that changes per level — same loop across 6 levels kills immersion; 6 distinct config objects required
- Unique per-level BPM — single highest-impact parameter change per level; massive perceptual differentiation for low effort
- SFX parameter variation on repeat — fixed-frequency SFX every time is an uncanny valley; `Math.random()` spread on pitch/duration per call
- Cinematic letterbox bars — black bars signal "story happening"; 20 lines of code, high perceptual impact
- Between-level cinematics with animated sprites — text-only transitions read as placeholder content
- Clean music transitions at scene boundaries — `MusicManager.fadeOutAndStop()` is currently absent; this is a blocking dependency for everything audio-related

**Should have (differentiators):**
- Fast trailer-style intro showcase (boss/plane/character reveals synced to music drop) — highest wow factor
- Per-level trance sub-genre variation (progressive vs. uplifting vs. psytrance) — distinct oscillator patches, filter types, arpeggio patterns per level
- Synthesized trance pad chords — detuned oscillator pairs + slow LFO on filter cutoff; pads are the emotional backbone of trance
- Breakdowns and build-ups synced to cinematic moments — `MusicManager` accepting phase commands from scene lifecycle
- Character entrance animations with motion smear — one extra elongated frame per fast entrance
- Alert/detection musical sting — diminished chord stab on guard detection; hooks directly into existing `_onDetection()`
- Idle breathing animation — 2 extra frames per character at 600ms; makes characters feel alive when stationary
- Boss/level-title reveal card at mission start — full-screen overlay with boss name + sprite, tweened in

**Defer to later pass:**
- Ambient environmental audio loops — valuable but non-blocking; doesn't affect story clarity
- Parallax camera pan during dialogue — nice-to-have; camera pan API exists but requires careful integration
- Explosion impact freeze — risky near existing BossScene disintegration sequence (flagged fragile in CONCERNS.md)
- Character voice bleeps — charming but requires per-scene dialogue refactoring; defer until cinematic structure settles

**Hard anti-features (never build):**
- External audio files, pre-recorded music, video cutscenes — violates procedural constraint
- Tone.js, Howler.js — wraps the Web Audio API already in direct use; adds a dependency for zero gain
- Spine/skeletal animation — requires `.spine` files; incompatible with procedural canvas sprites
- Stem-based dynamic music (FMOD/Wwise style) — requires pre-authored multi-track assets

---

### Architecture Approach

The recommended architecture is **pass-through orchestration**: scenes declare *what* to show; CinematicDirector handles *how* to sequence it; MusicManager and SoundManager own all audio nodes; TextureRegistry generates all frames at boot and exposes them by string key. This one-directional dependency structure (Scene → Director → Managers, never reverse) keeps singletons scene-agnostic and prevents the circular dependency and lifecycle coupling bugs that monolithic scene files accumulate.

**Major components:**
1. **TextureRegistry** (new utility) — generates all procedural canvas textures exactly once at BootScene; all other scenes read frames by string key from Phaser's TextureManager
2. **MusicManager** (extend existing) — adds theme registry, `crossfadeTo(themeId, durationMs)` with equal-power GainNode ramp, per-level config consumption, and `fadeOutAndStop(duration)` (currently missing)
3. **SoundManager** (extend existing) — adds SFX variant pool per event type, randomized pitch/pan on play, noise-based SFX methods (explosion, impact, alarm)
4. **CinematicDirector** (new helper) — thin orchestration layer over `Time.Timeline`; exposes `showSprite`, `moveTo`, `fadeIn`, `playMusic`, `playSfx`, `typeText`, `wait`; consumed by all cinematic scenes
5. **BaseCinematicScene** (extend existing) — delegates all timeline logic to CinematicDirector; owns letterbox bars and scene lifecycle hooks
6. **ShowcaseIntroScene** (new) — fast trailer-style intro; extends BaseCinematicScene; highest complexity, built last
7. **LevelIntroScene** (extend/replace existing) — between-level cinematic; receives `{ levelId }` via `scene.start` data; calls `MusicManager.crossfadeTo()`

**Build order is strict:** TextureRegistry → MusicManager extensions → SoundManager extensions → CinematicDirector → BaseCinematicScene → ShowcaseIntroScene → LevelIntroScene. Manager work before scene work because scenes import managers, never the reverse.

---

### Critical Pitfalls

1. **Unbounded AudioBufferSourceNode accumulation** — each looping sound creates a new node per loop pass; nodes are not GC'd while "playing"; on mobile, tab crashes before level 6. Prevention: explicit `stop()` then `destroy()` in a `setTimeout(0)` gap (Chrome crash workaround) in MusicManager on theme change; never call `sound.add()` in update loops.

2. **AudioContext suspended before cinematic plays** — Chrome 71+ and all mobile browsers suspend AudioContext until a user gesture; cinematic intro plays silently on first load. Prevention: gate all audio on `this.sound.once('unlocked', ...)` event; show a "tap to continue" fallback if no gesture arrives within 2 seconds; test on real mobile hardware, not DevTools simulation.

3. **Procedural texture regeneration on every scene create** — `generateTexture()` inside `create()` on scene restarts causes 200-400ms jank and VRAM spikes. Prevention: generate once in BootScene via TextureRegistry; guard all subsequent calls with `if (!this.textures.exists(key))`.

4. **Old vs new Timeline API confusion** — `this.tweens.timeline()` was removed in Phaser 3.60; any tutorial code using it throws at runtime. Prevention: use `this.add.timeline([])` exclusively; when applying `timeScale`, also set it on each child tween individually.

5. **Sound duplication on scene restart** — global SoundManager persists across scene restarts; `scene.restart()` adds duplicate sound instances without destroying previous ones, causing volume doubling and phasing artifacts. Prevention: explicit `destroy()` in every scene's `shutdown` event handler; check `this.sound.get('key')` before `add()`.

---

## Implications for Roadmap

Based on combined research, the dependency graph mandates a specific build order. Infrastructure must precede content; content must be added from simplest to most complex. Six phases are recommended.

### Phase 1: Audio Infrastructure Repair
**Rationale:** Music fade-out is the single blocking dependency called out in FEATURES.md. AudioBufferSourceNode leaks (Pitfall 1) are catastrophic on mobile and accelerate with every new track added. This phase creates the foundation every subsequent phase depends on. No new audio features should be added until the leak is fixed.
**Delivers:** `MusicManager.fadeOutAndStop()`, `MusicManager.crossfadeTo()` with equal-power crossfade, explicit `destroy()` pattern in shutdown handlers, SoundManager variant pool scaffolding, `LEVEL_MUSIC_CONFIG` data file for all 6 levels.
**Addresses features:** Music transitions at scene boundaries (currently missing), SFX parameter variation.
**Avoids pitfalls:** Pitfall 1 (AudioBufferSourceNode accumulation), Pitfall 6 (sound duplication on restart), Pitfall 7 (looping music gap — ensure Web Audio path stays active).
**Research flag:** Standard patterns — well-documented Web Audio API, LOW need for `/gsd:research-phase`.

### Phase 2: Texture and Animation Foundation
**Rationale:** TextureRegistry (generating all frames at boot) must exist before any cinematic scene tries to display animated sprites. Global animation key collisions (Pitfall 8) are hard to debug after the fact. This phase also increases sprite frame counts for all characters, which cinematic scenes will depend on.
**Delivers:** TextureRegistry utility class, all character sprite sheets updated to 8-frame walk cycles, anticipation frames added to player and enemy action sprites, idle breathing frames (2 per character), animation key namespace convention established and guarded with `anims.exists()`.
**Addresses features:** Anticipation frame (highest-ROI animation improvement), idle breathing animation.
**Avoids pitfalls:** Pitfall 3 (texture regeneration jank), Pitfall 8 (global animation key collision).
**Research flag:** Standard patterns — LOW need for `/gsd:research-phase`.

### Phase 3: CinematicDirector + BaseCinematicScene Refactor
**Rationale:** CinematicDirector must exist before any cinematic scene is authored. Without it, each scene will inline Timeline boilerplate, producing the same 1500-line problem that BossScene already represents. This is a pure infrastructure phase with no new visible content.
**Delivers:** `CinematicDirector` class wrapping `Time.Timeline`, letterbox bars in `BaseCinematicScene`, scene transition fade pattern using manual alpha-tween overlay (avoids camera fade bug), `CinematicController` pattern for extracting cinematic logic from scenes.
**Addresses features:** Scene fade in/out on every transition, cinematic letterbox bars.
**Avoids pitfalls:** Pitfall 4 (tween budget exhaustion — Director enforces budgeted timeline usage), Pitfall 5 (scene transition flicker), Pitfall 9 (old Timeline API confusion), Pitfall 10 (monolithic scene files).
**Research flag:** LOW need — Phaser `Time.Timeline` API is well-documented; patterns are established.

### Phase 4: Per-Level Trance Music Themes
**Rationale:** With MusicManager crossfade infrastructure from Phase 1 and level configs defined, this phase authors the 6 distinct trance patches. Each level gets BPM, scale, oscillator waveform, arpeggio pattern, and atmosphere layer. This is the highest-impact audio feature — per-level music identity.
**Delivers:** 6 distinct trance themes, BPM-locked lookahead scheduler, trance component set per level (kick, bassline, pads, arpeggio, lead melody, atmosphere), alert/detection musical sting hooked into `_onDetection()`.
**Addresses features:** Unique per-level BPM, per-level trance sub-genre variation, synthesized trance pad chords, alert musical sting.
**Avoids pitfalls:** Pitfall 2 (AudioContext suspend — gesture gate applied before music plays), Pitfall 7 (looping gap — Web Audio path enforced).
**Research flag:** MEDIUM need — trance sub-genre differentiation via PeriodicWave coefficients may benefit from `/gsd:research-phase` to define the 6 oscillator patches in detail before implementation.

### Phase 5: Between-Level and Level-Title Cinematics
**Rationale:** With CinematicDirector and TextureRegistry both stable, LevelIntroScene and boss/level-title reveal cards can be authored cleanly. This phase adds the story beats that make the game feel like a complete product.
**Delivers:** Animated LevelIntroScene for all 6 level transitions, boss/level-title reveal card, typed dialogue with character identification, music crossfade triggered at each scene boundary.
**Addresses features:** Between-level story beats with animated sprites, boss/level-title reveal card, music transitions at scene changes.
**Avoids pitfalls:** Pitfall 11 (RenderTexture dimensions — cap at 2048px, test mobile), Pitfall 12 (shutdown vs destroy data manager confusion).
**Research flag:** LOW need — builds on proven Phase 3 infrastructure.

### Phase 6: Showcase Intro and High-Complexity Polish
**Rationale:** The trailer-style intro showcase is the highest-complexity and highest-risk piece of work. Building it last ensures all primitives (Director, TextureRegistry, music themes, sprite frames) are stable. Failures here do not break existing gameplay.
**Delivers:** Fast trailer-style intro showcase (boss/plane/character reveals synced to music beat drop), breakdowns and build-ups in MusicManager tied to cinematic phase commands, character entrance motion smear frames, squash-and-stretch tween overlays on jump/land.
**Addresses features:** Animated intro title sequence (fully realized), per-level trance breakdowns/buildups, character entrance motion smear.
**Avoids pitfalls:** Pitfall 4 (tween budget — audit `tweens.getTweens().length` throughout; budget 20 tweens for cinematics).
**Research flag:** HIGH need for `/gsd:research-phase` — multi-character Timeline choreography synced to audio beat drops requires precise timing research; breakdown/buildup phase command API for MusicManager needs design work.

---

### Phase Ordering Rationale

- Infrastructure-first order directly mirrors the component dependency graph from ARCHITECTURE.md: TextureRegistry and Manager extensions have no scene dependencies and must exist before scenes consume them.
- Phases 1-3 are purely additive to existing infrastructure — no new visible game content, no risk to existing gameplay.
- Phase 4 is the highest-impact audio deliverable and comes before cinematic scenes so that scenes can immediately use the finished music themes.
- Phases 5-6 are content phases that consume all prior infrastructure; reversing them with earlier phases would produce a fragile cinematic sequence that needs to be partially rewritten when foundations change.
- This order avoids the most dangerous pitfall: adding trance music tracks before fixing the AudioBufferSourceNode leak (which would accelerate the crash trajectory on mobile).

---

### Research Flags

Phases likely needing `/gsd:research-phase` during planning:
- **Phase 4:** Trance sub-genre differentiation via PeriodicWave and custom oscillator patches — specific Fourier coefficients for 6 distinct patches need research; trance theory documentation is sparse on Web Audio API specifics.
- **Phase 6:** Multi-character Timeline choreography synced to audio beat drops — precise beat-sync cue system in MusicManager (callback at beat N) is not a well-documented Phaser pattern and needs API design research.

Phases with standard patterns (skip research-phase):
- **Phase 1:** MusicManager crossfade and node cleanup — canonical Web Audio API patterns, documented on MDN and in the Web Audio API book.
- **Phase 2:** Canvas spritesheet generation and global animation registry — Phaser docs and existing codebase patterns cover this completely.
- **Phase 3:** CinematicDirector and `Time.Timeline` usage — official Phaser 3.60+ docs are thorough and examples are available.
- **Phase 5:** LevelIntroScene authoring — direct application of Phase 3 infrastructure with no novel patterns.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All technologies are native browser APIs or Phaser built-ins; Phaser 3.80.1 confirmed to include all required APIs (Timeline in 3.60, tween chains in 3.60, ParticleEmitter tween props in 3.60). MDN and official Phaser docs used as primary sources. |
| Features | HIGH | Table-stakes features are well-established indie game conventions; feature research cross-referenced the existing codebase files (`CONCERNS.md`, `ARCHITECTURE.md`) which confirm the gaps (missing fadeOut, no per-level BPM) directly. |
| Architecture | HIGH | Component boundaries and build order are grounded in Phaser's documented singleton patterns and the existing codebase structure. Equal-power crossfade math sourced from the canonical Web Audio API book (Boris Smus). |
| Pitfalls | HIGH | All 4 critical pitfalls are backed by specific Phaser GitHub issues with issue numbers. The AudioBufferSourceNode leak and AudioContext suspend issues are among the most-cited Phaser bugs in community resources. |

**Overall confidence:** HIGH

### Gaps to Address

- **PeriodicWave coefficient values for trance patches** — research identified the technique but did not specify exact Fourier coefficients for each of the 6 level timbres. Address in Phase 4 planning with `/gsd:research-phase`.
- **Beat-sync callback API in MusicManager** — the lookahead scheduler pattern is clear, but the interface for firing scene-level callbacks at specific bar/beat positions in a trance track needs design. Address in Phase 6 planning.
- **ConvolverNode vs. feedback delay reverb** — STACK.md rates ConvolverNode at MEDIUM confidence for procedural impulse responses; recommends feedback delay network as first attempt. Validate reverb quality during Phase 4 SFX work; fallback strategy is already identified.
- **iOS/Safari HTML5 Audio fallback behavior** — Pitfall 7 (looping gap) applies if Web Audio path fails to unlock. The mitigation (ensure Web Audio unlock before play) is clear, but behavior on specific iOS versions should be validated with real device testing in Phase 1.

---

## Sources

### Primary (HIGH confidence)
- [Phaser 3 Time.Timeline API](https://docs.phaser.io/api-documentation/class/time-timeline) — cinematic event sequencing
- [Phaser 3 Animations Documentation](https://docs.phaser.io/phaser/concepts/animations) — frame animation, anims.create(), generateFrameNumbers()
- [Phaser 3 CanvasTexture API](https://docs.phaser.io/api-documentation/class/textures-canvastexture) — procedural spritesheet generation
- [MDN Web Audio API Advanced Techniques](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Advanced_techniques) — BPM lookahead scheduler
- [MDN Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API) — OscillatorNode, BiquadFilterNode, GainNode, AudioBuffer
- [Web Audio API — Boris Smus (O'Reilly)](https://webaudioapi.com/book/Web_Audio_API_Boris_Smus_html/ch03.html) — equal-power crossfade
- [Phaser issue #2280](https://github.com/phaserjs/phaser/issues/2280) — AudioBufferSourceNode memory leak
- [Phaser issue #3895](https://github.com/photonstorm/phaser/issues/3895) — each loop creates new AudioBufferSourceNode
- [Phaser v3.60 Beta 23 discussion](https://github.com/phaserjs/phaser/discussions/6452) — Timeline/TweenChain API changes
- [Phaser 3 audio docs — locked/UNLOCKED](https://docs.phaser.io/phaser/concepts/audio) — AudioContext gesture gate
- [web.dev — Web Audio for Games](https://web.dev/webaudio-games/) — game audio architecture patterns
- Codebase files: `.planning/codebase/ARCHITECTURE.md`, `.planning/codebase/STACK.md`, `.planning/codebase/CONCERNS.md` — direct source analysis

### Secondary (MEDIUM confidence)
- [Rex Rainbow Phaser 3 Notes — Timeline](https://rexrainbow.github.io/phaser3-rex-notes/docs/site/timeline/) — Timeline event structure reference
- [Trance Music Production — Landr](https://blog.landr.com/trance-music-production/) — trance component anatomy
- [HTMEM — Trance Song Structure](https://howtomakeelectronicmusic.com/trance-song-structure-and-how-does-uplifting-trance-song-progress/) — BPM ranges, section structure
- [Phaser discourse — AudioContext not allowed to start](https://phaser.discourse.group/t/audiocontext-was-not-allowed-to-start/795)
- [Phaser discourse — Sound duplicates on scene.restart()](https://phaser.discourse.group/t/sound-duplicates-in-one-scene-when-using-scene-restart/8720)
- [Phaser discourse — Tweens performance](https://phaser.discourse.group/t/tweens-performance/10930)
- [Dynamic Music in Games using WebAudio](https://cschnack.de/blog/2020/webaudio/) — MusicManager patterns
- [How to Create Procedural Audio Effects with Web Audio API](https://dev.to/hexshift/how-to-create-procedural-audio-effects-in-javascript-with-web-audio-api-199e) — noise buffer SFX patterns

### Tertiary (LOW confidence)
- [Refactoring Phaser components into classes](https://jingchaoyu.medium.com/refining-our-phaser-game-part-1-refactoring-components-into-their-own-classes-3c748da67afa) — CinematicController pattern; single article, but consistent with established OO patterns

---

*Research completed: 2026-03-05*
*Ready for roadmap: yes*
