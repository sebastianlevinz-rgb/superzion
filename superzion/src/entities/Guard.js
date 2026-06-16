// ===================================================================
// Bomberman Guard — patrol and chaser types
// Patrol: walks straight, turns 90 on wall collision
// Chaser: random walk, chases player within 4 tiles
// ===================================================================

import Phaser from 'phaser';
import { gx, gy, toCol, toRow, TILE, COLS, ROWS } from '../data/LevelConfig.js';

const PATROL_SPEED = 75;
const CHASER_SPEED = 60;
const CHASE_SPEED = 82;
const CHASE_RANGE = 3; // tiles
const DIRS = [[0, -1], [0, 1], [-1, 0], [1, 0]]; // up, down, left, right
const DIR_NAMES = ['up', 'down', 'left', 'right'];

export default class BombermanGuard {
  constructor(scene, def, map) {
    this.scene = scene;
    this.type = def.type; // 'patrol' or 'chaser'
    this.map = map;
    this.alive = true;
    this.speedMult = 1; // multiplied during escape

    const speed = this.type === 'patrol' ? PATROL_SPEED : CHASER_SPEED;
    this.baseSpeed = speed;

    // Sprite
    const prefix = this.type === 'patrol' ? 'bm_patrol' : 'bm_chaser';
    this.prefix = prefix;
    this.sprite = scene.physics.add.sprite(gx(def.col), gy(def.row), `${prefix}_down_0`);
    this.sprite.setDepth(10);
    // Body centered on lower half of sprite (feet grounded on floor tile)
    this.sprite.body.setSize(22, 22);
    this.sprite.body.setOffset(5, 5);

    // Movement state
    this.dirIdx = Math.floor(Math.random() * 4);
    this.facing = DIR_NAMES[this.dirIdx];
    this._applyVelocity();

    // Animation
    this.animFrame = 0;
    this.animTimer = 0;

    // Direction change timer (patrol: periodic random turns)
    this.turnTimer = 1500 + Math.random() * 2000;
  }

  update(delta, playerSprite) {
    if (!this.alive) return;

    const speed = this.baseSpeed * this.speedMult;
    const body = this.sprite.body;

    if (this.type === 'chaser' && playerSprite) {
      const dx = playerSprite.x - this.sprite.x;
      const dy = playerSprite.y - this.sprite.y;
      const dist = Math.abs(dx) + Math.abs(dy); // Manhattan in pixels
      const tileDist = dist / TILE;

      if (tileDist < CHASE_RANGE) {
        // Chase mode: move toward player
        const cs = CHASE_SPEED * this.speedMult;
        if (Math.abs(dx) > Math.abs(dy)) {
          body.setVelocity(dx > 0 ? cs : -cs, 0);
          this.facing = dx > 0 ? 'right' : 'left';
        } else {
          body.setVelocity(0, dy > 0 ? cs : -cs);
          this.facing = dy > 0 ? 'down' : 'up';
        }
        this._animate(delta);
        return;
      }
    }

    // Wall collision detection — change direction
    const blocked = body.blocked;
    if (blocked.up || blocked.down || blocked.left || blocked.right) {
      this._pickNewDirection();
    }

    // Periodic random turn (patrol behavior)
    this.turnTimer -= delta;
    if (this.turnTimer <= 0) {
      this.turnTimer = 1500 + Math.random() * 2000;
      if (Math.random() < 0.4) this._pickNewDirection();
    }

    this._applyVelocity();
    this._animate(delta);
  }

  _pickNewDirection() {
    // Try random perpendicular direction, then opposite
    const current = this.dirIdx;
    const candidates = [0, 1, 2, 3].filter(i => i !== current);
    // Shuffle
    for (let i = candidates.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
    }
    // Pick first unblocked direction
    for (const idx of candidates) {
      const [dx, dy] = DIRS[idx];
      const col = toCol(this.sprite.x) + dx;
      const row = toRow(this.sprite.y) + dy;
      if (row >= 0 && row < ROWS && col >= 0 && col < COLS) {
        const tile = this.map[row][col];
        if (tile === 0 || tile === 5) { // empty or objective
          this.dirIdx = idx;
          this.facing = DIR_NAMES[idx];
          return;
        }
      }
    }
    // All blocked: reverse
    this.dirIdx = (current < 2) ? (1 - current) : (current === 2 ? 3 : 2);
    this.facing = DIR_NAMES[this.dirIdx];
  }

  _applyVelocity() {
    const speed = this.baseSpeed * this.speedMult;
    const [dx, dy] = DIRS[this.dirIdx];
    this.sprite.body.setVelocity(dx * speed, dy * speed);
  }

  _animate(delta) {
    this.animTimer += delta;
    if (this.animTimer > 200) {
      this.animTimer = 0;
      this.animFrame = 1 - this.animFrame;
    }
    this.sprite.setTexture(`${this.prefix}_${this.facing}_${this.animFrame}`);
  }

  kill() {
    if (!this.alive) return;
    this.alive = false;
    this.sprite.body.setVelocity(0, 0);
    this.sprite.body.enable = false;

    // Death animation: flash red, shrink, fade
    this.sprite.setTintFill(0xff0000);
    this.scene.tweens.add({
      targets: this.sprite,
      scaleX: 0, scaleY: 0, alpha: 0,
      duration: 300,
      onComplete: () => this.sprite.destroy(),
    });
  }

  setSpeedMultiplier(mult) {
    this.speedMult = mult;
  }
}
