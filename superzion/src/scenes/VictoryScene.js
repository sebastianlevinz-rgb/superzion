// ═══════════════════════════════════════════════════════════════
// VictoryScene — Epic victory narrative after defeating Supreme Turban
// Page-by-page text with SPACE/ENTER, ends with "Am Yisrael Chai"
// Phase 37-02: New narrative, forward-facing hero, animated sunrise, clouds
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
          // [Plan 03: _drawCelebrators]
          this._drawCelebrators();
          // [Plan 03: _spawnConfetti]
          this._spawnConfetti();
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
          // [Plan 03: _drawCelebrators]
          this._drawCelebrators();
          // [Plan 03: _spawnConfetti]
          this._spawnConfetti();

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

          // [Plan 03: _launchFirework]
          this._launchFirework();

          SoundManager.get().playExplosion();
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
   * Animated sunrise background with multi-stop gradient, sun, rays, glow.
   * @param {number} progress - 0.0 (pre-dawn) to 1.0 (full golden hour)
   */
  _drawSunrise(progress) {
    const skyGfx = this.add.graphics().setDepth(0);
    this._addPageVisual(skyGfx);

    // Interpolate sky color stops based on progress
    const preDawn = [
      { pos: 0.00, r: 10, g: 10, b: 32 },   // #0a0a20
      { pos: 0.40, r: 26, g: 10, b: 62 },   // #1a0a3e
      { pos: 1.00, r: 58, g: 26, b: 10 },   // #3a1a0a
    ];
    const dawnBreak = [
      { pos: 0.00, r: 10, g: 16, b: 48 },   // #0a1030
      { pos: 0.50, r: 106, g: 32, b: 80 },  // #6a2050
      { pos: 0.80, r: 204, g: 102, b: 32 }, // #cc6620
      { pos: 1.00, r: 255, g: 204, b: 64 }, // #ffcc40
    ];
    const midSunrise = [
      { pos: 0.00, r: 26, g: 48, b: 96 },   // #1a3060
      { pos: 0.40, r: 204, g: 136, b: 136 }, // #cc8888
      { pos: 0.70, r: 238, g: 153, b: 24 },  // #ee9918
      { pos: 1.00, r: 255, g: 240, b: 192 }, // #fff0c0
    ];
    const fullSunrise = [
      { pos: 0.00, r: 51, g: 102, b: 170 },  // #3366aa
      { pos: 0.30, r: 136, g: 170, b: 221 }, // #88aadd
      { pos: 0.60, r: 255, g: 238, b: 221 }, // #ffeedd
      { pos: 1.00, r: 255, g: 221, b: 136 }, // #ffdd88
    ];

    // Select and interpolate between two stop sets based on progress
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

    // Helper to sample color from a stop set at normalized position t
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

    // Draw sky gradient line by line
    for (let y = 0; y < H; y++) {
      const t = y / H;
      const cA = sampleStops(stopsA, t);
      const cB = sampleStops(stopsB, t);
      const r = cA.r + (cB.r - cA.r) * localT;
      const g = cA.g + (cB.g - cA.g) * localT;
      const b = cA.b + (cB.b - cA.b) * localT;
      skyGfx.fillStyle(Phaser.Display.Color.GetColor(r | 0, g | 0, b | 0), 1);
      skyGfx.fillRect(0, y, W, 1);
    }

    // Stars (only visible at low progress)
    if (progress < 0.5) {
      const starAlpha = progress < 0.3 ? (0.5 + Math.random() * 0.3) : (0.2 * (1 - (progress - 0.3) / 0.2));
      if (starAlpha > 0.02) {
        const starGfx = this.add.graphics().setDepth(1);
        this._addPageVisual(starGfx);
        // Use seeded positions for consistency across pages
        const starPositions = [
          [80,40],[180,70],[310,30],[420,90],[530,55],[640,35],[750,80],[870,50],
          [120,120],[260,100],[380,60],[500,25],[620,110],[730,45],[830,95],
          [150,55],[340,85],[460,42],[580,75],[700,60],[810,30],[900,70],
          [60,100],[210,45],[440,115],[560,38],[680,90],[780,55],[850,42],
          [100,80],[290,50],[470,70],[610,48],[740,105],[880,35],[170,95],
        ];
        starGfx.fillStyle(0xffffff, starAlpha);
        for (const [sx, sy] of starPositions) {
          if (sy < H * 0.6) {
            const size = 1 + (sx % 3 === 0 ? 1 : 0);
            starGfx.fillCircle(sx, sy, size);
          }
        }
      }
    }

    // Sun — position depends on progress
    const sunX = W * 0.5;
    let sunTargetY, sunRadius;
    if (progress <= 0.0) {
      // No sun visible
      sunTargetY = H + 50;
      sunRadius = 30;
    } else if (progress <= 0.3) {
      // Just peeking at horizon
      sunTargetY = H * 0.85;
      sunRadius = 40;
    } else if (progress <= 0.6) {
      // Rising
      sunTargetY = H * 0.75;
      sunRadius = 45;
    } else {
      // Full sunrise
      sunTargetY = H * 0.65;
      sunRadius = 50;
    }

    if (progress > 0.0) {
      // Sun glow rings
      const glowAlpha = Math.min(1, progress * 1.5);
      const glowLayers = [
        { radius: sunRadius * 2.8, color: 0xffcc40, alpha: 0.06 * glowAlpha },
        { radius: sunRadius * 2.1, color: 0xffaa20, alpha: 0.10 * glowAlpha },
        { radius: sunRadius * 1.6, color: 0xffbb30, alpha: 0.15 * glowAlpha },
        { radius: sunRadius * 1.2, color: 0xffcc55, alpha: 0.25 * glowAlpha },
        { radius: sunRadius * 0.85, color: 0xffdd88, alpha: 0.40 * glowAlpha },
        { radius: sunRadius * 0.6, color: 0xffeebb, alpha: 0.60 * glowAlpha },
        { radius: sunRadius * 0.35, color: 0xffffff, alpha: 0.85 * glowAlpha },
      ];
      for (const gl of glowLayers) {
        const glow = this.add.circle(sunX, sunTargetY, gl.radius, gl.color, gl.alpha).setDepth(1);
        this._addPageVisual(glow);
      }

      // Sun circle — animate upward slowly
      const sunStartY = sunTargetY + 30;
      this._sunCircle = this.add.circle(sunX, sunStartY, sunRadius, 0xffeeaa, 0.95).setDepth(1);
      this._addPageVisual(this._sunCircle);
      this._sunTween = this.tweens.add({
        targets: this._sunCircle,
        y: sunTargetY - 10,
        duration: 8000,
        ease: 'Sine.easeOut',
      });

      // Sun rays (at higher progress levels)
      if (progress >= 0.6) {
        const rayGfx = this.add.graphics().setDepth(1);
        this._addPageVisual(rayGfx);
        const numRays = 8;
        for (let i = 0; i < numRays; i++) {
          const angle = (Math.PI * 2 * i) / numRays - Math.PI / 2;
          const length = 160 + Math.random() * 80;
          const halfWidth = 8 + Math.random() * 6;
          const perpAngle = angle + Math.PI / 2;
          const tipX = sunX + Math.cos(angle) * length;
          const tipY = sunTargetY + Math.sin(angle) * length;
          const baseX1 = sunX + Math.cos(perpAngle) * halfWidth;
          const baseY1 = sunTargetY + Math.sin(perpAngle) * halfWidth;
          const baseX2 = sunX - Math.cos(perpAngle) * halfWidth;
          const baseY2 = sunTargetY - Math.sin(perpAngle) * halfWidth;
          rayGfx.fillStyle(0xffcc40, 0.05 + Math.random() * 0.04);
          rayGfx.fillTriangle(baseX1, baseY1, baseX2, baseY2, tipX, tipY);
        }
      }

      // Warm golden light wash on lower portion
      const washStart = progress >= 0.6 ? 0.5 : 0.6;
      const washIntensity = progress >= 0.6 ? 0.08 : 0.04;
      const washGfx = this.add.graphics().setDepth(1);
      this._addPageVisual(washGfx);
      for (let y = Math.floor(H * washStart); y < H; y++) {
        const t = (y - H * washStart) / (H * (1 - washStart));
        washGfx.fillStyle(0xffcc40, t * washIntensity);
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
   * Forward-facing SuperZion with visible face, smile, Star of David.
   * Drawn at 2x scale for imposing presence.
   */
  _drawForwardHero() {
    const gfx = this.add.graphics().setDepth(5);
    this._addPageVisual(gfx);
    const cx = 0, baseY = 0;
    const s = 2; // Scale factor

    // === LEGS ===
    gfx.fillStyle(0x1a1a2a, 1);
    gfx.fillRect(cx - 14 * s, baseY + 12 * s, 14 * s, 42 * s); // left leg
    gfx.fillRect(cx + 0 * s, baseY + 12 * s, 14 * s, 42 * s);  // right leg

    // === BOOTS ===
    gfx.fillStyle(0x0e0e0e, 1);
    gfx.fillRect(cx - 16 * s, baseY + 52 * s, 16 * s, 8 * s);  // left boot
    gfx.fillRect(cx + 0 * s, baseY + 52 * s, 16 * s, 8 * s);   // right boot

    // === TORSO ===
    gfx.fillStyle(0x1a1a2a, 1);
    gfx.fillRect(cx - 18 * s, baseY - 24 * s, 36 * s, 48 * s);

    // === BELT ===
    gfx.fillStyle(0x333340, 1);
    gfx.fillRect(cx - 19 * s, baseY + 20 * s, 38 * s, 5 * s);
    // Belt buckle (gold)
    gfx.fillStyle(0xFFD700, 0.8);
    gfx.fillRect(cx - 3 * s, baseY + 21 * s, 6 * s, 3 * s);

    // === SHOULDERS ===
    gfx.fillStyle(0x1a1a2a, 1);
    gfx.fillRect(cx - 22 * s, baseY - 26 * s, 44 * s, 8 * s);

    // === ARMS ===
    gfx.fillStyle(0x1a1a2a, 1);
    gfx.fillRect(cx - 28 * s, baseY - 22 * s, 12 * s, 34 * s); // left arm
    gfx.fillRect(cx + 16 * s, baseY - 22 * s, 12 * s, 34 * s); // right arm

    // === HANDS ===
    gfx.fillStyle(0xd2a679, 1);
    gfx.fillCircle(cx - 22 * s, baseY + 14 * s, 5 * s); // left hand
    gfx.fillCircle(cx + 22 * s, baseY + 14 * s, 5 * s); // right hand

    // === NECK ===
    gfx.fillStyle(0xd2a679, 1);
    gfx.fillRect(cx - 5 * s, baseY - 30 * s, 10 * s, 6 * s);

    // === HEAD ===
    // Skin face
    gfx.fillStyle(0xd2a679, 1);
    gfx.fillCircle(cx, baseY - 42 * s, 16 * s);
    // Shadow skin undertone on left side
    gfx.fillStyle(0xc49668, 0.4);
    gfx.fillRect(cx - 14 * s, baseY - 52 * s, 8 * s, 18 * s);
    // Highlight on right side
    gfx.fillStyle(0xe0b689, 0.3);
    gfx.fillRect(cx + 6 * s, baseY - 52 * s, 8 * s, 18 * s);

    // === HAIR ===
    gfx.fillStyle(0x0a0a0a, 1);
    gfx.fillEllipse(cx, baseY - 54 * s, 30 * s, 14 * s);

    // === EYES ===
    // Eye whites
    gfx.fillStyle(0xeeeee8, 1);
    gfx.fillRect(cx - 7 * s, baseY - 44 * s, 5 * s, 3 * s);  // left eye
    gfx.fillRect(cx + 2 * s, baseY - 44 * s, 5 * s, 3 * s);  // right eye
    // Irises
    gfx.fillStyle(0x3a2818, 1);
    gfx.fillRect(cx - 5 * s, baseY - 44 * s, 3 * s, 3 * s);  // left iris
    gfx.fillRect(cx + 4 * s, baseY - 44 * s, 3 * s, 3 * s);  // right iris

    // === SMILE ===
    gfx.lineStyle(2, 0xc49668, 0.8);
    gfx.beginPath();
    gfx.arc(cx, baseY - 36 * s, 6 * s, Phaser.Math.DegToRad(10), Phaser.Math.DegToRad(170), false);
    gfx.strokePath();

    // === STAR OF DAVID on chest ===
    const starR = 12 * s;
    const starCY = baseY - 4 * s;
    // Golden glow behind star
    gfx.fillStyle(0xFFD700, 0.3);
    gfx.fillCircle(cx, starCY, 18 * s);
    // Upward triangle
    gfx.fillStyle(0xFFD700, 0.9);
    gfx.fillTriangle(
      cx, starCY - starR,
      cx - starR * 0.866, starCY + starR * 0.5,
      cx + starR * 0.866, starCY + starR * 0.5
    );
    // Downward triangle
    gfx.fillTriangle(
      cx, starCY + starR,
      cx - starR * 0.866, starCY - starR * 0.5,
      cx + starR * 0.866, starCY - starR * 0.5
    );

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
    this.tweens.add({ targets: starGfx, alpha: 1, duration: 1000 });
  }

  // ═════════════════════════════════════════════════════════════
  // PLAN 03 STUBS — Crowd, confetti, fireworks
  // ═════════════════════════════════════════════════════════════

  _drawCelebrators() { /* Plan 03 */ }
  _spawnConfetti() { /* Plan 03 */ }
  _stopConfetti() { /* Plan 03 */ }
  _launchFirework() { /* Plan 03 */ }

  update() { this._handlePageInput(); }
}
