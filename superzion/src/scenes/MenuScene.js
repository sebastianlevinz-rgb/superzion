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

const W = 960;
const H = 540;

const LEVELS = [
  { label: 'LEVEL 1: The Tehran Guest Room', scene: 'IntroCinematicScene' },
  { label: 'LEVEL 2: OPERATION GRIM BEEPER', scene: 'BeirutIntroCinematicScene' },
  { label: 'LEVEL 3: OPERATION DEEP STRIKE', scene: 'DeepStrikeIntroCinematicScene' },
  { label: 'LEVEL 4: OPERATION LAST CHAIR', scene: 'UndergroundIntroCinematicScene' },
  { label: 'LEVEL 5: OPERATION MOUNTAIN BREAKER', scene: 'MountainBreakerIntroCinematicScene' },
  { label: 'LEVEL 6: OPERATION ENDGAME', scene: 'LastStandCinematicScene' },
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

    // Halo glow
    const haloGfx = this.add.graphics().setDepth(-5);
    const haloR = 220;
    haloGfx.fillStyle(0xFFD700, 0.05);
    haloGfx.fillTriangle(
      starCx, starCy - haloR,
      starCx - haloR * 0.866, starCy + haloR * 0.5,
      starCx + haloR * 0.866, starCy + haloR * 0.5
    );
    haloGfx.fillTriangle(
      starCx, starCy + haloR,
      starCx - haloR * 0.866, starCy - haloR * 0.5,
      starCx + haloR * 0.866, starCy - haloR * 0.5
    );

    // Main star fill
    const starGfx = this.add.graphics().setDepth(-4);
    starGfx.fillStyle(0xFFD700, 0.25);
    starGfx.fillTriangle(
      starCx, starCy - starR,
      starCx - starR * 0.866, starCy + starR * 0.5,
      starCx + starR * 0.866, starCy + starR * 0.5
    );
    starGfx.fillTriangle(
      starCx, starCy + starR,
      starCx - starR * 0.866, starCy - starR * 0.5,
      starCx + starR * 0.866, starCy - starR * 0.5
    );
    // Stroke
    starGfx.lineStyle(2, 0xFFD700, 0.6);
    starGfx.beginPath();
    starGfx.moveTo(starCx, starCy - starR);
    starGfx.lineTo(starCx - starR * 0.866, starCy + starR * 0.5);
    starGfx.lineTo(starCx + starR * 0.866, starCy + starR * 0.5);
    starGfx.closePath();
    starGfx.strokePath();
    starGfx.beginPath();
    starGfx.moveTo(starCx, starCy + starR);
    starGfx.lineTo(starCx - starR * 0.866, starCy - starR * 0.5);
    starGfx.lineTo(starCx + starR * 0.866, starCy - starR * 0.5);
    starGfx.closePath();
    starGfx.strokePath();

    // Pulse alpha
    this.tweens.add({
      targets: starGfx, alpha: { from: 0.2, to: 0.3 },
      duration: 3500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });

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

      // Level label -- selected = bright green, unselected = dim amber
      const label = this.add.text(320, y, LEVELS[i].label, {
        fontFamily: 'monospace', fontSize: '18px',
        color: i === 0 ? '#33FF33' : '#AA8833',
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
      this.levelTexts[i].setColor(selected ? '#33FF33' : '#AA8833');
      this.selectorArrows[i].setAlpha(selected ? 1 : 0);
    }
    this._updateDescription();
    this._updatePreview();
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

    // Mini scene preview graphics
    const previewGfxX = px - 100;
    const previewGfxY = py + 15;
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
    const panelElements = [this._previewBg, this._previewGfx, this._previewName, this._previewDesc, this._previewDifficulty, this._previewStars];
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
      'GRIM BEEPER',
      'DEEP STRIKE',
      'LAST CHAIR',
      'MOUNTAIN BREAKER',
      'ENDGAME',
    ];
    this._previewName.setText(names[idx]);

    // Short descriptions
    const descs = [
      'Rooftop platformer.\nInfiltrate. Plant device.\nEscape alive.',
      'Stealth top-down.\nSabotage pager shipment.\nAvoid detection.',
      'Aerial side-scroller.\nBomb the bunker.\nReturn to base.',
      'Drone reconnaissance.\nNavigate tunnels.\nDestroy command center.',
      'Stealth bomber run.\nPenetrate defenses.\nDestroy Fordow facility.',
      'Final confrontation.\nEnd the regime.\nNo retreat.',
    ];
    this._previewDesc.setText(descs[idx]);

    // Difficulty (1-5 skulls)
    const difficulties = [2, 3, 3, 4, 4, 5];
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
    gfx.clear();
    const pw = 200, ph = 120;

    // Border
    gfx.lineStyle(1, 0x00e5ff, 0.3);
    gfx.strokeRect(0, 0, pw, ph);

    switch (levelIndex) {
      case 0: // Level 1 -- Tehran rooftops at night
        // Night sky
        gfx.fillStyle(0x1a1a2e);
        gfx.fillRect(0, 0, pw, ph);
        // Moon
        gfx.fillStyle(0xcccc88, 0.8);
        gfx.fillCircle(160, 22, 10);
        // Stars
        gfx.fillStyle(0xffffff, 0.5);
        gfx.fillCircle(30, 15, 1); gfx.fillCircle(80, 10, 1);
        gfx.fillCircle(120, 25, 1); gfx.fillCircle(50, 30, 1);
        // Rooftop silhouettes
        gfx.fillStyle(0x333344);
        gfx.fillRect(5, 65, 35, 55);
        gfx.fillRect(50, 55, 40, 65);
        gfx.fillRect(100, 60, 35, 60);
        gfx.fillRect(145, 50, 45, 70);
        // Windows (dim yellow)
        gfx.fillStyle(0x665522, 0.5);
        gfx.fillRect(15, 75, 5, 5); gfx.fillRect(25, 80, 5, 5);
        gfx.fillRect(60, 65, 5, 5); gfx.fillRect(75, 70, 5, 5);
        gfx.fillRect(155, 60, 5, 5); gfx.fillRect(170, 65, 5, 5);
        // Small player figure (green)
        gfx.fillStyle(0x33ff33);
        gfx.fillRect(72, 50, 4, 7);
        // Ground
        gfx.fillStyle(0x222233);
        gfx.fillRect(0, ph - 5, pw, 5);
        break;

      case 1: // Level 2 -- Beirut port top-down
        // Floor
        gfx.fillStyle(0x0a1a0a);
        gfx.fillRect(0, 0, pw, ph);
        // Grid lines (floor plan)
        gfx.lineStyle(1, 0x1a3a1a, 0.4);
        for (let x = 0; x < pw; x += 20) gfx.lineBetween(x, 0, x, ph);
        for (let y = 0; y < ph; y += 20) gfx.lineBetween(0, y, pw, y);
        // Rooms (walls)
        gfx.lineStyle(2, 0x446644, 0.6);
        gfx.strokeRect(10, 10, 50, 40);
        gfx.strokeRect(80, 15, 45, 35);
        gfx.strokeRect(140, 5, 50, 45);
        gfx.strokeRect(30, 65, 55, 40);
        gfx.strokeRect(110, 70, 60, 40);
        // Vision cones (green triangles)
        gfx.fillStyle(0x00ff00, 0.15);
        gfx.fillTriangle(35, 30, 15, 50, 55, 50);
        gfx.fillTriangle(150, 55, 130, 75, 170, 75);
        // Guard dots (red)
        gfx.fillStyle(0xff4444);
        gfx.fillCircle(35, 28, 3);
        gfx.fillCircle(150, 52, 3);
        // Pager icons (small yellow rectangles)
        gfx.fillStyle(0xffcc00, 0.7);
        gfx.fillRect(90, 28, 6, 4);
        gfx.fillRect(45, 78, 6, 4);
        gfx.fillRect(135, 82, 6, 4);
        break;

      case 2: // Level 3 -- Aerial bombardment side-view
        // Sky gradient
        gfx.fillStyle(0x1a2a4a);
        gfx.fillRect(0, 0, pw, ph * 0.7);
        gfx.fillStyle(0x0a1a2a);
        gfx.fillRect(0, 0, pw, ph * 0.3);
        // Stars
        gfx.fillStyle(0xffffff, 0.4);
        gfx.fillCircle(20, 15, 1); gfx.fillCircle(80, 8, 1);
        gfx.fillCircle(140, 20, 1); gfx.fillCircle(170, 10, 1);
        // F-15 silhouette
        gfx.fillStyle(0x556688);
        gfx.beginPath();
        gfx.moveTo(40, 38);
        gfx.lineTo(55, 35); gfx.lineTo(90, 34);
        gfx.lineTo(95, 32); gfx.lineTo(95, 40);
        gfx.lineTo(90, 39); gfx.lineTo(55, 40);
        gfx.closePath(); gfx.fill();
        // Wings
        gfx.beginPath();
        gfx.moveTo(65, 34); gfx.lineTo(80, 22);
        gfx.lineTo(85, 24); gfx.lineTo(73, 34);
        gfx.closePath(); gfx.fill();
        gfx.beginPath();
        gfx.moveTo(65, 40); gfx.lineTo(80, 52);
        gfx.lineTo(85, 50); gfx.lineTo(73, 40);
        gfx.closePath(); gfx.fill();
        // Exhaust
        gfx.fillStyle(0xff8844, 0.4);
        gfx.fillCircle(97, 37, 4);
        // Mountain target below
        gfx.fillStyle(0x2a3a2a);
        gfx.beginPath();
        gfx.moveTo(0, ph);
        gfx.lineTo(40, ph * 0.75); gfx.lineTo(100, ph * 0.65);
        gfx.lineTo(160, ph * 0.72); gfx.lineTo(pw, ph * 0.8);
        gfx.lineTo(pw, ph); gfx.closePath(); gfx.fill();
        // Target X
        gfx.lineStyle(2, 0xff0000, 0.6);
        gfx.lineBetween(95, ph * 0.68, 105, ph * 0.78);
        gfx.lineBetween(105, ph * 0.68, 95, ph * 0.78);
        break;

      case 3: // Level 4 -- Top-down room with drone
        // Dark floor
        gfx.fillStyle(0x121218);
        gfx.fillRect(0, 0, pw, ph);
        // Tunnel walls
        gfx.fillStyle(0x2a2a30, 0.7);
        gfx.fillRect(0, 0, pw, 8);
        gfx.fillRect(0, ph - 8, pw, 8);
        gfx.fillRect(0, 0, 8, ph);
        gfx.fillRect(pw - 8, 0, 8, ph);
        // Interior walls
        gfx.fillStyle(0x2a2a30, 0.5);
        gfx.fillRect(60, 8, 4, 40);
        gfx.fillRect(60, 70, 4, ph - 78);
        gfx.fillRect(130, 8, 4, 60);
        gfx.fillRect(130, 90, 4, ph - 98);
        // Armchair (small brown shape)
        gfx.fillStyle(0x554422);
        gfx.fillRect(150, 25, 14, 14);
        gfx.fillStyle(0x443311);
        gfx.fillRect(148, 22, 18, 4);
        // Boss figure peeking (red dot)
        gfx.fillStyle(0xff4444);
        gfx.fillCircle(157, 32, 4);
        // Drone (small cyan shape)
        gfx.fillStyle(0x00cccc);
        gfx.fillRect(30, 55, 12, 4);
        gfx.fillStyle(0x88dddd);
        gfx.fillRect(26, 56, 6, 2);
        gfx.fillRect(42, 56, 6, 2);
        // Camera eye
        gfx.fillStyle(0x00ffff, 0.8);
        gfx.fillCircle(36, 57, 2);
        break;

      case 4: // Level 5 -- B-2 over water/mountains at night
        // Night sky
        gfx.fillStyle(0x0a0a1e);
        gfx.fillRect(0, 0, pw, ph * 0.4);
        // Water
        gfx.fillStyle(0x0a1a3a);
        gfx.fillRect(0, ph * 0.4, pw, ph * 0.35);
        // Water highlights
        gfx.lineStyle(1, 0x1a3a5a, 0.3);
        gfx.lineBetween(10, ph * 0.5, 50, ph * 0.5);
        gfx.lineBetween(80, ph * 0.55, 130, ph * 0.55);
        gfx.lineBetween(150, ph * 0.48, 190, ph * 0.48);
        // Stars
        gfx.fillStyle(0xffffff, 0.3);
        gfx.fillCircle(20, 10, 1); gfx.fillCircle(60, 18, 1);
        gfx.fillCircle(110, 8, 1); gfx.fillCircle(175, 15, 1);
        // B-2 flying wing (top-down)
        gfx.fillStyle(0x333344, 0.9);
        gfx.beginPath();
        gfx.moveTo(100, 20); // nose
        gfx.lineTo(145, 30);
        gfx.lineTo(135, 34);
        gfx.lineTo(100, 28);
        gfx.lineTo(65, 34);
        gfx.lineTo(55, 30);
        gfx.closePath(); gfx.fill();
        // Mountain target ahead
        gfx.fillStyle(0x2a3a2a);
        gfx.beginPath();
        gfx.moveTo(0, ph);
        gfx.lineTo(50, ph * 0.75); gfx.lineTo(100, ph * 0.65);
        gfx.lineTo(150, ph * 0.72); gfx.lineTo(pw, ph * 0.78);
        gfx.lineTo(pw, ph); gfx.closePath(); gfx.fill();
        // Green glow (nuke facility)
        gfx.fillStyle(0x22ff22, 0.12);
        gfx.fillCircle(100, ph * 0.72, 15);
        break;

      case 5: // Level 6 -- Beirut skyline side-view
        // Blood sky
        gfx.fillStyle(0x1a0808);
        gfx.fillRect(0, 0, pw, ph);
        gfx.fillStyle(0x2a0a0a, 0.8);
        gfx.fillRect(0, 0, pw, ph * 0.5);
        // Distant fire glow
        gfx.fillStyle(0xff4400, 0.12);
        gfx.fillCircle(40, ph * 0.4, 20);
        gfx.fillCircle(170, ph * 0.35, 15);
        // City skyline silhouettes
        gfx.fillStyle(0x0a0505);
        gfx.fillRect(10, ph * 0.45, 25, ph * 0.55);
        gfx.fillRect(40, ph * 0.5, 20, ph * 0.5);
        gfx.fillRect(70, ph * 0.4, 30, ph * 0.6);
        gfx.fillRect(110, ph * 0.35, 35, ph * 0.65);
        gfx.fillRect(155, ph * 0.42, 25, ph * 0.58);
        // Fortress (center, larger)
        gfx.fillStyle(0x1a0a0a);
        gfx.fillRect(85, ph * 0.3, 50, ph * 0.7);
        gfx.fillRect(80, ph * 0.28, 60, 8);
        // Fighter approaching from left
        gfx.fillStyle(0x00ccff, 0.6);
        gfx.beginPath();
        gfx.moveTo(15, ph * 0.3);
        gfx.lineTo(25, ph * 0.28);
        gfx.lineTo(25, ph * 0.32);
        gfx.closePath(); gfx.fill();
        // Exhaust trail
        gfx.lineStyle(1, 0x00ccff, 0.3);
        gfx.lineBetween(5, ph * 0.3, 15, ph * 0.3);
        // Boss figure silhouette (on fortress)
        gfx.fillStyle(0x1a0505);
        gfx.fillCircle(110, ph * 0.25, 5);
        gfx.fillRect(107, ph * 0.28, 6, 10);
        break;
    }
  }
}
