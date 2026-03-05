// ═══════════════════════════════════════════════════════════════
// GameIntroScene — 30-second skippable opening cinematic
// Scene 1: World Map  →  Scene 2: The Villains  →  Scene 3: The Hero
// ═══════════════════════════════════════════════════════════════

import Phaser from 'phaser';
import BaseCinematicScene, { W, H } from './BaseCinematicScene.js';
import SoundManager from '../systems/SoundManager.js';
import MusicManager from '../systems/MusicManager.js';

export default class GameIntroScene extends BaseCinematicScene {
  constructor() { super('GameIntroScene'); }

  create() {
    MusicManager.get().playCinematicMusic(1);
    this._initCinematic();
    this._startScene1();
  }

  // ═════════════════════════════════════════════════════════════
  // SCENE 1 — THE WORLD MAP (8s)
  // ═════════════════════════════════════════════════════════════
  _startScene1() {
    // Create radar map background
    const mapGfx = this.add.graphics().setDepth(0);
    this.actObjects.push(mapGfx);

    // Black bg + green grid
    mapGfx.fillStyle(0x020204, 1);
    mapGfx.fillRect(0, 0, W, H);
    mapGfx.lineStyle(0.5, 0x00c800, 0.06);
    for (let x = 0; x < W; x += 48) {
      mapGfx.beginPath(); mapGfx.moveTo(x, 0); mapGfx.lineTo(x, H); mapGfx.strokePath();
    }
    for (let y = 0; y < H; y += 48) {
      mapGfx.beginPath(); mapGfx.moveTo(0, y); mapGfx.lineTo(W, y); mapGfx.strokePath();
    }
    // Scanlines
    for (let y = 0; y < H; y += 3) {
      mapGfx.fillStyle(0x00ff00, 0.005 + Math.random() * 0.004);
      mapGfx.fillRect(0, y, W, 1);
    }

    // Country outlines
    const countries = [
      { pts: [[120,260],[180,210],[210,230],[230,300],[250,370],[210,430],[150,450],[100,410],[80,320]], label: 'EGYPT' },
      { pts: [[240,215],[252,200],[262,215],[264,245],[260,270],[252,285],[244,270],[238,245]], label: 'ISRAEL' },
      { pts: [[265,220],[295,210],[312,230],[308,270],[292,300],[265,290],[260,260]], label: 'JORDAN' },
      { pts: [[278,155],[325,140],[358,155],[348,190],[315,205],[282,200],[272,180]], label: 'SYRIA' },
      { pts: [[358,155],[415,130],[465,150],[485,200],[475,270],[445,320],[405,340],[355,310],[335,260],[345,200]], label: 'IRAQ' },
      { pts: [[485,110],[545,90],[615,80],[695,90],[755,120],[785,180],[775,250],[745,310],[705,350],[645,370],[585,360],[525,320],[495,270],[485,200]], label: 'IRAN' },
      { pts: [[245,100],[315,80],[395,75],[465,85],[505,110],[475,140],[415,150],[355,155],[295,155],[265,140]], label: 'TURKEY' },
      { pts: [[260,150],[278,155],[272,180],[255,170]], label: 'LEBANON' },
      { pts: [[238,270],[252,285],[244,310],[230,300]], label: 'GAZA' },
    ];

    for (const c of countries) {
      mapGfx.lineStyle(1.2, 0x00c800, 0.35);
      mapGfx.beginPath();
      mapGfx.moveTo(c.pts[0][0], c.pts[0][1]);
      for (let i = 1; i < c.pts.length; i++) mapGfx.lineTo(c.pts[i][0], c.pts[i][1]);
      mapGfx.closePath();
      mapGfx.strokePath();
      mapGfx.fillStyle(0x005000, 0.04);
      mapGfx.fillPath();
    }

    // Sequential red light-up: Iran → Lebanon → Gaza → Syria
    const threats = [
      { name: 'IRAN', pts: countries[5].pts, delay: 800 },
      { name: 'LEBANON', pts: countries[7].pts, delay: 2000 },
      { name: 'GAZA', pts: countries[8].pts, delay: 3000 },
      { name: 'SYRIA', pts: countries[3].pts, delay: 4000 },
    ];

    for (const t of threats) {
      this.time.delayedCall(t.delay, () => {
        if (this.skipped) return;
        const gfx = this.add.graphics().setDepth(2);
        this.actObjects.push(gfx);
        gfx.fillStyle(0xff2222, 0.25);
        gfx.beginPath();
        gfx.moveTo(t.pts[0][0], t.pts[0][1]);
        for (let i = 1; i < t.pts.length; i++) gfx.lineTo(t.pts[i][0], t.pts[i][1]);
        gfx.closePath();
        gfx.fillPath();
        gfx.setAlpha(0);
        this.tweens.add({ targets: gfx, alpha: 1, duration: 400 });
        SoundManager.get().playMissileWarning();
      });
    }

    // Red connection lines
    const redLineGfx = this.add.graphics().setDepth(3);
    this.actObjects.push(redLineGfx);
    this.time.delayedCall(4500, () => {
      if (this.skipped) return;
      redLineGfx.lineStyle(1, 0xff2222, 0.5);
      const centers = [
        { x: 640, y: 210 }, // Iran
        { x: 265, y: 165 }, // Lebanon
        { x: 242, y: 290 }, // Gaza
        { x: 310, y: 178 }, // Syria
      ];
      for (let i = 1; i < centers.length; i++) {
        redLineGfx.beginPath();
        redLineGfx.moveTo(centers[0].x, centers[0].y);
        redLineGfx.lineTo(centers[i].x, centers[i].y);
        redLineGfx.strokePath();
      }
    });

    // Israel lights up BLUE/GOLD with pulse
    this.time.delayedCall(5000, () => {
      if (this.skipped) return;
      const isr = countries[1].pts;
      const gfx = this.add.graphics().setDepth(4);
      this.actObjects.push(gfx);
      gfx.fillStyle(0x3366ff, 0.35);
      gfx.beginPath();
      gfx.moveTo(isr[0][0], isr[0][1]);
      for (let i = 1; i < isr.length; i++) gfx.lineTo(isr[i][0], isr[i][1]);
      gfx.closePath();
      gfx.fillPath();

      // Gold pulse ring around Israel
      const ring = this.add.circle(252, 245, 8, 0xffd700, 0.4).setDepth(5);
      this.actObjects.push(ring);
      this.tweens.add({ targets: ring, scale: 4, alpha: 0, duration: 1000, repeat: -1 });
    });

    // Typewriter text
    this.time.delayedCall(5500, () => {
      if (this.skipped) return;
      this._typewriter(W / 2, H - 60, 'THEY THOUGHT THEY WERE SAFE...', '#ff2222', 20, 50);
    });

    // Transition to Scene 2
    this.time.delayedCall(7500, () => {
      if (this.skipped) return;
      this.cameras.main.fadeOut(500, 0, 0, 0);
    });
    this.time.delayedCall(8000, () => {
      if (this.skipped) return;
      this._clearAct();
      this.cameras.main.fadeIn(400, 0, 0, 0);
      this._startScene2();
    });
  }

  // ═════════════════════════════════════════════════════════════
  // SCENE 2 — THE VILLAINS (10s)
  // ═════════════════════════════════════════════════════════════
  _startScene2() {
    // Dark background
    const bg = this.add.rectangle(W / 2, H / 2, W, H, 0x060608).setDepth(0);
    this.actObjects.push(bg);

    const header = this.add.text(W / 2, 30, 'SIX TARGETS. SIX MISSIONS.', {
      fontFamily: 'monospace', fontSize: '18px', color: '#ff2222',
      shadow: { offsetX: 0, offsetY: 0, color: '#ff2222', blur: 8, fill: true },
    }).setOrigin(0.5).setDepth(10);
    this.actObjects.push(header);

    // 6 panels in 2×3 grid
    const panels = [
      { label: 'TEHRAN', sub: 'Azadi Tower', color: 0x884422 },
      { label: 'BEIRUT', sub: 'Radar Network', color: 0x226644 },
      { label: 'LEBANON', sub: 'Underground Bunker', color: 0x446622 },
      { label: 'GAZA', sub: 'Tunnel Network', color: 0x664422 },
      { label: 'NATANZ', sub: 'Nuclear Facility', color: 0x226644 },
      { label: 'THE COMMANDER', sub: 'Final Boss', color: 0x662222 },
    ];

    const cols = 3, gapX = 260, gapY = 190;
    const startX = 200, startY = 120;

    panels.forEach((p, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const px = startX + col * gapX;
      const py = startY + row * gapY;

      this.time.delayedCall(500 + i * 1200, () => {
        if (this.skipped) return;

        // Panel background
        const panel = this.add.rectangle(px, py + 40, 220, 140, p.color, 0.4).setDepth(5);
        panel.setScale(0);
        this.actObjects.push(panel);
        this.tweens.add({ targets: panel, scaleX: 1, scaleY: 1, duration: 300, ease: 'Back.easeOut' });

        // Panel border
        const border = this.add.rectangle(px, py + 40, 220, 140).setDepth(6);
        border.setStrokeStyle(1, 0xff4444, 0.5);
        border.setFillStyle(0, 0);
        border.setScale(0);
        this.actObjects.push(border);
        this.tweens.add({ targets: border, scaleX: 1, scaleY: 1, duration: 300, ease: 'Back.easeOut' });

        // Icon area (threat specific)
        const iconGfx = this.add.graphics().setDepth(7);
        this.actObjects.push(iconGfx);
        this._drawThreatIcon(iconGfx, px, py + 20, i);

        // Label
        const label = this.add.text(px, py + 80, p.label, {
          fontFamily: 'monospace', fontSize: '14px', color: '#ffffff',
          shadow: { offsetX: 0, offsetY: 0, color: '#ffffff', blur: 4, fill: true },
        }).setOrigin(0.5).setDepth(8);
        this.actObjects.push(label);

        const subLabel = this.add.text(px, py + 98, p.sub, {
          fontFamily: 'monospace', fontSize: '10px', color: '#888888',
        }).setOrigin(0.5).setDepth(8);
        this.actObjects.push(subLabel);

        SoundManager.get().playBombImpact();
      });
    });

    // Transition to Scene 3
    this.time.delayedCall(9000, () => {
      if (this.skipped) return;
      this.cameras.main.fadeOut(500, 0, 0, 0);
    });
    this.time.delayedCall(9500, () => {
      if (this.skipped) return;
      this._clearAct();
      this.cameras.main.fadeIn(400, 0, 0, 0);
      this._startScene3();
    });
  }

  _drawThreatIcon(gfx, cx, cy, index) {
    switch (index) {
      case 0: // Tehran — Azadi Tower silhouette
        gfx.fillStyle(0x886644, 0.6);
        gfx.fillRect(cx - 3, cy - 30, 6, 40);
        gfx.fillTriangle(cx - 18, cy + 10, cx + 18, cy + 10, cx, cy - 35);
        break;
      case 1: // Beirut — Radar screen
        gfx.fillStyle(0x004400, 0.6);
        gfx.fillCircle(cx, cy, 22);
        gfx.lineStyle(1, 0x00ff00, 0.4);
        gfx.strokeCircle(cx, cy, 10);
        gfx.strokeCircle(cx, cy, 20);
        gfx.beginPath(); gfx.moveTo(cx, cy); gfx.lineTo(cx + 18, cy - 8); gfx.strokePath();
        break;
      case 2: // Lebanon — Bunker in mountain
        gfx.fillStyle(0x444422, 0.6);
        gfx.fillTriangle(cx - 30, cy + 15, cx + 30, cy + 15, cx, cy - 25);
        gfx.fillStyle(0x222222, 0.8);
        gfx.fillRect(cx - 8, cy + 2, 16, 13);
        break;
      case 3: // Gaza — Tunnel network
        gfx.fillStyle(0x443322, 0.6);
        gfx.fillRect(cx - 25, cy - 5, 50, 3);
        gfx.fillRect(cx - 20, cy + 5, 40, 3);
        gfx.fillRect(cx - 15, cy + 15, 30, 3);
        gfx.lineStyle(1, 0x664433, 0.5);
        gfx.beginPath(); gfx.moveTo(cx - 15, cy - 5); gfx.lineTo(cx - 10, cy + 5); gfx.strokePath();
        gfx.beginPath(); gfx.moveTo(cx + 10, cy - 5); gfx.lineTo(cx + 5, cy + 5); gfx.strokePath();
        gfx.beginPath(); gfx.moveTo(cx - 5, cy + 5); gfx.lineTo(cx, cy + 15); gfx.strokePath();
        break;
      case 4: // Natanz — Mountain with green glow
        gfx.fillStyle(0x444422, 0.6);
        gfx.fillTriangle(cx - 30, cy + 15, cx + 30, cy + 15, cx, cy - 25);
        gfx.fillStyle(0x00ff00, 0.15);
        gfx.fillCircle(cx, cy, 12);
        gfx.fillStyle(0x00ff00, 0.3);
        gfx.fillCircle(cx, cy, 5);
        break;
      case 5: // Commander — Dark silhouette with red eyes
        gfx.fillStyle(0x1a1a1a, 0.8);
        gfx.fillCircle(cx, cy - 12, 12);
        gfx.fillRect(cx - 14, cy, 28, 25);
        gfx.fillStyle(0xff0000, 0.9);
        gfx.fillCircle(cx - 5, cy - 14, 2);
        gfx.fillCircle(cx + 5, cy - 14, 2);
        break;
    }
  }

  // ═════════════════════════════════════════════════════════════
  // SCENE 3 — THE HERO (8s)
  // ═════════════════════════════════════════════════════════════
  _startScene3() {
    // Golden sunrise gradient rising from bottom
    const sunriseGfx = this.add.graphics().setDepth(0);
    this.actObjects.push(sunriseGfx);

    for (let y = 0; y < H; y++) {
      const t = y / H;
      let r, g, b;
      if (t < 0.3) {
        r = 10; g = 5; b = 20 + t * 30;
      } else if (t < 0.6) {
        const lt = (t - 0.3) / 0.3;
        r = 10 + lt * 180; g = 5 + lt * 80; b = 30 - lt * 10;
      } else {
        const lt = (t - 0.6) / 0.4;
        r = 190 + lt * 65; g = 85 + lt * 100; b = 20 + lt * 40;
      }
      sunriseGfx.fillStyle(Phaser.Display.Color.GetColor(r | 0, g | 0, b | 0), 1);
      sunriseGfx.fillRect(0, y, W, 1);
    }

    // Sun glow at bottom center
    const sunCircle = this.add.circle(W / 2, H - 40, 60, 0xffcc40, 0.5).setDepth(1);
    this.actObjects.push(sunCircle);
    this.tweens.add({ targets: sunCircle, alpha: 0.8, scale: 1.3, duration: 2000, yoyo: true, repeat: -1 });

    // SuperZion silhouette (drawn inline, facing away initially)
    const silGfx = this.add.graphics().setDepth(5);
    this.actObjects.push(silGfx);
    this._drawHeroSilhouette(silGfx, W / 2, H - 180);

    // "Turns around" — flipX tween via container
    const starGlow = this.add.circle(W / 2, H - 170, 8, 0xffd700, 0).setDepth(6);
    this.actObjects.push(starGlow);
    this.time.delayedCall(2000, () => {
      if (this.skipped) return;
      // Flash + Star of David glow
      this.tweens.add({ targets: silGfx, scaleX: -1, duration: 300, ease: 'Sine.easeInOut',
        onComplete: () => {
          this.tweens.add({ targets: silGfx, scaleX: 1, duration: 300, ease: 'Sine.easeInOut' });
        }
      });
      this.tweens.add({ targets: starGlow, alpha: 0.7, duration: 400, yoyo: true, repeat: 3 });
    });

    // Vehicle silhouettes appear
    this.time.delayedCall(3000, () => {
      if (this.skipped) return;
      const vGfx = this.add.graphics().setDepth(3);
      this.actObjects.push(vGfx);
      vGfx.setAlpha(0);

      // F-15 outline
      vGfx.fillStyle(0x1a1008, 0.7);
      vGfx.fillTriangle(120, 200, 180, 180, 180, 220);
      vGfx.fillRect(140, 190, 60, 20);

      // B-2 outline
      vGfx.fillTriangle(700, 200, 800, 220, 600, 220);

      // Drone outline
      vGfx.fillRect(430, 180, 30, 6);
      vGfx.fillRect(435, 174, 20, 6);
      vGfx.fillRect(440, 186, 10, 10);

      this.tweens.add({ targets: vGfx, alpha: 0.6, duration: 800 });
    });

    // Typewriter text
    this.time.delayedCall(3500, () => {
      if (this.skipped) return;
      this._typewriter(W / 2, 50, 'ONE SOLDIER. SIX MISSIONS.', '#ffffff', 18, 45);
    });

    // SUPERZION title with flash
    this.time.delayedCall(5500, () => {
      if (this.skipped) return;
      // White flash
      const flash = this.add.rectangle(W / 2, H / 2, W, H, 0xffffff, 0.8).setDepth(30);
      this.actObjects.push(flash);
      this.tweens.add({ targets: flash, alpha: 0, duration: 500 });
      SoundManager.get().playExplosion();

      const title = this.add.text(W / 2, 100, 'SUPERZION', {
        fontFamily: 'monospace', fontSize: '52px', color: '#FFD700',
        shadow: { offsetX: 0, offsetY: 0, color: '#FFD700', blur: 25, fill: true },
      }).setOrigin(0.5).setDepth(25);
      this.actObjects.push(title);
      title.setAlpha(0);
      this.tweens.add({ targets: title, alpha: 1, duration: 300 });
      this.tweens.add({
        targets: title, scaleX: 1.05, scaleY: 1.05,
        duration: 800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
      });
    });

    // Fade to MenuScene
    this.time.delayedCall(7500, () => {
      if (this.skipped) return;
      this.cameras.main.fadeOut(500, 0, 0, 0);
    });
    this.time.delayedCall(8000, () => {
      if (this.skipped) return;
      MusicManager.get().stop(0.3);
      this.scene.start('MenuScene');
    });
  }

  _drawHeroSilhouette(gfx, cx, cy) {
    gfx.fillStyle(0x0a0804, 1);
    // Head
    gfx.fillCircle(cx, cy - 40, 12);
    // Kippah
    gfx.fillStyle(0x080604, 1);
    gfx.fillRect(cx - 10, cy - 52, 20, 6);
    // Body
    gfx.fillStyle(0x0a0804, 1);
    gfx.fillRect(cx - 12, cy - 26, 24, 34);
    // Arms
    gfx.fillRect(cx - 22, cy - 24, 10, 26);
    gfx.fillRect(cx + 12, cy - 24, 10, 26);
    // Legs
    gfx.fillRect(cx - 10, cy + 8, 9, 36);
    gfx.fillRect(cx + 1, cy + 8, 9, 36);
    // Boots
    gfx.fillRect(cx - 12, cy + 42, 12, 6);
    gfx.fillRect(cx, cy + 42, 12, 6);
  }

  update() {
    this._handleMuteToggle();
    if (!this.skipped && Phaser.Input.Keyboard.JustDown(this.enterKey)) {
      this.skipped = true;
      MusicManager.get().stop(0.3);
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.time.delayedCall(350, () => this.scene.start('MenuScene'));
    }
  }
}
