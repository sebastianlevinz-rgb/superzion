# Architecture

**Analysis Date:** 2026-03-05

## Pattern Overview

**Overall:** Phaser 3 scene-based game architecture with procedural generation

**Key Characteristics:**
- Modular scene system (BootScene → GameIntroScene → MenuScene → level scenes → cinematic scenes)
- Procedural texture/sprite generation using canvas API (no external assets)
- Entity-component-like pattern with specialized classes (Player, Guard, obstacles)
- Singleton managers for cross-scene concerns (MusicManager, SoundManager, DifficultyManager)
- Data-driven level design via `LevelConfig.js`

## Layers

**Scene Layer:**
- Purpose: Game state management, level orchestration, scene transitions
- Location: `src/scenes/`
- Contains: Phaser Scene subclasses handling specific game states
- Depends on: Entities, Systems, UI, Utils
- Used by: Phaser game instance

**Entity Layer:**
- Purpose: Character behaviors, physics, game objects
- Location: `src/entities/`
- Contains: Player, Guard, Enemy, Obstacle classes
- Depends on: Phaser physics, SoundManager
- Used by: Scenes (GameScene, BomberScene, BossScene, etc.)

**System Layer:**
- Purpose: Cross-scene functionality and game mechanics
- Location: `src/systems/`
- Contains: MusicManager, SoundManager, DifficultyManager, EndgameManager
- Depends on: Phaser, Web Audio API
- Used by: Scenes, Entities

**UI Layer:**
- Purpose: Heads-up display and user interface
- Location: `src/ui/`
- Contains: HUD (health bars, stealth status, difficulty indicator)
- Depends on: Scenes, DifficultyManager
- Used by: GameScene and variant scenes

**Data Layer:**
- Purpose: Level configuration and game constants
- Location: `src/data/`
- Contains: LevelConfig.js (platforms, obstacles, decorations, tile size)
- Depends on: Nothing (pure data)
- Used by: Scenes, EndgameManager

**Utilities/Generators:**
- Purpose: Procedural content generation (textures, sprites, backgrounds)
- Location: `src/utils/`
- Contains: *Generator.js and *Textures.js files
- Depends on: Phaser texture API, canvas context
- Used by: Scenes during texture initialization

## Data Flow

**Game Startup:**

1. Browser loads `index.html`
2. `src/main.js` imported, Phaser game config created
3. Config includes all scenes in sequence: BootScene → GameIntroScene → ... → BossScene → CreditsScene
4. BootScene creates (loading screen) → transitions to GameIntroScene

**Level Initialization (GameScene):**

1. Scene.create() called
2. `_generateTextures()` checks and generates procedural sprites/textures if not cached in `this.textures`
3. `_createBackground()` positions parallax layers (sky, mountains, clouds, skyline, facades)
4. `_buildLevel()` creates physics groups for ground and platforms from `LevelConfig` definitions
5. Player instantiated with sprite from generated frame data
6. `_spawnObstacles()` creates guards, cameras, lasers from obstacle definitions
7. `_setupDetection()` registers physics overlaps for laser collision
8. `_setupCamera()` follows player with smooth interpolation
9. HUD created, EndgameManager created
10. All systems ready, update loop begins

**Detection Flow:**

- Guards: `Guard.update(delta, playerX, playerY)` → draws vision cone → calls `_checkDetection()` → returns `true/false`
- Cameras: `SecurityCamera.update()` → calculates swept cone → returns detection boolean
- Lasers: Handled via `physics.add.overlap()` callback (not in update loop, physics-driven)
- On detection: `GameScene._onDetection()` → player takes damage → camera shake → red flash

**Endgame Flow:**

1. Player reaches building: `EndgameManager.update()` detects proximity
2. Phase transitions: `infiltrate` → `escape` (on plant) → `detonate` (on escape) → `done`
3. Plant: `EndgameManager._showPlantPrompt()` allows player to plant bomb
4. Escape: Player must exit left side of building
5. Detonate: Automatic explosion sequence, building destruction animation, stat summary
6. Next scene transition triggered

**State Management:**

- `GameScene.gameOver` – game over flag
- `GameScene.isPaused` – pause menu state
- `GameScene.skipPromptActive` – skip level confirmation state
- `EndgameManager.phase` – infiltrate/escape/detonate/done
- `Player.invulnerable` – temporary damage immunity
- `Player.hp` – current health
- `DifficultyManager` singleton – global difficulty mode

## Key Abstractions

**Scene Inheritance:**

- `BaseCinematicScene` – base class for cinematic intro/outro scenes
  - Provides animation utilities
  - Examples: `IntroCinematicScene`, `BeirutIntroCinematicScene`, `ExplosionCinematicScene`

**Guard/Obstacle Variants:**

- `Guard` – patrol waypoints, vision cone detection
- `FlashlightGuard` – patrol horizontal axis, uses guard sprite
- `SecurityCamera` – stationary sweep detection
- `SecurityLaser` – timed on/off beam detection

**Procedural Generation Strategy:**

- Canvas-based pixel art (128x128 typical sprite size)
- Palette-based coloring for character customization
- Exported to Phaser texture cache (`this.textures.createCanvas()`)
- Cached – not regenerated if texture exists

## Entry Points

**HTML Entry Point:**
- Location: `index.html`
- Triggers: Script module `src/main.js`
- Responsibilities: DOM container, global styles (CRT scanlines, cursor)

**Game Initialization:**
- Location: `src/main.js`
- Triggers: Page load
- Responsibilities: Create Phaser game config, instantiate all scenes, start game

**Scene Entry Points:**

- `BootScene` – first scene, shows loading screen, transitions to GameIntroScene
- `GameIntroScene` – game narrative intro, transitions to MenuScene
- `MenuScene` – level select, settings, transitions to selected level's intro cinematic
- `*IntroCinematicScene` (e.g., IntroCinematicScene, BeirutIntroCinematicScene) – setup and narrative, transitions to gameplay scene
- `GameScene`, `BomberScene`, `DroneScene`, `B2BomberScene`, `BossScene` – main gameplay scenes
- `ExplosionCinematicScene` – building explosion/destruction sequence
- `CreditsScene` – game completion credits

## Error Handling

**Strategy:** Graceful degradation with console logging

**Patterns:**

- Sprite access checks: `if (this.sprite?.active)` before operations
- Texture existence checks: `if (!this.textures.exists(key))` before creation
- Undefined guards in cleanup: `for (const obj of this.pauseObjects) obj.destroy()` (safe if obj already destroyed)
- Invulnerability/HP checks: `if (this.invulnerable || this.hp <= 0) return` prevent double-processing
- Web Audio API fallback: MusicManager catches exceptions if AudioContext unavailable

## Cross-Cutting Concerns

**Logging:** Console.log used sparingly; most events silent

**Validation:**
- Data config validation at LevelConfig.js level (hardcoded arrays, no runtime parsing)
- Player bounds checks: `this.sprite.setCollideWorldBounds(true)`
- Texture existence checks before use

**Authentication:** Not applicable (single-player game)

**Sound System:**
- `SoundManager` – Web Audio API synthesis (beeps, tones)
- `MusicManager` – Procedural trance music generation
- Both respect mute flag (`toggleMute()`, `setMuted()`)

**Difficulty Scaling:**
- `DifficultyManager` singleton manages hard mode toggle
- Affects: player HP multiplier (`DifficultyManager.playerHPMult()`)
- Persisted in `localStorage` under `superzion_hard_mode`

**Camera/Viewport:**
- Main camera follows player with lerp: `startFollow(sprite, true, 0.08, 0.08)`
- Fixed-size viewport (960x540), scaled/fitted to window
- HUD elements use `setScrollFactor(0)` for fixed screen positioning
- Parallax backgrounds use partial scroll factors (0.02–0.35)

---

*Architecture analysis: 2026-03-05*
