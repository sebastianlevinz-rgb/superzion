// ═══════════════════════════════════════════════════════════════
// VictoryScene — Epic victory narrative after defeating Supreme Turban
// Page-by-page text with SPACE/ENTER, ends with "Am Yisrael Chai"
// Phase 37-02: New narrative, forward-facing hero, animated sunrise, clouds
// ═══════════════════════════════════════════════════════════════

import Phaser from 'phaser';
import BaseCinematicScene, { W, H } from './BaseCinematicScene.js';
import SoundManager from '../systems/SoundManager.js';
import MusicManager from '../systems/MusicManager.js';
import { drawSuperZionForward } from '../utils/SuperZionRenderer.js';

export default class VictoryScene extends BaseCinematicScene {
  constructor() { super('VictoryScene'); }

  create() {
    MusicManager.get().playVictoryMusic();
    this._initCinematic();

    // Confetti & celebrator tracking (Plan 03 will use these)
    this._confettiParticles = [];
    this._confettiTimer = null;
    this._celebratorTweens = [];

    // Persistent sunrise elements that animate across pages
    this._sunCircle = null;
    this._sunTween = null;
    this._cloudObjects = [];

    this._initPages([
      {
        // Page 0 — opening, black screen, gold text, slow charDelay
        text: "The weapons are silent. For the first time in years... silence.",
        color: '#FFD700', size: 32, y: H * 0.45, charDelay: 40,
      },
      {
        // Page 1 — ashes/peace
        text: "Where there were ashes, there will be gardens. Where there was fear, children will play again.",
        color: '#ffffff', size: 20, y: H * 0.45,
      },
      {
        // Page 2 — 3000 years
        text: "For 3,000 years they tried to erase us. Empire after empire. Name after name.",
        color: '#cccccc', size: 22, y: H * 0.45,
      },
      {
        // Page 3 — belongs to every soul
        text: "This land does not belong to those who conquer. It belongs to every soul who was promised they would return.",
        color: '#cccccc', size: 20, y: H * 0.45,
      },
      {
        // Page 4 — those who came before, hero appears
        text: "To those who came before us and never saw this day...",
        color: '#ffffff', size: 22, y: H * 0.82,
        setup: () => {
          this._drawSunrise(0.3);
          this._drawClouds(0.3);
          this._drawForwardHero();
          SoundManager.get().playRadarBlip();
        },
      },
      {
        // Page 5 — those beside
        text: "To those beside us who carried the weight when we could not...",
        color: '#ffffff', size: 22, y: H * 0.82,
        setup: () => {
          this._drawSunrise(0.5);
          this._drawClouds(0.5);
          this._drawForwardHero();
        },
      },
      {
        // Page 6 — those after, golden Maguen David appears
        text: "And to those who will come after, who will inherit what we fought to protect...",
        color: '#ffffff', size: 20, y: H * 0.82,
        setup: () => {
          this._drawSunrise(0.6);
          this._drawClouds(0.6);
          this._drawGiantStar();
          this._drawForwardHero();
        },
      },
      {
        // Page 7 — Am Yisrael Chai — CLIMAX
        text: "Am Yisrael Chai.",
        color: '#FFD700', size: 40, y: H * 0.5,
        setup: () => {
          this._drawSunrise(1.0);
          this._drawClouds(1.0);
          this._drawGiantStar();
          this._drawForwardHero();
          this._drawCelebrators();
          this._spawnConfetti();

          // Launch 4 fireworks with individual explosion sounds
          for (let fw = 0; fw < 4; fw++) {
            this.time.delayedCall(fw * 300, () => {
              if (!this.skipped) {
                this._launchFirework();
                SoundManager.get().playExplosion();
              }
            });
          }
          this.cameras.main.shake(400, 0.02);
        },
        cleanup: () => this._stopConfetti(),
      },
      {
        // Page 8 — final title screen (empty text, visual only)
        text: '', color: '#000000', size: 1, y: -100, charDelay: 1,
        setup: () => {
          this._drawSunrise(1.0);
          this._drawClouds(1.0);
          this._drawGiantStar();
          this._drawForwardHero();
          this._drawCelebrators();
          this._spawnConfetti();

          // Flanking Israel flags
          this._drawFlag(120, H * 0.55);
          this._drawFlag(W - 120, H * 0.55);

          // Title: S U P E R Z I O N
          const titleFont = '"Impact", "Arial Black", "Trebuchet MS", sans-serif';
          const outlineOffsets = [[-3,0],[3,0],[0,-3],[0,3],[-3,-3],[3,-3],[-3,3],[3,3]];
          for (const [dx, dy] of outlineOffsets) {
            this._addPageVisual(this.add.text(W / 2 + dx, H * 0.25 + dy, 'S U P E R Z I O N', {
              fontFamily: titleFont, fontSize: '60px', color: '#000000',
            }).setOrigin(0.5).setDepth(49));
          }
          this._addPageVisual(this.add.text(W / 2, H * 0.25, 'S U P E R Z I O N', {
            fontFamily: titleFont, fontSize: '60px', color: '#FFD700',
            shadow: { offsetX: 0, offsetY: 0, color: '#FFD700', blur: 60, fill: true },
          }).setOrigin(0.5).setDepth(50));

          // Subtitle: THEY FIGHT TO CONQUER. WE FIGHT TO EXIST.
          const sub = this.add.text(W / 2, H * 0.38, 'THEY FIGHT TO CONQUER. WE FIGHT TO EXIST.', {
            fontFamily: titleFont, fontSize: '20px', color: '#ffffff',
            shadow: { offsetX: 0, offsetY: 0, color: '#ffffff', blur: 8, fill: true },
          }).setOrigin(0.5).setDepth(50).setAlpha(0);
          this._addPageVisual(sub);
          this.tweens.add({ targets: sub, alpha: 1, duration: 600, delay: 400 });

          // Mega explosion when title appears
          SoundManager.get().playMegaExplosion();

          // Launch 10 staggered fireworks with individual explosion sounds
          for (let fw = 0; fw < 10; fw++) {
            this.time.delayedCall(fw * 400, () => {
              if (!this.skipped) {
                this._launchFirework();
                SoundManager.get().playExplosion();
              }
            });
          }

          this.cameras.main.shake(400, 0.02);
          this.typewriterComplete = true;
          this.pageReady = true;
        },
        cleanup: () => this._stopConfetti(),
      },
    ], 'CreditsScene');
  }

  // ═════════════════════════════════════════════════════════════
  // VISUAL HELPERS
  // ═════════════════════════════════════════════════════════════

  /**
   * Detailed Tel Aviv beach sunrise — dawn breaking over the Mediterranean.
   * Multi-stop sky, rising sun, sea with golden reflection, sand, skyline, palms, clouds.
   * @param {number} progress - 0.3 (barely visible) to 1.0 (full golden hour)
   */
  _drawSunrise(progress) {
    const skyGfx = this.add.graphics().setDepth(0);
    this._addPageVisual(skyGfx);

    // ── Horizon line ──
    const horizonY = H * 0.62;

    // ── Multi-stop dawn sky gradient (deep blue-purple top -> pink -> orange-gold at horizon) ──
    const preDawn = [
      { pos: 0.00, r: 8, g: 6, b: 28 },
      { pos: 0.30, r: 18, g: 10, b: 52 },
      { pos: 0.60, r: 40, g: 16, b: 60 },
      { pos: 1.00, r: 52, g: 22, b: 10 },
    ];
    const dawnBreak = [
      { pos: 0.00, r: 12, g: 14, b: 44 },
      { pos: 0.25, r: 36, g: 18, b: 68 },
      { pos: 0.55, r: 140, g: 50, b: 90 },
      { pos: 0.80, r: 210, g: 100, b: 42 },
      { pos: 1.00, r: 255, g: 190, b: 60 },
    ];
    const midSunrise = [
      { pos: 0.00, r: 22, g: 38, b: 82 },
      { pos: 0.20, r: 60, g: 60, b: 120 },
      { pos: 0.45, r: 190, g: 110, b: 130 },
      { pos: 0.70, r: 240, g: 155, b: 50 },
      { pos: 1.00, r: 255, g: 235, b: 170 },
    ];
    const fullSunrise = [
      { pos: 0.00, r: 50, g: 90, b: 160 },
      { pos: 0.20, r: 100, g: 150, b: 210 },
      { pos: 0.45, r: 200, g: 180, b: 200 },
      { pos: 0.70, r: 255, g: 220, b: 160 },
      { pos: 1.00, r: 255, g: 240, b: 200 },
    ];

    let stopsA, stopsB, localT;
    if (progress <= 0.0) {
      stopsA = preDawn; stopsB = preDawn; localT = 0;
    } else if (progress <= 0.3) {
      stopsA = preDawn; stopsB = dawnBreak; localT = progress / 0.3;
    } else if (progress <= 0.6) {
      stopsA = dawnBreak; stopsB = midSunrise; localT = (progress - 0.3) / 0.3;
    } else {
      stopsA = midSunrise; stopsB = fullSunrise; localT = (progress - 0.6) / 0.4;
    }
    localT = Math.min(1, Math.max(0, localT));

    const sampleStops = (stops, t) => {
      let lo = stops[0], hi = stops[stops.length - 1];
      for (let s = 0; s < stops.length - 1; s++) {
        if (t >= stops[s].pos && t <= stops[s + 1].pos) {
          lo = stops[s]; hi = stops[s + 1]; break;
        }
      }
      const segT = (hi.pos === lo.pos) ? 0 : (t - lo.pos) / (hi.pos - lo.pos);
      return {
        r: lo.r + (hi.r - lo.r) * segT,
        g: lo.g + (hi.g - lo.g) * segT,
        b: lo.b + (hi.b - lo.b) * segT,
      };
    };

    // Draw sky portion (above horizon)
    for (let y = 0; y < Math.ceil(horizonY); y++) {
      const t = y / horizonY;
      const cA = sampleStops(stopsA, t);
      const cB = sampleStops(stopsB, t);
      const r = cA.r + (cB.r - cA.r) * localT;
      const g = cA.g + (cB.g - cA.g) * localT;
      const b = cA.b + (cB.b - cA.b) * localT;
      skyGfx.fillStyle(Phaser.Display.Color.GetColor(r | 0, g | 0, b | 0), 1);
      skyGfx.fillRect(0, y, W, 1);
    }

    // ── Mediterranean Sea (below horizon, with golden reflection) ──
    const seaGfx = this.add.graphics().setDepth(0);
    this._addPageVisual(seaGfx);
    const seaBottom = H * 0.88;
    const warmth = Math.min(1, progress * 1.3);
    for (let y = Math.floor(horizonY); y < seaBottom; y++) {
      const seaT = (y - horizonY) / (seaBottom - horizonY);
      // Base sea: dark teal fading deeper
      const bR = 8 + 14 * (1 - seaT) * warmth + 20 * warmth * Math.max(0, 1 - seaT * 3);
      const bG = 20 + 30 * (1 - seaT) * warmth * 0.4;
      const bB = 40 + 40 * (1 - seaT) - 20 * warmth;
      seaGfx.fillStyle(Phaser.Display.Color.GetColor(
        Math.min(255, Math.max(0, bR | 0)),
        Math.min(255, Math.max(0, bG | 0)),
        Math.min(255, Math.max(0, bB | 0))
      ), 1);
      seaGfx.fillRect(0, y, W, 1);
    }

    // Golden sun reflection on water (vertical strip under sun)
    if (progress > 0.1) {
      const reflGfx = this.add.graphics().setDepth(0);
      this._addPageVisual(reflGfx);
      const reflAlpha = Math.min(0.25, progress * 0.3);
      const sunX = W * 0.5;
      for (let y = Math.floor(horizonY) + 2; y < seaBottom - 4; y++) {
        const seaT = (y - horizonY) / (seaBottom - horizonY);
        const spreadWidth = 30 + seaT * 60 + Math.sin(y * 0.15) * 8;
        const lineAlpha = reflAlpha * (1 - seaT * 0.7) * (0.6 + Math.sin(y * 0.3) * 0.4);
        if (lineAlpha > 0.01) {
          reflGfx.fillStyle(0xffcc44, lineAlpha);
          reflGfx.fillRect(sunX - spreadWidth / 2, y, spreadWidth, 1);
        }
      }
    }

    // ── Sand / beach strip at very bottom ──
    const sandGfx = this.add.graphics().setDepth(0);
    this._addPageVisual(sandGfx);
    for (let y = Math.floor(seaBottom); y < H; y++) {
      const sandT = (y - seaBottom) / (H - seaBottom);
      const sR = Math.round(60 + 40 * warmth - 15 * sandT);
      const sG = Math.round(45 + 25 * warmth - 10 * sandT);
      const sB = Math.round(25 + 10 * warmth - 8 * sandT);
      sandGfx.fillStyle(Phaser.Display.Color.GetColor(sR, sG, sB), 1);
      sandGfx.fillRect(0, y, W, 1);
    }

    // ── Stars (only visible at low progress) ──
    if (progress < 0.5) {
      const starAlpha = progress < 0.3 ? (0.5 + Math.random() * 0.3) : (0.2 * (1 - (progress - 0.3) / 0.2));
      if (starAlpha > 0.02) {
        const starGfx = this.add.graphics().setDepth(1);
        this._addPageVisual(starGfx);
        const starPositions = [
          [80,40],[180,70],[310,30],[420,90],[530,55],[640,35],[750,80],[870,50],
          [120,120],[260,100],[380,60],[500,25],[620,110],[730,45],[830,95],
          [150,55],[340,85],[460,42],[580,75],[700,60],[810,30],[900,70],
          [60,100],[210,45],[440,115],[560,38],[680,90],[780,55],[850,42],
          [100,80],[290,50],[470,70],[610,48],[740,105],[880,35],[170,95],
        ];
        starGfx.fillStyle(0xffffff, starAlpha);
        for (const [sx, sy] of starPositions) {
          if (sy < horizonY * 0.7) {
            const size = 1 + (sx % 3 === 0 ? 1 : 0);
            starGfx.fillCircle(sx, sy, size);
          }
        }
      }
    }

    // ── Sun rising from horizon ──
    const sunX = W * 0.5;
    let sunTargetY, sunRadius;
    if (progress <= 0.0) {
      sunTargetY = horizonY + 50;
      sunRadius = 30;
    } else if (progress <= 0.3) {
      sunTargetY = horizonY + 5;    // barely peeking
      sunRadius = 38;
    } else if (progress <= 0.6) {
      sunTargetY = horizonY - 25;   // half-risen
      sunRadius = 44;
    } else {
      sunTargetY = horizonY - 60;   // fully above horizon
      sunRadius = 52;
    }

    if (progress > 0.0) {
      const glowAlpha = Math.min(1, progress * 1.5);
      const glowLayers = [
        { radius: sunRadius * 3.2, color: 0xffcc40, alpha: 0.04 * glowAlpha },
        { radius: sunRadius * 2.5, color: 0xffaa20, alpha: 0.08 * glowAlpha },
        { radius: sunRadius * 1.8, color: 0xffbb30, alpha: 0.14 * glowAlpha },
        { radius: sunRadius * 1.3, color: 0xffcc55, alpha: 0.22 * glowAlpha },
        { radius: sunRadius * 0.85, color: 0xffdd88, alpha: 0.40 * glowAlpha },
        { radius: sunRadius * 0.55, color: 0xffeebb, alpha: 0.65 * glowAlpha },
        { radius: sunRadius * 0.3,  color: 0xffffff, alpha: 0.90 * glowAlpha },
      ];
      for (const gl of glowLayers) {
        const glow = this.add.circle(sunX, sunTargetY, gl.radius, gl.color, gl.alpha).setDepth(2);
        this._addPageVisual(glow);
      }

      // Sun disc — animate upward slowly
      const sunStartY = sunTargetY + 25;
      this._sunCircle = this.add.circle(sunX, sunStartY, sunRadius, 0xffeeaa, 0.95).setDepth(2);
      this._addPageVisual(this._sunCircle);
      this._sunTween = this.tweens.add({
        targets: this._sunCircle,
        y: sunTargetY - 8,
        duration: 8000,
        ease: 'Sine.easeOut',
      });

      // Sun rays at higher progress
      if (progress >= 0.6) {
        const rayGfx = this.add.graphics().setDepth(2);
        this._addPageVisual(rayGfx);
        const numRays = 10;
        for (let i = 0; i < numRays; i++) {
          const angle = (Math.PI * 2 * i) / numRays - Math.PI / 2;
          const length = 140 + Math.random() * 100;
          const halfWidth = 6 + Math.random() * 8;
          const perpAngle = angle + Math.PI / 2;
          const tipX = sunX + Math.cos(angle) * length;
          const tipY = sunTargetY + Math.sin(angle) * length;
          const baseX1 = sunX + Math.cos(perpAngle) * halfWidth;
          const baseY1 = sunTargetY + Math.sin(perpAngle) * halfWidth;
          const baseX2 = sunX - Math.cos(perpAngle) * halfWidth;
          const baseY2 = sunTargetY - Math.sin(perpAngle) * halfWidth;
          rayGfx.fillStyle(0xffcc40, 0.04 + Math.random() * 0.04);
          rayGfx.fillTriangle(baseX1, baseY1, baseX2, baseY2, tipX, tipY);
        }
      }
    }

    // ── Dawn clouds (3-4 wispy clouds with warm colors) ──
    const cloudGfx = this.add.graphics().setDepth(3);
    this._addPageVisual(cloudGfx);
    const cloudDefs = [
      { cx: W * 0.15, cy: horizonY * 0.28, w: 120, h: 14 },
      { cx: W * 0.42, cy: horizonY * 0.18, w: 150, h: 18 },
      { cx: W * 0.72, cy: horizonY * 0.35, w: 110, h: 12 },
      { cx: W * 0.88, cy: horizonY * 0.22, w: 90,  h: 10 },
    ];
    const cloudAlpha = Math.min(0.35, progress * 0.4);
    // Cloud color shifts from purple-gray at low progress to pink-orange at high
    const cR = Math.round(80 + 160 * progress);
    const cG = Math.round(50 + 100 * progress);
    const cB = Math.round(80 + 60 * progress);
    const cloudColor = Phaser.Display.Color.GetColor(
      Math.min(255, cR), Math.min(255, cG), Math.min(255, cB)
    );
    for (const cd of cloudDefs) {
      // Each cloud: overlapping ellipses
      for (let e = 0; e < 5; e++) {
        const eOff = (e - 2) * cd.w * 0.18;
        const eW = cd.w * (0.35 + Math.abs(2 - e) * 0.08);
        const eH = cd.h * (0.7 + (e % 2) * 0.3);
        const eAlpha = cloudAlpha * (0.6 + 0.4 * (1 - Math.abs(2 - e) / 2));
        cloudGfx.fillStyle(cloudColor, eAlpha);
        cloudGfx.fillEllipse(cd.cx + eOff, cd.cy - (e % 2) * cd.h * 0.25, eW, eH);
      }
    }

    // ── Tel Aviv skyline silhouette (left side, dark against dawn sky) ──
    const skylineGfx = this.add.graphics().setDepth(4);
    this._addPageVisual(skylineGfx);
    const skyAlpha = 0.15 + progress * 0.35;
    // Dark silhouette color: very dark blue-gray, gets slightly warm at high progress
    const slR = Math.round(10 + 15 * progress);
    const slG = Math.round(12 + 10 * progress);
    const slB = Math.round(25 + 5 * progress);
    const silColor = Phaser.Display.Color.GetColor(slR, slG, slB);
    skylineGfx.fillStyle(silColor, skyAlpha);

    // Building shapes along left portion (x: 0 to ~W*0.35)
    const buildings = [
      { x: 0,   w: 28, h: 70 },   // wide low block
      { x: 28,  w: 14, h: 95 },   // tall narrow tower
      { x: 42,  w: 22, h: 60 },
      { x: 64,  w: 10, h: 110 },  // antenna tower
      { x: 74,  w: 30, h: 75 },
      { x: 104, w: 16, h: 130 },  // tallest — Azrieli-ish
      { x: 120, w: 18, h: 120 },
      { x: 138, w: 24, h: 85 },
      { x: 162, w: 12, h: 100 },
      { x: 174, w: 30, h: 55 },
      { x: 204, w: 20, h: 70 },
      { x: 224, w: 16, h: 40 },
      { x: 240, w: 28, h: 50 },
      { x: 268, w: 14, h: 30 },
    ];
    for (const b of buildings) {
      skylineGfx.fillRect(b.x, horizonY - b.h, b.w, b.h + 4);
    }
    // Azrieli-style rounded tower cap on the tallest building
    skylineGfx.fillEllipse(112, horizonY - 132, 20, 10);

    // Tiny lit windows (golden dots) at higher progress
    if (progress >= 0.5) {
      const winAlpha = (progress - 0.5) * 0.6;
      skylineGfx.fillStyle(0xffcc44, winAlpha);
      const windowPositions = [
        [32, horizonY - 85], [36, horizonY - 78], [34, horizonY - 70],
        [108, horizonY - 120], [112, horizonY - 110], [116, horizonY - 100],
        [110, horizonY - 90], [114, horizonY - 80],
        [124, horizonY - 108], [128, horizonY - 98], [126, horizonY - 88],
        [80, horizonY - 65], [84, horizonY - 55],
        [144, horizonY - 75], [148, horizonY - 65],
        [166, horizonY - 90], [168, horizonY - 80],
      ];
      for (const [wx, wy] of windowPositions) {
        skylineGfx.fillRect(wx, wy, 2, 2);
      }
    }

    // ── Palm tree silhouettes (right side, 2-3 palms) ──
    const palmGfx = this.add.graphics().setDepth(4);
    this._addPageVisual(palmGfx);
    const palmAlpha = 0.2 + progress * 0.4;
    const palmColor = Phaser.Display.Color.GetColor(slR, slG, slB);

    const drawPalm = (baseX, baseY, trunkH, lean, frondSize) => {
      palmGfx.fillStyle(palmColor, palmAlpha);
      // Trunk: slightly curved, 3px wide
      const topX = baseX + lean;
      const topY = baseY - trunkH;
      for (let seg = 0; seg < 8; seg++) {
        const t1 = seg / 8;
        const t2 = (seg + 1) / 8;
        const x1 = baseX + lean * t1 * t1;
        const y1 = baseY - trunkH * t1;
        const x2 = baseX + lean * t2 * t2;
        const y2 = baseY - trunkH * t2;
        palmGfx.fillStyle(palmColor, palmAlpha);
        palmGfx.fillRect(Math.min(x1, x2) - 1, Math.min(y1, y2), Math.abs(x2 - x1) + 3, Math.abs(y2 - y1) + 1);
      }
      // Fronds: 5 drooping leaf arcs
      const fronds = [
        { angle: -0.6, len: frondSize },
        { angle: -0.2, len: frondSize * 1.1 },
        { angle: 0.15, len: frondSize * 0.95 },
        { angle: 0.5,  len: frondSize * 1.05 },
        { angle: 0.9,  len: frondSize * 0.8 },
      ];
      for (const f of fronds) {
        const endX = topX + Math.cos(f.angle) * f.len;
        const endY = topY + Math.abs(Math.sin(f.angle)) * f.len * 0.4 + f.len * 0.15;
        const midX = topX + Math.cos(f.angle) * f.len * 0.5;
        const midY = topY - f.len * 0.08;
        // Draw frond as series of small rects along arc
        for (let ft = 0; ft <= 1; ft += 0.1) {
          const fx = topX + (midX - topX) * ft * 2 * Math.min(ft, 0.5) + (endX - topX) * ft;
          const fy = topY + (midY - topY) * 2 * ft * (1 - ft) + (endY - topY) * ft * ft;
          palmGfx.fillRect(fx - 1, fy, 3, 2);
        }
      }
      // Coconut cluster
      palmGfx.fillCircle(topX - 2, topY + 3, 2.5);
      palmGfx.fillCircle(topX + 2, topY + 4, 2);
    };

    drawPalm(W * 0.78, horizonY + 2, 90, 12, 40);
    drawPalm(W * 0.88, horizonY + 2, 75, -8, 34);
    drawPalm(W * 0.95, horizonY + 2, 60, 6,  28);

    // ── Warm golden light wash on lower sky ──
    if (progress > 0.0) {
      const washStart = progress >= 0.6 ? 0.35 : 0.45;
      const washIntensity = progress >= 0.6 ? 0.10 : 0.05;
      const washGfx = this.add.graphics().setDepth(1);
      this._addPageVisual(washGfx);
      for (let y = Math.floor(horizonY * washStart); y < horizonY; y++) {
        const t = (y - horizonY * washStart) / (horizonY * (1 - washStart));
        washGfx.fillStyle(0xffcc40, t * t * washIntensity);
        washGfx.fillRect(0, y, W, 1);
      }
    }
  }

  /**
   * Moving clouds that drift across the sky.
   * @param {number} progress - 0.0 to 1.0 controlling cloud illumination
   */
  _drawClouds(progress) {
    // Cloud definitions: x, y, width, height
    const cloudDefs = [
      { x: 100, y: 80,  w: 180, h: 28 },
      { x: 300, y: 55,  w: 220, h: 32 },
      { x: 520, y: 95,  w: 160, h: 24 },
      { x: 700, y: 65,  w: 200, h: 30 },
      { x: 850, y: 110, w: 170, h: 26 },
      { x: 200, y: 140, w: 140, h: 22 },
      { x: 620, y: 150, w: 190, h: 28 },
    ];

    // Colors shift from dark purple/gray at low progress to illuminated pink/orange/white at high progress
    let darkColor, brightColor, hotColor;
    let darkAlpha, brightAlpha, hotAlpha;
    if (progress < 0.3) {
      darkColor = 0x2a1030;   darkAlpha = 0.25;
      brightColor = 0x553060; brightAlpha = 0.15;
      hotColor = 0x774080;    hotAlpha = 0.10;
    } else if (progress < 0.6) {
      darkColor = 0x551830;   darkAlpha = 0.22;
      brightColor = 0xcc7755; brightAlpha = 0.20;
      hotColor = 0xffaa77;    hotAlpha = 0.15;
    } else {
      darkColor = 0x885533;   darkAlpha = 0.18;
      brightColor = 0xffaa55; brightAlpha = 0.25;
      hotColor = 0xffddaa;    hotAlpha = 0.20;
    }

    for (const cd of cloudDefs) {
      // Dark bottom of cloud
      const darkCloud = this.add.ellipse(cd.x, cd.y + 4, cd.w, cd.h, darkColor, darkAlpha).setDepth(2);
      this._addPageVisual(darkCloud);
      // Bright illuminated upper edge
      const brightCloud = this.add.ellipse(cd.x, cd.y - 3, cd.w * 0.95, cd.h * 0.7, brightColor, brightAlpha).setDepth(2);
      this._addPageVisual(brightCloud);
      // Hot bright inner highlight
      const hotEdge = this.add.ellipse(cd.x, cd.y - 6, cd.w * 0.7, cd.h * 0.4, hotColor, hotAlpha).setDepth(2);
      this._addPageVisual(hotEdge);

      // Horizontal drift tween — leftward, ~60px over 10 seconds
      const driftDuration = 10000 + (cd.x % 3) * 1000;
      const driftAmount = -60 - (cd.y % 20);
      for (const layer of [darkCloud, brightCloud, hotEdge]) {
        this.tweens.add({
          targets: layer,
          x: layer.x + driftAmount,
          duration: driftDuration,
          ease: 'Linear',
          yoyo: true,
          repeat: -1,
        });
      }
    }
  }

  /**
   * Forward-facing SuperZion HERO with aviator sunglasses, V-shaped build,
   * tactical vest, gold Star of David, slicked-back hair. Imposing presence.
   * Drawn at 2x scale.
   */
  _drawForwardHero() {
    const gfx = this.add.graphics().setDepth(5);
    this._addPageVisual(gfx);
    const cx = 0, baseY = 0;
    const s = 2; // Scale factor

    // AI hero sprite replaces the procedural forward-facing hero
    const heroImg = this.add.image(W / 2, H - 132, 'parade_superzion')
      .setOrigin(0.5, 1).setScale(0.82).setDepth(6);
    this._addPageVisual(heroImg);

    // === WARM GOLDEN RIM LIGHTING on right side ===
    const glowGfx = this.add.graphics().setDepth(4);
    this._addPageVisual(glowGfx);
    glowGfx.fillStyle(0xffaa33, 0.08);
    glowGfx.fillEllipse(cx + 10 * s, baseY, 50 * s, 110 * s);
    glowGfx.setPosition(W / 2, H - 140);

    gfx.setPosition(W / 2, H - 140);
  }

  /**
   * Giant golden semi-transparent Maguen David in background.
   * Fades in with tween. For pages 6-8.
   */
  _drawGiantStar() {
    const starGfx = this.add.graphics().setDepth(3);
    this._addPageVisual(starGfx);
    const cx = W / 2, cy = H * 0.38;
    const r = 100;

    // Outer glow
    starGfx.fillStyle(0xFFD700, 0.1);
    starGfx.fillCircle(cx, cy, 130);

    // Star triangles
    starGfx.fillStyle(0xFFD700, 0.25);
    starGfx.fillTriangle(cx, cy - r, cx - r * 0.866, cy + r * 0.5, cx + r * 0.866, cy + r * 0.5);
    starGfx.fillTriangle(cx, cy + r, cx - r * 0.866, cy - r * 0.5, cx + r * 0.866, cy - r * 0.5);

    // Fade in
    starGfx.setAlpha(0);
    this.tweens.add({
      targets: starGfx, alpha: 1, duration: 1000,
      onComplete: () => {
        SoundManager.get().playFinalVictory();
        this.cameras.main.shake(200, 0.01);
      },
    });
  }

  // ═════════════════════════════════════════════════════════════
  // PLAN 03 STUBS — Crowd, confetti, fireworks
  // ═════════════════════════════════════════════════════════════

  /**
   * Celebrating crowd: soldiers, civilians, women, children, dogs, cats with Israel flags.
   * 22-26 figures surrounding the hero at the bottom of the screen.
   */
  _drawCelebrators() {
    // Play crowd cheer once (first call only)
    if (!this._celebratorSoundPlayed) {
      this._celebratorSoundPlayed = true;
      SoundManager.get().playVictory();
    }

    const crowd = [];
    const flagHolders = [];

    // Helper: draw a single figure at (x, baseY) on a graphics object
    const drawFigure = (type, x, baseY) => {
      const gfx = this.add.graphics().setDepth(15);
      this._addPageVisual(gfx);

      if (type === 'soldier') {
        // Olive drab body, 18-20px tall
        const h = 18 + Phaser.Math.Between(0, 2);
        gfx.fillStyle(0x556b2f, 1);
        gfx.fillRect(x - 3, baseY - h, 6, h - 4);       // torso
        gfx.fillRect(x - 4, baseY - 4, 4, 4);            // left leg
        gfx.fillRect(x, baseY - 4, 4, 4);                // right leg
        // Helmet
        gfx.fillStyle(0x3a4a20, 1);
        gfx.fillEllipse(x, baseY - h - 2, 8, 5);
        // Head (skin)
        gfx.fillStyle(0xd2a679, 1);
        gfx.fillCircle(x, baseY - h + 1, 3);
        // Arms raised with rifle
        gfx.fillStyle(0x556b2f, 1);
        gfx.fillRect(x - 6, baseY - h + 2, 3, 8);        // left arm
        gfx.fillRect(x + 3, baseY - h + 2, 3, 8);        // right arm
        // Rifle (small vertical line above)
        gfx.lineStyle(1, 0x333333, 0.9);
        gfx.beginPath();
        gfx.moveTo(x + 4, baseY - h - 4);
        gfx.lineTo(x + 4, baseY - h + 5);
        gfx.strokePath();
        return { gfx, h };
      }

      if (type === 'civilian') {
        const h = 14 + Phaser.Math.Between(0, 2);
        const shirtColors = [0x3355aa, 0xaa3333, 0xcccccc, 0x888888];
        const skinTones = [0xd2a679, 0xc49668, 0xb08657];
        gfx.fillStyle(Phaser.Utils.Array.GetRandom(shirtColors), 1);
        gfx.fillRect(x - 3, baseY - h, 6, h - 5);        // torso
        gfx.fillStyle(0x333333, 1);
        gfx.fillRect(x - 3, baseY - 5, 3, 5);            // left leg
        gfx.fillRect(x, baseY - 5, 3, 5);                 // right leg
        // Head
        gfx.fillStyle(Phaser.Utils.Array.GetRandom(skinTones), 1);
        gfx.fillCircle(x, baseY - h - 1, 3.5);
        // Arms (some up, some down)
        const armsUp = Math.random() < 0.5;
        gfx.fillStyle(Phaser.Utils.Array.GetRandom(shirtColors), 1);
        if (armsUp) {
          gfx.fillRect(x - 6, baseY - h - 4, 3, 6);      // left arm up
          gfx.fillRect(x + 3, baseY - h - 4, 3, 6);      // right arm up
        } else {
          gfx.fillRect(x - 6, baseY - h + 2, 3, 8);      // left arm down
          gfx.fillRect(x + 3, baseY - h + 2, 3, 8);      // right arm down
        }
        return { gfx, h, armsUp };
      }

      if (type === 'woman') {
        const h = 14 + Phaser.Math.Between(0, 2);
        const dressColors = [0x3355aa, 0xffffff, 0x6644aa];
        const skinTones = [0xd2a679, 0xc49668, 0xb08657];
        const dressColor = Phaser.Utils.Array.GetRandom(dressColors);
        // Torso
        gfx.fillStyle(dressColor, 1);
        gfx.fillRect(x - 3, baseY - h, 6, h * 0.5);
        // Skirt (triangular lower body)
        gfx.fillTriangle(x - 5, baseY, x + 5, baseY, x, baseY - h * 0.5);
        // Head (slightly larger for hair)
        gfx.fillStyle(Phaser.Utils.Array.GetRandom(skinTones), 1);
        gfx.fillCircle(x, baseY - h - 1, 3.5);
        // Hair
        gfx.fillStyle(0x1a0a00, 0.8);
        gfx.fillEllipse(x, baseY - h - 3, 8, 4);
        // Arms
        gfx.fillStyle(dressColor, 1);
        gfx.fillRect(x - 5, baseY - h + 2, 2, 6);
        gfx.fillRect(x + 3, baseY - h + 2, 2, 6);
        return { gfx, h };
      }

      if (type === 'child') {
        const h = 8 + Phaser.Math.Between(0, 4);
        const shirtColors = [0xffdd44, 0xaa3333, 0x3355aa];
        const skinTones = [0xd2a679, 0xc49668, 0xb08657];
        gfx.fillStyle(Phaser.Utils.Array.GetRandom(shirtColors), 1);
        gfx.fillRect(x - 2, baseY - h, 4, h - 3);
        gfx.fillStyle(0x333333, 1);
        gfx.fillRect(x - 2, baseY - 3, 2, 3);
        gfx.fillRect(x, baseY - 3, 2, 3);
        gfx.fillStyle(Phaser.Utils.Array.GetRandom(skinTones), 1);
        gfx.fillCircle(x, baseY - h - 1, 2.5);
        // Arms up
        gfx.fillStyle(Phaser.Utils.Array.GetRandom(shirtColors), 1);
        gfx.fillRect(x - 4, baseY - h - 2, 2, 5);
        gfx.fillRect(x + 2, baseY - h - 2, 2, 5);
        return { gfx, h, alwaysJump: true };
      }

      if (type === 'dog') {
        // Brown horizontal oval body
        gfx.fillStyle(0x8B4513, 1);
        gfx.fillEllipse(x, baseY - 4, 8, 4);
        // Head
        gfx.fillCircle(x + 5, baseY - 5, 2);
        // Legs (4 tiny lines)
        gfx.lineStyle(1, 0x6b3410, 1);
        gfx.beginPath();
        gfx.moveTo(x - 3, baseY - 2); gfx.lineTo(x - 3, baseY);
        gfx.moveTo(x - 1, baseY - 2); gfx.lineTo(x - 1, baseY);
        gfx.moveTo(x + 1, baseY - 2); gfx.lineTo(x + 1, baseY);
        gfx.moveTo(x + 3, baseY - 2); gfx.lineTo(x + 3, baseY);
        gfx.strokePath();
        // Tail (short upward line)
        gfx.lineStyle(1, 0x8B4513, 1);
        gfx.beginPath();
        gfx.moveTo(x - 4, baseY - 4);
        gfx.lineTo(x - 5, baseY - 7);
        gfx.strokePath();
        return { gfx, h: 8 };
      }

      if (type === 'cat') {
        const catColor = Math.random() < 0.5 ? 0x666666 : 0xcc7722;
        // Small oval body
        gfx.fillStyle(catColor, 1);
        gfx.fillEllipse(x, baseY - 3, 6, 3);
        // Head
        gfx.fillCircle(x + 4, baseY - 4, 1.8);
        // Triangle ears
        gfx.fillTriangle(x + 3, baseY - 6, x + 2.5, baseY - 4.5, x + 3.5, baseY - 4.5);
        gfx.fillTriangle(x + 5, baseY - 6, x + 4.5, baseY - 4.5, x + 5.5, baseY - 4.5);
        // Legs
        gfx.lineStyle(1, catColor, 1);
        gfx.beginPath();
        gfx.moveTo(x - 2, baseY - 1.5); gfx.lineTo(x - 2, baseY);
        gfx.moveTo(x + 2, baseY - 1.5); gfx.lineTo(x + 2, baseY);
        gfx.strokePath();
        // Curved tail
        gfx.lineStyle(1, catColor, 0.8);
        gfx.beginPath();
        gfx.arc(x - 5, baseY - 5, 3, Phaser.Math.DegToRad(-60), Phaser.Math.DegToRad(60), false);
        gfx.strokePath();
        return { gfx, h: 6 };
      }

      return { gfx, h: 14 };
    };

    // Helper: draw small Israel flag above (fx, fy)
    const drawFlag = (fx, fy) => {
      const flagGfx = this.add.graphics().setDepth(16);
      this._addPageVisual(flagGfx);
      // Pole
      flagGfx.lineStyle(1, 0x888888, 1);
      flagGfx.beginPath();
      flagGfx.moveTo(fx, fy);
      flagGfx.lineTo(fx, fy - 12);
      flagGfx.strokePath();
      // White rectangle
      flagGfx.fillStyle(0xffffff, 1);
      flagGfx.fillRect(fx, fy - 19, 10, 7);
      // Blue stripes (top and bottom)
      flagGfx.fillStyle(0x0038b8, 1);
      flagGfx.fillRect(fx, fy - 19, 10, 1.5);
      flagGfx.fillRect(fx, fy - 13.5, 10, 1.5);
      // Tiny blue Star of David hint in center (two small lines forming an X-like shape)
      flagGfx.lineStyle(0.8, 0x0038b8, 0.8);
      flagGfx.beginPath();
      const scx = fx + 5, scy = fy - 15.5;
      gfx_drawTinyStarLines(flagGfx, scx, scy);
      flagGfx.strokePath();

      // Flag sway tween
      flagGfx.setOrigin && flagGfx.setOrigin(0, 1);
      this.tweens.add({
        targets: flagGfx,
        angle: { from: -8, to: 8 },
        duration: 600 + Phaser.Math.Between(0, 300),
        ease: 'Sine.easeInOut',
        yoyo: true,
        repeat: -1,
      });
      this._celebratorTweens.push(flagGfx);
      return flagGfx;
    };

    // Tiny Star of David on flag (just two overlapping triangle outlines)
    const gfx_drawTinyStarLines = (g, cx, cy) => {
      const r = 1.8;
      // Upward triangle
      g.moveTo(cx, cy - r);
      g.lineTo(cx - r * 0.866, cy + r * 0.5);
      g.lineTo(cx + r * 0.866, cy + r * 0.5);
      g.lineTo(cx, cy - r);
      // Downward triangle
      g.moveTo(cx, cy + r);
      g.lineTo(cx - r * 0.866, cy - r * 0.5);
      g.lineTo(cx + r * 0.866, cy - r * 0.5);
      g.lineTo(cx, cy + r);
    };

    // --- CROWD LAYOUT ---
    // Distribute 24 figures across the bottom of the screen
    const figureTypes = [];
    // Soldiers: 5
    for (let i = 0; i < 5; i++) figureTypes.push('soldier');
    // Civilians: 7
    for (let i = 0; i < 7; i++) figureTypes.push('civilian');
    // Women: 4
    for (let i = 0; i < 4; i++) figureTypes.push('woman');
    // Children: 4
    for (let i = 0; i < 4; i++) figureTypes.push('child');
    // Dogs: 2
    for (let i = 0; i < 2; i++) figureTypes.push('dog');
    // Cats: 2
    for (let i = 0; i < 2; i++) figureTypes.push('cat');
    // Total: 24

    // Distribute positions, leaving center for hero
    const positions = [];
    const totalFigures = figureTypes.length;
    const startX = 40;
    const endX = W - 40;
    const spacing = (endX - startX) / (totalFigures + 1);
    for (let i = 0; i < totalFigures; i++) {
      positions.push(startX + spacing * (i + 1));
    }

    // Shuffle figure types for mixed layout (seeded for consistency)
    // Simple shuffle using Phaser.Math.Between
    for (let i = figureTypes.length - 1; i > 0; i--) {
      const j = Phaser.Math.Between(0, i);
      [figureTypes[i], figureTypes[j]] = [figureTypes[j], figureTypes[i]];
    }

    // Track hugging pairs indices (first two pairs of adjacent civilians/women)
    let hugPairsPlaced = 0;
    const hugIndices = [];

    for (let i = 0; i < totalFigures; i++) {
      const type = figureTypes[i];
      const fx = positions[i];
      // Skip center area where hero stands (W/2 +/- 50)
      const adjustedX = (fx > W / 2 - 50 && fx < W / 2 + 50)
        ? (fx < W / 2 ? fx - 40 : fx + 40)
        : fx;

      const baseY = H - Phaser.Math.Between(10, 30);
      const result = drawFigure(type, adjustedX, baseY);

      // Flag: every 4th person holds one (indices 0, 4, 8, 12, 16, 20)
      if (i % 4 === 0 && type !== 'dog' && type !== 'cat') {
        const flagY = baseY - (result.h || 14);
        drawFlag(adjustedX - 2, flagY);
      }

      // Hugging pairs: first two pairs of adjacent non-animal figures
      if (hugPairsPlaced < 2 && i > 0 && type !== 'dog' && type !== 'cat'
          && figureTypes[i - 1] !== 'dog' && figureTypes[i - 1] !== 'cat') {
        if (!hugIndices.includes(i - 1)) {
          hugIndices.push(i - 1, i);
          hugPairsPlaced++;
          // Draw reaching arms toward each other (overlap slightly)
          const hugGfx = this.add.graphics().setDepth(15);
          this._addPageVisual(hugGfx);
          hugGfx.fillStyle(0xd2a679, 0.7);
          const prevX = positions[i - 1] > W / 2 - 50 && positions[i - 1] < W / 2 + 50
            ? (positions[i - 1] < W / 2 ? positions[i - 1] - 40 : positions[i - 1] + 40)
            : positions[i - 1];
          const midX = (prevX + adjustedX) / 2;
          hugGfx.fillRect(prevX + 3, baseY - 10, midX - prevX - 3, 2);
          hugGfx.fillRect(midX, baseY - 10, adjustedX - midX - 3, 2);
        }
      }

      // ANIMATIONS
      // Jump tween: children always, ~40% of others
      const shouldJump = result.alwaysJump || Math.random() < 0.4;
      if (shouldJump) {
        const jumpAmount = Phaser.Math.Between(4, 8);
        this.tweens.add({
          targets: result.gfx,
          y: -jumpAmount,
          duration: Phaser.Math.Between(300, 550),
          ease: 'Sine.easeInOut',
          yoyo: true,
          repeat: -1,
          delay: Phaser.Math.Between(0, 500),
        });
      }

      // Arm wave / rotation tween: ~50% of figures with arms up
      if (result.armsUp || Math.random() < 0.3) {
        this.tweens.add({
          targets: result.gfx,
          angle: { from: -5, to: 5 },
          duration: Phaser.Math.Between(250, 400),
          ease: 'Sine.easeInOut',
          yoyo: true,
          repeat: -1,
        });
      }

      crowd.push(result);
    }
  }
  /**
   * Continuous gold/blue/white confetti falling. Gold-weighted for Israel colors.
   * Capped at ~50 particles on screen.
   */
  _spawnConfetti() {
    let particleCount = 0;
    const colors = [0xFFD700, 0xFFD700, 0xFFD700, 0x0055ff, 0x0055ff, 0xffffff, 0xffffff];

    this._confettiTimer = this.time.addEvent({
      delay: 70,
      loop: true,
      callback: () => {
        if (this.skipped || particleCount >= 50) return;
        particleCount++;

        const px = Phaser.Math.Between(20, W - 20);
        const pw = Phaser.Math.Between(2, 3);
        const ph = Phaser.Math.Between(4, 5);
        const color = Phaser.Utils.Array.GetRandom(colors);
        const piece = this.add.rectangle(px, -5, pw, ph, color, 1).setDepth(20);
        this._addPageVisual(piece);
        this._confettiParticles.push(piece);

        const fallDuration = Phaser.Math.Between(2500, 4000);

        // Fall tween
        this.tweens.add({
          targets: piece,
          y: H + 10,
          alpha: 0.3,
          duration: fallDuration,
          ease: 'Linear',
          onComplete: () => {
            piece.destroy();
            particleCount--;
            const idx = this._confettiParticles.indexOf(piece);
            if (idx !== -1) this._confettiParticles.splice(idx, 1);
          },
        });

        // Horizontal drift (sine wave)
        const driftAmount = Phaser.Math.Between(15, 40) * (Math.random() < 0.5 ? -1 : 1);
        this.tweens.add({
          targets: piece,
          x: px + driftAmount,
          duration: Phaser.Math.Between(400, 800),
          ease: 'Sine.easeInOut',
          yoyo: true,
          repeat: -1,
        });

        // Rotation
        this.tweens.add({
          targets: piece,
          angle: Phaser.Math.Between(-180, 180),
          duration: fallDuration,
          ease: 'Linear',
        });
      },
    });
  }

  /**
   * Stop confetti timer and clean up.
   */
  _stopConfetti() {
    if (this._confettiTimer) {
      this._confettiTimer.remove(false);
      this._confettiTimer = null;
    }
  }

  /**
   * Launch a single firework: rocket trail, radial burst, central flash.
   */
  _launchFirework() {
    const rocketX = Phaser.Math.Between(80, W - 80);
    const peakY = Phaser.Math.Between(60, 200);

    // Rocket
    const rocket = this.add.circle(rocketX, H + 10, 3, 0xffffff, 1).setDepth(25);
    this._addPageVisual(rocket);

    // Trail timer: spawn fading dots behind rocket
    const trailTimer = this.time.addEvent({
      delay: 40,
      loop: true,
      callback: () => {
        if (!rocket.active) return;
        const dot = this.add.circle(rocket.x, rocket.y, 1.5, 0xffddaa, 0.6).setDepth(24);
        this._addPageVisual(dot);
        this.tweens.add({
          targets: dot,
          alpha: 0,
          scaleX: 0.3,
          scaleY: 0.3,
          duration: 300,
          onComplete: () => dot.destroy(),
        });
      },
    });

    // Rocket rise tween
    this.tweens.add({
      targets: rocket,
      y: peakY,
      duration: 600,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        // Stop trail, destroy rocket
        trailTimer.remove(false);
        const burstX = rocket.x;
        const burstY = rocket.y;
        rocket.destroy();

        // Burst phase
        const burstColors = [0xFFD700, 0x0055ff, 0xffffff, 0xff3333, 0x33ff55, 0xff66cc];
        const c1 = Phaser.Utils.Array.GetRandom(burstColors);
        const c2 = Phaser.Utils.Array.GetRandom(burstColors);
        const numParticles = 24;

        for (let i = 0; i < numParticles; i++) {
          const angle = (Math.PI * 2 * i) / numParticles;
          const spread = 50 + Phaser.Math.Between(0, 30);
          const color = i % 2 === 0 ? c1 : c2;
          const particle = this.add.circle(burstX, burstY, 2.5, color, 1).setDepth(25);
          this._addPageVisual(particle);

          const targetX = burstX + Math.cos(angle) * spread;
          const targetY = burstY + Math.sin(angle) * spread;
          const pDuration = Phaser.Math.Between(700, 900);

          this.tweens.add({
            targets: particle,
            x: targetX,
            y: targetY,
            alpha: 0,
            duration: pDuration,
            ease: 'Cubic.easeOut',
            onComplete: () => particle.destroy(),
          });

          // Trail effect: 60% chance each 80ms to spawn tiny fading dot
          if (Math.random() < 0.6) {
            const ptTimer = this.time.addEvent({
              delay: 80,
              repeat: Math.floor(pDuration / 80) - 1,
              callback: () => {
                if (!particle.active) return;
                const tdot = this.add.circle(particle.x, particle.y, 1, color, 0.4).setDepth(24);
                this._addPageVisual(tdot);
                this.tweens.add({
                  targets: tdot,
                  alpha: 0,
                  duration: 200,
                  onComplete: () => tdot.destroy(),
                });
              },
            });
          }
        }

        // Central flash
        const flash = this.add.circle(burstX, burstY, 8, 0xffffff, 0.9).setDepth(26);
        this._addPageVisual(flash);
        this.tweens.add({
          targets: flash,
          scaleX: 3,
          scaleY: 3,
          alpha: 0,
          duration: 300,
          onComplete: () => flash.destroy(),
        });
      },
    });
  }

  /**
   * Draw a large Israel flag at (cx, cy) with pole, stripes, Star of David, sway animation.
   * Used on page 8 for flanking flags.
   */
  _drawFlag(cx, cy) {
    const flagGfx = this.add.graphics().setDepth(18);
    this._addPageVisual(flagGfx);

    const fh = 80;  // Flag height
    const fw = 80;  // Flag width

    // Pole: 3px wide, fh+30 tall, gray
    flagGfx.fillStyle(0x888888, 1);
    flagGfx.fillRect(cx - 1.5, cy - fh - 30, 3, fh + 30);

    // White flag background
    flagGfx.fillStyle(0xffffff, 1);
    flagGfx.fillRect(cx + 2, cy - fh - 25, fw, fh * 0.7);

    // Two blue stripes
    const stripeH = fh * 0.7 * 0.15;
    flagGfx.fillStyle(0x0038b8, 1);
    flagGfx.fillRect(cx + 2, cy - fh - 25, fw, stripeH);                            // top stripe
    flagGfx.fillRect(cx + 2, cy - fh - 25 + fh * 0.7 - stripeH, fw, stripeH);      // bottom stripe

    // Star of David in center
    const scx = cx + 2 + fw / 2;
    const scy = cy - fh - 25 + fh * 0.7 / 2;
    const sr = fh * 0.15;
    flagGfx.lineStyle(2, 0x0038b8, 0.9);
    // Upward triangle
    flagGfx.beginPath();
    flagGfx.moveTo(scx, scy - sr);
    flagGfx.lineTo(scx - sr * 0.866, scy + sr * 0.5);
    flagGfx.lineTo(scx + sr * 0.866, scy + sr * 0.5);
    flagGfx.closePath();
    flagGfx.strokePath();
    // Downward triangle
    flagGfx.beginPath();
    flagGfx.moveTo(scx, scy + sr);
    flagGfx.lineTo(scx - sr * 0.866, scy - sr * 0.5);
    flagGfx.lineTo(scx + sr * 0.866, scy - sr * 0.5);
    flagGfx.closePath();
    flagGfx.strokePath();

    // Fade-in tween
    flagGfx.setAlpha(0);
    this.tweens.add({
      targets: flagGfx,
      alpha: 1,
      duration: 800,
    });

    // Gentle sway tween (scaleX oscillation for waving effect)
    this.tweens.add({
      targets: flagGfx,
      scaleX: 0.96,
      duration: 1200,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1,
    });
  }

  update() { this._handlePageInput(); }
}
