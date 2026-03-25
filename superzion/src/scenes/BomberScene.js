// ═══════════════════════════════════════════════════════════════
// BomberScene — Level 3: Operation Deep Strike (Side-Scrolling)
// 6-phase: Takeoff → Sea Flight → Coast → Bombing → Return → Landing
// + Victory/Results overlay
// ═══════════════════════════════════════════════════════════════

import Phaser from 'phaser';
import SoundManager from '../systems/SoundManager.js';
import MusicManager from '../systems/MusicManager.js';
import DifficultyManager from '../systems/DifficultyManager.js';
import { showVictoryScreen, showDefeatScreen } from '../ui/EndScreen.js';
import { showControlsOverlay, showTutorialOverlay } from '../ui/ControlsOverlay.js';
import {
  createF15SideSprite, createCarrierSide, createSunsetSky,
  createCloudLayer, createSeaSurface, createFarMountains,
  createCoastGround, createMountainGround, createValleyGround,
  createTurboTurbanSprite, createTurboTurbanYelling, createMiniSoldier,
} from '../utils/BomberTextures.js';

const W = 960;
const H = 540;
const GROUND_Y = 420;     // horizon / ground line
const DECK_Y = 395;       // carrier deck surface Y
const GRAVITY = 480;      // bomb gravity px/s²
const JET_SPEED = 440;    // base horizontal speed px/s (doubled for phase-23)
const BOMB_TOTAL = 8;
const BUNKER_LAYERS = 5;
const BUNKER_X = 480;     // bunker center X in bombing phase
const BUNKER_W = 200;     // bunker width
const BUNKER_TOP_Y = 340; // top of bunker
const LAYER_H = 20;       // each layer height

// Distance thresholds (scroll pixels) — shortened for intensity
const FLIGHT_COAST_DIST = 1500;
const FLIGHT_MTN_DIST = 2400;
const FLIGHT_TARGET_DIST = 3500;
const RETURN_COAST_DIST = 1100;
const RETURN_SEA_DIST = 2000;
const RETURN_CARRIER_DIST = 3100;

// SAM tracking constants
const SAM_TURN_RATE = 0.5;     // radians/sec — wider turning radius (lander rebalance)
const SAM_LIFETIME = 4.0;      // seconds before self-destruct
const SAM_SPEED = 182;         // px/s base speed (30% slower, phase-23)
const SAM_MAX_ON_SCREEN = 2;   // max simultaneous missiles on screen
const SAM_WARNING_TIME = 1.5;  // seconds of WARNING indicator before missile fires
const CHAFF_TOTAL = 5;
const FLAK_INTERVAL = 1.8;    // seconds between flak bursts

// Airplane-style jet physics constants
const JET_GRAVITY = 30;          // very mild — plane barely sinks when idle
const CLIMB_RATE = -180;         // vertical speed when pressing UP (negative = up)
const DIVE_RATE = 180;           // vertical speed when pressing DOWN
const VERT_LERP = 3.0;           // how fast vertical velocity responds to input
const VERT_DECAY = 2.0;          // how fast it levels out when no input
const TILT_MAX_DEG = 20;         // max visual tilt in degrees
const TILT_LERP_SPEED = 6;      // smooth tilt interpolation speed
const LANDING_CRASH_VY = 150;    // max safe landing descent speed — above this = crash

export default class BomberScene extends Phaser.Scene {
  constructor() { super('BomberScene'); }

  create() {
    this.cameras.main.setBackgroundColor('#000000');
    MusicManager.get().playLevel3Music('takeoff');

    // Controls overlay
    showControlsOverlay(this, 'ARROWS: Move | SPACE: Drop Bomb | C: Chaff | M: Mute');

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
    createTurboTurbanSprite(this);
    createTurboTurbanYelling(this);
    createMiniSoldier(this);

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
    this.crashed = false;
    this.takeoffAirborne = false;
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

    // Chaff state
    this.chaff = CHAFF_TOTAL;
    this.chaffCooldown = 0;
    this.chaffParticles = [];

    // Flak state
    this.flakTimer = 0;
    this.flakBursts = [];

    // SAM warning indicators
    this.samWarnings = [];

    // Wave-based SAM pattern (reduce RNG)
    this.samWaveIndex = 0;
    this.samWavePatterns = [
      // Each entry: side to spawn from, delay BEFORE this spawn
      { side: 'left', delay: 2.0 },
      { side: 'left', delay: 0.5 },
      { side: 'right', delay: 1.5 },
      { side: 'center', delay: 2.0 },
      { side: 'right', delay: 1.5 },
      { side: 'right', delay: 0.5 },
      { side: 'left', delay: 2.0 },
      { side: 'center', delay: 1.5 },
    ];
    this.samWaveTimer = 0;
    this.samWaveQueued = false;

    // Flak sine-wave pattern (reduce RNG)
    this.flakPatternIndex = 0;

    // Landing state
    this.landingRetries = 0;
    this.landingDescending = false;

    // Ambient
    this.ambientRef = null;

    // ── Persistent layers ──
    this._setupLayers();
    this._setupHUD();
    this._setupInput();

    // Check for checkpoint: if returning from crash, skip to return phase
    let hasCheckpoint = false;
    try {
      if (localStorage.getItem('superzion_checkpoint_l3') === 'return') {
        hasCheckpoint = true;
        localStorage.removeItem('superzion_checkpoint_l3');
      }
    } catch (e) { /* ignore */ }

    if (hasCheckpoint) {
      // Skip directly to return phase (bunker already destroyed)
      this.bunkerHP = 0;
      this.bombsUsed = BOMB_TOTAL;
      this._startReturn();
    } else {
      // Start Phase 1
      this._startTakeoff();
    }

    // Tutorial overlay (pauses gameplay until dismissed)
    showTutorialOverlay(this, [
      'LEVEL 3: OPERATION DEEP STRIKE',
      '',
      'UP/DOWN: Climb & Dive',
      'LEFT/RIGHT: Speed control',
      'SPACE: Drop bombs on the bunker',
      'C: Deploy chaff against missiles',
      'Land carefully on the carrier',
    ]);
  }

  // ═════════════════════════════════════════════════════════════
  // LAYER SETUP (persistent across phases)
  // ═════════════════════════════════════════════════════════════
  _setupLayers() {
    // Far sky (static background)
    this.skyBg = this.add.image(W / 2, H / 2, 'sunset_sky').setDepth(-10);

    // ── Enhanced sunset sky: gradient overlay from orange to purple with sun disc ──
    const sunsetGfx = this.add.graphics().setDepth(-9);
    // Orange-to-purple gradient bands
    sunsetGfx.fillStyle(0xff6633, 0.08);
    sunsetGfx.fillRect(0, H * 0.5, W, H * 0.15);
    sunsetGfx.fillStyle(0xff4488, 0.06);
    sunsetGfx.fillRect(0, H * 0.35, W, H * 0.15);
    sunsetGfx.fillStyle(0x6622aa, 0.05);
    sunsetGfx.fillRect(0, H * 0.15, W, H * 0.2);
    // Sun disc (near horizon)
    sunsetGfx.fillStyle(0xff6600, 0.25);
    sunsetGfx.fillCircle(W * 0.7, GROUND_Y - 30, 40);
    sunsetGfx.fillStyle(0xffaa33, 0.15);
    sunsetGfx.fillCircle(W * 0.7, GROUND_Y - 30, 55);
    sunsetGfx.fillStyle(0xff8844, 0.06);
    sunsetGfx.fillCircle(W * 0.7, GROUND_Y - 30, 80);

    // Clouds (slow parallax) — main layer
    this.cloudTile = this.add.tileSprite(W / 2, 100, W, 150, 'cloud_layer').setDepth(-7);

    // ── Extra cloud layers (different speeds, sizes) ──
    this.cloudTile2 = this.add.tileSprite(W / 2, 60, W, 120, 'cloud_layer')
      .setDepth(-8).setAlpha(0.3).setScale(1.5, 0.8);
    this.cloudTile3 = this.add.tileSprite(W / 2, 180, W, 100, 'cloud_layer')
      .setDepth(-6).setAlpha(0.15).setScale(0.7, 0.5);

    // Far mountains (mid parallax) — hidden during sea phases
    this.farTerrain = this.add.tileSprite(W / 2, GROUND_Y - 55, W, 250, 'far_mountains').setDepth(-5);
    this.farTerrain.setVisible(false);

    // Ground (near parallax)
    this.groundTile = this.add.tileSprite(W / 2, GROUND_Y + 60, W, 120, 'sea_surface').setDepth(1);

    // ── Ground detail overlay (drawn per-frame based on flight stage) ──
    this.groundDetailGfx = this.add.graphics().setDepth(1.5);

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
    this.hudChaff = this.add.text(150, 46, `CHAFF: ${CHAFF_TOTAL} [C]`, { ...hudStyle, color: '#88ccff' }).setDepth(30);

    this.hudAlt = this.add.text(W - 15, 12, 'ALT: 0m', { ...hudStyle, color: '#aaaaaa' })
      .setOrigin(1, 0).setDepth(30);
    this.hudSpeed = this.add.text(W - 15, 28, 'SPD: 0 kts', { ...hudStyle, color: '#aaaaaa' })
      .setOrigin(1, 0).setDepth(30);

    this.hudDist = this.add.text(W / 2, 12, '', {
      fontFamily: 'monospace', fontSize: '11px', color: '#00e5ff',
    }).setOrigin(0.5).setDepth(30);

    // Phase instruction text (center) with background
    this.instrBg = this.add.rectangle(W / 2, H - 35, 960, 28, 0x000000, 0.7)
      .setDepth(29);
    this.instrText = this.add.text(W / 2, H - 35, '', {
      fontFamily: 'monospace', fontSize: '14px', color: '#ffffff', fontStyle: 'bold',
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
      c: this.input.keyboard.addKey('C'),
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
      const opts = this.add.text(W / 2, H / 2 + 20, 'ESC — Resume  |  Q — Menu  |  M — Mute', {
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
    if (this.cloudTile2) this.cloudTile2.tilePositionX += dx * 0.04;
    if (this.cloudTile3) this.cloudTile3.tilePositionX += dx * 0.18;
    this.farTerrain.tilePositionX += dx * 0.3;
    this.groundTile.tilePositionX += dx * 0.8;

    // ── Ground detail: roads, building clusters, river ──
    if (this.groundDetailGfx) {
      this.groundDetailGfx.clear();
      const gd = this.groundDetailGfx;
      const baseY = GROUND_Y;
      const scrollOff = this.scrollX;

      if (this.flightTerrainStage === 0) {
        // SEA: tiny boat shapes and moonlight reflection
        gd.fillStyle(0xffffff, 0.06);
        // Moonlight streak
        for (let i = 0; i < 6; i++) {
          const sx = ((i * 170 + 50) - scrollOff * 0.2) % W;
          const shimmer = Math.sin(scrollOff * 0.01 + i) * 2;
          gd.fillRect(sx < 0 ? sx + W : sx, baseY + 10 + shimmer, 3, 12);
        }
      } else if (this.flightTerrainStage >= 1) {
        // LAND: tiny roads and building clusters
        const roadScroll = scrollOff * 0.8;

        // Tiny roads
        gd.lineStyle(1, 0x555555, 0.2);
        for (let i = 0; i < 3; i++) {
          const rx = ((i * 330 + 100) - roadScroll) % (W + 200) - 100;
          gd.lineBetween(rx, baseY + 5, rx, baseY + 90);
        }

        // Building clusters (small rectangles)
        gd.fillStyle(0x8a7a6a, 0.15);
        for (let i = 0; i < 8; i++) {
          const bx = ((i * 137 + 50) - roadScroll * 0.6) % (W + 100) - 50;
          const bh = 4 + (i % 3) * 3;
          gd.fillRect(bx, baseY + 15 + (i % 4) * 8, 6, bh);
        }

        // River/water (blue winding line) — only on coast/land
        if (this.flightTerrainStage === 1) {
          gd.lineStyle(2, 0x3366aa, 0.15);
          const riverX0 = (200 - roadScroll * 0.3) % W;
          gd.beginPath();
          gd.moveTo(riverX0, baseY + 10);
          for (let seg = 0; seg < 6; seg++) {
            const segX = riverX0 + seg * 30 + Math.sin(seg * 1.2) * 15;
            gd.lineTo(segX, baseY + 15 + seg * 12);
          }
          gd.strokePath();
        }
      }
    }
  }

  _updateHUD() {
    const alt = Math.max(0, Math.round((GROUND_Y - this.jetY) / GROUND_Y * 3000));
    // During flight/returning phases the jet scrolls at JET_SPEED; use that for HUD speed
    const effectiveSpeed = (this.phase === 'flight' || this.phase === 'returning') ? JET_SPEED : Math.abs(this.jetVX || 0);
    const spd = Math.round(effectiveSpeed * 1.8); // px/s to ~knots
    this.hudAlt.setText(`ALT: ${alt}m`);
    this.hudSpeed.setText(`SPD: ${spd} kts`);
    this.hudArmor.setText(`ARMOR: ${Math.max(0, this.armor)}/3`);
    this.hudArmor.setColor(this.armor <= 1 ? '#ff4444' : '#ffffff');
    this.hudBombs.setText(`BOMBS: ${this.bombs}`);
    this.hudChaff.setText(`CHAFF: ${this.chaff} [C]`);
    this.hudChaff.setColor(this.chaff <= 1 ? '#ff8844' : '#88ccff');
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
      if (m.trail) for (const t of m.trail) t.destroy();
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

    // Spawn circular explosion particles
    const colors = [0xff6600, 0xff8800, 0xffaa00, 0xff2200, 0xffdd00, 0xffffff];
    const count = Math.min(18, Math.max(8, Math.floor(radius / 2)));
    for (let i = 0; i < count; i++) {
      const pr = 1 + Math.random() * 3;
      const color = colors[Math.floor(Math.random() * colors.length)];
      const p = this.add.circle(x, y, pr, color, 0.9).setDepth(22);
      const angle = Math.random() * Math.PI * 2;
      const speed = 30 + Math.random() * 80;
      this.tweens.add({
        targets: p,
        x: x + Math.cos(angle) * speed,
        y: y + Math.sin(angle) * speed,
        scale: 0,
        alpha: 0,
        rotation: Math.random() * 6,
        duration: 300 + Math.random() * 400,
        ease: 'Quad.easeOut',
        onComplete: () => p.destroy(),
      });
    }
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

    this.instrText.setText('Engines spooling up... get ready to PULL UP!');

    this.ambientRef = SoundManager.get().playCarrierAmbient();
  }

  _updateTakeoff(dt) {
    // Automatic acceleration — the jet spools up on its own
    const takeoffAccel = 160; // px/s² auto-acceleration on deck
    this.jetVX = Math.min(JET_SPEED, this.jetVX + takeoffAccel * dt);

    this.jetX += this.jetVX * dt;

    const edgeX = 480;

    // Show speed indicator in HUD during takeoff
    const speedPct = Math.round((this.jetVX / JET_SPEED) * 100);

    if (!this.takeoffAirborne) {
      // On the deck
      this.jetY = DECK_Y;
      this.jetSprite.setFlipX(false);

      // Show "PULL UP!" when reaching half speed
      if (this.jetVX >= JET_SPEED / 2 && !this._pullUpHintShown) {
        this._pullUpHintShown = true;
        this.instrText.setText('PULL UP!  Press UP to launch!');
        this.instrText.setColor('#ff8800');
      } else if (!this._pullUpHintShown) {
        this.instrText.setText(`Accelerating... ${speedPct}%`);
        this.instrText.setColor('#aaaaaa');
      }

      // Player presses UP to launch — needs at least half speed
      if (this.keys.up.isDown && this.jetVX >= JET_SPEED / 2) {
        this._stopAmbient();
        SoundManager.get().playAfterburner();
        this.instrText.setText('');
        this.phase = 'launching';
        this.jetVY = -200;
        return;
      }

      // Reached carrier edge without pulling up — fall off!
      if (this.jetX > edgeX) {
        this.takeoffAirborne = true;
        this.jetVY = 0;
        // Last chance: if pulling up at the edge
        if (this.keys.up.isDown && this.jetVX >= JET_SPEED / 2) {
          this._stopAmbient();
          SoundManager.get().playAfterburner();
          this.phase = 'launching';
          this.jetVY = -200;
          return;
        }
        // Otherwise the plane is now falling off the carrier
        this.instrText.setText('PULL UP! PULL UP!');
        this.instrText.setColor('#ff0000');
      }
    } else {
      // Fell off carrier — heavier gravity pulls it into water
      this.jetVY += 300 * dt; // strong gravity when falling off edge
      // Player can still press UP to try to save it
      if (this.keys.up.isDown) {
        this.jetVY += CLIMB_RATE * VERT_LERP * dt; // apply climb response
      }
      this.jetY += this.jetVY * dt;

      // If managed to gain altitude, transition to launch
      if (this.jetVY < -50) {
        this._stopAmbient();
        SoundManager.get().playAfterburner();
        this.phase = 'launching';
        return;
      }

      // Crashed into water — splash explosion game over
      if (this.jetY >= GROUND_Y + 20) {
        this._splashCrash(this.jetX, GROUND_Y);
        return;
      }
    }

    // Visual tilt: smooth lerp based on vertical velocity
    const maxVY = 300; // reference for tilt normalization
    const targetTiltRad = this.takeoffAirborne
      ? Phaser.Math.Clamp(this.jetVY / maxVY, -1, 1) * Phaser.Math.DegToRad(TILT_MAX_DEG)
      : 0;
    const currentAngle = this.jetSprite.rotation || 0;
    this.jetSprite.setRotation(currentAngle + (targetTiltRad - currentAngle) * TILT_LERP_SPEED * dt);
    this.jetSprite.setPosition(this.jetX, this.jetY);
  }

  /** Splash crash into water — expanding splash circle + screen shake + game over */
  _splashCrash(x, y) {
    if (this.crashed) return;
    this.crashed = true;
    this.phase = 'dead';
    this._stopAmbient();

    SoundManager.get().playExplosion();
    this.cameras.main.shake(800, 0.06);

    if (this.jetSprite) this.jetSprite.setVisible(false);

    // Expanding white/blue splash circle
    const splashCircle = this.add.circle(x, y, 10, 0xaaddff, 0.9).setDepth(25);
    this.tweens.add({
      targets: splashCircle,
      scaleX: 12, scaleY: 8, alpha: 0,
      duration: 800, ease: 'Quad.easeOut',
      onComplete: () => splashCircle.destroy(),
    });
    // Inner white core
    const splashCore = this.add.circle(x, y, 6, 0xffffff, 0.95).setDepth(26);
    this.tweens.add({
      targets: splashCore,
      scaleX: 6, scaleY: 4, alpha: 0,
      duration: 500, ease: 'Quad.easeOut',
      onComplete: () => splashCore.destroy(),
    });

    // Water droplet particles spraying upward
    for (let i = 0; i < 16; i++) {
      const angle = -Math.PI * 0.1 - Math.random() * Math.PI * 0.8; // mostly upward arc
      const speed = 60 + Math.random() * 120;
      const droplet = this.add.circle(
        x + (Math.random() - 0.5) * 20,
        y,
        2 + Math.random() * 2,
        Math.random() > 0.5 ? 0x4488cc : 0xaaddff,
        0.8
      ).setDepth(24);
      this.tweens.add({
        targets: droplet,
        x: droplet.x + Math.cos(angle) * speed,
        y: droplet.y + Math.sin(angle) * speed,
        alpha: 0,
        duration: 400 + Math.random() * 400,
        onComplete: () => droplet.destroy(),
      });
    }

    // Fire explosion on impact
    for (let i = 0; i < 8; i++) {
      const ex = x + (Math.random() - 0.5) * 40;
      const ey = y + (Math.random() - 0.5) * 20;
      const r = 4 + Math.random() * 10;
      const color = [0xff4400, 0xff8800, 0xffcc00][Math.floor(Math.random() * 3)];
      const fireball = this.add.circle(ex, ey, r, color, 0.9).setDepth(25);
      this.tweens.add({
        targets: fireball,
        scaleX: 2, scaleY: 2, alpha: 0,
        duration: 400 + Math.random() * 300, delay: i * 30,
        onComplete: () => fireball.destroy(),
      });
    }

    // CRASHED text
    const crashText = this.add.text(W / 2, H / 2, 'CRASHED', {
      fontFamily: 'monospace', fontSize: '48px', color: '#ff4444',
      shadow: { offsetX: 0, offsetY: 0, color: '#ff4444', blur: 20, fill: true },
    }).setOrigin(0.5).setDepth(55).setAlpha(0);
    this.tweens.add({ targets: crashText, alpha: 1, duration: 500 });

    this.time.delayedCall(3000, () => {
      crashText.destroy();
      this._showVictory();
    });
  }

  _updateLaunching(dt) {
    // Jet climbs up and accelerates to cruise speed — afterburner power
    this.jetVX = Math.min(JET_SPEED, this.jetVX + 200 * dt); // accelerate to cruise
    this.jetX += this.jetVX * dt;
    this.jetY += this.jetVY * dt;
    this.jetVY += JET_GRAVITY * 0.3 * dt; // very mild gravity during climb-out

    // Visual tilt during launch: nose up
    const maxVY = 300;
    const targetTilt = Phaser.Math.Clamp(this.jetVY / maxVY, -1, 1) * Phaser.Math.DegToRad(TILT_MAX_DEG);
    const curAngle = this.jetSprite.rotation || 0;
    this.jetSprite.setRotation(curAngle + (targetTilt - curAngle) * TILT_LERP_SPEED * dt);
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
    this.flakTimer = 0;
    this.missiles = [];
    this.facingRight = true;
    this.jetVX = 0;
    this.jetVY = 0;
    this.flightDistance = 0;
    this.flightTerrainStage = 0;

    this.farTerrain.setVisible(false);
    this.groundTile.setTexture('sea_surface');

    this.instrText.setText('ARROWS to dodge \u2014 C for chaff \u2014 Approaching target...');
    this.instrText.setColor('#888888');

    this.ambientRef = SoundManager.get().playJetEngine();
  }

  _updateFlight(dt) {
    this.phaseTimer += dt;

    // CONSTANT horizontal scroll speed — the world always scrolls at JET_SPEED
    // but the player can move the jet LEFT/RIGHT on screen (matching bombing phase)
    const flightHorizSpeed = 200; // same as bombingHorizSpeed in phase 3
    if (this.keys.right.isDown) {
      this.jetVX += (flightHorizSpeed - this.jetVX) * 4 * dt;
    } else if (this.keys.left.isDown) {
      this.jetVX += (-flightHorizSpeed - this.jetVX) * 4 * dt;
    } else {
      // Decay horizontal velocity toward 0 when no input
      this.jetVX += (0 - this.jetVX) * 3 * dt;
    }
    this.jetX += this.jetVX * dt;
    this.jetX = Phaser.Math.Clamp(this.jetX, 60, W - 60);

    // Airplane vertical controls: UP = climb, DOWN = dive, nothing = level out
    if (this.keys.up.isDown) {
      // Lerp toward climb rate
      this.jetVY += (CLIMB_RATE - this.jetVY) * VERT_LERP * dt;
    } else if (this.keys.down.isDown) {
      // Lerp toward dive rate
      this.jetVY += (DIVE_RATE - this.jetVY) * VERT_LERP * dt;
    } else {
      // No input: decay toward 0 (level out) + very mild gravity sink
      this.jetVY += (0 - this.jetVY) * VERT_DECAY * dt;
      this.jetVY += JET_GRAVITY * dt;
    }

    this.jetVY = Phaser.Math.Clamp(this.jetVY, CLIMB_RATE * 1.2, DIVE_RATE * 1.2);
    this.jetY += this.jetVY * dt;

    if (this.jetY < 40) { this.jetY = 40; this.jetVY = Math.max(0, this.jetVY); }
    if (this.jetY >= GROUND_Y - 10) {
      this._crashJet(this.flightTerrainStage <= 1 ? 'water' : 'ground');
      return;
    }

    // Visual tilt: smooth lerp based on vy (climbing = nose up, diving = nose down)
    const maxVY = DIVE_RATE * 1.2;
    const tiltNorm = Phaser.Math.Clamp(this.jetVY / maxVY, -1, 1);
    const targetTilt = tiltNorm * Phaser.Math.DegToRad(TILT_MAX_DEG);
    const currentAngle = this.jetSprite.rotation || 0;
    this.jetSprite.setRotation(currentAngle + (targetTilt - currentAngle) * TILT_LERP_SPEED * dt);

    this.jetSprite.setPosition(this.jetX, this.jetY);

    // Scroll world at constant JET_SPEED (independent of on-screen horizontal movement)
    this._scrollLayers(JET_SPEED, dt);
    this.flightDistance += JET_SPEED * dt;

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

    // Distance HUD (scaled to shorter distance)
    const distKm = Math.max(0, Math.round(90 * (1 - this.flightDistance / FLIGHT_TARGET_DIST)));
    this.hudDist.setText(`TARGET: ${distKm} km`);

    // SAM missiles — wave-based pattern (predictable, not random)
    this.samWaveTimer += dt;
    const waveEntry = this.samWavePatterns[this.samWaveIndex % this.samWavePatterns.length];
    const waveDelay = waveEntry.delay * this.dm.spawnRateMult();
    if (this.samWaveTimer >= waveDelay) {
      this.samWaveTimer = 0;
      // Predictable X based on wave side
      let spawnX;
      if (waveEntry.side === 'left') spawnX = 120 + (this.samWaveIndex % 3) * 40;
      else if (waveEntry.side === 'right') spawnX = W - 120 - (this.samWaveIndex % 3) * 40;
      else spawnX = W / 2 + ((this.samWaveIndex % 2) * 2 - 1) * 60;
      this._spawnMissile(spawnX, GROUND_Y + 20, 0);
      this.samWaveIndex++;
    }

    // Flak bursts — sine-wave pattern (predictable Y positions)
    this.flakTimer += dt;
    if (this.flakTimer >= FLAK_INTERVAL) {
      this.flakTimer = 0;
      this._spawnFlak();
    }

    this._updateMissiles(dt);
    this._updateChaff(dt);

    // Chaff deployment
    if (Phaser.Input.Keyboard.JustDown(this.keys.c)) {
      this._deployChaff();
    }

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

  _spawnMissile(x, y, _vy) {
    // WARNING indicator before missile fires — blinking "WARNING" text + arrow
    const warn = this.add.text(x, H - 20, '\u25B2', {
      fontFamily: 'monospace', fontSize: '16px', color: '#ff3333',
    }).setOrigin(0.5).setDepth(20);
    const warnText = this.add.text(x, H - 38, 'WARNING', {
      fontFamily: 'monospace', fontSize: '9px', color: '#ff3333', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(20);
    // Blink both warning elements
    const blinkRepeats = Math.floor(SAM_WARNING_TIME / 0.3) - 1;
    this.tweens.add({
      targets: warn, alpha: 0.2, duration: 150, yoyo: true, repeat: blinkRepeats,
    });
    this.tweens.add({
      targets: warnText, alpha: 0.2, duration: 150, yoyo: true, repeat: blinkRepeats,
    });
    // Play warning sound
    SoundManager.get().playMissileWarning();
    // Spawn the actual missile after warning period
    this.time.delayedCall(SAM_WARNING_TIME * 1000, () => {
      warn.destroy();
      warnText.destroy();
      if (this.missiles.length >= SAM_MAX_ON_SCREEN) return; // max missiles on screen
      const m = this.add.circle(x, y, 3, 0xff3333).setDepth(8);
      const glow = this.add.circle(x, y, 5, 0xff0000, 0.3).setDepth(7);
      const spdMult = this.dm.missileSpeedMult();
      const speed = SAM_SPEED * spdMult;
      // Initial angle: toward jet
      const dx = this.jetX - x;
      const dy = this.jetY - y;
      const angle = Math.atan2(dy, dx);
      this.missiles.push({
        sprite: m, glow, x, y,
        angle,
        speed,
        life: SAM_LIFETIME,
        trail: [],
      });
    });
  }

  _spawnFlak() {
    // Predictable sine-wave pattern for flak positions
    const idx = this.flakPatternIndex++;
    const fx = 100 + ((idx * 137 + 80) % (W - 200)); // distributed across screen width
    const fy = 165 + Math.sin(idx * 0.8) * 85; // sine wave Y between 80-250

    // RED FLASH telegraph 1 second before detonation
    const flashY = fy;
    const warnFlash = this.add.circle(fx, flashY, 25, 0xff0000, 0.35).setDepth(24);
    const warnCross = this.add.text(fx, flashY, '+', {
      fontFamily: 'monospace', fontSize: '20px', color: '#ff4444',
    }).setOrigin(0.5).setDepth(25).setAlpha(0.6);

    this.tweens.add({
      targets: warnFlash, scale: 1.8, alpha: 0.6, duration: 250,
      yoyo: true, repeat: 1,
    });
    this.tweens.add({
      targets: warnCross, alpha: 0.9, duration: 200,
      yoyo: true, repeat: 1,
    });

    // Actual flak detonates after 1s warning
    this.time.delayedCall(1000, () => {
      warnFlash.destroy();
      warnCross.destroy();
      const burst = this.add.circle(fx, fy, 8, 0xff8800, 0.7).setDepth(6);
      this.tweens.add({
        targets: burst, scaleX: 4, scaleY: 4, alpha: 0,
        duration: 800, ease: 'Quad.easeOut',
        onComplete: () => burst.destroy(),
      });
      // Damage check — if jet is close when flak detonates
      const dx = fx - this.jetX;
      const dy = fy - this.jetY;
      if (Math.sqrt(dx * dx + dy * dy) < 40) {
        this._takeDamage();
      }
      this.flakBursts.push({ x: fx, y: fy });
    });
  }

  _updateMissiles(dt) {
    for (let i = this.missiles.length - 1; i >= 0; i--) {
      const m = this.missiles[i];
      m.life -= dt;

      // Self-destruct after lifetime
      if (m.life <= 0) {
        this._addExplosion(m.x, m.y, 15);
        m.sprite.destroy(); m.glow.destroy();
        // Clean up trail
        for (const t of m.trail) t.destroy();
        this.missiles.splice(i, 1);
        continue;
      }

      // Tracking: turn toward jet (limited turn rate = wide radius)
      if (m.angle !== undefined) {
        const dx = this.jetX - m.x;
        const dy = this.jetY - m.y;
        const targetAngle = Math.atan2(dy, dx);
        let angleDiff = targetAngle - m.angle;
        // Normalize to [-PI, PI]
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        const maxTurn = SAM_TURN_RATE * dt;
        m.angle += Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), maxTurn);
        m.vx = Math.cos(m.angle) * m.speed;
        m.vy = Math.sin(m.angle) * m.speed;
      }

      m.x += m.vx * dt;
      m.y += m.vy * dt;
      m.sprite.setPosition(m.x, m.y);
      m.glow.setPosition(m.x, m.y);

      // Smoke trail — boss missiles get thicker, more visible trails
      const trailChance = m.isBossMissile ? 0.8 : 0.6;
      const trailColor = m.isBossMissile ? 0xff4444 : 0xcc4444;
      const trailRadius = m.isBossMissile ? 2.5 : 1.5;
      const trailAlpha = m.isBossMissile ? 0.6 : 0.4;
      if (Math.random() < trailChance) {
        const tp = this.add.circle(m.x, m.y, trailRadius, trailColor, trailAlpha).setDepth(m.sprite.depth - 1);
        m.trail.push(tp);
        this.tweens.add({
          targets: tp, alpha: 0, scale: 0.3, duration: 400,
          onComplete: () => { tp.destroy(); const idx = m.trail.indexOf(tp); if (idx >= 0) m.trail.splice(idx, 1); },
        });
      }

      // Hit detection
      const hdx = m.x - this.jetX;
      const hdy = m.y - this.jetY;
      if (Math.sqrt(hdx * hdx + hdy * hdy) < 18) {
        this._takeDamage();
        this._addExplosion(m.x, m.y, 18);
        m.sprite.destroy(); m.glow.destroy();
        for (const t of m.trail) t.destroy();
        this.missiles.splice(i, 1);
        continue;
      }

      // Off screen (generous bounds for tracking missiles)
      if (m.y < -60 || m.y > H + 60 || m.x < -60 || m.x > W + 60) {
        m.sprite.destroy(); m.glow.destroy();
        for (const t of m.trail) t.destroy();
        this.missiles.splice(i, 1);
      }
    }
  }

  // ── CHAFF SYSTEM ──
  _deployChaff() {
    if (this.chaff <= 0 || this.chaffCooldown > 0) return;
    this.chaff--;
    this.chaffCooldown = 1.0; // 1 second cooldown

    SoundManager.get().playAfterburner(); // reuse afterburner sound for chaff

    // Spawn chaff particles
    for (let i = 0; i < 12; i++) {
      const px = this.jetX + (Math.random() - 0.5) * 20;
      const py = this.jetY + (Math.random() - 0.5) * 20;
      const p = this.add.circle(px, py, 2, 0xffffff, 0.9).setDepth(12);
      const vx = (Math.random() - 0.5) * 200;
      const vy = (Math.random() - 0.5) * 200;
      this.chaffParticles.push({ sprite: p, x: px, y: py, vx, vy, life: 1.2 });
    }

    // Divert nearest tracking missile toward chaff cloud
    let nearest = null;
    let nearDist = Infinity;
    const chaffX = this.jetX;
    const chaffY = this.jetY;
    for (const m of this.missiles) {
      const dx = m.x - chaffX;
      const dy = m.y - chaffY;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < nearDist) { nearDist = d; nearest = m; }
    }
    if (nearest && nearDist < 300) {
      // Force missile to target chaff position — it will fly past and explode
      nearest.life = Math.min(nearest.life, 0.6); // explode soon
      const dx = chaffX - nearest.x;
      const dy = chaffY - nearest.y;
      nearest.angle = Math.atan2(dy, dx) + (Math.random() - 0.5) * 0.5;
      // Visual feedback — missile glow turns white briefly
      nearest.glow.setFillStyle(0xffffff, 0.6);
      this.time.delayedCall(300, () => {
        if (nearest.glow && nearest.glow.scene) nearest.glow.setFillStyle(0xff0000, 0.3);
      });
    }
  }

  _updateChaff(dt) {
    if (this.chaffCooldown > 0) this.chaffCooldown -= dt;
    for (let i = this.chaffParticles.length - 1; i >= 0; i--) {
      const p = this.chaffParticles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.95; p.vy *= 0.95;
      p.sprite.setPosition(p.x, p.y);
      p.sprite.setAlpha(Math.max(0, p.life * 0.8));
      if (p.life <= 0) { p.sprite.destroy(); this.chaffParticles.splice(i, 1); }
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
    this.jetVY = 0;
    this.jetY = 150;
    this.jetVX = 0; // hovering over target area — no constant forward speed

    // Change ground to valley
    this.groundTile.setTexture('valley_ground');
    this.farTerrain.setVisible(true);

    // ── BUNKER with visible interior (cross-section / diorama) ──
    const bunkW = BUNKER_W + 40; // wider bunker for interior
    const bunkH = BUNKER_LAYERS * LAYER_H + 10;
    const bunkLeft = BUNKER_X - bunkW / 2;
    const bunkTop = BUNKER_TOP_Y - 5;

    // Interior background (dark room visible through "cut" wall)
    this.bunkerInteriorGfx = this.add.graphics().setDepth(2);
    this._drawBunkerInterior(bunkLeft, bunkTop, bunkW, bunkH);

    // Draw bunker layers as game objects (outer shell)
    this.bunkerLayerSprites = [];
    const colors = [0x8a8a92, 0x7a7a82, 0x6a6a72, 0x5a5a62, 0x4a4a52];
    for (let i = 0; i < BUNKER_LAYERS; i++) {
      const ly = BUNKER_TOP_Y + i * LAYER_H;
      // Left wall piece (leaves center exposed)
      const leftW = 30;
      const layer = this.add.rectangle(bunkLeft + leftW / 2, ly + LAYER_H / 2, leftW, LAYER_H - 2, colors[i]).setDepth(4);
      // Right wall piece
      const rightW = 30;
      const rLayer = this.add.rectangle(bunkLeft + bunkW - rightW / 2, ly + LAYER_H / 2, rightW, LAYER_H - 2, colors[i]).setDepth(4);
      // Top/bottom structural bars
      const topBar = this.add.rectangle(BUNKER_X, ly + 1, bunkW - 60, 3, colors[i]).setDepth(4).setAlpha(0.6);
      // Edge stroke
      const edge = this.add.rectangle(BUNKER_X, ly + LAYER_H / 2, bunkW, LAYER_H - 2).setDepth(4);
      edge.setStrokeStyle(1, 0x999999, 0.3);
      edge.setFillStyle();
      this.bunkerLayerSprites.push({ rect: layer, rLayer, topBar, edge, alive: true });
    }

    // ── BOSS — Turbo Turban sitting at console inside bunker ──
    this.bossSprite = this.add.image(BUNKER_X, BUNKER_TOP_Y + 36, 'turbo_turban').setDepth(3);
    this.bossSprite.setScale(0.55);
    this.bossYellSprite = this.add.image(BUNKER_X, BUNKER_TOP_Y + 36, 'turbo_turban_yell').setDepth(3);
    this.bossYellSprite.setScale(0.55);
    this.bossYellSprite.setVisible(false);
    this.bossIsYelling = false;
    this.bossYellTimer = 0;

    // Boss breathing idle animation
    this.tweens.add({
      targets: [this.bossSprite, this.bossYellSprite],
      scaleY: 0.55 * 1.03,
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Boss missile state
    this.bossMissileTimer = 0;
    this.bossBurstTimer = 0;
    this.bossBurstCooldown = 10; // every 10s
    this.bossFireRate = 3.5; // single missile every 3.5s
    this.bossDamageStage = 0; // 0-4 progressive damage

    // ── Console in front of boss ──
    this.consoleSprite = this.add.rectangle(BUNKER_X, BUNKER_TOP_Y + 65, 50, 12, 0x2a2a3a).setDepth(3);
    this.add.rectangle(BUNKER_X, BUNKER_TOP_Y + 62, 44, 6, 0x1144aa, 0.5).setDepth(3).setName('boss_console_screen');

    // ── Interior screens (glowing monitors) ──
    this.interiorScreens = [];
    const screenPositions = [
      { x: bunkLeft + 40, y: bunkTop + 15 },
      { x: bunkLeft + 55, y: bunkTop + 15 },
      { x: bunkLeft + bunkW - 40, y: bunkTop + 15 },
      { x: bunkLeft + bunkW - 55, y: bunkTop + 15 },
      { x: bunkLeft + 40, y: bunkTop + 55 },
      { x: bunkLeft + bunkW - 40, y: bunkTop + 55 },
    ];
    for (const sp of screenPositions) {
      const scr = this.add.rectangle(sp.x, sp.y, 10, 8, 0x114488, 0.6).setDepth(3);
      const glow = this.add.rectangle(sp.x, sp.y, 12, 10, 0x2266aa, 0.15).setDepth(3);
      this.interiorScreens.push({ rect: scr, glow, alive: true });
    }

    // ── Mini soldiers (decorative) ──
    this.miniSoldiers = [];
    const soldierPos = [
      { x: bunkLeft + 44, y: BUNKER_TOP_Y + 54 },
      { x: bunkLeft + 58, y: BUNKER_TOP_Y + 56 },
      { x: bunkLeft + bunkW - 44, y: BUNKER_TOP_Y + 54 },
      { x: bunkLeft + bunkW - 56, y: BUNKER_TOP_Y + 58 },
    ];
    for (const sp of soldierPos) {
      const s = this.add.image(sp.x, sp.y, 'mini_soldier').setDepth(3).setScale(0.8);
      this.miniSoldiers.push({ sprite: s, origX: sp.x, origY: sp.y, fleeing: false });
    }

    // ── Damage effects container ──
    this.bunkerDamageGfx = this.add.graphics().setDepth(3.5);
    this.bunkerSmokeParticles = [];

    // Turrets near bunker
    this.turretSprites = [];
    const turretPos = [
      { x: BUNKER_X - 150, y: GROUND_Y - 10 },
      { x: BUNKER_X + 150, y: GROUND_Y - 10 },
    ];
    for (const tp of turretPos) {
      const ts = this.add.rectangle(tp.x, tp.y, 12, 10, 0xaa2020).setDepth(3);
      this.turretSprites.push({ sprite: ts, x: tp.x, y: tp.y, fireTimer: 1 + Math.random() * 2 });
    }

    // Camouflage netting (decorative)
    this.camoGfx = this.add.graphics().setDepth(2);
    this.camoGfx.fillStyle(0x3a5530, 0.3);
    this.camoGfx.fillRect(BUNKER_X - 130, BUNKER_TOP_Y - 12, 260, 15);

    // ── BUNKER AREA DETAIL: walls, guard towers, road ──
    const bunkerAreaGfx = this.add.graphics().setDepth(1.5);

    // Perimeter wall (rectangular outline around bunker complex)
    bunkerAreaGfx.lineStyle(2, 0x6a6a5a, 0.4);
    bunkerAreaGfx.strokeRect(BUNKER_X - 200, BUNKER_TOP_Y - 30, 400, GROUND_Y - BUNKER_TOP_Y + 30);

    // Road leading to bunker (from left edge to bunker entrance)
    bunkerAreaGfx.lineStyle(3, 0x555550, 0.3);
    bunkerAreaGfx.lineBetween(0, GROUND_Y - 5, BUNKER_X - 200, GROUND_Y - 5);
    // Road dashes
    bunkerAreaGfx.lineStyle(1, 0x888880, 0.2);
    for (let rx = 10; rx < BUNKER_X - 200; rx += 20) {
      bunkerAreaGfx.lineBetween(rx, GROUND_Y - 5, rx + 10, GROUND_Y - 5);
    }

    // Guard towers (4 corners of perimeter)
    const towerPositions = [
      { x: BUNKER_X - 200, y: BUNKER_TOP_Y - 30 },
      { x: BUNKER_X + 200, y: BUNKER_TOP_Y - 30 },
      { x: BUNKER_X - 200, y: GROUND_Y },
      { x: BUNKER_X + 200, y: GROUND_Y },
    ];
    for (const tp of towerPositions) {
      // Tower base (rectangle)
      bunkerAreaGfx.fillStyle(0x6a6a5a, 0.5);
      bunkerAreaGfx.fillRect(tp.x - 6, tp.y - 12, 12, 12);
      // Tower roof (triangle)
      bunkerAreaGfx.fillStyle(0x555550, 0.5);
      bunkerAreaGfx.beginPath();
      bunkerAreaGfx.moveTo(tp.x - 8, tp.y - 12);
      bunkerAreaGfx.lineTo(tp.x, tp.y - 20);
      bunkerAreaGfx.lineTo(tp.x + 8, tp.y - 12);
      bunkerAreaGfx.closePath();
      bunkerAreaGfx.fillPath();
      // Searchlight dot
      bunkerAreaGfx.fillStyle(0xffff88, 0.3);
      bunkerAreaGfx.fillCircle(tp.x, tp.y - 16, 2);
    }

    // Inner compound fence (dotted line)
    bunkerAreaGfx.lineStyle(1, 0x888880, 0.2);
    const innerX = BUNKER_X - 160, innerY = BUNKER_TOP_Y - 15;
    const innerW = 320, innerH = GROUND_Y - BUNKER_TOP_Y + 10;
    for (let fx = innerX; fx < innerX + innerW; fx += 8) {
      bunkerAreaGfx.lineBetween(fx, innerY, fx + 4, innerY);
      bunkerAreaGfx.lineBetween(fx, innerY + innerH, fx + 4, innerY + innerH);
    }

    this.instrText.setText('ARROWS to position \u2014 SPACE to drop bomb');
    this.instrText.setColor('#ff8800');

    this.ambientRef = SoundManager.get().playJetEngine();
  }

  _drawBunkerInterior(x, y, w, h) {
    const g = this.bunkerInteriorGfx;
    // Dark room interior
    g.fillStyle(0x0a0a14, 0.9);
    g.fillRect(x + 5, y + 2, w - 10, h - 4);
    // Floor
    g.fillStyle(0x1a1a24, 1);
    g.fillRect(x + 5, y + h - 10, w - 10, 8);
    // Grid lines on floor
    g.lineStyle(0.5, 0x222233, 0.3);
    for (let lx = x + 15; lx < x + w - 10; lx += 12) {
      g.lineBetween(lx, y + h - 10, lx, y + h - 2);
    }
  }

  _updateBossAttacks(dt) {
    if (!this.bossSprite || !this.bossSprite.active) return;

    this.bossMissileTimer += dt;
    this.bossBurstTimer += dt;

    // Boss yelling animation
    if (this.bossIsYelling) {
      this.bossYellTimer -= dt;
      if (this.bossYellTimer <= 0) {
        this.bossIsYelling = false;
        this.bossSprite.setVisible(true);
        this.bossYellSprite.setVisible(false);
      }
    }

    // Single heavy missile — with 0.5s red flash telegraph
    if (this.bossMissileTimer >= this.bossFireRate && !this._bossTelegraphing) {
      this.bossMissileTimer = 0;
      this._bossTelegraphing = true;
      // Red flash telegraph on boss position
      const bossFlash = this.add.circle(BUNKER_X, BUNKER_TOP_Y + 20, 20, 0xff0000, 0.5).setDepth(25);
      this.tweens.add({
        targets: bossFlash, scale: 2, alpha: 0.8, duration: 150,
        yoyo: true, repeat: 1,
        onComplete: () => bossFlash.destroy(),
      });
      this.time.delayedCall(500, () => {
        this._bossTelegraphing = false;
        this._fireBossMissile(0);
        this._setBossYelling(1.0);
      });
    }

    // Burst of 3 in a fan every 10s — with 0.5s red flash telegraph
    if (this.bossBurstTimer >= this.bossBurstCooldown && !this._bossBurstTelegraphing) {
      this.bossBurstTimer = 0;
      this._bossBurstTelegraphing = true;
      // Larger red flash for burst warning
      const burstFlash = this.add.circle(BUNKER_X, BUNKER_TOP_Y + 20, 30, 0xff0000, 0.6).setDepth(25);
      this.tweens.add({
        targets: burstFlash, scale: 2.5, alpha: 0.9, duration: 120,
        yoyo: true, repeat: 1,
        onComplete: () => burstFlash.destroy(),
      });
      SoundManager.get().playMissileWarning();
      this.time.delayedCall(500, () => {
        this._bossBurstTelegraphing = false;
        this._fireBossMissile(-0.3);
        this._fireBossMissile(0);
        this._fireBossMissile(0.3);
        this._setBossYelling(1.5);
      });
    }
  }

  _fireBossMissile(angleOffset) {
    if (this.missiles.length >= 4) return; // allow more missiles with boss (phase-23: reduced from 5)
    const bx = BUNKER_X;
    const by = BUNKER_TOP_Y + 20;
    const dx = this.jetX - bx;
    const dy = this.jetY - by;
    const angle = Math.atan2(dy, dx) + angleOffset;
    const spdMult = this.dm.missileSpeedMult();
    const speed = (SAM_SPEED + 28) * spdMult; // boss missiles slightly faster (phase-23: proportional)

    // Visual: bigger, redder missile
    const m = this.add.circle(bx, by, 5, 0xff2222).setDepth(8);
    const glow = this.add.circle(bx, by, 8, 0xff0000, 0.4).setDepth(7);

    this.missiles.push({
      sprite: m, glow, x: bx, y: by,
      angle,
      speed,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: SAM_LIFETIME + 1, // longer life
      trail: [],
      isBossMissile: true,
    });
    SoundManager.get().playMissilePass();
  }

  _setBossYelling(duration) {
    this.bossIsYelling = true;
    this.bossYellTimer = duration;
    SoundManager.get().playMidBossRoar();
    if (this.bossSprite && this.bossSprite.active) {
      this.bossSprite.setVisible(false);
      this.bossYellSprite.setVisible(true);
    }
  }

  _updateBunkerDamage(layerIdx) {
    this.bossDamageStage = layerIdx;
    const bunkW = BUNKER_W + 40;
    const bunkLeft = BUNKER_X - bunkW / 2;
    const bunkTop = BUNKER_TOP_Y - 5;

    const g = this.bunkerDamageGfx;
    g.clear();

    // Progressive damage effects
    if (layerIdx >= 1) {
      // Smoke enters interior, one screen breaks
      g.fillStyle(0x333333, 0.2);
      g.fillCircle(BUNKER_X - 30, BUNKER_TOP_Y + 20, 15);
      if (this.interiorScreens[0] && this.interiorScreens[0].alive) {
        this.interiorScreens[0].alive = false;
        this.interiorScreens[0].rect.setFillStyle(0x110808, 1);
        this.interiorScreens[0].glow.setAlpha(0);
      }
    }
    if (layerIdx >= 2) {
      // More screens broken, ceiling debris
      g.fillStyle(0x555544, 0.3);
      g.fillRect(BUNKER_X - 20, bunkTop + 8, 8, 4);
      g.fillRect(BUNKER_X + 10, bunkTop + 10, 6, 5);
      for (let i = 1; i < 3; i++) {
        if (this.interiorScreens[i] && this.interiorScreens[i].alive) {
          this.interiorScreens[i].alive = false;
          this.interiorScreens[i].rect.setFillStyle(0x110808, 1);
          this.interiorScreens[i].glow.setAlpha(0);
        }
      }
    }
    if (layerIdx >= 3) {
      // Fire inside, soldiers flee, boss stands and fires faster
      g.fillStyle(0xff4400, 0.15);
      g.fillCircle(bunkLeft + 50, BUNKER_TOP_Y + 40, 12);
      g.fillCircle(bunkLeft + bunkW - 50, BUNKER_TOP_Y + 45, 10);
      g.fillStyle(0xff2200, 0.1);
      g.fillCircle(BUNKER_X, BUNKER_TOP_Y + 50, 15);

      // Animated fire sprites on the bunker surface (flickering orange/yellow circles)
      if (!this._bunkerFireSprites) {
        this._bunkerFireSprites = [];
        const firePositions = [
          { x: bunkLeft + 45, y: BUNKER_TOP_Y + 35 },
          { x: bunkLeft + bunkW - 45, y: BUNKER_TOP_Y + 40 },
          { x: BUNKER_X - 10, y: BUNKER_TOP_Y + 50 },
          { x: BUNKER_X + 15, y: BUNKER_TOP_Y + 30 },
        ];
        for (const fp of firePositions) {
          const fireOuter = this.add.circle(fp.x, fp.y, 6, 0xff6600, 0.6).setDepth(5);
          const fireInner = this.add.circle(fp.x, fp.y - 2, 3, 0xffcc00, 0.8).setDepth(5);
          // Flickering animation
          this.tweens.add({
            targets: fireOuter,
            scaleX: { from: 0.8, to: 1.3 },
            scaleY: { from: 1.0, to: 1.5 },
            alpha: { from: 0.4, to: 0.7 },
            duration: 200 + Math.random() * 200,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
          });
          this.tweens.add({
            targets: fireInner,
            scaleX: { from: 0.7, to: 1.2 },
            scaleY: { from: 0.9, to: 1.4 },
            alpha: { from: 0.5, to: 0.9 },
            y: fp.y - 4,
            duration: 150 + Math.random() * 150,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
          });
          this._bunkerFireSprites.push(fireOuter, fireInner);
        }
      }

      // Soldiers flee
      for (const s of this.miniSoldiers) {
        if (!s.fleeing) {
          s.fleeing = true;
          const dir = s.origX < BUNKER_X ? -1 : 1;
          this.tweens.add({
            targets: s.sprite,
            x: s.origX + dir * 80,
            y: s.origY + 20,
            alpha: 0,
            duration: 800,
            onComplete: () => s.sprite.destroy(),
          });
        }
      }

      // Break remaining screens
      for (const scr of this.interiorScreens) {
        if (scr.alive) {
          scr.alive = false;
          scr.rect.setFillStyle(0x110808, 1);
          scr.glow.setAlpha(0);
        }
      }

      // Boss fires faster
      this.bossFireRate = 2;
      this.bossBurstCooldown = 7;
    }
    if (layerIdx >= 4) {
      // Everything destroyed, boss standing among rubble still firing
      g.fillStyle(0x333322, 0.4);
      for (let i = 0; i < 8; i++) {
        g.fillRect(
          bunkLeft + 20 + Math.random() * (bunkW - 40),
          bunkTop + 10 + Math.random() * 60,
          4 + Math.random() * 8, 3 + Math.random() * 5
        );
      }
      g.fillStyle(0xff3300, 0.2);
      g.fillCircle(BUNKER_X - 25, BUNKER_TOP_Y + 30, 18);
      g.fillCircle(BUNKER_X + 20, BUNKER_TOP_Y + 35, 14);

      // Destroy console
      const cs = this.children.getByName('boss_console_screen');
      if (cs) cs.destroy();
      if (this.consoleSprite) { this.consoleSprite.destroy(); this.consoleSprite = null; }

      // Boss enraged — fires even faster
      this.bossFireRate = 1.5;
      this.bossBurstCooldown = 5;
    }
  }

  _updateBunkerSmoke(dt) {
    // Spawn smoke above damaged bunker
    if (this.bossDamageStage >= 1 && Math.random() < 0.1 * this.bossDamageStage) {
      const px = BUNKER_X + (Math.random() - 0.5) * 80;
      const py = BUNKER_TOP_Y - 5;
      const p = this.add.circle(px, py, 2 + Math.random() * 3, 0x333333, 0.3).setDepth(5);
      this.bunkerSmokeParticles.push({ sprite: p, life: 1.5 });
      this.tweens.add({
        targets: p, y: py - 30 - Math.random() * 20, alpha: 0, scaleX: 2, scaleY: 2,
        duration: 1500,
        onComplete: () => p.destroy(),
      });
    }
    // Cleanup expired particles
    for (let i = this.bunkerSmokeParticles.length - 1; i >= 0; i--) {
      this.bunkerSmokeParticles[i].life -= dt;
      if (this.bunkerSmokeParticles[i].life <= 0) {
        this.bunkerSmokeParticles.splice(i, 1);
      }
    }
  }

  _updateBombing(dt) {
    this.phaseTimer += dt;

    // Bombing phase: horizontal movement with LEFT/RIGHT (hovering over target area)
    const bombingHorizSpeed = 200; // slower horizontal for bombing precision
    if (this.keys.right.isDown) {
      this.jetVX += (bombingHorizSpeed - this.jetVX) * 4 * dt;
      this.facingRight = true;
    } else if (this.keys.left.isDown) {
      this.jetVX += (-bombingHorizSpeed - this.jetVX) * 4 * dt;
      this.facingRight = false;
    } else {
      // Decay horizontal velocity toward 0 when no input (hovering)
      this.jetVX += (0 - this.jetVX) * 3 * dt;
    }
    this.jetX += this.jetVX * dt;

    // Airplane vertical controls: UP = climb, DOWN = dive, nothing = level out
    if (this.keys.up.isDown) {
      this.jetVY += (CLIMB_RATE - this.jetVY) * VERT_LERP * dt;
    } else if (this.keys.down.isDown) {
      this.jetVY += (DIVE_RATE - this.jetVY) * VERT_LERP * dt;
    } else {
      this.jetVY += (0 - this.jetVY) * VERT_DECAY * dt;
      this.jetVY += JET_GRAVITY * dt;
    }
    this.jetVY = Phaser.Math.Clamp(this.jetVY, CLIMB_RATE * 1.2, DIVE_RATE * 1.2);
    this.jetY += this.jetVY * dt;
    if (this.jetY < 60) { this.jetY = 60; this.jetVY = Math.max(0, this.jetVY); }
    if (this.jetY >= GROUND_Y - 10) { this._crashJet('ground'); return; }

    this.jetX = Phaser.Math.Clamp(this.jetX, 60, W - 60);
    this.jetSprite.setFlipX(!this.facingRight);

    // Visual tilt: smooth lerp based on vy
    const maxVY = DIVE_RATE * 1.2;
    const tiltNorm = Phaser.Math.Clamp(this.jetVY / maxVY, -1, 1);
    const targetAngle = tiltNorm * Phaser.Math.DegToRad(TILT_MAX_DEG);
    const currentAngle = this.jetSprite.rotation || 0;
    this.jetSprite.setRotation(currentAngle + (targetAngle - currentAngle) * TILT_LERP_SPEED * dt);

    this.jetSprite.setPosition(this.jetX, this.jetY);

    // Bomb cooldown
    if (this.bombCooldown > 0) this.bombCooldown -= dt;

    // SPACE drops bomb (with cooldown)
    if (Phaser.Input.Keyboard.JustDown(this.keys.space) && this.bombs > 0 && this.bombCooldown <= 0) {
      this._dropBomb();
      this.bombCooldown = 0.35;
    }

    // Chaff deployment
    if (Phaser.Input.Keyboard.JustDown(this.keys.c)) {
      this._deployChaff();
    }

    // Update bombs
    this._updateBombs(dt);

    // Turret firing + boss attacks
    this._updateTurrets(dt);
    this._updateBossAttacks(dt);
    this._updateMissiles(dt);
    this._updateChaff(dt);
    this._updateExplosions(dt);
    this._updateBunkerSmoke(dt);

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
            const layerParts = this.bunkerLayerSprites[layerIdx];
            this.tweens.add({
              targets: [layerParts.rect, layerParts.rLayer, layerParts.topBar, layerParts.edge].filter(Boolean),
              alpha: 0.1, duration: 300,
            });
            this.bunkerHP--;
            SoundManager.get().playBombImpact();
            SoundManager.get().playMidBossHit();
            this._addExplosion(b.x, BUNKER_TOP_Y + layerIdx * LAYER_H + 10, 35);

            // Interior shakes on impact + boss hit feedback
            this.cameras.main.shake(100, 0.005);
            if (this.bossSprite && this.bossSprite.active) {
              // White flash → red flash → clear
              this.bossSprite.setTint(0xffffff);
              if (this.bossYellSprite) this.bossYellSprite.setTint(0xffffff);
              this.time.delayedCall(50, () => {
                if (this.bossSprite && this.bossSprite.active) this.bossSprite.setTint(0xff4444);
                if (this.bossYellSprite && this.bossYellSprite.active) this.bossYellSprite.setTint(0xff4444);
                this.time.delayedCall(100, () => {
                  if (this.bossSprite && this.bossSprite.active) this.bossSprite.clearTint();
                  if (this.bossYellSprite && this.bossYellSprite.active) this.bossYellSprite.clearTint();
                });
              });
              this.tweens.add({
                targets: [this.bossSprite, this.bossYellSprite],
                x: BUNKER_X + 4, duration: 50, yoyo: true, repeat: 3,
                onComplete: () => {
                  if (this.bossSprite && this.bossSprite.active) this.bossSprite.setX(BUNKER_X);
                  if (this.bossYellSprite && this.bossYellSprite.active) this.bossYellSprite.setX(BUNKER_X);
                },
              });
              // Scale bump
              this.tweens.add({
                targets: [this.bossSprite, this.bossYellSprite],
                scaleX: 0.55 * 1.08, scaleY: 0.55 * 1.08,
                duration: 100, yoyo: true,
                ease: 'Quad.easeOut',
              });
            }

            // Debris particles from bunker hit
            for (let dp = 0; dp < 5; dp++) {
              const debrisP = this.add.circle(
                b.x + (Math.random() - 0.5) * 40,
                BUNKER_TOP_Y + layerIdx * LAYER_H + (Math.random() - 0.5) * 20,
                2 + Math.random() * 3,
                [0x888888, 0x666666, 0xaa8866, 0xff6644][Math.floor(Math.random() * 4)],
                0.8
              ).setDepth(25);
              this.tweens.add({
                targets: debrisP,
                x: debrisP.x + (Math.random() - 0.5) * 80,
                y: debrisP.y + (Math.random() - 0.5) * 60,
                alpha: 0, scale: 0,
                duration: 400 + Math.random() * 300,
                onComplete: () => debrisP.destroy(),
              });
            }

            // Progressive damage
            this._updateBunkerDamage(layerIdx + 1);

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
        if (this.missiles.length >= SAM_MAX_ON_SCREEN) continue; // cap missiles on screen
        t.fireTimer = (1.5 + Math.random() * 1.5) * this.dm.spawnRateMult();
        // Fire tracking missile toward jet
        const dx = this.jetX - t.x;
        const dy = this.jetY - t.y;
        const angle = Math.atan2(dy, dx);
        const m = this.add.circle(t.x, t.y, 3, 0xff4444).setDepth(8);
        const glow = this.add.circle(t.x, t.y, 5, 0xff0000, 0.3).setDepth(7);
        const tSpd = 140 * this.dm.missileSpeedMult(); // 30% slower (phase-23)
        this.missiles.push({
          sprite: m, glow, x: t.x, y: t.y,
          angle,
          speed: tSpd,
          vx: Math.cos(angle) * tSpd,
          vy: Math.sin(angle) * tSpd,
          life: SAM_LIFETIME,
          trail: [],
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

    // Clean up any in-flight bombs immediately
    for (const b of this.bombObjects) {
      if (b.sprite) b.sprite.destroy();
      if (b.outline) b.outline.destroy();
    }
    this.bombObjects = [];

    // ── BOSS DEATH CINEMATIC ──

    // Step 1: Boss looks up in terror (close-up effect via zoom)
    if (this.bossSprite && this.bossSprite.active) {
      // Switch to yelling/terror
      this.bossSprite.setVisible(false);
      this.bossYellSprite.setVisible(true);

      // Zoom camera toward bunker briefly
      this.cameras.main.zoomTo(1.5, 400, 'Power2');
      this.cameras.main.pan(BUNKER_X, BUNKER_TOP_Y + 30, 400, 'Power2');
    }

    // Step 2: Flash + massive explosion from interior (after zoom)
    this.time.delayedCall(500, () => {
      // White flash
      this.cameras.main.flash(400, 255, 255, 255);
      this.cameras.main.zoomTo(1, 800, 'Power2');
      this.cameras.main.pan(W / 2, H / 2, 800);

      SoundManager.get().playExplosion();

      // Kill boss
      if (this.bossYellSprite) { this.bossYellSprite.destroy(); this.bossYellSprite = null; }
      if (this.bossSprite) { this.bossSprite.destroy(); this.bossSprite = null; }

      // Interior explosion first (starts from inside)
      for (let i = 0; i < 6; i++) {
        this.time.delayedCall(i * 60, () => {
          const ex = BUNKER_X + (Math.random() - 0.5) * 80;
          const ey = BUNKER_TOP_Y + 10 + Math.random() * 60;
          this._addExplosion(ex, ey, 20 + Math.random() * 20);
        });
      }
    });

    // Step 3: Building collapses outward (after interior explosion)
    this.time.delayedCall(900, () => {
      // Outer shell explosions
      for (let i = 0; i < 12; i++) {
        this.time.delayedCall(i * 70, () => {
          const ex = BUNKER_X + (Math.random() - 0.5) * 200;
          const ey = BUNKER_TOP_Y + Math.random() * 100;
          this._addExplosion(ex, ey, 25 + Math.random() * 35);
        });
      }

      this.cameras.main.shake(1500, 0.05);

      // MEGA fireball (bigger than before)
      const fireball = this.add.circle(BUNKER_X, BUNKER_TOP_Y + 30, 30, 0xff4400, 0.95).setDepth(16);
      this.tweens.add({
        targets: fireball, scaleX: 8, scaleY: 8, alpha: 0,
        duration: 2000, ease: 'Quad.easeOut',
        onComplete: () => fireball.destroy(),
      });

      // Secondary fireball (orange/white core)
      const core = this.add.circle(BUNKER_X, BUNKER_TOP_Y + 30, 15, 0xffdd44, 0.9).setDepth(17);
      this.tweens.add({
        targets: core, scaleX: 5, scaleY: 5, alpha: 0,
        duration: 1200, ease: 'Quad.easeOut',
        onComplete: () => core.destroy(),
      });

      // Debris flying outward
      for (let i = 0; i < 20; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 80 + Math.random() * 150;
        const dx = BUNKER_X + (Math.random() - 0.5) * 40;
        const dy = BUNKER_TOP_Y + 20 + (Math.random() - 0.5) * 30;
        const size = 2 + Math.random() * 4;
        const color = [0x8a8a92, 0x5a5a62, 0xff4400, 0xffcc00][Math.floor(Math.random() * 4)];
        const debris = this.add.circle(dx, dy, size, color, 0.9).setDepth(18);
        this.tweens.add({
          targets: debris,
          x: dx + Math.cos(angle) * speed,
          y: dy + Math.sin(angle) * speed - 40,
          alpha: 0, scaleX: 0.3, scaleY: 0.3,
          duration: 800 + Math.random() * 600,
          onComplete: () => debris.destroy(),
        });
      }
    });

    // Step 4: "TARGET ELIMINATED" text + cleanup
    this.time.delayedCall(1800, () => {
      // Smoke column (bigger)
      this.smokeSprite = this.add.ellipse(BUNKER_X, BUNKER_TOP_Y - 30, 60, 120, 0x333333, 0.5).setDepth(14);
      this.tweens.add({
        targets: this.smokeSprite, scaleX: 3, scaleY: 3.5, y: BUNKER_TOP_Y - 120, alpha: 0.2,
        duration: 3000,
      });

      // Crater
      const crater = this.add.ellipse(BUNKER_X, BUNKER_TOP_Y + 50, 220, 35, 0x1a1a10, 0.7).setDepth(3);

      // TARGET ELIMINATED text (not just "BUNKER DESTROYED")
      const elimText = this.add.text(W / 2, 60, 'TARGET ELIMINATED', {
        fontFamily: 'monospace', fontSize: '28px', color: '#ff4400',
        fontStyle: 'bold',
        shadow: { offsetX: 0, offsetY: 0, color: '#ff4400', blur: 16, fill: true },
      }).setOrigin(0.5).setDepth(25).setAlpha(0);
      this.tweens.add({ targets: elimText, alpha: 1, duration: 400 });

      this.time.delayedCall(1200, () => {
        const rtbText = this.add.text(W / 2, 95, 'RTB \u2014 RETURN TO BASE', {
          fontFamily: 'monospace', fontSize: '16px', color: '#00ff00',
          shadow: { offsetX: 0, offsetY: 0, color: '#00ff00', blur: 8, fill: true },
        }).setOrigin(0.5).setDepth(25);

        this.time.delayedCall(2000, () => {
          elimText.destroy();
          rtbText.destroy();
          if (this.smokeSprite) this.smokeSprite.destroy();
          crater.destroy();
          this._cleanupBunkerSprites();
          this._cleanupMissiles();
          this._startReturn();
        });
      });
    });
  }

  _cleanupBunkerSprites() {
    for (const l of this.bunkerLayerSprites) {
      if (l.rect) l.rect.destroy();
      if (l.rLayer) l.rLayer.destroy();
      if (l.topBar) l.topBar.destroy();
      if (l.edge) l.edge.destroy();
    }
    for (const t of this.turretSprites) { if (t.sprite) t.sprite.destroy(); }
    if (this.camoGfx) { this.camoGfx.destroy(); this.camoGfx = null; }
    if (this.bunkerInteriorGfx) { this.bunkerInteriorGfx.destroy(); this.bunkerInteriorGfx = null; }
    if (this.bunkerDamageGfx) { this.bunkerDamageGfx.destroy(); this.bunkerDamageGfx = null; }
    // Cleanup bunker fire sprites
    if (this._bunkerFireSprites) {
      for (const fs of this._bunkerFireSprites) { if (fs && fs.active) fs.destroy(); }
      this._bunkerFireSprites = null;
    }
    if (this.bossSprite) { this.bossSprite.destroy(); this.bossSprite = null; }
    if (this.bossYellSprite) { this.bossYellSprite.destroy(); this.bossYellSprite = null; }
    if (this.consoleSprite) { this.consoleSprite.destroy(); this.consoleSprite = null; }
    const cs = this.children.getByName('boss_console_screen');
    if (cs) cs.destroy();
    for (const scr of (this.interiorScreens || [])) {
      if (scr.rect) scr.rect.destroy();
      if (scr.glow) scr.glow.destroy();
    }
    this.interiorScreens = [];
    for (const s of (this.miniSoldiers || [])) {
      if (s.sprite && s.sprite.active) s.sprite.destroy();
    }
    this.miniSoldiers = [];
    for (const p of (this.bunkerSmokeParticles || [])) {
      if (p.sprite && p.sprite.active) p.sprite.destroy();
    }
    this.bunkerSmokeParticles = [];
  }

  // ═════════════════════════════════════════════════════════════
  // PHASE 5 — RETURN FLIGHT
  // ═════════════════════════════════════════════════════════════
  _startReturn() {
    this.phase = 'returning';
    MusicManager.get().playLevel3Music('landing');

    // Save checkpoint: bunker destroyed, now in return phase
    try { localStorage.setItem('superzion_checkpoint_l3', 'return'); } catch (e) { /* ignore */ }
    this.phaseTimer = 0;
    this.facingRight = false;
    this.jetSprite.setFlipX(true);
    this.jetX = W - 280;
    this.jetY = 180;
    this.jetVX = -JET_SPEED;
    this.jetVY = 0;
    this._cleanupMissiles();
    this.returnTerrainStage = 0;
    this.returnDistance = 0;

    this.groundTile.setTexture('mountain_ground');
    this.farTerrain.setVisible(true);

    this.jetSprite.setRotation(0); // level out

    this.instrText.setText('Returning to carrier \u2014 UP/DOWN to control altitude');
    this.instrText.setColor('#888888');

    this.ambientRef = SoundManager.get().playJetEngine();
  }

  _updateReturn(dt) {
    this.phaseTimer += dt;

    // CONSTANT horizontal speed — flying left (returning) at JET_SPEED
    this.jetVX = -JET_SPEED;
    this.facingRight = false;

    // Airplane vertical controls: UP = climb, DOWN = dive, nothing = level out
    if (this.keys.up.isDown) {
      this.jetVY += (CLIMB_RATE - this.jetVY) * VERT_LERP * dt;
    } else if (this.keys.down.isDown) {
      this.jetVY += (DIVE_RATE - this.jetVY) * VERT_LERP * dt;
    } else {
      this.jetVY += (0 - this.jetVY) * VERT_DECAY * dt;
      this.jetVY += JET_GRAVITY * dt;
    }
    this.jetVY = Phaser.Math.Clamp(this.jetVY, CLIMB_RATE * 1.2, DIVE_RATE * 1.2);
    this.jetY += this.jetVY * dt;
    if (this.jetY < 60) { this.jetY = 60; this.jetVY = Math.max(0, this.jetVY); }
    if (this.jetY >= GROUND_Y - 10) {
      this._crashJet(this.returnTerrainStage >= 2 ? 'water' : 'ground');
      return;
    }

    // Visual tilt: smooth lerp based on vy
    const maxVY = DIVE_RATE * 1.2;
    const tiltNorm = Phaser.Math.Clamp(this.jetVY / maxVY, -1, 1);
    const targetAngle = tiltNorm * Phaser.Math.DegToRad(TILT_MAX_DEG);
    const currentAngle = this.jetSprite.rotation || 0;
    this.jetSprite.setRotation(currentAngle + (targetAngle - currentAngle) * TILT_LERP_SPEED * dt);

    // Jet stays at fixed screen X position (world scrolls past)
    this.jetX = W - 280;
    this.jetX = Phaser.Math.Clamp(this.jetX, 60, W - 60);

    this.jetSprite.setFlipX(true);
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

    // Distance HUD (scaled to shorter distance)
    const distKm = Math.max(0, Math.round(80 * (1 - this.returnDistance / RETURN_CARRIER_DIST)));
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
    this.jetSprite.setRotation(0);
    this.jetX = W - 150;
    this.jetY = 180;
    this.jetVY = 0;

    // Carrier appears from left
    this.carrierSprite.setVisible(true);
    this.carrierSprite.setPosition(-200, GROUND_Y - 10);
    this.tweens.add({
      targets: this.carrierSprite, x: 240, duration: 2000, ease: 'Quad.easeOut',
    });

    this.groundTile.setTexture('sea_surface');

    this.instrText.setText('UP to slow descent \u2014 DOWN to descend \u2014 Land gently!');
    this.instrText.setColor('#ffaa00');

    SoundManager.get().playLandingGear();
  }

  _updateLanding(dt) {
    // Landing approach: gentle leftward drift toward carrier (automatic)
    this.jetX -= 50 * dt;
    this.jetX = Phaser.Math.Clamp(this.jetX, 30, W - 30);

    // Airplane vertical controls: UP = climb (slow descent), DOWN = descend faster
    if (this.keys.up.isDown) {
      this.jetVY += (CLIMB_RATE * 0.6 - this.jetVY) * VERT_LERP * dt;
    } else if (this.keys.down.isDown) {
      this.jetVY += (DIVE_RATE * 0.6 - this.jetVY) * VERT_LERP * dt;
    } else {
      // Gentle descent when no input — plane slowly descends for landing
      this.jetVY += (40 - this.jetVY) * VERT_DECAY * dt;
      this.jetVY += JET_GRAVITY * dt;
    }

    this.jetVY = Phaser.Math.Clamp(this.jetVY, CLIMB_RATE * 0.8, DIVE_RATE * 0.8);
    this.jetY += this.jetVY * dt;

    // Visual tilt: smooth lerp based on vy (less extreme during landing)
    const maxVY = DIVE_RATE;
    const tiltNorm = Phaser.Math.Clamp(this.jetVY / maxVY, -1, 1);
    const targetTilt = tiltNorm * Phaser.Math.DegToRad(TILT_MAX_DEG * 0.7);
    const currentAngle = this.jetSprite.rotation || 0;
    this.jetSprite.setRotation(currentAngle + (targetTilt - currentAngle) * TILT_LERP_SPEED * dt);
    this.jetSprite.setPosition(this.jetX, this.jetY);

    // Check landing on carrier deck
    if (this.jetY >= DECK_Y) {
      const carrierLeft = this.carrierSprite.x - 200;
      const carrierRight = this.carrierSprite.x + 200;

      if (this.jetX >= carrierLeft && this.jetX <= carrierRight) {
        // Check descent rate — too fast = crash on impact
        if (this.jetVY > LANDING_CRASH_VY) {
          this._crashJet('ground');
          return;
        }

        this.jetY = DECK_Y;
        this.jetVY = 0;
        this.jetSprite.setRotation(0);
        this.jetSprite.setPosition(this.jetX, this.jetY);

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

        // Hook animation — small hook catching arresting wire + deceleration
        this._showHookAnimation(this.jetX, DECK_Y);

        this.phase = 'landed';
        this.time.delayedCall(2000, () => this._showVictory());
      } else {
        // Not aligned with carrier — falls into water (game over)
        if (this.landingRetries < 1) {
          this.landingRetries++;
          this.instrText.setText('WAVE OFF \u2014 Go around!');
          this.instrText.setColor('#ff4444');
          SoundManager.get().playMissileWarning();
          this.jetY = 180;
          this.jetX = W - 150;
          this.jetVY = 0;
          this.jetVX = 0;
          this.time.delayedCall(1500, () => {
            if (this.phase === 'landing') {
              this.instrText.setText('UP to slow descent \u2014 DOWN to descend \u2014 Land gently!');
              this.instrText.setColor('#ffaa00');
            }
          });
        } else {
          // Missed carrier twice — splash crash into water
          this._splashCrash(this.jetX, GROUND_Y);
        }
      }
    }

    // Crashed into water (below carrier)
    if (this.jetY > GROUND_Y + 20 && this.phase === 'landing') {
      this._splashCrash(this.jetX, GROUND_Y);
    }
  }

  /** Hook catching arresting wire animation + deceleration slide */
  _showHookAnimation(x, y) {
    SoundManager.get().playLandingGear();

    // Small hook dropping from plane underside
    const hookLine = this.add.line(0, 0, x, y + 8, x, y + 18, 0xcccccc).setDepth(11);
    hookLine.setLineWidth(2);
    const hookTip = this.add.circle(x, y + 18, 3, 0xcccccc).setDepth(11);

    // Arresting wire (horizontal cable on deck)
    const wireY = y + 16;
    const wire = this.add.line(0, 0, x - 60, wireY, x + 60, wireY, 0x888888).setDepth(9);
    wire.setLineWidth(1.5);

    // Wire catch flash
    const catchFlash = this.add.circle(x, wireY, 5, 0xffff88, 0.8).setDepth(12);
    this.tweens.add({
      targets: catchFlash, scaleX: 3, scaleY: 3, alpha: 0,
      duration: 300, onComplete: () => catchFlash.destroy(),
    });

    // "HOOK ENGAGED" text
    const hookText = this.add.text(x, y - 25, 'HOOK ENGAGED', {
      fontFamily: 'monospace', fontSize: '10px', color: '#88ff88',
    }).setOrigin(0.5).setDepth(20);
    this.tweens.add({
      targets: hookText, y: y - 45, alpha: 0, duration: 1200,
      onComplete: () => hookText.destroy(),
    });

    // Deceleration slide — jet decelerates on deck
    this.tweens.add({
      targets: this.jetSprite,
      x: x - 40,
      duration: 800,
      ease: 'Quad.easeOut',
    });

    // Clean up wire/hook graphics after animation
    this.time.delayedCall(1500, () => {
      hookLine.destroy();
      hookTip.destroy();
      wire.destroy();
    });
  }

  // ═════════════════════════════════════════════════════════════
  // CRASH
  // ═════════════════════════════════════════════════════════════
  _crashJet(reason) {
    // Water crashes use the splash crash animation instead
    if (reason === 'water') {
      this._splashCrash(this.jetX, Math.min(this.jetY, GROUND_Y));
      return;
    }

    if (this.crashed) return;
    this.crashed = true;
    this.phase = 'dead';
    this._stopAmbient();

    SoundManager.get().playExplosion();
    this.cameras.main.shake(600, 0.05);

    const crashX = this.jetX;
    const crashY = this.jetY;

    if (this.jetSprite) this.jetSprite.setVisible(false);

    // Explosion (ground crash)
    for (let i = 0; i < 15; i++) {
      const ex = crashX + (Math.random() - 0.5) * 60;
      const ey = crashY + (Math.random() - 0.5) * 40;
      const r = 5 + Math.random() * 15;
      const color = [0xff4400, 0xff8800, 0xffcc00][Math.floor(Math.random() * 3)];
      const fireball = this.add.circle(ex, ey, r, color, 0.9).setDepth(25);
      this.tweens.add({
        targets: fireball,
        scaleX: 2 + Math.random(), scaleY: 2 + Math.random(),
        alpha: 0, duration: 600 + Math.random() * 400, delay: i * 50,
        onComplete: () => fireball.destroy(),
      });
    }

    // CRASHED text
    const crashText = this.add.text(W / 2, H / 2, 'CRASHED', {
      fontFamily: 'monospace', fontSize: '48px', color: '#ff4444',
      shadow: { offsetX: 0, offsetY: 0, color: '#ff4444', blur: 20, fill: true },
    }).setOrigin(0.5).setDepth(55).setAlpha(0);
    this.tweens.add({ targets: crashText, alpha: 1, duration: 500 });

    this.time.delayedCall(3000, () => {
      crashText.destroy();
      this._showVictory();
    });
  }

  // ═════════════════════════════════════════════════════════════
  // VICTORY / RESULTS
  // ═════════════════════════════════════════════════════════════
  _showVictory() {
    this.phase = 'victory';
    this.instrText.setVisible(false);
    if (this.instrBg) this.instrBg.setVisible(false);
    MusicManager.get().stop(1);

    // Clear checkpoint on level completion
    try { localStorage.removeItem('superzion_checkpoint_l3'); } catch (e) { /* ignore */ }

    const layersDestroyed = BUNKER_LAYERS - Math.max(0, this.bunkerHP);
    this.missionSuccess = layersDestroyed >= BUNKER_LAYERS;

    if (this.missionSuccess) SoundManager.get().playVictory();

    // Star rating
    let starCount;
    if (!this.missionSuccess) starCount = 0;
    else if (layersDestroyed >= 5 && this.landingQuality === 'perfect') starCount = 3;
    else if ((layersDestroyed >= 5 && this.landingQuality === 'good') || layersDestroyed >= 3) starCount = 2;
    else starCount = 1;

    try { localStorage.setItem('superzion_stars_3', String(Math.max(starCount, parseInt(localStorage.getItem('superzion_stars_3') || '0')))); } catch(e) {}

    const statsData = [
      { label: 'BUNKER LAYERS PENETRATED', value: `${layersDestroyed}/${BUNKER_LAYERS}` },
      { label: 'BOMBS USED', value: `${this.bombsUsed}/${BOMB_TOTAL}` },
      { label: 'ARMOR REMAINING', value: `${Math.max(0, this.armor)}/3` },
      { label: 'LANDING', value: (this.landingQuality || 'N/A').toUpperCase() },
    ];

    if (this.missionSuccess) {
      this._endScreen = showVictoryScreen(this, {
        title: 'MISSION COMPLETE',
        stats: statsData,
        stars: starCount,
        currentScene: 'BomberScene',
        nextScene: 'UndergroundIntroCinematicScene',
      });
    } else {
      this._endScreen = showDefeatScreen(this, {
        title: 'MISSION FAILED',
        stats: statsData,
        currentScene: 'BomberScene',
        skipScene: 'UndergroundIntroCinematicScene',
      });
    }
  }

  // ═════════════════════════════════════════════════════════════
  // MAIN UPDATE LOOP
  // ═════════════════════════════════════════════════════════════
  update(time, delta) {
    // Tutorial active: skip all gameplay
    if (this.tutorialActive) return;

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
    if (this.isPaused) { if (this.input.keyboard.checkDown(this.input.keyboard.addKey("Q"), 500)) { MusicManager.get().stop(0.3); this.scene.start("MenuScene"); } return; }

    // P key — debug skip to victory
    if (Phaser.Input.Keyboard.JustDown(this.keys.p) && this.phase !== 'victory') {
      this._stopAmbient();
      this._cleanupBunkerSprites();
      this._cleanupMissiles();
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
        // EndScreen buttons handle R/S/ENTER key bindings
        break;
    }

    // Update shared systems
    if (this.phase !== 'victory' && this.phase !== 'dead') {
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
    if (this._endScreen) this._endScreen.destroy();
    this._stopAmbient();
    this.tweens.killAll();
    this.time.removeAllEvents();
    for (const m of this.missiles) { m.sprite.destroy(); m.glow.destroy(); if (m.trail) for (const t of m.trail) t.destroy(); }
    this.missiles = [];
    for (const b of this.bombObjects) { b.sprite.destroy(); b.outline.destroy(); }
    this.bombObjects = [];
    for (const p of this.chaffParticles) p.sprite.destroy();
    this.chaffParticles = [];
    if (this._cleanupBunkerSprites) this._cleanupBunkerSprites();
  }
}
