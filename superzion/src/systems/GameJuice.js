// ═══════════════════════════════════════════════════════════════
// GameJuice — Screen flash, impact freeze, particles, shake
// Shared utility for all scenes to add game feel / "juice"
// ═══════════════════════════════════════════════════════════════

import Phaser from 'phaser';

/**
 * Flash the screen a color. Works on any scene.
 * @param {Phaser.Scene} scene
 * @param {number} color - Hex color (0xff0000 for red)
 * @param {number} duration - ms (default 150)
 * @param {number} alpha - max alpha (default 0.4)
 */
export function screenFlash(scene, color = 0xffffff, duration = 150, alpha = 0.4) {
  const flash = scene.add.rectangle(480, 270, 960, 540, color, alpha)
    .setScrollFactor(0).setDepth(999);
  scene.tweens.add({
    targets: flash,
    alpha: 0,
    duration,
    onComplete: () => flash.destroy(),
  });
}

/**
 * Freeze the game for a few frames (impact freeze / hitstop).
 * @param {Phaser.Scene} scene
 * @param {number} ms - freeze duration (default 80)
 */
export function impactFreeze(scene, ms = 80) {
  scene.time.timeScale = 0.05;
  scene.time.delayedCall(ms * 0.05, () => {
    scene.time.timeScale = 1;
  });
}

/**
 * Spawn impact particles at a position.
 * @param {Phaser.Scene} scene
 * @param {number} x
 * @param {number} y
 * @param {object} opts - { count, colors, speed, size, duration, depth }
 */
export function impactParticles(scene, x, y, opts = {}) {
  const count = opts.count || 8;
  const colors = opts.colors || [0xffffff, 0xffee88, 0xff8844];
  const speed = opts.speed || 120;
  const size = opts.size || 3;
  const duration = opts.duration || 400;
  const depth = opts.depth || 20;

  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const spd = speed * (0.4 + Math.random() * 0.6);
    const color = colors[Math.floor(Math.random() * colors.length)];
    const r = size * (0.5 + Math.random() * 0.5);
    const p = scene.add.circle(x, y, r, color, 0.9).setDepth(depth);
    scene.tweens.add({
      targets: p,
      x: x + Math.cos(angle) * spd * (duration / 1000),
      y: y + Math.sin(angle) * spd * (duration / 1000),
      alpha: 0,
      scale: 0.2,
      duration: duration * (0.6 + Math.random() * 0.4),
      onComplete: () => p.destroy(),
    });
  }
}

/**
 * Boss phase transition effect — dramatic pause + flash + text.
 * @param {Phaser.Scene} scene
 * @param {string} text - e.g. "PHASE 2" or "ENRAGED!"
 * @param {number} color - flash color
 * @param {Function} onComplete - called after animation
 */
export function bossPhaseTransition(scene, text, color = 0xff4444, onComplete) {
  // Freeze
  scene.time.timeScale = 0.05;

  // White flash
  const flash = scene.add.rectangle(480, 270, 960, 540, 0xffffff, 0.7)
    .setScrollFactor(0).setDepth(998);

  // Text
  const txt = scene.add.text(480, 270, text, {
    fontFamily: 'monospace', fontSize: '36px', color: '#ffffff',
    fontStyle: 'bold',
    shadow: { offsetX: 0, offsetY: 0, color: '#ff0000', blur: 20, fill: true },
  }).setOrigin(0.5).setScrollFactor(0).setDepth(999).setAlpha(0).setScale(2);

  // Camera shake
  scene.cameras.main.shake(400, 0.02);

  // Animate
  scene.tweens.add({
    targets: flash,
    alpha: 0,
    duration: 15, // 300ms * 0.05 timeScale
    onComplete: () => flash.destroy(),
  });

  scene.tweens.add({
    targets: txt,
    alpha: 1,
    scale: 1,
    duration: 10, // 200ms * 0.05
    ease: 'Back.easeOut',
    onComplete: () => {
      scene.time.delayedCall(20, () => { // 400ms * 0.05
        scene.tweens.add({
          targets: txt,
          alpha: 0,
          y: 240,
          duration: 10,
          onComplete: () => {
            txt.destroy();
            scene.time.timeScale = 1;
            if (onComplete) onComplete();
          },
        });
      });
    },
  });
}

/**
 * Hit feedback — screen flash + shake + optional freeze.
 * @param {Phaser.Scene} scene
 * @param {object} opts - { color, shakeIntensity, freezeMs }
 */
export function hitFeedback(scene, opts = {}) {
  const color = opts.color || 0xff0000;
  const shake = opts.shakeIntensity || 0.012;
  const freezeMs = opts.freezeMs || 0;

  screenFlash(scene, color, 120, 0.3);
  scene.cameras.main.shake(200, shake);
  if (freezeMs > 0) impactFreeze(scene, freezeMs);
}
