// ═══════════════════════════════════════════════════════════════
// CreditsScene — Star Wars scrolling credits after BossScene
// ═══════════════════════════════════════════════════════════════

import BaseCinematicScene, { W, H } from './BaseCinematicScene.js';
import SoundManager from '../systems/SoundManager.js';
import MusicManager from '../systems/MusicManager.js';
import { createCliffBackground } from '../utils/CinematicTextures.js';

export default class CreditsScene extends BaseCinematicScene {
  constructor() { super('CreditsScene'); }

  create() {
    this.cameras.main.setBackgroundColor('#000000');
    MusicManager.get().playMenuMusic();
    this.done = false;

    // Background — cliff at low alpha
    createCliffBackground(this);
    this.add.image(W / 2, H / 2, 'cin_cliff_bg').setDepth(0).setAlpha(0.25);

    // Dark gradient overlay
    const overlay = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.5).setDepth(1);

    // Credits content
    const creditsLines = [
      '',
      '',
      'SUPERZION',
      '',
      '"A game about one soldier\'s impossible mission"',
      '',
      '',
      '— — — — —',
      '',
      '',
      'Op. Tehran — Infiltration',
      '',
      'Op. Signal Storm — Intelligence',
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

    // Draw Star of David as Graphics, positioned in the credits flow
    const starY = H + 40 + creditsLines.length * 14; // approximate
    const starGfx = this.add.graphics().setDepth(11);
    this._drawStarOfDavid(starGfx, W / 2, starY);

    // Make star scroll with text by grouping Y offset
    const scrollContainer = this.add.container(0, 0, [creditsText, starGfx]).setDepth(10);

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

    // Set completion flag
    try { localStorage.setItem('superzion_completed', 'true'); } catch (e) { /* ignore */ }

    // Skip hint
    this.add.text(W - 16, H - 14, 'ENTER TO SKIP', {
      fontFamily: 'monospace', fontSize: '10px', color: '#444444',
    }).setOrigin(1, 1).setDepth(100);

    // Input
    this.enterKey = this.input.keyboard.addKey('ENTER');
    this.mKey = this.input.keyboard.addKey('M');
  }

  _drawStarOfDavid(gfx, cx, cy) {
    const r = 40;
    gfx.lineStyle(2, 0xdaa520, 0.8);

    // Upward triangle
    gfx.beginPath();
    gfx.moveTo(cx, cy - r);
    gfx.lineTo(cx + r * Math.cos(Math.PI / 6), cy + r * Math.sin(Math.PI / 6));
    gfx.lineTo(cx - r * Math.cos(Math.PI / 6), cy + r * Math.sin(Math.PI / 6));
    gfx.closePath();
    gfx.strokePath();

    // Downward triangle
    gfx.beginPath();
    gfx.moveTo(cx, cy + r);
    gfx.lineTo(cx + r * Math.cos(Math.PI / 6), cy - r * Math.sin(Math.PI / 6));
    gfx.lineTo(cx - r * Math.cos(Math.PI / 6), cy - r * Math.sin(Math.PI / 6));
    gfx.closePath();
    gfx.strokePath();

    // Glow effect
    gfx.lineStyle(4, 0xdaa520, 0.15);
    gfx.beginPath();
    gfx.moveTo(cx, cy - r);
    gfx.lineTo(cx + r * Math.cos(Math.PI / 6), cy + r * Math.sin(Math.PI / 6));
    gfx.lineTo(cx - r * Math.cos(Math.PI / 6), cy + r * Math.sin(Math.PI / 6));
    gfx.closePath();
    gfx.strokePath();
    gfx.beginPath();
    gfx.moveTo(cx, cy + r);
    gfx.lineTo(cx + r * Math.cos(Math.PI / 6), cy - r * Math.sin(Math.PI / 6));
    gfx.lineTo(cx - r * Math.cos(Math.PI / 6), cy - r * Math.sin(Math.PI / 6));
    gfx.closePath();
    gfx.strokePath();
  }

  _finish() {
    this.done = true;
    MusicManager.get().stop(0.5);
    this.cameras.main.fadeOut(500, 0, 0, 0);
    this.time.delayedCall(600, () => this.scene.start('MenuScene'));
  }

  update() {
    this._handleMuteToggle();
    if (!this.done && Phaser.Input.Keyboard.JustDown(this.enterKey)) {
      this._finish();
    }
  }
}
