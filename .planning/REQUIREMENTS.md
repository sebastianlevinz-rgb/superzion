# Requirements: SuperZion

**Defined:** 2026-03-19
**Core Value:** Every visible element must look intentional and polished — no placeholder cubes, no missing audio, no broken levels.

## v1.2 Requirements

Requirements for Sprite & Polish v2. Each maps to roadmap phases.

### Drawing Technique

- [ ] **DRAW-01**: Player sprite drawn with organic shapes (arc, bezierCurveTo, quadraticCurveTo, ellipse) — no fillRect for body parts
- [ ] **DRAW-02**: Head is an oval, torso is a curved trapezoid, limbs have rounded joints
- [ ] **DRAW-03**: Beard is a gradient on jawline using arc() and semi-transparent colors — no zigzag lines
- [ ] **DRAW-04**: Eyes are small ovals with pupils — no square dots
- [ ] **DRAW-05**: All guard sprites use organic shapes (oval heads, shaped bodies, rounded limbs)
- [ ] **DRAW-06**: All boss sprites in cinematic/parade use organic shapes
- [ ] **DRAW-07**: Level 1 Bomberman top-down sprite uses organic shapes consistent with main game style
- [ ] **DRAW-08**: All worker/NPC sprites across all scenes use organic drawing technique

### Star of David

- [ ] **STAR-01**: Star of David positioned on chest (center of vest, above stomach) in all player sprites across all scenes

### Hard Hat

- [ ] **HAT-01**: Level 2 hard hat is larger, rounder (arc-based), with visible front visor and reflective highlights

### Intro

- [ ] **INTR-01**: Axis of Evil section shows fictional terrorist org logos (skull, red fist, etc.) — no real country flags
- [ ] **INTR-02**: Israel flag appears only in Israel/arsenal section, never in Axis of Evil
- [ ] **INTR-03**: Psytrance 145+ BPM plays from frame 1 of intro cinematic via Web Audio API
- [ ] **INTR-04**: Explosions and effects synchronized with the beat

### Logo

- [ ] **LOGO-01**: SuperZion letters are thicker with 3px black outline/stroke
- [ ] **LOGO-02**: Drop shadow effect on logo text
- [ ] **LOGO-03**: Golden glow/bloom effect on logo
- [ ] **LOGO-04**: Same logo rendering used in both MenuScene and IntroCinematicScene

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
| DRAW-01 | — | Pending |
| DRAW-02 | — | Pending |
| DRAW-03 | — | Pending |
| DRAW-04 | — | Pending |
| DRAW-05 | — | Pending |
| DRAW-06 | — | Pending |
| DRAW-07 | — | Pending |
| DRAW-08 | — | Pending |
| STAR-01 | — | Pending |
| HAT-01 | — | Pending |
| INTR-01 | — | Pending |
| INTR-02 | — | Pending |
| INTR-03 | — | Pending |
| INTR-04 | — | Pending |
| LOGO-01 | — | Pending |
| LOGO-02 | — | Pending |
| LOGO-03 | — | Pending |
| LOGO-04 | — | Pending |

**Coverage:**
- v1.2 requirements: 18 total
- Mapped to phases: 0
- Unmapped: 18

---
*Requirements defined: 2026-03-19*
*Last updated: 2026-03-19 after initial definition*
