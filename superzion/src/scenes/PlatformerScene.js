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
const WORLD_WIDTH = 1600; // short warm-up level (~1.5 screens)
// Player scale is 1 (no scaling needed)
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
    this.sprite.setScale(1);  // default scale — no body mismatch

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

    // ── Physics world bounds — hard floor at street level (y=490) ──
    this.physics.world.setBounds(0, 0, WORLD_WIDTH, 492);

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
    this.cameras.main.setZoom(1.5);
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
      'LEVEL 1: The Tehran Guest Room',
      '',
      'ARROWS: Move & Jump',
      'Reach the target building',
      'Then: SPACE to place bombs',
      'Find the KEY to unlock the exit',
      'Defeat ISMAIL HANIYEH',
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
    // Generate a simple 32x32 platform texture
    if (!this.textures.exists('_plat_block')) {
      const c = document.createElement('canvas');
      c.width = 32; c.height = 32;
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#666666';
      ctx.fillRect(0, 0, 32, 32);
      ctx.fillStyle = '#888888';
      ctx.fillRect(0, 0, 32, 3);
      this.textures.addCanvas('_plat_block', c);
    }
    if (!this.textures.exists('_ground_block')) {
      const c = document.createElement('canvas');
      c.width = 32; c.height = 32;
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#555555';
      ctx.fillRect(0, 0, 32, 32);
      ctx.fillStyle = '#666666';
      ctx.fillRect(0, 0, 32, 2);
      this.textures.addCanvas('_ground_block', c);
    }

    this.platforms = this.physics.add.staticGroup();

    // ── PLATFORMS — using staticGroup.create() the standard Phaser way ──
    const layout = [
      { x: 200,  y: 430, sx: 16, sy: 0.75 },  // Wide starting platform
      { x: 560,  y: 395, sx: 8,  sy: 0.75 },  // Step up
      { x: 800,  y: 360, sx: 8,  sy: 0.75 },  // Step up (guard here)
      { x: 1060, y: 330, sx: 6,  sy: 0.75 },  // Jump across
      { x: 1320, y: 360, sx: 12, sy: 0.75 },  // Target building roof
      { x: 1540, y: 360, sx: 7,  sy: 0.75 },  // Target building extension
    ];

    for (const def of layout) {
      const p = this.platforms.create(def.x, def.y, '_plat_block');
      p.setScale(def.sx, def.sy).refreshBody();
      p.setDepth(5);
    }

    // ── SOLID GROUND — very thick, impossible to clip ──
    const ground = this.platforms.create(WORLD_WIDTH / 2, 480, '_ground_block');
    ground.setScale(WORLD_WIDTH / 32, 4).refreshBody();  // 128px thick
    ground.setDepth(5);

    // ── UNDERGROUND FILL (visual) ──
    const underGfx = this.add.graphics().setDepth(4);
    underGfx.fillStyle(0x3a3a3a, 1);
    underGfx.fillRect(0, 530, WORLD_WIDTH, 100);
  }

  // ═══════════════════════════════════════════════════════════════
  // PLAYER
  // ═══════════════════════════════════════════════════════════════
  _createPlayer() {
    this.player = this.physics.add.sprite(200, 380, 'plt_player_idle');
    this.player.setCollideWorldBounds(true);
    this.player.setDepth(10);
    // NO custom scale — use default 1x to avoid physics body mismatch
    // The 64x64 texture is a fine size for the player
    this.player.setScale(1);

    // Collide with platforms
    this.physics.add.collider(this.player, this.platforms);
  }

  // ═══════════════════════════════════════════════════════════════
  // OBSTACLES -- cameras, searchlights, electric wires
  // ═══════════════════════════════════════════════════════════════
  _createObstacles() {
    // Minimal obstacles for short warm-up level
    this.secCameras = [
      { x: 600, y: 350, angleMin: 0.8, angleMax: 2.2, speed: 0.5, length: 100, halfAngle: 0.3 },
    ];
    for (const cam of this.secCameras) {
      cam.currentAngle = cam.angleMin;
      cam.sweepDir = 1;
      cam.sprite = this.add.image(cam.x, cam.y, 'plt_camera').setDepth(8);
    }

    // No searchlights or electric wires — keep it simple
    this.searchlights = [];
    this.wires = [];
  }

  // ═══════════════════════════════════════════════════════════════
  // GUARDS -- patrolling on platforms
  // ═══════════════════════════════════════════════════════════════
  _createGuards() {
    this.guards = [];
    // One guard on the middle platform — just enough to add tension
    this.guards.push(new RooftopGuard(this, 800, 320, 80));
  }

  // ═══════════════════════════════════════════════════════════════
  // TARGET -- building at end of level
  // ═══════════════════════════════════════════════════════════════
  _createTarget() {
    // Target building — at the end of the short route
    this.targetBuilding = this.add.image(1400, 280, 'plt_target_building').setDepth(5);

    // Golden glow/pulse around window area
    this.targetGlow = this.add.rectangle(1400, 280, 70, 70, 0xffd700, 0.15).setDepth(4);
    this.tweens.add({
      targets: this.targetGlow,
      alpha: 0.35,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Overlap trigger zone at window
    this.targetZone = this.add.zone(1400, 290, 60, 60);
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

      const opts = this.add.text(W / 2, H / 2 + 10, 'ESC: Resume | Q: Menu | R: Restart | M: Mute', {
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
      this.lastOnGround = 0;
    } else if (onGround && hasBufferedJump && this.jumpBufferTimer > 0) {
      this.player.body.setVelocityY(JUMP_VELOCITY);
      SoundManager.get().playJump();
      this.jumpBufferTimer = 0;
    }

    // Landing sound (NO squash/stretch — it changes physics body and causes clip-through)
    if (onGround && this.wasAirborne) {
      SoundManager.get().playLand();
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
