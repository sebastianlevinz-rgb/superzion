# SuperZion — Polish & Cinematic Upgrade

## What This Is

A 6-level stealth side-scroller built in Phaser 3 where the player infiltrates enemy locations, avoids detection, plants bombs, and escapes. Everything is procedurally generated (textures, sprites, music, SFX). This milestone focuses on elevating the game's presentation: animated intro, cinematic story sequences between levels, unique trance music per level, richer sound effects, and more fluid sprite animations.

## Core Value

The game must *feel* cinematic and polished — every level transition, intro, and gameplay moment should have the audiovisual punch of a finished game, not a prototype.

## Requirements

### Validated

- ✓ 6 playable levels with distinct gameplay variants (stealth, bomber, drone, B2, boss) — existing
- ✓ Player movement, jumping, stealth mechanics with HP system — existing
- ✓ Guard patrol AI with vision cones, security cameras, lasers — existing
- ✓ Procedural texture/sprite generation via canvas API — existing
- ✓ Menu with level select and difficulty toggle — existing
- ✓ HUD with health bars and stealth status — existing
- ✓ Endgame sequence (infiltrate → plant → escape → detonate) — existing
- ✓ Difficulty system (normal/hard) with localStorage persistence — existing
- ✓ Basic cinematic intro scenes per level (typewriter text) — existing
- ✓ Procedural trance music via Web Audio API — existing
- ✓ Basic synthesized sound effects (jump, land, step, laser, damage) — existing
- ✓ CRT scanline visual overlay — existing
- ✓ Parallax scrolling backgrounds — existing

### Active

- [ ] Animated intro showcase (bosses, aviones, personajes con animaciones rápidas tipo trailer)
- [ ] Cinematic story sequences entre niveles con sprites animados en canvas (no solo typewriter)
- [ ] Tema trance único por nivel (BPM, melodía, pads, atmósfera diferente)
- [ ] Mayor variedad de efectos de sonido (enemigos, explosiones, ambiente, UI feedback)
- [ ] Animaciones de sprites más fluidas (más frames, movimiento más natural)

### Out of Scope

- Audio files externos (mp3/ogg) — se mantiene todo procedural via Web Audio API
- Transiciones/fades entre escenas — no priorizado
- Mejoras de UI/menús — no priorizado
- Feedback visual adicional (particles, screen shake) — no priorizado
- Testing/linting infrastructure — no priorizado
- Save/load system — no priorizado
- Accessibility features — no priorizado

## Context

- Codebase 100% procedural: no hay assets externos, todo se genera en runtime via canvas API
- Ya existe `BaseCinematicScene` como base para escenas cinemáticas
- `MusicManager` (1027 líneas) genera música trance procedural — ya funciona pero es genérica
- `SoundManager` (1501 líneas) genera SFX con oscillators — básico (beeps/tonos)
- Archivos de escena son grandes (BossScene 1577 líneas, B2BomberScene 1492 líneas)
- 6 intros cinemáticas ya existen pero usan principalmente texto typewriter
- Juego se llama "SuperZion" internamente
- Viewport: 960x540, canvas rendering

## Constraints

- **Tech stack**: Phaser 3.80.1 + Vite — no cambiar framework
- **No assets externos**: Todo debe seguir siendo procedural (canvas API, Web Audio API)
- **Performance**: Mantener 60 FPS en navegadores modernos — audio nodes y canvas operations tienen límites conocidos
- **Compatibilidad**: Sin cambios breaking en gameplay existente

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Mantener audio 100% procedural | Coherencia con el approach del juego, sin dependencia de archivos | — Pending |
| Sprites animados para cinematics (no comic panels) | Más dinámico, aprovecha canvas API existente | — Pending |
| Showcase cinético para intro (no narrativo) | Impacto visual inmediato, presenta bosses/aviones | — Pending |

---
*Last updated: 2026-03-05 after initialization*
