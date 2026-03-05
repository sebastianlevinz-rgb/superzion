// ═══════════════════════════════════════════════════════════════
// MountainBreakerIntroCinematicScene — Post-Level 4 cinematic
// Act 1: Reviewing Documents  →  Act 2: Map Planning  → B2BomberScene
// ═══════════════════════════════════════════════════════════════

import BaseCinematicScene, { W, H } from './BaseCinematicScene.js';
import SoundManager from '../systems/SoundManager.js';
import MusicManager from '../systems/MusicManager.js';
import { createSuperZionCinematic, createDocumentsTable, createB2Hangar } from '../utils/CinematicTextures.js';

export default class MountainBreakerIntroCinematicScene extends BaseCinematicScene {
  constructor() { super('MountainBreakerIntroCinematicScene'); }

  create() {
    MusicManager.get().playCinematicMusic(5);
    createSuperZionCinematic(this);
    createDocumentsTable(this);
    createB2Hangar(this);
    this._initCinematic();
    this._startAct1();
  }

  // ═════════════════════════════════════════════════════════════
  // ACT 1 — Reviewing Documents (5s)
  // ═════════════════════════════════════════════════════════════
  _startAct1() {
    this.currentAct = 1;

    const bg = this.add.rectangle(W / 2, H / 2, W, H, 0x080604).setDepth(0);
    this.actObjects.push(bg);

    const lightGlow = this.add.circle(W / 2, 200, 120, 0xffeecc, 0.04).setDepth(1);
    this.actObjects.push(lightGlow);

    const table = this.add.image(W / 2, 320, 'cin_documents_table').setScale(3).setDepth(3);
    this.actObjects.push(table);

    const sz = this.add.image(W / 2 - 60, 280, 'cin_superzion').setScale(1.8).setDepth(5);
    this.actObjects.push(sz);

    const photos = [];
    const photoPositions = [{ x: W / 2 + 40, y: 340 }, { x: W / 2 + 100, y: 330 }];
    for (const pp of photoPositions) {
      const photo = this.add.rectangle(pp.x, pp.y, 30, 24, 0x505050).setDepth(4);
      this.actObjects.push(photo);
      photos.push(photo);
    }

    this.time.delayedCall(2000, () => {
      if (this.skipped) return;
      this.tweens.add({
        targets: sz, y: 285, duration: 80, yoyo: true,
        onComplete: () => {
          this.cameras.main.shake(100, 0.008);
          SoundManager.get().playBombImpact();
          for (const photo of photos) {
            this.tweens.add({
              targets: photo,
              x: photo.x + (Math.random() - 0.5) * 30,
              y: photo.y + (Math.random() - 0.5) * 15,
              angle: (Math.random() - 0.5) * 20,
              duration: 200,
            });
          }
        },
      });
    });

    this.time.delayedCall(500, () => {
      if (this.skipped) return;
      this._typewriter(W / 2, 80, 'NUCLEAR INTEL CONFIRMED', '#ff8800', 22, 50);
    });

    this._transitionToAct2();
  }

  // ═════════════════════════════════════════════════════════════
  // ACT 2 — Map Planning Room (7s) — UNIQUE FORMAT
  // ═════════════════════════════════════════════════════════════
  _startAct2() {
    this.currentAct = 2;

    // Dark planning room
    const bg = this.add.rectangle(W / 2, H / 2, W, H, 0x080808).setDepth(0);
    this.actObjects.push(bg);

    // Large tactical map on wall
    const mapBg = this.add.rectangle(W / 2, 220, 600, 300, 0x0a1a0a, 0.8).setDepth(2);
    this.actObjects.push(mapBg);
    mapBg.setStrokeStyle(1, 0x00ff00, 0.3);

    // Map grid
    const gridGfx = this.add.graphics().setDepth(3);
    this.actObjects.push(gridGfx);
    gridGfx.lineStyle(0.5, 0x00ff00, 0.08);
    for (let x = 180; x < 780; x += 30) {
      gridGfx.beginPath(); gridGfx.moveTo(x, 70); gridGfx.lineTo(x, 370); gridGfx.strokePath();
    }
    for (let y = 70; y < 370; y += 30) {
      gridGfx.beginPath(); gridGfx.moveTo(180, y); gridGfx.lineTo(780, y); gridGfx.strokePath();
    }

    // Mountain target icon on map
    const mtnGfx = this.add.graphics().setDepth(4);
    this.actObjects.push(mtnGfx);
    mtnGfx.fillStyle(0x446622, 0.6);
    mtnGfx.fillTriangle(580, 240, 640, 240, 610, 170);
    // Nuclear glow
    mtnGfx.fillStyle(0x00ff00, 0.2);
    mtnGfx.fillCircle(610, 210, 15);

    // Target reticle around mountain — pulsing
    const reticle = this.add.graphics().setDepth(5);
    this.actObjects.push(reticle);
    reticle.lineStyle(1.5, 0xff2222, 0.7);
    reticle.strokeCircle(610, 210, 30);
    reticle.beginPath(); reticle.moveTo(610, 175); reticle.lineTo(610, 185); reticle.strokePath();
    reticle.beginPath(); reticle.moveTo(610, 235); reticle.lineTo(610, 245); reticle.strokePath();
    reticle.beginPath(); reticle.moveTo(575, 210); reticle.lineTo(585, 210); reticle.strokePath();
    reticle.beginPath(); reticle.moveTo(635, 210); reticle.lineTo(645, 210); reticle.strokePath();
    this.tweens.add({ targets: reticle, alpha: 0.3, duration: 500, yoyo: true, repeat: -1 });

    // Animated flight path arrow from left to target
    this.time.delayedCall(1000, () => {
      if (this.skipped) return;
      const arrowGfx = this.add.graphics().setDepth(5);
      this.actObjects.push(arrowGfx);
      // Draw path incrementally
      const pathPoints = [
        { x: 250, y: 300 }, { x: 350, y: 270 }, { x: 450, y: 250 },
        { x: 530, y: 230 }, { x: 580, y: 215 },
      ];
      let ptIdx = 0;
      const pathTimer = this.time.addEvent({
        delay: 300, repeat: pathPoints.length - 1,
        callback: () => {
          if (this.skipped) return;
          arrowGfx.lineStyle(2, 0x00e5ff, 0.6);
          if (ptIdx > 0) {
            arrowGfx.beginPath();
            arrowGfx.moveTo(pathPoints[ptIdx - 1].x, pathPoints[ptIdx - 1].y);
            arrowGfx.lineTo(pathPoints[ptIdx].x, pathPoints[ptIdx].y);
            arrowGfx.strokePath();
          }
          // Dot at waypoint
          arrowGfx.fillStyle(0x00e5ff, 0.8);
          arrowGfx.fillCircle(pathPoints[ptIdx].x, pathPoints[ptIdx].y, 3);
          ptIdx++;
        },
      });
      this.actObjects.push(pathTimer);
    });

    // B-2 icon at start position
    this.time.delayedCall(500, () => {
      if (this.skipped) return;
      const b2Icon = this.add.graphics().setDepth(6);
      this.actObjects.push(b2Icon);
      b2Icon.fillStyle(0x888888, 0.8);
      b2Icon.fillTriangle(250, 295, 270, 305, 230, 305);
      b2Icon.setAlpha(0);
      this.tweens.add({ targets: b2Icon, alpha: 1, duration: 500 });
    });

    // "NATANZ" label on target
    const natanzLabel = this.add.text(610, 255, 'NATANZ', {
      fontFamily: 'monospace', fontSize: '10px', color: '#ff4444',
    }).setOrigin(0.5).setDepth(5);
    this.actObjects.push(natanzLabel);

    // SuperZion pointing at map (small, below)
    const sz = this.add.image(300, 430, 'cin_superzion').setScale(1.5).setDepth(8).setAlpha(0);
    this.actObjects.push(sz);
    this.tweens.add({ targets: sz, alpha: 1, duration: 500, delay: 300 });

    this.time.delayedCall(2000, () => {
      if (this.skipped) return;
      this._typewriter(W / 2, 400, 'THE NUCLEAR THREAT MUST BE ELIMINATED', '#00e5ff', 18, 35);
    });

    this._showBeginPrompt();
    this._autoAdvance(12000, 'B2BomberScene');
  }

  update() { this._handleSkip('B2BomberScene'); }
}
