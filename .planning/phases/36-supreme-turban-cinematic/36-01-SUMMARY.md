---
phase: 36-supreme-turban-cinematic
plan: 01
subsystem: audio, ui
tags: [web-audio, phaser, cinematic, procedural-music, sprite-textures]

# Dependency graph
requires:
  - phase: 35-b2-natanz
    provides: "Natanz mountain and explosion VFX for Level 5 cinematic context"
provides:
  - "playVillainMusic() method in MusicManager -- dark dramatic 55 BPM score"
  - "Enhanced Supreme Turban sprite with brighter eyes, golden staff, claw detail"
  - "War background scene with fire, soldiers, trucks, armaments, embers"
  - "Imposing villain reveal at scale 2.8 with red vignette glow"
affects: [boss-scene, level-6, final-cinematics]

# Tech tracking
tech-stack:
  added: []
  patterns: ["Sub-boom oscillator at 60Hz for grave drum impact", "Double glow rings for enhanced sprite luminosity"]

key-files:
  created: []
  modified:
    - superzion/src/systems/MusicManager.js
    - superzion/src/utils/ParadeTextures.js
    - superzion/src/scenes/LastStandCinematicScene.js

key-decisions:
  - "D2/F2 frequencies calculated as NOTE.D3/2 and NOTE.F3/2 since they're below the NOTE constant range"
  - "Used fillEllipse for fire columns instead of custom path for cleaner graphics API usage"
  - "Soldier silhouettes use 3-level depth scale (0.7/1.0/1.4) for visual depth"

patterns-established:
  - "Sub-boom: raw oscillator at 60Hz with exponential decay for heavy drum impact below kick range"
  - "Double glow ring technique: outer ring (lower opacity, larger radius) + inner ring (higher opacity, smaller radius)"

requirements-completed: [CINE-01, CINE-02, CINE-03]

# Metrics
duration: 4min
completed: 2026-03-21
---

# Phase 36 Plan 01: Supreme Turban Cinematic Summary

**Dark villain music at 55 BPM with grave drums and D-minor brass drone, war background with fire/soldiers/missiles/armaments, and Supreme Turban at scale 2.8 with double-glow eyes and golden crescent staff**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-21T16:55:47Z
- **Completed:** 2026-03-21T17:00:00Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- playVillainMusic() with 55 BPM grave drums (60Hz sub-boom), D-minor brass drone (D2/F2/A2 pads), and descending tension arpeggio (D4-C4-Bb3-A3)
- Enhanced Supreme Turban sprite: brighter #ff4400 eyes with double glow rings (r10/r14), bright gold #ffaa00 crescent staff with double glow (r22/r30), claw fingers, dark smoke aura
- Full war background on page 3: blood sky gradient, 8 fire columns with smoke plumes, 11 soldier silhouettes at varying depth, 3 missile trucks, stacked armaments with loading soldiers, floating ember particles
- Boss sprite at scale 2.8 with red vignette glow and slow menacing pulse (1200ms)
- All 6 pages use warm dark war palette (reds, oranges, browns)

## Task Commits

Each task was committed atomically:

1. **Task 1: Dark villain music and enhanced Supreme Turban sprite** - `4e8a87c` (feat)
2. **Task 2: War background and imposing villain reveal scene** - `fdb8b97` (feat)

## Files Created/Modified
- `superzion/src/systems/MusicManager.js` - Added playVillainMusic() with grave drums, brass drone, tension arpeggio, sub bass
- `superzion/src/utils/ParadeTextures.js` - Enhanced Supreme Turban: brighter eyes, golden staff, claw fingers, smoke aura
- `superzion/src/scenes/LastStandCinematicScene.js` - Rewritten with war background, villain music, imposing reveal, warm palette

## Decisions Made
- D2/F2 frequencies calculated as NOTE.D3/2 and NOTE.F3/2 since they're below the NOTE constant range
- Used fillEllipse for fire columns instead of custom paths for cleaner Phaser graphics API usage
- 3-level depth scale for soldier silhouettes (0.7/1.0/1.4) creates convincing parallax depth on flat canvas

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Villain cinematic complete, Level 6 pre-flight sequence ready for play
- playVillainMusic() available for reuse in any future villain-related scenes
- Enhanced Supreme Turban sprite used automatically wherever parade_supremeturban texture is loaded

## Self-Check: PASSED

- FOUND: superzion/src/systems/MusicManager.js (playVillainMusic at line 1143)
- FOUND: superzion/src/utils/ParadeTextures.js (parade_supremeturban with enhanced eyes/staff)
- FOUND: superzion/src/scenes/LastStandCinematicScene.js (playVillainMusic + parade_supremeturban at scale 2.8)
- FOUND: .planning/phases/36-supreme-turban-cinematic/36-01-SUMMARY.md
- FOUND: commit 4e8a87c (Task 1)
- FOUND: commit fdb8b97 (Task 2)
- BUILD: passes without errors

---
*Phase: 36-supreme-turban-cinematic*
*Completed: 2026-03-21*
