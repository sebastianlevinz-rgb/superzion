# Roadmap: SuperZion

## Milestones

- **v1.0 Cinematic & Audio** - Phases 1-4 (deferred after Phase 1 shipped)
- ✅ **v1.1 Polish Pass** - Phases 5-8 (shipped 2026-03-19)
- ✅ **v1.2 Sprite & Polish v2** - Phases 9-14 (shipped 2026-03-19)
- ✅ **v1.3 Narrative & Audio** - Phases 15-20 (shipped 2026-03-19)
- ✅ **v1.4 Final Polish** - Phases 21-30 (shipped 2026-03-19)
- **v1.5 Megafix v3** - Phases 31-38 (in progress)

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

<details>
<summary>v1.0-v1.2 Phase Details (Phases 1-14) -- SHIPPED</summary>

See `.planning/milestones/` for archived phase details.

</details>

<details>
<summary>v1.3 Narrative & Audio (Phases 15-20) -- SHIPPED 2026-03-19</summary>

- [x] Phase 15: Cinematic Text Engine (1/1 plan) -- completed 2026-03-19
- [x] Phase 16: Intro Narrative (1/1 plan) -- completed 2026-03-19
- [x] Phase 17: Level Cinematics (1/1 plan) -- completed 2026-03-19
- [x] Phase 18: Victory & Tagline (1/1 plan) -- completed 2026-03-19
- [x] Phase 19: Cinematic Audio (1/1 plan) -- completed 2026-03-19
- [x] Phase 20: Audio Global Audit (1/1 plan) -- completed 2026-03-19

</details>

<details>
<summary>v1.4 Final Polish (Phases 21-30) -- SHIPPED 2026-03-19</summary>

- [x] Phase 21: Sprite & Visual Quick Fixes (1/1 plan) -- completed 2026-03-19
- [x] Phase 22: Intro Melody System (1/1 plan) -- completed 2026-03-19
- [x] Phase 23: Level 3 Missile Rebalance (1/1 plan) -- completed 2026-03-19
- [x] Phase 24: Level 4 Drone City Intro (1/1 plan) -- completed 2026-03-19
- [x] Phase 25: Level 4 Boss Rework + Dodge (1/1 plan) -- completed 2026-03-19
- [x] Phase 26: Flight Route Animations (1/1 plan) -- completed 2026-03-19
- [x] Phase 27: Victory Scene Enhancement (1/1 plan) -- completed 2026-03-19
- [x] Phase 28: Title Screen Overhaul (1/1 plan) -- completed 2026-03-19
- [x] Phase 29: Intro Text Visual Backgrounds (1/1 plan) -- completed 2026-03-19
- [x] Phase 30: Full Game Verification (1/1 plan) -- completed 2026-03-19

</details>

### v1.5 Megafix v3

- [x] **Phase 31: Intro Audio Fix** - Replace intro music with menu music, silence loud title screen sounds (completed 2026-03-19)
- [x] **Phase 32: Level 1 Platformer Redesign** - Two-phase level: Tehran rooftop platformer then Bomberman (completed 2026-03-20)
- [ ] **Phase 33: Level 2 Rename + Level 3 Physics** - Rename Level 2 and add lunar lander physics to Level 3
- [ ] **Phase 34: Level 4 Complete Redesign** - Daytime drone city scrolling RIGHT plus detailed boss room
- [ ] **Phase 35: Level 5 B-2 + Explosion** - Flying wing B-2 shape and spectacular mountain explosion
- [ ] **Phase 36: Supreme Turban Cinematic** - Imposing villain cinematic with war background and dramatic music
- [ ] **Phase 37: Victory Scene Redesign** - SuperZion facing forward with celebrating people and epic music
- [ ] **Phase 38: Final Verification** - Full playthrough verifying all areas work correctly

## Phase Details

### Phase 31: Intro Audio Fix
**Goal**: Intro plays the right music at the right volume from first frame to menu
**Depends on**: Nothing (first phase of v1.5)
**Requirements**: INTRO-01, INTRO-02, INTRO-03
**Success Criteria** (what must be TRUE):
  1. Intro scene plays the same music as MenuScene (current intro music is deleted)
  2. Title screen Maguen David appearance has no loud/jarring sounds
  3. Music plays continuously from first frame of intro through to menu scene without gaps or restarts
**Plans**: 1 plan

Plans:
- [ ] 31-01-PLAN.md -- Replace intro music with menu music, silence title explosions, seamless transition

### Phase 32: Level 1 Platformer Redesign
**Goal**: Level 1 becomes a two-phase experience -- platformer across Tehran rooftops at night, then Bomberman indoors
**Depends on**: Phase 31
**Requirements**: LVL1-01, LVL1-02, LVL1-03, LVL1-04, LVL1-05, LVL1-06, LVL1-07, LVL1-08, LVL1-09
**Success Criteria** (what must be TRUE):
  1. Player runs and jumps across rooftop platforms in a side-scrolling Tehran night scene with recognizable landmarks (Azadi Tower, Milad Tower, mountains, moon)
  2. Rooftop platforms look like Iranian architecture (building tops, balconies, mosque domes) with obstacles (cameras, guards, searchlights, electric wire)
  3. Guards on rooftops walk with feet touching the ground (never floating)
  4. Reaching the target building triggers a visual transition into top-down Bomberman gameplay where key pickup and Star of David (at chest center) work correctly
  5. Bomberman phase gameplay is preserved intact from current implementation
**Plans**: 3 plans

Plans:
- [ ] 32-01-PLAN.md -- Create platformer textures (Tehran skyline, platforms, player, guards, obstacles) and wire scene flow
- [ ] 32-02-PLAN.md -- Create PlatformerScene with side-scrolling gameplay, obstacles, guards, and building transition
- [ ] 32-03-PLAN.md -- Fix Star of David position on Bomberman sprite and verify key pickup

### Phase 33: Level 2 Rename + Level 3 Physics
**Goal**: Level 2 gets its correct name and Level 3 plane feels like a real aircraft with weight, gravity, and crash consequences
**Depends on**: Phase 32
**Requirements**: LVL2-01, LVL3-01, LVL3-02, LVL3-03, LVL3-04, LVL3-05, LVL3-06, LVL3-07, LVL3-08
**Success Criteria** (what must be TRUE):
  1. Level 2 shows "Operation Explosive Interception" in all locations (cinematic, HUD, menu, victory screen)
  2. Plane constantly falls under gravity when no input is held (not floating)
  3. Up arrow provides thrust (plane rises), left/right arrows tilt the plane
  4. Plane explodes on hard landing (high vertical speed), water contact, or failed takeoff (falls into water)
  5. Successful landing requires slow, controlled, aligned descent onto the carrier
**Plans**: 2 plans

Plans:
- [ ] 33-01-PLAN.md -- Rename Level 2 operation name from Signal Storm/Port Swap to Explosive Interception across all files
- [ ] 33-02-PLAN.md -- Rework Level 3 plane physics for weight, gravity, tilt, and strict crash/landing rules

### Phase 34: Level 4 Complete Redesign
**Goal**: Level 4 is a daytime drone flight RIGHT through detailed ruins followed by a boss fight in a destroyed room
**Depends on**: Phase 33
**Requirements**: LVL4-01, LVL4-02, LVL4-03, LVL4-04, LVL4-05, LVL4-06, LVL4-07, LVL4-08, LVL4-09, LVL4-10, LVL4-11
**Success Criteria** (what must be TRUE):
  1. Level 4 is set in daytime (not night), drone scrolls RIGHT through a ruined city with detailed destruction (missing walls, collapsed roofs, rubble, craters, hanging cables, destroyed cars, dust)
  2. Target building is identifiable by subtle glow/marker; entering through open window transitions to boss fight
  3. Enemy drones patrol the city and shoot on detection
  4. Boss room is a destroyed building interior with daytime light through holes, detailed debris (broken lamps, cracked mirrors, overturned furniture, rubble, cables)
  5. The Warden sits in an individual armchair (not sofa), hides behind it, peeks to throw, hides again; SHIFT dodge/dash works
**Plans**: TBD

Plans:
- [ ] 34-01: TBD

### Phase 35: Level 5 B-2 + Explosion
**Goal**: B-2 looks like a real flying wing and the mountain explosion is spectacular
**Depends on**: Phase 34
**Requirements**: LVL5-01, LVL5-02, LVL5-03, LVL5-04, LVL5-05
**Success Criteria** (what must be TRUE):
  1. B-2 sprite is a wide flat flying wing (boomerang/bat shape) with dark gray coloring, panel lines, and moonlight highlights (not a triangle with a line)
  2. Mountain has visible texture, vegetation, and rock detail (clearly looks like a mountain)
  3. Explosion sequence plays out in stages: white flash, fireball, mountain cracks, fire columns, partial collapse, mushroom cloud, falling debris, secondary fires
  4. Strong prolonged screen shake accompanies the explosion
**Plans**: TBD

Plans:
- [ ] 35-01: TBD

### Phase 36: Supreme Turban Cinematic
**Goal**: Supreme Turban appears as a terrifying final villain with dramatic war backdrop
**Depends on**: Phase 35
**Requirements**: CINE-01, CINE-02, CINE-03
**Success Criteria** (what must be TRUE):
  1. Dark dramatic music plays -- slow grave drums, ominous brass, minor key, conveying final danger
  2. Background shows detailed war scene with fire, smoke, army silhouettes, missile trucks, soldiers loading weapons, stacked armaments
  3. Supreme Turban is larger and more imposing -- brighter red eyes, glowing crescent moon staff, more detail than before
**Plans**: TBD

Plans:
- [ ] 36-01: TBD

### Phase 37: Victory Scene Redesign
**Goal**: Victory scene shows SuperZion facing forward among celebrating people with epic emotional payoff
**Depends on**: Phase 36
**Requirements**: VICT-01, VICT-02, VICT-03, VICT-04, VICT-05, VICT-06, VICT-07, VICT-08, VICT-09, VICT-10, VICT-11, VICT-12
**Success Criteria** (what must be TRUE):
  1. Opening line is "The weapons are silent. For the first time in years... silence." followed by complete new narrative ending with "Am Yisrael Chai." and "THEY FIGHT TO CONQUER. WE FIGHT TO EXIST."
  2. SuperZion faces forward (not silhouette from behind), illuminated, detailed, smiling, with Maguen David on chest or as giant golden background
  3. Celebrating people surround SuperZion: soldiers, civilians, children, dogs, cats, holding Israel flags, hugging, jumping, clapping
  4. Visual animations active: gold/blue/white confetti falling, fireworks exploding and fading, sunrise with sun slowly rising, moving clouds
  5. Most emotional music in the game plays -- epic with memorable melody
**Plans**: TBD

Plans:
- [ ] 37-01: TBD

### Phase 38: Final Verification
**Goal**: Every change from phases 31-37 verified working in a full playthrough
**Depends on**: Phase 37
**Requirements**: VRFY-01
**Success Criteria** (what must be TRUE):
  1. Full game playthrough from intro to victory completes without crashes or broken transitions
  2. All 9 areas (intro, 6 levels, cinematic, victory) work correctly with their new implementations
  3. Any issues found during verification are fixed before milestone ships
**Plans**: TBD

Plans:
- [ ] 38-01: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 31 -> 32 -> 33 -> 34 -> 35 -> 36 -> 37 -> 38

| Phase | Milestone | Plans | Status | Completed |
|-------|-----------|-------|--------|-----------|
| 1. Audio Foundation | v1.0 | 1/1 | Complete | 2026-03-05 |
| 2-4. (Deferred) | v1.0 | 0/TBD | Deferred | - |
| 5-8. Polish Pass | v1.1 | 7/7 | Complete | 2026-03-19 |
| 9-14. Sprite & Polish v2 | v1.2 | 6/6 | Complete | 2026-03-19 |
| 15-20. Narrative & Audio | v1.3 | 6/6 | Complete | 2026-03-19 |
| 21-30. Final Polish | v1.4 | 10/10 | Complete | 2026-03-19 |
| 31. Intro Audio Fix | v1.5 | 1/1 | Complete | 2026-03-19 |
| 32. Level 1 Platformer Redesign | v1.5 | 3/3 | Complete | 2026-03-20 |
| 33. Level 2 Rename + Level 3 Physics | v1.5 | 0/2 | Not started | - |
| 34. Level 4 Complete Redesign | v1.5 | 0/TBD | Not started | - |
| 35. Level 5 B-2 + Explosion | v1.5 | 0/TBD | Not started | - |
| 36. Supreme Turban Cinematic | v1.5 | 0/TBD | Not started | - |
| 37. Victory Scene Redesign | v1.5 | 0/TBD | Not started | - |
| 38. Final Verification | v1.5 | 0/TBD | Not started | - |
