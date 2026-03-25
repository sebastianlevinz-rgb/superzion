// ═══════════════════════════════════════════════════════════════
// BeirutRadarScene — Level 2: Operation Grim Beeper
// Top-down stealth: infiltrate Hezbollah building, plant beepers
// in enemy pagers, then trigger chain detonation
// ═══════════════════════════════════════════════════════════════

import Phaser from 'phaser';
import SoundManager from '../systems/SoundManager.js';
import MusicManager from '../systems/MusicManager.js';
import DifficultyManager from '../systems/DifficultyManager.js';
import { showVictoryScreen, showDefeatScreen } from '../ui/EndScreen.js';
import { showTutorialOverlay } from '../ui/ControlsOverlay.js';

const W = 960;
const H = 540;

// ── Colors ─────────────────────────────────────────────────────
const COL_WALL       = 0x3a3a3a;
const COL_FLOOR      = 0xc8b898;
const COL_GRID       = 0xb0a080;
const COL_DOOR       = 0x9a8a6a;
const COL_PAGER_GLOW = 0x00ccff;
const COL_GUARD      = 0xcc2222;
const COL_VISION     = 0x44ff44;
const COL_CAMERA     = 0xff6600;
const COL_PLAYER     = 0x2288ff;
const COL_STAIR      = 0xffcc00;
const COL_DESK       = 0x665544;
const COL_PLANTED    = 0x00ff44;

// ── Player settings ────────────────────────────────────────────
const PLAYER_SIZE    = 12;
const PLAYER_SPEED   = 140;
const PLANT_DURATION = 2000; // ms

// ── Guard settings ─────────────────────────────────────────────
const GUARD_SIZE        = 12;
const GUARD_SPEED       = 50;
const VISION_RANGE      = 120;
const VISION_ANGLE      = Math.PI / 4; // half-angle of cone
const ALERT_DECAY_RATE  = 8;  // suspicion % drop per second when hidden
const ALERT_RISE_RATE   = 35; // suspicion % rise per second when spotted
const CAMERA_RANGE      = 150;
const CAMERA_CONE_ANGLE = Math.PI / 5;

// ── Floor layouts ──────────────────────────────────────────────
// Each floor: { walls, doors, desks, pagers, guardRoutes, stairs, cameraPos }
// Coordinates relative to play area (60, 50) -> (900, 500)
// Walls are { x, y, w, h } rectangles
// Pagers are { x, y } positions (center of desk glow)
// GuardRoutes are arrays of { x, y } waypoints
// Stairs: { x, y } zone to change floors

function buildFloor1() {
  return {
    walls: [
      // Outer walls
      { x: 60, y: 50, w: 840, h: 8 },     // top
      { x: 60, y: 50, w: 8, h: 450 },      // left
      { x: 892, y: 50, w: 8, h: 450 },     // right
      { x: 60, y: 492, w: 370, h: 8 },     // bottom-left
      { x: 530, y: 492, w: 370, h: 8 },    // bottom-right
      // Interior walls
      { x: 300, y: 50, w: 8, h: 200 },     // vertical divider left
      { x: 600, y: 50, w: 8, h: 200 },     // vertical divider right
      { x: 300, y: 300, w: 308, h: 8 },    // horizontal corridor wall
      { x: 68, y: 250, w: 232, h: 8 },     // left room divider
      { x: 608, y: 250, w: 292, h: 8 },    // right room divider
      // Small rooms
      { x: 450, y: 380, w: 8, h: 120 },    // bottom center divider
    ],
    doors: [
      // Gaps in walls (lighter colored patches)
      { x: 430, y: 492, w: 100, h: 8 },    // entrance
      { x: 300, y: 130, w: 8, h: 50 },     // left room door
      { x: 600, y: 130, w: 8, h: 50 },     // right room door
      { x: 140, y: 250, w: 60, h: 8 },     // left lower door
      { x: 700, y: 250, w: 60, h: 8 },     // right lower door
      { x: 400, y: 300, w: 60, h: 8 },     // corridor door
    ],
    desks: [
      { x: 150, y: 120, w: 60, h: 30 },
      { x: 450, y: 120, w: 60, h: 30 },
      { x: 750, y: 120, w: 60, h: 30 },
      { x: 150, y: 380, w: 60, h: 30 },
      { x: 600, y: 400, w: 60, h: 30 },
    ],
    pagers: [
      { x: 180, y: 120 },
      { x: 480, y: 120 },
    ],
    guardRoutes: [
      // Guard 1: patrols top corridor
      [{ x: 350, y: 180 }, { x: 550, y: 180 }, { x: 550, y: 100 }, { x: 350, y: 100 }],
      // Guard 2: patrols bottom area
      [{ x: 200, y: 400 }, { x: 400, y: 400 }, { x: 400, y: 350 }, { x: 200, y: 350 }],
    ],
    stairs: { x: 850, y: 80, w: 40, h: 40 },
    cameraPos: null, // no camera on floor 1
  };
}

function buildFloor2() {
  return {
    walls: [
      // Outer walls
      { x: 60, y: 50, w: 840, h: 8 },
      { x: 60, y: 50, w: 8, h: 450 },
      { x: 892, y: 50, w: 8, h: 450 },
      { x: 60, y: 492, w: 840, h: 8 },
      // Interior - more complex layout
      { x: 250, y: 50, w: 8, h: 160 },     // room divider 1
      { x: 500, y: 50, w: 8, h: 160 },     // room divider 2
      { x: 700, y: 50, w: 8, h: 160 },     // room divider 3
      { x: 68, y: 210, w: 832, h: 8 },     // main corridor top
      { x: 68, y: 310, w: 832, h: 8 },     // main corridor bottom
      { x: 200, y: 318, w: 8, h: 182 },    // lower room 1
      { x: 450, y: 318, w: 8, h: 182 },    // lower room 2
      { x: 680, y: 318, w: 8, h: 182 },    // lower room 3
    ],
    doors: [
      { x: 250, y: 100, w: 8, h: 50 },
      { x: 500, y: 100, w: 8, h: 50 },
      { x: 700, y: 100, w: 8, h: 50 },
      { x: 300, y: 210, w: 60, h: 8 },
      { x: 600, y: 210, w: 60, h: 8 },
      { x: 200, y: 380, w: 8, h: 50 },
      { x: 450, y: 380, w: 8, h: 50 },
      { x: 680, y: 380, w: 8, h: 50 },
      { x: 150, y: 310, w: 50, h: 8 },
      { x: 550, y: 310, w: 50, h: 8 },
      { x: 800, y: 310, w: 50, h: 8 },
    ],
    desks: [
      { x: 130, y: 120, w: 50, h: 25 },
      { x: 370, y: 120, w: 50, h: 25 },
      { x: 590, y: 120, w: 50, h: 25 },
      { x: 790, y: 120, w: 50, h: 25 },
      { x: 110, y: 400, w: 50, h: 25 },
      { x: 330, y: 400, w: 50, h: 25 },
      { x: 560, y: 400, w: 50, h: 25 },
      { x: 790, y: 400, w: 50, h: 25 },
    ],
    pagers: [
      { x: 155, y: 120 },
      { x: 615, y: 120 },
      { x: 355, y: 400 },
    ],
    guardRoutes: [
      // Guard 1: patrols top rooms
      [{ x: 150, y: 130 }, { x: 400, y: 130 }, { x: 400, y: 80 }, { x: 150, y: 80 }],
      // Guard 2: corridor patrol
      [{ x: 100, y: 260 }, { x: 860, y: 260 }],
      // Guard 3: bottom rooms
      [{ x: 300, y: 420 }, { x: 600, y: 420 }, { x: 600, y: 360 }, { x: 300, y: 360 }],
    ],
    stairs: { x: 850, y: 80, w: 40, h: 40 },
    stairsDown: { x: 850, y: 440, w: 40, h: 40 },
    cameraPos: null,
  };
}

function buildFloor3() {
  return {
    walls: [
      // Outer walls
      { x: 60, y: 50, w: 840, h: 8 },
      { x: 60, y: 50, w: 8, h: 450 },
      { x: 892, y: 50, w: 8, h: 450 },
      { x: 60, y: 492, w: 840, h: 8 },
      // Interior - tight security layout
      { x: 300, y: 50, w: 8, h: 120 },
      { x: 600, y: 50, w: 8, h: 120 },
      { x: 68, y: 170, w: 832, h: 8 },     // upper corridor
      { x: 68, y: 280, w: 832, h: 8 },     // mid corridor
      { x: 68, y: 380, w: 832, h: 8 },     // lower corridor
      { x: 250, y: 178, w: 8, h: 102 },
      { x: 500, y: 178, w: 8, h: 102 },
      { x: 750, y: 178, w: 8, h: 102 },
      { x: 200, y: 388, w: 8, h: 112 },
      { x: 400, y: 388, w: 8, h: 112 },
      { x: 650, y: 388, w: 8, h: 112 },
    ],
    doors: [
      { x: 300, y: 80, w: 8, h: 40 },
      { x: 600, y: 80, w: 8, h: 40 },
      { x: 350, y: 170, w: 50, h: 8 },
      { x: 650, y: 170, w: 50, h: 8 },
      { x: 250, y: 210, w: 8, h: 40 },
      { x: 500, y: 210, w: 8, h: 40 },
      { x: 750, y: 210, w: 8, h: 40 },
      { x: 300, y: 280, w: 50, h: 8 },
      { x: 600, y: 280, w: 50, h: 8 },
      { x: 200, y: 420, w: 8, h: 40 },
      { x: 400, y: 420, w: 8, h: 40 },
      { x: 650, y: 420, w: 8, h: 40 },
      { x: 150, y: 380, w: 50, h: 8 },
      { x: 500, y: 380, w: 50, h: 8 },
    ],
    desks: [
      { x: 150, y: 100, w: 50, h: 25 },
      { x: 450, y: 100, w: 50, h: 25 },
      { x: 750, y: 100, w: 50, h: 25 },
      { x: 150, y: 230, w: 50, h: 25 },
      { x: 370, y: 230, w: 50, h: 25 },
      { x: 620, y: 230, w: 50, h: 25 },
      { x: 830, y: 230, w: 50, h: 25 },
      { x: 120, y: 440, w: 50, h: 25 },
      { x: 300, y: 440, w: 50, h: 25 },
      { x: 530, y: 440, w: 50, h: 25 },
      { x: 780, y: 440, w: 50, h: 25 },
    ],
    pagers: [
      { x: 175, y: 100 },
      { x: 475, y: 100 },
      { x: 645, y: 230 },
    ],
    guardRoutes: [
      // Guard 1: top rooms
      [{ x: 150, y: 110 }, { x: 450, y: 110 }, { x: 450, y: 80 }, { x: 150, y: 80 }],
      // Guard 2: middle corridor
      [{ x: 100, y: 230 }, { x: 860, y: 230 }],
      // Guard 3: bottom area
      [{ x: 120, y: 440 }, { x: 350, y: 440 }, { x: 350, y: 410 }, { x: 120, y: 410 }],
    ],
    stairs: null, // top floor
    stairsDown: { x: 850, y: 440, w: 40, h: 40 },
    // Security camera
    cameraPos: { x: 480, y: 290, angle: Math.PI / 2, sweepRange: Math.PI * 0.6, sweepSpeed: 0.8 },
  };
}

const FLOOR_BUILDERS = [buildFloor1, buildFloor2, buildFloor3];
const TOTAL_BEEPERS = 8; // 2 + 3 + 3

export default class BeirutRadarScene extends Phaser.Scene {
  constructor() { super('BeirutRadarScene'); }

  create() {
    this.cameras.main.setBackgroundColor('#1a1a10');
    this.physics.world.gravity.y = 0;
    MusicManager.get().playLevel2Music();

    this.gameOver = false;
    this.isPaused = false;
    this.pauseObjects = [];

    // ── State ───────────────────────────────────────────────────
    this.currentFloor = 0;        // 0-indexed
    this.beepersPlanted = 0;
    this.suspicion = 0;           // 0-100
    this.isPlanting = false;
    this.plantProgress = 0;       // 0 - PLANT_DURATION
    this.plantTarget = null;
    this.isHiding = false;
    this.startTime = Date.now();
    this.maxSuspicionReached = 0;
    this.alertCooldown = 0;       // cooldown for alert sound

    // Phase: 'playing' | 'detonation' | 'victory' | 'defeat'
    this.phase = 'playing';

    // Difficulty
    this.isHard = DifficultyManager.get().isHard();
    this.alertRiseRate = this.isHard ? ALERT_RISE_RATE * 1.4 : ALERT_RISE_RATE;
    this.guardSpeedMult = this.isHard ? 1.3 : 1;

    // ── Build floors ────────────────────────────────────────────
    this.floors = FLOOR_BUILDERS.map(fn => fn());
    this._initFloorState();

    // ── Player ──────────────────────────────────────────────────
    this.playerX = 480;
    this.playerY = 470;
    this.playerFacing = -Math.PI / 2; // up

    // ── Graphics layers ─────────────────────────────────────────
    this.floorGfx  = this.add.graphics().setDepth(0);
    this.wallGfx   = this.add.graphics().setDepth(1);
    this.deskGfx   = this.add.graphics().setDepth(2);
    this.pagerGfx  = this.add.graphics().setDepth(3);
    this.guardGfx  = this.add.graphics().setDepth(5);
    this.playerGfx = this.add.graphics().setDepth(10);
    this.effectGfx = this.add.graphics().setDepth(15);
    this.hudGfx    = this.add.graphics().setDepth(90);

    // ── HUD text ────────────────────────────────────────────────
    this._createHUD();

    // ── Draw initial floor ──────────────────────────────────────
    this._drawFloor();

    // ── Input ───────────────────────────────────────────────────
    this._setupInput();

    // ── Scanline overlay ────────────────────────────────────────
    this._createScanlines();

    // ── Fade in ─────────────────────────────────────────────────
    this.cameras.main.fadeIn(600, 0, 0, 0);

    // ── Tutorial overlay ────────────────────────────────────────
    showTutorialOverlay(this, [
      'LEVEL 2: OPERATION GRIM BEEPER',
      '',
      'Infiltrate the building and plant beepers',
      'on enemy pagers without being detected.',
      '',
      'WASD/Arrows — Move',
      'SPACE — Plant beeper (near pager desk)',
      'SHIFT — Hide behind nearby desk',
      'Avoid guard vision cones!',
    ]);
  }

  // ═══════════════════════════════════════════════════════════════
  // FLOOR STATE INITIALIZATION
  // ═══════════════════════════════════════════════════════════════

  _initFloorState() {
    // Track which pagers have been planted per floor
    this.plantedPagers = []; // flat array of { floor, index }
    // Guard state per floor
    this.guardStates = this.floors.map((floor, fi) => {
      return floor.guardRoutes.map(route => ({
        route,
        waypointIdx: 0,
        progress: 0,
        x: route[0].x,
        y: route[0].y,
        facing: 0,
        pauseTimer: 0,
      }));
    });
    // Camera state
    this.cameraAngle = Math.PI / 2;
    this.cameraSweepDir = 1;
  }

  // ═══════════════════════════════════════════════════════════════
  // HUD
  // ═══════════════════════════════════════════════════════════════

  _createHUD() {
    // Top bar background
    this.add.rectangle(W / 2, 20, W, 40, 0x000000, 0.6).setDepth(100);

    // Floor indicator
    this.floorText = this.add.text(20, 20, 'FLOOR: 1/3', {
      fontFamily: 'monospace', fontSize: '13px', color: '#00ffaa', fontStyle: 'bold'
    }).setOrigin(0, 0.5).setDepth(101);

    // Beeper count
    this.beeperText = this.add.text(W / 2, 20, 'BEEPERS: 0/8', {
      fontFamily: 'monospace', fontSize: '14px', color: '#00ccff', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(101);

    // Suspicion
    this.suspicionText = this.add.text(W - 20, 20, 'SUSPICION: 0%', {
      fontFamily: 'monospace', fontSize: '13px', color: '#44ff44', fontStyle: 'bold'
    }).setOrigin(1, 0.5).setDepth(101);

    // Bottom controls bar
    this.add.rectangle(W / 2, H - 16, W, 32, 0x000000, 0.5).setDepth(100);
    this.controlsText = this.add.text(W / 2, H - 16,
      'WASD/Arrows: Move | SPACE: Plant | SHIFT: Hide | ESC: Pause | P: Skip', {
      fontFamily: 'monospace', fontSize: '10px', color: '#668866'
    }).setOrigin(0.5).setDepth(101);

    // Plant progress bar (hidden by default)
    this.plantBarBg = this.add.rectangle(W / 2, H / 2 + 50, 120, 12, 0x000000, 0.7)
      .setDepth(101).setVisible(false);
    this.plantBarFill = this.add.rectangle(W / 2 - 58, H / 2 + 50, 0, 8, 0x00ff66, 0.9)
      .setOrigin(0, 0.5).setDepth(102).setVisible(false);
    this.plantLabel = this.add.text(W / 2, H / 2 + 36, 'PLANTING...', {
      fontFamily: 'monospace', fontSize: '10px', color: '#00ff66'
    }).setOrigin(0.5).setDepth(102).setVisible(false);

    // Hard mode badge
    if (this.isHard) {
      this.add.text(W - 8, 42, 'HARD', {
        fontFamily: 'monospace', fontSize: '10px', color: '#ff4444', fontStyle: 'bold'
      }).setOrigin(1, 0).setDepth(101);
    }

    // Alert flash text (hidden)
    this.alertText = this.add.text(W / 2, 60, '! DETECTED !', {
      fontFamily: 'monospace', fontSize: '18px', color: '#ff3333', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(101).setAlpha(0);
  }

  _updateHUD() {
    this.floorText.setText(`FLOOR: ${this.currentFloor + 1}/3`);
    this.beeperText.setText(`BEEPERS: ${this.beepersPlanted}/${TOTAL_BEEPERS}`);

    const susPct = Math.floor(this.suspicion);
    this.suspicionText.setText(`SUSPICION: ${susPct}%`);
    if (susPct >= 70) {
      this.suspicionText.setColor('#ff3333');
    } else if (susPct >= 40) {
      this.suspicionText.setColor('#ffaa00');
    } else {
      this.suspicionText.setColor('#44ff44');
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // SCANLINES
  // ═══════════════════════════════════════════════════════════════

  _createScanlines() {
    const gfx = this.add.graphics().setDepth(200);
    gfx.fillStyle(0x000000, 0.04);
    for (let y = 0; y < H; y += 3) {
      gfx.fillRect(0, y, W, 1);
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // FLOOR DRAWING
  // ═══════════════════════════════════════════════════════════════

  _drawFloor() {
    const floor = this.floors[this.currentFloor];

    // ── Floor tiles ───────────────────────────────────────────
    this.floorGfx.clear();
    this.floorGfx.fillStyle(COL_FLOOR, 1);
    this.floorGfx.fillRect(60, 50, 840, 450);

    // Grid lines
    this.floorGfx.lineStyle(1, COL_GRID, 0.2);
    for (let x = 60; x <= 900; x += 40) {
      this.floorGfx.lineBetween(x, 50, x, 500);
    }
    for (let y = 50; y <= 500; y += 40) {
      this.floorGfx.lineBetween(60, y, 900, y);
    }

    // ── Walls ─────────────────────────────────────────────────
    this.wallGfx.clear();
    this.wallGfx.fillStyle(COL_WALL, 1);
    for (const w of floor.walls) {
      this.wallGfx.fillRect(w.x, w.y, w.w, w.h);
    }

    // ── Doors (lighter patches on floor) ──────────────────────
    this.floorGfx.fillStyle(COL_DOOR, 0.6);
    for (const d of floor.doors) {
      this.floorGfx.fillRect(d.x, d.y, d.w, d.h);
    }

    // ── Desks ─────────────────────────────────────────────────
    this.deskGfx.clear();
    this.deskGfx.fillStyle(COL_DESK, 0.8);
    for (const d of floor.desks) {
      this.deskGfx.fillRect(d.x, d.y, d.w, d.h);
    }

    // ── Stairs ────────────────────────────────────────────────
    if (floor.stairs) {
      this.floorGfx.fillStyle(COL_STAIR, 0.3);
      this.floorGfx.fillRect(floor.stairs.x, floor.stairs.y, floor.stairs.w, floor.stairs.h);
      this.floorGfx.lineStyle(2, COL_STAIR, 0.6);
      this.floorGfx.strokeRect(floor.stairs.x, floor.stairs.y, floor.stairs.w, floor.stairs.h);
      // Arrow up
      const sx = floor.stairs.x + floor.stairs.w / 2;
      const sy = floor.stairs.y + floor.stairs.h / 2;
      this.floorGfx.lineStyle(2, COL_STAIR, 0.8);
      this.floorGfx.lineBetween(sx, sy + 8, sx, sy - 8);
      this.floorGfx.lineBetween(sx - 6, sy - 2, sx, sy - 8);
      this.floorGfx.lineBetween(sx + 6, sy - 2, sx, sy - 8);
    }
    if (floor.stairsDown) {
      this.floorGfx.fillStyle(COL_STAIR, 0.2);
      this.floorGfx.fillRect(floor.stairsDown.x, floor.stairsDown.y, floor.stairsDown.w, floor.stairsDown.h);
      this.floorGfx.lineStyle(2, COL_STAIR, 0.4);
      this.floorGfx.strokeRect(floor.stairsDown.x, floor.stairsDown.y, floor.stairsDown.w, floor.stairsDown.h);
      // Arrow down
      const sx = floor.stairsDown.x + floor.stairsDown.w / 2;
      const sy = floor.stairsDown.y + floor.stairsDown.h / 2;
      this.floorGfx.lineStyle(2, COL_STAIR, 0.6);
      this.floorGfx.lineBetween(sx, sy - 8, sx, sy + 8);
      this.floorGfx.lineBetween(sx - 6, sy + 2, sx, sy + 8);
      this.floorGfx.lineBetween(sx + 6, sy + 2, sx, sy + 8);
    }

    // ── Floor label ───────────────────────────────────────────
    // Destroy old label if any
    if (this._floorLabel) { this._floorLabel.destroy(); }
    this._floorLabel = this.add.text(480, 50, `FLOOR ${this.currentFloor + 1}`, {
      fontFamily: 'monospace', fontSize: '10px', color: '#555544'
    }).setOrigin(0.5, 1).setDepth(0);
  }

  // ═══════════════════════════════════════════════════════════════
  // PAGER DRAWING (called every frame for glow animation)
  // ═══════════════════════════════════════════════════════════════

  _drawPagers(time) {
    this.pagerGfx.clear();
    const floor = this.floors[this.currentFloor];
    const fi = this.currentFloor;

    for (let pi = 0; pi < floor.pagers.length; pi++) {
      const pg = floor.pagers[pi];
      const isPlanted = this._isPagerPlanted(fi, pi);

      if (isPlanted) {
        // Planted: green blinking LED
        const blink = Math.sin(time * 0.008) > 0;
        this.pagerGfx.fillStyle(COL_PLANTED, blink ? 0.8 : 0.3);
        this.pagerGfx.fillCircle(pg.x, pg.y, 4);
        // Small green glow
        this.pagerGfx.fillStyle(COL_PLANTED, 0.08);
        this.pagerGfx.fillCircle(pg.x, pg.y, 16);
      } else {
        // Unplanted: cyan glow pulse
        const pulse = 0.3 + 0.2 * Math.sin(time * 0.004 + pi);
        this.pagerGfx.fillStyle(COL_PAGER_GLOW, pulse * 0.15);
        this.pagerGfx.fillCircle(pg.x, pg.y, 20);
        this.pagerGfx.lineStyle(1, COL_PAGER_GLOW, pulse * 0.5);
        this.pagerGfx.strokeCircle(pg.x, pg.y, 14);
        // Pager device
        this.pagerGfx.fillStyle(0x222222, 0.9);
        this.pagerGfx.fillRect(pg.x - 5, pg.y - 7, 10, 14);
        this.pagerGfx.fillStyle(COL_PAGER_GLOW, 0.4);
        this.pagerGfx.fillRect(pg.x - 3, pg.y - 5, 6, 4);
      }
    }
  }

  _isPagerPlanted(floorIdx, pagerIdx) {
    return this.plantedPagers.some(p => p.floor === floorIdx && p.index === pagerIdx);
  }

  // ═══════════════════════════════════════════════════════════════
  // GUARD LOGIC
  // ═══════════════════════════════════════════════════════════════

  _updateGuards(dt) {
    const dtSec = dt / 1000;
    const guards = this.guardStates[this.currentFloor];
    const speed = GUARD_SPEED * this.guardSpeedMult;

    for (const g of guards) {
      if (g.pauseTimer > 0) {
        g.pauseTimer -= dtSec;
        continue;
      }

      const target = g.route[g.waypointIdx];
      const dx = target.x - g.x;
      const dy = target.y - g.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 3) {
        // Reached waypoint — pause briefly then go to next
        g.waypointIdx = (g.waypointIdx + 1) % g.route.length;
        g.pauseTimer = 0.8 + Math.random() * 0.4; // pause at waypoint
        // Update facing toward next waypoint
        const next = g.route[g.waypointIdx];
        g.facing = Math.atan2(next.y - g.y, next.x - g.x);
      } else {
        // Move toward waypoint
        const moveX = (dx / dist) * speed * dtSec;
        const moveY = (dy / dist) * speed * dtSec;
        g.x += moveX;
        g.y += moveY;
        g.facing = Math.atan2(dy, dx);
      }
    }

    // Update security camera
    const floor = this.floors[this.currentFloor];
    if (floor.cameraPos) {
      const cam = floor.cameraPos;
      this.cameraAngle += cam.sweepSpeed * this.cameraSweepDir * dtSec;
      const baseAngle = cam.angle;
      if (this.cameraAngle > baseAngle + cam.sweepRange / 2) {
        this.cameraAngle = baseAngle + cam.sweepRange / 2;
        this.cameraSweepDir = -1;
      } else if (this.cameraAngle < baseAngle - cam.sweepRange / 2) {
        this.cameraAngle = baseAngle - cam.sweepRange / 2;
        this.cameraSweepDir = 1;
      }
    }
  }

  _drawGuards(time) {
    this.guardGfx.clear();
    const guards = this.guardStates[this.currentFloor];
    const floor = this.floors[this.currentFloor];

    for (const g of guards) {
      // Vision cone
      const coneAlpha = 0.12;
      this.guardGfx.fillStyle(COL_VISION, coneAlpha);
      this.guardGfx.beginPath();
      this.guardGfx.moveTo(g.x, g.y);
      const segments = 12;
      for (let i = 0; i <= segments; i++) {
        const a = g.facing - VISION_ANGLE + (2 * VISION_ANGLE * i / segments);
        this.guardGfx.lineTo(
          g.x + Math.cos(a) * VISION_RANGE,
          g.y + Math.sin(a) * VISION_RANGE
        );
      }
      this.guardGfx.closePath();
      this.guardGfx.fillPath();

      // Cone edge lines
      this.guardGfx.lineStyle(1, COL_VISION, 0.25);
      this.guardGfx.lineBetween(g.x, g.y,
        g.x + Math.cos(g.facing - VISION_ANGLE) * VISION_RANGE,
        g.y + Math.sin(g.facing - VISION_ANGLE) * VISION_RANGE);
      this.guardGfx.lineBetween(g.x, g.y,
        g.x + Math.cos(g.facing + VISION_ANGLE) * VISION_RANGE,
        g.y + Math.sin(g.facing + VISION_ANGLE) * VISION_RANGE);

      // Guard body
      this.guardGfx.fillStyle(COL_GUARD, 0.9);
      this.guardGfx.fillCircle(g.x, g.y, GUARD_SIZE);
      // Facing indicator
      this.guardGfx.fillStyle(0xff6666, 0.8);
      this.guardGfx.fillCircle(
        g.x + Math.cos(g.facing) * 8,
        g.y + Math.sin(g.facing) * 8,
        3
      );
    }

    // Security camera
    if (floor.cameraPos) {
      const cam = floor.cameraPos;
      // Camera body
      this.guardGfx.fillStyle(COL_CAMERA, 0.8);
      this.guardGfx.fillRect(cam.x - 6, cam.y - 6, 12, 12);
      // Camera cone
      this.guardGfx.fillStyle(COL_CAMERA, 0.08);
      this.guardGfx.beginPath();
      this.guardGfx.moveTo(cam.x, cam.y);
      const segments = 10;
      for (let i = 0; i <= segments; i++) {
        const a = this.cameraAngle - CAMERA_CONE_ANGLE + (2 * CAMERA_CONE_ANGLE * i / segments);
        this.guardGfx.lineTo(
          cam.x + Math.cos(a) * CAMERA_RANGE,
          cam.y + Math.sin(a) * CAMERA_RANGE
        );
      }
      this.guardGfx.closePath();
      this.guardGfx.fillPath();
      // Cone edges
      this.guardGfx.lineStyle(1, COL_CAMERA, 0.2);
      this.guardGfx.lineBetween(cam.x, cam.y,
        cam.x + Math.cos(this.cameraAngle - CAMERA_CONE_ANGLE) * CAMERA_RANGE,
        cam.y + Math.sin(this.cameraAngle - CAMERA_CONE_ANGLE) * CAMERA_RANGE);
      this.guardGfx.lineBetween(cam.x, cam.y,
        cam.x + Math.cos(this.cameraAngle + CAMERA_CONE_ANGLE) * CAMERA_RANGE,
        cam.y + Math.sin(this.cameraAngle + CAMERA_CONE_ANGLE) * CAMERA_RANGE);
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // DETECTION LOGIC
  // ═══════════════════════════════════════════════════════════════

  _checkDetection(dt) {
    const dtSec = dt / 1000;
    let detected = false;

    // Skip detection if hiding
    if (this.isHiding) {
      this.suspicion = Math.max(0, this.suspicion - ALERT_DECAY_RATE * dtSec);
      return;
    }

    const guards = this.guardStates[this.currentFloor];
    const floor = this.floors[this.currentFloor];

    // Check guard vision cones
    for (const g of guards) {
      if (this._isInCone(this.playerX, this.playerY, g.x, g.y, g.facing, VISION_ANGLE, VISION_RANGE)) {
        // Check if a wall blocks line of sight
        if (!this._wallBlocksLOS(g.x, g.y, this.playerX, this.playerY)) {
          detected = true;
          break;
        }
      }
    }

    // Check security camera
    if (!detected && floor.cameraPos) {
      const cam = floor.cameraPos;
      if (this._isInCone(this.playerX, this.playerY, cam.x, cam.y, this.cameraAngle, CAMERA_CONE_ANGLE, CAMERA_RANGE)) {
        if (!this._wallBlocksLOS(cam.x, cam.y, this.playerX, this.playerY)) {
          detected = true;
        }
      }
    }

    if (detected) {
      this.suspicion = Math.min(100, this.suspicion + this.alertRiseRate * dtSec);
      if (this.suspicion > this.maxSuspicionReached) {
        this.maxSuspicionReached = this.suspicion;
      }
      // Alert visual feedback
      this.alertText.setAlpha(0.6 + 0.4 * Math.sin(Date.now() * 0.01));

      // Alert sound (throttled)
      this.alertCooldown -= dtSec;
      if (this.alertCooldown <= 0) {
        SoundManager.get().playSearchlightDetect();
        this.alertCooldown = 1.5;
      }

      // If planting, cancel it
      if (this.isPlanting) {
        this._cancelPlanting();
      }
    } else {
      this.suspicion = Math.max(0, this.suspicion - ALERT_DECAY_RATE * dtSec);
      this.alertText.setAlpha(Math.max(0, this.alertText.alpha - dtSec * 3));
    }

    // Check defeat
    if (this.suspicion >= 100) {
      this._defeat();
    }
  }

  _isInCone(px, py, ox, oy, facing, halfAngle, range) {
    const dx = px - ox;
    const dy = py - oy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > range) return false;
    const angle = Math.atan2(dy, dx);
    let diff = angle - facing;
    // Normalize to -PI..PI
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    return Math.abs(diff) <= halfAngle;
  }

  _wallBlocksLOS(x1, y1, x2, y2) {
    // Simplified: check if any wall rect intersects the line segment
    const floor = this.floors[this.currentFloor];
    for (const w of floor.walls) {
      if (this._lineIntersectsRect(x1, y1, x2, y2, w.x, w.y, w.w, w.h)) {
        return true;
      }
    }
    return false;
  }

  _lineIntersectsRect(x1, y1, x2, y2, rx, ry, rw, rh) {
    // Check line segment vs 4 edges of rectangle
    return (
      this._lineIntersectsLine(x1, y1, x2, y2, rx, ry, rx + rw, ry) ||
      this._lineIntersectsLine(x1, y1, x2, y2, rx + rw, ry, rx + rw, ry + rh) ||
      this._lineIntersectsLine(x1, y1, x2, y2, rx, ry + rh, rx + rw, ry + rh) ||
      this._lineIntersectsLine(x1, y1, x2, y2, rx, ry, rx, ry + rh)
    );
  }

  _lineIntersectsLine(x1, y1, x2, y2, x3, y3, x4, y4) {
    const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
    if (Math.abs(denom) < 0.0001) return false;
    const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
    const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denom;
    return t >= 0 && t <= 1 && u >= 0 && u <= 1;
  }

  // ═══════════════════════════════════════════════════════════════
  // PLAYER MOVEMENT
  // ═══════════════════════════════════════════════════════════════

  _updatePlayer(dt) {
    if (this.isPlanting) return; // can't move while planting

    const dtSec = dt / 1000;
    const speed = this.isHiding ? 0 : PLAYER_SPEED;
    let dx = 0, dy = 0;

    if (this.cursors.left.isDown || this.wasd.left.isDown) dx -= 1;
    if (this.cursors.right.isDown || this.wasd.right.isDown) dx += 1;
    if (this.cursors.up.isDown || this.wasd.up.isDown) dy -= 1;
    if (this.cursors.down.isDown || this.wasd.down.isDown) dy += 1;

    if (dx !== 0 || dy !== 0) {
      // Normalize diagonal
      const len = Math.sqrt(dx * dx + dy * dy);
      dx /= len;
      dy /= len;
      this.playerFacing = Math.atan2(dy, dx);

      const newX = this.playerX + dx * speed * dtSec;
      const newY = this.playerY + dy * speed * dtSec;

      // Collision check
      if (!this._collidesWithWall(newX, this.playerY, PLAYER_SIZE)) {
        this.playerX = newX;
      }
      if (!this._collidesWithWall(this.playerX, newY, PLAYER_SIZE)) {
        this.playerY = newY;
      }

      // Clamp to play area
      this.playerX = Phaser.Math.Clamp(this.playerX, 68 + PLAYER_SIZE, 892 - PLAYER_SIZE);
      this.playerY = Phaser.Math.Clamp(this.playerY, 58 + PLAYER_SIZE, 492 - PLAYER_SIZE);

      // Un-hide if moving
      this.isHiding = false;
    }

    // Check stairs
    this._checkStairs();
  }

  _collidesWithWall(px, py, radius) {
    const floor = this.floors[this.currentFloor];
    for (const w of floor.walls) {
      // Check if circle (px, py, radius) overlaps rectangle
      const closestX = Phaser.Math.Clamp(px, w.x, w.x + w.w);
      const closestY = Phaser.Math.Clamp(py, w.y, w.y + w.h);
      const distX = px - closestX;
      const distY = py - closestY;
      if (distX * distX + distY * distY < radius * radius) {
        return true;
      }
    }
    return false;
  }

  _checkStairs() {
    const floor = this.floors[this.currentFloor];

    // Go up
    if (floor.stairs && this.currentFloor < 2) {
      const s = floor.stairs;
      if (this.playerX > s.x && this.playerX < s.x + s.w &&
          this.playerY > s.y && this.playerY < s.y + s.h) {
        if (Phaser.Input.Keyboard.JustDown(this.spaceKey) && !this.isPlanting) {
          // Check no pagers left on this floor
          // Actually allow free movement between floors
          this._changeFloor(this.currentFloor + 1, true);
          return;
        }
      }
    }

    // Go down
    if (floor.stairsDown && this.currentFloor > 0) {
      const s = floor.stairsDown;
      if (this.playerX > s.x && this.playerX < s.x + s.w &&
          this.playerY > s.y && this.playerY < s.y + s.h) {
        if (Phaser.Input.Keyboard.JustDown(this.spaceKey) && !this.isPlanting) {
          this._changeFloor(this.currentFloor - 1, false);
          return;
        }
      }
    }
  }

  _changeFloor(newFloor, goingUp) {
    this.currentFloor = newFloor;
    SoundManager.get().playStep();
    // Position player at the corresponding stairs on new floor
    const floor = this.floors[newFloor];
    if (goingUp && floor.stairsDown) {
      this.playerX = floor.stairsDown.x + floor.stairsDown.w / 2;
      this.playerY = floor.stairsDown.y + floor.stairsDown.h / 2;
    } else if (!goingUp && floor.stairs) {
      this.playerX = floor.stairs.x + floor.stairs.w / 2;
      this.playerY = floor.stairs.y + floor.stairs.h / 2;
    }
    this._drawFloor();
    // Brief flash
    this.cameras.main.flash(200, 0, 0, 0);
  }

  _drawPlayer(time) {
    this.playerGfx.clear();

    if (this.isHiding) {
      // Crouched/hiding — smaller, translucent
      this.playerGfx.fillStyle(COL_PLAYER, 0.4);
      this.playerGfx.fillCircle(this.playerX, this.playerY, PLAYER_SIZE * 0.7);
      // Hide indicator
      this.playerGfx.lineStyle(1, 0x4488ff, 0.3);
      this.playerGfx.strokeCircle(this.playerX, this.playerY, PLAYER_SIZE + 2);
    } else {
      // Normal player
      this.playerGfx.fillStyle(COL_PLAYER, 0.9);
      this.playerGfx.fillCircle(this.playerX, this.playerY, PLAYER_SIZE);
      // Facing indicator
      this.playerGfx.fillStyle(0x66bbff, 0.8);
      this.playerGfx.fillCircle(
        this.playerX + Math.cos(this.playerFacing) * 9,
        this.playerY + Math.sin(this.playerFacing) * 9,
        3
      );
    }

    // Highlight near pager stations
    const nearPager = this._getNearbyPager();
    if (nearPager !== null && !this.isPlanting) {
      const pg = this.floors[this.currentFloor].pagers[nearPager];
      this.playerGfx.lineStyle(2, COL_PAGER_GLOW, 0.5 + 0.3 * Math.sin(time * 0.006));
      this.playerGfx.strokeCircle(pg.x, pg.y, 22);
      // Show "SPACE" prompt
      if (!this._spacePrompt) {
        this._spacePrompt = this.add.text(0, 0, '[SPACE]', {
          fontFamily: 'monospace', fontSize: '9px', color: '#00ccff'
        }).setOrigin(0.5).setDepth(11);
      }
      this._spacePrompt.setPosition(pg.x, pg.y - 28).setVisible(true);
    } else {
      if (this._spacePrompt) this._spacePrompt.setVisible(false);
    }

    // Near stairs prompt
    const floor = this.floors[this.currentFloor];
    let nearStairs = false;
    if (floor.stairs && this.currentFloor < 2) {
      const s = floor.stairs;
      if (this.playerX > s.x && this.playerX < s.x + s.w &&
          this.playerY > s.y && this.playerY < s.y + s.h) {
        nearStairs = true;
        if (!this._stairPrompt) {
          this._stairPrompt = this.add.text(0, 0, '[SPACE] UP', {
            fontFamily: 'monospace', fontSize: '9px', color: '#ffcc00'
          }).setOrigin(0.5).setDepth(11);
        }
        this._stairPrompt.setPosition(s.x + s.w / 2, s.y - 10).setVisible(true);
      }
    }
    if (floor.stairsDown && this.currentFloor > 0) {
      const s = floor.stairsDown;
      if (this.playerX > s.x && this.playerX < s.x + s.w &&
          this.playerY > s.y && this.playerY < s.y + s.h) {
        nearStairs = true;
        if (!this._stairDownPrompt) {
          this._stairDownPrompt = this.add.text(0, 0, '[SPACE] DOWN', {
            fontFamily: 'monospace', fontSize: '9px', color: '#ffcc00'
          }).setOrigin(0.5).setDepth(11);
        }
        this._stairDownPrompt.setPosition(s.x + s.w / 2, s.y - 10).setVisible(true);
      }
    }
    if (!nearStairs) {
      if (this._stairPrompt) this._stairPrompt.setVisible(false);
      if (this._stairDownPrompt) this._stairDownPrompt.setVisible(false);
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // PLANTING BEEPERS
  // ═══════════════════════════════════════════════════════════════

  _getNearbyPager() {
    const floor = this.floors[this.currentFloor];
    for (let i = 0; i < floor.pagers.length; i++) {
      if (this._isPagerPlanted(this.currentFloor, i)) continue;
      const pg = floor.pagers[i];
      const dist = Phaser.Math.Distance.Between(this.playerX, this.playerY, pg.x, pg.y);
      if (dist < 35) return i;
    }
    return null;
  }

  _startPlanting(pagerIdx) {
    this.isPlanting = true;
    this.plantProgress = 0;
    this.plantTarget = pagerIdx;
    this.plantBarBg.setVisible(true);
    this.plantBarFill.setVisible(true);
    this.plantLabel.setVisible(true);
    SoundManager.get().playPlantBeeps();
  }

  _updatePlanting(dt) {
    if (!this.isPlanting) return;

    this.plantProgress += dt;
    const pct = Math.min(this.plantProgress / PLANT_DURATION, 1);

    // Update progress bar
    this.plantBarFill.displayWidth = Math.floor(116 * pct);

    if (pct >= 1) {
      // Planted!
      this._completePlanting();
    }
  }

  _completePlanting() {
    this.plantedPagers.push({ floor: this.currentFloor, index: this.plantTarget });
    this.beepersPlanted++;
    this.isPlanting = false;
    this.plantTarget = null;
    this.plantBarBg.setVisible(false);
    this.plantBarFill.setVisible(false);
    this.plantLabel.setVisible(false);

    SoundManager.get().playRadarMark();
    this.cameras.main.flash(100, 0, 200, 50);

    // Check if all beepers planted
    if (this.beepersPlanted >= TOTAL_BEEPERS) {
      this.time.delayedCall(500, () => {
        this._startDetonationSequence();
      });
    }
  }

  _cancelPlanting() {
    this.isPlanting = false;
    this.plantProgress = 0;
    this.plantTarget = null;
    this.plantBarBg.setVisible(false);
    this.plantBarFill.setVisible(false);
    this.plantLabel.setVisible(false);
  }

  // ═══════════════════════════════════════════════════════════════
  // HIDING
  // ═══════════════════════════════════════════════════════════════

  _tryHide() {
    if (this.isPlanting) return;
    const floor = this.floors[this.currentFloor];
    // Check if near a desk
    for (const d of floor.desks) {
      const cx = d.x + d.w / 2;
      const cy = d.y + d.h / 2;
      const dist = Phaser.Math.Distance.Between(this.playerX, this.playerY, cx, cy);
      if (dist < 45) {
        this.isHiding = true;
        // Snap to desk position
        this.playerX = cx;
        this.playerY = cy;
        SoundManager.get().playStep();
        return;
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // DETONATION SEQUENCE
  // ═══════════════════════════════════════════════════════════════

  _startDetonationSequence() {
    this.phase = 'detonation';
    this.isPlanting = false;
    this._cancelPlanting();

    // Clear gameplay graphics
    this.playerGfx.clear();
    this.guardGfx.clear();
    this.pagerGfx.clear();
    this.floorGfx.clear();
    this.wallGfx.clear();
    this.deskGfx.clear();
    if (this._spacePrompt) this._spacePrompt.setVisible(false);
    if (this._stairPrompt) this._stairPrompt.setVisible(false);
    if (this._stairDownPrompt) this._stairDownPrompt.setVisible(false);
    if (this._floorLabel) this._floorLabel.setVisible(false);
    this.alertText.setAlpha(0);
    this.controlsText.setText('');

    // ── Draw building exterior ────────────────────────────────
    this.effectGfx.clear();
    const g = this.effectGfx;

    // Night sky
    g.fillStyle(0x0a0a1a, 1);
    g.fillRect(0, 0, W, H);

    // Stars
    for (let i = 0; i < 30; i++) {
      g.fillStyle(0xffffff, 0.3 + Math.random() * 0.5);
      g.fillCircle(Math.random() * W, Math.random() * H * 0.4, 1);
    }

    // Ground
    g.fillStyle(0x2a2a20, 1);
    g.fillRect(0, 380, W, 160);

    // Building
    this.buildingX = 280;
    this.buildingY = 120;
    this.buildingW = 400;
    this.buildingH = 260;

    g.fillStyle(0x444440, 1);
    g.fillRect(this.buildingX, this.buildingY, this.buildingW, this.buildingH);
    // Windows (3 rows)
    for (let floor = 0; floor < 3; floor++) {
      for (let w = 0; w < 6; w++) {
        const wx = this.buildingX + 30 + w * 60;
        const wy = this.buildingY + 20 + floor * 85;
        g.fillStyle(0x668844, 0.4);
        g.fillRect(wx, wy, 35, 50);
        // Blinking green LED in each planted pager window
      }
    }

    // Roof
    g.fillStyle(0x555550, 1);
    g.fillRect(this.buildingX - 10, this.buildingY - 10, this.buildingW + 20, 15);

    // "ACTIVATE" prompt
    this.activateLabel = this.add.text(W / 2, H - 60, '[ SPACE ] ACTIVATE BEEPERS', {
      fontFamily: 'monospace', fontSize: '18px', color: '#ff4444', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(20);

    // Pulse the label
    this.tweens.add({
      targets: this.activateLabel,
      alpha: { from: 1, to: 0.3 },
      duration: 600,
      yoyo: true,
      repeat: -1,
    });

    this.detonationReady = true;
  }

  _triggerDetonation() {
    if (!this.detonationReady) return;
    this.detonationReady = false;

    // Remove activate label
    if (this.activateLabel) {
      this.tweens.killTweensOf(this.activateLabel);
      this.activateLabel.destroy();
    }

    // 1-second pause with tension
    this.add.text(W / 2, H / 2 + 160, 'SIGNAL SENT...', {
      fontFamily: 'monospace', fontSize: '14px', color: '#ff6644'
    }).setOrigin(0.5).setDepth(20);

    // Beeper sounds: rapid high-pitched beeps
    SoundManager.get().playPlantBeeps();

    this.time.delayedCall(1200, () => {
      this._explodeBuilding();
    });
  }

  _explodeBuilding() {
    // Screen shake
    this.cameras.main.shake(1500, 0.03);

    // White/orange flash
    this.cameras.main.flash(800, 255, 200, 100);

    // Explosion sound
    SoundManager.get().playExplosion();

    // Draw explosion effects
    const g = this.effectGfx;

    // Flash all windows orange/white
    this.time.addEvent({
      delay: 50,
      repeat: 15,
      callback: () => {
        const flashColor = Math.random() > 0.5 ? 0xffaa00 : 0xffffff;
        for (let floor = 0; floor < 3; floor++) {
          for (let w = 0; w < 6; w++) {
            const wx = this.buildingX + 30 + w * 60;
            const wy = this.buildingY + 20 + floor * 85;
            g.fillStyle(flashColor, 0.6 + Math.random() * 0.4);
            g.fillRect(wx, wy, 35, 50);
          }
        }
      }
    });

    // Cracks and debris after 500ms
    this.time.delayedCall(500, () => {
      // Cracks
      g.lineStyle(3, 0x222222, 0.8);
      for (let i = 0; i < 8; i++) {
        const sx = this.buildingX + Math.random() * this.buildingW;
        const sy = this.buildingY + Math.random() * this.buildingH;
        g.lineBetween(sx, sy, sx + (Math.random() - 0.5) * 80, sy + (Math.random() - 0.5) * 60);
      }

      // Fire/smoke particles
      this.detonationParticles = [];
      for (let i = 0; i < 40; i++) {
        this.detonationParticles.push({
          x: this.buildingX + Math.random() * this.buildingW,
          y: this.buildingY + Math.random() * this.buildingH,
          vx: (Math.random() - 0.5) * 100,
          vy: -30 - Math.random() * 80,
          life: 1 + Math.random(),
          color: Math.random() > 0.4 ? 0xff6600 : 0xffaa00,
          size: 3 + Math.random() * 5,
        });
      }

      SoundManager.get().playExplosion();
    });

    // Second explosion at 800ms
    this.time.delayedCall(800, () => {
      SoundManager.get().playExplosion();
      this.cameras.main.shake(800, 0.02);
    });

    // Show completion text at 2s
    this.time.delayedCall(2000, () => {
      this._showCompletionText();
    });

    // Transition to victory at 4s
    this.time.delayedCall(4000, () => {
      this._showVictory();
    });
  }

  _showCompletionText() {
    const titleText = this.add.text(W / 2, H / 2 - 30, 'OPERATION GRIM BEEPER', {
      fontFamily: 'monospace', fontSize: '28px', color: '#FFD700', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 4,
    }).setOrigin(0.5).setDepth(100).setAlpha(0);

    const subtitleText = this.add.text(W / 2, H / 2 + 10, 'COMPLETE', {
      fontFamily: 'monospace', fontSize: '22px', color: '#FFD700', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(100).setAlpha(0);

    this.tweens.add({
      targets: [titleText, subtitleText],
      alpha: 1,
      duration: 800,
      ease: 'Power2',
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // DETONATION PARTICLE UPDATE
  // ═══════════════════════════════════════════════════════════════

  _updateDetonationParticles(dt) {
    if (!this.detonationParticles || this.detonationParticles.length === 0) return;

    const dtSec = dt / 1000;
    const g = this.effectGfx;

    for (const p of this.detonationParticles) {
      p.x += p.vx * dtSec;
      p.y += p.vy * dtSec;
      p.vy += 20 * dtSec; // gravity
      p.life -= dtSec;
      if (p.life <= 0) continue;
      g.fillStyle(p.color, Math.min(p.life, 1));
      g.fillCircle(p.x, p.y, p.size * Math.min(p.life, 1));
    }
    this.detonationParticles = this.detonationParticles.filter(p => p.life > 0);
  }

  // ═══════════════════════════════════════════════════════════════
  // VICTORY / DEFEAT
  // ═══════════════════════════════════════════════════════════════

  _showVictory() {
    this.phase = 'victory';
    MusicManager.get().stop(1);
    SoundManager.get().playVictory();

    const elapsed = ((Date.now() - this.startTime) / 1000).toFixed(1);
    const susMax = Math.floor(this.maxSuspicionReached);

    // Star rating
    let stars = 1;
    if (susMax < 60) stars = 2;
    if (susMax < 30) stars = 3;

    this._endScreen = showVictoryScreen(this, {
      title: 'OPERATION GRIM BEEPER — COMPLETE',
      stats: [
        { label: 'Beepers Planted', value: `${this.beepersPlanted}/${TOTAL_BEEPERS}` },
        { label: 'Floors Cleared', value: '3/3' },
        { label: 'Time', value: `${elapsed}s` },
        { label: 'Max Suspicion', value: `${susMax}%` },
      ],
      stars,
      currentScene: 'BeirutRadarScene',
      nextScene: 'DeepStrikeIntroCinematicScene',
    });
  }

  _defeat() {
    if (this.phase === 'defeat') return;
    this.phase = 'defeat';
    MusicManager.get().stop(1);
    SoundManager.get().playGameOver();

    this.cameras.main.shake(300, 0.02);
    this.cameras.main.flash(300, 255, 0, 0);

    const elapsed = ((Date.now() - this.startTime) / 1000).toFixed(1);

    this._endScreen = showDefeatScreen(this, {
      title: 'COMPROMISED',
      stats: [
        { label: 'Beepers Planted', value: `${this.beepersPlanted}/${TOTAL_BEEPERS}` },
        { label: 'Floor Reached', value: `${this.currentFloor + 1}/3` },
        { label: 'Time', value: `${elapsed}s` },
      ],
      currentScene: 'BeirutRadarScene',
      skipScene: 'DeepStrikeIntroCinematicScene',
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // INPUT SETUP
  // ═══════════════════════════════════════════════════════════════

  _setupInput() {
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
    });
    this.spaceKey  = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.shiftKey  = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
    this.escKey    = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    this.mKey      = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.M);
    this.pKey      = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P);
    this.rKey      = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);
    this.yKey      = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Y);
    this.nKey      = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.N);
    this.enterKey  = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
  }

  // ═══════════════════════════════════════════════════════════════
  // PAUSE
  // ═══════════════════════════════════════════════════════════════

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

  // ═══════════════════════════════════════════════════════════════
  // SKIP PROMPT
  // ═══════════════════════════════════════════════════════════════

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
    MusicManager.get().stop(0.5);
    this.cameras.main.fadeOut(500, 0, 0, 0);
    this.time.delayedCall(600, () => {
      this.scene.start('DeepStrikeIntroCinematicScene');
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // SUSPICION BAR (visual bar in HUD)
  // ═══════════════════════════════════════════════════════════════

  _drawSuspicionBar() {
    this.hudGfx.clear();

    // Suspicion bar background
    const barX = W - 200;
    const barY = 32;
    const barW = 180;
    const barH = 6;

    this.hudGfx.fillStyle(0x222222, 0.6);
    this.hudGfx.fillRect(barX, barY, barW, barH);

    // Fill
    const pct = this.suspicion / 100;
    const fillColor = pct < 0.4 ? 0x44ff44 : pct < 0.7 ? 0xffaa00 : 0xff3333;
    this.hudGfx.fillStyle(fillColor, 0.8);
    this.hudGfx.fillRect(barX, barY, barW * pct, barH);

    // Border
    this.hudGfx.lineStyle(1, 0x888888, 0.4);
    this.hudGfx.strokeRect(barX, barY, barW, barH);
  }

  // ═══════════════════════════════════════════════════════════════
  // MAIN UPDATE LOOP
  // ═══════════════════════════════════════════════════════════════

  update(time, delta) {
    // Tutorial active: skip all gameplay
    if (this.tutorialActive) return;

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
      if (this.phase === 'playing') {
        this._togglePause();
        return;
      }
    }
    if (this.isPaused) {
      if (Phaser.Input.Keyboard.JustDown(this.rKey)) {
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

    // ── PLAYING PHASE ─────────────────────────────────────────
    if (this.phase === 'playing') {
      this._updatePlayer(dt);
      this._updateGuards(dt);
      this._checkDetection(dt);
      this._updatePlanting(dt);

      // Space to plant when near pager
      if (Phaser.Input.Keyboard.JustDown(this.spaceKey) && !this.isPlanting) {
        const nearPager = this._getNearbyPager();
        if (nearPager !== null) {
          this._startPlanting(nearPager);
        }
        // (stairs handled in _checkStairs via _updatePlayer)
      }

      // Shift to hide
      if (Phaser.Input.Keyboard.JustDown(this.shiftKey)) {
        this._tryHide();
      }

      // Draw everything
      this._drawPagers(time);
      this._drawGuards(time);
      this._drawPlayer(time);
      this._drawSuspicionBar();
      this._updateHUD();
    }

    // ── DETONATION PHASE ──────────────────────────────────────
    else if (this.phase === 'detonation') {
      this._updateDetonationParticles(dt);

      if (this.detonationReady && Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
        this._triggerDetonation();
      }
    }

    // ── VICTORY / DEFEAT — handled by EndScreen ───────────────
    // (EndScreen manages its own input)
  }

  shutdown() {
    // Cleanup
  }
}
