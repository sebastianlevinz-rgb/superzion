// ═══════════════════════════════════════════════════════════════
// B2BomberScene — Level 5: Operation Mountain Breaker (Top-Down Aerial)
// Phases: Takeoff → Flight (sea→coast→land) → Bombing Run → Escape
// Entire level uses the top-down aerial perspective.
// ═══════════════════════════════════════════════════════════════

import Phaser from 'phaser';
import SoundManager from '../systems/SoundManager.js';
import MusicManager from '../systems/MusicManager.js';
import DifficultyManager from '../systems/DifficultyManager.js';
import { showVictoryScreen, showDefeatScreen } from '../ui/EndScreen.js';
import { showControlsOverlay, showTutorialOverlay } from '../ui/ControlsOverlay.js';

const W = 960;
const H = 540;
const BUSTER_TOTAL = 6;
const MOUNTAIN_LAYERS = 5;
const CHAFF_TOTAL = 5;

// Top-down B-2 movement
const B2_MOVE_SPEED = 220;   // pixels/sec for arrow-key movement
const B2_MARGIN = 50;        // screen-edge padding

export default class B2BomberScene extends Phaser.Scene {
  constructor() { super('B2BomberScene'); }

  create() {
    this.cameras.main.setBackgroundColor('#000000');

    // Controls overlay
    showControlsOverlay(this, 'ARROWS: Move | SPACE: Drop Bomb | C: Chaff | ESC: Pause');

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

    // Top-down B-2 position (center of screen initially)
    this.jetX = W / 2;
    this.jetY = H * 0.65;
    this.jetBankAngle = 0;  // visual bank when moving left/right
    this.crashed = false;
    this.phaseTimer = 0;
    this.bombCooldown = 0;
    this.bombingEnded = false;

    // Missile/radar systems
    this.missiles = [];
    this.bombObjects = [];
    this.explosions = [];
    this.engineParticles = [];
    this.radarCones = [];
    this.samSites = [];
    this.chaffDecoys = [];
    this.missileSpawnTimer = 0;
    this.mountainLayerSprites = [];
    this.mountainSprite = null;

    // Terrain scrolling
    this.terrainOffset = 0;
    this.terrainSpeed = 200;  // px/sec terrain scrolls downward

    // Flight phase terrain data
    this.flightBuildings = [];
    this.flightRoads = [];

    // Mountain bombing data
    this.mountainTopY = 0;     // where the mountain top currently is on screen
    this.mountainApproachDist = 0;

    // Escape
    this.escapeTimer = 0;

    // Ambient
    this.ambientRef = null;

    // ── Setup ──
    this._setupGraphics();
    this._setupHUD();
    this._setupInput();

    // Tutorial overlay (pauses gameplay until dismissed)
    showTutorialOverlay(this, [
      'LEVEL 5: MOUNTAIN BREAKER',
      '',
      'ARROWS: Move the B-2 stealth bomber',
      'Avoid radar detection zones',
      'SPACE: Drop bunker busters on target',
      'C: Deploy chaff against SAMs',
      'Destroy the mountain fortress!',
    ]);

    // Start with cinematic takeoff sequence
    this._startTakeoff();
  }

  // ═════════════════════════════════════════════════════════════
  // GRAPHICS SETUP (no side-view layers needed)
  // ═════════════════════════════════════════════════════════════
  _setupGraphics() {
    // Main terrain graphics layer (drawn every frame)
    this.terrainGfx = this.add.graphics().setDepth(0);
    // B-2 graphics layer (drawn every frame)
    this.b2Gfx = this.add.graphics().setDepth(10);
    // Radar/SAM overlay graphics
    this.radarGfx = this.add.graphics().setDepth(5);
    // Missile tracking lines
    this._missileTrackGfx = this.add.graphics().setDepth(6);
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

    this.hudAlt = this.add.text(W - 15, 12, 'ALT: 12000m', { ...hudStyle, color: '#aaaaaa' })
      .setOrigin(1, 0).setDepth(30);
    this.hudSpeed = this.add.text(W - 15, 28, 'SPD: 450 kts', { ...hudStyle, color: '#aaaaaa' })
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
  _updateHUD() {
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
  }

  _setHUDVisible(visible) {
    const hudElements = [
      this.hudTitle, this.hudArmor, this.hudBusters, this.hudChaff,
      this.hudAlt, this.hudSpeed, this.hudDist,
      this.detBarBg, this.detBarFill, this.hudDetect,
      this.instrText, this.instrBg,
    ];
    for (const el of hudElements) {
      if (el) el.setVisible(visible);
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
    if (this._missileTrackGfx) this._missileTrackGfx.clear();
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
        scale: 0, alpha: 0, rotation: Math.random() * 6,
        duration: 300 + Math.random() * 400, ease: 'Quad.easeOut',
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

  // ═════════════════════════════════════════════════════════════
  // TOP-DOWN B-2 DRAWING (shared across all gameplay phases)
  // ═════════════════════════════════════════════════════════════
  _drawB2(gfx, bx, by, scale, bankAngle) {
    const bs = scale || 1;
    // Banking: shift wing tips based on bankAngle (-1 to 1)
    const bank = (bankAngle || 0) * 0.15;  // subtle rotation

    // Draw relative to bx,by with manual vertex offsets for banking

    // Flying wing body (boomerang/bat shape from above)
    gfx.fillStyle(0x3a3a3a, 1);
    gfx.beginPath();
    gfx.moveTo(bx, by - 20 * bs);                                  // nose (top)
    gfx.lineTo(bx + (60 + bank * 10) * bs, by + 15 * bs);         // right wing tip
    gfx.lineTo(bx + (40 + bank * 6) * bs, by + 20 * bs);          // right trailing edge
    gfx.lineTo(bx, by + 10 * bs);                                  // center rear
    gfx.lineTo(bx - (40 - bank * 6) * bs, by + 20 * bs);          // left trailing edge
    gfx.lineTo(bx - (60 - bank * 10) * bs, by + 15 * bs);         // left wing tip
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
    gfx.lineBetween(bx, by - 18 * bs, bx, by + 8 * bs);
    gfx.lineBetween(bx - 20 * bs, by + 5 * bs, bx + 20 * bs, by + 5 * bs);

    // Wing leading-edge highlight
    gfx.lineStyle(1 * bs, 0x4a4a4a, 0.6);
    gfx.beginPath();
    gfx.moveTo(bx - (58 - bank * 8) * bs, by + 14 * bs);
    gfx.lineTo(bx, by - 19 * bs);
    gfx.lineTo(bx + (58 + bank * 8) * bs, by + 14 * bs);
    gfx.strokePath();

    // Engine glow (two engine exhausts at trailing edge)
    const engLX = bx - 14 * bs;
    const engRX = bx + 14 * bs;
    const engY = by + 16 * bs;
    const t = this.phaseTimer || 0;
    const pulse = Math.sin(t * 12) * 0.2 + 0.8;

    // Outer glow
    gfx.fillStyle(0xff4400, 0.25 * pulse);
    gfx.fillCircle(engLX, engY, 7 * bs);
    gfx.fillCircle(engRX, engY, 7 * bs);
    // Inner bright core
    gfx.fillStyle(0xff8800, 0.7 * pulse);
    gfx.fillCircle(engLX, engY, 3 * bs);
    gfx.fillCircle(engRX, engY, 3 * bs);

  }

  _updateEngineTrail(dt) {
    // Spawn engine trail particles behind the B-2
    const isFlipped = this._escapeFlipped || (this.phase === 'bounce' && !this._bounceFlipped);
    if (Math.random() < 0.3) {
      const side = Math.random() < 0.5 ? -1 : 1;
      const px = this.jetX + side * 14 + (Math.random() - 0.5) * 4;
      const py = isFlipped ? this.jetY - 18 : this.jetY + 18;  // engines at top when flipped
      const pColor = Math.random() < 0.3 ? 0xff8800 : 0x554433;
      const p = this.add.circle(px, py, 1.5 + Math.random(), pColor, 0.3).setDepth(4);
      this.engineParticles.push({ sprite: p, life: 0.5 + Math.random() * 0.3 });
    }
    for (let i = this.engineParticles.length - 1; i >= 0; i--) {
      const ep = this.engineParticles[i];
      ep.life -= dt;
      ep.sprite.y += this.terrainSpeed * 0.3 * dt;  // drift downward with terrain
      ep.sprite.setAlpha(Math.max(0, ep.life * 0.5));
      if (ep.life <= 0 || ep.sprite.y > H + 10) {
        ep.sprite.destroy(); this.engineParticles.splice(i, 1);
      }
    }
  }

  // ═════════════════════════════════════════════════════════════
  // MISSILE SYSTEMS (shared across phases) — top-down adapted
  // ═════════════════════════════════════════════════════════════
  _spawnTrackingMissile(x, y) {
    const maxMissiles = this.phase === 'flight' ? 2 : 3;
    if (this.missiles.length >= maxMissiles) return;

    // Telegraph: red flash at launch position
    const warnGlow = this.add.circle(x, y, 14, 0xff0000, 0.3).setDepth(24);
    this.tweens.add({
      targets: warnGlow, scale: 1.8, alpha: 0.6, duration: 200,
      yoyo: true, repeat: 2,
    });

    this.time.delayedCall(1000, () => {
      if (warnGlow && warnGlow.scene) warnGlow.destroy();
      if (this.phase === 'dead' || this.phase === 'victory') return;
      const m = this.add.circle(x, y, 4, 0xff3333).setDepth(8);
      const glow = this.add.circle(x, y, 8, 0xff0000, 0.4).setDepth(7);
      const trail = this.add.circle(x, y, 2, 0x888888, 0.2).setDepth(6);
      this.missiles.push({
        sprite: m, glow, trail, x, y,
        vx: 0, vy: -70,
        tracking: true, life: 6,
        smokeTrail: [],
      });
    });
  }

  _updateMissiles(dt) {
    if (this._missileTrackGfx) this._missileTrackGfx.clear();

    for (let i = this.missiles.length - 1; i >= 0; i--) {
      const m = this.missiles[i];
      m.life -= dt;

      if (m.tracking && m.life > 0.5) {
        const dx = this.jetX - m.x;
        const dy = this.jetY - m.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const missileSpeed = 110;
        const targetVX = (dx / dist) * missileSpeed;
        const targetVY = (dy / dist) * missileSpeed;
        const turnRate = 100 * dt;
        m.vx += Math.sign(targetVX - m.vx) * Math.min(Math.abs(targetVX - m.vx), turnRate);
        m.vy += Math.sign(targetVY - m.vy) * Math.min(Math.abs(targetVY - m.vy), turnRate);

        // Tracking line
        const lineAlpha = Math.min(0.25, 0.4 * (1 - dist / 400));
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

      // Smoke trail
      if (m.smokeTrail && Math.random() < 0.5) {
        const smoke = this.add.circle(
          m.x - m.vx * 0.03 + (Math.random() - 0.5) * 3,
          m.y - m.vy * 0.03 + (Math.random() - 0.5) * 3,
          2 + Math.random() * 2, 0xcc2200, 0.5
        ).setDepth(6);
        m.smokeTrail.push({ sprite: smoke, life: 0.8 });
        if (m.smokeTrail.length > 20) {
          const old = m.smokeTrail.shift();
          old.sprite.destroy();
        }
      }
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
      if (hitDist < 22) {
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

    // Chaff decoy appears behind B-2 (below it in top-down)
    const decoy = this.add.circle(this.jetX, this.jetY + 30, 5, 0xffff00, 0.7).setDepth(9);
    this.chaffDecoys.push({
      sprite: decoy,
      x: this.jetX, y: this.jetY + 30,
      life: 2.5,
    });

    // Sparkle effect
    for (let i = 0; i < 8; i++) {
      const spark = this.add.circle(
        this.jetX + (Math.random() - 0.5) * 20,
        this.jetY + 30 + (Math.random() - 0.5) * 20,
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
  // TAKEOFF CINEMATIC SEQUENCE (top-down, B-2 moves UPWARD)
  // ═════════════════════════════════════════════════════════════
  _startTakeoff() {
    this.phase = 'takeoff';
    this.takeoffTimer = 0;
    this.takeoffStage = 0;
    this.takeoffBomberY = 140;  // start near bottom of screen
    this.takeoffSpeed = 0;
    this.takeoffScale = 1.3;   // less extreme zoom
    this.takeoffShake = 0;
    this.takeoffRunwayOffset = 0;

    // Hide gameplay graphics and HUD during takeoff
    this.terrainGfx.setVisible(false);
    this.b2Gfx.setVisible(false);
    this.radarGfx.setVisible(false);
    this._setHUDVisible(false);

    // Container for all takeoff visuals
    this.takeoffObjects = [];

    // Graphics layer for runway + top-down B-2
    this.takeoffGfx = this.add.graphics().setDepth(20);
    this.takeoffObjects.push(this.takeoffGfx);

    // Engine glow circles
    const cx = W / 2;
    const cy = H / 2 + 60;
    this.takeoffEngineL = this.add.circle(cx - 14, cy + 18, 4, 0xff6600, 0.8).setDepth(22);
    this.takeoffEngineR = this.add.circle(cx + 14, cy + 18, 4, 0xff6600, 0.8).setDepth(22);
    this.takeoffObjects.push(this.takeoffEngineL, this.takeoffEngineR);

    this.takeoffEngineGlowL = this.add.circle(cx - 14, cy + 18, 8, 0xff4400, 0.3).setDepth(21);
    this.takeoffEngineGlowR = this.add.circle(cx + 14, cy + 18, 8, 0xff4400, 0.3).setDepth(21);
    this.takeoffObjects.push(this.takeoffEngineGlowL, this.takeoffEngineGlowR);

    // Title text
    this.takeoffTitle = this.add.text(W / 2, 60, 'OPERATION MOUNTAIN BREAKER', {
      fontFamily: 'monospace', fontSize: '22px', color: '#aaaacc',
      shadow: { offsetX: 0, offsetY: 0, color: '#aaaacc', blur: 8, fill: true },
    }).setOrigin(0.5).setDepth(30).setAlpha(0);
    this.takeoffObjects.push(this.takeoffTitle);
    this.tweens.add({ targets: this.takeoffTitle, alpha: 1, duration: 1500 });

    // Engine trail particles
    this.takeoffParticles = [];

    // Play engine start sound
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

    // Stages
    if (t < 3) this.takeoffStage = 0;
    else if (t < 5) this.takeoffStage = 1;
    else if (t < 7.5) this.takeoffStage = 2;
    else this.takeoffStage = 3;

    // Zoom out
    if (this.takeoffStage >= 1 && this.takeoffStage < 3) {
      const zoomProgress = Math.min(1, (t - 3) / 2);
      this.takeoffScale = 1.3 - 0.3 * zoomProgress;
    }

    // Engine intensification
    let engineColor = 0xff6600;
    let engineAlpha = 0.8;
    let glowAlpha = 0.3;
    let glowRadius = 8;
    if (this.takeoffStage >= 1) {
      const pulse = Math.sin(t * 12) * 0.3 + 0.7;
      const intensifyT = Math.min(1, (t - 3) / 2);
      const r = 255;
      const g = Math.floor(102 + (255 - 102) * intensifyT);
      const b = Math.floor(0 + 255 * intensifyT);
      engineColor = Phaser.Display.Color.GetColor(r, g, b);
      engineAlpha = 0.8 + 0.2 * pulse;
      glowAlpha = 0.3 + 0.4 * intensifyT * pulse;
      glowRadius = 8 + 10 * intensifyT;
    }

    // Screen shake from engines
    if (this.takeoffStage >= 1 && this.takeoffStage < 3) {
      this.takeoffShake = Math.min(0.003, (t - 3) * 0.001);
      if (this.takeoffShake > 0) {
        this.cameras.main.shake(100, this.takeoffShake);
      }
    }

    // Afterburner sound
    if (this.takeoffStage === 2 && !this._afterburnerPlayed) {
      this._afterburnerPlayed = true;
      SoundManager.get().playAfterburner();
      this.cameras.main.shake(2500, 0.008);
    }

    // FIX 1: B-2 moves UPWARD (takeoffBomberY DECREASES)
    // Runway lights scroll DOWNWARD (takeoffRunwayOffset increases)
    if (this.takeoffStage >= 2) {
      const rollT = t - 5;
      this.takeoffSpeed = Math.min(600, 20 * rollT * rollT + 30 * rollT);
      this.takeoffBomberY -= this.takeoffSpeed * dt;  // plane moves UP
      this.takeoffRunwayOffset += this.takeoffSpeed * dt;  // lights scroll DOWN
    }

    // Liftoff scale
    let liftScale = 1;
    if (this.takeoffStage === 3) {
      const liftT = t - 7.5;
      liftScale = Math.max(0.4, 1 - liftT * 0.4);
    }

    // ===== DRAW EVERYTHING =====
    gfx.clear();
    const scale = this.takeoffScale;
    const bomberScreenY = baseY + this.takeoffBomberY;

    // Dark background
    gfx.fillStyle(0x0a0a12, 1);
    gfx.fillRect(0, 0, W, H);

    // Runway (top-down)
    const rwLeft = cx - 50 * scale;
    const rwRight = cx + 50 * scale;
    const rwTop = -20;
    const rwBottom = H + 20;

    gfx.fillStyle(0x1a1a1a, 1);
    gfx.fillRect(rwLeft, rwTop, (rwRight - rwLeft), rwBottom - rwTop);

    // Edge lines
    gfx.lineStyle(2 * scale, 0x555555, 0.8);
    gfx.lineBetween(rwLeft, rwTop, rwLeft, rwBottom);
    gfx.lineBetween(rwRight, rwTop, rwRight, rwBottom);

    // Dashed center line (scrolling DOWN as plane moves forward/up)
    const dashLen = 30 * scale;
    const gapLen = 20 * scale;
    const dashOffset = (this.takeoffRunwayOffset * scale) % (dashLen + gapLen);
    for (let y = rwTop - dashLen + dashOffset; y < rwBottom; y += dashLen + gapLen) {
      gfx.lineStyle(2 * scale, 0xffff00, 0.7);
      gfx.lineBetween(cx, y, cx, Math.min(y + dashLen, rwBottom));
    }

    // Runway edge lights (scrolling DOWN)
    const lightSpacing = 60 * scale;
    const lightOffset = (this.takeoffRunwayOffset * scale) % lightSpacing;
    for (let y = rwTop - lightSpacing + lightOffset; y < rwBottom; y += lightSpacing) {
      const lightBrightness = 0.6 + Math.sin(t * 3 + y * 0.01) * 0.2;
      gfx.fillStyle(0xffffff, lightBrightness);
      gfx.fillCircle(rwLeft - 6 * scale, y, 2 * scale);
      gfx.fillCircle(rwRight + 6 * scale, y, 2 * scale);
    }

    // Threshold markings
    if (this.takeoffStage < 2) {
      const threshY = H + 40 - this.takeoffRunwayOffset * scale * 0.3;
      if (threshY > -40 && threshY < H + 40) {
        for (let i = -3; i <= 3; i++) {
          if (i === 0) continue;
          gfx.fillStyle(0xffffff, 0.5);
          gfx.fillRect(cx + i * 12 * scale - 4 * scale, threshY, 8 * scale, 30 * scale);
        }
      }
    }

    // Top-down B-2 shape (nose points UP)
    const bx = cx;
    const by = Math.max(80, Math.min(H - 40, bomberScreenY));
    const bs = scale * liftScale;

    gfx.fillStyle(0x3a3a3a, 1);
    gfx.beginPath();
    gfx.moveTo(bx, by - 20 * bs);
    gfx.lineTo(bx + 60 * bs, by + 15 * bs);
    gfx.lineTo(bx + 40 * bs, by + 20 * bs);
    gfx.lineTo(bx, by + 10 * bs);
    gfx.lineTo(bx - 40 * bs, by + 20 * bs);
    gfx.lineTo(bx - 60 * bs, by + 15 * bs);
    gfx.closePath();
    gfx.fill();

    gfx.fillStyle(0x2e2e2e, 0.6);
    gfx.beginPath();
    gfx.moveTo(bx, by - 15 * bs);
    gfx.lineTo(bx + 35 * bs, by + 12 * bs);
    gfx.lineTo(bx, by + 8 * bs);
    gfx.lineTo(bx - 35 * bs, by + 12 * bs);
    gfx.closePath();
    gfx.fill();

    gfx.lineStyle(0.5 * bs, 0x555555, 0.5);
    gfx.lineBetween(bx, by - 18 * bs, bx, by + 8 * bs);
    gfx.lineBetween(bx - 20 * bs, by + 5 * bs, bx + 20 * bs, by + 5 * bs);

    gfx.lineStyle(1 * bs, 0x4a4a4a, 0.6);
    gfx.beginPath();
    gfx.moveTo(bx - 58 * bs, by + 14 * bs);
    gfx.lineTo(bx, by - 19 * bs);
    gfx.lineTo(bx + 58 * bs, by + 14 * bs);
    gfx.strokePath();

    // Engine glow positions
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

    // Engine trail particles (stage 2+) — drift DOWNWARD
    if (this.takeoffStage >= 2 && Math.random() < 0.6) {
      const side = Math.random() < 0.5 ? -1 : 1;
      const px = bx + side * 14 * bs + (Math.random() - 0.5) * 4 * bs;
      const py = engY + 4 * bs;
      const pr = 1.5 + Math.random() * 2;
      const pColor = Math.random() < 0.3 ? 0xffffff : (Math.random() < 0.5 ? 0xff8800 : 0xff6600);
      const particle = this.add.circle(px, py, pr * bs, pColor, 0.7).setDepth(19);
      this.takeoffParticles.push({ sprite: particle, life: 0.4 + Math.random() * 0.3, vy: this.takeoffSpeed * 0.3 });
    }

    for (let i = this.takeoffParticles.length - 1; i >= 0; i--) {
      const p = this.takeoffParticles[i];
      p.life -= dt;
      p.sprite.y += p.vy * dt;  // particles drift DOWN (behind the plane)
      p.sprite.setAlpha(Math.max(0, p.life * 1.5));
      p.sprite.setScale(1 + (0.4 - p.life));
      if (p.life <= 0 || p.sprite.y > H + 10) {
        p.sprite.destroy();
        this.takeoffParticles.splice(i, 1);
      }
    }

    // Smooth transition: during liftoff, blend runway into ocean water
    if (this.takeoffStage === 3) {
      const liftT = t - 7.5;
      const blendAlpha = Math.min(1, liftT / 2);  // 0→1 over 2 seconds

      // Draw ocean water fading IN over the runway background
      gfx.fillStyle(0x0a1628, blendAlpha * 0.9);
      gfx.fillRect(0, 0, W, H);
      // Wave hints appearing
      if (blendAlpha > 0.3) {
        gfx.lineStyle(1, 0x1a2a48, blendAlpha * 0.3);
        for (let y = 0; y < H; y += 40) {
          for (let x = 0; x < W; x += 8) {
            const wy = y + Math.sin(x * 0.04 + t * 1.5) * 3;
            const wy2 = y + Math.sin((x + 8) * 0.04 + t * 1.5) * 3;
            gfx.lineBetween(x, wy, x + 8, wy2);
          }
        }
      }

      // Fade title
      if (this.takeoffTitle && this.takeoffTitle.alpha > 0) {
        this.takeoffTitle.setAlpha(Math.max(0, 1 - liftT * 1.5));
      }

      // Transition to flight when fully blended
      if (liftT > 2.2 && !this._takeoffFading) {
        this._takeoffFading = true;
        this._cleanupTakeoff();
        this._startFlight();
      }
    }
  }

  _cleanupTakeoff() {
    for (const obj of (this.takeoffObjects || [])) {
      if (obj && obj.scene) {
        try { obj.destroy(); } catch (e) { /* already destroyed */ }
      }
    }
    this.takeoffObjects = [];

    for (const p of (this.takeoffParticles || [])) {
      if (p.sprite && p.sprite.scene) p.sprite.destroy();
    }
    this.takeoffParticles = [];

    if (this.takeoffEngineRef) {
      try {
        this.takeoffEngineRef.source.stop();
        if (this.takeoffEngineRef.osc) this.takeoffEngineRef.osc.stop();
      } catch (e) { /* already stopped */ }
      this.takeoffEngineRef = null;
    }

    // Show gameplay graphics and HUD
    this.terrainGfx.setVisible(true);
    this.b2Gfx.setVisible(true);
    this.radarGfx.setVisible(true);
    this._setHUDVisible(true);

    this._afterburnerPlayed = false;
    this._takeoffFading = false;
  }

  // ═════════════════════════════════════════════════════════════
  // PHASE: FLIGHT (replaces stealth + defense) — ~20 seconds
  // Top-down B-2 flying forward. Terrain scrolls downward.
  // Sea (0-7s) → Coast (7-12s) → Land (12-20s)
  // ═════════════════════════════════════════════════════════════
  _startFlight() {
    this.phase = 'flight';
    MusicManager.get().playLevel5Music('stealth');
    this.phaseTimer = 0;
    this.detectionLevel = 0;
    this.maxDetection = 0;
    this.terrainOffset = 0;
    this.terrainSpeed = 280;    // faster flight
    this.jetX = W / 2;
    this.jetY = H * 0.65;
    this.jetBankAngle = 0;
    this._cleanupMissiles();
    this.missileSpawnTimer = 0;

    // Generate buildings for land phase
    this.flightBuildings = [];
    for (let i = 0; i < 30; i++) {
      this.flightBuildings.push({
        x: 40 + Math.random() * (W - 80),
        yBase: Math.random() * 2000,  // spread over a virtual terrain space
        w: 4 + Math.random() * 8,
        h: 4 + Math.random() * 8,
        color: 0x4a4a4a + Math.floor(Math.random() * 0x101010),
      });
    }

    // Generate road positions for land phase
    this.flightRoads = [
      { x: 180 + Math.random() * 40, vertical: true },
      { x: 580 + Math.random() * 40, vertical: true },
      { x: 380 + Math.random() * 40, vertical: true },
    ];

    // Spawn initial radars + SAM sites
    this.radarCones = [];
    this.samSites = [];

    // Spawn 3 radars that appear during sea phase
    this._spawnTopDownRadars(3);
    // Spawn 2 SAM sites
    this._spawnTopDownSAMs(2);

    this.instrText.setText('ARROWS to move — Avoid radar zones — C for chaff');
    this.instrText.setColor('#666666');

    this.ambientRef = SoundManager.get().playB2Engine();
  }

  _spawnTopDownRadars(count) {
    for (let i = 0; i < count; i++) {
      const rx = 80 + Math.random() * (W - 160);
      const ry = -50 - Math.random() * 200;  // spawn above screen, will scroll down
      this.radarCones.push({
        x: rx, y: ry,
        angle: Math.random() * Math.PI * 2,
        sweepSpeed: 1.2 + Math.random() * 0.8,
        range: 100 + Math.random() * 60,
        detecting: false,
      });
    }
  }

  _spawnTopDownSAMs(count) {
    for (let i = 0; i < count; i++) {
      const spacing = (W - 200) / (count + 1);
      const sx = 100 + spacing * (i + 1) + (Math.random() - 0.5) * 60;
      const sy = -80 - Math.random() * 200;
      this.samSites.push({
        x: sx, y: sy,
        cooldown: 5 + Math.random() * 2,
        timer: i * 2.5,
        active: true,
        telegraphing: false,
      });
    }
  }

  _updateFlight(dt) {
    this.phaseTimer += dt;
    const t = this.phaseTimer;

    // Player movement (top-down: all 4 directions)
    if (this.keys.left.isDown) this.jetX -= B2_MOVE_SPEED * dt;
    if (this.keys.right.isDown) this.jetX += B2_MOVE_SPEED * dt;
    if (this.keys.up.isDown) this.jetY -= B2_MOVE_SPEED * dt;
    if (this.keys.down.isDown) this.jetY += B2_MOVE_SPEED * dt;

    // Clamp to screen
    this.jetX = Phaser.Math.Clamp(this.jetX, B2_MARGIN, W - B2_MARGIN);
    this.jetY = Phaser.Math.Clamp(this.jetY, B2_MARGIN + 40, H - B2_MARGIN);

    // Visual bank angle when moving left/right
    if (this.keys.left.isDown) this.jetBankAngle += (-1 - this.jetBankAngle) * 5 * dt;
    else if (this.keys.right.isDown) this.jetBankAngle += (1 - this.jetBankAngle) * 5 * dt;
    else this.jetBankAngle += (0 - this.jetBankAngle) * 5 * dt;

    // Chaff
    if (Phaser.Input.Keyboard.JustDown(this.keys.c)) this._releaseChaff();

    // Scroll terrain downward
    this.terrainOffset += this.terrainSpeed * dt;

    // Scroll radars and SAMs downward
    for (const r of this.radarCones) {
      r.y += this.terrainSpeed * dt;
      r.angle += r.sweepSpeed * dt;
    }
    for (const sam of this.samSites) {
      sam.y += this.terrainSpeed * dt;
      sam.timer += dt;
    }

    // Remove off-screen radars/SAMs and spawn new ones
    this.radarCones = this.radarCones.filter(r => r.y < H + 100);
    this.samSites = this.samSites.filter(s => s.y < H + 100);

    // Spawn new radars/SAMs periodically
    if (t > 4 && Math.random() < 0.4 * dt) {
      this._spawnTopDownRadars(1);
    }
    if (t > 6 && Math.random() < 0.25 * dt) {
      this._spawnTopDownSAMs(1);
    }

    // Detection logic (radar proximity)
    this.detectionLevel = Math.max(0, this.detectionLevel - 8 * dt);
    for (const r of this.radarCones) {
      r.detecting = false;
      const dx = this.jetX - r.x;
      const dy = this.jetY - r.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx);
      const angleDiff = Math.abs(((angle - r.angle + Math.PI * 3) % (Math.PI * 2)) - Math.PI);
      const coneWidth = 0.5;
      if (dist < r.range && angleDiff < coneWidth) {
        this.detectionLevel += 25 * DifficultyManager.get().detectionMult() * dt;
        r.detecting = true;
      }
    }

    // SAM firing logic
    for (const sam of this.samSites) {
      if (sam.active && sam.y > 0 && sam.y < H && this.detectionLevel > 40
          && sam.timer >= sam.cooldown && !sam.telegraphing) {
        sam.telegraphing = true;
        const samFlash = this.add.circle(sam.x, sam.y, 15, 0xff0000, 0.5).setDepth(25);
        this.tweens.add({
          targets: samFlash, scale: 2.0, alpha: 0.8, duration: 200,
          yoyo: true, repeat: 2,
          onComplete: () => { if (samFlash.scene) samFlash.destroy(); },
        });
        this.time.delayedCall(1000, () => {
          sam.timer = 0;
          sam.telegraphing = false;
          if (this.phase === 'dead' || this.phase === 'victory') return;
          this._spawnTrackingMissile(sam.x, sam.y);
          SoundManager.get().playRadarAlert();
        });
      }
    }

    this.maxDetection = Math.max(this.maxDetection, this.detectionLevel);

    // Detection overload
    if (this.detectionLevel >= 100) {
      SoundManager.get().playRadarAlert();
      this.detectionLevel = 40;
      // Fire from nearest SAM
      let nearestSam = null;
      let nearDist = Infinity;
      for (const sam of this.samSites) {
        if (!sam.active || sam.y < 0 || sam.y > H) continue;
        const d = Phaser.Math.Distance.Between(sam.x, sam.y, this.jetX, this.jetY);
        if (d < nearDist) { nearDist = d; nearestSam = sam; }
      }
      if (nearestSam) this._spawnTrackingMissile(nearestSam.x, nearestSam.y);
      this._takeDamage();
    }

    // Terrain transition messages
    if (t >= 7 && t < 7.1) {
      this.instrText.setText('Crossing coastline — Entering hostile territory');
      this.instrText.setColor('#ffaa00');
    }
    if (t >= 12 && t < 12.1) {
      this.instrText.setText('Over enemy land — Heavy air defense ahead');
      this.instrText.setColor('#ff6666');
      // Spawn extra enemies for land phase
      this._spawnTopDownRadars(2);
      this._spawnTopDownSAMs(2);
    }

    // Distance HUD
    const distKm = Math.max(0, Math.round(200 * (1 - t / 20)));
    this.hudDist.setText(`TARGET: ${distKm} km`);

    // Detection bar visible during flight
    this.detBarBg.setVisible(true);
    this.detBarFill.setVisible(true);
    this.hudDetect.setVisible(true);

    this._updateMissiles(dt);

    // Transition to bombing at 20 seconds
    if (t >= 20) {
      this._stopAmbient();
      this._cleanupMissiles();
      this.radarCones = [];
      this.samSites = [];
      this._startBombing();
    }
  }

  _drawFlightTerrain(gfx, t) {
    gfx.clear();
    const offset = this.terrainOffset;

    // Determine terrain type based on phase timer
    if (t < 7) {
      // ── DARK BLUE WATER (sea at night) ──
      gfx.fillStyle(0x0a1628, 1);
      gfx.fillRect(0, 0, W, H);

      // Wave lines scrolling down (every 40px, with sine deformation)
      const waveOffset = offset % 40;
      for (let y = -40 + waveOffset; y < H + 40; y += 40) {
        gfx.lineStyle(1, 0x1a2a48, 0.3);
        // Draw wave as series of short segments
        for (let x = 0; x < W; x += 8) {
          const wy = y + Math.sin(x * 0.04 + t * 1.5) * 3;
          const wy2 = y + Math.sin((x + 8) * 0.04 + t * 1.5) * 3;
          gfx.lineBetween(x, wy, x + 8, wy2);
        }
      }

      // Occasional whitecap foam
      const foamSeed = Math.floor(t * 2);
      for (let i = 0; i < 5; i++) {
        const fx = ((foamSeed * 137 + i * 257) % W);
        const fy = ((foamSeed * 89 + i * 311 + offset * 0.5) % (H + 100)) - 50;
        gfx.fillStyle(0x2a3a58, 0.2);
        gfx.fillCircle(fx, fy, 2);
      }

    } else if (t < 12) {
      // ── COASTLINE TRANSITION — land appears FROM TOP (plane flies toward it) ──
      const coastProgress = (t - 7) / 5;  // 0 to 1

      // Land portion at TOP (growing downward — plane approaches from below)
      const landH = H * coastProgress;
      gfx.fillStyle(0x2a1e10, 1);
      gfx.fillRect(0, 0, W, landH);

      // Some vegetation dots on land
      if (coastProgress > 0.2) {
        for (let i = 0; i < 10; i++) {
          const vx = (i * 127 + Math.floor(offset * 0.1)) % W;
          const vy = ((i * 89 + Math.floor(offset * 0.3)) % Math.max(1, landH));
          if (vy < landH) {
            gfx.fillStyle(0x1a3a1a, 0.4);
            gfx.fillCircle(vx, vy, 3 + (i % 3));
          }
        }
      }

      // Beach strip (between land and water)
      const beachY = landH;
      const beachH = 20 + coastProgress * 15;
      gfx.fillStyle(0x8a7a5a, 0.8);
      gfx.fillRect(0, beachY, W, beachH);

      // Water portion at BOTTOM (shrinking — plane has passed over it)
      const waterTop = beachY + beachH;
      gfx.fillStyle(0x0a1628, 1);
      gfx.fillRect(0, waterTop, W, H - waterTop);
      // Waves in water
      const waveOffset = offset % 40;
      for (let y = waterTop; y < H + 40; y += 40) {
        gfx.lineStyle(1, 0x1a2a48, 0.3);
        for (let x = 0; x < W; x += 8) {
          const wy = y + Math.sin(x * 0.04 + t * 1.5) * 3;
          const wy2 = y + Math.sin((x + 8) * 0.04 + t * 1.5) * 3;
          gfx.lineBetween(x, wy, x + 8, wy2);
        }
      }

    } else {
      // ── LAND (desert/brown with roads and buildings) ──
      gfx.fillStyle(0x2a1e10, 1);
      gfx.fillRect(0, 0, W, H);

      // Roads (vertical lines scrolling down)
      const roadOffset = offset % H;
      for (const road of this.flightRoads) {
        gfx.lineStyle(3, 0x3a3a3a, 0.5);
        gfx.lineBetween(road.x, 0, road.x, H);
        // Road dashes
        gfx.lineStyle(1, 0x555555, 0.3);
        const dashOff = roadOffset % 20;
        for (let y = -20 + dashOff; y < H; y += 20) {
          gfx.lineBetween(road.x, y, road.x, y + 10);
        }
      }

      // Small buildings (from above — tiny squares scrolling down)
      for (const b of this.flightBuildings) {
        const by = ((b.yBase + offset) % (H + 200)) - 100;
        if (by > -20 && by < H + 20) {
          gfx.fillStyle(b.color, 0.6);
          gfx.fillRect(b.x, by, b.w, b.h);
          // Shadow
          gfx.fillStyle(0x000000, 0.15);
          gfx.fillRect(b.x + 2, by + 2, b.w, b.h);
        }
      }

      // Horizontal roads (sparse)
      gfx.lineStyle(2, 0x3a3a3a, 0.3);
      const hRoadOff = offset % 300;
      for (let y = -300 + hRoadOff; y < H + 50; y += 300) {
        gfx.lineBetween(0, y, W, y);
      }
    }
  }

  _drawFlightOverlay(gfx) {
    gfx.clear();

    // Draw radar sweep circles (top-down — green circles from above)
    for (const r of this.radarCones) {
      if (r.y < -50 || r.y > H + 50) continue;

      const detecting = r.detecting;
      const color = detecting ? 0xff4400 : 0x00ff00;
      const baseAlpha = detecting ? 0.15 : 0.06;

      // Radar sweep cone (pie slice)
      const a = r.angle;
      const hw = 0.5;  // half-width of cone
      gfx.fillStyle(color, baseAlpha);
      gfx.beginPath();
      gfx.moveTo(r.x, r.y);
      gfx.lineTo(r.x + Math.cos(a - hw) * r.range, r.y + Math.sin(a - hw) * r.range);
      gfx.lineTo(r.x + Math.cos(a) * r.range, r.y + Math.sin(a) * r.range);
      gfx.lineTo(r.x + Math.cos(a + hw) * r.range, r.y + Math.sin(a + hw) * r.range);
      gfx.closePath();
      gfx.fillPath();

      // Sweep line
      gfx.lineStyle(1, color, detecting ? 0.6 : 0.3);
      gfx.lineBetween(r.x, r.y, r.x + Math.cos(a) * r.range, r.y + Math.sin(a) * r.range);

      // Radar dish dot
      gfx.fillStyle(color, 0.5);
      gfx.fillCircle(r.x, r.y, 4);

      // Range circle (faint)
      gfx.lineStyle(0.5, color, 0.1);
      gfx.strokeCircle(r.x, r.y, r.range);

      if (detecting) {
        const pulseR = 8 + Math.sin(this.phaseTimer * 10) * 3;
        gfx.lineStyle(1, 0xff0000, 0.4);
        gfx.strokeCircle(r.x, r.y, pulseR);
      }
    }

    // Draw SAM site markers
    for (const sam of this.samSites) {
      if (sam.y < -20 || sam.y > H + 20) continue;
      const isTelegraphing = sam.telegraphing;
      const alertLevel = isTelegraphing ? 0.9 : (this.detectionLevel > 40 ? 0.6 : 0.3);
      const samColor = isTelegraphing ? 0xff0000 : (this.detectionLevel > 40 ? 0xff4444 : 0x888888);

      const pulseScale = isTelegraphing ? 1.5 + Math.sin(this.phaseTimer * 15) * 0.5 : 1;
      gfx.fillStyle(samColor, alertLevel);
      gfx.beginPath();
      gfx.moveTo(sam.x, sam.y - 8 * pulseScale);
      gfx.lineTo(sam.x - 5 * pulseScale, sam.y + 4 * pulseScale);
      gfx.lineTo(sam.x + 5 * pulseScale, sam.y + 4 * pulseScale);
      gfx.closePath();
      gfx.fillPath();

      if (this.detectionLevel > 40 || isTelegraphing) {
        const ringSpeed = isTelegraphing ? 12 : 6;
        const ringAlpha = isTelegraphing ? 0.6 : 0.3;
        const pr = (isTelegraphing ? 10 : 6) + Math.sin(this.phaseTimer * ringSpeed) * 3;
        gfx.lineStyle(isTelegraphing ? 2 : 1, 0xff0000, ringAlpha);
        gfx.strokeCircle(sam.x, sam.y, pr);
      }
    }
  }

  // ═════════════════════════════════════════════════════════════
  // PHASE: BOMBING (attack run on mountain) — ~15 seconds
  // Mountain appears at top, scrolls down as B-2 approaches
  // ═════════════════════════════════════════════════════════════
  // PHASE: BOMBING — LOCKED SCREEN BOUNCE MECHANIC
  // Mountain fixed in center. B-2 bounces top↔bottom, dropping bombs each pass.
  // ═════════════════════════════════════════════════════════════
  _startBombing() {
    this.phase = 'bombing';
    MusicManager.get().playLevel5Music('bombing');
    this.phaseTimer = 0;
    this.bombObjects = [];
    this.missileSpawnTimer = 0;
    this.bombingEnded = false;
    this.bombCooldown = 0;
    this.terrainSpeed = 0;  // terrain is LOCKED (no scrolling)
    this.terrainOffset = 0;

    // Mountain fixed at center of screen
    this._mtnCenterX = W / 2;
    this._mtnTargetY = H * 0.35;  // fixed position — upper third
    this._mtnBunkerHit = false;

    // Mountain layer health
    this.mountainHP = MOUNTAIN_LAYERS;
    this.mountainLayerHP = [];
    for (let i = 0; i < MOUNTAIN_LAYERS; i++) {
      this.mountainLayerHP.push(true);
    }

    // B-2 starts at bottom, flying UP toward mountain
    this.jetX = W / 2;
    this.jetY = H - 60;
    this.jetBankAngle = 0;
    this._bombingDir = -1;  // -1 = flying up, +1 = flying down
    this._bombingSpeed = 250;  // B-2 vertical speed
    this._passCount = 0;

    this.instrText.setText('B-2 approaches — SPACE to drop bomb as you pass over target!');
    this.instrText.setColor('#ff8800');

    this.detBarBg.setVisible(false);
    this.detBarFill.setVisible(false);
    this.hudDetect.setVisible(false);

    this.ambientRef = SoundManager.get().playB2Engine();
  }

  _updateBombing(dt) {
    this.phaseTimer += dt;

    // Horizontal movement (player controls left/right aiming)
    if (this.keys.left.isDown) this.jetX -= B2_MOVE_SPEED * dt;
    if (this.keys.right.isDown) this.jetX += B2_MOVE_SPEED * dt;
    this.jetX = Phaser.Math.Clamp(this.jetX, B2_MARGIN, W - B2_MARGIN);

    // Bank animation
    if (this.keys.left.isDown) this.jetBankAngle += (-1 - this.jetBankAngle) * 5 * dt;
    else if (this.keys.right.isDown) this.jetBankAngle += (1 - this.jetBankAngle) * 5 * dt;
    else this.jetBankAngle += (0 - this.jetBankAngle) * 5 * dt;

    // B-2 moves vertically automatically (bouncing)
    this.jetY += this._bombingDir * this._bombingSpeed * dt;

    // BOUNCE at screen edges
    if (this.jetY < 40) {
      this.jetY = 40;
      this._bombingDir = 1;  // now flying down
      this._passCount++;
      this._bombingSpeed = Math.min(350, this._bombingSpeed + 15);  // slightly faster each pass
      SoundManager.get().playAfterburner();
      this.cameras.main.shake(200, 0.005);
    }
    if (this.jetY > H - 40) {
      this.jetY = H - 40;
      this._bombingDir = -1;  // now flying up
      this._passCount++;
      this._bombingSpeed = Math.min(350, this._bombingSpeed + 15);
      SoundManager.get().playAfterburner();
      this.cameras.main.shake(200, 0.005);
    }

    // Chaff
    if (Phaser.Input.Keyboard.JustDown(this.keys.c)) this._releaseChaff();

    // Bomb cooldown
    if (this.bombCooldown > 0) this.bombCooldown -= dt;

    // Drop bomb (flies in the direction the B-2 is moving)
    if (Phaser.Input.Keyboard.JustDown(this.keys.space) && this.busters > 0 && this.bombCooldown <= 0) {
      this._dropBusterTopDown();
      this.bombCooldown = 0.6;
    }

    this._updateBustersTopDown(dt);

    // Mountain turret missiles (every 4 seconds)
    this.missileSpawnTimer += dt;
    if (this.missileSpawnTimer >= 4) {
      this.missileSpawnTimer = 0;
      const side = (this._passCount % 2 === 0) ? -1 : 1;
      this._spawnTrackingMissile(
        this._mtnCenterX + side * 60,
        this._mtnTargetY
      );
    }
    this._updateMissiles(dt);

    // HUD
    this.hudDist.setText(`LAYERS: ${this.mountainHP}/${MOUNTAIN_LAYERS} | PASS: ${this._passCount + 1}`);

    // WIN — all layers destroyed
    if (this.mountainHP <= 0 && !this._mtnBunkerHit) {
      this._mtnBunkerHit = true;
      this._stopAmbient();
      this._startMountainExplosion();
      return;
    }

    // OUT OF BOMBS — fail to escape
    if (this.busters <= 0 && this.bombObjects.length === 0 && !this.bombingEnded && this.mountainHP > 0) {
      this.bombingEnded = true;
      this.instrText.setText('OUT OF ORDNANCE — RETREAT');
      this.instrText.setColor('#ff4444');
      this._stopAmbient();
      this.time.delayedCall(1500, () => this._startEscape());
    }
  }

  _dropBusterTopDown() {
    this.busters--;
    this.bustersUsed++;
    SoundManager.get().playBunkerBusterDrop();

    // Bomb drops in the direction the B-2 is currently moving
    const dir = this._bombingDir || -1;
    const bombStartY = this.jetY + dir * 20;
    const bomb = this.add.rectangle(this.jetX, bombStartY, 4, 12, 0x4a4a52).setDepth(9);
    const bombNose = this.add.circle(this.jetX, bombStartY + dir * 6, 2, 0x3a3a42).setDepth(9);
    this.bombObjects.push({
      sprite: bomb, nose: bombNose,
      x: this.jetX, y: bombStartY,
      vy: dir * 320,  // moves in the direction of flight
      vx: (Math.random() - 0.5) * 10,
    });
  }

  _updateBustersTopDown(dt) {
    const mtnY = this._mtnTargetY;
    const mtnCX = this._mtnCenterX;
    const mtnRadius = 80;  // mountain hit radius
    const layerH = 16;     // visual layer height on screen

    for (let i = this.bombObjects.length - 1; i >= 0; i--) {
      const b = this.bombObjects[i];
      b.y += b.vy * dt;
      b.x += b.vx * dt;
      b.sprite.setPosition(b.x, b.y);
      b.nose.setPosition(b.x, b.y - 6);

      // Check mountain hit (when bomb reaches mountain Y range)
      const bombToMtn = Phaser.Math.Distance.Between(b.x, b.y, mtnCX, mtnY);
      if (bombToMtn < mtnRadius && b.y < mtnY + 40) {
        const centerDist = Math.abs(b.x - mtnCX);
        const penetration = centerDist < 25 ? 2 : 1;

        SoundManager.get().playBunkerBusterImpact();
        this.cameras.main.shake(400, 0.03);

        for (let p = 0; p < penetration && this.mountainHP > 0; p++) {
          const layerIdx = MOUNTAIN_LAYERS - this.mountainHP;
          if (layerIdx < MOUNTAIN_LAYERS && this.mountainLayerHP[layerIdx]) {
            this.mountainLayerHP[layerIdx] = false;
            this.mountainHP--;

            const msg = penetration >= 2 && p === 0 ? 'DIRECT HIT — 2 LAYERS!' : `LAYER ${layerIdx + 1} PENETRATED`;
            const pts = this.add.text(b.x, b.y - 20 - p * 20, msg, {
              fontFamily: 'monospace', fontSize: '11px', color: '#00ff00',
            }).setOrigin(0.5).setDepth(20);
            this.tweens.add({
              targets: pts, y: b.y - 60, alpha: 0, duration: 1200,
              onComplete: () => pts.destroy(),
            });
          }
        }

        this._addExplosion(b.x, b.y, 25, 0xff8800);
        b.sprite.destroy(); b.nose.destroy();
        this.bombObjects.splice(i, 1);
        continue;
      }

      // Off screen (missed)
      if (b.y < -50 || b.x < -30 || b.x > W + 30) {
        this._addExplosion(b.x, Math.max(10, b.y), 15, 0xff6600);
        b.sprite.destroy(); b.nose.destroy();
        this.bombObjects.splice(i, 1);
      }
    }
  }

  _drawBombingTerrain(gfx, t) {
    gfx.clear();
    const offset = this.terrainOffset;

    // Desert/brown land as base
    gfx.fillStyle(0x2a1e10, 1);
    gfx.fillRect(0, 0, W, H);

    // Roads
    const roadOffset = offset % H;
    for (const road of this.flightRoads) {
      gfx.lineStyle(3, 0x3a3a3a, 0.5);
      gfx.lineBetween(road.x, 0, road.x, H);
      gfx.lineStyle(1, 0x555555, 0.3);
      const dashOff = roadOffset % 20;
      for (let y = -20 + dashOff; y < H; y += 20) {
        gfx.lineBetween(road.x, y, road.x, y + 10);
      }
    }

    // Buildings
    for (const b of this.flightBuildings) {
      const by = ((b.yBase + offset) % (H + 200)) - 100;
      if (by > -20 && by < H + 20) {
        gfx.fillStyle(b.color, 0.6);
        gfx.fillRect(b.x, by, b.w, b.h);
      }
    }

    // ── Mountain (from above) ──
    const mtnCX = this._mtnCenterX;
    const mtnY = this._mtnTargetY;

    if (mtnY > -200 && mtnY < H + 100) {
      // Outer mountain mass (irregular brown-green shape)
      gfx.fillStyle(0x3a2a18, 0.9);
      gfx.beginPath();
      gfx.moveTo(mtnCX, mtnY - 90);
      gfx.lineTo(mtnCX + 50, mtnY - 80);
      gfx.lineTo(mtnCX + 90, mtnY - 40);
      gfx.lineTo(mtnCX + 100, mtnY + 10);
      gfx.lineTo(mtnCX + 80, mtnY + 60);
      gfx.lineTo(mtnCX + 40, mtnY + 80);
      gfx.lineTo(mtnCX - 30, mtnY + 85);
      gfx.lineTo(mtnCX - 70, mtnY + 60);
      gfx.lineTo(mtnCX - 95, mtnY + 10);
      gfx.lineTo(mtnCX - 85, mtnY - 50);
      gfx.lineTo(mtnCX - 40, mtnY - 80);
      gfx.closePath();
      gfx.fill();

      // Inner ridge contour
      gfx.fillStyle(0x4a3a20, 0.7);
      gfx.beginPath();
      gfx.moveTo(mtnCX, mtnY - 60);
      gfx.lineTo(mtnCX + 50, mtnY - 30);
      gfx.lineTo(mtnCX + 60, mtnY + 20);
      gfx.lineTo(mtnCX + 30, mtnY + 50);
      gfx.lineTo(mtnCX - 25, mtnY + 55);
      gfx.lineTo(mtnCX - 55, mtnY + 20);
      gfx.lineTo(mtnCX - 45, mtnY - 35);
      gfx.closePath();
      gfx.fill();

      // Green vegetation patches
      gfx.fillStyle(0x2a3a1a, 0.4);
      gfx.fillCircle(mtnCX - 40, mtnY + 20, 20);
      gfx.fillCircle(mtnCX + 35, mtnY - 15, 15);
      gfx.fillCircle(mtnCX + 10, mtnY + 40, 18);

      // Bunker entrance (dark square at center)
      const bunkerSize = 20;
      gfx.fillStyle(0x0a0a0a, 0.9);
      gfx.fillRect(mtnCX - bunkerSize / 2, mtnY - bunkerSize / 2, bunkerSize, bunkerSize);
      // Bunker outline
      gfx.lineStyle(2, 0x555555, 0.6);
      gfx.strokeRect(mtnCX - bunkerSize / 2, mtnY - bunkerSize / 2, bunkerSize, bunkerSize);

      // Fortification ring around bunker
      gfx.lineStyle(1.5, 0x666666, 0.4);
      gfx.strokeCircle(mtnCX, mtnY, 30);
      // Inner ring
      gfx.lineStyle(1, 0x888888, 0.3);
      gfx.strokeCircle(mtnCX, mtnY, 18);

      // Layer indicators (rings around mountain showing remaining layers)
      for (let i = 0; i < MOUNTAIN_LAYERS; i++) {
        if (this.mountainLayerHP[i]) {
          const layerR = 35 + i * 12;
          const layerAlpha = 0.3 - i * 0.04;
          gfx.lineStyle(2, 0x8a6a3a, layerAlpha);
          gfx.strokeCircle(mtnCX, mtnY, layerR);
        } else {
          // Destroyed layer: show as cracked/broken ring
          const layerR = 35 + i * 12;
          gfx.lineStyle(1, 0xff4400, 0.2);
          // Draw partial arcs to show destruction
          for (let a = 0; a < Math.PI * 2; a += 0.8) {
            const x1 = mtnCX + Math.cos(a) * layerR;
            const y1 = mtnY + Math.sin(a) * layerR;
            const x2 = mtnCX + Math.cos(a + 0.3) * layerR;
            const y2 = mtnY + Math.sin(a + 0.3) * layerR;
            gfx.lineBetween(x1, y1, x2, y2);
          }
        }
      }

      // "Supreme Turban" label near bunker when visible
      if (mtnY > 40 && mtnY < H - 40) {
        // Pulsing target reticle
        const reticleAlpha = 0.3 + Math.sin(t * 4) * 0.15;
        gfx.lineStyle(1, 0xff0000, reticleAlpha);
        gfx.strokeCircle(mtnCX, mtnY, 12 + Math.sin(t * 3) * 3);
        // Crosshair
        gfx.lineBetween(mtnCX - 18, mtnY, mtnCX - 8, mtnY);
        gfx.lineBetween(mtnCX + 8, mtnY, mtnCX + 18, mtnY);
        gfx.lineBetween(mtnCX, mtnY - 18, mtnCX, mtnY - 8);
        gfx.lineBetween(mtnCX, mtnY + 8, mtnCX, mtnY + 18);
      }
    }
  }

  // ═════════════════════════════════════════════════════════════
  // MOUNTAIN EXPLOSION (top-down version)
  // ═════════════════════════════════════════════════════════════
  _startMountainExplosion() {
    this.phase = 'explosion';
    this.instrText.setText('');
    this._cleanupMissiles();

    const explosionObjects = [];
    const mtnCX = this._mtnCenterX;
    const mtnY = this._mtnTargetY;

    // PHASE 1: White flash
    this.cameras.main.flash(300, 255, 255, 255);
    const whiteFlash = this.add.rectangle(W / 2, H / 2, W, H, 0xffffff, 1.0).setDepth(50);
    explosionObjects.push(whiteFlash);
    this.tweens.add({
      targets: whiteFlash, alpha: 0, duration: 300,
      onComplete: () => whiteFlash.destroy(),
    });
    this.cameras.main.shake(12000, 0.05);
    SoundManager.get().playNuclearExplosion();

    // PHASE 2: Fireball erupting from mountain
    this.time.delayedCall(300, () => {
      for (let i = 0; i < 5; i++) {
        this.time.delayedCall(i * 200, () => {
          const ringR = 15 + i * 12;
          const coreHot = this.add.circle(mtnCX, mtnY, ringR, 0xffffcc, 0.9).setDepth(18);
          explosionObjects.push(coreHot);
          this.tweens.add({
            targets: coreHot, scaleX: 4, scaleY: 4, alpha: 0, duration: 1200,
            onComplete: () => coreHot.destroy(),
          });

          const fireRing = this.add.circle(mtnCX, mtnY, ringR + 10, 0xff4400, 0.7).setDepth(17);
          explosionObjects.push(fireRing);
          this.tweens.add({
            targets: fireRing, scaleX: 3.5, scaleY: 3.5, alpha: 0.1, duration: 1600,
            onComplete: () => fireRing.destroy(),
          });
        });
      }

      // Central massive fireball
      const centralFire = this.add.circle(mtnCX, mtnY, 40, 0xff6600, 0.9).setDepth(17);
      explosionObjects.push(centralFire);
      this.tweens.add({
        targets: centralFire, scaleX: 5, scaleY: 5, alpha: 0.2, duration: 2000,
        onComplete: () => centralFire.destroy(),
      });

      SoundManager.get().playExplosion();
    });

    // PHASE 3: Cracks radiating outward
    this.time.delayedCall(2300, () => {
      const crackGfx = this.add.graphics().setDepth(18);
      explosionObjects.push(crackGfx);

      const crackCount = 12;
      const crackData = [];
      for (let i = 0; i < crackCount; i++) {
        const angle = (i / crackCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
        const len = 60 + Math.random() * 80;
        const segments = [{ x: mtnCX, y: mtnY }];
        let px = mtnCX, py = mtnY;
        for (let s = 0; s < 6; s++) {
          px += Math.cos(angle) * len / 6 + (Math.random() - 0.5) * 14;
          py += Math.sin(angle) * len / 6 + (Math.random() - 0.5) * 14;
          segments.push({ x: px, y: py });
        }
        crackData.push(segments);
      }

      // Glow pass
      crackGfx.lineStyle(5, 0xff6600, 0.35);
      for (const segs of crackData) {
        crackGfx.beginPath();
        crackGfx.moveTo(segs[0].x, segs[0].y);
        for (let s = 1; s < segs.length; s++) crackGfx.lineTo(segs[s].x, segs[s].y);
        crackGfx.strokePath();
      }
      // Core crack
      crackGfx.lineStyle(2, 0xffaa44, 0.7);
      for (const segs of crackData) {
        crackGfx.beginPath();
        crackGfx.moveTo(segs[0].x, segs[0].y);
        for (let s = 1; s < segs.length; s++) crackGfx.lineTo(segs[s].x, segs[s].y);
        crackGfx.strokePath();
      }
      // White-hot inner
      crackGfx.lineStyle(0.8, 0xffeecc, 0.6);
      for (const segs of crackData) {
        crackGfx.beginPath();
        crackGfx.moveTo(segs[0].x, segs[0].y);
        for (let s = 1; s < segs.length; s++) crackGfx.lineTo(segs[s].x, segs[s].y);
        crackGfx.strokePath();
      }

      // Glow at crack endpoints
      for (const segs of crackData) {
        const endPt = segs[segs.length - 1];
        const glowCirc = this.add.circle(endPt.x, endPt.y, 6, 0xff4400, 0.5).setDepth(17);
        explosionObjects.push(glowCirc);
        this.tweens.add({
          targets: glowCirc, scaleX: 2, scaleY: 2, alpha: 0.15,
          duration: 800 + Math.random() * 400, yoyo: true, repeat: 1,
          onComplete: () => glowCirc.destroy(),
        });
      }

      this.time.delayedCall(2000, () => {
        this.tweens.add({
          targets: crackGfx, alpha: 0, duration: 800,
          onComplete: () => crackGfx.destroy(),
        });
      });

      SoundManager.get().playBunkerBusterImpact();
      this.cameras.main.shake(2000, 0.04);
    });

    // PHASE 4: Debris
    this.time.delayedCall(4300, () => {
      this.cameras.main.shake(2500, 0.06);
      SoundManager.get().playExplosion();

      const debrisCount = 25 + Math.floor(Math.random() * 10);
      for (let i = 0; i < debrisCount; i++) {
        this.time.delayedCall(i * 60, () => {
          const dx = mtnCX + (Math.random() - 0.5) * 160;
          const dy = mtnY + (Math.random() - 0.5) * 80;
          const size = 3 + Math.random() * 10;
          const colors = [0x3a3428, 0x4a4a4a, 0x2a2820, 0x555544];
          const color = colors[Math.floor(Math.random() * colors.length)];
          const debris = this.add.rectangle(dx, dy, size, size * 0.6, color, 0.85).setDepth(19);
          explosionObjects.push(debris);
          const angle = Math.random() * Math.PI * 2;
          const dist = 100 + Math.random() * 120;
          this.tweens.add({
            targets: debris,
            x: dx + Math.cos(angle) * dist,
            y: dy + Math.sin(angle) * dist,
            rotation: (Math.random() - 0.5) * 6, alpha: 0,
            duration: 1200 + Math.random() * 1200, ease: 'Quad.easeIn',
            onComplete: () => debris.destroy(),
          });
        });
      }

      // Dust clouds expanding outward
      for (let i = 0; i < 4; i++) {
        const angle = i * Math.PI / 2 + Math.random() * 0.5;
        const dustCloud = this.add.ellipse(
          mtnCX + Math.cos(angle) * 20, mtnY + Math.sin(angle) * 20,
          40, 25, 0x888877, 0.4
        ).setDepth(15);
        explosionObjects.push(dustCloud);
        this.tweens.add({
          targets: dustCloud,
          x: mtnCX + Math.cos(angle) * 150,
          y: mtnY + Math.sin(angle) * 150,
          scaleX: 3, scaleY: 3, alpha: 0,
          duration: 2500, ease: 'Quad.easeOut',
          onComplete: () => dustCloud.destroy(),
        });
      }
    });

    // PHASE 5: Smoke column (expanding dark circles)
    this.time.delayedCall(6300, () => {
      // Expanding smoke circles from center
      for (let i = 0; i < 8; i++) {
        const smokeR = 20 + i * 8;
        const gray = 0x50 + i * 5;
        const smokeColor = Phaser.Display.Color.GetColor(gray, gray - 5, gray - 10);
        const smokeCirc = this.add.circle(
          mtnCX + (Math.random() - 0.5) * 10,
          mtnY + (Math.random() - 0.5) * 10,
          smokeR, smokeColor, 0.4
        ).setDepth(14);
        explosionObjects.push(smokeCirc);
        this.tweens.add({
          targets: smokeCirc,
          scaleX: 3 + i * 0.3, scaleY: 3 + i * 0.3,
          alpha: 0.05, duration: 3000 + i * 100,
          onComplete: () => smokeCirc.destroy(),
        });
      }

      // Inner orange glow
      const innerGlow = this.add.circle(mtnCX, mtnY, 30, 0xff6600, 0.3).setDepth(15);
      explosionObjects.push(innerGlow);
      this.tweens.add({
        targets: innerGlow, scaleX: 4, scaleY: 4, alpha: 0.5,
        duration: 1500, yoyo: true, repeat: 1,
        onComplete: () => {
          this.tweens.add({
            targets: innerGlow, alpha: 0, duration: 800,
            onComplete: () => innerGlow.destroy(),
          });
        },
      });

      // Embers
      for (let e = 0; e < 20; e++) {
        this.time.delayedCall(e * 80, () => {
          const ex = mtnCX + (Math.random() - 0.5) * 60;
          const ey = mtnY + (Math.random() - 0.5) * 60;
          const isEmber = Math.random() < 0.4;
          const particle = this.add.circle(
            ex, ey, isEmber ? 1.5 : 1,
            isEmber ? 0xff4400 : 0x999988,
            isEmber ? 0.7 : 0.4
          ).setDepth(16);
          explosionObjects.push(particle);
          const pAngle = Math.random() * Math.PI * 2;
          this.tweens.add({
            targets: particle,
            x: ex + Math.cos(pAngle) * (60 + Math.random() * 40),
            y: ey + Math.sin(pAngle) * (60 + Math.random() * 40),
            alpha: 0, duration: 2000 + Math.random() * 1500,
            onComplete: () => particle.destroy(),
          });
        });
      }

      SoundManager.get().playBunkerBusterImpact();
    });

    // AFTERMATH: Text + transition
    this.time.delayedCall(9500, () => {
      const txt = this.add.text(W / 2, 50, 'NATANZ FACILITY -- DESTROYED', {
        fontFamily: 'monospace', fontSize: '24px', color: '#00ff00',
        shadow: { offsetX: 0, offsetY: 0, color: '#00ff00', blur: 16, fill: true },
      }).setOrigin(0.5).setDepth(25);
      this.tweens.add({
        targets: txt, alpha: 0.4, duration: 500, yoyo: true, repeat: 3,
        onComplete: () => {
          txt.destroy();
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
  // PHASE: ESCAPE — ~10 seconds
  // B-2 turns around, flies back (downward on screen).
  // Terrain scrolls upward (reversing).
  // ═════════════════════════════════════════════════════════════
  // ═════════════════════════════════════════════════════════════
  // ESCAPE — CINEMATIC VICTORY RETURN
  // B-2 flies low over water, banked, wings almost touching — pure style
  // No player control — auto-cinematic → victory
  // ═════════════════════════════════════════════════════════════
  _startEscape() {
    this.phase = 'escape';
    MusicManager.get().playLevel5Music('escape');
    this.phaseTimer = 0;
    this.escapeTimer = 0;
    this._cleanupMissiles();
    this._escapeFlipped = false;

    // B-2 starts at right side, flies LEFT across screen — banked low over water
    this._escB2X = W + 80;
    this._escB2Y = H * 0.55;
    this._escBank = -0.7;  // permanent bank angle (wings almost touching water)
    this._escSpeed = 220;

    // Hide all HUD
    this._setHUDVisible(false);
    this.instrText.setVisible(false);

    // Explosion glow fading behind
    this.escapeGlow = this.add.circle(W + 100, H * 0.3, 120, 0xff4400, 0.4).setDepth(0);
    this.tweens.add({
      targets: this.escapeGlow, x: W + 300, alpha: 0.05, scaleX: 0.3, scaleY: 0.3,
      duration: 8000,
    });

    // "MISSION COMPLETE" text fades in
    this._escTitle = this.add.text(W / 2, H * 0.2, 'TARGET DESTROYED', {
      fontFamily: 'monospace', fontSize: '28px', color: '#FFD700',
      shadow: { offsetX: 0, offsetY: 0, color: '#FFD700', blur: 12, fill: true },
    }).setOrigin(0.5).setDepth(40).setAlpha(0);
    this.tweens.add({ targets: this._escTitle, alpha: 1, duration: 2000 });

    this._escSub = this.add.text(W / 2, H * 0.3, 'Returning to base...', {
      fontFamily: 'monospace', fontSize: '14px', color: '#aaaacc',
    }).setOrigin(0.5).setDepth(40).setAlpha(0);
    this.tweens.add({ targets: this._escSub, alpha: 0.8, duration: 2000, delay: 1000 });

    this.ambientRef = SoundManager.get().playB2Engine();
  }

  _updateEscape(dt) {
    this.phaseTimer += dt;
    this.escapeTimer += dt;

    // B-2 flies from right to left across screen (cinematic — no player control)
    this._escB2X -= this._escSpeed * dt;
    // Gentle vertical sine wave (bobbing over water)
    this._escB2Y = H * 0.55 + Math.sin(this.escapeTimer * 0.8) * 15;

    // Slowly reduce bank angle to level out near end
    if (this.escapeTimer > 5) {
      this._escBank += (0 - this._escBank) * 0.5 * dt;
    }

    // Terrain scrolls sideways (water)
    this.terrainOffset += this._escSpeed * dt;

    // Exit to victory
    if (this._escB2X < -120 || this.escapeTimer >= 8) {
      this.phase = 'complete';
      this._stopAmbient();
      if (this.escapeGlow) { this.escapeGlow.destroy(); this.escapeGlow = null; }
      if (this._escTitle) { this._escTitle.destroy(); this._escTitle = null; }
      if (this._escSub) { this._escSub.destroy(); this._escSub = null; }
      this.cameras.main.fadeOut(1500, 0, 0, 0);
      this.time.delayedCall(2000, () => this._showVictory());
    }
  }

  _drawEscapeTerrain(gfx, t) {
    gfx.clear();
    const offset = this.terrainOffset || 0;

    // Night ocean — dark blue with strong wave detail (low altitude = big waves)
    gfx.fillStyle(0x0a1628, 1);
    gfx.fillRect(0, 0, W, H);

    // Horizon line
    const horizonY = H * 0.38;
    gfx.lineStyle(1, 0x1a2a48, 0.4);
    gfx.lineBetween(0, horizonY, W, horizonY);

    // Sky gradient above horizon (subtle dark blue to black)
    gfx.fillStyle(0x060a14, 0.6);
    gfx.fillRect(0, 0, W, horizonY);

    // Stars in sky
    for (let i = 0; i < 20; i++) {
      const sx = (i * 137 + 50) % W;
      const sy = (i * 89 + 20) % Math.floor(horizonY - 10);
      const starAlpha = 0.3 + Math.sin(t * 2 + i) * 0.2;
      gfx.fillStyle(0xffffff, starAlpha);
      gfx.fillCircle(sx, sy, 0.8);
    }

    // Large ocean waves (close-up low altitude feel)
    const waveOffset = offset % 60;
    for (let y = horizonY; y < H + 60; y += 25) {
      const waveAlpha = 0.15 + (y - horizonY) / H * 0.2;  // brighter waves closer
      gfx.lineStyle(1.5, 0x2a4a6a, waveAlpha);
      for (let x = 0; x < W; x += 6) {
        const amp = 4 + (y - horizonY) * 0.02;
        const wy = y + waveOffset * ((y - horizonY) / H) + Math.sin(x * 0.03 + t * 1.2 + y * 0.1) * amp;
        const wy2 = y + waveOffset * ((y - horizonY) / H) + Math.sin((x + 6) * 0.03 + t * 1.2 + y * 0.1) * amp;
        gfx.lineBetween(x, wy, x + 6, wy2);
      }
    }

    // Moon/light reflection on water (long streak)
    const moonX = W * 0.7;
    gfx.fillStyle(0xaabbcc, 0.08);
    for (let y = horizonY + 10; y < H; y += 8) {
      const reflWidth = 3 + (y - horizonY) * 0.15;
      const reflX = moonX + Math.sin(y * 0.1 + t) * 5;
      gfx.fillRect(reflX - reflWidth / 2, y, reflWidth, 4);
    }
  }

  _drawEscapeB2(gfx, bx, by, bank) {
    // B-2 flying LEFT across screen, banked, wings almost touching water
    // Different angle than normal — side-ish view from behind, banked
    const bs = 1.2;  // slightly bigger for dramatic effect
    const bankFactor = bank || 0;

    // The wing shape is drawn as if seen from slightly behind and to the side
    // Bank angle tilts one wing up and one down
    const upWing = -bankFactor;  // positive bank = left wing up
    const downWing = bankFactor;

    gfx.fillStyle(0x3a3a3a, 1);
    gfx.beginPath();
    // Nose points LEFT (flying left)
    gfx.moveTo(bx - 25 * bs, by);                                    // nose (left)
    gfx.lineTo(bx + 10 * bs, by - (55 + upWing * 25) * bs);        // upper wing tip
    gfx.lineTo(bx + 18 * bs, by - (35 + upWing * 18) * bs);        // upper trailing
    gfx.lineTo(bx + 12 * bs, by);                                    // center rear
    gfx.lineTo(bx + 18 * bs, by + (35 + downWing * 18) * bs);      // lower trailing
    gfx.lineTo(bx + 10 * bs, by + (55 + downWing * 25) * bs);      // lower wing tip
    gfx.closePath();
    gfx.fill();

    // Darker inner surface
    gfx.fillStyle(0x2e2e2e, 0.5);
    gfx.beginPath();
    gfx.moveTo(bx - 18 * bs, by);
    gfx.lineTo(bx + 8 * bs, by - (30 + upWing * 12) * bs);
    gfx.lineTo(bx + 10 * bs, by);
    gfx.lineTo(bx + 8 * bs, by + (30 + downWing * 12) * bs);
    gfx.closePath();
    gfx.fill();

    // Leading edge highlight
    gfx.lineStyle(1 * bs, 0x5a5a5a, 0.5);
    gfx.beginPath();
    gfx.moveTo(bx + 9 * bs, by - (53 + upWing * 24) * bs);
    gfx.lineTo(bx - 24 * bs, by);
    gfx.lineTo(bx + 9 * bs, by + (53 + downWing * 24) * bs);
    gfx.strokePath();

    // Engine glow (at trailing edge, center)
    const engY1 = by - 8 * bs;
    const engY2 = by + 8 * bs;
    const engX = bx + 14 * bs;
    const pulse = Math.sin((this.phaseTimer || 0) * 10) * 0.2 + 0.8;
    gfx.fillStyle(0xff4400, 0.3 * pulse);
    gfx.fillCircle(engX, engY1, 5 * bs);
    gfx.fillCircle(engX, engY2, 5 * bs);
    gfx.fillStyle(0xff8800, 0.7 * pulse);
    gfx.fillCircle(engX, engY1, 2 * bs);
    gfx.fillCircle(engX, engY2, 2 * bs);

    // Water reflection/shadow below the lower wing tip
    if (downWing > 0) {
      const tipY = by + (55 + downWing * 25) * bs;
      const waterY = H * 0.55 + 40;
      if (tipY > waterY - 20) {
        // Wing almost touching water — spray effect!
        for (let i = 0; i < 4; i++) {
          const sx = bx + 10 * bs + Math.random() * 10;
          const sy = tipY + Math.random() * 8;
          gfx.fillStyle(0x4a6a8a, 0.3);
          gfx.fillCircle(sx, sy, 1.5 + Math.random() * 2);
        }
      }
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

    // P key — skip to victory (debug)
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
      case 'flight':
        this._updateFlight(dt);
        // Draw terrain
        this._drawFlightTerrain(this.terrainGfx, this.phaseTimer);
        // Draw radar/SAM overlay
        this._drawFlightOverlay(this.radarGfx);
        // Draw B-2
        this.b2Gfx.clear();
        this._drawB2(this.b2Gfx, this.jetX, this.jetY, 1, this.jetBankAngle);
        break;
      case 'bombing':
        this._updateBombing(dt);
        // Draw bombing terrain + mountain
        this._drawBombingTerrain(this.terrainGfx, this.phaseTimer);
        this.radarGfx.clear();
        // Draw B-2 — nose direction matches flight direction
        this.b2Gfx.clear();
        if (this._bombingDir > 0) {
          this._drawB2Escape(this.b2Gfx, this.jetX, this.jetY, 1, this.jetBankAngle);
        } else {
          this._drawB2(this.b2Gfx, this.jetX, this.jetY, 1, this.jetBankAngle);
        }
        break;
      case 'bounce':
        this._updateBounce(dt);
        // Draw land terrain during bounce
        this._drawBombingTerrain(this.terrainGfx, 0);
        this.radarGfx.clear();
        this.b2Gfx.clear();
        if (this._bounceFlipped) {
          this._drawB2(this.b2Gfx, this.jetX, this.jetY, 1, this.jetBankAngle);
        } else {
          this._drawB2Escape(this.b2Gfx, this.jetX, this.jetY, 1, this.jetBankAngle);
        }
        break;
      case 'escape':
        this._updateEscape(dt);
        // Draw cinematic ocean scene
        this._drawEscapeTerrain(this.terrainGfx, this.phaseTimer);
        this.radarGfx.clear();
        // Draw B-2 flying LEFT, banked, low over water
        this.b2Gfx.clear();
        this._drawEscapeB2(this.b2Gfx, this._escB2X, this._escB2Y, this._escBank);
        break;
      case 'explosion':
        // Terrain still visible during explosion
        if (this.terrainGfx) this._drawBombingTerrain(this.terrainGfx, this.phaseTimer);
        this.b2Gfx.clear();
        this.radarGfx.clear();
        break;
      case 'victory':
      case 'dead':
      case 'complete':
        this.b2Gfx.clear();
        this.radarGfx.clear();
        this.terrainGfx.clear();
        break;
    }

    // Shared updates (skip during takeoff)
    if (this.phase !== 'victory' && this.phase !== 'explosion' && this.phase !== 'takeoff'
        && this.phase !== 'dead' && this.phase !== 'complete') {
      this._updateExplosions(dt);
      this._updateHUD();
      this._updateEngineTrail(dt);
    }

    // Hide detection bar when not in flight phase
    if (this.phase !== 'flight') {
      if (this.detBarBg) this.detBarBg.setVisible(false);
      if (this.detBarFill) this.detBarFill.setVisible(false);
      if (this.hudDetect) this.hudDetect.setVisible(false);
    }
    // Hide distance when not in relevant phases
    if (!['flight', 'bombing', 'escape'].includes(this.phase)) {
      if (this.hudDist) this.hudDist.setText('');
    }
  }

  // B-2 drawn with nose pointing DOWN (escape — flying back)
  _drawB2Escape(gfx, bx, by, scale, bankAngle) {
    const bs = scale || 1;
    const bank = (bankAngle || 0) * 0.15;
    const t = this.phaseTimer || 0;

    // Nose points DOWN (mirror of normal)
    gfx.fillStyle(0x3a3a3a, 1);
    gfx.beginPath();
    gfx.moveTo(bx, by + 20 * bs);                                  // nose (bottom)
    gfx.lineTo(bx + (60 + bank * 10) * bs, by - 15 * bs);         // right wing tip
    gfx.lineTo(bx + (40 + bank * 6) * bs, by - 20 * bs);          // right trailing edge
    gfx.lineTo(bx, by - 10 * bs);                                  // center rear
    gfx.lineTo(bx - (40 - bank * 6) * bs, by - 20 * bs);          // left trailing edge
    gfx.lineTo(bx - (60 - bank * 10) * bs, by - 15 * bs);         // left wing tip
    gfx.closePath();
    gfx.fill();

    gfx.fillStyle(0x2e2e2e, 0.6);
    gfx.beginPath();
    gfx.moveTo(bx, by + 15 * bs);
    gfx.lineTo(bx + 35 * bs, by - 12 * bs);
    gfx.lineTo(bx, by - 8 * bs);
    gfx.lineTo(bx - 35 * bs, by - 12 * bs);
    gfx.closePath();
    gfx.fill();

    gfx.lineStyle(0.5 * bs, 0x555555, 0.5);
    gfx.lineBetween(bx, by + 18 * bs, bx, by - 8 * bs);
    gfx.lineBetween(bx - 20 * bs, by - 5 * bs, bx + 20 * bs, by - 5 * bs);

    gfx.lineStyle(1 * bs, 0x4a4a4a, 0.6);
    gfx.beginPath();
    gfx.moveTo(bx - (58 - bank * 8) * bs, by - 14 * bs);
    gfx.lineTo(bx, by + 19 * bs);
    gfx.lineTo(bx + (58 + bank * 8) * bs, by - 14 * bs);
    gfx.strokePath();

    // Engine glow (at the top now — trailing edge)
    const engLX = bx - 14 * bs;
    const engRX = bx + 14 * bs;
    const engY = by - 16 * bs;
    const pulse = Math.sin(t * 12) * 0.2 + 0.8;

    gfx.fillStyle(0xff4400, 0.25 * pulse);
    gfx.fillCircle(engLX, engY, 7 * bs);
    gfx.fillCircle(engRX, engY, 7 * bs);
    gfx.fillStyle(0xff8800, 0.7 * pulse);
    gfx.fillCircle(engLX, engY, 3 * bs);
    gfx.fillCircle(engRX, engY, 3 * bs);
  }

  shutdown() {
    if (this._endScreen) this._endScreen.destroy();
    this._stopAmbient();
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
