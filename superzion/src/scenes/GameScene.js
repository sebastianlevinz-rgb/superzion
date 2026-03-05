// ═══════════════════════════════════════════════════════════════
// GameScene — Side-scroller: parallax, platforms, obstacles
// ═══════════════════════════════════════════════════════════════

import Phaser from 'phaser';
import { createSkyGradient, createSun, createMountainLayer, createCloudLayer, createSkylineLayer, createFacadeLayer } from '../utils/BackgroundGenerator.js';
import { createGroundTopTile, createGroundFillTile, createPlatformTile, createPlatformLeftTile, createPlatformRightTile } from '../utils/TileGenerator.js';
import { generateSpriteSheet, createAnimations } from '../utils/SpriteGenerator.js';
import { createTargetBuildingTextures, createTargetMarkerTexture, createExplosiveTexture, createRuinsTexture } from '../utils/BuildingGenerator.js';
import { createExplosionTextures } from '../utils/ExplosionGenerator.js';
import { createCatTexture, createPlantTexture, createSamovarTexture, createFlagTexture } from '../utils/DecorationGenerator.js';
import { generateGuardSprites } from '../utils/EnemySpriteGenerator.js';
import { createObstacleTextures } from '../utils/ObstacleGenerator.js';
import { FlashlightGuard, SecurityCamera, SecurityLaser } from '../entities/Obstacle.js';
import { TILE, LEVEL_WIDTH, LEVEL_HEIGHT, GROUND_Y, BUILDING_CENTER_TILE, PLATFORM_DEFS, DECORATION_DEFS, OBSTACLE_DEFS } from '../data/LevelConfig.js';
import Player from '../entities/Player.js';
import HUD from '../ui/HUD.js';
import EndgameManager from '../systems/EndgameManager.js';
import SoundManager from '../systems/SoundManager.js';
import MusicManager from '../systems/MusicManager.js';

const WORLD_W = LEVEL_WIDTH * TILE;
const WORLD_H = LEVEL_HEIGHT * TILE;

export default class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }

  create() {
    this.cameras.main.setBackgroundColor('#87CEEB');
    MusicManager.get().playLevel1Music();
    this.gameOver = false;
    this.isPaused = false;
    this.pauseObjects = [];
    this.skipPromptActive = false;
    this.skipPromptObjects = [];
    this.stats = { timesDetected: 0, startTime: 0 };

    // 1. Generate all textures
    this._generateTextures();

    // 2. Create parallax background
    this._createBackground();

    // 3. Build level (ground + platforms)
    this._buildLevel();

    // 4. Place decorations
    this._placeDecorations();

    // Set world bounds BEFORE creating player (so collideWorldBounds works correctly)
    this.physics.world.setBounds(0, 0, WORLD_W, WORLD_H);

    // 5. Create player — spawn above ground, gravity will pull down
    const spawnX = 3 * TILE;
    const spawnY = GROUND_Y * TILE - 80;
    this.player = new Player(this, spawnX, spawnY, this.frameData);

    // Collisions: player vs ground and platforms
    this.physics.add.collider(this.player.sprite, this.groundGroup);
    this.physics.add.collider(this.player.sprite, this.platformGroup);

    // 6. Spawn obstacles
    this._spawnObstacles();

    // 7. HUD
    this.hud = new HUD(this, this.player);

    // 8. Endgame manager
    this.endgameManager = new EndgameManager(this, this.player);

    // 9. Setup detection
    this._setupDetection();

    // 10. Camera
    this._setupCamera();

    // 11. Controls hint
    this._showControlsHint();

    // Fade in
    this.cameras.main.fadeIn(500, 0, 0, 0);

    // Keys
    this.restartKey = this.input.keyboard.addKey('R');
    this.enterKey = this.input.keyboard.addKey('ENTER');
    this.escKey = this.input.keyboard.addKey('ESC');
    this.muteKey = this.input.keyboard.addKey('M');
    this.quitKey = this.input.keyboard.addKey('Q');
    this.skipKey = this.input.keyboard.addKey('P');
    this.yKey = this.input.keyboard.addKey('Y');
    this.nKey = this.input.keyboard.addKey('N');

    // Debug skip keys (disabled in production)
    // this.skipToTargetKey = this.input.keyboard.addKey('L');
    // this.skipToExplosionKey = this.input.keyboard.addKey('K');
  }

  // ── Texture generation ──────────────────────────────────────
  _generateTextures() {
    if (!this.textures.exists('sky_gradient')) {
      createSkyGradient(this);
      createSun(this);
      createMountainLayer(this);
      createCloudLayer(this);
      createSkylineLayer(this);
      createFacadeLayer(this);
    }

    if (!this.textures.exists('ground_top')) {
      createGroundTopTile(this);
      createGroundFillTile(this);
      createPlatformTile(this);
      createPlatformLeftTile(this);
      createPlatformRightTile(this);
    }

    if (!this.textures.exists('superzion')) {
      this.frameData = generateSpriteSheet(this);
      createAnimations(this, this.frameData);
    } else {
      // Reconstruct frameData from existing texture
      const names = ['idle_0','idle_1','run_0','run_1','run_2','run_3','run_4','run_5',
                     'jump_0','jump_1','fall_0','shoot_0','shoot_1'];
      this.frameData = {};
      names.forEach((n, i) => { this.frameData[n] = i + 1; });
    }

    if (!this.textures.exists('target_bldg_floor_0')) {
      createTargetBuildingTextures(this);
      createTargetMarkerTexture(this);
      createExplosiveTexture(this);
      createRuinsTexture(this);
    }

    if (!this.textures.exists('fireball')) {
      createExplosionTextures(this);
    }

    if (!this.textures.exists('deco_cat')) {
      createCatTexture(this);
      createPlantTexture(this);
      createSamovarTexture(this);
      createFlagTexture(this);
    }

    if (!this.textures.exists('guard_walk_0')) {
      generateGuardSprites(this);
    }

    if (!this.textures.exists('searchlight_base')) {
      createObstacleTextures(this);
    }
  }

  // ── Parallax background ────────────────────────────────────
  _createBackground() {
    this.bgSky = this.add.image(480, 270, 'sky_gradient').setScrollFactor(0).setDepth(-20);
    this.bgSun = this.add.image(760, 80, 'sun').setScrollFactor(0.02).setDepth(-19);

    this.bgMountains = this.add.tileSprite(480, 270, 960, 540, 'mountains').setScrollFactor(0).setDepth(-18);
    this.bgClouds = this.add.tileSprite(480, 270, 960, 540, 'clouds').setScrollFactor(0).setDepth(-17);
    this.bgSkyline = this.add.tileSprite(480, 270, 960, 540, 'skyline').setScrollFactor(0).setDepth(-16);
    this.bgFacades = this.add.tileSprite(480, 270, 960, 540, 'facades').setScrollFactor(0).setDepth(-15);
  }

  // ── Ground + platforms ─────────────────────────────────────
  _buildLevel() {
    this.groundGroup = this.physics.add.staticGroup();
    this.platformGroup = this.physics.add.staticGroup();

    // Ground — full level width, 1 tile thick surface + fill below
    for (let tx = 0; tx < LEVEL_WIDTH; tx++) {
      const gx = tx * TILE + TILE / 2;
      const gy = GROUND_Y * TILE + TILE / 2;

      const top = this.groundGroup.create(gx, gy, 'ground_top');
      top.setDepth(1);
      top.refreshBody();

      // Fill tile below ground
      const fill = this.add.image(gx, gy + TILE, 'ground_fill');
      fill.setDepth(0);
    }

    // Platforms
    for (const pdef of PLATFORM_DEFS) {
      for (let i = 0; i < pdef.w; i++) {
        const px = (pdef.x + i) * TILE + TILE / 2;
        const py = pdef.y * TILE + TILE / 2;

        let texKey = 'platform';
        if (i === 0) texKey = 'platform_left';
        else if (i === pdef.w - 1) texKey = 'platform_right';

        const plat = this.platformGroup.create(px, py, texKey);
        plat.setDepth(1);
        plat.refreshBody();
      }
    }
  }

  // ── Decorations (Enhancement 2: aligned to ground) ─────────
  _placeDecorations() {
    const groundSurface = GROUND_Y * TILE;

    for (const ddef of DECORATION_DEFS) {
      const texKey = `deco_${ddef.type}`;
      if (!this.textures.exists(texKey)) continue;

      const dx = ddef.x * TILE + TILE / 2;
      // Place at ground surface, aligned by bottom
      const tex = this.textures.get(texKey);
      const frame = tex.get(0);
      const dy = groundSurface - frame.height / 2;

      const deco = this.add.image(dx, dy, texKey);
      deco.setDepth(2);
    }
  }

  // ── Spawn obstacles ────────────────────────────────────────
  _spawnObstacles() {
    this.obstacles = [];
    this.laserObstacles = [];

    for (const def of OBSTACLE_DEFS) {
      if (def.type === 'flashlight_guard') {
        const guard = new FlashlightGuard(this, def.x, {
          patrolMin: def.patrolMin,
          patrolMax: def.patrolMax,
          speed: def.speed,
        });
        // Guard collides with ground
        this.physics.add.collider(guard.sprite, this.groundGroup);
        this.obstacles.push(guard);

      } else if (def.type === 'security_camera') {
        const cam = new SecurityCamera(this, def.x * TILE, def.y * TILE, {
          sweepAngleMin: def.sweepMin,
          sweepAngleMax: def.sweepMax,
          sweepSpeed: def.sweepSpeed,
          coneLength: def.coneLength,
        });
        this.obstacles.push(cam);

      } else if (def.type === 'security_laser') {
        const laser = new SecurityLaser(
          this,
          def.x * TILE, def.y1 * TILE,
          def.x * TILE, def.y2 * TILE,
          {
            onDuration: def.onDuration,
            offDuration: def.offDuration,
            phaseOffset: def.phase || 0,
          }
        );
        this.obstacles.push(laser);
        this.laserObstacles.push(laser);
      }
    }
  }

  // ── Detection setup ────────────────────────────────────────
  _setupDetection() {
    // Laser physics overlap
    for (const laser of this.laserObstacles) {
      this.physics.add.overlap(this.player.sprite, laser.detectionZone, () => {
        if (laser.isOn && !laser.deactivated) {
          this._onDetection(laser);
        }
      });
    }
  }

  // ── Camera setup ───────────────────────────────────────────
  _setupCamera() {
    // World bounds already set before player creation
    this.cameras.main.startFollow(this.player.sprite, true, 0.08, 0.08);
    this.cameras.main.setBounds(0, 0, WORLD_W, WORLD_H);
  }

  // ── Controls hint ──────────────────────────────────────────
  _showControlsHint() {
    const cam = this.cameras.main;
    const hint = this.add.text(cam.width / 2, cam.height - 30,
      'WASD/Arrows: Move  |  UP: Jump  |  SPACE: Plant', {
      fontFamily: 'monospace', fontSize: '11px', color: '#888888',
    });
    hint.setOrigin(0.5);
    hint.setScrollFactor(0);
    hint.setDepth(50);
    hint.setAlpha(0.8);

    // Fade out after 5 seconds
    this.time.delayedCall(5000, () => {
      this.tweens.add({
        targets: hint, alpha: 0, duration: 1000,
        onComplete: () => hint.destroy(),
      });
    });
  }

  // ── Detection callback ─────────────────────────────────────
  _onDetection(obstacle) {
    if (this.player.invulnerable || this.player.hp <= 0 || this.gameOver) return;

    this.stats.timesDetected++;
    this.hud.detectionCount = this.stats.timesDetected;
    this.player.takeDamage(1, obstacle.x);

    // Camera shake
    this.cameras.main.shake(100, 0.005);

    // Sound based on obstacle type
    if (obstacle.type === 'laser') {
      SoundManager.get().playLaserZap();
    } else {
      SoundManager.get().playCameraAlarm();
    }

    // Red screen flash
    const cam = this.cameras.main;
    const flash = this.add.rectangle(cam.width / 2, cam.height / 2, cam.width, cam.height, 0xff0000, 0.2);
    flash.setScrollFactor(0); flash.setDepth(150);
    this.tweens.add({
      targets: flash, alpha: 0, duration: 400,
      onComplete: () => flash.destroy(),
    });
  }

  // ── Deactivate all obstacles (called by EndgameManager) ────
  deactivateAllObstacles() {
    for (const obs of this.obstacles) {
      obs.deactivate();
    }
  }

  // ── Game over screen ───────────────────────────────────────
  _gameOverScreen() {
    this.gameOver = true;
    this.cameras.main.flash(300, 255, 0, 0);

    this.time.delayedCall(300, () => {
      const cam = this.cameras.main;
      const overlay = this.add.rectangle(cam.width / 2, cam.height / 2, cam.width, cam.height, 0x000000, 0);
      overlay.setScrollFactor(0); overlay.setDepth(200);
      this.tweens.add({ targets: overlay, alpha: 0.8, duration: 800 });

      this.time.delayedCall(800, () => {
        const goText = this.add.text(cam.width / 2, cam.height / 2 - 20, 'MISSION FAILED', {
          fontFamily: 'monospace', fontSize: '36px', color: '#ff3333',
          shadow: { offsetX: 0, offsetY: 0, color: '#ff0000', blur: 12, fill: true },
        });
        goText.setOrigin(0.5); goText.setScrollFactor(0); goText.setDepth(201);

        const sub = this.add.text(cam.width / 2, cam.height / 2 + 20, 'PRESS R TO RETRY  |  ENTER FOR MENU', {
          fontFamily: 'monospace', fontSize: '14px', color: '#ffffff',
        });
        sub.setOrigin(0.5); sub.setScrollFactor(0); sub.setDepth(201);
        this.tweens.add({ targets: sub, alpha: 0.3, duration: 600, yoyo: true, repeat: -1 });
      });
    });
  }

  // ── Game loop ──────────────────────────────────────────────
  // ── Skip level prompt ──────────────────────────────────────
  _showSkipPrompt() {
    this.skipPromptActive = true;
    this.physics.world.pause();
    this.tweens.pauseAll();

    const cam = this.cameras.main;
    const overlay = this.add.rectangle(cam.width / 2, cam.height / 2, cam.width, cam.height, 0x000000, 0.5);
    overlay.setScrollFactor(0); overlay.setDepth(250);
    this.skipPromptObjects.push(overlay);

    const text = this.add.text(cam.width / 2, cam.height / 2 - 10, 'SKIP LEVEL?', {
      fontFamily: 'monospace', fontSize: '32px', color: '#FFD700',
    });
    text.setOrigin(0.5); text.setScrollFactor(0); text.setDepth(251);
    this.skipPromptObjects.push(text);

    const hint = this.add.text(cam.width / 2, cam.height / 2 + 30, 'Y — Yes   /   N — No', {
      fontFamily: 'monospace', fontSize: '16px', color: '#aaaaaa',
    });
    hint.setOrigin(0.5); hint.setScrollFactor(0); hint.setDepth(251);
    this.skipPromptObjects.push(hint);
  }

  _clearSkipPrompt() {
    this.skipPromptActive = false;
    this.physics.world.resume();
    this.tweens.resumeAll();
    for (const obj of this.skipPromptObjects) obj.destroy();
    this.skipPromptObjects = [];
  }

  // ── Pause menu ──────────────────────────────────────────────
  _togglePause() {
    this.isPaused = !this.isPaused;
    if (this.isPaused) {
      this.physics.world.pause();
      this.tweens.pauseAll();

      const cam = this.cameras.main;
      const overlay = this.add.rectangle(cam.width / 2, cam.height / 2, cam.width, cam.height, 0x000000, 0.6);
      overlay.setScrollFactor(0); overlay.setDepth(250);
      this.pauseObjects.push(overlay);

      const title = this.add.text(cam.width / 2, cam.height / 2 - 40, 'PAUSED', {
        fontFamily: 'monospace', fontSize: '36px', color: '#ffffff',
      });
      title.setOrigin(0.5); title.setScrollFactor(0); title.setDepth(251);
      this.pauseObjects.push(title);

      const opts = this.add.text(cam.width / 2, cam.height / 2 + 20,
        'ENTER — Resume\nR — Restart\nQ — Quit to Menu\nM — Toggle Mute', {
        fontFamily: 'monospace', fontSize: '14px', color: '#aaaaaa',
        align: 'center', lineSpacing: 6,
      });
      opts.setOrigin(0.5); opts.setScrollFactor(0); opts.setDepth(251);
      this.pauseObjects.push(opts);
    } else {
      this.physics.world.resume();
      this.tweens.resumeAll();
      for (const obj of this.pauseObjects) obj.destroy();
      this.pauseObjects = [];
    }
  }

  update(time, delta) {
    if (this.stats.startTime === 0) this.stats.startTime = this.time.now;

    // M key — toggle mute (works always)
    if (Phaser.Input.Keyboard.JustDown(this.muteKey)) {
      const muted = SoundManager.get().toggleMute();
      MusicManager.get().setMuted(muted);
    }

    // Skip level prompt (Y/N)
    if (this.skipPromptActive) {
      if (Phaser.Input.Keyboard.JustDown(this.yKey)) {
        this._clearSkipPrompt();
        MusicManager.get().stop(0.3)
        const elapsed = this.time.now - this.stats.startTime;
        this.scene.start('ExplosionCinematicScene', {
          stats: {
            timesDetected: this.stats.timesDetected,
            elapsed: elapsed,
            hp: this.player.hp,
            maxHp: this.player.maxHp,
          },
        });
      } else if (Phaser.Input.Keyboard.JustDown(this.nKey) || Phaser.Input.Keyboard.JustDown(this.escKey)) {
        this._clearSkipPrompt();
      }
      return;
    }

    // P — skip level prompt
    if (Phaser.Input.Keyboard.JustDown(this.skipKey) && !this.gameOver && !this.isPaused) {
      this._showSkipPrompt();
      return;
    }

    // ESC — toggle pause
    if (Phaser.Input.Keyboard.JustDown(this.escKey)) {
      this._togglePause();
      return;
    }

    // While paused, handle resume/restart/quit
    if (this.isPaused) {
      if (Phaser.Input.Keyboard.JustDown(this.enterKey)) {
        this._togglePause();
      } else if (Phaser.Input.Keyboard.JustDown(this.restartKey)) {
        this.isPaused = false;
        this.physics.world.resume();
        this.tweens.resumeAll();
        MusicManager.get().stop(0)
        this.scene.restart();
      } else if (Phaser.Input.Keyboard.JustDown(this.quitKey)) {
        this.isPaused = false;
        this.physics.world.resume();
        this.tweens.resumeAll();
        MusicManager.get().stop(0.5)
        this.scene.start('MenuScene');
      }
      return;
    }

    if (this.gameOver) {
      if (Phaser.Input.Keyboard.JustDown(this.restartKey)) {
        MusicManager.get().stop(0)
        this.scene.restart()
      }
      if (Phaser.Input.Keyboard.JustDown(this.enterKey)) {
        MusicManager.get().stop(0.5)
        this.scene.start('MenuScene')
      }
      return;
    }

    if (this.player.hp <= 0) { this._gameOverScreen(); return; }

    // Player
    this.player.update(delta);

    // Obstacles — update + cone detection (with camera culling)
    const camLeft = this.cameras.main.scrollX - 200;
    const camRight = this.cameras.main.scrollX + this.cameras.main.width + 200;
    const px = this.player.sprite.x;
    const py = this.player.sprite.y;

    for (const obs of this.obstacles) {
      // Camera culling for performance
      const obsX = obs.x || (obs.sprite ? obs.sprite.x : 0);
      if (obsX < camLeft || obsX > camRight) continue;

      if (obs.type === 'laser') {
        obs.update(delta);
        // Laser detection handled by physics overlap
      } else {
        const detected = obs.update(delta, px, py);
        if (detected && !this.player.invulnerable) {
          this._onDetection(obs);
        }
      }
    }

    // Parallax scroll
    const scrollX = this.cameras.main.scrollX;
    this.bgMountains.tilePositionX = scrollX * 0.05;
    this.bgClouds.tilePositionX = scrollX * 0.1;
    this.bgSkyline.tilePositionX = scrollX * 0.2;
    this.bgFacades.tilePositionX = scrollX * 0.35;

    // Endgame manager
    this.endgameManager.update(delta);

    // HUD
    this.hud.update();

    // Fall respawn
    if (this.player.sprite.y > GROUND_Y * TILE + 100) {
      this.player.sprite.setPosition(3 * TILE, GROUND_Y * TILE - 64);
      this.player.sprite.body.setVelocity(0, 0);
    }
  }
}
