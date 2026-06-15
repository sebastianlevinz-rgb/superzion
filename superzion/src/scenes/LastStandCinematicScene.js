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
              const boss = this.add.image(bd.x, H * 0.28, bd.key).setScale(0.55).setDepth(2);
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
          if (this.textures.exists('cin_natanz')) {
            this._addPageVisual(this.add.image(W / 2, H / 2, 'cin_natanz').setDepth(0).setDisplaySize(W, H));
            this._addPageVisual(this.add.rectangle(W / 2, H / 2, W, H, 0x05060f, 0.45).setDepth(0.5));
          } else {
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
          // Single dramatic flash on this dark page
          const flash = this.add.rectangle(W / 2, H / 2, W, H, 0xffffff, 0.15).setDepth(3);
          this._addPageVisual(flash);
          this.tweens.add({ targets: flash, alpha: 0, duration: 400, ease: 'Cubic.easeOut' });
        },
      },
      // -- PAGE 3: Ayatollah Ali Khamenei reveal with full war background --
      {
        text: "Ayatollah Ali Khamenei. The puppet master. Every missile, every tunnel, every death \u2014 traces back to him.",
        color: '#ff4444', size: 18, y: H * 0.82,
        setup: () => {
          // AI panorama backdrop behind the boss reveal
          if (this.textures.exists('cin_fortress')) {
            this._addPageVisual(this.add.image(W / 2, H / 2, 'cin_fortress').setDisplaySize(W, H).setDepth(0));
          }
          this._addPageVisual(this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.45).setDepth(1));

          const battleRef = this._ambientRef = SoundManager.get().playAmbientBattle();
          this.time.delayedCall(5000, () => {
            try { if (battleRef) { if (battleRef.source) battleRef.source.stop(); if (battleRef.osc) battleRef.osc.stop(); if (battleRef.stopRumble) battleRef.stopRumble(); } } catch(e) {}
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
            // Dramatic scale-up entrance with shadow
            const bossShadow = this.add.sprite(W / 2 + 4, H * 0.35 + 4, 'parade_supremeturban')
              .setDepth(9).setScale(0.5).setAlpha(0).setTint(0x000000);
            this._addPageVisual(bossShadow);
            const boss = this.add.sprite(W / 2, H * 0.35, 'parade_supremeturban')
              .setDepth(10).setScale(0.5).setAlpha(0);
            this._addPageVisual(boss);
            // Scale-up from small to large (dramatic reveal)
            this.tweens.add({
              targets: [boss, bossShadow], alpha: 1, scale: 2.8, duration: 800,
              ease: 'Back.easeOut',
            });
            // Ongoing menacing pulse
            this.tweens.add({
              targets: boss, alpha: 0.8,
              duration: 1200, yoyo: true, repeat: -1, delay: 900,
            });
            this.tweens.add({
              targets: bossShadow, alpha: 0.3,
              duration: 1200, yoyo: true, repeat: -1, delay: 900,
            });
            SoundManager.get().playBossEntrance();
            this.time.delayedCall(300, () => { SoundManager.get().playExplosion(); });
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
          if (this.textures.exists('cin_fortress')) {
            this._addPageVisual(this.add.image(W / 2, H / 2, 'cin_fortress').setDepth(0).setDisplaySize(W, H));
            this._addPageVisual(this.add.rectangle(W / 2, H / 2, W, H, 0x05060f, 0.45).setDepth(0.5));
            // Distant fire glows on top
            const fg = this.add.graphics().setDepth(2);
            this._addPageVisual(fg);
            fg.fillStyle(0xff6600, 0.08);
            fg.fillCircle(W * 0.15, H * 0.6, 40);
            fg.fillStyle(0xff4400, 0.06);
            fg.fillCircle(W * 0.85, H * 0.55, 35);
          } else {
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
          }
        },
      },
      // -- PAGE 5: History --
      {
        text: "Babylon tried. Rome tried. The Inquisition tried. The Nazis tried.",
        color: '#ffffff', size: 20, y: H * 0.45,
        setup: () => {
          if (this.textures.exists('cin_destroyed_city')) {
            this._addPageVisual(this.add.image(W / 2, H / 2, 'cin_destroyed_city').setDepth(0).setDisplaySize(W, H));
            this._addPageVisual(this.add.rectangle(W / 2, H / 2, W, H, 0x05060f, 0.6).setDepth(0.5));
          } else {
            const bg = this.add.graphics().setDepth(1);
            this._addPageVisual(bg);
            bg.fillStyle(0x000000, 0.85);
            bg.fillRect(0, 0, W, H);
          }
          // Distant red glow on the horizon
          const horizon = this.add.graphics().setDepth(2);
          this._addPageVisual(horizon);
          horizon.fillStyle(0xff2200, 0.08);
          horizon.fillRect(0, H * 0.7, W, H * 0.3);
          horizon.fillStyle(0xff4400, 0.04);
          horizon.fillEllipse(W / 2, H * 0.72, W * 0.8, 60);
          // Pulsing glow
          this.tweens.add({
            targets: horizon, alpha: { from: 1, to: 0.5 },
            duration: 2000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
          });
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
    if (this.textures.exists("cin_fortress")) { this._addPageVisual(this.add.image(W / 2, H / 2, "cin_fortress").setDepth(0).setAlpha(0.6)); }
    const bg = this.add.rectangle(W / 2, H / 2, W, H, 0x080a10).setDepth(1).setAlpha(0.55);
    this._addPageVisual(bg);
  }

  update() { this._handlePageInput(); }
}
