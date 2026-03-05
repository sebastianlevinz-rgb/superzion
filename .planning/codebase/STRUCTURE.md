# Codebase Structure

**Analysis Date:** 2026-03-05

## Directory Layout

```
superzion/
├── src/
│   ├── main.js                          # Game entry point, Phaser config
│   ├── data/
│   │   └── LevelConfig.js               # Tile size, platforms, obstacles, decorations
│   ├── entities/
│   │   ├── Player.js                    # Player character with movement, jumping, HP
│   │   ├── Enemy.js                     # BaseEnemy, Drone, Turret classes
│   │   ├── Guard.js                     # Guard with waypoint patrol, vision cone
│   │   └── Obstacle.js                  # FlashlightGuard, SecurityCamera, SecurityLaser
│   ├── scenes/
│   │   ├── BootScene.js                 # Loading screen, brief startup
│   │   ├── GameIntroScene.js            # Game narrative intro
│   │   ├── MenuScene.js                 # Level select, settings, difficulty toggle
│   │   ├── BaseCinematicScene.js        # Base class for cinematic scenes
│   │   ├── IntroCinematicScene.js       # Level 1 intro (Operation Tehran)
│   │   ├── BeirutIntroCinematicScene.js # Level 2 intro (Operation Signal Storm)
│   │   ├── DeepStrikeIntroCinematicScene.js # Level 3 intro
│   │   ├── UndergroundIntroCinematicScene.js # Level 4 intro
│   │   ├── MountainBreakerIntroCinematicScene.js # Level 5 intro
│   │   ├── LastStandCinematicScene.js   # Level 6 intro
│   │   ├── GameScene.js                 # Level 1 gameplay (side-scroller)
│   │   ├── BeirutRadarScene.js          # Level 2 gameplay variant
│   │   ├── BomberScene.js               # Level 3 gameplay variant
│   │   ├── DroneScene.js                # Level 4 gameplay variant
│   │   ├── B2BomberScene.js             # Level 5 gameplay variant
│   │   ├── BossScene.js                 # Level 6 boss gameplay
│   │   ├── ExplosionCinematicScene.js   # Building explosion/destruction outro
│   │   ├── CreditsScene.js              # Game completion credits
│   ├── systems/
│   │   ├── MusicManager.js              # Procedural trance music synthesis
│   │   ├── SoundManager.js              # Sound effects (jump, land, step, laser, etc.)
│   │   ├── DifficultyManager.js         # Hard mode toggle, HP scaling
│   │   └── EndgameManager.js            # Building, plant prompt, escape, explosion
│   ├── ui/
│   │   └── HUD.js                       # Health bars, stealth status, hard indicator
│   └── utils/
│       ├── SpriteGenerator.js           # Player sprite animation frames
│       ├── BackgroundGenerator.js       # Sky, sun, mountains, clouds, skyline, facades
│       ├── TileGenerator.js             # Ground and platform tile textures
│       ├── BuildingGenerator.js         # Target building floors, marker, ruins
│       ├── DecorationGenerator.js       # Cat, plant, samovar, flag decorations
│       ├── ExplosionGenerator.js        # Fireball explosion sprites
│       ├── EnemySpriteGenerator.js      # Guard walk animation frames
│       ├── ObstacleGenerator.js         # Searchlight, laser, camera visuals
│       ├── CinematicTextures.js         # Cliff background, SuperZion cinematic sprite
│       ├── TopDownTextures.js           # Top-down view elements
│       ├── RadarTextures.js             # Radar display graphics
│       ├── DroneSpriteGenerator.js      # Drone sprite generation (if exists)
│       ├── B2TextureGenerator.js        # Level 2 variant textures (if exists)
│       └── BossTextures.js              # Boss sprite generation
│
├── index.html                           # HTML entry point, CRT scanlines style
├── vite.config.js                       # Vite build config (port 3000, dist output)
├── package.json                         # Dependencies: phaser, vite, playwright, puppeteer
├── package-lock.json                    # Lock file
├── dist/                                # Built output (run `npm run build`)
├── public/                              # Static assets (if any)
└── node_modules/                        # Dependencies (git-ignored)
```

## Directory Purposes

**src/data:**
- Purpose: Game configuration and level design data
- Contains: Constants (TILE size, level dimensions, ground Y), arrays of platform/obstacle/decoration definitions
- Key files: `LevelConfig.js`

**src/entities:**
- Purpose: Game characters and interactive objects with physics and behavior
- Contains: Player character (movement, jumping, health), guards (patrol AI), enemies (drone, turret), obstacles (camera, laser)
- Key files: `Player.js` (main player), `Guard.js` (side-scroller), `Obstacle.js` (detection objects)

**src/scenes:**
- Purpose: Game state and scene management
- Contains: Phaser Scene subclasses, each managing a specific game state (menu, level, cinematic)
- Key files: `GameScene.js` (main level 1), `MenuScene.js` (hub)

**src/systems:**
- Purpose: Global systems that span scenes
- Contains: Audio (music, sound effects), difficulty scaling, endgame mechanics
- Key files: `MusicManager.js` (Web Audio synthesis), `DifficultyManager.js` (singleton config)

**src/ui:**
- Purpose: Heads-up display and player feedback
- Contains: Health bars, status text, difficulty indicators
- Key files: `HUD.js`

**src/utils:**
- Purpose: Procedural content generation
- Contains: Canvas-based texture generators for all sprites and backgrounds
- Key files: `SpriteGenerator.js` (player), `BackgroundGenerator.js` (parallax layers)

## Key File Locations

**Entry Points:**
- `index.html`: HTML document, imports `src/main.js`, defines canvas parent, applies global styles
- `src/main.js`: Creates Phaser game instance with config, registers all scenes, starts BootScene

**Configuration:**
- `vite.config.js`: Dev server port (3000), build output directory (dist)
- `package.json`: Dependencies, scripts (dev, build, preview)
- `src/data/LevelConfig.js`: Level constants (TILE=32, LEVEL_WIDTH=200, GROUND_Y=24), platform definitions, obstacle definitions, decoration definitions

**Core Logic:**
- `src/scenes/GameScene.js`: Level 1 main gameplay loop, texture generation trigger, obstacle updates, detection handling
- `src/entities/Player.js`: Player input handling, movement physics, animation state, damage/invulnerability
- `src/systems/EndgameManager.js`: Building rendering, bomb plant prompt, escape detection, explosion sequence

**Testing/Utilities:**
- `src/utils/*Generator.js`: Procedural texture creation functions
- `src/systems/MusicManager.js`: Web Audio synthesis, note sequencing, persistent singleton

## Naming Conventions

**Files:**
- PascalCase for classes: `Player.js`, `GameScene.js`, `SpriteGenerator.js`
- camelCase for utility functions inside files (internal to file)
- Suffixes for organization: `*Scene.js`, `*Generator.js`, `*Manager.js`, `*Textures.js`

**Directories:**
- Plural lowercase for organization: `src/scenes/`, `src/entities/`, `src/systems/`, `src/utils/`
- Singular for thematic grouping: `src/data/`, `src/ui/`

**Classes:**
- PascalCase: `Player`, `GameScene`, `MusicManager`, `EndgameManager`
- Inheritance suffixes: `BaseCinematicScene`, `BaseEnemy`

**Methods/Functions:**
- camelCase: `update()`, `takeDamage()`, `_generateTextures()`
- Private methods prefixed with `_`: `_createBackground()`, `_setupCamera()`

**Constants:**
- UPPER_CASE: `MOVE_SPEED`, `JUMP_VELOCITY`, `COYOTE_TIME`, `TILE`, `LEVEL_WIDTH`
- Defined at module or class top level

**Variables:**
- camelCase: `playerX`, `playerY`, `invulnTimer`, `bombPlanted`
- Single-letter for short-lived loop: `i`, `j`, `x`, `y`, `w`, `h`

## Where to Add New Code

**New Level/Scene:**
- Create `src/scenes/NewLevelNameScene.js` extending `Phaser.Scene`
- Add intro cinematic `src/scenes/NewLevelNameIntroCinematicScene.js` extending `BaseCinematicScene`
- Register in `src/main.js` scene array
- Add to level select in `src/scenes/MenuScene.js` LEVELS array
- If new obstacle type needed, add to `src/entities/Obstacle.js`

**New Texture/Sprite:**
- Create generator function in `src/utils/SpriteGenerator.js` or new `src/utils/YourTypeGenerator.js`
- Use canvas API: `const canvas = scene.make.graphics({ x: 0, y: 0, add: false });`
- Export texture to scene: `scene.textures.generateTexture(key, canvas)`
- Cache check: `if (!this.textures.exists(key)) { /* generate */ }`
- Use in scene via `this.add.image(x, y, key)` or physics sprite

**New Entity/Character:**
- Create `src/entities/YourEntity.js` class
- Constructor: `constructor(scene, x, y, ...)`
- Import Phaser: `import Phaser from 'phaser';`
- Create sprite: `this.sprite = scene.physics.add.sprite(x, y, textureKey);`
- Add `update(delta)` method for frame-by-frame behavior
- Import in relevant scene and instantiate in `create()`

**New System/Manager:**
- Create `src/systems/YourManager.js` as singleton pattern:
  ```javascript
  let instance = null;
  export default class YourManager {
    static get() {
      if (!instance) instance = new YourManager();
      return instance;
    }
  }
  ```
- Import and call via `YourManager.get().method()`

**New UI Element:**
- Add to `src/ui/HUD.js` class or create `src/ui/YourUI.js`
- Constructor receives scene and player references
- Use `scene.add.text()`, `scene.add.rectangle()` etc.
- Set `setScrollFactor(0)` for fixed screen positioning
- Call `update()` each frame to refresh values

## Special Directories

**dist/:**
- Purpose: Build output from Vite
- Generated: Yes (`npm run build`)
- Committed: No (in `.gitignore`)
- Contains: Bundled `index.html`, minified JavaScript, built assets

**public/:**
- Purpose: Static assets served as-is (if any)
- Generated: No
- Committed: Yes
- Currently: Empty or minimal

**node_modules/:**
- Purpose: Installed npm dependencies
- Generated: Yes (`npm install`)
- Committed: No (in `.gitignore`)
- Key packages: `phaser`, `vite`, `playwright`, `puppeteer`

---

*Structure analysis: 2026-03-05*
