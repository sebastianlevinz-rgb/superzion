# SuperZion

## What This Is

A 6-level stealth side-scroller built in Phaser 3 where the player (a Mossad agent) infiltrates enemy locations, avoids detection, plants bombs, and escapes. Everything is 100% procedurally generated — textures, sprites, music, SFX. The game features a polished intro cinematic with waving flags, boss parade, psytrance music, and a dramatic title reveal.

## Core Value

Every visible element must look intentional and polished — no placeholder cubes, no missing audio, no broken levels. The game should feel complete on first impression.

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
- ✓ MusicManager fade/crossfade on scene transitions — v1.0
- ✓ Player sprite as Mossad agent (tactical black suit, hair, beard shadow, Maguen David) across all scenes — v1.1
- ✓ 4 real boss parade sprites with animated super attacks — v1.1
- ✓ 4 waving flag animations in intro (Iran, Lebanon, Palestine, Israel) — v1.1
- ✓ Giant golden Maguen David + arcade font title in intro — v1.1
- ✓ Psytrance 145+ BPM from frame 1 with synchronized SFX and camera shake — v1.1
- ✓ Level 2 container corridors passable — v1.1
- ✓ Level 3 F-15 swept-back wings — v1.1
- ✓ Consistent end-of-level screens across all 6 levels via shared EndScreen.js — v1.1
- ✓ Controls overlay with yellow text on dark background — v1.1

### Active

(None — define next milestone requirements with `/gsd:new-milestone`)

### Out of Scope

- Audio files externos (mp3/ogg) — se mantiene todo procedural via Web Audio API
- Per-level unique trance themes (deferred from v1.0)
- Between-level animated cinematics (deferred from v1.0)
- CinematicDirector/TextureRegistry infrastructure (deferred from v1.0)
- Motion smear animation (deferred from v1.0)
- Save/load system
- Accessibility features

## Context

- Shipped v1.1 Polish Pass: 4 phases, 7 plans, 10 requirements fulfilled
- Codebase 100% procedural: no external assets, everything runtime-generated via canvas API and Web Audio API
- `SpriteGenerator` produces canonical Mossad agent design; `CinematicTextures` and `ParadeTextures` aligned to match
- `EndScreen.js` is the shared end-of-level module with `destroy()` cleanup — all 7 scenes use it
- `MusicManager` handles fade/crossfade; `SoundManager` handles SFX including new `playGunfire()`
- `GameIntroScene` (989+ lines) has 3-act structure with real boss sprites, waving flags, diversified SFX, camera shake
- Viewport: 960x540, canvas rendering, Phaser 3.80.1 + Vite

## Constraints

- **Tech stack**: Phaser 3.80.1 + Vite — no cambiar framework
- **No assets externos**: Todo debe seguir siendo procedural (canvas API, Web Audio API)
- **Performance**: Mantener 60 FPS en navegadores modernos
- **Compatibilidad**: Sin cambios breaking en gameplay existente

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Mantener audio 100% procedural | Coherencia con el approach del juego, sin dependencia de archivos | ✓ Good |
| Pivotar de v1.0 cinematic milestone a polish pass | Los 8 issues son más urgentes que features nuevas | ✓ Good — all 10 requirements shipped |
| SuperZion = agente Mossad, no cubos | Identidad visual clara, proporciones humanas orgánicas | ✓ Good — consistent across all 3 texture systems |
| Psytrance 145+ BPM para intro | Energía alta desde el primer segundo, coherente con el tema del juego | ✓ Good — diversified SFX + camera shake |
| Shared EndScreen.js with destroy() | Centralized win/lose navigation, fixes keyboard listener leaks | ✓ Good — zero inline duplicates |
| Camera shake inside _spawnExplosion() | Single insertion point covers all callers automatically | ✓ Good — DRY pattern |

---
*Last updated: 2026-03-19 after v1.1 Polish Pass milestone complete*
