// ===================================================================
// Bomb entity — timer, blink animation, explosion callback
// ===================================================================

import { gx, gy } from '../data/LevelConfig.js';

export default class Bomb {
  constructor(scene, col, row, range, onExplode) {
    this.scene = scene;
    this.col = col;
    this.row = row;
    this.range = range;
    this.exploded = false;
    this._onExplode = onExplode;

    // Visual
    this.sprite = scene.add.image(gx(col), gy(row), 'bm_bomb').setDepth(8);

    // Slow blink (first 2s)
    this._blink = scene.tweens.add({
      targets: this.sprite,
      alpha: 0.4, duration: 400, yoyo: true, repeat: 2,
      onComplete: () => {
        // Fast blink (last 1s)
        this._blink = scene.tweens.add({
          targets: this.sprite,
          alpha: 0.2, duration: 100, yoyo: true, repeat: 4,
        });
      },
    });

    // Detonation timer (3 seconds)
    this._timer = scene.time.delayedCall(3000, () => this.explode());
  }

  explode() {
    if (this.exploded) return;
    this.exploded = true;
    if (this._blink) this.scene.tweens.killTweensOf(this.sprite);
    if (this._timer) this._timer.destroy();
    this.sprite.destroy();
    this._onExplode(this.col, this.row, this.range);
  }

  // For chain explosions
  forceExplode() {
    this.explode();
  }

  isAlive() { return !this.exploded; }

  destroy() {
    if (this._blink) this.scene.tweens.killTweensOf(this.sprite);
    if (this._timer) this._timer.destroy();
    if (this.sprite && this.sprite.active) this.sprite.destroy();
  }
}
