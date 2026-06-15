// ===================================================================
// Cinematic Engine -- Shared page-based text system for all cinematics
// Ported from BaseCinematicScene.js (Phaser) to Kaplay
// ===================================================================

import { W, H } from '../constants.js';

/**
 * Create a page-based cinematic.
 * @param {object} k - Kaplay instance
 * @param {Array} pages - [{ text, color, size, y, charDelay, setup, cleanup, autoAdvance }]
 *   text: string to typewrite
 *   color: [r,g,b] array (default [255,255,255])
 *   size: font size (default 20)
 *   y: vertical position (default H*0.45)
 *   charDelay: seconds per character (default 0.025)
 *   setup: function(objects) called when page starts — push visuals to objects[]
 *   cleanup: function() called when leaving page
 *   autoAdvance: milliseconds — auto-advance after this delay (pass ms, converted internally)
 * @param {string} targetScene - Scene to go to after last page
 * @param {object} opts - { title, coords, drawBg, onEnd }
 */
export function runCinematic(k, pages, targetScene, opts = {}) {
  const pageVisuals = [];
  let currentPage = -1;
  let typewriterIdx = 0;
  let typewriterComplete = false;
  let pageReady = false;
  let skipped = false;
  let textObj = null;
  let twTimerCancel = null;
  let autoAdvanceCancel = null;

  // -- Background --
  if (opts.drawBg) {
    opts.drawBg(k);
  } else {
    drawMilitaryBg(k);
  }

  // Military HUD overlay
  drawMilitaryHUD(k, opts.title || '', opts.coords || '');

  // Animated scan line (slow green sweep top to bottom)
  const scanLine = k.add([
    k.rect(W, 2), k.pos(0, 0), k.color(0, 255, 0), k.opacity(0.06), k.z(6),
  ]);
  scanLine.pos.y = 0;
  k.tween(0, H, 4, (v) => { if (scanLine.exists()) scanLine.pos.y = v; }, k.easings.linear);
  k.loop(4, () => {
    if (scanLine.exists()) {
      scanLine.pos.y = 0;
      k.tween(0, H, 4, (v) => { if (scanLine.exists()) scanLine.pos.y = v; }, k.easings.linear);
    }
  });

  // Space/tap hint (blinking)
  const isMobile = 'ontouchstart' in window;
  const hintLabel = isMobile ? '> TAP' : '> SPACE';
  const hint = k.add([
    k.text(hintLabel, { size: 14, font: 'monospace' }),
    k.pos(W / 2, H - 28), k.anchor('center'),
    k.color(255, 204, 0), k.opacity(0), k.z(200),
  ]);
  let hintBlink = 0;
  hint.onUpdate(() => {
    hintBlink += k.dt();
    if (pageReady) {
      hint.opacity = 0.3 + Math.abs(Math.sin(hintBlink * 3)) * 0.7;
    }
  });

  // ESC hint
  if (!isMobile) {
    k.add([
      k.text('ESC TO SKIP', { size: 10, font: 'monospace' }),
      k.pos(W - 16, H - 14), k.anchor('botright'),
      k.color(68, 68, 68), k.z(200),
    ]);
  }

  // -- Page management --

  function clearPageVisuals() {
    for (const obj of pageVisuals) {
      if (obj && obj.exists && obj.exists()) obj.destroy();
    }
    pageVisuals.length = 0;
  }

  function advancePage() {
    if (skipped) return;

    // Cleanup current page
    if (currentPage >= 0 && pages[currentPage]?.cleanup) {
      pages[currentPage].cleanup();
    }
    if (twTimerCancel) { twTimerCancel(); twTimerCancel = null; }
    if (autoAdvanceCancel) { autoAdvanceCancel(); autoAdvanceCancel = null; }
    if (textObj) {
      if (textObj.exists()) textObj.destroy();
      textObj = null;
    }
    clearPageVisuals();

    currentPage++;

    if (currentPage >= pages.length) {
      endCinematic();
      return;
    }

    const page = pages[currentPage];
    typewriterIdx = 0;
    typewriterComplete = false;
    pageReady = false;
    hint.opacity = 0;

    // Run visual setup for this page
    if (page.setup) page.setup(pageVisuals);

    // Display text with typewriter effect
    const txt = page.text || '';
    const charDelay = page.charDelay || 0.025;
    const textY = page.y || H * 0.45;
    const textSize = page.size || 20;
    const textColor = page.color || [255, 255, 255];

    textObj = k.add([
      k.text('', { size: textSize, font: 'monospace', width: W - 100 }),
      k.pos(W / 2, textY), k.anchor('center'),
      k.color(...textColor), k.z(20),
    ]);

    if (!txt || txt.trim().length === 0) {
      // Empty text page (e.g. title page)
      typewriterComplete = true;
      pageReady = true;
      hint.opacity = 1;
    } else {
      const loopCtrl = k.loop(charDelay, () => {
        if (skipped) return;
        typewriterIdx++;
        if (textObj && textObj.exists()) {
          textObj.text = txt.substring(0, typewriterIdx);
        }
        if (typewriterIdx >= txt.length) {
          typewriterComplete = true;
          pageReady = true;
          hint.opacity = 1;
          if (twTimerCancel) { twTimerCancel(); twTimerCancel = null; }
        }
      });
      twTimerCancel = () => { if (loopCtrl && loopCtrl.cancel) loopCtrl.cancel(); };
    }

    // Auto-advance support (autoAdvance is in milliseconds, convert to seconds)
    if (page.autoAdvance) {
      const waitCtrl = k.wait(page.autoAdvance / 1000, () => {
        if (!skipped) advancePage();
      });
      autoAdvanceCancel = () => { if (waitCtrl && waitCtrl.cancel) waitCtrl.cancel(); };
    }
  }

  function completeTypewriter() {
    if (!textObj || !pages[currentPage]) return;
    if (twTimerCancel) { twTimerCancel(); twTimerCancel = null; }
    const page = pages[currentPage];
    if (textObj.exists()) {
      textObj.text = page.text || '';
    }
    typewriterComplete = true;
    pageReady = true;
    hint.opacity = 1;
  }

  function endCinematic() {
    if (skipped) return;
    skipped = true;
    if (twTimerCancel) { twTimerCancel(); twTimerCancel = null; }
    if (autoAdvanceCancel) { autoAdvanceCancel(); autoAdvanceCancel = null; }

    // Fade out and go to target
    const fade = k.add([
      k.rect(W, H), k.pos(0, 0), k.color(0, 0, 0), k.opacity(0), k.z(999),
    ]);
    k.tween(0, 1, 0.3, (v) => {
      if (fade.exists()) fade.opacity = v;
    }, k.easings.linear).onEnd(() => {
      if (opts.onEnd) opts.onEnd();
      k.go(targetScene);
    });
  }

  // -- Input --
  k.onKeyPress('space', () => {
    if (skipped) return;
    if (!typewriterComplete) completeTypewriter();
    else if (pageReady) advancePage();
  });
  k.onKeyPress('enter', () => {
    if (skipped) return;
    if (!typewriterComplete) completeTypewriter();
    else if (pageReady) advancePage();
  });
  k.onKeyPress('escape', () => {
    if (!skipped) endCinematic();
  });
  k.onMousePress(() => {
    if (skipped) return;
    if (!typewriterComplete) completeTypewriter();
    else if (pageReady) advancePage();
  });

  // Start first page
  advancePage();

  // Return control object for external use
  return {
    skip: () => { if (!skipped) endCinematic(); },
  };
}

// ===================================================================
// Military terminal background -- dark gradient + grid + scanlines
// ===================================================================

export function drawMilitaryBg(k) {
  k.onDraw(() => {
    // Dark gradient background
    for (let y = 0; y < H; y += 2) {
      const t = y / H;
      const r = Math.floor(4 + t * 12);
      const g = Math.floor(6 + t * 14);
      const b = Math.floor(10 + t * 18);
      k.drawRect({ pos: k.vec2(0, y), width: W, height: 2, color: k.rgb(r, g, b) });
    }

    // Grid lines every 30px
    for (let x = 0; x < W; x += 30) {
      k.drawLine({
        p1: k.vec2(x, 0), p2: k.vec2(x, H),
        color: k.rgb(0, 255, 0), opacity: 0.04, width: 1,
      });
    }
    for (let y = 0; y < H; y += 30) {
      k.drawLine({
        p1: k.vec2(0, y), p2: k.vec2(W, y),
        color: k.rgb(0, 255, 0), opacity: 0.04, width: 1,
      });
    }

    // Scanlines (every 2px)
    for (let y = 0; y < H; y += 2) {
      k.drawRect({ pos: k.vec2(0, y), width: W, height: 1, color: k.rgb(0, 0, 0), opacity: 0.12 });
    }
  });
}

// ===================================================================
// Military HUD overlay -- title, coords, timestamp, corner brackets
// ===================================================================

export function drawMilitaryHUD(k, title, coords) {
  // Classification label
  k.add([
    k.text('TOP SECRET // MOSSAD', { size: 9, font: 'monospace' }),
    k.pos(12, 12), k.color(85, 51, 51), k.z(50),
  ]);

  // Timestamp
  const now = new Date();
  const ts = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')} UTC`;
  k.add([
    k.text(ts, { size: 9, font: 'monospace' }),
    k.pos(W - 12, 12), k.anchor('topright'), k.color(68, 68, 68), k.z(50),
  ]);

  // Operation title
  if (title) {
    k.add([
      k.text(title, { size: 20, font: 'monospace' }),
      k.pos(W / 2, 24), k.anchor('center'),
      k.color(0, 170, 68), k.z(50),
    ]);
  }

  // Coordinates
  if (coords) {
    k.add([
      k.text(coords, { size: 11, font: 'monospace' }),
      k.pos(W / 2, 48), k.anchor('center'),
      k.color(85, 85, 85), k.z(50),
    ]);
  }

  // Corner brackets (drawn each frame via onDraw)
  const bLen = 20;
  k.onDraw(() => {
    const c = k.rgb(0, 170, 68);
    const o = 0.4;
    // Top-left
    k.drawLine({ p1: k.vec2(8, 8), p2: k.vec2(8 + bLen, 8), color: c, opacity: o, width: 1 });
    k.drawLine({ p1: k.vec2(8, 8), p2: k.vec2(8, 8 + bLen), color: c, opacity: o, width: 1 });
    // Top-right
    k.drawLine({ p1: k.vec2(W - 8, 8), p2: k.vec2(W - 8 - bLen, 8), color: c, opacity: o, width: 1 });
    k.drawLine({ p1: k.vec2(W - 8, 8), p2: k.vec2(W - 8, 8 + bLen), color: c, opacity: o, width: 1 });
    // Bottom-left
    k.drawLine({ p1: k.vec2(8, H - 8), p2: k.vec2(8 + bLen, H - 8), color: c, opacity: o, width: 1 });
    k.drawLine({ p1: k.vec2(8, H - 8), p2: k.vec2(8, H - 8 - bLen), color: c, opacity: o, width: 1 });
    // Bottom-right
    k.drawLine({ p1: k.vec2(W - 8, H - 8), p2: k.vec2(W - 8 - bLen, H - 8), color: c, opacity: o, width: 1 });
    k.drawLine({ p1: k.vec2(W - 8, H - 8), p2: k.vec2(W - 8, H - 8 - bLen), color: c, opacity: o, width: 1 });

    // Accent line under title
    if (title) {
      k.drawLine({
        p1: k.vec2(W * 0.3, 60), p2: k.vec2(W * 0.7, 60),
        color: c, opacity: 0.3, width: 1,
      });
    }
  });
}
