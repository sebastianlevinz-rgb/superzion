// =================================================================
// BeirutIntroCinematicScene -- Pre-Level 2 cinematic (Beirut Port)
// Part 1: City Panorama | Part 2: Briefing | Part 3: Hero
// =================================================================

import Phaser from 'phaser';
import BaseCinematicScene, { W, H } from './BaseCinematicScene.js';
import SoundManager from '../systems/SoundManager.js';
import MusicManager from '../systems/MusicManager.js';
import { createSuperZionCinematic, createBeirutPortPanorama } from '../utils/CinematicTextures.js';

export default class BeirutIntroCinematicScene extends BaseCinematicScene {
  constructor() { super('BeirutIntroCinematicScene'); }

  create() {
    MusicManager.get().playCinematicMusic(2);
    createSuperZionCinematic(this);
    createBeirutPortPanorama(this);
    this._initCinematic();
    this._startAct1();
  }

  // =================================================================
  // PART 1 -- THE CITY: PORT OF BEIRUT, LEBANON (4s)
  // =================================================================
  _startAct1() {
    this.currentAct = 1;

    const bg = this.add.image(W / 2, H / 2, 'cin_beirut_port').setDepth(0).setAlpha(0);
    this.actObjects.push(bg);
    this.tweens.add({ targets: bg, alpha: 1, duration: 800 });

    this.time.delayedCall(600, () => {
      if (this.skipped) return;
      const title = this.add.text(W / 2, H - 80, 'PORT OF BEIRUT, LEBANON', {
        fontFamily: 'monospace', fontSize: '34px', color: '#ffffff', fontStyle: 'bold',
        shadow: { offsetX: 2, offsetY: 2, color: '#000000', blur: 10, fill: true },
      }).setOrigin(0.5).setDepth(20).setAlpha(0);
      this.actObjects.push(title);
      this.tweens.add({ targets: title, alpha: 1, duration: 600 });
    });

    this._transitionToAct2(3500, 4000);
  }

  // =================================================================
  // PART 2 -- THE BRIEFING (4s)
  // =================================================================
  _startAct2() {
    this.currentAct = 2;

    const bg = this.add.rectangle(W / 2, H / 2, W, H, 0x080808).setDepth(0);
    this.actObjects.push(bg);

    // CRT scanlines
    const crt = this.add.graphics().setDepth(1);
    this.actObjects.push(crt);
    for (let y = 0; y < H; y += 3) {
      crt.fillStyle(0x00ff00, 0.003 + Math.random() * 0.002);
      crt.fillRect(0, y, W, 1);
    }

    // Mission text
    this.time.delayedCall(200, () => {
      if (this.skipped) return;
      this._typewriter(W / 2, 80, 'INTEL:', '#00e5ff', 18, 30);
    });
    this.time.delayedCall(600, () => {
      if (this.skipped) return;
      this._typewriter(W / 2, 120, 'Weapons shipment arriving at Beirut port in cargo containers', '#00e5ff', 14, 18);
    });
    this.time.delayedCall(1800, () => {
      if (this.skipped) return;
      this._typewriter(W / 2, 180, 'MISSION: Locate target container. Swap cargo with tracker.', '#ff8800', 14, 18);
    });
    this.time.delayedCall(2600, () => {
      if (this.skipped) return;
      this._typewriter(W / 2, 210, 'Extract undetected.', '#ff8800', 14, 20);
    });

    // Container diagram - one marked red
    this.time.delayedCall(600, () => {
      if (this.skipped) return;
      const contGfx = this.add.graphics().setDepth(5);
      this.actObjects.push(contGfx);
      const cx = 720, cy = 280;
      // Container stack
      const colors = [0x3060cc, 0x30aa40, 0x3060cc, 0xcc8020, 0x30aa40, 0xff2222];
      let idx = 0;
      for (let row = 0; row < 2; row++) {
        for (let col = 0; col < 3; col++) {
          const x = cx + col * 45 - 60;
          const y = cy + row * 25 - 20;
          contGfx.fillStyle(colors[idx], 1);
          contGfx.fillRect(x, y, 40, 22);
          // Ridges
          contGfx.lineStyle(0.5, 0x000000, 0.3);
          for (let rx = x + 5; rx < x + 40; rx += 5) {
            contGfx.beginPath(); contGfx.moveTo(rx, y); contGfx.lineTo(rx, y + 22); contGfx.strokePath();
          }
          idx++;
        }
      }
      // Red marker on target container (bottom-right)
      contGfx.lineStyle(2, 0xff0000, 1);
      contGfx.strokeRect(cx + 30 - 60, cy + 25 - 20, 40, 22);
      // Arrow pointing to it
      contGfx.lineStyle(1.5, 0xff0000, 0.8);
      contGfx.beginPath(); contGfx.moveTo(cx + 50, cy + 40); contGfx.lineTo(cx + 50, cy + 55); contGfx.strokePath();
      const targetLabel = this.add.text(cx + 50, cy + 62, 'TARGET', {
        fontFamily: 'monospace', fontSize: '9px', color: '#ff4444',
      }).setOrigin(0.5).setDepth(6);
      this.actObjects.push(targetLabel);
    });

    this._transitionToAct3(3500, 4000);
  }

  // =================================================================
  // PART 3 -- THE HERO (3s+ until ENTER)
  // =================================================================
  _startAct3() {
    this.currentAct = 3;

    // Daytime port entrance background
    const bg = this.add.rectangle(W / 2, H / 2, W, H, 0x506878).setDepth(0);
    this.actObjects.push(bg);

    // Sky
    const skyGfx = this.add.graphics().setDepth(1);
    this.actObjects.push(skyGfx);
    for (let y = 0; y < 200; y++) {
      const t = y / 200;
      skyGfx.fillStyle(Phaser.Display.Color.GetColor(80 + t * 40, 140 + t * 30, 200 - t * 20), 1);
      skyGfx.fillRect(0, y, W, 1);
    }

    // Port gate structure
    const gateGfx = this.add.graphics().setDepth(2);
    this.actObjects.push(gateGfx);
    // Concrete pillars
    gateGfx.fillStyle(0x888888, 1);
    gateGfx.fillRect(200, 180, 30, 280);
    gateGfx.fillRect(730, 180, 30, 280);
    // Gate beam
    gateGfx.fillStyle(0x707070, 1);
    gateGfx.fillRect(200, 180, 560, 20);
    // Sign
    gateGfx.fillStyle(0x2060aa, 1);
    gateGfx.fillRect(350, 185, 260, 12);

    const signText = this.add.text(W / 2, 191, 'PORT OF BEIRUT - AUTHORIZED PERSONNEL', {
      fontFamily: 'monospace', fontSize: '7px', color: '#ffffff',
    }).setOrigin(0.5).setDepth(3);
    this.actObjects.push(signText);

    // Road
    gateGfx.fillStyle(0x505050, 1);
    gateGfx.fillRect(240, 420, 480, 120);
    // Road markings
    gateGfx.fillStyle(0xcccc00, 1);
    for (let lx = 260; lx < 700; lx += 30) {
      gateGfx.fillRect(lx, 478, 18, 3);
    }

    // SuperZion in worker disguise
    const sz = this.add.image(W / 2, 380, 'cin_superzion').setScale(1.6).setDepth(10).setAlpha(0);
    this.actObjects.push(sz);
    this.tweens.add({ targets: sz, alpha: 1, duration: 600 });

    // Yellow helmet on top of head
    const helmetGfx = this.add.graphics().setDepth(11);
    this.actObjects.push(helmetGfx);
    // Dome — larger, rounder
    helmetGfx.fillStyle(0xddcc00, 1);
    helmetGfx.fillCircle(W / 2, 306, 24);
    // Brim — wider, curved elliptical
    helmetGfx.fillStyle(0xccbb00, 1);
    helmetGfx.slice(W / 2, 310, 28, Phaser.Math.DegToRad(0), Phaser.Math.DegToRad(180), false);
    helmetGfx.fillPath();
    // Front visor
    helmetGfx.fillStyle(0xbbaa00, 1);
    helmetGfx.slice(W / 2, 312, 20, Phaser.Math.DegToRad(20), Phaser.Math.DegToRad(160), false);
    helmetGfx.fillPath();
    // Reflective highlight
    helmetGfx.fillStyle(0xffffff, 0.35);
    helmetGfx.slice(W / 2 - 4, 298, 10, Phaser.Math.DegToRad(200), Phaser.Math.DegToRad(340), false);
    helmetGfx.fillPath();
    helmetGfx.setAlpha(0);
    this.tweens.add({ targets: helmetGfx, alpha: 1, duration: 600 });

    // Orange vest overlay hint
    const vestGfx = this.add.graphics().setDepth(11);
    this.actObjects.push(vestGfx);
    vestGfx.fillStyle(0xff6600, 0.5);
    vestGfx.fillRect(W / 2 - 28, 345, 56, 40);
    // Reflective stripes
    vestGfx.fillStyle(0xffff00, 0.4);
    vestGfx.fillRect(W / 2 - 28, 355, 56, 3);
    vestGfx.fillRect(W / 2 - 28, 370, 56, 3);
    vestGfx.setAlpha(0);
    this.tweens.add({ targets: vestGfx, alpha: 1, duration: 600 });

    this.time.delayedCall(500, () => {
      if (this.skipped) return;
      const txt = this.add.text(W / 2, 60, 'OPERATION PORT SWAP', {
        fontFamily: 'monospace', fontSize: '20px', color: '#FFD700', fontStyle: 'bold',
        shadow: { offsetX: 0, offsetY: 0, color: '#FFD700', blur: 10, fill: true },
      }).setOrigin(0.5).setDepth(20);
      this.actObjects.push(txt);
    });

    this._showBeginPrompt(2000);
    this._autoAdvance(10000, 'BeirutRadarScene');
  }

  update() { this._handleSkip('BeirutRadarScene'); }
}
