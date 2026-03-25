// ═══════════════════════════════════════════════════════════════
// BaseCinematicScene — Shared base class for all cinematic scenes
// Provides: page-by-page text system, typewriter, skip/mute, ESC
// ═══════════════════════════════════════════════════════════════

import Phaser from 'phaser';
import SoundManager from '../systems/SoundManager.js';
import MusicManager from '../systems/MusicManager.js';

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

    // Blinking "► SPACE" indicator — always visible
    this._spaceHint = this.add.text(W / 2, H - 28, '\u25ba SPACE', {
      fontFamily: 'monospace', fontSize: '14px', color: '#ffcc00',
      shadow: { offsetX: 0, offsetY: 0, color: '#ffcc00', blur: 4, fill: true },
    }).setOrigin(0.5).setDepth(200).setAlpha(0);

    this.tweens.add({
      targets: this._spaceHint,
      alpha: { from: 1, to: 0.3 },
      duration: 500, yoyo: true, repeat: -1,
    });

    // ESC hint
    this._escHint = this.add.text(W - 16, H - 14, 'ESC TO SKIP', {
      fontFamily: 'monospace', fontSize: '10px', color: '#444444',
    }).setOrigin(1, 1).setDepth(200);

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
      // End of cinematic
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

  /** Handle SPACE/ENTER/ESC input in page mode — call in update() */
  _handlePageInput() {
    this._handleMuteToggle();
    if (this.skipped) return;

    // ESC → skip entire cinematic
    if (Phaser.Input.Keyboard.JustDown(this.escKey)) {
      this._endCinematic();
      return;
    }

    // SPACE or ENTER
    if (Phaser.Input.Keyboard.JustDown(this.spaceKey) || Phaser.Input.Keyboard.JustDown(this.enterKey)) {
      if (!this.typewriterComplete) {
        // First press during typewriter → complete text instantly
        this._completeTypewriter();
      } else if (this.pageReady) {
        // Text already complete → advance to next page
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
    this._handleMuteToggle();
    if (!this.skipped && Phaser.Input.Keyboard.JustDown(this.enterKey)) {
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
      const prompt = this.add.text(W / 2, H - 50, 'PRESS ENTER TO BEGIN', {
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

  /** Helper: clear page visuals (objects pushed to _pageVisuals) */
  _clearPageVisuals() {
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
}
