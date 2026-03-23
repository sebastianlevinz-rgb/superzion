// ===================================================================
// Bomberman EndgameManager — plant explosive, escape sequence
// ===================================================================

import Phaser from 'phaser';
import { gx, gy, toCol, toRow, OBJ, SPAWN, TILE } from '../data/LevelConfig.js';
import SoundManager from './SoundManager.js';
import MusicManager from './MusicManager.js';

const ESCAPE_TIME = 15; // seconds
const PROXIMITY = TILE * 1.5;

export default class BombermanEndgame {
  constructor(scene, player) {
    this.scene = scene;
    this.player = player;
    this.phase = 'infiltrate'; // infiltrate → planting → escape → done
    this.escapeTimer = 0;
    this.escapeSeconds = ESCAPE_TIME;
    this.plantPrompt = null;
    this.flashTimer = 0;
    this.flashOverlay = null;
  }

  update(delta) {
    if (this.phase === 'done') return;

    const px = this.player.sprite.x;
    const py = this.player.sprite.y;
    const objX = gx(OBJ.col);
    const objY = gy(OBJ.row);

    if (this.phase === 'infiltrate') {
      const dist = Math.abs(px - objX) + Math.abs(py - objY);
      if (dist < PROXIMITY) {
        if (!this.plantPrompt) {
          this.plantPrompt = this.scene.add.text(objX, objY - 28, 'PRESS E TO PLANT EXPLOSIVE', {
            fontFamily: 'monospace', fontSize: '10px', color: '#00ff00',
            shadow: { offsetX: 0, offsetY: 0, color: '#00ff00', blur: 6, fill: true },
          });
          this.plantPrompt.setOrigin(0.5).setDepth(50);
        }
        if (this.player.wantsInteract()) {
          this._startPlanting();
        }
      } else if (this.plantPrompt) {
        this.plantPrompt.destroy();
        this.plantPrompt = null;
      }
    } else if (this.phase === 'escape') {
      this.escapeTimer -= delta;
      const secs = Math.max(0, Math.ceil(this.escapeTimer / 1000));

      if (secs !== this.escapeSeconds) {
        this.escapeSeconds = secs;
        this.scene.hud.updateTimer(secs);
        if (secs > 0 && secs <= 5) SoundManager.get().playCountdownTick();
      }

      // Red flash effect
      this.flashTimer -= delta;
      if (this.flashTimer <= 0) {
        this.flashTimer = 800;
        if (this.flashOverlay) {
          this.flashOverlay.setAlpha(this.flashOverlay.alpha > 0 ? 0 : 0.08);
        }
      }

      // Check if player reached exit
      const exitDist = Math.abs(px - gx(SPAWN.col)) + Math.abs(py - gy(SPAWN.row));
      if (exitDist < TILE) {
        this._escapeSuccess();
        return;
      }

      // Time's up
      if (this.escapeTimer <= 0) {
        this._escapeFailed();
      }
    }
  }

  _startPlanting() {
    this.phase = 'planting';
    this.player.frozen = true;
    SoundManager.get().playPlantBeeps();
    if (this.plantPrompt) { this.plantPrompt.destroy(); this.plantPrompt = null; }

    const objX = gx(OBJ.col);
    const objY = gy(OBJ.row);

    const txt = this.scene.add.text(objX, objY - 30, 'PLANTING...', {
      fontFamily: 'monospace', fontSize: '12px', color: '#00ff00',
      shadow: { offsetX: 0, offsetY: 0, color: '#00ff00', blur: 8, fill: true },
    });
    txt.setOrigin(0.5).setDepth(50);

    let dots = 0;
    const dotTimer = this.scene.time.addEvent({
      delay: 400, repeat: 4,
      callback: () => { dots++; txt.setText('PLANTING' + '.'.repeat(dots % 4)); },
    });

    this.scene.time.delayedCall(2000, () => {
      txt.destroy();
      dotTimer.destroy();
      this.player.frozen = false;
      this._startEscape();
    });
  }

  _startEscape() {
    this.phase = 'escape';
    this.escapeTimer = ESCAPE_TIME * 1000;
    this.escapeSeconds = ESCAPE_TIME;

    // HUD timer
    this.scene.hud.showTimer(ESCAPE_TIME);

    // Big "ESCAPE!" text
    const cam = this.scene.cameras.main;
    const escTxt = this.scene.add.text(cam.width / 2, cam.height / 2, 'ESCAPE!', {
      fontFamily: 'monospace', fontSize: '48px', color: '#ff2222',
      shadow: { offsetX: 0, offsetY: 0, color: '#ff0000', blur: 20, fill: true },
    });
    escTxt.setOrigin(0.5).setScrollFactor(0).setDepth(200);
    this.scene.tweens.add({
      targets: escTxt,
      scaleX: 1.3, scaleY: 1.3, alpha: 0,
      duration: 1500,
      onComplete: () => escTxt.destroy(),
    });

    // Red overlay for alarm
    this.flashOverlay = this.scene.add.rectangle(cam.width / 2, cam.height / 2, cam.width, cam.height, 0xff0000, 0.08);
    this.flashOverlay.setScrollFactor(0).setDepth(150);

    // Speed up guards
    if (this.scene.guards) {
      for (const g of this.scene.guards) {
        if (g.alive) g.setSpeedMultiplier(1.6);
      }
    }

    // Show exit marker with bounce
    const exitX = gx(SPAWN.col);
    const exitY = gy(SPAWN.row);
    this.exitMarker = this.scene.add.image(exitX, exitY, 'bm_exit').setDepth(15);
    this.scene.tweens.add({
      targets: this.exitMarker, alpha: 0.4, duration: 400, yoyo: true, repeat: -1,
    });

    // Arrow pointing to exit
    this.exitArrow = this.scene.add.text(exitX, exitY - 22, '\u25BC', {
      fontSize: '16px', color: '#00ff00',
    });
    this.exitArrow.setOrigin(0.5).setDepth(16);
    this.scene.tweens.add({
      targets: this.exitArrow, y: exitY - 30, duration: 400, yoyo: true, repeat: -1,
    });

    MusicManager.get().playLevel1Music(true);
  }

  _escapeSuccess() {
    this.phase = 'done';
    this.player.frozen = true;

    // Clear Level 1 checkpoint on completion
    try { localStorage.removeItem('superzion_checkpoint_l1'); } catch (e) { /* ignore */ }
    this.scene.hud.hideTimer();
    if (this.flashOverlay) this.flashOverlay.destroy();
    if (this.exitMarker) this.exitMarker.destroy();
    if (this.exitArrow) this.exitArrow.destroy();

    // White flash + shake
    const cam = this.scene.cameras.main;
    cam.shake(800, 0.04);
    cam.flash(600, 255, 255, 255);

    SoundManager.get().playExplosion();

    // Expanding explosion circle
    const cx = cam.width / 2, cy = cam.height / 2;
    const circle = this.scene.add.circle(cx, cy, 10, 0xff6600, 0.8);
    circle.setScrollFactor(0).setDepth(300);
    this.scene.tweens.add({
      targets: circle,
      scaleX: 60, scaleY: 60, alpha: 0,
      duration: 1200,
      onComplete: () => circle.destroy(),
    });

    // Transition
    MusicManager.get().stop(0.3);
    const elapsed = this.scene.time.now - (this.scene.stats?.startTime || 0);
    this.scene.time.delayedCall(1500, () => {
      this.scene.scene.start('ExplosionCinematicScene', {
        stats: {
          timesDetected: 0,
          guardsKilled: this.scene.hud.guardsKilled,
          powerupsCollected: this.scene.hud.powerupsCollected,
          elapsed,
          hp: this.player.hp,
          maxHp: this.player.maxHp,
          livesRemaining: this.player.hp,
        },
      });
    });
  }

  _escapeFailed() {
    this.phase = 'done';
    this.player.frozen = true;
    this.scene.hud.hideTimer();
    if (this.flashOverlay) this.flashOverlay.destroy();

    // Explosion kills player
    const cam = this.scene.cameras.main;
    cam.shake(1000, 0.06);
    cam.flash(500, 255, 100, 0);
    SoundManager.get().playExplosion();

    this.player.hp = 0;
    this.scene._gameOverScreen('TIME\'S UP - MISSION FAILED');
  }
}
