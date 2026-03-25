// =================================================================
// LastStandCinematicScene -- Transition 5->6: Natanz -> Final Fortress
// Military terminal aesthetic with classified intel briefing
// Dark war atmosphere with dramatic villain reveal
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
    MusicManager.get().playVillainMusic();
    createSuperZionCinematic(this);
    generateAllParadeTextures(this);
    this._initCinematic();

    // Military terminal background
    this._drawMilitaryBg(this);
    // Military HUD overlay (amber for final level)
    this._drawMilitaryHUD(this, 'OPERATION ENDGAME: DEATH TO THE REGIME', "32\u00b005'N 52\u00b000'E", '#CCAA00');

    // Background silhouette: Ayatollah Ali Khamenei threatening figure + lightning
    this._drawLastStandSilhouette();

    this._initPages([
      // -- RECAP PAGE: Previously on SuperZion --
      {
        text: '',
        charDelay: 0,
        autoAdvance: 3000,
        setup: () => {
          const bg = this.add.rectangle(W / 2, H / 2, W, H, 0x000000).setDepth(1);
          this._addPageVisual(bg);
          this._addPageVisual(this.add.text(W / 2, 50, 'PREVIOUSLY...', {
            fontFamily: 'monospace', fontSize: '14px', color: '#666666',
          }).setOrigin(0.5).setDepth(2));
          const bossData = [
            { key: 'parade_foambeard', name: 'Haniyeh \u2713', x: W * 0.2 },
            { key: 'parade_turboturban', name: 'Nasrallah \u2713', x: W * 0.4 },
            { key: 'parade_angryeyebrows', name: 'Sinwar \u2713', x: W * 0.6 },
          ];
          for (const bd of bossData) {
            if (this.textures.exists(bd.key)) {
              const boss = this.add.image(bd.x, H * 0.28, bd.key).setScale(0.55).setDepth(2).setTint(0x666666);
              this._addPageVisual(boss);
              const xg = this.add.graphics().setDepth(3);
              xg.lineStyle(3, 0xff0000, 0.8);
              xg.lineBetween(bd.x - 15, H * 0.28 - 15, bd.x + 15, H * 0.28 + 15);
              xg.lineBetween(bd.x + 15, H * 0.28 - 15, bd.x - 15, H * 0.28 + 15);
              this._addPageVisual(xg);
            }
            this._addPageVisual(this.add.text(bd.x, H * 0.39, bd.name, {
              fontFamily: 'monospace', fontSize: '10px', color: '#44ff44',
            }).setOrigin(0.5).setDepth(2));
          }
          // Nuclear facility destroyed
          this._addPageVisual(this.add.text(W * 0.8, H * 0.28, '\u2622', {
            fontFamily: 'monospace', fontSize: '28px', color: '#44ff44',
          }).setOrigin(0.5).setDepth(2));
          const xNuke = this.add.graphics().setDepth(3);
          xNuke.lineStyle(3, 0xff0000, 0.8);
          xNuke.lineBetween(W * 0.8 - 15, H * 0.28 - 15, W * 0.8 + 15, H * 0.28 + 15);
          xNuke.lineBetween(W * 0.8 + 15, H * 0.28 - 15, W * 0.8 - 15, H * 0.28 + 15);
          this._addPageVisual(xNuke);
          this._addPageVisual(this.add.text(W * 0.8, H * 0.39, 'Fordow \u2713', {
            fontFamily: 'monospace', fontSize: '10px', color: '#44ff44',
          }).setOrigin(0.5).setDepth(2));
          this._addPageVisual(this.add.text(W / 2, H * 0.58, 'Mountain Breaker: COMPLETE \u2713', {
            fontFamily: 'monospace', fontSize: '20px', color: '#44ff44',
            shadow: { offsetX: 0, offsetY: 0, color: '#44ff44', blur: 6, fill: true },
          }).setOrigin(0.5).setDepth(2));
          // Final tease
          const tease = this.add.text(W / 2, H * 0.78, 'ONE TARGET REMAINS...', {
            fontFamily: 'monospace', fontSize: '18px', color: '#ff2222',
            shadow: { offsetX: 0, offsetY: 0, color: '#ff0000', blur: 10, fill: true },
          }).setOrigin(0.5).setDepth(2).setAlpha(0);
          this._addPageVisual(tease);
          this.tweens.add({ targets: tease, alpha: 1, duration: 800, delay: 800 });
        },
      },
      // -- PAGE 1: Natanz crater with fire/smoke aftermath --
      {
        text: "Fordow is a crater. The centrifuges are scrap metal. The bomb will never exist.",
        color: '#ff8844', size: 20, y: H * 0.82,
        setup: () => {
          const bg = this.add.graphics().setDepth(1);
          this._addPageVisual(bg);
          bg.fillStyle(0x000000, 0.75);
          bg.fillRect(0, 0, W, H);
          // Explosion aftermath glow
          bg.fillStyle(0xff6600, 0.25);
          bg.fillCircle(W / 2, H * 0.4, 120);
          bg.fillStyle(0xffaa00, 0.12);
          bg.fillCircle(W / 2, H * 0.4, 180);
          bg.fillStyle(0xff3300, 0.08);
          bg.fillCircle(W / 2, H * 0.35, 200);
          // Dark scorched ground
          bg.fillStyle(0x1a0a05, 1);
          bg.fillRect(0, H - 70, W, 70);
          // Smoke plumes
          for (const sx of [W * 0.35, W * 0.5, W * 0.65]) {
            bg.fillStyle(0x2a1a10, 0.4);
            bg.fillCircle(sx, H * 0.3, 30);
            bg.fillCircle(sx - 10, H * 0.22, 40);
            bg.fillCircle(sx + 5, H * 0.15, 50);
          }
          // Flickering fire glow
          const fireGlow = this.add.circle(W / 2, H * 0.4, 90, 0xff6600, 0.15).setDepth(2);
          this._addPageVisual(fireGlow);
          this.tweens.add({
            targets: fireGlow,
            alpha: { from: 0.15, to: 0.05 },
            scaleX: { from: 1, to: 1.1 },
            scaleY: { from: 1, to: 1.1 },
            duration: 400, yoyo: true, repeat: -1,
          });
          this.cameras.main.shake(300, 0.02);
          SoundManager.get().playExplosion();
        },
      },
      // -- PAGE 2: Darkness -- one man remains --
      {
        text: "But one man remains. The one who started all of this.",
        color: '#ffffff', size: 22, y: H * 0.45,
        setup: () => {
          const bg = this.add.graphics().setDepth(1);
          this._addPageVisual(bg);
          bg.fillStyle(0x000000, 0.85);
          bg.fillRect(0, 0, W, H);
        },
      },
      // -- PAGE 3: Ayatollah Ali Khamenei reveal with full war background --
      {
        text: "Ayatollah Ali Khamenei. The puppet master. Every missile, every tunnel, every death \u2014 traces back to him.",
        color: '#ff4444', size: 18, y: H * 0.82,
        setup: () => {
          const bg = this.add.graphics().setDepth(1);
          this._addPageVisual(bg);

          // a. BLOOD SKY overlay
          bg.fillStyle(0x000000, 0.6);
          bg.fillRect(0, 0, W, H);
          for (let y = 0; y < H * 0.55; y++) {
            const t = y / (H * 0.55);
            const r = 26 + t * 32 | 0;
            const g = 5 + t * 16 | 0;
            const b = 5 + t * 2 | 0;
            bg.fillStyle(Phaser.Display.Color.GetColor(r, g, b), 0.5);
            bg.fillRect(0, y, W, 1);
          }
          bg.fillStyle(0x3a1505, 0.3);
          bg.fillRect(0, H * 0.5, W, H * 0.1);
          bg.fillStyle(0x1a0a05, 0.8);
          bg.fillRect(0, H * 0.6, W, H * 0.4);

          // Fire columns
          const fireXPositions = [80, 180, 300, 420, 560, 680, 780, 880];
          for (const fx of fireXPositions) {
            const fh = 20 + Math.abs(Math.sin(fx * 0.01)) * 25;
            const fy = H * 0.55;
            bg.fillStyle(0xff6400, 0.6);
            bg.fillEllipse(fx, fy - fh / 2, 12, fh);
            bg.fillStyle(0xffaa00, 0.4);
            bg.fillEllipse(fx, fy - fh / 2 - 5, 8, fh * 0.7);
          }

          // Army silhouettes
          const soldierPositions = [60, 130, 210, 310, 400, 510, 590, 650, 740, 830, 900];
          for (let i = 0; i < soldierPositions.length; i++) {
            const sx = soldierPositions[i];
            const scale = (i % 3 === 0) ? 1.4 : (i % 3 === 1) ? 1.0 : 0.7;
            const sy = H * 0.65 + (1 - scale) * 20;
            bg.fillStyle(0x0a0505, 1);
            bg.fillRect(sx - 2 * scale, sy - 10 * scale, 4 * scale, 10 * scale);
            bg.fillCircle(sx, sy - 12 * scale, 2 * scale);
            bg.lineStyle(1, 0x0a0505, 1);
            bg.beginPath();
            bg.moveTo(sx + 2 * scale, sy - 8 * scale);
            bg.lineTo(sx + 8 * scale, sy - 14 * scale);
            bg.strokePath();
          }

          // Missile trucks
          const truckPositions = [220, 550, 770];
          for (const tx of truckPositions) {
            const ty = H * 0.62;
            bg.fillStyle(0x0a0808, 1);
            bg.fillRect(tx - 15, ty - 6, 30, 12);
            bg.fillCircle(tx - 10, ty + 6, 4);
            bg.fillCircle(tx + 10, ty + 6, 4);
            bg.lineStyle(3, 0x0a0808, 1);
            bg.beginPath();
            bg.moveTo(tx - 5, ty - 6);
            bg.lineTo(tx + 15, ty - 22);
            bg.strokePath();
          }

          // Animated fire columns
          for (let fi = 0; fi < fireXPositions.length; fi++) {
            const fx = fireXPositions[fi];
            const fh = 20 + Math.abs(Math.sin(fx * 0.01)) * 25;
            const fy = H * 0.55;
            const fireOuter = this.add.ellipse(fx, fy - fh / 2, 14, fh + 4, 0xff6400, 0.5).setDepth(3);
            this._addPageVisual(fireOuter);
            this.tweens.add({
              targets: fireOuter,
              scaleY: { from: 0.8, to: 1.2 },
              alpha: { from: 0.4, to: 0.65 },
              duration: 350 + fi * 70,
              yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
            });
            const fireInner = this.add.ellipse(fx, fy - fh / 2 - 3, 9, fh * 0.65, 0xffaa00, 0.35).setDepth(3);
            this._addPageVisual(fireInner);
            this.tweens.add({
              targets: fireInner,
              scaleY: { from: 0.85, to: 1.15 },
              alpha: { from: 0.3, to: 0.55 },
              duration: 280 + fi * 55,
              yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
              delay: 100 + fi * 30,
            });
          }

          // Floating embers
          this.time.addEvent({
            delay: 400, repeat: 7,
            callback: () => {
              if (this.skipped) return;
              const ex = 50 + Math.random() * (W - 100);
              const ey = H * 0.55 + Math.random() * 50;
              const ember = this.add.circle(ex, ey, 1.5, 0xff8830, 0.7).setDepth(5);
              this._addPageVisual(ember);
              this.tweens.add({
                targets: ember,
                y: ey - 80 - Math.random() * 60,
                x: ex + (Math.random() - 0.5) * 40,
                alpha: 0,
                duration: 2500 + Math.random() * 1500,
                onComplete: () => { if (ember && ember.active) ember.destroy(); },
              });
            },
          });

          // Red vignette behind boss
          const vignette = this.add.circle(W / 2, H * 0.35, 120, 0xff0000, 0.15).setDepth(9);
          this._addPageVisual(vignette);
          this.tweens.add({
            targets: vignette,
            alpha: { from: 0.15, to: 0.08 },
            scaleX: { from: 1, to: 1.05 },
            scaleY: { from: 1, to: 1.05 },
            duration: 1500, yoyo: true, repeat: -1,
          });

          if (this.textures.exists('parade_supremeturban')) {
            const boss = this.add.sprite(W / 2, H * 0.35, 'parade_supremeturban')
              .setDepth(10).setScale(2.8).setAlpha(0);
            this._addPageVisual(boss);
            this.tweens.add({ targets: boss, alpha: 1, duration: 600 });
            this.tweens.add({
              targets: boss, alpha: 0.8,
              duration: 1200, yoyo: true, repeat: -1,
            });
            SoundManager.get().playExplosion();
          }

          this._addPageVisual(this.add.text(W / 2, H * 0.62, 'AYATOLLAH ALI KHAMENEI', {
            fontFamily: 'monospace', fontSize: '22px', color: '#ff2222',
            shadow: { offsetX: 0, offsetY: 0, color: '#ff0000', blur: 25, fill: true },
          }).setOrigin(0.5).setDepth(11));
        },
      },
      // -- PAGE 4: Last fortress --
      {
        text: "He's in his last fortress. Everything he has left, protecting one man.",
        color: '#cccccc', size: 20, y: H * 0.45,
        setup: () => {
          const bg = this.add.graphics().setDepth(1);
          this._addPageVisual(bg);
          bg.fillStyle(0x000000, 0.85);
          bg.fillRect(0, 0, W, H);
          // Fortress silhouette
          bg.fillStyle(0x060404, 1);
          bg.fillRect(W * 0.3, H * 0.35, W * 0.4, H * 0.35);
          bg.fillRect(W * 0.25, H * 0.3, W * 0.1, H * 0.4);
          bg.fillRect(W * 0.65, H * 0.3, W * 0.1, H * 0.4);
          // Distant fire glows
          bg.fillStyle(0xff6600, 0.08);
          bg.fillCircle(W * 0.15, H * 0.6, 40);
          bg.fillStyle(0xff4400, 0.06);
          bg.fillCircle(W * 0.85, H * 0.55, 35);
        },
      },
      // -- PAGE 5: History --
      {
        text: "Babylon tried. Rome tried. The Inquisition tried. The Nazis tried.",
        color: '#ffffff', size: 20, y: H * 0.45,
        setup: () => {
          const bg = this.add.graphics().setDepth(1);
          this._addPageVisual(bg);
          bg.fillStyle(0x000000, 0.85);
          bg.fillRect(0, 0, W, H);
        },
      },
      // -- PAGE 6: Hero reveal --
      {
        text: "His turn to fail.",
        color: '#FFD700', size: 28, y: H * 0.82,
        setup: () => {
          this._darkOverlay();
          if (this.textures.exists('cin_superzion')) {
            const hero = this.add.image(W / 2, H * 0.4, 'cin_superzion').setScale(2.0).setDepth(10).setAlpha(0);
            this._addPageVisual(hero);
            this.tweens.add({ targets: hero, alpha: 1, duration: 800 });
          }
          this._draw3DOperationTitle(this, 'OPERATION ENDGAME: DEATH TO THE REGIME', 42);
        },
      },
    ], 'FlightRouteScene', { level: 6, nextScene: 'BossScene' });
  }

  _darkOverlay() {
    const bg = this.add.rectangle(W / 2, H / 2, W, H, 0x080a10).setDepth(1).setAlpha(0.85);
    this._addPageVisual(bg);
  }

  /** L6 silhouette: Large threatening figure (Ayatollah Ali Khamenei) + lightning bolts */
  _drawLastStandSilhouette() {
    const gfx = this.add.graphics().setDepth(5).setScrollFactor(0);
    const c = 0xCCAA00;
    const a = 0.15;

    // Large threatening figure silhouette (center)
    gfx.fillStyle(c, a);
    const fx = W * 0.5, fy = H * 0.35;
    // Body (wide imposing rectangle)
    gfx.fillRect(fx - 30, fy, 60, 120);
    // Shoulders (wider than body)
    gfx.fillRect(fx - 50, fy, 100, 20);
    // Head
    gfx.fillCircle(fx, fy - 10, 18);
    // Turban (larger dome on head)
    gfx.beginPath();
    gfx.arc(fx, fy - 15, 22, Math.PI, 0, false);
    gfx.lineTo(fx + 22, fy - 10);
    gfx.lineTo(fx - 22, fy - 10);
    gfx.closePath();
    gfx.fill();
    // Arms extended outward (menacing pose)
    gfx.fillRect(fx - 70, fy + 10, 25, 8);
    gfx.fillRect(fx + 45, fy + 10, 25, 8);
    // Cloak/robe drape
    gfx.beginPath();
    gfx.moveTo(fx - 50, fy + 20);
    gfx.lineTo(fx - 55, fy + 120);
    gfx.lineTo(fx - 30, fy + 120);
    gfx.closePath();
    gfx.fill();
    gfx.beginPath();
    gfx.moveTo(fx + 50, fy + 20);
    gfx.lineTo(fx + 55, fy + 120);
    gfx.lineTo(fx + 30, fy + 120);
    gfx.closePath();
    gfx.fill();

    // Lightning bolt #1 (left)
    gfx.fillStyle(c, 0.2);
    gfx.lineStyle(2, c, 0.2);
    const lx1 = W * 0.2, ly1 = H * 0.15;
    gfx.beginPath();
    gfx.moveTo(lx1, ly1);
    gfx.lineTo(lx1 + 15, ly1 + 40);
    gfx.lineTo(lx1 + 5, ly1 + 40);
    gfx.lineTo(lx1 + 20, ly1 + 80);
    gfx.lineTo(lx1 + 10, ly1 + 55);
    gfx.lineTo(lx1 + 20, ly1 + 55);
    gfx.lineTo(lx1, ly1);
    gfx.closePath();
    gfx.fill();

    // Lightning bolt #2 (right)
    const lx2 = W * 0.78, ly2 = H * 0.2;
    gfx.beginPath();
    gfx.moveTo(lx2, ly2);
    gfx.lineTo(lx2 + 12, ly2 + 35);
    gfx.lineTo(lx2 + 3, ly2 + 35);
    gfx.lineTo(lx2 + 18, ly2 + 70);
    gfx.lineTo(lx2 + 8, ly2 + 48);
    gfx.lineTo(lx2 + 17, ly2 + 48);
    gfx.lineTo(lx2, ly2);
    gfx.closePath();
    gfx.fill();

    // Lightning bolt #3 (top center-right)
    const lx3 = W * 0.6, ly3 = H * 0.08;
    gfx.beginPath();
    gfx.moveTo(lx3, ly3);
    gfx.lineTo(lx3 + 10, ly3 + 30);
    gfx.lineTo(lx3 + 2, ly3 + 30);
    gfx.lineTo(lx3 + 14, ly3 + 55);
    gfx.lineTo(lx3 + 6, ly3 + 38);
    gfx.lineTo(lx3 + 13, ly3 + 38);
    gfx.lineTo(lx3, ly3);
    gfx.closePath();
    gfx.fill();

    // Ground line
    gfx.lineStyle(1, c, a * 0.6);
    gfx.lineBetween(0, fy + 125, W, fy + 125);
  }

  update() { this._handlePageInput(); }
}
