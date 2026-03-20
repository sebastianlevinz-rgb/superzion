// ═══════════════════════════════════════════════════════════════
// DroneScene — Level 4: Operation Underground
// Front-facing perspective: drone hovers outside destroyed building,
// looking INTO the daytime room. Boss hides behind armchair,
// peeks out to throw objects, then hides again.
// Boss: THE WARDEN — fought from drone POV with depth effects
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
import { showControlsOverlay } from '../ui/ControlsOverlay.js';

const W = 960;
const H = 540;

// City flight constants
const CITY_SCROLL_SPEED = 55;     // px/s auto-scroll rightward
const CITY_DRONE_SPEED = 250;     // player manual movement
const CITY_LENGTH = 5000;         // total horizontal distance
const DRONE_SIZE = 20;            // collision half-size (radius)

// Boss fight drone constants (front-facing perspective)
const BOSS_DRONE_SPEED = 200;
const DRONE_SHOOT_COOLDOWN = 0.25; // seconds between shots
const DRONE_BULLET_SPEED = 300;    // visual speed into room (shrinking)
const DRONE_MISSILE_COOLDOWN = 3;  // seconds between missiles
const DRONE_MISSILE_SPEED = 200;

// Boss constants (front-facing)
const BOSS_DISPLAY = 100;      // boss display size inside room
const BOSS_BASE_HP = 30;
const BOSS_SPEED_NORMAL = 60;  // horizontal movement speed
const BOSS_SPEED_FURY = 110;
const BOSS_BULLET_DMG = 1;     // normal bullet damage
const BOSS_MISSILE_DMG = 15;   // missile does TRIPLE damage
const BOSS_THROW_INTERVAL_MIN = 1.5;
const BOSS_THROW_INTERVAL_MAX = 2.5;
const BOSS_THROW_SPEED = 250;  // speed of objects thrown at drone
const BOSS_THROW_DMG = 2;
const BOSS_FURY_THRESHOLD = 0.3; // below 30% HP
const BOSS_PHASE2_THRESHOLD = 0.5; // below 50% HP — running & throwing
const BOSS_PHASE3_THRESHOLD = 0.2; // below 20% HP — melee charge
const BOSS_SPEED_PHASE2 = 100;     // faster running in phase 2
const BOSS_SPEED_PHASE3 = 150;     // charge speed in phase 3
const BOSS_PHASE3_CHARGE_DMG = 4;  // heavy melee damage

// Room perspective constants
const ROOM_BACK_Y = 120;      // Y position of the "back" of the room
const ROOM_FRONT_Y = H - 30;  // Y position of the "front" (near drone)

// Single armchair cover — center of room
const ARMCHAIR_X = W / 2;
const ARMCHAIR_Y = 320;       // slightly forward in room

const BOSS_AREA_TOP = ROOM_BACK_Y + 30;
const BOSS_AREA_BOTTOM = ARMCHAIR_Y - 40; // boss area above armchair
const BOSS_AREA_LEFT = 180;
const BOSS_AREA_RIGHT = W - 180;

// ═══════════════════════════════════════════════════════════════
// BOSS TEXTURE GENERATORS (inline — only DroneScene.js modified)
// ═══════════════════════════════════════════════════════════════

function _generateBossTexture(scene, key, expression) {
  if (scene.textures.exists(key)) return;

  const s = 128;
  const c = document.createElement('canvas');
  c.width = s; c.height = s;
  const ctx = c.getContext('2d');
  const cx = s / 2, cy = s / 2;

  // Skin color based on expression — always rough/weathered tones
  let skinColor, skinDark, skinLight;
  if (expression === 'furious') {
    skinColor = '#a03020'; skinDark = '#702015'; skinLight = '#c04535';
  } else if (expression === 'angry') {
    skinColor = '#8a5535'; skinDark = '#6a3a20'; skinLight = '#a06545';
  } else if (expression === 'dead') {
    skinColor = '#6a6a6a'; skinDark = '#4a4a4a'; skinLight = '#808080';
  } else {
    // Even 'normal' looks menacing
    skinColor = '#7a5030'; skinDark = '#5a3820'; skinLight = '#906040';
  }

  // Thick neck (drawn first, behind head)
  ctx.fillStyle = skinDark;
  ctx.beginPath();
  ctx.moveTo(cx - 22, cy + 38);
  ctx.lineTo(cx - 20, cy + 56);
  ctx.lineTo(cx - 26, cy + 66);
  ctx.lineTo(cx + 26, cy + 66);
  ctx.lineTo(cx + 20, cy + 56);
  ctx.lineTo(cx + 22, cy + 38);
  ctx.closePath();
  ctx.fill();
  // Neck tendons
  ctx.strokeStyle = skinColor;
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(cx - 10, cy + 40); ctx.lineTo(cx - 12, cy + 58); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx + 10, cy + 40); ctx.lineTo(cx + 12, cy + 58); ctx.stroke();

  // Angular head shape — squarer jaw, menacing
  ctx.fillStyle = skinColor;
  ctx.beginPath();
  ctx.moveTo(cx - 42, cy - 36);   // top-left
  ctx.lineTo(cx + 42, cy - 36);   // top-right
  ctx.lineTo(cx + 50, cy - 20);   // right temple
  ctx.lineTo(cx + 52, cy - 4);    // right cheekbone
  ctx.lineTo(cx + 50, cy + 12);   // right mid-face
  ctx.lineTo(cx + 46, cy + 26);   // right jaw (heavy, SQUARE)
  ctx.lineTo(cx + 40, cy + 36);   // right jaw corner
  ctx.lineTo(cx + 24, cy + 40);   // right chin
  ctx.lineTo(cx, cy + 42);        // chin center
  ctx.lineTo(cx - 24, cy + 40);   // left chin
  ctx.lineTo(cx - 40, cy + 36);   // left jaw corner
  ctx.lineTo(cx - 46, cy + 26);   // left jaw
  ctx.lineTo(cx - 50, cy + 12);   // left mid-face
  ctx.lineTo(cx - 52, cy - 4);    // left cheekbone
  ctx.lineTo(cx - 50, cy - 20);   // left temple
  ctx.closePath();
  ctx.fill();

  // Cheekbone highlights (angular, pronounced)
  ctx.fillStyle = skinLight;
  ctx.beginPath();
  ctx.moveTo(cx + 40, cy - 8);
  ctx.lineTo(cx + 50, cy - 2);
  ctx.lineTo(cx + 48, cy + 8);
  ctx.lineTo(cx + 38, cy + 4);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(cx - 40, cy - 8);
  ctx.lineTo(cx - 50, cy - 2);
  ctx.lineTo(cx - 48, cy + 8);
  ctx.lineTo(cx - 38, cy + 4);
  ctx.closePath();
  ctx.fill();

  // Heavy jaw shadow
  ctx.fillStyle = skinDark;
  ctx.beginPath();
  ctx.moveTo(cx - 40, cy + 30);
  ctx.lineTo(cx + 40, cy + 30);
  ctx.lineTo(cx + 24, cy + 40);
  ctx.lineTo(cx, cy + 42);
  ctx.lineTo(cx - 24, cy + 40);
  ctx.closePath();
  ctx.fill();

  // Tiny body below head
  ctx.fillStyle = '#3a3a2a';
  ctx.fillRect(cx - 16, cy + 52, 32, 14);
  // Arms
  ctx.fillStyle = '#444434';
  ctx.fillRect(cx - 26, cy + 54, 12, 5);
  ctx.fillRect(cx + 14, cy + 54, 12, 5);

  // Battle-worn beret
  ctx.fillStyle = '#2a4a2a';
  ctx.beginPath();
  ctx.moveTo(cx - 46, cy - 36);
  ctx.lineTo(cx + 46, cy - 36);
  ctx.lineTo(cx + 48, cy - 44);
  ctx.lineTo(cx + 38, cy - 54);
  ctx.lineTo(cx + 14, cy - 58);
  ctx.lineTo(cx - 14, cy - 58);
  ctx.lineTo(cx - 38, cy - 54);
  ctx.lineTo(cx - 48, cy - 44);
  ctx.closePath();
  ctx.fill();
  // Beret band
  ctx.fillStyle = '#1a3a1a';
  ctx.fillRect(cx - 44, cy - 38, 88, 5);
  // Battle damage on beret (scuffs, dirt)
  ctx.fillStyle = 'rgba(30, 25, 15, 0.4)';
  ctx.fillRect(cx - 30, cy - 52, 8, 4);
  ctx.fillRect(cx + 18, cy - 50, 6, 5);
  // Tarnished badge
  ctx.fillStyle = '#8a7a20';
  ctx.beginPath();
  ctx.arc(cx, cy - 50, 3, 0, Math.PI * 2);
  ctx.fill();

  // Dark eye sockets (drawn before eyes)
  const eyeL = cx - 18, eyeR = cx + 18, eyeY = cy - 10;
  ctx.fillStyle = 'rgba(20, 10, 5, 0.5)';
  ctx.beginPath(); ctx.ellipse(eyeL, eyeY, 14, 10, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(eyeR, eyeY, 14, 10, 0, 0, Math.PI * 2); ctx.fill();

  // THICK ANGRY EYEBROWS — dominate the face, present in ALL expressions
  const browColor = expression === 'dead' ? '#3a3a3a' : '#0a0804';
  ctx.fillStyle = browColor;
  // Left eyebrow — massive thick wedge, permanently furrowed
  ctx.beginPath();
  ctx.moveTo(cx - 44, cy - 24);
  ctx.lineTo(cx - 6, cy - 12);
  ctx.lineTo(cx - 6, cy - 18);
  ctx.lineTo(cx - 44, cy - 32);
  ctx.closePath();
  ctx.fill();
  // Right eyebrow
  ctx.beginPath();
  ctx.moveTo(cx + 44, cy - 24);
  ctx.lineTo(cx + 6, cy - 12);
  ctx.lineTo(cx + 6, cy - 18);
  ctx.lineTo(cx + 44, cy - 32);
  ctx.closePath();
  ctx.fill();
  // Extra brow hair strands
  ctx.lineWidth = 1;
  ctx.strokeStyle = browColor;
  for (let i = 0; i < 8; i++) {
    const bx = cx - 40 + i * 8;
    const by = cy - 28 + (i * 1.5);
    ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx + 3, by + 2); ctx.stroke();
  }
  for (let i = 0; i < 8; i++) {
    const bx = cx + 40 - i * 8;
    const by = cy - 28 + (i * 1.5);
    ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx - 3, by + 2); ctx.stroke();
  }

  if (expression === 'dead') {
    // X eyes
    ctx.strokeStyle = '#555555';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(eyeL - 6, eyeY - 4); ctx.lineTo(eyeL + 6, eyeY + 4);
    ctx.moveTo(eyeL + 6, eyeY - 4); ctx.lineTo(eyeL - 6, eyeY + 4);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(eyeR - 6, eyeY - 4); ctx.lineTo(eyeR + 6, eyeY + 4);
    ctx.moveTo(eyeR + 6, eyeY - 4); ctx.lineTo(eyeR - 6, eyeY + 4);
    ctx.stroke();
    // Heavy bruises
    ctx.fillStyle = 'rgba(80, 30, 100, 0.5)';
    ctx.beginPath(); ctx.ellipse(eyeL, eyeY + 4, 10, 4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(eyeR, eyeY + 4, 10, 4, 0, 0, Math.PI * 2); ctx.fill();
  } else {
    // Narrow slit eyes — hateful, small
    let irisColor, scleraColor;
    if (expression === 'furious') {
      irisColor = '#dd0000'; scleraColor = '#ffaaaa';
    } else if (expression === 'angry') {
      irisColor = '#cc3300'; scleraColor = '#ffe0d0';
    } else {
      irisColor = '#aa4400'; scleraColor = '#ddd8c8';
    }

    for (const side of [-1, 1]) {
      const ex = cx + side * 18;
      const ey = eyeY;
      // Very narrow slit shape
      ctx.fillStyle = scleraColor;
      ctx.beginPath();
      ctx.moveTo(ex - 10, ey);
      ctx.quadraticCurveTo(ex, ey - 3, ex + 10, ey);
      ctx.quadraticCurveTo(ex, ey + 2, ex - 10, ey);
      ctx.closePath();
      ctx.fill();
      // Small iris
      ctx.fillStyle = irisColor;
      ctx.beginPath();
      ctx.arc(ex, ey, 3, 0, Math.PI * 2);
      ctx.fill();
      // Tiny pupil
      ctx.fillStyle = '#050505';
      ctx.beginPath();
      ctx.arc(ex, ey, 1.5, 0, Math.PI * 2);
      ctx.fill();
      // Red glow around eyes
      const glowAlpha = expression === 'furious' ? 0.5 : expression === 'angry' ? 0.3 : 0.15;
      ctx.fillStyle = `rgba(255, 40, 0, ${glowAlpha})`;
      ctx.beginPath();
      ctx.arc(ex, ey, 6, 0, Math.PI * 2);
      ctx.fill();
      // Eye outline
      ctx.strokeStyle = '#1a0a05';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(ex - 10, ey);
      ctx.quadraticCurveTo(ex, ey - 3, ex + 10, ey);
      ctx.quadraticCurveTo(ex, ey + 2, ex - 10, ey);
      ctx.closePath();
      ctx.stroke();
    }

    // Dark circles under eyes
    ctx.fillStyle = 'rgba(30, 15, 20, 0.35)';
    ctx.beginPath(); ctx.ellipse(eyeL, eyeY + 6, 10, 4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(eyeR, eyeY + 6, 10, 4, 0, 0, Math.PI * 2); ctx.fill();
  }

  // Nose — broad, broken-looking
  ctx.fillStyle = skinDark;
  ctx.beginPath();
  ctx.moveTo(cx, cy - 4);
  ctx.lineTo(cx + 6, cy + 6);
  ctx.lineTo(cx + 7, cy + 8);
  ctx.lineTo(cx + 4, cy + 10);
  ctx.lineTo(cx - 4, cy + 10);
  ctx.lineTo(cx - 7, cy + 8);
  ctx.lineTo(cx - 6, cy + 6);
  ctx.closePath();
  ctx.fill();
  // Nose bridge bump (broken nose)
  ctx.fillStyle = skinLight;
  ctx.beginPath();
  ctx.moveTo(cx - 2, cy - 2);
  ctx.lineTo(cx + 3, cy);
  ctx.lineTo(cx + 2, cy + 3);
  ctx.lineTo(cx - 1, cy + 1);
  ctx.closePath();
  ctx.fill();
  // Nostrils
  ctx.fillStyle = '#1a0a05';
  ctx.beginPath(); ctx.arc(cx - 3, cy + 8, 2, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + 3, cy + 8, 2, 0, Math.PI * 2); ctx.fill();

  // Mouth — cruel grimace/snarl with bared teeth
  if (expression === 'dead') {
    ctx.strokeStyle = '#4a2a1a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx - 16, cy + 20);
    ctx.lineTo(cx - 6, cy + 23);
    ctx.lineTo(cx + 4, cy + 19);
    ctx.lineTo(cx + 16, cy + 21);
    ctx.stroke();
    // Broken tooth
    ctx.fillStyle = '#aaa898';
    ctx.beginPath();
    ctx.moveTo(cx - 3, cy + 19);
    ctx.lineTo(cx - 1, cy + 23);
    ctx.lineTo(cx + 2, cy + 20);
    ctx.closePath();
    ctx.fill();
  } else {
    // Wide snarling grimace
    ctx.fillStyle = '#2a0a05';
    ctx.beginPath();
    ctx.moveTo(cx - 20, cy + 16);
    ctx.quadraticCurveTo(cx - 10, cy + 12, cx, cy + 14);
    ctx.quadraticCurveTo(cx + 10, cy + 12, cx + 20, cy + 16);
    ctx.lineTo(cx + 18, cy + 24);
    ctx.quadraticCurveTo(cx, cy + 28, cx - 18, cy + 24);
    ctx.closePath();
    ctx.fill();
    // Upper teeth row
    ctx.fillStyle = '#ccc8b0';
    const teethY = cy + 15;
    const teethH = expression === 'furious' ? 6 : expression === 'angry' ? 5 : 4;
    for (let t = -3; t <= 3; t++) {
      ctx.fillRect(cx + t * 5 - 2, teethY, 3, teethH);
    }
    // Lower teeth
    for (let t = -2; t <= 2; t++) {
      ctx.fillRect(cx + t * 5 - 1, cy + 21, 2, teethH - 1);
    }
    // Tooth gaps
    ctx.fillStyle = '#0a0505';
    for (let t = -3; t <= 2; t++) {
      ctx.fillRect(cx + t * 5 + 1, teethY, 1, teethH);
    }
  }

  // Stubble
  ctx.fillStyle = 'rgba(10, 8, 5, 0.2)';
  for (let i = 0; i < 60; i++) {
    const hx = cx + (Math.random() - 0.5) * 60;
    const hy = cy + 10 + Math.random() * 26;
    ctx.fillRect(hx, hy, 1, 1 + Math.random());
  }

  // Short white beard (chin and jaw area)
  if (expression !== 'dead') {
    const beardGrad = ctx.createLinearGradient(0, cy + 22, 0, cy + 42);
    beardGrad.addColorStop(0, 'rgba(200,200,200,0.5)');
    beardGrad.addColorStop(0.5, 'rgba(220,220,220,0.6)');
    beardGrad.addColorStop(1, 'rgba(240,240,240,0.45)');
    ctx.fillStyle = beardGrad;
    ctx.beginPath();
    ctx.moveTo(cx - 22, cy + 22);
    ctx.quadraticCurveTo(cx - 26, cy + 30, cx - 18, cy + 38);
    ctx.quadraticCurveTo(cx, cy + 44, cx + 18, cy + 38);
    ctx.quadraticCurveTo(cx + 26, cy + 30, cx + 22, cy + 22);
    ctx.closePath();
    ctx.fill();
    // Beard hair strands
    ctx.strokeStyle = 'rgba(230,230,230,0.25)';
    ctx.lineWidth = 0.7;
    for (let i = 0; i < 10; i++) {
      const bx = cx - 16 + i * 3.5;
      ctx.beginPath();
      ctx.moveTo(bx, cy + 24);
      ctx.lineTo(bx + (Math.random() - 0.5) * 2, cy + 36 + Math.random() * 5);
      ctx.stroke();
    }
  }

  // Facial scars (multiple, battle-worn)
  ctx.strokeStyle = 'rgba(160, 100, 80, 0.6)';
  ctx.lineWidth = 1.5;
  // Scar across right cheek
  ctx.beginPath();
  ctx.moveTo(cx + 22, cy - 16);
  ctx.lineTo(cx + 18, cy - 2);
  ctx.lineTo(cx + 24, cy + 8);
  ctx.stroke();
  // Scar across left cheek
  ctx.beginPath();
  ctx.moveTo(cx - 36, cy + 4);
  ctx.lineTo(cx - 26, cy + 14);
  ctx.lineTo(cx - 20, cy + 10);
  ctx.stroke();
  // Small scar on forehead
  ctx.beginPath();
  ctx.moveTo(cx + 8, cy - 30);
  ctx.lineTo(cx + 14, cy - 24);
  ctx.stroke();

  // Rough skin texture (pockmarks/weathering)
  ctx.fillStyle = 'rgba(40, 25, 15, 0.12)';
  for (let i = 0; i < 20; i++) {
    const px = cx + (Math.random() - 0.5) * 80;
    const py = cy + (Math.random() - 0.5) * 50;
    ctx.beginPath();
    ctx.arc(px, py, 0.5 + Math.random() * 1.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Expression-specific damage (veins etc.)
  if (expression === 'angry' || expression === 'furious') {
    ctx.strokeStyle = expression === 'furious' ? '#dd2020' : '#bb4040';
    ctx.lineWidth = expression === 'furious' ? 2 : 1.5;
    // Left vein
    ctx.beginPath();
    ctx.moveTo(cx - 30, cy - 32);
    ctx.lineTo(cx - 24, cy - 24);
    ctx.lineTo(cx - 28, cy - 18);
    ctx.stroke();
    // Right vein
    ctx.beginPath();
    ctx.moveTo(cx + 30, cy - 32);
    ctx.lineTo(cx + 24, cy - 24);
    ctx.lineTo(cx + 28, cy - 18);
    ctx.stroke();
  }

  if (expression === 'furious') {
    // Red tint overlay
    ctx.fillStyle = 'rgba(180, 20, 10, 0.12)';
    ctx.fillRect(0, 0, s, s);
    // Throbbing temple veins
    ctx.strokeStyle = '#dd2020';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx - 48, cy - 8);
    ctx.lineTo(cx - 44, cy - 2);
    ctx.lineTo(cx - 46, cy + 4);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx + 48, cy - 8);
    ctx.lineTo(cx + 44, cy - 2);
    ctx.lineTo(cx + 46, cy + 4);
    ctx.stroke();
  }

  if (expression === 'dead') {
    // Extra bruises
    ctx.fillStyle = 'rgba(80, 30, 100, 0.4)';
    ctx.beginPath(); ctx.arc(cx - 24, cy, 8, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + 28, cy + 4, 6, 0, Math.PI * 2); ctx.fill();
    // Crack lines
    ctx.strokeStyle = 'rgba(50, 25, 15, 0.5)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx - 16, cy - 26);
    ctx.lineTo(cx - 10, cy - 12);
    ctx.lineTo(cx - 14, cy);
    ctx.stroke();
  }

  // Head outline
  ctx.strokeStyle = 'rgba(0,0,0,0.3)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cx - 42, cy - 36);
  ctx.lineTo(cx + 42, cy - 36);
  ctx.lineTo(cx + 50, cy - 20);
  ctx.lineTo(cx + 52, cy - 4);
  ctx.lineTo(cx + 50, cy + 12);
  ctx.lineTo(cx + 46, cy + 26);
  ctx.lineTo(cx + 40, cy + 36);
  ctx.lineTo(cx + 24, cy + 40);
  ctx.lineTo(cx, cy + 42);
  ctx.lineTo(cx - 24, cy + 40);
  ctx.lineTo(cx - 40, cy + 36);
  ctx.lineTo(cx - 46, cy + 26);
  ctx.lineTo(cx - 50, cy + 12);
  ctx.lineTo(cx - 52, cy - 4);
  ctx.lineTo(cx - 50, cy - 20);
  ctx.closePath();
  ctx.stroke();

  scene.textures.addCanvas(key, c);
}

function _generateBossProjectileTextures(scene) {
  // ── Projectile 0: broken plank / stick ──
  if (!scene.textures.exists('boss_projectile_0')) {
    const s = 16;
    const c = document.createElement('canvas');
    c.width = s; c.height = s;
    const ctx = c.getContext('2d');
    ctx.save();
    ctx.translate(s / 2, s / 2);
    ctx.rotate(0.3);
    ctx.fillStyle = '#8a6a3a';
    ctx.fillRect(-7, -2, 14, 4);
    ctx.strokeStyle = '#6a4a2a';
    ctx.lineWidth = 0.5;
    ctx.beginPath(); ctx.moveTo(-6, 0); ctx.lineTo(6, 0); ctx.stroke();
    // Splintered ends
    ctx.fillStyle = '#a07a4a';
    ctx.beginPath(); ctx.moveTo(7, -2); ctx.lineTo(8, 0); ctx.lineTo(7, 2); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-7, -2); ctx.lineTo(-8, 0); ctx.lineTo(-7, 2); ctx.closePath(); ctx.fill();
    // Nail
    ctx.fillStyle = '#888888';
    ctx.fillRect(2, -4, 1, 2);
    ctx.restore();
    scene.textures.addCanvas('boss_projectile_0', c);
  }

  // ── Projectile 1: brick fragment ──
  if (!scene.textures.exists('boss_projectile_1')) {
    const s = 16;
    const c = document.createElement('canvas');
    c.width = s; c.height = s;
    const ctx = c.getContext('2d');
    ctx.save();
    ctx.translate(s / 2, s / 2);
    ctx.rotate(-0.2);
    // Irregular brick chunk
    ctx.fillStyle = '#9a5a3a';
    ctx.beginPath();
    ctx.moveTo(-5, -4);
    ctx.lineTo(4, -5);
    ctx.lineTo(6, -2);
    ctx.lineTo(5, 4);
    ctx.lineTo(-3, 5);
    ctx.lineTo(-6, 2);
    ctx.closePath();
    ctx.fill();
    // Mortar edge
    ctx.fillStyle = '#c0a880';
    ctx.beginPath();
    ctx.moveTo(-6, 2); ctx.lineTo(-5, -4); ctx.lineTo(-3, -3); ctx.lineTo(-4, 1); ctx.closePath();
    ctx.fill();
    // Texture cracks
    ctx.strokeStyle = '#6a3a1a';
    ctx.lineWidth = 0.5;
    ctx.beginPath(); ctx.moveTo(-2, -3); ctx.lineTo(1, 3); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(2, -4); ctx.lineTo(4, 1); ctx.stroke();
    ctx.restore();
    scene.textures.addCanvas('boss_projectile_1', c);
  }

  // ── Projectile 2: glass shard ──
  if (!scene.textures.exists('boss_projectile_2')) {
    const s = 16;
    const c = document.createElement('canvas');
    c.width = s; c.height = s;
    const ctx = c.getContext('2d');
    ctx.save();
    ctx.translate(s / 2, s / 2);
    ctx.rotate(0.5);
    // Jagged glass triangle
    ctx.fillStyle = 'rgba(160, 200, 220, 0.7)';
    ctx.beginPath();
    ctx.moveTo(0, -6);
    ctx.lineTo(5, 4);
    ctx.lineTo(-1, 6);
    ctx.lineTo(-4, 1);
    ctx.closePath();
    ctx.fill();
    // Highlight / reflection
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.moveTo(-1, -3); ctx.lineTo(2, 2); ctx.stroke();
    // Sharp edge outline
    ctx.strokeStyle = 'rgba(100, 140, 160, 0.8)';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(0, -6); ctx.lineTo(5, 4); ctx.lineTo(-1, 6); ctx.lineTo(-4, 1); ctx.closePath();
    ctx.stroke();
    ctx.restore();
    scene.textures.addCanvas('boss_projectile_2', c);
  }

  // ── Projectile 3: metal pipe piece ──
  if (!scene.textures.exists('boss_projectile_3')) {
    const s = 16;
    const c = document.createElement('canvas');
    c.width = s; c.height = s;
    const ctx = c.getContext('2d');
    ctx.save();
    ctx.translate(s / 2, s / 2);
    ctx.rotate(-0.4);
    // Pipe cylinder
    ctx.fillStyle = '#707078';
    ctx.fillRect(-7, -2, 14, 4);
    // Pipe highlight (rounded feel)
    ctx.fillStyle = '#9090a0';
    ctx.fillRect(-6, -2, 12, 1);
    // Pipe shadow
    ctx.fillStyle = '#505058';
    ctx.fillRect(-6, 1, 12, 1);
    // Rusty spots
    ctx.fillStyle = '#8a5a30';
    ctx.fillRect(-3, -1, 2, 2);
    ctx.fillRect(3, 0, 2, 1);
    // Bent/broken end
    ctx.fillStyle = '#606068';
    ctx.beginPath();
    ctx.moveTo(7, -2); ctx.lineTo(8, -3); ctx.lineTo(8, 3); ctx.lineTo(7, 2); ctx.closePath();
    ctx.fill();
    // Thread grooves
    ctx.strokeStyle = '#585860';
    ctx.lineWidth = 0.4;
    ctx.beginPath(); ctx.moveTo(-6, -2); ctx.lineTo(-6, 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-5, -2); ctx.lineTo(-5, 2); ctx.stroke();
    ctx.restore();
    scene.textures.addCanvas('boss_projectile_3', c);
  }

  // Also create the legacy 'boss_projectile' as alias for projectile 0
  if (!scene.textures.exists('boss_projectile')) {
    const s = 16;
    const c = document.createElement('canvas');
    c.width = s; c.height = s;
    const ctx = c.getContext('2d');
    ctx.save();
    ctx.translate(s / 2, s / 2);
    ctx.rotate(0.3);
    ctx.fillStyle = '#8a6a3a';
    ctx.fillRect(-7, -2, 14, 4);
    ctx.strokeStyle = '#6a4a2a';
    ctx.lineWidth = 0.5;
    ctx.beginPath(); ctx.moveTo(-6, 0); ctx.lineTo(6, 0); ctx.stroke();
    ctx.fillStyle = '#a07a4a';
    ctx.beginPath(); ctx.moveTo(7, -2); ctx.lineTo(8, 0); ctx.lineTo(7, 2); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#888888';
    ctx.fillRect(2, -4, 1, 2);
    ctx.restore();
    scene.textures.addCanvas('boss_projectile', c);
  }
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
  const s = 48;
  const c = document.createElement('canvas');
  c.width = s; c.height = s;
  const ctx = c.getContext('2d');
  const cx = s / 2, cy = s / 2;

  // Outer circle
  ctx.strokeStyle = 'rgba(0, 229, 255, 0.6)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(cx, cy, 18, 0, Math.PI * 2);
  ctx.stroke();

  // Inner circle
  ctx.strokeStyle = 'rgba(0, 229, 255, 0.8)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(cx, cy, 6, 0, Math.PI * 2);
  ctx.stroke();

  // Crosshair lines
  ctx.strokeStyle = 'rgba(0, 229, 255, 0.7)';
  ctx.lineWidth = 1;
  // Top
  ctx.beginPath(); ctx.moveTo(cx, cy - 22); ctx.lineTo(cx, cy - 8); ctx.stroke();
  // Bottom
  ctx.beginPath(); ctx.moveTo(cx, cy + 8); ctx.lineTo(cx, cy + 22); ctx.stroke();
  // Left
  ctx.beginPath(); ctx.moveTo(cx - 22, cy); ctx.lineTo(cx - 8, cy); ctx.stroke();
  // Right
  ctx.beginPath(); ctx.moveTo(cx + 8, cy); ctx.lineTo(cx + 22, cy); ctx.stroke();

  // Center dot
  ctx.fillStyle = 'rgba(0, 229, 255, 0.9)';
  ctx.beginPath();
  ctx.arc(cx, cy, 1.5, 0, Math.PI * 2);
  ctx.fill();

  // Corner brackets
  ctx.strokeStyle = 'rgba(0, 229, 255, 0.4)';
  ctx.lineWidth = 1;
  const bc = 20; // bracket corner distance
  const bl = 6;  // bracket length
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
    showControlsOverlay(this, 'ARROWS: Move | Z: Shoot | SPACE: Enter Window | ESC: Pause');

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
    // Start with city intro, then boss fight
    this._startCityIntro();
  }

  // ═════════════════════════════════════════════════════════════
  // HUD
  // ═════════════════════════════════════════════════════════════
  _setupHUD() {
    const hudStyle = { fontFamily: 'monospace', fontSize: '12px', color: '#ffffff' };
    const titleStyle = { fontFamily: 'monospace', fontSize: '11px', color: '#00e5ff',
      shadow: { offsetX: 0, offsetY: 0, color: '#00e5ff', blur: 4, fill: true } };

    this.hudTitle = this.add.text(15, 12, 'OPERATION UNDERGROUND', titleStyle)
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
      this.hudObjective.setText('FIND THE TARGET BUILDING');
      this.hudTimer.setText('');
    } else if (this.phase === 'boss') {
      this.hudPhase.setText('HIDEOUT');
      this.hudObjective.setText('ELIMINATE THE WARDEN');
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
      const opts = this.add.text(W / 2, H / 2 + 20, 'ESC — Resume  |  M — Mute', {
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
      scrollSpeed: CITY_SCROLL_SPEED,
      droneSpeed: CITY_DRONE_SPEED,
      totalLength: CITY_LENGTH,
      scrollX: 0,
      buildings: [],
      rubble: [],
      cables: [],
      craters: [],
      dustParticles: [],
      enemyDrones: [],
      enemyBullets: [],
      playerBullets: [],
      windowTarget: null,
      promptShown: false,
      enterReady: false,
      transitioning: false,
      gfx: this.add.graphics().setDepth(1),
      objects: [],
      invulnTimer: 0,
      shootCooldown: 0,
    };
    const city = this._city;

    // Street center Y
    const streetCenterY = 270;
    const streetHalfH = 100; // half-height of the navigable street
    const topBuildingBottom = streetCenterY - streetHalfH; // Y=170
    const bottomBuildingTop = streetCenterY + streetHalfH; // Y=370

    // Generate buildings along horizontal axis
    const numBuildings = 24;
    for (let i = 0; i < numBuildings; i++) {
      const bx = 200 + i * (CITY_LENGTH - 400) / numBuildings;
      const bw = 120 + Math.random() * 80;

      // Top building (hanging from top)
      const topH = 100 + Math.random() * 100;
      city.buildings.push({
        x: bx, y: 0, w: bw, h: topH + (topBuildingBottom - topH > 0 ? 0 : topBuildingBottom),
        bottomEdge: topBuildingBottom,
        side: 'top',
        damage: Math.random(),
        variant: Math.random() > 0.5 ? 0 : 1,
        color: Math.random() > 0.5 ? 0x8A8A8A : 0xB09870,
      });

      // Bottom building (from bottomBuildingTop downward)
      const botH = 100 + Math.random() * 100;
      city.buildings.push({
        x: bx + (Math.random() - 0.5) * 40, y: bottomBuildingTop, w: bw - 10 + Math.random() * 20,
        h: Math.min(botH, H - bottomBuildingTop),
        side: 'bottom',
        damage: Math.random(),
        variant: Math.random() > 0.5 ? 0 : 1,
        color: Math.random() > 0.5 ? 0x8A8A8A : 0xC4A060,
      });
    }

    // Rubble on the street
    for (let i = 0; i < 60; i++) {
      city.rubble.push({
        x: 100 + Math.random() * (CITY_LENGTH - 200),
        y: topBuildingBottom + 10 + Math.random() * (bottomBuildingTop - topBuildingBottom - 20),
        w: 4 + Math.random() * 12,
        h: 3 + Math.random() * 8,
        color: Math.random() > 0.5 ? 0x6A6A6A : 0x5A4A3A,
      });
    }

    // Destroyed car shapes
    for (let i = 0; i < 8; i++) {
      city.rubble.push({
        x: 300 + i * (CITY_LENGTH / 9),
        y: bottomBuildingTop - 25 + Math.random() * 15,
        w: 35 + Math.random() * 15,
        h: 15 + Math.random() * 8,
        color: 0x3A3530,
        isCar: true,
      });
    }

    // Hanging cables between buildings
    for (let i = 0; i < 15; i++) {
      const cx = 200 + Math.random() * (CITY_LENGTH - 400);
      city.cables.push({
        x1: cx, y1: topBuildingBottom - 5 + Math.random() * 15,
        x2: cx + 30 + Math.random() * 80, y2: topBuildingBottom + Math.random() * 30,
        sag: 15 + Math.random() * 25,
      });
    }

    // Craters on the ground
    for (let i = 0; i < 10; i++) {
      city.craters.push({
        x: 200 + Math.random() * (CITY_LENGTH - 400),
        y: streetCenterY + Math.random() * 60 - 30,
        rx: 15 + Math.random() * 20,
        ry: 6 + Math.random() * 8,
      });
    }

    // Dust particles
    for (let i = 0; i < 40; i++) {
      city.dustParticles.push({
        x: Math.random() * CITY_LENGTH,
        y: 50 + Math.random() * (H - 100),
        speed: 5 + Math.random() * 15,
        size: 1 + Math.random() * 2.5,
        alpha: 0.1 + Math.random() * 0.2,
      });
    }

    // Target building at ~80% of city length
    const targetX = CITY_LENGTH * 0.8;
    city.windowTarget = {
      x: targetX,
      y: streetCenterY - 30,
      w: 30, h: 40,
      buildingX: targetX - 30,
      buildingY: bottomBuildingTop,
      buildingW: 150,
      buildingH: H - bottomBuildingTop,
    };

    // Enemy drones (4 total, spawned at intervals)
    const enemyCount = 4;
    for (let i = 0; i < enemyCount; i++) {
      const ex = 600 + i * (CITY_LENGTH - 800) / enemyCount;
      city.enemyDrones.push({
        x: ex,
        y: topBuildingBottom + 30 + Math.random() * (bottomBuildingTop - topBuildingBottom - 60),
        hp: 2,
        speed: 40 + Math.random() * 30,
        dir: Math.random() > 0.5 ? 1 : -1,
        patrolMinY: topBuildingBottom + 15,
        patrolMaxY: bottomBuildingTop - 15,
        detectRange: 180,
        alerted: false,
        shootCooldown: 0,
        dead: false,
      });
    }

    // Player drone position (left side of screen)
    this.droneX = 100;
    this.droneY = streetCenterY;

    // Controls instruction
    this.instrText.setText('ARROWS: Move | Z: Shoot | SPACE: Enter Window');
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

    const streetCenterY = 270;
    const streetHalfH = 100;
    const topBuildingBottom = streetCenterY - streetHalfH;
    const bottomBuildingTop = streetCenterY + streetHalfH;

    // Auto-scroll rightward
    city.scrollX += city.scrollSpeed * dt;

    // Player movement (4 directions)
    let dx = 0, dy = 0;
    if (this.keys.left.isDown) dx -= 1;
    if (this.keys.right.isDown) dx += 1;
    if (this.keys.up.isDown) dy -= 1;
    if (this.keys.down.isDown) dy += 1;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    dx /= len; dy /= len;

    this.droneX += dx * city.droneSpeed * dt;
    this.droneY += dy * city.droneSpeed * dt;

    // Clamp to street bounds
    const margin = 18;
    this.droneX = Math.max(margin, Math.min(W - margin, this.droneX));
    this.droneY = Math.max(topBuildingBottom + margin, Math.min(bottomBuildingTop - margin, this.droneY));

    // Invulnerability timer
    if (city.invulnTimer > 0) city.invulnTimer -= dt;

    // Shoot cooldown
    if (city.shootCooldown > 0) city.shootCooldown -= dt;

    // Z key shoots forward (rightward) — cyan bullets
    if (this.keys.z.isDown && city.shootCooldown <= 0) {
      city.shootCooldown = 0.2;
      city.playerBullets.push({
        x: this.droneX + city.scrollX + 15,
        y: this.droneY,
        vx: 400,
        life: 2,
      });
      SoundManager.get().playPlayerShoot();
    }

    // Update dust particles
    for (const d of city.dustParticles) {
      d.x += d.speed * dt;
      d.y += Math.sin(d.x * 0.01) * 0.3;
      if (d.x > city.scrollX + W + 50) {
        d.x = city.scrollX - 50;
      }
    }

    // Update enemy drones
    for (const e of city.enemyDrones) {
      if (e.dead) continue;

      // Patrol vertically
      e.y += e.speed * e.dir * dt;
      if (e.y <= e.patrolMinY) { e.y = e.patrolMinY; e.dir = 1; }
      if (e.y >= e.patrolMaxY) { e.y = e.patrolMaxY; e.dir = -1; }

      // Screen position of enemy
      const eScreenX = e.x - city.scrollX;
      const eScreenY = e.y;

      // Detection
      const distToPlayer = Math.sqrt(
        (eScreenX - this.droneX) ** 2 + (eScreenY - this.droneY) ** 2
      );
      e.alerted = distToPlayer < e.detectRange && eScreenX > -50 && eScreenX < W + 50;

      // Shoot if alerted
      if (e.alerted) {
        e.shootCooldown -= dt;
        if (e.shootCooldown <= 0) {
          e.shootCooldown = 1.0 + Math.random() * 0.5;
          const angle = Math.atan2(this.droneY - eScreenY, this.droneX - eScreenX);
          city.enemyBullets.push({
            x: e.x,
            y: e.y,
            vx: Math.cos(angle) * 200,
            vy: Math.sin(angle) * 200,
            life: 3,
          });
          SoundManager.get().playPlayerShoot();
        }
      }
    }

    // Update player bullets (world coordinates)
    for (let i = city.playerBullets.length - 1; i >= 0; i--) {
      const b = city.playerBullets[i];
      b.x += b.vx * dt;
      b.life -= dt;

      // Check hit on enemy drones
      for (const e of city.enemyDrones) {
        if (e.dead) continue;
        const bdx = b.x - e.x;
        const bdy = b.y - e.y;
        if (Math.sqrt(bdx * bdx + bdy * bdy) < 20) {
          e.hp--;
          if (e.hp <= 0) {
            e.dead = true;
            this.enemiesKilled++;
            this.score += 300;
          }
          city.playerBullets.splice(i, 1);
          break;
        }
      }

      if (b.life <= 0 || b.x > city.scrollX + W + 100) {
        city.playerBullets.splice(i, 1);
      }
    }

    // Update enemy bullets (world coordinates)
    for (let i = city.enemyBullets.length - 1; i >= 0; i--) {
      const b = city.enemyBullets[i];
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.life -= dt;

      // Screen position
      const bScreenX = b.x - city.scrollX;
      const bScreenY = b.y;

      // Hit player?
      const bdx = bScreenX - this.droneX;
      const bdy = bScreenY - this.droneY;
      if (Math.sqrt(bdx * bdx + bdy * bdy) < 14 && city.invulnTimer <= 0) {
        this._takeDamage(1);
        city.invulnTimer = 1.0;
        city.enemyBullets.splice(i, 1);
        continue;
      }

      if (b.life <= 0 || bScreenX < -50 || bScreenX > W + 50 || bScreenY < -50 || bScreenY > H + 50) {
        city.enemyBullets.splice(i, 1);
      }
    }

    // Check proximity to target window
    if (city.windowTarget) {
      const tw = city.windowTarget;
      const twScreenX = tw.x - city.scrollX;
      const twScreenY = tw.y;
      const twDx = this.droneX - twScreenX;
      const twDy = this.droneY - twScreenY;
      const twDist = Math.sqrt(twDx * twDx + twDy * twDy);

      if (twDist < 60) {
        if (!city.promptShown) {
          city.promptShown = true;
          city.enterReady = true;
          this.instrText.setText('PRESS SPACE TO ENTER');
          this.instrText.setAlpha(1);
          this.instrBg.setAlpha(0.7);
        }
      } else {
        if (city.promptShown && !city.transitioning) {
          city.promptShown = false;
          city.enterReady = false;
          this.instrText.setAlpha(0);
          this.instrBg.setAlpha(0);
        }
      }

      // Enter the window
      if (city.enterReady && Phaser.Input.Keyboard.JustDown(this.keys.space)) {
        this._cityEnterWindow();
        return;
      }
    }

    // Failsafe: if scrolled past city length, auto-transition
    if (city.scrollX >= CITY_LENGTH) {
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

    const offX = city.scrollX;
    const streetCenterY = 270;
    const streetHalfH = 100;
    const topBuildingBottom = streetCenterY - streetHalfH;
    const bottomBuildingTop = streetCenterY + streetHalfH;

    // Daytime sky background
    gfx.fillStyle(0x87CEEB);
    gfx.fillRect(0, 0, W, H);

    // Warm sun glow (upper right)
    gfx.fillStyle(0xFFF0C8, 0.2);
    gfx.fillCircle(W * 0.85, H * 0.12, 120);
    gfx.fillStyle(0xFFF0C8, 0.1);
    gfx.fillCircle(W * 0.85, H * 0.12, 200);

    // Street surface (asphalt gray)
    gfx.fillStyle(0x6A6A6A);
    gfx.fillRect(0, topBuildingBottom, W, bottomBuildingTop - topBuildingBottom);

    // Street center dashed line
    gfx.lineStyle(1, 0x8A8A8A, 0.4);
    for (let sx = -((offX * 1.0) % 40); sx < W; sx += 40) {
      gfx.beginPath();
      gfx.moveTo(sx, streetCenterY);
      gfx.lineTo(sx + 20, streetCenterY);
      gfx.strokePath();
    }

    // Draw craters
    for (const cr of city.craters) {
      const sx = cr.x - offX;
      if (sx > W + 30 || sx < -30) continue;
      gfx.fillStyle(0x4A4A4A, 0.4);
      gfx.fillEllipse(sx, cr.y, cr.rx * 2, cr.ry * 2);
    }

    // Draw buildings
    for (const b of city.buildings) {
      const sx = b.x - offX;
      if (sx > W + 200 || sx + b.w < -200) continue;

      // Building body
      gfx.fillStyle(b.color);
      if (b.side === 'top') {
        gfx.fillRect(sx, 0, b.w, topBuildingBottom);
      } else {
        gfx.fillRect(sx, bottomBuildingTop, b.w, H - bottomBuildingTop);
      }

      // Building outline
      gfx.lineStyle(1, 0x5A5A5A, 0.5);
      if (b.side === 'top') {
        gfx.strokeRect(sx, 0, b.w, topBuildingBottom);
      } else {
        gfx.strokeRect(sx, bottomBuildingTop, b.w, H - bottomBuildingTop);
      }

      // Windows
      const startY = b.side === 'top' ? 15 : bottomBuildingTop + 15;
      const endY = b.side === 'top' ? topBuildingBottom - 15 : H - 15;
      const cols = Math.floor(b.w / 30);
      for (let wc = 0; wc < cols; wc++) {
        for (let wy = startY; wy + 20 < endY; wy += 35) {
          const wx = sx + 10 + wc * 30;
          if (wx > W + 10 || wx < -20) continue;
          // Some blown out, some intact
          const hash = (Math.floor(b.x) * 7 + wc * 13 + Math.floor(wy) * 3) % 5;
          if (hash === 0) {
            // Blown out - dark interior
            gfx.fillStyle(0x2A2520, 0.8);
            gfx.fillRect(wx, wy, 18, 22);
          } else {
            // Dark window
            gfx.fillStyle(0x1A1A22, 0.7);
            gfx.fillRect(wx, wy, 18, 22);
            gfx.lineStyle(1, 0x6A6A6A, 0.4);
            gfx.strokeRect(wx, wy, 18, 22);
          }
        }
      }

      // Damage: missing wall sections on some buildings
      if (b.damage > 0.6) {
        const holeX = sx + b.w * 0.3 + Math.sin(b.x) * 20;
        const holeY = b.side === 'top' ? topBuildingBottom - 40 : bottomBuildingTop + 10;
        gfx.fillStyle(0x2A2218, 0.7);
        gfx.fillRect(holeX, holeY, 30 + b.damage * 20, 25);
      }
    }

    // Draw rubble and cars
    for (const r of city.rubble) {
      const sx = r.x - offX;
      if (sx > W + 20 || sx < -20) continue;
      gfx.fillStyle(r.color, 0.7);
      if (r.isCar) {
        // Car body
        gfx.fillRect(sx, r.y, r.w, r.h);
        // Car top
        gfx.fillStyle(0x2A2520, 0.6);
        gfx.fillRect(sx + 5, r.y - 8, r.w - 10, 8);
        // Burn marks
        gfx.fillStyle(0x0A0805, 0.3);
        gfx.fillEllipse(sx + r.w / 2, r.y + r.h / 2, r.w * 0.6, r.h * 0.8);
      } else {
        gfx.fillRect(sx - r.w / 2, r.y - r.h / 2, r.w, r.h);
      }
    }

    // Draw cables
    gfx.lineStyle(1.5, 0x4A4A4A, 0.5);
    for (const c of city.cables) {
      const sx1 = c.x1 - offX;
      const sx2 = c.x2 - offX;
      if (sx1 > W + 30 && sx2 > W + 30) continue;
      if (sx1 < -30 && sx2 < -30) continue;
      const midX = (sx1 + sx2) / 2;
      const midY = (c.y1 + c.y2) / 2 + c.sag;
      gfx.beginPath();
      gfx.moveTo(sx1, c.y1);
      gfx.lineTo(midX, midY);
      gfx.lineTo(sx2, c.y2);
      gfx.strokePath();
    }

    // Draw target building with glowing window
    if (city.windowTarget) {
      const tw = city.windowTarget;
      const tsx = tw.x - offX;
      if (tsx > -50 && tsx < W + 50) {
        // Pulsing glow
        const pulse = 0.5 + 0.5 * Math.sin(Date.now() / 300);
        const alpha = 0.2 + pulse * 0.3;

        // Window outer glow
        gfx.fillStyle(0xFFD700, alpha * 0.3);
        gfx.fillRect(tsx - 20, tw.y - 25, 70, 90);
        // Window body
        gfx.fillStyle(0xFFD700, alpha);
        gfx.fillRect(tsx, tw.y, tw.w, tw.h);
        // Inner bright
        gfx.fillStyle(0xFFDD66, alpha * 0.8);
        gfx.fillRect(tsx + 4, tw.y + 4, tw.w - 8, tw.h - 8);
        // Outer halo
        gfx.lineStyle(3, 0xFFAA22, alpha * 0.5);
        gfx.strokeRect(tsx - 5, tw.y - 5, tw.w + 10, tw.h + 10);
      }
    }

    // Draw dust particles
    for (const d of city.dustParticles) {
      const sx = d.x - offX;
      if (sx < -10 || sx > W + 10) continue;
      gfx.fillStyle(0xC8B890, d.alpha);
      gfx.fillCircle(sx, d.y, d.size);
    }

    // Draw enemy drones
    for (const e of city.enemyDrones) {
      if (e.dead) continue;
      const esx = e.x - offX;
      if (esx > W + 30 || esx < -30) continue;

      // Red quad-rotor shape
      const droneColor = e.alerted ? 0xFF2222 : 0xCC4444;
      gfx.fillStyle(droneColor, 0.9);
      // Body
      gfx.fillRect(esx - 6, e.y - 6, 12, 12);
      // Arms and rotors
      const armLen = 12;
      gfx.lineStyle(2, droneColor, 0.7);
      for (let a = 0; a < 4; a++) {
        const angle = a * Math.PI / 2 + Math.PI / 4;
        const ax = esx + Math.cos(angle) * armLen;
        const ay = e.y + Math.sin(angle) * armLen;
        gfx.beginPath();
        gfx.moveTo(esx, e.y);
        gfx.lineTo(ax, ay);
        gfx.strokePath();
        gfx.fillStyle(droneColor, 0.4);
        gfx.fillCircle(ax, ay, 5);
      }
      // Eye
      gfx.fillStyle(e.alerted ? 0xFFFF00 : 0xFF8844, 1);
      gfx.fillCircle(esx, e.y, 2);
    }

    // Draw enemy bullets
    for (const b of city.enemyBullets) {
      const bsx = b.x - offX;
      if (bsx < -10 || bsx > W + 10) continue;
      gfx.fillStyle(0xFF4444, 0.9);
      gfx.fillCircle(bsx, b.y, 3);
      gfx.fillStyle(0xFF2222, 0.3);
      gfx.fillCircle(bsx - b.vx * 0.015, b.y - b.vy * 0.015, 2);
    }

    // Draw player bullets
    for (const b of city.playerBullets) {
      const bsx = b.x - offX;
      if (bsx < -10 || bsx > W + 10) continue;
      gfx.fillStyle(0x00E5FF, 0.9);
      gfx.fillCircle(bsx, b.y, 3);
      gfx.fillStyle(0x00AACC, 0.4);
      gfx.fillCircle(bsx - 8, b.y, 2);
    }

    // Draw player drone
    const flashOn = city.invulnTimer > 0 && Math.floor(Date.now() / 80) % 2 === 0;
    if (!flashOn) {
      gfx.fillStyle(0x00CCFF, 0.9);
      gfx.fillCircle(this.droneX, this.droneY, 8);
      gfx.fillStyle(0x0088CC, 0.8);
      gfx.fillCircle(this.droneX, this.droneY, 4);
      // Propeller arms
      gfx.lineStyle(2, 0x00AADD, 0.7);
      for (let a = 0; a < 4; a++) {
        const angle = a * Math.PI / 2 + Date.now() / 200;
        gfx.beginPath();
        gfx.moveTo(this.droneX, this.droneY);
        gfx.lineTo(this.droneX + Math.cos(angle) * 12, this.droneY + Math.sin(angle) * 12);
        gfx.strokePath();
      }
      // Glow
      gfx.fillStyle(0x00CCFF, 0.15);
      gfx.fillCircle(this.droneX, this.droneY, 18);
    }
  }

  _cityEnterWindow() {
    const city = this._city;
    city.transitioning = true;
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

          // "THE WARDEN" text
          const wardenTitle = this.add.text(W / 2, H / 2 - 30, 'THE WARDEN', {
            fontFamily: 'monospace', fontSize: '42px', color: '#ff4400',
            fontStyle: 'bold',
            shadow: { offsetX: 0, offsetY: 0, color: '#ff4400', blur: 20, fill: true },
          }).setOrigin(0.5).setDepth(42).setAlpha(0);
          city.objects.push(wardenTitle);

          const wardenSub = this.add.text(W / 2, H / 2 + 20, 'HE KNOWS YOU\'RE HERE', {
            fontFamily: 'monospace', fontSize: '14px', color: '#ff8844',
          }).setOrigin(0.5).setDepth(42).setAlpha(0);
          city.objects.push(wardenSub);

          this.tweens.add({
            targets: [wardenTitle, wardenSub],
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
    city.buildings = [];
    city.rubble = [];
    city.cables = [];
    city.enemyDrones = [];
    city.enemyBullets = [];
    city.playerBullets = [];
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
    const txt = this.add.text(W / 2, H / 2 - 20, 'OPERATION UNDERGROUND', {
      fontFamily: 'monospace', fontSize: '24px', color: '#ff8800',
      shadow: { offsetX: 0, offsetY: 0, color: '#ff8800', blur: 10, fill: true },
    }).setOrigin(0.5).setDepth(41);

    const sub = this.add.text(W / 2, H / 2 + 20, 'INFILTRATE AND ELIMINATE THE WARDEN', {
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
  // BOSS FIGHT: THE WARDEN (single scene)
  // ═════════════════════════════════════════════════════════════
  _startBossFight() {
    this.phase = 'boss';
    MusicManager.get().playLevel4Music('command');

    // Increase drone HP for the boss fight
    this.droneHP = this.dm.isHard() ? 4 : 6;
    this.droneMaxHP = this.droneHP;

    // Command room background (front-view destroyed daytime interior)
    this.commandBg = this.add.image(W / 2, H / 2, 'command_room').setDepth(0);

    // Drone/crosshair setup — since we look FROM the drone's POV, show a crosshair reticle
    this.droneX = W / 2;
    this.droneY = H - 100;
    this.droneSprite = this.add.image(this.droneX, this.droneY, 'drone_crosshair').setDepth(25);
    this.droneSprite.setDisplaySize(48, 48);

    // Drone combat state
    this.droneBullets = [];
    this.droneMissiles = [];
    this.droneShootTimer = 0;
    this.droneMissileTimer = 0;
    this.droneInvulnTimer = 0;
    this.dodgeCooldown = 0;
    this.dodgeActive = false;
    this.dodgeTimer = 0;

    // Boss state (front-facing perspective)
    this.bossMaxHP = Math.ceil(BOSS_BASE_HP * this.dm.bossHPMult());
    this.bossHP = this.bossMaxHP;
    this.bossDefeated = false;
    this.bossX = ARMCHAIR_X;
    this.bossY = ARMCHAIR_Y - 60; // starts behind armchair
    this.bossVx = 0;
    this.bossFury = false;
    this.bossExpression = 'normal';
    this.bossActive = false; // not active until entrance finishes

    // Boss attack timers
    this.bossThrowTimer = BOSS_THROW_INTERVAL_MIN + Math.random() * (BOSS_THROW_INTERVAL_MAX - BOSS_THROW_INTERVAL_MIN);
    this.bossThrowBurstCount = 0;
    this.bossThrowBurstTimer = 0;
    this.bossMoveDirTimer = 0;

    // Boss projectiles (thrown objects that fly toward camera)
    this.bossProjectiles = [];

    // Boss sprite — placed behind armchair initially
    this.bossSprite = this.add.image(this.bossX, this.bossY, 'ts_boss4_normal').setDepth(10);
    this.bossSprite.setDisplaySize(BOSS_DISPLAY, BOSS_DISPLAY);

    // Boss HP bar (full width, top of screen, scrollFactor 0)
    this._createBossHPBar();

    // Single armchair (individual seat, not sofa) — the ONLY cover in the room
    this.armchairSprite = this.add.image(ARMCHAIR_X, ARMCHAIR_Y, 'armchair').setDepth(12);
    this.armchairSprite.setDisplaySize(100, 100);

    // Boss cover state machine — 3-state cycle around the single armchair
    // States: 'behind_cover' -> 'peeking' -> 'throwing' -> 'behind_cover'
    this.bossCoverState = 'behind_cover';  // boss starts hidden behind armchair
    this.bossCoverTimer = 1.5 + Math.random() * 1.5; // first peek in 1.5-3s
    this.bossPeekTimer = 0;
    this.bossPeekSide = 1; // 1 = right side, -1 = left side (alternates)

    // Phase 2 / Phase 3 state flags
    this.bossPhase2 = false; // 50% HP — faster pace, 2 throws per peek
    this.bossPhase3 = false; // 20% HP — very fast, 3 throws, melee charges
    this.bossChargeTimer = 0;    // phase 3: time left in current charge burst
    this.bossPauseTimer = 0;     // phase 3: time left in pause between charges
    this.bossCharging = false;   // phase 3: currently charging?
    this.bossWeaponSprite = null; // phase 3: pipe weapon sprite

    // Fury particles array (red dots floating up around boss when furious)
    this.furyParticles = [];
    this.furySpawnTimer = 0;

    // Ambient dust particles (semi-transparent, slowly drifting in the room)
    this.ambientDustParticles = [];
    this._spawnAmbientDust();

    // Falling rubble particles from ceiling (small rectangles dropping slowly)
    this.fallingRubble = [];
    this._spawnFallingRubble();

    // Instructions
    this.instrText.setText('ARROWS aim — Z shoot — X missile — SHIFT dodge — Eliminate the target!');
    this.instrText.setColor('#ff8800');

    // Dodge cooldown HUD indicator (bottom-left)
    this.dodgeHudLabel = this.add.text(20, H - 55, 'SHIFT', {
      fontFamily: 'monospace', fontSize: '10px', color: '#00ccff',
    }).setDepth(52).setScrollFactor(0);
    this.dodgeHudBg = this.add.rectangle(62, H - 50, 40, 6, 0x222222).setDepth(51).setScrollFactor(0);
    this.dodgeHudFill = this.add.rectangle(62, H - 50, 40, 6, 0x00ccff).setDepth(52).setScrollFactor(0);

    // Start boss entrance
    this._bossEntrance();
  }

  _createBossHPBar() {
    const barW = W - 100;
    const barH = 16;
    const barX = 50;
    const barY = 65;

    // Background
    this.bossHPBarBg = this.add.rectangle(barX + barW / 2, barY + barH / 2, barW, barH, 0x222222)
      .setDepth(51).setScrollFactor(0);
    this.bossHPBarBg.setStrokeStyle(1, 0x444444);

    // Fill
    this.bossHPBarFill = this.add.rectangle(barX + 1, barY + 1, barW - 2, barH - 2, 0xff0000)
      .setDepth(52).setScrollFactor(0).setOrigin(0, 0);

    // Label
    this.bossHPBarLabel = this.add.text(W / 2, barY - 2, 'THE WARDEN', {
      fontFamily: 'monospace', fontSize: '12px', color: '#ff4444',
      shadow: { offsetX: 0, offsetY: 0, color: '#ff4444', blur: 6, fill: true },
    }).setOrigin(0.5, 1).setDepth(53).setScrollFactor(0);
  }

  _updateBossHPBar() {
    if (!this.bossHPBarFill || !this.bossHPBarBg) return;
    const barW = W - 100;
    const ratio = Math.max(0, this.bossHP / this.bossMaxHP);
    this.bossHPBarFill.width = (barW - 2) * ratio;

    // Color changes based on HP
    let color;
    if (ratio > 0.6) {
      color = 0xff0000; // red
    } else if (ratio > 0.3) {
      color = 0xff8800; // orange
    } else {
      color = 0x880000; // dark red
    }
    this.bossHPBarFill.setFillStyle(color);
  }

  _bossEntrance() {
    this.bossActive = false;

    // Boss emerges from behind armchair (stands up from cover)
    SoundManager.get().playBossEntrance();

    // Start behind armchair, then stand up
    this.bossX = ARMCHAIR_X;
    const startY = ARMCHAIR_Y;
    const targetY = BOSS_AREA_TOP + (BOSS_AREA_BOTTOM - BOSS_AREA_TOP) * 0.4;

    if (this.bossSprite) {
      this.bossSprite.setPosition(this.bossX, startY);
      this.bossSprite.setAlpha(0.3);
      this.bossSprite.setDisplaySize(BOSS_DISPLAY * 0.5, BOSS_DISPLAY * 0.5);
    }

    this.tweens.add({
      targets: { val: 0 },
      val: 1,
      duration: 1500,
      ease: 'Back.easeOut',
      onUpdate: (tween) => {
        const t = tween.getValue();
        this.bossY = Phaser.Math.Linear(startY, targetY, t);
        if (this.bossSprite) {
          this.bossSprite.setPosition(this.bossX, this.bossY);
          this.bossSprite.setAlpha(0.3 + 0.7 * t);
          const size = Phaser.Math.Linear(BOSS_DISPLAY * 0.5, BOSS_DISPLAY, t);
          this.bossSprite.setDisplaySize(size, size);
        }
      },
      onComplete: () => {
        // Screen shake on reveal
        this.cameras.main.shake(400, 0.025);
        SoundManager.get().playBossShockwave();

        // "THE WARDEN" text appears dramatically
        const nameText = this.add.text(W / 2, H / 2, 'THE WARDEN', {
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
            // Boss becomes active after entrance
            this.bossActive = true;
            this._pickBossMoveDirection();
          },
        });
      },
    });
  }




  // ── Boss state machine: hide-peek-throw cycle behind single armchair ──
  _updateBoss(dt) {
    if (!this.bossActive || this.bossDefeated) return;

    // ── Phase transitions ──
    const hpRatio = this.bossHP / this.bossMaxHP;

    // Phase 2 activation at 50% HP (angry — faster pace, 2 throws)
    if (!this.bossPhase2 && hpRatio <= BOSS_PHASE2_THRESHOLD) {
      this.bossPhase2 = true;
      SoundManager.get().playBossRoar();
      this.cameras.main.shake(250, 0.018);

      // Flash boss
      if (this.bossSprite) {
        this.tweens.add({
          targets: this.bossSprite, alpha: 0.3, duration: 80, yoyo: true, repeat: 4,
        });
      }
    }

    // Phase 3 activation at 20% HP (furious — very fast, 3 throws, melee charges)
    if (!this.bossPhase3 && hpRatio <= BOSS_PHASE3_THRESHOLD) {
      this.bossPhase3 = true;
      this.bossCharging = false;
      this.bossPauseTimer = 0.5; // brief pause before first charge
      SoundManager.get().playBossRoar();
      this.cameras.main.shake(400, 0.03);

      // Equip pipe weapon
      if (!this.bossWeaponSprite && this.bossSprite) {
        this.bossWeaponSprite = this.add.image(this.bossX + 30, this.bossY + 15, 'boss_pipe_weapon').setDepth(11);
        this.bossWeaponSprite.setDisplaySize(32, 8);
      }

      // Flash boss red
      if (this.bossSprite) {
        this.tweens.add({
          targets: this.bossSprite, alpha: 0.2, duration: 60, yoyo: true, repeat: 8,
        });
      }
    }

    // ── Phase 3: Melee charge behavior (boss rushes from behind armchair) ──
    if (this.bossPhase3) {
      this._updateBossPhase3(dt);
    }

    // ── Expression changes ──
    let newExpr;
    if (hpRatio > 0.5) newExpr = 'normal';
    else if (hpRatio > BOSS_PHASE3_THRESHOLD) newExpr = 'angry';
    else newExpr = 'furious';

    if (newExpr !== this.bossExpression) {
      this.bossExpression = newExpr;
      const texKey = 'ts_boss4_' + newExpr;
      if (this.bossSprite && this.textures.exists(texKey)) {
        this.bossSprite.setTexture(texKey);
      }
      if (newExpr === 'furious' && !this.bossFury) {
        this.bossFury = true;
        SoundManager.get().playBossRoar();
        this.cameras.main.shake(300, 0.02);
      }
    }

    // ── Cover behavior: hide-peek-throw cycle (only when NOT in phase 3 charge) ──
    if (!this.bossPhase3 || !this.bossCharging) {
      this._updateBossArmchairCover(dt);
    }

    // ── Update pipe weapon position (phase 3) ──
    if (this.bossWeaponSprite) {
      const weapDir = this.bossVx >= 0 ? 1 : -1;
      this.bossWeaponSprite.setPosition(this.bossX + weapDir * 30, this.bossY + 15);
      this.bossWeaponSprite.setFlipX(weapDir < 0);
      if (this.bossCharging) {
        this.bossWeaponSprite.rotation += dt * 8 * weapDir;
      } else {
        this.bossWeaponSprite.rotation = weapDir > 0 ? 0.3 : -0.3;
      }
    }

    // ── Update projectiles (thrown objects flying toward camera) ──
    this._updateBossProjectiles(dt);

    // ── Fury red particles ──
    this._updateFuryParticles(dt);

    // ── Ambient dust ──
    this._updateAmbientDust(dt);

    // ── Falling rubble ──
    this._updateFallingRubble(dt);

    // ── Update HP bar ──
    this._updateBossHPBar();
  }

  // ── Armchair cover state machine: behind_cover -> peeking -> throwing -> behind_cover ──
  _updateBossArmchairCover(dt) {
    const behindY = ARMCHAIR_Y - 60;  // boss hidden behind armchair
    const peekY = ARMCHAIR_Y - 90;    // boss head visible above armchair

    switch (this.bossCoverState) {
      case 'behind_cover':
        this.bossCoverTimer -= dt;

        // Boss hidden behind armchair — only show keffiyeh/hat peeking slightly
        this.bossX = ARMCHAIR_X;
        this.bossY = behindY;
        if (this.bossSprite) {
          this.bossSprite.setPosition(this.bossX, this.bossY);
          this.bossSprite.setAlpha(0.2); // barely visible behind chair
          this.bossSprite.setDisplaySize(BOSS_DISPLAY * 0.4, BOSS_DISPLAY * 0.4);
        }

        // Timer expires: peek out
        if (this.bossCoverTimer <= 0) {
          this.bossCoverState = 'peeking';
          // Peek duration: player can shoot during this window
          this.bossPeekTimer = 0.5;
          // Alternate peek side
          this.bossPeekSide = -this.bossPeekSide;
          this.bossY = peekY;
          if (this.bossSprite) {
            this.bossSprite.setAlpha(1);
            this.bossSprite.setDisplaySize(BOSS_DISPLAY, BOSS_DISPLAY);
            // Offset slightly to the peek side
            this.bossX = ARMCHAIR_X + this.bossPeekSide * 30;
            this.bossSprite.setPosition(this.bossX, this.bossY);
          }
          // "SHOOT NOW!" hint
          const hint = this.add.text(ARMCHAIR_X, ARMCHAIR_Y - 110, 'SHOOT NOW!', {
            fontFamily: 'monospace', fontSize: '11px', color: '#00ff66',
          }).setOrigin(0.5).setDepth(20);
          this.tweens.add({ targets: hint, alpha: 0, duration: 800, onComplete: () => hint.destroy() });
        }
        break;

      case 'peeking':
        this.bossPeekTimer -= dt;
        if (this.bossSprite) {
          this.bossSprite.setPosition(this.bossX, this.bossY);
        }

        // After peek delay: transition to throwing
        if (this.bossPeekTimer <= 0) {
          this.bossCoverState = 'throwing';
          // Determine throw count based on phase
          let throwCount = 1;
          if (this.bossPhase3) throwCount = 3;
          else if (this.bossPhase2) throwCount = 2;

          // Throw objects with staggered timing
          this._bossThrowObject();
          for (let t = 1; t < throwCount; t++) {
            this.time.delayedCall(t * 150, () => {
              if (this.bossActive && !this.bossDefeated) this._bossThrowObject();
            });
          }

          // Brief throwing animation time before retreating
          this.bossCoverTimer = 0.3 + throwCount * 0.15;
        }
        break;

      case 'throwing':
        this.bossCoverTimer -= dt;
        if (this.bossSprite) {
          this.bossSprite.setPosition(this.bossX, this.bossY);
        }

        // After throw animation: retreat behind armchair
        if (this.bossCoverTimer <= 0) {
          this.bossCoverState = 'behind_cover';
          this.bossY = behindY;
          this.bossX = ARMCHAIR_X;

          // Set hide duration based on phase
          if (this.bossPhase3) {
            this.bossCoverTimer = 0.5 + Math.random() * 0.5; // very fast (0.5-1s)
          } else if (this.bossPhase2) {
            this.bossCoverTimer = 1.0 + Math.random() * 0.5; // faster (1-1.5s)
          } else {
            this.bossCoverTimer = 2.0 + Math.random() * 1.0; // normal (2-3s)
          }

          // Boss becomes invulnerable again once behind armchair
          if (this.bossSprite) {
            this.bossSprite.setAlpha(0.2);
            this.bossSprite.setDisplaySize(BOSS_DISPLAY * 0.4, BOSS_DISPLAY * 0.4);
            this.bossSprite.setPosition(this.bossX, this.bossY);
          }
        }
        break;
    }
  }

  // ── Phase 3: Melee charge logic (boss rushes from armchair toward drone) ──
  _updateBossPhase3(dt) {
    if (this.bossCharging) {
      // Charging toward drone position
      this.bossChargeTimer -= dt;

      const dxToDrone = this.droneX - this.bossX;
      const dyToDrone = this.droneY - this.bossY;
      const distToDrone = Math.sqrt(dxToDrone * dxToDrone + dyToDrone * dyToDrone);

      if (distToDrone > 5) {
        this.bossX += (dxToDrone / distToDrone) * BOSS_SPEED_PHASE3 * dt;
        this.bossY += (dyToDrone / distToDrone) * BOSS_SPEED_PHASE3 * dt;
      }

      // Keep in bounds
      this.bossX = Phaser.Math.Clamp(this.bossX, BOSS_AREA_LEFT, BOSS_AREA_RIGHT);
      this.bossY = Phaser.Math.Clamp(this.bossY, BOSS_AREA_TOP, H - 60);

      // Check contact with drone — heavy melee damage
      if (this.droneInvulnTimer <= 0) {
        const contactDist = Phaser.Math.Distance.Between(this.bossX, this.bossY, this.droneX, this.droneY);
        if (contactDist < 50) {
          this._takeDamage(BOSS_PHASE3_CHARGE_DMG);
          this.droneInvulnTimer = 1.5;
          SoundManager.get().playBossShockwave();
          this.cameras.main.shake(300, 0.025);
        }
      }

      // Update sprite
      if (this.bossSprite) {
        this.bossSprite.setAlpha(1);
        this.bossSprite.setPosition(this.bossX, this.bossY);
        this.bossSprite.setDisplaySize(BOSS_DISPLAY * 1.1, BOSS_DISPLAY * 1.1);
      }

      // Charge finished — run back behind armchair
      if (this.bossChargeTimer <= 0) {
        this.bossCharging = false;
        this.bossPauseTimer = 1.0; // 1s pause between charges
        this.bossCoverState = 'behind_cover';
        this.bossCoverTimer = 0.5 + Math.random() * 0.5;
        if (this.bossSprite) {
          this.bossSprite.setDisplaySize(BOSS_DISPLAY, BOSS_DISPLAY);
        }
      }
    } else {
      // Pause between charges — retreating behind armchair
      this.bossPauseTimer -= dt;

      // Move back toward armchair
      const retreatX = ARMCHAIR_X;
      const retreatY = ARMCHAIR_Y - 60;
      const dx = retreatX - this.bossX;
      const dy = retreatY - this.bossY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 5) {
        this.bossX += (dx / dist) * 80 * dt;
        this.bossY += (dy / dist) * 80 * dt;
      }

      if (this.bossPauseTimer <= 0) {
        // Start a new charge
        this.bossCharging = true;
        this.bossChargeTimer = 2.0;
        SoundManager.get().playBossRoar();
        // Boss becomes fully visible during charge
        if (this.bossSprite) {
          this.bossSprite.setAlpha(1);
          this.bossSprite.setDisplaySize(BOSS_DISPLAY * 1.1, BOSS_DISPLAY * 1.1);
        }
      }
    }
  }

  _bossThrowObject() {
    if (!this.bossSprite) return;
    SoundManager.get().playBossLaser();

    // Show throwing arm animation
    const armStartX = this.bossX;
    const armStartY = this.bossY + 15;
    const armTargetX = this.droneX;
    const armTargetY = this.droneY;
    const armAngle = Math.atan2(armTargetY - armStartY, armTargetX - armStartX);
    const armLen = 28;

    const armGfx = this.add.graphics().setDepth(11);
    armGfx.lineStyle(5, 0x7a5030, 1);
    armGfx.beginPath();
    armGfx.moveTo(armStartX, armStartY);
    armGfx.lineTo(armStartX + Math.cos(armAngle) * armLen, armStartY + Math.sin(armAngle) * armLen);
    armGfx.strokePath();
    armGfx.fillStyle(0x906040, 1);
    armGfx.fillCircle(armStartX + Math.cos(armAngle) * armLen, armStartY + Math.sin(armAngle) * armLen, 4);

    this.tweens.add({
      targets: armGfx,
      alpha: 0,
      duration: 300,
      delay: 50,
      onComplete: () => armGfx.destroy(),
    });

    // Create projectile
    const startX = this.bossX;
    const startY = this.bossY + 30;
    const spread = this.bossCoverState === 'peeking' || this.bossCoverState === 'throwing' ? 50 : 80;
    const targetX = this.droneX + (Math.random() - 0.5) * spread;
    const targetY = this.droneY + (Math.random() - 0.5) * 30;

    const projIdx = Math.floor(Math.random() * 4);
    const projTex = 'boss_projectile_' + projIdx;
    const texKey = this.textures.exists(projTex) ? projTex : 'boss_projectile';

    const proj = this.add.image(startX, startY, texKey).setDepth(18);
    proj.setDisplaySize(8, 8);

    const dx = targetX - startX;
    const dy = targetY - startY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const speed = BOSS_THROW_SPEED;

    this.bossProjectiles.push({
      sprite: proj,
      x: startX,
      y: startY,
      vx: (dx / dist) * speed,
      vy: (dy / dist) * speed,
      startX: startX,
      startY: startY,
      targetX: targetX,
      targetY: targetY,
      totalDist: dist,
      traveled: 0,
      alive: true,
    });
  }

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
      const moveDist = Math.sqrt(p.vx * p.vx + p.vy * p.vy) * dt;
      p.traveled += moveDist;
      p.sprite.setPosition(p.x, p.y);
      p.sprite.rotation += 5 * dt;

      // Depth scaling: starts small (8px at boss), grows to 28px at drone
      const progress = Math.min(1, p.traveled / p.totalDist);
      const size = Phaser.Math.Linear(8, 28, progress);
      p.sprite.setDisplaySize(size, size);

      // Out of bounds
      if (p.x < -30 || p.x > W + 30 || p.y < -30 || p.y > H + 30) {
        this._projectileBreakEffect(p.x, p.y);
        p.alive = false;
        continue;
      }

      // Hit drone/crosshair
      if (this.droneInvulnTimer <= 0) {
        const dist = Phaser.Math.Distance.Between(p.x, p.y, this.droneX, this.droneY);
        if (dist < 28) {
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

  // ── Ambient dust particles ──
  _spawnAmbientDust() {
    for (let i = 0; i < 12; i++) {
      const px = 150 + Math.random() * (W - 300);
      const py = ROOM_BACK_Y + 20 + Math.random() * (ARMCHAIR_Y - ROOM_BACK_Y - 20);
      const size = 1.5 + Math.random() * 3;
      const alpha = 0.06 + Math.random() * 0.12;
      const particle = this.add.circle(px, py, size, 0xaaa898, alpha).setDepth(8);
      const driftVx = (Math.random() - 0.5) * 12;
      const driftVy = -3 - Math.random() * 6;
      this.ambientDustParticles.push({ sprite: particle, x: px, y: py, vx: driftVx, vy: driftVy });
    }
  }

  _updateAmbientDust(dt) {
    for (const d of this.ambientDustParticles) {
      d.x += d.vx * dt;
      d.y += d.vy * dt;
      if (d.y < ROOM_BACK_Y) {
        d.y = ARMCHAIR_Y - 10;
        d.x = 150 + Math.random() * (W - 300);
      }
      if (d.x < 140) d.x = W - 160;
      if (d.x > W - 140) d.x = 160;
      d.sprite.setPosition(d.x, d.y);
    }
  }

  // ── Falling rubble particles from ceiling ──
  _spawnFallingRubble() {
    this.fallingRubble = [];
    for (let i = 0; i < 6; i++) {
      const px = 160 + Math.random() * (W - 320);
      const py = ROOM_BACK_Y + Math.random() * 20;
      const size = 2 + Math.random() * 4;
      const particle = this.add.rectangle(px, py, size, size * 0.6, 0x8a7a60, 0.3).setDepth(8);
      this.fallingRubble.push({
        sprite: particle, x: px, y: py,
        vy: 8 + Math.random() * 12,
        vx: (Math.random() - 0.5) * 4,
        rotation: Math.random() * 0.1,
      });
    }
  }

  _updateFallingRubble(dt) {
    for (const r of this.fallingRubble) {
      r.x += r.vx * dt;
      r.y += r.vy * dt;
      r.sprite.rotation += r.rotation * dt;
      r.sprite.setPosition(r.x, r.y);
      // Reset when below visible area
      if (r.y > H - 20) {
        r.y = ROOM_BACK_Y + Math.random() * 10;
        r.x = 160 + Math.random() * (W - 320);
      }
    }
  }

  // ── Fury red particles ──
  _updateFuryParticles(dt) {
    if (!this.bossFury || this.bossDefeated) return;

    this.furySpawnTimer -= dt;
    if (this.furySpawnTimer <= 0) {
      this.furySpawnTimer = 0.08 + Math.random() * 0.06;
      const px = this.bossX + (Math.random() - 0.5) * 60;
      const py = this.bossY + (Math.random() - 0.5) * 50;
      const size = 1 + Math.random() * 2.5;
      const redShade = Math.floor(180 + Math.random() * 75);
      const color = Phaser.Display.Color.GetColor(redShade, 10 + Math.floor(Math.random() * 30), 0);
      const particle = this.add.circle(px, py, size, color, 0.6 + Math.random() * 0.3).setDepth(11);
      this.tweens.add({
        targets: particle,
        y: py - 30 - Math.random() * 20,
        alpha: 0,
        duration: 500 + Math.random() * 400,
        onComplete: () => particle.destroy(),
      });
    }
  }

  // ── Boss damage visual effects ──
  _bossDamageEffects() {
    const flash = this.add.rectangle(W / 2, H / 2, W, H, 0xffffff, 0.12).setDepth(45).setScrollFactor(0);
    this.tweens.add({ targets: flash, alpha: 0, duration: 150, onComplete: () => flash.destroy() });

    for (let i = 0; i < 8; i++) {
      const px = this.bossX + (Math.random() - 0.5) * 50;
      const py = this.bossY + (Math.random() - 0.5) * 50;
      const size = 1.5 + Math.random() * 3;
      const colors = [0x8a7a6a, 0x6a5a4a, 0xa09080, 0x5a4a3a];
      const color = colors[Math.floor(Math.random() * colors.length)];
      const debris = this.add.circle(px, py, size, color, 0.9).setDepth(22);
      const vx = (Math.random() - 0.5) * 120;
      const vy = -20 - Math.random() * 80;
      this.tweens.add({
        targets: debris,
        x: px + vx * 0.5,
        y: py + vy * 0.5,
        alpha: 0,
        duration: 350 + Math.random() * 250,
        onComplete: () => debris.destroy(),
      });
    }
  }


  // ── Drone combat (Z = shoot, X = missile) — front-facing perspective ──
  // Bullets go INTO the room (start big, shrink as they travel toward boss)
  _updateDroneCombat(dt) {
    this.droneShootTimer -= dt;
    this.droneMissileTimer -= dt;
    if (this.droneInvulnTimer > 0) {
      this.droneInvulnTimer -= dt;
      // Blink crosshair during invulnerability
      if (this.droneSprite) {
        this.droneSprite.setAlpha(Math.sin(this.droneInvulnTimer * 20) > 0 ? 1 : 0.3);
      }
    } else {
      if (this.droneSprite) this.droneSprite.setAlpha(1);
    }

    // Z = shoot bullet
    if (this.keys.z.isDown && this.droneShootTimer <= 0) {
      this.droneShootTimer = DRONE_SHOOT_COOLDOWN;
      this._droneShootBullet();
    }

    // X = missile (heavier cooldown, heavy damage)
    if (Phaser.Input.Keyboard.JustDown(this.keys.x) && this.droneMissileTimer <= 0) {
      this.droneMissileTimer = DRONE_MISSILE_COOLDOWN;
      this._droneShootMissile();
    }

    // Update drone bullets (traveling into room with shrink effect)
    for (let i = this.droneBullets.length - 1; i >= 0; i--) {
      const b = this.droneBullets[i];
      if (!b.alive) {
        if (b.sprite) b.sprite.destroy();
        this.droneBullets.splice(i, 1);
        continue;
      }

      b.x += b.vx * dt;
      b.y += b.vy * dt;
      const moveDist = Math.sqrt(b.vx * b.vx + b.vy * b.vy) * dt;
      b.traveled += moveDist;
      b.sprite.setPosition(b.x, b.y);

      // Depth scaling: starts large (10px), shrinks to 4px as it travels into room
      const progress = Math.min(1, b.traveled / b.totalDist);
      const size = Phaser.Math.Linear(10, 4, progress);
      b.sprite.setDisplaySize(size, size);
      // Also reduce alpha slightly for depth feeling
      b.sprite.setAlpha(Phaser.Math.Linear(1, 0.6, progress));

      // Out of bounds (past back wall)
      if (b.y < ROOM_BACK_Y - 10 || b.x < 100 || b.x > W - 100) {
        b.alive = false;
        continue;
      }

      // Hit boss
      if (this.bossActive && !this.bossDefeated) {
        const dist = Phaser.Math.Distance.Between(b.x, b.y, this.bossX, this.bossY);
        const hitRadius = this.bossCoverState === 'behind_cover' ? BOSS_DISPLAY * 0.2 : BOSS_DISPLAY / 2.5;
        if (dist < hitRadius) {
          b.alive = false;
          if (this.bossCoverState === 'behind_cover') {
            // Bullet hits armchair — visual spark, no damage to boss
            const spark = this.add.circle(b.x, b.y, 4, 0xffcc00, 0.9).setDepth(25);
            this.tweens.add({ targets: spark, alpha: 0, scaleX: 2, scaleY: 2, duration: 200, onComplete: () => spark.destroy() });
          } else {
            this._damageBoss(b.damage);
          }
        }
      }

      // Hit armchair (indestructible — absorbs shots with spark effect)
      if (b.alive && this.armchairSprite) {
        if (b.y > ARMCHAIR_Y - 45 && b.y < ARMCHAIR_Y + 50 && Math.abs(b.x - ARMCHAIR_X) < 80) {
          b.alive = false;
          const spark = this.add.circle(b.x, b.y, 4, 0xffcc00, 0.9).setDepth(25);
          this.tweens.add({ targets: spark, alpha: 0, scaleX: 2, scaleY: 2, duration: 200, onComplete: () => spark.destroy() });
        }
      }
    }

    // Update drone missiles (homing, travel into room)
    for (let i = this.droneMissiles.length - 1; i >= 0; i--) {
      const m = this.droneMissiles[i];
      if (!m.alive) {
        if (m.sprite) m.sprite.destroy();
        if (m.trail) m.trail.destroy();
        this.droneMissiles.splice(i, 1);
        continue;
      }

      // Missiles home toward boss
      if (this.bossActive && !this.bossDefeated && this.bossSprite) {
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
      const moveDist = Math.sqrt(m.vx * m.vx + m.vy * m.vy) * dt;
      m.traveled += moveDist;
      m.sprite.setPosition(m.x, m.y);
      m.sprite.rotation = Math.atan2(m.vy, m.vx) - Math.PI / 2;

      // Depth scaling for missile (starts 16px, shrinks to 8px)
      const progress = Math.min(1, m.traveled / m.totalDist);
      const size = Phaser.Math.Linear(16, 8, progress);
      m.sprite.setDisplaySize(size, size);

      // Trail effect
      if (m.trail) {
        m.trail.setPosition(m.x, m.y + 6);
        m.trail.setScale(Phaser.Math.Linear(1, 0.4, progress));
      }

      // Out of bounds
      if (m.x < 80 || m.x > W - 80 || m.y < ROOM_BACK_Y - 20 || m.y > H + 20) {
        m.alive = false;
        continue;
      }

      // Hit boss
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

      // Missiles hit armchair (indestructible — absorbs with explosion)
      if (m.alive && this.armchairSprite) {
        if (m.y > ARMCHAIR_Y - 48 && m.y < ARMCHAIR_Y + 55 && Math.abs(m.x - ARMCHAIR_X) < 85) {
          m.alive = false;
          SoundManager.get().playExplosion();
          const blast = this.add.circle(m.x, m.y, 10, 0xff4400, 0.8).setDepth(22);
          this.tweens.add({
            targets: blast, scaleX: 3, scaleY: 3, alpha: 0, duration: 400,
            onComplete: () => blast.destroy(),
          });
        }
      }
    }
  }

  _droneShootBullet() {
    // Bullet fires from crosshair position INTO the room (toward boss)
    // Calculate direction toward the boss area (or straight into room if boss dead)
    const startX = this.droneX;
    const startY = this.droneY;
    // Aim toward center back of room, influenced by crosshair position
    const targetY = ROOM_BACK_Y + 20;
    // The bullet converges toward center as it travels into the room
    const targetX = Phaser.Math.Linear(startX, W / 2, 0.3);

    const dx = targetX - startX;
    const dy = targetY - startY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    const bullet = this.add.image(startX, startY, 'drone_bullet').setDepth(19);
    bullet.setDisplaySize(10, 10);
    this.droneBullets.push({
      sprite: bullet,
      x: startX,
      y: startY,
      vx: (dx / dist) * DRONE_BULLET_SPEED,
      vy: (dy / dist) * DRONE_BULLET_SPEED,
      totalDist: dist,
      traveled: 0,
      damage: BOSS_BULLET_DMG,
      alive: true,
    });
  }

  _droneShootMissile() {
    SoundManager.get().playBossLaser();
    const startX = this.droneX;
    const startY = this.droneY;

    const missile = this.add.image(startX, startY, 'drone_missile').setDepth(19);
    missile.setDisplaySize(16, 16);

    // Trail glow
    const trail = this.add.circle(startX, startY, 4, 0xff8800, 0.5).setDepth(18);

    // Initial velocity into the room (upward)
    const targetY = ROOM_BACK_Y + 40;
    const totalDist = Math.abs(startY - targetY);

    this.droneMissiles.push({
      sprite: missile,
      trail: trail,
      x: startX,
      y: startY,
      vx: 0,
      vy: -DRONE_MISSILE_SPEED,
      totalDist: totalDist,
      traveled: 0,
      damage: BOSS_MISSILE_DMG,
      alive: true,
    });
  }

  _damageBoss(amount) {
    if (this.bossDefeated) return;
    this.bossHP -= amount;
    SoundManager.get().playBossHit();

    // Flash boss white
    if (this.bossSprite) {
      this.tweens.add({
        targets: this.bossSprite,
        alpha: 0.4,
        duration: 80,
        yoyo: true,
      });
    }

    // Screen flash + debris particles around hit point
    this._bossDamageEffects();

    // Damage number popup
    const dmgText = this.add.text(this.bossX + (Math.random() - 0.5) * 40, this.bossY - 50, `-${amount}`, {
      fontFamily: 'monospace', fontSize: '16px', color: amount >= 10 ? '#ff4444' : '#ffffff',
      shadow: { offsetX: 0, offsetY: 0, color: '#000000', blur: 3, fill: true },
    }).setOrigin(0.5).setDepth(55);
    this.tweens.add({
      targets: dmgText, y: this.bossY - 90, alpha: 0, duration: 800,
      onComplete: () => dmgText.destroy(),
    });

    this.score += amount * 50;

    // Boss defeated
    if (this.bossHP <= 0) {
      this.bossHP = 0;
      this._updateBossHPBar();
      this._bossDeathAnimation();
    }
  }

  // ── Boss Death Animation ──
  _bossDeathAnimation() {
    this.bossDefeated = true;
    this.bossActive = false;

    // Hide weapon sprite if present (phase 3)
    if (this.bossWeaponSprite) {
      this.bossWeaponSprite.destroy();
      this.bossWeaponSprite = null;
    }

    // Ensure boss is fully visible (in case killed while behind cover)
    if (this.bossSprite) {
      this.bossSprite.setAlpha(1);
      this.bossSprite.setDisplaySize(BOSS_DISPLAY, BOSS_DISPLAY);
    }

    // 1. Boss trembles rapidly (position oscillation)
    const trembleEvent = this.time.addEvent({
      delay: 50,
      repeat: 30,
      callback: () => {
        if (this.bossSprite) {
          this.bossSprite.x = this.bossX + (Math.random() - 0.5) * 10;
          this.bossSprite.y = this.bossY + (Math.random() - 0.5) * 10;
        }
      },
    });

    // 2. Dead expression (spiral eyes) after tremble
    this.time.delayedCall(1500, () => {
      if (this.bossSprite && this.textures.exists('ts_boss4_dead')) {
        this.bossSprite.setTexture('ts_boss4_dead');
        this.bossSprite.setPosition(this.bossX, this.bossY);
      }
    });

    // 3. Falls backward (rotation tween)
    this.time.delayedCall(2000, () => {
      if (this.bossSprite) {
        SoundManager.get().playBossShockwave();
        this.tweens.add({
          targets: this.bossSprite,
          rotation: Math.PI / 2,
          y: this.bossY + 40,
          duration: 800,
          ease: 'Quad.easeIn',
        });
      }
    });

    // 4. Large explosion with particles
    this.time.delayedCall(3000, () => {
      SoundManager.get().playExplosion();
      this.cameras.main.shake(800, 0.04);

      // Multiple explosion circles
      for (let i = 0; i < 12; i++) {
        const ex = this.bossX + (Math.random() - 0.5) * 80;
        const ey = this.bossY + (Math.random() - 0.5) * 80;
        const r = 10 + Math.random() * 25;
        const color = [0xff4400, 0xff8800, 0xffcc00][Math.floor(Math.random() * 3)];
        const fireball = this.add.circle(ex, ey, r, color, 0.9).setDepth(25);
        this.tweens.add({
          targets: fireball,
          scaleX: 2 + Math.random() * 2,
          scaleY: 2 + Math.random() * 2,
          alpha: 0,
          duration: 800 + Math.random() * 600,
          delay: i * 80,
          onComplete: () => fireball.destroy(),
        });
      }

      // Particles
      for (let i = 0; i < 20; i++) {
        const px = this.bossX + (Math.random() - 0.5) * 40;
        const py = this.bossY + (Math.random() - 0.5) * 40;
        const particle = this.add.circle(px, py, 2 + Math.random() * 3, 0xffcc00, 1).setDepth(26);
        const vx = (Math.random() - 0.5) * 300;
        const vy = (Math.random() - 0.5) * 300;
        this.tweens.add({
          targets: particle,
          x: px + vx,
          y: py + vy,
          alpha: 0,
          duration: 600 + Math.random() * 400,
          onComplete: () => particle.destroy(),
        });
      }

      // Hide boss sprite
      if (this.bossSprite) {
        this.bossSprite.setVisible(false);
      }
    });

    // 5. "THE WARDEN ELIMINATED" gold text
    this.time.delayedCall(4000, () => {
      const victoryText = this.add.text(W / 2, H / 2, 'THE WARDEN ELIMINATED', {
        fontFamily: 'monospace', fontSize: '30px', color: '#FFD700',
        shadow: { offsetX: 0, offsetY: 0, color: '#FFD700', blur: 16, fill: true },
      }).setOrigin(0.5).setDepth(55).setScrollFactor(0).setAlpha(0);

      this.tweens.add({
        targets: victoryText,
        alpha: 1,
        duration: 600,
      });

      this.score += 3000;
    });

    // 6. Camera holds briefly, then show victory
    this.time.delayedCall(6500, () => {
      this._cleanupBoss();
      this._showVictory();
    });
  }

  _bossFightEnd(playerWon) {
    // Called when drone dies during boss fight
    if (!playerWon) {
      this.phase = 'dead';
      this.time.delayedCall(1500, () => {
        this._cleanupBoss();
        this._showVictory();
      });
    }
  }

  _updateBossFight(dt) {
    if (this.phase !== 'boss') return;
    if (this.bossDefeated) return; // death animation is running via timed events

    // Dodge cooldown
    if (this.dodgeCooldown > 0) this.dodgeCooldown -= dt;

    // Dodge active — quick lateral dash
    if (this.dodgeActive) {
      this.dodgeTimer -= dt;
      if (this.dodgeTimer <= 0) {
        this.dodgeActive = false;
        if (this.droneSprite) this.droneSprite.setAlpha(1);
      }
    }

    // SHIFT = dodge (quick dash to the side, brief invulnerability) — also accept C for backwards compat
    const dodgePressed = Phaser.Input.Keyboard.JustDown(this.keys.shift) || Phaser.Input.Keyboard.JustDown(this.keys.c);
    if (dodgePressed && this.dodgeCooldown <= 0 && !this.dodgeActive) {
      this.dodgeCooldown = 1.0; // 1s cooldown
      this.dodgeActive = true;
      this.dodgeTimer = 0.25; // 250ms dodge window
      this.droneInvulnTimer = 0.35; // brief invulnerability
      // Dash in the direction the player is pressing, or away from center
      let dashDirX = 0, dashDirY = 0;
      if (this.keys.left.isDown) dashDirX = -1;
      else if (this.keys.right.isDown) dashDirX = 1;
      if (this.keys.up.isDown) dashDirY = -1;
      else if (this.keys.down.isDown) dashDirY = 1;
      // Default: dash away from center horizontally
      if (dashDirX === 0 && dashDirY === 0) {
        dashDirX = (this.droneX < W / 2) ? 1 : -1;
      }
      const dashDist = 130;
      const mag = Math.sqrt(dashDirX * dashDirX + dashDirY * dashDirY) || 1;
      this.droneX = Phaser.Math.Clamp(this.droneX + (dashDirX / mag) * dashDist, 30, W - 30);
      this.droneY = Phaser.Math.Clamp(this.droneY + (dashDirY / mag) * dashDist, 90, H - 30);
      // Visual feedback
      if (this.droneSprite) {
        this.droneSprite.setAlpha(0.4);
        this.droneSprite.setPosition(this.droneX, this.droneY);
      }
      // Dodge trail effect
      const trailX = this.droneX - (dashDirX / mag) * dashDist * 0.5;
      const trailY = this.droneY - (dashDirY / mag) * dashDist * 0.5;
      const trail = this.add.circle(trailX, trailY, 16, 0x00ccff, 0.3).setDepth(24);
      this.tweens.add({ targets: trail, alpha: 0, scaleX: 2, scaleY: 0.3, duration: 300, onComplete: () => trail.destroy() });
      // Sound cue
      SoundManager.get().playStep();
    }

    // Crosshair/drone movement (free movement across screen — represents aiming)
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
    // Crosshair can move across entire screen
    this.droneX = Phaser.Math.Clamp(this.droneX, 30, W - 30);
    this.droneY = Phaser.Math.Clamp(this.droneY, 90, H - 30);
    if (this.droneSprite) this.droneSprite.setPosition(this.droneX, this.droneY);

    // Update dodge cooldown HUD indicator
    if (this.dodgeHudFill) {
      const ready = this.dodgeCooldown <= 0;
      const pct = ready ? 1 : Math.max(0, 1 - (this.dodgeCooldown / 1.0));
      this.dodgeHudFill.setScale(pct, 1);
      this.dodgeHudFill.setFillStyle(ready ? 0x00ccff : 0x555555);
      if (this.dodgeHudLabel) this.dodgeHudLabel.setColor(ready ? '#00ccff' : '#555555');
    }

    // Boss logic
    this._updateBoss(dt);

    // Drone combat
    this._updateDroneCombat(dt);

    // No contact damage in front-facing perspective (boss is inside room, drone is outside)
  }

  _cleanupBoss() {
    // Cleanup all boss fight objects
    if (this.commandBg) { this.commandBg.destroy(); this.commandBg = null; }
    if (this.droneSprite) { this.droneSprite.destroy(); this.droneSprite = null; }
    if (this.bossSprite) { this.bossSprite.destroy(); this.bossSprite = null; }

    // HP bar
    if (this.bossHPBarBg) { this.bossHPBarBg.destroy(); this.bossHPBarBg = null; }
    if (this.bossHPBarFill) { this.bossHPBarFill.destroy(); this.bossHPBarFill = null; }
    if (this.bossHPBarLabel) { this.bossHPBarLabel.destroy(); this.bossHPBarLabel = null; }

    // Projectiles
    for (const p of this.bossProjectiles) { if (p.sprite) p.sprite.destroy(); }
    this.bossProjectiles = [];

    // Cover indicator
    if (this.coverIndicator) { this.coverIndicator.destroy(); this.coverIndicator = null; }

    // Armchair
    if (this.armchairSprite) { this.armchairSprite.destroy(); this.armchairSprite = null; }

    // Phase 3 weapon
    if (this.bossWeaponSprite) { this.bossWeaponSprite.destroy(); this.bossWeaponSprite = null; }

    // Dodge HUD
    if (this.dodgeHudLabel) { this.dodgeHudLabel.destroy(); this.dodgeHudLabel = null; }
    if (this.dodgeHudBg) { this.dodgeHudBg.destroy(); this.dodgeHudBg = null; }
    if (this.dodgeHudFill) { this.dodgeHudFill.destroy(); this.dodgeHudFill = null; }

    // Drone bullets
    for (const b of this.droneBullets) { if (b.sprite) b.sprite.destroy(); }
    this.droneBullets = [];

    // Drone missiles
    for (const m of this.droneMissiles) {
      if (m.sprite) m.sprite.destroy();
      if (m.trail) m.trail.destroy();
    }
    this.droneMissiles = [];

    // Ambient dust
    if (this.ambientDustParticles) {
      for (const d of this.ambientDustParticles) { if (d.sprite) d.sprite.destroy(); }
      this.ambientDustParticles = [];
    }

    // Fury particles (any remaining are cleaned by tweens, but clear array)
    this.furyParticles = [];
  }

  // ═════════════════════════════════════════════════════════════
  // VICTORY / RESULTS
  // ═════════════════════════════════════════════════════════════
  _showVictory() {
    this.phase = 'victory';
    this.instrText.setVisible(false);
    this._stopAmbient();
    MusicManager.get().stop(1);

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
      { label: 'THE WARDEN', value: bossStatus },
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
    if (this.isPaused) return;

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
    this._stopAmbient();
    this.tweens.killAll();
    this.time.removeAllEvents();
  }
}
