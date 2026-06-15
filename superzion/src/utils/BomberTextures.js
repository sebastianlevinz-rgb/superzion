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

// ── F-15Z side-view sprite (64×32) facing RIGHT — compact & powerful ──
export function createF15SideSprite(scene) {
  if (scene.textures.exists('f15_side')) return;

  const w = 64, h = 32;
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  const cy = h / 2;

  // Dark outline helper
  const outline = (path, color, lw = 1.5) => {
    ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.stroke(path);
  };

  // ── Main fuselage — short, wide, powerful ──
  const fuse = new Path2D();
  fuse.moveTo(61, cy);           // nose tip (short)
  fuse.lineTo(55, cy - 5);      // upper nose
  fuse.lineTo(42, cy - 6);      // canopy area
  fuse.lineTo(24, cy - 5);      // mid top
  fuse.lineTo(10, cy - 4);      // rear top
  fuse.lineTo(5, cy - 3);       // tail connector
  fuse.lineTo(5, cy + 3);       // tail bottom
  fuse.lineTo(10, cy + 4);      // rear bottom
  fuse.lineTo(24, cy + 5);      // mid bottom
  fuse.lineTo(42, cy + 4);      // lower body
  fuse.lineTo(55, cy + 3);      // lower nose
  fuse.closePath();
  ctx.fillStyle = '#7a7a7a';
  ctx.fill(fuse);
  outline(fuse, '#3a3a40', 1.5);

  // Panel lines (detail)
  ctx.strokeStyle = 'rgba(90,90,100,0.5)';
  ctx.lineWidth = 0.5;
  ctx.beginPath(); ctx.moveTo(38, cy - 5); ctx.lineTo(38, cy + 4); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(22, cy - 4); ctx.lineTo(22, cy + 4); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(50, cy - 3); ctx.lineTo(14, cy - 3); ctx.stroke();

  // Fuselage highlight stripe
  ctx.fillStyle = '#8e8e8e';
  ctx.beginPath();
  ctx.moveTo(56, cy - 2);
  ctx.lineTo(46, cy - 4);
  ctx.lineTo(18, cy - 3);
  ctx.lineTo(18, cy - 1);
  ctx.lineTo(46, cy - 1);
  ctx.closePath();
  ctx.fill();

  // ── Nose cone (darker, short) ──
  ctx.fillStyle = '#4a4a52';
  ctx.beginPath();
  ctx.moveTo(61, cy);
  ctx.lineTo(57, cy - 3);
  ctx.lineTo(57, cy + 2);
  ctx.closePath();
  ctx.fill();

  // ── Cockpit canopy (cyan glass bubble) ──
  ctx.fillStyle = '#1a3050';
  ctx.beginPath();
  ctx.moveTo(50, cy - 5);
  ctx.lineTo(44, cy - 9);
  ctx.lineTo(40, cy - 8);
  ctx.lineTo(40, cy - 5);
  ctx.closePath();
  ctx.fill();
  // Glass reflection
  ctx.fillStyle = 'rgba(100,200,255,0.5)';
  ctx.fillRect(47, cy - 8, 2, 2);
  ctx.fillStyle = 'rgba(100,200,255,0.25)';
  ctx.fillRect(44, cy - 7, 3, 1);

  // ── Large swept wings (wide, extending up and down) ──
  ctx.fillStyle = '#6a6a72';
  // Upper wing
  const uwing = new Path2D();
  uwing.moveTo(36, cy - 5);
  uwing.lineTo(24, cy - 14);
  uwing.lineTo(16, cy - 13);
  uwing.lineTo(26, cy - 5);
  uwing.closePath();
  ctx.fill(uwing);
  outline(uwing, '#3a3a40', 1);
  // Lower wing
  const lwing = new Path2D();
  lwing.moveTo(36, cy + 4);
  lwing.lineTo(24, cy + 14);
  lwing.lineTo(16, cy + 13);
  lwing.lineTo(26, cy + 4);
  lwing.closePath();
  ctx.fill(lwing);
  outline(lwing, '#3a3a40', 1);

  // ── Horizontal stabilizers (small rear wings) ──
  ctx.fillStyle = '#5a5a62';
  ctx.beginPath();
  ctx.moveTo(12, cy - 3);
  ctx.lineTo(6, cy - 9);
  ctx.lineTo(3, cy - 8);
  ctx.lineTo(8, cy - 3);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(12, cy + 3);
  ctx.lineTo(6, cy + 9);
  ctx.lineTo(3, cy + 8);
  ctx.lineTo(8, cy + 3);
  ctx.closePath();
  ctx.fill();

  // ── TWO vertical tail fins (F-15 signature twin tails) ──
  ctx.fillStyle = '#5a5a62';
  // Tail 1 (upper)
  const t1 = new Path2D();
  t1.moveTo(10, cy - 3);
  t1.lineTo(4, cy - 11);
  t1.lineTo(2, cy - 10);
  t1.lineTo(6, cy - 3);
  t1.closePath();
  ctx.fill(t1);
  outline(t1, '#3a3a40', 0.8);
  // Tail 2 (lower — mirrored, angled outward)
  const t2 = new Path2D();
  t2.moveTo(10, cy + 3);
  t2.lineTo(4, cy + 11);
  t2.lineTo(2, cy + 10);
  t2.lineTo(6, cy + 3);
  t2.closePath();
  ctx.fill(t2);
  outline(t2, '#3a3a40', 0.8);

  // ── Twin engine nozzles ──
  ctx.fillStyle = '#3a3a42';
  ctx.beginPath(); ctx.arc(6, cy - 1, 2, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(6, cy + 2, 2, 0, Math.PI * 2); ctx.fill();

  // ── Animated-style engine flames ──
  // Outer flame (orange)
  ctx.fillStyle = '#ff9900';
  ctx.beginPath();
  ctx.moveTo(4, cy - 4);
  ctx.lineTo(-4, cy + 0.5);
  ctx.lineTo(4, cy + 5);
  ctx.closePath();
  ctx.fill();
  // Inner flame (hot blue-white)
  ctx.fillStyle = '#4488ff';
  ctx.beginPath();
  ctx.moveTo(4, cy - 1.5);
  ctx.lineTo(0, cy + 0.5);
  ctx.lineTo(4, cy + 2.5);
  ctx.closePath();
  ctx.fill();

  // ── Star of David (gold, small, on fuselage) ──
  _drawMiniStar(ctx, 34, cy, 2.5, '#FFD700');

  // ── Under-wing ordnance (missiles/bombs visible on both wings) ──
  ctx.fillStyle = '#3a3a42';
  // Upper wing missile
  ctx.beginPath();
  ctx.ellipse(27, cy - 11, 4, 1.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#aa2020';
  ctx.beginPath(); ctx.arc(31, cy - 11, 1, 0, Math.PI * 2); ctx.fill(); // warhead tip
  // Lower wing missile
  ctx.fillStyle = '#3a3a42';
  ctx.beginPath();
  ctx.ellipse(27, cy + 11, 4, 1.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#aa2020';
  ctx.beginPath(); ctx.arc(31, cy + 11, 1, 0, Math.PI * 2); ctx.fill();

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

  // Wave patterns — stronger so the band clearly reads as moving water
  for (let y = 0; y < th; y += 6) {
    // Alternate a brighter crest line and a darker trough line
    const crest = (y / 6) % 2 === 0;
    ctx.strokeStyle = crest ? 'rgba(120,200,225,0.22)' : 'rgba(20,50,70,0.20)';
    ctx.lineWidth = crest ? 1.4 : 1.0;
    ctx.beginPath();
    ctx.moveTo(0, y);
    for (let x = 0; x < tw; x += 12) {
      ctx.lineTo(x, y + Math.sin(x * 0.025 + y * 0.1) * 2.5);
    }
    ctx.stroke();
  }

  // Bright specular wave-cap dashes (give the base texture real glints)
  ctx.fillStyle = 'rgba(255,235,170,0.18)';
  for (let i = 0; i < 40; i++) {
    const sx = Math.random() * tw;
    const sy = Math.random() * th;
    ctx.fillRect(sx, sy, 6 + Math.random() * 10, 1.2);
  }

  // Shimmer
  ctx.fillStyle = 'rgba(255,220,100,0.06)';
  for (let i = 0; i < 14; i++) {
    const sx = Math.random() * tw;
    ctx.beginPath();
    ctx.ellipse(sx, 5 + Math.random() * 50, 14, 1.8, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  scene.textures.addCanvas('sea_surface', c);
}

// ── Animated water-shine overlay (960×120) — tileable specular streaks ─
// Layered over the sea band and scrolled/pulsed in update() for live shimmer.
export function createSeaShine(scene) {
  if (scene.textures.exists('sea_shine')) return;

  const tw = W, th = 120;
  const c = document.createElement('canvas');
  c.width = tw; c.height = th;
  const ctx = c.getContext('2d');

  // Transparent base; only draw thin diagonal glints
  ctx.clearRect(0, 0, tw, th);
  ctx.lineCap = 'round';
  for (let i = 0; i < 26; i++) {
    const x = Math.random() * tw;
    const y = Math.random() * th;
    const len = 14 + Math.random() * 36;
    const a = 0.10 + Math.random() * 0.18;
    ctx.strokeStyle = `rgba(255,238,180,${a.toFixed(3)})`;
    ctx.lineWidth = 0.8 + Math.random() * 1.4;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + len, y + (Math.random() - 0.5) * 2);
    ctx.stroke();
  }
  // A few soft golden sun-glints
  for (let i = 0; i < 8; i++) {
    const x = Math.random() * tw;
    const y = Math.random() * th;
    ctx.fillStyle = `rgba(255,210,120,${(0.08 + Math.random() * 0.10).toFixed(3)})`;
    ctx.beginPath();
    ctx.ellipse(x, y, 10 + Math.random() * 14, 1.6, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  scene.textures.addCanvas('sea_shine', c);
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

// ── Turbo Turban Boss (128×128) — Big-headed character with turban ──
export function createTurboTurbanSprite(scene) {
  if (scene.textures.exists('turbo_turban')) return;

  const w = 128, h = 128;
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  const cx = w / 2;

  // ── Dark clerical robe / body (lower half) ──
  ctx.fillStyle = '#1a1a22';
  ctx.beginPath();
  ctx.moveTo(cx - 28, 72);
  ctx.lineTo(cx - 34, 126);
  ctx.lineTo(cx + 34, 126);
  ctx.lineTo(cx + 28, 72);
  ctx.closePath();
  ctx.fill();

  // Robe folds
  ctx.strokeStyle = '#2a2a35';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(cx - 10, 76); ctx.lineTo(cx - 14, 126); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx + 10, 76); ctx.lineTo(cx + 14, 126); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx, 80); ctx.lineTo(cx, 126); ctx.stroke();

  // Robe collar
  ctx.fillStyle = '#2a2a38';
  ctx.beginPath();
  ctx.moveTo(cx - 20, 68);
  ctx.quadraticCurveTo(cx, 78, cx + 20, 68);
  ctx.lineTo(cx + 24, 75);
  ctx.quadraticCurveTo(cx, 86, cx - 24, 75);
  ctx.closePath();
  ctx.fill();

  // ── Arms (slightly out, one raised for "commanding" pose) ──
  // Left arm (resting on console)
  ctx.fillStyle = '#1a1a22';
  ctx.beginPath();
  ctx.moveTo(cx - 28, 76);
  ctx.lineTo(cx - 48, 100);
  ctx.lineTo(cx - 44, 104);
  ctx.lineTo(cx - 26, 82);
  ctx.closePath();
  ctx.fill();
  // Hand
  ctx.fillStyle = '#c4956a';
  ctx.beginPath(); ctx.arc(cx - 48, 102, 4, 0, Math.PI * 2); ctx.fill();

  // Right arm (raised, pointing/commanding)
  ctx.fillStyle = '#1a1a22';
  ctx.beginPath();
  ctx.moveTo(cx + 28, 76);
  ctx.lineTo(cx + 50, 90);
  ctx.lineTo(cx + 48, 94);
  ctx.lineTo(cx + 26, 82);
  ctx.closePath();
  ctx.fill();
  // Hand pointing
  ctx.fillStyle = '#c4956a';
  ctx.beginPath(); ctx.arc(cx + 50, 92, 4, 0, Math.PI * 2); ctx.fill();
  // Pointing finger
  ctx.strokeStyle = '#c4956a';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(cx + 53, 91); ctx.lineTo(cx + 58, 88); ctx.stroke();

  // ── Face (big head — cabezón) ──
  // Head oval (wide)
  ctx.fillStyle = '#c4956a';
  ctx.beginPath();
  ctx.ellipse(cx, 46, 22, 24, 0, 0, Math.PI * 2);
  ctx.fill();

  // ── Prominent nose ──
  ctx.fillStyle = '#b0845a';
  ctx.beginPath();
  ctx.moveTo(cx - 2, 40);
  ctx.lineTo(cx - 5, 52);
  ctx.quadraticCurveTo(cx, 55, cx + 5, 52);
  ctx.lineTo(cx + 2, 40);
  ctx.closePath();
  ctx.fill();

  // ── Small rectangular glasses (very prominent) ──
  ctx.fillStyle = '#111111';
  ctx.strokeStyle = '#444444';
  ctx.lineWidth = 1.5;
  // Left lens
  ctx.fillRect(cx - 16, 38, 12, 8);
  ctx.strokeRect(cx - 16, 38, 12, 8);
  // Right lens
  ctx.fillRect(cx + 4, 38, 12, 8);
  ctx.strokeRect(cx + 4, 38, 12, 8);
  // Bridge
  ctx.strokeStyle = '#444444';
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(cx - 4, 42); ctx.lineTo(cx + 4, 42); ctx.stroke();
  // Temples
  ctx.beginPath(); ctx.moveTo(cx - 16, 40); ctx.lineTo(cx - 22, 38); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx + 16, 40); ctx.lineTo(cx + 22, 38); ctx.stroke();

  // Lens reflection
  ctx.fillStyle = 'rgba(100,150,200,0.3)';
  ctx.fillRect(cx - 14, 39, 3, 2);
  ctx.fillRect(cx + 6, 39, 3, 2);

  // ── Eyes behind glasses (stern, small) ──
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(cx - 13, 40, 6, 4);
  ctx.fillRect(cx + 7, 40, 6, 4);
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(cx - 11, 41, 3, 3);
  ctx.fillRect(cx + 9, 41, 3, 3);

  // ── Stern eyebrows (thick, angry) ──
  ctx.fillStyle = '#3a3a3a';
  ctx.beginPath();
  ctx.moveTo(cx - 17, 37);
  ctx.lineTo(cx - 4, 35);
  ctx.lineTo(cx - 4, 37);
  ctx.lineTo(cx - 17, 38);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(cx + 17, 37);
  ctx.lineTo(cx + 4, 35);
  ctx.lineTo(cx + 4, 37);
  ctx.lineTo(cx + 17, 38);
  ctx.closePath();
  ctx.fill();

  // ── Mouth (stern, small, hidden in beard area) ──
  ctx.fillStyle = '#8a5540';
  ctx.fillRect(cx - 4, 55, 8, 2);

  // ── LONG GRAY/WHITE BEARD (very prominent — covers most of lower face/chest) ──
  // Concave: sides bow outward following jawline, bottom curves downward
  const beardGrad = ctx.createLinearGradient(0, 52, 0, 105);
  beardGrad.addColorStop(0, '#999999');
  beardGrad.addColorStop(0.3, '#aaaaaa');
  beardGrad.addColorStop(0.6, '#cccccc');
  beardGrad.addColorStop(1, '#dddddd');
  ctx.fillStyle = beardGrad;
  ctx.beginPath();
  ctx.moveTo(cx - 18, 50);
  ctx.quadraticCurveTo(cx - 24, 66, cx - 20, 75);
  ctx.quadraticCurveTo(cx - 18, 98, cx - 10, 103);
  ctx.quadraticCurveTo(cx, 108, cx + 10, 103);
  ctx.quadraticCurveTo(cx + 18, 98, cx + 20, 75);
  ctx.quadraticCurveTo(cx + 24, 66, cx + 18, 50);
  ctx.closePath();
  ctx.fill();

  // Beard hair strands (texture)
  ctx.strokeStyle = 'rgba(180,180,180,0.3)';
  ctx.lineWidth = 0.8;
  for (let i = 0; i < 12; i++) {
    const bx = cx - 14 + i * 2.5;
    ctx.beginPath();
    ctx.moveTo(bx, 55);
    ctx.quadraticCurveTo(bx + (Math.random() - 0.5) * 4, 80, bx + (i - 6) * 0.5, 95 + Math.random() * 5);
    ctx.stroke();
  }

  // ── Ears (partially hidden by turban/beard) ──
  ctx.fillStyle = '#b8896a';
  ctx.beginPath(); ctx.ellipse(cx - 22, 44, 4, 6, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(cx + 22, 44, 4, 6, 0, 0, Math.PI * 2); ctx.fill();

  // ── BIG BLACK TURBAN (most prominent feature — sits on top of head) ──
  ctx.fillStyle = '#111111';
  ctx.beginPath();
  ctx.ellipse(cx, 26, 28, 22, 0, 0, Math.PI * 2);
  ctx.fill();

  // Turban wrap layers (concentric ridges)
  ctx.strokeStyle = '#222222';
  ctx.lineWidth = 1.2;
  for (let i = 0; i < 5; i++) {
    const ry = 22 - i * 3;
    const rx = 28 - i * 1.5;
    ctx.beginPath();
    ctx.ellipse(cx, 26 - i * 1, rx, ry, 0, Math.PI * 0.05, Math.PI * 0.95);
    ctx.stroke();
  }

  // Turban fabric wrinkles
  ctx.strokeStyle = '#1a1a1a';
  ctx.lineWidth = 0.6;
  ctx.beginPath(); ctx.moveTo(cx - 20, 18); ctx.quadraticCurveTo(cx, 12, cx + 20, 18); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx - 15, 22); ctx.quadraticCurveTo(cx, 16, cx + 15, 22); ctx.stroke();

  // Turban edge meeting forehead
  ctx.fillStyle = '#111111';
  ctx.beginPath();
  ctx.moveTo(cx - 24, 32);
  ctx.quadraticCurveTo(cx, 28, cx + 24, 32);
  ctx.lineTo(cx + 22, 35);
  ctx.quadraticCurveTo(cx, 31, cx - 22, 35);
  ctx.closePath();
  ctx.fill();

  scene.textures.addCanvas('turbo_turban', c);
}

// ── Turbo Turban yelling frame (128×128) ──
export function createTurboTurbanYelling(scene) {
  if (scene.textures.exists('turbo_turban_yell')) return;

  // Re-draw with open mouth and both arms raised
  const w = 128, h = 128;
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  const cx = w / 2;

  // ── Body (same robe) ──
  ctx.fillStyle = '#1a1a22';
  ctx.beginPath();
  ctx.moveTo(cx - 28, 72);
  ctx.lineTo(cx - 34, 126);
  ctx.lineTo(cx + 34, 126);
  ctx.lineTo(cx + 28, 72);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#2a2a35';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(cx - 10, 76); ctx.lineTo(cx - 14, 126); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx + 10, 76); ctx.lineTo(cx + 14, 126); ctx.stroke();

  // Collar
  ctx.fillStyle = '#2a2a38';
  ctx.beginPath();
  ctx.moveTo(cx - 20, 68);
  ctx.quadraticCurveTo(cx, 78, cx + 20, 68);
  ctx.lineTo(cx + 24, 75);
  ctx.quadraticCurveTo(cx, 86, cx - 24, 75);
  ctx.closePath();
  ctx.fill();

  // Both arms RAISED (yelling/commanding)
  ctx.fillStyle = '#1a1a22';
  // Left arm up
  ctx.beginPath();
  ctx.moveTo(cx - 28, 76);
  ctx.lineTo(cx - 52, 58);
  ctx.lineTo(cx - 48, 54);
  ctx.lineTo(cx - 26, 72);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#c4956a';
  ctx.beginPath(); ctx.arc(cx - 50, 56, 4, 0, Math.PI * 2); ctx.fill();

  // Right arm up
  ctx.fillStyle = '#1a1a22';
  ctx.beginPath();
  ctx.moveTo(cx + 28, 76);
  ctx.lineTo(cx + 52, 58);
  ctx.lineTo(cx + 48, 54);
  ctx.lineTo(cx + 26, 72);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#c4956a';
  ctx.beginPath(); ctx.arc(cx + 50, 56, 4, 0, Math.PI * 2); ctx.fill();
  // Fist
  ctx.fillStyle = '#c4956a';
  ctx.fillRect(cx + 47, 53, 6, 6);

  // ── Face ──
  ctx.fillStyle = '#c4956a';
  ctx.beginPath();
  ctx.ellipse(cx, 46, 22, 24, 0, 0, Math.PI * 2);
  ctx.fill();

  // Nose
  ctx.fillStyle = '#b0845a';
  ctx.beginPath();
  ctx.moveTo(cx - 2, 40);
  ctx.lineTo(cx - 5, 52);
  ctx.quadraticCurveTo(cx, 55, cx + 5, 52);
  ctx.lineTo(cx + 2, 40);
  ctx.closePath();
  ctx.fill();

  // Glasses
  ctx.fillStyle = '#111111';
  ctx.strokeStyle = '#444444';
  ctx.lineWidth = 1.5;
  ctx.fillRect(cx - 16, 38, 12, 8);
  ctx.strokeRect(cx - 16, 38, 12, 8);
  ctx.fillRect(cx + 4, 38, 12, 8);
  ctx.strokeRect(cx + 4, 38, 12, 8);
  ctx.beginPath(); ctx.moveTo(cx - 4, 42); ctx.lineTo(cx + 4, 42); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx - 16, 40); ctx.lineTo(cx - 22, 38); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx + 16, 40); ctx.lineTo(cx + 22, 38); ctx.stroke();
  ctx.fillStyle = 'rgba(100,150,200,0.3)';
  ctx.fillRect(cx - 14, 39, 3, 2);
  ctx.fillRect(cx + 6, 39, 3, 2);

  // Eyes (wider, angrier)
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(cx - 13, 40, 6, 4);
  ctx.fillRect(cx + 7, 40, 6, 4);
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(cx - 11, 41, 3, 3);
  ctx.fillRect(cx + 9, 41, 3, 3);

  // Angry eyebrows (steeper)
  ctx.fillStyle = '#3a3a3a';
  ctx.beginPath();
  ctx.moveTo(cx - 17, 38); ctx.lineTo(cx - 4, 34); ctx.lineTo(cx - 4, 36); ctx.lineTo(cx - 17, 39);
  ctx.closePath(); ctx.fill();
  ctx.beginPath();
  ctx.moveTo(cx + 17, 38); ctx.lineTo(cx + 4, 34); ctx.lineTo(cx + 4, 36); ctx.lineTo(cx + 17, 39);
  ctx.closePath(); ctx.fill();

  // OPEN MOUTH (yelling)
  ctx.fillStyle = '#4a1515';
  ctx.beginPath();
  ctx.ellipse(cx, 57, 7, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  // Teeth
  ctx.fillStyle = '#dddddd';
  ctx.fillRect(cx - 5, 54, 10, 2);

  // Beard (same concave shape as normal pose — sides bow outward, bottom downward)
  const beardGrad = ctx.createLinearGradient(0, 52, 0, 105);
  beardGrad.addColorStop(0, '#999999');
  beardGrad.addColorStop(0.3, '#aaaaaa');
  beardGrad.addColorStop(0.6, '#cccccc');
  beardGrad.addColorStop(1, '#dddddd');
  ctx.fillStyle = beardGrad;
  ctx.beginPath();
  ctx.moveTo(cx - 18, 50);
  ctx.quadraticCurveTo(cx - 24, 66, cx - 20, 75);
  ctx.quadraticCurveTo(cx - 18, 98, cx - 10, 103);
  ctx.quadraticCurveTo(cx, 108, cx + 10, 103);
  ctx.quadraticCurveTo(cx + 18, 98, cx + 20, 75);
  ctx.quadraticCurveTo(cx + 24, 66, cx + 18, 50);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(180,180,180,0.3)';
  ctx.lineWidth = 0.8;
  for (let i = 0; i < 12; i++) {
    const bx = cx - 14 + i * 2.5;
    ctx.beginPath();
    ctx.moveTo(bx, 55);
    ctx.quadraticCurveTo(bx + (Math.random() - 0.5) * 4, 80, bx + (i - 6) * 0.5, 95 + Math.random() * 5);
    ctx.stroke();
  }

  // Ears
  ctx.fillStyle = '#b8896a';
  ctx.beginPath(); ctx.ellipse(cx - 22, 44, 4, 6, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(cx + 22, 44, 4, 6, 0, 0, Math.PI * 2); ctx.fill();

  // Turban
  ctx.fillStyle = '#111111';
  ctx.beginPath();
  ctx.ellipse(cx, 26, 28, 22, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#222222';
  ctx.lineWidth = 1.2;
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.ellipse(cx, 26 - i, 28 - i * 1.5, 22 - i * 3, 0, Math.PI * 0.05, Math.PI * 0.95);
    ctx.stroke();
  }
  ctx.fillStyle = '#111111';
  ctx.beginPath();
  ctx.moveTo(cx - 24, 32);
  ctx.quadraticCurveTo(cx, 28, cx + 24, 32);
  ctx.lineTo(cx + 22, 35);
  ctx.quadraticCurveTo(cx, 31, cx - 22, 35);
  ctx.closePath();
  ctx.fill();

  scene.textures.addCanvas('turbo_turban_yell', c);
}

// ── Mini soldier sprite (16×24) for bunker interior decoration ──
export function createMiniSoldier(scene) {
  if (scene.textures.exists('mini_soldier')) return;

  const w = 16, h = 24;
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  const cx = w / 2;

  // Olive uniform body
  ctx.fillStyle = '#3a4a2a';
  ctx.fillRect(cx - 4, 8, 8, 10);
  // Legs
  ctx.fillRect(cx - 4, 18, 3, 6);
  ctx.fillRect(cx + 1, 18, 3, 6);
  // Head
  ctx.fillStyle = '#c4956a';
  ctx.beginPath(); ctx.arc(cx, 5, 4, 0, Math.PI * 2); ctx.fill();
  // Helmet
  ctx.fillStyle = '#3a4a2a';
  ctx.beginPath(); ctx.arc(cx, 4, 4.5, Math.PI, 0); ctx.fill();
  // Arms
  ctx.fillRect(cx - 6, 9, 2, 7);
  ctx.fillRect(cx + 4, 9, 2, 7);

  scene.textures.addCanvas('mini_soldier', c);
}
