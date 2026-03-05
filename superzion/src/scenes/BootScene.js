// ═══════════════════════════════════════════════════════════════
// BootScene — Brief loading screen before game intro
// ═══════════════════════════════════════════════════════════════

import Phaser from 'phaser';

export default class BootScene extends Phaser.Scene {
  constructor() { super('BootScene'); }

  create() {
    this.cameras.main.setBackgroundColor('#000000');

    const W = 960;
    const H = 540;

    // Loading text
    const loadText = this.add.text(W / 2, H / 2 - 20, 'LOADING...', {
      fontFamily: 'monospace', fontSize: '24px', color: '#00e5ff',
      shadow: { offsetX: 0, offsetY: 0, color: '#00e5ff', blur: 12, fill: true },
    }).setOrigin(0.5);

    // Subtitle
    this.add.text(W / 2, H / 2 + 20, 'SUPERZION', {
      fontFamily: 'monospace', fontSize: '14px', color: '#666666',
    }).setOrigin(0.5);

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
