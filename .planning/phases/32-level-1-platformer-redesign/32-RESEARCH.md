# Phase 32: Level 1 Platformer Redesign - Research

**Researched:** 2026-03-20
**Domain:** Phaser 3 side-scrolling platformer + scene transition + top-down Bomberman preservation
**Confidence:** HIGH

## Summary

Phase 32 converts Level 1 from a single Bomberman-only level into a two-phase experience: a side-scrolling platformer across Tehran rooftops at night (Phase 1), followed by the existing Bomberman gameplay indoors (Phase 2). The codebase already uses Phaser 3.80+ with arcade physics and procedural canvas textures for all visuals. The project has NO external assets -- every sprite, background, and sound is generated in code via Canvas 2D and Web Audio API.

The primary architectural challenge is creating a new `PlatformerScene` that handles side-scrolling platformer mechanics (gravity, jumping, horizontal scrolling, platform collision), then transitions cleanly into the existing `GameScene` (Bomberman). The existing codebase already has reusable patterns: `FlashlightGuard` and `SecurityCamera` obstacle entities (in `Obstacle.js`), `EnemySpriteGenerator` for guard textures, parallax scrolling (used in `BomberScene`), and the Phaser arcade physics system already configured with `gravity.y: 900` globally.

**Primary recommendation:** Create a new `PlatformerScene` class as a standalone Phaser scene. Generate all platformer textures in a new `PlatformerLevel1Textures.js`. The platformer scene handles Phase 1 (rooftop running), then on reaching the target building, transitions via `scene.start('GameScene')`. Two small fixes are also needed in existing code: Star of David position on the Bomberman sprite (line 678 in BombermanTextures.js) and key pickup verification.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| LVL1-01 | Phase 1 platformer: SuperZion runs across Tehran rooftops at night (side-scrolling, Super Mario style) | New PlatformerScene with arcade physics platformer mechanics, horizontal camera follow, jump/run controls. Phaser arcade gravity already set at 900. |
| LVL1-02 | Tehran night skyline background with Azadi Tower, Milad Tower, Alborz mountains, moon, stars (detailed) | Canvas-drawn parallax background layers (pattern established in BomberScene with tileSprite + scrolling). Multi-layer: stars/moon (static), mountains (slow), skyline/towers (medium), buildings (fast). |
| LVL1-03 | Platforms are Iranian building rooftops, balconies, cornices, mosque domes | Static physics groups of platforms with varied canvas textures (flat rooftops, domed shapes, balcony ledges). Use `physics.add.staticGroup()` pattern from GameScene. |
| LVL1-04 | Obstacles: rotating security cameras with vision cones, patrolling guards on rooftops, searchlights, electric wire | Existing `SecurityCamera` and `Searchlight` classes in `Obstacle.js` are directly reusable. `FlashlightGuard` needs adaptation (currently uses tile-based coords). Electric wire is new but simple (timed on/off line segment). |
| LVL1-05 | Guards walk ON the floor -- feet touch ground, never float | Guard sprites must use `body.setGravityY()` or be placed on platforms with colliders. Use `physics.add.collider(guard, platforms)`. Verify with console.log of guard.y vs platform.y. |
| LVL1-06 | End of platformer: reach target building, enter through window, visual transition to top-down | Trigger zone at level end. Visual transition: camera zoom into window, fade to black, then `scene.start('GameScene')`. |
| LVL1-07 | Phase 2 Bomberman gameplay preserved intact from current implementation | GameScene remains completely unchanged. PlatformerScene simply starts GameScene on completion. The scene flow changes from `IntroCinematicScene -> FlightRouteScene -> GameScene` to `IntroCinematicScene -> FlightRouteScene -> PlatformerScene -> GameScene`. |
| LVL1-08 | Key is visible, pickable, and functional in Bomberman phase | Verify existing key generation in `generateMap()` (lines 116-135 of LevelConfig.js) and pickup in `_checkPowerups()` of GameScene. Fix any edge cases where key fails to spawn. |
| LVL1-09 | Star of David lowered to center of chest on top-down sprite | Current position: `starOfDavid(ctx, cx, cy + 5, 4, ...)` in BombermanTextures.js line 678. The torso spans from `cy - 2` to `cy + 10` (12px tall, lines 487-488). Center of chest is `cy + 4`. Current `cy + 5` is already close to center. Need to verify visually if it appears at "neck level" and adjust. |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Phaser | ^3.80.1 | Game framework (physics, scenes, rendering) | Already the project's engine. Arcade physics provides gravity, colliders, velocity -- everything needed for platformer. |
| Canvas 2D API | N/A | All texture/sprite generation | Project mandate: no external assets. Every visual is procedural canvas. |
| Web Audio API | N/A | All sound/music | Project mandate: no audio files. SoundManager and MusicManager are procedural. |
| Vite | ^5.4.0 | Build tool / dev server | Already configured. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Phaser.Physics.Arcade | (bundled) | Platformer physics | Gravity, colliders, velocity, body size -- all platformer needs |
| Phaser.GameObjects.TileSprite | (bundled) | Parallax scrolling backgrounds | Used in BomberScene for clouds, sea, terrain -- same pattern for city skyline |

### Alternatives Considered
None. The project is locked into Phaser 3 + procedural canvas + Web Audio. No external libraries or assets are permissible.

## Architecture Patterns

### Recommended Project Structure

New files to create:
```
src/
├── scenes/
│   └── PlatformerScene.js        # New side-scrolling platformer scene (Phase 1 of Level 1)
├── utils/
│   └── PlatformerLevel1Textures.js  # Tehran skyline, rooftop platforms, obstacles (canvas)
```

Files to modify:
```
src/
├── main.js                        # Add PlatformerScene to scene list
├── scenes/IntroCinematicScene.js   # Update transition: FlightRouteScene -> PlatformerScene (not GameScene)
├── utils/BombermanTextures.js      # Fix Star of David position (LVL1-09)
```

NOTE: The existing `PlatformerTextures.js` is actually the Boss 2 "Turbo Turban" face sprite -- it has nothing to do with platformer gameplay. The new file needs a different name: `PlatformerLevel1Textures.js`.

### Pattern 1: Scene-Based Phase Separation
**What:** Each gameplay phase is its own Phaser Scene. PlatformerScene handles the rooftop run, then starts GameScene for Bomberman.
**When to use:** Always for this project -- each level/phase is a separate scene.
**Example:**
```javascript
// PlatformerScene.js - reaching the target building
_enterBuilding() {
  this.player.frozen = true;
  // Visual: zoom camera into window
  this.cameras.main.zoomTo(2.5, 800, 'Power2');
  this.cameras.main.fadeOut(800, 0, 0, 0);
  this.time.delayedCall(1000, () => {
    MusicManager.get().stop(0.3);
    this.scene.start('GameScene');
  });
}
```

### Pattern 2: Parallax Background Layers (from BomberScene)
**What:** Multiple TileSprite layers scrolling at different speeds to create depth.
**When to use:** For the Tehran night skyline background.
**Example:**
```javascript
// Established pattern from BomberScene._scrollLayers()
_scrollLayers(speed, dt) {
  const dx = speed * dt;
  this.starsBg.tilePositionX += dx * 0.02;    // stars barely move
  this.mountainsBg.tilePositionX += dx * 0.1;  // Alborz mountains
  this.skylineBg.tilePositionX += dx * 0.3;    // Tehran skyline (Azadi, Milad towers)
  this.buildingsBg.tilePositionX += dx * 0.6;  // near buildings
}
```

### Pattern 3: Procedural Canvas Textures
**What:** All visuals drawn via HTML Canvas 2D context, registered with `scene.textures.addCanvas()`.
**When to use:** Every texture in the game. No PNG/SVG/external assets.
**Example:**
```javascript
// Pattern from all *Textures.js files
export function createPlatformerTextures(scene) {
  if (scene.textures.exists('plt_rooftop')) return; // guard against double-create

  const c = document.createElement('canvas');
  c.width = 128; c.height = 64;
  const ctx = c.getContext('2d');
  // ... draw rooftop platform ...
  scene.textures.addCanvas('plt_rooftop', c);
}
```

### Pattern 4: Side-Scrolling Platformer with Camera Follow
**What:** Player runs right; camera follows. World is wider than screen.
**When to use:** The new platformer phase.
**Example:**
```javascript
// In create():
this.physics.world.setBounds(0, 0, WORLD_WIDTH, H);
this.cameras.main.setBounds(0, 0, WORLD_WIDTH, H);
this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

// Player physics:
this.player = this.physics.add.sprite(100, 300, 'plt_player_run_0');
this.player.setCollideWorldBounds(true);
// Arcade physics gravity already set globally at 900
```

### Pattern 5: Obstacle Reuse from Obstacle.js
**What:** `SecurityCamera`, `Searchlight`, and `FlashlightGuard` classes already exist with vision cone detection.
**When to use:** LVL1-04 obstacles. These classes accept config objects for position, sweep range, cone length.
**Adaptation needed:** `FlashlightGuard` currently uses `TILE`-based coordinates from LevelConfig. For the platformer, pass pixel coordinates directly or create a thin wrapper.

### Anti-Patterns to Avoid
- **Modifying GameScene for the platformer:** GameScene must remain unchanged. The platformer is a new, separate scene that runs before it.
- **Loading external textures:** Everything must be procedural canvas. No image files.
- **Sharing physics state between scenes:** Each Phaser scene has its own physics world. PlatformerScene has gravity; GameScene sets `gravity.y = 0` for top-down Bomberman.
- **Over-engineering the platformer:** This is a ~30-60 second gameplay segment, not a full Mario game. Keep it tight: ~10 platforms, ~5 obstacles, ~3 guard patrols.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Platformer gravity | Custom gravity math | Phaser arcade physics `gravity.y: 900` (already configured in main.js) | Battle-tested, handles slopes/edges |
| Vision cone detection | Custom triangle-point intersection | Existing `_pointInTriangle()` in Obstacle.js + SecurityCamera/Searchlight classes | Already debugged and working in the game |
| Camera follow | Manual camera positioning per frame | `cameras.main.startFollow()` | Built into Phaser, handles bounds and smoothing |
| Parallax scrolling | Manual layer offsetting | `TileSprite.tilePositionX` increment (BomberScene pattern) | Already proven in the project |
| Guard patrol | Custom position tracking | Phaser arcade physics + `body.setVelocityX()` + `body.blocked` checks (existing Guard.js pattern) | Handles wall collisions automatically |
| Guard walking animation | Frame counter logic | Existing `walkTimer`/`walkFrame` pattern from FlashlightGuard and BombermanGuard | Consistent with project style |

## Common Pitfalls

### Pitfall 1: Floating Guards (LVL1-05)
**What goes wrong:** Guards are placed on platforms but don't have gravity or colliders, so they float in the air or walk off edges into nothing.
**Why it happens:** The platformer world uses global gravity (900), but if guards are created as static images instead of physics sprites with colliders, they won't respond to gravity. Or if colliders are set up between guards and platforms, but the guard sprite body size doesn't match the visual.
**How to avoid:**
1. Guards MUST be `physics.add.sprite()` (not `add.image()`).
2. Guards MUST have colliders with the platform group: `physics.add.collider(guard.sprite, platformGroup)`.
3. Guard `body.setSize()` and `body.setOffset()` must align feet with the sprite bottom.
4. Add `console.log` verification: `console.log('Guard Y:', guard.y, 'Platform Y:', platform.y)` to ensure feet touch ground.
5. Guards should NOT walk off platform edges. Check `body.blocked.down` to confirm they're on a surface, and reverse direction near platform edges.
**Warning signs:** Guards visually separated from platform surface, guards falling through platforms, guards walking into empty space.

### Pitfall 2: Gravity Conflict Between Scenes
**What goes wrong:** Global gravity is set to 900 in `main.js` config. GameScene manually overrides to 0 (`this.physics.world.gravity.y = 0`). If PlatformerScene doesn't handle this correctly, or if transitioning back affects gravity.
**Why it happens:** Phaser's global physics config applies to all scenes. GameScene explicitly sets gravity to 0 in `create()`.
**How to avoid:** PlatformerScene should NOT change global gravity -- the default 900 is exactly what a platformer needs. GameScene already handles its own gravity override. Transition order: PlatformerScene (gravity 900) -> GameScene (sets gravity 0 in create).
**Warning signs:** Player or objects falling unexpectedly in Bomberman phase.

### Pitfall 3: Missing Texture Guard
**What goes wrong:** `scene.textures.addCanvas()` called twice for the same key throws an error or overwrites.
**Why it happens:** If PlatformerScene creates textures and GameScene also creates textures, and both use the same naming pattern.
**How to avoid:** All platformer textures should use a unique prefix like `plt_` (for platformer). Always check `scene.textures.exists('key')` before creating.
**Warning signs:** Console errors about duplicate texture keys, wrong sprites appearing.

### Pitfall 4: Scene Transition Data Loss
**What goes wrong:** Statistics or state needed after the platformer phase aren't passed to GameScene.
**Why it happens:** Each Phaser scene is independent. `scene.start('GameScene')` creates a fresh GameScene.
**How to avoid:** If needed, pass data via `scene.start('GameScene', { fromPlatformer: true })`. Currently GameScene doesn't need any data from the platformer -- it starts fresh anyway.
**Warning signs:** N/A -- current design doesn't require data passing.

### Pitfall 5: Platform Collision Box Mismatch
**What goes wrong:** Player stands on visually curved platforms (dome tops, balconies) but the collision box is rectangular, causing the player to appear floating or sinking.
**Why it happens:** Arcade physics only supports rectangular (AABB) collision boxes. Curved visual platforms need flat collision boxes at the top.
**How to avoid:** For domed/curved platforms, use an invisible rectangular static body at the top surface where the player walks, and a separate decorative image for the visual shape below.
**Warning signs:** Player feet not touching visual platform surface, player clipping through curved edges.

### Pitfall 6: Star of David Position (LVL1-09)
**What goes wrong:** The Star of David appears at neck level on the top-down Bomberman sprite instead of chest center.
**Why it happens:** In the 32x32 sprite, `cy = 16` (center). The torso spans from `cy - 2 = 14` to `cy + 10 = 26`. Chest center should be around `cy + 4 = 20`. Current placement is `cy + 5 = 21`. The issue might not be the Y offset but the visual perception when the tactical vest overlay (`cy - 1` to `cy + 9`) makes the effective chest area different.
**How to avoid:** Measure carefully. The vest overlay runs from y=15 to y=25 (10px). Center = y=20 = `cy + 4`. Adjust from `cy + 5` to `cy + 4` or even `cy + 3` to ensure it reads as "center of chest" not "lower chest/belly".
**Warning signs:** Star appears too high (neck) or too low (belly). Test with all 4 directions.

## Code Examples

### Example 1: PlatformerScene Structure
```javascript
// PlatformerScene.js -- high-level structure
import Phaser from 'phaser';
import { createPlatformerTextures } from '../utils/PlatformerLevel1Textures.js';
import SoundManager from '../systems/SoundManager.js';
import MusicManager from '../systems/MusicManager.js';
import { showControlsOverlay } from '../ui/ControlsOverlay.js';

const W = 960, H = 540;
const WORLD_WIDTH = 4800;  // ~5 screens wide
const GROUND_Y = 480;       // bottom of world (below platforms)

export default class PlatformerScene extends Phaser.Scene {
  constructor() { super('PlatformerScene'); }

  create() {
    // Gravity is already 900 from main.js config -- perfect for platformer
    this.cameras.main.setBackgroundColor('#0a0a1a');
    MusicManager.get().playLevel1Music();

    createPlatformerTextures(this);
    showControlsOverlay(this, 'ARROWS: Move/Jump | ESC: Pause');

    this.physics.world.setBounds(0, 0, WORLD_WIDTH, H);
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, H);

    this._createBackground();
    this._createPlatforms();
    this._createObstacles();
    this._createPlayer();
    this._createGuards();
    this._createTarget();

    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.fadeIn(500, 0, 0, 0);
  }
}
```

### Example 2: Tehran Night Skyline Background (Canvas)
```javascript
// In PlatformerLevel1Textures.js
function drawTehranSkyline(scene) {
  const c = document.createElement('canvas');
  c.width = 960; c.height = 300;
  const ctx = c.getContext('2d');

  // Night gradient sky
  const skyGrad = ctx.createLinearGradient(0, 0, 0, 300);
  skyGrad.addColorStop(0, '#0a0a1a');    // deep night
  skyGrad.addColorStop(0.6, '#1a1a2a');  // slightly lighter horizon
  skyGrad.addColorStop(1, '#2a2030');    // city glow
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, 960, 300);

  // Stars
  for (let i = 0; i < 80; i++) {
    const sx = Math.random() * 960;
    const sy = Math.random() * 200;
    const sr = 0.3 + Math.random() * 1.2;
    ctx.fillStyle = `rgba(255,255,255,${0.3 + Math.random() * 0.7})`;
    ctx.beginPath();
    ctx.arc(sx, sy, sr, 0, Math.PI * 2);
    ctx.fill();
  }

  // Moon (large, upper right)
  ctx.fillStyle = '#e8e0c0';
  ctx.beginPath();
  ctx.arc(780, 60, 30, 0, Math.PI * 2);
  ctx.fill();
  // Moon glow
  ctx.fillStyle = 'rgba(232, 224, 192, 0.1)';
  ctx.beginPath();
  ctx.arc(780, 60, 50, 0, Math.PI * 2);
  ctx.fill();

  // Alborz mountains (jagged silhouette)
  ctx.fillStyle = '#1a1a2a';
  ctx.beginPath();
  ctx.moveTo(0, 250);
  ctx.lineTo(100, 180); ctx.lineTo(200, 150); ctx.lineTo(300, 130);
  ctx.lineTo(400, 140); ctx.lineTo(500, 120); ctx.lineTo(600, 135);
  ctx.lineTo(700, 125); ctx.lineTo(800, 145); ctx.lineTo(900, 160);
  ctx.lineTo(960, 170); ctx.lineTo(960, 300); ctx.lineTo(0, 300);
  ctx.closePath();
  ctx.fill();

  // Milad Tower silhouette (tall, distinctive shape)
  ctx.fillStyle = '#1e1e2e';
  // Shaft
  ctx.fillRect(420, 100, 4, 150);
  // Pod (observation deck)
  ctx.beginPath();
  ctx.ellipse(422, 130, 12, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  // Antenna
  ctx.fillRect(421, 80, 2, 20);

  // Azadi Tower silhouette (inverted Y arch shape)
  ctx.fillStyle = '#1e1e2e';
  ctx.beginPath();
  ctx.moveTo(180, 250);  // left base
  ctx.lineTo(190, 200);  // left leg up
  ctx.lineTo(200, 180);  // arch center
  ctx.lineTo(210, 200);  // right leg up
  ctx.lineTo(220, 250);  // right base
  ctx.lineTo(215, 250);
  ctx.lineTo(207, 205);
  ctx.lineTo(200, 190);
  ctx.lineTo(193, 205);
  ctx.lineTo(185, 250);
  ctx.closePath();
  ctx.fill();

  scene.textures.addCanvas('plt_tehran_skyline', c);
}
```

### Example 3: Rooftop Guard (Feet on Ground)
```javascript
// Guard that walks on platforms, never floats
class RooftopGuard {
  constructor(scene, x, y, patrolRange) {
    this.scene = scene;
    this.sprite = scene.physics.add.sprite(x, y, 'plt_guard_walk_0');
    this.sprite.setDepth(9);
    this.sprite.body.setSize(24, 48);
    this.sprite.body.setOffset(20, 16); // Offset so feet align with body bottom
    // DO NOT disable gravity -- let arcade physics handle ground contact

    this.patrolMinX = x - patrolRange;
    this.patrolMaxX = x + patrolRange;
    this.speed = 60;
    this.dir = 1;
    this.walkFrame = 0;
    this.walkTimer = 0;

    // CRITICAL: Add console.log for verification (LVL1-05)
    console.log(`Guard spawned at y=${y}, patrol range [${this.patrolMinX}-${this.patrolMaxX}]`);
  }

  update(delta) {
    // Only move if on ground (never float)
    if (!this.sprite.body.blocked.down) return;

    this.sprite.body.setVelocityX(this.speed * this.dir);

    // Reverse at patrol bounds
    if (this.sprite.x >= this.patrolMaxX) this.dir = -1;
    if (this.sprite.x <= this.patrolMinX) this.dir = 1;
    this.sprite.setFlipX(this.dir < 0);

    // Edge detection: prevent walking off platforms
    // Check if there's ground ahead
    const checkX = this.sprite.x + this.dir * 20;
    const checkY = this.sprite.y + this.sprite.body.height / 2 + 5;
    // If no platform ahead, reverse
    // (Simplified: use patrol bounds instead of raycasting)

    // Walk animation
    this.walkTimer += delta;
    if (this.walkTimer > 150) {
      this.walkTimer = 0;
      this.walkFrame = (this.walkFrame + 1) % 4;
      this.sprite.setTexture(`plt_guard_walk_${this.walkFrame}`);
    }

    // VERIFICATION: Log guard position every 5 seconds
    if (Math.random() < 0.001) {
      console.log(`Guard y=${this.sprite.y}, onGround=${this.sprite.body.blocked.down}`);
    }
  }
}
```

### Example 4: Platform Placement
```javascript
// Platform definitions for the rooftop run
const PLATFORMS = [
  // Starting rooftop (wide, flat)
  { x: 200, y: 380, w: 400, h: 32, type: 'flat_roof' },
  // Gap then next building
  { x: 700, y: 350, w: 200, h: 32, type: 'balcony' },
  // Higher mosque dome
  { x: 1050, y: 300, w: 160, h: 32, type: 'dome_top' },
  // Long building rooftop
  { x: 1400, y: 340, w: 350, h: 32, type: 'flat_roof' },
  // Staggered small platforms
  { x: 1900, y: 310, w: 120, h: 32, type: 'cornice' },
  { x: 2100, y: 280, w: 120, h: 32, type: 'balcony' },
  // Large building with guard
  { x: 2500, y: 330, w: 300, h: 32, type: 'flat_roof' },
  // Final approach
  { x: 3000, y: 300, w: 150, h: 32, type: 'cornice' },
  { x: 3300, y: 270, w: 150, h: 32, type: 'flat_roof' },
  // Target building
  { x: 3700, y: 320, w: 400, h: 32, type: 'target_roof' },
];
```

### Example 5: Scene Flow Update
```javascript
// IntroCinematicScene.js -- change the transition target
// Current (line 88):
// }, 'FlightRouteScene', { level: 1, nextScene: 'GameScene' });
// New:
}, 'FlightRouteScene', { level: 1, nextScene: 'PlatformerScene' });

// FlightRouteScene already passes `nextScene` through to scene.start()
// So changing the parameter is sufficient.

// main.js -- add PlatformerScene to scene array
import PlatformerScene from './scenes/PlatformerScene.js';
// Add to config.scene array (after GameScene or before)
```

### Example 6: Star of David Fix (LVL1-09)
```javascript
// BombermanTextures.js, around line 675-684
// Current:
// starOfDavid(ctx, cx, cy + 5, 4, '#FFD700');
// ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
// ctx.beginPath();
// ctx.arc(cx, cy + 5, 2, 0, Math.PI * 2);
// ctx.fill();

// Fixed (lowered to true chest center):
starOfDavid(ctx, cx, cy + 3, 4, '#FFD700');
ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
ctx.beginPath();
ctx.arc(cx, cy + 3, 2, 0, Math.PI * 2);
ctx.fill();
// Chest area: vest goes from cy-1 to cy+9 (10px). Center = cy+4.
// But visually the torso body is wider at cy+0 to cy+6, so cy+3 is
// the optical center of the visible chest. Verify in-game.
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Level 1 = Bomberman only | Level 1 = Platformer + Bomberman | Phase 32 (now) | New scene before GameScene, scene flow change |
| IntroCinematic -> FlightRoute -> GameScene | IntroCinematic -> FlightRoute -> PlatformerScene -> GameScene | Phase 32 (now) | IntroCinematicScene.js line 88 needs update |

**Deprecated/outdated:**
- `PlatformerTextures.js`: Misleading name -- this file is actually Boss 2 "Turbo Turban" face textures. NOT related to platformer gameplay at all. Do NOT modify or reuse for this phase.

## Open Questions

1. **Platformer player sprite dimensions**
   - What we know: The full-body side-view sprite already exists in `SpriteGenerator.js` (128x128, detailed). The Bomberman top-down sprite is 32x32.
   - What's unclear: Should the platformer use the 128x128 cinematic sprite scaled down, or a new purpose-built smaller sprite?
   - Recommendation: Create a new 64x64 side-view running sprite. 128x128 is cinematic quality (too detailed for small platformer). 32x32 is too small. 64x64 is the sweet spot for a side-scroller at 960x540 resolution.

2. **Platformer level length**
   - What we know: The game runs at 960x540. BomberScene flight phase uses ~3500px of scroll distance.
   - What's unclear: How long should the rooftop run be? Too short feels pointless, too long becomes tedious.
   - Recommendation: ~4000-5000px world width (~4-5 screens). 10-12 platforms. Takes ~30-60 seconds to complete. This matches the pacing of other level intros in the game.

3. **Detection/damage model for platformer obstacles**
   - What we know: In the Bomberman phase, guards deal contact damage. In the old stealth version, detection triggered alerts.
   - What's unclear: Should camera/searchlight detection in the platformer deal damage, trigger an alert, or just be avoidable hazards?
   - Recommendation: Contact damage (like Bomberman guards). Touch a vision cone = take 1 damage. Touch electric wire = take 1 damage. Touch guard = take 1 damage. Simple, consistent with the game's existing approach.

4. **Player HP continuity between phases**
   - What we know: GameScene starts the player at 3 HP fresh.
   - What's unclear: Should HP carry over from platformer to Bomberman?
   - Recommendation: Do NOT carry HP over. GameScene already starts fresh at 3 HP. This keeps phases independent and avoids penalizing players who struggle with platforming.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Manual browser testing + Playwright (^1.58.2, in devDependencies) |
| Config file | None -- no test config exists |
| Quick run command | `cd superzion && npm run dev` (manual browser test) |
| Full suite command | Manual playthrough (no automated test suite exists) |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| LVL1-01 | Side-scrolling platformer with run/jump | manual | Play PlatformerScene, verify horizontal scrolling and jump mechanics | N/A |
| LVL1-02 | Tehran night skyline with landmarks | manual | Visually verify Azadi Tower, Milad Tower, mountains, moon, stars in background | N/A |
| LVL1-03 | Iranian building rooftop platforms | manual | Verify platform visuals look like rooftops, balconies, domes | N/A |
| LVL1-04 | Cameras, guards, searchlights, electric wire | manual | Verify each obstacle type functions and deals damage | N/A |
| LVL1-05 | Guards walk on floor, never float | manual + console.log | Check guard.y vs platform.y in console output; visual verification | N/A |
| LVL1-06 | Target building entry triggers transition | manual | Reach end of platformer, verify visual transition to Bomberman | N/A |
| LVL1-07 | Bomberman phase preserved intact | manual | Play through Bomberman after platformer, verify all mechanics work | N/A |
| LVL1-08 | Key visible, pickable, functional | manual | Find and pick up key in Bomberman, verify golden door opens | N/A |
| LVL1-09 | Star of David at chest center | manual | Inspect top-down player sprite, verify star position | N/A |

### Sampling Rate
- **Per task commit:** `cd superzion && npm run dev` -- play through Level 1 in browser
- **Per wave merge:** Full Level 1 playthrough: menu -> cinematic -> flight route -> platformer -> Bomberman -> explosion cinematic
- **Phase gate:** Complete Level 1 playthrough with all 9 requirements verified

### Wave 0 Gaps
None -- this project has no automated test infrastructure, and all testing is manual browser-based. No test framework setup needed for this phase.

## Sources

### Primary (HIGH confidence)
- Direct codebase analysis: `main.js`, `GameScene.js`, `BomberScene.js`, `Player.js`, `Guard.js`, `Obstacle.js`, `BombermanTextures.js`, `SpriteGenerator.js`, `EndgameManager.js`, `LevelConfig.js`, `IntroCinematicScene.js`, `FlightRouteScene.js`, `EnemySpriteGenerator.js`, `TopDownTextures.js`
- `package.json`: Phaser ^3.80.1, Vite ^5.4.0
- `main.js` config: 960x540 resolution, arcade physics with gravity.y = 900

### Secondary (MEDIUM confidence)
- Phaser 3 arcade physics documentation (platformer patterns, camera follow, TileSprite) -- well-established, stable API

### Tertiary (LOW confidence)
- None -- all findings are from direct codebase analysis

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - directly verified from package.json and codebase
- Architecture: HIGH - patterns extracted from existing scenes (BomberScene, GameScene)
- Pitfalls: HIGH - identified from actual code analysis (gravity config, texture naming, guard physics)
- Code examples: HIGH - adapted from real project code patterns

**Research date:** 2026-03-20
**Valid until:** Indefinite (codebase-specific research, no external dependency drift concerns)
