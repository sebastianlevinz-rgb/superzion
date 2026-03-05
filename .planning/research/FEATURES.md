# Feature Landscape: Cinematic Polish Milestone

**Domain:** Phaser 3 stealth game — cinematic intro, between-level cinematics, trance audio, procedural SFX, sprite animation
**Researched:** 2026-03-05
**Milestone scope:** Additive polish on an existing 6-level game with procedural graphics (no external assets), Web Audio API synthesis, and a `BaseCinematicScene` inheritance chain already in place

---

## Table Stakes

Features players expect from a polished indie game at this level. Their absence makes the game feel unfinished or amateur.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Animated intro title sequence | Every polished indie has a logo/title moment that sets tone before the menu | Medium | Game already has `GameIntroScene`; needs animated sprites + music sync, not just text |
| Scene fade in/out on every transition | Hard cuts between scenes read as a bug, not a choice | Low | Phaser `camera.fadeIn/fadeOut` already usable; apply consistently |
| Music that changes per level | Same loop for 6 levels kills immersion; players notice instantly | Medium | `MusicManager` exists; needs 6 distinct configurations, not one theme with tweaks |
| Unique per-level BPM | BPM is the single biggest signal that "this level feels different"; same BPM = same energy | Low | Single parameter change in existing `MusicManager`; huge perceptual impact |
| Sound effects that vary on repeat | Identical SFX every time (footstep, alert, explosion) is an uncanny valley that breaks immersion | Medium | `SoundManager` already synthesizes; needs random parameter ranges, not fixed values |
| Cinematic bars (letterbox) on cutscenes | Players are conditioned to read black bars as "story happening" — without them, dialogue scenes feel unframed | Low | Two black rectangles with `setScrollFactor(0)`, tweened in/out |
| Between-level story beats with animated sprites | Between-level text dumps with no animation feel like placeholder content | High | Needs sprite choreography via Phaser `Timeline`, character entrance/exit tweens |
| Music that transitions cleanly at scene change | Audio that abruptly cuts or bleeds into next scene is jarring | Medium | `MusicManager` needs a fade-out method called before `scene.start()`; currently no clean pause/resume |
| Anticipation frame before major character actions | Without a wind-up frame, actions look like teleportation; this is the single highest-ROI animation improvement | Low | 1-2 extra frames per action sprite sheet; changes asset not code |

---

## Differentiators

Features that create the "wow" reaction and separate the game from browser-game territory. Players won't miss them if absent, but they generate social sharing and strong first impressions.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Fast trailer-style intro showcase (boss/plane/character reveals) | Rapid-fire cuts synced to a music beat drop create a "hype reel" feel; players are primed to feel excited before gameplay starts | High | Requires Phaser `Timeline` orchestrating multi-sprite entrances + camera zoom/pan + text flash; audio cue-triggered event scheduling |
| Per-level trance sub-genre variation (progressive vs. psytrance vs. uplifting) | Each sub-genre has a distinct emotional signature — progressive (dark, building), uplifting (euphoric), psytrance (hypnotic) — giving each level a unique "feel" rather than just different BPM | High | Requires different synthesizer patches (oscillator waveform, filter type, detune), different arpeggio patterns, and different pad chord voicings per level |
| Synthesized trance pad chords (not just melody) | Pads are the emotional backbone of trance; without them, synth music feels thin and mechanical | Medium | Web Audio API `GainNode` + `OscillatorNode` with slow LFO on filter cutoff; detuned oscillator pairs for width |
| Breakdowns and build-ups synced to cinematic moments | The classic trance structure (build → drop) mapped to "pre-infiltration tension → mission start" creates an emotional payoff | High | Requires `MusicManager` accepting phase commands from scene lifecycle; breakdown = strip drums, build = filter sweep + snare roll |
| Character entrance animations with motion smear | A 1-frame "smear" (horizontal blur/stretch) on fast entrances reads as professional animation; used in every high-quality 2D game | Medium | One extra frame per action where the sprite is horizontally elongated; procedural canvas generation already supports this |
| Parallax camera pan in cinematics | Camera slowly drifting across a background during dialogue creates depth and avoids the "static painting" feeling of most indie cutscenes | Medium | Phaser `camera.pan()` with long duration and `ease: 'Sine.easeInOut'`; background parallax layers already exist in scene |
| Idle breathing animation on all characters | Stationary characters that don't breathe look frozen; a 2-frame breathing cycle makes everything feel alive | Low | 2 extra frames per character (chest expanded / chest neutral) at 600ms per frame |
| Typed text with character voice bleeps (per-character SFX) | Each character's dialogue text gets a unique bleep timbre — this was popularized by Undertale and is now expected in retro-aesthetic games | Medium | `SoundManager` plays a short oscillator note on each character typed; pitch and waveform vary per speaker |
| Explosion radial particle burst with camera impact freeze | A 2-3 frame "impact freeze" (game pauses, then explodes) on large explosions creates cinematic weight | Medium | `this.time.delayedCall(0, () => this.scene.pause())` for freeze frames + existing particle emitter for burst |
| Ambient environmental audio loops | Silent backgrounds during gameplay break immersion; distant aircraft hum, city ambient, or wind create world presence | Medium | Continuous oscillator with very slow LFO modulation; extremely quiet, panned center; played via `MusicManager` as a separate gainNode chain |
| Alert/detection musical sting | When a guard spots the player, a dissonant musical stab (rather than only a beep SFX) is a signature of polished stealth games | Low | 3-4 oscillator chord (diminished) played for 0.5s via `SoundManager` on detection event; references existing detection hook in `GameScene._onDetection()` |
| Boss/level-title "reveal" card at mission start | A full-screen card with boss name and title, animated in, styled to match the level's visual theme, is standard in arcade and indie boss-rush games | Medium | Full-screen overlay with text + character sprite, tweened in; can be built into `*IntroCinematicScene` |

---

## Anti-Features

Things to deliberately not build. Each has a rationale — either they conflict with the project's no-asset constraint, introduce unbounded scope, or solve a problem the game doesn't have.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Pre-recorded audio files (MP3/OGG) | Game has zero external assets by design; adding audio files breaks the procedural-only constraint and adds load time | Keep everything in Web Audio API synthesis — this is already the project's differentiator |
| Full-length voiced cutscene dialogue | Voice acting requires recording, compression, licensing; completely out of scope and inconsistent with the retro-bleep aesthetic | Use typed text + character bleeps (a differentiator feature); it's more charming for the genre |
| AI-generated music via external API (Mubert, Suno) | Introduces network dependency, latency, licensing uncertainty, and removes the offline-capable nature of the game | Tone.js or raw Web Audio API synthesis covers all trance generation needs with zero network calls |
| Spine/skeletal animation | Phaser has a Spine plugin but it requires external .spine files; the game uses procedural canvas-based sprites exclusively | More frames in the existing procedural sprite generator; squash/stretch via tween `scaleY` on existing sprites |
| Video file cutscenes (.webm, .mp4) | Breaks the zero-external-assets constraint; large download size; can't be procedurally generated | Phaser `Timeline` + tweened sprites + camera effects recreate 80-90% of the impact of video cutscenes |
| Full 12-animation-principle character rigs | Extremely high frame count (12+ frames per action) on 128x128 canvas sprites is mostly invisible in motion and takes enormous authoring time | Target 4-6 frames for run/walk, 2-3 frames for idle, 3-4 frames for attack; anticipation frame is the highest-value single addition |
| Dynamic music layering system (stems) | Stem-based systems (FMOD, Wwise style) require pre-authored multi-track assets; incompatible with real-time synthesis | BPM + oscillator patch variation achieves the same "level-to-level music identity" goal with zero asset dependency |
| Procedural music generation via ML model | In-browser ML audio generation is ~500ms+ latency, unpredictable, and adds massive dependency weight | Rule-based Tone.js sequencer patterns are deterministic, instant, and fully controllable |
| Dialogue choice / branching narrative | Would require dialogue graph data structures and a narrative engine; the milestone is about cinematic presentation, not story authoring | Keep story linear; invest effort in animating existing fixed story beats |
| Full-screen resolution cutscene rendering (4K canvas) | The game viewport is 960x540; high-res canvas rendering wastes GPU memory for no visible benefit in-engine | Render all cinematics at game-native 960x540; camera zoom handles close-ups |

---

## Feature Dependencies

```
Animated intro showcase
  └── requires: Phaser Timeline (v3.60+, already at 3.80.1, confirmed available)
  └── requires: Multi-character sprite choreography (per-character tweens)
  └── requires: Music beat-sync cue system in MusicManager (new)
  └── requires: Trance music with defined drop point

Per-level trance music themes
  └── requires: MusicManager refactored to accept a "level config" object
  └── requires: Per-level BPM, oscillator patch, arpeggio pattern definitions (data layer)
  └── requires: Clean music stop/start at scene boundaries (prerequisite: music fade-out)

Music fade-out at scene transitions  [BLOCKING — must land first]
  └── requires: MusicManager.fadeOutAndStop(duration) method
  └── requires: All scene transition callsites updated to call fadeOutAndStop before scene.start()

Between-level cinematics with animated sprites
  └── requires: BaseCinematicScene (already exists)
  └── requires: Cinematic letterbox bars
  └── requires: Character sprites with at least idle + gesture frames
  └── requires: Typed dialogue + character voice bleeps
  └── requires: Camera pan during dialogue

Character voice bleeps
  └── requires: SoundManager.playBleep(pitch, waveform) method (new)
  └── requires: Per-character pitch/waveform mapping (data)

Procedural SFX variety
  └── requires: SoundManager refactored to accept parameter ranges (min/max) not fixed values
  └── requires: Math.random() in pitch, duration, detune for each SFX call

Ambient environmental audio
  └── requires: MusicManager extended with ambient layer concept (separate GainNode chain)
  └── requires: Per-level ambient config (frequency, modulation speed)

Alert musical sting
  └── requires: SoundManager.playDetectionSting() method
  └── requires: Called from GameScene._onDetection() hook (hook already exists)

Explosion impact freeze
  └── requires: Scene-level pause/resume for 2-3 frames
  └── requires: Particle burst (already exists via Phaser particle emitter)

Idle breathing animation
  └── requires: 2 additional frames per character in procedural canvas generator
  └── requires: Animation registered in AnimationManager with long frame duration

Anticipation frame (highest-ROI animation)
  └── requires: 1-2 extra canvas frames per action in sprite generators
  └── requires: No code changes to scene — only asset authoring in *Generator.js files
```

---

## MVP Recommendation

For maximum visible polish per engineering hour, prioritize in this order:

1. **Music fade-out at scene transitions** — unblocks everything else audio-related; currently missing entirely per CONCERNS.md
2. **Per-level trance BPM + patch config** — single MusicManager config object gives 6 distinct musical identities
3. **Cinematic letterbox bars** — 20 lines of code, massive perceptual upgrade to existing cinematic scenes
4. **Procedural SFX parameter ranges** — replace fixed frequency values with `freq + (Math.random() * spread)` across SoundManager; affects every sound in the game
5. **Anticipation frame on player + enemy actions** — 1-2 extra canvas frames per action; highest animation ROI
6. **Alert musical sting** — hooks directly into existing `_onDetection()`; ~30 lines in SoundManager
7. **Animated between-level cinematics** — `BaseCinematicScene` exists; add Timeline choreography and letterbox bars
8. **Idle breathing animation** — 2 frames, long duration; makes all characters feel alive
9. **Fast trailer-style intro showcase** — highest complexity, highest wow factor; build last when primitives are solid

**Defer (out of milestone scope):**
- Ambient environmental loops: Valuable but can land in a subsequent pass; doesn't affect story clarity
- Parallax camera pan during dialogue: Nice-to-have; camera pan API exists but requires careful integration with existing scene camera follow
- Impact freeze on explosions: Boss scene already has elaborate explosion sequence; risk of breaking existing `BossScene.js` disintegration effect (already a fragile area per CONCERNS.md)
- Character voice bleeps: Charming but requires per-scene dialogue refactoring; defer until cinematic structure is settled

---

## Sources

- [Phaser 3 Timeline documentation](https://docs.phaser.io/api-documentation/class/time-timeline) — HIGH confidence, official
- [Phaser 3 Camera Effects](https://rexrainbow.github.io/phaser3-rex-notes/docs/site/camera-effects/) — HIGH confidence, well-maintained community reference
- [Tone.js](https://tonejs.github.io/) — HIGH confidence, official site
- [Phaser 3 + Tone.js audio context integration](https://phaser.discourse.group/t/phaser-3-tonejs-audiocontext/3281) — MEDIUM confidence, community forum; known AudioContext sharing issue
- [Procedural audio with Web Audio API (DEV.to)](https://dev.to/hexshift/how-to-create-procedural-audio-effects-in-javascript-with-web-audio-api-199e) — MEDIUM confidence, verified approach matches existing SoundManager pattern
- [Sprite animation frame count recommendations](https://www.sprite-ai.art/blog/sprite-animation-frames) — MEDIUM confidence, community article; consistent with Celeste/Shovel Knight examples
- [12 animation principles for pixel art](https://www.sprite-ai.art/guides/animation-principles) — MEDIUM confidence, consistent across multiple sources
- [Trance music structure breakdown](https://www.myloops.net/trance-song-structure-breakdown-basics) — MEDIUM confidence, music production reference
- [Trance music production guide](https://blog.landr.com/trance-music-production/) — MEDIUM confidence
- [How to create immersive game intros (GDC via GameAnalytics)](https://www.gameanalytics.com/blog/create-immersive-game-intros) — MEDIUM confidence
- [Mark of the Ninja Wikipedia — cartoon cutscene style](https://en.wikipedia.org/wiki/Mark_of_the_Ninja) — HIGH confidence, factual
- [Procedural audio in video games — Splice](https://splice.com/blog/procedural-audio-video-games/) — MEDIUM confidence
- [PhaserFX game effects library](https://phaser.io/news/2026/01/phaserfx) — MEDIUM confidence, official Phaser news post (Jan 2026)
- Codebase context: `.planning/codebase/ARCHITECTURE.md`, `.planning/codebase/STACK.md`, `.planning/codebase/CONCERNS.md` — HIGH confidence, direct source analysis
