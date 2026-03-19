// =================================================================
// UndergroundIntroCinematicScene -- Transition 3→4: Bunker → Tunnels
// Page-by-page narrative with SPACE/ENTER advancement
// =================================================================

import Phaser from 'phaser';
import BaseCinematicScene, { W, H } from './BaseCinematicScene.js';
import SoundManager from '../systems/SoundManager.js';
import MusicManager from '../systems/MusicManager.js';
import { createSuperZionCinematic } from '../utils/CinematicTextures.js';

export default class UndergroundIntroCinematicScene extends BaseCinematicScene {
  constructor() { super('UndergroundIntroCinematicScene'); }

  create() {
    MusicManager.get().playCinematicMusic(4);
    createSuperZionCinematic(this);
    this._initCinematic();

    this._initPages([
      {
        text: "The general is gone. But the tunnels remain.",
        color: '#ff6644', size: 20, y: H * 0.82,
        setup: () => {
          // Bunker exploding
          const bg = this.add.graphics().setDepth(0);
          this._addPageVisual(bg);
          for (let y = 0; y < H; y++) {
            const t = y / H;
            bg.fillStyle(Phaser.Display.Color.GetColor(50 + t * 50 | 0, 15 + t * 20 | 0, 5 + t * 10 | 0));
            bg.fillRect(0, y, W, 1);
          }
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
          // Tunnel cross-section
          const bg = this.add.graphics().setDepth(0);
          this._addPageVisual(bg);
          bg.fillStyle(0x0a0a0a, 1);
          bg.fillRect(0, 0, W, H);
          // Tunnel outlines
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
        text: "And hiding inside: The Warden. The man who turned the underground into a fortress.",
        color: '#ff4444', size: 18, y: H * 0.82,
        setup: () => {
          this._addPageVisual(this.add.rectangle(W / 2, H / 2, W, H, 0x0a0808).setDepth(0));
          if (this.textures.exists('parade_warden')) {
            const boss = this.add.sprite(W / 2, H * 0.4, 'parade_warden').setDepth(10).setScale(1.5).setAlpha(0);
            this._addPageVisual(boss);
            this.tweens.add({ targets: boss, alpha: 1, duration: 600 });
            SoundManager.get().playExplosion();
          }
          this._addPageVisual(this.add.text(W / 2, H * 0.6, 'THE WARDEN', {
            fontFamily: 'monospace', fontSize: '14px', color: '#ff4444',
            shadow: { offsetX: 0, offsetY: 0, color: '#ff0000', blur: 10, fill: true },
          }).setOrigin(0.5).setDepth(11));
        },
      },
      {
        text: "Every entrance is a trap. Every tunnel is a maze.",
        color: '#ffffff', size: 20, y: H * 0.45,
        setup: () => { this._addPageVisual(this.add.rectangle(W / 2, H / 2, W, H, 0x080808).setDepth(0)); },
      },
      {
        text: "Good thing we're not sending a man. We're sending something with no fear and perfect aim.",
        color: '#FFD700', size: 20, y: H * 0.82,
        setup: () => {
          this._addPageVisual(this.add.rectangle(W / 2, H / 2, W, H, 0x080a10).setDepth(0));
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
          this._addPageVisual(this.add.text(W / 2, 40, 'OPERATION UNDERGROUND', {
            fontFamily: 'monospace', fontSize: '20px', color: '#FFD700', fontStyle: 'bold',
            shadow: { offsetX: 0, offsetY: 0, color: '#FFD700', blur: 10, fill: true },
          }).setOrigin(0.5).setDepth(20));
        },
      },
    ], 'DroneScene');
  }

  update() { this._handlePageInput(); }
}
