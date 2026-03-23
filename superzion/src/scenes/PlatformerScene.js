// ===================================================================
// PlatformerScene -- Level 1 Phase 1: Tehran Rooftop Run
// Side-scrolling platformer where SuperZion jumps across rooftops
// at night, avoiding guards/obstacles, then enters target building
// to transition into Bomberman gameplay (GameScene).
// ===================================================================

import Phaser from 'phaser';
import { createPlatformerLevel1Textures } from '../utils/PlatformerLevel1Textures.js';
import SoundManager from '../systems/SoundManager.js';
import MusicManager from '../systems/MusicManager.js';
import { showControlsOverlay, showTutorialOverlay } from '../ui/ControlsOverlay.js';

const W = 960;
const H = 540;
const WORLD_WIDTH = 4800; // ~5 screens wide
const PLAYER_SPEED = 200;
const JUMP_VELOCITY = -420;
const COYOTE_TIME = 80;   // ms
const JUMP_BUFFER = 100;  // ms

// ===================================================================
// RooftopGuard -- inline guard class for platformer patrols
// ===================================================================
class RooftopGuard {
  constructor(scene, x, y, patrolRange) {
    this.scene = scene;
    this.sprite = scene.physics.add.sprite(x, y, 'plt_guard_walk_0');
    this.sprite.setDepth(9);
    this.sprite.setScale(1.6);
    // Body sized to match the visual at 1.6 scale — same proportions as player
    this.sprite.body.setSize(24, 44);
    this.sprite.body.setOffset(20, 16);

    // Ensure gravity is active so guard falls onto platform
    this.sprite.body.setAllowGravity(true);

    // Guards must collide with platforms
    scene.physics.add.collider(this.sprite, scene.platforms);

    // Patrol boundaries
    this.patrolMinX = x - patrolRange;
    this.patrolMaxX = x + patrolRange;
    this.dir = 1; // 1=right, -1=left
    this.speed = 50;

    // Walk animation
    this.walkFrame = 0;
    this.walkTimer = 0;

    // Overlap with player = damage
    scene.physics.add.overlap(scene.player, this.sprite, () => {
      scene._damagePlayer();
    });
  }

  update(delta) {
    // Only move when on ground -- NEVER float
    if (!this.sprite.body.blocked.down) return;

    // Patrol left/right
    this.sprite.body.setVelocityX(this.speed * this.dir);

    if (this.sprite.x >= this.patrolMaxX && this.dir > 0) {
      this.dir = -1;
    } else if (this.sprite.x <= this.patrolMinX && this.dir < 0) {
      this.dir = 1;
    }

    // Flip sprite based on direction
    this.sprite.setFlipX(this.dir < 0);

    // Walk animation: cycle plt_guard_walk_0..3 every 150ms
    this.walkTimer += delta;
    if (this.walkTimer > 150) {
      this.walkTimer = 0;
      this.walkFrame = (this.walkFrame + 1) % 4;
      this.sprite.setTexture(`plt_guard_walk_${this.walkFrame}`);
    }
  }
}

// ===================================================================
// PlatformerScene
// ===================================================================
export default class PlatformerScene extends Phaser.Scene {
  constructor() {
    super('PlatformerScene');
  }

  create() {
    // ── Background color (bright daytime sky) ──
    this.cameras.main.setBackgroundColor('#87CEEB');

    // ── Music (same as Bomberman phase for continuity) ──
    MusicManager.get().playLevel1Music();

    // ── Textures ──
    createPlatformerLevel1Textures(this);

    // ── Controls overlay ──
    this._controlsOverlay = showControlsOverlay(this, 'ARROWS: Move/Jump | ESC: Pause');

    // ── Physics world bounds (extended to accommodate ground at y=490) ──
    this.physics.world.setBounds(0, 0, WORLD_WIDTH, H + 60);

    // ── Camera bounds ──
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, H + 60);

    // ── Build world ──
    this._createBackground();
    this._createPlatforms();
    this._createPlayer();
    this._createObstacles();
    this._createGuards();
    this._createTarget();

    // ── Camera follow + zoom for larger player ──
    this.cameras.main.setZoom(1.2);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

    // ── Fade in ──
    this.cameras.main.fadeIn(500, 0, 0, 0);

    // ── Input ──
    this.cursors = this.input.keyboard.createCursorKeys();
    this.escKey = this.input.keyboard.addKey('ESC');
    this.rKey = this.input.keyboard.addKey('R');
    this.qKey = this.input.keyboard.addKey('Q');
    this.mKey = this.input.keyboard.addKey('M');
    this.pKey = this.input.keyboard.addKey('P');
    this.yKey = this.input.keyboard.addKey('Y');
    this.nKey = this.input.keyboard.addKey('N');

    // ── HP system ──
    this.hp = 3;
    this.maxHp = 3;
    this.invulnerable = false;
    this.invulnTimer = 0;

    // ── HUD: HP display ──
    this._createHUD();

    // ── Game state flags ──
    this.gameOver = false;
    this.transitioning = false;

    // ── Pause state ──
    this.isPaused = false;
    this.pauseObjects = [];

    // ── Skip level state ──
    this.skipConfirm = false;

    // ── Player animation state ──
    this.playerAnimState = 'idle';
    this.playerRunFrame = 0;
    this.playerRunTimer = 0;

    // ── Coyote/jump buffer ──
    this.lastOnGround = 0;
    this.jumpBufferTimer = 0;

    // ── Squash/stretch tracking ──
    this.wasAirborne = false;

    // ── Obstacle graphics ──
    this.obstacleGfx = this.add.graphics();
    this.obstacleGfx.setDepth(8);

    // ── Tutorial overlay (pauses gameplay until dismissed) ──
    showTutorialOverlay(this, [
      'LEVEL 1: OPERATION TEHRAN',
      '',
      'ARROWS: Move & Jump',
      'Reach the target building',
      'Then: SPACE to place bombs',
      'Find the KEY to unlock the exit',
      'Defeat FOAM BEARD',
    ]);
  }

  // ═══════════════════════════════════════════════════════════════
  // BACKGROUND -- 4-layer parallax
  // ═══════════════════════════════════════════════════════════════
  _createBackground() {
    // Sky: covers full screen (texture is 960x540)
    this.bgStars = this.add.tileSprite(WORLD_WIDTH / 2, H / 2, WORLD_WIDTH, H, 'plt_stars_sky')
      .setScrollFactor(0.02).setDepth(-10);

    // Mountains: horizon area, NOT overlapping platforms (texture is 960x240)
    this.bgMountains = this.add.tileSprite(WORLD_WIDTH / 2, 180, WORLD_WIDTH, 240, 'plt_mountains')
      .setScrollFactor(0.1).setDepth(-8);

    // Skyline: between mountains and platforms (texture is 960x250)
    this.bgSkyline = this.add.tileSprite(WORLD_WIDTH / 2, 240, WORLD_WIDTH, 250, 'plt_skyline')
      .setScrollFactor(0.3).setDepth(-6);

    // Near buildings: just above platform area (texture is 960x180)
    this.bgNear = this.add.tileSprite(WORLD_WIDTH / 2, 300, WORLD_WIDTH, 180, 'plt_near_buildings')
      .setScrollFactor(0.6).setDepth(-4);
  }

  // ═══════════════════════════════════════════════════════════════
  // PLATFORMS -- completable rooftop layout with rescue ladders
  // Physics: jump_h=98px, jump_d=187px. Safe gaps: <=70px vert, <=140px horiz.
  // ═══════════════════════════════════════════════════════════════
  _createPlatforms() {
    this.platforms = this.physics.add.staticGroup();

    // ── MAIN ROUTE PLATFORMS ──
    // Max height change between neighbours: 30-40px
    // Wide platforms (scaleX >= 2) serve as guard patrol areas
    const layout = [
      // === STARTING AREA (gentle intro) ===
      { x: 200,  y: 430, key: 'plt_roof_flat', scaleX: 4   },  // Wide starting street platform
      { x: 550,  y: 430, key: 'plt_roof_flat', scaleX: 2   },  // Continue at same height
      { x: 780,  y: 400, key: 'plt_roof_flat', scaleX: 1.5 },  // Slight step up (30px)

      // === FIRST CLIMB (gradual) ===
      { x: 1000, y: 370, key: 'plt_roof_flat', scaleX: 1.5 },  // Step up (30px)
      { x: 1200, y: 370, key: 'plt_roof_flat', scaleX: 2   },  // Same height, wide (guard patrol)
      { x: 1450, y: 340, key: 'plt_roof_flat', scaleX: 1.5 },  // Step up (30px)

      // === MID SECTION (mix of heights) ===
      { x: 1650, y: 370, key: 'plt_roof_flat', scaleX: 2   },  // Step DOWN (safe landing)
      { x: 1900, y: 340, key: 'plt_roof_flat', scaleX: 1.5 },  // Step up
      { x: 2100, y: 340, key: 'plt_roof_flat', scaleX: 2   },  // Same height, wide (guard)

      // === CHALLENGE SECTION (still fair) ===
      { x: 2350, y: 310, key: 'plt_roof_flat', scaleX: 1   },  // Step up (30px), narrow
      { x: 2550, y: 350, key: 'plt_roof_flat', scaleX: 1.5 },  // Step down (safe)
      { x: 2800, y: 320, key: 'plt_roof_flat', scaleX: 2   },  // Step up (30px)

      // === APPROACH TO TARGET ===
      { x: 3100, y: 350, key: 'plt_roof_flat', scaleX: 2   },  // Step down
      { x: 3400, y: 350, key: 'plt_roof_flat', scaleX: 2   },  // Same height, wide
      { x: 3700, y: 380, key: 'plt_roof_flat', scaleX: 2.5 },  // Step down (approach)

      // === TARGET BUILDING ===
      { x: 4100, y: 400, key: 'plt_roof_flat', scaleX: 3   },  // Wide target area
      { x: 4400, y: 400, key: 'plt_roof_flat', scaleX: 2   },  // Target building roof
    ];

    for (const def of layout) {
      const p = this.platforms.create(def.x, def.y, def.key);
      if (def.scaleX && def.scaleX !== 1) {
        p.setScale(def.scaleX, 1).refreshBody();
      }
      p.setDepth(5);
      p.setTint(0x888888);
    }

    // ── GROUND LEVEL (street level at y=490) ──
    // Continuous ground spanning full WORLD_WIDTH — safety net so player never dies
    const groundSegments = 10;
    const segWidth = WORLD_WIDTH / groundSegments;
    for (let i = 0; i < groundSegments; i++) {
      const gx = segWidth * i + segWidth / 2;
      const g = this.platforms.create(gx, 490, 'plt_roof_flat');
      g.setScale(segWidth / 128, 1).refreshBody();
      g.body.setSize(g.body.width, 16);           // thin floor surface
      g.body.setOffset(0, g.body.height / 2 - 8); // center vertically
      g.setDepth(5);
      g.setTint(0x999999); // Gray pavement
    }

    // ── Yellow/white street marking lines on ground level ──
    const streetLine = this.add.graphics().setDepth(6);
    // Dashed yellow center line
    streetLine.lineStyle(2, 0xFFDD44, 0.7);
    for (let sx = 0; sx < WORLD_WIDTH; sx += 40) {
      streetLine.beginPath();
      streetLine.moveTo(sx, 484);
      streetLine.lineTo(sx + 20, 484);
      streetLine.strokePath();
    }
    // White edge lines
    streetLine.lineStyle(1.5, 0xFFFFFF, 0.5);
    streetLine.beginPath();
    streetLine.moveTo(0, 478);
    streetLine.lineTo(WORLD_WIDTH, 478);
    streetLine.strokePath();

    // ── RESCUE PLATFORMS (stepping stones from ground back to main route) ──
    // Placed every ~400px so player can always climb back from y=490
    const rescuePoints = [
      { x: 400,  steps: [{ y: 460, sx: 0.8 }, { y: 435, sx: 0.6 }] },
      { x: 900,  steps: [{ y: 460, sx: 0.8 }, { y: 430, sx: 0.6 }] },
      { x: 1400, steps: [{ y: 460, sx: 0.8 }, { y: 430, sx: 0.6 }, { y: 400, sx: 0.5 }] },
      { x: 1850, steps: [{ y: 460, sx: 0.8 }, { y: 430, sx: 0.6 }] },
      { x: 2400, steps: [{ y: 460, sx: 0.8 }, { y: 430, sx: 0.6 }, { y: 395, sx: 0.5 }] },
      { x: 2900, steps: [{ y: 460, sx: 0.8 }, { y: 430, sx: 0.6 }] },
      { x: 3500, steps: [{ y: 460, sx: 0.8 }, { y: 430, sx: 0.6 }] },
      { x: 4000, steps: [{ y: 460, sx: 0.8 }, { y: 435, sx: 0.6 }] },
    ];

    for (const rp of rescuePoints) {
      for (const step of rp.steps) {
        const sp = this.platforms.create(rp.x, step.y, 'plt_roof_flat');
        sp.setScale(step.sx, 1).refreshBody();
        sp.body.setSize(sp.body.width, 16);           // thin floor surface
        sp.body.setOffset(0, sp.body.height / 2 - 8); // center vertically
        sp.setDepth(5);
        sp.setTint(0xaaaaaa); // Slightly lighter gray rescue platforms
      }
    }

    // ── VISUAL TOP-EDGE HIGHLIGHT on each non-ground platform ──
    for (const p of this.platforms.getChildren()) {
      if (p.y < 480) {
        const edge = this.add.rectangle(
          p.x, p.y - p.displayHeight / 2,
          p.displayWidth, 2, 0xbbbbaa, 0.8
        );
        edge.setDepth(6);
      }
    }

    // No kill zone — player lands on street level and climbs back up
  }

  // ═══════════════════════════════════════════════════════════════
  // PLAYER
  // ═══════════════════════════════════════════════════════════════
  _createPlayer() {
    this.player = this.physics.add.sprite(200, 350, 'plt_player_idle');
    this.player.setCollideWorldBounds(true);
    this.player.setDepth(10);
    this.player.setScale(1.6);
    // Body sized to match the actual sprite art (64x64 canvas, character ~24x44)
    // At 1.6 scale the physics body becomes ~38x70 which fits the visible character
    this.player.body.setSize(24, 44);
    this.player.body.setOffset(20, 16);

    // Collide with platforms
    this.physics.add.collider(this.player, this.platforms);
  }

  // ═══════════════════════════════════════════════════════════════
  // OBSTACLES -- cameras, searchlights, electric wires
  // ═══════════════════════════════════════════════════════════════
  _createObstacles() {
    // Security cameras: mount above platforms, sweep with vision cones
    // Positioned relative to the new platform layout
    this.secCameras = [
      // Near platform x=780 y=400 — camera above it
      { x: 850,  y: 355, angleMin: 0.8, angleMax: 2.2, speed: 0.6, length: 120, halfAngle: 0.3 },
      // Near platform x=1900 y=340 — camera above it
      { x: 1950, y: 300, angleMin: 0.5, angleMax: 2.0, speed: 0.5, length: 140, halfAngle: 0.35 },
      // Near platform x=3100 y=350 — camera above it
      { x: 3150, y: 310, angleMin: 0.6, angleMax: 2.1, speed: 0.7, length: 130, halfAngle: 0.3 },
    ];
    for (const cam of this.secCameras) {
      cam.currentAngle = cam.angleMin;
      cam.sweepDir = 1;
      cam.sprite = this.add.image(cam.x, cam.y, 'plt_camera').setDepth(8);
    }

    // Searchlights: ground-mounted, larger + slower sweep
    this.searchlights = [
      // Between first climb and mid section
      { x: 1450, y: 340, angleMin: -0.6, angleMax: 0.6, speed: 0.4, length: 180, halfAngle: 0.4 },
      // In approach-to-target area
      { x: 2800, y: 320, angleMin: -0.5, angleMax: 0.5, speed: 0.35, length: 200, halfAngle: 0.45 },
    ];
    for (const sl of this.searchlights) {
      sl.currentAngle = sl.angleMin;
      sl.sweepDir = 1;
      sl.sprite = this.add.image(sl.x, sl.y, 'plt_searchlight_base').setDepth(8);
    }

    // Electric wires: horizontal hazard, flash on/off
    // Positioned between platforms where the player must pass through
    this.wires = [
      // Between platforms at x=1000(y=370) and x=1200(y=370)
      { x: 1100, y: 355, width: 100, onTime: 1000, offTime: 1000, timer: 0, isOn: true },
      // Between challenge platforms at x=2350(y=310) and x=2550(y=350)
      { x: 2450, y: 330, width: 80,  onTime: 800,  offTime: 1200, timer: 0, isOn: true },
      // Between approach platforms at x=3400(y=350) and x=3700(y=380)
      { x: 3550, y: 365, width: 100, onTime: 1000, offTime: 1000, timer: 0, isOn: true },
    ];
    for (const w of this.wires) {
      w.sprite = this.add.image(w.x, w.y, 'plt_electric_wire').setDepth(8);
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // GUARDS -- patrolling on platforms
  // ═══════════════════════════════════════════════════════════════
  _createGuards() {
    this.guards = [];
    // Guard Y = platform_y - 25 (places feet near platform surface).
    // Gravity pulls them onto the platform on first frame.

    // Guard 1: wide platform at x=1200, y=370 -> guard y=345, patrol range=100
    this.guards.push(new RooftopGuard(this, 1200, 345, 100));
    // Guard 2: wide platform at x=2100, y=340 -> guard y=315, patrol range=80
    this.guards.push(new RooftopGuard(this, 2100, 315, 80));
    // Guard 3: target area at x=4100, y=400 -> guard y=375, patrol range=120
    this.guards.push(new RooftopGuard(this, 4100, 375, 120));
  }

  // ═══════════════════════════════════════════════════════════════
  // TARGET -- building at end of level
  // ═══════════════════════════════════════════════════════════════
  _createTarget() {
    // Target building visual — positioned on the target platform at x=4500
    this.targetBuilding = this.add.image(4500, 320, 'plt_target_building').setDepth(5);

    // Golden glow/pulse around window area
    this.targetGlow = this.add.rectangle(4500, 300, 70, 70, 0xffd700, 0.15).setDepth(4);
    this.tweens.add({
      targets: this.targetGlow,
      alpha: 0.35,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Overlap trigger zone at window
    this.targetZone = this.add.zone(4500, 300, 60, 60);
    this.physics.add.existing(this.targetZone, true);
    this.physics.add.overlap(this.player, this.targetZone, () => {
      this._enterBuilding();
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // HUD
  // ═══════════════════════════════════════════════════════════════
  _createHUD() {
    this.hudText = this.add.text(15, 12, '', {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#ff4444',
      fontStyle: 'bold',
      shadow: { offsetX: 0, offsetY: 0, color: '#ff0000', blur: 4, fill: true },
    }).setScrollFactor(0).setDepth(30);

    this._updateHUD();
  }

  _updateHUD() {
    let hearts = '';
    for (let i = 0; i < this.maxHp; i++) {
      hearts += i < this.hp ? '\u2665 ' : '\u2661 ';
    }
    this.hudText.setText(hearts.trim());
  }

  // ═══════════════════════════════════════════════════════════════
  // ENTER BUILDING -- transition to Bomberman (LVL1-06)
  // ═══════════════════════════════════════════════════════════════
  _enterBuilding() {
    if (this.transitioning) return;
    this.transitioning = true;
    this.player.body.setVelocity(0, 0);
    this.player.body.setAllowGravity(false);

    // Visual: zoom into window + fade
    this.cameras.main.zoomTo(2.5, 800, 'Power2');
    this.cameras.main.fadeOut(800, 0, 0, 0);

    // Sound: dramatic entry
    SoundManager.get().playExplosion();

    // Save checkpoint: player reached the bomberman phase
    try { localStorage.setItem('superzion_checkpoint_l1', 'bomberman'); } catch (e) { /* ignore */ }

    this.time.delayedCall(1000, () => {
      this.scene.start('GameScene');
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // DAMAGE / DEATH
  // ═══════════════════════════════════════════════════════════════
  _damagePlayer() {
    if (this.invulnerable || this.hp <= 0 || this.gameOver || this.transitioning) return;

    this.hp--;
    this.invulnerable = true;
    this.invulnTimer = 1500; // 1.5s

    // Flash red
    this.player.setTint(0xff0000);
    this.time.delayedCall(100, () => {
      if (this.player && this.player.active) this.player.clearTint();
    });

    // Camera shake
    this.cameras.main.shake(200, 0.005);

    // Sound
    SoundManager.get().playHurt();

    // Blink effect
    this.tweens.add({
      targets: this.player,
      alpha: 0.3,
      duration: 100,
      yoyo: true,
      repeat: 7,
    });

    this._updateHUD();

    if (this.hp <= 0) {
      this._playerDeath();
    }
  }

  _playerDeath() {
    if (this.gameOver) return;
    this.gameOver = true;

    this.player.body.setVelocity(0, -200);
    this.player.body.setAllowGravity(true);

    // MISSION FAILED text
    const failText = this.add.text(W / 2, H / 2 - 40, 'MISSION FAILED', {
      fontFamily: 'monospace',
      fontSize: '36px',
      color: '#ff4444',
      fontStyle: 'bold',
      shadow: { offsetX: 0, offsetY: 0, color: '#ff4444', blur: 16, fill: true },
    }).setOrigin(0.5).setScrollFactor(0).setDepth(50).setAlpha(0);

    this.tweens.add({ targets: failText, alpha: 1, duration: 400 });

    SoundManager.get().playDeath();
    this.cameras.main.shake(300, 0.01);

    // Restart after delay
    this.time.delayedCall(1500, () => {
      this.scene.restart();
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // PAUSE SYSTEM
  // ═══════════════════════════════════════════════════════════════
  _togglePause() {
    this.isPaused = !this.isPaused;
    if (this.isPaused) {
      this.physics.pause();

      const overlay = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.6)
        .setScrollFactor(0).setDepth(60);
      this.pauseObjects.push(overlay);

      const title = this.add.text(W / 2, H / 2 - 40, 'PAUSED', {
        fontFamily: 'monospace', fontSize: '36px', color: '#ffffff',
      }).setOrigin(0.5).setScrollFactor(0).setDepth(61);
      this.pauseObjects.push(title);

      const opts = this.add.text(W / 2, H / 2 + 10, 'ESC: Resume | R: Restart | M: Mute', {
        fontFamily: 'monospace', fontSize: '14px', color: '#aaaaaa',
      }).setOrigin(0.5).setScrollFactor(0).setDepth(61);
      this.pauseObjects.push(opts);
    } else {
      this.physics.resume();
      for (const obj of this.pauseObjects) obj.destroy();
      this.pauseObjects = [];
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // OBSTACLE UPDATE HELPERS
  // ═══════════════════════════════════════════════════════════════
  _pointInTriangle(px, py, ax, ay, bx, by, cx, cy) {
    const d1 = (px - bx) * (ay - by) - (ax - bx) * (py - by);
    const d2 = (px - cx) * (by - cy) - (bx - cx) * (py - cy);
    const d3 = (px - ax) * (cy - ay) - (cx - ax) * (py - ay);
    const hasNeg = (d1 < 0) || (d2 < 0) || (d3 < 0);
    const hasPos = (d1 > 0) || (d2 > 0) || (d3 > 0);
    return !(hasNeg && hasPos);
  }

  _updateSecurityCameras(dt) {
    const px = this.player.x;
    const py = this.player.y;

    for (const cam of this.secCameras) {
      // Sweep angle
      cam.currentAngle += cam.speed * cam.sweepDir * dt;
      if (cam.currentAngle >= cam.angleMax) {
        cam.currentAngle = cam.angleMax;
        cam.sweepDir = -1;
      } else if (cam.currentAngle <= cam.angleMin) {
        cam.currentAngle = cam.angleMin;
        cam.sweepDir = 1;
      }

      // Vision cone triangle
      const ax = cam.x;
      const ay = cam.y;
      const bx = cam.x + Math.cos(cam.currentAngle - cam.halfAngle) * cam.length;
      const by = cam.y + Math.sin(cam.currentAngle - cam.halfAngle) * cam.length;
      const cx = cam.x + Math.cos(cam.currentAngle + cam.halfAngle) * cam.length;
      const cy = cam.y + Math.sin(cam.currentAngle + cam.halfAngle) * cam.length;

      // Draw cone (red for cameras)
      this.obstacleGfx.fillStyle(0xff2222, 0.12);
      this.obstacleGfx.beginPath();
      this.obstacleGfx.moveTo(ax, ay);
      this.obstacleGfx.lineTo(bx, by);
      this.obstacleGfx.lineTo(cx, cy);
      this.obstacleGfx.closePath();
      this.obstacleGfx.fillPath();

      this.obstacleGfx.lineStyle(1, 0xff2222, 0.25);
      this.obstacleGfx.beginPath();
      this.obstacleGfx.moveTo(ax, ay);
      this.obstacleGfx.lineTo(bx, by);
      this.obstacleGfx.moveTo(ax, ay);
      this.obstacleGfx.lineTo(cx, cy);
      this.obstacleGfx.strokePath();

      // Player overlap check
      if (this._pointInTriangle(px, py, ax, ay, bx, by, cx, cy)) {
        this._damagePlayer();
      }
    }
  }

  _updateSearchlights(dt) {
    const px = this.player.x;
    const py = this.player.y;

    for (const sl of this.searchlights) {
      // Sweep angle
      sl.currentAngle += sl.speed * sl.sweepDir * dt;
      if (sl.currentAngle >= sl.angleMax) {
        sl.currentAngle = sl.angleMax;
        sl.sweepDir = -1;
      } else if (sl.currentAngle <= sl.angleMin) {
        sl.currentAngle = sl.angleMin;
        sl.sweepDir = 1;
      }

      // Searchlight points downward: base angle = PI/2 + sweep offset
      const baseAngle = Math.PI / 2 + sl.currentAngle;
      const ax = sl.x;
      const ay = sl.y;
      const bx = sl.x + Math.cos(baseAngle - sl.halfAngle) * sl.length;
      const by = sl.y + Math.sin(baseAngle - sl.halfAngle) * sl.length;
      const cx = sl.x + Math.cos(baseAngle + sl.halfAngle) * sl.length;
      const cy = sl.y + Math.sin(baseAngle + sl.halfAngle) * sl.length;

      // Draw cone (yellow for searchlights)
      this.obstacleGfx.fillStyle(0xffff44, 0.12);
      this.obstacleGfx.beginPath();
      this.obstacleGfx.moveTo(ax, ay);
      this.obstacleGfx.lineTo(bx, by);
      this.obstacleGfx.lineTo(cx, cy);
      this.obstacleGfx.closePath();
      this.obstacleGfx.fillPath();

      this.obstacleGfx.lineStyle(1, 0xffff44, 0.3);
      this.obstacleGfx.beginPath();
      this.obstacleGfx.moveTo(ax, ay);
      this.obstacleGfx.lineTo(bx, by);
      this.obstacleGfx.moveTo(ax, ay);
      this.obstacleGfx.lineTo(cx, cy);
      this.obstacleGfx.strokePath();

      // Player overlap check
      if (this._pointInTriangle(px, py, ax, ay, bx, by, cx, cy)) {
        this._damagePlayer();
      }
    }
  }

  _updateElectricWires(delta) {
    const px = this.player.x;
    const py = this.player.y;

    for (const w of this.wires) {
      // Timer toggle
      w.timer += delta;
      if (w.isOn && w.timer >= w.onTime) {
        w.isOn = false;
        w.timer = 0;
      } else if (!w.isOn && w.timer >= w.offTime) {
        w.isOn = true;
        w.timer = 0;
      }

      if (w.isOn) {
        // Draw active wire (bright electric blue)
        const halfW = w.width / 2;
        this.obstacleGfx.lineStyle(4, 0x44aaff, 0.7);
        this.obstacleGfx.beginPath();
        this.obstacleGfx.moveTo(w.x - halfW, w.y);
        this.obstacleGfx.lineTo(w.x + halfW, w.y);
        this.obstacleGfx.strokePath();

        // Glow
        this.obstacleGfx.lineStyle(10, 0x44aaff, 0.15);
        this.obstacleGfx.beginPath();
        this.obstacleGfx.moveTo(w.x - halfW, w.y);
        this.obstacleGfx.lineTo(w.x + halfW, w.y);
        this.obstacleGfx.strokePath();

        // Sparks (random jagged lines)
        if (Math.random() < 0.3) {
          const sx = w.x - halfW + Math.random() * w.width;
          const sy = w.y + (Math.random() - 0.5) * 10;
          this.obstacleGfx.lineStyle(1, 0xffffff, 0.8);
          this.obstacleGfx.beginPath();
          this.obstacleGfx.moveTo(sx, sy);
          this.obstacleGfx.lineTo(sx + (Math.random() - 0.5) * 8, sy + (Math.random() - 0.5) * 12);
          this.obstacleGfx.strokePath();
        }

        // Player overlap check (rectangle)
        if (px > w.x - halfW - 15 && px < w.x + halfW + 15 &&
            py > w.y - 20 && py < w.y + 20) {
          this._damagePlayer();
        }

        // Wire sprite visible
        if (w.sprite) w.sprite.setAlpha(1);
      } else {
        // Draw inactive wire (dim)
        const halfW = w.width / 2;
        this.obstacleGfx.lineStyle(2, 0x888888, 0.3);
        this.obstacleGfx.beginPath();
        this.obstacleGfx.moveTo(w.x - halfW, w.y);
        this.obstacleGfx.lineTo(w.x + halfW, w.y);
        this.obstacleGfx.strokePath();

        if (w.sprite) w.sprite.setAlpha(0.3);
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // MAIN UPDATE LOOP
  // ═══════════════════════════════════════════════════════════════
  update(time, delta) {
    // ── Tutorial active: skip all gameplay ──
    if (this.tutorialActive) return;

    // ── Mute toggle ──
    if (Phaser.Input.Keyboard.JustDown(this.mKey)) {
      const muted = SoundManager.get().toggleMute();
      MusicManager.get().setMuted(muted);
    }

    // ── Skip level (P key) ──
    if (Phaser.Input.Keyboard.JustDown(this.pKey)) {
      if (!this.skipConfirm && !this.gameOver && !this.transitioning) {
        this.skipConfirm = true;
        this.skipText = this.add.text(W / 2, H / 2, 'SKIP LEVEL? Y/N', {
          fontFamily: 'monospace', fontSize: '24px', color: '#ffcc00',
          shadow: { offsetX: 0, offsetY: 0, color: '#ffcc00', blur: 8, fill: true },
        }).setOrigin(0.5).setScrollFactor(0).setDepth(100);
      }
    }
    if (this.skipConfirm) {
      if (Phaser.Input.Keyboard.JustDown(this.yKey)) {
        // Skip to GameScene (Bomberman phase)
        this.skipConfirm = false;
        if (this.skipText) this.skipText.destroy();
        this.cameras.main.fadeOut(400, 0, 0, 0);
        this.time.delayedCall(500, () => {
          this.scene.start('GameScene');
        });
        return;
      }
      if (Phaser.Input.Keyboard.JustDown(this.nKey)) {
        this.skipConfirm = false;
        if (this.skipText) this.skipText.destroy();
      }
    }

    // ── Pause toggle ──
    if (Phaser.Input.Keyboard.JustDown(this.escKey)) {
      if (!this.gameOver && !this.transitioning) {
        this._togglePause();
      }
      return;
    }

    // ── Pause state: handle pause-specific input ──
    if (this.isPaused) {
      if (Phaser.Input.Keyboard.JustDown(this.rKey)) {
        this.physics.resume();
        this.scene.restart();
      }
      return;
    }

    // ── Early exit if game is over or transitioning ──
    if (this.gameOver || this.transitioning) return;

    const dt = delta / 1000;

    // ── Player input handling ──
    const onGround = this.player.body.blocked.down;

    // Track coyote time
    if (onGround) {
      this.lastOnGround = time;
    }

    // Left/right movement
    if (this.cursors.left.isDown) {
      this.player.body.setVelocityX(-PLAYER_SPEED);
      this.player.setFlipX(true);
    } else if (this.cursors.right.isDown) {
      this.player.body.setVelocityX(PLAYER_SPEED);
      this.player.setFlipX(false);
    } else {
      this.player.body.setVelocityX(0);
    }

    // Jump handling with coyote time and jump buffer
    const canCoyoteJump = (time - this.lastOnGround) < COYOTE_TIME;
    const wantsJump = Phaser.Input.Keyboard.JustDown(this.cursors.up);

    if (wantsJump) {
      this.jumpBufferTimer = time;
    }

    const hasBufferedJump = (time - this.jumpBufferTimer) < JUMP_BUFFER;

    if (wantsJump && (onGround || canCoyoteJump)) {
      this.player.body.setVelocityY(JUMP_VELOCITY);
      SoundManager.get().playJump();
      this.lastOnGround = 0; // consume coyote time
      // Stretch on jump
      this.tweens.add({
        targets: this.player,
        scaleX: 0.85 * 0.8,
        scaleY: 1.15 * 0.8,
        duration: 100,
        yoyo: true,
        ease: 'Quad.easeOut',
        onComplete: () => {
          if (this.player && this.player.active) this.player.setScale(0.8);
        },
      });
    } else if (onGround && hasBufferedJump && this.jumpBufferTimer > 0) {
      this.player.body.setVelocityY(JUMP_VELOCITY);
      SoundManager.get().playJump();
      this.jumpBufferTimer = 0; // consume buffer
      // Stretch on jump
      this.tweens.add({
        targets: this.player,
        scaleX: 0.85 * 0.8,
        scaleY: 1.15 * 0.8,
        duration: 100,
        yoyo: true,
        ease: 'Quad.easeOut',
        onComplete: () => {
          if (this.player && this.player.active) this.player.setScale(0.8);
        },
      });
    }

    // Landing sound + squash effect
    if (onGround && this.wasAirborne) {
      SoundManager.get().playLand();
      // Squash on landing
      this.tweens.add({
        targets: this.player,
        scaleX: 1.2 * 0.8,
        scaleY: 0.8 * 0.8,
        duration: 80,
        yoyo: true,
        ease: 'Quad.easeOut',
        onComplete: () => {
          if (this.player && this.player.active) {
            this.player.setScale(0.8);
          }
        },
      });
    }
    this.wasAirborne = !onGround;

    // ── Player animation ──
    if (!onGround) {
      // In air
      this.player.setTexture('plt_player_jump');
      this.playerAnimState = 'jump';
    } else if (this.cursors.left.isDown || this.cursors.right.isDown) {
      // On ground + moving: cycle run frames
      this.playerRunTimer += delta;
      if (this.playerRunTimer > 120) {
        this.playerRunTimer = 0;
        this.playerRunFrame = (this.playerRunFrame + 1) % 4;
      }
      this.player.setTexture(`plt_player_run_${this.playerRunFrame}`);
      this.playerAnimState = 'run';
    } else {
      // On ground + still
      this.player.setTexture('plt_player_idle');
      this.playerAnimState = 'idle';
      this.playerRunFrame = 0;
      this.playerRunTimer = 0;
    }

    // ── Guard updates ──
    for (const g of this.guards) {
      g.update(delta);
    }

    // ── Obstacle updates ──
    this.obstacleGfx.clear();
    this._updateSecurityCameras(dt);
    this._updateSearchlights(dt);
    this._updateElectricWires(delta); // uses ms for timer

    // ── Invulnerability timer ──
    if (this.invulnerable) {
      this.invulnTimer -= delta;
      if (this.invulnTimer <= 0) {
        this.invulnerable = false;
        this.player.setAlpha(1);
        this.player.clearTint();
      }
    }

    // ── HUD update ──
    this._updateHUD();
  }

  // ── Cleanup on scene shutdown ──
  shutdown() {
    if (this._controlsOverlay) {
      try { this._controlsOverlay.destroy(); } catch (e) { /* ok */ }
    }
    this.tweens.killAll();
    this.time.removeAllEvents();
  }
}
