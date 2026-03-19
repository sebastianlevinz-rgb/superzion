# Requirements: SuperZion

**Defined:** 2026-03-19
**Core Value:** Every visible element must look intentional and polished -- no placeholder cubes, no missing audio, no broken levels.

## v1.3 Requirements

Requirements for Narrative & Audio milestone. Each maps to roadmap phases.

### Cinematic Text Engine

- [ ] **TEXT-01**: All cinematics use page-by-page text advancement — player presses SPACE or ENTER to advance, never auto-advances
- [ ] **TEXT-02**: Blinking "► SPACE" indicator always visible at bottom during text pages
- [ ] **TEXT-03**: ESC key skips entire cinematic in all scenes

### Narrative - Intro

- [ ] **NARR-01**: GameIntroScene completely rewritten with new narrative script (3000 years history → enemies → Israel responds → SuperZion reveal)
- [ ] **NARR-02**: Each text line appears with typewriter effect, advances only on SPACE/ENTER

### Narrative - Level Cinematics

- [ ] **NARR-03**: All 6 level intro cinematics rewritten with new narrative script
- [ ] **NARR-04**: 5 transition cinematics between levels with new narrative (post-level → next level setup)

### Narrative - Victory & Tagline

- [ ] **NARR-05**: New VictoryFinalScene with complete victory narrative ending in "Am Yisrael Chai"
- [ ] **NARR-06**: Tagline changed from "ONE SOLDIER. SIX MISSIONS. ZERO MERCY." to "THEY FIGHT TO CONQUER. WE FIGHT TO EXIST." everywhere

### Audio - Cinematics

- [ ] **AUD-01**: Intro has psytrance 145+ BPM from frame 1 with mood transitions (dark → heroic → epic climax)
- [ ] **AUD-02**: All cinematics (intro, level intros, transitions, victory) have mood-appropriate background music
- [ ] **AUD-03**: Typewriter text produces click sound per letter in all cinematics
- [ ] **AUD-04**: Boss appearances, explosions, and visual impacts have synchronized sound effects

### Audio - Global

- [ ] **AUD-05**: All 6 gameplay levels verified to have background music playing
- [ ] **AUD-06**: All player and enemy actions have corresponding sound effects
- [ ] **AUD-07**: Victory sequence has epic music with climax at "Am Yisrael Chai" moment
- [ ] **AUD-08**: M key mute/unmute works globally in every scene (menu, cinematics, gameplay, victory)
- [ ] **AUD-09**: Zero silence anywhere in the game from intro through credits

## Future Requirements

None — all audio/narrative scope captured in this milestone.

## Out of Scope

| Feature | Reason |
|---------|--------|
| External audio files (mp3/ogg) | Everything stays procedural via Web Audio API |
| Voice acting / text-to-speech | Not feasible with procedural approach |
| Subtitle language options | Single language (English) |
| Save/load system | Not relevant to narrative/audio milestone |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| TEXT-01 | Phase 15 | Pending |
| TEXT-02 | Phase 15 | Pending |
| TEXT-03 | Phase 15 | Pending |
| NARR-01 | Phase 16 | Pending |
| NARR-02 | Phase 16 | Pending |
| NARR-03 | Phase 17 | Pending |
| NARR-04 | Phase 17 | Pending |
| NARR-05 | Phase 18 | Pending |
| NARR-06 | Phase 18 | Pending |
| AUD-01 | Phase 19 | Pending |
| AUD-02 | Phase 19 | Pending |
| AUD-03 | Phase 19 | Pending |
| AUD-04 | Phase 19 | Pending |
| AUD-05 | Phase 20 | Pending |
| AUD-06 | Phase 20 | Pending |
| AUD-07 | Phase 20 | Pending |
| AUD-08 | Phase 20 | Pending |
| AUD-09 | Phase 20 | Pending |

**Coverage:**
- v1.3 requirements: 18 total
- Mapped to phases: 18
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-19*
*Last updated: 2026-03-19 after initial definition*
