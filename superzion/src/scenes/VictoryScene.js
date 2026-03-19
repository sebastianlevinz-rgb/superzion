// ═══════════════════════════════════════════════════════════════
// VictoryScene — Epic victory narrative after defeating Supreme Turban
// Page-by-page text with SPACE/ENTER, ends with "Am Yisrael Chai"
// ═══════════════════════════════════════════════════════════════

import Phaser from 'phaser';
import BaseCinematicScene, { W, H } from './BaseCinematicScene.js';
import SoundManager from '../systems/SoundManager.js';
import MusicManager from '../systems/MusicManager.js';

export default class VictoryScene extends BaseCinematicScene {
  constructor() { super('VictoryScene'); }

  create() {
    MusicManager.get().playVictoryMusic();
    this._initCinematic();

    this._initPages([
      {
        text: "It's over.",
        color: '#FFD700', size: 32, y: H * 0.45,
        setup: () => this._sunriseBg(),
      },
      {
        text: "The tunnels are sealed. The generals are gone. The bunkers are rubble. The bomb will never be built.",
        color: '#ffffff', size: 18, y: H * 0.82,
        setup: () => {
          this._sunriseBg();
          this._drawCliff();
          this._drawHero();
          this._drawDistantSmoke();
        },
      },
      {
        text: "They said we wouldn't last a week in 1948.",
        color: '#cccccc', size: 22, y: H * 0.45,
        setup: () => this._sunriseBg(),
      },
      {
        text: "They said we couldn't survive surrounded.",
        color: '#cccccc', size: 22, y: H * 0.45,
      },
      {
        text: "They said it was impossible.",
        color: '#cccccc', size: 22, y: H * 0.45,
      },
      {
        text: "They were right. It was impossible.",
        color: '#ffffff', size: 24, y: H * 0.45,
      },
      {
        text: "We did it anyway.",
        color: '#FFD700', size: 28, y: H * 0.82,
        setup: () => {
          this._sunriseBg();
          this._drawFlag(W / 2, H * 0.35);
        },
      },
      {
        text: "Because our enemies keep changing their names...",
        color: '#cccccc', size: 20, y: H * 0.45,
        setup: () => this._sunriseBg(),
      },
      {
        text: "...but we never change ours.",
        color: '#ffffff', size: 24, y: H * 0.45,
      },
      {
        text: "Am Yisrael Chai.",
        color: '#FFD700', size: 36, y: H * 0.5,
        setup: () => {
          this._sunriseBg();
          // Giant golden Maguen David
          const starGfx = this.add.graphics().setDepth(5);
          this._addPageVisual(starGfx);
          const cx = W / 2, cy = H * 0.38;
          const r = 80;
          starGfx.fillStyle(0xFFD700, 0.35);
          starGfx.fillTriangle(cx, cy - r, cx - r * 0.866, cy + r * 0.5, cx + r * 0.866, cy + r * 0.5);
          starGfx.fillTriangle(cx, cy + r, cx - r * 0.866, cy - r * 0.5, cx + r * 0.866, cy - r * 0.5);
          starGfx.setAlpha(0);
          this.tweens.add({ targets: starGfx, alpha: 1, duration: 800 });
          SoundManager.get().playExplosion();
          this.cameras.main.shake(300, 0.015);
        },
      },
      {
        text: '', color: '#000000', size: 1, y: -100, charDelay: 1,
        setup: () => {
          this._sunriseBg();
          // Title + subtitle + fireworks
          const titleFont = '"Impact", "Arial Black", "Trebuchet MS", sans-serif';
          // SUPERZION title
          const outlineOffsets = [[-3,0],[3,0],[0,-3],[0,3],[-3,-3],[3,-3],[-3,3],[3,3]];
          for (const [dx, dy] of outlineOffsets) {
            this._addPageVisual(this.add.text(W / 2 + dx, H * 0.35 + dy, 'S U P E R Z I O N', {
              fontFamily: titleFont, fontSize: '60px', color: '#000000',
            }).setOrigin(0.5).setDepth(49));
          }
          this._addPageVisual(this.add.text(W / 2, H * 0.35, 'S U P E R Z I O N', {
            fontFamily: titleFont, fontSize: '60px', color: '#FFD700',
            shadow: { offsetX: 0, offsetY: 0, color: '#FFD700', blur: 60, fill: true },
          }).setOrigin(0.5).setDepth(50));
          // Subtitle
          const sub = this.add.text(W / 2, H * 0.5, 'THEY FIGHT TO CONQUER. WE FIGHT TO EXIST.', {
            fontFamily: titleFont, fontSize: '20px', color: '#ffffff',
            shadow: { offsetX: 0, offsetY: 0, color: '#ffffff', blur: 8, fill: true },
          }).setOrigin(0.5).setDepth(50).setAlpha(0);
          this._addPageVisual(sub);
          this.tweens.add({ targets: sub, alpha: 1, duration: 600, delay: 400 });
          // Flags
          this._drawFlag(100, H * 0.65);
          this._drawFlag(W - 100, H * 0.65);
          // Fireworks
          for (let i = 0; i < 6; i++) {
            this.time.delayedCall(i * 500, () => {
              if (this.skipped) return;
              this._launchFirework();
            });
          }
          SoundManager.get().playExplosion();
          this.cameras.main.shake(400, 0.02);
          this.typewriterComplete = true;
          this.pageReady = true;
        },
      },
    ], 'CreditsScene');
  }

  // ═════════════════════════════════════════════════════════════
  // VISUAL HELPERS
  // ═════════════════════════════════════════════════════════════

  _sunriseBg() {
    const skyGfx = this.add.graphics().setDepth(0);
    this._addPageVisual(skyGfx);
    for (let y = 0; y < H; y++) {
      const t = y / H;
      let r, g, b;
      if (t < 0.25) { r = 8 + t * 40; g = 10 + t * 30; b = 50 + t * 100; }
      else if (t < 0.55) { const lt = (t - 0.25) / 0.3; r = 18 + lt * 220; g = 17 + lt * 140; b = 75 - lt * 40; }
      else if (t < 0.8) { const lt = (t - 0.55) / 0.25; r = 238 - lt * 30; g = 157 - lt * 70; b = 35 + lt * 120; }
      else { const lt = (t - 0.8) / 0.2; r = 208 - lt * 30; g = 87 - lt * 20; b = 155 + lt * 40; }
      skyGfx.fillStyle(Phaser.Display.Color.GetColor(r | 0, g | 0, b | 0), 1);
      skyGfx.fillRect(0, y, W, 1);
    }
    for (const c of [
      { x: 160, y: 100, w: 200, h: 30, color: 0xffaa88, alpha: 0.15 },
      { x: 500, y: 70, w: 260, h: 24, color: 0xff9977, alpha: 0.12 },
      { x: 750, y: 130, w: 180, h: 28, color: 0xffbb99, alpha: 0.18 },
    ]) {
      const cloud = this.add.ellipse(c.x, c.y, c.w, c.h, c.color, c.alpha).setDepth(1);
      this._addPageVisual(cloud);
    }
  }

  _drawCliff() {
    const gfx = this.add.graphics().setDepth(3);
    this._addPageVisual(gfx);
    gfx.fillStyle(0x1a1510, 1);
    gfx.beginPath();
    gfx.moveTo(280, H); gfx.lineTo(300, H - 100); gfx.lineTo(340, H - 130);
    gfx.lineTo(420, H - 150); gfx.lineTo(540, H - 150);
    gfx.lineTo(620, H - 130); gfx.lineTo(660, H - 100); gfx.lineTo(680, H);
    gfx.closePath(); gfx.fillPath();
  }

  _drawHero() {
    const gfx = this.add.graphics().setDepth(5);
    this._addPageVisual(gfx);
    const C = 0x0a0804;
    gfx.fillStyle(C, 1);
    gfx.fillCircle(0, -42, 13);
    gfx.fillEllipse(0, -50, 20, 10);
    gfx.fillRect(-5, -30, 10, 5);
    gfx.fillRect(-18, -26, 36, 6);
    gfx.fillRect(-15, -26, 30, 36);
    gfx.fillRect(-26, -24, 10, 28);
    gfx.fillRect(16, -24, 10, 28);
    gfx.fillCircle(-22, 6, 4);
    gfx.fillCircle(22, 6, 4);
    gfx.fillRect(-16, 8, 32, 4);
    gfx.fillRect(-13, 12, 11, 36);
    gfx.fillRect(2, 12, 11, 36);
    gfx.fillRect(-15, 46, 14, 7);
    gfx.fillRect(1, 46, 14, 7);
    gfx.fillStyle(0xffd700, 0.7);
    gfx.fillTriangle(-6, -8, 6, -8, 0, -18);
    gfx.fillTriangle(-6, -14, 6, -14, 0, -4);
    gfx.setPosition(W / 2, H - 150);
  }

  _drawDistantSmoke() {
    for (const sp of [{ x: 760, y: H - 180 }, { x: 800, y: H - 170 }, { x: 850, y: H - 185 }]) {
      for (let i = 0; i < 3; i++) {
        this.time.delayedCall(i * 800, () => {
          if (this.skipped) return;
          const smoke = this.add.rectangle(sp.x + Phaser.Math.Between(-3, 3), sp.y, 2, 12, 0x888888, 0.25).setDepth(2);
          this.tweens.add({ targets: smoke, y: sp.y - 60, alpha: 0, duration: 2500, onComplete: () => smoke.destroy() });
        });
      }
    }
  }

  _drawFlag(cx, cy) {
    const gfx = this.add.graphics().setDepth(20);
    this._addPageVisual(gfx);
    const fw = 80, fh = 55, fx = cx - fw / 2, fy = cy - fh / 2;
    gfx.fillStyle(0x888888, 0.8); gfx.fillRect(fx - 4, fy - 10, 3, fh + 30);
    gfx.fillStyle(0xffffff, 0.9); gfx.fillRect(fx, fy, fw, fh);
    gfx.fillStyle(0x0038b8, 0.9);
    gfx.fillRect(fx, fy + 6, fw, 7);
    gfx.fillRect(fx, fy + fh - 13, fw, 7);
    const ss = 10;
    gfx.lineStyle(2, 0x0038b8, 0.9);
    gfx.beginPath(); gfx.moveTo(cx, cy - ss); gfx.lineTo(cx - ss * 0.87, cy + ss * 0.5); gfx.lineTo(cx + ss * 0.87, cy + ss * 0.5); gfx.closePath(); gfx.strokePath();
    gfx.beginPath(); gfx.moveTo(cx, cy + ss); gfx.lineTo(cx - ss * 0.87, cy - ss * 0.5); gfx.lineTo(cx + ss * 0.87, cy - ss * 0.5); gfx.closePath(); gfx.strokePath();
    gfx.setAlpha(0);
    this.tweens.add({ targets: gfx, alpha: 1, duration: 500 });
    this.tweens.add({ targets: gfx, scaleX: 0.96, duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }

  _launchFirework() {
    if (this.skipped) return;
    const sx = Phaser.Math.Between(100, W - 100);
    const peakY = Phaser.Math.Between(80, 200);
    const rocket = this.add.circle(sx, H + 10, 3, 0xffffff, 0.9).setDepth(25);
    this.tweens.add({
      targets: rocket, y: peakY, duration: 600, ease: 'Cubic.easeOut',
      onComplete: () => {
        if (this.skipped) return;
        rocket.destroy();
        const colors = [0xFFD700, 0x0055ff, 0xffffff];
        for (let i = 0; i < 16; i++) {
          const a = (Math.PI * 2 * i) / 16;
          const d = 30 + Phaser.Math.Between(0, 30);
          const p = this.add.circle(sx, peakY, 2, Phaser.Utils.Array.GetRandom(colors), 1).setDepth(25);
          this.tweens.add({ targets: p, x: sx + Math.cos(a) * d, y: peakY + Math.sin(a) * d + 15, alpha: 0, duration: 600, onComplete: () => p.destroy() });
        }
      },
    });
  }

  update() { this._handlePageInput(); }
}
