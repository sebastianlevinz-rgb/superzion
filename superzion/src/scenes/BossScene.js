// ═══════════════════════════════════════════════════════════════
// BossScene — Level 6: Operation Last Stand
// Scrolling approach toward the Supreme Turban in morning Beirut
// Dodge SAMs → close distance → destroy air defenses → destroy the Supreme Leader
// Pixel-by-pixel disintegration death animation preserved
// ═══════════════════════════════════════════════════════════════

import Phaser from 'phaser';
import SoundManager from '../systems/SoundManager.js';
import MusicManager from '../systems/MusicManager.js';
import DifficultyManager from '../systems/DifficultyManager.js';
import {
  createPlayerFighter, createBunkerFortress, createBeirutMorningSky,
  createBeirutCityLayer, createBeirutGroundLayer,
  createSAMMissile, createBullet, createBossBullet,
} from '../utils/BossTextures.js';
import { showVictoryScreen, showDefeatScreen } from '../ui/EndScreen.js';
import { showControlsOverlay, showTutorialOverlay } from '../ui/ControlsOverlay.js';

const W = 960;
const H = 540;

// Approach constants
const APPROACH_SPEED = 120;
const PLAYER_SPEED_Y = 250;
const PLAYER_SPEED_X = 200;
const PLAYER_SPEED_X_BOOST = 80;
const TOTAL_DISTANCE = 6000;
const ATTACK_DISTANCE = 4500;
const BASE_BUNKER_HP = 80;
const BASE_PLAYER_MAX_HP = 6;
const PLAYER_MAX_BULLETS = 8;
const PLAYER_SHOOT_COOLDOWN = 150;
const PLAYER_BULLET_SPEED = 500;
const INVULN_TIME = 1.5;

// Heavy bomb constants
const HEAVY_BOMB_COOLDOWN = 2;    // 2-second cooldown
const HEAVY_BOMB_MAX = 8;         // 8 bombs per level
const HEAVY_BOMB_DAMAGE = 3;      // 3x damage
const HEAVY_BOMB_SPEED_X = 400;   // rightward speed
const HEAVY_BOMB_SPEED_Y = 120;   // slight downward drift

// Anti-missile pulse constants
const ANTI_MISSILE_COOLDOWN = 5;
const ANTI_MISSILE_RADIUS = 100;
const ANTI_MISSILE_MAX_CHARGES = 5;

export default class BossScene extends Phaser.Scene {
  constructor() { super('BossScene'); }

  create() {
    this.cameras.main.setBackgroundColor('#000000');

    // Controls overlay
    showControlsOverlay(this, 'ARROWS: Move | SPACE: Shoot | X: Heavy Bomb | SHIFT: Roll | C: Pulse');

    // Generate textures
    createPlayerFighter(this);
    createBunkerFortress(this);
    createBeirutMorningSky(this);
    createBeirutCityLayer(this);
    createBeirutGroundLayer(this);
    createSAMMissile(this);
    createBullet(this);
    createBossBullet(this);

    // ── State ──
    this.phase = 'intro';
    this.introTimer = 0;
    this.distance = 0;

    // Difficulty
    const dm = DifficultyManager.get();
    this.PLAYER_MAX_HP = Math.round(BASE_PLAYER_MAX_HP * dm.playerHPMult());
    this.BUNKER_HP = Math.round(BASE_BUNKER_HP * dm.bossHPMult());

    // Player
    this.playerX = -40;
    this.playerY = H / 2;
    this.playerHP = this.PLAYER_MAX_HP;
    this.playerBullets = [];
    this.invulnTimer = 0;
    this.shootCooldown = 0;

    // Heavy bombs
    this.heavyBombCooldown = 0;
    this.heavyBombsRemaining = HEAVY_BOMB_MAX;
    this.heavyBombs = [];

    // Anti-missile pulse
    this.antiMissileCooldown = 0;
    this.antiMissileCharges = ANTI_MISSILE_MAX_CHARGES;
    this.antiMissilePulseTimer = 0; // visual pulse expanding ring timer
    this.antiMissilePulseX = 0;
    this.antiMissilePulseY = 0;
    this.antiMissilePulseActive = false;

    // Bunker
    this.bunkerX = W + 150;
    this.bunkerY = 300;
    this.bunkerHP = this.BUNKER_HP;
    // Boss phases: 1=energy shield(100%-60%), 2=rotating shield+drones(60%-30%), 3=laser(30%-0%)
    this.bunkerPhase = 1;
    this.shieldActive = false;
    this.shieldAngle = 0; // rotating shield angle (phase 2)

    // Phase 1: Energy shield — active most of the time, drops every 5s for 2s
    this.energyShieldActive = true;
    this.energyShieldTimer = 0; // counts up to 5s, then drops for 2s
    this.energyShieldVulnerable = false; // true during 2s vulnerability window
    this.energyShieldFlickerTimer = 0; // for flicker effect before dropping

    // Laser sweep (Phase 3) — horizontal laser with gap
    this.laserSweepActive = false;
    this.laserSweepY = 0; // current Y position of the laser line
    this.laserSweepDir = 1; // 1 = top→bottom, -1 = bottom→top
    this.laserGapY = H / 2; // Y position of the 80px gap in the laser
    this.laserGapVY = 0; // gap movement speed
    this.laserFiring = false;
    this.laserChargeTimer = 0; // 1.5s charge up visual
    this.laserChargeWarningLine = 0; // 0.5s warning line after charge
    this.laserFireDuration = 0;

    // Boss attack telegraph — red flash timer on boss sprite before missiles
    this.bossFlashTimer = 0;

    // Barrel roll (all phases) — double-tap LEFT or RIGHT within 300ms
    this.barrelRollCooldown = 0; // 3s cooldown
    this.barrelRollActive = false;
    this.barrelRollTimer = 0; // 1s duration
    this.barrelRollAngle = 0; // rotation angle for visual
    this.lastLeftTapTime = 0;
    this.lastRightTapTime = 0;
    this.prevLeftDown = false;
    this.prevRightDown = false;

    // Legacy dodge/roll (used by approach + air defense)
    this.dodgeCooldown = 0;
    this.dodgeTimer = 0;
    this.isDodging = false;
    this.dodgeVX = 0;
    this.dodgeVY = 0;

    // Enemy projectiles
    this.samMissiles = [];
    this.bossBullets = [];
    this.homingMissiles = [];
    this.flakBursts = [];

    // Phase 2: Drones
    this.drones = [];
    this.droneSpawnTimer = 0;
    this.droneSpawnPortals = []; // portal/warp effects before drones appear

    // Phase 2: Area bombs
    this.areaBombs = [];
    this.areaBombTimer = 0;

    // Phase 3: Rapid desperate shots between laser sweeps
    this.rapidShotTimer = 0;

    // Smoke particles from damaged boss
    this.smokeParticles = [];
    this.smokeAccum = 0;

    // Attack timers
    this.fanMissileTimer = 0; // Phase 1: fan missiles every 3s
    this.samTimer = 0;
    this.spreadTimer = 0;
    this.homingTimer = 0;
    this.flakTimer = 0;
    this.laserCooldown = 0;

    // Air defense phase state
    this.airDefenseSites = [];
    this.airDefenseTimer = 0;

    // Stats
    this.shotsFired = 0;
    this.shotsHit = 0;
    this.damageTaken = 0;

    // One-time trigger flags
    this.musicPhase2Triggered = false;
    this.warningTextTriggered = false;
    this.phase2Triggered = false; // triggers at 60% HP
    this.phase3Triggered = false; // triggers at 30% HP

    // Boss expression tracking for texture updates
    this._lastBossExpression = 'normal';

    // Disintegration
    this.disintPixels = [];
    this.disintTimer = 0;

    // "TOO FAR" flash
    this.tooFarFlash = 0;

    // ── Setup ──
    this._setupLayers();
    this._setupHUD();
    this._setupInput();
    this._startIntro();

    this.events.on('shutdown', this.shutdown, this);

    // Tutorial overlay (pauses gameplay until dismissed)
    showTutorialOverlay(this, [
      'LEVEL 6: OPERATION ENDGAME: DEATH TO THE REGIME',
      '',
      'ARROWS: Move your fighter',
      'SPACE: Fire weapons',
      'X: Heavy bombs (limited)',
      'SHIFT: Barrel roll (invulnerability)',
      'C: Anti-missile pulse',
      'Defeat AYATOLLAH ALI KHAMENEI',
      '',
      'Attack when his shield drops!',
      'Double-tap LEFT/RIGHT for barrel roll',
    ]);
  }

  // ═════════════════════════════════════════════════════════════
  // SETUP
  // ═════════════════════════════════════════════════════════════

  _setupLayers() {
    // Sky — static background
    this.skyBg = this.add.image(W / 2, H / 2, 'beirut_sky').setDepth(-10);

    // ── Morning sky detail: haze bands and sun glow ──
    const skyDetailGfx = this.add.graphics().setDepth(-9);
    // Dawn haze (warm golden bands near horizon)
    skyDetailGfx.fillStyle(0xffcc88, 0.06);
    skyDetailGfx.fillRect(0, H * 0.4, W, H * 0.15);
    skyDetailGfx.fillStyle(0xff9966, 0.04);
    skyDetailGfx.fillRect(0, H * 0.5, W, H * 0.12);
    // Atmospheric dust/smog
    skyDetailGfx.fillStyle(0xbbaa88, 0.03);
    skyDetailGfx.fillRect(0, H * 0.55, W, H * 0.2);
    // Sun glow (east side — right side for morning)
    skyDetailGfx.fillStyle(0xffdd88, 0.08);
    skyDetailGfx.fillCircle(W - 80, H * 0.35, 60);
    skyDetailGfx.fillStyle(0xffcc66, 0.04);
    skyDetailGfx.fillCircle(W - 80, H * 0.35, 120);

    // City silhouette — slow parallax
    this.cityTile = this.add.tileSprite(W / 2, H - 140, W, 150, 'beirut_city').setDepth(-7);

    // ── City detail overlay: building silhouettes with windows, minarets, smoke ──
    this.cityDetailGfx = this.add.graphics().setDepth(-6);
    this._drawCityEnvironment();

    // Ground — faster parallax
    this.groundTile = this.add.tileSprite(W / 2, H - 60, W, 120, 'beirut_ground').setDepth(-5);

    // ── Ground detail overlay: roads, vehicles, infrastructure ──
    const groundDetailGfx = this.add.graphics().setDepth(-4);
    // Road lines
    groundDetailGfx.lineStyle(1.5, 0x555550, 0.2);
    groundDetailGfx.lineBetween(0, H - 40, W, H - 40);
    // Road dashes
    groundDetailGfx.lineStyle(1, 0x777770, 0.12);
    for (let dx = 0; dx < W; dx += 25) {
      groundDetailGfx.lineBetween(dx, H - 40, dx + 12, H - 40);
    }
    // Vehicles on road
    const vehicles = [
      { x: 100, w: 14, h: 6, color: 0x556655 },
      { x: 250, w: 12, h: 5, color: 0x665555 },
      { x: 440, w: 18, h: 7, color: 0x4a4a5a },
      { x: 600, w: 14, h: 5, color: 0x5a5a44 },
      { x: 780, w: 20, h: 8, color: 0x4a5a4a },
    ];
    for (const v of vehicles) {
      groundDetailGfx.fillStyle(v.color, 0.25);
      groundDetailGfx.fillRect(v.x, H - 46, v.w, v.h);
    }

    // Player fighter — side-view, nose already points right
    this.playerSprite = this.add.image(this.playerX, this.playerY, 'player_fighter').setDepth(10);

    // Boss character — hidden until attack phase
    this.bunkerSprite = this.add.image(this.bunkerX, this.bunkerY, 'bunker_fortress').setDepth(10);
    this.bunkerSprite.setVisible(false);

    // Graphics layers
    this.gfx = this.add.graphics().setDepth(15);
    this.effectsGfx = this.add.graphics().setDepth(20);

    // ── Environment damage graphics (drawn based on boss HP) ──
    this.envDamageGfx = this.add.graphics().setDepth(-3);
    this._envSmokeParticles = [];
  }

  // ── Draw city environment detail (building windows, minarets, smoke columns) ──
  _drawCityEnvironment() {
    const gfx = this.cityDetailGfx;
    if (!gfx) return;

    // Building silhouettes with lit windows (behind city parallax layer)
    const buildings = [
      { x: 50, w: 60, h: 120 },
      { x: 130, w: 45, h: 90 },
      { x: 200, w: 70, h: 150 },
      { x: 300, w: 50, h: 100 },
      { x: 380, w: 55, h: 130 },
      { x: 460, w: 40, h: 80 },
      { x: 520, w: 65, h: 140 },
      { x: 610, w: 50, h: 110 },
      { x: 690, w: 60, h: 95 },
      { x: 770, w: 55, h: 125 },
      { x: 850, w: 45, h: 85 },
      { x: 910, w: 50, h: 105 },
    ];

    for (const b of buildings) {
      const by = H - 65 - b.h;
      // Building body (dark silhouette)
      gfx.fillStyle(0x3a3a44, 0.2);
      gfx.fillRect(b.x, by, b.w, b.h);

      // Lit windows (small yellow dots)
      for (let wy = by + 10; wy + 8 < H - 70; wy += 15) {
        for (let wx = b.x + 6; wx + 5 < b.x + b.w - 3; wx += 12) {
          // ~40% of windows are lit
          const hash = (wx * 7 + wy * 13 + b.x) % 10;
          if (hash < 4) {
            gfx.fillStyle(0xffee88, 0.12 + (hash % 2) * 0.06);
            gfx.fillRect(wx, wy, 4, 5);
          }
        }
      }
    }

    // Minaret shapes (tall thin towers with pointed tops)
    const minarets = [
      { x: 170, h: 60 },
      { x: 430, h: 50 },
      { x: 710, h: 55 },
    ];
    for (const m of minarets) {
      const my = H - 65 - m.h;
      gfx.fillStyle(0x4a4a54, 0.25);
      gfx.fillRect(m.x - 2, my, 4, m.h);
      // Pointed top
      gfx.beginPath();
      gfx.moveTo(m.x - 4, my);
      gfx.lineTo(m.x, my - 8);
      gfx.lineTo(m.x + 4, my);
      gfx.closePath();
      gfx.fillPath();
      // Balcony ring
      gfx.lineStyle(1, 0x5a5a64, 0.2);
      gfx.lineBetween(m.x - 4, my + 10, m.x + 4, my + 10);
    }

    // Smoke/haze columns (static background detail)
    for (let si = 0; si < 3; si++) {
      const sx = 150 + si * 300;
      gfx.fillStyle(0x666660, 0.04);
      gfx.fillCircle(sx, H - 130, 25);
      gfx.fillStyle(0x555550, 0.03);
      gfx.fillCircle(sx + 5, H - 160, 30);
      gfx.fillCircle(sx - 3, H - 190, 20);
    }
  }

  // ── Update environment damage based on boss HP ──
  _updateEnvironmentDamage(dt) {
    if (!this.envDamageGfx) return;
    this.envDamageGfx.clear();

    const hpRatio = this.bunkerHP / this.BUNKER_HP;
    const damageLevel = 1 - hpRatio; // 0 = no damage, 1 = max damage

    // Only show damage effects during attack phase and when boss has taken damage
    if (damageLevel <= 0 || (this.phase !== 'attack' && this.phase !== 'air_defense')) return;

    const gfx = this.envDamageGfx;

    // Craters on ground (more as boss takes damage)
    const craterCount = Math.floor(damageLevel * 8);
    for (let i = 0; i < craterCount; i++) {
      const cx = ((i * 137 + 50) % (W - 100)) + 50;
      const cy = H - 25 - (i % 3) * 8;
      const cr = 4 + (i % 3) * 2;
      gfx.fillStyle(0x333330, 0.3);
      gfx.fillCircle(cx, cy, cr);
      gfx.fillStyle(0x444440, 0.15);
      gfx.fillCircle(cx, cy, cr * 0.6);
    }

    // Fire columns on buildings (progressive)
    const fireCount = Math.floor(damageLevel * 5);
    const fireTime = this.time ? Date.now() / 150 : 0;
    for (let fi = 0; fi < fireCount; fi++) {
      const fx = 100 + fi * 180;
      const fy = H - 100 - fi * 15;
      const flicker = Math.sin(fireTime + fi * 2) * 0.1;
      gfx.fillStyle(0xff4400, 0.12 + flicker);
      gfx.fillCircle(fx, fy, 6);
      gfx.fillStyle(0xff6600, 0.08 + flicker * 0.5);
      gfx.fillCircle(fx, fy - 4, 10);
    }

    // Smoke columns based on damage
    const smokeCount = Math.floor(damageLevel * 6);
    for (let si = 0; si < smokeCount; si++) {
      const sx = 80 + si * 160;
      for (let layer = 0; layer < 3; layer++) {
        const smokeY = H - 120 - layer * 25 - Math.sin(fireTime * 0.3 + si + layer) * 5;
        const smokeR = 8 + layer * 5;
        gfx.fillStyle(0x555555, 0.06 - layer * 0.015);
        gfx.fillCircle(sx + Math.sin(fireTime * 0.2 + si) * 8, smokeY, smokeR);
      }
    }

    // Red tint overlay (increases with damage)
    if (damageLevel > 0.5) {
      gfx.fillStyle(0xff0000, (damageLevel - 0.5) * 0.04);
      gfx.fillRect(0, 0, W, H);
    }
  }

  _setupHUD() {
    const hudStyle = { fontFamily: 'monospace', fontSize: '12px', color: '#ffffff' };

    // Distance indicator (top-right)
    this.hudDistance = this.add.text(W - 15, 15, `DISTANCE: ${TOTAL_DISTANCE}m`, {
      fontFamily: 'monospace', fontSize: '13px', color: '#00e5ff',
      shadow: { offsetX: 0, offsetY: 0, color: '#00e5ff', blur: 4, fill: true },
    }).setOrigin(1, 0).setDepth(30);

    // Player HP (top-left)
    this.hudPlayerHP = this.add.text(15, 15, `HP: ${this.playerHP}/${this.PLAYER_MAX_HP}`, hudStyle).setDepth(30);

    // Anti-missile charges (top-left, below HP)
    this.hudAntiMissile = this.add.text(15, 32, `PULSE: ${this.antiMissileCharges}/${ANTI_MISSILE_MAX_CHARGES}`, {
      fontFamily: 'monospace', fontSize: '11px', color: '#00ffff',
    }).setDepth(30);

    // Heavy bomb count (top-left, below pulse)
    this.hudBombs = this.add.text(15, 46, `BOMBS: ${this.heavyBombsRemaining}/${HEAVY_BOMB_MAX}`, {
      fontFamily: 'monospace', fontSize: '11px', color: '#ff8800',
    }).setDepth(30);

    // Air defense sites remaining (hidden until air_defense phase)
    this.hudAirDefense = this.add.text(W / 2, 50, '', {
      fontFamily: 'monospace', fontSize: '14px', color: '#ff8800',
      shadow: { offsetX: 0, offsetY: 0, color: '#ff6600', blur: 6, fill: true },
    }).setOrigin(0.5).setDepth(30).setAlpha(0);

    // Boss HP bar (hidden until attack phase)
    this.hpBarBg = this.add.rectangle(W / 2, 20, 400, 14, 0x333333).setDepth(30).setAlpha(0);
    this.hpBarFill = this.add.rectangle(W / 2 - 198, 20, 396, 10, 0xff2222).setDepth(31);
    this.hpBarFill.setOrigin(0, 0.5);
    this.hpBarFill.setAlpha(0);
    this.hpBarLabel = this.add.text(W / 2, 20, 'AYATOLLAH ALI KHAMENEI', {
      fontFamily: 'monospace', fontSize: '9px', color: '#ffffff',
    }).setOrigin(0.5).setDepth(32).setAlpha(0);

    // Center message
    this.centerMsg = this.add.text(W / 2, H / 2 - 60, '', {
      fontFamily: 'monospace', fontSize: '28px', color: '#ff2222',
      shadow: { offsetX: 0, offsetY: 0, color: '#ff0000', blur: 16, fill: true },
    }).setOrigin(0.5).setDepth(35).setAlpha(0);

    // Instruction text
    this.instrText = this.add.text(W / 2, H - 12, '', {
      fontFamily: 'monospace', fontSize: '14px', color: '#ffffff', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(30);
    this.instrBg = this.add.rectangle(this.instrText.x, this.instrText.y, 960, 28, 0x000000, 0.7)
      .setScrollFactor(0).setDepth(this.instrText.depth - 1);

    // "TOO FAR" flash text
    this.tooFarText = this.add.text(W / 2, H / 2, 'TOO FAR TO SHOOT', {
      fontFamily: 'monospace', fontSize: '18px', color: '#ff8800',
      shadow: { offsetX: 0, offsetY: 0, color: '#ff6600', blur: 8, fill: true },
    }).setOrigin(0.5).setDepth(35).setAlpha(0);
  }

  _setupInput() {
    this.keys = {
      left: this.input.keyboard.addKey('LEFT'),
      right: this.input.keyboard.addKey('RIGHT'),
      up: this.input.keyboard.addKey('UP'),
      down: this.input.keyboard.addKey('DOWN'),
      space: this.input.keyboard.addKey('SPACE'),
      shift: this.input.keyboard.addKey('SHIFT'),
      enter: this.input.keyboard.addKey('ENTER'),
      m: this.input.keyboard.addKey('M'),
      r: this.input.keyboard.addKey('R'),
      s: this.input.keyboard.addKey('S'),
      esc: this.input.keyboard.addKey('ESC'),
      c: this.input.keyboard.addKey('C'),
      x: this.input.keyboard.addKey('X'),
    };
    this.isPaused = false;
    this.pauseObjects = [];
  }

  // ═════════════════════════════════════════════════════════════
  // INTRO
  // ═════════════════════════════════════════════════════════════

  _startIntro() {
    this.phase = 'intro';
    this.introTimer = 0;
    MusicManager.get().playLevel6Music(1);
    SoundManager.get().playBossEntrance();

    this.instrText.setText('ARROWS: Move | SPACE: Shoot | X: Heavy Bomb | SHIFT: Roll | C: Pulse');

    // Slide player in from left to air defense starting position
    this.tweens.add({
      targets: this,
      playerX: 120,
      playerY: H / 2,
      duration: 2000,
      ease: 'Power2',
    });

    // "OPERATION ENDGAME: DEATH TO THE REGIME" text
    this.centerMsg.setText('OPERATION ENDGAME: DEATH TO THE REGIME');
    this.centerMsg.setColor('#ff2222');
    this.centerMsg.setAlpha(1);
    this.tweens.add({
      targets: this.centerMsg,
      alpha: 0,
      duration: 500,
      delay: 2200,
    });

    // Transition directly to air defense after brief intro (2.5s)
    this.time.delayedCall(2500, () => {
      this._transitionToAirDefense();
    });
  }

  // ═════════════════════════════════════════════════════════════
  // MAIN UPDATE
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
    if (Phaser.Input.Keyboard.JustDown(this.keys.esc) && this.phase !== 'victory' && this.phase !== 'dead') {
      this._togglePause();
      return;
    }
    if (this.isPaused) { if (this.input.keyboard.checkDown(this.input.keyboard.addKey("Q"), 500)) { MusicManager.get().stop(0.3); this.scene.start("MenuScene"); } return; }

    switch (this.phase) {
      case 'intro':
        this.introTimer += dt;
        this._updateScrolling(dt, APPROACH_SPEED * 0.3);
        this._updatePlayerSprite();
        break;
      case 'approach':
        this._updateApproach(dt);
        this._updateEnvironmentDamage(dt);
        break;
      case 'air_defense':
        this._updateAirDefense(dt);
        this._updateEnvironmentDamage(dt);
        break;
      case 'attack':
        this._updateAttack(dt);
        this._updateEnvironmentDamage(dt);
        break;
      case 'disintegrating':
        this._updateDisintegration(dt);
        this._updateEnvironmentDamage(dt);
        break;
      case 'victory_pending':
        break;
      case 'victory':
        break;
      case 'dead':
        break;
    }
  }

  // ═════════════════════════════════════════════════════════════
  // SCROLLING
  // ═════════════════════════════════════════════════════════════

  _updateScrolling(dt, speed) {
    this.cityTile.tilePositionX += speed * 0.15 * dt;
    this.groundTile.tilePositionX += speed * 0.6 * dt;
  }

  // ═════════════════════════════════════════════════════════════
  // ANTI-MISSILE PULSE
  // ═════════════════════════════════════════════════════════════

  _tryAntiMissilePulse() {
    if (this.antiMissileCharges <= 0) return;
    if (this.antiMissileCooldown > 0) return;

    this.antiMissileCharges--;
    this.antiMissileCooldown = ANTI_MISSILE_COOLDOWN;

    // Visual pulse
    this.antiMissilePulseActive = true;
    this.antiMissilePulseTimer = 0;
    this.antiMissilePulseX = this.playerX;
    this.antiMissilePulseY = this.playerY;

    // Sound
    SoundManager.get().playTypewriterClick();

    // Destroy nearby enemy projectiles (NOT laser)
    const px = this.playerX;
    const py = this.playerY;
    const r2 = ANTI_MISSILE_RADIUS * ANTI_MISSILE_RADIUS;

    // SAMs
    for (const m of this.samMissiles) {
      if (!m.active) continue;
      const dx = m.x - px, dy = m.y - py;
      if (dx * dx + dy * dy < r2) {
        m.active = false;
      }
    }

    // Boss bullets
    for (const b of this.bossBullets) {
      if (!b.active) continue;
      const dx = b.x - px, dy = b.y - py;
      if (dx * dx + dy * dy < r2) {
        b.active = false;
        if (b.sprite && b.sprite.active) b.sprite.destroy();
      }
    }

    // Homing missiles
    for (const m of this.homingMissiles) {
      if (!m.active) continue;
      const dx = m.x - px, dy = m.y - py;
      if (dx * dx + dy * dy < r2) {
        m.active = false;
      }
    }

    // Camera flash for feedback
    this.cameras.main.flash(100, 0, 200, 255);
  }

  _updateAntiMissilePulse(dt) {
    if (this.antiMissileCooldown > 0) {
      this.antiMissileCooldown -= dt;
    }
    if (this.antiMissilePulseActive) {
      this.antiMissilePulseTimer += dt;
      if (this.antiMissilePulseTimer >= 0.4) {
        this.antiMissilePulseActive = false;
      }
    }
  }

  // ═════════════════════════════════════════════════════════════
  // HEAVY BOMB
  // ═════════════════════════════════════════════════════════════

  _tryFireHeavyBomb() {
    if (this.heavyBombsRemaining <= 0) return;
    if (this.heavyBombCooldown > 0) return;

    this.heavyBombsRemaining--;
    this.heavyBombCooldown = HEAVY_BOMB_COOLDOWN;
    this.shotsFired++;

    SoundManager.get().playExplosion();
    this.cameras.main.shake(80, 0.005);

    this.heavyBombs.push({
      x: this.playerX + 16,
      y: this.playerY + 8,
      vx: HEAVY_BOMB_SPEED_X,
      vy: HEAVY_BOMB_SPEED_Y,
      active: true,
      trail: [],
      age: 0,
    });
  }

  _updateHeavyBombs(dt) {
    this.heavyBombCooldown = Math.max(0, this.heavyBombCooldown - dt);

    for (const bomb of this.heavyBombs) {
      if (!bomb.active) continue;
      bomb.age += dt;
      bomb.x += bomb.vx * dt;
      bomb.y += bomb.vy * dt;

      // Add trail points
      bomb.trail.push({ x: bomb.x, y: bomb.y, age: 0 });
      // Age and prune trail
      for (const tp of bomb.trail) tp.age += dt;
      bomb.trail = bomb.trail.filter(tp => tp.age < 0.3);

      // Off-screen removal
      if (bomb.x > W + 30 || bomb.y > H + 30 || bomb.y < -30) {
        bomb.active = false;
      }
    }
    this.heavyBombs = this.heavyBombs.filter(b => b.active);
  }

  _drawHeavyBombs() {
    for (const bomb of this.heavyBombs) {
      if (!bomb.active) continue;

      // Draw trail (orange to transparent)
      for (let i = 0; i < bomb.trail.length; i++) {
        const tp = bomb.trail[i];
        const alpha = Math.max(0, 1 - tp.age / 0.3) * 0.5;
        const size = 3 + (1 - tp.age / 0.3) * 3;
        this.effectsGfx.fillStyle(0xff6600, alpha * 0.3);
        this.effectsGfx.fillCircle(tp.x, tp.y, size + 2);
        this.effectsGfx.fillStyle(0xff4400, alpha);
        this.effectsGfx.fillCircle(tp.x, tp.y, size);
      }

      // Draw bomb body (larger projectile with glow)
      // Outer glow
      this.effectsGfx.fillStyle(0xff4400, 0.25);
      this.effectsGfx.fillCircle(bomb.x, bomb.y, 12);
      // Mid glow
      this.effectsGfx.fillStyle(0xff6600, 0.5);
      this.effectsGfx.fillCircle(bomb.x, bomb.y, 8);
      // Core body
      this.effectsGfx.fillStyle(0xff8822, 1);
      this.effectsGfx.fillCircle(bomb.x, bomb.y, 5);
      // Bright inner core
      this.effectsGfx.fillStyle(0xffcc66, 1);
      this.effectsGfx.fillCircle(bomb.x, bomb.y, 2.5);
    }
  }

  _checkHeavyBombCollisionsSAM() {
    for (const bomb of this.heavyBombs) {
      if (!bomb.active) continue;
      for (const site of this.airDefenseSites) {
        if (!site.active) continue;
        const dx = bomb.x - site.x;
        const dy = bomb.y - site.y;
        if (Math.abs(dx) < 30 && Math.abs(dy) < 22) {
          bomb.active = false;
          site.hp -= HEAVY_BOMB_DAMAGE;
          this.shotsHit++;
          SoundManager.get().playBossHit();
          this.cameras.main.shake(200, 0.012);
          if (site.hp <= 0) {
            site.active = false;
            SoundManager.get().playExplosion();
            this.cameras.main.shake(300, 0.02);
          }
          break;
        }
      }
    }
  }

  _checkHeavyBombCollisionsBoss() {
    for (const bomb of this.heavyBombs) {
      if (!bomb.active) continue;
      const dx = bomb.x - this.bunkerX;
      const dy = bomb.y - this.bunkerY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Phase 1: Energy shield blocks when active
      if (this.bunkerPhase === 1 && this.energyShieldActive && !this.energyShieldVulnerable && dist < 90) {
        bomb.active = false;
        SoundManager.get().playTypewriterClick();
        this.cameras.main.shake(100, 0.005);
        continue;
      }

      // Phase 2: Rotating shield check
      if (this.bunkerPhase === 2 && this.shieldActive && dist < 90) {
        const bulletAngle = Math.atan2(dy, dx);
        const shieldFacing = this.shieldAngle + Math.PI;
        let angleDiff = bulletAngle - shieldFacing;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        if (Math.abs(angleDiff) < Math.PI / 3) {
          bomb.active = false;
          SoundManager.get().playTypewriterClick();
          this.cameras.main.shake(150, 0.01);
          continue;
        }
      }

      if (dist < 75) {
        bomb.active = false;
        this.shotsHit++;
        this.cameras.main.shake(250, 0.015);
        SoundManager.get().playBossHit();

        for (let i = 0; i < HEAVY_BOMB_DAMAGE; i++) {
          this.bunkerHP--;
          if (this.bunkerHP <= 0) break;
        }

        // White flash → red flash → clear (heavy bomb impact)
        this.bunkerSprite.setTint(0xffffff);
        this.time.delayedCall(50, () => {
          if (this.bunkerSprite && this.bunkerSprite.active) {
            this.bunkerSprite.setTint(0xff4444);
            this.time.delayedCall(100, () => {
              if (this.bunkerSprite && this.bunkerSprite.active) this.bunkerSprite.clearTint();
            });
          }
        });

        // Debris particles from heavy bomb hit
        for (let dp = 0; dp < 8; dp++) {
          const debP = this.add.circle(
            this.bunkerX + (Math.random() - 0.5) * 50,
            this.bunkerY + (Math.random() - 0.5) * 50,
            2 + Math.random() * 4,
            [0x888888, 0x666666, 0xaa8866, 0xff6644][Math.floor(Math.random() * 4)],
            0.8
          ).setDepth(25);
          this.tweens.add({
            targets: debP,
            x: debP.x + (Math.random() - 0.5) * 80,
            y: debP.y + (Math.random() - 0.5) * 80,
            alpha: 0, scale: 0,
            duration: 400 + Math.random() * 300,
            onComplete: () => debP.destroy(),
          });
        }

        // Phase transitions (same thresholds as normal bullets)
        if (this.bunkerHP <= this.BUNKER_HP * 0.6 && !this.phase2Triggered) {
          this.phase2Triggered = true;
          this.bunkerPhase = 2;
          this.energyShieldActive = false;
          this.energyShieldVulnerable = false;
          this.shieldActive = true;
          this.shieldAngle = 0;
          this.droneSpawnTimer = 0;
          this.areaBombTimer = 0;
          this.cameras.main.flash(500, 100, 100, 255);
          SoundManager.get().playBossPhaseTransition();
          MusicManager.get().playLevel6Music(2);
          this._showCenterMessage('ROTATING SHIELD — FLANK IT!', '#8888ff');
          this.instrText.setText('Flank the rotating shield! | Dodge area bombs! | X: Bomb | Double-tap L/R: Roll');
          this.samTimer = 0; this.spreadTimer = 0; this.homingTimer = 0; this.fanMissileTimer = 0;
        }
        if (this.bunkerHP <= this.BUNKER_HP * 0.3 && !this.phase3Triggered) {
          this.phase3Triggered = true;
          this.bunkerPhase = 3;
          this.shieldActive = false;
          this.drones = [];
          this.droneSpawnPortals = [];
          this.areaBombs = [];
          this.cameras.main.flash(500, 255, 50, 0);
          SoundManager.get().playBossPhaseTransition();
          MusicManager.get().playLevel6Music(3);
          this._showCenterMessage('SUPREME FURY — NO SHIELD!', '#ff2222');
          this.instrText.setText('DODGE THE LASER GAP! | Double-tap L/R: Barrel Roll | X: Bomb');
          this.samTimer = 0; this.spreadTimer = 0; this.homingTimer = 0; this.laserCooldown = 2;
          this.rapidShotTimer = 0;
        }

        if (this.bunkerHP <= 0) {
          this.bunkerHP = 0;
          this._updateBossExpression();
          this._startDisintegration();
          return;
        }

        this._updateBossExpression();
      }
    }
  }

  // ═════════════════════════════════════════════════════════════
  // APPROACH PHASE (bypassed — kept for reference)
  // ═════════════════════════════════════════════════════════════

  _updateApproach(dt) {
    // Auto-advance distance at base speed
    const effectiveSpeed = APPROACH_SPEED;
    this.distance += effectiveSpeed * dt;

    // Scrolling
    this._updateScrolling(dt, effectiveSpeed);

    // Player full X+Y movement
    if (this.keys.up.isDown) this.playerY -= PLAYER_SPEED_Y * dt;
    if (this.keys.down.isDown) this.playerY += PLAYER_SPEED_Y * dt;
    if (this.keys.left.isDown) this.playerX -= PLAYER_SPEED_X * dt;
    if (this.keys.right.isDown) this.playerX += PLAYER_SPEED_X * dt;
    this.playerX = Phaser.Math.Clamp(this.playerX, 60, 500);
    this.playerY = Phaser.Math.Clamp(this.playerY, 60, 480);

    // SPACE pressed during approach → "TOO FAR" flash
    if (Phaser.Input.Keyboard.JustDown(this.keys.space)) {
      this.tooFarFlash = 0.8;
      this.tooFarText.setAlpha(1);
    }
    if (this.tooFarFlash > 0) {
      this.tooFarFlash -= dt;
      if (this.tooFarFlash <= 0) this.tooFarText.setAlpha(0);
    }

    // Anti-missile pulse
    if (Phaser.Input.Keyboard.JustDown(this.keys.c)) {
      this._tryAntiMissilePulse();
    }
    this._updateAntiMissilePulse(dt);

    // Dodge/roll mechanic during approach
    this.dodgeCooldown = Math.max(0, this.dodgeCooldown - dt);
    if (this.isDodging) {
      this.dodgeTimer -= dt;
      this.playerX += this.dodgeVX * dt;
      this.playerY += this.dodgeVY * dt;
      if (this.dodgeTimer <= 0) {
        this.isDodging = false;
        this.playerSprite.setAlpha(1);
      }
    }
    if (!this.isDodging && this.dodgeCooldown <= 0 && Phaser.Input.Keyboard.JustDown(this.keys.shift)) {
      this.isDodging = true;
      this.dodgeTimer = 0.2;
      this.dodgeCooldown = 1.5;
      this.invulnTimer = Math.max(this.invulnTimer, 0.25);
      const dx = this.keys.right.isDown ? 1 : this.keys.left.isDown ? -1 : 0;
      const dy = this.keys.down.isDown ? 1 : this.keys.up.isDown ? -1 : 0;
      const mag = Math.sqrt(dx * dx + dy * dy) || 1;
      this.dodgeVX = (dx / mag) * 600;
      this.dodgeVY = (dy / mag) * 600;
      this.playerSprite.setAlpha(0.4);
      SoundManager.get().playTypewriterClick();
    }
    this.playerX = Phaser.Math.Clamp(this.playerX, 60, 500);
    this.playerY = Phaser.Math.Clamp(this.playerY, 60, 480);

    // Invulnerability
    this._updateInvulnerability(dt);

    // Sub-phase spawning
    this._spawnApproachEnemies(dt);

    // Update projectiles
    this._updateSAMs(dt);
    this._updateBossBullets(dt);
    this._updateHomingMissiles(dt);
    this._updateFlakBursts(dt);

    // Collisions
    this._checkPlayerCollisions();

    // Update sprite + HUD
    this._updatePlayerSprite();
    this._updateApproachHUD();
    this._drawApproachEffects();

    // Music transition at mid-range (one-time)
    if (!this.musicPhase2Triggered && this.distance >= 2000) {
      this.musicPhase2Triggered = true;
      MusicManager.get().playLevel6Music(2);
    }

    // Warning text at 4200m (one-time)
    if (!this.warningTextTriggered && this.distance >= 4200) {
      this.warningTextTriggered = true;
      this._showCenterMessage('ENTERING ATTACK RANGE', '#ff8800');
    }

    // Transition to air defense phase at ATTACK_DISTANCE
    if (this.distance >= ATTACK_DISTANCE) {
      this._transitionToAirDefense();
    }
  }

  _spawnApproachEnemies(dt) {
    this.samTimer += dt;
    this.spreadTimer += dt;
    this.homingTimer += dt;
    this.flakTimer += dt;

    if (this.distance < 2000) {
      // Sub-phase 1: Long range — light SAMs
      if (this.samTimer >= 3) {
        this.samTimer = 0;
        this._spawnSAM(200, true);
      }
      // Occasional flak
      if (this.flakTimer >= 4) {
        this.flakTimer = 0;
        this._spawnFlakBurst();
      }
    } else if (this.distance < 4000) {
      // Sub-phase 2: Mid range — more SAMs + AA bursts + homing
      if (this.samTimer >= 1.5) {
        this.samTimer = 0;
        this._spawnSAM(280, true);
      }
      if (this.spreadTimer >= 2) {
        this.spreadTimer = 0;
        this._fireAABurst(3);
      }
      if (this.homingTimer >= 6) {
        this.homingTimer = 0;
        this._spawnHomingMissile();
      }
      if (this.flakTimer >= 3) {
        this.flakTimer = 0;
        this._spawnFlakBurst();
      }
    } else {
      // Sub-phase 3: Close range — heavy everything
      if (this.samTimer >= 1) {
        this.samTimer = 0;
        this._spawnSAM(320, true);
      }
      if (this.spreadTimer >= 1.5) {
        this.spreadTimer = 0;
        this._fireAABurst(5);
      }
      if (this.homingTimer >= 4) {
        this.homingTimer = 0;
        this._spawnHomingMissile();
      }
      if (this.flakTimer >= 2) {
        this.flakTimer = 0;
        this._spawnFlakBurst();
      }
    }
  }

  // ═════════════════════════════════════════════════════════════
  // AIR DEFENSE PHASE
  // ═════════════════════════════════════════════════════════════

  _transitionToAirDefense() {
    this.phase = 'air_defense';
    this.playerX = Phaser.Math.Clamp(this.playerX, 60, 500);

    // Reset attack timers
    this.samTimer = 0;
    this.spreadTimer = 0;
    this.homingTimer = 0;
    this.flakTimer = 0;
    this.airDefenseTimer = 0;

    // Clear existing projectiles
    for (const b of this.bossBullets) {
      if (b.sprite && b.sprite.active) b.sprite.destroy();
    }
    this.bossBullets = [];
    this.samMissiles = [];
    this.homingMissiles = [];
    this.flakBursts = [];

    // Create SAM sites along the ground
    const siteCount = 5;
    this.airDefenseSites = [];
    for (let i = 0; i < siteCount; i++) {
      this.airDefenseSites.push({
        x: 150 + i * (W - 300) / (siteCount - 1),
        y: H - 85,
        hp: 4,
        maxHP: 4,
        active: true,
        fireTimer: 1 + Math.random() * 2, // stagger initial fire
        warningBlink: 0,
      });
    }

    this._showCenterMessage('DESTROYING AIR DEFENSES', '#ff8800');
    this.instrText.setText('ARROWS: Move | SPACE: Shoot | X: Heavy Bomb | SHIFT: Roll | C: Pulse');
    this.hudAirDefense.setAlpha(1);
  }

  _updateAirDefense(dt) {
    // Player full movement
    if (!this.isDodging) {
      if (this.keys.up.isDown) this.playerY -= PLAYER_SPEED_Y * dt;
      if (this.keys.down.isDown) this.playerY += PLAYER_SPEED_Y * dt;
      if (this.keys.left.isDown) this.playerX -= PLAYER_SPEED_X * dt;
      if (this.keys.right.isDown) this.playerX += PLAYER_SPEED_X * dt;
    }
    this.playerX = Phaser.Math.Clamp(this.playerX, 60, W - 60);
    this.playerY = Phaser.Math.Clamp(this.playerY, 60, H - 130);

    // Dodge/roll
    this.dodgeCooldown = Math.max(0, this.dodgeCooldown - dt);
    if (this.isDodging) {
      this.dodgeTimer -= dt;
      this.playerX += this.dodgeVX * dt;
      this.playerY += this.dodgeVY * dt;
      if (this.dodgeTimer <= 0) {
        this.isDodging = false;
        this.playerSprite.setAlpha(1);
      }
    }
    if (!this.isDodging && this.dodgeCooldown <= 0 && Phaser.Input.Keyboard.JustDown(this.keys.shift)) {
      this.isDodging = true;
      this.dodgeTimer = 0.2;
      this.dodgeCooldown = 1.5;
      this.invulnTimer = Math.max(this.invulnTimer, 0.25);
      const dx = this.keys.right.isDown ? 1 : this.keys.left.isDown ? -1 : 0;
      const dy = this.keys.down.isDown ? 1 : this.keys.up.isDown ? -1 : 0;
      const mag = Math.sqrt(dx * dx + dy * dy) || 1;
      this.dodgeVX = (dx / mag) * 600;
      this.dodgeVY = (dy / mag) * 600;
      this.playerSprite.setAlpha(0.4);
      SoundManager.get().playTypewriterClick();
    }
    this.playerX = Phaser.Math.Clamp(this.playerX, 60, W - 60);
    this.playerY = Phaser.Math.Clamp(this.playerY, 60, H - 130);

    // Anti-missile pulse
    if (Phaser.Input.Keyboard.JustDown(this.keys.c)) {
      this._tryAntiMissilePulse();
    }
    this._updateAntiMissilePulse(dt);

    // Heavy bomb
    if (Phaser.Input.Keyboard.JustDown(this.keys.x)) {
      this._tryFireHeavyBomb();
    }
    this._updateHeavyBombs(dt);

    // Shooting — player bullets go downward toward SAM sites
    this.shootCooldown -= dt * 1000;
    if (this.keys.space.isDown && this.shootCooldown <= 0) {
      const activeCount = this.playerBullets.filter(b => b.active).length;
      if (activeCount < PLAYER_MAX_BULLETS) {
        // Fire bullet to the right and slightly downward
        this.playerBullets.push({
          x: this.playerX + 20,
          y: this.playerY + 10,
          vx: PLAYER_BULLET_SPEED * 0.5,
          vy: PLAYER_BULLET_SPEED * 0.7,
          active: true,
          airDefBullet: true,
          sprite: this.add.image(this.playerX + 20, this.playerY + 10, 'player_bullet')
            .setDepth(12).setAngle(0), // bullet goes down
        });
        this.shootCooldown = PLAYER_SHOOT_COOLDOWN;
        this.shotsFired++;
        SoundManager.get().playPlayerShoot();
      }
    }

    // Invulnerability
    this._updateInvulnerability(dt);

    // SAM site attacks — each site fires missiles upward periodically
    for (const site of this.airDefenseSites) {
      if (!site.active) continue;
      site.fireTimer -= dt;
      site.warningBlink += dt;
      if (site.fireTimer <= 0) {
        site.fireTimer = 2.5 + Math.random() * 1.5;
        // Fire a missile upward toward the player
        const dx = this.playerX - site.x;
        const dy = this.playerY - site.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const speed = 180;
        this.samMissiles.push({
          x: site.x,
          y: site.y - 10,
          vx: (dx / dist) * speed,
          vy: (dy / dist) * speed,
          speed: speed,
          homing: true,
          active: true,
        });
        SoundManager.get().playHomingMissile();
      }
    }

    // Update air defense bullets (custom trajectory)
    this._updateAirDefenseBullets(dt);

    // Update projectiles
    this._updateSAMs(dt);
    this._updateBossBullets(dt);
    this._updateHomingMissiles(dt);
    this._updateFlakBursts(dt);

    // Collisions
    this._checkPlayerCollisions();
    this._checkAirDefenseCollisions();
    this._checkHeavyBombCollisionsSAM();

    // Update sprite + HUD
    this._updatePlayerSprite();

    // HUD update
    const remaining = this.airDefenseSites.filter(s => s.active).length;
    this.hudAirDefense.setText(`SAM SITES: ${remaining}/${this.airDefenseSites.length}`);
    this.hudPlayerHP.setText(`HP: ${this.playerHP}/${this.PLAYER_MAX_HP}`);
    this.hudPlayerHP.setColor(this.playerHP <= 2 ? '#ff4444' : '#ffffff');
    this.hudAntiMissile.setText(`PULSE: ${this.antiMissileCharges}/${ANTI_MISSILE_MAX_CHARGES}`);
    this.hudAntiMissile.setColor(this.antiMissileCooldown > 0 ? '#666666' : '#00ffff');
    this.hudBombs.setText(`BOMBS: ${this.heavyBombsRemaining}/${HEAVY_BOMB_MAX}`);
    this.hudBombs.setColor(this.heavyBombCooldown > 0 ? '#666666' : (this.heavyBombsRemaining > 0 ? '#ff8800' : '#444444'));
    this.hudDistance.setText('DISTANCE: AIR DEFENSE');

    // Draw effects
    this._drawAirDefenseEffects();

    // Check if all SAM sites destroyed
    if (remaining === 0) {
      this._transitionToAttack();
    }
  }

  _updateAirDefenseBullets(dt) {
    for (const b of this.playerBullets) {
      if (!b.active || !b.airDefBullet) continue;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.sprite.setPosition(b.x, b.y);
      if (b.y > H + 20 || b.x > W + 20 || b.x < -20) {
        b.active = false;
        b.sprite.destroy();
      }
    }
  }

  _checkAirDefenseCollisions() {
    for (const b of this.playerBullets) {
      if (!b.active) continue;
      for (const site of this.airDefenseSites) {
        if (!site.active) continue;
        const dx = b.x - site.x;
        const dy = b.y - site.y;
        if (Math.abs(dx) < 25 && Math.abs(dy) < 18) {
          b.active = false;
          if (b.sprite && b.sprite.active) b.sprite.destroy();
          site.hp--;
          this.shotsHit++;
          SoundManager.get().playBossHit();
          if (site.hp <= 0) {
            site.active = false;
            SoundManager.get().playExplosion();
            this.cameras.main.shake(200, 0.01);
          }
          break;
        }
      }
    }
    this.playerBullets = this.playerBullets.filter(b => b.active);
  }

  _drawAirDefenseEffects() {
    this.effectsGfx.clear();

    // Draw SAM sites on the ground
    for (const site of this.airDefenseSites) {
      if (!site.active) continue;

      // Base structure (dark gray rectangle)
      this.effectsGfx.fillStyle(0x444444, 1);
      this.effectsGfx.fillRect(site.x - 20, site.y - 10, 40, 20);

      // Launcher tube (angled upward)
      this.effectsGfx.fillStyle(0x555555, 1);
      this.effectsGfx.fillRect(site.x - 3, site.y - 22, 6, 14);

      // Red warning light (blinking)
      const blinkOn = Math.sin(site.warningBlink * 4) > 0;
      if (blinkOn) {
        this.effectsGfx.fillStyle(0xff0000, 1);
        this.effectsGfx.fillCircle(site.x, site.y - 24, 3);
        // Glow
        this.effectsGfx.fillStyle(0xff0000, 0.2);
        this.effectsGfx.fillCircle(site.x, site.y - 24, 8);
      } else {
        this.effectsGfx.fillStyle(0x660000, 1);
        this.effectsGfx.fillCircle(site.x, site.y - 24, 3);
      }

      // HP bar above site
      const hpPct = site.hp / site.maxHP;
      this.effectsGfx.fillStyle(0x333333, 0.6);
      this.effectsGfx.fillRect(site.x - 15, site.y - 30, 30, 3);
      this.effectsGfx.fillStyle(hpPct > 0.5 ? 0xff8800 : 0xff2222, 0.8);
      this.effectsGfx.fillRect(site.x - 15, site.y - 30, 30 * hpPct, 3);
    }

    // SAM missiles
    for (const m of this.samMissiles) {
      if (!m.active) continue;
      this.effectsGfx.fillStyle(0xdddddd, 1);
      this.effectsGfx.fillRect(m.x - 6, m.y - 2, 12, 4);
      this.effectsGfx.fillStyle(0xff3333, 1);
      this.effectsGfx.fillRect(m.x - 6, m.y - 2, 3, 4);
      this.effectsGfx.fillStyle(0xff8800, 0.7);
      this.effectsGfx.fillCircle(m.x + 7, m.y, 3);
    }

    // Homing missiles
    for (const m of this.homingMissiles) {
      if (!m.active) continue;
      this.effectsGfx.fillStyle(0xff2222, 1);
      this.effectsGfx.fillCircle(m.x, m.y, 5);
      this.effectsGfx.fillStyle(0xff6600, 0.5);
      this.effectsGfx.fillCircle(m.x, m.y, 8);
    }

    // Heavy bombs
    this._drawHeavyBombs();

    // Anti-missile pulse visual
    this._drawAntiMissilePulse();

    // Dodge cooldown indicator
    if (this.dodgeCooldown > 0) {
      const pct = this.dodgeCooldown / 1.5;
      this.effectsGfx.fillStyle(0x666666, 0.3);
      this.effectsGfx.fillRect(this.playerX - 12, this.playerY + 20, 24, 3);
      this.effectsGfx.fillStyle(0x00e5ff, 0.6);
      this.effectsGfx.fillRect(this.playerX - 12, this.playerY + 20, 24 * (1 - pct), 3);
    }

    // Heavy bomb cooldown indicator
    this._drawHeavyBombCooldownBar();

    // Anti-missile cooldown indicator (below dodge indicator)
    this._drawAntiMissileCooldownBar();
  }

  _transitionToAttack() {
    this.phase = 'attack';
    this.playerX = Phaser.Math.Clamp(this.playerX, 60, 500);
    this.playerY = Phaser.Math.Clamp(this.playerY, 60, 480);

    // Hide air defense HUD
    this.hudAirDefense.setAlpha(0);

    // Reset attack timers for boss phase
    this.samTimer = 0;
    this.spreadTimer = 0;
    this.homingTimer = 0;
    this.flakTimer = 0;

    // Clear leftover projectiles
    for (const b of this.playerBullets) {
      if (b.sprite && b.sprite.active) b.sprite.destroy();
    }
    this.playerBullets = [];
    for (const b of this.bossBullets) {
      if (b.sprite && b.sprite.active) b.sprite.destroy();
    }
    this.bossBullets = [];
    this.samMissiles = [];
    this.homingMissiles = [];
    this.flakBursts = [];

    // Show boss sliding in from right
    this.bunkerSprite.setVisible(true);
    this.bunkerX = W + 150;
    this.tweens.add({
      targets: this,
      bunkerX: 780,
      duration: 1500,
      ease: 'Power2',
    });

    // Show boss HP bar + start breathing idle animation
    this.time.delayedCall(1000, () => {
      this.hpBarBg.setAlpha(1);
      this.hpBarFill.setAlpha(1);
      this.hpBarLabel.setAlpha(1);

      // Breathing idle animation on boss sprite
      if (this.bunkerSprite && this.bunkerSprite.active) {
        this.tweens.add({
          targets: this.bunkerSprite,
          scaleY: this.bunkerSprite.scaleY * 1.02,
          duration: 1200,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });
      }
    });

    // Clear heavy bombs
    this.heavyBombs = [];

    // Phase 1 setup: Energy shield active
    this.bunkerPhase = 1;
    this.energyShieldActive = true;
    this.energyShieldTimer = 0;
    this.energyShieldVulnerable = false;
    this.fanMissileTimer = 0;

    this._showCenterMessage('DESTROY THE SUPREME LEADER', '#ff2222');
    this.instrText.setText('ARROWS: Move | SPACE: Shoot when shield drops! | X: Bomb | Double-tap L/R: Barrel Roll');
  }

  // ═════════════════════════════════════════════════════════════
  // ATTACK PHASE
  // ═════════════════════════════════════════════════════════════

  _updateAttack(dt) {
    // ── Barrel Roll mechanic (all phases) ──
    this._updateBarrelRoll(dt);

    // Anti-missile pulse
    if (Phaser.Input.Keyboard.JustDown(this.keys.c)) {
      this._tryAntiMissilePulse();
    }
    this._updateAntiMissilePulse(dt);

    // Heavy bomb
    if (Phaser.Input.Keyboard.JustDown(this.keys.x)) {
      this._tryFireHeavyBomb();
    }
    this._updateHeavyBombs(dt);

    // Player movement — full control (unless barrel rolling)
    if (!this.barrelRollActive) {
      if (this.keys.up.isDown) this.playerY -= PLAYER_SPEED_Y * dt;
      if (this.keys.down.isDown) this.playerY += PLAYER_SPEED_Y * dt;
      if (this.keys.left.isDown) this.playerX -= PLAYER_SPEED_X_BOOST * 2.5 * dt;
      if (this.keys.right.isDown) this.playerX += PLAYER_SPEED_X_BOOST * 2.5 * dt;
    }
    this.playerX = Phaser.Math.Clamp(this.playerX, 60, 500);
    this.playerY = Phaser.Math.Clamp(this.playerY, 60, 480);

    // ── Phase 1: Energy shield cycle (active 5s, drops 2s) ──
    if (this.bunkerPhase === 1) {
      this._updateEnergyShield(dt);
    }

    // ── Phase 2: Rotating shield + drones + area bombs ──
    if (this.bunkerPhase === 2) {
      this.shieldAngle += dt * 1.2;
      this._updateDrones(dt);
      this._updateAreaBombs(dt);
    }

    // ── Phase 3: Laser sweep with gap + rapid shots ──
    if (this.bunkerPhase === 3) {
      this._updateLaserSweepV2(dt);
    }

    // Boss flash telegraph timer
    if (this.bossFlashTimer > 0) {
      this.bossFlashTimer -= dt;
      // Red flash on boss sprite
      if (Math.sin(this.bossFlashTimer * 20) > 0) {
        this.bunkerSprite.setTint(0xff2222);
      } else {
        this.bunkerSprite.clearTint();
      }
      if (this.bossFlashTimer <= 0) {
        this.bunkerSprite.clearTint();
      }
    }

    // Shooting toward boss
    this.shootCooldown -= dt * 1000;
    if (this.keys.space.isDown && this.shootCooldown <= 0) {
      const activeCount = this.playerBullets.filter(b => b.active).length;
      if (activeCount < PLAYER_MAX_BULLETS) {
        this.playerBullets.push({
          x: this.playerX + 20,
          y: this.playerY,
          active: true,
          sprite: this.add.image(this.playerX + 20, this.playerY, 'player_bullet')
            .setDepth(12).setAngle(-90), // bullet goes right
        });
        this.shootCooldown = PLAYER_SHOOT_COOLDOWN;
        this.shotsFired++;
        SoundManager.get().playPlayerShoot();
      }
    }

    // Invulnerability
    this._updateInvulnerability(dt);

    // Bunker attacks
    this._spawnBunkerAttacks(dt);

    // Update projectiles
    this._updatePlayerBullets(dt);
    this._updateSAMs(dt);
    this._updateBossBullets(dt);
    this._updateHomingMissiles(dt);
    this._updateFlakBursts(dt);
    this._updateSmokeParticles(dt);

    // Collisions
    this._checkPlayerCollisions();
    this._checkBunkerCollisions();
    this._checkHeavyBombCollisionsBoss();

    // Phase 2: Drone collisions with player bullets
    if (this.bunkerPhase === 2) {
      this._checkDroneCollisions();
    }

    // Update boss expression based on HP
    this._updateBossExpression();

    // Update sprites + HUD
    this._updatePlayerSprite();
    this.bunkerSprite.setPosition(this.bunkerX, this.bunkerY);
    this._updateAttackHUD();
    this._drawAttackEffects();
  }

  // ═════════════════════════════════════════════════════════════
  // BARREL ROLL — double-tap LEFT or RIGHT within 300ms
  // ═════════════════════════════════════════════════════════════

  _updateBarrelRoll(dt) {
    this.barrelRollCooldown = Math.max(0, this.barrelRollCooldown - dt);

    // Detect double-tap LEFT
    const leftDown = this.keys.left.isDown;
    const rightDown = this.keys.right.isDown;
    const now = this.time.now;

    if (leftDown && !this.prevLeftDown) {
      // Fresh press of LEFT
      if (now - this.lastLeftTapTime < 300 && !this.barrelRollActive && this.barrelRollCooldown <= 0) {
        this._startBarrelRoll();
      }
      this.lastLeftTapTime = now;
    }
    if (rightDown && !this.prevRightDown) {
      // Fresh press of RIGHT
      if (now - this.lastRightTapTime < 300 && !this.barrelRollActive && this.barrelRollCooldown <= 0) {
        this._startBarrelRoll();
      }
      this.lastRightTapTime = now;
    }
    this.prevLeftDown = leftDown;
    this.prevRightDown = rightDown;

    // Also allow SHIFT as an alternative barrel roll trigger
    if (!this.barrelRollActive && this.barrelRollCooldown <= 0 && Phaser.Input.Keyboard.JustDown(this.keys.shift)) {
      this._startBarrelRoll();
    }

    // Update active barrel roll
    if (this.barrelRollActive) {
      this.barrelRollTimer -= dt;
      this.barrelRollAngle += dt * 360; // 360 degrees over ~1 second
      this.playerSprite.setAngle(this.barrelRollAngle);
      this.playerSprite.setAlpha(0.5 + Math.sin(this.barrelRollAngle * 0.1) * 0.3);
      if (this.barrelRollTimer <= 0) {
        this.barrelRollActive = false;
        this.barrelRollCooldown = 3; // 3-second cooldown
        this.barrelRollAngle = 0;
        this.playerSprite.setAngle(0);
        this.playerSprite.setAlpha(1);
      }
    }
  }

  _startBarrelRoll() {
    this.barrelRollActive = true;
    this.barrelRollTimer = 1.0; // 1 second of invulnerability
    this.barrelRollAngle = 0;
    this.invulnTimer = Math.max(this.invulnTimer, 1.0); // 1s invulnerability
    SoundManager.get().playAfterburner();
    this.cameras.main.shake(80, 0.003);
  }

  // ═════════════════════════════════════════════════════════════
  // PHASE 1: ENERGY SHIELD (active 5s, drops 2s)
  // ═════════════════════════════════════════════════════════════

  _updateEnergyShield(dt) {
    this.energyShieldTimer += dt;

    if (!this.energyShieldVulnerable) {
      // Shield is ACTIVE — count up to 5 seconds
      // Flicker effect 0.5s before dropping
      if (this.energyShieldTimer >= 4.5) {
        this.energyShieldFlickerTimer += dt;
      }
      if (this.energyShieldTimer >= 5.0) {
        // Shield drops — 2s vulnerability window
        this.energyShieldVulnerable = true;
        this.energyShieldActive = false;
        this.energyShieldTimer = 0;
        this.energyShieldFlickerTimer = 0;
        SoundManager.get().playShieldDown();
        this._showCenterMessage('SHIELD DOWN — FIRE!', '#00ff00');
      }
    } else {
      // Shield is DOWN — 2 seconds of vulnerability
      if (this.energyShieldTimer >= 2.0) {
        // Shield comes back up
        this.energyShieldVulnerable = false;
        this.energyShieldActive = true;
        this.energyShieldTimer = 0;
        SoundManager.get().playShieldActive();
      }
    }
  }

  // ═════════════════════════════════════════════════════════════
  // PHASE 2: DRONES
  // ═════════════════════════════════════════════════════════════

  _spawnDronePair() {
    // Spawn portal effect first
    const spawnY1 = 80 + Math.random() * 180;
    const spawnY2 = 280 + Math.random() * 180;
    const spawnX = W - 40;

    // Portals appear 1s before drones
    this.droneSpawnPortals.push(
      { x: spawnX, y: spawnY1, timer: 1.0, maxTimer: 1.0 },
      { x: spawnX, y: spawnY2, timer: 1.0, maxTimer: 1.0 },
    );

    this.time.delayedCall(1000, () => {
      if (this.phase !== 'attack' || this.bunkerPhase !== 2) return;
      // Spawn 2 drones
      for (const sy of [spawnY1, spawnY2]) {
        this.drones.push({
          x: spawnX,
          y: sy,
          hp: 2,
          active: true,
          shootTimer: 1.5 + Math.random(),
          vx: -80 - Math.random() * 40,
          vy: (Math.random() - 0.5) * 60,
        });
      }
      SoundManager.get().playDroneHum();
    });
  }

  _updateDrones(dt) {
    // Update portals
    for (const p of this.droneSpawnPortals) {
      p.timer -= dt;
    }
    this.droneSpawnPortals = this.droneSpawnPortals.filter(p => p.timer > 0);

    // Update drones
    for (const d of this.drones) {
      if (!d.active) continue;

      // Fly toward player
      const dx = this.playerX - d.x;
      const dy = this.playerY - d.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;

      // Steer toward player but keep some distance
      if (dist > 150) {
        d.vx += (dx / dist) * 100 * dt;
        d.vy += (dy / dist) * 100 * dt;
      } else {
        // Orbit at distance
        d.vx += (-dy / dist) * 60 * dt;
        d.vy += (dx / dist) * 60 * dt;
      }

      // Clamp speed
      const spd = Math.sqrt(d.vx * d.vx + d.vy * d.vy);
      if (spd > 160) {
        d.vx = (d.vx / spd) * 160;
        d.vy = (d.vy / spd) * 160;
      }

      d.x += d.vx * dt;
      d.y += d.vy * dt;
      d.x = Phaser.Math.Clamp(d.x, 80, W - 20);
      d.y = Phaser.Math.Clamp(d.y, 40, H - 40);

      // Shoot single bullets toward player
      d.shootTimer -= dt;
      if (d.shootTimer <= 0) {
        d.shootTimer = 2 + Math.random();
        const bDist = Math.sqrt(dx * dx + dy * dy) || 1;
        this.bossBullets.push({
          x: d.x,
          y: d.y,
          vx: (dx / bDist) * 200,
          vy: (dy / bDist) * 200,
          active: true,
          sprite: this.add.image(d.x, d.y, 'boss_bullet').setDepth(12),
        });
      }

      // Off-screen removal
      if (d.x < -40 || d.x > W + 40) d.active = false;
    }
    this.drones = this.drones.filter(d => d.active);
  }

  _checkDroneCollisions() {
    // Player bullets hit drones
    for (const b of this.playerBullets) {
      if (!b.active) continue;
      for (const d of this.drones) {
        if (!d.active) continue;
        const dx = b.x - d.x;
        const dy = b.y - d.y;
        if (Math.sqrt(dx * dx + dy * dy) < 20) {
          b.active = false;
          if (b.sprite && b.sprite.active) b.sprite.destroy();
          d.hp--;
          this.shotsHit++;
          SoundManager.get().playDroneHit();
          if (d.hp <= 0) {
            d.active = false;
            SoundManager.get().playExplosion();
          }
          break;
        }
      }
    }

    // Drones collide with player
    if (this.invulnTimer <= 0 && !this.barrelRollActive) {
      for (const d of this.drones) {
        if (!d.active) continue;
        const dx = d.x - this.playerX;
        const dy = d.y - this.playerY;
        if (Math.sqrt(dx * dx + dy * dy) < 25) {
          d.active = false;
          this._damagePlayer();
          return;
        }
      }
    }
  }

  // ═════════════════════════════════════════════════════════════
  // PHASE 2: AREA BOMBS
  // ═════════════════════════════════════════════════════════════

  _dropAreaBomb() {
    // Target near player position with some spread
    const targetX = this.playerX + (Math.random() - 0.5) * 200;
    const targetY = this.playerY + (Math.random() - 0.5) * 200;
    this.areaBombs.push({
      x: Phaser.Math.Clamp(targetX, 60, 600),
      y: Phaser.Math.Clamp(targetY, 60, 480),
      warningTimer: 1.0, // 1 second warning before detonation
      radius: 60, // explosion radius
      active: true,
      detonated: false,
    });
  }

  _updateAreaBombs(dt) {
    for (const bomb of this.areaBombs) {
      if (!bomb.active) continue;

      bomb.warningTimer -= dt;

      if (bomb.warningTimer <= 0 && !bomb.detonated) {
        bomb.detonated = true;
        // Check if player is in the blast zone
        if (this.invulnTimer <= 0 && !this.barrelRollActive) {
          const dx = this.playerX - bomb.x;
          const dy = this.playerY - bomb.y;
          if (Math.sqrt(dx * dx + dy * dy) < bomb.radius) {
            this._damagePlayer();
          }
        }
        SoundManager.get().playExplosion();
        this.cameras.main.shake(150, 0.008);
        // Keep the bomb briefly for visual explosion effect
        bomb.explosionTimer = 0.4;
      }

      if (bomb.detonated) {
        bomb.explosionTimer -= dt;
        if (bomb.explosionTimer <= 0) {
          bomb.active = false;
        }
      }
    }
    this.areaBombs = this.areaBombs.filter(b => b.active);
  }

  // ═════════════════════════════════════════════════════════════
  // PHASE 3: LASER SWEEP WITH GAP
  // ═════════════════════════════════════════════════════════════

  _updateLaserSweepV2(dt) {
    if (!this.laserSweepActive) return;

    // Stage 1: Boss charges with growing red glow (1.5s)
    if (this.laserChargeTimer > 0) {
      this.laserChargeTimer -= dt;
      if (this.laserChargeTimer <= 0) {
        // Move to warning line stage (0.5s)
        this.laserChargeWarningLine = 0.5;
      }
      return;
    }

    // Stage 2: Beam warning line — thin red dashed line showing sweep path (0.5s)
    if (this.laserChargeWarningLine > 0) {
      this.laserChargeWarningLine -= dt;
      if (this.laserChargeWarningLine <= 0) {
        // Start firing
        this.laserFiring = true;
        this.laserFireDuration = 3.0; // 3 seconds of sweep
        SoundManager.get().playBossLaser();
      }
      return;
    }

    // Stage 3: Active laser beam with gap
    if (this.laserFiring) {
      this.laserFireDuration -= dt;

      // Sweep the laser Y position
      const sweepSpeed = 200; // pixels per second
      this.laserSweepY += this.laserSweepDir * sweepSpeed * dt;

      // Bounce at screen edges
      if (this.laserSweepY > H - 40) {
        this.laserSweepY = H - 40;
        this.laserSweepDir = -1;
      } else if (this.laserSweepY < 40) {
        this.laserSweepY = 40;
        this.laserSweepDir = 1;
      }

      // Move the gap — sinusoidal movement for the gap position
      this.laserGapY += this.laserGapVY * dt;
      if (this.laserGapY < 60) { this.laserGapY = 60; this.laserGapVY = Math.abs(this.laserGapVY); }
      if (this.laserGapY > H - 60) { this.laserGapY = H - 60; this.laserGapVY = -Math.abs(this.laserGapVY); }

      // Check collision: laser hits player if not in the gap and not invulnerable
      if (this.invulnTimer <= 0 && !this.barrelRollActive) {
        // The laser is a horizontal line across the screen at laserSweepY
        // It has an 80px gap centered at laserGapY
        const gapTop = this.laserGapY - 40;
        const gapBottom = this.laserGapY + 40;
        const playerInGap = this.playerY >= gapTop && this.playerY <= gapBottom;
        const playerNearLaser = Math.abs(this.playerY - this.laserSweepY) < 18;
        if (playerNearLaser && !playerInGap) {
          this._damagePlayer();
        }
      }

      // End laser after duration
      if (this.laserFireDuration <= 0) {
        this.laserSweepActive = false;
        this.laserFiring = false;
      }
    }
  }

  _updateBossExpression() {
    const hpRatio = this.bunkerHP / this.BUNKER_HP;
    let targetExpression;
    if (hpRatio <= 0) {
      targetExpression = 'dead';
    } else if (hpRatio <= 0.3) {
      targetExpression = 'furious';
    } else if (hpRatio <= 0.6) {
      targetExpression = 'angry';
    } else {
      targetExpression = 'normal';
    }

    if (targetExpression !== this._lastBossExpression) {
      this._lastBossExpression = targetExpression;
      this._bossExpression = targetExpression;
      createBunkerFortress(this);
      if (this.bunkerSprite && this.bunkerSprite.active) {
        this.bunkerSprite.setTexture('bunker_fortress');
      }
    }
  }

  _spawnBunkerAttacks(dt) {
    this.fanMissileTimer += dt;
    this.samTimer += dt;
    this.spreadTimer += dt;
    this.homingTimer += dt;
    this.flakTimer += dt;
    this.laserCooldown = Math.max(0, this.laserCooldown - dt);

    if (this.bunkerPhase === 1) {
      // ── Phase 1: Fan missiles every 3s ──
      if (this.fanMissileTimer >= 3) {
        this.fanMissileTimer = 0;
        // Telegraph: red flash 0.5s before firing
        this.bossFlashTimer = 0.5;
        this.time.delayedCall(500, () => {
          if (this.phase !== 'attack' || this.bunkerPhase !== 1) return;
          this._fireFanMissiles(5);
        });
      }
    } else if (this.bunkerPhase === 2) {
      // ── Phase 2: Rotating shield + drones + area bombs + some SAMs ──
      // Drone spawns — 2 at a time, every 8 seconds
      this.droneSpawnTimer += dt;
      if (this.droneSpawnTimer >= 8) {
        this.droneSpawnTimer = 0;
        this._spawnDronePair();
      }

      // Area bombs every 5 seconds
      this.areaBombTimer += dt;
      if (this.areaBombTimer >= 5) {
        this.areaBombTimer = 0;
        this._dropAreaBomb();
        // Drop a second one offset
        this.time.delayedCall(600, () => {
          if (this.phase !== 'attack' || this.bunkerPhase !== 2) return;
          this._dropAreaBomb();
        });
      }

      // Light SAMs to keep pressure
      if (this.samTimer >= 3) {
        this.samTimer = 0;
        this.bossFlashTimer = 0.5;
        this.time.delayedCall(500, () => {
          if (this.phase !== 'attack' || this.bunkerPhase !== 2) return;
          this._spawnSAMFromBunker(250);
        });
      }

      // Occasional spread
      if (this.spreadTimer >= 4) {
        this.spreadTimer = 0;
        this._fireBunkerSpread(3);
      }
    } else {
      // ── Phase 3: Laser sweep + desperate rapid shots ──

      // Laser sweep attack
      if (!this.laserSweepActive && this.laserCooldown <= 0) {
        this.laserCooldown = 8;
        this.laserSweepActive = true;
        this.laserSweepY = 40; // start at top
        this.laserSweepDir = 1; // top→bottom first
        this.laserGapY = H / 2; // gap starts centered
        this.laserGapVY = 80 + Math.random() * 60; // gap moves
        if (Math.random() > 0.5) this.laserGapVY *= -1;
        this.laserChargeTimer = 1.5; // 1.5s charge-up
        this.laserChargeWarningLine = 0;
        this.laserFiring = false;
        this.laserFireDuration = 0;
        this._showCenterMessage('LASER INCOMING', '#ff4444');
        SoundManager.get().playBossRoar();
      }

      // Desperate rapid shots between laser sweeps
      this.rapidShotTimer += dt;
      if (!this.laserSweepActive && this.rapidShotTimer >= 0.6) {
        this.rapidShotTimer = 0;
        // Fire 2-3 fast bullets aimed at player
        const count = 2 + Math.floor(Math.random() * 2);
        for (let i = 0; i < count; i++) {
          const dx = this.playerX - this.bunkerX;
          const dy = this.playerY - this.bunkerY + (Math.random() - 0.5) * 60;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          this.bossBullets.push({
            x: this.bunkerX - 50,
            y: this.bunkerY + (Math.random() - 0.5) * 30,
            vx: (dx / dist) * 280,
            vy: (dy / dist) * 280,
            active: true,
            sprite: this.add.image(this.bunkerX - 50, this.bunkerY, 'boss_bullet').setDepth(12),
          });
        }
      }

      // Some homing missiles for extra pressure
      if (this.homingTimer >= 5) {
        this.homingTimer = 0;
        this._spawnHomingMissile();
      }
    }

    // Smoke from damaged boss
    if (this.bunkerHP < this.BUNKER_HP * 0.6) {
      const rate = this.bunkerHP < this.BUNKER_HP * 0.25 ? 25 : this.bunkerHP < this.BUNKER_HP * 0.15 ? 35 : 10;
      this.smokeAccum += dt;
      const interval = 1 / rate;
      while (this.smokeAccum >= interval) {
        this.smokeAccum -= interval;
        const isFire = this.bunkerHP < this.BUNKER_HP * 0.15 && Math.random() > 0.5;
        this.smokeParticles.push({
          x: this.bunkerX + (Math.random() - 0.5) * 80,
          y: this.bunkerY + (Math.random() - 0.5) * 40,
          vx: (Math.random() - 0.5) * 20,
          vy: -Math.random() * 40 - 20,
          life: 1.0, maxLife: 1.0,
          size: 3 + Math.random() * 4,
          isFire: isFire,
        });
      }
    }
  }

  // Fire fan pattern missiles (Phase 1)
  _fireFanMissiles(count) {
    const angleStep = 0.8 / (count - 1 || 1);
    const startAngle = Math.PI - 0.4; // spread arc
    SoundManager.get().playHomingMissile();
    for (let i = 0; i < count; i++) {
      const angle = startAngle + angleStep * i;
      const speed = 240;
      this.samMissiles.push({
        x: this.bunkerX - 60,
        y: this.bunkerY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        speed: speed,
        homing: false, // fan missiles are straight, dodgeable with UP/DOWN
        active: true,
      });
    }
  }

  // ═════════════════════════════════════════════════════════════
  // ENEMY SPAWNING
  // ═════════════════════════════════════════════════════════════

  _spawnSAM(speed, homing) {
    const y = 80 + Math.random() * 360;
    this.samMissiles.push({
      x: W + 10,
      y: y,
      vx: -speed,
      vy: 0,
      speed: speed,
      homing: homing,
      active: true,
    });
    SoundManager.get().playHomingMissile();
  }

  _spawnSAMFromBunker(speed) {
    // Fire from boss staff
    const offsets = [-20, 20];
    for (const oy of offsets) {
      this.samMissiles.push({
        x: this.bunkerX - 60,
        y: this.bunkerY + oy,
        vx: -speed,
        vy: 0,
        speed: speed,
        homing: true,
        active: true,
      });
    }
    SoundManager.get().playHomingMissile();
  }

  _fireAABurst(count) {
    // Stream of red bullets from right
    for (let i = 0; i < count; i++) {
      this.time.delayedCall(i * 120, () => {
        if (this.phase !== 'approach' && this.phase !== 'attack' && this.phase !== 'air_defense') return;
        const spawnY = 100 + Math.random() * 340;
        const targetY = this.playerY + (Math.random() - 0.5) * 80;
        this.bossBullets.push({
          x: W + 5,
          y: spawnY,
          vx: -220,
          vy: (targetY - spawnY) * 0.3,
          active: true,
          sprite: this.add.image(W + 5, spawnY, 'boss_bullet').setDepth(12),
        });
      });
    }
  }

  _fireBunkerSpread(count) {
    const angleStep = 0.7 / (count - 1 || 1);
    const startAngle = Math.PI - 0.35;
    for (let i = 0; i < count; i++) {
      const angle = startAngle + angleStep * i;
      this.bossBullets.push({
        x: this.bunkerX - 50,
        y: this.bunkerY,
        vx: Math.cos(angle) * 200,
        vy: Math.sin(angle) * 200,
        active: true,
        sprite: this.add.image(this.bunkerX - 50, this.bunkerY, 'boss_bullet').setDepth(12),
      });
    }
  }

  _spawnHomingMissile() {
    const spawnX = this.phase === 'attack' ? this.bunkerX - 40 : W + 10;
    const spawnY = this.phase === 'attack' ? this.bunkerY : 100 + Math.random() * 300;
    SoundManager.get().playHomingMissile();
    this.homingMissiles.push({
      x: spawnX,
      y: spawnY,
      vx: -60,
      vy: 0,
      speed: 160,
      active: true,
    });
  }

  _spawnFlakBurst() {
    // Orange warning circle at random position ahead of player
    const fx = this.playerX + 150 + Math.random() * 400;
    const fy = 80 + Math.random() * 380;
    this.flakBursts.push({
      x: Phaser.Math.Clamp(fx, 100, W - 50),
      y: fy,
      radius: 0,
      maxRadius: 40 + Math.random() * 30,
      timer: 0,
      duration: 0.8,
      active: true,
    });
  }

  // ═════════════════════════════════════════════════════════════
  // PROJECTILE UPDATES
  // ═════════════════════════════════════════════════════════════

  _updateSAMs(dt) {
    for (const m of this.samMissiles) {
      if (!m.active) continue;

      if (m.homing) {
        // Slight homing — turn toward player Y
        const dy = this.playerY - m.y;
        m.vy += dy * 1.5 * dt;
        m.vy = Phaser.Math.Clamp(m.vy, -150, 150);
      }

      m.x += m.vx * dt;
      m.y += m.vy * dt;

      if (m.x < -20 || m.x > W + 20 || m.y < -20 || m.y > H + 20) {
        m.active = false;
      }
    }
    this.samMissiles = this.samMissiles.filter(m => m.active);
  }

  _updatePlayerBullets(dt) {
    for (const b of this.playerBullets) {
      if (!b.active) continue;
      if (b.airDefBullet) {
        // Air defense bullets have custom trajectory (handled separately)
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        b.sprite.setPosition(b.x, b.y);
        if (b.y > H + 20 || b.x > W + 20 || b.x < -20) {
          b.active = false;
          b.sprite.destroy();
        }
      } else {
        b.x += PLAYER_BULLET_SPEED * dt; // bullets go RIGHT
        b.sprite.setPosition(b.x, b.y);
        if (b.x > W + 20) {
          b.active = false;
          b.sprite.destroy();
        }
      }
    }
    this.playerBullets = this.playerBullets.filter(b => b.active);
  }

  _updateBossBullets(dt) {
    for (const b of this.bossBullets) {
      if (!b.active) continue;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.sprite.setPosition(b.x, b.y);
      if (b.y > H + 20 || b.y < -20 || b.x < -20 || b.x > W + 20) {
        b.active = false;
        b.sprite.destroy();
      }
    }
    this.bossBullets = this.bossBullets.filter(b => b.active);
  }

  _updateHomingMissiles(dt) {
    for (const m of this.homingMissiles) {
      if (!m.active) continue;
      const dx = this.playerX - m.x;
      const dy = this.playerY - m.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 0) {
        m.vx += (dx / dist) * 180 * dt;
        m.vy += (dy / dist) * 180 * dt;
        const spd = Math.sqrt(m.vx * m.vx + m.vy * m.vy);
        if (spd > m.speed) {
          m.vx = (m.vx / spd) * m.speed;
          m.vy = (m.vy / spd) * m.speed;
        }
      }
      m.x += m.vx * dt;
      m.y += m.vy * dt;

      if (m.x < -40 || m.x > W + 40 || m.y < -40 || m.y > H + 40) {
        m.active = false;
      }
    }
    this.homingMissiles = this.homingMissiles.filter(m => m.active);
  }

  _updateFlakBursts(dt) {
    for (const f of this.flakBursts) {
      if (!f.active) continue;
      f.timer += dt;
      f.radius = f.maxRadius * (f.timer / f.duration);
      if (f.timer >= f.duration) {
        f.active = false;
      }
    }
    this.flakBursts = this.flakBursts.filter(f => f.active);
  }

  _updateSmokeParticles(dt) {
    for (const p of this.smokeParticles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      p.size += dt * 2;
    }
    this.smokeParticles = this.smokeParticles.filter(p => p.life > 0);
  }

  // ═════════════════════════════════════════════════════════════
  // COLLISIONS
  // ═════════════════════════════════════════════════════════════

  _checkPlayerCollisions() {
    if (this.invulnTimer > 0 || this.barrelRollActive) return;

    // SAMs → player
    for (const m of this.samMissiles) {
      if (!m.active) continue;
      const dx = m.x - this.playerX;
      const dy = m.y - this.playerY;
      if (Math.sqrt(dx * dx + dy * dy) < 22) {
        m.active = false;
        this._damagePlayer();
        return;
      }
    }

    // Boss bullets → player
    for (const b of this.bossBullets) {
      if (!b.active) continue;
      const dx = b.x - this.playerX;
      const dy = b.y - this.playerY;
      if (Math.sqrt(dx * dx + dy * dy) < 22) {
        b.active = false;
        if (b.sprite && b.sprite.active) b.sprite.destroy();
        this._damagePlayer();
        return;
      }
    }

    // Homing missiles → player
    for (const m of this.homingMissiles) {
      if (!m.active) continue;
      const dx = m.x - this.playerX;
      const dy = m.y - this.playerY;
      if (Math.sqrt(dx * dx + dy * dy) < 20) {
        m.active = false;
        this._damagePlayer();
        return;
      }
    }

    // Flak bursts → player (damage when overlapping expanding ring)
    for (const f of this.flakBursts) {
      if (!f.active) continue;
      const dx = this.playerX - f.x;
      const dy = this.playerY - f.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < f.radius && f.timer > 0.1 && f.timer < 0.5) {
        this._damagePlayer();
        return;
      }
    }
  }

  _checkBunkerCollisions() {
    for (const b of this.playerBullets) {
      if (!b.active) continue;
      const dx = b.x - this.bunkerX;
      const dy = b.y - this.bunkerY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Phase 1: Energy shield blocks ALL damage when active
      if (this.bunkerPhase === 1 && this.energyShieldActive && !this.energyShieldVulnerable && dist < 90) {
        b.active = false;
        if (b.sprite && b.sprite.active) b.sprite.destroy();
        SoundManager.get().playTypewriterClick();
        continue;
      }

      // Phase 2: Rotating shield blocks bullets from the covered arc
      if (this.bunkerPhase === 2 && this.shieldActive && dist < 90) {
        const bulletAngle = Math.atan2(dy, dx);
        const shieldFacing = this.shieldAngle + Math.PI;
        let angleDiff = bulletAngle - shieldFacing;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        if (Math.abs(angleDiff) < Math.PI / 3) {
          b.active = false;
          if (b.sprite && b.sprite.active) b.sprite.destroy();
          SoundManager.get().playTypewriterClick();
          continue;
        }
      }

      if (dist < 70) {
        b.active = false;
        if (b.sprite && b.sprite.active) b.sprite.destroy();
        this.bunkerHP--;
        this.shotsHit++;
        SoundManager.get().playBossHit();
        this.cameras.main.shake(100, 0.005);

        // White flash → red flash → clear
        this.bunkerSprite.setTint(0xffffff);
        this.time.delayedCall(50, () => {
          if (this.bunkerSprite && this.bunkerSprite.active) {
            this.bunkerSprite.setTint(0xff4444);
            this.time.delayedCall(100, () => {
              if (this.bunkerSprite && this.bunkerSprite.active) this.bunkerSprite.clearTint();
            });
          }
        });

        // Debris particles from boss hit
        for (let dp = 0; dp < 5; dp++) {
          const debP = this.add.circle(
            this.bunkerX + (Math.random() - 0.5) * 40,
            this.bunkerY + (Math.random() - 0.5) * 40,
            2 + Math.random() * 3,
            [0x888888, 0x666666, 0xaa8866, 0xff6644][Math.floor(Math.random() * 4)],
            0.8
          ).setDepth(25);
          this.tweens.add({
            targets: debP,
            x: debP.x + (Math.random() - 0.5) * 60,
            y: debP.y + (Math.random() - 0.5) * 60,
            alpha: 0, scale: 0,
            duration: 400 + Math.random() * 300,
            onComplete: () => debP.destroy(),
          });
        }

        // Phase 2 transition: HP <= 60%
        if (this.bunkerHP <= this.BUNKER_HP * 0.6 && !this.phase2Triggered) {
          this.phase2Triggered = true;
          this.bunkerPhase = 2;
          this.energyShieldActive = false;
          this.energyShieldVulnerable = false;
          this.shieldActive = true;
          this.shieldAngle = 0;
          this.droneSpawnTimer = 0;
          this.areaBombTimer = 0;
          this.cameras.main.flash(500, 100, 100, 255);
          SoundManager.get().playBossPhaseTransition();
          MusicManager.get().playLevel6Music(2);
          this._showCenterMessage('ROTATING SHIELD — FLANK IT!', '#8888ff');
          this.instrText.setText('Flank the rotating shield! | Dodge area bombs! | X: Bomb | Double-tap L/R: Roll');
          this.samTimer = 0; this.spreadTimer = 0; this.homingTimer = 0; this.fanMissileTimer = 0;
        }

        // Phase 3 transition: HP <= 30%
        if (this.bunkerHP <= this.BUNKER_HP * 0.3 && !this.phase3Triggered) {
          this.phase3Triggered = true;
          this.bunkerPhase = 3;
          this.shieldActive = false;
          // Clean up phase 2 entities
          this.drones = [];
          this.droneSpawnPortals = [];
          this.areaBombs = [];
          this.cameras.main.flash(500, 255, 50, 0);
          SoundManager.get().playBossPhaseTransition();
          MusicManager.get().playLevel6Music(3);
          this._showCenterMessage('SUPREME FURY — NO SHIELD!', '#ff2222');
          this.instrText.setText('DODGE THE LASER GAP! | Double-tap L/R: Barrel Roll | X: Bomb');
          this.samTimer = 0; this.spreadTimer = 0; this.homingTimer = 0; this.laserCooldown = 2;
          this.rapidShotTimer = 0;
        }

        if (this.bunkerHP <= 0) {
          this.bunkerHP = 0;
          this._updateBossExpression();
          this._startDisintegration();
          return;
        }

        this._updateBossExpression();
      }
    }
  }

  // ═════════════════════════════════════════════════════════════
  // PLAYER DAMAGE
  // ═════════════════════════════════════════════════════════════

  _damagePlayer() {
    this.playerHP--;
    this.damageTaken++;
    this.invulnTimer = INVULN_TIME;
    this.cameras.main.shake(200, 0.01);
    SoundManager.get().playPlayerHit();

    if (this.playerHP <= 0) {
      this.playerHP = 0;
      this._playerDeath();
    }
  }

  _updateInvulnerability(dt) {
    if (this.invulnTimer > 0) {
      this.invulnTimer -= dt;
      this.playerSprite.setAlpha(Math.sin(Date.now() * 0.02) > 0 ? 1 : 0.3);
    } else {
      this.playerSprite.setAlpha(1);
    }
  }

  // ═════════════════════════════════════════════════════════════
  // SPRITE & HUD UPDATES
  // ═════════════════════════════════════════════════════════════

  _updatePlayerSprite() {
    this.playerSprite.setPosition(this.playerX, this.playerY);
  }

  _showCenterMessage(text, color) {
    this.centerMsg.setText(text);
    this.centerMsg.setColor(color);
    this.centerMsg.setAlpha(1);
    this.tweens.add({
      targets: this.centerMsg,
      alpha: 0,
      duration: 800,
      delay: 1200,
    });
  }

  _updateApproachHUD() {
    const remaining = Math.max(0, Math.round(TOTAL_DISTANCE - this.distance));
    this.hudDistance.setText(`DISTANCE: ${remaining}m`);
    this.hudPlayerHP.setText(`HP: ${this.playerHP}/${this.PLAYER_MAX_HP}`);
    this.hudPlayerHP.setColor(this.playerHP <= 2 ? '#ff4444' : '#ffffff');
    this.hudAntiMissile.setText(`PULSE: ${this.antiMissileCharges}/${ANTI_MISSILE_MAX_CHARGES}`);
    this.hudAntiMissile.setColor(this.antiMissileCooldown > 0 ? '#666666' : '#00ffff');
  }

  _updateAttackHUD() {
    const phaseLabels = { 1: 'PHASE 1: ENERGY SHIELD', 2: 'PHASE 2: ROTATING SHIELD', 3: 'PHASE 3: SUPREME FURY' };
    this.hudDistance.setText(phaseLabels[this.bunkerPhase] || 'ENGAGED');
    this.hudPlayerHP.setText(`HP: ${this.playerHP}/${this.PLAYER_MAX_HP}`);
    this.hudPlayerHP.setColor(this.playerHP <= 2 ? '#ff4444' : '#ffffff');
    this.hudAntiMissile.setText(`PULSE: ${this.antiMissileCharges}/${ANTI_MISSILE_MAX_CHARGES}`);
    this.hudAntiMissile.setColor(this.antiMissileCooldown > 0 ? '#666666' : '#00ffff');
    this.hudBombs.setText(`BOMBS: ${this.heavyBombsRemaining}/${HEAVY_BOMB_MAX}`);
    this.hudBombs.setColor(this.heavyBombCooldown > 0 ? '#666666' : (this.heavyBombsRemaining > 0 ? '#ff8800' : '#444444'));

    // Boss HP bar
    const hpRatio = this.bunkerHP / this.BUNKER_HP;
    this.hpBarFill.setScale(hpRatio, 1);

    // Color the HP bar based on phase
    if (this.bunkerPhase === 3) {
      this.hpBarFill.setFillStyle(0xff2222);
    } else if (this.bunkerPhase === 2) {
      this.hpBarFill.setFillStyle(0xff8844);
    } else {
      this.hpBarFill.setFillStyle(0xff2222);
    }
  }

  // ═════════════════════════════════════════════════════════════
  // DRAWING EFFECTS
  // ═════════════════════════════════════════════════════════════

  _drawAntiMissilePulse() {
    if (!this.antiMissilePulseActive) return;
    const t = this.antiMissilePulseTimer / 0.4; // 0 to 1
    const radius = ANTI_MISSILE_RADIUS * t;
    const alpha = 1 - t;
    // Cyan expanding ring
    this.effectsGfx.lineStyle(3, 0x00ffff, alpha * 0.8);
    this.effectsGfx.strokeCircle(this.antiMissilePulseX, this.antiMissilePulseY, radius);
    // Inner glow
    this.effectsGfx.lineStyle(8, 0x00ffff, alpha * 0.2);
    this.effectsGfx.strokeCircle(this.antiMissilePulseX, this.antiMissilePulseY, radius * 0.8);
    // Flash fill
    if (t < 0.3) {
      this.effectsGfx.fillStyle(0x00ffff, alpha * 0.15);
      this.effectsGfx.fillCircle(this.antiMissilePulseX, this.antiMissilePulseY, radius);
    }
  }

  _drawAntiMissileCooldownBar() {
    if (this.antiMissileCharges <= 0 && this.antiMissileCooldown <= 0) return;
    const barY = this.playerY + 25;
    if (this.antiMissileCooldown > 0) {
      const pct = this.antiMissileCooldown / ANTI_MISSILE_COOLDOWN;
      this.effectsGfx.fillStyle(0x333333, 0.3);
      this.effectsGfx.fillRect(this.playerX - 12, barY, 24, 3);
      this.effectsGfx.fillStyle(0x00ffff, 0.6);
      this.effectsGfx.fillRect(this.playerX - 12, barY, 24 * (1 - pct), 3);
    } else if (this.antiMissileCharges > 0) {
      // Ready indicator - full cyan bar
      this.effectsGfx.fillStyle(0x00ffff, 0.4);
      this.effectsGfx.fillRect(this.playerX - 12, barY, 24, 3);
    }
  }

  _drawHeavyBombCooldownBar() {
    if (this.heavyBombsRemaining <= 0) return;
    const barY = this.playerY + 29;
    if (this.heavyBombCooldown > 0) {
      const pct = this.heavyBombCooldown / HEAVY_BOMB_COOLDOWN;
      this.effectsGfx.fillStyle(0x333333, 0.3);
      this.effectsGfx.fillRect(this.playerX - 12, barY, 24, 3);
      this.effectsGfx.fillStyle(0xff8800, 0.6);
      this.effectsGfx.fillRect(this.playerX - 12, barY, 24 * (1 - pct), 3);
    } else {
      this.effectsGfx.fillStyle(0xff8800, 0.4);
      this.effectsGfx.fillRect(this.playerX - 12, barY, 24, 3);
    }
  }

  _drawApproachEffects() {
    this.effectsGfx.clear();

    // SAM missiles
    for (const m of this.samMissiles) {
      if (!m.active) continue;
      // Missile body
      this.effectsGfx.fillStyle(0xdddddd, 1);
      this.effectsGfx.fillRect(m.x - 6, m.y - 2, 12, 4);
      // Red nose
      this.effectsGfx.fillStyle(0xff3333, 1);
      this.effectsGfx.fillRect(m.x - 6, m.y - 2, 3, 4);
      // Exhaust
      this.effectsGfx.fillStyle(0xff8800, 0.7);
      this.effectsGfx.fillCircle(m.x + 7, m.y, 3);
      this.effectsGfx.fillStyle(0xffcc00, 0.5);
      this.effectsGfx.fillCircle(m.x + 9, m.y, 2);
    }

    // Homing missiles
    for (const m of this.homingMissiles) {
      if (!m.active) continue;
      this.effectsGfx.fillStyle(0xff2222, 1);
      this.effectsGfx.fillCircle(m.x, m.y, 5);
      this.effectsGfx.fillStyle(0xff6600, 0.5);
      this.effectsGfx.fillCircle(m.x, m.y, 8);
    }

    // Flak bursts
    for (const f of this.flakBursts) {
      if (!f.active) continue;
      const alpha = 1 - f.timer / f.duration;
      this.effectsGfx.lineStyle(3, 0xff8800, alpha * 0.6);
      this.effectsGfx.strokeCircle(f.x, f.y, f.radius);
      this.effectsGfx.fillStyle(0xff6600, alpha * 0.2);
      this.effectsGfx.fillCircle(f.x, f.y, f.radius * 0.5);
    }

    // Anti-missile pulse visual
    this._drawAntiMissilePulse();

    // Dodge cooldown indicator
    if (this.dodgeCooldown > 0) {
      const pct = this.dodgeCooldown / 1.5;
      this.effectsGfx.fillStyle(0x666666, 0.3);
      this.effectsGfx.fillRect(this.playerX - 12, this.playerY + 20, 24, 3);
      this.effectsGfx.fillStyle(0x00e5ff, 0.6);
      this.effectsGfx.fillRect(this.playerX - 12, this.playerY + 20, 24 * (1 - pct), 3);
    }

    // Anti-missile cooldown indicator
    this._drawAntiMissileCooldownBar();
  }

  _drawAttackEffects() {
    this.effectsGfx.clear();

    // SAM missiles
    for (const m of this.samMissiles) {
      if (!m.active) continue;
      this.effectsGfx.fillStyle(0xdddddd, 1);
      this.effectsGfx.fillRect(m.x - 6, m.y - 2, 12, 4);
      this.effectsGfx.fillStyle(0xff3333, 1);
      this.effectsGfx.fillRect(m.x - 6, m.y - 2, 3, 4);
      this.effectsGfx.fillStyle(0xff8800, 0.7);
      this.effectsGfx.fillCircle(m.x + 7, m.y, 3);
    }

    // Homing missiles
    for (const m of this.homingMissiles) {
      if (!m.active) continue;
      this.effectsGfx.fillStyle(0xff2222, 1);
      this.effectsGfx.fillCircle(m.x, m.y, 5);
      this.effectsGfx.fillStyle(0xff6600, 0.5);
      this.effectsGfx.fillCircle(m.x, m.y, 8);
    }

    // Flak bursts
    for (const f of this.flakBursts) {
      if (!f.active) continue;
      const alpha = 1 - f.timer / f.duration;
      this.effectsGfx.lineStyle(3, 0xff8800, alpha * 0.6);
      this.effectsGfx.strokeCircle(f.x, f.y, f.radius);
      this.effectsGfx.fillStyle(0xff6600, alpha * 0.2);
      this.effectsGfx.fillCircle(f.x, f.y, f.radius * 0.5);
    }

    // Smoke particles
    for (const p of this.smokeParticles) {
      const alpha = (p.life / p.maxLife) * 0.5;
      if (p.isFire) {
        this.effectsGfx.fillStyle(0xff4400, alpha);
        this.effectsGfx.fillCircle(p.x, p.y, p.size * 0.8);
        this.effectsGfx.fillStyle(0xff8800, alpha * 0.5);
        this.effectsGfx.fillCircle(p.x, p.y, p.size * 1.2);
      } else {
        this.effectsGfx.fillStyle(0x666666, alpha);
        this.effectsGfx.fillCircle(p.x, p.y, p.size);
      }
    }

    // ── Phase 1: Energy Shield rendering ──
    if (this.bunkerPhase === 1 && this.energyShieldActive && !this.energyShieldVulnerable) {
      const sx = this.bunkerX, sy = this.bunkerY;
      const shieldR = 90;
      // Flicker effect in the last 0.5s before dropping
      let shieldAlpha = 0.5;
      let shieldColor = 0x44aaff;
      if (this.energyShieldTimer >= 4.5) {
        // Flickering: turns red, then drops
        const flickerProg = (this.energyShieldTimer - 4.5) / 0.5; // 0 to 1
        shieldColor = flickerProg > 0.5 ? 0xff2222 : 0xff8844;
        shieldAlpha = Math.sin(this.energyShieldFlickerTimer * 30) > 0 ? 0.6 : 0.15;
      }
      // Full circle energy shield
      this.effectsGfx.lineStyle(4, shieldColor, shieldAlpha);
      this.effectsGfx.strokeCircle(sx, sy, shieldR);
      this.effectsGfx.lineStyle(10, shieldColor, shieldAlpha * 0.3);
      this.effectsGfx.strokeCircle(sx, sy, shieldR);
      // Inner glow
      this.effectsGfx.fillStyle(shieldColor, shieldAlpha * 0.08);
      this.effectsGfx.fillCircle(sx, sy, shieldR);
    }

    // ── Phase 2: Rotating Shield rendering ──
    if (this.bunkerPhase === 2 && this.shieldActive) {
      const sx = this.bunkerX, sy = this.bunkerY;
      const shieldR = 85;
      const facing = this.shieldAngle + Math.PI;
      const arcHalf = Math.PI / 3;
      this.effectsGfx.lineStyle(4, 0x6666ff, 0.6);
      this.effectsGfx.beginPath();
      this.effectsGfx.arc(sx, sy, shieldR, facing - arcHalf, facing + arcHalf, false);
      this.effectsGfx.strokePath();
      this.effectsGfx.lineStyle(8, 0x4444ff, 0.15);
      this.effectsGfx.beginPath();
      this.effectsGfx.arc(sx, sy, shieldR, facing - arcHalf, facing + arcHalf, false);
      this.effectsGfx.strokePath();
    }

    // ── Phase 2: Drone spawn portals ──
    for (const p of this.droneSpawnPortals) {
      const t = 1 - p.timer / p.maxTimer;
      const portalR = 10 + t * 20;
      const portalAlpha = 0.3 + t * 0.5;
      // Swirling purple portal
      this.effectsGfx.lineStyle(3, 0xaa44ff, portalAlpha);
      this.effectsGfx.strokeCircle(p.x, p.y, portalR);
      this.effectsGfx.lineStyle(6, 0x8822cc, portalAlpha * 0.4);
      this.effectsGfx.strokeCircle(p.x, p.y, portalR * 0.7);
      this.effectsGfx.fillStyle(0xcc66ff, portalAlpha * 0.2);
      this.effectsGfx.fillCircle(p.x, p.y, portalR * 0.5);
    }

    // ── Phase 2: Drones ──
    for (const d of this.drones) {
      if (!d.active) continue;
      // Small enemy jet body
      this.effectsGfx.fillStyle(0x888888, 1);
      this.effectsGfx.fillRect(d.x - 10, d.y - 4, 20, 8);
      // Wings
      this.effectsGfx.fillStyle(0x666666, 1);
      this.effectsGfx.fillRect(d.x - 5, d.y - 8, 10, 3);
      this.effectsGfx.fillRect(d.x - 5, d.y + 5, 10, 3);
      // Red cockpit
      this.effectsGfx.fillStyle(0xff2222, 1);
      this.effectsGfx.fillCircle(d.x - 8, d.y, 3);
      // Engine glow
      this.effectsGfx.fillStyle(0xff6600, 0.6);
      this.effectsGfx.fillCircle(d.x + 12, d.y, 3);
      // HP indicator
      if (d.hp > 0) {
        this.effectsGfx.fillStyle(d.hp > 1 ? 0x00ff00 : 0xff4444, 0.7);
        this.effectsGfx.fillRect(d.x - 8, d.y - 12, 16 * (d.hp / 2), 2);
      }
    }

    // ── Phase 2: Area Bombs ──
    for (const bomb of this.areaBombs) {
      if (!bomb.active) continue;
      if (!bomb.detonated) {
        // Warning circle — pulsing red, growing to explosion radius
        const t = 1 - bomb.warningTimer; // 0 to 1 over 1 second
        const currentRadius = bomb.radius * (0.3 + t * 0.7);
        const pulseAlpha = 0.2 + Math.sin(t * 20) * 0.15;
        // Outer warning ring
        this.effectsGfx.lineStyle(3, 0xff0000, pulseAlpha + 0.2);
        this.effectsGfx.strokeCircle(bomb.x, bomb.y, currentRadius);
        // Inner fill — growing red zone
        this.effectsGfx.fillStyle(0xff0000, pulseAlpha * 0.4);
        this.effectsGfx.fillCircle(bomb.x, bomb.y, currentRadius);
        // Cross-hair at center
        this.effectsGfx.lineStyle(1, 0xff4444, 0.6);
        this.effectsGfx.beginPath();
        this.effectsGfx.moveTo(bomb.x - 10, bomb.y);
        this.effectsGfx.lineTo(bomb.x + 10, bomb.y);
        this.effectsGfx.moveTo(bomb.x, bomb.y - 10);
        this.effectsGfx.lineTo(bomb.x, bomb.y + 10);
        this.effectsGfx.strokePath();
      } else {
        // Explosion visual
        const t = bomb.explosionTimer / 0.4;
        this.effectsGfx.fillStyle(0xff6600, t * 0.6);
        this.effectsGfx.fillCircle(bomb.x, bomb.y, bomb.radius * (1.2 - t * 0.4));
        this.effectsGfx.fillStyle(0xffcc00, t * 0.4);
        this.effectsGfx.fillCircle(bomb.x, bomb.y, bomb.radius * 0.5 * t);
      }
    }

    // ── Phase 3: Laser Sweep with Gap rendering ──
    if (this.laserSweepActive) {
      if (this.laserChargeTimer > 0) {
        // Stage 1: Growing red glow at boss position (1.5s charge)
        const chargeProgress = 1 - (this.laserChargeTimer / 1.5);
        const glowRadius = 15 + chargeProgress * 40;
        this.effectsGfx.fillStyle(0xff0000, 0.2 + chargeProgress * 0.5);
        this.effectsGfx.fillCircle(this.bunkerX - 60, this.bunkerY, glowRadius);
        this.effectsGfx.fillStyle(0xff4400, 0.3 + chargeProgress * 0.4);
        this.effectsGfx.fillCircle(this.bunkerX - 60, this.bunkerY, glowRadius * 0.4);
        // Pulsing indicator lines
        const pAlpha = Math.sin(Date.now() * 0.02) * 0.2 + 0.3;
        this.effectsGfx.lineStyle(1, 0xff2222, pAlpha * chargeProgress);
        this.effectsGfx.beginPath();
        this.effectsGfx.moveTo(this.bunkerX - 60, this.bunkerY);
        this.effectsGfx.lineTo(0, this.bunkerY);
        this.effectsGfx.strokePath();
      } else if (this.laserChargeWarningLine > 0) {
        // Stage 2: Thin red dashed warning line showing sweep path (0.5s)
        const warningAlpha = Math.sin(Date.now() * 0.025) * 0.3 + 0.5;
        // Draw the warning line across the screen
        this.effectsGfx.lineStyle(2, 0xff4444, warningAlpha);
        this.effectsGfx.beginPath();
        this.effectsGfx.moveTo(this.bunkerX - 60, this.bunkerY);
        this.effectsGfx.lineTo(0, this.laserSweepY);
        this.effectsGfx.strokePath();
        // Show where the gap will be
        this.effectsGfx.fillStyle(0x00ff00, warningAlpha * 0.3);
        this.effectsGfx.fillRect(0, this.laserGapY - 40, W, 80);
        // Continue showing charge glow
        this.effectsGfx.fillStyle(0xff0000, 0.5);
        this.effectsGfx.fillCircle(this.bunkerX - 60, this.bunkerY, 30);
      } else if (this.laserFiring) {
        // Stage 3: Active laser beam with gap
        const bx = this.bunkerX - 60;
        const ly = this.laserSweepY;
        const gapTop = this.laserGapY - 40;
        const gapBottom = this.laserGapY + 40;

        // Draw laser ABOVE the gap
        if (ly >= 0 && ly < gapTop) {
          // Laser is above gap — full beam at ly
          this.effectsGfx.lineStyle(8, 0xff0000, 0.8);
          this.effectsGfx.beginPath();
          this.effectsGfx.moveTo(bx, ly);
          this.effectsGfx.lineTo(0, ly);
          this.effectsGfx.strokePath();
          this.effectsGfx.lineStyle(20, 0xff0000, 0.15);
          this.effectsGfx.beginPath();
          this.effectsGfx.moveTo(bx, ly);
          this.effectsGfx.lineTo(0, ly);
          this.effectsGfx.strokePath();
        } else if (ly >= gapTop && ly <= gapBottom) {
          // Laser line is in gap zone — draw beam above and below gap
          // Above gap
          this.effectsGfx.lineStyle(8, 0xff0000, 0.8);
          this.effectsGfx.beginPath();
          this.effectsGfx.moveTo(bx, ly);
          this.effectsGfx.lineTo(0, ly);
          this.effectsGfx.strokePath();
          this.effectsGfx.lineStyle(20, 0xff0000, 0.15);
          this.effectsGfx.beginPath();
          this.effectsGfx.moveTo(bx, ly);
          this.effectsGfx.lineTo(0, ly);
          this.effectsGfx.strokePath();
        } else {
          // Laser is below gap — full beam at ly
          this.effectsGfx.lineStyle(8, 0xff0000, 0.8);
          this.effectsGfx.beginPath();
          this.effectsGfx.moveTo(bx, ly);
          this.effectsGfx.lineTo(0, ly);
          this.effectsGfx.strokePath();
          this.effectsGfx.lineStyle(20, 0xff0000, 0.15);
          this.effectsGfx.beginPath();
          this.effectsGfx.moveTo(bx, ly);
          this.effectsGfx.lineTo(0, ly);
          this.effectsGfx.strokePath();
        }

        // Draw the gap indicator — safe zone highlighted in green
        this.effectsGfx.fillStyle(0x00ff44, 0.08);
        this.effectsGfx.fillRect(0, gapTop, bx, gapBottom - gapTop);
        // Gap border lines
        this.effectsGfx.lineStyle(1, 0x00ff44, 0.4);
        this.effectsGfx.beginPath();
        this.effectsGfx.moveTo(0, gapTop);
        this.effectsGfx.lineTo(bx, gapTop);
        this.effectsGfx.moveTo(0, gapBottom);
        this.effectsGfx.lineTo(bx, gapBottom);
        this.effectsGfx.strokePath();

        // Charge glow at boss
        this.effectsGfx.fillStyle(0xff0000, 0.4);
        this.effectsGfx.fillCircle(bx, this.bunkerY, 25);
      }
    }

    // Heavy bombs
    this._drawHeavyBombs();

    // Anti-missile pulse visual
    this._drawAntiMissilePulse();

    // Barrel roll cooldown indicator (replaces dodge cooldown in attack)
    if (this.barrelRollCooldown > 0) {
      const pct = this.barrelRollCooldown / 3;
      this.effectsGfx.fillStyle(0x666666, 0.3);
      this.effectsGfx.fillRect(this.playerX - 12, this.playerY + 20, 24, 3);
      this.effectsGfx.fillStyle(0xff44ff, 0.6);
      this.effectsGfx.fillRect(this.playerX - 12, this.playerY + 20, 24 * (1 - pct), 3);
    } else if (!this.barrelRollActive) {
      // Ready indicator
      this.effectsGfx.fillStyle(0xff44ff, 0.4);
      this.effectsGfx.fillRect(this.playerX - 12, this.playerY + 20, 24, 3);
    }

    // Barrel roll active visual — spinning trail
    if (this.barrelRollActive) {
      const trailAlpha = 0.3 + Math.sin(this.barrelRollAngle * 0.15) * 0.2;
      this.effectsGfx.fillStyle(0x44aaff, trailAlpha);
      this.effectsGfx.fillCircle(this.playerX, this.playerY, 20);
      this.effectsGfx.lineStyle(2, 0x88ccff, trailAlpha * 0.6);
      this.effectsGfx.strokeCircle(this.playerX, this.playerY, 25);
    }

    // Heavy bomb cooldown indicator
    this._drawHeavyBombCooldownBar();

    // Anti-missile cooldown indicator
    this._drawAntiMissileCooldownBar();

    // Damage marks on boss
    if (this.bunkerHP < this.BUNKER_HP * 0.5) {
      this.effectsGfx.lineStyle(2, 0xff4422, 0.8);
      const bx = this.bunkerX, by = this.bunkerY;
      this.effectsGfx.beginPath();
      this.effectsGfx.moveTo(bx - 30, by - 30);
      this.effectsGfx.lineTo(bx - 10, by - 5);
      this.effectsGfx.lineTo(bx - 25, by + 15);
      this.effectsGfx.strokePath();
    }
    if (this.bunkerHP < this.BUNKER_HP * 0.25) {
      this.effectsGfx.lineStyle(2, 0xff6600, 0.8);
      const bx = this.bunkerX, by = this.bunkerY;
      this.effectsGfx.beginPath();
      this.effectsGfx.moveTo(bx + 30, by - 25);
      this.effectsGfx.lineTo(bx + 10, by + 5);
      this.effectsGfx.lineTo(bx + 25, by + 30);
      this.effectsGfx.strokePath();
      this.effectsGfx.beginPath();
      this.effectsGfx.moveTo(bx - 15, by + 20);
      this.effectsGfx.lineTo(bx + 5, by + 35);
      this.effectsGfx.strokePath();
    }
    if (this.bunkerHP < this.BUNKER_HP * 0.15) {
      const bx = this.bunkerX, by = this.bunkerY;
      const fireAlpha = 0.15 + Math.sin(Date.now() * 0.01) * 0.1;
      this.effectsGfx.fillStyle(0xff2200, fireAlpha);
      this.effectsGfx.fillCircle(bx - 20, by - 10, 12);
      this.effectsGfx.fillCircle(bx + 15, by + 5, 10);
      this.effectsGfx.fillCircle(bx - 5, by + 20, 8);
      this.effectsGfx.lineStyle(2, 0xff8822, 0.6);
      this.effectsGfx.beginPath();
      this.effectsGfx.moveTo(bx - 40, by - 10);
      this.effectsGfx.lineTo(bx - 20, by + 10);
      this.effectsGfx.lineTo(bx - 35, by + 25);
      this.effectsGfx.strokePath();
      this.effectsGfx.beginPath();
      this.effectsGfx.moveTo(bx + 20, by - 35);
      this.effectsGfx.lineTo(bx + 35, by - 15);
      this.effectsGfx.lineTo(bx + 15, by + 15);
      this.effectsGfx.strokePath();
    }
  }

  // ═════════════════════════════════════════════════════════════
  // PLAYER DEATH
  // ═════════════════════════════════════════════════════════════

  _playerDeath() {
    this.phase = 'dead';
    MusicManager.get().stop(1);
    SoundManager.get().playGameOver();

    this.cameras.main.flash(300, 255, 100, 0);
    this.cameras.main.shake(500, 0.03);
    this.playerSprite.setVisible(false);

    this.time.delayedCall(800, () => {
      const accuracy = this.shotsFired > 0 ? Math.round((this.shotsHit / this.shotsFired) * 100) : 0;
      const distCovered = Math.min(Math.round(this.distance), TOTAL_DISTANCE);
      const stats = [
        { label: 'DISTANCE COVERED', value: `${distCovered}m` },
        { label: 'SHOTS FIRED', value: `${this.shotsFired}` },
        { label: 'ACCURACY', value: `${accuracy}%` },
        { label: 'DAMAGE TAKEN', value: `${this.damageTaken}` },
        { label: 'BOSS HP REMAINING', value: `${Math.round((this.bunkerHP / this.BUNKER_HP) * 100)}%` },
      ];
      this._endScreen = showDefeatScreen(this, {
        title: 'MISSION FAILED', stats,
        currentScene: 'BossScene',
        skipScene: 'VictoryScene',
      });
    });
  }

  // ═════════════════════════════════════════════════════════════
  // DISINTEGRATION — THE SPECTACULAR PIXEL DEATH
  // ═════════════════════════════════════════════════════════════

  _startDisintegration() {
    this.phase = 'disintegrating';
    this.disintTimer = 0;

    // Stop all attacks
    this._cleanupFight();

    // ── ENHANCED DEATH SEQUENCE ──
    // Step 1: Boss freezes — freeze frame
    // Step 2: Screen flash white (0.5s)
    this.cameras.main.flash(800, 255, 255, 255);
    // Step 3: Camera shake for 2 seconds
    this.cameras.main.shake(2000, 0.03);
    // Step 4: Mega explosion sound
    SoundManager.get().playMegaExplosion();

    // Spawn mega explosion particles around boss
    this._deathExplosionParticles = [];
    for (let i = 0; i < 40; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 80 + Math.random() * 200;
      this._deathExplosionParticles.push({
        x: this.bunkerX + (Math.random() - 0.5) * 60,
        y: this.bunkerY + (Math.random() - 0.5) * 40,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1.5 + Math.random(),
        maxLife: 1.5 + Math.random(),
        size: 5 + Math.random() * 15,
        color: [0xff2200, 0xff6600, 0xffcc00, 0xffffff][Math.floor(Math.random() * 4)],
      });
    }

    // Play disintegration music after a brief delay
    this.time.delayedCall(300, () => {
      MusicManager.get().playDisintegrationMusic();
    });

    // Create offscreen canvas for batched particle rendering
    this.disintCanvas = document.createElement('canvas');
    this.disintCanvas.width = W;
    this.disintCanvas.height = H;
    this.disintCtx = this.disintCanvas.getContext('2d');
    this.disintTexKey = 'disint_particles_' + Date.now();
    this.textures.addCanvas(this.disintTexKey, this.disintCanvas);
    this.disintImage = this.add.image(W / 2, H / 2, this.disintTexKey).setDepth(15);

    // Extract pixels from boss texture after 1s freeze (longer than before for dramatic effect)
    this.time.delayedCall(1000, () => {
      this._extractBunkerPixels();
      this.bunkerSprite.setVisible(false);
      SoundManager.get().playDisintegrate();
    });
  }

  _extractBunkerPixels() {
    const texKey = 'bunker_fortress';
    const source = this.textures.get(texKey).getSourceImage();
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = source.width;
    tempCanvas.height = source.height;
    const ctx = tempCanvas.getContext('2d');
    ctx.drawImage(source, 0, 0);

    const imgData = ctx.getImageData(0, 0, source.width, source.height);
    const data = imgData.data;
    const step = 4; // sample every 4th pixel
    const cx = source.width / 2;
    const cy = source.height / 2;

    for (let py = 0; py < source.height; py += step) {
      for (let px = 0; px < source.width; px += step) {
        const idx = (py * source.width + px) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        const a = data[idx + 3];
        if (a < 10) continue;

        // Map pixel position to world position (boss at full scale)
        const worldX = this.bunkerX + (px - cx);
        const worldY = this.bunkerY + (py - cy);
        const distFromCenter = Math.sqrt((px - cx) * (px - cx) + (py - cy) * (py - cy));

        // Core pixels — staff glow / red-tinted details
        const isCore = distFromCenter < 30 && r > 150 && r > g * 2;

        this.disintPixels.push({
          x: worldX,
          y: worldY,
          origX: worldX,
          origY: worldY,
          color: (r << 16) | (g << 8) | b,
          vx: 0,
          vy: 0,
          alpha: 1,
          size: 4,
          distFromCenter: distFromCenter,
          isCore: isCore,
          detachTime: isCore ? 1.5 + Math.random() * 0.5 : (distFromCenter / (cx * 1.5)) * 1.5,
          detached: false,
        });
      }
    }
  }

  _updateDisintegration(dt) {
    this.disintTimer += dt;

    // Update and draw mega explosion particles on the effects layer
    if (this._deathExplosionParticles && this._deathExplosionParticles.length > 0) {
      this.effectsGfx.clear();
      for (const p of this._deathExplosionParticles) {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt;
        p.size *= 0.98;
        if (p.life > 0) {
          const alpha = (p.life / p.maxLife) * 0.8;
          this.effectsGfx.fillStyle(p.color, alpha);
          this.effectsGfx.fillCircle(p.x, p.y, p.size);
          this.effectsGfx.fillStyle(p.color, alpha * 0.3);
          this.effectsGfx.fillCircle(p.x, p.y, p.size * 1.5);
        }
      }
      this._deathExplosionParticles = this._deathExplosionParticles.filter(p => p.life > 0);
    }

    // 0-1.0s: freeze frame (longer for dramatic effect)
    if (this.disintTimer < 1.0) return;

    const elapsed = this.disintTimer - 1.0;

    // Clear offscreen canvas and write pixels via ImageData
    const ctx = this.disintCtx;
    ctx.clearRect(0, 0, W, H);
    const imgData = ctx.createImageData(W, H);
    const buf = imgData.data;

    let aliveCount = 0;

    for (const p of this.disintPixels) {
      if (!p.detached && elapsed >= p.detachTime) {
        p.detached = true;
        const angle = Math.random() * Math.PI * 2;
        const speed = 50 + Math.random() * 150 + (p.distFromCenter * 0.3);
        p.vx = Math.cos(angle) * speed;
        p.vy = Math.sin(angle) * speed;
      }

      if (!p.detached) {
        const jitterX = (Math.random() - 0.5) * 4;
        const jitterY = (Math.random() - 0.5) * 4;
        p.x = p.origX + jitterX;
        p.y = p.origY + jitterY;
      } else {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 30 * dt;

        const timeSinceDetach = elapsed - p.detachTime;
        p.alpha = Math.max(0, 1 - timeSinceDetach / 2.5);
        p.size = Math.max(1, 4 - timeSinceDetach * 1.2);
      }

      if (p.alpha > 0.01) {
        aliveCount++;
        const r = (p.color >> 16) & 0xff;
        const g = (p.color >> 8) & 0xff;
        const b = p.color & 0xff;
        const a = Math.round(p.alpha * 255);
        const sz = Math.round(p.size);
        const startX = Math.round(p.x - sz / 2);
        const startY = Math.round(p.y - sz / 2);

        for (let dy = 0; dy < sz; dy++) {
          const py = startY + dy;
          if (py < 0 || py >= H) continue;
          for (let dx = 0; dx < sz; dx++) {
            const px = startX + dx;
            if (px < 0 || px >= W) continue;
            const idx = (py * W + px) * 4;
            buf[idx] = r;
            buf[idx + 1] = g;
            buf[idx + 2] = b;
            buf[idx + 3] = a;
          }
        }
      }
    }

    ctx.putImageData(imgData, 0, 0);
    this.textures.get(this.disintTexKey).refresh();

    // Screen shake (decreasing)
    if (elapsed < 3.5) {
      const intensity = 0.02 * (1 - elapsed / 3.5);
      this.cameras.main.shake(50, intensity);
    }

    // All particles faded → victory
    if (elapsed >= 4 || aliveCount === 0) {
      this.phase = 'victory_pending';
      this.disintPixels = [];
      if (this.disintImage) this.disintImage.destroy();
      this.disintImage = null;

      this.time.delayedCall(500, () => {
        this._showVictory();
      });
    }
  }

  // ═════════════════════════════════════════════════════════════
  // VICTORY / CREDITS
  // ═════════════════════════════════════════════════════════════

  _showVictory() {
    this.phase = 'victory';
    MusicManager.get().playVictoryMusic();
    SoundManager.get().playFinalVictory();

    // Stats
    const accuracy = this.shotsFired > 0 ? Math.round((this.shotsHit / this.shotsFired) * 100) : 0;
    const distCovered = Math.min(Math.round(this.distance), TOTAL_DISTANCE);

    // Star rating
    const starCount = this.playerHP >= 4 && accuracy >= 35 ? 3
      : this.playerHP >= 2 ? 2 : 1;

    // Save star rating
    try { localStorage.setItem('superzion_stars_6', String(starCount)); } catch (e) {}

    const stats = [
      { label: 'DISTANCE COVERED', value: `${distCovered}m` },
      { label: 'SHOTS FIRED', value: `${this.shotsFired}` },
      { label: 'ACCURACY', value: `${accuracy}%` },
      { label: 'DAMAGE TAKEN', value: `${this.damageTaken}` },
    ];
    this._endScreen = showVictoryScreen(this, {
      title: 'VICTORY', stats, stars: starCount,
      currentScene: 'BossScene',
      nextScene: 'VictoryScene',
    });
  }

  // ═════════════════════════════════════════════════════════════
  // CLEANUP & PAUSE
  // ═════════════════════════════════════════════════════════════

  _cleanupFight() {
    for (const b of this.playerBullets) {
      if (b.sprite && b.sprite.active) b.sprite.destroy();
    }
    this.playerBullets = [];

    for (const b of this.bossBullets) {
      if (b.sprite && b.sprite.active) b.sprite.destroy();
    }
    this.bossBullets = [];

    this.samMissiles = [];
    this.homingMissiles = [];
    this.flakBursts = [];
    this.smokeParticles = [];
    this.airDefenseSites = [];
    this.heavyBombs = [];
    this.drones = [];
    this.droneSpawnPortals = [];
    this.areaBombs = [];
    this.effectsGfx.clear();
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
      const hint = this.add.text(W / 2, H / 2 + 15, 'ESC — Resume  |  Q — Menu  |  M — Mute', {
        fontFamily: 'monospace', fontSize: '14px', color: '#888888',
      }).setOrigin(0.5).setDepth(61);
      this.pauseObjects.push(hint);
    } else {
      for (const obj of this.pauseObjects) obj.destroy();
      this.pauseObjects = [];
    }
  }

  shutdown() {
    if (this._endScreen) this._endScreen.destroy();
    this.tweens.killAll();
    this.time.removeAllEvents();
    this._cleanupFight();
    this.disintPixels = [];
    this._deathExplosionParticles = [];
    if (this.disintImage) { this.disintImage.destroy(); this.disintImage = null; }
    if (this.disintTexKey && this.textures.exists(this.disintTexKey)) {
      this.textures.remove(this.disintTexKey);
    }
  }
}
