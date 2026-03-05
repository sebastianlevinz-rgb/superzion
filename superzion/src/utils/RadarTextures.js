// ═══════════════════════════════════════════════════════════════
// RadarTextures — Beirut map, monitor frame, operative at desk
// ═══════════════════════════════════════════════════════════════

const W = 960;
const H = 540;

// 8 street paths with waypoints (coords in radar area: x:[300..940], y:[90..500])
export const STREET_PATHS = [
  // Hamra — west-central, horizontal
  { name: 'Hamra', pts: [
    { x: 320, y: 260 }, { x: 400, y: 255 }, { x: 480, y: 258 },
    { x: 560, y: 252 }, { x: 620, y: 256 },
  ]},
  // Corniche — coastal road along the waterfront
  { name: 'Corniche', pts: [
    { x: 340, y: 160 }, { x: 420, y: 145 }, { x: 520, y: 138 },
    { x: 620, y: 142 }, { x: 720, y: 155 }, { x: 800, y: 175 },
  ]},
  // Damascus Road — northeast diagonal
  { name: 'Damascus', pts: [
    { x: 560, y: 300 }, { x: 620, y: 275 }, { x: 700, y: 240 },
    { x: 780, y: 210 }, { x: 860, y: 185 },
  ]},
  // Mar Elias — south-central, curving
  { name: 'MarElias', pts: [
    { x: 480, y: 340 }, { x: 520, y: 370 }, { x: 570, y: 400 },
    { x: 620, y: 420 }, { x: 680, y: 430 },
  ]},
  // Ashrafieh — east side, vertical then curve
  { name: 'Ashrafieh', pts: [
    { x: 740, y: 150 }, { x: 745, y: 220 }, { x: 750, y: 290 },
    { x: 740, y: 360 }, { x: 720, y: 420 },
  ]},
  // Sodeco — central crossroads
  { name: 'Sodeco', pts: [
    { x: 620, y: 180 }, { x: 625, y: 240 }, { x: 630, y: 300 },
    { x: 640, y: 360 }, { x: 650, y: 420 },
  ]},
  // Port — northern docks area
  { name: 'Port', pts: [
    { x: 580, y: 100 }, { x: 660, y: 105 }, { x: 740, y: 110 },
    { x: 820, y: 118 }, { x: 900, y: 130 },
  ]},
  // Verdun — west residential, slight curve
  { name: 'Verdun', pts: [
    { x: 350, y: 310 }, { x: 400, y: 340 }, { x: 450, y: 380 },
    { x: 500, y: 410 }, { x: 540, y: 450 },
  ]},
];

export const RANGE_CIRCLE = { centerX: 624, centerY: 270, radius: 140 };

// ── Beirut radar map (960×540) ──────────────────────────────────
export function createBeirutMap(scene) {
  if (scene.textures.exists('beirut_map')) return;

  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const ctx = c.getContext('2d');

  // Dark radar background
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#020408');
  bg.addColorStop(1, '#040810');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Green grid (40px)
  ctx.strokeStyle = 'rgba(0,200,0,0.06)';
  ctx.lineWidth = 0.5;
  for (let x = 0; x < W; x += 40) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
  }
  for (let y = 0; y < H; y += 40) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }

  // CRT scanlines
  for (let y = 0; y < H; y += 3) {
    ctx.fillStyle = `rgba(0,255,0,${0.006 + Math.random() * 0.004})`;
    ctx.fillRect(0, y, W, 1);
  }

  // Mediterranean Sea polygon (blue-tinted, Beirut peninsula shape)
  ctx.fillStyle = 'rgba(10,30,60,0.5)';
  ctx.beginPath();
  ctx.moveTo(300, 0);
  ctx.lineTo(940, 0);
  ctx.lineTo(940, 130);
  ctx.lineTo(850, 128);
  ctx.lineTo(780, 120);
  ctx.lineTo(720, 115);
  ctx.lineTo(660, 110);
  ctx.lineTo(600, 108);
  ctx.lineTo(540, 112);
  // Ras Beirut peninsula jut
  ctx.lineTo(480, 118);
  ctx.lineTo(430, 105);
  ctx.lineTo(380, 95);
  ctx.lineTo(340, 100);
  ctx.lineTo(320, 115);
  ctx.lineTo(310, 130);
  ctx.lineTo(300, 150);
  ctx.lineTo(300, 0);
  ctx.closePath();
  ctx.fill();

  // Coastline stroke
  ctx.strokeStyle = 'rgba(0,180,255,0.35)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(300, 150);
  ctx.lineTo(310, 130);
  ctx.lineTo(320, 115);
  ctx.lineTo(340, 100);
  ctx.lineTo(380, 95);
  ctx.lineTo(430, 105);
  ctx.lineTo(480, 118);
  ctx.lineTo(540, 112);
  ctx.lineTo(600, 108);
  ctx.lineTo(660, 110);
  ctx.lineTo(720, 115);
  ctx.lineTo(780, 120);
  ctx.lineTo(850, 128);
  ctx.lineTo(940, 130);
  ctx.stroke();

  // Street paths as faint green lines
  ctx.strokeStyle = 'rgba(0,200,0,0.15)';
  ctx.lineWidth = 1;
  for (const path of STREET_PATHS) {
    ctx.beginPath();
    ctx.moveTo(path.pts[0].x, path.pts[0].y);
    for (let i = 1; i < path.pts.length; i++) {
      ctx.lineTo(path.pts[i].x, path.pts[i].y);
    }
    ctx.stroke();
  }

  // Neighborhood labels
  ctx.font = '9px monospace';
  ctx.fillStyle = 'rgba(0,180,0,0.25)';
  const labels = [
    { t: 'HAMRA', x: 420, y: 245 },
    { t: 'ASHRAFIEH', x: 710, y: 280 },
    { t: 'RAS BEIRUT', x: 350, y: 170 },
    { t: 'DAHIEH', x: 550, y: 450 },
    { t: 'PORT', x: 720, y: 100 },
    { t: 'VERDUN', x: 370, y: 370 },
    { t: 'SODECO', x: 610, y: 340 },
    { t: 'MAR ELIAS', x: 500, y: 385 },
  ];
  for (const lb of labels) {
    ctx.fillText(lb.t, lb.x, lb.y);
  }

  // Dashed range circle
  const rc = RANGE_CIRCLE;
  ctx.strokeStyle = 'rgba(0,255,100,0.2)';
  ctx.lineWidth = 1;
  ctx.setLineDash([6, 4]);
  ctx.beginPath();
  ctx.arc(rc.centerX, rc.centerY, rc.radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // Coordinate markers
  ctx.font = '7px monospace';
  ctx.fillStyle = 'rgba(0,200,0,0.2)';
  ctx.fillText('33°54\'N', 310, 18);
  ctx.fillText('33°50\'N', 310, H - 10);
  ctx.fillText('35°28\'E', W - 55, H - 10);
  ctx.fillText('35°34\'E', W - 55, 18);

  // Border frame
  ctx.strokeStyle = 'rgba(0,180,0,0.15)';
  ctx.lineWidth = 1;
  ctx.setLineDash([]);
  ctx.strokeRect(4, 4, W - 8, H - 8);

  // Inner frame
  ctx.strokeStyle = 'rgba(0,180,0,0.08)';
  ctx.strokeRect(8, 8, W - 16, H - 16);

  scene.textures.addCanvas('beirut_map', c);
}

// ── Monitor frame (dark gray bezel) ─────────────────────────────
export function createMonitorFrame(scene) {
  if (scene.textures.exists('monitor_frame')) return;

  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const ctx = c.getContext('2d');

  // Dark gray bezel
  ctx.strokeStyle = '#3a3a3a';
  ctx.lineWidth = 6;
  ctx.strokeRect(3, 3, W - 6, H - 6);

  // Inner bevel
  ctx.strokeStyle = '#2a2a2a';
  ctx.lineWidth = 2;
  ctx.strokeRect(8, 8, W - 16, H - 16);

  // Corner bolts
  const boltPositions = [
    [18, 18], [W - 18, 18], [18, H - 18], [W - 18, H - 18],
  ];
  for (const [bx, by] of boltPositions) {
    ctx.fillStyle = '#555555';
    ctx.beginPath(); ctx.arc(bx, by, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#3a3a3a';
    ctx.beginPath(); ctx.arc(bx, by, 3, 0, Math.PI * 2); ctx.fill();
    // Cross slot
    ctx.strokeStyle = '#222222';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(bx - 2, by); ctx.lineTo(bx + 2, by); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(bx, by - 2); ctx.lineTo(bx, by + 2); ctx.stroke();
  }

  // "SIGINT TERMINAL v3.7" label
  ctx.font = '8px monospace';
  ctx.fillStyle = 'rgba(150,150,150,0.4)';
  ctx.fillText('SIGINT TERMINAL v3.7', W / 2 - 60, H - 10);

  // CRT vignette (dark corners)
  const vg = ctx.createRadialGradient(W / 2, H / 2, 200, W / 2, H / 2, 520);
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(0,0,0,0.35)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, W, H);

  scene.textures.addCanvas('monitor_frame', c);
}

// ── Operative sitting at desk (260×300 canvas) ──────────────────
export function createOperativeAtDesk(scene) {
  if (scene.textures.exists('operative_desk')) return;

  const cw = 260, ch = 300;
  const c = document.createElement('canvas');
  c.width = cw; c.height = ch;
  const ctx = c.getContext('2d');

  // PAL from SpriteGenerator
  const PAL = {
    skin0: '#8a6040', skin1: '#b08657', skin2: '#c49668',
    skin3: '#d2a679', skin4: '#e0b689',
    hair0: '#0e0e0e', hair1: '#1c1610',
    kip0: '#0e1445', kip1: '#1a237e', kip2: '#283593',
    tac0: '#3a5530', tac1: '#4a6840', tac2: '#5a7a50',
    tac3: '#6a8a62', tac4: '#7a9a72',
    vest0: '#5a5a60', vest1: '#6a6a70', vest2: '#7a7a80',
    blk0: '#2a2018', blk1: '#3a3028', blk2: '#4a4038',
  };

  // ── Chair ──
  ctx.fillStyle = '#2a2a2a';
  // Seat
  ctx.fillRect(60, 195, 70, 12);
  // Back rest
  ctx.fillRect(55, 130, 12, 70);
  ctx.fillRect(55, 125, 50, 8);
  // Legs
  ctx.fillRect(70, 207, 4, 55);
  ctx.fillRect(115, 207, 4, 55);
  // Wheels
  ctx.fillStyle = '#1a1a1a';
  ctx.beginPath(); ctx.arc(72, 264, 4, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(117, 264, 4, 0, Math.PI * 2); ctx.fill();

  // ── Desk (dark wood) ──
  ctx.fillStyle = '#3a2a1a';
  ctx.fillRect(100, 200, 160, 10); // desk top
  ctx.fillStyle = '#2a1a0e';
  ctx.fillRect(105, 210, 8, 55);  // left leg
  ctx.fillRect(248, 210, 8, 55);  // right leg
  // Desk panel
  ctx.fillStyle = '#322218';
  ctx.fillRect(105, 210, 151, 40);

  // ── Monitor on desk ──
  // Monitor base
  ctx.fillStyle = '#2a2a2a';
  ctx.fillRect(170, 190, 40, 10);
  // Monitor stand
  ctx.fillStyle = '#333333';
  ctx.fillRect(185, 150, 10, 42);
  // Monitor body
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(145, 100, 90, 55);
  // Screen (green glow)
  const screenGlow = ctx.createRadialGradient(190, 125, 5, 190, 125, 40);
  screenGlow.addColorStop(0, 'rgba(0,200,50,0.35)');
  screenGlow.addColorStop(1, 'rgba(0,100,30,0.1)');
  ctx.fillStyle = screenGlow;
  ctx.fillRect(150, 105, 80, 45);
  // Screen border
  ctx.strokeStyle = '#444444';
  ctx.lineWidth = 1;
  ctx.strokeRect(150, 105, 80, 45);
  // Fake text lines on screen
  ctx.fillStyle = 'rgba(0,200,50,0.3)';
  for (let i = 0; i < 5; i++) {
    ctx.fillRect(155, 112 + i * 7, 30 + Math.random() * 35, 2);
  }

  // ── Operative from 3/4 rear view ──
  const ox = 88, oy = 130; // origin point (center of torso)

  // Torso (tactical shirt, seen from slightly behind)
  ctx.fillStyle = PAL.tac1;
  ctx.fillRect(ox - 16, oy, 32, 36);
  // Vest
  ctx.fillStyle = PAL.vest0;
  ctx.fillRect(ox - 14, oy + 2, 10, 30);
  ctx.fillRect(ox + 4, oy + 2, 10, 30);
  // Shoulder straps
  ctx.fillStyle = PAL.vest1;
  ctx.fillRect(ox - 16, oy, 5, 8);
  ctx.fillRect(ox + 11, oy, 5, 8);

  // Head (3/4 rear)
  ctx.fillStyle = PAL.skin2;
  ctx.beginPath(); ctx.arc(ox, oy - 10, 11, 0, Math.PI * 2); ctx.fill();
  // Hair (back of head)
  ctx.fillStyle = PAL.hair0;
  ctx.beginPath();
  ctx.arc(ox - 2, oy - 12, 10, -Math.PI * 0.8, Math.PI * 0.1);
  ctx.fill();
  // Kippah
  ctx.fillStyle = PAL.kip1;
  ctx.beginPath();
  ctx.arc(ox, oy - 16, 7, Math.PI, 0);
  ctx.fill();
  // Ear (right side visible)
  ctx.fillStyle = PAL.skin1;
  ctx.beginPath(); ctx.arc(ox + 11, oy - 9, 3, 0, Math.PI * 2); ctx.fill();
  // Neck
  ctx.fillStyle = PAL.skin1;
  ctx.fillRect(ox - 5, oy - 2, 10, 5);

  // Arms on desk (reaching toward keyboard/mouse)
  // Left arm on keyboard
  ctx.fillStyle = PAL.tac2;
  ctx.save();
  ctx.translate(ox + 16, oy + 10);
  ctx.rotate(0.5);
  ctx.fillRect(0, -4, 40, 8);
  ctx.restore();
  // Left hand/glove
  ctx.fillStyle = PAL.blk1;
  ctx.fillRect(140, 196, 12, 6);

  // Right arm on mouse
  ctx.fillStyle = PAL.tac2;
  ctx.save();
  ctx.translate(ox + 16, oy + 22);
  ctx.rotate(0.3);
  ctx.fillRect(0, -4, 50, 8);
  ctx.restore();
  // Right hand/glove
  ctx.fillStyle = PAL.blk1;
  ctx.fillRect(158, 196, 12, 6);

  // ── Keyboard on desk ──
  ctx.fillStyle = '#222222';
  ctx.fillRect(128, 196, 30, 8);
  // Keys
  ctx.fillStyle = '#3a3a3a';
  for (let r = 0; r < 2; r++) {
    for (let k = 0; k < 6; k++) {
      ctx.fillRect(130 + k * 4, 197 + r * 3, 3, 2);
    }
  }

  // ── Coffee mug ──
  ctx.fillStyle = '#8a4420';
  ctx.fillRect(220, 188, 12, 14);
  // Handle
  ctx.strokeStyle = '#8a4420';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(234, 195, 4, -Math.PI / 2, Math.PI / 2); ctx.stroke();
  // Steam
  ctx.strokeStyle = 'rgba(200,200,200,0.15)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(224, 186); ctx.quadraticCurveTo(226, 178, 222, 172); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(228, 186); ctx.quadraticCurveTo(230, 180, 228, 174); ctx.stroke();

  // ── Faint green screen glow on operative ──
  const opGlow = ctx.createRadialGradient(190, 125, 10, 120, 150, 100);
  opGlow.addColorStop(0, 'rgba(0,200,50,0.06)');
  opGlow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = opGlow;
  ctx.fillRect(0, 0, cw, ch);

  scene.textures.addCanvas('operative_desk', c);
}
