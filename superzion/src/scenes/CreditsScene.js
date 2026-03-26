// ═══════════════════════════════════════════════════════════════
// CreditsScene — Star Wars scrolling credits after BossScene
// ═══════════════════════════════════════════════════════════════

import Phaser from 'phaser';
import BaseCinematicScene, { W, H } from './BaseCinematicScene.js';
import SoundManager from '../systems/SoundManager.js';
import MusicManager from '../systems/MusicManager.js';

export default class CreditsScene extends BaseCinematicScene {
  constructor() { super('CreditsScene'); }

  create() {
    this.cameras.main.setBackgroundColor('#000000');
    MusicManager.get().playMenuMusic();
    this.done = false;

    // Animated sunset background (procedural — no texture dependency)
    const bgGfx = this.add.graphics().setDepth(0);
    // Sky gradient: dark purple at top -> orange-gold at horizon (H*0.6)
    for (let y = 0; y < H * 0.6; y++) {
      const t = y / (H * 0.6);
      const r = 18 + t * 140 | 0;   // dark purple -> warm orange
      const g = 8 + t * 70 | 0;     // dark -> gold
      const b = 40 - t * 30 | 0;    // purple tint fading
      bgGfx.fillStyle(Phaser.Display.Color.GetColor(r, g, b), 1);
      bgGfx.fillRect(0, y, W, 1);
    }
    // Sea gradient: orange-gold at horizon -> dark deep blue below
    for (let y = Math.floor(H * 0.6); y < H; y++) {
      const t = (y - H * 0.6) / (H * 0.4);
      const r = 158 - t * 140 | 0;
      const g = 78 - t * 70 | 0;
      const b = 10 + t * 25 | 0;
      bgGfx.fillStyle(Phaser.Display.Color.GetColor(Math.max(r, 0), Math.max(g, 0), b), 1);
      bgGfx.fillRect(0, y, W, 1);
    }

    // Sun glow circle — golden, pulsing slowly
    const sunGlow = this.add.circle(W * 0.5, H * 0.6, 80, 0xffcc44, 0.15).setDepth(0);
    this.tweens.add({
      targets: sunGlow,
      alpha: { from: 0.15, to: 0.08 },
      scaleX: { from: 1, to: 1.08 },
      scaleY: { from: 1, to: 1.08 },
      duration: 3000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });

    // Subtle cloud ellipses with slow drift tweens
    const cloudData = [
      { x: W * 0.25, y: H * 0.3, w: 120, h: 20 },
      { x: W * 0.7, y: H * 0.22, w: 100, h: 15 },
      { x: W * 0.5, y: H * 0.42, w: 140, h: 18 },
    ];
    for (const cd of cloudData) {
      const cloud = this.add.ellipse(cd.x, cd.y, cd.w, cd.h, 0xffddaa, 0.1).setDepth(0);
      this.tweens.add({
        targets: cloud, x: cd.x + 40, duration: 20000 + Math.random() * 10000,
        yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
      });
    }

    // Dark overlay so credits text remains readable
    const overlay = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.5).setDepth(1);

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
