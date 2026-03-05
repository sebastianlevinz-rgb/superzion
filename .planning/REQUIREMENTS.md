# Requirements: SuperZion — Cinematic Polish

**Defined:** 2026-03-05
**Core Value:** The game must feel cinematic and polished — every transition, intro, and gameplay moment should have audiovisual punch.

## v1 Requirements

### Audio Infrastructure

- [ ] **AUDIO-01**: Music fades out cleanly (over configurable duration) before any scene transition instead of cutting abruptly
- [ ] **AUDIO-02**: Each of the 6 levels plays a unique trance theme with distinct BPM, melody line, pad chords, and atmospheric feel
- [ ] **AUDIO-03**: Each level has ambient environmental audio (wind, city hum, distant aircraft, etc.) that plays during gameplay as a separate audio layer

### Cinematics

- [ ] **CINE-01**: Between-level story sequences use animated sprites that move, enter/exit screen, and gesture — with narrative text — replacing typewriter-only text
- [ ] **CINE-02**: Animated intro showcase plays before the menu with rapid-fire boss/plane/character reveals choreographed to trance music

### Animation

- [ ] **ANIM-01**: Fast character movements and entrances display a motion smear frame (1 frame of horizontal blur/stretch) for visual weight

## v2 Requirements

### Audio

- **AUDIO-04**: Per-level trance sub-genre variation (progressive, psytrance, uplifting)
- **AUDIO-05**: Breakdowns and build-ups synced to cinematic moments (strip drums → filter sweep → drop)
- **AUDIO-06**: Synthesized trance pad chords with LFO on filter cutoff for emotional depth

### Sound Effects

- **SFX-01**: SFX parameter variation — random pitch/detune on repeated sound plays
- **SFX-02**: Alert/detection musical sting (dissonant chord on guard detection)
- **SFX-03**: Per-character voice bleeps during typed dialogue

### Cinematics

- **CINE-03**: Scene fade in/out on every scene transition
- **CINE-04**: Cinematic letterbox bars during cutscenes
- **CINE-05**: Boss/level-title reveal cards at mission start
- **CINE-06**: Parallax camera pan during dialogue cinematics

### Animation

- **ANIM-02**: Anticipation frames (1-2 wind-up frames before major actions)
- **ANIM-03**: Idle breathing animation (2-frame cycle on stationary characters)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Pre-recorded audio files (MP3/OGG) | Game is 100% procedural — no external assets |
| Spine/skeletal animation | Requires external .spine files; conflicts with procedural approach |
| Video cutscenes (.webm, .mp4) | Breaks zero-external-assets constraint |
| AI-generated music (Mubert, Suno) | Network dependency, licensing uncertainty |
| Dialogue branching / narrative engine | Milestone is presentation polish, not story authoring |
| Voice acting | Out of scope, inconsistent with retro-bleep aesthetic |
| Dynamic stem-based music (FMOD/Wwise style) | Requires pre-authored multi-track assets |
| Tone.js dependency | Raw Web Audio API is sufficient; avoids extra dependency |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUDIO-01 | Phase 1 | Pending |
| AUDIO-02 | Phase 2 | Pending |
| AUDIO-03 | Phase 2 | Pending |
| CINE-01 | Phase 4 | Pending |
| CINE-02 | Phase 4 | Pending |
| ANIM-01 | Phase 4 | Pending |

**Coverage:**
- v1 requirements: 6 total
- Mapped to phases: 6
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-05*
*Last updated: 2026-03-05 — traceability mapped to 4-phase roadmap*
