// ═══════════════════════════════════════════════════════════════
// B2BomberScene — Level 5: Operation Mountain Breaker (Side-Scrolling Night)
// 4-phase: Stealth Flight → Defense → Mountain Bombing → Escape
// ═══════════════════════════════════════════════════════════════

import Phaser from 'phaser';
import SoundManager from '../systems/SoundManager.js';
import MusicManager from '../systems/MusicManager.js';
import DifficultyManager from '../systems/DifficultyManager.js';
import {
  createB2SideSprite, createNightSky, createNightCloudLayer,
  createDesertNight, createCityNight, createMountainNight,
  createNatanzMountain,
} from '../utils/B2Textures.js';

const W = 960;
const H = 540;
const GROUND_Y = 420;
const B2_SPEED = 180;
const GRAVITY = 380;
const BUSTER_TOTAL = 6;
const MOUNTAIN_LAYERS = 5;
const CHAFF_TOTAL = 5;

// Distance thresholds (shorter phases — get to bombing faster)
const STEALTH_CITY_DIST = 1800;
const STEALTH_MTN_DIST = 3600;
const STEALTH_END_DIST = 5400;
const DEFENSE_END_DIST = 3600;
const ESCAPE_END_DIST = 4000;

// Mountain layout
const MTN_X = 560;          // mountain center X in bombing phase
const MTN_TOP_Y = 110;      // mountain peak Y
const LAYER_X = MTN_X - 60; // layer left edge
const LAYER_W = 120;
const LAYER_START_Y = 180;
const LAYER_H = 35;

export default class B2BomberScene extends Phaser.Scene {
  constructor() { super('B2BomberScene'); }

  create() {
    this.cameras.main.setBackgroundColor('#000000');

    // Generate textures
    createB2SideSprite(this);
    createNightSky(this);
    createNightCloudLayer(this);
    createDesertNight(this);
    createCityNight(this);
    createMountainNight(this);
    createNatanzMountain(this);

    // ── Game state ──
    const dm = DifficultyManager.get();
    this.phase = 'stealth';
    this.armor = dm.isHard() ? 2 : 3;
    this.busters = BUSTER_TOTAL;
    this.bustersUsed = 0;
    this.chaff = CHAFF_TOTAL;
    this.chaffUsed = 0;
    this.mountainHP = MOUNTAIN_LAYERS;
    this.detectionLevel = 0;
    this.maxDetection = 0;
    this.missilesEvaded = 0;
    this.jetX = 120;
    this.jetY = 160;
    this.jetVX = B2_SPEED;
    this.facingRight = true;
    this.scrollX = 0;
    this.phaseTimer = 0;
    this.flightDistance = 0;
    this.flightTerrainStage = 0;
    this.bombCooldown = 0;
    this.bombingEnded = false;
    this.speedFactor = 1.0;

    // Missile/radar systems
    this.missiles = [];
    this.bombObjects = [];
    this.explosions = [];
    this.engineParticles = [];
    this.radarCones = [];
    this.searchlights = [];
    this.samSites = [];
    this.flakExplosions = [];
    this.chaffDecoys = [];
    this.missileSpawnTimer = 0;
    this.flakTimer = 0;
    this.mountainLayerSprites = [];
    this.mountainSprite = null;
    this.escapeDistance = 0;
    this.escapeTerrainStage = 0;
    this.defenseDistance = 0;

    // Ambient
    this.ambientRef = null;

    // ── Setup ──
    this._setupLayers();
    this._setupHUD();
    this._setupInput();
    this._startStealth();
  }

  // ═════════════════════════════════════════════════════════════
  // LAYER SETUP
  // ═════════════════════════════════════════════════════════════
  _setupLayers() {
    this.skyBg = this.add.image(W / 2, H / 2, 'night_sky').setDepth(-10);
    this.cloudTile = this.add.tileSprite(W / 2, 80, W, 150, 'night_cloud_layer').setDepth(-7);
    this.farTerrain = this.add.tileSprite(W / 2, GROUND_Y - 55, W, 250, 'mountain_night').setDepth(-5);
    this.farTerrain.setVisible(false);
    this.groundTile = this.add.tileSprite(W / 2, GROUND_Y + 60, W, 120, 'desert_night').setDepth(1);

    this.jetSprite = this.add.image(this.jetX, this.jetY, 'b2_side').setDepth(10);
  }

  _setupHUD() {
    const hudStyle = { fontFamily: 'monospace', fontSize: '12px', color: '#ffffff' };
    const titleStyle = { fontFamily: 'monospace', fontSize: '11px', color: '#aaaacc',
      shadow: { offsetX: 0, offsetY: 0, color: '#aaaacc', blur: 4, fill: true } };

    this.hudTitle = this.add.text(15, 12, 'OPERATION MOUNTAIN BREAKER', titleStyle).setDepth(30);
    this.hudArmor = this.add.text(15, 30, 'ARMOR: 3/3', hudStyle).setDepth(30);
    this.hudBusters = this.add.text(15, 46, `BUSTERS: ${BUSTER_TOTAL}`, hudStyle).setDepth(30);
    this.hudChaff = this.add.text(15, 62, `CHAFF: ${CHAFF_TOTAL}`, hudStyle).setDepth(30);

    // Hard mode badge
    if (DifficultyManager.get().isHard()) {
      this.add.text(W - 15, 50, 'HARD', {
        fontFamily: 'monospace', fontSize: '11px', color: '#ff4444',
        shadow: { offsetX: 0, offsetY: 0, color: '#ff0000', blur: 6, fill: true },
      }).setOrigin(1, 0).setDepth(30);
    }

    this.hudAlt = this.add.text(W - 15, 12, 'ALT: 0m', { ...hudStyle, color: '#aaaaaa' })
      .setOrigin(1, 0).setDepth(30);
    this.hudSpeed = this.add.text(W - 15, 28, 'SPD: 0 kts', { ...hudStyle, color: '#aaaaaa' })
      .setOrigin(1, 0).setDepth(30);
    this.hudDist = this.add.text(W / 2, 12, '', {
      fontFamily: 'monospace', fontSize: '11px', color: '#00e5ff',
    }).setOrigin(0.5).setDepth(30);

    // Detection bar background
    this.detBarBg = this.add.rectangle(W / 2, 30, 200, 10, 0x555555).setDepth(30);
    this.detBarBg.setStrokeStyle(1, 0x888888);
    this.detBarFill = this.add.rectangle(W / 2 - 100, 30, 0, 10, 0x00ff00).setDepth(31);
    this.detBarFill.setOrigin(0, 0.5);
    this.hudDetect = this.add.text(W / 2, 42, 'DETECTION: 0%', {
      fontFamily: 'monospace', fontSize: '9px', color: '#aaaaaa',
      shadow: { offsetX: 0, offsetY: 0, color: '#000000', blur: 3, fill: true },
    }).setOrigin(0.5).setDepth(30);
    this.hudStealth = this.add.text(W / 2, 56, '', {
      fontFamily: 'monospace', fontSize: '9px', color: '#00ff00',
      shadow: { offsetX: 0, offsetY: 0, color: '#000000', blur: 3, fill: true },
    }).setOrigin(0.5).setDepth(30);

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
      c: this.input.keyboard.addKey('C'),
      m: this.input.keyboard.addKey('M'),
      // p: this.input.keyboard.addKey('P'), // debug skip (disabled)
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
  // UTILITY
  // ═════════════════════════════════════════════════════════════
  _scrollLayers(speed, dt) {
    const dx = speed * dt;
    this.scrollX += dx;
    this.cloudTile.tilePositionX += dx * 0.05;
    this.farTerrain.tilePositionX += dx * 0.3;
    this.groundTile.tilePositionX += dx * 0.8;
  }

  _updateHUD() {
    const alt = Math.max(0, Math.round((GROUND_Y - this.jetY) / GROUND_Y * 12000));
    const spd = Math.round(Math.abs(this.jetVX) * 2.5);
    this.hudAlt.setText(`ALT: ${alt}m`);
    this.hudSpeed.setText(`SPD: ${spd} kts`);
    this.hudArmor.setText(`ARMOR: ${Math.max(0, this.armor)}/3`);
    this.hudArmor.setColor(this.armor <= 1 ? '#ff4444' : '#ffffff');
    this.hudBusters.setText(`BUSTERS: ${this.busters}`);
    this.hudChaff.setText(`CHAFF: ${this.chaff}`);

    // Detection bar
    const det = Math.min(100, Math.max(0, this.detectionLevel));
    const barW = det * 2;
    this.detBarFill.setSize(barW, 8);
    if (det < 30) this.detBarFill.setFillStyle(0x00ff00);
    else if (det < 60) this.detBarFill.setFillStyle(0xffff00);
    else if (det < 85) this.detBarFill.setFillStyle(0xff8800);
    else this.detBarFill.setFillStyle(0xff0000);
    this.hudDetect.setText(`DETECTION: ${Math.round(det)}%`);
    this.hudDetect.setColor(det > 60 ? '#ff4444' : '#888888');

    // Stealth indicator (only in stealth phase)
    if (this.hudStealth) {
      if (this.phase === 'stealth' && this.speedFactor !== undefined) {
        this.hudStealth.setVisible(true);
        if (this.speedFactor < 0.5) {
          this.hudStealth.setText('SILENT RUNNING');
          this.hudStealth.setColor('#00ff00');
        } else if (this.speedFactor < 0.75) {
          this.hudStealth.setText('LOW PROFILE');
          this.hudStealth.setColor('#ffff00');
        } else {
          this.hudStealth.setText('EXPOSED');
          this.hudStealth.setColor('#ff4444');
        }
      } else {
        this.hudStealth.setVisible(false);
      }
    }
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
      if (m.smokeTrail) for (const s of m.smokeTrail) s.sprite.destroy();
      m.sprite.destroy();
      if (m.glow) m.glow.destroy();
      if (m.trail) m.trail.destroy();
    }
    this.missiles = [];
  }

  _takeDamage() {
    this.armor--;
    SoundManager.get().playMissileWarning();
    this.cameras.main.shake(200, 0.015);

    const flash = this.add.rectangle(W / 2, H / 2, W, H, 0xff0000, 0.3).setDepth(25);
    this.tweens.add({ targets: flash, alpha: 0, duration: 300, onComplete: () => flash.destroy() });

    if (this.armor <= 0) {
      this._stopAmbient();
      this.phase = 'dead';
      this.time.delayedCall(800, () => this._showVictory());
    }
  }

  _addExplosion(x, y, radius, color) {
    const exp = this.add.circle(x, y, radius, color || 0xff6600, 0.8).setDepth(15);
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
    if (Math.random() < 0.2) {
      const ox = this.facingRight ? -55 : 55;
      const p = this.add.circle(
        this.jetX + ox + (Math.random() - 0.5) * 6,
        this.jetY + (Math.random() - 0.5) * 3,
        1 + Math.random(),
        Phaser.Display.Color.GetColor(80, 60 + Math.floor(Math.random() * 30), 40),
        0.15
      ).setDepth(4);
      this.engineParticles.push({ sprite: p, life: 0.4 + Math.random() * 0.2 });
    }
    for (let i = this.engineParticles.length - 1; i >= 0; i--) {
      const ep = this.engineParticles[i];
      ep.life -= dt;
      ep.sprite.setAlpha(Math.max(0, ep.life * 0.5));
      if (ep.life <= 0) { ep.sprite.destroy(); this.engineParticles.splice(i, 1); }
    }
  }

  // ═════════════════════════════════════════════════════════════
  // MISSILE SYSTEMS (shared across phases)
  // ═════════════════════════════════════════════════════════════
  _spawnTrackingMissile(x, y) {
    // Enforce max missile count: 2 in stealth, 3 in defense/other
    const maxMissiles = this.phase === 'stealth' ? 2 : 3;
    if (this.missiles.length >= maxMissiles) return;

    // Show warning 1 second before missile appears
    const warnArrow = this.add.text(x, GROUND_Y - 10, '\u25B2 WARNING', {
      fontFamily: 'monospace', fontSize: '10px', color: '#ff4444',
      shadow: { offsetX: 0, offsetY: 0, color: '#ff0000', blur: 6, fill: true },
    }).setOrigin(0.5).setDepth(25);
    this.tweens.add({
      targets: warnArrow, alpha: 0.3, duration: 200, yoyo: true, repeat: 3,
      onComplete: () => warnArrow.destroy(),
    });

    // Delay actual missile spawn by 1 second
    this.time.delayedCall(1000, () => {
      if (this.phase === 'dead' || this.phase === 'victory') return;
      const m = this.add.circle(x, y, 4, 0xff3333).setDepth(8);
      const glow = this.add.circle(x, y, 8, 0xff0000, 0.4).setDepth(7);
      const trail = this.add.circle(x, y, 2, 0x888888, 0.2).setDepth(6);
      this.missiles.push({
        sprite: m, glow, trail, x, y,
        vx: 0, vy: -70,  // 40% slower (was -120)
        tracking: true, life: 6,
        smokeTrail: [],
      });
    });
  }

  _updateMissiles(dt) {
    for (let i = this.missiles.length - 1; i >= 0; i--) {
      const m = this.missiles[i];
      m.life -= dt;

      if (m.tracking && m.life > 0.5) {
        // Track toward B-2 with LIMITED turning radius (can't turn instantly)
        const dx = this.jetX - m.x;
        const dy = this.jetY - m.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const missileSpeed = 110; // 40% slower than original 180
        const targetVX = (dx / dist) * missileSpeed;
        const targetVY = (dy / dist) * missileSpeed;
        const turnRate = 100 * dt; // Limited turning — player can dodge with sharp moves
        m.vx += Math.sign(targetVX - m.vx) * Math.min(Math.abs(targetVX - m.vx), turnRate);
        m.vy += Math.sign(targetVY - m.vy) * Math.min(Math.abs(targetVY - m.vy), turnRate);

        // Check chaff decoys
        for (let j = this.chaffDecoys.length - 1; j >= 0; j--) {
          const cd = this.chaffDecoys[j];
          const cdDist = Phaser.Math.Distance.Between(m.x, m.y, cd.x, cd.y);
          if (cdDist < 80) {
            const cdx = cd.x - m.x;
            const cdy = cd.y - m.y;
            const cdLen = Math.sqrt(cdx * cdx + cdy * cdy) || 1;
            m.vx = (cdx / cdLen) * 120;
            m.vy = (cdy / cdLen) * 120;
            m.tracking = false;
            break;
          }
        }
      }

      m.x += m.vx * dt;
      m.y += m.vy * dt;
      m.sprite.setPosition(m.x, m.y);
      m.glow.setPosition(m.x, m.y);
      m.trail.setPosition(m.x - m.vx * 0.05, m.y - m.vy * 0.05);

      // Long red smoke trail — spawn smoke puff every few frames
      if (m.smokeTrail && Math.random() < 0.5) {
        const smoke = this.add.circle(
          m.x - m.vx * 0.03 + (Math.random() - 0.5) * 3,
          m.y - m.vy * 0.03 + (Math.random() - 0.5) * 3,
          2 + Math.random() * 2, 0xcc2200, 0.5
        ).setDepth(6);
        m.smokeTrail.push({ sprite: smoke, life: 0.8 });
        // Limit trail length
        if (m.smokeTrail.length > 20) {
          const old = m.smokeTrail.shift();
          old.sprite.destroy();
        }
      }
      // Update smoke trail
      if (m.smokeTrail) {
        for (let j = m.smokeTrail.length - 1; j >= 0; j--) {
          const s = m.smokeTrail[j];
          s.life -= dt;
          s.sprite.setAlpha(Math.max(0, s.life * 0.6));
          s.sprite.setScale(1 + (0.8 - s.life) * 0.5);
          if (s.life <= 0) { s.sprite.destroy(); m.smokeTrail.splice(j, 1); }
        }
      }

      // Proximity hit
      const hitDist = Phaser.Math.Distance.Between(m.x, m.y, this.jetX, this.jetY);
      if (hitDist < 20) {
        this._takeDamage();
        if (m.smokeTrail) for (const s of m.smokeTrail) s.sprite.destroy();
        m.sprite.destroy(); m.glow.destroy(); m.trail.destroy();
        this.missiles.splice(i, 1);
        continue;
      }

      // Expired or off screen
      if (m.life <= 0 || m.y < -40 || m.y > H + 40 || m.x < -40 || m.x > W + 40) {
        if (m.life <= 0) this.missilesEvaded++;
        this._addExplosion(m.x, m.y, 8, 0xff4400);
        if (m.smokeTrail) for (const s of m.smokeTrail) s.sprite.destroy();
        m.sprite.destroy(); m.glow.destroy(); m.trail.destroy();
        this.missiles.splice(i, 1);
      }
    }

    // Update chaff decoys
    for (let i = this.chaffDecoys.length - 1; i >= 0; i--) {
      const cd = this.chaffDecoys[i];
      cd.life -= dt;
      cd.sprite.setAlpha(Math.max(0, cd.life));
      if (cd.life <= 0) { cd.sprite.destroy(); this.chaffDecoys.splice(i, 1); }
    }
  }

  _releaseChaffa() {
    if (this.chaff <= 0) return;
    this.chaff--;
    this.chaffUsed++;
    SoundManager.get().playChaffRelease();

    // Chaff decoy appears behind B-2
    const ox = this.facingRight ? -40 : 40;
    const decoy = this.add.circle(this.jetX + ox, this.jetY, 5, 0xffff00, 0.7).setDepth(9);
    this.chaffDecoys.push({
      sprite: decoy,
      x: this.jetX + ox, y: this.jetY,
      life: 2.5,
    });

    // Sparkle effect
    for (let i = 0; i < 8; i++) {
      const spark = this.add.circle(
        this.jetX + ox + (Math.random() - 0.5) * 20,
        this.jetY + (Math.random() - 0.5) * 20,
        1, 0xffff44, 0.6
      ).setDepth(9);
      this.tweens.add({
        targets: spark, alpha: 0, duration: 500 + Math.random() * 300,
        x: spark.x + (Math.random() - 0.5) * 30,
        y: spark.y + (Math.random() - 0.5) * 30,
        onComplete: () => spark.destroy(),
      });
    }
  }

  // ═════════════════════════════════════════════════════════════
  // PHASE 1 — STEALTH FLIGHT
  // ═════════════════════════════════════════════════════════════
  _startStealth() {
    this.phase = 'stealth';
    MusicManager.get().playLevel5Music('stealth');
    this.phaseTimer = 0;
    this.flightDistance = 0;
    this.flightTerrainStage = 0;
    this.detectionLevel = 0;
    this.maxDetection = 0;
    this.jetX = 120;
    this.jetY = 160;
    this.jetVX = B2_SPEED;
    this.facingRight = true;

    this.farTerrain.setVisible(false);
    this.groundTile.setTexture('desert_night');

    this.instrText.setText('ARROWS to fly — Avoid radar cones — C for chaff — Slow down to reduce detection');
    this.instrText.setColor('#666666');

    // Spawn initial radars
    this.radarCones = [];
    this.searchlights = [];
    this.samSites = [];
    this._spawnRadars(4);

    // SAM sites on the ground (visible launchers)
    this._spawnSAMSites(3);

    this.ambientRef = SoundManager.get().playB2Engine();
  }

  _spawnRadars(count) {
    for (let i = 0; i < count; i++) {
      const rx = 200 + Math.random() * (W - 300);
      this.radarCones.push({
        x: rx,
        baseY: GROUND_Y + 20,
        angle: Math.random() * Math.PI,
        sweepSpeed: 0.8 + Math.random() * 0.6,
        range: 150 + Math.random() * 80,
        coneWidth: 0.4 + Math.random() * 0.2,
      });
    }
  }

  _spawnSAMSites(count) {
    for (let i = 0; i < count; i++) {
      const sx = 150 + Math.random() * (W - 300);
      this.samSites.push({
        x: sx, baseY: GROUND_Y + 15,
        cooldown: 5 + Math.random() * 3,
        timer: 0,
        active: true,
      });
    }
  }

  _spawnSearchlights(count) {
    for (let i = 0; i < count; i++) {
      const sx = 100 + Math.random() * (W - 200);
      this.searchlights.push({
        x: sx, baseY: GROUND_Y + 10,
        angle: -Math.PI / 2 + (Math.random() - 0.5) * 0.6,
        sweepSpeed: 0.3 + Math.random() * 0.4,
        sweepDir: Math.random() < 0.5 ? 1 : -1,
        range: 350 + Math.random() * 100,
        beamWidth: 0.08,
        detected: false,
      });
    }
  }

  _updateStealth(dt) {
    this.phaseTimer += dt;

    // Movement (responsive controls)
    const accel = 500;
    if (this.keys.right.isDown) {
      this.jetVX = Math.min(400, this.jetVX + accel * dt);
    } else if (this.keys.left.isDown) {
      this.jetVX = Math.max(60, this.jetVX - accel * dt);
    } else {
      const diff = B2_SPEED - this.jetVX;
      this.jetVX += Math.sign(diff) * Math.min(Math.abs(diff), 200 * dt);
    }

    const vSpeed = 280;
    if (this.keys.up.isDown) this.jetY = Math.max(40, this.jetY - vSpeed * dt);
    if (this.keys.down.isDown) this.jetY = Math.min(GROUND_Y - 60, this.jetY + vSpeed * dt);

    // Chaff
    if (Phaser.Input.Keyboard.JustDown(this.keys.c)) this._releaseChaffa();

    const targetX = 200 + (this.jetVX - B2_SPEED) * 0.5;
    this.jetX += (targetX - this.jetX) * 3 * dt;
    this.jetX = Phaser.Math.Clamp(this.jetX, 60, W - 60);
    this.jetSprite.setPosition(this.jetX, this.jetY);

    this._scrollLayers(this.jetVX, dt);
    this.flightDistance += this.jetVX * dt;

    // Speed-stealth tradeoff: flying slower reduces radar detection range
    this.speedFactor = Math.max(0.3, Math.min(1.0, this.jetVX / 400));

    // Terrain transitions
    if (this.flightDistance > STEALTH_CITY_DIST && this.flightTerrainStage === 0) {
      this.flightTerrainStage = 1;
      this.groundTile.setTexture('city_night');
      this.instrText.setText('Over Iranian cities — Searchlights active!');
      this.instrText.setColor('#ffaa00');
      // Spawn searchlights for city section
      this._spawnSearchlights(3);
      this._spawnSAMSites(2);
    }
    if (this.flightDistance > STEALTH_MTN_DIST && this.flightTerrainStage === 1) {
      this.flightTerrainStage = 2;
      this.groundTile.setTexture('mountain_night');
      this.farTerrain.setVisible(true);
      this.instrText.setText('Approaching Natanz — Heavy air defense');
      this.instrText.setColor('#ff6666');
      // More radars and SAMs near target
      this._spawnRadars(3);
      this._spawnSAMSites(2);
    }

    // Distance HUD
    const distKm = Math.max(0, Math.round(200 * (1 - this.flightDistance / STEALTH_END_DIST)));
    this.hudDist.setText(`TARGET: ${distKm} km`);

    // Radar detection
    this.detectionLevel = Math.max(0, this.detectionLevel - 8 * dt); // decay

    // Draw radar cones and check detection
    for (const r of this.radarCones) {
      r.angle += r.sweepSpeed * dt;
      r.detecting = false;

      // Check if B-2 is in cone — speed affects detection range
      const altFactor = 1 - (GROUND_Y - this.jetY) / GROUND_Y; // higher = harder to detect
      const speedMod = 0.5 + this.speedFactor * 0.5; // slower = smaller detection range
      const adjustedRange = r.range * (0.5 + altFactor * 0.8) * speedMod;

      const dx = this.jetX - r.x;
      const dy = this.jetY - r.baseY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx);
      const angleDiff = Math.abs(((angle - r.angle + Math.PI * 3) % (Math.PI * 2)) - Math.PI);

      if (dist < adjustedRange && angleDiff < r.coneWidth) {
        this.detectionLevel += 25 * DifficultyManager.get().detectionMult() * dt;
        r.detecting = true;
      }
    }

    // Searchlight detection
    for (const sl of this.searchlights) {
      sl.angle += sl.sweepSpeed * sl.sweepDir * dt;
      // Reverse direction at limits
      if (sl.angle < -Math.PI * 0.85 || sl.angle > -Math.PI * 0.15) {
        sl.sweepDir *= -1;
      }
      sl.detected = false;

      const dx = this.jetX - sl.x;
      const dy = this.jetY - sl.baseY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx);
      const angleDiff = Math.abs(((angle - sl.angle + Math.PI * 3) % (Math.PI * 2)) - Math.PI);

      if (dist < sl.range && angleDiff < sl.beamWidth * 2) {
        this.detectionLevel += 40 * DifficultyManager.get().detectionMult() * dt; // searchlights detect faster than radar
        sl.detected = true;
      }
    }

    // SAM site behavior — fire missiles when detection is high
    for (const sam of this.samSites) {
      sam.timer += dt;
      if (sam.active && this.detectionLevel > 50 && sam.timer >= sam.cooldown) {
        sam.timer = 0;
        this._spawnTrackingMissile(sam.x, sam.baseY);
        SoundManager.get().playRadarAlert();
      }
    }

    this.maxDetection = Math.max(this.maxDetection, this.detectionLevel);

    // Detection overload
    if (this.detectionLevel >= 100) {
      SoundManager.get().playRadarAlert();
      this.detectionLevel = 40;
      // Launch 1 missile (count limit enforced inside)
      this._spawnTrackingMissile(
        100 + Math.random() * (W - 200),
        GROUND_Y + 20
      );
      this._takeDamage();
    }

    // Respawn radars as they scroll off
    if (this.phaseTimer > 5 && Math.random() < 0.3 * dt) {
      this._spawnRadars(1);
    }

    this._updateMissiles(dt);

    // Transition
    if (this.flightDistance >= STEALTH_END_DIST) {
      this._stopAmbient();
      this.radarCones = [];
      this.searchlights = [];
      this.samSites = [];
      this._startDefense();
    }
  }

  _drawRadarCones() {
    if (!this.radarGfx) {
      this.radarGfx = this.add.graphics().setDepth(5);
    }
    this.radarGfx.clear();

    // Draw radar cones with enhanced visuals
    for (const r of this.radarCones) {
      const a = r.angle;
      const hw = r.coneWidth;
      const detecting = r.detecting;
      const baseAlpha = detecting ? 0.15 : 0.06;
      const color = detecting ? 0xff4400 : 0x00ff00;

      // Main cone fill
      this.radarGfx.fillStyle(color, baseAlpha);
      this.radarGfx.beginPath();
      this.radarGfx.moveTo(r.x, r.baseY);
      this.radarGfx.lineTo(
        r.x + Math.cos(a - hw) * r.range,
        r.baseY + Math.sin(a - hw) * r.range
      );
      this.radarGfx.lineTo(
        r.x + Math.cos(a + hw) * r.range,
        r.baseY + Math.sin(a + hw) * r.range
      );
      this.radarGfx.closePath();
      this.radarGfx.fillPath();

      // Leading edge line (bright sweep line)
      this.radarGfx.lineStyle(1, color, detecting ? 0.6 : 0.3);
      this.radarGfx.beginPath();
      this.radarGfx.moveTo(r.x, r.baseY);
      this.radarGfx.lineTo(
        r.x + Math.cos(a) * r.range,
        r.baseY + Math.sin(a) * r.range
      );
      this.radarGfx.strokePath();

      // Radar dish on ground
      this.radarGfx.fillStyle(color, 0.5);
      this.radarGfx.fillCircle(r.x, r.baseY, 4);
      // Dish rotating indicator
      this.radarGfx.lineStyle(1, color, 0.6);
      this.radarGfx.beginPath();
      this.radarGfx.moveTo(r.x, r.baseY);
      this.radarGfx.lineTo(r.x + Math.cos(a) * 10, r.baseY + Math.sin(a) * 10);
      this.radarGfx.strokePath();

      // Detection pulse ring when detecting
      if (detecting) {
        const pulseR = 8 + Math.sin(this.phaseTimer * 10) * 3;
        this.radarGfx.lineStyle(1, 0xff0000, 0.4);
        this.radarGfx.strokeCircle(r.x, r.baseY, pulseR);
      }
    }

    // Draw searchlight beams
    for (const sl of this.searchlights) {
      const a = sl.angle;
      const beamColor = sl.detected ? 0xffff00 : 0xccccff;
      const beamAlpha = sl.detected ? 0.12 : 0.05;

      // Wide beam cone
      this.radarGfx.fillStyle(beamColor, beamAlpha);
      this.radarGfx.beginPath();
      this.radarGfx.moveTo(sl.x, sl.baseY);
      this.radarGfx.lineTo(
        sl.x + Math.cos(a - sl.beamWidth) * sl.range,
        sl.baseY + Math.sin(a - sl.beamWidth) * sl.range
      );
      this.radarGfx.lineTo(
        sl.x + Math.cos(a + sl.beamWidth) * sl.range,
        sl.baseY + Math.sin(a + sl.beamWidth) * sl.range
      );
      this.radarGfx.closePath();
      this.radarGfx.fillPath();

      // Bright center beam line
      this.radarGfx.lineStyle(2, beamColor, sl.detected ? 0.5 : 0.2);
      this.radarGfx.beginPath();
      this.radarGfx.moveTo(sl.x, sl.baseY);
      this.radarGfx.lineTo(
        sl.x + Math.cos(a) * sl.range,
        sl.baseY + Math.sin(a) * sl.range
      );
      this.radarGfx.strokePath();

      // Light source on ground
      this.radarGfx.fillStyle(0xffffcc, 0.6);
      this.radarGfx.fillCircle(sl.x, sl.baseY, 3);
    }

    // Draw SAM site markers
    for (const sam of this.samSites) {
      const alertLevel = this.detectionLevel > 50 ? 0.6 : 0.3;
      const samColor = this.detectionLevel > 50 ? 0xff4444 : 0x888888;

      // SAM launcher (small triangle)
      this.radarGfx.fillStyle(samColor, alertLevel);
      this.radarGfx.beginPath();
      this.radarGfx.moveTo(sam.x, sam.baseY - 8);
      this.radarGfx.lineTo(sam.x - 5, sam.baseY);
      this.radarGfx.lineTo(sam.x + 5, sam.baseY);
      this.radarGfx.closePath();
      this.radarGfx.fillPath();

      // Alert ring when active
      if (this.detectionLevel > 50) {
        const pr = 6 + Math.sin(this.phaseTimer * 6) * 2;
        this.radarGfx.lineStyle(1, 0xff0000, 0.3);
        this.radarGfx.strokeCircle(sam.x, sam.baseY - 4, pr);
      }
    }

    // Speed indicator (shows stealth benefit of flying slow)
    if (this.speedFactor !== undefined) {
      const stealthText = this.speedFactor < 0.5 ? 'SILENT RUNNING' : this.speedFactor < 0.75 ? 'LOW PROFILE' : 'EXPOSED';
      const stealthColor = this.speedFactor < 0.5 ? 0x00ff00 : this.speedFactor < 0.75 ? 0xffff00 : 0xff4444;
      const alpha = this.speedFactor < 0.5 ? 0.5 : this.speedFactor < 0.75 ? 0.4 : 0.3;
      this.radarGfx.fillStyle(stealthColor, alpha);
      // Small indicator bar on HUD area
      const barW = 60 * (1 - this.speedFactor);
      this.radarGfx.fillRect(W / 2 - 30, 55, barW, 4);
    }
  }

  // ═════════════════════════════════════════════════════════════
  // PHASE 2 — DEFENSE
  // ═════════════════════════════════════════════════════════════
  _startDefense() {
    this.phase = 'defense';
    MusicManager.get().playLevel5Music('defense');
    this.phaseTimer = 0;
    this.missileSpawnTimer = 0;
    this.flakTimer = 0;
    this.defenseDistance = 0;
    this._cleanupMissiles();

    this.instrText.setText('DETECTED — INCOMING MISSILES! Dodge with arrows, C for chaff');
    this.instrText.setColor('#ff4444');

    // Flash warning
    const warn = this.add.text(W / 2, 80, 'DETECTED — INCOMING MISSILES', {
      fontFamily: 'monospace', fontSize: '18px', color: '#ff0000',
      shadow: { offsetX: 0, offsetY: 0, color: '#ff0000', blur: 12, fill: true },
    }).setOrigin(0.5).setDepth(25);
    this.tweens.add({
      targets: warn, alpha: 0, duration: 2000,
      onComplete: () => warn.destroy(),
    });

    this.ambientRef = SoundManager.get().playB2Engine();
  }

  _updateDefense(dt) {
    this.phaseTimer += dt;

    // Movement (responsive controls)
    const accel = 550;
    if (this.keys.right.isDown) {
      this.jetVX = Math.min(420, this.jetVX + accel * dt);
    } else if (this.keys.left.isDown) {
      this.jetVX = Math.max(80, this.jetVX - accel * dt);
    } else {
      const diff = B2_SPEED - this.jetVX;
      this.jetVX += Math.sign(diff) * Math.min(Math.abs(diff), 200 * dt);
    }

    const vSpeed = 320;
    if (this.keys.up.isDown) this.jetY = Math.max(40, this.jetY - vSpeed * dt);
    if (this.keys.down.isDown) this.jetY = Math.min(GROUND_Y - 60, this.jetY + vSpeed * dt);

    if (Phaser.Input.Keyboard.JustDown(this.keys.c)) this._releaseChaffa();

    const targetX = 250 + (this.jetVX - B2_SPEED) * 0.5;
    this.jetX += (targetX - this.jetX) * 3 * dt;
    this.jetX = Phaser.Math.Clamp(this.jetX, 60, W - 60);
    this.jetSprite.setPosition(this.jetX, this.jetY);

    this._scrollLayers(this.jetVX, dt);
    this.defenseDistance += this.jetVX * dt;

    // Spawn tracking missiles (with count limit enforced in _spawnTrackingMissile)
    this.missileSpawnTimer += dt;
    const spawnRate = Math.max(2.0, 4.0 - this.phaseTimer * 0.05);
    if (this.missileSpawnTimer >= spawnRate) {
      this.missileSpawnTimer = 0;
      this._spawnTrackingMissile(
        100 + Math.random() * (W - 200),
        GROUND_Y + 10
      );
    }

    // Flak anti-aircraft bursts (small scattered puffs, not big orange balls)
    this.flakTimer += dt;
    if (this.flakTimer >= 1.5) {
      this.flakTimer = 0;
      // Spawn 3-4 small puffs near the jet's altitude
      const baseX = this.jetX + (Math.random() - 0.5) * 200;
      const baseY = this.jetY + (Math.random() - 0.5) * 120;
      for (let f = 0; f < 3; f++) {
        const fx = baseX + (Math.random() - 0.5) * 60;
        const fy = Phaser.Math.Clamp(baseY + (Math.random() - 0.5) * 40, 60, GROUND_Y - 20);
        this._addExplosion(fx, fy, 5 + Math.random() * 4, 0x666666);
      }
      SoundManager.get().playFlakExplosion();
      // Flak damage check (only if very close)
      const flakDist = Phaser.Math.Distance.Between(this.jetX, this.jetY, baseX, baseY);
      if (flakDist < 30) {
        this._takeDamage();
      }
    }

    // S-300 launcher visuals on ground (scrolling)
    // (Handled implicitly by the mountain_night terrain)

    // Distance HUD
    const distKm = Math.max(0, Math.round(80 * (1 - this.defenseDistance / DEFENSE_END_DIST)));
    this.hudDist.setText(`TARGET: ${distKm} km`);

    this._updateMissiles(dt);

    // Transition to bombing
    if (this.defenseDistance >= DEFENSE_END_DIST) {
      this._stopAmbient();
      this._cleanupMissiles();
      this._startBombing();
    }
  }

  // ═════════════════════════════════════════════════════════════
  // PHASE 3 — MOUNTAIN BOMBING
  // ═════════════════════════════════════════════════════════════
  _startBombing() {
    this.phase = 'bombing';
    MusicManager.get().playLevel5Music('bombing');
    this.phaseTimer = 0;
    this.bombObjects = [];
    this.missileSpawnTimer = 0;
    this.bombingEnded = false;
    this.bombCooldown = 0;
    this.facingRight = true;
    this.jetX = 80;
    this.jetY = 100;
    this.jetVX = B2_SPEED;

    // Place mountain
    this.mountainSprite = this.add.image(MTN_X, GROUND_Y - 80, 'natanz_mountain').setDepth(2);

    // Create layer overlays (we'll fade these as they're destroyed)
    this.mountainLayerSprites = [];
    for (let i = 0; i < MOUNTAIN_LAYERS; i++) {
      const ly = LAYER_START_Y + i * LAYER_H;
      const colors = [0x4a3a28, 0x3a3a3a, 0x5a5a5a, 0x4a4a4a, 0x1a1a20];
      const layer = this.add.rectangle(
        MTN_X, ly + LAYER_H / 2,
        LAYER_W, LAYER_H - 2, colors[i]
      ).setDepth(3);
      const edge = this.add.rectangle(
        MTN_X, ly + LAYER_H / 2,
        LAYER_W, LAYER_H - 2
      ).setDepth(3);
      edge.setStrokeStyle(1, 0x666666, 0.4);
      edge.setFillStyle();
      this.mountainLayerSprites.push({ rect: layer, edge, alive: true });
    }

    this.instrText.setText('SPACE to drop bunker buster — ARROWS dodge missiles');
    this.instrText.setColor('#ff8800');

    this.ambientRef = SoundManager.get().playB2Engine();
  }

  _updateBombing(dt) {
    this.phaseTimer += dt;

    // Auto horizontal pass + player vertical control
    const moveSpeed = 200;
    this.jetX += moveSpeed * (this.facingRight ? 1 : -1) * dt;

    // Reverse at edges
    if (this.jetX > W - 60) { this.facingRight = false; this.jetSprite.setFlipX(true); }
    if (this.jetX < 60) { this.facingRight = true; this.jetSprite.setFlipX(false); }

    // Vertical dodge (responsive)
    if (this.keys.up.isDown) this.jetY = Math.max(40, this.jetY - 320 * dt);
    if (this.keys.down.isDown) this.jetY = Math.min(160, this.jetY + 320 * dt);

    this.jetSprite.setPosition(this.jetX, this.jetY);
    this.jetVX = moveSpeed * (this.facingRight ? 1 : -1);

    // Bomb cooldown
    if (this.bombCooldown > 0) this.bombCooldown -= dt;

    // Drop bunker buster
    if (Phaser.Input.Keyboard.JustDown(this.keys.space) && this.busters > 0 && this.bombCooldown <= 0) {
      this._dropBuster();
      this.bombCooldown = 0.8;
    }

    this._updateBusters(dt);

    // Turret missiles
    this.missileSpawnTimer += dt;
    if (this.missileSpawnTimer >= 3) {
      this.missileSpawnTimer = 0;
      this._spawnTrackingMissile(
        MTN_X + (Math.random() - 0.5) * 200,
        GROUND_Y + 10
      );
    }
    this._updateMissiles(dt);

    // Check win
    if (this.mountainHP <= 0) {
      this._stopAmbient();
      this._startMountainExplosion();
      return;
    }
    // Out of busters
    if (this.busters <= 0 && this.bombObjects.length === 0 && !this.bombingEnded) {
      this.bombingEnded = true;
      this._stopAmbient();
      if (this.mountainHP <= 0) {
        this._startMountainExplosion();
      } else {
        this.instrText.setText('OUT OF ORDNANCE — RETREAT');
        this.instrText.setColor('#ff4444');
        this.time.delayedCall(1500, () => this._startEscape());
      }
    }
  }

  _dropBuster() {
    this.busters--;
    this.bustersUsed++;
    SoundManager.get().playBunkerBusterDrop();

    // Large bomb sprite
    const bomb = this.add.rectangle(this.jetX, this.jetY + 20, 6, 20, 0x4a4a52).setDepth(9);
    const bombNose = this.add.circle(this.jetX, this.jetY + 30, 3, 0x3a3a42).setDepth(9);
    this.bombObjects.push({
      sprite: bomb, nose: bombNose,
      x: this.jetX, y: this.jetY + 20,
      vx: this.jetVX * 0.3,
      vy: 0,
    });
  }

  _updateBusters(dt) {
    for (let i = this.bombObjects.length - 1; i >= 0; i--) {
      const b = this.bombObjects[i];
      b.vy += GRAVITY * dt;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.sprite.setPosition(b.x, b.y);
      b.nose.setPosition(b.x, b.y + 10);

      // Check mountain hit
      if (b.y >= LAYER_START_Y && b.x > MTN_X - LAYER_W / 2 && b.x < MTN_X + LAYER_W / 2) {
        const centerDist = Math.abs(b.x - MTN_X);
        const penetration = centerDist < 30 ? 2 : 1; // direct hit = 2 layers

        SoundManager.get().playBunkerBusterImpact();
        this.cameras.main.shake(400, 0.03);

        // Destroy layers
        for (let p = 0; p < penetration && this.mountainHP > 0; p++) {
          const layerIdx = MOUNTAIN_LAYERS - this.mountainHP;
          if (layerIdx < MOUNTAIN_LAYERS && this.mountainLayerSprites[layerIdx].alive) {
            this.mountainLayerSprites[layerIdx].alive = false;
            this.tweens.add({
              targets: [this.mountainLayerSprites[layerIdx].rect, this.mountainLayerSprites[layerIdx].edge],
              alpha: 0.1, duration: 400,
            });
            this.mountainHP--;

            // Score text
            const msg = penetration >= 2 && p === 0 ? 'DIRECT HIT — 2 LAYERS!' : `LAYER ${layerIdx + 1} PENETRATED`;
            const pts = this.add.text(b.x, LAYER_START_Y - 20 - p * 20, msg, {
              fontFamily: 'monospace', fontSize: '11px', color: '#00ff00',
            }).setOrigin(0.5).setDepth(20);
            this.tweens.add({
              targets: pts, y: LAYER_START_Y - 60, alpha: 0, duration: 1200,
              onComplete: () => pts.destroy(),
            });
          }
        }

        // Drilling visual
        this._addExplosion(b.x, b.y, 25, 0xff8800);

        b.sprite.destroy(); b.nose.destroy();
        this.bombObjects.splice(i, 1);
        continue;
      }

      // Ground miss
      if (b.y >= GROUND_Y) {
        SoundManager.get().playBunkerBusterImpact();
        this._addExplosion(b.x, GROUND_Y - 5, 20, 0xff6600);
        b.sprite.destroy(); b.nose.destroy();
        this.bombObjects.splice(i, 1);
        continue;
      }

      // Off screen
      if (b.x < -30 || b.x > W + 30 || b.y > H + 30) {
        b.sprite.destroy(); b.nose.destroy();
        this.bombObjects.splice(i, 1);
      }
    }
  }

  // ═════════════════════════════════════════════════════════════
  // MOUNTAIN EXPLOSION
  // ═════════════════════════════════════════════════════════════
  _startMountainExplosion() {
    this.phase = 'explosion';
    this.instrText.setText('');
    this._cleanupMissiles();

    // Chain explosion inside mountain
    // 1. Green centrifuge flash
    this.time.delayedCall(0, () => {
      const flash = this.add.circle(MTN_X, LAYER_START_Y + LAYER_H * 4.5, 30, 0x00ffcc, 0.8).setDepth(16);
      this.tweens.add({
        targets: flash, scaleX: 3, scaleY: 3, alpha: 0, duration: 800,
        onComplete: () => flash.destroy(),
      });
    });

    // 2. Orange/red secondary explosions
    for (let i = 0; i < 12; i++) {
      this.time.delayedCall(200 + i * 100, () => {
        const ex = MTN_X + (Math.random() - 0.5) * 150;
        const ey = LAYER_START_Y + Math.random() * LAYER_H * 5;
        this._addExplosion(ex, ey, 20 + Math.random() * 25, 0xff4400);
      });
    }

    // 3. Nuclear fireball (contained)
    this.time.delayedCall(800, () => {
      SoundManager.get().playNuclearExplosion();
      this.cameras.main.shake(2000, 0.06);

      const fireball = this.add.circle(MTN_X, LAYER_START_Y + 90, 20, 0xff6600, 0.9).setDepth(17);
      this.tweens.add({
        targets: fireball, scaleX: 5, scaleY: 5, alpha: 0.4,
        duration: 2000, ease: 'Quad.easeOut',
        onComplete: () => fireball.destroy(),
      });

      // Nuclear glow
      const nucGlow = this.add.circle(MTN_X, LAYER_START_Y + 90, 60, 0x00ff88, 0.3).setDepth(16);
      this.tweens.add({
        targets: nucGlow, scaleX: 3, scaleY: 3, alpha: 0,
        duration: 1500,
        onComplete: () => nucGlow.destroy(),
      });
    });

    // 4. Mountain cracks
    this.time.delayedCall(1200, () => {
      const crackGfx = this.add.graphics().setDepth(18);
      crackGfx.lineStyle(2, 0xff4400, 0.6);
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        crackGfx.beginPath();
        crackGfx.moveTo(MTN_X, LAYER_START_Y + 90);
        const len = 60 + Math.random() * 80;
        let px = MTN_X, py = LAYER_START_Y + 90;
        for (let s = 0; s < 5; s++) {
          px += Math.cos(angle) * len / 5 + (Math.random() - 0.5) * 10;
          py += Math.sin(angle) * len / 5 + (Math.random() - 0.5) * 10;
          crackGfx.lineTo(px, py);
        }
        crackGfx.strokePath();
      }
      // Fire columns from cracks
      for (let i = 0; i < 5; i++) {
        this.time.delayedCall(i * 150, () => {
          const fx = MTN_X + (Math.random() - 0.5) * 100;
          const col = this.add.rectangle(fx, LAYER_START_Y, 4 + Math.random() * 6, 40 + Math.random() * 60, 0xff6600, 0.7).setDepth(17);
          this.tweens.add({
            targets: col, y: LAYER_START_Y - 80, alpha: 0, scaleY: 2,
            duration: 1500, onComplete: () => col.destroy(),
          });
        });
      }

      // Smoke column
      const smoke = this.add.ellipse(MTN_X, LAYER_START_Y - 20, 50, 120, 0x333333, 0.5).setDepth(15);
      this.tweens.add({
        targets: smoke, scaleX: 3, scaleY: 4, y: LAYER_START_Y - 120, alpha: 0.2,
        duration: 3000,
      });

      this.time.delayedCall(500, () => {
        crackGfx.destroy();
      });
    });

    // 5. Text
    this.time.delayedCall(2000, () => {
      const txt = this.add.text(W / 2, 50, 'NATANZ FACILITY — DESTROYED', {
        fontFamily: 'monospace', fontSize: '24px', color: '#00ff00',
        shadow: { offsetX: 0, offsetY: 0, color: '#00ff00', blur: 16, fill: true },
      }).setOrigin(0.5).setDepth(25);
      this.tweens.add({
        targets: txt, alpha: 0.4, duration: 500, yoyo: true, repeat: 3,
        onComplete: () => {
          txt.destroy();
          // Cleanup mountain
          if (this.mountainSprite) { this.mountainSprite.destroy(); this.mountainSprite = null; }
          for (const l of this.mountainLayerSprites) {
            if (l.rect) l.rect.destroy();
            if (l.edge) l.edge.destroy();
          }
          this.mountainLayerSprites = [];
          this._startEscape();
        },
      });
    });
  }

  // ═════════════════════════════════════════════════════════════
  // PHASE 4 — ESCAPE
  // ═════════════════════════════════════════════════════════════
  _startEscape() {
    this.phase = 'escape';
    MusicManager.get().playLevel5Music('escape');
    this.phaseTimer = 0;
    this.facingRight = false;
    this.jetSprite.setFlipX(true);
    this.jetX = W - 200;
    this.jetY = 140;
    this.jetVX = -B2_SPEED;
    this._cleanupMissiles();
    this.missileSpawnTimer = 0;
    this.escapeDistance = 0;
    this.escapeTerrainStage = 0;

    this.groundTile.setTexture('mountain_night');
    this.farTerrain.setVisible(true);

    this.instrText.setText('Escaping Iranian airspace...');
    this.instrText.setColor('#888888');

    // Explosion glow behind (fading background element)
    this.escapeGlow = this.add.circle(W + 50, 250, 80, 0xff4400, 0.3).setDepth(0);
    this.tweens.add({
      targets: this.escapeGlow, x: W + 200, alpha: 0.05, scaleX: 0.5, scaleY: 0.5,
      duration: 15000,
    });

    this.ambientRef = SoundManager.get().playB2Engine();
  }

  _updateEscape(dt) {
    this.phaseTimer += dt;

    // Movement (flying left — responsive)
    const accel = 500;
    if (this.keys.left.isDown) {
      this.jetVX = Math.max(-420, this.jetVX - accel * dt);
    } else if (this.keys.right.isDown) {
      this.jetVX = Math.min(-60, this.jetVX + accel * dt);
    } else {
      const diff = -B2_SPEED - this.jetVX;
      this.jetVX += Math.sign(diff) * Math.min(Math.abs(diff), 200 * dt);
    }

    const vSpeed = 300;
    if (this.keys.up.isDown) this.jetY = Math.max(40, this.jetY - vSpeed * dt);
    if (this.keys.down.isDown) this.jetY = Math.min(GROUND_Y - 60, this.jetY + vSpeed * dt);

    if (Phaser.Input.Keyboard.JustDown(this.keys.c)) this._releaseChaffa();

    const targetX = (W - 250) + (this.jetVX + B2_SPEED) * 0.5;
    this.jetX += (targetX - this.jetX) * 3 * dt;
    this.jetX = Phaser.Math.Clamp(this.jetX, 60, W - 60);
    this.jetSprite.setFlipX(true);
    this.jetSprite.setPosition(this.jetX, this.jetY);

    this._scrollLayers(this.jetVX, dt);
    this.escapeDistance += Math.abs(this.jetVX) * dt;

    // Terrain transitions (reverse)
    if (this.escapeDistance > 1500 && this.escapeTerrainStage === 0) {
      this.escapeTerrainStage = 1;
      this.groundTile.setTexture('city_night');
    }
    if (this.escapeDistance > 3000 && this.escapeTerrainStage === 1) {
      this.escapeTerrainStage = 2;
      this.groundTile.setTexture('desert_night');
      this.farTerrain.setVisible(false);
      this.instrText.setText('Leaving Iranian airspace...');
    }

    // Last missiles
    this.missileSpawnTimer += dt;
    if (this.missileSpawnTimer >= 4 && this.escapeDistance < 3500) {
      this.missileSpawnTimer = 0;
      this._spawnTrackingMissile(
        200 + Math.random() * (W - 400),
        GROUND_Y + 10
      );
    }
    this._updateMissiles(dt);

    // Distance HUD
    const distKm = Math.max(0, Math.round(120 * (1 - this.escapeDistance / ESCAPE_END_DIST)));
    this.hudDist.setText(`BORDER: ${distKm} km`);

    // Exit (guard against re-entry — phase change prevents calling this 120x)
    if (this.escapeDistance >= ESCAPE_END_DIST) {
      this.phase = 'complete';
      this._stopAmbient();
      if (this.escapeGlow) { this.escapeGlow.destroy(); this.escapeGlow = null; }
      this.cameras.main.fadeOut(1500, 0, 0, 0);
      this.time.delayedCall(2000, () => this._showVictory());
    }
  }

  // ═════════════════════════════════════════════════════════════
  // VICTORY / RESULTS
  // ═════════════════════════════════════════════════════════════
  _showVictory() {
    this.phase = 'victory';
    this.instrText.setVisible(false);
    this.cameras.main.resetFX();
    MusicManager.get().stop(1);

    const layersDestroyed = MOUNTAIN_LAYERS - Math.max(0, this.mountainHP);
    const missionSuccess = layersDestroyed >= MOUNTAIN_LAYERS;
    this.missionSuccess = missionSuccess; // store for ENTER handler
    const stealthRating = Math.max(0, Math.round(100 - this.maxDetection));

    if (missionSuccess) SoundManager.get().playVictory();

    this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.9).setDepth(40);

    const titleText = missionSuccess ? 'MISSION COMPLETE' : 'MISSION FAILED';
    const titleColor = missionSuccess ? '#FFD700' : '#ff4444';
    const title = this.add.text(W / 2, 45, titleText, {
      fontFamily: 'monospace', fontSize: '30px', color: titleColor,
      shadow: { offsetX: 0, offsetY: 0, color: titleColor, blur: 16, fill: true },
    }).setOrigin(0.5).setDepth(41).setAlpha(0);
    this.tweens.add({ targets: title, alpha: 1, duration: 500 });

    const sub = this.add.text(W / 2, 80, 'OPERATION MOUNTAIN BREAKER', {
      fontFamily: 'monospace', fontSize: '14px', color: '#ffffff',
    }).setOrigin(0.5).setDepth(41).setAlpha(0);
    this.tweens.add({ targets: sub, alpha: 1, duration: 500, delay: 200 });

    const sep = this.add.rectangle(W / 2, 102, 300, 2, 0x00e5ff, 0.5).setDepth(41).setAlpha(0);
    this.tweens.add({ targets: sep, alpha: 1, duration: 300, delay: 400 });

    let stars;
    if (missionSuccess && stealthRating >= 70) stars = '\u2605\u2605\u2605';
    else if (missionSuccess) stars = '\u2605\u2605\u2606';
    else if (layersDestroyed >= 3) stars = '\u2605\u2606\u2606';
    else stars = '\u2606\u2606\u2606';

    try { const sc = missionSuccess && stealthRating >= 70 ? 3 : missionSuccess ? 2 : layersDestroyed >= 3 ? 1 : 0; localStorage.setItem('superzion_stars_5', String(sc)); } catch(e) {}

    const lines = [
      `BUNKER BUSTERS USED: ${this.bustersUsed}/${BUSTER_TOTAL}`,
      `LAYERS PENETRATED: ${layersDestroyed}/${MOUNTAIN_LAYERS}`,
      `CENTRIFUGES DESTROYED: ${missionSuccess ? '8,000' : '0'}`,
      `MISSILES EVADED: ${this.missilesEvaded}`,
      `CHAFF USED: ${this.chaffUsed}/${CHAFF_TOTAL}`,
      `STEALTH RATING: ${stealthRating}%`,
      `ARMOR REMAINING: ${Math.max(0, this.armor)}/3`,
      `RATING: ${stars}`,
    ];

    let yPos = 125;
    lines.forEach((line, i) => {
      const t = this.add.text(W / 2, yPos, line, {
        fontFamily: 'monospace', fontSize: '13px', color: '#00e5ff',
      }).setOrigin(0.5).setDepth(41).setAlpha(0);
      this.tweens.add({ targets: t, alpha: 1, duration: 300, delay: 600 + i * 220 });
      yPos += 24;
    });

    this.time.delayedCall(3000, () => {
      this.add.rectangle(W / 2, yPos + 5, 280, 2, 0x00e5ff, 0.5).setDepth(41);
    });

    this.time.delayedCall(3400, () => {
      const promptText = missionSuccess ? 'PRESS ENTER FOR FINAL MISSION' : 'PRESS ENTER TO RETURN TO MENU';
      const cont = this.add.text(W / 2, yPos + 28, promptText, {
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



    switch (this.phase) {
      case 'stealth':
        this._updateStealth(dt);
        this._drawRadarCones();
        break;
      case 'defense':
        this._updateDefense(dt);
        break;
      case 'bombing':
        this._updateBombing(dt);
        break;
      case 'escape':
        this._updateEscape(dt);
        break;
      case 'victory':
        if (Phaser.Input.Keyboard.JustDown(this.keys.enter) || Phaser.Input.Keyboard.JustDown(this.keys.space)) {
          this._stopAmbient();
          this.scene.start(this.missionSuccess ? 'LastStandCinematicScene' : 'MenuScene');
        }
        break;
    }

    // Shared updates
    if (this.phase !== 'victory' && this.phase !== 'explosion') {
      this._updateExplosions(dt);
      this._updateHUD();
    }
    const activePhases = ['stealth', 'defense', 'bombing', 'escape'];
    if (activePhases.includes(this.phase)) {
      this._updateEngineTrail(dt);
    }
    // Hide detection bar when not in stealth
    if (this.phase !== 'stealth') {
      this.detBarBg.setVisible(false);
      this.detBarFill.setVisible(false);
      this.hudDetect.setVisible(false);
    }
    // Hide distance when not in flight phases
    if (!['stealth', 'defense', 'escape'].includes(this.phase)) {
      this.hudDist.setText('');
    }
    // Clean up radar graphics when not in stealth
    if (this.phase !== 'stealth' && this.radarGfx) {
      this.radarGfx.destroy();
      this.radarGfx = null;
    }
    // Clean up stealth-only HUD when not in stealth
    if (this.phase !== 'stealth' && this.hudStealth) {
      this.hudStealth.setVisible(false);
    }
  }

  shutdown() {
    this._stopAmbient();
    this.tweens.killAll();
    this.time.removeAllEvents();
    for (const m of this.missiles) {
      if (m.smokeTrail) for (const s of m.smokeTrail) s.sprite.destroy();
      m.sprite.destroy(); m.glow.destroy(); m.trail.destroy();
    }
    this.missiles = [];
    for (const b of this.bombObjects) { if (b.sprite) b.sprite.destroy(); if (b.nose) b.nose.destroy(); }
    this.bombObjects = [];
    for (const cd of this.chaffDecoys) { if (cd.sprite) cd.sprite.destroy(); }
    this.chaffDecoys = [];
    for (const e of this.explosions) { e.sprite.destroy(); }
    this.explosions = [];
    for (const ep of this.engineParticles) { if (ep.sprite) ep.sprite.destroy(); }
    this.engineParticles = [];
  }
}
