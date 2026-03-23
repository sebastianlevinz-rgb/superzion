// ===================================================================
// EndScreen — Reusable victory / defeat overlay for all 6 game levels
// ===================================================================

import MusicManager from '../systems/MusicManager.js';

const W = 960;
const H = 540;

// ─── helpers ─────────────────────────────────────────────────────
function _makeOverlay(scene) {
  return scene.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.85)
    .setScrollFactor(0)
    .setDepth(500);
}

function _makeTitle(scene, text, color, glowColor) {
  return scene.add.text(W / 2, 120, text, {
    fontFamily: 'monospace',
    fontSize: '32px',
    color,
    shadow: { offsetX: 0, offsetY: 0, color: glowColor, blur: 12, fill: true },
  }).setOrigin(0.5).setScrollFactor(0).setDepth(501);
}

function _makeStats(scene, stats, startY) {
  const elements = [];
  stats.forEach((s, i) => {
    const txt = scene.add.text(W / 2, startY + i * 24, `${s.label}: ${s.value}`, {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#ffffff',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(501);
    elements.push(txt);
  });
  return elements;
}

function _makeStars(scene, count, y) {
  const elements = [];
  if (count <= 0) return elements;
  const starSpacing = 30;
  const totalWidth = (count - 1) * starSpacing;
  const startX = W / 2 - totalWidth / 2;

  for (let i = 0; i < count; i++) {
    const star = scene.add.text(startX + i * starSpacing, y, '\u2605', {
      fontFamily: 'monospace',
      fontSize: '24px',
      color: '#FFD700',
      shadow: { offsetX: 0, offsetY: 0, color: '#FFD700', blur: 8, fill: true },
    }).setOrigin(0.5).setScrollFactor(0).setDepth(501);
    elements.push(star);
  }
  return elements;
}

function _makeButton(scene, x, y, label, borderColor, textColor) {
  const btn = scene.add.rectangle(x, y, 200, 50)
    .setStrokeStyle(2, borderColor)
    .setScrollFactor(0)
    .setDepth(501);

  const txt = scene.add.text(x, y, label, {
    fontFamily: 'monospace',
    fontSize: '18px',
    color: textColor,
  }).setOrigin(0.5).setScrollFactor(0).setDepth(502);

  // Subtle pulse animation (alpha oscillation)
  scene.tweens.add({
    targets: [btn, txt],
    alpha: 0.6,
    duration: 800,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.easeInOut',
  });

  return { btn, txt };
}

function _transitionTo(scene, targetScene, onBeforeTransition) {
  if (onBeforeTransition) onBeforeTransition();
  MusicManager.get().stop(0.3);
  scene.cameras.main.fadeOut(300);
  scene.time.delayedCall(350, () => {
    scene.scene.start(targetScene);
  });
}

// ─── public API ──────────────────────────────────────────────────

/**
 * Show victory overlay.
 *
 * @param {Phaser.Scene} scene
 * @param {object}       opts
 * @param {string}       [opts.title='MISSION COMPLETE']
 * @param {Array}        [opts.stats=[]]          { label, value } pairs
 * @param {number}       [opts.stars=0]           0-5
 * @param {string}       opts.currentScene        scene key for restart
 * @param {string}       opts.nextScene           scene key for next level
 * @param {Function}     [opts.onBeforeTransition] called before music stop + fade
 * @returns {{ elements: Array, destroy: Function }}
 */
export function showVictoryScreen(scene, opts = {}) {
  const {
    title = 'MISSION COMPLETE',
    stats = [],
    stars = 0,
    currentScene,
    nextScene,
    onBeforeTransition,
  } = opts;

  const elements = [];
  const cleanups = []; // { key, handler } pairs for keyboard cleanup

  // 1. Overlay
  const overlay = _makeOverlay(scene);
  elements.push(overlay);

  // 2. Title
  const titleObj = _makeTitle(scene, title, '#FFD700', '#FFD700');
  elements.push(titleObj);

  // 3. Stats
  const statsStartY = 180;
  const statObjs = _makeStats(scene, stats, statsStartY);
  elements.push(...statObjs);

  // 4. Stars
  const starsY = statsStartY + stats.length * 24 + 30;
  const starObjs = _makeStars(scene, stars, starsY);
  elements.push(...starObjs);

  // 5. Buttons
  const btnY = H - 80;
  const leftX = W / 2 - 120;
  const rightX = W / 2 + 120;

  const restartBtn = _makeButton(scene, leftX, btnY, 'PLAY AGAIN (R)', 0xffffff, '#ffffff');
  elements.push(restartBtn.btn, restartBtn.txt);

  const nextBtn = _makeButton(scene, rightX, btnY, 'NEXT LEVEL (ENTER)', 0xFFD700, '#FFD700');
  elements.push(nextBtn.btn, nextBtn.txt);

  // 5b. ESC — MENU label (center-bottom, below buttons)
  const escLabel = scene.add.text(W / 2, btnY + 40, 'ESC \u2014 MENU', {
    fontFamily: 'monospace',
    fontSize: '12px',
    color: '#888888',
  }).setOrigin(0.5).setScrollFactor(0).setDepth(501);
  elements.push(escLabel);

  // 6. Key handling (delayed 500ms to prevent accidental skip)
  scene.time.delayedCall(500, () => {
    const rKey = scene.input.keyboard.addKey('R');
    const enterKey = scene.input.keyboard.addKey('ENTER');
    const escKey = scene.input.keyboard.addKey('ESC');

    const rHandler = () => {
      _transitionTo(scene, currentScene, onBeforeTransition);
    };
    const enterHandler = () => {
      _transitionTo(scene, nextScene, onBeforeTransition);
    };
    const escHandler = () => {
      _transitionTo(scene, 'MenuScene', onBeforeTransition);
    };

    rKey.on('down', rHandler);
    enterKey.on('down', enterHandler);
    escKey.on('down', escHandler);

    cleanups.push({ key: rKey, handler: rHandler });
    cleanups.push({ key: enterKey, handler: enterHandler });
    cleanups.push({ key: escKey, handler: escHandler });
  });

  function destroy() {
    for (const c of cleanups) {
      c.key.off('down', c.handler);
    }
    cleanups.length = 0;
    for (const el of elements) {
      if (el && el.active) el.destroy();
    }
    elements.length = 0;
  }

  return { elements, destroy };
}

/**
 * Show defeat overlay.
 *
 * @param {Phaser.Scene} scene
 * @param {object}       opts
 * @param {string}       [opts.title='MISSION FAILED']
 * @param {Array}        [opts.stats=[]]          { label, value } pairs
 * @param {string}       opts.currentScene        scene key for retry
 * @param {string}       opts.skipScene           scene key for skip
 * @param {Function}     [opts.onBeforeTransition] called before music stop + fade
 * @returns {{ elements: Array, destroy: Function }}
 */
export function showDefeatScreen(scene, opts = {}) {
  const {
    title = 'MISSION FAILED',
    stats = [],
    currentScene,
    skipScene,
    onBeforeTransition,
  } = opts;

  const elements = [];
  const cleanups = []; // { key, handler } pairs for keyboard cleanup

  // 1. Overlay
  const overlay = _makeOverlay(scene);
  elements.push(overlay);

  // 2. Title
  const titleObj = _makeTitle(scene, title, '#ff3333', '#ff3333');
  elements.push(titleObj);

  // 3. Stats (optional)
  const statsStartY = 180;
  const statObjs = _makeStats(scene, stats, statsStartY);
  elements.push(...statObjs);

  // 4. Buttons
  const btnY = H - 80;
  const leftX = W / 2 - 120;
  const rightX = W / 2 + 120;

  const retryBtn = _makeButton(scene, leftX, btnY, 'RETRY (R)', 0xffffff, '#ffffff');
  elements.push(retryBtn.btn, retryBtn.txt);

  const skipBtn = _makeButton(scene, rightX, btnY, 'SKIP LEVEL (S)', 0xffff00, '#ffff00');
  elements.push(skipBtn.btn, skipBtn.txt);

  // 4b. ESC — MENU label (center-bottom, below buttons)
  const escLabel = scene.add.text(W / 2, btnY + 40, 'ESC \u2014 MENU', {
    fontFamily: 'monospace',
    fontSize: '12px',
    color: '#888888',
  }).setOrigin(0.5).setScrollFactor(0).setDepth(501);
  elements.push(escLabel);

  // 5. Key handling (delayed 500ms to prevent accidental skip)
  scene.time.delayedCall(500, () => {
    const rKey = scene.input.keyboard.addKey('R');
    const sKey = scene.input.keyboard.addKey('S');
    const escKey = scene.input.keyboard.addKey('ESC');

    const rHandler = () => {
      _transitionTo(scene, currentScene, onBeforeTransition);
    };
    const sHandler = () => {
      _transitionTo(scene, skipScene, onBeforeTransition);
    };
    const escHandler = () => {
      _transitionTo(scene, 'MenuScene', onBeforeTransition);
    };

    rKey.on('down', rHandler);
    sKey.on('down', sHandler);
    escKey.on('down', escHandler);

    cleanups.push({ key: rKey, handler: rHandler });
    cleanups.push({ key: sKey, handler: sHandler });
    cleanups.push({ key: escKey, handler: escHandler });
  });

  function destroy() {
    for (const c of cleanups) {
      c.key.off('down', c.handler);
    }
    cleanups.length = 0;
    for (const el of elements) {
      if (el && el.active) el.destroy();
    }
    elements.length = 0;
  }

  return { elements, destroy };
}
