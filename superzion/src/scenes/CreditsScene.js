// ═══════════════════════════════════════════════════════════════
// CreditsScene — Star Wars scrolling credits after BossScene
// ═══════════════════════════════════════════════════════════════

import Phaser from 'phaser';
import BaseCinematicScene, { W, H } from './BaseCinematicScene.js';
import SoundManager from '../systems/SoundManager.js';
import MusicManager from '../systems/MusicManager.js';
import InputManager from '../systems/InputManager.js';
import { addStarOfDavid } from '../utils/StarOfDavid.js';

export default class CreditsScene extends BaseCinematicScene {
  constructor() { super('CreditsScene'); }

  create() {
    this.cameras.main.setBackgroundColor('#000000');
    this.inputManager = new InputManager(this, { preset: 'cinematic' });
    MusicManager.get().playMenuMusic();
    this.done = false;

    // AI sunrise panorama over Tel Aviv (Am Yisrael Chai) — fills the frame.
    if (this.textures.exists('credits_sky')) {
      const sky = this.add.image(W / 2, H / 2, 'credits_sky').setDepth(0);
      sky.setDisplaySize(W, H);
      // Very slow zoom for a living, breathing dawn
      this.tweens.add({
        targets: sky, scaleX: sky.scaleX * 1.06, scaleY: sky.scaleY * 1.06,
        duration: 30000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
      });
    } else {
      // Fallback: simple warm gradient if the PNG is missing
      const bgGfx = this.add.graphics().setDepth(0);
      for (let y = 0; y < H; y++) {
        const t = y / H;
        bgGfx.fillStyle(Phaser.Display.Color.GetColor(18 + t * 140 | 0, 8 + t * 70 | 0, 40 - t * 30 | 0), 1);
        bgGfx.fillRect(0, y, W, 1);
      }
    }

    // AI cloud parallax drifting across the upper sky
    if (this.textures.exists('cloud_layer')) {
      const clouds = this.add.tileSprite(W / 2, H * 0.28, W, 160, 'cloud_layer')
        .setDepth(0.5).setAlpha(0.55);
      this._cloudScroll = clouds;
    }

    // Dark overlay so credits text remains readable (kept light to show the sky)
    const overlay = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.38).setDepth(1);

    // Credits content
    const creditsLines = [
      '',
      '',
      'SUPERZION',
      '',
      '"THEY FIGHT TO CONQUER. WE FIGHT TO EXIST."',
      '',
      '',
      '— — — — —',
      '',
      '',
      'Op. Tehran — Infiltration',
      '',
      'Op. Deep Strike — Aerial Assault',
      '',
      'Op. Underground — Reconnaissance',
      '',
      'Op. Mountain Breaker — Nuclear Strike',
      '',
      'Op. Last Stand — Final Battle',
      '',
      '',
      '— — — — —',
      '',
      '',
      'CREATED WITH',
      'CLAUDE CODE + ANTIGRAVITY',
      '',
      '',
      'DESIGNED BY',
      'SEBASTIAN',
      '',
      '',
      '',
      '',  // Space for Star of David
      '',
      '',
      '',
      '',
      '',
      'THANK YOU FOR PLAYING',
      '',
      '',
    ];

    const creditsText = this.add.text(W / 2, H + 40, creditsLines.join('\n'), {
      fontFamily: 'monospace', fontSize: '18px', color: '#cccccc',
      align: 'center', lineSpacing: 10,
    }).setOrigin(0.5, 0).setDepth(10);

    // Star of David in the credits flow — ornate AI emblem (falls back to the
    // procedural drawing inside addStarOfDavid). R=44 matches the prior look.
    const starY = H + 40 + creditsLines.length * 14; // approximate
    const starObj = addStarOfDavid(this, W / 2, starY, 44, {
      lineWidth: 2.5, lineAlpha: 0.85, fillAlpha: 0.10, haloAlpha: 0.16,
    });
    starObj.setDepth(11);

    // Make star scroll with text by grouping Y offset
    const scrollContainer = this.add.container(0, 0, [creditsText, starObj]).setDepth(10);

    // Scroll upward over ~45s
    const totalHeight = creditsText.height + 200;
    const scrollDuration = 45000;

    this.tweens.add({
      targets: scrollContainer,
      y: -(totalHeight),
      duration: scrollDuration,
      ease: 'Linear',
      onComplete: () => {
        if (!this.done) this._finish();
      },
    });

    // Skip hint
    this.add.text(W - 16, H - 14, 'ENTER TO SKIP', {
      fontFamily: 'monospace', fontSize: '10px', color: '#444444',
    }).setOrigin(1, 1).setDepth(100);

    // Input
    this.enterKey = this.input.keyboard.addKey('ENTER');
    this.mKey = this.input.keyboard.addKey('M');
  }

  _finish() {
    this.done = true;
    // Flag the game as completed only when the credits actually finish (or are
    // skipped to the end), not merely on entering the scene.
    try { localStorage.setItem('superzion_completed', 'true'); } catch (e) { /* ignore */ }
    MusicManager.get().stop(0.5);
    this.cameras.main.fadeOut(500, 0, 0, 0);
    this.time.delayedCall(600, () => this.scene.start('MenuScene'));
  }

  update() {
    if (this._cloudScroll) this._cloudScroll.tilePositionX += 0.15;
    if (this.inputManager) this.inputManager.update();
    this._handleMuteToggle();
    const skip = Phaser.Input.Keyboard.JustDown(this.enterKey) ||
      (this.inputManager && this.inputManager.justDown('primary'));
    if (!this.done && skip) {
      this._finish();
    }
  }
}
