// ═══════════════════════════════════════════════════════════════
// GameIntroScene — Narrative-driven intro cinematic
// Page-by-page text with SPACE/ENTER advancement, visual scenes
// ═══════════════════════════════════════════════════════════════

import Phaser from 'phaser';
import BaseCinematicScene, { W, H } from './BaseCinematicScene.js';
import SoundManager from '../systems/SoundManager.js';
import MusicManager from '../systems/MusicManager.js';
import { generateAllParadeTextures } from '../utils/ParadeTextures.js';

export default class GameIntroScene extends BaseCinematicScene {
  constructor() { super('GameIntroScene'); }

  create() {
    this._initCinematic();
    generateAllParadeTextures(this);

    // Start menu music (Am trance) from first frame — plays continuously into MenuScene
    MusicManager.get().playMenuMusic();

    // ── Define narrative pages (5 lines + boss parade + arsenal + hero + title) ──
    this._initPages([
      {
        text: 'For 3,000 years, they tried to erase us.',
        color: '#ffffff', size: 26, y: H * 0.45,
        setup: () => this._setupDestructionBg(),
      },
      {
        text: 'Babylon. Rome. The Inquisition. The Nazis. They\'re all gone. We\'re still here.',
        color: '#FFD700', size: 24, y: H * 0.45,
        setup: () => this._setupDestructionIntenseBg(),
      },
      {
        text: 'New enemies. Hamas. Hezbollah. The Iranian regime. Same mistake.',
        color: '#FF4444', size: 22, y: H * 0.45,
        setup: () => this._setupBossSilhouettes(),
      },
      {
        text: 'They forgot our secret weapon: we have nowhere else to go.',
        color: '#ffffff', size: 26, y: H * 0.82,
        setup: () => this._setupEnemyParade(),
      },
      {
        text: 'One Nation. One mission. 3,000 years of not giving up.',
        color: '#FFD700', size: 24, y: H * 0.85,
        setup: () => this._setupHeroReveal(),
      },

      // --- Title page ---
      {
        text: '',
        color: '#000000', size: 1, y: -100,
        charDelay: 1,
        setup: () => this._setupTitleReveal(),
        cleanup: () => { if (this._emberTimer) { this._emberTimer.remove(); this._emberTimer = null; } },
      },
    ], 'MenuScene');
  }

  // ═════════════════════════════════════════════════════════════
  // VISUAL SETUP FUNCTIONS
  // ═════════════════════════════════════════════════════════════

  /** Dark background with subtle smoke */
  _setupDarkBg() {
    const bg = this.add.graphics().setDepth(0);
    this._addPageVisual(bg);
    for (let y = 0; y < H; y++) {
      const t = y / H;
      bg.fillStyle(Phaser.Display.Color.GetColor(5 + t * 15 | 0, 3 + t * 8 | 0, 8 + t * 12 | 0));
      bg.fillRect(0, y, W, 1);
    }
    // Subtle smoke
    for (let i = 0; i < 6; i++) {
      bg.fillStyle(0x111111, 0.15);
      bg.fillCircle(Math.random() * W, Math.random() * H, 40 + Math.random() * 60);
    }
  }

  // ── INTR-01: Destruction backgrounds (pages 0-1) ──

  /** Page 0 — Flames, dark ruins, floating embers */
  _setupDestructionBg() {
    // Almost-black gradient background
    const bg = this.add.graphics().setDepth(0);
    this._addPageVisual(bg);
    for (let y = 0; y < H; y++) {
      const t = y / H;
      bg.fillStyle(Phaser.Display.Color.GetColor(
        8 + t * 25 | 0,
        2 + t * 6 | 0,
        2 + t * 4 | 0
      ));
      bg.fillRect(0, y, W, 1);
    }

    // Abstract ruin silhouettes — dark gray rectangles suggesting crumbling buildings
    const ruins = this.add.graphics().setDepth(1);
    this._addPageVisual(ruins);
    const ruinDefs = [
      { x: 60, w: 35, h: 120 }, { x: 130, w: 20, h: 80 },
      { x: 200, w: 45, h: 140 }, { x: 780, w: 30, h: 100 },
      { x: 850, w: 40, h: 130 }, { x: 900, w: 25, h: 90 },
    ];
    for (const rd of ruinDefs) {
      // Main column
      ruins.fillStyle(0x1a1210, 0.8);
      ruins.fillRect(rd.x, H - rd.h, rd.w, rd.h);
      // Jagged top — broken edge
      ruins.fillStyle(0x1a1210, 0.8);
      ruins.fillTriangle(
        rd.x, H - rd.h,
        rd.x + rd.w * 0.6, H - rd.h - 15,
        rd.x + rd.w, H - rd.h
      );
      // Crack line
      ruins.lineStyle(1, 0x0d0a08, 0.6);
      ruins.lineBetween(
        rd.x + rd.w * 0.4, H - rd.h + 10,
        rd.x + rd.w * 0.6, H
      );
    }

    // Animated flame-like graphics at bottom
    const flameColors = [0xff4400, 0xff6600, 0xff8800, 0xcc2200];
    for (let i = 0; i < 8; i++) {
      const fx = 40 + (i / 8) * (W - 80) + (Math.random() - 0.5) * 60;
      const fy = H - 20 - Math.random() * 30;
      const fr = 12 + Math.random() * 18;
      const color = flameColors[i % flameColors.length];
      const flame = this.add.circle(fx, fy, fr, color, 0.35).setDepth(2);
      this._addPageVisual(flame);
      // Pulsing scale to simulate flickering
      this.tweens.add({
        targets: flame,
        scaleX: 0.6 + Math.random() * 0.5,
        scaleY: 1.2 + Math.random() * 0.6,
        alpha: 0.15 + Math.random() * 0.2,
        duration: 400 + Math.random() * 400,
        yoyo: true, repeat: -1,
        ease: 'Sine.easeInOut',
        delay: Math.random() * 300,
      });
    }

    // Floating ember particles rising upward
    for (let i = 0; i < 12; i++) {
      const ex = Math.random() * W;
      const ey = H + 10 + Math.random() * 40;
      const eSize = 1.5 + Math.random() * 2.5;
      const emberColor = Math.random() > 0.5 ? 0xffaa00 : 0xff6600;
      const ember = this.add.circle(ex, ey, eSize, emberColor, 0.6).setDepth(3);
      this._addPageVisual(ember);
      this.tweens.add({
        targets: ember,
        y: -20,
        x: ex + (Math.random() - 0.5) * 80,
        alpha: 0,
        duration: 3000 + Math.random() * 3000,
        delay: Math.random() * 2000,
        repeat: -1,
        ease: 'Sine.easeIn',
        onRepeat: () => {
          ember.x = Math.random() * W;
          ember.y = H + 10;
          ember.alpha = 0.6;
        },
      });
    }
  }

  /** Page 1 — More intense destruction: wider flames, red glow from below */
  _setupDestructionIntenseBg() {
    // Dark background with stronger red tint
    const bg = this.add.graphics().setDepth(0);
    this._addPageVisual(bg);
    for (let y = 0; y < H; y++) {
      const t = y / H;
      bg.fillStyle(Phaser.Display.Color.GetColor(
        12 + t * 45 | 0,
        2 + t * 6 | 0,
        2 + t * 4 | 0
      ));
      bg.fillRect(0, y, W, 1);
    }

    // Red glow from below — large gradient circles at bottom
    const glowGfx = this.add.graphics().setDepth(1);
    this._addPageVisual(glowGfx);
    const glowPositions = [
      { x: W * 0.15, r: 120 }, { x: W * 0.4, r: 140 },
      { x: W * 0.65, r: 130 }, { x: W * 0.85, r: 110 },
    ];
    for (const gp of glowPositions) {
      // Layered circles for soft gradient effect
      for (let lr = gp.r; lr > 10; lr -= 15) {
        const alpha = 0.03 + (1 - lr / gp.r) * 0.06;
        glowGfx.fillStyle(0xff2200, alpha);
        glowGfx.fillCircle(gp.x, H + 10, lr);
      }
    }

    // More ruin silhouettes — denser, more broken
    const ruins = this.add.graphics().setDepth(2);
    this._addPageVisual(ruins);
    const ruinDefs = [
      { x: 30, w: 40, h: 150 }, { x: 100, w: 25, h: 90 },
      { x: 160, w: 50, h: 170 }, { x: 260, w: 30, h: 110 },
      { x: 680, w: 35, h: 120 }, { x: 750, w: 45, h: 160 },
      { x: 830, w: 28, h: 95 }, { x: 890, w: 38, h: 140 },
    ];
    for (const rd of ruinDefs) {
      ruins.fillStyle(0x1a0d08, 0.85);
      ruins.fillRect(rd.x, H - rd.h, rd.w, rd.h);
      // Jagged broken top
      ruins.fillTriangle(
        rd.x - 3, H - rd.h,
        rd.x + rd.w * 0.5, H - rd.h - 12 - Math.random() * 10,
        rd.x + rd.w + 3, H - rd.h
      );
    }

    // Intense flames — wider spread, more layers
    const flameColors = [0xff2200, 0xff4400, 0xff6600, 0xff8800, 0xffaa00];
    for (let i = 0; i < 16; i++) {
      const fx = (i / 16) * W + (Math.random() - 0.5) * 40;
      const fy = H - 15 - Math.random() * 40;
      const fr = 14 + Math.random() * 22;
      const color = flameColors[i % flameColors.length];
      const flame = this.add.circle(fx, fy, fr, color, 0.4).setDepth(3);
      this._addPageVisual(flame);
      this.tweens.add({
        targets: flame,
        scaleX: 0.5 + Math.random() * 0.5,
        scaleY: 1.3 + Math.random() * 0.8,
        alpha: 0.1 + Math.random() * 0.25,
        duration: 300 + Math.random() * 400,
        yoyo: true, repeat: -1,
        ease: 'Sine.easeInOut',
        delay: Math.random() * 200,
      });
    }

    // Dense ember shower
    for (let i = 0; i < 20; i++) {
      const ex = Math.random() * W;
      const ey = H + 10 + Math.random() * 50;
      const eSize = 1 + Math.random() * 3;
      const emberColor = [0xffaa00, 0xff6600, 0xff4400, 0xffcc00][i % 4];
      const ember = this.add.circle(ex, ey, eSize, emberColor, 0.7).setDepth(3);
      this._addPageVisual(ember);
      this.tweens.add({
        targets: ember,
        y: -30,
        x: ex + (Math.random() - 0.5) * 120,
        alpha: 0,
        duration: 2500 + Math.random() * 2500,
        delay: Math.random() * 1500,
        repeat: -1,
        ease: 'Sine.easeIn',
        onRepeat: () => {
          ember.x = Math.random() * W;
          ember.y = H + 10;
          ember.alpha = 0.7;
        },
      });
    }

    // Occasional camera flicker to suggest instability
    this.time.delayedCall(800, () => {
      if (this.skipped) return;
      this.cameras.main.shake(150, 0.004);
    });
  }

  // ── INTR-02: Point of light (page 2) ──

  /** Page 2 — A spark of hope in total darkness */
  _setupLightPointBg() {
    // Very dark background — near black
    const bg = this.add.graphics().setDepth(0);
    this._addPageVisual(bg);
    for (let y = 0; y < H; y++) {
      const t = y / H;
      bg.fillStyle(Phaser.Display.Color.GetColor(
        3 + t * 5 | 0,
        2 + t * 4 | 0,
        4 + t * 6 | 0
      ));
      bg.fillRect(0, y, W, 1);
    }

    const cx = W / 2, cy = H / 2;

    // Outer soft pulsing glow — warm golden
    const outerGlow = this.add.circle(cx, cy, 60, 0xFFD700, 0).setDepth(1);
    this._addPageVisual(outerGlow);
    this.tweens.add({
      targets: outerGlow,
      alpha: 0.08,
      scale: 1.3,
      duration: 1200,
      ease: 'Sine.easeOut',
    });
    // Pulsing
    this.tweens.add({
      targets: outerGlow,
      alpha: { from: 0.08, to: 0.14 },
      scale: { from: 1.3, to: 1.5 },
      duration: 1500,
      yoyo: true, repeat: -1,
      ease: 'Sine.easeInOut',
      delay: 1200,
    });

    // Middle glow layer
    const midGlow = this.add.circle(cx, cy, 25, 0xFFF0C0, 0).setDepth(2);
    this._addPageVisual(midGlow);
    this.tweens.add({
      targets: midGlow,
      alpha: 0.2,
      duration: 1000,
      delay: 300,
      ease: 'Sine.easeOut',
    });
    this.tweens.add({
      targets: midGlow,
      alpha: { from: 0.2, to: 0.3 },
      scale: { from: 1, to: 1.15 },
      duration: 1200,
      yoyo: true, repeat: -1,
      ease: 'Sine.easeInOut',
      delay: 1300,
    });

    // Core light — small bright point, starts tiny and grows
    const core = this.add.circle(cx, cy, 4, 0xffffff, 0).setDepth(3);
    this._addPageVisual(core);
    this.tweens.add({
      targets: core,
      alpha: 0.9,
      scale: 1.5,
      duration: 800,
      delay: 500,
      ease: 'Back.easeOut',
    });
    // Gentle breathing
    this.tweens.add({
      targets: core,
      alpha: { from: 0.9, to: 1 },
      scale: { from: 1.5, to: 1.8 },
      duration: 1000,
      yoyo: true, repeat: -1,
      ease: 'Sine.easeInOut',
      delay: 1300,
    });
  }

  // ── INTR-03: Growing light (pages 3-4) ──

  /** Page 3 — Light is bigger, warm golden glow spreading */
  _setupGrowingLight1() {
    // Dark background but slightly warmer than light-point page
    const bg = this.add.graphics().setDepth(0);
    this._addPageVisual(bg);
    for (let y = 0; y < H; y++) {
      const t = y / H;
      bg.fillStyle(Phaser.Display.Color.GetColor(
        5 + t * 10 | 0,
        4 + t * 8 | 0,
        2 + t * 5 | 0
      ));
      bg.fillRect(0, y, W, 1);
    }

    const cx = W / 2, cy = H / 2;

    // Outer wide glow — the light has grown significantly
    const wideGlow = this.add.circle(cx, cy, 150, 0xFFD700, 0).setDepth(1);
    this._addPageVisual(wideGlow);
    this.tweens.add({
      targets: wideGlow,
      alpha: 0.06,
      duration: 800,
      ease: 'Sine.easeOut',
    });
    this.tweens.add({
      targets: wideGlow,
      alpha: { from: 0.06, to: 0.1 },
      scale: { from: 1, to: 1.15 },
      duration: 2000,
      yoyo: true, repeat: -1,
      ease: 'Sine.easeInOut',
      delay: 800,
    });

    // Middle glow — warmer and brighter
    const midGlow = this.add.circle(cx, cy, 70, 0xFFF0C0, 0).setDepth(2);
    this._addPageVisual(midGlow);
    this.tweens.add({
      targets: midGlow,
      alpha: 0.18,
      duration: 600,
      ease: 'Sine.easeOut',
    });
    this.tweens.add({
      targets: midGlow,
      alpha: { from: 0.18, to: 0.28 },
      scale: { from: 1, to: 1.12 },
      duration: 1500,
      yoyo: true, repeat: -1,
      ease: 'Sine.easeInOut',
      delay: 600,
    });

    // Inner bright core — bigger than before
    const core = this.add.circle(cx, cy, 12, 0xffffff, 0).setDepth(3);
    this._addPageVisual(core);
    this.tweens.add({
      targets: core,
      alpha: 0.85,
      duration: 500,
      ease: 'Sine.easeOut',
    });
    this.tweens.add({
      targets: core,
      alpha: { from: 0.85, to: 1 },
      scale: { from: 1, to: 1.2 },
      duration: 1200,
      yoyo: true, repeat: -1,
      ease: 'Sine.easeInOut',
      delay: 500,
    });

    // Subtle ray hints — small elongated ellipses radiating out
    const rayCount = 6;
    for (let i = 0; i < rayCount; i++) {
      const angle = (i / rayCount) * Math.PI * 2;
      const rayDist = 90;
      const rx = cx + Math.cos(angle) * rayDist;
      const ry = cy + Math.sin(angle) * rayDist;
      const ray = this.add.ellipse(rx, ry, 4, 30, 0xFFD700, 0).setDepth(2);
      ray.setRotation(angle + Math.PI / 2);
      this._addPageVisual(ray);
      this.tweens.add({
        targets: ray,
        alpha: 0.12,
        duration: 800,
        delay: 200 + i * 100,
        ease: 'Sine.easeOut',
      });
      this.tweens.add({
        targets: ray,
        alpha: { from: 0.12, to: 0.2 },
        scaleY: { from: 1, to: 1.3 },
        duration: 1400,
        yoyo: true, repeat: -1,
        ease: 'Sine.easeInOut',
        delay: 1000 + i * 100,
      });
    }
  }

  /** Page 4 — Light fills more of the screen, golden rays emerging, darkness retreating */
  _setupGrowingLight2() {
    // Background is warmer — darkness pushed to edges
    const bg = this.add.graphics().setDepth(0);
    this._addPageVisual(bg);
    for (let y = 0; y < H; y++) {
      const t = y / H;
      bg.fillStyle(Phaser.Display.Color.GetColor(
        10 + t * 18 | 0,
        8 + t * 14 | 0,
        3 + t * 8 | 0
      ));
      bg.fillRect(0, y, W, 1);
    }

    const cx = W / 2, cy = H / 2;

    // Very wide ambient glow — light is dominating
    const ambientGlow = this.add.circle(cx, cy, 250, 0xFFD700, 0).setDepth(1);
    this._addPageVisual(ambientGlow);
    this.tweens.add({
      targets: ambientGlow,
      alpha: 0.07,
      duration: 600,
      ease: 'Sine.easeOut',
    });
    this.tweens.add({
      targets: ambientGlow,
      alpha: { from: 0.07, to: 0.12 },
      scale: { from: 1, to: 1.1 },
      duration: 2500,
      yoyo: true, repeat: -1,
      ease: 'Sine.easeInOut',
      delay: 600,
    });

    // Secondary warm layer
    const warmLayer = this.add.circle(cx, cy, 130, 0xFFF8E0, 0).setDepth(1);
    this._addPageVisual(warmLayer);
    this.tweens.add({
      targets: warmLayer,
      alpha: 0.12,
      duration: 500,
      ease: 'Sine.easeOut',
    });
    this.tweens.add({
      targets: warmLayer,
      alpha: { from: 0.12, to: 0.2 },
      scale: { from: 1, to: 1.08 },
      duration: 1800,
      yoyo: true, repeat: -1,
      ease: 'Sine.easeInOut',
      delay: 500,
    });

    // Bright core — substantially bigger
    const core = this.add.circle(cx, cy, 22, 0xffffff, 0).setDepth(3);
    this._addPageVisual(core);
    this.tweens.add({
      targets: core,
      alpha: 0.9,
      duration: 400,
      ease: 'Sine.easeOut',
    });
    this.tweens.add({
      targets: core,
      alpha: { from: 0.9, to: 1 },
      scale: { from: 1, to: 1.15 },
      duration: 1000,
      yoyo: true, repeat: -1,
      ease: 'Sine.easeInOut',
      delay: 400,
    });

    // Prominent golden rays — longer, brighter, more of them
    const rayCount = 10;
    for (let i = 0; i < rayCount; i++) {
      const angle = (i / rayCount) * Math.PI * 2;
      const rayDist = 120;
      const rx = cx + Math.cos(angle) * rayDist;
      const ry = cy + Math.sin(angle) * rayDist;
      const ray = this.add.ellipse(rx, ry, 5, 50, 0xFFD700, 0).setDepth(2);
      ray.setRotation(angle + Math.PI / 2);
      this._addPageVisual(ray);
      this.tweens.add({
        targets: ray,
        alpha: 0.18,
        duration: 600,
        delay: i * 80,
        ease: 'Sine.easeOut',
      });
      this.tweens.add({
        targets: ray,
        alpha: { from: 0.18, to: 0.3 },
        scaleY: { from: 1, to: 1.4 },
        duration: 1200,
        yoyo: true, repeat: -1,
        ease: 'Sine.easeInOut',
        delay: 600 + i * 80,
      });
    }

    // Dark edge vignette — darkness retreating to corners
    const vignette = this.add.graphics().setDepth(1);
    this._addPageVisual(vignette);
    // Corner shadows to show darkness pushed outward
    const cornerData = [
      { x: 0, y: 0 }, { x: W, y: 0 },
      { x: 0, y: H }, { x: W, y: H },
    ];
    for (const cd of cornerData) {
      for (let lr = 180; lr > 30; lr -= 20) {
        const alpha = 0.02 + (lr / 180) * 0.04;
        vignette.fillStyle(0x000000, alpha);
        vignette.fillCircle(cd.x, cd.y, lr);
      }
    }
  }

  /** Map of Israel surrounded by enemy org logos */
  _setupMapScene() {
    // Dark red background
    const bg = this.add.graphics().setDepth(0);
    this._addPageVisual(bg);
    for (let y = 0; y < H; y++) {
      const t = y / H;
      bg.fillStyle(Phaser.Display.Color.GetColor(20 + t * 40 | 0, 3 + t * 8 | 0, 3 + t * 5 | 0));
      bg.fillRect(0, y, W, 1);
    }

    // Simple Israel map shape (elongated, narrow)
    const mapGfx = this.add.graphics().setDepth(5);
    this._addPageVisual(mapGfx);
    const cx = W / 2, cy = H * 0.4;
    mapGfx.fillStyle(0x4488ff, 0.6);
    mapGfx.beginPath();
    mapGfx.moveTo(cx - 8, cy - 80);
    mapGfx.lineTo(cx + 15, cy - 70);
    mapGfx.lineTo(cx + 20, cy - 30);
    mapGfx.lineTo(cx + 10, cy + 10);
    mapGfx.lineTo(cx + 5, cy + 50);
    mapGfx.lineTo(cx, cy + 80);
    mapGfx.lineTo(cx - 5, cy + 50);
    mapGfx.lineTo(cx - 15, cy + 10);
    mapGfx.lineTo(cx - 20, cy - 20);
    mapGfx.lineTo(cx - 12, cy - 60);
    mapGfx.closePath();
    mapGfx.fill();
    // Glow
    mapGfx.fillStyle(0x4488ff, 0.15);
    mapGfx.fillCircle(cx, cy, 60);

    // Real enemy flags surrounding the map
    const orgPositions = [
      { key: 'flag_iran', x: cx - 180, y: cy - 40 },
      { key: 'flag_hamas', x: cx + 180, y: cy - 40 },
      { key: 'flag_hezbollah', x: cx - 120, y: cy + 80 },
      { key: 'flag_palestine', x: cx + 120, y: cy + 80 },
    ];
    orgPositions.forEach((od, i) => {
      if (this.textures.exists(od.key)) {
        const logo = this.add.sprite(od.x, od.y, od.key).setDepth(6).setScale(0.5).setAlpha(0);
        logo.play(od.key + '_wave');
        this._addPageVisual(logo);
        this.tweens.add({ targets: logo, alpha: 0.8, duration: 400, delay: i * 150 });
      }
    });

    // Red arrows pointing at Israel from each org
    const arrowGfx = this.add.graphics().setDepth(4);
    this._addPageVisual(arrowGfx);
    arrowGfx.lineStyle(2, 0xff2200, 0.4);
    orgPositions.forEach(od => {
      arrowGfx.lineBetween(od.x, od.y, cx, cy);
    });
  }

  /** 4 boss silhouettes with red glow */
  _setupBossSilhouettes() {
    // Very dark bg
    const bg = this.add.graphics().setDepth(0);
    this._addPageVisual(bg);
    for (let y = 0; y < H; y++) {
      const t = y / H;
      bg.fillStyle(Phaser.Display.Color.GetColor(8 + t * 20 | 0, 2 + t * 5 | 0, 2 + t * 5 | 0));
      bg.fillRect(0, y, W, 1);
    }

    // Boss sprites as dark silhouettes with red backlight
    const bossKeys = ['parade_foambeard', 'parade_turboturban', 'parade_angryeyebrows', 'parade_supremeturban'];
    const bossNames = ['ISMAIL HANIYEH', 'HASSAN NASRALLAH', 'YAHYA SINWAR', 'AYATOLLAH ALI KHAMENEI'];
    const spacing = W / 5;

    bossKeys.forEach((key, i) => {
      const bx = spacing * (i + 1);
      const by = H * 0.4;

      // Red glow behind — bigger and brighter
      const glow = this.add.circle(bx, by, 60, 0xff2200, 0).setDepth(3);
      this._addPageVisual(glow);
      this.tweens.add({ targets: glow, alpha: 0.45, duration: 600, delay: i * 200, yoyo: true, repeat: -1 });

      // Boss sprite (brighter red tint so details are visible)
      if (this.textures.exists(key)) {
        const boss = this.add.sprite(bx, by, key).setDepth(5).setScale(0.5).setAlpha(0).setTint(0x882222);
        this._addPageVisual(boss);
        // Zoom-in entrance: start at 0.5 scale, tween to 1.0
        this.tweens.add({
          targets: boss,
          alpha: 1.0,
          scale: 1.0,
          duration: 400,
          delay: i * 200,
          ease: 'Back.easeOut',
        });
      }

      // Name label — bigger font
      const label = this.add.text(bx, by + 65, bossNames[i], {
        fontFamily: 'monospace', fontSize: '13px', color: '#ff4444',
      }).setOrigin(0.5).setDepth(6).setAlpha(0);
      this._addPageVisual(label);
      this.tweens.add({ targets: label, alpha: 1, duration: 400, delay: i * 200 + 200 });
    });
  }

  /** Enemy parade — missiles, explosions, chaos */
  _setupEnemyParade() {
    // Red sky
    const bg = this.add.graphics().setDepth(0);
    this._addPageVisual(bg);
    for (let y = 0; y < H; y++) {
      const t = y / H;
      bg.fillStyle(Phaser.Display.Color.GetColor(30 + t * 80 | 0, 2 + t * 8 | 0, 2 + t * 5 | 0));
      bg.fillRect(0, y, W, 1);
    }
    // Ground
    bg.fillStyle(0x2a1508, 1);
    bg.fillRect(0, H - 60, W, 60);

    // Real enemy flags waving
    const orgData = [
      { key: 'flag_iran', x: 120 },
      { key: 'flag_hamas', x: W / 2 - 120 },
      { key: 'flag_hezbollah', x: W / 2 + 120 },
      { key: 'flag_palestine', x: W - 120 },
    ];
    orgData.forEach((fd, i) => {
      if (this.textures.exists(fd.key)) {
        const flag = this.add.sprite(fd.x, H / 2 - 10, fd.key).setDepth(4).setScale(0.6).setAlpha(0);
        flag.play(fd.key + '_wave');
        this._addPageVisual(flag);
        this.tweens.add({ targets: flag, alpha: 1, duration: 500, delay: i * 200 });
      }
    });

    // Missiles flying across (visual only, no sounds)
    for (let i = 0; i < 5; i++) {
      this.time.delayedCall(i * 400, () => {
        if (this.skipped) return;
        this._spawnMissile();
      });
    }
  }

  /** Israel flag waving on blue background */
  _setupIsraelFlag() {
    // Blue sky
    const bg = this.add.graphics().setDepth(0);
    this._addPageVisual(bg);
    for (let y = 0; y < H; y++) {
      const t = y / H;
      bg.fillStyle(Phaser.Display.Color.GetColor(20 + t * 60 | 0, 40 + t * 100 | 0, 120 + t * 80 | 0));
      bg.fillRect(0, y, W, 1);
    }

    // Israel flag
    if (this.textures.exists('flag_israel')) {
      const flag = this.add.sprite(W / 2, H * 0.4, 'flag_israel').setDepth(5).setScale(1.2).setAlpha(0);
      flag.play('flag_israel_wave');
      this._addPageVisual(flag);
      this.tweens.add({ targets: flag, alpha: 1, duration: 800 });
    }

    // Gentle visual effect only — no explosion sound
  }

  /** Israeli arsenal — jets, tanks, Iron Dome */
  _setupArsenal() {
    // Blue sky with desert ground
    const bg = this.add.graphics().setDepth(0);
    this._addPageVisual(bg);
    for (let y = 0; y < H; y++) {
      const t = y / H;
      bg.fillStyle(Phaser.Display.Color.GetColor(30 + t * 100 | 0, 80 + t * 130 | 0, 180 + t * 50 | 0));
      bg.fillRect(0, y, W, 1);
    }
    // Sun
    bg.fillStyle(0xfff8e0, 0.7);
    bg.fillCircle(160, 80, 25);
    // Ground
    bg.fillStyle(0x9a8a60, 1);
    bg.fillRect(0, H - 70, W, 70);

    // Jets streaking
    this.time.delayedCall(300, () => {
      if (this.skipped) return;
      this._spawnJetStrike(100, 120, false);
    });
    this.time.delayedCall(800, () => {
      if (this.skipped) return;
      this._spawnJetStrike(150, 180, false);
    });

    // Tanks on ground
    this._spawnTankStatic(200, H - 90);
    this._spawnTankStatic(500, H - 85);
    this._spawnTankStatic(750, H - 88);

    // Iron Dome launchers
    const domeGfx = this.add.graphics().setDepth(10);
    this._addPageVisual(domeGfx);
    for (const dx of [350, 600]) {
      domeGfx.fillStyle(0x556644, 1);
      domeGfx.fillRect(dx - 15, H - 80, 30, 12);
      domeGfx.fillStyle(0x667755, 1);
      domeGfx.fillRect(dx - 8, H - 95, 5, 18);
      domeGfx.fillRect(dx + 3, H - 95, 5, 18);
    }

    // ── B-2 Spirit flying across with F-15 escorts and drone ──
    this.time.delayedCall(1200, () => {
      if (this.skipped) return;

      // B-2 flying from left to right (large, center screen)
      const b2Gfx = this.add.graphics().setDepth(15);
      this._addPageVisual(b2Gfx);
      let b2X = -100;

      const drawB2 = () => {
        b2Gfx.clear();
        // Flying wing shape (top-down, nose right)
        b2Gfx.fillStyle(0x3a3a3a);
        b2Gfx.beginPath();
        b2Gfx.moveTo(b2X + 40, 160);           // nose
        b2Gfx.lineTo(b2X - 30, 160 - 50);      // upper wing tip
        b2Gfx.lineTo(b2X - 15, 160 - 40);      // upper trailing
        b2Gfx.lineTo(b2X - 5, 160);            // center rear
        b2Gfx.lineTo(b2X - 15, 160 + 40);      // lower trailing
        b2Gfx.lineTo(b2X - 30, 160 + 50);      // lower wing tip
        b2Gfx.closePath();
        b2Gfx.fill();
        // Engine glow
        b2Gfx.fillStyle(0xff6600, 0.6);
        b2Gfx.fillCircle(b2X - 10, 160 - 10, 3);
        b2Gfx.fillCircle(b2X - 10, 160 + 10, 3);
      };

      // F-15 escorts (smaller, above and below B-2)
      const escort1Gfx = this.add.graphics().setDepth(14);
      const escort2Gfx = this.add.graphics().setDepth(14);
      this._addPageVisual(escort1Gfx);
      this._addPageVisual(escort2Gfx);

      // Drone following behind
      const droneGfx = this.add.graphics().setDepth(13);
      this._addPageVisual(droneGfx);

      // Engine trails
      const trailGfx = this.add.graphics().setDepth(12);
      this._addPageVisual(trailGfx);

      const flyTimer = this.time.addEvent({
        delay: 16, repeat: 180, // ~3 seconds at 60fps
        callback: () => {
          b2X += 4;
          drawB2();

          // F-15 escort 1 (upper)
          escort1Gfx.clear();
          escort1Gfx.fillStyle(0x5a5a62);
          const e1x = b2X - 80, e1y = 110;
          escort1Gfx.beginPath();
          escort1Gfx.moveTo(e1x + 15, e1y);
          escort1Gfx.lineTo(e1x - 10, e1y - 12);
          escort1Gfx.lineTo(e1x - 5, e1y);
          escort1Gfx.lineTo(e1x - 10, e1y + 12);
          escort1Gfx.closePath();
          escort1Gfx.fill();

          // F-15 escort 2 (lower)
          escort2Gfx.clear();
          escort2Gfx.fillStyle(0x5a5a62);
          const e2x = b2X - 80, e2y = 210;
          escort2Gfx.beginPath();
          escort2Gfx.moveTo(e2x + 15, e2y);
          escort2Gfx.lineTo(e2x - 10, e2y - 12);
          escort2Gfx.lineTo(e2x - 5, e2y);
          escort2Gfx.lineTo(e2x - 10, e2y + 12);
          escort2Gfx.closePath();
          escort2Gfx.fill();

          // Drone (small, trailing)
          droneGfx.clear();
          droneGfx.fillStyle(0x4a6a4a);
          const dx = b2X - 140, dy = 160;
          droneGfx.fillRect(dx - 6, dy - 2, 12, 4);
          droneGfx.fillRect(dx - 3, dy - 6, 6, 12);

          // Engine trails
          trailGfx.clear();
          trailGfx.fillStyle(0xff8800, 0.15);
          trailGfx.fillRect(b2X - 40, 155, 30, 2);
          trailGfx.fillRect(b2X - 40, 165, 30, 2);
          trailGfx.fillStyle(0xaaaaaa, 0.1);
          trailGfx.fillRect(b2X - 60, 155, 40, 3);
          trailGfx.fillRect(b2X - 60, 166, 40, 3);
        },
      });
      this._addPageVisual({ destroy: () => flyTimer.remove() });
    });
  }

  /** SuperZion hero reveal — smoky battlefield, hero walks in */
  _setupHeroReveal() {
    // Smoky battlefield
    const bg = this.add.graphics().setDepth(0);
    this._addPageVisual(bg);
    for (let y = 0; y < H; y++) {
      const t = y / H;
      bg.fillStyle(Phaser.Display.Color.GetColor(12 + t * 30 | 0, 10 + t * 22 | 0, 8 + t * 18 | 0));
      bg.fillRect(0, y, W, 1);
    }
    bg.fillStyle(0x3a2818, 1);
    bg.fillRect(0, H - 80, W, 80);

    // Background fires and smoke
    const smokeGfx = this.add.graphics().setDepth(1);
    this._addPageVisual(smokeGfx);
    for (const [cx, cy, r] of [[80, 200, 50], [40, 300, 40], [150, 340, 35], [850, 180, 45], [780, 300, 35]]) {
      smokeGfx.fillStyle(0x3a1a08, 0.25);
      smokeGfx.fillCircle(cx, cy, r);
    }
    smokeGfx.fillStyle(0xff3300, 0.06);
    smokeGfx.fillCircle(60, 260, 55);
    smokeGfx.fillCircle(850, 250, 45);

    // SuperZion walks in
    if (this.textures.exists('parade_superzion')) {
      const heroY = H - 160;
      const hero = this.add.sprite(W + 80, heroY, 'parade_superzion').setDepth(20).setScale(2.0);
      this._addPageVisual(hero);

      // Walk bob
      this.tweens.add({
        targets: hero, y: heroY - 4,
        duration: 300, yoyo: true, repeat: 5, ease: 'Sine.easeInOut',
      });

      // Walk to center
      this.tweens.add({
        targets: hero, x: W / 2,
        duration: 2500, ease: 'Sine.easeOut',
      });
    }

    // ── B-2 Spirit flyover with F-15 escorts and drone ──
    this.time.delayedCall(1200, () => {
      if (this.skipped) return;

      const b2Gfx = this.add.graphics().setDepth(15);
      this._addPageVisual(b2Gfx);
      let b2X = -100;

      const drawB2 = () => {
        b2Gfx.clear();
        b2Gfx.fillStyle(0x3a3a3a);
        b2Gfx.beginPath();
        b2Gfx.moveTo(b2X + 40, 80);
        b2Gfx.lineTo(b2X - 30, 80 - 50);
        b2Gfx.lineTo(b2X - 15, 80 - 40);
        b2Gfx.lineTo(b2X - 5, 80);
        b2Gfx.lineTo(b2X - 15, 80 + 40);
        b2Gfx.lineTo(b2X - 30, 80 + 50);
        b2Gfx.closePath();
        b2Gfx.fill();
        b2Gfx.fillStyle(0xff6600, 0.6);
        b2Gfx.fillCircle(b2X - 10, 80 - 10, 3);
        b2Gfx.fillCircle(b2X - 10, 80 + 10, 3);
      };

      const escort1Gfx = this.add.graphics().setDepth(14);
      const escort2Gfx = this.add.graphics().setDepth(14);
      this._addPageVisual(escort1Gfx);
      this._addPageVisual(escort2Gfx);

      const droneGfx = this.add.graphics().setDepth(13);
      this._addPageVisual(droneGfx);

      const trailGfx = this.add.graphics().setDepth(12);
      this._addPageVisual(trailGfx);

      const flyTimer = this.time.addEvent({
        delay: 16, repeat: 180,
        callback: () => {
          b2X += 4;
          drawB2();

          escort1Gfx.clear();
          escort1Gfx.fillStyle(0x5a5a62);
          const e1x = b2X - 80, e1y = 40;
          escort1Gfx.beginPath();
          escort1Gfx.moveTo(e1x + 15, e1y);
          escort1Gfx.lineTo(e1x - 10, e1y - 12);
          escort1Gfx.lineTo(e1x - 5, e1y);
          escort1Gfx.lineTo(e1x - 10, e1y + 12);
          escort1Gfx.closePath();
          escort1Gfx.fill();

          escort2Gfx.clear();
          escort2Gfx.fillStyle(0x5a5a62);
          const e2x = b2X - 80, e2y = 120;
          escort2Gfx.beginPath();
          escort2Gfx.moveTo(e2x + 15, e2y);
          escort2Gfx.lineTo(e2x - 10, e2y - 12);
          escort2Gfx.lineTo(e2x - 5, e2y);
          escort2Gfx.lineTo(e2x - 10, e2y + 12);
          escort2Gfx.closePath();
          escort2Gfx.fill();

          droneGfx.clear();
          droneGfx.fillStyle(0x4a6a4a);
          const ddx = b2X - 140, ddy = 80;
          droneGfx.fillRect(ddx - 6, ddy - 2, 12, 4);
          droneGfx.fillRect(ddx - 3, ddy - 6, 6, 12);

          trailGfx.clear();
          trailGfx.fillStyle(0xff8800, 0.15);
          trailGfx.fillRect(b2X - 40, 75, 30, 2);
          trailGfx.fillRect(b2X - 40, 85, 30, 2);
          trailGfx.fillStyle(0xaaaaaa, 0.1);
          trailGfx.fillRect(b2X - 60, 75, 40, 3);
          trailGfx.fillRect(b2X - 60, 86, 40, 3);
        },
      });
      this._addPageVisual({ destroy: () => flyTimer.remove() });
    });
  }

  /** SUPERZION title reveal — post-apocalyptic chrome metal epic */
  _setupTitleReveal() {
    const cx = W / 2, cy = H / 2;
    const sm = SoundManager.get();

    // ══════════════════════════════════════════════════════════════
    // LAYER 0 — POST-APOCALYPTIC SKY (dark gradient with fire glow)
    // ══════════════════════════════════════════════════════════════
    const bg = this.add.graphics().setDepth(0);
    this._addPageVisual(bg);
    for (let y = 0; y < H; y++) {
      const t = y / H;
      // Dark smoky sky: top #080408 → mid #1a0a08 → bottom #0a0604
      const r = Math.round(8 + t * 18 * Math.sin(t * Math.PI));
      const g = Math.round(4 + t * 6 * Math.sin(t * Math.PI));
      const b = Math.round(8 - t * 6);
      bg.fillStyle(Phaser.Display.Color.GetColor(
        Math.max(0, r), Math.max(0, g), Math.max(0, Math.min(b, 10))
      ));
      bg.fillRect(0, y, W, 1);
    }

    // Distant fire glow at top center (explosion on horizon)
    for (let lr = 200; lr > 5; lr -= 8) {
      const a = 0.015 * (lr / 200);
      bg.fillStyle(0xff6600, a);
      bg.fillCircle(cx + 40, H * 0.22, lr);
    }
    for (let lr = 120; lr > 5; lr -= 6) {
      bg.fillStyle(0xffaa00, 0.02 * (lr / 120));
      bg.fillCircle(cx + 40, H * 0.18, lr);
    }
    // White-hot core
    bg.fillStyle(0xffeedd, 0.08);
    bg.fillCircle(cx + 40, H * 0.2, 30);

    // ══════════════════════════════════════════════════════════════
    // LAYER 1 — DESTROYED CITY SKYLINE (horizon silhouettes)
    // ══════════════════════════════════════════════════════════════
    const skyline = this.add.graphics().setDepth(1);
    this._addPageVisual(skyline);
    const horizY = H * 0.62;

    // Dark building silhouettes — jagged, broken
    skyline.fillStyle(0x0a0808, 1);
    const buildings = [
      { x: 0, w: 45, h: 80 }, { x: 50, w: 30, h: 120, broken: true },
      { x: 85, w: 50, h: 60 }, { x: 140, w: 25, h: 140, broken: true },
      { x: 170, w: 40, h: 90 }, { x: 215, w: 55, h: 70 },
      { x: 275, w: 35, h: 110, broken: true }, { x: 315, w: 45, h: 65 },
      { x: 365, w: 30, h: 130, broken: true }, { x: 400, w: 50, h: 85 },
      { x: 455, w: 40, h: 100 }, { x: 500, w: 55, h: 75 },
      { x: 560, w: 30, h: 145, broken: true }, { x: 595, w: 45, h: 95 },
      { x: 645, w: 35, h: 60 }, { x: 685, w: 50, h: 115, broken: true },
      { x: 740, w: 40, h: 80 }, { x: 785, w: 55, h: 70 },
      { x: 845, w: 30, h: 125, broken: true }, { x: 880, w: 45, h: 90 },
      { x: 930, w: 35, h: 75 },
    ];
    for (const b of buildings) {
      const by = horizY - b.h;
      if (b.broken) {
        // Jagged broken top
        skyline.beginPath();
        skyline.moveTo(b.x, horizY);
        skyline.lineTo(b.x, by + 15);
        skyline.lineTo(b.x + b.w * 0.3, by);
        skyline.lineTo(b.x + b.w * 0.5, by + 20);
        skyline.lineTo(b.x + b.w * 0.7, by + 5);
        skyline.lineTo(b.x + b.w, by + 25);
        skyline.lineTo(b.x + b.w, horizY);
        skyline.closePath();
        skyline.fill();
      } else {
        skyline.fillRect(b.x, by, b.w, b.h);
      }
      // Dim window flickers on some buildings
      if (b.h > 80 && Math.random() > 0.4) {
        skyline.fillStyle(0xff6600, 0.06);
        for (let wy = 0; wy < 3; wy++) {
          skyline.fillRect(b.x + 4 + Math.random() * (b.w - 10), by + 10 + wy * 20, 3, 4);
        }
        skyline.fillStyle(0x0a0808, 1);
      }
    }
    // Ground fill below horizon
    skyline.fillStyle(0x060404, 1);
    skyline.fillRect(0, horizY, W, H - horizY);

    // Rubble texture on ground
    skyline.fillStyle(0x1a1210, 1);
    for (let i = 0; i < 30; i++) {
      const rx = Math.random() * W;
      const ry = horizY + 5 + Math.random() * (H - horizY - 20);
      skyline.fillRect(rx, ry, 3 + Math.random() * 8, 2 + Math.random() * 3);
    }

    // ══════════════════════════════════════════════════════════════
    // LAYER 2 — SMOKE & ATMOSPHERE
    // ══════════════════════════════════════════════════════════════
    const smokeGfx = this.add.graphics().setDepth(2);
    this._addPageVisual(smokeGfx);
    // Smoke columns rising from ruins
    for (let i = 0; i < 8; i++) {
      const sx = 60 + Math.random() * (W - 120);
      const sy = horizY - 20 - Math.random() * 40;
      for (let j = 0; j < 6; j++) {
        smokeGfx.fillStyle(0x222218, 0.04 + Math.random() * 0.03);
        smokeGfx.fillCircle(sx + (Math.random() - 0.5) * 20, sy - j * 25 - Math.random() * 15, 15 + Math.random() * 25);
      }
    }
    // Haze layer
    smokeGfx.fillStyle(0x1a1008, 0.15);
    smokeGfx.fillRect(0, horizY - 40, W, 60);

    // ══════════════════════════════════════════════════════════════
    // LAYER 3 — SOLDIER SILHOUETTE (bottom-left foreground)
    // ══════════════════════════════════════════════════════════════
    const soldierGfx = this.add.graphics().setDepth(3);
    this._addPageVisual(soldierGfx);
    const solX = 100, solBaseY = H - 30;
    soldierGfx.fillStyle(0x050303, 1);
    // Body — standing, slightly turned
    soldierGfx.fillRect(solX - 4, solBaseY - 50, 8, 30); // torso
    soldierGfx.fillRect(solX - 5, solBaseY - 20, 4, 22); // left leg
    soldierGfx.fillRect(solX + 1, solBaseY - 20, 4, 22); // right leg
    // Head
    soldierGfx.fillCircle(solX, solBaseY - 55, 6);
    // Helmet rim
    soldierGfx.fillRect(solX - 7, solBaseY - 58, 14, 3);
    // Rifle (held diagonally)
    soldierGfx.lineStyle(2, 0x050303, 1);
    soldierGfx.lineBetween(solX + 5, solBaseY - 46, solX + 22, solBaseY - 65);
    // Rifle stock
    soldierGfx.lineBetween(solX + 5, solBaseY - 46, solX + 2, solBaseY - 38);
    // Slight orange-lit edge (backlit by fire)
    soldierGfx.lineStyle(1, 0x663300, 0.3);
    soldierGfx.lineBetween(solX + 4, solBaseY - 50, solX + 4, solBaseY - 22);
    // Rubble at feet
    soldierGfx.fillStyle(0x0a0606, 1);
    for (let i = 0; i < 8; i++) {
      soldierGfx.fillRect(solX - 20 + Math.random() * 50, solBaseY - 2 + Math.random() * 4, 4 + Math.random() * 8, 2 + Math.random() * 3);
    }

    // ══════════════════════════════════════════════════════════════
    // LAYER 4 — EMBERS & FIRE PARTICLES (continuous)
    // ══════════════════════════════════════════════════════════════
    const spawnEmber = () => {
      if (this.skipped) return;
      const ex = Math.random() * W;
      const ey = H + 10;
      const eSize = 1 + Math.random() * 2;
      const colors = [0xff6600, 0xff9900, 0xffcc00, 0xff4400, 0xffaa33];
      const color = colors[Math.floor(Math.random() * colors.length)];
      const ember = this.add.circle(ex, ey, eSize, color, 0.5 + Math.random() * 0.4).setDepth(4);
      this._addPageVisual(ember);
      const drift = (Math.random() - 0.5) * 80;
      this.tweens.add({
        targets: ember, y: -20, x: ex + drift, alpha: 0,
        duration: 3000 + Math.random() * 4000, ease: 'Linear',
        onComplete: () => { if (ember && ember.destroy) ember.destroy(); },
      });
    };
    // Continuous ember spawning
    this._emberTimer = this.time.addEvent({
      delay: 80, repeat: -1,
      callback: () => { if (!this.skipped) spawnEmber(); },
    });
    // Initial batch
    for (let i = 0; i < 30; i++) {
      const e = this.add.circle(Math.random() * W, Math.random() * H, 1 + Math.random(), 0xff6600, 0.2 + Math.random() * 0.3).setDepth(4);
      this._addPageVisual(e);
      this.tweens.add({
        targets: e, y: -20, x: e.x + (Math.random() - 0.5) * 60, alpha: 0,
        duration: 2000 + Math.random() * 3000, ease: 'Linear',
        onComplete: () => { if (e && e.destroy) e.destroy(); },
      });
    }

    // ══════════════════════════════════════════════════════════════
    // LAYER 5 — GOLDEN AURA (light source behind star)
    // ══════════════════════════════════════════════════════════════
    const auraGfx = this.add.graphics().setDepth(5);
    this._addPageVisual(auraGfx);
    // Large warm radial glow
    for (let lr = 280; lr > 10; lr -= 6) {
      const t = lr / 280;
      // Amber-gold glow: brighter near center
      const r2 = Math.round(255 * (1 - t * 0.6));
      const g2 = Math.round(180 * (1 - t * 0.7));
      const b2 = Math.round(40 * (1 - t * 0.8));
      auraGfx.fillStyle(Phaser.Display.Color.GetColor(r2, g2, b2), 0.008 + (1 - t) * 0.015);
      auraGfx.fillCircle(cx, cy - 10, lr);
    }
    // Pulsing glow
    this.tweens.add({
      targets: auraGfx, alpha: { from: 0.7, to: 1 },
      duration: 2000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });

    // ══════════════════════════════════════════════════════════════
    // LAYER 6 — METALLIC STAR OF DAVID (bronze/gold, light source)
    // ══════════════════════════════════════════════════════════════
    const starR = 180;
    const starCy = cy - 10;

    // Star golden glow halo behind
    const starHaloGfx = this.add.graphics().setDepth(6);
    this._addPageVisual(starHaloGfx);
    for (let lr = 220; lr > 10; lr -= 5) {
      starHaloGfx.fillStyle(0xFFD700, 0.005 + (1 - lr / 220) * 0.01);
      starHaloGfx.fillCircle(cx, starCy, lr);
    }

    // Main metallic star — canvas texture for gradient control
    const starTexKey = '__star_metal_tex';
    if (this.textures.exists(starTexKey)) this.textures.remove(starTexKey);
    const starCanvas = this.textures.createCanvas(starTexKey, 460, 460);
    const sCtx = starCanvas.context;
    const sCx = 230, sCy = 230;

    // Draw metallic star of david
    const drawStarTriangle = (rotation, fillGrad) => {
      sCtx.beginPath();
      for (let i = 0; i < 3; i++) {
        const a = rotation + (i * 2 * Math.PI) / 3;
        const tx = sCx + Math.cos(a) * 200;
        const ty = sCy + Math.sin(a) * 200;
        i === 0 ? sCtx.moveTo(tx, ty) : sCtx.lineTo(tx, ty);
      }
      sCtx.closePath();
      sCtx.fillStyle = fillGrad;
      sCtx.fill();
    };

    // Bronze/gold metallic gradient for triangle 1 (pointing up)
    const grad1 = sCtx.createLinearGradient(sCx, sCy - 200, sCx, sCy + 100);
    grad1.addColorStop(0, '#e8c44a');   // bright gold top
    grad1.addColorStop(0.3, '#c49520');  // warm bronze
    grad1.addColorStop(0.5, '#8B6914');  // dark bronze
    grad1.addColorStop(0.7, '#c49520');  // light again (metallic banding)
    grad1.addColorStop(1, '#a07818');
    drawStarTriangle(-Math.PI / 2, grad1);

    // Triangle 2 (pointing down) — slightly different gradient angle for metal effect
    const grad2 = sCtx.createLinearGradient(sCx - 100, sCy + 100, sCx + 100, sCy - 100);
    grad2.addColorStop(0, '#a07818');
    grad2.addColorStop(0.3, '#c49520');
    grad2.addColorStop(0.5, '#e8c44a');
    grad2.addColorStop(0.7, '#8B6914');
    grad2.addColorStop(1, '#c49520');
    drawStarTriangle(Math.PI / 2, grad2);

    // Edge highlights — bright stroke on both triangles
    sCtx.strokeStyle = '#FFD700';
    sCtx.lineWidth = 2.5;
    for (const rot of [-Math.PI / 2, Math.PI / 2]) {
      sCtx.beginPath();
      for (let i = 0; i < 3; i++) {
        const a = rot + (i * 2 * Math.PI) / 3;
        const tx = sCx + Math.cos(a) * 200;
        const ty = sCy + Math.sin(a) * 200;
        i === 0 ? sCtx.moveTo(tx, ty) : sCtx.lineTo(tx, ty);
      }
      sCtx.closePath();
      sCtx.stroke();
    }

    // Inner bright highlight lines — chrome reflection streaks
    sCtx.strokeStyle = 'rgba(255, 240, 180, 0.4)';
    sCtx.lineWidth = 1.5;
    for (const rot of [-Math.PI / 2, Math.PI / 2]) {
      sCtx.beginPath();
      for (let i = 0; i < 3; i++) {
        const a = rot + (i * 2 * Math.PI) / 3;
        const tx = sCx + Math.cos(a) * 180;
        const ty = sCy + Math.sin(a) * 180;
        i === 0 ? sCtx.moveTo(tx, ty) : sCtx.lineTo(tx, ty);
      }
      sCtx.closePath();
      sCtx.stroke();
    }

    // Center glow (intense light source)
    const cGlow = sCtx.createRadialGradient(sCx, sCy, 5, sCx, sCy, 80);
    cGlow.addColorStop(0, 'rgba(255, 250, 220, 0.5)');
    cGlow.addColorStop(0.3, 'rgba(255, 215, 0, 0.2)');
    cGlow.addColorStop(0.7, 'rgba(200, 150, 30, 0.05)');
    cGlow.addColorStop(1, 'rgba(200, 150, 30, 0)');
    sCtx.fillStyle = cGlow;
    sCtx.fillRect(0, 0, 460, 460);

    starCanvas.refresh();

    // Display star — entrance: scale from 0 with sound
    const starImg = this.add.image(cx, starCy, starTexKey).setDepth(7).setScale(0).setAlpha(0);
    this._addPageVisual(starImg);
    sm.playStarReveal();
    this.tweens.add({
      targets: starImg, scaleX: 0.82, scaleY: 0.82, alpha: 1,
      duration: 1200, ease: 'Back.easeOut',
    });
    // Gentle pulse
    this.tweens.add({
      targets: starImg, scaleX: { from: 0.80, to: 0.84 }, scaleY: { from: 0.80, to: 0.84 },
      duration: 3000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: 1500,
    });

    // ══════════════════════════════════════════════════════════════
    // LAYER 8 — "SUPERZION" CHROME METAL 3D TEXT
    // ══════════════════════════════════════════════════════════════
    const titleStr = 'SUPERZION';
    const titleFont = '72px "Impact", "Arial Black", sans-serif';
    const titleY = cy - 10;

    const titleTexKey = '__title_reveal_tex';
    if (this.textures.exists(titleTexKey)) this.textures.remove(titleTexKey);
    const titleCanvas = this.textures.createCanvas(titleTexKey, W, 140);
    const tCtx = titleCanvas.context;
    tCtx.textAlign = 'center';
    tCtx.textBaseline = 'middle';
    tCtx.font = titleFont;

    const drawX = W / 2;
    const drawY = 70;

    const letters = titleStr.split('');
    const totalWidth = tCtx.measureText(titleStr).width;
    const letterWidths = letters.map(l => tCtx.measureText(l).width);
    let letterX = drawX - totalWidth / 2;

    for (let li = 0; li < letters.length; li++) {
      const lx = letterX + letterWidths[li] / 2;

      // DEPTH LAYERS: 6px deep 3D extrusion (gold/bronze bevel)
      const depthColors = ['#2a1a08', '#3a2510', '#5a3a15', '#7a5518', '#8B6914', '#a07818'];
      for (let d = 5; d >= 0; d--) {
        tCtx.fillStyle = depthColors[d];
        tCtx.fillText(letters[li], lx + d, drawY + d);
      }

      // Black outline on the face
      tCtx.strokeStyle = '#000000';
      tCtx.lineWidth = 3;
      tCtx.lineJoin = 'round';
      tCtx.strokeText(letters[li], lx, drawY);

      // Chrome face — vertical gradient (silver metal with horizontal banding)
      const chromeGrad = tCtx.createLinearGradient(lx, drawY - 30, lx, drawY + 30);
      chromeGrad.addColorStop(0, '#e0e0e8');    // bright chrome top
      chromeGrad.addColorStop(0.15, '#c0c0c8');  // slightly darker
      chromeGrad.addColorStop(0.3, '#a0a0a8');   // mid gray
      chromeGrad.addColorStop(0.45, '#d0d0d8');  // bright band (metal reflection)
      chromeGrad.addColorStop(0.55, '#909098');   // dark band
      chromeGrad.addColorStop(0.7, '#c8c8d0');   // another bright band
      chromeGrad.addColorStop(0.85, '#a8a8b0');   // tapering
      chromeGrad.addColorStop(1, '#808088');      // darker bottom
      tCtx.fillStyle = chromeGrad;
      tCtx.fillText(letters[li], lx, drawY);

      // Top highlight line (bright chrome edge)
      tCtx.save();
      tCtx.globalAlpha = 0.5;
      tCtx.fillStyle = '#ffffff';
      tCtx.fillText(letters[li], lx, drawY - 1);
      tCtx.restore();

      // Gold bevel outline (inner edge tint)
      tCtx.strokeStyle = '#c49520';
      tCtx.lineWidth = 1.2;
      tCtx.strokeText(letters[li], lx, drawY);

      letterX += letterWidths[li];
    }
    titleCanvas.refresh();

    // ── Letter-by-letter slam entrance with metallic SFX ──
    // Create individual letter images from the canvas
    const letterImgs = [];
    let lxPos = 0;
    for (let li = 0; li < letters.length; li++) {
      const lw = letterWidths[li];
      // Crop each letter region from the full canvas
      const frameKey = `__title_letter_${li}`;
      // We'll use the full texture but position each as one image per letter
      // Instead: show full title image but with staggered entrance
      lxPos += lw;
    }

    // Full title image — letters slam in as one piece
    const titleImg = this.add.image(cx, titleY, titleTexKey).setDepth(20).setAlpha(0);
    this._addPageVisual(titleImg);

    // Swoosh sound before slam
    this.time.delayedCall(600, () => {
      if (this.skipped) return;
      sm.playTitleRevealSwoosh();
    });

    // SLAM entrance: drop from above with camera shake
    titleImg.setPosition(cx, titleY - 80).setScale(1.8);
    this.time.delayedCall(900, () => {
      if (this.skipped) return;
      sm.playMetalSlam(1.0);
      this.cameras.main.shake(200, 0.02);
    });
    this.tweens.add({
      targets: titleImg, y: titleY, scaleX: 1, scaleY: 1, alpha: 1,
      duration: 350, ease: 'Bounce.easeOut', delay: 800,
    });

    // Second smaller impact (echo)
    this.time.delayedCall(1250, () => {
      if (this.skipped) return;
      sm.playMetalSlam(1.3);
      this.cameras.main.shake(80, 0.008);
    });

    // ══════════════════════════════════════════════════════════════
    // LAYER 9 — LENS FLARES on metal edges
    // ══════════════════════════════════════════════════════════════
    const spawnLensFlare = () => {
      if (this.skipped) return;
      // Random position near title or star edges
      const onTitle = Math.random() > 0.4;
      let fx, fy;
      if (onTitle) {
        fx = cx + (Math.random() - 0.5) * (totalWidth * 0.9);
        fy = titleY + (Math.random() - 0.5) * 30;
      } else {
        // On star points
        const angle = Math.random() * Math.PI * 2;
        const dist = 120 + Math.random() * 50;
        fx = cx + Math.cos(angle) * dist;
        fy = starCy + Math.sin(angle) * dist;
      }

      const flareGfx = this.add.graphics().setDepth(35).setPosition(fx, fy).setAlpha(0);
      this._addPageVisual(flareGfx);

      // Cross flare (4-ray star)
      const flareSize = 6 + Math.random() * 10;
      flareGfx.lineStyle(1.5, 0xffffff, 0.9);
      flareGfx.lineBetween(-flareSize, 0, flareSize, 0);
      flareGfx.lineBetween(0, -flareSize, 0, flareSize);
      // Diagonal rays (dimmer)
      flareGfx.lineStyle(1, 0xffffff, 0.4);
      const ds = flareSize * 0.6;
      flareGfx.lineBetween(-ds, -ds, ds, ds);
      flareGfx.lineBetween(-ds, ds, ds, -ds);
      // Central dot glow
      flareGfx.fillStyle(0xffffff, 0.7);
      flareGfx.fillCircle(0, 0, 2);
      flareGfx.fillStyle(0xFFD700, 0.3);
      flareGfx.fillCircle(0, 0, 4);

      this.tweens.add({
        targets: flareGfx, alpha: { from: 0, to: 0.8 },
        duration: 200 + Math.random() * 200, yoyo: true, ease: 'Sine.easeInOut',
        onComplete: () => {
          if (flareGfx && flareGfx.destroy) flareGfx.destroy();
          this.time.delayedCall(300 + Math.random() * 800, spawnLensFlare);
        },
      });
    };
    // Start flare chains after title appears
    for (let i = 0; i < 8; i++) {
      this.time.delayedCall(1200 + i * 200, spawnLensFlare);
    }

    // ══════════════════════════════════════════════════════════════
    // LAYER 10 — SUBTITLE + PRESS SPACE
    // ══════════════════════════════════════════════════════════════
    this.time.delayedCall(2000, () => {
      if (this.skipped) return;
      const sub = this.add.text(cx, titleY + 55, 'THEY FIGHT TO CONQUER. WE FIGHT TO EXIST.', {
        fontFamily: '"Impact", "Arial Black", sans-serif', fontSize: '18px', color: '#ffffff',
        shadow: { offsetX: 0, offsetY: 0, color: '#ffffff', blur: 8, fill: true },
      }).setOrigin(0.5).setDepth(25).setAlpha(0);
      this._addPageVisual(sub);
      this.tweens.add({ targets: sub, alpha: 1, duration: 800 });
    });

    const pressSpace = this.add.text(cx, H - 40, 'PRESS SPACE TO CONTINUE', {
      fontFamily: 'monospace', fontSize: '14px', color: '#FFD700',
    }).setOrigin(0.5).setDepth(25).setAlpha(0);
    this._addPageVisual(pressSpace);
    this.time.delayedCall(2800, () => {
      if (this.skipped) return;
      this.tweens.add({
        targets: pressSpace, alpha: { from: 0, to: 1 },
        duration: 1000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
      });
    });

    // ══════════════════════════════════════════════════════════════
    // LAYER 11 — SCANLINES + VIGNETTE (top layer)
    // ══════════════════════════════════════════════════════════════
    const scanGfx = this.add.graphics().setDepth(40);
    this._addPageVisual(scanGfx);
    for (let sy = 0; sy < H; sy += 2) {
      scanGfx.fillStyle(0x000000, 0.08);
      scanGfx.fillRect(0, sy, W, 1);
    }
    // Vignette
    const vigGfx = this.add.graphics().setDepth(41);
    this._addPageVisual(vigGfx);
    for (const c of [{ x: 0, y: 0 }, { x: W, y: 0 }, { x: 0, y: H }, { x: W, y: H }]) {
      for (let lr = 300; lr > 40; lr -= 15) {
        vigGfx.fillStyle(0x000000, 0.25 * (lr / 300) * 0.15);
        vigGfx.fillCircle(c.x, c.y, lr);
      }
    }

    // Make this page ready immediately
    this.typewriterComplete = true;
    this.pageReady = true;
  }

  // ═════════════════════════════════════════════════════════════
  // VISUAL EFFECT HELPERS (kept from original)
  // ═════════════════════════════════════════════════════════════

  _spawnMissile() {
    const fromLeft = Math.random() > 0.5;
    const startX = fromLeft ? -20 : W + 20;
    const endX = fromLeft ? W + 20 : -20;
    const y = 60 + Math.random() * (H - 180);

    const missile = this.add.graphics().setDepth(12);
    missile.fillStyle(0x888888, 1);
    missile.fillRect(0, -2, 18, 4);
    missile.fillStyle(0xcc2200, 1);
    missile.beginPath(); missile.moveTo(18, -3); missile.lineTo(24, 0); missile.lineTo(18, 3); missile.closePath(); missile.fill();
    missile.fillStyle(0x666666, 1);
    missile.fillTriangle(-2, -5, 4, -2, -2, -2);
    missile.fillTriangle(-2, 5, 4, 2, -2, 2);
    missile.fillStyle(0xff6600, 0.6);
    missile.fillCircle(-6, 0, 4);
    missile.setPosition(startX, y);
    missile.setAngle(fromLeft ? 0 : 180);

    this.tweens.add({
      targets: missile, x: endX,
      duration: 800 + Math.random() * 600, ease: 'Linear',
      onComplete: () => { if (missile && missile.destroy) missile.destroy(); },
    });
  }

  _spawnExplosion(x, y) {
    const expGfx = this.add.graphics().setDepth(18).setAlpha(0.8);
    expGfx.fillStyle(0xff4400, 0.6);
    expGfx.fillCircle(x, y, 20 + Math.random() * 15);
    expGfx.fillStyle(0xffcc00, 0.8);
    expGfx.fillCircle(x, y, 8 + Math.random() * 6);
    expGfx.fillStyle(0xffffff, 0.5);
    expGfx.fillCircle(x, y, 3);

    this.cameras.main.shake(120, 0.005 + Math.random() * 0.005);
    // Removed playExplosion() — no aggressive sounds in cinematics

    this.tweens.add({
      targets: expGfx, alpha: 0, scale: 1.8,
      duration: 400 + Math.random() * 200, ease: 'Cubic.easeOut',
      onComplete: () => { if (expGfx && expGfx.destroy) expGfx.destroy(); },
    });

    // Scatter circular particles
    const colors = [0xff6600, 0xff8800, 0xffaa00, 0xff2200, 0xffdd00, 0xffffff];
    for (let i = 0; i < 15; i++) {
      const radius = 1 + Math.random() * 4;
      const color = colors[Math.floor(Math.random() * colors.length)];
      const p = this.add.circle(x, y, radius, color, 0.9).setDepth(22);
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 100;
      this.tweens.add({
        targets: p,
        x: x + Math.cos(angle) * speed,
        y: y + Math.sin(angle) * speed,
        scale: 0,
        alpha: 0,
        rotation: Math.random() * 6,
        duration: 400 + Math.random() * 400,
        ease: 'Quad.easeOut',
        onComplete: () => p.destroy(),
      });
    }
  }

  _spawnJetStrike(startY, endY, firesProjectile) {
    const jet = this.add.graphics().setDepth(15);
    jet.fillStyle(0x556688, 1);
    jet.fillRect(0, -3, 40, 6);
    jet.fillTriangle(10, -3, 25, -16, 30, -3);
    jet.fillTriangle(10, 3, 25, 16, 30, 3);
    jet.fillStyle(0x88aaff, 0.8);
    jet.fillCircle(35, 0, 3);

    const trail = this.add.graphics().setDepth(14);
    trail.fillStyle(0xffaa00, 0.3);
    trail.fillRect(-40, -1, 40, 2);

    jet.setPosition(-60, startY);
    trail.setPosition(-60, startY);

    this.tweens.add({
      targets: [jet, trail], x: W + 80,
      duration: 1200, ease: 'Cubic.easeIn',
      onComplete: () => {
        if (jet && jet.destroy) jet.destroy();
        if (trail && trail.destroy) trail.destroy();
      },
    });
  }

  _spawnTankStatic(x, y) {
    const tank = this.add.graphics().setDepth(10);
    this._addPageVisual(tank);
    tank.fillStyle(0x556633, 1);
    tank.fillRect(x - 25, y, 50, 16);
    tank.fillStyle(0x667744, 1);
    tank.fillRect(x - 10, y - 8, 22, 12);
    tank.fillStyle(0x444433, 1);
    tank.fillRect(x + 12, y - 5, 28, 4);
    tank.fillStyle(0x333322, 1);
    tank.fillRect(x - 28, y + 14, 56, 5);
  }

  // ═════════════════════════════════════════════════════════════
  // Override _endCinematic to stop intro music
  // ═════════════════════════════════════════════════════════════

  _endCinematic() {
    if (this.skipped) return;
    this.skipped = true;
    // Do NOT stop music — menu music continues seamlessly into MenuScene
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.time.delayedCall(350, () => this.scene.start('MenuScene'));
  }

  update() {
    this._handlePageInput();
  }
}
