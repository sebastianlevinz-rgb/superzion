// ═══════════════════════════════════════════════════════════════
// DroneScene — Level 4: Operation Underground
// Phase 1: City precision minigame (navigate to glowing window)
// Phase 2: Boss fight — YAHYA SINWAR (top-down destroyed room)
//   Yahya Sinwar hides behind armchair (phase 1), roams and throws
//   objects (phase 2), then charges desperately (phase 3).
//   Drone uses SPACE to shoot, X for missiles, SHIFT to dash.
// + Victory/Results overlay
// ═══════════════════════════════════════════════════════════════

import Phaser from 'phaser';
import SoundManager from '../systems/SoundManager.js';
import MusicManager from '../systems/MusicManager.js';
import DifficultyManager from '../systems/DifficultyManager.js';
import {
  createDroneSprite, createDaytimeSky,
  createRuinedCityTile, createRuinedCityTile2, createTargetBuildingTexture,
  createCommandRoom, createArmchairTexture, createArmchairSideTexture,
} from '../utils/DroneTextures.js';
import { showVictoryScreen, showDefeatScreen } from '../ui/EndScreen.js';
import { showControlsOverlay, showTutorialOverlay } from '../ui/ControlsOverlay.js';

const W = 960;
const H = 540;

// City precision minigame constants
const CITY_DRONE_SPEED = 200;     // player movement speed against wind
const DRONE_SIZE = 12;            // collision half-size (radius)
const WIND_CHANGE_INTERVAL = 2.5; // seconds between wind direction changes
const WIND_STRENGTH_MIN = 45;     // min wind push px/s (increased 50%)
const WIND_STRENGTH_MAX = 90;     // max wind push px/s (increased 50%)
const DEBRIS_SPAWN_RATE = 1.8;    // debris per second (increased 50%)
const DEBRIS_FALL_SPEED_MIN = 100;
const DEBRIS_FALL_SPEED_MAX = 150;
const DEBRIS_BOUNCE_DIST = 30;    // px knockback on debris hit
const WINDOW_X = 740;
const WINDOW_Y = 250;
const WINDOW_SIZE = 40;           // decreased 20% for harder entry

// Boss fight (top-down destroyed room)
const BOSS_DRONE_SPEED = 200;      // drone movement speed
const DRONE_SHOOT_COOLDOWN = 0.25; // seconds between bullets
const DRONE_BULLET_SPEED = 300;    // bullet speed toward boss
const DRONE_BULLET_RADIUS = 4;     // small cyan circle
const DRONE_MISSILE_COOLDOWN = 3;  // seconds between missiles
const DRONE_MISSILE_SPEED = 200;   // missile speed
const DRONE_MISSILE_RADIUS = 8;    // larger red circle
const DRONE_DASH_DIST = 100;       // dash distance in px
const DRONE_DASH_COOLDOWN = 1.0;   // seconds
const DRONE_DASH_DURATION = 0.15;  // seconds of invuln during dash

const BOSS_BASE_HP = 30;
const BOSS_DISPLAY = 80;           // boss sprite display size
const BOSS_BULLET_DMG = 1;         // bullet damage to boss
const BOSS_MISSILE_DMG = 5;        // missile damage to boss
const BOSS_THROW_DMG = 2;          // projectile damage to drone
const BOSS_CHARGE_DMG = 4;         // charge damage to drone
const BOSS_THROW_SPEED = 250;      // thrown object speed px/s

// Phase thresholds (fraction of max HP)
const BOSS_PHASE2_THRESHOLD = 0.6; // below 60% HP
const BOSS_PHASE3_THRESHOLD = 0.3; // below 30% HP

// Phase 1: hiding behind armchair
const BOSS_P1_HIDE_MIN = 1.5;
const BOSS_P1_HIDE_MAX = 2.0;
const BOSS_P1_PEEK_DUR = 0.5;
const BOSS_P1_PEEK_RISE = 0.3;

// Phase 2: roaming the room
const BOSS_P2_SPEED = 100;
const BOSS_P2_THROW_INTERVAL = 1.5;
const BOSS_P2_PROJ_SIZE = 40;
const BOSS_P2_ARMCHAIR_CHANCE = 0.2; // 20% chance to push armchair

// Phase 3: desperate mode
const BOSS_P3_SPEED = 150;
const BOSS_P3_THROW_INTERVAL = 1.0;
const BOSS_P3_PROJ_SIZE = 48;
const BOSS_P3_CHARGE_SPEED = 250;
const BOSS_P3_CHARGE_INTERVAL = 4.0;
const BOSS_P3_CHARGE_DURATION = 1.0;

// Room bounds (top-down, full screen with wall insets)
const ROOM_WALL = 40;             // wall thickness
const ROOM_LEFT = ROOM_WALL;
const ROOM_RIGHT = W - ROOM_WALL;
const ROOM_TOP = ROOM_WALL;
const ROOM_BOTTOM = H - ROOM_WALL;

// Armchair initial position
const ARMCHAIR_X = 580;
const ARMCHAIR_Y = 280;
const ARMCHAIR_W = 80;
const ARMCHAIR_H = 60;

// ═══════════════════════════════════════════════════════════════
// BOSS TEXTURE GENERATORS (inline — only DroneScene.js modified)
// ═══════════════════════════════════════════════════════════════

function _generateBossTexture(scene, key, expression) {
  if (scene.textures.exists(key)) return;

  const s = 128;
  const c = document.createElement('canvas');
  c.width = s; c.height = s;
  const ctx = c.getContext('2d');
  const cx = s / 2; // 64

  // ── Skin tones by expression ──
  let skinBase, skinDark, skinLight;
  if (expression === 'furious') {
    skinBase = '#B07048'; skinDark = '#8A5030'; skinLight = '#D08868';
  } else if (expression === 'angry') {
    skinBase = '#BA8858'; skinDark = '#9A6A40'; skinLight = '#D0A070';
  } else if (expression === 'dead') {
    skinBase = '#8A8A7A'; skinDark = '#6A6A5A'; skinLight = '#A0A090';
  } else {
    skinBase = '#C4956A'; skinDark = '#A07850'; skinLight = '#D8AA80';
  }

  // ── Layout (CABEZÓN: ~40% head, ~60% body) ──
  const headCY = 28;      // head center Y
  const headRX = 20;      // head width radius
  const headRY = 28;      // head height radius — increased 15% for feature spread
  const neckTop = headCY + headRY; // 56
  const shoulderY = 62;
  const torsoBottom = 100;
  const legBottom = 120;

  // ═══════════════════════════════════════════
  // BODY (drawn first, behind head)
  // ═══════════════════════════════════════════

  // ── Legs (dark pants) ──
  ctx.fillStyle = '#1A1A1A';
  ctx.fillRect(cx - 12, torsoBottom, 10, legBottom - torsoBottom);
  ctx.fillRect(cx + 2, torsoBottom, 10, legBottom - torsoBottom);
  // Shoes
  ctx.fillStyle = '#0A0A14';
  ctx.fillRect(cx - 14, legBottom, 13, 5);
  ctx.fillRect(cx + 1, legBottom, 13, 5);

  // ── Torso (dark suit — distinct from pants) ──
  const suitColor = '#2A2A2A';
  ctx.fillStyle = suitColor;
  ctx.beginPath();
  ctx.moveTo(cx - 24, shoulderY);
  ctx.lineTo(cx + 24, shoulderY);
  ctx.lineTo(cx + 20, torsoBottom);
  ctx.lineTo(cx - 20, torsoBottom);
  ctx.closePath();
  ctx.fill();

  // Waistline (1px line between suit and pants)
  ctx.strokeStyle = '#111111';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx - 20, torsoBottom);
  ctx.lineTo(cx + 20, torsoBottom);
  ctx.stroke();

  // Shoulders
  ctx.fillStyle = '#333333';
  ctx.beginPath();
  ctx.moveTo(cx - 28, shoulderY);
  ctx.lineTo(cx - 20, shoulderY - 3);
  ctx.lineTo(cx + 20, shoulderY - 3);
  ctx.lineTo(cx + 28, shoulderY);
  ctx.lineTo(cx + 26, shoulderY + 7);
  ctx.lineTo(cx - 26, shoulderY + 7);
  ctx.closePath();
  ctx.fill();

  // Lapels (V-shape, lighter than suit)
  ctx.fillStyle = '#4A4A4A';
  ctx.beginPath();
  ctx.moveTo(cx - 6, shoulderY - 1);
  ctx.lineTo(cx - 12, shoulderY + 3);
  ctx.lineTo(cx - 8, shoulderY + 24);
  ctx.lineTo(cx - 2, shoulderY + 20);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(cx + 6, shoulderY - 1);
  ctx.lineTo(cx + 12, shoulderY + 3);
  ctx.lineTo(cx + 8, shoulderY + 24);
  ctx.lineTo(cx + 2, shoulderY + 20);
  ctx.closePath();
  ctx.fill();
  // Lapel V-lines
  ctx.strokeStyle = '#4A4A4A';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx - 2, shoulderY);
  ctx.lineTo(cx - 9, shoulderY + 22);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx + 2, shoulderY);
  ctx.lineTo(cx + 9, shoulderY + 22);
  ctx.stroke();

  // Buttons (below kefia area)
  ctx.fillStyle = '#555555';
  ctx.beginPath(); ctx.arc(cx, shoulderY + 25, 1.5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx, shoulderY + 32, 1.5, 0, Math.PI * 2); ctx.fill();

  // ── Arms (visible at sides, 7px wide) ──
  ctx.fillStyle = '#2E2E2E';
  ctx.fillRect(cx - 33, shoulderY + 2, 7, 28);
  ctx.fillRect(cx + 26, shoulderY + 2, 7, 28);
  // Arm edge highlights
  ctx.strokeStyle = '#383838';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(cx - 26, shoulderY + 2); ctx.lineTo(cx - 26, shoulderY + 30); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx + 26, shoulderY + 2); ctx.lineTo(cx + 26, shoulderY + 30); ctx.stroke();
  // Hands (skin-colored ovals)
  ctx.fillStyle = skinBase;
  ctx.beginPath(); ctx.ellipse(cx - 29, shoulderY + 32, 4, 3, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(cx + 30, shoulderY + 32, 4, 3, 0, 0, Math.PI * 2); ctx.fill();

  // ═══════════════════════════════════════════
  // KEFIA ON SHOULDERS (checkered pattern)
  // ═══════════════════════════════════════════
  const kefW = '#E8E8E8';
  const kefD = '#3A3A3A';

  // Left drape
  ctx.fillStyle = kefW;
  ctx.beginPath();
  ctx.moveTo(cx - 8, neckTop);
  ctx.lineTo(cx - 28, shoulderY + 3);
  ctx.lineTo(cx - 30, shoulderY + 22);
  ctx.lineTo(cx - 22, shoulderY + 26);
  ctx.lineTo(cx - 8, shoulderY + 20);
  ctx.lineTo(cx - 1, shoulderY + 5);
  ctx.closePath();
  ctx.fill();
  // Right drape
  ctx.beginPath();
  ctx.moveTo(cx + 8, neckTop);
  ctx.lineTo(cx + 28, shoulderY + 3);
  ctx.lineTo(cx + 30, shoulderY + 22);
  ctx.lineTo(cx + 22, shoulderY + 26);
  ctx.lineTo(cx + 8, shoulderY + 20);
  ctx.lineTo(cx + 1, shoulderY + 5);
  ctx.closePath();
  ctx.fill();

  // Center neck
  ctx.fillStyle = kefW;
  ctx.beginPath();
  ctx.moveTo(cx - 9, neckTop + 2);
  ctx.lineTo(cx + 9, neckTop + 2);
  ctx.lineTo(cx + 6, shoulderY + 8);
  ctx.lineTo(cx - 6, shoulderY + 8);
  ctx.closePath();
  ctx.fill();

  // Hanging ends (shorter — kefia ends at mid-chest)
  ctx.fillStyle = kefW;
  ctx.fillRect(cx - 5, shoulderY + 8, 4, 12);
  ctx.fillRect(cx + 1, shoulderY + 8, 4, 12);

  // Diagonal crosshatch pattern on left drape
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(cx - 8, neckTop + 4);
  ctx.lineTo(cx - 28, shoulderY + 3);
  ctx.lineTo(cx - 30, shoulderY + 22);
  ctx.lineTo(cx - 22, shoulderY + 26);
  ctx.lineTo(cx - 8, shoulderY + 20);
  ctx.lineTo(cx - 1, shoulderY + 5);
  ctx.closePath();
  ctx.clip();
  ctx.strokeStyle = kefD;
  ctx.lineWidth = 0.7;
  for (let i = -60; i < 100; i += 5) {
    ctx.beginPath();
    ctx.moveTo(cx - 32 + i, shoulderY);
    ctx.lineTo(cx - 32 + i + 30, shoulderY + 30);
    ctx.stroke();
  }
  for (let i = -60; i < 100; i += 5) {
    ctx.beginPath();
    ctx.moveTo(cx + 32 - i, shoulderY);
    ctx.lineTo(cx + 32 - i - 30, shoulderY + 30);
    ctx.stroke();
  }
  ctx.restore();

  // Diagonal crosshatch pattern on right drape
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(cx + 8, neckTop + 4);
  ctx.lineTo(cx + 28, shoulderY + 3);
  ctx.lineTo(cx + 30, shoulderY + 22);
  ctx.lineTo(cx + 22, shoulderY + 26);
  ctx.lineTo(cx + 8, shoulderY + 20);
  ctx.lineTo(cx + 1, shoulderY + 5);
  ctx.closePath();
  ctx.clip();
  ctx.strokeStyle = kefD;
  ctx.lineWidth = 0.7;
  for (let i = -60; i < 100; i += 5) {
    ctx.beginPath();
    ctx.moveTo(cx - 32 + i, shoulderY);
    ctx.lineTo(cx - 32 + i + 30, shoulderY + 30);
    ctx.stroke();
  }
  for (let i = -60; i < 100; i += 5) {
    ctx.beginPath();
    ctx.moveTo(cx + 32 - i, shoulderY);
    ctx.lineTo(cx + 32 - i - 30, shoulderY + 30);
    ctx.stroke();
  }
  ctx.restore();

  // Crosshatch on center neckpiece
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(cx - 9, neckTop + 4);
  ctx.lineTo(cx + 9, neckTop + 4);
  ctx.lineTo(cx + 6, shoulderY + 8);
  ctx.lineTo(cx - 6, shoulderY + 8);
  ctx.closePath();
  ctx.clip();
  ctx.strokeStyle = kefD;
  ctx.lineWidth = 0.7;
  for (let i = -30; i < 40; i += 5) {
    ctx.beginPath();
    ctx.moveTo(cx - 10 + i, neckTop - 2);
    ctx.lineTo(cx - 10 + i + 20, neckTop + 18);
    ctx.stroke();
  }
  for (let i = -30; i < 40; i += 5) {
    ctx.beginPath();
    ctx.moveTo(cx + 10 - i, neckTop - 2);
    ctx.lineTo(cx + 10 - i - 20, neckTop + 18);
    ctx.stroke();
  }
  ctx.restore();

  // Crosshatch on hanging ends
  ctx.save();
  ctx.beginPath();
  ctx.rect(cx - 5, shoulderY + 8, 4, 12);
  ctx.rect(cx + 1, shoulderY + 8, 4, 12);
  ctx.clip();
  ctx.strokeStyle = kefD;
  ctx.lineWidth = 0.7;
  for (let i = -20; i < 30; i += 5) {
    ctx.beginPath();
    ctx.moveTo(cx - 6 + i, shoulderY + 7);
    ctx.lineTo(cx - 6 + i + 14, shoulderY + 21);
    ctx.stroke();
  }
  for (let i = -20; i < 30; i += 5) {
    ctx.beginPath();
    ctx.moveTo(cx + 6 - i, shoulderY + 7);
    ctx.lineTo(cx + 6 - i - 14, shoulderY + 21);
    ctx.stroke();
  }
  ctx.restore();

  // ═══════════════════════════════════════════
  // NECK
  // ═══════════════════════════════════════════
  ctx.fillStyle = skinDark;
  ctx.fillRect(cx - 8, neckTop - 1, 16, shoulderY - neckTop + 3);

  // ═══════════════════════════════════════════
  // HEAD (elongated oval — CABEZÓN)
  // ═══════════════════════════════════════════
  ctx.fillStyle = skinBase;
  ctx.beginPath();
  ctx.ellipse(cx, headCY, headRX, headRY, 0, 0, Math.PI * 2);
  ctx.fill();

  // Outline
  ctx.strokeStyle = 'rgba(0,0,0,0.15)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(cx, headCY, headRX, headRY, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Ears
  ctx.fillStyle = skinBase;
  ctx.beginPath(); ctx.ellipse(cx - headRX - 2, headCY + 3, 3, 5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(cx + headRX + 2, headCY + 3, 3, 5, 0, 0, Math.PI * 2); ctx.fill();

  // ═══════════════════════════════════════════
  // SHORT GRAY HAIR (receding hairline)
  // ═══════════════════════════════════════════
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(cx, headCY, headRX, headRY, 0, 0, Math.PI * 2);
  ctx.clip();

  // Thin hair top
  ctx.fillStyle = '#8A8A8A';
  ctx.beginPath();
  ctx.ellipse(cx, headCY - 3, headRX - 1, headRY - 2, 0, Math.PI, 0, true);
  ctx.fill();

  // Side hair thicker (entradas)
  ctx.fillStyle = '#7A7A7A';
  ctx.beginPath(); ctx.arc(cx - 14, headCY - 12, 8, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + 14, headCY - 12, 8, 0, Math.PI * 2); ctx.fill();

  // Receding center
  ctx.fillStyle = skinBase;
  ctx.beginPath();
  ctx.ellipse(cx, headCY - 10, 11, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  // Hair strands
  ctx.strokeStyle = '#6A6A6A';
  ctx.lineWidth = 0.5;
  for (let i = 0; i < 20; i++) {
    const hx = cx + (Math.random() - 0.5) * 34;
    const hy = headCY - headRY + 3 + Math.random() * 12;
    const dx2 = ((hx - cx) / headRX) ** 2;
    const dy2 = ((hy - headCY) / headRY) ** 2;
    if (dx2 + dy2 < 0.9) {
      ctx.beginPath();
      ctx.moveTo(hx, hy);
      ctx.lineTo(hx + (Math.random() - 0.5) * 2, hy - 1 - Math.random() * 2);
      ctx.stroke();
    }
  }
  ctx.restore();

  // ═══════════════════════════════════════════
  // EYEBROWS — SIGNATURE FEATURE
  // ═══════════════════════════════════════════
  const browY = headCY - headRY * 0.4;  // ~30% from top of head
  const browColor = expression === 'dead' ? '#4A4A4A' : '#111111';
  const browH = 6;   // thick and dominant at 128 scale
  const browW = 18;  // extends beyond eyes on both sides
  const browGap = 3; // almost touching
  // Increased V-angles
  const browAngle = expression === 'furious' ? 0.38 : expression === 'angry' ? 0.30 : 0.22;

  ctx.fillStyle = browColor;

  // Left eyebrow
  ctx.beginPath();
  ctx.moveTo(cx - browGap / 2 - browW, browY - browH / 2 - browAngle * browW / 2);
  ctx.lineTo(cx - browGap / 2, browY - browH / 2 + browAngle * browW / 2 + 1);
  ctx.lineTo(cx - browGap / 2, browY + browH / 2 + browAngle * browW / 2 + 1);
  ctx.lineTo(cx - browGap / 2 - browW, browY + browH / 2 - browAngle * browW / 2);
  ctx.closePath();
  ctx.fill();

  // Right eyebrow
  ctx.beginPath();
  ctx.moveTo(cx + browGap / 2 + browW, browY - browH / 2 - browAngle * browW / 2);
  ctx.lineTo(cx + browGap / 2, browY - browH / 2 + browAngle * browW / 2 + 1);
  ctx.lineTo(cx + browGap / 2, browY + browH / 2 + browAngle * browW / 2 + 1);
  ctx.lineTo(cx + browGap / 2 + browW, browY + browH / 2 - browAngle * browW / 2);
  ctx.closePath();
  ctx.fill();

  // Brow hair strands
  ctx.strokeStyle = browColor;
  ctx.lineWidth = 1;
  for (let i = 0; i < 12; i++) {
    const t = i / 12;
    const lx = cx - browGap / 2 - browW + t * browW;
    const ly = browY + (t - 0.5) * browAngle * browW;
    ctx.beginPath();
    ctx.moveTo(lx, ly - browH / 2);
    ctx.lineTo(lx + (Math.random() - 0.5) * 2, ly + browH / 2 + Math.random());
    ctx.stroke();
    const rx = cx + browGap / 2 + t * browW;
    const ry = browY + (0.5 - t) * browAngle * browW;
    ctx.beginPath();
    ctx.moveTo(rx, ry - browH / 2);
    ctx.lineTo(rx + (Math.random() - 0.5) * 2, ry + browH / 2 + Math.random());
    ctx.stroke();
  }

  // Brow shadow
  ctx.fillStyle = 'rgba(20, 15, 10, 0.3)';
  ctx.beginPath();
  ctx.moveTo(cx - browGap / 2 - browW, browY + browH / 2 - browAngle * browW / 2);
  ctx.lineTo(cx - browGap / 2, browY + browH / 2 + browAngle * browW / 2 + 1);
  ctx.lineTo(cx - browGap / 2, browY + browH / 2 + browAngle * browW / 2 + 3);
  ctx.lineTo(cx - browGap / 2 - browW, browY + browH / 2 - browAngle * browW / 2 + 2);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(cx + browGap / 2 + browW, browY + browH / 2 - browAngle * browW / 2);
  ctx.lineTo(cx + browGap / 2, browY + browH / 2 + browAngle * browW / 2 + 1);
  ctx.lineTo(cx + browGap / 2, browY + browH / 2 + browAngle * browW / 2 + 3);
  ctx.lineTo(cx + browGap / 2 + browW, browY + browH / 2 - browAngle * browW / 2 + 2);
  ctx.closePath();
  ctx.fill();

  // ═══════════════════════════════════════════
  // EYES (small, squinting, intense)
  // ═══════════════════════════════════════════
  const eyeY = browY + browH + 6;  // 5-6px below eyebrows at 128 scale
  const eyeSpacing = 10;

  if (expression === 'dead') {
    ctx.strokeStyle = '#555555';
    ctx.lineWidth = 2;
    for (const side of [-1, 1]) {
      const ex = cx + side * eyeSpacing;
      ctx.beginPath();
      ctx.moveTo(ex - 4, eyeY - 3); ctx.lineTo(ex + 4, eyeY + 3);
      ctx.moveTo(ex + 4, eyeY - 3); ctx.lineTo(ex - 4, eyeY + 3);
      ctx.stroke();
    }
  } else {
    for (const side of [-1, 1]) {
      const ex = cx + side * eyeSpacing;

      // Narrow slit
      ctx.fillStyle = '#E8E4D8';
      ctx.beginPath();
      ctx.moveTo(ex - 6, eyeY);
      ctx.quadraticCurveTo(ex, eyeY - 2, ex + 6, eyeY);
      ctx.quadraticCurveTo(ex, eyeY + 1.5, ex - 6, eyeY);
      ctx.closePath();
      ctx.fill();

      // Dark iris
      ctx.fillStyle = '#1A1A1A';
      ctx.beginPath();
      ctx.arc(ex, eyeY, 2, 0, Math.PI * 2);
      ctx.fill();

      // White highlight
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(ex + 0.5, eyeY - 1, 1, 1);

      // Outline
      ctx.strokeStyle = '#1a0a05';
      ctx.lineWidth = 0.7;
      ctx.beginPath();
      ctx.moveTo(ex - 6, eyeY);
      ctx.quadraticCurveTo(ex, eyeY - 2, ex + 6, eyeY);
      ctx.quadraticCurveTo(ex, eyeY + 1.5, ex - 6, eyeY);
      ctx.closePath();
      ctx.stroke();
    }
  }

  // ═══════════════════════════════════════════
  // NOSE (large, wide, trapezoidal)
  // ═══════════════════════════════════════════
  const noseTop2 = eyeY + 4;
  const noseBot = headCY + headRY * 0.5;  // nose at ~50% of head height

  ctx.fillStyle = '#A07850';
  ctx.beginPath();
  ctx.moveTo(cx - 2, noseTop2);
  ctx.lineTo(cx + 2, noseTop2);
  ctx.lineTo(cx + 6, noseBot - 2);
  ctx.lineTo(cx + 5, noseBot);
  ctx.lineTo(cx - 5, noseBot);
  ctx.lineTo(cx - 6, noseBot - 2);
  ctx.closePath();
  ctx.fill();

  // Bridge highlight
  ctx.fillStyle = skinLight;
  ctx.fillRect(cx - 1, noseTop2 + 1, 2, noseBot - noseTop2 - 4);

  // Nostrils
  ctx.fillStyle = '#3A2A1A';
  ctx.beginPath(); ctx.arc(cx - 3, noseBot - 1, 1.5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + 3, noseBot - 1, 1.5, 0, Math.PI * 2); ctx.fill();

  // ═══════════════════════════════════════════
  // MOUTH (thin frown)
  // ═══════════════════════════════════════════
  const mouthY = headCY + headRY * 0.7;  // mouth at ~70% of head height

  if (expression === 'dead') {
    ctx.strokeStyle = '#6A5A4A';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx - 10, mouthY);
    ctx.lineTo(cx + 10, mouthY + 1);
    ctx.stroke();
  } else {
    ctx.fillStyle = '#8A6A4A';
    ctx.beginPath();
    ctx.moveTo(cx - 10, mouthY);
    ctx.quadraticCurveTo(cx, mouthY + 2, cx + 10, mouthY - 1);
    ctx.quadraticCurveTo(cx, mouthY + 3, cx - 10, mouthY);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#5A4A3A';
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    ctx.moveTo(cx - 10, mouthY);
    ctx.quadraticCurveTo(cx, mouthY + 2, cx + 10, mouthY - 1);
    ctx.stroke();
  }

  // ═══════════════════════════════════════════
  // BEARD (gray, short, compact)
  // ═══════════════════════════════════════════
  if (expression !== 'dead') {
    ctx.fillStyle = '#7A7A7A';
    ctx.beginPath();
    ctx.moveTo(cx - 18, mouthY);
    ctx.quadraticCurveTo(cx - 20, mouthY + 7, cx - 16, headCY + headRY - 1);
    ctx.quadraticCurveTo(cx - 10, headCY + headRY + 4, cx, headCY + headRY + 3);
    ctx.quadraticCurveTo(cx + 10, headCY + headRY + 4, cx + 16, headCY + headRY - 1);
    ctx.quadraticCurveTo(cx + 20, mouthY + 7, cx + 18, mouthY);
    ctx.lineTo(cx + 12, mouthY + 3);
    ctx.lineTo(cx, mouthY + 4);
    ctx.lineTo(cx - 12, mouthY + 3);
    ctx.closePath();
    ctx.fill();

    // Texture
    ctx.fillStyle = '#5A5A5A';
    for (let i = 0; i < 40; i++) {
      const bx = cx + (Math.random() - 0.5) * 32;
      const by = mouthY + 2 + Math.random() * (headCY + headRY - mouthY + 2);
      if (Math.random() > Math.abs(bx - cx) / 24) {
        ctx.fillRect(bx, by, 0.8 + Math.random() * 0.5, 1 + Math.random());
      }
    }
  }

  // ═══════════════════════════════════════════
  // OUTLINE (1px black around head and body)
  // ═══════════════════════════════════════════
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 1;
  // Head outline
  ctx.beginPath();
  ctx.ellipse(cx, headCY, headRX + 1, headRY + 1, 0, 0, Math.PI * 2);
  ctx.stroke();
  // Body silhouette outline
  ctx.beginPath();
  ctx.moveTo(cx - 28, shoulderY);
  ctx.lineTo(cx - 24, shoulderY);
  ctx.lineTo(cx - 20, torsoBottom);
  ctx.lineTo(cx - 12, torsoBottom);
  ctx.lineTo(cx - 12, legBottom);
  ctx.lineTo(cx - 14, legBottom + 5);
  ctx.lineTo(cx + 14, legBottom + 5);
  ctx.lineTo(cx + 12, legBottom);
  ctx.lineTo(cx + 12, torsoBottom);
  ctx.lineTo(cx + 20, torsoBottom);
  ctx.lineTo(cx + 24, shoulderY);
  ctx.lineTo(cx + 28, shoulderY);
  ctx.stroke();

  // ═══════════════════════════════════════════
  // EXPRESSION EFFECTS
  // ═══════════════════════════════════════════
  if (expression === 'angry' || expression === 'furious') {
    ctx.strokeStyle = expression === 'furious' ? '#CC2020' : '#AA5050';
    ctx.lineWidth = expression === 'furious' ? 1.5 : 1;
    ctx.beginPath();
    ctx.moveTo(cx - 14, headCY - 14);
    ctx.lineTo(cx - 10, headCY - 10);
    ctx.lineTo(cx - 12, headCY - 7);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx + 14, headCY - 14);
    ctx.lineTo(cx + 10, headCY - 10);
    ctx.lineTo(cx + 12, headCY - 7);
    ctx.stroke();
  }

  if (expression === 'furious') {
    ctx.fillStyle = 'rgba(180, 20, 10, 0.12)';
    ctx.fillRect(0, 0, s, s);
    ctx.strokeStyle = '#CC2020';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx - headRX + 1, headCY - 1);
    ctx.lineTo(cx - headRX + 3, headCY + 3);
    ctx.lineTo(cx - headRX + 1, headCY + 6);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx + headRX - 1, headCY - 1);
    ctx.lineTo(cx + headRX - 3, headCY + 3);
    ctx.lineTo(cx + headRX - 1, headCY + 6);
    ctx.stroke();
  }

  if (expression === 'dead') {
    ctx.fillStyle = 'rgba(80, 30, 100, 0.4)';
    ctx.beginPath(); ctx.arc(cx - 12, headCY + 2, 5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + 14, headCY + 4, 4, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(50, 25, 15, 0.5)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx - 8, headCY - 16);
    ctx.lineTo(cx - 4, headCY - 6);
    ctx.lineTo(cx - 6, headCY + 2);
    ctx.stroke();
  }

  scene.textures.addCanvas(key, c);
}


function _generateBossProjectileTextures(scene) {
  // All projectile textures are 2x bigger (32px canvas) with bright outlines
  // ── Projectile 0: broken plank / stick (2x bigger) ──
  if (!scene.textures.exists('boss_projectile_0')) {
    const s = 32;
    const c = document.createElement('canvas');
    c.width = s; c.height = s;
    const ctx = c.getContext('2d');
    ctx.save();
    ctx.translate(s / 2, s / 2);
    ctx.rotate(0.3);
    // Bright outline glow
    ctx.shadowColor = '#ffaa00';
    ctx.shadowBlur = 4;
    ctx.fillStyle = '#ba8a4a';
    ctx.fillRect(-14, -4, 28, 8);
    ctx.shadowBlur = 0;
    // Wood grain
    ctx.strokeStyle = '#8a5a2a';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(-12, 0); ctx.lineTo(12, 0); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-10, -2); ctx.lineTo(10, -2); ctx.stroke();
    // Splintered ends
    ctx.fillStyle = '#c09a5a';
    ctx.beginPath(); ctx.moveTo(14, -4); ctx.lineTo(16, 0); ctx.lineTo(14, 4); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-14, -4); ctx.lineTo(-16, 0); ctx.lineTo(-14, 4); ctx.closePath(); ctx.fill();
    // Nail
    ctx.fillStyle = '#aaaaaa';
    ctx.fillRect(4, -8, 2, 4);
    // Bright outline
    ctx.strokeStyle = '#ffcc44';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-14, -4, 28, 8);
    ctx.restore();
    scene.textures.addCanvas('boss_projectile_0', c);
  }

  // ── Projectile 1: brick fragment (2x bigger) ──
  if (!scene.textures.exists('boss_projectile_1')) {
    const s = 32;
    const c = document.createElement('canvas');
    c.width = s; c.height = s;
    const ctx = c.getContext('2d');
    ctx.save();
    ctx.translate(s / 2, s / 2);
    ctx.rotate(-0.2);
    // Bright outline glow
    ctx.shadowColor = '#ff6600';
    ctx.shadowBlur = 4;
    // Irregular brick chunk (doubled coords)
    ctx.fillStyle = '#ba6a4a';
    ctx.beginPath();
    ctx.moveTo(-10, -8);
    ctx.lineTo(8, -10);
    ctx.lineTo(12, -4);
    ctx.lineTo(10, 8);
    ctx.lineTo(-6, 10);
    ctx.lineTo(-12, 4);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
    // Mortar edge
    ctx.fillStyle = '#d0b890';
    ctx.beginPath();
    ctx.moveTo(-12, 4); ctx.lineTo(-10, -8); ctx.lineTo(-6, -6); ctx.lineTo(-8, 2); ctx.closePath();
    ctx.fill();
    // Texture cracks
    ctx.strokeStyle = '#7a4a2a';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(-4, -6); ctx.lineTo(2, 6); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(4, -8); ctx.lineTo(8, 2); ctx.stroke();
    // Bright outline
    ctx.strokeStyle = '#ff8844';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-10, -8); ctx.lineTo(8, -10); ctx.lineTo(12, -4);
    ctx.lineTo(10, 8); ctx.lineTo(-6, 10); ctx.lineTo(-12, 4);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
    scene.textures.addCanvas('boss_projectile_1', c);
  }

  // ── Projectile 2: glass shard (2x bigger) ──
  if (!scene.textures.exists('boss_projectile_2')) {
    const s = 32;
    const c = document.createElement('canvas');
    c.width = s; c.height = s;
    const ctx = c.getContext('2d');
    ctx.save();
    ctx.translate(s / 2, s / 2);
    ctx.rotate(0.5);
    // Bright outline glow
    ctx.shadowColor = '#88ccff';
    ctx.shadowBlur = 5;
    // Jagged glass triangle (doubled coords)
    ctx.fillStyle = 'rgba(180, 220, 240, 0.8)';
    ctx.beginPath();
    ctx.moveTo(0, -12);
    ctx.lineTo(10, 8);
    ctx.lineTo(-2, 12);
    ctx.lineTo(-8, 2);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
    // Highlight / reflection
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(-2, -6); ctx.lineTo(4, 4); ctx.stroke();
    // Bright edge outline
    ctx.strokeStyle = '#aaddff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, -12); ctx.lineTo(10, 8); ctx.lineTo(-2, 12); ctx.lineTo(-8, 2); ctx.closePath();
    ctx.stroke();
    ctx.restore();
    scene.textures.addCanvas('boss_projectile_2', c);
  }

  // ── Projectile 3: metal pipe piece (2x bigger) ──
  if (!scene.textures.exists('boss_projectile_3')) {
    const s = 32;
    const c = document.createElement('canvas');
    c.width = s; c.height = s;
    const ctx = c.getContext('2d');
    ctx.save();
    ctx.translate(s / 2, s / 2);
    ctx.rotate(-0.4);
    // Bright outline glow
    ctx.shadowColor = '#aaaacc';
    ctx.shadowBlur = 4;
    // Pipe cylinder (doubled coords)
    ctx.fillStyle = '#808088';
    ctx.fillRect(-14, -4, 28, 8);
    ctx.shadowBlur = 0;
    // Pipe highlight (rounded feel)
    ctx.fillStyle = '#a0a0b0';
    ctx.fillRect(-12, -4, 24, 2);
    // Pipe shadow
    ctx.fillStyle = '#606068';
    ctx.fillRect(-12, 2, 24, 2);
    // Rusty spots
    ctx.fillStyle = '#aa7a40';
    ctx.fillRect(-6, -2, 4, 4);
    ctx.fillRect(6, 0, 4, 2);
    // Bent/broken end
    ctx.fillStyle = '#707078';
    ctx.beginPath();
    ctx.moveTo(14, -4); ctx.lineTo(16, -6); ctx.lineTo(16, 6); ctx.lineTo(14, 4); ctx.closePath();
    ctx.fill();
    // Thread grooves
    ctx.strokeStyle = '#686870';
    ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.moveTo(-12, -4); ctx.lineTo(-12, 4); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-10, -4); ctx.lineTo(-10, 4); ctx.stroke();
    // Bright outline
    ctx.strokeStyle = '#ccccee';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-14, -4, 28, 8);
    ctx.restore();
    scene.textures.addCanvas('boss_projectile_3', c);
  }

  // Also create the legacy 'boss_projectile' as alias for projectile 0 (2x bigger)
  if (!scene.textures.exists('boss_projectile')) {
    const s = 32;
    const c = document.createElement('canvas');
    c.width = s; c.height = s;
    const ctx = c.getContext('2d');
    ctx.save();
    ctx.translate(s / 2, s / 2);
    ctx.rotate(0.3);
    ctx.shadowColor = '#ffaa00';
    ctx.shadowBlur = 4;
    ctx.fillStyle = '#ba8a4a';
    ctx.fillRect(-14, -4, 28, 8);
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#8a5a2a';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(-12, 0); ctx.lineTo(12, 0); ctx.stroke();
    ctx.fillStyle = '#c09a5a';
    ctx.beginPath(); ctx.moveTo(14, -4); ctx.lineTo(16, 0); ctx.lineTo(14, 4); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#aaaaaa';
    ctx.fillRect(4, -8, 2, 4);
    ctx.strokeStyle = '#ffcc44';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-14, -4, 28, 8);
    ctx.restore();
    scene.textures.addCanvas('boss_projectile', c);
  }
}

// ═══════════════════════════════════════════════════════════════
// BOSS PEEK TEXTURE — only eyebrows + eyes above armchair
// The visual signature of "Yahya Sinwar" hiding behind cover
// ═══════════════════════════════════════════════════════════════
function _generateBossPeekTexture(scene) {
  if (scene.textures.exists('ts_boss4_peek')) return;

  const w = 128, h = 48;
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  const cx = w / 2; // 64

  // Skin tone strip (top of forehead/hair visible)
  const skinBase = '#C4956A';
  ctx.fillStyle = skinBase;
  ctx.beginPath();
  ctx.ellipse(cx, 4, 22, 10, 0, 0, Math.PI);
  ctx.fill();

  // Short gray hair on very top
  ctx.fillStyle = '#8A8A8A';
  ctx.beginPath();
  ctx.ellipse(cx, 2, 20, 8, 0, Math.PI, 0, true);
  ctx.fill();

  // ── THICK EYEBROWS (the star of the show) ──
  const browY = 14;
  const browColor = '#111111';
  const browH = 6;
  const browW = 18;
  const browGap = 3;
  const browAngle = 0.22;

  ctx.fillStyle = browColor;
  // Left eyebrow
  ctx.beginPath();
  ctx.moveTo(cx - browGap / 2 - browW, browY - browH / 2 - browAngle * browW / 2);
  ctx.lineTo(cx - browGap / 2, browY - browH / 2 + browAngle * browW / 2 + 1);
  ctx.lineTo(cx - browGap / 2, browY + browH / 2 + browAngle * browW / 2 + 1);
  ctx.lineTo(cx - browGap / 2 - browW, browY + browH / 2 - browAngle * browW / 2);
  ctx.closePath();
  ctx.fill();
  // Right eyebrow
  ctx.beginPath();
  ctx.moveTo(cx + browGap / 2 + browW, browY - browH / 2 - browAngle * browW / 2);
  ctx.lineTo(cx + browGap / 2, browY - browH / 2 + browAngle * browW / 2 + 1);
  ctx.lineTo(cx + browGap / 2, browY + browH / 2 + browAngle * browW / 2 + 1);
  ctx.lineTo(cx + browGap / 2 + browW, browY + browH / 2 - browAngle * browW / 2);
  ctx.closePath();
  ctx.fill();

  // Brow hair strands
  ctx.strokeStyle = browColor;
  ctx.lineWidth = 1;
  for (let i = 0; i < 10; i++) {
    const t = i / 10;
    const lx = cx - browGap / 2 - browW + t * browW;
    const ly = browY + (t - 0.5) * browAngle * browW;
    ctx.beginPath();
    ctx.moveTo(lx, ly - browH / 2);
    ctx.lineTo(lx + (Math.random() - 0.5) * 2, ly + browH / 2 + Math.random());
    ctx.stroke();
    const rx = cx + browGap / 2 + t * browW;
    const ry = browY + (0.5 - t) * browAngle * browW;
    ctx.beginPath();
    ctx.moveTo(rx, ry - browH / 2);
    ctx.lineTo(rx + (Math.random() - 0.5) * 2, ry + browH / 2 + Math.random());
    ctx.stroke();
  }

  // Brow shadow (1-2px below each brow)
  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
  const peekShadowInner = browY + browH / 2 + browAngle * browW / 2 + 1;
  const peekShadowOuter = browY + browH / 2 - browAngle * browW / 2;
  ctx.beginPath();
  ctx.moveTo(cx - browGap / 2 - browW, peekShadowOuter);
  ctx.lineTo(cx - browGap / 2, peekShadowInner);
  ctx.lineTo(cx - browGap / 2, peekShadowInner + 2);
  ctx.lineTo(cx - browGap / 2 - browW, peekShadowOuter + 2);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(cx + browGap / 2 + browW, peekShadowOuter);
  ctx.lineTo(cx + browGap / 2, peekShadowInner);
  ctx.lineTo(cx + browGap / 2, peekShadowInner + 2);
  ctx.lineTo(cx + browGap / 2 + browW, peekShadowOuter + 2);
  ctx.closePath();
  ctx.fill();

  // ── EYES (squinting, intense, peeking) ──
  const eyeY = browY + browH + 4;
  for (const side of [-1, 1]) {
    const ex = cx + side * 10;
    // Narrow slit
    ctx.fillStyle = '#E8E4D8';
    ctx.beginPath();
    ctx.moveTo(ex - 6, eyeY);
    ctx.quadraticCurveTo(ex, eyeY - 2, ex + 6, eyeY);
    ctx.quadraticCurveTo(ex, eyeY + 1.5, ex - 6, eyeY);
    ctx.closePath();
    ctx.fill();
    // Iris
    ctx.fillStyle = '#1A1A1A';
    ctx.beginPath();
    ctx.arc(ex, eyeY, 2, 0, Math.PI * 2);
    ctx.fill();
    // Highlight
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(ex + 0.5, eyeY - 1, 1, 1);
    // Outline
    ctx.strokeStyle = '#1a0a05';
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    ctx.moveTo(ex - 6, eyeY);
    ctx.quadraticCurveTo(ex, eyeY - 2, ex + 6, eyeY);
    ctx.quadraticCurveTo(ex, eyeY + 1.5, ex - 6, eyeY);
    ctx.closePath();
    ctx.stroke();
  }

  // Nose bridge hint (just the very top)
  ctx.fillStyle = '#A07850';
  ctx.fillRect(cx - 2, eyeY + 2, 4, 6);

  scene.textures.addCanvas('ts_boss4_peek', c);
}

function _generateDroneBulletTexture(scene) {
  if (scene.textures.exists('drone_bullet')) return;
  const s = 8;
  const c = document.createElement('canvas');
  c.width = s; c.height = s;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#00e5ff';
  ctx.beginPath();
  ctx.arc(s / 2, s / 2, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(s / 2, s / 2, 1, 0, Math.PI * 2);
  ctx.fill();
  scene.textures.addCanvas('drone_bullet', c);
}

function _generateDroneMissileTexture(scene) {
  if (scene.textures.exists('drone_missile')) return;
  const s = 16;
  const c = document.createElement('canvas');
  c.width = s; c.height = s;
  const ctx = c.getContext('2d');
  // Missile body
  ctx.fillStyle = '#ff4444';
  ctx.beginPath();
  ctx.moveTo(s / 2, 0);
  ctx.lineTo(s - 2, s / 2);
  ctx.lineTo(s / 2 + 2, s);
  ctx.lineTo(s / 2 - 2, s);
  ctx.lineTo(2, s / 2);
  ctx.closePath();
  ctx.fill();
  // Warhead tip
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(s / 2, 2, 2, 0, Math.PI * 2);
  ctx.fill();
  // Exhaust glow
  ctx.fillStyle = 'rgba(255,200,0,0.6)';
  ctx.beginPath();
  ctx.arc(s / 2, s - 1, 3, 0, Math.PI * 2);
  ctx.fill();
  scene.textures.addCanvas('drone_missile', c);
}

// _generateCouchTexture REMOVED - using createArmchairTexture from DroneTextures.js

function _generateCrosshairTexture(scene) {
  if (scene.textures.exists('drone_crosshair')) return;
  const s = 72; // 50% bigger canvas (was 48)
  const c = document.createElement('canvas');
  c.width = s; c.height = s;
  const ctx = c.getContext('2d');
  const cx = s / 2, cy = s / 2;

  // Outer glow ring
  ctx.strokeStyle = 'rgba(0, 255, 204, 0.25)';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(cx, cy, 30, 0, Math.PI * 2);
  ctx.stroke();

  // Outer circle - bright
  ctx.strokeStyle = 'rgba(0, 255, 204, 0.8)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, 27, 0, Math.PI * 2);
  ctx.stroke();

  // White outline for contrast
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(cx, cy, 29, 0, Math.PI * 2);
  ctx.stroke();

  // Inner circle
  ctx.strokeStyle = 'rgba(0, 255, 204, 0.9)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(cx, cy, 9, 0, Math.PI * 2);
  ctx.stroke();

  // Crosshair lines - thicker, brighter
  ctx.strokeStyle = 'rgba(0, 255, 204, 0.85)';
  ctx.lineWidth = 2;
  // Top
  ctx.beginPath(); ctx.moveTo(cx, cy - 32); ctx.lineTo(cx, cy - 12); ctx.stroke();
  // Bottom
  ctx.beginPath(); ctx.moveTo(cx, cy + 12); ctx.lineTo(cx, cy + 32); ctx.stroke();
  // Left
  ctx.beginPath(); ctx.moveTo(cx - 32, cy); ctx.lineTo(cx - 12, cy); ctx.stroke();
  // Right
  ctx.beginPath(); ctx.moveTo(cx + 12, cy); ctx.lineTo(cx + 32, cy); ctx.stroke();

  // White crosshair shadow for contrast
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(cx, cy - 32); ctx.lineTo(cx, cy - 12); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx, cy + 12); ctx.lineTo(cx, cy + 32); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx - 32, cy); ctx.lineTo(cx - 12, cy); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx + 12, cy); ctx.lineTo(cx + 32, cy); ctx.stroke();

  // Re-draw bright crosshair on top of shadow
  ctx.strokeStyle = 'rgba(0, 255, 204, 0.85)';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(cx, cy - 32); ctx.lineTo(cx, cy - 12); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx, cy + 12); ctx.lineTo(cx, cy + 32); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx - 32, cy); ctx.lineTo(cx - 12, cy); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx + 12, cy); ctx.lineTo(cx + 32, cy); ctx.stroke();

  // Center dot - bigger, brighter
  ctx.fillStyle = 'rgba(255, 255, 255, 1.0)';
  ctx.beginPath();
  ctx.arc(cx, cy, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(0, 255, 204, 0.9)';
  ctx.beginPath();
  ctx.arc(cx, cy, 2, 0, Math.PI * 2);
  ctx.fill();

  // Corner brackets - bigger, brighter
  ctx.strokeStyle = 'rgba(0, 255, 204, 0.6)';
  ctx.lineWidth = 1.5;
  const bc = 30; // bracket corner distance (was 20)
  const bl = 9;  // bracket length (was 6)
  // Top-left
  ctx.beginPath(); ctx.moveTo(cx - bc, cy - bc + bl); ctx.lineTo(cx - bc, cy - bc); ctx.lineTo(cx - bc + bl, cy - bc); ctx.stroke();
  // Top-right
  ctx.beginPath(); ctx.moveTo(cx + bc - bl, cy - bc); ctx.lineTo(cx + bc, cy - bc); ctx.lineTo(cx + bc, cy - bc + bl); ctx.stroke();
  // Bottom-left
  ctx.beginPath(); ctx.moveTo(cx - bc, cy + bc - bl); ctx.lineTo(cx - bc, cy + bc); ctx.lineTo(cx - bc + bl, cy + bc); ctx.stroke();
  // Bottom-right
  ctx.beginPath(); ctx.moveTo(cx + bc - bl, cy + bc); ctx.lineTo(cx + bc, cy + bc); ctx.lineTo(cx + bc, cy + bc - bl); ctx.stroke();

  scene.textures.addCanvas('drone_crosshair', c);
}


// _generateRubbleTexture REMOVED - single armchair, no rubble cover
// _generateColumnTexture REMOVED - single armchair, no column cover


function _generatePipeWeaponTexture(scene) {
  if (scene.textures.exists('boss_pipe_weapon')) return;
  const cw = 32, ch = 8;
  const c = document.createElement('canvas');
  c.width = cw; c.height = ch;
  const ctx = c.getContext('2d');

  // Metal pipe
  const grad = ctx.createLinearGradient(0, 0, 0, ch);
  grad.addColorStop(0, '#a0a0a8');
  grad.addColorStop(0.3, '#808088');
  grad.addColorStop(0.7, '#606068');
  grad.addColorStop(1, '#505058');
  ctx.fillStyle = grad;
  ctx.fillRect(2, 1, cw - 4, ch - 2);

  // Rusty spots
  ctx.fillStyle = '#8a5a30';
  ctx.fillRect(8, 2, 3, 3);
  ctx.fillRect(20, 3, 4, 2);

  // Thread grooves at one end
  ctx.strokeStyle = '#585860';
  ctx.lineWidth = 0.5;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(3 + i * 2, 1);
    ctx.lineTo(3 + i * 2, ch - 1);
    ctx.stroke();
  }

  // Bent/jagged end
  ctx.fillStyle = '#707078';
  ctx.beginPath();
  ctx.moveTo(cw - 3, 0);
  ctx.lineTo(cw, 2);
  ctx.lineTo(cw - 1, ch - 2);
  ctx.lineTo(cw - 3, ch);
  ctx.closePath();
  ctx.fill();

  scene.textures.addCanvas('boss_pipe_weapon', c);
}

// ═══════════════════════════════════════════════════════════════

export default class DroneScene extends Phaser.Scene {
  constructor() { super('DroneScene'); }

  create() {
    const dm = DifficultyManager.get();
    this.dm = dm;
    this.cameras.main.setBackgroundColor('#000000');

    // Controls overlay
    showControlsOverlay(this, 'ARROWS: Move | SPACE: Shoot | X: Missile | SHIFT: Dash | ESC: Pause');

    // Generate textures
    createDroneSprite(this);
    createDaytimeSky(this);
    createRuinedCityTile(this);
    createRuinedCityTile2(this);
    createTargetBuildingTexture(this);
    createCommandRoom(this);
    createArmchairTexture(this);
    createArmchairSideTexture(this);

    // Boss textures (generated inline)
    _generateBossTexture(this, 'ts_boss4_normal', 'normal');
    _generateBossTexture(this, 'ts_boss4_angry', 'angry');
    _generateBossTexture(this, 'ts_boss4_furious', 'furious');
    _generateBossTexture(this, 'ts_boss4_dead', 'dead');
    _generateBossProjectileTextures(this);
    _generateBossPeekTexture(this);
    _generateDroneBulletTexture(this);
    _generateDroneMissileTexture(this);
    _generateCrosshairTexture(this);
    _generatePipeWeaponTexture(this);

    // ── Game state ──
    this.phase = 'transition';
    this.phaseTimer = 0;
    this.droneX = W / 2;
    this.droneY = H / 2;
    this.droneHP = dm.isHard() ? 2 : 3;
    this.droneMaxHP = this.droneHP;
    this.score = 0;
    this.enemiesKilled = 0;

    // Boss fight state
    this.bossHP = 0;
    this.bossMaxHP = 0;
    this.bossDefeated = false;

    // Ambient
    this.ambientRef = null;

    // ── Setup ──
    this._setupHUD();
    this._setupInput();

    // Check for checkpoint: if returning from boss death, skip to boss fight
    let hasCheckpoint = false;
    try {
      if (localStorage.getItem('superzion_checkpoint_l4') === 'boss') {
        hasCheckpoint = true;
        localStorage.removeItem('superzion_checkpoint_l4');
      }
    } catch (e) { /* ignore */ }

    if (hasCheckpoint) {
      // Skip city phase, go directly to boss fight
      this._startBossDirectly();
    } else {
      // Start with city intro, then boss fight
      this._startCityIntro();
    }

    // Tutorial overlay (pauses gameplay until dismissed)
    showTutorialOverlay(this, [
      'LEVEL 4: OPERATION LAST CHAIR',
      '',
      'ARROWS: Steer the drone',
      'Navigate through the ruined city',
      'Enter through the target window',
      'Then: SPACE to shoot, X for missiles',
      'SHIFT: Dodge/dash',
      'Defeat YAHYA SINWAR',
    ]);
  }

  // ═════════════════════════════════════════════════════════════
  // HUD
  // ═════════════════════════════════════════════════════════════
  _setupHUD() {
    const hudStyle = { fontFamily: 'monospace', fontSize: '12px', color: '#ffffff' };
    const titleStyle = { fontFamily: 'monospace', fontSize: '11px', color: '#00e5ff',
      shadow: { offsetX: 0, offsetY: 0, color: '#00e5ff', blur: 4, fill: true } };

    this.hudTitle = this.add.text(15, 12, 'OPERATION LAST CHAIR', titleStyle)
      .setDepth(50).setScrollFactor(0);
    this.hudHP = this.add.text(15, 30, `DRONE: ${this.droneHP}/${this.droneMaxHP}`, hudStyle)
      .setDepth(50).setScrollFactor(0);
    this.hudPhase = this.add.text(15, 46, '', hudStyle)
      .setDepth(50).setScrollFactor(0);

    this.hudTimer = this.add.text(W - 15, 12, '', { ...hudStyle, color: '#FFD700' })
      .setOrigin(1, 0).setDepth(50).setScrollFactor(0);
    this.hudObjective = this.add.text(W / 2, 12, '', {
      fontFamily: 'monospace', fontSize: '11px', color: '#00e5ff',
    }).setOrigin(0.5).setDepth(50).setScrollFactor(0);

    // Phase instruction text
    this.instrText = this.add.text(W / 2, H - 25, '', {
      fontFamily: 'monospace', fontSize: '14px', color: '#ffffff', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(50).setScrollFactor(0);
    this.instrBg = this.add.rectangle(this.instrText.x, this.instrText.y, 960, 28, 0x000000, 0.7)
      .setScrollFactor(0).setDepth(this.instrText.depth - 1);
  }

  _updateHUD() {
    this.hudHP.setText(`DRONE: ${Math.max(0, this.droneHP)}/${this.droneMaxHP}`);
    this.hudHP.setColor(this.droneHP <= 1 ? '#ff4444' : '#ffffff');

    if (this.phase === 'city') {
      this.hudPhase.setText('CITY INFILTRATION');
      this.hudObjective.setText('NAVIGATE TO THE GLOWING WINDOW');
      this.hudTimer.setText('');
    } else if (this.phase === 'boss') {
      this.hudPhase.setText('HIDEOUT');
      this.hudObjective.setText('ELIMINATE YAHYA SINWAR');
      this.hudTimer.setText('');
    }
  }

  _setupInput() {
    this.keys = {
      left: this.input.keyboard.addKey('LEFT'),
      right: this.input.keyboard.addKey('RIGHT'),
      up: this.input.keyboard.addKey('UP'),
      down: this.input.keyboard.addKey('DOWN'),
      space: this.input.keyboard.addKey('SPACE'),
      enter: this.input.keyboard.addKey('ENTER'),
      m: this.input.keyboard.addKey('M'),
      p: this.input.keyboard.addKey('P'),
      esc: this.input.keyboard.addKey('ESC'),
      z: this.input.keyboard.addKey('Z'),
      x: this.input.keyboard.addKey('X'),
      c: this.input.keyboard.addKey('C'),
      shift: this.input.keyboard.addKey('SHIFT'),
      r: this.input.keyboard.addKey('R'),
      s: this.input.keyboard.addKey('S'),
    };
    this.isPaused = false;
    this.pauseObjects = [];
  }

  _togglePause() {
    this.isPaused = !this.isPaused;
    if (this.isPaused) {
      const overlay = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.6).setDepth(60);
      this.pauseObjects.push(overlay);
      const title = this.add.text(W / 2, H / 2 - 30, 'PAUSED', {
        fontFamily: 'monospace', fontSize: '36px', color: '#ffffff',
      }).setOrigin(0.5).setDepth(61);
      this.pauseObjects.push(title);
      const opts = this.add.text(W / 2, H / 2 + 20, 'ESC — Resume  |  Q — Menu  |  M — Mute', {
        fontFamily: 'monospace', fontSize: '14px', color: '#aaaaaa',
      }).setOrigin(0.5).setDepth(61);
      this.pauseObjects.push(opts);
    } else {
      for (const obj of this.pauseObjects) obj.destroy();
      this.pauseObjects = [];
    }
  }

  _stopAmbient() {
    if (this.ambientRef) {
      try {
        this.ambientRef.source.stop();
        if (this.ambientRef.osc) this.ambientRef.osc.stop();
        if (this.ambientRef.stopDrip) this.ambientRef.stopDrip();
      } catch (e) { /* already stopped */ }
      this.ambientRef = null;
    }
  }

  _takeDamage(amount) {
    const dmg = amount || 1;
    this.droneHP -= dmg;
    SoundManager.get().playDroneHit();
    this.cameras.main.shake(200, 0.015);

    const flash = this.add.rectangle(W / 2, H / 2, W, H, 0xff0000, 0.3).setDepth(45).setScrollFactor(0);
    this.tweens.add({ targets: flash, alpha: 0, duration: 300, onComplete: () => flash.destroy() });

    if (this.droneHP <= 0) {
      this._stopAmbient();
      if (this.phase === 'boss') {
        this._bossFightEnd(false);
      } else {
        this.phase = 'dead';
        this.time.delayedCall(800, () => this._showVictory());
      }
    }
  }

  // ═════════════════════════════════════════════════════════════
  // CITY FLIGHT PHASE — Horizontal right-scrolling through ruined city
  // ═════════════════════════════════════════════════════════════

  _startCityIntro() {
    this.phase = 'city';
    MusicManager.get().playLevel4Music('command');

    this._city = {
      transitioning: false,
      gfx: this.add.graphics().setDepth(1),
      objects: [],
      invulnTimer: 0,
      // Wind state
      windAngle: Math.random() * Math.PI * 2,
      windTargetAngle: Math.random() * Math.PI * 2,
      windStrength: WIND_STRENGTH_MIN + Math.random() * (WIND_STRENGTH_MAX - WIND_STRENGTH_MIN),
      windChangeTimer: WIND_CHANGE_INTERVAL,
      // Debris
      debris: [],
      debrisSpawnTimer: 0,
      // Floating dust particles
      dustParticles: [],
      // Building cracks (pre-generated for visual variety)
      cracks: [],
    };
    const city = this._city;

    // Pre-generate ambient dust
    for (let i = 0; i < 25; i++) {
      city.dustParticles.push({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 6,
        size: 1 + Math.random() * 2,
        alpha: 0.08 + Math.random() * 0.12,
      });
    }

    // Pre-generate building crack lines for the destroyed building
    for (let i = 0; i < 12; i++) {
      const cx = 700 + Math.random() * 220;
      const cy = 20 + Math.random() * 500;
      const segments = 2 + Math.floor(Math.random() * 3);
      const pts = [{ x: cx, y: cy }];
      for (let s = 0; s < segments; s++) {
        const last = pts[pts.length - 1];
        pts.push({
          x: last.x + (Math.random() - 0.5) * 30,
          y: last.y + 10 + Math.random() * 30,
        });
      }
      city.cracks.push(pts);
    }

    // Player drone starts on the LEFT
    this.droneX = 150;
    this.droneY = 270;

    // Controls instruction
    this.instrText.setText('ARROWS: Navigate to the glowing window');
    this.instrText.setAlpha(1);
    this.instrBg.setAlpha(0.7);
    this.time.delayedCall(4000, () => {
      if (this.phase === 'city') {
        this.tweens.add({ targets: [this.instrText, this.instrBg], alpha: 0, duration: 800 });
      }
    });
  }

  _updateCityIntro(dt) {
    const city = this._city;
    if (!city || city.transitioning) return;

    // --- Wind system ---
    city.windChangeTimer -= dt;
    if (city.windChangeTimer <= 0) {
      city.windChangeTimer = WIND_CHANGE_INTERVAL + (Math.random() - 0.5) * 1.0;
      city.windTargetAngle = Math.random() * Math.PI * 2;
      city.windStrength = WIND_STRENGTH_MIN + Math.random() * (WIND_STRENGTH_MAX - WIND_STRENGTH_MIN);
    }
    // Smoothly interpolate wind angle toward target
    const angleDiff = city.windTargetAngle - city.windAngle;
    city.windAngle += angleDiff * dt * 1.5;

    const windDx = Math.cos(city.windAngle) * city.windStrength;
    const windDy = Math.sin(city.windAngle) * city.windStrength;

    // Apply wind drift to drone
    this.droneX += windDx * dt;
    this.droneY += windDy * dt;

    // --- Player movement (counteracts wind) ---
    let dx = 0, dy = 0;
    if (this.keys.left.isDown) dx -= 1;
    if (this.keys.right.isDown) dx += 1;
    if (this.keys.up.isDown) dy -= 1;
    if (this.keys.down.isDown) dy += 1;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    dx /= len; dy /= len;
    this.droneX += dx * CITY_DRONE_SPEED * dt;
    this.droneY += dy * CITY_DRONE_SPEED * dt;

    // Clamp drone to screen
    const margin = 15;
    this.droneX = Math.max(margin, Math.min(W - margin, this.droneX));
    this.droneY = Math.max(margin, Math.min(H - margin, this.droneY));

    // Invulnerability timer
    if (city.invulnTimer > 0) city.invulnTimer -= dt;

    // --- Debris spawning ---
    city.debrisSpawnTimer -= dt;
    if (city.debrisSpawnTimer <= 0) {
      city.debrisSpawnTimer = 1.0 / DEBRIS_SPAWN_RATE + (Math.random() - 0.5) * 0.3;
      // Spawn near the building area (right side)
      const spawnX = 620 + Math.random() * 300;
      city.debris.push({
        x: spawnX,
        y: -10,
        w: 6 + Math.random() * 8,
        h: 3 + Math.random() * 4,
        vy: DEBRIS_FALL_SPEED_MIN + Math.random() * (DEBRIS_FALL_SPEED_MAX - DEBRIS_FALL_SPEED_MIN),
        vx: (Math.random() - 0.5) * 20,
        rotation: Math.random() * Math.PI,
        rotSpeed: (Math.random() - 0.5) * 4,
        color: Math.random() > 0.5 ? 0x7A7068 : 0x6A5A4A,
      });
    }

    // Update debris
    for (let i = city.debris.length - 1; i >= 0; i--) {
      const d = city.debris[i];
      d.x += d.vx * dt;
      d.y += d.vy * dt;
      d.rotation += d.rotSpeed * dt;

      // Remove if off screen
      if (d.y > H + 20) {
        city.debris.splice(i, 1);
        continue;
      }

      // Check collision with drone
      if (city.invulnTimer <= 0) {
        const ddx = d.x - this.droneX;
        const ddy = d.y - this.droneY;
        const dist = Math.sqrt(ddx * ddx + ddy * ddy);
        if (dist < DRONE_SIZE + 6) {
          // Hit: lose 1 HP and bounce back
          this._takeDamage(1);
          city.invulnTimer = 1.0;
          // Bounce drone away from debris
          const bAngle = Math.atan2(this.droneY - d.y, this.droneX - d.x);
          this.droneX += Math.cos(bAngle) * DEBRIS_BOUNCE_DIST;
          this.droneY += Math.sin(bAngle) * DEBRIS_BOUNCE_DIST;
          this.droneX = Math.max(margin, Math.min(W - margin, this.droneX));
          this.droneY = Math.max(margin, Math.min(H - margin, this.droneY));
          city.debris.splice(i, 1);
          continue;
        }
      }
    }

    // Update dust particles (drift with wind)
    for (const p of city.dustParticles) {
      p.x += (p.vx + windDx * 0.3) * dt;
      p.y += (p.vy + windDy * 0.3) * dt;
      if (p.x < -10) p.x = W + 5;
      if (p.x > W + 10) p.x = -5;
      if (p.y < -10) p.y = H + 5;
      if (p.y > H + 10) p.y = -5;
    }

    // --- Window detection ---
    const wCenterX = WINDOW_X + WINDOW_SIZE / 2;
    const wCenterY = WINDOW_Y + WINDOW_SIZE / 2;
    const distToWindow = Math.sqrt(
      (this.droneX - wCenterX) ** 2 + (this.droneY - wCenterY) ** 2
    );

    if (distToWindow < WINDOW_SIZE * 0.6) {
      // Drone overlaps window zone -- transition!
      this._cityEnterWindow();
      return;
    }

    // Draw
    this._drawCityScene();
  }

  _drawCityScene() {
    const city = this._city;
    const gfx = city.gfx;
    gfx.clear();

    // --- Daytime sky ---
    gfx.fillStyle(0x5588cc);
    gfx.fillRect(0, 0, W, H);
    gfx.fillStyle(0x88bbee, 0.4);
    gfx.fillRect(0, H * 0.5, W, H * 0.5);
    // Dust haze
    gfx.fillStyle(0xC8B890, 0.06);
    gfx.fillRect(0, H * 0.55, W, H * 0.45);

    // Sun glow (upper left)
    gfx.fillStyle(0xFFF0C8, 0.25);
    gfx.fillCircle(120, 60, 80);
    gfx.fillStyle(0xFFF0C8, 0.1);
    gfx.fillCircle(120, 60, 160);

    // --- Ground (dark rubble) ---
    gfx.fillStyle(0x5A5550);
    gfx.fillRect(0, H - 50, W, 50);
    gfx.fillStyle(0x4A4540, 0.5);
    gfx.fillRect(0, H - 55, W, 8);

    // --- Street level detail ---
    // Road markings
    gfx.lineStyle(1.5, 0x6A6A60, 0.25);
    gfx.lineBetween(0, H - 35, 650, H - 35);
    gfx.lineStyle(1, 0x7A7A70, 0.15);
    for (let dx = 10; dx < 640; dx += 30) {
      gfx.lineBetween(dx, H - 35, dx + 15, H - 35);
    }

    // Cars (small colored rectangles on streets)
    const carDefs = [
      { x: 80, color: 0x8a3030, w: 18, h: 8 },
      { x: 200, color: 0x505060, w: 16, h: 8 },
      { x: 350, color: 0x7a7a40, w: 20, h: 8 },
      { x: 480, color: 0x404050, w: 16, h: 8 },
      { x: 150, color: 0x2a2a44, w: 22, h: 10 }, // truck/van
    ];
    for (const car of carDefs) {
      const carY = H - 42;
      gfx.fillStyle(car.color, 0.4);
      gfx.fillRect(car.x, carY, car.w, car.h);
      // Windows
      gfx.fillStyle(0x8899aa, 0.25);
      gfx.fillRect(car.x + 2, carY + 1, car.w * 0.3, car.h - 2);
    }

    // Debris piles on ground
    gfx.fillStyle(0x6A6058, 0.3);
    gfx.fillCircle(420, H - 48, 8);
    gfx.fillCircle(550, H - 46, 6);
    gfx.fillCircle(300, H - 45, 5);

    // Street lamps (vertical lines with circles on top)
    const lampPositions = [100, 300, 500];
    for (const lx of lampPositions) {
      gfx.lineStyle(1.5, 0x5A5A50, 0.35);
      gfx.lineBetween(lx, H - 50, lx, H - 80);
      gfx.fillStyle(0x7A7A70, 0.3);
      gfx.fillCircle(lx, H - 82, 4);
      // Light glow (dim, the power is out)
      gfx.fillStyle(0xffee88, 0.04);
      gfx.fillCircle(lx, H - 75, 12);
    }

    // --- Distant buildings (left background) ---
    const distBldgs = [
      { x: 20, w: 80, h: 280 },
      { x: 110, w: 60, h: 200 },
      { x: 180, w: 70, h: 340 },
      { x: 260, w: 55, h: 180 },
      { x: 320, w: 90, h: 260 },
      { x: 420, w: 65, h: 220 },
      { x: 500, w: 75, h: 300 },
      { x: 580, w: 50, h: 160 },
    ];
    for (const b of distBldgs) {
      const by = H - 50 - b.h;
      gfx.fillStyle(0x6A6A70, 0.5);
      gfx.fillRect(b.x, by, b.w, b.h);
      gfx.lineStyle(1, 0x5A5A60, 0.3);
      gfx.strokeRect(b.x, by, b.w, b.h);
      // Windows (small dark rectangles)
      for (let wy = by + 15; wy + 12 < H - 55; wy += 25) {
        for (let wx = b.x + 8; wx + 10 < b.x + b.w - 5; wx += 18) {
          gfx.fillStyle(0x1A1A22, 0.4);
          gfx.fillRect(wx, wy, 10, 12);
        }
      }
    }

    // --- Destroyed building (right side, foreground) ---
    const bldgX = 680;
    const bldgW = 260;
    const bldgTop = 10;

    // Main structure
    gfx.fillStyle(0x6A6058);
    gfx.fillRect(bldgX, bldgTop, bldgW, H - bldgTop - 50);

    // Darker inner structure
    gfx.fillStyle(0x5A5048, 0.8);
    gfx.fillRect(bldgX + 8, bldgTop + 8, bldgW - 16, H - bldgTop - 66);

    // Jagged top edge (destroyed)
    gfx.fillStyle(0x5588cc); // sky color to "erase" top
    const jaggedPts = [
      bldgX, bldgTop,
      bldgX + 20, bldgTop + 12,
      bldgX + 50, bldgTop - 5,
      bldgX + 80, bldgTop + 18,
      bldgX + 120, bldgTop + 5,
      bldgX + 160, bldgTop + 22,
      bldgX + 200, bldgTop + 8,
      bldgX + 230, bldgTop + 15,
      bldgX + bldgW, bldgTop,
      bldgX + bldgW, 0,
      bldgX, 0,
    ];
    gfx.beginPath();
    gfx.moveTo(jaggedPts[0], jaggedPts[1]);
    for (let j = 2; j < jaggedPts.length; j += 2) {
      gfx.lineTo(jaggedPts[j], jaggedPts[j + 1]);
    }
    gfx.closePath();
    gfx.fillPath();

    // Building windows (dark, some blown out)
    for (let wy = bldgTop + 40; wy + 25 < H - 60; wy += 50) {
      for (let wx = bldgX + 20; wx + 22 < bldgX + bldgW - 10; wx += 45) {
        // Skip the target window area
        if (wx >= WINDOW_X - 5 && wx <= WINDOW_X + WINDOW_SIZE + 5 &&
            wy >= WINDOW_Y - 5 && wy <= WINDOW_Y + WINDOW_SIZE + 5) continue;

        const hash = (wx * 7 + wy * 13) % 5;
        if (hash === 0) {
          // Blown out
          gfx.fillStyle(0x2A2218, 0.8);
          gfx.fillRect(wx, wy, 22, 28);
          // Jagged glass remains
          gfx.lineStyle(1, 0x8A8A90, 0.3);
          gfx.beginPath();
          gfx.moveTo(wx, wy); gfx.lineTo(wx + 5, wy + 8);
          gfx.strokePath();
          gfx.beginPath();
          gfx.moveTo(wx + 22, wy); gfx.lineTo(wx + 17, wy + 6);
          gfx.strokePath();
        } else {
          gfx.fillStyle(0x1A1A22, 0.6);
          gfx.fillRect(wx, wy, 22, 28);
          gfx.lineStyle(1, 0x5A5A5A, 0.3);
          gfx.strokeRect(wx, wy, 22, 28);
        }
      }
    }

    // Building cracks
    gfx.lineStyle(1.5, 0x4A4038, 0.4);
    for (const crack of city.cracks) {
      if (crack.length < 2) continue;
      gfx.beginPath();
      gfx.moveTo(crack[0].x, crack[0].y);
      for (let c = 1; c < crack.length; c++) {
        gfx.lineTo(crack[c].x, crack[c].y);
      }
      gfx.strokePath();
    }

    // Building edge shadow (left side)
    gfx.fillStyle(0x000000, 0.15);
    gfx.fillRect(bldgX, bldgTop, 6, H - bldgTop - 50);

    // --- Fire/smoke on destroyed building ---
    // Small fire on upper floors (flickering orange)
    const fireFlicker = Math.sin(Date.now() / 120) * 0.15;
    gfx.fillStyle(0xff4400, 0.2 + fireFlicker);
    gfx.fillCircle(bldgX + 40, bldgTop + 30, 8);
    gfx.fillStyle(0xff6600, 0.15 + fireFlicker * 0.5);
    gfx.fillCircle(bldgX + 40, bldgTop + 25, 12);
    gfx.fillStyle(0xff8800, 0.08);
    gfx.fillCircle(bldgX + 40, bldgTop + 20, 18);

    // Second fire spot
    gfx.fillStyle(0xff3300, 0.15 + fireFlicker * 0.8);
    gfx.fillCircle(bldgX + bldgW - 30, bldgTop + 60, 6);
    gfx.fillStyle(0xff5500, 0.1);
    gfx.fillCircle(bldgX + bldgW - 30, bldgTop + 55, 10);

    // Smoke rising from fires (semi-transparent gray)
    const smokeTime = Date.now() / 1000;
    for (let si = 0; si < 4; si++) {
      const sx = bldgX + 38 + Math.sin(smokeTime + si * 1.5) * 8;
      const sy = bldgTop + 10 - si * 20 + Math.sin(smokeTime * 0.5 + si) * 5;
      const sr = 5 + si * 3;
      gfx.fillStyle(0x555555, 0.08 - si * 0.015);
      gfx.fillCircle(sx, Math.max(0, sy), sr);
    }

    // Exposed rebar/broken wall elements
    gfx.lineStyle(1, 0x8a6a4a, 0.25);
    gfx.lineBetween(bldgX + 15, bldgTop + 15, bldgX + 15, bldgTop + 35);
    gfx.lineBetween(bldgX + bldgW - 20, bldgTop + 8, bldgX + bldgW - 18, bldgTop + 28);
    // Bent rebar
    gfx.lineStyle(1, 0x7a5a3a, 0.2);
    gfx.beginPath();
    gfx.moveTo(bldgX + 60, bldgTop + 12);
    gfx.lineTo(bldgX + 65, bldgTop + 18);
    gfx.lineTo(bldgX + 62, bldgTop + 28);
    gfx.strokePath();

    // --- Glowing window (target) ---
    const pulse = 0.5 + 0.5 * Math.sin(Date.now() / 300);
    const wAlpha = 0.3 + pulse * 0.4;

    // Outer warm glow
    gfx.fillStyle(0xFFD700, wAlpha * 0.15);
    gfx.fillRect(WINDOW_X - 15, WINDOW_Y - 15, WINDOW_SIZE + 30, WINDOW_SIZE + 30);
    // Middle glow
    gfx.fillStyle(0xFFD700, wAlpha * 0.4);
    gfx.fillRect(WINDOW_X - 5, WINDOW_Y - 5, WINDOW_SIZE + 10, WINDOW_SIZE + 10);
    // Window body
    gfx.fillStyle(0xFFDD44, wAlpha);
    gfx.fillRect(WINDOW_X, WINDOW_Y, WINDOW_SIZE, WINDOW_SIZE);
    // Bright center
    gfx.fillStyle(0xFFEE88, wAlpha * 0.8);
    gfx.fillRect(WINDOW_X + 8, WINDOW_Y + 8, WINDOW_SIZE - 16, WINDOW_SIZE - 16);
    // Border outline
    gfx.lineStyle(2, 0xFFAA22, wAlpha * 0.6);
    gfx.strokeRect(WINDOW_X - 2, WINDOW_Y - 2, WINDOW_SIZE + 4, WINDOW_SIZE + 4);

    // --- Falling debris ---
    for (const d of city.debris) {
      gfx.save();
      gfx.fillStyle(d.color, 0.85);
      // Simple rotated rectangle approximation
      const cx = d.x;
      const cy = d.y;
      const hw = d.w / 2;
      const hh = d.h / 2;
      const cos = Math.cos(d.rotation);
      const sin = Math.sin(d.rotation);
      gfx.beginPath();
      gfx.moveTo(cx + cos * (-hw) - sin * (-hh), cy + sin * (-hw) + cos * (-hh));
      gfx.lineTo(cx + cos * hw - sin * (-hh), cy + sin * hw + cos * (-hh));
      gfx.lineTo(cx + cos * hw - sin * hh, cy + sin * hw + cos * hh);
      gfx.lineTo(cx + cos * (-hw) - sin * hh, cy + sin * (-hw) + cos * hh);
      gfx.closePath();
      gfx.fillPath();
    }

    // --- Dust particles ---
    for (const p of city.dustParticles) {
      gfx.fillStyle(0xC8B890, p.alpha);
      gfx.fillCircle(p.x, p.y, p.size);
    }

    // --- Wind direction indicator (top-right corner) ---
    const windAngle = this._city.windAngle;
    const indicX = W - 50;
    const indicY = 80;
    // Background circle
    gfx.fillStyle(0x000000, 0.3);
    gfx.fillCircle(indicX, indicY, 18);
    gfx.lineStyle(1, 0xffffff, 0.3);
    gfx.strokeCircle(indicX, indicY, 18);
    // Arrow
    const arrowLen = 12;
    const arrowTipX = indicX + Math.cos(windAngle) * arrowLen;
    const arrowTipY = indicY + Math.sin(windAngle) * arrowLen;
    gfx.lineStyle(2, 0x88ccff, 0.8);
    gfx.beginPath();
    gfx.moveTo(indicX, indicY);
    gfx.lineTo(arrowTipX, arrowTipY);
    gfx.strokePath();
    // Arrowhead
    const headAngle1 = windAngle + Math.PI * 0.8;
    const headAngle2 = windAngle - Math.PI * 0.8;
    gfx.beginPath();
    gfx.moveTo(arrowTipX, arrowTipY);
    gfx.lineTo(arrowTipX + Math.cos(headAngle1) * 5, arrowTipY + Math.sin(headAngle1) * 5);
    gfx.strokePath();
    gfx.beginPath();
    gfx.moveTo(arrowTipX, arrowTipY);
    gfx.lineTo(arrowTipX + Math.cos(headAngle2) * 5, arrowTipY + Math.sin(headAngle2) * 5);
    gfx.strokePath();
    // "WIND" label
    // (drawn via text object would be better, but we use gfx-only for consistency)

    // --- Player drone (BRIGHT, LARGE, visible against any background) ---
    const flashOn = city.invulnTimer > 0 && Math.floor(Date.now() / 80) % 2 === 0;
    if (!flashOn) {
      const dx = this.droneX;
      const dy = this.droneY;

      // Outer glow halo (large, visible)
      gfx.fillStyle(0x00ffcc, 0.10);
      gfx.fillCircle(dx, dy, 36);
      gfx.fillStyle(0x00ffcc, 0.06);
      gfx.fillCircle(dx, dy, 48);

      // White outline ring for contrast
      gfx.lineStyle(2.5, 0xffffff, 0.85);
      gfx.strokeCircle(dx, dy, 14);

      // Main body - bright cyan/green
      gfx.fillStyle(0x00ffcc, 0.95);
      gfx.fillCircle(dx, dy, 12);
      // Inner core - green-lime
      gfx.fillStyle(0x88ff00, 0.9);
      gfx.fillCircle(dx, dy, 6);
      // Center bright dot
      gfx.fillStyle(0xffffff, 1.0);
      gfx.fillCircle(dx, dy, 2.5);

      // Propeller arms (spinning, 50% bigger)
      gfx.lineStyle(2.5, 0x00ffcc, 0.8);
      for (let a = 0; a < 4; a++) {
        const angle = a * Math.PI / 2 + Date.now() / 200;
        const tipX = dx + Math.cos(angle) * 18;
        const tipY = dy + Math.sin(angle) * 18;
        gfx.beginPath();
        gfx.moveTo(dx, dy);
        gfx.lineTo(tipX, tipY);
        gfx.strokePath();

        // Blinking LED lights on propeller tips
        const ledPulse = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(Date.now() / 150 + a * 1.5));
        gfx.fillStyle(0xffffff, ledPulse);
        gfx.fillCircle(tipX, tipY, 3);
        gfx.fillStyle(0x00ffcc, ledPulse * 0.5);
        gfx.fillCircle(tipX, tipY, 5);
      }
    }
  }

  _cityEnterWindow() {
    const city = this._city;
    if (!city || city.transitioning) return;
    city.transitioning = true;

    // Save checkpoint: city phase complete, entering boss fight
    try { localStorage.setItem('superzion_checkpoint_l4', 'boss'); } catch (e) { /* ignore */ }
    this.instrText.setAlpha(0);
    this.instrBg.setAlpha(0);

    SoundManager.get().playDoorOpen();

    // Fade to black
    const overlay = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0).setDepth(40);
    city.objects.push(overlay);
    this.tweens.add({
      targets: overlay,
      alpha: 1,
      duration: 1200,
      onComplete: () => {
        // Dark interior
        const interiorBg = this.add.rectangle(W / 2, H / 2, W, H, 0x050505).setDepth(41);
        city.objects.push(interiorBg);

        // Flickering light effect
        let flickerCount = 0;
        this.time.addEvent({
          delay: 150,
          repeat: 5,
          callback: () => {
            flickerCount++;
            interiorBg.setFillStyle(flickerCount % 2 === 0 ? 0x050505 : 0x1a1810);
          },
        });

        // After flicker, light stabilizes
        this.time.delayedCall(1200, () => {
          interiorBg.setFillStyle(0x1a1810);

          // "YAHYA SINWAR" text
          const angryTitle = this.add.text(W / 2, H / 2 - 30, 'YAHYA SINWAR', {
            fontFamily: 'monospace', fontSize: '42px', color: '#ff4400',
            fontStyle: 'bold',
            shadow: { offsetX: 0, offsetY: 0, color: '#ff4400', blur: 20, fill: true },
          }).setOrigin(0.5).setDepth(42).setAlpha(0);
          city.objects.push(angryTitle);

          const angrySub = this.add.text(W / 2, H / 2 + 20, 'HE KNOWS YOU\'RE HERE', {
            fontFamily: 'monospace', fontSize: '14px', color: '#ff8844',
          }).setOrigin(0.5).setDepth(42).setAlpha(0);
          city.objects.push(angrySub);

          this.tweens.add({
            targets: [angryTitle, angrySub],
            alpha: 1,
            duration: 800,
          });

          // After reveal, transition to boss fight
          this.time.delayedCall(2500, () => {
            this._cleanupCityIntro();
            this._startBossFight();
          });
        });
      },
    });
  }

  _cleanupCityIntro() {
    if (!this._city) return;
    const city = this._city;
    if (city.gfx) { city.gfx.destroy(); city.gfx = null; }
    for (const obj of city.objects) {
      if (obj && obj.destroy) obj.destroy();
    }
    city.objects = [];
    city.debris = [];
    city.dustParticles = [];
    city.cracks = [];
    this._city = null;
  }
  _startBossTransition() {
    this.phase = 'transition';
    const overlay = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.9).setDepth(40);
    const txt = this.add.text(W / 2, H / 2 - 20, 'APPROACHING TARGET BUILDING...', {
      fontFamily: 'monospace', fontSize: '20px', color: '#ff8800',
      shadow: { offsetX: 0, offsetY: 0, color: '#ff8800', blur: 10, fill: true },
    }).setOrigin(0.5).setDepth(41);

    const sub = this.add.text(W / 2, H / 2 + 20, 'SOMETHING IS WAITING...', {
      fontFamily: 'monospace', fontSize: '14px', color: '#ff4444',
    }).setOrigin(0.5).setDepth(41);

    this.time.delayedCall(2500, () => {
      overlay.destroy();
      txt.destroy();
      sub.destroy();
      this._startBossFight();
    });
  }

  // ═════════════════════════════════════════════════════════════
  // DIRECT BOSS START (skip recon/tunnel)
  // ═════════════════════════════════════════════════════════════
  _startBossDirectly() {
    this.phase = 'transition';
    MusicManager.get().playLevel4Music('command');

    const overlay = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.9).setDepth(40);
    const txt = this.add.text(W / 2, H / 2 - 20, 'OPERATION LAST CHAIR', {
      fontFamily: 'monospace', fontSize: '24px', color: '#ff8800',
      shadow: { offsetX: 0, offsetY: 0, color: '#ff8800', blur: 10, fill: true },
    }).setOrigin(0.5).setDepth(41);

    const sub = this.add.text(W / 2, H / 2 + 20, 'INFILTRATE AND ELIMINATE YAHYA SINWAR', {
      fontFamily: 'monospace', fontSize: '14px', color: '#ff4444',
    }).setOrigin(0.5).setDepth(41);

    this.time.delayedCall(2500, () => {
      overlay.destroy();
      txt.destroy();
      sub.destroy();
      this._startBossFight();
    });
  }

  // ═════════════════════════════════════════════════════════════
  // BOSS FIGHT: YAHYA SINWAR (top-down destroyed room)
  // ═════════════════════════════════════════════════════════════
  _startBossFight() {
    this.phase = 'boss';
    MusicManager.get().playLevel4Music('command');

    // Underground tunnel ambient
    this._stopAmbient();
    this.ambientRef = SoundManager.get().playAmbientUnderground();

    // Drone HP for boss fight
    this.droneHP = this.dm.isHard() ? 4 : 6;
    this.droneMaxHP = this.droneHP;

    // Graphics layer for room rendering
    this.roomGfx = this.add.graphics().setDepth(0);

    // Generate room debris layout (static, drawn each frame)
    this._generateRoomDebris();

    // Drone position (starts center-bottom of room)
    this.droneX = W / 2;
    this.droneY = H - 100;

    // Drone combat state
    this.droneBullets = [];
    this.droneMissiles = [];
    this.droneShootTimer = 0;
    this.droneMissileTimer = 0;
    this.droneInvulnTimer = 0;
    this.dodgeCooldown = 0;
    this.dodgeActive = false;
    this.dodgeTimer = 0;
    this.dodgeDirX = 0;
    this.dodgeDirY = 0;

    // Boss state
    this.bossMaxHP = Math.ceil(BOSS_BASE_HP * this.dm.bossHPMult());
    this.bossHP = this.bossMaxHP;
    this.bossDefeated = false;
    this.bossX = ARMCHAIR_X;
    this.bossY = ARMCHAIR_Y;
    this.bossVisible = false;
    this.bossActive = false;
    this.bossPhase = 1;
    this.bossState = 'hiding';
    this.bossStateTimer = BOSS_P1_HIDE_MIN + Math.random() * (BOSS_P1_HIDE_MAX - BOSS_P1_HIDE_MIN);
    this.bossPeekScale = 0.4;
    this.bossExpression = 'normal';
    this.bossTargetX = 0;
    this.bossTargetY = 0;

    // Phase 3 charge state
    this.bossChargeTimer = BOSS_P3_CHARGE_INTERVAL;
    this.bossCharging = false;
    this.bossChargeDirX = 0;
    this.bossChargeDirY = 0;
    this.bossChargeElapsed = 0;

    // Phase 2 throw timer
    this.bossThrowTimer = BOSS_P2_THROW_INTERVAL;

    // Boss projectiles
    this.bossProjectiles = [];

    // Floor crack marks from phase 3 throws
    this.floorCracks = [];

    // Armchair state (can become a projectile in phase 2)
    this.armchairX = ARMCHAIR_X;
    this.armchairY = ARMCHAIR_Y;
    this.armchairInPlace = true;
    this.armchairProjectile = null; // when pushed as projectile

    // Armchair sprite (separate from boss — used for depth layering)
    this.armchairSprite = this.add.image(this.armchairX, this.armchairY, 'armchair').setDepth(12);
    this.armchairSprite.setDisplaySize(ARMCHAIR_W, ARMCHAIR_H);

    // Boss sprite — starts hidden BEHIND armchair (depth 8 < armchair 12)
    // Position boss so only top of head (hair/eyebrows/eyes) peeks above backrest
    this.bossSprite = this.add.image(this.armchairX, this.armchairY, 'ts_boss4_normal').setDepth(8);
    this.bossSprite.setDisplaySize(BOSS_DISPLAY, BOSS_DISPLAY);
    this.bossSprite.setAlpha(1);

    // Boss HP bar
    this._createBossHPBar();

    // HUD elements
    this._createBossHUD();

    // Instructions
    this.instrText.setText('ARROWS: Move | SPACE: Shoot | SHIFT: Dash | X: Missile');
    this.instrText.setColor('#ff8800');
    this.instrText.setAlpha(1);
    this.instrBg.setAlpha(0.7);
    this.time.delayedCall(4000, () => {
      if (this.phase === 'boss') {
        this.tweens.add({ targets: [this.instrText, this.instrBg], alpha: 0, duration: 800 });
      }
    });

    // Start boss entrance
    this._bossEntrance();
  }

  _generateRoomDebris() {
    // Pre-generate static debris positions for the destroyed room
    this.roomDebris = [];
    for (let i = 0; i < 10; i++) {
      this.roomDebris.push({
        x: ROOM_LEFT + 60 + Math.random() * (ROOM_RIGHT - ROOM_LEFT - 120),
        y: ROOM_TOP + 60 + Math.random() * (ROOM_BOTTOM - ROOM_TOP - 120),
        w: 8 + Math.random() * 16,
        h: 6 + Math.random() * 12,
        rotation: Math.random() * Math.PI,
        shade: 0.3 + Math.random() * 0.3,
      });
    }
    // Overturned table on left side
    this.roomTable = { x: 160, y: 200, w: 70, h: 30, rotation: 0.35 };
    // Broken chairs (scattered on floor)
    this.roomChairs = [];
    for (let i = 0; i < 3; i++) {
      this.roomChairs.push({
        x: 100 + Math.random() * 300,
        y: 100 + Math.random() * 350,
        size: 12 + Math.random() * 8,
        rotation: Math.random() * Math.PI * 2,
      });
    }
    // Hanging cables from ceiling (start points at top)
    this.roomCables = [];
    const cableColors = [0xCC3333, 0x33AA33, 0x3333CC];
    for (let i = 0; i < 3; i++) {
      const cx = 200 + i * 250 + (Math.random() - 0.5) * 80;
      const segments = [];
      let sy = ROOM_TOP;
      for (let s = 0; s < 6; s++) {
        sy += 15 + Math.random() * 20;
        segments.push({ x: cx + (Math.random() - 0.5) * 30, y: sy });
      }
      this.roomCables.push({ startX: cx, segments, color: cableColors[i] });
    }
    // Glass fragments (tiny bright dots)
    this.roomGlass = [];
    for (let i = 0; i < 20; i++) {
      this.roomGlass.push({
        x: ROOM_LEFT + 50 + Math.random() * (ROOM_RIGHT - ROOM_LEFT - 100),
        y: ROOM_TOP + 50 + Math.random() * (ROOM_BOTTOM - ROOM_TOP - 100),
        size: 1 + Math.random() * 2,
      });
    }
    // Small rubble pieces on floor
    this.roomRubble = [];
    for (let i = 0; i < 18; i++) {
      this.roomRubble.push({
        x: ROOM_LEFT + 50 + Math.random() * (ROOM_RIGHT - ROOM_LEFT - 100),
        y: ROOM_TOP + 50 + Math.random() * (ROOM_BOTTOM - ROOM_TOP - 100),
        r: 2 + Math.random() * 3,
        isRect: Math.random() > 0.5,
        w: 3 + Math.random() * 5,
        h: 2 + Math.random() * 4,
        shade: 0x50 + Math.floor(Math.random() * 0x30),
      });
    }
    // Damp patches on floor
    this.roomDamp = [];
    for (let i = 0; i < 5; i++) {
      this.roomDamp.push({
        x: ROOM_LEFT + 80 + Math.random() * (ROOM_RIGHT - ROOM_LEFT - 160),
        y: ROOM_TOP + 80 + Math.random() * (ROOM_BOTTOM - ROOM_TOP - 160),
        rx: 10 + Math.random() * 20,
        ry: 8 + Math.random() * 15,
      });
    }
    // Bullet impact craters on walls
    this.wallCraters = [
      { x: 120, y: 15, r: 5 },
      { x: 350, y: 22, r: 7 },
      { x: 680, y: 12, r: 4 },
      { x: 820, y: 18, r: 6 },
      { x: 15, y: 180, r: 5 },
      { x: 20, y: 320, r: 6 },
      { x: W - 15, y: 200, r: 5 },
      { x: W - 18, y: 380, r: 7 },
    ];
    // Soot/burn marks
    this.wallSoot = [
      { x: 250, y: 10, w: 40, h: 25 },
      { x: 550, y: 5, w: 50, h: 30 },
      { x: 8, y: 250, w: 25, h: 40 },
      { x: W - 30, y: 280, w: 25, h: 35 },
    ];
    // Sandbag barricades
    this.sandbags = [
      { x: ROOM_LEFT + 80, y: ROOM_BOTTOM - 60 },
      { x: ROOM_RIGHT - 100, y: ROOM_TOP + 80 },
    ];
    // Military supply crates
    this.supplyCrates = [
      { x: ROOM_LEFT + 60, y: ROOM_TOP + 70, w: 28, h: 22, color: 0x4a6a3a },
      { x: ROOM_RIGHT - 80, y: ROOM_BOTTOM - 70, w: 32, h: 24, color: 0x6a5030 },
    ];
    // Scattered papers/documents on floor
    this.papers = [];
    for (let i = 0; i < 8; i++) {
      this.papers.push({
        x: ROOM_LEFT + 80 + Math.random() * (ROOM_RIGHT - ROOM_LEFT - 160),
        y: ROOM_TOP + 80 + Math.random() * (ROOM_BOTTOM - ROOM_TOP - 160),
        w: 6 + Math.random() * 8,
        h: 8 + Math.random() * 6,
        rotation: Math.random() * Math.PI * 2,
        isBeige: Math.random() > 0.5,
      });
    }
    // Map pinned to wall (top wall)
    this.wallMap = { x: 700, y: 6, w: 36, h: 28 };
    // Radio equipment on crate
    this.radioEquip = { x: ROOM_RIGHT - 74, y: ROOM_BOTTOM - 82, w: 18, h: 12 };
    // Mattress in corner
    this.mattress = { x: ROOM_LEFT + 60, y: ROOM_BOTTOM - 50, w: 50, h: 28 };
    // Light beams through wall holes
    this.lightBeams = [
      { x: 370, y: 0, w: 60, endY: 160, angle: 0.15 },
      { x: 520, y: 0, w: 40, endY: 120, angle: -0.1 },
    ];
    // Flickering light state
    this.flickerTimer = 0;
    this.flickerState = 1.0;
    this.flickerInterval = 5 + Math.random() * 2;
  }

  _createBossHPBar() {
    const barW = W - 100;
    const barH = 16;
    const barX = 50;
    const barY = 10;

    this.bossHPBarBg = this.add.rectangle(barX + barW / 2, barY + barH / 2, barW, barH, 0x222222)
      .setDepth(51).setScrollFactor(0);
    this.bossHPBarBg.setStrokeStyle(1, 0x444444);

    this.bossHPBarFill = this.add.rectangle(barX + 1, barY + 1, barW - 2, barH - 2, 0xff0000)
      .setDepth(52).setScrollFactor(0).setOrigin(0, 0);

    this.bossHPBarLabel = this.add.text(W / 2, barY - 2, 'YAHYA SINWAR', {
      fontFamily: 'monospace', fontSize: '12px', color: '#ff4444',
      shadow: { offsetX: 0, offsetY: 0, color: '#ff4444', blur: 6, fill: true },
    }).setOrigin(0.5, 1).setDepth(53).setScrollFactor(0);
  }

  _createBossHUD() {
    // Drone HP (bottom-left)
    this.droneHPLabel = this.add.text(20, H - 30, '', {
      fontFamily: 'monospace', fontSize: '12px', color: '#00e5ff',
    }).setDepth(52).setScrollFactor(0);

    // Dash cooldown indicator (bottom-left, above HP)
    this.dodgeHudLabel = this.add.text(20, H - 55, 'DASH', {
      fontFamily: 'monospace', fontSize: '10px', color: '#00ccff',
    }).setDepth(52).setScrollFactor(0);
    this.dodgeHudBg = this.add.rectangle(62, H - 50, 40, 6, 0x222222).setDepth(51).setScrollFactor(0);
    this.dodgeHudFill = this.add.rectangle(62, H - 50, 40, 6, 0x00ccff).setDepth(52).setScrollFactor(0);

    // Missile cooldown indicator (bottom-left, above dash)
    this.missileHudLabel = this.add.text(20, H - 75, 'MISSILE', {
      fontFamily: 'monospace', fontSize: '10px', color: '#ff4444',
    }).setDepth(52).setScrollFactor(0);
    this.missileHudBg = this.add.rectangle(72, H - 70, 40, 6, 0x222222).setDepth(51).setScrollFactor(0);
    this.missileHudFill = this.add.rectangle(72, H - 70, 40, 6, 0xff4444).setDepth(52).setScrollFactor(0);
  }

  _updateBossHPBar() {
    if (!this.bossHPBarFill || !this.bossHPBarBg) return;
    const barW = W - 100;
    const ratio = Math.max(0, this.bossHP / this.bossMaxHP);
    this.bossHPBarFill.width = (barW - 2) * ratio;

    let color;
    if (ratio > 0.6) color = 0xff0000;
    else if (ratio > 0.3) color = 0xff8800;
    else color = 0x880000;
    this.bossHPBarFill.setFillStyle(color);
  }

  _bossEntrance() {
    this.bossActive = false;
    SoundManager.get().playBossEntrance();

    // Boss starts behind armchair (depth 8, armchair depth 12)
    this.bossX = ARMCHAIR_X;
    this.bossY = ARMCHAIR_Y;

    if (this.bossSprite) {
      this.bossSprite.setPosition(this.bossX, this.bossY);
      this.bossSprite.setAlpha(0.3);
      this.bossSprite.setDepth(8);
      this.bossSprite.setDisplaySize(BOSS_DISPLAY * 0.4, BOSS_DISPLAY * 0.4);
    }

    // Dramatic entrance: boss rises from behind armchair to above it
    this.tweens.add({
      targets: { val: 0 },
      val: 1,
      duration: 1500,
      ease: 'Back.easeOut',
      onUpdate: (tween) => {
        const t = tween.getValue();
        if (this.bossSprite) {
          this.bossSprite.setAlpha(0.3 + 0.7 * t);
          const size = Phaser.Math.Linear(BOSS_DISPLAY * 0.4, BOSS_DISPLAY, t);
          this.bossSprite.setDisplaySize(size, size);
          // Rise above armchair during entrance
          this.bossSprite.setDepth(t > 0.5 ? 15 : 8);
          this.bossSprite.y = this.bossY - 40 * t;
        }
      },
      onComplete: () => {
        this.cameras.main.shake(400, 0.025);
        SoundManager.get().playBossShockwave();

        // Reset boss to hiding state behind armchair (depth 8)
        this.bossPeekScale = 0.4;
        if (this.bossSprite) {
          this.bossSprite.setAlpha(1);
          this.bossSprite.setDepth(8);
          this.bossSprite.setDisplaySize(BOSS_DISPLAY, BOSS_DISPLAY);
        }

        const nameText = this.add.text(W / 2, H / 2, 'YAHYA SINWAR', {
          fontFamily: 'monospace', fontSize: '40px', color: '#ff4444',
          shadow: { offsetX: 0, offsetY: 0, color: '#ff4444', blur: 20, fill: true },
        }).setOrigin(0.5).setDepth(55).setScrollFactor(0).setAlpha(0);

        this.tweens.add({
          targets: nameText,
          alpha: 1,
          duration: 500,
          yoyo: true,
          hold: 1500,
          onComplete: () => {
            nameText.destroy();
            this.bossActive = true;
          },
        });
      },
    });
  }


  // ═════════════════════════════════════════════════════════════
  // BOSS UPDATE: Top-down state machine
  // ═════════════════════════════════════════════════════════════
  _updateBoss(dt) {
    if (!this.bossActive || this.bossDefeated) return;

    const hpRatio = this.bossHP / this.bossMaxHP;

    // Phase transitions
    const prevPhase = this.bossPhase;
    if (hpRatio <= BOSS_PHASE3_THRESHOLD && this.bossPhase < 3) {
      this.bossPhase = 3;
      this.bossState = 'moving';
      this.bossStateTimer = 0;
      this.bossChargeTimer = BOSS_P3_CHARGE_INTERVAL;
      this.bossCharging = false;
      SoundManager.get().playBossRoar();
      this.cameras.main.shake(400, 0.03);
      if (this.bossSprite) {
        this.tweens.add({ targets: this.bossSprite, alpha: 0.2, duration: 60, yoyo: true, repeat: 8 });
      }
    } else if (hpRatio <= BOSS_PHASE2_THRESHOLD && this.bossPhase < 2) {
      this.bossPhase = 2;
      this.bossState = 'moving';
      this.bossStateTimer = 0;
      this.bossThrowTimer = BOSS_P2_THROW_INTERVAL;
      this._pickBossMoveTarget();
      SoundManager.get().playBossRoar();
      this.cameras.main.shake(250, 0.018);
      if (this.bossSprite) {
        this.tweens.add({ targets: this.bossSprite, alpha: 0.3, duration: 80, yoyo: true, repeat: 4 });
        // Start breathing idle animation for phases 2+
        if (!this._bossBreathingTween) {
          this._bossBreathingTween = this.tweens.add({
            targets: this.bossSprite,
            scaleY: (BOSS_DISPLAY * 1.02) / 128,
            duration: 1200,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
          });
        }
      }
    }

    // Expression changes
    let newExpr;
    if (this.bossPhase === 1) newExpr = 'normal';
    else if (this.bossPhase === 2) newExpr = 'angry';
    else newExpr = 'furious';

    if (newExpr !== this.bossExpression) {
      this.bossExpression = newExpr;
      const texKey = 'ts_boss4_' + newExpr;
      if (this.bossSprite && this.textures.exists(texKey)) {
        this.bossSprite.setTexture(texKey);
      }
    }

    // Phase-specific logic
    switch (this.bossPhase) {
      case 1: this._updateBossPhase1(dt); break;
      case 2: this._updateBossPhase2(dt); break;
      case 3: this._updateBossPhase3(dt); break;
    }

    // Update boss sprite position
    if (this.bossSprite) {
      this.bossSprite.setPosition(this.bossX, this.bossY);
    }

    // Update projectiles
    this._updateBossProjectiles(dt);

    // Update armchair projectile if in flight
    this._updateArmchairProjectile(dt);

    // Update HP bar
    this._updateBossHPBar();
  }

  // ── Phase 1: hiding -> peeking -> throwing -> hiding ──
  // When hiding: boss is BEHIND armchair (depth 8 < armchair 12),
  // positioned so only hair/eyebrows/eyes peek above the backrest.
  // When attacking: boss rises UP (depth 15, IN FRONT of armchair).
  _updateBossPhase1(dt) {
    this.bossStateTimer -= dt;

    switch (this.bossState) {
      case 'hiding':
        // NOT vulnerable — boss behind armchair, only top of head visible
        this.bossVisible = false;
        this.bossX = this.armchairX;
        // Position boss so the top ~20% (hair/brows/eyes) peeks above armchair backrest
        // The armchair top edge is at armchairY - ARMCHAIR_H/2 = 280 - 30 = 250
        // Boss sprite center is placed so that the top portion shows above
        this.bossY = this.armchairY + ARMCHAIR_H * 0.15;
        // Slight X tracking toward player (eyes follow drone)
        const trackOffsetX = Math.sign(this.droneX - this.armchairX) * 3;
        this.bossX = this.armchairX + trackOffsetX;
        if (this.bossSprite) {
          this.bossSprite.setTexture('ts_boss4_' + this.bossExpression);
          this.bossSprite.setDisplaySize(BOSS_DISPLAY, BOSS_DISPLAY);
          this.bossSprite.setDepth(8); // BEHIND armchair (depth 12)
          this.bossSprite.setAlpha(1);
        }
        if (this.bossStateTimer <= 0) {
          this.bossState = 'peeking';
          this.bossStateTimer = BOSS_P1_PEEK_DUR;
          this.bossVisible = true;
        }
        break;

      case 'peeking': {
        // Boss rises from behind armchair — becomes vulnerable
        this.bossVisible = true;
        const riseProgress = Math.min(1, (BOSS_P1_PEEK_DUR - this.bossStateTimer) / BOSS_P1_PEEK_RISE);
        this.bossX = this.armchairX;
        // Rise from behind-armchair position to fully above
        const hideY = this.armchairY + ARMCHAIR_H * 0.15;
        const attackY = this.armchairY - ARMCHAIR_H / 2 - BOSS_DISPLAY * 0.4;
        this.bossY = hideY + (attackY - hideY) * riseProgress;

        if (this.bossSprite) {
          this.bossSprite.setTexture('ts_boss4_' + this.bossExpression);
          this.bossSprite.setDisplaySize(BOSS_DISPLAY, BOSS_DISPLAY);
          // Transition depth: switch to IN FRONT when risen enough
          this.bossSprite.setDepth(riseProgress > 0.5 ? 15 : 8);
          this.bossSprite.setAlpha(1);
        }

        if (this.bossStateTimer <= 0) {
          this.bossState = 'throwing';
          this.bossStateTimer = 0.8; // 0.5s wind-up + 0.3s throw
          this._bossWindUp = true;
          this._bossWindUpTimer = 0.5;
        }
        break;
      }

      case 'throwing':
        // Full sprite, full size, IN FRONT of armchair
        this.bossVisible = true;
        this.bossY = this.armchairY - ARMCHAIR_H / 2 - BOSS_DISPLAY * 0.4;
        if (this.bossSprite) {
          this.bossSprite.setTexture('ts_boss4_' + this.bossExpression);
          this.bossSprite.setDisplaySize(BOSS_DISPLAY, BOSS_DISPLAY);
          this.bossSprite.setDepth(15); // IN FRONT of armchair
          this.bossSprite.setAlpha(1);
        }

        // Wind-up animation: arm raises 0.5s before throw
        if (this._bossWindUp) {
          this._bossWindUpTimer -= dt;
          // Slight tilt during wind-up
          if (this.bossSprite) {
            this.bossSprite.setRotation(Math.sin(this._bossWindUpTimer * 12) * 0.08);
          }
          if (this._bossWindUpTimer <= 0) {
            this._bossWindUp = false;
            this._bossThrowObject();
            if (this.bossSprite) this.bossSprite.setRotation(0);
          }
        }

        if (this.bossStateTimer <= 0) {
          // Sink back behind armchair
          this.bossState = 'hiding';
          // Consistent hide duration
          this.bossStateTimer = BOSS_P1_HIDE_MIN + 0.25; // always 1.75s
          if (this.bossSprite) {
            this.bossSprite.setDepth(8); // back BEHIND armchair
            this.bossSprite.setRotation(0);
          }
        }
        break;
    }
  }

  // ── Phase 2: moving & throwing, occasionally pushes armchair ──
  _updateBossPhase2(dt) {
    this.bossVisible = true;
    if (this.bossSprite) {
      this.bossSprite.setDisplaySize(BOSS_DISPLAY, BOSS_DISPLAY);
      this.bossSprite.setAlpha(1);
      this.bossSprite.setDepth(15); // Always in front during phase 2
    }

    // Movement toward target position
    const dx = this.bossTargetX - this.bossX;
    const dy = this.bossTargetY - this.bossY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > 5) {
      this.bossX += (dx / dist) * BOSS_P2_SPEED * dt;
      this.bossY += (dy / dist) * BOSS_P2_SPEED * dt;
    } else {
      this._pickBossMoveTarget();
    }

    // Keep in room bounds
    this.bossX = Phaser.Math.Clamp(this.bossX, ROOM_LEFT + 60, ROOM_RIGHT - 60);
    this.bossY = Phaser.Math.Clamp(this.bossY, ROOM_TOP + 60, ROOM_BOTTOM - 60);

    // Throw timer
    this.bossThrowTimer -= dt;
    if (this.bossThrowTimer <= 0) {
      this.bossThrowTimer = BOSS_P2_THROW_INTERVAL;
      this._bossThrowObject(BOSS_P2_PROJ_SIZE);

      // Armchair push every 5th throw (predictable pattern instead of random 20%)
      if (!this._p2ThrowCount) this._p2ThrowCount = 0;
      this._p2ThrowCount++;
      if (this.armchairInPlace && this._p2ThrowCount % 5 === 0) {
        this._bossPushArmchair();
      }
    }
  }

  // ── Phase 3: desperate mode ──
  _updateBossPhase3(dt) {
    this.bossVisible = true;
    if (this.bossSprite) {
      this.bossSprite.setDisplaySize(BOSS_DISPLAY, BOSS_DISPLAY);
      this.bossSprite.setAlpha(1);
      this.bossSprite.setDepth(15); // Always in front during phase 3
    }

    // Charge logic
    if (this.bossCharging) {
      this.bossChargeElapsed += dt;
      this.bossX += this.bossChargeDirX * BOSS_P3_CHARGE_SPEED * dt;
      this.bossY += this.bossChargeDirY * BOSS_P3_CHARGE_SPEED * dt;

      // Red glow trail behind boss during charge
      if (Math.random() < 0.7) {
        const trailGlow = this.add.circle(
          this.bossX - this.bossChargeDirX * 30,
          this.bossY - this.bossChargeDirY * 30,
          12 + Math.random() * 8, 0xff0000, 0.4
        ).setDepth(15);
        this.tweens.add({
          targets: trailGlow, alpha: 0, scale: 2.0, duration: 400,
          onComplete: () => trailGlow.destroy(),
        });
      }

      // Keep in bounds
      this.bossX = Phaser.Math.Clamp(this.bossX, ROOM_LEFT + 50, ROOM_RIGHT - 50);
      this.bossY = Phaser.Math.Clamp(this.bossY, ROOM_TOP + 50, ROOM_BOTTOM - 50);

      // Check collision with drone during charge
      if (this.droneInvulnTimer <= 0) {
        const contactDist = Phaser.Math.Distance.Between(this.bossX, this.bossY, this.droneX, this.droneY);
        if (contactDist < 45) {
          this._takeDamage(BOSS_CHARGE_DMG);
          this.droneInvulnTimer = 1.0;
          SoundManager.get().playBossShockwave();
          this.cameras.main.shake(300, 0.025);
        }
      }

      // End charge after duration
      if (this.bossChargeElapsed >= BOSS_P3_CHARGE_DURATION) {
        this.bossCharging = false;
        this.bossChargeTimer = BOSS_P3_CHARGE_INTERVAL;
        this._pickBossMoveTarget();
      }
    } else {
      // Normal movement
      const dx = this.bossTargetX - this.bossX;
      const dy = this.bossTargetY - this.bossY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 5) {
        this.bossX += (dx / dist) * BOSS_P3_SPEED * dt;
        this.bossY += (dy / dist) * BOSS_P3_SPEED * dt;
      } else {
        this._pickBossMoveTarget();
      }

      // Keep in bounds
      this.bossX = Phaser.Math.Clamp(this.bossX, ROOM_LEFT + 50, ROOM_RIGHT - 50);
      this.bossY = Phaser.Math.Clamp(this.bossY, ROOM_TOP + 50, ROOM_BOTTOM - 50);

      // Charge timer — with 0.5s telegraph before charging
      this.bossChargeTimer -= dt;
      if (this.bossChargeTimer <= 0 && !this._chargeTelegraphing) {
        this._chargeTelegraphing = true;

        // TELEGRAPH: Red exclamation mark above boss head for 0.5s
        const exclMark = this.add.text(this.bossX, this.bossY - 50, '!', {
          fontFamily: 'monospace', fontSize: '32px', color: '#ff0000', fontStyle: 'bold',
          shadow: { offsetX: 0, offsetY: 0, color: '#ff0000', blur: 12, fill: true },
        }).setOrigin(0.5).setDepth(25);
        this.tweens.add({
          targets: exclMark, scale: 1.4, alpha: 0.4, duration: 125,
          yoyo: true, repeat: 1,
        });

        // Red glow telegraph around boss
        const chargeGlow = this.add.circle(this.bossX, this.bossY, 55, 0xff0000, 0.35).setDepth(16);
        this.tweens.add({
          targets: chargeGlow, scale: 1.6, alpha: 0.55, duration: 200,
          yoyo: true,
          onComplete: () => chargeGlow.destroy(),
        });

        // Delay charge by 0.5s after telegraph
        this.time.delayedCall(500, () => {
          exclMark.destroy();
          this._chargeTelegraphing = false;
          // Start charge toward drone
          this.bossCharging = true;
          this.bossChargeElapsed = 0;
          const cdx = this.droneX - this.bossX;
          const cdy = this.droneY - this.bossY;
          const cDist = Math.sqrt(cdx * cdx + cdy * cdy) || 1;
          this.bossChargeDirX = cdx / cDist;
          this.bossChargeDirY = cdy / cDist;
          SoundManager.get().playBossRoar();
          if (this.bossSprite) {
            this.bossSprite.setDisplaySize(BOSS_DISPLAY * 1.15, BOSS_DISPLAY * 1.15);
          }
        });
      }
    }

    // Throw timer (every 1 second in phase 3)
    this.bossThrowTimer -= dt;
    if (this.bossThrowTimer <= 0) {
      this.bossThrowTimer = BOSS_P3_THROW_INTERVAL;
      this._bossThrowObject(BOSS_P3_PROJ_SIZE);
    }
  }

  _pickBossMoveTarget() {
    // Patrol pattern instead of random positions — cycles through predictable waypoints
    if (!this._patrolIndex) this._patrolIndex = 0;
    const patrolPoints = [
      { x: ROOM_LEFT + 120, y: ROOM_TOP + 120 },       // top-left
      { x: ROOM_RIGHT - 120, y: ROOM_TOP + 120 },      // top-right
      { x: W / 2, y: H / 2 },                           // center
      { x: ROOM_RIGHT - 120, y: ROOM_BOTTOM - 120 },   // bottom-right
      { x: ROOM_LEFT + 120, y: ROOM_BOTTOM - 120 },    // bottom-left
      { x: W / 2, y: ROOM_TOP + 100 },                  // top-center
      { x: W / 2, y: ROOM_BOTTOM - 100 },               // bottom-center
      { x: ROOM_LEFT + 100, y: H / 2 },                 // left-center
      { x: ROOM_RIGHT - 100, y: H / 2 },                // right-center
      { x: W / 2, y: H / 2 },                           // center again
    ];
    const pt = patrolPoints[this._patrolIndex % patrolPoints.length];
    this._patrolIndex++;
    this.bossTargetX = pt.x;
    this.bossTargetY = pt.y;
  }

  // ── Boss throws an object toward the drone ──
  // Wind-up telegraph: boss scales up 1.1x for 0.3s with red glow before throwing
  _bossThrowObject(projSize) {
    if (!this.bossSprite) return;
    if (this._throwTelegraphing) return; // prevent overlap
    this._throwTelegraphing = true;

    // TELEGRAPH: boss wind-up animation
    // Scale up boss sprite to 1.1x for 0.3s
    const origW = this.bossSprite.displayWidth;
    const origH = this.bossSprite.displayHeight;
    this.tweens.add({
      targets: this.bossSprite,
      displayWidth: origW * 1.1,
      displayHeight: origH * 1.1,
      duration: 150,
      yoyo: true,
    });

    // Red glow around boss for 0.3s
    const throwGlow = this.add.circle(this.bossX, this.bossY, 50, 0xff0000, 0.3).setDepth(17);
    this.tweens.add({
      targets: throwGlow, scale: 1.4, alpha: 0.5, duration: 150,
      yoyo: true,
      onComplete: () => throwGlow.destroy(),
    });

    // ── THROWING ARM ANIMATION ──
    const throwAngle = Math.atan2(this.droneY - this.bossY, this.droneX - this.bossX);
    const windUpAngle = throwAngle + Math.PI; // opposite direction for wind-up
    const armDepth = this.bossSprite.depth + 1;
    const armGfx = this.add.graphics().setDepth(armDepth);
    const bx = this.bossX;
    const by = this.bossY;

    // Phase 1 (0-150ms): Arm extends BACKWARD (wind-up)
    this.tweens.addCounter({
      from: 0, to: 1, duration: 150,
      onUpdate: (tween) => {
        const t = tween.getValue();
        armGfx.clear();
        const armLen = 25 * t;
        const ax = bx + Math.cos(windUpAngle) * armLen;
        const ay = by + Math.sin(windUpAngle) * armLen;
        // Suit sleeve (dark outline)
        armGfx.lineStyle(8, 0x2a2a2a);
        armGfx.lineBetween(bx, by, ax, ay);
        // Inner arm
        armGfx.lineStyle(6, 0x3a3a3a);
        armGfx.lineBetween(bx, by, ax, ay);
        // Hand (skin-colored circle)
        armGfx.fillStyle(0xc4956a);
        armGfx.fillCircle(ax, ay, 4);
        // Hand outline
        armGfx.lineStyle(1, 0x8a6a4a);
        armGfx.strokeCircle(ax, ay, 4);
      },
    });

    // Phase 2 (150-250ms): Arm swings FORWARD rapidly toward throw direction
    this.time.delayedCall(150, () => {
      if (!armGfx.scene) return; // safety check
      // Compute the shortest angular sweep from windUpAngle to throwAngle
      let angleDelta = throwAngle - windUpAngle;
      // Normalize to [-PI, PI] so we take the short arc
      while (angleDelta > Math.PI) angleDelta -= 2 * Math.PI;
      while (angleDelta < -Math.PI) angleDelta += 2 * Math.PI;

      this.tweens.addCounter({
        from: 0, to: 1, duration: 100, ease: 'Quad.easeIn',
        onUpdate: (tween) => {
          const t = tween.getValue();
          armGfx.clear();
          const currentAngle = windUpAngle + angleDelta * t;
          const armLen = 25 + 5 * t; // arm extends slightly further
          const ax = bx + Math.cos(currentAngle) * armLen;
          const ay = by + Math.sin(currentAngle) * armLen;
          // Suit sleeve (dark outline)
          armGfx.lineStyle(8, 0x2a2a2a);
          armGfx.lineBetween(bx, by, ax, ay);
          // Inner arm
          armGfx.lineStyle(6, 0x3a3a3a);
          armGfx.lineBetween(bx, by, ax, ay);
          // Hand grows at release (4 -> 6 radius)
          const handR = 4 + 2 * t;
          armGfx.fillStyle(0xc4956a);
          armGfx.fillCircle(ax, ay, handR);
          armGfx.lineStyle(1, 0x8a6a4a);
          armGfx.strokeCircle(ax, ay, handR);
        },
      });
    });

    // Phase 3 (250-300ms): Arm holds at full extension toward target
    this.time.delayedCall(250, () => {
      if (!armGfx.scene) return;
      armGfx.clear();
      const armLen = 30;
      const ax = bx + Math.cos(throwAngle) * armLen;
      const ay = by + Math.sin(throwAngle) * armLen;
      armGfx.lineStyle(8, 0x2a2a2a);
      armGfx.lineBetween(bx, by, ax, ay);
      armGfx.lineStyle(6, 0x3a3a3a);
      armGfx.lineBetween(bx, by, ax, ay);
      armGfx.fillStyle(0xc4956a);
      armGfx.fillCircle(ax, ay, 6);
      armGfx.lineStyle(1, 0x8a6a4a);
      armGfx.strokeCircle(ax, ay, 6);
    });

    // Phase 4 (300-400ms): Arm retracts back to body and disappears
    this.time.delayedCall(300, () => {
      if (!armGfx.scene) return;
      this.tweens.addCounter({
        from: 1, to: 0, duration: 100,
        onUpdate: (tween) => {
          const t = tween.getValue();
          armGfx.clear();
          if (t > 0.05) {
            const armLen = 30 * t;
            const ax = bx + Math.cos(throwAngle) * armLen;
            const ay = by + Math.sin(throwAngle) * armLen;
            armGfx.lineStyle(8, 0x2a2a2a);
            armGfx.lineBetween(bx, by, ax, ay);
            armGfx.lineStyle(6, 0x3a3a3a);
            armGfx.lineBetween(bx, by, ax, ay);
            armGfx.fillStyle(0xc4956a);
            armGfx.fillCircle(ax, ay, 4);
            armGfx.lineStyle(1, 0x8a6a4a);
            armGfx.strokeCircle(ax, ay, 4);
          }
        },
        onComplete: () => { if (armGfx.scene) armGfx.destroy(); },
      });
    });

    // Actually throw after 0.3s wind-up delay
    this.time.delayedCall(300, () => {
      this._throwTelegraphing = false;
      if (!this.bossSprite) return;
      SoundManager.get().playBossLaser();

      const size = projSize || 32;
      const startX = this.bossX;
      const startY = this.bossY;
      // Reduced spread for more predictability
      const spread = 20;
      const targetX = this.droneX + (Math.random() - 0.5) * spread;
      const targetY = this.droneY + (Math.random() - 0.5) * spread;

      const projIdx = Math.floor(Math.random() * 4);
      const projTex = 'boss_projectile_' + projIdx;
      const texKey = this.textures.exists(projTex) ? projTex : 'boss_projectile';
      const projTypes = ['plank', 'brick', 'concrete', 'bottle', 'chair'];
      const projType = projTypes[Math.floor(Math.random() * projTypes.length)];

      const proj = this.add.image(startX, startY, texKey).setDepth(18);
      proj.setDisplaySize(size, size);

      const dx = targetX - startX;
      const dy = targetY - startY;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;

      this.bossProjectiles.push({
        sprite: proj,
        x: startX,
        y: startY,
        vx: (dx / dist) * BOSS_THROW_SPEED,
        vy: (dy / dist) * BOSS_THROW_SPEED,
        size: size,
        type: projType,
        alive: true,
      });
    });
  }

  // ── Boss pushes the armchair as a projectile toward drone ──
  _bossPushArmchair() {
    if (!this.armchairInPlace) return;
    this.armchairInPlace = false;
    SoundManager.get().playBossShockwave();

    // Hide the armchair sprite (it's now a flying projectile drawn in _drawRoom)
    if (this.armchairSprite) {
      this.armchairSprite.setVisible(false);
    }

    const dx = this.droneX - this.armchairX;
    const dy = this.droneY - this.armchairY;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    this.armchairProjectile = {
      x: this.armchairX,
      y: this.armchairY,
      vx: (dx / dist) * 150,
      vy: (dy / dist) * 150,
      alive: true,
    };
  }

  _updateArmchairProjectile(dt) {
    const ap = this.armchairProjectile;
    if (!ap || !ap.alive) return;

    ap.x += ap.vx * dt;
    ap.y += ap.vy * dt;

    // Out of bounds
    if (ap.x < -100 || ap.x > W + 100 || ap.y < -100 || ap.y > H + 100) {
      ap.alive = false;
      return;
    }

    // Hit drone
    if (this.droneInvulnTimer <= 0) {
      const dist = Phaser.Math.Distance.Between(ap.x, ap.y, this.droneX, this.droneY);
      if (dist < 45) {
        ap.alive = false;
        this._takeDamage(BOSS_THROW_DMG);
        this.droneInvulnTimer = 1.0;
      }
    }
  }

  // ── Update boss projectiles ──
  _updateBossProjectiles(dt) {
    for (let i = this.bossProjectiles.length - 1; i >= 0; i--) {
      const p = this.bossProjectiles[i];
      if (!p.alive) {
        if (p.sprite) p.sprite.destroy();
        this.bossProjectiles.splice(i, 1);
        continue;
      }

      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.sprite.setPosition(p.x, p.y);
      p.sprite.rotation += 5 * dt; // rotation tween

      // Out of bounds
      if (p.x < -30 || p.x > W + 30 || p.y < -30 || p.y > H + 30) {
        // Phase 3: leave crack mark (capped at 40 to prevent memory growth)
        if (this.bossPhase === 3) {
          if (this.floorCracks.length >= 40) this.floorCracks.shift();
          this.floorCracks.push({
            x: Phaser.Math.Clamp(p.x, ROOM_LEFT + 10, ROOM_RIGHT - 10),
            y: Phaser.Math.Clamp(p.y, ROOM_TOP + 10, ROOM_BOTTOM - 10),
          });
        }
        this._projectileBreakEffect(p.x, p.y);
        p.alive = false;
        continue;
      }

      // Hit drone
      if (this.droneInvulnTimer <= 0 && !this.dodgeActive) {
        const dist = Phaser.Math.Distance.Between(p.x, p.y, this.droneX, this.droneY);
        if (dist < 25) {
          // Phase 3: leave crack mark (capped)
          if (this.bossPhase === 3) {
            if (this.floorCracks.length >= 40) this.floorCracks.shift();
            this.floorCracks.push({ x: p.x, y: p.y });
          }
          this._projectileBreakEffect(p.x, p.y);
          p.alive = false;
          this._takeDamage(BOSS_THROW_DMG);
          this.droneInvulnTimer = 1.0;
        }
      }
    }
  }

  _projectileBreakEffect(x, y) {
    for (let i = 0; i < 6; i++) {
      const px = x + (Math.random() - 0.5) * 10;
      const py = y + (Math.random() - 0.5) * 10;
      const particle = this.add.circle(px, py, 2 + Math.random() * 3, 0x8a7a6a, 0.8).setDepth(22);
      const vx = (Math.random() - 0.5) * 100;
      const vy = (Math.random() - 0.5) * 100;
      this.tweens.add({
        targets: particle,
        x: px + vx * 0.5,
        y: py + vy * 0.5,
        alpha: 0,
        scaleX: 0.3,
        scaleY: 0.3,
        duration: 400 + Math.random() * 200,
        onComplete: () => particle.destroy(),
      });
    }
  }

  // ── Boss damage visual effects ──
  _bossDamageEffects() {
    const flash = this.add.rectangle(W / 2, H / 2, W, H, 0xffffff, 0.12).setDepth(45).setScrollFactor(0);
    this.tweens.add({ targets: flash, alpha: 0, duration: 150, onComplete: () => flash.destroy() });

    const debrisColors = [0xff6600, 0xff8800, 0xffaa00, 0x8a7a6a, 0x6a5a4a, 0xffffff];
    for (let i = 0; i < 15; i++) {
      const px = this.bossX + (Math.random() - 0.5) * 50;
      const py = this.bossY + (Math.random() - 0.5) * 50;
      const radius = 1 + Math.random() * 4;
      const color = debrisColors[Math.floor(Math.random() * debrisColors.length)];
      const debris = this.add.circle(px, py, radius, color, 0.9).setDepth(22);
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 120;
      this.tweens.add({
        targets: debris,
        x: px + Math.cos(angle) * speed,
        y: py + Math.sin(angle) * speed,
        scale: 0,
        alpha: 0,
        rotation: Math.random() * 6,
        duration: 400 + Math.random() * 400,
        ease: 'Quad.easeOut',
        onComplete: () => debris.destroy(),
      });
    }
  }

  // ═════════════════════════════════════════════════════════════
  // DRONE COMBAT (top-down: SPACE shoot, X missile, SHIFT dash)
  // ═════════════════════════════════════════════════════════════
  _updateDroneCombat(dt) {
    this.droneShootTimer -= dt;
    this.droneMissileTimer -= dt;
    if (this.droneInvulnTimer > 0) this.droneInvulnTimer -= dt;

    // SPACE = shoot bullet toward boss
    if (this.keys.space.isDown && this.droneShootTimer <= 0) {
      this.droneShootTimer = DRONE_SHOOT_COOLDOWN;
      this._droneShootBullet();
    }

    // X = missile (heavier cooldown, heavy damage)
    if (Phaser.Input.Keyboard.JustDown(this.keys.x) && this.droneMissileTimer <= 0) {
      this.droneMissileTimer = DRONE_MISSILE_COOLDOWN;
      this._droneShootMissile();
    }

    // Update drone bullets
    for (let i = this.droneBullets.length - 1; i >= 0; i--) {
      const b = this.droneBullets[i];
      if (!b.alive) {
        if (b.sprite) b.sprite.destroy();
        this.droneBullets.splice(i, 1);
        continue;
      }

      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.sprite.setPosition(b.x, b.y);

      // Out of bounds
      if (b.x < ROOM_LEFT || b.x > ROOM_RIGHT || b.y < ROOM_TOP || b.y > ROOM_BOTTOM) {
        b.alive = false;
        continue;
      }

      // Hit boss (only when visible)
      if (this.bossActive && !this.bossDefeated && this.bossVisible) {
        const dist = Phaser.Math.Distance.Between(b.x, b.y, this.bossX, this.bossY);
        if (dist < BOSS_DISPLAY / 2.2) {
          b.alive = false;
          this._damageBoss(b.damage);
        }
      }
    }

    // Update drone missiles (homing toward boss)
    for (let i = this.droneMissiles.length - 1; i >= 0; i--) {
      const m = this.droneMissiles[i];
      if (!m.alive) {
        if (m.sprite) m.sprite.destroy();
        if (m.trail) m.trail.destroy();
        this.droneMissiles.splice(i, 1);
        continue;
      }

      // Home toward boss
      if (this.bossActive && !this.bossDefeated) {
        const angle = Math.atan2(this.bossY - m.y, this.bossX - m.x);
        const currentAngle = Math.atan2(m.vy, m.vx);
        const diff = angle - currentAngle;
        const turnRate = 3;
        const newAngle = currentAngle + Math.sign(Math.sin(diff)) * Math.min(Math.abs(diff), turnRate * dt);
        m.vx = Math.cos(newAngle) * DRONE_MISSILE_SPEED;
        m.vy = Math.sin(newAngle) * DRONE_MISSILE_SPEED;
      }

      m.x += m.vx * dt;
      m.y += m.vy * dt;
      m.sprite.setPosition(m.x, m.y);
      m.sprite.rotation = Math.atan2(m.vy, m.vx) - Math.PI / 2;

      // Trail
      if (m.trail) {
        m.trail.setPosition(m.x, m.y);
      }

      // Out of bounds
      if (m.x < ROOM_LEFT - 20 || m.x > ROOM_RIGHT + 20 || m.y < ROOM_TOP - 20 || m.y > ROOM_BOTTOM + 20) {
        m.alive = false;
        continue;
      }

      // Hit boss (missiles hit even when hiding)
      if (this.bossActive && !this.bossDefeated) {
        const dist = Phaser.Math.Distance.Between(m.x, m.y, this.bossX, this.bossY);
        if (dist < BOSS_DISPLAY / 2) {
          m.alive = false;
          this._damageBoss(m.damage);
          SoundManager.get().playExplosion();
          const blast = this.add.circle(m.x, m.y, 12, 0xff4400, 0.8).setDepth(22);
          this.tweens.add({
            targets: blast, scaleX: 3, scaleY: 3, alpha: 0, duration: 400,
            onComplete: () => blast.destroy(),
          });
        }
      }
    }
  }

  _droneShootBullet() {
    const startX = this.droneX;
    const startY = this.droneY;
    // Shoot toward the boss position
    const targetX = this.bossX;
    const targetY = this.bossY;

    const dx = targetX - startX;
    const dy = targetY - startY;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;

    const bullet = this.add.circle(startX, startY, DRONE_BULLET_RADIUS, 0x00e5ff, 1).setDepth(19);
    this.droneBullets.push({
      sprite: bullet,
      x: startX,
      y: startY,
      vx: (dx / dist) * DRONE_BULLET_SPEED,
      vy: (dy / dist) * DRONE_BULLET_SPEED,
      damage: BOSS_BULLET_DMG,
      alive: true,
    });
  }

  _droneShootMissile() {
    SoundManager.get().playBossLaser();
    const startX = this.droneX;
    const startY = this.droneY;
    const targetX = this.bossX;
    const targetY = this.bossY;

    const dx = targetX - startX;
    const dy = targetY - startY;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;

    const missile = this.add.circle(startX, startY, DRONE_MISSILE_RADIUS, 0xff4444, 1).setDepth(19);
    const trail = this.add.circle(startX, startY, 4, 0xff8800, 0.5).setDepth(18);

    this.droneMissiles.push({
      sprite: missile,
      trail: trail,
      x: startX,
      y: startY,
      vx: (dx / dist) * DRONE_MISSILE_SPEED,
      vy: (dy / dist) * DRONE_MISSILE_SPEED,
      damage: BOSS_MISSILE_DMG,
      alive: true,
    });
  }

  _damageBoss(amount) {
    if (this.bossDefeated) return;
    this.bossHP -= amount;
    SoundManager.get().playBossHit();

    // White flash → red flash → clear
    if (this.bossSprite) {
      this.bossSprite.setTint(0xffffff);
      this.time.delayedCall(50, () => {
        if (this.bossSprite && this.bossSprite.active) {
          this.bossSprite.setTint(0xff4444);
          this.time.delayedCall(100, () => {
            if (this.bossSprite && this.bossSprite.active) this.bossSprite.clearTint();
          });
        }
      });
      // Scale bump
      this.tweens.add({
        targets: this.bossSprite,
        scaleX: (BOSS_DISPLAY * 1.05) / 128,
        scaleY: (BOSS_DISPLAY * 1.05) / 128,
        duration: 100,
        yoyo: true,
        ease: 'Quad.easeOut',
      });
    }

    // Screen shake
    this.cameras.main.shake(100, 0.005);

    this._bossDamageEffects();

    // Damage number popup
    const dmgText = this.add.text(this.bossX + (Math.random() - 0.5) * 40, this.bossY - 50, `-${amount}`, {
      fontFamily: 'monospace', fontSize: '16px', color: amount >= 5 ? '#ff4444' : '#ffffff',
      shadow: { offsetX: 0, offsetY: 0, color: '#000000', blur: 3, fill: true },
    }).setOrigin(0.5).setDepth(55);
    this.tweens.add({
      targets: dmgText, y: this.bossY - 90, alpha: 0, duration: 800,
      onComplete: () => dmgText.destroy(),
    });

    this.score += amount * 50;

    if (this.bossHP <= 0) {
      this.bossHP = 0;
      this._updateBossHPBar();
      this._bossDeathAnimation();
    }
  }

  // ═════════════════════════════════════════════════════════════
  // ROOM RENDERING (top-down destroyed room, drawn each frame)
  // ═════════════════════════════════════════════════════════════
  _drawRoom() {
    const gfx = this.roomGfx;
    if (!gfx) return;
    gfx.clear();

    // ═══════════════════════════════════════════
    // 1. FLOOR (cracked concrete/tile base)
    // ═══════════════════════════════════════════
    gfx.fillStyle(0x777770);
    gfx.fillRect(ROOM_LEFT, ROOM_TOP, ROOM_RIGHT - ROOM_LEFT, ROOM_BOTTOM - ROOM_TOP);

    // Tile grid (subtle)
    gfx.lineStyle(0.5, 0x666660, 0.25);
    for (let tx = ROOM_LEFT; tx < ROOM_RIGHT; tx += 40) {
      gfx.beginPath(); gfx.moveTo(tx, ROOM_TOP); gfx.lineTo(tx, ROOM_BOTTOM); gfx.strokePath();
    }
    for (let ty = ROOM_TOP; ty < ROOM_BOTTOM; ty += 40) {
      gfx.beginPath(); gfx.moveTo(ROOM_LEFT, ty); gfx.lineTo(ROOM_RIGHT, ty); gfx.strokePath();
    }

    // Floor cracks (dark crack lines)
    gfx.lineStyle(1, 0x555548, 0.6);
    const crackSeeds = [
      [120, 150, 180, 160, 220, 190],
      [400, 100, 430, 130, 460, 110],
      [600, 350, 630, 380, 610, 420],
      [300, 400, 340, 420, 320, 460],
      [750, 200, 770, 240, 800, 220],
      [200, 300, 230, 320, 210, 350],
      [500, 250, 540, 260, 520, 290],
    ];
    for (const c of crackSeeds) {
      gfx.beginPath();
      gfx.moveTo(c[0], c[1]);
      gfx.lineTo(c[2], c[3]);
      gfx.lineTo(c[4], c[5]);
      gfx.strokePath();
    }

    // Damp patches (slightly darker areas)
    for (const dp of this.roomDamp) {
      gfx.fillStyle(0x606058, 0.3);
      gfx.fillEllipse(dp.x, dp.y, dp.rx * 2, dp.ry * 2);
    }

    // Small rubble pieces
    for (const rb of this.roomRubble) {
      const col = Phaser.Display.Color.GetColor(rb.shade, rb.shade, rb.shade - 8);
      gfx.fillStyle(col, 0.7);
      if (rb.isRect) {
        gfx.fillRect(rb.x, rb.y, rb.w, rb.h);
      } else {
        gfx.fillCircle(rb.x, rb.y, rb.r);
      }
    }

    // Dynamic floor cracks from phase 3 impacts
    gfx.lineStyle(1.5, 0x555550, 0.6);
    for (const crack of this.floorCracks) {
      gfx.beginPath();
      gfx.moveTo(crack.x - 8, crack.y - 5);
      gfx.lineTo(crack.x, crack.y);
      gfx.lineTo(crack.x + 6, crack.y + 7);
      gfx.strokePath();
      gfx.beginPath();
      gfx.moveTo(crack.x - 4, crack.y + 5);
      gfx.lineTo(crack.x, crack.y);
      gfx.lineTo(crack.x + 8, crack.y - 3);
      gfx.strokePath();
    }

    // Scattered papers/documents on floor
    for (const p of this.papers) {
      const pcolor = p.isBeige ? 0xd8d0b8 : 0xe8e4dc;
      gfx.fillStyle(pcolor, 0.7);
      const pcos = Math.cos(p.rotation), psin = Math.sin(p.rotation);
      const phw = p.w / 2, phh = p.h / 2;
      gfx.beginPath();
      gfx.moveTo(p.x + pcos * (-phw) - psin * (-phh), p.y + psin * (-phw) + pcos * (-phh));
      gfx.lineTo(p.x + pcos * phw - psin * (-phh), p.y + psin * phw + pcos * (-phh));
      gfx.lineTo(p.x + pcos * phw - psin * phh, p.y + psin * phw + pcos * phh);
      gfx.lineTo(p.x + pcos * (-phw) - psin * phh, p.y + psin * (-phw) + pcos * phh);
      gfx.closePath();
      gfx.fillPath();
    }

    // ═══════════════════════════════════════════
    // 2. WALLS (concrete with damage)
    // ═══════════════════════════════════════════
    const wallColor = 0x666658;
    gfx.fillStyle(wallColor);
    gfx.fillRect(0, 0, W, ROOM_TOP);
    gfx.fillRect(0, ROOM_BOTTOM, W, H - ROOM_BOTTOM);
    gfx.fillRect(0, 0, ROOM_LEFT, H);
    gfx.fillRect(ROOM_RIGHT, 0, W - ROOM_RIGHT, H);

    // Wall cracks
    gfx.lineStyle(1.5, 0x555548, 0.6);
    gfx.beginPath(); gfx.moveTo(200, 5); gfx.lineTo(220, 20); gfx.lineTo(210, 35); gfx.strokePath();
    gfx.beginPath(); gfx.moveTo(600, 8); gfx.lineTo(580, 25); gfx.lineTo(590, 38); gfx.strokePath();
    gfx.beginPath(); gfx.moveTo(5, 200); gfx.lineTo(20, 220); gfx.lineTo(8, 240); gfx.strokePath();
    gfx.beginPath(); gfx.moveTo(W - 5, 300); gfx.lineTo(W - 20, 320); gfx.lineTo(W - 8, 340); gfx.strokePath();
    gfx.beginPath(); gfx.moveTo(400, H - 5); gfx.lineTo(420, H - 20); gfx.lineTo(410, H - 35); gfx.strokePath();

    // Bullet impact craters on walls
    for (const cr of this.wallCraters) {
      gfx.fillStyle(0x333330, 0.6);
      gfx.fillCircle(cr.x, cr.y, cr.r);
      gfx.fillStyle(0x444440, 0.4);
      gfx.fillCircle(cr.x, cr.y, cr.r * 0.6);
      // Crater ring
      gfx.lineStyle(0.8, 0x555548, 0.5);
      gfx.strokeCircle(cr.x, cr.y, cr.r + 1);
    }

    // Soot/burn marks
    for (const soot of this.wallSoot) {
      gfx.fillStyle(0x2a2a24, 0.2);
      gfx.fillEllipse(soot.x + soot.w / 2, soot.y + soot.h / 2, soot.w, soot.h);
      gfx.fillStyle(0x1a1a16, 0.15);
      gfx.fillEllipse(soot.x + soot.w / 2 + 3, soot.y + soot.h / 2 + 2, soot.w * 0.6, soot.h * 0.6);
    }

    // Map pinned to top wall
    const wm = this.wallMap;
    gfx.fillStyle(0xd0c8a0, 0.8);
    gfx.fillRect(wm.x, wm.y, wm.w, wm.h);
    // Map lines (colored routes)
    gfx.lineStyle(1, 0xcc3333, 0.6);
    gfx.beginPath(); gfx.moveTo(wm.x + 5, wm.y + 8); gfx.lineTo(wm.x + 20, wm.y + 15); gfx.lineTo(wm.x + 32, wm.y + 10); gfx.strokePath();
    gfx.lineStyle(1, 0x3333cc, 0.5);
    gfx.beginPath(); gfx.moveTo(wm.x + 8, wm.y + 20); gfx.lineTo(wm.x + 25, wm.y + 22); gfx.strokePath();
    // Map pins
    gfx.fillStyle(0xff0000, 0.8);
    gfx.fillCircle(wm.x + 20, wm.y + 15, 2);
    gfx.fillCircle(wm.x + 10, wm.y + 8, 1.5);

    // ═══════════════════════════════════════════
    // 3. HOLE IN TOP WALL (collapsed ceiling)
    // ═══════════════════════════════════════════
    gfx.fillStyle(0x88bbee);
    gfx.fillRect(350, 0, 200, ROOM_TOP);
    gfx.fillStyle(0xaaccee, 0.5);
    gfx.fillRect(340, 0, 12, ROOM_TOP);
    gfx.fillRect(548, 0, 12, ROOM_TOP);

    // Light beams through wall holes (angled triangles)
    for (const beam of this.lightBeams) {
      gfx.fillStyle(0xeeeebb, 0.08);
      gfx.beginPath();
      gfx.moveTo(beam.x, ROOM_TOP);
      gfx.lineTo(beam.x + beam.w, ROOM_TOP);
      gfx.lineTo(beam.x + beam.w + beam.angle * beam.endY, beam.endY);
      gfx.lineTo(beam.x + beam.angle * beam.endY, beam.endY);
      gfx.closePath();
      gfx.fillPath();
      // Inner brighter core
      gfx.fillStyle(0xffffcc, 0.04);
      gfx.beginPath();
      gfx.moveTo(beam.x + 10, ROOM_TOP);
      gfx.lineTo(beam.x + beam.w - 10, ROOM_TOP);
      gfx.lineTo(beam.x + beam.w - 10 + beam.angle * beam.endY * 0.7, beam.endY * 0.7);
      gfx.lineTo(beam.x + 10 + beam.angle * beam.endY * 0.7, beam.endY * 0.7);
      gfx.closePath();
      gfx.fillPath();
    }

    // ═══════════════════════════════════════════
    // 4. FLICKERING FLUORESCENT LIGHT
    // ═══════════════════════════════════════════
    this.flickerTimer += 0.016; // approx dt
    if (this.flickerTimer >= this.flickerInterval) {
      this.flickerTimer = 0;
      this.flickerInterval = 5 + Math.random() * 2;
      // Quick flicker: toggle off then on
      this.flickerState = 0.3;
      this.time.delayedCall(80, () => { this.flickerState = 1.0; });
      this.time.delayedCall(160, () => { this.flickerState = 0.4; });
      this.time.delayedCall(260, () => { this.flickerState = 1.0; });
    }
    // Fluorescent tube on ceiling (top wall center)
    gfx.fillStyle(0xffffff, 0.6 * this.flickerState);
    gfx.fillRect(420, 2, 80, 6);
    // Light glow on floor
    gfx.fillStyle(0xeeee88, 0.06 * this.flickerState);
    gfx.fillRect(380, ROOM_TOP, 160, 100);

    // Light patches from broken windows
    gfx.fillStyle(0xeeee88, 0.15);
    gfx.fillRect(100, 120, 120, 80);
    gfx.fillStyle(0xeeee88, 0.12);
    gfx.fillRect(700, 350, 100, 70);
    gfx.fillStyle(0xeeeeaa, 0.1);
    gfx.fillRect(400, 80, 90, 60);

    // ═══════════════════════════════════════════
    // 5. FURNITURE & OBJECTS (non-interactive decoration)
    // ═══════════════════════════════════════════

    // Scattered debris (gray irregular shapes)
    for (const d of this.roomDebris) {
      const gray = Math.floor(0x60 + d.shade * 0x40);
      const col = Phaser.Display.Color.GetColor(gray, gray, gray - 8);
      gfx.fillStyle(col, 0.7);
      const dcx = d.x, dcy = d.y;
      const hw = d.w / 2, hh = d.h / 2;
      const cos = Math.cos(d.rotation), sin = Math.sin(d.rotation);
      gfx.beginPath();
      gfx.moveTo(dcx + cos * (-hw) - sin * (-hh), dcy + sin * (-hw) + cos * (-hh));
      gfx.lineTo(dcx + cos * hw - sin * (-hh), dcy + sin * hw + cos * (-hh));
      gfx.lineTo(dcx + cos * hw - sin * hh, dcy + sin * hw + cos * hh);
      gfx.lineTo(dcx + cos * (-hw) - sin * hh, dcy + sin * (-hw) + cos * hh);
      gfx.closePath();
      gfx.fillPath();
    }

    // Overturned table (left side, brown rectangle on its side with legs)
    const t = this.roomTable;
    gfx.fillStyle(0x6a5040, 0.8);
    const tcos = Math.cos(t.rotation), tsin = Math.sin(t.rotation);
    const thw = t.w / 2, thh = t.h / 2;
    gfx.beginPath();
    gfx.moveTo(t.x + tcos * (-thw) - tsin * (-thh), t.y + tsin * (-thw) + tcos * (-thh));
    gfx.lineTo(t.x + tcos * thw - tsin * (-thh), t.y + tsin * thw + tcos * (-thh));
    gfx.lineTo(t.x + tcos * thw - tsin * thh, t.y + tsin * thw + tcos * thh);
    gfx.lineTo(t.x + tcos * (-thw) - tsin * thh, t.y + tsin * (-thw) + tcos * thh);
    gfx.closePath();
    gfx.fillPath();
    // Table legs sticking up
    gfx.lineStyle(3, 0x5a4030, 0.7);
    gfx.beginPath(); gfx.moveTo(t.x - 20, t.y - 10); gfx.lineTo(t.x - 28, t.y - 30); gfx.strokePath();
    gfx.beginPath(); gfx.moveTo(t.x + 10, t.y - 8); gfx.lineTo(t.x + 16, t.y - 26); gfx.strokePath();

    // Broken chairs on floor
    for (const ch of this.roomChairs) {
      gfx.fillStyle(0x5a4a38, 0.6);
      const ccos = Math.cos(ch.rotation), csin = Math.sin(ch.rotation);
      const hs = ch.size / 2;
      gfx.beginPath();
      gfx.moveTo(ch.x + ccos * (-hs) - csin * (-hs * 0.6), ch.y + csin * (-hs) + ccos * (-hs * 0.6));
      gfx.lineTo(ch.x + ccos * hs - csin * (-hs * 0.6), ch.y + csin * hs + ccos * (-hs * 0.6));
      gfx.lineTo(ch.x + ccos * (hs * 0.5) - csin * (hs * 0.6), ch.y + csin * (hs * 0.5) + ccos * (hs * 0.6));
      gfx.lineTo(ch.x + ccos * (-hs * 0.7) - csin * (hs * 0.4), ch.y + csin * (-hs * 0.7) + ccos * (hs * 0.4));
      gfx.closePath();
      gfx.fillPath();
      // Chair leg
      gfx.lineStyle(2, 0x5a4a38, 0.5);
      gfx.beginPath(); gfx.moveTo(ch.x, ch.y); gfx.lineTo(ch.x + ccos * hs * 0.8, ch.y + csin * hs * 0.8); gfx.strokePath();
    }

    // Sandbag barricades (beige ovals piled up)
    for (const sb of this.sandbags) {
      // Bottom row (2 bags)
      gfx.fillStyle(0xb8a880, 0.8);
      gfx.fillEllipse(sb.x - 10, sb.y + 6, 24, 12);
      gfx.fillEllipse(sb.x + 14, sb.y + 6, 24, 12);
      // Top row (1 bag)
      gfx.fillStyle(0xc0b090, 0.8);
      gfx.fillEllipse(sb.x + 2, sb.y - 6, 22, 10);
      // Bag texture lines
      gfx.lineStyle(0.5, 0x8a7a60, 0.4);
      gfx.beginPath(); gfx.moveTo(sb.x - 18, sb.y + 6); gfx.lineTo(sb.x - 2, sb.y + 6); gfx.strokePath();
      gfx.beginPath(); gfx.moveTo(sb.x + 6, sb.y + 6); gfx.lineTo(sb.x + 22, sb.y + 6); gfx.strokePath();
    }

    // Military supply crates
    for (const cr of this.supplyCrates) {
      gfx.fillStyle(cr.color, 0.85);
      gfx.fillRect(cr.x, cr.y, cr.w, cr.h);
      // Crate edge highlight
      gfx.fillStyle(0xffffff, 0.1);
      gfx.fillRect(cr.x, cr.y, cr.w, 3);
      // Stencil marks (X pattern)
      gfx.lineStyle(1.5, 0xddddaa, 0.4);
      gfx.beginPath();
      gfx.moveTo(cr.x + 4, cr.y + 4);
      gfx.lineTo(cr.x + cr.w - 4, cr.y + cr.h - 4);
      gfx.strokePath();
      gfx.beginPath();
      gfx.moveTo(cr.x + cr.w - 4, cr.y + 4);
      gfx.lineTo(cr.x + 4, cr.y + cr.h - 4);
      gfx.strokePath();
      // Crate edge dark
      gfx.lineStyle(1, 0x222220, 0.4);
      gfx.strokeRect(cr.x, cr.y, cr.w, cr.h);
    }

    // Radio equipment on crate
    const radio = this.radioEquip;
    gfx.fillStyle(0x333340, 0.85);
    gfx.fillRect(radio.x, radio.y, radio.w, radio.h);
    // Antenna line
    gfx.lineStyle(1, 0x666666, 0.7);
    gfx.beginPath(); gfx.moveTo(radio.x + 14, radio.y); gfx.lineTo(radio.x + 18, radio.y - 16); gfx.strokePath();
    // Blinking red dot
    const blinkOn = Math.floor(Date.now() / 600) % 2 === 0;
    if (blinkOn) {
      gfx.fillStyle(0xff0000, 0.9);
      gfx.fillCircle(radio.x + 4, radio.y + 3, 2);
    }
    // Dials
    gfx.fillStyle(0x888888, 0.5);
    gfx.fillCircle(radio.x + 10, radio.y + 6, 2);

    // Mattress in corner
    const mat = this.mattress;
    gfx.fillStyle(0x8a8878, 0.6);
    gfx.fillRect(mat.x, mat.y, mat.w, mat.h);
    // Green blanket shape on mattress
    gfx.fillStyle(0x4a6a3a, 0.5);
    gfx.beginPath();
    gfx.moveTo(mat.x + 5, mat.y + 3);
    gfx.lineTo(mat.x + mat.w - 10, mat.y + 5);
    gfx.lineTo(mat.x + mat.w - 5, mat.y + mat.h - 3);
    gfx.lineTo(mat.x + 8, mat.y + mat.h - 5);
    gfx.closePath();
    gfx.fillPath();
    // Pillow
    gfx.fillStyle(0xc0b8a0, 0.5);
    gfx.fillEllipse(mat.x + 12, mat.y + mat.h / 2, 16, 10);

    // ═══════════════════════════════════════════
    // 6. HANGING CABLES FROM CEILING
    // ═══════════════════════════════════════════
    for (const cable of this.roomCables) {
      gfx.lineStyle(2, cable.color || 0x333333, 0.5);
      gfx.beginPath();
      gfx.moveTo(cable.startX, ROOM_TOP);
      for (const seg of cable.segments) {
        gfx.lineTo(seg.x, seg.y);
      }
      gfx.strokePath();
      // Dangling end spark (occasional yellow)
      const lastSeg = cable.segments[cable.segments.length - 1];
      if (Math.random() > 0.92) {
        gfx.fillStyle(0xffcc00, 0.7);
        gfx.fillCircle(lastSeg.x, lastSeg.y, 2);
        gfx.fillStyle(0xffee44, 0.3);
        gfx.fillCircle(lastSeg.x, lastSeg.y, 5);
      }
    }

    // Glass fragments (tiny bright dots)
    for (const g of this.roomGlass) {
      const glint = 0.2 + 0.3 * Math.sin(Date.now() / 500 + g.x);
      gfx.fillStyle(0xffffff, glint);
      gfx.fillCircle(g.x, g.y, g.size);
    }

    // ═══════════════════════════════════════════
    // 10. ARMCHAIR (sprite-based) + projectile
    // ═══════════════════════════════════════════
    // Armchair is rendered as Phaser sprite (this.armchairSprite) with depth 12
    // Only the projectile version is drawn via graphics:
    if (this.armchairProjectile && this.armchairProjectile.alive) {
      const ap = this.armchairProjectile;
      gfx.fillStyle(0x556B2F, 0.8);
      gfx.fillRect(ap.x - ARMCHAIR_W / 2, ap.y - ARMCHAIR_H / 2, ARMCHAIR_W, ARMCHAIR_H);
    }

    // 11. Boss sprite rendered via Phaser image (managed in update)
    // 12. Projectiles rendered via Phaser images (managed in update)

    // ═══════════════════════════════════════════
    // 13. DRONE (bright cyan, 50% bigger with LED lights)
    // ═══════════════════════════════════════════
    const droneFlash = this.droneInvulnTimer > 0 && Math.floor(Date.now() / 80) % 2 === 0;
    if (!droneFlash) {
      const dx = this.droneX;
      const dy = this.droneY;

      // Outer glow halo
      gfx.fillStyle(0x00ffcc, 0.10);
      gfx.fillCircle(dx, dy, 28);
      gfx.fillStyle(0x00ffcc, 0.05);
      gfx.fillCircle(dx, dy, 38);

      // White outline ring
      gfx.lineStyle(2.5, 0xffffff, 0.85);
      gfx.strokeCircle(dx, dy, 16);

      // Main body - bright cyan
      gfx.fillStyle(0x00ffcc, 0.95);
      gfx.fillCircle(dx, dy, 14);
      // Inner core
      gfx.fillStyle(0x88ff00, 0.9);
      gfx.fillCircle(dx, dy, 7);
      // Center dot
      gfx.fillStyle(0xffffff, 1.0);
      gfx.fillCircle(dx, dy, 3);

      // Propeller arms (spinning, 50% bigger)
      gfx.lineStyle(2.5, 0x00ffcc, 0.8);
      for (let a = 0; a < 4; a++) {
        const angle = a * Math.PI / 2 + Date.now() / 200;
        const tipX = dx + Math.cos(angle) * 22;
        const tipY = dy + Math.sin(angle) * 22;
        gfx.beginPath();
        gfx.moveTo(dx, dy);
        gfx.lineTo(tipX, tipY);
        gfx.strokePath();

        // LED lights on propeller tips
        const ledPulse = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(Date.now() / 150 + a * 1.5));
        gfx.fillStyle(0xffffff, ledPulse);
        gfx.fillCircle(tipX, tipY, 3);
        gfx.fillStyle(0x00ffcc, ledPulse * 0.5);
        gfx.fillCircle(tipX, tipY, 5);
      }
    }

    // 14. Dash trail effect during dodge
    if (this.dodgeActive) {
      gfx.fillStyle(0x00ccff, 0.15);
      gfx.fillCircle(this.droneX - this.dodgeDirX * 30, this.droneY - this.dodgeDirY * 30, 20);
    }
  }

  // ═════════════════════════════════════════════════════════════
  // BOSS DEATH
  // ═════════════════════════════════════════════════════════════
  _bossDeathAnimation() {
    this.bossDefeated = true;
    this.bossActive = false;

    // Stop all projectiles
    for (const p of this.bossProjectiles) {
      if (p.sprite) p.sprite.destroy();
    }
    this.bossProjectiles = [];
    if (this.armchairProjectile) this.armchairProjectile.alive = false;

    // Dead texture
    if (this.bossSprite && this.textures.exists('ts_boss4_dead')) {
      this.bossSprite.setTexture('ts_boss4_dead');
    }

    // Ensure boss is fully visible
    if (this.bossSprite) {
      this.bossSprite.setAlpha(1);
      this.bossSprite.setDisplaySize(BOSS_DISPLAY, BOSS_DISPLAY);
    }

    // 1. Boss freezes then trembles
    this.time.addEvent({
      delay: 50,
      repeat: 30,
      callback: () => {
        if (this.bossSprite) {
          this.bossSprite.x = this.bossX + (Math.random() - 0.5) * 10;
          this.bossSprite.y = this.bossY + (Math.random() - 0.5) * 10;
        }
      },
    });

    // 2. White flash + mega explosion particles after 1.5s
    this.time.delayedCall(1500, () => {
      // White screen flash
      this.cameras.main.flash(500, 255, 255, 255);
      // Camera shake for 2 seconds
      this.cameras.main.shake(2000, 0.03);
      SoundManager.get().playBossShockwave();

      // Spray 20 explosion particles from boss position
      const bx = this.bossX, by = this.bossY;
      const deathColors = [0xff6600, 0xffaa00, 0xff2200, 0xffdd00, 0xffffff];
      for (let i = 0; i < 20; i++) {
        const radius = 2 + Math.random() * 5;
        const color = deathColors[Math.floor(Math.random() * deathColors.length)];
        const particle = this.add.circle(bx, by, radius, color, 0.9).setDepth(55);
        const angle = Math.random() * Math.PI * 2;
        const speed = 60 + Math.random() * 150;
        this.tweens.add({
          targets: particle,
          x: bx + Math.cos(angle) * speed,
          y: by + Math.sin(angle) * speed,
          scale: 0,
          alpha: 0,
          rotation: Math.random() * 6,
          duration: 600 + Math.random() * 500,
          ease: 'Quad.easeOut',
          onComplete: () => particle.destroy(),
        });
      }

      // Scale down and fade (falls)
      if (this.bossSprite) {
        this.tweens.add({
          targets: this.bossSprite,
          scaleX: 0.8 * (BOSS_DISPLAY / 128),
          scaleY: 0.8 * (BOSS_DISPLAY / 128),
          alpha: 0,
          duration: 1200,
          ease: 'Quad.easeIn',
        });
      }
    });

    // 3. "YAHYA SINWAR IS DOWN" text (gold, centered, glow)
    this.time.delayedCall(3000, () => {
      const victoryText = this.add.text(W / 2, H / 2, 'YAHYA SINWAR IS DOWN', {
        fontFamily: 'monospace', fontSize: '32px', color: '#FFD700',
        fontStyle: 'bold',
        shadow: { offsetX: 0, offsetY: 0, color: '#FFD700', blur: 16, fill: true },
      }).setOrigin(0.5).setDepth(55).setScrollFactor(0).setAlpha(0);

      this.tweens.add({
        targets: victoryText,
        alpha: 1,
        duration: 600,
      });

      this.score += 3000;
    });

    // 4. After animation: show victory screen
    this.time.delayedCall(5000, () => {
      this._cleanupBoss();
      this._showVictory();
    });
  }

  _bossFightEnd(playerWon) {
    if (!playerWon) {
      this.phase = 'dead';
      this.time.delayedCall(1500, () => {
        this._cleanupBoss();
        this._showVictory();
      });
    }
  }

  // ═════════════════════════════════════════════════════════════
  // BOSS FIGHT MAIN UPDATE
  // ═════════════════════════════════════════════════════════════
  _updateBossFight(dt) {
    if (this.phase !== 'boss') return;

    // Draw room each frame (background + drone + static objects)
    this._drawRoom();

    if (this.bossDefeated) return; // death animation running via timed events

    // Dodge cooldown
    if (this.dodgeCooldown > 0) this.dodgeCooldown -= dt;

    // Dodge active
    if (this.dodgeActive) {
      this.dodgeTimer -= dt;
      if (this.dodgeTimer <= 0) {
        this.dodgeActive = false;
      }
    }

    // SHIFT = dash (100px in current movement direction, 1s cooldown, 0.15s invuln)
    const dodgePressed = Phaser.Input.Keyboard.JustDown(this.keys.shift);
    if (dodgePressed && this.dodgeCooldown <= 0 && !this.dodgeActive) {
      this.dodgeCooldown = DRONE_DASH_COOLDOWN;
      this.dodgeActive = true;
      this.dodgeTimer = DRONE_DASH_DURATION;
      this.droneInvulnTimer = DRONE_DASH_DURATION;

      let dashDirX = 0, dashDirY = 0;
      if (this.keys.left.isDown) dashDirX = -1;
      else if (this.keys.right.isDown) dashDirX = 1;
      if (this.keys.up.isDown) dashDirY = -1;
      else if (this.keys.down.isDown) dashDirY = 1;
      if (dashDirX === 0 && dashDirY === 0) {
        dashDirX = (this.droneX < W / 2) ? -1 : 1;
      }
      const mag = Math.sqrt(dashDirX * dashDirX + dashDirY * dashDirY) || 1;
      this.dodgeDirX = dashDirX / mag;
      this.dodgeDirY = dashDirY / mag;
      this.droneX = Phaser.Math.Clamp(this.droneX + this.dodgeDirX * DRONE_DASH_DIST, ROOM_LEFT + 20, ROOM_RIGHT - 20);
      this.droneY = Phaser.Math.Clamp(this.droneY + this.dodgeDirY * DRONE_DASH_DIST, ROOM_TOP + 20, ROOM_BOTTOM - 20);
      SoundManager.get().playStep();
    }

    // Drone movement (arrow keys, 200 px/s)
    if (!this.dodgeActive) {
      let dx = 0, dy = 0;
      if (this.keys.left.isDown) dx -= 1;
      if (this.keys.right.isDown) dx += 1;
      if (this.keys.up.isDown) dy -= 1;
      if (this.keys.down.isDown) dy += 1;
      if (dx || dy) {
        const len = Math.sqrt(dx * dx + dy * dy);
        this.droneX += (dx / len) * BOSS_DRONE_SPEED * dt;
        this.droneY += (dy / len) * BOSS_DRONE_SPEED * dt;
      }
    }
    // Clamp drone to room bounds
    this.droneX = Phaser.Math.Clamp(this.droneX, ROOM_LEFT + 15, ROOM_RIGHT - 15);
    this.droneY = Phaser.Math.Clamp(this.droneY, ROOM_TOP + 15, ROOM_BOTTOM - 15);

    // HUD updates
    if (this.dodgeHudFill) {
      const ready = this.dodgeCooldown <= 0;
      const pct = ready ? 1 : Math.max(0, 1 - (this.dodgeCooldown / DRONE_DASH_COOLDOWN));
      this.dodgeHudFill.setScale(pct, 1);
      this.dodgeHudFill.setFillStyle(ready ? 0x00ccff : 0x555555);
      if (this.dodgeHudLabel) this.dodgeHudLabel.setColor(ready ? '#00ccff' : '#555555');
    }
    if (this.missileHudFill) {
      const ready = this.droneMissileTimer <= 0;
      const pct = ready ? 1 : Math.max(0, 1 - (this.droneMissileTimer / DRONE_MISSILE_COOLDOWN));
      this.missileHudFill.setScale(pct, 1);
      this.missileHudFill.setFillStyle(ready ? 0xff4444 : 0x555555);
      if (this.missileHudLabel) this.missileHudLabel.setColor(ready ? '#ff4444' : '#555555');
    }
    if (this.droneHPLabel) {
      this.droneHPLabel.setText(`DRONE HP: ${Math.max(0, this.droneHP)}/${this.droneMaxHP}`);
      this.droneHPLabel.setColor(this.droneHP <= 1 ? '#ff4444' : '#00e5ff');
    }

    // Boss logic
    this._updateBoss(dt);

    // Drone combat
    this._updateDroneCombat(dt);
  }

  // ═════════════════════════════════════════════════════════════
  // CLEANUP
  // ═════════════════════════════════════════════════════════════
  _cleanupBoss() {
    if (this.roomGfx) { this.roomGfx.destroy(); this.roomGfx = null; }
    if (this.bossSprite) { this.bossSprite.destroy(); this.bossSprite = null; }
    if (this.armchairSprite) { this.armchairSprite.destroy(); this.armchairSprite = null; }

    // HP bar
    if (this.bossHPBarBg) { this.bossHPBarBg.destroy(); this.bossHPBarBg = null; }
    if (this.bossHPBarFill) { this.bossHPBarFill.destroy(); this.bossHPBarFill = null; }
    if (this.bossHPBarLabel) { this.bossHPBarLabel.destroy(); this.bossHPBarLabel = null; }

    // Projectiles
    if (this.bossProjectiles) {
      for (const p of this.bossProjectiles) { if (p.sprite) p.sprite.destroy(); }
      this.bossProjectiles = [];
    }

    // HUD elements
    if (this.dodgeHudLabel) { this.dodgeHudLabel.destroy(); this.dodgeHudLabel = null; }
    if (this.dodgeHudBg) { this.dodgeHudBg.destroy(); this.dodgeHudBg = null; }
    if (this.dodgeHudFill) { this.dodgeHudFill.destroy(); this.dodgeHudFill = null; }
    if (this.missileHudLabel) { this.missileHudLabel.destroy(); this.missileHudLabel = null; }
    if (this.missileHudBg) { this.missileHudBg.destroy(); this.missileHudBg = null; }
    if (this.missileHudFill) { this.missileHudFill.destroy(); this.missileHudFill = null; }
    if (this.droneHPLabel) { this.droneHPLabel.destroy(); this.droneHPLabel = null; }

    // Drone bullets
    if (this.droneBullets) {
      for (const b of this.droneBullets) { if (b.sprite) b.sprite.destroy(); }
      this.droneBullets = [];
    }

    // Drone missiles
    if (this.droneMissiles) {
      for (const m of this.droneMissiles) {
        if (m.sprite) m.sprite.destroy();
        if (m.trail) m.trail.destroy();
      }
      this.droneMissiles = [];
    }
  }

  // ═════════════════════════════════════════════════════════════
  // VICTORY / RESULTS
  // ═════════════════════════════════════════════════════════════
  _showVictory() {
    this.phase = 'victory';
    this.instrText.setVisible(false);
    this._stopAmbient();
    MusicManager.get().stop(1);

    // Clear checkpoint on level completion
    try { localStorage.removeItem('superzion_checkpoint_l4'); } catch (e) { /* ignore */ }

    const missionSuccess = this.bossDefeated;
    this.missionSuccess = missionSuccess;
    if (missionSuccess) SoundManager.get().playVictory();

    // Star rating
    const starCount = missionSuccess && this.droneHP >= 4 && this.enemiesKilled >= 3 ? 3
      : missionSuccess && this.droneHP >= 1 ? 2
      : this.bossHP <= this.bossMaxHP * 0.5 ? 1 : 0;

    try { localStorage.setItem('superzion_stars_4', String(starCount)); } catch(e) { /* ignore */ }

    const bossStatus = this.bossDefeated ? 'ELIMINATED' : `${this.bossHP}/${this.bossMaxHP} HP remaining`;
    const stats = [
      { label: 'ENEMIES DOWNED', value: `${this.enemiesKilled}` },
      { label: 'YAHYA SINWAR', value: bossStatus },
      { label: 'DRONE STATUS', value: this.droneHP > 0 ? 'INTACT' : 'DESTROYED' },
      { label: 'SCORE', value: `${this.score}` },
    ];
    const beforeTransition = () => this._stopAmbient();

    if (missionSuccess) {
      this._endScreen = showVictoryScreen(this, {
        title: 'MISSION COMPLETE', stats, stars: starCount,
        currentScene: 'DroneScene',
        nextScene: 'MountainBreakerIntroCinematicScene',
        onBeforeTransition: beforeTransition,
      });
    } else {
      this._endScreen = showDefeatScreen(this, {
        title: 'MISSION FAILED', stats,
        currentScene: 'DroneScene',
        skipScene: 'MountainBreakerIntroCinematicScene',
        onBeforeTransition: beforeTransition,
      });
    }
  }

  // ═════════════════════════════════════════════════════════════
  // MAIN UPDATE LOOP
  // ═════════════════════════════════════════════════════════════
  update(time, delta) {
    // Tutorial active: skip all gameplay
    if (this.tutorialActive) return;

    const dt = delta / 1000;

    // Mute toggle
    if (Phaser.Input.Keyboard.JustDown(this.keys.m)) {
      const muted = SoundManager.get().toggleMute();
      MusicManager.get().setMuted(muted);
    }

    // ESC pause
    if (Phaser.Input.Keyboard.JustDown(this.keys.esc) && this.phase !== 'victory') {
      this._togglePause();
      return;
    }
    if (this.isPaused) { if (this.input.keyboard.checkDown(this.input.keyboard.addKey("Q"), 500)) { MusicManager.get().stop(0.3); this.scene.start("MenuScene"); } return; }

    // P key — debug skip to boss fight
    if (Phaser.Input.Keyboard.JustDown(this.keys.p) && this.phase !== 'victory' && this.phase !== 'boss') {
      this._stopAmbient();
      this.score = 2000;
      if (this.phase === 'city') this._cleanupCityIntro();
      this._startBossTransition();
      return;
    }

    switch (this.phase) {
      case 'city':
        this._updateCityIntro(dt);
        break;
      case 'boss':
        this._updateBossFight(dt);
        break;
      case 'victory':
        break;
    }

    // Update HUD
    const activePhases = ['city', 'boss'];
    if (activePhases.includes(this.phase)) {
      this._updateHUD();
    }
  }

  shutdown() {
    if (this._endScreen) this._endScreen.destroy();
    this._cleanupCityIntro();
    this._cleanupBoss();
    this._stopAmbient();
    this.tweens.killAll();
    this.time.removeAllEvents();
  }
}
