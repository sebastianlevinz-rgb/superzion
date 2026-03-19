// =================================================================
// MountainBreakerIntroCinematicScene -- Transition 4→5: Tunnels → Natanz
// Page-by-page narrative with SPACE/ENTER advancement
// =================================================================

import Phaser from 'phaser';
import BaseCinematicScene, { W, H } from './BaseCinematicScene.js';
import SoundManager from '../systems/SoundManager.js';
import MusicManager from '../systems/MusicManager.js';
import { createSuperZionCinematic } from '../utils/CinematicTextures.js';

export default class MountainBreakerIntroCinematicScene extends BaseCinematicScene {
  constructor() { super('MountainBreakerIntroCinematicScene'); }

  create() {
    MusicManager.get().playCinematicMusic(5);
    createSuperZionCinematic(this);
    this._initCinematic();

    this._initPages([
      {
        text: "The underground empire is finished. The Warden won't give orders again.",
        color: '#4488ff', size: 20, y: H * 0.82,
        setup: () => {
          // Tunnels collapsing
          const bg = this.add.graphics().setDepth(0);
          this._addPageVisual(bg);
          bg.fillStyle(0x0a0a0a, 1);
          bg.fillRect(0, 0, W, H);
          // Collapsed tunnel shapes
          bg.fillStyle(0x3a2a1a, 0.6);
          for (let i = 0; i < 6; i++) {
            bg.fillRect(W * 0.15 + i * 110, H * 0.3 + Math.random() * 30, 80, 15 + Math.random() * 10);
          }
          bg.fillStyle(0x555544, 0.3);
          bg.fillRect(W * 0.1, H * 0.6, W * 0.8, 5);
          this.cameras.main.shake(200, 0.01);
        },
      },
      {
        text: "But the real threat was never the soldiers or the tunnels.",
        color: '#ffffff', size: 22, y: H * 0.45,
        setup: () => { this._addPageVisual(this.add.rectangle(W / 2, H / 2, W, H, 0x060608).setDepth(0)); },
      },
      {
        text: "It's the bomb. 8,000 centrifuges spinning under a mountain. Day and night. Getting closer.",
        color: '#44ff44', size: 18, y: H * 0.82,
        setup: () => {
          // Natanz glow
          const bg = this.add.graphics().setDepth(0);
          this._addPageVisual(bg);
          bg.fillStyle(0x060608, 1);
          bg.fillRect(0, 0, W, H);
          // Mountain
          bg.fillStyle(0x2a3a2a, 0.8);
          bg.fillTriangle(W / 2, 120, W / 2 - 300, H - 60, W / 2 + 300, H - 60);
          // Green glow from inside
          bg.fillStyle(0x22ff22, 0.15);
          bg.fillCircle(W / 2, H * 0.45, 80);
          bg.fillStyle(0x44ff44, 0.08);
          bg.fillCircle(W / 2, H * 0.45, 120);
          // Nuclear symbol
          bg.fillStyle(0x44ff44, 0.3);
          bg.fillCircle(W / 2, H * 0.45, 12);
          bg.lineStyle(3, 0x44ff44, 0.4);
          for (let a = 0; a < 3; a++) {
            const angle = a * (Math.PI * 2 / 3) - Math.PI / 2;
            bg.beginPath();
            bg.arc(W / 2, H * 0.45, 25, angle - 0.4, angle + 0.4, false);
            bg.strokePath();
          }
          bg.fillStyle(0x2a3a2a, 1);
          bg.fillRect(0, H - 60, W, 60);
        },
      },
      {
        text: "If they finish it, nothing else matters. Not the missions. Not the victories. Everything... gone.",
        color: '#ff4444', size: 20, y: H * 0.45,
        setup: () => { this._addPageVisual(this.add.rectangle(W / 2, H / 2, W, H, 0x0a0505).setDepth(0)); },
      },
      {
        text: "They buried it under a mountain because they think nothing can reach it.",
        color: '#cccccc', size: 20, y: H * 0.45,
        setup: () => { this._addPageVisual(this.add.rectangle(W / 2, H / 2, W, H, 0x080808).setDepth(0)); },
      },
      {
        text: "They haven't met the B-2 Spirit.",
        color: '#FFD700', size: 26, y: H * 0.82,
        setup: () => {
          // B-2 hangar
          this._addPageVisual(this.add.rectangle(W / 2, H / 2, W, H, 0x060606).setDepth(0));
          // B-2 silhouette
          const b2 = this.add.graphics().setDepth(10);
          this._addPageVisual(b2);
          const cx = W / 2, cy = H * 0.4;
          b2.fillStyle(0x333344, 1);
          b2.beginPath();
          b2.moveTo(cx, cy - 5);
          b2.lineTo(cx + 120, cy + 10);
          b2.lineTo(cx + 100, cy + 15);
          b2.lineTo(cx, cy + 8);
          b2.lineTo(cx - 100, cy + 15);
          b2.lineTo(cx - 120, cy + 10);
          b2.closePath();
          b2.fill();
          // Spotlight
          b2.fillStyle(0xffffcc, 0.06);
          b2.fillTriangle(cx, 0, cx - 80, cy - 20, cx + 80, cy - 20);
          this._addPageVisual(this.add.text(W / 2, 40, 'OPERATION MOUNTAIN BREAKER', {
            fontFamily: 'monospace', fontSize: '18px', color: '#FFD700', fontStyle: 'bold',
            shadow: { offsetX: 0, offsetY: 0, color: '#FFD700', blur: 10, fill: true },
          }).setOrigin(0.5).setDepth(20));
        },
      },
    ], 'B2BomberScene');
  }

  update() { this._handlePageInput(); }
}
