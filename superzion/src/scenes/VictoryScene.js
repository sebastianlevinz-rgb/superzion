// ═══════════════════════════════════════════════════════════════
// VictoryScene — Epic victory narrative after defeating Supreme Turban
// Page-by-page text with SPACE/ENTER, ends with "Am Yisrael Chai"
// Phase 27: Spectacular sunset, illuminated hero, crowd, confetti, fireworks
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

    // Confetti & celebrator tracking
    this._confettiParticles = [];
    this._confettiTimer = null;
    this._celebratorTweens = [];

    this._initPages([
      {
        // Page 0
        text: "It's over.",
        color: '#FFD700', size: 32, y: H * 0.45,
        setup: () => this._spectacularSunset(),
      },
      {
        // Page 1
        text: "The tunnels are sealed. The generals are gone. The bunkers are rubble. The bomb will never be built.",
        color: '#ffffff', size: 18, y: H * 0.82,
        setup: () => {
          this._spectacularSunset();
          this._drawCliff();
          this._drawIlluminatedHero();
          this._drawDistantSmoke();
        },
      },
      {
        // Page 2
        text: "They said we wouldn't last a week in 1948.",
        color: '#cccccc', size: 22, y: H * 0.45,
        setup: () => this._spectacularSunset(),
      },
      {
        // Page 3
        text: "They said we couldn't survive surrounded.",
        color: '#cccccc', size: 22, y: H * 0.45,
      },
      {
        // Page 4
        text: "They said it was impossible.",
        color: '#cccccc', size: 22, y: H * 0.45,
      },
      {
        // Page 5
        text: "They were right. It was impossible.",
        color: '#ffffff', size: 24, y: H * 0.45,
      },
      {
        // Page 6 — flag + celebrators + confetti start
        text: "We did it anyway.",
        color: '#FFD700', size: 28, y: H * 0.75,
        setup: () => {
          this._spectacularSunset();
          this._drawFlag(W / 2, H * 0.30);
          this._drawCelebrators();
          this._spawnConfetti();
        },
        cleanup: () => this._stopConfetti(),
      },
      {
        // Page 7
        text: "Because our enemies keep changing their names...",
        color: '#cccccc', size: 20, y: H * 0.45,
        setup: () => {
          this._spectacularSunset();
          this._drawCelebrators();
          this._spawnConfetti();
        },
        cleanup: () => this._stopConfetti(),
      },
      {
        // Page 8
        text: "...but we never change ours.",
        color: '#ffffff', size: 24, y: H * 0.45,
        setup: () => {
          this._spectacularSunset();
          this._drawCelebrators();
          this._spawnConfetti();
          // Fireworks building up
          for (let i = 0; i < 3; i++) {
            this.time.delayedCall(i * 700, () => {
              if (this.skipped) return;
              this._launchFirework();
            });
          }
        },
        cleanup: () => this._stopConfetti(),
      },
      {
        // Page 9 — AM YISRAEL CHAI — fireworks extravaganza
        text: "Am Yisrael Chai.",
        color: '#FFD700', size: 36, y: H * 0.5,
        setup: () => {
          this._spectacularSunset();
          this._drawCelebrators();
          this._spawnConfetti();
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
          // 4 simultaneous fireworks
          for (let i = 0; i < 4; i++) {
            this._launchFirework();
          }
          // 6 staggered fireworks
          for (let i = 0; i < 6; i++) {
            this.time.delayedCall(400 + i * 350, () => {
              if (this.skipped) return;
              this._launchFirework();
            });
          }
        },
        cleanup: () => this._stopConfetti(),
      },
      {
        // Page 10 — final title screen
        text: '', color: '#000000', size: 1, y: -100, charDelay: 1,
        setup: () => {
          this._spectacularSunset();
          this._drawCelebrators();
          this._spawnConfetti();
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
          // Massive fireworks show
          for (let i = 0; i < 10; i++) {
            this.time.delayedCall(i * 400, () => {
              if (this.skipped) return;
              this._launchFirework();
            });
          }
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

  /** VICT-01: Spectacular sunset with multi-stop gradient, sun, rays, clouds */
  _spectacularSunset() {
    const skyGfx = this.add.graphics().setDepth(0);
    this._addPageVisual(skyGfx);

    // Multi-stop sky gradient
    const stops = [
      { pos: 0.00, r: 26, g: 10, b: 62 },   // deep purple #1a0a3e
      { pos: 0.25, r: 80, g: 22, b: 72 },   // dark magenta
      { pos: 0.45, r: 138, g: 32, b: 80 },  // pink #8a2050
      { pos: 0.60, r: 204, g: 102, b: 32 }, // orange #cc6620
      { pos: 0.75, r: 238, g: 153, b: 24 }, // gold #ee9918
      { pos: 0.88, r: 255, g: 204, b: 64 }, // bright gold #ffcc40
      { pos: 1.00, r: 255, g: 220, b: 120 },// horizon glow
    ];

    for (let y = 0; y < H; y++) {
      const t = y / H;
      // Find the two stops surrounding this position
      let lo = stops[0], hi = stops[1];
      for (let s = 0; s < stops.length - 1; s++) {
        if (t >= stops[s].pos && t <= stops[s + 1].pos) {
          lo = stops[s]; hi = stops[s + 1]; break;
        }
      }
      const segT = (hi.pos === lo.pos) ? 0 : (t - lo.pos) / (hi.pos - lo.pos);
      const r = lo.r + (hi.r - lo.r) * segT;
      const g = lo.g + (hi.g - lo.g) * segT;
      const b = lo.b + (hi.b - lo.b) * segT;
      skyGfx.fillStyle(Phaser.Display.Color.GetColor(r | 0, g | 0, b | 0), 1);
      skyGfx.fillRect(0, y, W, 1);
    }

    // Sun — large glow near horizon
    const sunX = W * 0.5, sunY = H * 0.82;
    // Outer glow rings (largest first)
    const glowLayers = [
      { radius: 120, color: 0xffcc40, alpha: 0.06 },
      { radius: 90, color: 0xffaa20, alpha: 0.10 },
      { radius: 65, color: 0xffbb30, alpha: 0.15 },
      { radius: 45, color: 0xffcc55, alpha: 0.25 },
      { radius: 30, color: 0xffdd88, alpha: 0.40 },
      { radius: 20, color: 0xffeebb, alpha: 0.60 },
      { radius: 12, color: 0xffffff, alpha: 0.85 },
    ];
    for (const gl of glowLayers) {
      const glow = this.add.circle(sunX, sunY, gl.radius, gl.color, gl.alpha).setDepth(1);
      this._addPageVisual(glow);
    }

    // Sun RAYS — 8 thin triangles emanating from sun
    const rayGfx = this.add.graphics().setDepth(1);
    this._addPageVisual(rayGfx);
    const numRays = 8;
    for (let i = 0; i < numRays; i++) {
      const angle = (Math.PI * 2 * i) / numRays - Math.PI / 2;
      const length = 180 + Math.random() * 80;
      const halfWidth = 8 + Math.random() * 6;
      const perpAngle = angle + Math.PI / 2;
      const tipX = sunX + Math.cos(angle) * length;
      const tipY = sunY + Math.sin(angle) * length;
      const baseX1 = sunX + Math.cos(perpAngle) * halfWidth;
      const baseY1 = sunY + Math.sin(perpAngle) * halfWidth;
      const baseX2 = sunX - Math.cos(perpAngle) * halfWidth;
      const baseY2 = sunY - Math.sin(perpAngle) * halfWidth;
      rayGfx.fillStyle(0xffcc40, 0.07 + Math.random() * 0.05);
      rayGfx.fillTriangle(baseX1, baseY1, baseX2, baseY2, tipX, tipY);
    }

    // CLOUDS — 7 illuminated cloud ellipses
    const cloudDefs = [
      { x: 100, y: 80,  w: 180, h: 28 },
      { x: 300, y: 55,  w: 220, h: 32 },
      { x: 520, y: 95,  w: 160, h: 24 },
      { x: 700, y: 65,  w: 200, h: 30 },
      { x: 850, y: 110, w: 170, h: 26 },
      { x: 200, y: 140, w: 140, h: 22 },
      { x: 620, y: 150, w: 190, h: 28 },
    ];
    for (const cd of cloudDefs) {
      // Dark bottom of cloud
      const darkCloud = this.add.ellipse(cd.x, cd.y + 4, cd.w, cd.h, 0x551830, 0.20).setDepth(2);
      this._addPageVisual(darkCloud);
      // Bright illuminated upper edge
      const brightCloud = this.add.ellipse(cd.x, cd.y - 3, cd.w * 0.95, cd.h * 0.7, 0xffaa55, 0.22).setDepth(2);
      this._addPageVisual(brightCloud);
      // Hot bright inner highlight
      const hotEdge = this.add.ellipse(cd.x, cd.y - 6, cd.w * 0.7, cd.h * 0.4, 0xffcc88, 0.18).setDepth(2);
      this._addPageVisual(hotEdge);
    }

    // Warm golden light wash over the bottom portion
    const washGfx = this.add.graphics().setDepth(1);
    this._addPageVisual(washGfx);
    for (let y = Math.floor(H * 0.6); y < H; y++) {
      const t = (y - H * 0.6) / (H * 0.4);
      washGfx.fillStyle(0xffcc40, t * 0.06);
      washGfx.fillRect(0, y, W, 1);
    }
  }

  _drawCliff() {
    const gfx = this.add.graphics().setDepth(3);
    this._addPageVisual(gfx);
    // Main cliff shape — dark brown
    gfx.fillStyle(0x1a1510, 1);
    gfx.beginPath();
    gfx.moveTo(280, H); gfx.lineTo(300, H - 100); gfx.lineTo(340, H - 130);
    gfx.lineTo(420, H - 150); gfx.lineTo(540, H - 150);
    gfx.lineTo(620, H - 130); gfx.lineTo(660, H - 100); gfx.lineTo(680, H);
    gfx.closePath(); gfx.fillPath();
    // Warm sunset highlight on top edge
    gfx.lineStyle(2, 0xcc8833, 0.35);
    gfx.beginPath();
    gfx.moveTo(300, H - 100); gfx.lineTo(340, H - 130);
    gfx.lineTo(420, H - 150); gfx.lineTo(540, H - 150);
    gfx.lineTo(620, H - 130); gfx.lineTo(660, H - 100);
    gfx.strokePath();
  }

  /** VICT-02: SuperZion illuminated by warm sunset light */
  _drawIlluminatedHero() {
    const gfx = this.add.graphics().setDepth(5);
    this._addPageVisual(gfx);
    const cx = 0, baseY = 0;

    // === LEGS ===
    // Left leg — dark tactical
    gfx.fillStyle(0x1a1a2a, 1);
    gfx.fillRect(cx - 13, baseY + 12, 11, 36);
    // Right leg — dark tactical
    gfx.fillRect(cx + 2, baseY + 12, 11, 36);
    // Orange rim light on outer edges of legs
    gfx.fillStyle(0xdd8830, 0.5);
    gfx.fillRect(cx + 11, baseY + 12, 2, 36);  // right leg outer
    gfx.fillRect(cx - 14, baseY + 12, 2, 36);  // left leg outer

    // === BOOTS ===
    gfx.fillStyle(0x111115, 1);
    gfx.fillRect(cx - 15, baseY + 46, 14, 7);
    gfx.fillRect(cx + 1, baseY + 46, 14, 7);
    // Boot rim light
    gfx.fillStyle(0xcc7722, 0.4);
    gfx.fillRect(cx - 15, baseY + 46, 14, 2);
    gfx.fillRect(cx + 1, baseY + 46, 14, 2);

    // === TORSO ===
    // Dark tactical suit body
    gfx.fillStyle(0x1a1a2a, 1);
    gfx.fillRect(cx - 15, baseY - 26, 30, 40);
    // Warm orange highlight on right side (sun-facing)
    gfx.fillStyle(0xcc7722, 0.4);
    gfx.fillRect(cx + 13, baseY - 26, 3, 40);
    // Subtle highlight on left side
    gfx.fillStyle(0x994411, 0.2);
    gfx.fillRect(cx - 16, baseY - 26, 2, 40);

    // === SHOULDERS / ARMS ===
    // Shoulder bar
    gfx.fillStyle(0x1a1a2a, 1);
    gfx.fillRect(cx - 18, baseY - 26, 36, 6);
    // Left arm
    gfx.fillRect(cx - 26, baseY - 24, 10, 28);
    // Right arm
    gfx.fillRect(cx + 16, baseY - 24, 10, 28);
    // Arm rim lighting (warm orange on outer edges)
    gfx.fillStyle(0xdd8830, 0.45);
    gfx.fillRect(cx + 24, baseY - 24, 2, 28);  // right arm outer
    gfx.fillRect(cx - 27, baseY - 24, 2, 28);  // left arm outer
    // Hands — skin-toned
    gfx.fillStyle(0xd4a574, 0.9);
    gfx.fillCircle(cx - 22, baseY + 6, 4);
    gfx.fillCircle(cx + 22, baseY + 6, 4);

    // === BELT ===
    gfx.fillStyle(0x333340, 1);
    gfx.fillRect(cx - 16, baseY + 8, 32, 4);

    // === NECK ===
    gfx.fillStyle(0xd4a574, 0.9);
    gfx.fillRect(cx - 4, baseY - 30, 8, 5);

    // === HEAD ===
    // Skin-toned face
    gfx.fillStyle(0xd4a574, 0.9);
    gfx.fillCircle(cx, baseY - 42, 13);
    // Dark hair on top
    gfx.fillStyle(0x1a1008, 1);
    gfx.fillEllipse(cx, baseY - 50, 22, 12);
    // Warm rim light on head (right side facing sun)
    gfx.fillStyle(0xee9933, 0.35);
    gfx.fillRect(cx + 10, baseY - 52, 3, 16);

    // === STAR OF DAVID on chest — glowing gold ===
    const starSize = 9;
    gfx.fillStyle(0xffd700, 0.9);
    gfx.fillTriangle(cx, baseY - 18, cx - starSize * 0.87, baseY - 8, cx + starSize * 0.87, baseY - 8);
    gfx.fillTriangle(cx, baseY - 4, cx - starSize * 0.87, baseY - 14, cx + starSize * 0.87, baseY - 14);
    // Star glow
    gfx.fillStyle(0xffd700, 0.25);
    gfx.fillCircle(cx, baseY - 11, 14);

    // === Overall golden rim-lighting glow ===
    // Soft outer glow on the sun-facing (right) side
    const glowGfx = this.add.graphics().setDepth(4);
    this._addPageVisual(glowGfx);
    glowGfx.fillStyle(0xffaa33, 0.08);
    glowGfx.fillEllipse(cx + 8, baseY - 5, 55, 110);
    glowGfx.setPosition(W / 2, H - 150);

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

  /** VICT-03: Celebrating crowd at bottom of screen */
  _drawCelebrators() {
    const crowdY = H - 8;
    const numPeople = 18;
    const spacing = (W - 120) / numPeople;
    const startX = 60;

    for (let i = 0; i < numPeople; i++) {
      const px = startX + i * spacing + Phaser.Math.Between(-8, 8);
      const personH = Phaser.Math.Between(10, 15);
      const gfx = this.add.graphics().setDepth(15);
      this._addPageVisual(gfx);

      // Small stick-figure silhouette
      gfx.fillStyle(0x0a0808, 0.85);
      // Head
      gfx.fillCircle(0, -personH, 3);
      // Body
      gfx.fillRect(-1, -personH + 3, 2, personH * 0.45);
      // Legs
      const legTop = -personH + 3 + personH * 0.45;
      gfx.fillRect(-3, legTop, 2, personH * 0.35);
      gfx.fillRect(1, legTop, 2, personH * 0.35);

      // Arms — raised for some, down for others
      const armsUp = Math.random() > 0.5;
      if (armsUp) {
        // Arms up (celebrating)
        gfx.fillRect(-5, -personH + 4, 2, 5);
        gfx.fillRect(3, -personH + 4, 2, 5);
        // Animate arm waving via subtle rotation tween
        gfx.setPosition(px, crowdY);
        this.tweens.add({
          targets: gfx,
          angle: { from: -5, to: 5 },
          duration: 300 + Phaser.Math.Between(0, 200),
          yoyo: true, repeat: -1,
          ease: 'Sine.easeInOut',
        });
      } else {
        // Arms at side
        gfx.fillRect(-4, -personH + 5, 2, 4);
        gfx.fillRect(2, -personH + 5, 2, 4);
        gfx.setPosition(px, crowdY);
      }

      // Some people jumping
      if (Math.random() > 0.6) {
        this.tweens.add({
          targets: gfx,
          y: crowdY - Phaser.Math.Between(4, 8),
          duration: 350 + Phaser.Math.Between(0, 250),
          yoyo: true, repeat: -1,
          ease: 'Sine.easeOut',
          delay: Phaser.Math.Between(0, 500),
        });
      }

      // 3-4 people holding small Israel flags
      if (i % 5 === 0 && i < 16) {
        const flagGfx = this.add.graphics().setDepth(16);
        this._addPageVisual(flagGfx);
        // Tiny flag: pole + white rectangle + blue stripes
        flagGfx.fillStyle(0x888888, 0.9);
        flagGfx.fillRect(0, -8, 1, 12); // pole
        flagGfx.fillStyle(0xffffff, 0.9);
        flagGfx.fillRect(1, -8, 10, 7); // white field
        flagGfx.fillStyle(0x0038b8, 0.9);
        flagGfx.fillRect(1, -7, 10, 1.5); // top stripe
        flagGfx.fillRect(1, -3, 10, 1.5); // bottom stripe
        flagGfx.setPosition(px + 3, crowdY - personH - 2);
        // Sway
        this.tweens.add({
          targets: flagGfx,
          angle: { from: -8, to: 8 },
          duration: 600 + Phaser.Math.Between(0, 300),
          yoyo: true, repeat: -1,
          ease: 'Sine.easeInOut',
        });
      }
    }
  }

  /** VICT-04: Continuous confetti spawner — gold, blue, white particles */
  _spawnConfetti() {
    this._stopConfetti(); // clean up any previous

    const colors = [0xFFD700, 0x0055ff, 0xffffff, 0xFFD700, 0xFFD700]; // weighted toward gold
    let particleCount = 0;

    this._confettiTimer = this.time.addEvent({
      delay: 80,
      repeat: -1,
      callback: () => {
        if (this.skipped) return;
        // Keep ~40 particles on screen
        if (particleCount >= 45) return;

        const x = Phaser.Math.Between(20, W - 20);
        const color = Phaser.Utils.Array.GetRandom(colors);
        const rect = this.add.rectangle(x, -5, 2, 4, color, 0.9).setDepth(30);
        this._addPageVisual(rect);
        particleCount++;

        // Horizontal drift amplitude
        const driftAmp = Phaser.Math.Between(15, 40);
        const driftSpeed = Phaser.Math.Between(400, 800);
        const fallDuration = Phaser.Math.Between(2500, 4000);

        // Sine-wave horizontal drift
        this.tweens.add({
          targets: rect,
          x: x + driftAmp,
          duration: driftSpeed,
          yoyo: true, repeat: -1,
          ease: 'Sine.easeInOut',
        });

        // Fall down
        this.tweens.add({
          targets: rect,
          y: H + 10,
          alpha: 0.3,
          duration: fallDuration,
          ease: 'Linear',
          onComplete: () => {
            particleCount--;
            rect.destroy();
          },
        });

        // Gentle rotation
        this.tweens.add({
          targets: rect,
          angle: Phaser.Math.Between(-180, 180),
          duration: fallDuration,
          ease: 'Linear',
        });
      },
    });
  }

  /** Stop confetti spawner */
  _stopConfetti() {
    if (this._confettiTimer) {
      this._confettiTimer.remove();
      this._confettiTimer = null;
    }
  }

  /** VICT-05: Enhanced fireworks with more particles, colors, trails */
  _launchFirework() {
    if (this.skipped) return;
    const sx = Phaser.Math.Between(80, W - 80);
    const peakY = Phaser.Math.Between(60, 200);

    // Rocket trail
    const rocket = this.add.circle(sx, H + 10, 3, 0xffffff, 0.9).setDepth(25);

    // Trail dots while ascending
    const trailTimer = this.time.addEvent({
      delay: 40,
      repeat: 14,
      callback: () => {
        if (this.skipped || !rocket.active) return;
        const trail = this.add.circle(rocket.x + Phaser.Math.Between(-1, 1), rocket.y, 1.5, 0xffcc66, 0.5).setDepth(24);
        this.tweens.add({ targets: trail, alpha: 0, scaleX: 0.3, scaleY: 0.3, duration: 300, onComplete: () => trail.destroy() });
      },
    });

    this.tweens.add({
      targets: rocket, y: peakY, duration: 600, ease: 'Cubic.easeOut',
      onComplete: () => {
        if (this.skipped) return;
        rocket.destroy();
        trailTimer.remove();

        const colors = [0xFFD700, 0x0055ff, 0xffffff, 0xff3333, 0x33ff55, 0xff66cc];
        const burstColor1 = Phaser.Utils.Array.GetRandom(colors);
        const burstColor2 = Phaser.Utils.Array.GetRandom(colors);
        const numParticles = 24;
        const spread = 50;

        for (let i = 0; i < numParticles; i++) {
          const a = (Math.PI * 2 * i) / numParticles;
          const d = spread + Phaser.Math.Between(0, 30);
          const color = (i % 2 === 0) ? burstColor1 : burstColor2;
          const targetX = sx + Math.cos(a) * d;
          const targetY = peakY + Math.sin(a) * d + 20;

          const p = this.add.circle(sx, peakY, 2.5, color, 1).setDepth(25);
          this.tweens.add({
            targets: p,
            x: targetX,
            y: targetY,
            alpha: 0,
            duration: 700 + Phaser.Math.Between(0, 200),
            ease: 'Cubic.easeOut',
            onUpdate: () => {
              // Trail effect — small fading dot behind each particle
              if (Math.random() > 0.6 && p.active) {
                const dot = this.add.circle(p.x, p.y, 1, color, 0.4).setDepth(24);
                this.tweens.add({
                  targets: dot, alpha: 0, duration: 250,
                  onComplete: () => dot.destroy(),
                });
              }
            },
            onComplete: () => p.destroy(),
          });
        }

        // Central flash
        const flash = this.add.circle(sx, peakY, 8, 0xffffff, 0.7).setDepth(26);
        this.tweens.add({ targets: flash, alpha: 0, scaleX: 3, scaleY: 3, duration: 300, onComplete: () => flash.destroy() });
      },
    });
  }

  update() { this._handlePageInput(); }
}
