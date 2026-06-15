// ═══════════════════════════════════════════════════════════════
// B2Textures — Level 5: Operation Mountain Breaker textures
// B-2 Spirit stealth bomber, night sky, Natanz mountain cross-section
// ═══════════════════════════════════════════════════════════════

const W = 960;
const H = 540;

// ── B-2 Spirit SIDE VIEW sprite (120×40) facing RIGHT ─────────
// Flying wing in profile: extremely wide, razor-thin, no vertical tail
// Boomerang/flying-wing silhouette with serrated trailing edge
export function createB2SideSprite(scene) {
  if (scene.textures.exists('b2_side')) scene.textures.remove('b2_side');

  const w = 120, h = 40;
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  // Center the aircraft in the canvas; nose points right
  const cx = 58, cy = h / 2; // 58, 20

  // ── Helper: full B-2 side-view contour ──
  // Side profile of a flying wing: long horizontal span, very thin
  // Max thickness ~12px at center body, tapering to ~2px at wingtips
  function b2Path() {
    ctx.beginPath();
    // ── Nose (rightmost point) ──
    ctx.moveTo(cx + 52, cy);               // sharp nose tip

    // ── UPPER profile (top surface) — left to right ──
    ctx.lineTo(cx + 48, cy - 1.5);         // nose upper edge
    ctx.lineTo(cx + 40, cy - 3);           // forward fuselage upper
    ctx.lineTo(cx + 30, cy - 4.5);         // cockpit area (flush — no bubble)
    ctx.lineTo(cx + 18, cy - 5.5);         // forward wing root upper
    ctx.lineTo(cx + 6, cy - 6);            // center body — thickest point upper
    ctx.lineTo(cx - 8, cy - 5.5);          // aft center body
    ctx.lineTo(cx - 20, cy - 4.5);         // inner wing upper
    ctx.lineTo(cx - 32, cy - 3.5);         // mid wing upper
    ctx.lineTo(cx - 44, cy - 2.5);         // outer wing upper
    ctx.lineTo(cx - 54, cy - 1.5);         // near wingtip upper
    ctx.lineTo(cx - 60, cy - 1);           // left wingtip (top)

    // ── TRAILING EDGE — serrated sawtooth (stealth feature) ──
    // 5 sawtooth notches along the trailing edge
    ctx.lineTo(cx - 57, cy + 0.5);         // sawtooth 1 down
    ctx.lineTo(cx - 54, cy - 0.5);         // sawtooth 1 up
    ctx.lineTo(cx - 48, cy + 1);           // sawtooth 2 down
    ctx.lineTo(cx - 44, cy - 0.2);         // sawtooth 2 up
    ctx.lineTo(cx - 38, cy + 1.5);         // sawtooth 3 down
    ctx.lineTo(cx - 33, cy + 0.2);         // sawtooth 3 up
    ctx.lineTo(cx - 26, cy + 2);           // sawtooth 4 down
    ctx.lineTo(cx - 22, cy + 0.8);         // sawtooth 4 up
    ctx.lineTo(cx - 16, cy + 3);           // sawtooth 5 down (center trailing area)
    ctx.lineTo(cx - 12, cy + 2);           // center trailing notch

    // ── LOWER profile (bottom surface) — heading right back to nose ──
    ctx.lineTo(cx - 8, cy + 5.5);          // aft center body lower
    ctx.lineTo(cx + 6, cy + 6);            // center body — thickest point lower
    ctx.lineTo(cx + 18, cy + 5.5);         // forward wing root lower
    ctx.lineTo(cx + 30, cy + 4);           // cockpit area lower
    ctx.lineTo(cx + 40, cy + 2.5);         // forward fuselage lower
    ctx.lineTo(cx + 48, cy + 1);           // nose lower edge
    ctx.closePath();
  }

  // ── Drop shadow ──
  ctx.save();
  ctx.translate(2, 3);
  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  b2Path();
  ctx.fill();
  ctx.restore();

  // ── Main body fill — dark charcoal stealth coating (#2a2a30) ──
  ctx.fillStyle = '#2a2a30';
  b2Path();
  ctx.fill();

  // ── Top surface highlight (#3a3a44) — lighter upper half ──
  ctx.save();
  b2Path();
  ctx.clip();
  const topGrad = ctx.createLinearGradient(0, cy - 6, 0, cy);
  topGrad.addColorStop(0, '#3a3a44');
  topGrad.addColorStop(0.4, '#33333c');
  topGrad.addColorStop(1, 'rgba(42,42,48,0)');
  ctx.fillStyle = topGrad;
  ctx.fillRect(0, 0, w, cy);
  ctx.restore();

  // ── Underside shadow — darker lower half ──
  ctx.save();
  b2Path();
  ctx.clip();
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.fillRect(0, cy, w, h);
  ctx.restore();

  // ── Angular stealth facets — subtle panel shade variations ──
  ctx.save();
  b2Path();
  ctx.clip();
  // Forward facet (slightly lighter wedge)
  ctx.fillStyle = 'rgba(70,70,80,0.12)';
  ctx.beginPath();
  ctx.moveTo(cx + 48, cy - 1.5);
  ctx.lineTo(cx + 20, cy - 5);
  ctx.lineTo(cx + 20, cy + 5);
  ctx.lineTo(cx + 48, cy + 1);
  ctx.closePath();
  ctx.fill();
  // Mid-body facet
  ctx.fillStyle = 'rgba(50,50,60,0.10)';
  ctx.beginPath();
  ctx.moveTo(cx + 20, cy - 5);
  ctx.lineTo(cx - 10, cy - 5.5);
  ctx.lineTo(cx - 10, cy + 5.5);
  ctx.lineTo(cx + 20, cy + 5);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // ── Panel lines (very fine) ──
  ctx.save();
  b2Path();
  ctx.clip();
  ctx.strokeStyle = 'rgba(60,60,70,0.30)';
  ctx.lineWidth = 0.4;
  // Horizontal centerline
  ctx.beginPath();
  ctx.moveTo(cx + 50, cy);
  ctx.lineTo(cx - 55, cy);
  ctx.stroke();
  // Upper panel line
  ctx.beginPath();
  ctx.moveTo(cx + 44, cy - 2);
  ctx.lineTo(cx - 50, cy - 1.8);
  ctx.stroke();
  // Lower panel line
  ctx.beginPath();
  ctx.moveTo(cx + 44, cy + 1.8);
  ctx.lineTo(cx - 12, cy + 2.5);
  ctx.stroke();
  // Cross panel lines (chordwise, 3 of them)
  for (const px of [cx + 25, cx + 5, cx - 18]) {
    ctx.beginPath();
    ctx.moveTo(px, cy - 5);
    ctx.lineTo(px, cy + 5);
    ctx.stroke();
  }
  ctx.restore();

  // ── Cockpit (flush with surface — dark slit, not a bubble) ──
  ctx.fillStyle = '#1a1a22';
  ctx.beginPath();
  ctx.moveTo(cx + 38, cy - 2.5);
  ctx.lineTo(cx + 28, cy - 4);
  ctx.lineTo(cx + 24, cy - 3.5);
  ctx.lineTo(cx + 32, cy - 2.2);
  ctx.closePath();
  ctx.fill();
  // Faint glass glint
  ctx.fillStyle = 'rgba(120,160,200,0.15)';
  ctx.beginPath();
  ctx.moveTo(cx + 36, cy - 2.6);
  ctx.lineTo(cx + 30, cy - 3.5);
  ctx.lineTo(cx + 28, cy - 3.2);
  ctx.lineTo(cx + 34, cy - 2.4);
  ctx.closePath();
  ctx.fill();

  // ── Outline — subtle edge glow ──
  b2Path();
  ctx.strokeStyle = 'rgba(140,160,190,0.40)';
  ctx.lineWidth = 0.8;
  ctx.stroke();

  // ── Moonlight edge highlight — upper leading edge only ──
  ctx.strokeStyle = 'rgba(180,200,230,0.50)';
  ctx.lineWidth = 0.7;
  ctx.beginPath();
  ctx.moveTo(cx + 52, cy);
  ctx.lineTo(cx + 48, cy - 1.5);
  ctx.lineTo(cx + 40, cy - 3);
  ctx.lineTo(cx + 30, cy - 4.5);
  ctx.lineTo(cx + 18, cy - 5.5);
  ctx.lineTo(cx + 6, cy - 6);
  ctx.lineTo(cx - 8, cy - 5.5);
  ctx.lineTo(cx - 20, cy - 4.5);
  ctx.lineTo(cx - 32, cy - 3.5);
  ctx.lineTo(cx - 44, cy - 2.5);
  ctx.lineTo(cx - 54, cy - 1.5);
  ctx.lineTo(cx - 60, cy - 1);
  ctx.stroke();

  // ── Engine exhaust glow — faint blue (#0044ff, alpha 0.3) at rear center ──
  // Two engine ports at the aft center area
  const eng1Y = cy - 2, eng2Y = cy + 2;
  const engX = cx - 14;
  for (const ey of [eng1Y, eng2Y]) {
    // Core hot spot
    const core = ctx.createRadialGradient(engX, ey, 0.5, engX, ey, 6);
    core.addColorStop(0, 'rgba(100,160,255,0.30)');
    core.addColorStop(0.4, 'rgba(0,68,255,0.18)');
    core.addColorStop(1, 'rgba(0,68,255,0)');
    ctx.fillStyle = core;
    ctx.fillRect(engX - 6, ey - 6, 12, 12);
  }
  // Wider exhaust plume glow
  const plume = ctx.createRadialGradient(engX - 4, cy, 2, engX - 4, cy, 14);
  plume.addColorStop(0, 'rgba(0,68,255,0.15)');
  plume.addColorStop(0.5, 'rgba(60,120,220,0.06)');
  plume.addColorStop(1, 'rgba(60,120,220,0)');
  ctx.fillStyle = plume;
  ctx.fillRect(engX - 18, cy - 14, 28, 28);

  // ── Faint heat trail extending behind ──
  for (let i = 0; i < 5; i++) {
    const tx = engX - 10 - i * 5;
    const tr = 3 + i * 1.5;
    const ta = 0.08 - i * 0.014;
    const tg = ctx.createRadialGradient(tx, cy, 0, tx, cy, tr);
    tg.addColorStop(0, `rgba(60,120,220,${ta})`);
    tg.addColorStop(1, 'rgba(60,120,220,0)');
    ctx.fillStyle = tg;
    ctx.beginPath();
    ctx.arc(tx, cy, tr, 0, Math.PI * 2);
    ctx.fill();
  }

  // ── Navigation lights (very faint, at wingtip) ──
  ctx.fillStyle = 'rgba(255,60,60,0.18)';
  ctx.beginPath();
  ctx.arc(cx - 59, cy - 0.8, 1, 0, Math.PI * 2);
  ctx.fill();

  scene.textures.addCanvas('b2_side', c);
}

// ── Night sky (960×540) — BEAUTIFUL starry night ─────────────
export function createNightSky(scene) {
  if (scene.textures.exists('night_sky')) return;

  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const ctx = c.getContext('2d');

  // Vertical gradient — deep space black to dark blue at horizon
  const skyGrad = ctx.createLinearGradient(0, 0, 0, H);
  skyGrad.addColorStop(0, '#030308');
  skyGrad.addColorStop(0.15, '#050510');
  skyGrad.addColorStop(0.35, '#080818');
  skyGrad.addColorStop(0.55, '#0a0a20');
  skyGrad.addColorStop(0.75, '#0e0e2a');
  skyGrad.addColorStop(1.0, '#101030');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, W, H);

  // Milky Way — diagonal band of dense faint stars
  ctx.save();
  ctx.translate(W * 0.3, 0);
  ctx.rotate(0.4);
  const mwGrad = ctx.createLinearGradient(-100, 0, 100, 0);
  mwGrad.addColorStop(0, 'rgba(180,180,220,0)');
  mwGrad.addColorStop(0.3, 'rgba(180,180,220,0.015)');
  mwGrad.addColorStop(0.5, 'rgba(200,200,240,0.025)');
  mwGrad.addColorStop(0.7, 'rgba(180,180,220,0.015)');
  mwGrad.addColorStop(1, 'rgba(180,180,220,0)');
  ctx.fillStyle = mwGrad;
  ctx.fillRect(-120, -50, 240, H + 100);
  // Dense star band within milky way
  for (let i = 0; i < 600; i++) {
    const sx = -80 + Math.random() * 160;
    const sy = -30 + Math.random() * (H + 60);
    const br = 0.1 + Math.random() * 0.3;
    ctx.fillStyle = `rgba(220,220,255,${br})`;
    ctx.fillRect(sx, sy, 0.5 + Math.random(), 0.5);
  }
  ctx.restore();

  // Regular stars — thousands at varying brightness
  for (let i = 0; i < 800; i++) {
    const sx = Math.random() * W;
    const sy = Math.random() * (H * 0.7); // mostly in upper sky
    const sr = 0.3 + Math.random() * 1.2;
    const br = 0.15 + Math.random() * 0.7;
    // Star colors: mostly white, some blue, some warm
    const colors = [
      `rgba(255,255,255,${br})`,
      `rgba(200,220,255,${br})`,
      `rgba(255,240,200,${br * 0.8})`,
    ];
    ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
    ctx.beginPath();
    ctx.arc(sx, sy, sr, 0, Math.PI * 2);
    ctx.fill();
  }

  // Bright stars (with subtle glow)
  for (let i = 0; i < 15; i++) {
    const sx = Math.random() * W;
    const sy = Math.random() * (H * 0.5);
    // Glow
    const glowGrad = ctx.createRadialGradient(sx, sy, 0, sx, sy, 6);
    glowGrad.addColorStop(0, 'rgba(255,255,255,0.3)');
    glowGrad.addColorStop(0.5, 'rgba(200,220,255,0.08)');
    glowGrad.addColorStop(1, 'rgba(200,220,255,0)');
    ctx.fillStyle = glowGrad;
    ctx.fillRect(sx - 6, sy - 6, 12, 12);
    // Core
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.beginPath();
    ctx.arc(sx, sy, 1, 0, Math.PI * 2);
    ctx.fill();
  }

  // Crescent moon — upper right
  const moonX = W * 0.78, moonY = H * 0.12;
  // Moon glow
  const moonGlow = ctx.createRadialGradient(moonX, moonY, 5, moonX, moonY, 40);
  moonGlow.addColorStop(0, 'rgba(255,240,200,0.15)');
  moonGlow.addColorStop(0.5, 'rgba(255,220,150,0.04)');
  moonGlow.addColorStop(1, 'rgba(255,200,100,0)');
  ctx.fillStyle = moonGlow;
  ctx.beginPath();
  ctx.arc(moonX, moonY, 40, 0, Math.PI * 2);
  ctx.fill();

  // Moon crescent (draw full circle then cut with dark circle)
  ctx.fillStyle = '#f5e8c0';
  ctx.beginPath();
  ctx.arc(moonX, moonY, 12, 0, Math.PI * 2);
  ctx.fill();
  // Dark circle to create crescent
  ctx.fillStyle = '#050510';
  ctx.beginPath();
  ctx.arc(moonX + 6, moonY - 2, 10, 0, Math.PI * 2);
  ctx.fill();

  scene.textures.addCanvas('night_sky', c);
}

// ── Night cloud layer (960×150) — very subtle dark clouds ────
export function createNightCloudLayer(scene) {
  if (scene.textures.exists('night_cloud_layer')) return;

  const cw = W, ch = 150;
  const c = document.createElement('canvas');
  c.width = cw; c.height = ch;
  const ctx = c.getContext('2d');

  const clouds = [
    { x: 40, y: 50, w: 160, h: 30 },
    { x: 280, y: 80, w: 120, h: 25 },
    { x: 450, y: 40, w: 180, h: 35 },
    { x: 650, y: 90, w: 140, h: 28 },
    { x: 820, y: 55, w: 130, h: 26 },
    { x: 180, y: 110, w: 100, h: 20 },
    { x: 550, y: 120, w: 110, h: 22 },
  ];

  for (const cl of clouds) {
    const grad = ctx.createLinearGradient(cl.x, cl.y - cl.h / 2, cl.x, cl.y + cl.h / 2);
    grad.addColorStop(0, 'rgba(30,30,50,0.12)');
    grad.addColorStop(0.5, 'rgba(20,20,40,0.08)');
    grad.addColorStop(1, 'rgba(15,15,35,0.15)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(cl.x + cl.w / 2, cl.y, cl.w / 2, cl.h / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    // Faint moonlit top edge
    ctx.strokeStyle = 'rgba(100,100,130,0.04)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(cl.x + cl.w / 2, cl.y, cl.w / 2, cl.h / 2, 0, Math.PI, 0);
    ctx.stroke();
  }

  scene.textures.addCanvas('night_cloud_layer', c);
}

// ── Desert night terrain (960×120) — dark desert with few lights ─
export function createDesertNight(scene) {
  if (scene.textures.exists('desert_night')) return;

  const tw = W, th = 120;
  const c = document.createElement('canvas');
  c.width = tw; c.height = th;
  const ctx = c.getContext('2d');

  // Very dark terrain
  const grad = ctx.createLinearGradient(0, 0, 0, th);
  grad.addColorStop(0, '#0c0a08');
  grad.addColorStop(0.3, '#0a0806');
  grad.addColorStop(1, '#060504');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, tw, th);

  // Subtle terrain texture
  for (let i = 0; i < 30; i++) {
    ctx.fillStyle = `rgba(20,16,10,${0.3 + Math.random() * 0.3})`;
    ctx.fillRect(Math.random() * tw, Math.random() * th, 5 + Math.random() * 20, 2);
  }

  // Sparse lights (isolated settlements)
  const lightClusters = [
    { x: 200, y: 20, count: 3 },
    { x: 600, y: 30, count: 4 },
    { x: 850, y: 15, count: 2 },
  ];
  for (const cl of lightClusters) {
    for (let i = 0; i < cl.count; i++) {
      const lx = cl.x + (Math.random() - 0.5) * 30;
      const ly = cl.y + (Math.random() - 0.5) * 10;
      ctx.fillStyle = `rgba(255,${180 + Math.random() * 40},${80 + Math.random() * 40},${0.2 + Math.random() * 0.3})`;
      ctx.fillRect(lx, ly, 2, 1.5);
    }
  }

  // Dim road
  ctx.strokeStyle = 'rgba(40,30,20,0.2)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, 40);
  ctx.lineTo(tw, 35);
  ctx.stroke();

  scene.textures.addCanvas('desert_night', c);
}

// ── City night terrain (960×120) — Iranian cities at night ───
export function createCityNight(scene) {
  if (scene.textures.exists('city_night')) return;

  const tw = W, th = 120;
  const c = document.createElement('canvas');
  c.width = tw; c.height = th;
  const ctx = c.getContext('2d');

  // Dark ground
  const grad = ctx.createLinearGradient(0, 0, 0, th);
  grad.addColorStop(0, '#0e0c08');
  grad.addColorStop(0.3, '#0a0806');
  grad.addColorStop(1, '#060504');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, tw, th);

  // City light clusters (warm glow from above)
  const cities = [
    { x: 100, y: 15, w: 120, count: 40 },
    { x: 350, y: 20, w: 80, count: 25 },
    { x: 550, y: 10, w: 150, count: 50 },
    { x: 800, y: 25, w: 100, count: 30 },
  ];
  for (const city of cities) {
    // City glow halo
    const glowGrad = ctx.createRadialGradient(city.x + city.w / 2, city.y, 10, city.x + city.w / 2, city.y, city.w * 0.7);
    glowGrad.addColorStop(0, 'rgba(255,180,60,0.06)');
    glowGrad.addColorStop(1, 'rgba(255,150,40,0)');
    ctx.fillStyle = glowGrad;
    ctx.fillRect(city.x - 20, city.y - 20, city.w + 40, 50);

    // Individual lights
    for (let i = 0; i < city.count; i++) {
      const lx = city.x + Math.random() * city.w;
      const ly = city.y + (Math.random() - 0.5) * 20;
      const br = 0.2 + Math.random() * 0.5;
      ctx.fillStyle = `rgba(255,${170 + Math.random() * 50},${60 + Math.random() * 40},${br})`;
      ctx.fillRect(lx, ly, 1 + Math.random(), 1);
    }
  }

  // Lit highways (lines of dots)
  ctx.fillStyle = 'rgba(255,200,100,0.15)';
  for (let x = 0; x < tw; x += 8 + Math.random() * 4) {
    const y = 35 + Math.sin(x * 0.01) * 5;
    ctx.fillRect(x, y, 2, 1);
  }

  // Building silhouettes against sky (at top edge)
  ctx.fillStyle = '#080604';
  for (let i = 0; i < 60; i++) {
    const bx = Math.random() * tw;
    const bw = 3 + Math.random() * 8;
    const bh = 2 + Math.random() * 8;
    ctx.fillRect(bx, 0, bw, bh);
  }

  scene.textures.addCanvas('city_night', c);
}

// ── Mountain night terrain (960×120) — dark mountains ────────
export function createMountainNight(scene) {
  if (scene.textures.exists('mountain_night')) return;

  const tw = W, th = 120;
  const c = document.createElement('canvas');
  c.width = tw; c.height = th;
  const ctx = c.getContext('2d');

  // Very dark mountain base
  ctx.fillStyle = '#060608';
  ctx.fillRect(0, 0, tw, th);

  // Mountain profile silhouette at top
  ctx.fillStyle = '#0a0a10';
  ctx.beginPath();
  ctx.moveTo(0, th);
  ctx.lineTo(0, 30);
  ctx.lineTo(60, 15); ctx.lineTo(120, 25); ctx.lineTo(180, 5);
  ctx.lineTo(240, 18); ctx.lineTo(300, 0); ctx.lineTo(360, 12);
  ctx.lineTo(420, 3); ctx.lineTo(480, 20); ctx.lineTo(540, 8);
  ctx.lineTo(600, 15); ctx.lineTo(660, 2); ctx.lineTo(720, 10);
  ctx.lineTo(780, 5); ctx.lineTo(840, 16); ctx.lineTo(900, 8);
  ctx.lineTo(960, 12);
  ctx.lineTo(tw, th);
  ctx.closePath();
  ctx.fill();

  // Military installation lights (red warning lights)
  const miliLights = [
    { x: 200, y: 10 }, { x: 450, y: 15 }, { x: 700, y: 8 }, { x: 880, y: 12 },
  ];
  for (const ml of miliLights) {
    ctx.fillStyle = 'rgba(255,0,0,0.4)';
    ctx.beginPath();
    ctx.arc(ml.x, ml.y, 2, 0, Math.PI * 2);
    ctx.fill();
    // Red glow
    const rGlow = ctx.createRadialGradient(ml.x, ml.y, 0, ml.x, ml.y, 8);
    rGlow.addColorStop(0, 'rgba(255,0,0,0.1)');
    rGlow.addColorStop(1, 'rgba(255,0,0,0)');
    ctx.fillStyle = rGlow;
    ctx.fillRect(ml.x - 8, ml.y - 8, 16, 16);
  }

  // White installation lights
  ctx.fillStyle = 'rgba(255,255,200,0.15)';
  ctx.fillRect(440, 18, 3, 2);
  ctx.fillRect(445, 20, 4, 2);
  ctx.fillRect(695, 12, 5, 2);

  scene.textures.addCanvas('mountain_night', c);
}

// ── Natanz Mountain (480×350) — realistic surface with dimmed internal layers ─
export function createNatanzMountain(scene) {
  if (scene.textures.exists('natanz_mountain')) return;

  const mw = 480, mh = 350;
  const c = document.createElement('canvas');
  c.width = mw; c.height = mh;
  const ctx = c.getContext('2d');
  const cx = mw / 2;

  // Helper: check if point is inside mountain silhouette
  // Asymmetric peak: left slope steeper, right slope gentler
  // Peak near x=220, y=40
  const peakX = 220, peakY = 40;
  function mountainTopY(x) {
    if (x <= 0 || x >= mw) return mh;
    if (x <= peakX) {
      // Left slope (steeper): from base (x=20,y=mh) to peak
      const t = (x - 20) / (peakX - 20);
      if (t < 0) return mh;
      return mh - t * (mh - peakY);
    } else {
      // Right slope (gentler): from peak to base (x=470,y=mh)
      const t = (x - peakX) / (470 - peakX);
      if (t > 1) return mh;
      return peakY + t * (mh - peakY);
    }
  }

  // ── Mountain silhouette fill — rugged ridge with overlapping shapes ──
  // Base gradient: brown-gray mountain body
  const mtnGrad = ctx.createLinearGradient(0, peakY, 0, mh);
  mtnGrad.addColorStop(0, '#3a3428');
  mtnGrad.addColorStop(0.4, '#2a2820');
  mtnGrad.addColorStop(0.7, '#1a1a18');
  mtnGrad.addColorStop(1, '#121210');
  ctx.fillStyle = mtnGrad;

  // Main silhouette — asymmetric with rugged sub-peaks
  ctx.beginPath();
  ctx.moveTo(0, mh);
  ctx.lineTo(20, mh - 10);
  ctx.lineTo(50, mh - 50);
  ctx.lineTo(70, mh - 45);       // small dip
  ctx.lineTo(90, mh - 90);
  ctx.lineTo(110, mh - 85);      // small shoulder
  ctx.lineTo(130, mh - 150);
  ctx.lineTo(150, mh - 190);
  ctx.lineTo(170, mh - 230);
  ctx.lineTo(185, mh - 260);
  ctx.lineTo(200, mh - 290);
  ctx.lineTo(peakX, peakY);      // main peak
  ctx.lineTo(240, mh - 295);     // slight sub-peak
  ctx.lineTo(255, mh - 280);
  ctx.lineTo(270, mh - 260);
  ctx.lineTo(290, mh - 230);
  ctx.lineTo(310, mh - 200);
  ctx.lineTo(330, mh - 170);
  ctx.lineTo(345, mh - 165);     // shoulder
  ctx.lineTo(360, mh - 130);
  ctx.lineTo(380, mh - 100);
  ctx.lineTo(400, mh - 70);
  ctx.lineTo(415, mh - 65);      // small dip
  ctx.lineTo(430, mh - 45);
  ctx.lineTo(450, mh - 25);
  ctx.lineTo(470, mh - 10);
  ctx.lineTo(mw, mh);
  ctx.closePath();
  ctx.fill();

  // ── Moonlight gradient overlay (brighter right-facing slopes) ──
  ctx.save();
  // Re-clip to mountain
  ctx.beginPath();
  ctx.moveTo(0, mh);
  ctx.lineTo(20, mh - 10); ctx.lineTo(50, mh - 50); ctx.lineTo(70, mh - 45);
  ctx.lineTo(90, mh - 90); ctx.lineTo(110, mh - 85); ctx.lineTo(130, mh - 150);
  ctx.lineTo(150, mh - 190); ctx.lineTo(170, mh - 230); ctx.lineTo(185, mh - 260);
  ctx.lineTo(200, mh - 290); ctx.lineTo(peakX, peakY); ctx.lineTo(240, mh - 295);
  ctx.lineTo(255, mh - 280); ctx.lineTo(270, mh - 260); ctx.lineTo(290, mh - 230);
  ctx.lineTo(310, mh - 200); ctx.lineTo(330, mh - 170); ctx.lineTo(345, mh - 165);
  ctx.lineTo(360, mh - 130); ctx.lineTo(380, mh - 100); ctx.lineTo(400, mh - 70);
  ctx.lineTo(415, mh - 65); ctx.lineTo(430, mh - 45); ctx.lineTo(450, mh - 25);
  ctx.lineTo(470, mh - 10); ctx.lineTo(mw, mh);
  ctx.closePath();
  ctx.clip();

  // Moonlight from upper-right: brighter on right half, darker on left
  const moonGrad = ctx.createLinearGradient(0, 0, mw, 0);
  moonGrad.addColorStop(0, 'rgba(0,0,0,0.15)');   // left face darker
  moonGrad.addColorStop(0.45, 'rgba(0,0,0,0)');
  moonGrad.addColorStop(0.7, 'rgba(180,190,210,0.06)'); // right face slightly brighter
  moonGrad.addColorStop(1, 'rgba(180,190,210,0.10)');
  ctx.fillStyle = moonGrad;
  ctx.fillRect(0, 0, mw, mh);

  // ── Rock texture — random rocky patches across surface ──
  for (let i = 0; i < 180; i++) {
    const rx = 30 + Math.random() * 420;
    const ry = 50 + Math.random() * 280;
    if (ry > mountainTopY(rx) + 3) {
      const shade = 20 + Math.random() * 20;
      const alpha = 0.3 + Math.random() * 0.2;
      ctx.fillStyle = `rgba(${shade + 15},${shade + 10},${shade},${alpha})`;
      ctx.fillRect(rx, ry, 3 + Math.random() * 10, 2 + Math.random() * 5);
    }
  }

  // ── Horizontal stratification lines (geological layers on cliff face) ──
  ctx.strokeStyle = 'rgba(80,70,50,0.2)';
  ctx.lineWidth = 0.5;
  for (let sy = 100; sy < mh - 30; sy += 18 + Math.random() * 12) {
    ctx.beginPath();
    const startX = 30 + Math.random() * 30;
    const endX = mw - 30 - Math.random() * 30;
    for (let sx = startX; sx < endX; sx += 8) {
      const topAtX = mountainTopY(sx);
      if (sy > topAtX + 5) {
        if (sx === startX || sy <= mountainTopY(sx - 8) + 5) {
          ctx.moveTo(sx, sy + (Math.random() - 0.5) * 2);
        } else {
          ctx.lineTo(sx, sy + (Math.random() - 0.5) * 2);
        }
      }
    }
    ctx.stroke();
  }

  // ── Exposed rock faces (above tree line, below snow) — lighter gray patches ──
  for (let i = 0; i < 30; i++) {
    const rx = 100 + Math.random() * 280;
    const ry = 60 + Math.random() * 140; // upper portion
    if (ry > mountainTopY(rx) + 8 && ry < mh * 0.55) {
      ctx.fillStyle = `rgba(74,72,64,${0.3 + Math.random() * 0.25})`;
      // Sharp-edged rock faces
      ctx.beginPath();
      const rw = 4 + Math.random() * 12;
      const rh = 3 + Math.random() * 8;
      ctx.moveTo(rx, ry);
      ctx.lineTo(rx + rw, ry + Math.random() * 3);
      ctx.lineTo(rx + rw - 2, ry + rh);
      ctx.lineTo(rx + 1, ry + rh - 1);
      ctx.closePath();
      ctx.fill();

      // Small shadow crevice
      if (Math.random() < 0.5) {
        ctx.strokeStyle = '#0a0a08';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(rx + 1, ry + rh);
        ctx.lineTo(rx + rw - 1, ry + rh + 1);
        ctx.stroke();
      }
    }
  }

  // ── Snow/ice on peak (top ~15%) ──
  const snowLineY = peakY + (mh - peakY) * 0.15; // ~86
  // Snow gradient clipped to mountain
  const snowGrad = ctx.createLinearGradient(0, peakY, 0, snowLineY + 20);
  snowGrad.addColorStop(0, 'rgba(220,230,240,0.35)');
  snowGrad.addColorStop(0.5, 'rgba(220,230,240,0.28)');
  snowGrad.addColorStop(0.8, 'rgba(200,210,220,0.15)');
  snowGrad.addColorStop(1, 'rgba(200,210,220,0)');
  ctx.fillStyle = snowGrad;
  ctx.fillRect(0, peakY - 5, mw, snowLineY - peakY + 25);

  // Bright white edge along peak ridge
  ctx.strokeStyle = 'rgba(240,245,255,0.6)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(185, mh - 260);
  ctx.lineTo(200, mh - 290);
  ctx.lineTo(peakX, peakY);
  ctx.lineTo(240, mh - 295);
  ctx.lineTo(255, mh - 280);
  ctx.stroke();

  // Snow patches (irregular bright areas near peak)
  for (let i = 0; i < 15; i++) {
    const sx = 160 + Math.random() * 130;
    const sy = peakY + Math.random() * 50;
    if (sy > mountainTopY(sx) + 2) {
      ctx.fillStyle = `rgba(230,235,245,${0.15 + Math.random() * 0.15})`;
      ctx.beginPath();
      ctx.ellipse(sx, sy, 3 + Math.random() * 8, 2 + Math.random() * 4, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // ── Vegetation — trees on lower slopes (bottom 40%) ──
  const treeLineY = mh - (mh - peakY) * 0.4; // tree line at ~164
  for (let i = 0; i < 22; i++) {
    const tx = 40 + Math.random() * 400;
    const ty = treeLineY + Math.random() * (mh - treeLineY - 25);
    if (ty > mountainTopY(tx) + 5 && ty < mh - 10) {
      // Small triangular tree (dark green)
      const treeH = 4 + Math.random() * 5;
      const treeW = 3 + Math.random() * 5;
      // Denser at base, sparser higher: skip some higher trees
      if (ty < treeLineY + 40 && Math.random() < 0.4) continue;
      ctx.fillStyle = `rgba(${22 + Math.random() * 8},${42 + Math.random() * 12},${16 + Math.random() * 6},${0.7 + Math.random() * 0.3})`;
      ctx.beginPath();
      ctx.moveTo(tx, ty - treeH);
      ctx.lineTo(tx - treeW / 2, ty);
      ctx.lineTo(tx + treeW / 2, ty);
      ctx.closePath();
      ctx.fill();
      // Trunk
      ctx.fillStyle = 'rgba(40,30,20,0.5)';
      ctx.fillRect(tx - 0.5, ty, 1, 2);
    }
  }

  // Scrub/bush patches between trees
  for (let i = 0; i < 18; i++) {
    const bx = 50 + Math.random() * 380;
    const by = treeLineY + 10 + Math.random() * (mh - treeLineY - 40);
    if (by > mountainTopY(bx) + 5 && by < mh - 8) {
      ctx.fillStyle = `rgba(${18 + Math.random() * 10},${35 + Math.random() * 15},${14 + Math.random() * 8},${0.4 + Math.random() * 0.3})`;
      ctx.beginPath();
      ctx.ellipse(bx, by, 2 + Math.random() * 4, 1.5 + Math.random() * 2, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore(); // end mountain clip

  // ── Internal layers (cross-section: dimmed, same coordinates as scene) ──
  const layerX = cx - 60;
  const layerW = 120;
  const layerStartY = mh - 240;
  const layerH = 35;
  const DIM = 0.35; // dimmer than before so surface detail dominates

  // Layer 1: Surface rock/earth (brown)
  ctx.fillStyle = `rgba(74,58,40,${DIM})`;
  ctx.fillRect(layerX, layerStartY, layerW, layerH);
  ctx.strokeStyle = `rgba(90,74,56,${DIM * 0.8})`;
  ctx.lineWidth = 0.5;
  ctx.strokeRect(layerX, layerStartY, layerW, layerH);

  // Layer 2: Solid rock (dark gray)
  ctx.fillStyle = `rgba(58,58,58,${DIM})`;
  ctx.fillRect(layerX, layerStartY + layerH, layerW, layerH);
  ctx.strokeStyle = `rgba(74,74,74,${DIM * 0.8})`;
  ctx.strokeRect(layerX, layerStartY + layerH, layerW, layerH);

  // Layer 3: Reinforced concrete (gray with grid)
  ctx.fillStyle = `rgba(90,90,90,${DIM})`;
  ctx.fillRect(layerX, layerStartY + layerH * 2, layerW, layerH);
  ctx.strokeStyle = `rgba(106,106,106,${DIM * 0.8})`;
  ctx.strokeRect(layerX, layerStartY + layerH * 2, layerW, layerH);
  // Rebar grid
  ctx.strokeStyle = `rgba(100,100,100,${DIM * 0.5})`;
  ctx.lineWidth = 0.5;
  for (let gx = layerX + 8; gx < layerX + layerW; gx += 12) {
    ctx.beginPath();
    ctx.moveTo(gx, layerStartY + layerH * 2);
    ctx.lineTo(gx, layerStartY + layerH * 3);
    ctx.stroke();
  }
  for (let gy = layerStartY + layerH * 2 + 8; gy < layerStartY + layerH * 3; gy += 10) {
    ctx.beginPath();
    ctx.moveTo(layerX, gy);
    ctx.lineTo(layerX + layerW, gy);
    ctx.stroke();
  }

  // Layer 4: More concrete
  ctx.fillStyle = `rgba(74,74,74,${DIM})`;
  ctx.fillRect(layerX, layerStartY + layerH * 3, layerW, layerH);
  ctx.strokeStyle = `rgba(90,90,90,${DIM * 0.8})`;
  ctx.strokeRect(layerX, layerStartY + layerH * 3, layerW, layerH);
  ctx.strokeStyle = `rgba(80,80,80,${DIM * 0.5})`;
  for (let gx = layerX + 10; gx < layerX + layerW; gx += 15) {
    ctx.beginPath();
    ctx.moveTo(gx, layerStartY + layerH * 3);
    ctx.lineTo(gx, layerStartY + layerH * 4);
    ctx.stroke();
  }

  // Layer 5: Nuclear plant chamber (dark with green/cyan glow)
  ctx.fillStyle = `rgba(26,26,32,${DIM + 0.1})`;
  ctx.fillRect(layerX, layerStartY + layerH * 4, layerW, layerH + 10);
  ctx.strokeStyle = `rgba(42,42,48,${DIM * 0.8})`;
  ctx.lineWidth = 1;
  ctx.strokeRect(layerX, layerStartY + layerH * 4, layerW, layerH + 10);

  // Nuclear glow (dimmed)
  const nucGlow = ctx.createRadialGradient(cx, layerStartY + layerH * 4.5, 5, cx, layerStartY + layerH * 4.5, 50);
  nucGlow.addColorStop(0, `rgba(0,255,200,${0.15 * DIM * 2})`);
  nucGlow.addColorStop(0.5, `rgba(0,200,180,${0.06 * DIM * 2})`);
  nucGlow.addColorStop(1, 'rgba(0,150,130,0)');
  ctx.fillStyle = nucGlow;
  ctx.fillRect(layerX, layerStartY + layerH * 4, layerW, layerH + 10);

  // Centrifuge rows (dimmed)
  const centY = layerStartY + layerH * 4 + 10;
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 8; col++) {
      const centX = layerX + 15 + col * 12;
      const centYr = centY + row * 10;
      ctx.fillStyle = `rgba(0,220,180,${0.4 * DIM})`;
      ctx.fillRect(centX, centYr, 3, 6);
      ctx.fillStyle = `rgba(0,255,220,${0.3 * DIM})`;
      ctx.beginPath();
      ctx.arc(centX + 1.5, centYr + 3, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // ── Tunnel entrance / reinforced blast doors at mountain base ──
  const tunnelX = cx - 30;
  const tunnelY = mh - 55;
  const tunnelW = 60;
  const tunnelH = 35;
  // Recessed entrance cavity (dark shadow)
  ctx.fillStyle = 'rgba(8,8,6,0.9)';
  ctx.beginPath();
  ctx.moveTo(tunnelX + 5, tunnelY);
  ctx.lineTo(tunnelX + tunnelW - 5, tunnelY);
  ctx.lineTo(tunnelX + tunnelW, tunnelY + tunnelH);
  ctx.lineTo(tunnelX, tunnelY + tunnelH);
  ctx.closePath();
  ctx.fill();
  // Reinforced steel blast doors (two halves)
  ctx.fillStyle = 'rgba(60,62,65,0.7)';
  ctx.fillRect(tunnelX + 6, tunnelY + 2, tunnelW / 2 - 7, tunnelH - 4);
  ctx.fillRect(tunnelX + tunnelW / 2 + 1, tunnelY + 2, tunnelW / 2 - 7, tunnelH - 4);
  // Door seam (center crack)
  ctx.strokeStyle = 'rgba(20,20,18,0.8)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(tunnelX + tunnelW / 2, tunnelY + 2);
  ctx.lineTo(tunnelX + tunnelW / 2, tunnelY + tunnelH - 2);
  ctx.stroke();
  // Horizontal reinforcement bars on doors
  ctx.strokeStyle = 'rgba(80,82,85,0.5)';
  ctx.lineWidth = 1;
  for (let by = tunnelY + 8; by < tunnelY + tunnelH - 4; by += 10) {
    ctx.beginPath();
    ctx.moveTo(tunnelX + 8, by);
    ctx.lineTo(tunnelX + tunnelW - 8, by);
    ctx.stroke();
  }
  // Concrete door frame
  ctx.strokeStyle = 'rgba(100,98,90,0.6)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(tunnelX + 4, tunnelY);
  ctx.lineTo(tunnelX + 4, tunnelY + tunnelH);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(tunnelX + tunnelW - 4, tunnelY);
  ctx.lineTo(tunnelX + tunnelW - 4, tunnelY + tunnelH);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(tunnelX + 3, tunnelY + 1);
  ctx.lineTo(tunnelX + tunnelW - 3, tunnelY + 1);
  ctx.stroke();
  // Warning stripes at entrance (yellow/black hazard)
  ctx.fillStyle = 'rgba(180,160,40,0.25)';
  ctx.fillRect(tunnelX + 4, tunnelY + tunnelH - 4, tunnelW - 8, 3);
  // Red warning light above entrance
  ctx.fillStyle = 'rgba(255,0,0,0.5)';
  ctx.beginPath();
  ctx.arc(tunnelX + tunnelW / 2, tunnelY - 4, 2.5, 0, Math.PI * 2);
  ctx.fill();
  const doorGlow = ctx.createRadialGradient(tunnelX + tunnelW / 2, tunnelY - 4, 0, tunnelX + tunnelW / 2, tunnelY - 4, 10);
  doorGlow.addColorStop(0, 'rgba(255,0,0,0.15)');
  doorGlow.addColorStop(1, 'rgba(255,0,0,0)');
  ctx.fillStyle = doorGlow;
  ctx.fillRect(tunnelX + tunnelW / 2 - 10, tunnelY - 14, 20, 20);
  // Access road leading to entrance
  ctx.strokeStyle = 'rgba(50,45,35,0.35)';
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(tunnelX + tunnelW / 2, tunnelY + tunnelH);
  ctx.lineTo(tunnelX + tunnelW / 2 + 40, mh);
  ctx.stroke();

  // ── Antenna / radar dishes on peak ──
  // Large communications antenna near peak
  const antX = peakX + 8, antBaseY = peakY + 15;
  // Antenna mast
  ctx.strokeStyle = 'rgba(120,120,130,0.6)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(antX, antBaseY);
  ctx.lineTo(antX, antBaseY - 20);
  ctx.stroke();
  // Dish (small parabola)
  ctx.strokeStyle = 'rgba(140,140,150,0.5)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(antX + 4, antBaseY - 18, 6, Math.PI * 0.6, Math.PI * 1.4);
  ctx.stroke();
  // Red aviation warning light on top
  ctx.fillStyle = 'rgba(255,30,30,0.6)';
  ctx.beginPath();
  ctx.arc(antX, antBaseY - 21, 1.5, 0, Math.PI * 2);
  ctx.fill();

  // Smaller radar dish on right shoulder
  const rd2X = 300, rd2Y = mountainTopY(300) + 8;
  ctx.strokeStyle = 'rgba(110,110,120,0.5)';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(rd2X, rd2Y);
  ctx.lineTo(rd2X, rd2Y - 12);
  ctx.stroke();
  // Small rotating dish
  ctx.beginPath();
  ctx.ellipse(rd2X, rd2Y - 12, 5, 2, -0.3, 0, Math.PI);
  ctx.stroke();

  // ── Industrial details (ventilation shafts, utility poles) ──
  // Ventilation shaft 1 (rectangular protrusion on slope)
  const ventX = cx + 50, ventBaseY = mountainTopY(cx + 50) + 5;
  ctx.fillStyle = 'rgba(55,55,58,0.5)';
  ctx.fillRect(ventX - 4, ventBaseY - 8, 8, 8);
  ctx.strokeStyle = 'rgba(80,80,85,0.4)';
  ctx.lineWidth = 0.5;
  ctx.strokeRect(ventX - 4, ventBaseY - 8, 8, 8);
  // Grate lines
  ctx.strokeStyle = 'rgba(40,40,42,0.5)';
  for (let gy = ventBaseY - 6; gy < ventBaseY - 1; gy += 2) {
    ctx.beginPath();
    ctx.moveTo(ventX - 3, gy);
    ctx.lineTo(ventX + 3, gy);
    ctx.stroke();
  }

  // Ventilation shaft 2
  const vent2X = cx - 40, vent2BaseY = mountainTopY(cx - 40) + 5;
  ctx.fillStyle = 'rgba(55,55,58,0.5)';
  ctx.fillRect(vent2X - 3, vent2BaseY - 6, 6, 6);
  ctx.strokeStyle = 'rgba(80,80,85,0.4)';
  ctx.strokeRect(vent2X - 3, vent2BaseY - 6, 6, 6);

  // Power lines / utility poles leading to entrance
  const polePositions = [tunnelX - 30, tunnelX - 60, tunnelX - 90];
  for (const px of polePositions) {
    const pBaseY = mountainTopY(px);
    if (pBaseY < mh - 10) {
      ctx.strokeStyle = 'rgba(70,65,55,0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(px, pBaseY + 3);
      ctx.lineTo(px, pBaseY - 10);
      ctx.stroke();
      // Cross-arm
      ctx.beginPath();
      ctx.moveTo(px - 4, pBaseY - 8);
      ctx.lineTo(px + 4, pBaseY - 8);
      ctx.stroke();
    }
  }
  // Power line wires between poles
  ctx.strokeStyle = 'rgba(60,60,55,0.2)';
  ctx.lineWidth = 0.3;
  for (let i = 0; i < polePositions.length - 1; i++) {
    const p1 = polePositions[i], p2 = polePositions[i + 1];
    const p1Y = mountainTopY(p1) - 8, p2Y = mountainTopY(p2) - 8;
    const sagY = Math.max(p1Y, p2Y) + 4; // wire sag
    ctx.beginPath();
    ctx.moveTo(p1, p1Y);
    ctx.quadraticCurveTo((p1 + p2) / 2, sagY, p2, p2Y);
    ctx.stroke();
  }

  // ── Security perimeter fence at base ──
  ctx.strokeStyle = 'rgba(80,80,80,0.25)';
  ctx.lineWidth = 0.5;
  const fenceY = mh - 18;
  ctx.beginPath();
  ctx.moveTo(tunnelX - 80, fenceY);
  ctx.lineTo(tunnelX + tunnelW + 80, fenceY);
  ctx.stroke();
  // Fence posts
  for (let fx = tunnelX - 80; fx <= tunnelX + tunnelW + 80; fx += 15) {
    ctx.beginPath();
    ctx.moveTo(fx, fenceY);
    ctx.lineTo(fx, fenceY - 5);
    ctx.stroke();
  }

  scene.textures.addCanvas('natanz_mountain', c);
}

// ── B-2 silhouette (200×80) — planform view for cinematic ────
export function createB2Silhouette(scene) {
  if (scene.textures.exists('b2_silhouette')) return;

  const sw = 200, sh = 80;
  const c = document.createElement('canvas');
  c.width = sw; c.height = sh;
  const ctx = c.getContext('2d');
  const cx = sw / 2, cy = sh / 2;

  // B-2 planform silhouette (from below — iconic boomerang shape)
  ctx.fillStyle = '#111111';
  ctx.beginPath();
  ctx.moveTo(cx, cy - 6);         // nose center
  ctx.lineTo(cx + 20, cy - 8);    // right forward edge
  ctx.lineTo(cx + 60, cy - 20);   // right wing mid
  ctx.lineTo(cx + 90, cy - 35);   // right wingtip
  ctx.lineTo(cx + 85, cy - 32);   // right wingtip trailing
  ctx.lineTo(cx + 50, cy - 10);   // right trailing edge
  ctx.lineTo(cx + 30, cy);        // right W-notch
  ctx.lineTo(cx + 20, cy + 5);    // right exhaust area
  ctx.lineTo(cx + 10, cy + 3);    // center trailing edge
  ctx.lineTo(cx, cy + 8);         // center notch
  ctx.lineTo(cx - 10, cy + 3);    // left center
  ctx.lineTo(cx - 20, cy + 5);    // left exhaust
  ctx.lineTo(cx - 30, cy);        // left W-notch
  ctx.lineTo(cx - 50, cy - 10);   // left trailing
  ctx.lineTo(cx - 85, cy - 32);   // left wingtip trailing
  ctx.lineTo(cx - 90, cy - 35);   // left wingtip
  ctx.lineTo(cx - 60, cy - 20);   // left wing mid
  ctx.lineTo(cx - 20, cy - 8);    // left forward edge
  ctx.closePath();
  ctx.fill();

  // Subtle engine glow
  const engGlow = ctx.createRadialGradient(cx, cy + 2, 2, cx, cy + 2, 20);
  engGlow.addColorStop(0, 'rgba(200,150,100,0.15)');
  engGlow.addColorStop(1, 'rgba(200,150,100,0)');
  ctx.fillStyle = engGlow;
  ctx.fillRect(cx - 20, cy - 10, 40, 25);

  scene.textures.addCanvas('b2_silhouette', c);
}
