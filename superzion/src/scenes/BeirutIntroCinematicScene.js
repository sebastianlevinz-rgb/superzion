// =================================================================
// BeirutIntroCinematicScene -- Transition 1→2: Tehran done → Beirut
// Page-by-page narrative with SPACE/ENTER advancement
// =================================================================

import Phaser from 'phaser';
import BaseCinematicScene, { W, H } from './BaseCinematicScene.js';
import SoundManager from '../systems/SoundManager.js';
import MusicManager from '../systems/MusicManager.js';
import { createSuperZionCinematic, createBeirutPortPanorama } from '../utils/CinematicTextures.js';

export default class BeirutIntroCinematicScene extends BaseCinematicScene {
  constructor() { super('BeirutIntroCinematicScene'); }

  create() {
    MusicManager.get().playCinematicMusic(2);
    createSuperZionCinematic(this);
    createBeirutPortPanorama(this);
    this._initCinematic();

    this._initPages([
      {
        text: 'Tehran: done. But cutting one head means nothing if the body keeps moving.',
        color: '#ff6644', size: 20, y: H * 0.82,
        setup: () => {
          // Tehran exploding background
          const bg = this.add.graphics().setDepth(0);
          this._addPageVisual(bg);
          for (let y = 0; y < H; y++) {
            const t = y / H;
            bg.fillStyle(Phaser.Display.Color.GetColor(40 + t * 60 | 0, 8 + t * 15 | 0, 2 + t * 5 | 0));
            bg.fillRect(0, y, W, 1);
          }
          // Fire and smoke
          for (let i = 0; i < 8; i++) {
            bg.fillStyle(0xff4400, 0.1);
            bg.fillCircle(Math.random() * W, H * 0.3 + Math.random() * H * 0.4, 30 + Math.random() * 50);
          }
          this.cameras.main.shake(200, 0.01);
          SoundManager.get().playExplosion();
        },
      },
      {
        text: 'The enemy adapted. New communication networks. New supply routes.',
        color: '#cccccc', size: 20, y: H * 0.45,
        setup: () => this._darkBg(),
      },
      {
        text: 'A weapons shipment is arriving at the Port of Beirut. Hidden in cargo containers.',
        color: '#00e5ff', size: 18, y: H * 0.45,
        setup: () => this._briefingBg(),
      },
      {
        text: 'If those weapons reach their destination, our cities burn.',
        color: '#ff4444', size: 22, y: H * 0.45,
      },
      {
        text: 'Time to become invisible.',
        color: '#FFD700', size: 24, y: H * 0.82,
        setup: () => {
          this._darkBg();
          // SuperZion in disguise
          if (this.textures.exists('cin_superzion')) {
            const hero = this.add.image(W / 2, H * 0.45, 'cin_superzion').setScale(1.6).setDepth(10).setAlpha(0);
            this._addPageVisual(hero);
            this.tweens.add({ targets: hero, alpha: 1, duration: 600 });
          }
          const opName = this.add.text(W / 2, 40, 'OPERATION SIGNAL STORM', {
            fontFamily: 'monospace', fontSize: '20px', color: '#FFD700', fontStyle: 'bold',
            shadow: { offsetX: 0, offsetY: 0, color: '#FFD700', blur: 10, fill: true },
          }).setOrigin(0.5).setDepth(20);
          this._addPageVisual(opName);
        },
      },
    ], 'BeirutRadarScene');
  }

  _darkBg() {
    const bg = this.add.rectangle(W / 2, H / 2, W, H, 0x080a10).setDepth(0);
    this._addPageVisual(bg);
  }

  _briefingBg() {
    const bg = this.add.rectangle(W / 2, H / 2, W, H, 0x080808).setDepth(0);
    this._addPageVisual(bg);
    const crt = this.add.graphics().setDepth(1);
    this._addPageVisual(crt);
    for (let y = 0; y < H; y += 3) {
      crt.fillStyle(0x00ff00, 0.003);
      crt.fillRect(0, y, W, 1);
    }
  }

  update() { this._handlePageInput(); }
}
