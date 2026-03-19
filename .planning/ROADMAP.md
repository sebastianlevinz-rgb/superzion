# Roadmap: SuperZion

## Milestones

- **v1.0 Cinematic & Audio** - Phases 1-4 (deferred after Phase 1 shipped)
- ✅ **v1.1 Polish Pass** - Phases 5-8 (shipped 2026-03-19)

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
<summary>✅ v1.1 Polish Pass (Phases 5-8) — SHIPPED 2026-03-19</summary>

- [x] Phase 5: Standalone Fixes (2/2 plans) — completed 2026-03-19
- [x] Phase 6: Visual Identity (2/2 plans) — completed 2026-03-19
- [x] Phase 7: Intro Overhaul (2/2 plans) — completed 2026-03-19
- [x] Phase 8: End-Screen Standardization (1/1 plan) — completed 2026-03-19

</details>

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

### Phase 5: Standalone Fixes — 2/2 plans, completed 2026-03-19
### Phase 6: Visual Identity — 2/2 plans, completed 2026-03-19
### Phase 7: Intro Overhaul — 2/2 plans, completed 2026-03-19
### Phase 8: End-Screen Standardization — 1/1 plan, completed 2026-03-19

See `.planning/milestones/v1.1-ROADMAP.md` for full details.

</details>

## Progress

| Phase | Milestone | Plans | Status | Completed |
|-------|-----------|-------|--------|-----------|
| 1. Audio Foundation | v1.0 | 1/1 | Complete | 2026-03-05 |
| 2-4. Level Audio, Cinematic Infra, Cinematics | v1.0 | 0/TBD | Deferred | - |
| 5. Standalone Fixes | v1.1 | 2/2 | Complete | 2026-03-19 |
| 6. Visual Identity | v1.1 | 2/2 | Complete | 2026-03-19 |
| 7. Intro Overhaul | v1.1 | 2/2 | Complete | 2026-03-19 |
| 8. End-Screen Standardization | v1.1 | 1/1 | Complete | 2026-03-19 |
