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
 * Show a full-screen tutorial overlay that pauses gameplay until dismissed.
 * Sets scene.tutorialActive = true; the scene's update() should check this flag
 * and skip gameplay logic while it's true.
 *
 * @param {Phaser.Scene} scene
 * @param {string[]} lines — array of text lines to display centered
 * @param {object} [opts] — { depth, title }
 * @returns {Promise<void>} resolves when the player dismisses the overlay
 */
export function showTutorialOverlay(scene, lines, opts = {}) {
  const depth = opts.depth || 200;
  scene.tutorialActive = true;

  const elements = [];

  // Full-screen dark overlay
  const overlay = scene.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.8)
    .setScrollFactor(0).setDepth(depth);
  elements.push(overlay);

  // Border rectangle
  const border = scene.add.rectangle(W / 2, H / 2, W - 40, H - 40)
    .setStrokeStyle(2, 0xffd700, 0.5).setFillStyle(0, 0)
    .setScrollFactor(0).setDepth(depth + 1);
  elements.push(border);

  // Title bar line at top
  const titleBar = scene.add.rectangle(W / 2, 40, W - 60, 2, 0xffd700, 0.3)
    .setScrollFactor(0).setDepth(depth + 1);
  elements.push(titleBar);

  // Render text lines centered vertically
  const lineHeight = 22;
  const totalHeight = lines.length * lineHeight;
  const startY = H / 2 - totalHeight / 2;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line === '') continue; // skip empty spacer lines

    // First line (title) gets larger font
    const isTitle = i === 0;
    const txt = scene.add.text(W / 2, startY + i * lineHeight, line, {
      fontFamily: 'monospace',
      fontSize: isTitle ? '20px' : '16px',
      color: '#FFD700',
      fontStyle: isTitle ? 'bold' : 'normal',
      shadow: isTitle
        ? { offsetX: 0, offsetY: 0, color: '#FFD700', blur: 8, fill: true }
        : undefined,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(depth + 2);
    elements.push(txt);
  }

  // "PRESS ANY KEY TO START" blinking at bottom
  const promptText = scene.add.text(W / 2, H - 60, 'PRESS ANY KEY TO START', {
    fontFamily: 'monospace',
    fontSize: '14px',
    color: '#ffffff',
    fontStyle: 'bold',
  }).setOrigin(0.5).setScrollFactor(0).setDepth(depth + 2);
  elements.push(promptText);

  // Blink animation
  const blinkTween = scene.tweens.add({
    targets: promptText,
    alpha: 0.2,
    duration: 600,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.easeInOut',
  });

  // Dismiss on any key press (delayed 300ms to prevent instant dismiss)
  scene.time.delayedCall(300, () => {
    const dismissHandler = () => {
      scene.tutorialActive = false;
      blinkTween.stop();
      for (const el of elements) {
        if (el && el.active) el.destroy();
      }
      scene.input.keyboard.off('keydown', dismissHandler);
    };
    scene.input.keyboard.on('keydown', dismissHandler);
  });
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
