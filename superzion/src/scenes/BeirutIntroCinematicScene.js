// =================================================================
// BeirutIntroCinematicScene -- Transition 1->2: Tehran done -> Beirut
// Military terminal aesthetic with classified intel briefing
// =================================================================

import Phaser from 'phaser';
import BaseCinematicScene, { W, H } from './BaseCinematicScene.js';
import SoundManager from '../systems/SoundManager.js';
import MusicManager from '../systems/MusicManager.js';
import { createSuperZionCinematic, createBeirutPortPanorama } from '../utils/CinematicTextures.js';

export default class BeirutIntroCinematicScene extends BaseCinematicScene {
  constructor() { super('BeirutIntroCinematicScene'); }

  create() {
    MusicManager.get().playCinematicDrone();
    createSuperZionCinematic(this);
    createBeirutPortPanorama(this);
    this._initCinematic();

    // Military terminal background
    this._drawMilitaryBg(this);
    // Military HUD overlay
    this._drawMilitaryHUD(this, 'OPERATION GRIM BEEPER', "33\u00b053'N 35\u00b030'E", '#00AA44');

    // Background silhouette: port crane + container stacks
    this._drawBeirutSilhouette();

    this._initPages([
      {
        text: 'Tehran: done. But cutting one head means nothing if the body keeps moving.',
        color: '#ff6644', size: 20, y: H * 0.82,
        setup: () => {
          // Tehran exploding overlay
          const bg = this.add.graphics().setDepth(1);
          this._addPageVisual(bg);
          bg.fillStyle(0x000000, 0.7);
          bg.fillRect(0, 0, W, H);
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
        setup: () => this._darkOverlay(),
      },
      {
        text: 'A Beeper shipment is arriving at the Port of Beirut. Hidden in cargo containers.',
        color: '#00e5ff', size: 18, y: H * 0.45,
        setup: () => this._briefingOverlay(),
      },
      {
        text: 'Time to become invisible.',
        color: '#FFD700', size: 24, y: H * 0.82,
        setup: () => {
          this._darkOverlay();
          if (this.textures.exists('cin_superzion')) {
            const hero = this.add.image(W / 2, H * 0.45, 'cin_superzion').setScale(1.6).setDepth(10).setAlpha(0);
            this._addPageVisual(hero);
            this.tweens.add({ targets: hero, alpha: 1, duration: 600 });
          }
          this._draw3DOperationTitle(this, 'OPERATION GRIM BEEPER', 42);
        },
      },
    ], 'FlightRouteScene', { level: 2, nextScene: 'BeirutRadarScene' });
  }

  _darkOverlay() {
    const bg = this.add.rectangle(W / 2, H / 2, W, H, 0x080a10).setDepth(1).setAlpha(0.85);
    this._addPageVisual(bg);
  }

  _briefingOverlay() {
    const bg = this.add.rectangle(W / 2, H / 2, W, H, 0x080808).setDepth(1).setAlpha(0.85);
    this._addPageVisual(bg);
    const crt = this.add.graphics().setDepth(2);
    this._addPageVisual(crt);
    for (let y = 0; y < H; y += 3) {
      crt.fillStyle(0x00ff00, 0.003);
      crt.fillRect(0, y, W, 1);
    }
  }

  /** L2 silhouette: port crane + container stacks */
  _drawBeirutSilhouette() {
    const gfx = this.add.graphics().setDepth(5).setScrollFactor(0);
    const c = 0x00AA44;
    const a = 0.15;

    // Port crane #1 (left)
    gfx.fillStyle(c, a);
    const cx1 = W * 0.25, cBase = H * 0.72;
    // Vertical mast
    gfx.fillRect(cx1 - 3, cBase - 130, 6, 130);
    // Boom (horizontal arm)
    gfx.fillRect(cx1 - 60, cBase - 130, 120, 5);
    // Cable lines
    gfx.lineStyle(1, c, a * 1.2);
    gfx.lineBetween(cx1, cBase - 130, cx1 - 50, cBase - 90);
    gfx.lineBetween(cx1, cBase - 130, cx1 + 50, cBase - 90);
    // Hook
    gfx.lineBetween(cx1 + 40, cBase - 125, cx1 + 40, cBase - 90);

    // Port crane #2 (right)
    const cx2 = W * 0.72;
    gfx.fillStyle(c, a);
    gfx.fillRect(cx2 - 3, cBase - 120, 6, 120);
    gfx.fillRect(cx2 - 55, cBase - 120, 110, 5);
    gfx.lineStyle(1, c, a * 1.2);
    gfx.lineBetween(cx2, cBase - 120, cx2 - 45, cBase - 85);
    gfx.lineBetween(cx2, cBase - 120, cx2 + 45, cBase - 85);

    // Container stacks
    gfx.fillStyle(c, 0.18);
    // Stack 1
    gfx.fillRect(W * 0.35, cBase - 25, 50, 12);
    gfx.fillRect(W * 0.36, cBase - 37, 48, 12);
    gfx.fillRect(W * 0.37, cBase - 49, 46, 12);
    // Stack 2
    gfx.fillRect(W * 0.5, cBase - 20, 55, 12);
    gfx.fillRect(W * 0.51, cBase - 32, 53, 12);
    // Stack 3
    gfx.fillRect(W * 0.82, cBase - 30, 45, 12);
    gfx.fillRect(W * 0.83, cBase - 42, 43, 12);
    gfx.fillRect(W * 0.84, cBase - 54, 41, 12);
    gfx.fillRect(W * 0.85, cBase - 66, 39, 12);

    // Water line at base
    gfx.lineStyle(1, c, a * 0.8);
    gfx.lineBetween(0, cBase + 5, W, cBase + 5);
  }

  update() { this._handlePageInput(); }
}
