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
import InputManager from '../systems/InputManager.js';

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
    this.time.timeScale = 1; // reset in case a GameJuice freeze left it slowed
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
    this._maneuverSoundCD = 0;  // cooldown between maneuver sounds
    this._radarBlipCD = 0;       // cooldown for radar ping sound
    this._highDetection = false; // flag for detection edge tint
    this._damageSmoke = 0;       // smoke trail intensity from damage
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

    this.events.once('shutdown', this.shutdown, this);

    // Start with cinematic takeoff sequence
    this._startTakeoff();
  }

  // ═════════════════════════════════════════════════════════════
  // GRAPHICS SETUP (no side-view layers needed)
  // ═════════════════════════════════════════════════════════════
  _setupGraphics() {
    // AI night-terrain base tile (scrolling top-down sea/coast/land).
    // When the AI textures exist we render the cruise base with a single
    // tileSprite whose texture we swap per phase; the procedural fills in
    // _drawFlightTerrain become a fallback gated behind this flag.
    this._aiFlightTerrain = this.textures.exists('b2_terrain_sea');
    if (this._aiFlightTerrain) {
      this._flightTerrainTile = this.add
        .tileSprite(W / 2, H / 2, W, H, 'b2_terrain_sea')
        .setDepth(-1)          // below terrainGfx (depth 0) so overlays still draw on top
        .setVisible(false);
      this._flightTerrainKey = 'b2_terrain_sea';
    } else {
      this._flightTerrainTile = null;
      this._flightTerrainKey = null;
    }

    // Main terrain graphics layer (drawn every frame)
    this.terrainGfx = this.add.graphics().setDepth(0);
    // B-2 graphics layer (drawn every frame)
    this.b2Gfx = this.add.graphics().setDepth(10);
    // AI top-down B-2 sprite (replaces the procedural _drawB2 vector art).
    this.b2Sprite = this.add.image(0, 0, 'b2_top').setDepth(10).setVisible(false);
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
    this.inputManager = new InputManager(this, { preset: 'aerial' });
    const rawKeys = {
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
    this.keys = this.inputManager.enhanceKeys(rawKeys, {
      left: 'left', right: 'right', up: 'up', down: 'down',
      space: 'primary', c: 'secondary', esc: 'pause',
    });
    this._rawKeys = rawKeys;
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

    // Damage smoke trail - add persistent smoke particles
    this._damageSmoke = Math.max(this._damageSmoke || 0, (3 - this.armor));

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
    // AI sprite version — nose UP. (Procedural vector art below is bypassed.)
    if (this.b2Sprite) {
      this.b2Sprite.setVisible(true).setPosition(bx, by)
        .setScale((scale || 1) * 1.0).setFlipY(false)
        .setRotation((bankAngle || 0) * 0.22);
      return;
    }
    const bs = scale || 1;
    // Banking: shift wing tips based on bankAngle (-1 to 1)
    const bank = (bankAngle || 0) * 0.35;  // visible tilt

    // Wing span shrinks on the banking side (perspective foreshortening)
    const rightSpan = 60 + bank * 18;  // grows when banking left, shrinks when banking right
    const leftSpan = 60 - bank * 18;
    const rightTrail = 40 + bank * 12;
    const leftTrail = 40 - bank * 12;

    // Slight vertical nose offset when banking (nose dips toward turn)
    const noseShift = bank * 3;

    // Draw relative to bx,by with manual vertex offsets for banking

    // Flying wing body (boomerang/bat shape from above)
    gfx.fillStyle(0x3a3a3a, 1);
    gfx.beginPath();
    gfx.moveTo(bx + noseShift * bs, by - 20 * bs);                // nose (top)
    gfx.lineTo(bx + rightSpan * bs, by + 15 * bs);                // right wing tip
    gfx.lineTo(bx + rightTrail * bs, by + 20 * bs);               // right trailing edge
    gfx.lineTo(bx, by + 10 * bs);                                  // center rear
    gfx.lineTo(bx - leftTrail * bs, by + 20 * bs);                // left trailing edge
    gfx.lineTo(bx - leftSpan * bs, by + 15 * bs);                 // left wing tip
    gfx.closePath();
    gfx.fill();

    // Darker wing surface gradient (inner portion — shifts with bank)
    gfx.fillStyle(0x2e2e2e, 0.6);
    gfx.beginPath();
    gfx.moveTo(bx + noseShift * bs, by - 15 * bs);
    gfx.lineTo(bx + (35 + bank * 8) * bs, by + 12 * bs);
    gfx.lineTo(bx, by + 8 * bs);
    gfx.lineTo(bx - (35 - bank * 8) * bs, by + 12 * bs);
    gfx.closePath();
    gfx.fill();

    // Panel lines
    gfx.lineStyle(0.5 * bs, 0x555555, 0.5);
    gfx.lineBetween(bx + noseShift * bs, by - 18 * bs, bx, by + 8 * bs);
    gfx.lineBetween(bx - 20 * bs, by + 5 * bs, bx + 20 * bs, by + 5 * bs);

    // Wing leading-edge highlight
    gfx.lineStyle(1 * bs, 0x4a4a4a, 0.6);
    gfx.beginPath();
    gfx.moveTo(bx - (leftSpan - 2) * bs, by + 14 * bs);
    gfx.lineTo(bx + noseShift * bs, by - 19 * bs);
    gfx.lineTo(bx + (rightSpan - 2) * bs, by + 14 * bs);
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
    const isFlipped = this._escapeFlipped || false;
    if (Math.random() < 0.3) {
      const side = Math.random() < 0.5 ? -1 : 1;
      const px = this.jetX + side * 14 + (Math.random() - 0.5) * 4;
      const py = isFlipped ? this.jetY - 18 : this.jetY + 18;  // engines at top when flipped
      const pColor = Math.random() < 0.3 ? 0xff8800 : 0x554433;
      const p = this.add.circle(px, py, 1.5 + Math.random(), pColor, 0.3).setDepth(4);
      this.engineParticles.push({ sprite: p, life: 0.5 + Math.random() * 0.3 });
    }
    // Damage smoke (if armor < 3)
    if (this._damageSmoke > 0) {
      for (let ds = 0; ds < this._damageSmoke; ds++) {
        if (Math.random() < 0.4) {
          const dsx = this.jetX + (Math.random() - 0.5) * 20;
          const dsy = this.jetY + 10;
          const smokeP = this.add.circle(dsx, dsy, 2 + Math.random() * 3, 0x222222, 0.35).setDepth(4);
          this.engineParticles.push({ sprite: smokeP, life: 0.8 + Math.random() * 0.5 });
        }
      }
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
    this.takeoffScale = 1.8;   // zoomed in — big B-2 on runway
    this.takeoffShake = 0;
    this.takeoffRunwayOffset = 0;

    // Hide gameplay graphics and HUD during takeoff
    this.terrainGfx.setVisible(false);
    this._hideFlightTerrainTile();
    this.b2Gfx.setVisible(false);
    this.radarGfx.setVisible(false);
    this._setHUDVisible(false);

    // Container for all takeoff visuals
    this.takeoffObjects = [];

    // Graphics layer for runway + top-down B-2
    this.takeoffGfx = this.add.graphics().setDepth(20);
    this.takeoffObjects.push(this.takeoffGfx);

    // AI B-2 sprite for the takeoff (replaces the procedural vector B-2)
    this.takeoffB2Sprite = this.add.image(W / 2, H / 2, 'b2_top').setDepth(20.5).setVisible(false);
    this.takeoffObjects.push(this.takeoffB2Sprite);

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

    // Play engine spool-up sound (store ref for cleanup — runs 120s!)
    this._takeoffJetRef = SoundManager.get().playJetEngine();

    // Then the B-2 engine hum kicks in
    this.time.delayedCall(500, () => {
      if (this.phase !== 'takeoff') return;
      this.takeoffEngineRef = SoundManager.get().playB2Engine();
    });

    // Runway rumble as engines build power
    this.time.delayedCall(2000, () => {
      if (this.phase !== 'takeoff') return;
      SoundManager.get().playAfterburner();
    });

    // Second afterburner burst at full power
    this.time.delayedCall(4000, () => {
      if (this.phase !== 'takeoff') return;
      SoundManager.get().playAfterburner();
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

    // Zoom out (1.8 → 1.0 as engines spool up)
    if (this.takeoffStage >= 1 && this.takeoffStage < 3) {
      const zoomProgress = Math.min(1, (t - 3) / 2);
      this.takeoffScale = 1.8 - 0.8 * zoomProgress;
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

    // Top-down B-2 — AI sprite (nose points UP), replaces the procedural shape.
    const bx = cx;
    const by = Math.max(80, Math.min(H - 40, bomberScreenY));
    const bs = scale * liftScale;

    if (this.takeoffB2Sprite) {
      // b2_top is 128px wide; the old vector spanned ~120*bs → match it
      this.takeoffB2Sprite.setVisible(true).setPosition(bx, by).setScale(bs * 0.95);
    }

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
          for (let x = 0; x < W; x += 16) {
            const wy = y + Math.sin(x * 0.04 + t * 1.5) * 3;
            const wy2 = y + Math.sin((x + 16) * 0.04 + t * 1.5) * 3;
            gfx.lineBetween(x, wy, x + 16, wy2);
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

    // Stop the jet engine spool-up sound (120s duration — MUST be stopped)
    if (this._takeoffJetRef) {
      try {
        if (this._takeoffJetRef.source) this._takeoffJetRef.source.stop();
        if (this._takeoffJetRef.osc) this._takeoffJetRef.osc.stop();
      } catch (e) { /* already stopped */ }
      this._takeoffJetRef = null;
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
    // Reset AI base tile to the sea texture for the start of the cruise.
    if (this._aiFlightTerrain && this._flightTerrainTile) {
      this._flightTerrainTile.setTexture('b2_terrain_sea');
      this._flightTerrainKey = 'b2_terrain_sea';
      this._flightTerrainTile.tilePositionY = 0;
    }
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
    else this.jetBankAngle += (0 - this.jetBankAngle) * 3 * dt;

    // Dynamic altitude and speed
    const altMeters = Math.round(12000 - (this.jetY / H) * 3000);
    const spdKts = Math.round(450 + Math.abs(this.jetBankAngle) * 20);
    this.hudAlt.setText(`ALT: ${altMeters}m`);
    this.hudSpeed.setText(`SPD: ${spdKts} kts`);

    // Maneuver sounds (cooldown prevents spam)
    this._maneuverSoundCD = Math.max(0, this._maneuverSoundCD - dt);
    if (this._maneuverSoundCD <= 0) {
      if (Phaser.Input.Keyboard.JustDown(this.keys.left) || Phaser.Input.Keyboard.JustDown(this.keys.right)) {
        SoundManager.get().playAfterburner();
        this._maneuverSoundCD = 0.5;
      } else if (Phaser.Input.Keyboard.JustDown(this.keys.up) || Phaser.Input.Keyboard.JustDown(this.keys.down)) {
        SoundManager.get().playLand();
        this._maneuverSoundCD = 0.4;
      }
    }

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
    this._radarBlipCD = Math.max(0, this._radarBlipCD - dt);
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
        // Radar blip sound when sweep line passes near player
        if (this._radarBlipCD <= 0) {
          SoundManager.get().playRadarBlip();
          this._radarBlipCD = 1.5;
        }
      }
    }

    // Screen edge tint when detection is high
    if (this.detectionLevel > 60) {
      this._highDetection = true;
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

  // Update the AI base tileSprite for the flight phase: pick the texture for
  // the current SEA→COAST→LAND phase and scroll it downward to match the
  // procedural terrain (terrainOffset px). No-op without AI textures.
  _updateFlightTerrainTile(t) {
    if (!this._aiFlightTerrain || !this._flightTerrainTile) return;
    const tile = this._flightTerrainTile;
    tile.setVisible(true);
    // Match procedural thresholds: sea t<7, coast 7..12, land t>=12.
    const key = t < 7 ? 'b2_terrain_sea'
      : (t < 12 ? 'b2_terrain_coast' : 'b2_terrain_land');
    if (key !== this._flightTerrainKey && this.textures.exists(key)) {
      tile.setTexture(key);
      this._flightTerrainKey = key;
    }
    // Content scrolls DOWN as the bomber flies forward (terrainOffset grows).
    tile.tilePositionY = -this.terrainOffset;
  }

  // Hide the AI base tileSprite (used outside the flight phase).
  _hideFlightTerrainTile() {
    if (this._flightTerrainTile) this._flightTerrainTile.setVisible(false);
  }

  _drawFlightTerrain(gfx, t) {
    gfx.clear();
    this._updateFlightTerrainTile(t);
    const offset = this.terrainOffset;

    // Determine terrain type based on phase timer
    if (t < 7) {
      // ── DARK BLUE WATER (sea at night) ──
      // Base fill is supplied by the AI sea tileSprite when available.
      if (!this._aiFlightTerrain) {
        gfx.fillStyle(0x0a1628, 1);
        gfx.fillRect(0, 0, W, H);
      }

      // ── PARALLAX LAYER: Star field (very slow scroll, 0.05x) ──
      const starOffset = offset * 0.05;
      for (let i = 0; i < 30; i++) {
        const sx = ((i * 197 + 53) % W);
        const sy = ((i * 139 + 17 + starOffset) % (H + 20)) - 10;
        const twinkle = 0.15 + Math.sin(t * 2.5 + i * 1.7) * 0.1;
        gfx.fillStyle(0xffffff, twinkle);
        gfx.fillRect(sx, sy, 1, 1);
      }

      // ── PARALLAX LAYER: Far clouds (slow scroll, 0.15x) ──
      const cloudOffset = offset * 0.15;
      for (let ci = 0; ci < 5; ci++) {
        const cx = ((ci * 211 + 90) % (W + 120)) - 60;
        const cy = ((ci * 173 + 40 + cloudOffset) % (H + 80)) - 40;
        gfx.fillStyle(0x1a2a48, 0.1);
        gfx.fillEllipse(cx, cy, 60 + (ci % 3) * 20, 18 + (ci % 2) * 8);
      }

      // ── Large moon in upper-right corner ──
      gfx.fillStyle(0x8899aa, 0.15);
      gfx.fillCircle(W * 0.8, 50, 20);
      // Moon glow ring
      gfx.lineStyle(3, 0x8899aa, 0.06);
      gfx.strokeCircle(W * 0.8, 50, 28);

      // Wave lines scrolling down — 3 layers at different spacings for depth
      const waveLayers = [
        { spacing: 80, alpha: 0.25, width: 1 },
        { spacing: 60, alpha: 0.35, width: 1.5 },
        { spacing: 40, alpha: 0.4, width: 1.5 },
      ];
      for (const wl of waveLayers) {
        const waveOff = offset % wl.spacing;
        for (let y = -wl.spacing + waveOff; y < H + wl.spacing; y += wl.spacing) {
          gfx.lineStyle(wl.width, 0x1a2a48, wl.alpha);
          for (let x = 0; x < W; x += 16) {
            const wy = y + Math.sin(x * 0.04 + t * 1.5) * 3;
            const wy2 = y + Math.sin((x + 16) * 0.04 + t * 1.5) * 3;
            gfx.lineBetween(x, wy, x + 16, wy2);
          }
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

      // ── PARALLAX LAYER: Close wave foam patches (fast scroll, 1.3x) ──
      const foamFastOffset = offset * 1.3;
      for (let fi = 0; fi < 6; fi++) {
        const ffx = ((fi * 179 + 31) % W);
        const ffy = ((fi * 223 + 70 + foamFastOffset) % (H + 60)) - 30;
        gfx.fillStyle(0x3a5a7a, 0.15);
        gfx.fillCircle(ffx, ffy, 4 + (fi % 3) * 1);
        gfx.fillCircle(ffx + 6, ffy + 2, 3);
      }

      // ── Boat/ship shapes (variety: warships + lights) scattered on the water ──
      for (let i = 0; i < 6; i++) {
        const bx = ((i * 263 + 80 + Math.floor(offset * 0.05)) % W);
        const by = ((i * 181 + 120 + Math.floor(offset * 0.3)) % (H - 50)) + 50;
        const isWarship = i % 3 === 0;
        const hullLen = isWarship ? 12 : 6;
        gfx.fillStyle(0x2a3a5a, 0.25);
        gfx.beginPath();
        gfx.moveTo(bx, by - 3);
        gfx.lineTo(bx - hullLen, by + 2);
        gfx.lineTo(bx + hullLen, by + 2);
        gfx.closePath();
        gfx.fillPath();
        // Hull line
        gfx.lineStyle(0.5, 0x2a3a5a, 0.2);
        gfx.lineBetween(bx - hullLen - 1, by + 2, bx + hullLen + 1, by + 2);
        // Ship light (every other ship)
        if (i % 2 === 0) {
          gfx.fillStyle(0xffee88, 0.3);
          gfx.fillCircle(bx, by - 1, 1);
        }
      }

      // ── Moonlight reflection streak on water (wider, shimmer) ──
      for (let mr = 0; mr < 12; mr++) {
        const shimmer = 0.06 + Math.sin(t * 1.2 + mr * 0.6) * 0.03;
        gfx.fillStyle(0x3a4a6a, shimmer);
        const mx = W * 0.8 + Math.sin(t * 0.3 + mr * 0.4) * 30;
        const my = ((mr * 45 + offset * 0.2) % (H + 40)) - 20;
        gfx.fillRect(mx - 2, my, 5, 10 + mr % 3 * 4);
      }

    } else if (t < 12) {
      // ── COASTLINE TRANSITION — land appears FROM TOP (plane flies toward it) ──
      const coastProgress = (t - 7) / 5;  // 0 to 1

      // Land portion at TOP (growing downward — plane approaches from below)
      const landH = H * coastProgress;
      if (!this._aiFlightTerrain) {
        gfx.fillStyle(0x2a1e10, 1);
        gfx.fillRect(0, 0, W, landH);
      }

      // Some vegetation dots on land — mixed greens and sizes
      if (coastProgress > 0.2) {
        const vegColors = [0x1a3a1a, 0x2a4a2a, 0x1a2a1a];
        for (let i = 0; i < 15; i++) {
          const vx = (i * 127 + Math.floor(offset * 0.1)) % W;
          const vy = ((i * 89 + Math.floor(offset * 0.3)) % Math.max(1, landH));
          if (vy < landH) {
            gfx.fillStyle(vegColors[i % vegColors.length], 0.4);
            gfx.fillCircle(vx, vy, 2 + (i % 5));
          }
        }
      }

      // ── PARALLAX LAYER: Clouds drifting over land (0.2x speed) ──
      if (landH > 50) {
        const coastCloudOff = offset * 0.2;
        for (let cci = 0; cci < 4; cci++) {
          const ccx = ((cci * 241 + 70) % (W + 100)) - 50;
          const ccy = ((cci * 157 + 20 + coastCloudOff) % Math.max(1, landH - 20));
          if (ccy < landH) {
            gfx.fillStyle(0x1a2a48, 0.1);
            gfx.fillEllipse(ccx, ccy, 50 + (cci % 3) * 15, 14 + (cci % 2) * 6);
          }
        }
      }

      // Beach strip (between land and water)
      const beachY = landH;
      const beachH = 20 + coastProgress * 15;
      if (!this._aiFlightTerrain) {
        gfx.fillStyle(0x8a7a5a, 0.8);
        gfx.fillRect(0, beachY, W, beachH);
      }

      // ── Palm tree silhouettes along beach transition ──
      if (coastProgress > 0.3) {
        gfx.fillStyle(0x1a3a1a, 0.35);
        gfx.lineStyle(1.5, 0x1a3a1a, 0.35);
        for (let pi = 0; pi < 6; pi++) {
          const px = ((pi * 167 + Math.floor(offset * 0.1)) % W);
          const py = beachY - 2;
          // Trunk (vertical line, slightly curved)
          gfx.lineBetween(px, py, px + 2, py - 14);
          // Palm frond (circle cluster on top)
          gfx.fillCircle(px + 2, py - 16, 6);
          gfx.fillCircle(px - 2, py - 18, 4);
          gfx.fillCircle(px + 5, py - 15, 4);
        }
      }

      // Water portion at BOTTOM (shrinking — plane has passed over it)
      const waterTop = beachY + beachH;
      if (!this._aiFlightTerrain) {
        gfx.fillStyle(0x0a1628, 1);
        gfx.fillRect(0, waterTop, W, H - waterTop);
      }
      // Waves in water
      const waveOffset = offset % 60;
      for (let y = waterTop; y < H + 40; y += 40) {
        gfx.lineStyle(1, 0x1a2a48, 0.3);
        for (let x = 0; x < W; x += 16) {
          const wy = y + Math.sin(x * 0.04 + t * 1.5) * 3;
          const wy2 = y + Math.sin((x + 16) * 0.04 + t * 1.5) * 3;
          gfx.lineBetween(x, wy, x + 16, wy2);
        }
      }

    } else {
      // ── LAND (desert/brown with subtle gradient for depth) ──
      // Base supplied by the AI land tileSprite when available.
      // Darker at top (far), lighter at bottom (near)
      if (!this._aiFlightTerrain) {
        const gradSteps = 8;
        for (let gs = 0; gs < gradSteps; gs++) {
          const gy = (gs / gradSteps) * H;
          const gh = H / gradSteps + 1;
          const lerp = gs / gradSteps;
          // Blend from 0x1a1408 (top/dark) to 0x2a1e10 (bottom/lighter)
          const r = Math.round(0x1a + lerp * (0x2a - 0x1a));
          const g = Math.round(0x14 + lerp * (0x1e - 0x14));
          const b = Math.round(0x08 + lerp * (0x10 - 0x08));
          gfx.fillStyle(Phaser.Display.Color.GetColor(r, g, b), 1);
          gfx.fillRect(0, gy, W, gh);
        }
      }

      // ── Terrain color patches (scattered rectangles for variety) ──
      const patchColors = [0x2a2018, 0x302418, 0x261c10];
      for (let pi = 0; pi < 12; pi++) {
        const px = ((pi * 83 + 37) % W);
        const py = ((pi * 131 + 19 + offset * 0.3) % (H + 80)) - 40;
        gfx.fillStyle(patchColors[pi % patchColors.length], 0.25);
        gfx.fillRect(px, py, 30 + (pi % 4) * 15, 20 + (pi % 3) * 10);
      }

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

      // ── Road intersections (where horiz and vert roads cross) ──
      for (const road of this.flightRoads) {
        for (let iy = -300 + hRoadOff; iy < H + 50; iy += 300) {
          gfx.fillStyle(0x3a3a3a, 0.3);
          gfx.fillRect(road.x - 4, iy - 4, 8, 8);
        }
      }

      // ── Vehicles on roads (small rectangles scrolling with terrain) ──
      for (let vi = 0; vi < 4; vi++) {
        const vRoad = this.flightRoads[vi % this.flightRoads.length];
        if (!vRoad) continue;
        const vx = vRoad.x - 2;
        const vy = ((vi * 191 + 60 + offset) % (H + 100)) - 50;
        if (vy > -10 && vy < H + 10) {
          gfx.fillStyle(0x2a2a2a, 0.5);
          gfx.fillRect(vx, vy, 4, 2);
        }
      }

      // ── Taller buildings (some with lights, military variants) ──
      for (const b of this.flightBuildings) {
        const by = ((b.yBase + offset) % (H + 200)) - 100;
        if (by > -20 && by < H + 20) {
          // Some buildings are taller — draw a lighter "upper floor" extension
          if (b.h > 12) {
            gfx.fillStyle(b.color, 0.3);
            gfx.fillRect(b.x + 1, by - 4, b.w - 2, 4);
          }
          // Military buildings: olive/green barracks
          if (b.w > 12 && b.h > 10 && (b.x + b.yBase) % 7 === 0) {
            gfx.fillStyle(0x3a4a3a, 0.4);
            gfx.fillRect(b.x, by, b.w, b.h);
          }
          // Compound walls (faint outline around some buildings)
          if (b.w > 10 && (b.x + b.yBase) % 5 === 0) {
            gfx.lineStyle(0.5, 0x4a3a28, 0.1);
            gfx.strokeRect(b.x - 4, by - 4, b.w + 8, b.h + 8);
          }
          // Lit windows on larger buildings
          if (b.w > 10 && b.h > 8) {
            gfx.fillStyle(0xffee88, 0.15);
            gfx.fillRect(b.x + 2, by + 2, 2, 2);
            if (b.w > 14) {
              gfx.fillRect(b.x + b.w - 4, by + 2, 2, 2);
            }
          }
        }
      }

      // ── Mosque dome shapes (improved — larger domes, dual minarets) ──
      const mosqueSeeds = [
        { x: 200, yBase: 120, large: true },
        { x: 600, yBase: 300, large: false },
        { x: 400, yBase: 50, large: true },
      ];
      for (const m of mosqueSeeds) {
        const my = ((m.yBase + offset) % (H + 200)) - 100;
        if (my > -20 && my < H + 20) {
          const domeR = m.large ? 7 : 5;
          gfx.fillStyle(0x4a3a28, 0.4);
          gfx.fillRect(m.x - 5, my, 10, 12);
          // Dome (half circle on top — slightly larger)
          gfx.beginPath();
          gfx.arc(m.x, my, domeR, Math.PI, 0, false);
          gfx.fillPath();
          // Right minaret
          gfx.fillRect(m.x + 8, my - 6, 2, 18);
          // Left minaret (for larger mosques)
          if (m.large) {
            gfx.fillRect(m.x - 10, my - 6, 2, 18);
            // Left crescent
            gfx.fillStyle(0x8a7a5a, 0.3);
            gfx.fillCircle(m.x - 9, my - 7, 1.5);
          }
          // Right crescent on top
          gfx.fillStyle(0x8a7a5a, 0.3);
          gfx.fillCircle(m.x + 9, my - 7, 1.5);
        }
      }

      // ── PARALLAX LAYER: Clouds above land (0.2x speed) ──
      const landCloudOff = offset * 0.2;
      for (let lci = 0; lci < 5; lci++) {
        const lcx = ((lci * 199 + 110) % (W + 100)) - 50;
        const lcy = ((lci * 167 + 30 + landCloudOff) % (H + 60)) - 30;
        gfx.fillStyle(0x1a2a48, 0.1);
        gfx.fillEllipse(lcx, lcy, 55 + (lci % 3) * 18, 16 + (lci % 2) * 7);
      }

      // ── PARALLAX LAYER: Dust/haze at bottom edge (0.5x speed) ──
      const dustOff = (offset * 0.5) % 200;
      gfx.fillStyle(0x4a3a28, 0.1);
      gfx.fillRect(0, H - 40, W, 40);
      // Slight horizontal variation in dust
      for (let di = 0; di < 8; di++) {
        const dx = ((di * 131 + dustOff) % (W + 40)) - 20;
        gfx.fillStyle(0x4a3a28, 0.06);
        gfx.fillEllipse(dx, H - 20, 80, 30);
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

    // ── Red border glow when detection is high ──
    if (this._highDetection && this.detectionLevel > 60) {
      const alpha = 0.05 + (this.detectionLevel / 100) * 0.15;
      gfx.fillStyle(0xff0000, alpha);
      gfx.fillRect(0, 0, W, 8);      // top
      gfx.fillRect(0, H - 8, W, 8);  // bottom
      gfx.fillRect(0, 0, 8, H);      // left
      gfx.fillRect(W - 8, 0, 8, H);  // right
    }
    this._highDetection = false;
  }

  // ═════════════════════════════════════════════════════════════
  // PHASE: BOMBING — Multi-pass bombing runs over the mountain
  // B-2 auto-flies across the screen. Player controls UP/DOWN altitude.
  // SPACE drops bombs on each pass. Lower altitude = more accurate but riskier.
  // 5 passes, 3 bombs per pass.
  // ═════════════════════════════════════════════════════════════
  _startBombing() {
    this.phase = 'bombing';
    MusicManager.get().playLevel5Music('bombing');
    this.phaseTimer = 0;
    this.bombObjects = [];
    this.missileSpawnTimer = 0;
    this.bombingEnded = false;
    this.terrainSpeed = 0;
    this.terrainOffset = 0;

    // Mountain at center
    this._mtnCenterX = W / 2;
    this._mtnTargetY = H * 0.45;
    this._mtnBunkerHit = false;

    // Layer health
    this.mountainHP = MOUNTAIN_LAYERS;
    this.mountainLayerHP = [];
    for (let i = 0; i < MOUNTAIN_LAYERS; i++) this.mountainLayerHP.push(true);

    this._layersDestroyed = 0;
    this._samWarning = false;
    this._samWarningTimer = 0;

    // Multi-pass state
    this._passNumber = 1;
    this._maxPasses = 6;
    this._passDir = 1;              // 1 = left→right, -1 = right→left
    this._passSpeed = 180;          // horizontal speed (auto)
    this._bombsPerPass = 3;
    this._bombsThisPass = 3;
    this._passPaused = false;       // brief pause between passes
    this._passPauseTimer = 0;

    this.jetX = -40;                // start off-screen left
    this.jetY = 100;
    this.jetVY = 0;
    this.jetBankAngle = 0;
    this.bombCooldown = 0;
    this.bustersUsed = 0;

    // ── Player-controlled aiming reticle (LEFT/RIGHT) ──
    this._reticleX = this._mtnCenterX;       // where the bomb is aimed
    this._aimSpeed = 320;                    // reticle horizontal speed (px/s, tunable)

    // Reticle marker (free-aim crosshair the player steers) — green
    this._reticleGfx = this.add.graphics().setDepth(20);
    // Predicted bomb-impact preview marker on the ground — amber
    this._impactGfx = this.add.graphics().setDepth(19);

    this.instrText.setText(`PASS 1/${this._maxPasses} — LEFT/RIGHT: Aim | UP/DOWN: Altitude | SPACE: Drop`);
    this.instrText.setColor('#00ff66');

    this.detBarBg.setVisible(false);
    this.detBarFill.setVisible(false);
    this.hudDetect.setVisible(false);

    this.ambientRef = SoundManager.get().playB2Engine();
  }

  _updateBombing(dt) {
    this.phaseTimer += dt;
    const BOMB_GRAVITY = 400;
    // Precision hit zone. Shrinks slightly per layer destroyed (escalation),
    // floored so the run stays winnable. NEAR-MISS band is HIT_RADIUS_BASE*~1.8.
    const HIT_RADIUS_BASE = 32;            // tight core hit radius (was 70)
    const HIT_RADIUS = Math.max(20, HIT_RADIUS_BASE - this._layersDestroyed * 2);
    const NEAR_RADIUS = HIT_RADIUS + 26;   // "CLOSE!" band beyond a clean hit
    const MIN_ALT = 70;      // lowest the jet can fly (dangerous, accurate)
    const MAX_ALT = H * 0.28; // highest (safe, less accurate)

    // ── Between-pass pause ──
    if (this._passPaused) {
      this._passPauseTimer -= dt;
      if (this._passPauseTimer <= 0) {
        this._passPaused = false;
        this._passNumber++;
        if (this._passNumber > this._maxPasses) {
          // OUT OF PASSES
          if (!this.bombingEnded && this.mountainHP > 0) {
            this.bombingEnded = true;
            this._stopAmbient();
            this.instrText.setText('ALL PASSES COMPLETE — MISSION FAILED');
            this.instrText.setColor('#ff4444');
            this.time.delayedCall(2000, () => {
              this.phase = 'dead';
              showDefeatScreen(this, {
                currentScene: 'B2BomberScene',
                skipScene: 'LastStandCinematicScene',
              });
            });
          }
          return;
        }
        this._passDir *= -1;  // reverse direction
        this._bombsThisPass = this._bombsPerPass;
        this.jetX = this._passDir === 1 ? -40 : W + 40;
        this.jetVY = 0;
        // Mild escalation: each pass flies a touch faster (capped).
        this._passSpeed = Math.min(260, 180 + (this._passNumber - 1) * 14);
        this._reticleX = this._mtnCenterX; // recenter aim each pass
        this.instrText.setText(`PASS ${this._passNumber}/${this._maxPasses} — LEFT/RIGHT: Aim | UP/DOWN: Altitude | SPACE: Drop`);
      }
      // Still update falling bombs during pause; hide aim markers while banking
      this._clearAimMarkers();
      this._updateFallingBombs(dt, BOMB_GRAVITY, HIT_RADIUS, NEAR_RADIUS);
      this.hudDist.setText(`LAYERS: ${this.mountainHP}/${MOUNTAIN_LAYERS} | PASS ${this._passNumber}/${this._maxPasses} | CHAFF: ${this.chaff}`);
      return;
    }

    // ── Auto horizontal movement ──
    this.jetX += this._passSpeed * this._passDir * dt;

    // ── Player controls altitude only (UP = climb, DOWN = dive) ──
    if (this.keys.up.isDown) {
      this.jetVY += (-140 - this.jetVY) * 3 * dt;
    } else if (this.keys.down.isDown) {
      this.jetVY += (140 - this.jetVY) * 3 * dt;
    } else {
      this.jetVY += (0 - this.jetVY) * 2.5 * dt;
    }
    this.jetVY = Phaser.Math.Clamp(this.jetVY, -160, 160);
    this.jetY += this.jetVY * dt;
    this.jetY = Phaser.Math.Clamp(this.jetY, MIN_ALT, MAX_ALT);

    // ── Player aims the reticle with LEFT/RIGHT ──
    if (this.keys.left.isDown) this._reticleX -= this._aimSpeed * dt;
    if (this.keys.right.isDown) this._reticleX += this._aimSpeed * dt;
    this._reticleX = Phaser.Math.Clamp(this._reticleX, 40, W - 40);

    // ── Predicted bomb-impact marker ──
    // Bombs are guided to the reticle, so the predicted landing IS the reticle X
    // (small altitude spread aside). Draw the reticle + a target-relative band.
    this._predImpactX = this._reticleX;
    this._drawAimMarkers(this._reticleX, this._predImpactX, this._mtnTargetY - 20, HIT_RADIUS, NEAR_RADIUS);

    // Visual tilt based on climb/dive
    const tiltNorm = Phaser.Math.Clamp(this.jetVY / 160, -1, 1);
    this.jetBankAngle = tiltNorm * 12;

    // ── SPACE = drop bomb ──
    if (this.bombCooldown > 0) this.bombCooldown -= dt;
    if (Phaser.Input.Keyboard.JustDown(this._rawKeys.space) && this._bombsThisPass > 0 && this.bombCooldown <= 0) {
      this._bombsThisPass--;
      this.bustersUsed++;
      this.bombCooldown = 0.35;
      try { SoundManager.get().playBombDrop(); } catch (e) { /* audio */ }

      // Bomb is guided toward the reticle: solve for the vx that lands it at
      // _reticleX given the fall time, then add a tiny altitude-based spread
      // so very high drops are slightly less precise (skill reward for low passes).
      const bx = this.jetX, by = this.jetY + 15;
      const fallY = Math.max(10, (this._mtnTargetY - 20) - by);
      const tFall = Math.sqrt(2 * fallY / BOMB_GRAVITY);
      const altFactor = (this.jetY - MIN_ALT) / (MAX_ALT - MIN_ALT); // 0=low, 1=high
      const spread = altFactor * 18; // small residual inaccuracy from height
      const drift = (Math.random() - 0.5) * spread;
      const aimVX = (this._reticleX - bx) / tFall; // vx to reach reticle

      const bomb = this.add.circle(bx, by, 5, 0xffcc00).setDepth(9);
      const bombOut = this.add.circle(bx, by, 7, 0xff8800, 0).setDepth(9);
      bombOut.setStrokeStyle(2, 0xff8800, 0.6);
      this.bombObjects.push({
        sprite: bomb, outline: bombOut,
        x: bx, y: by,
        vx: aimVX + drift,
        vy: 0,
      });
    }

    // ── Chaff ──
    if (Phaser.Input.Keyboard.JustDown(this._rawKeys.c) && this._samWarning && this.chaff > 0) {
      this.chaff--;
      this.chaffUsed++;
      this._samWarning = false;
      this.missileSpawnTimer = 0;
      SoundManager.get().playChaffRelease();
    }

    // ── Update falling bombs ──
    this._updateFallingBombs(dt, BOMB_GRAVITY, HIT_RADIUS, NEAR_RADIUS);

    // ── Check if jet has crossed the screen (end of pass) ──
    const offScreen = this._passDir === 1 ? this.jetX > W + 50 : this.jetX < -50;
    if (offScreen) {
      this._passPaused = true;
      this._passPauseTimer = 1.2;  // brief pause between passes
      this.instrText.setText('BANKING FOR NEXT PASS...');
    }

    // ── SAM warnings (every 7 seconds) ──
    this.missileSpawnTimer += dt;
    if (this.missileSpawnTimer >= 7 && !this._samWarning) {
      this._samWarning = true;
      this._samWarningTimer = 2.5;
      SoundManager.get().playMissileWarning();
    }
    if (this._samWarning) {
      this._samWarningTimer -= dt;
      if (this._samWarningTimer <= 0) {
        this._samWarning = false;
        this.missileSpawnTimer = 0;
        // SAM hit — lose altitude control briefly
        SoundManager.get().playExplosion();
        this.cameras.main.shake(600, 0.025);
        this.jetVY = 80; // force dive
      }
    }

    // Altitude indicator
    const altPct = Math.round((1 - (this.jetY - MIN_ALT) / (MAX_ALT - MIN_ALT)) * 100);
    const altLabel = altPct > 70 ? 'HIGH (safe)' : altPct > 35 ? 'MED' : 'LOW (accurate!)';
    this.hudDist.setText(`LAYERS: ${this.mountainHP}/${MOUNTAIN_LAYERS} | PASS ${this._passNumber}/${this._maxPasses} | BOMBS: ${this._bombsThisPass} | ALT: ${altLabel}`);
  }

  _updateFallingBombs(dt, gravity, hitRadius, nearRadius = hitRadius * 1.8) {
    for (let i = this.bombObjects.length - 1; i >= 0; i--) {
      const b = this.bombObjects[i];
      b.vy += gravity * dt;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.sprite.setPosition(b.x, b.y);
      b.outline.setPosition(b.x, b.y);

      // Hit the mountain target area
      if (b.y >= this._mtnTargetY - 20) {
        const distToTarget = Math.abs(b.x - this._mtnCenterX);
        b.sprite.destroy();
        b.outline.destroy();
        this.bombObjects.splice(i, 1);

        if (distToTarget < hitRadius) {
          // HIT — destroy a layer
          const layerIdx = this._layersDestroyed;
          if (layerIdx < MOUNTAIN_LAYERS && this.mountainLayerHP[layerIdx]) {
            this.mountainLayerHP[layerIdx] = false;
            this.mountainHP--;
            this._layersDestroyed++;
          }

          SoundManager.get().playBunkerBusterImpact();
          this.cameras.main.shake(500, 0.02 + this._layersDestroyed * 0.008);
          this._addExplosion(this._mtnCenterX, this._mtnTargetY, 30, 0xff8800);

          const msg = `LAYER ${this._layersDestroyed} PENETRATED`;
          const pts = this.add.text(this._mtnCenterX, this._mtnTargetY - 40, msg, {
            fontFamily: 'monospace', fontSize: '14px', color: '#00ff66',
            shadow: { offsetX: 0, offsetY: 0, color: '#00ff66', blur: 8, fill: true },
          }).setOrigin(0.5).setDepth(25);
          this.tweens.add({ targets: pts, y: pts.y - 50, alpha: 0, duration: 1500, onComplete: () => pts.destroy() });

          // WIN
          if (this.mountainHP <= 0 && !this._mtnBunkerHit) {
            this._mtnBunkerHit = true;
            this._stopAmbient();
            this._clearAimMarkers();
            this.time.delayedCall(800, () => this._startMountainExplosion());
            return;
          }
        } else if (distToTarget < nearRadius) {
          // NEAR-MISS — close but no penetration. Light feedback so the player
          // knows they were almost on target.
          this._addExplosion(b.x, b.y, 18, 0xffaa00);
          SoundManager.get().playExplosion();
          this.cameras.main.shake(180, 0.008);
          const close = this.add.text(b.x, this._mtnTargetY - 30, 'CLOSE!', {
            fontFamily: 'monospace', fontSize: '13px', color: '#ffcc33',
            shadow: { offsetX: 0, offsetY: 0, color: '#ff8800', blur: 6, fill: true },
          }).setOrigin(0.5).setDepth(25);
          this.tweens.add({ targets: close, y: close.y - 30, alpha: 0, duration: 1000, onComplete: () => close.destroy() });
        } else {
          // MISS — wild
          this._addExplosion(b.x, b.y, 12, 0xff6600);
          SoundManager.get().playExplosion();
        }
        continue;
      }

      // Off-screen
      if (b.y > H + 20 || b.x < -30 || b.x > W + 30) {
        b.sprite.destroy();
        b.outline.destroy();
        this.bombObjects.splice(i, 1);
      }
    }
  }

  // Draw the player aim reticle and the predicted bomb-impact band on the
  // ground line so skilled timing/aim is rewarded.
  _drawAimMarkers(reticleX, impactX, groundY, hitRadius, nearRadius) {
    // Reticle (free-aim crosshair the player steers)
    if (this._reticleGfx) {
      const g = this._reticleGfx;
      g.clear();
      g.lineStyle(1.5, 0x66ff99, 0.9);
      g.strokeCircle(reticleX, groundY, 9);
      g.lineBetween(reticleX - 14, groundY, reticleX - 4, groundY);
      g.lineBetween(reticleX + 4, groundY, reticleX + 14, groundY);
      g.lineBetween(reticleX, groundY - 14, reticleX, groundY - 4);
      g.lineBetween(reticleX, groundY + 4, reticleX, groundY + 14);
    }
    // Impact preview band: green core (hit) + amber near-miss ring, centered
    // on the actual target so the player sees exactly when they are on it.
    if (this._impactGfx) {
      const g = this._impactGfx;
      g.clear();
      const tx = this._mtnCenterX;
      const onTarget = Math.abs(impactX - tx) < hitRadius;
      // Near-miss ring around target
      g.lineStyle(1, 0xffaa00, 0.35);
      g.strokeCircle(tx, groundY, nearRadius);
      // Core hit ring
      g.lineStyle(2, onTarget ? 0x00ff66 : 0x33aa55, onTarget ? 0.9 : 0.5);
      g.strokeCircle(tx, groundY, hitRadius);
      // Predicted impact tick on the ground
      g.fillStyle(onTarget ? 0x00ff66 : 0xffcc33, 0.9);
      g.fillRect(impactX - 2, groundY - 3, 4, 6);
    }
  }

  _clearAimMarkers() {
    if (this._reticleGfx) this._reticleGfx.clear();
    if (this._impactGfx) this._impactGfx.clear();
  }

  _drawBombingTerrain(gfx, t) {
    gfx.clear();

    // ── THERMAL/IR CAMERA VIEW ──
    // Black-green night vision aesthetic
    gfx.fillStyle(0x0a120a, 1);
    gfx.fillRect(0, 0, W, H);

    // Scanlines (thermal camera effect)
    for (let y = 0; y < H; y += 3) {
      gfx.fillStyle(0x000000, 0.15);
      gfx.fillRect(0, y, W, 1);
    }

    // Noise/grain (sparse green dots)
    for (let i = 0; i < 30; i++) {
      const nx = Math.random() * W;
      const ny = Math.random() * H;
      gfx.fillStyle(0x00ff00, 0.03 + Math.random() * 0.04);
      gfx.fillRect(nx, ny, 1, 1);
    }

    // ── Mountain (thermal view — warm = bright green) ──
    const mtnCX = this._mtnCenterX;
    const mtnY = this._mtnTargetY;

    // Outer mountain mass (warm = brighter in IR)
    gfx.fillStyle(0x1a3a1a, 0.8);
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

    // Inner ridge (warmer = brighter)
    gfx.fillStyle(0x2a5a2a, 0.6);
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

    // Bunker entrance (HOT — very bright in IR)
    const bunkerSize = 22;
    gfx.fillStyle(0x44ff44, 0.7);
    gfx.fillRect(mtnCX - bunkerSize / 2, mtnY - bunkerSize / 2, bunkerSize, bunkerSize);
    gfx.lineStyle(1, 0x00ff00, 0.5);
    gfx.strokeRect(mtnCX - bunkerSize / 2 - 1, mtnY - bunkerSize / 2 - 1, bunkerSize + 2, bunkerSize + 2);

    // Heat signature rings (facility warmth)
    gfx.lineStyle(1, 0x22aa22, 0.2);
    gfx.strokeCircle(mtnCX, mtnY, 30);
    gfx.strokeCircle(mtnCX, mtnY, 50);

    // Facility structures (warm spots)
    const hotSpots = [
      { x: mtnCX + 60, y: mtnY - 30, r: 6 },
      { x: mtnCX - 55, y: mtnY + 25, r: 5 },
      { x: mtnCX + 30, y: mtnY + 55, r: 4 },
      { x: mtnCX - 40, y: mtnY - 50, r: 5 },
    ];
    for (const hs of hotSpots) {
      gfx.fillStyle(0x33cc33, 0.4);
      gfx.fillCircle(hs.x, hs.y, hs.r);
    }

    // Layer indicators (remaining layers as green rings)
    for (let i = 0; i < MOUNTAIN_LAYERS; i++) {
      const layerR = 35 + i * 12;
      if (this.mountainLayerHP[i]) {
        gfx.lineStyle(2, 0x00aa44, 0.25 - i * 0.03);
        gfx.strokeCircle(mtnCX, mtnY, layerR);
      } else {
        gfx.lineStyle(1, 0xff4400, 0.15);
        for (let a = 0; a < Math.PI * 2; a += 0.8) {
          const x1 = mtnCX + Math.cos(a) * layerR;
          const y1 = mtnY + Math.sin(a) * layerR;
          const x2 = mtnCX + Math.cos(a + 0.3) * layerR;
          const y2 = mtnY + Math.sin(a + 0.3) * layerR;
          gfx.lineBetween(x1, y1, x2, y2);
        }
      }
    }

    // ── B-2 BOMBER (side-view profile flying across) ──
    const jx = this.jetX;
    const jy = this.jetY;
    const dir = this._passDir || 1;

    // B-2 side silhouette (flying left or right)
    gfx.fillStyle(0x66ff66, 0.85);
    gfx.beginPath();
    gfx.moveTo(jx + 22 * dir, jy);            // nose
    gfx.lineTo(jx - 5 * dir, jy - 14);        // top wing
    gfx.lineTo(jx - 18 * dir, jy - 6);        // rear top
    gfx.lineTo(jx - 20 * dir, jy);            // tail
    gfx.lineTo(jx - 18 * dir, jy + 6);        // rear bottom
    gfx.lineTo(jx - 5 * dir, jy + 10);        // bottom wing
    gfx.closePath();
    gfx.fill();

    // Cockpit
    gfx.fillStyle(0xaaffaa, 0.6);
    gfx.fillCircle(jx + 16 * dir, jy, 3);

    // Engine glow
    gfx.fillStyle(0xccffcc, 0.5);
    gfx.fillCircle(jx - 20 * dir, jy - 2, 3);
    gfx.fillCircle(jx - 20 * dir, jy + 2, 3);

    // Altitude indicator lines (shows how low you are)
    const altPct = (jy - 70) / (H * 0.28 - 70); // 0=low, 1=high
    const indicatorColor = altPct < 0.3 ? 0xff4400 : altPct < 0.6 ? 0xffaa00 : 0x00ff00;
    gfx.lineStyle(1, indicatorColor, 0.3);
    gfx.lineBetween(jx - 25, jy + 16, jx + 25, jy + 16);

    // ── Aiming guide (vertical dashed line from jet to ground) ──
    gfx.lineStyle(1, 0x00ff00, 0.12);
    for (let gy = jy + 20; gy < mtnY + 60; gy += 12) {
      gfx.lineBetween(jx, gy, jx, Math.min(gy + 6, mtnY + 60));
    }

    // ── Falling bombs ──
    for (const b of this.bombObjects) {
      gfx.fillStyle(0xffff00, 0.9);
      gfx.fillCircle(b.x, b.y, 4);
      gfx.fillStyle(0xff8800, 0.4);
      gfx.fillCircle(b.x, b.y, 7);
      // Bomb trail
      gfx.lineStyle(1, 0xff6600, 0.25);
      gfx.lineBetween(b.x, b.y - 8, b.x - b.vx * 0.05, b.y - 12);
    }

    // ── Pass direction arrow at top ──
    const arrowX = W / 2;
    const arrowY = 30;
    gfx.fillStyle(0x00ff00, 0.2);
    gfx.beginPath();
    gfx.moveTo(arrowX + 20 * dir, arrowY);
    gfx.lineTo(arrowX - 10 * dir, arrowY - 8);
    gfx.lineTo(arrowX - 10 * dir, arrowY + 8);
    gfx.closePath();
    gfx.fill();

    // ── SAM WARNING OVERLAY (dramatic) ──
    if (this._samWarning) {
      const warnAlpha = 0.2 + Math.sin(t * 12) * 0.15;
      gfx.fillStyle(0xff0000, warnAlpha);
      gfx.fillRect(0, 0, W, H);

      // Warning border
      gfx.lineStyle(3, 0xff0000, 0.4 + Math.sin(t * 8) * 0.3);
      gfx.strokeRect(4, 4, W - 8, H - 8);

      // SAM INCOMING warning indicator bar
      gfx.fillStyle(0xff0000, 0.6 + Math.sin(t * 10) * 0.3);
      gfx.fillRect(W / 2 - 60, 50, 120, 20);
      gfx.fillStyle(0x000000, 0.8);
      gfx.fillRect(W / 2 - 58, 52, 116, 16);
    }

    // ── CAMERA FRAME OVERLAY ──
    // Corner brackets (IR camera frame)
    const bracketLen = 30;
    const bracketInset = 15;
    gfx.lineStyle(1.5, 0x00ff00, 0.3);
    // Top-left
    gfx.lineBetween(bracketInset, bracketInset, bracketInset + bracketLen, bracketInset);
    gfx.lineBetween(bracketInset, bracketInset, bracketInset, bracketInset + bracketLen);
    // Top-right
    gfx.lineBetween(W - bracketInset, bracketInset, W - bracketInset - bracketLen, bracketInset);
    gfx.lineBetween(W - bracketInset, bracketInset, W - bracketInset, bracketInset + bracketLen);
    // Bottom-left
    gfx.lineBetween(bracketInset, H - bracketInset, bracketInset + bracketLen, H - bracketInset);
    gfx.lineBetween(bracketInset, H - bracketInset, bracketInset, H - bracketInset - bracketLen);
    // Bottom-right
    gfx.lineBetween(W - bracketInset, H - bracketInset, W - bracketInset - bracketLen, H - bracketInset);
    gfx.lineBetween(W - bracketInset, H - bracketInset, W - bracketInset, H - bracketInset - bracketLen);

    // Timestamp overlay (bottom-right)
    const secs = Math.floor(t);
    const ms = Math.floor((t % 1) * 100);
    // (drawn as green text-like shapes for IR aesthetic)
    gfx.fillStyle(0x00ff00, 0.25);
    gfx.fillRect(W - 130, H - 30, 115, 16);
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
      const txt = this.add.text(W / 2, 50, 'FORDOW FACILITY -- DESTROYED', {
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

    // Stop the bombing-phase engine before starting the escape engine, so two
    // B-2 engine loops don't overlap and bleed until victory.
    this._stopAmbient();
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
    // AI sprite version — flying LEFT (nose rotated to point left), banked.
    if (this.b2Sprite) {
      this.b2Sprite.setVisible(true).setPosition(bx, by)
        .setScale(1.2).setFlipY(false)
        .setRotation(-Math.PI / 2 + (bank || 0) * 0.18);
      return;
    }
    // B-2 flying LEFT across screen, banked, wings almost touching water
    // Different angle than normal — side-ish view from behind, banked
    const bs = 1.2;  // slightly bigger for dramatic effect
    const bankFactor = bank || 0;

    // Flying-wing planform, nose pointing LEFT, seen from behind/above and banked.
    // Design units (nose-up baseline): nose (0,0); span x:-1..1; tail depth y:0..0.80.
    // We map design (dx, dy) -> screen by: screen along-flight = -dy (nose left),
    // screen across-span = dx, with the bank tilting the two wingtips (up/down).
    // upper span = "left wing" (tilts up on positive bank), lower = "right wing".
    const SP = 60 * bs;   // half-span in px
    const LN = 80 * bs;   // nose-to-tail length in px
    const upWing = -bankFactor;   // positive bank = upper wing up
    const downWing = bankFactor;  // positive bank = lower wing down

    // helper: design point -> screen. side = +1 (upper) / -1 (lower) selects bank tilt
    const px = (dy) => bx - dy * LN;                      // along flight (nose left)
    const py = (dx, side) => {
      const tilt = side >= 0 ? upWing : downWing;
      return by + dx * SP + tilt * Math.abs(dx) * 22 * bs;
    };

    // Full flying-wing outline: nose -> upper leading edge to tip -> upper sawtooth
    // back to centre rear -> lower sawtooth out to tip -> lower leading edge to nose.
    gfx.fillStyle(0x2c3037, 1);
    gfx.beginPath();
    gfx.moveTo(px(0.0), by);                              // nose
    gfx.lineTo(px(0.60), py(1.0, +1));                    // upper wingtip
    // upper trailing sawtooth (tip -> centre)
    gfx.lineTo(px(0.64), py(0.66, +1));                   // notch
    gfx.lineTo(px(0.76), py(0.42, +1));                   // rear point
    gfx.lineTo(px(0.68), py(0.22, +1));                   // notch
    gfx.lineTo(px(0.80), py(0.0, +1));                    // centre rear point
    // lower trailing sawtooth (centre -> tip)
    gfx.lineTo(px(0.68), py(-0.22, -1));                  // notch
    gfx.lineTo(px(0.76), py(-0.42, -1));                  // rear point
    gfx.lineTo(px(0.64), py(-0.66, -1));                  // notch
    gfx.lineTo(px(0.60), py(-1.0, -1));                   // lower wingtip
    gfx.closePath();
    gfx.fill();

    // Darker centre spine
    gfx.fillStyle(0x20242a, 1);
    gfx.beginPath();
    gfx.moveTo(px(0.05), by);
    gfx.lineTo(px(0.66), py(0.16, +1));
    gfx.lineTo(px(0.80), py(0.0, +1));
    gfx.lineTo(px(0.66), py(-0.16, -1));
    gfx.closePath();
    gfx.fill();

    // Leading-edge highlight (nose -> each wingtip)
    gfx.lineStyle(1.5 * bs, 0x3a3f47, 0.9);
    gfx.beginPath();
    gfx.moveTo(px(0.60), py(1.0, +1));
    gfx.lineTo(px(0.0), by);
    gfx.lineTo(px(0.60), py(-1.0, -1));
    gfx.strokePath();

    // Bold dark outline
    gfx.lineStyle(1.5 * bs, 0x111316, 0.9);
    gfx.beginPath();
    gfx.moveTo(px(0.0), by);
    gfx.lineTo(px(0.60), py(1.0, +1));
    gfx.lineTo(px(0.64), py(0.66, +1));
    gfx.lineTo(px(0.76), py(0.42, +1));
    gfx.lineTo(px(0.68), py(0.22, +1));
    gfx.lineTo(px(0.80), py(0.0, +1));
    gfx.lineTo(px(0.68), py(-0.22, -1));
    gfx.lineTo(px(0.76), py(-0.42, -1));
    gfx.lineTo(px(0.64), py(-0.66, -1));
    gfx.lineTo(px(0.60), py(-1.0, -1));
    gfx.closePath();
    gfx.strokePath();

    // Engine glow (behind wing, near centre trailing edge)
    const engY1 = py(0.16, +1);
    const engY2 = py(-0.16, -1);
    const engX = px(0.74);
    const pulse = Math.sin((this.phaseTimer || 0) * 10) * 0.2 + 0.8;
    gfx.fillStyle(0xff4400, 0.3 * pulse);
    gfx.fillCircle(engX, engY1, 5 * bs);
    gfx.fillCircle(engX, engY2, 5 * bs);
    gfx.fillStyle(0xff8800, 0.7 * pulse);
    gfx.fillCircle(engX, engY1, 2 * bs);
    gfx.fillCircle(engX, engY2, 2 * bs);

    // Water reflection/shadow below the lower wing tip
    if (downWing > 0) {
      const tipY = py(-1.0, -1);
      const waterY = H * 0.55 + 40;
      if (tipY > waterY - 20) {
        // Wing almost touching water — spray effect!
        const tipX = px(0.60);
        for (let i = 0; i < 4; i++) {
          const sx = tipX - 5 * bs + Math.random() * 10;
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
    if (this.phase === 'victory') return;
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

    // Save level progress: completing level 4 (B2BomberScene) unlocks level 5
    if (missionSuccess) {
      try {
        const prev = parseInt(localStorage.getItem('superzion_level_progress') || '1');
        if (5 > prev) localStorage.setItem('superzion_level_progress', '5');
      } catch(e) {}
    }

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
    this.inputManager.update();

    const dt = delta / 1000;

    if (Phaser.Input.Keyboard.JustDown(this._rawKeys.m) || this.inputManager.justDown('mute')) {
      const muted = SoundManager.get().toggleMute();
      MusicManager.get().setMuted(muted);
    }

    // ESC pause
    if ((Phaser.Input.Keyboard.JustDown(this._rawKeys.esc) || this.inputManager.justDown('pause')) && this.phase !== 'victory') {
      this._togglePause();
      return;
    }
    if (this.isPaused) { if (this.input.keyboard.checkDown(this.input.keyboard.addKey("Q"), 500)) { MusicManager.get().stop(0.3); this.scene.start("MenuScene"); } return; }

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

    // Hide the B-2 sprite each frame; the active phase's draw call re-shows it.
    if (this.b2Sprite) this.b2Sprite.setVisible(false);

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
        this._hideFlightTerrainTile();
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
      case 'escape':
        this._updateEscape(dt);
        this._hideFlightTerrainTile();
        // Draw cinematic ocean scene
        this._drawEscapeTerrain(this.terrainGfx, this.phaseTimer);
        this.radarGfx.clear();
        // Draw B-2 flying LEFT, banked, low over water
        this.b2Gfx.clear();
        this._drawEscapeB2(this.b2Gfx, this._escB2X, this._escB2Y, this._escBank);
        break;
      case 'explosion':
        this._hideFlightTerrainTile();
        // Terrain still visible during explosion
        if (this.terrainGfx) this._drawBombingTerrain(this.terrainGfx, this.phaseTimer);
        this.b2Gfx.clear();
        this.radarGfx.clear();
        break;
      case 'victory':
      case 'dead':
      case 'complete':
        this._hideFlightTerrainTile();
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
    // AI sprite version — nose DOWN (180° rotation).
    if (this.b2Sprite) {
      this.b2Sprite.setVisible(true).setPosition(bx, by)
        .setScale((scale || 1) * 1.0).setFlipY(false)
        .setRotation(Math.PI + (bankAngle || 0) * 0.15);
      return;
    }
    const bs = scale || 1;
    const bank = (bankAngle || 0) * 0.15;
    const t = this.phaseTimer || 0;

    // Flying-wing planform, NOSE pointing DOWN (escaping toward bottom of screen),
    // so the signature sawtooth trailing edge is at the TOP.
    // Design units (nose-up baseline): nose (0,0); span x:-1..1; tail depth y:0..0.80.
    // Map to screen: across-span = dx (with bank shifting the wingtips), and the
    // nose is below centre while the tail/sawtooth is above (vertical flip).
    const SP = 60 * bs;   // half-span in px
    const LN = 40 * bs;   // nose-to-tail length in px (compact, distant)
    // px: across span; bank tilts the two tips (right tip out, left tip in)
    const px = (dx) => bx + dx * SP + bank * Math.sign(dx) * 10 * bs;
    // py: nose down -> larger dy goes UP (negative screen-y)
    const py = (dy) => by + 20 * bs - dy * LN;

    // Full flying-wing outline (nose down, sawtooth on top)
    gfx.fillStyle(0x2c3037, 1);
    gfx.beginPath();
    gfx.moveTo(px(0.0), py(0.0));                          // nose (bottom)
    gfx.lineTo(px(1.0), py(0.60));                         // right wingtip
    // right trailing sawtooth (tip -> centre)
    gfx.lineTo(px(0.66), py(0.64));                        // notch
    gfx.lineTo(px(0.42), py(0.76));                        // rear point
    gfx.lineTo(px(0.22), py(0.68));                        // notch
    gfx.lineTo(px(0.0), py(0.80));                         // centre rear point (top-most)
    // left trailing sawtooth (centre -> tip)
    gfx.lineTo(px(-0.22), py(0.68));                       // notch
    gfx.lineTo(px(-0.42), py(0.76));                       // rear point
    gfx.lineTo(px(-0.66), py(0.64));                       // notch
    gfx.lineTo(px(-1.0), py(0.60));                        // left wingtip
    gfx.closePath();
    gfx.fill();

    // Darker centre spine
    gfx.fillStyle(0x20242a, 1);
    gfx.beginPath();
    gfx.moveTo(px(0.0), py(0.06));
    gfx.lineTo(px(0.16), py(0.66));
    gfx.lineTo(px(0.0), py(0.80));
    gfx.lineTo(px(-0.16), py(0.66));
    gfx.closePath();
    gfx.fill();

    // Leading-edge highlight (nose -> each wingtip)
    gfx.lineStyle(1 * bs, 0x3a3f47, 0.8);
    gfx.beginPath();
    gfx.moveTo(px(-1.0), py(0.60));
    gfx.lineTo(px(0.0), py(0.0));
    gfx.lineTo(px(1.0), py(0.60));
    gfx.strokePath();

    // Bold dark outline
    gfx.lineStyle(1 * bs, 0x111316, 0.9);
    gfx.beginPath();
    gfx.moveTo(px(0.0), py(0.0));
    gfx.lineTo(px(1.0), py(0.60));
    gfx.lineTo(px(0.66), py(0.64));
    gfx.lineTo(px(0.42), py(0.76));
    gfx.lineTo(px(0.22), py(0.68));
    gfx.lineTo(px(0.0), py(0.80));
    gfx.lineTo(px(-0.22), py(0.68));
    gfx.lineTo(px(-0.42), py(0.76));
    gfx.lineTo(px(-0.66), py(0.64));
    gfx.lineTo(px(-1.0), py(0.60));
    gfx.closePath();
    gfx.strokePath();

    // Engine glow (at the top now — behind wing near centre trailing edge)
    const engLX = px(-0.18);
    const engRX = px(0.18);
    const engY = py(0.66);
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
