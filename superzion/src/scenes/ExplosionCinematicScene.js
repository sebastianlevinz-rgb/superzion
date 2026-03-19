// ═══════════════════════════════════════════════════════════════
// ExplosionCinematicScene — 5-phase explosion + victory screen
// ═══════════════════════════════════════════════════════════════

import Phaser from 'phaser';
import SoundManager from '../systems/SoundManager.js';
import MusicManager from '../systems/MusicManager.js';
import { showVictoryScreen } from '../ui/EndScreen.js';

const W = 960;
const H = 540;
const WORLD_W = 1300;
const GROUND_PX = 440;
const FLOOR_H = 38;
const NUM_FLOORS = 5;

export default class ExplosionCinematicScene extends Phaser.Scene {
  constructor() { super('ExplosionCinematicScene'); }

  init(data) {
    this.stats = data.stats || { timesDetected: 0, elapsed: 0, hp: 3, maxHp: 3 };
    // Support both old (timesDetected) and new (guardsKilled) stat formats
    if (this.stats.guardsKilled !== undefined && this.stats.timesDetected === 0) {
      this.stats._bomberman = true;
    }
  }

  create() {
    this.cameras.main.setBackgroundColor('#87CEEB');
    MusicManager.get().stop(0.5);
    // Start cinematic music after brief fade to avoid silence
    this.time.delayedCall(600, () => MusicManager.get().playCinematicMusic(1));
    this.cameras.main.setBounds(0, 0, WORLD_W, H);

    this.buildingX = 950;
    this.playerX = 200;
    this.victoryShown = false;
    this.canSkipToMenu = false;

    this._buildScene();

    // Camera starts centered on building
    this.cameras.main.scrollX = Math.min(this.buildingX - W / 2, WORLD_W - W);

    // Input
    this.enterKey = this.input.keyboard.addKey('ENTER');
    this.spaceKey = this.input.keyboard.addKey('SPACE');
    this.mKey = this.input.keyboard.addKey('M');
    this.rKey = this.input.keyboard.addKey('R');

    // Skip hint during cinematic
    this.skipHint = this.add.text(W - 16, H - 14, 'PRESS ENTER TO SKIP', {
      fontFamily: 'monospace', fontSize: '10px', color: '#555555',
    });
    this.skipHint.setOrigin(1, 1); this.skipHint.setScrollFactor(0); this.skipHint.setDepth(100);

    // Start phase 1 after brief delay
    this.time.delayedCall(200, () => this._phase1());
  }

  // ── Build the simplified scene ──────────────────────────────
  _buildScene() {
    const bx = this.buildingX;

    // Sky gradient
    if (this.textures.exists('sky_gradient')) {
      this.add.image(W / 2, H / 2, 'sky_gradient').setDepth(-10);
      // Second copy for wider world
      this.add.image(W / 2 + W, H / 2, 'sky_gradient').setDepth(-10);
    }
    if (this.textures.exists('mountains')) {
      this.add.tileSprite(WORLD_W / 2, H / 2, WORLD_W, H, 'mountains').setDepth(-9);
    }
    if (this.textures.exists('skyline')) {
      this.add.tileSprite(WORLD_W / 2, H / 2, WORLD_W, H, 'skyline').setDepth(-8);
    }
    if (this.textures.exists('facades')) {
      this.add.tileSprite(WORLD_W / 2, H / 2, WORLD_W, H, 'facades').setDepth(-7);
    }

    // Ground
    if (this.textures.exists('ground_top')) {
      for (let tx = 0; tx < Math.ceil(WORLD_W / 32); tx++) {
        this.add.image(tx * 32 + 16, GROUND_PX + 16, 'ground_top').setDepth(1);
      }
    } else {
      this.add.rectangle(WORLD_W / 2, GROUND_PX + 16, WORLD_W, 32, 0x4a6a3a).setDepth(1);
    }
    if (this.textures.exists('ground_fill')) {
      for (let tx = 0; tx < Math.ceil(WORLD_W / 32); tx++) {
        this.add.image(tx * 32 + 16, GROUND_PX + 48, 'ground_fill').setDepth(0);
      }
    } else {
      this.add.rectangle(WORLD_W / 2, GROUND_PX + 50, WORLD_W, 60, 0x2a3a1a).setDepth(0);
    }

    // Building floors
    this.floorSprites = [];
    for (let i = 0; i < NUM_FLOORS; i++) {
      const floorY = GROUND_PX - (i + 1) * FLOOR_H;
      const texKey = `target_bldg_floor_${i}`;
      if (this.textures.exists(texKey)) {
        const sp = this.add.image(bx, floorY + FLOOR_H / 2, texKey);
        sp.setDepth(3);
        this.floorSprites.push(sp);
      }
    }

    // Roof
    const roofY = GROUND_PX - NUM_FLOORS * FLOOR_H - FLOOR_H;
    if (this.textures.exists('target_bldg_roof')) {
      this.roofSprite = this.add.image(bx, roofY + FLOOR_H / 2, 'target_bldg_roof');
      this.roofSprite.setDepth(3);
    }

    // Bomb blinking at base
    if (this.textures.exists('explosive_device')) {
      this.bombSprite = this.add.image(bx, GROUND_PX - 10, 'explosive_device');
      this.bombSprite.setDepth(5); this.bombSprite.setScale(1.5);
      this.tweens.add({ targets: this.bombSprite, alpha: 0.5, duration: 200, yoyo: true, repeat: 3 });
    }

    // Player sprite
    if (this.textures.exists('superzion')) {
      this.playerSprite = this.add.sprite(this.playerX, GROUND_PX - 42, 'superzion', 1);
      this.playerSprite.setDepth(5);
    } else if (this.textures.exists('player_silhouette')) {
      this.playerSprite = this.add.image(this.playerX, GROUND_PX - 40, 'player_silhouette');
      this.playerSprite.setScale(0.6); this.playerSprite.setDepth(5);
    }
  }

  // ── PHASE 1 — Detonation (0-1s): flash + shake ─────────────
  _phase1() {
    SoundManager.get().playExplosion();
    const cam = this.cameras.main;

    // Remove bomb
    if (this.bombSprite) {
      this.tweens.killTweensOf(this.bombSprite);
      this.bombSprite.destroy();
      this.bombSprite = null;
    }

    // White flash (screen-space)
    const flash = this.add.rectangle(W / 2, H / 2, W + 200, H + 200, 0xffffff, 1);
    flash.setScrollFactor(0); flash.setDepth(300);
    this.tweens.add({
      targets: flash, alpha: 0, duration: 800,
      ease: 'Cubic.easeOut',
      onComplete: () => flash.destroy(),
    });

    // Strong shake
    cam.shake(1500, 0.06);

    // Phase 2 at 1s
    this.time.delayedCall(1000, () => this._phase2());
  }

  // ── PHASE 2 — Explosion (1-3s): fireball + debris ──────────
  _phase2() {
    const bx = this.buildingX;
    const centerY = GROUND_PX - (NUM_FLOORS * FLOOR_H) / 2;

    // Expanding fireball (drawn with graphics)
    const fireGfx = this.add.graphics();
    fireGfx.setDepth(15);
    let radius = 0;
    const maxR = 300;

    const fireTimer = this.time.addEvent({
      delay: 25, repeat: Math.floor(2000 / 25),
      callback: () => {
        radius += maxR / (2000 / 25);
        const fade = 1 - (radius / maxR);
        fireGfx.clear();
        // Concentric colored circles
        const layers = [
          { r: 1.0, color: 0xff0000, alpha: 0.25 * fade },
          { r: 0.75, color: 0xff4400, alpha: 0.35 * fade },
          { r: 0.5, color: 0xff8800, alpha: 0.45 * fade },
          { r: 0.3, color: 0xffcc00, alpha: 0.55 * fade },
          { r: 0.15, color: 0xffff88, alpha: 0.6 * fade },
          { r: 0.05, color: 0xffffff, alpha: 0.7 * fade },
        ];
        for (const l of layers) {
          fireGfx.fillStyle(l.color, l.alpha);
          fireGfx.fillCircle(bx, GROUND_PX - 20, radius * l.r);
        }
      },
    });

    // Fade out fireball graphics
    this.time.delayedCall(1800, () => {
      this.tweens.add({
        targets: fireGfx, alpha: 0, duration: 600,
        onComplete: () => { fireTimer.destroy(); fireGfx.destroy(); },
      });
    });

    // Texture-based fireballs
    if (this.textures.exists('fireball')) {
      for (let i = 0; i < 10; i++) {
        const fb = this.add.image(
          bx + (Math.random() - 0.5) * 220,
          centerY + (Math.random() - 0.5) * 140,
          'fireball'
        );
        fb.setDepth(16);
        fb.setScale(0.5 + Math.random() * 2.5);
        fb.setAlpha(0.9);
        this.tweens.add({
          targets: fb,
          alpha: 0, scaleX: fb.scaleX * 2.5, scaleY: fb.scaleY * 2.5,
          duration: 700 + Math.random() * 800,
          delay: Math.random() * 500,
          onComplete: () => fb.destroy(),
        });
      }
    }

    // 55+ debris particles
    const debrisColors = [0x888888, 0x6a5a4a, 0x7a7a6a, 0x5a4a3a, 0x9a8a7a, 0x4a3a2a];
    for (let i = 0; i < 60; i++) {
      const sz = 2 + Math.random() * 6;
      const color = debrisColors[Math.floor(Math.random() * debrisColors.length)];
      const d = this.add.rectangle(
        bx + (Math.random() - 0.5) * 60,
        GROUND_PX - 20 - Math.random() * 40,
        sz, sz * (0.5 + Math.random()), color
      );
      d.setDepth(14);

      const angle = Math.random() * Math.PI * 2;
      const speed = 80 + Math.random() * 420;

      this.tweens.add({
        targets: d,
        x: d.x + Math.cos(angle) * speed,
        y: { value: d.y + Math.sin(angle) * speed + 120, ease: 'Quad.easeIn' },
        angle: Math.random() * 720 - 360,
        alpha: 0,
        duration: 800 + Math.random() * 1500,
        delay: Math.random() * 400,
        onComplete: () => d.destroy(),
      });
    }

    // Building cracks (dark lines over floors)
    const crackGfx = this.add.graphics();
    crackGfx.setDepth(4);
    crackGfx.lineStyle(2, 0x000000, 0.6);
    for (let i = 0; i < 8; i++) {
      const cx = bx + (Math.random() - 0.5) * 180;
      const cy = GROUND_PX - Math.random() * (NUM_FLOORS * FLOOR_H);
      crackGfx.beginPath();
      crackGfx.moveTo(cx, cy);
      for (let s = 0; s < 3; s++) {
        crackGfx.lineTo(cx + (Math.random() - 0.5) * 40, cy + 10 + Math.random() * 30);
      }
      crackGfx.strokePath();
    }
    crackGfx.setAlpha(0);
    this.tweens.add({ targets: crackGfx, alpha: 1, duration: 500 });

    // Ongoing shake
    this.cameras.main.shake(2000, 0.035);

    // Phase 3 at 3s (2s after phase 2 start)
    this.time.delayedCall(2000, () => {
      crackGfx.destroy();
      this._phase3();
    });
  }

  // ── PHASE 3 — Collapse (3-5s): floors fall + dust ──────────
  _phase3() {
    const bx = this.buildingX;

    // Collect all building pieces (roof first, then floors top→bottom)
    const pieces = [];
    if (this.roofSprite) pieces.push(this.roofSprite);
    const reversed = [...this.floorSprites].reverse();
    pieces.push(...reversed);

    // Each floor falls onto the one below with staggered delay
    pieces.forEach((sp, i) => {
      this.tweens.add({
        targets: sp,
        y: GROUND_PX - 8 - i * 4,
        scaleY: 0.25 + Math.random() * 0.15,
        scaleX: 1 + Math.random() * 0.2,
        alpha: 0.6,
        duration: 350 + Math.random() * 150,
        delay: i * 300,
        ease: 'Bounce.easeOut',
        onComplete: () => this._impactDust(sp.x + (Math.random() - 0.5) * 80, GROUND_PX - 6),
      });
    });

    // Horizontal dust clouds after floors start falling
    this.time.delayedCall(600, () => {
      if (this.textures.exists('dust_cloud')) {
        for (const side of [-1, 1]) {
          const dust = this.add.image(bx, GROUND_PX - 16, 'dust_cloud');
          dust.setDepth(12); dust.setScale(1.5, 2); dust.setAlpha(0.65);
          this.tweens.add({
            targets: dust,
            x: bx + side * 320, scaleX: 4, alpha: 0,
            duration: 3500,
            onComplete: () => dust.destroy(),
          });
        }
      }
    });

    // More falling debris
    for (let i = 0; i < 30; i++) {
      const sz = 1 + Math.random() * 4;
      const color = Math.random() > 0.5 ? 0x888888 : 0x6a5a4a;
      const d = this.add.rectangle(
        bx + (Math.random() - 0.5) * 200,
        GROUND_PX - 200 - Math.random() * 100,
        sz, sz, color
      );
      d.setDepth(13);
      this.tweens.add({
        targets: d,
        y: GROUND_PX, alpha: 0,
        duration: 1000 + Math.random() * 2000,
        delay: Math.random() * 1500,
        onComplete: () => d.destroy(),
      });
    }

    // Diminishing shake
    this.cameras.main.shake(2000, 0.018);

    // Phase 4 at 5s
    this.time.delayedCall(2000, () => this._phase4());
  }

  _impactDust(x, y) {
    for (let i = 0; i < 4; i++) {
      const puff = this.add.circle(
        x + (Math.random() - 0.5) * 24, y,
        4 + Math.random() * 10, 0x998877, 0.35
      );
      puff.setDepth(11);
      this.tweens.add({
        targets: puff,
        y: y - 15 - Math.random() * 35,
        scaleX: 2, scaleY: 2, alpha: 0,
        duration: 500 + Math.random() * 400,
        onComplete: () => puff.destroy(),
      });
    }
  }

  // ── PHASE 4 — Smoke (5-8s): column + fires + skull ─────────
  _phase4() {
    const bx = this.buildingX;

    // Smoke column (continuous rising particles)
    this.time.addEvent({
      delay: 180, repeat: 16,
      callback: () => {
        if (this.textures.exists('smoke_puff')) {
          const smoke = this.add.image(
            bx + (Math.random() - 0.5) * 80,
            GROUND_PX - 25,
            'smoke_puff'
          );
          smoke.setDepth(13);
          smoke.setScale(1.2 + Math.random() * 2);
          smoke.setAlpha(0.45);
          smoke.setTint(Math.random() > 0.3 ? 0x333333 : 0x555555);
          this.tweens.add({
            targets: smoke,
            y: GROUND_PX - 200 - Math.random() * 160,
            scaleX: smoke.scaleX * 2, scaleY: smoke.scaleY * 2,
            alpha: 0,
            duration: 2200 + Math.random() * 1000,
            onComplete: () => smoke.destroy(),
          });
        }
      },
    });

    // Small fires flickering in rubble
    for (let i = 0; i < 8; i++) {
      const fx = bx + (Math.random() - 0.5) * 170;
      const fy = GROUND_PX - 6 - Math.random() * 18;
      const fire = this.add.rectangle(fx, fy, 3 + Math.random() * 5, 6 + Math.random() * 8, 0xff6600);
      fire.setDepth(14); fire.setAlpha(0.7);
      this.tweens.add({
        targets: fire,
        alpha: 0.15, scaleY: 0.4,
        duration: 150 + Math.random() * 250,
        yoyo: true, repeat: 10,
        onComplete: () => {
          this.tweens.add({ targets: fire, alpha: 0, duration: 600, onComplete: () => fire.destroy() });
        },
      });
    }

    // Ruins sprite
    this.time.delayedCall(400, () => {
      if (this.textures.exists('building_ruins')) {
        const ruins = this.add.image(bx, GROUND_PX - 32, 'building_ruins');
        ruins.setDepth(3); ruins.setAlpha(0);
        this.tweens.add({ targets: ruins, alpha: 1, duration: 800 });
      }

      // Fade out collapsed floor sprites
      [...this.floorSprites, this.roofSprite].forEach(sp => {
        if (sp && sp.active) {
          this.tweens.add({ targets: sp, alpha: 0, duration: 600, onComplete: () => sp.destroy() });
        }
      });
    });

    // Skull emoji
    this.time.delayedCall(800, () => {
      const skull = this.add.text(bx, GROUND_PX - 130, '\u2620\uFE0F', { fontSize: '72px' });
      skull.setOrigin(0.5); skull.setDepth(20); skull.setScale(0);
      this.tweens.add({ targets: skull, scaleX: 1, scaleY: 1, duration: 600, ease: 'Bounce.easeOut' });
      this.tweens.add({ targets: skull, alpha: 0, duration: 500, delay: 1500, onComplete: () => skull.destroy() });
    });

    // "דוד אבי" typewriter
    this.time.delayedCall(1300, () => {
      const dodAvi = this.add.text(bx, GROUND_PX - 65, '', {
        fontFamily: 'monospace', fontSize: '28px', color: '#FFD700',
        shadow: { offsetX: 0, offsetY: 0, color: '#FFD700', blur: 12, fill: true },
      });
      dodAvi.setOrigin(0.5); dodAvi.setDepth(20);

      const fullText = '\u05D3\u05D5\u05D3 \u05D0\u05D1\u05D9';
      let idx = 0;
      this.time.addEvent({
        delay: 120, repeat: fullText.length - 1,
        callback: () => { idx++; dodAvi.setText(fullText.substring(0, idx)); },
      });
      this.tweens.add({
        targets: dodAvi, alpha: 0, duration: 500, delay: 2500,
        onComplete: () => dodAvi.destroy(),
      });
    });

    // Phase 5 at 8s (3s after phase 4 start)
    this.time.delayedCall(3000, () => this._phase5());
  }

  // ── PHASE 5 — Camera pan (8-10s) ───────────────────────────
  _phase5() {
    const cam = this.cameras.main;
    const playerScrollX = Math.max(0, this.playerX - W / 2);
    const ruinsScrollX = Math.min(this.buildingX - W / 2, WORLD_W - W);

    // Pan to show player
    this.tweens.add({
      targets: cam,
      scrollX: playerScrollX,
      duration: 600,
      ease: 'Sine.easeInOut',
      onComplete: () => {
        // Hold on player briefly
        this.time.delayedCall(400, () => {
          // Pan to ruins
          this.tweens.add({
            targets: cam,
            scrollX: ruinsScrollX,
            duration: 1500,
            ease: 'Sine.easeInOut',
            onComplete: () => {
              // Hold on ruins
              this.time.delayedCall(600, () => {
                // Fade to black
                cam.fadeOut(800, 0, 0, 0);
                this.time.delayedCall(1000, () => this._showVictory());
              });
            },
          });
        });
      },
    });
  }

  // ── VICTORY SCREEN ──────────────────────────────────────────
  _showVictory() {
    this.victoryShown = true;
    SoundManager.get().playVictory();
    if (this.skipHint) this.skipHint.destroy();

    const cam = this.cameras.main;
    cam.fadeIn(500, 0, 0, 0);

    // Stats computation
    const elapsed = this.stats.elapsed;
    const mins = Math.floor(elapsed / 60000);
    const secs = Math.floor((elapsed % 60000) / 1000);
    const timeStr = `${mins}:${secs.toString().padStart(2, '0')}`;

    const lives = this.stats.hp || 0;
    const maxLives = this.stats.maxHp || 3;
    let ratingLabel;
    if (lives === maxLives)   ratingLabel = 'PERFECT';
    else if (lives >= 2)      ratingLabel = 'GREAT';
    else if (lives >= 1)      ratingLabel = 'GOOD';
    else                      ratingLabel = 'SURVIVED';

    const starCount = lives === maxLives ? 3 : lives >= 2 ? 2 : lives >= 1 ? 1 : 0;
    try { localStorage.setItem('superzion_stars_1', String(starCount)); } catch(e) {}

    const stats = this.stats._bomberman ? [
      { label: 'TIME', value: timeStr },
      { label: 'LIVES REMAINING', value: `${lives}/${maxLives}` },
      { label: 'GUARDS ELIMINATED', value: `${this.stats.guardsKilled || 0}` },
      { label: 'POWER-UPS', value: `${this.stats.powerupsCollected || 0}` },
      { label: 'RATING', value: ratingLabel },
    ] : [
      { label: 'TIME', value: timeStr },
      { label: 'HP REMAINING', value: `${lives}/${maxLives}` },
      { label: 'TIMES DETECTED', value: `${this.stats.timesDetected || 0}` },
      { label: 'RATING', value: ratingLabel },
    ];

    this._endScreen = showVictoryScreen(this, {
      title: 'MISSION COMPLETE',
      stats,
      stars: starCount,
      currentScene: 'GameScene',
      nextScene: 'BeirutIntroCinematicScene',
    });
  }

  // ── UPDATE ──────────────────────────────────────────────────
  update() {
    if (Phaser.Input.Keyboard.JustDown(this.mKey)) {
      const muted = SoundManager.get().toggleMute();
      MusicManager.get().setMuted(muted);
    }

    // Victory screen keys handled by EndScreen.js
    if (this.canSkipToMenu) {
      return;
    }

    // During cinematic: ENTER/SPACE = skip to victory
    const skip = Phaser.Input.Keyboard.JustDown(this.enterKey) || Phaser.Input.Keyboard.JustDown(this.spaceKey);
    if (skip && !this.victoryShown) {
      this.victoryShown = true;
      this.tweens.killAll();
      this.time.removeAllEvents();
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.time.delayedCall(400, () => this._showVictory());
    }
  }

  shutdown() {
    if (this._endScreen) this._endScreen.destroy();
  }
}
