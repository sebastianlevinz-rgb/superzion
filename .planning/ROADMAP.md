# Roadmap: SuperZion

## Milestones

- **v1.0 Cinematic & Audio** - Phases 1-4 (deferred after Phase 1 shipped)
- ✅ **v1.1 Polish Pass** - Phases 5-8 (shipped 2026-03-19)
- ✅ **v1.2 Sprite & Polish v2** - Phases 9-14 (shipped 2026-03-19)
- ✅ **v1.3 Narrative & Audio** - Phases 15-20 (shipped 2026-03-19)
- **v1.4 Final Polish** - Phases 21-30 (in progress)

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

### v1.4 Final Polish

- [ ] **Phase 21: Sprite & Visual Quick Fixes** - Fix beard geometry, Star of David position, B-2 contrast
- [ ] **Phase 22: Intro Melody System** - Replace psytrance noise with real hummable melody
- [ ] **Phase 23: Level 3 Missile Rebalance** - Double plane speed, slower missiles, warnings, cap at 2
- [ ] **Phase 24: Level 4 Drone City Intro** - Playable drone flight through ruined city before boss
- [ ] **Phase 25: Level 4 Boss Rework + Dodge** - Warden hides/peeks AI + SHIFT dash
- [ ] **Phase 26: Flight Route Animations** - "En route" mini-animation before each level
- [ ] **Phase 27: Victory Scene Enhancement** - Sunset, crowd, confetti, fireworks
- [ ] **Phase 28: Title Screen Overhaul** - Destroyed city bg, glowing star, 3D text, particles
- [ ] **Phase 29: Intro Text Visual Backgrounds** - Abstract imagery behind intro text pages
- [ ] **Phase 30: Full Game Verification** - Playthrough all items, fix regressions

## Phase Details

### Phase 21: Sprite & Visual Quick Fixes
**Goal**: Fix beard geometry, Star of David position, and B-2 contrast
**Requirements**: SPRT-01, SPRT-02, SPRT-03
**Success Criteria**:
  1. Beard curves downward (concave) in SpriteGenerator, CinematicTextures, ParadeTextures, BossTextures
  2. Level 1 top-down sprite has Star of David at chest center
  3. B-2 sprite has visible moonlight highlights, outline, brighter engine glow

### Phase 22: Intro Melody System
**Goal**: Replace psytrance noise with real hummable melody in intro
**Requirements**: MUSC-01, MUSC-02, MUSC-03
**Success Criteria**:
  1. Melodic piano/strings from first text line
  2. 4 distinct mood transitions audible
  3. Music never stops until menu transition

### Phase 23: Level 3 Missile Rebalance
**Goal**: Make Level 3 missiles dodgeable and fair
**Requirements**: LV3-01, LV3-02, LV3-03, LV3-04
**Success Criteria**:
  1. Plane moves noticeably faster
  2. Missiles visibly slower with wide arcing turns
  3. Flashing warning appears before each missile
  4. Never more than 2 missiles visible

### Phase 24: Level 4 Drone City Intro
**Goal**: Add playable drone flight through ruined city before boss
**Requirements**: LV4-01, LV4-02, LV4-03
**Success Criteria**:
  1. Top-down drone navigation scene with rubble and buildings
  2. Glowing open window is findable
  3. Enemy drones patrol and shoot on detection

### Phase 25: Level 4 Boss Rework + Dodge
**Goal**: Fix Warden AI and add dash/dodge mechanic
**Requirements**: LV4-04, LV4-05
**Success Criteria**:
  1. Warden visibly hides behind sofa, peeks, throws, hides again
  2. SHIFT performs a visible dash with 1s cooldown indicator

### Phase 26: Flight Route Animations
**Goal**: Add "en route" mini-animation before each level
**Requirements**: CINE-01, CINE-02, CINE-03
**Success Criteria**:
  1. Simplified Middle East map with Israel visible
  2. Animated plane + dotted line to each destination
  3. SPACE skips, takes 3-4 seconds

### Phase 27: Victory Scene Enhancement
**Goal**: Make victory screen spectacular with confetti, fireworks, crowd
**Requirements**: VICT-01, VICT-02, VICT-03, VICT-04, VICT-05
**Success Criteria**:
  1. Multi-color sunset gradient with illuminated clouds
  2. SuperZion lit by sunset colors, details visible
  3. Small celebrating figures at bottom
  4. Falling confetti particles (gold, blue, white)
  5. Fireworks intensify at "Am Yisrael Chai"

### Phase 28: Title Screen Overhaul
**Goal**: Add depth and atmosphere to title screen
**Requirements**: TITL-01, TITL-02, TITL-03, TITL-04, TITL-05
**Success Criteria**:
  1. Destroyed city scene with smoke and golden light
  2. Star of David emits light rays
  3. SUPERZION text has 3D depth effect
  4. Ember particles float upward
  5. Screen shakes when title appears

### Phase 29: Intro Text Visual Backgrounds
**Goal**: Add abstract visual backgrounds to intro text pages
**Requirements**: INTR-01, INTR-02, INTR-03
**Success Criteria**:
  1. Flames/ruins imagery during "Babylon. Rome." text
  2. Light point appears at "came back"
  3. Light grows at "still here"

### Phase 30: Full Game Verification
**Goal**: Playthrough all 10 items end-to-end, fix anything broken
**Success Criteria**:
  1. All 31 requirements verified working
  2. No regressions in existing gameplay
  3. Zero silence from intro to credits

## Progress

| Phase | Milestone | Plans | Status | Completed |
|-------|-----------|-------|--------|-----------|
| 1. Audio Foundation | v1.0 | 1/1 | Complete | 2026-03-05 |
| 2-4. (Deferred) | v1.0 | 0/TBD | Deferred | - |
| 5-8. Polish Pass | v1.1 | 7/7 | Complete | 2026-03-19 |
| 9-14. Sprite & Polish v2 | v1.2 | 6/6 | Complete | 2026-03-19 |
| 15-20. Narrative & Audio | v1.3 | 6/6 | Complete | 2026-03-19 |
| 21. Sprite & Visual Quick Fixes | v1.4 | 0/1 | Not started | - |
| 22. Intro Melody System | v1.4 | 0/1 | Not started | - |
| 23. Level 3 Missile Rebalance | v1.4 | 0/1 | Not started | - |
| 24. Level 4 Drone City Intro | v1.4 | 0/1 | Not started | - |
| 25. Level 4 Boss Rework + Dodge | v1.4 | 0/1 | Not started | - |
| 26. Flight Route Animations | v1.4 | 0/1 | Not started | - |
| 27. Victory Scene Enhancement | v1.4 | 0/1 | Not started | - |
| 28. Title Screen Overhaul | v1.4 | 0/1 | Not started | - |
| 29. Intro Text Visual Backgrounds | v1.4 | 0/1 | Not started | - |
| 30. Full Game Verification | v1.4 | 0/1 | Not started | - |
