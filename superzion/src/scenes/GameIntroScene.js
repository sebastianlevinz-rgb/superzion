// ═══════════════════════════════════════════════════════════════
// GameIntroScene — Narrative-driven intro cinematic
// Page-by-page text with SPACE/ENTER advancement, visual scenes
// ═══════════════════════════════════════════════════════════════

import Phaser from 'phaser';
import BaseCinematicScene, { W, H } from './BaseCinematicScene.js';
import SoundManager from '../systems/SoundManager.js';
import MusicManager from '../systems/MusicManager.js';
import { generateAllParadeTextures } from '../utils/ParadeTextures.js';
import { createB2SideSprite, createB2Silhouette } from '../utils/B2Textures.js';

export default class GameIntroScene extends BaseCinematicScene {
  constructor() { super('GameIntroScene'); }

  create() {
    this._initCinematic();
    generateAllParadeTextures(this);
    createB2SideSprite(this);
    createB2Silhouette(this);

    // Pre-generate heavy canvas textures NOW (not during page transition)
    this._pregenTitleTextures();

    // Start menu music (Am trance) from first frame — plays continuously into MenuScene
    MusicManager.get().playMenuMusic();

    // ── Define narrative pages (5 lines + boss parade + arsenal + hero + title) ──
    this._initPages([
      {
        text: 'For 3,000 years, they tried to erase us. The oldest living civilization on Earth.',
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
        color: '#FF4444', size: 22, y: H * 0.20,
        setup: () => this._setupBossSilhouettes(),
      },
      {
        text: 'They forgot our secret weapon: we have nowhere else to go.',
        color: '#ffffff', size: 26, y: H * 0.82,
        setup: () => this._setupEnemyParade(),
      },
      {
        text: 'One Nation. One mission. 3,000 years of resilience.',
        color: '#FFD700', size: 24, y: H * 0.85,
        setup: () => this._setupHeroReveal(),
      },
      {
        text: ' ',
        color: '#000000', size: 1, y: -100,
        charDelay: 1,
        setup: () => this._setupTitleReveal(),
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
    // AI fallen-empires panorama (Babylon ziggurat, Roman columns, ruins under a
    // blood-red sky) — replaces the procedural gradient + ruin + empire silhouettes.
    const bg = this.add.image(W / 2, H / 2, 'intro_empires').setDepth(0);
    bg.setDisplaySize(W, H);
    this._addPageVisual(bg);

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
    // (Babylon/Rome/empire silhouettes are now part of the intro_empires AI art.)
  }

  /** Page 1 — More intense destruction: wider flames, red glow from below */
  _setupDestructionIntenseBg() {
    // AI burning-warzone panorama (collapsed buildings, fire, smoke, blood-red sky)
    // replaces the procedural gradient + glow + ruin silhouettes.
    const bg = this.add.image(W / 2, H / 2, 'intro_warzone').setDepth(0);
    bg.setDisplaySize(W, H);
    this._addPageVisual(bg);

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
    SoundManager.get().playBossEntrance();

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

      // Boss sprite — full colour so the detailed AI art is visible (no dark tint)
      if (this.textures.exists(key)) {
        const boss = this.add.sprite(bx, by, key).setDepth(5).setScale(0.5).setAlpha(0);
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
    SoundManager.get().playMissileWarning();

    // AI burning-warzone panorama replaces the procedural red sky + ground.
    const bg = this.add.image(W / 2, H / 2, 'intro_warzone').setDepth(0);
    bg.setDisplaySize(W, H);
    this._addPageVisual(bg);

    // Enemy faction flags — AI pixel-art flags on poles (was procedural spritesheets)
    const orgData = [
      { key: 'flag_iran_ai', x: 120 },
      { key: 'flag_hamas_ai', x: W / 2 - 120 },
      { key: 'flag_hezbollah_ai', x: W / 2 + 120 },
      { key: 'flag_palestine_ai', x: W - 120 },
    ];
    orgData.forEach((fd, i) => {
      if (this.textures.exists(fd.key)) {
        const flag = this.add.image(fd.x, H / 2 + 20, fd.key).setDepth(4).setScale(0.85).setAlpha(0);
        this._addPageVisual(flag);
        this.tweens.add({ targets: flag, alpha: 1, duration: 500, delay: i * 200 });
        // subtle cloth flutter
        this.tweens.add({
          targets: flag, scaleX: 0.9, duration: 900 + i * 120,
          yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: i * 200,
        });
      }
    });

    // Missiles flying across (visual only, no sounds)
    for (let i = 0; i < 5; i++) {
      this.time.delayedCall(i * 400, () => {
        if (this.skipped) return;
        this._spawnMissile();
      });
    }

    // F-15 formation flyover — AI jet sprites (was a procedural graphics silhouette)
    const jetKey = this.textures.exists('f15_side') ? 'f15_side' : null;
    const jetDefs = [
      { yOff: 0,  delay: 0,   duration: 2500 },  // Jet 1: fastest, leads
      { yOff: 25, delay: 400, duration: 3000 },  // Jet 2: medium
      { yOff: 50, delay: 800, duration: 3500 },  // Jet 3: slowest, trails
    ];
    for (const jd of jetDefs) {
      const jetY = H * 0.15 + jd.yOff;
      if (jetKey) {
        const jet = this.add.image(-60, jetY, jetKey).setDepth(8).setScale(0.7);
        this._addPageVisual(jet);
        this.tweens.add({
          targets: jet, x: W + 120, duration: jd.duration, delay: jd.delay, ease: 'Linear',
        });
      }
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

    // (flyover removed — was causing performance freeze)
  }

  /** SuperZion hero reveal — B-2 top-down over sunlit Mediterranean */
  _setupHeroReveal() {
    SoundManager.get().playAfterburner();
    this.time.delayedCall(1000, () => {
      if (!this.skipped) SoundManager.get().playFinalVictory();
    });

    // Ocean background (like B-2 escape scene)
    const seaBg = this.add.graphics().setDepth(0);
    this._addPageVisual(seaBg);
    // Dark night sky
    seaBg.fillStyle(0x060a14, 1);
    seaBg.fillRect(0, 0, W, H * 0.4);
    // Ocean
    seaBg.fillStyle(0x0a1628, 1);
    seaBg.fillRect(0, H * 0.4, W, H * 0.6);
    // Horizon line
    seaBg.lineStyle(1, 0x1a2a48, 0.4);
    seaBg.lineBetween(0, H * 0.4, W, H * 0.4);
    // Stars
    for (let i = 0; i < 15; i++) {
      seaBg.fillStyle(0xffffff, 0.3 + Math.random() * 0.3);
      seaBg.fillCircle(Math.random() * W, Math.random() * H * 0.35, 0.8);
    }
    // Wave lines
    seaBg.lineStyle(1, 0x2a4a6a, 0.15);
    for (let y = H * 0.45; y < H; y += 20) {
      for (let x = 0; x < W; x += 8) {
        const wy = y + Math.sin(x * 0.03 + y * 0.1) * 3;
        seaBg.lineBetween(x, wy, x + 8, wy);
      }
    }

    // Epic B-2 flyover — AI stealth-bomber sprite (was a hand-drawn procedural wing)
    const b2Key = this.textures.exists('b2_silhouette') ? 'b2_silhouette' : 'b2_top';
    const b2Gfx = this.add.image(-160, H * 0.38, b2Key).setDepth(10).setScale(0.9);
    b2Gfx.setAngle(90); // nose points along the left→right flight path
    this._addPageVisual(b2Gfx);

    // Fly across screen (left to right)
    this.tweens.add({ targets: b2Gfx, x: W + 200, duration: 4500, ease: 'Linear' });
    // Subtle altitude oscillation
    this.tweens.add({ targets: b2Gfx, y: H * 0.34, duration: 2200, yoyo: true, ease: 'Sine.easeInOut' });

    // SuperZion walks in from the right
    if (this.textures.exists('parade_superzion')) {
      const heroY = H - 160;
      const hero = this.add.sprite(W + 80, heroY, 'parade_superzion').setDepth(20).setScale(2.0);
      this._addPageVisual(hero);
      this.tweens.add({ targets: hero, y: heroY - 4, duration: 300, yoyo: true, repeat: 5, ease: 'Sine.easeInOut' });
      this.tweens.add({ targets: hero, x: W / 2, duration: 2500, ease: 'Sine.easeOut' });
    }
  }

  /** Pre-generate heavy canvas textures during create() — not during page transition */
  _pregenTitleTextures() {
    const cx = W / 2;

    // ── Background texture ──
    const bgKey = '__title_bg';
    if (this.textures.exists(bgKey)) this.textures.remove(bgKey);
    const bgC = document.createElement('canvas');
    bgC.width = W; bgC.height = H;
    const bgCtx = bgC.getContext('2d');
    const skyGrad = bgCtx.createLinearGradient(0, 0, 0, H);
    skyGrad.addColorStop(0, '#080408'); skyGrad.addColorStop(0.4, '#1a0a08');
    skyGrad.addColorStop(0.62, '#0a0604'); skyGrad.addColorStop(1, '#060404');
    bgCtx.fillStyle = skyGrad; bgCtx.fillRect(0, 0, W, H);
    // Fire glow
    const fireGlow = bgCtx.createRadialGradient(cx + 40, H * 0.2, 10, cx + 40, H * 0.2, 200);
    fireGlow.addColorStop(0, 'rgba(255,238,221,0.08)'); fireGlow.addColorStop(0.3, 'rgba(255,170,0,0.04)');
    fireGlow.addColorStop(0.7, 'rgba(255,102,0,0.02)'); fireGlow.addColorStop(1, 'rgba(255,102,0,0)');
    bgCtx.fillStyle = fireGlow; bgCtx.fillRect(0, 0, W, H * 0.5);
    // Skyline
    const horizY = H * 0.62;
    bgCtx.fillStyle = '#0a0808';
    const buildings = [
      [0,45,80],[50,30,120,1],[85,50,60],[140,25,140,1],[170,40,90],[215,55,70],
      [275,35,110,1],[315,45,65],[365,30,130,1],[400,50,85],[455,40,100],[500,55,75],
      [560,30,145,1],[595,45,95],[645,35,60],[685,50,115,1],[740,40,80],[785,55,70],
      [845,30,125,1],[880,45,90],[930,35,75],
    ];
    for (const b of buildings) {
      const [bx, bw, bh, broken] = b;
      const by = horizY - bh;
      if (broken) {
        bgCtx.beginPath(); bgCtx.moveTo(bx, horizY); bgCtx.lineTo(bx, by + 15);
        bgCtx.lineTo(bx + bw * 0.3, by); bgCtx.lineTo(bx + bw * 0.5, by + 20);
        bgCtx.lineTo(bx + bw * 0.7, by + 5); bgCtx.lineTo(bx + bw, by + 25);
        bgCtx.lineTo(bx + bw, horizY); bgCtx.closePath(); bgCtx.fill();
      } else { bgCtx.fillRect(bx, by, bw, bh); }
    }
    bgCtx.fillStyle = '#060404'; bgCtx.fillRect(0, horizY, W, H - horizY);
    // Smoke
    for (let i = 0; i < 6; i++) {
      const sx = 80 + Math.random() * (W - 160);
      const sy = horizY - 25 - Math.random() * 35;
      for (let j = 0; j < 4; j++) {
        bgCtx.fillStyle = `rgba(34,34,24,${0.04 + Math.random() * 0.03})`;
        bgCtx.beginPath(); bgCtx.arc(sx + (Math.random() - 0.5) * 20, sy - j * 25, 15 + Math.random() * 20, 0, Math.PI * 2); bgCtx.fill();
      }
    }
    // Soldier
    const solX = 100, solBaseY = H - 30;
    bgCtx.fillStyle = '#050303';
    bgCtx.fillRect(solX - 4, solBaseY - 50, 8, 30);
    bgCtx.fillRect(solX - 5, solBaseY - 20, 4, 22);
    bgCtx.fillRect(solX + 1, solBaseY - 20, 4, 22);
    bgCtx.beginPath(); bgCtx.arc(solX, solBaseY - 55, 6, 0, Math.PI * 2); bgCtx.fill();
    bgCtx.fillRect(solX - 7, solBaseY - 58, 14, 3);
    // Scanlines
    for (let sy = 0; sy < H; sy += 2) { bgCtx.fillStyle = 'rgba(0,0,0,0.08)'; bgCtx.fillRect(0, sy, W, 1); }
    this.textures.addCanvas(bgKey, bgC);

    // ── Star of David texture ──
    const starKey = '__star_metal_tex';
    if (this.textures.exists(starKey)) this.textures.remove(starKey);
    const starC = document.createElement('canvas');
    starC.width = 460; starC.height = 460;
    const sCtx = starC.getContext('2d');
    const sCx = 230, sCy = 230;
    const drawTri = (rot, grad) => {
      sCtx.beginPath();
      for (let i = 0; i < 3; i++) {
        const a = rot + (i * 2 * Math.PI) / 3;
        const tx = sCx + Math.cos(a) * 200, ty = sCy + Math.sin(a) * 200;
        i === 0 ? sCtx.moveTo(tx, ty) : sCtx.lineTo(tx, ty);
      }
      sCtx.closePath(); sCtx.fillStyle = grad; sCtx.fill();
    };
    const g1 = sCtx.createLinearGradient(sCx, sCy - 200, sCx, sCy + 100);
    g1.addColorStop(0, '#e8c44a'); g1.addColorStop(0.3, '#c49520'); g1.addColorStop(0.5, '#8B6914');
    g1.addColorStop(0.7, '#c49520'); g1.addColorStop(1, '#a07818');
    drawTri(-Math.PI / 2, g1);
    const g2 = sCtx.createLinearGradient(sCx - 100, sCy + 100, sCx + 100, sCy - 100);
    g2.addColorStop(0, '#a07818'); g2.addColorStop(0.3, '#c49520'); g2.addColorStop(0.5, '#e8c44a');
    g2.addColorStop(0.7, '#8B6914'); g2.addColorStop(1, '#c49520');
    drawTri(Math.PI / 2, g2);
    for (const [style, lw, r] of [['#FFD700', 2.5, 200], ['rgba(255,240,180,0.4)', 1.5, 180]]) {
      sCtx.strokeStyle = style; sCtx.lineWidth = lw;
      for (const rot of [-Math.PI / 2, Math.PI / 2]) {
        sCtx.beginPath();
        for (let i = 0; i < 3; i++) {
          const a = rot + (i * 2 * Math.PI) / 3;
          i === 0 ? sCtx.moveTo(sCx + Math.cos(a) * r, sCy + Math.sin(a) * r)
                   : sCtx.lineTo(sCx + Math.cos(a) * r, sCy + Math.sin(a) * r);
        }
        sCtx.closePath(); sCtx.stroke();
      }
    }
    const cGlow = sCtx.createRadialGradient(sCx, sCy, 5, sCx, sCy, 80);
    cGlow.addColorStop(0, 'rgba(255,250,220,0.5)'); cGlow.addColorStop(0.3, 'rgba(255,215,0,0.2)');
    cGlow.addColorStop(0.7, 'rgba(200,150,30,0.05)'); cGlow.addColorStop(1, 'rgba(200,150,30,0)');
    sCtx.fillStyle = cGlow; sCtx.fillRect(0, 0, 460, 460);
    this.textures.addCanvas(starKey, starC);

    // ── SUPERZION chrome title texture ──
    const titleKey = '__title_reveal_tex';
    if (this.textures.exists(titleKey)) this.textures.remove(titleKey);
    const titleC = document.createElement('canvas');
    titleC.width = W; titleC.height = 140;
    const tCtx = titleC.getContext('2d');
    tCtx.textAlign = 'center'; tCtx.textBaseline = 'middle';
    tCtx.font = '72px "Impact", "Arial Black", sans-serif';
    const titleStr = 'SUPERZION';
    const drawX = W / 2, drawY = 70;
    const letters = titleStr.split('');
    const letterWidths = letters.map(l => tCtx.measureText(l).width);
    const totalW = tCtx.measureText(titleStr).width;
    let lx = drawX - totalW / 2;
    for (let li = 0; li < letters.length; li++) {
      const x = lx + letterWidths[li] / 2;
      const depthColors = ['#2a1a08', '#3a2510', '#5a3a15', '#7a5518', '#8B6914', '#a07818'];
      for (let d = 5; d >= 0; d--) { tCtx.fillStyle = depthColors[d]; tCtx.fillText(letters[li], x + d, drawY + d); }
      tCtx.strokeStyle = '#000000'; tCtx.lineWidth = 3; tCtx.lineJoin = 'round'; tCtx.strokeText(letters[li], x, drawY);
      const cg = tCtx.createLinearGradient(x, drawY - 30, x, drawY + 30);
      cg.addColorStop(0, '#e0e0e8'); cg.addColorStop(0.15, '#c0c0c8'); cg.addColorStop(0.3, '#a0a0a8');
      cg.addColorStop(0.45, '#d0d0d8'); cg.addColorStop(0.55, '#909098'); cg.addColorStop(0.7, '#c8c8d0');
      cg.addColorStop(0.85, '#a8a8b0'); cg.addColorStop(1, '#808088');
      tCtx.fillStyle = cg; tCtx.fillText(letters[li], x, drawY);
      tCtx.save(); tCtx.globalAlpha = 0.5; tCtx.fillStyle = '#ffffff'; tCtx.fillText(letters[li], x, drawY - 1); tCtx.restore();
      tCtx.strokeStyle = '#c49520'; tCtx.lineWidth = 1.2; tCtx.strokeText(letters[li], x, drawY);
      lx += letterWidths[li];
    }
    this.textures.addCanvas(titleKey, titleC);
  }

  /** SUPERZION title reveal — zero delayedCall, zero undefined sounds */
  _setupTitleReveal() {
    const cx = W / 2, cy = H / 2;
    const titleY = cy - 10;
    const starCy = cy - 10;

    // ── Layer 0: Sky gradient — Tel Aviv beach sunset ──
    const skyBg = this.add.graphics().setDepth(0);
    this._addPageVisual(skyBg);
    // Multi-stop sky gradient: deep purple-blue → pink → orange-red → golden
    const skyStops = [
      { pos: 0.00, r: 26,  g: 10, b: 46  },  // #1a0a2e deep purple
      { pos: 0.10, r: 32,  g: 14, b: 52  },  // darker purple
      { pos: 0.20, r: 42,  g: 16, b: 64  },  // #2a1040
      { pos: 0.30, r: 106, g: 32, b: 80  },  // #6a2050 warm purple-pink
      { pos: 0.40, r: 204, g: 64, b: 96  },  // #cc4060 hot pink
      { pos: 0.47, r: 221, g: 96, b: 48  },  // #dd6030 orange-red
      { pos: 0.52, r: 238, g: 136, b: 32 },  // #ee8820 hot orange
      { pos: 0.57, r: 238, g: 168, b: 48 },  // #eea830 golden
      { pos: 0.65, r: 255, g: 204, b: 64 },  // #ffcc40 bright gold
      { pos: 1.00, r: 255, g: 204, b: 64 },  // stays golden at horizon
    ];
    for (let y = 0; y < H * 0.58; y++) {
      const t = y / H;
      // Find surrounding stops
      let lo = skyStops[0], hi = skyStops[skyStops.length - 1];
      for (let s = 0; s < skyStops.length - 1; s++) {
        if (t >= skyStops[s].pos && t <= skyStops[s + 1].pos) {
          lo = skyStops[s]; hi = skyStops[s + 1]; break;
        }
      }
      const range = hi.pos - lo.pos || 1;
      const f = (t - lo.pos) / range;
      const r = Math.round(lo.r + (hi.r - lo.r) * f);
      const g = Math.round(lo.g + (hi.g - lo.g) * f);
      const b = Math.round(lo.b + (hi.b - lo.b) * f);
      skyBg.fillStyle(Phaser.Display.Color.GetColor(r, g, b), 1);
      skyBg.fillRect(0, y, W, 1);
    }

    // ── Layer 1: Animated clouds — warm orange/pink tones with drift ──
    const cloudDefs = [
      { x: 150, y: H * 0.12, rx: 50, ry: 14, color: 0xff8866, alpha: 0.35, drift: 20, dur: 10000 },
      { x: 400, y: H * 0.18, rx: 65, ry: 18, color: 0xff9977, alpha: 0.3, drift: -15, dur: 12000 },
      { x: 650, y: H * 0.10, rx: 55, ry: 15, color: 0xffaa88, alpha: 0.25, drift: 25, dur: 9000 },
      { x: 280, y: H * 0.25, rx: 40, ry: 12, color: 0xff7755, alpha: 0.3, drift: -20, dur: 11000 },
      { x: 820, y: H * 0.15, rx: 45, ry: 13, color: 0xffbb99, alpha: 0.2, drift: 18, dur: 13000 },
      { x: 520, y: H * 0.22, rx: 35, ry: 10, color: 0xff9966, alpha: 0.28, drift: -12, dur: 10000 },
    ];
    for (const c of cloudDefs) {
      const cloud = this.add.ellipse(c.x, c.y, c.rx * 2, c.ry * 2, c.color, c.alpha).setDepth(1);
      this._addPageVisual(cloud);
      // Secondary puff
      const puff = this.add.ellipse(c.x + c.rx * 0.4, c.y - 3, c.rx * 1.4, c.ry * 1.5, c.color, c.alpha * 0.7).setDepth(1);
      this._addPageVisual(puff);
      // Drift animation
      this.tweens.add({ targets: [cloud, puff], x: `+=${c.drift}`, duration: c.dur, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }

    // ── Layer 2: Sun — golden disc sitting on the horizon ──
    const sunGfx = this.add.graphics().setDepth(2);
    this._addPageVisual(sunGfx);
    const sunX = W * 0.45, sunY = H * 0.52;
    // Outer glow
    sunGfx.fillStyle(0xffcc44, 0.15);
    sunGfx.fillCircle(sunX, sunY, 130);
    sunGfx.fillStyle(0xffcc44, 0.25);
    sunGfx.fillCircle(sunX, sunY, 100);
    // Sun disc
    sunGfx.fillStyle(0xffffcc, 0.9);
    sunGfx.fillCircle(sunX, sunY, 70);
    sunGfx.fillStyle(0xffffff, 0.4);
    sunGfx.fillCircle(sunX - 8, sunY - 10, 40);
    // Sun rays
    for (let i = 0; i < 10; i++) {
      const angle = (i / 10) * Math.PI * 2;
      const rx = Math.cos(angle), ry = Math.sin(angle);
      sunGfx.lineStyle(1, 0xffdd88, 0.08);
      sunGfx.beginPath();
      sunGfx.moveTo(sunX + rx * 75, sunY + ry * 75);
      sunGfx.lineTo(sunX + rx * 220, sunY + ry * 220);
      sunGfx.strokePath();
    }

    // ── Layer 3: Sea / water ──
    const seaGfx = this.add.graphics().setDepth(3);
    this._addPageVisual(seaGfx);
    const horizonY = H * 0.58;
    const sandY = H * 0.82;
    // Water body gradient — dark teal
    for (let y = Math.round(horizonY); y < Math.round(sandY); y++) {
      const wt = (y - horizonY) / (sandY - horizonY);
      const wr = Math.round(10 - wt * 6);
      const wg = Math.round(42 - wt * 18);
      const wb = Math.round(74 - wt * 20);
      seaGfx.fillStyle(Phaser.Display.Color.GetColor(wr, wg, wb), 1);
      seaGfx.fillRect(0, y, W, 1);
    }
    // Sun reflection on water — golden vertical strip
    const refX = sunX;
    for (let y = Math.round(horizonY); y < Math.round(sandY); y++) {
      const wt = (y - horizonY) / (sandY - horizonY);
      const refAlpha = 0.35 * (1 - wt * 0.9);
      const refWidth = 20 + wt * 30; // widens toward viewer
      seaGfx.fillStyle(0xffcc44, refAlpha);
      seaGfx.fillRect(refX - refWidth / 2, y, refWidth, 1);
      // Shimmer — slightly brighter center
      seaGfx.fillStyle(0xffeedd, refAlpha * 0.4);
      seaGfx.fillRect(refX - 5, y, 10, 1);
    }
    // Water wave lines
    for (let wy = Math.round(horizonY) + 4; wy < Math.round(sandY); wy += 8) {
      seaGfx.lineStyle(1, 0x1a4a6a, 0.25);
      seaGfx.beginPath();
      for (let x = 0; x < W; x += 2) {
        const yOff = Math.sin(x * 0.03 + wy * 0.1) * 2;
        if (x === 0) seaGfx.moveTo(x, wy + yOff);
        else seaGfx.lineTo(x, wy + yOff);
      }
      seaGfx.strokePath();
    }
    // Animated wave shimmer
    for (let i = 0; i < 4; i++) {
      const waveY = H * 0.62 + i * 18;
      const wave = this.add.rectangle(W / 2 + (i % 2 ? 20 : -20), waveY, W * 0.5, 1, 0xffffff, 0.06).setDepth(3);
      this._addPageVisual(wave);
      this.tweens.add({ targets: wave, alpha: 0.02, x: wave.x + (i % 2 ? -15 : 15), duration: 2500 + i * 500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }

    // ── Layer 4: Beach / sand ──
    const sandGfx = this.add.graphics().setDepth(4);
    this._addPageVisual(sandGfx);
    // Sand gradient — wet dark tan to dry warm beige
    for (let y = Math.round(sandY); y < H; y++) {
      const st = (y - sandY) / (H - sandY);
      const sr = Math.round(138 + st * 66);   // 0x8a → 0xcc
      const sg = Math.round(112 + st * 58);   // 0x70 → 0xaa
      const sb = Math.round(80 + st * 32);    // 0x50 → 0x70
      sandGfx.fillStyle(Phaser.Display.Color.GetColor(sr, sg, sb), 1);
      sandGfx.fillRect(0, y, W, 1);
    }
    // Sand grain texture — tiny dots
    for (let i = 0; i < 50; i++) {
      const gx = Math.random() * W;
      const gy = sandY + Math.random() * (H - sandY);
      const shade = 0.06 + Math.random() * 0.08;
      sandGfx.fillStyle(0x998860, shade);
      sandGfx.fillCircle(gx, gy, 1 + Math.random());
    }
    // Foam line at water-sand boundary
    sandGfx.lineStyle(2, 0xffffff, 0.3);
    sandGfx.beginPath();
    for (let x = 0; x < W; x += 2) {
      const fy = sandY + Math.sin(x * 0.04) * 2 - 1;
      if (x === 0) sandGfx.moveTo(x, fy);
      else sandGfx.lineTo(x, fy);
    }
    sandGfx.strokePath();

    // ── Layer 5: Beach details — palm silhouettes + Tel Aviv skyline ──
    const detailGfx = this.add.graphics().setDepth(5);
    this._addPageVisual(detailGfx);
    // Tel Aviv skyline silhouette — left side
    detailGfx.fillStyle(0x1a0a1a, 0.6);
    const buildings = [
      { x: W * 0.05, w: 30, h: 110 },
      { x: W * 0.10, w: 22, h: 80 },
      { x: W * 0.14, w: 35, h: 140 },
      { x: W * 0.20, w: 28, h: 95 },
      { x: W * 0.26, w: 20, h: 65 },
      { x: W * 0.30, w: 32, h: 120 },
      { x: W * 0.36, w: 18, h: 50 },
    ];
    buildings.forEach(b => {
      const bTop = horizonY - b.h;
      detailGfx.fillRect(b.x, bTop, b.w, b.h + 4);
    });
    // Window lights on buildings
    detailGfx.fillStyle(0xffdd66, 0.4);
    buildings.forEach(b => {
      const bTop = horizonY - b.h;
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 2; c++) {
          if (Math.random() > 0.4) {
            detailGfx.fillRect(b.x + 4 + c * 10, bTop + 8 + r * 20, 3, 4);
          }
        }
      }
    });

    // Palm tree silhouettes — right side (each on own graphics for sway animation)
    const palmColor = 0x1a0a1a;
    const drawPalmOnGfx = (palmGfx, baseX, baseY, topY, trunkW) => {
      palmGfx.fillStyle(palmColor, 0.85);
      // Curved trunk — draw as narrow rect segments
      const segments = 20;
      for (let i = 0; i < segments; i++) {
        const t = i / segments;
        const py = baseY + (topY - baseY) * t;
        const curve = Math.sin(t * Math.PI * 0.8) * 15;
        const w = trunkW * (1 - t * 0.4);
        palmGfx.fillRect(baseX + curve - w / 2, py, w, (baseY - topY) / segments + 1);
      }
      // Palm fronds — 5 curved lines radiating from top
      const topX = baseX + Math.sin(0.8 * Math.PI) * 15;
      palmGfx.lineStyle(3, palmColor, 0.85);
      for (let f = 0; f < 5; f++) {
        const fAngle = -0.8 + f * 0.4; // spread from left to right
        palmGfx.beginPath();
        palmGfx.moveTo(topX, topY);
        const cpX = topX + Math.cos(fAngle) * 40;
        const cpY = topY + Math.sin(fAngle) * 20 - 15;
        const endX = topX + Math.cos(fAngle) * 65;
        const endY = topY + Math.sin(fAngle) * 35 + 5;
        // Approximate quadratic bezier with line segments
        for (let s = 1; s <= 8; s++) {
          const bt = s / 8;
          const bx = (1 - bt) * (1 - bt) * topX + 2 * (1 - bt) * bt * cpX + bt * bt * endX;
          const by = (1 - bt) * (1 - bt) * topY + 2 * (1 - bt) * bt * cpY + bt * bt * endY;
          palmGfx.lineTo(bx, by);
        }
        palmGfx.strokePath();
      }
    };
    const palmDefs = [
      { bx: W * 0.78, by: H, ty: H * 0.28, tw: 8, dur: 3000 },
      { bx: W * 0.88, by: H, ty: H * 0.42, tw: 6, dur: 3500 },
      { bx: W * 0.72, by: H, ty: H * 0.50, tw: 5, dur: 2800 },
    ];
    for (const pd of palmDefs) {
      const palmGfx = this.add.graphics().setDepth(5);
      this._addPageVisual(palmGfx);
      drawPalmOnGfx(palmGfx, pd.bx, pd.by, pd.ty, pd.tw);
      // Subtle sway animation
      this.tweens.add({ targets: palmGfx, angle: 1.5, duration: pd.dur, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }

    // ── Layer 6: Atmosphere — lens flare + floating embers ──
    const atmosGfx = this.add.graphics().setDepth(6);
    this._addPageVisual(atmosGfx);
    // Lens flare — small warm circles along a diagonal from the sun
    const flares = [
      { dist: 0.18, size: 12, color: 0xffcc88, alpha: 0.10 },
      { dist: 0.35, size: 8,  color: 0xff9966, alpha: 0.07 },
      { dist: 0.55, size: 15, color: 0xffddaa, alpha: 0.05 },
    ];
    flares.forEach(fl => {
      const fx = sunX + (cx - sunX) * fl.dist * 2;
      const fy = sunY + (cy - sunY) * fl.dist * 2;
      atmosGfx.fillStyle(fl.color, fl.alpha);
      atmosGfx.fillCircle(fx, fy, fl.size);
    });
    // Floating embers / warm particles drifting upward
    for (let i = 0; i < 10; i++) {
      const ex = 80 + Math.random() * (W - 160);
      const ey = H * 0.4 + Math.random() * (H * 0.5);
      const eSize = 1.5 + Math.random() * 2;
      const eColor = [0xff8844, 0xffaa66, 0xffcc88, 0xffdd44][i % 4];
      const ember = this.add.circle(ex, ey, eSize, eColor, 0.5 + Math.random() * 0.3).setDepth(6);
      this._addPageVisual(ember);
      this.tweens.add({
        targets: ember,
        y: ey - 60 - Math.random() * 80,
        x: ex + (Math.random() - 0.5) * 30,
        alpha: 0,
        duration: 3000 + Math.random() * 2000,
        ease: 'Sine.easeIn',
        repeat: -1,
        delay: Math.random() * 2000,
      });
    }

    // Pre-generated star — scales up from 0
    if (this.textures.exists('__star_metal_tex')) {
      const star = this.add.image(cx, starCy, '__star_metal_tex').setDepth(7).setScale(0).setAlpha(0);
      this._addPageVisual(star);
      this.tweens.add({ targets: star, scaleX: 0.82, scaleY: 0.82, alpha: 1, duration: 1200, ease: 'Back.easeOut' });
    }

    // Pre-generated SUPERZION title — slams down from above
    if (this.textures.exists('__title_reveal_tex')) {
      const title = this.add.image(cx, titleY - 80, '__title_reveal_tex').setDepth(20).setAlpha(0).setScale(1.8);
      this._addPageVisual(title);
      this.tweens.add({
        targets: title, y: titleY, scaleX: 1, scaleY: 1, alpha: 1,
        duration: 350, ease: 'Bounce.easeOut', delay: 800,
        onComplete: () => {
          this.cameras.main.shake(200, 0.015);
          SoundManager.get().playMegaExplosion();
        },
      });
    }

    // Subtitle — fades in via tween delay (no delayedCall)
    const sub = this.add.text(cx, titleY + 55, 'THEY FIGHT TO CONQUER. WE FIGHT TO EXIST.', {
      fontFamily: '"Impact", "Arial Black", sans-serif', fontSize: '18px', color: '#ffffff',
      shadow: { offsetX: 0, offsetY: 0, color: '#ffffff', blur: 8, fill: true },
    }).setOrigin(0.5).setDepth(25).setAlpha(0);
    this._addPageVisual(sub);
    this.tweens.add({ targets: sub, alpha: 1, duration: 800, delay: 1800 });
    this.time.delayedCall(1800, () => {
      if (!this.skipped) SoundManager.get().playRadarBlip();
    });

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
