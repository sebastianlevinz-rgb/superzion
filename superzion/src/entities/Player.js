// ═══════════════════════════════════════════════════════════════
// SuperZion — Side-scroller Player
// A/D + jump movement, per-sprite gravity, HP, no shooting
// ═══════════════════════════════════════════════════════════════

import Phaser from 'phaser';
import SoundManager from '../systems/SoundManager.js';
import DifficultyManager from '../systems/DifficultyManager.js';

const MOVE_SPEED = 280;
const JUMP_VELOCITY = -480;
const COYOTE_TIME = 100;   // ms
const JUMP_BUFFER = 150;   // ms

export default class Player {
  constructor(scene, x, y, frameData) {
    this.scene = scene;
    this.frameData = frameData;

    this.sprite = scene.physics.add.sprite(x, y, 'superzion', frameData['idle_0']);
    this.sprite.setDepth(10);
    // Body: 28x64 covering shoulders(y=22) to feet(y=86) in 128px sprite
    // offset 50 centers the 28px body in the 128px wide frame
    // offset 22 aligns body bottom (22+64=86) with the boot soles
    this.sprite.body.setSize(28, 64);
    this.sprite.body.setOffset(50, 22);
    this.sprite.setCollideWorldBounds(true);

    // HP (hard mode: 3, normal: 5)
    const baseHP = 5;
    this.maxHp = Math.round(baseHP * DifficultyManager.get().playerHPMult());
    this.hp = this.maxHp;
    this.invulnerable = false;
    this.invulnTimer = 0;
    this.invulnDuration = 1500;

    // Jump helpers
    this.coyoteTimer = 0;
    this.jumpBufferTimer = 0;
    this.wasOnGround = false;

    // Animation state
    this.animState = 'idle';
    this.frozen = false;

    // Particle / sound helpers
    this.stepTimer = 0;
    this.wasInAir = false;

    // Input
    this.cursors = scene.input.keyboard.createCursorKeys();
    this.keyW = scene.input.keyboard.addKey('W');
    this.keyA = scene.input.keyboard.addKey('A');
    this.keyD = scene.input.keyboard.addKey('D');
    this.actionKey = scene.input.keyboard.addKey('SPACE');
  }

  update(delta) {
    if (this.invulnerable) {
      this.invulnTimer -= delta;
      if (this.invulnTimer <= 0) {
        this.invulnerable = false;
        this.sprite.setAlpha(1);
        this.sprite.clearTint();
      }
    }

    if (this.frozen) {
      this.sprite.body.setVelocityX(0);
      return;
    }

    const onGround = this.sprite.body.blocked.down;

    // Coyote time
    if (onGround) {
      this.coyoteTimer = COYOTE_TIME;
    } else {
      this.coyoteTimer -= delta;
    }

    // Horizontal movement
    const left = this.cursors.left.isDown || this.keyA.isDown;
    const right = this.cursors.right.isDown || this.keyD.isDown;
    let vx = 0;
    if (left) vx = -MOVE_SPEED;
    if (right) vx = MOVE_SPEED;
    this.sprite.body.setVelocityX(vx);

    // Facing
    if (vx < 0) this.sprite.setFlipX(true);
    else if (vx > 0) this.sprite.setFlipX(false);

    // Jump buffer
    const jumpPressed = Phaser.Input.Keyboard.JustDown(this.cursors.up) ||
                        Phaser.Input.Keyboard.JustDown(this.keyW);
    if (jumpPressed) this.jumpBufferTimer = JUMP_BUFFER;
    else this.jumpBufferTimer -= delta;

    // Execute jump
    if (this.jumpBufferTimer > 0 && this.coyoteTimer > 0) {
      this.sprite.body.setVelocityY(JUMP_VELOCITY);
      this.jumpBufferTimer = 0;
      this.coyoteTimer = 0;
      SoundManager.get().playJump();
    }

    // Animation state
    let newState;
    if (!onGround && this.sprite.body.velocity.y < -50) {
      newState = 'jump';
    } else if (!onGround && this.sprite.body.velocity.y > 50) {
      newState = 'fall';
    } else if (Math.abs(vx) > 0) {
      newState = 'run';
    } else {
      newState = 'idle';
    }

    if (newState !== this.animState) {
      this.animState = newState;
      this.sprite.play(newState, true);
    }

    // Landing detection
    if (this.wasInAir && onGround) {
      this._spawnLandingPuff();
      SoundManager.get().playLand();
    }

    // Running dust + step sound
    if (onGround && Math.abs(vx) > 0) {
      this.stepTimer -= delta;
      if (this.stepTimer <= 0) {
        this._spawnRunDust();
        SoundManager.get().playStep();
        this.stepTimer = 180;
      }
    } else {
      this.stepTimer = 0;
    }

    this.wasInAir = !onGround;
  }

  takeDamage(amount, sourceX) {
    if (this.invulnerable || this.hp <= 0) return;
    this.hp = Math.max(0, this.hp - (amount || 1));
    SoundManager.get().playHurt();
    this.invulnerable = true;
    this.invulnTimer = this.invulnDuration;

    // Knockback away from source
    if (sourceX !== undefined) {
      const dir = this.sprite.x < sourceX ? -1 : 1;
      this.sprite.body.setVelocityX(dir * 200);
      this.sprite.body.setVelocityY(-150);
    }

    // Red flash
    this.sprite.setTintFill(0xff0000);
    this.scene.time.delayedCall(100, () => {
      if (this.sprite?.active) this.sprite.clearTint();
    });

    // Blink
    this.scene.tweens.add({
      targets: this.sprite,
      alpha: 0.3, duration: 100, yoyo: true,
      repeat: Math.floor(this.invulnDuration / 200) - 1,
    });
  }

  _spawnRunDust() {
    const sx = this.sprite.x;
    const sy = this.sprite.body.bottom;
    for (let i = 0; i < 3; i++) {
      const size = 2 + Math.random() * 2;
      const d = this.scene.add.rectangle(
        sx + (Math.random() - 0.5) * 10, sy - Math.random() * 4,
        size, size, 0x8A7A60, 0.6
      );
      d.setDepth(9);
      this.scene.tweens.add({
        targets: d,
        y: d.y - 8 - Math.random() * 6,
        alpha: 0,
        duration: 250,
        onComplete: () => d.destroy(),
      });
    }
  }

  _spawnLandingPuff() {
    const sx = this.sprite.x;
    const sy = this.sprite.body.bottom;
    for (let i = 0; i < 6; i++) {
      const size = 2 + Math.random() * 3;
      const d = this.scene.add.rectangle(
        sx + (Math.random() - 0.5) * 16, sy - Math.random() * 2,
        size, size, 0x8A7A60, 0.7
      );
      d.setDepth(9);
      this.scene.tweens.add({
        targets: d,
        x: d.x + (Math.random() - 0.5) * 20,
        y: d.y - 10 - Math.random() * 10,
        alpha: 0,
        duration: 300,
        onComplete: () => d.destroy(),
      });
    }
  }
}
