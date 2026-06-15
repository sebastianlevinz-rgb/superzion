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
            const boss1 = this.add.image(W / 2 - 80, H * 0.32, 'parade_foambeard').setScale(0.7).setDepth(2);
            this._addPageVisual(boss1);
            const x1 = this.add.graphics().setDepth(3);
            x1.lineStyle(3, 0xff0000, 0.8);
            x1.lineBetween(W / 2 - 98, H * 0.32 - 18, W / 2 - 62, H * 0.32 + 18);
            x1.lineBetween(W / 2 - 62, H * 0.32 - 18, W / 2 - 98, H * 0.32 + 18);
            this._addPageVisual(x1);
          }
          this._addPageVisual(this.add.text(W / 2 - 80, H * 0.44, 'Haniyeh \u2713', {
            fontFamily: 'monospace', fontSize: '10px', color: '#44ff44',
          }).setOrigin(0.5).setDepth(2));
          // Nasrallah eliminated
          if (this.textures.exists('parade_turboturban')) {
            const boss2 = this.add.image(W / 2 + 80, H * 0.32, 'parade_turboturban').setScale(0.7).setDepth(2);
            this._addPageVisual(boss2);
            const x2 = this.add.graphics().setDepth(3);
            x2.lineStyle(3, 0xff0000, 0.8);
            x2.lineBetween(W / 2 + 62, H * 0.32 - 18, W / 2 + 98, H * 0.32 + 18);
            x2.lineBetween(W / 2 + 98, H * 0.32 - 18, W / 2 + 62, H * 0.32 + 18);
            this._addPageVisual(x2);
          }
          this._addPageVisual(this.add.text(W / 2 + 80, H * 0.44, 'Nasrallah \u2713', {
            fontFamily: 'monospace', fontSize: '10px', color: '#44ff44',
          }).setOrigin(0.5).setDepth(2));
          this._addPageVisual(this.add.text(W / 2, H * 0.7, 'Deep Strike: COMPLETE \u2713', {
            fontFamily: 'monospace', fontSize: '20px', color: '#44ff44',
            shadow: { offsetX: 0, offsetY: 0, color: '#44ff44', blur: 6, fill: true },
          }).setOrigin(0.5).setDepth(2));
          this.time.delayedCall(500, () => { SoundManager.get().playInterceptSuccess(); });
        },
      },
      {
        text: "The general is gone. But the tunnels remain.",
        color: '#ff6644', size: 20, y: H * 0.82,
        setup: () => {
          if (this.textures.exists('cin_destroyed_city')) {
            this._addPageVisual(this.add.image(W / 2, H / 2, 'cin_destroyed_city').setDepth(0).setDisplaySize(W, H));
            this._addPageVisual(this.add.rectangle(W / 2, H / 2, W, H, 0x05060f, 0.5).setDepth(0.5));
          } else {
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
          }
          this.cameras.main.shake(300, 0.015);
          SoundManager.get().playExplosion();
        },
      },
      {
        text: "Hundreds of kilometers underground. Built with cement meant for schools. Filled with weapons meant for war.",
        color: '#cccccc', size: 18, y: H * 0.82,
        setup: () => {
          if (this.textures.exists('cin_tunnel_xsection')) {
            this._addPageVisual(this.add.image(W / 2, H / 2, 'cin_tunnel_xsection').setDepth(0).setDisplaySize(W, H));
            this._addPageVisual(this.add.rectangle(W / 2, H / 2, W, H, 0x05060f, 0.5).setDepth(0.5));
          } else {
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
          }
          SoundManager.get().playDroneScan();

          // Sonar ping — pulsing green circle that expands and fades
          const sonarPing = () => {
            if (this.skipped) return;
            const ping = this.add.circle(W * 0.5, H * 0.4, 8, 0x00ff44, 0.35).setDepth(3);
            this._addPageVisual(ping);
            this.tweens.add({
              targets: ping, scaleX: 6, scaleY: 6, alpha: 0, duration: 1800, ease: 'Sine.easeOut',
              onComplete: () => { if (ping && ping.active) ping.destroy(); },
            });
          };
          sonarPing();
          this.time.addEvent({ delay: 2000, repeat: -1, callback: sonarPing });
        },
      },
      {
        text: "And hiding inside: Yahya Sinwar. The man who turned the underground into a fortress.",
        color: '#ff4444', size: 18, y: H * 0.82,
        setup: () => {
          this._darkOverlay();
          if (this.textures.exists('parade_angryeyebrows')) {
            const boss = this.add.sprite(W / 2, H * 0.4, 'parade_angryeyebrows').setDepth(10).setScale(1.5).setAlpha(0);
            this._addPageVisual(boss);
            this.tweens.add({ targets: boss, alpha: 1, duration: 600 });
            SoundManager.get().playExplosion();
          }
          this._addPageVisual(this.add.text(W / 2, H * 0.75, 'YAHYA SINWAR', {
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
        text: "Good thing we're not sending a man. We're sending something with no fear and perfect aim. Time to pull the last chair from under him.",
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
          const droneRef = this._ambientRef = SoundManager.get().playDroneHum();
          this.time.delayedCall(3000, () => {
            try { if (droneRef && droneRef.source) droneRef.source.stop(); if (droneRef && droneRef.osc) droneRef.osc.stop(); } catch(e) {}
          });
          this._draw3DOperationTitle(this, 'OPERATION LAST CHAIR', 42);
        },
      },
    ], 'FlightRouteScene', { level: 4, nextScene: 'DroneScene' });
  }

  _darkOverlay() {
    if (this.textures.exists("cin_gaza")) { this._addPageVisual(this.add.image(W / 2, H / 2, "cin_gaza").setDepth(0).setAlpha(0.6)); }
    const bg = this.add.rectangle(W / 2, H / 2, W, H, 0x080a10).setDepth(1).setAlpha(0.55);
    this._addPageVisual(bg);
  }

  update() { this._handlePageInput(); }
}
