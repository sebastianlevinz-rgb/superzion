// ===================================================================
// MenuScene -- 90s arcade-style title + level selection
// Dark gradient, grid, scanlines, large Maguen David, pseudo-3D title
// ===================================================================

import Phaser from 'phaser';
import { createSkyGradient, createSun, createMountainLayer, createCloudLayer, createSkylineLayer, createFacadeLayer } from '../utils/BackgroundGenerator.js';
import { createCliffBackground, createSuperZionOnCliff, createDestroyedCityBg } from '../utils/CinematicTextures.js';
import SoundManager from '../systems/SoundManager.js';
import MusicManager from '../systems/MusicManager.js';
import DifficultyManager from '../systems/DifficultyManager.js';
import InputManager from '../systems/InputManager.js';

const W = 960;
const H = 540;

const LEVELS = [
  { label: 'LEVEL 1: The Tehran Guest Room', scene: 'IntroCinematicScene' },
  { label: 'LEVEL 2: OPERATION DEEP STRIKE', scene: 'DeepStrikeIntroCinematicScene' },
  { label: 'LEVEL 3: OPERATION LAST CHAIR', scene: 'UndergroundIntroCinematicScene' },
  { label: 'LEVEL 4: OPERATION MOUNTAIN BREAKER', scene: 'MountainBreakerIntroCinematicScene' },
  { label: 'LEVEL 5: OPERATION ENDGAME', scene: 'LastStandCinematicScene' },
];

export default class MenuScene extends Phaser.Scene {
  constructor() { super('MenuScene'); }

  create() {
    this.cameras.main.setBackgroundColor('#050510');

    // Generate BackgroundGenerator textures (still needed by IntroCinematicScene + ExplosionCinematicScene)
    if (!this.textures.exists('sky_gradient')) {
      createSkyGradient(this);
      createSun(this);
      createMountainLayer(this);
      createCloudLayer(this);
      createSkylineLayer(this);
      createFacadeLayer(this);
    }

    // Generate cinematic textures (cliff textures still used by cinematics)
    createCliffBackground(this);
    createSuperZionOnCliff(this);
    createDestroyedCityBg(this);

    // =====================================================================
    // BACKGROUND: dark blue gradient (top #0A0A2E to bottom #050510)
    // =====================================================================
    const bg = this.add.graphics().setDepth(-10);
    for (let y = 0; y < H; y++) {
      const t = y / H;
      const r = Math.max(0, Math.round(10 + t * (5 - 10)));
      const g = Math.max(0, Math.round(10 + t * (5 - 10)));
      const b = Math.max(0, Math.round(46 + t * (16 - 46)));
      bg.fillStyle(Phaser.Display.Color.GetColor(r, g, b));
      bg.fillRect(0, y, W, 1);
    }

    // =====================================================================
    // Subtle Tel Aviv coastline silhouette (whisper of beach vibe)
    // =====================================================================
    const coastGfx = this.add.graphics().setDepth(-9.5);

    // Thin strip of darker sea at bottom (y > H*0.85)
    const seaTop = Math.floor(H * 0.85);
    for (let y = seaTop; y < H; y++) {
      const t = (y - seaTop) / (H - seaTop);
      coastGfx.fillStyle(0x030818, 0.04 + t * 0.06);
      coastGfx.fillRect(0, y, W, 1);
    }

    // Distant building silhouettes at bottom edge (very faint, alpha 0.08)
    coastGfx.fillStyle(0x0a0a2e, 0.08);
    // Building cluster left-center
    coastGfx.fillRect(W * 0.18, H - 22, 8, 22);
    coastGfx.fillRect(W * 0.21, H - 30, 6, 30);
    coastGfx.fillRect(W * 0.24, H - 18, 10, 18);
    coastGfx.fillRect(W * 0.27, H - 26, 5, 26);
    coastGfx.fillRect(W * 0.30, H - 14, 12, 14);
    // Building cluster center
    coastGfx.fillRect(W * 0.45, H - 20, 7, 20);
    coastGfx.fillRect(W * 0.48, H - 34, 5, 34);
    coastGfx.fillRect(W * 0.50, H - 24, 9, 24);
    coastGfx.fillRect(W * 0.53, H - 16, 6, 16);

    // Small palm tree silhouette on right edge (alpha 0.06)
    coastGfx.fillStyle(0x0a0a2e, 0.06);
    // Trunk (slightly curved)
    const palmBaseX = W * 0.88;
    const palmBaseY = H;
    coastGfx.fillRect(palmBaseX, palmBaseY - 32, 2, 32);
    coastGfx.fillRect(palmBaseX + 1, palmBaseY - 38, 2, 8);
    // Fronds (small ellipses)
    coastGfx.fillEllipse(palmBaseX - 4, palmBaseY - 40, 14, 5);
    coastGfx.fillEllipse(palmBaseX + 6, palmBaseY - 42, 12, 4);
    coastGfx.fillEllipse(palmBaseX + 1, palmBaseY - 44, 10, 4);

    // =====================================================================
    // Grid overlay: 1px lines every 25px
    // =====================================================================
    const gridGfx = this.add.graphics().setDepth(-9);
    gridGfx.lineStyle(1, 0x1A1A4A, 0.12);
    for (let gx = 0; gx < W; gx += 25) { gridGfx.lineBetween(gx, 0, gx, H); }
    for (let gy = 0; gy < H; gy += 25) { gridGfx.lineBetween(0, gy, W, gy); }

    // =====================================================================
    // Scanlines: every 2px
    // =====================================================================
    const scanGfx = this.add.graphics().setDepth(-8);
    for (let sy = 0; sy < H; sy += 2) {
      scanGfx.fillStyle(0x000000, 0.15);
      scanGfx.fillRect(0, sy, W, 1);
    }

    // =====================================================================
    // Floating particles (20 subtle blue dots)
    // =====================================================================
    for (let i = 0; i < 20; i++) {
      const pSize = 1 + Math.random();
      const pAlpha = 0.25 + Math.random() * 0.2;
      const px = Math.random() * W;
      const py = Math.random() * H;
      const particle = this.add.circle(px, py, pSize, 0x3333AA, pAlpha).setDepth(-7);
      const dur = 8000 + Math.random() * 7000;
      this.tweens.add({
        targets: particle, y: -20,
        duration: dur, ease: 'Linear', repeat: -1,
        onRepeat: () => {
          particle.x = Math.random() * W;
          particle.y = H + 20;
        },
      });
    }

    // =====================================================================
    // Vignette: dark circles at 4 corners
    // =====================================================================
    const vigGfx = this.add.graphics().setDepth(-6);
    const corners = [
      { x: 0, y: 0 }, { x: W, y: 0 },
      { x: 0, y: H }, { x: W, y: H },
    ];
    for (const c of corners) {
      for (let lr = 250; lr > 50; lr -= 25) {
        vigGfx.fillStyle(0x000000, 0.3 * (lr / 250) * 0.15);
        vigGfx.fillCircle(c.x, c.y, lr);
      }
    }

    // =====================================================================
    // LARGE MAGUEN DAVID (behind title)
    // =====================================================================
    const starCx = W / 2, starCy = 100;
    const starR = 200;

    // Use the metallic star from intro if available, else draw simple one
    if (this.textures.exists('__star_metal_tex')) {
      const starImg = this.add.image(starCx, starCy, '__star_metal_tex').setDepth(-4).setAlpha(0.25).setScale(starR / 230);
      this.tweens.add({
        targets: starImg, alpha: { from: 0.15, to: 0.3 },
        duration: 3500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
      });
    } else {
      // Fallback: simple triangle star
      const starGfx = this.add.graphics().setDepth(-4);
      starGfx.fillStyle(0xFFD700, 0.25);
      starGfx.fillTriangle(starCx, starCy - starR, starCx - starR * 0.866, starCy + starR * 0.5, starCx + starR * 0.866, starCy + starR * 0.5);
      starGfx.fillTriangle(starCx, starCy + starR, starCx - starR * 0.866, starCy - starR * 0.5, starCx + starR * 0.866, starCy - starR * 0.5);
      this.tweens.add({ targets: starGfx, alpha: { from: 0.2, to: 0.3 }, duration: 3500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }

    // =====================================================================
    // SUPERZION TITLE -- 5-layer pseudo-3D using canvas texture
    // =====================================================================
    const titleStr = 'SUPERZION';
    const titleFont = '64px "Impact", "Arial Black", sans-serif';
    const menuTitleY = 90;

    const titleTexKey = '__menu_title_tex';
    if (this.textures.exists(titleTexKey)) this.textures.remove(titleTexKey);
    const titleCanvas = this.textures.createCanvas(titleTexKey, W, 120);
    const tCtx = titleCanvas.context;
    tCtx.textAlign = 'center';
    tCtx.textBaseline = 'middle';
    tCtx.font = titleFont;

    const drawX = W / 2;
    const drawY = 60;

    // Draw letter by letter
    const letters = titleStr.split('');
    const totalWidth = tCtx.measureText(titleStr).width;
    const letterWidths = letters.map(l => tCtx.measureText(l).width);
    let letterX = drawX - totalWidth / 2;

    for (let li = 0; li < letters.length; li++) {
      const lx = letterX + letterWidths[li] / 2;

      // Layer 1: Black stroke outline
      tCtx.strokeStyle = '#000000';
      tCtx.lineWidth = 4;
      tCtx.lineJoin = 'round';
      tCtx.strokeText(letters[li], lx + 3, drawY + 3);
      tCtx.strokeText(letters[li], lx + 2, drawY + 2);
      tCtx.strokeText(letters[li], lx + 1, drawY + 1);
      tCtx.strokeText(letters[li], lx, drawY);

      // Layer 2: Deep shadow
      tCtx.fillStyle = '#000000';
      tCtx.fillText(letters[li], lx + 3, drawY + 3);

      // Layer 3: Brown depth
      tCtx.fillStyle = '#8B6914';
      tCtx.fillText(letters[li], lx + 2, drawY + 2);

      // Layer 4: Gold edge
      tCtx.fillStyle = '#CC9900';
      tCtx.fillText(letters[li], lx + 1, drawY + 1);

      // Layer 5: Main gold
      tCtx.fillStyle = '#FFD700';
      tCtx.fillText(letters[li], lx, drawY);

      // Layer 6: Top highlight
      tCtx.save();
      tCtx.globalAlpha = 0.4;
      tCtx.fillStyle = '#FFEC80';
      tCtx.fillText(letters[li], lx, drawY - 1);
      tCtx.restore();

      letterX += letterWidths[li];
    }
    titleCanvas.refresh();

    const titleImg = this.add.image(W / 2, menuTitleY, titleTexKey).setDepth(10);

    // =====================================================================
    // Sparkles around the title (6 looping)
    // =====================================================================
    const spawnSparkle = () => {
      const sx = W / 2 + (Math.random() - 0.5) * 350;
      const sy = menuTitleY + (Math.random() - 0.5) * 60;
      const sparkColor = Math.random() > 0.5 ? 0xFFD700 : 0xffffff;

      const sparkGfx = this.add.graphics().setDepth(15).setAlpha(0);
      sparkGfx.lineStyle(1.5, sparkColor, 1);
      sparkGfx.lineBetween(-4, 0, 4, 0);
      sparkGfx.lineBetween(0, -4, 0, 4);
      sparkGfx.setPosition(sx, sy);

      this.tweens.add({
        targets: sparkGfx, alpha: { from: 0, to: 1 },
        duration: 400, yoyo: true, ease: 'Sine.easeInOut',
        onComplete: () => {
          if (sparkGfx && sparkGfx.destroy) sparkGfx.destroy();
          this.time.delayedCall(200 + Math.random() * 400, spawnSparkle);
        },
      });
    };
    for (let i = 0; i < 6; i++) {
      this.time.delayedCall(i * 200, spawnSparkle);
    }

    // =====================================================================
    // Separator line below title
    // =====================================================================
    this.add.rectangle(W / 2, 140, 300, 2, 0x00e5ff, 0.5).setDepth(10);

    // =====================================================================
    // Completion indicator + hard mode toggle
    // =====================================================================
    const dm = DifficultyManager.get();
    try {
      if (localStorage.getItem('superzion_completed')) {
        const star = this.add.text(W / 2, 155, 'GAME COMPLETED \u2605', {
          fontFamily: 'monospace', fontSize: '12px', color: '#FFD700',
          shadow: { offsetX: 0, offsetY: 0, color: '#FFD700', blur: 8, fill: true },
        });
        star.setOrigin(0.5).setDepth(10);

        // Hard mode toggle
        this.hardModeText = this.add.text(W / 2, 500, dm.isHard() ? 'HARD MODE: ON' : 'HARD MODE: OFF  (H to toggle)', {
          fontFamily: 'monospace', fontSize: '11px',
          color: dm.isHard() ? '#ff4444' : '#555555',
        });
        this.hardModeText.setOrigin(0.5).setDepth(10);
      }
    } catch (e) { /* localStorage unavailable */ }

    // =====================================================================
    // Level unlock: level 1 always unlocked, others need previous level completed
    // =====================================================================
    this._unlockedLevels = 1;
    try {
      const saved = parseInt(localStorage.getItem('superzion_level_progress') || '1');
      this._unlockedLevels = Math.max(1, Math.min(saved, LEVELS.length));
    } catch(e) {}

    // =====================================================================
    // LEVEL SELECTION -- monospace green/amber arcade styling
    // =====================================================================
    this.selectedIndex = 0;
    this.levelTexts = [];
    this.selectorArrows = [];

    const startY = 180;
    const gap = 30;

    this.starTexts = [];
    for (let i = 0; i < LEVELS.length; i++) {
      const y = startY + i * gap;

      // Arrow selector
      const arrow = this.add.text(140, y, '\u25B6', {
        fontFamily: 'monospace', fontSize: '20px', color: '#33FF33',
      });
      arrow.setOrigin(0.5); arrow.setDepth(10);
      arrow.setAlpha(i === 0 ? 1 : 0);
      this.selectorArrows.push(arrow);

      // Level label -- selected = bright green, unselected = dim amber, locked = dark gray
      const locked = i >= this._unlockedLevels;
      const labelText = locked ? LEVELS[i].label + ' \uD83D\uDD12' : LEVELS[i].label;
      const labelColor = locked ? '#444444' : (i === 0 ? '#33FF33' : '#AA8833');
      const label = this.add.text(320, y, labelText, {
        fontFamily: 'monospace', fontSize: '18px',
        color: labelColor,
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
      const starText = this.add.text(500, y, starStr, {
        fontFamily: 'monospace', fontSize: '14px', color: '#FFD700',
      });
      starText.setOrigin(0, 0.5); starText.setDepth(10);
      this.starTexts.push(starText);
    }

    // Level descriptions (hidden -- replaced by preview panel)
    this.descText = this.add.text(320, startY + LEVELS.length * gap + 20, '', {
      fontFamily: 'monospace', fontSize: '12px', color: '#77BB77',
      align: 'center', lineSpacing: 4,
      wordWrap: { width: 420 },
    });
    this.descText.setOrigin(0.5); this.descText.setDepth(10);
    this._updateDescription();

    // =====================================================================
    // PREVIEW PANEL (right side)
    // =====================================================================
    this._createPreviewPanel();

    // =====================================================================
    // DIFFICULTY SELECTOR
    // =====================================================================
    {
      const diffY = H - 55;
      this.add.text(W / 2, diffY - 18, 'DIFFICULTY', {
        fontFamily: 'monospace', fontSize: '10px', color: '#666666',
      }).setOrigin(0.5).setDepth(10);

      const difficulties = ['NORMAL', 'HARD'];
      this.diffTexts = [];
      for (let i = 0; i < difficulties.length; i++) {
        const dx = W / 2 + (i - 0.5) * 100;
        const isSelected = (i === 0 && !dm.isHard()) || (i === 1 && dm.isHard());
        const dt = this.add.text(dx, diffY, difficulties[i], {
          fontFamily: 'monospace', fontSize: '14px',
          color: isSelected ? (i === 1 ? '#ff4444' : '#44ff44') : '#555555',
          fontStyle: isSelected ? 'bold' : 'normal',
        }).setOrigin(0.5).setDepth(10).setInteractive();

        dt.on('pointerdown', () => {
          if (i === 1 && !dm.isUnlocked()) return;
          if (i === 0 && !dm.isHard()) return;
          if (i === 1 && dm.isHard()) return;
          dm.toggle();
          this._updateDifficultyUI();
          SoundManager.get().playTypewriterClick();
        });

        this.diffTexts.push(dt);
      }
    }

    // Controls hint -- amber monospace
    const controls = this.add.text(W / 2, 475, 'UP/DOWN -- Select  |  ENTER/SPACE -- Start  |  M -- Mute  |  H -- Hard Mode', {
      fontFamily: 'monospace', fontSize: '12px', color: '#AA8833',
    });
    controls.setOrigin(0.5); controls.setDepth(10);

    // Blinking prompt -- green arcade style
    const prompt = this.add.text(W / 2, 435, 'SELECT A MISSION', {
      fontFamily: 'monospace', fontSize: '16px', color: '#33FF33',
    });
    prompt.setOrigin(0.5); prompt.setDepth(10);
    this.tweens.add({
      targets: prompt, alpha: 0.3, duration: 700, yoyo: true, repeat: -1,
    });

    // Only start menu music if not already playing
    const mm = MusicManager.get();
    if (mm.currentTrack !== 'menu') {
      mm.playMenuMusic();
    }

    // Input
    this.inputManager = new InputManager(this, { preset: 'menu' });
    this.spaceKey = this.input.keyboard.addKey('SPACE');
    this.enterKey = this.input.keyboard.addKey('ENTER');
    this.upKey = this.input.keyboard.addKey('UP');
    this.downKey = this.input.keyboard.addKey('DOWN');
    this.wKey = this.input.keyboard.addKey('W');
    this.sKey = this.input.keyboard.addKey('S');
    this.mKey = this.input.keyboard.addKey('M');
    this.hKey = this.input.keyboard.addKey('H');

    // On mobile, make level items tappable
    if (this.inputManager.mobile) {
      for (let i = 0; i < this.levelTexts.length; i++) {
        this.levelTexts[i].setInteractive();
        this.levelTexts[i].on('pointerdown', () => {
          if (this.selectedIndex === i) {
            // Double tap = start level (check unlock first)
            if (i >= this._unlockedLevels) {
              if (!this._lockMsg) {
                this._lockMsg = this.add.text(W / 2, H - 80, 'COMPLETE PREVIOUS LEVEL TO UNLOCK', {
                  fontFamily: 'monospace', fontSize: '12px', color: '#ff4444',
                }).setOrigin(0.5).setDepth(20);
                this.time.delayedCall(2000, () => {
                  if (this._lockMsg) { this._lockMsg.destroy(); this._lockMsg = null; }
                });
              }
              return;
            }
            SoundManager.get().playMenuSelect();
            const targetScene = LEVELS[i].scene;
            MusicManager.get().stop(0.3);
            this.cameras.main.fadeOut(300, 0, 0, 0);
            this.time.delayedCall(300, () => this.scene.start(targetScene));
          } else {
            this.selectedIndex = i;
            this._updateSelection();
            SoundManager.get().playTypewriterClick();
          }
        });
      }
    }
  }

  _updateSelection() {
    for (let i = 0; i < LEVELS.length; i++) {
      const selected = i === this.selectedIndex;
      const locked = i >= this._unlockedLevels;
      this.levelTexts[i].setColor(locked ? '#444444' : (selected ? '#33FF33' : '#AA8833'));
      this.selectorArrows[i].setAlpha(selected ? 1 : 0);
    }
    this._updateDescription();
    this._updatePreview();
  }

  _updateDifficultyUI() {
    const dm = DifficultyManager.get();
    const isHard = dm.isHard();
    if (this.diffTexts && this.diffTexts.length === 2) {
      this.diffTexts[0].setColor(isHard ? '#555555' : '#44ff44').setFontStyle(isHard ? 'normal' : 'bold');
      this.diffTexts[1].setColor(isHard ? '#ff4444' : '#555555').setFontStyle(isHard ? 'bold' : 'normal');
    }
    if (this.hardModeText) {
      this.hardModeText.setText(isHard ? 'HARD MODE: ON' : 'HARD MODE: OFF  (H to toggle)');
      this.hardModeText.setColor(isHard ? '#ff4444' : '#555555');
    }
  }

  _updateDescription() {
    const descs = [
      'Infiltrate the Tehran rooftops.\nReach the target. Plant the device. Escape alive.',
      'Sabotage enemy port operations in Beirut.\nSwap cargo manifests. Escape before detection.',
      'Precision aerial bombardment over Lebanon.\nDestroy the underground bunker. Return to carrier.',
      'Drone reconnaissance and tunnel infiltration in Gaza.\nMap tunnels. Navigate underground. Destroy command center.',
      'B-2 Stealth Bomber night mission over Iran.\nPenetrate defenses. Destroy Fordow nuclear facility.',
      'The final confrontation. Destroy The Commander.\nEnd the war. No retreat. No surrender.',
    ];
    this.descText.setText(descs[this.selectedIndex]);
  }

  update(time, delta) {
    const im = this.inputManager;
    im.update();

    // Mute toggle (syncs both SFX and music)
    if (Phaser.Input.Keyboard.JustDown(this.mKey) || im.justDown('mute')) {
      const muted = SoundManager.get().toggleMute();
      MusicManager.get().setMuted(muted);
    }

    // Hard mode toggle
    if (Phaser.Input.Keyboard.JustDown(this.hKey)) {
      const dm = DifficultyManager.get();
      if (dm.isUnlocked()) {
        dm.toggle();
        SoundManager.get().playTypewriterClick();
        this._updateDifficultyUI();
      }
    }

    // Navigation
    if (Phaser.Input.Keyboard.JustDown(this.upKey) || Phaser.Input.Keyboard.JustDown(this.wKey) || im.justDown('up')) {
      this.selectedIndex = (this.selectedIndex - 1 + LEVELS.length) % LEVELS.length;
      this._updateSelection();
      SoundManager.get().playTypewriterClick();
      this.time.delayedCall(80, () => SoundManager.get().playRadarBlip());
    }
    if (Phaser.Input.Keyboard.JustDown(this.downKey) || Phaser.Input.Keyboard.JustDown(this.sKey) || im.justDown('down')) {
      this.selectedIndex = (this.selectedIndex + 1) % LEVELS.length;
      this._updateSelection();
      SoundManager.get().playTypewriterClick();
      this.time.delayedCall(80, () => SoundManager.get().playRadarBlip());
    }

    // Start selected level
    if (Phaser.Input.Keyboard.JustDown(this.spaceKey) || Phaser.Input.Keyboard.JustDown(this.enterKey) || im.justDown('primary')) {
      if (this.selectedIndex >= this._unlockedLevels) {
        // Show locked message
        if (!this._lockMsg) {
          this._lockMsg = this.add.text(W / 2, H - 80, 'COMPLETE PREVIOUS LEVEL TO UNLOCK', {
            fontFamily: 'monospace', fontSize: '12px', color: '#ff4444',
          }).setOrigin(0.5).setDepth(20);
          this.time.delayedCall(2000, () => {
            if (this._lockMsg) { this._lockMsg.destroy(); this._lockMsg = null; }
          });
        }
        return;
      }
      SoundManager.get().playMenuSelect();
      const targetScene = LEVELS[this.selectedIndex].scene;
      MusicManager.get().stop(0.3);
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.time.delayedCall(300, () => this.scene.start(targetScene));
    }
  }

  // =====================================================================
  // PREVIEW PANEL -- visual preview of each level on the right side
  // =====================================================================

  _createPreviewPanel() {
    const px = 680, py = 170, pw = 250, ph = 310;

    // Panel background
    this._previewBg = this.add.graphics().setDepth(9);
    this._previewBg.fillStyle(0x0a0a1e, 0.85);
    this._previewBg.fillRoundedRect(px - pw / 2, py, pw, ph, 8);
    this._previewBg.lineStyle(2, 0x00e5ff, 0.5);
    this._previewBg.strokeRoundedRect(px - pw / 2, py, pw, ph, 8);

    // Mini scene preview — AI panorama thumbnail (cin_* reused) + border overlay
    const previewGfxX = px - 100;
    const previewGfxY = py + 15;
    this._previewImg = this.add.image(previewGfxX + 100, previewGfxY + 60, 'cin_tehran')
      .setDepth(9.5);
    this._previewImg.setDisplaySize(200, 120);
    this._previewGfx = this.add.graphics().setDepth(10);
    this._previewGfx.setPosition(previewGfxX, previewGfxY);

    // Level name text
    this._previewName = this.add.text(px, py + 150, '', {
      fontFamily: 'monospace', fontSize: '13px', color: '#FFD700',
      fontStyle: 'bold',
      shadow: { offsetX: 0, offsetY: 0, color: '#FFD700', blur: 4, fill: true },
    }).setOrigin(0.5).setDepth(10);

    // Level description text
    this._previewDesc = this.add.text(px, py + 190, '', {
      fontFamily: 'monospace', fontSize: '10px', color: '#88AACC',
      align: 'center', lineSpacing: 3,
      wordWrap: { width: pw - 30 },
    }).setOrigin(0.5, 0).setDepth(10);

    // Difficulty indicator
    this._previewDifficulty = this.add.text(px, py + 260, '', {
      fontFamily: 'monospace', fontSize: '12px', color: '#ff6644',
    }).setOrigin(0.5).setDepth(10);

    // Star rating from localStorage
    this._previewStars = this.add.text(px, py + 282, '', {
      fontFamily: 'monospace', fontSize: '14px', color: '#FFD700',
      shadow: { offsetX: 0, offsetY: 0, color: '#FFD700', blur: 4, fill: true },
    }).setOrigin(0.5).setDepth(10);

    // Initial draw
    this._updatePreview();
  }

  _updatePreview() {
    const idx = this.selectedIndex;

    // Fade effect: quickly pulse alpha
    const panelElements = [this._previewBg, this._previewImg, this._previewGfx, this._previewName, this._previewDesc, this._previewDifficulty, this._previewStars];

    // Swap the AI panorama thumbnail to match the selected level
    const PREVIEW_TEX = ['cin_tehran', 'cin_lebanon_coast', 'cin_destroyed_city', 'cin_natanz', 'cin_fortress'];
    if (this._previewImg && this.textures.exists(PREVIEW_TEX[idx])) {
      this._previewImg.setTexture(PREVIEW_TEX[idx]);
      this._previewImg.setDisplaySize(200, 120);
    }
    for (const el of panelElements) {
      if (el) {
        el.setAlpha(0);
        this.tweens.add({ targets: el, alpha: 1, duration: 200 });
      }
    }

    // Draw mini preview
    this._drawLevelPreview(this._previewGfx, idx);

    // Level names
    const names = [
      'TEHRAN GUEST ROOM',
      'DEEP STRIKE',
      'LAST CHAIR',
      'MOUNTAIN BREAKER',
      'ENDGAME',
    ];
    this._previewName.setText(names[idx]);

    // Short descriptions
    const descs = [
      'Rooftop platformer +\nBomberman infiltration.\nEliminate Foam Beard.',
      'F-15 aerial bombing.\nDestroy the bunker.\nLand on the carrier.',
      'Drone city nav +\nboss fight. Infiltrate.\nEliminate Yahya Sinwar.',
      'B-2 stealth through\nradar fields. Target lock.\nDestroy nuclear facility.',
      'Final boss battle.\n3-phase aerial assault.\nEnd the regime.',
    ];
    this._previewDesc.setText(descs[idx]);

    // Difficulty (1-5 skulls)
    const difficulties = [2, 3, 4, 4, 5];
    let diffStr = 'DIFF: ';
    for (let d = 0; d < 5; d++) {
      diffStr += d < difficulties[idx] ? '\u2620' : '\u2022';
    }
    this._previewDifficulty.setText(diffStr);

    // Best star rating from localStorage
    let starStr = '';
    try {
      const saved = localStorage.getItem(`superzion_stars_${idx + 1}`);
      if (saved) {
        const sc = parseInt(saved, 10);
        starStr = 'BEST: ';
        for (let s = 0; s < 3; s++) starStr += s < sc ? '\u2605' : '\u2606';
      }
    } catch (e) {}
    this._previewStars.setText(starStr);
  }

  _drawLevelPreview(gfx, levelIndex) {
    // The AI panorama thumbnail (this._previewImg) now carries the scene;
    // here we just draw the cyan border frame on top of it.
    gfx.clear();
    const pw = 200, ph = 120;
    gfx.lineStyle(1, 0x00e5ff, 0.3);
    gfx.strokeRect(0, 0, pw, ph);
  }
}
