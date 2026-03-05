---
phase: 01-audio-foundation
plan: 01
subsystem: audio
tags: [web-audio-api, equal-power-fade, crossfade, musicmanager, scene-transitions]

# Dependency graph
requires: []
provides:
  - "MusicManager.stop() with equal-power cosine fade curve via setValueCurveAtTime"
  - "MusicManager.crossfadeTo(trackName, startFn, duration) for overlapping theme transitions"
  - "MusicManager.shutdown() for immediate hard cleanup on scene destroy"
  - "All 11 scene.start/restart calls in game scenes guarded by music stop or crossfade"
affects: [level-audio, cinematic-infrastructure, cinematics-and-animation]

# Tech tracking
tech-stack:
  added: []
  patterns: [equal-power-cosine-fade, crossfade-dual-gain-node, guard-transitions-before-scene-start]

key-files:
  created: []
  modified:
    - superzion/src/systems/MusicManager.js
    - superzion/src/scenes/BaseCinematicScene.js
    - superzion/src/scenes/GameScene.js
    - superzion/src/scenes/BossScene.js
    - superzion/src/systems/EndgameManager.js

key-decisions:
  - "Equal-power fade uses Float32Array(64) cosine curve with setValueCurveAtTime instead of linearRampToValueAtTime"
  - "crossfadeTo creates temporary inGain node, swaps musicGain pointer, old gain cleaned up after duration"
  - "BossScene victory->CreditsScene uses crossfadeTo('menu', playMenuMusic) for smooth overlap"
  - "linearRampToValueAtTime preserved in synth primitives and setMuted -- only stop() was converted"

patterns-established:
  - "Equal-power fade pattern: pre-compute cosine curve, cancelScheduledValues before setValueCurveAtTime"
  - "Scene transition guard: always call MusicManager.get().stop() or .crossfadeTo() before scene.start/restart"
  - "Immediate stop with fadeTime=0 for scene.restart() calls (new create() starts fresh music)"

requirements-completed: [AUDIO-01]

# Metrics
duration: 5min
completed: 2026-03-05
---

# Phase 1 Plan 1: Fix MusicManager Fade/Crossfade Summary

**Equal-power cosine fade in MusicManager.stop(), new crossfadeTo() for overlapping transitions, shutdown() for hard cleanup, and all 11 scene transitions guarded**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-05T11:14:39Z
- **Completed:** 2026-03-05T11:20:37Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- MusicManager.stop() now uses equal-power cosine curve via setValueCurveAtTime instead of linearRampToValueAtTime, eliminating abrupt audio cuts
- New crossfadeTo(trackName, startFn, duration) method enables smooth overlapping transitions between themes using dual-gain-node architecture
- New shutdown() method provides immediate hard silence and full node cleanup for scene destroy scenarios
- All 11 scene.start() and scene.restart() calls across BaseCinematicScene, GameScene, BossScene, and EndgameManager now have MusicManager guards
- BossScene victory->CreditsScene uses crossfadeTo for a smooth victory-to-menu music overlap

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix MusicManager -- equal-power fade, crossfadeTo(), shutdown()** - `1bd691e` (feat)
2. **Task 2: Audit and fix all scene transition callsites** - `68465ad` (feat)

## Files Created/Modified
- `superzion/src/systems/MusicManager.js` - Equal-power stop(), new crossfadeTo() and shutdown() methods
- `superzion/src/scenes/BaseCinematicScene.js` - Music stop before _handleSkip and _autoAdvance transitions
- `superzion/src/scenes/GameScene.js` - Music stop before all 5 transition points (skip, pause-restart, pause-quit, gameover-restart, gameover-menu)
- `superzion/src/scenes/BossScene.js` - crossfadeTo on victory->CreditsScene, stop on dead->MenuScene and dead->BossScene
- `superzion/src/systems/EndgameManager.js` - Music stop before endgame->ExplosionCinematicScene

## Decisions Made
- Equal-power fade uses a 64-sample Float32Array cosine curve (Math.cos(i/63 * pi/2)) scaled by current volume, applied via setValueCurveAtTime
- crossfadeTo creates a new GainNode for incoming track, swaps this.musicGain pointer before calling startFn, and cleans up the old gain+nodes after duration+0.2s
- linearRampToValueAtTime preserved in synth primitives (_pad, setMuted, etc.) since those are envelope shapes, not fade-out behavior
- BossScene victory uses crossfadeTo('menu', ...) because CreditsScene plays menu music -- this creates a smooth overlap rather than silence gap
- Dead state in BossScene also guards with stop(0.5) for menu and stop(0) for restart

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- MusicManager is now a stable foundation for all subsequent audio work
- crossfadeTo() is available for any future scene transitions requiring smooth music overlap
- All scene transitions are guarded -- Phase 2 (Level Audio) can safely add new music tracks without worrying about zombie nodes or volume doubling
- shutdown() available for any future scene that needs hard cleanup on destroy

## Self-Check: PASSED

- All 5 modified files exist on disk
- Both task commits found in git log (1bd691e, 68465ad)
- SUMMARY.md created at expected path

---
*Phase: 01-audio-foundation*
*Completed: 2026-03-05*
