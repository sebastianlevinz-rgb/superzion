// =================================================================
// LastStandCinematicScene -- Transition 5→6: Natanz → Final Fortress
// Page-by-page narrative with SPACE/ENTER advancement
// =================================================================

import Phaser from 'phaser';
import BaseCinematicScene, { W, H } from './BaseCinematicScene.js';
import SoundManager from '../systems/SoundManager.js';
import MusicManager from '../systems/MusicManager.js';
import { createSuperZionCinematic } from '../utils/CinematicTextures.js';
import { generateAllParadeTextures } from '../utils/ParadeTextures.js';

export default class LastStandCinematicScene extends BaseCinematicScene {
  constructor() { super('LastStandCinematicScene'); }

  create() {
    MusicManager.get().playCinematicMusic(6);
    createSuperZionCinematic(this);
    generateAllParadeTextures(this);
    this._initCinematic();

    this._initPages([
      {
        text: "Natanz is a crater. The centrifuges are scrap metal. The bomb will never exist.",
        color: '#4488ff', size: 20, y: H * 0.82,
        setup: () => {
          // Mountain exploding
          const bg = this.add.graphics().setDepth(0);
          this._addPageVisual(bg);
          for (let y = 0; y < H; y++) {
            const t = y / H;
            bg.fillStyle(Phaser.Display.Color.GetColor(60 + t * 50 | 0, 20 + t * 20 | 0, 5 + t * 10 | 0));
            bg.fillRect(0, y, W, 1);
          }
          bg.fillStyle(0xff6600, 0.2);
          bg.fillCircle(W / 2, H * 0.4, 100);
          bg.fillStyle(0xffaa00, 0.1);
          bg.fillCircle(W / 2, H * 0.4, 150);
          bg.fillStyle(0x3a2a1a, 1);
          bg.fillRect(0, H - 60, W, 60);
          this.cameras.main.shake(300, 0.02);
          SoundManager.get().playExplosion();
        },
      },
      {
        text: "But one man remains. The one who started all of this.",
        color: '#ffffff', size: 22, y: H * 0.45,
        setup: () => { this._addPageVisual(this.add.rectangle(W / 2, H / 2, W, H, 0x060608).setDepth(0)); },
      },
      {
        text: "Supreme Turban. The puppet master. Every missile, every tunnel, every death \u2014 traces back to him.",
        color: '#ff4444', size: 18, y: H * 0.82,
        setup: () => {
          this._addPageVisual(this.add.rectangle(W / 2, H / 2, W, H, 0x0a0505).setDepth(0));
          if (this.textures.exists('parade_supremeturban')) {
            const boss = this.add.sprite(W / 2, H * 0.38, 'parade_supremeturban').setDepth(10).setScale(1.8).setAlpha(0);
            this._addPageVisual(boss);
            this.tweens.add({ targets: boss, alpha: 1, duration: 600 });
            // Menacing pulse
            this.tweens.add({ targets: boss, alpha: 0.7, duration: 800, yoyo: true, repeat: -1 });
            SoundManager.get().playExplosion();
          }
          this._addPageVisual(this.add.text(W / 2, H * 0.62, 'SUPREME TURBAN', {
            fontFamily: 'monospace', fontSize: '16px', color: '#ff2222',
            shadow: { offsetX: 0, offsetY: 0, color: '#ff0000', blur: 15, fill: true },
          }).setOrigin(0.5).setDepth(11));
        },
      },
      {
        text: "He's in his last fortress. Everything he has left, protecting one man.",
        color: '#cccccc', size: 20, y: H * 0.45,
        setup: () => { this._addPageVisual(this.add.rectangle(W / 2, H / 2, W, H, 0x080808).setDepth(0)); },
      },
      {
        text: "Babylon tried. Rome tried. The Inquisition tried. The Camps tried.",
        color: '#ffffff', size: 20, y: H * 0.45,
        setup: () => { this._addPageVisual(this.add.rectangle(W / 2, H / 2, W, H, 0x060608).setDepth(0)); },
      },
      {
        text: "His turn to fail.",
        color: '#FFD700', size: 28, y: H * 0.82,
        setup: () => {
          this._addPageVisual(this.add.rectangle(W / 2, H / 2, W, H, 0x080a10).setDepth(0));
          if (this.textures.exists('cin_superzion')) {
            const hero = this.add.image(W / 2, H * 0.4, 'cin_superzion').setScale(2.0).setDepth(10).setAlpha(0);
            this._addPageVisual(hero);
            this.tweens.add({ targets: hero, alpha: 1, duration: 800 });
          }
          this._addPageVisual(this.add.text(W / 2, 40, 'OPERATION LAST STAND', {
            fontFamily: 'monospace', fontSize: '20px', color: '#FFD700', fontStyle: 'bold',
            shadow: { offsetX: 0, offsetY: 0, color: '#FFD700', blur: 10, fill: true },
          }).setOrigin(0.5).setDepth(20));
        },
      },
    ], 'FlightRouteScene', { level: 6, nextScene: 'BossScene' });
  }

  update() { this._handlePageInput(); }
}
