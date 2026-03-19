// ═══════════════════════════════════════════════════════════════
// DroneScene — Level 4: Operation Underground
// Front-facing perspective: drone hovers outside destroyed house,
// looking INTO the room. Boss hides behind couch, throws objects.
// Boss: THE WARDEN — fought from drone POV with depth effects
// + Victory/Results overlay
// ═══════════════════════════════════════════════════════════════

import Phaser from 'phaser';
import SoundManager from '../systems/SoundManager.js';
import MusicManager from '../systems/MusicManager.js';
import DifficultyManager from '../systems/DifficultyManager.js';
import {
  createDroneSprite, createDesertTerrain,
  createTunnelWall, createTunnelFloor, createDoorTile, createInterferenceTile,
  createCommandRoom,
} from '../utils/DroneTextures.js';
import { showVictoryScreen, showDefeatScreen } from '../ui/EndScreen.js';
import { showControlsOverlay } from '../ui/ControlsOverlay.js';

const W = 960;
const H = 540;
const TILE = 40;

// Drone constants
const DRONE_SPEED = 160;       // recon phase px/s
const TUNNEL_SPEED = 120;      // tunnel phase px/s
const DRONE_SIZE = 20;         // collision half-size (radius)
const SCAN_RADIUS = 100;       // scanning range in recon
const SPOTLIGHT_RADIUS = 90;   // visibility in tunnels

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
const COUCH_Y = 310;          // couch position in room

// Cover positions (boss can hide behind any of these)
const COVER_POSITIONS = [
  { x: W / 2, y: COUCH_Y, type: 'couch' },
  { x: 250, y: 280, type: 'rubble' },
  { x: 710, y: 250, type: 'column' },
];
const BOSS_AREA_TOP = ROOM_BACK_Y + 30;
const BOSS_AREA_BOTTOM = COUCH_Y - 40; // boss walks above couch
const BOSS_AREA_LEFT = 180;
const BOSS_AREA_RIGHT = W - 180;

// Phase durations
const RECON_TIME = 60;
const TUNNEL_TIME = 90;

// Recon targets (tunnel entrance positions on desert terrain)
const RECON_TARGETS = [
  { x: 200, y: 160 }, { x: 480, y: 280 }, { x: 700, y: 200 },
  { x: 350, y: 420 }, { x: 820, y: 350 },
];

// Tunnel maze (24 columns x 13 rows)
// 0=floor, 1=wall, 2=door, 3=interference zone
const MAZE = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,0,1],
  [1,0,1,0,1,0,1,1,1,0,1,0,1,1,1,0,1,0,1,1,1,1,0,1],
  [1,0,1,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,0,1,0,1],
  [1,0,1,1,1,1,1,0,1,1,1,1,1,0,1,1,1,0,1,1,0,1,0,1],
  [1,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,1],
  [1,1,1,0,1,2,1,1,1,1,1,0,1,1,1,2,1,1,1,0,1,1,1,1],
  [1,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,1],
  [1,0,1,1,1,0,1,1,1,0,1,1,1,1,1,0,1,0,1,1,1,1,0,1],
  [1,0,0,0,0,0,1,3,0,0,0,0,0,3,1,0,1,0,0,0,0,0,0,1],
  [1,1,1,1,1,0,1,1,1,1,1,1,0,1,1,0,1,1,1,1,1,0,1,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
];

const MAZE_W = MAZE[0].length * TILE; // 960
const MAZE_H = MAZE.length * TILE;    // 520

// Tunnel entry/exit positions
const TUNNEL_START = { col: 1, row: 1 };
const TUNNEL_EXIT = { col: 22, row: 11 };

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

function _generateCouchTexture(scene) {
  if (scene.textures.exists('boss_couch')) return;
  const cw = 160, ch = 100;
  const c = document.createElement('canvas');
  c.width = cw; c.height = ch;
  const ctx = c.getContext('2d');

  // Single armchair (sillon) — burgundy/bordeaux tones, well-used, slightly damaged

  const burgundy = '#6a1a2a';
  const burgundyLight = '#8a2a3a';
  const burgundyDark = '#4a1018';
  const burgundyMid = '#7a2030';

  // ── Backrest (taller, rising above seat) ──
  ctx.fillStyle = burgundyDark;
  ctx.beginPath();
  ctx.moveTo(12, 0);
  ctx.lineTo(cw - 12, 0);
  ctx.quadraticCurveTo(cw - 10, 12, cw - 12, 24);
  ctx.lineTo(12, 24);
  ctx.quadraticCurveTo(10, 12, 12, 0);
  ctx.closePath();
  ctx.fill();
  // Backrest padding highlight
  ctx.fillStyle = burgundy;
  ctx.beginPath();
  ctx.moveTo(16, 3);
  ctx.lineTo(cw - 16, 3);
  ctx.quadraticCurveTo(cw - 14, 14, cw - 16, 22);
  ctx.lineTo(16, 22);
  ctx.quadraticCurveTo(14, 14, 16, 3);
  ctx.closePath();
  ctx.fill();
  // Backrest seam lines (fabric detail)
  ctx.strokeStyle = burgundyDark;
  ctx.lineWidth = 0.5;
  ctx.beginPath(); ctx.moveTo(cw / 2, 4); ctx.lineTo(cw / 2, 21); ctx.stroke();
  // Subtle wrinkle lines on backrest
  ctx.strokeStyle = 'rgba(30, 8, 12, 0.25)';
  ctx.lineWidth = 0.4;
  ctx.beginPath(); ctx.moveTo(22, 8); ctx.quadraticCurveTo(28, 12, 24, 18); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cw - 22, 10); ctx.quadraticCurveTo(cw - 28, 14, cw - 24, 19); ctx.stroke();

  // ── Seat cushion (with indentation) ──
  ctx.fillStyle = burgundyMid;
  ctx.fillRect(12, 24, cw - 24, 16);
  // Cushion indentation (darker center)
  ctx.fillStyle = burgundyDark;
  ctx.beginPath();
  ctx.ellipse(cw / 2, 32, 18, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  // Cushion highlight on edges
  ctx.fillStyle = burgundyLight;
  ctx.beginPath();
  ctx.ellipse(cw / 2, 26, 20, 3, 0, Math.PI, 0);
  ctx.fill();
  // Seam line across seat front
  ctx.strokeStyle = burgundyDark;
  ctx.lineWidth = 0.5;
  ctx.beginPath(); ctx.moveTo(14, 38); ctx.lineTo(cw - 14, 38); ctx.stroke();

  // ── Left armrest ──
  ctx.fillStyle = burgundy;
  ctx.beginPath();
  ctx.moveTo(0, 4);
  ctx.quadraticCurveTo(2, 0, 12, 2);
  ctx.lineTo(12, 42);
  ctx.lineTo(4, 44);
  ctx.quadraticCurveTo(0, 44, 0, 40);
  ctx.closePath();
  ctx.fill();
  // Armrest top highlight
  ctx.fillStyle = burgundyLight;
  ctx.beginPath();
  ctx.moveTo(2, 6); ctx.lineTo(10, 4); ctx.lineTo(10, 8); ctx.lineTo(2, 10); ctx.closePath();
  ctx.fill();
  // Armrest side shadow
  ctx.fillStyle = burgundyDark;
  ctx.fillRect(0, 36, 10, 6);

  // ── Right armrest ──
  ctx.fillStyle = burgundy;
  ctx.beginPath();
  ctx.moveTo(cw, 4);
  ctx.quadraticCurveTo(cw - 2, 0, cw - 12, 2);
  ctx.lineTo(cw - 12, 42);
  ctx.lineTo(cw - 4, 44);
  ctx.quadraticCurveTo(cw, 44, cw, 40);
  ctx.closePath();
  ctx.fill();
  // Right armrest top highlight
  ctx.fillStyle = burgundyLight;
  ctx.beginPath();
  ctx.moveTo(cw - 2, 6); ctx.lineTo(cw - 10, 4); ctx.lineTo(cw - 10, 8); ctx.lineTo(cw - 2, 10); ctx.closePath();
  ctx.fill();
  // Armrest side shadow
  ctx.fillStyle = burgundyDark;
  ctx.fillRect(cw - 10, 36, 10, 6);

  // ── Front skirt / base ──
  ctx.fillStyle = burgundyDark;
  ctx.fillRect(6, 40, cw - 12, 8);

  // ── Short legs ──
  ctx.fillStyle = '#2a0a0e';
  ctx.fillRect(8, 48, 6, 10);
  ctx.fillRect(cw - 14, 48, 6, 10);

  // ── Wear and tear details ──
  // Small tear on left side of seat
  ctx.strokeStyle = '#2a0808';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(18, 30); ctx.lineTo(22, 34); ctx.lineTo(19, 37);
  ctx.stroke();
  // Lighter thread showing through tear
  ctx.strokeStyle = '#c0a080';
  ctx.lineWidth = 0.3;
  ctx.beginPath();
  ctx.moveTo(19, 31); ctx.lineTo(21, 33); ctx.stroke();

  // Stain mark (circular darker patch)
  ctx.fillStyle = 'rgba(30, 8, 12, 0.25)';
  ctx.beginPath();
  ctx.ellipse(52, 33, 6, 4, 0.2, 0, Math.PI * 2);
  ctx.fill();

  // Dust marks (lighter spots)
  ctx.fillStyle = 'rgba(140, 120, 100, 0.12)';
  ctx.fillRect(30, 5, 4, 3);
  ctx.fillRect(55, 26, 3, 2);
  ctx.fillRect(15, 42, 5, 2);

  // Fabric texture (subtle dots)
  ctx.fillStyle = 'rgba(40, 10, 18, 0.1)';
  for (let i = 0; i < 30; i++) {
    ctx.fillRect(
      8 + Math.random() * (cw - 16),
      2 + Math.random() * (ch - 14),
      1, 1
    );
  }

  // Shadow under armchair
  ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
  ctx.fillRect(6, ch - 4, cw - 12, 4);

  scene.textures.addCanvas('boss_couch', c);
}

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

function _generateRubbleTexture(scene) {
  if (scene.textures.exists('cover_rubble')) return;
  const cw = 60, ch = 50;
  const c = document.createElement('canvas');
  c.width = cw; c.height = ch;
  const ctx = c.getContext('2d');

  // Pile of broken bricks / rubble
  const brickColors = ['#8a5a3a', '#9a6a4a', '#7a4a2a', '#6a4020'];
  // Base rubble pile shape
  ctx.fillStyle = '#5a3a1a';
  ctx.beginPath();
  ctx.moveTo(5, ch);
  ctx.lineTo(10, ch - 25);
  ctx.lineTo(20, ch - 40);
  ctx.lineTo(35, ch - 45);
  ctx.lineTo(50, ch - 38);
  ctx.lineTo(55, ch - 20);
  ctx.lineTo(cw - 2, ch);
  ctx.closePath();
  ctx.fill();

  // Individual bricks scattered on pile
  for (let i = 0; i < 10; i++) {
    const bx = 8 + Math.random() * (cw - 24);
    const by = ch - 10 - Math.random() * 35;
    const bw = 8 + Math.random() * 10;
    const bh = 5 + Math.random() * 6;
    const rot = (Math.random() - 0.5) * 0.6;
    ctx.save();
    ctx.translate(bx + bw / 2, by + bh / 2);
    ctx.rotate(rot);
    ctx.fillStyle = brickColors[Math.floor(Math.random() * brickColors.length)];
    ctx.fillRect(-bw / 2, -bh / 2, bw, bh);
    // Mortar line
    ctx.strokeStyle = '#c0a880';
    ctx.lineWidth = 0.5;
    ctx.strokeRect(-bw / 2, -bh / 2, bw, bh);
    ctx.restore();
  }

  // Dust / texture
  ctx.fillStyle = 'rgba(100, 80, 60, 0.15)';
  for (let i = 0; i < 20; i++) {
    ctx.fillRect(5 + Math.random() * (cw - 10), ch - 5 - Math.random() * 40, 1, 1);
  }

  // Shadow at base
  ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
  ctx.fillRect(3, ch - 4, cw - 6, 4);

  scene.textures.addCanvas('cover_rubble', c);
}

function _generateColumnTexture(scene) {
  if (scene.textures.exists('cover_column')) return;
  const cw = 40, ch = 70;
  const c = document.createElement('canvas');
  c.width = cw; c.height = ch;
  const ctx = c.getContext('2d');

  // Gray concrete column (cylinder-ish)
  // Main body
  const grad = ctx.createLinearGradient(0, 0, cw, 0);
  grad.addColorStop(0, '#606060');
  grad.addColorStop(0.3, '#909090');
  grad.addColorStop(0.5, '#a0a0a0');
  grad.addColorStop(0.7, '#909090');
  grad.addColorStop(1, '#606060');
  ctx.fillStyle = grad;
  ctx.fillRect(6, 5, cw - 12, ch - 10);

  // Top cap
  ctx.fillStyle = '#888888';
  ctx.beginPath();
  ctx.ellipse(cw / 2, 6, (cw - 12) / 2, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#555555';
  ctx.lineWidth = 0.5;
  ctx.stroke();

  // Bottom base (wider)
  ctx.fillStyle = '#707070';
  ctx.fillRect(3, ch - 10, cw - 6, 8);
  ctx.strokeStyle = '#555555';
  ctx.lineWidth = 0.5;
  ctx.strokeRect(3, ch - 10, cw - 6, 8);

  // Cracks and damage
  ctx.strokeStyle = '#484848';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(12, 15);
  ctx.lineTo(16, 30);
  ctx.lineTo(14, 42);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(cw - 14, 25);
  ctx.lineTo(cw - 18, 38);
  ctx.stroke();

  // Rebar sticking out (damaged concrete)
  ctx.strokeStyle = '#8a5a30';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cw - 10, 10);
  ctx.lineTo(cw - 4, 5);
  ctx.stroke();

  // Dust/texture
  ctx.fillStyle = 'rgba(80, 80, 80, 0.1)';
  for (let i = 0; i < 15; i++) {
    ctx.fillRect(8 + Math.random() * (cw - 16), 8 + Math.random() * (ch - 18), 1, 1);
  }

  // Shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
  ctx.fillRect(5, ch - 3, cw - 10, 3);

  scene.textures.addCanvas('cover_column', c);
}

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
    showControlsOverlay(this, 'ARROWS: Move | SPACE: Shoot | X: Missile | ESC: Pause');

    // Generate textures
    createDroneSprite(this);
    createDesertTerrain(this);
    createTunnelWall(this);
    createTunnelFloor(this);
    createDoorTile(this);
    createInterferenceTile(this);
    createCommandRoom(this);

    // Boss textures (generated inline)
    _generateBossTexture(this, 'ts_boss4_normal', 'normal');
    _generateBossTexture(this, 'ts_boss4_angry', 'angry');
    _generateBossTexture(this, 'ts_boss4_furious', 'furious');
    _generateBossTexture(this, 'ts_boss4_dead', 'dead');
    _generateBossProjectileTextures(this);
    _generateDroneBulletTexture(this);
    _generateDroneMissileTexture(this);
    _generateCouchTexture(this);
    _generateCrosshairTexture(this);
    _generateRubbleTexture(this);
    _generateColumnTexture(this);
    _generatePipeWeaponTexture(this);

    // ── Game state ──
    this.phase = 'transition';
    this.phaseTimer = 0;
    this.droneX = W / 2;
    this.droneY = H / 2;
    this.droneHP = dm.isHard() ? 2 : 3;
    this.droneMaxHP = this.droneHP;
    this.score = 0;

    // Recon/tunnel stats (skipped — set defaults for scoring)
    this.targetsFound = 5;
    this.targetMarkers = [];
    this.scanCooldown = 0;
    this.scanActive = false;
    this.scanTimer = 0;
    this.reconTargetStates = RECON_TARGETS.map(t => ({ ...t, found: true }));

    this.doorsOpened = 2;
    this.totalDoors = 2;
    this.interferenceTimer = 0;
    this.interferenceActive = false;

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

    let timeLeft;
    if (this.phase === 'city') {
      this.hudPhase.setText('CITY RECON');
      this.hudObjective.setText('FIND THE GLOWING WINDOW');
      this.hudTimer.setText('');
      return;
    } else if (this.phase === 'recon') {
      timeLeft = Math.max(0, Math.ceil(RECON_TIME * this.dm.timerMult() - this.phaseTimer));
      this.hudPhase.setText('RECON PHASE');
      this.hudObjective.setText(`TARGETS: ${this.targetsFound}/${RECON_TARGETS.length}`);
    } else if (this.phase === 'tunnel') {
      timeLeft = Math.max(0, Math.ceil(TUNNEL_TIME * this.dm.timerMult() - this.phaseTimer));
      this.hudPhase.setText('TUNNEL PHASE');
      this.hudObjective.setText('NAVIGATE TO EXIT');
    } else if (this.phase === 'boss') {
      this.hudPhase.setText('HIDEOUT');
      this.hudObjective.setText('ELIMINATE THE WARDEN');
      this.hudTimer.setText('');
      return;
    } else {
      return;
    }
    this.hudTimer.setText(`TIME: ${timeLeft}s`);
    this.hudTimer.setColor(timeLeft <= 10 ? '#ff4444' : '#FFD700');
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
  // PHASE 1 — AERIAL RECONNAISSANCE (60s)
  // ═════════════════════════════════════════════════════════════
  _startRecon() {
    this.phase = 'recon';
    this.phaseTimer = 0;
    this.droneX = W / 2;
    this.droneY = H / 2;

    // Desert terrain background
    this.reconBg = this.add.image(W / 2, H / 2, 'desert_terrain').setDepth(0);

    // Drone sprite
    this.droneSprite = this.add.image(this.droneX, this.droneY, 'drone_top').setDepth(20);

    // Scan ring (hidden, shown on SPACE)
    this.scanRing = this.add.circle(this.droneX, this.droneY, SCAN_RADIUS, 0x00e5ff, 0).setDepth(18);
    this.scanRing.setStrokeStyle(2, 0x00e5ff, 0);

    // Target indicators (hidden markers on map)
    this.targetSprites = [];
    for (const t of this.reconTargetStates) {
      const marker = this.add.circle(t.x, t.y, 6, 0xff4444, 0).setDepth(15);
      marker.setStrokeStyle(2, 0xff4444, 0);
      this.targetSprites.push(marker);
    }

    // Enemies (patrol dots)
    this.patrols = [];
    for (let i = 0; i < 4; i++) {
      const px = 100 + Math.random() * (W - 200);
      const py = 100 + Math.random() * (H - 200);
      const p = this.add.circle(px, py, 5, 0xff4444, 0.6).setDepth(10);
      this.patrols.push({
        sprite: p, x: px, y: py,
        vx: (Math.random() - 0.5) * 60 * this.dm.enemySpeedMult(),
        vy: (Math.random() - 0.5) * 60 * this.dm.enemySpeedMult(),
        alertRange: 80,
      });
    }

    this.instrText.setText('ARROWS to fly — SPACE to scan — Find tunnel entrances');
    this.instrText.setColor('#888888');

    this.ambientRef = SoundManager.get().playDroneHum();
  }

  _updateRecon(dt) {
    this.phaseTimer += dt;

    // Movement
    let dx = 0, dy = 0;
    if (this.keys.left.isDown) dx -= 1;
    if (this.keys.right.isDown) dx += 1;
    if (this.keys.up.isDown) dy -= 1;
    if (this.keys.down.isDown) dy += 1;
    if (dx || dy) {
      const len = Math.sqrt(dx * dx + dy * dy);
      this.droneX += (dx / len) * DRONE_SPEED * dt;
      this.droneY += (dy / len) * DRONE_SPEED * dt;
    }
    this.droneX = Phaser.Math.Clamp(this.droneX, 30, W - 30);
    this.droneY = Phaser.Math.Clamp(this.droneY, 30, H - 30);
    this.droneSprite.setPosition(this.droneX, this.droneY);

    // Scan cooldown
    if (this.scanCooldown > 0) this.scanCooldown -= dt;

    // SPACE to scan
    if (Phaser.Input.Keyboard.JustDown(this.keys.space) && this.scanCooldown <= 0) {
      this.scanActive = true;
      this.scanTimer = 0.8;
      this.scanCooldown = 2;
      SoundManager.get().playDroneScan();

      // Show scan ring
      this.scanRing.setPosition(this.droneX, this.droneY);
      this.scanRing.setStrokeStyle(2, 0x00e5ff, 0.6);
      this.tweens.add({
        targets: this.scanRing,
        scaleX: 1.5, scaleY: 1.5,
        duration: 800,
        ease: 'Quad.easeOut',
        onComplete: () => {
          if (this.scanRing) {
            this.scanRing.setScale(1);
            this.scanRing.setStrokeStyle(2, 0x00e5ff, 0);
          }
        },
      });

      // Check targets in range
      for (let i = 0; i < this.reconTargetStates.length; i++) {
        if (this.reconTargetStates[i].found) continue;
        const t = this.reconTargetStates[i];
        const dist = Phaser.Math.Distance.Between(this.droneX, this.droneY, t.x, t.y);
        if (dist <= SCAN_RADIUS * 1.3) {
          this.reconTargetStates[i].found = true;
          this.targetsFound++;
          SoundManager.get().playDroneScanComplete();

          // Reveal target
          this.targetSprites[i].setFillStyle(0x00ff00, 0.5);
          this.targetSprites[i].setStrokeStyle(2, 0x00ff00, 0.8);

          // Score text
          const pts = this.add.text(t.x, t.y - 20, 'TUNNEL FOUND +200', {
            fontFamily: 'monospace', fontSize: '10px', color: '#00ff00',
          }).setOrigin(0.5).setDepth(25);
          this.tweens.add({
            targets: pts, y: t.y - 50, alpha: 0, duration: 1200,
            onComplete: () => pts.destroy(),
          });
          this.score += 200;
        }
      }
    }

    // Update patrols
    for (const p of this.patrols) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.x < 40 || p.x > W - 40) p.vx *= -1;
      if (p.y < 40 || p.y > H - 40) p.vy *= -1;
      p.x = Phaser.Math.Clamp(p.x, 40, W - 40);
      p.y = Phaser.Math.Clamp(p.y, 40, H - 40);
      p.sprite.setPosition(p.x, p.y);

      // Alert detection
      const dist = Phaser.Math.Distance.Between(this.droneX, this.droneY, p.x, p.y);
      if (dist < p.alertRange) {
        // Fire at drone
        p.alertRange = 120; // gets more alert — wider detection
        if (Math.random() < 0.5 * dt) {
          this._takeDamage();
        }
        p.sprite.setFillStyle(0xff0000, 0.9);
      } else {
        p.sprite.setFillStyle(0xff4444, 0.6);
      }
    }

    // Time up or all targets found -> transition
    if (this.phaseTimer >= RECON_TIME * this.dm.timerMult() || this.targetsFound >= RECON_TARGETS.length) {
      this._stopAmbient();
      this._cleanupRecon();
      this._startTunnelTransition();
    }
  }

  _cleanupRecon() {
    // Kill all tweens first to prevent onComplete callbacks on destroyed objects
    this.tweens.killAll();
    if (this.reconBg) { this.reconBg.destroy(); this.reconBg = null; }
    if (this.scanRing) { this.scanRing.destroy(); this.scanRing = null; }
    for (const s of this.targetSprites) s.destroy();
    this.targetSprites = [];
    for (const p of this.patrols) p.sprite.destroy();
    this.patrols = [];
    if (this.droneSprite) { this.droneSprite.destroy(); this.droneSprite = null; }
  }

  _startTunnelTransition() {
    // Brief text overlay
    this.phase = 'transition';
    const overlay = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.9).setDepth(40);
    const txt = this.add.text(W / 2, H / 2 - 20, 'ENTERING TUNNEL NETWORK...', {
      fontFamily: 'monospace', fontSize: '20px', color: '#00e5ff',
      shadow: { offsetX: 0, offsetY: 0, color: '#00e5ff', blur: 10, fill: true },
    }).setOrigin(0.5).setDepth(41);

    const found = this.add.text(W / 2, H / 2 + 20, `${this.targetsFound}/${RECON_TARGETS.length} TUNNELS MAPPED`, {
      fontFamily: 'monospace', fontSize: '14px', color: '#ffffff',
    }).setOrigin(0.5).setDepth(41);

    this.time.delayedCall(2500, () => {
      overlay.destroy();
      txt.destroy();
      found.destroy();
      this._startTunnel();
    });
  }

  // ═════════════════════════════════════════════════════════════
  // PHASE 2 — TUNNEL NAVIGATION (90s)
  // ═════════════════════════════════════════════════════════════
  _startTunnel() {
    this.phase = 'tunnel';
    MusicManager.get().playLevel4Music('tunnel');
    this.phaseTimer = 0;

    // Count doors
    this.totalDoors = 0;
    this.doorsOpened = 0;
    for (let r = 0; r < MAZE.length; r++) {
      for (let c = 0; c < MAZE[0].length; c++) {
        if (MAZE[r][c] === 2) this.totalDoors++;
      }
    }

    // Working copy of maze (for door opening)
    this.mazeCopy = MAZE.map(row => [...row]);

    // Draw maze tiles
    this.mazeTiles = [];
    for (let r = 0; r < MAZE.length; r++) {
      for (let c = 0; c < MAZE[0].length; c++) {
        const x = c * TILE + TILE / 2;
        const y = r * TILE + TILE / 2;
        let tex;
        switch (MAZE[r][c]) {
          case 1: tex = 'tunnel_wall'; break;
          case 2: tex = 'tunnel_door'; break;
          case 3: tex = 'tunnel_interference'; break;
          default: tex = 'tunnel_floor'; break;
        }
        const tile = this.add.image(x, y, tex).setDepth(0);
        this.mazeTiles.push(tile);
      }
    }

    // Drone start
    this.droneX = TUNNEL_START.col * TILE + TILE / 2;
    this.droneY = TUNNEL_START.row * TILE + TILE / 2;
    this.droneSprite = this.add.image(this.droneX, this.droneY, 'drone_top').setDepth(20);

    // Exit marker
    const exitX = TUNNEL_EXIT.col * TILE + TILE / 2;
    const exitY = TUNNEL_EXIT.row * TILE + TILE / 2;
    this.exitMarker = this.add.circle(exitX, exitY, 18, 0x00ff00, 0.5).setDepth(5);
    this.exitMarker.setStrokeStyle(3, 0x00ff00, 0.8);
    this.tweens.add({
      targets: this.exitMarker, alpha: 0.2, duration: 800, yoyo: true, repeat: -1,
    });

    // Darkness overlay (canvas-based)
    this.darknessCanvas = document.createElement('canvas');
    this.darknessCanvas.width = W;
    this.darknessCanvas.height = H;
    this.darknessTexKey = 'darkness_overlay_' + Date.now();
    this.textures.addCanvas(this.darknessTexKey, this.darknessCanvas);
    this.darknessSprite = this.add.image(W / 2, H / 2, this.darknessTexKey).setDepth(30);

    this.instrText.setText('ARROWS to navigate — SPACE at doors to open — Reach EXIT');
    this.instrText.setColor('#888888');

    this.ambientRef = SoundManager.get().playDroneHum();
  }

  _updateTunnel(dt) {
    this.phaseTimer += dt;

    // Movement with wall collision
    let dx = 0, dy = 0;
    if (this.keys.left.isDown) dx -= 1;
    if (this.keys.right.isDown) dx += 1;
    if (this.keys.up.isDown) dy -= 1;
    if (this.keys.down.isDown) dy += 1;

    if (dx || dy) {
      const len = Math.sqrt(dx * dx + dy * dy);
      const moveX = (dx / len) * TUNNEL_SPEED * dt;
      const moveY = (dy / len) * TUNNEL_SPEED * dt;

      // Try X movement
      const newX = this.droneX + moveX;
      if (!this._checkWallCollision(newX, this.droneY)) {
        this.droneX = newX;
      }
      // Try Y movement
      const newY = this.droneY + moveY;
      if (!this._checkWallCollision(this.droneX, newY)) {
        this.droneY = newY;
      }
    }

    this.droneX = Phaser.Math.Clamp(this.droneX, DRONE_SIZE, MAZE_W - DRONE_SIZE);
    this.droneY = Phaser.Math.Clamp(this.droneY, DRONE_SIZE, MAZE_H - DRONE_SIZE);
    this.droneSprite.setPosition(this.droneX, this.droneY);

    // Door interaction
    if (Phaser.Input.Keyboard.JustDown(this.keys.space)) {
      this._tryOpenDoor();
    }

    // Check interference zones
    const col = Math.floor(this.droneX / TILE);
    const row = Math.floor(this.droneY / TILE);
    if (row >= 0 && row < MAZE.length && col >= 0 && col < MAZE[0].length) {
      if (this.mazeCopy[row][col] === 3) {
        if (!this.interferenceActive) {
          this.interferenceActive = true;
          SoundManager.get().playInterference();
          this.instrText.setText('INTERFERENCE — SIGNAL DEGRADING!');
          this.instrText.setColor('#ff4444');
        }
        this.interferenceTimer += dt;
        if (this.interferenceTimer > 3) {
          this._takeDamage();
          this.interferenceTimer = 0;
        }
      } else {
        if (this.interferenceActive) {
          this.interferenceActive = false;
          this.interferenceTimer = 0;
          this.instrText.setText('ARROWS to navigate — SPACE at doors — Reach EXIT');
          this.instrText.setColor('#888888');
        }
      }
    }

    // Update darkness overlay
    this._updateDarkness();

    // Check exit reached
    const exitX = TUNNEL_EXIT.col * TILE + TILE / 2;
    const exitY = TUNNEL_EXIT.row * TILE + TILE / 2;
    const distToExit = Phaser.Math.Distance.Between(this.droneX, this.droneY, exitX, exitY);
    if (distToExit < 25) {
      this._stopAmbient();
      this._cleanupTunnel();
      this._startBossTransition();
    }

    // Time up
    if (this.phaseTimer >= TUNNEL_TIME * this.dm.timerMult()) {
      this._stopAmbient();
      this._cleanupTunnel();
      this.phase = 'dead';
      this.time.delayedCall(500, () => this._showVictory());
    }
  }

  _checkWallCollision(x, y) {
    // Check 4 corners of drone bounding box
    const offsets = [
      { dx: -DRONE_SIZE * 0.7, dy: -DRONE_SIZE * 0.7 },
      { dx: DRONE_SIZE * 0.7, dy: -DRONE_SIZE * 0.7 },
      { dx: -DRONE_SIZE * 0.7, dy: DRONE_SIZE * 0.7 },
      { dx: DRONE_SIZE * 0.7, dy: DRONE_SIZE * 0.7 },
    ];
    for (const o of offsets) {
      const col = Math.floor((x + o.dx) / TILE);
      const row = Math.floor((y + o.dy) / TILE);
      if (row < 0 || row >= MAZE.length || col < 0 || col >= MAZE[0].length) return true;
      const cell = this.mazeCopy[row][col];
      if (cell === 1 || cell === 2) return true;
    }
    return false;
  }

  _tryOpenDoor() {
    // Check adjacent cells for doors
    const col = Math.floor(this.droneX / TILE);
    const row = Math.floor(this.droneY / TILE);
    const neighbors = [
      { r: row - 1, c: col }, { r: row + 1, c: col },
      { r: row, c: col - 1 }, { r: row, c: col + 1 },
    ];
    for (const n of neighbors) {
      if (n.r >= 0 && n.r < MAZE.length && n.c >= 0 && n.c < MAZE[0].length) {
        if (this.mazeCopy[n.r][n.c] === 2) {
          // Open the door
          this.mazeCopy[n.r][n.c] = 0;
          this.doorsOpened++;
          SoundManager.get().playDoorOpen();

          // Update tile visual
          const tileIdx = n.r * MAZE[0].length + n.c;
          if (this.mazeTiles[tileIdx]) {
            this.mazeTiles[tileIdx].setTexture('tunnel_floor');
          }

          // Door open effect
          const doorX = n.c * TILE + TILE / 2;
          const doorY = n.r * TILE + TILE / 2;
          const effect = this.add.circle(doorX, doorY, 15, 0x00ff00, 0.4).setDepth(12);
          this.tweens.add({
            targets: effect, alpha: 0, scaleX: 2, scaleY: 2, duration: 500,
            onComplete: () => effect.destroy(),
          });
          break;
        }
      }
    }
  }

  _updateDarkness() {
    const dCtx = this.darknessCanvas.getContext('2d');
    dCtx.fillStyle = 'rgba(0,0,0,0.95)';
    dCtx.fillRect(0, 0, W, H);

    // Cut out spotlight around drone
    dCtx.globalCompositeOperation = 'destination-out';
    const radius = this.interferenceActive ? SPOTLIGHT_RADIUS * 0.5 : SPOTLIGHT_RADIUS;
    const grad = dCtx.createRadialGradient(this.droneX, this.droneY, 0, this.droneX, this.droneY, radius);
    grad.addColorStop(0, 'rgba(0,0,0,1)');
    grad.addColorStop(0.6, 'rgba(0,0,0,0.8)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    dCtx.fillStyle = grad;
    dCtx.beginPath();
    dCtx.arc(this.droneX, this.droneY, radius, 0, Math.PI * 2);
    dCtx.fill();

    dCtx.globalCompositeOperation = 'source-over';

    // Refresh the canvas texture so Phaser picks up the changes
    this.textures.get(this.darknessTexKey).refresh();
  }

  _cleanupTunnel() {
    for (const t of this.mazeTiles) t.destroy();
    this.mazeTiles = [];
    if (this.exitMarker) { this.exitMarker.destroy(); this.exitMarker = null; }
    if (this.darknessSprite) { this.darknessSprite.destroy(); this.darknessSprite = null; }
    if (this.darknessTexKey && this.textures.exists(this.darknessTexKey)) {
      this.textures.remove(this.darknessTexKey);
    }
    this.darknessCanvas = null;
    if (this.droneSprite) { this.droneSprite.destroy(); this.droneSprite = null; }
  }

  // ═════════════════════════════════════════════════════════════
  // CITY INTRO — Top-down drone flight through ruined city
  // ═════════════════════════════════════════════════════════════

  _startCityIntro() {
    this.phase = 'city';
    MusicManager.get().playLevel4Music('command');

    // ── City constants ──
    const CITY_SCROLL_SPEED = 45;     // px/s auto-scroll upward
    const CITY_DRONE_SPEED = 250;     // player movement speed
    const CITY_LENGTH = 4200;         // total city height in world pixels
    const BLOCK_H = 300;              // height of each city block
    const STREET_GAP = 60;            // gap between blocks (cross-street)
    const BUILDING_MIN_W = 80;
    const BUILDING_MAX_W = 160;
    const SIDEWALK = 40;              // gap from edge to first building
    const STREET_W = 180;             // central street width

    this._city = {
      scrollSpeed: CITY_SCROLL_SPEED,
      droneSpeed: CITY_DRONE_SPEED,
      totalLength: CITY_LENGTH,
      scrollY: 0,
      blocks: [],
      rubble: [],
      cables: [],
      enemyDrones: [],
      enemyBullets: [],
      windowTarget: null,
      promptShown: false,
      enterReady: false,
      transitioning: false,
      gfx: this.add.graphics().setDepth(1),
      objects: [],          // track all created game objects for cleanup
      invulnTimer: 0,
      hitFlashTimer: 0,
    };
    const city = this._city;

    // ── Generate city blocks procedurally ──
    const numBlocks = Math.ceil(CITY_LENGTH / (BLOCK_H + STREET_GAP));
    const streetLeft = (W - STREET_W) / 2;
    const streetRight = streetLeft + STREET_W;

    for (let i = 0; i < numBlocks; i++) {
      const blockY = i * (BLOCK_H + STREET_GAP);
      const block = { y: blockY, h: BLOCK_H, buildings: [], windows: [] };

      // Left-side buildings
      let bx = SIDEWALK;
      while (bx < streetLeft - 10) {
        const bw = BUILDING_MIN_W + Math.random() * (BUILDING_MAX_W - BUILDING_MIN_W);
        const clampW = Math.min(bw, streetLeft - 10 - bx);
        if (clampW < 30) break;
        const bh = BLOCK_H - 10 + Math.random() * 20;
        block.buildings.push({ x: bx, y: blockY, w: clampW, h: bh, side: 'left' });

        // Windows on this building
        const cols = Math.floor(clampW / 24);
        const rows = Math.floor(bh / 30);
        for (let wr = 0; wr < rows; wr++) {
          for (let wc = 0; wc < cols; wc++) {
            block.windows.push({
              x: bx + 12 + wc * 24,
              y: blockY + 15 + wr * 30,
              w: 14, h: 18,
              lit: false,
            });
          }
        }
        bx += clampW + 6;
      }

      // Right-side buildings
      bx = streetRight + 10;
      while (bx < W - SIDEWALK) {
        const bw = BUILDING_MIN_W + Math.random() * (BUILDING_MAX_W - BUILDING_MIN_W);
        const clampW = Math.min(bw, W - SIDEWALK - bx);
        if (clampW < 30) break;
        const bh = BLOCK_H - 10 + Math.random() * 20;
        block.buildings.push({ x: bx, y: blockY, w: clampW, h: bh, side: 'right' });

        const cols = Math.floor(clampW / 24);
        const rows = Math.floor(bh / 30);
        for (let wr = 0; wr < rows; wr++) {
          for (let wc = 0; wc < cols; wc++) {
            block.windows.push({
              x: bx + 12 + wc * 24,
              y: blockY + 15 + wr * 30,
              w: 14, h: 18,
              lit: false,
            });
          }
        }
        bx += clampW + 6;
      }

      city.blocks.push(block);
    }

    // ── Rubble in the streets ──
    for (let i = 0; i < 80; i++) {
      city.rubble.push({
        x: streetLeft + Math.random() * STREET_W,
        y: Math.random() * CITY_LENGTH,
        w: 6 + Math.random() * 14,
        h: 4 + Math.random() * 10,
        color: Math.random() > 0.5 ? 0x3a3a3a : 0x4a3a2a,
        angle: Math.random() * Math.PI,
      });
    }

    // ── Fallen cables across streets ──
    for (let i = 0; i < 12; i++) {
      const cy = 200 + Math.random() * (CITY_LENGTH - 400);
      city.cables.push({
        x1: streetLeft + Math.random() * 20,
        y1: cy - 10 + Math.random() * 20,
        x2: streetRight - Math.random() * 20,
        y2: cy - 10 + Math.random() * 20,
        sag: 10 + Math.random() * 20,
      });
    }

    // ── THE target window — near the end of the city ──
    // Pick a window on the last few blocks
    const targetBlockIdx = numBlocks - 2;
    const targetBlock = city.blocks[targetBlockIdx];
    if (targetBlock && targetBlock.windows.length > 0) {
      // Pick a window on a building adjacent to the street for visibility
      const streetAdjacentWins = targetBlock.windows.filter(w =>
        (w.x > streetLeft - 60 && w.x < streetLeft + 30) ||
        (w.x > streetRight - 30 && w.x < streetRight + 60)
      );
      const candidates = streetAdjacentWins.length > 0 ? streetAdjacentWins : targetBlock.windows;
      const tw = candidates[Math.floor(Math.random() * candidates.length)];
      tw.lit = true;
      tw.isTarget = true;
      city.windowTarget = tw;
    } else {
      // Fallback: put it at a fixed position
      city.windowTarget = {
        x: streetLeft - 30,
        y: targetBlockIdx * (BLOCK_H + STREET_GAP) + BLOCK_H / 2,
        w: 14, h: 18, lit: true, isTarget: true,
      };
    }

    // ── Enemy patrol drones ──
    const enemyCount = 8;
    for (let i = 0; i < enemyCount; i++) {
      const ey = 400 + i * (CITY_LENGTH - 600) / enemyCount;
      const patrolLeft = streetLeft + 20;
      const patrolRight = streetRight - 20;
      city.enemyDrones.push({
        x: patrolLeft + Math.random() * (patrolRight - patrolLeft),
        y: ey,
        speed: 50 + Math.random() * 40,
        dir: Math.random() > 0.5 ? 1 : -1,
        patrolLeft,
        patrolRight,
        detectRange: 120,
        detectAngle: Math.PI / 4,   // 45-degree cone half-angle
        alertTimer: 0,
        shootCooldown: 0,
        alerted: false,
      });
    }

    // ── Player drone position ──
    this.droneX = W / 2;
    this.droneY = H - 80;
    this._cityDroneWorldY = CITY_LENGTH - 80; // world Y (scroll-adjusted)

    // ── Instruction text ──
    this.instrText.setText('FLY THROUGH THE CITY — FIND THE GLOWING WINDOW');
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

    const streetLeft = (W - 180) / 2;
    const streetRight = streetLeft + 180;

    // ── Auto-scroll (move world upward) ──
    city.scrollY += city.scrollSpeed * dt;

    // ── Player movement ──
    let dx = 0, dy = 0;
    if (this.keys.left.isDown) dx -= 1;
    if (this.keys.right.isDown) dx += 1;
    if (this.keys.up.isDown) dy -= 1;
    if (this.keys.down.isDown) dy += 1;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    dx /= len; dy /= len;

    const speed = city.droneSpeed;
    this.droneX += dx * speed * dt;
    this._cityDroneWorldY -= dy * speed * dt; // up in world = negative

    // Also move world position with scroll
    this._cityDroneWorldY -= city.scrollSpeed * dt;

    // Clamp to street bounds (with some margin into sidewalk)
    const margin = 30;
    this.droneX = Math.max(margin, Math.min(W - margin, this.droneX));
    this._cityDroneWorldY = Math.max(100, Math.min(city.totalLength - 50, this._cityDroneWorldY));

    // Screen Y of drone stays roughly at bottom 1/3 but adjust if near edges
    this.droneY = H - 120;

    // Camera offset = how far scrolled into the city
    const cameraY = city.totalLength - this._cityDroneWorldY - (H - this.droneY);
    city.scrollY = Math.max(0, Math.min(city.totalLength - H, cameraY));

    // ── Invulnerability timer ──
    if (city.invulnTimer > 0) city.invulnTimer -= dt;

    // ── Collision with rubble (slow down) ──
    // Simple: if drone overlaps rubble, reduce effective speed briefly (already handled)

    // ── Enemy drone AI ──
    for (const e of city.enemyDrones) {
      // Patrol left-right
      e.x += e.speed * e.dir * dt;
      if (e.x <= e.patrolLeft) { e.x = e.patrolLeft; e.dir = 1; }
      if (e.x >= e.patrolRight) { e.x = e.patrolRight; e.dir = -1; }

      // Screen position
      const eScreenY = e.y - city.scrollY;

      // Detection: check if player is in detection cone below enemy
      const dxToPlayer = this.droneX - e.x;
      const dyToPlayer = this.droneY - eScreenY;
      const distToPlayer = Math.sqrt(dxToPlayer * dxToPlayer + dyToPlayer * dyToPlayer);

      e.alerted = false;
      if (distToPlayer < e.detectRange && distToPlayer > 5) {
        // Check if player is generally below/above the enemy (cone facing down)
        const angleTo = Math.atan2(dyToPlayer, dxToPlayer);
        const coneCenter = Math.PI / 2; // straight down
        let angleDiff = Math.abs(angleTo - coneCenter);
        if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;
        if (angleDiff < e.detectAngle) {
          e.alerted = true;
        }
      }

      // Shoot if alerted
      if (e.alerted) {
        e.alertTimer += dt;
        e.shootCooldown -= dt;
        if (e.shootCooldown <= 0 && e.alertTimer > 0.3) {
          e.shootCooldown = 1.2;
          // Fire bullet toward player
          const bAngle = Math.atan2(this.droneY - eScreenY, this.droneX - e.x);
          city.enemyBullets.push({
            x: e.x,
            y: e.y,
            vx: Math.cos(bAngle) * 200,
            vy: Math.sin(bAngle) * 200,
            life: 3,
          });
          SoundManager.get().playPlayerShoot();
        }
      } else {
        e.alertTimer = 0;
      }
    }

    // ── Update enemy bullets ──
    for (let i = city.enemyBullets.length - 1; i >= 0; i--) {
      const b = city.enemyBullets[i];
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.life -= dt;

      // Screen position
      const bScreenY = b.y - city.scrollY;

      // Hit player?
      const bDx = b.x - this.droneX;
      const bDy = bScreenY - this.droneY;
      if (Math.sqrt(bDx * bDx + bDy * bDy) < 14 && city.invulnTimer <= 0) {
        this._takeDamage(1);
        city.invulnTimer = 1.0;
        city.enemyBullets.splice(i, 1);
        continue;
      }

      // Off screen or expired?
      if (b.life <= 0 || bScreenY < -50 || bScreenY > H + 50 || b.x < -50 || b.x > W + 50) {
        city.enemyBullets.splice(i, 1);
      }
    }

    // ── Check proximity to target window ──
    if (city.windowTarget) {
      const tw = city.windowTarget;
      const twScreenY = tw.y - city.scrollY;
      const twDx = this.droneX - tw.x;
      const twDy = this.droneY - twScreenY;
      const twDist = Math.sqrt(twDx * twDx + twDy * twDy);

      if (twDist < 50) {
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

    // ── Draw everything ──
    this._drawCityScene();
  }

  _drawCityScene() {
    const city = this._city;
    const gfx = city.gfx;
    gfx.clear();

    const offY = city.scrollY;

    // Background — dark city
    gfx.fillStyle(0x0a0a10);
    gfx.fillRect(0, 0, W, H);

    // Street surface (slightly lighter)
    const streetLeft = (W - 180) / 2;
    const streetRight = streetLeft + 180;
    gfx.fillStyle(0x141418);
    gfx.fillRect(streetLeft, 0, 180, H);

    // Street center line (dashed)
    gfx.lineStyle(1, 0x2a2a30, 0.5);
    const centerX = W / 2;
    for (let sy = -((offY * 0.8) % 40); sy < H; sy += 40) {
      gfx.beginPath();
      gfx.moveTo(centerX, sy);
      gfx.lineTo(centerX, sy + 20);
      gfx.strokePath();
    }

    // ── Draw buildings and windows ──
    for (const block of city.blocks) {
      for (const b of block.buildings) {
        const sy = b.y - offY;
        if (sy > H + 20 || sy + b.h < -20) continue;

        // Building body — dark gray with slight variation
        const shade = 0x1a1a22;
        gfx.fillStyle(shade);
        gfx.fillRect(b.x, sy, b.w, b.h);

        // Building outline
        gfx.lineStyle(1, 0x2a2a35, 0.6);
        gfx.strokeRect(b.x, sy, b.w, b.h);

        // Roof edge
        gfx.fillStyle(0x252530);
        gfx.fillRect(b.x - 2, sy, b.w + 4, 4);
      }

      // Windows
      for (const w of block.windows) {
        const sy = w.y - offY;
        if (sy > H + 10 || sy + w.h < -10) continue;

        if (w.isTarget) {
          // THE glowing window — golden pulse
          const pulse = 0.5 + 0.5 * Math.sin(Date.now() / 300);
          const alpha = 0.4 + pulse * 0.6;
          gfx.fillStyle(0xffaa22, alpha);
          gfx.fillRect(w.x - 1, sy - 1, w.w + 2, w.h + 2);
          // Inner glow
          gfx.fillStyle(0xffdd66, alpha * 0.8);
          gfx.fillRect(w.x + 2, sy + 2, w.w - 4, w.h - 4);
          // Outer glow halo
          gfx.lineStyle(3, 0xffaa22, alpha * 0.4);
          gfx.strokeRect(w.x - 4, sy - 4, w.w + 8, w.h + 8);
        } else {
          // Dark/boarded window
          const dark = Math.random() > 0.98 ? 0x1a1a22 : 0x0e0e14;
          gfx.fillStyle(dark, 0.8);
          gfx.fillRect(w.x, sy, w.w, w.h);
          // Occasional board across window
          if ((w.x * 7 + w.y * 3) % 11 < 3) {
            gfx.lineStyle(2, 0x3a3020, 0.5);
            gfx.beginPath();
            gfx.moveTo(w.x, sy + w.h / 2);
            gfx.lineTo(w.x + w.w, sy + w.h / 2);
            gfx.strokePath();
          }
        }
      }
    }

    // ── Draw rubble ──
    for (const r of city.rubble) {
      const sy = r.y - offY;
      if (sy > H + 20 || sy < -20) continue;
      gfx.fillStyle(r.color, 0.7);
      gfx.fillRect(r.x - r.w / 2, sy - r.h / 2, r.w, r.h);
    }

    // ── Draw cables ──
    gfx.lineStyle(2, 0x3a3a3a, 0.6);
    for (const c of city.cables) {
      const sy1 = c.y1 - offY;
      const sy2 = c.y2 - offY;
      if (sy1 > H + 30 && sy2 > H + 30) continue;
      if (sy1 < -30 && sy2 < -30) continue;
      const midX = (c.x1 + c.x2) / 2;
      const midY = (sy1 + sy2) / 2 + c.sag;
      gfx.beginPath();
      gfx.moveTo(c.x1, sy1);
      gfx.lineTo(midX - 30, (sy1 + midY) / 2 + c.sag * 0.3);
      gfx.lineTo(midX, midY);
      gfx.lineTo(midX + 30, (sy2 + midY) / 2 + c.sag * 0.3);
      gfx.lineTo(c.x2, sy2);
      gfx.strokePath();
    }

    // ── Draw enemy drones ──
    for (const e of city.enemyDrones) {
      const eScreenY = e.y - offY;
      if (eScreenY > H + 30 || eScreenY < -30) continue;

      // Detection cone (faint)
      if (e.alerted) {
        gfx.fillStyle(0xff0000, 0.08);
      } else {
        gfx.fillStyle(0xffff00, 0.04);
      }
      gfx.beginPath();
      gfx.moveTo(e.x, eScreenY);
      gfx.lineTo(e.x - 40, eScreenY + e.detectRange);
      gfx.lineTo(e.x + 40, eScreenY + e.detectRange);
      gfx.closePath();
      gfx.fillPath();

      // Drone body — triangle
      const color = e.alerted ? 0xff2222 : 0xff6644;
      gfx.fillStyle(color, 0.9);
      gfx.beginPath();
      gfx.moveTo(e.x, eScreenY - 8);
      gfx.lineTo(e.x - 8, eScreenY + 6);
      gfx.lineTo(e.x + 8, eScreenY + 6);
      gfx.closePath();
      gfx.fillPath();

      // Eye / sensor
      gfx.fillStyle(0xffff00, e.alerted ? 1 : 0.6);
      gfx.fillCircle(e.x, eScreenY, 2);
    }

    // ── Draw enemy bullets ──
    for (const b of city.enemyBullets) {
      const bScreenY = b.y - offY;
      if (bScreenY > H + 10 || bScreenY < -10) continue;
      gfx.fillStyle(0xff4444, 0.9);
      gfx.fillCircle(b.x, bScreenY, 3);
      // Trail
      gfx.fillStyle(0xff2222, 0.3);
      gfx.fillCircle(b.x - b.vx * 0.02, bScreenY - b.vy * 0.02, 2);
    }

    // ── Draw player drone ──
    const flashOn = this._city.invulnTimer > 0 && Math.floor(Date.now() / 80) % 2 === 0;
    if (!flashOn) {
      // Drone body (circle with propeller hints)
      gfx.fillStyle(0x00ccff, 0.9);
      gfx.fillCircle(this.droneX, this.droneY, 8);
      // Inner
      gfx.fillStyle(0x0088cc, 0.8);
      gfx.fillCircle(this.droneX, this.droneY, 4);
      // Propeller arms
      gfx.lineStyle(2, 0x00aadd, 0.7);
      for (let a = 0; a < 4; a++) {
        const angle = a * Math.PI / 2 + Date.now() / 200;
        gfx.beginPath();
        gfx.moveTo(this.droneX, this.droneY);
        gfx.lineTo(this.droneX + Math.cos(angle) * 12, this.droneY + Math.sin(angle) * 12);
        gfx.strokePath();
      }
      // Glow
      gfx.fillStyle(0x00ccff, 0.15);
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
        const flickerEvent = this.time.addEvent({
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
    city.blocks = [];
    city.rubble = [];
    city.cables = [];
    city.enemyDrones = [];
    city.enemyBullets = [];
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

    // Command room background (front-view destroyed interior)
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
    this.bossX = W / 2;
    this.bossY = -100; // starts above screen for entrance
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

    // Boss sprite — placed in the upper/center of room (inside the room)
    this.bossSprite = this.add.image(this.bossX, this.bossY, 'ts_boss4_normal').setDepth(10);
    this.bossSprite.setDisplaySize(BOSS_DISPLAY, BOSS_DISPLAY);

    // Boss HP bar (full width, top of screen, scrollFactor 0)
    this._createBossHPBar();

    // Couch (front-view, destructible cover object, middle of room — BIGGER)
    this.couchX = W / 2;
    this.couchY = COUCH_Y;
    this.couchHP = 8;
    this.couchMaxHP = 8;
    this.couchAlive = true;
    this.couchSprite = this.add.image(this.couchX, this.couchY, 'boss_couch').setDepth(12);
    this.couchSprite.setDisplaySize(160, 100);

    // Additional cover positions (rubble pile + column)
    this.coverSprites = [];
    for (const cp of COVER_POSITIONS) {
      if (cp.type === 'couch') continue; // couch handled above
      const texKey = cp.type === 'rubble' ? 'cover_rubble' : 'cover_column';
      const spr = this.add.image(cp.x, cp.y, texKey).setDepth(12);
      spr.setDisplaySize(cp.type === 'rubble' ? 60 : 40, cp.type === 'rubble' ? 50 : 70);
      this.coverSprites.push({ sprite: spr, type: cp.type, x: cp.x, y: cp.y, alive: true });
    }

    // Boss cover state machine
    this.bossCoverState = 'exposed';   // 'exposed' | 'moving_to_cover' | 'behind_cover' | 'peeking'
    this.bossCoverTimer = 3 + Math.random() * 2;  // first cover attempt in 3-5s (aggressive)
    this.bossPeekTimer = 0;
    this.bossCoverDuration = 0;
    this.bossBehindCouchY = COUCH_Y - 50; // Y position when behind couch (taller couch)
    this.currentCoverIndex = 0; // index into COVER_POSITIONS for current cover spot

    // Phase 2 / Phase 3 state flags
    this.bossPhase2 = false; // 50% HP — running & throwing
    this.bossPhase3 = false; // 20% HP — melee charge
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

    // Boss emerges from behind couch (stands up from cover)
    SoundManager.get().playBossEntrance();

    // Start behind couch, then stand up
    this.bossX = W / 2;
    const startY = COUCH_Y;
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


  _pickBossMoveDirection() {
    let speed = this.bossFury ? BOSS_SPEED_FURY : BOSS_SPEED_NORMAL;
    if (this.bossPhase2 && !this.bossPhase3) speed = Math.max(speed, BOSS_SPEED_PHASE2);

    // If moving to cover, head toward the chosen cover position
    if (this.bossCoverState === 'moving_to_cover') {
      const coverPos = COVER_POSITIONS[this.currentCoverIndex];
      if (coverPos) {
        const dx = coverPos.x - this.bossX;
        this.bossVx = Math.sign(dx) * speed * 1.5;
        this.bossMoveDirTimer = 1;
        return;
      }
    }

    // Normal: walk left/right in the room, occasionally changing direction
    const dir = Math.random() > 0.5 ? 1 : -1;
    this.bossVx = dir * speed;
    // Phase 2: change direction more often
    if (this.bossPhase2) {
      this.bossMoveDirTimer = 0.8 + Math.random() * 0.7;
    } else {
      this.bossMoveDirTimer = 1.5 + Math.random() * 2.5;
    }
  }

  _updateBoss(dt) {
    if (!this.bossActive || this.bossDefeated) return;

    // ── Phase transitions ──
    const hpRatio = this.bossHP / this.bossMaxHP;

    // Phase 2 activation at 50% HP
    if (!this.bossPhase2 && hpRatio <= BOSS_PHASE2_THRESHOLD) {
      this.bossPhase2 = true;
      SoundManager.get().playBossRoar();
      this.cameras.main.shake(250, 0.018);
      this._pickBossMoveDirection(); // update to faster speed

      // Flash boss
      if (this.bossSprite) {
        this.tweens.add({
          targets: this.bossSprite, alpha: 0.3, duration: 80, yoyo: true, repeat: 4,
        });
      }
      // Force boss out of cover for phase 2 — chaotic running
      if (this.bossCoverState !== 'exposed') {
        this.bossCoverState = 'exposed';
        this.bossY = BOSS_AREA_TOP + (BOSS_AREA_BOTTOM - BOSS_AREA_TOP) * 0.4;
        if (this.bossSprite) {
          this.bossSprite.setAlpha(1);
          this.bossSprite.setDisplaySize(BOSS_DISPLAY, BOSS_DISPLAY);
        }
        if (this.coverIndicator) { this.coverIndicator.destroy(); this.coverIndicator = null; }
      }
      // Move boss to a different cover position for next hide
      this._pickNewCoverPosition();
    }

    // Phase 3 activation at 20% HP
    if (!this.bossPhase3 && hpRatio <= BOSS_PHASE3_THRESHOLD) {
      this.bossPhase3 = true;
      this.bossCharging = false;
      this.bossPauseTimer = 0.5; // brief pause before first charge
      SoundManager.get().playBossRoar();
      this.cameras.main.shake(400, 0.03);

      // Force out of cover
      if (this.bossCoverState !== 'exposed') {
        this.bossCoverState = 'exposed';
        this.bossY = BOSS_AREA_TOP + (BOSS_AREA_BOTTOM - BOSS_AREA_TOP) * 0.4;
        if (this.coverIndicator) { this.coverIndicator.destroy(); this.coverIndicator = null; }
      }
      this.bossCoverTimer = 999; // no more cover in phase 3

      // Equip pipe weapon
      if (!this.bossWeaponSprite && this.bossSprite) {
        this.bossWeaponSprite = this.add.image(this.bossX + 30, this.bossY + 15, 'boss_pipe_weapon').setDepth(11);
        this.bossWeaponSprite.setDisplaySize(32, 8);
      }

      // Flash boss red aggressively
      if (this.bossSprite) {
        this.tweens.add({
          targets: this.bossSprite, alpha: 0.2, duration: 60, yoyo: true, repeat: 8,
        });
      }
    }

    // ── Phase 3: Melee charge behavior ──
    if (this.bossPhase3) {
      this._updateBossPhase3(dt);
    }

    // ── Boss movement (horizontal, left/right in room) ──
    if (!this.bossPhase3 || !this.bossCharging) {
      // Normal / Phase 2 movement
      if (this.bossCoverState === 'exposed' || this.bossCoverState === 'moving_to_cover') {
        this.bossMoveDirTimer -= dt;
        if (this.bossMoveDirTimer <= 0) {
          this._pickBossMoveDirection();
        }

        this.bossX += this.bossVx * dt;
        this.bossX = Phaser.Math.Clamp(this.bossX, BOSS_AREA_LEFT, BOSS_AREA_RIGHT);
        if (this.bossX <= BOSS_AREA_LEFT || this.bossX >= BOSS_AREA_RIGHT) {
          this.bossVx *= -1;
        }
      }
    }

    // Update boss sprite position (only if not behind cover)
    if (this.bossCoverState !== 'behind_cover' && this.bossCoverState !== 'peeking') {
      if (this.bossSprite) this.bossSprite.setPosition(this.bossX, this.bossY);
    }

    // Update pipe weapon position (phase 3)
    if (this.bossWeaponSprite) {
      const weapDir = this.bossVx >= 0 ? 1 : -1;
      this.bossWeaponSprite.setPosition(this.bossX + weapDir * 30, this.bossY + 15);
      this.bossWeaponSprite.setFlipX(weapDir < 0);
      // Rotate weapon during charge
      if (this.bossCharging) {
        this.bossWeaponSprite.rotation += dt * 8 * weapDir;
      } else {
        this.bossWeaponSprite.rotation = weapDir > 0 ? 0.3 : -0.3;
      }
    }

    // ── Expression changes ──
    let newExpr;
    if (hpRatio > 0.6) newExpr = 'normal';
    else if (hpRatio > BOSS_FURY_THRESHOLD) newExpr = 'angry';
    else newExpr = 'furious';

    if (newExpr !== this.bossExpression) {
      this.bossExpression = newExpr;
      const texKey = 'ts_boss4_' + newExpr;
      if (this.bossSprite && this.textures.exists(texKey)) {
        this.bossSprite.setTexture(texKey);
      }
      // Fury mode activation
      if (newExpr === 'furious' && !this.bossFury) {
        this.bossFury = true;
        SoundManager.get().playBossRoar();
        this.cameras.main.shake(300, 0.02);
        this._pickBossMoveDirection();

        if (this.bossSprite) {
          this.tweens.add({
            targets: this.bossSprite, alpha: 0.3, duration: 100, yoyo: true, repeat: 5,
          });
        }
      }
    }

    // ── Attack: THROW OBJECTS ──
    // Phase 2: throws while running (always active, not just when stationary)
    if (this.bossFury) {
      // Fury mode: rapid throwing
      this.bossThrowTimer -= dt;
      if (this.bossThrowTimer <= 0) {
        this._bossThrowObject();
        this.bossThrowTimer = 0.25 + Math.random() * 0.25;
      }
    } else if (this.bossThrowBurstCount > 0) {
      // In middle of a burst
      this.bossThrowBurstTimer -= dt;
      if (this.bossThrowBurstTimer <= 0) {
        this._bossThrowObject();
        this.bossThrowBurstCount--;
        this.bossThrowBurstTimer = 0.30;
      }
    } else {
      this.bossThrowTimer -= dt;
      if (this.bossThrowTimer <= 0) {
        // Start a burst of 2-4 objects (was 1-3)
        this.bossThrowBurstCount = 2 + Math.floor(Math.random() * 3);
        this.bossThrowBurstTimer = 0;
        this.bossThrowTimer = BOSS_THROW_INTERVAL_MIN + Math.random() * (BOSS_THROW_INTERVAL_MAX - BOSS_THROW_INTERVAL_MIN);
      }
    }

    // ── Cover behavior (multi-position) ──
    if (!this.bossPhase3) {
      this._updateBossCover(dt);
    }

    // ── Update projectiles (thrown objects flying toward camera) ──
    this._updateBossProjectiles(dt);

    // ── Fury red particles ──
    this._updateFuryParticles(dt);

    // ── Ambient dust ──
    this._updateAmbientDust(dt);

    // ── Update HP bar ──
    this._updateBossHPBar();
  }

  // ── Phase 3: Melee charge logic ──
  _updateBossPhase3(dt) {
    if (this.bossCharging) {
      // Charging toward drone position
      this.bossChargeTimer -= dt;

      // Move toward drone
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
        this.bossSprite.setPosition(this.bossX, this.bossY);
        this.bossSprite.setDisplaySize(BOSS_DISPLAY * 1.1, BOSS_DISPLAY * 1.1); // slightly bigger during charge
      }

      // Charge finished — pause
      if (this.bossChargeTimer <= 0) {
        this.bossCharging = false;
        this.bossPauseTimer = 1.0; // 1s pause between charges
        if (this.bossSprite) {
          this.bossSprite.setDisplaySize(BOSS_DISPLAY, BOSS_DISPLAY);
        }
      }
    } else {
      // Pause between charges — still throws objects
      this.bossPauseTimer -= dt;

      // Retreat slightly during pause
      const retreatY = BOSS_AREA_TOP + (BOSS_AREA_BOTTOM - BOSS_AREA_TOP) * 0.4;
      if (this.bossY > retreatY) {
        this.bossY -= 40 * dt;
      }

      if (this.bossPauseTimer <= 0) {
        // Start a new charge
        this.bossCharging = true;
        this.bossChargeTimer = 2.0; // charge for 2s
        SoundManager.get().playBossRoar();
      }
    }
  }

  // Pick a new cover position (different from current one, for variety)
  _pickNewCoverPosition() {
    const available = [];
    for (let i = 0; i < COVER_POSITIONS.length; i++) {
      if (i === 0 && !this.couchAlive) continue; // skip destroyed couch
      if (i !== this.currentCoverIndex) available.push(i);
    }
    if (available.length > 0) {
      this.currentCoverIndex = available[Math.floor(Math.random() * available.length)];
    }
  }

  _bossThrowObject() {
    if (!this.bossSprite) return;
    SoundManager.get().playBossLaser();

    // ── Show throwing arm animation ──
    const armStartX = this.bossX;
    const armStartY = this.bossY + 15;
    const armTargetX = this.droneX;
    const armTargetY = this.droneY;
    const armAngle = Math.atan2(armTargetY - armStartY, armTargetX - armStartX);
    const armLen = 28;

    // Create arm graphic (a short rectangle/line extending from boss body toward throw direction)
    const armGfx = this.add.graphics().setDepth(11);
    armGfx.lineStyle(5, 0x7a5030, 1);
    armGfx.beginPath();
    armGfx.moveTo(armStartX, armStartY);
    armGfx.lineTo(armStartX + Math.cos(armAngle) * armLen, armStartY + Math.sin(armAngle) * armLen);
    armGfx.strokePath();
    // Hand (small circle at end of arm)
    armGfx.fillStyle(0x906040, 1);
    armGfx.fillCircle(armStartX + Math.cos(armAngle) * armLen, armStartY + Math.sin(armAngle) * armLen, 4);

    // Retract arm after 0.3 seconds
    this.tweens.add({
      targets: armGfx,
      alpha: 0,
      duration: 300,
      delay: 50,
      onComplete: () => armGfx.destroy(),
    });

    // ── Create projectile with random texture variant ──
    const startX = this.bossX;
    const startY = this.bossY + 30;
    // Aim toward the drone's current position with spread
    const spread = this.bossCoverState === 'peeking' ? 50 : 80; // more accurate when peeking
    const targetX = this.droneX + (Math.random() - 0.5) * spread;
    const targetY = this.droneY + (Math.random() - 0.5) * 30;

    // Randomly pick one of the 4 projectile textures
    const projIdx = Math.floor(Math.random() * 4);
    const projTex = 'boss_projectile_' + projIdx;
    const texKey = this.textures.exists(projTex) ? projTex : 'boss_projectile';

    const proj = this.add.image(startX, startY, texKey).setDepth(18);
    proj.setDisplaySize(8, 8); // starts small (far away)

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
    // Particle burst at impact point
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

  _updateBossCover(dt) {
    // Determine if any cover is available
    const coverAvailable = this._isCoverAvailable();
    if (!coverAvailable || this.bossFury) {
      // No cover behavior if all cover destroyed or in fury mode
      if (this.bossCoverState !== 'exposed') {
        this.bossCoverState = 'exposed';
        this.bossY = BOSS_AREA_TOP + (BOSS_AREA_BOTTOM - BOSS_AREA_TOP) * 0.4;
        if (this.bossSprite) {
          this.bossSprite.setAlpha(1);
          this.bossSprite.setDisplaySize(BOSS_DISPLAY, BOSS_DISPLAY);
          this.bossSprite.setPosition(this.bossX, this.bossY);
        }
      }
      return;
    }

    const coverPos = COVER_POSITIONS[this.currentCoverIndex];
    const coverY = coverPos ? coverPos.y : COUCH_Y;
    const behindCoverY = coverY - 50; // Y position when hiding behind cover
    const reachDist = coverPos && coverPos.type === 'couch' ? 80 : 40; // bigger reach for bigger couch

    switch (this.bossCoverState) {
      case 'exposed':
        this.bossCoverTimer -= dt;
        if (this.bossCoverTimer <= 0) {
          // Pick a cover position (different when HP drops)
          if (this.bossPhase2) this._pickNewCoverPosition();
          this.bossCoverState = 'moving_to_cover';
          this._pickBossMoveDirection();
        }
        break;

      case 'moving_to_cover': {
        const distX = Math.abs(this.bossX - coverPos.x);
        if (distX < reachDist) {
          // Duck behind cover
          this.bossCoverState = 'behind_cover';
          this.bossCoverDuration = 3 + Math.random() * 2; // 3-5s total cover time (was 5-9s)
          this.bossPeekTimer = 0.8 + Math.random() * 0.4; // peek sooner (was 1.2-2.0s)
          this.bossVx = 0;
          this.bossY = behindCoverY;
          if (this.bossSprite) {
            this.bossSprite.setPosition(this.bossX, this.bossY);
            this.bossSprite.setAlpha(0.25);
            this.bossSprite.setDisplaySize(BOSS_DISPLAY * 0.5, BOSS_DISPLAY * 0.5);
          }
          const coverLabel = coverPos.type === 'couch' ? 'BEHIND COVER' : `BEHIND ${coverPos.type.toUpperCase()}`;
          if (!this.coverIndicator) {
            this.coverIndicator = this.add.text(coverPos.x, coverY - 55, coverLabel, {
              fontFamily: 'monospace', fontSize: '11px', color: '#ff6666',
            }).setOrigin(0.5).setDepth(20).setAlpha(0.7);
          }
        }
        break;
      }

      case 'behind_cover':
        this.bossCoverDuration -= dt;
        this.bossPeekTimer -= dt;

        if (this.bossSprite) {
          this.bossSprite.setPosition(this.bossX, this.bossY);
        }

        // Peek out to throw objects periodically
        if (this.bossPeekTimer <= 0) {
          this.bossCoverState = 'peeking';
          this.bossPeekTimer = 1.0; // peek duration — vulnerable window
          this.bossY = behindCoverY - 50; // MORE visible above cover
          if (this.bossSprite) {
            this.bossSprite.setAlpha(1);
            this.bossSprite.setDisplaySize(BOSS_DISPLAY * 1.0, BOSS_DISPLAY * 1.0); // full size when peeking
            this.bossSprite.setPosition(this.bossX, this.bossY);
          }
          if (this.coverIndicator) { this.coverIndicator.destroy(); this.coverIndicator = null; }
          const hint = this.add.text(coverPos.x, coverY - 55, 'SHOOT NOW!', {
            fontFamily: 'monospace', fontSize: '11px', color: '#00ff66',
          }).setOrigin(0.5).setDepth(20);
          this.tweens.add({ targets: hint, alpha: 0, duration: 800, onComplete: () => hint.destroy() });
        }

        // Done hiding — emerge and fight exposed briefly, then seek cover again
        if (this.bossCoverDuration <= 0) {
          this.bossCoverState = 'exposed';
          this.bossCoverTimer = 3 + Math.random() * 3; // 3-6s exposed (was 7-12s)
          this.bossY = BOSS_AREA_TOP + (BOSS_AREA_BOTTOM - BOSS_AREA_TOP) * 0.4;
          if (this.bossSprite) {
            this.bossSprite.setAlpha(1);
            this.bossSprite.setDisplaySize(BOSS_DISPLAY, BOSS_DISPLAY);
            this.bossSprite.setPosition(this.bossX, this.bossY);
          }
          if (this.coverIndicator) { this.coverIndicator.destroy(); this.coverIndicator = null; }
          this._pickNewCoverPosition(); // pick different cover for next time
          this._pickBossMoveDirection();
        }
        break;

      case 'peeking':
        this.bossPeekTimer -= dt;
        if (this.bossSprite) {
          this.bossSprite.setPosition(this.bossX, this.bossY);
        }
        if (this.bossPeekTimer <= 0) {
          // Rapid throw burst while peeking (3-5 objects), then duck back quickly
          this._bossThrowObject();
          const burstCount = 2 + Math.floor(Math.random() * 3); // 2-4 additional throws
          for (let t = 1; t <= burstCount; t++) {
            this.time.delayedCall(t * 150, () => {
              if (this.bossActive && !this.bossDefeated) this._bossThrowObject();
            });
          }
          this.bossCoverState = 'behind_cover';
          this.bossPeekTimer = 0.7 + Math.random() * 0.5; // faster re-peek (was 1.2-2.2s)
          this.bossY = behindCoverY;
          if (this.bossSprite) {
            this.bossSprite.setAlpha(0.25);
            this.bossSprite.setDisplaySize(BOSS_DISPLAY * 0.5, BOSS_DISPLAY * 0.5);
            this.bossSprite.setPosition(this.bossX, this.bossY);
          }
          const coverLabel = coverPos.type === 'couch' ? 'BEHIND COVER' : `BEHIND ${coverPos.type.toUpperCase()}`;
          if (!this.coverIndicator) {
            this.coverIndicator = this.add.text(coverPos.x, coverY - 55, coverLabel, {
              fontFamily: 'monospace', fontSize: '11px', color: '#ff6666',
            }).setOrigin(0.5).setDepth(20).setAlpha(0.7);
          }
        }
        break;
    }
  }

  // Check if any cover position is still available (couch alive or other covers exist)
  _isCoverAvailable() {
    // Couch cover depends on couchAlive
    if (this.currentCoverIndex === 0 && !this.couchAlive) {
      // Try to switch to another cover
      this._pickNewCoverPosition();
    }
    if (this.currentCoverIndex === 0) return this.couchAlive;
    // Non-couch covers are always available (they don't get destroyed)
    return true;
  }

  // ── Ambient dust particles (semi-transparent, slowly drifting in room) ──
  _spawnAmbientDust() {
    for (let i = 0; i < 12; i++) {
      const px = 150 + Math.random() * (W - 300);
      const py = ROOM_BACK_Y + 20 + Math.random() * (COUCH_Y - ROOM_BACK_Y - 20);
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
      // Wrap around when out of room area
      if (d.y < ROOM_BACK_Y) {
        d.y = COUCH_Y - 10;
        d.x = 150 + Math.random() * (W - 300);
      }
      if (d.x < 140) d.x = W - 160;
      if (d.x > W - 140) d.x = 160;
      d.sprite.setPosition(d.x, d.y);
    }
  }

  // ── Fury red particles (small red dots floating up around boss) ──
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

  // ── Boss damage visual effects (screen flash + debris around hit) ──
  _bossDamageEffects() {
    // Brief white screen flash
    const flash = this.add.rectangle(W / 2, H / 2, W, H, 0xffffff, 0.12).setDepth(45).setScrollFactor(0);
    this.tweens.add({ targets: flash, alpha: 0, duration: 150, onComplete: () => flash.destroy() });

    // Debris particles around boss hit point
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

  _damageCouch(amount) {
    if (!this.couchAlive) return;
    this.couchHP -= amount;
    if (this.couchHP <= 0) {
      this.couchAlive = false;
      // Armchair destruction effect
      if (this.couchSprite) {
        // Debris particles
        for (let i = 0; i < 8; i++) {
          const px = this.couchX + (Math.random() - 0.5) * 50;
          const py = this.couchY + (Math.random() - 0.5) * 30;
          const particle = this.add.circle(px, py, 3 + Math.random() * 4, 0x6a5a3a, 0.8).setDepth(22);
          this.tweens.add({
            targets: particle,
            x: px + (Math.random() - 0.5) * 60,
            y: py + (Math.random() - 0.5) * 60,
            alpha: 0,
            duration: 500 + Math.random() * 300,
            onComplete: () => particle.destroy(),
          });
        }
        this.couchSprite.destroy();
        this.couchSprite = null;
      }
      // Force boss out of cover
      this.bossCoverState = 'exposed';
      this.bossCoverTimer = 999; // no more cover attempts
      if (this.bossSprite) this.bossSprite.setAlpha(1);
    } else {
      // Visual damage feedback on couch
      if (this.couchSprite) {
        this.couchSprite.setAlpha(0.4 + 0.6 * (this.couchHP / this.couchMaxHP));
      }
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
            // Bullet hits couch instead
            this._damageCouch(b.damage);
          } else {
            this._damageBoss(b.damage);
          }
        }
      }

      // Hit armchair (destructible — bigger couch: ±80 X, extended Y)
      if (b.alive && this.couchAlive) {
        if (b.y > COUCH_Y - 45 && b.y < COUCH_Y + 50 && Math.abs(b.x - this.couchX) < 80) {
          b.alive = false;
          this._damageCouch(b.damage);
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

      // Missiles hit armchair (bigger couch)
      if (m.alive && this.couchAlive) {
        if (m.y > COUCH_Y - 48 && m.y < COUCH_Y + 55 && Math.abs(m.x - this.couchX) < 85) {
          m.alive = false;
          this._damageCouch(m.damage);
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

    // Couch
    if (this.couchSprite) { this.couchSprite.destroy(); this.couchSprite = null; }

    // Cover sprites (rubble, column)
    if (this.coverSprites) {
      for (const cs of this.coverSprites) { if (cs.sprite) cs.sprite.destroy(); }
      this.coverSprites = [];
    }

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
    const starCount = missionSuccess && this.droneHP >= 4 && this.targetsFound >= 5 ? 3
      : missionSuccess && this.droneHP >= 1 ? 2
      : this.bossHP <= this.bossMaxHP * 0.5 ? 1 : 0;

    try { localStorage.setItem('superzion_stars_4', String(starCount)); } catch(e) { /* ignore */ }

    const bossStatus = this.bossDefeated ? 'ELIMINATED' : `${this.bossHP}/${this.bossMaxHP} HP remaining`;
    const stats = [
      { label: 'TUNNELS FOUND', value: `${this.targetsFound}/${RECON_TARGETS.length}` },
      { label: 'DOORS OPENED', value: `${this.doorsOpened}/${this.totalDoors}` },
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
      this.targetsFound = 5;
      this.doorsOpened = 2;
      this.score = 2000;
      // Cleanup whichever phase we're in
      if (this.phase === 'city') this._cleanupCityIntro();
      if (this.phase === 'recon') this._cleanupRecon();
      if (this.phase === 'tunnel') this._cleanupTunnel();
      this._startBossTransition();
      return;
    }

    switch (this.phase) {
      case 'city':
        this._updateCityIntro(dt);
        break;
      case 'recon':
        this._updateRecon(dt);
        break;
      case 'tunnel':
        this._updateTunnel(dt);
        break;
      case 'boss':
        this._updateBossFight(dt);
        break;
      case 'victory':
        break;
    }

    // Update HUD
    const activePhases = ['city', 'recon', 'tunnel', 'boss'];
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
