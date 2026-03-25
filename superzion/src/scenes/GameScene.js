// ===================================================================
// GameScene — Bomberman-style Level 1: Operation Tehran
// Top-down grid, bombs, guards, 3 zones, plant & escape
// ===================================================================

import Phaser from 'phaser';
import { generateBombermanTextures } from '../utils/BombermanTextures.js';
import {
  TILE, COLS, ROWS, HUD_H, GRID_X, GRID_Y,
  T_EMPTY, T_WALL, T_BREAK, T_DOOR, T_GDOOR, T_OBJ,
  SPAWN, OBJ, gx, gy, toCol, toRow,
  GUARD_DEFS, generateMap,
} from '../data/LevelConfig.js';
import BombermanPlayer from '../entities/Player.js';
import Bomb from '../entities/Bomb.js';
import BombermanGuard from '../entities/Guard.js';
import BombermanHUD from '../ui/HUD.js';
import BombermanEndgame from '../systems/EndgameManager.js';
import SoundManager from '../systems/SoundManager.js';
import MusicManager from '../systems/MusicManager.js';
import { showDefeatScreen } from '../ui/EndScreen.js';
import { showControlsOverlay } from '../ui/ControlsOverlay.js';

export default class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }

  create() {
    // Top-down: no gravity
    this.physics.world.gravity.y = 0;
    this.cameras.main.setBackgroundColor('#87CEEB');
    MusicManager.get().playLevel1Music();

    this.gameOver = false;
    this.isPaused = false;
    this.pauseObjects = [];
    this.skipPromptActive = false;
    this.skipPromptObjects = [];
    this.stats = { startTime: 0, guardsKilled: 0, powerupsCollected: 0 };

    // 1. Textures
    generateBombermanTextures(this);

    // 2. Generate map
    const { map, powerups } = generateMap();
    this.map = map;
    this.powerupMap = powerups;

    // 3. Background (sky visible outside grid)
    this._drawBackground();

    // 4. Build grid (visuals + physics)
    this.wallGroup = this.physics.add.staticGroup();
    this.breakGroup = this.physics.add.staticGroup();
    this.goldDoorSprite = null;
    this._buildGrid();
    this._drawGridOverlay();

    // 5. Exit marker at spawn
    this.add.image(gx(SPAWN.col), gy(SPAWN.row), 'bm_exit').setDepth(1).setAlpha(0.5);

    // 6. Player
    this.player = new BombermanPlayer(this);
    this.physics.add.collider(this.player.sprite, this.wallGroup);
    this.physics.add.collider(this.player.sprite, this.breakGroup);

    // 7. Guards
    this.guards = GUARD_DEFS.map(def => new BombermanGuard(this, def, this.map));
    for (const g of this.guards) {
      this.physics.add.collider(g.sprite, this.wallGroup);
      this.physics.add.collider(g.sprite, this.breakGroup);
    }

    // 7.5. Boss: Foam Beard
    this._createBoss();

    // 8. Bombs & explosions
    this.bombs = [];
    this.explosionTiles = []; // { sprite, col, row, timer }

    // 9. Powerup sprites on map
    this.powerupSprites = [];

    // 10. HUD
    this.hud = new BombermanHUD(this, this.player);

    // 11. Endgame
    this.endgame = new BombermanEndgame(this, this.player);

    // 12. Input keys
    this.escKey = this.input.keyboard.addKey('ESC');
    this.skipKey = this.input.keyboard.addKey('P');
    this.restartKey = this.input.keyboard.addKey('R');
    this.enterKey = this.input.keyboard.addKey('ENTER');
    this.muteKey = this.input.keyboard.addKey('M');
    this.quitKey = this.input.keyboard.addKey('Q');
    this.yKey = this.input.keyboard.addKey('Y');
    this.nKey = this.input.keyboard.addKey('N');

    // 13. Controls overlay
    showControlsOverlay(this, 'ARROWS/WASD: Move | SPACE: Bomb | E: Plant | SHIFT: Dodge | ESC: Pause');

    // 14. Ambient wind sound
    this.ambientRef = SoundManager.get().playAmbientWind();

    // Fade in
    this.cameras.main.fadeIn(500, 0, 0, 0);
  }

  // ── Background ──────────────────────────────────────────────────
  _drawBackground() {
    const bg = this.add.graphics();
    bg.setDepth(-10);
    bg.fillStyle(0x87CEEB, 1);
    bg.fillRect(0, 0, 960, 540);
    bg.fillStyle(0x6B8E6B, 1);
    bg.fillTriangle(0, HUD_H, 80, HUD_H - 20, 160, HUD_H);
    bg.fillTriangle(120, HUD_H, 220, HUD_H - 30, 320, HUD_H);
    bg.fillTriangle(640, HUD_H, 760, HUD_H - 25, 880, HUD_H);
    bg.fillTriangle(800, HUD_H, 900, HUD_H - 20, 960, HUD_H);
    bg.fillStyle(0xffffff, 0.6);
    bg.fillTriangle(170, HUD_H - 10, 220, HUD_H - 30, 270, HUD_H - 10);
    bg.fillTriangle(720, HUD_H - 8, 760, HUD_H - 25, 800, HUD_H - 8);

    // ── Military compound atmosphere: dim green-tinted overlay ──
    const atmoGfx = this.add.graphics().setDepth(-1);
    atmoGfx.fillStyle(0x224422, 0.05);
    atmoGfx.fillRect(GRID_X, GRID_Y, COLS * TILE, ROWS * TILE);
  }

  // ── Grid lines + wall variation + crate texture + corner details ──
  _drawGridOverlay() {
    const overlayGfx = this.add.graphics().setDepth(0.5);

    // Floor tile grid lines (thin dark lines forming the grid)
    overlayGfx.lineStyle(0.5, 0x444444, 0.15);
    for (let c = 0; c <= COLS; c++) {
      const x = GRID_X + c * TILE;
      overlayGfx.lineBetween(x, GRID_Y, x, GRID_Y + ROWS * TILE);
    }
    for (let r = 0; r <= ROWS; r++) {
      const y = GRID_Y + r * TILE;
      overlayGfx.lineBetween(GRID_X, y, GRID_X + COLS * TILE, y);
    }

    // Wall color variation overlay (alternate shades on wall tiles)
    const wallOverlay = this.add.graphics().setDepth(2.5);
    const wallShades = [0x000000, 0x1a1408, 0x0a0a04];
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (this.map[r][c] === T_WALL) {
          const hash = (r * 7 + c * 13) % 3;
          const shade = wallShades[hash];
          const alpha = 0.08 + (hash * 0.04);
          wallOverlay.fillStyle(shade, alpha);
          wallOverlay.fillRect(gx(c) - TILE / 2, gy(r) - TILE / 2, TILE, TILE);
        }
      }
    }

    // Breakable crate texture (X marks and plank lines)
    const crateOverlay = this.add.graphics().setDepth(2.5);
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (this.map[r][c] === T_BREAK) {
          const cx = gx(c), cy = gy(r);
          // X mark (wooden plank cross)
          crateOverlay.lineStyle(1, 0x8a7a5a, 0.25);
          crateOverlay.lineBetween(cx - 10, cy - 10, cx + 10, cy + 10);
          crateOverlay.lineBetween(cx + 10, cy - 10, cx - 10, cy + 10);
          // Horizontal plank line
          crateOverlay.lineStyle(0.5, 0x7a6a4a, 0.2);
          crateOverlay.lineBetween(cx - 12, cy, cx + 12, cy);
        }
      }
    }

    // Corner details: filing cabinets and desks (visual only, not in gameplay area)
    const cornerGfx = this.add.graphics().setDepth(1.5);

    // Filing cabinet (top-left corner area, if empty)
    const cabinetX = GRID_X + TILE * 1.5, cabinetY = GRID_Y + TILE * 1.5;
    cornerGfx.fillStyle(0x666677, 0.35);
    cornerGfx.fillRect(cabinetX - 8, cabinetY - 12, 16, 24);
    cornerGfx.lineStyle(0.5, 0x555566, 0.3);
    cornerGfx.lineBetween(cabinetX - 6, cabinetY - 4, cabinetX + 6, cabinetY - 4);
    cornerGfx.lineBetween(cabinetX - 6, cabinetY + 4, cabinetX + 6, cabinetY + 4);

    // Desk (bottom-right corner area)
    const deskX = GRID_X + COLS * TILE - TILE * 1.5, deskY = GRID_Y + ROWS * TILE - TILE * 1.5;
    cornerGfx.fillStyle(0x6a5040, 0.3);
    cornerGfx.fillRect(deskX - 14, deskY - 8, 28, 16);
    // Chair next to desk
    cornerGfx.fillStyle(0x555555, 0.25);
    cornerGfx.fillCircle(deskX - 18, deskY, 5);
  }

  // ── Build grid ──────────────────────────────────────────────────
  _buildGrid() {
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const x = gx(c), y = gy(r);
        const tile = this.map[r][c];

        this.add.image(x, y, 'bm_floor').setDepth(0);

        if (tile === T_WALL) {
          const w = this.wallGroup.create(x, y, 'bm_wall');
          w.setDepth(2); w.refreshBody();
        } else if (tile === T_BREAK) {
          const b = this.breakGroup.create(x, y, 'bm_breakable');
          b.setDepth(2); b.refreshBody();
          b.setData('col', c); b.setData('row', r);
        } else if (tile === T_DOOR) {
          const d = this.breakGroup.create(x, y, 'bm_door');
          d.setDepth(2); d.refreshBody();
          d.setData('col', c); d.setData('row', r);
          d.setData('isDoor', true);
        } else if (tile === T_GDOOR) {
          const g = this.wallGroup.create(x, y, 'bm_gold_door');
          g.setDepth(2); g.refreshBody();
          this.goldDoorSprite = g;
          this.goldDoorCol = c;
          this.goldDoorRow = r;
        } else if (tile === T_OBJ) {
          const obj = this.add.image(x, y, 'bm_objective').setDepth(2);
          this.tweens.add({
            targets: obj, alpha: 0.6, duration: 800, yoyo: true, repeat: -1,
          });
        }
      }
    }

    // Scatter decorations on empty floor tiles (visual only)
    const decoKeys = ['bm_deco_crate', 'bm_deco_sandbag', 'bm_deco_flag'];
    let decoCount = 0;
    for (let r = 1; r < ROWS - 1; r++) {
      for (let c = 1; c < COLS - 1; c++) {
        if (this.map[r][c] !== T_EMPTY) continue;
        if (c === SPAWN.col && r === SPAWN.row) continue;
        if (Math.random() < 0.03 && decoCount < 12) {
          const dk = decoKeys[Math.floor(Math.random() * decoKeys.length)];
          this.add.image(gx(c), gy(r), dk).setDepth(1).setAlpha(0.5).setScale(0.7);
          decoCount++;
        }
      }
    }
  }

  // (Controls overlay is now handled by showControlsOverlay in create())

  // ── Boss: Foam Beard ──────────────────────────────────────────
  _createBoss() {
    const bossCol = 22, bossRow = 7;
    // Clear any breakable walls around boss
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const r = bossRow + dr, c = bossCol + dc;
        if (r >= 0 && r < ROWS && c >= 0 && c < COLS && this.map[r][c] === T_BREAK) {
          this.map[r][c] = T_EMPTY;
          // Remove physics body
          const bodies = this.breakGroup.getChildren();
          for (const body of bodies) {
            if (body.getData('col') === c && body.getData('row') === r) {
              body.destroy(); break;
            }
          }
        }
      }
    }

    const bx = gx(bossCol), by = gy(bossRow);
    const sprite = this.add.image(bx, by - 100, 'bm_boss1_normal').setDepth(8);
    sprite.setDisplaySize(96, 96);

    this.boss = {
      sprite, col: bossCol, row: bossRow,
      hp: 3, maxHp: 3, alive: true, entered: false,
    };

    // Dramatic entrance: fall from above with bounce
    this.tweens.add({
      targets: sprite, y: by, duration: 1200, ease: 'Bounce.easeOut',
      onComplete: () => {
        this.boss.entered = true;
        this.cameras.main.shake(200, 0.02);
        // Breathing idle animation
        this.tweens.add({
          targets: sprite,
          scaleY: 1.02,
          duration: 1200,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });
        // Title text
        const title = this.add.text(bx, by - 60, 'BOSS: ISMAIL HANIYEH', {
          fontFamily: 'monospace', fontSize: '12px', color: '#FFD700',
          shadow: { offsetX: 0, offsetY: 0, color: '#FFD700', blur: 8, fill: true },
        }).setOrigin(0.5).setDepth(50).setAlpha(0);
        this.tweens.add({ targets: title, alpha: 1, duration: 500 });
        this.tweens.add({
          targets: title, alpha: 0, y: by - 80, duration: 2000, delay: 1500,
          onComplete: () => title.destroy(),
        });
      },
    });

    // Boss HP bar (fixed to camera)
    this.bossHpBg = this.add.rectangle(480, 48, 160, 12, 0x222222, 0.9)
      .setScrollFactor(0).setDepth(100);
    this.bossHpFill = this.add.rectangle(480, 48, 156, 8, 0xff2222)
      .setScrollFactor(0).setDepth(101);
    this.bossHpLabel = this.add.text(480, 36, 'ISMAIL HANIYEH', {
      fontFamily: 'monospace', fontSize: '8px', color: '#FFD700',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(101);
  }

  _updateBossHpBar() {
    if (!this.boss || !this.boss.alive) {
      if (this.bossHpBg) this.bossHpBg.setAlpha(0);
      if (this.bossHpFill) this.bossHpFill.setAlpha(0);
      if (this.bossHpLabel) this.bossHpLabel.setAlpha(0);
      return;
    }
    const ratio = this.boss.hp / this.boss.maxHp;
    this.bossHpFill.setDisplaySize(156 * ratio, 8);
    this.bossHpFill.setX(480 - (156 * (1 - ratio)) / 2);
    const color = ratio > 0.66 ? 0xff2222 : ratio > 0.33 ? 0xff8800 : 0xff0000;
    this.bossHpFill.setFillStyle(color);
  }

  _damageBoss() {
    if (!this.boss || !this.boss.alive) return;
    this.boss.hp--;
    this.cameras.main.shake(100, 0.005);
    SoundManager.get().playDroneHit();

    // White flash then red then clear
    this.boss.sprite.setTint(0xffffff);
    this.time.delayedCall(50, () => {
      if (this.boss.sprite && this.boss.sprite.active) this.boss.sprite.setTint(0xff4444);
      this.time.delayedCall(100, () => {
        if (this.boss.sprite && this.boss.sprite.active) this.boss.sprite.clearTint();
      });
    });

    // Scale bump
    this.tweens.add({
      targets: this.boss.sprite,
      scaleX: 1.05, scaleY: 1.05,
      duration: 100, yoyo: true,
      ease: 'Quad.easeOut',
    });

    // Debris particles flying off boss on hit
    const bx = this.boss.sprite.x, by = this.boss.sprite.y;
    for (let i = 0; i < 5; i++) {
      const p = this.add.circle(
        bx + (Math.random() - 0.5) * 30,
        by + (Math.random() - 0.5) * 30,
        2 + Math.random() * 3,
        [0x888888, 0x666666, 0xaa8866, 0xff6644][Math.floor(Math.random() * 4)],
        0.8
      ).setDepth(25);
      this.tweens.add({
        targets: p,
        x: p.x + (Math.random() - 0.5) * 60,
        y: p.y + (Math.random() - 0.5) * 60,
        alpha: 0, scale: 0,
        duration: 400 + Math.random() * 300,
        onComplete: () => p.destroy(),
      });
    }

    // Progressive expression changes based on HP percentage
    const hpRatio = this.boss.hp / this.boss.maxHp;
    if (hpRatio <= 0.33 && this.boss.hp > 0) {
      this.boss.sprite.setTexture('bm_boss1_angry');
    } else if (hpRatio <= 0.66 && hpRatio > 0.33) {
      // Intermediate damage — tint briefly to show stress
      if (this.textures.exists('bm_boss1_angry')) {
        this.boss.sprite.setTexture('bm_boss1_angry');
      }
    }

    if (this.boss.hp <= 0) {
      this._killBoss();
    }
  }

  _killBoss() {
    this.boss.alive = false;
    const sp = this.boss.sprite;
    const bx = sp.x, by = sp.y;

    // Dead expression
    sp.setTexture('bm_boss1_dead');

    // Step 1: Freeze for 0.5s
    this.time.delayedCall(500, () => {
      // Step 2: White screen flash
      this.cameras.main.flash(500, 255, 255, 255);

      // Step 3: Spray 30 particles (orange/red/yellow)
      const bossColors = [0xff6600, 0xffaa00, 0xff2200, 0xffdd00, 0xffffff];
      for (let i = 0; i < 30; i++) {
        const radius = 1.5 + Math.random() * 4;
        const color = bossColors[Math.floor(Math.random() * bossColors.length)];
        const p = this.add.circle(bx, by, radius, color, 0.9).setDepth(22);
        const angle = Math.random() * Math.PI * 2;
        const speed = 50 + Math.random() * 150;
        this.tweens.add({
          targets: p,
          x: bx + Math.cos(angle) * speed, y: by + Math.sin(angle) * speed,
          scale: 0,
          alpha: 0,
          rotation: Math.random() * 6,
          duration: 500 + Math.random() * 400,
          ease: 'Quad.easeOut',
          onComplete: () => p.destroy(),
        });
      }

      // Step 4: Camera shake for 1s
      this.cameras.main.shake(1000, 0.035);

      // Shake left/right then fall
      this.tweens.add({
        targets: sp, x: bx - 5, duration: 50, yoyo: true, repeat: 8,
        onComplete: () => {
          // Step 5: Fade boss alpha to 0 with rotation
          this.tweens.add({
            targets: sp, angle: -90, y: by + 200, alpha: 0,
            duration: 800, ease: 'Power2',
            onComplete: () => sp.destroy(),
          });
        },
      });
    });

    // Gold text
    const txt = this.add.text(bx, by - 40, 'BOSS ELIMINATED!', {
      fontFamily: 'monospace', fontSize: '16px', color: '#FFD700',
      shadow: { offsetX: 0, offsetY: 0, color: '#FFD700', blur: 12, fill: true },
    }).setOrigin(0.5).setDepth(50).setScale(0);
    this.tweens.add({
      targets: txt, scaleX: 1, scaleY: 1, duration: 500, ease: 'Back.easeOut',
      delay: 600,
    });
    this.tweens.add({
      targets: txt, alpha: 0, y: by - 70, duration: 1500, delay: 2600,
      onComplete: () => txt.destroy(),
    });
  }

  // ── Place bomb ──────────────────────────────────────────────────
  _placeBomb(col, row) {
    if (this.bombs.some(b => b.isAlive() && b.col === col && b.row === row)) return;

    this.player.activeBombs++;
    SoundManager.get().playBombDrop();

    const bomb = new Bomb(this, col, row, this.player.bombRange, (bc, br, range) => {
      this._handleExplosion(bc, br, range);
      this.player.activeBombs = Math.max(0, this.player.activeBombs - 1);
    });
    this.bombs.push(bomb);
  }

  // ── Handle explosion ────────────────────────────────────────────
  _handleExplosion(col, row, range) {
    SoundManager.get().playExplosion();
    this.cameras.main.shake(150, 0.012);

    this._spawnExplosionParticles(gx(col), gy(row));

    this._createExplosionAt(col, row);

    const dirs = [[0, -1], [0, 1], [-1, 0], [1, 0]];
    for (const [dc, dr] of dirs) {
      for (let i = 1; i <= range; i++) {
        const ec = col + dc * i;
        const er = row + dr * i;
        if (er < 0 || er >= ROWS || ec < 0 || ec >= COLS) break;

        const tile = this.map[er][ec];
        if (tile === T_WALL || tile === T_GDOOR) break;

        if (tile === T_BREAK || tile === T_DOOR) {
          this._destroyWall(ec, er);
          this._createExplosionAt(ec, er);
          break;
        }

        this._createExplosionAt(ec, er);

        for (const b of this.bombs) {
          if (b.isAlive() && b.col === ec && b.row === er) {
            b.forceExplode();
          }
        }
      }
    }

    this.bombs = this.bombs.filter(b => b.isAlive());
  }

  _createExplosionAt(col, row) {
    const x = gx(col), y = gy(row);
    const sp = this.add.image(x, y, 'bm_explode_center').setDepth(12);
    this.explosionTiles.push({ sprite: sp, col, row, timer: 500 });

    this._checkExplosionDamage(col, row);
  }

  _checkExplosionDamage(col, row) {
    // Player
    if (this.player.col === col && this.player.row === row) {
      this.player.takeDamage();
    }
    // Guards
    for (const g of this.guards) {
      if (!g.alive) continue;
      if (toCol(g.sprite.x) === col && toRow(g.sprite.y) === row) {
        g.kill();
        SoundManager.get().playDroneHit();
        this.hud.guardsKilled++;
        this.stats.guardsKilled++;
      }
    }
    // Boss: check 3x3 area around boss
    if (this.boss && this.boss.alive && this.boss.entered) {
      const bc = this.boss.col, br = this.boss.row;
      if (col >= bc - 1 && col <= bc + 1 && row >= br - 1 && row <= br + 1) {
        this._damageBoss();
      }
    }
  }

  _spawnExplosionParticles(x, y) {
    const colors = [0xff6600, 0xff8800, 0xffaa00, 0xff4400, 0xff2200, 0xffdd00, 0xffffff];
    for (let i = 0; i < 18; i++) {
      const radius = 1 + Math.random() * 4;
      const color = colors[Math.floor(Math.random() * colors.length)];
      const p = this.add.circle(x, y, radius, color, 0.9).setDepth(22);
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 120;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      this.tweens.add({
        targets: p,
        x: x + vx,
        y: y + vy,
        scale: 0,
        alpha: 0,
        rotation: Math.random() * 6,
        duration: 400 + Math.random() * 400,
        ease: 'Quad.easeOut',
        onComplete: () => p.destroy(),
      });
    }
  }

  // ── Destroy wall ────────────────────────────────────────────────
  _destroyWall(col, row) {
    const wasDoor = this.map[row][col] === T_DOOR;
    this.map[row][col] = T_EMPTY;

    const x = gx(col), y = gy(row);
    const bodies = this.breakGroup.getChildren();
    for (const body of bodies) {
      if (body.getData('col') === col && body.getData('row') === row) {
        const wallColors = [0x8B7355, 0x7A6245, 0x9A8365, 0x6B5335];
        for (let i = 0; i < 10; i++) {
          const radius = 1 + Math.random() * 3;
          const color = wallColors[Math.floor(Math.random() * wallColors.length)];
          const d = this.add.circle(x, y, radius, color, 0.9).setDepth(22);
          const ang = Math.random() * Math.PI * 2;
          const speed = 20 + Math.random() * 60;
          this.tweens.add({
            targets: d,
            x: x + Math.cos(ang) * speed, y: y + Math.sin(ang) * speed,
            scale: 0,
            alpha: 0,
            rotation: Math.random() * 4,
            duration: 350 + Math.random() * 250,
            ease: 'Quad.easeOut',
            onComplete: () => d.destroy(),
          });
        }
        body.destroy();
        break;
      }
    }

    const pup = this.powerupMap[row][col];
    if (pup) {
      this.powerupMap[row][col] = null;
      this._spawnPowerup(col, row, pup);
    }

    if (wasDoor) SoundManager.get().playDoorOpen();
  }

  // ── Spawn powerup ──────────────────────────────────────────────
  _spawnPowerup(col, row, type) {
    const x = gx(col), y = gy(row);
    const sp = this.add.image(x, y, `bm_pu_${type}`).setDepth(5);
    sp.setScale(0);
    this.tweens.add({ targets: sp, scaleX: 1, scaleY: 1, duration: 200, ease: 'Bounce.easeOut' });
    this.powerupSprites.push({ sprite: sp, col, row, type });
  }

  // ── Check golden door ──────────────────────────────────────────
  _checkGoldenDoor() {
    if (!this.goldDoorSprite || !this.goldDoorSprite.active) return;
    if (!this.player.hasKey) return;

    const dist = Math.abs(this.player.sprite.x - this.goldDoorSprite.x) +
                 Math.abs(this.player.sprite.y - this.goldDoorSprite.y);
    if (dist < TILE * 1.5) {
      this.map[this.goldDoorRow][this.goldDoorCol] = T_EMPTY;
      SoundManager.get().playDoorOpen();

      const x = this.goldDoorSprite.x, y = this.goldDoorSprite.y;
      const goldColors = [0xDAA520, 0xFFD700, 0xFFC000, 0xFFEE88];
      for (let i = 0; i < 12; i++) {
        const radius = 1.5 + Math.random() * 3;
        const color = goldColors[Math.floor(Math.random() * goldColors.length)];
        const p = this.add.circle(x, y, radius, color, 0.9).setDepth(22);
        const ang = Math.random() * Math.PI * 2;
        const speed = 25 + Math.random() * 60;
        this.tweens.add({
          targets: p,
          x: x + Math.cos(ang) * speed, y: y + Math.sin(ang) * speed,
          scale: 0,
          alpha: 0,
          rotation: Math.random() * 5,
          duration: 400 + Math.random() * 300,
          ease: 'Quad.easeOut',
          onComplete: () => p.destroy(),
        });
      }

      this.goldDoorSprite.destroy();
      this.goldDoorSprite = null;

      const txt = this.add.text(x, y - 20, 'DOOR OPENED!', {
        fontFamily: 'monospace', fontSize: '10px', color: '#FFD700',
      });
      txt.setOrigin(0.5).setDepth(50);
      this.tweens.add({ targets: txt, y: y - 40, alpha: 0, duration: 1000, onComplete: () => txt.destroy() });
    }
  }

  // ── Check powerup pickup ────────────────────────────────────────
  _checkPowerups() {
    const pc = this.player.col;
    const pr = this.player.row;
    for (let i = this.powerupSprites.length - 1; i >= 0; i--) {
      const pu = this.powerupSprites[i];
      if (pu.col === pc && pu.row === pr) {
        this.player.applyPowerup(pu.type);
        this.hud.powerupsCollected++;
        this.stats.powerupsCollected++;

        const sp = pu.sprite;
        this.tweens.add({
          targets: sp, y: sp.y - 20, alpha: 0, scaleX: 1.5, scaleY: 1.5,
          duration: 300, onComplete: () => sp.destroy(),
        });

        const names = { bomb: '+BOMB', range: '+RANGE', speed: '+SPEED', key: 'KEY!' };
        const colors = { bomb: '#ffffff', range: '#ff8800', speed: '#00ff00', key: '#FFD700' };
        const txt = this.add.text(sp.x, sp.y - 10, names[pu.type] || '+', {
          fontFamily: 'monospace', fontSize: '11px', color: colors[pu.type] || '#fff',
          shadow: { offsetX: 0, offsetY: 0, color: colors[pu.type] || '#fff', blur: 4, fill: true },
        });
        txt.setOrigin(0.5).setDepth(50);
        this.tweens.add({ targets: txt, y: txt.y - 25, alpha: 0, duration: 800, onComplete: () => txt.destroy() });

        SoundManager.get().playPickup();
        this.powerupSprites.splice(i, 1);
      }
    }
  }

  // ── Guard-player collision ──────────────────────────────────────
  _checkGuardCollision() {
    if (this.player.invulnerable || this.player.hp <= 0 || this.player.frozen) return;
    for (const g of this.guards) {
      if (!g.alive) continue;
      const dx = Math.abs(g.sprite.x - this.player.sprite.x);
      const dy = Math.abs(g.sprite.y - this.player.sprite.y);
      if (dx < 18 && dy < 18) {
        this.player.takeDamage();
        this.cameras.main.shake(100, 0.008);
        break;
      }
    }
  }

  // ── Game over screen ────────────────────────────────────────────
  _gameOverScreen(msg) {
    this.gameOver = true;
    this.cameras.main.flash(300, 255, 0, 0);
    SoundManager.get().playGameOver();

    // If checkpoint exists, R restarts from bomberman (GameScene) directly
    // If no checkpoint, R restarts from the platformer (PlatformerScene)
    let retryScene = 'PlatformerScene';
    try {
      if (localStorage.getItem('superzion_checkpoint_l1') === 'bomberman') {
        retryScene = 'GameScene';
      }
    } catch (e) { /* ignore */ }

    this.time.delayedCall(500, () => {
      this._endScreen = showDefeatScreen(this, {
        title: msg || 'MISSION FAILED',
        currentScene: retryScene,
        skipScene: 'ExplosionCinematicScene',
      });
    });
  }

  // ── Skip prompt ─────────────────────────────────────────────────
  _showSkipPrompt() {
    this.skipPromptActive = true;
    this.physics.world.pause();
    this.tweens.pauseAll();
    const cam = this.cameras.main;
    const o = this.add.rectangle(cam.width / 2, cam.height / 2, cam.width, cam.height, 0x000000, 0.5);
    o.setScrollFactor(0).setDepth(250);
    this.skipPromptObjects.push(o);
    const t = this.add.text(cam.width / 2, cam.height / 2 - 10, 'SKIP LEVEL?', {
      fontFamily: 'monospace', fontSize: '32px', color: '#FFD700',
    });
    t.setOrigin(0.5).setScrollFactor(0).setDepth(251);
    this.skipPromptObjects.push(t);
    const h = this.add.text(cam.width / 2, cam.height / 2 + 30, 'Y \u2014 Yes  /  N \u2014 No', {
      fontFamily: 'monospace', fontSize: '16px', color: '#aaa',
    });
    h.setOrigin(0.5).setScrollFactor(0).setDepth(251);
    this.skipPromptObjects.push(h);
  }

  _clearSkipPrompt() {
    this.skipPromptActive = false;
    this.physics.world.resume();
    this.tweens.resumeAll();
    for (const o of this.skipPromptObjects) o.destroy();
    this.skipPromptObjects = [];
  }

  // ── Pause menu ──────────────────────────────────────────────────
  _togglePause() {
    this.isPaused = !this.isPaused;
    if (this.isPaused) {
      this.physics.world.pause();
      this.tweens.pauseAll();
      const cam = this.cameras.main;
      const o = this.add.rectangle(cam.width / 2, cam.height / 2, cam.width, cam.height, 0x000000, 0.6);
      o.setScrollFactor(0).setDepth(250);
      this.pauseObjects.push(o);
      const t = this.add.text(cam.width / 2, cam.height / 2 - 40, 'PAUSED', {
        fontFamily: 'monospace', fontSize: '36px', color: '#fff',
      });
      t.setOrigin(0.5).setScrollFactor(0).setDepth(251);
      this.pauseObjects.push(t);
      const opts = this.add.text(cam.width / 2, cam.height / 2 + 20,
        'ENTER \u2014 Resume\nR \u2014 Restart\nQ \u2014 Quit to Menu\nM \u2014 Toggle Mute', {
        fontFamily: 'monospace', fontSize: '13px', color: '#aaa', align: 'center', lineSpacing: 6,
      });
      opts.setOrigin(0.5).setScrollFactor(0).setDepth(251);
      this.pauseObjects.push(opts);
    } else {
      this.physics.world.resume();
      this.tweens.resumeAll();
      for (const o of this.pauseObjects) o.destroy();
      this.pauseObjects = [];
    }
  }

  // ── Main update loop ────────────────────────────────────────────
  update(time, delta) {
    if (this.stats.startTime === 0) this.stats.startTime = this.time.now;

    // Mute toggle (always works)
    if (Phaser.Input.Keyboard.JustDown(this.muteKey)) {
      const muted = SoundManager.get().toggleMute();
      MusicManager.get().setMuted(muted);
    }

    // Skip prompt
    if (this.skipPromptActive) {
      if (Phaser.Input.Keyboard.JustDown(this.yKey)) {
        this._clearSkipPrompt();
        MusicManager.get().stop(0.3);
        const elapsed = this.time.now - this.stats.startTime;
        this.scene.start('ExplosionCinematicScene', {
          stats: { timesDetected: 0, elapsed, hp: this.player.hp, maxHp: this.player.maxHp },
        });
      } else if (Phaser.Input.Keyboard.JustDown(this.nKey) || Phaser.Input.Keyboard.JustDown(this.escKey)) {
        this._clearSkipPrompt();
      }
      return;
    }

    // P = skip prompt
    if (Phaser.Input.Keyboard.JustDown(this.skipKey) && !this.gameOver && !this.isPaused) {
      this._showSkipPrompt(); return;
    }

    // ESC = pause
    if (Phaser.Input.Keyboard.JustDown(this.escKey)) {
      this._togglePause(); return;
    }

    // Paused
    if (this.isPaused) {
      if (Phaser.Input.Keyboard.JustDown(this.enterKey)) this._togglePause();
      else if (Phaser.Input.Keyboard.JustDown(this.restartKey)) {
        this.isPaused = false; this.physics.world.resume(); this.tweens.resumeAll();
        MusicManager.get().stop(0); this.scene.restart();
      } else if (Phaser.Input.Keyboard.JustDown(this.quitKey)) {
        this.isPaused = false; this.physics.world.resume(); this.tweens.resumeAll();
        MusicManager.get().stop(0.5); this.scene.start('MenuScene');
      }
      return;
    }

    // Game over — EndScreen handles R/S key bindings
    if (this.gameOver) {
      return;
    }

    // Death check
    if (this.player.hp <= 0) { this._gameOverScreen(); return; }

    // Player
    this.player.update(delta);

    // Bomb placement
    if (this.player.wantsBomb() && this.player.canPlaceBomb() && !this.player.frozen) {
      this._placeBomb(this.player.col, this.player.row);
    }

    // Explosion tile cleanup
    for (let i = this.explosionTiles.length - 1; i >= 0; i--) {
      const et = this.explosionTiles[i];
      et.timer -= delta;
      if (et.timer <= 0) {
        et.sprite.destroy();
        this.explosionTiles.splice(i, 1);
      } else {
        et.sprite.setAlpha(et.timer / 500);
        this._checkExplosionDamage(et.col, et.row);
      }
    }

    // Guards
    for (const g of this.guards) {
      if (g.alive) g.update(delta, this.player.sprite);
    }

    // Guard collision
    this._checkGuardCollision();

    // Golden door
    this._checkGoldenDoor();

    // Powerup pickup
    this._checkPowerups();

    // Endgame
    this.endgame.update(delta);

    // HUD
    this.hud.update();

    // Boss HP bar
    this._updateBossHpBar();
  }

  shutdown() {
    if (this.ambientRef) {
      try { this.ambientRef.source.stop(); } catch (e) { /* ok */ }
      this.ambientRef = null;
    }
    if (this._endScreen) this._endScreen.destroy();
    this.tweens.killAll();
    this.time.removeAllEvents();
  }
}
