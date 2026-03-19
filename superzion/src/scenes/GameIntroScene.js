// ═══════════════════════════════════════════════════════════════
// GameIntroScene — PSYTRANCE Action Intro (25s, skippable)
// Act 1: THE AXIS OF EVIL — red sky, missiles launching, bosses shooting
// Act 2: ISRAEL RESPONDS — blue sky, jets firing, Iron Dome, tanks
// Act 3: SUPERZION — hero walks in, pistol shot, title impact
// ═══════════════════════════════════════════════════════════════

import Phaser from 'phaser';
import BaseCinematicScene, { W, H } from './BaseCinematicScene.js';
import SoundManager from '../systems/SoundManager.js';
import MusicManager from '../systems/MusicManager.js';
import IntroMusic from '../systems/IntroMusic.js';
import { playMissileWhoosh, playJetFlyby, playTankRumble } from '../systems/IntroMusic.js';
import { generateAllParadeTextures } from '../utils/ParadeTextures.js';

export default class GameIntroScene extends BaseCinematicScene {
  constructor() { super('GameIntroScene'); }

  create() {
    this._initCinematic();
    generateAllParadeTextures(this);

    // Start psytrance intro music
    this._introMusic = new IntroMusic();
    this._introMusic.start();

    this._startAct1();
  }

  // ═════════════════════════════════════════════════════════════
  // ACT 1 — THE AXIS OF EVIL (0-8s)
  // Missiles launching, bosses shooting, explosions, chaos
  // ═════════════════════════════════════════════════════════════
  _startAct1() {
    this.currentAct = 1;

    // ── Red/dark sky background ──
    const bg = this.add.graphics().setDepth(0);
    this.actObjects.push(bg);
    for (let y = 0; y < H; y++) {
      const t = y / H;
      bg.fillStyle(Phaser.Display.Color.GetColor(
        30 + t * 80 | 0, 2 + t * 8 | 0, 2 + t * 5 | 0
      ));
      bg.fillRect(0, y, W, 1);
    }
    // Dark smoke clouds
    for (const [cx, cy, r] of [[120, 70, 80], [350, 100, 65], [600, 60, 70], [800, 110, 55], [250, 150, 60]]) {
      bg.fillStyle(0x1a0505, 0.3);
      bg.fillCircle(cx, cy, r);
    }
    // Ground strip — scorched earth
    bg.fillStyle(0x2a1508, 1);
    bg.fillRect(0, H - 60, W, 60);
    bg.fillStyle(0x3a2010, 1);
    bg.fillRect(0, H - 60, W, 3);

    // ── Persistent fire glow on ground ──
    const fireGlow = this.add.graphics().setDepth(1);
    this.actObjects.push(fireGlow);
    for (let i = 0; i < 8; i++) {
      const fx = Math.random() * W;
      const fy = H - 55 + Math.random() * 10;
      fireGlow.fillStyle(0xff4400, 0.08);
      fireGlow.fillCircle(fx, fy, 20 + Math.random() * 25);
      fireGlow.fillStyle(0xff2200, 0.05);
      fireGlow.fillCircle(fx, fy, 35 + Math.random() * 20);
    }

    // ── Waving flag sprites behind boss positions ──
    const flagData = [
      { key: 'flag_iran', x: 150 },
      { key: 'flag_lebanon', x: W / 2 - 100 },
      { key: 'flag_palestine', x: W / 2 + 100 },
      { key: 'flag_israel', x: W - 150 },
    ];
    flagData.forEach((fd, i) => {
      const flag = this.add.sprite(fd.x, H / 2 - 10, fd.key)
        .setDepth(4).setScale(0.6).setAlpha(0);
      flag.play(fd.key + '_wave');
      this.actObjects.push(flag);
      this.tweens.add({ targets: flag, alpha: 1, duration: 500, delay: i * 200 });
    });

    // ── "THE AXIS OF EVIL" title with red glow ──
    const titleText = this.add.text(W / 2, H / 2 - 60, 'THE AXIS OF EVIL', {
      fontFamily: 'monospace', fontSize: '42px', color: '#ff1111',
      shadow: { offsetX: 0, offsetY: 0, color: '#ff0000', blur: 30, fill: true },
    }).setOrigin(0.5).setDepth(60).setAlpha(0);
    this.actObjects.push(titleText);
    this.tweens.add({ targets: titleText, alpha: 1, duration: 600 });
    // Pulsing red glow
    this.tweens.add({
      targets: titleText, scaleX: 1.03, scaleY: 1.03,
      duration: 300, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });
    this.tweens.add({ targets: titleText, alpha: 0, duration: 400, delay: 2500 });

    // ── Boss appearances with flash + boom ──
    // Boss 1: Foam Beard (Iran) at ~1.2s
    this.time.delayedCall(1200, () => {
      if (this.skipped) return;
      this._bossFlashEntry(150, H / 2 + 40, 'parade_foambeard', 'IRAN', this._attackFoamBeard);
      SoundManager.get().playExplosion();
      this.cameras.main.shake(200, 0.012);
    });

    // Boss 2: Turbo Turban (Lebanon) at ~2.8s
    this.time.delayedCall(2800, () => {
      if (this.skipped) return;
      this._bossFlashEntry(W / 2 - 100, H / 2 + 40, 'parade_turboturban', 'HEZBOLLAH', this._attackTurboTurban);
      SoundManager.get().playExplosion();
      this.cameras.main.shake(200, 0.012);
    });

    // Boss 3: The Warden (Gaza) at ~4.4s
    this.time.delayedCall(4400, () => {
      if (this.skipped) return;
      this._bossFlashEntry(W / 2 + 100, H / 2 + 40, 'parade_warden', 'HAMAS', this._attackWarden);
      SoundManager.get().playExplosion();
      this.cameras.main.shake(250, 0.015);
    });

    // Boss 4: Supreme Turban (Supreme Leader) at ~6.0s
    this.time.delayedCall(6000, () => {
      if (this.skipped) return;
      this._bossFlashEntry(W - 150, H / 2 + 40, 'parade_supremeturban', 'SUPREME LEADER', this._attackSupremeTurban);
      SoundManager.get().playExplosion();
      this.cameras.main.shake(300, 0.018);
    });

    // ── Missiles flying across screen continuously ──
    this._missileCount = 0;
    this._missileTimer = this.time.addEvent({
      delay: 400, repeat: 18,
      callback: () => {
        if (this.skipped) return;
        this._spawnMissile();
      },
    });
    this.actObjects.push(this._missileTimer);

    // ── Explosions popping randomly ──
    this._explosionTimer = this.time.addEvent({
      delay: 500, repeat: 14,
      callback: () => {
        if (this.skipped) return;
        this._spawnExplosion(
          100 + Math.random() * (W - 200),
          80 + Math.random() * (H - 180)
        );
      },
    });
    this.actObjects.push(this._explosionTimer);

    // ── Screen shakes on every other beat (~0.83s) ──
    for (let i = 0; i < 9; i++) {
      this.time.delayedCall(i * 830, () => {
        if (this.skipped) return;
        this.cameras.main.shake(100, 0.005 + Math.random() * 0.005);
      });
    }

    // ── Transition to Act 2 ──
    this.time.delayedCall(7500, () => {
      if (this.skipped) return;
      this.cameras.main.fadeOut(500, 0, 0, 0);
    });
    this.time.delayedCall(8000, () => {
      if (this.skipped) return;
      this._clearAct();
      this.cameras.main.fadeIn(400, 0, 0, 0);
      this._startAct2();
    });
  }

  // ═════════════════════════════════════════════════════════════
  // ACT 2 — ISRAEL RESPONDS (8-16s)
  // Jets firing, bombs dropping, Iron Dome, tanks, EXPLOSIONS
  // ═════════════════════════════════════════════════════════════
  _startAct2() {
    this.currentAct = 2;

    // ── Blue sky background ──
    const bg = this.add.graphics().setDepth(0);
    this.actObjects.push(bg);
    for (let y = 0; y < H; y++) {
      const t = y / H;
      bg.fillStyle(Phaser.Display.Color.GetColor(
        30 + t * 100 | 0, 80 + t * 130 | 0, 180 + t * 50 | 0
      ));
      bg.fillRect(0, y, W, 1);
    }
    // Sun
    bg.fillStyle(0xfff8e0, 0.7);
    bg.fillCircle(160, 80, 25);
    bg.fillStyle(0xfff0c0, 0.2);
    bg.fillCircle(160, 80, 55);
    // Ground — desert
    bg.fillStyle(0x9a8a60, 1);
    bg.fillRect(0, H - 70, W, 70);
    bg.fillStyle(0xaa9a70, 1);
    bg.fillRect(0, H - 70, W, 3);

    // ── "ISRAEL DEFENSE FORCES" title ──
    const idfText = this.add.text(W / 2, H / 2 - 80, 'ISRAEL DEFENSE FORCES', {
      fontFamily: 'monospace', fontSize: '34px', color: '#4488ff',
      shadow: { offsetX: 0, offsetY: 0, color: '#FFD700', blur: 20, fill: true },
    }).setOrigin(0.5).setDepth(60).setAlpha(0);
    this.actObjects.push(idfText);
    this.tweens.add({ targets: idfText, alpha: 1, duration: 600 });
    this.tweens.add({ targets: idfText, alpha: 0, duration: 400, delay: 2500 });

    // ── F-15 jets streak across firing missiles (1s) ──
    this.time.delayedCall(800, () => {
      if (this.skipped) return;
      this._spawnJetStrike(100, 120, true);
      this._playIntroSFX(playJetFlyby);
      this.cameras.main.shake(200, 0.01);
    });
    this.time.delayedCall(1500, () => {
      if (this.skipped) return;
      this._spawnJetStrike(200, 150, true);
    });

    // ── F-35 dropping bombs (3s) ──
    this.time.delayedCall(2800, () => {
      if (this.skipped) return;
      this._spawnBomber(W / 2, 100);
      SoundManager.get().playBombDrop();
      this.cameras.main.shake(300, 0.018);
    });

    // ── Iron Dome interceptions (4.5s) ──
    this.time.delayedCall(4200, () => {
      if (this.skipped) return;
      this._spawnIronDomeSequence();
      SoundManager.get().playExplosion();
      this.cameras.main.shake(250, 0.015);
    });

    // ── Tanks firing (6s) ──
    this.time.delayedCall(5500, () => {
      if (this.skipped) return;
      this._spawnTankFiring(200, H - 90);
      SoundManager.get().playBombImpact();
      this.cameras.main.shake(300, 0.02);
    });
    this.time.delayedCall(6200, () => {
      if (this.skipped) return;
      this._spawnTankFiring(550, H - 85);
      SoundManager.get().playBombImpact();
    });

    // ── Continuous explosions ──
    this._act2ExpTimer = this.time.addEvent({
      delay: 600, repeat: 12,
      callback: () => {
        if (this.skipped) return;
        this._spawnExplosion(
          50 + Math.random() * (W - 100),
          60 + Math.random() * (H - 160)
        );
      },
    });
    this.actObjects.push(this._act2ExpTimer);

    // ── Beat-synced shakes ──
    for (let i = 0; i < 9; i++) {
      this.time.delayedCall(i * 830, () => {
        if (this.skipped) return;
        this.cameras.main.shake(80, 0.004 + Math.random() * 0.004);
      });
    }

    // ── Transition to Act 3 ──
    this.time.delayedCall(7500, () => {
      if (this.skipped) return;
      this.cameras.main.fadeOut(500, 0, 0, 0);
    });
    this.time.delayedCall(8000, () => {
      if (this.skipped) return;
      this._clearAct();
      this.cameras.main.fadeIn(400, 0, 0, 0);
      this._startAct3();
    });
  }

  // ═════════════════════════════════════════════════════════════
  // ACT 3 — SUPERZION (16-25s)
  // Hero walks in, pistol shot, title IMPACT
  // ═════════════════════════════════════════════════════════════
  _startAct3() {
    this.currentAct = 3;

    // ── Smoky battlefield background ──
    const bg = this.add.graphics().setDepth(0);
    this.actObjects.push(bg);
    for (let y = 0; y < H; y++) {
      const t = y / H;
      bg.fillStyle(Phaser.Display.Color.GetColor(
        12 + t * 30 | 0, 10 + t * 22 | 0, 8 + t * 18 | 0
      ));
      bg.fillRect(0, y, W, 1);
    }
    // Scorched ground
    bg.fillStyle(0x3a2818, 1);
    bg.fillRect(0, H - 80, W, 80);

    // ── Fires and smoke in background ──
    const smokeGfx = this.add.graphics().setDepth(1);
    this.actObjects.push(smokeGfx);
    // Distant fires (left side — enemy territory)
    for (const [cx, cy, r] of [[80, 200, 50], [40, 300, 40], [150, 340, 35], [100, 140, 30]]) {
      smokeGfx.fillStyle(0x3a1a08, 0.25);
      smokeGfx.fillCircle(cx, cy, r);
    }
    smokeGfx.fillStyle(0xff3300, 0.06);
    smokeGfx.fillCircle(60, 260, 55);
    smokeGfx.fillCircle(130, 330, 45);

    // Explosions behind hero (right side)
    const bgExplosions = this.add.graphics().setDepth(2);
    this.actObjects.push(bgExplosions);
    for (const [cx, cy, r] of [[700, 250, 35], [820, 200, 40], [750, 320, 30], [880, 280, 25]]) {
      bgExplosions.fillStyle(0xff6600, 0.08);
      bgExplosions.fillCircle(cx, cy, r);
      bgExplosions.fillStyle(0xffaa00, 0.04);
      bgExplosions.fillCircle(cx, cy, r * 0.5);
    }

    // ── Smoke particles drifting ──
    for (let i = 0; i < 12; i++) {
      const smoke = this.add.circle(
        Math.random() * W, 100 + Math.random() * 300,
        15 + Math.random() * 30, 0x222222, 0.1 + Math.random() * 0.1
      ).setDepth(3);
      this.actObjects.push(smoke);
      this.tweens.add({
        targets: smoke,
        x: smoke.x - 60 - Math.random() * 80,
        y: smoke.y - 30 - Math.random() * 40,
        alpha: 0,
        duration: 3000 + Math.random() * 3000,
        ease: 'Sine.easeOut',
      });
    }

    // ── Background explosions keep going ──
    this._act3ExpTimer = this.time.addEvent({
      delay: 700, repeat: 10,
      callback: () => {
        if (this.skipped) return;
        // Explosions behind hero (right side mostly)
        this._spawnExplosion(
          500 + Math.random() * 400,
          100 + Math.random() * 250
        );
      },
    });
    this.actObjects.push(this._act3ExpTimer);

    // ── SuperZion walks in from RIGHT through smoke ──
    const heroY = H - 80 - 80;
    const hero = this.add.sprite(W + 80, heroY, 'parade_superzion')
      .setDepth(20).setScale(2.0);
    this.actObjects.push(hero);

    // Walk bob
    const heroBob = this.tweens.add({
      targets: hero, y: heroY - 4,
      duration: 300, yoyo: true, repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Walk to center-right position
    this.tweens.add({
      targets: hero,
      x: W / 2 + 60,
      duration: 3500,
      ease: 'Sine.easeOut',
      onComplete: () => {
        heroBob.stop();
        hero.y = heroY;
      },
    });

    // ── At 4s: Hero pulls out pistol and fires at camera ──
    this.time.delayedCall(4000, () => {
      if (this.skipped) return;

      // Muzzle flash
      const muzzle = this.add.circle(hero.x - 40, heroY - 10, 15, 0xffff00, 0.9)
        .setDepth(25);
      this.actObjects.push(muzzle);
      this.tweens.add({ targets: muzzle, alpha: 0, scale: 3, duration: 150 });

      // Gunshot line
      const shotLine = this.add.graphics().setDepth(24);
      this.actObjects.push(shotLine);
      shotLine.lineStyle(3, 0xffff00, 0.8);
      shotLine.lineBetween(hero.x - 40, heroY - 10, W / 2 - 100, H / 2);
      this.tweens.add({ targets: shotLine, alpha: 0, duration: 200 });

      SoundManager.get().playGunfire(1);
      this.cameras.main.shake(150, 0.01);
    });

    // ── At 5s: "SUPERZION" TITLE with MASSIVE IMPACT ──
    this.time.delayedCall(5000, () => {
      if (this.skipped) return;

      // WHITE FLASH — full screen
      const flash = this.add.rectangle(W / 2, H / 2, W, H, 0xffffff, 0.9).setDepth(30);
      this.actObjects.push(flash);
      this.tweens.add({ targets: flash, alpha: 0, duration: 600 });

      // SCREEN SHAKE — heavy
      this.cameras.main.shake(500, 0.03);
      SoundManager.get().playExplosion();

      // Giant golden semi-transparent Maguen David (Star of David)
      const starGfx = this.add.graphics().setDepth(19);
      this.actObjects.push(starGfx);
      const cx = W / 2, cy = H / 2 - 20;
      const r = 110;
      starGfx.fillStyle(0xFFD700, 0.25);
      // Upward triangle
      starGfx.fillTriangle(cx, cy - r, cx - r * 0.866, cy + r * 0.5, cx + r * 0.866, cy + r * 0.5);
      // Downward triangle
      starGfx.fillTriangle(cx, cy + r, cx - r * 0.866, cy - r * 0.5, cx + r * 0.866, cy - r * 0.5);
      starGfx.setAlpha(0);
      this.tweens.add({ targets: starGfx, alpha: 1, duration: 600 });

      // "SUPERZION" title — wide thick arcade-style font, slams in with impact
      const title = this.add.text(W / 2, H / 2 - 40, 'S U P E R Z I O N', {
        fontFamily: '"Impact", "Arial Black", "Trebuchet MS", sans-serif',
        fontSize: '72px', color: '#FFD700',
        shadow: { offsetX: 0, offsetY: 0, color: '#FFD700', blur: 40, fill: true },
      }).setOrigin(0.5).setDepth(50).setAlpha(0).setScale(3);
      this.actObjects.push(title);

      // Impact zoom: large -> normal
      this.tweens.add({
        targets: title,
        alpha: 1, scaleX: 1, scaleY: 1,
        duration: 300,
        ease: 'Back.easeOut',
      });
      // Subtle breathing pulse
      this.tweens.add({
        targets: title, scaleX: 1.04, scaleY: 1.04,
        duration: 600, yoyo: true, repeat: -1,
        ease: 'Sine.easeInOut', delay: 400,
      });
    });

    // ── At 6.5s: Subtitle ──
    this.time.delayedCall(6500, () => {
      if (this.skipped) return;
      const sub = this.add.text(W / 2, H / 2 + 30, 'ONE SOLDIER. SIX MISSIONS. ZERO MERCY.', {
        fontFamily: '"Impact", "Arial Black", "Trebuchet MS", sans-serif',
        fontSize: '24px', color: '#ffffff',
        shadow: { offsetX: 0, offsetY: 0, color: '#ffffff', blur: 10, fill: true },
      }).setOrigin(0.5).setDepth(50).setAlpha(0);
      this.actObjects.push(sub);
      this.tweens.add({ targets: sub, alpha: 1, duration: 500 });
    });

    // ── At 7s: Secondary screen shake + explosion sound (drop sync) ──
    this.time.delayedCall(7000, () => {
      if (this.skipped) return;
      this.cameras.main.shake(200, 0.015);
      SoundManager.get().playExplosion();
    });

    // ── At 8s: Final gold flash on hero ──
    this.time.delayedCall(8000, () => {
      if (this.skipped) return;
      const goldFlash = this.add.circle(hero.x, heroY + 20, 50, 0xffd700, 0)
        .setDepth(28);
      this.actObjects.push(goldFlash);
      this.tweens.add({
        targets: goldFlash, alpha: 0.6, scale: 3,
        duration: 500, yoyo: true,
      });
    });

    // ── Fade to black -> MenuScene at 25s total (9s into act 3) ──
    this.time.delayedCall(8200, () => {
      if (this.skipped) return;
      this.cameras.main.fadeOut(700, 0, 0, 0);
    });
    this.time.delayedCall(9000, () => {
      if (this.skipped) return;
      if (this._introMusic) this._introMusic.stop();
      MusicManager.get().stop(0.3);
      this.scene.start('MenuScene');
    });
  }

  // ═════════════════════════════════════════════════════════════
  // VISUAL EFFECT HELPERS
  // ═════════════════════════════════════════════════════════════

  /** Helper to call IntroMusic SFX functions with MusicManager audio context */
  _playIntroSFX(fn, ...args) {
    const mm = MusicManager.get();
    if (mm.ctx && mm.musicGain) {
      fn(mm.ctx, mm.musicGain, mm.ctx.currentTime, ...args);
    }
  }

  /** Boss appears with a flash, real parade sprite, and per-boss attack animation */
  _bossFlashEntry(x, y, spriteKey, label, attackFn) {
    // Flash circle
    const flash = this.add.circle(x, y, 10, 0xffffff, 0.8).setDepth(40);
    this.actObjects.push(flash);
    this.tweens.add({
      targets: flash, alpha: 0, scale: 8,
      duration: 300, ease: 'Cubic.easeOut',
    });

    // Real boss sprite instead of colored rectangle
    const boss = this.add.sprite(x, y - 20, spriteKey).setDepth(15).setScale(0.7).setAlpha(0);
    this.actObjects.push(boss);
    this.tweens.add({ targets: boss, alpha: 1, duration: 400 });

    // Color aura pulse (red, since we have real sprites now)
    const aura = this.add.circle(x, y - 20, 40, 0xff4444, 0).setDepth(14);
    this.actObjects.push(aura);
    this.tweens.add({
      targets: aura, alpha: 0.15, scale: 2,
      duration: 400, yoyo: true, repeat: 2,
    });

    // Per-boss "super attack" animation
    if (attackFn) attackFn.call(this, boss, x, y);

    // Label
    const txt = this.add.text(x, y + 50, label, {
      fontFamily: 'monospace', fontSize: '14px', color: '#ff4444',
      shadow: { offsetX: 0, offsetY: 0, color: '#ff0000', blur: 10, fill: true },
    }).setOrigin(0.5).setDepth(55).setAlpha(0);
    this.actObjects.push(txt);
    this.tweens.add({ targets: txt, alpha: 1, duration: 300 });
    this.tweens.add({ targets: txt, alpha: 0, duration: 300, delay: 1200 });
  }

  /** Foam Beard attack — suitcase bomb thrown forward with explosion */
  _attackFoamBeard(boss, x, y) {
    // Suitcase projectile
    const suitcase = this.add.graphics().setDepth(16);
    this.actObjects.push(suitcase);
    suitcase.fillStyle(0x664422, 1);
    suitcase.fillRect(-6, -4, 12, 8);
    suitcase.fillStyle(0x885533, 1);
    suitcase.fillRect(-4, -5, 8, 1); // handle
    suitcase.setPosition(x, y - 20);

    // Boss scale pulse during throw
    this.tweens.add({
      targets: boss, scaleX: 0.8, scaleY: 0.8,
      duration: 200, yoyo: true,
    });

    // Throw arc: forward and upward, then down
    this.tweens.add({
      targets: suitcase,
      x: x + 120,
      duration: 800,
      ease: 'Linear',
    });
    this.tweens.add({
      targets: suitcase,
      y: { value: y - 60, duration: 400, ease: 'Sine.easeOut', yoyo: true },
      duration: 800,
      onComplete: () => {
        if (suitcase && suitcase.destroy) suitcase.destroy();
        // Explosion at landing point
        const boom = this.add.circle(x + 120, y + 20, 8, 0xff6600, 0.8).setDepth(17);
        this.actObjects.push(boom);
        this.tweens.add({
          targets: boom, alpha: 0, scale: 4,
          duration: 400, ease: 'Cubic.easeOut',
        });
      },
    });
  }

  /** Turbo Turban attack — pointing finger energy beam */
  _attackTurboTurban(boss, x, y) {
    // Boss leans forward
    this.tweens.add({
      targets: boss, x: x + 5,
      duration: 300,
    });

    // Energy beam fires after lean
    this.time.delayedCall(300, () => {
      if (this.skipped) return;

      const beam = this.add.graphics().setDepth(17);
      this.actObjects.push(beam);
      beam.fillStyle(0x22ff44, 0.8);
      beam.fillRect(x + 30, y - 22, 170, 2);
      beam.fillStyle(0x44ff66, 0.4);
      beam.fillRect(x + 30, y - 24, 170, 6);

      this.tweens.add({
        targets: beam, alpha: 0, scaleY: 3,
        duration: 600, ease: 'Cubic.easeOut',
      });

      // Beam particles
      for (let i = 0; i < 4; i++) {
        const particle = this.add.circle(
          x + 50 + i * 40, y - 21,
          3, 0x22ff44, 0.7
        ).setDepth(18);
        this.actObjects.push(particle);
        this.tweens.add({
          targets: particle,
          alpha: 0, scale: 2,
          y: y - 21 + (Math.random() - 0.5) * 20,
          duration: 400 + i * 100,
          ease: 'Cubic.easeOut',
        });
      }
    });
  }

  /** The Warden attack — raised fist slam with shockwave */
  _attackWarden(boss, x, y) {
    // Boss rises up
    this.tweens.add({
      targets: boss, y: y - 35,
      duration: 400, ease: 'Quad.easeOut',
      onComplete: () => {
        // Slam down
        this.tweens.add({
          targets: boss, y: y - 15,
          duration: 200, ease: 'Bounce.easeOut',
          onComplete: () => {
            // Shockwave ring at slam point
            const shockwave = this.add.circle(x, y + 30, 15, 0xcccccc, 0.6).setDepth(17);
            this.actObjects.push(shockwave);
            this.tweens.add({
              targets: shockwave,
              alpha: 0, scale: 4,
              duration: 500, ease: 'Cubic.easeOut',
            });

            // Second smaller ring
            const ring2 = this.add.circle(x, y + 30, 10, 0xffffff, 0.4).setDepth(17);
            this.actObjects.push(ring2);
            this.tweens.add({
              targets: ring2,
              alpha: 0, scale: 3,
              duration: 400, delay: 100, ease: 'Cubic.easeOut',
            });

            // Small camera shake at slam
            this.cameras.main.shake(100, 0.008);
          },
        });
      },
    });
  }

  /** Supreme Turban attack — staff crescent glow + dark energy rings */
  _attackSupremeTurban(boss, x, y) {
    // Boss powers up with scale pulse
    this.tweens.add({
      targets: boss,
      scaleX: 0.85, scaleY: 0.85,
      duration: 500, yoyo: true,
      ease: 'Sine.easeInOut',
    });

    // First dark energy ring after power-up
    this.time.delayedCall(400, () => {
      if (this.skipped) return;

      const ring1 = this.add.circle(x, y - 40, 15, 0x6600aa, 0).setDepth(17);
      this.actObjects.push(ring1);
      this.tweens.add({
        targets: ring1,
        alpha: 0.5, scale: 3,
        duration: 800, ease: 'Cubic.easeOut',
      });
      this.tweens.add({
        targets: ring1,
        alpha: 0,
        duration: 400, delay: 800,
      });
    });

    // Second layered ring, slightly delayed
    this.time.delayedCall(600, () => {
      if (this.skipped) return;

      const ring2 = this.add.circle(x, y - 40, 20, 0x220044, 0).setDepth(16);
      this.actObjects.push(ring2);
      this.tweens.add({
        targets: ring2,
        alpha: 0.4, scale: 3.5,
        duration: 900, ease: 'Cubic.easeOut',
      });
      this.tweens.add({
        targets: ring2,
        alpha: 0,
        duration: 400, delay: 900,
      });
    });
  }

  /** Spawn a missile flying across the screen */
  _spawnMissile() {
    this._missileCount = (this._missileCount || 0) + 1;
    if (this._missileCount % 3 === 1) this._playIntroSFX(playMissileWhoosh);

    const fromLeft = Math.random() > 0.5;
    const startX = fromLeft ? -20 : W + 20;
    const endX = fromLeft ? W + 20 : -20;
    const y = 60 + Math.random() * (H - 180);
    const angle = fromLeft ? 0 : 180;

    // Missile body
    const missile = this.add.graphics().setDepth(12);
    this.actObjects.push(missile);
    missile.fillStyle(0x888888, 1);
    missile.fillRect(0, -2, 18, 4);
    // Nose cone
    missile.fillStyle(0xcc2200, 1);
    missile.beginPath();
    missile.moveTo(18, -3);
    missile.lineTo(24, 0);
    missile.lineTo(18, 3);
    missile.closePath();
    missile.fill();
    // Tail fins
    missile.fillStyle(0x666666, 1);
    missile.fillTriangle(-2, -5, 4, -2, -2, -2);
    missile.fillTriangle(-2, 5, 4, 2, -2, 2);
    // Exhaust flame
    missile.fillStyle(0xff6600, 0.6);
    missile.fillCircle(-6, 0, 4);
    missile.fillStyle(0xffaa00, 0.4);
    missile.fillCircle(-10, 0, 3);

    missile.setPosition(startX, y);
    missile.setAngle(angle);

    this.tweens.add({
      targets: missile,
      x: endX,
      duration: 800 + Math.random() * 600,
      ease: 'Linear',
      onComplete: () => {
        if (missile && missile.destroy) missile.destroy();
      },
    });
  }

  /** Spawn an explosion effect at position */
  _spawnExplosion(x, y) {
    const expGfx = this.add.graphics().setDepth(18).setAlpha(0.8);
    this.actObjects.push(expGfx);

    // Outer fireball
    expGfx.fillStyle(0xff4400, 0.6);
    expGfx.fillCircle(x, y, 20 + Math.random() * 15);
    // Inner bright core
    expGfx.fillStyle(0xffcc00, 0.8);
    expGfx.fillCircle(x, y, 8 + Math.random() * 6);
    // White hot center
    expGfx.fillStyle(0xffffff, 0.5);
    expGfx.fillCircle(x, y, 3);

    // Camera shake on every explosion (120ms, subtle randomized intensity)
    this.cameras.main.shake(120, 0.005 + Math.random() * 0.005);

    this.tweens.add({
      targets: expGfx,
      alpha: 0, scale: 1.8,
      duration: 400 + Math.random() * 200,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        if (expGfx && expGfx.destroy) expGfx.destroy();
      },
    });
  }

  /** Spawn a jet streaking across firing a missile */
  _spawnJetStrike(startY, endY, firesProjectile) {
    // Jet body (triangle shape)
    const jet = this.add.graphics().setDepth(15);
    this.actObjects.push(jet);
    jet.fillStyle(0x556688, 1);
    // Fuselage
    jet.fillRect(0, -3, 40, 6);
    // Wings
    jet.fillTriangle(10, -3, 25, -16, 30, -3);
    jet.fillTriangle(10, 3, 25, 16, 30, 3);
    // Tail
    jet.fillTriangle(0, -3, -5, -10, 5, -3);
    jet.fillTriangle(0, 3, -5, 10, 5, 3);
    // Cockpit
    jet.fillStyle(0x88aaff, 0.8);
    jet.fillCircle(35, 0, 3);

    // Engine trail
    const trail = this.add.graphics().setDepth(14);
    this.actObjects.push(trail);
    trail.fillStyle(0xffaa00, 0.3);
    trail.fillRect(-40, -1, 40, 2);
    trail.fillStyle(0xff6600, 0.2);
    trail.fillRect(-70, -1, 30, 2);

    jet.setPosition(-60, startY);
    trail.setPosition(-60, startY);

    // Streak across
    this.tweens.add({
      targets: [jet, trail],
      x: W + 80,
      duration: 1200,
      ease: 'Cubic.easeIn',
    });

    // Fire projectile midway
    if (firesProjectile) {
      this.time.delayedCall(400, () => {
        if (this.skipped) return;
        const projX = W * 0.35;
        this._spawnProjectile(projX, startY, projX + 200, endY + 100);
      });
    }
  }

  /** Spawn a bomber dropping bombs */
  _spawnBomber(x, y) {
    const bomber = this.add.graphics().setDepth(15);
    this.actObjects.push(bomber);
    // Larger body
    bomber.fillStyle(0x445566, 1);
    bomber.fillRect(-25, -4, 50, 8);
    bomber.fillTriangle(-25, -4, -35, -12, -15, -4);
    bomber.fillTriangle(-25, 4, -35, 12, -15, 4);
    bomber.fillStyle(0x88aaff, 0.6);
    bomber.fillCircle(20, 0, 3);

    bomber.setPosition(-60, y);

    this.tweens.add({
      targets: bomber,
      x: W + 80,
      duration: 2000,
      ease: 'Linear',
    });

    // Drop bombs at intervals
    for (let i = 0; i < 3; i++) {
      this.time.delayedCall(400 + i * 350, () => {
        if (this.skipped) return;
        const bx = x - 100 + i * 120;
        this._spawnFallingBomb(bx, y + 10);
      });
    }
  }

  /** Spawn a falling bomb that explodes on ground */
  _spawnFallingBomb(x, y) {
    const bomb = this.add.circle(x, y, 4, 0x333333).setDepth(16);
    this.actObjects.push(bomb);

    this.tweens.add({
      targets: bomb,
      y: H - 80,
      duration: 500,
      ease: 'Quad.easeIn',
      onComplete: () => {
        if (bomb && bomb.destroy) bomb.destroy();
        this._spawnExplosion(x, H - 85);
      },
    });
  }

  /** Spawn a projectile from A to B with explosion */
  _spawnProjectile(x1, y1, x2, y2) {
    const proj = this.add.circle(x1, y1, 3, 0xffaa00).setDepth(17);
    this.actObjects.push(proj);

    // Trail
    const trail = this.add.graphics().setDepth(16);
    this.actObjects.push(trail);
    trail.lineStyle(2, 0xffaa00, 0.4);
    trail.lineBetween(x1, y1, x1, y1);

    this.tweens.add({
      targets: proj,
      x: x2, y: y2,
      duration: 300,
      ease: 'Linear',
      onUpdate: () => {
        trail.clear();
        trail.lineStyle(2, 0xffaa00, 0.3);
        trail.lineBetween(x1, y1, proj.x, proj.y);
      },
      onComplete: () => {
        this._spawnExplosion(x2, y2);
        if (proj && proj.destroy) proj.destroy();
        if (trail && trail.destroy) trail.destroy();
      },
    });
  }

  /** Iron Dome interception sequence */
  _spawnIronDomeSequence() {
    // Iron Dome launchers on ground
    const domeGfx = this.add.graphics().setDepth(10);
    this.actObjects.push(domeGfx);
    for (const dx of [300, 420]) {
      // Launcher base
      domeGfx.fillStyle(0x556644, 1);
      domeGfx.fillRect(dx - 15, H - 80, 30, 12);
      // Launcher tubes
      domeGfx.fillStyle(0x667755, 1);
      domeGfx.fillRect(dx - 8, H - 95, 5, 18);
      domeGfx.fillRect(dx + 3, H - 95, 5, 18);
    }

    // Incoming missiles from top
    for (let i = 0; i < 4; i++) {
      const mx = 200 + i * 150;
      const my = -10 - i * 20;

      // Incoming threat
      const threat = this.add.circle(mx, my, 3, 0xff2200).setDepth(16);
      this.actObjects.push(threat);

      const targetY = 100 + Math.random() * 100;
      const targetX = mx + (Math.random() - 0.5) * 100;

      this.tweens.add({
        targets: threat,
        x: targetX, y: targetY + 80,
        duration: 800 + i * 100,
        ease: 'Linear',
      });

      // Interceptor launches up
      this.time.delayedCall(200 + i * 150, () => {
        if (this.skipped) return;
        const intX = 300 + (i % 2) * 120;
        const interceptor = this.add.circle(intX, H - 90, 2, 0x44aaff).setDepth(17);
        this.actObjects.push(interceptor);

        // Trail going up
        const intTrail = this.add.graphics().setDepth(16);
        this.actObjects.push(intTrail);

        this.tweens.add({
          targets: interceptor,
          x: targetX, y: targetY,
          duration: 600,
          ease: 'Quad.easeOut',
          onUpdate: () => {
            intTrail.clear();
            intTrail.lineStyle(1.5, 0x44aaff, 0.5);
            intTrail.lineBetween(intX, H - 90, interceptor.x, interceptor.y);
          },
          onComplete: () => {
            // Sky explosion — interception
            this._spawnExplosion(targetX, targetY);
            if (interceptor && interceptor.destroy) interceptor.destroy();
            if (intTrail && intTrail.destroy) intTrail.destroy();
            if (threat && threat.destroy) threat.destroy();
          },
        });
      });
    }
  }

  /** Spawn a tank that fires */
  _spawnTankFiring(x, y) {
    const tank = this.add.graphics().setDepth(10);
    this.actObjects.push(tank);
    // Hull
    tank.fillStyle(0x556633, 1);
    tank.fillRect(x - 25, y, 50, 16);
    // Turret
    tank.fillStyle(0x667744, 1);
    tank.fillRect(x - 10, y - 8, 22, 12);
    // Barrel
    tank.fillStyle(0x444433, 1);
    tank.fillRect(x + 12, y - 5, 28, 4);
    // Tracks
    tank.fillStyle(0x333322, 1);
    tank.fillRect(x - 28, y + 14, 56, 5);

    // Muzzle flash
    this.time.delayedCall(300, () => {
      if (this.skipped) return;
      const muzzle = this.add.circle(x + 42, y - 3, 12, 0xffff00, 0.9).setDepth(15);
      this.actObjects.push(muzzle);
      this.tweens.add({ targets: muzzle, alpha: 0, scale: 2.5, duration: 150 });

      // Projectile
      this._spawnProjectile(x + 42, y - 3, x + 300, y - 30);
    });
  }

  // ═════════════════════════════════════════════════════════════
  // UPDATE — Skip + Mute
  // ═════════════════════════════════════════════════════════════

  update() {
    this._handleMuteToggle();
    if (!this.skipped && Phaser.Input.Keyboard.JustDown(this.enterKey)) {
      this.skipped = true;
      if (this._introMusic) this._introMusic.stop();
      MusicManager.get().stop(0.3);
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.time.delayedCall(350, () => this.scene.start('MenuScene'));
    }
  }
}
