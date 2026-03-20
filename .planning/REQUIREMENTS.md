# Requirements: SuperZion

**Defined:** 2026-03-19
**Core Value:** Every visible element must look intentional and polished -- no placeholder cubes, no missing audio, no broken levels.

## v1.5 Requirements

Requirements for Megafix v3. Each maps to roadmap phases.

### Intro Audio

- [x] **INTRO-01**: Intro uses menu music instead of current intro music (delete current intro music entirely)
- [x] **INTRO-02**: No loud/unpleasant sounds during title screen Maguen David appearance (smooth transition)
- [x] **INTRO-03**: Music plays continuously from first frame of intro through to menu scene

### Level 1 Redesign

- [x] **LVL1-01**: Phase 1 platformer -- SuperZion runs across Tehran rooftops at night (side-scrolling, Super Mario style)
- [x] **LVL1-02**: Tehran night skyline background with Azadi Tower, Milad Tower, Alborz mountains, moon, stars (detailed)
- [x] **LVL1-03**: Platforms are Iranian building rooftops, balconies, cornices, mosque domes
- [x] **LVL1-04**: Obstacles: rotating security cameras with vision cones, patrolling guards on rooftops, searchlights, electric wire
- [x] **LVL1-05**: Guards walk ON the floor -- feet touch ground, never float (verify with console.log)
- [x] **LVL1-06**: End of platformer phase: reach target building, enter through window, visual transition to top-down
- [x] **LVL1-07**: Phase 2 Bomberman gameplay preserved intact from current implementation
- [x] **LVL1-08**: Key is visible, pickable, and functional in Bomberman phase (fix if bugged)
- [x] **LVL1-09**: Star of David lowered to center of chest on top-down sprite (currently at neck level)

### Level 2 Rename

- [x] **LVL2-01**: "Operation Signal Storm" renamed to "Operation Explosive Interception" in all locations (cinematic, HUD, menu, victory)

### Level 3 Physics

- [x] **LVL3-01**: Constant gravity -- plane always falls if no input
- [x] **LVL3-02**: Up arrow = thrust -- plane rises while held
- [x] **LVL3-03**: Left/right arrows = plane tilt/inclination
- [x] **LVL3-04**: Crash (explosion) on high vertical speed landing on carrier
- [x] **LVL3-05**: Crash (explosion) on water contact
- [x] **LVL3-06**: Crash (explosion) on insufficient takeoff thrust (falls into water)
- [x] **LVL3-07**: Landing requires precision -- slow descent, aligned, controlled speed
- [x] **LVL3-08**: Plane feels like it has weight and momentum (not a floating cursor)

### Level 4 Redesign

- [ ] **LVL4-01**: Daytime setting (not night) for entire level
- [ ] **LVL4-02**: Phase 1 -- drone flies RIGHT through ruined city (horizontal scroll, not downward)
- [ ] **LVL4-03**: Detailed ruins: destroyed buildings, missing walls, collapsed roofs, rubble, craters, hanging cables, exposed furniture, destroyed cars, dust
- [ ] **LVL4-04**: Target building identified by subtle glow or marker
- [ ] **LVL4-05**: Enemy drones patrol and shoot on detection
- [ ] **LVL4-06**: Enter target building through open window to trigger Phase 2
- [ ] **LVL4-07**: Phase 2 boss fight in destroyed building interior with daytime light through holes in walls/ceiling
- [ ] **LVL4-08**: Detailed room: broken lamps, cracked mirrors, overturned tables, broken chairs, rubble, cables, dust in air
- [ ] **LVL4-09**: Individual armchair (mono-sillon, NOT sofa), larger than before
- [ ] **LVL4-10**: The Warden hides behind armchair, peeks to throw objects, hides again
- [ ] **LVL4-11**: SHIFT dodge/dash works in boss fight

### Level 5 Redesign

- [ ] **LVL5-01**: B-2 redesigned as flying wing -- boomerang/bat shape, wide and flat (NOT triangle with line)
- [ ] **LVL5-02**: B-2 dark gray with panel lines, moonlight highlights on upper edges, subtle outline
- [ ] **LVL5-03**: Mountain clearly looks like a mountain (texture, vegetation, rock detail)
- [x] **LVL5-04**: Spectacular explosion: white flash, fireball, mountain cracks, fire columns through cracks, partial collapse, mushroom cloud, falling debris, secondary fires
- [x] **LVL5-05**: Strong prolonged screen shake during mountain explosion

### Supreme Turban Cinematic

- [ ] **CINE-01**: Dark dramatic music -- slow grave drums, ominous brass, minor key, sense of final danger
- [ ] **CINE-02**: Background: fire, smoke, army silhouettes, missile trucks, soldiers loading weapons, stacked armaments (detailed war scene)
- [ ] **CINE-03**: Supreme Turban more imposing -- larger, more detailed, brighter red eyes, crescent moon staff glowing

### Victory Scene

- [ ] **VICT-01**: Opening line: "The weapons are silent. For the first time in years... silence."
- [ ] **VICT-02**: Complete new narrative text (ashes/peace, 3000 years, belongs to every soul, those who came before/beside/after)
- [ ] **VICT-03**: SuperZion facing forward, illuminated, detailed, SMILING (not silhouette from behind)
- [ ] **VICT-04**: Maguen David on chest or as giant golden background (not on back)
- [ ] **VICT-05**: SuperZion surrounded by celebrating people: soldiers, civilians, children, dogs, cats
- [ ] **VICT-06**: People with Israel flags, hugging, jumping, clapping
- [ ] **VICT-07**: Gold, blue, and white confetti falling
- [ ] **VICT-08**: Animated fireworks in sky (explode and fade)
- [ ] **VICT-09**: Animated sunrise (sun slowly rises)
- [ ] **VICT-10**: Moving clouds
- [ ] **VICT-11**: Emotional epic music with memorable melody (most emotional moment in the game)
- [ ] **VICT-12**: Final lines: "Am Yisrael Chai." + "THEY FIGHT TO CONQUER. WE FIGHT TO EXIST."

### Verification

- [ ] **VRFY-01**: Full game playthrough verifying all 9 areas work correctly, fixing any issues found

## Out of Scope

| Feature | Reason |
|---------|--------|
| External audio files (mp3/ogg) | Everything stays procedural via Web Audio API |
| Save/load system | Not in current milestone scope |
| New levels beyond existing 6 | Megafix focuses on improving existing content |
| Accessibility features | Deferred |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| INTRO-01 | Phase 31 | Complete |
| INTRO-02 | Phase 31 | Complete |
| INTRO-03 | Phase 31 | Complete |
| LVL1-01 | Phase 32 | Complete |
| LVL1-02 | Phase 32 | Complete |
| LVL1-03 | Phase 32 | Complete |
| LVL1-04 | Phase 32 | Complete |
| LVL1-05 | Phase 32 | Complete |
| LVL1-06 | Phase 32 | Complete |
| LVL1-07 | Phase 32 | Complete |
| LVL1-08 | Phase 32 | Complete |
| LVL1-09 | Phase 32 | Complete |
| LVL2-01 | Phase 33 | Complete |
| LVL3-01 | Phase 33 | Complete |
| LVL3-02 | Phase 33 | Complete |
| LVL3-03 | Phase 33 | Complete |
| LVL3-04 | Phase 33 | Complete |
| LVL3-05 | Phase 33 | Complete |
| LVL3-06 | Phase 33 | Complete |
| LVL3-07 | Phase 33 | Complete |
| LVL3-08 | Phase 33 | Complete |
| LVL4-01 | Phase 34 | Pending |
| LVL4-02 | Phase 34 | Pending |
| LVL4-03 | Phase 34 | Pending |
| LVL4-04 | Phase 34 | Pending |
| LVL4-05 | Phase 34 | Pending |
| LVL4-06 | Phase 34 | Pending |
| LVL4-07 | Phase 34 | Pending |
| LVL4-08 | Phase 34 | Pending |
| LVL4-09 | Phase 34 | Pending |
| LVL4-10 | Phase 34 | Pending |
| LVL4-11 | Phase 34 | Pending |
| LVL5-01 | Phase 35 | Pending |
| LVL5-02 | Phase 35 | Pending |
| LVL5-03 | Phase 35 | Pending |
| LVL5-04 | Phase 35 | Complete |
| LVL5-05 | Phase 35 | Complete |
| CINE-01 | Phase 36 | Pending |
| CINE-02 | Phase 36 | Pending |
| CINE-03 | Phase 36 | Pending |
| VICT-01 | Phase 37 | Pending |
| VICT-02 | Phase 37 | Pending |
| VICT-03 | Phase 37 | Pending |
| VICT-04 | Phase 37 | Pending |
| VICT-05 | Phase 37 | Pending |
| VICT-06 | Phase 37 | Pending |
| VICT-07 | Phase 37 | Pending |
| VICT-08 | Phase 37 | Pending |
| VICT-09 | Phase 37 | Pending |
| VICT-10 | Phase 37 | Pending |
| VICT-11 | Phase 37 | Pending |
| VICT-12 | Phase 37 | Pending |
| VRFY-01 | Phase 38 | Pending |

**Coverage:**
- v1.5 requirements: 53 total
- Mapped to phases: 53
- Unmapped: 0

---
*Requirements defined: 2026-03-19*
*Last updated: 2026-03-19 after roadmap creation*
