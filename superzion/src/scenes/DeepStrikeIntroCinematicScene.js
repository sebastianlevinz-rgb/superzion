// ═══════════════════════════════════════════════════════════════
// DeepStrikeIntroCinematicScene — Post-Level 2 cinematic
// Act 1: Radar Complete  →  Act 2: F-15 Hangar  → BomberScene
// ═══════════════════════════════════════════════════════════════

import BaseCinematicScene, { W, H } from './BaseCinematicScene.js';
import MusicManager from '../systems/MusicManager.js';
import { createSuperZionCinematic, createRadarDesk, createF15Hangar } from '../utils/CinematicTextures.js';

export default class DeepStrikeIntroCinematicScene extends BaseCinematicScene {
  constructor() { super('DeepStrikeIntroCinematicScene'); }

  create() {
    MusicManager.get().playCinematicMusic(3);
    createSuperZionCinematic(this);
    createRadarDesk(this);
    createF15Hangar(this);
    this._initCinematic();
    this._startAct1();
  }

  _startAct1() {
    this.currentAct = 1;

    const bg = this.add.rectangle(W / 2, H / 2, W, H, 0x060808).setDepth(0);
    this.actObjects.push(bg);

    const crt = this.add.graphics().setDepth(1);
    this.actObjects.push(crt);
    for (let y = 0; y < H; y += 3) {
      crt.fillStyle(0x00ff00, 0.003 + Math.random() * 0.002);
      crt.fillRect(0, y, W, 1);
    }

    const desk = this.add.image(W / 2, 340, 'cin_radar_desk').setScale(2.5).setDepth(3);
    this.actObjects.push(desk);

    const missionText = this.add.text(W / 2 - 50, 290, 'MISSION\nCOMPLETE', {
      fontFamily: 'monospace', fontSize: '10px', color: '#00ff00', align: 'center',
    }).setOrigin(0.5).setDepth(5);
    this.actObjects.push(missionText);
    this.tweens.add({ targets: missionText, alpha: 0.5, duration: 500, yoyo: true, repeat: -1 });

    const sz = this.add.image(W / 2 - 20, 400, 'cin_superzion').setScale(1.3).setDepth(10);
    this.actObjects.push(sz);

    this.time.delayedCall(1000, () => {
      if (this.skipped) return;
      this.tweens.add({ targets: sz, scaleX: 1.8, scaleY: 1.8, y: 380, duration: 500, ease: 'Power2' });
    });

    this.time.delayedCall(2000, () => {
      if (this.skipped) return;
      this.tweens.add({ targets: sz, x: W + 64, duration: 2000, ease: 'Linear' });
    });

    this._transitionToAct2();
  }

  _startAct2() {
    this.currentAct = 2;

    const bg = this.add.rectangle(W / 2, H / 2, W, H, 0x14120e).setDepth(0);
    this.actObjects.push(bg);

    const hangar = this.add.image(W / 2, H / 2, 'cin_f15_hangar').setScale(3).setDepth(2);
    this.actObjects.push(hangar);

    const techGfx = this.add.graphics().setDepth(3);
    this.actObjects.push(techGfx);
    techGfx.fillStyle(0x444444, 0.6);
    techGfx.fillRect(360, 350, 6, 14);
    techGfx.fillRect(520, 360, 6, 14);
    techGfx.fillRect(580, 345, 6, 14);

    const sz = this.add.image(-64, 400, 'cin_superzion').setScale(1.8).setDepth(10);
    this.actObjects.push(sz);
    this.tweens.add({
      targets: sz, x: W / 2 - 80, duration: 2000, ease: 'Power1',
      onComplete: () => {
        this.tweens.add({ targets: sz, x: W / 2 + 20, scaleX: 1.0, scaleY: 1.0, y: 370, duration: 1500, ease: 'Power2' });
      },
    });

    this.time.delayedCall(4000, () => {
      if (this.skipped) return;
      const canopy = this.add.rectangle(W / 2 - 90, 300, 60, 10, 0x1a3050, 0.6).setDepth(4);
      this.actObjects.push(canopy);
      canopy.setAlpha(0);
      this.tweens.add({ targets: canopy, alpha: 0.8, duration: 500 });
    });

    this.time.delayedCall(2500, () => {
      if (this.skipped) return;
      this._typewriter(W / 2, 80, 'TARGET ACQUIRED \u2014 PREPARING FOR AERIAL ASSAULT', '#00e5ff', 14, 25);
    });

    this._showBeginPrompt();
    this._autoAdvance(12000, 'BomberScene');
  }

  update() { this._handleSkip('BomberScene'); }
}
