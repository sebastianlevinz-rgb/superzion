# Roadmap: SuperZion — Cinematic & Audio Polish

## Overview

This milestone transforms SuperZion from a functional stealth game into a cinematic experience. Four phases deliver in strict infrastructure-before-content order: audio management is repaired first (it is a hard dependency for everything), per-level trance themes and ambient layers are authored second, cinematic scene infrastructure is built third, and all visible cinematic content plus animation is delivered last. Each phase is independently verifiable; later phases cannot start until earlier ones are stable.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Audio Foundation** - Repair MusicManager with fade/crossfade and fix AudioBufferSourceNode leaks
- [ ] **Phase 2: Level Audio** - Author 6 distinct trance themes and per-level ambient layers
- [ ] **Phase 3: Cinematic Infrastructure** - Build CinematicDirector, TextureRegistry, and BaseCinematicScene refactor
- [ ] **Phase 4: Cinematics and Animation** - Deliver animated intro showcase, between-level sequences, and motion smear

## Phase Details

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
- [ ] 01-01-PLAN.md — Fix MusicManager fade/crossfade and audit all scene transition callsites

### Phase 2: Level Audio
**Goal**: Each level has a distinct audio identity — unique trance music and an environmental atmosphere layer
**Depends on**: Phase 1
**Requirements**: AUDIO-02, AUDIO-03
**Success Criteria** (what must be TRUE):
  1. Each of the 6 levels plays a trance theme with a perceptibly different BPM, melodic character, and atmosphere from all other levels
  2. Each level has an ambient environmental audio layer (wind, city hum, aircraft, etc.) audible during gameplay beneath the music
  3. The ambient layer and trance theme play simultaneously as independent audio channels without interfering with each other
**Plans**: TBD

### Phase 3: Cinematic Infrastructure
**Goal**: A reusable cinematic system exists that any scene can consume to sequence sprites, text, and music without inline boilerplate
**Depends on**: Phase 2
**Requirements**: (none — infrastructure phase enabling Phase 4)
**Success Criteria** (what must be TRUE):
  1. All procedural sprite sheets needed for cinematics are generated once at boot and available by string key — no per-scene regeneration jank
  2. A CinematicDirector class exists and can sequence sprite entrances, exits, movement, and text events via a declarative timeline
  3. BaseCinematicScene provides letterbox bars and scene lifecycle hooks that all cinematic scenes inherit without duplicating code
**Plans**: TBD

### Phase 4: Cinematics and Animation
**Goal**: The game opens with a choreographed intro showcase and transitions between levels with animated story sequences; fast movements have visible motion weight
**Depends on**: Phase 3
**Requirements**: CINE-01, CINE-02, ANIM-01
**Success Criteria** (what must be TRUE):
  1. Before the main menu, an animated intro showcase plays with boss, plane, and character reveals choreographed to trance music beats
  2. Between levels, story sequences show animated sprites that enter, move, gesture, and exit — not typewriter text alone
  3. Fast character entrances and movements display a one-frame motion smear (horizontal blur/stretch) that gives them visual weight
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Audio Foundation | 0/1 | Planning complete | - |
| 2. Level Audio | 0/TBD | Not started | - |
| 3. Cinematic Infrastructure | 0/TBD | Not started | - |
| 4. Cinematics and Animation | 0/TBD | Not started | - |
