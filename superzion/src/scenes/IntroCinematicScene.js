// =================================================================
// IntroCinematicScene -- Pre-Level 1: Operation Tehran
// Military terminal aesthetic with classified intel briefing
// =================================================================

import BaseCinematicScene, { W, H } from './BaseCinematicScene.js';
import SoundManager from '../systems/SoundManager.js';
import MusicManager from '../systems/MusicManager.js';
import { createSuperZionCinematic, createTehranPanorama } from '../utils/CinematicTextures.js';

export default class IntroCinematicScene extends BaseCinematicScene {
  constructor() { super('IntroCinematicScene'); }

  create() {
    MusicManager.get().playCinematicDrone();
    createSuperZionCinematic(this);
    createTehranPanorama(this);
    this._initCinematic();

    // Military terminal background (gradient + grid + scanlines + vignette)
    this._drawMilitaryBg(this);
    // Military HUD overlay (border, brackets, labels, timestamp)
    this._drawMilitaryHUD(this, 'THE TEHRAN GUEST ROOM', "35\u00b041'N 51\u00b025'E", '#00AA44');

    // Background silhouette: mosque dome + minaret + mountain ridge
    this._drawTehranSilhouette();

    this._initPages([
      {
        text: 'Tehran. The heart of the spider web. From here, they fund every enemy we have.',
        color: '#ffffff', size: 20, y: H * 0.82,
        setup: () => {
          // Tehran panorama overlay
          if (this.textures.exists('cin_tehran')) {
            const bg = this.add.image(W / 2, H / 2, 'cin_tehran').setDepth(1).setAlpha(0);
            this._addPageVisual(bg);
            this.tweens.add({ targets: bg, alpha: 0.6, duration: 800 });
          }
          const title = this.add.text(W / 2, 60, 'TEHRAN, IRAN', {
            fontFamily: 'monospace', fontSize: '32px', color: '#ffffff', fontStyle: 'bold',
            shadow: { offsetX: 2, offsetY: 2, color: '#000000', blur: 10, fill: true },
          }).setOrigin(0.5).setDepth(20);
          this._addPageVisual(title);
        },
      },
      {
        text: 'Intelligence located a command center inside a military compound.',
        color: '#00e5ff', size: 18, y: H * 0.45,
        setup: () => this._briefingOverlay(),
      },
      {
        text: 'The man in charge: Foam Beard. A businessman who sells weapons like others sell furniture.',
        color: '#ff8800', size: 18, y: H * 0.82,
        setup: () => {
          this._darkOverlay();
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
        setup: () => this._briefingOverlay(),
      },
      {
        text: 'Just you, and 3,000 years of practice at the impossible.',
        color: '#FFD700', size: 22, y: H * 0.82,
        setup: () => {
          this._darkOverlay();
          if (this.textures.exists('cin_superzion')) {
            const hero = this.add.image(W / 2, H * 0.45, 'cin_superzion').setScale(1.8).setDepth(10).setAlpha(0);
            this._addPageVisual(hero);
            this.tweens.add({ targets: hero, alpha: 1, duration: 600 });
            this.tweens.add({ targets: hero, scaleY: 1.82, duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
          }
          this._draw3DOperationTitle(this, 'THE TEHRAN GUEST ROOM', 42);
        },
      },
    ], 'FlightRouteScene', { level: 1, nextScene: 'PlatformerScene' });
  }

  // -- Visual helpers --

  /** Dark semi-transparent overlay for boss/hero pages */
  _darkOverlay() {
    const bg = this.add.rectangle(W / 2, H / 2, W, H, 0x080a10).setDepth(1).setAlpha(0.85);
    this._addPageVisual(bg);
  }

  /** Briefing CRT overlay */
  _briefingOverlay() {
    const bg = this.add.rectangle(W / 2, H / 2, W, H, 0x080808).setDepth(1).setAlpha(0.85);
    this._addPageVisual(bg);
    const crt = this.add.graphics().setDepth(2);
    this._addPageVisual(crt);
    for (let y = 0; y < H; y += 3) {
      crt.fillStyle(0x00ff00, 0.003 + Math.random() * 0.002);
      crt.fillRect(0, y, W, 1);
    }
  }

  /** L1 silhouette: mosque dome + minaret + mountain ridge */
  _drawTehranSilhouette() {
    const gfx = this.add.graphics().setDepth(5).setScrollFactor(0);
    const c = 0x00AA44;
    const a = 0.15;

    // Mountain ridge across bottom
    gfx.fillStyle(c, a);
    gfx.beginPath();
    gfx.moveTo(0, H * 0.75);
    gfx.lineTo(80, H * 0.6);
    gfx.lineTo(180, H * 0.65);
    gfx.lineTo(280, H * 0.5);
    gfx.lineTo(400, H * 0.58);
    gfx.lineTo(520, H * 0.52);
    gfx.lineTo(620, H * 0.6);
    gfx.lineTo(720, H * 0.55);
    gfx.lineTo(850, H * 0.62);
    gfx.lineTo(W, H * 0.7);
    gfx.lineTo(W, H);
    gfx.lineTo(0, H);
    gfx.closePath();
    gfx.fill();

    // Mosque dome (center-right)
    gfx.fillStyle(c, 0.18);
    const domeX = W * 0.65, domeY = H * 0.45;
    gfx.beginPath();
    gfx.arc(domeX, domeY, 35, Math.PI, 0, false);
    gfx.lineTo(domeX + 35, domeY + 25);
    gfx.lineTo(domeX - 35, domeY + 25);
    gfx.closePath();
    gfx.fill();
    // Dome finial
    gfx.fillCircle(domeX, domeY - 35, 3);

    // Minaret (tall thin tower left of dome)
    const minX = W * 0.55, minBaseY = H * 0.52;
    gfx.fillStyle(c, 0.18);
    gfx.fillRect(minX - 3, minBaseY - 80, 6, 80);
    // Minaret cap
    gfx.beginPath();
    gfx.moveTo(minX, minBaseY - 90);
    gfx.lineTo(minX + 6, minBaseY - 80);
    gfx.lineTo(minX - 6, minBaseY - 80);
    gfx.closePath();
    gfx.fill();
    // Minaret balcony
    gfx.fillRect(minX - 7, minBaseY - 55, 14, 3);
  }

  update() { this._handlePageInput(); }
}
