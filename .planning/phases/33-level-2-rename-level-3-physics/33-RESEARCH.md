# Phase 33: Level 2 Rename + Level 3 Physics - Research

**Researched:** 2026-03-20
**Domain:** String replacement (rename) + Phaser 3 arcade physics (flight simulation)
**Confidence:** HIGH

## Summary

Phase 33 has two distinct workstreams: (1) a straightforward text rename of Level 2's operation name from various legacy names to "Operation Explosive Interception", and (2) a significant physics rework of BomberScene (Level 3) to make the plane feel like a real aircraft with weight, gravity, and crash consequences.

The Level 2 rename is a simple find-and-replace across 6 files with 8 string occurrences total. The current Level 2 has a confusing naming situation: the cinematic calls it "OPERATION SIGNAL STORM", the HUD scene calls it "OPERATION PORT SWAP", and the menu calls it "OPERATION PORT SWAP". All must become "OPERATION EXPLOSIVE INTERCEPTION".

The Level 3 physics rework requires modifying the existing BomberScene.js which ALREADY has partial physics (gravity constant `JET_GRAVITY = 180`, climb/dive acceleration, stall checks). The requirements ask for the plane to "constantly fall under gravity when no input is held" and "feel like it has weight and momentum" -- the existing code partially implements this but needs tuning. The key gaps are: (a) gravity must be more pronounced/constant (not reduced in certain phases), (b) crash on high-speed landing must be stricter, (c) water contact must always be fatal, (d) failed takeoff must crash into water, and (e) landing must require precision alignment. Most of these behaviors already have partial implementations that need refinement rather than rewriting.

**Primary recommendation:** Split into two plans -- Plan 01 for the simple rename (all files, 10-minute task), Plan 02 for the physics overhaul (BomberScene.js tuning and crash logic, 20-minute task).

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| LVL2-01 | "Operation Signal Storm" renamed to "Operation Explosive Interception" in all locations (cinematic, HUD, menu, victory) | Full audit of all 8 string locations across 6 files completed -- see Rename Audit section |
| LVL3-01 | Constant gravity -- plane always falls if no input | BomberScene.js already has JET_GRAVITY=180 but reduces it in certain phases (takeoff, landing) -- needs uniform application |
| LVL3-02 | Up arrow = thrust -- plane rises while held | Already implemented via CLIMB_ACCEL=400 on keys.up -- may need tuning for feel |
| LVL3-03 | Left/right arrows = plane tilt/inclination | Partially implemented (rotation based on VY) -- needs visual tilt on left/right input too |
| LVL3-04 | Crash (explosion) on high vertical speed landing on carrier | Partially exists (VY > 200 = crash) -- threshold may need lowering for realism |
| LVL3-05 | Crash (explosion) on water contact | Already implemented in multiple phases -- verify consistent across ALL phases |
| LVL3-06 | Crash (explosion) on insufficient takeoff thrust (falls into water) | Already implemented in _updateTakeoff -- verify edge cases |
| LVL3-07 | Landing requires precision -- slow descent, aligned, controlled speed | Exists but too forgiving (2 retries, auto-land on 2nd miss) -- needs stricter rules |
| LVL3-08 | Plane feels like it has weight and momentum (not a floating cursor) | Tuning task: increase gravity, reduce responsiveness, add inertia |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Phaser | 3.x | Game framework -- provides Scene, Physics, Input, Tweens | Already used throughout the project |
| Arcade Physics | (built-in) | Gravity, velocity, collision detection | Already configured in main.js with gravity.y = 900 |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| SoundManager | (project) | Sound effects for crashes, landings | Already imported in BomberScene |
| MusicManager | (project) | Background music phase transitions | Already imported in BomberScene |

No new libraries needed. All changes are within existing files.

## Architecture Patterns

### Level 2 Rename -- File/Location Audit

The name "Operation Signal Storm" and "Operation Port Swap" must both become "Operation Explosive Interception" in these exact locations:

| File | Line | Current Text | New Text |
|------|------|-------------|----------|
| `MenuScene.js` | 14 | `'LEVEL 2: OPERATION PORT SWAP'` | `'LEVEL 2: OPERATION EXPLOSIVE INTERCEPTION'` |
| `BeirutIntroCinematicScene.js` | 68 | `'OPERATION SIGNAL STORM'` | `'OPERATION EXPLOSIVE INTERCEPTION'` |
| `BeirutRadarScene.js` | 2 | Comment: `Operation Signal Storm` | `Operation Explosive Interception` |
| `BeirutRadarScene.js` | 315 | `'OPERATION SIGNAL STORM'` (HUD title) | `'OPERATION EXPLOSIVE INTERCEPTION'` |
| `BeirutRadarScene.js` | 966 | `'OPERATION SIGNAL STORM'` (results screen) | `'OPERATION EXPLOSIVE INTERCEPTION'` |
| `PortSwapScene.js` | 2 | Comment: `Operation Port Swap` | `Operation Explosive Interception` |
| `PortSwapScene.js` | 502 | `'OPERATION PORT SWAP'` (HUD title) | `'OPERATION EXPLOSIVE INTERCEPTION'` |
| `PortSwapScene.js` | 1560 | `{ label: 'OPERATION', value: 'PORT SWAP' }` | `{ label: 'OPERATION', value: 'EXPLOSIVE INTERCEPTION' }` |
| `CreditsScene.js` | 39 | `'Op. Signal Storm -- Intelligence'` | `'Op. Explosive Interception -- Intelligence'` |

**CRITICAL NOTE on dual scenes:** `PortSwapScene.js` and `BeirutRadarScene.js` both register as `'BeirutRadarScene'` (same Phaser scene key). In `main.js`, the import `import BeirutRadarScene from './scenes/PortSwapScene.js'` means **PortSwapScene is the active Level 2 gameplay scene**. The file `BeirutRadarScene.js` is effectively dead code (never loaded by the game), but should still be renamed for consistency since it could cause confusion. Both files need the string replacements.

### Level 3 Physics -- Current Implementation Analysis

The BomberScene.js has 6 phases: `takeoff -> launching -> flight -> bombing -> returning -> landing`

**Current physics constants (lines 48-55):**
```javascript
const JET_GRAVITY = 180;        // gravity on jet px/s^2
const STALL_SPEED = 100;        // below this horizontal speed, jet stalls
const STALL_GRAVITY = 350;      // extra gravity when stalling
const CLIMB_ACCEL = 400;        // upward accel when pressing UP
const DIVE_ACCEL = 250;         // downward accel when pressing DOWN
const MAX_CLIMB_VY = -300;      // max upward speed (negative = up)
const MAX_FALL_VY = 400;        // max downward speed
```

**Phase-by-phase gravity analysis:**

| Phase | Gravity Applied | Issue for LVL3-01/08 |
|-------|----------------|---------------------|
| `takeoff` | `JET_GRAVITY * 1.5` (only when airborne off carrier edge) | No gravity while on deck (correct), but post-edge gravity is inconsistent |
| `launching` | `+30 * dt` (very reduced) | Too floaty -- plane should still feel heavy |
| `flight` | `JET_GRAVITY` (full) | Good |
| `bombing` | `JET_GRAVITY` (full) | Good |
| `returning` | `JET_GRAVITY` (full) | Good |
| `landing` | `JET_GRAVITY * 0.6` (reduced!) | Too floaty -- landing should feel heavy |

### Recommended Physics Tuning

```javascript
// Adjusted constants for "heavy aircraft" feel
const JET_GRAVITY = 250;        // INCREASED from 180 -- plane falls faster
const CLIMB_ACCEL = 350;        // REDUCED from 400 -- harder to climb
const DIVE_ACCEL = 200;         // REDUCED from 250 -- gravity does most work
const MAX_CLIMB_VY = -250;      // REDUCED from -300 -- can't climb as fast
const MAX_FALL_VY = 500;        // INCREASED from 400 -- terminal velocity higher
```

**Landing phase changes:**
- Remove the `* 0.6` gravity reduction in landing phase (line 1577)
- Lower crash threshold from `VY > 200` to `VY > 150` for hard landing detection
- Remove auto-land on 2nd miss (currently `landingRetries < 1` gives a free pass)
- Add horizontal alignment requirement (must be within carrier X range, no auto-correction)

### Tilt/Inclination for Left/Right (LVL3-03)

Currently the jet rotation is only based on vertical velocity (`jetVY / 400`). For left/right tilt:
- When pressing LEFT: add slight negative roll (bank left) ~-0.15 radians
- When pressing RIGHT: add slight positive roll (bank right) ~+0.15 radians
- Blend with existing VY-based pitch

```javascript
// In update methods that handle flight:
const pitchAngle = Phaser.Math.Clamp(this.jetVY / 400, -0.35, 0.35);
const rollOffset = (this.keys.left.isDown ? -0.12 : 0) + (this.keys.right.isDown ? 0.12 : 0);
const targetAngle = pitchAngle + rollOffset;
```

### Water Contact Crash Verification (LVL3-05)

Current water crash checks by phase:

| Phase | Water Crash Check | Status |
|-------|------------------|--------|
| `takeoff` | `jetY >= GROUND_Y + 20` -> crash | Present but only when `takeoffAirborne = true` |
| `flight` | `jetY >= GROUND_Y - 10` -> crash('ground') | Uses 'ground' label but is over water -- should be 'water' when over sea |
| `bombing` | `jetY >= GROUND_Y - 10` -> crash('ground') | OK -- this is over land |
| `returning` | `jetY >= GROUND_Y - 10` -> crash('ground') | Should be 'water' when over sea |
| `landing` | `jetY > GROUND_Y + 20` -> crash('water') | Correct |

Fix: in `_updateFlight` and `_updateReturn`, check terrain stage and use 'water' crash type when over sea.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Physics simulation | Custom physics engine | Existing JET_GRAVITY + VY/VX system | Already built, just needs tuning |
| Crash detection | New collision system | Existing position checks vs GROUND_Y/DECK_Y | Simple Y-threshold checks work fine |
| Screen transitions | Custom transition system | Existing cameras.main.fadeOut pattern | Consistent with rest of game |

**Key insight:** This phase is a TUNING exercise, not a building exercise. The physics infrastructure already exists. The work is adjusting constants and tightening conditions.

## Common Pitfalls

### Pitfall 1: Over-tuning gravity makes game unplayable
**What goes wrong:** Increasing gravity too much makes the plane impossible to control, frustrating players.
**Why it happens:** The requirements say "feels like weight" but don't specify exact values.
**How to avoid:** Make incremental changes. Start with JET_GRAVITY=220 (not jumping to 300+). Test each phase independently.
**Warning signs:** Plane hits ground within 2 seconds of releasing UP key.

### Pitfall 2: Breaking existing gameplay phases
**What goes wrong:** Changing physics constants affects ALL 6 phases. Fixing landing might break bombing.
**Why it happens:** Constants are shared across all phases.
**How to avoid:** Test each phase after changes. Consider per-phase gravity multipliers if needed (but try uniform first).
**Warning signs:** Bombing becomes impossible because plane falls too fast to aim.

### Pitfall 3: Rename misses hidden string locations
**What goes wrong:** Player sees "Signal Storm" or "Port Swap" in an unexpected place.
**Why it happens:** Strings appear in comments, results screens, credits, and cinematic setup functions.
**How to avoid:** Use the complete audit table in this research. grep for all variations.
**Warning signs:** Visual QA pass shows old name anywhere.

### Pitfall 4: PortSwapScene constructor collision
**What goes wrong:** Both PortSwapScene.js and BeirutRadarScene.js use `super('BeirutRadarScene')`.
**Why it happens:** PortSwapScene replaced BeirutRadarScene but kept the same scene key for routing compatibility.
**How to avoid:** Do NOT change the scene key in the constructor. Only change display strings. The routing uses 'BeirutRadarScene' as the key and changing it would break scene transitions.
**Warning signs:** Level 2 fails to load or loads the wrong scene.

### Pitfall 5: Landing too strict makes it impossible
**What goes wrong:** Removing all forgiveness (retries, auto-land) makes landing phase a dead end.
**Why it happens:** The requirements say "precision landing" but players need SOME margin.
**How to avoid:** Keep 1 retry (wave-off), but remove auto-land on 2nd miss. Instead, 2nd miss = water crash.
**Warning signs:** 90% of test runs end in crash during landing.

## Code Examples

### Rename Example (BeirutIntroCinematicScene.js line 68)
```javascript
// BEFORE:
const opName = this.add.text(W / 2, 40, 'OPERATION SIGNAL STORM', {
// AFTER:
const opName = this.add.text(W / 2, 40, 'OPERATION EXPLOSIVE INTERCEPTION', {
```

### Uniform Gravity Application (BomberScene.js landing phase)
```javascript
// BEFORE (line 1577):
this.jetVY += JET_GRAVITY * 0.6 * dt;

// AFTER:
this.jetVY += JET_GRAVITY * dt;  // Full gravity -- plane has weight
```

### Stricter Landing Crash Detection
```javascript
// BEFORE (line 1601):
if (this.jetVY > 200) {
  this._crashJet('ground');
  return;
}

// AFTER:
if (this.jetVY > 150) {
  this._crashJet('deck');  // Hard landing = crash
  return;
}
```

### Left/Right Tilt Addition
```javascript
// Add to _updateFlight, _updateBombing, _updateReturn, _updateLanding:
const pitchAngle = Phaser.Math.Clamp(this.jetVY / 400, -0.35, 0.35);
const bankAngle = (this.keys.left.isDown ? -0.12 : 0) + (this.keys.right.isDown ? 0.12 : 0);
const targetAngle = pitchAngle + bankAngle;
const currentAngle = this.jetSprite.rotation || 0;
this.jetSprite.setRotation(currentAngle + (targetAngle - currentAngle) * 6 * dt);
```

### Remove Auto-Land on 2nd Miss
```javascript
// BEFORE (line 1631-1654):
if (this.landingRetries < 1) {
  this.landingRetries++;
  // ... wave off
} else {
  this.landingQuality = 'rough';
  // ... auto land (TOO FORGIVING)
}

// AFTER:
if (this.landingRetries < 1) {
  this.landingRetries++;
  // ... wave off
} else {
  // Missed again -- crash into water
  this._crashJet('water');
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| BeirutRadarScene as Level 2 | PortSwapScene replaced it (same scene key) | Earlier phase | PortSwapScene is the active scene; BeirutRadarScene is dead code |
| "Operation Signal Storm" | Being renamed to "Explosive Interception" | This phase | 8 string locations across 6 files |
| Floaty plane physics | Must become weighty/realistic | This phase | Constants tuning in BomberScene.js |

## Open Questions

1. **Should the menu description text also be updated?**
   - What we know: MenuScene.js line 338 says "Intercept enemy communications in Beirut. Mark signals on the radar. Time your intercept." -- this describes the OLD BeirutRadarScene gameplay, not PortSwapScene
   - What's unclear: Whether the user wants the description updated to match PortSwapScene gameplay
   - Recommendation: Update the description to match actual gameplay since it's misleading, but this is a "Claude's discretion" item

2. **How much gravity increase is "right"?**
   - What we know: Current JET_GRAVITY=180 feels floaty per the requirement
   - What's unclear: Exact value that feels "heavy but playable"
   - Recommendation: Start with 220-250, test, can always adjust

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Manual browser testing (no automated test framework) |
| Config file | none |
| Quick run command | `cd superzion && npx vite --open` |
| Full suite command | Manual playthrough of Level 2 and Level 3 |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| LVL2-01 | "Explosive Interception" appears in all locations | manual | grep for old names in src/ | N/A |
| LVL3-01 | Plane falls under gravity with no input | manual | Play Level 3, release all keys mid-flight | N/A |
| LVL3-02 | UP arrow makes plane rise | manual | Play Level 3, hold UP | N/A |
| LVL3-03 | LEFT/RIGHT tilt the plane | manual | Play Level 3, press LEFT/RIGHT | N/A |
| LVL3-04 | High-speed landing = crash | manual | Play Level 3, dive into carrier | N/A |
| LVL3-05 | Water contact = crash | manual | Play Level 3, fly into water | N/A |
| LVL3-06 | Failed takeoff = crash | manual | Play Level 3, don't press RIGHT or UP | N/A |
| LVL3-07 | Precision landing required | manual | Play Level 3, attempt landing | N/A |
| LVL3-08 | Plane feels heavy | manual | Play Level 3, compare to pre-change | N/A |

### Sampling Rate
- **Per task commit:** Build check (`npx vite build`)
- **Per wave merge:** Manual playthrough of Level 2 cinematic + gameplay + Level 3 all 6 phases
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
None -- no automated test infrastructure exists or is needed. All validation is visual/manual via browser.

## Sources

### Primary (HIGH confidence)
- Direct codebase analysis of all source files (BomberScene.js, PortSwapScene.js, BeirutRadarScene.js, BeirutIntroCinematicScene.js, DeepStrikeIntroCinematicScene.js, MenuScene.js, CreditsScene.js, main.js)
- REQUIREMENTS.md for exact requirement text
- STATE.md for project decisions and history

### Secondary (MEDIUM confidence)
- GDD_SUPERZION_COMPLETE.md for game design intent

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - no new libraries, pure tuning of existing code
- Architecture: HIGH - complete audit of all string locations and physics code paths
- Pitfalls: HIGH - based on direct code analysis, identified real issues (dual scene key, gravity multiplier inconsistencies)

**Research date:** 2026-03-20
**Valid until:** 2026-04-20 (stable -- no external dependencies)
