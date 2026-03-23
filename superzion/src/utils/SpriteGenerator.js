// ═══════════════════════════════════════════════════════════════════
// SuperZion — Elite Agent HERO sprite (COMPLETE REDESIGN)
// Aviator sunglasses, V-shaped athletic build, tactical vest with
// gold Star of David, silenced pistol, slicked-back hair, combat boots.
// All body parts drawn with arc/bezier/ellipse — no fillRect for anatomy.
// ═══════════════════════════════════════════════════════════════════

const SIZE = 128;
const MX = 64;

const PAL = {
  // Skin — Mediterranean tone
  skin0: '#8a6040', skin1: '#b08657', skin2: '#C49A6C',
  skin3: '#C49A6C', skin4: '#d4aa7c',

  // Hair (jet black, slicked back with volume)
  hair0: '#1A1A1A', hair1: '#111110', hair2: '#1a1816', hair3: '#22201c',

  // Tactical suit (black / dark charcoal)
  tac0: '#1a1a1a', tac1: '#222222', tac2: '#2a2a2a',
  tac3: '#333333', tac4: '#3a3a3a',

  // Vest/harness — dark gray
  vest0: '#3a3a3e', vest1: '#444448', vest2: '#4e4e52',
  vest3: '#58585c', vest4: '#626266',

  // Black (boots, gloves, belt)
  blk0: '#121212', blk1: '#1a1a1a', blk2: '#222222', blk3: '#2a2a2a',

  // Boots (near-black with thick sole)
  boot0: '#0e0e0e', boot1: '#141414', boot2: '#1a1a1a',

  // Gold — Star of David + belt buckle
  gld0: '#806010', gld1: '#B8860B', gld2: '#c49520',
  gld3: '#FFD700', gld4: '#eab530',

  // Sunglasses
  lensBlack: '#0A0A0A',
  frame: '#333333',

  // Mouth
  mouthLine: '#6a4030',

  // Outline
  outline: '#0a0a0a',
};

// ── HELPERS ─────────────────────────────────────────────────────

/** Draw a filled rounded-rect capsule */
function capsule(ctx, x, y, w, h, color) {
  const r = Math.min(w, h) / 2;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
  ctx.fill();
}

// ── STAR OF DAVID — metallic gold, two overlapping triangles ────
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

  // Gold fill with dark gold border (same style as GameIntroScene metallic star)
  ctx.fillStyle = PAL.gld3;
  ctx.strokeStyle = PAL.gld1;
  ctx.lineWidth = 0.8;
  drawTri(-Math.PI / 2, true);
  drawTri(Math.PI / 2, true);

  // Bright edge highlight
  ctx.strokeStyle = PAL.gld4;
  ctx.lineWidth = 0.5;
  drawTri(-Math.PI / 2, false);
  drawTri(Math.PI / 2, false);
}

// ── SUNGLASSES — dark aviator lenses with reflection ────────────
function drawSunglasses(ctx, hx, eyeY) {
  // Frame — thin dark gray bridge and rims
  ctx.strokeStyle = PAL.frame;
  ctx.lineWidth = 1;

  // Nose bridge
  ctx.beginPath();
  ctx.moveTo(hx - 2, eyeY + 0.5);
  ctx.quadraticCurveTo(hx, eyeY - 0.5, hx + 2, eyeY + 0.5);
  ctx.stroke();

  // Left lens — dark oval
  ctx.fillStyle = PAL.lensBlack;
  ctx.beginPath();
  ctx.ellipse(hx - 5.5, eyeY + 0.5, 4.5, 2.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = PAL.frame;
  ctx.lineWidth = 0.8;
  ctx.stroke();

  // Right lens — dark oval
  ctx.fillStyle = PAL.lensBlack;
  ctx.beginPath();
  ctx.ellipse(hx + 5.5, eyeY + 0.5, 4.5, 2.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Diagonal reflection line on left lens (cyan tint)
  ctx.strokeStyle = 'rgba(180, 220, 255, 0.4)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(hx - 8, eyeY - 0.5);
  ctx.lineTo(hx - 3, eyeY + 1.5);
  ctx.stroke();

  // Diagonal reflection line on right lens
  ctx.beginPath();
  ctx.moveTo(hx + 3, eyeY - 0.5);
  ctx.lineTo(hx + 8, eyeY + 1.5);
  ctx.stroke();

  // Temple arms extending to sides
  ctx.strokeStyle = PAL.frame;
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(hx - 10, eyeY + 0.5);
  ctx.lineTo(hx - 12, eyeY - 1);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(hx + 10, eyeY + 0.5);
  ctx.lineTo(hx + 12, eyeY - 1);
  ctx.stroke();
}

// ── HEAD — fully organic ───────────────────────────────────────
function drawHead(ctx, hx, hy) {
  // --- Main face: oval --- Mediterranean skin tone
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(hx, hy + 1, 10, 12, 0, 0, Math.PI * 2);
  ctx.fillStyle = PAL.skin3;
  ctx.fill();
  ctx.restore();

  // Forehead highlight (lighter oval)
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(hx, hy - 4, 7, 4, 0, 0, Math.PI * 2);
  ctx.fillStyle = PAL.skin4;
  ctx.fill();
  ctx.restore();

  // Cheekbone shading (soft ellipses on sides)
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(hx - 8, hy + 1, 3, 5, 0, 0, Math.PI * 2);
  ctx.fillStyle = PAL.skin2;
  ctx.fill();
  ctx.restore();
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(hx + 8, hy + 1, 3, 5, 0, 0, Math.PI * 2);
  ctx.fillStyle = PAL.skin2;
  ctx.fill();
  ctx.restore();

  // Jawline — angular, defined, narrowing toward chin
  ctx.beginPath();
  ctx.moveTo(hx - 9, hy + 5);
  ctx.quadraticCurveTo(hx - 5, hy + 12, hx, hy + 13);
  ctx.quadraticCurveTo(hx + 5, hy + 12, hx + 9, hy + 5);
  ctx.fillStyle = PAL.skin2;
  ctx.fill();

  // Chin — angular, defined (not round)
  ctx.beginPath();
  ctx.moveTo(hx - 4, hy + 10);
  ctx.lineTo(hx, hy + 14);
  ctx.lineTo(hx + 4, hy + 10);
  ctx.fillStyle = PAL.skin1;
  ctx.fill();

  // --- Slicked-back HAIR with volume (bezierCurveTo pompadour) ---
  // Main hair cap
  ctx.beginPath();
  ctx.ellipse(hx, hy - 10, 11, 5, 0, Math.PI, Math.PI * 2);
  ctx.fillStyle = PAL.hair0;
  ctx.fill();

  // Hair volume on top — higher in front (subtle pompadour)
  ctx.beginPath();
  ctx.moveTo(hx - 10, hy - 11);
  ctx.bezierCurveTo(hx - 7, hy - 17, hx + 5, hy - 18, hx + 10, hy - 12);
  ctx.bezierCurveTo(hx + 11, hy - 10, hx - 11, hy - 10, hx - 10, hy - 11);
  ctx.closePath();
  ctx.fillStyle = PAL.hair0;
  ctx.fill();

  // Hair streaks (thin bezier lines for slick, groomed look)
  ctx.strokeStyle = PAL.hair1;
  ctx.lineWidth = 0.6;
  for (let i = -3; i <= 3; i++) {
    ctx.beginPath();
    ctx.moveTo(hx + i * 2.5 - 1, hy - 15);
    ctx.bezierCurveTo(hx + i * 2.8, hy - 12, hx + i * 3.2, hy - 9, hx + i * 3.5, hy - 7);
    ctx.stroke();
  }

  // Side hair (arcs hugging the head)
  ctx.beginPath();
  ctx.arc(hx - 10, hy - 6, 3, Math.PI * 0.8, Math.PI * 1.6);
  ctx.fillStyle = PAL.hair0;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(hx + 10, hy - 6, 3, Math.PI * 1.4, Math.PI * 0.2);
  ctx.fillStyle = PAL.hair0;
  ctx.fill();

  // Hairline (soft arc)
  ctx.beginPath();
  ctx.arc(hx, hy - 8, 9, Math.PI * 1.1, Math.PI * 1.9);
  ctx.strokeStyle = PAL.hair2;
  ctx.lineWidth = 1;
  ctx.stroke();

  // --- Thick straight EYEBROWS above sunglasses (serious look) ---
  const eyeY = hy - 2;

  ctx.strokeStyle = PAL.hair0;
  ctx.lineWidth = 2;
  ctx.lineCap = 'butt';
  // Left eyebrow — straight, angled inward
  ctx.beginPath();
  ctx.moveTo(hx - 9, eyeY - 3);
  ctx.lineTo(hx - 1, eyeY - 4);
  ctx.stroke();
  // Right eyebrow — straight, angled inward
  ctx.beginPath();
  ctx.moveTo(hx + 1, eyeY - 4);
  ctx.lineTo(hx + 9, eyeY - 3);
  ctx.stroke();

  // --- AVIATOR SUNGLASSES --- (THE defining feature)
  drawSunglasses(ctx, hx, eyeY);

  // --- Nose: organic curved shape ---
  ctx.beginPath();
  ctx.moveTo(hx - 1, hy - 1);
  ctx.quadraticCurveTo(hx, hy + 4, hx + 1, hy - 1);
  ctx.fillStyle = PAL.skin2;
  ctx.fill();
  // Nostril hints
  ctx.beginPath();
  ctx.arc(hx - 1.5, hy + 3, 0.8, 0, Math.PI * 2);
  ctx.fillStyle = PAL.skin0;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(hx + 1.5, hy + 3, 0.8, 0, Math.PI * 2);
  ctx.fillStyle = PAL.skin0;
  ctx.fill();

  // Mouth — SERIOUS expression, straight/slightly frowning
  ctx.beginPath();
  ctx.moveTo(hx - 3, hy + 5);
  ctx.quadraticCurveTo(hx, hy + 5.8, hx + 3, hy + 5);
  ctx.strokeStyle = PAL.mouthLine;
  ctx.lineWidth = 1;
  ctx.stroke();
  // Slight frown — downward corners
  ctx.beginPath();
  ctx.moveTo(hx - 3, hy + 5);
  ctx.lineTo(hx - 4, hy + 5.5);
  ctx.strokeStyle = PAL.mouthLine;
  ctx.lineWidth = 0.6;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(hx + 3, hy + 5);
  ctx.lineTo(hx + 4, hy + 5.5);
  ctx.stroke();

  // Ears — small ellipses
  ctx.beginPath();
  ctx.ellipse(hx - 11, hy - 1, 2, 3.5, 0, 0, Math.PI * 2);
  ctx.fillStyle = PAL.skin2;
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(hx - 11, hy - 1, 1, 2, 0, 0, Math.PI * 2);
  ctx.fillStyle = PAL.skin3;
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(hx + 11, hy - 1, 2, 3.5, 0, 0, Math.PI * 2);
  ctx.fillStyle = PAL.skin2;
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(hx + 11, hy - 1, 1, 2, 0, 0, Math.PI * 2);
  ctx.fillStyle = PAL.skin3;
  ctx.fill();

  // Jaw shadow — soft arc (angular jaw)
  ctx.beginPath();
  ctx.moveTo(hx - 7, hy + 8);
  ctx.lineTo(hx, hy + 12);
  ctx.lineTo(hx + 7, hy + 8);
  ctx.strokeStyle = PAL.skin0;
  ctx.lineWidth = 0.8;
  ctx.stroke();

  // Neck
  ctx.beginPath();
  ctx.ellipse(hx, hy + 13, 4, 3, 0, 0, Math.PI * 2);
  ctx.fillStyle = PAL.skin2;
  ctx.fill();
}

// ── TORSO — V-shaped, wide shoulders, narrow waist, tactical vest ──
function drawTorso(ctx, tx, ty) {
  const tw = 16, th = 24; // wider shoulders for imposing build

  // V-shaped torso — bezier trapezoid (WIDE at shoulders, NARROW at waist)
  const suitGrad = ctx.createLinearGradient(tx, ty, tx, ty + th);
  suitGrad.addColorStop(0, PAL.tac4);
  suitGrad.addColorStop(0.3, PAL.tac3);
  suitGrad.addColorStop(0.6, PAL.tac2);
  suitGrad.addColorStop(1, PAL.tac0);
  ctx.fillStyle = suitGrad;
  ctx.beginPath();
  ctx.moveTo(tx - tw, ty);
  ctx.quadraticCurveTo(tx - tw - 1, ty + th * 0.3, tx - tw + 5, ty + th);
  ctx.lineTo(tx + tw - 5, ty + th);
  ctx.quadraticCurveTo(tx + tw + 1, ty + th * 0.3, tx + tw, ty);
  ctx.closePath();
  ctx.fill();

  // High collar (rounded)
  ctx.beginPath();
  ctx.ellipse(tx, ty + 1, 6, 2.5, 0, 0, Math.PI * 2);
  ctx.fillStyle = PAL.tac4;
  ctx.fill();

  // Shoulder pads/protectors — rounded dark gray rectangles
  ctx.fillStyle = PAL.tac4;
  ctx.beginPath();
  ctx.ellipse(tx - tw + 2, ty + 2, 5, 3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(tx + tw - 2, ty + 2, 5, 3, 0, 0, Math.PI * 2);
  ctx.fill();
  // Shoulder pad darker edge
  ctx.beginPath();
  ctx.ellipse(tx - tw + 2, ty + 3.5, 4, 1.5, 0, 0, Math.PI);
  ctx.fillStyle = PAL.vest0;
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(tx + tw - 2, ty + 3.5, 4, 1.5, 0, 0, Math.PI);
  ctx.fillStyle = PAL.vest0;
  ctx.fill();

  // Tactical vest — follows torso shape with gradient, rounded edges
  const vestGrad = ctx.createLinearGradient(tx, ty + 4, tx, ty + th - 3);
  vestGrad.addColorStop(0, PAL.vest4);
  vestGrad.addColorStop(0.3, PAL.vest2);
  vestGrad.addColorStop(0.7, PAL.vest1);
  vestGrad.addColorStop(1, PAL.vest0);
  ctx.fillStyle = vestGrad;
  ctx.beginPath();
  ctx.moveTo(tx - 12, ty + 4);
  ctx.quadraticCurveTo(tx - 13, ty + th * 0.4, tx - 9, ty + th - 3);
  ctx.lineTo(tx + 9, ty + th - 3);
  ctx.quadraticCurveTo(tx + 13, ty + th * 0.4, tx + 12, ty + 4);
  ctx.closePath();
  ctx.fill();

  // Stitching — organic curved lines
  ctx.strokeStyle = PAL.vest0;
  ctx.lineWidth = 0.5;
  for (const xOff of [-7, -2, 3, 8]) {
    ctx.beginPath();
    ctx.moveTo(tx + xOff, ty + 6);
    ctx.lineTo(tx + xOff, ty + th - 5);
    ctx.setLineDash([2, 2]);
    ctx.stroke();
  }
  ctx.setLineDash([]);

  // Utility pouches — rounded
  const drawPouch = (px, py) => {
    capsule(ctx, px, py, 6, 5, PAL.vest0);
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.quadraticCurveTo(px + 3, py - 1, px + 6, py);
    ctx.lineTo(px + 6, py + 1);
    ctx.lineTo(px, py + 1);
    ctx.closePath();
    ctx.fillStyle = PAL.vest3;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(px + 3, py + 3, 1, 0, Math.PI * 2);
    ctx.fillStyle = PAL.blk2;
    ctx.fill();
  };
  drawPouch(tx - 10, ty + 8);
  drawPouch(tx + 5, ty + 8);

  // Shoulder straps — curved lines
  for (const side of [-1, 1]) {
    const sx = tx + side * (tw - 2);
    ctx.beginPath();
    ctx.moveTo(sx, ty + 3);
    ctx.quadraticCurveTo(sx + side * 0.5, ty + th / 2, sx - side * 1, ty + th - 6);
    ctx.strokeStyle = PAL.vest1;
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(sx, ty + 3);
    ctx.quadraticCurveTo(sx + side * 2, ty + 5, sx + side * 3, ty + 6);
    ctx.strokeStyle = PAL.vest3;
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // ★ STAR OF DAVID — EXACT CENTER of torso, gold metallic ★
  const starCenterY = ty + th / 2; // exact vertical midpoint
  drawStar(ctx, tx, starCenterY, 5);

  // Utility belt — rounded
  capsule(ctx, tx - tw, ty + th - 3, tw * 2, 3, PAL.blk1);
  ctx.beginPath();
  ctx.moveTo(tx - tw + 1, ty + th - 3);
  ctx.lineTo(tx + tw - 1, ty + th - 3);
  ctx.strokeStyle = PAL.blk2;
  ctx.lineWidth = 0.8;
  ctx.stroke();
  // Gold buckle — rounded
  ctx.beginPath();
  ctx.ellipse(tx, ty + th - 1.5, 2.5, 1.5, 0, 0, Math.PI * 2);
  ctx.fillStyle = PAL.gld2;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(tx, ty + th - 1.5, 0.8, 0, Math.PI * 2);
  ctx.fillStyle = PAL.gld4;
  ctx.fill();
  // Small side pouch on belt
  capsule(ctx, tx + 8, ty + th - 3, 4, 3, PAL.vest1);
}

// ── ARM — organic curved limb with rounded glove ────────────────
function drawArm(ctx, ax, ay, len) {
  const armGrad = ctx.createLinearGradient(ax, ay, ax, ay + len - 4);
  armGrad.addColorStop(0, PAL.tac4);
  armGrad.addColorStop(0.3, PAL.tac3);
  armGrad.addColorStop(0.7, PAL.tac2);
  armGrad.addColorStop(1, PAL.tac1);
  ctx.fillStyle = armGrad;
  ctx.beginPath();
  ctx.ellipse(ax, ay + (len - 4) / 2, 3.5, (len - 4) / 2, 0, 0, Math.PI * 2);
  ctx.fill();

  // Shoulder cap
  ctx.beginPath();
  ctx.arc(ax, ay + 1, 3, 0, Math.PI * 2);
  ctx.fillStyle = PAL.tac4;
  ctx.fill();

  // Cuff
  ctx.beginPath();
  ctx.ellipse(ax, ay + len - 5, 3.5, 1.5, 0, 0, Math.PI * 2);
  ctx.fillStyle = PAL.tac4;
  ctx.fill();

  // Black tactical glove — rounded
  const gloveY = ay + len - 4;
  const gloveGrad = ctx.createLinearGradient(ax, gloveY, ax, gloveY + 4);
  gloveGrad.addColorStop(0, PAL.blk2);
  gloveGrad.addColorStop(0.5, PAL.blk1);
  gloveGrad.addColorStop(1, PAL.blk0);
  ctx.fillStyle = gloveGrad;
  ctx.beginPath();
  ctx.ellipse(ax, gloveY + 2, 3.5, 2.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(ax, gloveY + 1, 1, 0, Math.PI * 2);
  ctx.fillStyle = PAL.blk3;
  ctx.fill();
}

// ── SILENCED PISTOL — in right hand ────────────────────────────
function drawPistol(ctx, px, py, direction) {
  // Pistol body — black
  ctx.fillStyle = '#0e0e0e';
  ctx.beginPath();
  ctx.ellipse(px + direction * 3, py, 4, 2, 0, 0, Math.PI * 2);
  ctx.fill();
  // Grip — darker
  ctx.fillStyle = '#1a1a1a';
  ctx.beginPath();
  ctx.ellipse(px + direction * 1, py + 2, 1.5, 2.5, 0, 0, Math.PI * 2);
  ctx.fill();
  // Silencer — elongated cylinder ahead of barrel
  ctx.fillStyle = '#333333';
  ctx.beginPath();
  ctx.ellipse(px + direction * 7, py - 0.5, 3, 1.2, 0, 0, Math.PI * 2);
  ctx.fill();
  // Silencer tip
  ctx.fillStyle = '#2a2a2a';
  ctx.beginPath();
  ctx.arc(px + direction * 10, py - 0.5, 1, 0, Math.PI * 2);
  ctx.fill();
  // Barrel highlight
  ctx.strokeStyle = 'rgba(100,100,100,0.3)';
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(px + direction * 2, py - 1);
  ctx.lineTo(px + direction * 9, py - 1);
  ctx.stroke();
}

// ── LEGS — organic tapered limbs ────────────────────────────────
function drawLeg(ctx, lx, ly, h, side) {
  const w = 7;
  const cx = lx + w / 2;
  const thighH = Math.floor(h * 0.48);
  const kneeH = 3;
  const bootH = 6; // bigger, heavier boots
  const shinH = h - thighH - kneeH - bootH;

  // Thigh — tapered
  const thighGrad = ctx.createLinearGradient(cx, ly, cx, ly + thighH);
  thighGrad.addColorStop(0, PAL.tac3);
  thighGrad.addColorStop(0.5, PAL.tac2);
  thighGrad.addColorStop(1, PAL.tac1);
  ctx.fillStyle = thighGrad;
  ctx.beginPath();
  ctx.moveTo(cx - 3.5, ly);
  ctx.quadraticCurveTo(cx - 4, ly + thighH * 0.5, cx - 3, ly + thighH);
  ctx.lineTo(cx + 3, ly + thighH);
  ctx.quadraticCurveTo(cx + 4, ly + thighH * 0.5, cx + 3.5, ly);
  ctx.closePath();
  ctx.fill();

  // Pocket — rounded
  if (side === 'left') {
    capsule(ctx, lx, ly + 2, 4, 3, PAL.tac1);
    ctx.beginPath();
    ctx.moveTo(lx, ly + 2);
    ctx.quadraticCurveTo(lx + 2, ly + 1.5, lx + 4, ly + 2);
    ctx.strokeStyle = PAL.tac3;
    ctx.lineWidth = 0.5;
    ctx.stroke();
  } else {
    capsule(ctx, lx + 3, ly + 2, 4, 3, PAL.tac1);
    ctx.beginPath();
    ctx.moveTo(lx + 3, ly + 2);
    ctx.quadraticCurveTo(lx + 5, ly + 1.5, lx + 7, ly + 2);
    ctx.strokeStyle = PAL.tac3;
    ctx.lineWidth = 0.5;
    ctx.stroke();
  }

  // Knee pad — rounded capsule shape
  const kneeY = ly + thighH;
  capsule(ctx, lx, kneeY, w, kneeH, PAL.vest2);
  ctx.beginPath();
  ctx.ellipse(cx, kneeY + 0.5, 3, 0.8, 0, 0, Math.PI * 2);
  ctx.fillStyle = PAL.vest4;
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx, kneeY + kneeH - 0.5, 3, 0.5, 0, 0, Math.PI * 2);
  ctx.fillStyle = PAL.vest0;
  ctx.fill();

  // Shin — tapered
  const shinY = kneeY + kneeH;
  const shinGrad = ctx.createLinearGradient(cx, shinY, cx, shinY + shinH);
  shinGrad.addColorStop(0, PAL.tac2);
  shinGrad.addColorStop(0.5, PAL.tac1);
  shinGrad.addColorStop(1, PAL.tac1);
  ctx.fillStyle = shinGrad;
  ctx.beginPath();
  ctx.moveTo(cx - 3, shinY);
  ctx.quadraticCurveTo(cx - 3.5, shinY + shinH * 0.5, cx - 3, shinY + shinH);
  ctx.lineTo(cx + 3, shinY + shinH);
  ctx.quadraticCurveTo(cx + 3.5, shinY + shinH * 0.5, cx + 3, shinY);
  ctx.closePath();
  ctx.fill();

  // TACTICAL BOOTS — wider than ankles, thick sole, robust
  const bootY = shinY + shinH;
  const bootGrad = ctx.createLinearGradient(cx, bootY, cx, bootY + bootH);
  bootGrad.addColorStop(0, PAL.boot2);
  bootGrad.addColorStop(0.3, PAL.boot1);
  bootGrad.addColorStop(0.7, PAL.boot0);
  bootGrad.addColorStop(1, '#080808');
  ctx.fillStyle = bootGrad;
  ctx.beginPath();
  ctx.moveTo(lx - 1, bootY);
  ctx.quadraticCurveTo(lx - 1.5, bootY + bootH - 2, lx - 1, bootY + bootH - 2);
  ctx.lineTo(lx + w + 2, bootY + bootH - 2);
  ctx.quadraticCurveTo(lx + w + 2.5, bootY, lx + w + 1, bootY);
  ctx.closePath();
  ctx.fill();

  // Boot thick sole — visibly wider and heavier
  ctx.fillStyle = '#080808';
  ctx.beginPath();
  ctx.moveTo(lx - 2, bootY + bootH - 2);
  ctx.lineTo(lx + w + 3, bootY + bootH - 2);
  ctx.lineTo(lx + w + 3, bootY + bootH);
  ctx.quadraticCurveTo(cx, bootY + bootH + 1, lx - 2, bootY + bootH);
  ctx.closePath();
  ctx.fill();

  // Boot lace highlights
  ctx.beginPath();
  ctx.arc(cx, bootY + 1.5, 0.6, 0, Math.PI * 2);
  ctx.fillStyle = PAL.blk3;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx + 1.5, bootY + 1.5, 0.6, 0, Math.PI * 2);
  ctx.fillStyle = PAL.blk3;
  ctx.fill();
}

// ── OUTLINE — draws a 1px dark silhouette around the character ──
function applyOutline(canvas) {
  const w = canvas.width;
  const h = canvas.height;
  const ctx = canvas.getContext('2d');

  const imageData = ctx.getImageData(0, 0, w, h);
  const data = imageData.data;

  const outlineCanvas = document.createElement('canvas');
  outlineCanvas.width = w;
  outlineCanvas.height = h;
  const outCtx = outlineCanvas.getContext('2d');

  outCtx.fillStyle = PAL.outline;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;
      if (data[idx + 3] > 0) {
        const offsets = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        for (const [dx, dy] of offsets) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
            const ni = (ny * w + nx) * 4;
            if (data[ni + 3] === 0) {
              outCtx.fillRect(nx, ny, 1, 1);
            }
          }
        }
      }
    }
  }

  const resultCanvas = document.createElement('canvas');
  resultCanvas.width = w;
  resultCanvas.height = h;
  const rCtx = resultCanvas.getContext('2d');
  rCtx.drawImage(outlineCanvas, 0, 0);
  rCtx.drawImage(canvas, 0, 0);

  return resultCanvas;
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
  ctx.translate(MX - 17, torsoY + 2);
  ctx.rotate(-armSwing);
  drawArm(ctx, 0, 0, armLen);
  ctx.restore();

  // Legs
  drawLeg(ctx, MX - 10, hipY + legL, legH, 'left');
  drawLeg(ctx, MX + 3, hipY + legR, legH, 'right');

  // Torso
  drawTorso(ctx, MX, torsoY);

  // Right arm (in front) — with pistol
  ctx.save();
  ctx.translate(MX + 16, torsoY + 2);
  ctx.rotate(armSwing);
  drawArm(ctx, 0, 0, armLen);
  // Silenced pistol in right hand
  drawPistol(ctx, 3, armLen - 2, 1);
  ctx.restore();

  // Head
  drawHead(ctx, MX, headCY);

  // Apply 1px dark outline around the entire character silhouette
  return applyOutline(canvas);
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
  // Remove existing animations first to avoid duplicate key issues across scenes
  const keys = ['idle', 'run', 'jump', 'fall', 'shoot'];
  for (const k of keys) {
    if (scene.anims.exists(k)) scene.anims.remove(k);
  }

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
