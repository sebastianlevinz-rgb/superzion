# Requirements: SuperZion

**Defined:** 2026-03-19
**Core Value:** Every visible element must look intentional and polished -- no placeholder cubes, no missing audio, no broken levels.

## v1.2 Requirements

Requirements for Sprite & Polish v2. Each maps to roadmap phases.

### Drawing Technique

- [x] **DRAW-01**: Player sprite drawn with organic shapes (arc, bezierCurveTo, quadraticCurveTo, ellipse) -- no fillRect for body parts
- [x] **DRAW-02**: Head is an oval, torso is a curved trapezoid, limbs have rounded joints
- [x] **DRAW-03**: Beard is a gradient on jawline using arc() and semi-transparent colors -- no zigzag lines
- [x] **DRAW-04**: Eyes are small ovals with pupils -- no square dots
- [x] **DRAW-05**: All guard sprites use organic shapes (oval heads, shaped bodies, rounded limbs)
- [x] **DRAW-06**: All boss sprites in cinematic/parade use organic shapes
- [x] **DRAW-07**: Level 1 Bomberman top-down sprite uses organic shapes consistent with main game style
- [x] **DRAW-08**: All worker/NPC sprites across all scenes use organic drawing technique

### Star of David

- [x] **STAR-01**: Star of David positioned on chest (center of vest, above stomach) in all player sprites across all scenes

### Hard Hat

- [x] **HAT-01**: Level 2 hard hat is larger, rounder (arc-based), with visible front visor and reflective highlights

### Intro

- [x] **INTR-01**: Axis of Evil section shows fictional terrorist org logos (skull, red fist, etc.) -- no real country flags
- [x] **INTR-02**: Israel flag appears only in Israel/arsenal section, never in Axis of Evil
- [x] **INTR-03**: Psytrance 145+ BPM plays from frame 1 of intro cinematic via Web Audio API
- [x] **INTR-04**: Explosions and effects synchronized with the beat

### Logo

- [x] **LOGO-01**: SuperZion letters are thicker with 3px black outline/stroke
- [x] **LOGO-02**: Drop shadow effect on logo text
- [x] **LOGO-03**: Golden glow/bloom effect on logo
- [x] **LOGO-04**: Same logo rendering used in both MenuScene and IntroCinematicScene

## Future Requirements

Deferred to future release. Tracked but not in current roadmap.

### Audio

- **AUD-01**: Per-level unique trance themes
- **AUD-02**: Between-level animated cinematics with audio

## Out of Scope

| Feature | Reason |
|---------|--------|
| External audio files (mp3/ogg) | Everything stays procedural via Web Audio API |
| Save/load system | Not core to visual polish milestone |
| Accessibility features | Separate milestone |
| CinematicDirector/TextureRegistry infrastructure | Over-engineering for current needs |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| DRAW-01 | Phase 9 | Complete |
| DRAW-02 | Phase 9 | Complete |
| DRAW-03 | Phase 9 | Complete |
| DRAW-04 | Phase 9 | Complete |
| DRAW-05 | Phase 10 | Complete |
| DRAW-06 | Phase 10 | Complete |
| DRAW-07 | Phase 10 | Complete |
| DRAW-08 | Phase 10 | Complete |
| STAR-01 | Phase 11 | Complete |
| HAT-01 | Phase 11 | Complete |
| INTR-01 | Phase 12 | Complete |
| INTR-02 | Phase 12 | Complete |
| INTR-03 | Phase 13 | Complete |
| INTR-04 | Phase 13 | Complete |
| LOGO-01 | Phase 14 | Complete |
| LOGO-02 | Phase 14 | Complete |
| LOGO-03 | Phase 14 | Complete |
| LOGO-04 | Phase 14 | Complete |

**Coverage:**
- v1.2 requirements: 18 total
- Mapped to phases: 18
- Unmapped: 0 ✓
- Completed: 18 ✓

---
*Requirements defined: 2026-03-19*
*Last updated: 2026-03-19 after all phases completed*
