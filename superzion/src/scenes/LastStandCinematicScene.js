// =================================================================
// LastStandCinematicScene -- Transition 5->6: Natanz -> Final Fortress
// Page-by-page narrative with SPACE/ENTER advancement
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

    this._initPages([
      // ── PAGE 1: Natanz crater with fire/smoke aftermath ──
      {
        text: "Natanz is a crater. The centrifuges are scrap metal. The bomb will never exist.",
        color: '#ff8844', size: 20, y: H * 0.82,
        setup: () => {
          const bg = this.add.graphics().setDepth(0);
          this._addPageVisual(bg);
          // Dark warm sky gradient (crimson -> smoky orange)
          for (let y = 0; y < H; y++) {
            const t = y / H;
            const r = 26 + t * 50 | 0;
            const g = 5 + t * 15 | 0;
            const b = 5 + t * 5 | 0;
            bg.fillStyle(Phaser.Display.Color.GetColor(r, g, b));
            bg.fillRect(0, y, W, 1);
          }
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
          // Smoke plumes rising from crater
          for (const sx of [W * 0.35, W * 0.5, W * 0.65]) {
            bg.fillStyle(0x2a1a10, 0.4);
            bg.fillCircle(sx, H * 0.3, 30);
            bg.fillCircle(sx - 10, H * 0.22, 40);
            bg.fillCircle(sx + 5, H * 0.15, 50);
          }
          // Flickering fire glow tween
          const fireGlow = this.add.circle(W / 2, H * 0.4, 90, 0xff6600, 0.15).setDepth(1);
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
      // ── PAGE 2: Darkness -- one man remains ──
      {
        text: "But one man remains. The one who started all of this.",
        color: '#ffffff', size: 22, y: H * 0.45,
        setup: () => {
          const bg = this.add.graphics().setDepth(0);
          this._addPageVisual(bg);
          // Very dark warm background
          for (let y = 0; y < H; y++) {
            const t = y / H;
            bg.fillStyle(Phaser.Display.Color.GetColor(6 + t * 4 | 0, 3 + t * 2 | 0, 3 + t * 2 | 0));
            bg.fillRect(0, y, W, 1);
          }
        },
      },
      // ── PAGE 3: Supreme Turban reveal with full war background ──
      {
        text: "Supreme Turban. The puppet master. Every missile, every tunnel, every death \u2014 traces back to him.",
        color: '#ff4444', size: 18, y: H * 0.82,
        setup: () => {
          const bg = this.add.graphics().setDepth(0);
          this._addPageVisual(bg);

          // a. BLOOD SKY — dark crimson gradient
          for (let y = 0; y < H * 0.55; y++) {
            const t = y / (H * 0.55);
            const r = 26 + t * 32 | 0;  // #1a -> #3a
            const g = 5 + t * 16 | 0;   // #05 -> #15
            const b = 5 + t * 2 | 0;    // #05 -> #07
            bg.fillStyle(Phaser.Display.Color.GetColor(r, g, b));
            bg.fillRect(0, y, W, 1);
          }

          // Horizon haze
          bg.fillStyle(0x3a1505, 0.5);
          bg.fillRect(0, H * 0.5, W, H * 0.1);

          // b. DARK GROUND
          bg.fillStyle(0x1a0a05, 1);
          bg.fillRect(0, H * 0.6, W, H * 0.4);
          // Ground texture variation
          bg.fillStyle(0x120805, 1);
          bg.fillRect(0, H * 0.7, W, H * 0.3);

          // c. FIRE COLUMNS along horizon
          const fireXPositions = [80, 180, 300, 420, 560, 680, 780, 880];
          for (const fx of fireXPositions) {
            const fh = 20 + Math.abs(Math.sin(fx * 0.01)) * 25;
            const fy = H * 0.55;
            // Fire body
            bg.fillStyle(0xff6400, 0.6);
            bg.fillEllipse(fx, fy - fh / 2, 12, fh);
            bg.fillStyle(0xffaa00, 0.4);
            bg.fillEllipse(fx, fy - fh / 2 - 5, 8, fh * 0.7);
            // Smoke plumes above each fire
            bg.fillStyle(0x281e14, 0.4);
            bg.fillCircle(fx + 3, fy - fh - 10, 14);
            bg.fillCircle(fx - 2, fy - fh - 28, 18);
            bg.fillCircle(fx + 5, fy - fh - 50, 22);
          }

          // d. ARMY SILHOUETTES along ground
          const soldierPositions = [60, 130, 210, 310, 400, 510, 590, 650, 740, 830, 900];
          for (let i = 0; i < soldierPositions.length; i++) {
            const sx = soldierPositions[i];
            // Depth variation — some bigger (foreground), some smaller (background)
            const scale = (i % 3 === 0) ? 1.4 : (i % 3 === 1) ? 1.0 : 0.7;
            const sy = H * 0.65 + (1 - scale) * 20;
            bg.fillStyle(0x0a0505, 1);
            // Body
            bg.fillRect(sx - 2 * scale, sy - 10 * scale, 4 * scale, 10 * scale);
            // Head
            bg.fillCircle(sx, sy - 12 * scale, 2 * scale);
            // Rifle line
            bg.lineStyle(1, 0x0a0505, 1);
            bg.beginPath();
            bg.moveTo(sx + 2 * scale, sy - 8 * scale);
            bg.lineTo(sx + 8 * scale, sy - 14 * scale);
            bg.strokePath();
          }

          // e. MISSILE TRUCKS
          const truckPositions = [220, 550, 770];
          for (const tx of truckPositions) {
            const ty = H * 0.62;
            bg.fillStyle(0x0a0808, 1);
            // Truck body
            bg.fillRect(tx - 15, ty - 6, 30, 12);
            // Wheels
            bg.fillCircle(tx - 10, ty + 6, 4);
            bg.fillCircle(tx + 10, ty + 6, 4);
            // Missile launcher (diagonal line)
            bg.lineStyle(3, 0x0a0808, 1);
            bg.beginPath();
            bg.moveTo(tx - 5, ty - 6);
            bg.lineTo(tx + 15, ty - 22);
            bg.strokePath();
          }

          // f. STACKED ARMAMENTS on right
          const ax = W * 0.78;
          const ay = H * 0.66;
          bg.fillStyle(0x1a1a10, 1);
          // Crate stack
          bg.fillRect(ax, ay, 14, 8);
          bg.fillRect(ax + 2, ay - 8, 12, 8);
          bg.fillRect(ax + 4, ay - 16, 10, 8);
          bg.fillRect(ax + 16, ay, 14, 8);
          // Missile tips (bright lines)
          bg.lineStyle(1, 0x556644, 1);
          bg.beginPath();
          bg.moveTo(ax + 14, ay + 2); bg.lineTo(ax + 20, ay + 2);
          bg.moveTo(ax + 14, ay - 4); bg.lineTo(ax + 20, ay - 4);
          bg.moveTo(ax + 14, ay - 12); bg.lineTo(ax + 20, ay - 12);
          bg.strokePath();

          // g. SOLDIERS LOADING WEAPONS near armament stack
          for (const lx of [ax - 14, ax - 26, ax + 38]) {
            const ly = ay + 4;
            bg.fillStyle(0x0a0505, 1);
            // Bent body
            bg.fillRect(lx - 1.5, ly - 8, 3, 8);
            // Head
            bg.fillCircle(lx, ly - 10, 2);
            // Arms extended toward crates
            bg.lineStyle(1, 0x0a0505, 1);
            bg.beginPath();
            bg.moveTo(lx + 1.5, ly - 6);
            bg.lineTo(lx + 10, ly - 8);
            bg.strokePath();
          }

          // h. FLOATING EMBER PARTICLES
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

          // ── SUPREME TURBAN SPRITE — large and imposing ──
          // Red vignette glow behind boss
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
            // Fade in
            this.tweens.add({ targets: boss, alpha: 1, duration: 600 });
            // Slow menacing pulse (stays more visible)
            this.tweens.add({
              targets: boss, alpha: 0.8,
              duration: 1200, yoyo: true, repeat: -1,
            });
            SoundManager.get().playExplosion();
          }

          // SUPREME TURBAN label — larger with stronger glow
          this._addPageVisual(this.add.text(W / 2, H * 0.62, 'SUPREME TURBAN', {
            fontFamily: 'monospace', fontSize: '22px', color: '#ff2222',
            shadow: { offsetX: 0, offsetY: 0, color: '#ff0000', blur: 25, fill: true },
          }).setOrigin(0.5).setDepth(11));
        },
      },
      // ── PAGE 4: Last fortress — with distant fire glow ──
      {
        text: "He's in his last fortress. Everything he has left, protecting one man.",
        color: '#cccccc', size: 20, y: H * 0.45,
        setup: () => {
          const bg = this.add.graphics().setDepth(0);
          this._addPageVisual(bg);
          // Dark warm background
          for (let y = 0; y < H; y++) {
            const t = y / H;
            bg.fillStyle(Phaser.Display.Color.GetColor(10 + t * 6 | 0, 6 + t * 3 | 0, 4 + t * 2 | 0));
            bg.fillRect(0, y, W, 1);
          }
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
      // ── PAGE 5: History -- dark warm background ──
      {
        text: "Babylon tried. Rome tried. The Inquisition tried. The Camps tried.",
        color: '#ffffff', size: 20, y: H * 0.45,
        setup: () => {
          const bg = this.add.graphics().setDepth(0);
          this._addPageVisual(bg);
          for (let y = 0; y < H; y++) {
            const t = y / H;
            bg.fillStyle(Phaser.Display.Color.GetColor(8 + t * 4 | 0, 4 + t * 3 | 0, 6 + t * 2 | 0));
            bg.fillRect(0, y, W, 1);
          }
        },
      },
      // ── PAGE 6: Hero reveal -- warm dark with gold ──
      {
        text: "His turn to fail.",
        color: '#FFD700', size: 28, y: H * 0.82,
        setup: () => {
          const bg = this.add.graphics().setDepth(0);
          this._addPageVisual(bg);
          // Dark warm background with slight golden warmth
          for (let y = 0; y < H; y++) {
            const t = y / H;
            bg.fillStyle(Phaser.Display.Color.GetColor(10 + t * 5 | 0, 8 + t * 4 | 0, 4 + t * 2 | 0));
            bg.fillRect(0, y, W, 1);
          }
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
