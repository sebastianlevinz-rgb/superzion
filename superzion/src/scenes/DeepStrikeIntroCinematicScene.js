// =================================================================
// DeepStrikeIntroCinematicScene -- Transition 2→3: Beirut → Mountain
// Page-by-page narrative with SPACE/ENTER advancement
// =================================================================

import Phaser from 'phaser';
import BaseCinematicScene, { W, H } from './BaseCinematicScene.js';
import SoundManager from '../systems/SoundManager.js';
import MusicManager from '../systems/MusicManager.js';
import { createSuperZionCinematic } from '../utils/CinematicTextures.js';

export default class DeepStrikeIntroCinematicScene extends BaseCinematicScene {
  constructor() { super('DeepStrikeIntroCinematicScene'); }

  create() {
    MusicManager.get().playCinematicMusic(3);
    createSuperZionCinematic(this);
    this._initCinematic();

    this._initPages([
      {
        text: 'The tracker worked. We know where everything was going.',
        color: '#4488ff', size: 20, y: H * 0.82,
        setup: () => {
          const bg = this.add.graphics().setDepth(0);
          this._addPageVisual(bg);
          for (let y = 0; y < H; y++) {
            const t = y / H;
            bg.fillStyle(Phaser.Display.Color.GetColor(10 + t * 30 | 0, 15 + t * 40 | 0, 30 + t * 60 | 0));
            bg.fillRect(0, y, W, 1);
          }
          bg.fillStyle(0x334455, 0.6);
          bg.fillRect(100, H - 120, 80, 50);
          bg.fillRect(200, H - 130, 90, 60);
          bg.fillRect(600, H - 125, 85, 55);
          bg.fillStyle(0x2a3a4a, 1);
          bg.fillRect(0, H - 70, W, 70);
        },
      },
      {
        text: 'A fortified bunker in the mountains. The nerve center.',
        color: '#ffffff', size: 20, y: H * 0.45,
        setup: () => { this._addPageVisual(this.add.rectangle(W / 2, H / 2, W, H, 0x080a10).setDepth(0)); },
      },
      {
        text: 'Inside: Turbo Turban. Every rocket that fell on our schools, our hospitals, our homes \u2014 he gave the order.',
        color: '#ff4444', size: 18, y: H * 0.82,
        setup: () => {
          this._addPageVisual(this.add.rectangle(W / 2, H / 2, W, H, 0x0a0808).setDepth(0));
          if (this.textures.exists('parade_turboturban')) {
            const boss = this.add.sprite(W / 2, H * 0.4, 'parade_turboturban').setDepth(10).setScale(1.5).setAlpha(0);
            this._addPageVisual(boss);
            this.tweens.add({ targets: boss, alpha: 1, duration: 600 });
            SoundManager.get().playExplosion();
          }
          this._addPageVisual(this.add.text(W / 2, H * 0.6, 'TURBO TURBAN', {
            fontFamily: 'monospace', fontSize: '14px', color: '#ff4444',
            shadow: { offsetX: 0, offsetY: 0, color: '#ff0000', blur: 10, fill: true },
          }).setOrigin(0.5).setDepth(11));
        },
      },
      {
        text: 'No ground team can reach that bunker. But 2,000 pounds of precision-guided steel can.',
        color: '#00e5ff', size: 18, y: H * 0.45,
        setup: () => {
          this._addPageVisual(this.add.rectangle(W / 2, H / 2, W, H, 0x080808).setDepth(0));
          const crt = this.add.graphics().setDepth(1);
          this._addPageVisual(crt);
          for (let y = 0; y < H; y += 3) { crt.fillStyle(0x00ff00, 0.003); crt.fillRect(0, y, W, 1); }
        },
      },
      {
        text: "The sunset over the Mediterranean will be beautiful tonight. He won't see the sunrise.",
        color: '#FFD700', size: 20, y: H * 0.82,
        setup: () => {
          const bg = this.add.graphics().setDepth(0);
          this._addPageVisual(bg);
          for (let y = 0; y < H; y++) {
            const t = y / H;
            bg.fillStyle(Phaser.Display.Color.GetColor(80 + t * 60 | 0, 30 + t * 50 | 0, 20 + t * 20 | 0));
            bg.fillRect(0, y, W, 1);
          }
          bg.fillStyle(0xffaa00, 0.3); bg.fillCircle(W * 0.3, H * 0.35, 40);
          if (this.textures.exists('cin_superzion')) {
            const hero = this.add.image(W / 2, H * 0.45, 'cin_superzion').setScale(1.6).setDepth(10).setAlpha(0);
            this._addPageVisual(hero);
            this.tweens.add({ targets: hero, alpha: 1, duration: 600 });
          }
          this._addPageVisual(this.add.text(W / 2, 40, 'OPERATION DEEP STRIKE', {
            fontFamily: 'monospace', fontSize: '20px', color: '#FFD700', fontStyle: 'bold',
            shadow: { offsetX: 0, offsetY: 0, color: '#FFD700', blur: 10, fill: true },
          }).setOrigin(0.5).setDepth(20));
        },
      },
    ], 'BomberScene');
  }

  update() { this._handlePageInput(); }
}
