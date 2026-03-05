// ═══════════════════════════════════════════════════════════════
// BeirutRadarScene — Level 2: Operation Signal Storm
// Split-screen radar/timing mini-game
// Left: operative at desk | Right: Beirut map with signals
// ═══════════════════════════════════════════════════════════════

import Phaser from 'phaser';
import SoundManager from '../systems/SoundManager.js';
import MusicManager from '../systems/MusicManager.js';
import DifficultyManager from '../systems/DifficultyManager.js';
import { STREET_PATHS, RANGE_CIRCLE, createBeirutMap, createMonitorFrame, createOperativeAtDesk } from '../utils/RadarTextures.js';

const W = 960;
const H = 540;
const SPLIT_X = 288; // left 30% for operative, right 70% for radar
const NUM_SIGNALS = 18;
const GAME_TIME = 60; // seconds

export default class BeirutRadarScene extends Phaser.Scene {
  constructor() { super('BeirutRadarScene'); }

  create() {
    this.cameras.main.setBackgroundColor('#000000');
    MusicManager.get().playLevel2Music();

    // Generate textures
    createBeirutMap(this);
    createMonitorFrame(this);
    createOperativeAtDesk(this);

    // State
    const dm = DifficultyManager.get();
    this.gamePhase = 'playing'; // playing | intercepted | results
    this.timeRemaining = Math.round(GAME_TIME * dm.timerMult());
    this.interceptUsed = false;
    this.signals = [];
    this.score = 0;
    this.interceptedCount = 0;
    this.missedMarked = 0;
    this.totalMarked = 0;

    this._buildLayout();
    this._spawnSignals();
    this._setupInput();

    // Start radar ambient
    this.ambientRef = SoundManager.get().playRadarAmbient();

    // Mute key
    this.mKey = this.input.keyboard.addKey('M');
    this.pKey = this.input.keyboard.addKey('P');
    this.escKey = this.input.keyboard.addKey('ESC');

    // Pause state
    this.isPaused = false;
    this.pauseObjects = [];
  }

  // ── BUILD LAYOUT ──────────────────────────────────────────────
  _buildLayout() {
    // ── Left panel: dark room with operative ──
    const leftBg = this.add.rectangle(SPLIT_X / 2, H / 2, SPLIT_X, H, 0x0a0a0e);
    leftBg.setDepth(0);

    // Operative at desk
    this.add.image(SPLIT_X / 2, H / 2 + 40, 'operative_desk').setDepth(1);

    // Faint monitor glow on wall
    const glow = this.add.graphics();
    glow.setDepth(0);
    glow.fillStyle(0x00aa30, 0.04);
    glow.fillCircle(SPLIT_X / 2 + 40, H / 2 - 30, 100);

    // Separator line
    const sep = this.add.rectangle(SPLIT_X, H / 2, 2, H, 0x333333);
    sep.setDepth(10);

    // ── Right panel: Beirut radar ──
    // Beirut map
    this.add.image(W / 2, H / 2, 'beirut_map').setDepth(1);

    // Monitor frame overlay
    this.add.image(W / 2, H / 2, 'monitor_frame').setDepth(8);

    // Radar sweep line (rotating)
    this.sweepGfx = this.add.graphics();
    this.sweepGfx.setDepth(3);
    this.sweepAngle = 0;

    // Range circle highlight (drawn live)
    this.rangeGfx = this.add.graphics();
    this.rangeGfx.setDepth(2);
    this._drawRangeCircle(0.15);

    // ── HUD elements ──
    // Timer
    this.timerText = this.add.text(W - 30, 20, '60', {
      fontFamily: 'monospace', fontSize: '28px', color: '#00ff00',
      shadow: { offsetX: 0, offsetY: 0, color: '#00ff00', blur: 8, fill: true },
    });
    this.timerText.setOrigin(1, 0); this.timerText.setDepth(20);

    this.timerLabel = this.add.text(W - 80, 22, 'TIME:', {
      fontFamily: 'monospace', fontSize: '12px', color: '#008800',
    });
    this.timerLabel.setOrigin(1, 0); this.timerLabel.setDepth(20);

    // Score
    this.scoreText = this.add.text(SPLIT_X + 15, 20, 'SCORE: 0', {
      fontFamily: 'monospace', fontSize: '14px', color: '#00e5ff',
    });
    this.scoreText.setDepth(20);

    // Marked count
    this.markedText = this.add.text(SPLIT_X + 15, 42, 'MARKED: 0 / 18', {
      fontFamily: 'monospace', fontSize: '11px', color: '#888888',
    });
    this.markedText.setDepth(20);

    // Instructions
    this.instrText = this.add.text(W / 2 + SPLIT_X / 2, H - 22, 'CLICK signals to mark | SPACE to intercept', {
      fontFamily: 'monospace', fontSize: '10px', color: '#777777',
    });
    this.instrText.setOrigin(0.5, 1); this.instrText.setDepth(20);

    // Border flash overlay (hidden initially)
    this.borderFlash = this.add.rectangle(W / 2, H / 2, W, H, 0xff0000, 0);
    this.borderFlash.setDepth(25);
    this.borderFlash.setStrokeStyle(4, 0xff0000, 0);
  }

  _drawRangeCircle(alpha) {
    this.rangeGfx.clear();
    this.rangeGfx.lineStyle(1.5, 0x00ff66, alpha);
    this.rangeGfx.strokeCircle(RANGE_CIRCLE.centerX, RANGE_CIRCLE.centerY, RANGE_CIRCLE.radius);
  }

  // ── SPAWN SIGNALS ─────────────────────────────────────────────
  _spawnSignals() {
    for (let i = 0; i < NUM_SIGNALS; i++) {
      const pathIndex = i % STREET_PATHS.length;
      const path = STREET_PATHS[pathIndex];
      const t = Math.random();
      const pos = this._lerpPath(path.pts, t);
      const speed = (0.04 + Math.random() * 0.06) * DifficultyManager.get().enemySpeedMult(); // units per second along path [0..1]
      const direction = Math.random() < 0.5 ? 1 : -1;

      const sprite = this.add.circle(pos.x, pos.y, 5, 0x00ff00, 0.7);
      sprite.setDepth(5);
      // Inner dot
      const inner = this.add.circle(pos.x, pos.y, 2, 0x00ff88, 0.9);
      inner.setDepth(6);

      this.signals.push({
        id: i,
        pathIndex,
        t,
        speed,
        direction,
        x: pos.x,
        y: pos.y,
        marked: false,
        sprite,
        inner,
        alive: true,
      });
    }
  }

  _lerpPath(pts, t) {
    const clampedT = Math.max(0, Math.min(1, t));
    const n = pts.length - 1;
    const seg = Math.min(Math.floor(clampedT * n), n - 1);
    const lt = (clampedT * n) - seg;
    const a = pts[seg], b = pts[Math.min(seg + 1, n)];
    return { x: a.x + (b.x - a.x) * lt, y: a.y + (b.y - a.y) * lt };
  }

  // ── INPUT ─────────────────────────────────────────────────────
  _setupInput() {
    this.spaceKey = this.input.keyboard.addKey('SPACE');
    this.enterKey = this.input.keyboard.addKey('ENTER');

    // Click to mark signals
    this.input.on('pointerdown', (pointer) => {
      if (this.gamePhase !== 'playing') return;

      // Find closest signal within 20px
      let closest = null;
      let closestDist = 20;
      for (const sig of this.signals) {
        if (!sig.alive) continue;
        const dx = pointer.x - sig.x;
        const dy = pointer.y - sig.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < closestDist) {
          closestDist = dist;
          closest = sig;
        }
      }

      if (closest && !closest.marked) {
        closest.marked = true;
        closest.sprite.setFillStyle(0xffff00, 0.9);
        closest.inner.setFillStyle(0xffaa00, 1);
        this.totalMarked++;
        this._updateMarkedText();
        SoundManager.get().playRadarMark();

        // Pulse animation
        this.tweens.add({
          targets: closest.sprite,
          scaleX: 1.8, scaleY: 1.8,
          duration: 150,
          yoyo: true,
          ease: 'Quad.easeOut',
        });
      } else if (closest && closest.marked) {
        // Unmark
        closest.marked = false;
        closest.sprite.setFillStyle(0x00ff00, 0.7);
        closest.inner.setFillStyle(0x00ff88, 0.9);
        this.totalMarked--;
        this._updateMarkedText();
        SoundManager.get().playRadarBlip();
      }
    });
  }

  _updateMarkedText() {
    this.markedText.setText(`MARKED: ${this.totalMarked} / ${NUM_SIGNALS}`);
  }

  // ── UPDATE LOOP ───────────────────────────────────────────────
  // ── PAUSE ────────────────────────────────────────────────────
  _togglePause() {
    this.isPaused = !this.isPaused;
    if (this.isPaused) {
      const overlay = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.6).setDepth(60);
      this.pauseObjects.push(overlay);
      const title = this.add.text(W / 2, H / 2 - 30, 'PAUSED', {
        fontFamily: 'monospace', fontSize: '36px', color: '#ffffff',
      }).setOrigin(0.5).setDepth(61);
      this.pauseObjects.push(title);
      const opts = this.add.text(W / 2, H / 2 + 20, 'ESC — Resume  |  M — Mute', {
        fontFamily: 'monospace', fontSize: '14px', color: '#aaaaaa',
      }).setOrigin(0.5).setDepth(61);
      this.pauseObjects.push(opts);
    } else {
      for (const obj of this.pauseObjects) obj.destroy();
      this.pauseObjects = [];
    }
  }

  update(time, delta) {
    // Mute toggle
    if (Phaser.Input.Keyboard.JustDown(this.mKey)) {
      const muted = SoundManager.get().toggleMute();
      MusicManager.get().setMuted(muted);
    }

    // ESC pause
    if (Phaser.Input.Keyboard.JustDown(this.escKey) && this.gamePhase !== 'results') {
      this._togglePause();
      return;
    }
    if (this.isPaused) return;

    // P skip to results
    if (Phaser.Input.Keyboard.JustDown(this.pKey) && this.gamePhase === 'playing') {
      this.interceptedCount = 12;
      this.score = 1200;
      this.missedMarked = 0;
      this._cleanup();
      this._showResults();
      return;
    }

    if (this.gamePhase === 'playing') {
      this._updatePlaying(delta);
    } else if (this.gamePhase === 'results') {
      if (Phaser.Input.Keyboard.JustDown(this.enterKey) || Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
        this._cleanup();
        this.scene.start('DeepStrikeIntroCinematicScene');
      }
    }
  }

  _updatePlaying(delta) {
    const dt = delta / 1000;

    // Decrement timer
    this.timeRemaining -= dt;
    if (this.timeRemaining <= 0) {
      this.timeRemaining = 0;
      this._endGame(false);
      return;
    }

    // Update timer display
    const secs = Math.ceil(this.timeRemaining);
    this.timerText.setText(String(secs));

    // Timer urgency at ≤10s
    if (secs <= 10) {
      this.timerText.setColor('#ff0000');
      this.timerText.setShadow(0, 0, '#ff0000', 8, true);
      // Tick sounds every second
      if (Math.ceil(this.timeRemaining + dt) > secs) {
        SoundManager.get().playCountdownTick();
      }
      // Border flash
      const flashAlpha = (Math.sin(this.timeRemaining * 8) * 0.5 + 0.5) * 0.15;
      this.borderFlash.setAlpha(1);
      this.borderFlash.setStrokeStyle(4, 0xff0000, flashAlpha);
    }

    // Move signals along paths
    for (const sig of this.signals) {
      if (!sig.alive) continue;

      sig.t += sig.speed * dt * sig.direction;
      // Bounce at ends
      if (sig.t > 1) { sig.t = 1; sig.direction = -1; }
      if (sig.t < 0) { sig.t = 0; sig.direction = 1; }

      const path = STREET_PATHS[sig.pathIndex];
      const pos = this._lerpPath(path.pts, sig.t);
      sig.x = pos.x;
      sig.y = pos.y;
      sig.sprite.setPosition(pos.x, pos.y);
      sig.inner.setPosition(pos.x, pos.y);
    }

    // Radar sweep rotation
    this.sweepAngle += dt * 1.2;
    this.sweepGfx.clear();
    const rc = RANGE_CIRCLE;
    const sx = rc.centerX + Math.cos(this.sweepAngle) * rc.radius;
    const sy = rc.centerY + Math.sin(this.sweepAngle) * rc.radius;
    this.sweepGfx.lineStyle(1, 0x00ff00, 0.3);
    this.sweepGfx.beginPath();
    this.sweepGfx.moveTo(rc.centerX, rc.centerY);
    this.sweepGfx.lineTo(sx, sy);
    this.sweepGfx.strokePath();

    // SPACE to intercept
    if (Phaser.Input.Keyboard.JustDown(this.spaceKey) && !this.interceptUsed) {
      this._executeIntercept();
    }
  }

  // ── EXECUTE INTERCEPT ─────────────────────────────────────────
  _executeIntercept() {
    this.interceptUsed = true;
    this.gamePhase = 'intercepted';

    SoundManager.get().playRadarIntercept();
    MusicManager.get().playLevel2Music(true);

    // Flash cyan
    const flash = this.add.rectangle(W / 2, H / 2, W, H, 0x00ffff, 0.3);
    flash.setDepth(30);
    this.tweens.add({
      targets: flash, alpha: 0, duration: 500,
      onComplete: () => flash.destroy(),
    });

    // Camera shake
    this.cameras.main.shake(400, 0.02);

    // Radio wave animation from center
    for (let i = 0; i < 3; i++) {
      const wave = this.add.circle(RANGE_CIRCLE.centerX, RANGE_CIRCLE.centerY, 5, 0x00ffff, 0);
      wave.setDepth(15);
      wave.setStrokeStyle(2, 0x00ffff, 0.6);
      this.tweens.add({
        targets: wave,
        scaleX: RANGE_CIRCLE.radius / 5,
        scaleY: RANGE_CIRCLE.radius / 5,
        alpha: 0,
        duration: 800,
        delay: i * 200,
        onComplete: () => wave.destroy(),
      });
    }

    // "INTERCEPTION ACTIVATED" text
    const interceptText = this.add.text(W / 2 + SPLIT_X / 2, H / 2, 'INTERCEPTION ACTIVATED', {
      fontFamily: 'monospace', fontSize: '24px', color: '#00ffff',
      shadow: { offsetX: 0, offsetY: 0, color: '#00ffff', blur: 16, fill: true },
    });
    interceptText.setOrigin(0.5); interceptText.setDepth(35);
    this.tweens.add({
      targets: interceptText, alpha: 0, y: H / 2 - 40,
      duration: 1500, ease: 'Quad.easeOut',
      onComplete: () => interceptText.destroy(),
    });

    // Process each signal
    let intercepted = 0;
    let missedMarked = 0;
    let score = 0;

    for (const sig of this.signals) {
      if (!sig.alive) continue;

      const dx = sig.x - RANGE_CIRCLE.centerX;
      const dy = sig.y - RANGE_CIRCLE.centerY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const inRange = dist <= RANGE_CIRCLE.radius;

      if (sig.marked && inRange) {
        // SUCCESS — green
        sig.sprite.setFillStyle(0x00ff00, 1);
        sig.inner.setFillStyle(0xffffff, 1);
        score += 100;
        intercepted++;

        // Green pulse
        this.tweens.add({
          targets: sig.sprite,
          scaleX: 2.5, scaleY: 2.5, alpha: 0,
          duration: 800, delay: 200 + Math.random() * 300,
        });
        this.tweens.add({
          targets: sig.inner,
          scaleX: 2, scaleY: 2, alpha: 0,
          duration: 800, delay: 200 + Math.random() * 300,
        });

        // +100 floating text
        const plusText = this.add.text(sig.x, sig.y - 10, '+100', {
          fontFamily: 'monospace', fontSize: '12px', color: '#00ff00',
        });
        plusText.setOrigin(0.5); plusText.setDepth(20);
        this.tweens.add({
          targets: plusText, y: sig.y - 40, alpha: 0,
          duration: 1000,
          onComplete: () => plusText.destroy(),
        });

      } else if (sig.marked && !inRange) {
        // MISS — red (marked but out of range)
        sig.sprite.setFillStyle(0xff0000, 1);
        sig.inner.setFillStyle(0xff4444, 1);
        score -= 50;
        missedMarked++;

        // Red flash
        this.tweens.add({
          targets: sig.sprite,
          scaleX: 2, scaleY: 2, alpha: 0,
          duration: 600, delay: 100 + Math.random() * 300,
        });
        this.tweens.add({
          targets: sig.inner, alpha: 0,
          duration: 600, delay: 100 + Math.random() * 300,
        });

        // -50 floating text
        const minusText = this.add.text(sig.x, sig.y - 10, '-50', {
          fontFamily: 'monospace', fontSize: '12px', color: '#ff0000',
        });
        minusText.setOrigin(0.5); minusText.setDepth(20);
        this.tweens.add({
          targets: minusText, y: sig.y - 40, alpha: 0,
          duration: 1000,
          onComplete: () => minusText.destroy(),
        });

      } else {
        // Not marked — fades out silently
        this.tweens.add({
          targets: [sig.sprite, sig.inner],
          alpha: 0, duration: 800, delay: Math.random() * 500,
        });
      }

      sig.alive = false;
    }

    // Bonuses
    let bonus = 0;
    if (intercepted >= 15) { bonus = 1000; }
    else if (intercepted >= 10) { bonus = 500; }
    else if (intercepted >= 5) { bonus = 200; }

    if (bonus > 0) {
      score += bonus;
      this.time.delayedCall(800, () => {
        const bonusText = this.add.text(W / 2 + SPLIT_X / 2, H / 2 + 40, `BONUS: +${bonus}`, {
          fontFamily: 'monospace', fontSize: '20px', color: '#FFD700',
          shadow: { offsetX: 0, offsetY: 0, color: '#FFD700', blur: 12, fill: true },
        });
        bonusText.setOrigin(0.5); bonusText.setDepth(35);
        this.tweens.add({
          targets: bonusText, alpha: 0, y: H / 2 + 10,
          duration: 1500,
          onComplete: () => bonusText.destroy(),
        });
      });
    }

    this.score = Math.max(0, score);
    this.interceptedCount = intercepted;
    this.missedMarked = missedMarked;

    // Update score display
    this.scoreText.setText(`SCORE: ${this.score}`);

    // After 2s → results
    this.time.delayedCall(2000, () => this._showResults());
  }

  // ── END GAME (timer ran out) ──────────────────────────────────
  _endGame(/* intercepted */) {
    this.gamePhase = 'intercepted';

    // Everything fades out
    for (const sig of this.signals) {
      if (!sig.alive) continue;
      sig.alive = false;
      this.tweens.add({
        targets: [sig.sprite, sig.inner],
        alpha: 0, duration: 600,
      });
    }

    // "TIME'S UP" text
    const timeUp = this.add.text(W / 2 + SPLIT_X / 2, H / 2, 'TIME\'S UP', {
      fontFamily: 'monospace', fontSize: '28px', color: '#ff0000',
      shadow: { offsetX: 0, offsetY: 0, color: '#ff0000', blur: 16, fill: true },
    });
    timeUp.setOrigin(0.5); timeUp.setDepth(35);
    this.tweens.add({
      targets: timeUp, alpha: 0.3,
      duration: 600, yoyo: true,
      onComplete: () => timeUp.destroy(),
    });

    this.score = 0;
    this.interceptedCount = 0;

    this.time.delayedCall(2000, () => this._showResults());
  }

  // ── RESULTS SCREEN ────────────────────────────────────────────
  _showResults() {
    this.gamePhase = 'results';
    MusicManager.get().stop(1);
    if (this.interceptedCount > 0) {
      SoundManager.get().playVictory();
    } else {
      SoundManager.get().playGameOver();
    }

    // Black overlay
    const overlay = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.85);
    overlay.setDepth(40);

    // Title
    const title = this.add.text(W / 2, 80, 'INTERCEPT COMPLETE', {
      fontFamily: 'monospace', fontSize: '32px', color: '#FFD700',
      shadow: { offsetX: 0, offsetY: 0, color: '#FFD700', blur: 16, fill: true },
    });
    title.setOrigin(0.5); title.setDepth(41);
    title.setAlpha(0);
    this.tweens.add({ targets: title, alpha: 1, duration: 500 });

    // Subtitle
    const sub = this.add.text(W / 2, 120, 'OPERATION SIGNAL STORM', {
      fontFamily: 'monospace', fontSize: '14px', color: '#ffffff',
    });
    sub.setOrigin(0.5); sub.setDepth(41);
    sub.setAlpha(0);
    this.tweens.add({ targets: sub, alpha: 1, duration: 500, delay: 200 });

    // Separator
    const sep = this.add.rectangle(W / 2, 145, 280, 2, 0x00e5ff, 0.5);
    sep.setDepth(41); sep.setAlpha(0);
    this.tweens.add({ targets: sep, alpha: 1, duration: 300, delay: 400 });

    // Star rating
    let stars;
    if (this.interceptedCount >= 12) stars = '\u2605\u2605\u2605';
    else if (this.interceptedCount >= 8) stars = '\u2605\u2605\u2606';
    else stars = '\u2605\u2606\u2606';

    try { const sc = this.interceptedCount >= 12 ? 3 : this.interceptedCount >= 8 ? 2 : 1; localStorage.setItem('superzion_stars_2', String(sc)); } catch(e) {}

    const lines = [
      `SIGNALS INTERCEPTED: ${this.interceptedCount} / ${NUM_SIGNALS}`,
      `MARKED OUT OF RANGE: ${this.missedMarked}`,
      `SCORE: ${this.score}`,
      `TIME REMAINING: ${Math.ceil(this.timeRemaining)}s`,
      `RATING: ${stars}`,
    ];

    let yPos = 175;
    lines.forEach((line, i) => {
      const t = this.add.text(W / 2, yPos, line, {
        fontFamily: 'monospace', fontSize: '14px', color: '#00e5ff',
      });
      t.setOrigin(0.5); t.setDepth(41);
      t.setAlpha(0);
      this.tweens.add({ targets: t, alpha: 1, duration: 300, delay: 600 + i * 250 });
      yPos += 30;
    });

    // Separator 2
    this.time.delayedCall(1800, () => {
      const sep2 = this.add.rectangle(W / 2, yPos + 10, 260, 2, 0x00e5ff, 0.5);
      sep2.setDepth(41);
    });

    // Continue prompt
    this.time.delayedCall(2000, () => {
      const cont = this.add.text(W / 2, yPos + 40, 'PRESS ENTER FOR NEXT MISSION', {
        fontFamily: 'monospace', fontSize: '18px', color: '#ffffff',
      });
      cont.setOrigin(0.5); cont.setDepth(41);
      this.tweens.add({ targets: cont, alpha: 0.3, duration: 600, yoyo: true, repeat: -1 });
    });
  }

  // ── CLEANUP ───────────────────────────────────────────────────
  _cleanup() {
    // Stop ambient noise
    if (this.ambientRef) {
      try {
        this.ambientRef.source.stop();
      } catch (e) { /* already stopped */ }
      this.ambientRef = null;
    }
  }

  shutdown() {
    this._cleanup();
    this.tweens.killAll();
    this.time.removeAllEvents();
  }
}
