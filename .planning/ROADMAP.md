# Roadmap: SuperZion

## Milestones

- **v1.0 Cinematic & Audio** - Phases 1-4 (deferred after Phase 1 shipped)
- ✅ **v1.1 Polish Pass** - Phases 5-8 (shipped 2026-03-19)
- **v1.2 Sprite & Polish v2** - Phases 9-14 (in progress)

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

<details>
<summary>v1.0 Cinematic & Audio (Phases 1-4) - DEFERRED after Phase 1</summary>

- [x] **Phase 1: Audio Foundation** - Repair MusicManager with fade/crossfade and fix AudioBufferSourceNode leaks
- [ ] **Phase 2: Level Audio** - Author 6 distinct trance themes and per-level ambient layers (DEFERRED)
- [ ] **Phase 3: Cinematic Infrastructure** - Build CinematicDirector, TextureRegistry, and BaseCinematicScene refactor (DEFERRED)
- [ ] **Phase 4: Cinematics and Animation** - Deliver animated intro showcase, between-level sequences, and motion smear (DEFERRED)

</details>

<details>
<summary>v1.1 Polish Pass (Phases 5-8) -- SHIPPED 2026-03-19</summary>

- [x] Phase 5: Standalone Fixes (2/2 plans) -- completed 2026-03-19
- [x] Phase 6: Visual Identity (2/2 plans) -- completed 2026-03-19
- [x] Phase 7: Intro Overhaul (2/2 plans) -- completed 2026-03-19
- [x] Phase 8: End-Screen Standardization (1/1 plan) -- completed 2026-03-19

</details>

### v1.2 Sprite & Polish v2

- [ ] **Phase 9: Player Organic Drawing** - Replace all fillRect body parts in player sprite with arc/bezier/ellipse organic shapes
- [ ] **Phase 10: Propagate Organic Technique** - Apply organic drawing to all guards, bosses, workers, and Bomberman sprites
- [ ] **Phase 11: Star & Hard Hat Fixes** - Reposition Star of David to chest and redesign Level 2 hard hat
- [ ] **Phase 12: Intro Axis of Evil Fix** - Replace real country flags with fictional terrorist org logos
- [ ] **Phase 13: Intro Music** - Psytrance 145+ BPM from intro frame 1 with beat-synced effects
- [ ] **Phase 14: Logo Enhancement** - Thicker letters, outline, drop shadow, golden glow on SuperZion logo

## Phase Details

<details>
<summary>v1.0 Phase Details (Phases 1-4)</summary>

### Phase 1: Audio Foundation
**Goal**: Audio transitions cleanly between all scenes without abrupt cuts or memory leaks
**Depends on**: Nothing (first phase)
**Requirements**: AUDIO-01
**Success Criteria** (what must be TRUE):
  1. When any scene transition occurs, music fades out over a configurable duration instead of cutting abruptly
  2. After a theme change, no zombie AudioBufferSourceNode instances remain active (verifiable via browser AudioContext inspector)
  3. Restarting a scene does not double the volume or cause phasing artifacts from duplicate sound instances
  4. The MusicManager exposes crossfadeTo() so two themes can overlap with equal-power crossfade during transitions
**Plans:** 1 plan

Plans:
- [x] 01-01: Fix MusicManager fade/crossfade and audit all scene transition callsites

### Phase 2: Level Audio (DEFERRED)
**Goal**: Each level has a distinct audio identity
**Depends on**: Phase 1
**Requirements**: AUDIO-02, AUDIO-03
**Plans**: Deferred to future milestone

### Phase 3: Cinematic Infrastructure (DEFERRED)
**Goal**: Reusable cinematic system for sequencing sprites, text, and music
**Depends on**: Phase 2
**Requirements**: (infrastructure)
**Plans**: Deferred to future milestone

### Phase 4: Cinematics and Animation (DEFERRED)
**Goal**: Choreographed intro showcase, between-level sequences, motion smear
**Depends on**: Phase 3
**Requirements**: CINE-01, CINE-02, ANIM-01
**Plans**: Deferred to future milestone

</details>

<details>
<summary>v1.1 Phase Details (Phases 5-8)</summary>

### Phase 5: Standalone Fixes -- 2/2 plans, completed 2026-03-19
### Phase 6: Visual Identity -- 2/2 plans, completed 2026-03-19
### Phase 7: Intro Overhaul -- 2/2 plans, completed 2026-03-19
### Phase 8: End-Screen Standardization -- 1/1 plan, completed 2026-03-19

See `.planning/milestones/v1.1-ROADMAP.md` for full details.

</details>

### Phase 9: Player Organic Drawing
**Goal**: The player character looks like a hand-drawn human figure, not a stack of rectangles
**Depends on**: Nothing (first phase of v1.2, builds on existing SpriteGenerator)
**Requirements**: DRAW-01, DRAW-02, DRAW-03, DRAW-04
**Success Criteria** (what must be TRUE):
  1. Player sprite has an oval head, curved torso, and limbs with rounded joints -- no visible fillRect edges on any body part
  2. Beard is rendered as a gradient arc on the jawline with semi-transparent coloring -- no zigzag lines or hard-edged rectangles
  3. Eyes are small ovals with distinct pupils -- no square dots
  4. The organic player sprite renders correctly in all 6 gameplay levels, menu, and cinematics without visual glitches
**Plans**: TBD

### Phase 10: Propagate Organic Technique
**Goal**: Every human figure in the game matches the organic drawing quality established in Phase 9
**Depends on**: Phase 9 (technique must exist before propagating)
**Requirements**: DRAW-05, DRAW-06, DRAW-07, DRAW-08
**Success Criteria** (what must be TRUE):
  1. All guard sprites across all levels have oval heads, shaped bodies, and rounded limbs -- no fillRect body parts
  2. All 4 boss sprites in the cinematic parade use organic shapes matching the player's quality level
  3. Level 1 Bomberman top-down sprite is redrawn with organic forms consistent with the side-view game style
  4. Any remaining worker/NPC sprites across all scenes use the organic drawing technique -- zero fillRect humans remain in the game
**Plans**: TBD

### Phase 11: Star & Hard Hat Fixes
**Goal**: The Star of David sits visibly on the player's chest and the Level 2 hard hat looks like a real construction helmet
**Depends on**: Phase 9 (star placement depends on organic torso shape)
**Requirements**: STAR-01, HAT-01
**Success Criteria** (what must be TRUE):
  1. Star of David is positioned at center of vest/chest area (above stomach, below neck) and visible in all player sprite appearances across all scenes
  2. Level 2 hard hat is drawn with arc-based rounded shape, has a visible front visor, and includes reflective highlight details
**Plans**: TBD

### Phase 12: Intro Axis of Evil Fix
**Goal**: The Axis of Evil intro section shows fictional organizations, removing all real country flag associations
**Depends on**: Nothing (independent of sprite work)
**Requirements**: INTR-01, INTR-02
**Success Criteria** (what must be TRUE):
  1. Axis of Evil section displays fictional terrorist org logos (skull emblem, red fist, etc.) instead of any real country flags
  2. Israel flag appears only in the Israel/arsenal section of the intro, never in the Axis of Evil section
  3. The fictional logos are visually distinct from each other and read as menacing organizations at 960x540 resolution
**Plans**: TBD

### Phase 13: Intro Music
**Goal**: The intro cinematic hits hard with psytrance from the very first frame, with effects locked to the beat
**Depends on**: Nothing (independent of sprite and logo work)
**Requirements**: INTR-03, INTR-04
**Success Criteria** (what must be TRUE):
  1. Psytrance at 145+ BPM starts playing on the first frame of the intro cinematic with zero delay
  2. Explosion effects and visual impacts are synchronized to beat boundaries -- visible alignment between audio kicks and screen events
  3. Music is generated procedurally via Web Audio API (no external audio files)
**Plans**: TBD

### Phase 14: Logo Enhancement
**Goal**: The SuperZion logo looks bold and premium with thickness, depth, and glow
**Depends on**: Nothing (independent of other phases, but scheduled last as lowest priority)
**Requirements**: LOGO-01, LOGO-02, LOGO-03, LOGO-04
**Success Criteria** (what must be TRUE):
  1. SuperZion letters are visibly thicker with a 3px black outline/stroke that makes them pop against any background
  2. Drop shadow is visible beneath the logo text, giving depth separation from the background
  3. Golden glow/bloom radiates outward from the logo letters
  4. Menu scene and intro cinematic scene render the exact same logo -- no visual differences between the two appearances
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 9 -> 10 -> 11 -> 12 -> 13 -> 14

| Phase | Milestone | Plans | Status | Completed |
|-------|-----------|-------|--------|-----------|
| 1. Audio Foundation | v1.0 | 1/1 | Complete | 2026-03-05 |
| 2-4. Level Audio, Cinematic Infra, Cinematics | v1.0 | 0/TBD | Deferred | - |
| 5. Standalone Fixes | v1.1 | 2/2 | Complete | 2026-03-19 |
| 6. Visual Identity | v1.1 | 2/2 | Complete | 2026-03-19 |
| 7. Intro Overhaul | v1.1 | 2/2 | Complete | 2026-03-19 |
| 8. End-Screen Standardization | v1.1 | 1/1 | Complete | 2026-03-19 |
| 9. Player Organic Drawing | v1.2 | 0/TBD | Not started | - |
| 10. Propagate Organic Technique | v1.2 | 0/TBD | Not started | - |
| 11. Star & Hard Hat Fixes | v1.2 | 0/TBD | Not started | - |
| 12. Intro Axis of Evil Fix | v1.2 | 0/TBD | Not started | - |
| 13. Intro Music | v1.2 | 0/TBD | Not started | - |
| 14. Logo Enhancement | v1.2 | 0/TBD | Not started | - |
