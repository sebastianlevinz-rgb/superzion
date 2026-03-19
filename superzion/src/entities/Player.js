// ===================================================================
// Bomberman Player — top-down movement, bomb placement, powerups
// ===================================================================

import Phaser from 'phaser';
import { gx, gy, toCol, toRow, SPAWN, TILE } from '../data/LevelConfig.js';
import SoundManager from '../systems/SoundManager.js';

const BASE_SPEED = 130;
const INVULN_DURATION = 2000;

// Dodge/dash constants
const DODGE_SPEED = 400;         // dash velocity (px/s)
const DODGE_DURATION = 200;      // ms — dash active time
const DODGE_COOLDOWN = 1000;     // ms — cooldown before next dash
const DODGE_INVULN_DURATION = 250; // ms — invulnerability window during dash

export default class BombermanPlayer {
  constructor(scene) {
    this.scene = scene;

    // Sprite
    this.sprite = scene.physics.add.sprite(
      gx(SPAWN.col), gy(SPAWN.row), 'bm_player_down_0'
    );
    this.sprite.setDepth(10);
    this.sprite.body.setSize(22, 22);
    this.sprite.body.setOffset(5, 8);
    this.sprite.setCollideWorldBounds(true);

    // Stats
    this.hp = 3;
    this.maxHp = 3;
    this.maxBombs = 1;
    this.bombRange = 2;
    this.speedBoosts = 0;
    this.hasKey = false;
    this.activeBombs = 0;

    // State
    this.facing = 'down';
    this.animFrame = 0;
    this.animTimer = 0;
    this.invulnerable = false;
    this.invulnTimer = 0;
    this.frozen = false;

    // Movement tracking
    this.stepTimer = 0;

    // Dodge/dash state
    this.isDodging = false;
    this.dodgeTimer = 0;
    this.dodgeCooldownTimer = 0;
    this.dodgeVX = 0;
    this.dodgeVY = 0;

    // Input
    this.cursors = scene.input.keyboard.createCursorKeys();
    this.keyW = scene.input.keyboard.addKey('W');
    this.keyA = scene.input.keyboard.addKey('A');
    this.keyS = scene.input.keyboard.addKey('S');
    this.keyD = scene.input.keyboard.addKey('D');
    this.bombKey = scene.input.keyboard.addKey('SPACE');
    this.interactKey = scene.input.keyboard.addKey('E');
    this.dodgeKey = scene.input.keyboard.addKey('SHIFT');
  }

  get speed() {
    return BASE_SPEED + this.speedBoosts * 30;
  }

  get col() { return toCol(this.sprite.x); }
  get row() { return toRow(this.sprite.y); }

  update(delta) {
    // Invulnerability
    if (this.invulnerable) {
      this.invulnTimer -= delta;
      if (this.invulnTimer <= 0) {
        this.invulnerable = false;
        this.sprite.setAlpha(1);
        this.sprite.clearTint();
      }
    }

    if (this.frozen) {
      this.sprite.body.setVelocity(0, 0);
      return;
    }

    // Dodge cooldown countdown
    if (this.dodgeCooldownTimer > 0) {
      this.dodgeCooldownTimer -= delta;
    }

    // Active dodge: override movement with dash velocity
    if (this.isDodging) {
      this.dodgeTimer -= delta;
      this.sprite.body.setVelocity(this.dodgeVX, this.dodgeVY);
      // Semi-transparent during dash
      if (!this.invulnerable) {
        this.sprite.setAlpha(0.35);
      }
      if (this.dodgeTimer <= 0) {
        this.isDodging = false;
        if (!this.invulnerable) {
          this.sprite.setAlpha(1);
        }
      }
      // Still update texture during dodge for visual continuity
      this.sprite.setTexture(`bm_player_${this.facing}_${this.animFrame}`);
      return;
    }

    // Movement
    const left = this.cursors.left.isDown || this.keyA.isDown;
    const right = this.cursors.right.isDown || this.keyD.isDown;
    const up = this.cursors.up.isDown || this.keyW.isDown;
    const down = this.cursors.down.isDown || this.keyS.isDown;

    let vx = 0, vy = 0;
    if (left) vx = -this.speed;
    if (right) vx = this.speed;
    if (up) vy = -this.speed;
    if (down) vy = this.speed;

    // Normalize diagonal
    if (vx !== 0 && vy !== 0) {
      vx *= 0.707;
      vy *= 0.707;
    }

    this.sprite.body.setVelocity(vx, vy);

    // Facing direction (prioritize most recent input)
    if (vy < 0) this.facing = 'up';
    else if (vy > 0) this.facing = 'down';
    else if (vx < 0) this.facing = 'left';
    else if (vx > 0) this.facing = 'right';

    // SHIFT = dodge/dash
    if (Phaser.Input.Keyboard.JustDown(this.dodgeKey) && this.dodgeCooldownTimer <= 0 && !this.isDodging) {
      this._startDodge(left, right, up, down);
    }

    // Animation
    const moving = vx !== 0 || vy !== 0;
    if (moving) {
      this.animTimer += delta;
      if (this.animTimer > 180) {
        this.animTimer = 0;
        this.animFrame = 1 - this.animFrame;
      }
      // Step sound
      this.stepTimer -= delta;
      if (this.stepTimer <= 0) {
        SoundManager.get().playStep();
        this.stepTimer = 250;
      }
    } else {
      this.animFrame = 0;
      this.animTimer = 0;
      this.stepTimer = 0;
    }

    this.sprite.setTexture(`bm_player_${this.facing}_${this.animFrame}`);
  }

  // ── Dodge/Dash mechanic (SHIFT key) ──
  _startDodge(left, right, up, down) {
    this.isDodging = true;
    this.dodgeTimer = DODGE_DURATION;
    this.dodgeCooldownTimer = DODGE_COOLDOWN;

    // Brief invulnerability during dash
    this.invulnerable = true;
    this.invulnTimer = DODGE_INVULN_DURATION;

    // Determine dash direction from current input, or from facing direction
    let dx = 0, dy = 0;
    if (left) dx = -1;
    if (right) dx = 1;
    if (up) dy = -1;
    if (down) dy = 1;

    // If no direction held, dash in facing direction
    if (dx === 0 && dy === 0) {
      if (this.facing === 'left') dx = -1;
      else if (this.facing === 'right') dx = 1;
      else if (this.facing === 'up') dy = -1;
      else dy = 1;
    }

    // Normalize diagonal dash
    const mag = Math.sqrt(dx * dx + dy * dy);
    this.dodgeVX = (dx / mag) * DODGE_SPEED;
    this.dodgeVY = (dy / mag) * DODGE_SPEED;

    // Visual: ghost trail at starting position
    const trail = this.scene.add.image(this.sprite.x, this.sprite.y,
      `bm_player_${this.facing}_${this.animFrame}`);
    trail.setDepth(this.sprite.depth - 1).setAlpha(0.4);
    trail.setTintFill(0x00ccff);
    this.scene.tweens.add({
      targets: trail,
      alpha: 0,
      scaleX: 1.5,
      scaleY: 1.5,
      duration: 300,
      onComplete: () => trail.destroy(),
    });

    // Sound cue (reuse step sound as a quick dash sound)
    SoundManager.get().playStep();
  }

  /** Returns dodge cooldown progress 0..1 (0 = ready, 1 = just used) */
  get dodgeCooldownPct() {
    return Math.max(0, this.dodgeCooldownTimer / DODGE_COOLDOWN);
  }

  wantsBomb() {
    return Phaser.Input.Keyboard.JustDown(this.bombKey);
  }

  wantsInteract() {
    return Phaser.Input.Keyboard.JustDown(this.interactKey);
  }

  canPlaceBomb() {
    return this.activeBombs < this.maxBombs;
  }

  takeDamage() {
    if (this.invulnerable || this.hp <= 0 || this.frozen) return;
    this.hp--;
    SoundManager.get().playHurt();
    this.invulnerable = true;
    this.invulnTimer = INVULN_DURATION;

    // Flash red
    this.sprite.setTintFill(0xff0000);
    this.scene.time.delayedCall(100, () => {
      if (this.sprite?.active) this.sprite.clearTint();
    });

    // Blink
    this.scene.tweens.add({
      targets: this.sprite,
      alpha: 0.3, duration: 100, yoyo: true,
      repeat: Math.floor(INVULN_DURATION / 200) - 1,
    });
  }

  applyPowerup(type) {
    if (type === 'bomb') {
      this.maxBombs++;
    } else if (type === 'range') {
      this.bombRange++;
    } else if (type === 'speed') {
      this.speedBoosts++;
    } else if (type === 'key') {
      this.hasKey = true;
    }
  }
}
