// =================================================================
// UndergroundIntroCinematicScene -- Transition 3->4: Bunker -> Tunnels
// Military terminal aesthetic with classified intel briefing
// =================================================================

import Phaser from 'phaser';
import BaseCinematicScene, { W, H } from './BaseCinematicScene.js';
import SoundManager from '../systems/SoundManager.js';
import MusicManager from '../systems/MusicManager.js';
import { createSuperZionCinematic } from '../utils/CinematicTextures.js';

export default class UndergroundIntroCinematicScene extends BaseCinematicScene {
  constructor() { super('UndergroundIntroCinematicScene'); }

  create() {
    MusicManager.get().playCinematicDrone();
    createSuperZionCinematic(this);
    this._initCinematic();

    // Military terminal background
    this._drawMilitaryBg(this);
    // Military HUD overlay
    this._drawMilitaryHUD(this, 'OPERATION LAST CHAIR', "31\u00b025'N 34\u00b023'E", '#00AA44');

    // Background silhouette: destroyed building rubble
    this._drawUndergroundSilhouette();

    this._initPages([
      {
        text: "The general is gone. But the tunnels remain.",
        color: '#ff6644', size: 20, y: H * 0.82,
        setup: () => {
          // Bunker exploding overlay
          const bg = this.add.graphics().setDepth(1);
          this._addPageVisual(bg);
          bg.fillStyle(0x000000, 0.7);
          bg.fillRect(0, 0, W, H);
          // Mountain with explosion
          bg.fillStyle(0x3a4a3a, 0.8);
          bg.fillTriangle(W / 2, 100, W / 2 - 250, H - 70, W / 2 + 250, H - 70);
          bg.fillStyle(0xff4400, 0.3);
          bg.fillCircle(W / 2, H * 0.4, 60);
          bg.fillStyle(0x2a3a2a, 1);
          bg.fillRect(0, H - 70, W, 70);
          this.cameras.main.shake(300, 0.015);
          SoundManager.get().playExplosion();
        },
      },
      {
        text: "Hundreds of kilometers underground. Built with cement meant for schools. Filled with weapons meant for war.",
        color: '#cccccc', size: 18, y: H * 0.82,
        setup: () => {
          // Tunnel cross-section overlay
          const bg = this.add.graphics().setDepth(1);
          this._addPageVisual(bg);
          bg.fillStyle(0x0a0a0a, 0.85);
          bg.fillRect(0, 0, W, H);
          bg.lineStyle(2, 0x444444, 0.5);
          for (let i = 0; i < 5; i++) {
            const ty = 100 + i * 80;
            bg.strokeRect(W * 0.2, ty, W * 0.6, 30);
            bg.lineStyle(1, 0x333333, 0.3);
            bg.lineBetween(W * 0.2, ty + 15, W * 0.8, ty + 15);
          }
          bg.fillStyle(0x444400, 0.15);
          bg.fillRect(W * 0.3, 130, W * 0.4, 20);
          bg.fillRect(W * 0.25, 290, W * 0.5, 20);
        },
      },
      {
        text: "And hiding inside: Angry Eyebrows. The man who turned the underground into a fortress.",
        color: '#ff4444', size: 18, y: H * 0.82,
        setup: () => {
          this._darkOverlay();
          if (this.textures.exists('parade_angryeyebrows')) {
            const boss = this.add.sprite(W / 2, H * 0.4, 'parade_angryeyebrows').setDepth(10).setScale(1.5).setAlpha(0);
            this._addPageVisual(boss);
            this.tweens.add({ targets: boss, alpha: 1, duration: 600 });
            SoundManager.get().playExplosion();
          }
          this._addPageVisual(this.add.text(W / 2, H * 0.6, 'ANGRY EYEBROWS', {
            fontFamily: 'monospace', fontSize: '14px', color: '#ff4444',
            shadow: { offsetX: 0, offsetY: 0, color: '#ff0000', blur: 10, fill: true },
          }).setOrigin(0.5).setDepth(11));
        },
      },
      {
        text: "Every entrance is a trap. Every tunnel is a maze.",
        color: '#ffffff', size: 20, y: H * 0.45,
        setup: () => this._darkOverlay(),
      },
      {
        text: "Good thing we're not sending a man. We're sending something with no fear and perfect aim.",
        color: '#FFD700', size: 20, y: H * 0.82,
        setup: () => {
          this._darkOverlay();
          // Drone visual
          const droneGfx = this.add.graphics().setDepth(10);
          this._addPageVisual(droneGfx);
          const dx = W / 2, dy = H * 0.35;
          droneGfx.fillStyle(0x556666, 1);
          droneGfx.fillRect(dx - 20, dy, 40, 8);
          droneGfx.fillStyle(0x668888, 1);
          droneGfx.fillRect(dx - 40, dy - 3, 20, 5);
          droneGfx.fillRect(dx + 20, dy - 3, 20, 5);
          droneGfx.fillStyle(0x88aacc, 0.8);
          droneGfx.fillCircle(dx, dy + 3, 3);
          this.tweens.add({ targets: droneGfx, y: droneGfx.y - 5, duration: 1500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
          this._draw3DOperationTitle(this, 'OPERATION LAST CHAIR', 42);
        },
      },
    ], 'FlightRouteScene', { level: 4, nextScene: 'DroneScene' });
  }

  _darkOverlay() {
    const bg = this.add.rectangle(W / 2, H / 2, W, H, 0x080a10).setDepth(1).setAlpha(0.85);
    this._addPageVisual(bg);
  }

  /** L4 silhouette: destroyed building rubble */
  _drawUndergroundSilhouette() {
    const gfx = this.add.graphics().setDepth(5).setScrollFactor(0);
    const c = 0x00AA44;
    const a = 0.15;

    gfx.fillStyle(c, a);

    // Building 1 - partially destroyed (left)
    const b1x = W * 0.15;
    gfx.fillRect(b1x, H * 0.5, 50, H * 0.25);
    // Jagged top (destroyed)
    gfx.beginPath();
    gfx.moveTo(b1x, H * 0.5);
    gfx.lineTo(b1x + 10, H * 0.45);
    gfx.lineTo(b1x + 20, H * 0.52);
    gfx.lineTo(b1x + 30, H * 0.42);
    gfx.lineTo(b1x + 40, H * 0.48);
    gfx.lineTo(b1x + 50, H * 0.5);
    gfx.lineTo(b1x + 50, H * 0.5);
    gfx.closePath();
    gfx.fill();

    // Building 2 - collapsed center
    const b2x = W * 0.35;
    gfx.fillRect(b2x, H * 0.55, 70, H * 0.2);
    gfx.beginPath();
    gfx.moveTo(b2x, H * 0.55);
    gfx.lineTo(b2x + 15, H * 0.5);
    gfx.lineTo(b2x + 35, H * 0.58);
    gfx.lineTo(b2x + 50, H * 0.48);
    gfx.lineTo(b2x + 70, H * 0.55);
    gfx.closePath();
    gfx.fill();

    // Rubble pile (center)
    gfx.fillStyle(c, 0.12);
    gfx.beginPath();
    gfx.moveTo(W * 0.4, H * 0.75);
    gfx.lineTo(W * 0.45, H * 0.68);
    gfx.lineTo(W * 0.5, H * 0.72);
    gfx.lineTo(W * 0.55, H * 0.65);
    gfx.lineTo(W * 0.6, H * 0.7);
    gfx.lineTo(W * 0.65, H * 0.75);
    gfx.lineTo(W * 0.4, H * 0.75);
    gfx.closePath();
    gfx.fill();

    // Building 3 - tall, partially standing (right)
    gfx.fillStyle(c, a);
    const b3x = W * 0.75;
    gfx.fillRect(b3x, H * 0.4, 40, H * 0.35);
    gfx.beginPath();
    gfx.moveTo(b3x, H * 0.4);
    gfx.lineTo(b3x + 10, H * 0.35);
    gfx.lineTo(b3x + 20, H * 0.42);
    gfx.lineTo(b3x + 30, H * 0.38);
    gfx.lineTo(b3x + 40, H * 0.4);
    gfx.closePath();
    gfx.fill();

    // Scattered debris dots
    gfx.fillStyle(c, 0.1);
    for (let i = 0; i < 15; i++) {
      gfx.fillRect(W * 0.1 + Math.random() * W * 0.8, H * 0.7 + Math.random() * H * 0.08, 3 + Math.random() * 5, 2 + Math.random() * 3);
    }

    // Ground line
    gfx.lineStyle(1, c, a * 0.8);
    gfx.lineBetween(0, H * 0.76, W, H * 0.76);
  }

  update() { this._handlePageInput(); }
}
