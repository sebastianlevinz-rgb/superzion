// ═══════════════════════════════════════════════════════════════════
// SuperZion — Stealth operative sprite
// Dark tactical gear, no weapon. Kippah, golden Star of David.
// ═══════════════════════════════════════════════════════════════════

const SIZE = 128;
const MX = 64;

const PAL = {
  // Skin
  skin0: '#8a6040', skin1: '#b08657', skin2: '#c49668',
  skin3: '#d2a679', skin4: '#e0b689',

  // Hair (dark brown/black)
  hair0: '#0e0e0e', hair1: '#1c1610', hair2: '#2a2018', hair3: '#382c20',

  // Kippah blue
  kip0: '#0e1445', kip1: '#1a237e', kip2: '#283593',

  // Tactical (shirt + pants — military green)
  tac0: '#3a5530', tac1: '#4a6840', tac2: '#5a7a50',
  tac3: '#6a8a62', tac4: '#7a9a72',

  // Vest/harness — gray
  vest0: '#5a5a60', vest1: '#6a6a70', vest2: '#7a7a80',
  vest3: '#8a8a90', vest4: '#9a9a9a',

  // Dark brown (boots, gloves, belt)
  blk0: '#2a2018', blk1: '#3a3028', blk2: '#4a4038', blk3: '#5a5048',

  // Gold — Star of David + belt buckle
  gld0: '#806010', gld1: '#a07a18', gld2: '#c49520',
  gld3: '#daa520', gld4: '#eab530',

  // Eyes
  eyeWhite: '#eeeee8', eyeIris: '#3a2818', eyePupil: '#0e0e0e',
};

// ── HELPERS ─────────────────────────────────────────────────────

function px(ctx, x, y, color) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), 1, 1);
}

function pxRect(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), w, h);
}

function shadedRect(ctx, x, y, w, h, colors) {
  const n = colors.length;
  for (let row = 0; row < h; row++) {
    const ci = Math.min(Math.floor((row / h) * n), n - 1);
    pxRect(ctx, x, y + row, w, 1, colors[ci]);
  }
}

// ── STAR OF DAVID — small, fine lines, gold only ────────────────
function drawStar(ctx, cx, cy, r) {
  const drawTri = (rotation, fill) => {
    ctx.beginPath();
    for (let i = 0; i < 3; i++) {
      const a = rotation + (i * 2 * Math.PI) / 3;
      const tx = cx + Math.cos(a) * r;
      const ty = cy + Math.sin(a) * r;
      i === 0 ? ctx.moveTo(tx, ty) : ctx.lineTo(tx, ty);
    }
    ctx.closePath();
    if (fill) ctx.fill();
    ctx.stroke();
  };

  ctx.fillStyle = PAL.gld3;
  ctx.strokeStyle = PAL.gld1;
  ctx.lineWidth = 0.7;
  drawTri(-Math.PI / 2, true);
  drawTri(Math.PI / 2, true);

  ctx.strokeStyle = PAL.gld4;
  ctx.lineWidth = 0.5;
  drawTri(-Math.PI / 2, false);
  drawTri(Math.PI / 2, false);
}

// ── HEAD ────────────────────────────────────────────────────────
function drawHead(ctx, hx, hy) {
  // Face
  pxRect(ctx, hx - 9, hy - 6, 18, 15, PAL.skin3);
  pxRect(ctx, hx - 9, hy - 4, 2, 10, PAL.skin2);
  pxRect(ctx, hx + 7, hy - 4, 2, 10, PAL.skin2);
  pxRect(ctx, hx - 6, hy - 6, 12, 2, PAL.skin4);
  pxRect(ctx, hx - 7, hy + 6, 14, 2, PAL.skin2);
  pxRect(ctx, hx - 5, hy + 8, 10, 1, PAL.skin1);

  // Hair
  pxRect(ctx, hx - 10, hy - 13, 20, 7, PAL.hair1);
  pxRect(ctx, hx - 8, hy - 15, 16, 2, PAL.hair1);
  pxRect(ctx, hx - 6, hy - 16, 12, 1, PAL.hair2);
  pxRect(ctx, hx - 11, hy - 12, 2, 8, PAL.hair1);
  pxRect(ctx, hx + 9, hy - 12, 2, 8, PAL.hair1);
  px(ctx, hx - 5, hy - 14, PAL.hair3);
  px(ctx, hx - 1, hy - 13, PAL.hair3);
  px(ctx, hx + 3, hy - 14, PAL.hair3);
  px(ctx, hx + 6, hy - 13, PAL.hair2);
  px(ctx, hx - 7, hy - 12, PAL.hair2);
  px(ctx, hx + 2, hy - 12, PAL.hair3);
  pxRect(ctx, hx - 9, hy - 7, 18, 1, PAL.hair1);
  px(ctx, hx - 9, hy - 6, PAL.hair2);
  px(ctx, hx + 8, hy - 6, PAL.hair2);

  // Kippah
  pxRect(ctx, hx - 5, hy - 17, 10, 2, PAL.kip1);
  pxRect(ctx, hx - 4, hy - 18, 8, 1, PAL.kip2);
  pxRect(ctx, hx - 3, hy - 19, 6, 1, PAL.kip2);
  pxRect(ctx, hx - 5, hy - 15, 10, 1, PAL.gld3);
  px(ctx, hx - 2, hy - 18, PAL.gld1);
  px(ctx, hx + 1, hy - 17, PAL.gld1);
  px(ctx, hx + 3, hy - 18, PAL.gld1);

  // Eyes
  const eyeY = hy - 2;
  pxRect(ctx, hx - 7, eyeY, 5, 3, PAL.eyeWhite);
  pxRect(ctx, hx - 5, eyeY, 2, 3, PAL.eyeIris);
  px(ctx, hx - 5, eyeY + 1, PAL.eyePupil);
  px(ctx, hx - 4, eyeY + 1, PAL.eyePupil);
  pxRect(ctx, hx + 2, eyeY, 5, 3, PAL.eyeWhite);
  pxRect(ctx, hx + 3, eyeY, 2, 3, PAL.eyeIris);
  px(ctx, hx + 3, eyeY + 1, PAL.eyePupil);
  px(ctx, hx + 4, eyeY + 1, PAL.eyePupil);
  // Eyebrows
  pxRect(ctx, hx - 7, eyeY - 2, 5, 1, PAL.hair0);
  pxRect(ctx, hx + 2, eyeY - 2, 5, 1, PAL.hair0);

  // Nose
  px(ctx, hx, hy + 1, PAL.skin2);
  px(ctx, hx, hy + 2, PAL.skin1);
  px(ctx, hx - 1, hy + 3, PAL.skin1);
  px(ctx, hx + 1, hy + 3, PAL.skin1);

  // Mouth
  pxRect(ctx, hx - 3, hy + 4, 6, 1, PAL.skin0);
  pxRect(ctx, hx - 2, hy + 5, 4, 1, PAL.skin2);

  // Stubble
  for (let dy = 0; dy < 3; dy++) {
    for (let dx = -5; dx <= 5; dx++) {
      if ((dx + dy) % 3 === 0) px(ctx, hx + dx, hy + 4 + dy, PAL.skin1);
    }
  }

  // Ears
  pxRect(ctx, hx - 11, hy - 3, 2, 5, PAL.skin2);
  px(ctx, hx - 11, hy - 2, PAL.skin3);
  pxRect(ctx, hx + 9, hy - 3, 2, 5, PAL.skin2);
  px(ctx, hx + 10, hy - 2, PAL.skin3);

  // Jaw shadow
  pxRect(ctx, hx - 8, hy + 8, 16, 1, PAL.skin0);

  // Neck
  pxRect(ctx, hx - 4, hy + 9, 8, 3, PAL.skin2);
  pxRect(ctx, hx - 3, hy + 9, 6, 1, PAL.skin3);
}

// ── TORSO — dark tactical top + vest/harness ────────────────────
function drawTorso(ctx, tx, ty) {
  const tw = 14, th = 24;

  // Dark tactical shirt base
  shadedRect(ctx, tx - tw, ty, tw * 2, th,
    [PAL.tac3, PAL.tac3, PAL.tac2, PAL.tac2, PAL.tac1, PAL.tac1, PAL.tac0]);
  // High collar (turtleneck style)
  pxRect(ctx, tx - 5, ty, 10, 3, PAL.tac4);
  pxRect(ctx, tx - tw, ty + 1, 3, 2, PAL.tac4);
  pxRect(ctx, tx + tw - 3, ty + 1, 3, 2, PAL.tac4);

  // Tactical vest/harness — slightly lighter
  const vw = 11;
  for (let col = -vw; col < vw; col++) {
    const d = Math.abs(col) / vw;
    const tones = d > 0.7
      ? [PAL.vest0, PAL.vest0, PAL.vest1]
      : d > 0.3
        ? [PAL.vest1, PAL.vest2, PAL.vest2]
        : [PAL.vest2, PAL.vest3, PAL.vest3];
    for (let row = 4; row < th - 3; row++) {
      const ri = Math.min(Math.floor((row / th) * tones.length), tones.length - 1);
      px(ctx, tx + col, ty + row, tones[ri]);
    }
  }
  pxRect(ctx, tx - vw, ty + 4, vw * 2, 1, PAL.vest4);

  // Stitching on vest
  for (const xOff of [-7, -2, 3, 8]) {
    for (let row = 6; row < th - 5; row += 2) {
      px(ctx, tx + xOff, ty + row, PAL.vest0);
    }
  }

  // Utility pouches (smaller, tactical)
  const pocketDraw = (px2, py) => {
    pxRect(ctx, px2, py, 5, 4, PAL.vest1);
    pxRect(ctx, px2, py, 5, 1, PAL.vest3);
    pxRect(ctx, px2 + 1, py + 2, 2, 1, PAL.blk2);
  };
  pocketDraw(tx - 10, ty + 8);
  pocketDraw(tx + 5, ty + 8);

  // Shoulder straps
  for (const side of [-1, 1]) {
    const sx = tx + side * (tw - 2);
    pxRect(ctx, sx - 1, ty + 3, 3, th - 6, PAL.vest0);
    pxRect(ctx, sx, ty + 3, 1, th - 6, PAL.vest1);
  }

  // ★ STAR OF DAVID — small, fine, gold, centered on chest ★
  drawStar(ctx, tx, ty + 14, 5);

  // Utility belt
  pxRect(ctx, tx - tw, ty + th - 3, tw * 2, 3, PAL.blk1);
  pxRect(ctx, tx - tw, ty + th - 3, tw * 2, 1, PAL.blk2);
  // Gold buckle
  pxRect(ctx, tx - 2, ty + th - 3, 4, 3, PAL.gld2);
  px(ctx, tx, ty + th - 2, PAL.gld4);
  // Small side pouch on belt
  pxRect(ctx, tx + 8, ty + th - 3, 4, 3, PAL.vest1);
  pxRect(ctx, tx + 8, ty + th - 3, 4, 1, PAL.vest3);
}

// ── ARM — long sleeve tactical + glove ──────────────────────────
function drawArm(ctx, ax, ay, len) {
  // Long sleeve (dark tactical fabric)
  shadedRect(ctx, ax - 3, ay, 6, len - 4,
    [PAL.tac3, PAL.tac2, PAL.tac2, PAL.tac1]);
  pxRect(ctx, ax - 2, ay, 3, 1, PAL.tac4);
  // Cuff
  pxRect(ctx, ax - 3, ay + len - 6, 6, 2, PAL.tac4);

  // Tactical gloves
  const gloveY = ay + len - 4;
  shadedRect(ctx, ax - 3, gloveY, 6, 4,
    [PAL.blk2, PAL.blk1, PAL.blk0, PAL.blk0]);
  px(ctx, ax - 1, gloveY + 1, PAL.blk3);
  px(ctx, ax + 1, gloveY + 1, PAL.blk3);
}

// ── LEGS — dark tactical pants ──────────────────────────────────
function drawLeg(ctx, lx, ly, h, side) {
  const w = 7;
  const thighH = Math.floor(h * 0.48);
  const kneeH = 3;
  const bootH = 5;
  const shinH = h - thighH - kneeH - bootH;

  // Thigh — dark tactical
  shadedRect(ctx, lx, ly, w, thighH,
    [PAL.tac3, PAL.tac2, PAL.tac2, PAL.tac1]);
  // Pocket
  if (side === 'left') {
    pxRect(ctx, lx, ly + 2, 4, 3, PAL.tac1);
    pxRect(ctx, lx, ly + 2, 4, 1, PAL.tac3);
  } else {
    pxRect(ctx, lx + 3, ly + 2, 4, 3, PAL.tac1);
    pxRect(ctx, lx + 3, ly + 2, 4, 1, PAL.tac3);
  }

  // Knee pad
  const kneeY = ly + thighH;
  pxRect(ctx, lx, kneeY, w, kneeH, PAL.vest2);
  pxRect(ctx, lx, kneeY, w, 1, PAL.vest4);
  pxRect(ctx, lx, kneeY + kneeH - 1, w, 1, PAL.vest0);

  // Shin
  const shinY = kneeY + kneeH;
  shadedRect(ctx, lx, shinY, w, shinH,
    [PAL.tac2, PAL.tac1, PAL.tac1]);

  // Boot
  const bootY = shinY + shinH;
  shadedRect(ctx, lx, bootY, w, bootH,
    [PAL.blk2, PAL.blk1, PAL.blk1, PAL.blk0, PAL.blk0]);
  px(ctx, lx + 2, bootY + 1, PAL.blk3);
  px(ctx, lx + 4, bootY + 1, PAL.blk3);
  // Sole
  pxRect(ctx, lx, bootY + bootH - 1, w + 1, 1, PAL.blk0);
}

// ── COMPOSE FRAME ───────────────────────────────────────────────
function drawOperativeFrame(opts = {}) {
  const canvas = document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext('2d');

  const {
    bodyBob = 0,
    legL = 0,
    legR = 0,
    armSwing = 0,
  } = opts;

  const headCY = 18 + bodyBob;
  const torsoY = headCY + 16;
  const hipY = torsoY + 24;
  const legH = 28;
  const armLen = 18;

  // Left arm (behind body)
  ctx.save();
  ctx.translate(MX - 15, torsoY + 2);
  ctx.rotate(-armSwing);
  drawArm(ctx, 0, 0, armLen);
  ctx.restore();

  // Legs
  drawLeg(ctx, MX - 10, hipY + legL, legH, 'left');
  drawLeg(ctx, MX + 3, hipY + legR, legH, 'right');

  // Torso
  drawTorso(ctx, MX, torsoY);

  // Right arm (in front)
  ctx.save();
  ctx.translate(MX + 14, torsoY + 2);
  ctx.rotate(armSwing);
  drawArm(ctx, 0, 0, armLen);
  ctx.restore();

  // Head
  drawHead(ctx, MX, headCY);

  return canvas;
}

// ── SPRITESHEET ─────────────────────────────────────────────────

export function generateSpriteSheet(scene) {
  const frames = [];
  const names = [];

  function add(name, opts) {
    frames.push(drawOperativeFrame(opts));
    names.push(name);
  }

  // Idle
  add('idle_0', { bodyBob: 0 });
  add('idle_1', { bodyBob: -1 });

  // Run (arms swing opposite to legs)
  for (let i = 0; i < 6; i++) {
    const p = (i / 6) * Math.PI * 2;
    add(`run_${i}`, {
      legL: Math.sin(p) * 8,
      legR: Math.sin(p + Math.PI) * 8,
      bodyBob: Math.abs(Math.sin(p)) * -2,
      armSwing: Math.sin(p) * 0.12,
    });
  }

  // Jump
  add('jump_0', { bodyBob: 2, legL: 4, legR: 4, armSwing: -0.15 });
  add('jump_1', { bodyBob: -2, legL: -5, legR: -3, armSwing: -0.2 });

  // Fall
  add('fall_0', { bodyBob: 1, legL: 4, legR: 7, armSwing: 0.1 });

  // Action (planting) — crouching pose
  add('shoot_0', { bodyBob: 2, armSwing: 0.25 });
  add('shoot_1', { bodyBob: 1, armSwing: 0.2 });

  const total = frames.length;
  const sheet = document.createElement('canvas');
  sheet.width = total * SIZE;
  sheet.height = SIZE;
  const sctx = sheet.getContext('2d');
  frames.forEach((f, i) => sctx.drawImage(f, i * SIZE, 0));

  scene.textures.addCanvas('superzion', sheet);

  const frameData = {};
  names.forEach((name, i) => {
    scene.textures.get('superzion').add(i + 1, 0, i * SIZE, 0, SIZE, SIZE);
    frameData[name] = i + 1;
  });

  return frameData;
}

export function createAnimations(scene, frameData) {
  scene.anims.create({
    key: 'idle',
    frames: [
      { key: 'superzion', frame: frameData['idle_0'] },
      { key: 'superzion', frame: frameData['idle_1'] },
    ],
    frameRate: 3,
    repeat: -1,
  });

  scene.anims.create({
    key: 'run',
    frames: Array.from({ length: 6 }, (_, i) => ({
      key: 'superzion',
      frame: frameData[`run_${i}`],
    })),
    frameRate: 10,
    repeat: -1,
  });

  scene.anims.create({
    key: 'jump',
    frames: [
      { key: 'superzion', frame: frameData['jump_0'] },
      { key: 'superzion', frame: frameData['jump_1'] },
    ],
    frameRate: 6,
    repeat: 0,
  });

  scene.anims.create({
    key: 'fall',
    frames: [{ key: 'superzion', frame: frameData['fall_0'] }],
    frameRate: 1,
    repeat: -1,
  });

  scene.anims.create({
    key: 'shoot',
    frames: [
      { key: 'superzion', frame: frameData['shoot_0'] },
      { key: 'superzion', frame: frameData['shoot_1'] },
    ],
    frameRate: 8,
    repeat: 0,
  });
}
