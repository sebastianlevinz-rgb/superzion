// =================================================================
// MountainBreakerIntroCinematicScene -- Transition 4->5: Tunnels -> Natanz
// Military terminal aesthetic with classified intel briefing
// =================================================================

import Phaser from 'phaser';
import BaseCinematicScene, { W, H } from './BaseCinematicScene.js';
import SoundManager from '../systems/SoundManager.js';
import MusicManager from '../systems/MusicManager.js';
import { createSuperZionCinematic } from '../utils/CinematicTextures.js';

export default class MountainBreakerIntroCinematicScene extends BaseCinematicScene {
  constructor() { super('MountainBreakerIntroCinematicScene'); }

  create() {
    MusicManager.get().playCinematicDrone();
    createSuperZionCinematic(this);
    this._initCinematic();

    // Military terminal background
    this._drawMilitaryBg(this);
    // Military HUD overlay (amber)
    this._drawMilitaryHUD(this, 'OPERATION MOUNTAIN BREAKER', "33\u00b043'N 51\u00b043'E", '#CCAA00');

    this._initPages([
      // -- RECAP PAGE: Previously on SuperZion --
      {
        text: '',
        charDelay: 0,
        autoAdvance: 2500,
        setup: () => {
          const bg = this.add.rectangle(W / 2, H / 2, W, H, 0x000000).setDepth(1);
          this._addPageVisual(bg);
          this._addPageVisual(this.add.text(W / 2, 60, 'PREVIOUSLY...', {
            fontFamily: 'monospace', fontSize: '14px', color: '#666666',
          }).setOrigin(0.5).setDepth(2));
          const bossData = [
            { key: 'parade_foambeard', name: 'Haniyeh \u2713', x: W / 2 - 120 },
            { key: 'parade_turboturban', name: 'Nasrallah \u2713', x: W / 2 },
            { key: 'parade_angryeyebrows', name: 'Sinwar \u2713', x: W / 2 + 120 },
          ];
          for (const bd of bossData) {
            if (this.textures.exists(bd.key)) {
              const boss = this.add.image(bd.x, H * 0.32, bd.key).setScale(0.6).setDepth(2);
              this._addPageVisual(boss);
              const xg = this.add.graphics().setDepth(3);
              xg.lineStyle(3, 0xff0000, 0.8);
              xg.lineBetween(bd.x - 16, H * 0.32 - 16, bd.x + 16, H * 0.32 + 16);
              xg.lineBetween(bd.x + 16, H * 0.32 - 16, bd.x - 16, H * 0.32 + 16);
              this._addPageVisual(xg);
            }
            this._addPageVisual(this.add.text(bd.x, H * 0.44, bd.name, {
              fontFamily: 'monospace', fontSize: '10px', color: '#44ff44',
            }).setOrigin(0.5).setDepth(2));
          }
          this._addPageVisual(this.add.text(W / 2, H * 0.7, 'Last Chair: COMPLETE \u2713', {
            fontFamily: 'monospace', fontSize: '20px', color: '#44ff44',
            shadow: { offsetX: 0, offsetY: 0, color: '#44ff44', blur: 6, fill: true },
          }).setOrigin(0.5).setDepth(2));
          this.time.delayedCall(500, () => { SoundManager.get().playInterceptSuccess(); });
        },
      },
      {
        text: "The underground empire is finished. Yahya Sinwar won't give orders again.",
        color: '#4488ff', size: 20, y: H * 0.82,
        setup: () => {
          if (this.textures.exists('cin_tunnel_xsection')) {
            this._addPageVisual(this.add.image(W / 2, H / 2, 'cin_tunnel_xsection').setDepth(0).setDisplaySize(W, H));
            this._addPageVisual(this.add.rectangle(W / 2, H / 2, W, H, 0x05060f, 0.5).setDepth(0.5));
          } else {
            // Tunnels collapsing overlay
            const bg = this.add.graphics().setDepth(1);
            this._addPageVisual(bg);
            bg.fillStyle(0x0a0a0a, 0.85);
            bg.fillRect(0, 0, W, H);
            bg.fillStyle(0x3a2a1a, 0.6);
            for (let i = 0; i < 6; i++) {
              bg.fillRect(W * 0.15 + i * 110, H * 0.3 + Math.random() * 30, 80, 15 + Math.random() * 10);
            }
            bg.fillStyle(0x555544, 0.3);
            bg.fillRect(W * 0.1, H * 0.6, W * 0.8, 5);
          }
          this.cameras.main.shake(200, 0.01);
        },
      },
      {
        text: "But the real threat was never the soldiers or the tunnels.",
        color: '#ffffff', size: 22, y: H * 0.45,
        setup: () => this._darkOverlay(),
      },
      {
        text: "It's the bomb. 8,000 centrifuges spinning under a mountain. Day and night. Getting closer.",
        color: '#44ff44', size: 18, y: H * 0.82,
        setup: () => {
          // Natanz glow overlay
          const bg = this.add.graphics().setDepth(1);
          this._addPageVisual(bg);
          if (this.textures.exists('cin_natanz')) {
            this._addPageVisual(this.add.image(W / 2, H / 2, 'cin_natanz').setDepth(0).setDisplaySize(W, H));
            this._addPageVisual(this.add.rectangle(W / 2, H / 2, W, H, 0x05060f, 0.5).setDepth(0.5));
          } else {
            bg.fillStyle(0x060608, 0.85);
            bg.fillRect(0, 0, W, H);
            // Mountain
            bg.fillStyle(0x2a3a2a, 0.8);
            bg.fillTriangle(W / 2, 120, W / 2 - 300, H - 60, W / 2 + 300, H - 60);
          }
          const hasNatanz = this.textures.exists('cin_natanz');
          // Green glow from inside
          bg.fillStyle(0x22ff22, 0.15);
          bg.fillCircle(W / 2, H * 0.45, 80);
          bg.fillStyle(0x44ff44, 0.08);
          bg.fillCircle(W / 2, H * 0.45, 120);
          // Nuclear symbol
          bg.fillStyle(0x44ff44, 0.3);
          bg.fillCircle(W / 2, H * 0.45, 12);
          bg.lineStyle(3, 0x44ff44, 0.4);
          for (let ai = 0; ai < 3; ai++) {
            const angle = ai * (Math.PI * 2 / 3) - Math.PI / 2;
            bg.beginPath();
            bg.arc(W / 2, H * 0.45, 25, angle - 0.4, angle + 0.4, false);
            bg.strokePath();
          }
          if (!hasNatanz) {
            bg.fillStyle(0x2a3a2a, 1);
            bg.fillRect(0, H - 60, W, 60);
          }
          SoundManager.get().playRadarAlert();

          // Slow zoom-in tween on the entire overlay (satellite imagery feel)
          bg.setScale(1);
          this.tweens.add({
            targets: bg,
            scaleX: 1.08, scaleY: 1.08,
            duration: 8000, ease: 'Sine.easeInOut',
          });

          // Pulsing nuclear glow
          const nukeGlow = this.add.circle(W / 2, H * 0.45, 80, 0x44ff44, 0.06).setDepth(2);
          this._addPageVisual(nukeGlow);
          this.tweens.add({
            targets: nukeGlow,
            alpha: { from: 0.06, to: 0.15 },
            scaleX: { from: 1, to: 1.15 },
            scaleY: { from: 1, to: 1.15 },
            duration: 1500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
          });
        },
      },
      {
        text: "If they finish it, nothing else matters. Not the missions. Not the victories. Everything... gone.",
        color: '#ff4444', size: 20, y: H * 0.45,
        setup: () => this._darkOverlay(),
      },
      {
        text: "They buried it under a mountain because they think nothing can reach it.",
        color: '#cccccc', size: 20, y: H * 0.45,
        setup: () => this._darkOverlay(),
      },
      {
        text: "They haven't met the B-2 Spirit.",
        color: '#FFD700', size: 26, y: H * 0.82,
        setup: () => {
          this._darkOverlay();
          // B-2 silhouette visual
          const b2 = this.add.graphics().setDepth(10);
          this._addPageVisual(b2);
          const cx = W / 2, cy = H * 0.4;
          b2.fillStyle(0x333344, 1);
          b2.beginPath();
          b2.moveTo(cx, cy - 5);
          b2.lineTo(cx + 120, cy + 10);
          b2.lineTo(cx + 100, cy + 15);
          b2.lineTo(cx, cy + 8);
          b2.lineTo(cx - 100, cy + 15);
          b2.lineTo(cx - 120, cy + 10);
          b2.closePath();
          b2.fill();
          // Spotlight
          b2.fillStyle(0xffffcc, 0.06);
          b2.fillTriangle(cx, 0, cx - 80, cy - 20, cx + 80, cy - 20);
          const b2Ref = this._ambientRef = SoundManager.get().playB2Engine();
          this.time.delayedCall(4000, () => {
            try { if (b2Ref && b2Ref.source) b2Ref.source.stop(); if (b2Ref && b2Ref.osc) b2Ref.osc.stop(); } catch(e) {}
          });
          this._draw3DOperationTitle(this, 'OPERATION MOUNTAIN BREAKER', 42);
        },
      },
    ], 'FlightRouteScene', { level: 5, nextScene: 'B2BomberScene' });
  }

  _darkOverlay() {
    if (this.textures.exists("cin_natanz")) { this._addPageVisual(this.add.image(W / 2, H / 2, "cin_natanz").setDepth(0).setAlpha(0.6)); }
    const bg = this.add.rectangle(W / 2, H / 2, W, H, 0x080a10).setDepth(1).setAlpha(0.55);
    this._addPageVisual(bg);
  }

  update() { this._handlePageInput(); }
}
