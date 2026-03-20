---
phase: 34-level-4-complete-redesign
verified: 2026-03-20T14:00:00Z
status: human_needed
score: 11/11 must-haves verified
re_verification:
  previous_status: gaps_found
  previous_score: 8/11
  gaps_closed:
    - "SHIFT dodge/dash works during the boss fight — no longer blocked by _damageCouch crash"
    - "The Warden hides behind the armchair, peeks out to throw objects at the drone, then hides again (state machine now fully reachable)"
    - "COUCH_Y and couchX undefined constants used in collision code — all stale couch/cover variables removed"
  gaps_remaining: []
  regressions: []
human_verification:
  - test: "Load Level 4 and observe the city flight phase visually"
    expected: "Blue sky, buildings on top and bottom of screen with visible damage (missing wall sections on high-damage buildings), craters on the street, hanging cables, debris and destroyed cars at street level, dust particles floating, target building with pulsing amber window at ~80% of the way through"
    why_human: "Procedural rendering quality and visual coherence cannot be verified from code alone"
  - test: "Fly toward the target building and press SPACE near the glowing window"
    expected: "Pulsing amber/gold window is visually distinct from other dark windows; 'PRESS SPACE TO ENTER' prompt appears; pressing SPACE triggers transition to boss fight"
    why_human: "Alpha pulsing, visual distinctiveness, and transition feel require in-game observation"
  - test: "Approach an enemy drone within detection range (180px)"
    expected: "Enemy drone turns toward player, fires red bullets; player Z key fires cyan bullets that destroy enemy drones"
    why_human: "Detection range, targeting feel, and combat responsiveness require runtime testing"
  - test: "Enter the boss fight — observe the room and shoot at the boss while it is behind the armchair"
    expected: "Room shows warm sandy-beige walls, 3 holes in walls/ceiling with #87CEEB sky visible, angled sunbeam overlays on floor, scattered debris (lamps, mirror, tables, chairs, rubble, cables, dust). Bullet hits armchair produce a gold spark but do NOT damage the boss. Boss peeks out after 2-3 seconds, becomes briefly vulnerable, throws a projectile, then retreats"
    why_human: "Room visual quality, spark effect timing, and boss cycle pacing require runtime testing"
  - test: "During the boss fight, press SHIFT while holding a direction arrow"
    expected: "Drone dashes ~130px laterally with brief (~0.25s) invulnerability; drone flickers to low alpha; cyan trail visible; SHIFT cooldown bar recharges over 1 second"
    why_human: "Dodge feel, invulnerability window, and visual feedback require runtime testing"
---

# Phase 34: Level 4 Complete Redesign — Verification Report

**Phase Goal:** Level 4 is a daytime drone flight RIGHT through detailed ruins followed by a boss fight in a destroyed room
**Verified:** 2026-03-20T14:00:00Z
**Status:** human_needed — all automated checks pass; human testing needed for visual and gameplay quality
**Re-verification:** Yes — after gap closure (previous status: gaps_found, 8/11)

---

## Re-Verification Summary

The previous verification found three gaps, all rooted in a single cause: stale `couch`-related code left over from the old multi-cover system. The specific failing items were:

1. `this._damageCouch()` called at three sites but never defined — runtime TypeError crash
2. `this.couchAlive`, `COUCH_Y`, `this.couchX` referenced but never defined — dead code / hygiene issue
3. `this.couchSprite` and `this.coverSprites` referenced in cleanup but never assigned — dead code

**All three gaps are confirmed closed.** The fix replaced the old bullet-collision logic with proper armchair-based collision: `_damageCouch()` calls removed; bullet hits during `behind_cover` state now produce a gold spark effect via `this.add.circle()`; missile hits produce a blast effect. All stale `couch`/`COUCH_Y`/`couchAlive`/`coverSprites` identifiers are gone from both `DroneScene.js` and `DroneTextures.js`. Cleanup at line 2920 now correctly destroys `this.armchairSprite`.

No regressions found in previously passing items (LVL4-01 through LVL4-09).

---

## Goal Achievement

### Observable Truths

| #  | Truth | Status | Evidence |
|----|-------|--------|---------|
| 1  | Level 4 city phase is set in daytime (warm sunlight, blue sky, no stars/night) | VERIFIED | `createDaytimeSky()` generates #87CEEB sky with warm sun wash; `_drawCityScene()` fills background 0x87CEEB with sun glow overlay at (W*0.85, H*0.12) |
| 2  | Drone scrolls RIGHT through the city (horizontal movement, not upward) | VERIFIED | `CITY_SCROLL_SPEED = 55 px/s`, `city.scrollX += city.scrollSpeed * dt`, buildings rendered as `b.x - offX` — leftward offset on screen = drone advancing right |
| 3  | Ruined buildings show detailed destruction: missing walls, collapsed roofs, rubble, craters, hanging cables, exposed furniture, destroyed cars, dust | VERIFIED | Buildings with `damage` property; holes drawn for `damage > 0.6`; 60 rubble pieces + 8 destroyed cars + 10 craters + 15 cable segments + 40 dust particles — all rendered in `_drawCityScene()` |
| 4  | One specific building glows subtly as the target destination | VERIFIED | `city.windowTarget` placed at 80% of `CITY_LENGTH`; pulsing amber window: `alpha = 0.2 + 0.3 * Math.sin(Date.now()/300)` with 0xFFD700 fill and outer halo each frame |
| 5  | Enemy drones patrol the city and shoot at the player on detection | VERIFIED | 4 enemy drones with `detectRange: 180`, vertical patrol between top/bottom building bounds, shoot `enemyBullets` when `alerted`, drawn as red quad-rotor shapes |
| 6  | Reaching and entering the target building through an open window transitions to the boss fight phase | VERIFIED | `_cityEnterWindow()` called on SPACE press when `enterReady`; triggers `_cleanupCityIntro()` then `_startBossFight()` (line 1648); failsafe auto-transition at `scrollX >= CITY_LENGTH` |
| 7  | Boss fight room is a destroyed building interior with daytime light visible through holes in walls and ceiling | VERIFIED | `createCommandRoom()` fully rewritten: 3 holes in walls/ceiling showing #87CEEB sky, angled sunbeam strips at 0.15 alpha on floor, sandy beige walls (#D4C4A0) |
| 8  | Room contains detailed debris: broken lamps, cracked mirrors, overturned tables, broken chairs, rubble piles, hanging cables, dust in air | VERIFIED | `createCommandRoom()` contains 2 broken floor lamps, cracked mirror with 8 radiating crack lines, 2 overturned tables, broken chairs, 60 rubble chunks on floor, floor cable, 25 dust particles in air |
| 9  | The Warden sits in an individual armchair (single seat, NOT a sofa or couch) | VERIFIED | `createArmchairTexture()` is an 80x80 single-seat armchair with two armrests, rounded back, one visible leg, worn patches; placed at `ARMCHAIR_X = W/2, ARMCHAIR_Y = 320` at 100x100 display size; old `_generateCouchTexture` removed |
| 10 | The Warden hides behind the armchair, peeks out to throw objects at the drone, then hides again in a repeating cycle | VERIFIED | `_updateBossArmchairCover()` implements clean 3-state cycle `behind_cover -> peeking -> throwing -> behind_cover`. Bullet hits during `behind_cover` now produce a gold spark (lines 2493-2495) and call `_damageBoss()` or are absorbed by the armchair hitbox (lines 2503-2508). No crash path remains. |
| 11 | SHIFT dodge/dash works during the boss fight — pressing SHIFT makes the drone dash laterally with brief invulnerability | VERIFIED | `keys.shift` registered (line 942 — also `keys.c` as alias); `dodgeActive`/`dodgeCooldown`/`dodgeTimer` initialized (lines 1742-1744); dash logic at lines 2829-2862 with 130px lateral dash, 0.25s invulnerability, visual trail; HUD label and cooldown bar present. Boss fight is now reachable (crash blocker removed). |

**Score:** 11/11 truths verified (automated)

---

## Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `superzion/src/utils/DroneTextures.js` | Daytime ruined city textures, daytime boss room with light through holes, armchair texture | VERIFIED | Exports: `createDroneSprite`, `createDaytimeSky`, `createRuinedCityTile`, `createRuinedCityTile2`, `createTargetBuildingTexture`, `createCommandRoom`, `createArmchairTexture`, `createArmchairSideTexture`, `createDroneSilhouette`, `drawBoss4AngryEyebrows`. No tunnel functions present. Armchair functions at lines 1136 and 1227. |
| `superzion/src/scenes/DroneScene.js` | Horizontal right-scrolling city phase with enemy drones, target building, boss fight with armchair cover and SHIFT dodge | VERIFIED | Imports updated (line 14-18). City phase: `CITY_SCROLL_SPEED`, buildings on top+bottom, enemy drones, target window. Boss phase: `ARMCHAIR_X/Y` constants, `bossCoverState` state machine, `dodgeActive` mechanic. Zero stale couch/cover references. |

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `DroneScene.js` | `DroneTextures.js` | import of `createDaytimeSky`, city tile functions, `createCommandRoom`, `createArmchairTexture`, `createArmchairSideTexture` | VERIFIED | Lines 14-18: imports match exactly. All called in `create()` at lines ~839-846. |
| DroneScene city phase | DroneScene boss phase | `_cityEnterWindow` calls `_cleanupCityIntro()` then `_startBossFight()` | VERIFIED | Line 1648: explicit path. Lines 1687 and 1712: two auto-transition failsafe paths also call `_startBossFight()`. |
| Boss AI state machine | Armchair cover position | `behind_cover -> peeking -> throwing -> behind_cover` via `bossCoverState` | VERIFIED | `_updateBossArmchairCover()` at line 2022; bullet collision checks `bossCoverState === 'behind_cover'` at line 2492; no undefined method calls. |
| SHIFT key handler | Dodge mechanic | `dodgeActive` flag and invulnerability window | VERIFIED | `keys.shift` registered line 942; `keys.c` as alias line 2831; full dash logic lines 2829-2862; `droneInvulnTimer = 0.35` set on dash; HUD lines ~2885-2886. |

---

## Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|---------|
| LVL4-01 | Plan 01 | Daytime setting (not night) for entire level | VERIFIED | `createDaytimeSky()` blue sky; `createCommandRoom()` sandy-beige with sky-visible holes; no night palette anywhere |
| LVL4-02 | Plan 01 | Phase 1 — drone flies RIGHT through ruined city (horizontal scroll, not downward) | VERIFIED | `CITY_SCROLL_SPEED = 55`; `scrollX` increments rightward; buildings offset by `-scrollX` |
| LVL4-03 | Plan 01 | Detailed ruins: destroyed buildings, missing walls, collapsed roofs, rubble, craters, hanging cables, exposed furniture, destroyed cars, dust | VERIFIED | All categories present; missing wall sections (damage > 0.6); 60 rubble chunks; 8 destroyed cars; 10 craters; 15 cable segments; 40 dust particles |
| LVL4-04 | Plan 01 | Target building identified by subtle glow or marker | VERIFIED | Pulsing amber window at 80% of city length; alpha oscillating 0.2-0.5; outer halo glow rect |
| LVL4-05 | Plan 01 | Enemy drones patrol and shoot on detection | VERIFIED | 4 enemy drones with 180px detection; vertical patrol; shoot `enemyBullets` on detection |
| LVL4-06 | Plan 01 | Enter target building through open window to trigger Phase 2 | VERIFIED | SPACE key triggers `_cityEnterWindow()` which calls `_startBossFight()` |
| LVL4-07 | Plan 02 | Phase 2 boss fight in destroyed building interior with daytime light through holes in walls/ceiling | VERIFIED | `createCommandRoom()` has 3 sky-visible holes, sunbeam overlays at 0.15 alpha |
| LVL4-08 | Plan 02 | Detailed room: broken lamps, cracked mirrors, overturned tables, broken chairs, rubble, cables, dust in air | VERIFIED | All 7 item categories present in `createCommandRoom()` |
| LVL4-09 | Plan 02 | Individual armchair (mono-sillon, NOT sofa), larger than before | VERIFIED | `createArmchairTexture()` is single-seat chair; placed at 100x100px (larger than 80x80 original spec); all couch generators removed |
| LVL4-10 | Plan 02 | The Warden hides behind armchair, peeks to throw objects, hides again | VERIFIED | State machine logic correct and now crash-free; bullet collision during `behind_cover` produces spark effect, no TypeError |
| LVL4-11 | Plan 02 | SHIFT dodge/dash works in boss fight | VERIFIED | Dodge mechanic fully implemented and boss fight is now reachable (crash blocker removed) |

**All 11 requirements claimed by plans. No orphaned requirements.**

---

## Anti-Patterns Found

| File | Line(s) | Pattern | Severity | Impact |
|------|---------|---------|----------|--------|
| `superzion/src/scenes/DroneScene.js` | 1692 | Comment `// DIRECT BOSS START (skip recon/tunnel)` — minor stale comment | INFO | No functional impact; recon/tunnel phases are gone entirely so the comment is mildly misleading but harmless |
| `superzion/src/scenes/DroneScene.js` | 717, 777-778 | Comment-only tombstones for removed texture generators | INFO | `// _generateCouchTexture REMOVED` etc. — these are helpful documentation of what was removed, not actual dead code; no impact |

No BLOCKER or WARNING anti-patterns found. The previous blockers (`_damageCouch`, `couchAlive`, `COUCH_Y`, `coverSprites`) are fully resolved.

---

## Build Status

Production build (`npx vite build` from `superzion/`) completes successfully:

- **Result:** `dist/assets/index-o4UEKnCC.js` — 2021 kB (gzip: 470 kB)
- **Errors:** 0
- **Warnings:** 1 — chunk size warning (2 MB bundle, not an error, pre-existing condition)
- **Import errors:** 0 — all DroneScene.js imports resolve to exported symbols in DroneTextures.js

---

## Human Verification Required

The following require loading the game — they cannot be verified programmatically.

### 1. City phase visual quality

**Test:** Load Level 4, observe the city flight phase for 15-20 seconds
**Expected:** Blue sky visible; buildings on top and bottom of the navigable street with visible damage (missing wall sections on high-damage buildings, intact facades on low-damage ones); craters on street; hanging cables between buildings; destroyed car shapes and debris at street level; dust particles floating; target building with pulsing amber-gold window visually distinct at ~80% of the way through
**Why human:** Procedural rendering quality and visual coherence cannot be verified from code

### 2. Target building entry and prompt

**Test:** Fly toward the target building at ~80% of the city
**Expected:** A pulsing amber/gold window stands out from other dark windows; "PRESS SPACE TO ENTER" prompt appears on-screen when within range; pressing SPACE triggers a cinematic/fade transition into the boss fight
**Why human:** Alpha pulsing visibility and prompt timing require in-game observation

### 3. Enemy drone combat

**Test:** Approach an enemy drone within ~180px
**Expected:** Enemy drone orients toward player and fires red bullets; player Z key fires cyan bullets that can destroy the enemy drone (2 hits); destroyed drone disappears
**Why human:** Detection range, targeting, and combat responsiveness require runtime testing

### 4. Boss fight — armchair cover cycle and room visuals

**Test:** Enter the boss fight; shoot at the boss while it hides behind the armchair; wait for it to peek; shoot again while it peeks
**Expected:** Room shows warm sandy-beige walls, 3 bright holes in walls/ceiling showing blue sky, angled sunbeam strips on floor, scattered debris visible (lamps, mirror fragments, tilted tables, broken chairs, rubble, cables, dust). Bullets that hit the armchair produce a gold spark and do NOT reduce boss HP. After 2-3 seconds boss peeks out with a vulnerable head/torso visible; player can deal damage; boss throws a projectile then retreats behind armchair
**Why human:** Room visual quality, spark effect, state machine timing, and gameplay cycle feel require runtime testing

### 5. SHIFT dodge during boss fight

**Test:** During the boss fight, press SHIFT while holding a direction arrow
**Expected:** Drone dashes ~130px laterally; drone flickers (reduced alpha); brief cyan trail visible; SHIFT cooldown bar beneath the drone depletes and recharges over ~1 second; incoming boss projectiles pass through the drone during the ~0.25s invulnerability window
**Why human:** Dodge feel, invulnerability window, and visual feedback require runtime testing

---

## Gaps Summary

No gaps remain. All previously identified issues are resolved:

- `_damageCouch()` (the runtime crash blocker) is gone; its three call sites now use inline spark/blast effects and `_damageBoss()` appropriately
- All stale couch/cover identifiers (`COUCH_Y`, `couchAlive`, `couchX`, `couchSprite`, `coverSprites`) are absent from both source files
- Build passes with zero errors
- All 11 requirements have corresponding implementation evidence

The phase goal — "Level 4 is a daytime drone flight RIGHT through detailed ruins followed by a boss fight in a destroyed room" — is achieved at the code level. Human play-testing is needed to confirm visual quality and gameplay feel.

---

_Verified: 2026-03-20T14:00:00Z_
_Verifier: Claude (gsd-verifier)_
