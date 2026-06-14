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

    // Status LEDs on HUD border -- blinking green dots
    for (let i = 0; i < 3; i++) {
      const led = this.add.circle(W * 0.1 + i * 15, H - 20, 2, 0x00ff44, 0.6).setDepth(5);
      this.tweens.add({ targets: led, alpha: 0.1, duration: 800, yoyo: true, repeat: -1, delay: i * 500 });
    }

    // Background silhouette: port crane + container stacks
    this._drawBeirutSilhouette();

    // -- Animated horizontal scan line (military terminal aesthetic) --
    const scanLine = this.add.rectangle(W / 2, 0, W, 2, 0x00ff00, 0.06).setDepth(6);
    this.tweens.add({
      targets: scanLine, y: H, duration: 3500, repeat: -1, ease: 'Linear',
    });

    // -- Subtle CRT flicker overlay --
    const crtFlicker = this.add.rectangle(W / 2, H / 2, W, H, 0x00ff00, 0.01).setDepth(6);
    this.tweens.add({
      targets: crtFlicker, alpha: { from: 0.01, to: 0.03 },
      duration: 150, yoyo: true, repeat: -1,
    });

    this._initPages([
      // -- RECAP PAGE: Previously on SuperZion --
      {
        text: '',
        charDelay: 0,
        autoAdvance: 2500,
        setup: () => {
          const bg = this.add.rectangle(W / 2, H / 2, W, H, 0x000000).setDepth(1);
          this._addPageVisual(bg);
          this._addPageVisual(this.add.text(W / 2, 70, 'PREVIOUSLY...', {
            fontFamily: 'monospace', fontSize: '14px', color: '#666666',
          }).setOrigin(0.5).setDepth(2));
          // Boss eliminated
          if (this.textures.exists('parade_foambeard')) {
            const boss = this.add.image(W / 2, H * 0.35, 'parade_foambeard').setScale(1.2).setDepth(2);
            this._addPageVisual(boss);
            const xGfx = this.add.graphics().setDepth(3);
            xGfx.lineStyle(4, 0xff0000, 0.8);
            xGfx.lineBetween(W / 2 - 30, H * 0.35 - 30, W / 2 + 30, H * 0.35 + 30);
            xGfx.lineBetween(W / 2 + 30, H * 0.35 - 30, W / 2 - 30, H * 0.35 + 30);
            this._addPageVisual(xGfx);
          }
          this._addPageVisual(this.add.text(W / 2, H * 0.55, 'ISMAIL HANIYEH', {
            fontFamily: 'monospace', fontSize: '12px', color: '#666666',
          }).setOrigin(0.5).setDepth(2));
          this._addPageVisual(this.add.text(W / 2, H * 0.7, 'Tehran: COMPLETE \u2713', {
            fontFamily: 'monospace', fontSize: '20px', color: '#44ff44',
            shadow: { offsetX: 0, offsetY: 0, color: '#44ff44', blur: 6, fill: true },
          }).setOrigin(0.5).setDepth(2));
        },
      },
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
        text: 'The enemy adapted. New communication networks. Thousands of encrypted beepers.',
        color: '#cccccc', size: 20, y: H * 0.45,
        setup: () => this._darkOverlay(),
      },
      {
        text: 'The beepers are manufactured in Hong Kong. One factory. One shipment. One chance.',
        color: '#00e5ff', size: 18, y: H * 0.45,
        setup: () => {
          this._briefingOverlay();
          // "CLASSIFIED" stamp with scale-bounce reveal
          const stamp = this.add.text(W * 0.72, H * 0.22, 'CLASSIFIED', {
            fontFamily: 'monospace', fontSize: '18px', color: '#ff2222', fontStyle: 'bold',
            shadow: { offsetX: 0, offsetY: 0, color: '#ff0000', blur: 8, fill: true },
          }).setOrigin(0.5).setDepth(5).setAlpha(0).setScale(2.5).setAngle(-12);
          this._addPageVisual(stamp);
          this.tweens.add({
            targets: stamp, alpha: 0.85, scale: 1, duration: 300,
            delay: 400, ease: 'Back.easeOut',
          });
        },
      },
      {
        text: 'Plant the explosives at the source. Then wait for the perfect moment to detonate.',
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
    if (this.textures.exists("cin_beirut_port")) { this._addPageVisual(this.add.image(W / 2, H / 2, "cin_beirut_port").setDepth(0).setAlpha(0.6)); }
    const bg = this.add.rectangle(W / 2, H / 2, W, H, 0x080808).setDepth(1).setAlpha(0.55);
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
