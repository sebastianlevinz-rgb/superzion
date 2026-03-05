// ═══════════════════════════════════════════════════════════════
// Stealth obstacles — FlashlightGuard, Searchlight, SecurityLaser, SecurityCamera
// ═══════════════════════════════════════════════════════════════

import Phaser from 'phaser';
import { TILE, GROUND_Y } from '../data/LevelConfig.js';
import DifficultyManager from '../systems/DifficultyManager.js';

// ── Shared point-in-triangle (barycentric sign method) ────────
function _pointInTriangle(px, py, ax, ay, bx, by, cx, cy) {
  const d1 = (px - bx) * (ay - by) - (ax - bx) * (py - by);
  const d2 = (px - cx) * (by - cy) - (bx - cx) * (py - cy);
  const d3 = (px - ax) * (cy - ay) - (cx - ax) * (py - ay);
  const hasNeg = (d1 < 0) || (d2 < 0) || (d3 < 0);
  const hasPos = (d1 > 0) || (d2 > 0) || (d3 > 0);
  return !(hasNeg && hasPos);
}

// ── FLASHLIGHT GUARD ─────────────────────────────────────────
// Patrols left/right on ground with a flashlight cone
export class FlashlightGuard {
  constructor(scene, x, config = {}) {
    this.scene = scene;
    this.deactivated = false;
    this.type = 'flashlight_guard';

    const groundPx = GROUND_Y * TILE;
    this.patrolMinX = (config.patrolMin ?? 0) * TILE;
    this.patrolMaxX = (config.patrolMax ?? 200) * TILE;
    this.speed = (config.speed ?? 60) * DifficultyManager.get().enemySpeedMult();

    // Physics sprite on ground (world gravity applies automatically)
    this.sprite = scene.physics.add.sprite(x * TILE, groundPx - 32, 'guard_walk_0');
    this.sprite.setDepth(9);
    this.sprite.body.setSize(24, 54);
    this.sprite.body.setOffset(20, 10);

    // Patrol state
    this.dir = 1; // 1 = right, -1 = left
    this.walkFrame = 0;
    this.walkTimer = 0;

    // Flashlight cone
    this.coneLength = config.coneLength ?? 160;
    this.coneHalfAngle = config.coneHalfAngle ?? 0.4;
    this.graphics = scene.add.graphics();
    this.graphics.setDepth(7);

    // Source position
    this.x = this.sprite.x;
    this.y = this.sprite.y;
  }

  update(delta, playerX, playerY) {
    if (this.deactivated) return false;

    const dt = delta / 1000;

    // Patrol movement
    this.sprite.body.setVelocityX(this.speed * this.dir);

    // Flip at patrol bounds
    if (this.sprite.x >= this.patrolMaxX && this.dir > 0) {
      this.dir = -1;
    } else if (this.sprite.x <= this.patrolMinX && this.dir < 0) {
      this.dir = 1;
    }

    // Flip sprite based on direction
    this.sprite.setFlipX(this.dir < 0);

    // Walk animation
    this.walkTimer += delta;
    if (this.walkTimer > 150) {
      this.walkTimer = 0;
      this.walkFrame = (this.walkFrame + 1) % 4;
      this.sprite.setTexture(`guard_walk_${this.walkFrame}`);
    }

    // Update position for cone origin
    this.x = this.sprite.x;
    this.y = this.sprite.y;

    // Flashlight cone — points forward and ~30° downward
    const handOffsetX = this.dir * 16;
    const handOffsetY = 10;
    const originX = this.x + handOffsetX;
    const originY = this.y + handOffsetY;

    // Cone direction: mostly forward, angled down 30°
    const baseAngle = this.dir > 0 ? 0.5 : (Math.PI - 0.5);
    const ax = originX;
    const ay = originY;
    const bx = originX + Math.cos(baseAngle - this.coneHalfAngle) * this.coneLength;
    const by = originY + Math.sin(baseAngle - this.coneHalfAngle) * this.coneLength;
    const cx = originX + Math.cos(baseAngle + this.coneHalfAngle) * this.coneLength;
    const cy = originY + Math.sin(baseAngle + this.coneHalfAngle) * this.coneLength;

    // Draw cone
    this.graphics.clear();
    this.graphics.fillStyle(0xffff44, 0.12);
    this.graphics.beginPath();
    this.graphics.moveTo(ax, ay);
    this.graphics.lineTo(bx, by);
    this.graphics.lineTo(cx, cy);
    this.graphics.closePath();
    this.graphics.fillPath();

    this.graphics.lineStyle(1, 0xffff44, 0.25);
    this.graphics.beginPath();
    this.graphics.moveTo(ax, ay);
    this.graphics.lineTo(bx, by);
    this.graphics.moveTo(ax, ay);
    this.graphics.lineTo(cx, cy);
    this.graphics.strokePath();

    return _pointInTriangle(playerX, playerY, ax, ay, bx, by, cx, cy);
  }

  deactivate() {
    this.deactivated = true;
    this.sprite.body.setVelocityX(0);
    this.scene.tweens.add({
      targets: [this.graphics, this.sprite],
      alpha: 0,
      duration: 800,
    });
  }
}

// ── SEARCHLIGHT ───────────────────────────────────────────────
// Source above ground, sweeps a yellow cone left↔right
export class Searchlight {
  constructor(scene, x, y, config = {}) {
    this.scene = scene;
    this.deactivated = false;
    this.type = 'searchlight';

    this.x = x;
    this.y = y;

    this.sweepAngleMin = config.sweepAngleMin ?? -0.5;
    this.sweepAngleMax = config.sweepAngleMax ?? 0.5;
    this.sweepSpeed = config.sweepSpeed ?? 0.8;
    this.coneLength = config.coneLength ?? 220;
    this.coneHalfAngle = config.coneHalfAngle ?? 0.35;

    this.currentAngle = this.sweepAngleMin;
    this.sweepDir = 1;

    this.graphics = scene.add.graphics();
    this.graphics.setDepth(7);

    this.sprite = scene.add.image(x, y, 'searchlight_base');
    this.sprite.setDepth(8);
  }

  update(delta, playerX, playerY) {
    if (this.deactivated) return false;

    const dt = delta / 1000;

    this.currentAngle += this.sweepSpeed * this.sweepDir * dt;
    if (this.currentAngle >= this.sweepAngleMax) {
      this.currentAngle = this.sweepAngleMax;
      this.sweepDir = -1;
    } else if (this.currentAngle <= this.sweepAngleMin) {
      this.currentAngle = this.sweepAngleMin;
      this.sweepDir = 1;
    }

    const baseAngle = Math.PI / 2 + this.currentAngle;
    const ax = this.x;
    const ay = this.y;
    const bx = this.x + Math.cos(baseAngle - this.coneHalfAngle) * this.coneLength;
    const by = this.y + Math.sin(baseAngle - this.coneHalfAngle) * this.coneLength;
    const cx = this.x + Math.cos(baseAngle + this.coneHalfAngle) * this.coneLength;
    const cy = this.y + Math.sin(baseAngle + this.coneHalfAngle) * this.coneLength;

    this.graphics.clear();
    this.graphics.fillStyle(0xffff44, 0.15);
    this.graphics.beginPath();
    this.graphics.moveTo(ax, ay);
    this.graphics.lineTo(bx, by);
    this.graphics.lineTo(cx, cy);
    this.graphics.closePath();
    this.graphics.fillPath();

    this.graphics.lineStyle(1, 0xffff44, 0.3);
    this.graphics.beginPath();
    this.graphics.moveTo(ax, ay);
    this.graphics.lineTo(bx, by);
    this.graphics.moveTo(ax, ay);
    this.graphics.lineTo(cx, cy);
    this.graphics.strokePath();

    return _pointInTriangle(playerX, playerY, ax, ay, bx, by, cx, cy);
  }

  deactivate() {
    this.deactivated = true;
    this.scene.tweens.add({
      targets: [this.graphics, this.sprite],
      alpha: 0,
      duration: 800,
    });
  }
}

// ── SECURITY LASER ────────────────────────────────────────────
// Two endpoints, toggles on/off on a timer
export class SecurityLaser {
  constructor(scene, x1, y1, x2, y2, config = {}) {
    this.scene = scene;
    this.deactivated = false;
    this.type = 'laser';

    this.x1 = x1;
    this.y1 = y1;
    this.x2 = x2;
    this.y2 = y2;

    this.onDuration = config.onDuration ?? 2000;
    this.offDuration = config.offDuration ?? 2000;
    this.phaseOffset = config.phaseOffset ?? 0;

    this.isOn = true;
    this.timer = this.onDuration + this.phaseOffset;

    this.graphics = scene.add.graphics();
    this.graphics.setDepth(7);

    const zoneW = Math.abs(x2 - x1) || 6;
    const zoneH = Math.abs(y2 - y1) || 6;
    const zoneX = (x1 + x2) / 2;
    const zoneY = (y1 + y2) / 2;

    this.detectionZone = scene.add.zone(zoneX, zoneY, zoneW, zoneH);
    scene.physics.add.existing(this.detectionZone, true);
    this.detectionZone.body.enable = true;

    this.emitter1 = scene.add.image(x1, y1, 'laser_emitter');
    this.emitter1.setDepth(8);
    this.emitter2 = scene.add.image(x2, y2, 'laser_emitter');
    this.emitter2.setDepth(8);

    this.x = zoneX;
    this.y = zoneY;
  }

  update(delta) {
    if (this.deactivated) return false;

    this.timer -= delta;

    if (this.isOn && this.timer <= 0) {
      this.isOn = false;
      this.timer = this.offDuration;
      this.detectionZone.body.enable = false;
    } else if (!this.isOn && this.timer <= 0) {
      this.isOn = true;
      this.timer = this.onDuration;
      this.detectionZone.body.enable = true;
    }

    this.graphics.clear();

    if (this.isOn) {
      this.graphics.lineStyle(8, 0xff2222, 0.2);
      this.graphics.beginPath();
      this.graphics.moveTo(this.x1, this.y1);
      this.graphics.lineTo(this.x2, this.y2);
      this.graphics.strokePath();

      this.graphics.lineStyle(2, 0xff2222, 0.8);
      this.graphics.beginPath();
      this.graphics.moveTo(this.x1, this.y1);
      this.graphics.lineTo(this.x2, this.y2);
      this.graphics.strokePath();
    } else {
      this.graphics.lineStyle(1, 0x888888, 0.3);
      this.graphics.beginPath();
      this.graphics.moveTo(this.x1, this.y1);
      this.graphics.lineTo(this.x2, this.y2);
      this.graphics.strokePath();
    }

    return false;
  }

  deactivate() {
    this.deactivated = true;
    this.detectionZone.body.enable = false;
    this.scene.tweens.add({
      targets: [this.graphics, this.emitter1, this.emitter2],
      alpha: 0,
      duration: 800,
    });
  }
}

// ── SECURITY CAMERA ───────────────────────────────────────────
// Mounted high, sweeps a red cone downward
export class SecurityCamera {
  constructor(scene, x, y, config = {}) {
    this.scene = scene;
    this.deactivated = false;
    this.type = 'camera';

    this.x = x;
    this.y = y;

    this.sweepAngleMin = config.sweepAngleMin ?? 0.3;
    this.sweepAngleMax = config.sweepAngleMax ?? 1.2;
    this.sweepSpeed = config.sweepSpeed ?? 0.6;
    this.coneLength = config.coneLength ?? 180;
    this.coneHalfAngle = config.coneHalfAngle ?? 0.3;

    this.currentAngle = this.sweepAngleMin;
    this.sweepDir = 1;

    this.graphics = scene.add.graphics();
    this.graphics.setDepth(7);

    this.sprite = scene.add.image(x, y, 'camera_body');
    this.sprite.setDepth(8);
  }

  update(delta, playerX, playerY) {
    if (this.deactivated) return false;

    const dt = delta / 1000;

    this.currentAngle += this.sweepSpeed * this.sweepDir * dt;
    if (this.currentAngle >= this.sweepAngleMax) {
      this.currentAngle = this.sweepAngleMax;
      this.sweepDir = -1;
    } else if (this.currentAngle <= this.sweepAngleMin) {
      this.currentAngle = this.sweepAngleMin;
      this.sweepDir = 1;
    }

    const baseAngle = this.currentAngle;
    const ax = this.x;
    const ay = this.y;
    const bx = this.x + Math.cos(baseAngle - this.coneHalfAngle) * this.coneLength;
    const by = this.y + Math.sin(baseAngle - this.coneHalfAngle) * this.coneLength;
    const cx = this.x + Math.cos(baseAngle + this.coneHalfAngle) * this.coneLength;
    const cy = this.y + Math.sin(baseAngle + this.coneHalfAngle) * this.coneLength;

    this.graphics.clear();
    this.graphics.fillStyle(0xff2222, 0.12);
    this.graphics.beginPath();
    this.graphics.moveTo(ax, ay);
    this.graphics.lineTo(bx, by);
    this.graphics.lineTo(cx, cy);
    this.graphics.closePath();
    this.graphics.fillPath();

    this.graphics.lineStyle(1, 0xff2222, 0.25);
    this.graphics.beginPath();
    this.graphics.moveTo(ax, ay);
    this.graphics.lineTo(bx, by);
    this.graphics.moveTo(ax, ay);
    this.graphics.lineTo(cx, cy);
    this.graphics.strokePath();

    return _pointInTriangle(playerX, playerY, ax, ay, bx, by, cx, cy);
  }

  deactivate() {
    this.deactivated = true;
    this.scene.tweens.add({
      targets: [this.graphics, this.sprite],
      alpha: 0,
      duration: 800,
    });
  }
}
