// ═══════════════════════════════════════════════════════════════
// HUD — HP bars + stealth status (side-scroller)
// ═══════════════════════════════════════════════════════════════

import Phaser from 'phaser';
import DifficultyManager from '../systems/DifficultyManager.js';

const MARGIN = 12;
const HP_BAR_W = 18;
const HP_BAR_H = 10;
const HP_BAR_GAP = 4;

export default class HUD {
  constructor(scene, player) {
    this.scene = scene;
    this.player = player;
    this.detectionCount = 0;

    // HP bars container
    this.hpBars = [];
    for (let i = 0; i < player.maxHp; i++) {
      const bar = scene.add.rectangle(
        MARGIN + i * (HP_BAR_W + HP_BAR_GAP) + HP_BAR_W / 2,
        MARGIN + HP_BAR_H / 2,
        HP_BAR_W, HP_BAR_H, 0x00ff00
      );
      bar.setScrollFactor(0);
      bar.setDepth(100);
      bar.setStrokeStyle(1, 0xffffff, 0.5);
      this.hpBars.push(bar);
    }

    // HP label
    this.hpLabel = scene.add.text(MARGIN, MARGIN + HP_BAR_H + 4, 'HP', {
      fontFamily: 'monospace', fontSize: '10px', color: '#aaaaaa',
    });
    this.hpLabel.setScrollFactor(0);
    this.hpLabel.setDepth(100);

    // Stealth status text
    this.stealthText = scene.add.text(MARGIN, MARGIN + HP_BAR_H + 18, 'UNDETECTED', {
      fontFamily: 'monospace', fontSize: '11px', color: '#00ff00',
    });
    this.stealthText.setScrollFactor(0);
    this.stealthText.setDepth(100);

    // Hard mode indicator
    if (DifficultyManager.get().isHard()) {
      this.hardBadge = scene.add.text(scene.cameras.main.width - MARGIN, MARGIN, 'HARD', {
        fontFamily: 'monospace', fontSize: '12px', color: '#ff4444',
        backgroundColor: '#330000', padding: { x: 4, y: 2 },
        shadow: { offsetX: 0, offsetY: 0, color: '#ff0000', blur: 6, fill: true },
      });
      this.hardBadge.setOrigin(1, 0).setScrollFactor(0).setDepth(100);
    }
  }

  update() {
    const hp = this.player.hp;
    const maxHp = this.player.maxHp;

    for (let i = 0; i < maxHp; i++) {
      if (i < hp) {
        this.hpBars[i].setFillStyle(hp <= 2 ? 0xff4444 : 0x00ff00);
      } else {
        this.hpBars[i].setFillStyle(0x333333);
      }
    }

    // Stealth status
    if (this.detectionCount === 0) {
      this.stealthText.setText('UNDETECTED');
      this.stealthText.setColor('#00ff00');
    } else {
      this.stealthText.setText(`DETECTED: ${this.detectionCount}x`);
      this.stealthText.setColor('#ff4444');
    }
  }
}
