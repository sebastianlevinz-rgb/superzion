// ═══════════════════════════════════════════════════════════════
// BomberScene — Level 2: Operation Deep Strike (side-scrolling F-15 run)
// Rebuilt from scratch. Robust phase flow that always lets you reach and
// bomb Nasrallah's bunker, with forgiving takeoff and landing.
//   takeoff → flight (sea→coast→mountain) → bombing → return → landing
// Reuses the in-style art (F-15, carrier, Nasrallah, soldiers, sunset sky)
// and the continuous terrain renderer (organic silhouette, no rectangles).
// ═══════════════════════════════════════════════════════════════

import Phaser from 'phaser';
import SoundManager from '../systems/SoundManager.js';
import MusicManager from '../systems/MusicManager.js';
import DifficultyManager from '../systems/DifficultyManager.js';
import { showVictoryScreen, showDefeatScreen } from '../ui/EndScreen.js';
import { showControlsOverlay, showTutorialOverlay } from '../ui/ControlsOverlay.js';
import { screenFlash } from '../systems/GameJuice.js';
import {
  createF15SideSprite, createCarrierSide, createSunsetSky, createCloudLayer,
  createTurboTurbanSprite, createTurboTurbanYelling, createMiniSoldier,
} from '../utils/BomberTextures.js';

const W = 960;
const H = 540;
const GROUND_Y = 420;     // horizon / collision line (sea level / ground)
const DECK_Y = 392;       // carrier deck surface (jet rests here)
const JET_SPEED = 430;    // world scroll speed during flight (px/s)
const BOMB_GRAVITY = 520;

// Vertical flight feel
const CLIMB_RATE = -190;
const DIVE_RATE = 190;
const VERT_LERP = 4.0;
const VERT_DECAY = 2.4;
const JET_GRAVITY = 26;   // very mild sink when no input
const TILT_MAX = Phaser.Math.DegToRad(18);

// Bunker
const BUNKER_LAYERS = 5;
const BUNKER_X = 480;
const BUNKER_W = 220;
const BUNKER_TOP = 320;
const LAYER_H = 18;
const BOMB_TOTAL = 12;
const CHAFF_TOTAL = 3;

// Distances (px of world scroll)
const FLIGHT_COAST = 2200;
const FLIGHT_MTN = 3900;
const FLIGHT_TARGET = 5600;
const RETURN_COAST = 1100;
const RETURN_SEA = 2100;
const RETURN_HOME = 3200;

const LANDING_SAFE_VY = 175; // sink rate at/under which a touchdown is safe

// ── Continuous terrain biomes (organic silhouette; base ≈ GROUND_Y) ──
const TERRAIN_STEP = 12;
const BIOME_EASE = 1.7;
const BIOMES = {
  sea:      { base: GROUND_Y, amp: 4,   rough: 0,  far: 0,   water: 1, feat: 'none',
              top: [0x16, 0x55, 0x6e], bot: [0x07, 0x1c, 0x28], rim: [0x2a, 0x7e, 0x9c] },
  coast:    { base: GROUND_Y, amp: 30,  rough: 9,  far: 0.7, water: 0, feat: 'city',
              top: [0xa0, 0x88, 0x48], bot: [0x33, 0x2e, 0x2a], rim: [0xc4, 0xa0, 0x60] },
  mountain: { base: GROUND_Y, amp: 108, rough: 28, far: 1,   water: 0, feat: 'trees',
              top: [0x4a, 0x60, 0x38], bot: [0x14, 0x20, 0x12], rim: [0x6a, 0x80, 0x50] },
  valley:   { base: GROUND_Y, amp: 34,  rough: 11, far: 0.6, water: 0, feat: 'scrub',
              top: [0x5a, 0x52, 0x38], bot: [0x22, 0x1e, 0x16], rim: [0x7a, 0x6c, 0x46] },
};

export default class BomberScene extends Phaser.Scene {
  constructor() { super('BomberScene'); }

  create() {
    this.time.timeScale = 1;
    this.cameras.main.setBackgroundColor('#0d0b2e');
    try { MusicManager.get().playLevel3Music('takeoff'); } catch (e) { /* audio */ }

    // Art (in-style; Nasrallah already designed)
    createF15SideSprite(this);
    createCarrierSide(this);
    createSunsetSky(this);
    createCloudLayer(this);
    createTurboTurbanSprite(this);
    createTurboTurbanYelling(this);
    createMiniSoldier(this);

    // State
    this.dm = DifficultyManager.get();
    this.phase = 'takeoff';
    this.armor = this.dm.isHard() ? 2 : 3;
    this.maxArmor = this.armor;
    this.bombs = BOMB_TOTAL;
    this.bombsUsed = 0;
    this.chaff = CHAFF_TOTAL;
    this.chaffCooldown = 0;
    this.bunkerHP = BUNKER_LAYERS;
    this.landingQuality = '';
    this.score = 0;
    this.scrollX = 0;
    this.flightDist = 0;
    this.returnDist = 0;
    this.terrainStage = 0;

    this.jetX = 130; this.jetY = DECK_Y; this.jetVX = 0; this.jetVY = 0;
    this.facingRight = true;

    this.missiles = [];
    this.bombObjects = [];
    this.flakBursts = [];
    this.explosions = [];
    this.engineParticles = [];
    this.chaffParticles = [];
    this.bunkerLayers = [];
    this.miniSoldiers = [];
    this.turretBullets = [];

    this.samTimer = 0;
    this.flakTimer = 0;
    this.bossTimer = 0;
    this.takeoffTime = 0;
    this.launched = false;

    this.isPaused = false;
    this.pauseObjects = [];

    this._setupLayers();
    this._setupHUD();
    this._setupInput();

    // Checkpoint: returning after a crash skips straight to the return leg.
    let checkpoint = false;
    try {
      if (localStorage.getItem('superzion_checkpoint_l2') === 'return') {
        checkpoint = true; localStorage.removeItem('superzion_checkpoint_l2');
      }
    } catch (e) { /* ignore */ }

    if (checkpoint) { this.bunkerHP = 0; this.bombsUsed = BOMB_TOTAL; this._startReturn(); }
    else { this._startTakeoff(); }

    showControlsOverlay(this, '←→↑↓: Fly | SPACE: Bomb | C: Chaff | M: Mute');
    showTutorialOverlay(this, [
      'LEVEL 2: OPERATION DEEP STRIKE',
      '',
      'Hold ↑ to take off from the carrier',
      '↑/↓ climb & dive   ←/→ speed',
      'SPACE: drop bombs on Nasrallah’s bunker',
      'C: chaff vs missiles   Land back on the carrier',
    ]);
    this.events.once('shutdown', this.shutdown, this);
  }

  // ═══════════════════════════ LAYERS ═══════════════════════════
  _setupLayers() {
    this.add.image(W / 2, H / 2, 'sunset_sky').setDepth(-10);

    // soft sunset gradient bands
    const g = this.add.graphics().setDepth(-9);
    g.fillStyle(0xff6633, 0.07); g.fillRect(0, H * 0.5, W, H * 0.16);
    g.fillStyle(0xff4488, 0.05); g.fillRect(0, H * 0.34, W, H * 0.16);
    g.fillStyle(0x6622aa, 0.05); g.fillRect(0, H * 0.15, W, H * 0.2);

    this.cloud1 = this.add.tileSprite(W / 2, 100, W, 150, 'cloud_layer').setDepth(-7);
    this.cloud2 = this.add.tileSprite(W / 2, 60, W, 120, 'cloud_layer').setDepth(-8).setAlpha(0.3).setScale(1.5, 0.8);
    this.cloud3 = this.add.tileSprite(W / 2, 180, W, 100, 'cloud_layer').setDepth(-6).setAlpha(0.15).setScale(0.7, 0.5);

    this.farGfx = this.add.graphics().setDepth(-5);
    this.nearGfx = this.add.graphics().setDepth(1);

    this.terrainScroll = 0;
    this.terrainT = 0;
    this._biome = this._cloneBiome(BIOMES.sea);
    this._biomeTarget = this._cloneBiome(BIOMES.sea);
    this._farReveal = 0;

    this.carrier = this.add.image(240, GROUND_Y - 10, 'carrier_side').setDepth(2);
    this.jet = this.add.image(this.jetX, this.jetY, 'f15_side').setDepth(10);

    this._drawTerrain();
  }

  _setupHUD() {
    const h = { fontFamily: 'monospace', fontSize: '12px', color: '#ffffff' };
    this.add.text(15, 12, 'OPERATION DEEP STRIKE', {
      fontFamily: 'monospace', fontSize: '11px', color: '#FFD700',
      shadow: { offsetX: 0, offsetY: 0, color: '#FFD700', blur: 4, fill: true },
    }).setDepth(30);
    this.hudArmor = this.add.text(15, 30, '', h).setDepth(30);
    this.hudBombs = this.add.text(15, 46, '', h).setDepth(30);
    this.hudChaff = this.add.text(150, 46, '', { ...h, color: '#88ccff' }).setDepth(30);
    this.hudAlt = this.add.text(W - 15, 12, '', { ...h, color: '#aaaaaa' }).setOrigin(1, 0).setDepth(30);
    this.hudSpd = this.add.text(W - 15, 28, '', { ...h, color: '#aaaaaa' }).setOrigin(1, 0).setDepth(30);
    this.hudDist = this.add.text(W / 2, 12, '', { fontFamily: 'monospace', fontSize: '11px', color: '#00e5ff' }).setOrigin(0.5).setDepth(30);
    this.instrBg = this.add.rectangle(W / 2, H - 32, W, 28, 0x000000, 0.65).setDepth(29);
    this.instr = this.add.text(W / 2, H - 32, '', {
      fontFamily: 'monospace', fontSize: '14px', color: '#ffffff', fontStyle: 'bold',
      shadow: { offsetX: 0, offsetY: 0, color: '#000000', blur: 4, fill: true },
    }).setOrigin(0.5).setDepth(30);
  }

  _setupInput() {
    this.cursors = this.input.keyboard.createCursorKeys();
    this.kSpace = this.input.keyboard.addKey('SPACE');
    this.kC = this.input.keyboard.addKey('C');
    this.kM = this.input.keyboard.addKey('M');
    this.kP = this.input.keyboard.addKey('P');
    this.kEsc = this.input.keyboard.addKey('ESC');
    this.kQ = this.input.keyboard.addKey('Q');
  }

  // ═══════════════════════════ TERRAIN ═══════════════════════════
  _cloneBiome(b) {
    return { base: b.base, amp: b.amp, rough: b.rough, far: b.far, water: b.water,
      feat: b.feat, top: [...b.top], bot: [...b.bot], rim: [...b.rim] };
  }

  _setBiome(name, instant = true) {
    const p = BIOMES[name]; if (!p) return;
    this._biomeTarget = this._cloneBiome(p);
    if (instant) this._biome = this._cloneBiome(p);
  }

  _revealFar() { this._farReveal = 1; }
  _hideFar() { this._farReveal = 0; }

  _scroll(speed, dt) {
    const dx = speed * dt;
    this.scrollX += dx;
    this.terrainScroll += dx;
    if (this.cloud1) this.cloud1.tilePositionX += dx * 0.1;
    if (this.cloud2) this.cloud2.tilePositionX += dx * 0.04;
    if (this.cloud3) this.cloud3.tilePositionX += dx * 0.18;
  }

  _updateTerrain(dt) {
    this.terrainT += dt;
    const k = Math.min(1, dt * BIOME_EASE);
    const c = this._biome, t = this._biomeTarget;
    c.base += (t.base - c.base) * k;
    c.amp += (t.amp - c.amp) * k;
    c.rough += (t.rough - c.rough) * k;
    c.water += (t.water - c.water) * k;
    const farTgt = Math.min(t.far, this._farReveal);
    c.far += (farTgt - c.far) * k;
    for (let i = 0; i < 3; i++) {
      c.top[i] += (t.top[i] - c.top[i]) * k;
      c.bot[i] += (t.bot[i] - c.bot[i]) * k;
      c.rim[i] += (t.rim[i] - c.rim[i]) * k;
    }
    c.feat = t.feat;
    this._drawTerrain();
  }

  static _rgb(a) { return (Math.round(a[0]) << 16) | (Math.round(a[1]) << 8) | Math.round(a[2]); }

  _surfaceY(sx) {
    const b = this._biome, w = this.terrainScroll + sx;
    const n = (Math.sin(w * 0.0019) * 0.5 + 0.5) * b.amp * 0.6
            + (Math.sin(w * 0.0041 + 1.7) * 0.5 + 0.5) * b.amp * 0.4
            + (Math.sin(w * 0.0123 + 0.6) * 0.5 + 0.5) * b.rough;
    return b.base - n;
  }

  _farSurfaceY(sx) {
    const b = this._biome, amp = b.amp * 0.5 + 22, w = this.terrainScroll * 0.45 + sx;
    const n = (Math.sin(w * 0.0013 + 2.1) * 0.5 + 0.5) * amp * 0.7
            + (Math.sin(w * 0.0031 + 0.4) * 0.5 + 0.5) * amp * 0.3;
    return (b.base - 26) - n;
  }

  _fillProfile(g, fn) {
    g.beginPath(); g.moveTo(-40, H + 40); g.lineTo(-40, fn(-40));
    for (let x = -40; x <= W + 40; x += TERRAIN_STEP) g.lineTo(x, fn(x));
    g.lineTo(W + 40, H + 40); g.closePath(); g.fillPath();
  }

  _strokeProfile(g, fn) {
    g.beginPath(); g.moveTo(-40, fn(-40));
    for (let x = -40; x <= W + 40; x += TERRAIN_STEP) g.lineTo(x, fn(x));
    g.strokePath();
  }

  _hash(n) { const s = Math.sin(n * 12.9898) * 43758.5453; return s - Math.floor(s); }

  _drawTerrain() {
    const b = this._biome, near = this.nearGfx, far = this.farGfx;
    far.clear(); near.clear();
    if (b.far > 0.03) {
      const sky = [0x6b, 0x3f, 0x70];
      const fc = [b.rim[0] * 0.6 + sky[0] * 0.4, b.rim[1] * 0.6 + sky[1] * 0.4, b.rim[2] * 0.6 + sky[2] * 0.4];
      far.fillStyle(BomberScene._rgb(fc), 0.62 * b.far);
      this._fillProfile(far, (x) => this._farSurfaceY(x));
    }
    near.fillStyle(BomberScene._rgb(b.bot), 1);
    this._fillProfile(near, (x) => this._surfaceY(x));
    near.lineStyle(8, BomberScene._rgb(b.top), 1);
    this._strokeProfile(near, (x) => this._surfaceY(x));
    near.lineStyle(2.5, BomberScene._rgb(b.rim), 1);
    this._strokeProfile(near, (x) => this._surfaceY(x));
    if (b.water > 0.5) this._drawWater(near); else this._drawLandFeatures(near);
  }

  _drawWater(g) {
    const t = this.terrainScroll, tt = this.terrainT;
    g.fillStyle(0xffe9b0, 0.16);
    const span = W + 240;
    for (let i = 0; i < 46; i++) {
      const wx = ((i * 90 - t * 0.6 - tt * 14) % span + span) % span - 120;
      const wy = this._surfaceY(wx) + 6 + (i % 6) * 14 + Math.sin(tt * 1.6 + i) * 1.5;
      g.fillRect(wx, wy, 9 + (i % 4) * 6, 1.3);
    }
    g.lineStyle(1, 0x1b5e74, 0.35);
    for (let row = 1; row <= 4; row++) {
      g.beginPath();
      for (let x = -40; x <= W + 40; x += 24) {
        const y = this._surfaceY(x) + 18 + row * 18 + Math.sin(x * 0.03 + tt * 1.4) * 2.5;
        if (x === -40) g.moveTo(x, y); else g.lineTo(x, y);
      }
      g.strokePath();
    }
  }

  _drawLandFeatures(g) {
    const b = this._biome, t = this.terrainScroll, slot = 44;
    const start = Math.floor((t - 80) / slot) * slot;
    for (let wx = start; wx < t + W + 80; wx += slot) {
      const sx = wx - t, surf = this._surfaceY(sx);
      const h = this._hash(wx), h2 = this._hash(wx * 1.7 + 3.1);
      if (b.feat === 'city') {
        if (h < 0.78) {
          const bw = 7 + h2 * 13, bh = 10 + h * 34;
          g.fillStyle(BomberScene._rgb([b.bot[0] + 18, b.bot[1] + 16, b.bot[2] + 14]), 1);
          g.fillRect(sx - bw / 2, surf - bh, bw, bh);
          g.fillStyle(0xffcc66, 0.35);
          for (let wy = surf - bh + 4; wy < surf - 3; wy += 5) g.fillRect(sx - 1, wy, 2, 2);
        }
      } else if (b.feat === 'trees') {
        if (surf < b.base - b.amp * 0.62) { g.fillStyle(0xdfe8f0, 0.55); g.fillTriangle(sx - 5, surf + 6, sx, surf - 1, sx + 5, surf + 6); }
        if (h < 0.6) { const ts = 4 + h2 * 5; g.fillStyle(0x16280f, 1); g.fillTriangle(sx - ts, surf + 2, sx, surf - ts * 2.4, sx + ts, surf + 2); }
      } else if (b.feat === 'scrub') {
        if (h < 0.5) { g.fillStyle(0x39491f, 0.6); g.fillEllipse(sx, surf + 3, 6 + h2 * 8, 3 + h2 * 2); }
      }
    }
  }

  // ═══════════════════════════ HELPERS ═══════════════════════════
  _setInstr(text, color = '#ffffff') { this.instr.setText(text); this.instr.setColor(color); }

  _tiltJet(dt, scale = 1) {
    const norm = Phaser.Math.Clamp(this.jetVY / (DIVE_RATE * 1.2), -1, 1);
    const target = norm * TILT_MAX * scale;
    const cur = this.jet.rotation || 0;
    this.jet.setRotation(cur + (target - cur) * 6 * dt);
  }

  _damage() {
    if (this.phase === 'dead' || this.phase === 'victory') return;
    this.armor--;
    try { SoundManager.get().playMissileWarning(); } catch (e) { /* audio */ }
    this.cameras.main.shake(180, 0.014);
    const f = this.add.rectangle(W / 2, H / 2, W, H, 0xff0000, 0.3).setDepth(25);
    this.tweens.add({ targets: f, alpha: 0, duration: 280, onComplete: () => f.destroy() });
    if (this.armor <= 0) { this._die(); }
  }

  _die() {
    if (this.phase === 'dead' || this.phase === 'victory') return;
    this.phase = 'dead';
    this._stopAmbient();
    this._hideGauge();
    try { SoundManager.get().playExplosion(); } catch (e) { /* audio */ }
    this.cameras.main.shake(500, 0.04);
    this.jet.setVisible(false);
    this._boom(this.jetX, this.jetY, 40);
    const t = this.add.text(W / 2, H / 2, 'SHOT DOWN', {
      fontFamily: 'monospace', fontSize: '46px', color: '#ff4444',
      shadow: { offsetX: 0, offsetY: 0, color: '#ff4444', blur: 18, fill: true },
    }).setOrigin(0.5).setDepth(55);
    this.time.delayedCall(2200, () => { t.destroy(); this._showResults(); });
  }

  _boom(x, y, r) {
    this._addExplosion(x, y, r);
    screenFlash(this, 0xff6600, 60, 0.18);
  }

  _addExplosion(x, y, r) {
    const e = this.add.circle(x, y, r, 0xff6600, 0.8).setDepth(15);
    this.explosions.push({ s: e, life: 0.5 });
    if (r > 22) this.cameras.main.shake(180, 0.01);
    const cols = [0xff6600, 0xff8800, 0xffaa00, 0xff2200, 0xffdd00, 0xffffff];
    const n = Math.min(16, Math.max(7, Math.floor(r / 2)));
    for (let i = 0; i < n; i++) {
      const p = this.add.circle(x, y, 1 + Math.random() * 3, cols[(Math.random() * cols.length) | 0], 0.9).setDepth(22);
      const a = Math.random() * Math.PI * 2, sp = 30 + Math.random() * 80;
      this.tweens.add({ targets: p, x: x + Math.cos(a) * sp, y: y + Math.sin(a) * sp, scale: 0, alpha: 0, duration: 320 + Math.random() * 360, onComplete: () => p.destroy() });
    }
  }

  _updateExplosions(dt) {
    for (let i = this.explosions.length - 1; i >= 0; i--) {
      const e = this.explosions[i]; e.life -= dt;
      e.s.setScale(1 + (0.5 - e.life)); e.s.setAlpha(Math.max(0, e.life * 2));
      if (e.life <= 0) { e.s.destroy(); this.explosions.splice(i, 1); }
    }
  }

  _engineTrail(dt) {
    if (Math.random() < 0.4) {
      const ox = this.facingRight ? -38 : 38;
      const p = this.add.circle(this.jetX + ox + (Math.random() - 0.5) * 4, this.jetY + (Math.random() - 0.5) * 6,
        2 + Math.random() * 2, Phaser.Display.Color.GetColor(255, 80 + (Math.random() * 100) | 0, 0), 0.6).setDepth(4);
      this.engineParticles.push({ s: p, life: 0.3 + Math.random() * 0.2 });
    }
    for (let i = this.engineParticles.length - 1; i >= 0; i--) {
      const ep = this.engineParticles[i]; ep.life -= dt;
      ep.s.setAlpha(Math.max(0, ep.life * 2)); ep.s.setScale(Math.max(0.2, ep.life));
      if (ep.life <= 0) { ep.s.destroy(); this.engineParticles.splice(i, 1); }
    }
  }

  _stopAmbient() {
    if (this.ambient) { try { this.ambient.source && this.ambient.source.stop(); this.ambient.osc && this.ambient.osc.stop(); } catch (e) { /* */ } this.ambient = null; }
  }

  _updateHUD() {
    const alt = Math.max(0, Math.round((GROUND_Y - this.jetY) / GROUND_Y * 3000));
    const spd = (this.phase === 'flight' || this.phase === 'returning') ? JET_SPEED : Math.abs(this.jetVX);
    this.hudAlt.setText(`ALT: ${alt}m`);
    this.hudSpd.setText(`SPD: ${Math.round(spd * 1.8)} kts`);
    this.hudArmor.setText(`ARMOR: ${Math.max(0, this.armor)}/${this.maxArmor}`);
    this.hudArmor.setColor(this.armor <= 1 ? '#ff4444' : '#ffffff');
    this.hudBombs.setText(`BOMBS: ${this.bombs}`);
    this.hudChaff.setText(`CHAFF: ${this.chaff} [C]`);
  }

  // ═══════════════════════════ TAKEOFF ═══════════════════════════
  _startTakeoff() {
    this.phase = 'takeoff';
    this.jetX = 130; this.jetY = DECK_Y; this.jetVX = 0; this.jetVY = 0;
    this.facingRight = true; this.launched = false; this.takeoffTime = 0;
    this.carrier.setVisible(true).setPosition(240, GROUND_Y - 10);
    this._hideFar(); this._setBiome('sea');
    this._setInstr('Engines spooling up… hold ↑ to take off', '#aaaaaa');
    try { this.ambient = SoundManager.get().playCarrierAmbient(); } catch (e) { /* audio */ }
  }

  _updateTakeoff(dt) {
    this.takeoffTime += dt;
    this.jetVX = Math.min(JET_SPEED, this.jetVX + 220 * dt); // auto spool-up
    this.jetX += this.jetVX * dt;
    this.jet.setFlipX(false);

    const ready = this.takeoffTime > 0.5; // brief spool before launch is allowed
    if (ready && !this._pullHint) {
      this._pullHint = true;
      this._setInstr('PULL UP!  press ↑', '#ff8800');
    }

    // Launch when the player pulls up, OR automatically at the end of the deck.
    if (ready && (this.cursors.up.isDown || this.jetX > 470)) {
      this.launched = true;
      this.phase = 'launching';
      this.jetVY = -210;
      this.launchT = 0;
      this._stopAmbient();
      try { SoundManager.get().playAfterburner(); } catch (e) { /* audio */ }
      this._setInstr('', '#ffffff');
      return;
    }
    this.jet.setPosition(this.jetX, this.jetY);
  }

  _updateLaunching(dt) {
    this.launchT += dt;
    this.jetVX = Math.min(JET_SPEED, this.jetVX + 200 * dt);
    this.jetX += this.jetVX * dt;
    this.jetY += this.jetVY * dt;
    this.jetVY += JET_GRAVITY * 0.3 * dt;
    if (this.jetY <= 200) { this.jetY = 200; this.jetVY = 0; } // level off at cruise — no overshoot
    this._tiltJet(dt);
    this.jet.setPosition(this.jetX, this.jetY);
    this.carrier.x -= this.jetVX * 0.55 * dt;                  // carrier scrolls off to the left
    // Transition once the carrier has cleared the screen, with a hard time
    // failsafe so launching always ends promptly (never stalls).
    if ((this.carrier.x < -240 || this.launchT > 2.0) && this.launchT > 0.6) {
      this.carrier.setVisible(false);
      this.jetX = 280; this.jetY = 200; this.jetVY = 0;
      this._startFlight();
    }
  }

  // ═══════════════════════════ FLIGHT ═══════════════════════════
  _startFlight() {
    this.phase = 'flight';
    try { MusicManager.get().playLevel3Music('flight'); } catch (e) { /* audio */ }
    this.facingRight = true; this.jetVX = 0; this.jetVY = 0;
    this.flightDist = 0; this.terrainStage = 0;
    this.samTimer = 1.5; this.flakTimer = 2.5;
    this._hideFar(); this._setBiome('sea');
    this._setInstr('Dodge SAMs — C for chaff — approaching target…', '#888888');
    try { this.ambient = SoundManager.get().playJetEngine(); } catch (e) { /* audio */ }
  }

  _flyVertical(dt) {
    if (this.cursors.up.isDown) this.jetVY += (CLIMB_RATE - this.jetVY) * VERT_LERP * dt;
    else if (this.cursors.down.isDown) this.jetVY += (DIVE_RATE - this.jetVY) * VERT_LERP * dt;
    else { this.jetVY += (0 - this.jetVY) * VERT_DECAY * dt; this.jetVY += JET_GRAVITY * dt; }
    this.jetVY = Phaser.Math.Clamp(this.jetVY, CLIMB_RATE * 1.2, DIVE_RATE * 1.2);
    this.jetY += this.jetVY * dt;
    if (this.jetY < 44) { this.jetY = 44; this.jetVY = Math.max(0, this.jetVY); }
  }

  _flyHorizontal(dt, dir) {
    const target = dir * 200;
    if ((dir > 0 && this.cursors.right.isDown) || (dir < 0 && this.cursors.left.isDown)) {
      this.jetVX += (target - this.jetVX) * 4 * dt;
    } else if ((dir > 0 && this.cursors.left.isDown) || (dir < 0 && this.cursors.right.isDown)) {
      this.jetVX += (-target - this.jetVX) * 4 * dt;
    } else this.jetVX += (0 - this.jetVX) * 3 * dt;
    this.jetX += this.jetVX * dt;
    this.jetX = Phaser.Math.Clamp(this.jetX, 60, W - 60);
  }

  _updateFlight(dt) {
    this._flyHorizontal(dt, 1);
    this._flyVertical(dt);
    if (this.jetY >= GROUND_Y - 12) { this._die(); return; }
    this._tiltJet(dt);
    this.jet.setPosition(this.jetX, this.jetY);

    this._scroll(JET_SPEED, dt);
    this.flightDist += JET_SPEED * dt;

    if (this.flightDist > FLIGHT_COAST && this.terrainStage === 0) {
      this.terrainStage = 1; this._setBiome('coast', false); this._revealFar();
      this._setInstr('Crossing the coast…', '#888888');
    }
    if (this.flightDist > FLIGHT_MTN && this.terrainStage === 1) {
      this.terrainStage = 2; this._setBiome('mountain', false);
      this._setInstr('Over the mountains…', '#888888');
    }
    this.hudDist.setText(`TARGET: ${Math.max(0, Math.round(90 * (1 - this.flightDist / FLIGHT_TARGET)))} km`);

    // SAMs (forgiving cadence)
    this.samTimer -= dt;
    if (this.samTimer <= 0) {
      this.samTimer = (2.2 + Math.random() * 1.2) * this.dm.spawnRateMult();
      this._spawnSAM(80 + Math.random() * (W - 160));
    }
    // Flak
    this.flakTimer -= dt;
    if (this.flakTimer <= 0) { this.flakTimer = 2.6; this._spawnFlak(); }

    this._updateMissiles(dt);
    this._updateChaff(dt);
    if (Phaser.Input.Keyboard.JustDown(this.kC)) this._deployChaff();

    if (this.flightDist >= FLIGHT_TARGET) { this._stopAmbient(); this._startBombing(); }
  }

  _spawnSAM(x) {
    const warn = this.add.text(x, H - 22, '▲', { fontFamily: 'monospace', fontSize: '16px', color: '#ff3333' }).setOrigin(0.5).setDepth(20);
    this.tweens.add({ targets: warn, alpha: 0.2, duration: 150, yoyo: true, repeat: 4 });
    try { SoundManager.get().playMissileWarning(); } catch (e) { /* audio */ }
    this.time.delayedCall(1400, () => {
      warn.destroy();
      if (this.phase !== 'flight' || this.missiles.length >= 2) return;
      this._launchMissile(x, GROUND_Y + 10, SoundManager);
    });
  }

  _launchMissile(x, y, _s, opts = {}) {
    const m = this.add.circle(x, y, opts.big ? 5 : 3, opts.big ? 0xff2222 : 0xff3333).setDepth(8);
    const glow = this.add.circle(x, y, opts.big ? 8 : 5, 0xff0000, opts.big ? 0.4 : 0.3).setDepth(7);
    const speed = (opts.big ? 200 : 175) * this.dm.missileSpeedMult();
    const a = Math.atan2(this.jetY - y, this.jetX - x);
    this.missiles.push({ s: m, glow, x, y, angle: a, speed, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, life: opts.big ? 4.5 : 4, trail: [], big: !!opts.big });
    try { SoundManager.get().playMissilePass(); } catch (e) { /* audio */ }
  }

  _updateMissiles(dt) {
    for (let i = this.missiles.length - 1; i >= 0; i--) {
      const m = this.missiles[i]; m.life -= dt;
      if (m.life <= 0) { this._addExplosion(m.x, m.y, 14); this._killMissile(i); continue; }
      // loose tracking
      const ta = Math.atan2(this.jetY - m.y, this.jetX - m.x);
      let d = ta - m.angle; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2;
      m.angle += Math.sign(d) * Math.min(Math.abs(d), 0.5 * dt);
      m.vx = Math.cos(m.angle) * m.speed; m.vy = Math.sin(m.angle) * m.speed;
      m.x += m.vx * dt; m.y += m.vy * dt;
      m.s.setPosition(m.x, m.y); m.glow.setPosition(m.x, m.y);
      if (Math.random() < 0.6) {
        const tp = this.add.circle(m.x, m.y, m.big ? 2.5 : 1.5, 0xcc4444, 0.4).setDepth(6);
        m.trail.push(tp);
        this.tweens.add({ targets: tp, alpha: 0, scale: 0.3, duration: 380, onComplete: () => { tp.destroy(); const j = m.trail.indexOf(tp); if (j >= 0) m.trail.splice(j, 1); } });
      }
      if (Phaser.Math.Distance.Between(m.x, m.y, this.jetX, this.jetY) < 18) {
        this._damage(); this._addExplosion(m.x, m.y, 18); this._killMissile(i); continue;
      }
      if (m.y < -60 || m.y > H + 60 || m.x < -60 || m.x > W + 60) this._killMissile(i);
    }
  }

  _killMissile(i) {
    const m = this.missiles[i]; if (!m) return;
    m.s.destroy(); m.glow.destroy(); for (const t of m.trail) t.destroy();
    this.missiles.splice(i, 1);
  }

  _spawnFlak() {
    const fx = 100 + Math.random() * (W - 200), fy = 120 + Math.random() * 180;
    const warn = this.add.circle(fx, fy, 22, 0xff0000, 0.32).setDepth(24);
    this.tweens.add({ targets: warn, scale: 1.8, alpha: 0.6, duration: 250, yoyo: true, repeat: 1 });
    this.time.delayedCall(1000, () => {
      warn.destroy();
      if (this.phase !== 'flight' && this.phase !== 'returning') return;
      const burst = this.add.circle(fx, fy, 8, 0xff8800, 0.7).setDepth(6);
      this.tweens.add({ targets: burst, scale: 4, alpha: 0, duration: 700, onComplete: () => burst.destroy() });
      if (Phaser.Math.Distance.Between(fx, fy, this.jetX, this.jetY) < 38) this._damage();
    });
  }

  _deployChaff() {
    if (this.chaff <= 0 || this.chaffCooldown > 0) return;
    this.chaff--; this.chaffCooldown = 4;
    try { SoundManager.get().playAfterburner(); } catch (e) { /* audio */ }
    for (let i = 0; i < 12; i++) {
      const p = this.add.circle(this.jetX + (Math.random() - 0.5) * 20, this.jetY + (Math.random() - 0.5) * 20, 2, 0xffffff, 0.9).setDepth(12);
      this.chaffParticles.push({ s: p, x: p.x, y: p.y, vx: (Math.random() - 0.5) * 200, vy: (Math.random() - 0.5) * 200, life: 1.2 });
    }
    let near = null, nd = Infinity;
    for (const m of this.missiles) { const d = Phaser.Math.Distance.Between(m.x, m.y, this.jetX, this.jetY); if (d < nd) { nd = d; near = m; } }
    if (near && nd < 130) { near.life = Math.min(near.life, 0.5); near.angle += (Math.random() - 0.5); }
  }

  _updateChaff(dt) {
    if (this.chaffCooldown > 0) this.chaffCooldown -= dt;
    for (let i = this.chaffParticles.length - 1; i >= 0; i--) {
      const p = this.chaffParticles[i]; p.life -= dt;
      p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.95; p.vy *= 0.95;
      p.s.setPosition(p.x, p.y); p.s.setAlpha(Math.max(0, p.life * 0.8));
      if (p.life <= 0) { p.s.destroy(); this.chaffParticles.splice(i, 1); }
    }
  }

  // ═══════════════════════════ BOMBING ═══════════════════════════
  _startBombing() {
    this.phase = 'bombing';
    try { MusicManager.get().playLevel3Music('bombing'); } catch (e) { /* audio */ }
    this.facingRight = true; this.jetX = 110; this.jetY = 150; this.jetVX = 0; this.jetVY = 0;
    this.bombCooldown = 0; this.bossTimer = 2; this.bombingEnded = false;
    this._setBiome('valley', false); this._revealFar();

    // Bunker shell (cross-section): layers + interior + Nasrallah + soldiers
    const left = BUNKER_X - BUNKER_W / 2;
    this.bunkerGfx = this.add.graphics().setDepth(2);
    this.bunkerGfx.fillStyle(0x0a0a14, 0.92);
    this.bunkerGfx.fillRect(left + 6, BUNKER_TOP - 4, BUNKER_W - 12, BUNKER_LAYERS * LAYER_H + 14);

    this.bunkerLayers = [];
    const cols = [0x8a8a92, 0x7a7a82, 0x6a6a72, 0x5a5a62, 0x4a4a52];
    for (let i = 0; i < BUNKER_LAYERS; i++) {
      const ly = BUNKER_TOP + i * LAYER_H + LAYER_H / 2;
      const lft = this.add.rectangle(left + 16, ly, 32, LAYER_H - 2, cols[i]).setDepth(4);
      const rgt = this.add.rectangle(left + BUNKER_W - 16, ly, 32, LAYER_H - 2, cols[i]).setDepth(4);
      const cap = this.add.rectangle(BUNKER_X, BUNKER_TOP + i * LAYER_H + 1, BUNKER_W - 64, 3, cols[i], 0.6).setDepth(4);
      this.bunkerLayers.push({ parts: [lft, rgt, cap], alive: true });
    }

    // Nasrallah (reused, already-designed sprite)
    this.boss = this.add.image(BUNKER_X, BUNKER_TOP + 40, 'turbo_turban').setDepth(3).setScale(0.55);
    this.bossYell = this.add.image(BUNKER_X, BUNKER_TOP + 40, 'turbo_turban_yell').setDepth(3).setScale(0.55).setVisible(false);
    this.tweens.add({ targets: [this.boss, this.bossYell], scaleY: 0.55 * 1.03, duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    this.miniSoldiers = [];
    for (const sp of [{ x: left + 46, y: BUNKER_TOP + 58 }, { x: left + 64, y: BUNKER_TOP + 60 }, { x: left + BUNKER_W - 46, y: BUNKER_TOP + 58 }, { x: left + BUNKER_W - 64, y: BUNKER_TOP + 60 }]) {
      this.miniSoldiers.push({ s: this.add.image(sp.x, sp.y, 'mini_soldier').setDepth(3).setScale(0.8), fleeing: false });
    }

    // Boss HP bar
    this.hpBg = this.add.rectangle(W / 2, 22, 204, 16, 0x333333).setStrokeStyle(1, 0x666666).setDepth(31);
    this.hpFill = this.add.rectangle(W / 2 - 100, 22, 200, 12, 0x44ff44).setOrigin(0, 0.5).setDepth(32);
    this.hpLabel = this.add.text(W / 2, 8, 'HASSAN NASRALLAH', { fontFamily: 'monospace', fontSize: '11px', color: '#ff8800', shadow: { offsetX: 0, offsetY: 0, color: '#ff8800', blur: 4, fill: true } }).setOrigin(0.5).setDepth(32);

    // Ground installation outline
    this.areaGfx = this.add.graphics().setDepth(1.5);
    this.areaGfx.lineStyle(2, 0x6a6a5a, 0.4);
    this.areaGfx.strokeRect(BUNKER_X - 200, BUNKER_TOP - 26, 400, GROUND_Y - BUNKER_TOP + 26);

    this._setInstr('←→↑↓ to aim — SPACE to bomb Nasrallah’s bunker', '#ff8800');
    try { this.ambient = SoundManager.get().playJetEngine(); } catch (e) { /* audio */ }
  }

  _updateBombing(dt) {
    this._flyHorizontal(dt, this.cursors.right.isDown ? 1 : (this.cursors.left.isDown ? -1 : 1));
    this.facingRight = this.jetVX >= 0;
    this._flyVertical(dt);
    if (this.jetY >= GROUND_Y - 12) { this._die(); return; }
    this.jet.setFlipX(!this.facingRight);
    this._tiltJet(dt);
    this.jet.setPosition(this.jetX, this.jetY);

    if (this.bombCooldown > 0) this.bombCooldown -= dt;
    if (Phaser.Input.Keyboard.JustDown(this.kSpace) && this.bombs > 0 && this.bombCooldown <= 0) { this._dropBomb(); this.bombCooldown = 0.3; }
    if (Phaser.Input.Keyboard.JustDown(this.kC)) this._deployChaff();

    this._updateBombs(dt);
    this._updateMissiles(dt);
    this._updateChaff(dt);

    // Boss fires back (dodgeable)
    this.bossTimer -= dt;
    if (this.bossTimer <= 0 && this.bunkerHP > 0) {
      this.bossTimer = (2.6 - (BUNKER_LAYERS - this.bunkerHP) * 0.25) * this.dm.spawnRateMult();
      if (this.missiles.length < 3) {
        this._launchMissile(BUNKER_X, BUNKER_TOP + 20, SoundManager, { big: true });
        this._bossYell(1);
      }
    }
    if (this.bossYellT > 0) { this.bossYellT -= dt; if (this.bossYellT <= 0 && this.boss.active) { this.boss.setVisible(true); this.bossYell.setVisible(false); } }

    this._updateHPBar();

    if (this.bunkerHP <= 0 && !this.bombingEnded) {
      this.bombingEnded = true; this._stopAmbient(); this._startExplosion(); return;
    }
    if (this.bombs <= 0 && this.bombObjects.length === 0 && this.bunkerHP > 0 && !this.bombingEnded) {
      this.bombingEnded = true; this._stopAmbient();
      this._setInstr('OUT OF ORDNANCE — RTB', '#ff4444');
      this.time.delayedCall(1500, () => this._startReturn());
    }
  }

  _bossYell(d) {
    this.bossYellT = d;
    try { SoundManager.get().playBossRoar(); } catch (e) { /* audio */ }
    if (this.boss.active) { this.boss.setVisible(false); this.bossYell.setVisible(true); }
  }

  _dropBomb() {
    this.bombs--; this.bombsUsed++;
    try { SoundManager.get().playBombDrop(); } catch (e) { /* audio */ }
    const b = this.add.circle(this.jetX, this.jetY + 18, 5, 0xffcc00).setDepth(9);
    const o = this.add.circle(this.jetX, this.jetY + 18, 7, 0xff8800, 0).setStrokeStyle(2, 0xff8800, 0.6).setDepth(9);
    this.bombObjects.push({ s: b, o, x: this.jetX, y: this.jetY + 18, vx: this.jetVX * 0.5, vy: 0 });
  }

  _updateBombs(dt) {
    for (let i = this.bombObjects.length - 1; i >= 0; i--) {
      const b = this.bombObjects[i];
      b.vy += BOMB_GRAVITY * dt; b.x += b.vx * dt; b.y += b.vy * dt;
      b.s.setPosition(b.x, b.y); b.o.setPosition(b.x, b.y);
      if (b.y >= BUNKER_TOP) {
        const within = Math.abs(b.x - BUNKER_X) < BUNKER_W / 2;
        if (within && b.y < BUNKER_TOP + BUNKER_LAYERS * LAYER_H) {
          const idx = BUNKER_LAYERS - this.bunkerHP;
          if (idx < BUNKER_LAYERS && this.bunkerLayers[idx].alive) {
            this.bunkerLayers[idx].alive = false;
            this.tweens.add({ targets: this.bunkerLayers[idx].parts, alpha: 0.1, duration: 280 });
            this.bunkerHP--;
            try { SoundManager.get().playBombImpact(); } catch (e) { /* audio */ }
            try { SoundManager.get().playBossHit(); } catch (e) { /* audio */ }
            this._addExplosion(b.x, BUNKER_TOP + idx * LAYER_H + 10, 32);
            this.cameras.main.shake(90, 0.005);
            this._bossHitFlash();
            if (this.bunkerHP <= 1) this._fleeSoldiers();
            const t = this.add.text(b.x, BUNKER_TOP - 18, `LAYER ${idx + 1} PENETRATED`, { fontFamily: 'monospace', fontSize: '11px', color: '#00ff00' }).setOrigin(0.5).setDepth(20);
            this.tweens.add({ targets: t, y: BUNKER_TOP - 46, alpha: 0, duration: 950, onComplete: () => t.destroy() });
          }
          this._destroyBomb(i); continue;
        } else if (b.y >= GROUND_Y) {
          try { SoundManager.get().playBombImpact(); } catch (e) { /* audio */ }
          this._addExplosion(b.x, GROUND_Y - 5, 12);
          this._destroyBomb(i); continue;
        }
      }
      if (b.x < -20 || b.x > W + 20 || b.y > H + 20) this._destroyBomb(i);
    }
  }

  _destroyBomb(i) { const b = this.bombObjects[i]; if (!b) return; b.s.destroy(); b.o.destroy(); this.bombObjects.splice(i, 1); }

  _bossHitFlash() {
    if (!this.boss || !this.boss.active) return;
    const ts = [this.boss, this.bossYell];
    ts.forEach((s) => s.active && s.setTint(0xffffff));
    this.time.delayedCall(70, () => ts.forEach((s) => s.active && s.setTint(0xff4444)));
    this.time.delayedCall(170, () => ts.forEach((s) => s.active && s.clearTint()));
    this.tweens.add({ targets: ts, scaleX: 0.55 * 1.08, scaleY: 0.55 * 1.08, duration: 90, yoyo: true });
  }

  _fleeSoldiers() {
    for (const s of this.miniSoldiers) {
      if (s.fleeing || !s.s.active) continue; s.fleeing = true;
      const dir = s.s.x < BUNKER_X ? -1 : 1;
      this.tweens.add({ targets: s.s, x: s.s.x + dir * 80, y: s.s.y + 20, alpha: 0, duration: 800, onComplete: () => s.s.destroy() });
    }
  }

  _updateHPBar() {
    if (!this.hpFill) return;
    const r = Math.max(0, this.bunkerHP / BUNKER_LAYERS);
    this.hpFill.setDisplaySize(200 * r, 12);
    this.hpFill.setFillStyle(r > 0.6 ? 0x44ff44 : (r > 0.3 ? 0xffcc00 : 0xff4444));
  }

  _startExplosion() {
    this.phase = 'explosion';
    this._setInstr('', '#ffffff');
    for (const b of this.bombObjects) { b.s.destroy(); b.o.destroy(); }
    this.bombObjects = [];
    if (this.boss && this.boss.active) {
      this.cameras.main.zoomTo(1.4, 400, 'Power2');
      this.cameras.main.pan(BUNKER_X, BUNKER_TOP + 30, 400, 'Power2');
    }
    this.time.delayedCall(450, () => {
      this.cameras.main.flash(380, 255, 255, 255);
      this.cameras.main.zoomTo(1, 700, 'Power2');
      this.cameras.main.pan(W / 2, H / 2, 700);
      try { SoundManager.get().playExplosion(); } catch (e) { /* audio */ }
      if (this.bossYell) { this.bossYell.destroy(); this.bossYell = null; }
      if (this.boss) { this.boss.destroy(); this.boss = null; }
      for (let i = 0; i < 8; i++) this.time.delayedCall(i * 60, () => this._addExplosion(BUNKER_X + (Math.random() - 0.5) * 120, BUNKER_TOP + Math.random() * 70, 22 + Math.random() * 22));
    });
    this.time.delayedCall(900, () => {
      this.cameras.main.shake(1200, 0.045);
      const fb = this.add.circle(BUNKER_X, BUNKER_TOP + 30, 30, 0xff4400, 0.95).setDepth(16);
      this.tweens.add({ targets: fb, scale: 8, alpha: 0, duration: 1800, onComplete: () => fb.destroy() });
    });
    this.time.delayedCall(1700, () => {
      const elim = this.add.text(W / 2, 70, 'TARGET ELIMINATED', { fontFamily: 'monospace', fontSize: '28px', color: '#ff4400', fontStyle: 'bold', shadow: { offsetX: 0, offsetY: 0, color: '#ff4400', blur: 16, fill: true } }).setOrigin(0.5).setDepth(25);
      this.time.delayedCall(1600, () => {
        const rtb = this.add.text(W / 2, 105, 'RTB — RETURN TO BASE', { fontFamily: 'monospace', fontSize: '16px', color: '#00ff00' }).setOrigin(0.5).setDepth(25);
        this.time.delayedCall(1800, () => { elim.destroy(); rtb.destroy(); this._cleanupBunker(); this._startReturn(); });
      });
    });
  }

  _cleanupBunker() {
    [this.bunkerGfx, this.areaGfx, this.hpBg, this.hpFill, this.hpLabel, this.boss, this.bossYell].forEach((o) => { if (o && o.destroy) o.destroy(); });
    this.bunkerGfx = this.areaGfx = this.hpBg = this.hpFill = this.hpLabel = this.boss = this.bossYell = null;
    for (const l of this.bunkerLayers) for (const p of l.parts) if (p && p.active) p.destroy();
    this.bunkerLayers = [];
    for (const s of this.miniSoldiers) if (s.s && s.s.active) s.s.destroy();
    this.miniSoldiers = [];
  }

  // ═══════════════════════════ RETURN ═══════════════════════════
  _startReturn() {
    this.phase = 'returning';
    this._cleanupBunker();
    try { MusicManager.get().playLevel3Music('landing'); } catch (e) { /* audio */ }
    try { localStorage.setItem('superzion_checkpoint_l2', 'return'); } catch (e) { /* ignore */ }
    this.facingRight = false; this.jet.setFlipX(true);
    this.jetX = W - 280; this.jetY = 190; this.jetVX = -JET_SPEED; this.jetVY = 0;
    this.returnDist = 0; this.terrainStage = 0;
    this.flakTimer = 3;
    for (let i = this.missiles.length - 1; i >= 0; i--) this._killMissile(i);
    this._setBiome('mountain'); this._revealFar();
    this.jet.setRotation(0);
    this._setInstr('Returning to carrier — ↑/↓ altitude', '#888888');
    try { this.ambient = SoundManager.get().playJetEngine(); } catch (e) { /* audio */ }
  }

  _updateReturn(dt) {
    this.facingRight = false;
    this._flyVertical(dt);
    if (this.jetY >= GROUND_Y - 12) { this._die(); return; }
    this.jet.setFlipX(true);
    this._tiltJet(dt);
    this.jetX = W - 280;
    this.jet.setPosition(this.jetX, this.jetY);

    this._scroll(-JET_SPEED, dt);
    this.returnDist += JET_SPEED * dt;

    if (this.returnDist > RETURN_COAST && this.terrainStage === 0) { this.terrainStage = 1; this._setBiome('coast', false); this._setInstr('Passing the coast…', '#888888'); }
    if (this.returnDist > RETURN_SEA && this.terrainStage === 1) { this.terrainStage = 2; this._setBiome('sea', false); this._hideFar(); this._setInstr('Over the sea — carrier ahead', '#888888'); }
    this.hudDist.setText(`CARRIER: ${Math.max(0, Math.round(80 * (1 - this.returnDist / RETURN_HOME)))} km`);

    // light flak on the way out (only before reaching the sea)
    if (this.terrainStage < 2) {
      this.flakTimer -= dt;
      if (this.flakTimer <= 0) { this.flakTimer = 3.2; this._spawnFlak(); }
    }

    if (this.returnDist >= RETURN_HOME) { this._stopAmbient(); this._startLanding(); }
  }

  // ═══════════════════════════ LANDING ═══════════════════════════
  _startLanding() {
    this.phase = 'landing';
    this.facingRight = false; this.jet.setFlipX(true); this.jet.setRotation(0);
    this.jetX = W - 150; this.jetY = 180; this.jetVY = 0;
    this.waveOffs = 0;
    this.carrier.setVisible(true).setPosition(-220, GROUND_Y - 10);
    this.tweens.add({ targets: this.carrier, x: 240, duration: 1800, ease: 'Quad.easeOut' });
    this._setBiome('sea'); this._hideFar();
    this._setInstr('↑ slow descent — ↓ descend — land gently on the deck', '#ffaa00');
    this._createGauge();
    try { SoundManager.get().playLandingGear(); } catch (e) { /* audio */ }
  }

  _createGauge() {
    const gx = W - 30, top = 130, hgt = 200;
    this._g = { gx, top, hgt, vyToY: (vy) => top + Phaser.Math.Clamp((vy + 60) / 260, 0, 1) * hgt };
    const ySafe = this._g.vyToY(LANDING_SAFE_VY);
    const frame = [];
    frame.push(this.add.rectangle(gx, top + hgt / 2, 16, hgt, 0x0a0a18, 0.7).setStrokeStyle(1, 0x66ccff).setDepth(40));
    frame.push(this.add.rectangle(gx, (top + ySafe) / 2, 12, ySafe - top, 0x115522, 0.8).setDepth(40));
    frame.push(this.add.rectangle(gx, (ySafe + top + hgt) / 2, 12, top + hgt - ySafe, 0x551111, 0.8).setDepth(40));
    frame.push(this.add.rectangle(gx, ySafe, 22, 2, 0xff4444).setDepth(41));
    frame.push(this.add.text(gx, top - 16, 'SINK', { fontFamily: 'monospace', fontSize: '10px', color: '#88ddff' }).setOrigin(0.5).setDepth(41));
    this._gFrame = frame;
    this._gNeedle = this.add.rectangle(gx, this._g.vyToY(0), 26, 4, 0x00ff66).setDepth(42);
  }

  _hideGauge() {
    if (this._gFrame) { this._gFrame.forEach((o) => o.destroy()); this._gFrame = null; }
    if (this._gNeedle) { this._gNeedle.destroy(); this._gNeedle = null; }
  }

  _updateLanding(dt) {
    if (this._gNeedle) {
      this._gNeedle.y = this._g.vyToY(this.jetVY);
      this._gNeedle.setFillStyle(this.jetVY > LANDING_SAFE_VY ? 0xff3333 : (this.jetVY > LANDING_SAFE_VY * 0.7 ? 0xffcc00 : 0x00ff66));
    }
    this.jetX -= 46 * dt; this.jetX = Phaser.Math.Clamp(this.jetX, 30, W - 30);
    if (this.cursors.up.isDown) this.jetVY += (CLIMB_RATE * 0.6 - this.jetVY) * VERT_LERP * dt;
    else if (this.cursors.down.isDown) this.jetVY += (DIVE_RATE * 0.6 - this.jetVY) * VERT_LERP * dt;
    else { this.jetVY += (38 - this.jetVY) * VERT_DECAY * dt; this.jetVY += JET_GRAVITY * dt; }
    this.jetVY = Phaser.Math.Clamp(this.jetVY, CLIMB_RATE * 0.8, DIVE_RATE * 0.8);
    this.jetY += this.jetVY * dt;
    this._tiltJet(dt, 0.7);
    this.jet.setPosition(this.jetX, this.jetY);

    if (this.jetY >= DECK_Y) {
      const within = this.jetX >= this.carrier.x - 200 && this.jetX <= this.carrier.x + 200;
      if (within && this.jetVY <= LANDING_SAFE_VY) {
        this.jetY = DECK_Y; this.jetVY = 0; this.jet.setRotation(0); this.jet.setPosition(this.jetX, this.jetY);
        const off = Math.abs(this.jetX - this.carrier.x);
        this.landingQuality = off < 60 ? 'perfect' : (off < 130 ? 'good' : 'rough');
        this._setInstr(this.landingQuality === 'perfect' ? 'PERFECT LANDING!' : (this.landingQuality === 'good' ? 'GOOD LANDING' : 'ROUGH LANDING'),
          this.landingQuality === 'perfect' ? '#00ff00' : (this.landingQuality === 'good' ? '#88ff00' : '#ff8800'));
        try { SoundManager.get().playLandingGear(); } catch (e) { /* audio */ }
        this.tweens.add({ targets: this.jet, x: this.jetX - 40, duration: 800, ease: 'Quad.easeOut' });
        this._hideGauge();
        this.phase = 'landed';
        this.time.delayedCall(1800, () => this._showResults());
      } else {
        // Forgiving: wave off and try again (never an unfair instant death)
        this.waveOffs++;
        this._setInstr('WAVE OFF — go around!', '#ff4444');
        try { SoundManager.get().playMissileWarning(); } catch (e) { /* audio */ }
        this.jetY = 180; this.jetX = W - 150; this.jetVY = 0;
        this.time.delayedCall(1200, () => { if (this.phase === 'landing') this._setInstr('↑ slow descent — ↓ descend — land gently!', '#ffaa00'); });
      }
    }
  }

  // ═══════════════════════════ RESULTS ═══════════════════════════
  _showResults() {
    if (this.phase === 'victory') return;
    this.phase = 'victory';
    this.instr.setVisible(false); this.instrBg.setVisible(false);
    this.hudDist.setText('');
    try { MusicManager.get().stop(1); } catch (e) { /* audio */ }
    try { localStorage.removeItem('superzion_checkpoint_l2'); } catch (e) { /* ignore */ }

    const layers = BUNKER_LAYERS - Math.max(0, this.bunkerHP);
    const success = layers >= BUNKER_LAYERS;
    if (success) try { SoundManager.get().playVictory(); } catch (e) { /* audio */ }

    let stars = 0;
    if (success) {
      if (this.landingQuality === 'perfect' && this.armor >= this.maxArmor) stars = 3;
      else if (this.landingQuality === 'perfect' || this.landingQuality === 'good' || this.armor >= 2) stars = 2;
      else stars = 1;
    }
    try { localStorage.setItem('superzion_stars_2', String(Math.max(stars, parseInt(localStorage.getItem('superzion_stars_2') || '0')))); } catch (e) { /* */ }
    if (success) { try { const prev = parseInt(localStorage.getItem('superzion_level_progress') || '1'); if (3 > prev) localStorage.setItem('superzion_level_progress', '3'); } catch (e) { /* */ } }

    const stats = [
      { label: 'BUNKER LAYERS DESTROYED', value: `${layers}/${BUNKER_LAYERS}` },
      { label: 'BOMBS USED', value: `${this.bombsUsed}/${BOMB_TOTAL}` },
      { label: 'ARMOR REMAINING', value: `${Math.max(0, this.armor)}/${this.maxArmor}` },
      { label: 'LANDING', value: (this.landingQuality || 'N/A').toUpperCase() },
    ];

    if (success) {
      this._end = showVictoryScreen(this, { title: 'MISSION COMPLETE', stats, stars, currentScene: 'BomberScene', nextScene: 'UndergroundIntroCinematicScene' });
    } else {
      this._end = showDefeatScreen(this, { title: 'MISSION FAILED', stats, currentScene: 'BomberScene', skipScene: 'UndergroundIntroCinematicScene' });
    }
  }

  // ═══════════════════════════ PAUSE ═══════════════════════════
  _togglePause() {
    this.isPaused = !this.isPaused;
    if (this.isPaused) {
      this.pauseObjects.push(this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.6).setDepth(60));
      this.pauseObjects.push(this.add.text(W / 2, H / 2 - 30, 'PAUSED', { fontFamily: 'monospace', fontSize: '36px', color: '#ffffff' }).setOrigin(0.5).setDepth(61));
      this.pauseObjects.push(this.add.text(W / 2, H / 2 + 20, 'ESC Resume  |  Q Menu', { fontFamily: 'monospace', fontSize: '14px', color: '#aaaaaa' }).setOrigin(0.5).setDepth(61));
    } else { for (const o of this.pauseObjects) o.destroy(); this.pauseObjects = []; }
  }

  // ═══════════════════════════ UPDATE ═══════════════════════════
  update(time, delta) {
    if (this.tutorialActive) return;
    const dt = Math.min(0.05, delta / 1000);

    if (Phaser.Input.Keyboard.JustDown(this.kM)) {
      const m = SoundManager.get().toggleMute(); MusicManager.get().setMuted(m);
    }
    if (Phaser.Input.Keyboard.JustDown(this.kEsc) && this.phase !== 'victory' && this.phase !== 'dead') { this._togglePause(); return; }
    if (this.isPaused) { if (Phaser.Input.Keyboard.JustDown(this.kQ)) { try { MusicManager.get().stop(0.3); } catch (e) { /* */ } this.scene.start('MenuScene'); } return; }

    if (Phaser.Input.Keyboard.JustDown(this.kP) && this.phase !== 'victory') {
      this._stopAmbient(); this._cleanupBunker(); for (let i = this.missiles.length - 1; i >= 0; i--) this._killMissile(i);
      this.bunkerHP = 0; this.bombsUsed = 5; this.landingQuality = 'good'; this._showResults(); return;
    }

    switch (this.phase) {
      case 'takeoff': this._updateTakeoff(dt); break;
      case 'launching': this._updateLaunching(dt); break;
      case 'flight': this._updateFlight(dt); break;
      case 'bombing': this._updateBombing(dt); break;
      case 'returning': this._updateReturn(dt); break;
      case 'landing': this._updateLanding(dt); break;
    }

    if (this.phase !== 'victory' && this.phase !== 'dead') {
      this._updateTerrain(dt);
      this._updateExplosions(dt);
      this._updateHUD();
    }
    if (['takeoff', 'launching', 'flight', 'bombing', 'returning', 'landing'].includes(this.phase)) this._engineTrail(dt);
    if (this.phase !== 'flight' && this.phase !== 'returning') this.hudDist.setText('');
  }

  shutdown() {
    this.time.timeScale = 1;
    if (this._end) this._end.destroy();
    this._stopAmbient();
    this.tweens.killAll();
    this.time.removeAllEvents();
    for (let i = this.missiles.length - 1; i >= 0; i--) this._killMissile(i);
    for (const b of this.bombObjects) { b.s.destroy(); b.o.destroy(); }
    this.bombObjects = [];
    for (const p of this.chaffParticles) p.s.destroy();
    this.chaffParticles = [];
  }
}
