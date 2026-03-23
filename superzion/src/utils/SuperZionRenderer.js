// ═══════════════════════════════════════════════════════════════
// SuperZionRenderer.js — Centralized character renderer for
// SuperZion: elite special forces agent with aviator sunglasses,
// tactical vest, Star of David, silenced pistol, pompadour hair.
//
// Exports:
//   drawSuperZionSide(ctx, cx, cy, scale, facing, opts)
//   drawSuperZionTopDown(ctx, cx, cy, scale, dir, frame)
//   drawSuperZionForward(gfx, cx, cy, scale, opts)
//   drawStarOfDavid(ctx, cx, cy, size)
// ═══════════════════════════════════════════════════════════════

// ── Internal: draw a 6-pointed star path ──
function _drawStar6(ctx, cx, cy, r) {
  // Triangle pointing up
  ctx.beginPath();
  ctx.moveTo(cx, cy - r);
  ctx.lineTo(cx - r * 0.866, cy + r * 0.5);
  ctx.lineTo(cx + r * 0.866, cy + r * 0.5);
  ctx.closePath();
  // Triangle pointing down (overlapping)
  ctx.moveTo(cx, cy + r);
  ctx.lineTo(cx - r * 0.866, cy - r * 0.5);
  ctx.lineTo(cx + r * 0.866, cy - r * 0.5);
  ctx.closePath();
}

/**
 * Draw just the Star of David (gold, with glow).
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} cx - center X
 * @param {number} cy - center Y
 * @param {number} size - radius of the star
 */
export function drawStarOfDavid(ctx, cx, cy, size) {
  const r = size;
  // Glow halo
  ctx.fillStyle = 'rgba(255, 215, 0, 0.15)';
  _drawStar6(ctx, cx, cy, r * 1.3);
  ctx.fill();
  // Main star
  ctx.fillStyle = '#FFD700';
  _drawStar6(ctx, cx, cy, r);
  ctx.fill();
  // Border
  ctx.strokeStyle = '#B8860B';
  ctx.lineWidth = r * 0.12;
  _drawStar6(ctx, cx, cy, r);
  ctx.stroke();
}

/**
 * Draw SuperZion side-view on a canvas 2D context.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} cx - center X
 * @param {number} cy - center Y (character center, not top)
 * @param {number} scale - multiplier (1 = 48px tall)
 * @param {string} facing - 'right' or 'left'
 * @param {object} opts - { pose: 'idle'|'walk1'|'walk2'|'jump'|'shoot'|'celebrate', showGun: true }
 */
export function drawSuperZionSide(ctx, cx, cy, scale, facing, opts = {}) {
  const s = scale;
  const h = 48 * s;  // total height
  const top = cy - h / 2;  // top of head

  // Handle left facing via mirror
  if (facing === 'left') {
    ctx.save();
    ctx.scale(-1, 1);
    ctx.translate(-2 * cx, 0);
  }

  // ── HAIR (top of head) ──
  ctx.fillStyle = '#1A1A1A';
  ctx.beginPath();
  ctx.moveTo(cx - 5 * s, top + 3 * s);
  ctx.bezierCurveTo(cx - 6 * s, top, cx + 6 * s, top - 1 * s, cx + 5 * s, top + 3 * s);
  ctx.lineTo(cx + 5 * s, top + 6 * s);
  ctx.lineTo(cx - 5 * s, top + 6 * s);
  ctx.closePath();
  ctx.fill();
  // Hair highlight
  ctx.strokeStyle = '#2A2A2A';
  ctx.lineWidth = 0.8 * s;
  ctx.beginPath();
  ctx.moveTo(cx - 5 * s, top + 3 * s);
  ctx.bezierCurveTo(cx - 5 * s, top + 1 * s, cx + 5 * s, top, cx + 5 * s, top + 3 * s);
  ctx.stroke();

  // ── FACE (skin ellipse) ──
  ctx.fillStyle = '#C49A6C';
  ctx.beginPath();
  ctx.ellipse(cx, top + 8 * s, 5 * s, 6 * s, 0, 0, Math.PI * 2);
  ctx.fill();

  // ── SUNGLASSES ──
  // Lenses
  ctx.fillStyle = '#111111';
  ctx.beginPath();
  ctx.ellipse(cx - 2.5 * s, top + 7 * s, 2.5 * s, 1.8 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx + 2.5 * s, top + 7 * s, 2.5 * s, 1.8 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  // Frame
  ctx.strokeStyle = '#333333';
  ctx.lineWidth = 0.5 * s;
  ctx.beginPath();
  ctx.ellipse(cx - 2.5 * s, top + 7 * s, 2.5 * s, 1.8 * s, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(cx + 2.5 * s, top + 7 * s, 2.5 * s, 1.8 * s, 0, 0, Math.PI * 2);
  ctx.stroke();
  // Bridge
  ctx.beginPath();
  ctx.moveTo(cx - 0.5 * s, top + 7 * s);
  ctx.lineTo(cx + 0.5 * s, top + 7 * s);
  ctx.stroke();
  // Reflection (cyan diagonal on each lens)
  ctx.strokeStyle = 'rgba(68, 136, 204, 0.5)';
  ctx.lineWidth = 1.2 * s;
  ctx.beginPath();
  ctx.moveTo(cx - 3.5 * s, top + 6 * s);
  ctx.lineTo(cx - 1.5 * s, top + 7.5 * s);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx + 1.5 * s, top + 6 * s);
  ctx.lineTo(cx + 3.5 * s, top + 7.5 * s);
  ctx.stroke();

  // ── EYEBROWS (above glasses) ──
  ctx.fillStyle = '#111111';
  ctx.fillRect(cx - 4.5 * s, top + 5 * s, 3.5 * s, 1.2 * s);
  ctx.fillRect(cx + 1 * s, top + 5 * s, 3.5 * s, 1.2 * s);

  // ── MOUTH (serious frown) ──
  ctx.strokeStyle = '#8A6A4A';
  ctx.lineWidth = 0.8 * s;
  ctx.beginPath();
  ctx.moveTo(cx - 2 * s, top + 11 * s);
  ctx.lineTo(cx + 2 * s, top + 11 * s);
  ctx.stroke();
  // Slight downward corners
  ctx.beginPath();
  ctx.moveTo(cx - 2 * s, top + 11 * s);
  ctx.lineTo(cx - 2.5 * s, top + 11.5 * s);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx + 2 * s, top + 11 * s);
  ctx.lineTo(cx + 2.5 * s, top + 11.5 * s);
  ctx.stroke();

  // ── JAWLINE (angular) ──
  ctx.strokeStyle = '#A07850';
  ctx.lineWidth = 0.6 * s;
  ctx.beginPath();
  ctx.moveTo(cx - 5 * s, top + 9 * s);
  ctx.bezierCurveTo(cx - 5 * s, top + 13 * s, cx + 5 * s, top + 13 * s, cx + 5 * s, top + 9 * s);
  ctx.stroke();

  // ── NECK ──
  ctx.fillStyle = '#C49A6C';
  ctx.fillRect(cx - 2.5 * s, top + 14 * s, 5 * s, 2 * s);

  // ── SHOULDERS + TORSO (V-shape) ──
  const shoulderW = 14.5 * s;
  const waistW = 9.5 * s;
  const torsoTop = top + 16 * s;
  const torsoBot = top + 31 * s;

  // Tactical vest body
  ctx.fillStyle = '#1A1A1A';
  ctx.beginPath();
  ctx.moveTo(cx - shoulderW, torsoTop);
  ctx.lineTo(cx + shoulderW, torsoTop);
  ctx.bezierCurveTo(cx + shoulderW, torsoBot - 4 * s, cx + waistW, torsoBot, cx + waistW, torsoBot);
  ctx.lineTo(cx - waistW, torsoBot);
  ctx.bezierCurveTo(cx - waistW, torsoBot, cx - shoulderW, torsoBot - 4 * s, cx - shoulderW, torsoTop);
  ctx.closePath();
  ctx.fill();

  // Shoulder pads
  ctx.fillStyle = '#3A3A3A';
  ctx.beginPath();
  ctx.ellipse(cx - shoulderW + 2 * s, torsoTop + 1.5 * s, 3 * s, 1.5 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx + shoulderW - 2 * s, torsoTop + 1.5 * s, 3 * s, 1.5 * s, 0, 0, Math.PI * 2);
  ctx.fill();

  // Vest V-neck
  ctx.fillStyle = '#0A0A0A';
  ctx.beginPath();
  ctx.moveTo(cx - 3 * s, torsoTop);
  ctx.lineTo(cx, torsoTop + 5 * s);
  ctx.lineTo(cx + 3 * s, torsoTop);
  ctx.closePath();
  ctx.fill();

  // Vest strap lines
  ctx.strokeStyle = '#333333';
  ctx.lineWidth = 0.5 * s;
  ctx.beginPath();
  ctx.moveTo(cx - shoulderW + 3 * s, torsoTop + 1 * s);
  ctx.lineTo(cx - 2 * s, torsoTop + 8 * s);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx + shoulderW - 3 * s, torsoTop + 1 * s);
  ctx.lineTo(cx + 2 * s, torsoTop + 8 * s);
  ctx.stroke();

  // Pockets
  ctx.strokeStyle = '#2A2A2A';
  ctx.lineWidth = 0.5 * s;
  ctx.strokeRect(cx - 6 * s, torsoTop + 9 * s, 4 * s, 3 * s);
  ctx.strokeRect(cx + 2 * s, torsoTop + 9 * s, 4 * s, 3 * s);

  // ── STAR OF DAVID (centered on chest) ──
  drawStarOfDavid(ctx, cx, torsoTop + (torsoBot - torsoTop) * 0.4, 3.5 * s);

  // ── ARMS ──
  // Left arm (against body)
  ctx.fillStyle = '#1A1A1A';
  ctx.beginPath();
  ctx.ellipse(cx - shoulderW - 1 * s, torsoTop + 8 * s, 2.5 * s, 7 * s, 0.1, 0, Math.PI * 2);
  ctx.fill();
  // Left hand (glove)
  ctx.fillStyle = '#222222';
  ctx.beginPath();
  ctx.ellipse(cx - shoulderW - 1 * s, torsoTop + 15 * s, 2 * s, 2 * s, 0, 0, Math.PI * 2);
  ctx.fill();

  // Right arm (holding pistol, slightly angled out)
  ctx.fillStyle = '#1A1A1A';
  ctx.beginPath();
  ctx.ellipse(cx + shoulderW + 2 * s, torsoTop + 7 * s, 2.5 * s, 7 * s, -0.15, 0, Math.PI * 2);
  ctx.fill();
  // Right hand + pistol
  ctx.fillStyle = '#222222';
  ctx.beginPath();
  ctx.ellipse(cx + shoulderW + 3 * s, torsoTop + 14 * s, 2 * s, 2 * s, 0, 0, Math.PI * 2);
  ctx.fill();

  // ── PISTOL WITH SILENCER ──
  if (opts.showGun !== false) {
    const gunX = cx + shoulderW + 5 * s;
    const gunY = torsoTop + 14 * s;
    // Body
    ctx.fillStyle = '#0A0A0A';
    ctx.fillRect(gunX, gunY - 1 * s, 5 * s, 2 * s);
    // Silencer
    ctx.fillStyle = '#2A2A2A';
    ctx.fillRect(gunX + 5 * s, gunY - 0.6 * s, 3 * s, 1.2 * s);
    // Trigger guard
    ctx.strokeStyle = '#444444';
    ctx.lineWidth = 0.4 * s;
    ctx.beginPath();
    ctx.arc(gunX + 2 * s, gunY + 1.5 * s, 1 * s, 0, Math.PI);
    ctx.stroke();
  }

  // ── LEGS (cargo pants) ──
  const legTop = top + 32 * s;
  const legBot = top + 44 * s;
  ctx.fillStyle = '#151518';
  // Left leg
  ctx.beginPath();
  ctx.moveTo(cx - waistW, legTop);
  ctx.bezierCurveTo(cx - waistW, legBot, cx - 3 * s, legBot, cx - 2 * s, legBot);
  ctx.lineTo(cx - 2 * s, legTop);
  ctx.closePath();
  ctx.fill();
  // Right leg
  ctx.beginPath();
  ctx.moveTo(cx + 2 * s, legTop);
  ctx.lineTo(cx + 2 * s, legBot);
  ctx.bezierCurveTo(cx + 3 * s, legBot, cx + waistW, legBot, cx + waistW, legTop);
  ctx.closePath();
  ctx.fill();
  // Cargo pockets
  ctx.strokeStyle = '#252525';
  ctx.lineWidth = 0.4 * s;
  ctx.strokeRect(cx - waistW + 1 * s, legTop + 4 * s, 3 * s, 2.5 * s);
  ctx.strokeRect(cx + waistW - 4 * s, legTop + 4 * s, 3 * s, 2.5 * s);

  // ── BOOTS ──
  const bootTop = top + 44 * s;
  const bootBot = top + 48 * s;
  ctx.fillStyle = '#0D0D0D';
  // Left boot
  ctx.beginPath();
  ctx.moveTo(cx - waistW - 0.5 * s, bootBot);
  ctx.lineTo(cx - waistW - 0.5 * s, bootTop);
  ctx.lineTo(cx - 2 * s, bootTop);
  ctx.lineTo(cx - 1.5 * s, bootBot);
  ctx.closePath();
  ctx.fill();
  // Right boot
  ctx.beginPath();
  ctx.moveTo(cx + 1.5 * s, bootBot);
  ctx.lineTo(cx + 2 * s, bootTop);
  ctx.lineTo(cx + waistW + 0.5 * s, bootTop);
  ctx.lineTo(cx + waistW + 0.5 * s, bootBot);
  ctx.closePath();
  ctx.fill();
  // Soles
  ctx.fillStyle = '#333333';
  ctx.fillRect(cx - waistW - 1 * s, bootBot, waistW - 0.5 * s, 1 * s);
  ctx.fillRect(cx + 1 * s, bootBot, waistW - 0.5 * s, 1 * s);

  if (facing === 'left') {
    ctx.restore();
  }
}

/**
 * Draw SuperZion top-down view.
 * Simplified version for 16-20px sprites. Same color scheme.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} cx - center X
 * @param {number} cy - center Y
 * @param {number} scale - multiplier (1 = fits 16x20 area)
 * @param {string} dir - 'up'|'down'|'left'|'right'
 * @param {number} frame - 0 or 1 (walk animation)
 */
export function drawSuperZionTopDown(ctx, cx, cy, scale, dir, frame) {
  const s = scale;

  // Body (black tactical suit)
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(cx - 4 * s, cy - 4 * s, 8 * s, 10 * s);
  // Tactical vest overlay
  ctx.fillStyle = '#3a3a3a';
  ctx.fillRect(cx - 3 * s, cy - 3 * s, 6 * s, 8 * s);

  // Head — Mediterranean skin tone
  ctx.fillStyle = '#C49A6C';
  ctx.beginPath();
  ctx.arc(cx, cy - 5 * s, 4 * s, 0, Math.PI * 2);
  ctx.fill();

  // Slicked-back black hair
  ctx.fillStyle = '#1A1A1A';
  ctx.beginPath();
  ctx.ellipse(cx, cy - 8 * s, 4.5 * s, 2.5 * s, 0, Math.PI, 0);
  ctx.fill();
  // Hair volume pompadour
  ctx.beginPath();
  ctx.ellipse(cx - 0.5 * s, cy - 8.5 * s, 4 * s, 2 * s, 0, 0, Math.PI * 2);
  ctx.fill();

  // AVIATOR SUNGLASSES — direction-dependent
  if (dir === 'down') {
    // Two dark ovals covering eyes
    ctx.fillStyle = '#0A0A0A';
    ctx.beginPath(); ctx.ellipse(cx - 2 * s, cy - 5.5 * s, 1.8 * s, 1 * s, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx + 2 * s, cy - 5.5 * s, 1.8 * s, 1 * s, 0, 0, Math.PI * 2); ctx.fill();
    // Frame bridge
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 0.5 * s;
    ctx.beginPath(); ctx.moveTo(cx - 0.5 * s, cy - 5.5 * s); ctx.lineTo(cx + 0.5 * s, cy - 5.5 * s); ctx.stroke();
    // Reflection pixel
    ctx.fillStyle = 'rgba(180, 220, 255, 0.4)';
    ctx.fillRect(cx - 3 * s, cy - 6 * s, 1 * s, 1 * s);
    ctx.fillRect(cx + 1 * s, cy - 6 * s, 1 * s, 1 * s);
    // Serious mouth
    ctx.strokeStyle = '#6a4030';
    ctx.lineWidth = 0.6 * s;
    ctx.beginPath(); ctx.moveTo(cx - 1 * s, cy - 3 * s); ctx.lineTo(cx + 1 * s, cy - 3 * s); ctx.stroke();
  } else if (dir === 'up') {
    // Back of head — just hair
    ctx.fillStyle = '#1A1A1A';
    ctx.fillRect(cx - 4 * s, cy - 7 * s, 8 * s, 3 * s);
  } else if (dir === 'left') {
    // Side sunglasses — single dark oval
    ctx.fillStyle = '#0A0A0A';
    ctx.beginPath(); ctx.ellipse(cx - 3 * s, cy - 5.5 * s, 1.8 * s, 1 * s, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(180, 220, 255, 0.4)';
    ctx.fillRect(cx - 4 * s, cy - 6 * s, 1 * s, 1 * s);
  } else {
    // right
    ctx.fillStyle = '#0A0A0A';
    ctx.beginPath(); ctx.ellipse(cx + 3 * s, cy - 5.5 * s, 1.8 * s, 1 * s, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(180, 220, 255, 0.4)';
    ctx.fillRect(cx + 3 * s, cy - 6 * s, 1 * s, 1 * s);
  }

  // Gold Star of David on chest (tiny but visible)
  ctx.fillStyle = '#FFD700';
  // Tiny up triangle
  ctx.beginPath();
  ctx.moveTo(cx, cy - 1 * s); ctx.lineTo(cx - 1.5 * s, cy + 1 * s); ctx.lineTo(cx + 1.5 * s, cy + 1 * s); ctx.closePath();
  ctx.fill();
  // Tiny down triangle
  ctx.beginPath();
  ctx.moveTo(cx, cy + 2 * s); ctx.lineTo(cx - 1.5 * s, cy); ctx.lineTo(cx + 1.5 * s, cy); ctx.closePath();
  ctx.fill();

  // Legs with walk animation — black tactical pants
  ctx.fillStyle = '#1a1a1a';
  if (dir === 'down' || dir === 'up') {
    const offset = frame === 1 ? 2 * s : 0;
    ctx.fillRect(cx - 3 * s - offset, cy + 6 * s, 3 * s, 4 * s);
    ctx.fillRect(cx + offset, cy + 6 * s, 3 * s, 4 * s);
  } else {
    const offset = frame === 1 ? 2 * s : 0;
    ctx.fillRect(cx - 2 * s, cy + 6 * s - offset, 4 * s, 4 * s);
    if (frame === 1) ctx.fillRect(cx - 2 * s, cy + 6 * s + 1 * s, 4 * s, 3 * s);
  }
  // Boots — slightly wider, dark
  ctx.fillStyle = '#0e0e0e';
  if (dir === 'down' || dir === 'up') {
    const offset = frame === 1 ? 2 * s : 0;
    ctx.fillRect(cx - 4 * s - offset, cy + 9 * s, 4 * s, 1 * s);
    ctx.fillRect(cx - 1 * s + offset, cy + 9 * s, 4 * s, 1 * s);
  } else {
    ctx.fillRect(cx - 3 * s, cy + 9 * s, 5 * s, 1 * s);
  }

  // Silenced pistol (right hand side)
  ctx.fillStyle = '#0e0e0e';
  if (dir === 'right') {
    ctx.fillRect(cx + 4 * s, cy, 3 * s, 1.5 * s);
    ctx.fillStyle = '#333333';
    ctx.fillRect(cx + 6 * s, cy, 2 * s, 1 * s);
  } else if (dir === 'left') {
    ctx.fillRect(cx - 8 * s, cy, 3 * s, 1.5 * s);
    ctx.fillStyle = '#333333';
    ctx.fillRect(cx - 8 * s, cy, 2 * s, 1 * s);
  } else {
    ctx.fillRect(cx + 4 * s, cy, 2 * s, 2 * s);
    ctx.fillStyle = '#333333';
    ctx.fillRect(cx + 4 * s, cy, 1 * s, 3 * s);
  }
}

/**
 * Draw SuperZion facing forward (for victory scene etc).
 * Uses Phaser Graphics API instead of canvas.
 * @param {Phaser.GameObjects.Graphics} gfx
 * @param {number} cx
 * @param {number} cy
 * @param {number} scale
 * @param {object} opts - { celebrate: false, showStar: true }
 */
export function drawSuperZionForward(gfx, cx, cy, scale, opts = {}) {
  const s = scale;
  const baseY = cy;

  // === LEGS — firm combat stance ===
  gfx.fillStyle(0x1a1a1a, 1);
  gfx.fillRect(cx - 14 * s, baseY + 12 * s, 12 * s, 42 * s);
  gfx.fillRect(cx + 2 * s, baseY + 12 * s, 12 * s, 42 * s);

  // === TACTICAL BOOTS — wider than ankles, thick sole ===
  gfx.fillStyle(0x0e0e0e, 1);
  gfx.fillRect(cx - 16 * s, baseY + 52 * s, 16 * s, 7 * s);
  gfx.fillRect(cx + 0 * s, baseY + 52 * s, 16 * s, 7 * s);
  // Thick soles
  gfx.fillStyle(0x080808, 1);
  gfx.fillRect(cx - 17 * s, baseY + 58 * s, 18 * s, 3 * s);
  gfx.fillRect(cx - 1 * s, baseY + 58 * s, 18 * s, 3 * s);

  // === V-SHAPED TORSO — wide shoulders, narrow waist ===
  gfx.fillStyle(0x1a1a1a, 1);
  gfx.fillRect(cx - 14 * s, baseY - 20 * s, 28 * s, 44 * s);
  // Extra shoulder width
  gfx.fillRect(cx - 22 * s, baseY - 24 * s, 44 * s, 8 * s);

  // === TACTICAL VEST — dark gray with details ===
  gfx.fillStyle(0x3a3a3a, 1);
  gfx.fillRect(cx - 13 * s, baseY - 18 * s, 26 * s, 36 * s);
  // Vest straps
  gfx.fillStyle(0x444448, 1);
  gfx.fillRect(cx - 11 * s, baseY - 18 * s, 3 * s, 34 * s);
  gfx.fillRect(cx + 8 * s, baseY - 18 * s, 3 * s, 34 * s);
  // Vest pockets
  gfx.fillStyle(0x4e4e52, 1);
  gfx.fillRect(cx - 9 * s, baseY - 8 * s, 7 * s, 6 * s);
  gfx.fillRect(cx + 2 * s, baseY - 8 * s, 7 * s, 6 * s);

  // === SHOULDER PADS — rounded protectors ===
  gfx.fillStyle(0x3a3a3a, 1);
  gfx.fillEllipse(cx - 20 * s, baseY - 22 * s, 10 * s, 7 * s);
  gfx.fillEllipse(cx + 20 * s, baseY - 22 * s, 10 * s, 7 * s);

  // === BELT ===
  gfx.fillStyle(0x1a1a1a, 1);
  gfx.fillRect(cx - 15 * s, baseY + 20 * s, 30 * s, 5 * s);
  // Belt buckle (gold)
  gfx.fillStyle(0xFFD700, 0.8);
  gfx.fillRect(cx - 3 * s, baseY + 21 * s, 6 * s, 3 * s);

  // === ARMS ===
  gfx.fillStyle(0x1a1a1a, 1);
  gfx.fillRect(cx - 28 * s, baseY - 20 * s, 10 * s, 34 * s);
  gfx.fillRect(cx + 18 * s, baseY - 20 * s, 10 * s, 34 * s);

  // === GLOVED HANDS ===
  gfx.fillStyle(0x222222, 1);
  gfx.fillCircle(cx - 23 * s, baseY + 16 * s, 5 * s);
  gfx.fillCircle(cx + 23 * s, baseY + 16 * s, 5 * s);

  // === NECK ===
  gfx.fillStyle(0xC49A6C, 1);
  gfx.fillRect(cx - 5 * s, baseY - 30 * s, 10 * s, 6 * s);

  // === HEAD — Mediterranean skin ===
  gfx.fillStyle(0xC49A6C, 1);
  gfx.fillCircle(cx, baseY - 42 * s, 16 * s);
  // Shadow skin undertone on left side
  gfx.fillStyle(0xb08657, 0.4);
  gfx.fillRect(cx - 14 * s, baseY - 52 * s, 8 * s, 18 * s);
  // Highlight on right side
  gfx.fillStyle(0xd4aa7c, 0.3);
  gfx.fillRect(cx + 6 * s, baseY - 52 * s, 8 * s, 18 * s);
  // Angular jawline
  gfx.fillStyle(0xb08657, 0.5);
  gfx.fillTriangle(
    cx - 12 * s, baseY - 32 * s,
    cx, baseY - 26 * s,
    cx + 12 * s, baseY - 32 * s
  );

  // === SLICKED-BACK HAIR with pompadour ===
  gfx.fillStyle(0x1a1a1a, 1);
  gfx.fillEllipse(cx, baseY - 56 * s, 32 * s, 14 * s);
  // Pompadour volume — higher in front
  gfx.fillEllipse(cx - 2 * s, baseY - 58 * s, 28 * s, 10 * s);

  // === THICK STRAIGHT EYEBROWS above sunglasses ===
  gfx.fillStyle(0x1a1a1a, 1);
  gfx.fillRect(cx - 10 * s, baseY - 47 * s, 8 * s, 2 * s);
  gfx.fillRect(cx + 2 * s, baseY - 47 * s, 8 * s, 2 * s);

  // === AVIATOR SUNGLASSES — the defining feature ===
  // Left lens — dark oval
  gfx.fillStyle(0x0A0A0A, 1);
  gfx.fillEllipse(cx - 6 * s, baseY - 43 * s, 10 * s, 5 * s);
  // Right lens
  gfx.fillEllipse(cx + 6 * s, baseY - 43 * s, 10 * s, 5 * s);
  // Frame — thin dark gray outlines
  gfx.lineStyle(1, 0x333333, 1);
  gfx.beginPath();
  gfx.arc(cx - 6 * s, baseY - 43 * s, 5 * s, 0, Math.PI * 2);
  gfx.strokePath();
  gfx.beginPath();
  gfx.arc(cx + 6 * s, baseY - 43 * s, 5 * s, 0, Math.PI * 2);
  gfx.strokePath();
  // Nose bridge
  gfx.lineStyle(1.5, 0x333333, 1);
  gfx.beginPath();
  gfx.moveTo(cx - 1 * s, baseY - 43 * s);
  gfx.lineTo(cx + 1 * s, baseY - 43 * s);
  gfx.strokePath();
  // Reflections — diagonal cyan/white lines
  gfx.lineStyle(1.5, 0xB4DCFF, 0.4);
  gfx.beginPath();
  gfx.moveTo(cx - 9 * s, baseY - 44 * s);
  gfx.lineTo(cx - 3 * s, baseY - 42 * s);
  gfx.strokePath();
  gfx.beginPath();
  gfx.moveTo(cx + 3 * s, baseY - 44 * s);
  gfx.lineTo(cx + 9 * s, baseY - 42 * s);
  gfx.strokePath();

  // === NOSE ===
  gfx.fillStyle(0xb08657, 0.6);
  gfx.fillTriangle(
    cx - 1 * s, baseY - 40 * s,
    cx, baseY - 36 * s,
    cx + 1 * s, baseY - 40 * s
  );

  // === SERIOUS MOUTH — straight line, no smile ===
  gfx.lineStyle(2, 0x6a4030, 0.8);
  gfx.beginPath();
  gfx.moveTo(cx - 5 * s, baseY - 34 * s);
  gfx.lineTo(cx + 5 * s, baseY - 34 * s);
  gfx.strokePath();
  // Slight frown corners
  gfx.lineStyle(1, 0x6a4030, 0.6);
  gfx.beginPath();
  gfx.moveTo(cx - 5 * s, baseY - 34 * s);
  gfx.lineTo(cx - 6 * s, baseY - 33 * s);
  gfx.strokePath();
  gfx.beginPath();
  gfx.moveTo(cx + 5 * s, baseY - 34 * s);
  gfx.lineTo(cx + 6 * s, baseY - 33 * s);
  gfx.strokePath();

  // === STAR OF DAVID on chest — gold metallic ===
  if (opts.showStar !== false) {
    const starR = 12 * s;
    const starCY = baseY - 4 * s;
    // Golden glow behind star
    gfx.fillStyle(0xFFD700, 0.3);
    gfx.fillCircle(cx, starCY, 18 * s);
    // Upward triangle
    gfx.fillStyle(0xFFD700, 0.9);
    gfx.fillTriangle(
      cx, starCY - starR,
      cx - starR * 0.866, starCY + starR * 0.5,
      cx + starR * 0.866, starCY + starR * 0.5
    );
    // Downward triangle
    gfx.fillTriangle(
      cx, starCY + starR,
      cx - starR * 0.866, starCY - starR * 0.5,
      cx + starR * 0.866, starCY - starR * 0.5
    );
    // Dark gold border on star
    gfx.lineStyle(1.5, 0xB8860B, 1);
    gfx.beginPath();
    gfx.moveTo(cx, starCY - starR);
    gfx.lineTo(cx - starR * 0.866, starCY + starR * 0.5);
    gfx.lineTo(cx + starR * 0.866, starCY + starR * 0.5);
    gfx.closePath();
    gfx.strokePath();
    gfx.beginPath();
    gfx.moveTo(cx, starCY + starR);
    gfx.lineTo(cx - starR * 0.866, starCY - starR * 0.5);
    gfx.lineTo(cx + starR * 0.866, starCY - starR * 0.5);
    gfx.closePath();
    gfx.strokePath();
  }
}
