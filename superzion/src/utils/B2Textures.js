// ═══════════════════════════════════════════════════════════════
// B2Textures — Level 5: Operation Mountain Breaker textures
// B-2 Spirit stealth bomber, night sky, Natanz mountain cross-section
// ═══════════════════════════════════════════════════════════════

const W = 960;
const H = 540;

// ── B-2 Spirit side-view sprite (128×48) facing RIGHT ────────
export function createB2SideSprite(scene) {
  if (scene.textures.exists('b2_side')) scene.textures.remove('b2_side');

  const w = 128, h = 48;
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  const cy = h / 2;

  // B-2 flying wing — side view: very flat, wide profile
  // Main wing body (medium gray stealth coating — visible against night sky)
  ctx.fillStyle = '#6a6a6a';
  ctx.beginPath();
  ctx.moveTo(124, cy + 1);       // nose (right, leading edge)
  ctx.lineTo(115, cy - 4);       // upper leading edge
  ctx.lineTo(90, cy - 7);        // upper surface sweep
  ctx.lineTo(60, cy - 9);        // center top (thickest point)
  ctx.lineTo(30, cy - 8);        // trailing edge rise
  ctx.lineTo(10, cy - 5);        // left wing tip top
  ctx.lineTo(4, cy - 2);         // extreme tip
  ctx.lineTo(4, cy + 2);         // extreme tip bottom
  ctx.lineTo(10, cy + 3);        // left wing tip bottom
  ctx.lineTo(25, cy + 2);        // trailing edge notch start
  ctx.lineTo(35, cy + 5);        // W-notch down
  ctx.lineTo(45, cy + 1);        // W-notch center up
  ctx.lineTo(55, cy + 5);        // W-notch down 2
  ctx.lineTo(65, cy + 2);        // W-notch end
  ctx.lineTo(90, cy + 4);        // lower surface
  ctx.lineTo(115, cy + 3);       // lower leading edge
  ctx.closePath();
  ctx.fill();

  // Cyan/white outline for visibility against dark sky
  ctx.strokeStyle = 'rgba(120,200,255,0.5)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Fuselage highlight (lighter stripe on top surface)
  ctx.fillStyle = '#8a8a8a';
  ctx.beginPath();
  ctx.moveTo(115, cy - 3);
  ctx.lineTo(80, cy - 6);
  ctx.lineTo(50, cy - 7);
  ctx.lineTo(30, cy - 6);
  ctx.lineTo(50, cy - 3);
  ctx.lineTo(80, cy - 2);
  ctx.closePath();
  ctx.fill();

  // Engine intake humps (on top of wing — darker)
  ctx.fillStyle = '#404048';
  ctx.beginPath();
  ctx.ellipse(70, cy - 8, 8, 3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(55, cy - 7, 7, 3, 0, 0, Math.PI * 2);
  ctx.fill();

  // Exhaust area (rear of engines)
  ctx.fillStyle = '#353540';
  ctx.beginPath();
  ctx.ellipse(38, cy, 4, 2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(48, cy + 1, 4, 2, 0, 0, Math.PI * 2);
  ctx.fill();

  // Subtle exhaust glow
  ctx.fillStyle = 'rgba(180,120,60,0.15)';
  ctx.beginPath();
  ctx.ellipse(30, cy, 8, 3, 0, 0, Math.PI * 2);
  ctx.fill();

  // Bunker buster bombs hanging below wing (2 large, long bombs)
  ctx.fillStyle = '#5a5a62';
  // Bomb 1
  ctx.beginPath();
  ctx.ellipse(72, cy + 8, 12, 3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#4a4a52';
  ctx.beginPath();
  ctx.moveTo(85, cy + 8);
  ctx.lineTo(82, cy + 6);
  ctx.lineTo(82, cy + 10);
  ctx.closePath();
  ctx.fill();
  // Bomb fins
  ctx.fillStyle = '#6a6a72';
  ctx.fillRect(60, cy + 6, 1, 5);

  // Bomb 2
  ctx.fillStyle = '#5a5a62';
  ctx.beginPath();
  ctx.ellipse(55, cy + 9, 11, 2.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Strong edge highlights (stealth faceting — clearly visible)
  ctx.strokeStyle = 'rgba(138,138,138,0.6)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(124, cy + 1);
  ctx.lineTo(90, cy - 7);
  ctx.lineTo(60, cy - 9);
  ctx.lineTo(30, cy - 8);
  ctx.lineTo(4, cy - 2);
  ctx.stroke();
  // Bottom edge
  ctx.beginPath();
  ctx.moveTo(124, cy + 1);
  ctx.lineTo(90, cy + 4);
  ctx.lineTo(65, cy + 2);
  ctx.stroke();

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

// ── Natanz Mountain cross-section (480×350) ──────────────────
export function createNatanzMountain(scene) {
  if (scene.textures.exists('natanz_mountain')) return;

  const mw = 480, mh = 350;
  const c = document.createElement('canvas');
  c.width = mw; c.height = mh;
  const ctx = c.getContext('2d');

  const cx = mw / 2;

  // Mountain outer silhouette
  ctx.fillStyle = '#1a1818';
  ctx.beginPath();
  ctx.moveTo(0, mh);
  ctx.lineTo(30, mh - 40);
  ctx.lineTo(80, mh - 100);
  ctx.lineTo(140, mh - 200);
  ctx.lineTo(200, mh - 280);
  ctx.lineTo(cx, mh - 310);     // peak
  ctx.lineTo(280, mh - 280);
  ctx.lineTo(340, mh - 200);
  ctx.lineTo(400, mh - 100);
  ctx.lineTo(450, mh - 40);
  ctx.lineTo(mw, mh);
  ctx.closePath();
  ctx.fill();

  // Mountain texture (rocky surface)
  for (let i = 0; i < 100; i++) {
    const rx = 60 + Math.random() * 360;
    const ry = 80 + Math.random() * 240;
    // Only draw if inside mountain silhouette
    const distFromCenter = Math.abs(rx - cx);
    const heightAtX = 310 - (distFromCenter / (mw / 2 - 30)) * 270;
    if (mh - ry < heightAtX) {
      ctx.fillStyle = `rgba(${20 + Math.random() * 15},${18 + Math.random() * 12},${15 + Math.random() * 10},0.5)`;
      ctx.fillRect(rx, ry, 3 + Math.random() * 8, 2 + Math.random() * 4);
    }
  }

  // Internal layers (cross-section view — visible in center)
  const layerX = cx - 60;
  const layerW = 120;
  const layerStartY = mh - 240;
  const layerH = 35;

  // Layer 1: Surface rock/earth (brown)
  ctx.fillStyle = '#4a3a28';
  ctx.fillRect(layerX, layerStartY, layerW, layerH);
  ctx.strokeStyle = '#5a4a38';
  ctx.lineWidth = 0.5;
  ctx.strokeRect(layerX, layerStartY, layerW, layerH);
  // Rock texture
  for (let i = 0; i < 8; i++) {
    ctx.fillStyle = 'rgba(80,60,40,0.4)';
    ctx.fillRect(layerX + Math.random() * layerW, layerStartY + Math.random() * layerH, 4, 2);
  }

  // Layer 2: Solid rock (dark gray)
  ctx.fillStyle = '#3a3a3a';
  ctx.fillRect(layerX, layerStartY + layerH, layerW, layerH);
  ctx.strokeStyle = '#4a4a4a';
  ctx.strokeRect(layerX, layerStartY + layerH, layerW, layerH);

  // Layer 3: Reinforced concrete (gray with grid)
  ctx.fillStyle = '#5a5a5a';
  ctx.fillRect(layerX, layerStartY + layerH * 2, layerW, layerH);
  ctx.strokeStyle = '#6a6a6a';
  ctx.strokeRect(layerX, layerStartY + layerH * 2, layerW, layerH);
  // Rebar grid pattern
  ctx.strokeStyle = 'rgba(100,100,100,0.3)';
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

  // Layer 4: More concrete (slightly darker)
  ctx.fillStyle = '#4a4a4a';
  ctx.fillRect(layerX, layerStartY + layerH * 3, layerW, layerH);
  ctx.strokeStyle = '#5a5a5a';
  ctx.strokeRect(layerX, layerStartY + layerH * 3, layerW, layerH);
  // Rebar
  ctx.strokeStyle = 'rgba(80,80,80,0.3)';
  for (let gx = layerX + 10; gx < layerX + layerW; gx += 15) {
    ctx.beginPath();
    ctx.moveTo(gx, layerStartY + layerH * 3);
    ctx.lineTo(gx, layerStartY + layerH * 4);
    ctx.stroke();
  }

  // Layer 5: Nuclear plant chamber (dark with green/cyan glow)
  ctx.fillStyle = '#1a1a20';
  ctx.fillRect(layerX, layerStartY + layerH * 4, layerW, layerH + 10);
  ctx.strokeStyle = '#2a2a30';
  ctx.lineWidth = 1;
  ctx.strokeRect(layerX, layerStartY + layerH * 4, layerW, layerH + 10);

  // Nuclear glow
  const nucGlow = ctx.createRadialGradient(cx, layerStartY + layerH * 4.5, 5, cx, layerStartY + layerH * 4.5, 50);
  nucGlow.addColorStop(0, 'rgba(0,255,200,0.15)');
  nucGlow.addColorStop(0.5, 'rgba(0,200,180,0.06)');
  nucGlow.addColorStop(1, 'rgba(0,150,130,0)');
  ctx.fillStyle = nucGlow;
  ctx.fillRect(layerX, layerStartY + layerH * 4, layerW, layerH + 10);

  // Centrifuge rows (small cylinders)
  ctx.fillStyle = 'rgba(0,220,180,0.4)';
  const centY = layerStartY + layerH * 4 + 10;
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 8; col++) {
      const centX = layerX + 15 + col * 12;
      const centYr = centY + row * 10;
      ctx.fillRect(centX, centYr, 3, 6);
      // Cyan glow dot
      ctx.fillStyle = 'rgba(0,255,220,0.3)';
      ctx.beginPath();
      ctx.arc(centX + 1.5, centYr + 3, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(0,220,180,0.4)';
    }
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
