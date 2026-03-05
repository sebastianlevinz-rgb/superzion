// ═══════════════════════════════════════════════════════════════
// DroneScene — Level 4: Operation Underground (Top-Down)
// 3-phase: Recon → Tunnel Navigation → Command Center Destruction
// + Victory/Results overlay
// ═══════════════════════════════════════════════════════════════

import Phaser from 'phaser';
import SoundManager from '../systems/SoundManager.js';
import MusicManager from '../systems/MusicManager.js';
import DifficultyManager from '../systems/DifficultyManager.js';
import {
  createDroneSprite, createDesertTerrain,
  createTunnelWall, createTunnelFloor, createDoorTile, createInterferenceTile,
  createCommandRoom,
} from '../utils/DroneTextures.js';

const W = 960;
const H = 540;
const TILE = 40;

// Drone constants
const DRONE_SPEED = 160;       // recon phase px/s
const TUNNEL_SPEED = 120;      // tunnel phase px/s
const DRONE_SIZE = 20;         // collision half-size (radius)
const SCAN_RADIUS = 100;       // scanning range in recon
const SPOTLIGHT_RADIUS = 90;   // visibility in tunnels

// Phase durations
const RECON_TIME = 60;
const TUNNEL_TIME = 90;
const COMMAND_TIME = 30;

// Recon targets (tunnel entrance positions on desert terrain)
const RECON_TARGETS = [
  { x: 200, y: 160 }, { x: 480, y: 280 }, { x: 700, y: 200 },
  { x: 350, y: 420 }, { x: 820, y: 350 },
];

// Tunnel maze (24 columns × 13 rows)
// 0=floor, 1=wall, 2=door, 3=interference zone
const MAZE = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,0,1],
  [1,0,1,0,1,0,1,1,1,0,1,0,1,1,1,0,1,0,1,1,1,1,0,1],
  [1,0,1,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,0,1,0,1],
  [1,0,1,1,1,1,1,0,1,1,1,1,1,0,1,1,1,0,1,1,0,1,0,1],
  [1,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,1],
  [1,1,1,0,1,2,1,1,1,1,1,0,1,1,1,2,1,1,1,0,1,1,1,1],
  [1,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,1],
  [1,0,1,1,1,0,1,1,1,0,1,1,1,1,1,0,1,0,1,1,1,1,0,1],
  [1,0,0,0,0,0,1,3,0,0,0,0,0,3,1,0,1,0,0,0,0,0,0,1],
  [1,1,1,1,1,0,1,1,1,1,1,1,0,1,1,0,1,1,1,1,1,0,1,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
];

const MAZE_W = MAZE[0].length * TILE; // 960
const MAZE_H = MAZE.length * TILE;    // 520

// Tunnel entry/exit positions
const TUNNEL_START = { col: 1, row: 1 };
const TUNNEL_EXIT = { col: 22, row: 11 };

export default class DroneScene extends Phaser.Scene {
  constructor() { super('DroneScene'); }

  create() {
    const dm = DifficultyManager.get();
    this.dm = dm;
    this.cameras.main.setBackgroundColor('#000000');
    MusicManager.get().playLevel4Music('recon');

    // Generate textures
    createDroneSprite(this);
    createDesertTerrain(this);
    createTunnelWall(this);
    createTunnelFloor(this);
    createDoorTile(this);
    createInterferenceTile(this);
    createCommandRoom(this);

    // ── Game state ──
    this.phase = 'recon';
    this.phaseTimer = 0;
    this.droneX = W / 2;
    this.droneY = H / 2;
    this.droneHP = dm.isHard() ? 2 : 3;
    this.droneMaxHP = this.droneHP;
    this.score = 0;

    // Recon state
    this.targetsFound = 0;
    this.targetMarkers = [];
    this.scanCooldown = 0;
    this.scanActive = false;
    this.scanTimer = 0;
    this.reconTargetStates = RECON_TARGETS.map(t => ({ ...t, found: false }));

    // Tunnel state
    this.doorsOpened = 0;
    this.totalDoors = 0;
    this.interferenceTimer = 0;
    this.interferenceActive = false;

    // Command state
    this.markPoints = [];
    this.marksNeeded = 4;
    this.marksPlaced = 0;
    this.commandTimer = 0;
    this.evacuating = false;
    this.evacuationTimer = 0;

    // Ambient
    this.ambientRef = null;

    // ── Setup ──
    this._setupHUD();
    this._setupInput();
    this._startRecon();
  }

  // ═════════════════════════════════════════════════════════════
  // HUD
  // ═════════════════════════════════════════════════════════════
  _setupHUD() {
    const hudStyle = { fontFamily: 'monospace', fontSize: '12px', color: '#ffffff' };
    const titleStyle = { fontFamily: 'monospace', fontSize: '11px', color: '#00e5ff',
      shadow: { offsetX: 0, offsetY: 0, color: '#00e5ff', blur: 4, fill: true } };

    this.hudTitle = this.add.text(15, 12, 'OPERATION UNDERGROUND', titleStyle).setDepth(50);
    this.hudHP = this.add.text(15, 30, `DRONE: ${this.droneHP}/${this.droneMaxHP}`, hudStyle).setDepth(50);
    this.hudPhase = this.add.text(15, 46, '', hudStyle).setDepth(50);

    this.hudTimer = this.add.text(W - 15, 12, '', { ...hudStyle, color: '#FFD700' })
      .setOrigin(1, 0).setDepth(50);
    this.hudObjective = this.add.text(W / 2, 12, '', {
      fontFamily: 'monospace', fontSize: '11px', color: '#00e5ff',
    }).setOrigin(0.5).setDepth(50);

    // Phase instruction text
    this.instrText = this.add.text(W / 2, H - 25, '', {
      fontFamily: 'monospace', fontSize: '13px', color: '#888888',
    }).setOrigin(0.5).setDepth(50);
  }

  _updateHUD() {
    this.hudHP.setText(`DRONE: ${Math.max(0, this.droneHP)}/${this.droneMaxHP}`);
    this.hudHP.setColor(this.droneHP <= 1 ? '#ff4444' : '#ffffff');

    let timeLeft;
    if (this.phase === 'recon') {
      timeLeft = Math.max(0, Math.ceil(RECON_TIME * this.dm.timerMult() - this.phaseTimer));
      this.hudPhase.setText(`RECON PHASE`);
      this.hudObjective.setText(`TARGETS: ${this.targetsFound}/${RECON_TARGETS.length}`);
    } else if (this.phase === 'tunnel') {
      timeLeft = Math.max(0, Math.ceil(TUNNEL_TIME * this.dm.timerMult() - this.phaseTimer));
      this.hudPhase.setText(`TUNNEL PHASE`);
      this.hudObjective.setText(`NAVIGATE TO EXIT`);
    } else if (this.phase === 'command') {
      timeLeft = Math.max(0, Math.ceil(COMMAND_TIME * this.dm.timerMult() - this.commandTimer));
      this.hudPhase.setText(`COMMAND CENTER`);
      this.hudObjective.setText(`MARKS: ${this.marksPlaced}/${this.marksNeeded}`);
    } else if (this.phase === 'evacuate') {
      timeLeft = Math.max(0, Math.ceil(10 - this.evacuationTimer));
      this.hudPhase.setText(`EVACUATE!`);
      this.hudPhase.setColor('#ff4444');
      this.hudObjective.setText(`GET OUT NOW!`);
    } else {
      return;
    }
    this.hudTimer.setText(`TIME: ${timeLeft}s`);
    this.hudTimer.setColor(timeLeft <= 10 ? '#ff4444' : '#FFD700');
  }

  _setupInput() {
    this.keys = {
      left: this.input.keyboard.addKey('LEFT'),
      right: this.input.keyboard.addKey('RIGHT'),
      up: this.input.keyboard.addKey('UP'),
      down: this.input.keyboard.addKey('DOWN'),
      space: this.input.keyboard.addKey('SPACE'),
      enter: this.input.keyboard.addKey('ENTER'),
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
      const opts = this.add.text(W / 2, H / 2 + 20, 'ESC — Resume  |  M — Mute', {
        fontFamily: 'monospace', fontSize: '14px', color: '#aaaaaa',
      }).setOrigin(0.5).setDepth(61);
      this.pauseObjects.push(opts);
    } else {
      for (const obj of this.pauseObjects) obj.destroy();
      this.pauseObjects = [];
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

  _takeDamage() {
    this.droneHP--;
    SoundManager.get().playDroneHit();
    this.cameras.main.shake(200, 0.015);

    const flash = this.add.rectangle(W / 2, H / 2, W, H, 0xff0000, 0.3).setDepth(45);
    this.tweens.add({ targets: flash, alpha: 0, duration: 300, onComplete: () => flash.destroy() });

    if (this.droneHP <= 0) {
      this._stopAmbient();
      this.phase = 'dead';
      this.time.delayedCall(800, () => this._showVictory());
    }
  }

  // ═════════════════════════════════════════════════════════════
  // PHASE 1 — AERIAL RECONNAISSANCE (60s)
  // ═════════════════════════════════════════════════════════════
  _startRecon() {
    this.phase = 'recon';
    this.phaseTimer = 0;
    this.droneX = W / 2;
    this.droneY = H / 2;

    // Desert terrain background
    this.reconBg = this.add.image(W / 2, H / 2, 'desert_terrain').setDepth(0);

    // Drone sprite
    this.droneSprite = this.add.image(this.droneX, this.droneY, 'drone_top').setDepth(20);

    // Scan ring (hidden, shown on SPACE)
    this.scanRing = this.add.circle(this.droneX, this.droneY, SCAN_RADIUS, 0x00e5ff, 0).setDepth(18);
    this.scanRing.setStrokeStyle(2, 0x00e5ff, 0);

    // Target indicators (hidden markers on map)
    this.targetSprites = [];
    for (const t of this.reconTargetStates) {
      const marker = this.add.circle(t.x, t.y, 6, 0xff4444, 0).setDepth(15);
      marker.setStrokeStyle(2, 0xff4444, 0);
      this.targetSprites.push(marker);
    }

    // Enemies (patrol dots)
    this.patrols = [];
    for (let i = 0; i < 4; i++) {
      const px = 100 + Math.random() * (W - 200);
      const py = 100 + Math.random() * (H - 200);
      const p = this.add.circle(px, py, 5, 0xff4444, 0.6).setDepth(10);
      this.patrols.push({
        sprite: p, x: px, y: py,
        vx: (Math.random() - 0.5) * 60 * this.dm.enemySpeedMult(),
        vy: (Math.random() - 0.5) * 60 * this.dm.enemySpeedMult(),
        alertRange: 80,
      });
    }

    this.instrText.setText('ARROWS to fly — SPACE to scan — Find tunnel entrances');
    this.instrText.setColor('#888888');

    this.ambientRef = SoundManager.get().playDroneHum();
  }

  _updateRecon(dt) {
    this.phaseTimer += dt;

    // Movement
    let dx = 0, dy = 0;
    if (this.keys.left.isDown) dx -= 1;
    if (this.keys.right.isDown) dx += 1;
    if (this.keys.up.isDown) dy -= 1;
    if (this.keys.down.isDown) dy += 1;
    if (dx || dy) {
      const len = Math.sqrt(dx * dx + dy * dy);
      this.droneX += (dx / len) * DRONE_SPEED * dt;
      this.droneY += (dy / len) * DRONE_SPEED * dt;
    }
    this.droneX = Phaser.Math.Clamp(this.droneX, 30, W - 30);
    this.droneY = Phaser.Math.Clamp(this.droneY, 30, H - 30);
    this.droneSprite.setPosition(this.droneX, this.droneY);

    // Scan cooldown
    if (this.scanCooldown > 0) this.scanCooldown -= dt;

    // SPACE to scan
    if (Phaser.Input.Keyboard.JustDown(this.keys.space) && this.scanCooldown <= 0) {
      this.scanActive = true;
      this.scanTimer = 0.8;
      this.scanCooldown = 2;
      SoundManager.get().playDroneScan();

      // Show scan ring
      this.scanRing.setPosition(this.droneX, this.droneY);
      this.scanRing.setStrokeStyle(2, 0x00e5ff, 0.6);
      this.tweens.add({
        targets: this.scanRing,
        scaleX: 1.5, scaleY: 1.5,
        duration: 800,
        ease: 'Quad.easeOut',
        onComplete: () => {
          if (this.scanRing) {
            this.scanRing.setScale(1);
            this.scanRing.setStrokeStyle(2, 0x00e5ff, 0);
          }
        },
      });

      // Check targets in range
      for (let i = 0; i < this.reconTargetStates.length; i++) {
        if (this.reconTargetStates[i].found) continue;
        const t = this.reconTargetStates[i];
        const dist = Phaser.Math.Distance.Between(this.droneX, this.droneY, t.x, t.y);
        if (dist <= SCAN_RADIUS * 1.3) {
          this.reconTargetStates[i].found = true;
          this.targetsFound++;
          SoundManager.get().playDroneScanComplete();

          // Reveal target
          this.targetSprites[i].setFillStyle(0x00ff00, 0.5);
          this.targetSprites[i].setStrokeStyle(2, 0x00ff00, 0.8);

          // Score text
          const pts = this.add.text(t.x, t.y - 20, 'TUNNEL FOUND +200', {
            fontFamily: 'monospace', fontSize: '10px', color: '#00ff00',
          }).setOrigin(0.5).setDepth(25);
          this.tweens.add({
            targets: pts, y: t.y - 50, alpha: 0, duration: 1200,
            onComplete: () => pts.destroy(),
          });
          this.score += 200;
        }
      }
    }

    // Update patrols
    for (const p of this.patrols) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.x < 40 || p.x > W - 40) p.vx *= -1;
      if (p.y < 40 || p.y > H - 40) p.vy *= -1;
      p.x = Phaser.Math.Clamp(p.x, 40, W - 40);
      p.y = Phaser.Math.Clamp(p.y, 40, H - 40);
      p.sprite.setPosition(p.x, p.y);

      // Alert detection
      const dist = Phaser.Math.Distance.Between(this.droneX, this.droneY, p.x, p.y);
      if (dist < p.alertRange) {
        // Fire at drone
        p.alertRange = 120; // gets more alert — wider detection
        if (Math.random() < 0.5 * dt) {
          this._takeDamage();
        }
        p.sprite.setFillStyle(0xff0000, 0.9);
      } else {
        p.sprite.setFillStyle(0xff4444, 0.6);
      }
    }

    // Time up or all targets found → transition
    if (this.phaseTimer >= RECON_TIME * this.dm.timerMult() || this.targetsFound >= RECON_TARGETS.length) {
      this._stopAmbient();
      this._cleanupRecon();
      this._startTunnelTransition();
    }
  }

  _cleanupRecon() {
    // Kill all tweens first to prevent onComplete callbacks on destroyed objects
    this.tweens.killAll();
    if (this.reconBg) { this.reconBg.destroy(); this.reconBg = null; }
    if (this.scanRing) { this.scanRing.destroy(); this.scanRing = null; }
    for (const s of this.targetSprites) s.destroy();
    this.targetSprites = [];
    for (const p of this.patrols) p.sprite.destroy();
    this.patrols = [];
    if (this.droneSprite) { this.droneSprite.destroy(); this.droneSprite = null; }
  }

  _startTunnelTransition() {
    // Brief text overlay
    this.phase = 'transition';
    const overlay = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.9).setDepth(40);
    const txt = this.add.text(W / 2, H / 2 - 20, 'ENTERING TUNNEL NETWORK...', {
      fontFamily: 'monospace', fontSize: '20px', color: '#00e5ff',
      shadow: { offsetX: 0, offsetY: 0, color: '#00e5ff', blur: 10, fill: true },
    }).setOrigin(0.5).setDepth(41);

    const found = this.add.text(W / 2, H / 2 + 20, `${this.targetsFound}/${RECON_TARGETS.length} TUNNELS MAPPED`, {
      fontFamily: 'monospace', fontSize: '14px', color: '#ffffff',
    }).setOrigin(0.5).setDepth(41);

    this.time.delayedCall(2500, () => {
      overlay.destroy();
      txt.destroy();
      found.destroy();
      this._startTunnel();
    });
  }

  // ═════════════════════════════════════════════════════════════
  // PHASE 2 — TUNNEL NAVIGATION (90s)
  // ═════════════════════════════════════════════════════════════
  _startTunnel() {
    this.phase = 'tunnel';
    MusicManager.get().playLevel4Music('tunnel');
    this.phaseTimer = 0;

    // Count doors
    this.totalDoors = 0;
    this.doorsOpened = 0;
    for (let r = 0; r < MAZE.length; r++) {
      for (let c = 0; c < MAZE[0].length; c++) {
        if (MAZE[r][c] === 2) this.totalDoors++;
      }
    }

    // Working copy of maze (for door opening)
    this.mazeCopy = MAZE.map(row => [...row]);

    // Draw maze tiles
    this.mazeTiles = [];
    for (let r = 0; r < MAZE.length; r++) {
      for (let c = 0; c < MAZE[0].length; c++) {
        const x = c * TILE + TILE / 2;
        const y = r * TILE + TILE / 2;
        let tex;
        switch (MAZE[r][c]) {
          case 1: tex = 'tunnel_wall'; break;
          case 2: tex = 'tunnel_door'; break;
          case 3: tex = 'tunnel_interference'; break;
          default: tex = 'tunnel_floor'; break;
        }
        const tile = this.add.image(x, y, tex).setDepth(0);
        this.mazeTiles.push(tile);
      }
    }

    // Drone start
    this.droneX = TUNNEL_START.col * TILE + TILE / 2;
    this.droneY = TUNNEL_START.row * TILE + TILE / 2;
    this.droneSprite = this.add.image(this.droneX, this.droneY, 'drone_top').setDepth(20);

    // Exit marker
    const exitX = TUNNEL_EXIT.col * TILE + TILE / 2;
    const exitY = TUNNEL_EXIT.row * TILE + TILE / 2;
    this.exitMarker = this.add.circle(exitX, exitY, 18, 0x00ff00, 0.5).setDepth(5);
    this.exitMarker.setStrokeStyle(3, 0x00ff00, 0.8);
    this.tweens.add({
      targets: this.exitMarker, alpha: 0.2, duration: 800, yoyo: true, repeat: -1,
    });

    // Darkness overlay (canvas-based)
    this.darknessCanvas = document.createElement('canvas');
    this.darknessCanvas.width = W;
    this.darknessCanvas.height = H;
    this.darknessTexKey = 'darkness_overlay_' + Date.now();
    this.textures.addCanvas(this.darknessTexKey, this.darknessCanvas);
    this.darknessSprite = this.add.image(W / 2, H / 2, this.darknessTexKey).setDepth(30);

    this.instrText.setText('ARROWS to navigate — SPACE at doors to open — Reach EXIT');
    this.instrText.setColor('#888888');

    this.ambientRef = SoundManager.get().playDroneHum();
  }

  _updateTunnel(dt) {
    this.phaseTimer += dt;

    // Movement with wall collision
    let dx = 0, dy = 0;
    if (this.keys.left.isDown) dx -= 1;
    if (this.keys.right.isDown) dx += 1;
    if (this.keys.up.isDown) dy -= 1;
    if (this.keys.down.isDown) dy += 1;

    if (dx || dy) {
      const len = Math.sqrt(dx * dx + dy * dy);
      const moveX = (dx / len) * TUNNEL_SPEED * dt;
      const moveY = (dy / len) * TUNNEL_SPEED * dt;

      // Try X movement
      const newX = this.droneX + moveX;
      if (!this._checkWallCollision(newX, this.droneY)) {
        this.droneX = newX;
      }
      // Try Y movement
      const newY = this.droneY + moveY;
      if (!this._checkWallCollision(this.droneX, newY)) {
        this.droneY = newY;
      }
    }

    this.droneX = Phaser.Math.Clamp(this.droneX, DRONE_SIZE, MAZE_W - DRONE_SIZE);
    this.droneY = Phaser.Math.Clamp(this.droneY, DRONE_SIZE, MAZE_H - DRONE_SIZE);
    this.droneSprite.setPosition(this.droneX, this.droneY);

    // Door interaction
    if (Phaser.Input.Keyboard.JustDown(this.keys.space)) {
      this._tryOpenDoor();
    }

    // Check interference zones
    const col = Math.floor(this.droneX / TILE);
    const row = Math.floor(this.droneY / TILE);
    if (row >= 0 && row < MAZE.length && col >= 0 && col < MAZE[0].length) {
      if (this.mazeCopy[row][col] === 3) {
        if (!this.interferenceActive) {
          this.interferenceActive = true;
          SoundManager.get().playInterference();
          this.instrText.setText('INTERFERENCE — SIGNAL DEGRADING!');
          this.instrText.setColor('#ff4444');
        }
        this.interferenceTimer += dt;
        if (this.interferenceTimer > 3) {
          this._takeDamage();
          this.interferenceTimer = 0;
        }
      } else {
        if (this.interferenceActive) {
          this.interferenceActive = false;
          this.interferenceTimer = 0;
          this.instrText.setText('ARROWS to navigate — SPACE at doors — Reach EXIT');
          this.instrText.setColor('#888888');
        }
      }
    }

    // Update darkness overlay
    this._updateDarkness();

    // Check exit reached
    const exitX = TUNNEL_EXIT.col * TILE + TILE / 2;
    const exitY = TUNNEL_EXIT.row * TILE + TILE / 2;
    const distToExit = Phaser.Math.Distance.Between(this.droneX, this.droneY, exitX, exitY);
    if (distToExit < 25) {
      this._stopAmbient();
      this._cleanupTunnel();
      this._startCommandTransition();
    }

    // Time up
    if (this.phaseTimer >= TUNNEL_TIME * this.dm.timerMult()) {
      this._stopAmbient();
      this._cleanupTunnel();
      this.phase = 'dead';
      this.time.delayedCall(500, () => this._showVictory());
    }
  }

  _checkWallCollision(x, y) {
    // Check 4 corners of drone bounding box
    const offsets = [
      { dx: -DRONE_SIZE * 0.7, dy: -DRONE_SIZE * 0.7 },
      { dx: DRONE_SIZE * 0.7, dy: -DRONE_SIZE * 0.7 },
      { dx: -DRONE_SIZE * 0.7, dy: DRONE_SIZE * 0.7 },
      { dx: DRONE_SIZE * 0.7, dy: DRONE_SIZE * 0.7 },
    ];
    for (const o of offsets) {
      const col = Math.floor((x + o.dx) / TILE);
      const row = Math.floor((y + o.dy) / TILE);
      if (row < 0 || row >= MAZE.length || col < 0 || col >= MAZE[0].length) return true;
      const cell = this.mazeCopy[row][col];
      if (cell === 1 || cell === 2) return true;
    }
    return false;
  }

  _tryOpenDoor() {
    // Check adjacent cells for doors
    const col = Math.floor(this.droneX / TILE);
    const row = Math.floor(this.droneY / TILE);
    const neighbors = [
      { r: row - 1, c: col }, { r: row + 1, c: col },
      { r: row, c: col - 1 }, { r: row, c: col + 1 },
    ];
    for (const n of neighbors) {
      if (n.r >= 0 && n.r < MAZE.length && n.c >= 0 && n.c < MAZE[0].length) {
        if (this.mazeCopy[n.r][n.c] === 2) {
          // Open the door
          this.mazeCopy[n.r][n.c] = 0;
          this.doorsOpened++;
          SoundManager.get().playDoorOpen();

          // Update tile visual
          const tileIdx = n.r * MAZE[0].length + n.c;
          if (this.mazeTiles[tileIdx]) {
            this.mazeTiles[tileIdx].setTexture('tunnel_floor');
          }

          // Door open effect
          const doorX = n.c * TILE + TILE / 2;
          const doorY = n.r * TILE + TILE / 2;
          const effect = this.add.circle(doorX, doorY, 15, 0x00ff00, 0.4).setDepth(12);
          this.tweens.add({
            targets: effect, alpha: 0, scaleX: 2, scaleY: 2, duration: 500,
            onComplete: () => effect.destroy(),
          });
          break;
        }
      }
    }
  }

  _updateDarkness() {
    const dCtx = this.darknessCanvas.getContext('2d');
    dCtx.fillStyle = 'rgba(0,0,0,0.95)';
    dCtx.fillRect(0, 0, W, H);

    // Cut out spotlight around drone
    dCtx.globalCompositeOperation = 'destination-out';
    const radius = this.interferenceActive ? SPOTLIGHT_RADIUS * 0.5 : SPOTLIGHT_RADIUS;
    const grad = dCtx.createRadialGradient(this.droneX, this.droneY, 0, this.droneX, this.droneY, radius);
    grad.addColorStop(0, 'rgba(0,0,0,1)');
    grad.addColorStop(0.6, 'rgba(0,0,0,0.8)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    dCtx.fillStyle = grad;
    dCtx.beginPath();
    dCtx.arc(this.droneX, this.droneY, radius, 0, Math.PI * 2);
    dCtx.fill();

    dCtx.globalCompositeOperation = 'source-over';

    // Refresh the canvas texture so Phaser picks up the changes
    this.textures.get(this.darknessTexKey).refresh();
  }

  _cleanupTunnel() {
    for (const t of this.mazeTiles) t.destroy();
    this.mazeTiles = [];
    if (this.exitMarker) { this.exitMarker.destroy(); this.exitMarker = null; }
    if (this.darknessSprite) { this.darknessSprite.destroy(); this.darknessSprite = null; }
    if (this.darknessTexKey && this.textures.exists(this.darknessTexKey)) {
      this.textures.remove(this.darknessTexKey);
    }
    this.darknessCanvas = null;
    if (this.droneSprite) { this.droneSprite.destroy(); this.droneSprite = null; }
  }

  _startCommandTransition() {
    this.phase = 'transition';
    const overlay = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.9).setDepth(40);
    const txt = this.add.text(W / 2, H / 2 - 20, 'ENTERING COMMAND CENTER...', {
      fontFamily: 'monospace', fontSize: '20px', color: '#ff8800',
      shadow: { offsetX: 0, offsetY: 0, color: '#ff8800', blur: 10, fill: true },
    }).setOrigin(0.5).setDepth(41);

    const sub = this.add.text(W / 2, H / 2 + 20, 'MARK DEMOLITION POINTS WITH SPACE', {
      fontFamily: 'monospace', fontSize: '14px', color: '#ffffff',
    }).setOrigin(0.5).setDepth(41);

    this.time.delayedCall(2500, () => {
      overlay.destroy();
      txt.destroy();
      sub.destroy();
      this._startCommand();
    });
  }

  // ═════════════════════════════════════════════════════════════
  // PHASE 3 — COMMAND CENTER (30s)
  // ═════════════════════════════════════════════════════════════
  _startCommand() {
    this.phase = 'command';
    MusicManager.get().playLevel4Music('command');
    this.commandTimer = 0;
    this.marksPlaced = 0;
    this.markPoints = [];
    this.evacuating = false;

    // Command room background
    this.commandBg = this.add.image(W / 2, H / 2, 'command_room').setDepth(0);

    // Target mark positions (structural points to demolish)
    this.markTargets = [
      { x: W / 2 - 120, y: H / 2 - 60, marked: false },
      { x: W / 2 + 120, y: H / 2 - 60, marked: false },
      { x: W / 2 - 120, y: H / 2 + 60, marked: false },
      { x: W / 2 + 120, y: H / 2 + 60, marked: false },
    ];

    // Visual markers (pulsing targets)
    this.markTargetSprites = [];
    for (const mt of this.markTargets) {
      const ring = this.add.circle(mt.x, mt.y, 15, 0xff8800, 0).setDepth(8);
      ring.setStrokeStyle(2, 0xff8800, 0.6);
      this.tweens.add({
        targets: ring, scaleX: 1.3, scaleY: 1.3, duration: 600, yoyo: true, repeat: -1,
      });
      this.markTargetSprites.push(ring);
    }

    // Enemies (guards)
    this.guards = [];
    const guardPositions = [
      { x: 300, y: 200 }, { x: 660, y: 200 },
      { x: 300, y: 380 }, { x: 660, y: 380 },
    ];
    for (const gp of guardPositions) {
      const g = this.add.circle(gp.x, gp.y, 6, 0xff2222, 0.7).setDepth(10);
      this.guards.push({
        sprite: g, x: gp.x, y: gp.y,
        vx: (Math.random() > 0.5 ? 1 : -1) * (40 + Math.random() * 30) * this.dm.enemySpeedMult(),
        vy: (Math.random() > 0.5 ? 1 : -1) * (40 + Math.random() * 30) * this.dm.enemySpeedMult(),
        fireTimer: 1.5 + Math.random() * 2,
      });
    }

    // Drone
    this.droneX = W / 2;
    this.droneY = H / 2 + 100;
    this.droneSprite = this.add.image(this.droneX, this.droneY, 'drone_top').setDepth(20);

    this.instrText.setText('ARROWS to move — SPACE near targets to mark demolition');
    this.instrText.setColor('#ff8800');

    this.ambientRef = SoundManager.get().playDroneHum();
  }

  _updateCommand(dt) {
    this.commandTimer += dt;

    // Movement
    let dx = 0, dy = 0;
    if (this.keys.left.isDown) dx -= 1;
    if (this.keys.right.isDown) dx += 1;
    if (this.keys.up.isDown) dy -= 1;
    if (this.keys.down.isDown) dy += 1;
    if (dx || dy) {
      const len = Math.sqrt(dx * dx + dy * dy);
      this.droneX += (dx / len) * DRONE_SPEED * dt;
      this.droneY += (dy / len) * DRONE_SPEED * dt;
    }
    this.droneX = Phaser.Math.Clamp(this.droneX, 30, W - 30);
    this.droneY = Phaser.Math.Clamp(this.droneY, 30, H - 30);
    this.droneSprite.setPosition(this.droneX, this.droneY);

    // SPACE to mark
    if (Phaser.Input.Keyboard.JustDown(this.keys.space)) {
      for (let i = 0; i < this.markTargets.length; i++) {
        if (this.markTargets[i].marked) continue;
        const mt = this.markTargets[i];
        const dist = Phaser.Math.Distance.Between(this.droneX, this.droneY, mt.x, mt.y);
        if (dist < 40) {
          mt.marked = true;
          this.marksPlaced++;
          SoundManager.get().playMarkPoint();

          // Change marker to green
          this.markTargetSprites[i].setStrokeStyle(2, 0x00ff00, 0.8);
          this.markTargetSprites[i].setFillStyle(0x00ff00, 0.3);

          const pts = this.add.text(mt.x, mt.y - 25, 'MARKED +500', {
            fontFamily: 'monospace', fontSize: '10px', color: '#00ff00',
          }).setOrigin(0.5).setDepth(25);
          this.tweens.add({
            targets: pts, y: mt.y - 55, alpha: 0, duration: 1000,
            onComplete: () => pts.destroy(),
          });
          this.score += 500;
          break;
        }
      }
    }

    // Update guards
    for (const g of this.guards) {
      g.x += g.vx * dt;
      g.y += g.vy * dt;
      if (g.x < 80 || g.x > W - 80) g.vx *= -1;
      if (g.y < 100 || g.y > H - 100) g.vy *= -1;
      g.x = Phaser.Math.Clamp(g.x, 80, W - 80);
      g.y = Phaser.Math.Clamp(g.y, 100, H - 100);
      g.sprite.setPosition(g.x, g.y);

      // Guard fires at drone
      g.fireTimer -= dt;
      if (g.fireTimer <= 0) {
        g.fireTimer = 2 + Math.random() * 1.5;
        const dist = Phaser.Math.Distance.Between(this.droneX, this.droneY, g.x, g.y);
        if (dist < 150) {
          this._takeDamage();
        }
      }
    }

    // All marks placed → start evacuation
    if (this.marksPlaced >= this.marksNeeded && !this.evacuating) {
      this._startEvacuation();
    }

    // Time up
    if (this.commandTimer >= COMMAND_TIME * this.dm.timerMult() && !this.evacuating) {
      this._stopAmbient();
      this._cleanupCommand();
      this.phase = 'dead';
      this.time.delayedCall(500, () => this._showVictory());
    }
  }

  _startEvacuation() {
    this.evacuating = true;
    this.evacuationTimer = 0;
    this.phase = 'evacuate';

    this.instrText.setText('ALL POINTS MARKED — EVACUATE! Fly to exit!');
    this.instrText.setColor('#ff0000');

    SoundManager.get().playCameraAlarm();

    // Flash warning
    const warn = this.add.text(W / 2, 80, 'DETONATION IN 10 SECONDS', {
      fontFamily: 'monospace', fontSize: '22px', color: '#ff0000',
      shadow: { offsetX: 0, offsetY: 0, color: '#ff0000', blur: 12, fill: true },
    }).setOrigin(0.5).setDepth(35);
    this.tweens.add({ targets: warn, alpha: 0.3, duration: 400, yoyo: true, repeat: -1 });
    this.evacuationWarning = warn;

    // Exit indicator (bottom center)
    this.exitZone = this.add.circle(W / 2, H - 30, 20, 0x00ff00, 0.3).setDepth(8);
    this.exitZone.setStrokeStyle(3, 0x00ff00, 0.8);
    this.tweens.add({
      targets: this.exitZone, scaleX: 1.4, scaleY: 1.4, duration: 500, yoyo: true, repeat: -1,
    });
  }

  _updateEvacuation(dt) {
    this.evacuationTimer += dt;

    // Movement
    let dx = 0, dy = 0;
    if (this.keys.left.isDown) dx -= 1;
    if (this.keys.right.isDown) dx += 1;
    if (this.keys.up.isDown) dy -= 1;
    if (this.keys.down.isDown) dy += 1;
    if (dx || dy) {
      const len = Math.sqrt(dx * dx + dy * dy);
      this.droneX += (dx / len) * DRONE_SPEED * 1.3 * dt; // faster during evac
      this.droneY += (dy / len) * DRONE_SPEED * 1.3 * dt;
    }
    this.droneX = Phaser.Math.Clamp(this.droneX, 30, W - 30);
    this.droneY = Phaser.Math.Clamp(this.droneY, 30, H - 30);
    this.droneSprite.setPosition(this.droneX, this.droneY);

    // Countdown beeps
    const timeLeft = 10 - this.evacuationTimer;
    if (timeLeft <= 5 && Math.floor(timeLeft * 2) !== Math.floor((timeLeft + dt) * 2)) {
      SoundManager.get().playCountdownTick();
    }

    // Check exit
    const distToExit = Phaser.Math.Distance.Between(this.droneX, this.droneY, W / 2, H - 30);
    if (distToExit < 30) {
      // Escaped!
      this._stopAmbient();
      this._cleanupCommand();
      this._startExplosionSequence();
      return;
    }

    // Time up — explosion catches drone
    if (this.evacuationTimer >= 10) {
      this._stopAmbient();
      this.droneHP = 0;
      this._cleanupCommand();
      this._startExplosionSequence();
    }
  }

  _cleanupCommand() {
    if (this.commandBg) { this.commandBg.destroy(); this.commandBg = null; }
    for (const s of this.markTargetSprites) s.destroy();
    this.markTargetSprites = [];
    for (const g of this.guards) g.sprite.destroy();
    this.guards = [];
    if (this.droneSprite) { this.droneSprite.destroy(); this.droneSprite = null; }
    if (this.evacuationWarning) { this.evacuationWarning.destroy(); this.evacuationWarning = null; }
    if (this.exitZone) { this.exitZone.destroy(); this.exitZone = null; }
  }

  // ═════════════════════════════════════════════════════════════
  // EXPLOSION SEQUENCE
  // ═════════════════════════════════════════════════════════════
  _startExplosionSequence() {
    this.phase = 'explosion';
    this.instrText.setText('');

    // Screen goes black
    const bg = this.add.rectangle(W / 2, H / 2, W, H, 0x000000).setDepth(30);

    // Massive underground explosion
    SoundManager.get().playUndergroundExplosion();
    this.cameras.main.shake(2000, 0.06);

    // Expanding fireball sequence
    for (let i = 0; i < 15; i++) {
      this.time.delayedCall(i * 100, () => {
        const ex = W / 2 + (Math.random() - 0.5) * 300;
        const ey = H / 2 + (Math.random() - 0.5) * 200;
        const r = 20 + Math.random() * 40;
        const fire = this.add.circle(ex, ey, r, 0xff4400, 0.8).setDepth(35);
        this.tweens.add({
          targets: fire, scaleX: 3, scaleY: 3, alpha: 0, duration: 1500,
          onComplete: () => fire.destroy(),
        });
      });
    }

    // "TARGET DESTROYED" text
    this.time.delayedCall(1200, () => {
      const success = this.droneHP > 0;
      const msg = success ? 'COMMAND CENTER DESTROYED' : 'COMMAND CENTER DESTROYED — DRONE LOST';
      const color = success ? '#00ff00' : '#ff8800';
      const txt = this.add.text(W / 2, H / 2, msg, {
        fontFamily: 'monospace', fontSize: '24px', color: color,
        shadow: { offsetX: 0, offsetY: 0, color: color, blur: 16, fill: true },
      }).setOrigin(0.5).setDepth(40);
      this.tweens.add({ targets: txt, alpha: 0.4, duration: 500, yoyo: true, repeat: 3 });
    });

    this.time.delayedCall(4000, () => {
      this._showVictory();
    });
  }

  // ═════════════════════════════════════════════════════════════
  // VICTORY / RESULTS
  // ═════════════════════════════════════════════════════════════
  _showVictory() {
    this.phase = 'victory';
    this.instrText.setVisible(false);
    MusicManager.get().stop(1);

    const missionSuccess = this.marksPlaced >= this.marksNeeded;
    if (missionSuccess) SoundManager.get().playVictory();

    // Black overlay
    this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.9).setDepth(55);

    // Title
    const titleText = missionSuccess ? 'MISSION COMPLETE' : 'MISSION FAILED';
    const titleColor = missionSuccess ? '#FFD700' : '#ff4444';
    const title = this.add.text(W / 2, 55, titleText, {
      fontFamily: 'monospace', fontSize: '30px', color: titleColor,
      shadow: { offsetX: 0, offsetY: 0, color: titleColor, blur: 16, fill: true },
    }).setOrigin(0.5).setDepth(56).setAlpha(0);
    this.tweens.add({ targets: title, alpha: 1, duration: 500 });

    // Subtitle
    const sub = this.add.text(W / 2, 90, 'OPERATION UNDERGROUND', {
      fontFamily: 'monospace', fontSize: '14px', color: '#ffffff',
    }).setOrigin(0.5).setDepth(56).setAlpha(0);
    this.tweens.add({ targets: sub, alpha: 1, duration: 500, delay: 200 });

    // Separator
    const sep = this.add.rectangle(W / 2, 112, 300, 2, 0x00e5ff, 0.5).setDepth(56).setAlpha(0);
    this.tweens.add({ targets: sep, alpha: 1, duration: 300, delay: 400 });

    // Star rating
    let stars;
    if (missionSuccess && this.droneHP >= 2 && this.targetsFound >= 5) stars = '\u2605\u2605\u2605';
    else if (missionSuccess && this.droneHP >= 1) stars = '\u2605\u2605\u2606';
    else if (this.marksPlaced >= 2) stars = '\u2605\u2606\u2606';
    else stars = '\u2606\u2606\u2606';

    try { const sc = missionSuccess && this.droneHP >= 2 && this.targetsFound >= 5 ? 3 : missionSuccess && this.droneHP >= 1 ? 2 : this.marksPlaced >= 2 ? 1 : 0; localStorage.setItem('superzion_stars_4', String(sc)); } catch(e) {}

    const lines = [
      `TUNNELS FOUND: ${this.targetsFound}/${RECON_TARGETS.length}`,
      `DOORS OPENED: ${this.doorsOpened}/${this.totalDoors}`,
      `DEMOLITION MARKS: ${this.marksPlaced}/${this.marksNeeded}`,
      `DRONE STATUS: ${this.droneHP > 0 ? 'INTACT' : 'DESTROYED'}`,
      `SCORE: ${this.score}`,
      `RATING: ${stars}`,
    ];

    let yPos = 140;
    lines.forEach((line, i) => {
      const t = this.add.text(W / 2, yPos, line, {
        fontFamily: 'monospace', fontSize: '14px', color: '#00e5ff',
      }).setOrigin(0.5).setDepth(56).setAlpha(0);
      this.tweens.add({ targets: t, alpha: 1, duration: 300, delay: 600 + i * 250 });
      yPos += 28;
    });

    // Separator 2
    this.time.delayedCall(2800, () => {
      this.add.rectangle(W / 2, yPos + 5, 280, 2, 0x00e5ff, 0.5).setDepth(56);
    });

    // Continue prompt
    this.time.delayedCall(3200, () => {
      const cont = this.add.text(W / 2, yPos + 30, 'PRESS ENTER TO CONTINUE', {
        fontFamily: 'monospace', fontSize: '18px', color: '#ffffff',
      }).setOrigin(0.5).setDepth(56);
      this.tweens.add({ targets: cont, alpha: 0.3, duration: 600, yoyo: true, repeat: -1 });
    });
  }

  // ═════════════════════════════════════════════════════════════
  // MAIN UPDATE LOOP
  // ═════════════════════════════════════════════════════════════
  update(time, delta) {
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
    if (this.isPaused) return;

    // P key — debug skip to victory
    if (Phaser.Input.Keyboard.JustDown(this.keys.p) && this.phase !== 'victory') {
      this._stopAmbient();
      this.targetsFound = 5;
      this.doorsOpened = 2;
      this.marksPlaced = 4;
      this.droneHP = 2;
      this.score = 2500;
      // Cleanup whichever phase we're in
      if (this.phase === 'recon') this._cleanupRecon();
      if (this.phase === 'tunnel') this._cleanupTunnel();
      if (this.phase === 'command' || this.phase === 'evacuate') this._cleanupCommand();
      this._showVictory();
      return;
    }

    switch (this.phase) {
      case 'recon':
        this._updateRecon(dt);
        break;
      case 'tunnel':
        this._updateTunnel(dt);
        break;
      case 'command':
        this._updateCommand(dt);
        break;
      case 'evacuate':
        this._updateEvacuation(dt);
        break;
      case 'victory':
        if (Phaser.Input.Keyboard.JustDown(this.keys.enter) || Phaser.Input.Keyboard.JustDown(this.keys.space)) {
          this._stopAmbient();
          this.scene.start('MountainBreakerIntroCinematicScene');
        }
        break;
    }

    // Update HUD
    const activePhases = ['recon', 'tunnel', 'command', 'evacuate'];
    if (activePhases.includes(this.phase)) {
      this._updateHUD();
    }
  }

  shutdown() {
    this._stopAmbient();
    this.tweens.killAll();
    this.time.removeAllEvents();
  }
}
