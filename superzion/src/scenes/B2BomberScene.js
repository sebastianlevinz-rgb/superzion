// ═══════════════════════════════════════════════════════════════
// B2BomberScene — Level 5: Operation Mountain Breaker (Side-Scrolling Night)
// 5-phase: Takeoff Cinematic → Stealth Flight → Defense → Mountain Bombing → Escape
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
import { showVictoryScreen, showDefeatScreen } from '../ui/EndScreen.js';
import { showControlsOverlay, showTutorialOverlay } from '../ui/ControlsOverlay.js';

const W = 960;
const H = 540;
const GROUND_Y = 420;
const B2_SPEED = 180;
const GRAVITY = 380;
const BUSTER_TOTAL = 6;
const MOUNTAIN_LAYERS = 5;
const CHAFF_TOTAL = 5;

// B-2 physics constants
const B2_GRAVITY = 150;         // gravity on B-2 px/s²
const B2_STALL_SPEED = 80;     // stall speed
const B2_STALL_GRAVITY = 300;  // extra gravity when stalling
const B2_CLIMB_ACCEL = 350;    // UP accel
const B2_DIVE_ACCEL = 200;     // DOWN accel
const B2_MAX_CLIMB_VY = -250;  // max climb speed
const B2_MAX_FALL_VY = 350;    // max fall speed

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

    // Controls overlay
    showControlsOverlay(this, 'ARROWS: Fly | SPACE: Drop Bomb | C: Chaff | ESC: Pause');

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
    this.phase = 'takeoff';
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
    this.jetVY = 0;
    this.crashed = false;
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

    // Defense phase wave pattern (reduce RNG)
    this.defenseWaveIndex = 0;
    this.defenseWavePatterns = [
      // Predictable sequence: alternating sides with consistent timing
      { side: 'left', interval: 3.0 },
      { side: 'right', interval: 2.5 },
      { side: 'center', interval: 3.0 },
      { side: 'left', interval: 2.0 },
      { side: 'right', interval: 2.5 },
      { side: 'center', interval: 2.0 },
      { side: 'left', interval: 2.5 },
      { side: 'right', interval: 3.0 },
    ];

    // Bombing phase wave pattern
    this.bombingMissileIndex = 0;

    // Escape phase wave pattern
    this.escapeMissileIndex = 0;

    // Ambient
    this.ambientRef = null;

    // ── Setup ──
    this._setupLayers();
    this._setupHUD();
    this._setupInput();

    // Tutorial overlay (pauses gameplay until dismissed)
    showTutorialOverlay(this, [
      'LEVEL 5: MOUNTAIN BREAKER',
      '',
      'ARROWS: Fly the B-2 stealth bomber',
      'Avoid radar detection zones',
      'SPACE: Drop bunker busters',
      'C: Deploy chaff against SAMs',
      'Destroy the mountain fortress',
    ]);

    // Start with cinematic takeoff sequence
    this._startTakeoff();
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
      fontFamily: 'monospace', fontSize: '14px', color: '#ffffff', fontStyle: 'bold',
      shadow: { offsetX: 0, offsetY: 0, color: '#000000', blur: 4, fill: true },
    }).setOrigin(0.5).setDepth(30);
    this.instrBg = this.add.rectangle(this.instrText.x, this.instrText.y, 960, 28, 0x000000, 0.7)
      .setScrollFactor(0).setDepth(this.instrText.depth - 1);
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
      p: this.input.keyboard.addKey('P'),
      esc: this.input.keyboard.addKey('ESC'),
      r: this.input.keyboard.addKey('R'),
      s: this.input.keyboard.addKey('S'),
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
    // Clean up missile tracking line graphics
    if (this._missileTrackGfx) {
      this._missileTrackGfx.clear();
    }
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

    // Spawn circular explosion particles
    const colors = [0xff6600, 0xff8800, 0xffaa00, 0xff2200, 0xffdd00, 0xffffff];
    const count = Math.min(18, Math.max(8, Math.floor(radius / 2)));
    for (let i = 0; i < count; i++) {
      const pr = 1 + Math.random() * 3;
      const c = colors[Math.floor(Math.random() * colors.length)];
      const p = this.add.circle(x, y, pr, c, 0.9).setDepth(22);
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
    if (Math.random() < 0.2) {
      const ox = this.facingRight ? -65 : 65;
      // Two engine exhaust ports offset from center (top-down planform view)
      const engineOffset = (Math.random() < 0.5 ? -5 : 5) + (Math.random() - 0.5) * 3;
      const p = this.add.circle(
        this.jetX + ox + (Math.random() - 0.5) * 6,
        this.jetY + engineOffset,
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

    // 1-second telegraph: red arrow + pulsing glow at launch position
    const arrowGfx = this.add.graphics().setDepth(25);
    const drawMissileArrow = (alpha) => {
      arrowGfx.clear();
      arrowGfx.fillStyle(0xff2222, alpha);
      arrowGfx.fillTriangle(x - 10, GROUND_Y - 5, x + 10, GROUND_Y - 5, x, GROUND_Y - 25);
      arrowGfx.lineStyle(1.5, 0xff0000, alpha * 0.7);
      arrowGfx.lineBetween(x, GROUND_Y - 25, x, GROUND_Y - 45);
    };
    drawMissileArrow(0.7);

    const warnGlow = this.add.circle(x, GROUND_Y - 10, 14, 0xff0000, 0.3).setDepth(24);
    this.tweens.add({
      targets: warnGlow, scale: 1.8, alpha: 0.6, duration: 200,
      yoyo: true, repeat: 2,
    });

    // Pulse the arrow
    let mPulse = 0;
    const mPulseEvent = this.time.addEvent({
      delay: 200, repeat: 4,
      callback: () => {
        mPulse++;
        drawMissileArrow(mPulse % 2 === 0 ? 0.8 : 0.2);
      },
    });

    // Delay actual missile spawn by 1 second
    this.time.delayedCall(1000, () => {
      arrowGfx.destroy();
      warnGlow.destroy();
      if (mPulseEvent) mPulseEvent.remove();
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
    // Clear missile tracking lines from previous frame
    if (this._missileTrackGfx) this._missileTrackGfx.clear();
    else this._missileTrackGfx = this.add.graphics().setDepth(6);

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

        // Draw thin red predicted intercept line from missile toward player
        const lineAlpha = Math.min(0.25, 0.4 * (1 - dist / 400)); // fades at distance
        if (lineAlpha > 0.02) {
          this._missileTrackGfx.lineStyle(1, 0xff2222, lineAlpha);
          this._missileTrackGfx.lineBetween(m.x, m.y, this.jetX, this.jetY);
        }

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

  _releaseChaff() {
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
  // TAKEOFF CINEMATIC SEQUENCE
  // ═════════════════════════════════════════════════════════════
  _startTakeoff() {
    this.phase = 'takeoff';
    this.takeoffTimer = 0;
    this.takeoffStage = 0;       // 0=runway, 1=engine-start, 2=roll, 3=liftoff
    this.takeoffBomberY = 0;     // offset from center (positive = down screen)
    this.takeoffSpeed = 0;       // current roll speed
    this.takeoffScale = 1.5;     // camera zoom
    this.takeoffShake = 0;       // screen-shake intensity
    this.takeoffRunwayOffset = 0;// scrolling runway lights

    // Hide the side-view jet and normal layers during takeoff
    this.jetSprite.setVisible(false);
    this.skyBg.setVisible(false);
    this.cloudTile.setVisible(false);
    this.farTerrain.setVisible(false);
    this.groundTile.setVisible(false);

    // Hide HUD during takeoff
    this._setHUDVisible(false);

    // Container for all takeoff visuals (destroyed on transition)
    this.takeoffObjects = [];

    // --- Graphics layer for runway + top-down B-2 ---
    this.takeoffGfx = this.add.graphics().setDepth(20);
    this.takeoffObjects.push(this.takeoffGfx);

    // Engine glow circles (trailing edge of B-2)
    const cx = W / 2;
    const cy = H / 2 + 60;
    this.takeoffEngineL = this.add.circle(cx - 14, cy + 18, 4, 0xff6600, 0.8).setDepth(22);
    this.takeoffEngineR = this.add.circle(cx + 14, cy + 18, 4, 0xff6600, 0.8).setDepth(22);
    this.takeoffObjects.push(this.takeoffEngineL, this.takeoffEngineR);

    // Engine outer glow
    this.takeoffEngineGlowL = this.add.circle(cx - 14, cy + 18, 8, 0xff4400, 0.3).setDepth(21);
    this.takeoffEngineGlowR = this.add.circle(cx + 14, cy + 18, 8, 0xff4400, 0.3).setDepth(21);
    this.takeoffObjects.push(this.takeoffEngineGlowL, this.takeoffEngineGlowR);

    // Title text: "OPERATION MOUNTAIN BREAKER"
    this.takeoffTitle = this.add.text(W / 2, 60, 'OPERATION MOUNTAIN BREAKER', {
      fontFamily: 'monospace', fontSize: '22px', color: '#aaaacc',
      shadow: { offsetX: 0, offsetY: 0, color: '#aaaacc', blur: 8, fill: true },
    }).setOrigin(0.5).setDepth(30).setAlpha(0);
    this.takeoffObjects.push(this.takeoffTitle);

    // Fade in title
    this.tweens.add({ targets: this.takeoffTitle, alpha: 1, duration: 1500 });

    // Engine trail particles array
    this.takeoffParticles = [];

    // Play engine start sound after a short delay
    this.time.delayedCall(500, () => {
      if (this.phase !== 'takeoff') return;
      this.takeoffEngineRef = SoundManager.get().playB2Engine();
    });
  }

  _updateTakeoff(dt) {
    this.takeoffTimer += dt;
    const t = this.takeoffTimer;
    const gfx = this.takeoffGfx;
    if (!gfx || !gfx.scene) return;

    const cx = W / 2;
    const baseY = H / 2 + 60;

    // Determine stage based on timer
    if (t < 3) this.takeoffStage = 0;        // Stage 1: runway view
    else if (t < 5) this.takeoffStage = 1;    // Stage 2: engine start + zoom out
    else if (t < 7.5) this.takeoffStage = 2;  // Stage 3: takeoff roll
    else this.takeoffStage = 3;                // Stage 4: liftoff + transition

    // --- Stage 2: zoom out ---
    if (this.takeoffStage >= 1 && this.takeoffStage < 3) {
      const zoomProgress = Math.min(1, (t - 3) / 2);
      this.takeoffScale = 1.5 - 0.5 * zoomProgress; // 1.5 -> 1.0
    }

    // --- Stage 2: engine intensifies ---
    let engineColor = 0xff6600;
    let engineAlpha = 0.8;
    let glowAlpha = 0.3;
    let glowRadius = 8;
    if (this.takeoffStage >= 1) {
      const pulse = Math.sin(t * 12) * 0.3 + 0.7;
      const intensifyT = Math.min(1, (t - 3) / 2);
      // Lerp orange -> white
      const r = Math.floor(255);
      const g = Math.floor(102 + (255 - 102) * intensifyT);
      const b = Math.floor(0 + 255 * intensifyT);
      engineColor = Phaser.Display.Color.GetColor(r, g, b);
      engineAlpha = 0.8 + 0.2 * pulse;
      glowAlpha = 0.3 + 0.4 * intensifyT * pulse;
      glowRadius = 8 + 10 * intensifyT;
    }

    // --- Stage 2+: screen shake from engines ---
    if (this.takeoffStage >= 1 && this.takeoffStage < 3) {
      this.takeoffShake = Math.min(0.003, (t - 3) * 0.001);
      if (this.takeoffShake > 0) {
        this.cameras.main.shake(100, this.takeoffShake);
      }
    }

    // --- Stage 3: afterburner sound ---
    if (this.takeoffStage === 2 && !this._afterburnerPlayed) {
      this._afterburnerPlayed = true;
      SoundManager.get().playAfterburner();
      // Intensify shake
      this.cameras.main.shake(2500, 0.008);
    }

    // --- Stage 3: acceleration ---
    if (this.takeoffStage >= 2) {
      const rollT = t - 5;
      // Quadratic acceleration
      this.takeoffSpeed = Math.min(600, 20 * rollT * rollT + 30 * rollT);
      this.takeoffBomberY -= this.takeoffSpeed * dt;
      this.takeoffRunwayOffset += this.takeoffSpeed * dt;
    }

    // --- Stage 4: liftoff (scale shrinks = climbing away) ---
    let liftScale = 1;
    if (this.takeoffStage === 3) {
      const liftT = t - 7.5;
      liftScale = Math.max(0.4, 1 - liftT * 0.4);
    }

    // ===== DRAW EVERYTHING =====
    gfx.clear();

    const scale = this.takeoffScale;
    const bomberScreenY = baseY + this.takeoffBomberY * 0.1; // slight visual offset

    // --- Dark background ---
    gfx.fillStyle(0x0a0a12, 1);
    gfx.fillRect(0, 0, W, H);

    // --- Runway (top-down, two gray lines with dashed center) ---
    const rwLeft = cx - 50 * scale;
    const rwRight = cx + 50 * scale;
    const rwTop = -20;
    const rwBottom = H + 20;

    // Runway surface (dark asphalt)
    gfx.fillStyle(0x1a1a1a, 1);
    gfx.fillRect(rwLeft, rwTop, (rwRight - rwLeft), rwBottom - rwTop);

    // Edge lines
    gfx.lineStyle(2 * scale, 0x555555, 0.8);
    gfx.lineBetween(rwLeft, rwTop, rwLeft, rwBottom);
    gfx.lineBetween(rwRight, rwTop, rwRight, rwBottom);

    // Dashed center line (yellow)
    const dashLen = 30 * scale;
    const gapLen = 20 * scale;
    const dashOffset = (this.takeoffRunwayOffset * scale) % (dashLen + gapLen);
    for (let y = rwTop - dashOffset; y < rwBottom; y += dashLen + gapLen) {
      gfx.lineStyle(2 * scale, 0xffff00, 0.7);
      gfx.lineBetween(cx, y, cx, Math.min(y + dashLen, rwBottom));
    }

    // Runway edge lights (white dots)
    const lightSpacing = 60 * scale;
    const lightOffset = (this.takeoffRunwayOffset * scale) % lightSpacing;
    for (let y = rwTop - lightOffset; y < rwBottom; y += lightSpacing) {
      const lightBrightness = 0.6 + Math.sin(t * 3 + y * 0.01) * 0.2;
      gfx.fillStyle(0xffffff, lightBrightness);
      gfx.fillCircle(rwLeft - 6 * scale, y, 2 * scale);
      gfx.fillCircle(rwRight + 6 * scale, y, 2 * scale);
    }

    // Threshold markings at bottom of runway (piano keys)
    if (this.takeoffStage < 2) {
      const threshY = H - 80 + this.takeoffRunwayOffset * scale * 0.3;
      if (threshY > 0 && threshY < H + 40) {
        for (let i = -3; i <= 3; i++) {
          if (i === 0) continue;
          gfx.fillStyle(0xffffff, 0.5);
          gfx.fillRect(cx + i * 12 * scale - 4 * scale, threshY, 8 * scale, 30 * scale);
        }
      }
    }

    // --- Top-down B-2 shape ---
    const bx = cx;
    const by = Math.max(80, Math.min(H - 40, baseY + this.takeoffBomberY * 0.05));
    const bs = scale * liftScale; // combined scale

    // Flying wing body (boomerang/bat shape)
    gfx.fillStyle(0x3a3a3a, 1);
    gfx.beginPath();
    gfx.moveTo(bx, by - 20 * bs);                // nose
    gfx.lineTo(bx + 60 * bs, by + 15 * bs);      // right wing tip
    gfx.lineTo(bx + 40 * bs, by + 20 * bs);      // right trailing edge
    gfx.lineTo(bx, by + 10 * bs);                 // center rear
    gfx.lineTo(bx - 40 * bs, by + 20 * bs);      // left trailing edge
    gfx.lineTo(bx - 60 * bs, by + 15 * bs);      // left wing tip
    gfx.closePath();
    gfx.fill();

    // Darker wing surface gradient (inner portion)
    gfx.fillStyle(0x2e2e2e, 0.6);
    gfx.beginPath();
    gfx.moveTo(bx, by - 15 * bs);
    gfx.lineTo(bx + 35 * bs, by + 12 * bs);
    gfx.lineTo(bx, by + 8 * bs);
    gfx.lineTo(bx - 35 * bs, by + 12 * bs);
    gfx.closePath();
    gfx.fill();

    // Panel lines
    gfx.lineStyle(0.5 * bs, 0x555555, 0.5);
    gfx.lineBetween(bx, by - 18 * bs, bx, by + 8 * bs);           // center seam
    gfx.lineBetween(bx - 20 * bs, by + 5 * bs, bx + 20 * bs, by + 5 * bs); // cross seam

    // Wing leading-edge highlight
    gfx.lineStyle(1 * bs, 0x4a4a4a, 0.6);
    gfx.beginPath();
    gfx.moveTo(bx - 58 * bs, by + 14 * bs);
    gfx.lineTo(bx, by - 19 * bs);
    gfx.lineTo(bx + 58 * bs, by + 14 * bs);
    gfx.strokePath();

    // --- Engine glow (positioned at trailing edge) ---
    const engLX = bx - 14 * bs;
    const engRX = bx + 14 * bs;
    const engY = by + 16 * bs;

    this.takeoffEngineL.setPosition(engLX, engY).setScale(bs);
    this.takeoffEngineR.setPosition(engRX, engY).setScale(bs);
    this.takeoffEngineL.setFillStyle(engineColor, engineAlpha);
    this.takeoffEngineR.setFillStyle(engineColor, engineAlpha);

    this.takeoffEngineGlowL.setPosition(engLX, engY).setScale(bs * glowRadius / 8);
    this.takeoffEngineGlowR.setPosition(engRX, engY).setScale(bs * glowRadius / 8);
    this.takeoffEngineGlowL.setAlpha(glowAlpha);
    this.takeoffEngineGlowR.setAlpha(glowAlpha);

    // --- Engine trail particles (Stage 2+) ---
    if (this.takeoffStage >= 2 && Math.random() < 0.6) {
      const side = Math.random() < 0.5 ? -1 : 1;
      const px = bx + side * 14 * bs + (Math.random() - 0.5) * 4 * bs;
      const py = engY + 4 * bs;
      const pr = 1.5 + Math.random() * 2;
      const pColor = Math.random() < 0.3 ? 0xffffff : (Math.random() < 0.5 ? 0xff8800 : 0xff6600);
      const particle = this.add.circle(px, py, pr * bs, pColor, 0.7).setDepth(19);
      this.takeoffParticles.push({ sprite: particle, life: 0.4 + Math.random() * 0.3, vy: this.takeoffSpeed * 0.3 });
    }

    // Update trail particles
    for (let i = this.takeoffParticles.length - 1; i >= 0; i--) {
      const p = this.takeoffParticles[i];
      p.life -= dt;
      p.sprite.y += p.vy * dt;
      p.sprite.setAlpha(Math.max(0, p.life * 1.5));
      p.sprite.setScale(1 + (0.4 - p.life));
      if (p.life <= 0 || p.sprite.y > H + 10) {
        p.sprite.destroy();
        this.takeoffParticles.splice(i, 1);
      }
    }

    // --- Stage 4: transition to stealth ---
    if (this.takeoffStage === 3) {
      const liftT = t - 7.5;
      // Fade to black overlay
      if (liftT > 0.8 && !this._takeoffFading) {
        this._takeoffFading = true;
        const fadeOverlay = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0).setDepth(50);
        this.takeoffObjects.push(fadeOverlay);
        this.tweens.add({
          targets: fadeOverlay, alpha: 1, duration: 800,
          onComplete: () => {
            this._cleanupTakeoff();
            this._startStealth();
          },
        });
        // Fade title
        this.tweens.add({ targets: this.takeoffTitle, alpha: 0, duration: 600 });
      }
    }
  }

  _cleanupTakeoff() {
    // Destroy all takeoff visuals
    for (const obj of (this.takeoffObjects || [])) {
      if (obj && obj.scene) {
        try { obj.destroy(); } catch (e) { /* already destroyed */ }
      }
    }
    this.takeoffObjects = [];

    // Destroy trail particles
    for (const p of (this.takeoffParticles || [])) {
      if (p.sprite && p.sprite.scene) p.sprite.destroy();
    }
    this.takeoffParticles = [];

    // Stop takeoff engine sound
    if (this.takeoffEngineRef) {
      try {
        this.takeoffEngineRef.source.stop();
        if (this.takeoffEngineRef.osc) this.takeoffEngineRef.osc.stop();
      } catch (e) { /* already stopped */ }
      this.takeoffEngineRef = null;
    }

    // Restore normal layers
    this.jetSprite.setVisible(true);
    this.skyBg.setVisible(true);
    this.cloudTile.setVisible(true);
    this.groundTile.setVisible(true);
    // farTerrain stays hidden — stealth phase controls it

    // Show HUD
    this._setHUDVisible(true);

    // Reset takeoff flags
    this._afterburnerPlayed = false;
    this._takeoffFading = false;
  }

  _setHUDVisible(visible) {
    const hudElements = [
      this.hudTitle, this.hudArmor, this.hudBusters, this.hudChaff,
      this.hudAlt, this.hudSpeed, this.hudDist,
      this.detBarBg, this.detBarFill, this.hudDetect, this.hudStealth,
      this.instrText, this.instrBg,
    ];
    for (const el of hudElements) {
      if (el) el.setVisible(visible);
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
    this.jetVY = 0;
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
      // Distribute SAM sites evenly across screen width (predictable positions)
      const existingCount = this.samSites.length;
      const spacing = (W - 300) / (count + 1);
      const sx = 150 + spacing * (i + 1);
      this.samSites.push({
        x: sx, baseY: GROUND_Y + 15,
        cooldown: 6, // consistent cooldown (not random)
        timer: i * 2, // staggered initial timers so they don't all fire at once
        active: true,
        telegraphing: false,
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

    // Gravity physics
    this.jetVY += B2_GRAVITY * dt;
    if (this.keys.up.isDown) this.jetVY -= B2_CLIMB_ACCEL * dt;
    if (this.keys.down.isDown) this.jetVY += B2_DIVE_ACCEL * dt;
    if (this.jetVX < B2_STALL_SPEED) this.jetVY += B2_STALL_GRAVITY * dt;
    this.jetVY = Phaser.Math.Clamp(this.jetVY, B2_MAX_CLIMB_VY, B2_MAX_FALL_VY);
    this.jetY += this.jetVY * dt;
    if (this.jetY < 40) { this.jetY = 40; this.jetVY = Math.max(0, this.jetVY); }
    if (this.jetY >= GROUND_Y - 20) { this._crashJet('ground'); return; }

    // Chaff
    if (Phaser.Input.Keyboard.JustDown(this.keys.c)) this._releaseChaff();

    const targetX = 200 + (this.jetVX - B2_SPEED) * 0.5;
    this.jetX += (targetX - this.jetX) * 3 * dt;
    this.jetX = Phaser.Math.Clamp(this.jetX, 60, W - 60);
    this.jetSprite.setPosition(this.jetX, this.jetY);

    // Tilt based on vertical velocity
    const stealthTilt = Phaser.Math.Clamp(this.jetVY / 400, -0.3, 0.3);
    const curAngle = this.jetSprite.rotation || 0;
    this.jetSprite.setRotation(curAngle + (stealthTilt - curAngle) * 5 * dt);

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
    // Telegraphed: red flash on SAM site 1s before firing
    for (const sam of this.samSites) {
      sam.timer += dt;
      if (sam.active && this.detectionLevel > 50 && sam.timer >= sam.cooldown && !sam.telegraphing) {
        sam.telegraphing = true;
        // Red flash telegraph on SAM position 1s before firing
        const samFlash = this.add.circle(sam.x, sam.baseY, 15, 0xff0000, 0.5).setDepth(25);
        this.tweens.add({
          targets: samFlash, scale: 2.0, alpha: 0.8, duration: 200,
          yoyo: true, repeat: 2,
          onComplete: () => samFlash.destroy(),
        });
        this.time.delayedCall(1000, () => {
          sam.timer = 0;
          sam.telegraphing = false;
          if (this.phase === 'dead' || this.phase === 'victory') return;
          this._spawnTrackingMissile(sam.x, sam.baseY);
          SoundManager.get().playRadarAlert();
        });
      }
    }

    this.maxDetection = Math.max(this.maxDetection, this.detectionLevel);

    // Detection overload — missile from nearest SAM site (predictable source)
    if (this.detectionLevel >= 100) {
      SoundManager.get().playRadarAlert();
      this.detectionLevel = 40;
      // Launch missile from nearest active SAM site (predictable, not random)
      let nearestSam = null;
      let nearDist = Infinity;
      for (const sam of this.samSites) {
        if (!sam.active) continue;
        const d = Math.abs(sam.x - this.jetX);
        if (d < nearDist) { nearDist = d; nearestSam = sam; }
      }
      const launchX = nearestSam ? nearestSam.x : W / 2;
      this._spawnTrackingMissile(launchX, GROUND_Y + 20);
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
      const isTelegraphing = sam.telegraphing;
      const alertLevel = isTelegraphing ? 0.9 : (this.detectionLevel > 50 ? 0.6 : 0.3);
      const samColor = isTelegraphing ? 0xff0000 : (this.detectionLevel > 50 ? 0xff4444 : 0x888888);

      // SAM launcher (small triangle) — pulses red when about to fire
      const pulseScale = isTelegraphing ? 1.5 + Math.sin(this.phaseTimer * 15) * 0.5 : 1;
      this.radarGfx.fillStyle(samColor, alertLevel);
      this.radarGfx.beginPath();
      this.radarGfx.moveTo(sam.x, sam.baseY - 8 * pulseScale);
      this.radarGfx.lineTo(sam.x - 5 * pulseScale, sam.baseY);
      this.radarGfx.lineTo(sam.x + 5 * pulseScale, sam.baseY);
      this.radarGfx.closePath();
      this.radarGfx.fillPath();

      // Alert ring when active — larger and faster when telegraphing
      if (this.detectionLevel > 50 || isTelegraphing) {
        const ringSpeed = isTelegraphing ? 12 : 6;
        const ringAlpha = isTelegraphing ? 0.6 : 0.3;
        const pr = (isTelegraphing ? 10 : 6) + Math.sin(this.phaseTimer * ringSpeed) * 3;
        this.radarGfx.lineStyle(isTelegraphing ? 2 : 1, 0xff0000, ringAlpha);
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
    this.jetVY = 0;
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

    // Gravity physics
    this.jetVY += B2_GRAVITY * dt;
    if (this.keys.up.isDown) this.jetVY -= B2_CLIMB_ACCEL * dt;
    if (this.keys.down.isDown) this.jetVY += B2_DIVE_ACCEL * dt;
    if (this.jetVX < B2_STALL_SPEED) this.jetVY += B2_STALL_GRAVITY * dt;
    this.jetVY = Phaser.Math.Clamp(this.jetVY, B2_MAX_CLIMB_VY, B2_MAX_FALL_VY);
    this.jetY += this.jetVY * dt;
    if (this.jetY < 40) { this.jetY = 40; this.jetVY = Math.max(0, this.jetVY); }
    if (this.jetY >= GROUND_Y - 20) { this._crashJet('ground'); return; }

    if (Phaser.Input.Keyboard.JustDown(this.keys.c)) this._releaseChaff();

    const targetX = 250 + (this.jetVX - B2_SPEED) * 0.5;
    this.jetX += (targetX - this.jetX) * 3 * dt;
    this.jetX = Phaser.Math.Clamp(this.jetX, 60, W - 60);
    this.jetSprite.setPosition(this.jetX, this.jetY);

    // Tilt
    const defTilt = Phaser.Math.Clamp(this.jetVY / 400, -0.3, 0.3);
    const defAngle = this.jetSprite.rotation || 0;
    this.jetSprite.setRotation(defAngle + (defTilt - defAngle) * 5 * dt);

    this._scrollLayers(this.jetVX, dt);
    this.defenseDistance += this.jetVX * dt;

    // Spawn tracking missiles — predictable wave pattern
    this.missileSpawnTimer += dt;
    const waveEntry = this.defenseWavePatterns[this.defenseWaveIndex % this.defenseWavePatterns.length];
    if (this.missileSpawnTimer >= waveEntry.interval) {
      this.missileSpawnTimer = 0;
      // Predictable X based on wave side
      let spawnX;
      if (waveEntry.side === 'left') spawnX = 150 + (this.defenseWaveIndex % 3) * 50;
      else if (waveEntry.side === 'right') spawnX = W - 150 - (this.defenseWaveIndex % 3) * 50;
      else spawnX = W / 2 + ((this.defenseWaveIndex % 2) * 2 - 1) * 80;
      this._spawnTrackingMissile(spawnX, GROUND_Y + 10);
      this.defenseWaveIndex++;
    }

    // Flak anti-aircraft bursts — telegraphed with predictable positions
    this.flakTimer += dt;
    if (this.flakTimer >= 1.5) {
      this.flakTimer = 0;
      // Sine-wave pattern for flak Y, distributed X
      const flakIdx = this.defenseWaveIndex + this.flakTimer;
      const baseX = 100 + ((Math.floor(this.phaseTimer * 2) * 179 + 100) % (W - 200));
      const baseY = 200 + Math.sin(this.phaseTimer * 1.2) * 100;

      // Brief red flash warning at flak position
      const flakWarn = this.add.circle(baseX, baseY, 20, 0xff0000, 0.3).setDepth(24);
      this.tweens.add({
        targets: flakWarn, scale: 1.5, alpha: 0.5, duration: 150,
        yoyo: true,
        onComplete: () => flakWarn.destroy(),
      });

      // Delayed flak detonation
      this.time.delayedCall(500, () => {
        for (let f = 0; f < 3; f++) {
          const fx = baseX + (f - 1) * 25;
          const fy = Phaser.Math.Clamp(baseY + (f - 1) * 15, 60, GROUND_Y - 20);
          this._addExplosion(fx, fy, 5 + f * 1.5, 0x666666);
        }
        SoundManager.get().playFlakExplosion();
        // Flak damage check (only if very close)
        const flakDist = Phaser.Math.Distance.Between(this.jetX, this.jetY, baseX, baseY);
        if (flakDist < 30) {
          this._takeDamage();
        }
      });
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
    this.jetVY = 0;

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

    // Gravity physics (reduced during bombing — auto-fly keeps altitude better)
    this.jetVY += B2_GRAVITY * 0.6 * dt;
    if (this.keys.up.isDown) this.jetVY -= B2_CLIMB_ACCEL * dt;
    if (this.keys.down.isDown) this.jetVY += B2_DIVE_ACCEL * dt;
    this.jetVY = Phaser.Math.Clamp(this.jetVY, B2_MAX_CLIMB_VY, B2_MAX_FALL_VY);
    this.jetY += this.jetVY * dt;
    if (this.jetY < 40) { this.jetY = 40; this.jetVY = Math.max(0, this.jetVY); }
    if (this.jetY >= GROUND_Y - 20) { this._crashJet('ground'); return; }

    this.jetSprite.setPosition(this.jetX, this.jetY);

    // Tilt
    const bombTilt = Phaser.Math.Clamp(this.jetVY / 400, -0.3, 0.3);
    const bombAngle = this.jetSprite.rotation || 0;
    this.jetSprite.setRotation(bombAngle + (bombTilt - bombAngle) * 5 * dt);
    this.jetVX = moveSpeed * (this.facingRight ? 1 : -1);

    // Bomb cooldown
    if (this.bombCooldown > 0) this.bombCooldown -= dt;

    // Drop bunker buster
    if (Phaser.Input.Keyboard.JustDown(this.keys.space) && this.busters > 0 && this.bombCooldown <= 0) {
      this._dropBuster();
      this.bombCooldown = 0.8;
    }

    this._updateBusters(dt);

    // Turret missiles — predictable alternating positions
    this.missileSpawnTimer += dt;
    if (this.missileSpawnTimer >= 3) {
      this.missileSpawnTimer = 0;
      // Alternate between left and right of mountain
      const bombSide = this.bombingMissileIndex % 2 === 0 ? -1 : 1;
      const bombOffset = 60 + (this.bombingMissileIndex % 3) * 40;
      this._spawnTrackingMissile(MTN_X + bombSide * bombOffset, GROUND_Y + 10);
      this.bombingMissileIndex++;
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

    // Track all spawned objects for final cleanup
    const explosionObjects = [];
    // Center of the mountain layers (bomb impact zone)
    const impactCX = MTN_X;
    const impactCY = LAYER_START_Y + (MOUNTAIN_LAYERS * LAYER_H) / 2;

    // ═══════════════════════════════════════════════════════════
    // PHASE 1 — WHITE SCREEN FLASH (0-300ms)
    // Blinding flash + heavy screen shake
    // ═══════════════════════════════════════════════════════════
    this.cameras.main.flash(300, 255, 255, 255);
    const whiteFlash = this.add.rectangle(W / 2, H / 2, W, H, 0xffffff, 1.0).setDepth(50);
    explosionObjects.push(whiteFlash);
    this.tweens.add({
      targets: whiteFlash, alpha: 0, duration: 300,
      onComplete: () => whiteFlash.destroy(),
    });
    // Intense screen shake for the entire sequence
    this.cameras.main.shake(12000, 0.05);
    SoundManager.get().playNuclearExplosion();

    // ═══════════════════════════════════════════════════════════
    // PHASE 2 — INTERNAL FIREBALL (300ms-2300ms, ~2 seconds)
    // Orange/red fire erupting from INSIDE the mountain through
    // the layer holes. Glowing circles expanding from bomb impact points.
    // ═══════════════════════════════════════════════════════════
    this.time.delayedCall(300, () => {
      // Erupting fireballs from each destroyed layer position
      for (let i = 0; i < MOUNTAIN_LAYERS; i++) {
        const layerCY = LAYER_START_Y + i * LAYER_H + LAYER_H / 2;
        this.time.delayedCall(i * 200, () => {
          // Core fireball — white-hot center expanding outward
          const coreHot = this.add.circle(impactCX, layerCY, 8, 0xffffcc, 0.95).setDepth(18);
          explosionObjects.push(coreHot);
          this.tweens.add({
            targets: coreHot, scaleX: 5, scaleY: 5, alpha: 0, duration: 1200,
            onComplete: () => coreHot.destroy(),
          });

          // Orange fireball ring expanding
          const fireRing = this.add.circle(impactCX, layerCY, 15, 0xff4400, 0.8).setDepth(17);
          explosionObjects.push(fireRing);
          this.tweens.add({
            targets: fireRing, scaleX: 4, scaleY: 4, alpha: 0.15, duration: 1600,
            onComplete: () => fireRing.destroy(),
          });

          // Red outer halo
          const redHalo = this.add.circle(impactCX, layerCY, 25, 0xcc0000, 0.4).setDepth(16);
          explosionObjects.push(redHalo);
          this.tweens.add({
            targets: redHalo, scaleX: 3.5, scaleY: 3.5, alpha: 0, duration: 1800,
            onComplete: () => redHalo.destroy(),
          });
        });
      }

      // Central massive fireball erupting upward through all layers
      const centralFire = this.add.circle(impactCX, impactCY, 40, 0xff6600, 0.9).setDepth(17);
      explosionObjects.push(centralFire);
      this.tweens.add({
        targets: centralFire,
        scaleX: 3.5, scaleY: 5, y: impactCY - 60,
        alpha: 0.2, duration: 2000,
        onComplete: () => centralFire.destroy(),
      });

      // Fire tongues erupting upward from the top of the mountain
      for (let t = 0; t < 8; t++) {
        const tongueX = impactCX + (Math.random() - 0.5) * LAYER_W;
        const tongueW = 3 + Math.random() * 5;
        const tongueH = 30 + Math.random() * 50;
        const tongueColor = Math.random() < 0.5 ? 0xff4400 : 0xff8800;
        const tongue = this.add.rectangle(tongueX, LAYER_START_Y - 10, tongueW, tongueH, tongueColor, 0.7).setDepth(17);
        explosionObjects.push(tongue);
        this.tweens.add({
          targets: tongue,
          y: LAYER_START_Y - 60 - Math.random() * 40,
          scaleY: 2 + Math.random(),
          alpha: 0,
          duration: 1200 + Math.random() * 800,
          delay: t * 100,
          onComplete: () => tongue.destroy(),
        });
      }

      SoundManager.get().playExplosion();
    });

    // ═══════════════════════════════════════════════════════════
    // PHASE 3 — CRACKS WITH FIRE (2300ms-4300ms, ~2 seconds)
    // Jagged crack lines appearing on the mountain surface with
    // orange light bleeding through the cracks
    // ═══════════════════════════════════════════════════════════
    this.time.delayedCall(2300, () => {
      const crackGfx = this.add.graphics().setDepth(18);
      explosionObjects.push(crackGfx);

      const crackCount = 12;
      const crackData = []; // store for glow pass

      // Draw cracks radiating from impact center across mountain surface
      for (let i = 0; i < crackCount; i++) {
        const angle = (i / crackCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
        const len = 60 + Math.random() * 80;
        const segments = [];
        let px = impactCX, py = impactCY;
        segments.push({ x: px, y: py });

        for (let s = 0; s < 6; s++) {
          px += Math.cos(angle) * len / 6 + (Math.random() - 0.5) * 14;
          py += Math.sin(angle) * len / 6 + (Math.random() - 0.5) * 14;
          segments.push({ x: px, y: py });
        }
        crackData.push(segments);
      }

      // First pass: wide orange glow (light bleeding through cracks)
      crackGfx.lineStyle(5, 0xff6600, 0.35);
      for (const segs of crackData) {
        crackGfx.beginPath();
        crackGfx.moveTo(segs[0].x, segs[0].y);
        for (let s = 1; s < segs.length; s++) {
          crackGfx.lineTo(segs[s].x, segs[s].y);
        }
        crackGfx.strokePath();
      }

      // Second pass: bright core crack line
      crackGfx.lineStyle(2, 0xffaa44, 0.7);
      for (const segs of crackData) {
        crackGfx.beginPath();
        crackGfx.moveTo(segs[0].x, segs[0].y);
        for (let s = 1; s < segs.length; s++) {
          crackGfx.lineTo(segs[s].x, segs[s].y);
        }
        crackGfx.strokePath();
      }

      // Third pass: white-hot inner line
      crackGfx.lineStyle(0.8, 0xffeecc, 0.6);
      for (const segs of crackData) {
        crackGfx.beginPath();
        crackGfx.moveTo(segs[0].x, segs[0].y);
        for (let s = 1; s < segs.length; s++) {
          crackGfx.lineTo(segs[s].x, segs[s].y);
        }
        crackGfx.strokePath();
      }

      // Pulsing glow circles at crack endpoints (fire bleeding through)
      for (const segs of crackData) {
        const endPt = segs[segs.length - 1];
        const glowCirc = this.add.circle(endPt.x, endPt.y, 6, 0xff4400, 0.5).setDepth(17);
        explosionObjects.push(glowCirc);
        this.tweens.add({
          targets: glowCirc,
          scaleX: 2, scaleY: 2,
          alpha: 0.15,
          duration: 800 + Math.random() * 400,
          yoyo: true, repeat: 1,
          onComplete: () => glowCirc.destroy(),
        });
      }

      // Cracks persist for 2 seconds then fade
      this.time.delayedCall(2000, () => {
        this.tweens.add({
          targets: crackGfx, alpha: 0, duration: 800,
          onComplete: () => crackGfx.destroy(),
        });
      });

      SoundManager.get().playBunkerBusterImpact();
      // Additional shake pulse for crack phase
      this.cameras.main.shake(2000, 0.04);
    });

    // ═══════════════════════════════════════════════════════════
    // PHASE 4 — PARTIAL COLLAPSE (4300ms-6300ms, ~2 seconds)
    // Upper portion of the mountain shifts/falls down 25px with
    // slight rotation; heavy debris particles falling
    // ═══════════════════════════════════════════════════════════
    this.time.delayedCall(4300, () => {
      // Mountain top half collapses — shift down 25px and tilt 3 degrees
      if (this.mountainSprite) {
        // Shift origin to simulate top collapsing: move down + rotate
        this.tweens.add({
          targets: this.mountainSprite,
          y: this.mountainSprite.y + 25,
          rotation: 0.05, // ~3 degrees tilt
          duration: 2000,
          ease: 'Bounce.easeOut',
        });
      }

      // Also collapse all remaining layer overlays
      for (const ls of this.mountainLayerSprites) {
        if (ls.rect && ls.rect.scene) {
          this.tweens.add({
            targets: [ls.rect, ls.edge],
            y: '+=' + 25,
            alpha: 0.05,
            duration: 1500,
          });
        }
      }

      // Heavy collapse shake
      this.cameras.main.shake(2500, 0.06);
      SoundManager.get().playExplosion();

      // Massive debris rain — 25+ chunks falling from the mountain
      const debrisCount = 25 + Math.floor(Math.random() * 10);
      for (let i = 0; i < debrisCount; i++) {
        this.time.delayedCall(i * 60, () => {
          const dx = MTN_X + (Math.random() - 0.5) * 160;
          const dy = MTN_TOP_Y + Math.random() * 80;
          const size = 3 + Math.random() * 10;
          const colors = [0x3a3428, 0x4a4a4a, 0x2a2820, 0x555544, 0x3a3a3a, 0x666655];
          const color = colors[Math.floor(Math.random() * colors.length)];
          const debris = this.add.rectangle(dx, dy, size, size * 0.6, color, 0.85).setDepth(19);
          explosionObjects.push(debris);

          const fallDist = 180 + Math.random() * 150;
          const drift = (Math.random() - 0.5) * 120;
          const fallDur = 1200 + Math.random() * 1200;

          this.tweens.add({
            targets: debris,
            x: dx + drift,
            y: dy + fallDist,
            rotation: (Math.random() - 0.5) * 6,
            alpha: 0,
            duration: fallDur,
            ease: 'Quad.easeIn',
            onComplete: () => debris.destroy(),
          });
        });
      }

      // Dust clouds billow outward from base on both sides
      for (let side = -1; side <= 1; side += 2) {
        const dustCloud = this.add.ellipse(
          MTN_X + side * 30, GROUND_Y - 30,
          40, 25, 0x888877, 0.4
        ).setDepth(15);
        explosionObjects.push(dustCloud);
        this.tweens.add({
          targets: dustCloud,
          x: MTN_X + side * 180,
          scaleX: 4, scaleY: 3,
          alpha: 0,
          duration: 2500,
          ease: 'Quad.easeOut',
          onComplete: () => dustCloud.destroy(),
        });
      }
    });

    // ═══════════════════════════════════════════════════════════
    // PHASE 5 — MASSIVE SMOKE COLUMN (6300ms-9500ms, ~3+ seconds)
    // Huge column of dark gray smoke rising from the mountain,
    // mushroom-cloud-like expansion at the top (layered rising circles)
    // ═══════════════════════════════════════════════════════════
    this.time.delayedCall(6300, () => {
      // ── Smoke column stem — series of overlapping dark circles rising ──
      const stemCircles = 12;
      for (let i = 0; i < stemCircles; i++) {
        const stemY = LAYER_START_Y + 60 - i * 8;
        const stemR = 18 - i * 0.5;
        const stemAlpha = 0.55 - i * 0.03;
        const stemGray = 0x50 + i * 5;
        const stemColor = Phaser.Display.Color.GetColor(stemGray, stemGray - 5, stemGray - 10);
        const stemCirc = this.add.circle(
          impactCX + (Math.random() - 0.5) * 8,
          stemY, stemR, stemColor, stemAlpha
        ).setDepth(14);
        explosionObjects.push(stemCirc);

        // Rise upward over 3 seconds
        this.tweens.add({
          targets: stemCirc,
          y: stemY - 120 - i * 10,
          scaleX: 1.3 + i * 0.08,
          scaleY: 1.2,
          alpha: stemAlpha * 0.3,
          duration: 3000 + i * 100,
          onComplete: () => stemCirc.destroy(),
        });
      }

      // ── Mushroom cap — expanding circles at the top ──
      // Multiple overlapping ellipses that spread outward as they rise
      const capLayers = 6;
      for (let i = 0; i < capLayers; i++) {
        this.time.delayedCall(i * 200, () => {
          const capY = LAYER_START_Y - 40 - i * 5;
          const capW = 60 + i * 15;
          const capH = 25 + i * 5;
          const capGray = 0x55 + i * 8;
          const capColor = Phaser.Display.Color.GetColor(capGray, capGray - 3, capGray - 8);
          const capEllipse = this.add.ellipse(
            impactCX, capY, capW, capH, capColor, 0.45 - i * 0.05
          ).setDepth(14);
          explosionObjects.push(capEllipse);

          this.tweens.add({
            targets: capEllipse,
            y: capY - 80 - i * 15,
            scaleX: 2.2 + i * 0.3,
            scaleY: 1.8 + i * 0.2,
            alpha: 0.08,
            duration: 3000,
            onComplete: () => capEllipse.destroy(),
          });
        });
      }

      // ── Inner orange glow inside the mushroom cap ──
      const innerGlow = this.add.ellipse(impactCX, LAYER_START_Y - 50, 50, 20, 0xff6600, 0.25).setDepth(15);
      explosionObjects.push(innerGlow);
      this.tweens.add({
        targets: innerGlow,
        y: LAYER_START_Y - 150,
        scaleX: 2.5, scaleY: 2,
        alpha: 0.4,
        duration: 1500,
        yoyo: true, repeat: 1,
        onComplete: () => {
          this.tweens.add({
            targets: innerGlow, alpha: 0, duration: 800,
            onComplete: () => innerGlow.destroy(),
          });
        },
      });

      // ── Embers and ash particles drifting upward in the column ──
      for (let e = 0; e < 30; e++) {
        this.time.delayedCall(e * 80, () => {
          const ex = impactCX + (Math.random() - 0.5) * 60;
          const ey = LAYER_START_Y + 40 + Math.random() * 40;
          const isEmber = Math.random() < 0.4;
          const particle = this.add.circle(
            ex, ey,
            isEmber ? 1.5 : 1,
            isEmber ? 0xff4400 : 0x999988,
            isEmber ? 0.7 : 0.4
          ).setDepth(16);
          explosionObjects.push(particle);

          this.tweens.add({
            targets: particle,
            x: ex + (Math.random() - 0.5) * 40,
            y: ey - 150 - Math.random() * 100,
            alpha: 0,
            duration: 2000 + Math.random() * 1500,
            onComplete: () => particle.destroy(),
          });
        });
      }

      // Secondary fire at mountain base (burning wreckage)
      const fireCount = 6;
      for (let f = 0; f < fireCount; f++) {
        const fx = MTN_X + (Math.random() - 0.5) * 180;
        const fire = this.add.circle(fx, GROUND_Y - 8, 5 + Math.random() * 5, 0xff6600, 0.5).setDepth(16);
        explosionObjects.push(fire);
        fire.setAlpha(0.3);
        this.tweens.add({
          targets: fire, alpha: 0.7, duration: 200 + Math.random() * 200,
          yoyo: true, repeat: 8,
          onComplete: () => {
            this.tweens.add({
              targets: fire, alpha: 0, duration: 600,
              onComplete: () => fire.destroy(),
            });
          },
        });
      }

      SoundManager.get().playBunkerBusterImpact();
    });

    // ═══════════════════════════════════════════════════════════
    // AFTERMATH (9500ms) — Text + Cleanup + Transition
    // ═══════════════════════════════════════════════════════════
    this.time.delayedCall(9500, () => {
      const txt = this.add.text(W / 2, 50, 'NATANZ FACILITY -- DESTROYED', {
        fontFamily: 'monospace', fontSize: '24px', color: '#00ff00',
        shadow: { offsetX: 0, offsetY: 0, color: '#00ff00', blur: 16, fill: true },
      }).setOrigin(0.5).setDepth(25);
      this.tweens.add({
        targets: txt, alpha: 0.4, duration: 500, yoyo: true, repeat: 3,
        onComplete: () => {
          txt.destroy();
          // Final cleanup — destroy mountain and all lingering explosion objects
          if (this.mountainSprite) { this.mountainSprite.destroy(); this.mountainSprite = null; }
          for (const l of this.mountainLayerSprites) {
            if (l.rect) l.rect.destroy();
            if (l.edge) l.edge.destroy();
          }
          this.mountainLayerSprites = [];
          for (const obj of explosionObjects) {
            if (obj && obj.scene) {
              try { obj.destroy(); } catch (e) { /* already destroyed */ }
            }
          }
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
    this.jetVY = 0;
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

    // Gravity physics
    this.jetVY += B2_GRAVITY * dt;
    if (this.keys.up.isDown) this.jetVY -= B2_CLIMB_ACCEL * dt;
    if (this.keys.down.isDown) this.jetVY += B2_DIVE_ACCEL * dt;
    this.jetVY = Phaser.Math.Clamp(this.jetVY, B2_MAX_CLIMB_VY, B2_MAX_FALL_VY);
    this.jetY += this.jetVY * dt;
    if (this.jetY < 40) { this.jetY = 40; this.jetVY = Math.max(0, this.jetVY); }
    if (this.jetY >= GROUND_Y - 20) { this._crashJet('ground'); return; }

    if (Phaser.Input.Keyboard.JustDown(this.keys.c)) this._releaseChaff();

    const targetX = (W - 250) + (this.jetVX + B2_SPEED) * 0.5;
    this.jetX += (targetX - this.jetX) * 3 * dt;
    this.jetX = Phaser.Math.Clamp(this.jetX, 60, W - 60);
    this.jetSprite.setFlipX(true);
    this.jetSprite.setPosition(this.jetX, this.jetY);

    // Tilt
    const escTilt = Phaser.Math.Clamp(this.jetVY / 400, -0.3, 0.3);
    const escAngle = this.jetSprite.rotation || 0;
    this.jetSprite.setRotation(escAngle + (escTilt - escAngle) * 5 * dt);

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

    // Last missiles — predictable alternating pattern
    this.missileSpawnTimer += dt;
    if (this.missileSpawnTimer >= 4 && this.escapeDistance < 3500) {
      this.missileSpawnTimer = 0;
      // Predictable spawn positions alternating across screen
      const escSide = this.escapeMissileIndex % 3;
      let escX;
      if (escSide === 0) escX = 250;
      else if (escSide === 1) escX = W / 2;
      else escX = W - 250;
      this._spawnTrackingMissile(escX, GROUND_Y + 10);
      this.escapeMissileIndex++;
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
  // CRASH
  // ═════════════════════════════════════════════════════════════
  _crashJet(reason) {
    if (this.crashed) return;
    this.crashed = true;
    this.phase = 'dead';
    this._stopAmbient();

    SoundManager.get().playExplosion();
    this.cameras.main.shake(600, 0.05);

    if (this.jetSprite) this.jetSprite.setVisible(false);

    for (let i = 0; i < 15; i++) {
      const ex = this.jetX + (Math.random() - 0.5) * 80;
      const ey = this.jetY + (Math.random() - 0.5) * 40;
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
    this.cameras.main.resetFX();
    MusicManager.get().stop(1);

    const layersDestroyed = MOUNTAIN_LAYERS - Math.max(0, this.mountainHP);
    const missionSuccess = layersDestroyed >= MOUNTAIN_LAYERS;
    this.missionSuccess = missionSuccess;
    const stealthRating = Math.max(0, Math.round(100 - this.maxDetection));

    if (missionSuccess) SoundManager.get().playVictory();

    // Star rating
    const starCount = missionSuccess && stealthRating >= 70 ? 3
      : missionSuccess ? 2
      : layersDestroyed >= 3 ? 1 : 0;

    try { localStorage.setItem('superzion_stars_5', String(starCount)); } catch(e) {}

    const stats = [
      { label: 'BUNKER BUSTERS USED', value: `${this.bustersUsed}/${BUSTER_TOTAL}` },
      { label: 'LAYERS PENETRATED', value: `${layersDestroyed}/${MOUNTAIN_LAYERS}` },
      { label: 'CENTRIFUGES DESTROYED', value: missionSuccess ? '8,000' : '0' },
      { label: 'MISSILES EVADED', value: `${this.missilesEvaded}` },
      { label: 'CHAFF USED', value: `${this.chaffUsed}/${CHAFF_TOTAL}` },
      { label: 'STEALTH RATING', value: `${stealthRating}%` },
      { label: 'ARMOR REMAINING', value: `${Math.max(0, this.armor)}/3` },
    ];
    const beforeTransition = () => this._stopAmbient();

    if (missionSuccess) {
      this._endScreen = showVictoryScreen(this, {
        title: 'MISSION COMPLETE', stats, stars: starCount,
        currentScene: 'B2BomberScene',
        nextScene: 'LastStandCinematicScene',
        onBeforeTransition: beforeTransition,
      });
    } else {
      this._endScreen = showDefeatScreen(this, {
        title: 'MISSION FAILED', stats,
        currentScene: 'B2BomberScene',
        skipScene: 'LastStandCinematicScene',
        onBeforeTransition: beforeTransition,
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

    // P key — skip to victory
    if (Phaser.Input.Keyboard.JustDown(this.keys.p) && this.phase !== 'victory' && this.phase !== 'explosion') {
      if (this.phase === 'takeoff') this._cleanupTakeoff();
      this._stopAmbient();
      this.mountainHP = 0;
      this.bustersUsed = 4;
      this.armor = 2;
      this.missionSuccess = true;
      this._showVictory();
      return;
    }

    switch (this.phase) {
      case 'takeoff':
        this._updateTakeoff(dt);
        break;
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
        break;
    }

    // Shared updates (skip during takeoff cinematic)
    if (this.phase !== 'victory' && this.phase !== 'explosion' && this.phase !== 'takeoff') {
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
    if (this._endScreen) this._endScreen.destroy();
    this._stopAmbient();
    // Clean up takeoff visuals if still present
    if (this.phase === 'takeoff') this._cleanupTakeoff();
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
