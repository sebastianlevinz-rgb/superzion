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

- [x] **LVL5-01**: B-2 redesigned as flying wing -- boomerang/bat shape, wide and flat (NOT triangle with line)
- [x] **LVL5-02**: B-2 dark gray with panel lines, moonlight highlights on upper edges, subtle outline
- [x] **LVL5-03**: Mountain clearly looks like a mountain (texture, vegetation, rock detail)
- [x] **LVL5-04**: Spectacular explosion: white flash, fireball, mountain cracks, fire columns through cracks, partial collapse, mushroom cloud, falling debris, secondary fires
- [x] **LVL5-05**: Strong prolonged screen shake during mountain explosion

### Supreme Turban Cinematic

- [x] **CINE-01**: Dark dramatic music -- slow grave drums, ominous brass, minor key, sense of final danger
- [x] **CINE-02**: Background: fire, smoke, army silhouettes, missile trucks, soldiers loading weapons, stacked armaments (detailed war scene)
- [x] **CINE-03**: Supreme Turban more imposing -- larger, more detailed, brighter red eyes, crescent moon staff glowing

### Victory Scene

- [x] **VICT-01**: Opening line: "The weapons are silent. For the first time in years... silence."
- [x] **VICT-02**: Complete new narrative text (ashes/peace, 3000 years, belongs to every soul, those who came before/beside/after)
- [x] **VICT-03**: SuperZion facing forward, illuminated, detailed, SMILING (not silhouette from behind)
- [x] **VICT-04**: Maguen David on chest or as giant golden background (not on back)
- [x] **VICT-05**: SuperZion surrounded by celebrating people: soldiers, civilians, children, dogs, cats
- [x] **VICT-06**: People with Israel flags, hugging, jumping, clapping
- [x] **VICT-07**: Gold, blue, and white confetti falling
- [x] **VICT-08**: Animated fireworks in sky (explode and fade)
- [x] **VICT-09**: Animated sunrise (sun slowly rises)
- [x] **VICT-10**: Moving clouds
- [x] **VICT-11**: Emotional epic music with memorable melody (most emotional moment in the game)
- [x] **VICT-12**: Final lines: "Am Yisrael Chai." + "THEY FIGHT TO CONQUER. WE FIGHT TO EXIST."

### Verification

- [x] **VRFY-01**: Full game playthrough verifying all 9 areas work correctly, fixing any issues found

## v1.6 Requirements

Requirements for Angry Eyebrows Boss Redesign.

### Boss Sprite Design

- [x] **BOSS-01**: Angry Eyebrows has cabezón proportions (~40% head, ~60% body)
- [x] **BOSS-02**: Elongated oval head shape (taller than wide, using ellipse)
- [x] **BOSS-03**: Short gray military-cut hair with receding hairline
- [x] **BOSS-04**: THICK prominent eyebrows as signature feature (>4px high, >15px wide at 128px scale)
- [x] **BOSS-05**: Eyebrows inclined inward (V-shape), almost touching, with hair texture
- [x] **BOSS-06**: Small squinting intense eyes below heavy eyebrow shadows
- [x] **BOSS-07**: Large prominent nose (trapezoidal)
- [x] **BOSS-08**: Thin frowning mouth, never smiles, slight asymmetric rictus
- [x] **BOSS-09**: Short compact gray beard following jawline (not long wizard beard)
- [x] **BOSS-10**: Kefia with checkered pattern on SHOULDERS (not on head)
- [x] **BOSS-11**: Dark suit/saco beneath kefia with lapels and buttons
- [x] **BOSS-12**: Olive/middle-eastern skin tone (#C4956A)

### Boss Mechanics

- [x] **MECH-01**: When hiding behind armchair, ONLY eyebrows+eyes visible above armchair back
- [x] **MECH-02**: Thrown objects are large and visible (>20px): chairs, concrete, bricks
- [x] **MECH-03**: Armchair is individual (not sofa), textured, olive/brown

### Design Audit

- [x] **AUDIT-01**: design-audit.html has "Boss Design" section covering all 4 bosses
- [x] **AUDIT-02**: Each boss evaluated with design checklist, organicity score, sprite size
- [x] **AUDIT-03**: Dashboard counters updated with boss audit data

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
| LVL5-01 | Phase 35 | Complete |
| LVL5-02 | Phase 35 | Complete |
| LVL5-03 | Phase 35 | Complete |
| LVL5-04 | Phase 35 | Complete |
| LVL5-05 | Phase 35 | Complete |
| CINE-01 | Phase 36 | Complete |
| CINE-02 | Phase 36 | Complete |
| CINE-03 | Phase 36 | Complete |
| VICT-01 | Phase 37 | Complete |
| VICT-02 | Phase 37 | Complete |
| VICT-03 | Phase 37 | Complete |
| VICT-04 | Phase 37 | Complete |
| VICT-05 | Phase 37 | Complete |
| VICT-06 | Phase 37 | Complete |
| VICT-07 | Phase 37 | Complete |
| VICT-08 | Phase 37 | Complete |
| VICT-09 | Phase 37 | Complete |
| VICT-10 | Phase 37 | Complete |
| VICT-11 | Phase 37 | Complete |
| VICT-12 | Phase 37 | Complete |
| VRFY-01 | Phase 38 | Complete |
| BOSS-01 | Phase 39 | Complete |
| BOSS-02 | Phase 39 | Complete |
| BOSS-03 | Phase 39 | Complete |
| BOSS-04 | Phase 39 | Complete |
| BOSS-05 | Phase 39 | Complete |
| BOSS-06 | Phase 39 | Complete |
| BOSS-07 | Phase 39 | Complete |
| BOSS-08 | Phase 39 | Complete |
| BOSS-09 | Phase 39 | Complete |
| BOSS-10 | Phase 39 | Complete |
| BOSS-11 | Phase 39 | Complete |
| BOSS-12 | Phase 39 | Complete |
| MECH-01 | Phase 39 | Complete |
| MECH-02 | Phase 39 | Complete |
| MECH-03 | Phase 39 | Complete |
| AUDIT-01 | Phase 39 | Complete |
| AUDIT-02 | Phase 39 | Complete |
| AUDIT-03 | Phase 39 | Complete |

**Coverage:**
- v1.5 requirements: 53 total
- Mapped to phases: 53
- Unmapped: 0
- v1.6 requirements: 18 total
- Mapped to phases: 18
- Unmapped: 0

---
*Requirements defined: 2026-03-19*
*Last updated: 2026-03-23 after v1.6 milestone started*
