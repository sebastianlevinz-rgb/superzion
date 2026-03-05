# Testing Patterns

**Analysis Date:** 2026-03-05

## Test Framework

**Status:** No testing framework detected

**Framework Stack:**
- No test runner present (jest, vitest, mocha, etc. not in devDependencies)
- No assertion library configured
- No test files present (no `.test.js`, `.spec.js` files found)

**Development Dependencies:**
- `playwright` v1.58.2 - Browser automation (not configured for testing in package.json)
- `puppeteer` v24.37.5 - Headless browser (not configured for testing in package.json)
- `vite` v5.4.0 - Build tool only
- No test scripts in package.json (`"test"` or similar)

**Current Testing Approach:**
- Manual testing only
- Browser automation tools (Playwright/Puppeteer) present but unused
- `screenshot.mjs` script exists for manual visual capture but not integrated with test framework

## Run Commands

**Available scripts in package.json:**
```bash
npm run dev       # Start Vite dev server on port 3000
npm run build     # Build for production with Vite
npm run preview   # Preview production build locally
```

**No testing commands available** — would need to add Jest/Vitest and configure test scripts to enable testing

## Test File Organization

**Current Status:** Not applicable (no tests exist)

**Location Pattern (if tests were added):**
- Recommended: Co-located with source files (e.g., `Player.test.js` next to `Player.js`)
- Alternative: Central `tests/` or `__tests__/` directory

**File Structure to Implement:**
```
src/
├── entities/
│   ├── Player.js
│   ├── Player.test.js          # (if tests added)
│   ├── Guard.js
│   ├── Guard.test.js           # (if tests added)
│   └── ...
├── systems/
│   ├── SoundManager.js
│   ├── SoundManager.test.js    # (if tests added)
│   └── ...
├── utils/
│   ├── SpriteGenerator.js
│   ├── SpriteGenerator.test.js # (if tests added)
│   └── ...
└── ...
```

**Naming Convention:**
- `.test.js` suffix (e.g., `Player.test.js`, `SoundManager.test.js`)
- Matches existing codebase style: PascalCase classes get PascalCase test files

## Test Structure

**Recommended Pattern (based on code style):**

For class-based entities (`Player.js`, `Guard.js`):
```javascript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Phaser from 'phaser';
import Player from './Player.js';

describe('Player', () => {
  let mockScene;

  beforeEach(() => {
    // Setup Phaser mock scene with physics
    mockScene = {
      physics: { add: { sprite: () => mockSprite } },
      input: { keyboard: { createCursorKeys: () => ({}), addKey: () => ({}) } },
      time: { delayedCall: () => {} },
      tweens: { add: () => {} },
      add: { rectangle: () => mockRectangle }
    };
  });

  afterEach(() => {
    // Cleanup
  });

  it('should initialize with correct HP based on difficulty', () => {
    const player = new Player(mockScene, 100, 100, {});
    expect(player.hp).toBe(player.maxHp);
  });

  it('should take damage and apply invulnerability', () => {
    const player = new Player(mockScene, 100, 100, {});
    player.takeDamage(1);
    expect(player.invulnerable).toBe(true);
    expect(player.hp).toBeLessThan(player.maxHp);
  });
});
```

For singleton managers (`SoundManager.js`, `DifficultyManager.js`):
```javascript
import { describe, it, expect, beforeEach } from 'vitest';
import SoundManager from './SoundManager.js';

describe('SoundManager', () => {
  beforeEach(() => {
    // Reset singleton before each test
    SoundManager._instance = null;
  });

  it('should return same instance on multiple get() calls', () => {
    const sm1 = SoundManager.get();
    const sm2 = SoundManager.get();
    expect(sm1).toBe(sm2);
  });

  it('should handle missing AudioContext gracefully', () => {
    window.AudioContext = undefined;
    const sm = SoundManager.get();
    expect(() => sm.playStep()).not.toThrow();
  });
});
```

For utility/generator functions (`SpriteGenerator.js`, `BackgroundGenerator.js`):
```javascript
import { describe, it, expect } from 'vitest';
import { generateSpriteSheet, createAnimations } from './SpriteGenerator.js';

describe('SpriteGenerator', () => {
  let mockScene;

  beforeEach(() => {
    mockScene = {
      textures: {
        addCanvas: () => {},
        get: () => ({ add: () => {} })
      },
      anims: {
        create: () => {}
      }
    };
  });

  it('should generate frame data with expected keys', () => {
    const frameData = generateSpriteSheet(mockScene);
    expect(frameData).toHaveProperty('idle_0');
    expect(frameData).toHaveProperty('run_0');
    expect(frameData).toHaveProperty('jump_0');
  });

  it('should create animations for all movement states', () => {
    const frameData = generateSpriteSheet(mockScene);
    expect(() => createAnimations(mockScene, frameData)).not.toThrow();
  });
});
```

## Mocking

**Framework:** Not configured (would use Vitest's mocking)

**Mock Requirements by Component Type:**

**Phaser Scene Mocking:**
- Mock `physics.add.sprite()` to return sprite with physics body
- Mock `input.keyboard.createCursorKeys()` to return key object
- Mock `input.keyboard.addKey()` to return key state object
- Mock `time.delayedCall()`, `tweens.add()` for animation handling
- Mock `add.rectangle()`, `add.text()`, `add.graphics()` for rendering
- Mock `textures` and `anims` APIs for asset registration

**Example mock scene structure:**
```javascript
const mockSprite = {
  x: 0, y: 0,
  body: {
    blocked: { down: false },
    velocity: { x: 0, y: 0 },
    setSize: () => {},
    setOffset: () => {},
    setVelocity: () => {},
    setVelocityX: () => {},
    setVelocityY: () => {},
    bottom: 100,
  },
  setDepth: () => mockSprite,
  setCollideWorldBounds: () => mockSprite,
  setFlipX: () => mockSprite,
  play: () => mockSprite,
  setAlpha: () => mockSprite,
  setTintFill: () => mockSprite,
  clearTint: () => mockSprite,
  active: true,
};
```

**What to Mock:**
- Phaser API methods (required — browser-dependent)
- Canvas context operations (required — DOM-dependent)
- AudioContext (required — Web Audio API)
- localStorage (optional — can use localStorage mock library)
- Window/document properties (optional — for browser globals)

**What NOT to Mock:**
- Core game logic in Player, Guard, Enemy classes
- Collision detection calculations
- State management logic (HP, detection counts)
- Factory functions that create data structures
- Sprite generator frame composition logic

## Fixtures and Factories

**Test Data Approach (recommended):**

Location: Create `src/test/fixtures.js` or `src/__mocks__/` directory

```javascript
// src/test/fixtures.js
export const mockPhysicsSprite = () => ({
  x: 0, y: 0,
  body: {
    blocked: { down: true },
    velocity: { x: 0, y: 0 },
    setSize: () => {},
    setOffset: () => {},
    setVelocity: () => {},
    // ... rest of mock
  }
});

export const mockScene = () => ({
  physics: { add: { sprite: () => mockPhysicsSprite() } },
  input: { keyboard: { createCursorKeys: () => ({}), addKey: () => ({}) } },
  // ... rest of mock
});

export const playerTestConfig = {
  x: 100,
  y: 200,
  frameData: {
    idle_0: 1,
    idle_1: 2,
    run_0: 3,
    // ... rest of frames
  }
};

export const levelConfigFixture = {
  TILE: 32,
  LEVEL_WIDTH: 200,
  GROUND_Y: 24,
  // ... constants
};
```

**No existing test data structure** — would need to be created alongside test suite

## Coverage

**Requirements:** Not enforced (no coverage configuration)

**Recommendation for implementation:**
- Target: 80%+ coverage for core game logic
- Focus areas: Player mechanics, collision, enemy behavior, state management
- Less critical: Phaser integration, rendering/animation
- View coverage: `npm run test:coverage` (would need to be added)

## Test Types

**Unit Tests (Primary):**
- Scope: Individual classes and functions
- Approach: Mock Phaser dependencies, test game logic in isolation
- Examples to test:
  - `Player.update()`: movement, jumping, state changes
  - `Guard.update()`: patrol, detection, vision cone
  - `SoundManager.get()`: singleton behavior
  - `DifficultyManager` multipliers: various modes and calculations
  - Collision detection: `_pointInTriangle()` in Guard and Obstacle classes

**Integration Tests (Secondary):**
- Scope: Scene creation, multiple entities interacting
- Approach: Create minimal test scene with player + guards
- Examples:
  - Player collision with ground and platforms
  - Guard detection triggering and player damage
  - Sound/music manager initialization and muting
  - HUD updates reflecting player state

**E2E Tests (Not currently implemented):**
- Framework: Playwright or Puppeteer (already in devDependencies)
- Scope: Full game flow through UI
- Examples (if implemented):
  - Load game, complete first level
  - Menu navigation
  - Difficulty toggle
  - Visual regression with screenshot comparison

## Common Patterns

**Async Testing (for Phaser/Tweens):**
```javascript
it('should complete damage tween', async () => {
  const player = new Player(mockScene, 100, 100, frameData);
  player.takeDamage(1);

  // Phaser tweens would need mock implementation
  await new Promise(resolve => setTimeout(resolve, 500));

  expect(player.invulnerable).toBe(true);
});
```

**Error Testing:**
```javascript
it('should handle missing AudioContext', () => {
  const originalAudioContext = window.AudioContext;
  delete window.AudioContext;

  const sm = new SoundManager();
  sm._init();

  expect(sm.ctx).toBeNull();
  expect(() => sm.playStep()).not.toThrow();

  window.AudioContext = originalAudioContext;
});
```

**State Mutation Testing:**
```javascript
it('should update animation state on movement', () => {
  const player = new Player(mockScene, 100, 100, frameData);
  expect(player.animState).toBe('idle');

  // Simulate right key press
  player.cursors.right = { isDown: true };
  player.update(16);

  expect(player.animState).toBe('run');
});
```

**Singleton Reset Pattern:**
```javascript
beforeEach(() => {
  // Reset singleton instances between tests
  SoundManager._resetInstance?.();
  DifficultyManager._resetInstance?.();
  MusicManager._resetInstance?.();
});
```

## Migration Path (if implementing tests)

1. **Phase 1:** Set up Vitest + @vitest/ui, install Playwright/Puppeteer properly
2. **Phase 2:** Create test fixtures and mock utilities in `src/__mocks__/`
3. **Phase 3:** Write unit tests for singleton managers (highest value, fewest dependencies)
4. **Phase 4:** Write unit tests for entity classes (Player, Guard, Enemy)
5. **Phase 5:** Add integration tests for scene setup and interactions
6. **Phase 6:** Optional: Add E2E tests with Playwright for full game flows

---

*Testing analysis: 2026-03-05*
