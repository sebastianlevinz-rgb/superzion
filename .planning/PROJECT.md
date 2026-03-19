# SuperZion — Polish Pass

## What This Is

A 6-level stealth side-scroller built in Phaser 3 where the player infiltrates enemy locations, avoids detection, plants bombs, and escapes. Everything is procedurally generated (textures, sprites, music, SFX). This milestone is a targeted polish pass fixing 8 specific visual, audio, gameplay, and UX issues to make the game feel finished.

## Core Value

Every visible element must look intentional and polished — no placeholder cubes, no missing audio, no broken levels. The game should feel complete on first impression.

## Current Milestone: v1.1 Polish Pass

**Goal:** Fix 8 specific issues across visuals, audio, content restoration, gameplay, and UX.

**Target issues:**
1. Player sprite redesign (Mossad agent, not cubes)
2. Intro music + SFX (psytrance 145+ BPM from frame 1)
3. Restore intro bosses and flags
4. Final intro screen (giant Maguen David, arcade font)
5. Level 2 container path blocked
6. Level 3 F-15 reversed wings
7. End-of-level screens (win/lose with proper options)
8. Controls overlay readability

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
- ✓ MusicManager fade/crossfade on scene transitions — v1.0 phase 1

### Active

- [ ] SuperZion sprite redesign: agente Mossad con traje táctico negro, pelo peinado atrás, barba sutil (sombra), Maguen David en el pecho, proporciones humanas orgánicas — aplicar en TODAS las escenas
- [ ] Intro psytrance 145+ BPM desde frame 1 con SFX sincronizados (misiles whoosh, explosiones boom, aviones doppler, disparos) y screen shake en explosiones
- [ ] Restaurar 4 bosses (Foam Beard, Turbo Turban, The Warden, Supreme Turban) con super ataques animados en intro — sprites reales, no rectángulos
- [ ] Restaurar banderas ondeando (Irán, Líbano, Palestina, Israel) en intro
- [ ] Pantalla final intro: Maguen David gigante dorado semi-transparente detrás de SuperZion, fuente ancha gruesa arcade retro para "SUPERZION", subtítulo más grande
- [ ] Nivel 2 container: pasillos más anchos, verificar que el nivel sea completable
- [ ] Nivel 3 cinemática: corregir F-15 con alas swept-back hacia atrás (no apuntando adelante)
- [ ] Pantallas fin de nivel en los 6 niveles: Ganar = "PLAY AGAIN (R)" + "NEXT LEVEL (ENTER)", Perder = "RETRY (R)" + "SKIP LEVEL (S)"
- [ ] Controles overlay en los 6 niveles: fondo negro semi-transparente, texto amarillo brillante grande

### Out of Scope

- Audio files externos (mp3/ogg) — se mantiene todo procedural via Web Audio API
- Niveles nuevos o cambios de gameplay — solo polish de lo existente
- Cinematics entre niveles (diferido de v1.0) — no en este pass
- Per-level unique trance themes (diferido de v1.0) — no en este pass
- Motion smear animation (diferido de v1.0) — no en este pass
- CinematicDirector/TextureRegistry infrastructure (diferido de v1.0) — no en este pass
- Save/load system — no priorizado
- Accessibility features — no priorizado

## Context

- Codebase 100% procedural: no hay assets externos, todo se genera en runtime via canvas API
- Ya existe `BaseCinematicScene` como base para escenas cinemáticas
- `MusicManager` (1027 líneas) genera música trance procedural con fade/crossfade (v1.0 fix)
- `SoundManager` (1501 líneas) genera SFX con oscillators — básico (beeps/tonos)
- `SpriteGenerator` genera sprites procedurales — actualmente produce cubos/rectángulos
- Archivos de escena son grandes (BossScene 1577 líneas, B2BomberScene 1492 líneas)
- 6 intros cinemáticas ya existen pero usan principalmente texto typewriter
- Intro showcase existe pero perdió bosses y banderas en algún refactor
- Juego se llama "SuperZion" internamente
- Viewport: 960x540, canvas rendering

## Constraints

- **Tech stack**: Phaser 3.80.1 + Vite — no cambiar framework
- **No assets externos**: Todo debe seguir siendo procedural (canvas API, Web Audio API)
- **Performance**: Mantener 60 FPS en navegadores modernos
- **Compatibilidad**: Sin cambios breaking en gameplay existente
- **Sprite consistency**: El rediseño del player debe aplicarse en TODAS las escenas donde aparece

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Mantener audio 100% procedural | Coherencia con el approach del juego, sin dependencia de archivos | ✓ Good |
| Pivotar de v1.0 cinematic milestone a polish pass | Los 8 issues son más urgentes que features nuevas | — Pending |
| SuperZion = agente Mossad, no cubos | Identidad visual clara, proporciones humanas orgánicas | — Pending |
| Psytrance 145+ BPM para intro | Energía alta desde el primer segundo, coherente con el tema del juego | — Pending |

---
*Last updated: 2026-03-19 after milestone v1.1 pivot*
