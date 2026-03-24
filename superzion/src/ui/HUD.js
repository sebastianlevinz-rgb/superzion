// ===================================================================
// Bomberman HUD — Operation Tehran header, hearts, bombs, range, key
// ===================================================================

import DifficultyManager from '../systems/DifficultyManager.js';

const M = 12; // margin

export default class BombermanHUD {
  constructor(scene, player) {
    this.scene = scene;
    this.player = player;

    // Background bar
    this.bar = scene.add.rectangle(480, 30, 960, 60, 0x111111, 0.9);
    this.bar.setScrollFactor(0).setDepth(100);

    // Title
    this.title = scene.add.text(480, 12, 'THE TEHRAN GUEST ROOM', {
      fontFamily: 'monospace', fontSize: '14px', color: '#FFD700',
      shadow: { offsetX: 0, offsetY: 0, color: '#FFD700', blur: 6, fill: true },
    });
    this.title.setOrigin(0.5, 0).setScrollFactor(0).setDepth(101);

    // Hearts
    this.hearts = [];
    for (let i = 0; i < player.maxHp; i++) {
      const h = scene.add.image(M + i * 22 + 10, 44, 'bm_heart');
      h.setScrollFactor(0).setDepth(101);
      this.hearts.push(h);
    }

    // Bomb count
    this.bombIcon = scene.add.image(120, 44, 'bm_bomb').setScale(0.5);
    this.bombIcon.setScrollFactor(0).setDepth(101);
    this.bombText = scene.add.text(135, 38, 'x1', {
      fontFamily: 'monospace', fontSize: '12px', color: '#ffffff',
    });
    this.bombText.setScrollFactor(0).setDepth(101);

    // Range
    this.rangeLabel = scene.add.text(185, 38, 'RNG:2', {
      fontFamily: 'monospace', fontSize: '12px', color: '#ff8800',
    });
    this.rangeLabel.setScrollFactor(0).setDepth(101);

    // Key
    this.keyIcon = scene.add.image(260, 44, 'bm_key_icon');
    this.keyIcon.setScrollFactor(0).setDepth(101);

    // Dodge cooldown indicator
    this.dodgeLabel = scene.add.text(310, 38, 'SHIFT', {
      fontFamily: 'monospace', fontSize: '10px', color: '#00ccff',
    });
    this.dodgeLabel.setScrollFactor(0).setDepth(101);
    this.dodgeBg = scene.add.rectangle(350, 49, 30, 5, 0x222222).setScrollFactor(0).setDepth(101);
    this.dodgeFill = scene.add.rectangle(350, 49, 30, 5, 0x00ccff).setScrollFactor(0).setDepth(102);
    this.dodgeFill.setOrigin(0.5, 0.5);

    // Timer (hidden until escape)
    this.timerText = scene.add.text(900, 30, '', {
      fontFamily: 'monospace', fontSize: '28px', color: '#ff2222',
      shadow: { offsetX: 0, offsetY: 0, color: '#ff0000', blur: 10, fill: true },
    });
    this.timerText.setOrigin(1, 0.5).setScrollFactor(0).setDepth(101);
    this.timerText.setVisible(false);

    // Hard mode badge
    if (DifficultyManager.get().isHard()) {
      this.hardBadge = scene.add.text(948, 44, 'HARD', {
        fontFamily: 'monospace', fontSize: '10px', color: '#ff4444',
        backgroundColor: '#330000', padding: { x: 3, y: 1 },
      });
      this.hardBadge.setOrigin(1, 0.5).setScrollFactor(0).setDepth(101);
    }

    // Stats tracking
    this.guardsKilled = 0;
    this.powerupsCollected = 0;
  }

  update() {
    const p = this.player;

    // Hearts
    for (let i = 0; i < this.hearts.length; i++) {
      this.hearts[i].setTexture(i < p.hp ? 'bm_heart' : 'bm_heart_empty');
    }

    // Bomb count
    this.bombText.setText(`x${p.maxBombs}`);

    // Range
    this.rangeLabel.setText(`RNG:${p.bombRange}`);

    // Key icon
    this.keyIcon.setTexture(p.hasKey ? 'bm_key_active' : 'bm_key_icon');

    // Dodge cooldown
    const dodgePct = p.dodgeCooldownPct || 0;
    const ready = dodgePct <= 0;
    this.dodgeFill.setScale(ready ? 1 : (1 - dodgePct), 1);
    this.dodgeFill.setFillStyle(ready ? 0x00ccff : 0x555555);
    this.dodgeLabel.setColor(ready ? '#00ccff' : '#555555');
  }

  showTimer(seconds) {
    this.timerText.setVisible(true);
    this.timerText.setText(seconds.toString());
  }

  updateTimer(seconds) {
    this.timerText.setText(seconds.toString());
    if (seconds <= 5) {
      this.timerText.setFontSize('36px');
      this.timerText.setColor('#ff0000');
    }
  }

  hideTimer() {
    this.timerText.setVisible(false);
  }
}
