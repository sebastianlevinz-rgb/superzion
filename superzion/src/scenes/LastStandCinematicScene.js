// ═══════════════════════════════════════════════════════════════
// LastStandCinematicScene — Post-Level 5 cinematic
// Act 1: Mountain Explodes  →  Act 2: Close-up Character Moment  → BossScene
// ═══════════════════════════════════════════════════════════════

import Phaser from 'phaser';
import BaseCinematicScene, { W, H } from './BaseCinematicScene.js';
import SoundManager from '../systems/SoundManager.js';
import MusicManager from '../systems/MusicManager.js';
import { createSuperZionCinematic, createOpsRoom } from '../utils/CinematicTextures.js';

export default class LastStandCinematicScene extends BaseCinematicScene {
  constructor() { super('LastStandCinematicScene'); }

  create() {
    MusicManager.get().playCinematicMusic(6);
    createSuperZionCinematic(this);
    createOpsRoom(this);
    this._initCinematic();
    this._startAct1();
  }

  // ═════════════════════════════════════════════════════════════
  // ACT 1 — Mountain Explodes (5s)
  // ═════════════════════════════════════════════════════════════
  _startAct1() {
    this.currentAct = 1;

    const bg = this.add.rectangle(W / 2, H / 2, W, H, 0x040610).setDepth(0);
    this.actObjects.push(bg);

    const starsGfx = this.add.graphics().setDepth(1);
    this.actObjects.push(starsGfx);
    for (let i = 0; i < 60; i++) {
      starsGfx.fillStyle(0xffffff, 0.15 + Math.random() * 0.4);
      starsGfx.fillCircle(Math.random() * W, Math.random() * 300, 0.5 + Math.random() * 0.5);
    }

    const mtnGfx = this.add.graphics().setDepth(2);
    this.actObjects.push(mtnGfx);
    mtnGfx.fillStyle(0x121018, 1);
    mtnGfx.beginPath();
    mtnGfx.moveTo(0, 440);
    mtnGfx.lineTo(100, 350); mtnGfx.lineTo(200, 380);
    mtnGfx.lineTo(300, 300); mtnGfx.lineTo(400, 340);
    mtnGfx.lineTo(W / 2, 200);
    mtnGfx.lineTo(600, 340); mtnGfx.lineTo(700, 310);
    mtnGfx.lineTo(800, 370); mtnGfx.lineTo(900, 350);
    mtnGfx.lineTo(960, 380); mtnGfx.lineTo(960, 440);
    mtnGfx.closePath();
    mtnGfx.fillPath();
    mtnGfx.fillStyle(0x0e0c10, 1);
    mtnGfx.fillRect(0, 420, W, 120);

    const nuclearGlow = this.add.circle(W / 2, 280, 30, 0x00ff00, 0.08).setDepth(3);
    this.actObjects.push(nuclearGlow);
    this.tweens.add({ targets: nuclearGlow, alpha: 0.15, scale: 1.3, duration: 600, yoyo: true, repeat: 2 });

    this.time.delayedCall(1500, () => {
      if (this.skipped) return;
      const flash = this.add.circle(W / 2, 210, 15, 0xffffff, 0.95).setDepth(8);
      this.actObjects.push(flash);
      this.tweens.add({ targets: flash, scale: 12, alpha: 0, duration: 1000, ease: 'Power2' });

      const fireball = this.add.circle(W / 2, 230, 25, 0xff6600, 0.8).setDepth(7);
      this.actObjects.push(fireball);
      this.tweens.add({ targets: fireball, scale: 6, alpha: 0, duration: 1500, ease: 'Power1' });

      const fireball2 = this.add.circle(W / 2, 240, 18, 0xff2200, 0.7).setDepth(7);
      this.actObjects.push(fireball2);
      this.tweens.add({ targets: fireball2, scale: 8, alpha: 0, duration: 2000, delay: 150, ease: 'Power1' });

      for (let i = 0; i < 5; i++) {
        const smoke = this.add.circle(
          W / 2 + (Math.random() - 0.5) * 60, 220 + Math.random() * 40,
          8 + Math.random() * 12, 0x333333, 0.3
        ).setDepth(6);
        this.actObjects.push(smoke);
        this.tweens.add({
          targets: smoke, y: 100 - Math.random() * 80, scale: 3, alpha: 0,
          duration: 2500 + Math.random() * 1000, delay: 300 + i * 150,
        });
      }

      const screenFlash = this.add.rectangle(W / 2, H / 2, W, H, 0xffaa44, 0.5).setDepth(6);
      this.actObjects.push(screenFlash);
      this.tweens.add({ targets: screenFlash, alpha: 0, duration: 800 });

      SoundManager.get().playExplosion();
      this.cameras.main.shake(600, 0.02);
    });

    this.time.delayedCall(2500, () => {
      if (this.skipped) return;
      this._typewriter(W / 2, 60, 'NATANZ DESTROYED', '#ff6600', 28, 50);
    });

    this.time.delayedCall(4000, () => {
      if (this.skipped) return;
      this.cameras.main.fadeOut(800, 0, 0, 0);
    });

    this.time.delayedCall(5000, () => {
      if (this.skipped) return;
      this._clearAct();
      this.cameras.main.fadeIn(400, 0, 0, 0);
      this._startAct2();
    });
  }

  // ═════════════════════════════════════════════════════════════
  // ACT 2 — Close-up Character Moment (7s) — UNIQUE FORMAT
  // ═════════════════════════════════════════════════════════════
  _startAct2() {
    this.currentAct = 2;

    // Dark room, dramatic lighting
    const bg = this.add.rectangle(W / 2, H / 2, W, H, 0x060608).setDepth(0);
    this.actObjects.push(bg);

    // Dramatic side lighting cone from right
    const lightCone = this.add.graphics().setDepth(1);
    this.actObjects.push(lightCone);
    lightCone.fillStyle(0xffffff, 0.015);
    lightCone.fillTriangle(W, 0, W / 2 - 100, H / 2, W, H);

    // SuperZion large, center — dramatic close-up approaching camera
    const sz = this.add.image(W / 2, 300, 'cin_superzion').setScale(3).setDepth(5).setAlpha(0);
    this.actObjects.push(sz);
    this.tweens.add({ targets: sz, alpha: 1, scaleX: 5, scaleY: 5, y: 320, duration: 5000, ease: 'Power1' });

    // Rifle appears at hand
    this.time.delayedCall(1500, () => {
      if (this.skipped) return;
      const rifle = this.add.graphics().setDepth(6);
      this.actObjects.push(rifle);
      rifle.fillStyle(0x444444, 1);
      rifle.fillRect(W / 2 + 40, 310, 50, 6);
      rifle.fillRect(W / 2 + 55, 304, 6, 12);
      rifle.setAlpha(0);
      this.tweens.add({ targets: rifle, alpha: 1, duration: 400 });
    });

    // Intel lines appearing one by one
    this.time.delayedCall(600, () => {
      if (this.skipped) return;
      this._typewriter(W / 2, 50, 'ALL TARGETS NEUTRALIZED. ONE REMAINS.', '#00e5ff', 14, 25);
    });

    this.time.delayedCall(2200, () => {
      if (this.skipped) return;
      this._typewriter(W / 2, 80, 'THE FORTIFIED BUNKER OUTSIDE BEIRUT', '#ff8800', 14, 25);
    });

    // Dramatic gold text
    this.time.delayedCall(3800, () => {
      if (this.skipped) return;
      const t = this.add.text(W / 2, 460, '', {
        fontFamily: 'monospace', fontSize: '22px', color: '#FFD700', fontStyle: 'bold',
        shadow: { offsetX: 0, offsetY: 0, color: '#FFD700', blur: 12, fill: true },
      }).setOrigin(0.5).setDepth(20);
      this.actObjects.push(t);
      const text = 'THIS ENDS NOW.';
      let idx = 0;
      const timer = this.time.addEvent({
        delay: 50, repeat: text.length - 1,
        callback: () => {
          if (this.skipped) return;
          idx++;
          t.setText(text.substring(0, idx));
          SoundManager.get().playTypewriterClick();
        },
      });
      this.actObjects.push(timer);
    });

    this.time.delayedCall(5500, () => {
      if (this.skipped) return;
      const prompt = this.add.text(W / 2, H - 20, 'PRESS ENTER TO BEGIN', {
        fontFamily: 'monospace', fontSize: '16px', color: '#ffffff',
      }).setOrigin(0.5).setDepth(20);
      this.actObjects.push(prompt);
      this.tweens.add({ targets: prompt, alpha: 0.3, duration: 600, yoyo: true, repeat: -1 });
    });

    this._autoAdvance(14000, 'BossScene');
  }

  update() { this._handleSkip('BossScene'); }
}
