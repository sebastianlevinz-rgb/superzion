// ═══════════════════════════════════════════════════════════════
// MenuScene — Parallax background, level selection
// ═══════════════════════════════════════════════════════════════

import Phaser from 'phaser';
import { createSkyGradient, createSun, createMountainLayer, createCloudLayer, createSkylineLayer, createFacadeLayer } from '../utils/BackgroundGenerator.js';
import { createCliffBackground, createSuperZionOnCliff } from '../utils/CinematicTextures.js';
import SoundManager from '../systems/SoundManager.js';
import MusicManager from '../systems/MusicManager.js';
import DifficultyManager from '../systems/DifficultyManager.js';

const LEVELS = [
  { label: 'LEVEL 1: OPERATION TEHRAN', scene: 'IntroCinematicScene' },
  { label: 'LEVEL 2: OPERATION SIGNAL STORM', scene: 'BeirutIntroCinematicScene' },
  { label: 'LEVEL 3: OPERATION DEEP STRIKE', scene: 'DeepStrikeIntroCinematicScene' },
  { label: 'LEVEL 4: OPERATION UNDERGROUND', scene: 'UndergroundIntroCinematicScene' },
  { label: 'LEVEL 5: OPERATION MOUNTAIN BREAKER', scene: 'MountainBreakerIntroCinematicScene' },
  { label: 'LEVEL 6: OPERATION LAST STAND', scene: 'LastStandCinematicScene' },
];

export default class MenuScene extends Phaser.Scene {
  constructor() { super('MenuScene'); }

  create() {
    this.cameras.main.setBackgroundColor('#0a0a0a');

    // Generate BackgroundGenerator textures (still needed by IntroCinematicScene + ExplosionCinematicScene)
    if (!this.textures.exists('sky_gradient')) {
      createSkyGradient(this);
      createSun(this);
      createMountainLayer(this);
      createCloudLayer(this);
      createSkylineLayer(this);
      createFacadeLayer(this);
    }

    // Generate cliff scene textures
    createCliffBackground(this);
    createSuperZionOnCliff(this);

    // Cliff background
    this.add.image(480, 270, 'cin_cliff_bg').setDepth(-10);

    // SuperZion on cliff with idle bob
    this.cliffHero = this.add.image(720, 340, 'cin_superzion_cliff').setDepth(-6).setScale(1.5);
    this.tweens.add({
      targets: this.cliffHero, y: 343, duration: 1500,
      yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });

    // Slow-moving cloud layer
    this.cloudsBg = this.add.tileSprite(480, 120, 960, 200, 'clouds').setDepth(-7).setAlpha(0.3);

    // Light overlay for text readability
    const overlay = this.add.rectangle(480, 270, 960, 540, 0x000000, 0.2);
    overlay.setDepth(-4);

    // Title
    const title = this.add.text(480, 100, 'SUPERZION', {
      fontFamily: 'monospace', fontSize: '56px', color: '#FFD700',
      shadow: { offsetX: 0, offsetY: 0, color: '#FFD700', blur: 20, fill: true },
    });
    title.setOrigin(0.5); title.setDepth(10);

    // Line
    this.add.rectangle(480, 145, 280, 2, 0x00e5ff, 0.6).setDepth(10);

    // Completion indicator + hard mode toggle
    const dm = DifficultyManager.get();
    try {
      if (localStorage.getItem('superzion_completed')) {
        const star = this.add.text(480, 158, 'GAME COMPLETED \u2605', {
          fontFamily: 'monospace', fontSize: '12px', color: '#FFD700',
          shadow: { offsetX: 0, offsetY: 0, color: '#FFD700', blur: 8, fill: true },
        });
        star.setOrigin(0.5).setDepth(10);

        // Hard mode toggle
        this.hardModeText = this.add.text(480, 500, dm.isHard() ? 'HARD MODE: ON' : 'HARD MODE: OFF  (H to toggle)', {
          fontFamily: 'monospace', fontSize: '11px',
          color: dm.isHard() ? '#ff4444' : '#555555',
        });
        this.hardModeText.setOrigin(0.5).setDepth(10);
      }
    } catch (e) { /* localStorage unavailable */ }

    // ── Level selection ──
    this.selectedIndex = 0;
    this.levelTexts = [];
    this.selectorArrows = [];

    const startY = 180;
    const gap = 30;

    this.starTexts = [];
    for (let i = 0; i < LEVELS.length; i++) {
      const y = startY + i * gap;

      // Arrow selector ▶
      const arrow = this.add.text(280, y, '\u25B6', {
        fontFamily: 'monospace', fontSize: '20px', color: '#FFD700',
      });
      arrow.setOrigin(0.5); arrow.setDepth(10);
      arrow.setAlpha(i === 0 ? 1 : 0);
      this.selectorArrows.push(arrow);

      // Level label
      const label = this.add.text(460, y, LEVELS[i].label, {
        fontFamily: 'monospace', fontSize: '18px',
        color: i === 0 ? '#FFD700' : '#888888',
      });
      label.setOrigin(0.5); label.setDepth(10);
      this.levelTexts.push(label);

      // Star rating display
      let starStr = '';
      try {
        const saved = localStorage.getItem(`superzion_stars_${i + 1}`);
        if (saved) {
          const sc = parseInt(saved, 10);
          for (let s = 0; s < 3; s++) starStr += s < sc ? '\u2605' : '\u2606';
        }
      } catch (e) {}
      const starText = this.add.text(640, y, starStr, {
        fontFamily: 'monospace', fontSize: '14px', color: '#FFD700',
      });
      starText.setOrigin(0, 0.5); starText.setDepth(10);
      this.starTexts.push(starText);
    }

    // Level descriptions
    this.descText = this.add.text(480, startY + LEVELS.length * gap + 20, '', {
      fontFamily: 'monospace', fontSize: '12px', color: '#aaaaaa',
      align: 'center', lineSpacing: 4,
    });
    this.descText.setOrigin(0.5); this.descText.setDepth(10);
    this._updateDescription();

    // Controls hint
    const controls = this.add.text(480, 475, 'UP/DOWN — Select  |  ENTER/SPACE — Start  |  M — Mute  |  H — Hard Mode', {
      fontFamily: 'monospace', fontSize: '12px', color: '#666666',
    });
    controls.setOrigin(0.5); controls.setDepth(10);

    // Blinking prompt
    const prompt = this.add.text(480, 435, 'SELECT A MISSION', {
      fontFamily: 'monospace', fontSize: '16px', color: '#ffffff',
    });
    prompt.setOrigin(0.5); prompt.setDepth(10);
    this.tweens.add({
      targets: prompt, alpha: 0.3, duration: 700, yoyo: true, repeat: -1,
    });

    // Start menu music
    MusicManager.get().playMenuMusic();

    // Scroll offset for parallax
    this.scrollOffset = 0;

    // Input
    this.spaceKey = this.input.keyboard.addKey('SPACE');
    this.enterKey = this.input.keyboard.addKey('ENTER');
    this.upKey = this.input.keyboard.addKey('UP');
    this.downKey = this.input.keyboard.addKey('DOWN');
    this.wKey = this.input.keyboard.addKey('W');
    this.sKey = this.input.keyboard.addKey('S');
    this.mKey = this.input.keyboard.addKey('M');
    this.hKey = this.input.keyboard.addKey('H');
  }

  _updateSelection() {
    for (let i = 0; i < LEVELS.length; i++) {
      const selected = i === this.selectedIndex;
      this.levelTexts[i].setColor(selected ? '#FFD700' : '#888888');
      this.selectorArrows[i].setAlpha(selected ? 1 : 0);
    }
    this._updateDescription();
  }

  _updateDescription() {
    const descs = [
      'Infiltrate the Tehran rooftops.\nReach the target. Plant the device. Escape alive.',
      'Intercept enemy communications in Beirut.\nMark signals on the radar. Time your intercept.',
      'Precision aerial bombardment over Lebanon.\nDestroy the underground bunker. Return to carrier.',
      'Drone reconnaissance and tunnel infiltration in Gaza.\nMap tunnels. Navigate underground. Destroy command center.',
      'B-2 Stealth Bomber night mission over Iran.\nPenetrate defenses. Destroy Natanz nuclear facility.',
      'The final confrontation. Destroy The Commander.\nEnd the war. No retreat. No surrender.',
    ];
    this.descText.setText(descs[this.selectedIndex]);
  }

  update(time, delta) {
    // Gentle cloud scroll
    this.scrollOffset += delta * 0.01;
    this.cloudsBg.tilePositionX = this.scrollOffset * 0.4;

    // Mute toggle (syncs both SFX and music)
    if (Phaser.Input.Keyboard.JustDown(this.mKey)) {
      const muted = SoundManager.get().toggleMute();
      MusicManager.get().setMuted(muted);
    }

    // Hard mode toggle
    if (Phaser.Input.Keyboard.JustDown(this.hKey)) {
      const dm = DifficultyManager.get();
      if (dm.isUnlocked()) {
        const isHard = dm.toggle();
        SoundManager.get().playTypewriterClick();
        if (this.hardModeText) {
          this.hardModeText.setText(isHard ? 'HARD MODE: ON' : 'HARD MODE: OFF  (H to toggle)');
          this.hardModeText.setColor(isHard ? '#ff4444' : '#555555');
        }
      }
    }

    // Navigation
    if (Phaser.Input.Keyboard.JustDown(this.upKey) || Phaser.Input.Keyboard.JustDown(this.wKey)) {
      this.selectedIndex = (this.selectedIndex - 1 + LEVELS.length) % LEVELS.length;
      this._updateSelection();
      SoundManager.get().playTypewriterClick();
    }
    if (Phaser.Input.Keyboard.JustDown(this.downKey) || Phaser.Input.Keyboard.JustDown(this.sKey)) {
      this.selectedIndex = (this.selectedIndex + 1) % LEVELS.length;
      this._updateSelection();
      SoundManager.get().playTypewriterClick();
    }

    // Start selected level
    if (Phaser.Input.Keyboard.JustDown(this.spaceKey) || Phaser.Input.Keyboard.JustDown(this.enterKey)) {
      SoundManager.get().playMenuSelect();
      const targetScene = LEVELS[this.selectedIndex].scene;
      MusicManager.get().stop(0.3);
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.time.delayedCall(300, () => this.scene.start(targetScene));
    }
  }
}
