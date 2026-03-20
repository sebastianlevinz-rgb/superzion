// ===================================================================
// PlatformerLevel1Textures — ALL procedural canvas textures for the
// Level 1 side-scrolling platformer phase (Tehran rooftop run)
//
// Textures: background parallax layers, platform surfaces, player
// sprites (idle + 4 run frames + jump), guard sprites (4 walk frames),
// obstacle sprites, target building, HUD
//
// All keys use the `plt_` prefix.
// ===================================================================

// ── Helper: create canvas of given size ──
function mc(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

// ── Helper: draw a filled rounded rect ──
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// ── Helper: draw a Star of David ──
function starOfDavid(ctx, x, y, s, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(x, y - s);
  ctx.lineTo(x - s * 0.87, y + s * 0.5);
  ctx.lineTo(x + s * 0.87, y + s * 0.5);
  ctx.closePath();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x, y + s);
  ctx.lineTo(x - s * 0.87, y - s * 0.5);
  ctx.lineTo(x + s * 0.87, y - s * 0.5);
  ctx.closePath();
  ctx.stroke();
}

// ── Helper: draw a generic building silhouette ──
function _drawBuilding(ctx, x, y, w, h, baseColor, windowColor) {
  ctx.fillStyle = baseColor;
  ctx.fillRect(x, y, w, h);
  // Windows
  const winW = 2, winH = 3, gapX = 6, gapY = 8;
  for (let wy = y + 6; wy < y + h - 6; wy += gapY) {
    for (let wx = x + 4; wx < x + w - 4; wx += gapX) {
      if (Math.random() > 0.4) {
        ctx.fillStyle = windowColor;
        ctx.fillRect(wx, wy, winW, winH);
      }
    }
  }
}

// ── Helper: seeded random for repeatable patterns ──
function _seededRandom(seed) {
  let s = seed;
  return function () {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// ===================================================================
// BACKGROUND LAYERS (for TileSprite parallax)
// ===================================================================

// ── plt_stars_sky (960x300): Night gradient sky with stars and moon ──
function drawStarsSky() {
  const c = mc(960, 300);
  const ctx = c.getContext('2d');

  // Night gradient
  const grad = ctx.createLinearGradient(0, 0, 0, 300);
  grad.addColorStop(0, '#0a0a1a');
  grad.addColorStop(0.5, '#1a1a2a');
  grad.addColorStop(1, '#2a2030');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 960, 300);

  // Stars (80+)
  const rng = _seededRandom(42);
  for (let i = 0; i < 100; i++) {
    const sx = rng() * 960;
    const sy = rng() * 220;
    const sr = 0.3 + rng() * 1.2;
    const alpha = 0.3 + rng() * 0.7;
    ctx.fillStyle = `rgba(255,255,255,${alpha})`;
    ctx.beginPath();
    ctx.arc(sx, sy, sr, 0, Math.PI * 2);
    ctx.fill();
  }

  // Occasional brighter star with cross-flare
  for (let i = 0; i < 8; i++) {
    const bx = rng() * 960;
    const by = rng() * 180;
    ctx.strokeStyle = `rgba(255,255,255,${0.3 + rng() * 0.4})`;
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(bx - 3, by);
    ctx.lineTo(bx + 3, by);
    ctx.moveTo(bx, by - 3);
    ctx.lineTo(bx, by + 3);
    ctx.stroke();
  }

  // Moon (upper-right area)
  const mx = 780, my = 60, mr = 30;
  // Glow ring (outer)
  ctx.fillStyle = 'rgba(232, 224, 192, 0.06)';
  ctx.beginPath();
  ctx.arc(mx, my, mr + 30, 0, Math.PI * 2);
  ctx.fill();
  // Glow ring (inner)
  ctx.fillStyle = 'rgba(232, 224, 192, 0.12)';
  ctx.beginPath();
  ctx.arc(mx, my, mr + 15, 0, Math.PI * 2);
  ctx.fill();
  // Moon body
  ctx.fillStyle = '#e8e0c0';
  ctx.beginPath();
  ctx.arc(mx, my, mr, 0, Math.PI * 2);
  ctx.fill();
  // Subtle craters
  ctx.fillStyle = 'rgba(180, 170, 140, 0.3)';
  ctx.beginPath();
  ctx.arc(mx - 8, my - 5, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(mx + 10, my + 8, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(mx + 3, my - 12, 3, 0, Math.PI * 2);
  ctx.fill();

  return c;
}

// ── plt_mountains (960x200): Alborz mountain range silhouette ──
function drawMountains() {
  const c = mc(960, 200);
  const ctx = c.getContext('2d');

  // Transparent background (layered on top of sky)
  ctx.clearRect(0, 0, 960, 200);

  // Mountain silhouette
  ctx.fillStyle = '#1a1a2a';
  ctx.beginPath();
  ctx.moveTo(0, 200);
  ctx.lineTo(0, 140);
  ctx.lineTo(60, 100);
  ctx.lineTo(120, 80);
  ctx.lineTo(180, 60);
  ctx.lineTo(240, 75);
  ctx.lineTo(300, 50);    // Tallest peak
  ctx.lineTo(340, 55);
  ctx.lineTo(400, 70);
  ctx.lineTo(460, 45);    // Second tallest
  ctx.lineTo(500, 65);
  ctx.lineTo(560, 80);
  ctx.lineTo(620, 55);
  ctx.lineTo(680, 70);
  ctx.lineTo(740, 50);    // Third tall peak
  ctx.lineTo(800, 75);
  ctx.lineTo(860, 90);
  ctx.lineTo(920, 80);
  ctx.lineTo(960, 95);
  ctx.lineTo(960, 200);
  ctx.closePath();
  ctx.fill();

  // Snow caps on tallest peaks
  ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
  // Peak at 300
  ctx.beginPath();
  ctx.moveTo(280, 60);
  ctx.lineTo(300, 50);
  ctx.lineTo(320, 56);
  ctx.closePath();
  ctx.fill();
  // Peak at 460
  ctx.beginPath();
  ctx.moveTo(440, 55);
  ctx.lineTo(460, 45);
  ctx.lineTo(480, 56);
  ctx.closePath();
  ctx.fill();
  // Peak at 740
  ctx.beginPath();
  ctx.moveTo(720, 60);
  ctx.lineTo(740, 50);
  ctx.lineTo(760, 60);
  ctx.closePath();
  ctx.fill();

  // Subtle mountain ridges
  ctx.strokeStyle = 'rgba(40, 40, 60, 0.5)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(100, 120);
  ctx.lineTo(200, 90);
  ctx.lineTo(350, 100);
  ctx.lineTo(500, 85);
  ctx.lineTo(650, 95);
  ctx.lineTo(800, 110);
  ctx.lineTo(960, 120);
  ctx.stroke();

  return c;
}

// ── plt_skyline (960x250): Tehran city skyline with landmarks ──
function drawSkyline() {
  const c = mc(960, 250);
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, 960, 250);

  const rng = _seededRandom(123);

  // City glow at bottom
  const glowGrad = ctx.createLinearGradient(0, 180, 0, 250);
  glowGrad.addColorStop(0, 'rgba(180, 120, 50, 0)');
  glowGrad.addColorStop(1, 'rgba(180, 120, 50, 0.15)');
  ctx.fillStyle = glowGrad;
  ctx.fillRect(0, 180, 960, 70);

  // Generic background buildings (fill gaps)
  const buildColors = ['#1e1e2e', '#222236', '#1a1a30', '#252538'];
  for (let bx = 0; bx < 960; bx += 20 + rng() * 30) {
    const bw = 15 + rng() * 25;
    const bh = 40 + rng() * 100;
    const by = 250 - bh;
    ctx.fillStyle = buildColors[Math.floor(rng() * buildColors.length)];
    ctx.fillRect(bx, by, bw, bh);
    // Lit windows (tiny dots)
    for (let wy = by + 5; wy < 245; wy += 6 + rng() * 4) {
      for (let wx = bx + 3; wx < bx + bw - 3; wx += 5 + rng() * 3) {
        if (rng() > 0.55) {
          const wAlpha = 0.3 + rng() * 0.5;
          const isAmber = rng() > 0.3;
          ctx.fillStyle = isAmber
            ? `rgba(255, 200, 80, ${wAlpha})`
            : `rgba(200, 220, 255, ${wAlpha})`;
          ctx.fillRect(wx, wy, 1.5, 2);
        }
      }
    }
  }

  // ── Milad Tower (distinctive tall shaft with pod) ──
  const milX = 420;
  ctx.fillStyle = '#1e1e2e';
  // Antenna tip
  ctx.fillRect(milX, 20, 2, 30);
  // Shaft
  ctx.fillRect(milX - 1, 50, 4, 120);
  // Pod / observation deck
  ctx.fillStyle = '#2a2a3a';
  ctx.beginPath();
  ctx.ellipse(milX + 1, 95, 14, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  // Pod ring detail
  ctx.strokeStyle = 'rgba(100, 100, 140, 0.3)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(milX + 1, 95, 14, 10, 0, 0, Math.PI * 2);
  ctx.stroke();
  // Observation deck windows
  ctx.fillStyle = 'rgba(200, 200, 255, 0.2)';
  for (let a = 0; a < Math.PI * 2; a += 0.5) {
    ctx.fillRect(milX + 1 + Math.cos(a) * 10, 93 + Math.sin(a) * 6, 1.5, 2);
  }
  // Base tapers
  ctx.fillStyle = '#1e1e2e';
  ctx.beginPath();
  ctx.moveTo(milX - 8, 170);
  ctx.lineTo(milX - 1, 110);
  ctx.lineTo(milX + 3, 110);
  ctx.lineTo(milX + 10, 170);
  ctx.closePath();
  ctx.fill();

  // ── Azadi Tower (inverted-Y arch shape) ──
  const azX = 180;
  ctx.fillStyle = '#1e1e2e';
  // Outer shape
  ctx.beginPath();
  ctx.moveTo(azX - 20, 250);  // left base
  ctx.lineTo(azX - 14, 200);  // left leg up
  ctx.lineTo(azX - 8, 185);
  ctx.lineTo(azX, 175);       // arch peak
  ctx.lineTo(azX + 8, 185);
  ctx.lineTo(azX + 14, 200);
  ctx.lineTo(azX + 20, 250);  // right base
  // Inner cutout (hollow center)
  ctx.lineTo(azX + 14, 250);
  ctx.lineTo(azX + 8, 210);
  ctx.lineTo(azX, 195);
  ctx.lineTo(azX - 8, 210);
  ctx.lineTo(azX - 14, 250);
  ctx.closePath();
  ctx.fill();
  // Top ornamental element
  ctx.fillStyle = '#2a2a3a';
  ctx.beginPath();
  ctx.arc(azX, 175, 5, 0, Math.PI * 2);
  ctx.fill();

  // ── A couple of mosque domes scattered in skyline ──
  // Dome 1
  ctx.fillStyle = '#1e2e2e';
  ctx.beginPath();
  ctx.arc(650, 195, 20, Math.PI, 0);
  ctx.lineTo(670, 250);
  ctx.lineTo(630, 250);
  ctx.closePath();
  ctx.fill();
  // Crescent finial
  ctx.strokeStyle = 'rgba(200, 180, 100, 0.4)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(650, 172, 3, 0, Math.PI * 2);
  ctx.stroke();

  // Dome 2 (smaller)
  ctx.fillStyle = '#1a2828';
  ctx.beginPath();
  ctx.arc(820, 210, 14, Math.PI, 0);
  ctx.lineTo(834, 250);
  ctx.lineTo(806, 250);
  ctx.closePath();
  ctx.fill();

  return c;
}

// ── plt_near_buildings (960x180): Closer building facades ──
function drawNearBuildings() {
  const c = mc(960, 180);
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, 960, 180);

  const rng = _seededRandom(777);

  for (let bx = 0; bx < 960; bx += 30 + rng() * 40) {
    const bw = 25 + rng() * 40;
    const bh = 80 + rng() * 90;
    const by = 180 - bh;
    // Darker silhouette (closer = darker)
    const shade = 0x12 + Math.floor(rng() * 0x0a);
    ctx.fillStyle = `rgb(${shade}, ${shade}, ${shade + 10})`;
    ctx.fillRect(bx, by, bw, bh);

    // Window grids (more visible for near buildings)
    for (let wy = by + 4; wy < 176; wy += 7) {
      for (let wx = bx + 3; wx < bx + bw - 3; wx += 6) {
        if (rng() > 0.45) {
          const lit = rng() > 0.5;
          ctx.fillStyle = lit
            ? `rgba(255, 200, 80, ${0.4 + rng() * 0.4})`
            : `rgba(40, 40, 60, ${0.3 + rng() * 0.3})`;
          ctx.fillRect(wx, wy, 3, 4);
        }
      }
    }

    // Rooftop details: antenna, water tank, satellite dish
    if (rng() > 0.5) {
      // Antenna
      ctx.fillStyle = 'rgba(60, 60, 80, 0.8)';
      ctx.fillRect(bx + bw / 2, by - 12, 1, 12);
      // Blinking red light
      ctx.fillStyle = 'rgba(255, 50, 50, 0.6)';
      ctx.fillRect(bx + bw / 2 - 1, by - 13, 3, 2);
    }
    if (rng() > 0.6) {
      // Water tank
      ctx.fillStyle = 'rgba(50, 50, 60, 0.8)';
      ctx.fillRect(bx + 3, by - 6, 8, 6);
    }
    if (rng() > 0.7) {
      // Satellite dish
      ctx.fillStyle = 'rgba(70, 70, 80, 0.7)';
      ctx.beginPath();
      ctx.arc(bx + bw - 6, by - 2, 4, Math.PI, 0);
      ctx.fill();
      ctx.fillRect(bx + bw - 7, by - 2, 1, 4);
    }
  }

  return c;
}

// ===================================================================
// PLATFORM TEXTURES (static sprites)
// ===================================================================

// ── plt_roof_flat (128x40): Flat concrete rooftop ──
function drawRoofFlat() {
  const c = mc(128, 40);
  const ctx = c.getContext('2d');

  // Main surface
  const grad = ctx.createLinearGradient(0, 0, 0, 40);
  grad.addColorStop(0, '#5a5a5a');
  grad.addColorStop(0.15, '#4a4a4a');
  grad.addColorStop(1, '#3e3e3e');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 40);

  // Edge lip at top
  ctx.fillStyle = '#606060';
  ctx.fillRect(0, 0, 128, 4);

  // Border lines
  ctx.strokeStyle = '#383838';
  ctx.lineWidth = 1;
  ctx.strokeRect(0, 0, 128, 40);

  // Surface cracks
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(20, 8);
  ctx.lineTo(35, 15);
  ctx.lineTo(50, 12);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(70, 18);
  ctx.lineTo(85, 22);
  ctx.lineTo(100, 20);
  ctx.stroke();

  // Small details: pipe stub, vent
  ctx.fillStyle = '#555';
  ctx.fillRect(110, 6, 6, 10);
  ctx.fillStyle = '#4a4a4a';
  ctx.fillRect(108, 6, 10, 2);
  // Vent
  ctx.fillStyle = '#484848';
  ctx.fillRect(15, 20, 8, 6);
  ctx.strokeStyle = '#3a3a3a';
  ctx.lineWidth = 0.5;
  for (let vy = 21; vy < 26; vy += 2) {
    ctx.beginPath();
    ctx.moveTo(15, vy);
    ctx.lineTo(23, vy);
    ctx.stroke();
  }

  return c;
}

// ── plt_roof_balcony (100x40): Ornate balcony ledge ──
function drawRoofBalcony() {
  const c = mc(100, 40);
  const ctx = c.getContext('2d');

  // Base ledge
  ctx.fillStyle = '#8a6a4a';
  ctx.fillRect(0, 0, 100, 40);

  // Top surface (lighter)
  ctx.fillStyle = '#a0805a';
  ctx.fillRect(0, 0, 100, 6);

  // Decorative trim at base
  ctx.fillStyle = '#7a5a3a';
  ctx.fillRect(0, 34, 100, 6);
  // Scalloped edge
  for (let x = 5; x < 100; x += 10) {
    ctx.beginPath();
    ctx.arc(x, 34, 4, 0, Math.PI);
    ctx.fill();
  }

  // Railing (vertical bars)
  ctx.strokeStyle = '#5a4030';
  ctx.lineWidth = 1.5;
  for (let x = 8; x < 100; x += 10) {
    ctx.beginPath();
    ctx.moveTo(x, 6);
    ctx.lineTo(x, 28);
    ctx.stroke();
  }
  // Top rail
  ctx.strokeStyle = '#6a5040';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(4, 6);
  ctx.lineTo(96, 6);
  ctx.stroke();
  // Bottom rail
  ctx.beginPath();
  ctx.moveTo(4, 28);
  ctx.lineTo(96, 28);
  ctx.stroke();

  return c;
}

// ── plt_roof_cornice (100x32): Stone cornice ledge ──
function drawRoofCornice() {
  const c = mc(100, 32);
  const ctx = c.getContext('2d');

  // Stone body
  ctx.fillStyle = '#7a7a6a';
  ctx.fillRect(0, 0, 100, 32);

  // Top edge (lighter)
  ctx.fillStyle = '#8a8a7a';
  ctx.fillRect(0, 0, 100, 5);

  // Carved pattern detail (repeating dentil blocks)
  ctx.fillStyle = '#6a6a5a';
  for (let x = 4; x < 96; x += 8) {
    ctx.fillRect(x, 8, 5, 6);
  }

  // Carved groove
  ctx.strokeStyle = '#5a5a4a';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, 18);
  ctx.lineTo(100, 18);
  ctx.stroke();

  // Shadow underneath
  const shadowGrad = ctx.createLinearGradient(0, 24, 0, 32);
  shadowGrad.addColorStop(0, 'rgba(0, 0, 0, 0.3)');
  shadowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = shadowGrad;
  ctx.fillRect(0, 24, 100, 8);

  // Stone texture noise
  ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
  const rng = _seededRandom(444);
  for (let i = 0; i < 30; i++) {
    ctx.fillRect(rng() * 100, rng() * 32, 2, 1);
  }

  return c;
}

// ── plt_roof_dome (120x60): Mosque dome top ──
function drawRoofDome() {
  const c = mc(120, 60);
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, 120, 60);

  const cx = 60, cy = 35;

  // Dome body (smooth curve)
  ctx.fillStyle = '#4a6a6a';
  ctx.beginPath();
  ctx.arc(cx, cy, 28, Math.PI, 0);
  ctx.lineTo(cx + 28, 60);
  ctx.lineTo(cx - 28, 60);
  ctx.closePath();
  ctx.fill();

  // Dome highlight (lighter strip)
  ctx.fillStyle = 'rgba(100, 160, 160, 0.3)';
  ctx.beginPath();
  ctx.ellipse(cx - 5, cy - 5, 8, 20, -0.2, Math.PI, 0);
  ctx.fill();

  // Dome edge detail
  ctx.strokeStyle = '#3a5a5a';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(cx, cy, 28, Math.PI, 0);
  ctx.stroke();

  // Base ring
  ctx.fillStyle = '#3a5a5a';
  ctx.fillRect(cx - 30, cy + 22, 60, 4);

  // Crescent finial on top
  ctx.strokeStyle = '#c0a860';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(cx, cy - 28, 4, 0.3, Math.PI * 2 - 0.3);
  ctx.stroke();
  // Finial pole
  ctx.fillStyle = '#c0a860';
  ctx.fillRect(cx - 0.5, cy - 24, 1, 4);

  // Walking surface indicator (flat top area ~ 8px)
  ctx.fillStyle = 'rgba(100, 160, 160, 0.15)';
  ctx.fillRect(cx - 20, cy - 20, 40, 4);

  return c;
}

// ===================================================================
// PLAYER SPRITES (side-view, 64x64 each)
// ===================================================================

function _drawPlayerBase(ctx, legPhase, armPhase, isJump) {
  const cx = 32, cy = 32;

  // ── Boots ──
  ctx.fillStyle = '#1a1a1a';
  if (isJump) {
    // Tucked legs
    ctx.fillRect(cx - 8, cy + 18, 7, 5);
    ctx.fillRect(cx + 1, cy + 18, 7, 5);
  } else {
    // Leg positions based on phase
    const offsets = [
      [-8, 0],   // contact: legs close
      [-10, 4],  // passing: back leg extended
      [-6, -4],  // stride: front leg forward
      [-4, 2],   // passing: returning
    ];
    const lo = offsets[legPhase] || [0, 0];
    ctx.fillRect(cx + lo[0], cy + 22, 7, 6);
    ctx.fillRect(cx + lo[0] + 10 + lo[1], cy + 22, 7, 6);
  }

  // ── Legs (pants) ──
  ctx.fillStyle = '#1a2040';
  if (isJump) {
    ctx.fillRect(cx - 7, cy + 10, 6, 10);
    ctx.fillRect(cx + 1, cy + 10, 6, 10);
  } else {
    const legOff = [
      [{ x: -7, h: 14 }, { x: 1, h: 14 }],
      [{ x: -9, h: 16 }, { x: 3, h: 12 }],
      [{ x: -5, h: 12 }, { x: -1, h: 16 }],
      [{ x: -6, h: 13 }, { x: 2, h: 13 }],
    ];
    const lp = legOff[legPhase] || legOff[0];
    ctx.fillRect(cx + lp[0].x, cy + 8, 6, lp[0].h);
    ctx.fillRect(cx + lp[1].x, cy + 8, 6, lp[1].h);
  }

  // ── Torso ──
  ctx.fillStyle = '#1a2040';
  roundRect(ctx, cx - 9, cy - 8, 18, 18, 2);
  ctx.fill();

  // ── Tactical vest ──
  ctx.fillStyle = '#222850';
  ctx.fillRect(cx - 8, cy - 6, 16, 14);
  // Vest straps
  ctx.fillStyle = '#2a3060';
  ctx.fillRect(cx - 8, cy - 6, 3, 14);
  ctx.fillRect(cx + 5, cy - 6, 3, 14);

  // ── Star of David on chest ──
  starOfDavid(ctx, cx, cy, 4, '#FFD700');
  ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
  ctx.beginPath();
  ctx.arc(cx, cy, 1.5, 0, Math.PI * 2);
  ctx.fill();

  // ── Arms ──
  ctx.fillStyle = '#1a2040';
  if (isJump) {
    // Arms raised
    ctx.fillRect(cx - 14, cy - 12, 5, 14);
    ctx.fillRect(cx + 9, cy - 12, 5, 14);
  } else {
    // Arm swing based on phase (opposite to legs)
    const armOff = [
      [{ x: -13, y: -4, h: 14 }, { x: 8, y: -4, h: 14 }],
      [{ x: -12, y: -6, h: 12 }, { x: 9, y: -2, h: 16 }],
      [{ x: -14, y: -2, h: 16 }, { x: 7, y: -6, h: 12 }],
      [{ x: -13, y: -3, h: 13 }, { x: 8, y: -5, h: 13 }],
    ];
    const ap = armOff[armPhase] || armOff[0];
    ctx.fillRect(cx + ap[0].x, cy + ap[0].y, 5, ap[0].h);
    ctx.fillRect(cx + ap[1].x, cy + ap[1].y, 5, ap[1].h);
  }
  // Hands
  ctx.fillStyle = '#c8a080';
  if (isJump) {
    ctx.fillRect(cx - 14, cy - 13, 5, 3);
    ctx.fillRect(cx + 9, cy - 13, 5, 3);
  }

  // ── Head ──
  ctx.fillStyle = '#c8a080';
  ctx.beginPath();
  ctx.arc(cx, cy - 14, 8, 0, Math.PI * 2);
  ctx.fill();

  // Hair
  ctx.fillStyle = '#1a1a1a';
  ctx.beginPath();
  ctx.arc(cx, cy - 16, 7, Math.PI, 0);
  ctx.fill();

  // Eyes (determined expression)
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(cx - 5, cy - 16, 3, 2);
  ctx.fillRect(cx + 2, cy - 16, 3, 2);
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(cx - 4, cy - 16, 2, 2);
  ctx.fillRect(cx + 3, cy - 16, 2, 2);

  // Eyebrows (furrowed)
  ctx.strokeStyle = '#1a1a1a';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx - 6, cy - 19);
  ctx.lineTo(cx - 2, cy - 18);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx + 6, cy - 19);
  ctx.lineTo(cx + 2, cy - 18);
  ctx.stroke();

  // Mouth (thin line)
  ctx.strokeStyle = '#8a6a5a';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(cx - 2, cy - 10);
  ctx.lineTo(cx + 2, cy - 10);
  ctx.stroke();

  // Blue-white accent stripes on shoulders
  ctx.fillStyle = 'rgba(100, 150, 255, 0.4)';
  ctx.fillRect(cx - 9, cy - 8, 2, 4);
  ctx.fillRect(cx + 7, cy - 8, 2, 4);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.fillRect(cx - 9, cy - 5, 2, 2);
  ctx.fillRect(cx + 7, cy - 5, 2, 2);
}

// ── plt_player_idle (64x64) ──
function drawPlayerIdle() {
  const c = mc(64, 64);
  const ctx = c.getContext('2d');
  _drawPlayerBase(ctx, 0, 0, false);
  return c;
}

// ── plt_player_run_0 through plt_player_run_3 (64x64 each) ──
function drawPlayerRun(frame) {
  const c = mc(64, 64);
  const ctx = c.getContext('2d');
  // Slight forward lean
  ctx.translate(2, 0);
  _drawPlayerBase(ctx, frame, frame, false);
  return c;
}

// ── plt_player_jump (64x64) ──
function drawPlayerJump() {
  const c = mc(64, 64);
  const ctx = c.getContext('2d');
  // Body arched upward (shift up slightly)
  ctx.translate(0, -3);
  _drawPlayerBase(ctx, 0, 0, true);
  return c;
}

// ===================================================================
// GUARD SPRITES (side-view patrol, 64x64 each)
// ===================================================================

function _drawGuardBase(ctx, legPhase) {
  const cx = 32, cy = 32;

  // ── Boots (black) ──
  ctx.fillStyle = '#1a1a1a';
  const bootOffs = [
    [-7, 1],
    [-9, 5],
    [-5, -3],
    [-6, 3],
  ];
  const bo = bootOffs[legPhase] || bootOffs[0];
  ctx.fillRect(cx + bo[0], cy + 22, 7, 6);
  ctx.fillRect(cx + bo[0] + 10 + bo[1], cy + 22, 7, 6);

  // ── Legs (olive pants) ──
  ctx.fillStyle = '#3a4a2a';
  const legOff = [
    [{ x: -6, h: 14 }, { x: 2, h: 14 }],
    [{ x: -8, h: 16 }, { x: 4, h: 12 }],
    [{ x: -4, h: 12 }, { x: 0, h: 16 }],
    [{ x: -5, h: 13 }, { x: 3, h: 13 }],
  ];
  const lp = legOff[legPhase] || legOff[0];
  ctx.fillRect(cx + lp[0].x, cy + 8, 6, lp[0].h);
  ctx.fillRect(cx + lp[1].x, cy + 8, 6, lp[1].h);

  // ── Torso (dark olive uniform) ──
  ctx.fillStyle = '#3a4a2a';
  roundRect(ctx, cx - 9, cy - 8, 18, 18, 2);
  ctx.fill();

  // ── Belt ──
  ctx.fillStyle = '#2a2a1a';
  ctx.fillRect(cx - 9, cy + 6, 18, 3);

  // ── AK-47 held across chest ──
  ctx.fillStyle = '#3a3a3a';
  // Stock
  ctx.fillRect(cx - 16, cy - 2, 6, 3);
  // Body
  ctx.fillRect(cx - 10, cy - 3, 18, 4);
  // Barrel
  ctx.fillStyle = '#4a4a4a';
  ctx.fillRect(cx + 8, cy - 3, 10, 2);
  // Magazine
  ctx.fillStyle = '#2a2a2a';
  ctx.fillRect(cx - 2, cy + 1, 4, 5);

  // ── Arms (olive) ──
  ctx.fillStyle = '#3a4a2a';
  ctx.fillRect(cx - 14, cy - 4, 5, 10);
  ctx.fillRect(cx + 9, cy - 4, 5, 10);

  // ── Head ──
  ctx.fillStyle = '#b08060';
  ctx.beginPath();
  ctx.arc(cx, cy - 14, 8, 0, Math.PI * 2);
  ctx.fill();

  // Beard stubble
  ctx.fillStyle = 'rgba(40, 30, 20, 0.3)';
  ctx.beginPath();
  ctx.arc(cx, cy - 9, 6, 0, Math.PI);
  ctx.fill();

  // Eyes
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(cx - 4, cy - 16, 2, 2);
  ctx.fillRect(cx + 2, cy - 16, 2, 2);

  // Beret/cap
  ctx.fillStyle = '#2a3020';
  ctx.beginPath();
  ctx.ellipse(cx, cy - 20, 9, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(cx - 9, cy - 20, 18, 3);

  // Eyebrows (stern)
  ctx.strokeStyle = '#3a2a1a';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx - 6, cy - 18);
  ctx.lineTo(cx - 2, cy - 17);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx + 6, cy - 18);
  ctx.lineTo(cx + 2, cy - 17);
  ctx.stroke();

  // Mouth (frown)
  ctx.strokeStyle = '#6a4a3a';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(cx - 3, cy - 9);
  ctx.quadraticCurveTo(cx, cy - 8, cx + 3, cy - 9);
  ctx.stroke();
}

function drawGuardWalk(frame) {
  const c = mc(64, 64);
  const ctx = c.getContext('2d');
  _drawGuardBase(ctx, frame);
  return c;
}

// ===================================================================
// OBSTACLE TEXTURES
// ===================================================================

// ── plt_camera (32x32): Wall-mounted security camera ──
function drawCamera() {
  const c = mc(32, 32);
  const ctx = c.getContext('2d');

  // Mount bracket
  ctx.fillStyle = '#555';
  ctx.fillRect(2, 4, 6, 10);

  // Camera body
  ctx.fillStyle = '#666';
  roundRect(ctx, 8, 6, 16, 10, 2);
  ctx.fill();

  // Lens
  ctx.fillStyle = '#222';
  ctx.beginPath();
  ctx.arc(22, 11, 4, 0, Math.PI * 2);
  ctx.fill();
  // Lens glass
  ctx.fillStyle = '#334';
  ctx.beginPath();
  ctx.arc(22, 11, 3, 0, Math.PI * 2);
  ctx.fill();
  // Lens reflection
  ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.beginPath();
  ctx.arc(21, 10, 1, 0, Math.PI * 2);
  ctx.fill();

  // Red indicator light
  ctx.fillStyle = 'rgba(255, 50, 50, 0.8)';
  ctx.beginPath();
  ctx.arc(12, 8, 2, 0, Math.PI * 2);
  ctx.fill();
  // LED glow
  ctx.fillStyle = 'rgba(255, 50, 50, 0.3)';
  ctx.beginPath();
  ctx.arc(12, 8, 4, 0, Math.PI * 2);
  ctx.fill();

  // Cable
  ctx.strokeStyle = '#444';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(4, 14);
  ctx.quadraticCurveTo(4, 24, 8, 28);
  ctx.stroke();

  return c;
}

// ── plt_searchlight_base (24x48): Searchlight fixture on pole ──
function drawSearchlightBase() {
  const c = mc(24, 48);
  const ctx = c.getContext('2d');

  // Pole
  ctx.fillStyle = '#555';
  ctx.fillRect(10, 16, 4, 32);

  // Pole base
  ctx.fillStyle = '#444';
  ctx.fillRect(6, 44, 12, 4);

  // Light housing
  ctx.fillStyle = '#666';
  ctx.beginPath();
  ctx.moveTo(4, 16);
  ctx.lineTo(20, 16);
  ctx.lineTo(22, 8);
  ctx.lineTo(2, 8);
  ctx.closePath();
  ctx.fill();

  // Light face
  ctx.fillStyle = '#ffd';
  ctx.fillRect(4, 6, 16, 3);

  // Light glow
  ctx.fillStyle = 'rgba(255, 255, 200, 0.3)';
  ctx.beginPath();
  ctx.moveTo(4, 6);
  ctx.lineTo(20, 6);
  ctx.lineTo(24, 0);
  ctx.lineTo(0, 0);
  ctx.closePath();
  ctx.fill();

  return c;
}

// ── plt_electric_wire (128x8): Horizontal electric wire segment ──
function drawElectricWire() {
  const c = mc(128, 8);
  const ctx = c.getContext('2d');

  // Wire
  ctx.strokeStyle = '#555';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 4);
  // Slight sag in the wire
  ctx.quadraticCurveTo(32, 6, 64, 4);
  ctx.quadraticCurveTo(96, 2, 128, 4);
  ctx.stroke();

  // Insulator dots
  ctx.fillStyle = '#776655';
  for (let x = 0; x < 128; x += 32) {
    ctx.beginPath();
    ctx.arc(x, 4, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  // Sparks at intervals
  ctx.strokeStyle = 'rgba(255, 255, 100, 0.8)';
  ctx.lineWidth = 1;
  const sparkPositions = [16, 48, 80, 112];
  for (const sx of sparkPositions) {
    // Small star shape
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 3) {
      const len = 2 + Math.random() * 2;
      ctx.beginPath();
      ctx.moveTo(sx, 4);
      ctx.lineTo(sx + Math.cos(a) * len, 4 + Math.sin(a) * len);
      ctx.stroke();
    }
  }

  // Electric glow
  ctx.fillStyle = 'rgba(150, 200, 255, 0.15)';
  ctx.fillRect(0, 0, 128, 8);

  return c;
}

// ===================================================================
// TARGET BUILDING (200x300)
// ===================================================================

function drawTargetBuilding() {
  const c = mc(200, 300);
  const ctx = c.getContext('2d');

  // Building body
  ctx.fillStyle = '#4a4a4a';
  ctx.fillRect(10, 20, 180, 280);

  // Visible floor lines
  ctx.strokeStyle = '#3a3a3a';
  ctx.lineWidth = 1;
  for (let fy = 60; fy < 300; fy += 45) {
    ctx.beginPath();
    ctx.moveTo(10, fy);
    ctx.lineTo(190, fy);
    ctx.stroke();
  }

  // Windows
  const rng = _seededRandom(999);
  for (let fy = 30; fy < 280; fy += 45) {
    for (let fx = 24; fx < 180; fx += 22) {
      const lit = rng() > 0.4;
      if (lit) {
        ctx.fillStyle = `rgba(255, 200, 80, ${0.3 + rng() * 0.5})`;
      } else {
        ctx.fillStyle = 'rgba(30, 30, 40, 0.8)';
      }
      ctx.fillRect(fx, fy, 10, 14);
      // Window frame
      ctx.strokeStyle = '#3a3a3a';
      ctx.lineWidth = 0.5;
      ctx.strokeRect(fx, fy, 10, 14);
    }
  }

  // Open window at mid-height (entry point) with golden glow
  const entryX = 68, entryY = 150;
  // Dark opening
  ctx.fillStyle = '#0a0a0a';
  ctx.fillRect(entryX, entryY, 16, 20);
  // Golden glow from inside
  const entryGlow = ctx.createRadialGradient(entryX + 8, entryY + 10, 2, entryX + 8, entryY + 10, 20);
  entryGlow.addColorStop(0, 'rgba(255, 200, 80, 0.5)');
  entryGlow.addColorStop(1, 'rgba(255, 200, 80, 0)');
  ctx.fillStyle = entryGlow;
  ctx.fillRect(entryX - 12, entryY - 10, 40, 40);
  // Window frame highlight
  ctx.strokeStyle = '#c0a060';
  ctx.lineWidth = 1;
  ctx.strokeRect(entryX, entryY, 16, 20);

  // Guard silhouettes in some windows
  const guardWindows = [[46, 75], [134, 120], [90, 210]];
  for (const [gx, gy] of guardWindows) {
    ctx.fillStyle = 'rgba(10, 10, 10, 0.6)';
    // Tiny head and shoulders
    ctx.beginPath();
    ctx.arc(gx + 5, gy + 3, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(gx + 1, gy + 6, 8, 6);
  }

  // Iranian flag on roof
  ctx.fillStyle = '#1a6a1a';
  ctx.fillRect(90, 0, 20, 7);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(90, 7, 20, 6);
  ctx.fillStyle = '#cc2020';
  ctx.fillRect(90, 13, 20, 7);
  // Flagpole
  ctx.fillStyle = '#888';
  ctx.fillRect(88, 0, 2, 24);

  // Antenna array on roof
  ctx.fillStyle = '#555';
  ctx.fillRect(150, 0, 2, 20);
  ctx.fillRect(160, 4, 2, 16);
  ctx.fillRect(140, 6, 2, 14);
  // Dish
  ctx.fillStyle = '#666';
  ctx.beginPath();
  ctx.arc(170, 10, 6, Math.PI, 0);
  ctx.fill();

  // Military compound feel: barbed wire on roof edge
  ctx.strokeStyle = '#666';
  ctx.lineWidth = 0.5;
  for (let x = 10; x < 190; x += 6) {
    ctx.beginPath();
    ctx.moveTo(x, 20);
    ctx.lineTo(x + 3, 17);
    ctx.lineTo(x + 6, 20);
    ctx.stroke();
  }

  // Edge shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
  ctx.fillRect(10, 20, 4, 280);
  ctx.fillRect(186, 20, 4, 280);

  return c;
}

// ===================================================================
// HUD ELEMENTS
// ===================================================================

// ── plt_hp_heart (16x16): Small red heart ──
function drawHpHeart() {
  const c = mc(16, 16);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#e83030';
  ctx.beginPath();
  ctx.moveTo(8, 14);
  ctx.bezierCurveTo(2, 10, 0, 5, 4, 2);
  ctx.bezierCurveTo(6, 0, 8, 2, 8, 4);
  ctx.bezierCurveTo(8, 2, 10, 0, 12, 2);
  ctx.bezierCurveTo(16, 5, 14, 10, 8, 14);
  ctx.fill();
  // Highlight
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.beginPath();
  ctx.arc(5, 5, 2, 0, Math.PI * 2);
  ctx.fill();
  return c;
}

// ===================================================================
// MAIN EXPORT
// ===================================================================

export function createPlatformerLevel1Textures(scene) {
  // Guard against double-create
  if (scene.textures.exists('plt_stars_sky')) return;

  // ── Background layers ──
  scene.textures.addCanvas('plt_stars_sky', drawStarsSky());
  scene.textures.addCanvas('plt_mountains', drawMountains());
  scene.textures.addCanvas('plt_skyline', drawSkyline());
  scene.textures.addCanvas('plt_near_buildings', drawNearBuildings());

  // ── Platform textures ──
  scene.textures.addCanvas('plt_roof_flat', drawRoofFlat());
  scene.textures.addCanvas('plt_roof_balcony', drawRoofBalcony());
  scene.textures.addCanvas('plt_roof_cornice', drawRoofCornice());
  scene.textures.addCanvas('plt_roof_dome', drawRoofDome());

  // ── Player sprites ──
  scene.textures.addCanvas('plt_player_idle', drawPlayerIdle());
  for (let i = 0; i < 4; i++) {
    scene.textures.addCanvas(`plt_player_run_${i}`, drawPlayerRun(i));
  }
  scene.textures.addCanvas('plt_player_jump', drawPlayerJump());

  // ── Guard sprites ──
  for (let i = 0; i < 4; i++) {
    scene.textures.addCanvas(`plt_guard_walk_${i}`, drawGuardWalk(i));
  }

  // ── Obstacle textures ──
  scene.textures.addCanvas('plt_camera', drawCamera());
  scene.textures.addCanvas('plt_searchlight_base', drawSearchlightBase());
  scene.textures.addCanvas('plt_electric_wire', drawElectricWire());

  // ── Target building ──
  scene.textures.addCanvas('plt_target_building', drawTargetBuilding());

  // ── HUD ──
  scene.textures.addCanvas('plt_hp_heart', drawHpHeart());
}
