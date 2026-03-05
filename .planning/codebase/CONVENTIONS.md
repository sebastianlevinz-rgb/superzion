# Coding Conventions

**Analysis Date:** 2026-03-05

## Naming Patterns

**Files:**
- PascalCase for class/module files: `Player.js`, `GameScene.js`, `SoundManager.js`, `DifficultyManager.js`, `FlashlightGuard.js`
- camelCase for utility/generator files: `BackgroundGenerator.js`, `SpriteGenerator.js`, `EnemySpriteGenerator.js`, `TileGenerator.js`, `ObstacleGenerator.js`
- Lowercase for data files: `LevelConfig.js`, `main.js`
- All files use `.js` extension (ES6 modules with `"type": "module"` in package.json)

**Functions:**
- camelCase for all functions and methods: `createSkyGradient()`, `generateSpriteSheet()`, `playStep()`, `updateFrame()`, `_faceToward()`
- Private/internal functions prefixed with underscore: `_init()`, `_drawCone()`, `_checkDetection()`, `_spawnRunDust()`, `_pointInTriangle()`
- Exported named functions use camelCase with verb prefix: `createAnimations()`, `generateSpriteSheet()`, `createTargetBuildingTextures()`

**Variables:**
- camelCase for all variables: `moveSpeed`, `jumpVelocity`, `invulnerable`, `animState`, `patrolRange`, `masterGain`
- UPPER_SNAKE_CASE for constants: `MOVE_SPEED`, `JUMP_VELOCITY`, `COYOTE_TIME`, `JUMP_BUFFER`, `SIZE`, `MX`, `SKY_W`, `SKY_H`, `TILE`, `LEVEL_WIDTH`, `GROUND_Y`
- Single-letter variables for loop iterators: `i`, `x`, `y`, `p`, `a` (common in math-heavy code like sprite generation)
- Abbreviated variable names in tight loops/math contexts: `ctx` (canvas context), `dt` (delta time), `dx`, `dy`, `dist`, `vx`, `vy`, `a`, `ci`, `frac`
- Hungarian-style naming rare but present: `hx`, `hy` (head x/y), `tx`, `ty` (torso x/y), `lx`, `ly` (leg x/y)

**Types/Classes:**
- PascalCase for all class names: `Player`, `GameScene`, `Guard`, `Enemy`, `Drone`, `Turret`, `FlashlightGuard`, `SecurityCamera`, `SecurityLaser`, `BaseEnemy`, `SoundManager`, `DifficultyManager`, `HUD`, `EndgameManager`, `MusicManager`
- Singleton managers follow pattern: Static `.get()` method returns singleton instance

**Constants in Objects:**
- Properties in config objects use camelCase: `{ bodyBob: 0, legL: 0, legR: 0, armSwing: 0 }`
- Color hex values stored in palette objects: `PAL.skin0`, `PAL.hair1`, `PAL.kip2`, `PAL.gld3`, `PAL.eyeWhite`

## Code Style

**Formatting:**
- No linter config file present (no .eslintrc, .prettierrc, or biome.json)
- Manual formatting observed: 2-space indentation, no semicolons at end of statements
- Code uses consistent spacing around operators: `const x = y + z;`
- Long lines often broken: function calls on separate lines

**Linting:**
- No linting framework detected (no eslint, biome, or similar in devDependencies)
- Code passes implicit JavaScript standards

**General Style:**
- Comments use ASCII art dividers: `// ═══════════════════════════════════════` (section dividers)
- File headers include full context:
  ```javascript
  // ═══════════════════════════════════════════════════════════════
  // SuperZion — Side-scroller Player
  // A/D + jump movement, per-sprite gravity, HP, no shooting
  // ═══════════════════════════════════════════════════════════════
  ```
- Arrow functions used when appropriate: `frames.forEach((f, i) => sctx.drawImage(f, i * SIZE, 0))`
- Traditional function expressions preserved: `function px(ctx, x, y, color) { ... }`
- Classes declared as `export default class ClassName { ... }` or `export class ClassName { ... }`

## Import Organization

**Order:**
1. External library imports (Phaser): `import Phaser from 'phaser';`
2. Relative imports from systems: `import SoundManager from '../systems/SoundManager.js';`
3. Relative imports from utilities: `import { createSkyGradient } from '../utils/BackgroundGenerator.js';`
4. Relative imports from entities/UI/data: `import Player from '../entities/Player.js';`, `import HUD from '../ui/HUD.js';`, `import { TILE, LEVEL_WIDTH } from '../data/LevelConfig.js';`

**Path Aliases:**
- No path aliases (no tsconfig paths or similar) — all imports use relative paths with `../` and explicit `.js` extensions
- Full file extensions always included in import statements

**Destructuring:**
- Used for named exports from config/utility files: `import { TILE, LEVEL_WIDTH, GROUND_Y } from '../data/LevelConfig.js';`
- Used for generator functions: `import { createSkyGradient, createSun, createMountainLayer } from '../utils/BackgroundGenerator.js';`
- Used for class exports: `import { FlashlightGuard, SecurityCamera, SecurityLaser } from '../entities/Obstacle.js';`
- Default imports for class exports: `import Player from '../entities/Player.js';`

## Error Handling

**Patterns:**
- Try-catch for I/O operations (localStorage, AudioContext):
  ```javascript
  try {
    this.hardMode = localStorage.getItem('superzion_hardmode') === 'true';
  } catch (e) { this.hardMode = false; }
  ```
- Graceful degradation when audio unavailable:
  ```javascript
  try {
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
  } catch (e) {
    this.ctx = null;
    this.masterGain = null;
  }
  ```
- Guard clauses for null/undefined checks:
  ```javascript
  if (this.invulnerable || this.hp <= 0) return;
  if (!this.ctx || !this.masterGain) return;
  ```
- Conditional sprite existence check: `if (this.sprite?.active) this.sprite.clearTint();`

**No explicit exceptions thrown** — code uses early returns and silent failures

## Logging

**Framework:** Console only (no logging library detected)

**Patterns:**
- No logging calls observed in production code
- Code appears debug-comment-free or minimal

## Comments

**When to Comment:**
- File headers describing purpose and mechanics: 3-line format with ASCII art
- Section markers for logical blocks: `// ── HELPERS ─────────────────────────────────────`
- Inline comments for non-obvious calculations or game logic
- Math-heavy code thoroughly commented: coordinate offsets, physics values
- Design decisions documented: "Body: 28x64 covering shoulders(y=22) to feet(y=86)"

**JSDoc/TSDoc:**
- No JSDoc annotations observed
- Pure JavaScript with minimal type hints

## Function Design

**Size:**
- Small, focused functions (10-50 lines typical)
- Helper functions extracted (e.g., `drawHead()`, `drawTorso()`, `drawArm()`, `drawLeg()` in sprite generator)
- Long methods exist in scene setup but broken into private methods: `_generateTextures()`, `_createBackground()`, `_buildLevel()`

**Parameters:**
- Typically 1-3 parameters
- Destructuring used for options/config: `function drawOperativeFrame(opts = {}) { const { bodyBob = 0, legL = 0, armSwing = 0 } = opts; }`
- Default parameters common: `patrolRange = 80`, `config = {}`
- Scene context passed as first parameter in constructor: `constructor(scene, x, y, ...)`

**Return Values:**
- Functions return objects when building composite data: `return frameData;` (object mapping names to frame indices)
- Functions return canvas elements: `return canvas;`
- Getters return singleton instances: `static get() { if (!instance) instance = new Manager(); return instance; }`
- No explicit return (returns undefined) for void operations: methods that mutate state

## Module Design

**Exports:**
- Default export for classes: `export default class Player { ... }`
- Named exports for factory/builder functions: `export function generateSpriteSheet(scene) { ... }`, `export function createAnimations(scene, frameData) { ... }`
- Mixed pattern for obstacles: `export class FlashlightGuard { ... }`, `export class SecurityCamera { ... }`, `export class SecurityLaser { ... }`

**Barrel Files:**
- Not used (no index.js re-exporting from directories)
- Each module imported directly

**Module Responsibilities:**
- Scene files handle scene setup and lifecycle
- Entity files encapsulate sprite + behavior
- Generator/utility files produce textures or data structures
- Manager files implement singleton pattern for global state
- Config files export constants only

**Singleton Pattern:**
- Used in `SoundManager`, `DifficultyManager`, `MusicManager`, `EndgameManager`
- Implementation: `let instance = null;` at module scope, `static get() { if (!instance) instance = new Class(); return instance; }`
- Access pattern: `SoundManager.get().playStep();`, `DifficultyManager.get().isHard();`

---

*Convention analysis: 2026-03-05*
