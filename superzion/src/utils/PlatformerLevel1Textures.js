import { drawSuperZionSide } from './SuperZionRenderer.js';

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
  ctx.fillStyle = color;
  ctx.strokeStyle = '#B8860B';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(x, y - s);
  ctx.lineTo(x - s * 0.87, y + s * 0.5);
  ctx.lineTo(x + s * 0.87, y + s * 0.5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x, y + s);
  ctx.lineTo(x - s * 0.87, y - s * 0.5);
  ctx.lineTo(x + s * 0.87, y - s * 0.5);
  ctx.closePath();
  ctx.fill();
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
// BACKGROUND LAYERS (for TileSprite parallax) — DAYTIME Tehran
// ===================================================================

// ── plt_stars_sky (960x540): Bright blue daytime sky with sun and clouds ──
function drawStarsSky() {
  const c = mc(960, 540);
  const ctx = c.getContext('2d');

  // Sky gradient: top #87CEEB to bottom #5BB5E8
  const grad = ctx.createLinearGradient(0, 0, 0, 540);
  grad.addColorStop(0, '#87CEEB');
  grad.addColorStop(1, '#5BB5E8');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 960, 540);

  // ── Sun (golden #FFD700 circle with 8 ray lines) — upper-right area ──
  const sunX = 760, sunY = 90, sunR = 32;
  // Outer glow
  const sunGlow = ctx.createRadialGradient(sunX, sunY, sunR * 0.3, sunX, sunY, sunR * 3);
  sunGlow.addColorStop(0, 'rgba(255, 215, 0, 0.5)');
  sunGlow.addColorStop(0.5, 'rgba(255, 215, 0, 0.12)');
  sunGlow.addColorStop(1, 'rgba(255, 215, 0, 0)');
  ctx.fillStyle = sunGlow;
  ctx.beginPath();
  ctx.arc(sunX, sunY, sunR * 3, 0, Math.PI * 2);
  ctx.fill();
  // Sun body (#FFD700)
  ctx.fillStyle = '#FFD700';
  ctx.beginPath();
  ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
  ctx.fill();
  // Sun bright core
  ctx.fillStyle = '#FFEC80';
  ctx.beginPath();
  ctx.arc(sunX, sunY, sunR * 0.55, 0, Math.PI * 2);
  ctx.fill();
  // 8 ray lines radiating outward
  ctx.strokeStyle = 'rgba(255, 215, 0, 0.5)';
  ctx.lineWidth = 2.5;
  for (let i = 0; i < 8; i++) {
    const a = (Math.PI * 2 / 8) * i;
    ctx.beginPath();
    ctx.moveTo(sunX + Math.cos(a) * (sunR + 6), sunY + Math.sin(a) * (sunR + 6));
    ctx.lineTo(sunX + Math.cos(a) * (sunR + 24), sunY + Math.sin(a) * (sunR + 24));
    ctx.stroke();
  }

  // ── 5 fluffy white clouds: each = 3-5 overlapping arc() circles ──
  function drawCloud(cx, cy, scale) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.88)';
    ctx.beginPath();
    ctx.arc(cx, cy, 22 * scale, 0, Math.PI * 2);
    ctx.arc(cx + 20 * scale, cy - 6 * scale, 17 * scale, 0, Math.PI * 2);
    ctx.arc(cx - 18 * scale, cy + 3 * scale, 15 * scale, 0, Math.PI * 2);
    ctx.arc(cx + 9 * scale, cy - 12 * scale, 14 * scale, 0, Math.PI * 2);
    ctx.arc(cx - 8 * scale, cy - 9 * scale, 13 * scale, 0, Math.PI * 2);
    ctx.fill();
    // Cloud highlight on top
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.beginPath();
    ctx.arc(cx + 5 * scale, cy - 14 * scale, 9 * scale, 0, Math.PI * 2);
    ctx.fill();
  }

  drawCloud(130, 100, 1.3);
  drawCloud(400, 60, 1.1);
  drawCloud(580, 130, 0.85);
  drawCloud(860, 80, 1.0);
  drawCloud(280, 170, 0.75);

  return c;
}

// ── plt_mountains (960x240): Alborz mountain range — smooth bezier ridges ──
function drawMountains() {
  const c = mc(960, 240);
  const ctx = c.getContext('2d');

  // Transparent background (layered on top of sky)
  ctx.clearRect(0, 0, 960, 240);

  // ── Helper: draw a smooth mountain ridge using ONLY bezierCurveTo ──
  // waypoints = array of {x, y}, each connected by bezier curves
  function drawBezierRidge(waypoints, fillStyle) {
    ctx.fillStyle = fillStyle;
    ctx.beginPath();
    ctx.moveTo(0, 240);
    ctx.lineTo(waypoints[0].x, waypoints[0].y);
    for (let i = 0; i < waypoints.length - 1; i++) {
      const curr = waypoints[i];
      const next = waypoints[i + 1];
      const midX = (curr.x + next.x) / 2;
      // bezierCurveTo for smooth rolling curves — NO lineTo for peaks
      ctx.bezierCurveTo(midX, curr.y, midX, next.y, next.x, next.y);
    }
    ctx.lineTo(960, 240);
    ctx.closePath();
    ctx.fill();
  }

  // ── Ridge 1: Far back (lightest — distant rolling hills) ──
  // Color: lighter sandy, more gray (distant haze)
  drawBezierRidge([
    { x: 0, y: 170 },
    { x: 80, y: 148 },
    { x: 180, y: 130 },
    { x: 280, y: 142 },
    { x: 380, y: 118 },
    { x: 480, y: 134 },
    { x: 580, y: 115 },
    { x: 680, y: 126 },
    { x: 780, y: 112 },
    { x: 880, y: 130 },
    { x: 960, y: 138 },
  ], 'rgba(196, 168, 107, 0.35)'); // faded #C4A86B

  // ── Ridge 2: Mid-distance (medium sandy brown) ──
  drawBezierRidge([
    { x: 0, y: 155 },
    { x: 100, y: 128 },
    { x: 200, y: 108 },
    { x: 300, y: 118 },
    { x: 400, y: 92 },
    { x: 500, y: 110 },
    { x: 600, y: 88 },
    { x: 700, y: 102 },
    { x: 800, y: 82 },
    { x: 900, y: 100 },
    { x: 960, y: 112 },
  ], '#B89E6A'); // mid sandy brown

  // ── Ridge 3: Front (darkest, main Alborz range) ──
  // Gradient from sandy #C4A86B base to gray #8B8682 toward peaks
  const mtGrad = ctx.createLinearGradient(0, 20, 0, 240);
  mtGrad.addColorStop(0, '#8B8682');  // gray toward peaks
  mtGrad.addColorStop(0.4, '#A09470');
  mtGrad.addColorStop(1, '#C4A86B');  // sandy brown base
  ctx.fillStyle = mtGrad;
  ctx.beginPath();
  ctx.moveTo(0, 240);
  ctx.lineTo(0, 140);
  // ALL curves are bezierCurveTo — smooth rolling mountains, no sharp triangles
  ctx.bezierCurveTo(30, 130, 70, 100, 100, 88);
  ctx.bezierCurveTo(120, 78, 140, 65, 160, 58);       // peak 1
  ctx.bezierCurveTo(180, 65, 200, 75, 220, 82);        // valley
  ctx.bezierCurveTo(250, 62, 275, 38, 300, 30);        // DAMAVAND (tallest, smooth dome)
  ctx.bezierCurveTo(325, 38, 355, 58, 380, 65);        // descend
  ctx.bezierCurveTo(400, 72, 430, 60, 450, 55);        // valley then rise
  ctx.bezierCurveTo(465, 38, 475, 30, 480, 25);        // second tall peak
  ctx.bezierCurveTo(490, 32, 510, 52, 530, 62);        // descend
  ctx.bezierCurveTo(545, 70, 560, 75, 580, 80);        // valley
  ctx.bezierCurveTo(600, 68, 620, 55, 640, 48);        // rise
  ctx.bezierCurveTo(660, 55, 680, 62, 700, 68);        // valley
  ctx.bezierCurveTo(725, 50, 745, 35, 760, 30);        // third tall peak
  ctx.bezierCurveTo(780, 38, 810, 60, 830, 70);        // descend
  ctx.bezierCurveTo(850, 78, 870, 82, 880, 85);        // gentle slope
  ctx.bezierCurveTo(910, 80, 940, 78, 960, 88);
  ctx.lineTo(960, 240);
  ctx.closePath();
  ctx.fill();

  // ── SNOW CAPS on 3 highest points — drawn with ellipse() dome shapes ──
  function snowCapDome(peakX, peakY, radiusW, radiusH) {
    // Outer bright white dome
    ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
    ctx.beginPath();
    ctx.ellipse(peakX, peakY + radiusH * 0.3, radiusW, radiusH, 0, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    // Inner icy highlight
    ctx.fillStyle = 'rgba(230, 245, 255, 0.7)';
    ctx.beginPath();
    ctx.ellipse(peakX, peakY + radiusH * 0.2, radiusW * 0.6, radiusH * 0.7, 0, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    // Subtle blue-white shimmer
    ctx.fillStyle = 'rgba(200, 230, 255, 0.25)';
    ctx.beginPath();
    ctx.ellipse(peakX - radiusW * 0.2, peakY + radiusH * 0.15, radiusW * 0.3, radiusH * 0.4, -0.2, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
  }

  // Peak 1: x=300, y=30 — DAMAVAND (tallest, biggest snow cap)
  snowCapDome(300, 30, 44, 30);
  // Peak 2: x=480, y=25 — second tallest
  snowCapDome(480, 25, 40, 28);
  // Peak 3: x=760, y=30 — third tall peak
  snowCapDome(760, 30, 40, 26);

  // ── Smooth ridge detail (curved bezier strokes for depth) ──
  ctx.strokeStyle = 'rgba(120, 100, 80, 0.2)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(80, 128);
  ctx.bezierCurveTo(140, 105, 200, 98, 280, 102);
  ctx.bezierCurveTo(350, 108, 425, 92, 500, 88);
  ctx.bezierCurveTo(575, 94, 650, 102, 725, 110);
  ctx.bezierCurveTo(800, 118, 880, 122, 960, 128);
  ctx.stroke();

  // ── Mountain shadow detail (sun from upper-right) ──
  const shadowGrad1 = ctx.createLinearGradient(300, 30, 220, 100);
  shadowGrad1.addColorStop(0, 'rgba(80, 60, 40, 0.12)');
  shadowGrad1.addColorStop(1, 'rgba(80, 60, 40, 0)');
  ctx.fillStyle = shadowGrad1;
  ctx.beginPath();
  ctx.moveTo(300, 30);
  ctx.bezierCurveTo(270, 50, 240, 70, 220, 82);
  ctx.bezierCurveTo(240, 100, 280, 100, 300, 95);
  ctx.closePath();
  ctx.fill();

  const shadowGrad2 = ctx.createLinearGradient(480, 25, 430, 85);
  shadowGrad2.addColorStop(0, 'rgba(80, 60, 40, 0.12)');
  shadowGrad2.addColorStop(1, 'rgba(80, 60, 40, 0)');
  ctx.fillStyle = shadowGrad2;
  ctx.beginPath();
  ctx.moveTo(480, 25);
  ctx.bezierCurveTo(460, 45, 445, 58, 430, 65);
  ctx.bezierCurveTo(450, 80, 475, 82, 480, 80);
  ctx.closePath();
  ctx.fill();

  const shadowGrad3 = ctx.createLinearGradient(760, 30, 700, 85);
  shadowGrad3.addColorStop(0, 'rgba(80, 60, 40, 0.12)');
  shadowGrad3.addColorStop(1, 'rgba(80, 60, 40, 0)');
  ctx.fillStyle = shadowGrad3;
  ctx.beginPath();
  ctx.moveTo(760, 30);
  ctx.bezierCurveTo(740, 48, 720, 62, 700, 70);
  ctx.bezierCurveTo(720, 88, 750, 88, 760, 85);
  ctx.closePath();
  ctx.fill();

  return c;
}

// ── plt_skyline (960x250): Tehran city skyline — PROMINENT landmarks ──
function drawSkyline() {
  const c = mc(960, 250);
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, 960, 250);

  const rng = _seededRandom(123);

  // ── Generic background buildings (beige/sand #D4C5A9 — typical Tehran) ──
  const buildColors = ['#D4C5A9', '#C8B890', '#DDD0B8', '#D0C0A8'];
  for (let bx = 0; bx < 960; bx += 20 + rng() * 30) {
    const bw = 15 + rng() * 25;
    const bh = 30 + rng() * 70;
    const by = 250 - bh;
    ctx.fillStyle = buildColors[Math.floor(rng() * buildColors.length)];
    ctx.fillRect(bx, by, bw, bh);
    // Window reflections
    for (let wy = by + 5; wy < 245; wy += 6 + rng() * 4) {
      for (let wx = bx + 3; wx < bx + bw - 3; wx += 5 + rng() * 3) {
        if (rng() > 0.55) {
          const wAlpha = 0.3 + rng() * 0.5;
          const isReflection = rng() > 0.3;
          ctx.fillStyle = isReflection
            ? `rgba(180, 220, 255, ${wAlpha})`
            : `rgba(100, 130, 160, ${wAlpha})`;
          ctx.fillRect(wx, wy, 1.5, 2);
        }
      }
    }
  }

  // =============================================================
  // MILAD TOWER — 120px tall, thin shaft with wide observation pod
  // The tallest structure in the skyline
  // =============================================================
  const milX = 460;
  const milBase = 250;  // bottom
  const milTop = 30;    // antenna tip = 120px total from milBase-milTop
  // Antenna (thin spike at top)
  ctx.fillStyle = '#999';
  ctx.fillRect(milX - 1, milTop, 3, 30);
  // Antenna tip ball
  ctx.fillStyle = '#bbb';
  ctx.beginPath();
  ctx.arc(milX, milTop, 3, 0, Math.PI * 2);
  ctx.fill();
  // Main shaft (thin, gray/silver)
  const shaftGrad = ctx.createLinearGradient(milX - 4, 0, milX + 4, 0);
  shaftGrad.addColorStop(0, '#b0a898');
  shaftGrad.addColorStop(0.5, '#d0c8b8');
  shaftGrad.addColorStop(1, '#a8a090');
  ctx.fillStyle = shaftGrad;
  ctx.fillRect(milX - 4, 60, 8, 130);
  // Observation deck / pod (WIDE ellipse — the iconic feature)
  const podY = 100;
  const podGrad = ctx.createRadialGradient(milX, podY, 5, milX, podY, 30);
  podGrad.addColorStop(0, '#e0d8c8');
  podGrad.addColorStop(0.7, '#c8c0b0');
  podGrad.addColorStop(1, '#b0a898');
  ctx.fillStyle = podGrad;
  ctx.beginPath();
  ctx.ellipse(milX, podY, 30, 16, 0, 0, Math.PI * 2);
  ctx.fill();
  // Pod outline
  ctx.strokeStyle = 'rgba(140, 130, 120, 0.6)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(milX, podY, 30, 16, 0, 0, Math.PI * 2);
  ctx.stroke();
  // Pod windows (ring of blue reflections around the deck)
  ctx.fillStyle = 'rgba(100, 190, 255, 0.5)';
  for (let a = 0; a < Math.PI * 2; a += 0.35) {
    const wx = milX + Math.cos(a) * 22;
    const wy = podY + Math.sin(a) * 11;
    ctx.fillRect(wx - 1, wy - 1, 3, 3);
  }
  // Tapered base below pod
  ctx.fillStyle = '#c0b8a8';
  ctx.beginPath();
  ctx.moveTo(milX - 18, 190);
  ctx.lineTo(milX - 4, 120);
  ctx.lineTo(milX + 4, 120);
  ctx.lineTo(milX + 18, 190);
  ctx.closePath();
  ctx.fill();
  // Base platform
  ctx.fillStyle = '#b0a898';
  ctx.fillRect(milX - 22, 190, 44, 10);
  // Lower building at base
  ctx.fillStyle = '#c8c0b0';
  ctx.fillRect(milX - 30, 200, 60, 50);
  // Windows on base building
  ctx.fillStyle = 'rgba(130, 190, 240, 0.4)';
  for (let wy = 205; wy < 245; wy += 10) {
    for (let wx = milX - 25; wx < milX + 25; wx += 8) {
      ctx.fillRect(wx, wy, 4, 6);
    }
  }

  // =============================================================
  // AZADI TOWER — 80px tall, iconic inverted-Y arch, white/cream
  // The most recognizable Tehran landmark
  // =============================================================
  const azX = 180;
  const azBase = 250;
  const azTop = 170;   // 80px tall
  // Main body — wide inverted-Y arch shape
  ctx.fillStyle = '#f0e8d8';
  ctx.beginPath();
  // Left leg, wide at base
  ctx.moveTo(azX - 38, azBase);
  ctx.lineTo(azX - 28, azBase - 30);
  ctx.lineTo(azX - 18, azBase - 55);
  ctx.lineTo(azX - 10, azBase - 70);
  ctx.lineTo(azX, azTop);  // peak
  ctx.lineTo(azX + 10, azBase - 70);
  ctx.lineTo(azX + 18, azBase - 55);
  ctx.lineTo(azX + 28, azBase - 30);
  ctx.lineTo(azX + 38, azBase);
  // Inner arch cutout (the hollow center)
  ctx.lineTo(azX + 28, azBase);
  ctx.lineTo(azX + 18, azBase - 20);
  ctx.lineTo(azX + 10, azBase - 42);
  ctx.lineTo(azX, azBase - 55);
  ctx.lineTo(azX - 10, azBase - 42);
  ctx.lineTo(azX - 18, azBase - 20);
  ctx.lineTo(azX - 28, azBase);
  ctx.closePath();
  ctx.fill();
  // Sunlit highlight on left side
  ctx.fillStyle = 'rgba(255, 255, 240, 0.3)';
  ctx.beginPath();
  ctx.moveTo(azX - 38, azBase);
  ctx.lineTo(azX - 28, azBase - 30);
  ctx.lineTo(azX - 18, azBase - 55);
  ctx.lineTo(azX - 10, azBase - 70);
  ctx.lineTo(azX, azTop);
  ctx.lineTo(azX - 5, azBase - 65);
  ctx.lineTo(azX - 14, azBase - 48);
  ctx.lineTo(azX - 24, azBase - 25);
  ctx.lineTo(azX - 34, azBase);
  ctx.closePath();
  ctx.fill();
  // Shadow on right side
  ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
  ctx.beginPath();
  ctx.moveTo(azX, azTop);
  ctx.lineTo(azX + 10, azBase - 70);
  ctx.lineTo(azX + 18, azBase - 55);
  ctx.lineTo(azX + 28, azBase - 30);
  ctx.lineTo(azX + 38, azBase);
  ctx.lineTo(azX + 28, azBase);
  ctx.lineTo(azX + 18, azBase - 20);
  ctx.lineTo(azX + 10, azBase - 42);
  ctx.lineTo(azX, azBase - 55);
  ctx.closePath();
  ctx.fill();
  // Top ornamental crown (wider circle)
  ctx.fillStyle = '#e8e0d0';
  ctx.beginPath();
  ctx.arc(azX, azTop, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#d0c8b8';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(azX, azTop, 8, 0, Math.PI * 2);
  ctx.stroke();
  // Turquoise tile accents along arch edges
  ctx.strokeStyle = 'rgba(0, 190, 210, 0.6)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(azX - 18, azBase - 20);
  ctx.lineTo(azX - 10, azBase - 42);
  ctx.lineTo(azX, azBase - 55);
  ctx.lineTo(azX + 10, azBase - 42);
  ctx.lineTo(azX + 18, azBase - 20);
  ctx.stroke();
  // Turquoise tile band at mid-height
  ctx.fillStyle = 'rgba(0, 180, 200, 0.25)';
  ctx.fillRect(azX - 15, azBase - 50, 30, 5);

  // =============================================================
  // MOSQUE DOME 1 — Large turquoise onion dome, ~50px diameter
  // =============================================================
  const d1X = 680, d1Base = 250;
  const d1Top = d1Base - 75; // dome peak at 175
  // Drum (rectangular base of dome)
  ctx.fillStyle = '#c8b898';
  ctx.fillRect(d1X - 28, d1Base - 35, 56, 35);
  // Windows on drum
  ctx.fillStyle = 'rgba(0, 180, 200, 0.3)';
  for (let wx = d1X - 22; wx < d1X + 22; wx += 10) {
    ctx.beginPath();
    ctx.arc(wx, d1Base - 25, 3, Math.PI, 0);
    ctx.lineTo(wx + 3, d1Base - 15);
    ctx.lineTo(wx - 3, d1Base - 15);
    ctx.closePath();
    ctx.fill();
  }
  // Dome body (turquoise onion shape)
  const domeGrad1 = ctx.createLinearGradient(d1X - 25, d1Top, d1X + 25, d1Top);
  domeGrad1.addColorStop(0, '#1a9090');
  domeGrad1.addColorStop(0.3, '#22bbbb');
  domeGrad1.addColorStop(0.5, '#33dddd');
  domeGrad1.addColorStop(0.7, '#22bbbb');
  domeGrad1.addColorStop(1, '#1a8888');
  ctx.fillStyle = domeGrad1;
  ctx.beginPath();
  ctx.moveTo(d1X - 28, d1Base - 35);
  ctx.quadraticCurveTo(d1X - 30, d1Base - 55, d1X - 22, d1Base - 60);
  ctx.quadraticCurveTo(d1X - 12, d1Base - 72, d1X, d1Top);
  ctx.quadraticCurveTo(d1X + 12, d1Base - 72, d1X + 22, d1Base - 60);
  ctx.quadraticCurveTo(d1X + 30, d1Base - 55, d1X + 28, d1Base - 35);
  ctx.closePath();
  ctx.fill();
  // Dome tile pattern (subtle lines)
  ctx.strokeStyle = 'rgba(0, 180, 180, 0.25)';
  ctx.lineWidth = 0.8;
  for (let i = -20; i <= 20; i += 8) {
    ctx.beginPath();
    ctx.moveTo(d1X + i, d1Base - 35);
    ctx.quadraticCurveTo(d1X + i * 0.3, d1Top + 10, d1X, d1Top + 3);
    ctx.stroke();
  }
  // Golden crescent finial on top
  ctx.strokeStyle = '#ddb030';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(d1X, d1Top - 6, 6, 0.4, Math.PI * 2 - 0.4);
  ctx.stroke();
  // Finial pole
  ctx.fillStyle = '#ddb030';
  ctx.fillRect(d1X - 1, d1Top - 2, 3, 8);

  // =============================================================
  // MOSQUE DOME 2 — Golden dome, ~40px diameter
  // =============================================================
  const d2X = 820, d2Base = 250;
  const d2Top = d2Base - 60; // dome peak at 190
  // Drum
  ctx.fillStyle = '#c0b090';
  ctx.fillRect(d2X - 22, d2Base - 28, 44, 28);
  // Dome body (golden onion shape)
  const domeGrad2 = ctx.createLinearGradient(d2X - 20, d2Top, d2X + 20, d2Top);
  domeGrad2.addColorStop(0, '#bb9930');
  domeGrad2.addColorStop(0.3, '#ddbb44');
  domeGrad2.addColorStop(0.5, '#eedd66');
  domeGrad2.addColorStop(0.7, '#ddbb44');
  domeGrad2.addColorStop(1, '#bb9930');
  ctx.fillStyle = domeGrad2;
  ctx.beginPath();
  ctx.moveTo(d2X - 22, d2Base - 28);
  ctx.quadraticCurveTo(d2X - 24, d2Base - 44, d2X - 16, d2Base - 48);
  ctx.quadraticCurveTo(d2X - 8, d2Base - 58, d2X, d2Top);
  ctx.quadraticCurveTo(d2X + 8, d2Base - 58, d2X + 16, d2Base - 48);
  ctx.quadraticCurveTo(d2X + 24, d2Base - 44, d2X + 22, d2Base - 28);
  ctx.closePath();
  ctx.fill();
  // Golden highlight
  ctx.fillStyle = 'rgba(255, 240, 130, 0.3)';
  ctx.beginPath();
  ctx.arc(d2X - 6, d2Base - 42, 10, Math.PI, 0);
  ctx.fill();
  // Golden crescent
  ctx.strokeStyle = '#ddb030';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(d2X, d2Top - 5, 5, 0.3, Math.PI * 2 - 0.3);
  ctx.stroke();
  ctx.fillStyle = '#ddb030';
  ctx.fillRect(d2X - 1, d2Top - 1, 3, 6);

  // =============================================================
  // MOSQUE DOME 3 — smaller turquoise dome
  // =============================================================
  const d3X = 100, d3Base = 250;
  const d3Top = d3Base - 50;
  // Drum
  ctx.fillStyle = '#c8b898';
  ctx.fillRect(d3X - 18, d3Base - 22, 36, 22);
  // Dome body
  const domeGrad3 = ctx.createLinearGradient(d3X - 16, d3Top, d3X + 16, d3Top);
  domeGrad3.addColorStop(0, '#1a8888');
  domeGrad3.addColorStop(0.5, '#22aaaa');
  domeGrad3.addColorStop(1, '#1a7777');
  ctx.fillStyle = domeGrad3;
  ctx.beginPath();
  ctx.moveTo(d3X - 18, d3Base - 22);
  ctx.quadraticCurveTo(d3X - 20, d3Base - 36, d3X - 12, d3Base - 40);
  ctx.quadraticCurveTo(d3X - 5, d3Base - 48, d3X, d3Top);
  ctx.quadraticCurveTo(d3X + 5, d3Base - 48, d3X + 12, d3Base - 40);
  ctx.quadraticCurveTo(d3X + 20, d3Base - 36, d3X + 18, d3Base - 22);
  ctx.closePath();
  ctx.fill();
  // Golden crescent
  ctx.strokeStyle = '#ddb030';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(d3X, d3Top - 4, 4, 0.3, Math.PI * 2 - 0.3);
  ctx.stroke();
  ctx.fillStyle = '#ddb030';
  ctx.fillRect(d3X - 1, d3Top, 2, 5);

  // =============================================================
  // MINARETS — tall thin towers with golden tips
  // =============================================================

  function drawMinaret(mx, mBase, mHeight) {
    const mTop = mBase - mHeight;
    // Shaft
    ctx.fillStyle = '#d4c4a0';
    ctx.fillRect(mx - 4, mTop + 12, 8, mHeight - 12);
    // Shaft taper at top
    ctx.fillStyle = '#d4c4a0';
    ctx.beginPath();
    ctx.moveTo(mx - 5, mTop + 22);
    ctx.lineTo(mx - 3, mTop + 12);
    ctx.lineTo(mx + 3, mTop + 12);
    ctx.lineTo(mx + 5, mTop + 22);
    ctx.closePath();
    ctx.fill();
    // Balcony ring
    ctx.fillStyle = '#c0b090';
    ctx.fillRect(mx - 7, mTop + 18, 14, 4);
    // Second balcony lower
    ctx.fillRect(mx - 6, mTop + mHeight * 0.4, 12, 3);
    // Golden pointed tip
    ctx.fillStyle = '#ddb030';
    ctx.beginPath();
    ctx.moveTo(mx, mTop);
    ctx.lineTo(mx - 5, mTop + 12);
    ctx.lineTo(mx + 5, mTop + 12);
    ctx.closePath();
    ctx.fill();
    // Gold crescent ball on tip
    ctx.fillStyle = '#eec040';
    ctx.beginPath();
    ctx.arc(mx, mTop - 2, 3.5, 0, Math.PI * 2);
    ctx.fill();
    // Crescent moon symbol
    ctx.strokeStyle = '#ddb030';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(mx, mTop - 2, 3, 0.5, Math.PI * 2 - 0.5);
    ctx.stroke();
  }

  // Minarets flanking dome 1
  drawMinaret(d1X - 40, d1Base, 75);
  drawMinaret(d1X + 40, d1Base, 75);
  // Minarets flanking dome 2
  drawMinaret(d2X - 32, d2Base, 65);
  drawMinaret(d2X + 32, d2Base, 60);

  // =============================================================
  // SIGNS with Persian-style script
  // =============================================================
  // Sign 1
  ctx.fillStyle = 'rgba(80, 120, 100, 0.85)';
  ctx.fillRect(300, 220, 30, 12);
  ctx.strokeStyle = 'rgba(255, 240, 200, 0.7)';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(303, 226);
  ctx.quadraticCurveTo(308, 223, 312, 226);
  ctx.quadraticCurveTo(316, 229, 320, 225);
  ctx.quadraticCurveTo(324, 223, 327, 226);
  ctx.stroke();
  ctx.fillStyle = 'rgba(255, 240, 200, 0.7)';
  ctx.fillRect(310, 222, 1.5, 1.5);
  ctx.fillRect(322, 222, 1.5, 1.5);

  // Sign 2 (turquoise)
  ctx.fillStyle = 'rgba(0, 120, 130, 0.85)';
  ctx.fillRect(550, 225, 35, 10);
  ctx.strokeStyle = 'rgba(0, 200, 210, 0.6)';
  ctx.lineWidth = 0.5;
  ctx.strokeRect(550, 225, 35, 10);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.lineWidth = 0.7;
  ctx.beginPath();
  ctx.moveTo(553, 231);
  ctx.quadraticCurveTo(558, 228, 563, 230);
  ctx.quadraticCurveTo(568, 232, 573, 229);
  ctx.quadraticCurveTo(578, 228, 582, 231);
  ctx.stroke();

  // Sign 3 (red)
  ctx.fillStyle = 'rgba(180, 40, 30, 0.85)';
  ctx.fillRect(370, 218, 28, 10);
  ctx.strokeStyle = 'rgba(255, 220, 180, 0.7)';
  ctx.lineWidth = 0.7;
  ctx.beginPath();
  ctx.moveTo(373, 223);
  ctx.quadraticCurveTo(378, 220, 383, 223);
  ctx.quadraticCurveTo(388, 226, 393, 222);
  ctx.stroke();

  // ── Turquoise arched windows on buildings ──
  ctx.strokeStyle = 'rgba(0, 180, 200, 0.6)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(270, 230, 6, Math.PI, 0);
  ctx.lineTo(276, 244);
  ctx.lineTo(264, 244);
  ctx.closePath();
  ctx.stroke();
  ctx.fillStyle = 'rgba(0, 200, 210, 0.15)';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(760, 228, 5, Math.PI, 0);
  ctx.lineTo(765, 238);
  ctx.lineTo(755, 238);
  ctx.closePath();
  ctx.stroke();
  ctx.fillStyle = 'rgba(0, 200, 210, 0.15)';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(920, 232, 5, Math.PI, 0);
  ctx.lineTo(925, 244);
  ctx.lineTo(915, 244);
  ctx.closePath();
  ctx.stroke();
  ctx.fillStyle = 'rgba(0, 200, 210, 0.15)';
  ctx.fill();

  return c;
}

// ── plt_near_buildings (960x180): Closer building facades — bright daytime ──
function drawNearBuildings() {
  const c = mc(960, 180);
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, 960, 180);

  const rng = _seededRandom(777);

  // Building colors: beige, cream, light sand — typical Tehran
  const buildColors = ['#d8c8a8', '#e0d4b8', '#ccb898', '#d4c0a0', '#e4dcc4'];

  for (let bx = 0; bx < 960; bx += 30 + rng() * 40) {
    const bw = 25 + rng() * 40;
    const bh = 80 + rng() * 90;
    const by = 180 - bh;
    ctx.fillStyle = buildColors[Math.floor(rng() * buildColors.length)];
    ctx.fillRect(bx, by, bw, bh);

    // Window grids with sky reflections
    for (let wy = by + 4; wy < 176; wy += 7) {
      for (let wx = bx + 3; wx < bx + bw - 3; wx += 6) {
        if (rng() > 0.45) {
          const isReflecting = rng() > 0.5;
          ctx.fillStyle = isReflecting
            ? `rgba(130, 190, 240, ${0.4 + rng() * 0.4})`
            : `rgba(80, 100, 120, ${0.3 + rng() * 0.3})`;
          ctx.fillRect(wx, wy, 3, 4);
        }
      }
    }

    // Colorful awnings on ground-floor shops (reds, greens, blues)
    if (bh > 100 && rng() > 0.3) {
      const awningColors = ['#cc3333', '#338833', '#3355aa', '#bb7722', '#884488'];
      ctx.fillStyle = awningColors[Math.floor(rng() * awningColors.length)];
      ctx.beginPath();
      ctx.moveTo(bx, 165);
      ctx.lineTo(bx + bw, 165);
      ctx.lineTo(bx + bw + 3, 172);
      ctx.lineTo(bx - 3, 172);
      ctx.closePath();
      ctx.fill();
      // Awning stripe detail
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      for (let sx = bx + 2; sx < bx + bw; sx += 5) {
        ctx.fillRect(sx, 165, 2, 7);
      }
    }

    // Rooftop details: antenna, water tank, satellite dish
    if (rng() > 0.5) {
      ctx.fillStyle = 'rgba(160, 150, 130, 0.8)';
      ctx.fillRect(bx + bw / 2, by - 12, 1, 12);
      // Red light
      ctx.fillStyle = 'rgba(255, 80, 80, 0.6)';
      ctx.fillRect(bx + bw / 2 - 1, by - 13, 3, 2);
    }
    if (rng() > 0.6) {
      // Water tank (common in Tehran)
      ctx.fillStyle = 'rgba(140, 130, 120, 0.8)';
      ctx.fillRect(bx + 3, by - 6, 8, 6);
    }
    if (rng() > 0.7) {
      // Satellite dish
      ctx.fillStyle = 'rgba(180, 170, 160, 0.7)';
      ctx.beginPath();
      ctx.arc(bx + bw - 6, by - 2, 4, Math.PI, 0);
      ctx.fill();
      ctx.fillRect(bx + bw - 7, by - 2, 1, 4);
    }
  }

  // ── Palm trees between buildings ──
  function drawPalmTree(px, py, height) {
    // Trunk (brown, slightly curved)
    ctx.strokeStyle = '#8B6914';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.quadraticCurveTo(px + 3, py - height * 0.5, px + 1, py - height);
    ctx.stroke();
    // Trunk texture rings
    ctx.strokeStyle = '#7A5A10';
    ctx.lineWidth = 1;
    for (let ty = py - 5; ty > py - height + 5; ty -= 6) {
      ctx.beginPath();
      ctx.moveTo(px - 1, ty);
      ctx.lineTo(px + 3, ty);
      ctx.stroke();
    }
    // Palm fronds (radiating green leaves)
    const topX = px + 1, topY = py - height;
    ctx.strokeStyle = '#2a8820';
    ctx.lineWidth = 1.5;
    const frondAngles = [-2.5, -2.0, -1.5, -0.8, -0.3, 0.3, 0.8, 1.5];
    for (const a of frondAngles) {
      const endX = topX + Math.cos(a) * 16;
      const endY = topY + Math.sin(a) * 12 - 2;
      const cpX = topX + Math.cos(a) * 10;
      const cpY = topY + Math.sin(a) * 4 - 5;
      ctx.beginPath();
      ctx.moveTo(topX, topY);
      ctx.quadraticCurveTo(cpX, cpY, endX, endY);
      ctx.stroke();
    }
    // Frond fill (lighter green)
    ctx.fillStyle = 'rgba(50, 160, 40, 0.6)';
    ctx.beginPath();
    ctx.arc(topX, topY - 3, 8, 0, Math.PI * 2);
    ctx.fill();
  }

  drawPalmTree(120, 176, 50);
  drawPalmTree(340, 176, 45);
  drawPalmTree(560, 176, 55);
  drawPalmTree(780, 176, 48);
  drawPalmTree(900, 176, 42);

  // ── Signs with Farsi-style squiggly text ──
  // Sign on near building
  ctx.fillStyle = 'rgba(0, 100, 110, 0.9)';
  ctx.fillRect(200, 155, 32, 10);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(203, 161);
  ctx.quadraticCurveTo(208, 158, 213, 160);
  ctx.quadraticCurveTo(218, 163, 223, 159);
  ctx.quadraticCurveTo(228, 157, 230, 161);
  ctx.stroke();

  // Another sign
  ctx.fillStyle = 'rgba(150, 30, 20, 0.9)';
  ctx.fillRect(650, 150, 28, 9);
  ctx.strokeStyle = 'rgba(255, 240, 200, 0.8)';
  ctx.lineWidth = 0.7;
  ctx.beginPath();
  ctx.moveTo(653, 155);
  ctx.quadraticCurveTo(658, 152, 663, 155);
  ctx.quadraticCurveTo(668, 157, 673, 154);
  ctx.stroke();

  return c;
}

// ===================================================================
// PLATFORM TEXTURES (static sprites)
// ===================================================================

// ── plt_roof_flat (128x40): Flat concrete rooftop — sandy/beige daytime ──
function drawRoofFlat() {
  const c = mc(128, 40);
  const ctx = c.getContext('2d');

  // Main surface (warm sandy beige)
  const grad = ctx.createLinearGradient(0, 0, 0, 40);
  grad.addColorStop(0, '#c8b898');
  grad.addColorStop(0.15, '#baa888');
  grad.addColorStop(1, '#a89878');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 40);

  // Edge lip at top (lighter highlight in sunlight)
  ctx.fillStyle = '#d4c4a4';
  ctx.fillRect(0, 0, 128, 4);

  // Border lines
  ctx.strokeStyle = '#9a8a6a';
  ctx.lineWidth = 1;
  ctx.strokeRect(0, 0, 128, 40);

  // Surface cracks
  ctx.strokeStyle = 'rgba(80, 60, 40, 0.2)';
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
  ctx.fillStyle = '#b0a080';
  ctx.fillRect(110, 6, 6, 10);
  ctx.fillStyle = '#a89878';
  ctx.fillRect(108, 6, 10, 2);
  // Vent
  ctx.fillStyle = '#a09070';
  ctx.fillRect(15, 20, 8, 6);
  ctx.strokeStyle = '#908060';
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

// Uses centralized SuperZionRenderer for consistent character appearance.
// Scale chosen so 48-unit character fits within 64x64 canvas.
function _drawPlayerBase(ctx, legPhase, armPhase, isJump) {
  // Centralized renderer: scale 1.2 fits 48-unit character in 64x64 canvas
  const pose = isJump ? 'jump' : (legPhase > 0 ? 'walk1' : 'idle');
  drawSuperZionSide(ctx, 32, 32, 1.2, 'right', { pose, showGun: true });
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

  // ── Dark outline silhouette (drawn first, 1px larger) ──
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  // Body outline
  ctx.beginPath();
  ctx.ellipse(cx, cy, 11, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  // Head outline
  ctx.beginPath();
  ctx.arc(cx, cy - 14, 9, 0, Math.PI * 2);
  ctx.fill();

  // ── Boots (rounded with toe caps) ──
  ctx.fillStyle = '#1a1a1a';
  const bootOffs = [
    [-7, 1],
    [-9, 5],
    [-5, -3],
    [-6, 3],
  ];
  const bo = bootOffs[legPhase] || bootOffs[0];
  // Left boot
  ctx.beginPath();
  ctx.ellipse(cx + bo[0] + 3.5, cy + 24, 4.5, 3.5, 0, 0, Math.PI * 2);
  ctx.fill();
  // Right boot
  ctx.beginPath();
  ctx.ellipse(cx + bo[0] + 10 + bo[1] + 3.5, cy + 24, 4.5, 3.5, 0, 0, Math.PI * 2);
  ctx.fill();
  // Boot highlight strip
  ctx.fillStyle = '#333333';
  ctx.beginPath();
  ctx.ellipse(cx + bo[0] + 3.5, cy + 22, 3.5, 1, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx + bo[0] + 10 + bo[1] + 3.5, cy + 22, 3.5, 1, 0, 0, Math.PI * 2);
  ctx.fill();

  // ── Legs (olive pants — elliptical capsules) ──
  ctx.fillStyle = '#3a4a2a';
  const legOff = [
    [{ x: -6, h: 14 }, { x: 2, h: 14 }],
    [{ x: -8, h: 16 }, { x: 4, h: 12 }],
    [{ x: -4, h: 12 }, { x: 0, h: 16 }],
    [{ x: -5, h: 13 }, { x: 3, h: 13 }],
  ];
  const lp = legOff[legPhase] || legOff[0];
  // Left leg — pill-shaped ellipse
  ctx.beginPath();
  ctx.ellipse(cx + lp[0].x + 3, cy + 8 + lp[0].h / 2, 3.5, lp[0].h / 2, 0, 0, Math.PI * 2);
  ctx.fill();
  // Right leg — pill-shaped ellipse
  ctx.beginPath();
  ctx.ellipse(cx + lp[1].x + 3, cy + 8 + lp[1].h / 2, 3.5, lp[1].h / 2, 0, 0, Math.PI * 2);
  ctx.fill();
  // Leg shading (darker inner edge)
  ctx.fillStyle = '#2e3e22';
  ctx.beginPath();
  ctx.ellipse(cx + lp[0].x + 4.5, cy + 8 + lp[0].h / 2, 1.5, lp[0].h / 2 - 1, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx + lp[1].x + 1.5, cy + 8 + lp[1].h / 2, 1.5, lp[1].h / 2 - 1, 0, 0, Math.PI * 2);
  ctx.fill();

  // ── Torso (dark olive uniform — bezier trapezoid) ──
  ctx.fillStyle = '#3a4a2a';
  ctx.beginPath();
  ctx.moveTo(cx - 10, cy - 8);
  ctx.quadraticCurveTo(cx - 11, cy - 8, cx - 10, cy - 4);
  ctx.lineTo(cx - 8, cy + 8);
  ctx.quadraticCurveTo(cx, cy + 10, cx + 8, cy + 8);
  ctx.lineTo(cx + 10, cy - 4);
  ctx.quadraticCurveTo(cx + 11, cy - 8, cx + 10, cy - 8);
  ctx.closePath();
  ctx.fill();
  // Torso highlight (lighter centre)
  ctx.fillStyle = '#445a34';
  ctx.beginPath();
  ctx.ellipse(cx, cy - 2, 5, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  // ── Belt (elliptical capsule) ──
  ctx.fillStyle = '#2a2a1a';
  ctx.beginPath();
  ctx.ellipse(cx, cy + 7.5, 9, 2, 0, 0, Math.PI * 2);
  ctx.fill();
  // Belt buckle highlight
  ctx.fillStyle = '#3a3a2a';
  ctx.beginPath();
  ctx.ellipse(cx, cy + 7.5, 2.5, 1.5, 0, 0, Math.PI * 2);
  ctx.fill();

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

  // ── Arms (olive — elliptical) ──
  ctx.fillStyle = '#3a4a2a';
  // Left arm
  ctx.beginPath();
  ctx.ellipse(cx - 11.5, cy + 1, 3, 5.5, 0.1, 0, Math.PI * 2);
  ctx.fill();
  // Right arm
  ctx.beginPath();
  ctx.ellipse(cx + 11.5, cy + 1, 3, 5.5, -0.1, 0, Math.PI * 2);
  ctx.fill();
  // Arm shading (darker outer edge)
  ctx.fillStyle = '#2e3e22';
  ctx.beginPath();
  ctx.ellipse(cx - 13, cy + 1, 1.5, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx + 13, cy + 1, 1.5, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  // Hands (skin)
  ctx.fillStyle = '#b08060';
  ctx.beginPath();
  ctx.ellipse(cx - 11, cy + 6, 2, 1.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx + 11, cy + 6, 2, 1.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // ── Head ──
  ctx.fillStyle = '#b08060';
  ctx.beginPath();
  ctx.arc(cx, cy - 14, 8, 0, Math.PI * 2);
  ctx.fill();
  // Head highlight (forehead)
  ctx.fillStyle = '#c09070';
  ctx.beginPath();
  ctx.ellipse(cx, cy - 16, 5, 3, 0, 0, Math.PI * 2);
  ctx.fill();

  // Beard stubble
  ctx.fillStyle = 'rgba(40, 30, 20, 0.3)';
  ctx.beginPath();
  ctx.arc(cx, cy - 9, 6, 0, Math.PI);
  ctx.fill();

  // ── Eyes (ellipses instead of rectangles) ──
  // Eye whites
  ctx.fillStyle = '#e8e8e0';
  ctx.beginPath();
  ctx.ellipse(cx - 3, cy - 15.5, 2, 1.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx + 3, cy - 15.5, 2, 1.5, 0, 0, Math.PI * 2);
  ctx.fill();
  // Irises
  ctx.fillStyle = '#1a1a1a';
  ctx.beginPath();
  ctx.ellipse(cx - 3, cy - 15.5, 1.2, 1.2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx + 3, cy - 15.5, 1.2, 1.2, 0, 0, Math.PI * 2);
  ctx.fill();

  // Beret/cap (elliptical dome)
  ctx.fillStyle = '#2a3020';
  ctx.beginPath();
  ctx.ellipse(cx, cy - 20, 9, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  // Beret dome top (slightly tilted)
  ctx.beginPath();
  ctx.ellipse(cx - 1, cy - 21, 7, 3, -0.15, Math.PI, 0);
  ctx.fill();
  // Beret highlight
  ctx.fillStyle = '#3a4030';
  ctx.beginPath();
  ctx.ellipse(cx - 2, cy - 22, 3, 1.5, -0.2, Math.PI, 0);
  ctx.fill();

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

  // ── Shoulder patches (rank detail) ──
  ctx.fillStyle = '#4a5a3a';
  ctx.beginPath();
  ctx.ellipse(cx - 10, cy - 6, 2, 1.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx + 10, cy - 6, 2, 1.5, 0, 0, Math.PI * 2);
  ctx.fill();
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
    // Tiny head (circle)
    ctx.beginPath();
    ctx.arc(gx + 5, gy + 3, 3, 0, Math.PI * 2);
    ctx.fill();
    // Shoulders and torso (ellipse instead of rectangle)
    ctx.beginPath();
    ctx.ellipse(gx + 5, gy + 10, 4.5, 4, 0, 0, Math.PI * 2);
    ctx.fill();
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

  // ── Background layers (daytime) ──
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
