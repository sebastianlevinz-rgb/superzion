// =================================================================
// DeepStrikeIntroCinematicScene -- Transition 2->3: Beirut -> Mountain
// Military terminal aesthetic with classified intel briefing
// =================================================================

import Phaser from 'phaser';
import BaseCinematicScene, { W, H } from './BaseCinematicScene.js';
import SoundManager from '../systems/SoundManager.js';
import MusicManager from '../systems/MusicManager.js';
import { createSuperZionCinematic } from '../utils/CinematicTextures.js';

export default class DeepStrikeIntroCinematicScene extends BaseCinematicScene {
  constructor() { super('DeepStrikeIntroCinematicScene'); }

  create() {
    MusicManager.get().playCinematicDrone();
    createSuperZionCinematic(this);
    this._initCinematic();

    // Military terminal background
    this._drawMilitaryBg(this);
    // Military HUD overlay (amber for this level)
    this._drawMilitaryHUD(this, 'OPERATION DEEP STRIKE', "33\u00b050'N 35\u00b045'E", '#CCAA00');

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
          // Haniyeh eliminated
          if (this.textures.exists('parade_foambeard')) {
            const boss1 = this.add.image(W / 2 - 60, H * 0.35, 'parade_foambeard').setScale(0.8).setDepth(2);
            this._addPageVisual(boss1);
            const x1 = this.add.graphics().setDepth(3);
            x1.lineStyle(3, 0xff0000, 0.8);
            x1.lineBetween(W / 2 - 80, H * 0.35 - 20, W / 2 - 40, H * 0.35 + 20);
            x1.lineBetween(W / 2 - 40, H * 0.35 - 20, W / 2 - 80, H * 0.35 + 20);
            this._addPageVisual(x1);
          }
          this._addPageVisual(this.add.text(W / 2, H * 0.55, 'Tehran: COMPLETE \u2713', {
            fontFamily: 'monospace', fontSize: '20px', color: '#44ff44',
            shadow: { offsetX: 0, offsetY: 0, color: '#44ff44', blur: 6, fill: true },
          }).setOrigin(0.5).setDepth(2));
          this.time.delayedCall(500, () => { SoundManager.get().playInterceptSuccess(); });
        },
      },
      {
        text: 'The tracker worked. We know where everything was going.',
        color: '#4488ff', size: 20, y: H * 0.82,
        setup: () => {
          if (this.textures.exists('cin_beirut_port')) {
            this._addPageVisual(this.add.image(W / 2, H / 2, 'cin_beirut_port').setDepth(0).setDisplaySize(W, H));
            this._addPageVisual(this.add.rectangle(W / 2, H / 2, W, H, 0x05060f, 0.45).setDepth(0.5));
          } else {
            const bg = this.add.graphics().setDepth(1);
            this._addPageVisual(bg);
            bg.fillStyle(0x000000, 0.7);
            bg.fillRect(0, 0, W, H);
            // Night city lights
            bg.fillStyle(0x334455, 0.6);
            bg.fillRect(100, H - 120, 80, 50);
            bg.fillRect(200, H - 130, 90, 60);
            bg.fillRect(600, H - 125, 85, 55);
            bg.fillStyle(0x2a3a4a, 1);
            bg.fillRect(0, H - 70, W, 70);
          }
        },
      },
      {
        text: 'A fortified bunker in the mountains. The nerve center.',
        color: '#ffffff', size: 20, y: H * 0.45,
        setup: () => {
          if (this.textures.exists('cin_fortress')) {
            this._addPageVisual(this.add.image(W / 2, H / 2, 'cin_fortress').setDepth(0).setDisplaySize(W, H));
            this._addPageVisual(this.add.rectangle(W / 2, H / 2, W, H, 0x05060f, 0.45).setDepth(0.5));
          } else {
            this._darkOverlay();
          }
        },
      },
      {
        text: 'Inside: Hassan Nasrallah. Every rocket that fell on our schools, our hospitals, our homes \u2014 he gave the order.',
        color: '#ff4444', size: 18, y: H * 0.82,
        setup: () => {
          if (this.textures.exists('cin_lebanon_coast')) {
            this._addPageVisual(this.add.image(W / 2, H / 2, 'cin_lebanon_coast').setDisplaySize(W, H).setDepth(0));
          }
          this._addPageVisual(this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.45).setDepth(1));
          if (this.textures.exists('parade_turboturban')) {
            const boss = this.add.sprite(W / 2, H * 0.4, 'parade_turboturban').setDepth(10).setScale(1.5).setAlpha(0);
            this._addPageVisual(boss);
            this.tweens.add({ targets: boss, alpha: 1, duration: 600 });
            SoundManager.get().playExplosion();
          }
          this._addPageVisual(this.add.text(W / 2, H * 0.75, 'HASSAN NASRALLAH', {
            fontFamily: 'monospace', fontSize: '14px', color: '#ff4444',
            shadow: { offsetX: 0, offsetY: 0, color: '#ff0000', blur: 10, fill: true },
          }).setOrigin(0.5).setDepth(11));
        },
      },
      {
        text: 'No ground team can reach that bunker. But 2,000 pounds of precision-guided steel can.',
        color: '#00e5ff', size: 18, y: H * 0.45,
        setup: () => {
          this._briefingOverlay();
          // Animated coordinates appearing character-by-character
          const coordsText = 'TARGET: 33\u00b050\'12"N  35\u00b045\'08"E  ALT: -280m';
          const coordLabel = this.add.text(W / 2, H * 0.22, '', {
            fontFamily: 'monospace', fontSize: '11px', color: '#CCAA00',
            shadow: { offsetX: 0, offsetY: 0, color: '#CCAA00', blur: 4, fill: true },
          }).setOrigin(0.5).setDepth(5);
          this._addPageVisual(coordLabel);
          let ci = 0;
          const coordTimer = this.time.addEvent({
            delay: 40, repeat: coordsText.length - 1,
            callback: () => { ci++; coordLabel.setText(coordsText.substring(0, ci)); },
          });
          this._addPageVisual({ destroy: () => coordTimer.remove() });
        },
      },
      {
        text: "The sunset over the Mediterranean will be beautiful tonight. He won't see the sunrise.",
        color: '#FFD700', size: 20, y: H * 0.82,
        setup: () => {
          if (this.textures.exists('cin_lebanon_coast')) {
            this._addPageVisual(this.add.image(W / 2, H / 2, 'cin_lebanon_coast').setDepth(0).setDisplaySize(W, H));
            this._addPageVisual(this.add.rectangle(W / 2, H / 2, W, H, 0x05060f, 0.45).setDepth(0.5));
          } else {
            this._darkOverlay();
          }
          // Sunset glow
          const glow = this.add.graphics().setDepth(2);
          this._addPageVisual(glow);
          glow.fillStyle(0xffaa00, 0.12);
          glow.fillCircle(W * 0.3, H * 0.35, 60);
          this._ambientRef = SoundManager.get().playJetEngine();
          if (this.textures.exists('cin_superzion')) {
            const hero = this.add.image(W / 2, H * 0.45, 'cin_superzion').setScale(1.6).setDepth(10).setAlpha(0);
            this._addPageVisual(hero);
            this.tweens.add({ targets: hero, alpha: 1, duration: 600 });
          }
          this._draw3DOperationTitle(this, 'OPERATION DEEP STRIKE', 42);
        },
      },
    ], 'FlightRouteScene', { level: 3, nextScene: 'BomberScene' });
  }

  _darkOverlay() {
    const bg = this.add.rectangle(W / 2, H / 2, W, H, 0x080a10).setDepth(1).setAlpha(0.85);
    this._addPageVisual(bg);
  }

  _briefingOverlay() {
    if (this.textures.exists("cin_lebanon_coast")) { this._addPageVisual(this.add.image(W / 2, H / 2, "cin_lebanon_coast").setDepth(0).setAlpha(0.6)); }
    const bg = this.add.rectangle(W / 2, H / 2, W, H, 0x080808).setDepth(1).setAlpha(0.55);
    this._addPageVisual(bg);
    const crt = this.add.graphics().setDepth(2);
    this._addPageVisual(crt);
    for (let y = 0; y < H; y += 3) { crt.fillStyle(0x00ff00, 0.003); crt.fillRect(0, y, W, 1); }
  }

  update() { this._handlePageInput(); }
}
