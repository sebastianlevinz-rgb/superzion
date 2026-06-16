// ═══════════════════════════════════════════════════════════════
// BaseCinematicScene — Shared base class for all cinematic scenes
// Provides: page-by-page text system, typewriter, skip/mute, ESC
// ═══════════════════════════════════════════════════════════════

import Phaser from 'phaser';
import SoundManager from '../systems/SoundManager.js';
import MusicManager from '../systems/MusicManager.js';
import InputManager from '../systems/InputManager.js';

const W = 960;
const H = 540;

export { W, H };

export default class BaseCinematicScene extends Phaser.Scene {
  constructor(key) { super(key); }

  /** Call in subclass create() after setting up textures */
  _initCinematic() {
    this.cameras.main.setBackgroundColor('#000000');
    this.actObjects = [];
    this.currentAct = 0;
    this.skipped = false;

    // Unified input (shows tap-anywhere zone on mobile)
    this.inputManager = new InputManager(this, { preset: 'cinematic' });

    // Safety-net teardown: kills orphan timers/tweens and any ambient sound a
    // page started, so nothing (a looping ping, a battle drone) bleeds into the
    // next scene when the player skips/advances fast. (InputManager self-destroys.)
    this._ambientRef = null;
    this.events.once('shutdown', this._cinematicShutdown, this);

    this.enterKey = this.input.keyboard.addKey('ENTER');
    this.spaceKey = this.input.keyboard.addKey('SPACE');
    this.escKey = this.input.keyboard.addKey('ESC');
    this.mKey = this.input.keyboard.addKey('M');

    // Page system state
    this.pages = null;
    this.targetScene = null;
    this.currentPage = -1;
    this.pageReady = false;
    this.typewriterComplete = false;
    this._twTimer = null;
    this._autoAdvanceTimer = null;
    this._currentPageText = null;
    this._pageVisuals = [];
  }

  /**
   * Initialize page-based cinematic.
   * @param {Array} pages - Array of page objects:
   *   { text, color?, size?, y?, charDelay?, setup?, cleanup? }
   *   setup() is called when the page starts (for visual changes)
   *   cleanup() is called when leaving the page
   * @param {string} targetScene - Scene to transition to after last page
   * @param {object} [targetSceneData] - Optional data to pass to target scene
   */
  _initPages(pages, targetScene, targetSceneData) {
    this.pages = pages;
    this.targetScene = targetScene;
    this.targetSceneData = targetSceneData || null;

    // Blinking "► SPACE" / "► TAP" indicator — always visible
    const hintLabel = this.inputManager?.mobile ? '\u25ba TAP' : '\u25ba SPACE';
    this._spaceHint = this.add.text(W / 2, H - 28, hintLabel, {
      fontFamily: 'monospace', fontSize: '14px', color: '#ffcc00',
      shadow: { offsetX: 0, offsetY: 0, color: '#ffcc00', blur: 4, fill: true },
    }).setOrigin(0.5).setDepth(200).setAlpha(0);

    this.tweens.add({
      targets: this._spaceHint,
      alpha: { from: 1, to: 0.3 },
      duration: 500, yoyo: true, repeat: -1,
    });

    // ESC hint (hidden on mobile — pause button serves this purpose)
    if (!this.inputManager?.mobile) {
      this._escHint = this.add.text(W - 16, H - 14, 'ESC TO SKIP', {
        fontFamily: 'monospace', fontSize: '10px', color: '#444444',
      }).setOrigin(1, 1).setDepth(200);
    }

    // Start first page
    this._advancePage();
  }

  /** Advance to next page or end cinematic */
  _advancePage() {
    if (this.skipped) return;

    // Cleanup current page
    if (this.currentPage >= 0 && this.pages[this.currentPage] && this.pages[this.currentPage].cleanup) {
      this.pages[this.currentPage].cleanup();
    }
    if (this._twTimer) { this._twTimer.remove(); this._twTimer = null; }
    if (this._autoAdvanceTimer) { this._autoAdvanceTimer.remove(); this._autoAdvanceTimer = null; }
    if (this._currentPageText) { this._currentPageText.destroy(); this._currentPageText = null; }
    this._clearPageVisuals();

    this.currentPage++;

    if (this.currentPage >= this.pages.length) {
      this._endCinematic();
      return;
    }

    const page = this.pages[this.currentPage];
    this.pageReady = false;
    this.typewriterComplete = false;

    // Run visual setup for this page
    if (page.setup) page.setup();

    // Display text with typewriter effect
    const charDelay = page.charDelay || 25;
    const textY = page.y || (H * 0.45);
    const textSize = page.size || 20;
    const textColor = page.color || '#ffffff';

    this._currentPageText = this.add.text(W / 2, textY, '', {
      fontFamily: 'monospace', fontSize: `${textSize}px`, color: textColor,
      shadow: { offsetX: 0, offsetY: 0, color: textColor, blur: 6, fill: true },
      wordWrap: { width: W - 100 },
      align: 'center',
      ...(page.style || {}),
    });
    this._currentPageText.setOrigin(0.5).setDepth(20);

    // Handle empty text pages (e.g. recap pages, title page)
    if (!page.text || page.text.length === 0) {
      this._currentPageText.setText('');
      this.typewriterComplete = true;
      this.pageReady = true;
      if (this._spaceHint) this._spaceHint.setAlpha(1);
    } else {
      let idx = 0;
      this._twTimer = this.time.addEvent({
        delay: charDelay, repeat: page.text.length - 1,
        callback: () => {
          if (this.skipped) return;
          idx++;
          this._currentPageText.setText(page.text.substring(0, idx));
          SoundManager.get().playTypewriterClick();
          if (idx >= page.text.length) {
            this.typewriterComplete = true;
            this.pageReady = true;
            this._spaceHint.setAlpha(1);
          }
        },
      });
    }

    // Auto-advance support: if the page has autoAdvance, advance after that delay
    if (this._autoAdvanceTimer) { this._autoAdvanceTimer.remove(); this._autoAdvanceTimer = null; }
    if (page.autoAdvance) {
      this._autoAdvanceTimer = this.time.delayedCall(page.autoAdvance, () => {
        if (this.skipped) return;
        this._advancePage();
      });
    }

    // Show space hint immediately (always visible)
    this._spaceHint.setAlpha(1);
  }

  /** Complete typewriter instantly (when pressing SPACE during typing) */
  _completeTypewriter() {
    if (!this._currentPageText || !this.pages[this.currentPage]) return;
    const page = this.pages[this.currentPage];
    if (this._twTimer) { this._twTimer.remove(); this._twTimer = null; }
    this._currentPageText.setText(page.text);
    this.typewriterComplete = true;
    this.pageReady = true;
  }

  /** Handle SPACE/ENTER/ESC/touch input in page mode — call in update() */
  _handlePageInput() {
    if (this.inputManager) this.inputManager.update();
    this._handleMuteToggle();
    if (this.skipped) return;

    // ESC or touch pause → skip entire cinematic
    const escPressed = Phaser.Input.Keyboard.JustDown(this.escKey) ||
      (this.inputManager && this.inputManager.justDown('pause'));
    if (escPressed) {
      this._endCinematic();
      return;
    }

    // SPACE/ENTER or touch primary → advance/complete
    const advancePressed = Phaser.Input.Keyboard.JustDown(this.spaceKey) ||
      Phaser.Input.Keyboard.JustDown(this.enterKey) ||
      (this.inputManager && this.inputManager.justDown('primary'));
    if (advancePressed) {
      if (!this.typewriterComplete) {
        this._completeTypewriter();
      } else if (this.pageReady) {
        this._advancePage();
      }
    }
  }

  /** End cinematic and transition to target scene */
  _endCinematic() {
    if (this.skipped) return;
    this.skipped = true;
    MusicManager.get().stop(0.3);
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.time.delayedCall(350, () => {
      if (this.targetSceneData) {
        this.scene.start(this.targetScene, this.targetSceneData);
      } else {
        this.scene.start(this.targetScene);
      }
    });
  }

  // ── Legacy methods (kept for non-page cinematics like GameIntroScene) ──

  _clearAct() {
    for (const obj of this.actObjects) {
      if (obj && obj.destroy) obj.destroy();
    }
    this.actObjects = [];
  }

  _typewriter(x, y, text, color, size, charDelay, opts = {}) {
    const t = this.add.text(x, y, '', {
      fontFamily: 'monospace', fontSize: `${size}px`, color: color,
      shadow: { offsetX: 0, offsetY: 0, color: color, blur: 6, fill: true },
      wordWrap: { width: W - 100 },
      align: 'center',
      ...opts,
    });
    t.setOrigin(0.5).setDepth(20);
    this.actObjects.push(t);

    let idx = 0;
    const timer = this.time.addEvent({
      delay: charDelay, repeat: text.length - 1,
      callback: () => {
        if (this.skipped) return;
        idx++;
        t.setText(text.substring(0, idx));
        SoundManager.get().playTypewriterClick();
      },
    });
    this.actObjects.push(timer);
    return t;
  }

  _handleMuteToggle() {
    if (Phaser.Input.Keyboard.JustDown(this.mKey)) {
      const muted = SoundManager.get().toggleMute();
      MusicManager.get().setMuted(muted);
    }
  }

  _handleSkip(targetScene) {
    if (this.inputManager) this.inputManager.update();
    this._handleMuteToggle();
    const skipPressed = Phaser.Input.Keyboard.JustDown(this.enterKey) ||
      (this.inputManager && this.inputManager.justDown('primary'));
    if (!this.skipped && skipPressed) {
      const nextAct = this.currentAct + 1;
      const nextMethod = `_startAct${nextAct}`;
      if (typeof this[nextMethod] === 'function') {
        this._clearAct();
        this.cameras.main.resetFX();
        this[nextMethod]();
      } else {
        this.skipped = true;
        MusicManager.get().stop(0.3);
        this.cameras.main.fadeOut(300, 0, 0, 0);
        this.time.delayedCall(350, () => this.scene.start(targetScene));
      }
    }
  }

  _showBeginPrompt(delay = 5000) {
    this.time.delayedCall(delay, () => {
      if (this.skipped) return;
      const beginLabel = this.inputManager?.mobile ? 'TAP TO BEGIN' : 'PRESS ENTER TO BEGIN';
      const prompt = this.add.text(W / 2, H - 50, beginLabel, {
        fontFamily: 'monospace', fontSize: '16px', color: '#ffffff',
      }).setOrigin(0.5).setDepth(20);
      this.actObjects.push(prompt);
      this.tweens.add({ targets: prompt, alpha: 0.3, duration: 600, yoyo: true, repeat: -1 });
    });
  }

  _autoAdvance(delay, targetScene) {
    this.time.delayedCall(delay, () => {
      if (this.skipped) return;
      this.skipped = true;
      MusicManager.get().stop(0.3);
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.time.delayedCall(350, () => this.scene.start(targetScene));
    });
  }

  _transitionToAct2(fadeStart = 4500, act2Start = 5000) {
    this.time.delayedCall(fadeStart, () => {
      if (this.skipped) return;
      this.cameras.main.fadeOut(500, 0, 0, 0);
    });
    this.time.delayedCall(act2Start, () => {
      if (this.skipped) return;
      this._clearAct();
      this.cameras.main.fadeIn(400, 0, 0, 0);
      this._startAct2();
    });
  }

  _transitionToAct3(fadeStart = 3500, act3Start = 4000) {
    this.time.delayedCall(fadeStart, () => {
      if (this.skipped) return;
      this.cameras.main.fadeOut(500, 0, 0, 0);
    });
    this.time.delayedCall(act3Start, () => {
      if (this.skipped) return;
      this._clearAct();
      this.cameras.main.fadeIn(400, 0, 0, 0);
      this._startAct3();
    });
  }

  /** Stop a Web-Audio sound ref of the common { source, osc, stopRumble } shape */
  _stopAmbientRef(ref) {
    if (!ref) return;
    try {
      if (ref.source) ref.source.stop();
      if (ref.osc) ref.osc.stop();
      if (ref.stopRumble) ref.stopRumble();
    } catch (e) { /* already stopped */ }
  }

  /** Scene-exit teardown for every cinematic (registered in _initCinematic) */
  _cinematicShutdown() {
    this.time.removeAllEvents();
    this.tweens.killAll();
    if (this._ambientRef) { this._stopAmbientRef(this._ambientRef); this._ambientRef = null; }
  }

  /** Helper: clear page visuals (objects pushed to _pageVisuals) */
  _clearPageVisuals() {
    // Kill all tweens targeting page visuals BEFORE destroying them
    for (const obj of this._pageVisuals) {
      if (obj) this.tweens.killTweensOf(obj);
    }
    for (const obj of this._pageVisuals) {
      if (obj && obj.destroy) obj.destroy();
    }
    this._pageVisuals = [];
  }

  /** Helper: add a visual object to current page tracking */
  _addPageVisual(obj) {
    this._pageVisuals.push(obj);
    return obj;
  }

  // ══════════════════════════════════════════════════════════════
  // Military terminal HUD helpers (used by all level intro scenes)
  // ══════════════════════════════════════════════════════════════

  /** Dark gradient background + grid lines + scanlines + corner vignette */
  _drawMilitaryBg(scene) {
    const gfx = scene.add.graphics().setDepth(0).setScrollFactor(0);
    // Dark gradient
    for (let y = 0; y < H; y++) {
      const t = y / H;
      gfx.fillStyle(Phaser.Display.Color.GetColor(4 + t * 12 | 0, 6 + t * 14 | 0, 10 + t * 18 | 0));
      gfx.fillRect(0, y, W, 1);
    }
    // Grid lines every 30px
    gfx.lineStyle(1, 0x00ff00, 0.04);
    for (let x = 0; x < W; x += 30) { gfx.lineBetween(x, 0, x, H); }
    for (let y = 0; y < H; y += 30) { gfx.lineBetween(0, y, W, y); }
    // Scanlines
    for (let y = 0; y < H; y += 2) {
      gfx.fillStyle(0x000000, 0.12);
      gfx.fillRect(0, y, W, 1);
    }
    // Corner vignette
    for (const c of [{ x: 0, y: 0 }, { x: W, y: 0 }, { x: 0, y: H }, { x: W, y: H }]) {
      for (let r = 250; r > 40; r -= 20) {
        gfx.fillStyle(0x000000, 0.02);
        gfx.fillCircle(c.x, c.y, r);
      }
    }
  }

  /** Military HUD overlay: title, coords, timestamp, brackets, accent */
  _drawMilitaryHUD(scene, title, coords, accentColor) {
    const color = accentColor || '#00AA44';
    const depth = 50;
    // Operation title
    scene.add.text(W / 2, 24, title, {
      fontFamily: 'monospace', fontSize: '20px', color: color, fontStyle: 'bold',
      shadow: { offsetX: 0, offsetY: 0, color: color, blur: 8, fill: true },
    }).setOrigin(0.5).setDepth(depth);
    // Coordinates
    scene.add.text(W / 2, 48, coords, {
      fontFamily: 'monospace', fontSize: '11px', color: '#555555',
    }).setOrigin(0.5).setDepth(depth);
    // Timestamp
    const now = new Date();
    const ts = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')} UTC`;
    scene.add.text(W - 12, 12, ts, {
      fontFamily: 'monospace', fontSize: '9px', color: '#444444',
    }).setOrigin(1, 0).setDepth(depth);
    // Classification label
    scene.add.text(12, 12, 'TOP SECRET // MOSSAD', {
      fontFamily: 'monospace', fontSize: '9px', color: '#553333',
    }).setDepth(depth);
    // Corner brackets
    const bGfx = scene.add.graphics().setDepth(depth);
    const bLen = 20;
    bGfx.lineStyle(1, Phaser.Display.Color.HexStringToColor(color).color, 0.4);
    // Top-left
    bGfx.lineBetween(8, 8, 8 + bLen, 8);
    bGfx.lineBetween(8, 8, 8, 8 + bLen);
    // Top-right
    bGfx.lineBetween(W - 8, 8, W - 8 - bLen, 8);
    bGfx.lineBetween(W - 8, 8, W - 8, 8 + bLen);
    // Bottom-left
    bGfx.lineBetween(8, H - 8, 8 + bLen, H - 8);
    bGfx.lineBetween(8, H - 8, 8, H - 8 - bLen);
    // Bottom-right
    bGfx.lineBetween(W - 8, H - 8, W - 8 - bLen, H - 8);
    bGfx.lineBetween(W - 8, H - 8, W - 8, H - 8 - bLen);
    // Accent line under title
    bGfx.lineStyle(1, Phaser.Display.Color.HexStringToColor(color).color, 0.3);
    bGfx.lineBetween(W * 0.3, 60, W * 0.7, 60);
  }

  /** Multi-layer pseudo-3D operation title text */
  _draw3DOperationTitle(scene, text, size) {
    const depth = 55;
    const fSize = size || 42;
    const y = H * 0.45;
    // Brown shadow
    scene.add.text(W / 2 + 3, y + 3, text, {
      fontFamily: 'monospace', fontSize: `${fSize}px`, color: '#3a2510', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(depth);
    // Dark gold
    scene.add.text(W / 2 + 1.5, y + 1.5, text, {
      fontFamily: 'monospace', fontSize: `${fSize}px`, color: '#8B6914', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(depth + 1);
    // Main gold
    scene.add.text(W / 2, y, text, {
      fontFamily: 'monospace', fontSize: `${fSize}px`, color: '#FFD700', fontStyle: 'bold',
      shadow: { offsetX: 0, offsetY: 0, color: '#FFD700', blur: 10, fill: true },
    }).setOrigin(0.5).setDepth(depth + 2);
    // Top highlight
    scene.add.text(W / 2 - 0.5, y - 0.5, text, {
      fontFamily: 'monospace', fontSize: `${fSize}px`, color: '#fff0c0', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(depth + 3).setAlpha(0.3);
  }
}
