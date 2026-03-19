# Roadmap: SuperZion

## Milestones

- **v1.0 Cinematic & Audio** - Phases 1-4 (deferred after Phase 1 shipped)
- **v1.1 Polish Pass** - Phases 5-8 (in progress)

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

### v1.1 Polish Pass

- [x] **Phase 5: Standalone Fixes** - Fix Level 2 passability, F-15 wings, and controls overlay readability
- [ ] **Phase 6: Visual Identity** - Audit and align player sprite across all three texture systems; restore real boss parade sprites
- [ ] **Phase 7: Intro Overhaul** - Restore flags, build final title screen, wire psytrance SFX, and add camera shake to intro
- [ ] **Phase 8: End-Screen Standardization** - Migrate all 6 levels to shared EndScreen.js with consistent win/lose navigation

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

### Phase 5: Standalone Fixes
**Goal**: Three isolated shipping blockers are resolved without touching shared systems
**Depends on**: Phase 1 (v1.0 audio foundation)
**Requirements**: GAME-01, GAME-02, UX-02
**Success Criteria** (what must be TRUE):
  1. Player can navigate Level 2 container corridors from start to bomb-plant target and back to exit without getting stuck on any wall or obstacle
  2. The F-15 jet in Level 3 cinematic displays swept-back wings angled toward the tail (not forward-pointing)
  3. Controls overlay text in all 6 levels renders as large bright yellow text on a semi-transparent black background, readable against every level's background
**Plans:** 2 plans

Plans:
- [x] 05-01-PLAN.md — Fix Level 2 container passability (GAME-01)
- [x] 05-02-PLAN.md — Fix F-15 wing direction and controls overlay styling (GAME-02, UX-02)

### Phase 6: Visual Identity
**Goal**: The player character looks like a Mossad agent (not placeholder cubes) everywhere, and boss parade sprites display as real characters
**Depends on**: Phase 5
**Requirements**: VIS-01, VIS-02
**Success Criteria** (what must be TRUE):
  1. Player sprite in gameplay (SpriteGenerator), cinematics (CinematicTextures), and intro parade (ParadeTextures) all display a human figure with tactical black suit, slicked-back hair, beard shadow, and chest emblem — visually consistent across all three contexts
  2. The intro boss parade shows four distinct boss characters (Foam Beard, Turbo Turban, The Warden, Supreme Turban) as real sprites with animated super attacks, not colored rectangles
  3. Player sprite reads clearly at game-scale rendered sizes (32-48px height) with recognizable silhouette and details
**Plans:** 2 plans

Plans:
- [ ] 06-01-PLAN.md — Align player sprite palette across CinematicTextures and ParadeTextures (VIS-01)
- [ ] 06-02-PLAN.md — Replace boss rectangles with real parade sprites and attack animations (VIS-02)

### Phase 7: Intro Overhaul
**Goal**: The intro sequence is a polished cinematic showcase with real sprites, waving flags, synchronized audio, screen shake, and a dramatic title reveal
**Depends on**: Phase 6
**Requirements**: INTRO-01, INTRO-02, INTRO-03, INTRO-04
**Success Criteria** (what must be TRUE):
  1. Four waving flag animations (Iran, Lebanon, Palestine, Israel) appear in the intro parade sequence using generated flag spritesheets
  2. Final intro screen displays a giant golden semi-transparent Maguen David behind SuperZion with "SUPERZION" in wide thick arcade-style font and a larger subtitle below
  3. Psytrance music at 145+ BPM plays from the first frame of the intro, and visual events (missile launches, explosions, jet flybys, gunfire) are accompanied by synchronized SFX
  4. Camera shakes visibly on every explosion during the intro sequence
**Plans**: TBD

Plans:
- [ ] 07-01: TBD
- [ ] 07-02: TBD
- [ ] 07-03: TBD

### Phase 8: End-Screen Standardization
**Goal**: Every level ends with a clear, consistent navigation screen so players always know how to retry, continue, or skip
**Depends on**: Phase 5 (independent of Phases 6-7)
**Requirements**: UX-01
**Success Criteria** (what must be TRUE):
  1. Winning any of the 6 levels shows "PLAY AGAIN (R)" and "NEXT LEVEL (ENTER)" options that work correctly when pressed
  2. Losing any of the 6 levels shows "RETRY (R)" and "SKIP LEVEL (S)" options that work correctly when pressed
  3. End screens appear after any scene-specific victory/defeat animations complete (no overlay clipping boss disintegration, no stats skipped)
  4. No keyboard listener leaks accumulate across retries — scene shutdown cleans up all EndScreen key bindings
**Plans**: TBD

Plans:
- [ ] 08-01: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 5 → 6 → 7 → 8
(Phase 8 depends only on Phase 5 and can parallel Phases 6-7 if needed)

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Audio Foundation | v1.0 | 1/1 | Complete | 2026-03-05 |
| 2. Level Audio | v1.0 | 0/TBD | Deferred | - |
| 3. Cinematic Infrastructure | v1.0 | 0/TBD | Deferred | - |
| 4. Cinematics and Animation | v1.0 | 0/TBD | Deferred | - |
| 5. Standalone Fixes | v1.1 | 2/2 | Complete | 2026-03-19 |
| 6. Visual Identity | v1.1 | 0/2 | Not started | - |
| 7. Intro Overhaul | v1.1 | 0/3 | Not started | - |
| 8. End-Screen Standardization | v1.1 | 0/1 | Not started | - |
