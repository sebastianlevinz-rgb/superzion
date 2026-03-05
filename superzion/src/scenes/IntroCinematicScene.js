// ═══════════════════════════════════════════════════════════════
// IntroCinematicScene — Tel Aviv → Flight Map → Tehran
// ═══════════════════════════════════════════════════════════════

import Phaser from 'phaser';
import SoundManager from '../systems/SoundManager.js';
import MusicManager from '../systems/MusicManager.js';

const W = 960;
const H = 540;

export default class IntroCinematicScene extends Phaser.Scene {
  constructor() { super('IntroCinematicScene'); }

  create() {
    this.cameras.main.setBackgroundColor('#000000');
    MusicManager.get().playCinematicMusic(1);
    this.actObjects = [];
    this.currentAct = 0;
    this.skipped = false;

    this._generateTextures();

    // Skip hint (persistent across all acts)
    this.skipHint = this.add.text(W - 16, H - 14, 'ENTER TO SKIP', {
      fontFamily: 'monospace', fontSize: '10px', color: '#444444',
    });
    this.skipHint.setOrigin(1, 1);
    this.skipHint.setDepth(100);

    // Input
    this.enterKey = this.input.keyboard.addKey('ENTER');
    this.mKey = this.input.keyboard.addKey('M');

    // Start Act 1
    this._startAct1();
  }

  // ── Texture generation ──────────────────────────────────────
  _generateTextures() {
    if (!this.textures.exists('telaviv_bg'))      this._createTelAvivBg();
    if (!this.textures.exists('radar_map'))        this._createRadarMap();
    if (!this.textures.exists('intro_silhouette')) this._createSilhouette();
  }

  // ── Tel Aviv night skyline ──────────────────────────────────
  _createTelAvivBg() {
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const ctx = c.getContext('2d');

    // Night sky gradient
    const sky = ctx.createLinearGradient(0, 0, 0, 340);
    sky.addColorStop(0, '#040810');
    sky.addColorStop(0.5, '#0a1428');
    sky.addColorStop(1, '#0e1a38');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, 340);

    // Stars
    for (let i = 0; i < 90; i++) {
      ctx.fillStyle = `rgba(255,255,255,${0.15 + Math.random() * 0.6})`;
      ctx.beginPath();
      ctx.arc(Math.random() * W, Math.random() * 260, 0.3 + Math.random() * 0.8, 0, Math.PI * 2);
      ctx.fill();
    }

    // Moon
    ctx.fillStyle = 'rgba(225,225,210,0.8)';
    ctx.beginPath(); ctx.arc(790, 55, 14, 0, Math.PI * 2); ctx.fill();
    const mg = ctx.createRadialGradient(790, 55, 14, 790, 55, 42);
    mg.addColorStop(0, 'rgba(200,200,180,0.1)');
    mg.addColorStop(1, 'rgba(200,200,180,0)');
    ctx.fillStyle = mg;
    ctx.beginPath(); ctx.arc(790, 55, 42, 0, Math.PI * 2); ctx.fill();

    // Mediterranean sea
    const sea = ctx.createLinearGradient(0, 380, 0, H);
    sea.addColorStop(0, '#0a2040');
    sea.addColorStop(1, '#061830');
    ctx.fillStyle = sea;
    ctx.fillRect(0, 380, W, 160);

    // Beach strip
    ctx.fillStyle = '#1a1810';
    ctx.fillRect(0, 370, W, 12);

    // Water shimmer
    for (let i = 0; i < 20; i++) {
      ctx.fillStyle = `rgba(150,180,220,${0.02 + Math.random() * 0.04})`;
      ctx.fillRect(Math.random() * W, 400 + Math.random() * 100, 20 + Math.random() * 40, 1);
    }

    // Tel Aviv buildings — simple white/cyan rectangles
    const groundY = 370;
    const bldgs = [
      // Left — Bauhaus district
      { x: 40,  w: 45, h: 55, c: '#d8dce8' },
      { x: 95,  w: 38, h: 42, c: '#c8ccd8' },
      { x: 140, w: 50, h: 65, c: '#d0d4e0' },
      { x: 198, w: 40, h: 50, c: '#c5c9d5' },
      { x: 245, w: 48, h: 58, c: '#d8dce8' },
      // Center — Azrieli towers
      { x: 350, w: 30, h: 180, c: '#b0c8e0' },   // main tall tower
      { x: 385, w: 26, h: 155, c: '#a8c0d8' },
      { x: 415, w: 28, h: 140, c: '#b8d0e8' },
      // Surrounding towers
      { x: 310, w: 22, h: 110, c: '#c0c8d8' },
      { x: 450, w: 24, h: 95,  c: '#b8c0d0' },
      { x: 480, w: 28, h: 75,  c: '#c8d0e0' },
      // Right side
      { x: 530, w: 42, h: 60, c: '#d0d4e0' },
      { x: 580, w: 38, h: 48, c: '#c8ccd8' },
      { x: 625, w: 45, h: 55, c: '#d8dce8' },
      { x: 678, w: 40, h: 45, c: '#c5c9d5' },
    ];

    for (const b of bldgs) {
      ctx.fillStyle = b.c;
      ctx.fillRect(b.x, groundY - b.h, b.w, b.h);
      // Lit windows
      for (let wy = groundY - b.h + 6; wy < groundY - 4; wy += 8) {
        for (let wx = b.x + 3; wx < b.x + b.w - 4; wx += 6) {
          if (Math.random() < 0.35) {
            ctx.fillStyle = `rgba(255,${200 + Math.random() * 55 | 0},${100 + Math.random() * 50 | 0},${0.4 + Math.random() * 0.4})`;
            ctx.fillRect(wx, wy, 3, 4);
          } else {
            ctx.fillStyle = 'rgba(50,60,80,0.3)';
            ctx.fillRect(wx, wy, 3, 4);
          }
        }
      }
    }

    // Azrieli antenna + red blinking light
    ctx.fillStyle = '#8090a0';
    ctx.fillRect(363, groundY - 192, 2, 14);
    ctx.fillStyle = 'rgba(255,30,30,0.8)';
    ctx.beginPath(); ctx.arc(364, groundY - 194, 2, 0, Math.PI * 2); ctx.fill();

    this.textures.addCanvas('telaviv_bg', c);
  }

  // ── Radar-style Middle East map ─────────────────────────────
  _createRadarMap() {
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const ctx = c.getContext('2d');

    // Black background
    ctx.fillStyle = '#020204';
    ctx.fillRect(0, 0, W, H);

    // Green grid (subtle)
    ctx.strokeStyle = 'rgba(0,200,0,0.06)';
    ctx.lineWidth = 0.5;
    for (let x = 0; x < W; x += 48) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let y = 0; y < H; y += 48) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }

    // CRT scan lines
    for (let y = 0; y < H; y += 3) {
      ctx.fillStyle = `rgba(0,255,0,${0.007 + Math.random() * 0.005})`;
      ctx.fillRect(0, y, W, 1);
    }

    // Country OUTLINES (green stroke, no fill — radar style)
    const countries = [
      { pts: [[120,260],[180,210],[210,230],[230,300],[250,370],[210,430],[150,450],[100,410],[80,320]],
        label: 'EGYPT', lx: 125, ly: 345 },
      { pts: [[240,215],[252,200],[262,215],[264,245],[260,270],[252,285],[244,270],[238,245]],
        label: 'ISRAEL', lx: 218, ly: 256 },
      { pts: [[265,220],[295,210],[312,230],[308,270],[292,300],[265,290],[260,260]],
        label: 'JORDAN', lx: 268, ly: 262 },
      { pts: [[278,155],[325,140],[358,155],[348,190],[315,205],[282,200],[272,180]],
        label: 'SYRIA', lx: 298, ly: 178 },
      { pts: [[358,155],[415,130],[465,150],[485,200],[475,270],[445,320],[405,340],[355,310],[335,260],[345,200]],
        label: 'IRAQ', lx: 395, ly: 245 },
      { pts: [[485,110],[545,90],[615,80],[695,90],[755,120],[785,180],[775,250],[745,310],[705,350],[645,370],[585,360],[525,320],[495,270],[485,200]],
        label: 'IRAN', lx: 625, ly: 215 },
      { pts: [[245,100],[315,80],[395,75],[465,85],[505,110],[475,140],[415,150],[355,155],[295,155],[265,140]],
        label: 'TURKEY', lx: 355, ly: 115 },
      { pts: [[272,300],[315,295],[405,340],[525,380],[545,460],[435,490],[315,480],[235,430],[225,360]],
        label: 'S. ARABIA', lx: 355, ly: 425 },
    ];

    for (const country of countries) {
      // Outline stroke only
      ctx.strokeStyle = 'rgba(0,200,0,0.35)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(country.pts[0][0], country.pts[0][1]);
      for (let i = 1; i < country.pts.length; i++) {
        ctx.lineTo(country.pts[i][0], country.pts[i][1]);
      }
      ctx.closePath();
      ctx.stroke();

      // Very subtle interior fill
      ctx.fillStyle = 'rgba(0,80,0,0.04)';
      ctx.fill();

      // Label
      ctx.font = '8px monospace';
      ctx.fillStyle = 'rgba(0,180,0,0.22)';
      ctx.fillText(country.label, country.lx, country.ly);
    }

    // Border frame
    ctx.strokeStyle = 'rgba(0,180,0,0.15)';
    ctx.lineWidth = 1;
    ctx.strokeRect(4, 4, W - 8, H - 8);

    // Corner markers
    ctx.fillStyle = 'rgba(0,200,0,0.2)';
    ctx.font = '7px monospace';
    ctx.fillText('35°N', 10, 18);
    ctx.fillText('25°N', 10, H - 10);
    ctx.fillText('30°E', W - 40, H - 10);
    ctx.fillText('60°E', W - 40, 18);

    this.textures.addCanvas('radar_map', c);
  }

  // ── Player silhouette ───────────────────────────────────────
  _createSilhouette() {
    const c = document.createElement('canvas');
    c.width = 64; c.height = 96;
    const ctx = c.getContext('2d');

    ctx.fillStyle = '#0a0a0a';
    // Head
    ctx.beginPath(); ctx.arc(32, 14, 10, 0, Math.PI * 2); ctx.fill();
    // Body
    ctx.fillRect(24, 24, 16, 28);
    // Legs
    ctx.fillRect(24, 52, 7, 28);
    ctx.fillRect(33, 52, 7, 28);
    // Arms (no weapon — stealth operative)
    ctx.fillRect(16, 26, 8, 22);
    ctx.fillRect(40, 26, 8, 22);
    // Kippah
    ctx.fillStyle = '#0e0e16';
    ctx.beginPath(); ctx.arc(32, 8, 7, Math.PI, 0); ctx.fill();

    this.textures.addCanvas('intro_silhouette', c);
  }

  // ── Utilities ───────────────────────────────────────────────
  _clearAct() {
    for (const obj of this.actObjects) {
      if (obj && obj.destroy) obj.destroy();
    }
    this.actObjects = [];
  }

  _typewriter(x, y, text, color, size, charDelay) {
    const t = this.add.text(x, y, '', {
      fontFamily: 'monospace', fontSize: `${size}px`, color: color,
      shadow: { offsetX: 0, offsetY: 0, color: color, blur: 6, fill: true },
    });
    t.setOrigin(0.5); t.setDepth(10);
    this.actObjects.push(t);

    let idx = 0;
    const timer = this.time.addEvent({
      delay: charDelay, repeat: text.length - 1,
      callback: () => {
        if (this.skipped) return;
        idx++;
        t.setText(text.substring(0, idx));
        SoundManager.get().playTypewriterClick();
      },
    });
    this.actObjects.push(timer);
    return t;
  }

  _lerpPath(waypoints, t) {
    const n = waypoints.length - 1;
    const seg = Math.min(Math.floor(t * n), n - 1);
    const lt = (t * n) - seg;
    const a = waypoints[seg], b = waypoints[Math.min(seg + 1, n)];
    return { x: a.x + (b.x - a.x) * lt, y: a.y + (b.y - a.y) * lt };
  }

  // ═════════════════════════════════════════════════════════════
  // ACT 1 — TEL AVIV (3s content + 1s fade)
  // ═════════════════════════════════════════════════════════════
  _startAct1() {
    this.currentAct = 1;

    // Background
    const bg = this.add.image(W / 2, H / 2, 'telaviv_bg');
    bg.setDepth(0); bg.setAlpha(0);
    this.actObjects.push(bg);
    this.tweens.add({ targets: bg, alpha: 1, duration: 600 });

    // Player silhouette on the RIGHT, facing right
    const sil = this.add.image(760, 340, 'intro_silhouette');
    sil.setScale(0.8); sil.setAlpha(0); sil.setDepth(1);
    this.actObjects.push(sil);
    this.tweens.add({ targets: sil, alpha: 0.85, duration: 400, delay: 300 });

    // Typewriter text
    this.time.delayedCall(500, () => {
      if (this.skipped) return;
      this._typewriter(W / 2, 480, 'TEL AVIV, ISRAEL \u2014 02:00 HRS', '#00e5ff', 14, 45);
    });

    // Fade out after 3s
    this.time.delayedCall(3000, () => {
      if (this.skipped) return;
      this.cameras.main.fadeOut(800, 0, 0, 0);
    });

    // Transition to Act 2 at ~4s
    this.time.delayedCall(4000, () => {
      if (this.skipped) return;
      this._clearAct();
      this.cameras.main.fadeIn(400, 0, 0, 0);
      this._startAct2();
    });
  }

  // ═════════════════════════════════════════════════════════════
  // ACT 2 — FLIGHT MAP (4s content + 1s fade)
  // ═════════════════════════════════════════════════════════════
  _startAct2() {
    this.currentAct = 2;

    // Radar map background
    const map = this.add.image(W / 2, H / 2, 'radar_map');
    map.setDepth(0); map.setAlpha(0);
    this.actObjects.push(map);
    this.tweens.add({ targets: map, alpha: 1, duration: 400 });

    // Positions on the map
    const israelPos = { x: 252, y: 245 };
    const iranPos   = { x: 640, y: 210 };

    // Cyan blinking dot — Israel (origin)
    const israelDot = this.add.circle(israelPos.x, israelPos.y, 5, 0x00ffff, 0.8);
    israelDot.setDepth(5);
    this.actObjects.push(israelDot);
    this.tweens.add({ targets: israelDot, scale: 1.6, alpha: 0.2, duration: 500, yoyo: true, repeat: -1 });

    // Israel pulse ring
    const israelRing = this.add.circle(israelPos.x, israelPos.y, 5, 0x00ffff, 0);
    israelRing.setDepth(4); israelRing.setStrokeStyle(1, 0x00ffff, 0.4);
    this.actObjects.push(israelRing);
    this.tweens.add({ targets: israelRing, scale: 3, alpha: 0, duration: 1200, repeat: -1 });

    // Red blinking dot — Iran (target, appears after 0.8s)
    const iranDot = this.add.circle(iranPos.x, iranPos.y, 5, 0xff0000, 0);
    iranDot.setDepth(5);
    this.actObjects.push(iranDot);
    this.time.delayedCall(800, () => {
      if (this.skipped) return;
      iranDot.setAlpha(0.8);
      this.tweens.add({ targets: iranDot, scale: 1.6, alpha: 0.2, duration: 500, yoyo: true, repeat: -1 });

      const iranRing = this.add.circle(iranPos.x, iranPos.y, 5, 0xff0000, 0);
      iranRing.setDepth(4); iranRing.setStrokeStyle(1, 0xff0000, 0.4);
      this.actObjects.push(iranRing);
      this.tweens.add({ targets: iranRing, scale: 3, alpha: 0, duration: 1200, repeat: -1 });
    });

    // Flight path waypoints
    const waypoints = [
      israelPos,
      { x: 310, y: 228 },
      { x: 380, y: 215 },
      { x: 460, y: 205 },
      { x: 540, y: 203 },
      { x: 595, y: 208 },
      iranPos,
    ];

    // Animated dashed red line + plane triangle
    const lineGfx = this.add.graphics();
    lineGfx.setDepth(3);
    this.actObjects.push(lineGfx);

    const planeGfx = this.add.graphics();
    planeGfx.setDepth(6);
    this.actObjects.push(planeGfx);

    let progress = 0;
    const flightDur = 2800;
    const flightTimer = this.time.addEvent({
      delay: 30, repeat: Math.ceil(flightDur / 30),
      callback: () => {
        if (this.skipped) return;
        progress = Math.min(progress + 30 / flightDur, 1);

        // Draw dashed red line up to current progress
        lineGfx.clear();
        lineGfx.lineStyle(1.5, 0xff2222, 0.7);
        const totalSegs = 80;
        for (let i = 0; i < totalSegs; i++) {
          const t0 = i / totalSegs;
          const t1 = (i + 1) / totalSegs;
          if (t1 > progress) break;
          if (i % 2 === 0) { // dash pattern
            const p0 = this._lerpPath(waypoints, t0);
            const p1 = this._lerpPath(waypoints, t1);
            lineGfx.beginPath();
            lineGfx.moveTo(p0.x, p0.y);
            lineGfx.lineTo(p1.x, p1.y);
            lineGfx.strokePath();
          }
        }

        // Draw green triangle (plane) at current position
        const pos = this._lerpPath(waypoints, progress);
        planeGfx.clear();
        let angle = 0;
        if (progress < 0.95) {
          const next = this._lerpPath(waypoints, Math.min(progress + 0.05, 1));
          angle = Math.atan2(next.y - pos.y, next.x - pos.x);
        }
        const sz = 7;
        planeGfx.fillStyle(0x00ff00, 0.9);
        planeGfx.beginPath();
        planeGfx.moveTo(pos.x + Math.cos(angle) * sz, pos.y + Math.sin(angle) * sz);
        planeGfx.lineTo(pos.x + Math.cos(angle + 2.5) * sz * 0.7, pos.y + Math.sin(angle + 2.5) * sz * 0.7);
        planeGfx.lineTo(pos.x + Math.cos(angle - 2.5) * sz * 0.7, pos.y + Math.sin(angle - 2.5) * sz * 0.7);
        planeGfx.closePath();
        planeGfx.fillPath();
      },
    });
    this.actObjects.push(flightTimer);

    // Text
    this.time.delayedCall(300, () => {
      if (this.skipped) return;
      this._typewriter(W / 2, 475, 'CLASSIFIED \u2014 OPERATION TEHRAN', '#ff2222', 13, 40);
    });

    // Fade out after 4s
    this.time.delayedCall(4000, () => {
      if (this.skipped) return;
      this.cameras.main.fadeOut(800, 0, 0, 0);
    });

    // Transition to Act 3 at ~5s
    this.time.delayedCall(5000, () => {
      if (this.skipped) return;
      this._clearAct();
      this.cameras.main.fadeIn(400, 0, 0, 0);
      this._startAct3();
    });
  }

  // ═════════════════════════════════════════════════════════════
  // ACT 3 — TEHRAN ARRIVAL (3s content + 1s fade)
  // ═════════════════════════════════════════════════════════════
  _startAct3() {
    this.currentAct = 3;

    // Reuse game background textures (generated by MenuScene)
    const layers = [
      { key: 'sky_gradient', depth: 0 },
      { key: 'mountains',    depth: 1 },
      { key: 'clouds',       depth: 2 },
      { key: 'skyline',      depth: 3 },
      { key: 'facades',      depth: 4 },
    ];

    for (const l of layers) {
      if (this.textures.exists(l.key)) {
        const img = this.add.image(W / 2, H / 2, l.key);
        img.setDepth(l.depth); img.setAlpha(0);
        this.actObjects.push(img);
        this.tweens.add({ targets: img, alpha: 1, duration: 500 });
      }
    }

    // Dark overlay for text readability
    const ov = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0);
    ov.setDepth(5);
    this.actObjects.push(ov);
    this.tweens.add({ targets: ov, alpha: 0.2, duration: 500 });

    // Player drops from above
    const sil = this.add.image(640, -50, 'intro_silhouette');
    sil.setScale(0.8); sil.setAlpha(0); sil.setDepth(6);
    this.actObjects.push(sil);
    this.tweens.add({
      targets: sil, y: 360, alpha: 0.9,
      duration: 700, delay: 200, ease: 'Bounce.easeOut',
    });

    // Typewriter texts
    this.time.delayedCall(500, () => {
      if (this.skipped) return;
      this._typewriter(W / 2, 440, 'TEHRAN, IRAN \u2014 06:00 HRS', '#00e5ff', 14, 45);
    });

    this.time.delayedCall(1600, () => {
      if (this.skipped) return;
      this._typewriter(W / 2, 470, 'OBJECTIVE: DESTROY COMMUNICATIONS CENTER', '#ff8800', 11, 30);
    });

    // Fade out after 3s
    this.time.delayedCall(3000, () => {
      if (this.skipped) return;
      this.cameras.main.fadeOut(800, 0, 0, 0);
    });

    // Transition to GameScene at ~4s
    this.time.delayedCall(4000, () => {
      if (this.skipped) return;
      this.scene.start('GameScene');
    });
  }

  // ── UPDATE (skip handling) ──────────────────────────────────
  update() {
    if (Phaser.Input.Keyboard.JustDown(this.mKey)) {
      const muted = SoundManager.get().toggleMute();
      MusicManager.get().setMuted(muted);
    }
    if (!this.skipped && Phaser.Input.Keyboard.JustDown(this.enterKey)) {
      this.skipped = true;
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.time.delayedCall(350, () => this.scene.start('GameScene'));
    }
  }
}
