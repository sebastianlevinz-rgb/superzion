// ═══════════════════════════════════════════════════════════════
// BaseCinematicScene — Shared base class for all cinematic scenes
// Provides: _clearAct(), _typewriter(), skip/mute setup, act system
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

    this.skipHint = this.add.text(W - 16, H - 14, 'ENTER TO SKIP', {
      fontFamily: 'monospace', fontSize: '10px', color: '#444444',
    }).setOrigin(1, 1).setDepth(100);

    this.enterKey = this.input.keyboard.addKey('ENTER');
    this.mKey = this.input.keyboard.addKey('M');
  }

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

  /** Standard mute toggle + skip handling for 2-act cinematics */
  _handleMuteToggle() {
    if (Phaser.Input.Keyboard.JustDown(this.mKey)) {
      const muted = SoundManager.get().toggleMute();
      MusicManager.get().setMuted(muted);
    }
  }

  /** Skip Act 1 → Act 2, or skip Act 2 → target scene */
  _handleSkip(targetScene) {
    this._handleMuteToggle();
    if (!this.skipped && this.currentAct === 2 && Phaser.Input.Keyboard.JustDown(this.enterKey)) {
      this.skipped = true;
      MusicManager.get().stop(0.3)
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.time.delayedCall(350, () => this.scene.start(targetScene));
    }
    if (!this.skipped && this.currentAct === 1 && Phaser.Input.Keyboard.JustDown(this.enterKey)) {
      this._clearAct();
      this.cameras.main.resetFX();
      this._startAct2();
    }
  }

  /** Blinking "PRESS ENTER TO BEGIN" prompt */
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

  /** Auto-advance to target scene after delay */
  _autoAdvance(delay, targetScene) {
    this.time.delayedCall(delay, () => {
      if (this.skipped) return;
      this.skipped = true;
      MusicManager.get().stop(0.3)
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.time.delayedCall(350, () => this.scene.start(targetScene));
    });
  }

  /** Standard Act 1 → Act 2 fade transition */
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
}
