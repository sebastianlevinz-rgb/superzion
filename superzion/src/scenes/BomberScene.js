// ═══════════════════════════════════════════════════════════════
// BomberScene — Level 3: Operation Deep Strike (Side-Scrolling)
// 6-phase: Takeoff → Sea Flight → Coast → Bombing → Return → Landing
// + Victory/Results overlay
// ═══════════════════════════════════════════════════════════════

import Phaser from 'phaser';
import SoundManager from '../systems/SoundManager.js';
import MusicManager from '../systems/MusicManager.js';
import DifficultyManager from '../systems/DifficultyManager.js';
import {
  createF15SideSprite, createCarrierSide, createSunsetSky,
  createCloudLayer, createSeaSurface, createFarMountains,
  createCoastGround, createMountainGround, createValleyGround,
} from '../utils/BomberTextures.js';

const W = 960;
const H = 540;
const GROUND_Y = 420;     // horizon / ground line
const DECK_Y = 395;       // carrier deck surface Y
const GRAVITY = 480;      // bomb gravity px/s²
const JET_SPEED = 220;    // base horizontal speed px/s
const BOMB_TOTAL = 8;
const BUNKER_LAYERS = 5;
const BUNKER_X = 480;     // bunker center X in bombing phase
const BUNKER_W = 200;     // bunker width
const BUNKER_TOP_Y = 340; // top of bunker
const LAYER_H = 20;       // each layer height

// Distance thresholds (scroll pixels)
const FLIGHT_COAST_DIST = 3000;
const FLIGHT_MTN_DIST = 4800;
const FLIGHT_TARGET_DIST = 7000;
const RETURN_COAST_DIST = 2200;
const RETURN_SEA_DIST = 4000;
const RETURN_CARRIER_DIST = 6200;

export default class BomberScene extends Phaser.Scene {
  constructor() { super('BomberScene'); }

  create() {
    this.cameras.main.setBackgroundColor('#000000');
    MusicManager.get().playLevel3Music('takeoff');

    // Generate textures
    createF15SideSprite(this);
    createCarrierSide(this);
    createSunsetSky(this);
    createCloudLayer(this);
    createSeaSurface(this);
    createFarMountains(this);
    createCoastGround(this);
    createMountainGround(this);
    createValleyGround(this);

    // ── Game state ──
    const dm = DifficultyManager.get();
    this.dm = dm;
    this.phase = 'takeoff';
    this.armor = dm.isHard() ? 2 : 3;
    this.bombs = BOMB_TOTAL;
    this.bombsUsed = 0;
    this.bunkerHP = BUNKER_LAYERS;
    this.landingQuality = '';
    this.jetX = 100;
    this.jetY = DECK_Y;
    this.jetVX = 0;
    this.jetVY = 0;
    this.facingRight = true;
    this.scrollX = 0;
    this.phaseTimer = 0;
    this.score = 0;

    // Bombing pass state
    this.bombObjects = [];
    this.missiles = [];
    this.explosions = [];
    this.engineParticles = [];
    this.bunkerLayerSprites = [];
    this.turretSprites = [];
    this.missileSpawnTimer = 0;
    this.bombingDirection = 1;
    this.flightTerrainStage = 0;
    this.returnTerrainStage = 0;
    this.bombCooldown = 0;
    this.bombingEnded = false;
    this.camoGfx = null;
    this.flightDistance = 0;
    this.returnDistance = 0;

    // Landing state
    this.landingRetries = 0;
    this.landingDescending = false;

    // Ambient
    this.ambientRef = null;

    // ── Persistent layers ──
    this._setupLayers();
    this._setupHUD();
    this._setupInput();

    // Start Phase 1
    this._startTakeoff();
  }

  // ═════════════════════════════════════════════════════════════
  // LAYER SETUP (persistent across phases)
  // ═════════════════════════════════════════════════════════════
  _setupLayers() {
    // Far sky (static background)
    this.skyBg = this.add.image(W / 2, H / 2, 'sunset_sky').setDepth(-10);

    // Clouds (slow parallax)
    this.cloudTile = this.add.tileSprite(W / 2, 100, W, 150, 'cloud_layer').setDepth(-7);

    // Far mountains (mid parallax) — hidden during sea phases
    this.farTerrain = this.add.tileSprite(W / 2, GROUND_Y - 55, W, 250, 'far_mountains').setDepth(-5);
    this.farTerrain.setVisible(false);

    // Ground (near parallax)
    this.groundTile = this.add.tileSprite(W / 2, GROUND_Y + 60, W, 120, 'sea_surface').setDepth(1);

    // Carrier sprite (shown during takeoff/landing)
    this.carrierSprite = this.add.image(240, GROUND_Y - 10, 'carrier_side').setDepth(2);

    // F-15Z jet sprite
    this.jetSprite = this.add.image(this.jetX, this.jetY, 'f15_side').setDepth(10);
  }

  _setupHUD() {
    const hudStyle = { fontFamily: 'monospace', fontSize: '12px', color: '#ffffff' };
    const titleStyle = { fontFamily: 'monospace', fontSize: '11px', color: '#FFD700',
      shadow: { offsetX: 0, offsetY: 0, color: '#FFD700', blur: 4, fill: true } };

    this.hudTitle = this.add.text(15, 12, 'OPERATION DEEP STRIKE', titleStyle).setDepth(30);
    this.hudArmor = this.add.text(15, 30, 'ARMOR: 3/3', hudStyle).setDepth(30);
    this.hudBombs = this.add.text(15, 46, 'BOMBS: 8', hudStyle).setDepth(30);

    this.hudAlt = this.add.text(W - 15, 12, 'ALT: 0m', { ...hudStyle, color: '#aaaaaa' })
      .setOrigin(1, 0).setDepth(30);
    this.hudSpeed = this.add.text(W - 15, 28, 'SPD: 0 kts', { ...hudStyle, color: '#aaaaaa' })
      .setOrigin(1, 0).setDepth(30);

    this.hudDist = this.add.text(W / 2, 12, '', {
      fontFamily: 'monospace', fontSize: '11px', color: '#00e5ff',
    }).setOrigin(0.5).setDepth(30);

    // Phase instruction text (center)
    this.instrText = this.add.text(W / 2, H - 35, '', {
      fontFamily: 'monospace', fontSize: '13px', color: '#888888',
      shadow: { offsetX: 0, offsetY: 0, color: '#000000', blur: 4, fill: true },
    }).setOrigin(0.5).setDepth(30);
  }

  _setupInput() {
    this.keys = {
      left: this.input.keyboard.addKey('LEFT'),
      right: this.input.keyboard.addKey('RIGHT'),
      up: this.input.keyboard.addKey('UP'),
      down: this.input.keyboard.addKey('DOWN'),
      space: this.input.keyboard.addKey('SPACE'),
      enter: this.input.keyboard.addKey('ENTER'),
      s: this.input.keyboard.addKey('S'),
      m: this.input.keyboard.addKey('M'),
      p: this.input.keyboard.addKey('P'),
      esc: this.input.keyboard.addKey('ESC'),
    };
    this.isPaused = false;
    this.pauseObjects = [];
  }

  _togglePause() {
    this.isPaused = !this.isPaused;
    if (this.isPaused) {
      const overlay = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.6).setDepth(60);
      this.pauseObjects.push(overlay);
      const title = this.add.text(W / 2, H / 2 - 30, 'PAUSED', {
        fontFamily: 'monospace', fontSize: '36px', color: '#ffffff',
      }).setOrigin(0.5).setDepth(61);
      this.pauseObjects.push(title);
      const opts = this.add.text(W / 2, H / 2 + 20, 'ESC — Resume  |  M — Mute', {
        fontFamily: 'monospace', fontSize: '14px', color: '#aaaaaa',
      }).setOrigin(0.5).setDepth(61);
      this.pauseObjects.push(opts);
    } else {
      for (const obj of this.pauseObjects) obj.destroy();
      this.pauseObjects = [];
    }
  }

  // ═════════════════════════════════════════════════════════════
  // SCROLLING & UTILITY
  // ═════════════════════════════════════════════════════════════
  _scrollLayers(speed, dt) {
    const dx = speed * dt;
    this.scrollX += dx;
    this.cloudTile.tilePositionX += dx * 0.1;
    this.farTerrain.tilePositionX += dx * 0.3;
    this.groundTile.tilePositionX += dx * 0.8;
  }

  _updateHUD() {
    const alt = Math.max(0, Math.round((GROUND_Y - this.jetY) / GROUND_Y * 3000));
    const spd = Math.round(Math.abs(this.jetVX) * 1.8); // px/s to ~knots
    this.hudAlt.setText(`ALT: ${alt}m`);
    this.hudSpeed.setText(`SPD: ${spd} kts`);
    this.hudArmor.setText(`ARMOR: ${Math.max(0, this.armor)}/3`);
    this.hudArmor.setColor(this.armor <= 1 ? '#ff4444' : '#ffffff');
    this.hudBombs.setText(`BOMBS: ${this.bombs}`);
  }

  _stopAmbient() {
    if (this.ambientRef) {
      try {
        this.ambientRef.source.stop();
        if (this.ambientRef.osc) this.ambientRef.osc.stop();
      } catch (e) { /* already stopped */ }
      this.ambientRef = null;
    }
  }

  _cleanupMissiles() {
    for (const m of this.missiles) {
      m.sprite.destroy();
      m.glow.destroy();
    }
    this.missiles = [];
  }

  _takeDamage() {
    this.armor--;
    SoundManager.get().playMissileWarning();
    this.cameras.main.shake(200, 0.015);

    // Red flash
    const flash = this.add.rectangle(W / 2, H / 2, W, H, 0xff0000, 0.3).setDepth(25);
    this.tweens.add({ targets: flash, alpha: 0, duration: 300, onComplete: () => flash.destroy() });

    if (this.armor <= 0) {
      this._stopAmbient();
      this.phase = 'dead';
      this.time.delayedCall(800, () => this._showVictory());
    }
  }

  _addExplosion(x, y, radius) {
    const exp = this.add.circle(x, y, radius, 0xff6600, 0.8).setDepth(15);
    this.explosions.push({ sprite: exp, life: 0.5 });
    if (radius > 20) this.cameras.main.shake(200, 0.01);
  }

  _updateExplosions(dt) {
    for (let i = this.explosions.length - 1; i >= 0; i--) {
      const e = this.explosions[i];
      e.life -= dt;
      e.sprite.setScale(1 + (0.5 - e.life));
      e.sprite.setAlpha(Math.max(0, e.life * 2));
      if (e.life <= 0) { e.sprite.destroy(); this.explosions.splice(i, 1); }
    }
  }

  _updateEngineTrail(dt) {
    // Spawn particles behind jet
    if (Math.random() < 0.4) {
      const ox = this.facingRight ? -40 : 40;
      const p = this.add.circle(
        this.jetX + ox + (Math.random() - 0.5) * 4,
        this.jetY + (Math.random() - 0.5) * 6,
        2 + Math.random() * 2,
        Phaser.Display.Color.GetColor(255, Math.floor(80 + Math.random() * 100), 0),
        0.6
      ).setDepth(4);
      this.engineParticles.push({ sprite: p, life: 0.3 + Math.random() * 0.2 });
    }
    // Update
    for (let i = this.engineParticles.length - 1; i >= 0; i--) {
      const ep = this.engineParticles[i];
      ep.life -= dt;
      ep.sprite.setAlpha(Math.max(0, ep.life * 2));
      ep.sprite.setScale(Math.max(0.2, ep.life));
      if (ep.life <= 0) { ep.sprite.destroy(); this.engineParticles.splice(i, 1); }
    }
  }

  // ═════════════════════════════════════════════════════════════
  // PHASE 1 — TAKEOFF
  // ═════════════════════════════════════════════════════════════
  _startTakeoff() {
    this.phase = 'takeoff';
    this.jetX = 100;
    this.jetY = DECK_Y;
    this.jetVX = 0;
    this.facingRight = true;

    this.carrierSprite.setVisible(true);
    this.carrierSprite.setPosition(240, GROUND_Y - 10);
    this.farTerrain.setVisible(false);
    this.groundTile.setTexture('sea_surface');

    this.instrText.setText('HOLD RIGHT to accelerate \u2014 UP at ramp to launch');

    this.ambientRef = SoundManager.get().playCarrierAmbient();
  }

  _updateTakeoff(dt) {
    // Accelerate with RIGHT
    if (this.keys.right.isDown) {
      this.jetVX = Math.min(300, this.jetVX + 180 * dt);
    } else {
      this.jetVX = Math.max(0, this.jetVX - 60 * dt); // friction
    }

    this.jetX += this.jetVX * dt;
    this.jetSprite.setPosition(this.jetX, this.jetY);
    this.jetSprite.setFlipX(false);

    // Ramp zone: carrier ramp at x ≈ 430
    const rampX = 430;
    if (this.jetX >= rampX && Phaser.Input.Keyboard.JustDown(this.keys.up)) {
      if (this.jetVX >= 180) {
        // Successful launch!
        this._stopAmbient();
        SoundManager.get().playAfterburner();
        this.instrText.setText('');
        this.phase = 'launching';
        this.jetVY = -200;
      } else {
        // Too slow
        this.instrText.setText('TOO SLOW \u2014 Accelerate more!');
        this.instrText.setColor('#ff4444');
        this.time.delayedCall(1500, () => {
          if (this.phase === 'takeoff') {
            this.instrText.setText('HOLD RIGHT to accelerate \u2014 UP at ramp to launch');
            this.instrText.setColor('#888888');
          }
        });
      }
    }

    // Prevent going off screen during takeoff
    if (this.jetX > 500 && this.jetVX < 180) {
      this.jetX = 500;
      this.jetVX *= 0.5;
    }
  }

  _updateLaunching(dt) {
    // Jet climbs up and right
    this.jetX += this.jetVX * dt;
    this.jetY += this.jetVY * dt;
    this.jetVY += 30 * dt; // slight gravity reduction (climbing)
    this.jetSprite.setPosition(this.jetX, this.jetY);

    // Carrier scrolls left
    this.carrierSprite.x -= this.jetVX * 0.5 * dt;

    // Once high enough and carrier off screen, transition to flight
    if (this.jetY < 200 && this.carrierSprite.x < -300) {
      this.carrierSprite.setVisible(false);
      this.jetX = 280; // reposition jet to left-of-center
      this.jetY = 200;
      this.jetVX = JET_SPEED;
      this._startFlight();
    }
  }

  // ═════════════════════════════════════════════════════════════
  // PHASE 2 — FLIGHT (sea + coast + mountains, ~35s)
  // ═════════════════════════════════════════════════════════════
  _startFlight() {
    this.phase = 'flight';
    MusicManager.get().playLevel3Music('flight');
    this.phaseTimer = 0;
    this.missileSpawnTimer = 0;
    this.missiles = [];
    this.facingRight = true;
    this.jetVX = JET_SPEED;
    this.flightDistance = 0;
    this.flightTerrainStage = 0;

    this.farTerrain.setVisible(false);
    this.groundTile.setTexture('sea_surface');

    this.instrText.setText('ARROWS to fly \u2014 Approaching target...');
    this.instrText.setColor('#888888');

    this.ambientRef = SoundManager.get().playJetEngine();
  }

  _updateFlight(dt) {
    this.phaseTimer += dt;

    // Horizontal speed: RIGHT accelerates, LEFT decelerates
    const accel = 300;
    if (this.keys.right.isDown) {
      this.jetVX = Math.min(400, this.jetVX + accel * dt);
    } else if (this.keys.left.isDown) {
      this.jetVX = Math.max(60, this.jetVX - accel * dt);
    } else {
      // Drift back to base speed
      const diff = JET_SPEED - this.jetVX;
      this.jetVX += Math.sign(diff) * Math.min(Math.abs(diff), 150 * dt);
    }

    // Vertical movement
    const vSpeed = 200;
    if (this.keys.up.isDown) this.jetY = Math.max(60, this.jetY - vSpeed * dt);
    if (this.keys.down.isDown) this.jetY = Math.min(GROUND_Y - 40, this.jetY + vSpeed * dt);

    // Jet screen X drifts with speed difference
    const targetX = 280 + (this.jetVX - JET_SPEED) * 0.6;
    this.jetX += (targetX - this.jetX) * 3 * dt;
    this.jetX = Phaser.Math.Clamp(this.jetX, 60, W - 60);

    this.jetSprite.setPosition(this.jetX, this.jetY);

    // Scroll world at jet speed
    this._scrollLayers(this.jetVX, dt);
    this.flightDistance += this.jetVX * dt;

    // Terrain transitions (distance-based)
    if (this.flightDistance > FLIGHT_COAST_DIST && this.flightTerrainStage === 0) {
      this.flightTerrainStage = 1;
      this.groundTile.setTexture('coast_ground');
      this.farTerrain.setVisible(true);
      this.instrText.setText('Approaching Lebanon...');
    }
    if (this.flightDistance > FLIGHT_MTN_DIST && this.flightTerrainStage === 1) {
      this.flightTerrainStage = 2;
      this.groundTile.setTexture('mountain_ground');
      this.instrText.setText('Over the mountains...');
    }

    // Distance HUD
    const distKm = Math.max(0, Math.round(180 * (1 - this.flightDistance / FLIGHT_TARGET_DIST)));
    this.hudDist.setText(`TARGET: ${distKm} km`);

    // Spawn missiles from below
    this.missileSpawnTimer += dt;
    const spawnInterval = Math.max(1, 2.8 - this.phaseTimer * 0.04) * this.dm.spawnRateMult();
    if (this.missileSpawnTimer >= spawnInterval) {
      this.missileSpawnTimer = 0;
      this._spawnMissile(100 + Math.random() * (W - 200), GROUND_Y + 20, -180 - Math.random() * 80);
    }
    this._updateMissiles(dt);

    // Seagulls (decorative over sea)
    if (this.flightDistance < FLIGHT_COAST_DIST && Math.random() < 0.005) {
      const g = this.add.text(W + 10, 200 + Math.random() * 150, 'v', {
        fontFamily: 'monospace', fontSize: '10px', color: 'rgba(255,255,255,0.3)',
      }).setDepth(3);
      this.tweens.add({
        targets: g, x: -20, duration: 4000 + Math.random() * 3000,
        onComplete: () => g.destroy(),
      });
    }

    // Transition to bombing when reaching target
    if (this.flightDistance >= FLIGHT_TARGET_DIST) {
      this._stopAmbient();
      this._startBombing();
    }
  }

  _spawnMissile(x, y, vy) {
    const m = this.add.circle(x, y, 3, 0xff3333).setDepth(8);
    // Trail glow
    const glow = this.add.circle(x, y, 5, 0xff0000, 0.3).setDepth(7);
    const spdMult = this.dm.missileSpeedMult();
    this.missiles.push({
      sprite: m, glow, x, y,
      vx: (Math.random() - 0.5) * 40 * spdMult,
      vy: vy * spdMult,
    });
  }

  _updateMissiles(dt) {
    for (let i = this.missiles.length - 1; i >= 0; i--) {
      const m = this.missiles[i];
      m.x += m.vx * dt;
      m.y += m.vy * dt;
      m.sprite.setPosition(m.x, m.y);
      m.glow.setPosition(m.x, m.y);

      // Hit detection
      const dx = m.x - this.jetX;
      const dy = m.y - this.jetY;
      if (Math.sqrt(dx * dx + dy * dy) < 18) {
        this._takeDamage();
        m.sprite.destroy(); m.glow.destroy();
        this.missiles.splice(i, 1);
        continue;
      }

      // Off screen
      if (m.y < -30 || m.y > H + 30 || m.x < -30 || m.x > W + 30) {
        m.sprite.destroy(); m.glow.destroy();
        this.missiles.splice(i, 1);
      }
    }
  }

  // ═════════════════════════════════════════════════════════════
  // PHASE 3 — BOMBING
  // ═════════════════════════════════════════════════════════════
  _startBombing() {
    this.phase = 'bombing';
    MusicManager.get().playLevel3Music('bombing');
    this.phaseTimer = 0;
    this.bombObjects = [];
    this._cleanupMissiles();
    this.missileSpawnTimer = 0;
    this.bombingDirection = 1;
    this.bombingEnded = false;
    this.facingRight = true;
    this.jetX = 80;
    this.jetY = 150;
    this.jetVX = JET_SPEED;

    // Change ground to valley
    this.groundTile.setTexture('valley_ground');
    this.farTerrain.setVisible(true);

    // Draw bunker layers as game objects
    this.bunkerLayerSprites = [];
    const colors = [0x8a8a92, 0x7a7a82, 0x6a6a72, 0x5a5a62, 0x4a4a52];
    for (let i = 0; i < BUNKER_LAYERS; i++) {
      const ly = BUNKER_TOP_Y + i * LAYER_H;
      const layer = this.add.rectangle(BUNKER_X, ly + LAYER_H / 2, BUNKER_W, LAYER_H - 2, colors[i]).setDepth(3);
      // Edge stroke
      const edge = this.add.rectangle(BUNKER_X, ly + LAYER_H / 2, BUNKER_W, LAYER_H - 2).setDepth(3);
      edge.setStrokeStyle(1, 0x999999, 0.3);
      edge.setFillStyle();
      this.bunkerLayerSprites.push({ rect: layer, edge, alive: true });
    }

    // Turrets near bunker
    this.turretSprites = [];
    const turretPos = [
      { x: BUNKER_X - 140, y: GROUND_Y - 10 },
      { x: BUNKER_X + 140, y: GROUND_Y - 10 },
    ];
    for (const tp of turretPos) {
      const ts = this.add.rectangle(tp.x, tp.y, 12, 10, 0xaa2020).setDepth(3);
      this.turretSprites.push({ sprite: ts, x: tp.x, y: tp.y, fireTimer: 1 + Math.random() * 2 });
    }

    // Camouflage netting (decorative)
    this.camoGfx = this.add.graphics().setDepth(2);
    this.camoGfx.fillStyle(0x3a5530, 0.3);
    this.camoGfx.fillRect(BUNKER_X - 120, BUNKER_TOP_Y - 10, 240, 15);

    this.instrText.setText('ARROWS to move \u2014 SPACE to drop bomb');
    this.instrText.setColor('#ff8800');

    this.ambientRef = SoundManager.get().playJetEngine();
  }

  _updateBombing(dt) {
    this.phaseTimer += dt;

    // Full 4-way player control
    const moveSpeed = 220;
    const prevJetX = this.jetX;
    if (this.keys.right.isDown) {
      this.jetX += moveSpeed * dt;
      this.facingRight = true;
    }
    if (this.keys.left.isDown) {
      this.jetX -= moveSpeed * dt;
      this.facingRight = false;
    }
    if (this.keys.up.isDown) this.jetY = Math.max(60, this.jetY - moveSpeed * dt);
    if (this.keys.down.isDown) this.jetY = Math.min(280, this.jetY + moveSpeed * dt);
    this.jetX = Phaser.Math.Clamp(this.jetX, 60, W - 60);
    this.jetSprite.setFlipX(!this.facingRight);
    this.jetSprite.setPosition(this.jetX, this.jetY);
    this.jetVX = (this.jetX - prevJetX) / (dt || 0.016);

    // Bomb cooldown
    if (this.bombCooldown > 0) this.bombCooldown -= dt;

    // SPACE drops bomb (with cooldown)
    if (Phaser.Input.Keyboard.JustDown(this.keys.space) && this.bombs > 0 && this.bombCooldown <= 0) {
      this._dropBomb();
      this.bombCooldown = 0.35;
    }

    // Update bombs
    this._updateBombs(dt);

    // Turret firing
    this._updateTurrets(dt);
    this._updateMissiles(dt);
    this._updateExplosions(dt);

    // Check end conditions
    if (this.bunkerHP <= 0) {
      this._stopAmbient();
      this._startExplosionSequence();
      return;
    }
    if (this.bombs <= 0 && this.bombObjects.length === 0 && !this.bombingEnded) {
      this.bombingEnded = true;
      this._stopAmbient();
      if (this.bunkerHP <= 0) {
        this._startExplosionSequence();
      } else {
        this.instrText.setText('OUT OF ORDNANCE');
        this.instrText.setColor('#ff4444');
        this.time.delayedCall(1500, () => this._startReturn());
      }
    }
  }

  _dropBomb() {
    this.bombs--;
    this.bombsUsed++;
    SoundManager.get().playBombDrop();

    const bomb = this.add.circle(this.jetX, this.jetY + 20, 5, 0xffcc00).setDepth(9);
    // Bomb outline
    const bombOut = this.add.circle(this.jetX, this.jetY + 20, 7, 0xff8800, 0).setDepth(9);
    bombOut.setStrokeStyle(2, 0xff8800, 0.6);
    this.bombObjects.push({
      sprite: bomb, outline: bombOut,
      x: this.jetX, y: this.jetY + 20,
      vx: this.jetVX * 0.5,
      vy: 0,
    });
  }

  _updateBombs(dt) {
    for (let i = this.bombObjects.length - 1; i >= 0; i--) {
      const b = this.bombObjects[i];
      b.vy += GRAVITY * dt;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.sprite.setPosition(b.x, b.y);
      b.outline.setPosition(b.x, b.y);

      // Hit ground / bunker
      if (b.y >= BUNKER_TOP_Y) {
        // Check bunker hit
        const bx = Math.abs(b.x - BUNKER_X);
        if (bx < BUNKER_W / 2 && b.y < BUNKER_TOP_Y + BUNKER_LAYERS * LAYER_H) {
          // Hit! Destroy topmost alive layer
          const layerIdx = BUNKER_LAYERS - this.bunkerHP;
          if (layerIdx < BUNKER_LAYERS && this.bunkerLayerSprites[layerIdx].alive) {
            this.bunkerLayerSprites[layerIdx].alive = false;
            this.tweens.add({
              targets: [this.bunkerLayerSprites[layerIdx].rect, this.bunkerLayerSprites[layerIdx].edge],
              alpha: 0.1, duration: 300,
            });
            this.bunkerHP--;
            SoundManager.get().playBombImpact();
            this._addExplosion(b.x, BUNKER_TOP_Y + layerIdx * LAYER_H + 10, 35);

            // Score text
            const pts = this.add.text(b.x, BUNKER_TOP_Y - 20, `LAYER ${layerIdx + 1} PENETRATED`, {
              fontFamily: 'monospace', fontSize: '11px', color: '#00ff00',
            }).setOrigin(0.5).setDepth(20);
            this.tweens.add({
              targets: pts, y: BUNKER_TOP_Y - 50, alpha: 0, duration: 1000,
              onComplete: () => pts.destroy(),
            });
          }
        } else if (b.y >= GROUND_Y) {
          // Ground miss
          SoundManager.get().playBombImpact();
          this._addExplosion(b.x, GROUND_Y - 5, 12);
        } else {
          continue; // still falling through bunker zone but not at ground yet
        }

        b.sprite.destroy();
        b.outline.destroy();
        this.bombObjects.splice(i, 1);
        continue;
      }

      // Off screen
      if (b.x < -20 || b.x > W + 20 || b.y > H + 20) {
        b.sprite.destroy();
        b.outline.destroy();
        this.bombObjects.splice(i, 1);
      }
    }
  }

  _updateTurrets(dt) {
    for (const t of this.turretSprites) {
      t.fireTimer -= dt;
      if (t.fireTimer <= 0) {
        t.fireTimer = (1.5 + Math.random() * 1.5) * this.dm.spawnRateMult();
        // Fire toward jet
        const dx = this.jetX - t.x;
        const dy = this.jetY - t.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const m = this.add.circle(t.x, t.y, 3, 0xff4444).setDepth(8);
        const glow = this.add.circle(t.x, t.y, 5, 0xff0000, 0.3).setDepth(7);
        const tSpd = 160 * this.dm.missileSpeedMult();
        this.missiles.push({
          sprite: m, glow, x: t.x, y: t.y,
          vx: (dx / dist) * tSpd,
          vy: (dy / dist) * tSpd,
        });
        SoundManager.get().playMissilePass();
      }
    }
  }

  // ═════════════════════════════════════════════════════════════
  // EXPLOSION SEQUENCE
  // ═════════════════════════════════════════════════════════════
  _startExplosionSequence() {
    this.phase = 'explosion';
    this.instrText.setText('');

    // Massive explosion
    for (let i = 0; i < 10; i++) {
      this.time.delayedCall(i * 80, () => {
        const ex = BUNKER_X + (Math.random() - 0.5) * 150;
        const ey = BUNKER_TOP_Y + Math.random() * 80;
        this._addExplosion(ex, ey, 25 + Math.random() * 30);
      });
    }

    this.cameras.main.shake(1000, 0.04);
    SoundManager.get().playExplosion();

    // Big fireball
    const fireball = this.add.circle(BUNKER_X, BUNKER_TOP_Y + 40, 25, 0xff4400, 0.9).setDepth(16);
    this.tweens.add({
      targets: fireball, scaleX: 6, scaleY: 6, alpha: 0,
      duration: 1500, ease: 'Quad.easeOut',
      onComplete: () => fireball.destroy(),
    });

    // Smoke column
    this.smokeSprite = this.add.ellipse(BUNKER_X, BUNKER_TOP_Y - 30, 40, 100, 0x333333, 0.5).setDepth(14);
    this.tweens.add({
      targets: this.smokeSprite, scaleX: 2.5, scaleY: 3, y: BUNKER_TOP_Y - 100, alpha: 0.3,
      duration: 2000,
    });

    // Crater
    const crater = this.add.ellipse(BUNKER_X, BUNKER_TOP_Y + 50, 180, 30, 0x1a1a10, 0.7).setDepth(3);

    // "BUNKER DESTROYED — RTB" text
    this.time.delayedCall(800, () => {
      const rtbText = this.add.text(W / 2, 80, 'BUNKER DESTROYED \u2014 RTB', {
        fontFamily: 'monospace', fontSize: '24px', color: '#00ff00',
        shadow: { offsetX: 0, offsetY: 0, color: '#00ff00', blur: 12, fill: true },
      }).setOrigin(0.5).setDepth(25);
      this.tweens.add({
        targets: rtbText, alpha: 0.4, duration: 500, yoyo: true, repeat: 3,
        onComplete: () => {
          rtbText.destroy();
          if (this.smokeSprite) this.smokeSprite.destroy();
          crater.destroy();
          // Clean up bunker layer sprites
          for (const l of this.bunkerLayerSprites) {
            if (l.rect) l.rect.destroy();
            if (l.edge) l.edge.destroy();
          }
          for (const t of this.turretSprites) { if (t.sprite) t.sprite.destroy(); }
          if (this.camoGfx) { this.camoGfx.destroy(); this.camoGfx = null; }
          this._cleanupMissiles();
          this._startReturn();
        },
      });
    });
  }

  // ═════════════════════════════════════════════════════════════
  // PHASE 5 — RETURN FLIGHT
  // ═════════════════════════════════════════════════════════════
  _startReturn() {
    this.phase = 'returning';
    MusicManager.get().playLevel3Music('landing');
    this.phaseTimer = 0;
    this.facingRight = false;
    this.jetSprite.setFlipX(true);
    this.jetX = W - 280;
    this.jetY = 180;
    this.jetVX = -JET_SPEED;
    this._cleanupMissiles();
    this.returnTerrainStage = 0;
    this.returnDistance = 0;

    this.groundTile.setTexture('mountain_ground');
    this.farTerrain.setVisible(true);

    this.instrText.setText('LEFT to return \u2014 ARROWS to move');
    this.instrText.setColor('#888888');

    this.ambientRef = SoundManager.get().playJetEngine();
  }

  _updateReturn(dt) {
    this.phaseTimer += dt;

    // Horizontal speed: LEFT accelerates return, RIGHT slows it
    const accel = 300;
    if (this.keys.left.isDown) {
      this.jetVX = Math.max(-400, this.jetVX - accel * dt);
      this.facingRight = false;
    } else if (this.keys.right.isDown) {
      this.jetVX = Math.min(-60, this.jetVX + accel * dt);
      this.facingRight = true;
    } else {
      // Drift to base return speed
      const diff = -JET_SPEED - this.jetVX;
      this.jetVX += Math.sign(diff) * Math.min(Math.abs(diff), 150 * dt);
      this.facingRight = false;
    }

    // Vertical movement
    const vSpeed = 150;
    if (this.keys.up.isDown) this.jetY = Math.max(60, this.jetY - vSpeed * dt);
    if (this.keys.down.isDown) this.jetY = Math.min(GROUND_Y - 40, this.jetY + vSpeed * dt);

    // Jet screen X drifts with speed difference
    const targetX = (W - 280) + (this.jetVX + JET_SPEED) * 0.6;
    this.jetX += (targetX - this.jetX) * 3 * dt;
    this.jetX = Phaser.Math.Clamp(this.jetX, 60, W - 60);

    this.jetSprite.setFlipX(!this.facingRight);
    this.jetSprite.setPosition(this.jetX, this.jetY);

    // Scroll world (negative = scrolling right/returning)
    this._scrollLayers(this.jetVX, dt);
    this.returnDistance += Math.abs(this.jetVX) * dt;

    // Terrain reverse transitions (distance-based)
    if (this.returnDistance > RETURN_COAST_DIST && this.returnTerrainStage === 0) {
      this.returnTerrainStage = 1;
      this.groundTile.setTexture('coast_ground');
      this.instrText.setText('Passing over Lebanon...');
    }
    if (this.returnDistance > RETURN_SEA_DIST && this.returnTerrainStage === 1) {
      this.returnTerrainStage = 2;
      this.groundTile.setTexture('sea_surface');
      this.farTerrain.setVisible(false);
      this.instrText.setText('Over the sea... carrier ahead');
    }

    // Distance HUD
    const distKm = Math.max(0, Math.round(160 * (1 - this.returnDistance / RETURN_CARRIER_DIST)));
    this.hudDist.setText(`CARRIER: ${distKm} km`);

    // Transition to landing when back at carrier
    if (this.returnDistance >= RETURN_CARRIER_DIST) {
      this._stopAmbient();
      this._startLanding();
    }
  }

  // ═════════════════════════════════════════════════════════════
  // PHASE 6 — LANDING
  // ═════════════════════════════════════════════════════════════
  _startLanding() {
    this.phase = 'landing';
    this.landingDescending = false;
    this.landingRetries = 0;
    this.facingRight = false;
    this.jetSprite.setFlipX(true);
    this.jetX = W - 150;
    this.jetY = 180;

    // Carrier appears from left
    this.carrierSprite.setVisible(true);
    this.carrierSprite.setPosition(-200, GROUND_Y - 10);
    this.tweens.add({
      targets: this.carrierSprite, x: 240, duration: 2000, ease: 'Quad.easeOut',
    });

    this.groundTile.setTexture('sea_surface');

    this.instrText.setText('LEFT/RIGHT to align \u2014 DOWN to descend');
    this.instrText.setColor('#ffaa00');

    SoundManager.get().playLandingGear();
  }

  _updateLanding(dt) {
    // Player controls
    const hSpeed = 120;
    if (this.keys.left.isDown) this.jetX = Math.max(48, this.jetX - hSpeed * dt);
    if (this.keys.right.isDown) this.jetX = Math.min(W - 48, this.jetX + hSpeed * dt);

    // Descend with DOWN or S
    if (this.keys.down.isDown || this.keys.s.isDown) {
      this.landingDescending = true;
    }

    if (this.landingDescending) {
      this.jetY += 80 * dt; // descent rate
      this.jetX -= 40 * dt; // approach from right, moving left
    }

    // Altitude control (UP to pull up)
    if (this.keys.up.isDown && this.landingDescending) {
      this.jetY -= 30 * dt; // slow climb if pulling up
    }

    this.jetSprite.setPosition(this.jetX, this.jetY);

    // Check landing
    if (this.jetY >= DECK_Y) {
      // On the deck — check if over carrier (carrier deck x: ~40 to ~460 relative to carrier at x=240)
      const carrierLeft = this.carrierSprite.x - 200;
      const carrierRight = this.carrierSprite.x + 200;

      if (this.jetX >= carrierLeft && this.jetX <= carrierRight) {
        // Successful landing
        this.jetY = DECK_Y;
        this.jetSprite.setPosition(this.jetX, this.jetY);

        // Landing quality based on alignment with carrier center
        const carrierCenterX = this.carrierSprite.x;
        const offset = Math.abs(this.jetX - carrierCenterX);
        if (offset < 50) {
          this.landingQuality = 'perfect';
          this.instrText.setText('PERFECT LANDING!');
          this.instrText.setColor('#00ff00');
        } else if (offset < 120) {
          this.landingQuality = 'good';
          this.instrText.setText('GOOD LANDING');
          this.instrText.setColor('#88ff00');
        } else {
          this.landingQuality = 'rough';
          this.instrText.setText('ROUGH LANDING');
          this.instrText.setColor('#ff8800');
        }

        this.phase = 'landed';
        this.time.delayedCall(2000, () => this._showVictory());
      } else {
        // Missed the carrier — wave off
        if (this.landingRetries < 1) {
          this.landingRetries++;
          this.instrText.setText('WAVE OFF \u2014 Go around!');
          this.instrText.setColor('#ff4444');
          SoundManager.get().playMissileWarning();
          this.landingDescending = false;
          this.jetY = 180;
          this.jetX = W - 150;
          this.time.delayedCall(1500, () => {
            if (this.phase === 'landing') {
              this.instrText.setText('LEFT/RIGHT to align \u2014 DOWN to descend');
              this.instrText.setColor('#ffaa00');
            }
          });
        } else {
          this.landingQuality = 'rough';
          this.instrText.setText('ROUGH LANDING');
          this.instrText.setColor('#ff8800');
          SoundManager.get().playLandingGear();
          this.jetY = DECK_Y;
          this.phase = 'landed';
          this.time.delayedCall(2000, () => this._showVictory());
        }
      }
    }

    // Prevent going too low (into sea)
    if (this.jetY > GROUND_Y + 20 && this.phase === 'landing') {
      this.jetY = 180;
      this.jetX = W - 150;
      this.landingDescending = false;
      this.instrText.setText('TOO LOW \u2014 Try again');
      this.instrText.setColor('#ff4444');
    }
  }

  // ═════════════════════════════════════════════════════════════
  // VICTORY / RESULTS
  // ═════════════════════════════════════════════════════════════
  _showVictory() {
    this.phase = 'victory';
    this.instrText.setVisible(false);
    MusicManager.get().stop(1);

    const layersDestroyed = BUNKER_LAYERS - Math.max(0, this.bunkerHP);
    const missionSuccess = layersDestroyed >= BUNKER_LAYERS;

    if (missionSuccess) SoundManager.get().playVictory();

    // Black overlay
    this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.85).setDepth(40);

    // Title
    const titleText = missionSuccess ? 'MISSION COMPLETE' : 'MISSION FAILED';
    const titleColor = missionSuccess ? '#FFD700' : '#ff4444';
    const title = this.add.text(W / 2, 55, titleText, {
      fontFamily: 'monospace', fontSize: '30px', color: titleColor,
      shadow: { offsetX: 0, offsetY: 0, color: titleColor, blur: 16, fill: true },
    }).setOrigin(0.5).setDepth(41).setAlpha(0);
    this.tweens.add({ targets: title, alpha: 1, duration: 500 });

    // Subtitle
    const sub = this.add.text(W / 2, 90, 'OPERATION DEEP STRIKE', {
      fontFamily: 'monospace', fontSize: '14px', color: '#ffffff',
    }).setOrigin(0.5).setDepth(41).setAlpha(0);
    this.tweens.add({ targets: sub, alpha: 1, duration: 500, delay: 200 });

    // Separator
    const sep = this.add.rectangle(W / 2, 112, 300, 2, 0x00e5ff, 0.5).setDepth(41).setAlpha(0);
    this.tweens.add({ targets: sep, alpha: 1, duration: 300, delay: 400 });

    // Star rating
    let stars;
    if (layersDestroyed >= 5 && this.landingQuality === 'perfect') stars = '\u2605\u2605\u2605';
    else if (layersDestroyed >= 5 && this.landingQuality === 'good') stars = '\u2605\u2605\u2606';
    else if (layersDestroyed >= 3) stars = '\u2605\u2605\u2606';
    else stars = '\u2605\u2606\u2606';

    try { const sc = layersDestroyed >= 5 && this.landingQuality === 'perfect' ? 3 : (layersDestroyed >= 5 && this.landingQuality === 'good') || layersDestroyed >= 3 ? 2 : 1; localStorage.setItem('superzion_stars_3', String(sc)); } catch(e) {}

    const lines = [
      `BUNKER LAYERS PENETRATED: ${layersDestroyed}/${BUNKER_LAYERS}`,
      `BOMBS USED: ${this.bombsUsed}/${BOMB_TOTAL}`,
      `ARMOR REMAINING: ${Math.max(0, this.armor)}/3`,
      `LANDING: ${(this.landingQuality || 'N/A').toUpperCase()}`,
      `RATING: ${stars}`,
    ];

    let yPos = 140;
    lines.forEach((line, i) => {
      const t = this.add.text(W / 2, yPos, line, {
        fontFamily: 'monospace', fontSize: '14px', color: '#00e5ff',
      }).setOrigin(0.5).setDepth(41).setAlpha(0);
      this.tweens.add({ targets: t, alpha: 1, duration: 300, delay: 600 + i * 250 });
      yPos += 28;
    });

    // Separator 2
    this.time.delayedCall(2200, () => {
      this.add.rectangle(W / 2, yPos + 5, 280, 2, 0x00e5ff, 0.5).setDepth(41);
    });

    // Continue prompt
    this.time.delayedCall(2500, () => {
      const cont = this.add.text(W / 2, yPos + 30, 'PRESS ENTER TO CONTINUE', {
        fontFamily: 'monospace', fontSize: '18px', color: '#ffffff',
      }).setOrigin(0.5).setDepth(41);
      this.tweens.add({ targets: cont, alpha: 0.3, duration: 600, yoyo: true, repeat: -1 });
    });
  }

  // ═════════════════════════════════════════════════════════════
  // MAIN UPDATE LOOP
  // ═════════════════════════════════════════════════════════════
  update(time, delta) {
    const dt = delta / 1000;

    // Mute toggle
    if (Phaser.Input.Keyboard.JustDown(this.keys.m)) {
      const muted = SoundManager.get().toggleMute();
      MusicManager.get().setMuted(muted);
    }

    // ESC pause
    if (Phaser.Input.Keyboard.JustDown(this.keys.esc) && this.phase !== 'victory') {
      this._togglePause();
      return;
    }
    if (this.isPaused) return;

    // P key — debug skip to victory
    if (Phaser.Input.Keyboard.JustDown(this.keys.p) && this.phase !== 'victory') {
      this._stopAmbient();
      this.bunkerHP = 0;
      this.bombsUsed = 5;
      this.landingQuality = 'good';
      this.armor = 2;
      this._showVictory();
      return;
    }

    switch (this.phase) {
      case 'takeoff':
        this._updateTakeoff(dt);
        break;
      case 'launching':
        this._updateLaunching(dt);
        break;
      case 'flight':
        this._updateFlight(dt);
        break;
      case 'bombing':
        this._updateBombing(dt);
        break;
      case 'returning':
        this._updateReturn(dt);
        break;
      case 'landing':
        this._updateLanding(dt);
        break;
      case 'victory':
        if (Phaser.Input.Keyboard.JustDown(this.keys.enter) || Phaser.Input.Keyboard.JustDown(this.keys.space)) {
          this._stopAmbient();
          this.scene.start('UndergroundIntroCinematicScene');
        }
        break;
    }

    // Update shared systems
    if (this.phase !== 'victory') {
      this._updateExplosions(dt);
      this._updateHUD();
    }
    // Engine trail only during active flight phases
    const activePhases = ['takeoff', 'launching', 'flight', 'bombing', 'returning', 'landing'];
    if (activePhases.includes(this.phase)) {
      this._updateEngineTrail(dt);
    }
    // Clear distance HUD when not in flight/return
    if (this.phase !== 'flight' && this.phase !== 'returning') {
      this.hudDist.setText('');
    }
  }

  shutdown() {
    this._stopAmbient();
    this.tweens.killAll();
    this.time.removeAllEvents();
    for (const m of this.missiles) { m.sprite.destroy(); m.glow.destroy(); }
    this.missiles = [];
    for (const b of this.bombObjects) { b.sprite.destroy(); b.outline.destroy(); }
    this.bombObjects = [];
  }
}
