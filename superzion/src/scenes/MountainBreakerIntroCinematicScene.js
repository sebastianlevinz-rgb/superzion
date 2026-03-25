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

    // Background silhouette: B-2 bomber + mountain + radiation symbol
    this._drawMountainBreakerSilhouette();

    this._initPages([
      {
        text: "The underground empire is finished. Yahya Sinwar won't give orders again.",
        color: '#4488ff', size: 20, y: H * 0.82,
        setup: () => {
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
          bg.fillStyle(0x060608, 0.85);
          bg.fillRect(0, 0, W, H);
          // Mountain
          bg.fillStyle(0x2a3a2a, 0.8);
          bg.fillTriangle(W / 2, 120, W / 2 - 300, H - 60, W / 2 + 300, H - 60);
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
          bg.fillStyle(0x2a3a2a, 1);
          bg.fillRect(0, H - 60, W, 60);
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
          this._draw3DOperationTitle(this, 'OPERATION MOUNTAIN BREAKER', 42);
        },
      },
    ], 'FlightRouteScene', { level: 5, nextScene: 'B2BomberScene' });
  }

  _darkOverlay() {
    const bg = this.add.rectangle(W / 2, H / 2, W, H, 0x080a10).setDepth(1).setAlpha(0.85);
    this._addPageVisual(bg);
  }

  /** L5 silhouette: B-2 bomber + mountain + radiation symbol */
  _drawMountainBreakerSilhouette() {
    const gfx = this.add.graphics().setDepth(5).setScrollFactor(0);
    const c = 0xCCAA00;
    const a = 0.15;

    // Mountain range at bottom
    gfx.fillStyle(c, a);
    gfx.beginPath();
    gfx.moveTo(0, H * 0.78);
    gfx.lineTo(100, H * 0.6);
    gfx.lineTo(200, H * 0.65);
    gfx.lineTo(350, H * 0.48);  // main peak
    gfx.lineTo(500, H * 0.55);
    gfx.lineTo(600, H * 0.5);
    gfx.lineTo(750, H * 0.58);
    gfx.lineTo(900, H * 0.65);
    gfx.lineTo(W, H * 0.72);
    gfx.lineTo(W, H);
    gfx.lineTo(0, H);
    gfx.closePath();
    gfx.fill();

    // B-2 stealth bomber silhouette (upper area)
    gfx.fillStyle(c, 0.18);
    const bx = W * 0.6, by = H * 0.28;
    gfx.beginPath();
    gfx.moveTo(bx, by - 3);          // nose
    gfx.lineTo(bx + 80, by + 6);     // right wing tip
    gfx.lineTo(bx + 65, by + 10);    // right wing trailing
    gfx.lineTo(bx + 20, by + 5);
    gfx.lineTo(bx, by + 4);          // center
    gfx.lineTo(bx - 20, by + 5);
    gfx.lineTo(bx - 65, by + 10);    // left wing trailing
    gfx.lineTo(bx - 80, by + 6);     // left wing tip
    gfx.closePath();
    gfx.fill();

    // Radiation symbol (inside the mountain)
    const rx = W * 0.37, ry = H * 0.56;
    gfx.fillStyle(c, 0.12);
    gfx.fillCircle(rx, ry, 6);
    gfx.lineStyle(2, c, 0.12);
    for (let ai = 0; ai < 3; ai++) {
      const angle = ai * (Math.PI * 2 / 3) - Math.PI / 2;
      gfx.beginPath();
      gfx.arc(rx, ry, 14, angle - 0.35, angle + 0.35, false);
      gfx.strokePath();
    }
    // Outer ring
    gfx.lineStyle(1, c, 0.08);
    gfx.strokeCircle(rx, ry, 20);
  }

  update() { this._handlePageInput(); }
}
