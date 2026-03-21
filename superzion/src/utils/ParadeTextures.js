// ═══════════════════════════════════════════════════════════════
// ParadeTextures.js — Procedural textures for Epic Parade Intro
// Flags (waving), boss parade sprites, soldiers, vehicles, hero
// ═══════════════════════════════════════════════════════════════

// ── WAVING FLAG SPRITESHEET HELPER ──────────────────────────
function wavingSheet(scene, key, drawFn, w = 140, h = 90) {
  const N = 4, eh = h + 14;
  if (scene.textures.exists(key)) scene.textures.remove(key);
  const base = document.createElement('canvas');
  base.width = w; base.height = h;
  drawFn(base.getContext('2d'), w, h);
  const sheet = document.createElement('canvas');
  sheet.width = w * N; sheet.height = eh;
  const sc = sheet.getContext('2d');
  for (let f = 0; f < N; f++) {
    const ph = (f / N) * Math.PI * 2;
    for (let x = 0; x < w; x++) {
      const amp = (x / w) * 6;
      const yOff = Math.sin(x * 0.1 + ph) * amp + 7;
      sc.drawImage(base, x, 0, 1, h, f * w + x, yOff, 1, h);
    }
  }
  scene.textures.addCanvas(key, sheet);
  for (let i = 0; i < N; i++)
    scene.textures.get(key).add(i + 1, 0, i * w, 0, w, eh);
  if (scene.anims.exists(key + '_wave')) scene.anims.remove(key + '_wave');
  scene.anims.create({
    key: key + '_wave',
    frames: Array.from({ length: N }, (_, i) => ({ key, frame: i + 1 })),
    frameRate: 8, repeat: -1,
  });
}

// ── STAR OF DAVID HELPER ────────────────────────────────────
function starOfDavid(ctx, cx, cy, r, color, fill = false) {
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = Math.max(1.5, r * 0.18);
  for (const rot of [-Math.PI / 2, Math.PI / 2]) {
    ctx.beginPath();
    for (let i = 0; i < 3; i++) {
      const a = rot + (i * 2 * Math.PI) / 3;
      const x = cx + Math.cos(a) * r;
      const y = cy + Math.sin(a) * r;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.closePath();
    if (fill) ctx.fill();
    ctx.stroke();
  }
}

// ── STATIC SPRITE HELPER (single frame, no walk sheet) ──────
function staticSprite(scene, key, drawFn, w, h) {
  if (scene.textures.exists(key)) scene.textures.remove(key);
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  drawFn(c.getContext('2d'), w, h);
  scene.textures.addCanvas(key, c);
}

// ═════════════════════════════════════════════════════════════
// FLAGS
// ═════════════════════════════════════════════════════════════

export function createIranFlag(scene) {
  wavingSheet(scene, 'flag_iran', (ctx, w, h) => {
    const s = h / 3;
    // Green stripe
    ctx.fillStyle = '#009b3a';
    ctx.fillRect(0, 0, w, s);
    // White stripe
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, s, w, s);
    // Red stripe
    ctx.fillStyle = '#c8102e';
    ctx.fillRect(0, s * 2, w, s);
    // Decorative Kufic borders
    for (let x = 0; x < w; x += 5) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x, s - 2, 3, 4);
      ctx.fillRect(x + 2, s * 2 - 2, 3, 4);
    }
    // Central emblem (stylized tulip/sword)
    const cx = w / 2, cy = h / 2;
    ctx.fillStyle = '#c8102e';
    ctx.beginPath();
    ctx.moveTo(cx, cy - 14);
    ctx.lineTo(cx + 5, cy - 6);
    ctx.lineTo(cx + 10, cy + 2);
    ctx.lineTo(cx + 7, cy + 6);
    ctx.lineTo(cx + 3, cy + 10);
    ctx.lineTo(cx, cy + 12);
    ctx.lineTo(cx - 3, cy + 10);
    ctx.lineTo(cx - 7, cy + 6);
    ctx.lineTo(cx - 10, cy + 2);
    ctx.lineTo(cx - 5, cy - 6);
    ctx.closePath();
    ctx.fill();
    // Inner detail
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(cx, cy, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#c8102e';
    ctx.fillRect(cx - 1, cy - 6, 2, 12);
  }, 140, 90);
}

export function createLebanonFlag(scene) {
  wavingSheet(scene, 'flag_lebanon', (ctx, w, h) => {
    // Red-White-Red (1:2:1 proportions)
    const rs = h / 4;
    ctx.fillStyle = '#ee161f';
    ctx.fillRect(0, 0, w, rs);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, rs, w, rs * 2);
    ctx.fillStyle = '#ee161f';
    ctx.fillRect(0, rs * 3, w, rs);
    // Green Cedar of Lebanon
    const cx = w / 2, cy = h / 2;
    ctx.fillStyle = '#006233';
    // Trunk
    ctx.fillRect(cx - 2, cy + 6, 4, 10);
    // Tree layers (3 triangle tiers)
    for (let i = 0; i < 4; i++) {
      const ty = cy - 18 + i * 8;
      const tw = 5 + i * 5;
      ctx.beginPath();
      ctx.moveTo(cx, ty);
      ctx.lineTo(cx + tw, ty + 10);
      ctx.lineTo(cx - tw, ty + 10);
      ctx.closePath();
      ctx.fill();
    }
  }, 140, 90);
}

export function createPalestineFlag(scene) {
  wavingSheet(scene, 'flag_palestine', (ctx, w, h) => {
    const s = h / 3;
    // Black stripe
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, w, s);
    // White stripe
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, s, w, s);
    // Green stripe
    ctx.fillStyle = '#007a3d';
    ctx.fillRect(0, s * 2, w, s);
    // Red triangle on left (hoist side)
    ctx.fillStyle = '#ce1126';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(w * 0.35, h / 2);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fill();
  }, 140, 90);
}

export function createIsraelFlag(scene) {
  wavingSheet(scene, 'flag_israel', (ctx, w, h) => {
    // White background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);
    // Blue stripes
    const sh = h * 0.12;
    ctx.fillStyle = '#0038b8';
    ctx.fillRect(0, h * 0.18, w, sh);
    ctx.fillRect(0, h * 0.70, w, sh);
    // Star of David
    starOfDavid(ctx, w / 2, h / 2, h * 0.22, '#0038b8', false);
  }, 140, 90);
}

export function createEnemyFlag(scene) {
  wavingSheet(scene, 'flag_enemy', (ctx, w, h) => {
    // Black background
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, w, h);
    // Red crescent moon
    const cx = w / 2, cy = h / 2;
    ctx.fillStyle = '#cc0000';
    ctx.beginPath();
    ctx.arc(cx, cy, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0a0a0a';
    ctx.beginPath();
    ctx.arc(cx + 7, cy - 3, 16, 0, Math.PI * 2);
    ctx.fill();
    // Red sword
    ctx.fillStyle = '#cc0000';
    ctx.fillRect(cx - 1, cy - 20, 2, 40);
    ctx.beginPath();
    ctx.moveTo(cx, cy - 22);
    ctx.lineTo(cx + 4, cy - 16);
    ctx.lineTo(cx - 4, cy - 16);
    ctx.closePath();
    ctx.fill();
    // Crossguard
    ctx.fillRect(cx - 6, cy + 12, 12, 3);
  }, 140, 90);
}

// ═════════════════════════════════════════════════════════════
// BOSS PARADE SPRITES (facing left, static pose)
// ═════════════════════════════════════════════════════════════

export function createFoamBeardParade(scene) {
  staticSprite(scene, 'parade_foambeard', (ctx, w, h) => {
    const cx = w / 2, by = h - 4;
    // Legs (dark suit pants) — tapered ellipses
    ctx.fillStyle = '#1a1a2a';
    ctx.beginPath();
    ctx.ellipse(cx - 5.5, by - 20, 3.5, 14, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx + 5.5, by - 18, 3.5, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    // Shoes — rounded arc-based shapes
    ctx.fillStyle = '#0a0a0a';
    ctx.beginPath();
    ctx.ellipse(cx - 5.5, by - 3, 5, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx + 5.5, by - 3, 5, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    // Body (dark suit) — bezier trapezoid
    ctx.fillStyle = '#1a1a2a';
    ctx.beginPath();
    ctx.moveTo(cx - 12, by - 60);
    ctx.bezierCurveTo(cx - 14, by - 54, cx - 14, by - 36, cx - 12, by - 30);
    ctx.lineTo(cx + 12, by - 30);
    ctx.bezierCurveTo(cx + 14, by - 36, cx + 14, by - 54, cx + 12, by - 60);
    ctx.closePath();
    ctx.fill();
    // White shirt
    ctx.fillStyle = '#e8e8e8';
    ctx.beginPath();
    ctx.ellipse(cx, by - 58, 5, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    // Red tie
    ctx.fillStyle = '#8a1020';
    ctx.beginPath();
    ctx.moveTo(cx - 2, by - 55);
    ctx.quadraticCurveTo(cx - 3, by - 46, cx, by - 37);
    ctx.quadraticCurveTo(cx + 3, by - 46, cx + 2, by - 55);
    ctx.closePath();
    ctx.fill();
    // Arms (suit) — ellipses
    ctx.fillStyle = '#1a1a2a';
    ctx.beginPath();
    ctx.ellipse(cx - 16, by - 46, 3, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx + 16, by - 45, 3, 11, 0, 0, Math.PI * 2);
    ctx.fill();
    // Hands — small ellipses
    ctx.fillStyle = '#c8a080';
    ctx.beginPath();
    ctx.ellipse(cx - 16, by - 33, 3, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx + 16, by - 33, 3, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();
    // Neck — small ellipse
    ctx.fillStyle = '#c8a080';
    ctx.beginPath();
    ctx.ellipse(cx, by - 62, 4, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();
    // Head (bald egg shape)
    ctx.fillStyle = '#c8a080';
    ctx.beginPath();
    ctx.ellipse(cx, by - 78, 13, 16, 0, 0, Math.PI * 2);
    ctx.fill();
    // Bald shiny top
    ctx.fillStyle = '#d8b890';
    ctx.beginPath();
    ctx.ellipse(cx, by - 88, 10, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    // Sparse gray hair on sides
    ctx.fillStyle = '#888888';
    ctx.fillRect(cx - 13, by - 78, 3, 8);
    ctx.fillRect(cx + 10, by - 78, 3, 8);
    // Wire-frame glasses
    ctx.strokeStyle = '#999999';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(cx - 11, by - 80, 9, 7);
    ctx.strokeRect(cx + 2, by - 80, 9, 7);
    ctx.beginPath(); ctx.moveTo(cx - 2, by - 77); ctx.lineTo(cx + 2, by - 77); ctx.stroke();
    // Lens fill
    ctx.fillStyle = 'rgba(180,200,220,0.35)';
    ctx.fillRect(cx - 11, by - 80, 9, 7);
    ctx.fillRect(cx + 2, by - 80, 9, 7);
    // Eyes behind glasses
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(cx - 7, by - 78, 2, 2);
    ctx.fillRect(cx + 5, by - 78, 2, 2);
    // White foam beard (short, textured)
    ctx.fillStyle = '#d8d4cc';
    ctx.beginPath();
    ctx.ellipse(cx, by - 68, 11, 7, 0, 0.2, Math.PI - 0.2);
    ctx.fill();
    ctx.fillStyle = '#eae6e0';
    for (let i = 0; i < 20; i++) {
      ctx.fillRect(cx - 9 + Math.random() * 18, by - 74 + Math.random() * 10, 1, 1);
    }
    // Arrogant smirk
    ctx.strokeStyle = '#6a4030';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx - 4, by - 70);
    ctx.quadraticCurveTo(cx + 2, by - 68, cx + 5, by - 71);
    ctx.stroke();
  }, 60, 110);
}

export function createTurboTurbanParade(scene) {
  staticSprite(scene, 'parade_turboturban', (ctx, w, h) => {
    const cx = w / 2, by = h - 4;
    // Legs (dark robe split) — tapered ellipses
    ctx.fillStyle = '#1a1a22';
    ctx.beginPath();
    ctx.ellipse(cx - 6, by - 18, 4, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx + 6, by - 16, 4, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    // Sandals/boots — rounded ellipses
    ctx.fillStyle = '#1a1008';
    ctx.beginPath();
    ctx.ellipse(cx - 6, by - 3, 5.5, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx + 6, by - 3, 5.5, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    // Dark robe body
    ctx.fillStyle = '#1a1a22';
    ctx.beginPath();
    ctx.moveTo(cx - 16, by - 56);
    ctx.lineTo(cx + 16, by - 56);
    ctx.lineTo(cx + 20, by - 30);
    ctx.lineTo(cx - 20, by - 30);
    ctx.closePath();
    ctx.fill();
    // Robe folds
    ctx.strokeStyle = '#2a2a38';
    ctx.lineWidth = 1;
    for (let i = 0; i < 4; i++) {
      const ry = by - 54 + i * 6;
      ctx.beginPath();
      ctx.moveTo(cx - 14, ry);
      ctx.quadraticCurveTo(cx, ry + 2, cx + 14, ry);
      ctx.stroke();
    }
    // Arms (pointing left, threatening) — ellipses
    ctx.fillStyle = '#1a1a22';
    ctx.beginPath();
    ctx.ellipse(cx - 18.5, by - 44, 3.5, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.save();
    ctx.translate(cx + 17.5, by - 43);
    ctx.rotate(-0.4);
    ctx.beginPath();
    ctx.ellipse(0, 0, 3.5, 11, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    // Pointing hand — small ellipse + finger
    ctx.fillStyle = '#c4956a';
    ctx.beginPath();
    ctx.ellipse(cx + 30, by - 64, 3, 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx + 35, by - 66, 3.5, 1.2, -0.3, 0, Math.PI * 2);
    ctx.fill();
    // Left hand — small ellipse
    ctx.fillStyle = '#c4956a';
    ctx.beginPath();
    ctx.ellipse(cx - 18.5, by - 34, 3.5, 2, 0, 0, Math.PI * 2);
    ctx.fill();
    // Neck — small ellipse
    ctx.fillStyle = '#c4956a';
    ctx.beginPath();
    ctx.ellipse(cx, by - 57.5, 4, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();
    // Head
    ctx.fillStyle = '#c4956a';
    ctx.beginPath();
    ctx.ellipse(cx, by - 72, 12, 14, 0, 0, Math.PI * 2);
    ctx.fill();
    // MASSIVE BLACK TURBAN (1/3 of sprite height)
    ctx.fillStyle = '#111111';
    ctx.beginPath();
    ctx.ellipse(cx, by - 94, 16, 20, 0, 0, Math.PI * 2);
    ctx.fill();
    // Turban wrapping lines
    ctx.strokeStyle = '#222222';
    ctx.lineWidth = 1;
    for (let i = 0; i < 6; i++) {
      const ty = by - 104 + i * 4;
      ctx.beginPath();
      ctx.moveTo(cx - 14, ty);
      ctx.quadraticCurveTo(cx, ty - 2, cx + 14, ty);
      ctx.stroke();
    }
    // Opaque rectangular glasses
    ctx.fillStyle = '#111111';
    ctx.fillRect(cx - 12, by - 76, 10, 7);
    ctx.fillRect(cx + 2, by - 76, 10, 7);
    ctx.strokeStyle = '#444444';
    ctx.lineWidth = 1;
    ctx.strokeRect(cx - 12, by - 76, 10, 7);
    ctx.strokeRect(cx + 2, by - 76, 10, 7);
    // Bridge
    ctx.fillStyle = '#444444';
    ctx.fillRect(cx - 2, by - 74, 4, 2);
    // Reflection on glasses
    ctx.fillStyle = 'rgba(100,150,200,0.15)';
    ctx.fillRect(cx - 10, by - 75, 4, 2);
    ctx.fillRect(cx + 4, by - 75, 4, 2);
    // Thick eyebrows above glasses
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(cx - 12, by - 78, 10, 2);
    ctx.fillRect(cx + 2, by - 78, 10, 2);
    // Long gray/white beard
    ctx.fillStyle = '#cccccc';
    ctx.beginPath();
    ctx.moveTo(cx - 10, by - 66);
    ctx.lineTo(cx - 8, by - 50);
    ctx.lineTo(cx - 4, by - 42);
    ctx.lineTo(cx, by - 38);
    ctx.lineTo(cx + 4, by - 42);
    ctx.lineTo(cx + 8, by - 50);
    ctx.lineTo(cx + 10, by - 66);
    ctx.closePath();
    ctx.fill();
    // Beard strands
    ctx.strokeStyle = '#dddddd';
    ctx.lineWidth = 0.8;
    for (let i = 0; i < 8; i++) {
      const sx = cx - 7 + i * 2;
      ctx.beginPath();
      ctx.moveTo(sx, by - 66);
      ctx.lineTo(sx + (Math.random() - 0.5) * 3, by - 44);
      ctx.stroke();
    }
  }, 70, 120);
}

export function createWardenParade(scene) {
  staticSprite(scene, 'parade_warden', (ctx, w, h) => {
    const cx = w / 2, by = h - 4;
    // Legs (military pants) — tapered ellipses
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath();
    ctx.ellipse(cx - 5.5, by - 19, 3.5, 13, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx + 5.5, by - 17, 3.5, 11, 0, 0, Math.PI * 2);
    ctx.fill();
    // Combat boots — rounded arc-based shapes
    ctx.fillStyle = '#2a1810';
    ctx.beginPath();
    ctx.ellipse(cx - 5.5, by - 3, 5, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx + 5.5, by - 3, 5, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    // Military body — bezier trapezoid
    ctx.fillStyle = '#222222';
    ctx.beginPath();
    ctx.moveTo(cx - 13, by - 58);
    ctx.bezierCurveTo(cx - 15, by - 50, cx - 15, by - 36, cx - 13, by - 30);
    ctx.lineTo(cx + 13, by - 30);
    ctx.bezierCurveTo(cx + 15, by - 36, cx + 15, by - 50, cx + 13, by - 58);
    ctx.closePath();
    ctx.fill();
    // Vest/harness — curved shape
    ctx.fillStyle = '#5a5a60';
    ctx.beginPath();
    ctx.moveTo(cx - 11, by - 56);
    ctx.bezierCurveTo(cx - 12, by - 48, cx - 12, by - 38, cx - 11, by - 32);
    ctx.lineTo(cx + 11, by - 32);
    ctx.bezierCurveTo(cx + 12, by - 38, cx + 12, by - 48, cx + 11, by - 56);
    ctx.closePath();
    ctx.fill();
    // Chest pouches — small rounded rects via arc corners
    ctx.fillStyle = '#4a4a50';
    ctx.beginPath();
    ctx.ellipse(cx - 7, by - 45.5, 3.5, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx + 7, by - 45.5, 3.5, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();
    // Arms (left straight, right raised) — ellipses
    ctx.fillStyle = '#222222';
    ctx.beginPath();
    ctx.ellipse(cx - 17, by - 45, 3, 11, 0, 0, Math.PI * 2);
    ctx.fill();
    // Raised right arm with fist
    ctx.save();
    ctx.translate(cx + 17, by - 46);
    ctx.rotate(-0.8);
    ctx.fillStyle = '#222222';
    ctx.beginPath();
    ctx.ellipse(0, 0, 3, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#7a5030';
    ctx.beginPath();
    ctx.ellipse(0, -12, 3.5, 2.5, 0, 0, Math.PI * 2); // fist
    ctx.fill();
    ctx.restore();
    // Left hand — small ellipse
    ctx.fillStyle = '#7a5030';
    ctx.beginPath();
    ctx.ellipse(cx - 17, by - 34, 3, 2, 0, 0, Math.PI * 2);
    ctx.fill();
    // Neck (thick) — ellipse
    ctx.fillStyle = '#7a5030';
    ctx.beginPath();
    ctx.ellipse(cx, by - 60, 5, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();
    // Head (angular, scarred) — keep military shape, soften corners with curves
    ctx.fillStyle = '#7a5030';
    ctx.beginPath();
    ctx.moveTo(cx - 10, by - 64);
    ctx.quadraticCurveTo(cx - 12, by - 64, cx - 12, by - 66);
    ctx.lineTo(cx + 12, by - 66);
    ctx.quadraticCurveTo(cx + 12, by - 64, cx + 10, by - 64);
    ctx.lineTo(cx + 13, by - 74);
    ctx.quadraticCurveTo(cx + 14, by - 74, cx + 12, by - 84);
    ctx.lineTo(cx - 12, by - 84);
    ctx.quadraticCurveTo(cx - 14, by - 74, cx - 13, by - 74);
    ctx.closePath();
    ctx.fill();
    // Scars
    ctx.strokeStyle = '#5a3018';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx - 8, by - 82);
    ctx.lineTo(cx - 4, by - 70);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx + 6, by - 80);
    ctx.lineTo(cx + 8, by - 72);
    ctx.stroke();
    // Massive eyebrows
    ctx.fillStyle = '#0a0804';
    ctx.beginPath();
    ctx.moveTo(cx - 14, by - 80);
    ctx.lineTo(cx - 2, by - 76);
    ctx.lineTo(cx - 2, by - 78);
    ctx.lineTo(cx - 14, by - 83);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(cx + 14, by - 80);
    ctx.lineTo(cx + 2, by - 76);
    ctx.lineTo(cx + 2, by - 78);
    ctx.lineTo(cx + 14, by - 83);
    ctx.closePath();
    ctx.fill();
    // Eyes (narrow, hateful)
    ctx.fillStyle = '#eee8d0';
    ctx.fillRect(cx - 9, by - 78, 6, 3);
    ctx.fillRect(cx + 3, by - 78, 6, 3);
    ctx.fillStyle = '#331100';
    ctx.fillRect(cx - 7, by - 77, 2, 2);
    ctx.fillRect(cx + 5, by - 77, 2, 2);
    // Nose
    ctx.fillStyle = '#6a4020';
    ctx.fillRect(cx - 2, by - 75, 4, 5);
    // Snarling mouth
    ctx.fillStyle = '#2a0a05';
    ctx.fillRect(cx - 6, by - 68, 12, 3);
    ctx.fillStyle = '#ddd8c0';
    for (let t = -2; t <= 2; t++) ctx.fillRect(cx + t * 3, by - 68, 2, 2);
    // Keffiyeh (tan headwrap)
    ctx.fillStyle = '#8a8070';
    ctx.beginPath();
    ctx.moveTo(cx - 16, by - 84);
    ctx.lineTo(cx + 16, by - 84);
    ctx.lineTo(cx + 18, by - 96);
    ctx.lineTo(cx + 14, by - 102);
    ctx.lineTo(cx - 14, by - 102);
    ctx.lineTo(cx - 18, by - 96);
    ctx.closePath();
    ctx.fill();
    // Keffiyeh drapes
    ctx.fillStyle = '#7a7060';
    ctx.fillRect(cx - 18, by - 86, 6, 16);
    ctx.fillRect(cx + 12, by - 86, 6, 16);
    // Crosshatch pattern
    ctx.strokeStyle = '#6a6055';
    ctx.lineWidth = 0.8;
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.moveTo(cx - 14 + i * 6, by - 100);
      ctx.lineTo(cx - 10 + i * 6, by - 86);
      ctx.stroke();
    }
    // Black agal (rope band)
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(cx - 15, by - 86, 30, 3);
  }, 64, 110);
}

export function createSupremeTurbanParade(scene) {
  staticSprite(scene, 'parade_supremeturban', (ctx, w, h) => {
    const cx = w / 2, by = h - 4;
    // Legs (hidden under long robes) — tapered ellipses
    ctx.fillStyle = '#1a1812';
    ctx.beginPath();
    ctx.ellipse(cx - 7, by - 17, 5, 11, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx + 7, by - 15, 5, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    // Sandals/footwear — rounded ellipses
    ctx.fillStyle = '#0a0806';
    ctx.beginPath();
    ctx.ellipse(cx - 8, by - 3, 6.5, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx + 8, by - 3, 6.5, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    // Long dark robes
    ctx.fillStyle = '#1a1812';
    ctx.beginPath();
    ctx.moveTo(cx - 30, by - 70);
    ctx.lineTo(cx + 30, by - 70);
    ctx.lineTo(cx + 36, by - 28);
    ctx.lineTo(cx - 36, by - 28);
    ctx.closePath();
    ctx.fill();
    // Robe texture
    ctx.strokeStyle = '#2a2818';
    ctx.lineWidth = 1;
    for (let i = 0; i < 6; i++) {
      const ry = by - 68 + i * 7;
      ctx.beginPath();
      ctx.moveTo(cx - 28, ry);
      ctx.quadraticCurveTo(cx, ry + 3, cx + 28, ry);
      ctx.stroke();
    }
    // Staff (right hand, tall with crescent)
    ctx.strokeStyle = '#3a2a18';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(cx + 32, by - 130);
    ctx.lineTo(cx + 28, by - 10);
    ctx.stroke();
    // Pulsing light dots along the staff
    ctx.fillStyle = 'rgba(255, 200, 50, 0.4)';
    for (const sy of [by - 50, by - 80, by - 110]) {
      ctx.beginPath();
      ctx.arc(cx + 30, sy, 2, 0, Math.PI * 2);
      ctx.fill();
    }
    // Crescent moon on staff top — bright gold
    ctx.fillStyle = '#ffaa00';
    ctx.beginPath();
    ctx.arc(cx + 33, by - 136, 8, Math.PI * 0.7, Math.PI * 2.3);
    ctx.fill();
    ctx.fillStyle = '#1a1812';
    ctx.beginPath();
    ctx.arc(cx + 37, by - 138, 6, 0, Math.PI * 2);
    ctx.fill();
    // Staff glow — outer ring
    ctx.fillStyle = 'rgba(255, 120, 0, 0.2)';
    ctx.beginPath();
    ctx.arc(cx + 33, by - 136, 30, 0, Math.PI * 2);
    ctx.fill();
    // Staff glow — inner ring
    ctx.fillStyle = 'rgba(255, 160, 0, 0.5)';
    ctx.beginPath();
    ctx.arc(cx + 33, by - 136, 22, 0, Math.PI * 2);
    ctx.fill();
    // Arms — ellipses
    ctx.fillStyle = '#1a1812';
    ctx.beginPath();
    ctx.ellipse(cx - 30, by - 54, 4, 14, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx + 26, by - 54, 4, 14, 0, 0, Math.PI * 2);
    ctx.fill();
    // Hands — small ellipses
    ctx.fillStyle = '#6a4020';
    ctx.beginPath();
    ctx.ellipse(cx - 30, by - 39.5, 4, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx + 28, by - 39.5, 4, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();
    // Claw-like fingers — 3 thin strokes per hand
    ctx.strokeStyle = '#3a1a08';
    ctx.lineWidth = 0.8;
    for (let f = 0; f < 3; f++) {
      // Left hand claws
      ctx.beginPath();
      ctx.moveTo(cx - 33 + f * 3, by - 39);
      ctx.lineTo(cx - 35 + f * 3, by - 34);
      ctx.stroke();
      // Right hand claws
      ctx.beginPath();
      ctx.moveTo(cx + 25 + f * 3, by - 39);
      ctx.lineTo(cx + 23 + f * 3, by - 34);
      ctx.stroke();
    }
    // Dark smoke/aura at base of robes
    ctx.fillStyle = 'rgba(30, 0, 0, 0.15)';
    const smokePositions = [
      [cx - 20, by - 18, 12], [cx + 15, by - 14, 14],
      [cx - 8, by - 10, 10], [cx + 25, by - 16, 11],
      [cx + 2, by - 12, 13],
    ];
    for (const [sx, sy, sr] of smokePositions) {
      ctx.beginPath();
      ctx.arc(sx, sy, sr, 0, Math.PI * 2);
      ctx.fill();
    }
    // Neck — ellipse
    ctx.fillStyle = '#6a4020';
    ctx.beginPath();
    ctx.ellipse(cx, by - 72.5, 6, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();
    // Head (angular, ancient, powerful)
    ctx.fillStyle = '#6a4020';
    ctx.beginPath();
    ctx.moveTo(cx - 18, by - 78);
    ctx.lineTo(cx + 18, by - 78);
    ctx.lineTo(cx + 22, by - 88);
    ctx.lineTo(cx + 20, by - 100);
    ctx.lineTo(cx - 20, by - 100);
    ctx.lineTo(cx - 22, by - 88);
    ctx.closePath();
    ctx.fill();
    // Deep wrinkles
    ctx.strokeStyle = '#4a2a14';
    ctx.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(cx - 14, by - 96 + i * 4);
      ctx.quadraticCurveTo(cx, by - 98 + i * 4, cx + 14, by - 96 + i * 4);
      ctx.stroke();
    }
    // Sunken eyes with RED GLOW
    ctx.fillStyle = 'rgba(20,10,5,0.6)';
    ctx.beginPath(); ctx.ellipse(cx - 8, by - 88, 6, 4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx + 8, by - 88, 6, 4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ff4400';
    ctx.beginPath(); ctx.arc(cx - 8, by - 88, 3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + 8, by - 88, 3, 0, Math.PI * 2); ctx.fill();
    // Eye glow — outer ring
    ctx.fillStyle = 'rgba(255, 0, 0, 0.2)';
    ctx.beginPath(); ctx.arc(cx - 8, by - 88, 14, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + 8, by - 88, 14, 0, Math.PI * 2); ctx.fill();
    // Eye glow — inner ring
    ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
    ctx.beginPath(); ctx.arc(cx - 8, by - 88, 10, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + 8, by - 88, 10, 0, Math.PI * 2); ctx.fill();
    // Hooked nose
    ctx.fillStyle = '#4a2a14';
    ctx.beginPath();
    ctx.moveTo(cx, by - 90);
    ctx.lineTo(cx + 3, by - 84);
    ctx.lineTo(cx - 3, by - 84);
    ctx.closePath();
    ctx.fill();
    // Cruel thin mouth
    ctx.strokeStyle = '#1a0505';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx - 8, by - 80);
    ctx.quadraticCurveTo(cx, by - 78, cx + 8, by - 80);
    ctx.stroke();
    // MASSIVE DARK TURBAN
    ctx.fillStyle = '#0a0806';
    ctx.beginPath();
    ctx.moveTo(cx - 22, by - 100);
    ctx.lineTo(cx - 26, by - 112);
    ctx.lineTo(cx - 24, by - 126);
    ctx.lineTo(cx - 16, by - 138);
    ctx.lineTo(cx - 4, by - 144);
    ctx.lineTo(cx + 4, by - 144);
    ctx.lineTo(cx + 16, by - 138);
    ctx.lineTo(cx + 24, by - 126);
    ctx.lineTo(cx + 26, by - 112);
    ctx.lineTo(cx + 22, by - 100);
    ctx.closePath();
    ctx.fill();
    // Turban fold lines
    ctx.strokeStyle = '#1a1410';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 7; i++) {
      const ty = by - 104 - i * 6;
      const sp = 22 - i * 2;
      ctx.beginPath();
      ctx.moveTo(cx - sp, ty);
      ctx.quadraticCurveTo(cx, ty - 3, cx + sp, ty);
      ctx.stroke();
    }
    // Dark red gem on turban
    ctx.fillStyle = '#660000';
    ctx.beginPath();
    ctx.moveTo(cx, by - 106);
    ctx.lineTo(cx + 5, by - 102);
    ctx.lineTo(cx, by - 98);
    ctx.lineTo(cx - 5, by - 102);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#aa0000';
    ctx.beginPath();
    ctx.arc(cx, by - 102, 2, 0, Math.PI * 2);
    ctx.fill();
    // Gem glow
    ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.arc(cx, by - 102, 8, 0, Math.PI * 2);
    ctx.fill();
    // LONG WHITE BLADE BEARD
    ctx.fillStyle = '#e0dcd0';
    ctx.beginPath();
    ctx.moveTo(cx - 14, by - 78);
    ctx.lineTo(cx - 16, by - 68);
    ctx.lineTo(cx - 12, by - 56);
    ctx.lineTo(cx - 6, by - 46);
    ctx.lineTo(cx, by - 40);
    ctx.lineTo(cx + 6, by - 46);
    ctx.lineTo(cx + 12, by - 56);
    ctx.lineTo(cx + 16, by - 68);
    ctx.lineTo(cx + 14, by - 78);
    ctx.closePath();
    ctx.fill();
    // Beard strands
    ctx.strokeStyle = '#ccc8b8';
    ctx.lineWidth = 0.8;
    for (let i = 0; i < 12; i++) {
      const sx = cx - 10 + i * 2;
      ctx.beginPath();
      ctx.moveTo(sx, by - 78);
      ctx.quadraticCurveTo(sx + (Math.random() - 0.5) * 4, by - 58, cx + (Math.random() - 0.5) * 4, by - 42);
      ctx.stroke();
    }
    // Dark aura
    ctx.strokeStyle = 'rgba(80, 0, 0, 0.15)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(cx, by - 80, 40, 70, 0, 0, Math.PI * 2);
    ctx.stroke();
  }, 96, 160);
}

// ═════════════════════════════════════════════════════════════
// ENEMY SOLDIERS (generic small marching sprite)
// ═════════════════════════════════════════════════════════════

export function createEnemySoldier(scene, key = 'parade_soldier', uniformColor = '#3a4a30') {
  staticSprite(scene, key, (ctx, w, h) => {
    const cx = w / 2, by = h - 1;
    // Legs — small ellipses
    ctx.fillStyle = uniformColor;
    ctx.beginPath();
    ctx.ellipse(cx - 2.5, by - 9, 1.5, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx + 2.5, by - 8, 1.5, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    // Boots — small rounded ellipses
    ctx.fillStyle = '#1a1008';
    ctx.beginPath();
    ctx.ellipse(cx - 2.5, by - 2, 2.5, 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx + 2.5, by - 2, 2.5, 2, 0, 0, Math.PI * 2);
    ctx.fill();
    // Body — rounded rect via bezier
    ctx.fillStyle = uniformColor;
    ctx.beginPath();
    ctx.ellipse(cx, by - 18, 5, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    // Arms — small ellipses
    ctx.beginPath();
    ctx.ellipse(cx - 6, by - 19, 1.5, 4.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx + 6, by - 18.5, 1.5, 4.5, 0, 0, Math.PI * 2);
    ctx.fill();
    // Head — small ellipse
    ctx.fillStyle = '#8a7060';
    ctx.beginPath();
    ctx.ellipse(cx, by - 27, 3, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();
    // Helmet / beret — arc cap
    ctx.fillStyle = '#2a2a20';
    ctx.beginPath();
    ctx.ellipse(cx, by - 29, 4, 2.5, 0, Math.PI, 0);
    ctx.fill();
    // Rifle (diagonal on back)
    ctx.strokeStyle = '#2a2018';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx + 5, by - 28);
    ctx.lineTo(cx + 1, by - 36);
    ctx.stroke();
  }, 20, 40);
}

// ═════════════════════════════════════════════════════════════
// VEHICLES (static sprites)
// ═════════════════════════════════════════════════════════════

export function createMissileTruck(scene) {
  staticSprite(scene, 'parade_missiletruck', (ctx, w, h) => {
    // Truck body
    ctx.fillStyle = '#3a4a30';
    ctx.fillRect(10, h - 22, 50, 16);
    // Cab
    ctx.fillStyle = '#4a5a40';
    ctx.fillRect(2, h - 20, 14, 14);
    // Windshield
    ctx.fillStyle = '#4a6a8a';
    ctx.fillRect(3, h - 19, 8, 6);
    // Wheels
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath(); ctx.arc(16, h - 4, 5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(42, h - 4, 5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(54, h - 4, 5, 0, Math.PI * 2); ctx.fill();
    // Missiles on launcher (angled up-left)
    ctx.fillStyle = '#cccccc';
    for (let i = 0; i < 3; i++) {
      ctx.save();
      ctx.translate(20 + i * 12, h - 22);
      ctx.rotate(-0.5);
      ctx.fillRect(0, -3, 16, 3);
      ctx.fillStyle = '#dd3333';
      ctx.fillRect(0, -3, 3, 3);
      ctx.fillStyle = '#cccccc';
      ctx.restore();
    }
  }, 70, 40);
}

export function createRocketTruck(scene) {
  staticSprite(scene, 'parade_rockettruck', (ctx, w, h) => {
    ctx.fillStyle = '#3a4a30';
    ctx.fillRect(8, h - 20, 44, 14);
    ctx.fillStyle = '#4a5a40';
    ctx.fillRect(2, h - 18, 12, 12);
    ctx.fillStyle = '#4a6a8a';
    ctx.fillRect(3, h - 17, 7, 5);
    // Wheels
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath(); ctx.arc(14, h - 4, 4, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(40, h - 4, 4, 0, Math.PI * 2); ctx.fill();
    // Multiple rocket tubes
    ctx.fillStyle = '#555555';
    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 4; col++) {
        ctx.fillRect(18 + col * 8, h - 28 + row * 5, 7, 4);
      }
    }
  }, 60, 36);
}

export function createTankMerkava(scene) {
  staticSprite(scene, 'parade_merkava', (ctx, w, h) => {
    // Tracks
    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(4, h - 14, 72, 12);
    ctx.strokeStyle = '#3a3a3a';
    ctx.lineWidth = 1;
    for (let x = 8; x < 74; x += 6) {
      ctx.beginPath(); ctx.moveTo(x, h - 14); ctx.lineTo(x, h - 2); ctx.stroke();
    }
    // Track wheels
    ctx.fillStyle = '#444444';
    for (let i = 0; i < 6; i++) {
      ctx.beginPath(); ctx.arc(12 + i * 12, h - 8, 4, 0, Math.PI * 2); ctx.fill();
    }
    // Hull
    ctx.fillStyle = '#5a6a50';
    ctx.beginPath();
    ctx.moveTo(6, h - 14);
    ctx.lineTo(10, h - 24);
    ctx.lineTo(70, h - 24);
    ctx.lineTo(76, h - 14);
    ctx.closePath();
    ctx.fill();
    // Turret
    ctx.fillStyle = '#4a5a40';
    ctx.fillRect(22, h - 34, 32, 12);
    ctx.fillRect(18, h - 30, 40, 6);
    // Cannon (pointing right/forward)
    ctx.fillStyle = '#3a4a30';
    ctx.fillRect(52, h - 30, 30, 4);
    ctx.fillRect(78, h - 31, 6, 6); // muzzle
    // Commander hatch
    ctx.fillStyle = '#5a6a50';
    ctx.fillRect(32, h - 37, 8, 4);
    // ERA blocks
    ctx.fillStyle = '#6a7a60';
    for (let i = 0; i < 4; i++) ctx.fillRect(14 + i * 14, h - 23, 8, 2);
    // Dust cloud under tracks
    ctx.fillStyle = 'rgba(140, 120, 80, 0.3)';
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.arc(10 + Math.random() * 60, h - 2 + Math.random() * 4, 3 + Math.random() * 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }, 90, 44);
}

export function createF15(scene) {
  staticSprite(scene, 'parade_f15', (ctx, w, h) => {
    const cy = h / 2;
    // Fuselage
    ctx.fillStyle = '#7a7a82';
    ctx.beginPath();
    ctx.moveTo(4, cy);
    ctx.lineTo(12, cy - 6);
    ctx.lineTo(50, cy - 4);
    ctx.lineTo(62, cy);
    ctx.lineTo(50, cy + 4);
    ctx.lineTo(12, cy + 6);
    ctx.closePath();
    ctx.fill();
    // Wings
    ctx.fillStyle = '#6a6a72';
    ctx.beginPath();
    ctx.moveTo(24, cy - 4);
    ctx.lineTo(30, cy - 18);
    ctx.lineTo(42, cy - 16);
    ctx.lineTo(38, cy - 4);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(24, cy + 4);
    ctx.lineTo(30, cy + 18);
    ctx.lineTo(42, cy + 16);
    ctx.lineTo(38, cy + 4);
    ctx.closePath();
    ctx.fill();
    // Tail
    ctx.fillStyle = '#8a8a92';
    ctx.beginPath();
    ctx.moveTo(6, cy - 2);
    ctx.lineTo(2, cy - 12);
    ctx.lineTo(8, cy - 10);
    ctx.lineTo(10, cy - 2);
    ctx.closePath();
    ctx.fill();
    // Cockpit
    ctx.fillStyle = '#2a3a5a';
    ctx.fillRect(48, cy - 3, 8, 4);
    // Engine exhaust
    ctx.fillStyle = '#ff8800';
    ctx.globalAlpha = 0.7;
    ctx.beginPath();
    ctx.ellipse(2, cy, 4, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    // Star of David on wing
    ctx.strokeStyle = '#0038b8';
    ctx.lineWidth = 0.6;
    starOfDavid(ctx, 34, cy - 10, 3, '#0038b8', false);
    // Engine trail
    ctx.strokeStyle = 'rgba(200, 200, 200, 0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, cy);
    ctx.lineTo(-20, cy);
    ctx.stroke();
  }, 70, 40);
}

export function createF35(scene) {
  staticSprite(scene, 'parade_f35', (ctx, w, h) => {
    const cy = h / 2;
    // More angular/stealth shape
    ctx.fillStyle = '#5a5a62';
    ctx.beginPath();
    ctx.moveTo(6, cy);
    ctx.lineTo(14, cy - 4);
    ctx.lineTo(50, cy - 3);
    ctx.lineTo(60, cy);
    ctx.lineTo(50, cy + 3);
    ctx.lineTo(14, cy + 4);
    ctx.closePath();
    ctx.fill();
    // Angular wings
    ctx.fillStyle = '#4a4a52';
    ctx.beginPath();
    ctx.moveTo(20, cy - 3);
    ctx.lineTo(28, cy - 16);
    ctx.lineTo(40, cy - 14);
    ctx.lineTo(36, cy - 3);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(20, cy + 3);
    ctx.lineTo(28, cy + 16);
    ctx.lineTo(40, cy + 14);
    ctx.lineTo(36, cy + 3);
    ctx.closePath();
    ctx.fill();
    // V-tail
    ctx.fillStyle = '#6a6a6a';
    ctx.beginPath();
    ctx.moveTo(8, cy);
    ctx.lineTo(4, cy - 8);
    ctx.lineTo(10, cy - 6);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(8, cy);
    ctx.lineTo(4, cy + 8);
    ctx.lineTo(10, cy + 6);
    ctx.closePath();
    ctx.fill();
    // Cockpit
    ctx.fillStyle = '#3a4a5a';
    ctx.fillRect(46, cy - 2, 8, 4);
    // Exhaust
    ctx.fillStyle = '#ff6600';
    ctx.globalAlpha = 0.6;
    ctx.beginPath(); ctx.ellipse(3, cy, 3, 2, 0, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
  }, 66, 36);
}

export function createCombatDrone(scene) {
  staticSprite(scene, 'parade_drone', (ctx, w, h) => {
    const cy = h / 2;
    ctx.fillStyle = '#8a8a8a';
    // Fuselage
    ctx.fillRect(8, cy - 2, 24, 4);
    // Wings
    ctx.fillStyle = '#7a7a7a';
    ctx.beginPath();
    ctx.moveTo(14, cy - 2);
    ctx.lineTo(18, cy - 10);
    ctx.lineTo(26, cy - 8);
    ctx.lineTo(22, cy - 2);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(14, cy + 2);
    ctx.lineTo(18, cy + 10);
    ctx.lineTo(26, cy + 8);
    ctx.lineTo(22, cy + 2);
    ctx.closePath();
    ctx.fill();
    // V-tail
    ctx.fillRect(8, cy - 6, 2, 12);
    // Sensor dome
    ctx.fillStyle = '#3a3a5a';
    ctx.beginPath(); ctx.arc(32, cy, 3, 0, Math.PI * 2); ctx.fill();
  }, 40, 24);
}

export function createCarrier(scene) {
  staticSprite(scene, 'parade_carrier', (ctx, w, h) => {
    // Hull
    ctx.fillStyle = '#5a5a5a';
    ctx.beginPath();
    ctx.moveTo(10, h - 20);
    ctx.lineTo(180, h - 20);
    ctx.lineTo(190, h - 14);
    ctx.lineTo(188, h - 8);
    ctx.lineTo(8, h - 8);
    ctx.lineTo(4, h - 14);
    ctx.closePath();
    ctx.fill();
    // Flight deck (flat top)
    ctx.fillStyle = '#4a4a4a';
    ctx.fillRect(8, h - 24, 176, 5);
    // Island/superstructure
    ctx.fillStyle = '#6a6a6a';
    ctx.fillRect(120, h - 40, 20, 18);
    ctx.fillRect(124, h - 48, 12, 10);
    // Antennas
    ctx.fillStyle = '#888888';
    ctx.fillRect(128, h - 56, 2, 10);
    ctx.fillRect(134, h - 52, 2, 6);
    // Aircraft on deck (small)
    ctx.fillStyle = '#7a7a82';
    for (let i = 0; i < 3; i++) {
      const ax = 30 + i * 28;
      ctx.fillRect(ax, h - 27, 12, 3);
      ctx.fillRect(ax + 3, h - 30, 6, 3);
    }
    // Waterline
    ctx.fillStyle = '#3a3a4a';
    ctx.fillRect(6, h - 10, 180, 3);
    // Wake
    ctx.fillStyle = 'rgba(180, 200, 220, 0.3)';
    for (let i = 0; i < 6; i++) {
      ctx.beginPath();
      ctx.ellipse(190 + i * 8, h - 12, 4 + i, 2, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }, 220, 60);
}

export function createFrigate(scene) {
  staticSprite(scene, 'parade_frigate', (ctx, w, h) => {
    // Hull
    ctx.fillStyle = '#5a5a5a';
    ctx.beginPath();
    ctx.moveTo(8, h - 16);
    ctx.lineTo(90, h - 16);
    ctx.lineTo(96, h - 10);
    ctx.lineTo(92, h - 6);
    ctx.lineTo(4, h - 6);
    ctx.lineTo(2, h - 10);
    ctx.closePath();
    ctx.fill();
    // Superstructure
    ctx.fillStyle = '#6a6a6a';
    ctx.fillRect(34, h - 28, 24, 14);
    ctx.fillRect(38, h - 34, 16, 8);
    // Radar dome
    ctx.fillStyle = '#7a7a7a';
    ctx.beginPath(); ctx.arc(46, h - 36, 5, 0, Math.PI * 2); ctx.fill();
    // Gun turret front
    ctx.fillStyle = '#555555';
    ctx.fillRect(70, h - 20, 10, 4);
    ctx.fillRect(78, h - 19, 12, 2);
    // Antenna
    ctx.fillRect(44, h - 44, 2, 10);
  }, 100, 48);
}

export function createIronDomeLauncher(scene) {
  staticSprite(scene, 'parade_irondome', (ctx, w, h) => {
    // Base platform
    ctx.fillStyle = '#4a5a40';
    ctx.fillRect(4, h - 12, 52, 10);
    // Wheels
    ctx.fillStyle = '#2a2a2a';
    ctx.beginPath(); ctx.arc(14, h - 2, 4, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(46, h - 2, 4, 0, Math.PI * 2); ctx.fill();
    // Launcher tubes (angled up)
    ctx.fillStyle = '#6a6a6a';
    for (let i = 0; i < 4; i++) {
      ctx.save();
      ctx.translate(12 + i * 10, h - 12);
      ctx.rotate(-1.1);
      ctx.fillRect(0, -3, 18, 5);
      ctx.restore();
    }
    // Missiles launching (trails going up)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(28, 2, 2, 14);
    ctx.fillRect(38, 6, 2, 10);
    // Exhaust
    ctx.fillStyle = '#ff8800';
    ctx.globalAlpha = 0.7;
    ctx.beginPath(); ctx.arc(29, 16, 3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(39, 16, 2, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
    // Smoke trails
    ctx.strokeStyle = 'rgba(200,200,200,0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(29, 18); ctx.lineTo(29, h - 14); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(39, 18); ctx.lineTo(39, h - 14); ctx.stroke();
  }, 60, 50);
}

export function createArmoredVehicle(scene) {
  staticSprite(scene, 'parade_apc', (ctx, w, h) => {
    // Tracks
    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(4, h - 10, 46, 8);
    // Track detail
    ctx.fillStyle = '#3a3a3a';
    for (let i = 0; i < 4; i++) {
      ctx.beginPath(); ctx.arc(10 + i * 12, h - 6, 3, 0, Math.PI * 2); ctx.fill();
    }
    // Hull
    ctx.fillStyle = '#5a6a50';
    ctx.beginPath();
    ctx.moveTo(4, h - 10);
    ctx.lineTo(8, h - 20);
    ctx.lineTo(46, h - 20);
    ctx.lineTo(50, h - 10);
    ctx.closePath();
    ctx.fill();
    // Top
    ctx.fillStyle = '#4a5a40';
    ctx.fillRect(12, h - 24, 28, 5);
    // Gun
    ctx.fillStyle = '#3a3a3a';
    ctx.fillRect(36, h - 22, 14, 3);
  }, 56, 30);
}

// ═════════════════════════════════════════════════════════════
// AZADI TOWER (landmark silhouette)
// ═════════════════════════════════════════════════════════════

export function createAzadiTower(scene) {
  staticSprite(scene, 'parade_azadi', (ctx, w, h) => {
    ctx.fillStyle = '#2a1a10';
    // Base
    ctx.fillRect(w / 2 - 20, h - 20, 40, 20);
    // Tower body (inverted Y shape)
    ctx.beginPath();
    ctx.moveTo(w / 2 - 18, h - 20);
    ctx.lineTo(w / 2 - 10, h - 60);
    ctx.lineTo(w / 2 - 4, h - 80);
    ctx.lineTo(w / 2, h - 90);
    ctx.lineTo(w / 2 + 4, h - 80);
    ctx.lineTo(w / 2 + 10, h - 60);
    ctx.lineTo(w / 2 + 18, h - 20);
    ctx.closePath();
    ctx.fill();
    // Arch opening
    ctx.fillStyle = '#0a0604';
    ctx.beginPath();
    ctx.arc(w / 2, h - 20, 12, Math.PI, Math.PI * 2);
    ctx.fill();
    // Top detail
    ctx.fillStyle = '#3a2a18';
    ctx.fillRect(w / 2 - 3, h - 94, 6, 6);
  }, 60, 100);
}

// ═════════════════════════════════════════════════════════════
// SUPERZION HERO — Large, detailed parade sprite
// ═════════════════════════════════════════════════════════════

export function createSuperZionParade(scene) {
  staticSprite(scene, 'parade_superzion', (ctx, w, h) => {
    const cx = w / 2, by = h - 6;

    // ── LEGS ──
    ctx.fillStyle = '#222222';
    ctx.fillRect(cx - 10, by - 50, 8, 36);
    ctx.fillRect(cx + 2, by - 46, 8, 32);
    // Knee pads
    ctx.fillStyle = '#7a7a80';
    ctx.fillRect(cx - 11, by - 32, 10, 4);
    ctx.fillRect(cx + 1, by - 28, 10, 4);
    // Combat boots
    ctx.fillStyle = '#0e0e0e';
    ctx.fillRect(cx - 12, by - 14, 11, 10);
    ctx.fillRect(cx + 1, by - 14, 11, 10);
    ctx.fillStyle = '#121212';
    ctx.fillRect(cx - 13, by - 4, 13, 4);
    ctx.fillRect(cx, by - 4, 13, 4);

    // ── TORSO ──
    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(cx - 16, by - 82, 32, 34);
    // Tactical vest
    ctx.fillStyle = '#6a6a70';
    ctx.fillRect(cx - 14, by - 80, 28, 28);
    // Vest straps
    ctx.fillStyle = '#5a5a60';
    ctx.fillRect(cx - 14, by - 78, 4, 24);
    ctx.fillRect(cx + 10, by - 78, 4, 24);
    // Pouches
    ctx.fillStyle = '#555560';
    ctx.fillRect(cx - 12, by - 68, 7, 6);
    ctx.fillRect(cx + 5, by - 68, 7, 6);
    ctx.fillStyle = '#7a7a80';
    ctx.fillRect(cx - 12, by - 68, 7, 1);
    ctx.fillRect(cx + 5, by - 68, 7, 1);

    // ★ STAR OF DAVID — GOLD, prominent, on CHEST ★
    starOfDavid(ctx, cx, by - 70, 7, '#FFD700', true);

    // Utility belt
    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(cx - 16, by - 52, 32, 4);
    // Gold buckle
    ctx.fillStyle = '#c49520';
    ctx.fillRect(cx - 3, by - 52, 6, 4);

    // ── ARMS ──
    // Left arm (down)
    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(cx - 22, by - 80, 7, 26);
    ctx.fillStyle = '#222222';
    ctx.fillRect(cx - 22, by - 56, 7, 5);

    // Right arm (up, holding rifle on shoulder)
    ctx.save();
    ctx.translate(cx + 15, by - 80);
    ctx.rotate(-0.15);
    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(0, 0, 7, 26);
    ctx.fillStyle = '#222222';
    ctx.fillRect(0, 24, 7, 5);
    ctx.restore();

    // ── RIFLE on right shoulder ──
    ctx.fillStyle = '#2a2a2a';
    ctx.save();
    ctx.translate(cx + 20, by - 110);
    ctx.rotate(0.15);
    ctx.fillRect(0, 0, 4, 50);
    // Stock
    ctx.fillRect(-2, 46, 8, 6);
    // Barrel tip
    ctx.fillRect(-1, -4, 6, 5);
    // Scope
    ctx.fillStyle = '#4a4a4a';
    ctx.fillRect(1, 12, 4, 8);
    ctx.restore();

    // ── NECK ──
    ctx.fillStyle = '#b08657';
    ctx.fillRect(cx - 5, by - 88, 10, 7);

    // ── HEAD (detailed) ──
    const hx = cx, hy = by - 104;
    // Face shape
    ctx.fillStyle = '#c49668';
    ctx.beginPath();
    ctx.ellipse(hx, hy, 14, 17, 0, 0, Math.PI * 2);
    ctx.fill();

    // Hair (jet black, short sides)
    ctx.fillStyle = '#0e0e0e';
    ctx.fillRect(hx - 12, hy - 16, 24, 8);
    ctx.fillRect(hx - 14, hy - 12, 4, 10);
    ctx.fillRect(hx + 10, hy - 12, 4, 10);
    ctx.fillRect(hx - 10, hy - 18, 20, 3);

    // Slicked-back black hair (Mossad agent)
    ctx.fillStyle = '#0e0e0e';
    ctx.beginPath();
    ctx.ellipse(hx, hy - 18, 12, 5, 0, Math.PI, 0);
    ctx.fill();
    // Hair swept backward
    ctx.fillRect(hx - 10, hy - 18, 20, 3);
    ctx.fillRect(hx - 12, hy - 16, 4, 6);
    ctx.fillRect(hx + 8, hy - 16, 4, 6);

    // Eyes (intense)
    const eyeY = hy - 2;
    ctx.fillStyle = '#eeeee8';
    ctx.fillRect(hx - 8, eyeY, 6, 4);
    ctx.fillRect(hx + 2, eyeY, 6, 4);
    ctx.fillStyle = '#3a2818';
    ctx.fillRect(hx - 6, eyeY + 1, 3, 3);
    ctx.fillRect(hx + 4, eyeY + 1, 3, 3);
    ctx.fillStyle = '#0e0e0e';
    ctx.fillRect(hx - 5, eyeY + 1, 2, 2);
    ctx.fillRect(hx + 4, eyeY + 1, 2, 2);
    // Eye highlights
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(hx - 7, eyeY, 1, 1);
    ctx.fillRect(hx + 6, eyeY, 1, 1);
    // Eyebrows (strong)
    ctx.fillStyle = '#0e0e0e';
    ctx.fillRect(hx - 8, eyeY - 3, 6, 2);
    ctx.fillRect(hx + 2, eyeY - 3, 6, 2);

    // Nose
    ctx.fillStyle = '#b08657';
    ctx.fillRect(hx - 1, hy + 1, 2, 4);
    ctx.fillRect(hx - 2, hy + 4, 4, 2);

    // Short beard / stubble
    ctx.fillStyle = '#2a2018';
    for (let dy = 0; dy < 6; dy++) {
      for (let dx = -8; dx <= 8; dx++) {
        if ((dx + dy) % 3 === 0) {
          ctx.fillRect(hx + dx, hy + 5 + dy, 1, 1);
        }
      }
    }
    // Jawline beard (slightly thicker)
    ctx.fillStyle = '#1c1610';
    for (let dx = -10; dx <= 10; dx++) {
      if (dx % 2 === 0) ctx.fillRect(hx + dx, hy + 10, 1, 2);
    }

    // Mouth (determined line)
    ctx.fillStyle = '#6a4030';
    ctx.fillRect(hx - 4, hy + 6, 8, 1);

    // Ears
    ctx.fillStyle = '#b08657';
    ctx.fillRect(hx - 14, hy - 3, 2, 6);
    ctx.fillRect(hx + 12, hy - 3, 2, 6);
  }, 96, 160);
}

// ═════════════════════════════════════════════════════════════
// MASTER GENERATOR
// ═════════════════════════════════════════════════════════════

// ═════════════════════════════════════════════════════════════
// FICTIONAL ORG LOGOS (replace country flags in Axis of Evil)
// ═════════════════════════════════════════════════════════════

/** Org 1: Skull & Crossbones on black — generic terror org */
export function createOrgSkull(scene) {
  wavingSheet(scene, 'org_skull', (ctx, w, h) => {
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, w, h);
    const cx = w / 2, cy = h / 2 - 4;
    // Skull
    ctx.fillStyle = '#cccccc';
    ctx.beginPath();
    ctx.ellipse(cx, cy - 2, 16, 18, 0, 0, Math.PI * 2);
    ctx.fill();
    // Jaw
    ctx.beginPath();
    ctx.ellipse(cx, cy + 12, 12, 8, 0, 0, Math.PI);
    ctx.fill();
    // Eye sockets
    ctx.fillStyle = '#0a0a0a';
    ctx.beginPath(); ctx.ellipse(cx - 7, cy - 4, 5, 6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx + 7, cy - 4, 5, 6, 0, 0, Math.PI * 2); ctx.fill();
    // Nose hole
    ctx.beginPath();
    ctx.moveTo(cx, cy + 4);
    ctx.lineTo(cx - 3, cy + 8);
    ctx.lineTo(cx + 3, cy + 8);
    ctx.closePath();
    ctx.fill();
    // Teeth
    ctx.fillStyle = '#cccccc';
    for (let i = -3; i <= 3; i++) {
      ctx.fillRect(cx + i * 3 - 1, cy + 14, 2, 4);
    }
    // Crossbones
    ctx.strokeStyle = '#cccccc';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(cx - 24, cy + 26); ctx.lineTo(cx + 24, cy + 42);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx + 24, cy + 26); ctx.lineTo(cx - 24, cy + 42);
    ctx.stroke();
    // Red splash
    ctx.fillStyle = 'rgba(200,0,0,0.3)';
    ctx.beginPath(); ctx.arc(cx, cy + 10, 24, 0, Math.PI * 2); ctx.fill();
  }, 140, 90);
}

/** Org 2: Red Fist on dark green — militant faction */
export function createOrgFist(scene) {
  wavingSheet(scene, 'org_fist', (ctx, w, h) => {
    ctx.fillStyle = '#0a1a0a';
    ctx.fillRect(0, 0, w, h);
    const cx = w / 2, cy = h / 2;
    // Raised fist
    ctx.fillStyle = '#cc2222';
    // Wrist
    ctx.fillRect(cx - 6, cy + 12, 12, 18);
    // Fist body
    ctx.beginPath();
    ctx.moveTo(cx - 12, cy + 12);
    ctx.quadraticCurveTo(cx - 14, cy - 6, cx - 10, cy - 14);
    ctx.lineTo(cx + 10, cy - 14);
    ctx.quadraticCurveTo(cx + 14, cy - 6, cx + 12, cy + 12);
    ctx.closePath();
    ctx.fill();
    // Finger lines
    ctx.strokeStyle = '#991111';
    ctx.lineWidth = 1;
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(cx + i * 6, cy - 14);
      ctx.lineTo(cx + i * 5, cy + 4);
      ctx.stroke();
    }
    // Thumb
    ctx.fillStyle = '#bb2222';
    ctx.beginPath();
    ctx.ellipse(cx - 13, cy, 4, 8, 0.2, 0, Math.PI * 2);
    ctx.fill();
    // Red glow
    ctx.fillStyle = 'rgba(200,0,0,0.15)';
    ctx.beginPath(); ctx.arc(cx, cy, 30, 0, Math.PI * 2); ctx.fill();
  }, 140, 90);
}

/** Org 3: Crossed swords on black — militant banner */
export function createOrgSwords(scene) {
  wavingSheet(scene, 'org_swords', (ctx, w, h) => {
    ctx.fillStyle = '#0a0808';
    ctx.fillRect(0, 0, w, h);
    const cx = w / 2, cy = h / 2;
    // Sword 1 (left-to-right diagonal)
    ctx.strokeStyle = '#cccccc';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(cx - 30, cy + 30); ctx.lineTo(cx + 30, cy - 30);
    ctx.stroke();
    // Sword 2 (right-to-left diagonal)
    ctx.beginPath();
    ctx.moveTo(cx + 30, cy + 30); ctx.lineTo(cx - 30, cy - 30);
    ctx.stroke();
    // Crossguards
    ctx.strokeStyle = '#cc8800';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx - 8, cy - 8); ctx.lineTo(cx + 2, cy - 18);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx + 8, cy - 8); ctx.lineTo(cx - 2, cy - 18);
    ctx.stroke();
    // Handles
    ctx.fillStyle = '#8a4400';
    ctx.beginPath(); ctx.ellipse(cx - 28, cy + 28, 4, 6, 0.8, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx + 28, cy + 28, 4, 6, -0.8, 0, Math.PI * 2); ctx.fill();
    // Central emblem (crescent)
    ctx.fillStyle = '#cc0000';
    ctx.beginPath(); ctx.arc(cx, cy, 10, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#0a0808';
    ctx.beginPath(); ctx.arc(cx + 4, cy - 2, 8, 0, Math.PI * 2); ctx.fill();
  }, 140, 90);
}

/** Org 4: Serpent coil on blood red — supreme evil org */
export function createOrgSerpent(scene) {
  wavingSheet(scene, 'org_serpent', (ctx, w, h) => {
    ctx.fillStyle = '#1a0505';
    ctx.fillRect(0, 0, w, h);
    const cx = w / 2, cy = h / 2;
    // Coiled serpent body
    ctx.strokeStyle = '#228822';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(cx - 20, cy + 25);
    ctx.bezierCurveTo(cx - 35, cy, cx + 35, cy - 10, cx + 10, cy - 25);
    ctx.bezierCurveTo(cx - 10, cy - 35, cx - 30, cy - 10, cx, cy);
    ctx.bezierCurveTo(cx + 20, cy + 5, cx + 25, cy + 20, cx + 15, cy + 30);
    ctx.stroke();
    // Snake head
    ctx.fillStyle = '#33aa33';
    ctx.beginPath();
    ctx.ellipse(cx - 20, cy + 25, 7, 5, -0.5, 0, Math.PI * 2);
    ctx.fill();
    // Eye
    ctx.fillStyle = '#ff0000';
    ctx.beginPath(); ctx.arc(cx - 22, cy + 23, 2, 0, Math.PI * 2); ctx.fill();
    // Tongue
    ctx.strokeStyle = '#ff0000';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx - 27, cy + 25);
    ctx.lineTo(cx - 33, cy + 22);
    ctx.moveTo(cx - 27, cy + 25);
    ctx.lineTo(cx - 33, cy + 28);
    ctx.stroke();
    // Dark glow
    ctx.fillStyle = 'rgba(0,100,0,0.12)';
    ctx.beginPath(); ctx.arc(cx, cy, 35, 0, Math.PI * 2); ctx.fill();
  }, 140, 90);
}

export function generateAllParadeTextures(scene) {
  // Flags
  createIranFlag(scene);
  createLebanonFlag(scene);
  createPalestineFlag(scene);
  createIsraelFlag(scene);
  createEnemyFlag(scene);
  // Fictional org logos (for Axis of Evil section)
  createOrgSkull(scene);
  createOrgFist(scene);
  createOrgSwords(scene);
  createOrgSerpent(scene);
  // Boss parade sprites
  createFoamBeardParade(scene);
  createTurboTurbanParade(scene);
  createWardenParade(scene);
  createSupremeTurbanParade(scene);
  // Soldiers
  createEnemySoldier(scene);
  // Vehicles
  createMissileTruck(scene);
  createRocketTruck(scene);
  createTankMerkava(scene);
  createF15(scene);
  createF35(scene);
  createCombatDrone(scene);
  createCarrier(scene);
  createFrigate(scene);
  createIronDomeLauncher(scene);
  createArmoredVehicle(scene);
  // Landmarks
  createAzadiTower(scene);
  // Hero
  createSuperZionParade(scene);
}
