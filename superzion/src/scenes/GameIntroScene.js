// ═══════════════════════════════════════════════════════════════
// GameIntroScene — Narrative-driven intro cinematic
// Page-by-page text with SPACE/ENTER advancement, visual scenes
// ═══════════════════════════════════════════════════════════════

import Phaser from 'phaser';
import BaseCinematicScene, { W, H } from './BaseCinematicScene.js';
import SoundManager from '../systems/SoundManager.js';
import MusicManager from '../systems/MusicManager.js';
import IntroMusic from '../systems/IntroMusic.js';
import { generateAllParadeTextures } from '../utils/ParadeTextures.js';

export default class GameIntroScene extends BaseCinematicScene {
  constructor() { super('GameIntroScene'); }

  create() {
    this._initCinematic();
    generateAllParadeTextures(this);

    // Start psytrance intro music
    this._introMusic = new IntroMusic();
    this._introMusic.start();

    // ── Define narrative pages ──
    this._initPages([
      // --- Dark opening: 3000 years of persecution ---
      {
        text: 'For 3,000 years, they tried to erase us.',
        color: '#ffffff', size: 24, y: H * 0.45,
        setup: () => this._setupDarkBg(),
      },
      {
        text: 'Babylon. Rome. The Inquisition. The Camps.',
        color: '#cccccc', size: 22, y: H * 0.45,
      },
      {
        text: 'Every time, we came back.',
        color: '#FFD700', size: 26, y: H * 0.45,
      },
      {
        text: 'Our enemies change their names. Their flags. Their weapons.',
        color: '#cccccc', size: 20, y: H * 0.45,
      },
      {
        text: 'But we are still here. The same people. The same land. The same fire.',
        color: '#ffffff', size: 22, y: H * 0.45,
      },

      // --- Map of Israel surrounded by enemy logos ---
      {
        text: 'Now they call themselves new names. They build new tunnels. New missiles. New plans.',
        color: '#ff6644', size: 20, y: H * 0.82,
        setup: () => this._setupMapScene(),
      },

      // --- 4 bosses in silhouette ---
      {
        text: 'They think this time will be different.',
        color: '#ff4444', size: 24, y: H * 0.85,
        setup: () => this._setupBossSilhouettes(),
      },

      // --- Enemy parade ---
      {
        text: 'They have armies. Missiles. Tunnels. And all the time in the world.',
        color: '#ff6644', size: 20, y: H * 0.85,
        setup: () => this._setupEnemyParade(),
      },

      // --- Dark moment ---
      {
        text: 'But they always forget one thing.',
        color: '#ffffff', size: 26, y: H * 0.45,
        setup: () => this._setupDarkBg(),
      },

      // --- Israel flag waving ---
      {
        text: 'We have nowhere else to go. And that changes everything.',
        color: '#ffffff', size: 22, y: H * 0.82,
        setup: () => this._setupIsraelFlag(),
      },

      // --- Israeli arsenal ---
      {
        text: 'Babylon is dust. Rome fell. The Inquisition is a footnote. The camps are museums.',
        color: '#4488ff', size: 20, y: H * 0.82,
        setup: () => this._setupArsenal(),
      },
      {
        text: "We're still here.",
        color: '#FFD700', size: 28, y: H * 0.82,
      },
      {
        text: "And this time won't be the exception.",
        color: '#ffffff', size: 22, y: H * 0.82,
      },

      // --- SuperZion reveal ---
      {
        text: 'One agent. Trained by the Mossad. Armed by the IDF. Driven by 3,000 years of not giving up.',
        color: '#FFD700', size: 20, y: H * 0.85,
        setup: () => this._setupHeroReveal(),
      },

      // --- Title page (special handling in setup) ---
      {
        text: '',  // Title is rendered visually, not via typewriter
        color: '#000000', size: 1, y: -100,  // hidden text
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

    // Enemy org logos surrounding the map
    const orgPositions = [
      { key: 'org_skull', x: cx - 180, y: cy - 40 },
      { key: 'org_fist', x: cx + 180, y: cy - 40 },
      { key: 'org_swords', x: cx - 120, y: cy + 80 },
      { key: 'org_serpent', x: cx + 120, y: cy + 80 },
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
    const bossKeys = ['parade_foambeard', 'parade_turboturban', 'parade_warden', 'parade_supremeturban'];
    const bossNames = ['FOAM BEARD', 'TURBO TURBAN', 'THE WARDEN', 'SUPREME TURBAN'];
    const spacing = W / 5;

    bossKeys.forEach((key, i) => {
      const bx = spacing * (i + 1);
      const by = H * 0.45;

      // Red glow behind
      const glow = this.add.circle(bx, by, 40, 0xff2200, 0).setDepth(3);
      this._addPageVisual(glow);
      this.tweens.add({ targets: glow, alpha: 0.3, duration: 600, delay: i * 200, yoyo: true, repeat: -1 });

      // Boss sprite (dark tint)
      if (this.textures.exists(key)) {
        const boss = this.add.sprite(bx, by, key).setDepth(5).setScale(0.8).setAlpha(0).setTint(0x220000);
        this._addPageVisual(boss);
        this.tweens.add({ targets: boss, alpha: 0.8, duration: 400, delay: i * 200 });
        SoundManager.get().playExplosion();
      }

      // Name label
      const label = this.add.text(bx, by + 55, bossNames[i], {
        fontFamily: 'monospace', fontSize: '10px', color: '#ff4444',
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

    // Org logos waving
    const orgData = [
      { key: 'org_skull', x: 150 },
      { key: 'org_fist', x: W / 2 - 100 },
      { key: 'org_swords', x: W / 2 + 100 },
      { key: 'org_serpent', x: W - 150 },
    ];
    orgData.forEach((fd, i) => {
      if (this.textures.exists(fd.key)) {
        const flag = this.add.sprite(fd.x, H / 2 - 10, fd.key).setDepth(4).setScale(0.6).setAlpha(0);
        flag.play(fd.key + '_wave');
        this._addPageVisual(flag);
        this.tweens.add({ targets: flag, alpha: 1, duration: 500, delay: i * 200 });
      }
    });

    // Missiles flying across
    for (let i = 0; i < 5; i++) {
      this.time.delayedCall(i * 400, () => {
        if (this.skipped) return;
        this._spawnMissile();
      });
    }

    // Random explosions
    for (let i = 0; i < 4; i++) {
      this.time.delayedCall(300 + i * 500, () => {
        if (this.skipped) return;
        this._spawnExplosion(100 + Math.random() * (W - 200), 80 + Math.random() * (H - 180));
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

    this.cameras.main.shake(200, 0.008);
    SoundManager.get().playExplosion();
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

    // Explosions in background
    for (let i = 0; i < 3; i++) {
      this.time.delayedCall(500 + i * 800, () => {
        if (this.skipped) return;
        this._spawnExplosion(600 + Math.random() * 300, 100 + Math.random() * 200);
      });
    }
  }

  /** SUPERZION title reveal — golden Maguen David, title, subtitle */
  _setupTitleReveal() {
    // Dark background with subtle golden glow
    const bg = this.add.graphics().setDepth(0);
    this._addPageVisual(bg);
    for (let y = 0; y < H; y++) {
      const t = y / H;
      bg.fillStyle(Phaser.Display.Color.GetColor(8 + t * 15 | 0, 6 + t * 12 | 0, 2 + t * 8 | 0));
      bg.fillRect(0, y, W, 1);
    }

    // WHITE FLASH
    const flash = this.add.rectangle(W / 2, H / 2, W, H, 0xffffff, 0.9).setDepth(30);
    this._addPageVisual(flash);
    this.tweens.add({ targets: flash, alpha: 0, duration: 600 });

    this.cameras.main.shake(500, 0.03);
    SoundManager.get().playExplosion();

    // Giant golden Maguen David
    const starGfx = this.add.graphics().setDepth(19);
    this._addPageVisual(starGfx);
    const cx = W / 2, cy = H / 2 - 30;
    const r = 110;
    starGfx.fillStyle(0xFFD700, 0.25);
    starGfx.fillTriangle(cx, cy - r, cx - r * 0.866, cy + r * 0.5, cx + r * 0.866, cy + r * 0.5);
    starGfx.fillTriangle(cx, cy + r, cx - r * 0.866, cy - r * 0.5, cx + r * 0.866, cy - r * 0.5);
    starGfx.setAlpha(0);
    this.tweens.add({ targets: starGfx, alpha: 1, duration: 600 });

    // "SUPERZION" title with outline, shadow, glow
    const titleFont = '"Impact", "Arial Black", "Trebuchet MS", sans-serif';
    // Drop shadow
    const titleShadow = this.add.text(W / 2 + 4, H / 2 - 36, 'S U P E R Z I O N', {
      fontFamily: titleFont, fontSize: '72px', color: '#000000',
    }).setOrigin(0.5).setDepth(49).setAlpha(0).setScale(3);
    this._addPageVisual(titleShadow);
    // Outline layers
    const outlineOffsets = [[-3,0],[3,0],[0,-3],[0,3],[-3,-3],[3,-3],[-3,3],[3,3]];
    const outlineTexts = [];
    for (const [dx, dy] of outlineOffsets) {
      const ol = this.add.text(W / 2 + dx, H / 2 - 40 + dy, 'S U P E R Z I O N', {
        fontFamily: titleFont, fontSize: '72px', color: '#000000',
      }).setOrigin(0.5).setDepth(49).setAlpha(0).setScale(3);
      this._addPageVisual(ol);
      outlineTexts.push(ol);
    }
    // Golden glow
    const titleGlow = this.add.text(W / 2, H / 2 - 40, 'S U P E R Z I O N', {
      fontFamily: titleFont, fontSize: '72px', color: '#FFD700',
      shadow: { offsetX: 0, offsetY: 0, color: '#FFD700', blur: 80, fill: true },
    }).setOrigin(0.5).setDepth(48).setAlpha(0).setScale(3);
    this._addPageVisual(titleGlow);
    // Main gold title
    const title = this.add.text(W / 2, H / 2 - 40, 'S U P E R Z I O N', {
      fontFamily: titleFont, fontSize: '72px', color: '#FFD700',
      shadow: { offsetX: 0, offsetY: 0, color: '#FFD700', blur: 40, fill: true },
    }).setOrigin(0.5).setDepth(50).setAlpha(0).setScale(3);
    this._addPageVisual(title);

    // Zoom in
    const allParts = [title, titleShadow, titleGlow, ...outlineTexts];
    for (const part of allParts) {
      this.tweens.add({
        targets: part,
        alpha: part === titleGlow ? 0.4 : part === titleShadow ? 0.5 : 1,
        scaleX: 1, scaleY: 1,
        duration: 300, ease: 'Back.easeOut',
      });
    }
    // Breathing pulse
    for (const part of allParts) {
      this.tweens.add({
        targets: part, scaleX: 1.04, scaleY: 1.04,
        duration: 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: 400,
      });
    }

    // Subtitle — new tagline
    this.time.delayedCall(800, () => {
      if (this.skipped) return;
      const sub = this.add.text(W / 2, H / 2 + 30, 'THEY FIGHT TO CONQUER. WE FIGHT TO EXIST.', {
        fontFamily: titleFont, fontSize: '22px', color: '#ffffff',
        shadow: { offsetX: 0, offsetY: 0, color: '#ffffff', blur: 10, fill: true },
      }).setOrigin(0.5).setDepth(50).setAlpha(0);
      this._addPageVisual(sub);
      this.tweens.add({ targets: sub, alpha: 1, duration: 500 });
    });

    // Secondary shake
    this.time.delayedCall(1000, () => {
      if (this.skipped) return;
      this.cameras.main.shake(200, 0.015);
      SoundManager.get().playExplosion();
    });

    // Make this page ready immediately (no typewriter text to wait for)
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
    SoundManager.get().playExplosion();

    this.tweens.add({
      targets: expGfx, alpha: 0, scale: 1.8,
      duration: 400 + Math.random() * 200, ease: 'Cubic.easeOut',
      onComplete: () => { if (expGfx && expGfx.destroy) expGfx.destroy(); },
    });
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
    if (this._introMusic) this._introMusic.stop();
    MusicManager.get().stop(0.3);
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.time.delayedCall(350, () => this.scene.start('MenuScene'));
  }

  update() {
    this._handlePageInput();
  }
}
