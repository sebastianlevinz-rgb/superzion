// ═══════════════════════════════════════════════════════════════
// BeirutRadarScene — Level 2: Operation Explosive Interception
// Signal interception radar game: place jammers, activate, intercept
// ═══════════════════════════════════════════════════════════════

import Phaser from 'phaser';
import SoundManager from '../systems/SoundManager.js';
import MusicManager from '../systems/MusicManager.js';
import DifficultyManager from '../systems/DifficultyManager.js';

const W = 960;
const H = 540;

// Signal types
const SIG_GREEN  = 0; // basic, 1pt
const SIG_YELLOW = 1; // encrypted, 3pt
const SIG_RED    = 2; // priority, 5pt

const SIG_COLORS = [0x00ff66, 0xffdd00, 0xff3333];
const SIG_POINTS = [1, 3, 5];
const SIG_RADII  = [4, 5, 6];

// Jammer defaults
const JAMMER_RADIUS_BASE = 70;
const JAMMER_RADIUS_UPGRADED = 95;

// Lebanon map outline (simplified polygon, normalized 0-1 then scaled)
const LEBANON_COAST = [
  {x:0.28,y:0.08},{x:0.26,y:0.14},{x:0.24,y:0.22},{x:0.22,y:0.30},
  {x:0.21,y:0.38},{x:0.22,y:0.44},{x:0.24,y:0.50},{x:0.23,y:0.56},
  {x:0.25,y:0.62},{x:0.27,y:0.68},{x:0.30,y:0.74},{x:0.32,y:0.80},
  {x:0.35,y:0.86},{x:0.38,y:0.92},
];
const LEBANON_EAST = [
  {x:0.38,y:0.92},{x:0.52,y:0.88},{x:0.58,y:0.82},{x:0.62,y:0.74},
  {x:0.60,y:0.66},{x:0.56,y:0.58},{x:0.54,y:0.50},{x:0.50,y:0.42},
  {x:0.48,y:0.34},{x:0.44,y:0.26},{x:0.40,y:0.18},{x:0.36,y:0.12},
  {x:0.28,y:0.08},
];

// Routes signals follow (paths on the map)
const ROUTES = [
  // North-south coastal road
  [{x:0.26,y:0.05},{x:0.24,y:0.20},{x:0.22,y:0.35},{x:0.23,y:0.50},{x:0.26,y:0.65},{x:0.30,y:0.80},{x:0.36,y:0.95}],
  // Beirut east road
  [{x:0.24,y:0.38},{x:0.30,y:0.40},{x:0.38,y:0.42},{x:0.46,y:0.44},{x:0.54,y:0.48}],
  // Mountain road
  [{x:0.36,y:0.12},{x:0.40,y:0.22},{x:0.44,y:0.32},{x:0.48,y:0.42},{x:0.52,y:0.55},{x:0.56,y:0.68}],
  // South road
  [{x:0.52,y:0.88},{x:0.46,y:0.82},{x:0.40,y:0.78},{x:0.34,y:0.82},{x:0.36,y:0.90}],
  // Valley road
  [{x:0.42,y:0.18},{x:0.38,y:0.28},{x:0.34,y:0.38},{x:0.30,y:0.50},{x:0.28,y:0.62},{x:0.32,y:0.75}],
  // Cross road north
  [{x:0.26,y:0.20},{x:0.32,y:0.22},{x:0.38,y:0.24},{x:0.44,y:0.28}],
  // Bekaa valley
  [{x:0.50,y:0.35},{x:0.52,y:0.45},{x:0.54,y:0.55},{x:0.56,y:0.65},{x:0.54,y:0.75},{x:0.52,y:0.85}],
  // Reverse coastal
  [{x:0.36,y:0.95},{x:0.30,y:0.80},{x:0.26,y:0.65},{x:0.23,y:0.50},{x:0.22,y:0.35},{x:0.24,y:0.20},{x:0.26,y:0.05}],
];

export default class BeirutRadarScene extends Phaser.Scene {
  constructor() { super('BeirutRadarScene'); }

  create() {
    this.cameras.main.setBackgroundColor('#0a0e1a');
    this.physics.world.gravity.y = 0;
    MusicManager.get().playLevel2Music();

    this.gameOver = false;
    this.isPaused = false;
    this.pauseObjects = [];

    // State
    this.round = 1;
    this.maxRounds = 2;
    this.phase = 'placing'; // placing | activated | upgrade | results
    this.roundTimer = 30;
    this.roundTimerEvent = null;
    this.totalScore = 0;
    this.roundScores = [];
    this.bestCombo = '';
    this.bestRoundIntercepted = 0;
    this.totalIntercepted = 0;
    this.totalSignals = 0;

    // Upgrades
    this.jammerRadius = JAMMER_RADIUS_BASE;
    this.maxJammers = 3;
    this.hasSlowmo = false;
    this.hasChain = false;
    this.slowmoUsed = false;
    this.slowmoActive = false;

    // Signals
    this.signals = [];
    this.jammers = [];
    this.draggingJammer = null;
    this.activating = false;

    // Radar
    this.radarAngle = 0;

    // Map offset (center Lebanon on screen)
    this.mapOX = W * 0.18;
    this.mapOY = H * 0.02;
    this.mapW = W * 0.64;
    this.mapH = H * 0.96;

    // Create layers
    this._createBackground();
    this._createMapOutline();
    this._createRadarArm();
    this._createHUD();
    this._createScanlines();

    // Start round
    this._startRound(1);

    // Input
    this._setupInput();

    // Ambient sound
    this.ambientSrc = SoundManager.get().playRadarAmbient();

    // Fade in
    this.cameras.main.fadeIn(600, 0, 0, 0);
  }

  // ── BACKGROUND ─────────────────────────────────────────────
  _createBackground() {
    // Dark gradient background
    const gfx = this.add.graphics();
    gfx.setDepth(-10);
    // Radial dark blue gradient approximation
    for (let r = Math.max(W, H); r > 0; r -= 4) {
      const t = r / Math.max(W, H);
      const blue = Math.floor(10 + 20 * t);
      const green = Math.floor(5 + 8 * t);
      gfx.fillStyle(Phaser.Display.Color.GetColor(2, green, blue), 1);
      gfx.fillCircle(W / 2, H / 2, r);
    }

    // Grid lines (subtle)
    const grid = this.add.graphics();
    grid.setDepth(-8);
    grid.lineStyle(1, 0x0a3a2a, 0.15);
    for (let x = 0; x < W; x += 40) {
      grid.lineBetween(x, 0, x, H);
    }
    for (let y = 0; y < H; y += 40) {
      grid.lineBetween(0, y, W, y);
    }
  }

  // ── MAP OUTLINE ────────────────────────────────────────────
  _createMapOutline() {
    this.mapGfx = this.add.graphics();
    this.mapGfx.setDepth(-5);
    this._drawMapOutline();
    this._drawRoutes();
    this._drawCities();
  }

  _toMapX(nx) { return this.mapOX + nx * this.mapW; }
  _toMapY(ny) { return this.mapOY + ny * this.mapH; }

  _drawMapOutline() {
    const g = this.mapGfx;
    // Coast line
    g.lineStyle(2, 0x00aacc, 0.6);
    g.beginPath();
    LEBANON_COAST.forEach((p, i) => {
      if (i === 0) g.moveTo(this._toMapX(p.x), this._toMapY(p.y));
      else g.lineTo(this._toMapX(p.x), this._toMapY(p.y));
    });
    g.strokePath();

    // East border
    g.lineStyle(1.5, 0x005566, 0.4);
    g.beginPath();
    LEBANON_EAST.forEach((p, i) => {
      if (i === 0) g.moveTo(this._toMapX(p.x), this._toMapY(p.y));
      else g.lineTo(this._toMapX(p.x), this._toMapY(p.y));
    });
    g.strokePath();

    // Fill country area (very subtle)
    g.fillStyle(0x003344, 0.15);
    g.beginPath();
    const allPts = [...LEBANON_COAST, ...LEBANON_EAST.slice(1)];
    allPts.forEach((p, i) => {
      if (i === 0) g.moveTo(this._toMapX(p.x), this._toMapY(p.y));
      else g.lineTo(this._toMapX(p.x), this._toMapY(p.y));
    });
    g.closePath();
    g.fillPath();

    // Sea label
    this.add.text(this._toMapX(0.10), this._toMapY(0.45), 'MEDITERRANEAN\nSEA', {
      fontFamily: 'monospace', fontSize: '9px', color: '#1a5566', align: 'center'
    }).setDepth(-4).setAlpha(0.5);
  }

  _drawRoutes() {
    const g = this.mapGfx;
    g.lineStyle(1, 0x004433, 0.25);
    ROUTES.forEach(route => {
      g.beginPath();
      route.forEach((p, i) => {
        if (i === 0) g.moveTo(this._toMapX(p.x), this._toMapY(p.y));
        else g.lineTo(this._toMapX(p.x), this._toMapY(p.y));
      });
      g.strokePath();
    });
  }

  _drawCities() {
    // Beirut
    const bx = this._toMapX(0.24), by = this._toMapY(0.38);
    this.mapGfx.fillStyle(0x00ffcc, 0.5);
    this.mapGfx.fillCircle(bx, by, 3);
    this.add.text(bx + 6, by - 6, 'BEIRUT', {
      fontFamily: 'monospace', fontSize: '8px', color: '#00aa88'
    }).setDepth(-4).setAlpha(0.6);

    // Tripoli
    const tx = this._toMapX(0.25), ty = this._toMapY(0.22);
    this.mapGfx.fillStyle(0x00ffcc, 0.3);
    this.mapGfx.fillCircle(tx, ty, 2);
    this.add.text(tx + 5, ty - 5, 'TRIPOLI', {
      fontFamily: 'monospace', fontSize: '7px', color: '#006655'
    }).setDepth(-4).setAlpha(0.4);

    // Sidon
    const sx = this._toMapX(0.26), sy = this._toMapY(0.58);
    this.mapGfx.fillCircle(sx, sy, 2);
    this.add.text(sx + 5, sy - 5, 'SIDON', {
      fontFamily: 'monospace', fontSize: '7px', color: '#006655'
    }).setDepth(-4).setAlpha(0.4);

    // Baalbek
    const bbx = this._toMapX(0.50), bby = this._toMapY(0.40);
    this.mapGfx.fillCircle(bbx, bby, 2);
    this.add.text(bbx + 5, bby - 5, 'BAALBEK', {
      fontFamily: 'monospace', fontSize: '7px', color: '#006655'
    }).setDepth(-4).setAlpha(0.4);
  }

  // ── RADAR ARM ──────────────────────────────────────────────
  _createRadarArm() {
    this.radarGfx = this.add.graphics();
    this.radarGfx.setDepth(0);
    this.radarCX = this._toMapX(0.38);
    this.radarCY = this._toMapY(0.48);
  }

  _updateRadarArm(dt) {
    this.radarAngle += dt * 0.0008; // ~50s per revolution
    if (this.radarAngle > Math.PI * 2) this.radarAngle -= Math.PI * 2;

    const g = this.radarGfx;
    g.clear();

    const len = 320;
    const cx = this.radarCX, cy = this.radarCY;

    // Trailing fade (several lines behind the arm)
    for (let i = 12; i >= 0; i--) {
      const a = this.radarAngle - i * 0.03;
      const alpha = (0.15 - i * 0.012);
      if (alpha <= 0) continue;
      g.lineStyle(1, 0x00ff44, alpha);
      g.lineBetween(cx, cy, cx + Math.cos(a) * len, cy + Math.sin(a) * len);
    }

    // Main arm
    g.lineStyle(2, 0x00ff66, 0.35);
    g.lineBetween(cx, cy, cx + Math.cos(this.radarAngle) * len, cy + Math.sin(this.radarAngle) * len);

    // Center dot
    g.fillStyle(0x00ff66, 0.4);
    g.fillCircle(cx, cy, 3);
  }

  // ── SCANLINES ──────────────────────────────────────────────
  _createScanlines() {
    const gfx = this.add.graphics();
    gfx.setDepth(200);
    gfx.fillStyle(0x000000, 0.06);
    for (let y = 0; y < H; y += 3) {
      gfx.fillRect(0, y, W, 1);
    }
    // Vignette corners
    gfx.fillStyle(0x000000, 0.3);
    gfx.fillCircle(0, 0, 120);
    gfx.fillCircle(W, 0, 120);
    gfx.fillCircle(0, H, 120);
    gfx.fillCircle(W, H, 120);

    // CRT slight color fringe at edges
    const edge = this.add.graphics();
    edge.setDepth(199);
    edge.lineStyle(2, 0x000000, 0.4);
    edge.strokeRect(0, 0, W, H);
    edge.lineStyle(1, 0x001122, 0.2);
    edge.strokeRect(2, 2, W - 4, H - 4);
  }

  // ── HUD ────────────────────────────────────────────────────
  _createHUD() {
    // Top bar
    this.add.rectangle(W / 2, 16, W, 32, 0x000000, 0.5).setDepth(100);

    // Title
    this.titleText = this.add.text(W / 2, 16, 'OPERATION EXPLOSIVE INTERCEPTION', {
      fontFamily: 'monospace', fontSize: '13px', color: '#00ffaa',
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(101);

    // Round indicator
    this.roundText = this.add.text(16, 16, 'ROUND 1/2', {
      fontFamily: 'monospace', fontSize: '11px', color: '#00cc88'
    }).setOrigin(0, 0.5).setDepth(101);

    // Timer
    this.timerText = this.add.text(W - 16, 16, '30s', {
      fontFamily: 'monospace', fontSize: '13px', color: '#00ff66',
      fontStyle: 'bold'
    }).setOrigin(1, 0.5).setDepth(101);

    // Score
    this.scoreText = this.add.text(W - 140, 16, 'SCORE: 0', {
      fontFamily: 'monospace', fontSize: '11px', color: '#00ddaa'
    }).setOrigin(1, 0.5).setDepth(101);

    // Jammer count
    this.jammerCountText = this.add.text(W / 2, H - 20, '', {
      fontFamily: 'monospace', fontSize: '11px', color: '#00ccff'
    }).setOrigin(0.5).setDepth(101);

    // Instructions
    this.instrText = this.add.text(W / 2, H - 40, 'CLICK TO PLACE JAMMERS — DRAG TO REPOSITION', {
      fontFamily: 'monospace', fontSize: '10px', color: '#448866'
    }).setOrigin(0.5).setDepth(101);

    // Activate button (hidden initially)
    this.activateBtn = this.add.rectangle(W / 2, H - 60, 200, 40, 0x00ff66, 0.15)
      .setDepth(101).setVisible(false).setInteractive({ useHandCursor: true });
    this.activateBtnBorder = this.add.graphics().setDepth(101).setVisible(false);
    this.activateBtnText = this.add.text(W / 2, H - 60, '[ SPACE ] ACTIVATE', {
      fontFamily: 'monospace', fontSize: '14px', color: '#00ff66', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(102).setVisible(false);

    // Combo text (center, hidden)
    this.comboText = this.add.text(W / 2, H / 2, '', {
      fontFamily: 'monospace', fontSize: '28px', color: '#ffffff',
      fontStyle: 'bold', stroke: '#000000', strokeThickness: 4
    }).setOrigin(0.5).setDepth(150).setAlpha(0);

    // Intercept count text
    this.interceptText = this.add.text(W / 2, H / 2 + 40, '', {
      fontFamily: 'monospace', fontSize: '16px', color: '#00ffcc',
      stroke: '#000000', strokeThickness: 3
    }).setOrigin(0.5).setDepth(150).setAlpha(0);

    // Slowmo hint
    this.slowmoText = this.add.text(16, H - 20, '', {
      fontFamily: 'monospace', fontSize: '10px', color: '#ff66ff'
    }).setDepth(101);

    // Hard mode badge
    if (DifficultyManager.get().isHard()) {
      this.add.text(W - 8, 36, 'HARD', {
        fontFamily: 'monospace', fontSize: '10px', color: '#ff4444', fontStyle: 'bold'
      }).setOrigin(1, 0).setDepth(101);
    }
  }

  _updateHUD() {
    const placed = this.jammers.length;
    this.jammerCountText.setText(`JAMMERS: ${placed}/${this.maxJammers}`);

    if (this.hasSlowmo && !this.slowmoUsed && this.phase === 'placing') {
      this.slowmoText.setText('[S] SLOW MOTION');
    } else {
      this.slowmoText.setText('');
    }

    this.scoreText.setText(`SCORE: ${this.totalScore}`);
    this.timerText.setText(`${Math.ceil(this.roundTimer)}s`);
    if (this.roundTimer <= 5) {
      this.timerText.setColor('#ff4444');
    } else {
      this.timerText.setColor('#00ff66');
    }

    // Show activate button when all jammers placed
    const allPlaced = placed >= this.maxJammers;
    this.activateBtn.setVisible(allPlaced && this.phase === 'placing');
    this.activateBtnText.setVisible(allPlaced && this.phase === 'placing');

    if (allPlaced && this.phase === 'placing') {
      this._drawActivateBtn();
      this.instrText.setText('PRESS SPACE TO ACTIVATE ALL JAMMERS');
    } else if (this.phase === 'placing') {
      this.activateBtnBorder.setVisible(false);
      this.instrText.setText(`CLICK TO PLACE JAMMERS (${this.maxJammers - placed} LEFT)`);
    }

    this.roundText.setText(`ROUND ${this.round}/${this.maxRounds}`);
  }

  _drawActivateBtn() {
    const g = this.activateBtnBorder;
    g.setVisible(true);
    g.clear();
    const pulse = 0.4 + 0.3 * Math.sin(this.time.now * 0.005);
    g.lineStyle(2, 0x00ff66, pulse);
    g.strokeRoundedRect(W / 2 - 100, H - 80, 200, 40, 6);
  }

  // ── SIGNALS ────────────────────────────────────────────────
  _spawnSignals(count, includeRed) {
    const types = includeRed
      ? [SIG_GREEN, SIG_GREEN, SIG_GREEN, SIG_YELLOW, SIG_YELLOW, SIG_RED]
      : [SIG_GREEN, SIG_GREEN, SIG_GREEN, SIG_GREEN, SIG_YELLOW, SIG_YELLOW];

    for (let i = 0; i < count; i++) {
      const type = types[Math.floor(Math.random() * types.length)];
      const route = ROUTES[Math.floor(Math.random() * ROUTES.length)];
      const reverse = Math.random() < 0.5;
      const path = reverse ? [...route].reverse() : [...route];
      const speedBase = this.round === 1 ? 0.06 : 0.10;
      const speed = speedBase + Math.random() * 0.04 + (type === SIG_RED ? 0.04 : 0);

      // Stagger spawn
      const delay = Math.random() * 15;

      this.signals.push({
        type,
        path,
        pathIdx: 0,
        progress: 0,
        speed,
        x: this._toMapX(path[0].x),
        y: this._toMapY(path[0].y),
        alive: true,
        spawned: false,
        spawnDelay: delay,
        elapsed: 0,
        pulsePhase: Math.random() * Math.PI * 2,
        intercepted: false,
      });
    }
    this.totalSignals += count;
  }

  _updateSignals(dt) {
    const dtSec = dt / 1000;
    const speedMult = this.slowmoActive ? 0.25 : 1;

    for (const sig of this.signals) {
      if (!sig.alive) continue;

      sig.elapsed += dtSec;
      if (sig.elapsed < sig.spawnDelay) continue;
      sig.spawned = true;

      // Move along path
      sig.progress += sig.speed * dtSec * speedMult;
      if (sig.progress >= 1) {
        sig.progress = 0;
        sig.pathIdx++;
        if (sig.pathIdx >= sig.path.length - 1) {
          sig.alive = false;
          continue;
        }
      }

      const p0 = sig.path[sig.pathIdx];
      const p1 = sig.path[sig.pathIdx + 1];
      sig.x = this._toMapX(p0.x + (p1.x - p0.x) * sig.progress);
      sig.y = this._toMapY(p0.y + (p1.y - p0.y) * sig.progress);
      sig.pulsePhase += dt * 0.006;
    }
  }

  _drawSignals() {
    if (!this.signalGfx) {
      this.signalGfx = this.add.graphics().setDepth(5);
    }
    const g = this.signalGfx;
    g.clear();

    // Check if radar arm is illuminating each signal
    const cx = this.radarCX, cy = this.radarCY;

    for (const sig of this.signals) {
      if (!sig.alive || !sig.spawned) continue;

      const color = SIG_COLORS[sig.type];
      const r = SIG_RADII[sig.type];
      const pulse = 0.6 + 0.4 * Math.sin(sig.pulsePhase);

      // Check angle to radar arm for brightness boost
      const dx = sig.x - cx, dy = sig.y - cy;
      const sigAngle = Math.atan2(dy, dx);
      let angleDiff = Math.abs(sigAngle - this.radarAngle);
      if (angleDiff > Math.PI) angleDiff = Math.PI * 2 - angleDiff;
      const radarBoost = angleDiff < 0.3 ? (1 - angleDiff / 0.3) * 0.5 : 0;

      // Signal dot
      const alpha = 0.5 * pulse + radarBoost;
      g.fillStyle(color, Math.min(alpha, 1));
      g.fillCircle(sig.x, sig.y, r);

      // Radio wave rings
      const waveR = r + 4 + 3 * Math.sin(sig.pulsePhase * 0.7);
      g.lineStyle(1, color, 0.2 * pulse + radarBoost * 0.3);
      g.strokeCircle(sig.x, sig.y, waveR);
      if (sig.type >= SIG_YELLOW) {
        g.strokeCircle(sig.x, sig.y, waveR + 4);
      }
    }
  }

  // ── JAMMERS ────────────────────────────────────────────────
  _placeJammer(x, y) {
    if (this.phase !== 'placing') return;
    if (this.jammers.length >= this.maxJammers) return;

    // Clamp to playable area
    x = Phaser.Math.Clamp(x, 30, W - 30);
    y = Phaser.Math.Clamp(y, 40, H - 30);

    const jammer = {
      x, y,
      radius: this.jammerRadius,
      placed: true,
    };
    this.jammers.push(jammer);

    SoundManager.get().playRadarBlip();
    this._updateHUD();
  }

  _findJammerAt(px, py) {
    for (let i = this.jammers.length - 1; i >= 0; i--) {
      const j = this.jammers[i];
      const dist = Phaser.Math.Distance.Between(px, py, j.x, j.y);
      if (dist < 20) return i;
    }
    return -1;
  }

  _drawJammers() {
    if (!this.jammerGfx) {
      this.jammerGfx = this.add.graphics().setDepth(10);
    }
    const g = this.jammerGfx;
    g.clear();

    for (const j of this.jammers) {
      const pulse = 0.3 + 0.2 * Math.sin(this.time.now * 0.004);

      // Radius circle
      g.lineStyle(1.5, 0x00ccff, 0.15 + pulse * 0.1);
      g.strokeCircle(j.x, j.y, j.radius);

      // Inner fill
      g.fillStyle(0x00ccff, 0.04 + pulse * 0.02);
      g.fillCircle(j.x, j.y, j.radius);

      // Center marker
      g.fillStyle(0x00ccff, 0.6 + pulse * 0.3);
      g.fillCircle(j.x, j.y, 6);

      // Crosshair
      g.lineStyle(1, 0x00ccff, 0.4);
      g.lineBetween(j.x - 12, j.y, j.x - 4, j.y);
      g.lineBetween(j.x + 4, j.y, j.x + 12, j.y);
      g.lineBetween(j.x, j.y - 12, j.x, j.y - 4);
      g.lineBetween(j.x, j.y + 4, j.x, j.y + 12);

      // Blinking ring
      if (Math.sin(this.time.now * 0.008) > 0) {
        g.lineStyle(1, 0x00ffff, 0.3);
        g.strokeCircle(j.x, j.y, 10);
      }
    }
  }

  // ── ACTIVATION ─────────────────────────────────────────────
  _activateJammers() {
    if (this.phase !== 'placing') return;
    if (this.jammers.length === 0) return;

    this.phase = 'activated';
    this.activating = true;
    if (this.roundTimerEvent) this.roundTimerEvent.remove();
    this.instrText.setText('');
    this.activateBtn.setVisible(false);
    this.activateBtnText.setVisible(false);
    this.activateBtnBorder.setVisible(false);

    // Flash
    this.cameras.main.flash(200, 0, 255, 100);

    // Count intercepted signals
    let intercepted = 0;
    let points = 0;
    const interceptedSigs = [];

    for (const sig of this.signals) {
      if (!sig.alive || !sig.spawned) continue;
      for (const j of this.jammers) {
        const dist = Phaser.Math.Distance.Between(sig.x, sig.y, j.x, j.y);
        if (dist <= j.radius) {
          sig.intercepted = true;
          intercepted++;
          points += SIG_POINTS[sig.type];
          interceptedSigs.push({ ...sig });
          break;
        }
      }
    }

    // Chain reaction upgrade
    if (this.hasChain) {
      let chainMore = true;
      while (chainMore) {
        chainMore = false;
        for (const sig of this.signals) {
          if (!sig.alive || !sig.spawned || sig.intercepted) continue;
          for (const ic of interceptedSigs) {
            const dist = Phaser.Math.Distance.Between(sig.x, sig.y, ic.x, ic.y);
            if (dist <= 30) {
              sig.intercepted = true;
              intercepted++;
              points += SIG_POINTS[sig.type];
              interceptedSigs.push({ ...sig });
              chainMore = true;
              break;
            }
          }
        }
      }
    }

    // Animate expansion + intercepts
    this._animateActivation(interceptedSigs, intercepted, points);

    // Update stats
    this.totalIntercepted += intercepted;
    this.totalScore += points;
    this.roundScores.push(intercepted);
    if (intercepted > this.bestRoundIntercepted) this.bestRoundIntercepted = intercepted;

    SoundManager.get().playRadarIntercept();
  }

  _animateActivation(interceptedSigs, intercepted, points) {
    // Expanding rings from each jammer
    const rings = [];
    for (const j of this.jammers) {
      rings.push({ x: j.x, y: j.y, r: 0, maxR: j.radius, alpha: 1 });
    }

    // Particle system for intercepted signals
    this.particles = [];
    for (const sig of interceptedSigs) {
      const count = sig.type === SIG_RED ? 16 : sig.type === SIG_YELLOW ? 12 : 8;
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + Math.random() * 0.3;
        const speed = 40 + Math.random() * 80;
        this.particles.push({
          x: sig.x, y: sig.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          color: SIG_COLORS[sig.type],
          life: 1,
          decay: 0.8 + Math.random() * 0.5,
          size: 2 + Math.random() * 2,
        });
      }
    }

    // Kill intercepted signals
    for (const sig of this.signals) {
      if (sig.intercepted) sig.alive = false;
    }

    // Expansion animation
    this.activationRings = rings;
    this.activationTimer = 0;
    this.activationDuration = 1.2;

    // Combo text
    let comboLabel = '';
    if (intercepted >= 40) { comboLabel = 'PERFECT OPERATION!'; points += 500; this.totalScore += 500; }
    else if (intercepted >= 30) { comboLabel = 'INCREDIBLE!'; points += 300; this.totalScore += 300; }
    else if (intercepted >= 20) { comboLabel = 'GREAT!'; points += 150; this.totalScore += 150; }
    else if (intercepted >= 10) { comboLabel = 'GOOD!'; points += 50; this.totalScore += 50; }

    if (comboLabel && (!this.bestCombo || intercepted > this._comboThreshold(this.bestCombo))) {
      this.bestCombo = comboLabel;
    }

    this.interceptText.setText(`SIGNALS INTERCEPTED: ${intercepted}`);
    this.interceptText.setAlpha(1);
    this.tweens.add({
      targets: this.interceptText,
      alpha: 0,
      y: H / 2 + 20,
      duration: 2500,
      ease: 'Power2',
      onComplete: () => { this.interceptText.y = H / 2 + 40; }
    });

    if (comboLabel) {
      this.comboText.setText(comboLabel);
      this.comboText.setAlpha(1);
      this.comboText.setScale(0.5);
      this.tweens.add({
        targets: this.comboText,
        alpha: 0,
        scaleX: 1.2,
        scaleY: 1.2,
        duration: 2000,
        ease: 'Power2',
        onComplete: () => { this.comboText.setScale(1); }
      });

      // Screen shake for big combos
      if (intercepted >= 20) {
        this.cameras.main.shake(300, intercepted >= 30 ? 0.015 : 0.008);
      }
    }

    SoundManager.get().playInterceptSuccess();

    // After animation, advance to next phase
    this.time.delayedCall(2500, () => {
      this.activating = false;
      if (this.round < this.maxRounds) {
        this._showUpgradeScreen();
      } else {
        this._showResults();
      }
    });
  }

  _comboThreshold(label) {
    if (label === 'PERFECT OPERATION!') return 40;
    if (label === 'INCREDIBLE!') return 30;
    if (label === 'GREAT!') return 20;
    if (label === 'GOOD!') return 10;
    return 0;
  }

  _updateActivationEffects(dt) {
    if (!this.activationRings) return;
    const dtSec = dt / 1000;
    this.activationTimer += dtSec;

    if (!this.activationGfx) {
      this.activationGfx = this.add.graphics().setDepth(15);
    }
    const g = this.activationGfx;
    g.clear();

    // Expanding rings
    const progress = Math.min(this.activationTimer / this.activationDuration, 1);
    for (const ring of this.activationRings) {
      ring.r = ring.maxR * Phaser.Math.Easing.Cubic.Out(progress);
      ring.alpha = 1 - progress;
      g.lineStyle(3, 0x00ffff, ring.alpha * 0.6);
      g.strokeCircle(ring.x, ring.y, ring.r);
      g.fillStyle(0x00ffff, ring.alpha * 0.08);
      g.fillCircle(ring.x, ring.y, ring.r);
    }

    // Particles
    if (this.particles) {
      for (const p of this.particles) {
        p.x += p.vx * dtSec;
        p.y += p.vy * dtSec;
        p.life -= p.decay * dtSec;
        if (p.life <= 0) continue;
        g.fillStyle(p.color, p.life);
        g.fillCircle(p.x, p.y, p.size * p.life);
      }
      this.particles = this.particles.filter(p => p.life > 0);
    }

    if (progress >= 1 && (!this.particles || this.particles.length === 0)) {
      this.activationRings = null;
      g.clear();
    }
  }

  // ── ROUNDS ─────────────────────────────────────────────────
  _startRound(num) {
    this.round = num;
    this.phase = 'placing';
    this.jammers = [];
    this.signals = [];
    this.roundTimer = 30;
    this.slowmoUsed = false;
    this.slowmoActive = false;
    this.activating = false;

    if (this.activationGfx) this.activationGfx.clear();
    this.activationRings = null;
    this.particles = [];

    // Spawn signals
    if (num === 1) {
      this._spawnSignals(40, false);
    } else {
      this._spawnSignals(80, true);
    }

    // Timer
    this.roundTimerEvent = this.time.addEvent({
      delay: 1000,
      callback: () => {
        if (this.isPaused || this.phase !== 'placing') return;
        this.roundTimer--;
        if (this.roundTimer <= 5 && this.roundTimer > 0) {
          SoundManager.get().playCountdownTick();
        }
        if (this.roundTimer <= 0) {
          this._activateJammers();
        }
      },
      repeat: 29,
    });

    this._updateHUD();
  }

  // ── UPGRADE SCREEN ─────────────────────────────────────────
  _showUpgradeScreen() {
    this.phase = 'upgrade';
    this.instrText.setText('');

    // Dim overlay
    this.upgradeOverlay = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.7).setDepth(180);

    this.add.text(W / 2, 60, 'CHOOSE UPGRADE', {
      fontFamily: 'monospace', fontSize: '22px', color: '#00ffcc', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(181).setName('upgrade_title');

    this.add.text(W / 2, 95, `Round 1 — ${this.roundScores[0]} signals intercepted`, {
      fontFamily: 'monospace', fontSize: '12px', color: '#448866'
    }).setOrigin(0.5).setDepth(181).setName('upgrade_sub');

    const upgrades = [
      { key: 'range', label: 'RANGE+', desc: 'Jammers have 35% bigger radius', color: '#00ff66' },
      { key: 'extra', label: 'JAMMER EXTRA', desc: '4 jammers instead of 3', color: '#00ccff' },
      { key: 'slowmo', label: 'SLOWMO', desc: 'Press S for 3s slow motion', color: '#ff66ff' },
      { key: 'chain', label: 'CHAIN', desc: 'Intercepted signals damage nearby ones', color: '#ffaa00' },
    ];

    this.upgradeButtons = [];
    const startY = 160;
    const gap = 80;

    upgrades.forEach((upg, i) => {
      const y = startY + i * gap;
      const bg = this.add.rectangle(W / 2, y, 360, 60, 0x112233, 0.8)
        .setDepth(181).setInteractive({ useHandCursor: true }).setName(`upg_bg_${i}`);
      const border = this.add.graphics().setDepth(181).setName(`upg_border_${i}`);
      border.lineStyle(1.5, Phaser.Display.Color.HexStringToColor(upg.color).color, 0.6);
      border.strokeRoundedRect(W / 2 - 180, y - 30, 360, 60, 8);

      const title = this.add.text(W / 2, y - 10, upg.label, {
        fontFamily: 'monospace', fontSize: '16px', color: upg.color, fontStyle: 'bold'
      }).setOrigin(0.5).setDepth(182).setName(`upg_title_${i}`);

      const desc = this.add.text(W / 2, y + 12, upg.desc, {
        fontFamily: 'monospace', fontSize: '10px', color: '#668877'
      }).setOrigin(0.5).setDepth(182).setName(`upg_desc_${i}`);

      bg.on('pointerover', () => bg.setFillStyle(0x224455, 0.9));
      bg.on('pointerout', () => bg.setFillStyle(0x112233, 0.8));
      bg.on('pointerdown', () => this._selectUpgrade(upg.key));

      this.upgradeButtons.push({ bg, border, title, desc });
    });

    // Also allow keyboard 1-4
    this._upgradeKeys = this.input.keyboard.addKeys({
      one: Phaser.Input.Keyboard.KeyCodes.ONE,
      two: Phaser.Input.Keyboard.KeyCodes.TWO,
      three: Phaser.Input.Keyboard.KeyCodes.THREE,
      four: Phaser.Input.Keyboard.KeyCodes.FOUR,
    });
  }

  _selectUpgrade(key) {
    switch (key) {
      case 'range':
        this.jammerRadius = JAMMER_RADIUS_UPGRADED;
        break;
      case 'extra':
        this.maxJammers = 4;
        break;
      case 'slowmo':
        this.hasSlowmo = true;
        break;
      case 'chain':
        this.hasChain = true;
        break;
    }

    SoundManager.get().playRadarMark();
    this._clearUpgradeScreen();
    this._startRound(2);
  }

  _clearUpgradeScreen() {
    if (this.upgradeOverlay) { this.upgradeOverlay.destroy(); this.upgradeOverlay = null; }
    // Destroy all named upgrade objects
    const names = ['upgrade_title', 'upgrade_sub'];
    for (let i = 0; i < 4; i++) {
      names.push(`upg_bg_${i}`, `upg_border_${i}`, `upg_title_${i}`, `upg_desc_${i}`);
    }
    for (const name of names) {
      const obj = this.children.getByName(name);
      if (obj) obj.destroy();
    }
    this.upgradeButtons = [];
    if (this._upgradeKeys) {
      this.input.keyboard.removeKey(this._upgradeKeys.one);
      this.input.keyboard.removeKey(this._upgradeKeys.two);
      this.input.keyboard.removeKey(this._upgradeKeys.three);
      this.input.keyboard.removeKey(this._upgradeKeys.four);
      this._upgradeKeys = null;
    }
  }

  // ── RESULTS SCREEN ─────────────────────────────────────────
  _showResults() {
    this.phase = 'results';
    this.instrText.setText('');

    // Stop ambient
    if (this.ambientSrc) { try { this.ambientSrc.stop(); } catch (e) {} }

    MusicManager.get().stop(1);

    // Rating
    const pct = this.totalIntercepted / Math.max(this.totalSignals, 1);
    let stars = 1;
    if (pct >= 0.7) stars = 2;
    if (pct >= 0.85) stars = 3;
    const starStr = '★'.repeat(stars) + '☆'.repeat(3 - stars);

    // Overlay
    const overlay = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.8).setDepth(200);

    const lines = [
      { text: 'MISSION COMPLETE', size: '24px', color: '#00ffcc', y: 80 },
      { text: 'OPERATION EXPLOSIVE INTERCEPTION', size: '14px', color: '#448866', y: 110 },
      { text: `Signals Intercepted: ${this.totalIntercepted}/${this.totalSignals}`, size: '14px', color: '#00ddaa', y: 160 },
      { text: `Best Round: ${this.bestRoundIntercepted} intercepted`, size: '12px', color: '#00aa88', y: 190 },
      { text: `Best Combo: ${this.bestCombo || 'NONE'}`, size: '12px', color: '#00aa88', y: 215 },
      { text: `Total Score: ${this.totalScore}`, size: '18px', color: '#00ff66', y: 260 },
      { text: starStr, size: '32px', color: '#ffdd00', y: 310 },
      { text: 'PRESS ENTER TO CONTINUE', size: '12px', color: '#446655', y: 400 },
    ];

    lines.forEach(l => {
      this.add.text(W / 2, l.y, l.text, {
        fontFamily: 'monospace', fontSize: l.size, color: l.color,
        fontStyle: l.size === '24px' || l.size === '18px' ? 'bold' : 'normal'
      }).setOrigin(0.5).setDepth(201);
    });

    SoundManager.get().playVictory();
    this._resultReady = true;
  }

  // ── INPUT ──────────────────────────────────────────────────
  _setupInput() {
    this.input.on('pointerdown', (pointer) => {
      if (this.isPaused || this.phase !== 'placing') return;

      // Check if clicking on existing jammer (start drag)
      const idx = this._findJammerAt(pointer.x, pointer.y);
      if (idx >= 0) {
        this.draggingJammer = idx;
        return;
      }

      // Place new jammer
      this._placeJammer(pointer.x, pointer.y);
    });

    this.input.on('pointermove', (pointer) => {
      if (this.draggingJammer !== null && pointer.isDown) {
        const j = this.jammers[this.draggingJammer];
        if (j) {
          j.x = Phaser.Math.Clamp(pointer.x, 30, W - 30);
          j.y = Phaser.Math.Clamp(pointer.y, 40, H - 30);
        }
      }
    });

    this.input.on('pointerup', () => {
      this.draggingJammer = null;
    });

    // Keyboard
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    this.escKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    this.sKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
    this.pKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P);
    this.mKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.M);
    this.rKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);
    this.yKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Y);
    this.nKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.N);
  }

  // ── PAUSE ──────────────────────────────────────────────────
  _togglePause() {
    this.isPaused = !this.isPaused;
    if (this.isPaused) {
      this.pauseOverlay = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.6).setDepth(300);
      this.pauseText = this.add.text(W / 2, H / 2 - 20, 'PAUSED', {
        fontFamily: 'monospace', fontSize: '28px', color: '#00ffcc', fontStyle: 'bold'
      }).setOrigin(0.5).setDepth(301);
      this.pauseSubText = this.add.text(W / 2, H / 2 + 20, 'ESC to resume — R to restart — Q to menu', {
        fontFamily: 'monospace', fontSize: '11px', color: '#448866'
      }).setOrigin(0.5).setDepth(301);
      this.pauseObjects = [this.pauseOverlay, this.pauseText, this.pauseSubText];
    } else {
      this.pauseObjects.forEach(o => o.destroy());
      this.pauseObjects = [];
    }
  }

  // ── SKIP PROMPT ────────────────────────────────────────────
  _showSkipPrompt() {
    if (this.skipPromptShown) return;
    this.skipPromptShown = true;
    this.isPaused = true;
    this.skipBg = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.6).setDepth(300);
    this.skipText = this.add.text(W / 2, H / 2 - 10, 'SKIP LEVEL?', {
      fontFamily: 'monospace', fontSize: '20px', color: '#ffcc00', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(301);
    this.skipSubText = this.add.text(W / 2, H / 2 + 15, 'Y = Skip   N = Cancel', {
      fontFamily: 'monospace', fontSize: '12px', color: '#888'
    }).setOrigin(0.5).setDepth(301);
  }

  _handleSkipResponse() {
    if (!this.skipPromptShown) return;
    if (Phaser.Input.Keyboard.JustDown(this.yKey)) {
      this._cleanupAndTransition();
    } else if (Phaser.Input.Keyboard.JustDown(this.nKey)) {
      this.skipBg.destroy();
      this.skipText.destroy();
      this.skipSubText.destroy();
      this.skipPromptShown = false;
      this.isPaused = false;
    }
  }

  _cleanupAndTransition() {
    if (this.ambientSrc) { try { this.ambientSrc.stop(); } catch (e) {} }
    MusicManager.get().stop(0.5);
    this.cameras.main.fadeOut(500, 0, 0, 0);
    this.time.delayedCall(600, () => {
      this.scene.start('DeepStrikeIntroCinematicScene');
    });
  }

  // ── SLOWMO ─────────────────────────────────────────────────
  _activateSlowmo() {
    if (!this.hasSlowmo || this.slowmoUsed || this.phase !== 'placing') return;
    this.slowmoUsed = true;
    this.slowmoActive = true;
    SoundManager.get().playRadarBlip();

    // Visual tint
    this.cameras.main.flash(100, 100, 0, 150);

    this.time.delayedCall(3000, () => {
      this.slowmoActive = false;
    });
  }

  // ── UPDATE LOOP ────────────────────────────────────────────
  update(time, delta) {
    // Skip prompt takes priority
    if (this.skipPromptShown) {
      this._handleSkipResponse();
      return;
    }

    // Mute toggle
    if (Phaser.Input.Keyboard.JustDown(this.mKey)) {
      const muted = SoundManager.get().toggleMute();
      MusicManager.get().setMuted(muted);
    }

    // Pause
    if (Phaser.Input.Keyboard.JustDown(this.escKey)) {
      this._togglePause();
      return;
    }
    if (this.isPaused) {
      if (Phaser.Input.Keyboard.JustDown(this.rKey)) {
        if (this.ambientSrc) { try { this.ambientSrc.stop(); } catch (e) {} }
        this.scene.restart();
      }
      return;
    }

    // Skip
    if (Phaser.Input.Keyboard.JustDown(this.pKey)) {
      this._showSkipPrompt();
      return;
    }

    const dt = Math.min(delta, 33);

    // Radar arm always rotates
    this._updateRadarArm(dt);

    if (this.phase === 'placing') {
      // Space = activate
      if (Phaser.Input.Keyboard.JustDown(this.spaceKey) && this.jammers.length > 0) {
        this._activateJammers();
      }

      // Slowmo
      if (Phaser.Input.Keyboard.JustDown(this.sKey)) {
        this._activateSlowmo();
      }

      this._updateSignals(dt);
      this._drawSignals();
      this._drawJammers();
      this._updateHUD();
    } else if (this.phase === 'activated') {
      this._updateSignals(dt);
      this._drawSignals();
      this._drawJammers();
      this._updateActivationEffects(dt);
      this._updateHUD();
    } else if (this.phase === 'upgrade') {
      this._updateSignals(dt);
      this._drawSignals();
      // Keyboard selection
      if (this._upgradeKeys) {
        if (Phaser.Input.Keyboard.JustDown(this._upgradeKeys.one)) this._selectUpgrade('range');
        else if (Phaser.Input.Keyboard.JustDown(this._upgradeKeys.two)) this._selectUpgrade('extra');
        else if (Phaser.Input.Keyboard.JustDown(this._upgradeKeys.three)) this._selectUpgrade('slowmo');
        else if (Phaser.Input.Keyboard.JustDown(this._upgradeKeys.four)) this._selectUpgrade('chain');
      }
    } else if (this.phase === 'results') {
      if (this._resultReady && Phaser.Input.Keyboard.JustDown(this.enterKey)) {
        this._cleanupAndTransition();
      }
    }
  }

  shutdown() {
    if (this.ambientSrc) { try { this.ambientSrc.stop(); } catch (e) {} }
  }
}
