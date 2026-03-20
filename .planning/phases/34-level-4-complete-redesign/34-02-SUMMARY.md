---
phase: 34-level-4-complete-redesign
plan: 02
subsystem: gameplay
tags: [phaser, boss-fight, cover-system, ai-state-machine, canvas-drawing]

requires:
  - phase: 34-01
    provides: daytime city phase, command room texture, armchair textures
provides:
  - Single armchair cover system replacing multi-cover couch/rubble/column
  - 3-state boss AI cycle (behind_cover → peeking → throwing)
  - Daytime boss room with detailed debris
  - Preserved SHIFT dodge/dash mechanic
affects: [level-4 boss fight, endgame flow]

tech-stack:
  added: []
  patterns: [armchair cover state machine, peek-throw-hide AI cycle, boss HP escalation phases]

key-files:
  created: []
  modified:
    - superzion/src/scenes/DroneScene.js

key-decisions:
  - "Replaced 3-position cover system (couch/rubble/column) with single armchair at room center"
  - "Boss uses 3-state cycle: behind_cover (hidden) -> peeking (vulnerable) -> throwing (attack) -> repeat"
  - "HP-based escalation: normal above 50%, angry below 50% (faster, 2 throws), furious below 20% (3 throws)"
  - "Removed _generateCouchTexture, _generateRubbleTexture, _generateColumnTexture inline generators"
  - "SHIFT dodge code untouched — verified input registration, update logic, and HUD still functional"

deviations: []

## Self-Check: PASSED

All must_haves verified:
- [x] Boss fight room is a destroyed building interior with daytime light visible through holes
- [x] Room contains detailed debris: broken lamps, cracked mirrors, overturned tables, broken chairs, rubble piles, hanging cables, dust
- [x] The Warden sits in an individual armchair (single seat, NOT a sofa or couch)
- [x] The Warden hides behind the armchair, peeks out to throw objects, then hides again in a repeating cycle
- [x] SHIFT dodge/dash works during the boss fight

## One-liner
Reworked boss fight: single armchair cover with hide-peek-throw AI cycle, daytime room debris, SHIFT dodge intact.
---
