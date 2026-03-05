// ═══════════════════════════════════════════════════════════════
// Guard — patrol waypoints + vision cone + detection
// ═══════════════════════════════════════════════════════════════

import Phaser from 'phaser';

export default class Guard {
  constructor(scene, def) {
    this.scene = scene;
    this.patrol = def.patrol;
    this.speed = def.speed;
    this.coneLen = def.coneLen;
    this.coneHalf = Math.PI / 6; // 30° half-angle

    this.waypointIdx = 0;
    this.pauseTimer = 0;
    this.pauseDuration = 600; // ms pause at each waypoint

    const start = this.patrol[0];
    this.sprite = scene.physics.add.sprite(start.x, start.y, 'guard_down_0');
    this.sprite.setDepth(10);
    this.sprite.body.setSize(12, 14);
    this.sprite.body.setOffset(2, 4);
    this.sprite.body.setImmovable(true);

    this.facing = 'down';
    this.facingAngle = Math.PI / 2; // radians, down = PI/2
    this.animFrame = 0;
    this.animTimer = 0;
    this.moving = false;

    this.alertIcon = null;
    this.graphics = scene.add.graphics();
    this.graphics.setDepth(6);
  }

  update(delta, playerX, playerY) {
    // Pause at waypoint
    if (this.pauseTimer > 0) {
      this.pauseTimer -= delta;
      this.sprite.body.setVelocity(0, 0);
      this.moving = false;
      this._drawCone();
      this._animate(delta);
      return this._checkDetection(playerX, playerY);
    }

    // Move toward current waypoint
    const target = this.patrol[this.waypointIdx];
    const dx = target.x - this.sprite.x;
    const dy = target.y - this.sprite.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 3) {
      // Reached waypoint
      this.sprite.setPosition(target.x, target.y);
      this.waypointIdx = (this.waypointIdx + 1) % this.patrol.length;
      this.pauseTimer = this.pauseDuration;
      this.sprite.body.setVelocity(0, 0);
      this.moving = false;

      // Turn to face next waypoint
      const next = this.patrol[this.waypointIdx];
      this._faceToward(next.x, next.y);
    } else {
      const vx = (dx / dist) * this.speed;
      const vy = (dy / dist) * this.speed;
      this.sprite.body.setVelocity(vx, vy);
      this.moving = true;
      this._faceToward(target.x, target.y);
    }

    this._drawCone();
    this._animate(delta);
    return this._checkDetection(playerX, playerY);
  }

  _faceToward(tx, ty) {
    const dx = tx - this.sprite.x;
    const dy = ty - this.sprite.y;
    this.facingAngle = Math.atan2(dy, dx);

    // Cardinal direction for sprite
    if (Math.abs(dx) > Math.abs(dy)) {
      this.facing = dx > 0 ? 'right' : 'left';
    } else {
      this.facing = dy > 0 ? 'down' : 'up';
    }
  }

  _animate(delta) {
    this.animTimer += delta;
    if (this.animTimer > 250) {
      this.animTimer = 0;
      this.animFrame = 1 - this.animFrame;
    }
    const texKey = this.moving
      ? `guard_${this.facing}_${this.animFrame}`
      : `guard_${this.facing}_0`;
    this.sprite.setTexture(texKey);
  }

  _drawCone() {
    const g = this.graphics;
    g.clear();

    const cx = this.sprite.x;
    const cy = this.sprite.y;
    const a = this.facingAngle;

    // Cone triangle
    const bx = cx + Math.cos(a - this.coneHalf) * this.coneLen;
    const by = cy + Math.sin(a - this.coneHalf) * this.coneLen;
    const dx = cx + Math.cos(a + this.coneHalf) * this.coneLen;
    const dy = cy + Math.sin(a + this.coneHalf) * this.coneLen;

    // Fill
    g.fillStyle(0xff0000, 0.15);
    g.beginPath();
    g.moveTo(cx, cy);
    g.lineTo(bx, by);
    g.lineTo(dx, dy);
    g.closePath();
    g.fillPath();

    // Edge lines
    g.lineStyle(1, 0xff0000, 0.35);
    g.beginPath();
    g.moveTo(cx, cy); g.lineTo(bx, by);
    g.moveTo(cx, cy); g.lineTo(dx, dy);
    g.strokePath();
  }

  _checkDetection(playerX, playerY) {
    const cx = this.sprite.x;
    const cy = this.sprite.y;
    const a = this.facingAngle;

    // Cone triangle vertices
    const bx = cx + Math.cos(a - this.coneHalf) * this.coneLen;
    const by = cy + Math.sin(a - this.coneHalf) * this.coneLen;
    const dx = cx + Math.cos(a + this.coneHalf) * this.coneLen;
    const dy = cy + Math.sin(a + this.coneHalf) * this.coneLen;

    return this._pointInTriangle(playerX, playerY, cx, cy, bx, by, dx, dy);
  }

  _pointInTriangle(px, py, ax, ay, bx, by, cx, cy) {
    const d1 = (px - bx) * (ay - by) - (ax - bx) * (py - by);
    const d2 = (px - cx) * (by - cy) - (bx - cx) * (py - cy);
    const d3 = (px - ax) * (cy - ay) - (cx - ax) * (py - ay);
    const hasNeg = (d1 < 0) || (d2 < 0) || (d3 < 0);
    const hasPos = (d1 > 0) || (d2 > 0) || (d3 > 0);
    return !(hasNeg && hasPos);
  }

  showAlert() {
    if (this.alertIcon) return;
    this.alertIcon = this.scene.add.image(this.sprite.x, this.sprite.y - 18, 'alert_icon');
    this.alertIcon.setDepth(20);
    this.alertIcon.setScale(1.5);
    this.scene.tweens.add({
      targets: this.alertIcon,
      y: this.sprite.y - 24, scaleX: 2, scaleY: 2,
      duration: 200, yoyo: true,
      onComplete: () => {
        if (this.alertIcon) { this.alertIcon.destroy(); this.alertIcon = null; }
      },
    });
  }
}
