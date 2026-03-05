# Architecture Patterns

**Domain:** Phaser 3 game — cinematic polish milestone (cinematics, per-level audio, richer SFX, more animation frames)
**Researched:** 2026-03-05
**Question:** How should cinematic sequences, per-level music themes, and richer SFX integrate with the existing Phaser 3 scene/manager architecture?

---

## Recommended Architecture

The core principle is **pass-through orchestration**: scenes never produce sound or manage timing themselves — they call into singletons (MusicManager, SoundManager) and drive timelines through a CinematicDirector helper. The existing singleton pattern for MusicManager and SoundManager is correct; extend it rather than replace it.

```
┌─────────────────────────────────────────────────────┐
│                   Phaser Game                        │
│                                                      │
│  ┌──────────────┐   ┌─────────────────────────────┐ │
│  │  Scene Stack │   │      Global Singletons       │ │
│  │              │   │                              │ │
│  │ BaseCinematic│──▶│  MusicManager (Web Audio)    │ │
│  │    Scene     │   │  - theme registry            │ │
│  │              │   │  - GainNode crossfader       │ │
│  │  LevelIntro  │──▶│  - per-level theme config    │ │
│  │    Scene     │   │                              │ │
│  │              │   │  SoundManager (Web Audio)    │ │
│  │  ShowcaseIn  │──▶│  - SFX variant pool          │ │
│  │  troScene    │   │  - random pitch/pan          │ │
│  │              │   └─────────────────────────────┘ │
│  │  Boss Scene  │                                    │
│  └──────┬───────┘   ┌─────────────────────────────┐ │
│         │           │  TextureRegistry (canvas)    │ │
│         │           │  - procedural atlas cache    │ │
│         └──────────▶│  - addSpriteSheet() frames   │ │
│                     └─────────────────────────────┘ │
│                                                      │
│  ┌─────────────────────────────────────────────────┐ │
│  │  CinematicDirector (Scene Plugin or helper)     │ │
│  │  - wraps Phaser Time.Timeline                   │ │
│  │  - provides: showSprite, moveTo, fadeIn,        │ │
│  │    playMusic, playSfx, typeText, wait           │ │
│  │  - consumed by all cinematic scenes             │ │
│  └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

---

## Component Boundaries

| Component | Responsibility | Communicates With | Does NOT Own |
|-----------|---------------|-------------------|--------------|
| **BaseCinematicScene** | Base class for all cutscene scenes. Lifecycle hooks (enter, play, exit). Delegates to CinematicDirector. | CinematicDirector, MusicManager, SoundManager | Tween logic, audio nodes, texture generation |
| **ShowcaseIntroScene** | Animated intro sequence — moving sprites, logo reveal, title card. Extends BaseCinematicScene. | CinematicDirector, TextureRegistry | Music theme selection (asks MusicManager) |
| **LevelIntroScene** | Between-level cinematic with moving sprites and level title. Receives level config via `scene.start(key, data)`. | CinematicDirector, MusicManager (crossfade call), SoundManager | Level gameplay state |
| **CinematicDirector** | Thin orchestration layer over `this.time.addEvent` / Phaser `Time.Timeline`. Exposes a fluent or config-array API for cinematic beats. One instance per cinematic scene. | Phaser Time.Timeline, scene's display list | Audio — it calls MusicManager/SoundManager via references passed in |
| **MusicManager** (existing, extend) | Owns the Web Audio context and all oscillator/node graphs. Adds: theme registry keyed by level ID, crossfade method (equal-power GainNode ramp), per-theme BPM/layer config. | Web Audio API (AudioContext, GainNode) | Scene lifecycle, Phaser objects |
| **SoundManager** (existing, extend) | Owns SFX oscillator banks. Adds: SFX variant pool per event type, randomized pitch offset (±semitones), optional stereo pan spread. | Web Audio API | Scene state |
| **TextureRegistry** (new utility) | Central cache for procedurally generated canvas textures. Wraps existing utils/generators. Calls `scene.textures.addSpriteSheet()` so any scene can reference frames by key. Generated once at boot, reused everywhere. | Phaser TextureManager, existing canvas generators | Scene display lists |
| **GameIntroScene / existing scenes** | No change to responsibility. Calls MusicManager.playTheme(themeId) instead of whatever internal method exists today. | MusicManager, SoundManager | Animation sequencing (delegates to CinematicDirector) |

---

## Data Flow

### Cinematic Playback Flow

```
Scene.create()
  │
  ▼
CinematicDirector.build([
  { at: 0,    action: 'fadeIn',     target: logoSprite },
  { at: 800,  action: 'moveTo',     target: shipSprite, x: 400, y: 300 },
  { at: 1200, action: 'playTheme',  themeId: 'intro' },
  { at: 2000, action: 'typeText',   text: 'LEVEL 1' },
  { at: 4000, action: 'complete' }
])
  │
  ▼
Phaser Time.Timeline (schedules callbacks at absolute ms offsets)
  │
  ├── Tween chain (position/alpha/scale via this.tweens.chain)
  ├── MusicManager.crossfadeTo(themeId, durationMs)
  └── SoundManager.playSfx(eventId)
```

**Direction:** Scene → CinematicDirector → Phaser Timeline + Tween chains + Manager calls. Managers never call back into scenes (one-way).

### Music Theme Crossfade Flow

```
LevelIntroScene.create(data: { levelId })
  │
  └─▶ MusicManager.crossfadeTo(levelId, 2000)
        │
        ├── look up levelId in themeRegistry → { layers: [...], bpm: 138 }
        ├── rampOut(currentGainNode, 2000ms)   ← AudioParam.linearRampToValueAtTime
        ├── start new oscillator graph for new theme
        └── rampIn(newGainNode, 2000ms)        ← equal-power curve to avoid dip
```

**Direction:** Scene → MusicManager. MusicManager is fully self-contained. No callbacks to scene needed.

### Texture / Animation Frame Flow

```
BootScene.create()
  │
  └─▶ TextureRegistry.generateAll(scene)
        │
        ├── existing generator functions (utils/generators/*.js)
        ├── draws to OffscreenCanvas (or regular canvas)
        └── scene.textures.addSpriteSheet(key, canvas, { frameWidth, frameHeight })
                │
                └── Phaser TextureManager stores frames
                    Any scene: this.anims.create({ key, frames: this.anims.generateFrameNumbers(key, ...) })
```

**Direction:** Boot → TextureRegistry → Phaser TextureManager. All scenes downstream read frames from TextureManager by key.

### Scene Transition Flow

```
GameplayScene (finishes level)
  │
  ├── MusicManager.crossfadeTo('level-intro', 1500)
  └── scene.start('LevelIntroScene', { levelId, nextScene: 'Level2Scene' })
        │
        └── LevelIntroScene.shutdown()
              └── scene.start(data.nextScene)
                    └── MusicManager.crossfadeTo(levelThemes[levelId], 2000)
```

Level ID is passed as `data` through `scene.start(key, data)`. MusicManager theme key is derived from level ID in the scene — scenes own the mapping lookup, not the manager.

---

## Patterns to Follow

### Pattern 1: Time.Timeline for All Cinematic Beats (not Tweens.Timeline)

**What:** Use `this.time.addTimeline({ events: [...] })` (Phaser 3.60+ `Time.Timeline`) to schedule every cinematic beat at an absolute millisecond offset. Tween-specific sequencing uses `this.tweens.chain([...])`.

**Why:** Tweens.Timeline was removed in Phaser 3.60 due to timing bugs. Time.Timeline is the replacement for general event sequencing; tween chains handle tween-only sequences. Mixing them correctly avoids race conditions.

**When:** Any cinematic scene with more than one timed event.

```javascript
// In BaseCinematicScene or CinematicDirector
play(beats) {
  const timeline = this.scene.time.addTimeline({
    events: beats.map(beat => ({
      at: beat.at,
      run: () => this._executeBeat(beat)
    })),
    onComplete: () => this.onCinematicComplete()
  });
  timeline.play();
  return timeline;
}
```

### Pattern 2: Equal-Power Crossfade in MusicManager

**What:** When switching themes, ramp out the current GainNode and ramp in the new one using a cosine/equal-power curve instead of linear.

**Why:** Linear crossfade produces a perceived volume dip at the midpoint. Equal-power curves keep loudness constant throughout. This is especially audible on procedural trance tracks with sustained harmonics.

```javascript
// In MusicManager
crossfadeTo(themeId, durationMs = 2000) {
  const ctx = this._audioContext;
  const now = ctx.currentTime;
  const durationSec = durationMs / 1000;

  // Ramp out current
  this._masterGain.gain.setValueAtTime(this._masterGain.gain.value, now);
  this._masterGain.gain.linearRampToValueAtTime(0, now + durationSec * 0.5);

  // Start new theme graph
  this._startThemeGraph(themeId);

  // Equal-power ramp in on new gain node
  const newGain = this._newThemeGain;
  newGain.gain.setValueAtTime(0, now);
  newGain.gain.linearRampToValueAtTime(1, now + durationSec);

  this._masterGain = newGain;
}
```

### Pattern 3: Scene Registry for Level-to-Theme Mapping

**What:** Store the level→themeId mapping in `this.game.registry` (Phaser's built-in cross-scene DataManager) so MusicManager does not need a scene reference and scenes do not hard-code theme IDs.

**Why:** Registry is the idiomatic Phaser cross-scene store. It avoids passing objects through scene.start data payloads while keeping MusicManager decoupled.

```javascript
// In BootScene
this.registry.set('levelThemes', {
  level1: 'theme-desert',
  level2: 'theme-space',
  boss:   'theme-boss'
});

// In LevelIntroScene
const themeId = this.registry.get('levelThemes')[this.data.levelId];
MusicManager.getInstance().crossfadeTo(themeId);
```

### Pattern 4: SFX Variant Pool in SoundManager

**What:** For each logical SFX event (explosion, pickup, jump), register an array of slight parameter variants (frequency offset, ADSR variation, pan offset). On play, pick one at random.

**Why:** Repetitive identical SFX is a key polish differentiator. Variety pool avoids needing to hand-craft many unique sounds; procedural variation achieves perceived richness cheaply.

```javascript
// In SoundManager
registerVariants(eventId, variantConfigs) {
  this._variants[eventId] = variantConfigs; // [{freq: 440, pan: -0.1}, ...]
}

playSfx(eventId) {
  const variants = this._variants[eventId];
  const v = variants[Math.floor(Math.random() * variants.length)];
  this._playOscillator(v);
}
```

### Pattern 5: TextureRegistry Generates Once at Boot

**What:** All procedural canvas textures are generated during BootScene (or a dedicated PreloadScene) and registered with Phaser's TextureManager. Subsequent scenes reference textures by string key only.

**Why:** Canvas generation is CPU-intensive. Doing it mid-scene causes jank. Boot is the correct place; Phaser's TextureManager caches the result for the game's lifetime.

```javascript
// In TextureRegistry (new utility class)
generateAll(scene) {
  SPRITE_CONFIGS.forEach(cfg => {
    const canvas = generateSpriteCanvas(cfg); // existing utils/generators fn
    scene.textures.addSpriteSheet(cfg.key, canvas, {
      frameWidth:  cfg.frameWidth,
      frameHeight: cfg.frameHeight
    });
  });
}
```

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Cinematic Logic Inline in Scene Files

**What:** Putting tween/timeline orchestration directly in LevelIntroScene.create(), ShowcaseIntroScene.create(), etc., with no extraction.

**Why bad:** BossScene is already 1577 lines. Every new cinematic scene will replicate the same tween-chaining boilerplate, making the timing logic impossible to read or test in isolation. When Phaser updates its Timeline API (as it did in 3.60), every scene file needs patching.

**Instead:** CinematicDirector encapsulates all timeline/tween orchestration. Scenes declare *what* to show, not *how* to sequence it.

### Anti-Pattern 2: MusicManager Receiving Scene References

**What:** Passing `this` (the scene) into MusicManager.playTheme(scene, themeId) so MusicManager can fire events back or read scene state.

**Why bad:** Creates circular dependency. MusicManager becomes coupled to scene lifecycle — if a scene shuts down, MusicManager breaks. The existing singleton must remain scene-agnostic.

**Instead:** MusicManager is fully self-contained. Scenes call in; managers never call out to scenes. Use Phaser's global event emitter (`this.game.events`) for any reverse communication if absolutely required.

### Anti-Pattern 3: Generating Textures in Multiple Scenes

**What:** Calling canvas generator functions inside preload() or create() of individual scenes (LevelIntroScene, ShowcaseIntroScene, etc.) to produce their required textures.

**Why bad:** The same canvas generation runs multiple times, burning CPU. On slower devices this causes visible frame drops at scene transitions. Phaser will also silently overwrite an existing texture key if called a second time, which causes subtle rendering bugs.

**Instead:** TextureRegistry.generateAll() in BootScene. Every other scene reads by key.

### Anti-Pattern 4: Using Tweens.Timeline (Pre-3.60 API)

**What:** Using `this.tweens.timeline({...})` for cinematic sequencing.

**Why bad:** Tweens.Timeline was removed entirely in Phaser 3.60 due to timing bugs. Code using it will silently break on modern Phaser or produce unreliable timing.

**Instead:** `this.time.addTimeline()` for general event sequencing + `this.tweens.chain()` for tween-only sequences.

### Anti-Pattern 5: Per-Level Theme as Separate AudioContext

**What:** Creating a new `new AudioContext()` for each level's music theme.

**Why bad:** Browsers have a hard limit (~6) on concurrent AudioContext instances. Creating contexts at level transitions hits this limit and causes audio to fail silently.

**Instead:** Single AudioContext in MusicManager for the game's lifetime. Swap node graphs (oscillators, GainNodes) within it for theme changes.

---

## Scalability Considerations

| Concern | Current (1-5 levels) | At 10+ levels | Notes |
|---------|----------------------|---------------|-------|
| Music themes | One AudioContext, one active graph | Same — GainNode crossfade handles N themes | Theme registry config stays flat |
| SFX variety | Small variant pool per event | Variant pool grows linearly — no structural change | Keep variant count ≤ 8 per event for memory |
| Cinematic scenes | BaseCinematicScene + 2-3 subclasses | Each level adds one LevelIntroScene — all reuse CinematicDirector | Scene files stay thin if director pattern holds |
| Texture frames | All generated at boot | Boot time grows; may need lazy generation per level | Flag for phase research if >50 unique sprite configs |
| Scene file size | BossScene 1577 lines is a warning sign | Component extraction needed before adding more logic | Priority: extract from BossScene before milestone adds more |

---

## Suggested Build Order

Dependencies drive this order. Later steps require earlier steps to be stable.

```
1. TextureRegistry (no dependencies)
   └── generates frames all other components need at boot

2. MusicManager extensions (no scene dependencies)
   ├── theme registry + crossfade method
   └── per-level config object

3. SoundManager extensions (no scene dependencies)
   └── variant pool + randomised playback

4. CinematicDirector (depends on: Phaser Time.Timeline API, MusicManager, SoundManager refs)
   └── core sequencing abstraction all cinematic scenes use

5. BaseCinematicScene refactor (depends on: CinematicDirector)
   └── moves existing typewriter logic into director pattern

6. ShowcaseIntroScene (depends on: BaseCinematicScene, TextureRegistry, MusicManager)
   └── new scene, no existing code to break

7. LevelIntroScene (depends on: BaseCinematicScene, MusicManager crossfade, TextureRegistry)
   └── replaces or augments existing between-level transitions

8. BossScene / existing large scenes (optional in this milestone)
   └── extract components opportunistically, do not rewrite wholesale
```

**Rationale for this order:**
- TextureRegistry first because frames are needed by cinematic scenes; generating them late causes boot-order bugs.
- Manager extensions before scenes because scenes import managers, not the reverse.
- CinematicDirector before any cinematic scene; no scene should inline timeline logic.
- New scenes (Showcase, LevelIntro) before touching existing large scenes; de-risk by adding rather than modifying until the pattern is proven.

---

## Component Dependency Graph

```
TextureRegistry ◄──────────────────────────────────┐
MusicManager    ◄─────────────────────────┐         │
SoundManager    ◄──────────────┐          │         │
                               │          │         │
CinematicDirector ─────────────┴──────────┘         │
       │                                            │
BaseCinematicScene ─────────────────────────────────┘
       │
       ├── ShowcaseIntroScene
       ├── LevelIntroScene
       └── (future cinematic scenes)

Phaser SceneManager ──▶ all scenes (framework-managed)
Phaser Time.Timeline ──▶ CinematicDirector (consumed)
Phaser TextureManager ──▶ TextureRegistry (writes) + all scenes (reads)
```

---

## Sources

- [Phaser 3 Scenes concepts](https://docs.phaser.io/phaser/concepts/scenes) — official docs, scene lifecycle, launch vs start
- [Time.Timeline API](https://docs.phaser.io/api-documentation/class/time-timeline) — official, current replacement for Tweens.Timeline
- [Phaser 3.60 Tweens.Timeline removal discussion](https://github.com/phaserjs/phaser/discussions/6452) — HIGH confidence, official release notes
- [Cross-scene singleton pattern](https://phaser.discourse.group/t/any-tips-for-making-a-cross-scene-manager-singleton/4578) — MEDIUM confidence, community verified
- [Phaser Registry for cross-scene data](https://blog.ourcade.co/posts/2020/phaser3-how-to-communicate-between-scenes/) — MEDIUM confidence, community article
- [Web Audio API game audio patterns](https://web.dev/webaudio-games/) — HIGH confidence, official Google/web.dev
- [Equal-power crossfade theory](https://webaudioapi.com/book/Web_Audio_API_Boris_Smus_html/ch03.html) — HIGH confidence, canonical Web Audio API book
- [GainNode crossfade scheduling](https://developer.mozilla.org/en-US/docs/Web/API/GainNode) — HIGH confidence, MDN official docs
- [Phaser texture atlas and addSpriteSheet()](https://docs.phaser.io/phaser/concepts/textures) — HIGH confidence, official docs
- [Refactoring Phaser components into classes](https://jingchaoyu.medium.com/refining-our-phaser-game-part-1-refactoring-components-into-their-own-classes-3c748da67afa) — LOW confidence, single community article
- [Dynamic Music in Games using WebAudio](https://cschnack.de/blog/2020/webaudio/) — MEDIUM confidence, technical blog post
