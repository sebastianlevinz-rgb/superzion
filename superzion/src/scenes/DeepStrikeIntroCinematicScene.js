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

    // Status LEDs on HUD border — blinking green dots
    for (let i = 0; i < 3; i++) {
      const led = this.add.circle(W * 0.1 + i * 15, H - 20, 2, 0x00ff44, 0.6).setDepth(5);
      this.tweens.add({ targets: led, alpha: 0.1, duration: 800, yoyo: true, repeat: -1, delay: i * 500 });
    }

    // Background silhouette: F-15 jet + stars
    this._drawDeepStrikeSilhouette();

    // -- Animated radar sweep (rotating line on subtle radar circle) --
    const radarCx = W * 0.85, radarCy = H * 0.2, radarR = 40;
    const radarBg = this.add.graphics().setDepth(6);
    radarBg.lineStyle(1, 0xCCAA00, 0.08);
    radarBg.strokeCircle(radarCx, radarCy, radarR);
    radarBg.strokeCircle(radarCx, radarCy, radarR * 0.5);
    radarBg.fillStyle(0xCCAA00, 0.03);
    radarBg.fillCircle(radarCx, radarCy, radarR);
    // Crosshair lines
    radarBg.lineStyle(1, 0xCCAA00, 0.05);
    radarBg.lineBetween(radarCx - radarR, radarCy, radarCx + radarR, radarCy);
    radarBg.lineBetween(radarCx, radarCy - radarR, radarCx, radarCy + radarR);

    const sweepLine = this.add.graphics().setDepth(7);
    sweepLine.lineStyle(2, 0xCCAA00, 0.25);
    sweepLine.lineBetween(0, 0, radarR, 0);
    sweepLine.setPosition(radarCx, radarCy);
    this.tweens.add({
      targets: sweepLine, angle: 360, duration: 3000, repeat: -1, ease: 'Linear',
    });

    // -- Blinking status lights at screen edges --
    const edgeLights = [
      { x: W - 20, y: H * 0.3, color: 0xCCAA00 },
      { x: W - 20, y: H * 0.5, color: 0xff4444 },
      { x: W - 20, y: H * 0.7, color: 0xCCAA00 },
      { x: 20, y: H * 0.4, color: 0x44ff44 },
      { x: 20, y: H * 0.6, color: 0xff4444 },
    ];
    for (const el of edgeLights) {
      const dot = this.add.circle(el.x, el.y, 2, el.color, 0.5).setDepth(6);
      this.tweens.add({
        targets: dot, alpha: 0.05, duration: 600 + Math.random() * 800,
        yoyo: true, repeat: -1, delay: Math.random() * 1000,
      });
    }

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
        },
      },
      {
        text: 'A fortified bunker in the mountains. The nerve center.',
        color: '#ffffff', size: 20, y: H * 0.45,
        setup: () => this._darkOverlay(),
      },
      {
        text: 'Inside: Hassan Nasrallah. Every rocket that fell on our schools, our hospitals, our homes \u2014 he gave the order.',
        color: '#ff4444', size: 18, y: H * 0.82,
        setup: () => {
          this._darkOverlay();
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
          this._darkOverlay();
          // Sunset glow
          const glow = this.add.graphics().setDepth(2);
          this._addPageVisual(glow);
          glow.fillStyle(0xffaa00, 0.12);
          glow.fillCircle(W * 0.3, H * 0.35, 60);
          SoundManager.get().playJetEngine();
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
    const bg = this.add.rectangle(W / 2, H / 2, W, H, 0x080808).setDepth(1).setAlpha(0.85);
    this._addPageVisual(bg);
    const crt = this.add.graphics().setDepth(2);
    this._addPageVisual(crt);
    for (let y = 0; y < H; y += 3) { crt.fillStyle(0x00ff00, 0.003); crt.fillRect(0, y, W, 1); }
  }

  /** L3 silhouette: F-15 jet + stars */
  _drawDeepStrikeSilhouette() {
    const gfx = this.add.graphics().setDepth(5).setScrollFactor(0);
    const c = 0xCCAA00;
    const a = 0.17;

    // Stars scattered across the upper area
    gfx.fillStyle(c, 0.12);
    const starPositions = [
      [80, 100], [200, 60], [340, 120], [450, 80], [550, 140],
      [680, 70], [780, 110], [860, 90], [150, 160], [620, 180],
      [380, 50], [720, 160], [50, 140], [900, 130],
    ];
    for (const [sx, sy] of starPositions) {
      gfx.fillCircle(sx, sy, 1 + Math.random() * 1.5);
    }

    // F-15 jet silhouette (center, angled slightly)
    gfx.fillStyle(c, a);
    const jx = W * 0.5, jy = H * 0.42;
    // Fuselage
    gfx.beginPath();
    gfx.moveTo(jx - 80, jy + 5);   // nose
    gfx.lineTo(jx - 40, jy - 3);
    gfx.lineTo(jx + 60, jy - 5);
    gfx.lineTo(jx + 80, jy - 2);   // tail
    gfx.lineTo(jx + 80, jy + 8);
    gfx.lineTo(jx + 60, jy + 10);
    gfx.lineTo(jx - 40, jy + 8);
    gfx.closePath();
    gfx.fill();
    // Wings (swept back)
    gfx.beginPath();
    gfx.moveTo(jx - 10, jy - 3);
    gfx.lineTo(jx + 30, jy - 45);
    gfx.lineTo(jx + 50, jy - 40);
    gfx.lineTo(jx + 20, jy - 3);
    gfx.closePath();
    gfx.fill();
    gfx.beginPath();
    gfx.moveTo(jx - 10, jy + 8);
    gfx.lineTo(jx + 30, jy + 50);
    gfx.lineTo(jx + 50, jy + 45);
    gfx.lineTo(jx + 20, jy + 8);
    gfx.closePath();
    gfx.fill();
    // Twin tail fins
    gfx.beginPath();
    gfx.moveTo(jx + 65, jy - 5);
    gfx.lineTo(jx + 75, jy - 25);
    gfx.lineTo(jx + 82, jy - 22);
    gfx.lineTo(jx + 80, jy - 2);
    gfx.closePath();
    gfx.fill();
    gfx.beginPath();
    gfx.moveTo(jx + 65, jy + 10);
    gfx.lineTo(jx + 75, jy + 30);
    gfx.lineTo(jx + 82, jy + 27);
    gfx.lineTo(jx + 80, jy + 8);
    gfx.closePath();
    gfx.fill();
    // Exhaust glow
    gfx.fillStyle(c, 0.08);
    gfx.fillCircle(jx + 85, jy + 3, 8);
  }

  update() { this._handlePageInput(); }
}
