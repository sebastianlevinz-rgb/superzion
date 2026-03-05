// ═══════════════════════════════════════════════════════════════
// EndgameManager — Side-scroller building, plant, escape, explode
// Enhancements: golden glow, skull, DodAvi
// ═══════════════════════════════════════════════════════════════

import Phaser from 'phaser';
import { TILE, GROUND_Y, BUILDING_CENTER_TILE } from '../data/LevelConfig.js';
import SoundManager from './SoundManager.js';
import MusicManager from './MusicManager.js';

const FLOOR_H = 38;
const NUM_FLOORS = 5;
const BUILDING_W = 224;
const PROXIMITY = 80; // px from building center to allow planting

export default class EndgameManager {
  constructor(scene, player) {
    this.scene = scene;
    this.player = player;
    this.phase = 'infiltrate'; // infiltrate → escape → detonate → done
    this.bombPlanted = false;
    this.bombSprite = null;
    this.plantPrompt = null;

    this._buildTargetBuilding();
  }

  _buildTargetBuilding() {
    const scene = this.scene;
    const buildingX = BUILDING_CENTER_TILE * TILE;
    const groundPx = GROUND_Y * TILE;

    // Stack floors bottom-up
    const totalH = (NUM_FLOORS + 1) * FLOOR_H; // 5 floors + roof
    this.buildingTop = groundPx - totalH;
    this.buildingX = buildingX;

    this.floorSprites = [];
    for (let i = 0; i < NUM_FLOORS; i++) {
      const floorY = groundPx - (i + 1) * FLOOR_H;
      const sprite = scene.add.image(buildingX, floorY + FLOOR_H / 2, `target_bldg_floor_${i}`);
      sprite.setDepth(3);
      this.floorSprites.push(sprite);
    }

    // Roof
    const roofY = groundPx - NUM_FLOORS * FLOOR_H - FLOOR_H;
    this.roofSprite = scene.add.image(buildingX, roofY + FLOOR_H / 2, 'target_bldg_roof');
    this.roofSprite.setDepth(3);

    // Target marker (bouncing arrow)
    this.marker = scene.add.image(buildingX, this.buildingTop - 30, 'target_marker');
    this.marker.setDepth(4);
    scene.tweens.add({
      targets: this.marker,
      y: this.buildingTop - 45,
      duration: 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });

    // Enhancement 4: Golden glow behind building
    const glowH = totalH + 20;
    this.targetGlow = scene.add.rectangle(
      buildingX, groundPx - totalH / 2,
      BUILDING_W + 30, glowH,
      0xFFD700, 0.12
    );
    this.targetGlow.setDepth(2);
    scene.tweens.add({
      targets: this.targetGlow,
      alpha: 0.25, duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });
  }

  update(delta) {
    if (this.phase === 'done') return;

    const px = this.player.sprite.x;
    const py = this.player.sprite.y;
    const groundPx = GROUND_Y * TILE;
    const dist = Math.abs(px - this.buildingX);

    if (this.phase === 'infiltrate') {
      // Show/hide proximity prompt
      if (dist < PROXIMITY && py > groundPx - 150) {
        if (!this.plantPrompt) {
          this.plantPrompt = this.scene.add.text(this.buildingX, groundPx - (NUM_FLOORS + 1) * FLOOR_H - 60,
            'PRESS SPACE TO PLANT', {
            fontFamily: 'monospace', fontSize: '12px', color: '#00ff00',
            shadow: { offsetX: 0, offsetY: 0, color: '#00ff00', blur: 6, fill: true },
          });
          this.plantPrompt.setOrigin(0.5);
          this.plantPrompt.setDepth(50);
        }

        if (Phaser.Input.Keyboard.JustDown(this.player.actionKey)) {
          this._plantBomb();
        }
      } else {
        if (this.plantPrompt) {
          this.plantPrompt.destroy();
          this.plantPrompt = null;
        }
      }
    } else if (this.phase === 'escape') {
      // Countdown is running on-screen — nothing to check here,
      // the countdown timer handles transition automatically
    }
  }

  _plantBomb() {
    this.phase = 'escape';
    this.player.frozen = true;
    SoundManager.get().playPlantBeeps();
    MusicManager.get().playLevel1Music(true);

    if (this.plantPrompt) {
      this.plantPrompt.destroy();
      this.plantPrompt = null;
    }

    const cx = this.buildingX;
    const groundPx = GROUND_Y * TILE;
    const bombY = groundPx - 10;

    // Planting animation
    const plantText = this.scene.add.text(cx, groundPx - 60, 'PLANTING...', {
      fontFamily: 'monospace', fontSize: '14px', color: '#00ff00',
      shadow: { offsetX: 0, offsetY: 0, color: '#00ff00', blur: 8, fill: true },
    });
    plantText.setOrigin(0.5); plantText.setDepth(50);

    let dots = 0;
    const dotTimer = this.scene.time.addEvent({
      delay: 400, repeat: 4,
      callback: () => { dots++; plantText.setText('PLANTING' + '.'.repeat(dots % 4)); },
    });

    this.scene.time.delayedCall(2000, () => {
      plantText.destroy();
      dotTimer.destroy();
      this.player.frozen = false;

      // Place bomb sprite
      this.bombSprite = this.scene.add.image(cx, bombY, 'explosive_device');
      this.bombSprite.setDepth(5);
      this.bombSprite.setScale(1.5);
      this.bombSprite.setScale(0);
      this.scene.tweens.add({
        targets: this.bombSprite,
        scaleX: 1.5, scaleY: 1.5, duration: 300, ease: 'Bounce.easeOut',
      });
      this.scene.tweens.add({
        targets: this.bombSprite,
        alpha: 0.6, duration: 400, yoyo: true, repeat: -1,
      });

      // Remove glow and marker
      if (this.targetGlow) {
        this.scene.tweens.killTweensOf(this.targetGlow);
        this.scene.tweens.add({ targets: this.targetGlow, alpha: 0, duration: 500, onComplete: () => this.targetGlow.destroy() });
      }
      if (this.marker) {
        this.scene.tweens.killTweensOf(this.marker);
        this.scene.tweens.add({ targets: this.marker, alpha: 0, duration: 500, onComplete: () => this.marker.destroy() });
      }

      // Deactivate obstacles
      this.scene.deactivateAllObstacles();

      // Show messages
      this._showLog('DEVICE PLANTED! GET TO SAFETY!');
      this.scene.time.delayedCall(1500, () => {
        this._showLog('RUN!');
      });

      // Start visible 10-second countdown immediately
      this._startDetonate();
    });
  }

  _startDetonate() {
    this.phase = 'detonate';
    // Player is NOT frozen — they can run during countdown

    const cam = this.scene.cameras.main;
    let count = 10;

    // Countdown HUD in top-right corner
    const countText = this.scene.add.text(cam.width - 20, 20, '10', {
      fontFamily: 'monospace', fontSize: '48px', color: '#ff2222',
      shadow: { offsetX: 0, offsetY: 0, color: '#ff0000', blur: 16, fill: true },
    });
    countText.setOrigin(1, 0); countText.setScrollFactor(0); countText.setDepth(300);

    const label = this.scene.add.text(cam.width - 20, 70, 'DETONATION', {
      fontFamily: 'monospace', fontSize: '12px', color: '#ff4444',
    });
    label.setOrigin(1, 0); label.setScrollFactor(0); label.setDepth(300);

    const tick = () => {
      SoundManager.get().playCountdownTick();
      this.scene.tweens.add({
        targets: countText,
        scaleX: 1.2, scaleY: 1.2, duration: 80, yoyo: true,
      });
      this.scene.time.delayedCall(1000, () => {
        count--;
        if (count > 0) {
          countText.setText(`${count}`);
          // Last 3 seconds: bigger, centered
          if (count <= 3) {
            countText.setFontSize('72px');
            countText.setOrigin(0.5, 0.5);
            countText.setPosition(cam.width / 2, cam.height / 2);
            label.setVisible(false);
          }
          tick();
        } else {
          countText.setText('0');
          this.player.frozen = true;
          this.scene.time.delayedCall(300, () => {
            countText.destroy();
            label.destroy();
            this._transitionToExplosion();
          });
        }
      });
    };
    tick();
  }

  _transitionToExplosion() {
    const scene = this.scene;
    this.phase = 'done';

    // Brief white flash to cover the scene transition
    const cam = scene.cameras.main;
    const flash = scene.add.rectangle(cam.width / 2, cam.height / 2, cam.width + 200, cam.height + 200, 0xffffff, 1);
    flash.setScrollFactor(0); flash.setDepth(300);

    // Collect stats and transition
    const elapsed = scene.time.now - scene.stats.startTime;
    scene.time.delayedCall(100, () => {
      scene.scene.start('ExplosionCinematicScene', {
        stats: {
          timesDetected: scene.stats.timesDetected,
          elapsed: elapsed,
          hp: this.player.hp,
          maxHp: this.player.maxHp,
        },
      });
    });
  }

  _showLog(text) {
    const cam = this.scene.cameras.main;
    const log = this.scene.add.text(cam.width / 2, cam.height - 50, '', {
      fontFamily: 'monospace', fontSize: '13px', color: '#00ff00',
      backgroundColor: 'rgba(0,0,0,0.8)',
      padding: { x: 12, y: 6 },
    });
    log.setOrigin(0.5); log.setScrollFactor(0); log.setDepth(100);

    let idx = 0;
    this.scene.time.addEvent({
      delay: 30, repeat: text.length - 1,
      callback: () => { idx++; log.setText(text.substring(0, idx)); },
    });

    this.scene.time.delayedCall(4000, () => {
      this.scene.tweens.add({
        targets: log, alpha: 0, duration: 500,
        onComplete: () => log.destroy(),
      });
    });
  }

}
