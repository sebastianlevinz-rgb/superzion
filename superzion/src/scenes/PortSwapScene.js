// ═══════════════════════════════════════════════════════════════
// PortSwapScene — Level 2: Operation Port Swap
// Top-down stealth: infiltrate Beirut port, find container, swap, escape
// ═══════════════════════════════════════════════════════════════

import Phaser from 'phaser';
import SoundManager from '../systems/SoundManager.js';
import MusicManager from '../systems/MusicManager.js';
import DifficultyManager from '../systems/DifficultyManager.js';
import { generatePortSwapTextures } from '../utils/PortSwapTextures.js';
import { showVictoryScreen, showDefeatScreen } from '../ui/EndScreen.js';
import { showControlsOverlay } from '../ui/ControlsOverlay.js';

const W = 960;
const H = 540;
const HUD_H = 50;

// ── Phases ──
const PHASE_LOCATE = 'locate';
const PHASE_SWAP   = 'swap';
const PHASE_EVAC   = 'evacuate';

// ── Player ──
const PLAYER_SPEED  = 100;
const SPRINT_SPEED  = 170;
const SCAN_TIME     = 1500;

// ── Swap sub-steps (ms) ──
const SWAP_REMOVE  = 3000;
const SWAP_PLANT   = 2000;
const SWAP_CLOSE   = 1000;

// ── Suspicion ──
const SUS_GUARD_RATE   = 20;   // %/s in guard cone
const SUS_CAMERA_RATE  = 15;   // %/s in camera cone
const SUS_DECAY_RATE   = 5;    // %/s passive
const SUS_WORKER_DECAY = 3;    // extra %/s near workers
const SUS_SPRINT_ADD   = 4;    // %/s while sprinting near guard
const SUS_SWAP_CAUGHT  = 80;   // instant % if guard near open container

// ── Guard ──
const GUARD_SPEED       = 40;
const GUARD_ALERT_SPEED = 55;
const GUARD_CONE_RANGE  = 100;
const GUARD_CONE_ANGLE  = Math.PI / 3;
const GUARD_DISTRACT_TIME = 5000;

// ── Camera (security cam) ──
const CAM_CONE_RANGE    = 90;
const CAM_ROT_SPEED     = 0.5;

// ── Distraction ──
const MAX_DISTRACTIONS  = 3;

// ════════════════════════════════════════════════════════════════
// PORT MAP DATA
// ════════════════════════════════════════════════════════════════

// Containers: { x, y, color, zone, marked }
// zone: 'north' | 'south' | 'east'
// Container body is 40x18, player body is 14x14.
// Row spacing must be >= 18 + 14 + 6 = 38  (body height + player body + clearance)
// Col spacing must be >= 40 + 14 + 6 = 60  (body width + player body + clearance)
//
// Clearance verification (post-fix):
//   Row gap:  CONT_ROW_SPACING(48) - body_h(18) = 30px between edges. Player(14) + 4px = 18px needed. 30 >= 18. OK.
//   Col gap:  CONT_COL_SPACING(72) - body_w(40) = 32px between edges. Player(14) + 4px = 18px needed. 32 >= 18. OK.
//   Top wall to north yard: wall bottom(110) to first row body top(150-9=141) = 31px. Player(14) + 4px = 18px needed. 31 >= 18. OK.
//   North yard bottom to south yard top: last row bottom(246+9=255) to south body top(340-9=331) = 76px. OK.
//   East yard top wall clearance: wall bottom(110) to east body top(160-9=151) = 41px. OK.
const CONT_ROW_SPACING = 48;   // vertical gap between container rows (was 34)
const CONT_COL_SPACING = 72;   // horizontal gap between container cols (was 60)

function generateContainers() {
  const containers = [];
  const colors = ['red', 'blue', 'green', 'yellow', 'orange'];

  // North yard (near ships) — 3 rows, 5 cols
  // Base y moved from 130 -> 150 to clear top water wall (bottom at y=110).
  // Gap: body top = 150-9 = 141, wall bottom = 110, clearance = 31px > 18px minimum.
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 5; col++) {
      containers.push({
        x: 160 + col * CONT_COL_SPACING,
        y: 150 + row * CONT_ROW_SPACING,
        color: colors[(row * 5 + col) % 5],
        zone: 'north',
        marked: (row + col) % 3 === 0,
      });
    }
  }

  // South yard — 3 rows, 5 cols
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 5; col++) {
      containers.push({
        x: 160 + col * CONT_COL_SPACING,
        y: 340 + row * CONT_ROW_SPACING,
        color: colors[(row * 5 + col + 2) % 5],
        zone: 'south',
        marked: (row + col) % 4 === 0,
      });
    }
  }

  // East yard — 2 rows near offices
  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 4; col++) {
      containers.push({
        x: 560 + col * CONT_COL_SPACING,
        y: 160 + row * CONT_ROW_SPACING,
        color: colors[(row * 4 + col + 1) % 5],
        zone: 'east',
        marked: (row + col) % 3 === 1,
      });
    }
  }

  // Extra scattered (east) — wider spacing so player can reach each one
  containers.push({ x: 560, y: 340, color: 'red', zone: 'east', marked: true });
  containers.push({ x: 632, y: 340, color: 'blue', zone: 'east', marked: false });
  containers.push({ x: 704, y: 340, color: 'red', zone: 'east', marked: false });
  containers.push({ x: 560, y: 388, color: 'green', zone: 'east', marked: true });
  containers.push({ x: 632, y: 388, color: 'orange', zone: 'east', marked: false });

  return containers;
}

// Guard patrol waypoints — routes follow corridors BETWEEN container yards
const GUARD_PATROLS = [
  // Guard 0 — north yard perimeter (outside the container grid)
  // Bottom waypoints at y=260 to stay below north yard last row (y=246, body bottom=255)
  [{ x: 130, y: 120 }, { x: 490, y: 120 }, { x: 490, y: 260 }, { x: 130, y: 260 }],
  // Guard 1 — south yard perimeter
  [{ x: 130, y: 320 }, { x: 490, y: 320 }, { x: 490, y: 450 }, { x: 130, y: 450 }],
  // Guard 2 — main horizontal corridor between north & south yards
  [{ x: 100, y: 280 }, { x: 520, y: 280 }, { x: 750, y: 280 }, { x: 520, y: 280 }],
  // Guard 3 — entrance area
  [{ x: 60, y: 460 }, { x: 200, y: 460 }, { x: 200, y: 510 }, { x: 60, y: 510 }],
  // Guard 4 — east yard perimeter (outside the container grid)
  [{ x: 530, y: 140 }, { x: 810, y: 140 }, { x: 810, y: 260 }, { x: 530, y: 260 }],
  // Guard 5 — docks near ships
  [{ x: 200, y: 90 }, { x: 500, y: 90 }, { x: 700, y: 90 }, { x: 500, y: 90 }],
  // Guard 6 — near offices
  [{ x: 780, y: 320 }, { x: 880, y: 320 }, { x: 880, y: 460 }, { x: 780, y: 460 }],
  // Guard 7 — vertical corridor between west & east yards
  [{ x: 510, y: 110 }, { x: 510, y: 280 }, { x: 510, y: 450 }, { x: 510, y: 280 }],
];

// Security camera positions + initial angle
const SEC_CAMERAS = [
  { x: 100, y: 100, angle: Math.PI / 2 },    // near entrance/north
  { x: 500, y: 100, angle: Math.PI },         // docks
  { x: 750, y: 180, angle: Math.PI * 1.2 },   // east yard
  { x: 350, y: 280, angle: 0 },               // center road
  { x: 800, y: 420, angle: Math.PI * 0.7 },   // offices
];

// Worker spawn positions — placed in corridors between yards, NOT inside container grids
// Worker positions adjusted: y=178 -> y=174 to stay in corridor between north yard rows
const WORKER_SPAWNS = [
  { x: 130, y: 174 }, { x: 490, y: 174 }, { x: 300, y: 260 },
  { x: 400, y: 280 }, { x: 130, y: 388 }, { x: 490, y: 388 },
  { x: 450, y: 450 }, { x: 530, y: 200 }, { x: 810, y: 200 },
  { x: 530, y: 370 }, { x: 700, y: 300 }, { x: 300, y: 470 },
];

// Intel clue sets — each is [colorClue, zoneClue, markingClue, targetZone, targetColor]
const INTEL_SETS = [
  { color: 'red',   zone: 'north', text: ['Container is RED', 'Arrived at NORTH dock', 'Has FARSI markings'] },
  { color: 'blue',  zone: 'south', text: ['Container is BLUE', 'Located in SOUTH yard', 'Has ARABIC markings'] },
  { color: 'green', zone: 'east',  text: ['Container is GREEN', 'In EAST staging area', 'Has RUSSIAN markings'] },
  { color: 'red',   zone: 'east',  text: ['Container is RED', 'In EAST staging area', 'Has FARSI markings'] },
];

// ════════════════════════════════════════════════════════════════
// SCENE
// ════════════════════════════════════════════════════════════════

export default class PortSwapScene extends Phaser.Scene {
  constructor() { super('BeirutRadarScene'); }

  create() {
    try {
      // Disable gravity (top-down)
      this.physics.world.gravity.y = 0;
      this.cameras.main.setBackgroundColor('#2a7a9a');

      // Controls overlay
      showControlsOverlay(this, 'WASD/ARROWS: Move | SHIFT: Sprint | SPACE: Scan | E: Interact | Q: Distract');

      generatePortSwapTextures(this);
      console.log('[PortSwap] textures generated');

      // ── State ──
      this.phase = PHASE_LOCATE;
      this.suspicion = 0;
      this.maxSuspicion = 100;
      this.distractionsLeft = MAX_DISTRACTIONS;
      this.scanning = false;
      this.scanTimer = 0;
      this.scanTarget = null;
      this.containersScanned = 0;
      this.timesDetected = 0;
      this.distractionsUsed = 0;
      this.startTime = this.time.now;
      this.isHiding = false;
      this.isSprinting = false;
      this.nearWorker = false;
      this.isPaused = false;
      this.skipPromptShown = false;
      this.missionFailed = false;
      this.missionComplete = false;
      this.peakSuspicion = 0;

      // Swap sub-state
      this.swapStep = 0;
      this.swapProgress = 0;
      this.swapTargetContainer = null;
      this.guardNearSwap = false;

      // Pick random intel set
      this.intel = INTEL_SETS[Phaser.Math.Between(0, INTEL_SETS.length - 1)];

      // ── Build world ──
      this._buildPort();
      console.log('[PortSwap] port built');
      this._spawnContainers();
      console.log('[PortSwap] containers spawned');
      this._spawnPlayer();
      console.log('[PortSwap] player spawned');
      this._spawnGuards();
      console.log('[PortSwap] guards spawned');
      this._spawnCameras();
      this._spawnWorkers();
      this._buildHUD();
      this._setupInput();
      console.log('[PortSwap] create complete');

      // Music
      MusicManager.get().playLevel2Music(false);

      // Intel radio messages (timed, appear after briefing fades)
      this._showIntelMessage(this.intel.text[0], 5000);
      this._showIntelMessage(this.intel.text[1], 8000);
      this._showIntelMessage(this.intel.text[2], 11000);

      // Big mission briefing overlay (4 seconds)
      this._showMissionBriefing();
    } catch (err) {
      console.error('[PortSwap] CREATE ERROR:', err);
    }
  }

  // ════════════════════════════════════════════════════════════
  // BUILD PORT ENVIRONMENT
  // ════════════════════════════════════════════════════════════

  _buildPort() {
    // Mountain backdrop at top
    this.add.image(480, 25, 'ps_mountains_bg').setOrigin(0.5, 0.5).setDepth(-5);

    // Water area (top strip)
    for (let x = 0; x < 30; x++) {
      for (let y = 0; y < 3; y++) {
        this.add.image(x * 32 + 16, HUD_H + y * 32 + 16, 'ps_water').setDepth(-2);
      }
    }
    // Water left strip
    for (let y = 3; y < 16; y++) {
      this.add.image(16, HUD_H + y * 32 + 16, 'ps_water').setDepth(-2);
    }
    // Water right-bottom corner
    for (let x = 27; x < 30; x++) {
      for (let y = 14; y < 16; y++) {
        this.add.image(x * 32 + 16, HUD_H + y * 32 + 16, 'ps_water').setDepth(-2);
      }
    }

    // Dock floor
    for (let x = 1; x < 30; x++) {
      for (let y = 3; y < 16; y++) {
        // Skip water areas
        if (x === 0) continue;
        if (x >= 27 && y >= 14) continue;
        this.add.image(x * 32 + 16, HUD_H + y * 32 + 16, 'ps_floor').setDepth(-1);
      }
    }

    // Dock edge (yellow stripe along water)
    for (let x = 1; x < 27; x++) {
      this.add.image(x * 32 + 16, HUD_H + 3 * 32 + 16, 'ps_dock_edge').setDepth(0);
    }

    // Ships
    this.add.image(280, HUD_H + 56, 'ps_ship').setDepth(0).setAlpha(0.9);
    this.add.image(650, HUD_H + 56, 'ps_ship').setDepth(0).setAlpha(0.9);

    // Cranes
    this.add.image(200, HUD_H + 100, 'ps_crane').setDepth(3).setAlpha(0.7);
    this.add.image(460, HUD_H + 100, 'ps_crane').setDepth(3).setAlpha(0.7);
    this.add.image(620, HUD_H + 100, 'ps_crane').setDepth(3).setAlpha(0.7);

    // Office buildings
    this.add.image(850, 380, 'ps_building').setDepth(0);
    this.add.image(850, 440, 'ps_building').setDepth(0);

    // Wall colliders (water edges, buildings)
    this.walls = this.physics.add.staticGroup();

    // Top water wall — rectangle centered at (480, HUD_H+30=80), size 960x60.
    // Wall bottom edge: y=80+30=110.  North yard first row at y=150, body top=141.
    // Clearance: 141-110 = 31px > 18px (player 14px + 4px min buffer).  Player can pass.
    const topWall = this.add.rectangle(480, HUD_H + 30, 960, 60, 0x000000, 0).setOrigin(0.5);
    this.walls.add(topWall);
    topWall.body.setSize(960, 60);

    // Left water wall
    const leftWall = this.add.rectangle(16, 300, 32, 540, 0x000000, 0).setOrigin(0.5);
    this.walls.add(leftWall);
    leftWall.body.setSize(32, 540);

    // Bottom boundary
    const bottomWall = this.add.rectangle(480, H + 8, 960, 16, 0x000000, 0).setOrigin(0.5);
    this.walls.add(bottomWall);
    bottomWall.body.setSize(960, 16);

    // Right boundary
    const rightWall = this.add.rectangle(W + 8, 300, 16, 540, 0x000000, 0).setOrigin(0.5);
    this.walls.add(rightWall);
    rightWall.body.setSize(16, 540);

    // Office walls (physical obstacles)
    const officeWall1 = this.add.rectangle(850, 380, 64, 48, 0x000000, 0);
    this.walls.add(officeWall1);
    officeWall1.body.setSize(64, 48);
    const officeWall2 = this.add.rectangle(850, 440, 64, 48, 0x000000, 0);
    this.walls.add(officeWall2);
    officeWall2.body.setSize(64, 48);

    // Entrance marker
    this.entranceX = 80;
    this.entranceY = 490;
    this.exitMarker = this.add.image(this.entranceX, this.entranceY, 'ps_exit')
      .setDepth(5).setAlpha(0.7);

    // "ENTRANCE" label
    this.add.text(this.entranceX, this.entranceY + 22, 'ENTRANCE', {
      fontFamily: 'monospace', fontSize: '7px', color: '#00ff66',
    }).setOrigin(0.5).setDepth(5);
  }

  // ════════════════════════════════════════════════════════════
  // CONTAINERS
  // ════════════════════════════════════════════════════════════

  _spawnContainers() {
    const containerDefs = generateContainers();
    this.containers = [];
    this.containerGroup = this.physics.add.staticGroup();

    // Pick target container: matches intel color + zone + marked
    const candidates = containerDefs.filter(
      c => c.color === this.intel.color && c.zone === this.intel.zone && c.marked
    );
    const targetIdx = containerDefs.indexOf(
      candidates[Phaser.Math.Between(0, candidates.length - 1)]
    );

    containerDefs.forEach((def, i) => {
      const isTarget = (i === targetIdx);
      const isCandidate = def.color === this.intel.color && def.zone === this.intel.zone;
      const texKey = def.marked
        ? `ps_container_${def.color}_marked`
        : `ps_container_${def.color}`;

      const sprite = this.physics.add.staticImage(def.x, def.y, texKey).setDepth(1);
      // Collision body sized for navigable aisles (player body is 14x14)
      sprite.body.setSize(40, 18);

      this.containers.push({
        sprite,
        color: def.color,
        zone: def.zone,
        marked: def.marked,
        isTarget,
        isCandidate,
        scanned: false,
      });

      this.containerGroup.add(sprite);
    });
  }

  // ════════════════════════════════════════════════════════════
  // PLAYER
  // ════════════════════════════════════════════════════════════

  _spawnPlayer() {
    this.player = this.physics.add.sprite(this.entranceX, this.entranceY - 20, 'ps_player_down_0');
    this.player.setDepth(4);
    this.player.body.setSize(14, 14);
    this.player.body.setOffset(9, 13);
    this.player.setCollideWorldBounds(true);
    this.playerFacing = 'down';
    this.playerAnimFrame = 0;
    this.playerAnimTimer = 0;
    this.playerStepTimer = 0;

    // Collisions
    this.physics.add.collider(this.player, this.walls);
    this.physics.add.collider(this.player, this.containerGroup);
  }

  // ════════════════════════════════════════════════════════════
  // GUARDS
  // ════════════════════════════════════════════════════════════

  _spawnGuards() {
    this.guards = [];
    const numGuards = DifficultyManager.get().isHard() ? 8 : 6;

    for (let i = 0; i < numGuards; i++) {
      const patrol = GUARD_PATROLS[i];
      const start = patrol[0];
      const sprite = this.physics.add.sprite(start.x, start.y, 'ps_guard_down_0');
      sprite.setDepth(4);
      sprite.body.setSize(20, 20);
      sprite.body.setOffset(6, 10);

      const guard = {
        sprite,
        patrol,
        waypointIdx: 0,
        speed: GUARD_SPEED,
        facing: 'down',
        animFrame: 0,
        animTimer: 0,
        distracted: false,
        distractTimer: 0,
        distractTarget: null,
      };
      this.guards.push(guard);
    }
  }

  // ════════════════════════════════════════════════════════════
  // SECURITY CAMERAS
  // ════════════════════════════════════════════════════════════

  _spawnCameras() {
    this.secCams = [];
    SEC_CAMERAS.forEach(def => {
      const sprite = this.add.image(def.x, def.y, 'ps_camera').setDepth(5);
      this.secCams.push({
        sprite,
        x: def.x,
        y: def.y,
        angle: def.angle,
        direction: 1,  // oscillation direction
      });
    });
  }

  // ════════════════════════════════════════════════════════════
  // WORKERS (decorative NPCs)
  // ════════════════════════════════════════════════════════════

  _spawnWorkers() {
    this.workers = [];
    WORKER_SPAWNS.forEach(pos => {
      const dir = ['up', 'down', 'left', 'right'][Phaser.Math.Between(0, 3)];
      const sprite = this.physics.add.sprite(pos.x, pos.y, `ps_worker_${dir}_0`);
      sprite.setDepth(2);
      sprite.body.setSize(16, 16);
      sprite.body.setOffset(8, 12);

      this.workers.push({
        sprite,
        facing: dir,
        moveTimer: Phaser.Math.Between(0, 3000),
        moveInterval: Phaser.Math.Between(2000, 5000),
        animFrame: 0,
        animTimer: 0,
        speed: 20,
        targetX: pos.x,
        targetY: pos.y,
      });
    });
  }

  // ════════════════════════════════════════════════════════════
  // HUD
  // ════════════════════════════════════════════════════════════

  _buildHUD() {
    // HUD background bar
    this.add.rectangle(W / 2, HUD_H / 2, W, HUD_H, 0x111111, 0.9)
      .setDepth(100).setScrollFactor(0);

    // Title
    this.hudTitle = this.add.text(W / 2, 8, 'OPERATION PORT SWAP', {
      fontFamily: 'monospace', fontSize: '12px', color: '#FFD700', fontStyle: 'bold',
    }).setOrigin(0.5, 0).setDepth(101).setScrollFactor(0);

    // Phase text
    this.hudPhase = this.add.text(W / 2, 26, 'PHASE 1: LOCATE TARGET', {
      fontFamily: 'monospace', fontSize: '10px', color: '#00ddaa',
    }).setOrigin(0.5, 0).setDepth(101).setScrollFactor(0);

    // Suspicion bar background
    this.add.rectangle(W / 2, 42, 300, 8, 0x333333, 1)
      .setDepth(101).setScrollFactor(0);
    // Suspicion bar fill
    this.susBar = this.add.rectangle(W / 2 - 149, 42, 1, 6, 0x00ff66, 1)
      .setOrigin(0, 0.5).setDepth(102).setScrollFactor(0);
    // Suspicion label
    this.susLabel = this.add.text(W / 2 - 155, 42, 'SUS', {
      fontFamily: 'monospace', fontSize: '7px', color: '#888',
    }).setOrigin(1, 0.5).setDepth(101).setScrollFactor(0);

    // Distractions counter (right side)
    this.hudDistract = this.add.text(W - 16, 10, `Q: DISTRACT x${this.distractionsLeft}`, {
      fontFamily: 'monospace', fontSize: '9px', color: '#aaaaaa',
    }).setOrigin(1, 0).setDepth(101).setScrollFactor(0);

    // Intel panel (bottom left) — persistent target info with background
    const panelW = 460, panelH = 46;
    this.add.rectangle(panelW / 2 + 8, H - panelH / 2 - 6, panelW, panelH, 0x000000, 0.8)
      .setDepth(100).setScrollFactor(0);
    const ipBorder = this.add.graphics().setDepth(100).setScrollFactor(0);
    ipBorder.lineStyle(1, 0xFFD700, 0.5);
    ipBorder.strokeRoundedRect(8, H - panelH - 6, panelW, panelH, 4);
    const markingType = this.intel.text[2].replace('Has ', '');
    this.add.text(16, H - panelH, `TARGET: ${this.intel.color.toUpperCase()} container / ${this.intel.zone.toUpperCase()} dock / ${markingType}`, {
      fontFamily: 'monospace', fontSize: '13px', color: '#FFD700', fontStyle: 'bold',
      wordWrap: { width: panelW - 16 }, lineSpacing: 4,
    }).setDepth(101).setScrollFactor(0);
    // Radio intel messages (appear above panel)
    this.intelText = this.add.text(16, H - panelH - 18, '', {
      fontFamily: 'monospace', fontSize: '10px', color: '#00ff88',
    }).setOrigin(0, 1).setDepth(101).setScrollFactor(0);

    // Interaction prompt (center bottom, hidden) — large with background
    this.promptBg = this.add.rectangle(W / 2, H - 65, 500, 40, 0x000000, 0.75)
      .setDepth(104).setScrollFactor(0).setAlpha(0);
    this.promptText = this.add.text(W / 2, H - 65, '', {
      fontFamily: 'monospace', fontSize: '16px', color: '#ffffff', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(105).setScrollFactor(0).setAlpha(0);

    // (Controls bar is now handled by showControlsOverlay in create())

    // Guard nearby warning (during swap)
    this.guardWarnText = this.add.text(W / 2, H / 2 - 40, '⚠ GUARD NEARBY!', {
      fontFamily: 'monospace', fontSize: '14px', color: '#ff3333', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(105).setScrollFactor(0).setAlpha(0);

    // Scan progress bar (hidden)
    this.scanBarBg = this.add.rectangle(W / 2, H / 2 + 30, 100, 8, 0x333333, 0.8)
      .setDepth(105).setScrollFactor(0).setVisible(false);
    this.scanBarFill = this.add.rectangle(W / 2 - 49, H / 2 + 30, 1, 6, 0x00ffcc, 1)
      .setOrigin(0, 0.5).setDepth(106).setScrollFactor(0).setVisible(false);
    this.scanLabel = this.add.text(W / 2, H / 2 + 20, '', {
      fontFamily: 'monospace', fontSize: '10px', color: '#00ffcc',
    }).setOrigin(0.5).setDepth(106).setScrollFactor(0).setVisible(false);

    // Hard mode badge
    if (DifficultyManager.get().isHard()) {
      this.add.text(W - 16, 36, 'HARD', {
        fontFamily: 'monospace', fontSize: '8px', color: '#ff4444', fontStyle: 'bold',
      }).setOrigin(1, 0).setDepth(101).setScrollFactor(0);
    }

    // Vision cone graphics layer
    this.coneGfx = this.add.graphics().setDepth(3);

    // Minimap background
    const mmW = 120, mmH = 70;
    const mmX = W - mmW - 8, mmY = HUD_H + 8;
    this.mmX = mmX; this.mmY = mmY; this.mmW = mmW; this.mmH = mmH;
    this.add.rectangle(mmX + mmW / 2, mmY + mmH / 2, mmW, mmH, 0x000000, 0.6)
      .setDepth(100).setScrollFactor(0);
    this.add.rectangle(mmX + mmW / 2, mmY + mmH / 2, mmW, mmH, 0x00ff66, 0)
      .setStrokeStyle(1, 0x00ff66, 0.4).setDepth(100).setScrollFactor(0);
    this.mmGfx = this.add.graphics().setDepth(101).setScrollFactor(0);
  }

  // ════════════════════════════════════════════════════════════
  // INPUT SETUP
  // ════════════════════════════════════════════════════════════

  _setupInput() {
    const K = Phaser.Input.Keyboard.KeyCodes;
    this.keys = {
      up:    this.input.keyboard.addKey(K.W),
      down:  this.input.keyboard.addKey(K.S),
      left:  this.input.keyboard.addKey(K.A),
      right: this.input.keyboard.addKey(K.D),
      arrowUp:    this.input.keyboard.addKey(K.UP),
      arrowDown:  this.input.keyboard.addKey(K.DOWN),
      arrowLeft:  this.input.keyboard.addKey(K.LEFT),
      arrowRight: this.input.keyboard.addKey(K.RIGHT),
      space:  this.input.keyboard.addKey(K.SPACE),
      interact: this.input.keyboard.addKey(K.E),
      distract: this.input.keyboard.addKey(K.Q),
      sprint: this.input.keyboard.addKey(K.SHIFT),
      esc:    this.input.keyboard.addKey(K.ESC),
      skip:   this.input.keyboard.addKey(K.P),
      mute:   this.input.keyboard.addKey(K.M),
      enter:  this.input.keyboard.addKey(K.ENTER),
      yKey:   this.input.keyboard.addKey(K.Y),
      nKey:   this.input.keyboard.addKey(K.N),
    };
  }

  // ════════════════════════════════════════════════════════════
  // INTEL MESSAGES
  // ════════════════════════════════════════════════════════════

  _showIntelMessage(text, delay) {
    this.time.delayedCall(delay, () => {
      if (this.missionFailed || this.missionComplete) return;
      this.intelText.setText(`INTEL: ${text}`);
      SoundManager.get().playRadarBlip();
      // Flash effect
      this.intelText.setAlpha(1);
      this.tweens.add({
        targets: this.intelText,
        alpha: 0.7,
        duration: 2000,
        ease: 'Sine.easeOut',
      });
    });
  }

  // ════════════════════════════════════════════════════════════
  // MISSION BRIEFING & BIG MESSAGES
  // ════════════════════════════════════════════════════════════

  _showMissionBriefing() {
    this._briefingActive = true;
    const markings = this.intel.text[2].replace('Has ', '').toUpperCase();
    const lines = [
      `FIND THE ${this.intel.color.toUpperCase()} CONTAINER`,
      `WITH ${markings}`,
      `IN THE ${this.intel.zone.toUpperCase()} DOCK`,
    ];
    const overlay = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.85)
      .setDepth(500).setScrollFactor(0);
    const title = this.add.text(W / 2, H / 2 - 80, 'MISSION OBJECTIVE', {
      fontFamily: 'monospace', fontSize: '14px', color: '#00ddaa',
    }).setOrigin(0.5).setDepth(501).setScrollFactor(0);
    const obj = this.add.text(W / 2, H / 2 - 10, lines.join('\n'), {
      fontFamily: 'monospace', fontSize: '22px', color: '#FFD700', fontStyle: 'bold',
      align: 'center', lineSpacing: 10,
    }).setOrigin(0.5).setDepth(501).setScrollFactor(0);
    const controls = this.add.text(W / 2, H / 2 + 80, [
      'WASD = Move   SPACE = Scan   SHIFT = Sprint',
      'Q = Distract   E = Interact',
    ].join('\n'), {
      fontFamily: 'monospace', fontSize: '10px', color: '#666666',
      align: 'center', lineSpacing: 4,
    }).setOrigin(0.5).setDepth(501).setScrollFactor(0);
    const els = [overlay, title, obj, controls];
    this.time.delayedCall(4000, () => {
      this._briefingActive = false;
      this.tweens.add({
        targets: els, alpha: 0, duration: 600,
        onComplete: () => els.forEach(e => e.destroy()),
      });
    });
  }

  _showBigMessage(text, color, duration = 3000) {
    const bg = this.add.rectangle(W / 2, H / 2, W, 56, 0x000000, 0.85)
      .setDepth(150).setScrollFactor(0);
    const msg = this.add.text(W / 2, H / 2, text, {
      fontFamily: 'monospace', fontSize: '22px', color, fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 4,
    }).setOrigin(0.5).setDepth(151).setScrollFactor(0);
    if (duration > 0) {
      this.time.delayedCall(duration, () => {
        this.tweens.add({
          targets: [bg, msg], alpha: 0, duration: 500,
          onComplete: () => { bg.destroy(); msg.destroy(); },
        });
      });
    }
    return { bg, msg };
  }

  // ════════════════════════════════════════════════════════════
  // WAYPOINT ARROW
  // ════════════════════════════════════════════════════════════

  _getZoneCenter(zone) {
    switch (zone) {
      case 'north': return { x: 304, y: 198 };
      case 'south': return { x: 304, y: 388 };
      case 'east':  return { x: 668, y: 240 };
      default:      return { x: 400, y: 270 };
    }
  }

  _drawWaypointArrow() {
    if (!this.waypointGfx) {
      this.waypointGfx = this.add.graphics().setDepth(50);
    }
    this.waypointGfx.clear();

    let target = null;
    let color = 0xFFD700;

    if (this.phase === PHASE_LOCATE && !this.scanning && !this._waitingForSwapStart) {
      target = this._getZoneCenter(this.intel.zone);
    } else if (this.phase === PHASE_EVAC) {
      target = { x: this.entranceX, y: this.entranceY };
      color = 0xff3333;
    }

    if (!target) return;

    const dx = target.x - this.player.x;
    const dy = target.y - this.player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 60) return;

    const angle = Math.atan2(dy, dx);
    const pulse = 0.4 + 0.4 * Math.sin(this.time.now / 300);

    for (let i = 0; i < 3; i++) {
      const d = 50 + i * 14;
      const cx = this.player.x + Math.cos(angle) * d;
      const cy = this.player.y + Math.sin(angle) * d;
      const sz = 8;
      const a = pulse - i * 0.15;
      if (a <= 0) continue;

      this.waypointGfx.lineStyle(2.5, color, a);
      this.waypointGfx.beginPath();
      this.waypointGfx.moveTo(cx + Math.cos(angle + 2.5) * sz, cy + Math.sin(angle + 2.5) * sz);
      this.waypointGfx.lineTo(cx + Math.cos(angle) * sz * 1.3, cy + Math.sin(angle) * sz * 1.3);
      this.waypointGfx.lineTo(cx + Math.cos(angle - 2.5) * sz, cy + Math.sin(angle - 2.5) * sz);
      this.waypointGfx.strokePath();
    }
  }

  // ════════════════════════════════════════════════════════════
  // UPDATE LOOP
  // ════════════════════════════════════════════════════════════

  update(time, delta) {
    if (this.missionFailed || this.missionComplete) {
      this._handleEndInput();
      return;
    }

    // Skip prompt
    if (this.skipPromptShown) {
      this._handleSkipResponse();
      return;
    }

    // Mute
    if (Phaser.Input.Keyboard.JustDown(this.keys.mute)) {
      const muted = SoundManager.get().toggleMute();
      MusicManager.get().setMuted(muted);
    }

    // Pause
    if (Phaser.Input.Keyboard.JustDown(this.keys.esc)) {
      this._togglePause();
      return;
    }
    if (this.isPaused) return;
    if (this._briefingActive) return;

    // Skip
    if (Phaser.Input.Keyboard.JustDown(this.keys.skip)) {
      this._showSkipPrompt();
      return;
    }

    const dt = Math.min(delta, 33) / 1000; // seconds

    // Update subsystems
    const dtMs = dt * 1000; // also keep ms version
    this._updatePlayer(dt);
    this._updateGuards(dt);
    this._updateCameras(dt);
    this._updateWorkers(dt);
    this._updateSuspicion(dt);
    this._updatePhaseLogic(dt, dtMs);
    this._drawCones();
    this._drawWaypointArrow();
    this._drawMinimap();
    this._updateHUD(dtMs);
  }

  // ════════════════════════════════════════════════════════════
  // PLAYER UPDATE
  // ════════════════════════════════════════════════════════════

  _updatePlayer(dt) {
    // Frozen during scan, swap, or briefing
    if (this.scanning || this.phase === PHASE_SWAP || this._briefingActive) {
      this.player.setVelocity(0, 0);
      return;
    }

    const k = this.keys;
    let vx = 0, vy = 0;

    if (k.left.isDown || k.arrowLeft.isDown) vx = -1;
    else if (k.right.isDown || k.arrowRight.isDown) vx = 1;
    if (k.up.isDown || k.arrowUp.isDown) vy = -1;
    else if (k.down.isDown || k.arrowDown.isDown) vy = 1;

    // Determine facing
    if (vx < 0) this.playerFacing = 'left';
    else if (vx > 0) this.playerFacing = 'right';
    else if (vy < 0) this.playerFacing = 'up';
    else if (vy > 0) this.playerFacing = 'down';

    // Normalize diagonal
    if (vx !== 0 && vy !== 0) {
      vx *= 0.707;
      vy *= 0.707;
    }

    this.isSprinting = k.sprint.isDown && (vx !== 0 || vy !== 0);
    const speed = this.isSprinting ? SPRINT_SPEED : PLAYER_SPEED;
    this.player.setVelocity(vx * speed, vy * speed);

    // Hiding check: pressing against a container while not moving toward it
    this.isHiding = false;
    if (vx === 0 && vy === 0) {
      // Check if player is adjacent to a container
      for (const c of this.containers) {
        const dist = Phaser.Math.Distance.Between(
          this.player.x, this.player.y, c.sprite.x, c.sprite.y
        );
        if (dist < 35) {
          this.isHiding = true;
          break;
        }
      }
    }

    // Near worker check
    this.nearWorker = false;
    for (const w of this.workers) {
      if (Phaser.Math.Distance.Between(
        this.player.x, this.player.y, w.sprite.x, w.sprite.y
      ) < 50) {
        this.nearWorker = true;
        break;
      }
    }

    // Animation
    const moving = vx !== 0 || vy !== 0;
    if (moving) {
      this.playerAnimTimer += dt * 1000;
      if (this.playerAnimTimer > 200) {
        this.playerAnimTimer = 0;
        this.playerAnimFrame = 1 - this.playerAnimFrame;
      }
      // Step sounds
      this.playerStepTimer += dt * 1000;
      if (this.playerStepTimer > 300) {
        this.playerStepTimer = 0;
        SoundManager.get().playStep();
      }
    } else {
      this.playerAnimFrame = 0;
      this.playerStepTimer = 0;
    }
    this.player.setTexture(`ps_player_${this.playerFacing}_${this.playerAnimFrame}`);

    // Distraction throw
    if (Phaser.Input.Keyboard.JustDown(k.distract) && this.distractionsLeft > 0
        && this.phase !== PHASE_SWAP) {
      this._throwDistraction();
    }
  }

  // ════════════════════════════════════════════════════════════
  // GUARD UPDATE
  // ════════════════════════════════════════════════════════════

  _updateGuards(dt) {
    for (const guard of this.guards) {
      // Distracted — move to distraction point
      if (guard.distracted) {
        guard.distractTimer -= dt * 1000;
        if (guard.distractTimer <= 0) {
          guard.distracted = false;
          guard.distractTarget = null;
        } else if (guard.distractTarget) {
          const dx = guard.distractTarget.x - guard.sprite.x;
          const dy = guard.distractTarget.y - guard.sprite.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > 5) {
            const s = guard.speed * 1.2;
            guard.sprite.x += (dx / dist) * s * dt;
            guard.sprite.y += (dy / dist) * s * dt;
            guard.facing = Math.abs(dx) > Math.abs(dy)
              ? (dx > 0 ? 'right' : 'left')
              : (dy > 0 ? 'down' : 'up');
          }
        }
      } else {
        // Patrol movement
        const target = guard.patrol[guard.waypointIdx];
        const dx = target.x - guard.sprite.x;
        const dy = target.y - guard.sprite.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        const spd = this.phase === PHASE_EVAC ? GUARD_ALERT_SPEED : guard.speed;

        if (dist < 5) {
          guard.waypointIdx = (guard.waypointIdx + 1) % guard.patrol.length;
        } else {
          guard.sprite.x += (dx / dist) * spd * dt;
          guard.sprite.y += (dy / dist) * spd * dt;
          guard.facing = Math.abs(dx) > Math.abs(dy)
            ? (dx > 0 ? 'right' : 'left')
            : (dy > 0 ? 'down' : 'up');
        }
      }

      // Animation
      guard.animTimer += dt * 1000;
      if (guard.animTimer > 250) {
        guard.animTimer = 0;
        guard.animFrame = 1 - guard.animFrame;
      }
      guard.sprite.setTexture(`ps_guard_${guard.facing}_${guard.animFrame}`);
    }
  }

  // ════════════════════════════════════════════════════════════
  // SECURITY CAMERA UPDATE
  // ════════════════════════════════════════════════════════════

  _updateCameras(dt) {
    for (const cam of this.secCams) {
      cam.angle += CAM_ROT_SPEED * cam.direction * dt;
      // Oscillate between limits
      if (cam.angle > cam.direction * Math.PI * 2) {
        cam.direction = -cam.direction;
      }
      // Simpler: just rotate continuously
      if (cam.angle > Math.PI * 2) cam.angle -= Math.PI * 2;
      if (cam.angle < 0) cam.angle += Math.PI * 2;
    }
  }

  // ════════════════════════════════════════════════════════════
  // WORKER UPDATE (random wandering)
  // ════════════════════════════════════════════════════════════

  _updateWorkers(dt) {
    for (const w of this.workers) {
      w.moveTimer += dt * 1000;
      if (w.moveTimer >= w.moveInterval) {
        w.moveTimer = 0;
        w.moveInterval = Phaser.Math.Between(2000, 5000);
        // Pick new target nearby
        w.targetX = w.sprite.x + Phaser.Math.Between(-40, 40);
        w.targetY = w.sprite.y + Phaser.Math.Between(-40, 40);
        // Clamp to play area
        w.targetX = Phaser.Math.Clamp(w.targetX, 50, 800);
        w.targetY = Phaser.Math.Clamp(w.targetY, HUD_H + 100, H - 20);
      }

      const dx = w.targetX - w.sprite.x;
      const dy = w.targetY - w.sprite.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 3) {
        w.sprite.x += (dx / dist) * w.speed * dt;
        w.sprite.y += (dy / dist) * w.speed * dt;
        w.facing = Math.abs(dx) > Math.abs(dy)
          ? (dx > 0 ? 'right' : 'left')
          : (dy > 0 ? 'down' : 'up');
      }

      w.animTimer += dt * 1000;
      if (w.animTimer > 300) {
        w.animTimer = 0;
        w.animFrame = 1 - w.animFrame;
      }
      w.sprite.setTexture(`ps_worker_${w.facing}_${w.animFrame}`);
    }
  }

  // ════════════════════════════════════════════════════════════
  // SUSPICION SYSTEM
  // ════════════════════════════════════════════════════════════

  _updateSuspicion(dt) {
    let susIncrease = 0;
    let inCone = false;

    // Guard vision cones
    for (const guard of this.guards) {
      if (this._isInGuardCone(guard)) {
        if (!this.isHiding) {
          susIncrease += SUS_GUARD_RATE;
          inCone = true;
        }
      }
    }

    // Camera vision cones
    for (const cam of this.secCams) {
      if (this._isInCameraCone(cam)) {
        if (!this.isHiding) {
          susIncrease += SUS_CAMERA_RATE;
          inCone = true;
        }
      }
    }

    // Sprint penalty near guards
    if (this.isSprinting) {
      for (const guard of this.guards) {
        if (Phaser.Math.Distance.Between(
          this.player.x, this.player.y, guard.sprite.x, guard.sprite.y
        ) < 80) {
          susIncrease += SUS_SPRINT_ADD;
        }
      }
    }

    // Apply increase
    if (susIncrease > 0) {
      this.suspicion += susIncrease * dt;
      if (inCone && !this._detectionFlashing) {
        this._detectionFlashing = true;
        this.cameras.main.flash(200, 255, 50, 50);
        SoundManager.get().playSearchlightDetect();
        this.time.delayedCall(1500, () => { this._detectionFlashing = false; });
      }
    } else {
      // Decay
      let decay = SUS_DECAY_RATE;
      if (this.nearWorker) decay += SUS_WORKER_DECAY;
      this.suspicion -= decay * dt;
    }

    this.suspicion = Phaser.Math.Clamp(this.suspicion, 0, 100);
    if (this.suspicion > this.peakSuspicion) this.peakSuspicion = this.suspicion;

    // Alert! — mission failed
    if (this.suspicion >= 100) {
      this._missionFailed('DETECTED — COVER BLOWN');
    }
  }

  _isInGuardCone(guard) {
    const gx = guard.sprite.x, gy = guard.sprite.y;
    const px = this.player.x, py = this.player.y;
    const dist = Phaser.Math.Distance.Between(gx, gy, px, py);
    if (dist > GUARD_CONE_RANGE) return false;

    const facingAngle = this._dirToAngle(guard.facing);
    const angleToPlayer = Math.atan2(py - gy, px - gx);
    let diff = angleToPlayer - facingAngle;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;

    return Math.abs(diff) < GUARD_CONE_ANGLE / 2;
  }

  _isInCameraCone(cam) {
    const dist = Phaser.Math.Distance.Between(cam.x, cam.y, this.player.x, this.player.y);
    if (dist > CAM_CONE_RANGE) return false;

    const angleToPlayer = Math.atan2(this.player.y - cam.y, this.player.x - cam.x);
    let diff = angleToPlayer - cam.angle;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;

    return Math.abs(diff) < GUARD_CONE_ANGLE / 2;
  }

  _dirToAngle(dir) {
    switch (dir) {
      case 'right': return 0;
      case 'down':  return Math.PI / 2;
      case 'left':  return Math.PI;
      case 'up':    return -Math.PI / 2;
    }
    return 0;
  }

  // ════════════════════════════════════════════════════════════
  // VISION CONE DRAWING
  // ════════════════════════════════════════════════════════════

  _drawCones() {
    this.coneGfx.clear();

    // Guard cones
    for (const guard of this.guards) {
      const angle = this._dirToAngle(guard.facing);
      this._drawCone(
        guard.sprite.x, guard.sprite.y,
        GUARD_CONE_RANGE, angle, GUARD_CONE_ANGLE,
        0xffff00, 0.12
      );
    }

    // Camera cones
    for (const cam of this.secCams) {
      this._drawCone(
        cam.x, cam.y,
        CAM_CONE_RANGE, cam.angle, GUARD_CONE_ANGLE,
        0xff4444, 0.12
      );
    }

    // Sprint noise waves
    if (this.isSprinting) {
      this.coneGfx.lineStyle(1, 0xffcc00, 0.3);
      this.coneGfx.strokeCircle(this.player.x, this.player.y, 30);
      this.coneGfx.strokeCircle(this.player.x, this.player.y, 40);
    }
  }

  _drawCone(x, y, range, angle, spread, color, alpha) {
    const startAngle = angle - spread / 2;
    const endAngle = angle + spread / 2;
    this.coneGfx.fillStyle(color, alpha);
    this.coneGfx.beginPath();
    this.coneGfx.moveTo(x, y);
    const segments = 12;
    for (let i = 0; i <= segments; i++) {
      const a = startAngle + (endAngle - startAngle) * (i / segments);
      this.coneGfx.lineTo(x + Math.cos(a) * range, y + Math.sin(a) * range);
    }
    this.coneGfx.closePath();
    this.coneGfx.fillPath();
  }

  // ════════════════════════════════════════════════════════════
  // PHASE LOGIC
  // ════════════════════════════════════════════════════════════

  _updatePhaseLogic(dt, dtMs) {
    if (this.phase === PHASE_LOCATE) {
      this._updateLocatePhase(dtMs);
    } else if (this.phase === PHASE_SWAP) {
      this._updateSwapPhase(dtMs);
    } else if (this.phase === PHASE_EVAC) {
      this._updateEvacPhase();
    }
  }

  // ── PHASE 1: LOCATE ──
  _updateLocatePhase(dtMs) {
    // Find nearest scannable container
    let nearest = null;
    let nearDist = Infinity;

    for (const c of this.containers) {
      if (c.scanned) continue;
      const dist = Phaser.Math.Distance.Between(
        this.player.x, this.player.y, c.sprite.x, c.sprite.y
      );
      if (dist < 50 && dist < nearDist) {
        nearest = c;
        nearDist = dist;
      }
    }

    // Highlight candidates that glow when nearby
    for (const c of this.containers) {
      if (c.isCandidate && !c.scanned) {
        const dist = Phaser.Math.Distance.Between(
          this.player.x, this.player.y, c.sprite.x, c.sprite.y
        );
        if (dist < 60) {
          c.sprite.setAlpha(0.7 + Math.sin(this.time.now / 200) * 0.3);
        } else {
          c.sprite.setAlpha(1);
        }
      }
    }

    if (nearest && !this.scanning) {
      this.promptText.setText('PRESS SPACE TO SCAN').setAlpha(1).setColor('#ffcc00');

      if (Phaser.Input.Keyboard.JustDown(this.keys.space)) {
        this._startScan(nearest);
      }
    } else if (!this.scanning) {
      this.promptText.setAlpha(0);
    }

    // Handle ongoing scan
    if (this.scanning) {
      this.scanTimer += dtMs;
      const pct = Math.min(this.scanTimer / SCAN_TIME, 1);
      this.scanBarFill.setScale(pct * 98, 1);

      if (this.scanTimer >= SCAN_TIME) {
        this._completeScan();
      }
    }
  }

  _startScan(container) {
    this.scanning = true;
    this.scanTimer = 0;
    this.scanTarget = container;
    this.scanBarBg.setVisible(true);
    this.scanBarFill.setVisible(true);
    this.scanLabel.setVisible(true).setText('SCANNING...');
    this.promptText.setAlpha(0);
    SoundManager.get().playRadarBlip();
  }

  _completeScan() {
    this.scanning = false;
    this.scanBarBg.setVisible(false);
    this.scanBarFill.setVisible(false);
    this.scanTarget.scanned = true;
    this.containersScanned++;

    if (this.scanTarget.isTarget) {
      // Found it!
      this.scanLabel.setText('TARGET CONFIRMED').setColor('#00ff66');
      SoundManager.get().playInterceptSuccess();
      this.cameras.main.flash(300, 0, 255, 100);
      this.swapTargetContainer = this.scanTarget;
      this._targetFoundMsg = this._showBigMessage('TARGET FOUND — PRESS E TO START SWAP', '#00ff66', 0);

      this.time.delayedCall(1200, () => {
        this.scanLabel.setVisible(false);
        this.promptText.setText('PRESS E TO START SWAP').setAlpha(1).setColor('#00ff66');
        // Wait for E press
        this._waitingForSwapStart = true;
      });
    } else {
      // Wrong container
      this.scanLabel.setText('NEGATIVE').setColor('#ff3333');
      SoundManager.get().playInterceptFail();
      this.cameras.main.flash(200, 255, 50, 50);

      this.time.delayedCall(1000, () => {
        this.scanLabel.setVisible(false);
        this.scanTarget = null;
      });
    }
  }

  // ── PHASE 2: SWAP ──
  _updateSwapPhase(dtMs) {
    // Check if guard is near the target container
    this.guardNearSwap = false;
    if (this.swapTargetContainer) {
      for (const guard of this.guards) {
        const dist = Phaser.Math.Distance.Between(
          guard.sprite.x, guard.sprite.y,
          this.swapTargetContainer.sprite.x, this.swapTargetContainer.sprite.y
        );
        if (dist < 80) {
          this.guardNearSwap = true;
          break;
        }
      }
    }

    // Show/hide guard warning
    this.guardWarnText.setAlpha(this.guardNearSwap ? 0.7 + Math.sin(this.time.now / 150) * 0.3 : 0);

    // If guard catches open container
    if (this.guardNearSwap && this.swapStep > 0 && this.swapStep < 3) {
      this.suspicion = Math.max(this.suspicion, SUS_SWAP_CAUGHT);
    }

    // Progress the swap steps
    if (this.swapStep >= 1 && this.swapStep <= 3) {
      const stepTimes = [0, SWAP_REMOVE, SWAP_PLANT, SWAP_CLOSE];
      const stepLabels = ['', 'STEP 1/3: REMOVE CARGO (HOLD SPACE)', 'STEP 2/3: PLANT DEVICE (HOLD SPACE)', 'STEP 3/3: CLOSE CONTAINER (HOLD SPACE)'];
      const targetTime = stepTimes[this.swapStep];

      if (this.keys.space.isDown) this.swapProgress += dtMs;
      const pct = Math.min(this.swapProgress / targetTime, 1);

      this.scanBarBg.setVisible(true);
      this.scanBarFill.setVisible(true).setScale(pct * 98, 1);
      this.scanLabel.setVisible(true).setText(stepLabels[this.swapStep]).setColor('#ffcc00');

      if (this.swapProgress >= targetTime) {
        SoundManager.get().playDoorClose();
        this.swapStep++;
        this.swapProgress = 0;

        if (this.swapStep > 3) {
          // Swap complete!
          this._swapComplete();
        }
      }
    }
  }

  _swapComplete() {
    this.scanBarBg.setVisible(false);
    this.scanBarFill.setVisible(false);
    this.scanLabel.setVisible(false);
    this.guardWarnText.setAlpha(0);

    this.phase = PHASE_EVAC;
    SoundManager.get().playInterceptSuccess();
    MusicManager.get().playLevel2Music(true); // intense mode

    this.hudPhase.setText('PHASE 3: EVACUATE');
    this.promptText.setText('ESCAPE TO EXIT — GO SOUTH').setAlpha(1).setColor('#ff3333');
    this._showBigMessage('ESCAPE TO EXIT — GO SOUTH', '#ff3333', 4000);

    // Flash exit marker
    this.tweens.add({
      targets: this.exitMarker,
      alpha: { from: 1, to: 0.3 },
      duration: 400,
      yoyo: true,
      repeat: -1,
    });

    this.cameras.main.flash(400, 0, 200, 100);

    this.time.delayedCall(2000, () => {
      this.promptText.setAlpha(0);
    });
  }

  // ── PHASE 3: EVACUATE ──
  _updateEvacPhase() {
    // Check if player reached entrance
    const dist = Phaser.Math.Distance.Between(
      this.player.x, this.player.y, this.entranceX, this.entranceY
    );

    if (dist < 30) {
      this._missionComplete();
    }

    // Show distance hint
    if (dist < 100) {
      this.promptText.setText('ALMOST THERE...').setAlpha(1).setColor('#00ff66');
    }
  }

  // ════════════════════════════════════════════════════════════
  // DISTRACTION SYSTEM
  // ════════════════════════════════════════════════════════════

  _throwDistraction() {
    this.distractionsLeft--;
    this.distractionsUsed++;
    this.hudDistract.setText(`Q: DISTRACT x${this.distractionsLeft}`);

    // Calculate throw target (in facing direction, ~120px away)
    const angles = { up: -Math.PI / 2, down: Math.PI / 2, left: Math.PI, right: 0 };
    const angle = angles[this.playerFacing];
    const throwDist = 120;
    const tx = this.player.x + Math.cos(angle) * throwDist;
    const ty = this.player.y + Math.sin(angle) * throwDist;

    // Rock projectile
    const rock = this.add.image(this.player.x, this.player.y, 'ps_rock').setDepth(6);
    this.tweens.add({
      targets: rock,
      x: tx, y: ty,
      duration: 400,
      ease: 'Quad.easeOut',
      onComplete: () => {
        rock.destroy();
        // Impact effect
        SoundManager.get().playBombImpact();
        this._showImpactRing(tx, ty);

        // Attract nearby guards
        for (const guard of this.guards) {
          const gDist = Phaser.Math.Distance.Between(guard.sprite.x, guard.sprite.y, tx, ty);
          if (gDist < 150) {
            guard.distracted = true;
            guard.distractTimer = GUARD_DISTRACT_TIME;
            guard.distractTarget = { x: tx, y: ty };
          }
        }
      },
    });
  }

  _showImpactRing(x, y) {
    const circle = this.add.circle(x, y, 5, 0xffcc00, 0.6).setDepth(5);
    this.tweens.add({
      targets: circle,
      scaleX: 6, scaleY: 6,
      alpha: 0,
      duration: 800,
      ease: 'Quad.easeOut',
      onComplete: () => circle.destroy(),
    });
    // Question mark over nearby guards
    for (const guard of this.guards) {
      const gDist = Phaser.Math.Distance.Between(guard.sprite.x, guard.sprite.y, x, y);
      if (gDist < 150) {
        const q = this.add.text(guard.sprite.x, guard.sprite.y - 20, '?', {
          fontFamily: 'monospace', fontSize: '16px', color: '#ffcc00', fontStyle: 'bold',
        }).setOrigin(0.5).setDepth(10);
        this.tweens.add({
          targets: q,
          y: guard.sprite.y - 35,
          alpha: 0,
          duration: 1500,
          onComplete: () => q.destroy(),
        });
      }
    }
  }

  // ════════════════════════════════════════════════════════════
  // HUD UPDATE
  // ════════════════════════════════════════════════════════════

  _updateHUD(dtMs) {
    // Suspicion bar
    const pct = this.suspicion / 100;
    this.susBar.setScale(pct * 298, 1);

    // Color based on level
    if (this.suspicion < 30) {
      this.susBar.setFillStyle(0x00ff66);
    } else if (this.suspicion < 60) {
      this.susBar.setFillStyle(0xffdd00);
    } else {
      this.susBar.setFillStyle(0xff3333);
    }

    // High suspicion screen pulse
    if (this.suspicion > 70) {
      const pulse = Math.sin(this.time.now / 200) * 0.05 + 0.05;
      this.cameras.main.setAlpha(1 - pulse);
    } else {
      this.cameras.main.setAlpha(1);
    }

    // Sync prompt background with text
    if (this.promptBg) this.promptBg.setAlpha(this.promptText.alpha > 0 ? 0.75 : 0);

    // E to start swap (phase 1 → 2 transition)
    if (this._waitingForSwapStart && Phaser.Input.Keyboard.JustDown(this.keys.interact)) {
      this._waitingForSwapStart = false;
      if (this._targetFoundMsg) {
        this._targetFoundMsg.bg.destroy();
        this._targetFoundMsg.msg.destroy();
        this._targetFoundMsg = null;
      }
      this.phase = PHASE_SWAP;
      this.swapStep = 1;
      this.swapProgress = 0;
      this.hudPhase.setText('PHASE 2: SWAP PACKAGE');
      this.promptText.setAlpha(0);
      SoundManager.get().playDoorOpen();
    }
  }

  // ════════════════════════════════════════════════════════════
  // MINIMAP
  // ════════════════════════════════════════════════════════════

  _drawMinimap() {
    this.mmGfx.clear();
    const sx = this.mmW / W;
    const sy = this.mmH / H;

    // Containers (small dots)
    for (const c of this.containers) {
      const colors = { red: 0xff3333, blue: 0x3366ff, green: 0x33cc55, yellow: 0xffcc00, orange: 0xff8833 };
      this.mmGfx.fillStyle(colors[c.color] || 0x888888, 0.6);
      this.mmGfx.fillRect(this.mmX + c.sprite.x * sx, this.mmY + c.sprite.y * sy, 2, 1);
    }

    // Guards (yellow dots)
    for (const guard of this.guards) {
      this.mmGfx.fillStyle(0xffff00, 0.8);
      this.mmGfx.fillRect(this.mmX + guard.sprite.x * sx - 1, this.mmY + guard.sprite.y * sy - 1, 3, 3);
    }

    // Player (bright green)
    this.mmGfx.fillStyle(0x00ff66, 1);
    this.mmGfx.fillRect(this.mmX + this.player.x * sx - 2, this.mmY + this.player.y * sy - 2, 4, 4);

    // Entrance (if evac phase)
    if (this.phase === PHASE_EVAC) {
      this.mmGfx.fillStyle(0x00ff66, 0.5 + Math.sin(this.time.now / 300) * 0.5);
      this.mmGfx.fillCircle(this.mmX + this.entranceX * sx, this.mmY + this.entranceY * sy, 3);
    }
  }

  // ════════════════════════════════════════════════════════════
  // MISSION END
  // ════════════════════════════════════════════════════════════

  _missionFailed(reason) {
    if (this.missionFailed) return;
    this.missionFailed = true;
    this.timesDetected++;

    SoundManager.get().playCameraAlarm();
    MusicManager.get().stop(0.5);

    this.player.setVelocity(0, 0);
    this.cameras.main.flash(500, 255, 0, 0);

    // Overlay with defeat buttons
    this.time.delayedCall(800, () => {
      this._endScreen = showDefeatScreen(this, {
        title: 'MISSION FAILED',
        stats: [{ label: 'REASON', value: reason }],
        currentScene: 'BeirutRadarScene',
        skipScene: 'DeepStrikeIntroCinematicScene',
      });
    });
  }

  _missionComplete() {
    if (this.missionComplete) return;
    this.missionComplete = true;

    MusicManager.get().stop(0.5);
    SoundManager.get().playVictory();

    this.player.setVelocity(0, 0);
    this.cameras.main.flash(300, 255, 255, 255);

    const elapsed = (this.time.now - this.startTime) / 1000;
    const minutes = Math.floor(elapsed / 60);
    const seconds = Math.floor(elapsed % 60);
    const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;

    // Stealth rating
    let rating = 'GHOST';
    let stars = 3;
    if (this.peakSuspicion > 30) { rating = 'SHADOW'; stars = 2; }
    if (this.peakSuspicion > 60) { rating = 'DETECTED'; stars = 1; }

    try { localStorage.setItem('superzion_stars_2', String(Math.max(stars, parseInt(localStorage.getItem('superzion_stars_2') || '0')))); } catch(e) {}

    this.time.delayedCall(600, () => {
      this._endScreen = showVictoryScreen(this, {
        title: 'MISSION COMPLETE',
        stats: [
          { label: 'OPERATION', value: 'PORT SWAP' },
          { label: 'CONTAINERS SCANNED', value: String(this.containersScanned) },
          { label: 'TIMES DETECTED', value: String(this.timesDetected) },
          { label: 'DISTRACTIONS USED', value: `${this.distractionsUsed}/${MAX_DISTRACTIONS}` },
          { label: 'TIME', value: timeStr },
          { label: 'STEALTH RATING', value: rating },
        ],
        stars,
        currentScene: 'BeirutRadarScene',
        nextScene: 'DeepStrikeIntroCinematicScene',
      });
    });
  }

  _handleEndInput() {
    // EndScreen buttons handle R/S/ENTER key bindings
  }

  // ════════════════════════════════════════════════════════════
  // PAUSE & SKIP
  // ════════════════════════════════════════════════════════════

  _togglePause() {
    this.isPaused = !this.isPaused;
    if (this.isPaused) {
      this.pauseOverlay = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.6).setDepth(300);
      this.pauseText = this.add.text(W / 2, H / 2 - 20, 'PAUSED', {
        fontFamily: 'monospace', fontSize: '28px', color: '#00ffcc', fontStyle: 'bold',
      }).setOrigin(0.5).setDepth(301);
      this.pauseSubText = this.add.text(W / 2, H / 2 + 20, 'ESC to resume \u2014 R to restart \u2014 Q to menu', {
        fontFamily: 'monospace', fontSize: '11px', color: '#448866',
      }).setOrigin(0.5).setDepth(301);
      this.physics.pause();
    } else {
      if (this.pauseOverlay) this.pauseOverlay.destroy();
      if (this.pauseText) this.pauseText.destroy();
      if (this.pauseSubText) this.pauseSubText.destroy();
      this.physics.resume();
    }
  }

  _showSkipPrompt() {
    if (this.skipPromptShown) return;
    this.skipPromptShown = true;
    this.isPaused = true;
    this.physics.pause();
    this.skipBg = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.6).setDepth(300);
    this.skipText = this.add.text(W / 2, H / 2 - 10, 'SKIP LEVEL?', {
      fontFamily: 'monospace', fontSize: '20px', color: '#ffcc00', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(301);
    this.skipSubText = this.add.text(W / 2, H / 2 + 15, 'Y = Skip   N = Cancel', {
      fontFamily: 'monospace', fontSize: '12px', color: '#888',
    }).setOrigin(0.5).setDepth(301);
  }

  _handleSkipResponse() {
    if (Phaser.Input.Keyboard.JustDown(this.keys.yKey)) {
      this._cleanupAndTransition();
    } else if (Phaser.Input.Keyboard.JustDown(this.keys.nKey)) {
      this.skipBg.destroy();
      this.skipText.destroy();
      this.skipSubText.destroy();
      this.skipPromptShown = false;
      this.isPaused = false;
      this.physics.resume();
    }
  }

  _cleanupAndTransition() {
    MusicManager.get().stop(0.5);
    this.cameras.main.fadeOut(500, 0, 0, 0);
    this.time.delayedCall(600, () => {
      this.scene.start('DeepStrikeIntroCinematicScene');
    });
  }

  // ════════════════════════════════════════════════════════════
  // SHUTDOWN
  // ════════════════════════════════════════════════════════════

  shutdown() {
    if (this._endScreen) this._endScreen.destroy();
    MusicManager.get().stop(0.2);
  }
}
