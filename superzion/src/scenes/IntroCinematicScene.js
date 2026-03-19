// =================================================================
// IntroCinematicScene -- Pre-Level 1: Operation Tehran
// Page-by-page narrative with SPACE/ENTER advancement
// =================================================================

import BaseCinematicScene, { W, H } from './BaseCinematicScene.js';
import SoundManager from '../systems/SoundManager.js';
import MusicManager from '../systems/MusicManager.js';
import { createSuperZionCinematic, createTehranPanorama } from '../utils/CinematicTextures.js';

export default class IntroCinematicScene extends BaseCinematicScene {
  constructor() { super('IntroCinematicScene'); }

  create() {
    MusicManager.get().playCinematicMusic(1);
    createSuperZionCinematic(this);
    createTehranPanorama(this);
    this._initCinematic();

    this._initPages([
      {
        text: 'Tehran. The heart of the spider web. From here, they fund every enemy we have.',
        color: '#ffffff', size: 20, y: H * 0.82,
        setup: () => {
          // Tehran panorama
          if (this.textures.exists('cin_tehran')) {
            const bg = this.add.image(W / 2, H / 2, 'cin_tehran').setDepth(0).setAlpha(0);
            this._addPageVisual(bg);
            this.tweens.add({ targets: bg, alpha: 1, duration: 800 });
          } else {
            this._darkCityBg(0x2a1a0a, 0x4a3020);
          }
          const title = this.add.text(W / 2, 40, 'TEHRAN, IRAN', {
            fontFamily: 'monospace', fontSize: '32px', color: '#ffffff', fontStyle: 'bold',
            shadow: { offsetX: 2, offsetY: 2, color: '#000000', blur: 10, fill: true },
          }).setOrigin(0.5).setDepth(20);
          this._addPageVisual(title);
        },
      },
      {
        text: 'Intelligence located a command center inside a military compound.',
        color: '#00e5ff', size: 18, y: H * 0.45,
        setup: () => this._briefingBg(),
      },
      {
        text: 'The man in charge: Foam Beard. A businessman who sells weapons like others sell furniture.',
        color: '#ff8800', size: 18, y: H * 0.82,
        setup: () => {
          this._darkBg();
          // Boss portrait
          if (this.textures.exists('parade_foambeard')) {
            const boss = this.add.sprite(W / 2, H * 0.4, 'parade_foambeard').setDepth(10).setScale(1.5).setAlpha(0);
            this._addPageVisual(boss);
            this.tweens.add({ targets: boss, alpha: 1, duration: 600 });
            SoundManager.get().playExplosion();
          }
          const label = this.add.text(W / 2, H * 0.6, 'FOAM BEARD', {
            fontFamily: 'monospace', fontSize: '14px', color: '#ff4444',
            shadow: { offsetX: 0, offsetY: 0, color: '#ff0000', blur: 10, fill: true },
          }).setOrigin(0.5).setDepth(11);
          this._addPageVisual(label);
        },
      },
      {
        text: 'Get in. Plant the bomb. Get out. No backup. No extraction team.',
        color: '#ff8800', size: 20, y: H * 0.45,
        setup: () => this._briefingBg(),
      },
      {
        text: 'Just you, and 3,000 years of practice at the impossible.',
        color: '#FFD700', size: 22, y: H * 0.82,
        setup: () => {
          // Hero in darkness
          this._darkBg();
          if (this.textures.exists('cin_superzion')) {
            const hero = this.add.image(W / 2, H * 0.45, 'cin_superzion').setScale(1.8).setDepth(10).setAlpha(0);
            this._addPageVisual(hero);
            this.tweens.add({ targets: hero, alpha: 1, duration: 600 });
            this.tweens.add({ targets: hero, scaleY: 1.82, duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
          }
          const opName = this.add.text(W / 2, 40, 'OPERATION TEHRAN', {
            fontFamily: 'monospace', fontSize: '20px', color: '#FFD700', fontStyle: 'bold',
            shadow: { offsetX: 0, offsetY: 0, color: '#FFD700', blur: 10, fill: true },
          }).setOrigin(0.5).setDepth(20);
          this._addPageVisual(opName);
        },
      },
    ], 'GameScene');
  }

  // -- Visual helpers --
  _darkBg() {
    const bg = this.add.rectangle(W / 2, H / 2, W, H, 0x080a10).setDepth(0);
    this._addPageVisual(bg);
    const starsGfx = this.add.graphics().setDepth(1);
    this._addPageVisual(starsGfx);
    for (let i = 0; i < 30; i++) {
      starsGfx.fillStyle(0xffffff, 0.15 + Math.random() * 0.3);
      starsGfx.fillCircle(Math.random() * W, Math.random() * 200, 0.5 + Math.random() * 0.5);
    }
  }

  _briefingBg() {
    const bg = this.add.rectangle(W / 2, H / 2, W, H, 0x080808).setDepth(0);
    this._addPageVisual(bg);
    const crt = this.add.graphics().setDepth(1);
    this._addPageVisual(crt);
    for (let y = 0; y < H; y += 3) {
      crt.fillStyle(0x00ff00, 0.003 + Math.random() * 0.002);
      crt.fillRect(0, y, W, 1);
    }
  }

  _darkCityBg(skyTop, skyBottom) {
    const bg = this.add.graphics().setDepth(0);
    this._addPageVisual(bg);
    for (let y = 0; y < H; y++) {
      const t = y / H;
      const r = ((skyTop >> 16) & 0xff) + t * (((skyBottom >> 16) & 0xff) - ((skyTop >> 16) & 0xff)) | 0;
      const g = ((skyTop >> 8) & 0xff) + t * (((skyBottom >> 8) & 0xff) - ((skyTop >> 8) & 0xff)) | 0;
      const b = (skyTop & 0xff) + t * ((skyBottom & 0xff) - (skyTop & 0xff)) | 0;
      bg.fillStyle(Phaser.Display.Color.GetColor(r, g, b));
      bg.fillRect(0, y, W, 1);
    }
  }

  update() { this._handlePageInput(); }
}
