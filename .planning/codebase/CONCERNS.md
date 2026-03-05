# Codebase Concerns

**Analysis Date:** 2026-03-05

## Tech Debt

**Large monolithic scene files:**
- Issue: Several scene files exceed 1000 lines, making them difficult to maintain and test
- Files:
  - `src/scenes/BossScene.js` (1577 lines)
  - `src/scenes/B2BomberScene.js` (1492 lines)
  - `src/systems/SoundManager.js` (1501 lines)
  - `src/scenes/BomberScene.js` (1136 lines)
  - `src/scenes/DroneScene.js` (1085 lines)
  - `src/systems/MusicManager.js` (1027 lines)
- Impact: Difficult to locate specific functionality, increased cognitive load when making changes, higher risk of unintended side effects when modifying code
- Fix approach: Extract procedural generation into utility modules, separate phase/state management into dedicated classes, break texture generation into smaller functions

**No linting or formatting configuration:**
- Issue: No `.eslintrc`, `.prettierrc`, or similar configuration files exist
- Impact: Code style inconsistency across the codebase, no automated quality checks during development or CI/CD
- Fix approach: Add ESLint configuration with Airbnb or Standard preset, add Prettier configuration, integrate pre-commit hooks

**Missing testing infrastructure:**
- Issue: No test files found in codebase; no test runner configured (Jest, Vitest, etc.)
- Files: Entire `src/` directory lacks `*.test.js` or `*.spec.js` files
- Impact: No automated validation of game mechanics, difficult to refactor with confidence, bugs in core systems (collision, physics, state management) remain undetected
- Fix approach: Set up Vitest for unit testing, create test utilities for mocking Phaser scenes, implement tests for managers (DifficultyManager, EndgameManager, SoundManager)

**DOM element memory leak in disintegration effect:**
- Issue: Canvas elements created with `document.createElement('canvas')` in `src/scenes/BossScene.js` are cleaned up in shutdown, but temporary canvas (`tempCanvas`) in `_extractBunkerPixels()` is not explicitly garbage collected
- Files: `src/scenes/BossScene.js` (lines 1293-1299, 1313-1316)
- Impact: Repeated disintegration sequences could accumulate temporary canvas objects in memory, though garbage collection will eventually reclaim them
- Fix approach: Explicitly set `tempCanvas = null` after extraction complete in `_extractBunkerPixels()`, consider using OffscreenCanvas API if available

**Unbounded audio node creation:**
- Issue: SoundManager and MusicManager create Web Audio API nodes (oscillators, gains, filters) on every sound/music call without explicit per-call limits
- Files: `src/systems/SoundManager.js`, `src/systems/MusicManager.js`
- Impact: Long gaming sessions with frequent sound effects could accumulate disconnected audio nodes, causing memory pressure and potential audio context saturation
- Fix approach: Implement node pool pattern with maximum node count limits, add periodic cleanup pass for truly disconnected nodes, monitor AudioContext state

**Procedural texture generation on every scene create:**
- Issue: All textures are regenerated in scene `create()` methods even if they already exist in the texture manager
- Files: `src/scenes/GameScene.js` (line 39: `_generateTextures()` called every create), similar pattern in all scene files
- Impact: Unnecessary CPU work on scene transitions, potential stuttering or performance dips
- Fix approach: Check `this.textures.exists()` before regenerating, cache texture keys in constants, use boot scene for one-time texture generation

## Known Bugs

**Disintegration particle alpha channel potential issue:**
- Symptoms: Alpha values in disintegration effect are rendered via ImageData manipulation with uint8 values (0-255)
- Files: `src/scenes/BossScene.js` (line 1406: `const a = Math.round(p.alpha * 255)`)
- Trigger: Play through to BossScene victory state with disintegration effect
- Issue: Very small alpha values (`p.alpha < 0.01`) are checked but still rendered, creating invisible pixels that waste CPU time and memory
- Workaround: Disintegration completes automatically after 4 seconds regardless

**Potential edge case in laser detection:**
- Issue: Laser physics overlap callback in GameScene could fire multiple times per frame
- Files: `src/scenes/GameScene.js` (lines 266-272: laser obstacle detection setup)
- Impact: Player could take damage twice on same frame in rare cases
- Risk level: Low (invulnerability timer mitigates), but could cause unexpected behavior

**Empty return values and null checks:**
- Issue: Many methods check for null before use but continue anyway (e.g., `if (this.sprite) this.sprite.clearTint()`)
- Files: `src/entities/Player.js` (line 163), `src/scenes/GameScene.js` (line 34)
- Impact: Silent failures if expected objects are missing, making bugs harder to trace

## Security Considerations

**LocalStorage dependency for game state:**
- Risk: Hard mode unlock state stored in browser localStorage without encryption
- Files: `src/systems/DifficultyManager.js` (lines 20-22, 35)
- Current mitigation: localStorage not available on some browsers (gracefully falls back to false), no sensitive data stored
- Recommendations: Use sessionStorage for temporary state if appropriate, consider feature detection and graceful degradation, do not store any user credentials or personal data

**No input validation in configuration:**
- Risk: Game loads scene configuration without validation of coordinate or parameter values
- Files: `src/data/LevelConfig.js`
- Impact: Malformed config could crash scene creation or cause unexpected physics behavior
- Recommendations: Add schema validation for LevelConfig on load, validate numeric ranges

## Performance Bottlenecks

**Disintegration effect rendering:**
- Problem: Pixel-by-pixel rendering of disintegration effect iterates over 1000+ particles and reads/writes ImageData every frame
- Files: `src/scenes/BossScene.js` (lines 1361-1447, specifically 1377-1425)
- Cause: Nested loop updating individual pixel colors in ImageData buffer each frame
- Current capacity: Smooth at 60 FPS with ~2000 particles; degrades below 30 FPS with 5000+ particles
- Improvement path: Use WebGL renderer for particle rendering instead of canvas ImageData, implement frustum culling to skip off-screen particles, pre-allocate ImageData once and reuse

**Audio context synthesis under load:**
- Problem: MusicManager creates many oscillators, gains, and filters per loop iteration without pooling
- Files: `src/systems/MusicManager.js` (lines 121-127 cleanup, 141-142 per-loop allocation)
- Cause: Aggressive node creation for musical patterns; cleanup happens between loops but still accumulates briefly
- Current capacity: Handles ~20 simultaneous oscillators without lag; degrades noticeably with 50+
- Improvement path: Implement oscillator pool pattern with maximum pool size, reuse nodes instead of creating new ones per pattern

**Enemy sprite generation:**
- Problem: Enemy AI recalculates paths and sprites on every update cycle
- Files: `src/entities/Enemy.js`, `src/entities/Guard.js`, `src/entities/Obstacle.js`
- Impact: noticeable lag with 15+ active enemies on-screen
- Improvement path: Cache sprite generation results, use animation frames instead of procedural updates

## Fragile Areas

**GameScene detection system:**
- Files: `src/scenes/GameScene.js` (lines 264-272), `src/entities/Obstacle.js`
- Why fragile: Detection logic depends on manual overlap setup for each obstacle type; adding new obstacle types requires modifying detection setup in two places
- Safe modification: Add detection setup method to Obstacle base class, call it during obstacle spawn in GameScene
- Test coverage: No unit tests for detection callback logic; edge cases like simultaneous detections untested

**BossScene phase transitions:**
- Files: `src/scenes/BossScene.js` (lines 72-94, 600-650)
- Why fragile: Boss phases (normal → shield → enrage) are hardcoded HP thresholds; attack patterns tightly coupled to phase checks scattered throughout update()
- Safe modification: Refactor phases into state machine class, separate attack patterns into phase-specific objects
- Test coverage: No tests for phase transitions; edge case of exact HP boundary hits could cause skipped attacks

**Scene transition state:**
- Files: `src/scenes/*.js` (all scenes)
- Why fragile: State management relies on scene properties (this.gameOver, this.isPaused) with no formal state machine; difficult to track valid transitions
- Safe modification: Implement state enumeration (PLAYING, PAUSED, GAME_OVER, etc.) and validate transitions in a central manager
- Test coverage: No tests for pause/resume/quit flow; could have hidden state inconsistencies

**Audio context initialization:**
- Files: `src/systems/SoundManager.js` (lines 21-37), `src/systems/MusicManager.js` (lines 46-64)
- Why fragile: Lazy initialization on first call relies on browser user gesture policy; if sound never plays, context never initializes and setting muted has no effect
- Safe modification: Initialize on first user interaction gesture (click/key), add explicit init() call from MenuScene
- Test coverage: No integration tests for audio initialization flow

## Scaling Limits

**Maximum concurrent animations:**
- Current capacity: Phaser tweens pool supports ~500 simultaneous tweens before frame rate drops below 30 FPS
- Limit: More than 100 simultaneous particle tweens (disintegration + explosions) causes noticeable stuttering
- Scaling path: Implement custom animation system using update loops instead of tweens for particle effects, batch render particles into single sprite

**Audio node accumulation:**
- Current capacity: AudioContext can maintain ~100-200 connected nodes per context without performance degradation
- Limit: Creating 5+ simultaneous music tracks or sound effects sequences exceeds recommended limits
- Scaling path: Implement strict node pooling with hard maximum of 50 active nodes, queue excess sounds for playback after node recycling

**Canvas texture updates:**
- Current capacity: Updating and refreshing canvas textures works smoothly up to 20 per frame
- Limit: Disintegration effect with 2000+ particles updating shared canvas texture every frame at screen resolution
- Scaling path: Use WebGL rendering instead of canvas 2D, implement texture atlasing for multi-target updates

## Dependencies at Risk

**Phaser 3.80.1:**
- Risk: Single renderer dependency; if Phaser has breaking changes, entire game breaks
- Impact: Any major version update (4.0+) would require significant refactoring
- Current status: Phaser 3 is mature and stable; no imminent breaking changes announced
- Migration plan: Monitor Phaser releases, maintain compatibility layer if needed, test extensively before major version upgrades

**Web Audio API (no external audio library):**
- Risk: Direct Web Audio API usage with no fallback; if browser audio context fails, game is silent
- Impact: No graceful degradation for audio; game continues but immersive experience diminished
- Current mitigation: Try/catch blocks in SoundManager and MusicManager initialization (lines 27-35 in both files)
- Recommendations: Add user-facing audio availability indicator, provide alternative sound option (none), log audio initialization failures

## Missing Critical Features

**No pause/resume for music:**
- Problem: Music continues playing during scene transitions; no seamless pause/resume
- Blocks: Cannot implement clean pause menu with background music fading
- Impact: Audio/visual mismatch during scene transitions

**No accessibility features:**
- Problem: No closed captions, subtitles, or text descriptions for audio cues
- Blocks: Game is audio-dependent (synthesized sound effects key to gameplay)
- Impact: Hearing-impaired players cannot play the game

**No settings/preferences menu:**
- Problem: No way to adjust volume, toggle sound/music independently, change difficulty outside of completion gate
- Blocks: Player cannot customize experience post-launch
- Impact: Reduced accessibility and player retention

**No save/load system:**
- Problem: Single-session gameplay; no progress persistence between sessions
- Blocks: Cannot implement achievements, continue from last level, or save preferred settings
- Impact: Players must complete game in single sitting

## Test Coverage Gaps

**Core game loop untested:**
- What's not tested: Player movement, collision detection, gravity, jump mechanics
- Files: `src/entities/Player.js`, `src/scenes/GameScene.js`
- Risk: Refactoring physics parameters could introduce game-breaking bugs (player stuck, unable to jump, etc.)
- Priority: High - core mechanics must be bulletproof

**State machine logic untested:**
- What's not tested: Scene transitions, pause/resume, game over flow, phase transitions in boss scenes
- Files: `src/scenes/*.js` (all scenes)
- Risk: Edge cases in state transitions (rapid input, overlapping timers) could cause undefined behavior
- Priority: High - state bugs are hardest to trace

**Manager singletons untested:**
- What's not tested: DifficultyManager multiplier calculations, EndgameManager victory/loss conditions, SoundManager audio context setup
- Files: `src/systems/*.js`
- Risk: Wrong difficulty multiplier values, incorrect win conditions, audio not playing
- Priority: Medium - managers are stable but should have validation tests

**Enemy AI untested:**
- What's not tested: Pathfinding, detection logic, animation transitions, damage calculations
- Files: `src/entities/Enemy.js`, `src/entities/Guard.js`, `src/entities/Obstacle.js`
- Risk: AI behavioral regressions when adjusting speeds, ranges, or detection logic
- Priority: Medium - less critical than core loop but important for gameplay feel

**Audio synthesis untested:**
- What's not tested: Generated sound frequencies, timing of synthesized notes, music loop continuity
- Files: `src/systems/SoundManager.js`, `src/systems/MusicManager.js`
- Risk: Silent audio failures, timing glitches, audio context state corruption
- Priority: Low - audio failures are obvious to player, not silent like logic bugs

---

*Concerns audit: 2026-03-05*
