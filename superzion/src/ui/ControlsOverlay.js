// ═══════════════════════════════════════════════════════════════
// ControlsOverlay — Readable controls display for all levels
// Shows big centered controls for 3s, then shrinks to bottom bar
// Black semi-transparent background, bright text
// ═══════════════════════════════════════════════════════════════

const W = 960;
const H = 540;

/**
 * Show controls overlay for a level.
 * @param {Phaser.Scene} scene
 * @param {string} controlsText — e.g. "ARROWS: Move | SPACE: Bomb | E: Interact"
 * @param {object} opts — { depth, barY, duration }
 * @returns {{ bar, barBg, bigOverlay, setText(newText) }}
 */
export function showControlsOverlay(scene, controlsText, opts = {}) {
  const depth = opts.depth || 90;
  const barY = opts.barY || H - 22;
  const showDuration = opts.duration || 3000;

  // ── Big centered overlay (shown first) ──
  const bigBg = scene.add.rectangle(W / 2, H / 2, 700, 80, 0x000000, 0.75)
    .setScrollFactor(0).setDepth(depth + 10);
  const bigBorder = scene.add.rectangle(W / 2, H / 2, 700, 80)
    .setStrokeStyle(2, 0xffd700, 0.6).setFillStyle(0, 0)
    .setScrollFactor(0).setDepth(depth + 10);
  const bigText = scene.add.text(W / 2, H / 2, controlsText, {
    fontFamily: 'monospace', fontSize: '18px', color: '#FFD700',
    fontStyle: 'bold',
    shadow: { offsetX: 0, offsetY: 0, color: '#FFD700', blur: 6, fill: true },
    wordWrap: { width: 680 },
    align: 'center',
  }).setOrigin(0.5).setScrollFactor(0).setDepth(depth + 11);

  // ── Fixed bottom bar (always present, initially hidden) ──
  const barBg = scene.add.rectangle(W / 2, barY, W, 32, 0x000000, 0.7)
    .setScrollFactor(0).setDepth(depth).setAlpha(0);
  const barText = scene.add.text(W / 2, barY, controlsText, {
    fontFamily: 'monospace', fontSize: '16px', color: '#FFD700',
    fontStyle: 'bold',
    shadow: { offsetX: 0, offsetY: 0, color: '#FFD700', blur: 6, fill: true },
  }).setOrigin(0.5).setScrollFactor(0).setDepth(depth + 1).setAlpha(0);

  // ── Transition: big overlay fades out, bar fades in ──
  scene.time.delayedCall(showDuration, () => {
    scene.tweens.add({
      targets: [bigBg, bigBorder, bigText],
      alpha: 0,
      duration: 600,
      onComplete: () => {
        bigBg.destroy();
        bigBorder.destroy();
        bigText.destroy();
      },
    });
    scene.tweens.add({
      targets: [barBg, barText],
      alpha: 1,
      duration: 600,
    });
  });

  return {
    barBg,
    barText,
    /** Update the bar text (e.g. when phase changes) */
    setText(newText) {
      barText.setText(newText);
    },
    /** Destroy everything */
    destroy() {
      try { bigBg.destroy(); } catch (e) {}
      try { bigBorder.destroy(); } catch (e) {}
      try { bigText.destroy(); } catch (e) {}
      barBg.destroy();
      barText.destroy();
    },
  };
}

/**
 * Add a black semi-transparent background behind an existing instrText.
 * Call this after the instrText is created.
 * @param {Phaser.Scene} scene
 * @param {Phaser.GameObjects.Text} instrText
 * @returns {Phaser.GameObjects.Rectangle} the background rectangle
 */
export function addInstrTextBackground(scene, instrText) {
  const bg = scene.add.rectangle(
    instrText.x, instrText.y,
    W, 28,
    0x000000, 0.7
  ).setOrigin(0.5).setScrollFactor(0).setDepth(instrText.depth - 1);

  // Make text brighter and bolder
  instrText.setColor('#FFD700');
  instrText.setFontSize('16px');
  instrText.setStyle({
    ...instrText.style,
    fontStyle: 'bold',
    shadow: { offsetX: 0, offsetY: 0, color: '#FFD700', blur: 6, fill: true },
  });

  return bg;
}
