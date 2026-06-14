// ═══════════════════════════════════════════════════════════════
// BootScene — Brief loading screen before game intro
// ═══════════════════════════════════════════════════════════════

import Phaser from 'phaser';
import SoundManager from '../systems/SoundManager.js';
import { isMobile } from '../systems/InputManager.js';
import { preloadAISprites } from '../utils/AISprites.js';

export default class BootScene extends Phaser.Scene {
  constructor() { super('BootScene'); }

  preload() {
    // Load hand-made AI sprite PNGs so their texture keys exist before any
    // scene's procedural generator runs (those generators skip existing keys).
    preloadAISprites(this);
  }

  create() {
    this.cameras.main.setBackgroundColor('#000000');

    const W = 960;
    const H = 540;
    const mobile = isMobile();

    // Loading text
    const loadText = this.add.text(W / 2, H / 2 - 20, 'LOADING...', {
      fontFamily: 'monospace', fontSize: '24px', color: '#00e5ff',
      shadow: { offsetX: 0, offsetY: 0, color: '#00e5ff', blur: 12, fill: true },
    }).setOrigin(0.5);

    // Subtitle
    this.add.text(W / 2, H / 2 + 20, 'SUPERZION  B4', {
      fontFamily: 'monospace', fontSize: '14px', color: '#666666',
    }).setOrigin(0.5);

    // On mobile, require a tap to unlock audio context before proceeding
    if (mobile) {
      loadText.setText('TAP TO START');
      const tapZone = this.add.zone(W / 2, H / 2, W, H).setInteractive();
      tapZone.once('pointerdown', () => {
        // Unlock Web Audio context
        if (this.sound.context && this.sound.context.state === 'suspended') {
          this.sound.context.resume();
        }
        tapZone.destroy();
        loadText.setText('LOADING...');
        SoundManager.get().playRadarBlip();
        this._startLoad(loadText);
      });
    } else {
      SoundManager.get().playRadarBlip();
      this._startLoad(loadText);
    }
  }

  _startLoad(loadText) {
    // Animated dots
    let dots = 0;
    this.time.addEvent({
      delay: 400,
      repeat: -1,
      callback: () => {
        dots = (dots + 1) % 4;
        loadText.setText('LOADING' + '.'.repeat(dots));
      },
    });

    // Brief delay to show loading screen, then start intro
    this.time.delayedCall(800, () => {
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.time.delayedCall(300, () => this.scene.start('GameIntroScene'));
    });
  }
}
