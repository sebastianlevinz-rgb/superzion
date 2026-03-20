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
import { showControlsOverlay } from '../ui/ControlsOverlay.js';

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
    this.sprite.setScale(0.8);
    this.sprite.body.setSize(24, 52);
    this.sprite.body.setOffset(20, 12);

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

    // LVL1-05: Verify guard spawn position
    console.log(`Guard spawned at y=${y}, will land on platform (gravity-based collision)`);
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
    // ── Background color (deep night) ──
    this.cameras.main.setBackgroundColor('#0a0a1a');

    // ── Music (same as Bomberman phase for continuity) ──
    MusicManager.get().playLevel1Music();

    // ── Textures ──
    createPlatformerLevel1Textures(this);

    // ── Controls overlay ──
    this._controlsOverlay = showControlsOverlay(this, 'ARROWS: Move/Jump | ESC: Pause');

    // ── Physics world bounds ──
    this.physics.world.setBounds(0, 0, WORLD_WIDTH, H);

    // ── Camera bounds ──
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, H);

    // ── Build world ──
    this._createBackground();
    this._createPlatforms();
    this._createPlayer();
    this._createObstacles();
    this._createGuards();
    this._createTarget();

    // ── Camera follow ──
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

    // ── Fade in ──
    this.cameras.main.fadeIn(500, 0, 0, 0);

    // ── Input ──
    this.cursors = this.input.keyboard.createCursorKeys();
    this.escKey = this.input.keyboard.addKey('ESC');
    this.rKey = this.input.keyboard.addKey('R');
    this.qKey = this.input.keyboard.addKey('Q');
    this.mKey = this.input.keyboard.addKey('M');

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

    // ── Player animation state ──
    this.playerAnimState = 'idle';
    this.playerRunFrame = 0;
    this.playerRunTimer = 0;

    // ── Coyote/jump buffer ──
    this.lastOnGround = 0;
    this.jumpBufferTimer = 0;

    // ── Obstacle graphics ──
    this.obstacleGfx = this.add.graphics();
    this.obstacleGfx.setDepth(8);
  }

  // ═══════════════════════════════════════════════════════════════
  // BACKGROUND -- 4-layer parallax
  // ═══════════════════════════════════════════════════════════════
  _createBackground() {
    // Layer 0: Stars + moon (barely moves)
    this.bgStars = this.add.tileSprite(WORLD_WIDTH / 2, H / 2, WORLD_WIDTH, H, 'plt_stars_sky')
      .setScrollFactor(0.02).setDepth(-10);

    // Layer 1: Alborz mountains
    this.bgMountains = this.add.tileSprite(WORLD_WIDTH / 2, H - 120, WORLD_WIDTH, 240, 'plt_mountains')
      .setScrollFactor(0.1).setDepth(-8);

    // Layer 2: Tehran skyline (towers)
    this.bgSkyline = this.add.tileSprite(WORLD_WIDTH / 2, H - 80, WORLD_WIDTH, 200, 'plt_skyline')
      .setScrollFactor(0.3).setDepth(-6);

    // Layer 3: Near buildings
    this.bgNear = this.add.tileSprite(WORLD_WIDTH / 2, H - 40, WORLD_WIDTH, 160, 'plt_near_buildings')
      .setScrollFactor(0.6).setDepth(-4);
  }

  // ═══════════════════════════════════════════════════════════════
  // PLATFORMS -- 12 rooftop platforms
  // ═══════════════════════════════════════════════════════════════
  _createPlatforms() {
    this.platforms = this.physics.add.staticGroup();

    const layout = [
      { x: 200,  y: 420, key: 'plt_roof_flat',    scaleX: 3 },     // Starting rooftop (wide)
      { x: 650,  y: 390, key: 'plt_roof_balcony',  scaleX: 1 },    // First jump
      { x: 950,  y: 360, key: 'plt_roof_flat',    scaleX: 1.5 },   // Building
      { x: 1300, y: 330, key: 'plt_roof_dome',    scaleX: 1 },     // Mosque dome
      { x: 1650, y: 370, key: 'plt_roof_flat',    scaleX: 2.5 },   // Long building (guard)
      { x: 2050, y: 340, key: 'plt_roof_cornice', scaleX: 1 },     // Narrow ledge
      { x: 2350, y: 310, key: 'plt_roof_balcony', scaleX: 1 },     // Higher balcony
      { x: 2650, y: 350, key: 'plt_roof_flat',    scaleX: 2 },     // Building (guard)
      { x: 3050, y: 320, key: 'plt_roof_cornice', scaleX: 1 },     // Narrow approach
      { x: 3350, y: 290, key: 'plt_roof_flat',    scaleX: 1.5 },   // High building
      { x: 3700, y: 350, key: 'plt_roof_flat',    scaleX: 2 },     // Pre-target
      { x: 4200, y: 380, key: 'plt_roof_flat',    scaleX: 3 },     // Target building roof (wide)
    ];

    for (const def of layout) {
      const p = this.platforms.create(def.x, def.y, def.key);
      if (def.scaleX && def.scaleX !== 1) {
        p.setScale(def.scaleX, 1).refreshBody();
      }
      p.setDepth(5);
    }

    // Kill zone below the lowest platform -- falling off = death
    this.killZone = this.add.zone(WORLD_WIDTH / 2, H + 20, WORLD_WIDTH, 40);
    this.physics.add.existing(this.killZone, true);
  }

  // ═══════════════════════════════════════════════════════════════
  // PLAYER
  // ═══════════════════════════════════════════════════════════════
  _createPlayer() {
    this.player = this.physics.add.sprite(200, 350, 'plt_player_idle');
    this.player.setCollideWorldBounds(true);
    this.player.body.setSize(28, 52);
    this.player.body.setOffset(18, 12);
    this.player.setDepth(10);
    this.player.setScale(0.8);

    // Collide with platforms
    this.physics.add.collider(this.player, this.platforms);

    // Kill zone overlap
    this.physics.add.overlap(this.player, this.killZone, () => {
      this._playerDeath();
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // OBSTACLES -- cameras, searchlights, electric wires
  // ═══════════════════════════════════════════════════════════════
  _createObstacles() {
    // Security cameras: mount on buildings, sweep with vision cones
    this.secCameras = [
      { x: 900,  y: 320, angleMin: 0.8, angleMax: 2.2, speed: 0.6, length: 120, halfAngle: 0.3 },
      { x: 1900, y: 300, angleMin: 0.5, angleMax: 2.0, speed: 0.5, length: 140, halfAngle: 0.35 },
      { x: 3200, y: 260, angleMin: 0.6, angleMax: 2.1, speed: 0.7, length: 130, halfAngle: 0.3 },
    ];
    for (const cam of this.secCameras) {
      cam.currentAngle = cam.angleMin;
      cam.sweepDir = 1;
      cam.sprite = this.add.image(cam.x, cam.y, 'plt_camera').setDepth(8);
    }

    // Searchlights: ground-mounted, larger + slower sweep
    this.searchlights = [
      { x: 1500, y: 370, angleMin: -0.6, angleMax: 0.6, speed: 0.4, length: 180, halfAngle: 0.4 },
      { x: 2900, y: 350, angleMin: -0.5, angleMax: 0.5, speed: 0.35, length: 200, halfAngle: 0.45 },
    ];
    for (const sl of this.searchlights) {
      sl.currentAngle = sl.angleMin;
      sl.sweepDir = 1;
      sl.sprite = this.add.image(sl.x, sl.y, 'plt_searchlight_base').setDepth(8);
    }

    // Electric wires: horizontal hazard, flash on/off
    this.wires = [
      { x: 1150, y: 345, width: 100, onTime: 1000, offTime: 1000, timer: 0, isOn: true },
      { x: 2500, y: 325, width: 80,  onTime: 800,  offTime: 1200, timer: 0, isOn: true },
      { x: 3500, y: 300, width: 100, onTime: 1000, offTime: 1000, timer: 0, isOn: true },
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
    // Guard 1: patrols the long building at y=370
    this.guards.push(new RooftopGuard(this, 1600, 338, 100));
    // Guard 2: patrols the building at y=350
    this.guards.push(new RooftopGuard(this, 2600, 318, 80));
    // Guard 3: patrols pre-target area
    this.guards.push(new RooftopGuard(this, 4100, 348, 120));
  }

  // ═══════════════════════════════════════════════════════════════
  // TARGET -- building at end of level
  // ═══════════════════════════════════════════════════════════════
  _createTarget() {
    // Target building visual
    this.targetBuilding = this.add.image(4400, 300, 'plt_target_building').setDepth(5);

    // Golden glow/pulse around window area
    this.targetGlow = this.add.rectangle(4400, 280, 70, 70, 0xffd700, 0.15).setDepth(4);
    this.tweens.add({
      targets: this.targetGlow,
      alpha: 0.35,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Overlap trigger zone at window
    this.targetZone = this.add.zone(4400, 280, 60, 60);
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

    SoundManager.get().playHurt();
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
    // ── Mute toggle ──
    if (Phaser.Input.Keyboard.JustDown(this.mKey)) {
      const muted = SoundManager.get().toggleMute();
      MusicManager.get().setMuted(muted);
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
    } else if (onGround && hasBufferedJump && this.jumpBufferTimer > 0) {
      this.player.body.setVelocityY(JUMP_VELOCITY);
      SoundManager.get().playJump();
      this.jumpBufferTimer = 0; // consume buffer
    }

    // Landing sound
    if (onGround && this.playerAnimState === 'jump') {
      SoundManager.get().playLand();
    }

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

    // ── Kill zone check (fallback) ──
    if (this.player.y > H) {
      this._playerDeath();
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
