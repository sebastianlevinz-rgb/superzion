# SUPERZION — Full Rebuild with Kaplay

## Instructions for Claude Code

This document is a complete blueprint for rebuilding SuperZion from scratch using Kaplay (v3001). It contains everything needed: project setup, architecture, every level's mechanics, visuals, audio, and build order.

**IMPORTANT**: Use this document as the single source of truth. Read the relevant section before implementing each phase. The original Phaser version is in `superzion/` for reference — reuse game logic (constants, AI patterns, boss behaviors) but rewrite all rendering and input code for Kaplay.

---

## PROJECT SETUP

### Create the project
```bash
cd C:\Users\Seba\Desktop\ORL3
mkdir superzion-kaplay
cd superzion-kaplay
npm init -y
npm install kaplay@3001
npm install -D vite
```

### Project structure
```
superzion-kaplay/
  index.html
  vite.config.js
  package.json
  src/
    main.js                    # Kaplay init + scene registry
    constants.js               # Shared game constants (W, H, colors)
    scenes/
      boot.js                  # Loading + audio unlock
      menu.js                  # Level select + difficulty
      level1-platformer.js     # Tehran rooftop run
      level1-bomberman.js      # Tehran bomberman phase
      level2-stealth.js        # Port infiltration
      level3-bomber.js         # F-15 aerial bombing
      level4-drone.js          # Drone + Sinwar boss
      level5-b2.js             # B-2 stealth bomber
      level6-boss.js           # Final boss
      cinematic.js             # Shared cinematic engine
      cinematics/              # Per-level cinematic data
        intro.js
        beirut-intro.js
        deepstrike-intro.js
        underground-intro.js
        mountain-intro.js
        lastststand-intro.js
        victory.js
        credits.js
        explosion.js
        flight-route.js
    entities/
      player-bomberman.js      # Bomberman player entity
      player-platformer.js     # Platformer player entity
      guard.js                 # Bomberman guard AI
      rooftop-guard.js         # Platformer guard AI
      bomb.js                  # Bomb entity
      boss-foam-beard.js       # Level 1 boss
      boss-sinwar.js           # Level 4 boss
      boss-supreme-turban.js   # Level 6 boss
    systems/
      sound-manager.js         # Web Audio API synth SFX (port from Phaser version)
      music-manager.js         # Procedural music (port from Phaser version — engine-independent)
      difficulty.js            # Difficulty manager
      texture-factory.js       # Canvas2D -> Kaplay sprite pipeline
      game-juice.js            # Screen effects (flash, shake, freeze, particles)
      touch-controls.js        # Mobile virtual controls
    ui/
      hud.js                   # Unified HUD component
      end-screen.js            # Victory/defeat overlay
      controls-overlay.js      # Tutorial overlay
    data/
      level1-config.js         # Grid layout, guard defs, spawn points
```

### index.html
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <title>SuperZion</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: #000; overflow: hidden;
      touch-action: none; user-select: none;
      -webkit-user-select: none;
      position: fixed; width: 100%; height: 100%;
    }
    canvas { display: block; }
  </style>
</head>
<body>
  <script type="module" src="/src/main.js"></script>
</body>
</html>
```

### vite.config.js
```javascript
export default { base: './' };
```

### src/main.js
```javascript
import kaplay from "kaplay";

// CRITICAL: global: false avoids Safari navigation() conflict
const k = kaplay({
  global: false,
  width: 960,
  height: 540,
  background: [0, 0, 0],
  crisp: true,        // pixel-perfect rendering
  stretch: true,       // fill screen
  letterbox: true,     // maintain aspect ratio
  touchToMouse: true,  // touch events become mouse events
  buttons: {           // virtual button bindings
    jump:   { keyboard: ["space", "up", "w"], mouse: "left" },
    fire:   { keyboard: ["space"] },
    bomb:   { keyboard: ["space"] },
    dodge:  { keyboard: ["shift"] },
    chaff:  { keyboard: ["c"] },
    pause:  { keyboard: ["escape"] },
    mute:   { keyboard: ["m"] },
  },
});

// Register all scenes
import { bootScene } from "./scenes/boot.js";
import { menuScene } from "./scenes/menu.js";
// ... import all scenes

k.scene("boot", () => bootScene(k));
k.scene("menu", () => menuScene(k));
// ... register all scenes

k.go("boot");

export default k;
```

### src/constants.js
```javascript
export const W = 960;
export const H = 540;
export const COLORS = {
  gold: [255, 215, 0],
  military: [0, 170, 68],
  danger: [255, 68, 68],
  cyan: [0, 229, 255],
  white: [255, 255, 255],
};
```

### src/systems/texture-factory.js
```javascript
// Bridge: Canvas 2D drawing -> Kaplay sprites
// This lets us reuse all procedural texture code from the Phaser version

export function makeTexture(k, name, width, height, drawFn) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  drawFn(ctx, width, height);
  k.loadSprite(name, canvas.toDataURL());
}

// Example usage:
// makeTexture(k, "player_idle", 64, 64, (ctx, w, h) => {
//   ctx.fillStyle = "#3a5530";
//   ctx.fillRect(16, 8, 32, 48);
//   // ... draw player
// });
```

---

## ARCHITECTURE PATTERNS

### Scene Pattern
Every scene follows this structure:
```javascript
export function level1BombermanScene(k) {
  // 1. Generate textures
  // 2. Create game objects
  // 3. Setup input
  // 4. Game loop (onUpdate)
  // 5. Collision handlers
}
```

### Entity Pattern
Entities are Kaplay game objects with components:
```javascript
function createPlayer(k, x, y) {
  return k.add([
    k.sprite("player_idle"),
    k.pos(x, y),
    k.area({ width: 22, height: 22 }),
    k.body(),
    k.health(3),
    k.state("idle", ["idle", "run", "jump", "shoot"]),
    k.z(10),
    "player",
  ]);
}
```

### Mobile Touch Pattern
Kaplay has `touchToMouse: true` which converts touch to mouse events. For virtual controls, use HTML overlay (same approach that worked in Phaser version — DOM elements are engine-independent):
```javascript
// The touch-controls.js from the Phaser version can be reused almost verbatim
// since it's pure DOM (no Phaser dependency)
```

---

## LEVEL DESIGNS

### LEVEL 1 PHASE 1: PLATFORMER — Tehran Rooftop Run

**Genre reference**: Mega Man, Contra, Metal Slug

**Scene**: `level1-platformer.js`

#### World
- Width: 2400px, Height: 540px
- Camera zoom: 1.5x, follows player
- Gravity: 900 px/s^2
- 9 rooftop platforms forming a linear path left to right
- Target building at far right

#### Player
- Speed: 200 px/s (horizontal)
- Jump velocity: -420 px/s
- Coyote time: 80ms
- Jump buffer: 100ms
- HP: 3
- Shoot: SPACE, bullet speed 500px/s, 300ms cooldown

#### Guards (4 total)
- Patrol speed: 50px/s, range varies per guard
- Alert mode: When player within 150px, speed increases to 90px/s, chase toward player, red tint
- Animation: 4-frame walk cycle at 150ms/frame
- Contact = 1 damage to player

#### Obstacles
- 2 security cameras with sweeping vision cones (100px range, 60deg angle)
- Contact with cone = damage

#### Background (4-layer parallax)
- Layer 1 (0.02x): Night sky with stars and moon
- Layer 2 (0.1x): Far mountains
- Layer 3 (0.3x): City skyline with lit windows
- Layer 4 (0.6x): Near building facades

#### Rooftop Details (decorative)
- Water tanks, satellite dishes, AC units, laundry lines
- All on depth 4, no collision

#### Audio
- Music: `playLevel1Music()` (trance, tense)
- SFX: jump, land, shoot, guard death explosion, damage hurt, ambient wind

#### Visual Effects
- Muzzle flash on shoot (screenFlash yellow, 60ms)
- Impact particles on guard kill (10 particles, orange palette)
- Camera shake on kill (150ms, 0.008)
- Red flash + blink on player damage (2s invulnerability)

#### Transition
- Reach target building -> fade out -> GameScene (bomberman)

---

### LEVEL 1 PHASE 2: BOMBERMAN — Tehran Guest Room

**Genre reference**: Bomberman, Super Bomberman

**Scene**: `level1-bomberman.js`

#### Grid
- 27 columns x 14 rows, tile size 34px
- Grid origin: x=21, y=60 (HUD offset)
- Wall pattern: Permanent walls on even rows & even columns
- 2 zones separated by wall at col 13 (door at row 7)
- Golden door requiring key in zone 2
- Breakable crates: 22% density zone 1, 28% zone 2

#### Player (BombermanPlayer)
- Base speed: 130 px/s (+ 30 per speed boost)
- Max bombs: 1 (upgradeable)
- Bomb range: 2 tiles (upgradeable)
- HP: 3
- Dodge/dash: SHIFT, 400px/s for 200ms, 1s cooldown, 250ms invuln
- Facing: 4 directions, 2-frame animation at 180ms

#### Bombs
- Fuse: 3 seconds
- Explosion: Cross pattern, range tiles
- Destroys breakable crates, damages guards and player
- Chain explosions

#### Guards (6 total)
- 3 patrol (75px/s, random direction changes 1.5-3.5s)
- 3 chasers (60px/s base, 82px/s when chasing within 3 tiles)
- Contact = 1 damage

#### Boss: Foam Beard (Ismail Haniyeh)
- HP: 5 (difficulty scaled)
- Position: col 22, row 7
- Movement: Walks 4-tile range at 30px/s
- Attack: Throws documents at player (120px/s, 2.5s interval, 1.5s enraged)
- Expressions: Normal -> Angry (66% HP) -> Furious (33% HP) -> Dead
- Phase transitions: "ENRAGED!" flash at 66%, "DESPERATE!" at 33%

#### Powerups (random in ~35% of breakables)
- Bomb+1 (extra bomb capacity)
- Range+1 (explosion range)
- Speed boost
- Key (required for golden door)

#### Objective Flow
1. Navigate grid, destroy crates
2. Find key
3. Unlock golden door
4. Plant explosive at objective marker
5. Escape to spawn point

#### Audio
- Music: `playLevel1Music()` continuing from platformer
- SFX: bomb place, explosion, door open, step sounds, powerup collect, boss hit

#### Visual Effects
- Explosion flash (screenFlash orange, 80ms)
- Boss phase transition (bossPhaseTransition with freeze + text)
- Impact particles on boss hit
- Wall debris particles on crate destruction (10 brown/tan particles)
- Dodge ghost trail (cyan tinted afterimage)

---

### LEVEL 2: STEALTH — Operation Grim Beeper (Port Infiltration)

**Genre reference**: Metal Gear Solid (top-down), Hotline Miami

**Scene**: `level2-stealth.js`

#### World
- Full screen: 960x540
- 3 container yards: North (3x5), South (3x5), East (2x4 + scattered)
- ~30 containers total, 40x18px each
- Dock floor + water edges + 2 ships + 3 cranes + 2 office buildings

#### Player
- Speed: 100px/s (normal), 170px/s (sprint)
- Sprint: SHIFT, costs 3% suspicion/s near guards
- Scan: SPACE (1500ms to scan a container)
- Interact: E (interact with container)
- Distract: Q (3 uses, freezes guards for 5s)
- Body: 14x14px with 6px clearance

#### Suspicion System
- Range: 0-100%
- Guard in vision cone: +14%/s
- Camera in vision cone: +10%/s
- Passive decay: -8%/s
- Worker proximity bonus: -4%/s
- Sprint penalty near guards: +3%/s
- Guard sees open container: +80% instant
- At 100%: MISSION FAILED

#### Guards (6-8, difficulty-dependent)
- Patrol: Waypoint routes, 40px/s
- Vision cone: 100px range, 60deg angle
- Alert speed: 55px/s
- **LOS blocking**: Containers block vision (5-point raycast)
- **Communication**: When suspicion >70%, guards within 200px alert (yellow tint, 5s)
- Alert timer on guard objects

#### Security Cameras (5)
- Vision cone: 90px range
- Fixed position, sweeping rotation

#### Workers (12, decorative)
- Wander slowly, provide cover (reduce suspicion when nearby)

#### Mission Flow
1. Infiltrate the port
2. Scan containers to find the beeper shipment
3. Open target container
4. Plant explosives (4.3s exposure: remove 2s + plant 1.5s + close 0.8s)
5. Escape to extraction point

#### Minimap
- 120x70px, bottom-right
- Shows player, guards, containers

#### Audio
- Music: `playLevel2Music()` (tense stealth)
- SFX: radar blips for intel, ambient industrial sounds

#### Visual Effects
- Screen flash red at 50% suspicion
- Hit feedback (flash + shake + freeze) at 100% caught
- Guard tint changes: yellow (alert), red (detecting)

---

### LEVEL 3: AERIAL — Operation Deep Strike (F-15 Bombing)

**Genre reference**: 1942, R-Type, Afterburner

**Scene**: `level3-bomber.js`

#### Phases (6 total)
1. **Takeoff** (auto, cinematic): F-15 launches from carrier deck
2. **Sea Flight**: Fly over Mediterranean, dodge SAMs
3. **Coast**: Terrain transitions sea -> land
4. **Bombing**: Fly over bunker, drop bombs to destroy 5 layers
5. **Return**: Reverse flight back to carrier
6. **Landing**: Manual landing on carrier deck (skill check)

#### Flight Physics
- Base speed: 440px/s (constant horizontal scroll)
- Climb rate: -180px/s (UP key)
- Dive rate: 180px/s (DOWN key)
- Gravity: 30px/s^2 (mild descent when idle)
- Horizontal control: LEFT/RIGHT for +/-200px/s local movement
- Tilt: Visual rotation +/-20deg based on vertical velocity

#### Weapons
- Bombs: 8 total, gravity drop (480px/s^2), 0.35s cooldown
- Chaff: 3 total, counters SAM lock-on

#### SAM System
- Wave patterns: 8 preset patterns (not random)
- Speed: 182px/s, turn rate 0.5 rad/s
- Lifetime: 4 seconds, max 2 on-screen
- Warning: 1.5s before missile appears
- Flak: Sine-wave patterns, 1.8s intervals, 1s warning flash

#### Bunker (5 layers)
- Width: 200px, centered at x=480
- Each layer: 20px tall
- Boss inside: Turbo Turban (fires missiles every 3.5s, burst of 3 every 10s)
- **Counter-attack**: Turrets fire back during bombing (increasing frequency)

#### Landing
- Safe descent: <150px/s vertical
- **Altimeter beep**: Frequency increases as altitude drops
- Crash = retry or skip

#### Audio
- Music: Phase-specific tracks (`playLevel3Music(phase)`)
- SFX: jet engine, missile warning, bomb drop, bunker buster impact, explosion, chaff release, afterburner

#### Visual Effects
- 4-layer parallax: sunset sky, clouds (2 layers), terrain
- Engine particles (brown/orange trail)
- Explosion particles on impacts
- Screen flash on explosions
- SAM warning flash + arrow indicator
- Damage smoke trail when armor < 3

---

### LEVEL 4: DRONE — Operation Underground (Drone + Boss)

**Genre reference**: Enter the Gungeon, Nuclear Throne (twin-stick)

**Scene**: `level4-drone.js`

#### Phase 1: City Navigation Minigame
- Navigate drone to glowing window at (740, 250)
- Wind: Direction changes every 2.5s, strength 45-90px/s
- Debris: 1.8 spawns/s, fall speed 100-150px/s, knockback 30px
- Window target: 40x40px
- Drone speed: 200px/s

#### Phase 2: Boss Fight — Yahya Sinwar
- Top-down destroyed room, walls 40px inset
- Armchair obstacle at (580, 280), size 80x60px

**Drone weapons**:
- Bullets: SPACE, 300px/s, 4px, 0.25s cooldown, 1 damage
- Missiles: X, 200px/s homing, 8px, 3s cooldown, 5 damage
- Dash: SHIFT, 100px, 0.15s invuln, 1s cooldown

**Boss (HP: 30, difficulty-scaled)**:
- Phase 1 (100-60%): Hides behind armchair, peeks to throw objects
  - Hide: 1.5-2s, peek: 0.5s
- Phase 2 (60-30%): Roams room, throws objects
  - Speed: 100px/s, throw interval: 1.5s, projectile: 40px
- Phase 3 (30-0%): Desperate charges
  - Speed: 150px/s, throw interval: 1s, charge speed: 250px/s, charge cooldown: 4s
- Phase transitions: "PHASE 2 — HUNTING" and "PHASE 3 — DESPERATE" with full animation

#### Audio
- Music: Phase-specific (`playLevel4Music(phase)`)
- SFX: drone hum, bullet fire, missile launch, boss hit, debris impact

#### Visual Effects
- Boss phase transitions with freeze + flash + text
- Impact particles on boss hits (8 particles, fire colors)
- Hit feedback on drone damage (red flash, shake, freeze)
- Boss expression changes (normal -> angry -> furious -> dead)
- Boss character: 128x128px, detailed kefia, suit, expressions

---

### LEVEL 5: B-2 BOMBER — Operation Mountain Breaker

**Genre reference**: 1942 (top-down), AC-130 (bombing view)

**Scene**: `level5-b2.js`

#### Phases
1. **Takeoff** (7.5s): Cinematic runway launch with zoom-out
2. **Flight** (20s): Top-down stealth flight through radar zones
   - Sea (0-7s): Stars, waves, ships, moon
   - Coast (7-12s): Beach transition, palm trees, vegetation
   - Land (12-20s): Desert with roads, buildings, mosques
3. **Bombing**: Multi-pass bombing runs over mountain
4. **Explosion** (9.5s): 5-phase destruction cinematicsequence
5. **Escape** (8s): Cinematic return over ocean

#### Flight Phase
- B-2 speed: 220px/s player movement (4 directions)
- Terrain scrolls at 280px/s
- Radar zones: Sweeping cones, detection increases suspicion
- SAM sites: Fire tracking missiles after detection >40%
- Chaff: 5 total, counters SAM
- Detection bar: 0-100%, triggers missile at 100%

#### Bombing Phase (MULTI-PASS)
- B-2 auto-flies across screen (left->right, then reverse)
- 6 passes, 3 bombs per pass
- Player controls only UP/DOWN (altitude)
- Low altitude = accurate but risky
- High altitude = safe but bombs scatter (up to 30px drift)
- Mountain bunker: 5 layers, 70px hit radius
- SAM warnings every 7 seconds
- HUD: layers remaining, pass number, bombs, altitude status

#### Parallax (flight phase)
- Stars (0.05x), far clouds (0.15x), terrain (1.0x), foam/details (1.3x)
- Dust/haze at bottom (0.5x)

#### Audio
- Music: Phase-specific (`playLevel5Music(phase)`)
- SFX: B2 engine, bomb drop, bunker impact, missile warning, chaff, radar blip

#### Visual Effects
- Dynamic altitude/speed HUD
- Damage smoke trail
- Red border glow at high detection (>60%)
- SAM warning flash + indicator
- 5-phase mountain explosion sequence

---

### LEVEL 6: FINAL BOSS — Operation Last Stand

**Genre reference**: Contra boss fights, Mega Man boss rush

**Scene**: `level6-boss.js`

#### Structure
- Approach phase: Constant scroll (120px/s) toward boss bunker
- SAM dodging during approach
- Boss engagement at 4500px distance

#### Player (F-16)
- Vertical speed: 250px/s
- Horizontal speed: 200px/s base, +80px/s boost
- Bullets: 8 max, 150ms cooldown, 500px/s
- Heavy bombs: 8 total, 2s cooldown, 3x damage, 400px/s
- Anti-missile pulse: 5 charges, 100px radius, 5s cooldown
- Barrel roll: Double-tap LEFT/RIGHT within 300ms, 1s invuln, 3s cooldown

#### Boss: Supreme Turban (HP: 80, scaled to max 100)
- **Phase 1** (100-60%): Energy shield, drops every 5s for 2s vulnerability window
  - SAMs every 3s, spread missiles every 2s, homing missiles every 6s
  - Shield drop: Cyan flash + blue particle burst
- **Phase 2** (60-30%): Rotating shield (12 HP) + drone spawning
  - Drone portals with warp effects
  - Area bombs dropped by boss
  - Phase transition: "SHIELD OVERLOAD" animation
- **Phase 3** (30-0%): Laser sweep + rapid fire
  - Horizontal laser with 80px gap
  - Rapid fire between sweeps
  - Phase transition: "FINAL STAND" animation

#### Progressive Visual Intensity
- Phase 1: Normal visuals
- Phase 2: Subtle orange tint overlay (pulsing)
- Phase 3: Red tint + pulsing edge glow

#### Audio
- Music: Dynamic, intensifies per phase
- SFX: shield break, laser charge, missile warnings, boss hit, explosion

#### Visual Effects
- Boss phase transitions with full animation (freeze, flash, text, particles)
- Directional threat indicators (pulsing arrows at screen edges)
- Impact particles on all hits
- Hit feedback on player damage
- Shield vulnerability animation
- Damage smoke trail

---

## CINEMATIC SYSTEM

### Engine: `cinematic.js`
Shared page-based system used by all cinematics:
- Typewriter text effect (25ms per character)
- Page-by-page advancement (SPACE/tap)
- Auto-advance option (timed pages)
- Skip with ESC/pause button
- Military terminal HUD overlay (grid lines, corner brackets, coordinates, timestamp)
- SPACE/TAP hint at bottom

### Per-Level Cinematics
Each has:
- Military terminal background (dark gradient + grid + scanlines)
- Operation title with 3D gold text
- Briefing text pages
- Transition to gameplay

### Micro-Animations (per cinematic)
- **All**: Animated scan line sweeping top-to-bottom (3-5s cycle)
- **IntroCinematic**: Pulsing grid, text flicker
- **BeirutIntro**: Status LEDs, CRT flicker, "CLASSIFIED" stamp bounce
- **DeepStrikeIntro**: Rotating radar sweep, blinking edge lights, typewriter coordinates
- **UndergroundIntro**: Red ambient glow pulse, static noise pixels
- **MountainBreakerIntro**: Twinkling stars, drifting crosshair, satellite zoom
- **LastStandIntro**: Dark red pulse, lightning flashes, dramatic boss reveal

### Victory Scene
- Fireworks, confetti, sunrise animation, clouds
- "Am Yisrael Chai" ending text
- Star rating based on performance

### Credits Scene
- Star Wars scrolling credits
- Animated sunset background
- Star of David graphic
- Cloud drift, sun glow pulse

---

## AUDIO SYSTEM

### Music (Procedural — Web Audio API)
Port `MusicManager.js` directly — it's engine-independent (pure Web Audio API oscillators, no Phaser dependency).

Tracks per level:
- Menu: Menu theme
- Level 1: Tense trance
- Level 2: Stealth ambient
- Level 3: Phase-specific (takeoff, flight, bombing, landing)
- Level 4: Phase-specific (city, command)
- Level 5: Phase-specific (takeoff, flight, bombing)
- Level 6: Dynamic, intensifies per boss phase
- Victory: Triumphant
- Credits: Menu theme reprise

### SFX (Synthesized — Web Audio API)
Port `SoundManager.js` directly — also engine-independent.

Key sounds: jump, land, shoot, explosion, bomb drop, bunker buster, hurt, step, typewriter click, radar blip, missile warning, chaff release, afterburner, jet engine, B2 engine, door open, victory, menu select, ambient wind, ambient industrial.

### Mobile Audio Unlock
BootScene requires a tap before any audio plays (Web Audio API restriction).

---

## MENU AND UX

### Menu Scene
- 90s arcade aesthetic: dark blue gradient, grid lines, scanlines, vignette
- Large Star of David (Magen David) symbol
- Pseudo-3D gold title "SUPERZION"
- 5 level buttons with lock state (levels unlock progressively)
- Level description panel on right side
- Preview panel per level
- Difficulty selector: NORMAL / HARD (bottom)
- Star ratings per level (from localStorage)
- Mute toggle (M key)

### Level Unlock System
- Level 1: Always unlocked
- Levels 2-5: Require completion of previous level
- Progress saved to `localStorage('superzion_level_progress')`
- Hard mode: Unlocked after completing all levels

### Difficulty System
- Normal: Default multipliers (1.0x)
- Hard: playerHP x0.6, enemySpeed x1.3, spawnRate x0.7, detection x1.5, timer x0.8, bossHP x1.4, missileSpeed x1.35

### End Screens
- Victory: Title, stats, star rating, Play Again / Next Level / Menu buttons
- Defeat: Dramatic red flash, typewriter title, wobble animation, Retry / Skip / Menu buttons
- All buttons: Keyboard shortcuts + tappable on mobile

---

## MOBILE CONTROLS

Use HTML/CSS overlay (DOM-based, engine-independent). This approach was proven to work regardless of camera zoom/scroll in the Phaser version.

### Presets per level type:
- **Platformer**: Left zone (25%) + Right zone (25%) + JUMP button + FIRE button
- **Bomberman**: D-pad (4 square buttons) + BOMB + DASH + ACT
- **Stealth**: D-pad + SCAN + RUN + ACT + DISTRACT
- **Aerial**: D-pad + BOMB + CHAFF
- **Drone**: D-pad (phase 1) -> D-pad + FIRE + MISSILE + DASH (boss phase)
- **Boss**: D-pad + FIRE + BOMB + ROLL + PULSE
- **Cinematic**: Tap anywhere to advance
- **Menu**: D-pad up/down + OK button

### Pause button: Always visible top-right corner.

---

## BUILD ORDER (Recommended Phases)

### Phase 1: Foundation (start here)
1. Create project, install Kaplay + Vite
2. Create `main.js` with Kaplay init
3. Port `texture-factory.js` (Canvas2D -> Kaplay sprite bridge)
4. Port `sound-manager.js` and `music-manager.js` (copy directly, they're engine-independent)
5. Create `game-juice.js` (screen effects)
6. Create `touch-controls.js` (DOM overlay — port from Phaser version)
7. Create boot scene with audio unlock
8. Create menu scene (basic — level list + start)
9. **TEST**: Verify everything loads and runs

### Phase 2: Level 1 Bomberman (proof of concept)
1. Port `level1-config.js` (grid layout, guard defs)
2. Create bomberman player entity
3. Create guard entity with patrol + chase AI
4. Create bomb entity with explosion mechanics
5. Create bomberman scene with grid, collisions, HUD
6. Add boss (Foam Beard)
7. Add victory/defeat screens
8. **TEST**: Full Level 1 bomberman gameplay on desktop AND mobile

### Phase 3: Level 1 Platformer
1. Create platformer player with jump physics
2. Create rooftop guard with alert AI
3. Build world (platforms, obstacles, background parallax)
4. Add shooting mechanics
5. Connect: platformer victory -> bomberman scene
6. **TEST**: Full Level 1 flow

### Phase 4: Cinematics Engine
1. Port cinematic page system
2. Create military terminal HUD helpers
3. Build intro cinematic (Level 1)
4. Build explosion cinematic
5. Build victory + credits scenes
6. Add micro-animations to all cinematics
7. **TEST**: Full Level 1 with all cinematics

### Phase 5: Level 2 Stealth
1. Port stealth mechanics (suspicion, vision cones, LOS blocking)
2. Create port environment (containers, guards, cameras, workers)
3. Add scanning/swap mechanics
4. Add minimap
5. Build Beirut intro cinematic
6. **TEST**: Full Level 2

### Phase 6: Level 3 Aerial (F-15)
1. Port flight physics
2. Create all 6 phases (takeoff -> landing)
3. Port SAM missile system + chaff
4. Build bunker with 5 layers + boss counter-attack
5. Add altimeter beep for landing
6. Build DeepStrike intro cinematic
7. **TEST**: Full Level 3

### Phase 7: Level 4 Drone + Boss
1. Port city navigation minigame
2. Port Sinwar boss fight (3 phases)
3. Add boss phase transitions
4. Build Underground intro cinematic
5. **TEST**: Full Level 4

### Phase 8: Level 5 B-2 Bomber
1. Port flight phase with parallax (sea, coast, land)
2. Port multi-pass bombing mechanic
3. Port mountain explosion sequence
4. Port escape phase
5. Build MountainBreaker intro cinematic
6. **TEST**: Full Level 5

### Phase 9: Level 6 Final Boss
1. Port approach phase
2. Port 3-phase boss fight (shield, rotating shield, laser)
3. Port barrel roll mechanic
4. Add progressive visual intensity
5. Add directional threat indicators
6. Build LastStand intro cinematic
7. **TEST**: Full Level 6

### Phase 10: Polish
1. Menu with full level unlock + difficulty + stars
2. Flight route scene (animated map between levels)
3. Cross-level stat tracking
4. Final testing on mobile
5. Deploy to Vercel

---

## REFERENCE

The original Phaser version is in `C:\Users\Seba\Desktop\ORL3\superzion\src\` — use it to extract:
- All game constants (speeds, sizes, HP values, cooldowns)
- Guard AI logic patterns
- Boss attack patterns and phase thresholds
- Procedural texture drawing code (Canvas 2D context calls)
- Music and sound synthesis code (Web Audio API)
- Cinematic text content and page sequences
- Level grid layouts and spawn points

**DO NOT** copy Phaser API calls — rewrite everything for Kaplay's API.
