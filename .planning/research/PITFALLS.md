# Domain Pitfalls

**Domain:** Phaser 3 game polish — procedural audio, cinematics, sprite animation
**Researched:** 2026-03-05
**Context:** Subsequent milestone adding cinematic intro, richer audio, and smoother sprites to an existing 6-level Phaser 3 stealth game. Codebase has known structural debt: monolithic scenes (1000-1500+ lines), unbounded audio node creation, no test infrastructure, and procedural texture regeneration on every scene create.

---

## Critical Pitfalls

Mistakes that cause audio corruption, visual artifacts, or full rewrites.

---

### Pitfall 1: Unbounded AudioBufferSourceNode Accumulation

**What goes wrong:**
Every looping WebAudio sound in Phaser 3 creates a new `AudioBufferSourceNode` on each loop end rather than reusing one. In Chrome, these nodes are not garbage-collected while the sound is logically "still playing." Over a session with ambient music that loops 50-100 times, the sound graph grows without bound. Memory climbs to several hundred MB and audio glitches begin. On mobile devices, browsers terminate the tab.

**Why it happens:**
`AudioBufferSourceNode` is a one-shot object by design in the Web Audio API — it can only be `start()`-ed once. Phaser's WebAudioSound implementation creates a fresh node per loop pass. If the old node is not explicitly `stop()`-ed and `disconnect()`-ed before being dereferenced, the browser's GC cannot collect it (Chrome in particular holds strong references through the audio graph). Phaser issue #3895 documents each loop end creating a new node; issue #2280 confirms massive Chrome memory leaks from simultaneous stop-and-disconnect timing.

**Consequences:**
- Rising memory profile throughout a session (visible in Chrome DevTools Memory tab)
- Audio stutter at ~400+ accumulated nodes on mobile (reported after ~3000 SFX plays)
- Browser tab crash on mobile before level 6 is reached
- Adding per-level trance tracks that loop continuously accelerates the leak dramatically

**Warning signs:**
- Chrome DevTools `Detached AudioBufferSourceNode` count rising in heap snapshots
- Audio category in `chrome://tracing` shows growing node count
- `performance.memory.usedJSHeapSize` climbing 1-3 MB per music loop iteration
- Console: `The AudioContext was not allowed to start` on page revisit (context leaked across page loads in dev)

**Prevention:**
1. Call `sound.destroy()` explicitly on every `WebAudioSound` instance when it is no longer needed — do not rely on scene `shutdown` alone, because the SoundManager is global and survives scene transitions.
2. In `MusicManager`/`SoundManager` wrappers, maintain a hard reference set; drain it on track change: call `stop()` then `destroy()` in sequence with a one-frame gap (a single `setTimeout(0)` or `this.time.delayedCall(0, ...)`) to avoid the Chrome simultaneous-stop-disconnect crash (issue #2280).
3. Pool ambient SFX: create N instances at scene boot, cycle through them rather than creating new ones per trigger.
4. Do not use `add.sound()` inside update loops or particle callbacks — this is the most common source of runaway creation.

**Phase mapping:** Address in the audio architecture phase before adding new trance tracks. Retrofitting after adding more music is far harder.

**Sources:**
- [Web Audio Sound memory leak — Phaser issue #2280](https://github.com/phaserjs/phaser/issues/2280)
- [Each loop creates new AudioBufferSourceNode — Phaser issue #3895](https://github.com/photonstorm/phaser/issues/3895)
- [Memory leak in Phaser.Sound using WebAudio — issue #2066](https://github.com/photonstorm/phaser/issues/2066)

---

### Pitfall 2: AudioContext Suspended Before Cinematic Intro Plays

**What goes wrong:**
The animated intro and cinematic scenes play audio immediately on scene load. Browsers (Chrome 71+, Safari, all mobile browsers) suspend the `AudioContext` until a user gesture has been received. If the cinematic begins playing music/narration before the user has clicked or tapped, the audio is silently dropped. The tween sequence completes, but the player hears nothing. On some mobile browsers the warning `The AudioContext was not allowed to start` appears in the console and the context enters a permanent `suspended` state for that session.

**Why it happens:**
The `AudioContext` in Phaser 3 is lazily initialized and resumed on first user interaction. Cinematic scenes that auto-play on game boot (intro logos, story text) execute before any gesture event. The `UNLOCKED` event from `this.sound` fires asynchronously and is not awaited by the scene's tween sequence.

**Consequences:**
- Intro cinematic plays in complete silence on first load
- Per-level trance music never starts on mobile
- Subsequent `sound.play()` calls may also silently fail if the context stays suspended

**Warning signs:**
- `this.sound.locked === true` when cinematic `create()` runs
- Console warning: `AudioContext was not allowed to start`
- Audio works in desktop dev environment but fails on all mobile testing
- Music appears to play (no errors) but `analyserNode` shows flat signal

**Prevention:**
1. Gate all cinematic audio on `this.sound.locked`: listen for `Phaser.Sound.Events.UNLOCKED` before calling `music.play()`.
2. For the intro scene specifically: begin cinematic visuals immediately, but delay audio start with `this.sound.once('unlocked', () => music.play())`. Show a subtle "tap to continue" prompt as a fallback if the gesture hasn't arrived within 2 seconds.
3. Never auto-resume `AudioContext` with synthetic dispatch of click events — this is blocked by current browser policy and will throw.
4. Test on a real mobile device early; the desktop DevTools "mobile simulation" does NOT enforce gesture policy reliably.

**Phase mapping:** Must be addressed in the cinematic intro phase. A failing audio intro is the first thing players experience.

**Sources:**
- [Phaser 3 audio docs — locked property and UNLOCKED event](https://docs.phaser.io/phaser/concepts/audio)
- [AudioContext was not allowed to start — Phaser forum](https://phaser.discourse.group/t/audiocontext-was-not-allowed-to-start/795)
- [Warning: AudioContext not allowed — Phaser forum thread](https://phaser.discourse.group/t/warning-the-audiocontext-was-not-allowed-to-start/1334)

---

### Pitfall 3: Procedural Texture Regeneration on Every Scene Create

**What goes wrong:**
When `Graphics.generateTexture()` is called inside a scene's `create()` method and that scene is restarted or re-entered (e.g., player dies and retries a level), the texture is regenerated from scratch. In the existing codebase this happens for every level scene. The `generateTexture()` call flushes the WebGL pipeline, rasterizes the graphics object off-screen, uploads the bitmap to GPU memory, and discards the previous GPU texture — all in the main thread. On mid-range hardware this adds 100-300ms of jank on scene start. Crucially, the old texture key is overwritten in the TextureManager but the previous GPU allocation may not be freed immediately, causing a spike in VRAM.

**Why it happens:**
Phaser 3's `TextureManager` does not prevent overwriting an existing key — it silently replaces it. Developers who call `generateTexture('my-key', ...)` across scene restarts assume the old texture was freed, but the GPU deallocation is deferred. The underlying `Graphics` object is also expensive to rasterize (each shape is CPU-rendered to a canvas, then uploaded).

**Consequences:**
- Visible frame drop (200-400ms) every time a level loads or restarts
- VRAM usage climbs across level transitions, especially with level progression
- Adding cinematics with new procedural graphics compounds the spike

**Warning signs:**
- Chrome DevTools Performance tab shows a `generateTexture` spike in `create()`
- GPU memory (in `chrome://gpu-internals`) climbs with each level transition
- `TextureManager` console warning (in debug builds): texture key already exists
- Frame times spike to 200ms+ on first frame of each level

**Prevention:**
1. Generate procedural textures exactly once at global boot (in a `Preload` or `Boot` scene), not inside level-specific `create()`.
2. Check existence before generating: `if (!this.textures.exists('key')) { graphics.generateTexture('key', w, h); }` — this prevents regeneration on scene restart.
3. For textures that must vary per level, use a naming scheme (`'wall-level-2'`) so old textures persist and are reused without regeneration.
4. Consider migrating to static PNG assets for backgrounds/tiles that currently use procedural Graphics — the GPU upload cost is the same, but authoring in Texture Packer eliminates runtime CPU cost entirely.
5. Destroy the `Graphics` object after `generateTexture()` — it is no longer needed and occupies memory: `graphics.destroy()`.

**Phase mapping:** Address in a performance/foundation phase before adding cinematic scenes that add even more procedural textures.

**Sources:**
- [Phaser 3 Graphics docs — generateTexture baking advice](https://docs.phaser.io/phaser/concepts/gameobjects/graphics)
- [Rendering performance problem — Phaser forum (3ms to 45ms)](https://phaser.discourse.group/t/rendering-performance-problem/11069)
- [generateTexture always generates same Graphics object — issue #3241](https://github.com/phaserjs/phaser/issues/3241)

---

### Pitfall 4: Simultaneous Particle Tweens Causing Frame Budget Collapse

**What goes wrong:**
With 100+ simultaneous tweens on particle-related game objects, the `TweenManager.update()` call in each game step becomes the dominant CPU cost. The existing codebase already exhibits stuttering at this threshold. Adding cinematic intro effects (text fade-ins, ambient particles, screen overlays) with separate tweens per object pushes the count to 150-200+, dropping frame time from ~6ms to 20-30ms — below 60fps on most hardware.

**Why it happens:**
Phaser's `TweenManager` iterates all active tweens sequentially on every game step. Each tween evaluates its easing function, updates all target properties, and checks completion. There is no batching or instancing. Adding per-particle tweens — which is the naively obvious approach — multiplies the per-step cost linearly.

**Consequences:**
- Cinematic intro stutters visibly during particle flourishes
- Level start transitions feel unpolished despite expensive visual work
- Stuttering disguises itself as "graphical" but is actually CPU/tween budget exhaustion

**Warning signs:**
- Chrome DevTools Performance: `TweenManager.update` > 5ms per frame
- `this.tweens.getTweens().length` in `update()` exceeds 80
- Frame time stable at 60fps in empty rooms, stutters during particles/cinematics
- Particle emitter count multiplied by animation states = number of active tweens

**Prevention:**
1. Do not tween individual particles. Tween only the `ParticleEmitter` properties directly (supported in Phaser 3.60+: `particleAlpha`, `particleScaleX`, etc.) — one tween controls all particles in the emitter.
2. For cinematic text/image sequences, use a single `Timeline` (Phaser 3.60+ `this.add.timeline()`). A Timeline sequences events with one update call, not N separate tweens.
3. Cap total concurrent tweens: audit with `this.tweens.getTweens().length` during development. Set a budget of 30-40 tweens max for gameplay; 20 for cinematics on top.
4. Use `ParticleEmitter.setAlpha()` / `setScale()` property curves instead of tweens for particle lifecycle animation — these are evaluated per-particle internally with no TweenManager overhead.
5. For screen-flash and overlay effects, prefer `this.cameras.main.flash()` and `this.cameras.main.fade()` over tweening a Rectangle alpha — camera effects are a single GPU post-process, not a tween.

**Phase mapping:** Audit and cap in the cinematic intro phase before shipping; re-audit when adding per-level SFX triggers.

**Sources:**
- [Tweens performance — Phaser forum](https://phaser.discourse.group/t/tweens-performance/10930)
- [Phaser 3.60 new Timeline class — GitHub discussion](https://github.com/phaserjs/phaser/discussions/6452)
- [Phaser 3 Tweens concepts](https://docs.phaser.io/phaser/concepts/tweens)

---

## Moderate Pitfalls

---

### Pitfall 5: Scene Transition Flicker and Incomplete Fade-In

**What goes wrong:**
Camera `fadeOut()` into a scene transition and `fadeIn()` in the new scene leaves a 1-2 frame flash of the old scene content, or the new scene appears briefly at full brightness before the fade-in begins. Additionally, after `fadeIn()` completes, the camera sometimes remains slightly tinted (not fully transparent), causing the entire scene to look desaturated until `camera.resetFX()` is called.

**Why it happens:**
The fade effect's duration timer starts at the moment the transition is initiated, not when the target scene's `create()` completes. If the target scene has asset loading or expensive `create()` work, the timer has already elapsed before the scene is visually ready, causing either a visible flash or a missed fade. The incomplete transparency bug (issue #3833) is a known Phaser defect in versions prior to approximately 3.55.

**Consequences:**
- Cinematic transitions between intro, menu, and level scenes look amateurish
- Per-level trance music may start playing during the flash frame before video is ready
- Players on slow hardware (where create() takes longer) see worse artifacts

**Warning signs:**
- Brief white or gameplay-colored frame visible during scene change
- Scene appears slightly gray/desaturated after a fadeIn completes
- Music starts before the fade-in animation does on slow devices

**Prevention:**
1. Use `scene.transition({ target: 'TargetScene', duration: 500, moveBelow: true, onUpdate: ... })` with the `allowInput: false` flag to prevent accidental input during transition.
2. In the incoming scene's `init()`, pre-start the fade: `this.cameras.main.setAlpha(0)` then tween alpha to 1 after `create()` completes. This decouples fade from scene system timer.
3. After any `fadeIn()` call, register `this.cameras.main.once('camerafadeincomplete', () => this.cameras.main.resetFX())` as a safety net.
4. For cinematic-quality transitions, use a dedicated black `Rectangle` overlay that spans the full canvas and tween its alpha — this is not subject to camera effect bugs.
5. Check Phaser version: upgrade to 3.70+ where fade-in transparency bug (#3833) is fixed.

**Phase mapping:** Cinematic intro phase. Validate on slowest target device.

**Sources:**
- [Scene transition with camera fade issue — Phaser forum](https://phaser.discourse.group/t/scene-transition-with-camera-fade-issue/2950)
- [Incomplete camera FadeIn effect — issue #3833](https://github.com/phaserjs/phaser/issues/3833)
- [Camera fading issue — Phaser forum](https://phaser.discourse.group/t/camera-fading-issue/5457)

---

### Pitfall 6: Sound Duplication on Scene Restart

**What goes wrong:**
The global `SoundManager` persists across scene restarts. When `scene.restart()` is called (e.g., player fails a level), any sounds that were added in `create()` via `this.sound.add()` are added again to the same manager, leaving the previous instances still registered. On the third restart, three copies of the ambient loop exist simultaneously. Volume spikes, phasing artifacts appear, and memory usage climbs.

**Why it happens:**
Phaser's SoundManager is attached to the game instance, not the scene. `scene.shutdown` does not automatically destroy sounds created within that scene. The `shutdown` event fires, but sound references linger in the global manager unless the developer explicitly calls `sound.destroy()` or `this.sound.removeAll()`.

**Consequences:**
- Volume of ambient music doubles/triples on level retry
- Audio phasing (two copies of same track slightly out of sync)
- Memory leak proportional to restart count

**Warning signs:**
- Music sounds louder or "wider" after retrying a level
- `this.sound.sounds.length` in console grows with each restart
- SFX triggers produce double-hit sound on first retry

**Prevention:**
1. In every scene's `shutdown` handler, explicitly stop and destroy all locally created sounds:
   ```javascript
   this.events.on('shutdown', () => {
     this.sound.stopAll();
     // OR for targeted cleanup:
     [this.bgMusic, this.ambientSfx].forEach(s => s && s.destroy());
   });
   ```
2. Before `this.sound.add()`, check if the sound already exists: `this.sound.get('key')` returns existing instance — reuse it instead of creating a new one.
3. Treat the SoundManager as a resource pool: create sounds in a dedicated `AudioManager` singleton that is initialized once and checks before adding.

**Phase mapping:** Audio architecture phase. Also affects every level scene — write the pattern once in a base class or shared manager.

**Sources:**
- [Sound duplicates on scene.restart() — Phaser forum](https://phaser.discourse.group/t/sound-duplicates-in-one-scene-when-using-scene-restart/8720)
- [BaseSoundManager docs](https://docs.phaser.io/api-documentation/class/sound-basesoundmanager)

---

### Pitfall 7: Looping Music Gap (HTML5 Audio Fallback)

**What goes wrong:**
On Safari/iOS and in HTML5 Audio fallback mode, looping music has a 100-300ms audible gap at the loop point. This is particularly damaging for trance tracks that depend on a seamless rhythmic loop. The Web Audio path is not affected, but any device that falls back to HTML5 Audio (or any browser that blocks Web Audio initialization, see Pitfall 2) will exhibit the gap.

**Why it happens:**
The HTML5 `<audio>` element's `loop` attribute is browser-implementation-dependent. When the element reaches the end, the browser must seek back to position 0 and decode the next chunk — this introduces latency. The Web Audio API's `AudioBufferSourceNode.loop` property performs a true sample-accurate loop with no gap, which is why the two paths differ.

**Consequences:**
- Immersion-breaking click or silence on every bar of trance music on iOS
- Cannot be fixed by changing audio files — it is a browser mechanism

**Warning signs:**
- Loop gap appears in Safari desktop but not Chrome
- `this.sound.soundManager instanceof Phaser.Sound.HTML5AudioSoundManager` evaluates true
- Gap is consistent at ~200ms regardless of audio file format

**Prevention:**
1. Force Web Audio by ensuring the `AudioContext` is unlocked before first play (see Pitfall 2). If Web Audio is available and unlocked, Phaser uses it automatically.
2. For audio files used in seamless loops, use audio sprites (`audioSprite` with markers) — the HTML5AudioSoundManager has a built-in `loopEndOffset` tweak for gapless looping, but it requires per-browser calibration.
3. Alternatively, implement dual-buffer looping: pre-schedule the next `AudioBufferSourceNode` to start at the exact sample where the current one ends. This is Phaser's internal Web Audio behavior but must be replicated manually for the HTML5 fallback.
4. Accept the HTML5 fallback limitation for iOS and use shorter loop points (4-bar instead of 8-bar) to make gaps less perceptible rhythmically.

**Phase mapping:** Audio engineering phase when implementing per-level trance tracks.

**Sources:**
- [Seamless audio loops in Phaser — html5gamedevs forum](https://www.html5gamedevs.com/topic/19711-seamless-audio-loops-in-phaser/)
- [Can looping be seamless? — Howler.js issue #39](https://github.com/goldfire/howler.js/issues/39)

---

### Pitfall 8: Global Animation Key Collisions Across Scenes

**What goes wrong:**
Phaser's `AnimationManager` is global (game-level, not scene-level). When two scenes both call `this.anims.create({ key: 'walk', ... })` and one scene is visited after another, the second `create()` call silently overwrites the first animation's frame data. If the two scenes use different spritesheets with the same logical key (e.g., enemy 'walk' animation in level 1 vs level 2 sprites), the wrong frames play in the wrong scene.

**Why it happens:**
Developers treat scene `create()` as an isolated context. The animation manager is shared and does not emit a warning for key overwriting by default (though a console warn exists in debug builds). Monolithic scene files that define all animations locally amplify this — every scene re-declares the same keys.

**Consequences:**
- Level 2 character plays level 1 animation frames (visual glitch, hard to debug)
- Adding new animated sprites for cinematic scenes risks stomping gameplay animations
- Debugging requires a heap snapshot or manual `this.anims.get('key')` inspection

**Warning signs:**
- Animation plays wrong frames after visiting a certain scene order
- Console (debug mode): `Animation with key: 'X' already exists`
- `this.anims.exists('key')` returns true at scene start when no animation should exist yet

**Prevention:**
1. Prefix all animation keys with a scene or character namespace: `'level1-enemy-walk'`, `'cinematic-intro-logo'`.
2. Guard every `anims.create()` call: `if (!this.anims.exists(key)) { this.anims.create(...); }`.
3. For cinematics that reuse character sprites, explicitly define whether they share the global animation or create a local one (`sprite.anims.create()` creates a local animation that does not collide).
4. Create a centralized `AnimationRegistry` that lists all keys and is called once at boot — this makes collisions detectable at startup rather than at runtime during play.

**Phase mapping:** Sprite animation enhancement phase; also review when implementing cinematic intro if any game characters appear.

**Sources:**
- [Phaser 3 Animations concepts — global vs local](https://docs.phaser.io/phaser/concepts/animations)
- [Troubleshooting Phaser: animation bugs — mindfulchase.com](https://www.mindfulchase.com/explore/troubleshooting-tips/game-development-tools/troubleshooting-phaser-fixing-asset-loading,-scene-transitions,-animation-bugs,-physics-errors,-and-browser-compatibility.html)

---

### Pitfall 9: Old Timeline API vs New Timeline API Confusion (Phaser 3.55 vs 3.60)

**What goes wrong:**
Phaser 3.55 and earlier had a `TweenManager.timeline()` that was removed in 3.60 due to endemic timing bugs. Phaser 3.60 introduced a new `this.add.timeline()` (a first-class `Timeline` game object). Code examples from tutorials, Stack Overflow answers, and community forum posts dated before 2022 use the old API. Cinematic sequence code written using the old API will silently produce timing bugs or throw runtime errors on Phaser 3.60+.

**Why it happens:**
Breaking change with the same surface-level concept. `this.tweens.timeline()` (old) vs `this.add.timeline()` (new) look similar but work completely differently. Additionally, the new Timeline's `timeScale` does not propagate to its child tweens — each child tween must have its own `timeScale` set independently.

**Consequences:**
- Cinematic sequences with multiple staged events drift out of sync
- Copy-pasted tutorial code throws `this.tweens.timeline is not a function`
- `timeScale` changes for cinematic slow-motion/fast-forward effects only affect the Timeline, not its tweens — causing desynchronization

**Warning signs:**
- `TypeError: this.tweens.timeline is not a function` at cinematic scene create
- Tweens inside a Timeline start at the wrong time relative to other events
- Slow-motion effect applied to Timeline does not slow down tween animations within it

**Prevention:**
1. Use `this.add.timeline([...events])` for all new cinematic sequencing (Phaser 3.60+ API). Never use `this.tweens.timeline()`.
2. When applying `timeScale` to a Timeline, also apply it to every tween inside: `timeline.getAt(i).timeScale = n`.
3. For simple tween sequences, prefer `this.tweens.chain([...])` (also 3.60+) over Timeline — it is simpler and timeScale propagation is less surprising.
4. Lock the Phaser version in `package.json` with an exact version string (not `^3.x`) to prevent accidental upgrades that re-introduce API differences.

**Phase mapping:** Cinematic intro phase — all sequence work should use the 3.60+ API from day one.

**Sources:**
- [Phaser v3.60 Beta 23 — Timeline and TweenChain changes](https://github.com/phaserjs/phaser/discussions/6452)
- [Timeline API docs — Phaser 3](https://docs.phaser.io/api-documentation/class/time-timeline)
- [Chaining multiple tweens — Phaser forum](https://phaser.discourse.group/t/chaining-multiple-tweens/960)

---

## Minor Pitfalls

---

### Pitfall 10: Monolithic Scene Files Blocking Cinematic Parallelism

**What goes wrong:**
Adding cinematics to 1000-1500 line scene files creates merge conflicts and logic tangles. Cinematic state machines (isPlaying, isPaused, isSkipped) become entangled with gameplay state. Scene `update()` grows a long chain of `if (this.cinematicPhase === 3)` conditions that are impossible to test.

**Prevention:**
Extract cinematic logic into a `CinematicController` class that the scene instantiates. The controller owns its own tween sequences, event subscriptions, and cleanup. The scene delegates to it with a simple interface: `this.cinematic.play()`, `this.cinematic.skip()`, `this.cinematic.on('complete', ...)`.

**Phase mapping:** Establish the pattern in the cinematic intro phase before it propagates to level scenes.

---

### Pitfall 11: RenderTexture Maximum Dimension Exceeded on Mobile

**What goes wrong:**
Procedurally generated backgrounds or cinematic overlays rendered to `RenderTexture` objects exceed mobile GPU texture limits (2048px on older devices). The texture renders as black or corrupt on mobile while appearing correct on desktop.

**Prevention:**
Cap `RenderTexture` dimensions at 2048x2048 for mobile targets. For full-screen effects on a 1920x1080 canvas, scale the render texture to canvas size only on desktop; use a 1024x1024 version on mobile detected via `this.sys.game.device.os.android` or `ios`. Alternatively, use camera post-processing effects instead of render textures for full-screen overlays.

**Phase mapping:** Cinematic intro phase if any full-screen procedural visuals are planned.

**Sources:** [How I optimized my Phaser 3 action game — 2025, Medium](https://phaser.io/news/2025/03/how-i-optimized-my-phaser-3-action-game-in-2025)

---

### Pitfall 12: Shutdown vs Destroy Confusion Leaving Data Manager Stale

**What goes wrong:**
A scene that is `sleep()`-ed (not `stop()`-ed or `remove()`-ed) retains its Data Manager contents. If a cinematic scene is put to sleep and re-woken with different game state, it reads stale values from its previous run.

**Prevention:**
Listen for the `shutdown` event and call `this.data.reset()` explicitly. Do not use `sleep()` for scenes that need clean initialization on every activation — use `stop()` / `start()` instead. Reserve `sleep()` only for persistent HUD or overlay scenes that intentionally retain state.

**Phase mapping:** Relevant if cinematic scenes are implemented as persistent overlays that sleep between levels.

**Sources:** [Data Manager docs — Phaser](https://docs.phaser.io/phaser/concepts/data-manager)

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|---|---|---|
| Audio architecture refactor | Unbounded AudioBufferSourceNode accumulation (Pitfall 1) | Explicit destroy() in MusicManager; pool ambient SFX |
| Cinematic intro scene | AudioContext suspended before gesture (Pitfall 2) | Gate all audio on UNLOCKED event; tap-to-continue fallback |
| Cinematic intro scene | Old vs new Timeline API confusion (Pitfall 9) | Use `this.add.timeline()` exclusively; lock Phaser version |
| Cinematic intro scene | Scene transition flicker (Pitfall 5) | Manual alpha-tween overlay; call resetFX() after fadeIn |
| Cinematic intro scene | RenderTexture dimension on mobile (Pitfall 11) | Cap at 2048px; test on real device early |
| Per-level trance tracks | Looping music gap on iOS/HTML5 fallback (Pitfall 7) | Ensure Web Audio unlock before play; use audio sprites |
| Per-level SFX additions | Sound duplication on scene restart (Pitfall 6) | Explicit destroy in shutdown handler; check before add |
| Sprite animation enhancement | Global animation key collision (Pitfall 8) | Prefix all keys; use anims.exists() guard |
| Polish particles/cinematics | Simultaneous tween budget exhaustion (Pitfall 4) | Tween ParticleEmitter not particles; use Timeline; budget 30 tweens |
| Level scene refactor | Procedural texture regeneration (Pitfall 3) | Generate once at boot; guard with textures.exists() |
| Any scene with cinematics | Monolithic scene blocking parallel work (Pitfall 10) | CinematicController class extracted from scene |

---

## Sources

- [Phaser issue #2280 — Web Audio Sound memory leak (Chrome)](https://github.com/phaserjs/phaser/issues/2280)
- [Phaser issue #3895 — Each loop creates new AudioBufferSourceNode](https://github.com/photonstorm/phaser/issues/3895)
- [Phaser issue #2066 — Memory leak in Phaser.Sound using WebAudio](https://github.com/photonstorm/phaser/issues/2066)
- [Phaser issue #3833 — Incomplete camera FadeIn effect](https://github.com/phaserjs/phaser/issues/3833)
- [Phaser issue #6558 — WebAudioSound destroy causes crash](https://github.com/phaserjs/phaser/issues/6558)
- [Phaser issue #4933 — ScaleManager events not removed after scene.remove()](https://github.com/phaserjs/phaser/issues/4933)
- [Phaser issue #3241 — generateTexture always generates same Graphics object](https://github.com/phaserjs/phaser/issues/3241)
- [Phaser v3.60 Beta 23 — Timeline, TweenChain, ParticleEmitter changes](https://github.com/phaserjs/phaser/discussions/6452)
- [Phaser 3 audio docs — locked property and UNLOCKED event](https://docs.phaser.io/phaser/concepts/audio)
- [Phaser 3 Graphics docs — generateTexture baking](https://docs.phaser.io/phaser/concepts/gameobjects/graphics)
- [Phaser 3 Animations docs](https://docs.phaser.io/phaser/concepts/animations)
- [Timeline API docs](https://docs.phaser.io/api-documentation/class/time-timeline)
- [Sound duplicates on scene.restart() — Phaser forum](https://phaser.discourse.group/t/sound-duplicates-in-one-scene-when-using-scene-restart/8720)
- [Scene transition with camera fade — Phaser forum](https://phaser.discourse.group/t/scene-transition-with-camera-fade-issue/2950)
- [Tweens performance — Phaser forum](https://phaser.discourse.group/t/tweens-performance/10930)
- [How I optimized my Phaser 3 action game — 2025](https://phaser.io/news/2025/03/how-i-optimized-my-phaser-3-action-game-in-2025)
- [Seamless audio loops in Phaser — html5gamedevs](https://www.html5gamedevs.com/topic/19711-seamless-audio-loops-in-phaser/)
- [AudioContext was not allowed to start — Phaser forum](https://phaser.discourse.group/t/audiocontext-was-not-allowed-to-start/795)
- [Rendering performance problem — Phaser forum](https://phaser.discourse.group/t/rendering-performance-problem/11069)
- [Data Manager docs — Phaser](https://docs.phaser.io/phaser/concepts/data-manager)
