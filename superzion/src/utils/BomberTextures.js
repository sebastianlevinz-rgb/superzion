// ═══════════════════════════════════════════════════════════════
// BomberTextures — Side-scrolling Level 3 textures
// F-15Z side sprite, carrier side view, sunset sky, terrain layers
// ═══════════════════════════════════════════════════════════════

const W = 960;
const H = 540;

function _drawMiniStar(ctx, cx, cy, r, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(cx, cy - r);
  ctx.lineTo(cx - r * 0.87, cy + r * 0.5);
  ctx.lineTo(cx + r * 0.87, cy + r * 0.5);
  ctx.closePath();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx, cy + r);
  ctx.lineTo(cx - r * 0.87, cy - r * 0.5);
  ctx.lineTo(cx + r * 0.87, cy - r * 0.5);
  ctx.closePath();
  ctx.stroke();
}

// ── F-15Z side-view sprite (96×48) facing RIGHT ─────────────
export function createF15SideSprite(scene) {
  if (scene.textures.exists('f15_side')) return;

  const w = 96, h = 48;
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  const cy = h / 2;

  // Main fuselage body
  ctx.fillStyle = '#7a7a82';
  ctx.beginPath();
  ctx.moveTo(92, cy);          // nose tip
  ctx.lineTo(82, cy - 7);      // upper nose
  ctx.lineTo(60, cy - 9);      // canopy area
  ctx.lineTo(35, cy - 8);      // mid top
  ctx.lineTo(15, cy - 6);      // rear top
  ctx.lineTo(8, cy - 4);       // tail connector
  ctx.lineTo(8, cy + 4);       // tail bottom
  ctx.lineTo(15, cy + 6);      // rear bottom
  ctx.lineTo(35, cy + 7);      // mid bottom
  ctx.lineTo(60, cy + 6);      // lower body
  ctx.lineTo(82, cy + 4);      // lower nose
  ctx.closePath();
  ctx.fill();

  // Fuselage highlight (lighter stripe on top)
  ctx.fillStyle = '#9a9aa2';
  ctx.beginPath();
  ctx.moveTo(85, cy - 3);
  ctx.lineTo(70, cy - 6);
  ctx.lineTo(40, cy - 6);
  ctx.lineTo(20, cy - 4);
  ctx.lineTo(40, cy - 1);
  ctx.lineTo(70, cy - 1);
  ctx.closePath();
  ctx.fill();

  // Nose cone (darker)
  ctx.fillStyle = '#4a4a52';
  ctx.beginPath();
  ctx.moveTo(92, cy);
  ctx.lineTo(84, cy - 4);
  ctx.lineTo(84, cy + 3);
  ctx.closePath();
  ctx.fill();

  // Cockpit canopy (dark glass, raised bump)
  ctx.fillStyle = '#1a3050';
  ctx.beginPath();
  ctx.moveTo(76, cy - 7);
  ctx.lineTo(68, cy - 12);
  ctx.lineTo(60, cy - 11);
  ctx.lineTo(60, cy - 8);
  ctx.closePath();
  ctx.fill();
  // Glass glint
  ctx.fillStyle = 'rgba(100,200,255,0.4)';
  ctx.fillRect(71, cy - 11, 3, 2);

  // Main wings (extending up and down)
  ctx.fillStyle = '#6a6a72';
  // Upper wing
  ctx.beginPath();
  ctx.moveTo(50, cy - 8);
  ctx.lineTo(38, cy - 22);
  ctx.lineTo(28, cy - 20);
  ctx.lineTo(38, cy - 8);
  ctx.closePath();
  ctx.fill();
  // Lower wing
  ctx.beginPath();
  ctx.moveTo(50, cy + 6);
  ctx.lineTo(38, cy + 22);
  ctx.lineTo(28, cy + 20);
  ctx.lineTo(38, cy + 6);
  ctx.closePath();
  ctx.fill();

  // Horizontal stabilizers (small rear wings)
  ctx.fillStyle = '#5a5a62';
  ctx.beginPath();
  ctx.moveTo(18, cy - 5);
  ctx.lineTo(10, cy - 14);
  ctx.lineTo(5, cy - 13);
  ctx.lineTo(13, cy - 5);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(18, cy + 5);
  ctx.lineTo(10, cy + 14);
  ctx.lineTo(5, cy + 13);
  ctx.lineTo(13, cy + 5);
  ctx.closePath();
  ctx.fill();

  // Vertical tail fin (pointing up)
  ctx.fillStyle = '#5a5a62';
  ctx.beginPath();
  ctx.moveTo(14, cy - 5);
  ctx.lineTo(5, cy - 18);
  ctx.lineTo(2, cy - 17);
  ctx.lineTo(8, cy - 5);
  ctx.closePath();
  ctx.fill();

  // Engine nozzles (rear/left)
  ctx.fillStyle = '#4a4a52';
  ctx.beginPath(); ctx.arc(10, cy - 1, 3, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(10, cy + 3, 3, 0, Math.PI * 2); ctx.fill();

  // Engine flame (orange/red)
  ctx.fillStyle = '#ff9900';
  ctx.beginPath();
  ctx.moveTo(7, cy - 5);
  ctx.lineTo(-5, cy + 1);
  ctx.lineTo(7, cy + 7);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#ff6600';
  ctx.beginPath();
  ctx.moveTo(7, cy - 2);
  ctx.lineTo(0, cy + 1);
  ctx.lineTo(7, cy + 4);
  ctx.closePath();
  ctx.fill();

  // Star of David on fuselage
  _drawMiniStar(ctx, 52, cy, 4, '#FFD700');

  // Under-wing bomb/missile
  ctx.fillStyle = '#3a3a42';
  ctx.beginPath();
  ctx.ellipse(42, cy + 24, 7, 2.5, 0, 0, Math.PI * 2);
  ctx.fill();
  // Bomb nose
  ctx.fillStyle = '#2a2a32';
  ctx.beginPath();
  ctx.moveTo(50, cy + 24);
  ctx.lineTo(48, cy + 22);
  ctx.lineTo(48, cy + 26);
  ctx.closePath();
  ctx.fill();
  // Bomb fins
  ctx.fillStyle = '#4a4a52';
  ctx.fillRect(35, cy + 22, 1, 5);

  scene.textures.addCanvas('f15_side', c);
}

// ── Carrier side view (480×200) ─────────────────────────────
export function createCarrierSide(scene) {
  if (scene.textures.exists('carrier_side')) return;

  const cw = 480, ch = 200;
  const c = document.createElement('canvas');
  c.width = cw; c.height = ch;
  const ctx = c.getContext('2d');

  // Hull (main body)
  ctx.fillStyle = '#4a4a52';
  ctx.beginPath();
  ctx.moveTo(30, 65);       // stern deck level
  ctx.lineTo(420, 65);      // bow deck level
  ctx.lineTo(455, 55);      // ski-jump ramp tip
  ctx.lineTo(460, 62);      // bow below ramp
  ctx.lineTo(460, 130);     // bow waterline
  ctx.lineTo(440, 150);     // bow below waterline
  ctx.lineTo(50, 155);      // keel
  ctx.lineTo(25, 130);      // stern waterline
  ctx.lineTo(20, 80);       // stern above waterline
  ctx.closePath();
  ctx.fill();

  // Hull bottom (darker)
  ctx.fillStyle = '#3a3a42';
  ctx.beginPath();
  ctx.moveTo(25, 130);
  ctx.lineTo(460, 130);
  ctx.lineTo(440, 150);
  ctx.lineTo(50, 155);
  ctx.lineTo(25, 130);
  ctx.closePath();
  ctx.fill();

  // Waterline
  ctx.strokeStyle = '#8a2020';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(25, 130);
  ctx.lineTo(460, 130);
  ctx.stroke();

  // Flight deck surface
  ctx.fillStyle = '#5a5a62';
  ctx.fillRect(30, 60, 390, 8);

  // Ski-jump ramp
  ctx.fillStyle = '#626270';
  ctx.beginPath();
  ctx.moveTo(420, 60);
  ctx.lineTo(455, 50);
  ctx.lineTo(455, 58);
  ctx.lineTo(420, 68);
  ctx.closePath();
  ctx.fill();

  // Deck markings (dashed white line)
  ctx.strokeStyle = 'rgba(255,255,255,0.3)';
  ctx.lineWidth = 1;
  ctx.setLineDash([8, 6]);
  ctx.beginPath();
  ctx.moveTo(40, 63);
  ctx.lineTo(415, 63);
  ctx.stroke();
  ctx.setLineDash([]);

  // Arresting wires
  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 4; i++) {
    const wx = 60 + i * 30;
    ctx.beginPath();
    ctx.moveTo(wx, 58);
    ctx.lineTo(wx, 70);
    ctx.stroke();
  }

  // Island (control tower) on top of deck
  const tx = 300, ty = 18;
  ctx.fillStyle = '#3a3a42';
  ctx.fillRect(tx, ty, 55, 44);
  ctx.fillStyle = '#2a2a32';
  ctx.fillRect(tx, ty, 55, 10);
  // Windows
  ctx.fillStyle = 'rgba(100,200,255,0.5)';
  for (let r = 0; r < 2; r++) {
    for (let col = 0; col < 5; col++) {
      ctx.fillRect(tx + 4 + col * 10, ty + 14 + r * 14, 6, 4);
    }
  }
  // Antennas
  ctx.strokeStyle = '#666666';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(tx + 15, ty); ctx.lineTo(tx + 15, ty - 14); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(tx + 35, ty); ctx.lineTo(tx + 35, ty - 10); ctx.stroke();
  // Radar dish
  ctx.strokeStyle = '#555555';
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(tx + 15, ty - 14, 5, Math.PI * 0.8, Math.PI * 1.8); ctx.stroke();

  // Parked aircraft on deck (small)
  ctx.fillStyle = '#4a4a55';
  // Aircraft 1
  ctx.save(); ctx.translate(80, 60); ctx.rotate(-0.05);
  ctx.fillRect(-12, -2, 24, 4);
  ctx.fillRect(-4, -8, 8, 16);
  ctx.restore();
  // Aircraft 2
  ctx.save(); ctx.translate(180, 60); ctx.rotate(0.03);
  ctx.fillRect(-12, -2, 24, 4);
  ctx.fillRect(-4, -8, 8, 16);
  ctx.restore();

  // Sailor dots on deck
  const sailors = [
    { x: 120, y: 58, col: '#ff4444' }, { x: 230, y: 58, col: '#ffff44' },
    { x: 370, y: 58, col: '#44ff44' }, { x: 400, y: 58, col: '#ffffff' },
  ];
  for (const s of sailors) {
    ctx.fillStyle = s.col;
    ctx.beginPath(); ctx.arc(s.x, s.y, 2, 0, Math.PI * 2); ctx.fill();
  }

  // Water around hull (at bottom)
  ctx.fillStyle = 'rgba(10,48,64,0.5)';
  ctx.fillRect(0, 155, cw, 45);
  // Wave lines
  ctx.strokeStyle = 'rgba(100,180,200,0.15)';
  ctx.lineWidth = 0.5;
  for (let y = 160; y < ch; y += 6) {
    ctx.beginPath();
    for (let x = 0; x < cw; x += 15) {
      ctx.lineTo(x, y + Math.sin(x * 0.04) * 2);
    }
    ctx.stroke();
  }

  scene.textures.addCanvas('carrier_side', c);
}

// ── Sunset sky (960×540) — SPECTACULAR side-scroll sunset ────
export function createSunsetSky(scene) {
  if (scene.textures.exists('sunset_sky')) return;

  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const ctx = c.getContext('2d');

  // Vertical gradient
  const skyGrad = ctx.createLinearGradient(0, 0, 0, H);
  skyGrad.addColorStop(0, '#0d0b2e');
  skyGrad.addColorStop(0.1, '#1a1245');
  skyGrad.addColorStop(0.2, '#2d1b69');
  skyGrad.addColorStop(0.35, '#6b3fa0');
  skyGrad.addColorStop(0.5, '#b03070');
  skyGrad.addColorStop(0.6, '#e84393');
  skyGrad.addColorStop(0.7, '#f06030');
  skyGrad.addColorStop(0.8, '#f39c12');
  skyGrad.addColorStop(0.9, '#f1c40f');
  skyGrad.addColorStop(1.0, '#f5d020');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, W, H);

  // Stars in upper portion
  for (let i = 0; i < 50; i++) {
    const sx = Math.random() * W;
    const sy = Math.random() * (H * 0.25);
    const sr = 0.4 + Math.random() * 1;
    ctx.fillStyle = `rgba(255,255,255,${0.2 + Math.random() * 0.5})`;
    ctx.beginPath(); ctx.arc(sx, sy, sr, 0, Math.PI * 2); ctx.fill();
  }

  // Sun — large semicircle at horizon (y ≈ 78% from top)
  const sunX = W * 0.3, sunY = H * 0.78;

  // Outer halo
  const haloGrad = ctx.createRadialGradient(sunX, sunY, 20, sunX, sunY, 200);
  haloGrad.addColorStop(0, 'rgba(241,196,15,0.5)');
  haloGrad.addColorStop(0.3, 'rgba(243,156,18,0.25)');
  haloGrad.addColorStop(0.6, 'rgba(255,107,107,0.1)');
  haloGrad.addColorStop(1, 'rgba(255,107,107,0)');
  ctx.fillStyle = haloGrad;
  ctx.fillRect(0, H * 0.4, W, H * 0.6);

  // Light rays
  ctx.strokeStyle = 'rgba(241,196,15,0.05)';
  ctx.lineWidth = 3;
  for (let i = 0; i < 20; i++) {
    const angle = Math.PI * 0.7 + (i / 20) * Math.PI * 0.6;
    const rayLen = 200 + Math.random() * 120;
    ctx.beginPath();
    ctx.moveTo(sunX, sunY);
    ctx.lineTo(sunX + Math.cos(angle) * rayLen, sunY + Math.sin(angle) * rayLen);
    ctx.stroke();
  }

  // Sun rim
  ctx.fillStyle = 'rgba(255,107,107,0.3)';
  ctx.beginPath(); ctx.arc(sunX, sunY, 60, Math.PI, 0); ctx.fill();

  // Sun core
  const sunGrad = ctx.createRadialGradient(sunX, sunY - 5, 5, sunX, sunY, 50);
  sunGrad.addColorStop(0, '#fff8e1');
  sunGrad.addColorStop(0.3, '#f1c40f');
  sunGrad.addColorStop(0.7, '#f39c12');
  sunGrad.addColorStop(1, '#e67e22');
  ctx.fillStyle = sunGrad;
  ctx.beginPath(); ctx.arc(sunX, sunY, 50, Math.PI, 0); ctx.fill();

  scene.textures.addCanvas('sunset_sky', c);
}

// ── Cloud layer (960×150) — tileable, sunset-lit ─────────────
export function createCloudLayer(scene) {
  if (scene.textures.exists('cloud_layer')) return;

  const cw = W, ch = 150;
  const c = document.createElement('canvas');
  c.width = cw; c.height = ch;
  const ctx = c.getContext('2d');

  const clouds = [
    { x: 50, y: 40, w: 130, h: 28 },
    { x: 250, y: 70, w: 100, h: 22 },
    { x: 420, y: 35, w: 150, h: 30 },
    { x: 620, y: 80, w: 120, h: 24 },
    { x: 780, y: 50, w: 140, h: 26 },
    { x: 160, y: 110, w: 110, h: 20 },
    { x: 500, y: 115, w: 90, h: 18 },
    { x: 870, y: 100, w: 100, h: 22 },
  ];

  for (const cl of clouds) {
    const grad = ctx.createLinearGradient(cl.x, cl.y - cl.h / 2, cl.x, cl.y + cl.h / 2);
    grad.addColorStop(0, 'rgba(255,200,100,0.25)');
    grad.addColorStop(0.4, 'rgba(220,120,140,0.18)');
    grad.addColorStop(1, 'rgba(100,40,120,0.2)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(cl.x + cl.w / 2, cl.y, cl.w / 2, cl.h / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    // Bright top edge
    ctx.strokeStyle = 'rgba(255,220,120,0.12)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(cl.x + cl.w / 2, cl.y, cl.w / 2, cl.h / 2, 0, Math.PI, 0);
    ctx.stroke();
  }

  scene.textures.addCanvas('cloud_layer', c);
}

// ── Sea surface (960×120) — tileable Mediterranean ───────────
export function createSeaSurface(scene) {
  if (scene.textures.exists('sea_surface')) return;

  const tw = W, th = 120;
  const c = document.createElement('canvas');
  c.width = tw; c.height = th;
  const ctx = c.getContext('2d');

  // Dark teal water
  const waterGrad = ctx.createLinearGradient(0, 0, 0, th);
  waterGrad.addColorStop(0, '#0c3848');
  waterGrad.addColorStop(0.3, '#0a3040');
  waterGrad.addColorStop(1, '#081e2a');
  ctx.fillStyle = waterGrad;
  ctx.fillRect(0, 0, tw, th);

  // Orange/gold sunset reflections
  for (let i = 0; i < 30; i++) {
    const rx = Math.random() * tw;
    const ry = Math.random() * 40;
    ctx.fillStyle = `rgba(243,156,18,${0.03 + Math.random() * 0.05})`;
    ctx.fillRect(rx, ry, 20 + Math.random() * 80, 1.5);
  }
  // Pink reflections
  for (let i = 0; i < 15; i++) {
    const rx = Math.random() * tw;
    const ry = 10 + Math.random() * 50;
    ctx.fillStyle = `rgba(232,67,147,${0.02 + Math.random() * 0.03})`;
    ctx.fillRect(rx, ry, 15 + Math.random() * 50, 1);
  }

  // Wave patterns
  ctx.strokeStyle = 'rgba(100,180,200,0.06)';
  ctx.lineWidth = 0.5;
  for (let y = 0; y < th; y += 6) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    for (let x = 0; x < tw; x += 15) {
      ctx.lineTo(x, y + Math.sin(x * 0.025 + y * 0.1) * 2);
    }
    ctx.stroke();
  }

  // Shimmer
  ctx.fillStyle = 'rgba(255,220,100,0.03)';
  for (let i = 0; i < 10; i++) {
    const sx = Math.random() * tw;
    ctx.beginPath();
    ctx.ellipse(sx, 5 + Math.random() * 30, 12, 1.5, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  scene.textures.addCanvas('sea_surface', c);
}

// ── Far mountains (960×250) — tileable mountain silhouettes ──
export function createFarMountains(scene) {
  if (scene.textures.exists('far_mountains')) return;

  const tw = W, th = 250;
  const c = document.createElement('canvas');
  c.width = tw; c.height = th;
  const ctx = c.getContext('2d');

  // Distant range (dark purple silhouette)
  ctx.fillStyle = '#1a1030';
  ctx.beginPath();
  ctx.moveTo(0, th);
  ctx.lineTo(0, 140);
  ctx.lineTo(60, 100); ctx.lineTo(120, 120); ctx.lineTo(180, 70);
  ctx.lineTo(240, 90); ctx.lineTo(300, 50); ctx.lineTo(360, 80);
  ctx.lineTo(420, 60); ctx.lineTo(480, 95); ctx.lineTo(540, 40);
  ctx.lineTo(600, 75); ctx.lineTo(660, 55); ctx.lineTo(720, 85);
  ctx.lineTo(780, 45); ctx.lineTo(840, 70); ctx.lineTo(900, 90);
  ctx.lineTo(960, 65);
  ctx.lineTo(tw, th);
  ctx.closePath();
  ctx.fill();

  // Mid range (slightly lighter)
  ctx.fillStyle = '#201828';
  ctx.beginPath();
  ctx.moveTo(0, th);
  ctx.lineTo(0, 170);
  ctx.lineTo(80, 130); ctx.lineTo(160, 160); ctx.lineTo(240, 110);
  ctx.lineTo(320, 145); ctx.lineTo(400, 100); ctx.lineTo(480, 135);
  ctx.lineTo(560, 95); ctx.lineTo(640, 130); ctx.lineTo(720, 105);
  ctx.lineTo(800, 140); ctx.lineTo(880, 115); ctx.lineTo(960, 130);
  ctx.lineTo(tw, th);
  ctx.closePath();
  ctx.fill();

  // Near range (warmer, slightly green-tinted)
  ctx.fillStyle = '#1a2520';
  ctx.beginPath();
  ctx.moveTo(0, th);
  ctx.lineTo(0, 190);
  ctx.lineTo(100, 160); ctx.lineTo(200, 185); ctx.lineTo(300, 150);
  ctx.lineTo(400, 175); ctx.lineTo(500, 145); ctx.lineTo(600, 170);
  ctx.lineTo(700, 155); ctx.lineTo(800, 180); ctx.lineTo(900, 160);
  ctx.lineTo(960, 175);
  ctx.lineTo(tw, th);
  ctx.closePath();
  ctx.fill();

  // Snow caps on highest peaks
  ctx.fillStyle = 'rgba(220,230,240,0.25)';
  const peakXs = [180, 300, 420, 540, 660, 780];
  const peakYs = [70, 50, 60, 40, 55, 45];
  for (let i = 0; i < peakXs.length; i++) {
    ctx.beginPath();
    ctx.moveTo(peakXs[i] - 12, peakYs[i] + 10);
    ctx.lineTo(peakXs[i], peakYs[i]);
    ctx.lineTo(peakXs[i] + 12, peakYs[i] + 10);
    ctx.closePath();
    ctx.fill();
  }

  // Cedar tree silhouettes on lower slopes
  ctx.fillStyle = '#0e1a10';
  for (let i = 0; i < 20; i++) {
    const tx = Math.random() * tw;
    const ty = 165 + Math.random() * 60;
    const ts = 4 + Math.random() * 6;
    ctx.beginPath();
    ctx.moveTo(tx, ty - ts * 2);
    ctx.lineTo(tx - ts, ty);
    ctx.lineTo(tx + ts, ty);
    ctx.closePath();
    ctx.fill();
    ctx.fillRect(tx - 1, ty, 2, ts * 0.5);
  }

  // Small village lights
  ctx.fillStyle = 'rgba(255,200,100,0.2)';
  for (let i = 0; i < 8; i++) {
    const vx = 100 + Math.random() * 760;
    const vy = 180 + Math.random() * 40;
    ctx.fillRect(vx, vy, 2, 2);
    ctx.fillRect(vx + 4, vy - 1, 2, 2);
  }

  scene.textures.addCanvas('far_mountains', c);
}

// ── Coast ground (960×120) — Lebanon coast, tileable ─────────
export function createCoastGround(scene) {
  if (scene.textures.exists('coast_ground')) return;

  const tw = W, th = 120;
  const c = document.createElement('canvas');
  c.width = tw; c.height = th;
  const ctx = c.getContext('2d');

  // Ground base
  const grad = ctx.createLinearGradient(0, 0, 0, th);
  grad.addColorStop(0, '#c4a060');  // sandy beach
  grad.addColorStop(0.15, '#a08848');
  grad.addColorStop(0.25, '#5a5550'); // urban
  grad.addColorStop(1, '#3a3834');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, tw, th);

  // Beach sand detail
  ctx.fillStyle = 'rgba(210,185,130,0.2)';
  for (let i = 0; i < 15; i++) {
    ctx.fillRect(Math.random() * tw, Math.random() * 15, 20 + Math.random() * 40, 1.5);
  }

  // Coastal road
  ctx.fillStyle = 'rgba(55,55,60,0.8)';
  ctx.fillRect(0, 16, tw, 5);
  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.lineWidth = 0.5;
  ctx.setLineDash([6, 6]);
  ctx.beginPath(); ctx.moveTo(0, 18.5); ctx.lineTo(tw, 18.5); ctx.stroke();
  ctx.setLineDash([]);

  // Buildings (rectangles with windows, warm sunset light)
  for (let i = 0; i < 40; i++) {
    const bx = Math.random() * tw;
    const bh = 8 + Math.random() * 22;
    const bw = 6 + Math.random() * 14;
    const by = 25 + Math.random() * 20;
    ctx.fillStyle = `hsl(${30 + Math.random() * 20}, ${15 + Math.random() * 10}%, ${35 + Math.random() * 15}%)`;
    ctx.fillRect(bx, by, bw, bh);
    // Sunset light on left edge
    ctx.fillStyle = 'rgba(243,156,18,0.15)';
    ctx.fillRect(bx, by, 2, bh);
    // Windows
    ctx.fillStyle = 'rgba(255,200,80,0.12)';
    for (let wy = 2; wy < bh - 2; wy += 4) {
      for (let wx = 2; wx < bw - 2; wx += 4) {
        ctx.fillRect(bx + wx, by + wy, 2, 2);
      }
    }
  }

  // Palm trees
  for (let i = 0; i < 6; i++) {
    const px = 80 + Math.random() * 800;
    const py = 22;
    ctx.strokeStyle = '#4a3820';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px - 1, py - 18); ctx.stroke();
    // Fronds
    ctx.strokeStyle = '#2a4a1a';
    ctx.lineWidth = 1.5;
    for (let f = 0; f < 5; f++) {
      const a = -Math.PI * 0.8 + f * 0.4;
      ctx.beginPath();
      ctx.moveTo(px - 1, py - 18);
      ctx.quadraticCurveTo(px - 1 + Math.cos(a) * 6, py - 18 + Math.sin(a) * 4, px - 1 + Math.cos(a) * 12, py - 18 + Math.sin(a) * 8);
      ctx.stroke();
    }
  }

  // Mosque dome silhouette
  ctx.fillStyle = '#3a3530';
  ctx.beginPath();
  ctx.arc(450, 26, 8, Math.PI, 0);
  ctx.fillRect(442, 26, 16, 12);
  ctx.fill();
  // Minaret
  ctx.fillRect(468, 14, 3, 24);
  ctx.beginPath(); ctx.arc(469.5, 14, 2, 0, Math.PI * 2); ctx.fill();

  scene.textures.addCanvas('coast_ground', c);
}

// ── Mountain ground (960×120) — Lebanon mountains, tileable ──
export function createMountainGround(scene) {
  if (scene.textures.exists('mountain_ground')) return;

  const tw = W, th = 120;
  const c = document.createElement('canvas');
  c.width = tw; c.height = th;
  const ctx = c.getContext('2d');

  // Green/brown terrain
  const grad = ctx.createLinearGradient(0, 0, 0, th);
  grad.addColorStop(0, '#3a5530');
  grad.addColorStop(0.4, '#2a4020');
  grad.addColorStop(1, '#1a2a15');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, tw, th);

  // Undulating top edge (rocky)
  ctx.fillStyle = '#4a6038';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  for (let x = 0; x <= tw; x += 30) {
    ctx.lineTo(x, 5 + Math.sin(x * 0.02) * 4 + Math.random() * 3);
  }
  ctx.lineTo(tw, 0);
  ctx.closePath();
  ctx.fill();

  // Rocky patches
  ctx.fillStyle = 'rgba(80,70,50,0.3)';
  for (let i = 0; i < 20; i++) {
    ctx.fillRect(Math.random() * tw, Math.random() * th, 5 + Math.random() * 15, 3 + Math.random() * 8);
  }

  // Cedar trees
  ctx.fillStyle = '#1a3012';
  for (let i = 0; i < 15; i++) {
    const tx = Math.random() * tw;
    const ty = 5 + Math.random() * 30;
    const ts = 3 + Math.random() * 5;
    // Triangular tree
    ctx.beginPath();
    ctx.moveTo(tx, ty - ts * 2.5);
    ctx.lineTo(tx - ts, ty);
    ctx.lineTo(tx + ts, ty);
    ctx.closePath();
    ctx.fill();
    ctx.fillRect(tx - 0.5, ty, 1, ts * 0.4);
  }

  // Small mountain village buildings
  ctx.fillStyle = 'rgba(200,180,150,0.3)';
  for (let i = 0; i < 8; i++) {
    const vx = Math.random() * tw;
    const vy = 15 + Math.random() * 25;
    ctx.fillRect(vx, vy, 4 + Math.random() * 6, 3 + Math.random() * 5);
  }

  // Road
  ctx.strokeStyle = 'rgba(100,90,70,0.4)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 50);
  for (let x = 0; x < tw; x += 40) {
    ctx.lineTo(x, 50 + Math.sin(x * 0.01) * 10);
  }
  ctx.stroke();

  scene.textures.addCanvas('mountain_ground', c);
}

// ── Valley ground (960×120) — bombing area floor, tileable ───
export function createValleyGround(scene) {
  if (scene.textures.exists('valley_ground')) return;

  const tw = W, th = 120;
  const c = document.createElement('canvas');
  c.width = tw; c.height = th;
  const ctx = c.getContext('2d');

  // Brown/olive terrain
  const grad = ctx.createLinearGradient(0, 0, 0, th);
  grad.addColorStop(0, '#4a4430');
  grad.addColorStop(0.5, '#3a3828');
  grad.addColorStop(1, '#2a2820');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, tw, th);

  // Rocky/dusty texture
  ctx.fillStyle = 'rgba(70,60,40,0.3)';
  for (let i = 0; i < 50; i++) {
    ctx.fillRect(Math.random() * tw, Math.random() * th, 3 + Math.random() * 10, 2 + Math.random() * 5);
  }

  // Scrub patches
  ctx.fillStyle = 'rgba(50,70,30,0.25)';
  for (let i = 0; i < 12; i++) {
    const sx = Math.random() * tw;
    const sy = Math.random() * th;
    ctx.beginPath();
    ctx.ellipse(sx, sy, 4 + Math.random() * 8, 2 + Math.random() * 3, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Tire tracks / paths
  ctx.strokeStyle = 'rgba(60,55,40,0.3)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, 30); ctx.lineTo(tw, 35);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, 80); ctx.lineTo(tw, 75);
  ctx.stroke();

  scene.textures.addCanvas('valley_ground', c);
}

// ── F-15 silhouette (200×120) — side view for cinematic ──────
export function createF15Silhouette(scene) {
  if (scene.textures.exists('f15_silhouette')) return;

  const sw = 200, sh = 120;
  const c = document.createElement('canvas');
  c.width = sw; c.height = sh;
  const ctx = c.getContext('2d');
  const cy = sh / 2;

  // F-15 side-view silhouette (facing right)
  ctx.fillStyle = '#111111';
  ctx.beginPath();
  ctx.moveTo(190, cy);        // nose tip
  ctx.lineTo(170, cy - 10);
  ctx.lineTo(140, cy - 13);   // cockpit
  ctx.lineTo(100, cy - 14);
  ctx.lineTo(60, cy - 15);    // intake
  ctx.lineTo(30, cy - 18);    // tail rise
  ctx.lineTo(20, cy - 32);    // vertical stabilizer
  ctx.lineTo(15, cy - 34);
  ctx.lineTo(12, cy - 18);
  ctx.lineTo(8, cy - 12);     // engine exit
  ctx.lineTo(8, cy + 8);
  ctx.lineTo(12, cy + 10);
  ctx.lineTo(30, cy + 8);
  ctx.lineTo(50, cy + 12);    // horizontal stabilizer
  ctx.lineTo(38, cy + 22);
  ctx.lineTo(45, cy + 22);
  ctx.lineTo(60, cy + 12);
  ctx.lineTo(100, cy + 8);
  ctx.lineTo(140, cy + 6);
  ctx.lineTo(170, cy + 5);
  ctx.closePath();
  ctx.fill();

  // Wing
  ctx.beginPath();
  ctx.moveTo(130, cy + 6);
  ctx.lineTo(70, cy + 30);
  ctx.lineTo(60, cy + 30);
  ctx.lineTo(80, cy + 8);
  ctx.closePath();
  ctx.fill();

  // Cockpit highlight
  ctx.fillStyle = '#1a3050';
  ctx.beginPath();
  ctx.moveTo(165, cy - 10);
  ctx.lineTo(148, cy - 13);
  ctx.lineTo(150, cy - 9);
  ctx.lineTo(165, cy - 7);
  ctx.closePath();
  ctx.fill();

  // Afterburner glow
  const abGrad = ctx.createRadialGradient(5, cy, 2, 5, cy, 22);
  abGrad.addColorStop(0, 'rgba(255,150,0,0.8)');
  abGrad.addColorStop(0.4, 'rgba(255,100,0,0.4)');
  abGrad.addColorStop(1, 'rgba(255,50,0,0)');
  ctx.fillStyle = abGrad;
  ctx.fillRect(0, cy - 22, 15, 44);

  scene.textures.addCanvas('f15_silhouette', c);
}
