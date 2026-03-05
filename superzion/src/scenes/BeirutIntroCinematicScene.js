// ═══════════════════════════════════════════════════════════════
// BeirutIntroCinematicScene — Transition cinematic after Level 1
// Act 1: Tehran Exploding  →  Act 2: Radar Desk  → BeirutRadarScene
// ═══════════════════════════════════════════════════════════════

import BaseCinematicScene, { W, H } from './BaseCinematicScene.js';
import SoundManager from '../systems/SoundManager.js';
import MusicManager from '../systems/MusicManager.js';
import { createSuperZionCinematic, createRadarDesk } from '../utils/CinematicTextures.js';

export default class BeirutIntroCinematicScene extends BaseCinematicScene {
  constructor() { super('BeirutIntroCinematicScene'); }

  create() {
    MusicManager.get().playCinematicMusic(2);
    createSuperZionCinematic(this);
    createRadarDesk(this);
    this._initCinematic();
    this._startAct1();
  }

  // ═════════════════════════════════════════════════════════════
  // ACT 1 — Tehran Exploding (5s)
  // ═════════════════════════════════════════════════════════════
  _startAct1() {
    this.currentAct = 1;

    const bg = this.add.rectangle(W / 2, H / 2, W, H, 0x080808).setDepth(0);
    this.actObjects.push(bg);

    // Simplified building outlines
    const buildGfx = this.add.graphics().setDepth(2);
    this.actObjects.push(buildGfx);
    buildGfx.fillStyle(0x222222, 1);
    const buildings = [
      { x: 200, w: 60, h: 120 }, { x: 280, w: 45, h: 90 },
      { x: 340, w: 70, h: 150 }, { x: 430, w: 50, h: 100 },
      { x: 500, w: 55, h: 130 }, { x: 570, w: 65, h: 110 },
      { x: 650, w: 50, h: 80 }, { x: 720, w: 60, h: 140 },
    ];
    for (const b of buildings) {
      buildGfx.fillRect(b.x, 400 - b.h, b.w, b.h);
      buildGfx.fillStyle(0x333322, 1);
      for (let wy = 400 - b.h + 8; wy < 395; wy += 12) {
        for (let wx = b.x + 5; wx < b.x + b.w - 5; wx += 10) {
          buildGfx.fillRect(wx, wy, 4, 5);
        }
      }
      buildGfx.fillStyle(0x222222, 1);
    }
    buildGfx.fillStyle(0x1a1a1a, 1);
    buildGfx.fillRect(0, 400, W, 140);

    // Fireball
    this.time.delayedCall(800, () => {
      if (this.skipped) return;
      SoundManager.get().playExplosion();
      const colors = [0xff6600, 0xff4400, 0xff2200, 0xffaa00];
      for (let i = 0; i < 4; i++) {
        const fire = this.add.circle(400, 370, 10 + i * 5, colors[i], 0.7).setDepth(5);
        this.actObjects.push(fire);
        this.tweens.add({ targets: fire, scale: 3 + i * 1.5, alpha: 0, duration: 1200 + i * 200, ease: 'Power2' });
      }
      const flash = this.add.rectangle(W / 2, H / 2, W, H, 0xff8800, 0.4).setDepth(4);
      this.actObjects.push(flash);
      this.tweens.add({ targets: flash, alpha: 0, duration: 600 });
      this.cameras.main.shake(300, 0.01);
    });

    // SuperZion runs left
    this.time.delayedCall(1200, () => {
      if (this.skipped) return;
      const sz = this.add.image(600, 370, 'cin_superzion').setDepth(10);
      this.actObjects.push(sz);
      this.tweens.add({ targets: sz, x: -64, duration: 2000, ease: 'Linear' });
    });

    this.time.delayedCall(500, () => {
      if (this.skipped) return;
      this._typewriter(W / 2, 60, '3 MONTHS LATER', '#FFD700', 30, 70);
    });

    this._transitionToAct2();
  }

  // ═════════════════════════════════════════════════════════════
  // ACT 2 — Radar Desk (6s)
  // ═════════════════════════════════════════════════════════════
  _startAct2() {
    this.currentAct = 2;

    const bg = this.add.rectangle(W / 2, H / 2, W, H, 0x060808).setDepth(0);
    this.actObjects.push(bg);

    const crt = this.add.graphics().setDepth(1);
    this.actObjects.push(crt);
    for (let y = 0; y < H; y += 3) {
      crt.fillStyle(0x00ff00, 0.003 + Math.random() * 0.002);
      crt.fillRect(0, y, W, 1);
    }

    const desk = this.add.image(W / 2, 340, 'cin_radar_desk').setScale(2.5).setDepth(3);
    this.actObjects.push(desk);

    const monGlow = this.add.circle(W / 2 - 50, 290, 40, 0x00ff00, 0.05).setDepth(2);
    this.actObjects.push(monGlow);
    this.tweens.add({ targets: monGlow, alpha: 0.12, duration: 800, yoyo: true, repeat: -1 });

    const monGlow2 = this.add.circle(W / 2 + 55, 290, 40, 0x00ff00, 0.05).setDepth(2);
    this.actObjects.push(monGlow2);
    this.tweens.add({ targets: monGlow2, alpha: 0.10, duration: 900, yoyo: true, repeat: -1 });

    const sz = this.add.image(-64, 380, 'cin_superzion').setScale(1.8).setDepth(10);
    this.actObjects.push(sz);
    this.tweens.add({
      targets: sz, x: W / 2 - 20, duration: 1500, ease: 'Power1',
      onComplete: () => {
        this.tweens.add({ targets: sz, scaleX: 1.3, scaleY: 1.3, y: 400, duration: 400, ease: 'Power2' });
      },
    });

    this.time.delayedCall(2500, () => {
      if (this.skipped) return;
      this._typewriter(W / 2, 100, 'NEW MISSION RECEIVED', '#00e5ff', 22, 40);
    });

    this._showBeginPrompt(4000);
    this._autoAdvance(10000, 'BeirutRadarScene');
  }

  update() { this._handleSkip('BeirutRadarScene'); }
}
