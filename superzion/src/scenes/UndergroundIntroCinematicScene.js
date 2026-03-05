// ═══════════════════════════════════════════════════════════════
// UndergroundIntroCinematicScene — Post-Level 3 cinematic
// Act 1: F-15 Landing  →  Act 2: Field Radio Briefing  → DroneScene
// ═══════════════════════════════════════════════════════════════

import Phaser from 'phaser';
import BaseCinematicScene, { W, H } from './BaseCinematicScene.js';
import SoundManager from '../systems/SoundManager.js';
import MusicManager from '../systems/MusicManager.js';
import { createSuperZionCinematic, createOpsRoom } from '../utils/CinematicTextures.js';

export default class UndergroundIntroCinematicScene extends BaseCinematicScene {
  constructor() { super('UndergroundIntroCinematicScene'); }

  create() {
    MusicManager.get().playCinematicMusic(4);
    createSuperZionCinematic(this);
    createOpsRoom(this);
    this._initCinematic();
    this._startAct1();
  }

  // ═════════════════════════════════════════════════════════════
  // ACT 1 — F-15 Landing (5s)
  // ═════════════════════════════════════════════════════════════
  _startAct1() {
    this.currentAct = 1;

    // Sky gradient background
    const skyGfx = this.add.graphics().setDepth(0);
    this.actObjects.push(skyGfx);
    for (let y = 0; y < H; y++) {
      const t = y / H;
      const r = 80 + t * 40 | 0;
      const g = 130 + t * 50 | 0;
      const b = 200 - t * 60 | 0;
      skyGfx.fillStyle(Phaser.Display.Color.GetColor(r, g, b), 1);
      skyGfx.fillRect(0, y, W, 1);
    }

    const ground = this.add.rectangle(W / 2, 480, W, 120, 0x3a3a2a).setDepth(1);
    this.actObjects.push(ground);
    const runwayGfx = this.add.graphics().setDepth(2);
    this.actObjects.push(runwayGfx);
    runwayGfx.lineStyle(2, 0xffffff, 0.3);
    for (let rx = 0; rx < W; rx += 20) {
      runwayGfx.beginPath(); runwayGfx.moveTo(rx, 445); runwayGfx.lineTo(rx + 12, 445); runwayGfx.strokePath();
    }

    const f15 = this.add.graphics().setDepth(5);
    this.actObjects.push(f15);
    f15.fillStyle(0x2a2a30, 1);
    f15.fillTriangle(0, 0, -40, 15, -40, -15);
    f15.fillRect(-60, -6, 50, 12);
    f15.fillTriangle(-35, -6, -55, -25, -55, -6);
    f15.fillTriangle(-35, 6, -55, 25, -55, 6);
    f15.setPosition(800, -50);

    this.tweens.add({
      targets: f15, x: 500, y: 420, duration: 2500, ease: 'Power2',
      onComplete: () => {
        SoundManager.get().playBombImpact();
        this.cameras.main.shake(200, 0.005);
      },
    });

    this.time.delayedCall(3000, () => {
      if (this.skipped) return;
      const sz = this.add.image(450, 420, 'cin_superzion').setScale(1.2).setDepth(10).setAlpha(0);
      this.actObjects.push(sz);
      this.tweens.add({ targets: sz, alpha: 1, duration: 400 });
    });

    this._transitionToAct2();
  }

  // ═════════════════════════════════════════════════════════════
  // ACT 2 — Field Radio Briefing (7s) — UNIQUE FORMAT
  // ═════════════════════════════════════════════════════════════
  _startAct2() {
    this.currentAct = 2;

    // Dark desert night bg
    const bg = this.add.rectangle(W / 2, H / 2, W, H, 0x0a0c10).setDepth(0);
    this.actObjects.push(bg);

    // Stars
    const starsGfx = this.add.graphics().setDepth(1);
    this.actObjects.push(starsGfx);
    for (let i = 0; i < 40; i++) {
      starsGfx.fillStyle(0xffffff, 0.1 + Math.random() * 0.3);
      starsGfx.fillCircle(Math.random() * W, Math.random() * 200, 0.5 + Math.random() * 0.5);
    }

    // Desert ground
    const groundGfx = this.add.graphics().setDepth(2);
    this.actObjects.push(groundGfx);
    groundGfx.fillStyle(0x2a2418, 1);
    groundGfx.fillRect(0, 400, W, 140);
    groundGfx.fillStyle(0x222010, 1);
    groundGfx.fillRect(0, 395, W, 5);

    // Campfire glow
    const fireGlow = this.add.circle(W / 2 + 60, 390, 30, 0xff6600, 0.06).setDepth(3);
    this.actObjects.push(fireGlow);
    this.tweens.add({ targets: fireGlow, alpha: 0.12, scale: 1.2, duration: 400, yoyo: true, repeat: -1 });

    // Small fire
    const fireGfx = this.add.graphics().setDepth(4);
    this.actObjects.push(fireGfx);
    fireGfx.fillStyle(0xff6600, 0.8);
    fireGfx.fillCircle(W / 2 + 60, 392, 4);
    fireGfx.fillStyle(0xffaa00, 0.6);
    fireGfx.fillCircle(W / 2 + 58, 388, 3);
    fireGfx.fillStyle(0xff4400, 0.7);
    fireGfx.fillCircle(W / 2 + 63, 390, 3);

    // SuperZion sitting by fire with radio
    const sz = this.add.image(W / 2 - 20, 380, 'cin_superzion').setScale(1.5).setDepth(5);
    this.actObjects.push(sz);

    // Radio box
    const radioGfx = this.add.graphics().setDepth(6);
    this.actObjects.push(radioGfx);
    radioGfx.fillStyle(0x333333, 1);
    radioGfx.fillRect(W / 2 + 10, 375, 20, 14);
    radioGfx.fillStyle(0x00ff00, 0.4);
    radioGfx.fillRect(W / 2 + 13, 378, 5, 3);
    // Antenna
    radioGfx.lineStyle(1, 0x666666, 0.8);
    radioGfx.beginPath(); radioGfx.moveTo(W / 2 + 25, 375); radioGfx.lineTo(W / 2 + 32, 355); radioGfx.strokePath();

    // Radio static sound indicator — pulsing green dot
    const radioPulse = this.add.circle(W / 2 + 15, 379, 2, 0x00ff00, 0.8).setDepth(7);
    this.actObjects.push(radioPulse);
    this.tweens.add({ targets: radioPulse, alpha: 0.2, duration: 300, yoyo: true, repeat: -1 });

    // Radio communication box (looks like incoming message)
    this.time.delayedCall(800, () => {
      if (this.skipped) return;
      // Transmission box
      const txBox = this.add.rectangle(W / 2, 120, 500, 80, 0x001a00, 0.7).setDepth(8);
      this.actObjects.push(txBox);
      txBox.setStrokeStyle(1, 0x00ff00, 0.3);

      const callsign = this.add.text(W / 2 - 240, 90, 'HQ TRANSMISSION:', {
        fontFamily: 'monospace', fontSize: '10px', color: '#00aa00',
      }).setDepth(9);
      this.actObjects.push(callsign);

      SoundManager.get().playTypewriterClick();
    });

    this.time.delayedCall(1500, () => {
      if (this.skipped) return;
      this._typewriter(W / 2, 120, 'NEW INTEL \u2014 UNDERGROUND NETWORK DETECTED', '#00e5ff', 16, 30);
    });

    this.time.delayedCall(3500, () => {
      if (this.skipped) return;
      this._typewriter(W / 2, 150, 'DRONE RECONNAISSANCE AUTHORIZED', '#00ff00', 12, 25);
    });

    this._showBeginPrompt();
    this._autoAdvance(12000, 'DroneScene');
  }

  update() { this._handleSkip('DroneScene'); }
}
